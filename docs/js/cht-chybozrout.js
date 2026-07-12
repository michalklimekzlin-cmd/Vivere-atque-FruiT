"use strict";

const CHYBOZROUT_REPORT_KEY =
  "cht360_chybozrout_report_v1";

const CHYBOZROUT_SCRIPTS = [
  "../chybozrout-opravar/repairnet.js",
  "../chybozrout-opravar/repairnet.monitor.js"
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing =
      document.querySelector(
        `script[data-chybozrout="${src}"]`
      );

    if (existing) {
      resolve();
      return;
    }

    const script =
      document.createElement("script");

    script.src = src;
    script.async = true;
    script.dataset.chybozrout = src;

    script.onload = () => resolve();
    script.onerror = () => {
      reject(
        new Error(
          `Soubor ${src} se nepodařilo načíst.`
        )
      );
    };

    document.head.appendChild(script);
  });
}

const CHTChybozrout = {
  name: "[◉_◉] ChybaŽrout",
  ready: false,
  running: false,
  lastReport: null,

  async connect() {
    if (this.ready) {
      return true;
    }

    const errors = [];

    for (const src of CHYBOZROUT_SCRIPTS) {
      try {
        await loadScript(src);
      } catch (error) {
        errors.push({
          source: src,
          message: String(error)
        });
      }
    }

    this.ready = Boolean(
      window.RepairNet ||
      window.RepairNetMonitor
    );

    window.dispatchEvent(
      new CustomEvent(
        "cht.chybozrout.connected",
        {
          detail: {
            ready: this.ready,
            errors,
            timestamp: Date.now()
          }
        }
      )
    );

    return this.ready;
  },

  async run() {
    if (this.running) {
      return this.lastReport;
    }

    this.running = true;

    const startedAt = Date.now();
    const findings = [];

    try {
      await this.connect();

      if (
        window.RepairNetMonitor &&
        typeof window.RepairNetMonitor.runDeep ===
          "function"
      ) {
        try {
          await window.RepairNetMonitor.runDeep();

          findings.push({
            scanner: "RepairNetMonitor",
            status: "completed"
          });
        } catch (error) {
          findings.push({
            scanner: "RepairNetMonitor",
            status: "error",
            error: String(error)
          });
        }
      }

      if (
        window.RepairNet &&
        typeof window.RepairNet.scanDeep ===
          "function"
      ) {
        try {
          await window.RepairNet.scanDeep();

          findings.push({
            scanner: "RepairNet",
            status: "completed"
          });
        } catch (error) {
          findings.push({
            scanner: "RepairNet",
            status: "error",
            error: String(error)
          });
        }
      }

      if (
        window.CHTScany &&
        typeof window.CHTScany.run === "function"
      ) {
        try {
          const scanReport =
            await window.CHTScany.run();

          findings.push({
            scanner: "CHTScany",
            status:
              scanReport?.ok
                ? "completed"
                : "warning",
            report: scanReport || null
          });
        } catch (error) {
          findings.push({
            scanner: "CHTScany",
            status: "error",
            error: String(error)
          });
        }
      }

      const report = {
        system: "CHT 360°‰.",
        scanner: this.name,
        startedAt,
        finishedAt: Date.now(),
        durationMs:
          Date.now() - startedAt,

        connected: this.ready,

        ok:
          findings.every(
            item =>
              item.status !== "error"
          ),

        findings
      };

      this.lastReport = report;

      localStorage.setItem(
        CHYBOZROUT_REPORT_KEY,
        JSON.stringify(report)
      );

      if (
        window.CHTEnergy &&
        typeof window.CHTEnergy.receivePulse ===
          "function"
      ) {
        const errorCount =
          findings.filter(
            item => item.status === "error"
          ).length;

        window.CHTEnergy.receivePulse(
          "control",
          1 + errorCount
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "cht.chybozrout.completed",
          {
            detail: report
          }
        )
      );

      console.log(
        "[CHT ChybaŽrout]",
        report
      );

      return report;
    } finally {
      this.running = false;
    }
  },

  getLastReport() {
    if (this.lastReport) {
      return this.lastReport;
    }

    try {
      return JSON.parse(
        localStorage.getItem(
          CHYBOZROUT_REPORT_KEY
        ) || "null"
      );
    } catch {
      return null;
    }
  }
};

window.CHTChybozrout =
  CHTChybozrout;

window.setTimeout(
  () => CHTChybozrout.connect(),
  1500
);
