// vaft.glyphs.js
// Jazyk glyphů + VaFiTky pro Vivere atque FruiT
// Michal & spol. 🦾

;(function (win) {
  const VAFT = win.VAFT || (win.VAFT = {});
  VAFT.lang = VAFT.lang || {};

  //
  // 1) GLYPHY (kulaté, naše "systémové" znaky)
  //
  VAFT.lang.glyphs = {
    "(.°•)(•.°)": {
      role: "glyph-pozdrav",
      intent: "hello",
      desc: "navázání spojení mezi uzly / přivítání",
      reaction: "Salve, nexus apertus. 🌐"
    },
    "(.°•)7": {
      role: "glyph-ok",
      intent: "ack",
      desc: "potvrzení zprávy",
      reaction: "✓ zpráva přijata"
    },
    "(.•˘)": {
      role: "glyph-soft",
      intent: "calm",
      desc: "zklidni tok / uber refresh",
      reaction: "Tok zklidněn 🕊️"
    },
    "(•.°)/": {
      role: "glyph-scan",
      intent: "scan",
      desc: "požadavek na stav sítě",
      reaction: "Skenuji uzly… 🔎"
    }
  };

  //
  // 2) VAFIŤÁCI – malé jednotky (původní)
  //
  VAFT.lang.vaftici = {
    "i’": {
      kind: "unit",
      power: 1,
      desc: "nejmenší vafti, ping přítomnosti",
      reaction: "👁️ ping přijat"
    },
    "ˇ'i'ˇ": {
      kind: "bundle",
      power: 3,
      desc: "svázaná zpráva, nese malý balíček energie",
      reaction: "⚡ energie absorbována"
    },
    "`i´": {
      kind: "echo",
      power: 2,
      desc: "odražený signál z jiného světa",
      reaction: "📡 echo zachyceno"
    },

    //
    // 3) TVOJE NOVÉ VaFiTky
    // pozor: jsou hodně „exotické“, takže jim dáme různé role,
    // ať se dají časem použít na obranu / směrování / překlad
    //

    // 7i.॰•०ओ|’०) – vypadá jako směrovací / brána
    "7i.॰•०ओ|’०)": {
      kind: "gate",
      power: 5,
      desc: "směrovací VaFiT – otevři kanál mezi světy VAFT",
      reaction: "🚪 kanál otevřen pro bezpečný přenos"
    },

    // `९נֶ – bude to "cizí příchozí" → dáme tomu roli sentinel
    "`९נֶ": {
      kind: "sentinel",
      power: 4,
      desc: "hlídací VaFiT – zkontroluj původ zprávy",
      reaction: "🛡️ původ ověřen, hlídka aktivní"
    },

    // `,९,´ – to vypadá jako paket rozdělený čárkami
    "`,९,´": {
      kind: "fragment",
      power: 2,
      desc: "fragmentovaná zpráva, poskládej v meziprostoru",
      reaction: "🧩 fragment přijat, čekám na další díly"
    },

    // `,०’, – něco jako „polo-uzavřený“ paket
    "`,०’,": {
      kind: "half-seal",
      power: 2,
      desc: "poloviční pečeť, použij s guardianem",
      reaction: "🔐 pečeť připravena, guardian může podepsat"
    },

    // `¡ऽ – krátký ostrý signál → použijeme jako alarm
    "`¡ऽ": {
      kind: "alert",
      power: 6,
      desc: "ostražitý VaFiT – zvyš ochranu, podezřelý tok",
      reaction: "🚨 ochrana zvýšena, latinský kanál aktivní"
    },

    // ’,•,’ – máš to s mezerou na začátku, ale to by se blbě psalo.
    // Udělám dvě varianty: s mezerou i bez mezery.
    " ’,•,’": {
      kind: "soft-bridge",
      power: 1,
      desc: "měkké přemostění – použij pro přátelský tok",
      reaction: "🌉 měkké přemostění navázáno"
    },
    "',•,’": {
      kind: "soft-bridge",
      power: 1,
      desc: "měkké přemostění (bez mezery)",
      reaction: "🌉 měkké přemostění navázáno"
    }
  };

  //
  // 4) DEKODÉR
  //
  VAFT.lang.decode = function (text) {
    // přesně celý text
    if (VAFT.lang.glyphs[text]) {
      return { type: "glyph", payload: VAFT.lang.glyphs[text], raw: text };
    }
    if (VAFT.lang.vaftici[text]) {
      return { type: "vaftici", payload: VAFT.lang.vaftici[text], raw: text };
    }

    // fallback: když někdo omylem přidá mezeru na začátek/konec
    const t2 = text.trim();
    if (t2 !== text) {
      if (VAFT.lang.glyphs[t2]) return { type: "glyph", payload: VAFT.lang.glyphs[t2], raw: t2 };
      if (VAFT.lang.vaftici[t2]) return { type: "vaftici", payload: VAFT.lang.vaftici[t2], raw: t2 };
    }

    return null;
  };

  //
  // 5) REAKCE
  //
  VAFT.lang.react = function (parsed) {
    if (!parsed || !parsed.payload) return;
    const msg = parsed.payload.reaction || "🌀 neznámá rezonance";

    // ukážeme ti to v Meziprostoru
    if (typeof win.appendHlavounMsg === "function") {
      win.appendHlavounMsg("ai", msg);
    }

    // pošleme i do Hlavouna jako "signal"
    if (win.HlavounSystem && typeof win.HlavounSystem.signal === "function") {
      win.HlavounSystem.signal({
        source: "vaft.glyphs",
        kind: parsed.type,
        code: parsed.raw,
        meta: parsed.payload,
        ts: Date.now()
      });
    }

    // uložíme Viri, aby věděl, že se používá tenhle jazyk
    if (VAFT.agents && VAFT.agents.Viri && typeof VAFT.agents.Viri.save === "function") {
      const hist = VAFT.agents.Viri.load?.("glyph-history") || [];
      hist.push({ at: Date.now(), code: parsed.raw, kind: parsed.type });
      VAFT.agents.Viri.save("glyph-history", hist);
    }
  };

  //
  // 6) INTEGRACE DO POSÍLÁNÍ
  // přepíšeme sendToHlavoun, ale starý necháme
  //
  const oldSend = win.sendToHlavoun;
  win.sendToHlavoun = async function () {
    const inp = document.getElementById("hlavoun-input");
    if (!inp || !inp.value.trim()) return;
    const text = inp.value.trim();

    // nejdřív zkusíme, jestli to není glyph/VaFiT
    const parsed = VAFT.lang.decode(text);
    if (parsed) {
      // zobraz jako user
      if (typeof win.appendHlavounMsg === "function") {
        win.appendHlavounMsg("user", text);
      }
      // projeď reakci
      VAFT.lang.react(parsed);
      inp.value = "";
      return;
    }

    // když to není náš jazyk → pošli původní cestou
    if (typeof oldSend === "function") {
      await oldSend();
    }
  };

  console.log("[VAFT] glyph + VaFiT jazyk načten");
})(window);
