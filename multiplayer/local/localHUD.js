import { createScene } from "../../core/sceneManager.js";
import { loadPlayers } from "../../core/playerManager.js";
import { getConfigMulti } from "../../core/difficulty.js";
import { setupHUDMulti } from "../../gameplay/hudManagerMulti.js";
import { crearObjeto } from "../../gameplay/objectSpawner.js";
import { startGameLoopMulti } from "../../core/gameLoopMulti.js";
import { setupPauseMenu } from "../../gameplay/pauseMenu.js";

// === 1️⃣ Inicialización ===
const { scene, camera, renderer } = createScene();

// 🧠 Leer configuración del menú anterior (si existe)
let config = getConfigMulti(); // base de dificultad
const savedConfig = localStorage.getItem("configMultijugador");

if (savedConfig) {
  try {
    const parsed = JSON.parse(savedConfig);

    // Combinar con la configuración base
 config = {
  ...config,
  tipoJuego: parsed.tipoJuego || "local",
  escenario: parsed.escenario || "MP_Stage1",
  dificultad: parsed.dificultad || config.dificultad,
  modo: parsed.modo || "clasico",
  probBomba: parsed.probBomba ?? 0.2, // 💣 Probabilidad base de bomba (20%)
};


    console.log("⚙️ Config cargada del menú:", config);
  } catch (err) {
    console.error("❌ Error leyendo configMultijugador:", err);
  }
}

// (opcional) limpiar el localStorage una vez usada
localStorage.removeItem("configMultijugador");

const hud = setupHUDMulti();

console.log(`🎮 Modo activo: ${config.modo}`);

// === 2️⃣ Variables globales ===
let objetos = [];
let puntos1 = 0;
let puntos2 = 0;
let vidas1 = config.vidas;
let vidas2 = config.vidas;
let tiempo = config.tiempo;
let loopControl;
let debugVisible = false;

// === 3️⃣ Debug toggle ===
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") {
    debugVisible = !debugVisible;
    scene.traverse((obj) => {
      if (obj.userData.isDebugHelper) obj.visible = debugVisible;
    });
    console.log(debugVisible ? "🟩 Debug activado" : "⬛ Debug oculto");
  }
});

// === 4️⃣ Cargar jugadores y arrancar ===
loadPlayers(scene).then(({ player1, player2 }) => {
loopControl = startGameLoopMulti({
    scene,
    camera,
    renderer,
    players: { player1, player2 },
    objetos,
    config,
    hud,
    perderVida,
    ganarPuntos,
    net: null,   // importante para modo local
    sync: null
});


// Aumentar probabilidad de bomba dinámicamente cada 20 segundos
if (config.dinamico) {
  setInterval(() => {
    if (config.probBomba < 0.6) {
      config.probBomba += 0.05;
      console.log(`💣 Dificultad aumentada: probBomba = ${config.probBomba.toFixed(2)}`);
    }
  }, 20000); // cada 20 segundos
}

  setupPauseMenu(loopControl);

  // 🧩 Spawner de objetos
  setInterval(() => {
    if (loopControl.isRunning()) {
      crearObjeto(scene, objetos, config, debugVisible);
    }
  }, config.spawn);

  // 🕒 Tiempo / Puntos según modo
  if (config.modo === "survival") {
    setInterval(() => {
      if (loopControl.isRunning()) {
        tiempo++;
        hud.actualizarTiempo(tiempo);
      }
    }, 1000);
  } else {
    setInterval(() => {
      if (!loopControl.isRunning()) return;
      tiempo--;
      hud.actualizarTiempo(tiempo);
      if (tiempo <= 0) terminarJuego();
    }, 1000);
  }
});


// === 5️⃣ Lógica de puntuación y vidas ===
function perderVida(jugador) {
  if (jugador === 1) vidas1--;
  else vidas2--;

  hud.actualizarVidas(vidas1, vidas2);

  // 🧩 Si el modo es survival, se gana por resistencia
  if (config.modo === "survival") {
    if (vidas1 <= 0 && vidas2 > 0) {
      terminarJuego("Jugador 2");
      return;
    }
    if (vidas2 <= 0 && vidas1 > 0) {
      terminarJuego("Jugador 1");
      return;
    }
    if (vidas1 <= 0 && vidas2 <= 0) {
      terminarJuego("Empate");
      return;
    }
  } else {
    // Clásico: termina cuando alguno llegue a 0
    if (vidas1 <= 0 || vidas2 <= 0) terminarJuego();
  }
}

function ganarPuntos(jugador) {
  // Solo cuenta en modo clásico
  if (config.modo !== "clasico") return;
  if (jugador === 1) puntos1 += 10;
  else puntos2 += 10;
  hud.actualizarPuntos(puntos1, puntos2);
}

// === 6️⃣ Final del juego ===
function terminarJuego(ganadorForzado = null) {
  loopControl.detener();

  let ganador;

  if (config.modo === "survival") {
    ganador =
      ganadorForzado ||
      (vidas1 > vidas2 ? "Jugador 1" :
       vidas2 > vidas1 ? "Jugador 2" : "Empate");
  } else {
    ganador =
      puntos1 > puntos2 ? "Jugador 1" :
      puntos2 > puntos1 ? "Jugador 2" : "Empate";
  }

  const mensaje =
    config.modo === "survival"
      ? `💣 Modo Survival terminado!\n${ganador} resistió más tiempo.`
      : `🏁 Fin del juego!\n${ganador}\n\nJ1: ${puntos1} pts\nJ2: ${puntos2} pts`;

  alert(mensaje);
  window.location.href = "../../index.html";
}
