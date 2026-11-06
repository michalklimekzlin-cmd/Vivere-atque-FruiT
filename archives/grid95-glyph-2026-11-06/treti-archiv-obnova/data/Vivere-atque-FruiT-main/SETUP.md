# Nastavení

## Lokální spuštění

Tento repozitář aktuálně nevyžaduje krok sestavení pro hlavní statický obsah.

### Možnost 1: Python

```bash
python3 -m http.server 8000
```

Poté otevřete:

- `http://localhost:8000/src/index.html`
- `http://localhost:8000/worlds/VAFT-Center3D/index.html`
- `http://localhost:8000/worlds/Revia/index.html`

### Možnost 2: Libovolný statický hosting

Můžete také použít jakýkoliv jednoduchý statický souborový server, který obsluhuje kořen repozitáře.

## Netlify funkce

`netlify.toml` směruje provoz funkcí do `netlify/functions`.

Pokud potřebujete endpointy strážce lokálně, prohlédněte si:
- `GUIDE.md`
- `config/guardian-config.json`
- `netlify/functions/`

## Poznámky

- V tomto repozitáři zatím neexistuje ověřená testovací sada pro Node.
- Projekt se momentálně chová jako statická stránka s volitelnými bezserverovými endpointy.
