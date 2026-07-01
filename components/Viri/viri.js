// Legacy bridge: Viri -> Vivere atque Fru'i¡'T
(function legacyViriBridge(global) {
  const core = global.VivereAtqueFruiT || global["Fru'i¡'T"];

  if (core) {
    global.Viri = core;
    return;
  }

  const fallback = {
    name: "Vivere atque Fru'i¡'T",
    attached: false,
    attach() {
      this.attached = true;
      if (typeof global.appendHlavounMsg === 'function') {
        global.appendHlavounMsg('ai', "💖 Fru'i¡'T: já budu ta, co to bude vyprávět 🌬️");
      }
    }
  };

  global.Viri = fallback;
  global["Fru'i¡'T"] = fallback;

  document.addEventListener('DOMContentLoaded', () => fallback.attach());
})(window);
