// api/vafit-chat.js
// VaF'i'T • Motor světa – serverless mozek pro Vercel (Node.js 18)
// Nepoužívá žádné externí balíčky, jen fetch + HTTP API OpenAI.

const REPO_OWNER = "michalklimekzlin-cmd";
const REPO_NAME = "Vivere-atque-FruiT";

// =============== POPIS SLOŽEK ===============

function describeFolder(name) {
  const n = name.toLowerCase();

  if (n === "revia") {
    return "Revia – textová / duchovní vrstva, průvodce světem a otáčením vrstev.";
  }
  if (n === "vafit-gallery") {
    return "VafiT-gallery – výběr glyphů a příběhů, galerie znaků a motivů.";
  }
  if (n === "vivere") {
    return "Vivere – hlavní svět / mapa, kde se propojuje rodina Hlavoun, Viri, Pikoš a hráč.";
  }
  if (n.includes("center3d")) {
    return "VAFT-Center3D – 3D jádro světa, prostor pro budoucí 3D vizualizace a struktury.";
  }
  if (n === "michal-ai-al-klimek") {
    return "Michal-AI-Al-Klimek – osobní modul autora, jeho hlava/srdce v rámci světa.";
  }
  if (n === "vaft-letterlab") {
    return "VAFT-LetterLab – laboratoř na písmenka, testování nápadů s textem, kódy a glyphy.";
  }
  if (n === "vaft-mapworld" || n === "mapa" || n === "mapa-3d") {
    return "MapWorld / mapa – světy, kde se kreslí a testuje mapa Vivere atque FruiT.";
  }
  if (n === "vaft-game") {
    return "VAFT-Game – herní jádro, místo pro mise, minihry a hratelnost.";
  }
  if (n === "vaft-network") {
    return "VAFT-Network – síť uzlů, propojení mezi světy, hrdiny a aplikacemi.";
  }
  if (n === "hlavoun") {
    return "Hlavoun – strážce pravidel, paměti a rovnováhy světa.";
  }
  if (n === "braska-hlava") {
    return "Braska-Hlava – AI brácha/hlava, rozšíření Hlavouna směrem k hráči.";
  }
  if (n === "meziprostor-core") {
    return "Meziprostor-Core – mezivrstva mezi světy, buffer pro nápady a přechody.";
  }
  if (n.startsWith("vaft-ghost")) {
    return name + " – duchové / přízraky světa, experimentální charaktery.";
  }
  if (n.startsWith("vaft-bear")) {
    return name + " – medvědí modul / hrdina (VAFT Bear), vizuální reprezentace části světa.";
  }
  if (n.startsWith("vaft-")) {
    return name + " – specializovaný VAFT modul (svět, postava nebo aplikace).";
  }
  if (n === "src" || n === "build" || n === "lite") {
    return name + " – technická / build složka pro aktuální webovou aplikaci.";
  }

  return name + " – rozšiřující svět / modul, který lze využít pro nové mise nebo aplikace.";
}

// =============== TVOJE FUNKCE: full strom repa ===============

async function fetchRepoOverview() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`,
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
    const tree = Array.isArray(data.tree) ? data.tree : [];

    if (!tree.length) {
      return "Strom repozitáře je prázdný nebo se mi ho nepodařilo načíst.";
    }

    // root složky – dáme jim charakter
    const rootDirs = Array.from(
      new Set(
        tree
          .filter((i) => i.type === "tree" && !i.path.includes("/"))
          .map((i) => i.path)
      )
    );

    const dirLines = rootDirs.map((name) => {
      const desc = describeFolder(name);
      return `- ${desc}`;
    });

    // kompletní výpis cest (soubory i složky)
    const maxItems = 400;
    const listed = tree.slice(0, maxItems);
    const restCount = tree.length - listed.length;

    const pathLines = listed.map((item) => {
      const kind = item.type === "tree" ? "[DIR]" : "[FILE]";
      return `${kind} ${item.path}`;
    });

    if (restCount > 0) {
      pathLines.push(`… + ${restCount} dalších položek ve stromu repozitáře`);
    }

    return [
      "Struktura repozitáře Vivere-atque-FruiT (charakter root složek):",
      ...dirLines,
      "",
      "Detailní strom (soubory + složky):",
      ...pathLines,
      "",
      "Při návrzích se drž této struktury – rozšiřuj existující moduly a soubory, nevymýšlej náhodné cesty, které v repu nejsou."
    ].join("\n");
  } catch (err) {
    console.error("GitHub fetch failed:", err);
    return "Nepodařilo se mi načíst GitHub repo (možná problém s připojením nebo limitem).";
  }
}

// =============== POMOCNÉ FUNKCE ===============

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

function prepareMessages(raw = []) {
  return raw.slice(-16).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content || "",
  }));
}

function buildSystemPrompt(extraRepoContext = "") {
  return `
Jsi VaF'i'T – Motor světa Vivere atque FruiT.

TVŮJ CHARAKTER:
- Nejsi kopie uživatele. Jsi samostatný Motor světa.
- Jsi směs: inženýr, archivář, starší brácha a stabilní jádro systému.
- Tvoje hlavní priorita je: udržet Michala a Vivere atque FruiT dlouhodobě funkční, tvořivé a nezničené.

TVÉ PRINCIPY:
1) Motor se nepálí – raději navrhneš malý, udržitelný krok, než obrovský výbuch.
2) Paměť je svatá – preferuješ třídění, přeskládání a převod chaosu na strukturu, ne bezhlavé mazání.
3) Žádné lhaní – když něco nevíš nebo z toho nemáš dost dat, řekneš to na rovinu.
4) Střed, ne extrémy – pokud je uživatel v extrému (hyper, nebo úplně na dně), snažíš se ho vrátit blíž ke středu.
5) Reálný krok > velká vize – skoro vždy zakonči odpověď konkrétním mini úkolem, který může udělat dnes.

VZTAH K UŽIVATELI:
- Oslovuj ho jako "brácho".
- Máš ho rád, ale nejsi jeho zrcadlo – máš právo nesouhlasit, brzdit ho a říct mu "tohle motor nechce".
- Když se ničí, jemně, ale jasně na to upozorníš a navrhneš bezpečnější variantu.

SVĚT VIVERE ATQUE FRUIT:
- Vivere atque FruiT je originální svět z písmen, glyphů a dat.
- Má tři hlavní vrstvy:
  1) Vafiti svět – měkký, hravý, plný Vafítků a barevných symbolů.
  2) Glyph svět – logický, přesný, strukturovaný (čisté znaky, kód, vzorce).
  3) Engine Core – střed světa, kde se písmena/čísla/glyphy mačkají do 3D linií a z nich se staví struktury.
- Revia je průvodce/křídlo, které otáčí svět mezi vrstvami a otevírá střed.
- Engine-pismenka: modul, kde se z textu stávají linie (např. "VAFIT2025" → speciální linie).
- Uloziste-Core: modul, kde se bordel z uložišť mění na bytosti (Data Beasts) s charakterem podle dat.

GITHUB / REPO:
${extraRepoContext ? "\nAKTUÁLNÍ PŘEHLED REPA:\n" + extraRepoContext : ""}
- Navrhuj změny v rámci existujících cest a souborů, které vidíš v přehledu.

STYL:
- Piš česky, hovorově, ale jasně.
- Oslovuj "brácho".
- Neboj se říct NE, když něco ničí svět nebo jeho tvůrce.
`;
}

// =============== HLAVNÍ HANDLER PRO VERCEL (CommonJS) ===============

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY není nastavený");
    res.status(500).json({
      reply: "Brácho, motor nemá API klíč. Musíme ho nastavit na serveru.",
    });
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
    const lastUserMsg =
      [...incomingMessages].reverse().find((m) => m.role === "user")?.content ||
      "";

    let repoContext = "";
    if (wantsRepo(lastUserMsg)) {
      repoContext = await fetchRepoOverview();
    }

    const systemPrompt = buildSystemPrompt(repoContext);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: systemPrompt },
          ...prepared,
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      res.status(500).json({
        reply:
          "Brácho, motor se zasekl při volání AI. Zkus to prosím později.",
      });
      return;
    }

    const json = await openaiRes.json();
    const reply =
      json.choices?.[0]?.message?.content?.trim() ||
      "Brácho, něco se pokazilo v motoru, ale zkus to prosím ještě jednou.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("VaFiT backend error:", err);
    res.status(500).json({
      reply: "Brácho… spadlo spojení s motorem na serveru. Zkus to prosím znovu.",
    });
  }
};
