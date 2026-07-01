// fruiT-jadro/trezor/trezor-symbolu.js
// Vivere atque Fru'i¡'T — Trezor symbolů
// Základní sada symbolů, naučené kombinace, záloha, obnova, kontrola integrity

(function inicializujTrezor(globalni) {

  // ─── Klíče úložiště ───────────────────────────────────────────────────────
  const KLIC_JADRO        = 'fruit.trezor.jadro.v1';
  const KLIC_UCENI        = 'fruit.trezor.uceni.v1';
  const KLIC_ZALOHA       = 'fruit.trezor.zaloha.v1';
  const KLIC_KONTROLA     = 'fruit.trezor.kontrola.v1';

  // ─── Základní sada symbolů (Core Vault) ───────────────────────────────────
  const ZAKLADNI_SYMBOLY = {
    // Písmena
    pismenka: 'aábcčdďeéěfghiíjklmnňoópqrřsštťuúůvwxyýzž' +
              'AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ',
    // Čísla
    cisla: '0123456789',
    // Základní glyph Michala Klimka — srdce systému
    glyphMichal: '(∩^o^)⊃━☆',
    glyphVarianty: ['(∩^o^)⊃━☆ﾟ.*･｡', '(∩^o^)⊃━☆ﾟ', '(∩^o^)⊃━☆ ✨'],
    // Speciální znaky
    specialniZnaky: '!?.,;:()[]{}@#$%^&*-_=+|\\/<>~`\'"',
    // Emoji skupina
    emojiZakladni: ['✨', '💫', '🌟', '⭐', '❤️', '💖', '🎯', '🎮', '🛡️', '⚔️', '🧠', '🎨'],
    // Matematické symboly
    matematika: '+-×÷=≠<>≤≥∞∑∏√∫',
    // Šipky a speciální tvary
    sipky: '→←↑↓↔↕⇒⇐⇑⇓⇔',
    // VAFT specifické
    vaftSymboly: ["Fru'i¡'T", 'Vivere', 'atque', 'VAFT', '∩', '⊃', '━', '☆']
  };

  // ─── Core Vault ───────────────────────────────────────────────────────────
  const jadroTrezoru = {
    symboly: {},
    inicializovan: false,

    inicializuj() {
      if (this.inicializovan) return;

      // Načteme uložené nebo použijeme základní
      try {
        const ulozene = localStorage.getItem(KLIC_JADRO);
        if (ulozene) {
          this.symboly = JSON.parse(ulozene);
        } else {
          this.symboly = Object.assign({}, ZAKLADNI_SYMBOLY);
          this._uloz();
        }
      } catch (_) {
        this.symboly = Object.assign({}, ZAKLADNI_SYMBOLY);
      }

      this.inicializovan = true;
      _zaloguj('Jádrový trezor inicializován (' + Object.keys(this.symboly).length + ' kategorií)');
    },

    /**
     * Přidá nový symbol do jádrového trezoru
     */
    pridejSymbol(kategorie, symbol) {
      if (!kategorie || !symbol) return false;

      if (!this.symboly[kategorie]) this.symboly[kategorie] = [];

      // Duplicity zabráníme
      const existujici = Array.isArray(this.symboly[kategorie])
        ? this.symboly[kategorie]
        : [];

      if (!existujici.includes(symbol)) {
        existujici.push(symbol);
        this.symboly[kategorie] = existujici;
        this._uloz();
        _zaloguj('Symbol "' + symbol + '" přidán do kategorie "' + kategorie + '"');
        return true;
      }

      return false; // Již existuje
    },

    /**
     * Získá symboly podle kategorie
     */
    ziskejKategorii(kategorie) {
      return this.symboly[kategorie] || null;
    },

    /**
     * Kontrola existence symbolu
     */
    obsahujeSymbol(symbol) {
      return Object.values(this.symboly).some(function(hodnota) {
        if (Array.isArray(hodnota)) return hodnota.includes(symbol);
        if (typeof hodnota === 'string') return hodnota.includes(symbol);
        return false;
      });
    },

    _uloz() {
      try {
        localStorage.setItem(KLIC_JADRO, JSON.stringify(this.symboly));
      } catch (_) {}
    }
  };

  // ─── Learning Vault ───────────────────────────────────────────────────────
  const trezorUceni = {
    nauceneSymboly: [],
    kombinace: [],

    inicializuj() {
      try {
        const ulozene = localStorage.getItem(KLIC_UCENI);
        if (ulozene) {
          const data = JSON.parse(ulozene);
          this.nauceneSymboly = data.nauceneSymboly || [];
          this.kombinace = data.kombinace || [];
        }
      } catch (_) {}
    },

    /**
     * Zaznamená nový naučený symbol
     */
    zaznamenejUceni(symbol, kontext, zdroj) {
      const zaznam = {
        id: _generujId(),
        symbol: symbol,
        kontext: kontext || '',
        zdroj: zdroj || 'ucitel',
        naucen: new Date().toISOString(),
        pouziti: 0
      };
      this.nauceneSymboly.push(zaznam);
      this._uloz();
      _zaloguj('Nový symbol naučen: "' + symbol + '"');
      return zaznam;
    },

    /**
     * Zaznamená novou kombinaci symbolů
     */
    zaznamenejKombinaci(symboly, vysledek, popis) {
      if (!Array.isArray(symboly) || symboly.length < 2) return null;

      const kombinace = {
        id: _generujId(),
        symboly: symboly,
        vysledek: vysledek || '',
        popis: popis || '',
        vytvorena: new Date().toISOString(),
        pouziti: 0
      };
      this.kombinace.push(kombinace);
      this._uloz();
      _zaloguj('Nová kombinace: [' + symboly.join(', ') + '] → ' + vysledek);
      return kombinace;
    },

    /**
     * Najde kombinaci podle symbolů
     */
    najdiKombinaci(symboly) {
      return this.kombinace.find(function(k) {
        return JSON.stringify(k.symboly.sort()) === JSON.stringify(symboly.slice().sort());
      }) || null;
    },

    _uloz() {
      try {
        localStorage.setItem(KLIC_UCENI, JSON.stringify({
          nauceneSymboly: this.nauceneSymboly,
          kombinace: this.kombinace
        }));
      } catch (_) {}
    }
  };

  // ─── Backup Vault ─────────────────────────────────────────────────────────
  const trezorZalohy = {

    /**
     * Vytvoří zálohu celého trezoru
     * Záloha je šifrovaná klíčem majitele
     */
    vytvorZalohu(klic) {
      const data = {
        cas: new Date().toISOString(),
        verze: '1.0',
        jadroTrezoru: jadroTrezoru.symboly,
        trezorUceni: {
          nauceneSymboly: trezorUceni.nauceneSymboly,
          kombinace: trezorUceni.kombinace
        }
      };

      const serializo = JSON.stringify(data);
      let ulozeno;

      // Pokus o šifrování pokud je dostupné
      if (klic && globalni.fruiTSifrovani) {
        ulozeno = globalni.fruiTSifrovani.zasifruj(serializo, klic);
      } else {
        ulozeno = btoa(encodeURIComponent(serializo)); // základní kódování bez šifrování
      }

      try {
        localStorage.setItem(KLIC_ZALOHA, ulozeno);
      } catch (_) {}

      _zaloguj('Záloha trezoru vytvořena: ' + data.cas);
      return { ok: true, cas: data.cas, velikost: serializo.length };
    },

    /**
     * Obnoví trezor ze zálohy
     */
    obnovZeZalohy(klic) {
      try {
        const ulozeno = localStorage.getItem(KLIC_ZALOHA);
        if (!ulozeno) return { ok: false, duvod: 'Záloha nenalezena.' };

        let serializo;
        if (klic && globalni.fruiTSifrovani) {
          serializo = globalni.fruiTSifrovani.desifruj(ulozeno, klic);
        } else {
          serializo = decodeURIComponent(atob(ulozeno));
        }

        const data = JSON.parse(serializo);

        // Obnova jádrového trezoru
        if (data.jadroTrezoru) {
          jadroTrezoru.symboly = data.jadroTrezoru;
          jadroTrezoru._uloz();
        }

        // Obnova trezoru učení
        if (data.trezorUceni) {
          trezorUceni.nauceneSymboly = data.trezorUceni.nauceneSymboly || [];
          trezorUceni.kombinace = data.trezorUceni.kombinace || [];
          trezorUceni._uloz();
        }

        _zaloguj('Trezor obnoven ze zálohy: ' + data.cas);
        return { ok: true, casPuvodni: data.cas };

      } catch (e) {
        _zaloguj('Chyba při obnově ze zálohy: ' + e.message);
        return { ok: false, duvod: 'Chyba při obnově: ' + e.message };
      }
    }
  };

  // ─── Symbol Integrity Check ───────────────────────────────────────────────
  const kontrolaIntegrity = {

    /**
     * Zkontroluje, zda je symbol platný a konzistentní
     */
    zkontrolujSymbol(symbol) {
      if (!symbol || typeof symbol !== 'string') {
        return { ok: false, duvod: 'Symbol musí být neprázdný řetězec.' };
      }

      // Minimální délka
      if (symbol.trim().length === 0) {
        return { ok: false, duvod: 'Symbol nesmí být prázdný.' };
      }

      // Symbol nesmí obsahovat škodlivé vzory (XSS, injection)
      const nebezpecneVzory = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i
      ];
      for (let i = 0; i < nebezpecneVzory.length; i++) {
        if (nebezpecneVzory[i].test(symbol)) {
          return { ok: false, duvod: 'Symbol obsahuje potenciálně nebezpečný obsah.' };
        }
      }

      return { ok: true, symbol: symbol };
    },

    /**
     * Ověří integritu celého trezoru
     */
    overIntegrituTrezoru() {
      const vysledky = [];
      let chyb = 0;

      // Kontrola jádrového trezoru
      Object.keys(jadroTrezoru.symboly).forEach(function(kategorie) {
        const hodnota = jadroTrezoru.symboly[kategorie];
        if (Array.isArray(hodnota)) {
          hodnota.forEach(function(sym) {
            const kontrola = kontrolaIntegrity.zkontrolujSymbol(sym);
            if (!kontrola.ok) {
              vysledky.push({ kategorie: kategorie, symbol: sym, chyba: kontrola.duvod });
              chyb++;
            }
          });
        }
      });

      const zprava = chyb === 0
        ? 'Integrita trezoru ověřena — vše v pořádku.'
        : 'Nalezeno ' + chyb + ' problémů v integritě trezoru!';

      _zaloguj(zprava);

      return {
        ok: chyb === 0,
        chyb: chyb,
        vysledky: vysledky,
        zprava: zprava
      };
    }
  };

  // ─── Recovery System ──────────────────────────────────────────────────────
  const systemObnovy = {

    /**
     * Obnoví trezor do bezpečného (továrního) stavu
     * Ztratí naučené symboly — ale systém bude bezpečný
     */
    obnovDoTovarnihoPozice() {
      _zaloguj('VAROVÁNÍ: Obnovení do továrního nastavení!');

      jadroTrezoru.symboly = Object.assign({}, ZAKLADNI_SYMBOLY);
      jadroTrezoru._uloz();

      trezorUceni.nauceneSymboly = [];
      trezorUceni.kombinace = [];
      trezorUceni._uloz();

      _zaloguj('Trezor obnoven do továrního nastavení.');

      return {
        ok: true,
        zprava: 'Trezor je nyní v základním (továrním) stavu.',
        obnoveno: new Date().toISOString()
      };
    }
  };

  // ─── Pomocné funkce ────────────────────────────────────────────────────────

  function _zaloguj(zprava) {
    if (globalni.fruiTAuditLog) {
      globalni.fruiTAuditLog.zaznamenej({
        typ: 'TREZOR',
        zprava: zprava
      });
    } else {
      console.log('[FruiT TREZOR]', zprava);
    }
  }

  function _generujId() {
    return 'sym_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  }

  // ─── Inicializace ──────────────────────────────────────────────────────────
  jadroTrezoru.inicializuj();
  trezorUceni.inicializuj();

  // ─── Registrace do globálního prostoru ────────────────────────────────────
  globalni.fruiTTrezor = {
    jadro:         jadroTrezoru,
    uceni:         trezorUceni,
    zaloha:        trezorZalohy,
    integrita:     kontrolaIntegrity,
    obnova:        systemObnovy,
    zakladniSada:  ZAKLADNI_SYMBOLY
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
