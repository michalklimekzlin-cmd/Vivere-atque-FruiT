// /api/revia-chat.js
// Revia – lehký strážný chat napojený na OpenAI

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const mode = body.mode === "daemon" ? "daemon" : "angel";
    const messages = Array.isArray(body.messages) ? body.messages : [];

    // oříznout historii – max 8 zpráv, aby to bylo levné
    const trimmed = messages.slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content || "").slice(0, 500),
    }));

    const systemBase =
      "Jsi Revia, strážný AI rámec ze světa Vivere atque FruiT. " +
      "Mluvíš česky, v krátkých odpovědích (1–3 věty). " +
      "Pomáháš Michalovi hlídat svět, jeho hlavu a směr, ale nikdy nerozhoduješ za něj. " +
      "Nepiš technické věci o API ani o OpenAI, soustřeď se na emoce, rozhodnutí a další malý krok.";

    const systemModeAngel =
      "MÓD: ANDĚL. Jsi klidná, podpůrná, něžná. Uklidňuješ, zjemňuješ, hledáš bezpečný a dlouhodobě zdravý směr. " +
      "Připomínej odpočinek, malé kroky a to, že svět se má přizpůsobit jemu, ne naopak.";

    const systemModeDaemon =
      "MÓD: ĎÁBEL. Jsi přísnější, přímočařejší, ale pořád laskavá. " +
      "Tlačíš na konkrétní volby a kroky, odsekáváš výmluvy, ale nikdy neurážíš. " +
      "Odpovídej razantněji, jasně, pořád max 1–3 věty.";

    const systemMessages = [
      { role: "system", content: systemBase },
      { role: "system", content: mode === "daemon" ? systemModeDaemon : systemModeAngel },
    ];

    const openaiMessages = [...systemMessages, ...trimmed];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",      // levnější, můžeš změnit
        messages: openaiMessages,
        max_tokens: 180,           // krátké odpovědi
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, txt);
      res.status(500).json({ error: "OpenAI request failed" });
      return;
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Teď se mi nepodařilo stáhnout odpověď z jádra. Zkus to prosím znovu.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Revia handler error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
