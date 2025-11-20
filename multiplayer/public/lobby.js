// ============================================
// 🎮 Food Frenzy - Lobby Moderno (Matchmaking) FIXED
// ============================================

const WS_URL =
  location.hostname === "localhost" ||
  location.hostname.startsWith("192.")
    ? "ws://192.168.100.237:8080"
    : `wss://${location.hostname}`;

let socket = null;

// DOM
const menu = document.getElementById("menuOptions");
const matchBox = document.getElementById("matchStatus");
const matchText = document.getElementById("matchText");

const roomBox = document.getElementById("roomBox");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");

// =========================
// Mostrar estado
// =========================
function showStatus(text) {
  menu.classList.add("hidden");
  matchBox.classList.remove("hidden");
  matchText.textContent = text;
}

// =========================
// Conectar WebSocket
// =========================
function startSocket(onReady) {
  socket = new WebSocket(WS_URL);
  socket.ignoreClose = false;

  socket.addEventListener("open", () => {
    showStatus("Conectado al servidor...");
    onReady();
  });

  socket.addEventListener("message", (e) => {
    const data = JSON.parse(e.data);

    // -------------------------
    // 🏠 SALA CREADA
    // -------------------------
    if (data.type === "roomCreated") {
      roomBox.classList.remove("hidden");
      roomCodeDisplay.textContent = data.code;

      localStorage.setItem("multiplayerSession", JSON.stringify({
        roomCode: data.code,
        role: "player1",
        wsURL: WS_URL
      }));

      showStatus("Esperando jugador...");
    }

    // -------------------------
    // 🎮 INICIO DE PARTIDA (FIX)
    // -------------------------
    if (data.type === "startGame") {

      // Guardamos la sesión
      localStorage.setItem("multiplayerSession", JSON.stringify({
        roomCode: data.code,
        role: data.role,
        wsURL: WS_URL
      }));

      // Marcamos que venimos del lobby
      localStorage.setItem("fromLobby", "1");

      // 👇 MUY IMPORTANTE: evitar "close" inesperado
      socket.ignoreClose = true;

      showStatus("Jugador encontrado. Iniciando partida...");

      setTimeout(() => {
        // NO cerrar el socket manualmente
        window.location.href = "publicHUD.html";
      }, 700);
    }

    // -------------------------
    // ❌ ERROR
    // -------------------------
    if (data.type === "error") {
      alert(data.message);
      location.reload();
    }
  });

  // =========================
  // NO REACCIONAR AL CIERRE
  // =========================
  socket.addEventListener("close", () => {
    if (socket.ignoreClose) {
      console.log("⚪ Lobby cerró pero está en modo fantasma (OK)");
      return;
    }

    console.log("❌ Socket del lobby se cerró antes de tiempo");
  });
}

// =========================
// 🎮 Crear Sala
// =========================
document.getElementById("btnCrear").addEventListener("click", () => {
  showStatus("Conectando...");
  startSocket(() => {
    socket.send(JSON.stringify({ type: "create" }));
    showStatus("Creando sala...");
  });
});

// =========================
// 🎮 Unirse a Sala
// =========================
document.getElementById("btnUnirse").addEventListener("click", () => {
  const code = prompt("Código de sala:");
  if (!code) return;

  showStatus("Conectando...");

  startSocket(() => {
    socket.send(JSON.stringify({ type: "join", code }));
    showStatus("Uniéndose a sala...");
  });
});
