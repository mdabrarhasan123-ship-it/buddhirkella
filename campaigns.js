import { db, email, admin, config } from "hatchable";
import { requireAdmin } from "lib/admin-session.js";
export const access = "public";
export const methods = ["GET", "POST", "PUT"];
const clean = (v, n = 300) => typeof v === "string" ? v.trim().slice(0, n) : "";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const BASE = "https://commonplace.hatchable.site";
export default async function (req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    if (req.method === "GET") {
      const [campaigns, articles] = await Promise.all([
        db.query("SELECT c.id,c.subject,c.excerpt,c.status,c.created_at,c.sent_at,a.title AS article_title,a.slug AS article_slug,(SELECT COUNT(*)::int FROM newsletter_deliveries d WHERE d.campaign_id=c.id) AS recipients,(SELECT COUNT(*)::int FROM newsletter_deliveries d WHERE d.campaign_id=c.id AND d.status='sent') AS sent,(SELECT COUNT(*)::int FROM newsletter_deliveries d WHERE d.campaign_id=c.id AND d.status='failed') AS failed FROM newsletter_campaigns c JOIN articles a ON a.id=c.article_id ORDER BY c.created_at DESC LIMIT 100"),
        db.query("SELECT id,title,slug,excerpt,cover_image,published_at FROM articles WHERE status='published' AND (published_at IS NULL OR published_at<=NOW()) ORDER BY published_at DESC NULLS LAST LIMIT 200")
      ]);
      return res.json({ campaigns: campaigns.rows, articles: articles.rows, delivery: "Campaign sends use the platform email service. Free-tier recipient allowlists and daily limits may block delivery until email configuration is complete." });
    }
    if (req.method === "POST") {
      const articleId = clean(req.body?.article_id, 60), subject = clean(req.body?.subject, 240);
      if (!articleId || !subject) return res.status(400).json({ error: "Choose a published article and enter an email subject." });
      const { rows: a } = await db.query("SELECT id,title,excerpt FROM articles WHERE id=$1 AND status='published' LIMIT 1", [articleId]);
      if (!a.length) return res.status(400).json({ error: "Only published articles can be used for a newsletter campaign." });
      const excerpt = clean(req.body?.excerpt, 1200) || a[0].excerpt || "";
      const { rows } = await db.query("INSERT INTO newsletter_campaigns (article_id,subject,excerpt,created_by) VALUES ($1,$2,$3,$4) RETURNING id,subject,excerpt,status,created_at", [articleId,subject,excerpt,(await config.get("PATHANTOR_ADMIN_EMAIL").catch(() => "")) || "admin"]);
      return res.status(201).json({ campaign: rows[0] });
    }
    const id = clean(req.body?.id, 60), action = clean(req.body?.action, 30);
    if (!id) return res.status(400).json({ error: "Campaign ID is required." });
    const { rows: campaignRows } = await db.query("SELECT c.id,c.subject,c.excerpt,c.status,a.title AS article_title,a.slug AS article_slug FROM newsletter_campaigns c JOIN articles a ON a.id=c.article_id WHERE c.id=$1 LIMIT 1", [id]);
    if (!campaignRows.length) return res.status(404).json({ error: "Campaign not found." });
    const c = campaignRows[0], articleUrl = BASE + "/articles/" + encodeURIComponent(c.article_slug);
    if (action === "send_test") {
      const profile = { email: await config.get("PATHANTOR_ADMIN_EMAIL").catch(() => "") };
      if (!profile?.email) return res.status(400).json({ error: "The current administrator email is unavailable for a test send." });
      const html = "<div style='font:16px/1.7 Georgia,serif;max-width:640px;margin:auto;color:#24241F;background:#F5F0E6;padding:32px'><p style='font:11px Arial,sans-serif;letter-spacing:2px;color:#8A382F'>PATHANTOR · TEST MESSAGE</p><h1 style='font-weight:normal;font-size:34px;line-height:1.2'>" + esc(c.article_title) + "</h1><p>" + esc(c.excerpt) + "</p><p><a href='" + esc(articleUrl) + "' style='color:#8A382F'>Read the essay ↗</a></p><p style='font:12px Arial,sans-serif;color:#686257'>This is a test sent to the current project administrator. No subscribers were emailed.</p></div>";
      const result = await email.send({ to: profile.email, subject: "[TEST] " + c.subject, html, text: "PATHANTOR TEST\n\n" + c.article_title + "\n\n" + c.excerpt + "\n\nRead: " + articleUrl + "\n\nThis test was sent to the project administrator only." });
      return res.json({ ok: true, message: "Test email accepted by the platform email service.", message_id: result?.message_id || result?.ses_message_id || null });
    }
    if (action === "queue") {
      if (!["draft","failed"].includes(c.status)) return res.status(409).json({ error: "Only draft or failed campaigns can be queued." });
      const { rows: countRows } = await db.query("SELECT COUNT(*)::int AS count FROM newsletter_subscribers WHERE status='subscribed' AND consent_at IS NOT NULL");
      if (!countRows[0]?.count) return res.status(400).json({ error: "There are no eligible subscribers with recorded consent." });
      if (c.status === "failed") await db.query("UPDATE newsletter_deliveries SET status='queued',attempts=0,last_error='',last_attempt_at=NULL WHERE campaign_id=$1 AND status='failed'", [id]);
      await db.query("INSERT INTO newsletter_deliveries (campaign_id,subscriber_id,status) SELECT $1,id,'queued' FROM newsletter_subscribers WHERE status='subscribed' AND consent_at IS NOT NULL ON CONFLICT (campaign_id,subscriber_id) DO NOTHING", [id]);
      const { rows: queued } = await db.query("SELECT COUNT(*)::int AS count FROM newsletter_deliveries WHERE campaign_id=$1 AND status IN ('queued','sending','sent')", [id]);
      if (!queued[0]?.count) return res.status(400).json({ error: "No eligible deliveries could be queued." });
      await db.query("UPDATE newsletter_campaigns SET status='queued',updated_at=NOW(),sent_at=NULL WHERE id=$1", [id]);
      return res.json({ ok: true, queued: queued[0].count, message: "Campaign queued. The background worker sends in small batches; delivery depends on platform email limits and recipient allowlisting." });
    }
    return res.status(400).json({ error: "Supported actions are send_test and queue." });
  } catch (error) {
    console.error("Newsletter campaign operation failed", error);
    return res.status(500).json({ error: "Campaign operation failed. Check email service configuration and campaign data." });
  }
}