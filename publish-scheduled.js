import { db } from "hatchable";

export const access = "scheduler";
export const methods = ["POST"];

export default async function (_req, res) {
  try {
    const { rows: due } = await db.query(
      "SELECT id FROM articles WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=NOW() ORDER BY scheduled_at ASC LIMIT 25"
    );
    let published = 0;
    let announcements = 0;
    for (const item of due) {
      const { rows } = await db.query(
        "UPDATE articles SET status='published',published_at=COALESCE(published_at,NOW()),scheduled_at=NULL,updated_at=NOW() WHERE id=$1 AND status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=NOW() RETURNING id,slug,title,excerpt",
        [item.id]
      );
      const article = rows[0];
      if (!article) continue;
      published++;
      const { rows: subs } = await db.query(
        "SELECT COUNT(*)::int AS count FROM newsletter_subscribers WHERE status='subscribed' AND consent_at IS NOT NULL"
      );
      if (!subs[0]?.count) continue;
      const subject = ("New essay from Buddhir Kella: " + article.title).slice(0, 240);
      const { rows: campaign } = await db.query(
        "INSERT INTO newsletter_campaigns (article_id,subject,excerpt,status,created_by) VALUES ($1,$2,$3,'queued','scheduled-publish') RETURNING id",
        [article.id, subject, String(article.excerpt || "").slice(0, 1200)]
      );
      const campaignId = campaign[0]?.id;
      if (!campaignId) continue;
      const inserted = await db.query(
        "INSERT INTO newsletter_deliveries (campaign_id,subscriber_id,status) SELECT $1,id,'queued' FROM newsletter_subscribers WHERE status='subscribed' AND consent_at IS NOT NULL ON CONFLICT (campaign_id,subscriber_id) DO NOTHING",
        [campaignId]
      );
      announcements += inserted.changes || 0;
    }
    return res.json({ checked: due.length, published, announcements_queued: announcements });
  } catch (error) {
    console.error("Scheduled publishing job failed", error);
    return res.status(500).json({ error: "Scheduled publishing job failed." });
  }
}