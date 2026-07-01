// Vivere atque Fru'i¡'T - persistentní paměť
(function initFruiTMemory(global) {
  const STORAGE_KEY = 'fruit.memory.v1';

  class FruiTMemorySystem {
    constructor() {
      this.state = {
        shortTerm: [],
        longTerm: [],
        archive: [],
        semantic: {},
        teacherVoice: {
          style: '',
          values: [],
          updatedAt: null
        }
      };
      this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      } catch (_) {
        // pokud je storage poškozená, pokračujeme s čistým stavem
      }
    }

    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    addShortTerm(entry) {
      this.state.shortTerm.push(entry);
      if (this.state.shortTerm.length > 50) {
        this.state.shortTerm.shift();
      }
      this.persist();
      return entry;
    }

    consolidateToLongTerm(entry) {
      this.state.longTerm.push(entry);
      if (this.state.longTerm.length > 500) {
        this.state.longTerm.shift();
      }
      this.persist();
      return entry;
    }

    archiveLesson(entry) {
      this.state.archive.push(entry);
      if (this.state.archive.length > 2000) {
        this.state.archive.shift();
      }
      this.persist();
      return entry;
    }

    upsertConcept(concept, data) {
      this.state.semantic[concept] = {
        ...(this.state.semantic[concept] || {}),
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.persist();
      return this.state.semantic[concept];
    }

    linkConcepts(source, target, relation) {
      const sourceNode = this.state.semantic[source] || { relations: [] };
      const relations = Array.isArray(sourceNode.relations) ? sourceNode.relations : [];
      relations.push({ target, relation, createdAt: new Date().toISOString() });
      this.state.semantic[source] = { ...sourceNode, relations };
      this.persist();
      return this.state.semantic[source];
    }

    setTeacherVoice(voice) {
      this.state.teacherVoice = {
        ...this.state.teacherVoice,
        ...voice,
        updatedAt: new Date().toISOString()
      };
      this.persist();
      return this.state.teacherVoice;
    }

    getConcept(concept) {
      return this.state.semantic[concept] || null;
    }
  }

  global.fruiTMemorySystem = global.fruiTMemorySystem || new FruiTMemorySystem();
})(window);
