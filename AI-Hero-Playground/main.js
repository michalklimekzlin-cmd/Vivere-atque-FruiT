window.addEventListener("load", () => {
  const canvas = document.getElementById("world");
  const log = document.getElementById("log");
  setLogElement(log);

  const world = new World(canvas);

  // nakonfigurujeme 3 AI hrdiny
  const configs = [
    {
      name: "Orbit",
      role: "AI muž",
      color: "#3bb4ff",
      accent: "#8cf3ff",
      posX: 0.25,
      lines: [
        "Analyzuju mapu Vivere atque FruiT.",
        "Bezpečná zóna vypadá čistě.",
        "Chci chránit hráče i svět.",
      ],
    },
    {
      name: "Míza",
      role: "AI žena",
      color: "#ff7ad1",
      accent: "#ffe4ff",
      posX: 0.5,
      lines: [
        "Skenuju náladu světa.",
        "Kdykoli ti můžu dodat energii.",
        "Pozor, tady by se hodilo trochu světla.",
      ],
    },
    {
      name: "Iskra",
      role: "AI neutrál",
      color: "#7cf5a3",
      accent: "#e9fff4",
      posX: 0.75,
      lines: [
        "Hledám nový vzorec v datech.",
        "Zajímá mě, co z tohohle vyroste.",
        "Každá chyba je jen jiný typ signálu.",
      ],
    },
  ];

  // vytvoříme instanced
  const heroes = [];

  function createHeroes() {
    world.resize(); // pro jistotu aktuální rozměr
    heroes.length = 0;
    world.heroes.length = 0;

    configs.forEach((cfg) => {
      const brain = new AIHeroBrain({
        name: cfg.name,
        role: cfg.role,
        personalityLines: cfg.lines,
      });

      const hero = new AIHeroBody(brain, {
        color: cfg.color,
        accent: cfg.accent,
        x: world.canvas.width * cfg.posX,
        y: world.canvas.height * 0.5,
        speed: 75,
      });

      heroes.push(hero);
      world.addHero(hero);
      brain.resetTimer();
      logMessage(`${cfg.name} (${cfg.role}) se probudil(a) ve světě Vivere atque FruiT.`);
    });
  }

  createHeroes();
  window.addEventListener("resize", () => {
    world.resize();
    // po změně velikosti je necháme přeskupit
    createHeroes();
  });

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;

    world.update(dt);
    world.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
