import { db } from "hatchable";
import { requireAdmin } from "lib/admin-session.js";
export const access = "public";
export const methods = ["GET"];
export default async function (req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    const { rows } = await db.query("SELECT COUNT(*)::int AS count FROM newsletter_subscribers WHERE status = 'subscribed'");
    res.json({ count: rows[0]?.count ?? 0 });
  } catch (error) {
    console.error("Subscriber count failed", error);
    res.status(500).json({ error: "Subscriber count is temporarily unavailable." });
  }
}