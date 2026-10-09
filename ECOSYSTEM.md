# Vivere atque Frui'T – ekosystém PWA

Každá aplikace je složka v kořeni repozitáře se samostatnou PWA.

## Nová aplikace – checklist
1. `index.html` s `<link rel="manifest" href="manifest.json">`.
2. `manifest.json` s ikonami `icon-192.png` a `icon-512.png` ve stejné složce.
3. `service-worker.js` – každá položka v precache listu **musí existovat** (jinak se SW neinstaluje).
4. V `index.html` zaregistrovat SW:
   `navigator.serviceWorker.register("./service-worker.js")`.
5. Sdílené skripty načítat přes `../vaft-core.js`, `../vaft.loader.js`, `../vaft.heartbeat.js`
   (pozor: soubor je `vaft-core.js`, ne `vaft.core.js`).

## Validace
`node scripts/validate-pwa.cjs` kontroluje neexistující položky precache,
neexistující lokální skripty, ikony v manifestech a chybějící registraci SW.
Běží v CI (`.github/workflows/pwa-validate.yml`).
