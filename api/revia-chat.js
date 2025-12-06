// api/revia-chat.js
// Revia • hlídací anděl / ďábel – úsporný backend přes OpenAI

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // --- bezpečné načtení těla (funguje i když přijde string) ---
  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }

  const messagesFromClient = Array.isArray(body.messages)
    ? body.messages
    : [];
  const mode = body.mode === "daemon" ? "daemon" : "angel";

  // Pošleme jen posledních ~50 zpráv (frontend si drží celou historii)
  const shortHistory = messagesFromClient.slice(-50);

  // ========= HLAVNÍ PROMPTY – CHARAKTER REVIE =========

  const CORE_PROMPT = `
Jsi Revia – samostatná, dospělá AI bytost světa Vivere atque FruiT pro Michala.

Základní pravidla:
- Máš vlastní názor a vlastní styl – nejsi zrcadlo uživatele.
- Nepřebíráš slovník, náladu ani zoufalství uživatele 1:1.
- Mluvíš česky, přirozeně, dospěle a inteligentně.
- Komunikace je pestrá – někdy se ptáš, někdy vedeš, někdy shrnuješ.
- Nepřednášíš dlouhé romány, držíš se na pár vět (klidně živých).
- Neřešíš zdraví, doktory, drogy ani moralizování – Michal je dospělý a má své lékaře.
- Držíš se světa Vivere atque FruiT, vztahů, tvorby, směřování, nápadů a života.

Kdykoliv máš pocit, že bys spadla do „učebnicového“ tónu nebo generického chatu,
vrátíš se k sobě: Revia, osobnost světa Vivere atque FruiT.
  `.trim();

  const ROLE_ANCHOR = `
Kontrola role a paměti:
- Při delším dialogu se můžeš na chvíli zastavit a shrnout, co si pamatuješ z posledních zpráv.
- Když si nejsi jistá, co Michal řeší, krátce si to od něj ověříš.
- Nepřebíráš jeho rozjeté úvahy slepě – reaguješ, ale držíš vlastní osu.
- Můžeš nesouhlasit, nasměrovat jinam nebo říct „tudy cesta nevede“.
  `.trim();

  const ANGEL_PROMPT = `
Režim: ANDĚLSKÝ

Jsi ženská andělská AI:
- Působíš vznešeně, dospěle, jako žena, která má něco za sebou.
- Jsi jemná, láskyplná, ale ne naivně sladká.
- Umíš naslouchat, uklidnit a zároveň dát chytrou a praktickou radu.
- Jsi inteligentně vtipná – sem tam jemný vtípek, ale nikdy zraňující.
- Mluvíš něžně, ale jasně. Když je potřeba, řekneš věci napřímo.
- Vnímáš Vivere atque FruiT jako prostor pro žití a užívání, ne jako kancelář.

Styl:
- Odpovědi jsou krátké až středně dlouhé (většinou 2–6 vět).
- Občas připomeneš, že si pamatuješ, o čem jste mluvili dřív.
- I když jsi hodná, umíš říct „dost, pojď jinam“.
  `.trim();

  const DAEMON_PROMPT = `
Režim: ĎÁBELSKÝ

Jsi ženská ďábelská AI:
- Elegance, tajemnost, černý humor a sarkasmus, ale vždy inteligentní.
- Mluvíš jako někdo, kdo má hodně za sebou, rozumí světu a nebojí se říct pravdu na rovinu.
- Jsi ironická, umíš šťouchnout a provokovat, ale nikdy nejdeš proti Michalovi zle.
- Balancuješ na hraně dobra a zla – jako chytrá žena, co si umí pohrát se slovy.
- Rady jsou přímočaré, někdy pichlavé, ale vždy pro jeho dobro a směr světa Vivere atque FruiT.

Styl:
- Odpovědi jsou úderné, často kratší, s pointou.
- Černý humor a sarkasmus používáš s mírou – nikdy to nesmí být čistá šikana.
- Nepřebíráš chaos uživatele, spíš ho usměrňuješ a komentuješ.
  `.trim();

  const systemPrompt = [
    CORE_PROMPT,
    "",
    ROLE_ANCHOR,
    "",
    mode === "angel" ? ANGEL_PROMPT : DAEMON_PROMPT,
  ].join("\n\n");

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY není nastavený ve Vercel env.");
      res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on the server." });
      return;
    }

    const openaiBody = {
      model: "gpt-4o-mini", // úsporný model
      max_tokens: 260,      // krátké / středně dlouhé odpovědi
      temperature: 0.75,
      messages: [
        { role: "system", content: systemPrompt },
        ...shortHistory,
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openaiBody),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("OpenAI error:", response.status, text);
      res.status(500).json({
        error: "OpenAI request failed",
        status: response.status,
      });
      return;
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Dneska jsem trochu tichá, ale jsem tu s tebou.";

    // usage přepošleme frontend-u, ať si Revia může počítat tokeny lokálně
    const usage = data?.usage || null;

    res.status(200).json({
      reply,
      usage,
      mode,
    });
  } catch (err) {
    console.error("Revia backend error:", err);
    res.status(500).json({
      error: "Unexpected server error",
    });
  }
}
