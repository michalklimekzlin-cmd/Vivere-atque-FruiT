(function (win) {
  const STORAGE_KEY = "vaft.bank.state.v1";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  const Bank = {
    state: {
      initialized: false,    // jestli už víme počáteční zásobu
      totalInitial: 0,       // celkový „pool“ písmen
      spentTotal: 0,         // kolik se utratilo za celou dobu
      playersTotal: 0,       // kolik utratili hráči
      events: [],            // {ts, amount, source}
    },

    _load() {
      const s = loadState();
      if (s) this.state = s;
    },

    _save() {
      saveState(this.state);
    },

    _now() {
      return Date.now();
    },

    _format(num) {
      return Number(num || 0).toLocaleString("cs-CZ");
    },

    _currentLetters() {
      if (!win.VaFiT || !VaFiT.tokens || !VaFiT.tokens.getLetters) return 0;
      return VaFiT.tokens.getLetters();
    },

    // nastavení počáteční zásoby z portfolia 212
    onPortfolioLoaded(amount) {
      amount = Math.max(0, amount | 0);
      if (!this.state.initialized) {
        this.state.initialized = true;
        this.state.totalInitial = amount;
        this._save();
      } else if (amount > this.state.totalInitial) {
        // pokud do banky přiteče víc (nový vklad), navýšíme celkový pool
        const diff = amount - this.state.totalInitial;
        this.state.totalInitial = amount;
        // diff můžeme zapsat jako „vklad“ bez spotřeby
        this._save();
      }
      this.refreshView();
    },

    // spotřeba vyvolaná hráčem (chat, dílna…)
    onUserImpulse(text) {
      const len = (text || "").length;
      const cost = Math.max(1, Math.round(len / 5)); // 1 token ≈ 5 znaků
      this.spend(cost, "player-chat");
    },

    // obecná funkce pro utrácení písmen
    spend(amount, source) {
      amount = Math.max(0, amount | 0);
      if (!amount) return;

      if (!win.VaFiT || !VaFiT.tokens || !VaFiT.tokens.spendLetters) {
        // fallback: jen zapis do statistik, aniž bychom sáhli na motor
        this._registerSpend(amount, source, 0);
        return;
      }

      const res = VaFiT.tokens.spendLetters(amount);
      const used = res && typeof res.used === "number" ? res.used : amount;

      this._registerSpend(used, source, used);
    },

    _registerSpend(used, source, applied) {
      const now = this._now();
      this.state.spentTotal += used;
      if (source && source.indexOf("player") === 0) {
        this.state.playersTotal += used;
      }

      this.state.events.push({ ts: now, amount: used, source: source || "unknown" });

      // necháme historii cca 10 minut
      this.state.events = this.state.events.filter(
        (e) => now - e.ts < 10 * 60 * 1000
      );

      this._save();
      this.refreshView();
    },

    // spotřeba za posledních 60 sekund (průměr / s)
    _ratePerSecond() {
      const now = this._now();
      const windowMs = 60 * 1000;
      const recent = this.state.events.filter((e) => now - e.ts <= windowMs);
      const sum = recent.reduce((acc, e) => acc + (e.amount || 0), 0);
      if (!sum) return 0;
      return sum / 60;
    },

    refreshView() {
      const current = this._currentLetters();
      const total =
        this.state.totalInitial || (current + this.state.spentTotal);
      const spent = this.state.spentTotal;
      const players = this.state.playersTotal;
      const rate = this._ratePerSecond();

      const elTotal = document.getElementById("fuel-total");
      const elCurrent = document.getElementById("fuel-current");
      const elSpent = document.getElementById("fuel-spent");
      const elRate = document.getElementById("fuel-rate");
      const elPlayers = document.getElementById("fuel-players");

      if (elTotal) elTotal.textContent = this._format(total) + " tok.";
      if (elCurrent) elCurrent.textContent = this._format(current) + " tok.";
      if (elSpent) elSpent.textContent = this._format(spent) + " tok.";
      if (elRate)
        elRate.textContent =
          rate > 0 ? this._format(rate.toFixed(1)) + " tok./s" : "0 tok./s";
      if (elPlayers)
        elPlayers.textContent = this._format(players) + " tok.";
    },

    init() {
      this._load();
      // pokud ještě nemáme totalInitial, zkusíme ho odhadnout z motoru
      if (!this.state.initialized) {
        const current = this._currentLetters();
        if (current > 0) {
          this.state.initialized = true;
          this.state.totalInitial = current;
          this._save();
        }
      }
      this.refreshView();
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    Bank.init();
  });

  win.VAFT_BANK = Bank;
})(window);
