// fruiT-jadro/bezpecnost/bezpecnostni-jadro.js
// Vivere atque Fru'i¡'T — Bezpečnostní architektura
// Ochrana na všech vrstvách: autentifikace, integrita, audit, shutdown, šifrování

(function inicializujBezpecnost(globalni) {

  // ─── Konfigurační konstanty ────────────────────────────────────────────────
  const KLIC_AUDITU     = 'fruit.audit.v1';
  const KLIC_STAVU      = 'fruit.bezpecnost.stav.v1';
  const KLIC_INTEGRITY  = 'fruit.integrita.v1';
  const MAX_ZAZNAMU_AUDITU = 1000;

  // Stavy systému
  const STAVY = {
    AKTIVNI:    'AKTIVNI',
    PODEZRENI:  'PODEZRENI',
    UZAMCENO:   'UZAMCENO',
    NOUZOVY:    'NOUZOVY_SHUTDOWN'
  };

  // ─── Audit Log ────────────────────────────────────────────────────────────
  const auditLog = {
    zaznamy: [],

    inicializuj() {
      try {
        const ulozeno = localStorage.getItem(KLIC_AUDITU);
        if (ulozeno) this.zaznamy = JSON.parse(ulozeno) || [];
      } catch (_) {
        this.zaznamy = [];
      }
    },

    /**
     * Zaznamená akci do audit logu
     * @param {Object} zaznam - { typ, zprava, detail, autor }
     */
    zaznamenej(zaznam) {
      const polozka = {
        id: _generujId(),
        cas: new Date().toISOString(),
        typ: zaznam.typ || 'INFO',
        zprava: zaznam.zprava || '',
        detail: zaznam.detail || '',
        autor: zaznam.autor || 'SYSTEM'
      };

      this.zaznamy.unshift(polozka); // nejnovější první

      // Omezení velikosti
      if (this.zaznamy.length > MAX_ZAZNAMU_AUDITU) {
        this.zaznamy = this.zaznamy.slice(0, MAX_ZAZNAMU_AUDITU);
      }

      this._uloz();

      // Konzole pro průhlednost
      console.log('[FruiT AUDIT]', polozka.cas, polozka.typ, polozka.zprava);

      return polozka;
    },

    /**
     * Vrátí posledních N záznamů
     */
    ziskejPosledni(pocet) {
      pocet = pocet || 10;
      return this.zaznamy.slice(0, pocet);
    },

    /**
     * Filtruje záznamy podle typu
     */
    filtrujPodleTypu(typ) {
      return this.zaznamy.filter(function(z) { return z.typ === typ; });
    },

    /**
     * Exportuje celý log (pro Michala)
     */
    exportuj() {
      return {
        celkem: this.zaznamy.length,
        posledniAktualizace: this.zaznamy[0] ? this.zaznamy[0].cas : null,
        zaznamy: this.zaznamy
      };
    },

    _uloz() {
      try {
        localStorage.setItem(KLIC_AUDITU, JSON.stringify(this.zaznamy));
      } catch (_) {
        // Pokud localStorage plný, pokračujeme v paměti
      }
    }
  };

  // ─── Vrstva integrity jádra ────────────────────────────────────────────────
  const vrstvIntegrity = {
    checksumy: {},

    /**
     * Registruje modul pro kontrolu integrity
     */
    registrujModul(nazev, obsah) {
      const checksum = _vypocitejChecksum(obsah);
      this.checksumy[nazev] = {
        checksum: checksum,
        registrovan: new Date().toISOString()
      };
      this._uloz();

      auditLog.zaznamenej({
        typ: 'INTEGRITA_REGISTRACE',
        zprava: 'Modul "' + nazev + '" registrován pro kontrolu integrity',
        detail: 'checksum: ' + checksum
      });

      return checksum;
    },

    /**
     * Ověří integritu modulu
     */
    overIntegritu(nazev, aktualniObsah) {
      const ulozeny = this.checksumy[nazev];
      if (!ulozeny) {
        auditLog.zaznamenej({
          typ: 'INTEGRITA_CHYBA',
          zprava: 'Modul "' + nazev + '" není registrován!',
          detail: 'Neznámý modul'
        });
        return { ok: false, duvod: 'Modul není registrován' };
      }

      const aktualniChecksum = _vypocitejChecksum(aktualniObsah);
      const ok = aktualniChecksum === ulozeny.checksum;

      if (!ok) {
        auditLog.zaznamenej({
          typ: 'INTEGRITA_NARUSENA',
          zprava: 'VAROVÁNÍ: Integrita modulu "' + nazev + '" narušena!',
          detail: 'Původní: ' + ulozeny.checksum + ' | Aktuální: ' + aktualniChecksum
        });
      }

      return { ok: ok, nazev: nazev, aktualni: aktualniChecksum, ulozeny: ulozeny.checksum };
    },

    _uloz() {
      try {
        localStorage.setItem(KLIC_INTEGRITY, JSON.stringify(this.checksumy));
      } catch (_) {}
    },

    _nacti() {
      try {
        const ulozeno = localStorage.getItem(KLIC_INTEGRITY);
        if (ulozeno) this.checksumy = JSON.parse(ulozeno) || {};
      } catch (_) {}
    }
  };

  // ─── Vrstva šifrování ─────────────────────────────────────────────────────
  // Jednoduchá symetrická XOR šifra pro citlivá data
  // (Pro produkci: použít Web Crypto API)
  const sifrovaniVrstva = {

    /**
     * Zašifruje text pomocí klíče
     * @param {string} text - text k šifrování
     * @param {string} klic - šifrovací klíč
     * @returns {string} šifrovaný text (base64)
     */
    zasifruj(text, klic) {
      if (!text || !klic) return '';
      try {
        const kodovany = _xorSifra(text, klic);
        return btoa(unescape(encodeURIComponent(kodovany)));
      } catch (_) {
        return '';
      }
    },

    /**
     * Dešifruje text
     */
    desifruj(zasifrovaný, klic) {
      if (!zasifrovaný || !klic) return '';
      try {
        const kodovany = decodeURIComponent(escape(atob(zasifrovaný)));
        return _xorSifra(kodovany, klic);
      } catch (_) {
        return '';
      }
    },

    /**
     * Uloží citlivý údaj šifrovaně
     */
    ulozCitlivy(nazev, hodnota, klic) {
      const zasifrovan = this.zasifruj(JSON.stringify(hodnota), klic);
      localStorage.setItem('fruit.safe.' + nazev, zasifrovan);
      auditLog.zaznamenej({
        typ: 'SIFROVANI_ULOZENO',
        zprava: 'Citlivý údaj "' + nazev + '" uložen šifrovaně'
      });
    },

    /**
     * Načte citlivý údaj
     */
    nactiCitlivy(nazev, klic) {
      try {
        const zasifrovan = localStorage.getItem('fruit.safe.' + nazev);
        if (!zasifrovan) return null;
        return JSON.parse(this.desifruj(zasifrovan, klic));
      } catch (_) {
        return null;
      }
    }
  };

  // ─── Emergency Shutdown ───────────────────────────────────────────────────
  const nouzovyShutdown = {
    _aktivovan: false,

    /**
     * Aktivuje nouzový shutdown — izolace systému
     * Pouze pro Michala!
     */
    aktivuj(duvod) {
      if (this._aktivovan) return;
      this._aktivovan = true;

      auditLog.zaznamenej({
        typ: 'NOUZOVY_SHUTDOWN',
        zprava: 'NOUZOVÝ SHUTDOWN AKTIVOVÁN!',
        detail: duvod || 'Bez uvedeného důvodu'
      });

      // Uložení stavu
      try {
        localStorage.setItem(KLIC_STAVU, JSON.stringify({
          stav: STAVY.NOUZOVY,
          cas: new Date().toISOString(),
          duvod: duvod
        }));
      } catch (_) {}

      // Upozornění
      console.error('[FruiT NOUZOVÝ SHUTDOWN]', duvod);

      return {
        aktivovan: true,
        cas: new Date().toISOString(),
        duvod: duvod,
        zprava: 'Systém je nyní v nouzovém režimu. Kontaktuj Michala Klimka.'
      };
    },

    /**
     * Zruší nouzový shutdown (pouze s autorizací)
     */
    deaktivuj(autorizace) {
      if (!autorizace || !autorizace.overeno) {
        auditLog.zaznamenej({
          typ: 'SHUTDOWN_ODMITNUT',
          zprava: 'Pokus o deaktivaci shutdownu bez autorizace!'
        });
        return false;
      }

      this._aktivovan = false;
      try {
        localStorage.setItem(KLIC_STAVU, JSON.stringify({
          stav: STAVY.AKTIVNI,
          cas: new Date().toISOString()
        }));
      } catch (_) {}

      auditLog.zaznamenej({
        typ: 'SHUTDOWN_DEAKTIVOVAN',
        zprava: 'Nouzový shutdown deaktivován',
        autor: autorizace.autor || 'NEZNAMY'
      });

      return true;
    },

    jeAktivni() {
      return this._aktivovan;
    }
  };

  // ─── Autentifikační vrstva ─────────────────────────────────────────────────
  const autentifikace = {

    /**
     * Ověří přístup pomocí glyph-based autentifikace
     * Glyph je podpisem, ne heslem — je to styl, ne tajemství
     */
    overPristup(pozadavek) {
      // Kontrola shutdown stavu
      if (nouzovyShutdown.jeAktivni()) {
        return {
          povoleno: false,
          duvod: 'Systém je v nouzovém režimu. Přístup blokován.'
        };
      }

      // Základní validace
      if (!pozadavek || !pozadavek.text) {
        return { povoleno: false, duvod: 'Neplatný požadavek.' };
      }

      // Použití autenticity modulu
      const autenticita = globalni.fruiTAutenticita;
      if (!autenticita) {
        auditLog.zaznamenej({
          typ: 'CHYBA_KONFIGURACE',
          zprava: 'Modul autenticity není dostupný!'
        });
        return { povoleno: false, duvod: 'Chyba konfigurace systému.' };
      }

      const vysledek = autenticita.proverAutora(pozadavek);

      auditLog.zaznamenej({
        typ: vysledek.jeDuveryhodny ? 'PRISTUP_POVOLEN' : 'PRISTUP_ODEPREN',
        zprava: vysledek.jeDuveryhodny ? 'Přístup povolen' : 'Přístup odepřen',
        detail: 'Skóre: ' + vysledek.skore + ' | ' + vysledek.duvod
      });

      return {
        povoleno: vysledek.jeDuveryhodny,
        skore: vysledek.skore,
        stav: vysledek.stav,
        duvod: vysledek.duvod
      };
    }
  };

  // ─── Pomocné funkce ────────────────────────────────────────────────────────

  function _generujId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function _vypocitejChecksum(text) {
    // Jednoduchý hash pro kontrolu integrity
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const znak = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + znak;
      hash = hash & hash; // Konverze na 32bit integer
    }
    return hash.toString(36);
  }

  function _xorSifra(text, klic) {
    let vysledek = '';
    for (let i = 0; i < text.length; i++) {
      vysledek += String.fromCharCode(
        text.charCodeAt(i) ^ klic.charCodeAt(i % klic.length)
      );
    }
    return vysledek;
  }

  // ─── Inicializace ──────────────────────────────────────────────────────────
  auditLog.inicializuj();
  vrstvIntegrity._nacti();

  auditLog.zaznamenej({
    typ: 'SYSTEM_START',
    zprava: "Bezpečnostní jádro Vivere atque Fru'i¡'T inicializováno",
    detail: 'Všechny vrstvy aktivní'
  });

  // ─── Registrace do globálního prostoru ────────────────────────────────────
  globalni.fruiTAuditLog        = auditLog;
  globalni.fruiTIntegrita       = vrstvIntegrity;
  globalni.fruiTSifrovani       = sifrovaniVrstva;
  globalni.fruiTNouzovyShutdown = nouzovyShutdown;
  globalni.fruiTAutentifikace   = autentifikace;

  // Hlavní bezpečnostní objekt
  globalni.fruiTBezpecnost = {
    auditLog:        auditLog,
    integrita:       vrstvIntegrity,
    sifrovani:       sifrovaniVrstva,
    nouzovyShutdown: nouzovyShutdown,
    autentifikace:   autentifikace,
    stavy:           STAVY
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
