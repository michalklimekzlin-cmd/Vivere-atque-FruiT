// vafit-lab.js
// Malá dílna: kód + příběh + náhled

const LAB_STORAGE_CODE = "VaFiT.lab.code.v1";
const LAB_STORAGE_STORY = "VaFiT.lab.story.v1";

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

document.addEventListener("DOMContentLoaded", () => {
  const codeInput = document.getElementById("lab-code-input");
  const storyInput = document.getElementById("lab-story-input");
  const preview = document.getElementById("lab-preview");
  const runBtn = document.getElementById("lab-run");
  const sendBtn = document.getElementById("lab-send-to-vafit");

  // záložky
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

  // načtení z localStorage
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

  // Spustit v dílně – jen lokální náhled HTML
  if (runBtn && preview && codeInput) {
    runBtn.addEventListener("click", () => {
      const code = (codeInput.value || "").trim();
      if (!code) {
        preview.innerHTML =
          '<div class="lab-preview-placeholder">Žádný kód… napiš něco do okna Kód.</div>';
        return;
      }
      preview.innerHTML = code;
    });
  }

  // Poslat VaF'i'Tovi jako impuls – připraví prompt do chat inputu
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const story = (storyInput?.value || "").trim();
      const code = (codeInput?.value || "").trim();
      const chatInput = document.getElementById("vafit-input");

      if (!chatInput) return;

      const parts = [];
      if (story) {
        parts.push("PŘÍBĚH / KONCEPT:\n" + story);
      }
      if (code) {
        parts.push("KÓD / NÁVRH:\n```html\n" + code + "\n```");
      }

      chatInput.value =
        (parts.join("\n\n") ||
          "Napiš mi návrh kódu a příběhu pro nový prvek ve světě.") +
        "\n\n(Brácho, jsi Motor světa – pomoz mi tenhle náčrt proměnit v živý modul.)";

      chatInput.focus();
    });
  }
});
