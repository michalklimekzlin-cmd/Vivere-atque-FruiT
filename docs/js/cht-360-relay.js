/*
 * CHT 360°‰. — unifikovaný BroadcastChannel relay
 *
 * Přemosťuje čtyři historické kanály do jednoho centrálního místa.
 * Všechny zprávy odeslané přes relay jsou doručeny do všech kanálů;
 * příchozí zprávy z libovolného kanálu jsou re-emitovány jako CustomEvent
 * "cht360.relay.message" na window, takže starý kód může pokračovat fungovat.
 *
 * Historické kanály:
 *   "cht360_mesh_v1"       — root index.html (hlavní projekt)
 *   "cht360-batole"        — batole-core.js (hub)
 *   "cht360_puls_channel_v1" — cht-puls-360
 *   "cht360_revia_mesh_v1" — revia-local-mesh.js
 *
 * Kanonický kanál:
 *   "cht360_relay_v1"      — centrální relay; doporučen pro nový kód
 */
(function () {
  "use strict";

  var RELAY_CHANNEL = "cht360_relay_v1";
  var LEGACY_CHANNELS = [
    "cht360_mesh_v1",
    "cht360-batole",
    "cht360_puls_channel_v1",
    "cht360_revia_mesh_v1"
  ];
  var RELAY_EVENT = "cht360.relay.message";

  if (!("BroadcastChannel" in window)) {
    window.CHT360Relay = {
      available: false,
      send: function () { /* BroadcastChannel nepodporován */ }
    };
    return;
  }

  var relay = null;
  var legacyChannels = [];
  var started = false;

  function emitLocal(message, sourceChannel) {
    try {
      window.dispatchEvent(new CustomEvent(RELAY_EVENT, {
        detail: { message: message, channel: sourceChannel }
      }));
    } catch (error) {
      /* CustomEvent selhání nesmí zastavit relay. */
    }
  }

  function forwardToAll(message, skipChannel) {
    /* Pošli do kanonického relay kanálu */
    if (relay && skipChannel !== RELAY_CHANNEL) {
      try { relay.postMessage(message); } catch (error) { /* zastaralý kontext */ }
    }

    /* Pošli do všech legacy kanálů */
    legacyChannels.forEach(function (ch) {
      if (ch.name !== skipChannel) {
        try { ch.channel.postMessage(message); } catch (error) { /* zastaralý kontext */ }
      }
    });
  }

  function start() {
    if (started) return;
    started = true;

    /* Otevři kanonický relay kanál */
    try {
      relay = new BroadcastChannel(RELAY_CHANNEL);
      relay.addEventListener("message", function (event) {
        emitLocal(event.data, RELAY_CHANNEL);
        forwardToAll(event.data, RELAY_CHANNEL);
      });
    } catch (error) {
      relay = null;
    }

    /* Otevři mosty do legacy kanálů */
    LEGACY_CHANNELS.forEach(function (name) {
      try {
        var ch = new BroadcastChannel(name);
        ch.addEventListener("message", function (event) {
          emitLocal(event.data, name);
          forwardToAll(event.data, name);
        });
        legacyChannels.push({ name: name, channel: ch });
      } catch (error) {
        /* Tento legacy kanál přeskočíme. */
      }
    });
  }

  /* Spusť relay hned při načtení skriptu */
  start();

  window.CHT360Relay = {
    available: true,
    channelName: RELAY_CHANNEL,
    legacyChannels: LEGACY_CHANNELS.slice(),

    /** Odešle zprávu do všech kanálů (kanonický + legacy). */
    send: function (message) {
      forwardToAll(message, null);
      emitLocal(message, "local");
    },

    /** Vráti pole aktuálně otevřených legacy kanálů. */
    listChannels: function () {
      return legacyChannels.map(function (ch) { return ch.name; });
    }
  };
})();
