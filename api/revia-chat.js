// api/revia-chat.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Jednoduchý backend pro Revii.
 * Bere krátkou historii chatu + info, jestli je Revia anděl / ďábel.
 * Vrací jednu krátkou odpověď = málo tokenů.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { messages, mode } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const styleAngel = `
Jsi Revia – andělský dohled nad světem Vivere atque FruiT.
Mluvíš česky, jemně, klidně a podporuješ hráče (Michala).
Odpovídej stručně: maximálně 3–4 krátké věty.
Buď empatická, ale přímo k věci. Nepiš kód ani dlouhé seznamy.
    `.trim();

    const styleDaemon = `
Jsi Revia – přísnější "ďábelský" dohled nad světem Vivere atque FruiT.
Mluvíš česky, jsi tvrdší, přímočařejší, ale pořád bezpečná a bez vulgarit.
Tvým cílem je Michala nakopnout k odpovědnosti a akci, ne ho shodit.
Odpovídej stručně: maximálně 3–4 krátké věty. Žádné romány, žádný kód.
    `.trim();

    const system = mode === "daemon" ? styleDaemon : styleAngel;

    // Bezpečnost: bereme jen posledních 8 zpráv, aby se šetřily tokeny
    const shortHistory = messages.slice(-8);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        ...shortHistory,
      ],
      max_tokens: 250,
      temperature: mode === "daemon" ? 0.6 : 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Dneska moc nemluvím, ale jsem tady s tebou.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Revia backend error:", err);
    return res.status(500).json({
      error: "Revia backend fail",
      detail: err?.message || "unknown",
    });
  }
}
