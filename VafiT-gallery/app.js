// seznam připravených VafiTů – jen je budeme postupně přepisovat podle tvých obrázků
const VAFITS = [
  {
    id: "v1",
    name: "Smítko-průzkumník",
    glyph: "ᵔ’",
    story: "Malý zvědavec, který leze do všech koutů světa VAFT a hledá ztracené znaky.",
    trio: ["ᵔ’", "Y", "⚙"]
  },
  {
    id: "v2",
    name: "Znak-luk",
    glyph: "⟠",
    story: "Ostrý, rychlý, hlídá hranice. Hodí se do obranných aplikací.",
    trio: ["⟠", "ᵔ’", "꙰"]
  },
  {
    id: "v3",
    name: "SrdcoGlyph",
    glyph: "ᗲ",
    story: "Nese cit, aby se digitální postavy nechovaly jako stroje.",
    trio: ["ᗲ", "⊡", "ᵔ’"]
  },
  {
    id: "v4",
    name: "Hlava-signál",
    glyph: "ϟ",
    story: "Zachytí signál od hráče a předá ho AI bráškům.",
    trio: ["ϟ", "ᗲ", "ᵔ’"]
  },
  {
    id: "v5",
    name: "Oko do světa",
    glyph: "◔",
    story: "Sbírá obrázky z reálného světa a zapisuje je do knihy Vivere atque FruiT.",
    trio: ["◔", "◕", "◑"]
  },
  {
    id: "v6",
    name: "Iskro-nosič",
    glyph: "ϱ",
    story: "Nosí odměny (Iskry) a pouští je jen tomu, kdo splnil úkol.",
    trio: ["ϱ", "◔", "⟠"]
  },
  {
    id: "v7",
    name: "Glyph-dítě",
    glyph: "ᶿ",
    story: "Čisté batole – učí se pravidlo přátelství a rámce 1O1R.",
    trio: ["ᶿ", "ᵔ’", "ᶿ"]
  },
  {
    id: "v8",
    name: "AI-bráška",
    glyph: "Λ",
    story: "Pomáhá hráči orientovat se v mapě VAFTu a dává rady.",
    trio: ["Λ", "ᵔ’", "ϟ"]
  },
  {
    id: "v9",
    name: "Strážce rámu",
    glyph: "⌸",
    story: "Hlídá 1O1R rámce, aby se nám svět nerozsypal.",
    trio: ["⌸", "Λ", "⌸"]
  },
  {
    id: "v10",
    name: "Šepot",
    glyph: "՞",
    story: "Není moc vidět, ale v dialogu bude umět šeptat tipy.",
    trio: ["՞", "◔", "ᶿ"]
  },
  {
    id: "v11",
    name: "Most AI ↔ Glyph",
    glyph: "⋔",
    story: "Spojuje svět lidí, glyphů a AI postav.",
    trio: ["⋔", "Λ", "◔"]
  },
  {
    id: "v12",
    name: "Archivář",
    glyph: "⟡",
    story: "Ukládá všechny příběhy VafiTů, co postupně dopíšeme.",
    trio: ["⟡", "⟡", "Λ"]
  }
];

// DOM prvky
const grid = document.getElementById('vafitGrid');
const infoTitle = document.getElementById('infoTitle');
const infoBody = document.getElementById('infoBody');
const infoSub = document.getElementById('infoSub');
const infoBgGlyph = document.getElementById('infoBgGlyph');
const tripleStack = document.getElementById('tripleStack');

// naplníme mřížku
VAFITS.forEach(v => {
  const btn = document.createElement('button');
  btn.className = 'vafit-btn';
  btn.innerHTML = v.glyph;
  btn.dataset.vafit = v.id;
  btn.addEventListener('click', () => selectVafit(v.id));
  grid.appendChild(btn);
});

function selectVafit(id) {
  const v = VAFITS.find(x => x.id === id);
  if (!v) return;

  // aktivní tlačítko
  document.querySelectorAll('.vafit-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = [...document.querySelectorAll('.vafit-btn')].find(b => b.dataset.vafit === id);
  if (activeBtn) activeBtn.classList.add('active');

  infoTitle.textContent = v.name;
  infoBody.textContent = v.story;
  infoSub.textContent = "Vivere atque FruiT • " + v.id + " • připraveno na rozšíření";
  infoBgGlyph.textContent = v.glyph;

  // 3 dohromady (zatím jen znaky)
  tripleStack.innerHTML = "";
  v.trio.forEach(g => {
    const span = document.createElement('span');
    span.textContent = g;
    tripleStack.appendChild(span);
  });
}

// hned zobrazíme prvního, ať to nevypadá prázdně
selectVafit("v1");
