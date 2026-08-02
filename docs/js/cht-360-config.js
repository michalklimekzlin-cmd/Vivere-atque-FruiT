(function (window) {
  "use strict";

  function getDocsBase() {
    var path = window.location.pathname || "/";
    var marker = "/docs/";
    var index = path.indexOf(marker);
    if (index >= 0) return path.slice(0, index + marker.length);
    return path.replace(/[^/]*$/, "") + "docs/";
  }

  function normalisePath(value) {
    return String(value || "")
      .replace(/\/+/g, "/")
      .replace(/\/index\.html$/i, "/")
      .replace(/\/$/, "");
  }

  function resolveModuleUrl(relativePath) {
    return new URL(String(relativePath || "index.html"), window.location.origin + getDocsBase()).toString();
  }

  var modules = [
    {
      id: "cht-360-core",
      title: "Paměť",
      longTitle: "CHT 360°‰. Paměť",
      path: "index.html",
      badge: "Paměť",
      description: "Hlavní rozcestník paměti, jádra, pokojíčků a kontroly.",
      storageKeys: ["cht360_pamet_v1", "cht360_pamet_snapshots_v1", "cht360_glyph_rooms_v2"]
    },
    {
      id: "cht-mluva",
      title: "Mluva",
      longTitle: "Mluva CHT 360°‰.",
      path: "mluva-cht-360/",
      badge: "Mluva",
      description: "Offline rozhovor nad lokální pamětí a glyphy.",
      storageKeys: ["cht360_mluva_history_v1", "cht360_pamet_v1", "cht360_glyph_workshop_v1", "cht360_slot_locks_v1"]
    },
    {
      id: "glyph-cht-360",
      title: "Glyphy",
      longTitle: "Glyph CHT 360°‰.",
      path: "glyph-cht-360/",
      badge: "Glyphy",
      description: "Dílna glyphů, bubínků a exportu vlastních znaků.",
      storageKeys: ["cht360_glyph_workshop_v1", "cht360_glyph_context_v1", "cht360_glyph_transfer_v1"]
    },
    {
      id: "glyph-pokojicku-cht-360",
      title: "Pokojíčky",
      longTitle: "Glyph pokojíčky CHT 360°‰.",
      path: "glyph-pokojicku-cht-360/",
      badge: "Pokojíčky",
      description: "Pokojíčky a vazby glyphů na místa a moduly.",
      storageKeys: ["glyph-cht-360-rooms.v1", "cht360_glyph_rooms_v2"]
    },
    {
      id: "cht-360-bubinky",
      title: "Bubínky",
      longTitle: "Bubínky CHT 360°‰.",
      path: "bubinky/",
      badge: "Bubínky",
      description: "Zámky slotů, odemykání a přehled bubínků.",
      storageKeys: ["cht360_bubinky_values_v1", "cht360_slot_locks_v1", "cht360_slot_unlocks_v1"]
    },
    {
      id: "cht-360-jadra",
      title: "Jádra",
      longTitle: "Jádra — pracovní deska",
      path: "cht360-jadra-pracovni-deska/",
      badge: "Jádra",
      description: "Pracovní deska a rychlý pohled do čtyř jader.",
      storageKeys: ["cht360_jadra_pracovni_deska_v1"]
    },
    {
      id: "cht-puls-360",
      title: "Puls",
      longTitle: "CHT Puls 360°‰.",
      path: "cht-puls-360/",
      badge: "Puls",
      description: "Puls, koš, kompost a přenosové cesty CHT.",
      storageKeys: ["cht360_puls_memory_v1"]
    },
    {
      id: "signal-360",
      title: "Signal",
      longTitle: "Signal 360°‰.",
      path: "signal-360/",
      badge: "Signal",
      description: "Signální věž, sloty a přímé otevírání modulů.",
      storageKeys: ["vaft_pamet_v1"]
    },
    {
      id: "cht-chybozrout",
      title: "ChybaŽrout",
      longTitle: "ChybaŽrout",
      path: "index.html#repair",
      badge: "Opravy",
      description: "Rychlá cesta do kontroly a bezpečných oprav v hlavním CHT.",
      storageKeys: ["cht360_scan_report_v2", "cht360_samoopravovna_backup_v2"]
    },
    {
      id: "revia",
      title: "Revia",
      longTitle: "Revia",
      path: "index.html#revia",
      badge: "Revia",
      description: "Průvodce, nápověda a projektová paměť uvnitř CHT.",
      storageKeys: ["cht360_revia_v1", "cht360_revia_state_v1"]
    }
  ].map(function (item) {
    return Object.freeze({
      id: item.id,
      title: item.title,
      longTitle: item.longTitle,
      path: item.path,
      badge: item.badge,
      description: item.description,
      storageKeys: Object.freeze(item.storageKeys.slice()),
      url: resolveModuleUrl(item.path)
    });
  });

  var config = {
    version: "2026.08-ui-shell",
    docsBase: getDocsBase(),
    repoBase: getDocsBase().replace(/docs\/$/, ""),
    breakpoints: Object.freeze({ mobile: 320, phone: 375, tablet: 768, desktop: 1024 }),
    colors: Object.freeze({
      goldPrimary: "#e7b65c",
      goldLight: "#f5e6c8",
      goldDark: "#b8933c",
      bgPrimary: "#fafaf8",
      bgSecondary: "#f0ede6",
      textPrimary: "#2a2a2a",
      textSecondary: "#666666",
      border: "#d4cfc5",
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
      cream: "#fff0d3",
      ink: "#090806",
      panel: "rgba(13, 10, 8, 0.86)"
    }),
    spacing: Object.freeze([4, 8, 12, 16, 24, 32, 48, 64]),
    storageKeys: Object.freeze({
      uiLogs: "cht360_ui_logs_v1",
      performance: "cht360_performance_v1",
      uiState: "cht360_ui_state_v1"
    }),
    modules: Object.freeze(modules),
    resolveModuleUrl: resolveModuleUrl,
    normalisePath: normalisePath
  };

  window.CHT360Config = Object.freeze(config);
})(window);
