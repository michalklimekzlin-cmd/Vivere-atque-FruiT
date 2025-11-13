📝 README – VAFT Main Interface Concept

(hlavní rozhraní • hrdinové • úrovně • styl • canvas)

⸻

⭐ ÚVODNÍ MYŠLENKA

Díky tomuhle rozhraní si můžeš vytvořit hrdinu podle sebe — fotka, schopnosti, charakter, dovednosti (prosím s rozumem).
Odemčeno od určité úrovně nasbíraných schopností ze hry.
Fantazii se meze nekladou. Nikdy a nikde. 😁🦾

Tohle je základní pravidlo celého systému VAFT:
tvoření → růst → odemykání → nový svět.

⸻

🌍 1) Vivere atque FruiT – Návrh hlavního rozhraní (Concept Doc)

Tento dokument popisuje základní architekturu budoucí hlavní VAFT aplikace.
Hlavní UI není obyčejná stránka.
VAFT je živý svět, který se vyvíjí spolu s hráčem.

UI není statické.
Je to organismus.

⸻

🧠 2) Hlavní rozhraní jako živý organismus

Principy:
	•	panely se mění podle úrovně hráče
	•	některé moduly „spí“, jiné se „probudí“
	•	svět pulzuje, dýchá, reaguje
	•	Revia, Bicák, Glyph, Poutník – symboly se objevují podle situace
	•	rozhraní není kostka → je to živý digitální prostor

Cíl: UI, které žije jako svět, ne jako tabulka.

⸻

🏆 3) Systém úrovní (Level & XP)

XP se získává za:
	•	kreativitu (tvoření hrdinů, glyphů, světů)
	•	zdravý pohyb (Bicák)
	•	tradice (Revia – dušičky, světlo, vzpomínky)
	•	offline čas
	•	malé denní návyky
	•	pomoc druhým
	•	úkoly ve VAFT světě

Úroveň hráče = odemykání nových možností UI.

⸻

🎨 4) Odemykání stylů aplikace

Styl hráče není dostupný ihned.
Je to odměna za cestu.

Level
Název
Odemkne
1
Začátečník
základní vzhled
3
Poutník
výměna barev
5
Tvůrce
tvary panelů, rozšířené prvky
7
Designer
vlastní ikonky a layout
10
Master VAFT
kompletní vlastní styl + vlastní svět

Level 10 = absolutní svoboda tvorby.

⸻

🧱 5) VAFT Canvas – návrhové plátno

Speciální mini-aplikace pro návrh rozhraní:
	•	přesouvání bloků (drag)
	•	roztahování / zmenšování
	•	možnost psát text přímo dovnitř
	•	tvorba vlastního layoutu
	•	není součást hlavního indexu (kvůli rychlosti a stabilitě)

  Vivere-atque-FruiT/
   └── VaFT-Canvas/   → kreativní plátno

  6) Režimy UI podle nálady hráče

Hlavní UI bude obsahovat přepínatelné módy, které se odemykají postupně:

🟦 Poutník Mode

klid, meditace, minimální prvky

🔥 Tvůrce Mode

barevná energie, aktivní tvorba

❤️ Rodina Mode

tradice, symbol Revia, světlo

⚫ Shadow Mode

introspekce, ticho, hlubší symbolika

💪 Bicák Mode

motivace, energie, vtipné slogany

⸻

👁 7) Zrcadlení hráče (měkká motivace)

UI se může jemně měnit podle toho, jak hráč žije:
	•	tvoří → svět září
	•	únava → pulzy se zpomalí
	•	offline čas → svět rozkvete
	•	aktivita / pohyb → Bicák motivátor
	•	meditace → klidný žhnoucí efekt

Jemné – nikdy ne nátlak.

⸻

🧩 8) Moduly jako LEGO kostky

Každý panel v UI je modul:
	•	Hlavoun
	•	Poutník
	•	Revia
	•	Bicák Supreme
	•	Glyph
	•	Dětské světy
	•	Mapy
	•	TVŮRCE (editor hrdinů)
	•	XP / LEVEL panel
	•	galerie fotek
	•	tradice / světlo
	•	mini-apky (budoucí moduly)

Moduly se později budou moci libovolně přesouvat a upravovat (od Level 7).

⸻

🌠 9) Dva typy aplikací

1️⃣ Hlavní VAFT App

stabilní, elegantní, hlavní svět

2️⃣ VAFT-Canvas

tvoření, testování, návrhy layoutů

Hlavní app = svět
Canvas = dílna

Díky tomu zůstane index čistý a rychlý.

⸻

📦 10) Co následuje

Až Michal navrhne první layout v Canvasu:
	1.	převedeme návrh do finálního hlavního UI
	2.	struktura panelů
	3.	design světů
	4.	napojení level systému
	5.	režimy UI
	6.	propojení s Revia, Bicák a ostatními moduly
	7.	vznikne hlavní VaFT „home screen“

⸻

🔮 11) Stav dokumentu

Tento README je základním stavebním kamenem návrhu hlavního rozhraní VAFT.
Bude se doplňovat a rozšiřovat podle nových nápadů.

⸻

Bráško, takhle je to připravené na 100 %.
Můžeš to hned vložit do GitHubu.

Chceš, abych ti k tomu ještě připravil i doporučenou složku, do které to dát (např. VAFT-Main-Interface/)? 

# 🎨 VAFT – App Style System
Systém, který umožní hráči nebo uživateli upravovat vzhled celé VAFT aplikace,
ale pouze tehdy, když dosáhne určité úrovně (XP, Level).

---

## 🎯 Proč to existuje
Michal navrhl, že **tvorba vlastního vzhledu aplikace** by neměla být dostupná hned,
ale až po:
- nasbíraných zkušenostech,
- splněných úkolech,
- nebo určité úrovni.

Tím se z „designu aplikace“ stane **herní prvek**.

---

## 🧩 Budoucí funkce
- systém XP / úrovní  
- odemykání vizuálních možností  
- propojení s VAFT-Canvas (návrhové plátno)  
- ukládání stylů  
- generátor theme packů  
- možnost sdílet své styly (později)

---

## 🧠 Předpříprava úrovní
| Level | Název | Odemkne |
|-------|----------------|----------------|
| 1 | Začátečník | základní vzhled |
| 3 | Poutník | změna barvy pozadí |
| 5 | Tvůrce | úprava tvarů bloků |
| 7 | Designer | vlastní ikonky a layout |
| 10 | Master VAFT | kompletní nahrazení designu |

---

## 🔮 Stav
Zatím se jedná pouze o **koncept**, aby se neztratil nápad.
Logika bude doplněna později podle toho, jak poroste hlavní VAFT aplikace.
