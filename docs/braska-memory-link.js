/*
====================================================================
 BRÁŠKA 360 — PAMĚŤOVÁ SPOJNICE
 Verze 0.1

 Propojuje:
   Braska360  <->  VivereFriendMemory

 Bez síťového přenosu.
 Bez mazání původní paměti.
 Bez finančních operací.

 Účel:
 - načíst existující Friend paměť do Brášky
 - nové Friend vzpomínky předat Bráškovi
 - nové uživatelské zprávy Brášky uložit také do Friend paměti
 - zabránit jednoduchému duplicitnímu přenosu
====================================================================
*/

(() => {
  "use strict";

  const BRASKA_SOURCE = "braska-memory-link";
  const seen = new Set();

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  function rememberInBraska(memory) {
    if (!window.Braska360 || !memory || !memory.id) return null;

    const key = `friend:${memory.id}`;
    if (seen.has(key)) return null;
    seen.add(key);

    return window.Braska360.remember(memory.text, {
      type: memory.type || "friend-memory",
      importance: Number(memory.importance ?? 50),
      tags: Array.isArray(memory.tags) ? memory.tags : [],
      source: memory.source || "vivere-friend-memory",
      approved: true
    });
  }

  function rememberInFriend(text, meta = {}) {
    if (
      !window.VivereFriendMemory ||
      typeof window.VivereFriendMemory.remember !== "function"
    ) {
      return null;
    }

    const value = String(text ?? "").trim();
    if (!value) return null;

    return window.VivereFriendMemory.remember({
      type: meta.type || "braska",
      text: value,
      importance: Number(meta.importance ?? 60),
      tags: Array.isArray(meta.tags) ? meta.tags : ["braska"],
      source: BRASKA_SOURCE,
      data: {
        from: "Braska360",
        linkedAt: new Date().toISOString()
      }
    });
  }

  function syncExistingMemory() {
    if (
      !window.Braska360 ||
      !window.VivereFriendMemory ||
      typeof window.VivereFriendMemory.getAll !== "function"
    ) {
      return 0;
    }

    const memories = window.VivereFriendMemory.getAll({
      importantOnly: false
    });

    /*
      Bráška má vlastní limit 240 položek.
      Přeneseme nejnovější/dostupné položky, ale původní Friend
      paměť zůstává nedotčená.
    */
    const selected = memories.slice(-240);

    let count = 0;

    for (const memory of selected) {
      if (rememberInBraska(memory)) count += 1;
    }

    return count;
  }

  function bindFriendMemoryEvents() {
    window.addEventListener("cht360:vivere-memory-created", (event) => {
      const memory = event?.detail;
      if (!memory) return;

      rememberInBraska(memory);
    });
  }

  function bindBraskaEvents() {
    window.addEventListener("cht360:braska-message", (event) => {
      const detail = event?.detail || {};
      if (detail.role !== "user") return;

      rememberInFriend(detail.text, {
        type: "braska-uživatel",
        importance: 70,
        tags: ["braska", "user"]
      });
    });

    window.addEventListener("cht360:braska", (event) => {
      const detail = event?.detail || {};

      if (detail.type === "glyph:received" && detail.detail?.glyph) {
        rememberInFriend(detail.detail.glyph, {
          type: "glyph",
          importance: 45,
          tags: ["glyph", "cht360"]
        });
      }
    });
  }

  function status() {
    return {
      connected: Boolean(
        window.Braska360 && window.VivereFriendMemory
      ),
      braskaMemory: window.Braska360
        ? window.Braska360.status().memory.count
        : 0,
      friendMemory:
        window.VivereFriendMemory &&
        typeof window.VivereFriendMemory.count === "function"
          ? window.VivereFriendMemory.count()
          : 0
    };
  }

  function boot() {
    if (!window.Braska360 || !window.VivereFriendMemory) {
      console.warn(
        "[Bráška] Paměťová spojnice čeká na Braska360 a VivereFriendMemory."
      );
      return;
    }

    bindFriendMemoryEvents();
    bindBraskaEvents();

    const imported = syncExistingMemory();

    window.dispatchEvent(
      new CustomEvent("cht360:braska-memory-linked", {
        detail: {
          imported,
          status: status()
        }
      })
    );

    if (typeof window.Braska360.message === "function") {
      window.Braska360.message(
        `Paměťová spojnice je aktivní. Přeneseno ${imported} dostupných vzpomínek.`,
        { role: "system" }
      );
    }

    console.info("[Bráška] Paměťová spojnice aktivní.", status());
  }

  window.BraskaMemoryLink = Object.freeze({
    version: "0.1.0",
    sync: syncExistingMemory,
    status
  });

  ready(() => {
    window.setTimeout(boot, 0);
  });
})();
