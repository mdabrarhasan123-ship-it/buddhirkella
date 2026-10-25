import { db, auth } from "hatchable";
export const access = "public";
export const methods = ["GET", "POST", "DELETE"];
const clean = v => typeof v === "string" ? v.trim().slice(0,180) : "";
export default async function(req,res){
  try{
    const user=await auth.getUser(req);
    if(!user?.id) return res.status(401).json({error:"Sign in to save and manage your reading list.",login_url:"/login.html?next="+encodeURIComponent(req.query?.next||"/reader.html")});
    const userId=String(user.id);
    if(req.method==="GET"){
      const {rows}=await db.query("SELECT a.slug,a.title,a.excerpt,a.subtitle,a.cover_image,a.published_at,a.reading_minutes,c.name AS category_name FROM reader_bookmarks b JOIN articles a ON a.id=b.article_id LEFT JOIN categories c ON c.id=a.category_id WHERE b.user_id=$1 ORDER BY b.created_at DESC",[userId]);
      return res.json({bookmarks:rows});
    }
    const slug=clean(req.query?.slug||req.body?.slug);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({error:"A valid article slug is required."});
    const {rows:ar}=await db.query("SELECT id FROM articles WHERE slug=$1 AND status='published' AND (published_at IS NULL OR published_at<=NOW()) LIMIT 1",[slug]);
    if(!ar.length) return res.status(404).json({error:"Article not found."});
    const articleId=ar[0].id;
    if(req.method==="POST") await db.query("INSERT INTO reader_bookmarks(user_id,article_id) VALUES($1,$2) ON CONFLICT(user_id,article_id) DO NOTHING",[userId,articleId]);
    else await db.query("DELETE FROM reader_bookmarks WHERE user_id=$1 AND article_id=$2",[userId,articleId]);
    return res.json({ok:true,saved:req.method==="POST"});
  }catch(error){console.error("Bookmark operation failed",error);return res.status(500).json({error:"Reading list is temporarily unavailable."});}
}