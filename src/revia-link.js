// 🔗 Vivere atque FruiT ↔ Revia propojení
(function() {
  const reviaState = {
    mode: "angel", // nebo "daemon"
    glyphs: {
      angel: "「Ī’♡",
      daemon: "「Ī’☆"
    },
    slots: [
      { id: "glyph1", active: true },
      { id: "glyph2", active: true },
      { id: "glyph3", active: false },
      { id: "glyph4", active: false }
    ]
  };

  // ⏳ načti data ze Storage (později multiplayer sync)
  const saved = localStorage.getItem("reviaState");
  if (saved) Object.assign(reviaState, JSON.parse(saved));

  // 🌗 přepínání mezi andělským a démonickým módem
  window.toggleRevia = function() {
    reviaState.mode = reviaState.mode === "angel" ? "daemon" : "angel";
    localStorage.setItem("reviaState", JSON.stringify(reviaState));
    updateGlyphDisplay();
  };

  // 🎨 aktualizace glyphů a pozadí
  function updateGlyphDisplay() {
    const glyphBox = document.getElementById("revia-glyph");
    const bg = document.body;
    const current = reviaState.mode;
    if (glyphBox) glyphBox.textContent = reviaState.glyphs[current];
    bg.style.backgroundImage = `url('Revia/assets/revia-bg-${current}.jpg')`;
  }

  document.addEventListener("DOMContentLoaded", updateGlyphDisplay);
})();
