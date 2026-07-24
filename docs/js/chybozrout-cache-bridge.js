"use strict";

/*
  Chybožrout ↔ společný worker
  Nahraj jako:
  docs/js/chybozrout-cache-bridge.js

  Přidej do docs/index.html za cht-chybozrout.js:
  <script type="module" src="./js/chybozrout-cache-bridge.js"></script>
*/

const SHARED_WORKER_URL = "./service-worker.js";

async function getSharedWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      SHARED_WORKER_URL,
      {
        scope: "./",
        updateViaCache: "none"
      }
    );
  }

  await registration.update();
  return registration;
}

function sendWorkerMessage(type, payload = {}) {
  return new Promise(async resolve => {
    try {
      const registration = await getSharedWorkerRegistration();
      const worker =
        registration?.active ||
        registration?.waiting ||
        registration?.installing;

      if (!worker) {
        resolve({ ok: false, error: "Worker není aktivní." });
        return;
      }

      const channel = new MessageChannel();

      const timeout = setTimeout(() => {
        resolve({ ok: false, error: "Worker neodpověděl včas." });
      }, 5000);

      channel.port1.onmessage = event => {
        clearTimeout(timeout);
        resolve(event.data || { ok: true });
      };

      worker.postMessage(
        { type, ...payload },
        [channel.port2]
      );
    } catch (error) {
      resolve({
        ok: false,
        error: String(error?.message || error)
      });
    }
  });
}

window.CHT360Cache = {
  async status() {
    return sendWorkerMessage("CHYBOZROUT_STATUS");
  },

  async clear() {
    return sendWorkerMessage("CHYBOZROUT_CLEAR_CACHE");
  },

  async refresh(urls = []) {
    return sendWorkerMessage(
      "CHYBOZROUT_REFRESH_URLS",
      { urls }
    );
  },

  async updateWorker() {
    const registration = await getSharedWorkerRegistration();
    await registration?.update();
    return { ok: Boolean(registration) };
  }
};

window.addEventListener("cht.chybozrout.completed", async event => {
  const failedFiles = Array.isArray(event.detail?.files)
    ? event.detail.files
        .filter(file => !file.ok)
        .map(file => file.url)
    : [];

  if (failedFiles.length) {
    await window.CHT360Cache.refresh(failedFiles);
  }
});

window.addEventListener("online", () => {
  window.CHT360Cache.updateWorker();
});

getSharedWorkerRegistration().catch(() => {});
