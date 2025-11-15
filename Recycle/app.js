document.addEventListener("DOMContentLoaded", () => {
  // --- KOVOŠROT: ROZEBRÁNÍ ŠROTU ---------------------------------

  const scrapInput = document.getElementById("scrap-input");
  const btnGenerate = document.getElementById("btn-generate");
  const lettersBox = document.getElementById("letters-box");
  const digitsBox = document.getElementById("digits-box");
  const symbolsBox = document.getElementById("symbols-box");

  let currentScrap = "";

  function splitScrap() {
    const text = scrapInput.value || "";
    currentScrap = text;

    let letters = "";
    let digits = "";
    let symbols = "";

    for (const ch of text) {
      if (/[A-Za-zÁ-ž]/.test(ch)) {
        letters += ch;
      } else if (/[0-9]/.test(ch)) {
        digits += ch;
      } else if (ch.trim() !== "") {
        symbols += ch;
      }
    }

    lettersBox.textContent = letters;
    digitsBox.textContent = digits;
    symbolsBox.textContent = symbols;
  }

  if (btnGenerate) {
    btnGenerate.addEventListener("click", splitScrap);
  }

  // --- VaF'i'T: DOTAZ NA ŠROT ------------------------------------

  const btnAskVaFit = document.getElementById("btn-ask-vafit");
  const vafitAnswerBox = document.getElementById("vafit-answer");

  async function askVaFitAboutScrap() {
    if (!currentScrap) {
      vafitAnswerBox.textContent =
        "Brácho… nejdřív mi nasypej nějaký šrot do textového pole.";
      return;
    }

    const letters = lettersBox.textContent || "";
    const digits = digitsBox.textContent || "";
    const symbols = symbolsBox.textContent || "";

    const summaryText =
      "Mám digitální šrot pro Vivere atque FruiT. " +
      "Písmenka: " +
      letters.length +
      ", čísla: " +
      digits.length +
      ", speciální znaky: " +
      symbols.length +
      ". Jak bys tenhle materiál použil ve světě?";

    vafitAnswerBox.textContent = "VaF'i'T přemýšlí…";

    try {
      const res = await fetch("/api/vafit-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: summaryText }]
        })
      });

      const data = await res.json();
      vafitAnswerBox.textContent =
        data?.reply || "Brácho… VaF'i'T nic neřekl, zkus to znovu.";
    } catch (err) {
      console.error("VaF'i'T fetch error:", err);
      vafitAnswerBox.textContent =
        "Brácho… spadlo spojení s motorem. Zkus to ještě jednou.";
    }
  }

  if (btnAskVaFit) {
    btnAskVaFit.addEventListener("click", askVaFitAboutScrap);
  }
});
