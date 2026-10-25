(()=>{'use strict';
const root=document.getElementById('featurecard');
if(!root)return;
const mq=window.matchMedia('(max-width:699px)');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let track=null,raf=0,last=0,offset=0,speed=0,target=24,paused=false,releaseAt=0,originalWidth=0,clonesMade=false;
const css=`
@media(max-width:699px){
.hero-feature{overflow:hidden}
#featurecard.bk-feature-carousel{overflow:hidden!important;width:100%;padding:0;background:transparent}
#featurecard .bk-feature-track{display:flex!important;grid-auto-flow:unset!important;grid-auto-columns:unset!important;gap:14px!important;width:max-content!important;max-width:none!important;overflow:visible!important;scroll-snap-type:none!important;scroll-behavior:auto!important;scrollbar-width:none!important;padding:2px 2px 12px!important;transform:translate3d(0,0,0);will-change:transform;touch-action:pan-y}
#featurecard .bk-feature-slide{display:grid!important;flex:0 0 min(82vw,340px)!important;width:min(82vw,340px)!important;min-width:min(82vw,340px)!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:155px auto!important;gap:0!important;min-height:0!important;height:auto!important;scroll-snap-align:none!important;scroll-snap-stop:normal!important}
#featurecard .bk-feature-slide .feature-image{height:155px!important;min-height:0!important;aspect-ratio:auto!important}
#featurecard .bk-feature-slide .feature-copy{padding:15px 15px 18px!important;min-width:0}
#featurecard .bk-feature-slide .feature-copy h2{font-size:21px!important;line-height:1.35!important;margin:8px 0 10px!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#featurecard .bk-feature-slide .feature-copy p{font-size:13px!important;line-height:1.7!important;margin:8px 0 12px!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
#featurecard .bk-carousel-controls{display:none!important}
#featurecard .bk-feature-slide .feature-copy .meta{margin:10px 0!important}
}
`;
function addStyles(){if(document.getElementById('mobile-featured-style'))return;const s=document.createElement('style');s.id='mobile-featured-style';s.textContent=css;document.head.appendChild(s)}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
function setup(){
 if(!mq.matches||reduced.matches||!root.classList.contains('bk-feature-carousel')){stop();if(track&&clonesMade){track._cleanup?.();Array.from(track.children).slice(track._originalCount||0).forEach(n=>n.remove());track.style.transform='';track.style.width='';track=null;clonesMade=false;originalWidth=0}return}
 const next=root.querySelector('.bk-feature-track');if(!next)return;
 if(track===next&&clonesMade)return;
 stop();track=next;clonesMade=false;offset=0;speed=0;paused=false;
 track.style.transform='translate3d(0,0,0)';track._originalCount=track.children.length;
 Array.from(track.children).forEach(s=>{const c=s.cloneNode(true);c.setAttribute('aria-hidden','true');c.querySelectorAll('a,button,input,select,textarea').forEach(el=>{el.setAttribute('tabindex','-1')});track.appendChild(c)});
 clonesMade=true;
 requestAnimationFrame(()=>{if(!track)return;originalWidth=track.scrollWidth/2;const onDown=e=>{paused=true;speed=0;releaseAt=0};const onUp=()=>{paused=false;releaseAt=performance.now()};track.addEventListener('pointerdown',onDown,{passive:true});window.addEventListener('pointerup',onUp,{passive:true});window.addEventListener('pointercancel',onUp,{passive:true});track.addEventListener('touchstart',onDown,{passive:true});window.addEventListener('touchend',onUp,{passive:true});track.addEventListener('touchcancel',onUp,{passive:true});track.addEventListener('mouseenter',onDown);track.addEventListener('mouseleave',onUp);track.addEventListener('focusin',onDown);track.addEventListener('focusout',onUp);
 track._cleanup=()=>{track.removeEventListener('pointerdown',onDown);window.removeEventListener('pointerup',onUp);window.removeEventListener('pointercancel',onUp);track.removeEventListener('touchstart',onDown);window.removeEventListener('touchend',onUp);track.removeEventListener('touchcancel',onUp);track.removeEventListener('mouseenter',onDown);track.removeEventListener('mouseleave',onUp);track.removeEventListener('focusin',onDown);track.removeEventListener('focusout',onUp)};
 raf=requestAnimationFrame(tick)});
}
function tick(now){raf=0;if(!track||!mq.matches||reduced.matches||!originalWidth)return;
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(!paused){const ramp=releaseAt?Math.min(1,(now-releaseAt)/850):1;speed=target*ramp;offset+=speed*dt;if(ramp>=1)releaseAt=0}
 if(offset>=originalWidth)offset-=originalWidth;
 track.style.transform='translate3d('+(-offset)+'px,0,0)';track.style.pointerEvents='auto';
 raf=requestAnimationFrame(tick)
}
addStyles();
const mo=new MutationObserver(()=>{if(!mq.matches)return;setup()});mo.observe(root,{childList:true,subtree:true});
if(mq.addEventListener)mq.addEventListener('change',setup);else mq.addListener(setup);
if(reduced.addEventListener)reduced.addEventListener('change',setup);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.addEventListener('resize',()=>{if(!mq.matches)setup();else setup()},{passive:true});
})();