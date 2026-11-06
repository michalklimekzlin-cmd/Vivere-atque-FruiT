async function loadCtverecek() {
  try {
    const res = await fetch('./ctverecek-0001.json');
    const data = await res.json();

    const grid = document.getElementById('grid');
    if (!grid) return;

    // Hlavní “velký” čtverec – celý kámen
    const main = document.createElement('div');
    main.className = 'tile tile-main';
    main.textContent = `Čtvereček ${data.id} • ${data.name}`;
    grid.appendChild(main);

    // Pod-čtverečky (části repa)
    (data.items || []).forEach(item => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = item.label || item.id;

      // sem se v budoucnu napojí logika (otevření, propojení, engine…)
      tile.onclick = () => {
        console.log('Kliknuto na:', item);
        alert(`Jednou tu bude logika pro: ${item.path}`);
      };

      grid.appendChild(tile);
    });

  } catch (err) {
    console.error('Chyba při načítání čtverečku 0001:', err);
  }
}

loadCtverecek();
