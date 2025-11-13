// ================================
// 🎮 Food Frenzy - Lobby Online
// ================================

// 💡 Detección automática de entorno (igual que en publicHUD)
const WS_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("192.")
    ? "ws://192.168.100.237:8080" // ⚙️ IP local
    : `wss://${window.location.hostname}`; // 🌐 Railway

const socket = new WebSocket(WS_URL);
console.log(`🌐 Conectando a ${WS_URL} ...`);

// ================================
// 📦 Referencias del DOM
// ================================
const infoBox = document.getElementById("infoBox");
const esperaBox = document.getElementById("esperaBox");
const iniciarBox = document.getElementById("iniciarBox");
const codigoSala = document.getElementById("codigoSala");
const rolJugador = document.getElementById("rolJugador");
const btnJugar = document.getElementById("btnJugar");

let roomCode = null;
let role = null;

// ================================
// 🚀 Conexión al servidor
// ================================
socket.addEventListener("open", () => {
  console.log("✅ Conectado al servidor WebSocket");
  infoBox.textContent = "Conectado al servidor...";
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  // 🏠 Sala creada
  if (data.type === "roomCreated") {
    roomCode = data.code;
    infoBox.textContent = "";
    esperaBox.classList.remove("hidden");
    codigoSala.textContent = roomCode;
    rolJugador.textContent = "Esperando jugador 2...";
  }

  // ⚠️ Error del servidor
  if (data.type === "error") {
    alert(`⚠️ ${data.message}`);
    infoBox.textContent = "";
  }

  // 🎬 Inicio de partida (nuevo servidor usa "startGame")
  if (data.type === "startGame") {
    roomCode = data.code;
    role = data.role;

    infoBox.textContent = "";
    esperaBox.classList.add("hidden");
    iniciarBox.classList.remove("hidden");

    rolJugador.textContent =
      role === "player1" ? "Jugador 1 🥦 (verde)" : "Jugador 2 🌶️ (rojo)";

    // Guardar datos para el HUD
    localStorage.setItem("multiplayerSession", JSON.stringify({ roomCode, role }));
  }
});

socket.addEventListener("close", () => {
  infoBox.textContent = "❌ Conexión perdida con el servidor.";
});

// ================================
// 🧩 Botones
// ================================
document.getElementById("btnCrear").addEventListener("click", () => {
  socket.send(JSON.stringify({ type: "create" }));
  infoBox.textContent = "Creando sala...";
});

document.getElementById("btnUnirse").addEventListener("click", () => {
  const code = prompt("Introduce el código de la sala:");
  if (!code) return;
  socket.send(JSON.stringify({ type: "join", code }));
  infoBox.textContent = "Uniéndose a la sala...";
});

btnJugar.addEventListener("click", () => {
  if (!roomCode || !role) {
    alert("⚠️ Espera a que se inicie la partida primero.");
    return;
  }

  window.location.href = "publicHUD.html";
});
