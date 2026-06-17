# Průvodce strážcem

Tento repozitář obsahuje browserového klienta strážce a Netlify funkce pro toky výzvy a odeslání.

Aktuální soubory:
- `vaft.guardian.client.js`
- `config/guardian-config.json`
- `netlify/functions/`

Poznámka k integraci:
- načtěte klienta strážce před funkcemi, které závisejí na `window.VAFT.guardian`
- před nasazením ověřte všechny změny externích endpointů
