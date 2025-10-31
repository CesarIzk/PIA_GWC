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
      if (child.isMesh) {
        child.receiveShadow = true;
      }
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
let gravedad = 0.06; // 👈 Velocidad inicial más lenta (antes 0.12)
const gravedadMaxima = 0.15; // 👈 Velocidad máxima más controlable (antes 0.25)
const incrementoGravedad = 0.00003; // 👈 Incremento más gradual (antes 0.00005)
let debugVisible = false;
let juegoActivo = true;

const objetos = [];

// ===========================
// CONTROLES DEL JUGADOR
// ===========================
const teclas = {};
window.addEventListener("keydown", (e) => {
  teclas[e.key] = true;

  // Toggle de depuración con tecla H
  if (e.key.toLowerCase() === "h") {
    debugVisible = !debugVisible;
    scene.traverse((obj) => {
      if (obj.userData.isDebugHelper) {
        obj.visible = debugVisible;
      }
    });
    console.log(debugVisible ? "🟩 Helpers ACTIVADOS" : "⬛ Helpers OCULTOS");
  }
});

window.addEventListener("keyup", (e) => (teclas[e.key] = false));

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

  const modeloRuta = esBomba
    ? bombaModelo
    : `Assets/comida/${nombreModelo}.fbx`;

  const texturaRuta = `Assets/comida/${nombreModelo}.png`;

  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    modeloRuta,
    (objeto) => {
      // ============================
      // 🔸 TEXTURA Y SOMBRAS
      // ============================
      if (!esBomba) {
        const textura = textureLoader.load(
          texturaRuta,
          undefined,
          undefined,
          () => console.warn("⚠️ No se pudo cargar textura:", texturaRuta)
        );

        objeto.traverse((child) => {
          if (child.isMesh) {
            if (child.material) child.material.dispose();
            child.material = new THREE.MeshStandardMaterial({
              map: textura,
              color: 0xffffff,
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

      // ============================
      // 🔸 ESCALA Y CENTRADO REAL
      // ============================
      const escalaBase = esBomba ? 0.012 : 0.015;
      objeto.scale.setScalar(escalaBase);
      objeto.updateMatrixWorld(true);

      // 🔹 Calcular caja y centro del modelo
      const box = new THREE.Box3().setFromObject(objeto);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // 🔹 Recentrar el modelo sin moverlo fuera de vista
      objeto.position.sub(center.multiplyScalar(0.9)); // corrige desplazamiento sin empujarlo demasiado
      objeto.userData.size = size.clone();

      // ============================
      // 🔸 POSICIÓN ALEATORIA INICIAL
      // ============================
      const posX = (Math.random() - 0.5) * 8;
      const posY = 9 + Math.random() * 3;
      objeto.position.add(new THREE.Vector3(posX, posY, 6.5)); // suma a su posición visual

      objeto.userData.esBomba = esBomba;
      objeto.userData.colisionado = false;
      objeto.userData.tiempoDeVida = 0;
      objeto.userData.velocidadRotacion = Math.random() * 0.05 + 0.02;

      // ============================
      // 🔸 CAJA DE DEPURACIÓN
      // ============================
      const color = esBomba ? 0xff0000 : 0x00aaff;
      const helperBox = new THREE.Box3().setFromObject(objeto);
      const helper = new THREE.Box3Helper(helperBox, color);
      helper.visible = debugVisible;
      helper.userData.isDebugHelper = true;
      objeto.userData.debugBox = helper;

      scene.add(helper);
      scene.add(objeto);
      objetos.push(objeto);

      console.log(`🍏 Objeto creado: ${nombreModelo} (${esBomba ? "bomba" : "comida"})`);
    },
    undefined,
    (err) => console.warn("⚠️ Error al cargar modelo:", modeloRuta, err)
  );
}


// Iniciar spawning
const spawnerInterval = setInterval(() => {
  if (juegoActivo) {
    crearObjeto();
  }
}, 1500);

// ===========================
// TEMPORIZADOR
// ===========================
const timer = setInterval(() => {
  if (!juegoActivo) return;
  
  tiempo--;
  tiempoHUD.textContent = tiempo;
  if (tiempo <= 0) {
    juegoActivo = false;
    clearInterval(timer);
    clearInterval(spawnerInterval);
    alert(`🎮 Fin del juego\n🌟 Puntos: ${puntos}`);
    window.location.href = "solojugador.html";
  }
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

  // Movimiento del jugador
  if (teclas["ArrowLeft"] || teclas["a"]) player.position.x -= 0.15;
  if (teclas["ArrowRight"] || teclas["d"]) player.position.x += 0.15;
  player.position.x = Math.max(-8, Math.min(8, player.position.x));

  // Caja de colisión de la canasta
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(player.position.x, player.position.y + 0.6, 6.5),
    new THREE.Vector3(2.8, 1.5, 0.8)
  );

  // Hitbox visible del jugador
  if (!player.userData.debugBox) {
    const helper = new THREE.Box3Helper(playerBox, 0x00ff00);
    helper.visible = debugVisible;
    helper.userData.isDebugHelper = true;
    scene.add(helper);
    player.userData.debugBox = helper;
  } else {
    player.userData.debugBox.box.copy(playerBox);
    player.userData.debugBox.visible = debugVisible;
  }

  // Movimiento y colisiones
  for (let i = objetos.length - 1; i >= 0; i--) {
    const obj = objetos[i];
    
    // Aplicar gravedad incremental
 // ⏳ Delay inicial antes de empezar a caer
if (!obj.userData.tiempoDeVida) obj.userData.tiempoDeVida = 0;
obj.userData.tiempoDeVida += 1;

// Espera 30 frames (~0.5 segundos)
if (obj.userData.tiempoDeVida > 30) {
  obj.position.y -= gravedad;
}
    // Recalcular bounding box
    const size = obj.userData.size || new THREE.Vector3(1, 1, 1);
    const objBox = new THREE.Box3().setFromCenterAndSize(
      obj.position.clone().add(new THREE.Vector3(0, size.y / 4, 0)),
      size.clone().multiplyScalar(0.8)
    );

    // Actualizar helper
    if (obj.userData.debugBox) {
      obj.userData.debugBox.box.copy(objBox);
      obj.userData.debugBox.visible = debugVisible;
    }

    // Colisión con canasta
    if (!obj.userData.colisionado && playerBox.intersectsBox(objBox)) {
      obj.userData.colisionado = true;

      if (obj.userData.esBomba) {
        vidas--;
        actualizarVidas();
        hud.classList.add("flash");
        setTimeout(() => hud.classList.remove("flash"), 150);

        if (vidas <= 0) {
          juegoActivo = false;
          clearInterval(timer);
          clearInterval(spawnerInterval);
          alert(`💥 Game Over!\n🌟 Puntos finales: ${puntos}`);
          window.location.href = "solojugador.html";
        }
      } else {
        puntos += 10;
        actualizarPuntos();
        obj.scale.multiplyScalar(1.3);
      }

      setTimeout(() => {
        scene.remove(obj);
        if (obj.userData.debugBox) scene.remove(obj.userData.debugBox);
        const index = objetos.indexOf(obj);
        if (index > -1) objetos.splice(index, 1);
      }, 100);
      continue;
    }

    // Eliminar si cae fuera
    if (obj.position.y < -3.5) {
      scene.remove(obj);
      if (obj.userData.debugBox) scene.remove(obj.userData.debugBox);
      objetos.splice(i, 1);
    }
  }

  // Incrementar gravedad gradualmente
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