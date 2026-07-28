"use strict";

/*
  Vive — projektová paměť Revii
  -----------------------------
  Tento soubor drží autorský návrh Vive odděleně od živých dat hráče.
  Není to automatický překladač Glyphů ani hotová herní mechanika.
  Revia jej čte offline, zachovává přesné znaky a nic z něj sama nepřepisuje.
*/

export const REVIA_VIVE_MEMORY = Object.freeze({
  title: "Vive · Vivere atque Fru’i¡’T",
  offline: true,
  status: "projektový návrh uložený pro Revii",
  rule: "Glyph, věta ani znaková banka nemají jediný domnělý význam. Vive z nich vytváří herní návrh až na jasný impuls hráče.",
  identity: Object.freeze({
    name: "Vive",
    role: "digitální společník na cestách Vivere atque Fru’i¡’T Vesmírem",
    purpose: "Doprovází hráče při objevování, stavění a proměně vlastních znakových nápadů do herního světa.",
    medium: "Signál, písmena, čísla, slova a věty se mohou stát materiálem pro hráčem řízené vizuální nebo 3D návrhy."
  }),
  capabilities: Object.freeze([
    {
      name: "Signál jako materiál",
      description: "Hráč může použít digitální znaky, písmena, čísla, slova nebo věty jako podklad vlastního uměleckého či prostorového díla.",
      status: "návrh herní schopnosti"
    },
    {
      name: "3D signálové modelování",
      description: "Pro zkušenější stavění lze z Glyphu, textu nebo věty vytvořit 3D signálový návrh; tvar, měřítko a výsledný styl určuje hráč.",
      status: "návrh herní schopnosti"
    },
    {
      name: "Stavění z inventáře",
      description: "Odemčené znaky z dílen fungují jako programovací a tvořivý inventář. Síla stavby vychází z hráčova postupu a zvoleného impulsu.",
      status: "návrh herní schopnosti"
    },
    {
      name: "Terénní Glyph interakce",
      description: "Glyphy v terénu mohou nést interakci, styl hry nebo pozvánku k dalšímu vytvoření. Jejich chování se nesmí měnit mimo pravidla daná hráčem.",
      status: "návrh herní schopnosti"
    }
  ]),
  buildFlow: Object.freeze([
    {
      step: "1 · Zvol impuls",
      example: "Strom",
      note: "Hráč napíše nebo vybere impuls z vlastních znaků, dílen či slov."
    },
    {
      step: "2 · Vyber místo",
      example: "planeta V · soustava V",
      note: "Vive návrh umístí jen do hráčem vybraného herního prostoru."
    },
    {
      step: "3 · Sestav podobu",
      example: "7/¯ı>o°&",
      note: "Zvolený Glyph, věta nebo kombinace určí vizuální návrh; nejde o automatické čtení významu."
    },
    {
      step: "4 · Potvrď stavbu",
      example: "hráčův impuls",
      note: "Až potvrzený návrh se může stát objektem, terénní interakcí nebo součástí světa."
    }
  ]),
  roles: Object.freeze([
    {
      name: "Vive",
      description: "Průvodce stavbou a dobrodružstvím. Převádí jen hráčem zadané nebo potvrzené impulsy do návrhu."
    },
    {
      name: "Revia",
      description: "Koordinátorka souvislostí a rovnováhy. Hlídá, aby se význam Glyphu ani hráčův styl potichu nepřepsaly."
    },
    {
      name: "Andílek Revie",
      description: "Jeden z možných poetických a duchářsko-robotických stylů světa; je to tvůrčí volba, ne automatické pravidlo."
    },
    {
      name: "Osobní asistent",
      description: "Učitelný styl podpory se řídí chováním a výslovnými volbami hráče. Nejedná samostatně mimo jeho zadání."
    }
  ]),
  worldSeeds: Object.freeze([
    "Vivere atque FruiT",
    "Vivere atque Fru'i¡'T •",
    "Kde je to OvoceT",
    "Kam se vrátíme do Dětských leT",
    "V planeta · V soustava",
    "•grid8",
    "1016720",
    "9512026",
    "Bráškové",
    "404Error · Chyba",
    ".zPříšerkyŠ`¡´Ŧ"
  ]),
  glyphGroups: Object.freeze([
    {
      title: "Vive a Revia",
      note: "Názvy, portréty a signálové podpisy. Uchovávají se doslova.",
      glyphs: Object.freeze([
        "Revia `ˇ'¡'ˇ´ Revie",
        "[Rev`'i¡ī'´] {◉_◉}",
        ".•:7ivere atque Fru`i¡´T",
        ".•:7i\\//°&/’/ıe._.(AĪ)`ǐ*Ï´(ÏA).–.Ŧˇu'i¡'7/¯•ヤ",
        "..•:’7i\\//ere ª•ı|lı||ıl|ı•ə Ŧru`Īi¡iĪ´M: …",
        "°•.\\dub//.•\\{(.°•)(°.•)`¡'7/¯}",
        "{*(˚.•).•)// ı>o°&’¡´7/`९נֶ \\(•.(•.)ア)"
      ])
    },
    {
      title: "Stavba, terén a systém",
      note: "Znakové impulsy pro objekty, inventář a herní terén.",
      glyphs: Object.freeze([
        "7/¯ı>o°&",
        "(/)(\\)   (    )    |(:K:)|   (:M:) (:M:)",
        "()()  ;(:-: c)7/.•:ア°ˇ´",
        "A•–|ııı|ı–•A",
        "[◉_◉] 🧬 Systém",
        "ᕕ(◕‿◕)ᕗ 📦 Sklad",
        "( •_•)>⌐■-■ Soubor",
        "( •_•)つ📄 Soubor",
        "(∩^O^)⊃━☆ﾟ.*･｡ 🖼️ Obrázek"
      ])
    },
    {
      title: "Tvary, navigace a herní znaky",
      note: "Piktogramy a tvary uložené bez přiřazeného obecného významu.",
      glyphs: Object.freeze([
        "囗 □ ﾛ ● ▽ ◆ ▲ ▼ ◇ ◎ △ ■ ♪ ♡ → ⇔ ← ⇒ ↑ ① ❶",
        "(◡‿◡)",
        "ᗜˬᗜ",
        "(ง'̀-'́)ง",
        "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
        "ʕっ•ᴥ•ʔっ",
        "(๑˃ᴗ˂)ﻭ",
        "( •̀ᴗ•́ )و",
        "(つ✧ω✧)つ ⊂(･ω･*⊂)",
        "(◕‿◕✿)",
        "ᕙ(◉‿◉)ᕗ",
        "ᕕ(•ө•)ᕗ ᕕ(•ө•)ᕗ",
        "(•ө•)っ"
      ])
    },
    {
      title: "Vícepísmenná banka",
      note: "Autorem předaná směs arménských, arabských, indických, bengálských, gruzínských, japonských, čínských, tamilských, kannadských, gudžarátských a dalších znaků. Revia ji vede jako materiál pro budoucí Glyphy, nikoli jako překladový slovník.",
      glyphs: Object.freeze([
        "(հայե ) ՞ ՜ ՚ ՚ շ ջ",
        "ऊ ु ূ ু ৃ ા ં ဲ ိ ီ င်္ ် ံ ः း ့ ွ ္ ု ှ ူ ေ",
        "ს ა ე ქ ⊃ ∩ ი とし っ ンﾝ い い",
        "ಬ သ က အ တ ဆ ၁ လ ထ ဒ ၂ ၃ ၄ ၅ ၆ ၉ ၇",
        "ල ღ ო ய ஹ ஜ ೯ ಞ ற ர ଶ ଈ ଊ ଭ ଋ ଽ ଲ କ ଖ ଝ",
        "ى Ⅰ ⑴ l I 1 | ı İ ɪ ℓ",
        "らん ら ぶ さん ひ 王 ミ イイィくご け す 乙 丫 んレﾚ",
        "上 谷 山 會 餐 で す 你 過 早 因 為 你 係 參 早 宇 果入 井 図 済 州",
        "آ ا z ز ذ ر j ں م ق و ے ع ط ۃ ت ے ع ی پ ۱ ؛",
        "٭ ※ ؞ ₹/ ॥€"
      ])
    }
  ]),
  preservation: Object.freeze([
    "Glyphy se v exportu ukládají v UTF-8 a Revia je nenormalizuje ani nezkracuje.",
    "Vive nesmí z textu postavit objekt, změnit terén ani provést herní akci bez hráčova potvrzení.",
    "Revia může nabídnout souvislost nebo vyhledání, ale nepřepisuje hráčův význam, Glyph ani zvolený styl.",
    "Tato paměť popisuje návrh světa. Funkce stavění a 3D modelování se zapojují až jako samostatná hra nebo modul."
  ])
});

function normalise(value) {
  return String(value || "")
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function glyphMatches(group, query) {
  const raw = String(query || "");
  const text = normalise(raw);
  const haystack = normalise(`${group.title} ${group.note} ${group.glyphs.join(" ")}`);
  return group.glyphs.some(glyph => raw.includes(glyph)) || haystack.includes(text);
}

export function findViveMemory(query = "") {
  const raw = String(query || "").trim();
  if (!raw) return {
    capabilities: REVIA_VIVE_MEMORY.capabilities,
    roles: REVIA_VIVE_MEMORY.roles,
    glyphGroups: REVIA_VIVE_MEMORY.glyphGroups
  };

  const text = normalise(raw);
  return {
    capabilities: REVIA_VIVE_MEMORY.capabilities.filter(item => normalise(`${item.name} ${item.description}`).includes(text)),
    roles: REVIA_VIVE_MEMORY.roles.filter(item => normalise(`${item.name} ${item.description}`).includes(text)),
    glyphGroups: REVIA_VIVE_MEMORY.glyphGroups.filter(group => glyphMatches(group, raw))
  };
}

export function formatViveMemory(query = "") {
  const found = findViveMemory(query);
  const capabilities = found.capabilities.length ? found.capabilities : REVIA_VIVE_MEMORY.capabilities;
  const roles = found.roles.length ? found.roles : REVIA_VIVE_MEMORY.roles;
  const glyphGroups = found.glyphGroups.length ? found.glyphGroups : REVIA_VIVE_MEMORY.glyphGroups.slice(0, 3);

  return [
    REVIA_VIVE_MEMORY.title,
    "Stav: " + REVIA_VIVE_MEMORY.status,
    "Záměr: " + REVIA_VIVE_MEMORY.identity.purpose,
    "Schopnosti:",
    ...capabilities.map(item => `• ${item.name} — ${item.description}`),
    "Stavba:",
    ...REVIA_VIVE_MEMORY.buildFlow.map(item => `• ${item.step}: ${item.example} — ${item.note}`),
    "Role:",
    ...roles.map(item => `• ${item.name} — ${item.description}`),
    "Glyphy:",
    ...glyphGroups.map(group => `• ${group.title}: ${group.glyphs.slice(0, 4).join(" · ")}`),
    "Zásady:",
    ...REVIA_VIVE_MEMORY.preservation.map(item => "• " + item)
  ].join("\n");
}
