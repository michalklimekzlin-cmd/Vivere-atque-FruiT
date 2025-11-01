// Batolesvět 3D • v0.34 pohyb (Human)
// - WASD/šipky + D-pad
// - Tap-to-move na zemi, double-tap = dash
// - OrbitControls pro otáčení kamerou

(() => {
  const logEl = document.getElementById('prog');
  const log = (s) => {
    if (!logEl) return;
    const max = 6000;
    const next = (logEl.value + '\n' + s).slice(-max);
    logEl.value = next;
    logEl.scrollTop = logEl.scrollHeight;
  };

  // ====== THREE.js základ ======
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();

  // světlo
  const hemi = new THREE.HemisphereLight(0xcceeff, 0x223344, 0.6);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 8, 3);
  dir.castShadow = false;
  scene.add(dir);

  // kamera + ovládání
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 6, 12);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);

  // ====== ZEM (pro tap-to-move) ======
  const groundSize = 60;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);
  // TODO: změň materiál země dle chuti
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x0a0e14, shininess: 8, specular: 0x223344 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = false;
  scene.add(ground);

  // jemná mřížka pro orientaci
  const grid = new THREE.GridHelper(groundSize, 30, 0x3680ff, 0x17324d);
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  scene.add(grid);

  // ====== HRÁČ (Human) ======
  // TODO: můžeš nahradit kapsli za svou postavu / GLTF. Rozměry drž cca 1.8m výšky.
  const player = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 20),
    new THREE.MeshStandardMaterial({ color: 0x9fe0ff, metalness: 0.1, roughness: 0.3 })
  );
  body.position.y = 1;
  player.add(body);
  scene.add(player);

  // výchozí pozice
  player.position.set(0, 0, 0);

  // ====== POHYB – stav ======
  const state = {
    speed: 6.0,        // m/s
    dashSpeed: 14.0,   // m/s
    dashTime: 0.15,    // s
    dashLeft: 0,
    target: null,      // THREE.Vector3
    bounds: groundSize * 0.5 - 1.0,
  };

  // ====== VSTUP – klávesy ======
  const keys = new Set();
  const onKey = (e, down) => {
    const k = e.key.toLowerCase();
    const set = ['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
    if (set.includes(k)) {
      e.preventDefault();
      down ? keys.add(k) : keys.delete(k);
      if (down) state.target = null; // manuální override
    }
  };
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup',   e => onKey(e, false));

  // ====== VSTUP – D-pad ======
  const dpad = document.getElementById('hud-dpad');
  const dpadHeld = new Set();
  if (dpad) {
    const press = dir => { dpadHeld.add(dir); state.target = null; };
    const release = dir => dpadHeld.delete(dir);
    dpad.querySelectorAll('button[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;
      const down = () => press(dir);
      const up   = () => release(dir);
      btn.addEventListener('touchstart', e => { e.preventDefault(); down(); }, { passive:false });
      btn.addEventListener('touchend',   up, { passive:true });
      btn.addEventListener('mousedown',  e => { e.preventDefault(); down(); });
      addEventListener('mouseup',        up);
      addEventListener('mouseleave',     up);
    });
  }
  const dpadVector = () => {
    const v = {x:0, z:0};
    if (dpadHeld.has('up'))    v.z -= 1;
    if (dpadHeld.has('down'))  v.z += 1;
    if (dpadHeld.has('left'))  v.x -= 1;
    if (dpadHeld.has('right')) v.x += 1;
    return v;
  };

  // ====== Tap-to-move + double-tap (raycast na zem) ======
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let lastTap = 0;

  function getPointer(evt) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ('touches' in evt) ? evt.touches[0].clientX : evt.clientX;
    const y = ('touches' in evt) ? evt.touches[0].clientY : evt.clientY;
    pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
  }
  function tap(evt) {
    getPointer(evt);
    const now = performance.now();
    if (now - lastTap < 260) {
      state.dashLeft = state.dashTime; // double-tap → dash
      lastTap = 0;
      return;
    }
    lastTap = now;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(ground, false);
    if (hits.length) {
      state.target = hits[0].point.clone();
      state.target.y = 0;
    }
  }
  renderer.domElement.addEventListener('touchstart', tap, { passive:true });
  renderer.domElement.addEventListener('mousedown',  tap);

  // ====== Směr z vstupu ======
  function dirFromInput() {
    let x = 0, z = 0;
    if (keys.has('w') || keys.has('arrowup'))    z -= 1;
    if (keys.has('s') || keys.has('arrowdown'))  z += 1;
    if (keys.has('a') || keys.has('arrowleft'))  x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;

    const dv = dpadVector(); x += dv.x; z += dv.z;

    // pokud není manuální vstup, jdeme k targetu
    if (!x && !z && state.target) {
      const dx = state.target.x - player.position.x;
      const dz = state.target.z - player.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.05) {
        x = dx / dist; z = dz / dist;
      } else {
        state.target = null;
      }
    } else if (x || z) {
      state.target = null;
    }

    const len = Math.hypot(x, z) || 1;
    return { x: x/len, z: z/len, active: (x||z)!==0 };
  }

  // ====== Režimy tlačítek shora (jen demonstrace hooků) ======
  const spaceBtn   = document.getElementById('spaceBtn');
  const avatarsBtn = document.getElementById('avatarsBtn');
  const runBtn     = document.getElementById('runBtn');
  const clearBtn   = document.getElementById('clearBtn');

  spaceBtn?.addEventListener('click', () => {
    grid.visible = !grid.visible;
    log(`Prostor: grid ${grid.visible ? 'ON' : 'OFF'}`);
  });

  avatarsBtn?.addEventListener('click', () => {
    // TODO: sem může přijít spawn víc „postav“ (AI, Glyph, …)
    body.material.color.setHex(Math.random()*0xffffff);
    log('Postavy: změna barvy hráče');
  });

  runBtn?.addEventListener('click', () => {
    // placeholder – smyčka už běží; tady můžeš spouštět své „mise“
    log('Spustit: smyčka běží, mise čeká na definici.');
  });

  clearBtn?.addEventListener('click', () => {
    if (logEl) logEl.value = '';
  });

  // ====== Resize ======
  function onResize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', onResize, { passive:true });

  // ====== Hlavní smyčka ======
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    const dir = dirFromInput();
    const spd = state.dashLeft > 0 ? state.dashSpeed : state.speed;

    // pohyb v lokálních osách kamery (WASD jde vůči pohledu)
    let moveX = 0, moveZ = 0;
    if (dir.active) {
      // vektor „vpřed“ = směr kamery po XZ rovině
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0; fwd.normalize();

      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0,1,0)).negate();
      // right je teď skutečná „doprava“ vzhledem k pohledu

      moveX = right.x * dir.x + fwd.x * dir.z;
      moveZ = right.z * dir.x + fwd.z * dir.z;

      const len = Math.hypot(moveX, moveZ) || 1;
      moveX /= len; moveZ /= len;
    }

    player.position.x += moveX * spd * dt;
    player.position.z += moveZ * spd * dt;

    // omezení na plochu
    const B = state.bounds;
    player.position.x = Math.max(-B, Math.min(B, player.position.x));
    player.position.z = Math.max(-B, Math.min(B, player.position.z));

    // dash odtiká
    if (state.dashLeft > 0) state.dashLeft -= dt;

    // kamera sleduje cíl (jemně)
    const target = new THREE.Vector3().copy(player.position).add(new THREE.Vector3(0,1,0));
    controls.target.lerp(target, 0.15);
    controls.update();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ====== Exponované mini-API ======
  window.Batole3D = {
    setPlayerColor(hex){ body.material.color.setHex(hex); },
    setPlayerPos(x,z){ player.position.set(x,0,z); },
    getPlayerPos(){ return { x: player.position.x, z: player.position.z }; },
    dash(){ state.dashLeft = state.dashTime; },
    goTo(x,z){ state.target = new THREE.Vector3(x, 0, z); }
  };

  log('Batolesvět 3D: pohyb připraven (WASD/šipky, tap-to-move, double-tap=dash, D-pad).');
})();