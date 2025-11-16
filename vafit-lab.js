// vafit-lab.js
// VaF'i'T dílna: kód + příběh + náhled v rámečku

const LAB_STORAGE_CODE = "VaFiT.lab.code.v2";
const LAB_STORAGE_STORY = "VaFiT.lab.story.v2";

function labLoad(key, fallback = "") {
  try {
    const raw = localStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function labSave(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

// drobný helper – očistí HTML kód od věcí, co ničí celou stránku
function cleanHtmlSnippet(code) {
  if (!code) return "";

  return code
    // odstraníme DOCTYPE
    .replace(/<!doctype[^>]*>/gi, "")
    // odstraníme html/head/body
    .replace(/<\/?(html|head|body)[^>]*>/gi, "")
    // odstraníme <style> bloky (globální CSS by rozhazovalo layout)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .trim();
}

// vykreslení náhledu do rámečku
function renderLabPreview(rawCode) {
  const preview = document.getElementById("lab-preview-output");
  if (!preview) return;

  const code = cleanHtmlSnippet(rawCode);

  if (!code) {
    preview.innerHTML =
      '<div class="placeholder">Žádný kód… napiš něco do okna Kód nebo Příběh.</div>';
    return;
  }

  preview.innerHTML = "";
  const frame = document.createElement("div");
  frame.className = "lab-preview-frame";
  frame.innerHTML = code;
  preview.appendChild(frame);
}

// pokus o logování do Chybožrouta (je globální funkce v indexu)
function labLog(kind, message) {
  try {
    if (typeof chyboLog === "function") {
      chyboLog(kind, message);
    }
  } catch {
    // ticho, když chyboLog není
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const codeInput = document.getElementById("lab-code");
  const storyInput = document.getElementById("lab-story");
  const runBtn = document.getElementById("lab-run");

  // záložky Kód / Příběh
  const tabs = document.querySelectorAll(".lab-tab");
  const panels = {
    code: document.getElementById("lab-panel-code"),
    story: document.getElementById("lab-panel-story"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("active"));
      Object.values(panels).forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      panels[name]?.classList.add("active");
    });
  });

  // načtení posledních návrhů
  if (codeInput) codeInput.value = labLoad(LAB_STORAGE_CODE, "");
  if (storyInput) storyInput.value = labLoad(LAB_STORAGE_STORY, "");

  // auto-uložení
  if (codeInput) {
    codeInput.addEventListener("input", () => {
      labSave(LAB_STORAGE_CODE, codeInput.value);
    });
  }
  if (storyInput) {
    storyInput.addEventListener("input", () => {
      labSave(LAB_STORAGE_STORY, storyInput.value);
    });
  }

  // hlavní akce dílny
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      const code = (codeInput?.value || "").trim();
      const story = (storyInput?.value || "").trim();
      const chatInput = document.getElementById("vafit-input");

      // nic nezadáno
      if (!code && !story) {
        renderLabPreview("");
        return;
      }

      // 1) Máme ruční KÓD → jen vykreslit + poslat jako impuls do chatu
      if (code) {
        renderLabPreview(code);
        labLog("event", "Dílna vykreslila náhled z ručně zadaného kódu.");

        if (chatInput) {
          chatInput.value =
            "KÓD / NÁVRH do dílny:\n```html\n" +
            code +
            "\n```\n\n(Brácho, ukážu ti, jak tenhle prvek vypadá v dílně.)";
        }

        return;
      }

      // 2) Máme jen PŘÍBĚH → pošleme ho do /api/vafit-chat s vlastním promptem
      if (story) {
        try {
          labLog("info", "Posílám příběh z dílny do AI jádra…");

          const messages = [
            {
              role: "system",
              content:
                "Jsi VaF'i'T dílna. Z PŘÍBĚHU vygeneruj JEN MALÝ HTML SNIPPET " +
                "(1 postava / prvek) s případným inline CSS nebo krátkým <style> " +
                "ALE BEZ tagů <html>, <head>, <body>. " +
                "Prvek má sedět do malého rámečku 200x200px, nic přes celou stránku.",
            },
            {
              role: "user",
              content: story,
            },
          ];

          const res = await fetch("/api/vafit-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages, mode: "lab" }),
          });

          if (!res.ok) {
            labLog(
              "error",
              "Backend pro dílnu odpověděl kódem " +
                res.status +
                " – zkus jiný příběh nebo to po chvíli zopakuj."
            );
            renderLabPreview(
              `<div class="placeholder">⚠️ AI dílna teď neodpověděla (kód ${
                res.status
              }).</div>`
            );
            return;
          }

          const data = await res.json();
          const reply =
            data.html || data.code || data.reply || data.content || "";

          if (!reply) {
            labLog(
              "error",
              "Backend odpověděl bez HTML kódu – možná špatný formát odpovědi."
            );
            renderLabPreview(
              '<div class="placeholder">⚠️ Nepřišel žádný HTML kód z AI dílny.</div>'
            );
            return;
          }

          // uložíme kód do textarey, ať si ho můžeš upravit
          if (codeInput) {
            codeInput.value = reply;
            labSave(LAB_STORAGE_CODE, reply);
          }

          renderLabPreview(reply);
          labLog(
            "event",
            "VaF'i'T převedl příběh v dílně na HTML kód a vykreslil ho."
          );

          if (chatInput) {
            chatInput.value =
              "PŘÍBĚH → KÓD v dílně:\n\nPŘÍBĚH:\n" +
              story +
              "\n\nHTML KÓD:\n```html\n" +
              reply +
              "\n```";
          }
        } catch (err) {
          console.error("LAB ERROR:", err);
          labLog(
            "error",
            "Nepodařilo se kontaktovat backend pro dílnu (/api/vafit-chat)."
          );
          renderLabPreview(
            '<div class="placeholder">⚠️ Chyba spojení s AI dílnou.</div>'
          );
        }
      }
    });
  }
});
