"use strict";

const canvas = document.getElementById("globe-canvas");
const context = canvas.getContext("2d");
const panel = document.getElementById("memoryPanel");
const panelTitle = document.getElementById("panelTitle");
const panelSub = document.getElementById("panelSub");
const closePanel = document.getElementById("closePanel");
const slotGrid = document.getElementById("slotGrid");
const slotEditor = document.getElementById("slotEditor");
const slotName = document.getElementById("slotName");
const slotContent = document.getElementById("slotContent");
const saveSlot = document.getElementById("saveSlot");
const clearSlot = document.getElementById("clearSlot");
const searchInput = document.getElementById("searchInput");
const exportCore = document.getElementById("exportCore");
const importCore = document.getElementById("importCore");
const exportAll = document.getElementById("exportAll");
const importAll = document.getElementById("importAll");
const fileInput = document.getElementById("fileInput");
const statusBox = document.getElementById("statusBox");

const STORAGE_KEY = "vaft_pamet_v1";
const SLOT_COUNT = 70;

const cores = [
  {id:"earth",title:"Země",subtitle:"Modeling, světy a úhel pohledu",angle:-Math.PI*.72,radius:50},
  {id:"language",title:"Jazyk",subtitle:"Písmena, symboly, glyphy a význam",angle:-Math.PI*.18,radius:50},
  {id:"game",title:"Hra",subtitle:"Pravidla, události a postup",angle:Math.PI*.34,radius:50},
  {id:"control",title:"Řízení",subtitle:"Směrování, jednotky a propojení",angle:Math.PI*.86,radius:50}
];

let memory = loadMemory();
let width=0,height=0,pixelRatio=1,rotation=0,rotationVelocity=.0015;
let selectedCore=null,selectedSlotIndex=null;
let dragging=false,movedDuringDrag=false,previousPointerX=0;
let importMode="core";

function createEmptySlot(index){
  return {id:index+1,name:`Slot ${index+1}`,content:"",updatedAt:null};
}

function createEmptyCore(){
  return Array.from({length:SLOT_COUNT},(_,i)=>createEmptySlot(i));
}

function createEmptyMemory(){
  return {
    version:1,
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    cores:{
      earth:createEmptyCore(),
      language:createEmptyCore(),
      game:createEmptyCore(),
      control:createEmptyCore()
    }
  };
}

function loadMemory(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return createEmptyMemory();
    const parsed=JSON.parse(raw);
    if(!parsed.cores)throw new Error("Neplatná struktura");
    for(const core of ["earth","language","game","control"]){
      if(!Array.isArray(parsed.cores[core]))parsed.cores[core]=createEmptyCore();
      while(parsed.cores[core].length<SLOT_COUNT){
        parsed.cores[core].push(createEmptySlot(parsed.cores[core].length));
      }
      parsed.cores[core]=parsed.cores[core].slice(0,SLOT_COUNT);
    }
    return parsed;
  }catch(error){
    console.warn("Paměť byla obnovena do výchozího stavu.",error);
    return createEmptyMemory();
  }
}

function saveMemory(reason = "save") {
  memory.updatedAt = new Date().toISOString();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(memory)
  );

  updatePills();

  window.dispatchEvent(
    new CustomEvent("cht.memory.changed", {
      detail: {
        reason,
        coreId: selectedCore?.id || null,
        slotId:
          selectedSlotIndex === null
            ? null
            : selectedSlotIndex + 1,
        updatedAt: memory.updatedAt
      }
    })
  );
}

function byteSize(text){
  return new Blob([text]).size;
}

function formatBytes(bytes){
  if(bytes<1024)return `${bytes} B`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(2)} MB`;
}

function getCoreStats(coreId){
  const slots=memory.cores[coreId];
  const used=slots.filter(slot=>slot.content.trim()||slot.name.trim()!==`Slot ${slot.id}`).length;
  const size=byteSize(JSON.stringify(slots));
  return {used,size};
}

function updatePills(){
  for(const core of cores){
    const stats=getCoreStats(core.id);
    const pill=document.getElementById(`pill-${core.id}`);
    pill.textContent=`${core.title.toUpperCase()} · ${stats.used}/70`;
  }
}

function resizeCanvas(){
  const r=canvas.getBoundingClientRect();
  pixelRatio=Math.min(window.devicePixelRatio||1,2);
  width=r.width;height=r.height;
  canvas.width=Math.round(width*pixelRatio);
  canvas.height=Math.round(height*pixelRatio);
  context.setTransform(pixelRatio,0,0,pixelRatio,0,0);
}

function getCorePosition(core){
  const orbitRadius=Math.min(width,height)*.28;
  const centerX = width * 0.72;
const centerY = height * 0.28;
  const angle=core.angle+rotation;
  return {
    x:centerX+Math.cos(angle)*orbitRadius,
    y:centerY+Math.sin(angle)*orbitRadius*.52,
    depth:(Math.sin(angle)+1)/2
  };
}

function drawBackground(){
  const centerX=width/2,centerY=height/2;
  const glow=context.createRadialGradient(centerX,centerY,10,centerX,centerY,Math.min(width,height)*.52);
  glow.addColorStop(0,"rgba(255,220,155,.08)");
  glow.addColorStop(.42,"rgba(80,100,180,.025)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  context.fillStyle=glow;context.fillRect(0,0,width,height);
  context.save();context.globalAlpha=.22;context.fillStyle="#ffe2ad";
  for(let i=0;i<70;i++){
    const x=(i*83.71)%width,y=(i*47.29)%height,size=i%7===0?1.3:.55;
    context.beginPath();context.arc(x,y,size,0,Math.PI*2);context.fill();
  }
  context.restore();
}

function drawConnections(){
  const p=cores.map(getCorePosition);
  context.save();context.lineWidth=1;
  for(let a=0;a<p.length;a++){
    for(let b=a+1;b<p.length;b++){
      const g=context.createLinearGradient(p[a].x,p[a].y,p[b].x,p[b].y);
      g.addColorStop(0,"rgba(255,226,173,.08)");
      g.addColorStop(.5,"rgba(255,226,173,.28)");
      g.addColorStop(1,"rgba(255,226,173,.08)");
      context.strokeStyle=g;context.beginPath();context.moveTo(p[a].x,p[a].y);context.lineTo(p[b].x,p[b].y);context.stroke();
    }
  }
  context.restore();
}

function drawCenterCore(time) {
  const cx = width * 0.69;
const cy = height * 0.34;
  const pulse =
    1 + Math.sin(time * 0.002) * 0.045;

  context.save();

  for (let ring = 0; ring < 5; ring++) {
    context.beginPath();

    context.arc(
      cx,
      cy,
      (36 + ring * 13) * pulse,
      0,
      Math.PI * 2
    );

    context.strokeStyle =
      `rgba(255,220,160,${0.20 - ring * 0.028})`;

    context.lineWidth = 1;
    context.stroke();
  }

  const gradient =
    context.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      58
    );

  gradient.addColorStop(
    0,
    "rgba(255,240,200,.92)"
  );

  gradient.addColorStop(
    0.20,
    "rgba(255,190,100,.52)"
  );

  gradient.addColorStop(
    1,
    "rgba(255,190,100,0)"
  );

  context.fillStyle = gradient;

  context.beginPath();
  context.arc(
    cx,
    cy,
    58,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = "#fff0cf";
  context.font = "800 7px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(
    "{*(˚.•).•)//ˇ^360o°˚\\\\(•.(•.)ア)",
    cx,
    cy
  );

  context.restore();
}

function drawCore(core,time){
  const p=getCorePosition(core),scale=.72+p.depth*.40,r=core.radius*scale,active=selectedCore&&selectedCore.id===core.id;
  context.save();context.globalAlpha=.48+p.depth*.52;
  const g=context.createRadialGradient(p.x,p.y,2,p.x,p.y,r*1.45);
  g.addColorStop(0,active?"rgba(255,245,215,.95)":"rgba(255,225,175,.74)");
  g.addColorStop(.24,active?"rgba(255,185,95,.52)":"rgba(255,185,95,.25)");
  g.addColorStop(1,"rgba(255,185,95,0)");
  context.fillStyle=g;context.beginPath();context.arc(p.x,p.y,r*1.45,0,Math.PI*2);context.fill();
  context.strokeStyle=active?"rgba(255,240,205,.94)":"rgba(255,220,160,.54)";
  context.lineWidth=active?1.8:1;context.beginPath();context.arc(p.x,p.y,r,0,Math.PI*2);context.stroke();
  for(let ring=1;ring<5;ring++){
    context.beginPath();context.ellipse(p.x,p.y,r,r*ring/5,0,0,Math.PI*2);
    context.strokeStyle=`rgba(255,220,160,${active?.30:.17})`;context.lineWidth=.7;context.stroke();
  }
  for(let line=0;line<8;line++){
    const a=line/8*Math.PI;context.beginPath();context.ellipse(p.x,p.y,Math.abs(Math.cos(a))*r,r,0,0,Math.PI*2);
    context.strokeStyle=`rgba(255,220,160,${active?.25:.13})`;context.lineWidth=.7;context.stroke();
  }
  const pulse=r+7+Math.sin(time*.003+core.angle)*3;
  context.beginPath();context.arc(p.x,p.y,pulse,0,Math.PI*2);
  context.strokeStyle=active?"rgba(255,235,195,.34)":"rgba(255,220,160,.10)";context.stroke();
  context.fillStyle="#fff0cf";context.font=`800 ${Math.round(11*scale)}px system-ui`;context.textAlign="center";context.textBaseline="middle";
  context.fillText(core.title,p.x,p.y-4);
  const stats=getCoreStats(core.id);
  context.fillStyle="rgba(255,240,210,.65)";context.font=`${Math.max(8,Math.round(9*scale))}px system-ui`;
  context.fillText(`${stats.used}/70`,p.x,p.y+12);
  context.restore();
  core.position=p;core.drawRadius=r;
}

function render(time){
  context.clearRect(0,0,width,height);
  drawBackground();drawConnections();drawCenterCore(time);
  const ordered=[...cores].sort((a,b)=>getCorePosition(a).depth-getCorePosition(b).depth);
  for(const core of ordered)drawCore(core,time);
  if(!dragging)rotation+=rotationVelocity;
  requestAnimationFrame(render);
}

function findCoreAt(x,y){
  return [...cores].sort((a,b)=>getCorePosition(b).depth-getCorePosition(a).depth).find(core=>{
    if(!core.position)return false;
    return Math.hypot(x-core.position.x,y-core.position.y)<=core.drawRadius+16;
  });
}

function openCore(core){
  selectedCore=core;
  selectedSlotIndex=null;
  panelTitle.textContent=`${core.title} · Paměť`;
  panelSub.textContent=`70 slotů · samostatné uložení`;
  panel.classList.add("open");
  slotEditor.classList.remove("open");
  searchInput.value="";
  renderSlots();
  updateStatus();
}

function renderSlots(){
  if(!selectedCore)return;
  const query=searchInput.value.trim().toLowerCase();
  const slots=memory.cores[selectedCore.id];
  slotGrid.innerHTML="";
  slots.forEach((slot,index)=>{
    const searchable=`${slot.name} ${slot.content}`.toLowerCase();
    if(query&&!searchable.includes(query))return;
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="slotBtn";
    const used=slot.content.trim()||slot.name.trim()!==`Slot ${slot.id}`;
    if(used)btn.classList.add("obsazeny");
    if(index===selectedSlotIndex)btn.classList.add("aktivni");
    btn.innerHTML=`<strong>${escapeHtml(slot.name||`Slot ${slot.id}`)}</strong><span>${slot.content.trim()?"obsazeno":"prázdné"}</span>`;
    btn.addEventListener("click",()=>selectSlot(index));
    slotGrid.appendChild(btn);
  });
}

function selectSlot(index){
  selectedSlotIndex=index;
  const slot=memory.cores[selectedCore.id][index];
  slotName.value=slot.name;
  slotContent.value=slot.content;
  slotEditor.classList.add("open");
  renderSlots();
  updateStatus();
}

function updateStatus(message=""){
  if(!selectedCore){statusBox.textContent="Vyber jádro.";return}
  const stats=getCoreStats(selectedCore.id);
  let text=`${selectedCore.title}: obsazeno ${stats.used}/70 · velikost ${formatBytes(stats.size)}`;
  if(selectedSlotIndex!==null)text+=` · otevřen slot ${selectedSlotIndex+1}`;
  if(message)text+=` · ${message}`;
  statusBox.textContent=text;
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function downloadJson(data,filename){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

saveSlot.addEventListener("click",()=>{
  if(!selectedCore||selectedSlotIndex===null)return;
  const slot=memory.cores[selectedCore.id][selectedSlotIndex];
  slot.name=slotName.value.trim()||`Slot ${selectedSlotIndex+1}`;
  slot.content=slotContent.value;
  slot.updatedAt=new Date().toISOString();
  saveMemory();renderSlots();updateStatus("uloženo");
});

clearSlot.addEventListener("click",()=>{
  if(!selectedCore||selectedSlotIndex===null)return;
  if(!confirm(`Vymazat slot ${selectedSlotIndex+1}?`))return;
  memory.cores[selectedCore.id][selectedSlotIndex]=createEmptySlot(selectedSlotIndex);
  saveMemory();slotName.value=`Slot ${selectedSlotIndex+1}`;slotContent.value="";
  renderSlots();updateStatus("vymazáno");
});

searchInput.addEventListener("input",renderSlots);
closePanel.addEventListener("click",()=>panel.classList.remove("open"));

exportCore.addEventListener("click",()=>{
  if(!selectedCore)return;
  downloadJson({
    typ:"jadro-pameti",
    jadro:selectedCore.id,
    nazev:selectedCore.title,
    sloty:memory.cores[selectedCore.id],
    exportovano:new Date().toISOString()
  },`pamet_${selectedCore.id}.json`);
});

importCore.addEventListener("click",()=>{
  if(!selectedCore)return;
  importMode="core";fileInput.value="";fileInput.click();
});

exportAll.addEventListener("click",()=>{
  downloadJson(memory,"vaft_pamet_cela.json");
});

importAll.addEventListener("click",()=>{
  importMode="all";fileInput.value="";fileInput.click();
});

fileInput.addEventListener("change",async()=>{
  const file=fileInput.files&&fileInput.files[0];
  if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(importMode==="core"){
      if(!selectedCore)throw new Error("Není vybrané jádro");
      const slots=Array.isArray(data.sloty)?data.sloty:data;
      if(!Array.isArray(slots))throw new Error("Soubor neobsahuje sloty");
      memory.cores[selectedCore.id]=Array.from({length:SLOT_COUNT},(_,i)=>{
        const source=slots[i]||{};
        return {
          id:i+1,
          name:typeof source.name==="string"&&source.name.trim()?source.name:`Slot ${i+1}`,
          content:typeof source.content==="string"?source.content:"",
          updatedAt:source.updatedAt||null
        };
      });
      saveMemory();renderSlots();updateStatus("jádro importováno");
    }else{
      if(!data.cores)throw new Error("Soubor neobsahuje celou Paměť");
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      memory=loadMemory();saveMemory();renderSlots();updateStatus("celá Paměť importována");
    }
  }catch(error){
    alert(`Import se nezdařil: ${error.message}`);
  }
});

canvas.addEventListener("pointerdown",event=>{
  dragging=true;movedDuringDrag=false;previousPointerX=event.clientX;canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove",event=>{
  if(!dragging)return;
  const dx=event.clientX-previousPointerX;
  if(Math.abs(dx)>2)movedDuringDrag=true;
  rotation+=dx*.007;previousPointerX=event.clientX;
});
canvas.addEventListener("pointerup",event=>{
  const r=canvas.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
  dragging=false;
  if(!movedDuringDrag){
    const core=findCoreAt(x,y);
    if(core)openCore(core);
  }
});

window.addEventListener("resize",resizeCanvas);
resizeCanvas();updatePills();requestAnimationFrame(render);

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });
}
