"use strict";

const ids = {
  earth: document.getElementById("life-earth"),
  language: document.getElementById("life-language"),
  game: document.getElementById("life-game"),
  control: document.getElementById("life-control"),
  cht: document.getElementById("life-cht")
};

const lifeMode =
  document.getElementById("lifeMode");

const energyTotal =
  document.getElementById("energyTotal");

function updatePanel() {
  if (!window.CHTLife || !window.CHTEnergy) {
    lifeMode.textContent = "čekání";
    return;
  }

  const life = window.CHTLife.getState();
  const energy = window.CHTEnergy.getState();

  lifeMode.textContent =
    life.state?.mode === "active"
      ? "aktivní"
      : "spánek";

  for (const loopId of Object.keys(ids)) {
    const value =
      life.loops?.[loopId]?.pulses || 0;

    ids[loopId].textContent =
      String(Math.floor(value));
  }

  energyTotal.textContent =
    Number(energy.total || 0).toFixed(1);
}

window.addEventListener(
  "cht.life.pulse",
  updatePanel
);

window.addEventListener(
  "cht.energy.changed",
  updatePanel
);

window.addEventListener(
  "cht.life.started",
  updatePanel
);

document.addEventListener(
  "visibilitychange",
  updatePanel
);

setInterval(updatePanel, 2000);

updatePanel();