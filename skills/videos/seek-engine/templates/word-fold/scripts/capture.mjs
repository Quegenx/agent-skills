// [word-fold, scripts/capture.mjs] Headless capture over CDP, no Playwright package.
// usage: W=1920 H=1080 [F0=151] [EVAL="js"] node scripts/capture.mjs page.html outdir t1 t2 ...
// Node 22+ enables native WebSocket by default; the source only specified Node.
// https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V22.md
// CDP returns JS exceptionDetails and navigation errorText separately from RPC errors.
// The source did not check them or fail after the readiness poll expired.
// https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate
// https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigate
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [,, page, outdir, ...ts] = process.argv;
if (Number(process.versions.node.split('.')[0]) < 22 || typeof WebSocket !== 'function') throw new Error('word-fold: Node 22+ with native WebSocket is required.');
if (!page || !outdir || !existsSync(page)) throw new Error('word-fold: provide an existing HTML page and output directory.');
const F0 = Number(process.env.F0 || '151');
const W = Number(process.env.W || '1920'), H = Number(process.env.H || '1080');
if (!Number.isFinite(F0) || !Number.isInteger(W) || !Number.isInteger(H) || W <= 0 || H <= 0) throw new Error('word-fold: F0 must be finite; W/H must be positive integers.');
const times = ts.map(raw => {
  const value = Number(raw.startsWith('f') ? raw.slice(1) : raw);
  const t = raw.startsWith('f') ? (value - F0) / 30 : value;
  if (!raw || !Number.isFinite(t) || t < 0 || !/^(?:f)?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) throw new Error('word-fold: frame requests must be finite nonnegative seconds or reference frames.');
  return { raw, t };
});
// Explicit CHROME wins. Standard install paths come from the supplied helper.
// The original fixed Playwright cache revision was not general browser discovery.
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => existsSync(p));
if (!CHROME || !existsSync(CHROME)) throw new Error('word-fold: Chrome/Chromium was not found; set CHROME to its executable path.');
mkdirSync(outdir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 400);
const udd = mkdtempSync(path.join(tmpdir(), 'capchrome-'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ch, ws, id = 0, closed = false, spawnError;
const pending = new Map(), logs = [], pageErrors = [];
function rejectPending(error) {
  for (const p of pending.values()) { clearTimeout(p.timer); p.rej(error); }
  pending.clear();
}
function send(method, params = {}) {
  return new Promise((res, rej) => {
    if (ws.readyState !== WebSocket.OPEN) return rej(new Error('word-fold: Chrome connection closed.'));
    const i = ++id;
    const timer = setTimeout(() => { pending.delete(i); rej(new Error('word-fold: CDP timeout: ' + method)); }, 10000);
    pending.set(i, { res, rej, timer });
    try { ws.send(JSON.stringify({ id: i, method, params })); }
    catch (error) { clearTimeout(timer); pending.delete(i); rej(error); }
  });
}
async function evaluate(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error('word-fold: evaluated JavaScript failed: ' + JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
try {
  ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${udd}`, '--allow-file-access-from-files', `--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
  ch.once('error', error => { spawnError = error; rejectPending(error); });
  ch.once('close', () => { closed = true; rejectPending(new Error('word-fold: Chrome exited.')); });
  let url;
  const startupEnd = Date.now() + 50 * 150;
  while (Date.now() < startupEnd) {
    if (spawnError || closed) throw spawnError || new Error('word-fold: Chrome exited during startup.');
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1000) });
      const pages = await r.json();
      url = pages.find(x => x.type === 'page')?.webSocketDebuggerUrl;
      if (url) break;
    } catch {}
    await sleep(150);
  }
  if (!url) throw new Error('word-fold: Chrome debugging endpoint did not become ready.');
  ws = new WebSocket(url);
  ws.addEventListener('close', () => rejectPending(new Error('word-fold: Chrome socket closed.')));
  ws.addEventListener('error', () => rejectPending(new Error('word-fold: Chrome socket failed.')));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('word-fold: Chrome socket open timeout.')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    for (const event of ['error', 'close']) ws.addEventListener(event, () => { clearTimeout(timer); reject(new Error('word-fold: Chrome socket did not open.')); }, { once: true });
  });
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    }
    if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    if (m.method === 'Runtime.exceptionThrown') pageErrors.push(JSON.stringify(m.params.exceptionDetails));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const navigation = await send('Page.navigate', { url: pathToFileURL(path.resolve(page)).href + '?kcembed=1' });
  if (navigation.errorText) throw new Error('word-fold: navigation failed: ' + navigation.errorText);
  let ready = false;
  const readyEnd = Date.now() + 100 * 100;
  while (Date.now() < readyEnd) {
    if (pageErrors.length) throw new Error('word-fold: page exception: ' + pageErrors.join('\n'));
    ready = await evaluate('!!window.__kcReady');
    if (ready) break;
    await sleep(100);
  }
  if (!ready) throw new Error('word-fold: page readiness timeout.');
  for (const { raw, t } of times) {
    await evaluate(`window.__kcControl.seekAndPause(${t}); new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`, true);
    if (pageErrors.length) throw new Error('word-fold: page exception: ' + pageErrors.join('\n'));
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    writeFileSync(path.join(outdir, `${raw}.png`), Buffer.from(shot.data, 'base64'));
  }
  if (process.env.EVAL) console.log(JSON.stringify(await evaluate(process.env.EVAL)));
  if (logs.length) console.error(logs.join('\n'));
} finally {
  rejectPending(new Error('word-fold: capture finished.'));
  ws?.close();
  // https://nodejs.org/api/child_process.html#event-close
  // A kill request alone does not establish that the child has closed.
  if (ch && !closed) {
    ch.kill();
    await Promise.race([new Promise(r => ch.once('close', r)), sleep(1000)]);
    if (!closed) {
      ch.kill('SIGKILL');
      await Promise.race([new Promise(r => ch.once('close', r)), sleep(1000)]);
    }
  }
  if (!ch || closed) rmSync(udd, { recursive: true, force: true });
  else { console.error('word-fold: Chrome did not close; retained run profile: ' + udd); process.exitCode = 1; }
}
