import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  try {
    const { rows } = await db.query(
      "SELECT c.id, c.name, c.slug, c.description, COUNT(a.id)::int AS article_count FROM categories c LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published' AND (a.published_at IS NULL OR a.published_at <= NOW()) WHERE c.is_active = TRUE GROUP BY c.id ORDER BY c.name ASC"
    );
    res.json({ categories: rows });
  } catch (error) {
    console.error("Category listing failed", error);
    res.status(500).json({ error: "Categories are temporarily unavailable." });
  }
}