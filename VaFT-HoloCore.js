// === VaFT HoloCore – Kámen 0 =======================================
// Základ holografického stylu: barvy, křivky, pohyb, holografické objekty.
// Dá se použít na člověka, dům, planetu, symbol nebo částicový efekt.

(function (global) {
  "use strict";

  // === PALETA – barevný základ =====================================
  var HoloPalette = {
    brown: "#5c3a24",      // hnědá základní
    lightBrown: "#a0744f", // světle hnědá
    gray: "#777777",       // šedá
    lightGray: "#bfbfbf",  // světle šedá
    black: "#000000",      // černá
    darkRed: "#6a0909",    // temně červená
    steelBlue: "#243447",  // doplněk pro hologram
    warmNeon: "#c45a3c"    // doplňkový teplý pulz
  };

  // === KŘIVKA – tvar hologramu =====================================
  function createCurve(opts) {
    var o = opts || {};
    return {
      type: "curve",
      points: Array.isArray(o.points) ? o.points.slice() : [],
      color: o.color || HoloPalette.gray,
      width: typeof o.width === "number" ? o.width : 1.5,
      wave: typeof o.wave === "number" ? o.wave : 0.0,
      opacity: typeof o.opacity === "number" ? o.opacity : 1.0
    };
  }

  // === POHYB – dýchání, pulz, vlna =================================
  var Motion = {
    // jemné dýchání – vrací scale (1 ± něco)
    breathe: function (t, strength) {
      var s = typeof strength === "number" ? strength : 0.03;
      return 1 + Math.sin(t * 1.3) * s;
    },

    // rychlejší pulz – pro „výboj“
    pulse: function (t, freq, power) {
      var f = typeof freq === "number" ? freq : 0.8;
      var p = typeof power === "number" ? power : 0.06;
      return 1 + Math.sin(t * f * 6.28318) * p; // 2π
    },

    // vlna podél indexu bodu
    waveOffset: function (i, t, strength) {
      var s = typeof strength === "number" ? strength : 3;
      return Math.sin(i * 0.25 + t * 1.5) * s;
    }
  };

  // === HOLOGRAFICKÝ OBJEKT =========================================
  function createHoloObject(opts) {
    var o = opts || {};
    return {
      type: "holo",
      curves: Array.isArray(o.curves) ? o.curves.slice() : [],
      particles: typeof o.particles === "number" ? o.particles : 40,
      glow: typeof o.glow === "number" ? o.glow : 0.45,
      noise: typeof o.noise === "number" ? o.noise : 0.03,
      rotation: typeof o.rotation === "number" ? o.rotation : 0.0,
      breathe: 1,
      pulse: 1,
      tick: function (t) {
        this.breathe = Motion.breathe(t);
        this.pulse = Motion.pulse(t);
      }
    };
  }

  // === EXPORT DO GLOBÁLU ==========================================
  global.VaFTHoloCore = {
    HoloPalette: HoloPalette,
    createCurve: createCurve,
    Motion: Motion,
    createHoloObject: createHoloObject
  };
})(window);
