# FIXES_SUMMARY

1. **Service workers**: removed non-existent `./style.css` from `PRECACHE_URLS` in 32 `service-worker.js` files (so `cache.addAll` no longer fails).
2. **`vaft.core.js`**: references `../vaft.core.js` in 8 `index.html` files (Braska-Hlava, Meziprostor-Core, VAFT-BearHead, VAFT-Doll, VAFT-GhostGirl, VAFT-Girls, VAFT-Lady, VAFT-StarSkull) now point to the existing `../vaft-core.js`. VAFT-Game had no such reference.
3. **SW registrations**: Braska-Hlava, VaFT-Planets-SignalCore and worlds/Revia-Master already register `./service-worker.js` (which exists); no change needed.
4. **Icons**: generated minimal solid-colour placeholder PNGs (sized per manifest, colour from `background_color`) for 120 icon references that were missing.
5. **Dead code removed**: `vaft-sw.js`, `vaft-swloader.js`, `vaft.apps.js`, `index-old.html`, `index-old2.html`, `indexR.html`, `index_opraveny.html`.
