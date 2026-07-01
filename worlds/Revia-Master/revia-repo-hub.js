export const REPO_HUB = {
  components: [
    { name: 'Hlavoun', description: 'Řídicí mozek a orchestrátor chování.', href: '../../components/Hlavoun/index.html' },
    { name: 'Viri', description: 'Lehký modul pro zprávy a propojení.', href: '../../components/Viri/README.md' },
    { name: 'Pikos', description: 'Pomocný modul s vlastní logikou.', href: '../../components/Pikos/README.md' },
    { name: 'Bicak', description: 'Samostatná komponenta s vlastním PWA.', href: '../../components/Bicak/index.html' }
  ],
  worlds: [
    { name: 'VAFT-Center3D', description: '3D centrum světa VAFT.', href: '../VAFT-Center3D/index.html' },
    { name: 'Revia', description: 'Původní Revia svět.', href: '../Revia/index.html' },
    { name: 'Others', description: 'Další světy v repozitáři.', href: '../others/' }
  ],
  docs: [
    { name: 'PHILOSOPHY', description: 'Filozofie projektu.', href: '../../docs/PHILOSOPHY.md' },
    { name: 'COMPONENTS', description: 'Přehled komponent.', href: '../../docs/COMPONENTS.md' },
    { name: 'API', description: 'API body a usage.', href: '../../docs/API.md' },
    { name: 'ARCHITECTURE', description: 'Architektura systému.', href: '../../ARCHITECTURE.md' }
  ],
  source: [
    { name: 'Revia index', description: 'Zdrojový kód starší Revie.', href: '../Revia/index.html' },
    { name: 'Hlavoun JS', description: 'Klíčový engine Hlavouna.', href: '../../hlavoun.js' },
    { name: 'Center JS', description: 'Centrální logika aplikace.', href: '../../center.js' }
  ]
};

export function renderHubTab(container, tab, activeName = '') {
  const items = REPO_HUB[tab] || [];
  container.innerHTML = '';

  items.forEach((item) => {
    const link = document.createElement('a');
    link.className = `hub-item ${item.name === activeName ? 'active' : ''}`;
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const strong = document.createElement('strong');
    strong.textContent = item.name;

    const span = document.createElement('span');
    span.textContent = item.description;

    link.append(strong, span);
    container.appendChild(link);
  });
}
