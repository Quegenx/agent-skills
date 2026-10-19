// [word-fold, assets/kit/fold.js]
/* Word fold engine: the walking-compass rig for any word made of the letters below.
   A strip walks across the word like a compass: the planted leg pivots on its foot,
   the swing leg holds back, whips forward and kicks its lower half back mid-swing.
   Each step uncovers the letters to its left; the last step becomes the last letter.
     ending 'A': lands as Λ, the crossbar rises from the baseline (DATA, IDEA)
     ending 'T': both legs close into one vertical bar (the stem), then the top bar expands out
     ending 'I': both legs close into one vertical bar (how the piece starts)
     ending 'N': planted leg stands as the left stem, swing leg lands as the diagonal, right stem grows up
   Page sets window.FOLD = { word, gaps[], ribbon, ink, bg:[a,b], ending } before loading this.
   Motion constants come from a reference logo reveal, measured frame by frame and fitted. */
(function(){
const C=window.FOLD;
// [word-fold, SKILL.md / scripts/init_word.py] Refuse unsupported configuration.
if(!C || typeof C.word!=='string' || !/^[A-Z0-9]+$/.test(C.word)) throw new Error('word-fold: use one uppercase word of letters/digits.');
if(!Array.isArray(C.gaps) || C.gaps.length!==C.word.length-1 || !C.gaps.every(Number.isFinite)) throw new Error('word-fold: provide one finite gap per letter pair.');
if(!['A','T','I','N'].includes(C.ending) || C.ending!==C.word.at(-1)) throw new Error('word-fold: author the final-letter ending before using it. Built in: A, T, I, N.');
if(![C.ribbon,C.ink,...(Array.isArray(C.bg)?C.bg:[])].every(c=>/^#[0-9a-f]{6}$/i.test(c)) || !Array.isArray(C.bg) || C.bg.length!==2) throw new Error('word-fold: ribbon, ink and two background colors must be #RRGGBB.');
for(const key of ['minView','fill']) if(C[key]!=null && (!Number.isFinite(C[key]) || C[key]<=0)) throw new Error('word-fold: '+key+' must be positive.');
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
const DEG=Math.PI/180, clamp01=x=>x<0?0:x>1?1:x, lerp=(a,b,k)=>a+(b-a)*k;
const ss=(a,b,x)=>{const u=clamp01((x-a)/(b-a));return u*u*(3-2*u);};
const sst=(a,b,x)=>{const u=clamp01((x-a)/(b-a));return u*u*u*(u*(u*6-15)+10);};
function bez(x1,y1,x2,y2,u){
  if(u<=0)return 0; if(u>=1)return 1;
  let lo=0,hi=1,m=0;
  for(let i=0;i<40;i++){m=(lo+hi)/2;const xm=3*(1-m)*(1-m)*m*x1+3*(1-m)*m*m*x2+m*m*m; if(xm<u)lo=m; else hi=m;}
  m=(lo+hi)/2; return 3*(1-m)*(1-m)*m*y1+3*(1-m)*m*m*y2+m*m*m;
}

/* ---------- geometric caps (stems 14.43, bars 12.9, cap height 83.74) ---------- */
const CAP=597.9, BASE=681.64, CY=639.86, STEM=14.43, BAR=12.9, MIDY=(CAP+BASE)/2;
const K=0.58;
function dShape(x0,xa,top,bot){ const r=(bot-top)/2, cy=(top+bot)/2, k=r*K;
  return `M${x0} ${top}H${xa}C${xa+k} ${top} ${xa+r} ${cy-k} ${xa+r} ${cy}C${xa+r} ${cy+k} ${xa+k} ${bot} ${xa} ${bot}H${x0}Z`; }
const rect=(x0,y0,x1,y1)=>`M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
function aPaths(c){ const h=BASE-CAP, oB=43.46, oT=oB-0.428*h, iB=oB-14.95, iT=iB-0.428*h;
  const xi=y=>oB-14.95-0.428*(BASE-y);
  return [`M${c-oB} ${BASE}L${c-oT} ${CAP}L${c-iT} ${CAP}L${c-iB} ${BASE}Z`,
          `M${c+oB} ${BASE}L${c+oT} ${CAP}L${c+iT} ${CAP}L${c+iB} ${BASE}Z`,
          `M${c-xi(648.65)-1} 648.65L${c+xi(648.65)+1} 648.65L${c+xi(661.4)+1} 661.4L${c-xi(661.4)-1} 661.4Z`]; }
function gPath(x){   // geometric G: elliptical ring open at the upper right, bar into the centre
  const rx=40, ry=(BASE-CAP)/2, cx=x+rx, cy=MIDY, irx=rx-STEM, iry=ry-BAR, a=-60*DEG;
  const o=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)], i=[cx+irx*Math.cos(a),cy+iry*Math.sin(a)];
  const ring=`M${cx+rx} ${cy}A${rx} ${ry} 0 1 1 ${o[0]} ${o[1]}L${i[0]} ${i[1]}A${irx} ${iry} 0 1 0 ${cx+irx} ${cy}Z`;
  // bar: its right end follows the outer ellipse, so no corner pokes out past the round
  const yb=cy+BAR, xb=cx+rx*Math.sqrt(1-Math.pow(BAR/ry,2));
  return [ring, `M${cx+1} ${cy}H${cx+rx}A${rx} ${ry} 0 0 1 ${xb} ${yb}H${cx+1}Z`];
}
const GLYPH={
  A:{w:86.92, draw:x=>aPaths(x+43.46)},
  D:{w:73.87, draw:x=>[dShape(x,x+32,CAP,BASE)+dShape(x+STEM,x+30.6,CAP+BAR,BASE-BAR)]},
  E:{w:56.5,  draw:x=>[rect(x,CAP,x+STEM,BASE),rect(x,CAP,x+56,CAP+BAR),rect(x,633.45,x+51,645.52),rect(x,BASE-BAR,x+56.5,BASE)]},
  G:{w:80,    draw:x=>gPath(x)},
  I:{w:STEM,  draw:x=>[rect(x,CAP,x+STEM,BASE)]},
  L:{w:52,    draw:x=>[rect(x,CAP,x+STEM,BASE),rect(x,BASE-BAR,x+52,BASE)]},
  N:{w:72.98, draw:x=>{   // diagonal meets the left stem's top corner and the right stem's bottom corner exactly
                         const x2=x+58.55, hw=17.6, m=(58.55-STEM+hw)/(BASE-CAP);
                         const yU=CAP+58.55/m, yLo=CAP+(hw-STEM)/m;
                         return [rect(x,CAP,x+STEM,BASE),rect(x2,CAP,x2+STEM,BASE),
                                 `M${x} ${CAP}L${x+STEM} ${CAP}L${x2+STEM} ${yU}L${x2+STEM} ${BASE}L${x2} ${BASE}L${x} ${yLo}Z`]; }},
  O:{w:84,    draw:x=>{ const rx=42, ry=(BASE-CAP)/2, cx=x+rx, cy=MIDY, irx=rx-STEM, iry=ry-BAR;
                         const ell=(a,b)=>`M${cx-a} ${cy}A${a} ${b} 0 1 0 ${cx+a} ${cy}A${a} ${b} 0 1 0 ${cx-a} ${cy}Z`;
                         return [ell(rx,ry)+ell(irx,iry)]; }},
  R:{w:63,    draw:x=>{ const bt=CAP+50, yT=bt-BAR, x0=x+24, xr=x+63;           // bowl + diagonal leg from the bowl's floor
                         let th=0.46; for(let i=0;i<8;i++) th=Math.atan((xr-x0-14/Math.cos(th))/(BASE-yT));
                         const hw=14/Math.cos(th);
                         return [dShape(x,x+27,CAP,bt)+dShape(x+STEM,x+25.6,CAP+BAR,bt-BAR), rect(x,CAP,x+STEM,BASE),
                                 `M${x0} ${yT}L${x0+hw} ${yT}L${xr} ${BASE}L${xr-hw} ${BASE}Z`]; }},
  T:{w:62,    draw:x=>[rect(x,CAP,x+62,CAP+BAR),rect(x+31-STEM/2,CAP,x+31+STEM/2,BASE)]}
};

/* ---------- layout: boxes + gaps, centred on x=360 ---------- */
const letters=[...C.word];
const MISSING=letters.filter(ch=>!GLYPH[ch]);
if(MISSING.length) throw new Error(`fold.js has no glyph for ${MISSING.join(', ')}. Add it to GLYPH (see references/glyphs.md in the source template).`);
const LAY=(()=>{ let x=0; const xs=[];
  letters.forEach((ch,i)=>{ xs.push(x); x+=GLYPH[ch].w+(i<letters.length-1?C.gaps[i]:0); });
  const shift=360-x/2; return {xs:xs.map(v=>v+shift), width:x}; })();
if(LAY.width<=0) throw new Error('word-fold: gaps must leave a positive word width.');
const lastX=LAY.xs[letters.length-1], lastCh=letters[letters.length-1];

/* ---------- view + camera framing ---------- */
const VIEW_W=Math.max(C.minView||420, LAY.width/(C.fill||0.58)), VIEW_H=VIEW_W*9/16, VIEW_CX=360, VIEW_CY=640;
const S0=Math.min(1.94, Math.max(1.2, 0.36*VIEW_H/84)), S1=0.98;

/* ---------- ribbon rig ---------- */
// strip band = letter band, so ribbon-made letters line up exactly with the white ones
const RCAP=CAP, RBASE=BASE, AY=599, FOOTY=693.85, H=FOOTY-AY, WL=13.7;
const RIG={ front:21, overshoot:3.2, bend:47, bend0:36, upper:44, lowerFolded:29, lowerFull:100,
            t0:178.5, firstLen:7, cycle:10, lastLen:16, lastBend:16, stepTarget:68 };
const END=C.ending;
const A_ANG=23.47;
const endX = END==='A' ? lastX+43.46 : END==='T' ? lastX+31 : lastX+STEM/2;   // where the apex lands (N: on its left stem)
const N_X2 = lastX+58.55;                                                        // N: right stem
// N: diagonal angle so its lower edge meets the right stem's bottom-left corner exactly
const N_ANG = (()=>{ let th=0.6; for(let i=0;i<12;i++) th=Math.atan((N_X2+(WL/2)/Math.cos(th)-endX)/(BASE-AY)); return th/DEG; })();
const LAST_FOOT = END==='A' ? endX-H*Math.tan(A_ANG*DEG) : endX;          // T and I close straight up over their stem
const FIRST_FOOT=LAY.xs[0]-13;
const NSTEPS=Math.max(2,Math.round((LAST_FOOT-FIRST_FOOT)/RIG.stepTarget))+1;
const FEET=Array.from({length:NSTEPS},(_,k)=>lerp(FIRST_FOOT,LAST_FOOT,k/(NSTEPS-1)));
const BACK=Math.atan((FEET[1]-FEET[0])/H-Math.tan(RIG.front*DEG))/DEG;
const T_LAST=RIG.t0+RIG.firstLen+(NSTEPS-2)*RIG.cycle, T_LAND=T_LAST+RIG.lastLen;
const F0=151, FPS=30, DUR=Math.ceil(((T_LAND+50)-F0)/FPS*2)/2;
// [word-fold, scripts/sfx_steps.py] Authored accents, not final-stroke completion.
const SFX_STEPS=[RIG.t0+0.86*RIG.firstLen,...Array.from({length:NSTEPS-2},(_,k)=>RIG.t0+RIG.firstLen+k*RIG.cycle+0.8*RIG.cycle)];
if(END==='A'||END==='N') SFX_STEPS.push(T_LAST+0.85*RIG.lastLen);
else if(END==='T') SFX_STEPS.push(T_LAND-1.5);
// The source I profile has no separate final step; retain its land accent.
const SFX_LAND=T_LAND+(END==='A'||END==='N'?8:END==='T'?4:-1);

function rigAt(f){
  let foot,P,W,bend,L2,Lp=null;
  if(f<=RIG.t0){ foot=FEET[0]; P=0; W=0; bend=0; L2=RIG.lowerFull; }
  else if(f<=RIG.t0+RIG.firstLen){
    const u=(f-RIG.t0)/RIG.firstLen;
    foot=FEET[0]; P=-BACK*u;
    W=(RIG.front+RIG.overshoot)*ss(0,0.75,u)-RIG.overshoot*ss(0.75,1,u);
    bend=-RIG.bend0*Math.pow(Math.sin(Math.PI*Math.pow(u,0.7)),2);
    L2=lerp(RIG.lowerFolded,RIG.lowerFull,ss(0.65,0.8,0.5+0.5*u));
  } else if(f<T_LAST){
    const tt=f-(RIG.t0+RIG.firstLen), k=Math.floor(tt/RIG.cycle)+1, c=(tt-(k-1)*RIG.cycle)/RIG.cycle;
    foot=FEET[k]; P=RIG.front-(RIG.front+BACK)*c;
    W=-BACK+(RIG.front+BACK+RIG.overshoot)*ss(0.22,0.62,c)-RIG.overshoot*ss(0.62,1,c);
    bend=-RIG.bend*Math.pow(Math.sin(Math.PI*c),2);
    L2=lerp(RIG.lowerFolded,RIG.lowerFull,1-ss(0.05,0.2,c)+ss(0.65,0.8,c));
  } else {                                                    // last step becomes the last letter
    const c=clamp01((f-T_LAST)/RIG.lastLen);
    foot=FEET[NSTEPS-1]; L2=RIG.lowerFull; bend=-RIG.lastBend*Math.pow(Math.sin(Math.PI*c),2);
    if(END==='A'){ P=lerp(RIG.front,-A_ANG,sst(0,1,c)); W=-BACK+(A_ANG+BACK)*sst(0.1,0.9,c); }
    else if(END==='N'){ P=lerp(RIG.front,0,sst(0,1,c)); W=-BACK+(N_ANG+BACK)*sst(0.1,0.9,c); }   // left stem + diagonal
    else { P=lerp(RIG.front,0,sst(0,1,c)); W=-BACK*(1-sst(0.1,0.9,c)); bend*=0.6; }   // T and I: close into one bar
  }
  const apex=[foot-H*Math.tan(P*DEG),AY];
  const knee=[apex[0]+RIG.upper*Math.sin(W*DEG),apex[1]+RIG.upper*Math.cos(W*DEG)];
  const end=[knee[0]+L2*Math.sin((W+bend)*DEG),knee[1]+L2*Math.cos((W+bend)*DEG)];
  const back=Lp==null?[foot,FOOTY]:[apex[0]+Lp*Math.sin(P*DEG),apex[1]+Lp*Math.cos(P*DEG)];
  return {foot:[foot,FOOTY],back,apex,knee,end,P,Lp};
}
function cam(f){
  const us=clamp01((f-173.71)/(T_LAND+10-173.71)), ux=clamp01((f-171.11)/(T_LAND+13-171.11));
  const s=S0+(S1-S0)*bez(0.58339,0,0.40085,1,us)+0.000597*Math.max(0,f-(T_LAND+10));
  const px=S0*(360-FIRST_FOOT)*(1-bez(0.60141,0,0.38193,1,ux));
  return [s,px];
}
function barTop(f){ const u=clamp01((f-151.18)/(176.22-151.18)); return RBASE-84.3*bez(0.149,0,0.3307,1,u); }

/* ---------- DOM ---------- */
document.body.insertAdjacentHTML('beforeend',`
<div id="frame" style="width:1920px;height:1080px" data-kc-canvas>
<svg id="stage" xmlns="${NS}">
  <defs>
    <linearGradient id="bg" gradientUnits="userSpaceOnUse"></linearGradient>
    <clipPath id="aboveBase" clipPathUnits="userSpaceOnUse"><rect x="-2000" y="0" width="5000" height="${BASE}"/></clipPath>
  </defs>
  <rect id="bgRect" fill="url(#bg)"/>
  <g transform="translate(0.5 0.5)"><g id="cam">
    <g id="letters"></g>
    <g id="wedged"><g clip-path="url(#aboveBase)"><path id="crossbar"/></g></g>
    <path id="topbar"/>
    <g id="banded"><path id="ribbon" fill="none" stroke-width="${WL}" stroke-linejoin="miter" stroke-miterlimit="8" stroke-linecap="butt"/></g>
  </g></g>
</svg></div>`);
(function(){
  const vx=VIEW_CX-VIEW_W/2, vy=VIEW_CY-VIEW_H/2;
  $('stage').setAttribute('viewBox',`${vx} ${vy} ${VIEW_W} ${VIEW_H}`);
  const r=$('bgRect'); r.setAttribute('x',vx-2); r.setAttribute('y',vy-2); r.setAttribute('width',VIEW_W+4); r.setAttribute('height',VIEW_H+4);
  const g=$('bg'); g.setAttribute('x1',vx+VIEW_W); g.setAttribute('y1',vy); g.setAttribute('x2',vx); g.setAttribute('y2',vy+VIEW_H);
  el('stop',{offset:0,'stop-color':C.bg[0]},g); el('stop',{offset:1,'stop-color':C.bg[1]},g);
  const lt=$('letters'); lt.setAttribute('fill',C.ink);
  letters.forEach((ch,i)=>{ if(i===letters.length-1) return;   // the ribbon draws the last letter
    GLYPH[ch].draw(LAY.xs[i]).forEach(d=>el('path',{d,'fill-rule':'evenodd'},lt)); });
  $('ribbon').setAttribute('stroke',C.ribbon); $('crossbar').setAttribute('fill',C.ribbon); $('topbar').setAttribute('fill',C.ribbon);
})();
const pt=p=>p[0].toFixed(3)+' '+p[1].toFixed(3);
/* Moving clips are double-buffered: Chrome can skip repainting newly uncovered areas when a
   clipPath's geometry changes in place, leaving stale holes. Writing into the idle copy and
   switching the reference forces a clean repaint every frame. */
const CLIPS={};
function setClip(target,key,ds){
  const st=CLIPS[key]||(CLIPS[key]={i:0,cps:[0,1].map(j=>el('clipPath',{id:key+j,clipPathUnits:'userSpaceOnUse'},document.querySelector('#stage defs')))});
  st.i^=1; const cp=st.cps[st.i];
  while(cp.firstChild) cp.removeChild(cp.firstChild);
  ds.forEach(d=>el('path',{d},cp));
  target.setAttribute('clip-path',`url(#${key}${st.i})`);
}

function render(t){
  const f=F0+t*FPS;
  const [s,px]=cam(f);
  $('cam').setAttribute('transform',`translate(${360+px} ${CY}) scale(${s}) translate(-360 ${-CY})`);
  const R=rigAt(f), a=R.apex;
  const tail=`L${pt(a)}L${pt(R.knee)}L${pt(R.end)}`;
  $('ribbon').setAttribute('d', R.Lp!=null&&R.Lp<0.5 ? `M${pt(a)}L${pt(R.knee)}L${pt(R.end)}` : `M${pt(R.back)}${tail}`);
  // band clip; for N the diagonal is trimmed at the right stem's outer edge as it lands
  const bandR = END==='N' ? lerp(3000,N_X2+STEM,ss(T_LAST+0.6*RIG.lastLen,T_LAND,f)) : 3000;
  setClip($('banded'),'band',[`M-2000 ${Math.max(RCAP,barTop(f))}H${bandR}V${RBASE}H-2000Z`]);

  // A ending: crossbar rises from the baseline, kept between the legs
  if(END==='A'){
    const u=clamp01((f-(T_LAND-1.3))/17.5);
    if(u>0){ setClip($('wedged'),'wedge',[`M${pt(R.foot)}L${pt(a)}L${pt(R.knee)}L${pt(R.end)}Z`]);
      const y=BASE+(648.65-BASE)*bez(0.245,0,0.389,1,u);
      $('crossbar').setAttribute('d',`M-2000 ${y}H3000V${y+12.75}H-2000Z`);
    } else $('crossbar').setAttribute('d','');
  }
  // T ending: once the strip has closed into the stem, the top bar expands out both ways
  if(END==='T'){
    const g=1-Math.pow(1-clamp01((f-(T_LAND-1))/11),3);
    $('topbar').setAttribute('d', g>0 ? rect(endX-31*g,CAP,endX+31*g,CAP+BAR) : '');
  }
  // N ending: the right stem grows up from the baseline at the diagonal's foot
  if(END==='N'){
    const u=clamp01((f-(T_LAND-1))/14), h=(BASE-CAP)*bez(0.149,0,0.3307,1,u);
    $('topbar').setAttribute('d', u>0 ? rect(N_X2,BASE-h,N_X2+STEM,BASE) : '');
  }
  // reveal: left of whichever leg is in front
  const TT=a[1]-400, BB=BASE+400;
  setClip($('letters'),'reveal',[
    `M-2000 ${TT}L${a[0]} ${TT}L${pt(a)}L${pt(R.foot)}L${R.foot[0]} ${BB}L-2000 ${BB}Z`,
    `M-2000 ${TT}L${a[0]} ${TT}L${pt(a)}L${pt(R.knee)}L${pt(R.end)}L${R.end[0]} ${BB}L-2000 ${BB}Z`]);
}
window.FOLD_INFO={F0,FPS,SFX_STEPS,SFX_LAND,FINAL_SCALE:cam(F0+DUR*FPS)[0],word:C.word,ending:END,DUR,NSTEPS,T_LAND,VIEW_W,S0,letters:Object.keys(GLYPH).join(''),missing:letters.filter(ch=>!GLYPH[ch]).join('')};
KC.fit($('frame'),1920,1080);
KC.mount({duration:DUR,fps:FPS,render});
})();
