// ==========================================
// FOOD FRENZY - SERVIDOR WEBSOCKET (Railway + LOCAL)
// ==========================================

import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import os from "os";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("."));

// Almacenar jugadores conectados
let players = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).substr(2, 9);
  players.set(id, ws);

  console.log(`🟢 Jugador conectado: ${id}`);
  ws.send(JSON.stringify({ type: "assign", id }));

  // Escuchar mensajes de un jugador
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // Reenviar posición a otros jugadores
      if (data.type === "pos") {
        players.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: "pos", x: data.x, from: id }));
          }
        });
      }
    } catch (err) {
      console.error("❌ Error procesando mensaje:", err);
    }
  });

  ws.on("close", () => {
    console.log(`🔴 Jugador desconectado: ${id}`);
    players.delete(id);
  });
});

// Puerto y dirección local
const PORT = process.env.PORT || 8080;

// 🧠 Obtener IP local automáticamente
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`🚀 Servidor HTTP + WebSocket activo:`);
  console.log(`👉 Local:  http://localhost:${PORT}`);
  console.log(`👉 LAN:    http://${localIP}:${PORT}`);
  console.log(`🌐 WebSocket (auto): ws://${localIP}:${PORT}`);
});
