/* =========================================================
   CHT 360°‰ / Vivere atque Fru¡T•ア — SYNC BACKEND
   Vercel Serverless
   ========================================================= */

const memoryStore = globalThis.__CHT360_STORE__ || {
  devices: {},
  events: [],
  snapshots: {}
};
globalThis.__CHT360_STORE__ = memoryStore;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — stav pro novou PWA / debug
  if (req.method === "GET") {
    const deviceId = req.query?.deviceId;

    if (deviceId) {
      return res.status(200).json({
        ok: true,
        deviceId,
        snapshot: memoryStore.snapshots[deviceId] || null,
        recentEvents: memoryStore.events
          .filter(e => e.deviceId === deviceId)
          .slice(-50)
      });
    }

    return res.status(200).json({
      ok: true,
      devices: Object.keys(memoryStore.snapshots),
      totalEvents: memoryStore.events.length,
      lastEvents: memoryStore.events.slice(-20)
    });
  }

  // POST — příjem z jádra
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { deviceId, version, model, sentAt, events = [], snapshot = {} } = body;

      if (!deviceId) {
        return res.status(400).json({ ok: false, error: "Missing deviceId" });
      }

      memoryStore.snapshots[deviceId] = {
        ...snapshot,
        deviceId,
        version: version || null,
        model: model || null,
        receivedAt: new Date().toISOString(),
        sentAt: sentAt || null
      };

      const accepted = [];
      for (const event of events) {
        const record = {
          ...event,
          deviceId,
          receivedAt: new Date().toISOString()
        };
        memoryStore.events.push(record);
        accepted.push(record.id || record.kind);
      }

      if (memoryStore.events.length > 2000) {
        memoryStore.events = memoryStore.events.slice(-1500);
      }

      const keys = events
        .filter(e => e.apiKey && e.bubinekId)
        .map(e => ({
          bubinekId: e.bubinekId,
          apiKey: e.apiKey,
          value: e.value,
          kind: e.kind
        }));

      return res.status(200).json({
        ok: true,
        message: "Sync accepted",
        deviceId,
        acceptedEvents: accepted.length,
        keysReceived: keys.length,
        keys
      });
    } catch (err) {
      console.error("[CHT360 Sync]", err);
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}