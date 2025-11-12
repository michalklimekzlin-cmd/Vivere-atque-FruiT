console.log('[Chybožrout-Opravář v2.1] start');

const logBox = document.getElementById('scanLog');
const btn = document.getElementById('scanBtn');

function log(msg) {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

// nahraď tímto:
btn.addEventListener('click', async () => {
  log('Spouštím rekurzivní sken podsložek (v2.2-pre)…');
  const results = await window.RepairNet.scanDeep();
  results.forEach(r => log(r));
  log('Hotovo ✅');
});
