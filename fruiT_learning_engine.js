// Vivere atque Fru'i¡'T - učící engine
(function initFruiTLearningEngine(global) {
  const ALLOWED_CATEGORIES = [
    'knowledge',
    'rules',
    'language',
    'mathematics',
    'character',
    'relationships',
    'questions'
  ];

  const engine = {
    learn(input) {
      const category = String(input.category || 'knowledge').toLowerCase();
      const normalizedCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'knowledge';
      const lessonText = String(input.lesson || '').trim();
      const meaning = String(input.meaning || '').trim() || lessonText;
      const relations = Array.isArray(input.relations) ? input.relations : [];

      const lesson = {
        id: input.id || crypto.randomUUID(),
        teacher: input.teacher || 'Učitel',
        title: input.title || 'Lekce bez názvu',
        category: normalizedCategory,
        lesson: lessonText,
        meaning,
        relations,
        approved: input.approved !== false,
        created: input.created || new Date().toISOString()
      };

      const understandingDepth = this.estimateUnderstandingDepth(lesson);
      const semanticNode = {
        concept: lesson.title,
        category: lesson.category,
        meaning: lesson.meaning,
        understandingDepth,
        relations: relations.map((relation) => ({
          target: relation.target || relation.concept || relation,
          relation: relation.type || relation.relation || 'souvisí s'
        }))
      };

      global.fruiTMemorySystem?.addShortTerm(lesson);
      global.fruiTMemorySystem?.consolidateToLongTerm(lesson);
      global.fruiTMemorySystem?.archiveLesson(lesson);
      global.fruiTMemorySystem?.upsertConcept(lesson.title, semanticNode);
      semanticNode.relations.forEach((link) => {
        if (link.target) {
          global.fruiTMemorySystem?.linkConcepts(lesson.title, link.target, link.relation);
        }
      });

      return {
        lesson,
        semanticNode,
        summary: this.explainInCzech(semanticNode),
        selfProgrammingHints: this.deriveHints(lesson)
      };
    },

    estimateUnderstandingDepth(lesson) {
      const textScore = Math.min(lesson.lesson.length / 220, 0.6);
      const meaningScore = Math.min(lesson.meaning.length / 220, 0.25);
      const relationScore = Math.min((lesson.relations || []).length * 0.05, 0.15);
      return Number((textScore + meaningScore + relationScore).toFixed(2));
    },

    deriveHints(lesson) {
      const hints = [];
      if (lesson.category === 'rules') hints.push('Vytvořit validační pravidla pro nové vstupy.');
      if (lesson.category === 'language') hints.push('Rozšířit slovník významů a synonym v češtině.');
      if (lesson.category === 'mathematics') hints.push('Přidat výpočetní modul pro ověření výsledků.');
      if (lesson.category === 'character') hints.push('Aktualizovat hodnoty a tón odpovědí Fru\'i¡\'T.');
      if (lesson.category === 'relationships') hints.push('Posílit semantic graph pro vyhledání souvislostí.');
      if (lesson.category === 'questions') hints.push('Vygenerovat zpětné otázky pro hlubší pochopení učitele.');
      if (!hints.length) hints.push('Propojit nové znalosti se stávající mapou repozitáře.');
      return hints;
    },

    explainInCzech(node) {
      return `Rozumím konceptu „${node.concept}" na úrovni ${node.understandingDepth}. Souvislosti: ${node.relations.length}.`;
    },

    suggestCapabilitiesFromLessons() {
      const longTerm = global.fruiTMemorySystem?.state?.longTerm || [];
      const categorySet = new Set(longTerm.map((item) => item.category));
      const capabilities = [];

      if (categorySet.has('language')) capabilities.push('CzechSemanticParaphraser');
      if (categorySet.has('mathematics')) capabilities.push('MathReasoningValidator');
      if (categorySet.has('rules')) capabilities.push('RuleBasedSafetyLayer');
      if (categorySet.has('relationships')) capabilities.push('ConceptGraphNavigator');
      if (!capabilities.length) capabilities.push('LessonToKnowledgePipeline');

      return capabilities;
    }
  };

  global.fruiTLearningEngine = engine;
})(window);
