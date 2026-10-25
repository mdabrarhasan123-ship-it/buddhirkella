import { db, auth } from "hatchable";
export const access = "public";
export const methods = ["GET", "POST", "DELETE"];
const clean = (v, n = 180) => typeof v === "string" ? v.trim().slice(0, n) : "";
const validVisitor = v => /^[A-Za-z0-9_-]{20,80}$/.test(v);
async function counts(articleId, visitor, userId) {
  const { rows: oldLikes } = await db.query("SELECT COUNT(*)::int AS count FROM likes WHERE article_id=$1", [articleId]);
  const { rows: anonymous } = await db.query("SELECT COUNT(*)::int AS count FROM (SELECT DISTINCT ON (visitor_key) visitor_key,event_type FROM article_events WHERE article_id=$1 AND event_type IN ('like','unlike') ORDER BY visitor_key,created_at DESC,id DESC) latest WHERE event_type='like'", [articleId]);
  let liked = false;
  if (userId) {
    const { rows } = await db.query("SELECT id FROM likes WHERE article_id=$1 AND user_id=$2 LIMIT 1", [articleId, userId]);
    liked = rows.length > 0;
  } else if (visitor) {
    const { rows } = await db.query("SELECT event_type FROM article_events WHERE article_id=$1 AND visitor_key=$2 AND event_type IN ('like','unlike') ORDER BY created_at DESC,id DESC LIMIT 1", [articleId, visitor]);
    liked = rows[0]?.event_type === "like";
  }
  return { count: (oldLikes[0]?.count || 0) + (anonymous[0]?.count || 0), liked };
}
export default async function (req, res) {
  const slug = clean(req.query?.slug || req.body?.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: "A valid article slug is required." });
  try {
    const { rows: ar } = await db.query("SELECT id FROM articles WHERE slug=$1 AND status='published' AND (published_at IS NULL OR published_at<=NOW()) LIMIT 1", [slug]);
    if (!ar.length) return res.status(404).json({ error: "Article not found." });
    const articleId = ar[0].id;
    const user = await auth.getUser(req);
    const visitor = clean(req.query?.visitor_key || req.body?.visitor_key, 80);
    if (!user?.id && !validVisitor(visitor)) {
      if (req.method !== "GET") return res.status(400).json({ error: "Could not identify this browser. Refresh and try again." });
    }
    if (req.method === "GET") {
      const state = await counts(articleId, validVisitor(visitor) ? visitor : "", user?.id ? String(user.id) : "");
      return res.json({ ...state, authenticated: !!user?.id });
    }
    if (user?.id) {
      if (req.method === "POST") await db.query("INSERT INTO likes (article_id,user_id) VALUES ($1,$2) ON CONFLICT (article_id,user_id) DO NOTHING", [articleId, String(user.id)]);
      else await db.query("DELETE FROM likes WHERE article_id=$1 AND user_id=$2", [articleId, String(user.id)]);
    } else {
      await db.query("INSERT INTO article_events (article_id,event_type,visitor_key) VALUES ($1,$2,$3)", [articleId, req.method === "POST" ? "like" : "unlike", visitor]);
    }
    const state = await counts(articleId, validVisitor(visitor) ? visitor : "", user?.id ? String(user.id) : "");
    return res.json({ ok: true, ...state, authenticated: !!user?.id });
  } catch (error) {
    console.error("Like operation failed", error);
    return res.status(500).json({ error: "Like state is temporarily unavailable." });
  }
}