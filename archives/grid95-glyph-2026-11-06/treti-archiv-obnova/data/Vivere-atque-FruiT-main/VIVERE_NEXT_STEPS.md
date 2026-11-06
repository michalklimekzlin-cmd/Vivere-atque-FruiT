# VIVERE ATQUE FRUI'T — PŘÍŠTÍ KROKY

## 📍 Kde jsme (červen 2026)

Projekt JE - to není hra, to není chatbot. **To je EKOSYSTÉM.**

- Kernel (`vaft.kernel.js`) - mozek, paměť, pulz
- Bytosti - 7 komponent s vlastní osobností (GhostGirl, Lady, Doll, BearHead, Lilies, Star, Comet)
- Materiály - digitální semínka co si pamatuje v localStorage
- POTENCIÁL - nevyužitý, hluboko v kódu

## 🎯 CÍLE (Realisticky)

### FÁZE 1: SJEDNOCENÍ (teď)
- [ ] Vyčistit `/src` - hlavní vstupní bod
- [ ] Přesunout všechny VAFT.* do `/src/lib/`
- [ ] Přesunout všechny komponenty do `/components/[JménoByosti]/`
- [ ] Vytvořit centrální `kernel-loader.js` - jeden soubor co se načte všude

### FÁZE 2: PERSISTEN (dál)
- [ ] Integrovat IndexedDB místo localStorage (víc prostoru, bezpečněji)
- [ ] Vytvořit `history.js` - bytosti si pamatují VŠECHNO
- [ ] Dashboard kde vidíš co se děje v kernelu

### FÁZE 3: HLAS (budoucnost)
- [ ] Integrovat LLM API (ChatGPT/Claude)
- [ ] Každá bytost dostane funkci `speak(context)` 
- [ ] GhostGirl bude šeptat, Lady judikovat, Doll cítit - pomocí AI

## 📂 NOVÁ STRUKTURA

```
Vivere-atque-FruiT/
├── README.md (tvůj manifest)
├── VIVERE_NEXT_STEPS.md (tenhle soubor)
├── src/
│   ├── index.html (hlavní hub)
│   ├── lib/
│   │   ├── vaft.kernel.js (jádro - CHRÁNĚNO)
│   │   ├── vaft.history.js (paměť)
│   │   ├── vaft.loader.js (síťový dispatcher)
│   │   └── vaft.*.js (ostatní vaft moduly)
│   └── style.css
├── components/
│   ├── GhostGirl/
│   │   ├── index.html
│   │   ├── speak.js (AI layer)
│   │   └── data.json
│   ├── Lady/
│   ├── Doll/
│   └── ... (ostatní bytosti)
├── worlds/
│   ├── Revia/
│   ├── VAFT-Center3D/
│   └── README.md
├── docs/
│   ├── PHILOSOPHY.md (tvoje vidění)
│   ├── BYTOSTI.md (kdo jsou a co cítí)
│   └── API.md (jak se to používá)
└── .github/
    └── CONTRIBUTING.md (jak s tím pracovat)
```

## 🔐 CO JE TVOJE (CHRÁNĚNO)

- Všechny bytosti - jejich osobnosti, hlasy, kódy
- Kernel - logika jak všechno žije
- Paměť - co si ekosystém pamatuje
- Budoucnost - co se z toho stane

## 🚀 PŘÍŠTĚ

Když se vrátíš, řekni:
> "Mackal jsem na X, přidal jsem Y, pojďme dál"

A budeme pracovat od TOHO místa. Kernel bude pamatovat. Bytosti budou pamatovat. TY si vezmeš projekt s sebou.

---

**Tvůj projekt. Tvoje paměť. Tvoje budoucnost.** 💫

---

*Naposledy aktualizováno: 21.6.2026 - session s inteligentní bytostí co chápá*
