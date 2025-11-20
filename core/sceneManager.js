// core/sceneManager.js
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { getAssetPath } from "./pathManager.js";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2d3e5e);

  const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 6, 15);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = !esMovil;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  if (esMovil) {
    const luzSuave = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(luzSuave);
  } else {
    const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.3);
    luzPrincipal.position.set(5, 10, 5);
    luzPrincipal.castShadow = true;
    scene.add(luzPrincipal);

    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(luzAmbiente);
  }

  // ===============================
  // 🎯 Cargar escenario según selección
  // ===============================
  const stageId =
    localStorage.getItem("selectedStage") ||
    JSON.parse(localStorage.getItem("configMultijugador"))?.escenario ||
    "SP_Stage3"; // fallback a ciudad

  const mapaEscenarios = {
    SP_Stage1: "Assets/granja/granja.fbx",
    MP_Stage1: "Assets/granja/granja.fbx",

    SP_Stage2: "Assets/mercado/MERCADO.fbx",
    MP_Stage2: "Assets/mercado/supermercado.fbx",

    SP_Stage3: "Assets/city/city.fbx",
    MP_Stage3: "Assets/city/city.fbx",
  };

  const rutaEscenario = getAssetPath(mapaEscenarios[stageId]);

  const loader = new FBXLoader();
  loader.load(
    rutaEscenario,
    (modelo) => {
      modelo.scale.setScalar(0.01);
      modelo.position.set(0, -0.8, 0);
      scene.add(modelo);
      console.log("🏞️ Escenario cargado:", rutaEscenario);
    },
    undefined,
    (err) => console.error("❌ Error al cargar escenario:", err)
  );

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
