"use strict";

/*
  Lokální most CHT
  ---------------
  Spojuje otevřené části stejného projektu na stejném zařízení/originu.
  Neposílá nic do internetu, neskenuje Wi-Fi ani nečte název sítě. Ukládá jen
  stručné stavové signály, aby se Revia po návratu offline/online orientovala.
*/

const CHANNEL_NAME = "cht360-local-mesh-v1";
const SIGNAL_KEY = "cht360_revia_local_signals_v1";
const MAX_SIGNALS = 48;

function readSignals() {
  try {
    const saved = JSON.parse(localStorage.getItem(SIGNAL_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(item => item && typeof item.type === "string" && typeof item.at === "string").slice(-MAX_SIGNALS)
      : [];
  } catch {
    return [];
  }
}

function writeSignals(signals) {
  try {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify(signals.slice(-MAX_SIGNALS)));
  } catch (error) {
    console.warn("[Revia] Lokální signál se nepodařilo uložit.", error);
  }
}

function compactDetail(detail) {
  if (!detail || typeof detail !== "object") return {};
  const safe = {};
  for (const [key, value] of Object.entries(detail)) {
    if (typeof value === "string") safe[key] = value.slice(0, 180);
    else if (typeof value === "number" || typeof value === "boolean") safe[key] = value;
  }
  return safe;
}

function connectionHint() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return { online: navigator.onLine, kind: "prohlížeč neuvádí typ připojení" };
  return {
    online: navigator.onLine,
    kind: connection.effectiveType || connection.type || "typ připojení není uveden",
    saveData: Boolean(connection.saveData)
  };
}

export function createReviaLocalMesh(onSignal) {
  let signals = readSignals();
  let channel = null;

  function remember(type, detail = {}, origin = "Revia") {
    const signal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: String(type || "stav").slice(0, 100),
      detail: compactDetail(detail),
      origin: String(origin || "Revia").slice(0, 80),
      at: new Date().toISOString()
    };
    signals = [...signals, signal].slice(-MAX_SIGNALS);
    writeSignals(signals);
    onSignal?.(signal);
    return signal;
  }

  function announce(type, detail = {}) {
    const signal = remember(type, detail, "Revia");
    try {
      channel?.postMessage({ type, detail: signal.detail, at: signal.at, origin: "Revia" });
    } catch (error) {
      console.warn("[Revia] Lokální vysílání signálu selhalo.", error);
    }
    return signal;
  }

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", event => {
      const message = event.data || {};
      if (!message.type || message.origin === "Revia") return;
      remember(message.type, message.detail, message.origin || "část CHT");
    });
  }

  window.addEventListener("storage", event => {
    if (event.key === SIGNAL_KEY && event.newValue) {
      signals = readSignals();
    }
  });

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  connection?.addEventListener?.("change", () => announce("připojení se změnilo", connectionHint()));

  return Object.freeze({
    announce,
    getSignals: () => signals.map(item => ({ ...item, detail: { ...item.detail } })),
    getConnectionHint: connectionHint,
    supported: Boolean(channel),
    close: () => channel?.close()
  });
}

export function formatLocalMeshStatus(mesh) {
  const connection = mesh.getConnectionHint();
  const recent = mesh.getSignals().slice(-5).reverse();
  return [
    "Lokální most CHT:",
    `• připojení: ${connection.online ? "k dispozici" : "offline"}${connection.kind ? " — " + connection.kind : ""}`,
    `• spojení mezi otevřenými částmi projektu: ${mesh.supported ? "připravené" : "záložní místní úložiště"}`,
    "• Wi‑Fi se neprohledává a žádný cizí obsah se nestahuje automaticky.",
    ...(recent.length ? ["Poslední bezpečné signály:", ...recent.map(item => `• ${item.origin}: ${item.type}`)] : ["Zatím nejsou žádné signály."])
  ].join("\n");
}
