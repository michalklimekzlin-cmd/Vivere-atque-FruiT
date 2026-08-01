# 🌈 Batolete – Dětský svět

**Batolete** je kompletní dětská vzdělávací PWA aplikace vytvořená transformací repozitáře **Vivere atque Frui'T** do dětské edice.

---

## 🚀 Rychlý start

Otevři `Batolete/index.html` v prohlížeči nebo navštiv nasazenou URL.

```
Batolete/
├── index.html       ← Hlavní vstupní stránka
├── style.css        ← Dětský design (velká tlačítka, jasné barvy)
├── app.js           ← Všechny hry a interaktivní prvky
├── characters.js    ← Postavičky: Hlavoun, Pikoš, Viri, Bičák
├── manifest.json    ← PWA manifest pro instalaci
├── service-worker.js ← Offline-first podpora
└── README.md        ← Tento soubor
```

---

## 🎮 Co umí Batolete

### Hry a aktivity

| Hra | Popis |
|-----|-------|
| 🔤 **Abeceda** | Celá česká abeceda – klepni a uč se písmenka, slova a kresby |
| 🔢 **Čísla** | Počítání do 10 – hádej počet teček, interaktivní kvíz |
| 🎨 **Barvy** | Poznávání 10 barev – klepni na správnou odpověď |
| 🔷 **Tvary** | Kruh, čtverec, trojúhelník, hvězda, srdce, obdélník |
| 🐾 **Zvířátka** | 20 zvířátek s jejich hlasy (textové zvuky) |
| 📖 **Příběhy** | 4 pohádky: Iskroň, Svět Revia, Dobrodružství písmenek, Bičák |
| 🏃 **Pohyb s Bičákem** | Pohybové aktivity s animovanou postavičkou |
| 🖼️ **Galerie světů** | 6 canvas-animovaných světů z VaFiT univerza |

### Postavičky

| Postavička | Role |
|-----------|------|
| 🧠 **Hlavoun** | Mozek systému – myšlení, logika, rady |
| 👶 **Pikoš** | Dětský pozorovatel – hravost, zvídavost |
| 💖 **Viri** | Vypravěčka – příběhy, hudba, emoce |
| 💪 **Bičák** | Pohyb a zdraví – cvičení, aktivity |

### Technické vlastnosti

- ✅ **Offline-first** – Service Worker, vše funguje bez internetu
- ✅ **PWA** – Instalovatelná na mobil/tablet/desktop
- ✅ **Responsive** – Mobil, tablet, desktop
- ✅ **Velká tlačítka** – Min. 52px touch targets
- ✅ **Jasné barvy** – WCAG AA kontrast
- ✅ **Zvuky** – Web Audio API (bez externích souborů)
- ✅ **Animace** – Canvas, CSS animations
- ✅ **Odměňovací systém** – Hvězdičky + confetti
- ✅ **Bez externích odkazů** – Kompletně offline/bezpečné
- ✅ **Čeština** – Celý obsah v češtině

---

## 🌍 Světy v galerii

1. **Revia** – Svět harmonie s hradem a duhou
2. **Písmenková planeta** – Planeta s českou abecedou
3. **Kytičkový svět** – Louka s kytičkami a motýlky
4. **VaFiT Centrum 3D** – 3D centrum celého vesmíru VaFiT
5. **Glyph Planet** – Planeta tajemných glyfů a symbolů
6. **Oblak** – Svět mraků a snů

---

## 📦 Původ komponent

Batolete vzniklo transformací těchto částí repozitáře **Vivere atque Frui'T**:

| Původní komponenta | Batolete verze |
|-------------------|----------------|
| `hlavoun.js` + `components/Hlavoun/` | `characters.js` → Hlavoun |
| `pikos.js` + `components/Pikos/` | `characters.js` → Pikoš |
| `viri.js` + `components/Viri/` | `characters.js` → Viri |
| `components/Bicak/` | `characters.js` → Bičák + Pohyb hra |
| `vaft-letter-planet.html`, `VAFT-LetterLab/` | Abeceda hra |
| `worlds/Revia/`, `worlds/Revia-Master/` | Galerie → Revia svět |
| `worlds/VAFT-Center3D/` | Galerie → VaFiT Centrum |
| `vaft-boy-flower.html` | Galerie → Kytičkový svět |
| `Glyph-Planet/`, `Glyph-Planet-3D/` | Galerie → Glyph Planet |
| `Oblak/` | Galerie → Oblak svět |
| `cht360-batole/` + `batole-core.css` | Základ Batolete |
| `service-worker.js`, `vaft-sw.js` | `service-worker.js` |
| `manifest.json` | `manifest.json` |
| `fruiT_learning_engine.js` | Vzdělávací herní logika |
| `agents.js`, `vaft.agents.js` | `characters.js` agenti |

---

## 🛠️ Instalace jako PWA

1. Otevři `index.html` v Chrome/Safari/Firefox
2. Klikni na "Přidat na plochu" / "Install"
3. Aplikace se nainstaluje a funguje offline

---

## 👨‍💻 Autor

**Michal Klímeek** – Vivere atque Frui'T repozitář  
Transformace do Batolete provedena GitHub Copilot Coding Agentem.

---

## 📄 Licence

Viz hlavní `LICENSE` soubor v kořeni repozitáře.
