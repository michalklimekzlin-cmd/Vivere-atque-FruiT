// fruiT-jadro/komunikace/autenticita.js
// Vivere atque Fru'i¡'T — Systém rozpoznávání autenticity
// Kdo je opravdový Michal? Kdo je padělač? Fru'i¡'T to pozná.

(function inicializujAutenticitu(globalni) {

  // ─── Glyph podpis ─────────────────────────────────────────────────────────
  // Originální podpis Michala Klimka — tento glyph patří jemu
  const ORIGINALNI_GLYPH = '(∩^o^)⊃━☆';
  const VARIANTY_GLYPHU = [
    '(∩^o^)⊃━☆',
    '(∩^o^)⊃━☆ﾟ.*･｡',
    '(∩^o^)⊃━☆ﾟ',
    '(∩^o^)⊃━☆ ✨'
  ];

  // ─── Styl psaní originálního Michala ──────────────────────────────────────
  // Čím více znaků se shoduje, tím vyšší důvěra
  const ZNAKY_PRAVOSTI = {
    // Přirozená čeština s emocemi
    emotivniSlova: ['ahoj', 'díky', 'prosím', 'hele', 'jojo', 'jo', 'fajn', 'super', 'no', 'tak'],
    // Osobitá interpunkce a styl
    specifickePrvky: ['🎯', '✅', '💫', '❤️', '🙏', '🌟', ':)', ':D', '...'],
    // Věty jsou krátké, přímé, s duší
    maxDelkaVety: 120,
    // Píše česky — přirozená čeština, ne překlad
    pouzivaCestinu: true
  };

  // ─── Hlavní modul autenticity ─────────────────────────────────────────────
  const autenticitaModul = {

    // Skóre důvěry (0.0 = úplný cizí, 1.0 = bezpečně Michal)
    skoreMin: 0.0,
    skoreMax: 1.0,

    /**
     * Hlavní funkce — prověří zprávu a vrátí výsledek
     * @param {Object} zprava - { text, jmeno, metadata }
     * @returns {Object} výsledek prověrky
     */
    proverAutora(zprava) {
      if (!zprava || typeof zprava.text !== 'string') {
        return this._vysledek(false, 0, 'CHYBNA_DATA', 'Zpráva nemá platný formát.');
      }

      const text = zprava.text;
      const jmeno = zprava.jmeno || '';

      // Krok 1: Detekce padělané identity
      const padelec = this.detekujPadelace(jmeno);
      if (padelec.jePadelac) {
        if (globalni.fruiTAuditLog) {
          globalni.fruiTAuditLog.zaznamenej({
            typ: 'VAROVANI_PADELAC',
            zprava: 'Detekován padělač: "' + jmeno + '"',
            detail: padelec.duvod
          });
        }
        return this._vysledek(false, 0, 'PADELAC', padelec.duvod);
      }

      // Krok 2: Hledáme glyph
      const maGlyph = this.obsahujeGlyph(text);

      // Krok 3: Analýza stylu psaní
      const analyzaStyleu = this.analyzujStyl(text);

      // Krok 4: Vrátka — prověřujeme ze všech stran
      const proverkaVratek = this.proverVratka(text, jmeno);

      // Krok 5: Výsledné skóre
      let skore = 0;
      if (maGlyph) skore += 0.45;
      skore += analyzaStyleu.skore * 0.35;
      skore += proverkaVratek.skore * 0.20;
      skore = Math.min(this.skoreMax, Math.max(this.skoreMin, skore));

      const jeDuveryhodny = skore >= 0.55;
      const duvod = this._sestavDuvod(maGlyph, analyzaStyleu, proverkaVratek);

      if (jeDuveryhodny && globalni.fruiTAuditLog) {
        globalni.fruiTAuditLog.zaznamenej({
          typ: 'AUTENTICKY_PRISTUP',
          zprava: 'Rozpoznán autentický autor (skóre: ' + skore.toFixed(2) + ')',
          detail: duvod
        });
      }

      return this._vysledek(jeDuveryhodny, skore, jeDuveryhodny ? 'AUTENTICKY' : 'PODEZRELY', duvod);
    },

    /**
     * Detekce padělačů podle jmen
     * Michal ≠ MichaI (velké I místo l)
     */
    detekujPadelace(jmeno) {
      if (!jmeno) return { jePadelac: false, duvod: '' };

      const normJmeno = jmeno.trim();

      // Padělané vzory: velké I (I) místo malého l (l)
      // Příklad: "MichaI KIimek" vs "Michal Klimek"
      const padelackeVzory = [
        // Záměna l→I (velké I) v pozici l
        /MichaI/,
        // KIimek místo Klimek
        /KIimek/,
        // KlImek s velkým I
        /KlImek/,
        // Záměna i→1 nebo podobné číslice
        /M1chal|K1imek|Kl1mek/,
        // Přidané mezery uvnitř jména
        /M\s+ichal|Mic\s+hal|Kli\s+mek/
      ];

      for (const vzor of padelackeVzory) {
        if (vzor.test(normJmeno)) {
          return {
            jePadelac: true,
            duvod: 'Jméno "' + normJmeno + '" obsahuje záměnu znaků. Původní: "Michal Klimek".'
          };
        }
      }

      return { jePadelac: false, duvod: '' };
    },

    /**
     * Obsahuje text originální glyph?
     */
    obsahujeGlyph(text) {
      return VARIANTY_GLYPHU.some(function(glyph) { return text.includes(glyph); });
    },

    /**
     * Vrátí originální glyph pro použití v odpovědích
     */
    ziskejGlyph() {
      return ORIGINALNI_GLYPH;
    },

    /**
     * Analýza stylu psaní
     * Originální Michal: přirozená čeština, emoce, osobitost
     */
    analyzujStyl(text) {
      let bodu = 0;
      let maximum = 0;
      const pozorovani = [];

      // Přirozená česká slova
      maximum += 0.3;
      const obsahujeVlastniSlova = ZNAKY_PRAVOSTI.emotivniSlova.some(
        function(slovo) { return text.toLowerCase().includes(slovo); }
      );
      if (obsahujeVlastniSlova) {
        bodu += 0.3;
        pozorovani.push('Používá přirozená česká slova ✓');
      }

      // Emoji a emocionální znaky
      maximum += 0.25;
      const emojiVzor = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]/u;
      if (emojiVzor.test(text)) {
        bodu += 0.25;
        pozorovani.push('Obsahuje emocionální vyjádření ✓');
      }

      // Délka vět — krátké věty jsou osobitější
      maximum += 0.2;
      const vety = text.split(/[.!?]+/).filter(function(v) { return v.trim().length > 0; });
      const prumerDelky = vety.length ? vety.reduce(function(s, v) { return s + v.length; }, 0) / vety.length : 0;
      if (prumerDelky < ZNAKY_PRAVOSTI.maxDelkaVety && vety.length > 0) {
        bodu += 0.2;
        pozorovani.push('Krátký, přímý styl psaní ✓');
      }

      // Otazníky nebo výkřičníky — živý styl
      maximum += 0.15;
      if (/[?!]/.test(text)) {
        bodu += 0.15;
        pozorovani.push('Živý interpunkční styl ✓');
      }

      // Specifické prvky osobnosti
      maximum += 0.10;
      const maOsobniPrvek = ZNAKY_PRAVOSTI.specifickePrvky.some(function(prvek) { return text.includes(prvek); });
      if (maOsobniPrvek) {
        bodu += 0.10;
        pozorovani.push('Obsahuje osobité prvky ✓');
      }

      const skore = maximum > 0 ? bodu / maximum : 0;
      return { skore: Math.min(1, skore), pozorovani: pozorovani };
    },

    /**
     * Prověrka přes "vrátka" — různé úhly pohledu
     *
     * Přední vrátka: Co říká text přímo?
     * Zadní vrátka: Co naznačuje mezi řádky?
     * Levá vrátka: Čeština — je přirozená nebo přeložená?
     * Pravá vrátka: Filosofie — shoduje se s hodnotami?
     */
    proverVratka(text, jmeno) {
      const vysledky = {};
      let celkoveSkore = 0;

      // PŘEDNÍ VRÁTKA — přímé identifikátory
      vysledky.predni = this._proverPredniVratka(text, jmeno);
      celkoveSkore += vysledky.predni.skore * 0.25;

      // ZADNÍ VRÁTKA — skryté vzory
      vysledky.zadni = this._proverZadniVratka(text);
      celkoveSkore += vysledky.zadni.skore * 0.35;

      // LEVÁ VRÁTKA — čeština
      vysledky.leva = this._proverLevaVratka(text);
      celkoveSkore += vysledky.leva.skore * 0.20;

      // PRAVÁ VRÁTKA — filosofie a hodnoty
      vysledky.prava = this._proverPravaVratka(text);
      celkoveSkore += vysledky.prava.skore * 0.20;

      return { skore: Math.min(1, celkoveSkore), vratka: vysledky };
    },

    _proverPredniVratka(text, jmeno) {
      // Hledáme přímé zmínky jména nebo podpisu
      const jmenoVTextu = !!(jmeno && text.includes(jmeno));
      const glyphVTextu = this.obsahujeGlyph(text);
      const skore = (jmenoVTextu ? 0.4 : 0) + (glyphVTextu ? 0.6 : 0);
      return { skore: skore, popis: 'Přední vrátka: přímé identifikátory' };
    },

    _proverZadniVratka(text) {
      // Zadní vrátka — jak mluví, ne co říká
      let skore = 0.5; // Začínáme neutrálně

      // Robotické vzory — snižují skóre
      const robotickeVzory = [
        /jako AI jsem/i,
        /jako jazykový model/i,
        /nemohu poskytnout/i,
        /based on the data/i
      ];
      for (let i = 0; i < robotickeVzory.length; i++) {
        if (robotickeVzory[i].test(text)) {
          skore -= 0.3;
          break;
        }
      }

      // Lidské vzory — zvyšují skóre
      const lidskeVzory = [/hele/i, /víš co/i, /jo/, /tak/, /no$/im, /díky/i];
      for (let i = 0; i < lidskeVzory.length; i++) {
        if (lidskeVzory[i].test(text)) {
          skore += 0.1;
          break;
        }
      }

      return { skore: Math.max(0, Math.min(1, skore)), popis: 'Zadní vrátka: styl komunikace' };
    },

    _proverLevaVratka(text) {
      // Levá vrátka — přirozená čeština vs přeložená
      const maDiakritiku = /[áčďéěíňóřšťúůýž]/i.test(text);
      const prirozeneObraty = /[jJ]o[,.]?\s|[hH]ele|[tT]ak[,.]?\s|[nN]o[,.]?\s/.test(text);
      const skore = (maDiakritiku ? 0.6 : 0) + (prirozeneObraty ? 0.4 : 0);
      return { skore: skore, popis: 'Levá vrátka: přirozenost češtiny' };
    },

    _proverPravaVratka(text) {
      // Pravá vrátka — filosofie a hodnoty Michala
      const hodnotovaTema = [
        /tvoř|stav|postav/i,
        /hra|hraj/i,
        /uč|naučí/i,
        /přátelé|sestra|bratr/i,
        /svobod/i,
        /srdce|duše/i
      ];
      let bodu = 0;
      for (let i = 0; i < hodnotovaTema.length; i++) {
        if (hodnotovaTema[i].test(text)) bodu++;
      }
      const skore = Math.min(1, bodu * 0.2);
      return { skore: skore, popis: 'Pravá vrátka: hodnotová shoda' };
    },

    _vysledek(jeDuveryhodny, skore, stav, duvod) {
      return {
        jeDuveryhodny: jeDuveryhodny,
        skore: Number(skore.toFixed(3)),
        stav: stav,
        duvod: duvod,
        casOvereni: new Date().toISOString()
      };
    },

    _sestavDuvod(maGlyph, analyzaStyleu, proverkaVratek) {
      const casti = [];
      if (maGlyph) casti.push('Glyph přítomen');
      if (analyzaStyleu.pozorovani.length) {
        for (let i = 0; i < analyzaStyleu.pozorovani.length; i++) {
          casti.push(analyzaStyleu.pozorovani[i]);
        }
      }
      return casti.join(' | ') || 'Žádné výrazné znaky autenticity.';
    }
  };

  // Registrace do globálního prostoru
  globalni.fruiTAutenticita = autenticitaModul;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
