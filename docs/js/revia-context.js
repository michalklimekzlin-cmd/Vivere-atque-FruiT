"use strict";

import {
  REVIA_REPOSITORY_MEMORY,
  formatConversationMilestones,
  formatRepositoryAtlas,
  formatRepositoryLinks,
  formatRepositoryPlans,
  searchRepositoryPaths
} from "./revia-repository-memory.js";
import {
  REVIA_GLYPH_MEMORY,
  findGlyphNotes,
  formatGlyphMemory
} from "./revia-glyph-memory.js";

export {
  REVIA_REPOSITORY_MEMORY,
  REVIA_GLYPH_MEMORY,
  findGlyphNotes,
  formatGlyphMemory,
  formatConversationMilestones,
  formatRepositoryAtlas,
  formatRepositoryLinks,
  formatRepositoryPlans,
  searchRepositoryPaths
};

/*
  Projektová paměť Revia
  ----------------------
  Je to ručně ověřená mapa aktivního CHT a jeho širšího repozitáře.
  Neobsahuje soukromý chat ani obsah uživatelových slotů. Díky tomu je
  přenositelná, malá a bezpečná pro offline PWA.
*/

export const CHT_PROJECT_CONTEXT = Object.freeze({
  title: "CHT 360°‰.",
  kind: "místní PWA jádro v repozitáři Vivere-atque-FruiT",
  principle: "Paměť, Glyphy, pokojíčky a iPhone 14 mají společný klidný oběh; uživatel rozhoduje, co se uloží a kam vede odkaz.",
  storage: "Aktivní CHT ukládá data do místního úložiště tohoto prohlížeče. Paměť lze vyexportovat a importovat; jiné domény ani jiné instalace PWA data automaticky nesdílejí.",
  activeModules: Object.freeze([
    { name: "Hlavní CHT 360°‰.", path: "./", role: "3D oběh, čtyři jádra Paměti, iPhone 14 a centrální ovládání." },
    { name: "Paměť", path: "./js/aplikace.js", role: "Čtyři jádra: Země, Jazyk, Hra a Řízení/iPhone; aktuální schéma má 70 slotů na jádro." },
    { name: "Glyph dílna", path: "./glyph-cht-360/", role: "Živé Glyphy a bubínky, vlastní znaky, export a import." },
    { name: "Glyph pokojíčky", path: "./glyph-pokojicku-cht-360/", role: "Chodba a pokojíčky pro navázání Glyphů; Glyph nezůstává bez místa." },
    { name: "Bubínky", path: "./bubinky/", role: "Samostatný nástroj bubínků a zámků slotů." },
    { name: "NeČEŠTINA", path: "./necesstina-cht-360/", role: "Místní paměť souvislostí vět a jejich stop, bez domnělého překladu." },
    { name: "Signal 360°‰.", path: "./signal-360/", role: "Samostatná signálová věž s napojením na paměťové cesty." },
    { name: "Jádra — pracovní deska", path: "./cht360-jadra-pracovni-deska/", role: "Pracovní pohled na jádra CHT." },
    { name: "Chybožrout", path: "./js/cht-chybozrout.js", role: "Kontrola souborů a bezpečná záloha před opravou." },
    { name: "Revia", path: "./js/revia-dock.js", role: "Místní průvodkyně oběhem, projektová paměť a deník událostí tohoto zařízení." }
  ]),
  repositoryAtlas: Object.freeze([
    { area: "Aktivní nasazení", folders: "docs/", note: "GitHub Pages PWA CHT a její propojené moduly." },
    { area: "Fru'i¡'T jádro", folders: "VIVERE_atque_FruiT_CORE.js, fruiT_learning_engine.js, fruiT_memory_system.js, agents.js a vaft.*.js", note: "Původní jádro, učení, paměť a rodina browserových agentů repozitáře." },
    { area: "Studio a výuka", folders: "TEACHER_STUDIO.html, vivere-studio/", note: "Pracovní rozhraní pro lekce a sémantické vazby ve starší infrastruktuře projektu." },
    { area: "Světové a experimentální aplikace", folders: "worlds/, Revia/, Revia-Master/, Vivere/, pwa-app/, apps/", note: "Dřívější a paralelní světy, rozhraní a prototypy." },
    { area: "Jádro a síť", folders: "core/, src/, engine.pismenka/, fruiT-jadro/, uloziste/, oblak+motor/, oblak-side/", note: "Základní experimenty Paměti, motoru, úložiště a propojení." },
    { area: "Komponenty a péče", folders: "components/, guardian/, chybozrout-opravar/, fallback/", note: "Stavební prvky, pravidla, diagnostika a záložní cesty." },
    { area: "Mapa a vizuální oběh", folders: "mapa/, mapa-3d/, RingPlanetGrid/, Glyph-Planet/, Glyph-Planet-3D/", note: "Mapy, prstence, planety a prostorové pokusy." },
    { area: "Dokumentace", folders: "README.md, KNOWLEDGE_MAP.md, ARCHITECTURE.md, ROADMAP.md a docs/*.md", note: "Záměr světa, architektura, návody a další kroky." }
  ]),
  milestones: Object.freeze([
    "Základ CHT vznikl jako modulární Paměť se čtyřmi jádry, místním ukládáním a exportem/importem.",
    "Glyph CHT se rozvinul do dílny živých bubínků: skládání znaků, vlastní Glyphy a bezpečné propojení s Pamětí.",
    "Pokojíčky přidaly prstenec a chodbu, aby vytvořený Glyph dostal dohledatelné vlastní místo.",
    "iPhone 14 se stal připojeným bodem v oběhu; jeho odkazy zůstávají pod kontrolou uživatele.",
    "Chybožrout získal sken, zálohu a bezpečnou samoopravu místo slepých zásahů do dat.",
    "Hlavní pohled byl vrácen k černo-zlatému krajinnému oběhu pro iPhone 14; Revia je součástí indexu, ne cizí odkaz mimo CHT.",
    "Revia nyní drží tuto mapu repozitáře a na tomto zařízení zapisuje nové události CHT do vlastního malého deníku."
  ])
});

function normalise(value) {
  return String(value || "")
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findProjectContext(query) {
  const words = normalise(query).split(/[^a-z0-9]+/).filter(word => word.length > 2);
  if (!words.length) return CHT_PROJECT_CONTEXT.activeModules.slice();

  return CHT_PROJECT_CONTEXT.activeModules.filter(module => {
    const haystack = normalise(`${module.name} ${module.path} ${module.role}`);
    return words.some(word => haystack.includes(word));
  });
}

export function formatProjectHistory() {
  return [
    "Projektová paměť CHT 360°‰.",
    "• Paměť: čtyři jádra, místní uložení, export/import.",
    "• Glyph: dílna bubínků; pokojíčky drží Glyphy dohledatelné.",
    "• Oběh: iPhone 14, Signal, NeČEŠTINA, pracovní jádra a Chybožrout.",
    "• Současný vzhled: černo-zlatý prostor pro iPhone 14, Revia přímo v hlavním CHT.",
    "• Tahle Revia si navíc vede malý místní deník nových změn."
  ].join("\n");
}

export function formatRepositoryMap() {
  return formatRepositoryAtlas();
}
