(function (window) {
  "use strict";

  var config = window.CHT360Config || { modules: [], resolveModuleUrl: function (path) { return path; }, normalisePath: function (value) { return String(value || ""); } };

  function matchCurrentModule() {
    var here = config.normalisePath(window.location.pathname || "");
    var best = null;

    config.modules.forEach(function (module) {
      var url = new URL(module.url, window.location.origin);
      var target = config.normalisePath(url.pathname);
      if (here === target || here.indexOf(target + "/") === 0 || target.indexOf(here + "/") === 0) {
        if (!best || target.length > best.target.length) {
          best = { module: module, target: target };
        }
      }
    });

    return best ? best.module : (config.modules[0] || null);
  }

  function getModuleById(id) {
    return config.modules.find(function (module) { return module.id === id; }) || null;
  }

  function getModuleLinks() {
    return config.modules.slice();
  }

  function getBreadcrumbs() {
    var current = matchCurrentModule();
    return [
      { label: "CHT 360°‰.", url: config.resolveModuleUrl("index.html") },
      current ? { label: current.longTitle || current.title, url: current.url } : { label: "Modul", url: window.location.href }
    ];
  }

  function getBackTarget() {
    if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
      return null;
    }
    return config.resolveModuleUrl("index.html");
  }

  function goBack() {
    if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
      window.history.back();
      return;
    }
    window.location.assign(config.resolveModuleUrl("index.html"));
  }

  function goHome() {
    window.location.assign(config.resolveModuleUrl("index.html"));
  }

  function openModule(idOrUrl) {
    var module = getModuleById(idOrUrl);
    window.location.assign(module ? module.url : String(idOrUrl || config.resolveModuleUrl("index.html")));
  }

  window.CHT360Navigation = {
    getCurrentModule: matchCurrentModule,
    getModuleById: getModuleById,
    getModuleLinks: getModuleLinks,
    getBreadcrumbs: getBreadcrumbs,
    getBackTarget: getBackTarget,
    goBack: goBack,
    goHome: goHome,
    openModule: openModule
  };
})(window);
