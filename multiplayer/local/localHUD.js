// ===========================================
//  FOOD FRENZY - MODO LOCAL 2 JUGADORES
// ===========================================

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

// ============ ESCENA ============
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a6b);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 14);
camera.lookAt(0, 1, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ============ ILUMINACIÓN ============
scene.add(new THREE.AmbientLight(0xfff5e1, 0.6));
const dirLight = new THREE.DirectionalLight(0xffaa66, 1.2);
dirLight.position.set(8, 15, -5);
dirLight.castShadow = true;
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0x7092be, 0x1f2833, 0.8);
scene.add(hemiLight);

// ============ CARGAR CIUDAD ============
const fbxLoader = new FBXLoader();
fbxLoader.load(
  "/Assets/city/city.fbx",
  (fbx) => {
    fbx.scale.set(0.0045, 0.0045, 0.0045);
    fbx.position.set(0, -1.2, 0);
    fbx.rotation.y = Math.PI;
    fbx.traverse((child) => {
      if (child.isMesh) child.receiveShadow = true;
    });
    scene.add(fbx);
    console.log("✅ Ciudad cargada");
  },
  undefined,
  (err) => console.error("❌ Error cargando ciudad:", err)
);

// ============ VARIABLES ============
let jugador1 = null, jugador2 = null;
const objetos = [];
const comidas = ["ajo", "banana", "bellota", "calabaza", "cebolla", "cereza", "chayote", "chicharos"];
const textureLoader = new THREE.TextureLoader();

let puntos1 = 0, vidas1 = 3;
let puntos2 = 0, vidas2 = 3;
let tiempo = 60;
let gravedad = 0.06;
const gravedadMaxima = 0.15;
let juegoActivo = true;

// ============ CREAR JUGADORES (CANASTAS) ============
function cargarCanasta(x, callback) {
  fbxLoader.load(
    "/Assets/basket2.fbx",
    (fbx) => {
      fbx.scale.set(0.015, 0.015, 0.015);
      fbx.position.set(x, 0.6, 6.5);
      fbx.rotation.y = Math.PI;
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(fbx);
      callback(fbx);
    },
    undefined,
    (err) => console.error("❌ Error cargando canasta:", err)
  );
}

cargarCanasta(-3, (canasta) => {
  jugador1 = canasta;
  console.log("🏀 Jugador 1 cargado");
});

cargarCanasta(3, (canasta) => {
  jugador2 = canasta;
  console.log("🏀 Jugador 2 cargado");
});

// ============ CONTROLES ============
const teclas = {};
window.addEventListener("keydown", e => teclas[e.key] = true);
window.addEventListener("keyup", e => teclas[e.key] = false);

// ============ HUD ============
function actualizarHUD() {
  document.getElementById("puntos1").textContent = puntos1.toString().padStart(3, "0");
  document.getElementById("puntos2").textContent = puntos2.toString().padStart(3, "0");
  document.getElementById("vidas1").src = "/Images/HUDs/Health" + vidas1 + ".png";
  document.getElementById("vidas2").src = "/Images/HUDs/Health" + vidas2 + ".png";
  document.getElementById("tiempo").textContent = tiempo;
}

// ============ CREAR OBJETOS ============
function crearObjeto() {
  if (!juegoActivo) return;

  const esBomba = Math.random() < 0.25;
  const nombre = esBomba ? "bomba" : comidas[Math.floor(Math.random() * comidas.length)];
  
  const modeloRuta = esBomba 
    ? "/Assets/bomb/source/bomb.fbx"
    : `/Assets/comida/${nombre}.fbx`;
  
  const texturaRuta = `/Assets/comida/${nombre}.png`;

  fbxLoader.load(
    modeloRuta,
    (objeto) => {
      // Aplicar textura solo a comida
      if (!esBomba) {
        const textura = textureLoader.load(texturaRuta);
        objeto.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: textura,
              roughness: 0.5,
              metalness: 0.1,
            });
            child.castShadow = true;
          }
        });
      }

      // Escalar y posicionar
      const escala = esBomba ? 0.012 : 0.015;
      objeto.scale.setScalar(escala);
      objeto.position.set((Math.random() - 0.5) * 10, 10, 6.5);
      objeto.userData.esBomba = esBomba;
      objeto.userData.velocidadRotacion = Math.random() * 0.05 + 0.02;

      // Calcular tamaño
      objeto.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(objeto);
      const size = new THREE.Vector3();
      box.getSize(size);
      objeto.userData.size = size;

      scene.add(objeto);
      objetos.push(objeto);
    },
    undefined,
    (err) => console.warn("⚠️ Error cargando objeto:", err)
  );
}

const spawnerInterval = setInterval(() => {
  if (juegoActivo) crearObjeto();
}, 1500);

// ============ TEMPORIZADOR ============
const temporizador = setInterval(() => {
  if (!juegoActivo) return;
  tiempo--;
  actualizarHUD();

  if (tiempo <= 0) {
    juegoActivo = false;
    clearInterval(spawnerInterval);
    const ganador = puntos1 > puntos2 ? "Jugador 1" : puntos2 > puntos1 ? "Jugador 2" : "Empate";
    alert(`⏰ Tiempo terminado!\n\n${ganador} gana!\n\nJugador 1: ${puntos1}\nJugador 2: ${puntos2}`);
    window.location.href = "../../index.html";
  }
}, 1000);

// ============ BUCLE DE ANIMACIÓN ============
function animar() {
  requestAnimationFrame(animar);

  if (!jugador1 || !jugador2) {
    renderer.render(scene, camera);
    return;
  }

  // Movimiento Jugador 1 (A/D)
  if (teclas["a"]) jugador1.position.x -= 0.15;
  if (teclas["d"]) jugador1.position.x += 0.15;

  // Movimiento Jugador 2 (Flechas)
  if (teclas["ArrowLeft"]) jugador2.position.x -= 0.15;
  if (teclas["ArrowRight"]) jugador2.position.x += 0.15;

  // Limitar movimiento
  jugador1.position.x = Math.max(-8, Math.min(0, jugador1.position.x)); // Lado izquierdo
  jugador2.position.x = Math.max(0, Math.min(8, jugador2.position.x));  // Lado derecho

  // Cajas de colisión
  const box1 = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(jugador1.position.x, jugador1.position.y + 0.6, 6.5),
    new THREE.Vector3(2.8, 1.5, 0.8)
  );

  const box2 = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(jugador2.position.x, jugador2.position.y + 0.6, 6.5),
    new THREE.Vector3(2.8, 1.5, 0.8)
  );

  // Procesar objetos
  for (let i = objetos.length - 1; i >= 0; i--) {
    const obj = objetos[i];
    obj.position.y -= gravedad;


    const size = obj.userData.size || new THREE.Vector3(1, 1, 1);
    const objBox = new THREE.Box3().setFromCenterAndSize(
      obj.position.clone(),
      size.clone().multiplyScalar(0.9)
    );

    // Colisión con jugador 1
    if (box1.intersectsBox(objBox)) {
      if (obj.userData.esBomba) {
        vidas1--;
        if (vidas1 <= 0) {
          juegoActivo = false;
          clearInterval(temporizador);
          clearInterval(spawnerInterval);
          alert(`💥 Jugador 1 eliminado!\n\nJugador 2 gana con ${puntos2} puntos!`);
          window.location.href = "../../index.html";
        }
      } else {
        puntos1 += 10;
      }
      scene.remove(obj);
      objetos.splice(i, 1);
      actualizarHUD();
      continue;
    }

    // Colisión con jugador 2
    if (box2.intersectsBox(objBox)) {
      if (obj.userData.esBomba) {
        vidas2--;
        if (vidas2 <= 0) {
          juegoActivo = false;
          clearInterval(temporizador);
          clearInterval(spawnerInterval);
          alert(`💥 Jugador 2 eliminado!\n\nJugador 1 gana con ${puntos1} puntos!`);
          window.location.href = "../../index.html";
        }
      } else {
        puntos2 += 10;
      }
      scene.remove(obj);
      objetos.splice(i, 1);
      actualizarHUD();
      continue;
    }

    // Eliminar si cae fuera
    if (obj.position.y < -3.5) {
      scene.remove(obj);
      objetos.splice(i, 1);
    }
  }

  // Incrementar gravedad gradualmente
  gravedad = Math.min(gravedadMaxima, gravedad + 0.00003);

  renderer.render(scene, camera);
}

animar();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});