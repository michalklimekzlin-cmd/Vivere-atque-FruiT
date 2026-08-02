(function (window) {
  "use strict";

  var config = window.CHT360Config || { storageKeys: { uiLogs: "cht360_ui_logs_v1" } };
  var KEY = config.storageKeys.uiLogs;
  var LIMIT = 80;

  function load() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function save(entries) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(entries.slice(-LIMIT)));
    } catch (error) {
      /* no-op */
    }
  }

  function flatten(args) {
    return Array.prototype.slice.call(args).map(function (item) {
      if (typeof item === "string") return item;
      try {
        return JSON.stringify(item);
      } catch (error) {
        return String(item);
      }
    }).join(" ").slice(0, 400);
  }

  function push(level, args) {
    var message = flatten(args);
    var entry = {
      level: level,
      message: message,
      at: new Date().toISOString(),
      path: window.location.pathname
    };
    var entries = load();
    entries.push(entry);
    save(entries);
    try {
      var method = level === "error" ? "error" : (level === "warn" ? "warn" : "log");
      console[method]("[CHT360]", message);
    } catch (error) {
      console.log("[CHT360]", message);
    }
    return entry;
  }

  window.CHT360Logger = {
    debug: function () { return push("debug", arguments); },
    info: function () { return push("info", arguments); },
    warn: function () { return push("warn", arguments); },
    error: function () { return push("error", arguments); },
    getEntries: load,
    clear: function () { save([]); },
    exportText: function () {
      return load().map(function (entry) {
        return "[" + entry.at + "] " + entry.level.toUpperCase() + " " + entry.message;
      }).join("\n");
    }
  };
})(window);
