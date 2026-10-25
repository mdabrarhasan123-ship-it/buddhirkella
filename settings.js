import { db, storage } from "hatchable";
export const access = "public";
export const methods = ["GET"];
const defaults = { brand_name: "বুদ্ধির কেল্লা", brand_latin: "BUDDHIR KELLA", tagline: "একই পৃথিবীকে অন্যভাবে পড়ার চেষ্টা।", logo_url: "", logo_in_header: true, logo_in_tab: true };
export default async function (req, res) {
  try {
    const { rows } = await db.query("SELECT setting_value FROM site_settings WHERE setting_key='site' LIMIT 1");
    const saved = rows[0]?.setting_value || {};
    let logoUrl = "";
    if (saved.logo_ref) {
      if (String(saved.logo_ref).startsWith("storage://")) logoUrl = await storage.urlPermanent(String(saved.logo_ref).slice(10));
      else if (/^https:\/\//i.test(String(saved.logo_ref))) logoUrl = String(saved.logo_ref);
    }
    const ref = String(saved.logo_ref || ''); const ext = ref.split('?')[0].split('.').pop().toLowerCase(); const logo_type = ({png:'image/png',webp:'image/webp',gif:'image/gif',jpg:'image/jpeg',jpeg:'image/jpeg'})[ext] || 'image/png';
    return res.json({ settings: { ...defaults, ...saved, logo_url: logoUrl, logo_type } });
  } catch (error) {
    console.error("Public site settings unavailable", error);
    return res.json({ settings: defaults });
  }
}