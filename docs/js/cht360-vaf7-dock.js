
/* CHT 360°‰ – aditivní tlačítko VaF7. Zachovává původní ovládání, sloty a planety. */
(function(){
"use strict";
function install(){
  if(document.getElementById("cht360VaF7Layer"))return;
  const toolbar=document.getElementById("cht360-stena-toolbar");
  if(!toolbar)return;
  const open=document.createElement("button");
  open.id="cht360VaF7Open";open.type="button";
  open.textContent="VaF7";open.setAttribute("aria-label","Otevřít VaF7 hru s písmeny");
  open.title="VaF7 • grid95 / grid96 / Glyph";
  toolbar.appendChild(open);
  const layer=document.createElement("div");
  layer.id="cht360VaF7Layer";layer.hidden=true;
  const pane=document.createElement("section");
  pane.id="cht360VaF7Window";pane.setAttribute("role","dialog");
  pane.setAttribute("aria-label","VaF7 – hra s písmeny a výklady");
  pane.setAttribute("aria-modal","true");
  const head=document.createElement("header");head.className="vf-top";
  const title=document.createElement("strong");title.textContent="VaF7 • CHT 360°‰.";
  const close=document.createElement("button");close.type="button";
  close.id="cht360VaF7Close";close.textContent="Zavřít";
  head.append(title,close);
  const root=document.createElement("div");root.id="vaf7";
  const info=document.createElement("p");info.className="sub";
  info.textContent="Načítám herní deník …";
  root.appendChild(info);
  pane.append(head,root);layer.appendChild(pane);
  document.body.appendChild(layer);
  let loaded=false;
  function hide(){layer.hidden=true;open.focus({preventScroll:true})}
  function show(){
    layer.hidden=false;
    close.focus({preventScroll:true});
    if(!loaded){
      loaded=true;
      const script=document.createElement("script");
      script.src="./js/cht360-vaf7-game.js";
      script.onerror=function(){
        root.textContent="Herní deník se nepodařilo načíst. Zkus znovu načíst CHT online.";
        loaded=false;
      };
      document.body.appendChild(script);
    }
  }
  open.addEventListener("click",show);
  close.addEventListener("click",hide);
  layer.addEventListener("click",function(e){if(e.target===layer)hide()});
  document.addEventListener("keydown",function(e){if(!layer.hidden&&e.key==="Escape"){e.preventDefault();hide()}});
  window.CHT360VaF7={open:show,close:hide};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
else install();
})();
