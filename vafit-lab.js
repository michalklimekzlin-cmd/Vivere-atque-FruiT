// ==========================================
//  VaF'i'T • DÍLNA (kód + příběh)
// ==========================================

// přepínání panelů KÓD / PŘÍBĚH
document.querySelectorAll(".lab-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".lab-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;

    document.getElementById("lab-panel-code").classList.toggle(
      "active",
      tab === "code"
    );
    document.getElementById("lab-panel-story").classList.toggle(
      "active",
      tab === "story"
    );
  });
});

// tlačítko „Spustit v dílně / poslat impuls“
document.getElementById("lab-run").addEventListener("click", () => {
  const code = document.getElementById("lab-code").value.trim();
  const story = document.getElementById("lab-story").value.trim();
  const out = document.getElementById("lab-preview-output");

  // 1) vykreslení náhledu (kód)
  if (code) {
    out.innerHTML = `<div class="workshop-preview-content">${code}</div>`;
    chyboLog("event", "Dílna vykreslila nový objekt podle kódu.");
  }

  // 2) vytvoření textového impulsu do chatu (příběh)
  if (story) {
    addMessage("user", "📝 Příběhový impuls: " + story);
    chyboLog("event", "Do motoru byl odeslán příběhový impuls.");
  }

  if (!code && !story) {
    chyboLog("info", "Dílna nedostala žádný vstup.");
  }

  // refresh mapy impulsů
  rebuildWorkshopFromChat();
});
