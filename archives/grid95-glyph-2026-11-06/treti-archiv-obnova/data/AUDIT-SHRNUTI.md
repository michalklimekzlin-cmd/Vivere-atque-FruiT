# CHT 360°‰. / GLYPH — kontrola a záchrana souborů

Datum: 6. listopadu 2026. Všechny kroky proběhly pouze na místních pracovních kopiích. Žádná změna na GitHubu, Worku, v telefonu ani na veřejném webu.

## Co bylo skutečně ověřeno

- Menší původní archiv `CHT360-GLYPH-aktualizace-2026-11-06.zip`: platný ZIP, 22 souborů. Obsahuje přidávanou samostatnou komoru GLYPH a instalátor.
- Velký původní archiv `CHT360-GLYPH-komplet-2026-11-06.zip`: **neplatný/nedokončený ZIP**. Chybí centrální adresář a navíc se přerušuje u souboru `assets/images/BCEF2EFE-14E7-4843-8612-E5FE2EEF58E4.png`: očekáváno 3 946 610 komprimovaných bajtů, zbývalo jen 1 085 548 bajtů. Za tímto místem v archivu už nejsou dostupná data. **Nepoužívat jako kompletní zálohu**.
- Z velkého archivu se podařilo bez chyby CRC obnovit **492 celých souborů**. Zachráněné soubory jsou zabalené zvlášť jako *ČÁSTEČNÁ* záchrana, nikoli jako úplná kopie repozitáře. Neobnovovala se nedokončená položka ani nenalezené soubory.
- V zachráněné části byly zálohy čtyř dřívějších klíčových souborů: `docs/index.html`, `docs/js/cht-360-aplikace-2.js`, `docs/service-worker.js` a `docs/offline-cashe-assets.json` uvnitř adresáře `GLYPH-zaloha-pred-zmenou-2026-11-06`.
- Nad těmito čtyřmi soubory byl v **oddělené testovací kopii** úspěšně spuštěn aktualizační skript. První běh vytvořil či upravil 23 souborů a uložil zálohy; při opakovaném spuštění nic dalšího neupravil.
- Syntaktická kontrola přes `node --check` prošla pro všech 12 testovaných JS souborů. 16/16 dostupných souborů nové komory GLYPH odpovídá SHA-256 kontrolnímu seznamu zachráněnému z velkého archivu.
- Aktualizace přidává samostatný `glyph-pamet/` (HTML, CSS, JS, IndexedDB, JSON export/import, místní SW), most k paměti čtyř jader, tlačítko GLYPH, VaFiT rozšíření a zápisy do offline seznamu.

## Otevřené věci a ochrana paměti

- **Nejde o ověření plnohodnotně funkčního CHT.** Přerušený velký ZIP neposkytuje celý živý kořenový `docs/` ani ostatní závislosti a aktiva. Testovací kopie je laboratorní demonstrace instalátoru a nové komory; **nenahrávat jako náhradu plného repozitáře**.
- Browser runtime test se v tomto běhovém prostředí nepodařilo dokončit. Fungování v reálném Safari, iOS IndexedDB, instalace PWA a skutečný offline provoz fyzického iPhonu nebyly ověřeny.
- Nečte se žádná skutečná paměť z tvého iPhonu. Pro data Groku z jiné domény je nezbytný ruční export/import; nesynchronizují se automaticky.
- Aktualizační skript zapisuje do cílové složky. **Nespouštět přímo nad jedinou živou kopií bez samostatné ZIP zálohy a testu.** Je ověřený na výše uvedených záložních souborech, nikoliv na všech případných novějších verzích.
- Před plným připojením GLYPH k CHT je potřeba **neporušená úplná kopie zdrojového repozitáře** a porovnání stavu hlavních souborů s ní. Bez toho by hrozilo vynechání nebo nahrazení již existujících modulů.

## Připravené soubory

1. `CHT360-GLYPH-samostatna-komora-2026-11-06.zip`: samostatné soubory komory GLYPH v kořenu archivu. Neobsahuje celé CHT. Po umístění na HTTPS adresu otevřít `index.html`; bez hostování z něj iPhone neumí nainstalovat PWA. Tlačítka vyžadující hlavní CHT/Batole samostatně fungovat nemusí.
2. `CHT360-GLYPH-testovaci-propojeni-2026-11-06.zip`: výsledek testovací integrace nad čtyřmi obnovenými záložními soubory. Přiložené jsou i nové zálohy. **Není to úplná aplikace**.
3. `CHT360-GLYPH-492-zachranenych-souboru-2026-11-06.zip`: částečná záchrana původního velkého ZIPu; pro archivaci a následné porovnání.

Všechny tři výsledky jsou nové, oddělené soubory. Původní ZIPy se nezměnily. Publikování a změny externích repozitářů neproběhly.
