import { db, auth } from "hatchable";
export const access = "public";
export const methods = ["GET", "POST"];
const clean = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";
export default async function (req, res) {
  try {
    if (req.method === "GET") {
      const slug = clean(req.query?.slug, 180);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: "A valid article slug is required." });
      const { rows } = await db.query("SELECT c.id, c.display_name, c.body, c.created_at FROM comments c JOIN articles a ON a.id=c.article_id WHERE a.slug=$1 AND a.status='published' AND c.status='published' ORDER BY c.created_at ASC LIMIT 100", [slug]);
      return res.json({ comments: rows });
    }
    const slug = clean(req.body?.slug, 180);
    const body = clean(req.body?.body, 3000);
    const user = await auth.getUser(req);
    const suppliedName = clean(req.body?.display_name, 80);
    const displayName = user?.id
      ? clean(user.name || user.email?.split("@")[0] || suppliedName || "Reader", 80)
      : suppliedName;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: "Choose a valid article." });
    if (body.length < 2) return res.status(400).json({ error: "Comment-এ অন্তত ২টি character লিখো।" });
    if (displayName.length < 2) return res.status(400).json({ error: "মন্তব্যের সঙ্গে তোমার নামও লিখো।" });
    const { rows: articleRows } = await db.query("SELECT id FROM articles WHERE slug=$1 AND status='published' AND (published_at IS NULL OR published_at<=NOW()) LIMIT 1", [slug]);
    if (!articleRows.length) return res.status(404).json({ error: "Article not found." });
    await db.query("INSERT INTO comments (article_id,user_id,display_name,body,status) VALUES ($1,$2,$3,$4,'pending')", [articleRows[0].id, user?.id ? String(user.id) : null, displayName, body]);
    return res.status(201).json({ ok: true, message: "মন্তব্যটি review-এর জন্য পাঠানো হয়েছে। অনুমোদনের পর প্রকাশিত হবে।" });
  } catch (error) {
    console.error("Comment operation failed", error);
    return res.status(500).json({ error: "Could not process comment." });
  }
}