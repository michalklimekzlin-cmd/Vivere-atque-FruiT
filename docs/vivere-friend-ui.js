from pathlib import Path

code = r'''/* =========================================================
   VIVERE FRIEND UI — CHT 360°‰
   v0.1 — první obrazovka Frienda

   Umístění:
     docs/vivere-friend-ui.js

   Navazuje na:
     vivere-friend-core.js
     vivere-friend-memory.js
     vivere-friend-state.js
     vivere-friend-bridge.js

   Použití:
     <script src="./vivere-friend-ui.js"></script>

   UI se vloží do elementu:
     #vivere-friend-root

   Pokud element neexistuje, vytvoří se automaticky.
   ========================================================= */

(() => {
  "use strict";

  const ROOT_ID = "vivere-friend-root";
  let root = null;

  function getSnapshot() {
    if (
      window.VivereFriendBridge &&
      typeof window.VivereFriendBridge.getSnapshot === "function"
    ) {
      return window.VivereFriendBridge.getSnapshot();
    }

    const friend =
      window.VivereFriend?.get?.() || {};

    const life =
      window.VivereFriendState?.get?.() || {};

    return {
      identity: friend.identity || {},
      life: life.life || friend.life || {},
      stream: life.stream || friend.stream || {},
      memory: {
        count:
          window.VivereFriendMemory?.count?.() || 0
      },
      glyphs: friend.glyphs || []
    };
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createRoot() {
    root = document.getElementById(ROOT_ID);

    if (!root) {
      root = document.createElement("section");
      root.id = ROOT_ID;

      root.setAttribute(
        "aria-label",
        "Vivere Friend"
      );

      document.body.appendChild(root);
    }

    return root;
  }

  function render() {
    if (!root) createRoot();

    const snapshot = getSnapshot();

    const identity =
      snapshot.identity || {};

    const life =
      snapshot.life || {};

    const stream =
      snapshot.stream || {};

    const memory =
      snapshot.memory || {};

    const glyphs =
      Array.isArray(snapshot.glyphs)
        ? snapshot.glyphs
        : [];

    const name =
      identity.name || "Vivere Friend";

    const dna =
      identity.dna || "—";

    const status =
      life.status || "awake";

    const experience =
      life.experience ?? 0;

    const pulses =
      life.pulses ?? 0;

    const memoryCount =
      memory.count ?? 0;

    const direction =
      stream.direction || "stable";

    const directionSymbol =
      direction === "up"
        ? "↗"
        : direction === "down"
          ? "↘"
          : "→";

    const recentMemories =
      Array.isArray(memory.recent)
        ? memory.recent.slice(0, 3)
        : [];

    root.innerHTML = `
      <div class="vf-card">

        <div class="vf-header">
          <div class="vf-avatar" aria-hidden="true">
            🌱
          </div>

          <div class="vf-title">
            <div class="vf-name">
              ${escapeHTML(name)}
            </div>

            <div class="vf-status">
              <span class="vf-status-dot"></span>
              ${escapeHTML(status)}
            </div>
          </div>
        </div>

        <div class="vf-dna">
          <div class="vf-label">
            🧬 DNA / SEED
          </div>

          <code>${escapeHTML(dna)}</code>
        </div>

        <div class="vf-stream">
          <div class="vf-label">
            ❤️ ŽIVOTNÍ TOK
          </div>

          <div class="vf-stream-value">
            <span class="vf-direction">
              ${directionSymbol}
            </span>

            <code>
              ${escapeHTML(stream.value || dna)}
            </code>
          </div>
        </div>

        <div class="vf-stats">

          <div class="vf-stat">
            <strong>${experience}</strong>
            <span>Zkušenosti</span>
          </div>

          <div class="vf-stat">
            <strong>${memoryCount}</strong>
            <span>Vzpomínky</span>
          </div>

          <div class="vf-stat">
            <strong>${pulses}</strong>
            <span>Pulzy</span>
          </div>

          <div class="vf-stat">
            <strong>${glyphs.length}</strong>
            <span>Glyphy</span>
          </div>

        </div>

        <div class="vf-memory">
          <div class="vf-label">
            🧠 POSLEDNÍ VZPOMÍNKY
          </div>

          ${
            recentMemories.length
              ? recentMemories
                  .map(memoryItem => `
                    <div class="vf-memory-item">
                      <span>
                        ${escapeHTML(
                          memoryItem.text ||
                          memoryItem.type ||
                          "Vzpomínka"
                        )}
                      </span>
                    </div>
                  `)
                  .join("")
              : `
                <div class="vf-empty">
                  Zatím žádné vzpomínky.
                </div>
              `
          }
        </div>

        <div class="vf-actions">

          <button
            type="button"
            data-vf-action="pulse"
          >
            ❤️ Pulz
          </button>

          <button
            type="button"
            data-vf-action="memory"
          >
            🧠 Zapamatovat
          </button>

          <button
            type="button"
            data-vf-action="refresh"
          >
            ↻ Obnovit
          </button>

        </div>

        <div class="vf-footer">
          CHT 360°‰ · Vivere Friend v0.1
        </div>

      </div>
    `;

    bindActions();
  }

  function bindActions() {
    root
      .querySelector(
        '[data-vf-action="pulse"]'
      )
      ?.addEventListener(
        "click",
        () => {
          if (
            window.VivereFriendBridge?.pulse
          ) {
            window.VivereFriendBridge.pulse();
          } else {
            window.VivereFriendState?.pulse?.();
          }

          render();
        }
      );

    root
      .querySelector(
        '[data-vf-action="memory"]'
      )
      ?.addEventListener(
        "click",
        () => {
          const message =
            window.prompt(
              "Co si má Vivere Friend zapamatovat?"
            );

          if (
            message &&
            window.VivereFriendMemory?.remember
          ) {
            window.VivereFriendMemory.remember({
              type: "user",
              text: message,
              importance: 70,
              tags: [
                "user",
                "vivere"
              ],
              source: "vivere-friend-ui"
            });

            render();
          }
        }
      );

    root
      .querySelector(
        '[data-vf-action="refresh"]'
      )
      ?.addEventListener(
        "click",
        render
      );
  }

  function init() {
    createRoot();
    render();

    window.addEventListener(
      "cht360:vivere-state-changed",
      render
    );

    window.addEventListener(
      "cht360:vivere-memory-created",
      render
    );

    window.addEventListener(
      "cht360:vivere-pulse",
      render
    );

    window.addEventListener(
      "cht360:vivere-bridge-ready",
      render
    );

    console.log(
      "📱 CHT 360°‰ — Vivere Friend UI ready"
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

  window.VivereFriendUI = Object.freeze({
    version: 1,
    render,
    init
  });
})();
'''

css = r'''/* =========================================================
   VIVERE FRIEND UI — CHT 360°‰
   v0.1
   Umístění: docs/vivere-friend-ui.css
   ========================================================= */

#vivere-friend-root {
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

#vivere-friend-root * {
  box-sizing: border-box;
}

.vf-card {
  width: min(100%, 520px);
  margin: 0 auto;
  padding: 20px;
  border: 1px solid rgba(127, 127, 127, .28);
  border-radius: 24px;
  background: rgba(255, 255, 255, .06);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 14px 40px rgba(0, 0, 0, .14);
}

.vf-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.vf-avatar {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(127, 127, 127, .14);
  font-size: 30px;
}

.vf-name {
  font-size: 22px;
  font-weight: 700;
}

.vf-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  opacity: .72;
  font-size: 13px;
}

.vf-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.vf-label {
  margin-bottom: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  opacity: .62;
}

.vf-dna,
.vf-stream,
.vf-memory {
  padding: 14px;
  margin-top: 12px;
  border-radius: 16px;
  background: rgba(127, 127, 127, .08);
}

.vf-dna code,
.vf-stream code {
  display: block;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}

.vf-stream-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vf-direction {
  font-size: 20px;
  line-height: 1;
}

.vf-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.vf-stat {
  min-width: 0;
  padding: 12px 7px;
  border-radius: 15px;
  background: rgba(127, 127, 127, .08);
  text-align: center;
}

.vf-stat strong {
  display: block;
  font-size: 18px;
}

.vf-stat span {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  opacity: .62;
}

.vf-memory-item,
.vf-empty {
  padding: 9px 0;
  border-top: 1px solid rgba(127, 127, 127, .16);
  font-size: 13px;
}

.vf-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.vf-actions button {
  min-height: 44px;
  border: 1px solid rgba(127, 127, 127, .24);
  border-radius: 13px;
  background: rgba(127, 127, 127, .10);
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.vf-actions button:active {
  transform: scale(.98);
}

.vf-footer {
  margin-top: 15px;
  text-align: center;
  font-size: 10px;
  opacity: .45;
}

@media (max-width: 390px) {
  #vivere-friend-root {
    padding: 10px;
  }

  .vf-card {
    padding: 15px;
    border-radius: 20px;
  }

  .vf-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .vf-actions {
    grid-template-columns: 1fr;
  }
}
'''

base = Path("/mnt/data")
js_path = base / "vivere-friend-ui.js"
css_path = base / "vivere-friend-ui.css"
js_path.write_text(code, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")

print(f"JS: {js_path} ({js_path.stat().st_size} B)")
print(f"CSS: {css_path} ({css_path.stat().st_size} B)")
