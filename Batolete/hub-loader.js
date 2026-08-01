/*
  Batolete – hub-loader.js
  Dynamické načítání mini-aplikací v iframe vieweru
  Sdílí reward systém (hvězdičky) s hlavním hubem
*/

"use strict";

/* ── MINI-APPS REGISTRY ── */
const MINI_APPS = {
  "1o1r":        { title: "1O1R RPG",        emoji: "⚔️",  url: "../1O1R/index.html" },
  "revia":       { title: "Revia",            emoji: "✨",  url: "../Revia/index.html" },
  "revia-master":{ title: "Revia Master",     emoji: "🌑",  url: "../Revia-Master/index.html" },
  "3d-ramecek":  { title: "3D Rámeček",       emoji: "🧊",  url: "../3D ramecek/index.html" },
  "glyph-planet":{ title: "Glyph Planeta",    emoji: "🌐",  url: "../Glyph-Planet/index.html" },
  "glyph-planet-3d":{ title: "Glyph Planeta 3D", emoji: "🪐", url: "../Glyph-Planet-3D/index.html" },
  "glyph-editor":{ title: "Glyph Editor",     emoji: "🖊️",  url: "../Michal-AI-Al-Klimek/index.html" },
  "hlavoun":     { title: "Hlavoun",           emoji: "🤖",  url: "../Hlavoun/index.html" },
  "oblak":       { title: "Oblak",             emoji: "☁️",  url: "../Oblak/index.html" },
  "vaft-girls":  { title: "VaFT Girls",        emoji: "👧",  url: "../VAFT-Girls/index.html" },
  "vaft-bearhead":{ title: "VaFT BearHead",   emoji: "🐻",  url: "../VAFT-BearHead/index.html" },
  "vaft-comet":  { title: "VaFT Comet",        emoji: "☄️",  url: "../VAFT-Comet/index.html" },
  "chybozrout":  { title: "Chybožrout Opravář",emoji: "🔧", url: "../chybozrout-opravar/index.html" }
};

const HubLoader = (() => {
  const appViewer  = document.getElementById("appViewer");
  const appFrame   = document.getElementById("appFrame");
  const appBackBtn = document.getElementById("appBackBtn");
  const hubMain    = document.getElementById("hubMain");

  /* Open mini-app by registry key */
  function open(key) {
    const app = MINI_APPS[key];
    if (!app) {
      Hub.showToast("❌ Aplikace nenalezena");
      return;
    }
    openByUrl(app.url, app.title);
  }

  /* Open mini-app by direct URL */
  function openByUrl(url, title) {
    appFrame.src = url;
    appViewer.hidden = false;
    appViewer.removeAttribute("aria-hidden");
    hubMain.hidden = true;
    document.title = (title || "Aplikace") + " – Batolete";
    appBackBtn.focus();
  }

  function close() {
    appViewer.hidden = true;
    appViewer.setAttribute("aria-hidden", "true");
    hubMain.hidden = false;
    appFrame.src = "about:blank";
    document.title = "🌟 Batolete – Centrální Hub";
  }

  /* Wire mini-app card clicks */
  document.querySelectorAll(".hub-card[data-app]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof playSound === "function") playSound("tap");
      open(btn.dataset.app);
    });
  });

  appBackBtn.addEventListener("click", close);

  /* Listen for postMessage from mini-apps (reward sharing) */
  window.addEventListener("message", (e) => {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "batolete:reward" && typeof e.data.stars === "number") {
      if (typeof Reward !== "undefined") Reward.add(e.data.stars);
    }
    if (e.data.type === "batolete:back") {
      close();
    }
  });

  return { open, openByUrl, close };
})();
