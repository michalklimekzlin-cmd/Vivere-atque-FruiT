"use strict";

/*
  Základní znalosti CHT 360°‰.
  -----------------------------
  Česká výchozí sada pro jádra Země, Jazyk a Hra. Každá karta je malá,
  samostatná a může být z běžného slotu kdykoli smazána nebo nahrazena.
  Revia drží zdrojovou sadu odděleně, proto ji zná i po vyčištění slotů.
*/

const MEMORY_KEY = "cht360_pamet_v1";
const LEGACY_MEMORY_KEY = "vaft_pamet_v1";
const INSTALL_MARKER_KEY = "cht360_zakladni_znalosti_v1";
const SLOT_COUNT = 70;

const THEMES = Object.freeze({
  earth: Object.freeze([
    ["Pozorování", "Dobré poznání začíná pozorováním: co přesně vidím, slyším nebo měřím?", "Zapiš jeden jev bez domněnky o jeho příčině."],
    ["Důkaz", "Důkaz je informace, kterou lze ověřit; dojem může být užitečný, ale sám o sobě nestačí.", "Odděl ve své poznámce pozorování od názoru."],
    ["Model", "Model zjednodušuje skutečnost, aby šlo něco vysvětlit nebo předpovědět.", "Najdi jednu věc, kterou model ukazuje dobře, a jednu, kterou vynechává."],
    ["Mapa", "Mapa převádí prostor do značek a měřítka; bez legendy mohou stejné značky znamenat různé věci.", "Podívej se na legendu mapy dřív, než z ní vyvodíš závěr."],
    ["Měřítko", "Stejný jev může vypadat jinak zblízka, z dálky i v dlouhém časovém období.", "Popiš jednu věc v malém a ve velkém měřítku."],
    ["Voda", "Voda se na Zemi pohybuje mezi povrchem, vzduchem a podzemím; mění přitom skupenství.", "Sleduj, odkud voda přichází a kam po dešti odtéká."],
    ["Počasí a klima", "Počasí popisuje krátkodobý stav ovzduší, klima dlouhodobé vzorce v určité oblasti.", "Nevysvětluj dlouhý trend jedním jediným dnem."],
    ["Půda", "Půda je směs minerálních částic, organické hmoty, vody, vzduchu a živých organismů.", "Porovnej vzhled půdy na dvou různých místech."],
    ["Životní prostředí", "Organismy nežijí odděleně: mění prostředí a prostředí naopak ovlivňuje je.", "Uveď jednu vazbu mezi živým tvorem a jeho okolím."],
    ["Roční doby", "Roční doby souvisejí hlavně se sklonem zemské osy a oběhem Země kolem Slunce.", "Všimni si, jak se během roku mění délka dne."],
    ["Sluneční energie", "Slunce dodává energii mnoha procesům na Zemi, například počasí a růstu rostlin.", "Najdi jeden proces kolem sebe, který na sluneční energii navazuje."],
    ["Potravní vztahy", "Potravní síť je propojení více vztahů, ne jen jednoduchý řetězec kdo koho jí.", "Nakresli tři organismy a aspoň dvě jejich vazby."],
    ["Rozmanitost", "Druhová rozmanitost zvyšuje počet možných vazeb v prostředí.", "Všímej si rozdílů mezi podobnými rostlinami či hmyzem."],
    ["Zdroje", "Přírodní zdroje jsou omezené nebo se obnovují různou rychlostí.", "Ptej se, odkud materiál pochází a co se s ním stane po použití."],
    ["Odpad", "Odpad není jedna věc: záleží na materiálu, možnosti opakovaného použití i místních pravidlech třídění.", "Než něco vyhodíš, zvaž opravu, opětovné použití nebo třídění."],
    ["Energie", "Úspora energie často znamená vykonat stejnou užitečnou práci s menší ztrátou.", "Najdi jednu ztrátu energie doma nebo v zařízení."],
    ["Materiály", "Materiály mají vlastnosti jako pevnost, vodivost, pružnost nebo nasákavost.", "Vyber materiál podle vlastnosti, ne jen podle vzhledu."],
    ["Síly", "Síla může měnit pohyb nebo tvar tělesa; účinek závisí i na směru a místě působení.", "Zkus popsat, co se změní, když zatlačíš z jiné strany."],
    ["Pohyb", "Pohyb vždy popisujeme vzhledem k nějakému zvolenému bodu nebo soustavě.", "Řekni, vůči čemu se právě pohybuješ a vůči čemu stojíš."],
    ["Měření", "Měření je srovnání s jednotkou; přesnost zápisu má odpovídat použitému nástroji.", "K výsledku si napiš jednotku i způsob měření."],
    ["Graf", "Graf může ukázat vztah mezi údaji, ale bez popisu os se snadno čte chybně.", "Před čtením grafu zkontroluj názvy os a jednotky."],
    ["Nejistota", "Každé měření má určitou nejistotu; poctivé je ji přiznat místo předstírání jistoty.", "Napiš, co mohlo výsledek měření ovlivnit."],
    ["Obloha", "Denní a noční obloha se zdánlivě mění kvůli pohybu Země a vlastnímu pohybu nebeských těles.", "Sleduj stejnou část oblohy ve dvou různých časech."],
    ["Horniny", "Horniny se mohou tvořit, měnit a rozpadat v dlouhých geologických procesech.", "Všímej si rozdílu mezi kamenem, horninou a půdou."],
    ["Krajina", "Krajina je výsledkem přírodních procesů i lidské činnosti.", "Najdi v okolí jednu přírodní a jednu člověkem vytvořenou stopu."],
    ["Město", "Město tvoří lidé, stavby, doprava, zeleň i pravidla společného prostoru.", "Zeptej se, komu dané místo slouží a komu může překážet."],
    ["Bezpečí", "Bezpečné rozhodnutí počítá s okolím, následky i možností zastavit se.", "Před neznámým krokem si zvol bezpečnější variantu."],
    ["Zdraví", "Tělo potřebuje odpočinek, pohyb, jídlo, pití a bezpečné prostředí; potřeby se liší člověk od člověka.", "Ber signály těla vážně a dopřej si pauzu."],
    ["Zdroj informací", "Užitečný zdroj uvádí, odkud informace pochází a jak ji lze ověřit.", "Porovnej dvě nezávislé informace předtím, než jim uvěříš."],
    ["Příčina a souvislost", "To, že dvě věci nastanou spolu, ještě samo o sobě nedokazuje, že jedna způsobila druhou.", "Hledej i jiné možné vysvětlení."],
    ["Otázka", "Dobrá otázka je konkrétní a umožňuje hledat odpověď, ne jen potvrdit první dojem.", "Změň obecné „proč“ na otázku, kterou lze pozorovat nebo měřit."],
    ["Porovnání", "Porovnání dává smysl, když víme, co držíme stejné a co měníme.", "Při porovnání změň jen jednu věc najednou."],
    ["Oprava", "Oprava chyby je součást poznávání; lepší zápis nahrazuje slabší, ne zakrývá ho.", "Když změníš názor, napiš i proč."],
    ["Odpovědnost", "Znalost má následky: dobré rozhodnutí myslí i na druhé lidi a prostředí.", "Před jednáním si polož otázku, koho ještě může ovlivnit."],
    ["Systém", "Systém tvoří části a jejich vazby; změna jedné části může ovlivnit i ostatní.", "Nakresli tři části jevu a šipkami označ, co na co působí."]
  ]),
  language: Object.freeze([
    ["Kontext", "Stejné slovo může znamenat různé věci podle věty, mluvčího a situace.", "Než vyložíš slovo, přečti větu kolem něj."],
    ["Věta", "Věta spojuje slova tak, aby mezi nimi vznikl vztah a sdělení.", "Zkus rozšířit krátkou větu o přesnější okolnost."],
    ["Slovní tvar", "Tvar slova může nést informaci o osobě, čase, čísle nebo pádu.", "Všimni si, co se změní po změně koncovky."],
    ["Kořen slova", "Příbuzná slova často sdílejí část, která napovídá o společném významovém základu.", "Najdi tři příbuzná slova a porovnej jejich význam."],
    ["Předpona", "Předpona může změnit směr, míru nebo jinou část významu slova.", "Porovnej dvě slova, která se liší jen předponou."],
    ["Přípona", "Přípona může tvořit nové slovo nebo vyjadřovat jeho tvar.", "Zkus vytvořit příbuzné slovo a zkontroluj, zda dává smysl."],
    ["Interpunkce", "Čárka, tečka a otazník pomáhají čtenáři rozlišit části a záměr sdělení.", "Přečti větu s různým znaménkem a všimni si změny tónu."],
    ["Diakritika", "Háčky a čárky mohou v češtině změnit výslovnost i význam slova.", "Při kopírování textu ověř, zda se diakritika neztratila."],
    ["Velké písmeno", "Velké písmeno může označovat začátek věty, vlastní jméno nebo záměrný styl.", "Rozhodni, zda velké písmeno mění význam, nebo jen vzhled."],
    ["Citace", "Citace odděluje cizí přesné znění od vlastního komentáře.", "Když cituješ, uveď i zdroj a nezměň význam vytržením z kontextu."],
    ["Doslovnost", "Doslovný význam popisuje přímo, obrazný význam pracuje s přirovnáním nebo nadsázkou.", "Zeptej se, zda větu lze chápat doslova."],
    ["Podstatné jméno", "Podstatné jméno pojmenovává osoby, věci, vlastnosti nebo děje.", "Najdi ve větě, co je pojmenováno."],
    ["Sloveso", "Sloveso vyjadřuje děj, stav nebo změnu.", "Najdi, co se ve větě děje a kdy."],
    ["Přídavné jméno", "Přídavné jméno zpřesňuje vlastnost nebo vztah.", "Zvaž, zda přídavné jméno přidává informaci, nebo jen dojem."],
    ["Zájmeno", "Zájmeno odkazuje na osobu, věc nebo vlastnost, kterou často známe z kontextu.", "Zkontroluj, zda je jasné, k čemu zájmeno odkazuje."],
    ["Spojka", "Spojka ukazuje vztah mezi částmi sdělení, například doplnění, protiklad nebo příčinu.", "Nahraď spojku jinou a sleduj, co se změní."],
    ["Podmět a přísudek", "Ve větě často hledáme, kdo nebo co něco dělá, a co se o tom říká.", "Najdi základní dvojici věty bez zbytečných ozdob."],
    ["Slovosled", "Pořadí slov může měnit důraz, i když hlavní význam zůstává podobný.", "Řekni stejnou větu s důrazem na jiné slovo."],
    ["Definice", "Definice vymezuje pojem tak, aby šel odlišit od podobných pojmů.", "Zkus vysvětlit pojem bez použití téhož slova."],
    ["Synonymum", "Synonyma jsou slova s podobným, ale ne vždy úplně stejným významem.", "Před záměnou slov zkontroluj tón a situaci."],
    ["Protiklad", "Protiklad pomáhá vymezit význam, ale skutečnost nebývá vždy jen černá nebo bílá.", "Najdi mezi dvěma protiklady i mezistupeň."],
    ["Nejednoznačnost", "Nejednoznačná věta může mít více čtení; pomáhá ji rozdělit nebo doplnit kontext.", "Napiš dvě možné interpretace jedné krátké věty."],
    ["Tón", "Tón textu vzniká volbou slov, rytmem, interpunkcí a situací.", "Přepiš stejnou zprávu klidněji nebo důrazněji."],
    ["Shrnutí", "Shrnutí zachovává hlavní myšlenku a vynechává vedlejší detaily.", "Zkus obsah zkrátit na jednu větu bez zkreslení."],
    ["Otázka", "Otázka může zjišťovat informaci, žádat vysvětlení nebo otevírat debatu.", "Polož otázku tak, aby na ni šlo odpovědět konkrétně."],
    ["Tvrzení", "Tvrzení lze podpořit důvodem, příkladem nebo zdrojem.", "K tvrzení přidej, odkud ho víš."],
    ["Příklad", "Příklad ukazuje použití pravidla, ale jeden příklad nemusí platit pro všechno.", "Najdi i výjimku nebo hranici svého příkladu."],
    ["Fakt a názor", "Fakt lze zpravidla ověřovat, názor vyjadřuje hodnocení nebo postoj.", "Označ, která část věty je ověřitelná a která hodnotící."],
    ["Překlad", "Překlad nepřenáší jen slova, ale i vztahy, tón a kulturní kontext.", "Porovnej doslovný překlad s větou, která v cílovém jazyce opravdu zní přirozeně."],
    ["Vícejazyčnost", "Každý jazyk má vlastní vzorce; rozdíl není automaticky chyba.", "Nech neznámý výraz chvíli otevřený, dokud nezjistíš souvislost."],
    ["Čtení nahlas", "Čtení nahlas odhalí rytmus, opakování i nejasná místa.", "Přečti svou větu a uprav ji podle toho, kde se zadrhneš."],
    ["Poznámka", "Dobrá poznámka zaznamená zdroj, datum a vlastní otázku k tématu.", "K novému poznatku připiš, co bys chtěl ověřit."],
    ["Revize", "Revize není trest za první verzi; umožňuje text zpřesnit.", "Po pauze si text přečti jako někdo, kdo o tématu nic neví."],
    ["Glyph", "Glyph je přesný znakový celek; jeho význam se váže na doložený kontext, ne na domněnku.", "Při ukládání Glyphu zachovej všechny znaky, mezery a velikost písmen."],
    ["VaFiT", "VaFiT zápis může používat vlastní vazby a čtení; Revia je drží jako pracovní pravidla autora.", "K novému pravidlu VaFiT vždy připiš příklad použití."]
  ]),
  game: Object.freeze([
    ["Cíl", "Hra nebo úkol potřebuje srozumitelný cíl, aby šlo poznat postup i dokončení.", "Napiš cíl jednou větou bez skrytých podmínek."],
    ["Pravidlo", "Pravidlo vymezuje, co je možné, zakázané nebo jak se rozhoduje.", "Uprav pravidlo tak, aby ho pochopil i nový hráč."],
    ["Zpětná vazba", "Zpětná vazba ukazuje důsledek kroku a pomáhá učit se z něj.", "Dej hráči najevo, co se stalo a proč."],
    ["Tah", "Tah je rozhodnutí v určitém okamžiku; jeho cena a důsledek musí být čitelné.", "Před tahem zvaž aspoň dvě možnosti."],
    ["Zdroj", "Zdroj ve hře může být čas, energie, informace nebo prostor.", "Řekni, co hráč spotřebovává a jak to získává."],
    ["Volba", "Smysluplná volba má odlišné následky, ne jen jinou barvu tlačítka.", "Vymysli dvě cesty se stejnou hodnotou, ale jiným rizikem."],
    ["Strategie", "Strategie je dlouhodobý plán; taktika je krátký krok v konkrétní situaci.", "Odděl svůj příští tah od směru, kterým chceš dojít."],
    ["Riziko", "Riziko je nejistý výsledek s možnou ztrátou i ziskem.", "Pojmenuj, co můžeš získat, ztratit a jak se můžeš vrátit zpět."],
    ["Spravedlnost", "Spravedlivá hra dává srozumitelná pravidla a podobnou možnost rozhodovat.", "Zkontroluj, zda někdo nemá skrytou výhodu bez vysvětlení."],
    ["Souhlas", "V multiplayeru i při společné hře záleží na tom, zda lidé chtějí hrát stejným způsobem.", "Domluvte se na hranicích a možnosti kdykoli přestat."],
    ["Role", "Role rozděluje odpovědnost a možnosti; neměla by z hráče dělat jen pasivního diváka.", "Každé roli dej vlastní užitečný krok."],
    ["Chyba", "Neúspěch může být informace pro další pokus, pokud hra vysvětlí, co se stalo.", "Po prohře ukaž cestu k poučení, ne jen trest."],
    ["Iterace", "Iterace znamená malý pokus, pozorování výsledku a úpravu.", "Měň jednu věc a sleduj její vliv."],
    ["Obtížnost", "Dobrá obtížnost roste podle dovednosti, ne jen podle náhody nebo trestu.", "Nabídni lehčí i náročnější cestu k témuž cíli."],
    ["Přístupnost", "Přístupná hra počítá s různými způsoby ovládání, čtení a vnímání.", "Nespoléhej pouze na barvu, rychlost nebo drobný text."],
    ["Pískoviště", "Pískoviště dovoluje zkoušet bez velkého rizika ztráty.", "Dej hráči prostor na pokus před ostrým rozhodnutím."],
    ["Spolupráce", "Spolupráce funguje, když si hráči mohou předávat užitečné informace nebo schopnosti.", "Navrhni úkol, který nelze pohodlně vyřešit úplně o samotě."],
    ["Soutěž", "Soutěž může motivovat, ale potřebuje jasná pravidla a respekt k lidem.", "Odděl výkon ve hře od hodnoty člověka."],
    ["Čas", "Časový limit vytváří tlak; má být viditelný a odpovídat úkolu.", "U kritického kroku nabídni možnost pauzy."],
    ["Pauza", "Pauza chrání soustředění a dovoluje vrátit se k rozhodnutí s odstupem.", "Vytvoř bezpečný bod, kde lze hru přerušit."],
    ["Uložení", "Uložení chrání postup; hráč má vědět, co se ukládá a kdy.", "Před rizikovou změnou nabídni zálohu nebo návrat."],
    ["Vyvážení", "Vyvážení není stejnost: různé možnosti mohou být silné v různých situacích.", "Porovnávej možnosti ve více scénářích."],
    ["Test", "Test ověřuje konkrétní očekávání; dobrý test má jasný výsledek.", "Napiš, co se má stát předtím, než funkci vyzkoušíš."],
    ["Chyba v programu", "Chybové hlášení má pomoci najít příčinu, ne jen oznámit selhání.", "Zapiš krok, po kterém se chyba objevila."],
    ["Verze", "Verze označuje stav projektu; změna má mít stručně popsaný důvod.", "Před úpravou si ulož bod, ke kterému se můžeš vrátit."],
    ["Záloha", "Záloha je samostatná kopie důležitých dat, ne jen otevřené okno.", "Ověř, že umíš zálohu také obnovit."],
    ["Soukromí", "Herní i osobní data potřebují jasné hranice: co se ukládá, kdo to vidí a proč.", "Neshromažďuj data, která pro funkci nepotřebuješ."],
    ["Emoce", "Hra může vyvolat radost, napětí i frustraci; dobrý návrh s tím zachází ohleduplně.", "Když napětí roste, nabídni klidnější možnost."],
    ["Příběh", "Příběh spojuje události příčinami a následky, ne jen seznamem scén.", "U každé důležité události se zeptej, co ji změnilo."],
    ["Svět", "Herní svět drží pohromadě, když jeho pravidla platí důsledně nebo mají vysvětlenou výjimku.", "Zapiš pravidlo světa, které se nesmí potichu změnit."],
    ["Odměna", "Odměna má podporovat chování, které hra opravdu chce učit.", "Zkontroluj, zda odměna netlačí hráče proti vlastnímu cíli."],
    ["Učební smyčka", "Učení ve hře vzniká z kroku, zpětné vazby, úpravy a dalšího kroku.", "Po každém pokusu pojmenuj jednu věc, kterou sis ověřil."],
    ["Malý úkol", "Malý dokončitelný úkol dává rytmus a snižuje zahlcení.", "Rozděl velký problém na první krok, který zvládneš dnes."],
    ["Kontrola", "Kontrola po změně brání tomu, aby drobná úprava rozbila jinou část.", "Po opravě ověř původní problém i okolní funkce."],
    ["Respekt", "Společná hra je silnější, když se lidé navzájem neshazují a mohou říct stop.", "Při konfliktu řeš chování a pravidlo, ne hodnotu člověka."]
  ])
});

const CORE_LABELS = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra"
});

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function makeDeck(coreId) {
  const label = CORE_LABELS[coreId];
  const cards = [];

  THEMES[coreId].forEach(([topic, explanation, practice]) => {
    cards.push(Object.freeze({
      name: label + " " + twoDigits(cards.length + 1) + " · " + topic,
      content: explanation
    }));
    cards.push(Object.freeze({
      name: label + " " + twoDigits(cards.length + 1) + " · " + topic + " · zkus",
      content: "Zkus: " + practice
    }));
  });

  return Object.freeze(cards.slice(0, SLOT_COUNT));
}

export const CHT_ZAKLADNI_ZNALOSTI = Object.freeze({
  version: 1,
  language: "cs",
  title: "Základní znalosti CHT 360°‰.",
  rule: "Výchozí karty se vloží jen jednou do opravdu prázdných slotů. Pozdější smazání nebo přepsání slotu je vždy rozhodnutí uživatele.",
  cores: Object.freeze({
    earth: makeDeck("earth"),
    language: makeDeck("language"),
    game: makeDeck("game")
  })
});

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("[CHT] Základní znalosti se nepodařilo načíst.", error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("[CHT] Základní znalosti se nepodařilo uložit.", error);
    return false;
  }
}

function cleanText(value, limit = 12_000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, limit);
}

function normalise(value) {
  return cleanText(value, 6_000)
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isUntouchedSlot(slot, index) {
  const id = Number(slot?.id) || index + 1;
  const name = cleanText(slot?.name || slot?.label, 160);
  const content = cleanText(slot?.content);
  return !content && (!name || name === "Slot " + id);
}

function storedMemory() {
  const current = readJson(MEMORY_KEY, null);
  if (current?.cores && typeof current.cores === "object") return { key: MEMORY_KEY, memory: current };

  const legacy = readJson(LEGACY_MEMORY_KEY, null);
  if (legacy?.cores && typeof legacy.cores === "object") return { key: LEGACY_MEMORY_KEY, memory: legacy };

  return null;
}

function coreSlots(memory, coreId) {
  const source = memory.cores?.[coreId];
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.slots)) return source.slots;
  return null;
}

function writeCoreSlots(memory, coreId, slots) {
  if (Array.isArray(memory.cores?.[coreId])) {
    memory.cores[coreId] = slots;
    return;
  }

  if (memory.cores?.[coreId] && typeof memory.cores[coreId] === "object") {
    memory.cores[coreId].slots = slots;
  }
}

function formatCard(coreId, index) {
  const card = CHT_ZAKLADNI_ZNALOSTI.cores[coreId]?.[index];
  return card ? "• " + card.name + " — " + card.content : "";
}

export function createCHTZakladniZnalosti() {
  function installOnce() {
    const alreadyInstalled = readJson(INSTALL_MARKER_KEY, null);
    if (alreadyInstalled?.version === CHT_ZAKLADNI_ZNALOSTI.version) {
      return { installed: false, reason: "already-installed", inserted: 0 };
    }

    const found = storedMemory();
    if (!found) return { installed: false, reason: "memory-not-ready", inserted: 0 };

    const now = new Date().toISOString();
    let inserted = 0;

    ["earth", "language", "game"].forEach(coreId => {
      const slots = coreSlots(found.memory, coreId);
      const cards = CHT_ZAKLADNI_ZNALOSTI.cores[coreId];

      if (!Array.isArray(slots)) return;

      const next = Array.from({ length: SLOT_COUNT }, (_, index) => {
        const current = slots[index] && typeof slots[index] === "object" ? slots[index] : { id: index + 1, name: "Slot " + (index + 1), content: "" };
        if (!isUntouchedSlot(current, index)) return current;

        const card = cards[index];
        inserted += 1;
        return {
          ...current,
          id: Number(current.id) || index + 1,
          name: card.name,
          content: card.content,
          createdAt: current.createdAt || now,
          updatedAt: now,
          seed: "cht-zakladni-znalosti-v1"
        };
      });

      writeCoreSlots(found.memory, coreId, next);
    });

    found.memory.updatedAt = now;
    const saved = writeJson(found.key, found.memory);
    if (saved && found.key !== MEMORY_KEY) writeJson(MEMORY_KEY, found.memory);

    if (saved) {
      writeJson(INSTALL_MARKER_KEY, {
        version: CHT_ZAKLADNI_ZNALOSTI.version,
        installedAt: now,
        inserted
      });

      window.dispatchEvent(new CustomEvent("cht.memory.changed", {
        detail: {
          reason: "jednorázová sada Základní znalosti",
          inserted,
          updatedAt: now
        }
      }));
    }

    return { installed: saved, reason: saved ? "installed" : "storage-failed", inserted };
  }

  function search(query, limit = 6) {
    const words = normalise(query).split(/[^a-z0-9áčďéěíňóřšťúůýž]+/i).filter(word => word.length > 2);
    if (!words.length) return [];

    const found = [];

    Object.entries(CHT_ZAKLADNI_ZNALOSTI.cores).forEach(([coreId, cards]) => {
      cards.forEach((card, index) => {
        const text = normalise(card.name + " " + card.content);
        const score = words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
        if (score) found.push({ coreId, index, card, score });
      });
    });

    return found
      .sort((left, right) => right.score - left.score || left.coreId.localeCompare(right.coreId) || left.index - right.index)
      .slice(0, limit);
  }

  function format(query = "") {
    const found = search(query);

    if (query && found.length) {
      return [
        "Základní znalosti CHT:",
        ...found.map(item => formatCard(item.coreId, item.index))
      ].join("\n");
    }

    if (query) {
      return "V české výchozí sadě jsem pro „" + cleanText(query, 120) + "“ nic nenašla. Sloty můžeš kdykoli přepsat vlastní zajímavostí.";
    }

    return [
      CHT_ZAKLADNI_ZNALOSTI.title,
      "• Země: 70 karet o pozorování, prostředí a ověřování.",
      "• Jazyk: 70 karet o významu, větách, češtině, Glyphech a VaFiT.",
      "• Hra: 70 karet o pravidlech, tvorbě, bezpečí a spolupráci.",
      "Karty jsou vloženy pouze jednou do prázdných slotů. Kdykoli je můžeš smazat a nahradit vlastními."
    ].join("\n");
  }

  return Object.freeze({
    installOnce,
    search,
    format,
    getAll: () => CHT_ZAKLADNI_ZNALOSTI
  });
}
