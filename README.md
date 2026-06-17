# Vivere atque FruiT

Vivere atque FruiT je rostoucí statický webový projekt o budování světů, spolupráci člověka a umělé inteligence a etickém digitálním experimentování.

Repozitář nyní udržuje přehlednější strukturu projektu a zároveň zachovává původní soubory z dílny.

## Struktura projektu

```text
.
|-- README.md
|-- ARCHITECTURE.md
|-- SETUP.md
|-- CONTRIBUTING.md
|-- LICENSE
|-- src/
|   |-- index.html
|   |-- agents_v3.js
|   `-- styles/
|-- components/
|   |-- Hlavoun/
|   |-- Viri/
|   |-- Pikos/
|   `-- Bicak/
|-- worlds/
|   |-- Revia/
|   |-- VAFT-Center3D/
|   `-- others/
|-- docs/
|   |-- PHILOSOPHY.md
|   |-- COMPONENTS.md
|   `-- API.md
`-- assets/
```

## Co je součástí

- `src/` obsahuje nový uzel repozitáře a explicitní soubor `agents_v3.js` vyžádaný pro uspořádané rozložení.
- `components/` sdružuje základní rodinné moduly a jejich aktuální soubory pro prohlížeč.
- `worlds/` obsahuje uspořádané kopie hlavních herních světů.
- `docs/` obsahuje jednoduchou a přehlednou dokumentaci projektu.
- `assets/` sdružuje volné mediální soubory a archivy z kořene repozitáře.

## Hlavní vstupní body

- Zdrojový uzel: `src/index.html`
- Hlavní svět: `worlds/VAFT-Center3D/index.html`
- Svět Revia: `worlds/Revia/index.html`

## Zpětná kompatibilita

Původní soubory a složky v kořeni repozitáře zůstávají dostupné, aby stávající odkazy nebyly odstraněny při tomto čištění. Nová struktura je postupný migrační plán pro budoucí práci.

## Pravidla pro jazyk a formátování

- Dokumentace v tomto repozitáři by měla být psána v čistě české jazyce.
- Vyhýbejte se dekorativním unicode znakům, textu v azbuce a emoji v dokumentaci.
- Příklady a diagramy udržujte ve formátu kompatibilním s ASCII.
