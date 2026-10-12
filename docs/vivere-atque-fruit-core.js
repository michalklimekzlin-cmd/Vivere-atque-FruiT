/* =========================================================
   VIVERE ATQUE FRU¡T•ア  +  CHT 360°‰ CORE
   Verze: 1.0.0
   =========================================================
   - Identita Vivere atque Fru¡T•ア
   - Volitelný AI most
   - Bubínky → API klíče (při vytvoření i otočení)
   - Sloty + poznámky (key:... = viditelný klíč)
   - Offline fronta + sync na backend
   ========================================================= */

(() => {
  "use strict";

  if (window.__VIVERE_FRUIT_CORE__) return;
  window.__VIVERE_FRUIT_CORE__ = true;

  const VERSION = "1.0.0";
  const MODEL_NAME = "Vivere atque Fru¡T•ア";
  const ROOT = "cht360_vivere_fruit_core_v1";

  const now = () => new Date().toISOString();
  const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? structuredClone(fallback) : JSON.parse(raw);
    } catch {
      return structuredClone(fallback);
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function safe(v, max = 4000) {
    return String(v ?? "").trim().slice(0, max);
  }

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("cht360:vivere", {
      detail: { type, at: now(), ...detail }
    }));
  }

  // --- Klíče ---
  const KEYS = {
    settings: `${ROOT}_settings`,
    bridge: `${ROOT}_bridge`,
    queue: `${ROOT}_queue`,
    apiKeys: `${ROOT}_api_keys`,
    slots: `${ROOT}_slots`,
    bubinky: `${ROOT}_bubinky`,
    deviceId: `${ROOT}_device_id`,
    lastSync: `${ROOT}_last_sync`,
    identity: `${ROOT}_identity`
  };

  // --- Identita ---
  let identity = read(KEYS.identity, {
    name: MODEL_NAME,
    title: "Lokální model + sync jádro CHT 360°‰",
    principle: "Nejsem klon ChatGPT. Jsem pokračování lokálního oběhu CHT. Když nevím, řeknu to. Nepředstírám vědomí.",
    version: VERSION,
    bornAt: null
  });
  if (!identity.bornAt) {
    identity.bornAt = now();
    write(KEYS.identity, identity);
  }

  // --- Nastavení ---
  let settings = read(KEYS.settings, {
    enabled: true,
    autoSync: true,
    endpoint: "/api/cht360-sync",
    generateKeyOnCreate: true,
    generateKeyOnRotate: true,
    markNotesAsKeys: true,
    maxQueue: 400
  });

  // --- AI most ---
  let bridge = read(KEYS.bridge, {
    enabled: false,
    endpoint: "/api/braska",
    provider: null,
    model: null,
    lastError: null,
    lastCall: null
  });

  // --- Stav ---
  let deviceId = read(KEYS.deviceId, null);
  if (!deviceId) {
    deviceId = uid("device");
    write(KEYS.deviceId, deviceId);
  }

  let queue = read(KEYS.queue, []);
  let apiKeys = read(KEYS.apiKeys, {});
  let slots = read(KEYS.slots, {});
  let bubinky = read(KEYS.bubinky, {});
  let lastSync = read(KEYS.lastSync, null);

  // --- Generování klíče ---
  function generateApiKey(bubinekId, value) {
    const base = `${bubinekId}|${value}|${deviceId}|${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = (hash << 5) - hash + base.charCodeAt(i);
      hash |= 0;
    }
    return `cht_${Math.abs(hash).toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  // --- Fronta ---
  function enqueue(event) {
    const item = {
      id: uid("evt"),
      deviceId,
      createdAt: now(),
      ...event
    };
    queue.push(item);
    if (queue.length > settings.maxQueue) queue = queue.slice(-settings.maxQueue);
    write(KEYS.queue, queue);
    emit("queue:added", item);
    if (settings.autoSync && navigator.onLine) flushQueue();
    return item;
  }

  // --- Bubínky ---
  function onBubinekCreate(bubinekId, value = 0) {
    const id = safe(bubinekId, 120);
    if (!id) return null;

    bubinky[id] = {
      value,
      createdAt: bubinky[id]?.createdAt || now(),
      updatedAt: now()
    };
    write(KEYS.bubinky, bubinky);

    let keyInfo = null;
    if (settings.generateKeyOnCreate) {
      const key = generateApiKey(id, value);
      keyInfo = { key, bubinekId: id, value, createdAt: now(), updatedAt: now(), source: "create" };
      apiKeys[id] = keyInfo;
      write(KEYS.apiKeys, apiKeys);
    }

    return enqueue({
      kind: "bubinek.create",
      bubinekId: id,
      value,
      apiKey: keyInfo?.key || null
    });
  }

  function onBubinekRotate(bubinekId, newValue) {
    const id = safe(bubinekId, 120);
    if (!id) return null;

    bubinky[id] = {
      ...(bubinky[id] || {}),
      value: newValue,
      updatedAt: now()
    };
    write(KEYS.bubinky, bubinky);

    let keyInfo = null;
    if (settings.generateKeyOnRotate) {
      const key = generateApiKey(id, newValue);
      keyInfo = {
        key,
        bubinekId: id,
        value: newValue,
        createdAt: apiKeys[id]?.createdAt || now(),
        updatedAt: now(),
        source: "rotate"
      };
      apiKeys[id] = keyInfo;
      write(KEYS.apiKeys, apiKeys);
    }

    return enqueue({
      kind: "bubinek.rotate",
      bubinekId: id,
      value: newValue,
      apiKey: keyInfo?.key || null
    });
  }

  // --- Sloty ---
  function onSlotNoteAdd(slotId, text) {
    const id = safe(slotId, 120);
    const noteText = safe(text);
    if (!id || !noteText) return null;

    const slot = slots[id] || { id, notes: [], createdAt: now() };
    const note = {
      id: uid("note"),
      text: noteText,
      isKey: settings.markNotesAsKeys && noteText.toLowerCase().startsWith("key:"),
      createdAt: now(),
      updatedAt: now()
    };
    slot.notes = [...(slot.notes || []), note];
    slot.updatedAt = now();
    slots[id] = slot;
    write(KEYS.slots, slots);

    return enqueue({ kind: "slot.note.add", slotId: id, note });
  }

  function onSlotNoteRemove(slotId, noteId) {
    const id = safe(slotId, 120);
    const nId = safe(noteId, 120);
    if (!id || !nId || !slots[id]) return null;

    slots[id].notes = (slots[id].notes || []).filter(n => n.id !== nId);
    slots[id].updatedAt = now();
    write(KEYS.slots, slots);

    return enqueue({ kind: "slot.note.remove", slotId: id, noteId: nId });
  }

  // --- Sync ---
  let flushing = false;

  async function flushQueue() {
    if (flushing || !settings.enabled || !navigator.onLine || !queue.length) {
      return { ok: false, reason: flushing ? "busy" : !navigator.onLine ? "offline" : "empty" };
    }

    flushing = true;
    emit("sync:start", { count: queue.length });
    const batch = [...queue];

    try {
      const res = await fetch(settings.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          version: VERSION,
          model: MODEL_NAME,
          sentAt: now(),
          events: batch,
          snapshot: { identity, slots, bubinky, apiKeys }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      queue = [];
      write(KEYS.queue, queue);
      lastSync = now();
      write(KEYS.lastSync, lastSync);
      emit("sync:success", { count: batch.length });
      flushing = false;
      return { ok: true, count: batch.length };
    } catch (err) {
      emit("sync:error", { error: String(err.message || err) });
      flushing = false;
      return { ok: false, error: String(err.message || err) };
    }
  }

  window.addEventListener("online", () => {
    emit("network:online");
    if (settings.autoSync) flushQueue();
  });

  // --- AI respond ---
  async function respond(message, options = {}) {
    const text = safe(message);
    if (!text) return "Jsem tady.";

    if (bridge.enabled && navigator.onLine) {
      try {
        const res = await fetch(bridge.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            system: `Jsi ${MODEL_NAME} uvnitř CHT 360°‰. Nejsi klon ChatGPT. Buď poctivý.`,
            context: options.context || "",
            identity
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) {
            bridge.lastCall = now();
            write(KEYS.bridge, bridge);
            return safe(data.reply);
          }
        }
      } catch (err) {
        bridge.lastError = String(err.message || err);
        write(KEYS.bridge, bridge);
      }
    }

    const t = text.toLowerCase();
    if (/(kdo jsi|co jsi)/.test(t)) return `Jsem ${MODEL_NAME}. Lokální jádro CHT 360°‰.`;
    if (/(jsi online|jsi připojen)/.test(t)) {
      return bridge.enabled && navigator.onLine ? "Most je aktivní." : "Teď běžím lokálně.";
    }
    return "Slyším tě. Zapsal jsem to do lokálního kontextu.";
  }

  // --- Veřejné API ---
  const api = {
    version: VERSION,
    name: MODEL_NAME,
    deviceId,
    identity: () => ({ ...identity }),
    respond,

    bridge: {
      enable(endpoint) {
        bridge.enabled = true;
        if (endpoint) bridge.endpoint = endpoint;
        write(KEYS.bridge, bridge);
        return { ...bridge };
      },
      disable() {
        bridge.enabled = false;
        write(KEYS.bridge, bridge);
        return { ...bridge };
      },
      status: () => ({ ...bridge })
    },

    onBubinekCreate,
    onBubinekRotate,
    onSlotNoteAdd,
    onSlotNoteRemove,

    flush: flushQueue,
    getQueue: () => [...queue],
    getState() {
      return {
        deviceId,
        online: navigator.onLine,
        lastSync,
        queueLength: queue.length,
        slots: structuredClone(slots),
        bubinky: structuredClone(bubinky),
        apiKeys: structuredClone(apiKeys),
        bridge: { ...bridge },
        settings: { ...settings }
      };
    },

    getSettings: () => ({ ...settings }),
    setSettings(partial = {}) {
      settings = { ...settings, ...partial };
      write(KEYS.settings, settings);
      return { ...settings };
    },

    exportAll() {
      return {
        format: "VIVERE-FRUIT-CORE",
        version: VERSION,
        exportedAt: now(),
        deviceId,
        identity,
        slots,
        bubinky,
        apiKeys,
        queue,
        lastSync
      };
    }
  };

  Object.defineProperty(window, "VivereFruit", {
    value: Object.freeze(api),
    writable: false,
    configurable: false
  });

  // Kompatibilita
  window.Braska360 = window.Braska360 || {};
  window.Braska360.respond = respond;
  window.CHT360Sync = api;

  console.log(`🌱 ${MODEL_NAME} core ready`, { version: VERSION, deviceId, online: navigator.onLine });
})();