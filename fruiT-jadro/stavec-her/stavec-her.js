// fruiT-jadro/stavec-her/stavec-her.js
// Vivere atque Fru'i¡'T — Game Builder Engine
// Fru'i¡'T umí stavět hry! Pravidla, světy, příběhy, herní smyčka, AI hráč

(function inicializujStavecHer(globalni) {

  // ─── Stav enginu ──────────────────────────────────────────────────────────
  const KLIC_HER = 'fruit.stavec.hry.v1';

  // ─── Engine pravidel (Rule Engine) ────────────────────────────────────────
  const enginePravidel = {
    pravidla: {},

    /**
     * Vytvoří nové pravidlo z kombinace symbolů
     * @param {Object} pravidlo - { nazev, podminky, akce, popis }
     */
    vytvorPravidlo(pravidlo) {
      if (!pravidlo.nazev) return null;

      const novePravidlo = {
        id: _generujId('pr'),
        nazev: pravidlo.nazev,
        podminky: pravidlo.podminky || [],
        akce: pravidlo.akce || [],
        popis: pravidlo.popis || '',
        vytvoreno: new Date().toISOString(),
        aktivni: true
      };

      this.pravidla[novePravidlo.id] = novePravidlo;
      _zaloguj('Pravidlo vytvořeno: "' + novePravidlo.nazev + '"');
      return novePravidlo;
    },

    /**
     * Vyhodnotí pravidla pro daný stav
     * @param {Object} stav - aktuální stav hry
     * @returns {Array} seznam akcí k provedení
     */
    vyhodnotPravidla(stav) {
      const akceKProvedeni = [];

      Object.values(this.pravidla).forEach(function(pravidlo) {
        if (!pravidlo.aktivni) return;

        const podminkySplneny = pravidlo.podminky.every(function(podminka) {
          return enginePravidel._vyhodnotPodminku(podminka, stav);
        });

        if (podminkySplneny) {
          akceKProvedeni.push({
            pravidloId: pravidlo.id,
            pravidloNazev: pravidlo.nazev,
            akce: pravidlo.akce
          });
        }
      });

      return akceKProvedeni;
    },

    _vyhodnotPodminku(podminka, stav) {
      if (!podminka || !podminka.typ) return false;

      switch (podminka.typ) {
        case 'hodnota_rovna':
          return stav[podminka.klic] === podminka.hodnota;
        case 'hodnota_vetsi':
          return (stav[podminka.klic] || 0) > podminka.hodnota;
        case 'obsahuje':
          return Array.isArray(stav[podminka.klic]) && stav[podminka.klic].includes(podminka.hodnota);
        case 'existuje':
          return podminka.klic in stav;
        default:
          return false;
      }
    }
  };

  // ─── Stavitel světa (World Builder) ───────────────────────────────────────
  const stavitelSveta = {

    /**
     * Vytvoří nové herní prostředí
     * @param {Object} konfigurace - { nazev, typ, popis, objekty }
     */
    vytvorSvet(konfigurace) {
      const svet = {
        id: _generujId('sv'),
        nazev: konfigurace.nazev || 'Nepojmenovaný svět',
        typ: konfigurace.typ || 'obecny',
        popis: konfigurace.popis || '',
        mapa: this._vytvorMapu(konfigurace.velikostMapy || { sirka: 5, vyska: 5 }),
        objekty: [],
        postavy: [],
        vytvoreno: new Date().toISOString()
      };

      // Přidáme přednastavené objekty
      if (Array.isArray(konfigurace.objekty)) {
        konfigurace.objekty.forEach(function(obj) {
          svet.objekty.push(stavitelSveta.pridejObjekt(svet, obj));
        });
      }

      _zaloguj('Svět vytvořen: "' + svet.nazev + '" (' + svet.typ + ')');
      return svet;
    },

    /**
     * Přidá objekt do světa
     */
    pridejObjekt(svet, objekt) {
      const novyObjekt = {
        id: _generujId('ob'),
        nazev: objekt.nazev || 'Objekt',
        typ: objekt.typ || 'obecny',
        pozice: objekt.pozice || { x: 0, y: 0 },
        vlastnosti: objekt.vlastnosti || {},
        interaktivni: objekt.interaktivni !== false
      };
      return novyObjekt;
    },

    /**
     * Přidá postavu (NPC nebo hráče) do světa
     */
    pridejPostavu(svet, postava) {
      const novaPostava = {
        id: _generujId('po'),
        jmeno: postava.jmeno || 'Neznámá postava',
        typ: postava.typ || 'npc',
        pozice: postava.pozice || { x: 0, y: 0 },
        vlastnosti: {
          zdravi: postava.zdravi || 100,
          energie: postava.energie || 100,
          inventar: postava.inventar || []
        },
        dialogy: postava.dialogy || []
      };
      svet.postavy.push(novaPostava);
      return novaPostava;
    },

    _vytvorMapu(velikost) {
      const mapa = [];
      for (let y = 0; y < velikost.vyska; y++) {
        const radek = [];
        for (let x = 0; x < velikost.sirka; x++) {
          radek.push({ x: x, y: y, typ: 'volno', objekt: null });
        }
        mapa.push(radek);
      }
      return mapa;
    }
  };

  // ─── Engine příběhu (Story Engine) ────────────────────────────────────────
  const enginePribehu = {

    /**
     * Vytvoří nový příběh s větvením
     */
    vytvorPribeh(konfigurace) {
      const pribeh = {
        id: _generujId('pb'),
        nazev: konfigurace.nazev || 'Nepojmenovaný příběh',
        popis: konfigurace.popis || '',
        sceny: {},
        aktualniScena: null,
        vytvoreno: new Date().toISOString()
      };

      // Přidáme scény
      if (Array.isArray(konfigurace.sceny)) {
        konfigurace.sceny.forEach(function(scena) {
          enginePribehu.pridejScenu(pribeh, scena);
        });
      }

      _zaloguj('Příběh vytvořen: "' + pribeh.nazev + '"');
      return pribeh;
    },

    /**
     * Přidá scénu do příběhu
     */
    pridejScenu(pribeh, scena) {
      const novaScena = {
        id: scena.id || _generujId('sc'),
        nazev: scena.nazev || 'Scéna',
        text: scena.text || '',
        moznosti: scena.moznosti || [],  // Větvení — výběry pro hráče
        podminkoveVetve: scena.podminkoveVetve || [],
        efekty: scena.efekty || []
      };
      pribeh.sceny[novaScena.id] = novaScena;
      return novaScena;
    },

    /**
     * Přejde na další scénu
     */
    prejdiNaScenu(pribeh, scenaId, vyber, stavHrace) {
      const scena = pribeh.sceny[scenaId];
      if (!scena) return null;

      pribeh.aktualniScena = scenaId;

      // Aplikujeme efekty scény na stav hráče
      if (stavHrace && Array.isArray(scena.efekty)) {
        scena.efekty.forEach(function(efekt) {
          if (efekt.atribut && efekt.hodnota !== undefined) {
            stavHrace[efekt.atribut] = (stavHrace[efekt.atribut] || 0) + efekt.hodnota;
          }
        });
      }

      // Najdeme dostupné možnosti
      const dostupneMoznosti = scena.moznosti.filter(function(moznost) {
        if (!moznost.podminka) return true;
        return enginePravidel._vyhodnotPodminku(moznost.podminka, stavHrace || {});
      });

      return {
        scena: scena,
        moznosti: dostupneMoznosti,
        stavHrace: stavHrace
      };
    }
  };

  // ─── Herní smyčka (Game Loop) ─────────────────────────────────────────────
  const herniSmycka = {
    aktivniHry: {},

    /**
     * Spustí novou hru
     */
    spustHru(konfigurace) {
      const hra = {
        id: _generujId('hr'),
        nazev: konfigurace.nazev || 'Nová hra',
        svet: konfigurace.svet || stavitelSveta.vytvorSvet({ nazev: 'Základní svět' }),
        pribeh: konfigurace.pribeh || null,
        hraci: {},
        stav: {
          kolo: 0,
          bezi: true,
          vitez: null,
          zacatek: new Date().toISOString()
        }
      };

      this.aktivniHry[hra.id] = hra;
      _zaloguj('Hra spuštěna: "' + hra.nazev + '" (ID: ' + hra.id + ')');
      return hra;
    },

    /**
     * Zpracuje tah hráče
     */
    zpracujTah(hraId, hracId, akce) {
      const hra = this.aktivniHry[hraId];
      if (!hra || !hra.stav.bezi) {
        return { ok: false, duvod: 'Hra není aktivní.' };
      }

      hra.stav.kolo++;
      const hrac = hra.hraci[hracId];

      // Vyhodnotíme pravidla
      const pravidlovaAkce = enginePravidel.vyhodnotPravidla({
        akce: akce.typ,
        hrac: hrac,
        kolo: hra.stav.kolo
      });

      const vysledek = {
        kolo: hra.stav.kolo,
        hracId: hracId,
        akce: akce,
        pravidlovaAkce: pravidlovaAkce,
        stav: hra.stav
      };

      _zaloguj('Kolo ' + hra.stav.kolo + ': Hráč "' + hracId + '" provedl akci "' + akce.typ + '"');
      return { ok: true, vysledek: vysledek };
    },

    /**
     * Přidá hráče do hry
     */
    pridejHrace(hraId, hrac) {
      const hra = this.aktivniHry[hraId];
      if (!hra) return null;

      const novyHrac = {
        id: hrac.id || _generujId('hc'),
        jmeno: hrac.jmeno || 'Hráč',
        typ: hrac.typ || 'clovek',  // 'clovek', 'ai', 'fruiT'
        stav: {
          zdravi: 100,
          energie: 100,
          body: 0,
          pozice: { x: 0, y: 0 }
        }
      };

      hra.hraci[novyHrac.id] = novyHrac;
      _zaloguj('Hráč přidán: "' + novyHrac.jmeno + '" (' + novyHrac.typ + ')');
      return novyHrac;
    },

    /**
     * Ukončí hru
     */
    ukonciHru(hraId, vitez) {
      const hra = this.aktivniHry[hraId];
      if (!hra) return false;

      hra.stav.bezi = false;
      hra.stav.vitez = vitez || null;
      hra.stav.konec = new Date().toISOString();

      _zaloguj('Hra ukončena: "' + hra.nazev + '" | Vítěz: ' + (vitez || 'nikdo'));
      return { ok: true, hra: hra };
    }
  };

  // ─── AI Hráč — Fru'i¡'T hraje vlastní hry ─────────────────────────────────
  const aiHrac = {

    /**
     * Fru'i¡'T se rozhodne jakou akci provést
     * @param {Object} stavHry - aktuální stav hry
     * @param {Object} stavHrace - stav AI hráče
     * @returns {Object} vybraná akce
     */
    rozhodniAkci(stavHry, stavHrace) {
      const mozneAkce = this._najdiMozneAkce(stavHry, stavHrace);

      if (mozneAkce.length === 0) {
        return { typ: 'cekej', popis: 'AI nemá dostupné akce, čeká.' };
      }

      // Jednoduché rozhodování: Priorita = nejlepší výsledek
      const vybranaAkce = this._vyberOptimalniAkci(mozneAkce, stavHrace);

      _zaloguj("Fru'i¡'T AI vybrala akci: " + vybranaAkce.typ);
      return vybranaAkce;
    },

    /**
     * Testuje hru — hraje ji sama a hlásí chyby
     */
    otestujHru(hraId) {
      const hra = herniSmycka.aktivniHry[hraId];
      if (!hra) return { ok: false, duvod: 'Hra nenalezena.' };

      const zpravy = [];
      let chyb = 0;

      // Kontrola základní struktury
      if (!hra.svet) { zpravy.push('CHYBA: Hra nemá svět!'); chyb++; }
      if (Object.keys(hra.hraci).length === 0) { zpravy.push('VAROVÁNÍ: Hra nemá žádné hráče.'); }
      if (Object.keys(enginePravidel.pravidla).length === 0) {
        zpravy.push('VAROVÁNÍ: Hra nemá definovaná pravidla.');
      }

      // Simulujeme pár tahů
      const testovyHrac = {
        id: 'fruiT_test_hrac',
        jmeno: "Fru'i¡'T (Test)",
        stav: { zdravi: 100, energie: 100, body: 0 }
      };

      for (let kolo = 0; kolo < 3; kolo++) {
        const akce = this.rozhodniAkci({ kolo: kolo }, testovyHrac.stav);
        zpravy.push('Kolo ' + (kolo + 1) + ': ' + akce.typ);
      }

      _zaloguj("Fru'i¡'T otestovala hru: " + chyb + ' chyb nalezeno');

      return {
        ok: chyb === 0,
        chyb: chyb,
        zpravy: zpravy,
        zprava: chyb === 0 ? 'Hra je hratelná!' : chyb + ' problémů nalezeno.'
      };
    },

    _najdiMozneAkce(stavHry, stavHrace) {
      const akce = [
        { typ: 'pohyb', priorita: 1 },
        { typ: 'interakce', priorita: 2 },
        { typ: 'sberos', priorita: 3 },
        { typ: 'utok', priorita: 1 },
        { typ: 'obrана', priorita: 4 }
      ];

      // Filtrujeme podle energie
      return akce.filter(function(a) {
        return (stavHrace.energie || 100) > 10;
      });
    },

    _vyberOptimalniAkci(akce, stavHrace) {
      // Seřadíme podle priority (vyšší = lepší)
      akce.sort(function(a, b) { return b.priorita - a.priorita; });

      // Přidáme trochu náhody (AI není předvídatelná)
      const index = Math.floor(Math.random() * Math.min(3, akce.length));
      return akce[index];
    }
  };

  // ─── Multiplayer Framework ────────────────────────────────────────────────
  const multiplayerFramework = {
    lobby: {},

    /**
     * Vytvoří lobby pro multiplayer hru
     */
    vytvorLobby(konfigurace) {
      const lobby = {
        id: _generujId('lo'),
        nazev: konfigurace.nazev || 'Lobby',
        maxHracu: konfigurace.maxHracu || 4,
        hraci: [],
        typ: konfigurace.typ || 'versus',  // 'versus', 'kooperace', 'fruiT_vs_fruiT'
        stav: 'ceka',
        vytvoreno: new Date().toISOString()
      };

      this.lobby[lobby.id] = lobby;
      _zaloguj('Lobby vytvořeno: "' + lobby.nazev + '" (max ' + lobby.maxHracu + ' hráčů)');
      return lobby;
    },

    /**
     * Připojí hráče do lobby
     */
    pripojHrace(lobbyId, hrac) {
      const lobby = this.lobby[lobbyId];
      if (!lobby) return { ok: false, duvod: 'Lobby nenalezeno.' };
      if (lobby.hraci.length >= lobby.maxHracu) return { ok: false, duvod: 'Lobby je plné.' };

      lobby.hraci.push({
        id: hrac.id || _generujId('hc'),
        jmeno: hrac.jmeno || 'Hráč',
        typ: hrac.typ || 'clovek',
        pripojen: new Date().toISOString()
      });

      _zaloguj('Hráč "' + hrac.jmeno + '" se připojil do lobby "' + lobby.nazev + '"');

      // Automatické spuštění pokud je lobby plné
      if (lobby.hraci.length >= lobby.maxHracu) {
        lobby.stav = 'hotovo';
        _zaloguj('Lobby "' + lobby.nazev + '" je plné — hra může začít!');
      }

      return { ok: true, lobby: lobby };
    }
  };

  // ─── Pomocné funkce ────────────────────────────────────────────────────────

  function _zaloguj(zprava) {
    if (globalni.fruiTAuditLog) {
      globalni.fruiTAuditLog.zaznamenej({ typ: 'HRA', zprava: zprava });
    } else {
      console.log('[FruiT HRA]', zprava);
    }
  }

  function _generujId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
  }

  // ─── Registrace do globálního prostoru ────────────────────────────────────
  globalni.fruiTStavecHer = {
    pravidla:    enginePravidel,
    svet:        stavitelSveta,
    pribeh:      enginePribehu,
    herniSmycka: herniSmycka,
    aiHrac:      aiHrac,
    multiplayer: multiplayerFramework
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
