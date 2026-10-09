# CHT 360°‰. — Centralizovaný registr úložiště (localStorage)

> **Kanonická verze:** `docs/CHT-360-STORAGE-SCHEMA.md`  
> **Stav:** v souladu s `docs/js/cht-chybozrout.js` (v3) a `docs/js/cht-360-network.js`

---

## Schéma klíčů localStorage

### 🧠 Paměť

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_pamet_v1` | Aktivní stav Paměti CHT (4 jádra × 70 slotů) | Hlavní CHT |
| `cht360_pamet_snapshots_v1` | Snímky Paměti pro export/import | Hlavní CHT |
| `vaft_pamet_v1` | Legacy Paměť (migration path → `cht360_pamet_v1`) | Legacy |
| `vaft_pamet_scene_v2` | Legacy scéna Paměti | Legacy |

### ✨ Glyphy

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_glyph_workshop_v1` | Aktivní stav dílny Glyphů | Glyph CHT |
| `cht360_glyph_context_v1` | Kontext mostu Glyphů ↔ Paměť | Glyph CHT / Hlavní CHT |
| `cht360_glyph_transfer_v1` | Čekající přenos Glyphu do Paměti | Glyph CHT / Hlavní CHT |
| `cht360_glyph_transfer_applied_v1` | Potvrzený aplikovaný přenos Glyphu | Glyph CHT / Hlavní CHT |
| `cht360_glyph_rooms_v2` | Pokojíčky — stav chodby a přiřazení místností | Glyph pokojíčky |
| `glyph-cht-360-rooms.v1` | Legacy klíč pokojíčků (IndexedDB fallback) | Legacy |

### 🔒 Sloty a zámky

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_slot_locks_v1` | Uzamčené sloty Paměti | Bubínky |
| `cht360_slot_unlocks_v1` | Odemčené sloty Paměti | Bubínky |
| `cht360_bubinky_values_v1` | Hodnoty Bubínků | Bubínky |

### 💬 Mluva

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_mluva_history_v1` | Historie konverzace Mluvy CHT | Mluva CHT |
| `cht360_mluva_lessons_v1` | Lekce a výukový obsah Mluvy CHT | Mluva CHT |

### 🔧 Chybožrout / Samoopravovna

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_chybozrout_v3` | **Aktivní** stav Samoopravovny (fronta, reporty) | Chybožrout |
| `cht360_chybozrout_v2` | **Zastaralý** — migrován automaticky na v3 | Legacy |
| `cht360_samoopravovna_backup_v2` | Záloha Paměti vytvořená Samoopravovnou | Chybožrout |
| `cht360_samoopravovna_backup_v1` | **Zastaralá** záloha (v1) | Legacy |
| `cht360_chybozrout_kos_v1` | Koš uzavřených nálezů (root) | Chybožrout root |
| `cht360_scan_report_v2` | Poslední skenový report (root) | Chybožrout root |

### 🌐 Síť CHT

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_network_modules_v1` | Registr modulů společné sítě CHT | cht-360-network |
| `cht360_network_backup_v1` | Záloha registru sítě CHT | cht-360-network |
| `cht360_network_pulse_v1` | Poslední puls sítě CHT | cht-360-network |

### 🌱 Revia

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_revia_v1` | Stav a nastavení Revie | Revia |
| `cht360_revia_state_v1` | Paměť Revie (deník událostí) | Revia |
| `cht360_revia_signals_v1` | Signály Revie | Revia |
| `revia_memory_v1` | Legacy paměť Revie | Legacy |

### 🍼 Batole (hub)

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_batole_v1` | Stav Batole hubu (inbox, oběh, glyphs) | batole-core |

### 🗂 Jádra — pracovní deska

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_jadra_pracovni_deska_v1` | Stav pracovní desky jader CHT | Jádra deska |

### ⚙️ Ostatní / legacy

| Klíč | Popis | Modul |
|------|-------|-------|
| `cht360_trojka_models_v1` | Modely trojky (experimenty) | Hlavní CHT |
| `cht360_glyph_drums_v1` | Glyph bubínky (starší verze) | Hlavní CHT |
| `cht360_glyph_drums_custom_v1` | Vlastní Glyph bubínky | Hlavní CHT |
| `cht360_iphone14_settings_v1` | Nastavení iPhone 14 v CHT | Hlavní CHT |

---

## BroadcastChannel registry

| Kanál | Stav | Kde |
|-------|------|-----|
| `cht360_relay_v1` | **Kanonický** — doporučen pro nový kód | `docs/js/cht-360-relay.js` |
| `cht360_mesh_v1` | Legacy — přemostěn přes relay | root `index.html` |
| `cht360-batole` | Legacy — přemostěn přes relay | `batole-core.js` |
| `cht360_puls_channel_v1` | Legacy — přemostěn přes relay | `cht-puls-360/app.js` |
| `cht360_revia_mesh_v1` | Legacy — přemostěn přes relay | `js/revia-local-mesh.js` |

---

## Migrační poznámky

### v2 → v3 (Chybožrout)
Stav Samoopravovny se automaticky migruje z `cht360_chybozrout_v2` na `cht360_chybozrout_v3`
při prvním načtení aktualizované verze `docs/js/cht-chybozrout.js`.

### vaft_pamet_v1 → cht360_pamet_v1
Zálohovací funkce Chybožrouta zahrnuje oba klíče. Pro nový kód vždy preferuj
`cht360_pamet_v1`.

---

## Pořadí načítání skriptů

Pro správnou funkci celého systému načítej skripty v tomto pořadí:

1. `docs/js/cht-360-network.js` — síť a registry modulů
2. `docs/js/cht-360-relay.js` — BroadcastChannel relay
3. `docs/batole-core.js` — Batole hub
4. `docs/js/cht-chybozrout.js` — Samoopravovna (module)
5. Ostatní moduly (aplikace, Revia, Glyph, atd.)
