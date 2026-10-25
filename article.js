import { db, storage } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const slug = String(req.query?.slug || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return res.status(400).json({ error: "A valid article slug is required." });
  try {
    const { rows } = await db.query(
      "SELECT a.id, a.slug, a.title, a.subtitle, a.excerpt, a.body_html, a.cover_image, a.license, a.published_at, a.reading_minutes, a.featured, a.author_name, a.seo_title, a.seo_description, a.tags, c.name AS category_name, c.slug AS category_slug FROM articles a LEFT JOIN categories c ON c.id = a.category_id WHERE a.slug = $1 AND a.status = 'published' AND (a.published_at IS NULL OR a.published_at <= NOW()) LIMIT 1",
      [slug]
    );
    if (!rows.length) return res.status(404).json({ error: "Article not found." });
    // Storage URLs expire; mint a fresh URL whenever the article is requested.
    const article = rows[0];
    if (article.cover_image?.startsWith("storage://")) article.cover_image = await storage.url(article.cover_image.slice(10)); else if (!article.cover_image) article.cover_image = "/covers/auto-editorial.svg";
    res.json({ article });
  } catch (error) {
    console.error("Article detail failed", error);
    res.status(500).json({ error: "This article is temporarily unavailable." });
  }
}