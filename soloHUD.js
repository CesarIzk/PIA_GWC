// ==============================================
// 🎮 FOOD FRENZY - MODO SOLO (PC + MÓVIL)
// ==============================================
import { guardarPuntuacion } from "./core/scoreClient.js";
import { createScene } from "./core/sceneManager.js";
import { loadPlayer } from "./core/playerManager.js";
import { getConfig } from "./core/difficulty.js";
import { setupHUD } from "./gameplay/hudManager.js";
import { crearObjeto } from "./gameplay/objectSpawner.js";
import { startGameLoop } from "./core/gameLoop.js";
import { setupPauseMenu } from "./gameplay/pauseMenu.js";
import { reproducirMusica, detenerMusica, reproducirSFX } from "./core/audioManager.js";



// === 📱 Detección de dispositivo móvil ===
const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// === 1️⃣ Inicialización de escena y configuración ===
const { scene, camera, renderer } = createScene();
detenerMusica();
const config = getConfig();
const hud = setupHUD();
// 🎵 Música del juego
reproducirMusica("Assets/musica/vibe.mp3");

// === 2️⃣ Variables globales ===
let objetos = [];
let puntos = 0;
let vidas = config.vidas;
let tiempo = config.tiempo;
let loopControl;
let debugVisible = false;

// === 3️⃣ Toggle de debug (mostrar/ocultar colliders) ===
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") {
    debugVisible = !debugVisible;
    scene.traverse((obj) => {
      if (obj.userData.isDebugHelper) obj.visible = debugVisible;
    });
    console.log(debugVisible ? "🟩 Debug activado" : "⬛ Debug oculto");
  }
});

// === 📱 Variables para control táctil ===
let touchX = null;
let moveLeft = false;
let moveRight = false;

// === 4️⃣ Cargar jugador y arrancar el juego ===
loadPlayer(scene).then((player) => {
  // === 🧠 Agregar control híbrido dentro del loop ===
  loopControl = startGameLoop(
    scene,
    camera,
    renderer,
    player,
    objetos,
    config,
    perderVida,
    ganarPuntos,
    hud,
    // Añadimos callback de movimiento
    (delta) => manejarMovimiento(player, delta)
  );

  // 🧩 Inicializa el menú de pausa
  setupPauseMenu(loopControl);

  // === 📱 Controles táctiles ===
  if (esMovil) {
    // Arrastre horizontal
    window.addEventListener("touchstart", (e) => {
      touchX = e.touches[0].clientX;
    });
    window.addEventListener("touchmove", (e) => {
      touchX = e.touches[0].clientX;
    });
    window.addEventListener("touchend", () => {
      touchX = null;
    });

    // Botones táctiles (si existen en el HTML)
    const btnLeft = document.getElementById("btnLeft");
    const btnRight = document.getElementById("btnRight");

    if (btnLeft && btnRight) {
      btnLeft.addEventListener("touchstart", () => (moveLeft = true));
      btnLeft.addEventListener("touchend", () => (moveLeft = false));
      btnRight.addEventListener("touchstart", () => (moveRight = true));
      btnRight.addEventListener("touchend", () => (moveRight = false));
    }
  }

  // === 🍎 Spawner de objetos ===
  setInterval(() => {
    if (loopControl.isRunning()) {
      crearObjeto(scene, objetos, config, debugVisible);
    }
  }, config.spawn);

  // === 🕒 Tiempo o puntos según modo ===
  if (config.modo === "survival") {
    // Modo supervivencia → puntaje por tiempo
    setInterval(() => {
      if (loopControl.isRunning()) {
        puntos++;
        hud.actualizarPuntos(puntos);
      }
    }, 1000);
  } else {
    // Modo clásico → temporizador
    setInterval(() => {
      if (!loopControl.isRunning()) return;
      tiempo--;
      hud.actualizarTiempo(tiempo);
      if (tiempo <= 0) terminarJuego(true);
    }, 1000);
  }

  // 🕹️ Auto pausa al salir de la pestaña (solo móvil)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && loopControl && loopControl.isRunning()) {
      loopControl.detener();
      const menu = document.getElementById("pauseMenu");
      if (menu) menu.classList.remove("hidden");
    }
  });
});

// === 5️⃣ Movimiento híbrido (teclado + táctil) ===
const teclas = {};
window.addEventListener("keydown", (e) => (teclas[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (teclas[e.key.toLowerCase()] = false));

function manejarMovimiento(player, delta) {
  if (!player) return;

  const velocidad = 0.2 * delta * 60; // velocidad adaptada al framerate
  const limite = 3.5; // evita que se salga del escenario

  if (esMovil) {
    const mitad = window.innerWidth / 2;

    // movimiento por arrastre o botones
    if (touchX !== null) {
      if (touchX < mitad - 50) player.position.x -= velocidad;
      else if (touchX > mitad + 50) player.position.x += velocidad;
    }

    if (moveLeft) player.position.x -= velocidad;
    if (moveRight) player.position.x += velocidad;
  } else {
    // controles de teclado
    if (teclas["a"] || teclas["arrowleft"]) player.position.x -= velocidad;
    if (teclas["d"] || teclas["arrowright"]) player.position.x += velocidad;
  }

  // límites
  player.position.x = Math.max(-limite, Math.min(limite, player.position.x));
}

// === 6️⃣ Lógica del juego ===
function perderVida() {
  reproducirSFX("Assets/musica/explosion.mp3", 0.7);
  vidas--;
  hud.actualizarVidas(vidas);
  if (vidas <= 0) terminarJuego(false);
 

}

function ganarPuntos() {
  if (config.modo === "clasico") {
    puntos += 10;
    reproducirSFX("Assets/musica/coin.mp3", 0.7);
    hud.actualizarPuntos(puntos);
  }
}

async function terminarJuego(victoria) {
  // detener loop
  if (loopControl && loopControl.isRunning()) {
    loopControl.detener();
  }

  detenerMusica();

  // pedir nombre
  const nombre =
    prompt("💾 Ingresa tu nombre para guardar tu récord:") || "Anónimo";

  // 💾 guardar puntuación (localStorage + servicio web)
  await guardarPuntuacion(nombre, puntos, config.modo);

  // 🏁 Mensaje final
  if (config.modo === "survival") {
    alert(
      `💥 Te golpeó una bomba!\n⏱️ Sobreviviste ${puntos} segundos`
    );
  } else {
    alert(
      victoria
        ? `🎉 ¡Ganaste!\n🌟 Puntos: ${puntos}`
        : `💥 Game Over\n🌟 Puntos: ${puntos}`
    );
  }

  // 🔄 Ir a la pantalla de puntuaciones
  window.location.href = "puntuaciones.html";
}

