const vafits = [
  { name:'Zelený hlídač', glyph:'🟢' },
  { name:'Oranžový běžec', glyph:'🟠' },
  { name:'Modrý orbit', glyph:'🔵' },
  { name:'Fialový snílek', glyph:'🟣' },
];

const list = document.getElementById('vafitList');
vafits.forEach(v => {
  const div = document.createElement('div');
  div.className = 'vafit';
  div.textContent = v.glyph;
  div.onclick = () => {
    localStorage.setItem('VAFT_SELECTED_VAFIT', JSON.stringify(v));
    alert('Vybral jsi: '+v.name);
    history.back();
  };
  list.appendChild(div);
});
