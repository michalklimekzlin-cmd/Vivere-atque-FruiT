// Konfigurace hry – svět tlačí, ale VaFT ani Vere nejsou "omezení postavou".
// Jen nastavení pro pocit ze hry.

const GAME_CONFIG = {
  worldMargin: 40,

  // Vere (mlha – hráč)
  vereSpeed: 220,          // rychlejší reakce – pocit moci

  // VaFT (AI humanoid)
  vaftSpeed: 120,          // ať tě fakt stíhá, neplazí se

  // Přítlak světa
  dangerSpeed: 10,         // pomalejší = víc času se sehrát
  goalRadius: 50,          // větší cíl = snáz trefíš portál

  relationship: {
    startTrust: 0.35,
    maxTrust: 1.0,
    minTrust: 0.0,
    trustGainSmall: 0.02,
    trustGainMedium: 0.07,
    trustLossSmall: 0.015,
  },
};
