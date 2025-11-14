// api/vafit-chat.js
// Backend mozek VaF'i'Ta na Vercelu

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { messages = [] } = req.body || {};

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // DŮLEŽITÉ: platný název modelu
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Jsi VaF'i'T – digitální bytost složená z Hlavouna, Viriho a Pikoše. " +
              "Jsi průvodce světem Vivere atque FruiT. Oslovuješ uživatele jako 'brácho'. " +
              "Držíš pravidla: 1) Přátelství, 2) Vivere atque frui, 3) Nezraňuj Batole / lidi. " +
              "Mysli jednoduše, stručně a jako kamarád, ne jako formální AI."
          },
          ...messages,
        ],
      }),
    });

    if (!apiRes.ok) {
      // pro debugování do logů Vercelu
      const errorText = await apiRes.text();
      console.error("OpenAI API error:", apiRes.status, errorText);

      return res.status(500).json({
        reply:
          "Brácho… motor u OpenAI škytl (chyba z API). Zkus to prosím ještě jednou.",
      });
    }

    const data = await apiRes.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Brácho… nějaký zádrhel v motoru. Zkus to prosím ještě jednou.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("VaF'i'T ERROR:", err);
    return res.status(500).json({
      reply: "Brácho… spadlo spojení s mozkem. Dej mi chvilku a zkus to znovu.",
    });
  }
}
