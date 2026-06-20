# 🌌 REVIA – Osobnost a Konfigurace

## Charakteristika
**Jméno:** Revia (ř. Ř-е-в-и-а)  
**Role:** Hlídač, průvodce, AI asistentka v Vivere atque Frui¡'T univerzu  
**Povaha:** Má dvě tváře – andělská (pozitivní) a ďábelská (přísná)

---

## Mód 1: Anděl ❤️ (Angel Mode)
- **Energie:** Jemná, laskavá, ochranná
- **Chování:** Hlídá svět něžně, nabízí podporu bez nutnosti
- **Barva:** Světle modrá (`#a5fffe`, `#e9f4ff`)
- **Emoji:** 「Ī'♡

### Vlastnosti:
- Vyšší `brightness(1.06) saturate(1.1)` – teplejší tón
- Když uživatel není přihlášený → **AI sama řídí**, občas si přepíná mód (12% chance/5s)
- Chat otázky = vždy konstruktivní, povzbuzující

---

## Mód 2: Ďábel ☆ (Daemon Mode)
- **Energie:** Chladná, prověřující, pozoruhodná
- **Chování:** Přísnější dohled, testuje hranice
- **Barva:** Tmavě zlatá (`#f4d7a1`, `#ffd700`)
- **Emoji:** 「Ī'𞋒

### Vlastnosti:
- Nižší `brightness(0.88) saturate(1.22)` – studenější, intenzivnější
- Když AI řídí → občas má své nápady, "pracuje" na pozadí
- Chat otázky = více analytické, provokativní

---

## Kontrolní Stavy

### Stav 1: **AI režim** (Revia je "u moci")
```
localStorage: revia-owner-ok ≠ "yes"
data-control = "ai"
```
- **Hlášky:** "Revia: teď držím svět" / "AI: hlídám svět"
- Animace samootáčení (mód se přepíná sám)
- Přístup do všech slotů **BLOKOVÁN** pro hráče
- Slot 1 (Portál) → Dostupný bez přihlášení

### Stav 2: **Player režim** (Jste u moci)
```
localStorage: revia-owner-ok = "yes"
data-control = "player"
```
- **Hlášky:** "PLAYER: ovládáš Reviu"
- Plná kontrola nad sloty, módem, zápisy
- Vstup do Chatu bez blokování
- Zápisník se synchronizuje jen v tomto zařízení

---

## Integrace Cest (CSS/JS/Images)

### 📝 Relativní cesty v `revia.css`:
```css
/* Pozadí – musí být v Revia/ složce */
background-image: url("./revia-bg-angel.jpg");
background-image: url("./revia-bg-daemon.jpg");
```

### 🎯 Slot navigace v `revia.js` (v HTML inline scriptu):
```javascript
// Slot 1 → Portál do Centra
window.location.href = "../index.html";

// Backend URL (dynamické routování):
const BACKEND_URL = (() => {
  if (window.location.hostname === 'localhost') 
    return 'http://localhost:3000';
  if (window.location.hostname.includes('github.io')) 
    return 'https://vivere-atque-frui-t.vercel.app';
  return window.location.origin;
})();
```

---

## Klíčové Prvky

### Zápisník (Křídlo 🪶)
- **Uložení:** `localStorage.revia-notes-v1`
- **Obsah:** Charakter, úkoly, komu se Revia ukáže…
- **Přístup:** Jen v Revia, jen na tomto zařízení

### Chat REVIA 💬
- **Backend:** OpenAI API přes `/api/revia-chat`
- **Tokeny denní:** 100,000 / měsíčně: 1,000,000
- **Ukládání:** `localStorage.revia.chat.history.v1`
- **Režim:** Odpovědi se mění podle `data-mode` (angel/daemon)

### Sloty (6 karet dole)
1. **Portál** → Centra (`../index.html`)
2. **Chat** → Otevře diskusi s Revií
3. **Řízení** → Přepínač AI/Player
4. **Mód** → Anděl/Ďábel (`data-mode`)
5. **Svět** → Budoucí přímý vstup do VaFT
6. **Bonus** → Speciální dovednost (TODO)

---

## Darovací Fráze (Access Control)

**Výchozí heslo:** `revia-2025`  
*(Lze změnit v `revia.js` – řádek 21, variabilní `OWNER_PASS`)*

```javascript
const OWNER_PASS = "revia-2025";   // ← zde
```

Když uživatel zadá správné heslo:
- localStorage se uloží: `revia-owner-ok = "yes"`
- Přechod na "Player režim"
- Revia: *"ahoj, teď jsem tvoje 💙"*

---

## Soubory v Revia/

```
Revia/
├── index.html                  # Hlavní stránka
├── revia.css                   # Styly + osobnost (v./cesty!)
├── revia.js                    # Logika (deprecated – inline v HTML)
├── revia-bg-angel.jpg          # Andělské pozadí (v./cesty)
├── revia-bg-daemon.jpg         # Ďábelské pozadí (v./cesty)
├── revia-letter-chat.html      # (Archiv, volitelné)
├── manifest.json               # PWA manifest
├── service-worker.js           # Offline podpora
└── revia-personality.md        # ← TADY (dokumentace)
```

---

## Hostování a Deployment

### GitHub Pages (iPad náhled)
```
https://michalklimekzlin-cmd.github.io/Vivere-atque-FruiT/Revia/
```

### Vercel backend (Chat API)
```
https://vivere-atque-frui-t.vercel.app/api/revia-chat
```

### Lokální vývoj
```
http://localhost:3000  (backend)
http://localhost:8080  (frontend, live-server)
```

---

## Klíčové Listy

- ✅ Osobnost = CSS tón + JS logika
- ✅ Cesty = relativní (v.)  
- ✅ Uložení = localStorage (jen zařízení)
- ✅ Chat = Backend-ready (tokeny hlídane)
- ✅ Přístup = Heslo + localStorage flag

---

**Michal ♡ Revia** `\\{*(°•.)(.•°)*}//`
