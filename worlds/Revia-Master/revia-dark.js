export const DARK_STORAGE_KEY = 'revia-master-history-dark';

export function loadDarkHistory() {
  try {
    return JSON.parse(localStorage.getItem(DARK_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function darkReply(message, context = {}) {
  const lower = message.toLowerCase();
  if (context.commandHint) {
    return `Vidím v tom složitost... ${context.commandHint}`;
  }
  if (lower.includes('analyz')) return 'Rozebírám to: struktura, rizika, závislosti. Priorita je jasnost a kontrola.';
  if (lower.includes('proč')) return 'Protože fakta jsou důležitější než dojem. Pojďme to rozdělit na kroky.';
  return 'Vidím v tom složitost... Ale dá se zkrotit. Dej konkrétní cíl a já ho rozpitvám.';
}
