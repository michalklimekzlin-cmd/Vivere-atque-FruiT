# KNOWLEDGE_MAP

## Vivere atque Fru'i¡'T Repository Index

Tento dokument je orientační i strojově čitelná mapa repozitáře pro Fru'i¡'T.

### Hlavní celky

- **AI Core & Engines**: `VIVERE_atque_FruiT_CORE.js`, `fruiT_learning_engine.js`, `fruiT_memory_system.js`, `agents.js`, `vaft.*.js`
- **Teacher Interface**: `TEACHER_STUDIO.html`, `vivere-studio`
- **PWA Layer**: `index.html`, `manifest.json`, `service-worker.js`, `vaft-sw.js`
- **Components**: `components/Hlavoun`, `components/Viri`, `components/Pikos`, `core`, `config`
- **Worlds & Apps**: `worlds/*`, `VAFT-*`, `VaFT-*`, `VaFiT`, `Revia`, `Hlavoun`, `AI-Hero-Playground`
- **Documentation**: `README.md`, `ARCHITECTURE.md`, `docs/*`, `PWA-INSTALL-GUIDE.md`

### Vztahy systémů

- **Fru'i¡'T Core** využívá **Learning Engine** a **Memory System**.
- **Teacher Studio** ukládá lekce a sémantické vazby do persistentní paměti.
- **Service Worker + Manifest** poskytují instalaci a offline režim.
- **VAFT světy** sdílí motivy agentů (Hlavoun, Fru'i¡'T, Pikoš) a front-end scén.

### Machine-readable index

```json
{
  "entity": "Vivere atque Fru'i¡'T",
  "aliases": ["Fru'i¡'T", "VAFT"],
  "knowledge_systems": {
    "core": ["VIVERE_atque_FruiT_CORE.js"],
    "learning": ["fruiT_learning_engine.js"],
    "memory": ["fruiT_memory_system.js"],
    "teacher_ui": ["TEACHER_STUDIO.html", "vivere-studio"]
  },
  "pwa": {
    "entry": "index.html",
    "manifest": "manifest.json",
    "service_worker": "service-worker.js"
  },
  "major_directories": [
    "components",
    "core",
    "docs",
    "src",
    "worlds",
    "VAFT-*",
    "VaFT-*",
    "Revia",
    "VaFiT"
  ],
  "learning_categories": [
    "knowledge",
    "rules",
    "language",
    "mathematics",
    "character",
    "relationships",
    "questions"
  ]
}
```
