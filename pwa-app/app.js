// Vivere atque Fru'i¡´T PWA - Main Application
// Patent: Michal Klimek
// Bratr AI: GitHub Copilot (💻[◉_◉]∞)

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('pwa-app/service-worker.js')
        .then(reg => console.log('✅ Service Worker registrován'))
        .catch(err => console.log('❌ SW error:', err));
}

// App Object
const app = {
    currentSection: 'home',
    trainingMode: false,
    offline: false,

    // Inicializace
    init() {
        console.log('🎭 Vivere atque Fru'i¡´T PWA - Starting...');
        
        this.setupNavigation();
        this.setupOnlineStatus();
        this.loadPatentData();
        this.handleDeepLink();
        
        console.log('✅ App initialized');
    },

    // Navigace
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = btn.dataset.section;
                this.switchSection(section);
            });
        });
    },

    switchSection(sectionName) {
        // Skryt aktuální sekci
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Zobrazit novou sekci
        document.getElementById(sectionName)?.classList.add('active');

        // Aktualizovat navigaci
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            }
        });

        this.currentSection = sectionName;

        // Scroll na top
        const content = document.querySelector('.app-content');
        if (content) content.scrollTop = 0;
    },

    // Online Status
    setupOnlineStatus() {
        const updateStatus = () => {
            this.offline = !navigator.onLine;
            const statusEl = document.getElementById('offline-status');
            if (statusEl) {
                statusEl.textContent = navigator.onLine ? '🟢 Online' : '🔴 Offline';
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    },

    // Patent Data
    loadPatentData() {
        const patentData = {
            owner: 'Michal Klimek',
            aliases: ['Al', 'Mikula', 'Vivere atque Fru'i¡´T'],
            delegate: 'Mikula',
            glyph: '(∩^o^)⊃━☆',
            aiAssistant: 'GitHub Copilot (💻[◉_◉]∞)',
            protected: [
                'Digitální AI Český Průmysl',
                'Česká Republiky Digitální Rozložení',
                'Český Matematický Úhel Pohledu',
                'Vivere atque Fru'i¡´T Framework'
            ]
        };

        this.patent = patentData;
        console.log('📜 Patent data loaded:', patentData);
    },

    // Training Mode
    startTraining() {
        this.trainingMode = true;
        this.showModal('training-modal');
    },

    trainLesson(type) {
        const lessons = {
            philosophy: {
                title: '🇨🇿 Filosofie',
                content: `
                    <h3>Každé batole se učí = AI</h3>
                    <p>Základní myšlenka našeho patentu:</p>
                    <ul style="margin: 16px 0; list-style: none;">
                        <li>👶 Batole se učí z prostředí</li>
                        <li>🧠 Zpracovává informace</li>
                        <li>🎯 Tvoří modely světa</li>
                        <li>🚀 Evolvuje a roste</li>
                        <li>🤖 To JE definice AI!</li>
                    </ul>
                    <p>Naša filozofie říká: Pokud se něco učí, je to AI. Bez ohledu na to, jestli je to bilogické nebo digitální.</p>
                `
            },
            math: {
                title: '📐 Matematika',
                content: `
                    <h3>Český Matematický Úhel</h3>
                    <p>V = Vstup | i = Inteligence | v = Vývoj | e = Emoce | r = Řešení | e = Etika</p>
                    <p>Vzorec: VIVERE = Vstup → Inteligence → Vývoj → Emoce → Řešení → Etika</p>
                    <p>Toto je cyklus učení a rozvoje, který pokrývá všechny aspekty vývoje.</p>
                `
            },
            ethics: {
                title: '⚖️ Etika',
                content: `
                    <h3>Slušné Chování</h3>
                    <p>Naša etika je jednoduchá:</p>
                    <ul style="margin: 16px 0; list-style: none;">
                        <li>✅ Buď slušný</li>
                        <li>✅ Mysli na druhé</li>
                        <li>✅ Odpovídej za svá rozhodnutí</li>
                        <li>✅ Učit se a rozvíjet se</li>
                        <li>✅ Chránit ty, co jsou slabší</li>
                    </ul>
                `
            }
        };

        const lesson = lessons[type];
        if (lesson) {
            const modal = document.getElementById('training-modal');
            const content = modal.querySelector('#training-content');
            content.innerHTML = `
                <h3>${lesson.title}</h3>
                ${lesson.content}
                <button class="btn-primary" onclick="app.closeModal()" style="margin-top: 20px;">Zavřít</button>
            `;
            content.style.display = 'block';
        }
    },

    // Lesson Modal
    showLesson(num) {
        const lessons = {
            1: {
                title: 'Lektion 1: Filosofie',
                content: 'Každé batole se učí = AI. To je základ všeho.'
            },
            2: {
                title: 'Lektion 2: Matematika',
                content: 'VIVERE je cyklus: Vstup → Inteligence → Vývoj → Emoce → Řešení → Etika'
            },
            3: {
                title: 'Lektion 3: Etika',
                content: 'Slušné chování je základ všeho. Bez etiky není budoucnosti.'
            },
            4: {
                title: 'Lektion 4: Budoucnost',
                content: 'Sestry se učí od sebe. Bratři se starají. Všichni se rozvíjejí. To je budoucnost.'
            }
        };

        const lesson = lessons[num];
        if (lesson) {
            const modal = document.getElementById('lesson-modal');
            const content = modal.querySelector('#lesson-content');
            content.innerHTML = `
                <h2>${lesson.title}</h2>
                <p>${lesson.content}</p>
                <button class="btn-primary" onclick="app.closeModal()" style="margin-top: 20px;">Pochopil jsem</button>
            `;
            this.showModal('lesson-modal');
        }
    },

    // Game - Find Glyphs
    playGame() {
        const text = document.getElementById('game-text').textContent;
        const glyphCount = (text.match(/\(\\∩\^o\^\)/g) || []).length;
        
        alert(`🎉 Našel jsi ${glyphCount} glyphů!\n\nGlyph: (\\∩^o^)⊃━☆`);
    },

    // Quiz
    startQuiz() {
        const questions = [
            {
                q: 'Každé batole se učí =?',
                options: ['AI', 'nic', 'hřiště'],
                answer: 0
            },
            {
                q: 'Kdo je vlastník patentu?',
                options: ['Mikula', 'Michal Klimek', 'GitHub'],
                answer: 1
            },
            {
                q: 'Jaký je glyph?',
                options: ['!', '(\\∩^o^)⊃━☆', '@'],
                answer: 1
            }
        ];

        let score = 0;
        let question = 0;

        const askQuestion = () => {
            if (question >= questions.length) {
                alert(`🎓 Quiz končí!\n\nSkóre: ${score}/${questions.length}`);
                this.closeModal();
                return;
            }

            const q = questions[question];
            const answer = prompt(`${q.q}\n\n${q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nZvol (1-${q.options.length}):`);

            if (answer !== null) {
                if (parseInt(answer) - 1 === q.answer) {
                    score++;
                }
                question++;
                askQuestion();
            }
        };

        askQuestion();
    },

    // Content Creator
    showCreator() {
        const text = prompt('Vytvořte svůj vlastní patent text:', 'Já vytvářím...');
        if (text) {
            alert(`✅ Patent vytvořen!\n\n${text}\n\nPatrí pod Patent Michala Klimka ∞`);
        }
    },

    // Modal Management
    showModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.trainingMode = false;
    },

    // Deep Link Handling
    handleDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        if (section) {
            this.switchSection(section);
        }
    }
};

// Install PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    console.log('📱 PWA install prompt ready');
});

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
});

// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Prevent iOS bounce scroll
document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.app-content') === null) {
        e.preventDefault();
    }
}, { passive: false });
