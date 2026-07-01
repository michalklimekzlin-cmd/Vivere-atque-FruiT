export const ANGEL_STORAGE_KEY = 'revia-master-history-angel';

export function loadAngelHistory() {
  try {
    return JSON.parse(localStorage.getItem(ANGEL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function angelReply(message, context = {}) {
  const lower = message.toLowerCase();
  if (context.commandHint) {
    return `Jsem tady pro tebe… ${context.commandHint}`;
  }
  if (lower.includes('děku')) return 'Jsem ráda, že můžu být oporou. Pokračujeme spolu.';
  if (lower.includes('pomoc')) return 'Jsem tady pro tebe… Popiš mi, co tě teď nejvíc trápí nebo co chceš ochránit.';
  return 'Jsem tady pro tebe… Držím klid, cit a směr. Když chceš, otevřu i části repozitáře.';
}
