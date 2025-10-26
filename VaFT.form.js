// VaFT • Form
// Hlavní orb (živé jádro zobrazované v canvasu)

export function startVaFTForm(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  resize();
  let mix = { B:0, G:0, AI:0, P:0 };
  let t = 0;

  function resize() {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width  = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize, { passive:true });

  function setMix(m) { mix = m; }

  function render() {
    t += 1/60;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const cx = w/2, cy = h/2;

    // základní pulsace
    const baseR = 48 + 22*Math.sin(t*2.2);
    const wB = clamp(mix.B/3, 0, 1);
    const wG = clamp(mix.G/3, 0, 1);
    const wA = clamp(mix.AI/3,0, 1);
    const wP = clamp(mix.P/3, 0, 1);

    // jemná koróna
    ctx.beginPath();
    ctx.arc(cx, cy, baseR+18, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(${Math.floor(160+70*wA)},${Math.floor(210*wG)},${Math.floor(255*wB)},0.25)`;
    ctx.lineWidth = 8;
    ctx.stroke();

    // hlavní orb gradient
    const grd = ctx.createRadialGradient(cx,cy,8, cx,cy, baseR);
    grd.addColorStop(0,  `rgba(255,255,255,0.95)`);
    grd.addColorStop(0.5,`rgba(${Math.floor(90+130*wB)},${Math.floor(120+120*wG)},${Math.floor(160+80*wA)},0.85)`);
    grd.addColorStop(1,  `rgba(0,0,0,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI*2);
    ctx.fill();

    // čtyři „lóby“ týmů
    drawLobe(cx,cy, baseR,   0.00, wB);
    drawLobe(cx,cy, baseR,   1.57, wG);
    drawLobe(cx,cy, baseR,   3.14, wA);
    drawLobe(cx,cy, baseR,   4.71, wP);
  }

  function drawLobe(cx,cy,r,phi,w) {
    if (w <= 0.01) return;
    const k = 6 + 18*w;
    const x = cx + Math.cos(phi) * (r*0.55);
    const y = cy + Math.sin(phi) * (r*0.55);
    ctx.beginPath();
    ctx.arc(x, y, k, 0, Math.PI*2);
    ctx.fillStyle = `rgba(180,230,255,${0.18 + 0.35*w})`;
    ctx.fill();
  }

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  function step() {
    render();
  }

  return { setMix, step };
}