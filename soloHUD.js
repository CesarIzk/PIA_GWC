import { createScene } from "./core/sceneManager.js";
import { loadPlayer } from "./core/playerManager.js";
import { getConfig } from "./core/difficulty.js";
import { setupHUD } from "./gameplay/hudManager.js";
import { crearObjeto } from "./gameplay/objectSpawner.js";
import { startGameLoop } from "./core/gameLoop.js";
import { setupPauseMenu } from "./gameplay/pauseMenu.js";

// === 1️⃣ Inicialización de escena y configuración ===
const { scene, camera, renderer } = createScene();
const config = getConfig();
const hud = setupHUD();

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

// === 4️⃣ Cargar jugador y arrancar el juego ===
loadPlayer(scene).then((player) => {
  loopControl = startGameLoop(
    scene,
    camera,
    renderer,
    player,
    objetos,
    config,
    perderVida,
    ganarPuntos,
    hud
  );

  // 🧩 Inicializa el menú de pausa
  setupPauseMenu(loopControl);

  // 🍎 Spawner de objetos
  setInterval(() => {
    if (loopControl.isRunning()) {
      crearObjeto(scene, objetos, config, debugVisible);
    }
  }, config.spawn);

  // 🕒 Puntuación / tiempo según modo
  if (config.modo === "survival") {
    // Modo supervivencia → puntaje por tiempo
    setInterval(() => {
      if (loopControl.isRunning()) {
        puntos++;
        hud.actualizarPuntos(puntos);
      }
    }, 1000);
  } else {
    // Modo clásico → temporizador de juego
    setInterval(() => {
      if (!loopControl.isRunning()) return;
      tiempo--;
      hud.actualizarTiempo(tiempo);
      if (tiempo <= 0) terminarJuego(true);
    }, 1000);
  }
});

// === 5️⃣ Funciones del juego ===
function perderVida() {
  vidas--;
  hud.actualizarVidas(vidas);
  if (vidas <= 0) terminarJuego(false);
}

function ganarPuntos() {
  if (config.modo === "clasico") {
    puntos += 10;
    hud.actualizarPuntos(puntos);
  }
}

function terminarJuego(victoria) {
  loopControl.detener();

  // 💾 Guardar puntuación
  const nombre = prompt("💾 Ingresa tu nombre para guardar tu récord:") || "Anónimo";
  let puntuaciones = JSON.parse(localStorage.getItem("puntuaciones")) || [];
  puntuaciones.push({ nombre, puntos });
  puntuaciones.sort((a, b) => b.puntos - a.puntos);
  puntuaciones = puntuaciones.slice(0, 10);
  localStorage.setItem("puntuaciones", JSON.stringify(puntuaciones));

  // 🏁 Mensaje final
  if (config.modo === "survival") {
    alert(`💥 Te golpeó una bomba!\n⏱️ Sobreviviste ${puntos} segundos`);
  } else {
    alert(victoria ? `🎉 ¡Ganaste!\n🌟 Puntos: ${puntos}` : `💥 Game Over\n🌟 Puntos: ${puntos}`);
  }

  // 🔄 Ir a la pantalla de puntuaciones
  window.location.href = "puntuaciones.html";
}
