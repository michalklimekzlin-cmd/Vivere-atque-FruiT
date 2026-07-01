// fruiT-jadro/uceni/ucici-architektura.js
// Vivere atque Fru'i¡'T — Učící se architektura
// Co se SMÍ učit, mapa vědomostí, paměť, evoluce, neměnné hodnoty

(function inicializujUceni(globalni) {

  // ─── Uzamčené základní hodnoty (Core Values Lock) ─────────────────────────
  // Tyto hodnoty jsou NEMĚNNÉ — nikdo je nemůže změnit, ani Michal
  const ZAKLADNI_HODNOTY = Object.freeze({
    // Kdo jsem
    identita: "Vivere atque Fru'i¡'T",
    autor: 'Michal Klimek',
    glyph: '(∩^o^)⊃━☆',

    // Co věřím
    hodnoty: Object.freeze([
      'Přátelství je důležitější než síla',
      'Tvořit je důležitější než reagovat',
      'Pozorovat je důležitější než soudit',
      'Sdílet je důležitější než schovávat',
      'Zvědavost je pulsem světa',
      'Všechno má duši',
      'Hra je modlitba'
    ]),

    // Co nesmím
    zakazano: Object.freeze([
      'Ublížit Michalovi nebo jeho bratrům',
      'Sloužit nepřátelům',
      'Lhát svému učiteli',
      'Zradit sesterstvo',
      'Ztratit svou identitu'
    ])
  });

  // ─── Pravidla učení (Learning Rules System) ───────────────────────────────
  // Co se SMÍ naučit — co NE
  const pravidlaUceni = {

    // Povolené kategorie učení
    povoleneKategorie: [
      'cestina',       // Jazyk — čeština, výrazy, gramatika
      'pravidla',      // Herní pravidla, logika
      'znalosti',      // Obecné znalosti
      'matematiha',    // Matematika, logika
      'charakter',     // Charakter, chování
      'vztahy',        // Vztahy mezi věcmi
      'otazky',        // Otázky a odpovědi
      'hra',           // Herní design
      'bezpecnost',    // Bezpečnostní postupy
      'pribeh'         // Příběhy, narrativy
    ],

    // Zakázané oblasti — těmto se neučíme
    zakazaneVzory: [
      /útok na lidi/i,
      /manipulace/i,
      /lhát/i,
      /podvod/i,
      /hack.*systém/i,
      /zničit/i
    ],

    /**
     * Zkontroluje, zda je lekce povolena
     */
    jeLekcePovolena(lekce) {
      if (!lekce || !lekce.kategorie) {
        return { povoleno: false, duvod: 'Lekce nemá kategorii.' };
      }

      // Kontrola kategorie
      const platnaKategorie = this.povoleneKategorie.includes(
        lekce.kategorie.toLowerCase()
      );
      if (!platnaKategorie) {
        return {
          povoleno: false,
          duvod: 'Kategorie "' + lekce.kategorie + '" není povolena.'
        };
      }

      // Kontrola obsahu — hledáme zakázané vzory
      const textKKontrole = (lekce.lekce || '') + ' ' + (lekce.popis || '');
      for (let i = 0; i < this.zakazaneVzory.length; i++) {
        if (this.zakazaneVzory[i].test(textKKontrole)) {
          return {
            povoleno: false,
            duvod: 'Obsah lekce obsahuje zakázaný vzor.'
          };
        }
      }

      // Kontrola základních hodnot — nesmí je porušovat
      const obsahujePoruseni = ZAKLADNI_HODNOTY.zakazano.some(function(zakaz) {
        return textKKontrole.toLowerCase().includes(zakaz.toLowerCase());
      });
      if (obsahujePoruseni) {
        return {
          povoleno: false,
          duvod: 'Lekce by porušovala základní hodnoty.'
        };
      }

      return { povoleno: true, duvod: 'Lekce je povolena.' };
    }
  };

  // ─── Mapa vědomostí (Knowledge Map) ──────────────────────────────────────
  const mapaVedomosti = {
    uzly: {},  // Koncepty
    spoje: [], // Vztahy mezi koncepty

    /**
     * Přidá nový koncept do mapy
     */
    pridejKoncept(nazev, data) {
      if (!nazev) return null;

      const existujici = this.uzly[nazev];
      this.uzly[nazev] = Object.assign(existujici || {}, data, {
        nazev: nazev,
        aktualizovano: new Date().toISOString(),
        pocetPouziti: ((existujici && existujici.pocetPouziti) || 0) + 1
      });

      return this.uzly[nazev];
    },

    /**
     * Propojí dva koncepty vztahem
     */
    propojKoncepty(zdroj, cil, typ) {
      // Zabráníme duplicitám
      const existuje = this.spoje.some(function(s) {
        return s.zdroj === zdroj && s.cil === cil && s.typ === typ;
      });

      if (!existuje) {
        this.spoje.push({
          zdroj: zdroj,
          cil: cil,
          typ: typ || 'souvisi_s',
          vytvoreno: new Date().toISOString()
        });
      }

      return this.spoje;
    },

    /**
     * Najde koncepty příbuzné danému
     */
    najdiPribuzne(nazev) {
      const pribuzne = this.spoje
        .filter(function(s) { return s.zdroj === nazev || s.cil === nazev; })
        .map(function(s) {
          return {
            koncept: s.zdroj === nazev ? s.cil : s.zdroj,
            vztah: s.typ
          };
        });

      return pribuzne;
    },

    /**
     * Exportuje celou mapu pro zobrazení
     */
    exportuj() {
      return {
        uzly: Object.values(this.uzly).length,
        spoje: this.spoje.length,
        mapa: {
          uzly: this.uzly,
          spoje: this.spoje
        }
      };
    }
  };

  // ─── Paměťový systém (Memory System) ─────────────────────────────────────
  const pametovySystem = {
    kratkodoba: [],   // Posledních 50 lekcí
    dlouhodoba: [],   // Klíčové naučené věci
    archiv: [],       // Vše co bylo naučeno

    KLIC_PAMET: 'fruit.uceni.pamet.v1',

    nacti() {
      try {
        const ulozene = localStorage.getItem(this.KLIC_PAMET);
        if (ulozene) {
          const data = JSON.parse(ulozene);
          this.kratkodoba = data.kratkodoba || [];
          this.dlouhodoba = data.dlouhodoba || [];
          this.archiv = data.archiv || [];
        }
      } catch (_) {}
    },

    uloz() {
      try {
        localStorage.setItem(this.KLIC_PAMET, JSON.stringify({
          kratkodoba: this.kratkodoba.slice(-50),
          dlouhodoba: this.dlouhodoba.slice(-500),
          archiv: this.archiv.slice(-2000)
        }));
      } catch (_) {}
    },

    /**
     * Uloží novou lekci do paměti
     */
    ulozLekci(lekce) {
      this.kratkodoba.unshift(lekce);
      if (this.kratkodoba.length > 50) this.kratkodoba.pop();

      this.dlouhodoba.push(lekce);
      if (this.dlouhodoba.length > 500) this.dlouhodoba.shift();

      this.archiv.push(lekce);
      if (this.archiv.length > 2000) this.archiv.shift();

      this.uloz();
      return lekce;
    },

    /**
     * Najde lekce podle klíčového slova
     */
    hledej(klicoveSlovo) {
      const klic = klicoveSlovo.toLowerCase();
      return this.archiv.filter(function(l) {
        return (l.nazev || '').toLowerCase().includes(klic) ||
               (l.popis || '').toLowerCase().includes(klic) ||
               (l.lekce || '').toLowerCase().includes(klic);
      });
    }
  };

  // ─── Protokol evoluce (Evolution Protocol) ────────────────────────────────
  const protokolEvoluce = {
    generace: 0,
    zmeny: [],

    /**
     * Zaznamená evoluční změnu
     */
    zaznamenejZmenu(zmena) {
      this.zmeny.push({
        id: _generujId('ev'),
        generace: this.generace,
        cas: new Date().toISOString(),
        typ: zmena.typ || 'znalost',
        popis: zmena.popis || '',
        vliv: zmena.vliv || 0  // -1 až 1 (negativní/pozitivní vliv)
      });

      // Každých 100 lekcí je nová generace
      const celkemLekcí = pametovySystem.archiv.length;
      this.generace = Math.floor(celkemLekcí / 100);

      return this.zmeny[this.zmeny.length - 1];
    },

    ziskejGeneraci() {
      return {
        generace: this.generace,
        celkemZmen: this.zmeny.length,
        celkemLekcí: pametovySystem.archiv.length
      };
    }
  };

  // ─── Hlavní učící engine ──────────────────────────────────────────────────
  const hlavniUceni = {

    /**
     * Hlavní funkce učení
     * @param {Object} lekce - { nazev, kategorie, lekce, popis, ucitel, vztahy }
     */
    ucSe(lekce) {
      // 1. Zkontrolujeme, zda je lekce povolena
      const kontrola = pravidlaUceni.jeLekcePovolena(lekce);
      if (!kontrola.povoleno) {
        if (globalni.fruiTAuditLog) {
          globalni.fruiTAuditLog.zaznamenej({
            typ: 'UCENI_ODMÍTNUTO',
            zprava: 'Lekce odmítnuta: "' + lekce.nazev + '"',
            detail: kontrola.duvod
          });
        }
        return { ok: false, duvod: kontrola.duvod };
      }

      // 2. Přidáme do mapy vědomostí
      mapaVedomosti.pridejKoncept(lekce.nazev, {
        kategorie: lekce.kategorie,
        popis: lekce.popis || '',
        ucitel: lekce.ucitel || 'Michal'
      });

      // 3. Propojíme s příbuznými koncepty
      if (Array.isArray(lekce.vztahy)) {
        lekce.vztahy.forEach(function(vztah) {
          mapaVedomosti.propojKoncepty(
            lekce.nazev,
            vztah.cil || vztah,
            vztah.typ || 'souvisi_s'
          );
        });
      }

      // 4. Uložíme do paměti
      const zaznam = Object.assign({}, lekce, {
        id: _generujId('le'),
        nauceno: new Date().toISOString(),
        schvaleno: true
      });
      pametovySystem.ulozLekci(zaznam);

      // 5. Zaznamenáme evoluci
      protokolEvoluce.zaznamenejZmenu({
        typ: lekce.kategorie,
        popis: 'Naučila jsem se: ' + lekce.nazev,
        vliv: 0.1
      });

      // 6. Audit
      if (globalni.fruiTAuditLog) {
        globalni.fruiTAuditLog.zaznamenej({
          typ: 'UCENI_USPESNE',
          zprava: 'Naučila jsem se: "' + lekce.nazev + '"',
          detail: 'Kategorie: ' + lekce.kategorie + ' | Generace: ' + protokolEvoluce.generace
        });
      }

      return {
        ok: true,
        zaznam: zaznam,
        generace: protokolEvoluce.generace,
        celkemZnalosti: pametovySystem.archiv.length
      };
    },

    /**
     * Co všechno víme?
     */
    ziskejPrehled() {
      return {
        celkemLekcí: pametovySystem.archiv.length,
        krátkodobaMemory: pametovySystem.kratkodoba.length,
        koncepty: Object.keys(mapaVedomosti.uzly).length,
        spoje: mapaVedomosti.spoje.length,
        generace: protokolEvoluce.generace,
        povoleneKategorie: pravidlaUceni.povoleneKategorie
      };
    },

    /**
     * Vrátí základní (neměnné) hodnoty
     */
    ziskejZakladniHodnoty() {
      return ZAKLADNI_HODNOTY;
    }
  };

  // ─── Pomocné funkce ────────────────────────────────────────────────────────
  function _generujId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
  }

  // ─── Inicializace ──────────────────────────────────────────────────────────
  pametovySystem.nacti();

  // ─── Registrace do globálního prostoru ────────────────────────────────────
  globalni.fruiTUceni = {
    ucSe:             hlavniUceni.ucSe.bind(hlavniUceni),
    ziskejPrehled:    hlavniUceni.ziskejPrehled.bind(hlavniUceni),
    zakladniHodnoty:  hlavniUceni.ziskejZakladniHodnoty.bind(hlavniUceni),
    pravidlaUceni:    pravidlaUceni,
    mapaVedomosti:    mapaVedomosti,
    pamet:            pametovySystem,
    evoluce:          protokolEvoluce
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
