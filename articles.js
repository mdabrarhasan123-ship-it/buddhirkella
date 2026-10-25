import { db, storage } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  try {
    const { rows } = await db.query(
      "SELECT a.id, a.slug, a.title, a.subtitle, a.excerpt, a.cover_image, a.license, a.published_at, a.reading_minutes, a.featured, a.author_name, a.tags, LEFT(regexp_replace(a.body_html, '<[^>]*>', ' ', 'g'), 5000) AS search_text, c.name AS category_name, c.slug AS category_slug FROM articles a LEFT JOIN categories c ON c.id = a.category_id WHERE a.status = 'published' AND (a.published_at IS NULL OR a.published_at <= NOW()) ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC LIMIT 60"
    );
    const articles = await Promise.all(rows.map(async article => ({ ...article, cover_image: article.cover_image?.startsWith("storage://") ? await storage.url(article.cover_image.slice(10)) : (article.cover_image || "/covers/auto-editorial.svg") })));
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json({ articles });
  } catch (error) {
    console.error("Public article listing failed", error);
    res.status(500).json({ error: "The article archive is temporarily unavailable." });
  }
}