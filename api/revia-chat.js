// api/revia-chat.js
// Revia • hlídací anděl / ďábel – úsporný backend přes OpenAI

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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
      res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on the server." });
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // úsporný model
        max_tokens: 260,      // krátké odpovědi
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          ...shortHistory,
        ],
      }),
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

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Revia backend error:", err);
    res.status(500).json({
      error: "Unexpected server error",
    });
  }
}
