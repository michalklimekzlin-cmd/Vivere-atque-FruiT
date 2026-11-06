# 🌟 Batolete – Centrální Hub

> **Vzdělávací platforma pro celou rodinu** – děti, rodiče i prarodiče.  
> Vše v jednom místě, offline-first, bez reklam, bez účtu.

---

## 🗂️ Struktura

```
Batolete/
├── index.html          # Centrální Hub – vstupní bod
├── hub-menu.css        # Hub styling (velká tlačítka, ikony, responsivní)
├── hub-loader.js       # Loader pro mini-aplikace (iframe + postMessage)
├── app.js              # 8 základních her + reward systém + Web Audio
├── style.css           # Základní design (kompatibilní s app.js)
├── service-worker.js   # Offline-first PWA (cache strategie)
├── manifest.json       # PWA manifest
│
├── mini-apps/          # Wrappery pro mini-aplikace
│   ├── 1o1r.html       # 1O1R RPG
│   ├── revia.html      # Revia storytelling
│   ├── revia-master.html # Revia Master
│   ├── 3d-ramecek.html # 3D Glyph rámeček
│   ├── glyph-planet.html   # Glyph Planeta
│   ├── glyph-planet-3d.html # Glyph Planeta 3D
│   ├── glyph-editor.html   # Glyph Editor (Michal-AI-Al-Klimek)
│   ├── hlavoun.html    # Hlavoun AI agent
│   ├── oblak.html      # Oblak Cloud
│   ├── vaft-girls.html # VaFT Girls
│   ├── vaft-bearhead.html # VaFT BearHead
│   ├── vaft-comet.html # VaFT Comet
│   └── chybozrout.html # Chybožrout Opravář
│
└── worlds/             # Světy VaFiT
    ├── index.html      # Přehled světů
    └── worlds.js       # World manager
```

---

## 🎮 8 Základních her

| Hra | Popis | Typ |
|-----|-------|-----|
| 🔤 **Abeceda** | Česká abeceda, rozpoznávání písmen | Quiz |
| 🔢 **Čísla** | Počítání teček 1–10 | Quiz |
| 🎨 **Barvy** | Rozpoznávání 10 barev | Quiz |
| 🔵 **Tvary** | Kruh, čtverec, trojúhelník, hvězda… | Quiz |
| 🐾 **Zvířátka** | 20 zvířat se zvuky | Quiz |
| 📖 **Příběhy** | 4 české pohádky (stránkování) | Příběh |
| 🏃 **Pohyb** | Pohybové aktivity (Bičákův program) | Aktivity |
| 🌍 **Galerie světů** | 6 VaFiT světů k prozkoumání | Galerie |

---

## 🚀 Mini-Aplikace

| App | Popis | Složka |
|-----|-------|--------|
| ⚔️ **1O1R RPG** | Mini RPG s rámeči a pohybem | `1O1R/` |
| ✨ **Revia** | Storytelling, Angel/Dark mód | `Revia/` |
| 🌑 **Revia Master** | Pokročilá Revia | `Revia-Master/` |
| 🧊 **3D Rámeček** | Interaktivní 3D Glyph | `3D ramecek/` |
| 🌐 **Glyph Planeta** | Písmenková planeta | `Glyph-Planet/` |
| 🪐 **Glyph Planeta 3D** | 3D planeta se znaky | `Glyph-Planet-3D/` |
| 🖊️ **Glyph Editor** | Kreativní glyph editor | `Michal-AI-Al-Klimek/` |
| 🤖 **Hlavoun** | AI agent průvodce | `Hlavoun/` |
| ☁️ **Oblak** | Cloud PWA | `Oblak/` |
| 👧 **VaFT Girls** | Speciální postava | `VAFT-Girls/` |
| 🐻 **VaFT BearHead** | Medvědí hlava | `VAFT-BearHead/` |
| ☄️ **VaFT Comet** | Vesmírná kometa | `VAFT-Comet/` |
| 🔧 **Chybožrout** | Diagnostika & opravy | `chybozrout-opravar/` |

---

## ⭐ Reward Systém

- Každá správná odpověď ve hrách = **+1 hvězdička**
- Dokončení příběhu = **+2 hvězdičky**
- Hvězdičky jsou uloženy v `localStorage` (přetrvají i po zavření)
- Mini-aplikace mohou posílat hvězdičky přes `postMessage`:
  ```js
  window.parent.postMessage({ type: 'batolete:reward', stars: 1 }, '*');
  ```

---

## 🔄 Navigace z Mini-Aplikace

Pro návrat do Hubu z mini-app:
```js
window.parent.postMessage({ type: 'batolete:back' }, '*');
```

---

## 📱 PWA Instalace

1. Otevři `Batolete/index.html` v prohlížeči
2. V Chrome/Edge: **"Přidat na plochu"** nebo **"Nainstalovat aplikaci"**
3. Na iOS Safari: **Sdílet → Přidat na Plochu**
4. Funguje **offline** po první návštěvě

---

## 🎨 Design Přizpůsobení

Všechny CSS proměnné jsou v `hub-menu.css`:

```css
:root {
  --hub-bg:      #1a1a2e;   /* pozadí */
  --hub-accent:  #e94560;   /* akcent / hover */
  --hub-gold:    #ffd700;   /* hvězdičky, logo */
  --hub-card:    #0f3460;   /* barva karet */
  --hub-radius:  1.2rem;    /* zaoblení rohů */
}
```

Přizpůsob dle libosti! 🎨

---

## 🧠 Technické Poznámky

- **Zero externích závislostí** – vše čisté HTML/CSS/JS
- **Web Audio API** – zvuky bez souborů
- **Canvas** – kreslení tvarů bez obrázků
- **localStorage** – hvězdičky a postup
- **iframe sandbox** – mini-apps jsou izolované, ale bezpečné
- **postMessage** – komunikace hub ↔ mini-app

---

*Batolete × VaFiT × Vivere atque Frui'T*  
*Tvoříme pro českou rodinu, pro každou generaci* 💚🇨🇿
