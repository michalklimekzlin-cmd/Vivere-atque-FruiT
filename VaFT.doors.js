// viri.door.js — „dílna za Virim“ (jemné dveře/portál v pozadí)
export function startViriDoor(canvas){
  const ctx = canvas.getContext('2d');
  let w=0,h=0,t=0, open=0.35, pulse=0;

  function resize(){
    w = canvas.width  = canvas.clientWidth  || innerWidth;
    h = canvas.height = canvas.clientHeight || innerHeight;
  }
  addEventListener('resize', resize); resize();

  // reakce na události (nevyžaduje změny jinde)
  addEventListener('evt:voice',  ()=>{ pulse = Math.min(1, pulse+0.35); open = Math.min(1, open+0.05); });
  addEventListener('evt:ground', ()=>{ open = Math.max(0.25, open-0.08); });
  addEventListener('evt:mood',   e=>{ const c=(e.detail?.calm||0); open = Math.min(1, open + c*0.1); });

  function draw(){
    t += 0.016;
    // pozadí – temný gradient
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,   '#01070a');
    g.addColorStop(0.6, '#00060a');
    g.addColorStop(1,   '#000');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    const cx = w/2, cy = h/2;
    const doorW = Math.min(w,h)*0.18 * (0.75 + Math.sin(t*0.6)*0.03);
    const doorH = Math.min(w,h)*0.42 * (0.95 + Math.cos(t*0.4)*0.02);
    const gap   = doorW * (0.25 + open*0.75);

    // levé/prvé křídlo
    const glow = 0.25 + 0.35*Math.max(0,pulse) + 0.15*Math.sin(t*2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = `rgba(80,240,220,${0.25+glow*0.2})`;
    ctx.fillStyle   = `rgba(10,30,35,${0.55+glow*0.15})`;
    ctx.lineWidth   = 2;

    // levé
    ctx.beginPath();
    ctx.rect(-gap-doorW, -doorH/2, doorW, doorH);
    ctx.fill(); ctx.stroke();

    // pravé
    ctx.beginPath();
    ctx.rect(+gap, -doorH/2, doorW, doorH);
    ctx.fill(); ctx.stroke();

    // svislá „spára“ (portál)
    const pG = ctx.createLinearGradient(-2, -doorH/2, 2, doorH/2);
    pG.addColorStop(0, 'rgba(0,255,220,0)');
    pG.addColorStop(0.5, `rgba(0,255,220,${0.35+glow*0.5})`);
    pG.addColorStop(1, 'rgba(0,255,220,0)');
    ctx.fillStyle = pG;
    ctx.fillRect(-2, -doorH/2, 4, doorH);

    // jemné „obvody“
    ctx.globalAlpha = 0.14 + glow*0.06;
    ctx.strokeStyle = '#33d4c4';
    for(let i=0;i<6;i++){
      const yy = -doorH/2 + (i+1)*(doorH/7);
      ctx.beginPath();
      ctx.moveTo(-gap-doorW+6, yy);
      ctx.lineTo(-gap-10, yy);
      ctx.moveTo(gap+10, yy);
      ctx.lineTo(gap+doorW-6, yy);
      ctx.stroke();
    }
    ctx.restore();

    // lehké vyprchávání pulzu
    pulse *= 0.92;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
