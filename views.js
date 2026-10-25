import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const clean = (v, n = 180) => typeof v === "string" ? v.trim().slice(0, n) : "";
export default async function (req, res) {
  const slug = clean(req.body?.slug);
  const visitor = clean(req.body?.visitor_key, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !/^[a-zA-Z0-9_-]{20,80}$/.test(visitor)) return res.status(400).json({ error: "A valid article and anonymous visitor key are required." });
  try {
    const { rows: a } = await db.query("SELECT id FROM articles WHERE slug=$1 AND status='published' AND (published_at IS NULL OR published_at<=NOW()) LIMIT 1", [slug]);
    if (!a.length) return res.status(404).json({ error: "Article not found." });
    const { rows } = await db.query("INSERT INTO article_events (article_id,event_type,visitor_key) SELECT $1,'view',$2 WHERE NOT EXISTS (SELECT 1 FROM article_events WHERE article_id=$1 AND event_type='view' AND visitor_key=$2 AND created_at>NOW()-INTERVAL '24 hours') RETURNING id", [a[0].id, visitor]);
    if (rows.length) await db.query("UPDATE articles SET views=views+1 WHERE id=$1", [a[0].id]);
    return res.json({ ok: true, counted: rows.length > 0 });
  } catch (error) {
    console.error("Article view tracking failed", error);
    return res.status(500).json({ error: "View tracking unavailable." });
  }
}