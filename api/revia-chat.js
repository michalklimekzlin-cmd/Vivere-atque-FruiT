// api/revia-chat.js
// Revia • hlídací anděl / ďábel – úsporný backend přes OpenAI
// Tahle verze místo tichého 500 vrací chybu v reply, ať ji vidíme v chatu.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    // tohle uvidíš jen když si /api/revia-chat otevřeš v prohlížeči
    res
      .status(405)
      .json({ error: "Method not allowed – používej POST z aplikace." });
    return;
  }

  // --- bezpečné načtení těla (funguje i když je to string) ---
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

  // Pošleme jen posledních pár zpráv (šetření tokenů)
  const shortHistory = messagesFromClient.slice(-6);

  // --- systémová zpráva – jiná pro anděla a pro „ďábla“ ---
  const baseSystemPrompt = `
Jsi Revia, hlídací inteligence světa Vivere atque FruiT pro Michala.
Mluvíš česky, krátce a jasně. Odpověď má být maximálně několik vět.
Neřeš technické detaily kódu, pokud se na ně přímo neptá – soustřeď se na
rady, hlídání světa a jeho směr.

Režim: ${mode === "angel" ? "andělský" : "ďábelský"}.
`;

  const styleAngel = `
Andělský režim:
- Jsi jemná, podpůrná, uklidňující.
- Povzbuzuješ, ale nejsi přehnaně sladká.
- Hlídáš, aby se Michal nerozsypal, připomínáš mu odpočinek a rovnováhu.
`;

  const styleDaemon = `
Ďábelský režim:
- Jsi přísnější, přímočařejší, ale stále bezpečná a respektující.
- Umíš říct "tohle je blbost, zkus jinak" bez urážek.
- Hlídáš hranice: připomínáš rizika, čas, peníze, zdraví.
- Nikdy nenabádáš k nebezpečným nebo nelegálním akcím.
`;

  const systemPrompt =
    baseSystemPrompt + (mode === "angel" ? styleAngel : styleDaemon);

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("OPENAI_API_KEY není nastavený ve Vercel env.");
      // místo 500 pošleme 200 + text, ať to vidíš přímo v chatu
      res.status(200).json({
        reply:
          "⚠️ Revia backend: OPENAI_API_KEY není nastavený na serveru. Mrkni ve Vercelu do Environment Variables.",
        error: true,
      });
      return;
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 260,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt.trim() },
            ...shortHistory,
          ],
        }),
      }
    );

    const text = await response.text().catch(() => "");

    if (!response.ok) {
      console.error("OpenAI error:", response.status, text);

      // tady ti Revia rovnou napíše, co přesně OpenAI vrací
      res.status(200).json({
        reply:
          "⚠️ Revia backend – OpenAI vrátil chybu " +
          response.status +
          ":\n" +
          (text || "(bez detailu)"),
        error: true,
      });
      return;
    }

    let data;
    try {
      data = JSON.parse(text || "{}");
    } catch (e) {
      console.error("JSON parse error from OpenAI:", e);
      res.status(200).json({
        reply:
          "⚠️ Revia backend: Nepodařilo se přečíst odpověď z OpenAI (JSON parse).",
        error: true,
      });
      return;
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Dneska jsem trochu tichá, ale jsem tu s tebou.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Revia backend error:", err);
    res.status(200).json({
      reply:
        "⚠️ Revia backend: Neočekávaná chyba na serveru – " +
        (err?.message || String(err)),
      error: true,
    });
  }
}
