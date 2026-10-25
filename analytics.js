import { db } from "hatchable";
import { requireAdmin } from "lib/admin-session.js";
export const access = "public";
export const methods = ["GET"];
export default async function (req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    const [articles, comments, subscribers, views, popular, activity, categoryPerformance, subscriberGrowth] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='published')::int AS published, COUNT(*) FILTER (WHERE status='draft')::int AS drafts, COUNT(*) FILTER (WHERE status='scheduled')::int AS scheduled FROM articles"),
      db.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending')::int AS pending, COUNT(*) FILTER (WHERE status='published')::int AS published FROM comments"),
      db.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='subscribed')::int AS active FROM newsletter_subscribers"),
      db.query("SELECT COUNT(*)::int AS tracked_events, COUNT(*) FILTER (WHERE created_at>NOW()-INTERVAL '30 days')::int AS last_30_days FROM article_events WHERE event_type='view'"),
      db.query("SELECT slug,title,views,published_at FROM articles WHERE status='published' ORDER BY views DESC,published_at DESC NULLS LAST LIMIT 5"),
      db.query("SELECT title,slug,status,updated_at FROM articles ORDER BY updated_at DESC LIMIT 5"),
      db.query("SELECT c.name, COUNT(a.id)::int AS published FROM categories c LEFT JOIN articles a ON a.category_id=c.id AND a.status='published' GROUP BY c.id,c.name ORDER BY published DESC,c.name ASC"),
      db.query("SELECT TO_CHAR(date_trunc('day',created_at),'YYYY-MM-DD') AS day, COUNT(*)::int AS signups FROM newsletter_subscribers WHERE created_at >= NOW() - INTERVAL '29 days' GROUP BY 1 ORDER BY 1")
    ]);
    return res.json({ articles: articles.rows[0], comments: comments.rows[0], subscribers: subscribers.rows[0], views: views.rows[0], popular: popular.rows, recent: activity.rows, category_performance: categoryPerformance.rows, subscriber_growth: subscriberGrowth.rows });
  } catch (error) {
    console.error("Admin analytics failed", error);
    return res.status(500).json({ error: "Editorial analytics are temporarily unavailable." });
  }
}