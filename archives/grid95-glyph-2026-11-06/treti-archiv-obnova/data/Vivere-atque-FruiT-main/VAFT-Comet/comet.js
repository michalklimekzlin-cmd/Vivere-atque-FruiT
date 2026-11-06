// jednoduchá lokální „databáze“ z webu
const COMETS = {
  lemmon: {
    name: "C/2025 A6 (Lemmon)",
    mag: "≈ 4–5",
    note: "zjasňuje, severní obloha – APOD 30.9.2025",
    pos: "souhvězdí Hadonoše / severní ráno" // zjednodušeno z mapy  [oai_citation:5‡theskylive.com](https://theskylive.com/c2025a6-info?utm_source=chatgpt.com)
  },
  atlas: {
    name: "C/2025 K1 (ATLAS)",
    mag: "≈ 9–10",
    note: "pozorovaná v souhvězdí Lva 9.11.2025",
    pos: "souhvězdí Lev" //  [oai_citation:6‡theskylive.com](https://theskylive.com/comets?utm_source=chatgpt.com)
  },
  swan: {
    name: "C/2025 R2 (SWAN)",
    mag: "≈ 8–9",
    note: "současná kometa roku 2025 – SWAN",
    pos: "pozice podle aktuálních efemerid"
  }
};

const listEls = document.querySelectorAll('.list li');
const posEl = document.getElementById('comet-pos');
const magEl = document.getElementById('comet-mag');

listEls.forEach(li => {
  li.addEventListener('click', () => {
    listEls.forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    const key = li.dataset.comet;
    const c = COMETS[key];
    if (!c) return;
    posEl.textContent = c.pos;
    magEl.textContent = c.mag;
    document.querySelector('.title').textContent = c.name;
  });
});

// default
posEl.textContent = COMETS.lemmon.pos;

// odeslání do VAFTu (pokud máš vaft-core)
const btn = document.getElementById('send-to-vaft');
btn.addEventListener('click', () => {
  if (window.VAFT && VAFT.world && typeof VAFT.world.spawn === "function") {
    const active = document.querySelector('.list li.active').dataset.comet;
    const data = COMETS[active];
    VAFT.world.spawn({
      type: "comet",
      id: active,
      name: data.name,
      mag: data.mag,
      note: data.note
    });
    alert("Kometa poslaná do světa 🎉");
  } else {
    alert("VAFT world není načtený, ale data máš v COMETS{}.");
  }
});
