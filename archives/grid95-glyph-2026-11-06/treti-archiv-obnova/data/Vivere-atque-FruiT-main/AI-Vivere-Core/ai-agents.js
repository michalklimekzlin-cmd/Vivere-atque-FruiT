/**
 * AI Memory System - localStorage management
 * Paměť, audit log, API klíč rotace
 */

class AIMemory {
    constructor() {
        this.storageKey = 'vivere_ai_memory';
        this.init();
    }

    init() {
        if (!this.get('initialized')) {
            this.reset();
            this.set('initialized', true);
            this.log('SYSTEM', 'AI Memory System Initialized');
        }
    }

    reset() {
        const newMemory = {
            api_key: this.generateApiKey(),
            api_rotation: Date.now(),
            conversations: [],
            audit_log: [],
            agents: {
                validator: { status: 'active', checks: 0 },
                keeper: { status: 'active', entries: 0 },
                learner: { status: 'active', learned: 0 }
            },
            training_params: {
                learning_rate: 0.1,
                model_version: '1.0.0',
                last_training: Date.now()
            }
        };
        localStorage.setItem(this.storageKey, JSON.stringify(newMemory));
        return newMemory;
    }

    get(key) {
        const memory = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        return key ? memory[key] : memory;
    }

    set(key, value) {
        const memory = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        memory[key] = value;
        localStorage.setItem(this.storageKey, JSON.stringify(memory));
    }

    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'sk-';
        for (let i = 0; i < 48; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    rotateApiKey() {
        const newKey = this.generateApiKey();
        this.set('api_key', newKey);
        this.set('api_rotation', Date.now());
        this.log('SECURITY', 'API Key rotated');
        return newKey;
    }

    addConversation(role, message) {
        const conversations = this.get('conversations') || [];
        conversations.push({
            timestamp: Date.now(),
            role: role,
            message: message,
            hash: this.hashMessage(message)
        });
        this.set('conversations', conversations);
        this.log('CHAT', `${role}: ${message.substring(0, 50)}...`);
    }

    log(type, message) {
        const auditLog = this.get('audit_log') || [];
        auditLog.push({
            timestamp: Date.now(),
            type: type,
            message: message,
            id: Math.random().toString(36).substring(7)
        });
        this.set('audit_log', auditLog);
    }

    hashMessage(message) {
        let hash = 0;
        for (let i = 0; i < message.length; i++) {
            const char = message.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    getStorageSize() {
        return new Blob([JSON.stringify(localStorage)]).size;
    }

    getStats() {
        const memory = this.get();
        return {
            conversations: memory.conversations?.length || 0,
            auditEntries: memory.audit_log?.length || 0,
            storageSize: this.getStorageSize(),
            apiKeyAge: Date.now() - memory.api_rotation,
            lastTrained: memory.training_params?.last_training
        };
    }
}

const aiMemory = new AIMemory();
