/* =========================================================
   VIVERE FRIEND YAHOO ADAPTER — CHT 360°‰
   v0.1 — bezpečný datový adaptér

   Umístění:
     docs/vivere-friend-yahoo.js

   Účel:
   - převést RUČNĚ DODANÁ Yahoo Finance data na Life Stream
   - podporovat CSV / JSON / objektová data
   - neposílá přihlašovací údaje
   - neprovádí nákup, prodej ani převod peněz
   - nepřistupuje k broker účtu
   - předává pouze číselný/datový stav Friendovi

   Poznámka:
   Přímé načítání Yahoo Finance z browseru může být omezené
   CORS nebo podmínkami služby. Proto je první verze záměrně
   oddělena od přímého síťového připojení.

   API:
     VivereFriendYahoo.importValue(...)
     VivereFriendYahoo.importCSV(...)
     VivereFriendYahoo.importJSON(...)
     VivereFriendYahoo.getLast()
     VivereFriendYahoo.clear()

   Příklad:
     VivereFriendYahoo.importValue({
       value: "942187130398611.11",
       source: "Yahoo Finance",
       symbol: "PORTFOLIO"
     });
   ========================================================= */

(() => {
  "use strict";

  const VERSION = 1;
  const STORAGE_KEY = "cht360_vivere_friend_yahoo_v1";

  function now() {
    return new Date().toISOString();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function save(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
    return data;
  }

  function normalizeValue(value) {
    // Hodnotu záměrně držíme jako STRING.
    // Nepoužíváme Number(), aby nedošlo ke ztrátě
    // přesnosti u velmi velkých čísel.
    return String(value ?? "").trim();
  }

  function validValue(value) {
    if (!value) return false;

    // Povolené formáty:
    // 123
    // 123.45
    // 123,45
    // -123.45
    // 1 234 567.89
    const normalized = value
      .replace(/\s/g, "")
      .replace(",", ".");

    return /^[-+]?\d+(\.\d+)?$/.test(
      normalized
    );
  }

  function cleanValue(value) {
    return normalizeValue(value)
      .replace(/\s/g, "")
      .replace(",", ".");
  }

  function createRecord(input = {}) {
    const value = cleanValue(input.value);

    if (!validValue(value)) {
      throw new Error(
        "Yahoo Adapter: hodnota musí být číselný text."
      );
    }

    return {
      id:
        input.id ||
        `yahoo-${Date.now()}`,

      at:
        input.at ||
        now(),

      source:
        String(
          input.source ||
          "Yahoo Finance"
        ),

      symbol:
        String(
          input.symbol ||
          "PORTFOLIO"
        ),

      value,

      kind:
        String(
          input.kind ||
          "life-stream"
        ),

      note:
        String(
          input.note ||
          "Yahoo datový vstup pro CHT 360°‰."
        )
    };
  }

  function importValue(input = {}) {
    const record = createRecord(input);

    save(record);

    // Pokud je State dostupný, předáme mu hodnotu.
    if (
      window.VivereFriendState &&
      typeof window.VivereFriendState.setStream ===
        "function"
    ) {
      window.VivereFriendState.setStream(
        record.value
      );
    }

    // Uložíme i paměťovou stopu.
    if (
      window.VivereFriendMemory &&
      typeof window.VivereFriendMemory.remember ===
        "function"
    ) {
      window.VivereFriendMemory.remember({
        type: "yahoo-data",
        text:
          `Přijat nový datový bod ${record.symbol}.`,
        importance: 35,
        tags: [
          "yahoo",
          "finance",
          "life-stream"
        ],
        source:
          "vivere-friend-yahoo",
        data: {
          source: record.source,
          symbol: record.symbol,
          value: record.value,
          at: record.at
        }
      });
    }

    window.dispatchEvent(
      new CustomEvent(
        "cht360:vivere-yahoo-data",
        {
          detail: record
        }
      )
    );

    return record;
  }

  function parseCSV(text) {
    const rows = String(text || "")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    if (!rows.length) {
      return [];
    }

    const headers = rows[0]
      .split(",")
      .map(header =>
        header
          .trim()
          .replace(/^["']|["']$/g, "")
      );

    return rows.slice(1).map(row => {
      const cells = row
        .split(",")
        .map(cell =>
          cell
            .trim()
            .replace(/^["']|["']$/g, "")
        );

      const item = {};

      headers.forEach(
        (header, index) => {
          item[header] =
            cells[index] ?? "";
        }
      );

      return item;
    });
  }

  function importCSV(text, options = {}) {
    const rows = parseCSV(text);

    const valueColumn =
      options.valueColumn ||
      "value";

    const imported = [];

    for (const row of rows) {
      const value =
        row[valueColumn] ??
        row.Value ??
        row.VALUE ??
        row.Close ??
        row.close ??
        row.Amount ??
        row.amount;

      if (
        value !== undefined &&
        validValue(cleanValue(value))
      ) {
        imported.push(
          importValue({
            value,
            source:
              options.source ||
              "Yahoo Finance CSV",
            symbol:
              row.Symbol ||
              row.symbol ||
              options.symbol ||
              "PORTFOLIO",
            at:
              row.Date ||
              row.date ||
              now()
          })
        );
      }
    }

    return imported;
  }

  function importJSON(input, options = {}) {
    let data = input;

    if (typeof input === "string") {
      data = JSON.parse(input);
    }

    const rows = Array.isArray(data)
      ? data
      : [data];

    return rows
      .filter(Boolean)
      .map(row =>
        importValue({
          value:
            row.value ??
            row.Value ??
            row.close ??
            row.Close ??
            row.amount ??
            row.Amount,

          source:
            row.source ||
            options.source ||
            "Yahoo Finance JSON",

          symbol:
            row.symbol ||
            row.Symbol ||
            options.symbol ||
            "PORTFOLIO",

          at:
            row.at ||
            row.date ||
            row.Date ||
            now()
        })
      );
  }

  function getLast() {
    return load();
  }

  function clear() {
    localStorage.removeItem(
      STORAGE_KEY
    );

    return true;
  }

  window.VivereFriendYahoo =
    Object.freeze({
      version: VERSION,
      storageKey: STORAGE_KEY,

      importValue,
      importCSV,
      importJSON,

      getLast,
      clear
    });

  window.dispatchEvent(
    new CustomEvent(
      "cht360:vivere-yahoo-ready"
    )
  );

  console.log(
    "📈 CHT 360°‰ — Vivere Friend Yahoo Adapter ready"
  );
})();
