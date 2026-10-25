import { db } from "hatchable";
export const access = "public";
export const methods = ["GET", "POST"];
const escape = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
export default async function (req, res) {
  const token = String(req.query?.token || req.body?.token || "").trim().slice(0, 100);
  if (!/^[a-f0-9-]{50,80}$/i.test(token)) return res.status(400).send("<!doctype html><html lang='en'><meta charset='utf-8'><title>Unsubscribe — PATHANTOR</title><body style='font:16px sans-serif;padding:10vw;background:#F5F0E6;color:#24241F'><h1>Invalid unsubscribe link</h1><p>This link is missing or invalid.</p><a href='/'>Return to PATHANTOR</a></body></html>");
  try {
    const { rows } = await db.query("UPDATE newsletter_subscribers SET status='unsubscribed' WHERE unsubscribe_token=$1 AND status <> 'unsubscribed' RETURNING email", [token]);
    const { rows: existing } = rows.length ? { rows } : await db.query("SELECT email FROM newsletter_subscribers WHERE unsubscribe_token=$1 LIMIT 1", [token]);
    const title = rows.length ? "You have been unsubscribed" : existing.length ? "Already unsubscribed" : "Link not found";
    const message = rows.length ? "You will not receive future PATHANTOR newsletter announcements at this address." : existing.length ? "This email address is already unsubscribed." : "This link may have expired or is not valid.";
    res.setHeader("Cache-Control", "no-store");
    return res.send("<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>"+escape(title)+" — PATHANTOR</title><body style='font:16px/1.7 sans-serif;padding:10vw;background:#F5F0E6;color:#24241F;max-width:720px;margin:auto'><p style='color:#8A382F;letter-spacing:.15em;text-transform:uppercase;font-size:11px'>PATHANTOR / NEWSLETTER</p><h1 style='font:42px Georgia,serif'>"+escape(title)+"</h1><p>"+escape(message)+"</p><a href='/' style='color:#8A382F'>Return to the journal ↗</a></body></html>");
  } catch (error) {
    console.error("Newsletter unsubscribe failed", error);
    return res.status(500).send("Unable to process this request right now.");
  }
}