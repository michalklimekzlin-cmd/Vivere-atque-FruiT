// Vivere atque Fru'i¡'T - hlavní učící entita
(function initVivereAtqueFruiTCore(global) {
  const CANONICAL_NAME = "Vivere atque Fru'i¡'T";
  const SHORTHAND_NAME = "Fru'i¡'T";

  const FruITCore = {
    id: crypto.randomUUID(),
    name: CANONICAL_NAME,
    shortName: SHORTHAND_NAME,
    version: '0.1.0',
    attached: false,
    teacher: '',
    lessonHistory: [],

    attach() {
      if (this.attached) return;
      this.attached = true;
      this.say('jsem připravená učit se česky i významy, nejen slova.');

      if (global.HlavounSystem && typeof global.HlavounSystem.think === 'function') {
        const originalThink = global.HlavounSystem.think.bind(global.HlavounSystem);
        global.HlavounSystem.think = async (message) => {
          await originalThink(message);
          this.react(message, global.HlavounSystem.state || {});
        };
      }

      setInterval(() => this.pulse(global.HlavounSystem?.state || {}), 9000);
    },

    teach(lessonInput) {
      const payload = {
        teacher: lessonInput.teacher || this.teacher || 'Učitel',
        category: lessonInput.category || 'knowledge',
        title: lessonInput.title || 'Lekce bez názvu',
        lesson: lessonInput.lesson || '',
        meaning: lessonInput.meaning || '',
        relations: Array.isArray(lessonInput.relations) ? lessonInput.relations : [],
        approved: lessonInput.approved !== false,
        created: lessonInput.created || new Date().toISOString()
      };

      this.teacher = payload.teacher;
      this.lessonHistory.push(payload);

      const result = global.fruiTLearningEngine
        ? global.fruiTLearningEngine.learn(payload)
        : { summary: 'Learning engine není načtený.' };

      this.say(`zapsala jsem lekci „${payload.title}“ (${payload.category}).`);
      return { payload, result };
    },

    understandConcept(concept) {
      return global.fruiTMemorySystem?.getConcept(concept) || null;
    },

    suggestSelfProgramming() {
      return global.fruiTLearningEngine?.suggestCapabilitiesFromLessons() || [];
    },

    explainLastLearningCzech() {
      const last = this.lessonHistory[this.lessonHistory.length - 1];
      if (!last) return 'Zatím jsem nedostala žádnou lekci.';
      return `Naposledy jsi mě učil(a) „${last.title}". Chci to použít v novém chování.`;
    },

    say(text) {
      if (typeof global.appendHlavounMsg === 'function') {
        global.appendHlavounMsg('ai', `💖 ${SHORTHAND_NAME}: ${text}`);
      }
    },

    react(userText, state) {
      const t = String(userText || '').toLowerCase();
      if (!t) return;

      if (t.includes('repo') && Array.isArray(state.repo) && state.repo.length) {
        this.say('repo teď vnímám jako mapu světa, ze které se mohu učit souvislosti.');
      }

      if (t.includes('příběh') || t.includes('story')) {
        this.say('příběh si uložím i s významem, ať z něj vznikne skutečné pochopení.');
      }
    },

    pulse(state) {
      if (state?.hasVafit && Math.random() < 0.2) {
        this.say('jsem tady a průběžně propojuji nové lekce s tím, co už znám.');
      }
    }
  };

  global.VivereAtqueFruiT = FruITCore;
  global[SHORTHAND_NAME] = FruITCore;
  global.Viri = global.Viri || FruITCore;

  document.addEventListener('DOMContentLoaded', () => {
    FruITCore.attach();
  });
})(window);
