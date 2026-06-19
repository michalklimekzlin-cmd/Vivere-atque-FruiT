// vaft.guardian.client.js
// klientská stráž pro Vivere atque Frui¡'T
// mluví s Netlify Functions na vivereatquefruit.netlify.app

;(function (win) {
  const GUARDIAN = {};
  const BASE = 'https://vivereatquefruit.netlify.app/.netlify/functions';

  // jednoduché PoW – jen aby to něco sežralo 💪
  async function doLocalWork(text, difficulty = 13) {
    // difficulty = kolik nul na začátku hashe chceme
    const enc = new TextEncoder();
    let nonce = 0;
    const targetPrefix = '0'.repeat(Math.floor(difficulty / 4)); // hodně hrubé

    while (nonce < 50_000) {           // limit, ať se ti iPhone neuvaří
      const payload = text + '::' + nonce;
      const data = enc.encode(payload);
      const hashBuf = await crypto.subtle.digest('SHA-256', data);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
      if (hashHex.startsWith(targetPrefix)) {
        return { nonce, hash: hashHex };
      }
      nonce++;
    }
    // když se to nepovede, vracíme alespoň nějaký nonce
    return { nonce: 0, hash: '' };
  }

  // 1) vyžádá si challenge od Netlify
  async function getChallenge() {
    const res = await fetch(`${BASE}/guardian-challenge`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('guardian: challenge fail');
    return res.json();
  }

  // 2) pošle výsledek
  async function submitSolution(payload) {
    const res = await fetch(`${BASE}/guardian-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('guardian: submit fail');
    return res.json();
  }

  // veřejná funkce – tohle volá tvůj sendToHlavoun()
  GUARDIAN.checkMessage = async function (text) {
    try {
      // stáhni si challenge
      const challenge = await getChallenge(); 
      // udělej lokální práci (Proof of Work)
      const work = await doLocalWork(text, challenge.difficulty || 13);

      // pošli zpět, všimni si že to přibalí i tu zprávu
      const result = await submitSolution({
        challengeId: challenge.challengeId,
        seed: challenge.seed,
        message: text,
        nonce: work.nonce,
        pow: work.hash
      });

      // Netlify funkce ti může říct „ok“ nebo „sus“
      if (result && result.status === 'ok') {
        console.log('[guardian] ok ✅');
        // přidáme palivo – vyvolá událost do hlavního světa
        window.dispatchEvent(new CustomEvent('guardian:reward'));
      } else {
        console.warn('[guardian] suspicious input ⚠️', result);
      }
    } catch (err) {
      console.warn('[guardian] error ❌', err);
    }
  };

  // export
  win.VAFT = win.VAFT || {};
  win.VAFT.guardian = GUARDIAN;
})(window);
