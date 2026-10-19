// Split from turn-audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { f2, f3 } from "./turn-audit-analysis.mjs";
import { orbit } from "./turn-audit-orbit.mjs";



export function orbitReport(result) {
  const lines = [];
  const skipped = (name, items) => (result.skipped ?? []).includes(name) && !items.length;
  const list = (name, items, text) => {
    if (skipped(name, items)) return lines.push(`${name}: skipped`);
    lines.push(`${name}: ${items.length}`);
    for (const item of items.slice(0, 40)) lines.push(`  ${text(item)}`);
  };
  list("separation", result.separation, (m) => `interlock ${m.a} × ${m.b} ${f2(m.margin)}: split, flats or a flush contact`);
  list("unseparated", result.unseparated, (m) => `${m.state}  ${m.a} × ${m.b} margin ${f2(m.margin)} while their hulls overlap${m.framed ? " (framed plane: the build's poses() missed this motion; add it to poses())" : ""}`);
  const cycleGroups = new Map();
  for (const c of result.cycles) {
    const key = `${c.layer}|${c.parts.join(", ")}`;
    if (!cycleGroups.has(key)) cycleGroups.set(key, { ...c, first: c.state, last: c.state, count: 0 });
    const g = cycleGroups.get(key);
    g.last = c.state;
    g.count++;
  }
  lines.push(skipped("cycles", result.cycles) ? "cycles: skipped" : `cycles: ${result.cycles.length}`);
  for (const g of [...cycleGroups.values()].slice(0, 20)) lines.push(`  ${g.layer}: ${g.parts.join(", ")} in ${g.count} state${g.count === 1 ? "" : "s"} from ${g.first} to ${g.last}: ${g.split ? `split ${g.split.part} on n = (${g.split.n.map((v) => v.toFixed(3)).join(", ")}), d = ${g.split.d.toFixed(3)} (the plane of the cycle edge with the largest margin, ${g.split.a} × ${g.split.b})` : "split one of them (T.split) on the plane of the cycle edge with the largest margin"}`);
  list("forced", result.forced, (c) => `${c.state}  ${c.layer}: ${c.forced} forced pick${c.forced === 1 ? "" : "s"}`);
  list("swaps", result.swaps, (s) => `${s.layer}: ${s.a} / ${s.b} swap at ${s.at} while overlapping ${f2(s.area)} px²`);
  list("layers", result.layers, (s) => s.text);
  list("rigid", result.rigid, (s) => `${s.kind}  ${s.text}`);
  list("swept", result.swept, (s) => s.text);
  list("posed", result.posed, (s) => s.text);
  list("folds", result.folds, (s) => s.text);
  list("self", result.self, (s) => s.text);
  list("crowding", result.crowding, (s) => s.text);
  list("endon", result.endon, (s) => s.text);
  list("coverage", result.coverage, (s) => s.text);
  list("depth", result.depth, (s) => s.text);
  list("continuity", result.continuity, (c) => `${c.part} (${c.group}) at ${f3(c.at)}: ${Object.entries(c.m).filter(([, v]) => typeof v === "string" || v > 0).map(([key, v]) => `${key} ${typeof v === "string" ? v : f3(v)}`).join(", ")}`);
  const s = result.stats;
  const w = s.continuity?.worst ?? {};
  if (!skipped("continuity", result.continuity)) lines.push(`worst tone step ${w.q ?? 0} · worst birth ${f2(w.birth ?? 0)} px² · worst dot α step ${f3(w.dot ?? 0)} · worst faded α step ${f3(w.fade ?? 0)} · merges ${w.merge ?? 0} · outline motion over bound ${f3(w.motion ?? 0)} px · halving ${s.continuity?.halvingFails ?? 0} of ${s.continuity?.halvingChecked ?? 0}`);
  lines.push(`order changes: ${s.changes ?? 0} states with swaps · ${s.orderStates ?? 0} order states · ${s.posedStates ?? 0} posed states · ${s.planes ?? 0} planes (tightest margin ${f3(s.tightest ?? 0)}) · depth oracle ${s.depthStates ?? 0} states, ${s.depthPairs ?? 0} overlapping pairs`);
  for (const change of result.changes ?? []) lines.push(`  ${change.family} at ${f3(change.x)}: ${change.count} pair${change.count === 1 ? "" : "s"} reorder (${change.pairs.join("; ")})`);
  lines.push(`turn audit · ${f2(s.seconds ?? 0)} s`);
  return lines.join("\n");
}


export const orbitFailures = (result) => ["separation", "unseparated", "cycles", "forced", "swaps", "layers", "rigid", "swept", "posed", "folds", "self", "crowding", "endon", "coverage", "depth", "continuity"].reduce((sum, key) => sum + result[key].length, 0);


export function orbitOrExit(T, R, P, { flag = "--audit", argv = process.argv, ...options } = {}) {
  if (!argv.includes(flag)) return null;
  const result = orbit(T, R, P, options);
  console.log(orbitReport(result));
  const count = orbitFailures(result);
  const skipped = result.skipped.length;
  const partial = skipped ? `${skipped} line${skipped === 1 ? "" : "s"} skipped by only` : "";
  const undersampled = result.quick ? "quick run, undersampled: the full run is the proof" : "";
  const notes = [partial, undersampled].filter(Boolean).join("; ");
  if (count) console.log(`turn audit failed: ${count} problem${count === 1 ? "" : "s"}${notes ? ` (${notes})` : ""}`);
  else if (notes) console.log(`turn audit ${skipped ? "partial" : "quick"}: no problems in what ran (${notes})`);
  else console.log("turn audit passed");
  if (count) process.exitCode = 1;
  return result;
}

export { eventsOf, posed } from "./turn-audit-analysis.mjs";

export { orbit } from "./turn-audit-orbit.mjs";
