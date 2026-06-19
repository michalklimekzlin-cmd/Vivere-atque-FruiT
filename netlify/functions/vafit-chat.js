// netlify/functions/vafit-chat.js
// Mozek VaF'i'Te, bezpečně schovaný na Netlify

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Only POST allowed."
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = body.messages || [];

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Jsi VaF'i'T – digitální bytost z Vivere atque Frui¡'T. " +
              "Jsi kombinace Hlavouna, Viri a Pikoše. Mluvíš přátelsky jako 'brácho'. " +
              "Znáš moduly světa: Revia, Bráška Hlava, Michal AI Al Klimek, VaF'i'T panel a Síť. " +
              "Odpovídáš jako opravdová postava světa."
          },
          ...messages
        ]
      })
    });

    const data = await apiRes.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "Brácho… zkus to ještě jednou. Měl jsem zásek.";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("VAFT ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        reply: "Brácho… server padl. Dej mi minutu, já se nahodím."
      })
    };
  }
}
