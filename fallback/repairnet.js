// 🧩 Fallback RepairNet
// Používá se, pokud originální repairnet.js chybí

console.warn("[Fallback RepairNet] aktivní – načteno ze složky /fallback/");
window.RepairNet = window.RepairNet || {
  version: "fallback-0.1",
  scanDeep: async () => {
    console.log("Fallback RepairNet: simulace skenu...");
    return new Promise(r => setTimeout(r, 500));
  },
  fixNext: () => ({ msg: "Simulovaná oprava" }),
  fixAll: () => 0
};
