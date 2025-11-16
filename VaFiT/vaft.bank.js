// VaF'i'T – písmenková banka
// soubor: VaFiT/vaft.bank.js

(function (win) {
  const LetterBank = {
    KEY: "VAFT_LETTERS",

    load() {
      return localStorage.getItem(this.KEY) || "";
    },

    save(str) {
      try {
        localStorage.setItem(this.KEY, String(str));
      } catch (e) {
        console.warn("LetterBank save fail", e);
      }
    },

    balance() {
      return this.load().length;
    },

    addFromString(str) {
      if (!str) return;
      const current = this.load();
      this.save(current + String(str));
    },

    take(count) {
      count = Math.max(0, count | 0);
      const current = this.load();
      if (current.length <= count) {
        this.save("");
        return current;
      }
      const spent = current.slice(0, count);
      const rest  = current.slice(count);
      this.save(rest);
      return spent;
    }
  };

  // vyvěsíme ven
  win.LetterBank = LetterBank;
})(window);
