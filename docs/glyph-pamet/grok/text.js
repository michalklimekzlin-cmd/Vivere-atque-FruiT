                                                

export function normalizeSource(value        )                {
  const v = value.trim().toLowerCase();
  if (v === "grok" || v === "g") return "grok";
  if (v === "chatgpt" || v === "gpt" || v === "chat" || v === "openai") return "chatgpt";
  return null;
}

export function isSourceToken(value        )          {
  return /^(grok|g|chatgpt|gpt|chat|openai)$/i.test(value.trim());
}

export function splitTags(value        )           {
  return value
    .split(/[,;]/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    ;
}

export function fallbackTitle(body        )         {
  const line = body
    .split("\n")
    .map((part) => part.trim())
    .find(Boolean);
  return (line ?? "Bez názvu").slice(0, 72);
}

export function hashText(source        , body        )         {
  const s = `${source}\n${body.trim().replace(/\s+/g, " ").toLowerCase()}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = Math.imul(h, 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function byteSize(title        , body        )         {
  return new TextEncoder().encode(`${title}\n${body}`).length;
}

export function formatWhen(ts        )         {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(ts);
}

export function formatBytes(n        )         {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const CHUNK = 120_000;

export function expandDraft(draft       )          {
  const body = draft.body.trim();
  if (!body) return [];
  if (body.length <= CHUNK) return [{ ...draft, body }];
  const parts = Math.ceil(body.length / CHUNK);
  const base = (draft.title.trim() || fallbackTitle(body)).slice(0, 60);
  const out          = [];
  for (let i = 0; i < parts; i++) {
    out.push({
      ...draft,
      title: `${base} · ${i + 1}/${parts}`,
      body: body.slice(i * CHUNK, (i + 1) * CHUNK),
    });
  }
  return out;
}
