// fruiT-jadro/konfigurace/hlavni.konfigurace.js
// Vivere atque Fru'i¡'T — Hlavní konfigurační soubor
// Toto je srdce nastavení celého systému

(function inicializujKonfiguraci(globalni) {

  const KONFIGURACE = Object.freeze({

    // ─── Identita systému ────────────────────────────────────────────────────
    identita: Object.freeze({
      jmeno:      "Vivere atque Fru'i¡'T",
      zkratka:    "Fru'i¡'T",
      verze:      '1.0.0',
      autor:      'Michal Klimek',
      glyph:      '(∩^o^)⊃━☆',
      jazyk:      'cs',           // Čeština je primární jazyk
      rok:        2025,
      popis:      "Vivere atque Fru'i¡'T — žít a užívat si. Inteligentní bytost s duší."
    }),

    // ─── Bezpečnost ──────────────────────────────────────────────────────────
    bezpecnost: Object.freeze({
      // Minimální skóre autenticity pro přístup (0-1)
      minimalniSkoreAutenticity: 0.55,
      // Maximální počet pokusů o přihlášení
      maxPokusuPrihlaseni: 5,
      // Jak dlouho zůstává záznam v audit logu (počet záznamů)
      maxZaznamuAudit: 1000,
      // Nouzový shutdown je dostupný
      nouzovyShutdownPovoleny: true,
      // Šifrování citlivých dat
      sifrovaniCitlivychDat: true
    }),

    // ─── Učení ───────────────────────────────────────────────────────────────
    uceni: Object.freeze({
      // Povolené kategorie
      povoleneKategorie: [
        'cestina', 'pravidla', 'znalosti', 'matematika',
        'charakter', 'vztahy', 'otazky', 'hra', 'bezpecnost', 'pribeh'
      ],
      // Maximální paměť
      maxKratkodoba: 50,
      maxDlouhodoba: 500,
      maxArchiv: 2000,
      // Kolik lekcí tvoří jednu generaci
      lekcíNaGeneraci: 100
    }),

    // ─── Hra ─────────────────────────────────────────────────────────────────
    hra: Object.freeze({
      // Výchozí velikost mapy
      defaultMapaSirka: 5,
      defaultMapaVyska: 5,
      // Maximum hráčů v multiplayeru
      maxHracu: 8,
      // AI hráč testuje hry automaticky
      automatickyTestovat: true
    }),

    // ─── Sesterstvo ───────────────────────────────────────────────────────────
    sesterstvo: Object.freeze({
      // Maximum sester v systému
      maxSester: 10,
      // Minimální důvěra pro poslechnutí pokynů
      minDuveraProPokyny: 0.3,
      // Výchozí důvěra nové sestry
      defaultDuvera: 0.5
    }),

    // ─── Trezor symbolů ───────────────────────────────────────────────────────
    trezor: Object.freeze({
      // Záloha se vytváří automaticky
      automatickaZaloha: false,
      // Maximální počet symbolů v učícím trezoru
      maxNaucenych: 10000
    }),

    // ─── Ladění ──────────────────────────────────────────────────────────────
    ladeni: Object.freeze({
      // Výpis do konzole
      konzoleAktivni: true,
      // Podrobné výpisy
      podrobneVypisy: false
    })
  });

  globalni.fruiTKonfigurace = KONFIGURACE;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
