class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.topOffset = 56; // topbar viz CSS
    this.hudOffset = 96;
    this.logOffset = 96;

    this.goal = { x: 0, y: 0, r: GAME_CONFIG.goalRadius };
    this.dangerY = 0; // start trochu pod mapou, nastaví se v resize
    this.time = 0;

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    const availableHeight =
      window.innerHeight - this.topOffset - this.hudOffset - this.logOffset;

    this.canvas.height = Math.max(140, availableHeight);

    // Cíl = nahoře uprostřed
    this.goal.x = this.canvas.width * 0.5;
    this.goal.y = GAME_CONFIG.worldMargin + 10;

    // Danger zóna začíná pod spodní hranou a leze nahoru
    this.dangerY = this.canvas.height + 40;
  }

  update(dt) {
    this.time += dt;
    // svět tlačí zespodu nahoru – jen tlak prostředí, žádná přímá penalizace v kódu
    this.dangerY -= GAME_CONFIG.dangerSpeed * dt;
  }

  drawBackground() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#050818");
    g.addColorStop(1, "#03040b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // jemný grid
    ctx.strokeStyle = "rgba(120, 180, 255, 0.08)";
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  }

  drawGoal() {
    const ctx = this.ctx;
    const { x, y, r } = this.goal;

    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    g.addColorStop(0, "rgba(255, 255, 210, 0.95)");
    g.addColorStop(0.5, "rgba(255, 244, 200, 0.6)");
    g.addColorStop(1, "rgba(255, 255, 240, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 210, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawDanger() {
    const ctx = this.ctx;
    const { width } = this.canvas;

    const h = 80;
    const yTop = this.dangerY - h;
    if (yTop > this.canvas.height) return;

    const g = ctx.createLinearGradient(0, yTop, 0, this.dangerY);
    g.addColorStop(0, "rgba(255, 60, 80, 0.0)");
    g.addColorStop(1, "rgba(255, 60, 80, 0.25)");

    ctx.fillStyle = g;
    ctx.fillRect(0, yTop, width, h);

    ctx.strokeStyle = "rgba(255, 120, 140, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.dangerY);
    ctx.lineTo(width, this.dangerY);
    ctx.stroke();
  }

  draw(entities) {
    this.drawBackground();
    this.drawGoal();
    this.drawDanger();

    // entitity (mlha, VaFT atd.)
    for (const entity of entities) {
      entity.draw(this.ctx);
    }
  }
}
