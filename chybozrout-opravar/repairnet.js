// 🛠️ RepairNet v2.3-stable
// Modul sítě oprav a diagnostiky pro systém Vivere atque FruiT
// Autor: Michal & Kovošrot 🧠🦾

window.RepairNet = (function () {
  const version = 'v2.3-stable';
  const logBox = () => document.getElementById('scanLog');
  const roots = [
    '../Revia/',
    '../Braska-Hlava/',
    '../Hlavoun/',
    '../Meziprostor-Core/',
    '../VAFT-Network/'
  ];

  // pomocná funkce pro logování do UI
  function log(msg, ok = false) {
    const box = logBox();
    if (box) {
      const line = document.createElement('div');
      line.textContent = `${ok ? '✅' : '❌'} ${msg}`;
      line.style.color = ok ? '#7FFF7F' : '#FF7777';
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
    console.log('[RepairNet]', msg);
  }

  // jednoduché fetch s kontrolou 404
  async function check(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        log(`${url} načteno (${res.status})`, true);
        return true;
      } else {
        log(`${url}: Nelze načíst (${res.status})`);
        return false;
      }
    } catch (e) {
      log(`${url}: ${e.message}`);
      return false;
    }
  }

  // hlavní sken systému
  async function scanDeep() {
    const box = logBox();
    if (box) box.innerHTML = '🔍 Spouštím rekurzivní sken podsložek...';
    let scanned = 0;
    for (const root of roots) {
      const url = `https://michalklimekzlin-cmd.github.io/Vivere-atque-FruiT/${root}index.html`;
      await check(url);
      scanned++;
    }
    log(`Hotovo ✅ • Skenováno objektů: ${scanned}`, true);
  }

  // propojení s UI
  function attachUI() {
    const btn = document.getElementById('scanBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      scanDeep();
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const box = logBox();
    if (box) box.textContent = `✅ UI připraveno • RepairNet ${version}`;
    attachUI();
  });

  // export
  return { version, scanDeep };
})();
