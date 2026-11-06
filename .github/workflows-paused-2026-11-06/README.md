# Pozastavené GitHub Actions — Vivere atque FruiT

Dne 6. 11. 2026 bylo na žádost uživatele všech 76 kontrolních / bezpečnostních workflow přesunuto z `.github/workflows/` sem, aby se znovu nespouštěly automaticky na každý commit. Původní YAML soubory zůstaly beze změny jako vratná záloha; zpět se obnovují pouze jednotlivé požadované workflow.

**GitHub Pages:** systémový workflow `pages build and deployment` zde není, tento přesun ho nemaže ani nevypíná.

**Dříve zařazené/spuštěné běhy** se tímto commitem nezruší; jejich stav a případné zrušení je nutné řešit samostatně v GitHub Actions.
