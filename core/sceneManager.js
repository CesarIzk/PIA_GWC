// core/sceneManager.js
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { getAssetPath } from "./pathManager.js";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2d3e5e);

  // 🎥 Cámara centrada entre los dos jugadores
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 6, 15);
  camera.lookAt(0, 1.5, 0);


  // 🎨 Renderizador
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // 💡 Iluminación
  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1);
  luzPrincipal.position.set(5, 10, 5);
  luzPrincipal.castShadow = true;
  scene.add(luzPrincipal);

  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(luzAmbiente);

  // 🏙️ Escenario base
  const loader = new FBXLoader();
  const rutaCiudad = getAssetPath("Assets/city/city.fbx");
  loader.load(
    rutaCiudad,
    (modelo) => {
      modelo.scale.setScalar(0.01);
      modelo.position.set(0, -0.8, 0);
      scene.add(modelo);
      console.log("🏙️ Escenario cargado correctamente:", rutaCiudad);
    },
    undefined,
    (err) => console.error("❌ Error al cargar escenario:", err)
  );

  // 🔁 Redimensionado automático
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
