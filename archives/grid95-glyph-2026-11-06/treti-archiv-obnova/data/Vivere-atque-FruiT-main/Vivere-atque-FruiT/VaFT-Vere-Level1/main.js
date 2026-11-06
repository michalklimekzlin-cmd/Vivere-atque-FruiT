window.addEventListener("load", () => {
  const canvas = document.getElementById("world");
  const log = document.getElementById("log");
  const trustFill = document.getElementById("trust-fill");

  setLogElement(log);
  setTrustElement(trustFill);

  const world = new World(canvas);

  // -----------------------------
  // INPUT: Vere (hráč) – šipky + dotyk
  // -----------------------------
  const INPUT = { up: false, down: false, left: false, right: false };

  let touchTarget = null; // {x, y} kam má mlha směřovat
  let useTouchControl = false;

  // Klávesnice (funguje dál třeba na PC)
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

  // Dotyk / myš – hlavní ovládání na iPad Air
  function pointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX || (evt.touches && evt.touches[0].clientX)) - rect.left;
    const y = (evt.clientY || (evt.touches && evt.touches[0].clientY)) - rect.top;
    return { x, y };
  }

  function startPointerControl(evt) {
    useTouchControl = true;
    touchTarget = pointerPos(evt);
  }

  function movePointerControl(evt) {
    if (!useTouchControl) return;
    touchTarget = pointerPos(evt);
  }

  function stopPointerControl() {
    touchTarget = null;
  }

  canvas.addEventListener("mousedown", startPointerControl);
  canvas.addEventListener("mousemove", movePointerControl);
  window.addEventListener("mouseup", stopPointerControl);

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startPointerControl(e);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    movePointerControl(e);
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopPointerControl();
  }, { passive: false });

  // -----------------------------
  // ENTITY: Vere & VaFT
  // -----------------------------
  const vere = new VereFog({
    x: world.canvas.width * 0.5,
    y: world.canvas.height * 0.65,
    speed: GAME_CONFIG.vereSpeed,
  });

  const vaft = new VaFTHero({
    name: "VaFT",
    x: world.canvas.width * 0.5,
    y: world.canvas.height * 0.82,
    speed: GAME_CONFIG.vaftSpeed,
    color: "#7cf5a3",
    accent: "#e9fff4",
  });

  vaft.setTrust(GAME_CONFIG.relationship.startTrust);

  // Úvod
  logMessage("Systém: Svět se probouzí. Světlo nahoře je cílový portál.");
  logMessage("Systém: Ty jsi Vere – mlha. Dotykem/šipkami se hýbeš a vedeš VaFTa.");
  setTimeout(() => {
    logMessage("VaFT: Ehm... cítím tě. Povedeš mě, Vere?");
  }, 900);

  let gameState = "running"; // "running" | "win" | "fail"
  let last = performance.now();

  function updateVere(dt) {
    // když máš dotykový cíl, mlha k němu pluje
    if (useTouchControl && touchTarget) {
      const dx = touchTarget.x - vere.x;
      const dy = touchTarget.y - vere.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        vere.x += dirX * vere.speed * dt;
        vere.y += dirY * vere.speed * dt;
      }
    } else {
      // fallback – klasické šipky
      vere.update(dt, world, INPUT);
      return;
    }

    // ohraničení mapy
    vere.x = Math.max(
      GAME_CONFIG.worldMargin,
      Math.min(world.canvas.width - GAME_CONFIG.worldMargin, vere.x)
    );
    vere.y = Math.max(
      GAME_CONFIG.worldMargin,
      Math.min(world.canvas.height - GAME_CONFIG.worldMargin, vere.y)
    );
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;

    if (gameState === "running") {
      world.update(dt);
      updateVere(dt);
      vaft.update(dt, world, vere);

      // Výhra – VaFT se dotkne portálu
      const dxG = world.goal.x - vaft.x;
      const dyG = world.goal.y - vaft.y;
      const distG = Math.hypot(dxG, dyG);
      if (distG < world.goal.r) {
        gameState = "win";
        logMessage("VaFT: Dokázali jsme to. Díky, Vere.");
        logMessage("Systém: Level 1 dokončen – sehráli jste se včas.");
      }

      // Prohra – svět dožene VaFTa
      if (vaft.y > world.dangerY) {
        if (gameState !== "fail") {
          gameState = "fail";
          logMessage("Systém: Svět se zavřel dřív, než jste našli cestu.");
          logMessage("VaFT: Možná to zkusíme jinak, Vere.");
        }
      }
    }

    world.draw([vere, vaft]);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
