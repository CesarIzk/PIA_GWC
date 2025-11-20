// ==========================================
// 🌐 netManager.js — CONTROL TOTAL DE RED (FIXED)
// ==========================================

export const Net = {
  socket: null,
  connected: false,
  role: null,
  room: null,
  buffer: [],
  onMessage: null,
  url: null,
  closingManually: false,
  reconnecting: false,

  connect(url) {
    this.url = url;

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);

      this.socket.addEventListener("open", () => {
        this.connected = true;
        console.log("🔌 WS conectado");

        // ⬇ ENVIAR RECONNECT SOLO SI YA TENEMOS ROL Y SALA
        if (this.role && this.room) {
          console.log(`🔄 Enviando reconnect: ${this.role} en ${this.room}`);
          this.send({
            type: "reconnect",
            room: this.room,
            role: this.role
          });
        }

        resolve();
      });

      this.socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        // Si aún no hay handler, guardar en buffer
        if (!this.onMessage) {
          this.buffer.push(data);
          return;
        }

        // Si ya hay handler, procesar
        this.onMessage(data);
      });

      // ❌ Cerrado inesperado → reconectar
      this.socket.addEventListener("close", () => {
        this.connected = false;

        if (!this.closingManually && !this.reconnecting) {
          console.warn("⚠️ WS cerrado inesperadamente. Intentando reconectar...");
          this.reconnect();
        }
      });

      this.socket.addEventListener("error", (err) => {
        console.error("❌ WS error:", err);
        reject(err);
      });
    });
  },

  // 🔄 RECONNECT AUTOMÁTICO
  reconnect() {
    if (this.reconnecting) return;

    this.reconnecting = true;

    setTimeout(() => {
      console.log("🔄 Reintentando conexión WS...");
      
      this.connect(this.url)
        .then(() => {
          this.reconnecting = false;
        })
        .catch((err) => {
          console.error("❌ Error al reconectar:", err);
          this.reconnecting = false;
        });
    }, 1500);
  },

  // 🚀 Enviar mensaje
  send(data) {
    if (this.connected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ No se puede enviar, socket no conectado");
    }
  },

  // 🚀 enviar movimiento
  sendPos(role, room, x) {
    this.send({
      type: "pos",
      room,
      player: role,
      x
    });
  },

  // Configurar handler tras cargar escena
  flushBufferAndSetHandler(handler) {
    this.onMessage = handler;

    // Procesar mensajes que llegaron antes
    for (const msg of this.buffer) {
      handler(msg);
    }
    this.buffer.length = 0;
  },

  // 🚪 Cierre voluntario del WS
  close() {
    this.closingManually = true;
    if (this.socket) {
      this.socket.close();
    }
  }
};