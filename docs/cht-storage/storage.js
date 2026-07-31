"use strict";

/*
  CHT 360°‰. — lepší localStorage

  Umí:
  - načíst všechny klíče localStorage této domény;
  - rozdělit je do složek;
  - hledat v názvech i hodnotách;
  - přidávat a upravovat záznamy;
  - bezpečně mazat jednotlivé záznamy;
  - vytvářet JSON zálohy;
  - importovat starší i nové zálohy;
  - ukázat velikost localStorage;
  - zobrazit IndexedDB a Cache Storage;
  - zachovat JSON čitelný při úpravě;
  - oznámit ostatním modulům změnu paměti.
*/

const CHT_ULOZISTE_VERZE = 2;

const KLIC_META = "cht360_storage_meta_v2";

const SLOZKY = [
  {
    id: "vse",
    nazev: "Všechno",
    odpovida: () => true
  },
  {
    id: "pamet",
    nazev: "Paměť",
    odpovida: klic =>
      /pam[eě]t|memory|snapshot|slot|store|vzpom/i.test(klic)
  },
  {
    id: "glyph",
    nazev: "Glyph",
    odpovida: klic =>
      /glyph|drum|buben|dvir|pokoj|prstenec|ring/i.test(klic)
  },
  {
    id: "mluva",
    nazev: "Mluva",
    odpovida: klic =>
      /mluva|chat|zprava|message|conversation|revia/i.test(klic)
  },
  {
    id: "scena",
    nazev: "Scéna",
    odpovida: klic =>
      /scene|scena|world|svet|planet|trojka|phone|iphone/i.test(klic)
  },
  {
    id: "nastaveni",
    nazev: "Nastavení",
    odpovida: klic =>
      /config|setting|nastaven|theme|tema|layout|zoom|ui/i.test(klic)
  },
  {
    id: "zalohy",
    nazev: "Zálohy",
    odpovida: klic =>
      /backup|zaloha|snapshot|restore|recovery|chybo/i.test(klic)
  },
  {
    id: "system",
    nazev: "Systém",
    odpovida: klic =>
      /cht|vaft|vafit|kernel|core|network|puls|signal/i.test(klic)
  },
  {
    id: "ostatni",
    nazev: "Ostatní",
    odpovida: klic => {
      return !SLOZKY
        .slice(1, -1)
        .some(slozka => slozka.odpovida(klic));
    }
  }
];

const stav = {
  zaznamy: [],
  aktivniSlozka: "vse",
  hledani: "",
  puvodniKlic: null,
  metadata: nactiMetadata()
};

const prvky = {
  pocetLocalStorage:
    document.getElementById("pocetLocalStorage"),

  velikostLocalStorage:
    document.getElementById("velikostLocalStorage"),

  vyuziteMisto:
    document.getElementById("vyuziteMisto"),

  dostupneMisto:
    document.getElementById("dostupneMisto"),

  pocetCache:
    document.getElementById("pocetCache"),

  obnovitTlacitko:
    document.getElementById("obnovitTlacitko"),

  hledaniInput:
    document.getElementById("hledaniInput"),

  exportTlacitko:
    document.getElementById("exportTlacitko"),

  importInput:
    document.getElementById("importInput"),

  slozkyLista:
    document.getElementById("slozkyLista"),

  panelNadpis:
    document.getElementById("panelNadpis"),

  panelInformace:
    document.getElementById("panelInformace"),

  novyZaznamTlacitko:
    document.getElementById("novyZaznamTlacitko"),

  seznamUloziste:
    document.getElementById("seznamUloziste"),

  prazdnyStav:
    document.getElementById("prazdnyStav"),

  databazeSeznam:
    document.getElementById("databazeSeznam"),

  cacheSeznam:
    document.getElementById("cacheSeznam"),

  editorDialog:
    document.getElementById("editorDialog"),

  editorForm:
    document.getElementById("editorForm"),

  editorNadpis:
    document.getElementById("editorNadpis"),

  klicInput:
    document.getElementById("klicInput"),

  hodnotaInput:
    document.getElementById("hodnotaInput"),

  editorNapoveda:
    document.getElementById("editorNapoveda"),

  zavritEditorTlacitko:
    document.getElementById("zavritEditorTlacitko"),

  zrusitEditorTlacitko:
    document.getElementById("zrusitEditorTlacitko"),

  upozorneni:
    document.getElementById("upozorneni")
};

function nactiMetadata() {
  try {
    const ulozene = localStorage.getItem(KLIC_META);

    if (!ulozene) {
      return {
        verze: CHT_ULOZISTE_VERZE,
        zaznamy: {}
      };
    }

    const data = JSON.parse(ulozene);

    return {
      verze: CHT_ULOZISTE_VERZE,
      zaznamy:
        data &&
        typeof data.zaznamy === "object" &&
        data.zaznamy !== null
          ? data.zaznamy
          : {}
    };
  } catch (chyba) {
    console.warn(
      "CHT: metadata úložiště se nepodařilo načíst.",
      chyba
    );

    return {
      verze: CHT_ULOZISTE_VERZE,
      zaznamy: {}
    };
  }
}

function ulozMetadata() {
  try {
    localStorage.setItem(
      KLIC_META,
      JSON.stringify(stav.metadata)
    );
  } catch (chyba) {
    console.warn(
      "CHT: metadata úložiště se nepodařilo uložit.",
      chyba
    );
  }
}

function aktualizujMetadata(klic, akce) {
  if (!klic || klic === KLIC_META) {
    return;
  }

  if (akce === "smazat") {
    delete stav.metadata.zaznamy[klic];
    ulozMetadata();
    return;
  }

  const predchozi =
    stav.metadata.zaznamy[klic] || {};

  stav.metadata.zaznamy[klic] = {
    vytvoreno:
      predchozi.vytvoreno ||
      new Date().toISOString(),

    upraveno:
      new Date().toISOString()
  };

  ulozMetadata();
}

function bezpecneLocalStorage() {
  try {
    const zkusebniKlic =
      "__cht360_test_local_storage__";

    localStorage.setItem(
      zkusebniKlic,
      "1"
    );

    localStorage.removeItem(
      zkusebniKlic
    );

    return true;
  } catch (chyba) {
    console.error(
      "CHT: localStorage není dostupné.",
      chyba
    );

    zobrazUpozorneni(
      "Safari nepovolilo přístup k localStorage."
    );

    return false;
  }
}

function nactiZaznamy() {
  if (!bezpecneLocalStorage()) {
    stav.zaznamy = [];
    return;
  }

  const zaznamy = [];

  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const klic =
      localStorage.key(index);

    if (
      typeof klic !== "string" ||
      klic === KLIC_META
    ) {
      continue;
    }

    const hodnota =
      localStorage.getItem(klic) ?? "";

    const metadata =
      stav.metadata.zaznamy[klic] || {};

    zaznamy.push({
      klic,
      hodnota,
      bajty:
        velikostTextu(klic) +
        velikostTextu(hodnota),

      vytvoreno:
        metadata.vytvoreno || null,

      upraveno:
        metadata.upraveno || null
    });
  }

  stav.zaznamy = zaznamy.sort(
    (a, b) =>
      a.klic.localeCompare(
        b.klic,
        "cs",
        {
          sensitivity: "base"
        }
      )
  );
}

function velikostTextu(text) {
  try {
    return new Blob([
      String(text)
    ]).size;
  } catch {
    return String(text).length * 2;
  }
}

function formatujBajty(pocetBajtu) {
  if (
    !Number.isFinite(pocetBajtu) ||
    pocetBajtu < 0
  ) {
    return "—";
  }

  const jednotky = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  let hodnota = pocetBajtu;
  let jednotka = 0;

  while (
    hodnota >= 1024 &&
    jednotka < jednotky.length - 1
  ) {
    hodnota /= 1024;
    jednotka += 1;
  }

  const desetinnaMista =
    hodnota >= 10 ||
    jednotka === 0
      ? 0
      : 1;

  return `${hodnota.toFixed(
    desetinnaMista
  )} ${jednotky[jednotka]}`;
}

function formatujDatum(isoDatum) {
  if (!isoDatum) {
    return "bez času změny";
  }

  const datum =
    new Date(isoDatum);

  if (
    Number.isNaN(
      datum.getTime()
    )
  ) {
    return "neznámý čas";
  }

  return datum.toLocaleString(
    "cs-CZ",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}

function hodnotaProZobrazeni(hodnota) {
  if (
    hodnota === null ||
    hodnota === undefined
  ) {
    return "";
  }

  try {
    const json =
      JSON.parse(hodnota);

    return JSON.stringify(
      json,
      null,
      2
    );
  } catch {
    return String(hodnota);
  }
}

function hodnotaProUlozeni(hodnota) {
  const text =
    String(hodnota);

  const orezany =
    text.trim();

  if (!orezany) {
    return "";
  }

  try {
    const json =
      JSON.parse(orezany);

    return JSON.stringify(json);
  } catch {
    return text;
  }
}

function aktualniSlozka() {
  return (
    SLOZKY.find(
      slozka =>
        slozka.id === stav.aktivniSlozka
    ) ||
    SLOZKY[0]
  );
}

function filtrovaneZaznamy() {
  const slozka =
    aktualniSlozka();

  const hledanyText =
    stav.hledani
      .trim()
      .toLocaleLowerCase("cs");

  return stav.zaznamy.filter(
    zaznam => {
      const patriDoSlozky =
        slozka.odpovida(
          zaznam.klic
        );

      if (!patriDoSlozky) {
        return false;
      }

      if (!hledanyText) {
        return true;
      }

      const obsah =
        `${zaznam.klic}\n${zaznam.hodnota}`
          .toLocaleLowerCase("cs");

      return obsah.includes(
        hledanyText
      );
    }
  );
}

function vykresliSlozky() {
  prvky.slozkyLista.replaceChildren();

  for (const slozka of SLOZKY) {
    const pocet =
      stav.zaznamy.filter(
        zaznam =>
          slozka.odpovida(
            zaznam.klic
          )
      ).length;

    const tlacitko =
      document.createElement(
        "button"
      );

    tlacitko.type = "button";

    tlacitko.className =
      "slozka-tlacitko";

    if (
      slozka.id ===
      stav.aktivniSlozka
    ) {
      tlacitko.classList.add(
        "aktivni"
      );
    }

    tlacitko.textContent =
      `${slozka.nazev} · ${pocet}`;

    tlacitko.addEventListener(
      "click",
      () => {
        stav.aktivniSlozka =
          slozka.id;

        vykresliSlozky();
        vykresliZaznamy();
      }
    );

    prvky.slozkyLista.append(
      tlacitko
    );
  }
}

function vykresliZaznamy() {
  const zaznamy =
    filtrovaneZaznamy();

  const slozka =
    aktualniSlozka();

  prvky.seznamUloziste
    .replaceChildren();

  prvky.panelNadpis.textContent =
    slozka.nazev;

  prvky.panelInformace.textContent =
    `${zaznamy.length} z ${stav.zaznamy.length} záznamů`;

  prvky.prazdnyStav.hidden =
    zaznamy.length !== 0;

  for (const zaznam of zaznamy) {
    prvky.seznamUloziste.append(
      vytvorPolozku(zaznam)
    );
  }

  prvky.pocetLocalStorage.textContent =
    String(stav.zaznamy.length);

  const celkovaVelikost =
    stav.zaznamy.reduce(
      (soucet, zaznam) =>
        soucet + zaznam.bajty,
      0
    );

  prvky.velikostLocalStorage.textContent =
    formatujBajty(
      celkovaVelikost
    );
}

function vytvorPolozku(zaznam) {
  const polozka =
    document.createElement(
      "article"
    );

  polozka.className =
    "polozka";

  const text =
    document.createElement(
      "div"
    );

  const klic =
    document.createElement(
      "div"
    );

  klic.className =
    "polozka-klic";

  klic.textContent =
    zaznam.klic;

  const hodnota =
    document.createElement(
      "div"
    );

  hodnota.className =
    "polozka-hodnota";

  hodnota.textContent =
    hodnotaProZobrazeni(
      zaznam.hodnota
    );

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "polozka-meta";

  meta.textContent =
    `${formatujBajty(
      zaznam.bajty
    )} • upraveno ${formatujDatum(
      zaznam.upraveno
    )}`;

  text.append(
    klic,
    hodnota,
    meta
  );

  const akce =
    document.createElement(
      "div"
    );

  akce.className =
    "polozka-akce";

  const kopirovat =
    document.createElement(
      "button"
    );

  kopirovat.type =
    "button";

  kopirovat.className =
    "male-tlacitko";

  kopirovat.textContent =
    "Kopírovat";

  kopirovat.addEventListener(
    "click",
    () =>
      kopirujZaznam(zaznam)
  );

  const upravit =
    document.createElement(
      "button"
    );

  upravit.type =
    "button";

  upravit.className =
    "male-tlacitko";

  upravit.textContent =
    "Upravit";

  upravit.addEventListener(
    "click",
    () =>
      otevriEditor(zaznam)
  );

  const smazat =
    document.createElement(
      "button"
    );

  smazat.type =
    "button";

  smazat.className =
    "male-tlacitko nebezpecne";

  smazat.textContent =
    "Smazat";

  smazat.addEventListener(
    "click",
    () =>
      smazZaznam(
        zaznam.klic
      )
  );

  akce.append(
    kopirovat,
    upravit,
    smazat
  );

  polozka.append(
    text,
    akce
  );

  return polozka;
}

async function kopirujZaznam(
  zaznam
) {
  const text =
    `${zaznam.klic}\n${hodnotaProZobrazeni(
      zaznam.hodnota
    )}`;

  try {
    await navigator.clipboard.writeText(
      text
    );

    zobrazUpozorneni(
      "Záznam byl zkopírován."
    );
  } catch {
    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = text;
    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.append(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    zobrazUpozorneni(
      "Záznam byl zkopírován."
    );
  }
}

function otevriEditor(
  zaznam = null
) {
  stav.puvodniKlic =
    zaznam?.klic ?? null;

  prvky.editorNadpis.textContent =
    zaznam
      ? "Upravit záznam"
      : "Nový záznam";

  prvky.klicInput.value =
    zaznam?.klic ??
    "cht360_";

  prvky.hodnotaInput.value =
    zaznam
      ? hodnotaProZobrazeni(
          zaznam.hodnota
        )
      : "";

  prvky.editorNapoveda.textContent =
    zaznam
      ? `Přibližná velikost: ${formatujBajty(
          zaznam.bajty
        )}`
      : "Doporučení: vlastní klíče začínej názvem cht360_.";

  if (
    typeof prvky.editorDialog
      .showModal === "function"
  ) {
    prvky.editorDialog
      .showModal();
  } else {
    prvky.editorDialog
      .setAttribute(
        "open",
        ""
      );
  }

  setTimeout(
    () =>
      prvky.klicInput.focus(),
    0
  );
}

function zavriEditor() {
  if (
    prvky.editorDialog.open &&
    typeof prvky.editorDialog
      .close === "function"
  ) {
    prvky.editorDialog.close();
  } else {
    prvky.editorDialog
      .removeAttribute(
        "open"
      );
  }

  stav.puvodniKlic = null;
}

function ulozZaznam(
  udalost
) {
  udalost.preventDefault();

  const novyKlic =
    prvky.klicInput.value
      .trim();

  if (!novyKlic) {
    zobrazUpozorneni(
      "Název klíče nesmí být prázdný."
    );

    return;
  }

  if (
    novyKlic === KLIC_META
  ) {
    zobrazUpozorneni(
      "Tento systémový klíč nelze ručně upravit."
    );

    return;
  }

  const novaHodnota =
    hodnotaProUlozeni(
      prvky.hodnotaInput.value
    );

  const staryKlic =
    stav.puvodniKlic;

  const existujeJiny =
    localStorage.getItem(
      novyKlic
    ) !== null &&
    novyKlic !== staryKlic;

  if (
    existujeJiny &&
    !window.confirm(
      `Klíč „${novyKlic}“ už existuje. Přepsat jej?`
    )
  ) {
    return;
  }

  try {
    localStorage.setItem(
      novyKlic,
      novaHodnota
    );

    aktualizujMetadata(
      novyKlic,
      "ulozit"
    );

    if (
      staryKlic &&
      staryKlic !== novyKlic
    ) {
      localStorage.removeItem(
        staryKlic
      );

      aktualizujMetadata(
        staryKlic,
        "smazat"
      );
    }

    zavriEditor();

    oznamZmenu({
      akce: "ulozit",
      klic: novyKlic,
      puvodniKlic:
        staryKlic
    });

    obnovVse();

    zobrazUpozorneni(
      "Záznam byl uložen."
    );
  } catch (chyba) {
    console.error(
      "CHT: uložení selhalo.",
      chyba
    );

    const zprava =
      chyba?.name ===
      "QuotaExceededError"
        ? "Úložiště je plné. Nejprve vytvoř zálohu a odstraň nepotřebná data."
        : `Uložení selhalo: ${chyba.message || "neznámá chyba"}`;

    zobrazUpozorneni(
      zprava
    );
  }
}

function smazZaznam(klic) {
  const potvrzeno =
    window.confirm(
      `Opravdu smazat lokální záznam „${klic}“?`
    );

  if (!potvrzeno) {
    return;
  }

  try {
    localStorage.removeItem(
      klic
    );

    aktualizujMetadata(
      klic,
      "smazat"
    );

    oznamZmenu({
      akce: "smazat",
      klic
    });

    obnovVse();

    zobrazUpozorneni(
      "Záznam byl smazán."
    );
  } catch (chyba) {
    console.error(
      "CHT: mazání selhalo.",
      chyba
    );

    zobrazUpozorneni(
      "Záznam se nepodařilo smazat."
    );
  }
}

function vytvorZalohu() {
  nactiZaznamy();

  const zaznamy =
    Object.fromEntries(
      stav.zaznamy.map(
        zaznam => [
          zaznam.klic,
          zaznam.hodnota
        ]
      )
    );

  const zaloha = {
    format:
      "cht360-local-storage-backup",

    verze:
      CHT_ULOZISTE_VERZE,

    vytvoreno:
      new Date().toISOString(),

    puvod:
      location.origin,

    cesta:
      location.pathname,

    zaznamy,

    metadata:
      stav.metadata
  };

  const json =
    JSON.stringify(
      zaloha,
      null,
      2
    );

  const soubor =
    new Blob(
      [json],
      {
        type:
          "application/json;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      soubor
    );

  const odkaz =
    document.createElement(
      "a"
    );

  odkaz.href = url;

  odkaz.download =
    `cht-360-zaloha-${
      new Date()
        .toISOString()
        .slice(0, 10)
    }.json`;

  document.body.append(
    odkaz
  );

  odkaz.click();
  odkaz.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );

  zobrazUpozorneni(
    "Záloha byla vytvořena."
  );
}

async function importujZalohu(
  soubor
) {
  if (!soubor) {
    return;
  }

  try {
    const text =
      await soubor.text();

    const data =
      JSON.parse(text);

    const zaznamy =
      ziskejZaznamyZeZalohy(
        data
      );

    const klice =
      Object.keys(zaznamy);

    if (!klice.length) {
      throw new Error(
        "Záloha neobsahuje žádné záznamy."
      );
    }

    const potvrzeno =
      window.confirm(
        `Importovat ${klice.length} záznamů? Shodné klíče budou přepsány.`
      );

    if (!potvrzeno) {
      return;
    }

    let importovano = 0;

    for (const klic of klice) {
      if (
        !klic ||
        klic === KLIC_META
      ) {
        continue;
      }

      const hodnota =
        zaznamy[klic];

      localStorage.setItem(
        klic,
        typeof hodnota === "string"
          ? hodnota
          : JSON.stringify(hodnota)
      );

      aktualizujMetadata(
        klic,
        "ulozit"
      );

      importovano += 1;
    }

    if (
      data.metadata &&
      typeof data.metadata === "object"
    ) {
      spojMetadata(
        data.metadata
      );
    }

    oznamZmenu({
      akce: "import",
      pocet: importovano
    });

    obnovVse();

    zobrazUpozorneni(
      `Importováno ${importovano} záznamů.`
    );
  } catch (chyba) {
    console.error(
      "CHT: import selhal.",
      chyba
    );

    zobrazUpozorneni(
      `Import selhal: ${
        chyba.message ||
        "neplatný soubor"
      }`
    );
  } finally {
    prvky.importInput.value =
      "";
  }
}

function ziskejZaznamyZeZalohy(
  data
) {
  if (
    data &&
    data.format ===
      "cht360-local-storage-backup" &&
    data.zaznamy &&
    typeof data.zaznamy ===
      "object"
  ) {
    return data.zaznamy;
  }

  if (
    data &&
    data.format ===
      "cht360-local-storage-backup" &&
    data.entries &&
    typeof data.entries ===
      "object"
  ) {
    return data.entries;
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    return data;
  }

  throw new Error(
    "Soubor není rozpoznaná záloha CHT 360°‰."
  );
}

function spojMetadata(
  importovanaMetadata
) {
  const importovaneZaznamy =
    importovanaMetadata.zaznamy;

  if (
    !importovaneZaznamy ||
    typeof importovaneZaznamy !==
      "object"
  ) {
    return;
  }

  stav.metadata.zaznamy = {
    ...stav.metadata.zaznamy,
    ...importovaneZaznamy
  };

  ulozMetadata();
}

async function vykresliOdhadUloziste() {
  try {
    if (
      !navigator.storage ||
      typeof navigator.storage
        .estimate !== "function"
    ) {
      throw new Error(
        "Odhad není dostupný."
      );
    }

    const odhad =
      await navigator.storage
        .estimate();

    prvky.vyuziteMisto.textContent =
      formatujBajty(
        odhad.usage
      );

    prvky.dostupneMisto.textContent =
      `z ${formatujBajty(
        odhad.quota
      )} dostupného místa`;
  } catch {
    prvky.vyuziteMisto.textContent =
      "—";

    prvky.dostupneMisto.textContent =
      "Safari údaj neposkytlo";
  }
}

async function vykresliDatabaze() {
  prvky.databazeSeznam
    .replaceChildren();

  try {
    if (
      !indexedDB ||
      typeof indexedDB.databases !==
        "function"
    ) {
      throw new Error(
        "Seznam IndexedDB není dostupný."
      );
    }

    const databaze =
      await indexedDB.databases();

    if (!databaze.length) {
      prvky.databazeSeznam.append(
        vytvorMiniRadek(
          "Žádná databáze",
          "—"
        )
      );

      return;
    }

    for (
      const databazePolozka
      of databaze
    ) {
      prvky.databazeSeznam.append(
        vytvorMiniRadek(
          databazePolozka.name ||
            "bezejmenná databáze",

          databazePolozka.version
            ? `verze ${databazePolozka.version}`
            : "—"
        )
      );
    }
  } catch {
    prvky.databazeSeznam.append(
      vytvorMiniRadek(
        "Safari seznam neposkytlo",
        "data mohou existovat"
      )
    );
  }
}

async function vykresliCache() {
  prvky.cacheSeznam
    .replaceChildren();

  try {
    if (!("caches" in window)) {
      throw new Error(
        "Cache Storage není dostupná."
      );
    }

    const nazvy =
      await caches.keys();

    prvky.pocetCache.textContent =
      String(nazvy.length);

    if (!nazvy.length) {
      prvky.cacheSeznam.append(
        vytvorMiniRadek(
          "Žádná offline cache",
          "—"
        )
      );

      return;
    }

    for (const nazev of nazvy) {
      const cache =
        await caches.open(
          nazev
        );

      const pozadavky =
        await cache.keys();

      prvky.cacheSeznam.append(
        vytvorMiniRadek(
          nazev,
          `${pozadavky.length} položek`
        )
      );
    }
  } catch {
    prvky.pocetCache.textContent =
      "—";

    prvky.cacheSeznam.append(
      vytvorMiniRadek(
        "Cache není dostupná",
        "—"
      )
    );
  }
}

function vytvorMiniRadek(
  levaHodnota,
  pravaHodnota
) {
  const radek =
    document.createElement(
      "div"
    );

  radek.className =
    "mini-radek";

  const leva =
    document.createElement(
      "span"
    );

  leva.textContent =
    levaHodnota;

  const prava =
    document.createElement(
      "span"
    );

  prava.textContent =
    pravaHodnota;

  radek.append(
    leva,
    prava
  );

  return radek;
}

function oznamZmenu(detail) {
  const udalost =
    new CustomEvent(
      "cht.storage.changed",
      {
        detail: {
          cas:
            new Date()
              .toISOString(),

          ...detail
        }
      }
    );

  window.dispatchEvent(
    udalost
  );

  try {
    const kanal =
      new BroadcastChannel(
        "cht360-storage"
      );

    kanal.postMessage(
      udalost.detail
    );

    kanal.close();
  } catch {
    // BroadcastChannel nemusí být ve starším Safari dostupný.
  }
}

function zobrazUpozorneni(
  zprava
) {
  prvky.upozorneni.textContent =
    zprava;

  prvky.upozorneni.classList.add(
    "zobrazit"
  );

  clearTimeout(
    zobrazUpozorneni.casovac
  );

  zobrazUpozorneni.casovac =
    setTimeout(
      () => {
        prvky.upozorneni
          .classList.remove(
            "zobrazit"
          );
      },
      2700
    );
}

async function obnovVse() {
  nactiZaznamy();

  vykresliSlozky();
  vykresliZaznamy();

  await Promise.allSettled([
    vykresliOdhadUloziste(),
    vykresliDatabaze(),
    vykresliCache()
  ]);
}

function pripojUdalosti() {
  prvky.hledaniInput
    .addEventListener(
      "input",
      udalost => {
        stav.hledani =
          udalost.target.value;

        vykresliZaznamy();
      }
    );

  prvky.obnovitTlacitko
    .addEventListener(
      "click",
      () => {
        obnovVse();

        zobrazUpozorneni(
          "Úložiště bylo obnoveno."
        );
      }
    );

  prvky.exportTlacitko
    .addEventListener(
      "click",
      vytvorZalohu
    );

  prvky.importInput
    .addEventListener(
      "change",
      udalost => {
        const soubor =
          udalost.target
            .files?.[0];

        importujZalohu(
          soubor
        );
      }
    );

  prvky.novyZaznamTlacitko
    .addEventListener(
      "click",
      () =>
        otevriEditor()
    );

  prvky.editorForm
    .addEventListener(
      "submit",
      ulozZaznam
    );

  prvky.zavritEditorTlacitko
    .addEventListener(
      "click",
      zavriEditor
    );

  prvky.zrusitEditorTlacitko
    .addEventListener(
      "click",
      zavriEditor
    );

  prvky.editorDialog
    .addEventListener(
      "click",
      udalost => {
        if (
          udalost.target ===
          prvky.editorDialog
        ) {
          zavriEditor();
        }
      }
    );

  window.addEventListener(
    "storage",
    obnovVse
  );

  window.addEventListener(
    "cht.storage.changed",
    obnovVse
  );

  try {
    const kanal =
      new BroadcastChannel(
        "cht360-storage"
      );

    kanal.addEventListener(
      "message",
      obnovVse
    );
  } catch {
    // Starší Safari může BroadcastChannel postrádat.
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        obnovVse();
      }
    }
  );
}

function spustUloziste() {
  pripojUdalosti();
  obnovVse();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    spustUloziste,
    {
      once: true
    }
  );
} else {
  spustUloziste();
}