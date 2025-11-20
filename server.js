// =======================================
// 🌐 FOOD FRENZY - Servidor WebSocket FIXED
// =======================================
import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());   // <-- para que funcione req.body

// archivos estáticos
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ====================
// 🧾 "BD" de puntajes en memoria
// ====================
const SCORES_FILE = path.join(__dirname, "scores.json");

function cargarScores() {
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function guardarScores(data) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
}
// ====================
// 🧾 BD permanente de puntajes
// ====================

// POST guardar
app.post("/api/score", (req, res) => {
  const { nombre, puntos, modo } = req.body;

  if (!nombre || typeof puntos !== "number") {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const scores = cargarScores();

  const nuevo = {
    nombre,
    puntos,
    modo: modo || "solo",
    fecha: new Date().toISOString(),
  };

  scores.push(nuevo);
  guardarScores(scores);

  console.log("💾 Nuevo score guardado:", nuevo);

  res.status(201).json({ ok: true });
});

// GET top 10
app.get("/api/score/top", (req, res) => {
  const scores = cargarScores();

  const top = [...scores]
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 10);

  res.json(top);
});

// ====================
// 🎮 Estructura de salas
// ====================
const rooms = new Map();

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ====================
// 🧠 Manejo de conexiones
// ====================
wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // === RECONEXIÓN ===
    if (data.type === "reconnect") {
      const room = rooms.get(data.room);
      if (!room) {
        console.warn(`⚠️ Sala ${data.room} no existe para reconectar`);
        return;
      }

      // Buscar jugador existente con ese rol
      const playerIndex = room.players.findIndex(p => p.role === data.role);

      if (playerIndex !== -1) {
        // Reemplazar socket pero mantener el rol
        room.players[playerIndex] = ws;
        console.log(`🔄 Reconexión: ${data.role} en sala ${data.room}`);
      } else {
        // Primera conexión de este rol
        room.players.push(ws);
        console.log(`✅ Primera conexión: ${data.role} en sala ${data.room}`);
      }

      // Guardar datos en el socket
      ws.roomCode = data.room;
      ws.role = data.role;

      return;
    }

    // === Crear sala ===
    if (data.type === "create") {
      const code = generateCode();
      
      ws.roomCode = code;
      ws.role = "player1";

      rooms.set(code, { 
        players: [ws], 
        inGame: false 
      });

      ws.send(JSON.stringify({ type: "roomCreated", code }));
      console.log(`🏠 Sala creada: ${code}`);
      return;
    }

    // === Unirse a sala ===
    if (data.type === "join") {
      const room = rooms.get(data.code);

      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "❌ Sala inexistente." }));
        return;
      }

      if (room.players.length >= 2) {
        ws.send(JSON.stringify({ type: "error", message: "⚠️ Sala llena." }));
        return;
      }

      ws.roomCode = data.code;
      ws.role = "player2";

      room.players.push(ws);

      console.log(`👥 Jugadores en sala ${data.code}: ${room.players.length}`);

      // Iniciar juego cuando hay 2 jugadores
      if (room.players.length === 2) {
        console.log(`🎮 Iniciando partida en sala ${data.code}`);

        room.inGame = true;

        // Asignar roles
        room.players[0].role = "player1";
        room.players[1].role = "player2";

        // Notificar a ambos jugadores
        room.players.forEach((p, i) => {
          if (p.readyState === p.OPEN) {
            p.send(JSON.stringify({
              type: "startGame",
              code: data.code,
              role: i === 0 ? "player1" : "player2"
            }));
          }
        });
      }

      return;
    }

    // === Movimiento ===
    if (data.type === "pos") {
      const room = rooms.get(data.room);
      if (!room) return;

      room.players.forEach((p) => {
        if (p !== ws && p.readyState === p.OPEN) {
          p.send(JSON.stringify(data));
        }
      });
      return;
    }

    // === Eventos generales ===
    if (["syncLife", "syncScore", "endGame", "syncTime"].includes(data.type)) {
      const room = rooms.get(data.room);
      if (!room) return;

      room.players.forEach((p) => {
        if (p !== ws && p.readyState === p.OPEN) {
          p.send(JSON.stringify(data));
        }
      });
      return;
    }

    // === Objetos ===
    if (data.type === "spawn") {
      const room = rooms.get(data.room);
      if (!room) return;

      room.players.forEach((p) => {
        if (p.readyState === p.OPEN) {
          p.send(JSON.stringify(data));
        }
      });
      return;
    }

  });

  // ====================
  // 🔥 DESCONEXIÓN
  // ====================
  ws.on("close", () => {
    if (!ws.roomCode) {
      console.log("🔴 Cliente sin sala se desconectó");
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    console.log(`🔴 Cliente ${ws.role || 'sin rol'} salió de la sala ${ws.roomCode}`);

    // ⚠️ Si el juego NO ha empezado, NO hacer nada
    // Los clientes del lobby se están reconectando desde publicHUD.html
    if (!room.inGame) {
      console.log(`⏳ Desconexión de lobby ignorada (${ws.roomCode})`);
      return;
    }

    // ⚠️ Si el juego YA EMPEZÓ, dar 5 segundos antes de notificar
    // (puede ser que esté reconectando)
    setTimeout(() => {
      const currentRoom = rooms.get(ws.roomCode);
      if (!currentRoom) return;

      // Verificar si el jugador sigue desconectado
      const playerStillDisconnected = !currentRoom.players.some(
        p => p.role === ws.role && p.readyState === p.OPEN
      );

      if (playerStillDisconnected) {
        console.log(`❌ Jugador ${ws.role} no reconectó en ${ws.roomCode}`);

        // Notificar al otro jugador
        currentRoom.players.forEach((p) => {
          if (p.role !== ws.role && p.readyState === p.OPEN) {
            p.send(JSON.stringify({ type: "playerDisconnected" }));
          }
        });

        // Eliminar sala si ya no hay nadie
        if (currentRoom.players.every(p => p.readyState !== p.OPEN)) {
          rooms.delete(ws.roomCode);
          console.log(`🗑️ Sala ${ws.roomCode} eliminada`);
        }
      }
    }, 5000);
  });

});

// ====================
// 🔌 HTTP SERVER
// ====================
const PORT = process.env.PORT || 8080;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

server.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log(`🚀 Servidor HTTP + WebSocket activo`);
  console.log(`👉 Local:  http://localhost:${PORT}`);
  console.log(`👉 LAN:    http://${ip}:${PORT}`);
  console.log(`🌐 WS:     ws://${ip}:${PORT}`);
});