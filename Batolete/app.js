/*
  Batolete – app.js
  8 základních her: Abeceda, Čísla, Barvy, Tvary, Zvířátka, Příběhy, Pohyb, Galerie
  Reward systém (hvězdičky) + audio feedback (Web Audio API)
*/

"use strict";

/* ── REWARD SYSTEM ── */
const Reward = (() => {
  const KEY = "batolete_stars_v1";
  let count = parseInt(localStorage.getItem(KEY) || "0", 10);

  function save() {
    localStorage.setItem(KEY, String(count));
    document.getElementById("starCount").textContent = count;
  }

  function add(n = 1) {
    count += n;
    save();
    playSound("reward");
    Hub.showToast("⭐ +" + n + " hvězdička!");
  }

  function get() { return count; }

  save(); // init display
  return { add, get };
})();

/* ── AUDIO (Web Audio API) ── */
const Audio$ = (() => {
  let ctx = null;

  function ctx$() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, dur = 0.15, type = "sine", vol = 0.3) {
    try {
      const c = ctx$();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.frequency.value = freq;
      o.type = type;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(c.currentTime);
      o.stop(c.currentTime + dur);
    } catch (_) { /* silent */ }
  }

  return {
    reward() { tone(660, 0.12); setTimeout(() => tone(880, 0.15), 120); },
    correct() { tone(523, 0.1); setTimeout(() => tone(659, 0.12), 100); },
    wrong()   { tone(220, 0.2, "sawtooth", 0.2); },
    tap()     { tone(440, 0.08, "square", 0.15); }
  };
})();

function playSound(name) { Audio$[name] && Audio$[name](); }

/* ── HUB CONTROLLER ── */
const Hub = (() => {
  const hubMain   = document.getElementById("hubMain");
  const gameScreen= document.getElementById("gameScreen");
  const gameContent = document.getElementById("gameContent");
  const backBtn   = document.getElementById("backBtn");
  const toast     = document.getElementById("hubToast");
  let toastTimer  = null;

  function openGame(name) {
    const def = GAMES[name];
    if (!def) return;
    gameContent.innerHTML = "";
    def.render(gameContent);
    gameScreen.hidden = false;
    gameScreen.removeAttribute("aria-hidden");
    hubMain.hidden = true;
    document.title = def.title + " – Batolete";
    backBtn.focus();
  }

  function closeGame() {
    gameScreen.hidden = true;
    gameScreen.setAttribute("aria-hidden", "true");
    hubMain.hidden = false;
    document.title = "🌟 Batolete – Centrální Hub";
    gameContent.innerHTML = "";
  }

  function showToast(msg, dur = 2200) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), dur);
  }

  // Wire hub card clicks (games only – mini-apps handled by hub-loader.js)
  document.querySelectorAll(".hub-card[data-game]").forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("tap");
      openGame(btn.dataset.game);
    });
  });

  backBtn.addEventListener("click", closeGame);

  return { openGame, closeGame, showToast };
})();

/* ═══════════════════════════════════════════════════════
   GAMES REGISTRY
═══════════════════════════════════════════════════════ */
const GAMES = {};

/* ── HELPERS ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gameHeader(title, score) {
  return `<div class="game-header"><span class="game-title">${title}</span><span class="game-score">⭐ ${score}</span></div>`;
}

/* ── 1. ABECEDA ── */
GAMES.abeceda = {
  title: "🔤 Abeceda",
  render(container) {
    const letters = "ABCDEFGHIJKLMNOPRSTUVZ".split("");
    const words = {
      A:"Auto",B:"Babička",C:"Cesta",D:"Dům",E:"Elf",F:"Fena",
      G:"Glyph",H:"Hora",I:"Iskra",J:"Jablko",K:"Kůň",L:"Louka",
      M:"Medvěd",N:"Nebe",O:"Obloha",P:"Pes",R:"Ryba",S:"Slunce",
      T:"Táta",U:"Ucho",V:"Vlak",Z:"Zahrada"
    };
    let score = 0;
    let current = null;

    function render() {
      current = shuffle(letters)[0];
      container.innerHTML = gameHeader("🔤 Abeceda", score) + `
        <div class="game-body">
          <div style="font-size:6rem;font-weight:900;color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,.5)">${current}</div>
          <div style="font-size:1.5rem;color:#ccc;">${words[current] || ""}</div>
          <div class="answer-grid" id="letterGrid"></div>
        </div>`;
      const options = shuffle([current, ...shuffle(letters.filter(l => l !== current)).slice(0,3)]);
      const grid = container.querySelector("#letterGrid");
      options.forEach(l => {
        const btn = document.createElement("button");
        btn.className = "btn-big btn-info";
        btn.textContent = l;
        btn.addEventListener("click", () => {
          if (l === current) {
            playSound("correct");
            score++;
            Reward.add(1);
            btn.style.background = "#4caf50";
            setTimeout(render, 700);
          } else {
            playSound("wrong");
            btn.style.background = "#e94560";
            setTimeout(() => btn.style.background = "", 400);
          }
        });
        grid.appendChild(btn);
      });
    }

    render();
  }
};

/* ── 2. ČÍSLA ── */
GAMES.cisla = {
  title: "🔢 Čísla",
  render(container) {
    let score = 0;
    let num = 0;

    function render() {
      num = Math.floor(Math.random() * 10) + 1;
      const dots = "●".repeat(num);
      const options = shuffle([num, ...new Set([
        Math.max(1, num - 2), Math.max(1, num - 1),
        Math.min(10, num + 1), Math.min(10, num + 2)
      ].filter(n => n !== num))].slice(0, 3)).concat([num]);
      const shuffled = shuffle([...new Set([num, ...options.slice(0,3)])].slice(0,4));

      container.innerHTML = gameHeader("🔢 Čísla", score) + `
        <div class="game-body">
          <div style="font-size:2.5rem;letter-spacing:.15em;color:#7fffd4;word-break:break-all;text-align:center;max-width:220px">${dots}</div>
          <div style="font-size:1.1rem;color:#aaa;margin-top:-.5rem">Kolik je tečiček?</div>
          <div class="answer-grid" id="numGrid"></div>
        </div>`;
      const grid = container.querySelector("#numGrid");
      shuffled.forEach(n => {
        const btn = document.createElement("button");
        btn.className = "btn-big btn-info";
        btn.style.fontSize = "1.8rem";
        btn.textContent = n;
        btn.addEventListener("click", () => {
          if (n === num) {
            playSound("correct");
            score++;
            Reward.add(1);
            btn.style.background = "#4caf50";
            setTimeout(render, 700);
          } else {
            playSound("wrong");
            btn.style.background = "#e94560";
            setTimeout(() => btn.style.background = "", 400);
          }
        });
        grid.appendChild(btn);
      });
    }

    render();
  }
};

/* ── 3. BARVY ── */
GAMES.barvy = {
  title: "🎨 Barvy",
  render(container) {
    const colors = [
      { name: "Červená", hex: "#e94560" },
      { name: "Modrá",   hex: "#2196f3" },
      { name: "Zelená",  hex: "#4caf50" },
      { name: "Žlutá",   hex: "#ffd700" },
      { name: "Fialová", hex: "#9c27b0" },
      { name: "Oranžová",hex: "#ff9800" },
      { name: "Růžová",  hex: "#e91e8c" },
      { name: "Tyrkysová",hex:"#00bcd4" },
      { name: "Hnědá",   hex: "#795548" },
      { name: "Bílá",    hex: "#f0f0f0" }
    ];
    let score = 0;
    let target = null;

    function render() {
      target = shuffle(colors)[0];
      const options = shuffle([target, ...shuffle(colors.filter(c => c.name !== target.name)).slice(0,3)]);
      container.innerHTML = gameHeader("🎨 Barvy", score) + `
        <div class="game-body">
          <div style="width:160px;height:160px;border-radius:50%;background:${target.hex};box-shadow:0 0 30px ${target.hex}88"></div>
          <div style="font-size:1.1rem;color:#aaa">Jaká je tato barva?</div>
          <div class="answer-grid" id="colorGrid"></div>
        </div>`;
      const grid = container.querySelector("#colorGrid");
      options.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "btn-big";
        btn.style.cssText = `background:${c.hex};color:${c.hex === "#f0f0f0" ? "#222" : "#fff"};font-size:1rem`;
        btn.textContent = c.name;
        btn.addEventListener("click", () => {
          if (c.name === target.name) {
            playSound("correct");
            score++;
            Reward.add(1);
            setTimeout(render, 700);
          } else {
            playSound("wrong");
            btn.style.opacity = "0.4";
            setTimeout(() => btn.style.opacity = "", 400);
          }
        });
        grid.appendChild(btn);
      });
    }

    render();
  }
};

/* ── 4. TVARY ── */
GAMES.tvary = {
  title: "🔵 Tvary",
  render(container) {
    const shapes = [
      { name: "Kruh",       draw: ctx => { ctx.arc(100,100,70,0,Math.PI*2); } },
      { name: "Čtverec",    draw: ctx => { ctx.rect(30,30,140,140); } },
      { name: "Trojúhelník",draw: ctx => { ctx.moveTo(100,20); ctx.lineTo(180,180); ctx.lineTo(20,180); ctx.closePath(); } },
      { name: "Hvězda",     draw: ctx => {
        const r1=80, r2=35, c=100;
        for (let i=0;i<10;i++){
          const a=(Math.PI/5)*i - Math.PI/2;
          const r=i%2===0?r1:r2;
          i===0 ? ctx.moveTo(c+r*Math.cos(a),c+r*Math.sin(a))
                : ctx.lineTo(c+r*Math.cos(a),c+r*Math.sin(a));
        }
        ctx.closePath();
      }},
      { name: "Obdélník",   draw: ctx => { ctx.rect(20,50,160,100); } },
      { name: "Ovál",       draw: ctx => { ctx.ellipse(100,100,90,55,0,0,Math.PI*2); } }
    ];
    let score = 0;
    let target = null;

    function render() {
      target = shuffle(shapes)[0];
      const options = shuffle([target, ...shuffle(shapes.filter(s => s.name !== target.name)).slice(0,3)]);
      container.innerHTML = gameHeader("🔵 Tvary", score) + `
        <div class="game-body">
          <canvas id="shapeCanvas" width="200" height="200" style="border-radius:1rem;background:#0f3460"></canvas>
          <div style="font-size:1.1rem;color:#aaa">Jak se jmenuje tento tvar?</div>
          <div class="answer-grid" id="shapeGrid"></div>
        </div>`;
      const canvas = container.querySelector("#shapeCanvas");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#7fffd4";
      ctx.beginPath();
      target.draw(ctx);
      ctx.fill();
      const grid = container.querySelector("#shapeGrid");
      options.forEach(s => {
        const btn = document.createElement("button");
        btn.className = "btn-big btn-info";
        btn.textContent = s.name;
        btn.addEventListener("click", () => {
          if (s.name === target.name) {
            playSound("correct");
            score++;
            Reward.add(1);
            btn.style.background = "#4caf50";
            setTimeout(render, 700);
          } else {
            playSound("wrong");
            btn.style.background = "#e94560";
            setTimeout(() => btn.style.background = "", 400);
          }
        });
        grid.appendChild(btn);
      });
    }

    render();
  }
};

/* ── 5. ZVÍŘÁTKA ── */
GAMES.zviratka = {
  title: "🐾 Zvířátka",
  render(container) {
    const animals = [
      { name:"Pes",       emoji:"🐕", sound:"Haf haf!" },
      { name:"Kočka",     emoji:"🐈", sound:"Mňau!" },
      { name:"Kráva",     emoji:"🐄", sound:"Mů!" },
      { name:"Koň",       emoji:"🐴", sound:"Hihihi!" },
      { name:"Ovce",      emoji:"🐑", sound:"Bé!" },
      { name:"Prase",     emoji:"🐷", sound:"Chro chro!" },
      { name:"Slepice",   emoji:"🐔", sound:"Ko ko!" },
      { name:"Kachna",    emoji:"🦆", sound:"Quak!" },
      { name:"Medvěd",    emoji:"🐻", sound:"Rrr!" },
      { name:"Liška",     emoji:"🦊", sound:"Haf haf!" },
      { name:"Vlk",       emoji:"🐺", sound:"Vůůů!" },
      { name:"Slon",      emoji:"🐘", sound:"Trúúú!" },
      { name:"Lev",       emoji:"🦁", sound:"Řvů!" },
      { name:"Tygr",      emoji:"🐯", sound:"Grrr!" },
      { name:"Žirafa",    emoji:"🦒", sound:"Šššš!" },
      { name:"Opice",     emoji:"🐒", sound:"Ú ú ú!" },
      { name:"Žába",      emoji:"🐸", sound:"Kvak kvak!" },
      { name:"Pták",      emoji:"🐦", sound:"Číp číp!" },
      { name:"Ryba",      emoji:"🐟", sound:"Blub blub!" },
      { name:"Motýl",     emoji:"🦋", sound:"..." }
    ];
    let score = 0;
    let target = null;

    function render() {
      target = shuffle(animals)[0];
      const options = shuffle([target, ...shuffle(animals.filter(a => a.name !== target.name)).slice(0,3)]);
      container.innerHTML = gameHeader("🐾 Zvířátka", score) + `
        <div class="game-body">
          <div style="font-size:7rem;line-height:1">${target.emoji}</div>
          <div style="font-size:1.3rem;color:#ffd700;font-weight:700">${target.sound}</div>
          <div style="font-size:1rem;color:#aaa">Jaké je to zvíře?</div>
          <div class="answer-grid" id="animalGrid"></div>
        </div>`;
      const grid = container.querySelector("#animalGrid");
      options.forEach(a => {
        const btn = document.createElement("button");
        btn.className = "btn-big btn-info";
        btn.innerHTML = `${a.emoji} ${a.name}`;
        btn.style.fontSize = "1rem";
        btn.addEventListener("click", () => {
          if (a.name === target.name) {
            playSound("correct");
            score++;
            Reward.add(1);
            btn.style.background = "#4caf50";
            setTimeout(render, 800);
          } else {
            playSound("wrong");
            btn.style.background = "#e94560";
            setTimeout(() => btn.style.background = "", 400);
          }
        });
        grid.appendChild(btn);
      });
    }

    render();
  }
};

/* ── 6. PŘÍBĚHY ── */
GAMES.pribehy = {
  title: "📖 Příběhy",
  render(container) {
    const stories = [
      {
        title: "Iskroň a hvězdičky",
        emoji: "🌟",
        pages: [
          "Byl jednou jeden malý drak jménem Iskroň. Žil v modré hoře a snil o hvězdičkách.",
          "Každou noc létával vysoko, kde hvězdičky tancovaly. Chytil jednu do drápků.",
          "Hvězdička řekla: „Přines mi ranní rosu a budeš mít přítele navždy!"",
          "Iskroň přinesl rosu. Od té doby hvězdičky svítily jenom pro něj. 🌟"
        ]
      },
      {
        title: "Malý Glyph",
        emoji: "✨",
        pages: [
          "V zemi symbolů žil malý Glyph. Byl jiný než ostatní – měl tvar hvězdičky.",
          "Ostatní glyphi mu říkali: „Jsi moc zvláštní!" Ale Glyph se neurazil.",
          "Jednoho dne přišel velký déšť. Hvězdičkový Glyph záříl a ukazoval cestu domů.",
          "„Každý symbol je důležitý," řekla moudrá Abeceda. „I ty, malý Glyph!" ✨"
        ]
      },
      {
        title: "Bičák a pohyb",
        emoji: "🏃",
        pages: [
          "Bičák byl nejrychlejší chlapec v celé vesnici. Miloval běhání a skákání.",
          "Jednoho rána Bičák zjistil, že ztratil svůj červený míč.",
          "Běžel přes les, přes louku, přes řeku – a tam u studny uviděl míč.",
          "„Pohyb je radost!" zvolal Bičák. „Kdybych nespadl, nikdy bych ho nenašel!" 🏃"
        ]
      },
      {
        title: "Pikoš hledá domov",
        emoji: "🏠",
        pages: [
          "Malý Pikoš byl kulička světla. Cestoval od okna k oknu a hledal teplo.",
          "V první domácnosti bylo příliš hlasitě. V druhé příliš tmavě.",
          "V třetím domku seděla rodina u stolu a smála se spolu.",
          "Pikoš vlétl dovnitř a zůstal. Domov je tam, kde se lidé mají rádi. 🏠"
        ]
      }
    ];

    let storyIdx = 0;
    let pageIdx = 0;

    function render() {
      const story = stories[storyIdx % stories.length];
      const page = story.pages[pageIdx];
      const isLast = pageIdx === story.pages.length - 1;
      container.innerHTML = gameHeader("📖 " + story.title, storyIdx) + `
        <div class="game-body">
          <div style="font-size:4rem">${story.emoji}</div>
          <div style="max-width:420px;font-size:1.15rem;line-height:1.7;text-align:center;color:#e0e0e0;padding:0 0.5rem">${page}</div>
          <div style="display:flex;gap:1rem">
            ${pageIdx > 0 ? '<button class="btn-big btn-info" id="prevPage">← Zpět</button>' : ""}
            <button class="btn-big ${isLast ? "btn-success" : "btn-primary"}" id="nextPage">
              ${isLast ? "Další příběh 🎉" : "Dál →"}
            </button>
          </div>
          <div style="font-size:0.85rem;color:#666">${pageIdx + 1} / ${story.pages.length}</div>
        </div>`;
      container.querySelector("#nextPage").addEventListener("click", () => {
        playSound("tap");
        if (isLast) {
          Reward.add(2);
          storyIdx++;
          pageIdx = 0;
        } else {
          pageIdx++;
        }
        render();
      });
      const prev = container.querySelector("#prevPage");
      if (prev) prev.addEventListener("click", () => { playSound("tap"); pageIdx--; render(); });
    }

    render();
  }
};

/* ── 7. POHYB ── */
GAMES.pohyb = {
  title: "🏃 Pohyb",
  render(container) {
    const moves = [
      { name:"Poskakuj!",     emoji:"🦘", desc:"Poskoč 5× na místě!", count:5 },
      { name:"Tleskej!",      emoji:"👏", desc:"Tleskni 3× rukama!", count:3 },
      { name:"Krouž rukama!", emoji:"🔄", desc:"2× krouž oběma rukama!", count:2 },
      { name:"Dřep!",         emoji:"🏋️", desc:"Udělej 3 dřepy!", count:3 },
      { name:"Otočení!",      emoji:"🔃", desc:"1× se otoč dokola!", count:1 },
      { name:"Hvězda!",       emoji:"⭐", desc:"Roztáhni ruce i nohy – udělej hvězdu!", count:1 },
      { name:"Vlnění!",       emoji:"🌊", desc:"Pohybuj rukama jako vlny 5×!", count:5 },
      { name:"Dech!",         emoji:"🌬️", desc:"3× se zhluboka nadechni!", count:3 }
    ];
    let score = 0;
    let current = null;

    function render() {
      current = shuffle(moves)[0];
      container.innerHTML = gameHeader("🏃 Pohyb", score) + `
        <div class="game-body" style="text-align:center">
          <div style="font-size:6rem">${current.emoji}</div>
          <div style="font-size:1.8rem;font-weight:900;color:#ffd700">${current.name}</div>
          <div style="font-size:1.2rem;color:#ccc;max-width:300px">${current.desc}</div>
          <button class="btn-big btn-success" id="doneBtn" style="margin-top:1rem">✅ Hotovo!</button>
        </div>`;
      container.querySelector("#doneBtn").addEventListener("click", () => {
        playSound("correct");
        score++;
        Reward.add(1);
        Hub.showToast("🎉 Skvěle! Pohyb je zdraví!");
        render();
      });
    }

    render();
  }
};

/* ── 8. GALERIE SVĚTŮ ── */
GAMES.galerie = {
  title: "🌍 Galerie světů",
  render(container) {
    const worlds = [
      {
        name: "Revia",
        emoji: "✨",
        desc: "Svět světel a příběhů. Angelic a Dark mód. Tady žije Revia.",
        colors: ["#0a0e1f", "#7e6ee0"],
        link: "../Revia/index.html"
      },
      {
        name: "Glyph Planeta",
        emoji: "🌐",
        desc: "Planeta plná písmenek a Glyphů. Každé písmeno má svou osobnost.",
        colors: ["#050815", "#7fffd4"],
        link: "../Glyph-Planet/index.html"
      },
      {
        name: "1O1R RPG",
        emoji: "⚔️",
        desc: "Mini RPG dobrodružství s rámeči. Prozkoumej 4 světy!",
        colors: ["#05060a", "#f4d7a1"],
        link: "../1O1R/index.html"
      },
      {
        name: "3D Rámeček",
        emoji: "🧊",
        desc: "Interaktivní 3D Glyph rámeček. Otáčej a zkoumej!",
        colors: ["#0a0014", "#ff6bff"],
        link: "../3D ramecek/index.html"
      },
      {
        name: "Hlavoun",
        emoji: "🤖",
        desc: "AI agent Hlavoun. Průvodce a pomocník v digitálním světě.",
        colors: ["#001020", "#00bcd4"],
        link: "../Hlavoun/index.html"
      },
      {
        name: "Oblak",
        emoji: "☁️",
        desc: "Cloud PWA aplikace. Ukládej a sdílej své výtvory.",
        colors: ["#0a1520", "#87ceeb"],
        link: "../Oblak/index.html"
      }
    ];

    container.innerHTML = gameHeader("🌍 Galerie světů", "") + `
      <div class="game-body">
        <div style="font-size:1rem;color:#aaa;text-align:center">Vyber svět a vydej se na cestu!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;width:100%;max-width:500px" id="worldGrid"></div>
      </div>`;

    const grid = container.querySelector("#worldGrid");
    worlds.forEach(w => {
      const btn = document.createElement("button");
      btn.style.cssText = `
        display:flex;flex-direction:column;align-items:center;gap:.4rem;
        padding:1rem;border:2px solid rgba(255,255,255,.12);border-radius:1rem;
        background:linear-gradient(135deg,${w.colors[0]},${w.colors[1]}44);
        cursor:pointer;color:#fff;font-family:inherit;
        transition:transform .15s ease,border-color .15s ease;
      `;
      btn.innerHTML = `<span style="font-size:2rem">${w.emoji}</span>
        <span style="font-size:.9rem;font-weight:800">${w.name}</span>
        <span style="font-size:.72rem;color:#bbb;text-align:center;line-height:1.3">${w.desc.substring(0,50)}…</span>`;
      btn.addEventListener("click", () => {
        playSound("tap");
        Hub.showToast("Spouštím " + w.name + "…");
        // Open in mini-app viewer via hub-loader
        if (window.HubLoader) HubLoader.openByUrl(w.link, w.name);
      });
      grid.appendChild(btn);
    });
  }
};
