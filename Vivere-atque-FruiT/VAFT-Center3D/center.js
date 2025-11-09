// VAFT Center 3D — hlavní scéna
const canvas = document.getElementById("vaft3d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20);

const ambient = new THREE.AmbientLight(0x4488ff, 0.6);
scene.add(ambient);
const point = new THREE.PointLight(0xffffff, 1.2);
point.position.set(10, 10, 10);
scene.add(point);

const loader = new THREE.FontLoader();
loader.load(
  "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/fonts/helvetiker_regular.typeface.json",
  font => {
    const textGeo = new THREE.TextGeometry("Vivere atque FruiT", {
      font: font,
      size: 2,
      height: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 5,
    });
    textGeo.center();

    const textMat = new THREE.MeshStandardMaterial({
      color: 0x33aaff,
      emissive: 0x112244,
      metalness: 0.5,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(textGeo, textMat);
    scene.add(mesh);

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.02;
      mesh.rotation.y += 0.003;
      mesh.rotation.x = Math.sin(t * 0.3) * 0.1;
      point.intensity = 1 + Math.sin(t * 0.5) * 0.3;
      renderer.render(scene, camera);
    }
    animate();

    // kliknutí → efekt „vstupu do světa V“
    window.addEventListener("click", () => {
      const startZ = camera.position.z;
      const targetZ = 8;
      const startTime = performance.now();
      const duration = 1000;
      function zoomAnim(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        camera.position.z = startZ - (startZ - targetZ) * progress;
        renderer.render(scene, camera);
        if (progress < 1) requestAnimationFrame(zoomAnim);
        else setTimeout(() => (camera.position.z = 20), 800); // vrátí se zpět
      }
      requestAnimationFrame(zoomAnim);
    });
  }
);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.dampingFactor = 0.05;
controls.minDistance = 6;
controls.maxDistance = 40;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
