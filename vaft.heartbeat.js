// vaft.heartbeat.js
// jednoduchý signalizační systém pro tvoje VAFT appky

const VAFT_NODE_ID = (function () {
  // zkusíme vzít název složky z URL
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    // poslední část bude např. "VAFT-GhostGirl"
    return parts[parts.length - 1] || "VAFT-Unknown";
  } catch (e) {
    return "VAFT-Unknown";
  }
})();

const VAFT_HEARTBEAT_KEY = "vaft_heartbeat_v1";
const VAFT_HEARTBEAT_TTL = 8000; // po 8s je uzel považovaný za offline

function sendHeartbeat() {
  const now = Date.now();
  // načti dosavadní mapu
  const raw = localStorage.getItem(VAFT_HEARTBEAT_KEY);
  let map = {};
  if (raw) {
    try {
      map = JSON.parse(raw);
    } catch (e) {
      map = {};
    }
  }
  // zapiš sebe
  map[VAFT_NODE_ID] = {
    ts: now
  };
  localStorage.setItem(VAFT_HEARTBEAT_KEY, JSON.stringify(map));
  // pro debugging
  window.__VAFT_HEARTBEAT_LAST__ = map;
}

function getOnlineNodes() {
  const now = Date.now();
  const raw = localStorage.getItem(VAFT_HEARTBEAT_KEY);
  let map = {};
  if (raw) {
    try {
      map = JSON.parse(raw);
    } catch (e) {
      map = {};
    }
  }
  const online = [];
  Object.keys(map).forEach(id => {
    if (now - map[id].ts < VAFT_HEARTBEAT_TTL) {
      online.push(id);
    }
  });
  return online;
}

// po načtení stránky hned pošli pulz
sendHeartbeat();
// pak každé 3 sekundy
setInterval(sendHeartbeat, 3000);

// aby ostatní skripty v téhle stránce mohly zjistit, kdo žije:
window.VAFT = window.VAFT || {};
window.VAFT.getOnlineNodes = getOnlineNodes;
window.VAFT.nodeId = VAFT_NODE_ID;
