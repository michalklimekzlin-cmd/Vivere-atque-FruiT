// Vivere atque FruiT – společný store světa
(function(global){
  const KEY = 'VAFT_WORLD_V1';

  function loadWorld() {
    let world = localStorage.getItem(KEY);
    if (!world) {
      // první základ světa
      world = {
        version: '0.3',
        teams: {
          human: [
            {
              id: 'michal',
              name: 'Michal',
              x: 40,
              y: 50,
              character: 'klidny tvurce',
              home: { type: 'domek', level: 1 }
            }
          ],
          ai: [
            {
              id: 'orbit',
              name: 'Orbit',
              x: 55,
              y: 40,
              character: 'radce',
              home: { type: 'pult', level: 1 }
            }
          ],
          glyph: [],
          world: [
            {
              id: 'vaft-core',
              name: 'VAFT Core',
              x: 50,
              y: 50,
              character: 'jadro sveta',
              home: { type: 'svetlo', level: 3 }
            }
          ]
        }
      };
      localStorage.setItem(KEY, JSON.stringify(world));
      return world;
    }
    return JSON.parse(world);
  }

  function saveWorld(world) {
    localStorage.setItem(KEY, JSON.stringify(world));
  }

  // z charakteru → typ obydlí
  function generateHomeFromCharacter(characterText = '') {
    const text = characterText.toLowerCase();
    if (text.includes('kuch') || text.includes('cukr') || text.includes('slad')) {
      return { type: 'kuchyn', level: 1 };
    }
    if (text.includes('stráž') || text.includes('ochra')) {
      return { type: 'strasce', level: 1 };
    }
    if (text.includes('glyph') || text.includes('znak')) {
      return { type: 'glyphova cela', level: 1 };
    }
    return { type: 'domek', level: 1 };
  }

  let world = loadWorld();

  const VAFT_STORE = {
    getWorld: () => world,
    save: () => saveWorld(world),
    addCharacterToTeam: (team, charObj) => {
      if (!world.teams[team]) {
        world.teams[team] = [];
      }
      if (!charObj.home) {
        charObj.home = generateHomeFromCharacter(charObj.character || '');
      }
      if (typeof charObj.x !== 'number') charObj.x = 50;
      if (typeof charObj.y !== 'number') charObj.y = 50;
      world.teams[team].push(charObj);
      saveWorld(world);
    },
    extendHome: (team, id, featureText) => {
      const list = world.teams[team] || [];
      const found = list.find(c => c.id === id);
      if (!found) return;
      if (!found.home) found.home = { type: 'domek', level: 1 };
      found.home.extras = found.home.extras || [];
      found.home.extras.push(featureText);
      saveWorld(world);
    },
    generateHomeFromCharacter
  };

  global.VAFT = global.VAFT || {};
  global.VAFT.store = VAFT_STORE;
})(window);
