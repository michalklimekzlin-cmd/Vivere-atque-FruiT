/**
 * Batolete – Hlavní aplikace / Main App
 * Vivere atque Frui'T → dětská edice
 * 
 * Hry: Abeceda, Čísla, Barvy, Tvary, Zvířátka, Příběhy, Pohyb, Galerie
 */

'use strict';

/* ============================================================
   AUDIO ENGINE (Web Audio API – bez externích zdrojů)
   ============================================================ */
const Audio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* silent */ }
    }
    return ctx;
  }

  function tone(freq, dur = 0.15, type = 'sine', vol = 0.3) {
    const c = getCtx();
    if (!c) return;
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur);
  }

  return {
    click()   { tone(880, 0.08, 'sine', 0.2); },
    correct() { tone(523, 0.1, 'sine', 0.25); setTimeout(() => tone(659, 0.1, 'sine', 0.25), 100); setTimeout(() => tone(784, 0.2, 'sine', 0.3), 200); },
    wrong()   { tone(220, 0.2, 'sawtooth', 0.2); setTimeout(() => tone(196, 0.2, 'sawtooth', 0.2), 220); },
    reward()  { [523,659,784,1047].forEach((f,i) => setTimeout(() => tone(f, 0.15, 'sine', 0.25), i * 120)); },
    pop()     { tone(660, 0.06, 'sine', 0.18); },
    start()   { [440, 550, 660].forEach((f,i) => setTimeout(() => tone(f, 0.12, 'sine', 0.2), i * 100)); }
  };
})();

/* ============================================================
   REWARDS SYSTEM
   ============================================================ */
const Rewards = (() => {
  const KEY = 'BATOLETE_STARS';
  let stars = parseInt(localStorage.getItem(KEY) || '0', 10);

  function save() { localStorage.setItem(KEY, String(stars)); }

  function update() {
    const el = document.getElementById('starCount');
    if (el) el.textContent = '⭐ ' + stars;
  }

  return {
    get stars() { return stars; },
    add(n = 1) {
      stars += n;
      save();
      update();
      showReward();
    },
    init() { update(); }
  };

  function showReward() {
    const popup  = document.getElementById('rewardPopup');
    const emoji  = document.getElementById('rewardEmoji');
    const text   = document.getElementById('rewardText');
    const emojis = ['⭐','🌟','🎉','🏆','🎈','💎','🌈','🎊'];
    const texts  = [
      'Skvěle! Získal jsi hvězdičku!',
      'Výborně! Jsi šampión!',
      'Bravo! Pokračuj dál!',
      'Super! Jsi hvězda!'
    ];
    if (emoji) emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    if (text)  text.textContent  = CharacterManager.getCurrentChar().speak('reward') || texts[Math.floor(Math.random() * texts.length)];
    if (popup) popup.classList.remove('hidden');
    Audio.reward();
    startConfetti();
  }
})();

/* ============================================================
   CONFETTI
   ============================================================ */
function startConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors  = ['#ff6fb4','#6fb4ff','#ffb46f','#6fffb4','#d4b4ff','#fff06f'];
  const pieces  = Array.from({ length: 80 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * canvas.height - canvas.height,
    w:    Math.random() * 10 + 5,
    h:    Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    r:    Math.random() * Math.PI * 2,
    vx:   (Math.random() - 0.5) * 4,
    vy:   Math.random() * 4 + 2,
    vr:   (Math.random() - 0.5) * 0.2
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
    });
    frame++;
    if (frame < 90) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const Nav = (() => {
  const screens = {};
  let current = 'home';

  function show(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    const target = screens[id];
    if (target) { target.classList.add('active'); current = id; }
    const titles = {
      home:      '🌈 Batolete',
      abeceda:   '🔤 Abeceda',
      cisla:     '🔢 Čísla',
      barvy:     '🎨 Barvy',
      tvary:     '🔷 Tvary',
      zviratka:  '🐾 Zvířátka',
      pribehy:   '📖 Příběhy',
      pohyb:     '🏃 Pohyb',
      galerie:   '🖼️ Galerie'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[id] || '🌈 Batolete';
    speak(id);
    if (id !== 'home') initScreen(id);
  }

  function speak(id) {
    const el = document.getElementById('speechText');
    if (el) {
      el.textContent = CharacterManager.speak(id);
      const bubble = document.getElementById('speechBubble');
      if (bubble) { bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = ''; }
    }
  }

  return {
    init() {
      ['home','abeceda','cisla','barvy','tvary','zviratka','pribehy','pohyb','galerie']
        .forEach(id => {
          const el = document.getElementById('screen' + id.charAt(0).toUpperCase() + id.slice(1));
          if (el) screens[id] = el;
        });

      document.querySelectorAll('.game-card').forEach(btn => {
        btn.addEventListener('click', () => {
          Audio.click();
          show(btn.dataset.game);
        });
      });

      document.getElementById('homeBtn')?.addEventListener('click', () => {
        Audio.click();
        show('home');
      });
    },
    show,
    get current() { return current; }
  };
})();

/* ============================================================
   ALPHABET GAME / ABECEDA
   ============================================================ */
const AbecedaGame = (() => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZČĎĚŇŘŠŤŮŽ'.split('');
  const words = {
    A:'Autíčko 🚗', B:'Banán 🍌', C:'Cukr 🍬', Č:'Čokoláda 🍫',
    D:'Dům 🏠',    Ď:'Ďábel 😈', E:'Elefant 🐘', F:'Fialka 💜',
    G:'Gitara 🎸', H:'Hvězda ⭐', I:'Ježek 🦔',  J:'Jahoda 🍓',
    K:'Kočka 🐱',  L:'Lev 🦁',   M:'Motýl 🦋',  N:'Nebe 🌤️',
    Ň:'Ňadra ❤️',  O:'Orel 🦅',  P:'Pes 🐶',    Q:'Qu.. 🤔',
    R:'Ryba 🐟',   Ř:'Řeka 🌊',  S:'Slunce ☀️', Š:'Šnek 🐌',
    T:'Tygr 🐯',   Ť:'Ťapka 🐾', U:'Ucho 👂',   Ú:'Úsměv 😊',
    Ů:'Ůůů 🌟',   V:'Vítr 💨',  W:'Wau 🐶',    X:'Xylofon 🎵',
    Y:'Yak 🐂',    Z:'Zebra 🦓', Ž:'Žirafa 🦒'
  };
  const colors = ['#ff6fb4','#6fb4ff','#ffb46f','#6fffb4','#d4b4ff','#fff06f','#ff9f6f','#6fe8ff'];

  let selected = 'A';

  function drawLetter(canvas, letter) {
    const ctx  = canvas.getContext('2d');
    const w    = canvas.width;
    const h    = canvas.height;
    const col  = colors[letter.charCodeAt(0) % colors.length];
    ctx.clearRect(0, 0, w, h);

    // Background circle
    ctx.beginPath();
    ctx.arc(w/2, h/2, w/2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = col + '33';
    ctx.fill();

    // Letter
    ctx.font = `bold ${Math.floor(w * 0.55)}px ui-rounded, system-ui`;
    ctx.fillStyle = col;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, w/2, h/2 + 4);

    // Decorative dots
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r     = w/2 - 10;
      ctx.beginPath();
      ctx.arc(w/2 + r * Math.cos(angle), h/2 + r * Math.sin(angle), 4, 0, Math.PI * 2);
      ctx.fillStyle = col + '88';
      ctx.fill();
    }
  }

  function select(letter) {
    selected = letter;
    document.getElementById('bigLetter').textContent = letter;
    document.getElementById('letterWord').textContent = words[letter] || letter + '...';
    document.querySelectorAll('.letter-btn').forEach(b => b.classList.toggle('active', b.dataset.letter === letter));
    const canvas = document.getElementById('letterCanvas');
    if (canvas) drawLetter(canvas, letter);
    Audio.pop();
    if (Math.random() < 0.4) Rewards.add(1);
  }

  return {
    init() {
      const grid = document.getElementById('letterGrid');
      if (!grid || grid.dataset.init) return;
      grid.dataset.init = '1';
      letters.forEach(l => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.dataset.letter = l;
        btn.textContent = l;
        btn.addEventListener('click', () => select(l));
        grid.appendChild(btn);
      });
      select('A');
    }
  };
})();

/* ============================================================
   NUMBERS GAME / ČÍSLA
   ============================================================ */
const CislaGame = (() => {
  let target = 1;
  let score  = 0;

  function newRound() {
    target = Math.floor(Math.random() * 10) + 1;
    const task = document.getElementById('numberTask');
    if (task) task.textContent = `Kolik je teček? (1–10)`;

    const dots = document.getElementById('numberDots');
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < target; i++) {
        const d = document.createElement('div');
        d.className = 'number-dot';
        d.style.animationDelay = i * 0.05 + 's';
        d.style.background = ['#ff6fb4','#6fb4ff','#ffb46f','#6fffb4','#d4b4ff'][i % 5];
        dots.appendChild(d);
      }
    }

    const btns = document.getElementById('numberBtns');
    if (btns) {
      btns.innerHTML = '';
      const choices = shuffle([target, ...getWrong(target, 3)]);
      choices.forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'number-choice';
        btn.textContent = n;
        btn.addEventListener('click', () => checkAnswer(btn, n));
        btns.appendChild(btn);
      });
    }
  }

  function getWrong(correct, count) {
    const pool = [];
    for (let i = 1; i <= 10; i++) if (i !== correct) pool.push(i);
    return shuffle(pool).slice(0, count);
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function checkAnswer(btn, n) {
    document.querySelectorAll('.number-choice').forEach(b => b.disabled = true);
    if (n === target) {
      btn.classList.add('correct');
      Audio.correct();
      score++;
      speak('correct');
      setTimeout(() => { Rewards.add(1); newRound(); }, 1200);
    } else {
      btn.classList.add('wrong');
      Audio.wrong();
      speak('wrong');
      document.querySelectorAll('.number-choice').forEach(b => {
        if (parseInt(b.textContent) === target) b.classList.add('correct');
      });
      setTimeout(newRound, 1600);
    }
  }

  function speak(ctx) {
    const el = document.getElementById('speechText');
    if (el) el.textContent = CharacterManager.speak(ctx);
  }

  return {
    init() {
      const game = document.getElementById('numberGame');
      if (!game || game.dataset.init) { if (game) newRound(); return; }
      game.dataset.init = '1';
      newRound();
    }
  };
})();

/* ============================================================
   COLORS GAME / BARVY
   ============================================================ */
const BarvyGame = (() => {
  const colorData = [
    { name: 'Červená',   hex: '#e74c3c', cs: 'červená' },
    { name: 'Modrá',     hex: '#3498db', cs: 'modrá' },
    { name: 'Zelená',    hex: '#2ecc71', cs: 'zelená' },
    { name: 'Žlutá',     hex: '#f1c40f', cs: 'žlutá' },
    { name: 'Oranžová',  hex: '#e67e22', cs: 'oranžová' },
    { name: 'Fialová',   hex: '#9b59b6', cs: 'fialová' },
    { name: 'Růžová',    hex: '#ff6fb4', cs: 'růžová' },
    { name: 'Hnědá',     hex: '#8b5e3c', cs: 'hnědá' },
    { name: 'Černá',     hex: '#2c3e50', cs: 'černá' },
    { name: 'Bílá',      hex: '#ecf0f1', cs: 'bílá' }
  ];

  let target = null;

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function newRound() {
    const shuffled = shuffle(colorData);
    target = shuffled[0];
    const wrongs = shuffled.slice(1, 3);
    const all    = shuffle([target, ...wrongs]);

    const blob = document.getElementById('colorBlob');
    if (blob) { blob.style.background = target.hex; blob.style.animation = 'none'; void blob.offsetWidth; blob.style.animation = ''; }

    const q = document.getElementById('colorQuestion');
    if (q) q.textContent = 'Jaká je to barva?';

    const answers = document.getElementById('colorAnswers');
    if (answers) {
      answers.innerHTML = '';
      all.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'color-choice';
        btn.textContent = c.name;
        btn.style.borderColor = c.hex + '99';
        btn.addEventListener('click', () => checkAnswer(btn, c));
        answers.appendChild(btn);
      });
    }
  }

  function checkAnswer(btn, color) {
    document.querySelectorAll('.color-choice').forEach(b => b.disabled = true);
    if (color.name === target.name) {
      btn.classList.add('correct');
      Audio.correct();
      speak('correct');
      setTimeout(() => { Rewards.add(1); newRound(); }, 1200);
    } else {
      btn.classList.add('wrong');
      Audio.wrong();
      speak('wrong');
      document.querySelectorAll('.color-choice').forEach(b => {
        if (b.textContent === target.name) b.classList.add('correct');
      });
      setTimeout(newRound, 1600);
    }
  }

  function speak(ctx) {
    const el = document.getElementById('speechText');
    if (el) el.textContent = CharacterManager.speak(ctx);
  }

  return {
    init() {
      const game = document.getElementById('colorGame');
      if (!game || game.dataset.init) { newRound(); return; }
      game.dataset.init = '1';
      newRound();
    }
  };
})();

/* ============================================================
   SHAPES GAME / TVARY
   ============================================================ */
const TvaryGame = (() => {
  const shapes = [
    { name: 'Kruh',          emoji: '⭕', draw: drawCircle },
    { name: 'Čtverec',       emoji: '⬛', draw: drawSquare },
    { name: 'Trojúhelník',   emoji: '🔺', draw: drawTriangle },
    { name: 'Hvězda',        emoji: '⭐', draw: drawStar },
    { name: 'Srdce',         emoji: '❤️', draw: drawHeart },
    { name: 'Obdélník',      emoji: '▬', draw: drawRect }
  ];

  let current = 0;

  function drawCircle(ctx, w, h, col) {
    ctx.beginPath();
    ctx.arc(w/2, h/2, Math.min(w,h)/2 - 20, 0, Math.PI*2);
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawSquare(ctx, w, h, col) {
    const s = Math.min(w,h) - 60;
    ctx.beginPath();
    ctx.rect((w-s)/2, (h-s)/2, s, s);
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawTriangle(ctx, w, h, col) {
    const m = Math.min(w,h);
    ctx.beginPath();
    ctx.moveTo(w/2, (h-m)/2 + 20);
    ctx.lineTo((w-m)/2 + 20, (h+m)/2 - 20);
    ctx.lineTo((w+m)/2 - 20, (h+m)/2 - 20);
    ctx.closePath();
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawStar(ctx, w, h, col) {
    const cx = w/2, cy = h/2;
    const outerR = Math.min(w,h)/2 - 20;
    const innerR = outerR * 0.4;
    const points = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r     = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI/2;
      if (i === 0) ctx.moveTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle));
      else         ctx.lineTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function drawHeart(ctx, w, h, col) {
    const x = w/2, y = h/2 - 10, s = Math.min(w,h) * 0.38;
    ctx.beginPath();
    ctx.moveTo(x, y + s*0.4);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s*0.4);
    ctx.bezierCurveTo(x - s, y + s*0.85, x, y + s*1.2, x, y + s*1.3);
    ctx.bezierCurveTo(x, y + s*1.2, x + s, y + s*0.85, x + s, y + s*0.4);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s*0.4);
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function drawRect(ctx, w, h, col) {
    const rw = w - 60, rh = (h - 60) * 0.6;
    ctx.beginPath();
    ctx.rect((w-rw)/2, (h-rh)/2, rw, rh);
    ctx.fillStyle = col + '55';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  const colors = ['#ff6fb4','#6fb4ff','#ffb46f','#6fffb4','#d4b4ff'];

  function render() {
    const canvas = document.getElementById('shapeCanvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const s    = shapes[current];
    const col  = colors[current % colors.length];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    s.draw(ctx, canvas.width, canvas.height, col);

    // Name label
    ctx.font = 'bold 22px ui-rounded, system-ui';
    ctx.fillStyle = col;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(s.name, canvas.width/2, canvas.height - 8);
  }

  function makeButtons() {
    const container = document.getElementById('shapeBtns');
    if (!container || container.dataset.init) return;
    container.dataset.init = '1';
    shapes.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className  = 'shape-btn' + (i === 0 ? ' active' : '');
      btn.textContent = s.emoji + ' ' + s.name;
      btn.addEventListener('click', () => {
        current = i;
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
        Audio.pop();
      });
      container.appendChild(btn);
    });
  }

  return {
    init() {
      const canvas = document.getElementById('shapeCanvas');
      if (canvas) { canvas.width = Math.min(400, window.innerWidth - 40); canvas.height = 300; }
      makeButtons();
      render();
      document.getElementById('shapeNext')?.addEventListener('click', () => {
        current = (current + 1) % shapes.length;
        document.querySelectorAll('.shape-btn').forEach((b, i) => b.classList.toggle('active', i === current));
        render();
        Audio.pop();
        if (Math.random() < 0.5) Rewards.add(1);
      });
    }
  };
})();

/* ============================================================
   ANIMALS GAME / ZVÍŘÁTKA
   ============================================================ */
const ZviratkuGame = (() => {
  const animals = [
    { emoji:'🐶', name:'Pejsek',    sound:'Haf haf! 🐕' },
    { emoji:'🐱', name:'Kočička',   sound:'Mňau mňau! 🐈' },
    { emoji:'🐮', name:'Kravička',  sound:'Mú mú! 🐄' },
    { emoji:'🐷', name:'Prasátko',  sound:'Chro chro! 🐷' },
    { emoji:'🐔', name:'Slepička',  sound:'Kokokoko! 🐓' },
    { emoji:'🐸', name:'Žabka',     sound:'Kvak kvak! 🐸' },
    { emoji:'🦆', name:'Kačenka',   sound:'Kváká kváká! 🦆' },
    { emoji:'🐑', name:'Ovečka',    sound:'Bé bé! 🐑' },
    { emoji:'🐴', name:'Koník',     sound:'Ihaha! 🐴' },
    { emoji:'🐘', name:'Sloník',    sound:'Tůůů! 🐘' },
    { emoji:'🦁', name:'Lvíček',    sound:'Rárárá! 🦁' },
    { emoji:'🐯', name:'Tygřík',    sound:'Grrr! 🐯' },
    { emoji:'🐰', name:'Králíček',  sound:'Čvachta čvachta! 🐇' },
    { emoji:'🦊', name:'Lišticka',  sound:'Víp víp! 🦊' },
    { emoji:'🐻', name:'Medvídek',  sound:'Brumm! 🐻' },
    { emoji:'🦋', name:'Motýlek',   sound:'Ššš (letí tiše) 🦋' },
    { emoji:'🐝', name:'Včelička',  sound:'Bzzz bzz! 🐝' },
    { emoji:'🐠', name:'Rybička',   sound:'Bublina! 🫧' },
    { emoji:'🦜', name:'Papoušek', sound:'Ahoj ahoj! 🦜' },
    { emoji:'🦒', name:'Žirafa',    sound:'Mmm mmm! 🦒' }
  ];

  function select(a) {
    document.getElementById('animalBig').textContent  = a.emoji;
    document.getElementById('animalName').textContent = a.name;
    document.getElementById('animalSound').textContent = a.sound;
    document.querySelectorAll('.animal-btn').forEach(b => b.classList.toggle('active', b.dataset.name === a.name));
    Audio.pop();
    if (Math.random() < 0.3) Rewards.add(1);
  }

  return {
    init() {
      const grid = document.getElementById('animalGrid');
      if (!grid || grid.dataset.init) { return; }
      grid.dataset.init = '1';
      animals.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'animal-btn';
        btn.dataset.name = a.name;
        btn.innerHTML = `<span class="animal-emoji">${a.emoji}</span><span class="animal-label">${a.name}</span>`;
        btn.addEventListener('click', () => select(a));
        grid.appendChild(btn);
      });
      select(animals[0]);
    }
  };
})();

/* ============================================================
   STORIES / PŘÍBĚHY
   ============================================================ */
const PribehyGame = (() => {
  const stories = [
    {
      id: 'iskron',
      title: 'Iskroň a hvězdičky',
      icon: '✨',
      pages: [
        { scene: '✨🌙', text: 'Byl jednou jeden Iskroň – malá zářivá jiskřička, která žila na obloze. Každou noc rozsvěcel hvězdičky.' },
        { scene: '🌟⭐🌟', text: 'Iskroň měl velký sen: osvítit celý svět! Ale byl malý a bál se tmy.' },
        { scene: '👶✨', text: 'Jednoho dne potkal malého Pikoše, který mu řekl: "Nevadí, že jsi malý! I malá jiskřička může svítit velice jasně!"' },
        { scene: '🌈✨🌟', text: 'Iskroň se rozhořel celý! A od té doby osvětluje cestu všem, kdo se bojí tmy. 🌟' }
      ]
    },
    {
      id: 'revia',
      title: 'Svět Revia',
      icon: '🌍',
      pages: [
        { scene: '🏰🌈', text: 'Daleko daleko leží svět Revia – místo plné barev a kouzel, kde vládne vždy klid a harmonie.' },
        { scene: '🧠💖👶💪', text: 'V Revii žijí čtyři přátelé: Hlavoun myslí, Viri vypráví, Pikoš se dívá a Bičák se pohybuje!' },
        { scene: '🎮🎨📚', text: 'Spolu tvoří hry, příběhy a dobrodružství. Každý den je v Revii nový výdobytek!' },
        { scene: '🌟🏆🎊', text: 'A ty? Ty jsi teď součástí Revie! Vítej ve světě Vivere atque Frui\'T! 🌈' }
      ]
    },
    {
      id: 'abeceda',
      title: 'Dobrodružství písmenek',
      icon: '🔤',
      pages: [
        { scene: '🔤🌸', text: 'Bylo jednou 26 písmenek, která žila v malé vesničce zvané Abeceda. Každé mělo své jméno a svůj zvuk.' },
        { scene: 'Á🍎', text: '"Á" říkalo: "Ahoj! Mě to začíná!" a ukázalo na červené jablko. "A jako Autíčko! A jako Anděl!"' },
        { scene: 'B🐝', text: '"B" přiletělo jako včelička: "Bzzz! B jako Bublina! B jako Brouk!" A Bublina odletěla do světa.' },
        { scene: '🔤🌈', text: 'A tak každé písmenku dostalo svou roli. Dohromady tvoří slova, příběhy a celý náš svět! 📖' }
      ]
    },
    {
      id: 'bicak',
      title: 'Bičák a pohybový svět',
      icon: '💪',
      pages: [
        { scene: '💪🏃', text: 'Bičák byl největší milovník pohybu na světě. Každé ráno vstával a hned začal cvičit: skoky, dřepy, běhání!' },
        { scene: '🤸🦵', text: '"Pohyb je zdraví!" křičel Bičák a zatřásl rukama. "Každý skok tě dělá silnějším! Každý krok je radost!"' },
        { scene: '🌳🏃👶', text: 'Jednoho dne přišel malý Pikoš: "Já neumím skákat jako ty." Bičák se usmál: "Nevadí! Začneme pomalu."' },
        { scene: '💪🏆⭐', text: 'Spolu cvičili každý den. A Pikoš byl brzy silnější než si myslel! "Každý pohyb se počítá!" řekl Bičák. 💪' }
      ]
    }
  ];

  let currentStory = null;
  let currentPage  = 0;

  function openStory(story) {
    currentStory = story;
    currentPage  = 0;
    document.querySelectorAll('.story-card').forEach(c => c.classList.toggle('active', c.dataset.story === story.id));
    document.getElementById('storyList').style.display = 'none';
    const reader = document.getElementById('storyReader');
    reader.classList.add('active');
    renderPage();
  }

  function renderPage() {
    if (!currentStory) return;
    const p = currentStory.pages[currentPage];
    document.getElementById('storyScene').textContent = p.scene;
    document.getElementById('storyText').textContent  = p.text;
    document.getElementById('storyPage').textContent  = `${currentPage + 1} / ${currentStory.pages.length}`;
    Audio.pop();
  }

  return {
    init() {
      const list = document.getElementById('storyList');
      if (!list || list.dataset.init) { return; }
      list.dataset.init = '1';

      stories.forEach(s => {
        const card = document.createElement('button');
        card.className = 'story-card';
        card.dataset.story = s.id;
        card.innerHTML = `<span class="story-icon">${s.icon}</span><span class="story-title">${s.title}</span>`;
        card.addEventListener('click', () => { Audio.click(); openStory(s); });
        list.appendChild(card);
      });

      document.getElementById('storyNext')?.addEventListener('click', () => {
        if (!currentStory) return;
        if (currentPage < currentStory.pages.length - 1) {
          currentPage++;
          renderPage();
        } else {
          Rewards.add(1);
          document.getElementById('storyList').style.display = '';
          document.getElementById('storyReader').classList.remove('active');
          currentStory = null;
        }
      });

      document.getElementById('storyPrev')?.addEventListener('click', () => {
        if (!currentStory) return;
        if (currentPage > 0) { currentPage--; renderPage(); }
        else {
          document.getElementById('storyList').style.display = '';
          document.getElementById('storyReader').classList.remove('active');
          currentStory = null;
        }
      });
    }
  };
})();

/* ============================================================
   POHYB / BICAK GAME
   ============================================================ */
const PohybGame = (() => {
  let score    = 0;
  let activity = null;
  let animFrame = null;

  function drawBicak(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const t = Date.now() / 500;

    ctx.clearRect(0, 0, w, h);

    // Body
    const by = h/2 + Math.sin(t) * 15;
    ctx.beginPath();
    ctx.ellipse(w/2, by, 30, 40, 0, 0, Math.PI*2);
    ctx.fillStyle = '#ffb46f';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(w/2, by - 55, 28, 0, Math.PI*2);
    ctx.fillStyle = '#ffd4a0';
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(w/2-10, by-58, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w/2+10, by-58, 5, 0, Math.PI*2); ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.arc(w/2, by-50, 14, 0.2, Math.PI-0.2);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arms animation
    const armAngle = Math.sin(t * 2) * 0.6;
    ctx.strokeStyle = '#ffb46f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(w/2 - 28, by - 10);
    ctx.lineTo(w/2 - 28 - Math.cos(armAngle)*35, by - 10 + Math.sin(armAngle)*35);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(w/2 + 28, by - 10);
    ctx.lineTo(w/2 + 28 + Math.cos(-armAngle)*35, by - 10 + Math.sin(-armAngle)*35);
    ctx.stroke();

    // Legs
    const legAngle = Math.sin(t * 2) * 0.4;
    ctx.strokeStyle = '#e67e22';
    // Left leg
    ctx.beginPath();
    ctx.moveTo(w/2 - 15, by + 38);
    ctx.lineTo(w/2 - 15 - Math.sin(legAngle)*20, by + 80);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(w/2 + 15, by + 38);
    ctx.lineTo(w/2 + 15 + Math.sin(legAngle)*20, by + 80);
    ctx.stroke();

    // Stars
    ctx.fillStyle = '#fff06f';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💪', w/2, by - 95);
  }

  function startAnim(canvas) {
    if (animFrame) cancelAnimationFrame(animFrame);
    function loop() { drawBicak(canvas); animFrame = requestAnimationFrame(loop); }
    loop();
  }

  function newActivity() {
    activity = Bicak.randomActivity();
    const task = document.getElementById('pohybTask');
    if (task) task.textContent = activity.emoji + ' ' + activity.desc;

    const btns = document.getElementById('pohybBtns');
    if (btns) {
      btns.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'pohyb-btn';
      btn.textContent = '✅ Hotovo! (' + activity.count + ' ' + activity.unit + ')';
      btn.addEventListener('click', () => {
        score++;
        document.getElementById('pohybCounter').textContent = '💪 Skóre: ' + score;
        Audio.correct();
        speak('correct');
        if (score % 3 === 0) Rewards.add(1);
        setTimeout(newActivity, 800);
      });
      btns.appendChild(btn);
    }
  }

  function speak(ctx) {
    const el = document.getElementById('speechText');
    if (el) el.textContent = CharacterManager.speak(ctx);
  }

  return {
    init() {
      const canvas = document.getElementById('bicakCanvas');
      if (canvas) { startAnim(canvas); }
      const game = document.getElementById('pohybGame');
      if (!game || game.dataset.init) { if (game) newActivity(); return; }
      game.dataset.init = '1';
      newActivity();
    }
  };
})();

/* ============================================================
   GALLERY / GALERIE
   ============================================================ */
const GalerieGame = (() => {
  const worlds = [
    {
      name: 'Revia',
      desc: 'Svět harmonie a barev, kde žijí Hlavoun, Viri, Pikoš a Bičák.',
      draw(ctx, w, h) {
        // Sky gradient
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0, '#1a0a3a');
        g.addColorStop(1, '#3a1a6a');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,w,h);
        // Stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 40; i++) {
          const x = (i*37+i*i) % w, y = (i*23+i*17) % (h*0.6);
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
        }
        // Castle
        ctx.fillStyle = '#6b3fa0';
        ctx.fillRect(w*0.3, h*0.5, w*0.4, h*0.35);
        ctx.fillRect(w*0.28, h*0.42, w*0.1, h*0.15);
        ctx.fillRect(w*0.62, h*0.42, w*0.1, h*0.15);
        ctx.fillStyle = '#ff6fb4';
        ctx.fillRect(w*0.44, h*0.32, w*0.12, h*0.18);
        // Rainbow
        const colors = ['#ff0000','#ff8c00','#ffff00','#00ff00','#0000ff','#8b00ff'];
        colors.forEach((c, i) => {
          ctx.beginPath(); ctx.arc(w*0.1, h, (w*0.5) - i*12, Math.PI, 0);
          ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke();
        });
      }
    },
    {
      name: 'Písmenková planeta',
      desc: 'Planeta kde všechna písmenka žijí a každý den se učí nová slova.',
      draw(ctx, w, h) {
        ctx.fillStyle = '#050815';
        ctx.fillRect(0,0,w,h);
        // Planet
        const gr = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,h*0.38);
        gr.addColorStop(0, '#5a3080'); gr.addColorStop(1, '#1a0838');
        ctx.beginPath(); ctx.arc(w/2,h/2,h*0.38,0,Math.PI*2);
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = '#d4b4ff'; ctx.lineWidth = 2; ctx.stroke();
        // Letters on planet
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
        ['A','B','C','D','E'].forEach((l,i) => {
          const a = (i/5)*Math.PI*2 - Math.PI/2;
          ctx.fillText(l, w/2 + Math.cos(a)*h*0.28, h/2 + Math.sin(a)*h*0.28 + 6);
        });
        // Stars
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
        for (let i = 0; i < 20; i++) { ctx.fillText('·', (i*53+17)%w, (i*37+11)%h); }
      }
    },
    {
      name: 'Kytičkový svět',
      desc: 'Svět plný kvetoucích květin a motýlků. Každá kytička má svou barvu.',
      draw(ctx, w, h) {
        // Sky
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,w,h);
        // Ground
        ctx.fillStyle = '#5a9a2a'; ctx.fillRect(0, h*0.65, w, h*0.35);
        // Flowers
        const flowers = [
          {x:0.15,c:'#ff6fb4'},{x:0.35,c:'#ffb46f'},{x:0.55,c:'#fff06f'},{x:0.75,c:'#d4b4ff'},{x:0.9,c:'#6fffb4'}
        ];
        flowers.forEach(f => {
          const fx = w*f.x, fy = h*0.62;
          // Stem
          ctx.strokeStyle = '#3a7a10'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 50); ctx.stroke();
          // Petals
          for (let i = 0; i < 6; i++) {
            const a = (i/6)*Math.PI*2;
            ctx.beginPath();
            ctx.ellipse(fx+Math.cos(a)*14, (fy-50)+Math.sin(a)*14, 10, 7, a, 0, Math.PI*2);
            ctx.fillStyle = f.c; ctx.fill();
          }
          // Center
          ctx.beginPath(); ctx.arc(fx, fy-50, 8, 0, Math.PI*2);
          ctx.fillStyle = '#ffe066'; ctx.fill();
        });
        // Sun
        ctx.beginPath(); ctx.arc(w*0.85, h*0.15, 30, 0, Math.PI*2);
        ctx.fillStyle = '#ffe566'; ctx.fill();
        // Butterflies
        ctx.fillStyle = '#ff6fb4'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🦋', w*0.3, h*0.35);
        ctx.fillText('🦋', w*0.65, h*0.28);
      }
    },
    {
      name: 'VaFiT Centrum',
      desc: '3D centrum VaFiT – střed celého vesmíru Vivere atque Frui\'T.',
      draw(ctx, w, h) {
        ctx.fillStyle = '#05070a'; ctx.fillRect(0,0,w,h);
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
        // Core sphere
        const gr = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,70);
        gr.addColorStop(0,'#19d6ff'); gr.addColorStop(0.5,'#0066cc'); gr.addColorStop(1,'rgba(0,40,80,0)');
        ctx.beginPath(); ctx.arc(w/2,h/2,70,0,Math.PI*2);
        ctx.fillStyle = gr; ctx.fill();
        // Rings
        ctx.strokeStyle = 'rgba(25,214,255,0.4)'; ctx.lineWidth = 2;
        [90, 110, 130].forEach(r => {
          ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.stroke();
        });
        // Nodes
        ctx.fillStyle = '#19d6ff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
        ['Hlavoun','Pikoš','Viri','Bičák'].forEach((n,i) => {
          const a = (i/4)*Math.PI*2 - Math.PI/2;
          const nx = w/2 + Math.cos(a)*110, ny = h/2 + Math.sin(a)*110;
          ctx.beginPath(); ctx.arc(nx, ny, 8, 0, Math.PI*2);
          ctx.fillStyle = ['#6fb4ff','#ff6fb4','#d4b4ff','#ffb46f'][i]; ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText(n, nx, ny - 14);
        });
        // Label
        ctx.fillStyle = '#19d6ff'; ctx.font = 'bold 14px system-ui';
        ctx.fillText('VAFT CENTER 3D', w/2, h - 12);
      }
    },
    {
      name: 'Glyph Planet',
      desc: 'Planeta tajemných glyfů a symbolů. Každý glyf má svůj příběh.',
      draw(ctx, w, h) {
        ctx.fillStyle = '#080616'; ctx.fillRect(0,0,w,h);
        // Planet
        const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,h*0.4);
        g.addColorStop(0,'#2a1a4a'); g.addColorStop(1,'#0a0820');
        ctx.beginPath(); ctx.arc(w/2,h/2,h*0.4,0,Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = '#a06bff'; ctx.lineWidth = 1.5; ctx.stroke();
        // Glyphs
        ctx.fillStyle = '#d4b4ff'; ctx.font = '24px monospace'; ctx.textAlign = 'center';
        const glyphs = ['Λ','Ω','Σ','Δ','Φ','Ψ','Θ','Ξ'];
        glyphs.forEach((g,i) => {
          const a = (i/8)*Math.PI*2;
          const r = h*0.28;
          ctx.fillText(g, w/2+Math.cos(a)*r, h/2+Math.sin(a)*r+8);
        });
        // Stars
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
        for (let i = 0; i < 30; i++) { ctx.fillText('*', (i*71+23)%w, (i*43+17)%(h*0.4)); }
      }
    },
    {
      name: 'Oblak',
      desc: 'Svět mraků kde cestujeme po nebi a snítíme sny.',
      draw(ctx, w, h) {
        // Sky gradient
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,'#1a6ab4'); g.addColorStop(1,'#6ab4ff');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        // Clouds
        function cloud(x, y, s) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          [0,s*0.5,-s*0.5,s,s*0.8].forEach((ox,i) => {
            ctx.beginPath(); ctx.arc(x+ox, y+[0,-s*0.3,-s*0.2,0,-s*0.25][i]*0.8, s*0.5-i*2, 0, Math.PI*2);
            ctx.fill();
          });
        }
        cloud(w*0.15, h*0.2, 40); cloud(w*0.55, h*0.15, 55); cloud(w*0.8, h*0.3, 35); cloud(w*0.4, h*0.45, 45);
        // Sun
        ctx.beginPath(); ctx.arc(w*0.9, h*0.08, 28, 0, Math.PI*2);
        ctx.fillStyle = '#ffe566'; ctx.fill();
        // Birds
        ctx.strokeStyle = '#1a2a4a'; ctx.lineWidth = 2;
        [[w*0.3,h*0.1],[w*0.35,h*0.08],[w*0.65,h*0.2]].forEach(([bx,by]) => {
          ctx.beginPath(); ctx.moveTo(bx-8,by); ctx.quadraticCurveTo(bx,by-8,bx+8,by); ctx.stroke();
        });
        // Characters on clouds
        ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('☁️', w*0.5, h*0.55); ctx.fillText('🌤️', w*0.2, h*0.55);
      }
    }
  ];

  let currentWorld = null;

  function thumbDraw(canvas, world) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(canvas.width/400, canvas.height/300);
    world.draw(ctx, 400, 300);
    ctx.restore();
  }

  function showWorld(world) {
    currentWorld = world;
    document.querySelectorAll('.gallery-card').forEach(c => c.classList.toggle('active', c.dataset.world === world.name));
    document.getElementById('galleryTitle').textContent = world.name;
    document.getElementById('galleryDesc').textContent  = world.desc;
    const canvas = document.getElementById('galleryCanvas');
    if (canvas) {
      canvas.width  = Math.min(400, window.innerWidth - 40);
      canvas.height = Math.round(canvas.width * 3/4);
      world.draw(canvas.getContext('2d'), canvas.width, canvas.height);
    }
    Audio.pop();
    if (Math.random() < 0.25) Rewards.add(1);
  }

  return {
    init() {
      const grid = document.getElementById('galleryGrid');
      if (!grid || grid.dataset.init) { if (currentWorld) showWorld(currentWorld); return; }
      grid.dataset.init = '1';
      worlds.forEach(world => {
        const card = document.createElement('button');
        card.className = 'gallery-card';
        card.dataset.world = world.name;
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 120; thumbCanvas.height = 90;
        const title = document.createElement('span');
        title.className = 'gallery-card-title';
        title.textContent = world.name;
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb';
        thumb.appendChild(thumbCanvas);
        card.appendChild(thumb);
        card.appendChild(title);
        card.addEventListener('click', () => { Audio.click(); showWorld(world); });
        grid.appendChild(card);
        // Delay thumb drawing to avoid blocking
        setTimeout(() => thumbDraw(thumbCanvas, world), 50);
      });
      showWorld(worlds[0]);
    }
  };
})();

/* ============================================================
   SCREEN INITIALIZERS
   ============================================================ */
function initScreen(id) {
  switch(id) {
    case 'abeceda':  AbecedaGame.init();  break;
    case 'cisla':    CislaGame.init();    break;
    case 'barvy':    BarvyGame.init();    break;
    case 'tvary':    TvaryGame.init();    break;
    case 'zviratka': ZviratkuGame.init(); break;
    case 'pribehy':  PribehyGame.init();  break;
    case 'pohyb':    PohybGame.init();    break;
    case 'galerie':  GalerieGame.init();  break;
  }
}

/* ============================================================
   CHARACTER SWITCHER
   ============================================================ */
function initCharacterSwitcher() {
  document.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.char;
      CharacterManager.setCurrent(id);
      document.querySelectorAll('.char-btn').forEach(b => b.classList.toggle('active', b.dataset.char === id));
      const el = document.getElementById('speechText');
      if (el) el.textContent = CharacterManager.speak(Nav.current);
      Audio.pop();
    });
  });
}

/* ============================================================
   REWARD POPUP CLOSE
   ============================================================ */
function initRewardPopup() {
  document.getElementById('rewardClose')?.addEventListener('click', () => {
    document.getElementById('rewardPopup').classList.add('hidden');
    Audio.click();
  });
}

/* ============================================================
   SPLASH SCREEN
   ============================================================ */
function initSplash() {
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');

  document.getElementById('splashStart')?.addEventListener('click', () => {
    Audio.start();
    splash.style.transition = 'opacity 0.4s, transform 0.4s';
    splash.style.opacity    = '0';
    splash.style.transform  = 'scale(1.05)';
    setTimeout(() => {
      splash.classList.add('hidden');
      app.classList.remove('hidden');
    }, 400);
  });
}

/* ============================================================
   SERVICE WORKER REGISTRATION
   ============================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  Nav.init();
  Rewards.init();
  initCharacterSwitcher();
  initRewardPopup();
  registerSW();

  // Random Pikos message every 30s
  setInterval(() => {
    if (CharacterManager.current === 'pikos') {
      const el = document.getElementById('speechText');
      if (el) el.textContent = Pikos.randomLine();
    }
  }, 30000);
});
