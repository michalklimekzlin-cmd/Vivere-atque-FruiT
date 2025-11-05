// Vivere atque FruiT • Browser Digital Seal
// Author: Michal Klimek • 2025

(function(){
  const seal = {
    author: "Michal Klimek",
    origin: "Zlín, Czech Republic",
    project: "Vivere atque FruiT",
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
    console.log(`🔏 Vivere atque FruiT Seal`);
    console.log(`Author: ${seal.author}`);
    console.log(`Origin: ${seal.origin}`);
    console.log(`Project: ${seal.project}`);
    console.log(`Hash: ${hash}`);
    console.log(seal.quote);
    localStorage.setItem("VAFT_SEAL_HASH", hash);
  }

  window.addEventListener("load", sealPage);
})();
