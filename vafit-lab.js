// vafit-lab.js
// Dílna VaF'i'T – propojení obdélníků 1, 2, 3 (chat ↔ dílna ↔ mapa)

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function getActiveTab() {
    const btn = document.querySelector(".lab-tab.active");
    return btn ? btn.dataset.tab : "code";
  }

  function setActiveTab(name) {
    document.querySelectorAll(".lab-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === name);
    });

    document.querySelectorAll(".lab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === "lab-panel-" + name);
    });
  }

  // vytáhne HTML snippet z odpovědi VaF'i'Ta (z ```html ... ```)
  function extractHtmlSnippet(text) {
    if (!text) return "";
    const codeBlock = text.match(/```html([\s\S]*?)```/i);
    if (codeBlock) {
      return codeBlock[1].trim();
    }
    const anyBlock = text.match(/```([\s\S]*?)```/);
    if (anyBlock) {
      return anyBlock[1].trim();
    }
    return text.trim();
  }

  // hlavní akce dílny
  async function runWorkshop() {
    const mode = getActiveTab();
    const codeInput = $("lab-code");
    const storyInput = $("lab-story");
    const preview = $("lab-preview-output");

    if (!preview) return;

    // ===== REŽIM KÓD =====
    if (mode === "code") {
      const raw = (codeInput.value || "").trim();
      if (!raw) {
        preview.innerHTML =
          '<div class="placeholder">Napiš kód nebo příběh a pak klikni na „Spustit v dílně“.</div>';
        return;
      }

      // uložit kód
      try {
        localStorage.setItem("VaFiT.lab.code", raw);
      } catch {}

      // vykreslit do náhledu
      preview.innerHTML = raw;

      // impuls do logu / mapy
      if (typeof chyboLog === "function") {
        chyboLog(
          "event",
          "Dílna vykreslila objekt podle ručně zadaného kódu."
        );
      }
      if (typeof chyboAddPulse === "function") {
        chyboAddPulse();
      }

      // zapsat shrnutí do chatu, ať se to promítne do orbitu
      if (typeof addMessage === "function") {
        const shortCode = raw.slice(0, 400);
        addMessage(
          "user",
          "[DÍLNA • KÓD]\n" + shortCode + (raw.length > 400 ? "…" : "")
        );
      }

      return;
    }

    // ===== REŽIM PŘÍBĚH -> kód přes VaF'i'T =====
    const story = (storyInput.value || "").trim();
    if (!story) {
      preview.innerHTML =
        '<div class="placeholder">Napiš příběh / zadání, které má VaF\'i\'T převést na kód.</div>';
      return;
    }

    try {
      if (typeof chyboLog === "function") {
        chyboLog(
          "info",
          "Posílám příběh do VaF'i'T motoru, aby z něj vytvořil kód."
        );
      }

      const messages = [
        {
          role: "user",
          content:
            "Jsem v dílně Vivere atque FruiT. Z následujícího příběhu vytvoř krátký HTML kód (max 40 řádků) " +
            "pro jeden prvek/postavu. Nepiš žádné vysvětlení, jen samotný HTML (případně kousek CSS uvnitř <style>):\n\n" +
            story,
        },
      ];

      // používáme globální sendToVaFiT z index.html
      const reply = await sendToVaFiT(messages);
      const snippet = extractHtmlSnippet(reply) || "<p>[žádný kód]</p>";

      // uložit do panelu „Kód“ + localStorage
      if (codeInput) {
        codeInput.value = snippet;
        try {
          localStorage.setItem("VaFiT.lab.code", snippet);
        } catch {}
      }
      try {
        localStorage.setItem("VaFiT.lab.story", story);
      } catch {}

      // vykreslit náhled
      preview.innerHTML = snippet;

      // log + pulz
      if (typeof chyboLog === "function") {
        chyboLog(
          "event",
          "VaF'i'T převedl příběh v dílně na HTML kód a vykreslil ho."
        );
      }
      if (typeof chyboAddPulse === "function") {
        chyboAddPulse();
      }

      // propsat do chatu, ať orbit reaguje
      if (typeof addMessage === "function") {
        const shortStory = story.slice(0, 400);
        const shortSnippet = snippet.slice(0, 400);
        addMessage(
          "user",
          "[DÍLNA • PŘÍBĚH]\n" + shortStory + (story.length > 400 ? "…" : "")
        );
        addMessage(
          "assistant",
          "[VaF'i'T • KÓD Z PŘÍBĚHU]\n```html\n" +
            shortSnippet +
            (snippet.length > 400 ? "…" : "") +
            "\n```"
        );
      }
    } catch (err) {
      console.error("VaFiT-lab run error:", err);
      preview.innerHTML =
        '<div class="placeholder">⚠️ Nepodařilo se získat kód od VaF\'i\'Ta. Zkus to prosím znovu.</div>';

      if (typeof chyboLog === "function") {
        chyboLog(
          "error",
          "Dílna nedostala odpověď od VaF'i'T motoru při převodu příběhu na kód."
        );
      }
    }
  }

  function initLabUI() {
    const tabs = document.querySelectorAll(".lab-tab");
    const runBtn = $("lab-run");
    const codeInput = $("lab-code");
    const storyInput = $("lab-story");
    const preview = $("lab-preview-output");

    if (!runBtn || !preview) return;

    // přepínač Kód / Příběh
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(btn.dataset.tab);
      });
    });

    // načtení uložených hodnot
    try {
      const savedCode = localStorage.getItem("VaFiT.lab.code");
      if (savedCode && codeInput) {
        codeInput.value = savedCode;
        preview.innerHTML = savedCode;
      } else {
        preview.innerHTML =
          '<div class="placeholder">Tady se objeví postava / prvek, který nakóduješ nebo popíšeš výše.</div>';
      }

      const savedStory = localStorage.getItem("VaFiT.lab.story");
      if (savedStory && storyInput) {
        storyInput.value = savedStory;
      }
    } catch {
      preview.innerHTML =
        '<div class="placeholder">Tady se objeví postava / prvek, který nakóduješ nebo popíšeš výše.</div>';
    }

    // tlačítko „Spustit v dílně“
    runBtn.addEventListener("click", runWorkshop);
  }

  document.addEventListener("DOMContentLoaded", initLabUI);
})();
