"use strict";

/*
  Místní pracovní slovník Glyphů a VaFiT.
  Zápisy jsou poznatky autora projektu, nikoli univerzální překladač.
  Revia je nikdy nemění a při nejasnosti se ptá na souvislost.
*/

export const REVIA_GLYPH_MEMORY = Object.freeze({
  title: "Glyphy a VaFiT — pracovní paměť",
  offline: true,
  rule: "Glyph je stopa významu v konkrétní souvislosti. Stejný znak se nesmí potichu přepsat na jiný význam.",
  notes: Object.freeze([
    {
      glyph: "‰",
      reading: "I’ll / I will",
      note: "Pracovní VaFiT poznatek od autora. Revia ho použije jako nabídnuté čtení, ne jako automatický překlad každého výskytu."
    },
    {
      glyph: "A = H",
      reading: "vazba A ↔ H",
      note: "Zapsaná pracovní rovnost/vazba. Její přesný kontext se zachovává u konkrétního Glyphu nebo slotu."
    },
    {
      glyph: "९נֶ",
      reading: "vlastní Glyph VaFiT",
      note: "Uchovat doslova včetně pořadí znaků; bez kontextu mu Revia nepřisuzuje pevný překlad."
    },
    {
      glyph: ",•ﾟ✧٩(ˊᗜˋ*)و✧ﾟ• ,",
      reading: "radostný / hybný ornament",
      note: "Živý výrazový Glyph. Význam může doplnit jeho pokojíček, slot nebo věta kolem něj."
    },
    {
      glyph: "(-_•)╦̵̵̿╤─",
      reading: "výraz / znak pozornosti",
      note: "Zachovat jako celek a nenormalizovat znaky. Revia si k němu může připojit jen uživatelem potvrzenou poznámku."
    },
    {
      glyph: "९נֶ ._;´/`",
      reading: "ASCII a kombinovaný zápis",
      note: "Interpunkce, mezery, apostrof a zpětný apostrof jsou součástí zápisu. Při exportu se nic nemění ani neodstraňuje."
    },
    {
      glyph: "CHT 360°‰.",
      reading: "znak hlavního oběhu",
      note: "Název a sigil místní PWA. Revia jej nevydává za běžné slovo; drží ho jako přesný projektový zápis."
    },
    {
      glyph: "7O7°‰.",
      reading: "vlastní projektový Glyph",
      note: "Zachovat beze změny velké O, číslice i tečky. Význam zůstává u autora a jeho konkrétního kontextu."
    },
    {
      glyph: "101% - 7O7%",
      reading: "pracovní vztah dvou značek",
      note: "Zápis se ukládá doslova včetně mezer, pomlčky a procent. Revia mu bez další souvislosti nepřidává skrytý význam."
    },
    {
      glyph: "९נֶ ​._;´/``",
      reading: "rozšířený vlastní Glyph",
      note: "Jemná mezera i dvojitý zpětný apostrof patří k zápisu. Při přenosu se zachovává UTF-8 podoba, ne zjednodušená náhrada."
    },
    {
      glyph: "(∩^o^)⊃━☆ﾟ.*･｡",
      reading: "pohybový a radostný Glyph",
      note: "Celý obrazec je jeden znakový celek. Revia může uložit větu kolem něj, ale samotný Glyph nerozděluje."
    },
    {
      glyph: "•ア",
      reading: "krátká koncová značka",
      note: "Krátký vlastní podpisový Glyph. Jeho vyznění se bere z věty nebo slotu, kde byl uložen."
    },
    {
      glyph: "7/",
      reading: "samostatný pracovní Glyph",
      note: "Revia jej zapisuje a hledá doslova jako vlastní znak. Jeho čtení ani význam nedoplňuje bez věty, slotu nebo uživatelem potvrzené souvislosti."
    },
    {
      glyph: "^ˇ^ˇv<>vVvw",
      reading: "šelestový / pohybový Glyph",
      note: "Celý řetězec je jeden Glyph. Háčky, šipky, velikost písmen a opakování v zůstávají přesně v tomto pořadí."
    },
    {
      glyph: "MámŠelesti",
      reading: "slovní Glyph se šelestí",
      note: "Psaní velkého Š uvnitř slova je součástí záznamu. Revia jej nenormalizuje na obyčejné s ani nerozděluje bez souvislosti."
    },
    {
      glyph: "Havaj · jH = Ť · ava → Ťava",
      reading: "VaFiT jazyková proměna",
      note: "Pravidlo zapsané autorem: dvojice jH se v této konkrétní hře vazeb vynechá a její stopa se vloží před ava, čímž vznikne Ťava — velbloud. Revia to drží jako místní jazykové pravidlo, ne jako obecné pravidlo češtiny."
    }
  ]),
  principles: Object.freeze([
    "Glyphy se ukládají a exportují v UTF-8; Revia je zobrazuje doslova.",
    "Znak z dlouhého podržení klávesy se vloží příkazem „Glyph: …“; Revia zachová jeho přesnou Unicode podobu.",
    "Bez potvrzené souvislosti Revia neprohlašuje, že zná jediný správný význam Glyphu.",
    "Novou souvislost lze připsat do Paměti nebo pokojíčku; Revia ji v tomto zařízení uvidí jako novou událost.",
    "Tato slovní zásoba nevyžaduje síť ani externí AI službu."
  ])
});

function normalise(value) {
  return String(value || "")
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findGlyphNotes(query) {
  const raw = String(query || "");
  const text = normalise(raw);

  return REVIA_GLYPH_MEMORY.notes.filter(item => {
    const token = normalise(item.glyph);
    const haystack = normalise(`${item.glyph} ${item.reading} ${item.note}`);
    return raw.includes(item.glyph) || (token.length > 1 && text.includes(token));
  });
}

export function formatGlyphMemory(query = "") {
  const found = findGlyphNotes(query);
  const notes = found.length ? found : REVIA_GLYPH_MEMORY.notes;

  return [
    REVIA_GLYPH_MEMORY.title,
    "Pravidlo: " + REVIA_GLYPH_MEMORY.rule,
    ...notes.map(item => `• ${item.glyph} — ${item.reading}\n  ${item.note}`),
    "Zásady:",
    ...REVIA_GLYPH_MEMORY.principles.map(item => "• " + item)
  ].join("\n");
}
