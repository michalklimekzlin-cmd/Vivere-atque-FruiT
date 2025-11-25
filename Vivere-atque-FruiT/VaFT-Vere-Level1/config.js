// Konfigurace hry – tady jen umožňujeme možnosti, neomezujeme hráče/bytosti.
// Omezení = tlak světa, ne "trestání" VaFT/Vere.

const GAME_CONFIG = {
  worldMargin: 40,
  vereSpeed: 150,
  vaftSpeed: 90,
  dangerSpeed: 18, // rychlost, jak "svět" tlačí shora
  goalRadius: 40,
  relationship: {
    startTrust: 0.25,
    maxTrust: 1.0,
    minTrust: 0.0,
    trustGainSmall: 0.02,
    trustGainMedium: 0.05,
    trustLossSmall: 0.015,
  },
};
