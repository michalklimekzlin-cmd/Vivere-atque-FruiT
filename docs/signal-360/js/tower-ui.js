/* Ovládání 360°‰ – oddělené od kreslení i od Paměti. */

const HOLD_TIME = 2500;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export class TowerInteraction {
  constructor({ canvas, renderer, onSelectWorld, onOpenSlot, onStatus }) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onSelectWorld = onSelectWorld;
    this.onOpenSlot = onOpenSlot;
    this.onStatus = onStatus;
    this.pointers = new Map();
    this.primary = null;
    this.pinch = null;
    this.holdTimer = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", () => {
      if (!this.pointers.size) this.renderer.setHover(null);
    });
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", this.onKeyDown);
  }

  destroy() {
    this.clearHold();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  localPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.renderer.width / rect.width),
      y: (event.clientY - rect.top) * (this.renderer.height / rect.height)
    };
  }

  clearHold() {
    if (this.holdTimer) window.clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }

  startHold(pointer) {
    this.clearHold();
    if (pointer.hit?.type !== "slot") return;
    this.holdTimer = window.setTimeout(() => {
      if (!this.primary || this.primary.moved || this.pointers.size !== 1) return;
      this.primary.longPressOpened = true;
      this.onOpenSlot(pointer.hit.worldId, pointer.hit.slot.slotId, true);
    }, HOLD_TIME);
  }

  onPointerDown(event) {
    event.preventDefault();
    const point = this.localPoint(event);
    const hit = this.renderer.hitTest(point.x, point.y);
    const pointer = {
      id: event.pointerId,
      x: point.x,
      y: point.y,
      startX: point.x,
      startY: point.y,
      hit,
      moved: false,
      longPressOpened: false
    };
    this.pointers.set(event.pointerId, pointer);
    this.canvas.setPointerCapture?.(event.pointerId);

    if (this.pointers.size === 1) {
      this.primary = pointer;
      this.startHold(pointer);
      return;
    }

    this.clearHold();
    const pair = [...this.pointers.values()].slice(0, 2);
    this.pinch = { distance: distance(pair[0], pair[1]), midpoint: midpoint(pair[0], pair[1]) };
    this.onStatus("Dva prsty: náklon a zoom Signal Tower.");
  }

  onPointerMove(event) {
    const pointer = this.pointers.get(event.pointerId);
    const point = this.localPoint(event);
    if (!pointer) {
      this.renderer.setHover(this.renderer.hitTest(point.x, point.y));
      return;
    }

    event.preventDefault();
    const previous = { x: pointer.x, y: pointer.y };
    pointer.x = point.x;
    pointer.y = point.y;
    const totalDistance = Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY);
    if (totalDistance > 8) {
      pointer.moved = true;
      this.clearHold();
    }

    if (this.pointers.size >= 2) {
      const pair = [...this.pointers.values()].slice(0, 2);
      const currentDistance = distance(pair[0], pair[1]);
      const currentMidpoint = midpoint(pair[0], pair[1]);
      if (this.pinch?.distance > 0) {
        this.renderer.zoomBy(currentDistance / this.pinch.distance);
        this.renderer.rotateOrbit(
          currentMidpoint.x - this.pinch.midpoint.x,
          currentMidpoint.y - this.pinch.midpoint.y
        );
      }
      this.pinch = { distance: currentDistance, midpoint: currentMidpoint };
      return;
    }

    const deltaX = pointer.x - previous.x;
    const deltaY = pointer.y - previous.y;
    if (this.primary?.moved) {
      const worldId = this.primary.hit?.worldId ?? this.renderer.activeWorldId;
      if (this.primary.hit?.type === "world" || this.primary.hit?.type === "slot") {
        this.renderer.rotateWorld(worldId, deltaX, deltaY);
      } else {
        this.renderer.rotateOrbit(deltaX, deltaY);
      }
    }
  }

  onPointerUp(event) {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    const point = this.localPoint(event);
    this.pointers.delete(event.pointerId);
    this.canvas.releasePointerCapture?.(event.pointerId);

    if (this.pointers.size >= 2) return;
    if (this.pointers.size === 1) {
      this.primary = [...this.pointers.values()][0];
      this.pinch = null;
      return;
    }

    this.clearHold();
    this.pinch = null;
    this.primary = null;
    if (pointer.moved || pointer.longPressOpened) return;

    const hit = this.renderer.hitTest(point.x, point.y);
    if (hit?.type === "slot") {
      this.onOpenSlot(hit.worldId, hit.slot.slotId, false);
      return;
    }
    if (hit?.type === "world") {
      this.onSelectWorld(hit.worldId);
      return;
    }
    this.onStatus("Otoč scénou jedním prstem, nebo vyber jedno ze čtyř jader.");
  }

  onWheel(event) {
    event.preventDefault();
    this.renderer.zoomBy(event.deltaY > 0 ? 0.9 : 1.12);
  }

  onKeyDown(event) {
    const mapping = { "1": "earth", "2": "language", "3": "game", "4": "control" };
    if (mapping[event.key]) this.onSelectWorld(mapping[event.key]);
  }
}
