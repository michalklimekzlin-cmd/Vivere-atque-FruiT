# CHT 360°‰ Developer Guide

## Sdílená vrstva

- `docs/js/cht-360-config.js` — autoritativní tokeny, breakpoints, registry modulů a storage klíče
- `docs/js/cht-360-navigation.js` — určení aktivního modulu, breadcrumbs, zpět/domů logika
- `docs/js/cht-ui-components.js` — shell, toasty, dialogy, potvrzení, loading label, Escape close
- `docs/js/cht-360-logger.js` — lokální logování do konzole i `localStorage`
- `docs/js/cht-360-performance.js` — základní měření a evidence synchronizace

## Jak přidat nový modul

1. Přidej modul do registru v `cht-360-config.js`.
2. Připoj sdílené skripty do HTML stránky modulu.
3. Pokud modul používá potvrzení nebo loading label, přidej `data-cht-confirm` a `data-cht-loading-label`.
4. Pokud modul zapisuje stav do localStorage, doplň jeho klíče do konfigurace.

## Eventy a synchronizace

- `storage` event mění stav synchronizace shellu
- `BroadcastChannel("cht360-ui-shell")` přenáší vizuální upozornění mezi kartami
- `Escape` zavírá sdílený dialog i existující modální prvky aplikací

## Debugging

Logy i měření se ukládají lokálně a jsou čitelné přes tlačítko `Ladění`.
