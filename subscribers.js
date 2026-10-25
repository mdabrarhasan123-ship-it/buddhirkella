import { db } from "hatchable";
import { requireAdmin } from "lib/admin-session.js";
export const access = "public";
export const methods = ["GET"];
export default async function (req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { rows } = await db.query("SELECT email, status, consent_at, source, created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 1000");
    res.json({ subscribers: rows });
  } catch (error) {
    console.error("Subscriber listing failed", error);
    res.status(500).json({ error: "Subscriber list is temporarily unavailable." });
  }
}