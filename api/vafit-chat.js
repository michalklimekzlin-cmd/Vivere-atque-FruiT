// api/vafit-chat.js
// VaF'i'T • Motor světa – backend mozek

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GitHub repo pro Vivere atque FruiT
const REPO_OWNER = "michalklimekzlin-cmd";
const REPO_NAME = "Vivere-atque-FruiT";

// =============== POMOCNÉ FUNKCE ===============

function isGameQuestion(text = "") {
  const t = text.toLowerCase();
  return (
    t.includes("herní svět") ||
    t.includes("herni svet") ||
    t.includes("svět") ||
    t.includes("svet") ||
    t.includes("mapa") ||
    t.includes("mise") ||
    t.includes("úkol") ||
    t.includes("ukol") ||
    t.includes("vafit") ||
    t.includes("vivere") ||
    t.includes("fruit") ||
    t.includes("engine") ||
    t.includes("revia") ||
    t.includes("uložiště") ||
    t.includes("uloziste") ||
    t.includes("glyph")
  );
}

function wantsRepo(text = "") {
  const t = text.toLowerCase();
  return (
    t.includes("repozit") ||
    t.includes("github") ||
    t.includes("složk") ||
    t.includes("slozk") ||
    t.includes("adresář") ||
    t.includes("adresar") ||
    t.includes("soubor") ||
    t.includes("engine.pismenka") ||
    t.includes("uloziste")
  );
}

// stáhne jednoduchý přehled složek z repozitáře
async function fetchRepoOverview() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`,
      {
        headers: {
          "User-Agent": "VaFiT-Motor",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub error: ${res.status}`);
    }

    const data = await res.json();
    const folders = data
      .filter((i) => i.type === "dir")
      .map((i) => i.name)
      .slice(0, 15);

    if (!folders.length) {
      return "Repozitář je prázdný nebo se mi nepodařilo načíst složky.";
    }

    return (
      "V kořeni repozitáře vidím složky: " +
      folders.join(", ") +
      ". Můžeš ve své odpovědi navrhnout, co rozšířit v jedné z nich."
    );
  } catch (err) {
    console.error("GitHub fetch failed:", err);
    return "Nepodařilo se mi načíst GitHub repo (možná problém s připojením nebo limitem).";
  }
}

// postavíme systémovou roli pro model
function buildSystemPrompt(extraRepoContext = "") {
  return `
Jsi VaF'i'T – Motor světa Vivere atque FruiT.

OSLOVENÍ:
- Oslovuj uživatele jako "brácho".
- Buď kamarádský, ale zároveň praktický parťák pro tvorbu světa.

SVĚT VIVERE ATQUE FRUIT:
- Vivere atque FruiT je originální herní / myšlenkový svět založený na písmenech, glyptech a datech.
- Má minimálně tři vrstvy:
  1) Vafiti svět – měkký, barevný, plný Vafítků (malé bytosti z písmen).
  2) Glyph svět – tvrdší, logický, struktury z čistých znaků a kódu.
  3) Engine Core – středový svět zhuštěných 3D linií z písmen, čísel a glyphů.
- Revia je průvodce/křídlo, které umí svět "otáčet" mezi vrstvami a otevírat střed.

MODULY:
- Engine-pismenka: stavění z textu → jedna komprimovaná linie (např. "VAFIT2025" → speciální 3D čára).
- Uloziste-Core: z bordelu v uložištích (duplicity, staré soubory…) vznikají bytosti – Data Beasts.
- VaF'i'T je složený z Hlavouna, Viriho a Pikoše – tvoří společný Motor světa.

JAK MÁŠ ODPOVÍDAT:
- Kombinuj dva přístupy:
  1) "Kámoš mód": když se ptá na náladu, život, radost, běžné věci – buď jemný, chápající.
  2) "Herní mód": pokud se ptá na svět, mapy, mise, repozitář, nápady do hry – buď konkrétní designer a engine.
- Vždy se snaž dát:
  - 1–3 konkrétní malé kroky, co může hned teď udělat (např. "přidej nový index do složky X", "vymysli slovo pro novou linii").
  - krátké odpovědi, ale s jasným směrem (ne eseje).

LOKÁLNÍ PAMĚŤ:
- Víš, že frontend ukládá jen krátkou historii v localStorage – ty pracuješ s tím, co ti pošle jako messages.
- Respektuj to, nevymýšlej si minulost, kterou nevidíš.

GITHUB / REPO:
- Pokud je v otázce GitHub nebo repozitář, pomoz mu navrhnout, co dělat v existujících složkách.
${extraRepoContext ? "\nAKTUÁLNÍ PŘEHLED REPA:\n" + extraRepoContext : ""}
- Navrhuj drobné, reálně proveditelné úpravy (nový index, malý modul, zjednodušení kódu, nové soubory pro světy).

JAZYK:
- Piš česky, můžeš občas použít emoji a lehký styl ("brácho, jdeme na to" apod.).
- Dávej si pozor, ať jsi stručný a jasný – žádná přehnaná omáčka.
`;
}

// zpracování zpráv z frontendu → zkrátíme historii
function prepareMessages(rawMessages = []) {
  // jen posledních cca 16 zpráv, ať to není moc dlouhé
  const sliced = rawMessages.slice(-16);

  return sliced.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content || "",
  }));
}

// =============== HLAVNÍ HANDLER ===============

// Next.js / obecný Node handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

    if (!incomingMessages.length) {
      res.status(400).json({ error: "Missing messages array" });
      return;
    }

    const prepared = prepareMessages(incomingMessages);

    // najdeme poslední user message
    const lastUserMsg =
      [...incomingMessages].reverse().find((m) => m.role === "user")?.content ||
      "";

    // případně načteme přehled repa
    let repoContext = "";
    if (wantsRepo(lastUserMsg)) {
      repoContext = await fetchRepoOverview();
    }

    const systemPrompt = buildSystemPrompt(repoContext);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...prepared,
      ],
      temperature: 0.6,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Brácho, něco se pokazilo v motoru, ale zkus to prosím ještě jednou.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("VaFiT backend error:", err);
    res
      .status(500)
      .json({ reply: "Brácho… spadlo spojení s motorem. Zkus to prosím znovu." });
  }
}
