// vafit-lab.js
// VaF'i'T Dílna – kód + příběh + náhled + impuls do motoru

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
  // ID podle současného indexu
  const codeInput = document.getElementById("lab-code");
  const storyInput = document.getElementById("lab-story");
  const preview = document.getElementById("lab-preview-output");
  const runBtn = document.getElementById("lab-run");

  const tabs = document.querySelectorAll(".lab-tab");
  const panels = {
    code: document.getElementById("lab-panel-code"),
    story: document.getElementById("lab-panel-story"),
  };

  // přepínání Kód / Příběh
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

  // helper: vykreslení do náhledu (držet v rámečku)
  function renderPreview(code) {
    if (!preview) return;
    const trimmed = (code || "").trim();

    if (!trimmed) {
      preview.innerHTML =
        '<div class="placeholder">Tady se objeví postava / prvek, který nakóduješ nebo popíšeš výše.</div>';
      return;
    }

    // vše obalíme, ať se to drží uvnitř boxu
    preview.innerHTML =
      '<div class="lab-preview-inner">' + trimmed + "</div>";
  }

  // oranžové tlačítko – lokální náhled + impuls do VaF'i'Ta
  if (runBtn) {
    runBtn.addEventListener("click", () => {
      const code = (codeInput?.value || "").trim();
      const story = (storyInput?.value || "").trim();

      // 1) náhled
      renderPreview(code);

      // 2) připravit text do hlavního inputu VaF'i'Ta
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
        "\n\n(Brácho, jsi Motor světa – vezmi tenhle náčrt z dílny, udělej z něj lepší návrh a vrať mi hotový kód, který sedne do náhledového okna dílny.)";

      chatInput.focus();
    });
  }
});
