(function(){
  'use strict';
  if(document.getElementById('cht-glyph-open'))return;
  const style=document.createElement('style');
  style.textContent='#cht-glyph-open{position:fixed;bottom:max(14px,env(safe-area-inset-bottom));left:max(14px,env(safe-area-inset-left));z-index:2147483100;min-height:44px;padding:10px 17px;border:1px solid #c79b33;border-radius:50px;background:#0c1120;color:#ffe2ad;font:600 13px system-ui;box-shadow:0 6px 25px #0009;cursor:pointer}#cht-glyph-dialog{position:fixed;inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;border:0;background:#050815;overflow:hidden}#cht-glyph-dialog::backdrop{background:#050815}#cht-glyph-dialog iframe{width:100%;height:100%;border:0;display:block}';
  document.head.append(style);
  const button=document.createElement('button');button.id='cht-glyph-open';button.type='button';button.textContent='⟦ GLYPH · Paměť ⟧';button.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.id='cht-glyph-dialog';dialog.setAttribute('aria-label','GLYPH — paměť v písmenkách');
  let frame;
  button.onclick=function(){
    window.CHT360GlyphCoreBridge?.flush();
    if(!frame){frame=document.createElement('iframe');frame.src='./glyph-pamet/index.html';frame.title='GLYPH — paměť v písmenkách';frame.allow='clipboard-write';dialog.append(frame);}
    dialog.showModal();
    window.CHT360Network?.register({id:'cht360-glyph-memory',label:'GLYPH · Paměť v písmenkách',entry:'./glyph-pamet/',kind:'pwa',storageKeys:[]}).catch(()=>{});
  };
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data?.type==='GLYPH_CLOSE')dialog.close();});
  dialog.addEventListener('close',()=>button.focus());document.body.append(button,dialog);
})();
