// api/t212-portfolio.js
// DEMO napojení Trading212 -> VaF'i'T
// Zatím NELEZE na skutečné API, jen vrací tvoje tréninková čísla,
// aby se v motoru ukazovala reálná hodnota portfolia.

const DEMO_PORTFOLIO = {
  practice: true,         // tréninkový účet
  currency: "€",
  total: 323003108.39,    // Hodnota portfolia celkem
  cash: 60313333.22,      // Hotovost
  invested: 262889775.17, // Investice
};

export default async function handler(req, res) {
  // Klíč z prostředí – může, ale nemusí být nastavený
  const apiKey = process.env.T212_API_KEY_VAFIT;

  // Pro jistotu zalogujeme jen to, jestli existuje (NE hodnotu)
  console.log("T212_API_KEY_VAFIT exists?", !!apiKey);

  // ZATÍM vždy vracíme demo data.
  // Později sem doplníme skutečný request na Trading212 API.
  return res.status(200).json({
    ok: true,
    ...DEMO_PORTFOLIO,
    note: apiKey
      ? "DEMO: API klíč je nastavený, ale zatím používám tréninková statistická čísla."
      : "DEMO: API klíč není v prostředí vidět, používám tréninková statická čísla.",
  });
}
