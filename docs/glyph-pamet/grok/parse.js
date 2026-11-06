                                                        
import { worldsIn, worldTag } from "./worlds.js";
import { fallbackTitle, isSourceToken, normalizeSource, splitTags } from "./text.js";

function headerOf(header                    , fallback        )                                                    {
  const raw = (header ?? "").trim();
  if (!raw) return { source: fallback, title: "", tags: [] };
  const parts = raw.split("|").map((part) => part.trim());
  if (parts[0] && isSourceToken(parts[0])) {
    return {
      source: normalizeSource(parts[0]) ?? fallback,
      title: parts[1] ?? "",
      tags: splitTags(parts.slice(2).join("|")),
    };
  }
  return { source: fallback, title: parts[0] ?? "", tags: splitTags(parts.slice(1).join("|")) };
}

function draftFrom(
  source        ,
  title        ,
  tags          ,
  body        ,
  glyph        ,
  origin        ,
)               {
  const clean = body.trim();
  if (!clean) return null;
  return {
    source,
    title: title.trim() || fallbackTitle(clean),
    body: clean,
    tags,
    glyph,
    origin,
  };
}

function stampWorlds(draft       )        {
  const ids = worldsIn(`${draft.title}\n${draft.body}\n${draft.tags.join("\n")}`);
  if (!ids.length) return draft;
  const extra = ids.map((id) => worldTag(id)).filter((tag) => !draft.tags.includes(tag));
  if (!extra.length) return draft;
  return { ...draft, tags: [...extra, ...draft.tags] };
}

function fromFence(raw        , fallback        , origin        )               {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let source = fallback;
  let title = "";
  let tags           = [];
  let index = 0;
  for (; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const matched = /^(source|zdroj|title|název|tags|štítky)\s*:\s*(.*)$/i.exec(line);
    if (!matched) break;
    const key = (matched[1] ?? "").toLowerCase();
    const value = matched[2] ?? "";
    if (key === "source" || key === "zdroj") source = normalizeSource(value) ?? source;
    else if (key === "title" || key === "název") title = value.trim();
    else tags = splitTags(value);
  }
  return draftFrom(source, title, tags, lines.slice(index).join("\n"), "FENCE", origin);
}

                                                         

function overlaps(spans        , start        , end        )          {
  return spans.some((span) => start < span.end && end > span.start);
}

export function extractMemories(text        , fallback        , origin        )          {
  const spans         = [];
  const blocks =
    /(?:⟦|\[\[)\s*GLYPH\s*(?::\s*([^\]⟧\n]*))?\s*(?:⟧|\]\])\s*([\s\S]*?)\s*(?:⟦|\[\[)\s*\/\s*GLYPH\s*(?:⟧|\]\])/gi;
  for (const match of text.matchAll(blocks)) {
    const head = headerOf(match[1], fallback);
    const draft = draftFrom(head.source, head.title, head.tags, match[2] ?? "", "GLYPH", origin);
    if (!draft || match.index === undefined) continue;
    spans.push({ start: match.index, end: match.index + match[0].length, draft });
  }

  const saves = /(?:⟦|\[\[)\s*SAVE\s*:\s*([^\s\]⟧]+)\s*(?:⟧|\]\])\s*([\s\S]*?)\s*(?:⟦|\[\[)\s*\/\s*SAVE\s*(?:⟧|\]\])/gi;
  for (const match of text.matchAll(saves)) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (overlaps(spans, start, end)) continue;
    const source = normalizeSource(match[1] ?? "") ?? fallback;
    const draft = draftFrom(source, "", [], match[2] ?? "", "SAVE", origin);
    if (draft) spans.push({ start, end, draft });
  }

  const fences = /```glyph\s*\n([\s\S]*?)```/gi;
  for (const match of text.matchAll(fences)) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (overlaps(spans, start, end)) continue;
    const draft = fromFence(match[1] ?? "", fallback, origin);
    if (draft) spans.push({ start, end, draft });
  }

  const lines = /^[✺*]\s*(GROK|GPT|CHATGPT)\s+([^:\n]{1,80})\s*:\s*(.+)$/gim;
  for (const match of text.matchAll(lines)) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (overlaps(spans, start, end)) continue;
    const source = normalizeSource(match[1] ?? "") ?? fallback;
    const draft = draftFrom(source, match[2] ?? "", [], match[3] ?? "", "LINE", origin);
    if (draft) spans.push({ start, end, draft });
  }

  spans.sort((a, b) => a.start - b.start);
  const seen = new Set        ();
  const drafts          = [];
  for (const span of spans) {
    const key = `${span.draft.source}\n${span.draft.body}`;
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push(span.draft);
  }
  return drafts.map(stampWorlds);
}
