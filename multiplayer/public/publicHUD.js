// ===============================================
// 🎮 FOOD FRENZY - CLIENTE ONLINE (Modo WebSocket)
// ===============================================

import { createScene } from "../../core/sceneManager.js";
import { loadPlayers } from "../../core/playerManager.js";
import { getConfigMulti } from "../../core/difficulty.js";
import { setupHUDMulti } from "../../gameplay/hudManagerMulti.js";
import { crearObjeto } from "../../gameplay/objectSpawner.js";
import { startGameLoopMulti } from "../../core/gameLoopMulti.js";

// ==============================
// 🌐 Conexión WebSocket
// ==============================
const WS_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("192.")
    ? "ws://192.168.100.237:8080" // 💻 IP local
    : `wss://${window.location.hostname}`; // 🌐 Railway

const socket = new WebSocket(WS_URL);
console.log(`🌐 Conectando a ${WS_URL} ...`);

// ==============================
// 🔁 Datos de sesión
// ==============================
const sessionData = JSON.parse(localStorage.getItem("multiplayerSession") || "{}");
const roomCode = sessionData.roomCode || "???";
const role = sessionData.role || "player1";

console.log(`🎮 Sala: ${roomCode} | Rol: ${role}`);

// ==============================
// ⚙️ Configuración base
// ==============================
let config = getConfigMulti();
config.tipoJuego = "online";
config.modo = "clasico"; // o survival, según lobby
config.gravedad = 0.06;
config.spawn = 2000;
config.vidas = 3;
config.tiempo = 60;

let objetos = [];
let puntosLocal = 0;
let puntosRemoto = 0;
let vidasLocal = config.vidas;
let vidasRemoto = config.vidas;
let tiempo = config.tiempo;

let loopControl;
let hud;
let juegoIniciado = false;

// ==============================
// 🎮 Eventos del socket
// ==============================
socket.addEventListener("open", () => {
  console.log("✅ Conectado al servidor WebSocket");
  socket.send(JSON.stringify({ type: "join", code: roomCode }));
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  // 🔹 Cuando el servidor indique que ambos jugadores están listos
  if (data.type === "startGame" && !juegoIniciado) {
    juegoIniciado = true;
    console.log("🎬 ¡Ambos jugadores conectados! Iniciando partida...");
    iniciarJuego();
  }

  // 🔹 Actualizar posición del jugador remoto (ya lo maneja el loop)
  if (data.type === "error") {
    console.warn("⚠️ Servidor:", data.message);
  }
});

socket.addEventListener("close", () => {
  alert("❌ Conexión perdida con el servidor.");
  window.location.href = "../../index.html";
});

// ==============================
// 🎮 Inicialización del juego
// ==============================
async function iniciarJuego() {
  const { scene, camera, renderer } = createScene();
  hud = setupHUDMulti();

  const { player1, player2 } = await loadPlayers(scene);

  // Identificar canasta local y remota según el rol
  const players = {
    player1,
    player2,
  };

  // === 🔁 Iniciar loop con sincronización de red ===
  loopControl = startGameLoopMulti(
    scene,
    camera,
    renderer,
    players,
    objetos,
    config,
    perderVida,
    ganarPuntos,
    hud,
    {
      socket,
      role,
      room: roomCode,
    }
  );

  // === 🧩 Spawner de objetos ===
  setInterval(() => {
    if (loopControl.isRunning()) {
      crearObjeto(scene, objetos, config, false);
    }
  }, config.spawn);

  if (config.modo === "clasico") {
  setInterval(() => {
    if (config.probBomba < 0.6) {
      config.probBomba += 0.05;
      console.log(`💣 Dificultad aumentada (online): probBomba = ${config.probBomba.toFixed(2)}`);
    }
  }, 20000);
}

  // === ⏱️ Contador de tiempo ===
  setInterval(() => {
    if (!loopControl.isRunning()) return;
    tiempo--;
    hud.actualizarTiempo(tiempo);
    if (tiempo <= 0) terminarJuego();
  }, 1000);
}

// ==============================
// ❤️ Lógica de puntuación y vidas
// ==============================
function perderVida(jugador) {
  if (jugador === 1) vidasLocal--;
  else vidasRemoto--;
  hud.actualizarVidas(vidasLocal, vidasRemoto);

  if (vidasLocal <= 0 || vidasRemoto <= 0) terminarJuego();
}

function ganarPuntos(jugador) {
  if (config.modo !== "clasico") return;
  if (jugador === 1) puntosLocal += 10;
  else puntosRemoto += 10;
  hud.actualizarPuntos(puntosLocal, puntosRemoto);
}

// ==============================
// 🏁 Fin del juego
// ==============================
function terminarJuego() {
  loopControl.detener();
  const ganador =
    puntosLocal > puntosRemoto
      ? "Jugador Local"
      : puntosRemoto > puntosLocal
      ? "Jugador Remoto"
      : "Empate";

  alert(`🏁 ¡Fin del juego!\n${ganador}\n\nTú: ${puntosLocal} pts\nOponente: ${puntosRemoto} pts`);
  window.location.href = "../../index.html";
}
