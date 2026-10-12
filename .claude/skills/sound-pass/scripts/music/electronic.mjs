// electronic.mjs: an original dark-electronic launch bed synthesised in code: a minor-chord pad drone, a pitch-drop
// kick, offbeat hats, an eighth-note bass, noise risers and sub impacts. Sections sit on absolute times so the music
// turns with the picture (intro -> drive -> riser into the drop -> drop -> halftime finale -> outro).
//
//   node electronic.mjs out.wav --dur 20 --bpm 120 --root 45 --sections "intro:0-2,drive:2-7.5,riser:7.5-8.5,gate:8.5-11,drop:11-14,halftime:14-18,outro:18-20"
//
// section kinds: intro (pad and hats, no kick), drive (kick every beat, bass in eighths), riser (rising noise and a
// snare roll; the next section starts with an impact), gate (stuttered kicks, bass an octave up), drop (an impact,
// then drive), halftime (an impact, kick every two beats, long bass notes), outro (pad only, fading), silence.
// --root is the MIDI note of the key's root (45 = A2; the key is minor). Section times are seconds: put them on the
// film's beat grid.
import fs from 'node:fs'

const A = process.argv, opt = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d)
const OUT = A[2] && !A[2].startsWith('--') ? A[2] : 'electronic.wav'
const SR = 44100, DUR = parseFloat(opt('--dur', '20')), BPM = parseFloat(opt('--bpm', '120')), B = 60 / BPM
const ROOT = parseInt(opt('--root', '45'), 10)
const SECTIONS = opt('--sections', `drive:0-${DUR}`).split(',').map((s) => { const [k, r] = s.split(':'); const [a, b] = r.split('-').map(Number); return { k, a, b } })
const N = Math.floor(SR * DUR), L = new Float32Array(N), R = new Float32Array(N)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
let seed = 1
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const add = (t0, dur, fn, pan = 0) => {
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR)
  for (let i = 0; i < n; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; const v = fn(i / SR, i / n); L[j] += v * (1 - pan) * 0.5; R[j] += v * (1 + pan) * 0.5 }
}
const kick = (t) => add(t, 0.28, (ts, p) => Math.sin(2 * Math.PI * (140 - 95 * Math.min(1, ts * 9)) * ts) * Math.exp(-p * 7) * 1.6)
const hat = (t) => add(t, 0.045, (ts, p) => rnd() * Math.exp(-p * 10) * 0.18, 0.25)
const snare = (t, amp) => add(t, 0.12, (ts, p) => (rnd() * 0.8 + Math.sin(2 * Math.PI * 190 * ts) * 0.4) * amp * Math.exp(-p * 5), -0.1)
const bass = (t, m, dur) => add(t, dur, (ts, p) => { const f = hz(m); return (Math.sin(2 * Math.PI * f * ts) + Math.sin(2 * Math.PI * 3 * f * ts) / 3.5) * Math.min(1, ts * 90) * Math.exp(-p * 4) * 0.6 })
const impact = (t) => { add(t, 0.9, (ts, p) => Math.sin(2 * Math.PI * (60 - 25 * Math.min(1, ts * 3)) * ts) * Math.exp(-p * 4.5) * 1.8); add(t, 0.35, (ts, p) => rnd() * Math.exp(-p * 6) * 0.7) }
const pad = (a, b, level, fadeOut) => add(a, b - a, (ts) => {
  const chord = [ROOT + 12, ROOT + 15, ROOT + 19].reduce((s, m) => s + Math.sin(2 * Math.PI * hz(m) * ts) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 1.003 * ts), 0)
  const att = Math.min(1, ts / 1.5), rel = fadeOut ? Math.max(0, 1 - ts / (b - a)) : Math.min(1, (b - a - ts) / 0.3)
  return chord * level * att * rel
})
const PAT = [0, 0, 0, 0, 0, 0, 3, 7]   // bass in eighths: the root, then up to the third and fifth
const beats = (a, b, every = 1) => { const out = []; for (let k = Math.ceil(a / B - 1e-6); k * B < b - 1e-6; k += every) out.push(k * B); return out }

for (const [i, s] of SECTIONS.entries()) {
  const { k, a, b } = s, next = SECTIONS[i + 1]
  if (k === 'silence') continue
  if (k !== 'outro') pad(a, b, 0.05, false)
  if (k === 'intro') for (const t of beats(a, b)) hat(t + B / 2)
  if (k === 'drive' || k === 'drop') {
    if (k === 'drop') impact(a)
    for (const t of beats(a, b)) { kick(t); hat(t + B / 2) }
    for (let t = a, e = 0; t < b - 1e-6; t += B / 2, e++) bass(t, ROOT - 12 + PAT[e % 8], B / 2 * 0.85)
  }
  if (k === 'gate') {
    const steps = [0, 0.5, 1, 2, 2.5, 3.5, 4, 4.5]   // stuttered eighths with gaps, repeating every two bars
    for (let bar = a; bar < b - 1e-6; bar += 8 * B) for (const s8 of steps) if (bar + s8 * B < b - 1e-6) kick(bar + s8 * B)
    for (let t = a, e = 0; t < b - 1e-6; t += B / 2, e++) bass(t, ROOT + PAT[e % 8], B / 2 * 0.5)
    for (const t of beats(a, b)) hat(t + B / 2)
  }
  if (k === 'riser') {
    add(a, b - a, (ts, p) => rnd() * p * p * 0.8)
    for (let t = a; t < b - 1e-6; t += B / 4) snare(t, 0.15 + 0.5 * (t - a) / (b - a))
    if (next && next.k !== 'drop' && next.k !== 'halftime') impact(b)   // drop and halftime bring their own impact
  }
  if (k === 'halftime') {
    impact(a)
    for (const t of beats(a, b, 2)) { kick(t); hat(t + B) }
    for (const [j, t] of beats(a, b, 4).entries()) bass(t, ROOT - 12 + [0, 3, 0, 7][j % 4], 4 * B * 0.9)
  }
  if (k === 'outro') pad(a, b, 0.05, true)
}

let peak = 0
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
const g = 0.89 / (peak || 1), buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16)
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34)
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4) }
fs.writeFileSync(OUT, buf)
console.log(`${OUT}: ${DUR}s at ${BPM} BPM, ${SECTIONS.map((s) => s.k).join(' > ')}`)
