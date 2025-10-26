// VaFT • Learning modul
console.log("✅ VaFT.learning.js načten (initVaFTLearning OK)");

export function initVaFTLearning(xp) {
  const state = {
    memory: [],
    level: 0,
    growth: 0
  };

  function record() {
    const s = xp.getState();
    state.memory.push(s.mix);
    if (state.memory.length > 120) state.memory.shift();

    const energy = s.mix.B + s.mix.G + s.mix.AI + s.mix.P;
    state.growth = (state.growth * 0.9) + (energy * 0.1);

    if (state.growth > 6 && state.level < 10) {
      state.level++;
      console.log(`🌱 VaFT se učí: level ${state.level}`);
      state.growth = 0;
    }
  }

  function tick() { record(); }

  return { tick, state };
}