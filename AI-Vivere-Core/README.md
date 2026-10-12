# 🤖 AI Vivere atque FruiT Core

**Osobní AI asistentka na iPhone 14** - trénovaná z obsahu repozitáře, zabezpečená v localStorage

## Instalace na iPhone 14

1. Otevři odkaz v Safari:
   ```
   https://vivere-atque-frui-t.vercel.app/AI-Vivere-Core/ai-app.html
   ```

2. Klikni **Sdílet** → **Přidat na plochu**

3. Aplikace se spustí jako PWA s plným přístupem

## Funkce

✅ **Chat s AI** - písemné rozhovory
✅ **Paměť** - localStorage (jen tvůj telefon)
✅ **Audit log** - vedení všech interakcí
✅ **Agenti** - malí pracovníci hlídající správnost
✅ **Znalostní báze** - obsah z repozitáře
✅ **Rotace API klíče** - bezpečnost pokaždé jinak

## localStorage Struktura

```json
{
  "api_key": "tvůj_klíč_jen_lokálně",
  "api_rotation": "timestamp_poslední_rotace",
  "conversations": [...],
  "audit_log": [...],
  "agents": {
    "validator": {...},
    "keeper": {...},
    "learner": {...}
  },
  "training_params": {...}
}
```

## Bezpečnost

- 🔒 localStorage přístupný jen na TOMTO zařízení
- 🔐 API klíč je rotován automaticky
- 📝 Vše je auditováno a logováno
- 👥 Agenti hlídají správnost
- 🚫 Nikdo jiný nemá přístup (kromě tebe)

## Vývoj

- Verze: 1.0.0
- Status: PWA Ready
- Platform: iPhone 14+
- Offline: ANO
