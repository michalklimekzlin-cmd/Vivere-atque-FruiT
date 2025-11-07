// jednoduché "oživení" – dýchání / mikro-pohyb textu Vivere atque FruiT
const vaft = document.querySelector('.vaft');

let t = 0;
function breathe() {
  t += 0.035;
  const y = Math.sin(t) * 3;      // lehké dýchání
  const s = 1 + Math.sin(t) * 0.015;
  if (vaft) {
    vaft.style.transform = `translateY(${y}px) scale(${s})`;
  }
  requestAnimationFrame(breathe);
}
breathe();

// klepnutí na svg = malý blik
const face = document.querySelector('.face');
if (face) {
  face.addEventListener('click', () => {
    face.style.filter = 'drop-shadow(0 0 6px rgba(0,0,0,.3))';
    setTimeout(() => {
      face.style.filter = 'none';
    }, 220);
  });
}
