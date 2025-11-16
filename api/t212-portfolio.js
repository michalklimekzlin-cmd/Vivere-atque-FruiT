// api/t212-portfolio.js
// DEMO napojení Trading212 -> VaF'i'T
// Zatím NELEZE na skutečné API, jen vrací tvoje tréninková čísla,
// + navíc z nich spočítá písmenkové tokeny pro VaF'i'T engine.

const DEMO_PORTFOLIO = {
  practice: true,
  currency: "€",
  total: 323003108.39,  // Hodnota portfolia celkem
  cash: 60313333.22,    // Hotovost
  invested: 262869775.17, // Investice
};

// jednoduchý převod € -> písmenkové tokeny
// (klidně kdykoli změníme kurz, teď 1 € = 10 písmenek)
function toLetterTokens(amount) {
  const LETTERS_PER_EURO = 10;
  const raw = Number(amount || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.floor(raw * LETTERS_PER_EURO);
}

const DEMO_LETTERS = {
  perEuro: 10,
  totalLetters: toLetterTokens(DEMO_PORTFOLIO.total),
  cashLetters: toLetterTokens(DEMO_PORTFOLIO.cash),
  investedLetters: toLetterTokens(DEMO_PORTFOLIO.invested),
};

export default async function handler(req, res) {
  // Klíč z prostředí – může, ale nemusí být nastavený
  const apiKey = process.env.T212_API_KEY_VAFIT;

  console.log("T212_API_KEY_VAFIT exists?", !!apiKey);

  // Vracíme demo data + písmenkové tokeny
  return res.status(200).json({
    ok: true,
    ...DEMO_PORTFOLIO,
    letters: DEMO_LETTERS,
    note: apiKey
      ? "DEMO: API klíč je nastavený, ale zatím používáme tréninková statická čísla."
      : "DEMO: API klíč není v prostředí vidět, používám tréninková statická čísla.",
  });
}
