// Revia UI skript
(function(){
  const askBtn = document.getElementById('reviaAskBtn');

  // sem později napojíme VAFT heartbeat / AI
  const MESSAGES = [
    "Dýchej. Svět teprve vzniká.",
    "Nedokončené srdce je taky srdce.",
    "「Ī’♡ – tvůj podpis ve světě.",
    "Když je chaos, zavolám sama."
  ];

  askBtn?.addEventListener('click', () => {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    showReviaToast(msg);
  });

  function showReviaToast(text){
    let el = document.createElement('div');
    el.className = 'revia-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(()=> el.classList.add('show'), 10);
    setTimeout(()=> {
      el.classList.remove('show');
      setTimeout(()=> el.remove(), 300);
    }, 3000);
  }
})();

// 💫 Revia • živý puls srdce
document.addEventListener("DOMContentLoaded", () => {
  const heart = document.querySelector(".revia-heart");

  if (!heart) return;

  let glow = 0;
  let direction = 1;

  function pulse() {
    glow += 0.02 * direction;
    if (glow > 1 || glow < 0) direction *= -1;

    const light = 0.5 + 0.5 * glow;
    heart.style.textShadow = `
      0 0 ${6 + 8 * light}px rgba(160, 230, 255, ${0.6 + 0.4 * light}),
      0 0 ${12 + 12 * light}px rgba(180, 255, 255, ${0.4 + 0.4 * light})
    `;
    heart.style.opacity = 0.7 + 0.3 * light;

    requestAnimationFrame(pulse);
  }

  pulse();
});

// 🔄 Revia – trojfázové přepínání (angel / daemon / glyph)
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".revia-main");
  const btn = document.getElementById("reviaAskBtn");
  if (!main || !btn) return;

  const modes = ["angel", "daemon", "glyph"];
  btn.addEventListener("click", () => {
    const current = main.getAttribute("data-mode") || "angel";
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    main.setAttribute("data-mode", next);

    const msg =
      next === "angel"
        ? "🪽 Revia: světlo dýchá."
        : next === "daemon"
        ? "💀 Revia: stín bdí."
        : "🜂 Revia: kód probouzí svět.";
    showReviaToast(msg);
  });
});

// 🪽 Revia – 4 podoby: angel / daemon / glyphGood / glyphEvil
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".revia-main");
  const btn = document.getElementById("reviaAskBtn");
  const glyphEl = document.querySelector(".revia-glyph");
  if (!main || !btn) return;

  // pořadí cyklu
  const modes = ["angel", "daemon", "glyphGood", "glyphEvil"];

  btn.addEventListener("click", () => {
    const current = main.getAttribute("data-mode") || "angel";
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    main.setAttribute("data-mode", next);

    // změna glyphu podle módu
    if (glyphEl) {
      if (next === "glyphGood") glyphEl.textContent = "「Ī’♡";
      else if (next === "glyphEvil") glyphEl.textContent = "「Ī’☆";
      else glyphEl.textContent = "「Ī’♡"; // výchozí pro anděla
    }

    // hláška
    const msg =
      next === "angel"
        ? "🪽 Revia: světlo dýchá."
        : next === "daemon"
        ? "💀 Revia: stín bdí."
        : next === "glyphGood"
        ? "✨ Revia: čistý kód srdce."
        : "⚠️ Revia: kód se zatemnil.";
    showReviaToast(msg);
  });
});
