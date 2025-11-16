// vafit-lab.js
// VaF'i'T dílna: kód + příběh + náhled + impuls do chatu

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
  const codeInput = document.getElementById("lab-code");
  const storyInput = document.getElementById("lab-story");
  const preview = document.getElementById("lab-preview-output");
  const runBtn = document.getElementById("lab-run");

  // --- přepínání záložek KÓD / PŘÍBĚH ---
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

  // --- načtení z localStorage ---
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

  // --- vykreslení do okénka Náhled dílny ---
  function renderPreviewFromCode() {
    if (!preview || !codeInput) return;

    const code = (codeInput.value || "").trim();
    if (!code) {
      preview.innerHTML =
        '<div class="placeholder">Tady se objeví postava / prvek, který nakóduješ nebo popíšeš výše.</div>';
      return;
    }

    // sandbox do středu boxu
    const wrapped = `
      <div class="lab-preview-inner">
        ${code}
      </div>
    `;
    preview.innerHTML = wrapped;
  }

  // --- připravit impuls pro centrální VaF'i'T (chat input) ---
  function fillChatFromLab() {
    const chatInput = document.getElementById("vafit-input");
    if (!chatInput) return;

    const story = (storyInput?.value || "").trim();
    const code = (codeInput?.value || "").trim();

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
  }

  // --- tlačítko: Spustit v dílně + poslat impuls ---
  if (runBtn) {
    runBtn.addEventListener("click", () => {
      renderPreviewFromCode();
      fillChatFromLab();

      // pokud existuje chybožrout, pošleme mu zprávu
      if (typeof window.chyboLog === "function") {
        window.chyboLog(
          "event",
          "Dílna spustila náhled a poslala kód jako impuls do VaF'i'T."
        );
      }
    });
  }

  // po načtení stránky rovnou zkus vykreslit poslední kód
  renderPreviewFromCode();
});
