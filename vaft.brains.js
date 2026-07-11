// VIRI – společná paměť čtyř jader
const Viri = {
  name: "Viri",

  storageKeys: [
    "cht360_pamet_v1",
    "vaft_pamet_v1"
  ],

  state: {
    lastSavedAt: null
  },

  loadMemory() {
    for (const key of this.storageKeys) {
      try {
        const raw = localStorage.getItem(key);

        if (raw) {
          return JSON.parse(raw);
        }
      } catch (error) {
        console.warn(`[Viri] Paměť ${key} nelze načíst.`, error);
      }
    }

    return null;
  },

  saveMemory(memory) {
    try {
      // Nový hlavní klíč
      localStorage.setItem(
        "cht360_pamet_v1",
        JSON.stringify(memory)
      );

      this.state.lastSavedAt = Date.now();

      // Důležité:
      // neposíláme vaft.signal, takže nevznikne nekonečná smyčka
      BUS.emit("cht.memory.saved", {
        from: "Viri",
        cores: ["earth", "language", "game", "control"],
        savedAt: this.state.lastSavedAt
      });

      return true;
    } catch (error) {
      console.error("[Viri] Paměť nelze uložit.", error);

      BUS.emit("cht.memory.error", {
        from: "Viri",
        error: String(error),
        timestamp: Date.now()
      });

      return false;
    }
  },

  getCore(coreId) {
    const memory = this.loadMemory();

    if (!memory?.cores) return null;

    return memory.cores[coreId] || null;
  },

  getAllCores() {
    const memory = this.loadMemory();

    if (!memory?.cores) {
      return {
        earth: [],
        language: [],
        game: [],
        control: []
      };
    }

    return {
      earth: memory.cores.earth || [],
      language: memory.cores.language || [],
      game: memory.cores.game || [],
      control: memory.cores.control || []
    };
  },

  remember(coreId, slotId, data) {
    const allowedCores = [
      "earth",
      "language",
      "game",
      "control"
    ];

    if (!allowedCores.includes(coreId)) {
      console.warn("[Viri] Neznámé jádro:", coreId);
      return false;
    }

    const memory = this.loadMemory();

    if (!memory?.cores?.[coreId]) {
      console.warn("[Viri] Jádro není dostupné:", coreId);
      return false;
    }

    const index = Number(slotId) - 1;
    const slot = memory.cores[coreId][index];

    if (!slot) {
      console.warn("[Viri] Slot neexistuje:", slotId);
      return false;
    }

    const previousContent = {
      name: slot.name,
      content: slot.content,
      updatedAt: slot.updatedAt
    };

    slot.history = Array.isArray(slot.history)
      ? slot.history
      : [];

    slot.history.unshift({
      ...previousContent,
      savedAt: new Date().toISOString()
    });

    slot.history = slot.history.slice(0, 10);

    slot.name = data.name ?? slot.name;
    slot.content = data.content ?? slot.content;
    slot.type = data.type ?? slot.type ?? "myšlenka";
    slot.tags = Array.isArray(data.tags)
      ? data.tags
      : slot.tags || [];

    slot.source = data.source ?? slot.source ?? "Viri";
    slot.updatedAt = new Date().toISOString();

    memory.updatedAt = new Date().toISOString();

    const saved = this.saveMemory(memory);

    if (saved) {
      BUS.emit("cht.memory.changed", {
        from: "Viri",
        coreId,
        slotId: Number(slotId),
        slot,
        timestamp: Date.now()
      });
    }

    return saved;
  },

  think(signal) {
    // Viri zprávu pouze zaznamená do zvláštní časové osy.
    // Nevysílá znovu vaft.signal.
    try {
      const timelineKey = "cht360_viri_timeline";
      const timeline = JSON.parse(
        localStorage.getItem(timelineKey) || "[]"
      );

      timeline.push({
        timestamp: Date.now(),
        signal
      });

      if (timeline.length > 200) {
        timeline.shift();
      }

      localStorage.setItem(
        timelineKey,
        JSON.stringify(timeline)
      );
    } catch (error) {
      console.error("[Viri] Časovou osu nelze uložit.", error);
    }
  }
};