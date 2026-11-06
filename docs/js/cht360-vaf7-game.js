(function(){
"use strict";
var KEY="cht360_vaf7_journal_v1";
var $=id=>document.getElementById(id);
var root=$("vaf7");if(!root)return;
var entries=[];try{var old=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(old))entries=old.filter(x=>x&&typeof x.id==="string"&&typeof x.text==="string").slice(0,5000)}catch(e){}
root.innerHTML=[
'<div class="panel"><h2>VaF7 • hra s písmeny</h2><p class="sub">Grid95 = návrhy asistenta. Grid96 = tvoje návrhy. Každý výklad je nejdřív možnost, ne ověřená skutečnost.</p>',
'<label for="vf-text">Slovo, věta, číslo nebo znak</label><textarea id="vf-text" maxlength="1800" placeholder="Co máme společně prozkoumat?"></textarea>',
'<label for="vf-source">Kdo přinesl nápad?</label><select id="vf-source"><option value="grid96">grid96 • ty</option><option value="grid95">grid95 • asistent</option><option value="spolu">společně</option></select>',
'<label for="vf-kind">Druh nápovědy</label><select id="vf-kind"><option>Grid</option><option>Glyph</option><option>VaF’i’T • robůtek</option><option>Symbol</option></select>',
'<label for="vf-core">Jádro</label><select id="vf-core"><option>JAZYK</option><option>HRA</option><option>ZEMĚ</option><option>ŘÍZENÍ</option></select>',
'<label for="vf-meaning">Možný význam</label><textarea id="vf-meaning" maxlength="2200" placeholder="Co by to mohlo znamenat?"></textarea>',
'<button class="action" id="vf-add">Připsat možnost</button><button class="action" id="vf-scan">Najít značky</button><button class="action" id="vf-play">Herní příklad</button><p class="sub" id="vf-hints" aria-live="polite"></p></div>',
'<div class="panel"><h3>Naše pravidla</h3><p>Grid = nenápadná stopa ve slově. Glyph = hra s tvarem písmen, například I, l, ī. VaF’i’T = hravý robůtek a nová spojení.</p>',
'<p class="sub">7/• může nést několik významů dle situace. 7/˚ je třeba tichá rada či postřeh. 7/° může značit důležitou soukromou nápovědu.</p>',
'<p class="sub">Záměna písmen není šifrování. Citlivé údaje nepiš do veřejných zpráv.</p></div>',
'<div class="panel"><h3>Deník možností <span id="vf-count"></span></h3><div id="vf-list"></div>',
'<button class="action" id="vf-export">Export deníku JSON</button>',
'<label class="vf-import">Import bez přepisování<input id="vf-import" type="file" accept=".json,application/json" hidden></label>',
'<p id="vf-status" class="sub">Uloženo lokálně v zařízení, nikoliv na GitHubu.</p></div>'
].join("");
function node(tag,cl,txt){var x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=txt;return x}
function store(){try{localStorage.setItem(KEY,JSON.stringify(entries));$("vf-status").textContent="Uloženo v tomto zařízení: "+entries.length+" záznamů";return true}catch(e){$("vf-status").textContent="Uložení selhalo: úložiště může být plné.";return false}}
function add(item){
if(entries.length>=5000){alert("Deník je plný. Nejprve proveď export.");return}
item.id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);item.time=new Date().toISOString();
entries.push(item);if(!store()){entries.pop();return}render();return true
}
function render(){
$("vf-count").textContent="("+entries.length+")";
var area=$("vf-list");area.replaceChildren();
if(!entries.length){area.append(node("p","sub","První záznam můžeš připsat nahoře."));return}
entries.slice(-70).reverse().forEach(function(e){
var card=node("article","vf-entry");
card.append(node("div","vf-meta",(e.source||"grid96")+" • "+(e.kind||"Grid")+" • "+(e.core||"JAZYK")));
card.append(node("div","vf-word",e.text));
card.append(node("p","", "Možnost: "+(e.meaning||"")));
if(e.parent)card.append(node("p","sub","Nový výklad k dřívějšímu záznamu"));
var b=node("button","action","Připsat další výklad");b.type="button";
b.onclick=function(){var meaning=prompt("Jaká další možnost tě napadá?");if(meaning&&meaning.trim())add({source:$("vf-source").value,kind:e.kind,core:e.core,text:e.text,meaning:meaning.trim().slice(0,2200),parent:e.id})};
card.append(b);area.append(card)
})
}
$("vf-add").onclick=function(){
var text=$("vf-text").value.trim(),meaning=$("vf-meaning").value.trim();
if(!text||!meaning){$("vf-status").textContent="Vyplň slovo či větu a možný význam.";return}
if(add({source:$("vf-source").value,kind:$("vf-kind").value,core:$("vf-core").value,text:text,meaning:meaning})){$("vf-text").value="";$("vf-meaning").value=""}
};
$("vf-scan").onclick=function(){
var s=$("vf-text").value,h=[];
if(/[a-zá-ž]I[a-zá-ž]/u.test(s))h.push("Velké I uvnitř slova může připomínat l.");
if(/ī/u.test(s))h.push("ī může být záměna písmene i.");
if(/hd/i.test(s))h.push("„hd“ může být například obrazová kvalita.");
if(/7\/[•˚°]/u.test(s))h.push("Našel jsem značku 7/•, 7/˚ nebo 7/°.");
if(/[.•°˚´]/u.test(s))h.push("Ve větě jsou drobné značky.");
$("vf-hints").textContent=h.length?h.join(" "):"Žádný přednastavený vzor. Vlastní význam můžeme objevit společně."
};
var ix=0;
$("vf-play").onclick=function(){
var ex=[["aIe","Možná je místo malého l napsané velké I."],["līana","Znak ī může být náš Glyph."],["tehda","Herní dělení te • hd • da. Nejde o původ slova."],["7/˚","Například tichá rada nebo postřeh."]];
var e=ex[ix++%ex.length];$("vf-text").value=e[0];$("vf-meaning").value=e[1];
$("vf-kind").value="Glyph";$("vf-hints").textContent="Připravený příklad. Uloží se pouze tlačítkem Připsat možnost."
};
$("vf-export").onclick=function(){
var blob=new Blob([JSON.stringify({format:"vaf7-journal",version:1,entries:entries},null,2)],{type:"application/json"});
var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="vaf7-zaloha.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)
};
$("vf-import").onchange=async function(ev){
var f=ev.target.files[0];if(!f)return;
try{
if(f.size>2000000)throw Error("Příliš velký soubor");
var x=JSON.parse(await f.text());
if(x.format!=="vaf7-journal"||!Array.isArray(x.entries))throw Error("Neplatný formát VaF7");
var known=new Set(entries.map(e=>e.id));
var fresh=x.entries.filter(e=>e&&typeof e.id==="string"&&typeof e.text==="string"&&typeof e.meaning==="string"&&!known.has(e.id)).slice(0,Math.max(0,5000-entries.length)).map(e=>({id:e.id.slice(0,100),source:String(e.source||"grid96"),kind:String(e.kind||"Grid"),core:String(e.core||"JAZYK"),text:e.text.slice(0,1800),meaning:e.meaning.slice(0,2200),parent:e.parent||null,time:e.time||""}));
if(!fresh.length){$("vf-status").textContent="Žádné nové záznamy.";return}
if(!confirm("Připsat "+fresh.length+" záznamů? Staré zůstanou."))return;
entries.push(...fresh);if(!store())entries.splice(-fresh.length);render()
}catch(e){$("vf-status").textContent="Import selhal: "+e.message}finally{ev.target.value=""}
};
render()
})();