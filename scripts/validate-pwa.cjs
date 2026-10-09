#!/usr/bin/env node
// Validates PWA integrity: manifests, service worker precache lists,
// shared script imports and service worker registration.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const SKIP = new Set(["Vivere-atque-FruiT", ".git", "node_modules", "docs", "Recycle", "build"]);
const errors = [];
const warnings = [];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(root, p);
const files = walk(root, []);

for (const f of files) {
  const base = path.basename(f);
  const dir = path.dirname(f);

  if (base === "service-worker.js" || base === "sw.js") {
    const src = fs.readFileSync(f, "utf8");
    const m = src.match(/(?:PRECACHE_URLS|PRECACHE|ASSETS|URLS_TO_CACHE|FILES)\s*=\s*\[([\s\S]*?)\]/);
    if (m) {
      for (const s of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
        const u = s[1].split("?")[0];
        if (!u.startsWith("./") || u === "./") continue;
        if (!fs.existsSync(path.join(dir, u))) {
          errors.push(`${rel(f)}: precache entry '${u}' does not exist (SW install would fail)`);
        }
      }
    }
  }

  if (base === "manifest.json" || base === "manifest.webmanifest") {
    let j;
    try { j = JSON.parse(fs.readFileSync(f, "utf8")); }
    catch (e) { errors.push(`${rel(f)}: invalid JSON`); continue; }
    for (const i of j.icons || []) {
      if (i.src && !/^(https?:|data:)/.test(i.src) && !fs.existsSync(path.join(dir, i.src))) {
        warnings.push(`${rel(f)}: icon '${i.src}' does not exist`);
      }
    }
  }

  if (base === "index.html") {
    const src = fs.readFileSync(f, "utf8");
    for (const s of src.matchAll(/<script[^>]+src=["'](\.\.?\/[^"']+)["']/g)) {
      const u = s[1].split("?")[0];
      if (!fs.existsSync(path.join(dir, u))) {
        errors.push(`${rel(f)}: script '${u}' does not exist`);
      }
    }
    if (fs.existsSync(path.join(dir, "service-worker.js")) && !/serviceWorker/.test(src)) {
      errors.push(`${rel(f)}: service-worker.js exists but is never registered`);
    }
  }
}

warnings.forEach((w) => console.warn("WARN  " + w));
errors.forEach((e) => console.error("ERROR " + e));
console.log(`PWA validation: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
