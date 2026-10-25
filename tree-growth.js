(()=>{'use strict';
const stage=document.querySelector('.bk-tree-stage');if(!stage||stage.dataset.initialized)return;stage.dataset.initialized='1';
const canvas=document.createElement('canvas');canvas.className='bk-tree-canvas';canvas.setAttribute('aria-hidden','true');stage.append(canvas);
const fallback=document.createElement('div');fallback.className='bk-tree-fallback';fallback.textContent='একটি ভাবনা, ধীরে ধীরে শিকড় ছড়ায়।';stage.append(fallback);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function start(){
 if(!window.THREE){fallback.textContent='একটি ভাবনা, ধীরে ধীরে শিকড় ছড়ায়।';return}
 const T=window.THREE,scene=new T.Scene();scene.background=null;
 const camera=new T.PerspectiveCamera(34,1,.1,100);camera.position.set(0,3.15,10.5);camera.lookAt(0,2.65,0);
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 if('outputColorSpace' in renderer)renderer.outputColorSpace=T.SRGBColorSpace;
 scene.add(new T.HemisphereLight(0xf8f1df,0x565044,2.0));
 const key=new T.DirectionalLight(0xfff1d5,3.0);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
 const rim=new T.DirectionalLight(0xb5bf83,2.0);rim.position.set(4,5,-4);scene.add(rim);
 const tree=new T.Group();scene.add(tree);tree.position.x=-3.05;tree.scale.setScalar(.76);
 // Fortress architecture: layered stone gate, towers, battlements and a recessed entrance.
 const fortress=new T.Group();scene.add(fortress);fortress.scale.setScalar(1.18);
 const stone=new T.MeshStandardMaterial({color:0x938a78,roughness:.94}),stoneLight=new T.MeshStandardMaterial({color:0xb4a994,roughness:.92}),stoneDark=new T.MeshStandardMaterial({color:0x625d54,roughness:1}),gateMat=new T.MeshStandardMaterial({color:0x352d27,roughness:.95}),woodMat=new T.MeshStandardMaterial({color:0x60452f,roughness:.9});
 function block(parent,x,y,z,w,h,d,mat,bevel=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function cylinder(parent,x,y,z,rt,rb,h,mat,segments=16){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 // A broad stone plinth anchors the gatehouse and both guards to the ground.
 block(fortress,0,.02,.18,5.25,.16,2.35,stoneDark);block(fortress,0,.115,.18,4.95,.06,2.12,stoneLight);
 // Thick gatehouse walls and towers.
 block(fortress,0,1.45,0,2.7,2.9,.72,stone);block(fortress,0,1.45,.39,1.28,2.45,.16,gateMat);
 for(const x of [-1.82,1.82]){cylinder(fortress,x,2.05,0,.67,.76,4.1,stone,20);cylinder(fortress,x,4.18,0,.73,.73,.22,stoneLight,20);cylinder(fortress,x,4.38,0,.55,.58,.22,stoneDark,20);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;block(fortress,x+Math.cos(a)*.54,4.58,Math.sin(a)*.54,.22,.36,.22,stoneLight)}}
 // Layered voussoirs imply a real arched stone entrance.
 for(let i=0;i<9;i++){const a=Math.PI*(i/8);const m=block(fortress,Math.cos(a)*.67,2.48+Math.sin(a)*.73,.5,.24,.25,.25,i%2?stoneLight:stone);m.rotation.z=-a+Math.PI/2}
 block(fortress,0,.13,.08,4.45,.22,1.6,stoneDark);block(fortress,0,.26,.02,2.9,.1,1.1,stoneLight);
 for(let row=0;row<4;row++){for(let x=-1.2;x<=1.21;x+=.48){if(Math.abs(x)<.7&&row>1)continue;block(fortress,x,.52+row*.47,-.405,.43,.42,.12,(row+Math.round(x*10))%2?stoneLight:stone)}}
 // Two low-poly guards with crossed arms, helmets and wine-coloured sashes.
 const guardGroups=[],guardParts=[];
 const armor=new T.MeshStandardMaterial({color:0x5e6258,metalness:.22,roughness:.72}),armorLight=new T.MeshStandardMaterial({color:0x9c927d,metalness:.16,roughness:.76}),skin=new T.MeshStandardMaterial({color:0xb58b69,roughness:.9}),sash=new T.MeshStandardMaterial({color:0x713d3b,roughness:.86});
 function makeGuard(x,flip){const g=new T.Group();g.position.set(x,.18,.95);g.rotation.y=flip?-.12:.12;fortress.add(g);guardGroups.push({g,phase:flip?2.1:0,baseX:x});
 cylinder(g,0,.57,0,.22,.25,.72,armor,10);block(g,0,.58,.23,.48,.12,.13,sash);cylinder(g,0,1.13,0,.19,.21,.35,skin,12);cylinder(g,0,1.37,0,.25,.22,.18,armorLight,12);cylinder(g,0,1.48,0,.18,.18,.08,armor,12);
 // Crossed forearms laid across the chest.
 const arm1=block(g,flip?-.07:.07,.87,.29,.57,.13,.14,armorLight);arm1.rotation.z=flip?-.12:.12;const arm2=block(g,flip?.07:-.07,.76,.34,.57,.13,.14,armor);arm2.rotation.z=flip?.12:-.12;guardParts.push({arm1,arm2,phase:flip?1.8:0});
 for(const sx of [-.12,.12]){const leg=block(g,sx,.22,.01,.13,.43,.15,armor);leg.rotation.z=sx<0?-.04:.04;const boot=block(g,sx,.035,.1,.2,.09,.31,woodMat);guardParts.push({leg,boot,side:sx,phase:flip?1.8:0})}
 const spear=cylinder(g,flip?.42:-.42,.95,-.02,.025,.025,1.55,woodMat,7);spear.rotation.z=flip?-.08:.08;const tip=cylinder(g,flip?.42:-.42,1.76,-.02,.008,.07,.18,armorLight,7);return g}
 makeGuard(-1.12,false);makeGuard(1.12,true);
 // Sun and moon follow a Bangladesh-local 24-hour arc: left horizon, zenith, right horizon.
 const skyBody=new T.Group();scene.add(skyBody);const sun=new T.Group(),moon=new T.Group();skyBody.add(sun,moon);
 const sunMat=new T.MeshStandardMaterial({color:0xe6b765,emissive:0x9b6128,emissiveIntensity:.55,roughness:.65});const moonMat=new T.MeshStandardMaterial({color:0xd9d8c9,emissive:0x777e9b,emissiveIntensity:.25,roughness:.8});
 const sunDisc=new T.Mesh(new T.SphereGeometry(.34,24,16),sunMat);sun.add(sunDisc);const sunHalo=new T.Mesh(new T.SphereGeometry(.48,24,16),new T.MeshBasicMaterial({color:0xdcae69,transparent:true,opacity:.12}));sun.add(sunHalo);
 const moonDisc=new T.Mesh(new T.SphereGeometry(.29,24,16),moonMat);moon.add(moonDisc);for(let i=0;i<4;i++){const crater=new T.Mesh(new T.SphereGeometry(.045+i%2*.018,10,8),new T.MeshStandardMaterial({color:0xa9adac,roughness:1}));crater.position.set((i-1.5)*.09,(i%2-.5)*.1,.26);moon.add(crater)}
 const stars=new T.Group();scene.add(stars);for(let i=0;i<42;i++){const dot=new T.Mesh(new T.SphereGeometry(.018+(i%3)*.006,6,5),new T.MeshBasicMaterial({color:0xe4dfcc,transparent:true,opacity:.55}));dot.position.set(-4.1+((Math.sin(i*12.9898)*43758.5453)%1+1)%1*8.2,1.7+((Math.sin(i*78.233)*12345.6789)%1+1)%1*3.5,-1.7+((Math.sin(i*3.117)*97.13)%1+1)%1*.4);stars.add(dot)}
 const skyLight=new T.DirectionalLight(0xffe2b0,1.6);skyLight.position.set(-3,7,4);scene.add(skyLight);
 const barkMats=[0x60412d,0x795338,0x8b6544,0x503a2a].map(c=>new T.MeshStandardMaterial({color:c,roughness:.92}));
 const leafMats=[0x536b3d,0x687b48,0x7d8955,0x929665,0x526541,0x9b9a67].map(c=>new T.MeshStandardMaterial({color:c,roughness:.86,side:T.DoubleSide}));
 const leafGeo=new T.IcosahedronGeometry(.15,1);
 const branchRecords=[],leafRecords=[];
 let seed=47;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 function vec(a){return new T.Vector3(a[0],a[1],a[2])}
 function makeSegment(a,b,r1,r2,delay,duration,depth){
  const A=vec(a),B=vec(b),d=B.clone().sub(A),len=d.length();if(len<.02)return;
  const geo=new T.CylinderGeometry(Math.max(.003,r2),Math.max(.004,r1),len,10,2,false);
  const mesh=new T.Mesh(geo,barkMats[Math.floor(rand()*barkMats.length)]);mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.scale.y=.001;tree.add(mesh);branchRecords.push({mesh,delay,duration,depth,start:A.clone(),direction:d.clone().normalize(),length:len});
  if(depth>1){const ridge=new T.Mesh(new T.CylinderGeometry(Math.max(.002,r2*.16),Math.max(.002,r1*.13),len*.98,5),barkMats[1]);ridge.position.copy(mesh.position);ridge.quaternion.copy(mesh.quaternion);ridge.scale.y=.001;tree.add(ridge);branchRecords.push({mesh:ridge,delay:delay+.025,duration,depth,start:A.clone(),direction:d.clone().normalize(),length:len})}
 }
 function leafCluster(pos,dir,count,delay,depth){
  const center=vec(pos);for(let i=0;i<count;i++){
   const leaf=new T.Group();leaf.position.copy(center);
   const mesh=new T.Mesh(leafGeo,leafMats[Math.floor(rand()*leafMats.length)]);mesh.rotation.x=(rand()-.5)*.9;mesh.rotation.z=(rand()-.5)*.9;mesh.scale.set(.58+rand()*.36,1.05+rand()*.72,.34+rand()*.32);mesh.castShadow=true;leaf.add(mesh);
   leaf.position.x+=(rand()-.5)*.58;leaf.position.y+=(rand()-.5)*.44;leaf.position.z+=(rand()-.5)*.6;
   const aim=vec(dir).normalize();leaf.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),aim);leaf.scale.setScalar(.001);tree.add(leaf);leafRecords.push({mesh:leaf,delay:delay+i*.018,duration:.65+rand()*.35,depth,basePosition:leaf.position.clone(),phase:rand()*Math.PI*2});
  }
 }
 function growBranch(start,heading,length,radius,depth,delay){
  const up=new T.Vector3(0,1,0),dir=vec(heading).normalize();
  const bend=new T.Vector3((rand()-.5)*.48,(rand()-.25)*.18,(rand()-.5)*.35);
  const end=vec(start).clone().add(dir.clone().multiplyScalar(length)).add(bend);
  const mid=vec(start).clone().lerp(end,.52).add(new T.Vector3((rand()-.5)*.16,.04,(rand()-.5)*.16));
  makeSegment(start,mid,radius,radius*.69,delay,.95,depth);makeSegment(mid.toArray(),end.toArray(),radius*.69,radius*.32,delay+.34,.85,depth);
  if(depth<=1){leafCluster(end.toArray(),dir.toArray(),11+Math.floor(rand()*7),delay+.75,depth);return}
  const lateral=new T.Vector3(dir.z,0,-dir.x);if(lateral.length()<.1)lateral.set(1,0,0);lateral.normalize();
  const spread=depth===4?.42:depth===3?.58:.7;
  const childCount=depth>=4?2:2+Math.floor(rand()*2);
  for(let i=0;i<childCount;i++){
   const side=i-(childCount-1)/2;
   const childDir=dir.clone().multiplyScalar(.68).add(lateral.clone().multiplyScalar(side*spread+(rand()-.5)*.28)).add(up.clone().multiplyScalar(.35+rand()*.22)).normalize();
   const t=.48+rand()*.38,at=vec(start).lerp(mid,t);
   growBranch(at.toArray(),childDir.toArray(),length*(.57+rand()*.14),radius*(.58+rand()*.1),depth-1,delay+.62+i*.15);
  }
  leafCluster(end.toArray(),dir.toArray(),depth===2?8:5,delay+.85,depth);
 }
 // Main trunk: visibly thick at the base and gradually tapered upward.
 const trunk=[[0,0,0],[.03,.78,-.02],[-.04,1.55,.02],[.08,2.32,-.04],[.02,3.1,.02],[.12,3.82,.05],[.08,4.42,.02]];
 for(let i=0;i<trunk.length-1;i++)makeSegment(trunk[i],trunk[i+1],[.24,.20,.16,.13,.095,.065][i],[.20,.16,.13,.095,.065,.025][i],i*.24,.95,6);
 // Asymmetric, layered limbs create a natural silhouette instead of a geometric lollipop.
 const primary=[
  {at:[-.01,1.55,.01],dir:[-1,.67,.05],len:1.45,r:.145,d:4,t:1.1},
  {at:[.04,2.15,-.02],dir:[1,.57,.1],len:1.55,r:.135,d:4,t:1.45},
  {at:[.05,2.72,-.02],dir:[-.72,.72,-.08],len:1.45,r:.11,d:4,t:1.8},
  {at:[.08,3.05,.01],dir:[.72,.7,.08],len:1.4,r:.105,d:4,t:2.0},
  {at:[.1,3.55,.04],dir:[-.48,.88,.06],len:1.12,r:.08,d:3,t:2.2},
  {at:[.11,3.72,.04],dir:[.58,.82,-.03],len:1.0,r:.075,d:3,t:2.4}
 ];
 primary.forEach(b=>growBranch(b.at,b.dir,b.len,b.r,b.d,b.t));
 // Subtle ground plane and roots give the tree a physical anchor.
 const ground=new T.Mesh(new T.CircleGeometry(1.65,48),new T.MeshStandardMaterial({color:0xb6ad92,roughness:1,transparent:true,opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.set(-3.05,-.025,0);ground.scale.set(.76,.44,.76);ground.receiveShadow=true;scene.add(ground);
 [[0,0,0],[-.12,.02,.02],[.12,.02,-.01]].forEach((s,i)=>makeSegment([0,.18,0],[s[0]+(i-1)*.48,.025,s[2]+(i-1)*.12],.12,.018,.15,.8,5));
 function resize(){const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w<500?15.4:12.6;camera.fov=w<500?43:39;camera.lookAt(0,2.25,0);camera.updateProjectionMatrix()}
 resize();const ro=new ResizeObserver(resize);ro.observe(stage);
 const startTime=performance.now();let raf=0;
 function frame(now){
  const t=(now-startTime)/1000;
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const clock={};parts.forEach(p=>{if(p.type!=='literal')clock[p.type]=Number(p.value)});const hour=clock.hour+clock.minute/60+clock.second/3600;const daylight=hour>=6&&hour<18;const sunProgress=(hour-6)/12;const moonProgress=hour>=18?(hour-18)/12:(hour+6)/12;sun.visible=daylight;moon.visible=!daylight;const arc=(p)=>({x:-4.25+p*8.5,y:.42+Math.sin(Math.max(0,Math.min(1,p))*Math.PI)*3.45});const celestial=daylight?arc(sunProgress):arc(moonProgress);(daylight?sun:moon).position.set(celestial.x,celestial.y,-1.55);stars.visible=!daylight;skyLight.intensity=daylight?1.55:.26;key.intensity=daylight?3.0:.62;rim.intensity=daylight?2.0:.8;/* Keep the WebGL scene transparent so the fortress floats openly in the page design. */stage.dataset.localTime=String(clock.hour).padStart(2,'0')+':'+String(clock.minute).padStart(2,'0');
  branchRecords.forEach(r=>{const p=reduced?1:Math.max(0,Math.min(1,(t-r.delay)/r.duration));r.mesh.scale.y=Math.max(.001,p);r.mesh.position.copy(r.start).addScaledVector(r.direction,r.length*p/2);});
  leafRecords.forEach(r=>{const p=reduced?1:Math.max(0,Math.min(1,(t-r.delay)/r.duration));const e=1-Math.pow(1-p,3);r.mesh.scale.setScalar(Math.max(.001,e));if(!reduced&&p>=1){r.mesh.position.copy(r.basePosition);r.mesh.position.x+=Math.sin(t*1.18+r.phase)*.035;r.mesh.position.z+=Math.cos(t*.92+r.phase)*.025;}});
  tree.rotation.y=reduced?-.14:Math.sin(t*.34)*.055-.14;
  tree.rotation.z=reduced?0:Math.sin(t*.23)*.008;
  guardGroups.forEach(({g,phase,baseX})=>{g.position.x=baseX+Math.sin(t*.82+phase)*.16;g.position.y=.18+Math.sin(t*1.65+phase)*.045;g.rotation.y=Math.sin(t*.92+phase)*.085+(phase>1?-.12:.12);g.rotation.z=Math.sin(t*1.15+phase)*.025});guardParts.forEach(p=>{if(p.arm1){p.arm1.rotation.z=(p.phase>1?-.12:.12)+Math.sin(t*1.35+p.phase)*.085;p.arm2.rotation.z=(p.phase>1?.12:-.12)+Math.sin(t*1.35+p.phase+1)*.075}if(p.leg){p.leg.rotation.z=(p.side<0?-.04:.04)+Math.sin(t*1.65+p.phase)*.045;p.boot.position.y=.035+Math.max(0,Math.sin(t*1.65+p.phase+(p.side<0?0:Math.PI)))*.035}});
  renderer.render(scene,camera);
  raf=requestAnimationFrame(frame);
 }
 stage.classList.add('is-ready');raf=requestAnimationFrame(frame);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf)}else raf=requestAnimationFrame(frame)});
}
if(window.THREE)start();else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=start;s.onerror=()=>{fallback.textContent='গাছের 3D দৃশ্য লোড করা যায়নি।';};document.head.append(s)}
})();