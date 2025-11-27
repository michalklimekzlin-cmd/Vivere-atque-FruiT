<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>VaFT • HoloCore</title>
  <style>
    body {
      margin: 0;
      background: #000;
      color: #fff;
      font-family: system-ui;
      overflow: hidden;
    }
    canvas {
      position: fixed;
      inset: 0;
    }
  </style>
</head>
<body>

<canvas id="holo"></canvas>

<script type="module">
  import {
    HoloPalette,
    createCurve,
    Motion,
    createHoloObject
  } from "./VaFT-HoloCore.js";

  const canvas = document.getElementById("holo");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener("resize", resize);

  // základní testovací křivka (vertikální pulz)
  const testCurve = createCurve({
    points: Array.from({ length: 60 }, (_, i) => ({
      x: 0,
      y: i * 8
    })),
    color: HoloPalette.darkRed,
    width: 2,
    wave: 2,
    opacity: 0.9
  });

  const holo = createHoloObject({
    curves: [testCurve],
    glow: 0.5,
    particles: 50,
    rotation: 0.004
  });

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    holo.tick(t * 0.001);

    testCurve.points.forEach((p, i) => {
      const offset = Motion.waveOffset(i, t * 0.002, 8);
      const x = cx + offset;
      const y = cy - 200 + i * 6;

      ctx.globalAlpha = testCurve.opacity;
      ctx.strokeStyle = testCurve.color;
      ctx.lineWidth = testCurve.width;

      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
</script>

</body>
</html>
