// ==========================================
// FOOD FRENZY - SERVIDOR WEBSOCKET (Railway + Local)
// ==========================================

import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import os from "os";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("."));

// ====================
// 🎮 Estructura de salas
// ====================
const rooms = new Map(); // { code: { players: [ws1, ws2], ready: bool } }

function generateCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // 🧩 Crear sala
      if (data.type === "create") {
        const code = generateCode();
        rooms.set(code, { players: [ws], ready: false });
        ws.roomCode = code;
        ws.role = "player1";
        ws.send(JSON.stringify({ type: "roomCreated", code }));
        console.log(`🏠 Sala creada: ${code}`);
        return;
      }

      // 🧩 Unirse a sala existente
      if (data.type === "join") {
        const room = rooms.get(data.code);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Sala no encontrada." }));
          return;
        }
        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: "error", message: "Sala llena." }));
          return;
        }

        room.players.push(ws);
        ws.roomCode = data.code;
        ws.role = "player2";

        console.log(`👥 Sala ${data.code}: 2 jugadores conectados`);
        // Notificar a ambos que inicie la partida
        room.players.forEach((p, i) =>
          p.send(JSON.stringify({ type: "startGame", code: data.code, role: i === 0 ? "player1" : "player2" }))
        );
        return;
      }

      // 🧩 Movimiento / posición
      if (data.type === "pos") {
        const room = rooms.get(data.room);
        if (!room) return;
        room.players.forEach((p) => {
          if (p !== ws && p.readyState === 1) {
            p.send(JSON.stringify({ type: "pos", room: data.room, x: data.x }));
          }
        });
      }
    } catch (err) {
      console.error("❌ Error en mensaje:", err);
    }
  });

  ws.on("close", () => {
    if (ws.roomCode) {
      const room = rooms.get(ws.roomCode);
      if (room) {
        room.players = room.players.filter((p) => p !== ws);
        if (room.players.length === 0) {
          rooms.delete(ws.roomCode);
          console.log(`🗑️ Sala ${ws.roomCode} eliminada`);
        }
      }
    }
  });
});

// ====================
// 🔌 Servidor HTTP/WS
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
  console.log(`🚀 Servidor listo en:`);
  console.log(`👉 Local:  http://localhost:${PORT}`);
  console.log(`👉 LAN:    http://${ip}:${PORT}`);
  console.log(`🌐 WS:     ws://${ip}:${PORT}`);
});
