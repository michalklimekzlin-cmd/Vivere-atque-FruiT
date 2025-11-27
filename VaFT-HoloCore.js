// === VaFT HoloCore – Kámen 0 ===
// Modul: holografické křivky, puls, dýchání, základní barvy

export const HoloPalette = {
  brown: "#5c3a24",
  lightBrown: "#a0744f",
  gray: "#777777",
  lightGray: "#bfbfbf",
  black: "#000000",
  darkRed: "#6a0909",
  steelBlue: "#243447",   // doplněno
  warmNeon: "#c45a3c"     // doplněno
};

// === Křivka – základ života hologramu ===
export function createCurve({
  points = [],
  color = HoloPalette.gray,
  width = 1.5,
  wave = 0.0,
  opacity = 1.0
}) {
  return {
    type: "curve",
    points,
    color,
    width,
    wave,
    opacity
  };
}

// === Pohybové jádro ===
export const Motion = {
  breathe(t, strength = 0.03) {
    return 1 + Math.sin(t * 1.3) * strength;
  },

  pulse(t, freq = 0.8, power = 0.06) {
    return 1 + Math.sin(t * freq * 6.28) * power;
  },

  waveOffset(i, t, strength = 3) {
    return Math.sin(i * 0.2 + t * 1.5) * strength;
  }
};

// === Hologram objekt ===
export function createHoloObject({
  curves = [],
  particles = 40,
  glow = 0.45,
  noise = 0.03,
  rotation = 0.0
}) {
  return {
    type: "holo",
    curves,
    particles,
    glow,
    noise,
    rotation,
    tick(t) {
      this.breathe = Motion.breathe(t);
      this.pulse = Motion.pulse(t);
    }
  };
}
