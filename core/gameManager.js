// ========================================================
// 🎮 gameManager.js — Modo Online FINAL
// ========================================================

import { Net } from "./netManager.js";
import { Sync } from "./syncEngine.js";
import { createScene } from "./sceneManager.js";
import { loadPlayers } from "./playerManager.js";
import { setupHUDMulti } from "../gameplay/hudManagerMulti.js";
import { startGameLoopMulti } from "./gameLoopMulti.js";
import { comidaModelos } from "../gameplay/objectSpawner.js"; // ⬅️ AÑADIDO
import { reproducirMusica, detenerMusica, reproducirSFX } from "../../core/audioManager.js";


export async function initOnlineGame(sessionData) {

  console.log("🌐 Iniciando partida ONLINE");
  console.log("➡ Rol:", sessionData.role);

  // ====================================================
  // 1) GUARDAR DATOS + CONECTAR
  // ====================================================
  Net.role = sessionData.role;
  Net.room = sessionData.roomCode;

  console.log(`🔑 Rol guardado: ${Net.role}`);
  console.log(`🏠 Sala guardada: ${Net.room}`);

  await Net.connect(sessionData.wsURL);
  console.log("✅ Conexión WS establecida");

  // ====================================================
  // 2) ESCENA + HUD + JUGADORES
  // ====================================================
  const { scene, camera, renderer } = createScene();
  detenerMusica();
  const hud = setupHUDMulti();
  const players = await loadPlayers(scene);
  const objetos = [];
reproducirMusica("Assets/musica/vibe.mp3");
  Sync.init(players, objetos, sessionData.config, hud, Net.role);

  // ====================================================
  // 3) VERIFICAR FIN DEL JUEGO
  // ====================================================
  let juegoTerminado = false;

  function verificarFin() {
    if (juegoTerminado) return;
    if (Net.role !== "player1") return;

    if (hud.vidas1 <= 0 || hud.vidas2 <= 0 || sessionData.config.tiempo <= 0) {
      juegoTerminado = true;

      console.log("🏁 Enviando fin del juego");
detenerMusica();
      Net.send({
        type: "endGame",
        room: Net.room,
        p1: hud.puntos1,
        p2: hud.puntos2
      });
    }
  }

  // ====================================================
  // 4) PERDER VIDA
  // ====================================================
  function perderVida(jugador) {
    hud.perderVida(jugador);
reproducirSFX("Assets/musica/explosion.mp3", 0.7);
    if (Net.role === "player1") {
      Net.send({
        type: "syncLife",
        room: Net.room,
        vidasLocal: hud.vidas1,
        vidasRemoto: hud.vidas2
      });

      verificarFin();
    }
  }

  // ====================================================
  // 5) GANAR PUNTOS
  // ====================================================
  function ganarPuntos(jugador) {
    hud.ganarPuntos(jugador);

    if (Net.role === "player1") {
      Net.send({
        type: "syncScore",
        room: Net.room,
        puntosLocal: hud.puntos1,
        puntosRemoto: hud.puntos2
      });
    }
  }

  // ====================================================
  // 6) LOOP DEL JUEGO
  // ====================================================
  const loop = startGameLoopMulti({
    scene,
    camera,
    renderer,
    players,
    objetos,
    config: sessionData.config,
    net: Net,
    sync: Sync,
    hud,
    perderVida,
    ganarPuntos
  });

  console.log("📦 CONFIG PASADA AL LOOP:", sessionData.config);

  // ====================================================
  // 7) HOST: SPAWN + TIMER
  // ====================================================
  if (Net.role === "player1") {
    
  // === GENERADOR DE OBJETOS ===
setInterval(() => {
  if (juegoTerminado) return;

  const id = Date.now() + Math.random();
  const esBomba = Math.random() < sessionData.config.probBomba;
  const posX = (Math.random() - 0.5) * 16;
  const posY = 10 + Math.random() * 3;
  const velX = esBomba ? (-Math.sign(posX) * (0.015 + Math.random() * 0.025)) : 0;
  const velY = esBomba ? (-0.05 - Math.random() * 0.04) : 0;

  // 🔹 Elegimos el modelo exacto que verán ambos
  const nombre = esBomba
    ? "bomba"
    : comidaModelos[Math.floor(Math.random() * comidaModelos.length)];

  Net.send({
    type: "spawn",
    room: Net.room,
    id,
    posX,
    posY,
    esBomba,
    velX,
    velY,
    nombre          // ⬅️ ahora sí existe
  });

}, sessionData.config.spawn);


    // === TIMER ===
    setInterval(() => {
      if (juegoTerminado) return;

      sessionData.config.tiempo--;

      if (sessionData.config.tiempo <= 0) {
        sessionData.config.tiempo = 0;
      }

      hud.actualizarTiempo(sessionData.config.tiempo);

      Net.send({
        type: "syncTime",
        room: Net.room,
        tiempo: sessionData.config.tiempo
      });

      verificarFin();

    }, 1000);
  }

  // ====================================================
  // 8) ESCUCHAR EVENTOS WS
  // ====================================================
  Net.flushBufferAndSetHandler((msg) => {

    switch (msg.type) {

      case "spawn":
        Sync.applySpawn(scene, msg);
        break;

      case "despawn":
        Sync.removeObject(msg.id);
        break;

      case "pos":
        if (msg.player !== Net.role) {
          Sync.remoteX = msg.x;
        }
        break;

      case "syncScore":
        Sync.applyScore(msg);
        break;

      case "syncLife":
        Sync.applyLife(msg);
        break;

      case "syncTime":
        hud.actualizarTiempo(msg.tiempo);
        break;

      case "endGame":
        juegoTerminado = true;
        loop.detener();
        
        alert(`🏁 Fin del juego!\nP1: ${msg.p1} puntos\nP2: ${msg.p2} puntos`);
        
        Net.close();
        window.location.href = "../../multijugador.html";
        break;

      case "playerDisconnected":
        alert("❌ El otro jugador se desconectó");
        Net.close();
        window.location.href = "../../multijugador.html";
        break;
    }
  });
}