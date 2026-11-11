/**
 * Batolete – Postavičky / Characters
 * Hlavoun, Pikoš, Viri, Bičák
 * Integrováno z Vivere atque Frui'T repozitáře
 */

'use strict';

/* ============================================================
   HLAVOUN – Mozek systému (thinking/logic)
   ============================================================ */
const Hlavoun = {
  name: 'Hlavoun',
  emoji: '🧠',
  color: '#6fb4ff',

  messages: {
    home:      '🧠 Ahoj! Jsem Hlavoun – mozek systému. Vyber si hru a učme se spolu!',
    abeceda:   '🧠 Abeceda je základ! Klepni na písmenku a já ti řeknu slovo. Zvládneš to!',
    cisla:     '🧠 Čísla jsou jako kamarádi – každé má své místo. Počítáme!',
    barvy:     '🧠 Barvy dávají světu krásu. Poznáš všechny barvy duhy?',
    tvary:     '🧠 Tvary jsou všude kolem nás! Vidíš kruh? Čtverec? Trojúhelník?',
    zviratka:  '🧠 Každé zvířátko má svůj hlas! Pozoruj a poslouchej!',
    pribehy:   '🧠 Příběhy nás učí o světě. Připrav se na dobrodružství!',
    pohyb:     '🧠 Pohyb je zdraví! Pojďme cvičit s Bičákem!',
    galerie:   '🧠 Tady jsou všechny světy Vivere atque Frui\'T – ohromující, že?',
    correct:   '🧠 Výborně! Tvůj mozek pracuje skvěle!',
    wrong:     '🧠 Nevadí! Zkus to znovu – chyby nás učí.',
    reward:    '🧠 Získal jsi hvězdičku! Pokračuj takto dál!'
  },

  speak(context) {
    return this.messages[context] || this.messages.home;
  }
};

/* ============================================================
   PIKOŠ – Dětský pozorovatel (child perspective)
   ============================================================ */
const Pikos = {
  name: 'Pikoš',
  emoji: '👶',
  color: '#ff6fb4',

  messages: {
    home:      '👶 Jsem Pikoš! Miluju hry a kreslení. Pojďme se společně učit!',
    abeceda:   '👶 Pí-í-ísmenko! Každé písmenku umím nakreslit prstem! Zkus to taky!',
    cisla:     '👶 Jeden, dva, tři... já umím počítat na prstech! Ukáži ti jak!',
    barvy:     '👶 Červená jako jablíčko! Modrá jako nebe! Žlutá jako sluníčko!',
    tvary:     '👶 Kolečko se kutálí, čtvereček stojí – a trojúhelník je jako čepice!',
    zviratka:  '👶 Zvířátka jsou moji nejlepší kamarádi! Haf, mňau, mú!',
    pribehy:   '👶 Pohádky jsou moje nejoblíbenější! Čti se mnou!',
    pohyb:     '👶 Skákat, běhat, točit se – to je nejlepší! Pojď si hrát!',
    galerie:   '👶 Podívej se na ty krásné světy! Chci v nich žít!',
    correct:   '👶 Jůůů! To ses to naučil! Já jsem na tebe pyšný!',
    wrong:     '👶 Ale nevadí! Já jsem taky chyboval. Zkusíme to znovu!',
    reward:    '👶 Hvězdičkaaaa! Jsi šampión! 🌟🌟🌟'
  },

  randomLine() {
    const lines = [
      '👶 Já chci vidět nového VaFiTa!',
      '👶 Tohle bych dal do batole světa!',
      '👶 Viděl jsem jiskru! 💫 To byl Iskroň!',
      '👶 Svět dýchá... cítíš to taky?',
      '👶 Můj deník má nové písmenky! 🍼',
      '👶 Kytičky jsou moje oblíbené!',
      '👶 Pojďme spolu kreslit hvězdičky!'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  },

  speak(context) {
    return this.messages[context] || this.randomLine();
  }
};

/* ============================================================
   VIRI – Vypravěčka (storyteller)
   ============================================================ */
const Viri = {
  name: 'Viri',
  emoji: '💖',
  color: '#d4b4ff',

  messages: {
    home:      '💖 Zdravím tě! Jsem Viri – já vyprávím příběhy a zpívám písničky. Pojď si hrát!',
    abeceda:   '💖 Každé písmenku je jako malý příběh. Á říká "ach, jak krásné!" 🌸',
    cisla:     '💖 Bylo jednou jedno číslo, které chtělo kamaráda... Počítáme společně!',
    barvy:     '💖 Jednou za duhou byl kraj plný barev – červená, modrá, zelená...',
    tvary:     '💖 Kruh je slunce, čtverec je domeček, trojúhelník je střecha – postavíme příběh!',
    zviratka:  '💖 Zvířátka mají svůj vlastní jazyk. Já jim rozumím! Naučím tě jejich řeč!',
    pribehy:   '💖 Každý příběh je cesta. Jsi připraven/a na dobrodružství?',
    pohyb:     '💖 Tanec a pohyb jsou jako hudba pro tělo! Zatancujeme?',
    galerie:   '💖 Každý svět má svůj příběh. Pojď, povím ti o nich!',
    correct:   '💖 Krásně! Jsi jako hvězda v příběhu – jasná a zářivá!',
    wrong:     '💖 Každý hrdina v příběhu někdy chybuje. Zkus to znovu, hrdino!',
    reward:    '💖 Získal jsi hvězdičku! Přidám tě do svého příběhu jako hrdinu!'
  },

  tell(storyId) {
    const stories = {
      iskron: 'Byl jednou jeden Iskroň – malá jiskřička, která chtěla osvítit celý svět...',
      vafit:  'Ve světě VaFiT žil veselý hrdina, který sbíral písmena jako poklady...',
      revia:  'Království Revia bylo plné kouzel a barev – každý den bylo jiné...'
    };
    return stories[storyId] || 'Byl jednou jeden svět plný dobrodružství...';
  },

  speak(context) {
    return this.messages[context] || this.messages.home;
  }
};

/* ============================================================
   BIČÁK – Pohyb a zdraví (movement & health)
   ============================================================ */
const Bicak = {
  name: 'Bičák',
  emoji: '💪',
  color: '#ffb46f',

  messages: {
    home:      '💪 Hej! Jsem Bičák! Pohyb je zdraví! Pojďme cvičit!',
    abeceda:   '💪 Každé písmenku procvič! Sto dřepů za každé A!',
    cisla:     '💪 Budem počítat skoky! Jeden, dva, tři – hop!',
    barvy:     '💪 Jaká barva je tvůj oblíbený sportovní dres?',
    tvary:     '💪 Nakreslím ti kruhem pohyb ruky! Takhle!',
    zviratka:  '💪 Chodíme jako medvěd! Skáčeme jako žabka! Letíme jako pták!',
    pribehy:   '💪 V mém příběhu se vždy hýbáme – nikdo nesedí!',
    pohyb:     '💪 Teď záleží na tobě! Dej mi 10 skoků! Hop, hop, hop!',
    galerie:   '💪 Každý svět potřebuje hrdinu, který se hýbe!',
    correct:   '💪 Pohni sebou! Výborně! Jsem na tebe pyšný!',
    wrong:     '💪 Nevzdávej se! Každý sportovec trénuje! Ještě jednou!',
    reward:    '💪 Super výkon! Hvězdička si zasloužená! Dál pokračuj!'
  },

  activities: [
    { emoji: '🏃', name: 'Utíkej na místě',  desc: 'Utíkej na místě 10 sekund!', count: 10, unit: 'sekund' },
    { emoji: '🤸', name: 'Skoč 5×',          desc: 'Skoč 5× nahoru!',            count: 5,  unit: 'skoků' },
    { emoji: '🦵', name: 'Dřep 3×',          desc: 'Udělej 3 dřepy!',            count: 3,  unit: 'dřepů' },
    { emoji: '👐', name: 'Mávni rukama',      desc: 'Zamávej rukama 10×!',        count: 10, unit: 'mávnutí' },
    { emoji: '🐸', name: 'Žabí skok',         desc: 'Skoč jako žabka 5×!',        count: 5,  unit: 'skoků' },
    { emoji: '🐻', name: 'Medvěd',            desc: 'Chodíme jako medvěd 5 kroků!', count: 5, unit: 'kroků' },
    { emoji: '🦋', name: 'Motýlí křídla',     desc: 'Mávni rukama jako motýl 8×!', count: 8, unit: 'mávnutí' },
    { emoji: '🌀', name: 'Točíme se',         desc: 'Zatočíme se 3× dokola!',      count: 3,  unit: 'otočení' }
  ],

  randomActivity() {
    return this.activities[Math.floor(Math.random() * this.activities.length)];
  },

  speak(context) {
    return this.messages[context] || this.messages.home;
  }
};

/* ============================================================
   CHARACTER MANAGER – Správce postav
   ============================================================ */
const CharacterManager = {
  chars: { hlavoun: Hlavoun, pikos: Pikos, viri: Viri, bicak: Bicak },
  current: 'hlavoun',

  get(id) { return this.chars[id] || Hlavoun; },

  setCurrent(id) {
    if (this.chars[id]) this.current = id;
  },

  getCurrentChar() { return this.chars[this.current]; },

  speak(context) { return this.getCurrentChar().speak(context); },

  all() { return Object.values(this.chars); }
};

// Expose globally
window.Hlavoun       = Hlavoun;
window.Pikos         = Pikos;
window.Viri          = Viri;
window.Bicak         = Bicak;
window.CharacterManager = CharacterManager;
