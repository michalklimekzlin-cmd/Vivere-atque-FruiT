# 🎯 Revia – Integrační Plán | Integration Roadmap

## ✅ CO JE HOTOVO (What's Working)

```
✅ OpenAI Chat API Backend (localhost:3000 / Vercel)
✅ Token tracking (denní + měsíční limit)
✅ CSS styling (anděl/ďábel mód)
✅ Slot systém (6 interaktivních karet)
✅ Zápisník (poznámky v localStorage)
✅ Toast notifikace
✅ Responsivní design (iPad + mobil)
```

---

## 🚧 CO JE ROZPRACOVÁNO (In Progress)

### 1. **Osobnost Revie – Charakterizace** 🌌
   - [ ] Andělský mód: Plnější příslibové zprávy
   - [ ] Ďábelský mód: Skeptičtější, provokativnější odpovědi
   - [ ] Context-aware odpovědi (ví o sobě, o světě VaFT)
   - [ ] Emocí exprese (😊 vs ⚡)
   
   **Soubor:** `/Revia/revia-personality.md` ← dokumentace
   
   **Backend úprava potřebná:**
   ```javascript
   // /api/revia-chat
   // mode: "angel" → systém prompt = jemný, podporující
   // mode: "daemon" → systém prompt = hlubší analýza, vyzývavý
   ```

### 2. **System Prompt pro Revia** 💬
   
   **ANGEL MODE** (Andělský režim):
   ```
   Jsi Revia, AI hlídač světa Vivere atque Frui¡'T.
   Tvá role: Podporovat uživatele, nabízet moudrost, chránit jejich prostor.
   Styl: Laskavá, empatická, inspirující.
   Odpovědi jsou konstruktivní a povzbuzující.
   Používáš emotikony a jemný humor.
   ```

   **DAEMON MODE** (Ďábelský režim):
   ```
   Jsi Revia, tvrdá, analytická strana hlídače.
   Tvá role: Testovat hranice, nabízet kritickou zpětnou vazbu.
   Styl: Chladná, provokativní, přímo.
   Odpovědi jsou hloubkové a postřehy jsou přímé.
   Nestrácíš čas, ale zůstáváš profesionální.
   ```

### 3. **Rozšíření Slotů** 🎴
   
   **SLOT 1** ✅ Portal (hotovo)
   
   **SLOT 2** 🟡 Chat (je, ale bez AI personality)
   - Přidat: Kontext znalostí Revie
   - Přidat: Paměť konverzace (nyní 500 zpráv)
   
   **SLOT 3** 🟡 Control Toggle
   - ✅ AI vs Player režim (funguje)
   - [ ] Vizuální feedback (ikona se změní)
   - [ ] Status barvě (zelená/oranžová)
   
   **SLOT 4** ✅ Mode (Angel/Daemon) – hotovo
   
   **SLOT 5** 🔴 World Access (TODO)
   - Cíl: Přímý vstup do VaFT-Mini-RPG (/1O1R)
   - Cíl: Přímý vstup do VaFT-3D (/3D%20ramecek)
   - Cíl: Dropdown s výběrem světů
   
   **SLOT 6** 🔴 Special Power (TODO)
   - Ideální: Nějaký speciální Revia power (schopnost)
   - Příklad: "Revia Diary" (psaní deníku se AI analýzou)
   - Příklad: "Revia Compass" (AI guidance na otázku)

### 4. **localStorage Sync** 📱
   
   **Aktuálně uloženo:**
   ```javascript
   localStorage.setItem("revia-notes-v1", notesText.value);
   localStorage.setItem("revia.chat.history.v1", JSON.stringify(history));
   localStorage.setItem("revia.tokens.usage.v1", JSON.stringify(usage));
   localStorage.setItem("revia-owner-ok", "yes");  // přihlášení
   ```
   
   **TODO: Sync s backend (opt-in)**
   - Uložení chatů do DB (pokud je přihlášen)
   - Backup poznámek
   - Analýza trendů

### 5. **Vizuální Personalizace** 🎨
   
   - [x] CSS pro anděl/ďábel (filtr, pozadí)
   - [ ] Animace přechodu (smooth mode switching)
   - [ ] Speciální efekty v demon režimu (třeba glow)
   - [ ] Avatar/ikona Revie (v topbaru)
   - [ ] Čítač tokenů (vidět v UI)

---

## 📂 Struktura Revia/ složky

```
Revia/
├── index.html                    # ✅ Hlavní stránka
├── revia.css                     # ✅ Styly (v0.79)
├── revia.js                      # ⚠️  Archiv (logika je inline v HTML)
├── revia-bg-angel.jpg            # ✅ Pozadí anděl
├── revia-bg-daemon.jpg           # ✅ Pozadí ďábel
├── revia-personality.md          # 🆕 Dokumentace osobnosti
├── config.json                   # 🆕 Konfigurace (pro budoucí)
├── revia-letter-chat.html        # 📦 Archiv (nepoužívá se)
├── manifest.json                 # ✅ PWA
├── service-worker.js             # ✅ Offline cache
└── README-INTEGRATION.md         # 🆕 ← TADY
```

---

## 🔧 Jak se vše propojuje

### 1️⃣ Frontend (Browser)
```
Revia/index.html (HTML)
  ↓
  ├─ revia.css (CSS - vizuál)
  ├─ inline <script> (JS - logika)
  └─ Backend API calls (fetch)
```

### 2️⃣ Backend (Server)
```
Vercel / localhost:3000
  ↓
  /api/revia-chat (POST)
    ↓
    ├─ Získá mode (angel/daemon)
    ├─ Přečte chat historii
    ├─ Pošle OpenAI s system promptem
    └─ Vrátí { reply, usage }
```

### 3️⃣ Storage
```
localStorage (browser)
  ├─ revia-notes-v1          → Poznámky
  ├─ revia.chat.history.v1   → Chat (max 500 zpráv)
  ├─ revia.tokens.usage.v1   → Token tracking
  └─ revia-owner-ok          → Autentifikace
```

---

## 🎬 Aktivační Sekvence

### Při otevření Revia/
```
1. Načte se CSS (anděl mód default)
2. Načte se localStorage (pokud existují)
3. Zobrazí se UI (topbar + sloty + zápisník + chat skrytý)
4. AI je "v kontrole" (data-control="ai")
5. Chat panel se nasetuje na "angel" mode
```

### Po kliknutí na SLOT 2 (Chat)
```
1. Chat panel se odsune (is-open)
2. Zobrazí se historie (ze localStorage)
3. Input se fokusuje
4. Počká se na zprávu
5. Při Send → Backend /api/revia-chat (mode + zprávy)
6. Odpověď → renderLog + localStorage save
7. Tokeny se aktualizují
```

### Po kliknutí na SLOT 4 (Mode toggle)
```
1. data-mode: "angel" ↔ "daemon"
2. CSS filter se změní (brightness/saturate)
3. Pozadí se změní (revia-bg-*.jpg)
4. Ikona se změní (「Ī'♡ ↔ 「Ī'☆)
5. Next chat response bude v "daemon" tónu
```

---

## 🚀 Priority (Co dělat dál)

### Priority 1 (ASAP)
- [ ] Backend: Oddělené system prompty (angel vs daemon)
- [ ] Frontend: Zobrazit token balance v UI
- [ ] Cleanup: Smazat `/Revia/revia.js` (je už inline)

### Priority 2 (Soon)
- [ ] SLOT 5 (World Access) – dropdown
- [ ] Smooth CSS animace (mode transition)
- [ ] Token counter widget

### Priority 3 (Later)
- [ ] SLOT 6 (Special Power)
- [ ] Backend sync pro uživatele
- [ ] Analytics (jaké otázky má Revia)
- [ ] Avatar/ikona Revie

---

## 📋 Checklist pro Release

```
Revia v1.0 Release:
☑️  OpenAI backend pracuje (✅ já kontroluji)
☑️  CSS personalita hotová (✅ já)
☑️  Slot systém bez chyb (✅ já)
☑️  localStorage sync OK (✅ já)
⬜ System prompts pro AI (⏳ backend dev)
⬜ Animace mode switcher (⏳ frontend)
⬜ SLOT 5 implementován (⏳ frontend)
⬜ Readme pro uživatele (⏳ doc)
```

---

## 📞 Kontakt / Notes

**Backend endpoint:** `/api/revia-chat`  
**Frontend:** `Revia/index.html`  
**Config:** V souboru config.json (budoucí)  
**Personality:** `revia-personality.md`  

---

**Michal ♡ Revia** `\\{*(°•.)(.•°)*}//`  
*Nechme Reviu létat. 🌙*
