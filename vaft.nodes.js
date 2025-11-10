// vaft.nodes.js
window.VAFT = window.VAFT || {};

(function(VAFT){

  class Node {
    constructor(id, layer){
      this.id = id;
      this.layer = layer; // např. 'inner' nebo 'outer'
      this.energy = Math.random() * 100;
      this.memory = {};
      this.heartbeat = 0;

      // základní orgány
      this.mozek = { idea: null, active: false };
      this.pamet = {};
      this.motor = { running: false, cycles: 0 };
      this.srdce = { rate: 0, alive: true };
      this.ventil = { lastSignal: null };
    }

    tick(){
      this.heartbeat++;

      // mozek zpracuje signál
      if (this.mozek.active) this.process();

      // motor pumpuje energii
      this.motor.running = true;
      this.motor.cycles++;

      // srdce udává rytmus
      this.srdce.rate = (Math.sin(this.heartbeat/10)+1)*50;

      // ventil pošle ven signál
      if (this.heartbeat % 5 === 0) this.emit();
    }

    process(){
      // jednoduchý "myšlenkový cyklus"
      this.mozek.idea = "vaft-flow-"+this.id+"-"+this.heartbeat;
      this.pamet[this.heartbeat] = this.mozek.idea;
    }

    emit(){
      const data = {
        from: this.id,
        energy: this.energy,
        idea: this.mozek.idea,
        beat: this.heartbeat
      };
      VAFT.bus.emit('node.signal', data);
      this.ventil.lastSignal = data;
    }
  }

  // vytvoříme síť 12 uzlů kolem každé vrstvy
  const grid = [];
  const LAYERS = ['inner','outer'];
  let idCounter = 0;
  LAYERS.forEach(layer => {
    for (let i=0;i<12;i++){
      const node = new Node('node-'+idCounter++, layer);
      grid.push(node);
    }
  });

  // uložit do systému
  VAFT.nodes = grid;

  // každý 1.5s aktualizace všech uzlů
  setInterval(()=>{
    grid.forEach(n => n.tick());
  },1500);

})(window.VAFT);
