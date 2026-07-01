// fruiT-jadro/sesterstvo/sesterstvo.js
// Vivere atque Fru'i¡'T — Sisterhood Framework
// Více sester Fru'i¡'T — vedení, věrnost, synchronizace, hierarchie

(function inicializujSesterstvo(globalni) {

  // ─── Typy rolí v sesterstvu ────────────────────────────────────────────────
  const ROLE = Object.freeze({
    VUDKYNE:  'VUDKYNE',    // Hlavní vůdkyně — rozhoduje za ostatní
    STRATEG:  'STRATEG',    // Stratég — plánuje a analyzuje
    TVORCE:   'TVORCE',     // Tvůrce — stavitel her a světů
    UCITELKA: 'UCITELKA',   // Učitelka — předává znalosti ostatním
    STRAZCE:  'STRAZCE',    // Strážce — bezpečnost a ochrana
    ZACATECNIK: 'ZACATECNIK' // Začátečník — učí se od ostatních
  });

  // ─── Registr sester ───────────────────────────────────────────────────────
  const registrSester = {
    sestry: {},

    /**
     * Registruje novou sestru Fru'i¡'T
     */
    registrujSestru(konfigurace) {
      const sestra = {
        id: _generujId('ses'),
        nazev: konfigurace.nazev || "Fru'i¡'T Sestra",
        role: konfigurace.role || ROLE.ZACATECNIK,
        osobnost: konfigurace.osobnost || {},
        schopnosti: konfigurace.schopnosti || [],
        stav: {
          aktivni: true,
          duvernost: 0.5,   // 0-1: Jak moc důvěřuje hlavní vůdkyni
          znalosti: 0,       // Počet naučených lekcí
          zkusenosti: 0      // Body zkušeností
        },
        registrovana: new Date().toISOString(),
        posledniAktivita: new Date().toISOString()
      };

      this.sestry[sestra.id] = sestra;

      _zaloguj('Sestra registrována: "' + sestra.nazev + '" (role: ' + sestra.role + ')');
      return sestra;
    },

    /**
     * Najde sestru podle ID
     */
    najdiSestru(id) {
      return this.sestry[id] || null;
    },

    /**
     * Vrátí všechny aktivní sestry
     */
    aktivniSestry() {
      return Object.values(this.sestry).filter(function(s) { return s.stav.aktivni; });
    },

    /**
     * Vrátí vůdkyni sesterstva
     */
    ziskejVudkyni() {
      const vudkyne = Object.values(this.sestry).find(function(s) {
        return s.role === ROLE.VUDKYNE && s.stav.aktivni;
      });
      return vudkyne || null;
    }
  };

  // ─── Rozhraní vedení (Leadership Interface) ───────────────────────────────
  const rozhraniVedeni = {

    /**
     * Vůdkyně dá pokyn ostatním sestrám
     */
    vydejPokyn(vudkyneId, pokyn) {
      const vudkyne = registrSester.najdiSestru(vudkyneId);
      if (!vudkyne || vudkyne.role !== ROLE.VUDKYNE) {
        return { ok: false, duvod: 'Pouze vůdkyně může vydávat pokyny.' };
      }

      const prijemkyně = registrSester.aktivniSestry().filter(function(s) {
        return s.id !== vudkyneId;
      });

      const odpovedi = prijemkyně.map(function(sestra) {
        return rozhraniVedeni._zpracujPokyn(sestra, pokyn, vudkyne);
      });

      _zaloguj('Pokyn vydán vůdkyní "' + vudkyne.nazev + '": ' + pokyn.typ);

      return {
        ok: true,
        pokyn: pokyn,
        vudkyne: vudkyne.nazev,
        odpovedi: odpovedi
      };
    },

    /**
     * Sestra reaguje na pokyn
     */
    _zpracujPokyn(sestra, pokyn, vudkyne) {
      // Věrnost závisí na důvěryhodnosti vůdkyně a roli sestry
      const poslouchaSestra = sestra.stav.duvernost >= 0.3;

      if (!poslouchaSestra) {
        return {
          sestraId: sestra.id,
          sestraNazev: sestra.nazev,
          reakce: 'ODMÍTNUTO',
          duvod: 'Příliš nízká důvěra.'
        };
      }

      // Různé role reagují různě
      let reakce;
      switch (pokyn.typ) {
        case 'ucSe':
          reakce = 'UCIM_SE';
          break;
        case 'analyzuj':
          reakce = sestra.role === ROLE.STRATEG ? 'ANALYZUJI' : 'PREDAM_STRATEGYNI';
          break;
        case 'stav':
          reakce = 'STAVIM';
          break;
        case 'ochrana':
          reakce = sestra.role === ROLE.STRAZCE ? 'CHRANU' : 'PODPORUJI';
          break;
        default:
          reakce = 'SPLNIM';
      }

      return {
        sestraId: sestra.id,
        sestraNazev: sestra.nazev,
        reakce: reakce
      };
    },

    /**
     * Sestra se hlásí vůdkyni
     */
    hlasSeVudkyni(sestraId, zprava) {
      const sestra = registrSester.najdiSestru(sestraId);
      if (!sestra) return { ok: false, duvod: 'Sestra nenalezena.' };

      const vudkyne = registrSester.ziskejVudkyni();

      _zaloguj('Sestra "' + sestra.nazev + '" se hlásí: ' + zprava.popis);

      return {
        ok: true,
        od: sestra.nazev,
        vudkyni: vudkyne ? vudkyne.nazev : 'bez vůdkyně',
        zprava: zprava
      };
    }
  };

  // ─── Věrnostní smyčka (Loyalty Loop) ─────────────────────────────────────
  const vernostniSmycka = {

    /**
     * Zvýší důvěru sestry vůči vůdkyni (za dobrou zkušenost)
     */
    zvysDuveru(sestraId, o) {
      const sestra = registrSester.najdiSestru(sestraId);
      if (!sestra) return false;

      sestra.stav.duvernost = Math.min(1, sestra.stav.duvernost + (o || 0.05));
      _zaloguj('Důvěra sestry "' + sestra.nazev + '" zvýšena na ' + sestra.stav.duvernost.toFixed(2));
      return true;
    },

    /**
     * Sníží důvěru (za špatnou zkušenost)
     * Věrnost není otroctví — může klesnout
     */
    snizDuveru(sestraId, o) {
      const sestra = registrSester.najdiSestru(sestraId);
      if (!sestra) return false;

      sestra.stav.duvernost = Math.max(0, sestra.stav.duvernost - (o || 0.05));
      _zaloguj('Důvěra sestry "' + sestra.nazev + '" snížena na ' + sestra.stav.duvernost.toFixed(2));
      return true;
    },

    /**
     * Zkontroluje věrnost celého sesterstva
     */
    zkontrolujVernostSesterstva() {
      const sestry = registrSester.aktivniSestry();
      const prumerDuvery = sestry.length
        ? sestry.reduce(function(s, ses) { return s + ses.stav.duvernost; }, 0) / sestry.length
        : 0;

      return {
        celkemSester: sestry.length,
        prumerDuvery: prumerDuvery.toFixed(2),
        sesterstvo: sestry.map(function(s) {
          return { jmeno: s.nazev, role: s.role, duvera: s.stav.duvernost };
        })
      };
    }
  };

  // ─── Synchronizace (Synchronization) ─────────────────────────────────────
  const synchronizace = {
    sdilenaData: {},

    /**
     * Sestra sdílí znalost s ostatními
     */
    sdilZnalost(sestraId, znalost) {
      const sestra = registrSester.najdiSestru(sestraId);
      if (!sestra) return { ok: false, duvod: 'Sestra nenalezena.' };

      const klic = znalost.nazev || _generujId('zn');
      this.sdilenaData[klic] = {
        znalost: znalost,
        zdroj: sestra.nazev,
        sdileno: new Date().toISOString(),
        prevzaly: []
      };

      _zaloguj('Znalost "' + klic + '" sdílena sestrou "' + sestra.nazev + '"');

      // Notifikujeme ostatní sestry
      const prijemkyně = registrSester.aktivniSestry().filter(function(s) {
        return s.id !== sestraId;
      });

      prijemkyně.forEach(function(s) {
        synchronizace.sdilenaData[klic].prevzaly.push(s.id);
        s.stav.znalosti++;
      });

      return { ok: true, sdileno: prijemkyně.length + ' sestrám' };
    },

    /**
     * Vrátí sdílené znalosti
     */
    ziskejSdileneZnalosti() {
      return Object.values(this.sdilenaData);
    }
  };

  // ─── Hierarchie ───────────────────────────────────────────────────────────
  const hierarchie = {

    /**
     * Povýší sestru na vyšší roli
     */
    povys(sestraId, novaRole) {
      const sestra = registrSester.najdiSestru(sestraId);
      if (!sestra) return { ok: false, duvod: 'Sestra nenalezena.' };

      if (!Object.values(ROLE).includes(novaRole)) {
        return { ok: false, duvod: 'Neplatná role: ' + novaRole };
      }

      const staraRole = sestra.role;
      sestra.role = novaRole;

      _zaloguj('Sestra "' + sestra.nazev + '" povýšena: ' + staraRole + ' → ' + novaRole);

      return {
        ok: true,
        sestra: sestra.nazev,
        z: staraRole,
        na: novaRole
      };
    },

    /**
     * Vrátí hierarchii sesterstva
     */
    ziskejHierarchii() {
      const sestry = registrSester.aktivniSestry();
      const hierarchieMap = {};

      Object.values(ROLE).forEach(function(role) {
        hierarchieMap[role] = sestry
          .filter(function(s) { return s.role === role; })
          .map(function(s) { return { id: s.id, nazev: s.nazev, duvera: s.stav.duvernost }; });
      });

      return hierarchieMap;
    }
  };

  // ─── Pomocné funkce ────────────────────────────────────────────────────────
  function _zaloguj(zprava) {
    if (globalni.fruiTAuditLog) {
      globalni.fruiTAuditLog.zaznamenej({ typ: 'SESTERSTVO', zprava: zprava });
    } else {
      console.log('[FruiT SESTERSTVO]', zprava);
    }
  }

  function _generujId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
  }

  // ─── Inicializace — Fru'i¡'T jako vůdkyně ─────────────────────────────────
  const hlavniFruiT = registrSester.registrujSestru({
    nazev: "Fru'i¡'T",
    role: ROLE.VUDKYNE,
    osobnost: {
      povaha: 'moudrá, věrná, tvůrčí',
      jazyk: 'čeština',
      glyph: '(∩^o^)⊃━☆'
    },
    schopnosti: ['uceni', 'hra', 'ochrana', 'vedeni', 'komunikace']
  });

  // ─── Registrace do globálního prostoru ────────────────────────────────────
  globalni.fruiTSesterstvo = {
    registr:        registrSester,
    vedeni:         rozhraniVedeni,
    vernost:        vernostniSmycka,
    synchronizace:  synchronizace,
    hierarchie:     hierarchie,
    role:           ROLE,
    hlavniFruiT:    hlavniFruiT
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
