import { chromePort } from "./chrome-port.mjs";
import { HELPERS, ZBUFFER, POPS, PASSES, PERF } from "./turn-check-probes.mjs";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LINE_ENDS } from "./line-ends.mjs";

function usage() {
  console.log(`Checks for 3D figures (turning groups).

  node turn-check.mjs build.mjs --fidelity [--angles 7,37,…]
      Node: every live prism against k.extrude / G.prismOf, every round and lathe against G.lathe(smooth) and every tube
      against tubePieces, at P'(θ). Control: one prism drawn 2° off must fail.
  node turn-check.mjs page.html [--order] [--pops] [--lines] [--perf] [--passes] [--step 1] [--states states.json]
                                [--film] [--fps 60] [--width 1440] [--height 1100] [--scale 2] [--throttle 1] [--no-webgl] [--out dir]
      --order   needs a --verify build: the recorded shapes in a WebGL z-buffer (part-ID colours, 2x) against the live
                layers' fills in DOM order. Fails on any live pair with 4 or more interior pixels. Static × live mismatches
                are listed (the layer proofs and the orbit audit own them). Control: each live layer's order reversed at
                0, 90, 180 and 270 must give at least 1000 mismatched pixels.
      --pops    first difference θ → θ+0.02° at every step, and second difference at 0.1° over a full turn; control: one
                part's fill hidden for one frame must fail. Run with --no-webgl and the tour held.
      --lines   LINE_ENDS at 24 angles (run it on the light and the dark page); control: a planted floating line must fail.
      --perf    240 frames at 1.1° per frame driven through the controller inside requestAnimationFrame: script, task,
                style and layout per frame, frame interval median and p95, live elements, writes and moves per frame.
      --passes  the runtime's own pass check, beside the orbit audit: every state through the controller with the kit's debug collectors
                (globalThis.__t3unsep, globalThis.__t3forced) armed. Fails on any pair that passes through another (separating
                plane margin below -0.08, listed with its worst margin and where) and on any forced pick (listed by part).
                Fails too when stats() counts some but the collectors stay empty: the page inlines a kit without them.
                With --film it walks a seek(t) page instead: window.seek(n / fps) for every step of window.timeline().duration.
      --states  a JSON list of value objects to visit instead of angles (gestures, a break-apart, an explode path).
  The angle is the figure's first turn group (window.__isoTurn.set(θ)).`);
}

function chromePath() {
  const candidates = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  const playwright = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(playwright)) for (const dir of readdirSync(playwright).sort().reverse()) for (const sub of ["chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-linux/chrome"]) candidates.push(join(playwright, dir, sub));
  return candidates.find((path) => existsSync(path));
}

async function browser(target, { width, height, scale, throttle, noWebgl }) {
  const profile = mkdtempSync(join(tmpdir(), "turn-check-"));
  const chrome = spawn(chromePath(), ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank"]);
  const port = await chromePort(chrome, profile);
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const problems = [];
  socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    } else if (data.method === "Runtime.consoleAPICalled" && (data.params.type === "error" || data.params.type === "warning")) problems.push(`console.${data.params.type}: ${data.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ").slice(0, 400)}`);
    else if (data.method === "Runtime.exceptionThrown") problems.push(`exception: ${data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text}`.slice(0, 400));
  };
  await new Promise((done) => (socket.onopen = done));
  const send = (method, params = {}) =>
    new Promise((done) => {
      const call = ++id;
      pending.set(call, done);
      socket.send(JSON.stringify({ id: call, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.result?.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails).slice(0, 800));
    return result.result?.result?.value;
  };
  await send("Runtime.enable");
  await send("Page.enable");
  const NO_GL = `(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...rest){if(/webgl/.test(String(kind))&&!this.dataset.check)return null;return get.call(this,kind,...rest)}})();`;
  if (noWebgl) await send("Page.addScriptToEvaluateOnNewDocument", { source: NO_GL });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: width < 600 });
  if (throttle > 1) await send("Emulation.setCPUThrottlingRate", { rate: throttle });
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
  await send("Page.navigate", { url });
  await new Promise((done) => setTimeout(done, 1500));
  const close = () => {
    socket.close();
    chrome.kill("SIGKILL");
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };
  return { send, evaluate, close, problems };
}


async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(argv.length ? 0 : 1);
  }
  const value = (flag, fallback) => {
    const at = argv.indexOf(flag);
    return at >= 0 ? argv[at + 1] : fallback;
  };
  const target = argv[0];
  let failed = 0;
  if (target.endsWith(".mjs")) {
    const F = await import("./turn-fidelity.mjs");
    const { T, P } = await import(pathToFileURL(resolve(target)).href);
    const angles = (value("--angles", "") || Array.from({ length: 12 }, (_, i) => 7 + i * 30).join(",")).split(",").map(Number);
    const plant = T.parts.find((part) => part.kind === "prism" && part.group && part.group.kind === "turn");
    if (plant) {
      const control = F.identity(T, P, angles.slice(0, 2), { plant: plant.name });
      console.log(`control (${plant.name} drawn 2° off): ${control.pass ? "did not fail: the check is broken" : "fails as it should"}`);
      if (control.pass) failed++;
    }
    for (const [name, run] of [["prisms", F.identity], ["rounds", F.rounds], ["tubes", F.tubes]]) {
      const result = run(T, P, angles);
      console.log(result.text);
      for (const line of result.worst) console.log(`  ${line}`);
      if (!result.pass) {
        console.log(`${name} FAILED`);
        failed++;
      }
    }
    console.log(failed ? `fidelity failed: ${failed}` : "fidelity passed");
    process.exit(failed ? 1 : 0);
  }
  if (!["--order", "--passes", "--pops", "--perf"].some((flag) => argv.includes(flag))) throw new Error("Select --order, --passes, --pops or --perf; no browser check was selected");
  const options = { width: Number(value("--width", 1440)), height: Number(value("--height", 1100)), scale: Number(value("--scale", argv.includes("--perf") ? (Number(value("--width", 1440)) < 600 ? 3 : 2) : 1)), throttle: Number(value("--throttle", 1)), noWebgl: argv.includes("--no-webgl") };
  const step = Number(value("--step", 1));
  if (!Number.isFinite(step) || step <= 0 || step > 360) throw new Error("--step must be a finite number greater than 0 and at most 360 degrees");
  const fine = Number(value("--fine", 0.1));
  if (argv.includes("--pops") && (!Number.isFinite(fine) || fine <= 0 || fine > 180)) throw new Error("--fine must be a finite number greater than 0 and at most 180 degrees");
  const out = value("--out", null);
  const statesFile = value("--states", null);
  const states = statesFile ? JSON.parse(readFileSync(statesFile, "utf8")) : null;
  if (statesFile && (!Array.isArray(states) || !states.length)) throw new Error("--states must contain a nonempty JSON list of poses");
  const page = await browser(target, options);
  const labelOf = (state, index) => (typeof state === "number" ? `${state.toFixed(3)}°` : `state ${index}`);
  try {
    const info = await page.evaluate(HELPERS);
    console.log(`page ${info.W}×${info.H} · live layers ${info.layers.filter(Boolean).join(", ")} · theme ${info.theme}`);
    await page.evaluate(`window.__isoTurn.set(0) && 0`);
    const sweep = states ?? Array.from({ length: Math.round(360 / step) }, (_, i) => i * step);
    if (argv.includes("--order")) {
      const has = await page.evaluate("Boolean(window.__isoVerify)");
      if (!has) {
        console.log("order: this page has no window.__isoVerify; build it with --verify");
        failed++;
      } else {
        const z = await page.evaluate(ZBUFFER);
        console.log(`order: ${z.parts} live parts and ${z.statics} static items meshed, z-buffer ${z.w}×${z.h}`);
        let control = Infinity;
        for (const angle of [0, 90, 180, 270]) {
          const r = await page.evaluate(`window.__tc.order.check(${angle}, { reverse: true }).then((r) => r.live.reduce((s, p) => s + p.px, 0))`);
          control = Math.min(control, r);
        }
        console.log(`order control (each live layer reversed at 0, 90, 180, 270): least ${control} mismatched px ${control >= 1000 ? "· fails as it should" : "· did not fail: the check is broken"}`);
        if (control < 1000) failed++;
        const probe = value("--part", null);
        if (probe) for (const state of sweep.slice(0, 12)) console.log(`  ${probe} at ${JSON.stringify(state)}: ${JSON.stringify(await page.evaluate(`window.__tc.order.footprint(${JSON.stringify(state)}, ${JSON.stringify(probe)})`))}`);
        let bad = 0;
        const layerNotes = new Map();
        let worst = 0;
        for (let index = 0; index < sweep.length; index++) {
          const state = sweep[index];
          const r = await page.evaluate(`window.__tc.order.check(${JSON.stringify(state)})`);
          const errors = r.live.filter((p) => p.px >= 4);
          worst = Math.max(worst, ...r.live.map((p) => p.px), 0);
          if (errors.length) {
            bad++;
            if (bad <= 30) console.log(`  ${labelOf(state, index)}: ${errors.map((e) => `${e.painter} over ${e.truth} ${e.px} px`).join(" · ")}${r.stats.forced ? ` · forced ${r.stats.forced}` : ""}`);
          }
          for (const l of r.layers) if (l.px >= 16) layerNotes.set(`${l.painter} / ${l.truth}`, Math.max(layerNotes.get(`${l.painter} / ${l.truth}`) ?? 0, l.px));
        }
        console.log(`order: ${sweep.length} states · ${bad} with a live pair drawn out of order (4+ interior px at 2x) · worst live pair ${worst} px`);
        if (layerNotes.size) console.log(`  static × live (recorded static shapes are stand-ins; the layer proofs own these): ${[...layerNotes].slice(0, 8).map(([k, v]) => `${k} ${v}px`).join(" · ")}`);
        if (bad) failed++;
      }
    }
    if (argv.includes("--passes")) {
      const film = argv.includes("--film");
      let walk = sweep;
      let labelAt = (index) => labelOf(sweep[index], index);
      if (film) {
        const tl = await page.evaluate("typeof window.seek === 'function' && typeof window.timeline === 'function' ? window.timeline() : null");
        if (!tl) throw new Error("passes: --film needs a page with window.seek and window.timeline");
        const fps = Number(value("--fps", 60));
        if (!Number.isFinite(fps) || fps <= 0) throw new Error("--fps must be a finite number greater than 0");
        walk = Array.from({ length: Math.ceil(tl.duration * fps) }, (_, n) => n / fps);
        labelAt = (index) => `t=${walk[index].toFixed(3)} s`;
      }
      const r = await page.evaluate(`(${PASSES})(${JSON.stringify(walk)}, ${film})`);
      if (r.hookless) {
        console.log(`passes: stats() counted forced or unseparated in ${r.hookless} states but the collectors stayed empty: this page inlines a kit without __t3unsep and __t3forced; rebuild it`);
        failed++;
      }
      for (const p of r.pairs.slice(0, 30)) console.log(`  ${p.key}  margin ${p.margin.toFixed(2)} at ${labelAt(p.index)}`);
      for (const step of r.steps.filter((x) => x.forced).slice(0, 30)) console.log(`  ${labelAt(step.index)}: forced ${step.forced}${step.names.length ? ` (${step.names.join(", ")})` : ""}`);
      const forcedSteps = r.steps.filter((x) => x.forced).length;
      console.log(`passes: ${walk.length} ${film ? "frames" : "states"} · ${r.pairs.length} pairs pass through each other · ${forcedSteps} with forced picks`);
      if (r.pairs.length || forcedSteps) failed++;
    }
    if (argv.includes("--pops")) {
      await page.evaluate(POPS);
      if (out) await page.evaluate("window.__tcDump = true");
      const plantPart = await page.evaluate(`(() => { const svgs = [...document.querySelectorAll("svg[data-live]")]; const parts = [...svgs[svgs.length - 1].querySelectorAll("[data-p]")]; let best = null; let area = 0; for (const el of parts) { const b = el.getBBox(); if (b.width * b.height > area) { area = b.width * b.height; best = el; } } return best ? Number(best.dataset.p) : null; })()`);
      const plantAt = typeof sweep[0] === "number" ? 37 : sweep[0];
      const control = await page.evaluate(`window.__tc.pops.first(${JSON.stringify(plantAt)}, ${JSON.stringify(typeof plantAt === "number" ? plantAt + 0.02 : plantAt)}, ${plantPart})`);
      console.log(`pops control (part ${plantPart} hidden for one frame): ${control.n ? `${control.n} px flagged · fails as it should` : "nothing flagged: the check is broken"}`);
      if (!control.n) failed++;
      let firstBad = 0;
      const firstStates = states ?? Array.from({ length: Math.round(360 / step) }, (_, i) => i * step);
      for (let index = 0; index < firstStates.length; index++) {
        const a = firstStates[index];
        const b = typeof a === "number" ? a + 0.02 : firstStates[index + 1];
        if (b === undefined) break;
        const r = await page.evaluate(`window.__tc.pops.first(${JSON.stringify(a)}, ${JSON.stringify(b)})`);
        if (r.n) {
          firstBad++;
          if (firstBad <= 20) console.log(`  first difference ${labelOf(a, index)}: ${r.n} px survive two erosions in ${r.box.join(",")}`);
        }
      }
      console.log(`pops, first difference: ${firstStates.length} steps · ${firstBad} with a surviving region`);
      if (firstBad) failed++;
      if (!states) {
        let cores = 0;
        const small = [];
        for (let x = 0; x + 2 * fine <= 360 + 1e-9; x += fine) {
          const r = await page.evaluate(`window.__tc.pops.second(${x.toFixed(4)}, ${(x + fine).toFixed(4)}, ${(x + 2 * fine).toFixed(4)})`);
          if (r.n >= 6) {
            cores++;
            if (cores <= 20) console.log(`  second difference at ${(x + fine).toFixed(2)}°: core of ${r.n} px in ${r.box.join(",")}`);
          } else if (r.n) small.push(`${(x + fine).toFixed(2)}° ${r.n} px in ${r.box.join(",")}`);
        }
        console.log(`pops, second difference at ${fine}° over a full turn: ${cores} cores of 6+ px · ${small.length} small cores to read${small.length ? `: ${small.slice(0, 12).join(" · ")}` : ""}`);
        const dumped = out ? await page.evaluate("window.__tcDumped && typeof window.__tcDumped === 'object' ? window.__tcDumped : null") : null;
        if (dumped) {
          mkdirSync(out, { recursive: true });
          for (const [key, data] of Object.entries(dumped)) writeFileSync(join(out, `pops-core-${key}.png`), Buffer.from(data, "base64"));
          console.log(`  first core dumped to ${out}/pops-core-{a,b,c,e}.png`);
        }
        if (cores) failed++;
      }
    }
    if (argv.includes("--lines")) {
      const angles = Array.from({ length: 24 }, (_, i) => i * 15);
      const planted = await page.evaluate(`(() => { window.__isoTurn.set(0); const part = document.querySelector("svg[data-live] [data-p]"); const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("class", "iso-line"); el.setAttribute("data-tone", "lo"); el.setAttribute("d", "M5 5L25 9"); el.setAttribute("data-plant", ""); part.appendChild(el); const r = (${LINE_ENDS})({ select: null, show: false }); el.remove(); return r ? r.problems.length : -1; })()`);
      console.log(`lines control (a planted floating line): ${planted > 0 ? "fails as it should" : "nothing flagged: the check is broken"}`);
      if (!(planted > 0)) failed++;
      let bad = 0;
      for (const angle of angles) {
        const r = await page.evaluate(`(() => { window.__isoTurn.set(${angle}); const r = (${LINE_ENDS})({ select: null, show: false }); return r ? { n: r.problems.length, list: r.problems.slice(0, 4).map((p) => p.what + " " + p.end + " " + p.gap.toFixed(2) + " px at " + p.at.join(",")) } : null; })()`);
        if (r && r.n) {
          bad += r.n;
          console.log(`  ${angle}°: ${r.n} floating ends: ${r.list.join(" · ")}`);
        }
      }
      console.log(`lines: ${angles.length} angles · ${bad} floating ends`);
      if (bad) failed++;
    }
    if (argv.includes("--perf")) {
      await page.send("Performance.enable");
      const metrics = async () => Object.fromEntries((await page.send("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));
      const runs = [];
      for (let r = 0; r < 3; r++) {
        const before = await metrics();
        const result = await page.evaluate(`(${PERF})(240, 1.1, null)`);
        const after = await metrics();
        const per = (key) => ((after[key] - before[key]) * 1000) / result.frames;
        runs.push({ ...result, task: per("TaskDuration"), script: per("ScriptDuration"), style: per("RecalcStyleDuration"), layout: per("LayoutDuration") });
      }
      const med = (key) => runs.map((r) => r[key]).sort((a, b) => a - b)[1];
      console.log(`perf at ${options.width} px, DPR ${options.scale}, ${options.throttle}× CPU, median of 3 runs of 240 frames at 1.1°: set() ${med("setMedian").toFixed(2)} ms (p95 ${med("setP95").toFixed(2)}) · task ${med("task").toFixed(2)} ms · script ${med("script").toFixed(2)} ms · style ${med("style").toFixed(2)} ms · layout ${med("layout").toFixed(2)} ms per frame · frame interval ${med("gapMedian").toFixed(1)} ms (p95 ${med("gapP95").toFixed(1)}) · ${runs[0].live} live elements · ${med("writes")} writes and ${med("moved")} moves per frame`);
      if (out) {
        mkdirSync(out, { recursive: true });
        writeFileSync(join(out, `perf-${options.width}-${options.throttle}x.json`), JSON.stringify(runs, null, 1));
      }
    }
    console.log(page.problems.length ? page.problems.join("\n") : "console: clean");
    if (page.problems.length) failed++;
  } catch (error) {
    console.error(error);
    failed++;
  } finally {
    page.close();
  }
  console.log(failed ? `turn check failed: ${failed}` : "turn check passed");
  process.exit(failed ? 1 : 0);
}

if (typeof WebSocket === "undefined" && !process.execArgv.includes("--experimental-websocket")) {
  const child = spawn(process.execPath, ["--experimental-websocket", ...process.argv.slice(1)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  await main();
}
