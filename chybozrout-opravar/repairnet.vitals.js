// repairnet.vitals.js — v2.2
(function () {
  const Vitals = {
    running: false,
    onLine: (s) => console.log('[Vitals]', s),
    _frameTimes: [],
    _last: 0,
    _timer: null,
    start() {
      if (this.running) return;
      this.running = true;
      const loop = (t) => {
        if (!this.running) return;
        if (this._last) {
          const dt = t - this._last;
          this._frameTimes.push(dt);
          // dlouhý snímek = potenciální zásek
          if (dt > 85) this.onLine(`⚠️ Frame delay ${Math.round(dt)}ms (možný lag)`);
          if (this._frameTimes.length > 120) this._frameTimes.shift();
        }
        this._last = t;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      // agregace každých 2,5 s
      this._timer = setInterval(() => {
        if (!this._frameTimes.length) return;
        const avg = this._frameTimes.reduce((a,b)=>a+b,0)/this._frameTimes.length;
        const fps = Math.round(1000/avg);
        this.onLine(`📈 FPS ~ ${fps} (avg frame ${Math.round(avg)}ms)`);
        // paměť (když je)
        try {
          if (performance && performance.memory) {
            const mb = performance.memory.usedJSHeapSize / (1024*1024);
            this.onLine(`🧠 Paměť ~ ${mb.toFixed(1)} MB`);
          }
        } catch {}
      }, 2500);
    },
    stop() {
      this.running = false;
      this._last = 0;
      this._frameTimes = [];
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
    }
  };
  window.RepairVitals = Vitals;
})();
