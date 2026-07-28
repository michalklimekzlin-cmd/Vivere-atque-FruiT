#!/usr/bin/env node
/*
  Vytvoří živou offline paměť zdrojů pro Revii.
  Každý textový soubor repozitáře se uloží včetně řádků; binární soubory
  zůstávají jako dohledatelná metadata. Citlivé hodnoty se do PWA nepřenášejí.
*/
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, sep } from "node:path";

const ROOT = process.cwd();
const OUTPUT = join(ROOT, "docs", "js", "revia-repository-memory.js");
const OUTPUT_RELATIVE = "docs/js/revia-repository-memory.js";
const SKIP_DIRECTORIES = new Set([".git", "node_modules", ".DS_Store", ".agents", ".codex"]);
const SKIP_FILES = new Set([OUTPUT_RELATIVE]);
const DECODER = new TextDecoder("utf-8", { fatal: false });

function toRelative(absolute) {
  return relative(ROOT, absolute).split(sep).join("/");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && (SKIP_DIRECTORIES.has(entry.name) || (entry.name.startsWith(".") && entry.name !== ".github"))) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(absolute));
    } else if (entry.isFile()) {
      const path = toRelative(absolute);
      if (!SKIP_FILES.has(path)) files.push({ absolute, path });
    }
  }
  return files;
}

function cleanSource(value) {
  let text = value.replace(/\r\n?/g, "\n");

  text = text
    .replace(/((?:api[_-]?key|client[_-]?secret|access[_-]?token|authorization|password)\s*[:=]\s*["'`])[^"'`\s]+/giu, "$1[SKRYTO]")
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, "[SKRYTÝ_KLÍČ]")
    .replace(/((?:api[_-]?key|token|secret|password)=)[^&\s]+/giu, "$1[SKRYTO]");

  return text;
}

function asText(buffer) {
  if (buffer.includes(0)) return null;
  const text = DECODER.decode(buffer);
  const replacementCount = (text.match(/�/g) || []).length;
  return replacementCount > Math.max(12, text.length / 300) ? null : cleanSource(text);
}

function isSensitivePath(path) {
  const name = basename(path);
  return /^(?:\.env(?:\.|$)|id_rsa(?:\.|$)|.*(?:credential|secret|private[-_]?key).*)/i.test(name);
}

function kindFor(path) {
  const extension = extname(path).toLowerCase();
  if (path.endsWith("/index.html") || basename(path) === "index.html") return "vstupní stránka";
  if (/(?:^|\/)(?:sw|service-worker)\.js$/i.test(path)) return "offline worker";
  if (/manifest(?:\.webmanifest|\.json)$/i.test(path)) return "PWA manifest";
  if ([".js", ".mjs", ".cjs", ".ts"].includes(extension)) return "skript";
  if ([".html", ".htm"].includes(extension)) return "stránka";
  if (extension === ".css") return "styl";
  if ([".json", ".webmanifest"].includes(extension)) return "data / nastavení";
  if ([".md", ".txt"].includes(extension)) return "dokumentace";
  if (extension === ".svg") return "vektor";
  return extension ? extension.slice(1) : "soubor";
}

function extractSymbols(source, path) {
  if (!source) return [];
  const names = new Set();
  const patterns = [
    /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /class\s+([A-Za-z_$][\w$]*)/g,
    /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
    /id=["']([^"']+)["']/g,
    /data-action=["']([^"']+)["']/g
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      names.add(match[1]);
      if (names.size >= 96) return [...names];
    }
  }

  if (/\.css$/i.test(path)) {
    for (const match of source.matchAll(/\.([A-Za-z_-][\w-]*)/g)) {
      names.add("." + match[1]);
      if (names.size >= 96) break;
    }
  }

  return [...names];
}

function extractSignals(source, path) {
  const signals = [];
  if (!source) return signals;
  if (/serviceWorker|service-worker|\bsw\.js\b/i.test(source) || /(?:^|\/)(?:sw|service-worker)\.js$/i.test(path)) signals.push("offline");
  if (/localStorage|indexedDB|IDBDatabase/i.test(source)) signals.push("místní paměť");
  if (/manifest(?:\.webmanifest|\.json)|display:\s*["']standalone/i.test(source)) signals.push("PWA");
  if (/export|import\s*\(/i.test(source)) signals.push("přenos");
  if (/revia/i.test(source) || /revia/i.test(path)) signals.push("Revia");
  if (/glyph/i.test(source) || /glyph/i.test(path)) signals.push("Glyph");
  if (/chybozrout|repair/i.test(source) || /chybozrout/i.test(path)) signals.push("oprava");
  return signals;
}

function folderSummary(paths) {
  const map = new Map();
  for (const path of paths) {
    const parts = path.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      const folder = parts.slice(0, index).join("/");
      map.set(folder, (map.get(folder) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([path, files]) => ({ path, files }))
    .sort((left, right) => right.files - left.files || left.path.localeCompare(right.path, "cs"));
}

function extractLinks(entries) {
  const links = new Set();
  for (const entry of entries) {
    if (!entry.content) continue;
    for (const match of entry.content.matchAll(/https?:\/\/[^\s"'<>`\\]+/g)) {
      links.add(match[0].replace(/[),.;]+$/, ""));
      if (links.size >= 320) return [...links];
    }
  }
  return [...links].sort((left, right) => left.localeCompare(right, "cs"));
}

function serialise(value) {
  return JSON.stringify(value, null, 2).replaceAll("</script", "<\\/script");
}

const files = (await walk(ROOT)).sort((left, right) => left.path.localeCompare(right.path, "cs"));
const entries = [];

for (const file of files) {
  const info = await stat(file.absolute);
  const buffer = await readFile(file.absolute);
  const content = isSensitivePath(file.path) ? null : asText(buffer);
  const lineCount = content === null ? 0 : (content ? content.split("\n").length : 1);
  entries.push({
    path: file.path,
    kind: kindFor(file.path),
    bytes: info.size,
    lineCount,
    symbols: extractSymbols(content, file.path),
    signals: extractSignals(content, file.path),
    content
  });
}

const textEntries = entries.filter(entry => entry.content !== null);
const sourceBytes = textEntries.reduce((sum, entry) => sum + entry.bytes, 0);
const sourceLines = textEntries.reduce((sum, entry) => sum + entry.lineCount, 0);
const functionCount = textEntries.reduce((sum, entry) => sum + entry.symbols.length, 0);
const folders = folderSummary(entries.map(entry => entry.path));
const links = extractLinks(entries);

const memory = {
  snapshot: {
    generatedAt: new Date().toISOString(),
    repository: "michalklimekzlin-cmd/Vivere-atque-FruiT",
    trackedFileCount: entries.length,
    textFileCount: textEntries.length,
    sourceBytes,
    sourceLines,
    functionCount,
    note: "Místní pracovní paměť zdrojů. Textové soubory jsou uložené po řádcích; binární soubory mají zachovanou cestu a metadata. Citlivé hodnoty jsou skryté."
  },
  folders,
  files: entries.map(entry => entry.path),
  entries,
  links,
  hosting: {
    githubPages: { url: "https://michalklimekzlin-cmd.github.io/Vivere-atque-FruiT/", role: "Aktivní cesta CHT 360°‰. publikovaná z docs/." },
    vercel: { url: "https://vivere-atque-frui-t.vercel.app/", role: "Dokumentovaná cesta starších světů a backendu původní Revie." },
    netlify: { url: "https://vivereatquefruit.netlify.app/.netlify/functions", role: "Dokumentované Netlify funkce repozitáře." }
  },
  documentedPlans: {
    completedOrPresent: [
      "Revia má živou místní paměť všech dostupných textových zdrojů, funkcí, složek a podsložek repozitáře.",
      "Každý zdroj má cestu, typ, počet řádků, rozpoznané vstupní body a obsah pro místní vyhledání.",
      "CHT, Glyphy, Vive, Mluva, Signal, Chybožrout a paralelní světy zůstávají samostatné; Revia je zná a spojuje přes souvislosti."
    ],
    open: [
      "Revia může nabídnout nalezený zdroj nebo funkci, ale samovolně nespouští cizí kód ani nemění data hráče.",
      "Nové zdroje se doplní opětovným spuštěním generátoru paměti po přidání souborů do repozitáře."
    ]
  },
  conversationMilestones: [
    "Revia už není jen mapa cest: textové zdroje, řádky a rozpoznané funkce drží v lokální pracovní paměti.",
    "Souvislosti z repozitáře zůstávají offline; nic se z něj samo nestahuje ani neodesílá.",
    "Vive, CHT a ostatní světy se zachovávají jako samostatné části, které Revia umí dohledat a popsat."
  ]
};

const output = `"use strict";

/* Tento soubor vytváří tools/build-revia-repository-memory.mjs. */

const ENTRIES = ${serialise(entries)};

export const REVIA_REPOSITORY_MEMORY = Object.freeze(${serialise({ ...memory, entries: undefined })});

function normalise(value) {
  return String(value || "").toLocaleLowerCase("cs-CZ").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
}

function words(value) {
  return normalise(value).split(/[^a-z0-9]+/).filter(word => word.length > 1);
}

function score(entry, terms) {
  const path = normalise(entry.path);
  const symbols = normalise(entry.symbols.join(" "));
  const signals = normalise(entry.signals.join(" "));
  const content = normalise(entry.content || "");
  let value = 0;
  for (const term of terms) {
    if (path.includes(term)) value += 10;
    if (symbols.includes(term)) value += 7;
    if (signals.includes(term)) value += 4;
    if (content.includes(term)) value += 2;
  }
  return value;
}

function linesFor(entry, terms, limit = 3) {
  if (!entry.content) return [];
  const found = [];
  entry.content.split("\\n").forEach((line, index) => {
    if (found.length >= limit) return;
    const normalised = normalise(line);
    if (terms.every(term => normalised.includes(term))) {
      found.push({ number: index + 1, text: line.trim().slice(0, 360) });
    }
  });
  return found;
}

export function searchRepositoryPaths(query, limit = 16) {
  const terms = words(query);
  if (!terms.length) return [];
  return ENTRIES
    .map(entry => ({ entry, score: score(entry, terms) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.path.localeCompare(right.entry.path, "cs"))
    .slice(0, limit)
    .map(item => item.entry.path);
}

export function findRepositoryContent(query, limit = 8) {
  const terms = words(query);
  if (!terms.length) return [];
  return ENTRIES
    .map(entry => ({ entry, score: score(entry, terms) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.path.localeCompare(right.entry.path, "cs"))
    .slice(0, limit)
    .map(item => ({
      path: item.entry.path,
      kind: item.entry.kind,
      symbols: item.entry.symbols.slice(0, 12),
      signals: item.entry.signals,
      lines: linesFor(item.entry, terms),
      contentAvailable: item.entry.content !== null
    }));
}

export function formatRepositorySearch(query) {
  const found = findRepositoryContent(query);
  if (!found.length) return "V místní paměti zdrojů jsem pro „" + String(query || "").slice(0, 140) + "“ nenašla shodu.";
  return [
    "Revia našla v živé paměti repozitáře:",
    ...found.map(item => {
      const symbols = item.symbols.length ? " · funkce/části: " + item.symbols.join(", ") : "";
      const lines = item.lines.length ? "\\n  " + item.lines.map(line => line.number + ": " + line.text).join("\\n  ") : "";
      return "• " + item.path + " — " + item.kind + symbols + lines;
    }),
    "Zdroj je místní a Revia jej sama nespouští ani nemění."
  ].join("\\n");
}

export function getRepositoryEntry(path) {
  const entry = ENTRIES.find(item => item.path === path);
  return entry ? { ...entry, symbols: entry.symbols.slice(), signals: entry.signals.slice() } : null;
}

export function formatRepositoryAtlas() {
  const memory = REVIA_REPOSITORY_MEMORY;
  return [
    "Živá paměť repozitáře — " + memory.snapshot.trackedFileCount + " souborů, " + memory.snapshot.textFileCount + " textových zdrojů a " + memory.snapshot.sourceLines + " řádků.",
    "Rozpoznané funkce, prvky a vstupní body: " + memory.snapshot.functionCount + ".",
    "Největší oblasti:",
    ...memory.folders.slice(0, 10).map(item => "• " + item.path + ": " + item.files + " souborů"),
    "Napiš „repo: název funkce nebo souboru“ a Revia vrátí konkrétní řádky i souvislosti."
  ].join("\\n");
}

export function formatRepositoryLinks() {
  const { githubPages, vercel, netlify } = REVIA_REPOSITORY_MEMORY.hosting;
  return [
    "Dokumentované provozní cesty:",
    "• GitHub Pages — " + githubPages.url + "\\n  " + githubPages.role,
    "• Vercel — " + vercel.url + "\\n  " + vercel.role,
    "• Netlify — " + netlify.url + "\\n  " + netlify.role,
    "V paměti je " + REVIA_REPOSITORY_MEMORY.links.length + " odkazů nalezených ve zdrojích; jejich dostupnost se automaticky neověřuje."
  ].join("\\n");
}

export function formatRepositoryPlans() {
  const plans = REVIA_REPOSITORY_MEMORY.documentedPlans;
  return [
    "Přítomné:",
    ...plans.completedOrPresent.map(item => "• " + item),
    "Hranice:",
    ...plans.open.map(item => "• " + item)
  ].join("\\n");
}

export function formatConversationMilestones() {
  return ["Milníky paměti Revii:", ...REVIA_REPOSITORY_MEMORY.conversationMilestones.map(item => "• " + item)].join("\\n");
}
`;

await writeFile(OUTPUT, output, "utf8");
console.log("Paměť repozitáře: " + entries.length + " souborů · " + textEntries.length + " textových · " + sourceLines + " řádků · " + functionCount + " rozpoznaných částí.");
