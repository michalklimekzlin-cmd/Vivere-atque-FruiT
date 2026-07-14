import { WORLD_DEFINITIONS, slotIsFilled } from "./pamet-store.js";

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function roundedRect(context, x, y, width, height, radius) {
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function rotatePoint(point, rotX, rotY) {
  const sinY = Math.sin(rotY);
  const cosY = Math.cos(rotY);
  const sinX = Math.sin(rotX);
  const cosX = Math.cos(rotX);
  const x = point.x * cosY - point.z * sinY;
  const z = point.x * sinY + point.z * cosY;
  return {
    x,
    y: point.y * cosX - z * sinX,
    z: point.y * sinX + z * cosX
  };
}

function fibonacciPoints(count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(count - 1, 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
  }
  return points;
}

function rgbWithAlpha(hex, alpha) {
  const clean = String(hex || "#c79b33").replace("#", "");
  const number = Number.parseInt(clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export class TowerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.data = null;
    this.activeWorldId = "game";
    this.selected = null;
    this.hover = null;
    this.hitAreas = [];
    this.frame = 0;
    this.startedAt = performance.now();
    this.orbit = { rotation: 0, tilt: -0.08, zoom: 1, targetZoom: 1, velocity: 0 };
    this.worldPose = new Map(WORLD_DEFINITIONS.map((definition, index) => [definition.id, {
      rotX: index % 2 ? 0.2 : -0.2,
      rotY: index * 0.9,
      targetRotX: index % 2 ? 0.2 : -0.2,
      targetRotY: index * 0.9
    }]));
    this.pointCloud = fibonacciPoints(70);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.loop = this.loop.bind(this);
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setData(data) {
    this.data = data;
  }

  setActiveWorld(worldId) {
    if (!this.data?.worlds?.[worldId]) return;
    this.activeWorldId = worldId;
  }

  setSelected(worldId, slotId) {
    this.selected = worldId && slotId ? { worldId, slotId: Number(slotId) } : null;
  }

  setHover(hit) {
    const next = hit?.type === "slot" ? { worldId: hit.worldId, slotId: hit.slot.slotId } : null;
    const changed = JSON.stringify(next) !== JSON.stringify(this.hover);
    this.hover = next;
    this.canvas.style.cursor = next ? "pointer" : hit?.type === "world" ? "grab" : "default";
    return changed;
  }

  rotateWorld(worldId, deltaX, deltaY) {
    const pose = this.worldPose.get(worldId);
    if (!pose) return;
    pose.targetRotY += deltaX * 0.014;
    pose.targetRotX = clamp(pose.targetRotX + deltaY * 0.014, -1.25, 1.25);
  }

  rotateOrbit(deltaX, deltaY) {
    this.orbit.rotation += deltaX * 0.008;
    this.orbit.velocity = deltaX * 0.002;
    this.orbit.tilt = clamp(this.orbit.tilt + deltaY * 0.0025, -0.34, 0.34);
  }

  zoomBy(factor) {
    this.orbit.targetZoom = clamp(this.orbit.targetZoom * factor, 0.75, 1.7);
  }

  hitTest(x, y) {
    for (let index = this.hitAreas.length - 1; index >= 0; index -= 1) {
      const area = this.hitAreas[index];
      if (area.type === "slot" && Math.hypot(x - area.x, y - area.y) <= area.radius + 6) return area;
    }
    for (let index = this.hitAreas.length - 1; index >= 0; index -= 1) {
      const area = this.hitAreas[index];
      if (area.type === "world" && Math.hypot(x - area.x, y - area.y) <= area.radius) return area;
    }
    return null;
  }

  loop(now) {
    this.frame += 1;
    this.orbit.targetZoom = clamp(this.orbit.targetZoom, 0.75, 1.7);
    this.orbit.zoom += (this.orbit.targetZoom - this.orbit.zoom) * 0.12;
    this.orbit.rotation += this.orbit.velocity;
    this.orbit.velocity *= 0.94;
    for (const pose of this.worldPose.values()) {
      pose.rotX += (pose.targetRotX - pose.rotX) * 0.18;
      pose.rotY += (pose.targetRotY - pose.rotY) * 0.18;
    }
    this.draw(now);
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  draw(now) {
    const { ctx, width, height } = this;
    const centerX = width / 2;
    const centerY = height / 2;
    const minSide = Math.min(width, height);
    const elapsed = (now - this.startedAt) / 1000;

    ctx.clearRect(0, 0, width, height);
    const background = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.75);
    background.addColorStop(0, "#171309");
    background.addColorStop(0.45, "#090806");
    background.addColorStop(1, "#030302");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    this.drawDust(centerX, centerY, minSide, elapsed);
    this.drawTower(centerX, centerY, minSide, elapsed);

    const orbitRadius = minSide * 0.31 * this.orbit.zoom;
    const worlds = WORLD_DEFINITIONS.map((definition) => {
      const angle = definition.angle + this.orbit.rotation;
      const depth = Math.sin(angle);
      const perspective = 0.76 + (depth + 1) * 0.16;
      return {
        definition,
        angle,
        depth,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius * 0.57 + this.orbit.tilt * minSide * 0.18,
        radius: minSide * 0.128 * perspective * this.orbit.zoom
      };
    }).sort((left, right) => left.depth - right.depth);

    this.hitAreas = [];
    worlds.forEach((world) => this.drawWorld(world, elapsed));
    this.drawCenterCaption(centerX, centerY, minSide);
  }

  drawDust(centerX, centerY, minSide, elapsed) {
    const { ctx, width, height } = this;
    ctx.save();
    for (let index = 0; index < 46; index += 1) {
      const seed = index * 91.37;
      const x = (Math.sin(seed) * 0.5 + 0.5) * width;
      const y = (Math.sin(seed * 1.71) * 0.5 + 0.5) * height;
      const pulse = 0.15 + (Math.sin(elapsed * 0.7 + seed) + 1) * 0.1;
      ctx.fillStyle = `rgba(255, 226, 173, ${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.45, minSide * 0.0014), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTower(centerX, centerY, minSide, elapsed) {
    const { ctx } = this;
    const towerHeight = minSide * 0.67;
    const top = centerY - towerHeight / 2;
    const bottom = centerY + towerHeight / 2;
    const maxRadius = minSide * 0.14;
    const coreRadius = minSide * 0.026;
    const rings = 14;
    const wires = 16;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = Math.max(0.55, minSide * 0.0017);
    for (let ring = 0; ring <= rings; ring += 1) {
      const progress = ring / rings;
      const y = top + towerHeight * progress;
      const doubleCone = 1 - Math.abs(progress * 2 - 1);
      const radius = coreRadius + maxRadius * doubleCone;
      const glow = 0.14 + doubleCone * 0.28;
      ctx.strokeStyle = `rgba(255, 206, 111, ${glow})`;
      ctx.beginPath();
      ctx.ellipse(centerX, y, radius, radius * 0.26, 0, 0, TAU);
      ctx.stroke();
    }

    for (let wire = 0; wire < wires; wire += 1) {
      const angle = (wire / wires) * TAU + elapsed * 0.08;
      ctx.strokeStyle = `rgba(240, 198, 106, ${wire % 3 === 0 ? 0.35 : 0.15})`;
      ctx.beginPath();
      for (let ring = 0; ring <= rings; ring += 1) {
        const progress = ring / rings;
        const y = top + towerHeight * progress;
        const doubleCone = 1 - Math.abs(progress * 2 - 1);
        const radius = coreRadius + maxRadius * doubleCone;
        const x = centerX + Math.cos(angle) * radius;
        const wireY = y + Math.sin(angle) * radius * 0.26;
        if (ring === 0) ctx.moveTo(x, wireY);
        else ctx.lineTo(x, wireY);
      }
      ctx.stroke();
    }

    const pulseY = top + ((elapsed * 0.18) % 1) * towerHeight;
    const pulse = ctx.createRadialGradient(centerX, pulseY, 0, centerX, pulseY, maxRadius * 0.7);
    pulse.addColorStop(0, "rgba(255, 236, 183, 0.9)");
    pulse.addColorStop(0.22, "rgba(237, 184, 73, 0.3)");
    pulse.addColorStop(1, "rgba(237, 184, 73, 0)");
    ctx.fillStyle = pulse;
    ctx.beginPath();
    ctx.ellipse(centerX, pulseY, maxRadius * 0.72, maxRadius * 0.23, 0, 0, TAU);
    ctx.fill();

    const core = ctx.createRadialGradient(centerX - coreRadius * 0.25, centerY - coreRadius * 0.25, 0, centerX, centerY, coreRadius * 2.8);
    core.addColorStop(0, "#fff2cc");
    core.addColorStop(0.28, "#edc879");
    core.addColorStop(0.7, "rgba(199, 155, 51, 0.28)");
    core.addColorStop(1, "rgba(199, 155, 51, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius * 2.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawWorld(world, elapsed) {
    const { ctx } = this;
    const { definition, x, y, radius, depth } = world;
    const storedWorld = this.data?.worlds?.[definition.id];
    const slots = storedWorld?.slots ?? [];
    const active = definition.id === this.activeWorldId;
    const pose = this.worldPose.get(definition.id);
    const visibleAlpha = 0.62 + (depth + 1) * 0.17;

    this.hitAreas.push({ type: "world", worldId: definition.id, x, y, radius, world: storedWorld });
    ctx.save();
    ctx.globalAlpha = visibleAlpha;
    const glow = ctx.createRadialGradient(x - radius * 0.32, y - radius * 0.32, radius * 0.05, x, y, radius * 1.25);
    glow.addColorStop(0, active ? "rgba(255, 235, 183, 0.22)" : "rgba(255, 226, 173, 0.12)");
    glow.addColorStop(0.58, "rgba(104, 78, 29, 0.15)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.22, 0, TAU);
    ctx.fill();

    const body = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.42, 0, x, y, radius);
    body.addColorStop(0, "rgba(119, 99, 57, 0.4)");
    body.addColorStop(0.56, "rgba(30, 28, 19, 0.77)");
    body.addColorStop(1, "rgba(6, 6, 5, 0.93)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.lineWidth = active ? 1.55 : 0.85;
    ctx.strokeStyle = active ? "rgba(255, 226, 173, 0.88)" : "rgba(217, 183, 112, 0.45)";
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, TAU);
    ctx.clip();
    this.drawSphereGrid(x, y, radius, pose, elapsed, active);

    const points = slots.map((slot, index) => {
      const rotated = rotatePoint(this.pointCloud[index] ?? this.pointCloud[0], pose.rotX, pose.rotY);
      return {
        type: "slot",
        worldId: definition.id,
        slot,
        x: x + rotated.x * radius * 0.89,
        y: y + rotated.y * radius * 0.89,
        depth: rotated.z,
        radius: clamp(radius * (slotIsFilled(slot) ? 0.058 : 0.043) * (0.74 + (rotated.z + 1) * 0.2), 2.1, 6.8)
      };
    }).sort((left, right) => left.depth - right.depth);

    for (const point of points) this.drawSlotPoint(point, active);
    ctx.restore();
    ctx.restore();

    this.drawWorldLabel(world, slots, active);
  }

  drawSphereGrid(x, y, radius, pose, elapsed, active) {
    const { ctx } = this;
    const alpha = active ? 0.25 : 0.13;
    ctx.strokeStyle = `rgba(255, 226, 173, ${alpha})`;
    ctx.lineWidth = 0.65;
    for (let latitude = -2; latitude <= 2; latitude += 1) {
      const yy = y + (latitude / 3) * radius * 0.76;
      const rx = radius * Math.sqrt(Math.max(0.08, 1 - (latitude / 3) ** 2));
      ctx.beginPath();
      ctx.ellipse(x, yy, rx, radius * 0.16, 0, 0, TAU);
      ctx.stroke();
    }
    for (let longitude = 0; longitude < 6; longitude += 1) {
      const phase = longitude / 6 * Math.PI + pose.rotY * 0.35 + elapsed * 0.01;
      ctx.beginPath();
      ctx.ellipse(x, y, Math.abs(Math.cos(phase)) * radius, radius, 0, 0, TAU);
      ctx.stroke();
    }
  }

  drawSlotPoint(point, active) {
    const { ctx } = this;
    const filled = slotIsFilled(point.slot);
    const selected = this.selected?.worldId === point.worldId && this.selected?.slotId === point.slot.slotId;
    const hovered = this.hover?.worldId === point.worldId && this.hover?.slotId === point.slot.slotId;
    const visibility = 0.3 + (point.depth + 1) * 0.36;
    const color = point.slot.color || "#c79b33";

    this.hitAreas.push(point);
    ctx.save();
    ctx.globalAlpha *= visibility;
    if (selected || hovered) {
      ctx.strokeStyle = selected ? "#fff0c5" : "#f3cb78";
      ctx.lineWidth = selected ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius + 4, 0, TAU);
      ctx.stroke();
    }

    if (filled) {
      ctx.shadowBlur = active ? 11 : 6;
      ctx.shadowColor = rgbWithAlpha(color, 0.9);
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = "rgba(205, 196, 174, 0.18)";
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = filled ? "rgba(255, 245, 214, 0.92)" : "rgba(255, 226, 173, 0.5)";
    ctx.stroke();
    ctx.restore();
  }

  drawWorldLabel(world, slots, active) {
    const { ctx } = this;
    const filled = slots.filter(slotIsFilled).length;
    const labelY = world.y + world.radius + 18;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 9;
    ctx.fillStyle = active ? "#fff0c5" : "rgba(255, 226, 173, 0.78)";
    ctx.font = `${active ? "700" : "600"} 11px system-ui`;
    ctx.fillText(world.definition.short, world.x, labelY);
    ctx.fillStyle = active ? "rgba(255, 226, 173, 0.88)" : "rgba(255, 226, 173, 0.54)";
    ctx.font = "10px system-ui";
    ctx.fillText(`${filled}/70`, world.x, labelY + 14);
    ctx.restore();
  }

  drawCenterCaption(centerX, centerY, minSide) {
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(255, 236, 189, 0.92)";
    ctx.font = `700 ${clamp(minSide * 0.025, 10, 16)}px system-ui`;
    ctx.fillText("360Â°â°", centerX, centerY - 3);
    ctx.fillStyle = "rgba(220, 196, 142, 0.66)";
    ctx.font = `${clamp(minSide * 0.014, 8, 10)}px system-ui`;
    ctx.fillText("SIGNAL TOWER", centerX, centerY + 13);
    ctx.restore();
  }
}
