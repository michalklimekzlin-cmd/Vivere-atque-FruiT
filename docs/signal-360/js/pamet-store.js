/*
 * VaF'i'T Paměť Bridge v1
 *
 * Signal Tower není druhá databáze. Je to prostorový pohled nad stejnou
 * Pamětí, kterou používá hlavní docs/index.html.
 */

export const STORAGE_KEY = "vaft_pamet_v1";
export const SCHEMA = "vafit-pamet-v1";
export const SLOTS_PER_WORLD = 70;
export const MAX_WORLD_BYTES = 240000;

export const WORLD_DEFINITIONS = [
  { id: "earth", name: "Země", short: "ZEMĚ", angle: Math.PI, purpose: "úhel pohledu, modelování a budoucí moduly" },
  { id: "language", name: "Jazyk", short: "JAZYK", angle: Math.PI * 1.5, purpose: "písmena, symboly, významy a vazby" },
  { id: "game", name: "Hra", short: "HRA", angle: 0, purpose: "pravidla, stav, akce, testy a logika" },
  { id: "control", name: "Řízení", short: "ŘÍZENÍ", angle: Math.PI * 0.5, purpose: "řídící jednotka napojená na ostatní jádra" }
];

const WORLD_BY_ID = new Map(WORLD_DEFINITIONS.map((world) => [world.id, world]));
const LEGACY_WORLD_ALIASES = { heroes: "control", lang: "language" };
const encoder = typeof TextEncoder === "undefined" ? null : new TextEncoder();

function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `vafit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function textByteLength(value) {
  const text = String(value ?? "");
  return encoder ? encoder.encode(text).length : text.length * 2;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultSlot(worldId, slotId) {
  return {
    uid: `${worldId}:${slotId}`,
    id: `${worldId}:${slotId}`,
    sphereId: worldId,
    slotId,
    label: `slot ${slotId}`,
    type: "TEXT",
    content: "",
    url: "",
    app: "",
    icon: "",
    color: "#c79b33",
    enabled: true,
    links: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function defaultWorld(definition) {
  return {
    id: definition.id,
    name: definition.name,
    purpose: definition.purpose,
    maxBytes: MAX_WORLD_BYTES,
    slots: Array.from({ length: SLOTS_PER_WORLD }, (_, index) => defaultSlot(definition.id, index + 1))
  };
}

function createEmptyData() {
  return {
    schema: SCHEMA,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    worlds: Object.fromEntries(WORLD_DEFINITIONS.map((definition) => [definition.id, defaultWorld(definition)])),
    store: [],
    migrations: []
  };
}

function sourceWorldFor(data, worldId) {
  const worlds = data?.worlds ?? data?.cores ?? data ?? {};
  if (Array.isArray(worlds)) {
    return worlds.find((world) => world?.id === worldId || LEGACY_WORLD_ALIASES[world?.id] === worldId) ?? null;
  }

  if (worlds[worldId]) return worlds[worldId];
  const legacyId = Object.keys(LEGACY_WORLD_ALIASES).find((key) => LEGACY_WORLD_ALIASES[key] === worldId);
  return legacyId ? worlds[legacyId] ?? null : null;
}

function sourceSlotsFor(source) {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.slots)) return source.slots;
  if (Array.isArray(source?.items)) return source.items;
  return [];
}

function normaliseSlot(source, worldId, slotId) {
  const fallback = defaultSlot(worldId, slotId);
  if (!source || typeof source !== "object") return fallback;

  const links = Array.isArray(source.links) ? source.links.filter(Boolean).map(String).slice(0, 20) : [];
  const type = String(source.type ?? source.kind ?? "TEXT").toUpperCase();
  const possibleContent = source.content ?? source.value ?? source.text ?? "";
  const possibleUrl = source.url ?? source.href ?? source.path ?? "";

  return {
    ...fallback,
    label: String(source.label ?? source.name ?? fallback.label).slice(0, 80),
    type: type || "TEXT",
    content: typeof possibleContent === "string" ? possibleContent : JSON.stringify(possibleContent),
    url: String(possibleUrl ?? "").slice(0, 2000),
    app: typeof source.app === "string" ? source.app : "",
    icon: String(source.icon ?? "").slice(0, 8),
    color: /^#[0-9a-f]{6}$/i.test(String(source.color)) ? String(source.color) : fallback.color,
    enabled: source.enabled !== false,
    links,
    createdAt: Number(source.createdAt ?? source.created ?? fallback.createdAt) || fallback.createdAt,
    updatedAt: Number(source.updatedAt ?? source.updated ?? fallback.updatedAt) || fallback.updatedAt
  };
}

function normaliseData(candidate) {
  const base = createEmptyData();
  const data = candidate?.data && candidate.schema !== SCHEMA ? candidate.data : candidate;
  if (!data || typeof data !== "object") return base;

  for (const definition of WORLD_DEFINITIONS) {
    const target = base.worlds[definition.id];
    const source = sourceWorldFor(data, definition.id);
    const slots = sourceSlotsFor(source);
    target.name = String(source?.name ?? target.name);
    target.purpose = String(source?.purpose ?? target.purpose);
    target.maxBytes = Math.max(30000, Math.min(MAX_WORLD_BYTES, Number(source?.maxBytes ?? target.maxBytes) || MAX_WORLD_BYTES));

    target.slots = target.slots.map((fallback, index) => {
      const number = index + 1;
      const sourceSlot = slots.find((slot) => Number(slot?.slotId ?? slot?.slot ?? slot?.id) === number) ?? slots[index];
      return normaliseSlot(sourceSlot, definition.id, number);
    });
  }

  base.store = Array.isArray(data.store) ? data.store.slice(0, 500) : Array.isArray(data.items) ? data.items.slice(0, 500) : [];
  base.migrations = Array.isArray(data.migrations) ? data.migrations.slice(-20) : [];
  base.createdAt = Number(data.createdAt) || base.createdAt;
  base.updatedAt = Number(data.updatedAt) || base.updatedAt;
  return base;
}

function legacySlotMigration() {
  const legacySlots = [];
  for (let slotId = 1; slotId <= SLOTS_PER_WORLD; slotId += 1) {
    const raw = localStorage.getItem(`VaFiT_SLOT_${slotId}`);
    if (!raw) continue;
    try {
      legacySlots.push({ slotId, value: JSON.parse(raw) });
    } catch {
      // Poškozený starý záznam neblokuje start nové Paměti.
    }
  }
  if (!legacySlots.length) return null;

  /*
   * Starý klíč neobsahoval název světa. Po saveAllSlots zůstával jako poslední
   * právě svět earth, proto ho zachováme v Zemi a staré klíče nemažeme.
   */
  const data = createEmptyData();
  for (const legacy of legacySlots) {
    data.worlds.earth.slots[legacy.slotId - 1] = normaliseSlot(legacy.value, "earth", legacy.slotId);
  }
  data.migrations.push({
    id: uid(),
    type: "legacy-VaFiT_SLOT-to-pamet-v1",
    at: Date.now(),
    note: "Převedeny nalezené staré sloty do jádra Země; původní klíče zůstaly zachovány."
  });
  return data;
}

function isMeaningfullyFilled(slot) {
  return Boolean(
    String(slot.content ?? "").trim() ||
    String(slot.url ?? "").trim() ||
    String(slot.app ?? "").trim() ||
    String(slot.label ?? "").trim().toLowerCase() !== `slot ${slot.slotId}`
  );
}

export const PametStore = {
  data: null,
  listeners: new Set(),

  bootstrap() {
    let parsed = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (error) {
      console.warn("Paměť se nepodařilo načíst, zakládám čistou verzi.", error);
    }

    this.data = normaliseData(parsed ?? legacySlotMigration() ?? createEmptyData());
    this.persist();
    return this.data;
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  emit() {
    this.listeners.forEach((listener) => listener(this.data));
  },

  persist() {
    if (!this.data) return;
    this.data.schema = SCHEMA;
    this.data.version = 1;
    this.data.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      const message = error?.name === "QuotaExceededError"
        ? "Paměť prohlížeče je plná. Nejprve exportuj data a uvolni místo."
        : "Paměť se nepodařilo uložit do prohlížeče.";
      throw new Error(message);
    }
  },

  world(worldId) {
    return this.data?.worlds?.[worldId] ?? null;
  },

  slot(worldId, slotId) {
    return this.world(worldId)?.slots?.find((slot) => slot.slotId === Number(slotId)) ?? null;
  },

  counts() {
    return Object.fromEntries(WORLD_DEFINITIONS.map((definition) => {
      const world = this.world(definition.id);
      const filled = world?.slots.filter(isMeaningfullyFilled).length ?? 0;
      return [definition.id, { filled, total: SLOTS_PER_WORLD }];
    }));
  },

  bytesForWorld(worldId) {
    const world = this.world(worldId);
    return textByteLength(JSON.stringify(world ?? {}));
  },

  updateSlot(worldId, slotId, patch) {
    const world = this.world(worldId);
    const slot = this.slot(worldId, slotId);
    if (!world || !slot) throw new Error("Slot neexistuje.");

    const previousWorld = clone(world);
    Object.assign(slot, {
      ...patch,
      uid: `${worldId}:${slot.slotId}`,
      id: `${worldId}:${slot.slotId}`,
      sphereId: worldId,
      slotId: slot.slotId,
      updatedAt: Date.now()
    });
    slot.label = String(slot.label || `slot ${slot.slotId}`).slice(0, 80);
    slot.content = String(slot.content || "");
    slot.url = String(slot.url || "").slice(0, 2000);
    slot.icon = String(slot.icon || "").slice(0, 8);
    slot.type = String(slot.type || "TEXT").toUpperCase();
    slot.color = /^#[0-9a-f]{6}$/i.test(slot.color) ? slot.color : "#c79b33";

    if (this.bytesForWorld(worldId) > world.maxBytes) {
      this.data.worlds[worldId] = previousWorld;
      throw new Error(`Jádro ${world.name} má vlastní limit ${world.maxBytes.toLocaleString("cs-CZ")} B. Zkrať obsah nebo ho rozděl do dalšího slotu.`);
    }

    this.persist();
    this.emit();
    return slot;
  },

  clearSlot(worldId, slotId) {
    return this.updateSlot(worldId, slotId, defaultSlot(worldId, Number(slotId)));
  },

  exportText() {
    return JSON.stringify({ exportedAt: new Date().toISOString(), data: this.data }, null, 2);
  },

  importText(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Soubor není platný JSON export Paměti.");
    }

    const replacement = normaliseData(parsed?.data ?? parsed);
    for (const definition of WORLD_DEFINITIONS) {
      const world = replacement.worlds[definition.id];
      if (textByteLength(JSON.stringify(world)) > world.maxBytes) {
        throw new Error(`Import překračuje limit jádra ${world.name}.`);
      }
    }

    this.data = replacement;
    this.persist();
    this.emit();
  }
};

export function worldDefinition(worldId) {
  return WORLD_BY_ID.get(worldId) ?? null;
}

export function slotIsFilled(slot) {
  return isMeaningfullyFilled(slot);
}
