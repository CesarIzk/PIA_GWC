// ===============================================================
// 🎮 Food Frenzy - Cliente Online (HUD / Gameplay Online) FIXED
// ===============================================================

import { initOnlineGame } from "../../core/gameManager.js";
import { getConfigMulti } from "../../core/difficulty.js";

// =========================
// VERIFICAR ORIGEN (LOBBY)
// =========================
const fromLobby = localStorage.getItem("fromLobby") === "1";

if (!fromLobby) {
  alert("⚠ No puedes entrar aquí directamente.");
  window.location.href = "./lobby.html";
  throw new Error("Entrada ilegal a HUD.");
}

// Limpia la bandera para evitar bugs
localStorage.removeItem("fromLobby");

// =========================
// CARGAR SESIÓN
// =========================
const sessionData = JSON.parse(localStorage.getItem("multiplayerSession"));

if (!sessionData || !sessionData.roomCode || !sessionData.role) {
  alert("Error: No hay datos de la sala.");
  window.location.href = "../lobby.html";
  throw new Error("No session data");
}

// =========================
// CONFIGURACIÓN LOCAL
// =========================
sessionData.config = getConfigMulti();
sessionData.config.tipoJuego = "online";
sessionData.config.modo = "clasico";
sessionData.config.gravedad = 0.06;
sessionData.config.spawn = 2000;
sessionData.config.vidas = 3;
sessionData.config.tiempo = 60;

// =========================
// GENERAR URL WS
// =========================
sessionData.wsURL =
  location.hostname === "localhost" || location.hostname.startsWith("192.")
    ? "ws://192.168.1.247:8080"
    : `wss://${location.hostname}`;

// =========================
// LOG IMPORTANTE
// =========================
console.log("🎮 Iniciando HUD con sesión:", sessionData);

// =========================
// EVITAR QUE EL CIERRE DE LA PÁGINA DESCONECTE EL SOCKET
// =========================
window.addEventListener("beforeunload", (e) => {
  // No cerrar WS
  e.preventDefault();
  return "";
});

// =========================
// INICIAR JUEGO ONLINE
// =========================
initOnlineGame(sessionData);
