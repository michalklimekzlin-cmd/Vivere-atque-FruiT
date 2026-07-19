"use strict";

// CHT 360°‰ používá hlavní kreslení v ./aplikace.js.
// Tento modul zůstává jako bezpečný most pro starý odkaz v index.html.
window.dispatchEvent(new CustomEvent("cht360.bridge.ready"));

