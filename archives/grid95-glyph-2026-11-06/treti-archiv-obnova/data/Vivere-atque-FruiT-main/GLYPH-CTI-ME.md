# CHT 360°‰. + GLYPH · paměť v písmenkách

Hotový místní balíček, verze 2.0.0 · 6. listopadu 2026.

## Co otevřít

Hlavní aplikace je `docs/index.html`. Vlevo dole má tlačítko **⟦ GLYPH · Paměť ⟧**. Komoru lze otevřít i samostatně přes `docs/glyph-pamet/index.html`. Do hlavního CHT se vrací tlačítkem v záhlaví. Tlačítko **◉ VaF’¡¡’T** otevírá již připravené rozšíření s 25 bubínky, záznamy a českými lekcemi.

ZIP obsahuje celou dostupnou kopii projektu, nikoliv jen ukázku čtyř planet. Vychází z uloženého archivu `Vivere-atque-FruiT-main-uprava-bubinky.zip` z 31. 10. 2026 a doplňuje místní rozšíření z 6. 11. 2026. Není tvrzením o aktuálním obsahu živého GitHubu.

## Použití

1. V **Příjmu GLYPH** vlož označenou zprávu nebo vlastní text. Vyber jádro a znaky, například `I, i, l, O, o, 0`. Klepni **Rozpoznat a uložit**. Označené bloky mohou zadat jádro i písmenko štítky `jadro:jazyk,pismeno:O`.
2. V **Komoře** vyhledávej a filtruj přesná písmenka. Velikost znaků se rozlišuje, složený glyph zůstává jedním celkem. Jedna vzpomínka může mít více znaků. Lze ji upravovat, připínat a spojovat s dalšími.
3. Otevři vzpomínku a zvol **Do volného slotu jádra**. Použije se první prázdný slot z příslušných 70. Před zápisem vznikne snímek původních klíčů. Zaplněné jádro se nepřepisuje. Opakovaný přenos stejné uložené verze neobsadí další slot.
4. **Naučit Batole** funguje při otevření komory z hlavního CHT, kde je skutečné Batole připojené. Jedna lekce má nejvýše 1100 znaků, aby ji starší Batole nezkrátilo. Dlouhý originál zůstává v komoře.
5. Ve **Výdeji do chatu** vyber téma, jádro nebo označené vzpomínky a rozpočet znaků. Zkopíruj výstup do chatu. Částečný výpis je označený a nemění uložený originál.
6. V **Zálohách a koši** stáhni úplnou zálohu. Obsahuje nové záznamy, jejich vazby, koš, historii a dostupné vyjmenované klíče CHT včetně jader a Batolete. Nejde o univerzální export všech databází všech sourozeneckých PWA.

## Import a historie

Podporované vstupy: původní `glyph-komora.json` z Groka; nový export GLYPH v2; paměť CHT s `cores`; export rozšíření VaFiT v1; `conversations.json` nebo ZIP export ChatGPT; TXT a Markdown. ZIP import přijímá export konverzací, nikoliv libovolný ZIP se zdrojovými soubory. Soubor má limit 50 MB; jeden záznam dva miliony znaků.

Před importem uvidíš počty přidávaných záznamů a přesných shod. Shodné ID s jiným obsahem vytvoří další verzi; původní záznam se zachová. Rozlišuje se text včetně velikosti písmen, zdroj, název, jádro, znaky, štítky a připnutí. Historie se ukládá ve stejné transakci jako změna. Vrácení ze snímku přidává jeho obsah k aktuálnímu stavu. Smazání přesune záznam do vratného koše.

Původní klíče přinesené souborem se uchovají ve snímku; nepřepisují se jimi automaticky živé sloty. Jejich obsazené sloty lze obnovit jako záznamy komory a následně vybrané záznamy přenést do volných míst. Původní JSON zůstává v historii.

Tlačítko **Načíst dostupnou paměť CHT** čte stejné úložiště a předchozí databázi rozšíření na stejné adrese. **Načíst místní GLYPH** umí původní databázi `glyph-vault`, pokud existuje na této adrese. Pro data z adresy `grok.me` použij export ze staré aplikace a jeho import sem; různé adresy nemají společné úložiště.

## Offline a iPhone

Nová komora má místní skripty, písma systému, místní čtečku ZIP, manifest, ikony a vlastní service worker. Její soubory jsou rovněž zařazené do původní offline vrstvy CHT. Nová cache maže pouze své starší verze. Úložiště záznamů je IndexedDB `CHT360GlyphMemory`; v omezeném prostředí se použije vlastní klíč localStorage `cht360_glyph_memory_v2`. Chyba nebo nedostatek místa se oznámí, nehlásí se falešné úspěšné uložení.

PWA se na iPhonu instaluje po otevření přes HTTPS: **Sdílet → Přidat na plochu**. Samotné rozbalení ZIPu v aplikaci Soubory nezpřístupní Safari plnohodnotnou PWA. Pro práci na počítači lze použít `python3 -m http.server 8080 --directory docs`; místní `localhost` umožňuje PWA. Před cestou offline nech první otevření dokončit a zkontroluj text **Offline vrstva připravená**. Tato úprava nebyla publikovaná ani nahraná do GitHubu.

Žádný nový modul nepřipojuje cloudovou AI. Ukládání informací do písmenek je náš místní způsob organizace záznamů; není to přepis vnitřní paměti ChatGPT či Groka. Most pro prohlížeč přenese viditelný přepis až po ručním spuštění a příjem čeká na uložení. Na iPhonu je přímočaré vložit text nebo importovat soubor.

## Ověření

- 20 testů rozpoznávání, konfliktů, importů, výdeje, zachování obsahu a volných slotů prošlo.
- 4 testy offline souborů a service workeru se simulovanou nedostupnou sítí prošly; cache cizích aplikací se zachovala.
- 8 prohlížečových zkoušek na oddělené databázi prošlo: 20 souběžných zápisů ze dvou instancí, přerušení transakce, snímky, chybný import, konflikt historie, opětovné čtení, šířka 390 px a velikost vstupů pro iOS.
- Přes skutečné rozhraní prošlo vložení dvou glyphů, propojení vzpomínek, obnovení stránky, výdej, zápis do skutečných jader, přijetí lekce Batoletem, import původního GLYPH, přesun do koše, obnova a stažení zálohy. Stažený JSON měl 3 záznamy, jednu vazbu, 9 snímků a klíče jader i Batolete.
- Náhled běžel na HTTP bez bezpečného kontextu. Skutečná instalace service workeru a offline otevření na fyzickém iPhonu nejsou ověřené. Stejně tak není nově prověřen každý starší modul celé uložené kopie projektu.

Testy: `node --test tests/glyph-memory.test.mjs tests/glyph-offline.test.mjs`. Pro zkoušky databáze a mobilního rámu spusť `python3 tests/prepare-browser-checks.py` a přes místní server otevři `glyph-pamet/qa/runtime.html`. Testy používají vlastní databázi s příponou QA.

## Původ a návrat

Rozpoznávání bloků, textové pomůcky a seznam světů jsou adaptované ze zaslaného `grok-workspace.zip`. Úplný původní archiv je v `zdroje/grok-workspace-puvodni.zip`. Nová vrstva přidává přiřazení znaků a čtyř jader, transakční historii, bezpečné slučování a skutečné propojení s CHT. V původním Grokově React projektu se v tomto balíčku neprováděla nová sestava; původní zdroje jsou zachované jako podklad.

Před změnami existujících souborů vznikly souborové zálohy v `GLYPH-zaloha-pred-zmenou-2026-11-06/` a `docs/CHT360-VaFiT-zaloha-pred-instalaci-*/`. Obnovením původního indexu, hlavního skriptu a service workeru ze zálohy se vrátí původní spouštění. Obsah skutečné paměti telefonu se nikdy nezapisuje do zdrojového ZIPu; chraň jej vlastním JSON exportem.
