# VaF’i’T Paměť • grid95 × grid96

Nový samostatný **offline-first** modul pro Vivere atque FruiT / CHT 360°‰., vytvořen 2026-11-06.

## Co je zde
- `seed.json` – pouze neosobní projektové poznatky poskládané ze zachovaných souhrnů rozhovorů a ověřeného repozitáře; každá položka nese stav.
- `index.html` + `app.js` – místní poznámky v IndexedDB, import **jen chybějících ID** (nepřepisuje staré), JSON záloha, Markdown pro Obsidian.
- `sw.js` + `manifest.webmanifest` – samostatná PWA se samostatným offline cache scope.
- Čtení původních CHT localStorage klíčů **pouze na výslovné kliknutí** při stažení zálohy, bez zápisu do nich.

## Jak používat
Otevři `https://michalklimekzlin-cmd.github.io/Vivere-atque-FruiT/docs/grid95-pamet/` v Safari. Při první návštěvě online se data a stránka nacachují. Poté můžeš psát offline. Nové zápisy se automaticky NEpublikují na GitHub.

## Obsidian
Zvol **název místního vaultu** přímo na stránce a ulož jej v zařízení. U každého záznamu je tlačítko **Do Obsidianu**, které na iPhonu použije `obsidian://new` (jen po výslovném klepnutí). Obsidian pak poznámku vytvoří ve zvoleném vaultu; ověř její uložení v aplikaci. Dlouhé poznámky předá přes iOS Sdílet / soubor `.md`. **Nejde o automatickou dvousměrnou synchronizaci:** CHT neumí číst obsah vaultu, ChatGPT nemá přístup k lokálním souborům iPhonu. Vault název se ukládá jen do localStorage.

Klikni **Export Obsidian .md** a vlož stažený soubor do vlastní offline složky vaultu. Je to obyčejný Markdown, bez potřeby pluginu. Pro původní projekty můžeš použít export JSON.

## Důležitá omezení
- Uložená data jsou svázána s webovým původem/profilem a někdy i konkrétní instalací PWA; **ChatGPT nemá přímý přístup k místní IndexedDB**. Při další tvorbě přilož JSON nebo Markdown export.
- Jedno vlákno/účet nemá automaticky přístup k rozhovorům z jiných účtů. Přesun vyžaduje export.
- Pravidelně exportuj JSON, zvlášť před vymazáním Safari.
- Veřejné GitHub soubory **nikdy** nepoužívej pro soukromé nebo citlivé zápisy. Používej pouze místní aplikaci a soukromé zálohy.
- Stávající `cht360_pamet_v1` a 280 slotů tento modul nijak nemění.
- `seed.json` není přepis kompletních konverzací ani dokonalá rekonstrukce historie; obsah je užitečný, ale vždy můžeš opravit stav/interpretaci.

## Cíl
Dlouhodobá přenositelná projektová paměť: Grid95 + Grid96, čtyři jádra, CHT 360°‰., Batole, Mluva, Glyphy, Revia, bubínky a 101–7O7.
