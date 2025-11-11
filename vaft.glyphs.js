// vaft.glyphs.js
// Jazyk glyphů a vafticí pro Vivere atque FruiT
// © Michal Klimek & Kovošrot 🦾

// hlavní obal
;(function(win){
  const VAFT = win.VAFT || (win.VAFT = {});
  VAFT.lang = VAFT.lang || {};

  // --- slovník glyphů ---
  VAFT.lang.glyphs = {
    "(.°•)(•.°)": {
      role: "glyph-pozdrav",
      intent: "hello",
      desc: "glyph pozdrav / navázání spojení mezi uzly",
      reaction: "Salve, glyph přijat. 🌐"
    },
    "(.°•)7": {
      role: "glyph-ok",
      intent: "ack",
      desc: "potvrzení, že zpráva byla přijatá",
      reaction: "✓ potvrzeno"
    },
    "(.•˘)": {
      role: "glyph-soft",
      intent: "calm",
      desc: "zklidni tok / sniž refresh / uklidni síť",
      reaction: "tok zklidněn 🕊️"
    },
    "(•.°)/": {
      role: "glyph-scan",
      intent: "scan",
      desc: "požadavek o stav sítě",
      reaction: "probíhá scan uzlů 🔎"
    }
  };

  // --- slovník vafticí ---
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
    }
  };

  // --- dekodér ---
  VAFT.lang.decode = function(text){
    const g = VAFT.lang.glyphs;
    const v = VAFT.lang.vaftici;
    if (g[text]) return { type: "glyph", payload: g[text] };
    if (v[text]) return { type: "vaftici", payload: v[text] };
    return null;
  };

  // --- reakce na glyph / vafti ---
  VAFT.lang.react = function(parsed){
    if (!parsed || !parsed.payload) return;
    const msg = parsed.payload.reaction || '🌀 neznámá rezonance';
    if (typeof appendHlavounMsg === 'function') appendHlavounMsg('ai', msg);

    // pošli dál i do systémů
    if (win.HlavounSystem && typeof win.HlavounSystem.signal === 'function') {
      win.HlavounSystem.signal(parsed);
    }
    if (VAFT.agents && VAFT.agents.Viri && typeof VAFT.agents.Viri.save === 'function') {
      VAFT.agents.Viri.save('glyph-event', { at: Date.now(), glyph: parsed });
    }
  };

  // --- integrace do meziprostoru ---
  const oldSend = win.sendToHlavoun;
  win.sendToHlavoun = async function(){
    const inp = document.getElementById('hlavoun-input');
    if (!inp || !inp.value.trim()) return;
    const text = inp.value.trim();

    const parsed = VAFT.lang.decode(text);
    if (parsed){
      appendHlavounMsg('user', text);
      VAFT.lang.react(parsed);
      inp.value = '';
      return; // už dál neposíláme
    }
    // pokud to není glyph → pošli klasicky
    if (typeof oldSend === 'function') await oldSend();
  };

  console.log('[VAFT] Glyph systém načten 🌀');
})(window);
