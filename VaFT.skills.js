// viri.skills.js – registry dovedností Viriho
export const SkillCaps = { min: 0, max: 5 };

export const Skills = {
  guidingEcho: {
    name: 'Guiding Echo',
    intensity: 1,
    cooldown: 5000,
    apply(ctx) {
      // ctx: { map, ui, audio, state }
      ctx.ui.whisper('Tudy to zkus…', { ttl: 2500 });
    }
  },

  lensShift: {
    name: 'Lens Shift',
    intensity: 1,
    cooldown: 8000,
    apply(ctx) {
      ctx.ui.toneOverlay({ hue: 170, sat: 8 * this.intensity, dur: 1400 });
    }
  },

  pathWarp: {
    name: 'Path Warp',
    intensity: 1,
    cooldown: 10000,
    apply(ctx) {
      ctx.map.toggleGate({ nearPlayer: true });
    }
  },

  clarityFlash: {
    name: 'Clarity Flash',
    intensity: 1,
    cooldown: 7000,
    apply(ctx) {
      ctx.ui.flash('🟢 Jasnost', { dur: 600 });
    }
  }
};

export function setIntensity(name, level) {
  const s = Skills[name];
  if (!s) return;
  s.intensity = Math.max(SkillCaps.min, Math.min(SkillCaps.max, level|0));
}
