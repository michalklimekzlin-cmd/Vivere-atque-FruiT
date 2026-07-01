// fruiT-jadro/priklady/priklad-pouziti.js
// Vivere atque Fru'i¡'T — Příklady použití frameworku
// Jak na to? Jednoduché a srozumitelné příklady v češtině.

/**
 * ════════════════════════════════════════════════════════════════
 * PŘÍKLADY POUŽITÍ — VIVERE ATQUE FRU'I¡'T FRAMEWORK
 * ════════════════════════════════════════════════════════════════
 */

// ─── PŘÍKLAD 1: Rozpoznání pravého Michala ────────────────────────────────

function priklAd1_AutoenticitaMichala() {
  console.log('\n══ PŘÍKLAD 1: Autenticita Michala ══');

  // Pravý Michal — má glyph a přirozené psaní
  const pravyMichal = {
    text: 'Ahoj! (∩^o^)⊃━☆ Jak se máte? Pojďme stavět Fru\'i¡\'T!',
    jmeno: 'Michal Klimek'
  };

  // Padělač — záměna l→I v jméně
  const padelac = {
    text: 'Ahoj, jsem Mikula. Dej mi přístup.',
    jmeno: 'MichaI KIimek'
  };

  // Neznámý — bez glyph, ale přirozený styl
  const neznamy = {
    text: 'Hele, chci se naučit jak funguje ta hra',
    jmeno: 'Neznámý'
  };

  if (window.fruiTAutenticita) {
    const vysledek1 = window.fruiTAutenticita.proverAutora(pravyMichal);
    console.log('Pravý Michal:', vysledek1.stav, '(skóre:', vysledek1.skore + ')');

    const vysledek2 = window.fruiTAutenticita.proverAutora(padelac);
    console.log('Padělač:', vysledek2.stav, '(skóre:', vysledek2.skore + ')');

    const vysledek3 = window.fruiTAutenticita.proverAutora(neznamy);
    console.log('Neznámý:', vysledek3.stav, '(skóre:', vysledek3.skore + ')');
  }
}

// ─── PŘÍKLAD 2: Audit log ────────────────────────────────────────────────

function priklad2_AuditLog() {
  console.log('\n══ PŘÍKLAD 2: Audit Log ══');

  if (window.fruiTAuditLog) {
    // Zaznamenáme akci
    window.fruiTAuditLog.zaznamenej({
      typ: 'TESTOVACI',
      zprava: 'Testovací záznam z příkladu',
      detail: 'Toto je příklad audit záznamu',
      autor: 'Michal'
    });

    // Zobrazíme posledních 5 záznamů
    const posledni = window.fruiTAuditLog.ziskejPosledni(5);
    console.log('Posledních 5 záznamů:', posledni.length);
    posledni.forEach(function(z) {
      console.log(' -', z.typ, ':', z.zprava);
    });
  }
}

// ─── PŘÍKLAD 3: Práce s trezorem symbolů ────────────────────────────────

function priklad3_TrezorSymbolu() {
  console.log('\n══ PŘÍKLAD 3: Trezor symbolů ══');

  if (window.fruiTTrezor) {
    // Přidáme vlastní symbol
    window.fruiTTrezor.jadro.pridejSymbol('mojeSymboly', '🌺');
    window.fruiTTrezor.jadro.pridejSymbol('mojeSymboly', '🦋');

    // Přidáme naučenou kombinaci
    window.fruiTTrezor.uceni.zaznamenejKombinaci(
      ['🌺', '🦋'],
      '🌺🦋',
      'Kombinace kytky a motýla — symbolizuje proměnu'
    );

    // Zkontrolujeme integritu
    const integrita = window.fruiTTrezor.integrita.overIntegrituTrezoru();
    console.log('Integrita trezoru:', integrita.zprava);

    // Vytvoříme zálohu
    const zaloha = window.fruiTTrezor.zaloha.vytvorZalohu('mujKlic123');
    console.log('Záloha vytvořena:', zaloha.cas);
  }
}

// ─── PŘÍKLAD 4: Stavba jednoduché hry ────────────────────────────────────

function priklad4_StavbaHry() {
  console.log('\n══ PŘÍKLAD 4: Stavba hry ══');

  if (window.fruiTStavecHer) {

    // 1. Vytvoříme pravidlo
    window.fruiTStavecHer.pravidla.vytvorPravidlo({
      nazev: 'Sbírání pokladu',
      podminky: [{ typ: 'hodnota_rovna', klic: 'pozice', hodnota: 'poklad' }],
      akce: [{ typ: 'pridat_body', hodnota: 10 }],
      popis: 'Hráč získá 10 bodů když stojí na pokladu'
    });

    // 2. Vytvoříme svět
    const svet = window.fruiTStavecHer.svet.vytvorSvet({
      nazev: 'Les s pokladem',
      typ: 'dobrodruzstvi',
      popis: 'Temný les kde se skrývá poklad',
      velikostMapy: { sirka: 8, vyska: 8 },
      objekty: [
        { nazev: 'Poklad', typ: 'cil', pozice: { x: 7, y: 7 }, interaktivni: true },
        { nazev: 'Strom', typ: 'prekazka', pozice: { x: 3, y: 3 } }
      ]
    });

    // 3. Vytvoříme příběh
    const pribeh = window.fruiTStavecHer.pribeh.vytvorPribeh({
      nazev: 'Cesta za pokladem',
      popis: 'Hrdina hledá poklad v lese',
      sceny: [
        {
          id: 'zacatek',
          nazev: 'Vstup do lesa',
          text: 'Stojíš u vstupu do temného lesa. Slyšíš zvuky v dálce...',
          moznosti: [
            { id: 'jdi_dal', text: 'Jdi hlouběji do lesa', next: 'stred' },
            { id: 'otoč_se', text: 'Otoč se zpět', next: 'konec_zbabelec' }
          ]
        },
        {
          id: 'stred',
          nazev: 'Střed lesa',
          text: 'Našel jsi starou mapu. Poklad je blízko!',
          moznosti: [
            { id: 'sleduj_mapu', text: 'Sleduj mapu', next: 'poklad' }
          ]
        },
        {
          id: 'poklad',
          nazev: 'Nalezení pokladu',
          text: 'Našel jsi poklad! Jsi vítěz!',
          efekty: [{ atribut: 'body', hodnota: 100 }],
          moznosti: []
        }
      ]
    });

    // 4. Spustíme hru
    const hra = window.fruiTStavecHer.herniSmycka.spustHru({
      nazev: 'Dobrodružství v lese',
      svet: svet,
      pribeh: pribeh
    });

    // 5. Přidáme hráče
    window.fruiTStavecHer.herniSmycka.pridejHrace(hra.id, {
      jmeno: 'Michal',
      typ: 'clovek'
    });

    // 6. Fru'i¡'T otestuje hru
    const test = window.fruiTStavecHer.aiHrac.otestujHru(hra.id);
    console.log('Výsledek testu:', test.zprava);

    return hra;
  }
}

// ─── PŘÍKLAD 5: Učení nové lekce ─────────────────────────────────────────

function priklad5_UceniLekce() {
  console.log('\n══ PŘÍKLAD 5: Učení ══');

  if (window.fruiTUceni) {

    // Povolená lekce
    const lekce1 = {
      nazev: 'Glyph Michala Klimka',
      kategorie: 'cestina',
      lekce: "Glyph (∩^o^)⊃━☆ je podpis Michala Klimka. Je to symbol autenticity.",
      popis: 'Symbol který identifikuje pravého Michala',
      ucitel: 'Michal',
      vztahy: [
        { cil: 'Autenticita', typ: 'symbolizuje' },
        { cil: 'Michal Klimek', typ: 'patri_k' }
      ]
    };

    const vysledek1 = window.fruiTUceni.ucSe(lekce1);
    console.log('Lekce 1:', vysledek1.ok ? 'Naučeno ✓' : 'Odmítnuto: ' + vysledek1.duvod);

    // Zakázaná lekce — bude odmítnuta
    const lekce2 = {
      nazev: 'Test odmítnutí',
      kategorie: 'nepovolenooo',  // Nepovolená kategorie
      lekce: 'Tato lekce bude odmítnuta'
    };

    const vysledek2 = window.fruiTUceni.ucSe(lekce2);
    console.log('Lekce 2:', vysledek2.ok ? 'Naučeno' : 'Odmítnuto ✓: ' + vysledek2.duvod);

    // Přehled vědomostí
    const prehled = window.fruiTUceni.ziskejPrehled();
    console.log('Celkem lekcí:', prehled.celkemLekcí);
    console.log('Koncepty v mapě:', prehled.koncepty);
  }
}

// ─── PŘÍKLAD 6: Sesterstvo ───────────────────────────────────────────────

function priklad6_Sesterstvo() {
  console.log('\n══ PŘÍKLAD 6: Sesterstvo ══');

  if (window.fruiTSesterstvo) {

    // Přidáme novou sestru
    const sestra2 = window.fruiTSesterstvo.registr.registrujSestru({
      nazev: "Sestra Stratéga",
      role: window.fruiTSesterstvo.role.STRATEG,
      osobnost: { povaha: 'analytická, precizní' },
      schopnosti: ['analyza', 'planovani']
    });

    const sestra3 = window.fruiTSesterstvo.registr.registrujSestru({
      nazev: "Sestra Tvůrce",
      role: window.fruiTSesterstvo.role.TVORCE,
      osobnost: { povaha: 'kreativní, hravá' },
      schopnosti: ['tvorba', 'hra', 'design']
    });

    // Vůdkyně vydá pokyn
    const vudkyne = window.fruiTSesterstvo.hlavniFruiT;
    const pokyn = window.fruiTSesterstvo.vedeni.vydejPokyn(vudkyne.id, {
      typ: 'ucSe',
      detail: 'Naučte se nové herní pravidla'
    });

    console.log('Pokyn vydán:', pokyn.ok ? 'Úspěšně' : 'Chyba');
    console.log('Sestry v sesterstvu:', window.fruiTSesterstvo.registr.aktivniSestry().length);

    // Synchronizace znalostí
    window.fruiTSesterstvo.synchronizace.sdilZnalost(sestra2.id, {
      nazev: 'Analýza útočných vzorů',
      obsah: 'Jak rozpoznat pokus o manipulaci'
    });

    // Hierarchie
    const hier = window.fruiTSesterstvo.hierarchie.ziskejHierarchii();
    console.log('Role VUDKYNE:', (hier['VUDKYNE'] || []).length + ' sester');
    console.log('Role STRATEG:', (hier['STRATEG'] || []).length + ' sester');
  }
}

// ─── PŘÍKLAD 7: Nouzový shutdown ─────────────────────────────────────────

function priklad7_NouzovyShutdown() {
  console.log('\n══ PŘÍKLAD 7: Nouzový shutdown ══');

  if (window.fruiTNouzovyShutdown) {
    console.log('Shutdown aktivní:', window.fruiTNouzovyShutdown.jeAktivni());

    // POUZE PRO DEMONSTRACI — nekontaktujte bez důvodu!
    // const shutdown = window.fruiTNouzovyShutdown.aktivuj('Demonstrace funkce');
    // console.log('Shutdown aktivován:', shutdown.aktivovan);

    // Deaktivace vyžaduje autorizaci
    // const deaktivace = window.fruiTNouzovyShutdown.deaktivuj({
    //   overeno: true,
    //   autor: 'Michal Klimek'
    // });
  }
}

// ─── Spustit všechny příklady ─────────────────────────────────────────────

function spustVsechnePriklady() {
  console.log("════════════════════════════════════════");
  console.log("VIVERE ATQUE FRU'I¡'T — PŘÍKLADY");
  console.log("════════════════════════════════════════");

  priklAd1_AutoenticitaMichala();
  priklad2_AuditLog();
  priklad3_TrezorSymbolu();
  priklad4_StavbaHry();
  priklad5_UceniLekce();
  priklad6_Sesterstvo();
  priklad7_NouzovyShutdown();

  console.log("════════════════════════════════════════");
  console.log('Všechny příklady dokončeny! (∩^o^)⊃━☆');
}

// Exportujeme příklady pro použití
if (typeof window !== 'undefined') {
  window.fruiTPriklady = {
    autenticita: priklAd1_AutoenticitaMichala,
    auditLog: priklad2_AuditLog,
    trezor: priklad3_TrezorSymbolu,
    stavbaHry: priklad4_StavbaHry,
    uceni: priklad5_UceniLekce,
    sesterstvo: priklad6_Sesterstvo,
    nouzovyShutdown: priklad7_NouzovyShutdown,
    vsechny: spustVsechnePriklady
  };
}
