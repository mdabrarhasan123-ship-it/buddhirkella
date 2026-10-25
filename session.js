import { config } from "hatchable";
import { adminLogin, adminLogout, hasAdminSession } from "lib/admin-session.js";

export const access = "public";
export const methods = ["GET", "POST", "DELETE"];

export default async function (req, res) {
  if (req.method === "DELETE") return adminLogout(res);
  if (req.method === "GET") {
    try {
      return res.json({ authenticated: await hasAdminSession(req) });
    } catch (error) {
      if (error?.code === "setup_required") return res.status(503).json({ error: "setup_required", message: "অ্যাডমিন লগইন চালু করতে Hatchable Setup-এ তিনটি PATHANTOR secret সেট করুন।" });
      console.error("Admin session status failed", error);
      return res.status(500).json({ error: "লগইন অবস্থা যাচাই করা যায়নি।" });
    }
  }
  try {
    return await adminLogin(req, res);
  } catch (error) {
    if (error?.code === "setup_required") return res.status(503).json({ error: "setup_required", message: "অ্যাডমিন লগইন চালু করতে Hatchable Setup-এ তিনটি PATHANTOR secret সেট করুন।" });
    console.error("Admin login failed", error);
    return res.status(500).json({ error: "লগইন করা যায়নি।" });
  }
}