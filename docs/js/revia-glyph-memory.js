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
    }
  ]),
  principles: Object.freeze([
    "Glyphy se ukládají a exportují v UTF-8; Revia je zobrazuje doslova.",
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
