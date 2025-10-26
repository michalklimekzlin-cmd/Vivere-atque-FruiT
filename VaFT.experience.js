// VaFT • Experience (stav světa)

export class VaFTXP {
  constructor() {
    this.t = 0;
    this.mix = { B: 0, G: 0, AI: 0, P: 0 }; // Batolesvět, Glyph, AI, Pedrovci
    this.label = 'start';
  }

  tick(dt = 1 / 60) {
    this.t += dt;
    this.mix.B *= 0.985;
    this.mix.G *= 0.985;
    this.mix.AI *= 0.985;
    this.mix.P *= 0.985;

    const e = this.energy();
    this.label = e > 2.4 ? 'roste' : e > 1.0 ? 'žhne' : 'tiše';
  }

  add({ team, value = 0 }) {
    const key =
      team === 'batolesvet' ? 'B' :
      team === 'glyph'      ? 'G' :
      team === 'ai'         ? 'AI' : 'P';
    this.mix[key] = Math.min(3, this.mix[key] + value);
  }

  energy() {
    return this.mix.B + this.mix.G + this.mix.AI + this.mix.P;
  }

  getState() {
    return { t: this.t, label: this.label, mix: { ...this.mix } };
  }
}

export function createVaFTXP() { return new VaFTXP(); }
export default VaFTXP;