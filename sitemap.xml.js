import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];
const BASE = "https://commonplace.hatchable.site";
const xml = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export default async function (req, res) {
  try {
    const { rows } = await db.query("SELECT slug, updated_at, published_at FROM articles WHERE status='published' AND (published_at IS NULL OR published_at<=NOW()) ORDER BY published_at DESC NULLS LAST LIMIT 5000");
    const urls = [
      { loc: BASE + "/", change: "weekly" },
      { loc: BASE + "/search.html", change: "weekly" },
      ...rows.map(a => ({ loc: BASE + "/articles/" + encodeURIComponent(a.slug), change: "monthly", date: a.updated_at || a.published_at }))
    ];
    const body = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls.map(u => '<url><loc>' + xml(u.loc) + '</loc>' + (u.date ? '<lastmod>' + new Date(u.date).toISOString().slice(0,10) + '</lastmod>' : '') + '<changefreq>' + u.change + '</changefreq></url>').join('') +
      '</urlset>';
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(body);
  } catch (error) {
    console.error("Sitemap generation failed", error);
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}