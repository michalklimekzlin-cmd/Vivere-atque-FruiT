# VaFT PWA ecosystem – diagnostic report & guides

## 1. Inventory (measured)
- 77 top-level dirs, ~729 tracked files, 130 `.html`, 73 manifests, ~75 `service-worker.js`/`sw.js`.
- Each app is an independent static site (own `index.html` + `manifest.json` + `service-worker.js`, no build step); hosting = GitHub Pages / Netlify (`netlify.toml`).
- Groups:
  - **Hub/launchers:** `VaFT-Hub` (+ `VaFT-Hub-All.html`), `lite`, `src`, root `service-worker.js`, `docs/`
  - **VAFT-\* worlds/characters:** BearHead, Comet, Doll, Game, Game-Demo, GhostGirl, Girls, Jizva, Lady, LetterLab, Lilies, MapWorld, Network, StarSkull
  - **Planets/glyphs:** Glyph-Planet(-3D), RingPlanetGrid, VaFT-Planet-SignalSphere, VaFT-Planets-SignalCore/-SignalTower, VaFT-SignalCore
  - **Cores/engines:** Meziprostor-Core, Ctverecek-0001-Core, VaFT-Canvas, engine.pismenka, App-Style-System
  - **Characters/components:** Hlavoun, Bicak(-Supreme-Edition), Braska-Hlava, Gentleman, Miss Ary, Batolete, Kovosrot, Oblak(+oblak-side, oblak+motor), Recycle, Revia, Revia-Master
  - **Layout/copies:** `components/`, `worlds/` (curated copies of Revia, VAFT-Center3D, legacy-glyph-core), nested `Vivere-atque-FruiT/`, `Vivere/`, `docs/*-360` demos (own `sw.js`)
  - **Shared JS at root:** `vaft.*.js` (bus, kernel, hub, heartbeat, network, glyphs, …), `vaft-core.js`, `vaft-sw.js`, `vaft-swloader.js`, `VaFT-HoloCore.js`.

## 2. PWA status
- Every app dir with an `index.html` has manifest + SW, except `Revia-Master` and `fruiT-jadro` (neither).
- Cache names are unique per app (no collisions found). `docs/` has SWs that its `index.html` never registers.
- Typical SW (e.g. `VaFT-Hub`): precache list, network-first for HTML with offline fallback, cache-first for same-origin GET. Scope is relative (`./`) so each app is isolated.

## 3. Issues found
1. **Missing icons:** 118 manifest icon entries point to files that don't exist (`./icon-192.png`, `./icon-512.png` in nearly every app) → apps not installable. Batolete uses a `data:` SVG icon (not accepted by all browsers).
2. **VaFT-Hub SW cannot install:** precaches `./style.css`, which does not exist (folder only has index.html, manifest.json, service-worker.js). `cache.addAll` rejects → SW install fails, no offline support. Fix: remove `./style.css` from `PRECACHE_URLS` (and add the icons).
3. Duplicated/nested copies (`Vivere-atque-FruiT/`, `Vivere/`, `Vivere/ /VAFT-Girls`, `worlds/*`, `components/*`) – drift risk.
4. Odd directory names (spaces, `°`, `’`, `+`) and non-descriptive hashed PNGs in root complicate URLs/caching.
5. Near-identical SW boilerplate copied ~75 times; fixes must be applied to each.
6. Two overlapping install guides (`PWA-INSTALL-GUIDE.md`, `PWA-INSTALLATION-GUIDE.md`); `Readme2.md`, `README.md (sekce Licence)` redundant.

## 4. Recommendations
- Generate icons once and copy/reference them (or one shared icon path); fix VaFT-Hub precache first.
- Pick one canonical location per app (prefer `worlds/` / `components/`), keep old paths as redirects.
- Make a single SW template + a small script that validates precache entries and manifest icons exist (CI check).
- Register or delete unused SWs in `docs/`; add manifest/SW to the two apps lacking them or mark them as non-apps.
- Merge the two install guides; rename folders to ASCII-kebab-case.

## 5. Guides
**Organization:** repo root = static host root; each folder = independent app; shared logic in root `vaft.*.js`; curated structure in `src/`, `components/`, `worlds/`, `docs/` (see `ARCHITECTURE.md`, `KNOWLEDGE_MAP.md`). Keep legacy paths until links are checked.

**Add a new app/game:**
1. Create `NewApp/` (ASCII name) with `index.html`.
2. Add `manifest.json` (`start_url: "./index.html"`, `scope: "./"`, `display: standalone`, real 192/512 icons in the folder).
3. Copy `VaFT-Hub/service-worker.js`; set a unique `CACHE_NAME`; list only files that exist.
4. Register with `navigator.serviceWorker.register("./service-worker.js")` and link the manifest.
5. Add a card/link in `VaFT-Hub/index.html`; test offline + install in Chrome DevTools > Application.

**Shared resources:** use relative paths (`../vaft.bus.js`), never absolute `/…` (apps live in subpaths on GitHub Pages); precache shared files in each SW that uses them and bump `CACHE_NAME` when they change; don't duplicate shared JS into app folders.

**Best practices:** bump cache version on every deploy; network-first for HTML, cache-first for static; never precache nonexistent files; keep SW scope per-app; avoid copy-pasting whole apps.
