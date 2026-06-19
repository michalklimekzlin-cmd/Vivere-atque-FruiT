// vaft.loader.js — jednotný startér pro všechny entity Vivere atque Frui¡'T
(function(){
  const KERNEL_PATH = "../vaft.kernel.js";
  const SCRIPT_VERSION = "1.1.0";

  // 1. Dynamicky načte jádro
  function loadKernel(src, cb){
    const s = document.createElement("script");
    s.src = src + "?v=" + SCRIPT_VERSION;
    s.onload = cb;
    s.onerror = () => console.error("VAFT Loader: Kernel se nepodařilo načíst:", src);
    document.head.appendChild(s);
  }

  // 2. Po načtení jádra se automaticky spustí
  function startKernel(){
    if (typeof VAFT === "undefined"){
      console.error("VAFT Loader: Jádro nebylo nalezeno.");
      return;
    }

    const pathParts = location.pathname.split("/").filter(Boolean);
    const entity = pathParts[pathParts.length - 1] || "Vivere";

    // Zapíše do logu, že daná bytost žije
    console.log(`🧩 Spouštím ${entity} přes Loader + Kernel`);

    // Spustí entitu (např. VAFT-GhostGirl, VAFT-BearHead…)
    const state = VAFT.boot();
    console.log("VAFT boot:", state);
  }

  // 3. Když už je jádro načtené (např. v hlavní appce), rovnou ho spustí
  if (window.VAFT) startKernel();
  else loadKernel(KERNEL_PATH, startKernel);
})();
