import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

// ===========================
// CONFIGURACIÓN DE LA ESCENA
// ===========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a6b); // tono atardecer urbano

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ===========================
// ILUMINACIÓN - ATARDECER
// ===========================
const ambient = new THREE.AmbientLight(0xfff5e1, 0.6);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffaa66, 1.2);
directional.position.set(8, 15, -5);
directional.castShadow = true;
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;
scene.add(directional);

const hemiLight = new THREE.HemisphereLight(0x7092be, 0x1f2833, 0.8);
scene.add(hemiLight);

// ===========================
// CARGAR MODELO DE CIUDAD
// ===========================
const loader = new FBXLoader();
loader.load(
  "Assets/city/city.fbx",
  (fbx) => {
    fbx.scale.set(0.0045, 0.0045, 0.0045);
    fbx.position.set(0, -1.2, 0);
    fbx.rotation.y = Math.PI;
    fbx.traverse((child) => {
      if (child.isMesh) child.receiveShadow = true;
    });
    scene.add(fbx);
    console.log("✅ Ciudad cargada correctamente.");
  },
  undefined,
  (err) => console.error("❌ Error cargando ciudad:", err)
);

// ===========================
// CARGAR MODELO DE LA CANASTA
// ===========================
let player = null;
const basketLoader = new FBXLoader();
basketLoader.load(
  "Assets/basket2.fbx",
  (fbx) => {
    fbx.scale.set(0.015, 0.015, 0.015);
    fbx.position.set(0, 0.6, 6.5);
    fbx.rotation.y = Math.PI;
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    player = fbx;
    scene.add(player);
    console.log("🏀 Canasta cargada correctamente.");
  },
  undefined,
  (err) => console.error("❌ Error al cargar canasta:", err)
);

// ===========================
// VARIABLES DEL JUEGO
// ===========================
let puntos = 0;
let vidas = 3;
let tiempo = 60;

// 🧲 Gravedad 40% más rápida
let gravedad = 0.06 * 1.4; // 0.084
const gravedadMaxima = 0.15 * 1.4; // 0.21
const incrementoGravedad = 0.00004; // un poco más agresiva

let debugVisible = false;
let juegoActivo = true;
const objetos = [];

// ⚙️ Movimiento del jugador
let velocidadJugador = 0.3;
let suavizadoMovimiento = 0.08; // rápido y fluido
let objetivoX = 0;

// ===========================
// CONTROLES DEL JUGADOR
// ===========================
const teclas = {};
window.addEventListener("keydown", (e) => {
  teclas[e.key] = true;

  if (e.key.toLowerCase() === "h") {
    debugVisible = !debugVisible;
    scene.traverse((obj) => {
      if (obj.userData.isDebugHelper) obj.visible = debugVisible;
    });
    console.log(debugVisible ? "🟩 Helpers ACTIVADOS" : "⬛ Helpers OCULTOS");
  }
});
window.addEventListener("keyup", (e) => (teclas[e.key] = false));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") togglePausa();
});

// ===========================
// HUD
// ===========================
const vidasImg = document.getElementById("vidasImg");
const puntosHUD = document.getElementById("puntos");
const tiempoHUD = document.getElementById("tiempo");
const hud = document.getElementById("hud");

function actualizarVidas() {
  vidasImg.src = `Images/HUDs/Health${vidas}.png`;
  vidasImg.classList.add("flash");
  setTimeout(() => vidasImg.classList.remove("flash"), 300);
}

function actualizarPuntos() {
  puntosHUD.textContent = String(puntos).padStart(3, "0");
}

// ===========================
// PÉRDIDA DE VIDA Y FIN DEL JUEGO
// ===========================
function perderVida() {
  if (!juegoActivo) return;

  vidas = Math.max(0, vidas - 1);
  actualizarVidas();

  hud.classList.add("flash");
  setTimeout(() => hud.classList.remove("flash"), 200);

  if (vidas <= 0) {
    terminarJuego(false);
  }
}

function terminarJuego(victoria = false) {
  juegoActivo = false;
  clearInterval(timer);
  clearInterval(spawnerInterval);

  // 🧹 Limpia escena
  objetos.forEach((obj) => {
    scene.remove(obj);
    if (obj.userData.debugBox) scene.remove(obj.userData.debugBox);
  });
  objetos.length = 0;

  // 💾 Guardar puntuación
  const nombre = prompt("💾 Ingresa tu nombre para guardar tu puntuación:") || "Anónimo";
  let puntuaciones = JSON.parse(localStorage.getItem("puntuaciones")) || [];

  puntuaciones.push({ nombre, puntos });
  puntuaciones.sort((a, b) => b.puntos - a.puntos);
  puntuaciones = puntuaciones.slice(0, 10);
  localStorage.setItem("puntuaciones", JSON.stringify(puntuaciones));

  const mensaje = victoria
    ? `🎉 ¡Tiempo terminado!\n🌟 Puntos: ${puntos}`
    : `💥 Game Over!\n🌟 Puntos: ${puntos}`;
  alert(mensaje);

  window.location.href = "puntuaciones.html";
}

// ===========================
// SPAWNER DE OBJETOS
// ===========================
const comidaModelos = [
  "ajo",
  "banana",
  "bellota",
  "calabaza",
  "cebolla",
  "cereza",
  "chayote",
  "chicharos",
];

const bombaModelo = "Assets/bomb/source/bomb.fbx";
const textureLoader = new THREE.TextureLoader();

function crearObjeto() {
  if (!juegoActivo) return;

  const esBomba = Math.random() < 0.3;
  const nombreModelo = esBomba
    ? "bomba"
    : comidaModelos[Math.floor(Math.random() * comidaModelos.length)];
  const modeloRuta = esBomba ? bombaModelo : `Assets/comida/${nombreModelo}.fbx`;
  const texturaRuta = `Assets/comida/${nombreModelo}.png`;

  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    modeloRuta,
    (objeto) => {
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
            child.receiveShadow = true;
          }
        });
      } else {
        objeto.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }

      const escalaBase = esBomba ? 0.012 : 0.015;
      objeto.scale.setScalar(escalaBase);
      objeto.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(objeto);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      objeto.position.sub(center.multiplyScalar(0.9));
      objeto.userData.size = size.clone();

      const posX = (Math.random() - 0.5) * 8;
      const posY = 9 + Math.random() * 3;
      objeto.position.add(new THREE.Vector3(posX, posY, 6.5));

      objeto.userData.esBomba = esBomba;
      objeto.userData.colisionado = false;
      objeto.userData.tiempoDeVida = 0;

      const color = esBomba ? 0xff0000 : 0x00aaff;
      const helperBox = new THREE.Box3().setFromObject(objeto);
      const helper = new THREE.Box3Helper(helperBox, color);
      helper.visible = debugVisible;
      helper.userData.isDebugHelper = true;
      objeto.userData.debugBox = helper;

      scene.add(helper);
      scene.add(objeto);
      objetos.push(objeto);
    },
    undefined,
    (err) => console.warn("⚠️ Error al cargar modelo:", modeloRuta, err)
  );
}

// ===========================
// TEMPORIZADOR
// ===========================
const spawnerInterval = setInterval(() => {
  if (juegoActivo) crearObjeto();
}, 1500);

const timer = setInterval(() => {
  if (!juegoActivo) return;

  tiempo--;
  tiempoHUD.textContent = tiempo;
  if (tiempo <= 0) terminarJuego(true);
}, 1000);

// ===========================
// BUCLE DE ANIMACIÓN
// ===========================
function animar() {
  requestAnimationFrame(animar);

  if (!player) {
    renderer.render(scene, camera);
    return;
  }

  if (!juegoActivo) {
    renderer.render(scene, camera);
    return;
  }

  // Movimiento del jugador
  if (teclas["ArrowLeft"] || teclas["a"]) objetivoX -= velocidadJugador;
  if (teclas["ArrowRight"] || teclas["d"]) objetivoX += velocidadJugador;

  objetivoX = Math.max(-8, Math.min(8, objetivoX));
  player.position.x += (objetivoX - player.position.x) * (1 - suavizadoMovimiento);

  // Caja de colisión
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(player.position.x, player.position.y + 0.6, 6.5),
    new THREE.Vector3(2.8, 1.5, 0.8)
  );

  if (player.userData.debugBox) {
    player.userData.debugBox.box.copy(playerBox);
    player.userData.debugBox.visible = debugVisible;
  }

  // Movimiento y colisiones
  for (let i = objetos.length - 1; i >= 0; i--) {
    const obj = objetos[i];
    if (!obj) continue;

    obj.userData.tiempoDeVida ??= 0;
    obj.userData.tiempoDeVida++;
    if (obj.userData.tiempoDeVida > 30) {
      const g = obj.userData.esBomba ? gravedad * 1.3 : gravedad;
      obj.position.y -= g;
    }

    const size = obj.userData.size || new THREE.Vector3(1, 1, 1);
    const objBox = new THREE.Box3().setFromCenterAndSize(
      obj.position.clone().add(new THREE.Vector3(0, size.y / 4, 0)),
      size.clone().multiplyScalar(0.8)
    );

    if (obj.userData.debugBox) {
      obj.userData.debugBox.box.copy(objBox);
      obj.userData.debugBox.visible = debugVisible;
    }

    if (!obj.userData.colisionado && playerBox.intersectsBox(objBox)) {
      obj.userData.colisionado = true;

      if (obj.userData.esBomba) {
        perderVida();
      } else {
        puntos += 10;
        actualizarPuntos();
        obj.scale.multiplyScalar(1.3);
      }

      setTimeout(() => {
        scene.remove(obj);
        if (obj.userData.debugBox) scene.remove(obj.userData.debugBox);
        objetos.splice(i, 1);
      }, 100);
      continue;
    }

    if (obj.position.y < -3.5) {
      scene.remove(obj);
      if (obj.userData.debugBox) scene.remove(obj.userData.debugBox);
      objetos.splice(i, 1);
    }
  }

  gravedad = Math.min(gravedadMaxima, gravedad + incrementoGravedad);
  renderer.render(scene, camera);
}

// ===========================
// CÁMARA Y LOOP
// ===========================
camera.position.set(0, 8, 14);
camera.lookAt(0, 1, 6.5);
animar();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===========================
// MENÚ DE PAUSA
// ===========================
const btnPause = document.getElementById("btnPause");
const pauseMenu = document.getElementById("pauseMenu");
const btnResume = document.getElementById("btnResume");
const btnRestart = document.getElementById("btnRestart");
const btnExit = document.getElementById("btnExit");

let pausaActiva = false;
let temporizadorActivo = null;
let spawnerActivo = null;

btnPause.addEventListener("click", () => togglePausa());
btnResume.addEventListener("click", () => togglePausa());

btnRestart.addEventListener("click", () => {
  window.location.reload();
});

btnExit.addEventListener("click", () => {
  window.location.href = "solojugador.html";
});

function togglePausa() {
  pausaActiva = !pausaActiva;

  if (pausaActiva) {
    // Pausar
    juegoActivo = false;
    clearInterval(timer);
    clearInterval(spawnerInterval);
    pauseMenu.classList.remove("hidden");
  } else {
    // Reanudar
    juegoActivo = true;
    pauseMenu.classList.add("hidden");

    // Reinicia temporizador y spawner
    reiniciarTemporizador();
    reiniciarSpawner();
  }
}

function reiniciarTemporizador() {
  temporizadorActivo = setInterval(() => {
    if (!juegoActivo) return;
    tiempo--;
    tiempoHUD.textContent = tiempo;
    if (tiempo <= 0) terminarJuego(true);
  }, 1000);
}

function reiniciarSpawner() {
  spawnerActivo = setInterval(() => {
    if (juegoActivo) crearObjeto();
  }, 1500);
}
