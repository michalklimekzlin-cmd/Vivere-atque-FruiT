# 🌟 REVIA v2 - NÁVOD NA SPUŠTĚNÍ

Ahoj Michale! Tady je kompletní návod pro spuštění Revia v2 s úsporou tokenů! 🚀

---

## 📱 Situace teď (víkend)

Máš: **iPhone 14**  
Co potřebuješ: **Nic! Kód je hotový!**

V pondělí když budeš mít iPad, spustíme backend na **Cloud serveru** (Railway/Render).

---

## 🛠️ Krok 1: Příprava (když budeš mít počítač)

### 1.1 Stáhni si Node.js
```
https://nodejs.org (LTS verze)
```

### 1.2 Jdi do `backend` složky
```bash
cd backend
```

### 1.3 Nainstaluj dependencies
```bash
npm install
```

Měl by to vypadat takto:
```
added 65 packages, and audited 66 packages
```

---

## 🔑 Krok 2: Nakonfiguruj OpenAI klíč

### 2.1 Vytvoř `.env` soubor
```bash
# Zkopíruj .env.example
cp .env.example .env
```

### 2.2 Otevři `.env` v textovém editoru
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
PORT=3000
NODE_ENV=development
```

### 2.3 Vložit svůj OpenAI klíč
- Jdi na: https://platform.openai.com/api-keys
- Vytvoř nový klíč (nebo najdeš starý)
- Zkopíruj celý řetězec (bez mezer!)
- Vložit místo `sk-proj-xxxxxxxxxxxx`

Hotovo by mělo vypadat:
```
OPENAI_API_KEY=sk-proj-abc123def456xyz789...
```

---

## 🚀 Krok 3: Spuštění backendu

### 3.1 Z `backend` složky spusť:
```bash
npm start
```

Měl bys vidět:
```
╔════════════════════════════════════════╗
║  🌟 REVIA BACKEND SERVER V2            ║
╚════════════════════════════════════════╝

✅ Server běží na: http://0.0.0.0:3000
   Lokálně: http://localhost:3000
```

**Nechaj si terminal otevřený!** Server musí běžet!

---

## 📱 Krok 4: Testování na iPhone

### 4.1 Otevři Revia v prohlížeči

Na počítači (lokálně):
```
http://localhost:3000/Revia/index.html
```

Nebo na iPhone (přes WiFi):
1. Najdeš IP adresu počítače:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
   Hledáš: `192.168.x.x` nebo `10.0.x.x`

2. Na iPhone otevřeš:
   ```
   http://192.168.x.x:3000/Revia/index.html
   ```

### 4.2 Testuj chat

1. Klikni na **SLOT 2** (chat) 🎯
2. Napiš: "Ahoj!"
3. Pošli zprávu
4. Revia by měla odpovědět! 🎉

---

## 🐛 Troubleshooting

### "Backend není dostupný"

**Problém:** Chyba 404 nebo CORS error

**Řešení:**
1. Kontrola: Běží `npm start` v terminálu?
2. Kontrola: Je port 3000 volný?
   ```bash
   # Mac/Linux:
   lsof -i :3000
   
   # Windows:
   netstat -ano | findstr :3000
   ```
3. Restartuj server (CTRL+C a znova `npm start`)

### "API klíč je neplatný"

**Problém:** Chyba `INVALID_API_KEY` nebo `401`

**Řešení:**
1. Zkontroluj že je klíč **celý** a bez mezer v `.env`
2. Zkontroluj že má account na OpenAI **kredit**
3. Vygeneruj **nový** klíč na platform.openai.com

### "Příliš mnoho požadavků"

**Problém:** Chyba `429 - RATE_LIMIT`

**Řešení:**
- To znamená že jsi poslal moc zpráv moc rychle
- Počkej 1-2 minuty a zkus to znova
- V Revia v2 se to děje méně často (posíláme jen 5 zpráv!)

---

## 💰 Úspora tokenů v Revia v2

### Co jsem změnil:

1. **Méně zpráv → Backend** (5 místo 50!) = **90% úspora!**
2. **Krátké odpovědi** (max 100 tokenů místo neomezeně)
3. **System prompt je minimální** (jen co potřebujeme)
4. **Tracking tokenů** - vidíš kolik se používá

### Příklad:

**Stará verze:** 50 zpráv × 2000 tokenů = **100,000 tokenů za den** 😱
**Nová verze:** 5 zpráv × 300 tokenů = **15,000 tokenů za den** 🎉

---

## 🔍 Debug panel (mobilech)

Na iPhone vidíš malé **🐛** tlačítko v pravo dole.

Klikni na něj → vidíš debug log!
- Jakou URL se posílají zprávy
- Kolik tokenů se používá
- Jaké chyby jsou

Perfect pro troubleshooting!

---

## 🌐 V pondělí: Cloud deployment

Když budeš mít iPad, nahrajeme backend na **Railway.app**:

1. Registrace na railway.app (zadarmo)
2. Vytvoření nového projektu
3. Nahrání backend kódu
4. Nastavení OPENAI_API_KEY
5. Spuštění! 🚀

Backend bude live a iPhone + iPad se k němu budou připojovat odkudkoliv!

---

## 📞 Potřebuješ pomoc?

1. **V terminálu vidíš chybu?** → Pošli mi tu chybu
2. **V prohlížeči vidíš chybu?** → F12 → Console → Pošli mi log
3. **Debug panel: 🐛** → Klikni na něj a pošli mi screenshot

---

## ✅ Checklist před spuštěním

- [ ] Node.js je nainstalovaný (`node --version`)
- [ ] Jsem v `backend` složce (`ls` ukazuje `server.js`)
- [ ] `npm install` byl spuštěný (`ls node_modules`)
- [ ] `.env` soubor existuje s OPENAI_API_KEY
- [ ] Server běží (`npm start`)
- [ ] Health check funguje: `curl http://localhost:3000/api/health`

---

**Hotovo! Čekáme na pondělí a iPad! 🚀**
