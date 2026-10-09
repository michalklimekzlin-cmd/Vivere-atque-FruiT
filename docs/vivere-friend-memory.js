from pathlib import Path

code = r'''/* =========================================================
   VIVERE FRIEND MEMORY — CHT 360°‰
   v0.1 — paměťové jádro

   Navazuje na:
     vivere-friend-core.js

   Účel:
   - ukládat vzpomínky Frienda
   - rozlišovat typy vzpomínek
   - vyhledávat podle textu, typu a štítků
   - označovat důležitost
   - uchovat paměť lokálně v telefonu
   - připravit most pro pozdější AI

   Použití:
     <script src="./vivere-friend-core.js"></script>
     <script src="./vivere-friend-memory.js"></script>

   API:
     VivereFriendMemory.remember(...)
     VivereFriendMemory.recall(...)
     VivereFriendMemory.getAll(...)
     VivereFriendMemory.getImportant(...)
     VivereFriendMemory.forget(...)
     VivereFriendMemory.count()
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "cht360_vivere_friend_memory_v1";
  const MAX_MEMORIES = 2000;

  function now() {
    return new Date().toISOString();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function save(memories) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(memories)
    );
    return memories;
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function remember(input = {}) {
    const memories = load();

    const memory = {
      id:
        input.id ||
        `memory-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      createdAt: input.createdAt || now(),

      type: String(input.type || "experience"),

      text: String(
        input.text ||
        input.message ||
        ""
      ),

      importance: Math.max(
        0,
        Math.min(
          100,
          Number.isFinite(Number(input.importance))
            ? Number(input.importance)
            : 50
        )
      ),

      tags: Array.isArray(input.tags)
        ? input.tags.map(String)
        : [],

      source: String(
        input.source || "cht360"
      ),

      data:
        input.data &&
        typeof input.data === "object"
          ? input.data
          : {}
    };

    memories.push(memory);

    // Nejstarší méně důležité vzpomínky můžeme později
    // přesouvat do dlouhodobého úložiště.
    if (memories.length > MAX_MEMORIES) {
      memories.sort(
        (a, b) =>
          Number(b.importance) -
          Number(a.importance)
      );

      memories.length = MAX_MEMORIES;
    }

    save(memories);

    // Pokud existuje Core, přidáme událost.
    if (
      window.VivereFriend &&
      typeof window.VivereFriend.record === "function"
    ) {
      window.VivereFriend.record(
        "MEMORY_CREATED",
        "Vivere Friend si uložil novou vzpomínku.",
        {
          memoryId: memory.id,
          memoryType: memory.type,
          importance: memory.importance
        }
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "cht360:vivere-memory-created",
        { detail: memory }
      )
    );

    return memory;
  }

  function getAll(options = {}) {
    let memories = load();

    if (options.type) {
      memories = memories.filter(
        memory =>
          memory.type === String(options.type)
      );
    }

    if (
      Array.isArray(options.tags) &&
      options.tags.length
    ) {
      const wanted = options.tags.map(normalizeText);

      memories = memories.filter(memory => {
        const tags = memory.tags.map(normalizeText);

        return wanted.every(tag =>
          tags.includes(tag)
        );
      });
    }

    if (options.importantOnly) {
      memories = memories.filter(
        memory =>
          Number(memory.importance) >=
          Number(options.minimumImportance || 70)
      );
    }

    return memories;
  }

  function recall(query = "", options = {}) {
    const text = normalizeText(query);

    if (!text) {
      return getAll(options);
    }

    const words = text
      .split(/\s+/)
      .filter(Boolean);

    return getAll(options)
      .map(memory => {
        const haystack = normalizeText(
          [
            memory.text,
            memory.type,
            ...memory.tags
          ].join(" ")
        );

        let score = 0;

        for (const word of words) {
          if (haystack.includes(word)) {
            score += 1;
          }
        }

        // Důležitější vzpomínky mají lehce vyšší prioritu.
        score +=
          Number(memory.importance || 0) / 1000;

        return {
          memory,
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.memory);
  }

  function getImportant(minimum = 70) {
    return getAll({
      importantOnly: true,
      minimumImportance: minimum
    }).sort(
      (a, b) =>
        Number(b.importance) -
        Number(a.importance)
    );
  }

  function forget(id) {
    const memories = load();
    const before = memories.length;

    const remaining = memories.filter(
      memory => memory.id !== String(id)
    );

    save(remaining);

    return {
      removed: before !== remaining.length,
      id: String(id),
      count: remaining.length
    };
  }

  function count() {
    return load().length;
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(
      new CustomEvent(
        "cht360:vivere-memory-cleared"
      )
    );

    return true;
  }

  window.VivereFriendMemory = Object.freeze({
    version: 1,
    storageKey: STORAGE_KEY,
    remember,
    recall,
    getAll,
    getImportant,
    forget,
    count,
    clear
  });

  window.dispatchEvent(
    new CustomEvent(
      "cht360:vivere-memory-ready",
      {
        detail: {
          count: count()
        }
      }
    )
  );

  console.log(
    "🧠 CHT 360°‰ — Vivere Friend Memory ready",
    "Vzpomínek:",
    count()
  );
})();
'''

path = Path("/mnt/data/vivere-friend-memory.js")
path.write_text(code, encoding="utf-8")
print(f"Hotovo: {path}")
print(f"Velikost: {path.stat().st_size} B")
