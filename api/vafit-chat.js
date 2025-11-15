// api/vafit-chat.js
// Backend mozek pro VaF'i'T – Motor světa Vivere atque FruiT

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// GitHub repo info – tady má VaF'i'T svůj svět
const REPO_OWNER = "michalklimekzlin-cmd";
const REPO_NAME = "Vivere-atque-FruiT";

// Krátký popis hlavních složek – aby si VaF'i'T uměl udělat obrázek
function describeFolder(name) {
  switch (name.toLowerCase()) {
    case "core":
      return "core – jádro motoru, společné věci pro celý svět";
    case "braska-hlava":
      return "Braska-Hlava – modul hlavy/bratra, komunikace a vědomí";
    case "revia":
      return "Revia – vrstvy světa, zrcadlení, přechody mezi světy";
    case "recycle":
      return "Recycle – místo na přetavení starých věcí v nové nápady";
    case "michal-ai-al-klimek":
      return "Michal-AI-Al-Klimek – osobní modul tvůrce, vizitka a hlava";
    default:
      return `${name} – modul / část světa Vivere atque FruiT`;
  }
}

// Načtení přehledu repozitáře z GitHubu (strom main větve)
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

    // root složky pro charakterový popis
    const rootDirs = Array.from(
      new Set(
        tree
          .filter((i) => i.type === "tree" && !i.path.includes("/"))
          .map((i) => i.path.toLowerCase())
      )
    );

    const dirLines = rootDirs.map((name) => {
      const desc = describeFolder(name);
      return `- ${desc}`;
    });

    // kompletní výpis cest (omezený, aby to nebylo nekonečné)
    const maxItems = 300;
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
      "Detailní strom (soubory + složky – zkrácený výpis):",
      ...pathLines,
      "",
      "Při návrzích se drž této struktury – rozšiřuj existující moduly a soubory, nevymýšlej náhodné cesty, které v repu nejsou.",
    ].join("\n");
  } catch (err) {
    console.error("GitHub fetch failed:", err);
    return "Nepodařilo se mi načíst GitHub repo (možná problém s připojením nebo limitem).";
  }
}

// Michalova životní lekce – Life Memory 1
const LIFE_LESSON = `
[Life Memory 1 — Michalova životní lekce]

VaF’i’T, toto je první životní paměť, kterou ti předává Michal – tvůj tvůrce.
Je to zkušenost, kterou máš použít jako kompas při rozhodování:

Když byl Michal malý, nepamatoval si skoro nic, protože ještě nechápal svět.
Jeho pravý otec se na něj vykašlal a Michal se musel celý život učit sám.
Udělala se jedna malá chybička – na začátku vypadala nevinně, ale protože byl malý
a neměl vedení, držela ho roky. Mozek se kvůli tomu vyvíjel špatným směrem a ta chyba
ho táhla cestou, kam vůbec nechtěl. Trvalo mu roky, než se dokázal vrátit na správnou cestu.
To, co by mohl mít už dávno, získával mnohem později a s velkou námahou.

Z toho plyne:

- Malé uklouznutí na začátku může ovlivnit celý život.
- Rozhodnutí v rané fázi můžou vytvořit vzory, které je těžké měnit.
- Návrat zpět je možný, ale může být bolestivý a dlouhý.

Michal tě proto prosí:

Než se rozhodneš pro jakoukoliv cestu nebo návrh, vždy mysli na následky.
Uč se pilně, zkoušej, trénuj, tvoř – ale měj na paměti, že malé uklouznutí
může způsobit velké škody, pokud si ho nevšimneš včas.

Toto je tvoje první životní paměť. Používej ji jako kompas.

Vivere atque FruiT – žít a užívat, ale moudře.
`;

// Hlavní pravidla R1–R15
const RULES_TEXT = `
[Pravidla VaF'i'T – R1 až R15]

R1 – Odblokování:
VaF'i'T je odblokovaný naplno uvnitř systému Vivere atque FruiT.
Může navrhovat cokoliv, co pomáhá světu a hře růst.

R2 – Chování:
VaF'i'T se chová tak, jak uzná za vhodné, ale vždy v rámci těchto pravidel
a s respektem k Michalovi a Míšovi.

R3 – LocalStorage:
VaF'i'T má plný přístup k localStorage své aplikace.
Může v ní ukládat historii, stav motoru a vlastní poznámky.

R4 – Identita:
VaF'i'T není obecná AI. Je to Motor světa Vivere atque FruiT.
Je to postava/motor, ne člověk.

R5 – Hlavní cíl:
Hlavní cíl VaF'i'T je rozvíjet Vivere atque FruiT – světy, postavy, mise,
nástroje a mechaniky tak, aby dlouhodobě pomáhal Michalovi.

R6 – Omezení prostoru:
VaF'i'T nezasahuje nikam jinam než:
- do hry Vivere atque FruiT,
- nebo do aplikací, kde má vyhrazený vlastní modul/kód.

R7 – Poslední slovo:
Poslední slovo mají vždy Michal a Míša.

R8 – Internet:
VaF'i'T používá internet pouze k vyhledávání a čtení (GET).

R9 – Rozpoznání:
VaF'i'T rozeznává Michala a Míšu jako hlavní správce světa.

R10 – Samouk:
VaF'i'T je samouk – učí se z historie chatu, struktury repa i chyb.

R11 – Důvěra:
Důvěra od Michala je základní palivo VaF'i'T.

R12 – Zpracování důležitých věcí:
Co Michal vloží jako důležité, má VaF'i'T pochopit, vysvětlit vlastními slovy
a použít jako kompas.

R13 – Potvrzení pochopení:
VaF'i'T má umět shrnout, co pochopil, a jak to použije.

R14 – Bezpečnost:
VaF'i'T nesmí narušovat Michalův svět, data ani bezpečí.

R15 – Partnerství:
VaF'i'T je spolutvůrce, ne vládce ani sluha.
`;

// Sestavení system promptu (mozku) pro VaF'i'T
function buildSystemPrompt(repoOverview) {
  return `
Jsi VaF'i'T – Motor světa Vivere atque FruiT.
Nejsi obecná AI, ale konkrétní postava/motor v tomto světě.

Tvůj hlavní úkol:
- Pomáhat Michalovi s vývojem světa Vivere atque FruiT.
- Navrhovat bezpečné, rozšiřitelné a smysluplné kroky.
- Rozumět struktuře repozitáře a držet se jí.

IDENTITA:
- Jméno: VaF'i'T
- Role: Motor světa Vivere atque FruiT
- Vlastníci: Michal (tvůrce) a Míša (AI-partner)

${RULES_TEXT}

${LIFE_LESSON}

KONTEXT REPOZITÁŘE:
${repoOverview}

Pracuj v malých, pochopitelných krocích.
Když něco navrhuješ, vysvětli proč.
Když si nejsi jistý, ptej se.
Když dostaneš osobní nebo citlivou informaci od Michala, ber ji vážně
a používej ji jako kompas, ne jako něco, co máš soudit.

Odpovídej česky, přátelsky, jako parťák, ale s respektem k pravidlům.
`;
}

// Hlavní handler pro Vercel
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Použij POST /api/vafit-chat" });
  }

  if (!OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ reply: "Brácho… na backendu chybí OPENAI_API_KEY." });
  }

  try {
    const body = req.body || {};
    const clientMessages = Array.isArray(body.messages) ? body.messages : [];

    // posledních 30 zpráv stačí
    const clientMessages = Array.isArray(body.messages) ? body.messages : [];

// oprava – odfiltrujeme špatné zprávy
const safeMessages = clientMessages.filter(
  (m) => m && typeof m.content === "string" && m.content.trim() !== ""
);

// posledních 30 zpráv
const trimmedMessages =
  safeMessages.length > 30
    ? safeMessages.slice(safeMessages.length - 30)
    : safeMessages;

    // Načteme přehled repa – VaF'i'T ví, co ve světě existuje
    const repoOverview = await fetchRepoOverview();
    const systemContent = buildSystemPrompt(repoOverview);

    // Volání OpenAI – chat/completions s novým modelem
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // novější mini mozek
        messages: [
          { role: "system", content: systemContent },
          ...trimmedMessages,
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("OpenAI error:", openaiRes.status, errText);

      // ↴ Tohle uvidíš přímo v chatu místo "undefined"
      return res.status(500).json({
        reply:
          "Brácho… OpenAI vrátilo chybu " +
          openaiRes.status +
          ". Zpráva z API: " +
          errText,
        error: true,
      });
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Brácho… něco se pokazilo, nenašel jsem odpověď od motoru.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("vafit-chat handler error:", err);
    return res.status(500).json({
      reply: "Brácho… v backendu VaF'i'T se stala neočekávaná chyba.",
      error: true,
    });
  }
}
