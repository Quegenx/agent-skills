// film.js: the turning dial as a film, for video-skills' seek-engine .
// live.js runs the figure on its own requestAnimationFrame clock, with a pointer, a tour and stepped springs. Here every
// frame is a pure function of t: window.seek(t) poses the 3D controller, lights the LED with the closed form of gl.mjs's
// settle(), and flies the sparks ballistically from seeded starts, so any frame renders alone and identically.
// Build with: node build.mjs --film  (writes turning-dial-film.html), then render it with seek-engine's render.mjs.
const DATA = __DATA__;
const follow = null;
const stage = document.querySelector(".td-stage");
const readout = document.querySelector("[data-readout]");
const INDEX = (DATA.index * 180) / Math.PI;
const SPEED = 18;                       // the tour's degrees per second
const BREAK_AT = 5;                     // seconds: the pod breaks off here
const DURATION = 8;
const readingOf = (turn) => ((((INDEX + 90 - turn) / 3.6) % 100) + 100) % 100;
let paint = () => {};
let T = 0;
const controller = TURN.mount(stage, DATA.turn, { follow, onFrame: () => paint() });
const GLD = DATA.gl;
const LIGHT = (stage.closest("[data-theme]")?.getAttribute("data-theme") ?? "dark") !== "dark" ? 1 : 0;
const INK = `
uniform float uLight;
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 inkFor(vec3 seen,float cover){vec3 absorbed=1.-seen;float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);return vec4(vec3(a)-absorbed,a);}
vec4 finish(vec4 ink,vec2 frag){ink.rgb=min(ink.rgb,vec3(ink.a));float n=(hash12(frag)-.5)/255.*smoothstep(0.,1.5/255.,ink.a);return clamp(ink+vec4(n),0.,1.);}
`;
const BACK = `${glslPose("Dial")}${INK}
uniform vec3 uLed;
uniform vec3 uLedDir;
uniform float uOn;
const float FACE_Z=${GLD.faceZ.toFixed(3)};
const float FACE_R=${GLD.faceR.toFixed(3)};
const float HUB_R=${GLD.hubR.toFixed(3)};
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onFloor(vb,FACE_Z);
  vec3 q=toDial(p);
  float r=length(q.xy);
  float face=(1.-smoothstep(FACE_R-3.,FACE_R-1.,r))*smoothstep(HUB_R+.2,HUB_R+1.6,r);
  vec3 v=p-uLed;
  float d2=dot(v,v);
  float d=sqrt(d2);
  float lens=.3+.7*pow(max(0.,dot(v/d,uLedDir)),1.5);
  float lambert=max(0.,(uLed.z-FACE_Z+.6)/d);
  float grain=.84+.16*noise2(vec2(atan(q.y,q.x)*180.,r*.6));
  float e=420.*lens*lambert/(d2+10.)*grain*face;
  float lit=1.-exp(-e);
  vec3 tint=vec3(.40,.84,.60);
  vec4 light=inkFor(mix(vec3(1.),tint,.7*lit),0.);
  vec3 glow=vec3(.25,1.,.58)*lit*.55;
  vec4 dark=vec4(glow,max(glow.r,max(glow.g,glow.b)));
  gl_FragColor=finish(mix(dark,light,uLight)*uOn,gl_FragCoord.xy);
}`;
const FRONT = `${GLSL_TURN}${INK}
uniform vec2 uLedVb;
uniform float uLedR;
uniform float uLedFace;
uniform float uOn;
uniform vec4 uSpark[24];
uniform float uSparkHeat[24];
vec4 sparkInk(float heat,float along,float young){
  vec3 tail=mix(vec3(.78,.2,.04),vec3(1.,.55,.08),smoothstep(.35,.8,heat));
  vec3 head=mix(tail,vec3(1.,.74,.2),smoothstep(.55,.9,heat)*smoothstep(.5,1.,along));
  vec3 seen=mix(head,vec3(1.,.95,.82),young*smoothstep(.8,1.,along));
  float a=.88*smoothstep(0.,.3,along)*smoothstep(.12,.45,heat);
  vec4 light=vec4(seen*a,a);
  vec3 hot=mix(vec3(1.,.35,.05),vec3(1.,.9,.6),young*along)*(.4+.6*heat);
  vec4 dark=vec4(hot*a,a);
  return mix(dark,light,uLight);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=uView.x/uCanvas.x;
  float soft=.7*px;
  float d=length(vb-uLedVb);
  float body=1.-smoothstep(uLedR-.6*px,uLedR+.6*px,d);
  float core=1.-smoothstep(uLedR*.32,uLedR*.55+.5*px,d);
  float rim=smoothstep(uLedR*.55,uLedR,d);
  vec3 seen=mix(mix(vec3(.18,.70,.43),vec3(.11,.52,.31),rim),vec3(.90,1.,.94),core);
  vec4 lightLed=inkFor(seen,.92)*body;
  vec3 hot=mix(vec3(.2,1.,.55),vec3(.92,1.,.95),core)*body;
  vec4 darkLed=vec4(hot,body);
  vec4 led=mix(darkLed,lightLed,uLight)*smoothstep(.02,.3,uLedFace)*uOn;
  vec4 sparks=vec4(0.);
  float w=max(.35+.6*px,1.25*px);
  for(int i=0;i<24;i++){
    float heat=uSparkHeat[i];
    if(heat<=0.)continue;
    vec4 s=uSpark[i];
    vec2 a=s.zw;
    vec2 b=s.xy;
    vec2 ab=b-a;
    float l2=max(dot(ab,ab),1e-6);
    float t=clamp(dot(vb-a,ab)/l2,0.,1.);
    float dist=length(vb-a-ab*t);
    float cover=1.-smoothstep(w*.5-.5*px,w*.5+.5*px,dist);
    if(cover<=0.)continue;
    sparks=over(sparkInk(heat,t,step(.65,heat))*cover,sparks);
  }
  vec4 ink=over(sparks,led)*(1.-coverOf(vb,soft));
  gl_FragColor=finish(ink,gl_FragCoord.xy);
}`;
const canvasOf = (name) => stage.querySelector(`[data-canvas="${name}"]`);
const view = [GLD.W, GLD.H];
const backLayer = glLayer({ canvas: canvasOf("back"), fragment: BACK, view, camera: GLD.camera, uniforms: ["uLed", "uLedDir", "uOn", "uDialX", "uDialY", "uDialZ", "uDialT"], fixed: { uLight: LIGHT } });
const frontLayer = backLayer ? glLayer({ canvas: canvasOf("front"), fragment: FRONT, view, camera: GLD.camera, uniforms: ["uLedVb", "uLedR", "uLedFace", "uOn", "uSpark", "uSparkHeat", "uCoverEdge", "uCoverCount"], fixed: { uLight: LIGHT } }) : null;
const roomy = frontLayer ? frontLayer.gl.getParameter(frontLayer.gl.MAX_FRAGMENT_UNIFORM_VECTORS) >= 128 : false;
if (backLayer && frontLayer && roomy) stage.setAttribute("data-gl", "");
const SPARKS = 24;
const sparkData = new Float32Array(SPARKS * 4);
const sparkHeat = new Float32Array(SPARKS);
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARTS = Array.from({ length: SPARKS }, () => {
  const a = random() * Math.PI * 2, tilt = 0.35 + random() * 0.9, speed = 16 + random() * 22;
  return { v: [Math.cos(a) * Math.sin(tilt) * speed, Math.sin(a) * Math.sin(tilt) * speed, Math.cos(tilt) * speed], delay: random() * 0.08, life: 0.3 + random() * 0.45 };
});
const dialAt = (t) => SPEED * t;
const podAt = (t) => (t < BREAK_AT ? null : breakAt(Math.min(DATA.breakEnd, t - BREAK_AT)));
const ledAt = (t) => { const w = t / 0.35; return 1 - (1 + w) * Math.exp(-w); };   // gl.mjs settle(), solved: critically damped, 0.35 s
let socketAtBreak = null;
function writeSparks(t) {
  const w = controller.cams().world;
  const project = (p) => [w.ox + w.m[0] * p[0] + w.m[1] * p[1] + w.m[2] * p[2], w.oy + w.m[3] * p[0] + w.m[4] * p[1] + w.m[5] * p[2]];
  for (let i = 0; i < SPARKS; i++) {
    const s = STARTS[i], age = t - BREAK_AT - s.delay;
    sparkHeat[i] = 0;
    if (!socketAtBreak || age < 0 || age > s.life) continue;
    const at = (a) => [socketAtBreak[0] + s.v[0] * a, socketAtBreak[1] + s.v[1] * a, socketAtBreak[2] + s.v[2] * a - 49 * a * a];
    const p = at(age);
    if (p[2] < GLD.faceZ) continue;
    const head = project(p), tail = project(at(Math.max(0, age - 0.05)));
    sparkData.set([head[0], head[1], tail[0], tail[1]], 4 * i);
    sparkHeat[i] = 1 - age / s.life;
  }
}
paint = () => {
  if (!stage.hasAttribute("data-gl")) return;
  const led = controller.anchor(GLD.led.group, GLD.led.at, GLD.led.normal);
  const world = controller.cams().world;
  const facing = led.direction[0] * world.V[0] + led.direction[1] * world.V[1] + led.direction[2] * world.V[2];
  const on = ledAt(T);
  backLayer.draw({ uLed: led.world, uLedDir: led.direction, uOn: on, ...TURN.poseUniforms(controller, "dial", "uDial") }, T);
  writeSparks(T);
  const live = sparkHeat.some((h) => h > 0);
  const cover = TURN.cover(controller, live ? [[GLD.led.part], ["hand.pod.socket"]] : [GLD.led.part]);
  frontLayer.draw({ uLedVb: led.screen, uLedR: 0.52 * world.k, uLedFace: facing, uOn: on, uSpark: sparkData, uSparkHeat: sparkHeat, uCoverEdge: cover.uCoverEdge, uCoverCount: cover.uCoverCount }, T);
  stage.style.setProperty("--td-fallback", String(Math.max(0, (1 - on) / (1 - on * 0.92 + 1e-6))));
};
// the socket's world position at the break, taken once with the dial posed at that instant (pure: depends on BREAK_AT only)
controller.set({ dial: dialAt(BREAK_AT), lift: tapAt(BREAK_AT), pod: null });
socketAtBreak = controller.anchor("dial", GLD.socket).world.slice();
function seek(t) {
  T = Math.min(DURATION, Math.max(0, t));
  controller.set({ dial: dialAt(T), lift: tapAt(T), pod: podAt(T) });
  const dial = dialAt(T);
  readout.textContent = `dial ${Math.round(readingOf(dial)) % 100} · ${(((dial % 360) + 360) % 360).toFixed(1)}°${T >= BREAK_AT ? " · pod off" : ""}`;
}
// the film frame: a 1920x1080 #stage with the figure's plate scaled up inside it (vector art, so it stays sharp);
// the legend and caption under the card are page furniture and stay out of the frame
const W = 1920, H = 1080;
const frame = document.createElement("div");
frame.id = "stage";
frame.className = document.body.className;
Object.assign(frame.style, { position: "relative", width: W + "px", height: H + "px", overflow: "hidden", display: "grid", placeItems: "center", background: "var(--anatomy-card)" });
const plate = document.querySelector(".iso-plate");
// the card's corner labels are web furniture (a figure number, the title, a pointer hint): the film keeps only the readout,
// moved inside the title-safe area, and marks the drawing so smoke treats its engraved numerals as part of the object
plate.querySelectorAll('[data-corner="fig"], [data-corner="title"], [data-corner="hint"]').forEach((el) => (el.style.display = "none"));
Object.assign(readout.style, { position: "absolute", right: "120px", bottom: "80px", fontSize: "30px" });
stage.setAttribute("data-drawn", "");
plate.style.width = "1480px";
Object.assign(plate.style, { boxShadow: "none", border: "0", background: "transparent" });   // the web card's frame is not part of the film
frame.appendChild(plate);
frame.appendChild(readout);
document.body.prepend(frame);
document.querySelector("main").style.display = "none";
document.body.style.margin = "0";
const size = [W, H];
window.seek = seek;
window.configure = () => {};
window.timeline = () => ({ duration: DURATION, fps: 60, loop: false, beat: 0.5, bpm: 120, format: "16:9", formats: { "16:9": size }, styles: [], size, cues: [{ t: BREAK_AT, kind: "pop" }], cuts: [] });
seek(0);
