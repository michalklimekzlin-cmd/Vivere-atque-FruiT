(function (window) {
  "use strict";

  var config = window.CHT360Config || { storageKeys: { performance: "cht360_performance_v1" } };
  var KEY = config.storageKeys.performance;
  var LIMIT = 120;

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
      /* ignore */
    }
  }

  function record(name, duration, detail) {
    var entries = load();
    entries.push({
      name: String(name || "measure"),
      duration: Number(duration || 0),
      detail: String(detail || "").slice(0, 240),
      at: new Date().toISOString()
    });
    save(entries);
  }

  function mark(name) {
    try {
      window.performance.mark(name);
    } catch (error) {
      /* ignore */
    }
  }

  function measure(name, start, end, detail) {
    var duration = 0;
    try {
      window.performance.measure(name, start, end);
      var measures = window.performance.getEntriesByName(name, "measure");
      duration = measures.length ? measures[measures.length - 1].duration : 0;
    } catch (error) {
      duration = 0;
    }
    record(name, duration, detail);
    return duration;
  }

  window.CHT360Performance = {
    mark: mark,
    measure: measure,
    record: record,
    noteStorage: function (key) { record("storage-sync", 0, key); },
    getEntries: load,
    clear: function () { save([]); }
  };
})(window);
