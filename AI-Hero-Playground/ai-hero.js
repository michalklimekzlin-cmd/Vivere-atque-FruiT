let LOG_ELEMENT = null;

function setLogElement(el) {
  LOG_ELEMENT = el;
}

function logMessage(text) {
  if (!LOG_ELEMENT) return;
  const line = document.createElement("div");
  const time = new Date().toLocaleTimeString("cs-CZ", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  line.textContent = `${time} • ${text}`;
  LOG_ELEMENT.prepend(line);

  // max 25 zpráv
  const maxLines = 25;
  while (LOG_ELEMENT.children.length > maxLines) {
    LOG_ELEMENT.removeChild(LOG_ELEMENT.lastChild);
  }
}

class AIHeroBrain {
  constructor(config) {
    this.name = config.name;
    this.role = config.role || "AI";
    this.personalityLines = config.personalityLines || [];
    this.minDecisionTime = config.minDecisionTime || 1.5;
    this.maxDecisionTime = config.maxDecisionTime || 4.0;
    this.timeToNextDecision = 0;
  }

  resetTimer() {
    this.timeToNextDecision =
      this.minDecisionTime +
      Math.random() * (this.maxDecisionTime - this.minDecisionTime);
  }

  decide(world, hero, dt) {
    this.timeToNextDecision -= dt;
    if (this.timeToNextDecision > 0) return;

    this.resetTimer();

    const r = Math.random();

    if (r < 0.65) {
      // procházka
      const margin = 32;
      hero.targetX =
        margin +
        Math.random() * (world.canvas.width - margin * 2);
      hero.targetY =
        margin +
        Math.random() * (world.canvas.height - margin * 2);

      logMessage(`${this.name}: přesouvám se jinam…`);
    } else if (r < 0.9) {
      // replika / věta
      const line =
        this.personalityLines[
          Math.floor(Math.random() * this.personalityLines.length)
        ] || "...";
      logMessage(`${this.name}: ${line}`);
    } else {
      // krátké přemýšlení na místě
      hero.targetX = hero.x;
      hero.targetY = hero.y;
      logMessage(`${this.name}: jen chvilku přemýšlím.`);
    }
  }
}

class AIHeroBody {
  constructor(brain, options) {
    this.brain = brain;
    this.color = options.color || "#ffffff";
    this.accent = options.accent || "#00ffff";
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.radius = 22;
    this.speed = options.speed || 70;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(dt, world) {
    // rozhodnutí mozku
    this.brain.decide(world, this, dt);

    // pohyb směrem k targetX / targetY
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const step = Math.min(this.speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    // udržet v oblasti
    this.x = Math.max(this.radius, Math.min(world.canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(world.canvas.height - this.radius, this.y));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // tělo
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // „visor“ oči / AI proužek
    ctx.fillStyle = this.accent;
    ctx.roundRect(-12, -6, 24, 12, 6);
    ctx.fill();

    // spodní „core“
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 5, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }
}

// přidáme roundRect, pokud chybí (někde ve starších prohlížečích)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
