# Architektura

## Přehled

Vivere atque FruiT je v současnosti statický browserový projekt s mnoha samostatnými HTML světy a lehkými JavaScriptovými moduly.

Repozitář nyní používá postupnou strukturu:

1. `src/`
   - vstupní bod repozitáře
   - sdílená prezentace pro uspořádané rozložení
   - explicitní soubor kompatibility `agents_v3.js`
2. `components/`
   - rodinné moduly jako Hlavoun, Viri, Pikos a Bicak
   - každá komponenta si uchovává aktuální implementaci pro prohlížeč nebo prototypové soubory
3. `worlds/`
   - uspořádané kopie hlavních zážitků
   - `VAFT-Center3D` je nyní samostatný se skripty, na které odkazuje
   - `Revia` zůstává seskupena jako vlastní svět
4. `docs/`
   - filozofie, přehled komponent a poznámky k API
5. `assets/`
   - volné obrázky a zip archivy seskupené mimo kořen

## Model běhu

- Projekt se obsluhuje jako statické soubory.
- Browserový JavaScript koordinuje světy a agenty.
- Netlify funkce zůstávají nakonfigurovány přes `netlify.toml` pro endpointy strážce.
- GitHub Pages a statický hosting mohou nadále publikovat z kořene repozitáře.

## Aktuální pravidla migrace

- Zachovávejte existující starší cesty, dokud nebudou jejich odkazy zkontrolovány.
- Přidávejte uspořádané kopie před odstraněním původních souborů z dílny.
- Upřednostňujte malé, reverzibilní přesuny před destruktivním úplným přepisem.
