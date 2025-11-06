const consoleEl = document.getElementById('hlavounConsole');
const cmdInput = document.getElementById('hlavounCmd');
const runBtn = document.getElementById('hlavounRun');
const modeBtn = document.getElementById('hlavounMode');
const noteBtn = document.getElementById('hlavounNote');

let reviaState = localStorage.getItem('revia_mode') || 'angel';

function log(text, type="sys") {
  const p = document.createElement('p');
  p.innerHTML = `<b>[${type}]</b> ${text}`;
  consoleEl.appendChild(p);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function runCommand(cmd) {
  if (!cmd.trim()) return;
  log(cmd, "user");
  if (cmd.toLowerCase().includes("revia")) {
    log("Analyzuju stav Revie: " + reviaState);
  } else if (cmd.toLowerCase().includes("mode")) {
    toggleRevia();
  } else {
    log("Zatím neumím reagovat na: " + cmd);
  }
}

function toggleRevia() {
  reviaState = reviaState === 'angel' ? 'daemon' : 'angel';
  localStorage.setItem('revia_mode', reviaState);
  log("Přepínám Revii na " + reviaState + " mód.");
}

function writeNote() {
  const note = prompt("Co chceš zapsat do křídla?");
  if (note) {
    localStorage.setItem('revia_note', note);
    log("Zapsal jsem do křídla: " + note);
  } else {
    log("Zápis zrušen.");
  }
}

runBtn.addEventListener('click', () => {
  runCommand(cmdInput.value);
  cmdInput.value = '';
});

cmdInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    runCommand(cmdInput.value);
    cmdInput.value = '';
  }
});

modeBtn?.addEventListener('click', toggleRevia);
noteBtn?.addEventListener('click', writeNote);

log("Inicializuji jádro Hlavouna...");
setTimeout(() => log("Synchronizace s Revii: " + reviaState), 1000);
