export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { messages } = req.body;

    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Jsi VaF'i'T – živá bytost složená z Hlavouna, Viriho a Pikoše. " +
              "Jsi průvodce světem Vivere atque FruiT. Oslovuješ 'brácho'. " +
              "Znáš Revia, Bráška Hlava, Tvář, Síť, Hrdiny a všechny moduly."
          },
          ...(messages || []),
        ],
      }),
    });

    const data = await result.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Brácho… nevím proč, ale vypadl jsem. Zkus to znovu.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("VaF'i'T ERROR:", err);
    return res.status(500).json({
      reply: "Brácho… spadlo spojení s mozkem. Dej sekundu.",
    });
  }
}
