// ===================================================
// 🔄 syncEngine.js — Sincronización COMPLETA
// ===================================================

import { crearObjeto } from "../gameplay/objectSpawner.js";

export const Sync = {
  players: null,
  objetos: null,
  hud: null,
  config: null,
  role: null,

  remoteX: 0,
  lerpSpeed: 0.12,

  spawnQueue: [],

  init(players, objetos, config, hud, role) {
    this.players = players;
    this.objetos = objetos;
    this.config = config;
    this.hud = hud;
    this.role = role;
  },

   setRemoteX(x) {
    this.remoteX = x;
  },

  // 🟢 Interpolación del jugador remoto
  updateRemote(dt) {
    const remote =
      this.role === "player1" ? this.players.player2 : this.players.player1;

    const factor = Math.min(1, this.lerpSpeed * dt);
    remote.position.x += (this.remoteX - remote.position.x) * factor;
  },

  // 🟢 Aplicar spawn sincronizado
applySpawn(scene, msg) {

  console.log(
    `📦 Spawn recibido: ID=${msg.id}, tipo=${msg.nombre}, X=${msg.posX}`
  );

  crearObjeto(
    scene,
    this.objetos,
    this.config,
    false,
    msg.posX,
    msg.esBomba,
    msg.posY,
    msg.velX,
    msg.velY,
    msg.id,
    msg.nombre  // NUEVO
  );
},


  // 🟢 Eliminar objeto sincronizado
  removeObject(id) {
    const index = this.objetos.findIndex(o => o.userData.id === id);
    
    if (index !== -1) {
      const obj = this.objetos[index];
      
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      
      this.objetos.splice(index, 1);
      console.log(`🗑️ Objeto ${id} eliminado`);
    } else {
      console.warn(`⚠️ No se encontró objeto con ID: ${id}`);
    }
  },

  // 🟢 Puntaje
  applyScore(msg) {
    this.hud.actualizarPuntos(msg.puntosLocal, msg.puntosRemoto);
  },

  // 🟢 Vidas
  applyLife(msg) {
    this.hud.actualizarVidas(msg.vidasLocal, msg.vidasRemoto);
  }
};