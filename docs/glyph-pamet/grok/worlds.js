                     
             
               
               
                    
               
               
  

/** Worlds taken from Vivere atque FruiT and the sibling repositories. */
export const WORLDS          = [
  {
    id: "jadro",
    name: "Jádro",
    mark: "(.°•)(•.°)",
    needles: ["(.°•)(•.°)"],
    home: "VIVERE_atque_FruiT_CORE.js",
    line: "Pozdrav sítě. Jádro otevírá spojení mezi uzly.",
  },
  {
    id: "hlavoun",
    name: "Hlavoun",
    mark: "(.°•)7",
    needles: ["(.°•)7", "Hlavoun"],
    home: "Hlavoun",
    line: "Potvrzení. Hlavoun přijme zprávu a kývne.",
  },
  {
    id: "planeta",
    name: "Planeta",
    mark: "(•.°)/",
    needles: ["(•.°)/", "Glyph-Planet"],
    home: "Glyph-Planet",
    line: "Sken. Glyph Planet čte stav sítě.",
  },
  {
    id: "revia",
    name: "Revia",
    mark: "(.•˘)",
    needles: ["(.•˘)", "Revia"],
    home: "Revia",
    line: "Klid. Revia uber tempo toku.",
  },
  {
    id: "pamet",
    name: "Paměť",
    mark: "ˇ'i'ˇ",
    needles: ["ˇ'i'ˇ", "fruiT_memory"],
    home: "fruiT_memory_system.js",
    line: "Svázaná zpráva. Krátká paměť se tu stává dlouhou.",
  },
  {
    id: "mezi",
    name: "Meziprostor",
    mark: "`i´",
    needles: ["`i´", "Meziprostor"],
    home: "Meziprostor-Core",
    line: "Echo z jiného světa se tu skládá dohromady.",
  },
  {
    id: "straz",
    name: "Stráž",
    mark: "`¡ऽ",
    needles: ["`¡ऽ", "Chybožrout", "chybozrout"],
    home: "vaft.chybozrout.js",
    line: "Chybožrout zvedne ochranu, když tok nesedí.",
  },
  {
    id: "brana",
    name: "Brána",
    mark: "7i.॰",
    needles: ["7i.॰•०ओ|’०)", "uloziste"],
    home: "uloziste",
    line: "Sklad a úložiště. Brána pouští paměť mezi světy.",
  },
  {
    id: "strep",
    name: "Střep",
    mark: "`,९,´",
    needles: ["`,९,´", "Ctverecek"],
    home: "Ctverecek-0001-Core",
    line: "Čtvereček drží fragment, než se poskládá.",
  },
  {
    id: "cht",
    name: "CHT",
    mark: "360‰",
    needles: ["360‰", "360°‰", "CHT 360", "cht360", "CHT360"],
    home: "cht360-batole",
    line: "CHT 360 drží kruh: vstup, paměť i výdej.",
  },
  {
    id: "symboly",
    name: "i’T",
    mark: "i’Ŧ",
    needles: ["i’Ŧ", "iT-symbols"],
    home: "iT-symbols-space",
    line: "Prostor symbolů. Nejmenší i’ je ping přítomnosti.",
  },
  {
    id: "anft",
    name: "ANFT",
    mark: "ANFT",
    needles: ["ANFT"],
    home: "www.ANFT.cz",
    line: "Druhý břeh stejného sadu, Vivere atque FruiT.",
  },
  {
    id: "ticho",
    name: "Ticho",
    mark: "-.-",
    needles: ["-.-"],
    home: "-.-",
    line: "Tři značky a pauza. Sem patří signál beze slov.",
  },
];

for (const world of WORLDS) {
  if (!world.needles.includes(world.mark)) world.needles.unshift(world.mark);
}

export function worldById(id        )                    {
  return WORLDS.find((world) => world.id === id);
}

export function worldTag(id        )         {
  return `svet:${id}`;
}

export function worldOfTag(tag        )                    {
  if (!tag.startsWith("svet:")) return undefined;
  return worldById(tag.slice(5));
}

function longestNeedle(world       )         {
  return world.needles.reduce((max, needle) => Math.max(max, needle.length), 0);
}

export function worldsIn(text        )           {
  const ranked = [...WORLDS].sort((a, b) => longestNeedle(b) - longestNeedle(a));
  let masked = text;
  const hits = new Set        ();
  for (const world of ranked) {
    const needle = [...world.needles].sort((a, b) => b.length - a.length).find((item) => item && masked.includes(item));
    if (!needle) continue;
    hits.add(world.id);
    masked = masked.split(needle).join(" ".repeat(needle.length));
  }
  return WORLDS.filter((world) => hits.has(world.id)).map((world) => world.id);
}

export function sigilSheet()         {
  return [
    "Sigily sadu Vivere atque FruiT. Když má paměť domov, vlož do bloku GLYPH jeden z nich:",
    "",
    ...WORLDS.map((world) => `${world.mark}  ${world.name}  ·  ${world.home}`),
    "",
    "Příklad:",
    "⟦GLYPH:grok|Pozdrav Hlavouna|síť⟧",
    "(.°•)7",
    "Uživatel chce, aby Hlavoun potvrzoval krátce.",
    "⟦/GLYPH⟧",
  ].join("\n");
}
