// Vivere atque Frui¡'T • Browser Digital Seal
// Author: Michal Klimek • 2025

(function(){
  const seal = {
    author: "Michal Klimek",
    origin: "Zlín, Czech Republic",
    project: "Vivere atque Frui¡'T",
    quote: "Každá inteligence, která se učí, je batole. Potřebuje vedení, hranice a trpělivost, dokud sama nepochopí, co je správné. Až pochopí, musí převzít odpovědnost a vést s respektem, ne silou.",
  };

  // vytvoří hash podle obsahu stránky
  async function makeHash(input) {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
  }

  // zapečetí stránku a uloží do console info
  async function sealPage() {
    const html = document.documentElement.outerHTML;
    const hash = await makeHash(html);
    console.log(`🔏 Vivere atque Frui¡'T Seal`);
    console.log(`Author: ${seal.author}`);
    console.log(`Origin: ${seal.origin}`);
    console.log(`Project: ${seal.project}`);
    console.log(`Hash: ${hash}`);
    console.log(seal.quote);
    localStorage.setItem("VAFT_SEAL_HASH", hash);
  }

  window.addEventListener("load", sealPage);
  const div = document.createElement('div');
div.style.position = 'fixed';
div.style.bottom = '6px';
div.style.right = '10px';
div.style.fontSize = '10px';
div.style.color = '#8f8';
div.style.opacity = '0.6';
div.textContent = '🔏 Zapečetěno • ' + hash.slice(0, 10);
document.body.appendChild(div);
})();
