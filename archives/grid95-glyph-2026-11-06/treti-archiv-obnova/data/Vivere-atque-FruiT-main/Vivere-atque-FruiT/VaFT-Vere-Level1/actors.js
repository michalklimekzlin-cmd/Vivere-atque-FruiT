let LOG_ELEMENT = null;
let TRUST_ELEMENT = null;

function setLogElement(el) {
  LOG_ELEMENT = el;
}

function setTrustElement(el) {
  TRUST_ELEMENT = el;
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

  const maxLines = 30;
  while (LOG_ELEMENT.children.length > maxLines) {
    LOG_ELEMENT.removeChild(LOG_ELEMENT.lastChild);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class VereFog {
  constructor(options) {
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.speed = options.speed || GAME_CONFIG.vereSpeed;
    this.radius = options.radius || 34;
  }

  update(dt, world, input) {
    let moveX = 0;
    let moveY = 0;

    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;
    }

    // držet v mapě – tohle je jediné "omezení": hranice plátna, ne osobnosti
    this.x = clamp(this.x, GAME_CONFIG.worldMargin, world.canvas.width - GAME_CONFIG.worldMargin);
    this.y = clamp(this.y, GAME_CONFIG.worldMargin, world.canvas.height - GAME_CONFIG.worldMargin);
  }

  draw(ctx) {
    const g = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius * 2
    );
    g.addColorStop(0, "rgba(200, 240, 255, 0.95)");
    g.addColorStop(0.4, "rgba(170, 220, 255, 0.6)");
    g.addColorStop(1, "rgba(120, 180, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

class VaFTHero {
  constructor(options) {
    this.name = options.name || "VaFT";
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.radius = 22;
    this.speed = options.speed || GAME_CONFIG.vaftSpeed;
    this.color = options.color || "#7cf5a3";
    this.accent = options.accent || "#e9fff4";

    this.trust = GAME_CONFIG.relationship.startTrust; // jen indikátor vztahu
    this.mode = "seznámení"; // "seznámení" | "spolu" | "nejistý"
    this.thinkTimer = 0;
    this.lastGuidanceDir = { x: 0, y: 0 }; // směr k Vere, pro "dobrý tip"
  }

  setTrust(v) {
    this.trust = clamp(
      v,
      GAME_CONFIG.relationship.minTrust,
      GAME_CONFIG.relationship.maxTrust
    );
    if (TRUST_ELEMENT) {
      const pct =
        ((this.trust - GAME_CONFIG.relationship.minTrust) /
          (GAME_CONFIG.relationship.maxTrust -
            GAME_CONFIG.relationship.minTrust)) *
        100;
      TRUST_ELEMENT.style.width = `${pct}%`;
    }
  }

  updateBrain(dt, world, vere) {
    this.thinkTimer -= dt;
    if (this.thinkTimer > 0) return;
    this.thinkTimer = 0.7 + Math.random() * 1.2;

    const dx = vere.x - this.x;
    const dy = vere.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    this.lastGuidanceDir = { x: dirX, y: dirY };

    // Reakce podle důvěry a vzdálenosti – ale ne tvrdé omezení, jen chování.
    if (dist > 220 && this.trust < 0.4 && this.mode === "seznámení") {
      logMessage(`${this.name}: Kde jsi? Nevidím tě...`);
      this.mode = "nejistý";
      this.setTrust(this.trust - GAME_CONFIG.relationship.trustLossSmall);
    } else if (dist < 160 && this.mode !== "spolu") {
      logMessage(`${this.name}: Tak jo, cítím tě blíž... Poveď mě.`);
      this.mode = "spolu";
      this.setTrust(this.trust + GAME_CONFIG.relationship.trustGainMedium);
    } else if (this.mode === "spolu" && Math.random() < 0.25) {
      const lines = [
        "Jdu za tebou, Vere.",
        "Vypadá to nebezpečně, ale věřím ti.",
        "Ty jsi moje mapa v tomhle světě.",
      ];
      logMessage(
        `${this.name}: ${
          lines[Math.floor(Math.random() * lines.length)]
        }`
      );
    }

    // VaFT se rozhodne, kam si "dovolí" pohnout
    // – žádný hard limit, jen tendence jít směrem k Vere
    const step = 40;
    this.targetX = this.x + dirX * step;
    this.targetY = this.y + dirY * step;
  }

  applyMovement(dt, world) {
    const targetX =
      this.targetX !== undefined ? this.targetX : this.x;
    const targetY =
      this.targetY !== undefined ? this.targetY : this.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const step = Math.min(this.speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    this.x = clamp(
      this.x,
      GAME_CONFIG.worldMargin,
      world.canvas.width - GAME_CONFIG.worldMargin
    );
    this.y = clamp(
      this.y,
      GAME_CONFIG.worldMargin,
      world.canvas.height - GAME_CONFIG.worldMargin
    );
  }

  update(dt, world, vere) {
    this.updateBrain(dt, world, vere);
    this.applyMovement(dt, world);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // tělo
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // visor / oči
    ctx.fillStyle = this.accent;
    if (!ctx.roundRect) {
      ctx.beginPath();
      ctx.rect(-13, -6, 26, 12);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(-13, -6, 26, 12, 6);
      ctx.fill();
    }

    // spodní oblouk – "srdce"
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }
}

// fallback pro roundRect, pokud chybí
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
