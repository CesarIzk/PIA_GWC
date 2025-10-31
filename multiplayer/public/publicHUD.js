// =========================
// WEBSOCKET (AUTO-CONNECT)
// =========================
const socket = new WebSocket(`${window.location.origin.replace("http", "ws")}`);

// ===========================================
//  FOOD FRENZY - MODO ONLINE (2 JUGADORES)
// ===========================================

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

let jugadorID = null;
let otroJugadorID = null;

// =========================
// ESCENA BÁSICA
// =========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a6b);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 14);
camera.lookAt(0, 1, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// =========================
// ILUMINACIÓN
// =========================
scene.add(new THREE.AmbientLight(0xfff5e1, 0.6));
const dirLight = new THREE.DirectionalLight(0xffaa66, 1.2);
dirLight.position.set(8, 15, -5);
dirLight.castShadow = true;
scene.add(dirLight);
scene.add(new THREE.HemisphereLight(0x7092be, 0x1f2833, 0.8));

// =========================
// CARGAR ESCENARIO
// =========================
const fbxLoader = new FBXLoader();
fbxLoader.load(
  "/Assets/city/city.fbx",
  (fbx) => {
    fbx.scale.setScalar(0.0045);
    fbx.position.set(0, -1.2, 0);
    fbx.rotation.y = Math.PI;
    fbx.traverse((child) => (child.isMesh ? (child.receiveShadow = true) : null));
    scene.add(fbx);
    console.log("✅ Ciudad cargada");
  },
  undefined,
  (err) => console.error("❌ Error cargando ciudad:", err)
);

// =========================
// VARIABLES
// =========================
let jugadorLocal = null;
let jugadorRemoto = null;
const objetos = [];
let puntos = 0;
let vidas = 3;
let tiempo = 60;
let gravedad = 0.06;
const gravedadMax = 0.15;
let juegoActivo = true;

// =========================
// CREAR CANASTAS
// =========================
function crearCanasta(x, color, callback) {
  fbxLoader.load(
    "/Assets/basket2.fbx",
    (fbx) => {
      fbx.scale.setScalar(0.015);
      fbx.position.set(x, 0.6, 6.5);
      fbx.rotation.y = Math.PI;
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // 🟢 Evita error si el material no tiene propiedad color
          if (child.material && child.material.color) {
            child.material.color = new THREE.Color(color);
          }
        }
      });
      scene.add(fbx);
      callback(fbx);
    },
    undefined,
    (err) => console.error("❌ Error cargando canasta:", err)
  );
}

crearCanasta(-3, 0x00ff88, (fbx) => (jugadorLocal = fbx));
crearCanasta(3, 0xff0066, (fbx) => (jugadorRemoto = fbx));

// =========================
// CONTROLES
// =========================
const teclas = {};
window.addEventListener("keydown", (e) => (teclas[e.key] = true));
window.addEventListener("keyup", (e) => (teclas[e.key] = false));


// =========================
// HUD
// =========================
function actualizarHUD() {
  // ✅ Ruta simplificada (las imágenes están en /Images/HUDs/)
  const healthPath = "/Images/HUDs";

  document.getElementById("puntos1").textContent = puntos.toString().padStart(3, "0");
  document.getElementById("vidas1").src = `${healthPath}/Health${vidas}.png`;
  document.getElementById("tiempo").textContent = tiempo;
}


// =========================
// WEBSOCKET HANDLERS
// =========================
socket.addEventListener("open", () => {
  console.log("🌐 Conectado al servidor");
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  // Si es un mensaje de posición de otro jugador
  if (data.type === "pos" && jugadorRemoto) {
    jugadorRemoto.position.x = data.x;
  }

  // Si el servidor te asigna un ID
  if (data.type === "assign") {
    jugadorID = data.id;
    console.log("🪪 ID asignado:", jugadorID);
  }
});

socket.addEventListener("close", () => console.log("❌ Conexión cerrada"));

// =========================
// FUNCIONES MULTIJUGADOR
// =========================
function enviarPosicion() {
  if (socket.readyState === WebSocket.OPEN && jugadorLocal) {
    const data = { type: "pos", x: jugadorLocal.position.x };
    socket.send(JSON.stringify(data));
  }
}

// =========================
// SPAWNER DE OBJETOS
// =========================
const textureLoader = new THREE.TextureLoader();
// 🔤 Usa nombres reales en inglés (según tus archivos)
const comidas = ["ajo", "banana", "bellota", "calabaza", "cebolla", "cereza", "chayote", "chicharos"];

function crearObjeto() {
  if (!juegoActivo) return;
  const esBomba = Math.random() < 0.25;
  const nombre = esBomba ? "bomba" : comidas[Math.floor(Math.random() * comidas.length)];
  const modeloRuta = esBomba ? "/Assets/bomb/source/bomb.fbx" : `/Assets/comida/${nombre}.fbx`;
  const texturaRuta = `/Assets/comida/${nombre}.png`;

  fbxLoader.load(modeloRuta, (obj) => {
    if (!esBomba) {
      const textura = textureLoader.load(texturaRuta);
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: textura,
            roughness: 0.5,
            metalness: 0.1,
          });
        }
      });
    }

    obj.scale.setScalar(esBomba ? 0.012 : 0.015);
    obj.position.set((Math.random() - 0.5) * 10, 10, 6.5);
    obj.userData.esBomba = esBomba;
    obj.userData.size = new THREE.Vector3(1, 1, 1);
    scene.add(obj);
    objetos.push(obj);
  });
}

setInterval(() => {
  if (juegoActivo) crearObjeto();
}, 1500);

// =========================
// TEMPORIZADOR
// =========================
setInterval(() => {
  if (!juegoActivo) return;
  tiempo--;
  actualizarHUD();
  if (tiempo <= 0) {
    juegoActivo = false;
    alert(`⏰ Fin del juego!\nPuntaje: ${puntos}`);
    window.location.href = "../../index.html";
  }
}, 1000);

// =========================
// BUCLE PRINCIPAL
// =========================
function animar() {
  requestAnimationFrame(animar);

  if (!jugadorLocal || !jugadorRemoto) {
    renderer.render(scene, camera);
    return;
  }

  // Movimiento local
  if (teclas["a"]) jugadorLocal.position.x -= 0.15;
  if (teclas["d"]) jugadorLocal.position.x += 0.15;
  jugadorLocal.position.x = Math.max(-8, Math.min(8, jugadorLocal.position.x));

  // Enviar posición al servidor
  enviarPosicion();

  // Movimiento y colisiones de objetos
  for (let i = objetos.length - 1; i >= 0; i--) {
    const obj = objetos[i];
    obj.position.y -= gravedad;

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(jugadorLocal.position.x, jugadorLocal.position.y + 0.6, 6.5),
      new THREE.Vector3(2.8, 1.5, 0.8)
    );

    const objBox = new THREE.Box3().setFromCenterAndSize(obj.position, new THREE.Vector3(1, 1, 1));

    if (box.intersectsBox(objBox)) {
      if (obj.userData.esBomba) {
        vidas--;
        if (vidas <= 0) {
          juegoActivo = false;
          alert(`💥 Game Over! Puntaje: ${puntos}`);
          window.location.href = "../../index.html";
        }
      } else {
        puntos += 10;
      }
      scene.remove(obj);
      objetos.splice(i, 1);
      actualizarHUD();
    }
  }

  gravedad = Math.min(gravedadMax, gravedad + 0.00003);
  renderer.render(scene, camera);
}

animar();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
