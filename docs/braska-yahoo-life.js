/*
====================================================================
 BRÁŠKA 360 — YAHOO LIFE BRIDGE
 v0.2

 Yahoo Finance -> VivereFriendYahoo -> Bráška 360

 Tento modul NEPŘISTUPUJE k brokerovi a NEPROVÁDÍ obchodování.
 Používá existující bezpečný Yahoo adapter v projektu.

 Tok:
   Yahoo data
       ↓
   VivereFriendYahoo
       ↓
   Bráška 360
       ↓
   životní tok + paměť + událost

 Přímý browser scraping Yahoo zde záměrně není.
====================================================================
*/

(() => {
  "use strict";

  const VERSION = "0.2.0";
  const SOURCE = "yahoo-life-bridge";
  const LAST_KEY = "cht360_braska_yahoo_last_v1";

  let lastSignature = null;
  let timer = null;

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function safeText(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
  }

  function getYahoo() {
    return window.VivereFriendYahoo || null;
  }

  function getBraska() {
    return window.Braska360 || null;
  }

  function makeSignature(record) {
    if (!record) return null;

    return [
      record.id || "",
      record.at || "",
      record.symbol || "",
      String(record.value || "")
    ].join("|");
  }

  function feed(record, reason = "yahoo-adapter") {
    const braska = getBraska();

    if (!braska || !record) {
      return {
        ok: false,
        reason: !braska ? "Bráška360 není připraven." : "Chybí Yahoo záznam."
      };
    }

    const value = safeText(record.value, 300);

    if (!value) {
      return {
        ok: false,
        reason: "Yahoo záznam nemá hodnotu."
      };
    }

    const signature = makeSignature(record);

    if (signature && signature === lastSignature) {
      return {
        ok: true,
        duplicate: true,
        record: clone(record)
      };
    }

    lastSignature = signature;

    const event = braska.receive("yahoo:life-stream", {
      source: SOURCE,
      reason,
      symbol: safeText(record.symbol || "PORTFOLIO", 80),
      value,
      at: record.at || new Date().toISOString()
    });

    /*
      Číselný tok necháváme jako TEXT.
      Bráška tak neztrácí přesnost u velkých čísel.
    */
    braska.remember(
      `Yahoo životní tok: ${record.symbol || "PORTFOLIO"} = ${value}`,
      {
        type: "yahoo-life-stream",
        importance: 45,
        tags: ["yahoo", "life-stream", "braska"],
        source: SOURCE,
        approved: true
      }
    );

    const snapshot = {
      version: VERSION,
      at: new Date().toISOString(),
      source: SOURCE,
      record: clone(record),
      event: clone(event)
    };

    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(snapshot));
    } catch (_) {}

    window.dispatchEvent(
      new CustomEvent("cht360:braska-yahoo-life", {
        detail: clone(snapshot)
      })
    );

    return {
      ok: true,
      duplicate: false,
      snapshot
    };
  }

  function pullLast() {
    const yahoo = getYahoo();

    if (!yahoo || typeof yahoo.getLast !== "function") {
      return {
        ok: false,
        reason: "VivereFriendYahoo ještě není připraven."
      };
    }

    const record = yahoo.getLast();

    if (!record) {
      return {
        ok: false,
        reason: "Yahoo adapter zatím nemá žádný datový bod."
      };
    }

    return feed(record, "yahoo-adapter:last");
  }

  function start(interval = 15000) {
    stop();

    /*
      První načtení ihned, další kontroly po 15 s.
      Kontrola pouze čte poslední lokální Yahoo adapter záznam.
    */
    pullLast();

    timer = window.setInterval(
      pullLast,
      Math.max(5000, Number(interval) || 15000)
    );

    return true;
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function status() {
    let last = null;

    try {
      last = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
    } catch (_) {}

    return {
      version: VERSION,
      running: Boolean(timer),
      yahooReady: Boolean(getYahoo()),
      braskaReady: Boolean(getBraska()),
      last
    };
  }

  /*
    Když Yahoo adapter právě přijme nový datový bod,
    předáme ho Bráškovi okamžitě.
  */
  window.addEventListener("cht360:vivere-yahoo-data", (event) => {
    feed(event?.detail, "yahoo-event");
  });

  window.BraskaYahooLife = Object.freeze({
    version: VERSION,
    feed,
    pullLast,
    start,
    stop,
    status
  });

  function boot() {
    /*
      Adapter i Bráška jsou v indexu načítány před tímto modulem.
      Přesto necháme malou toleranci pro případ pomalejšího startu.
    */
    window.setTimeout(() => {
      const yahoo = getYahoo();
      const braska = getBraska();

      if (!yahoo || !braska) {
        console.warn(
          "[Bráška Yahoo] Čekám na VivereFriendYahoo / Braska360."
        );
        return;
      }

      pullLast();

      console.info(
        "📈🧬 CHT 360°‰ — Bráška Yahoo Life Bridge ready",
        status()
      );
    }, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
