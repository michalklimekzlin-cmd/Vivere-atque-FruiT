// Zatím jednoduchý „puls života“ – pro budoucí verzi přidáme světelný efekt
document.addEventListener("DOMContentLoaded", () => {
  const head = document.querySelector(".head");
  if (!head) return;

  // lehké dýchání – zvětšení/zmenšení
  let scale = 1;
  let direction = 1;
  setInterval(() => {
    scale += direction * 0.005;
    if (scale > 1.05 || scale < 0.95) direction *= -1;
    head.style.transform = `rotateY(${Math.sin(Date.now()/1000)*12}deg) scale(${scale})`;
  }, 50);
});
