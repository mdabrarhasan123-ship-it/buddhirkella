(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localKey='pathantor-bookmarks';
const readLocal=()=>{try{const v=JSON.parse(localStorage.getItem(localKey)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
const writeLocal=v=>{try{localStorage.setItem(localKey,JSON.stringify(v.slice(-200)))}catch(e){}};
function render(rows,localOnly=false){
 const list=$('#reader-list'),empty=$('#reader-empty'),status=$('#reader-status');
 status.textContent=rows.length?`${rows.length}টি লেখা পাঠতালিকায় আছে।`:'পাঠতালিকা এখন খালি।';
 empty.hidden=rows.length>0;
 list.innerHTML=rows.map(a=>{const slug=a.slug||'',img=a.cover_image||'';return `<article class="reader-item" data-slug="${esc(slug)}">${img?`<a href="/articles/${encodeURIComponent(slug)}"><img src="${esc(img)}" alt="" loading="lazy"></a>`:'<div class="reader-image-placeholder" aria-hidden="true"></div>'}<div><div class="eyebrow">${esc(a.category_name||'প্রবন্ধ')} · ${esc(a.reading_minutes||1)} মিনিট</div><h2><a href="/articles/${encodeURIComponent(slug)}">${esc(a.title||slug)}</a></h2><p>${esc(a.excerpt||a.subtitle||'')}</p><div class="reader-actions"><a href="/articles/${encodeURIComponent(slug)}">লেখাটি পড়ুন ↗</a><button type="button" data-remove="${esc(slug)}">সরিয়ে দিন</button></div></div></article>`}).join('');
 if(localOnly&&rows.length)status.textContent+=' · লগইন করলে তালিকাটি আপনার অ্যাকাউন্টেও সংরক্ষিত থাকবে।';
}
async function init(){
 const status=$('#reader-status');let all=[];
 try{const r=await fetch('/api/articles');const d=await r.json();if(!r.ok)throw Error('লেখার তালিকা লোড করা যায়নি।');all=d.articles||[]}
 catch(e){status.textContent=e.message;$('#reader-empty').hidden=true;return}
 let online=false,rows=[];
 try{const s=await window.hatchable?.auth?.getSession?.();if(s?.user){const r=await fetch('/api/bookmarks');const d=await r.json();if(r.ok){online=true;rows=d.bookmarks||[]}}}catch(e){}
 if(!online){
   const slugs=readLocal().map(x=>typeof x==='string'?x:x?.url||'').map(x=>String(x).replace(/^\/articles\//,'').split(/[?#]/)[0]);
   rows=slugs.map(slug=>all.find(a=>a.slug===slug)).filter(Boolean);
 }
 render(rows,!online);
 $('#reader-list').onclick=async e=>{
   const b=e.target.closest('[data-remove]');if(!b)return;const slug=b.dataset.remove;b.disabled=true;
   try{
     if(online){const r=await fetch('/api/bookmarks?slug='+encodeURIComponent(slug),{method:'DELETE'});const d=await r.json();if(!r.ok)throw Error(d.error||'তালিকা থেকে সরানো যায়নি।');rows=rows.filter(a=>a.slug!==slug);render(rows)}
     else{const next=readLocal().filter(x=>String(typeof x==='string'?x:x?.url||'').replace(/^\/articles\//,'').split(/[?#]/)[0]!==slug);writeLocal(next);const slugs=next.map(x=>String(typeof x==='string'?x:x?.url||'').replace(/^\/articles\//,'').split(/[?#]/)[0]);rows=slugs.map(s=>all.find(a=>a.slug===s)).filter(Boolean);render(rows,true)}
   }catch(err){status.textContent=err.message||'তালিকা থেকে সরানো যায়নি।'}finally{b.disabled=false}
 };
}
init();
})();