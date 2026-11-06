class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.heroes = [];

    this.topOffset = 52; // výška topbaru
    this.bottomOffset = 90; // výška logu

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = Math.max(
      100,
      window.innerHeight - this.topOffset - this.bottomOffset
    );
  }

  addHero(hero) {
    this.heroes.push(hero);
  }

  update(dt) {
    for (const hero of this.heroes) {
      hero.update(dt, this);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // pozadí „mapy“
    const g = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    g.addColorStop(0, "#040716");
    g.addColorStop(1, "#050a1f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // lehká síť – VaFT „grid“
    ctx.strokeStyle = "rgba(120, 180, 255, 0.08)";
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < this.canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.canvas.width, y + 0.5);
      ctx.stroke();
    }

    // AI hrdinové
    for (const hero of this.heroes) {
      hero.draw(ctx);
    }
  }
}
