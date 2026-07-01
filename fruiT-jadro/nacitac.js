// fruiT-jadro/nacitac.js
// Vivere atque Fru'i¡'T — Hlavní nakladač modulů
// Načítá všechny moduly ve správném pořadí

/**
 * POŘADÍ NAČÍTÁNÍ (důležité!):
 *
 * 1. konfigurace/hlavni.konfigurace.js     — nastavení systému
 * 2. bezpecnost/bezpecnostni-jadro.js      — bezpečnost a audit log
 * 3. komunikace/autenticita.js             — rozpoznávání autenticity
 * 4. trezor/trezor-symbolu.js              — trezor symbolů
 * 5. uceni/ucici-architektura.js           — učící se systém
 * 6. stavec-her/stavec-her.js              — stavěč her
 * 7. sesterstvo/sesterstvo.js              — sesterstvo
 * 8. priklady/priklad-pouziti.js           — příklady (volitelné)
 *
 * Použití v HTML:
 * <script src="fruiT-jadro/konfigurace/hlavni.konfigurace.js"></script>
 * <script src="fruiT-jadro/bezpecnost/bezpecnostni-jadro.js"></script>
 * <script src="fruiT-jadro/komunikace/autenticita.js"></script>
 * <script src="fruiT-jadro/trezor/trezor-symbolu.js"></script>
 * <script src="fruiT-jadro/uceni/ucici-architektura.js"></script>
 * <script src="fruiT-jadro/stavec-her/stavec-her.js"></script>
 * <script src="fruiT-jadro/sesterstvo/sesterstvo.js"></script>
 */

(function inicializujNacitac(globalni) {

  // Kontrola zda jsou načteny všechny moduly
  function zkontrolujModuly() {
    const pozadovaneModuly = [
      { nazev: 'fruiTKonfigurace',    popis: 'Konfigurace' },
      { nazev: 'fruiTAuditLog',       popis: 'Audit log' },
      { nazev: 'fruiTBezpecnost',     popis: 'Bezpečnostní jádro' },
      { nazev: 'fruiTAutenticita',    popis: 'Autenticita' },
      { nazev: 'fruiTTrezor',         popis: 'Trezor symbolů' },
      { nazev: 'fruiTUceni',          popis: 'Učící architektura' },
      { nazev: 'fruiTStavecHer',      popis: 'Stavěč her' },
      { nazev: 'fruiTSesterstvo',     popis: 'Sesterstvo' }
    ];

    const stav = pozadovaneModuly.map(function(modul) {
      const nacten = !!globalni[modul.nazev];
      return {
        nazev: modul.nazev,
        popis: modul.popis,
        nacten: nacten,
        stav: nacten ? '✅' : '❌'
      };
    });

    const vsechnyNacteny = stav.every(function(m) { return m.nacten; });

    return {
      ok: vsechnyNacteny,
      moduly: stav,
      nactenych: stav.filter(function(m) { return m.nacten; }).length,
      celkem: stav.length
    };
  }

  // Zobrazí stav systému
  function zobrazStav() {
    const stav = zkontrolujModuly();
    console.log("\n═══════════════════════════════════════════");
    console.log("VIVERE ATQUE FRU'I¡'T — STAV SYSTÉMU");
    console.log("═══════════════════════════════════════════");
    stav.moduly.forEach(function(m) {
      console.log(m.stav + ' ' + m.popis + ' (' + m.nazev + ')');
    });
    console.log('───────────────────────────────────────────');
    console.log('Celkem: ' + stav.nactenych + '/' + stav.celkem + ' modulů načteno');
    console.log(stav.ok
      ? "✅ Systém je PŘIPRAVEN! (∩^o^)⊃━☆"
      : "⚠️ Některé moduly nejsou načteny."
    );
    console.log("═══════════════════════════════════════════\n");
    return stav;
  }

  // Hlavní objekt nakladače
  globalni.fruiTNacitac = {
    zkontrolujModuly: zkontrolujModuly,
    zobrazStav: zobrazStav
  };

  // Automaticky zobraz stav po načtení stránky
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      // Počkáme chvíli aby se načetly všechny moduly
      setTimeout(zobrazStav, 100);
    });
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
