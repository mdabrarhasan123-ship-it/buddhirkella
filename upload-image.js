import { storage } from "hatchable";
import crypto from "node:crypto";
import { requireAdmin } from "lib/admin-session.js";

export const access = "public";
export const methods = ["POST"];
const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif"]);

function isImage(buffer, type) {
  if (!buffer || buffer.length < 12) return false;
  if (type === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/gif") return buffer.subarray(0,6).toString("ascii").startsWith("GIF8");
  if (type === "image/webp") return buffer.subarray(0,4).toString("ascii") === "RIFF" && buffer.subarray(8,12).toString("ascii") === "WEBP";
  return false;
}

export default async function (req, res) {
  if (!(await requireAdmin(req, res))) return;
  const file = (req.files || []).find(f => f.field === "file");
  if (!file) return res.status(400).json({ error: "ছবির ফাইলটি নির্বাচন করুন।" });
  if (!allowed.has(file.contentType) || !isImage(file.buffer, file.contentType)) {
    return res.status(415).json({ error: "JPG, PNG, WEBP অথবা GIF ছবি আপলোড করুন।" });
  }
  if (file.buffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: "ছবির আকার সর্বোচ্চ ৮ MB হতে পারবে।" });
  const ext = ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/gif":"gif" })[file.contentType];
  const key = "pathantor-images/" + crypto.randomUUID() + "." + ext;
  try {
    const url = await storage.put(key, file.buffer, file.contentType);
    return res.json({ key, cover_image: "storage://" + key, preview_url: url, message: "ছবি আপলোড হয়েছে। আর্টিকেল সেভ করলে ছবির রেফারেন্সও সংরক্ষিত হবে।" });
  } catch (error) {
    console.error("Editorial image upload failed", error);
    return res.status(500).json({ error: "ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।" });
  }
}