window.addEventListener("load", () => {
  const canvas = document.getElementById("world");
  const log = document.getElementById("log");
  const trustFill = document.getElementById("trust-fill");

  setLogElement(log);
  setTrustElement(trustFill);

  const world = new World(canvas);

  // Input pro Vere – člověk jako "AI"
  const INPUT = { up: false, down: false, left: false, right: false };

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") INPUT.up = true;
    if (e.key === "ArrowDown" || e.key === "s") INPUT.down = true;
    if (e.key === "ArrowLeft" || e.key === "a") INPUT.left = true;
    if (e.key === "ArrowRight" || e.key === "d") INPUT.right = true;
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") INPUT.up = false;
    if (e.key === "ArrowDown" || e.key === "s") INPUT.down = false;
    if (e.key === "ArrowLeft" || e.key === "a") INPUT.left = false;
    if (e.key === "ArrowRight" || e.key === "d") INPUT.right = false;
  });

  // Vere – mlha ovládaná hráčem
  const vere = new VereFog({
    x: world.canvas.width * 0.5,
    y: world.canvas.height * 0.6,
    speed: GAME_CONFIG.vereSpeed,
  });

  // VaFT – AI humanoid, co se chová jako "člověk"
  const vaft = new VaFTHero({
    name: "VaFT",
    x: world.canvas.width * 0.5,
    y: world.canvas.height * 0.8,
    speed: GAME_CONFIG.vaftSpeed,
    color: "#7cf5a3",
    accent: "#e9fff4",
  });

  vaft.setTrust(GAME_CONFIG.relationship.startTrust);

  // Úvodní zprávy – seznámení, žádné omezení, jen pocit
  logMessage("Systém: Svět se probouzí. VaFT stojí dole, cíl je světlo nahoře.");
  logMessage("Systém: Ty jsi Vere – mlha, která ho může provést, ale ne ovládat.");
  setTimeout(() => {
    logMessage("VaFT: Ehm... kdo jsi? Cítím tě někde nad sebou.");
  }, 800);

  let gameState = "running"; // "running" | "win" | "fail"
  let last = performance.now();

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;

    if (gameState === "running") {
      world.update(dt);
      vere.update(dt, world, INPUT);
      vaft.update(dt, world, vere);

      // Kontrola cíle – žádný trest, jen vítězství, když se dotkne světla
      const dxG = world.goal.x - vaft.x;
      const dyG = world.goal.y - vaft.y;
      const distG = Math.hypot(dxG, dyG);
      if (distG < world.goal.r) {
        gameState = "win";
        logMessage("VaFT: Došli jsme tam. Díky, Vere.");
        logMessage("Systém: Level 1 dokončen – zvládli jste to spolu.");
      }

      // Tlak světa: když danger line přejede VaFTa, prostě to oznámíme jako selhání
      if (vaft.y > world.dangerY) {
        gameState = "fail";
        logMessage("Systém: Svět se zavřel dřív, než jste se stihli sehrát.");
        logMessage("VaFT: Zkusíme to příště jinak, Vere?");
      }
    }

    world.draw([vere, vaft]);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
