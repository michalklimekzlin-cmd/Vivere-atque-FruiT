# Revia-Master

Nová master PWA aplikace `worlds/Revia-Master/` s dualitou **Angel (❤️)** a **Dark (☆)**.

## Co obsahuje

- oddělené chat historie (`localStorage`) pro Angel a Dark
- český command systém (např. „Angel, hlídej kód“, „Dark, analyzuj strukturu“)
- Repository Hub: Components / Worlds / Docs / Source Code
- sdílené poznámky pro obě entity
- AI Learning dashboard s průběhem učení
- PWA podpora (`manifest.json`, `service-worker.js`)

## Struktura

- `index.html` – hlavní aplikace
- `revia-master.css` – jednotný design a přepínání motivu
- `revia-angel.js` – logika Angel
- `revia-dark.js` – logika Dark
- `revia-command.js` – české příkazy
- `revia-repo-hub.js` – data a render hubu repozitáře
- `manifest.json` – PWA manifest
- `service-worker.js` – offline cache
- `assets/` – pozadí a ikony
