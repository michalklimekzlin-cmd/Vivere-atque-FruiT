// Napojí globální EVENTS na ViriXP (překládá události na „add“)
export function initViriLearning(xp){
  const clamp=(v)=>Math.max(0,Math.min(1,v));

  addEventListener('evt:voice', (e)=>{
    const {team='batolesvet', weight=0.6} = e.detail||{};
    xp.add({team, value:clamp(weight)});
  });

  addEventListener('evt:mood', (e)=>{
    const {calm=0, anxiety=0} = e.detail||{};
    if(calm>0)    xp.add({team:'pedrovci', value:clamp(calm*0.8)});
    if(anxiety>0) xp.add({team:'glyph',    value:clamp(anxiety*0.5)});
  });

  addEventListener('evt:vision', (e)=>{
    const {kind='symbol', truth=1} = e.detail||{};
    const team = kind==='path' ? 'ai' : 'glyph';
    xp.add({team, value:clamp(truth*0.8)});
  });

  addEventListener('evt:ground', ()=>{
    xp.add({team:'batolesvet', value:0.9});
  });
}
