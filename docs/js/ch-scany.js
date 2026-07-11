"use strict";

const CHT_SCAN_KEY = "cht360_scan_report_v1";
const MEMORY_KEYS = [
  "cht360_pamet_v1",
  "vaft_pamet_v1"
];

const CORE_IDS = [
  "earth",
  "language",
  "game",
  "control"
];

const FILES = [
  "./index.html",
  "./css/pamet.css",
  "./js/aplikace.js",
  "./js/cht-zivot.js",
  "./js/cht-panel.js",
  "./js/cht-scany.js",
  "./manifest.json",
  "./service-worker.js"
];

function safeParse(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadMemory() {
  for (const key of MEMORY_KEYS) {
    const raw = localStorage.getItem(key);

    if (raw) {
      return {
        key,
        data: safeParse(raw)
      };
    }
  }

  return {
    key: null,
    data: null
  };
}

function scanMemory() {
  const loaded = loadMemory();
  const issues = [];
  const cores = {};

  if (!loaded.data?.cores) {
    issues.push({
      type: "error",
      message: "Paměť nebo její jádra nebyla nalezena."
    });

    return {
      ok: false,
      key: loaded.key,
      totalSlots: 0,
      usedSlots: 0,
      cores,
      issues
    };
  }

  let totalSlots = 0;
  let usedSlots = 0;

  for (const coreId of CORE_IDS) {
    const slots = loaded.data.cores[coreId];

    if (!Array.isArray(slots)) {
      issues.push({
        type: "error",
        coreId,
        message: `Jádro ${coreId} není platné pole.`
      });

      cores[coreId] = {
        slots: 0,
        used: 0
      };

      continue;
    }

    const used = slots.filter((slot) => {
      const content =
        String(slot?.content || "").trim();

      const name =
        String(slot?.name || "").trim();

      return Boolean(
        content ||
        (
          name &&
          name !== `Slot ${slot?.id}`
        )
      );
    }).length;

    cores[coreId] = {
      slots: slots.length,
      used
    };

    totalSlots += slots.length;
    usedSlots += used;

    if (slots.length !== 70) {
      issues.push({
        type: "warning",
        coreId,
        message:
          `${coreId} má ${slots.length}/70 slotů.`
      });
    }
  }

  return {
    ok:
      !issues.some(
        issue => issue.type === "error"
      ),

    key: loaded.key,
    totalSlots,
    usedSlots,
    cores,
    issues
  };
}

async function scanFiles() {
  const results = [];

  for (const path of FILES) {
    const start = performance.now();

    try {
      const response = await fetch(
        `${path}?scan=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      results.push({
        path,
        ok: response.ok,
        status: response.status,
        ms: Math.round(
          performance.now() - start
        )
      });
    } catch (error) {
      results.push({
        path,
        ok: false,
        status: "ERR",
        ms: Math.round(
          performance.now() - start
        ),
        error: String(error)
      });
    }
  }

  return {
    ok: results.every(item => item.ok),
    results,
    failed:
      results.filter(item => !item.ok)
  };
}

async function scanGitHubActions() {
  const url =
    "https://api.github.com/repos/" +
    "michalklimekzlin-cmd/" +
    "Vivere-atque-FruiT/" +
    "actions/runs?per_page=30";

  try {
    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API ${response.status}`
      );
    }

    const data = await response.json();

    const runs =
      Array.isArray(data.workflow_runs)
        ? data.workflow_runs
        : [];

    const failed = runs
      .filter(
        run => run.conclusion === "failure"
      )
      .map(run => ({
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        createdAt: run.created_at,
        url: run.html_url
      }));

    return {
      ok: true,
      totalRuns: runs.length,
      failedRuns: failed.length,
      failed
    };
  } catch (error) {
    return {
      ok: false,
      totalRuns: 0,
      failedRuns: 0,
      failed: [],
      error: String(error)
    };
  }
}

function scanRuntime() {
  const issues = [];

  if (!window.CHTLife) {
    issues.push({
      type: "error",
      message: "CHTLife není načtené."
    });
  }

  if (!window.CHTEnergy) {
    issues.push({
      type: "error",
      message: "CHTEnergy není načtené."
    });
  }

  return {
    ok:
      !issues.some(
        issue => issue.type === "error"
      ),

    online: navigator.onLine,

    serviceWorker:
      "serviceWorker" in navigator,

    secureContext:
      window.isSecureContext,

    chtLife:
      Boolean(window.CHTLife),

    chtEnergy:
      Boolean(window.CHTEnergy),

    issues
  };
}

const CHTScany = {
  running: false,
  lastReport: null,

  async run() {
    if (this.running) {
      return this.lastReport;
    }

    this.running = true;

    const startedAt = Date.now();

    try {
      const memory = scanMemory();
      const runtime = scanRuntime();
      const files = await scanFiles();
      const github =
        await scanGitHubActions();

      const errors = [
        ...memory.issues,
        ...runtime.issues,

        ...files.failed.map(item => ({
          type: "error",
          message:
            `${item.path} nelze načíst.`,
          path: item.path
        })),

        ...github.failed.map(run => ({
          type: "error",
          message:
            `Workflow ${run.name} selhal.`,
          url: run.url
        }))
      ];

      const report = {
        system: "CHT 360°‰.",
        startedAt,
        finishedAt: Date.now(),
        durationMs:
          Date.now() - startedAt,

        ok:
          !errors.some(
            item => item.type === "error"
          ),

        memory,
        runtime,
        files,
        github,
        errors
      };

      this.lastReport = report;

      localStorage.setItem(
        CHT_SCAN_KEY,
        JSON.stringify(report)
      );

      if (
        window.CHTEnergy &&
        typeof window.CHTEnergy.receivePulse ===
          "function"
      ) {
        window.CHTEnergy.receivePulse(
          "control",
          Math.max(
            1,
            1 + errors.length * 0.2
          )
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "cht.scan.completed",
          {
            detail: report
          }
        )
      );

      console.log(
        "[CHT Scany]",
        report
      );

      return report;
    } catch (error) {
      console.error(
        "[CHT Scany] Sken selhal.",
        error
      );

      return null;
    } finally {
      this.running = false;
    }
  },

  getLastReport() {
    if (this.lastReport) {
      return this.lastReport;
    }

    return safeParse(
      localStorage.getItem(
        CHT_SCAN_KEY
      )
    );
  }
};

window.CHTScany = CHTScany;

window.addEventListener(
  "online",
  () => CHTScany.run()
);

window.setTimeout(
  () => CHTScany.run(),
  2000
);
