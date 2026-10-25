import crypto from "node:crypto";
import { config } from "hatchable";

const COOKIE = "pathantor_admin_session";
const MAX_AGE = 8 * 60 * 60;

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a ?? "")).digest();
  const y = crypto.createHash("sha256").update(String(b ?? "")).digest();
  return crypto.timingSafeEqual(x, y);
}
function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}
function readCookie(req, name) {
  const raw = req.headers?.cookie || "";
  const item = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  if (!item) return "";
  const value = item.slice(name.length + 1);
  // Browser cookies may be malformed or manually edited; an invalid escape must not crash login.
  try { return decodeURIComponent(value); } catch { return value; }
}
export async function hasAdminSession(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const secret = await config.get("PATHANTOR_ADMIN_SESSION_SECRET");
  const parts = token.split(".");
  if (parts.length !== 2 || !secret) return false;
  const [payload, signature] = parts;
  if (!safeEqual(sign(payload, secret), signature)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.exp > Math.floor(Date.now() / 1000) && session.role === "editor";
  } catch { return false; }
}
export async function requireAdmin(req, res) {
  try {
    if (await hasAdminSession(req)) return true;
  } catch (error) {
    if (error?.code !== "setup_required") console.error("Admin session verification failed", error);
  }
  res.status(401).json({ error: "admin_login_required", message: "অ্যাডমিন হিসেবে লগইন করুন।" });
  return false;
}
export async function adminLogin(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) return res.status(400).json({ error: "ইউজারনেম ও পাসওয়ার্ড দিন।" });
  const [expectedUser, expectedPassword, secret] = await Promise.all([
    config.get("PATHANTOR_ADMIN_USERNAME"),
    config.get("PATHANTOR_ADMIN_PASSWORD"),
    config.get("PATHANTOR_ADMIN_SESSION_SECRET")
  ]);
  if (!expectedUser || !expectedPassword || !secret) {
    return res.status(503).json({
      error: "setup_required",
      message: "অ্যাডমিন লগইন চালু করতে Hatchable Setup-এ PATHANTOR_ADMIN_USERNAME, PATHANTOR_ADMIN_PASSWORD এবং PATHANTOR_ADMIN_SESSION_SECRET সেট করুন।"
    });
  }
  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPassword)) {
    return res.status(401).json({ error: "ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।" });
  }
  const payload = Buffer.from(JSON.stringify({ role: "editor", exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  const token = payload + "." + sign(payload, secret);
  res.setHeader("Set-Cookie", COOKIE + "=" + encodeURIComponent(token) + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + MAX_AGE);
  return res.json({ ok: true, expires_in: MAX_AGE });
}
export function adminLogout(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
  return res.json({ ok: true });
}