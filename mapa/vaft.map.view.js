// Vivere atque FruiT – vykreslení písmenkové mapy
(function(global){
  const stateEl = document.getElementById('vaft-state');

  function renderTeam(teamName, elementId, world) {
    const parent = document.getElementById(elementId);
    if (!parent) return;

    // smaž staré
    parent.querySelectorAll('.name-float').forEach(n => n.remove());

    const list = (world.teams && world.teams[teamName]) ? world.teams[teamName] : [];

    list.forEach(ch => {
      const el = document.createElement('div');
      el.className = 'name-float';

      // základní styl přímo tady, ať to jede i bez css souboru
      el.style.position = 'absolute';
      el.style.left = (ch.x ?? 50) + '%';
      el.style.top = (ch.y ?? 50) + '%';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.fontSize = '.65rem';
      el.style.whiteSpace = 'nowrap';
      el.style.background = 'rgba(0,0,0,.35)';
      el.style.padding = '3px 8px 3px 6px';
      el.style.borderLeft = '2px solid rgba(200,255,200,.6)';
      el.style.borderRadius = '4px';
      el.style.animation = 'float 5s ease-in-out infinite alternate';

      const home = ch.home || (global.VAFT && global.VAFT.store
        ? global.VAFT.store.generateHomeFromCharacter(ch.character || '')
        : { type: 'domek', level: 1 });

      el.innerHTML = ch.name + ` <span style="opacity:.6;font-size:.55rem;">[${home.type}]</span>`;
      parent.appendChild(el);
    });
  }

  function renderAll() {
    if (!global.VAFT || !global.VAFT.store) {
      if (stateEl) stateEl.textContent = 'VAFT store není k dispozici';
      return;
    }
    const world = global.VAFT.store.getWorld();
    renderTeam('human', 'team-human', world);
    renderTeam('ai', 'team-ai', world);
    renderTeam('glyph', 'team-glyph', world);
    renderTeam('world', 'team-world', world);
    if (stateEl) stateEl.textContent = 'připojeno k VAFT';
  }

  // vystavíme, ať to můžou překreslovat jiné appky
  global.VAFT = global.VAFT || {};
  global.VAFT.renderMap = renderAll;

  // hned zobraz
  renderAll();
})(window);
