console.log('[Chybožrout-Opravář] UI online');

const logBox = document.getElementById('scanLog');
const btn = document.getElementById('scanBtn');

function log(t){ const d=document.createElement('div'); d.textContent='['+new Date().toLocaleTimeString()+'] '+t; logBox.appendChild(d); logBox.scrollTop=logBox.scrollHeight; }

function show(lines){
  if (!Array.isArray(lines)) return;
  lines.forEach(l => log(l));
}

document.addEventListener('DOMContentLoaded', ()=>{
  // self-test – ať víš, že je naloadovaný i nový repairnet.js
  const v = (window.RepairNet && window.RepairNet.version) || '??';
  log('✅ UI připraveno • RepairNet v'+v);
});

btn.addEventListener('click', async () => {
  if (!(window.RepairNet && RepairNet.scanDeep)) {
    log('❌ RepairNet.scanDeep() není k dispozici – zkontroluj, že je načten ./repairnet.js');
    return;
  }
  log('Spouštím rekurzivní sken podsložek…');
  try {
    const out = await RepairNet.scanDeep();
    show(out);
    log('Hotovo ✅');
  } catch(e){
    log('💥 Chyba skenu: '+(e.message||e));
  }
});
