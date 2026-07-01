const ENTITY_PATTERNS = [
  { key: 'angel', regex: /\bangel\b/i },
  { key: 'dark', regex: /\bdark\b/i }
];

const ITEM_PATTERNS = [
  { name: 'Hlavoun', tab: 'components', regex: /hlavoun/i },
  { name: 'Viri', tab: 'components', regex: /viri/i },
  { name: 'Pikos', tab: 'components', regex: /pikos/i },
  { name: 'Bicak', tab: 'components', regex: /bicak/i },
  { name: 'VAFT-Center3D', tab: 'worlds', regex: /vaft[-\s]?center3d/i }
];

export function parseCzechCommand(rawInput) {
  const input = (rawInput || '').trim();
  const lower = input.toLowerCase();
  if (!input) return null;

  const entity = ENTITY_PATTERNS.find((entry) => entry.regex.test(input))?.key || null;
  const item = ITEM_PATTERNS.find((entry) => entry.regex.test(input)) || null;

  const wantsGuard = /hl[ií]dej k[oó]d/i.test(input);
  const wantsAnalysis = /analyzuj strukturu/i.test(lower);
  const wantsShow = /zobraz mi|co v[šs]echno d[ěe]l[aá]|p[řr]eje[ďd] si/i.test(lower) || Boolean(item);

  if (!entity && !item && !wantsGuard && !wantsAnalysis && !wantsShow) return null;

  return {
    entity,
    item,
    action: wantsShow ? 'open_item' : 'chat',
    hint:
      wantsGuard
        ? 'Aktivuji dohled nad kódem a zapisuji citové kontexty odděleně.'
        : wantsAnalysis
          ? 'Přepínám se do analytického režimu a hlídám technické detaily.'
          : item
            ? `Otevírám sekci ${item.tab} a zvýrazňuji položku „${item.name}“.`
            : 'Příkaz přijat v českém režimu.'
  };
}
