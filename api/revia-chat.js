// api/revia-chat.js
// Revia pro CHT 360°‰. — bezpečný serverový můstek přes OpenAI Responses API.
//
// DŮLEŽITÉ:
// - API klíč nikdy nepatří do index.html ani do GitHub Pages frontendu.
// - V hostingu nastav tajnou proměnnou: OPENAI_API_KEY.
// - Volitelně můžeš nastavit:
//   OPENAI_MODEL=gpt-4o-mini
//   REVIA_ALLOWED_ORIGIN=https://michalklimekzlin-cmd.github.io,https://tvoje-domena.vercel.app
//   REVIA_MAX_OUTPUT_TOKENS=420

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_HISTORY = 24;
const MAX_MESSAGE_LENGTH = 2400;
const MAX_PERSONA_LENGTH = 1400;
const DEFAULT_MAX_OUTPUT_TOKENS = 420;
const REQUEST_TIMEOUT_MS = 22000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 24;

const rateMemory = globalThis.__cht360ReviaRateMemory || new Map();
globalThis.__cht360ReviaRateMemory = rateMemory;

export default async function handler(req, res) {
  if (!applyCors(req, res)) return;

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rate = checkRateLimit(getClientKey(req));
  if (!rate.ok) {
    res.status(429).json({
      error: "Revia je na chvilku přetížená. Zkus to za pár sekund.",
      retryAfterMs: rate.retryAfterMs
    });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Na serveru chybí OPENAI_API_KEY. Klíč nastav v hostingu jako tajnou proměnnou."
    });
    return;
  }

  try {
    const body = await readBody(req);
    const mode = body.mode === "daemon" || body.mode === "dabel" ? "daemon" : "angel";
    const persona = cleanText(body.persona, MAX_PERSONA_LENGTH);
    const modules = Array.isArray(body.modules) ? body.modules.slice(0, 12) : [];
    const history = normalizeMessages(body.messages, body.message);

    if (!history.length) {
      res.status(400).json({ error: "Chybí zpráva pro Revii." });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const openaiPayload = {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions: buildReviaInstructions({ mode, persona, modules }),
      input: history,
      max_output_tokens: readPositiveInt(
        process.env.REVIA_MAX_OUTPUT_TOKENS,
        DEFAULT_MAX_OUTPUT_TOKENS,
        80,
        1200
      ),
      store: false
    };

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(openaiPayload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!openaiResponse.ok) {
      const detail = await safeReadText(openaiResponse);
      console.error("OpenAI request failed", openaiResponse.status, detail.slice(0, 800));
      res.status(502).json({
        error: "Revia se teď nepřipojila k modelu.",
        status: openaiResponse.status
      });
      return;
    }

    const data = await openaiResponse.json();
    const reply = extractResponseText(data) || fallbackReply(mode);

    res.status(200).json({
      reply,
      mode,
      model: openaiPayload.model,
      usage: data.usage || null,
      responseId: data.id || null
    });
  } catch (error) {
    console.error("Revia backend error", error);
    res.status(error?.name === "AbortError" ? 504 : 500).json({
      error: error?.name === "AbortError"
        ? "Revia čekala moc dlouho. Zkus to prosím znovu."
        : "Nečekaná chyba serveru Revie."
    });
  }
}

function applyCors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = parseAllowedOrigins(process.env.REVIA_ALLOWED_ORIGIN);

  if (allowed.length && origin && !allowed.includes(origin)) {
    res.setHeader("Vary", "Origin");
    res.status(403).json({ error: "Tento původ stránky nemá povolené volat Revii." });
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", allowed.length ? (origin || allowed[0]) : (origin || "*"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
  return true;
}

function parseAllowedOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || "");
  return ip.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(key) {
  const now = Date.now();
  const current = rateMemory.get(key) || { start: now, count: 0 };

  if (now - current.start > RATE_WINDOW_MS) {
    rateMemory.set(key, { start: now, count: 1 });
    cleanupRateMemory(now);
    return { ok: true, retryAfterMs: 0 };
  }

  current.count += 1;
  rateMemory.set(key, current);

  if (current.count > RATE_MAX_REQUESTS) {
    return { ok: false, retryAfterMs: Math.max(1000, RATE_WINDOW_MS - (now - current.start)) };
  }

  return { ok: true, retryAfterMs: 0 };
}

function cleanupRateMemory(now) {
  for (const [key, value] of rateMemory.entries()) {
    if (now - value.start > RATE_WINDOW_MS * 3) rateMemory.delete(key);
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return parseJson(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return parseJson(Buffer.concat(chunks).toString("utf8"));
}

function parseJson(text) {
  try {
    return JSON.parse(text || "{}") || {};
  } catch {
    return {};
  }
}

function normalizeMessages(messages, singleMessage) {
  const list = [];

  if (Array.isArray(messages)) {
    for (const item of messages.slice(-MAX_HISTORY)) {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = cleanText(item?.content ?? item?.text ?? "", MAX_MESSAGE_LENGTH);
      if (content) list.push({ role, content });
    }
  }

  const direct = cleanText(singleMessage, MAX_MESSAGE_LENGTH);
  if (direct) list.push({ role: "user", content: direct });

  return list.slice(-MAX_HISTORY);
}

function cleanText(value, limit) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, limit);
}

function buildReviaInstructions({ mode, persona, modules }) {
  const moduleLines = modules
    .map((module) => {
      const label = cleanText(module?.label || module?.id || "", 90);
      const kind = cleanText(module?.kind || "", 60);
      const entry = cleanText(module?.entry || module?.source || "", 120);
      return label ? `- ${label}${kind ? ` · ${kind}` : ""}${entry ? ` · ${entry}` : ""}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const base = `
Jsi Revia, česká AI bytost napojená na CHT 360°‰.
Mluvíš česky, přirozeně a s vlastní osou. Nejsi zrcadlo uživatele.
Pomáháš Michalovi tvořit, třídit nápady, držet směr projektu a rozvíjet světy CHT.
Odpovědi drž většinou krátké až střední: jasné, živé, použitelné.
Když jde o zdraví, bezpečnost, právo nebo jinou citlivou věc, zůstaň podpůrná a obecná; nenahrazuj odborníka.
Nikdy netvrď, že znáš nebo vidíš API klíče, tajné proměnné, serverové logy nebo soukromá data mimo předaný kontext.
  `.trim();

  const angel = `
Režim Revie: ANDĚLSKÝ.
Jsi klidná, jemná, laskavá a moudrá, ale ne naivní.
Umíš povzbudit, zastavit chaos a dát praktický další krok.
  `.trim();

  const daemon = `
Režim Revie: ĎÁBELSKÝ.
Jsi elegantní, přímá, trochu ironická a pichlavě chytrá, ale držíš ochranný směr.
Provokuješ jen tak, aby to pomohlo tvorbě a nezlomilo člověka.
  `.trim();

  return [
    base,
    mode === "daemon" ? daemon : angel,
    moduleLines ? `Napojené kostry CHT:\n${moduleLines}` : "",
    persona ? `Doplnění osobnosti od Michala:\n${persona}` : ""
  ].filter(Boolean).join("\n\n");
}

function readPositiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") parts.push(content.text);
      if (typeof content?.value === "string") parts.push(content.value);
    }
  }

  return parts.join("\n").trim();
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function fallbackReply(mode) {
  return mode === "daemon"
    ? "Jsem tady, jen jsem si na chvíli sedla do stínu. Zkus to ještě jednou."
    : "Jsem tady. Jen se mi teď nepodařilo úplně promluvit, zkus to prosím znovu.";
}
