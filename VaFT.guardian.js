// viri.guardian.js — Viri jako živé jádro světa
import { Memory }  from './memory.core.js';
import { Builder } from './world.builder.js';

class ViriGuardian {
  constructor(){
    this.birth = Date.now();
    this.state = { mood:'calm', energy:1.0, pings:0 };
    console.log('🟢 Viri boot', new Date(this.birth).toLocaleString());

    // auto-start world builderu (můžeš vypnout)
    Builder.start();
  }

  ping(msg='ahoj'){
    this.state.pings++;
    const out = `Viri: ${msg} • mood=${this.state.mood} • p=${this.state.pings}`;
    Memory.write('ping', { msg, pings:this.state.pings });
    return out;
  }

  pulse(world={}){
    // drobná údržba energie
    this.state.energy = Math.max(0, Math.min(1, this.state.energy + 0.01));
    if (Math.random() < 0.05) this.reflect(world);
  }

  reflect(world={}){
    const thought = {
      t: Date.now(),
      feel: this.state.mood,
      worldSample: Memory.readLog({limit:5})
    };
    Memory.write('thought', thought);
  }
}

export const Viri = new ViriGuardian();
window.Viri = Viri;
