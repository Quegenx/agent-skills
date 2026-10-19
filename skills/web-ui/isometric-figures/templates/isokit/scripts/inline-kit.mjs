import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = join(dirname(fileURLToPath(import.meta.url)), "..", "kit");
const imports = /^import\s+(.+?)\s+from\s+["'](.+?)["'];?\s*$/gm;
const reexports = /^export\s*\{([^}]+)\}\s*from\s*["'](.+?)["'];?\s*$/gm;

// These source modules use one-line static imports. Visit dependencies once,
// before their consumer, then remove module syntax for a classic inline script.
function sourceClosure(file, external = new Set()) {
  const seen = new Set();
  const visit = (path) => {
    if (seen.has(path) || external.has(path)) return "";
    seen.add(path);
    const source = readFileSync(path, "utf8");
    const dependencies = [...source.matchAll(imports)].map((match) => match[2]);
    dependencies.push(...[...source.matchAll(reexports)].map((match) => match[2]));
    const before = dependencies.map((name) => visit(resolve(dirname(path), name))).join("\n");
    const body = source.replace(imports, "").replace(reexports, "")
      .replace(/^export\s*\{[^}]+\};?\s*$/gm, "")
      .replace(/^export /gm, "");
    return before + "\n" + body;
  };
  return visit(join(KIT, file));
}

export function kitScript() {
  return sourceClosure("iso-kit.mjs");
}

export function glScript() {
  return sourceClosure("gl.mjs");
}

export function turnScript() {
  return sourceClosure("turn.mjs");
}

export function fixedScript() {
  return sourceClosure("turn-fixed.mjs") + "\n" + sourceClosure("canvas-painter.mjs");
}

export function glSharedScript() {
  return glScript();
}

// kitScript() must precede this closure: cameraOf, iso and pathOf are supplied
// by that kit. Keep the G namespace used by the original arcade builder.
export function latheScript() {
  const entry = readFileSync(join(KIT, "lathe.mjs"), "utf8");
  const names = new Set([...entry.matchAll(/^export (?:function|const) (\w+)/gm)].map((match) => match[1]));
  for (const match of entry.matchAll(reexports)) {
    for (const name of match[1].split(",")) names.add(name.trim());
  }
  const body = sourceClosure("lathe.mjs", new Set([join(KIT, "iso-kit.mjs")]));
  return "const G = (() => {\n" + body + "\nreturn { " + [...names].join(", ") + " };\n})();";
}

// ISO_CSS is the single definition; iso.css is its generated standalone mirror.
export function writeIsoStylesheet(path = join(KIT, "iso.css")) {
  const source = readFileSync(join(KIT, "iso-kit.mjs"), "utf8");
  const css = /export const ISO_CSS = `([\s\S]*?)`;/u.exec(source)[1];
  writeFileSync(path, "/* Generated from ISO_CSS in iso-kit.mjs by writeIsoStylesheet(). */\n" + css);
}
