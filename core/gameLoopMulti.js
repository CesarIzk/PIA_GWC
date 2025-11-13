// ==============================================
// 🎮 Game Loop Multijugador (Local / Online compatible)
// ==============================================
import * as THREE from "three";

export function startGameLoopMulti(
  scene,
  camera,
  renderer,
  players,
  objetos,
  config,
  perderVida,
  ganarPuntos,
  hud,
  red = null // opcional: { socket, role, room }
) {
  let gravedad = config.gravedad;
  const gravedadMax = 0.18;
  const teclas = {};
  let activo = true;

  // === Controles ===
  window.addEventListener("keydown", (e) => (teclas[e.key] = true));
  window.addEventListener("keyup", (e) => delete teclas[e.key]);

  // === Lógica frame a frame ===
  function update() {
    if (!activo) return;

    // === Movimiento local
    if (!red || red.role === "player1") {
      if (teclas["a"]) players.player1.position.x -= 0.15;
      if (teclas["d"]) players.player1.position.x += 0.15;
    }
    if (!red || red.role === "player2") {
      if (teclas["ArrowLeft"]) players.player2.position.x -= 0.15;
      if (teclas["ArrowRight"]) players.player2.position.x += 0.15;
    }

    // Limitar movimiento lateral
    players.player1.position.x = Math.max(-8, Math.min(0, players.player1.position.x));
    players.player2.position.x = Math.max(0, Math.min(8, players.player2.position.x));

    // === Enviar posición al otro jugador (modo online)
    if (red && red.socket.readyState === WebSocket.OPEN) {
      const pos = red.role === "player1" ? players.player1.position.x : players.player2.position.x;
      red.socket.send(JSON.stringify({ type: "pos", room: red.room, x: pos }));
    }

    // === Cajas de colisión precisas ===
    const box1 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(players.player1.position.x, players.player1.position.y + 0.6, players.player1.position.z),
      new THREE.Vector3(3.2, 1.6, 2.0)
    );

    const box2 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(players.player2.position.x, players.player2.position.y + 0.6, players.player2.position.z),
      new THREE.Vector3(3.2, 1.6, 2.0)
    );

    // === Actualizar objetos ===
    for (let i = objetos.length - 1; i >= 0; i--) {
      const obj = objetos[i];
      if (!obj) continue;

      // Caída
      const g = obj.userData.esBomba ? gravedad * 1.3 : gravedad;
      obj.position.y -= g;

      // Movimiento lateral (solo bombas)
      if (obj.userData.esBomba && obj.userData.velocidad) {
        obj.position.add(obj.userData.velocidad);
      }

      // Si sale del mapa
      if (obj.position.y < -3.5) {
        scene.remove(obj);
        objetos.splice(i, 1);
        continue;
      }

      // Colisión
      const objBox = new THREE.Box3().setFromObject(obj);
      if (obj.userData.colisionado) continue;

      // === Jugador 1 ===
      if (box1.intersectsBox(objBox)) {
        obj.userData.colisionado = true;
        scene.remove(obj);
        objetos.splice(i, 1);

        if (obj.userData.esBomba) {
          perderVida(1);
          hud.flashHUD?.(); // efecto visual
        } else if (config.modo === "clasico") {
          ganarPuntos(1);
        }
        continue;
      }

      // === Jugador 2 ===
      if (box2.intersectsBox(objBox)) {
        obj.userData.colisionado = true;
        scene.remove(obj);
        objetos.splice(i, 1);

        if (obj.userData.esBomba) {
          perderVida(2);
          hud.flashHUD?.();
        } else if (config.modo === "clasico") {
          ganarPuntos(2);
        }
        continue;
      }
    }

    // Incrementar gravedad progresivamente
    gravedad = Math.min(gravedadMax, gravedad + 0.00004);
  }

  function loop() {
    requestAnimationFrame(loop);
    update();
    renderer.render(scene, camera);
  }

  loop();

  return {
    detener: () => (activo = false),
    reanudar: () => (activo = true),
    isRunning: () => activo,
  };
}
