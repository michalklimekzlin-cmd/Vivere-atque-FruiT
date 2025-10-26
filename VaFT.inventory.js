// Malý HUD „Deník/Inventář“ – tipy + procenta
const $ = (s)=>document.querySelector(s);
const pct = x => Math.round((x||0)*100);

function tipsFor(mix){
  const dom = Object.entries(mix).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'batolesvet';
  const t = {
    batolesvet: ['Zapiš poznatek – paměť živí Viriho.', 'Drž klidný puls.'],
    glyph:      ['Zkus symbol → nebo ☼', 'Stručná zpráva pomůže týmu.'],
    ai:         ['Navrhni další krok: „prozkoumej východ“', 'Ověř hypotézu a pošli hlas.'],
    pedrovci:   ['Popiš pocit – Viri se učí z emocí.', 'Změň prostředí a sleduj reakci.'],
  };
  return t[dom];
}

export async function buildInventory(state){
  const el = $('#hudLog'); if(!el) return state;
  const m = state.mix||{};
  const lines = [
    `🧭 fáze: <b>${state.label||'…'}</b>`,
    `🧪 mix → B:${pct(m.batolesvet)}% • G:${pct(m.glyph)}% • AI:${pct(m.ai)}% • P:${pct(m.pedrovci)}%`,
    ...tipsFor(m).map(x=>'• '+x),
  ];
  el.innerHTML = lines.join('<br>');
  return { at:Date.now(), mix:m, label:state.label };
}
