import { db } from "hatchable";
import { auth } from "hatchable";

export const access = "public";
export const methods = ["POST"];

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function (req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (req.body?.consent !== true) return res.status(400).json({ error: "Please confirm newsletter consent before subscribing." });
  if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  try {
    const user = await auth.getUser(req);
    const token = crypto.randomUUID() + crypto.randomUUID();
    await db.query(
      "INSERT INTO newsletter_subscribers (email, status, consent_at, source, unsubscribe_token) VALUES ($1, 'subscribed', NOW(), $2, $3) ON CONFLICT (email) DO UPDATE SET status = 'subscribed', consent_at = NOW(), source = EXCLUDED.source, unsubscribe_token = EXCLUDED.unsubscribe_token",
      [email, user ? "website_signed_in" : "website", token]
    );
    res.status(201).json({ ok: true, message: "Your subscription has been saved. New article announcements will be queued for delivery; actual email delivery depends on the platform's sending limits and configuration." });
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    res.status(500).json({ error: "We couldn't save your subscription. Please try again later." });
  }
}