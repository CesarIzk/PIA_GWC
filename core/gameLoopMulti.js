// ===============================================================
// 🎮 Game Loop Multijugador FIXED
// ===============================================================
import * as THREE from "three";

const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ==========================
// 📱 INPUT (Touch)
// ==========================
if (esMovil) {
  window.addEventListener("touchstart", e => window.touchX = e.touches[0].clientX);
  window.addEventListener("touchmove",  e => window.touchX = e.touches[0].clientX);
  window.addEventListener("touchend",   () => window.touchX = null);
}

// ==================================================
export function startGameLoopMulti({ 
  scene, 
  camera, 
  renderer, 
  players, 
  objetos, 
  config, 
  net, 
  sync, 
  hud, 
  perderVida, 
  ganarPuntos 
}) {

  let gravedad = config.gravedad;
  const gravedadMax = 0.18;
  const teclas = {};
  let activo = true;

  const esOnline = !!net;
  const miRol = net?.role || null;

  // =============== INPUT KEYBOARD =================
  window.addEventListener("keydown", (e) => teclas[e.key] = true);
  window.addEventListener("keyup",   (e) => delete teclas[e.key]);

  // Posición throttle
  let ultimaPosEnviada = 0;
  const INTERVALO_SYNC = 50;

  // ==================================================
  // 🔄 UPDATE — Frame a Frame
  // ==================================================
  function update(dt) {
    if (!activo) return;

    let miJugadorRef = null;
    let huboMovimiento = false;

    // ============== MODO LOCAL ======================
    if (!esOnline) {
      if (teclas["a"] || teclas["A"]) players.player1.position.x -= 0.15;
      if (teclas["d"] || teclas["D"]) players.player1.position.x += 0.15;

      if (teclas["ArrowLeft"])  players.player2.position.x -= 0.15;
      if (teclas["ArrowRight"]) players.player2.position.x += 0.15;

      players.player1.position.x = Math.max(-8, Math.min(0, players.player1.position.x));
      players.player2.position.x = Math.max(0,  Math.min(8, players.player2.position.x));
    }

    // ============== MODO ONLINE =====================
    else {
      let p = null;

      if (miRol === "player1") p = players.player1;
      else                    p = players.player2;

      const prev = p.position.x;

      if (!esMovil) {
        if (teclas["a"] || teclas["A"] || teclas["ArrowLeft"])  p.position.x -= 0.15;
        if (teclas["d"] || teclas["D"] || teclas["ArrowRight"]) p.position.x += 0.15;
      } 
      else { 
        if (window.touchX) {
          const m = window.innerWidth / 2;
          if (window.touchX < m) p.position.x -= 0.20;
          else p.position.x += 0.20;
        }
      }

      // Límites según rol
      if (miRol === "player1") {
        p.position.x = Math.max(-8, Math.min(0, p.position.x));
      } else {
        p.position.x = Math.max(0, Math.min(8, p.position.x));
      }

      if (p.position.x !== prev) {
        miJugadorRef = p;
        huboMovimiento = true;
      }
    }

    // =============== POS SYNC (HOST / CLIENTE) ==================
    if (esOnline && huboMovimiento && miJugadorRef) {
      const ahora = performance.now();
      if (ahora - ultimaPosEnviada > INTERVALO_SYNC) {
        net.send({
          type: "pos",
          room: net.room,
          player: net.role,
          x: miJugadorRef.position.x
        });
        ultimaPosEnviada = ahora;
      }
    }

    // ========== UPDATE REMOTO (Interpolación) ===================
    if (esOnline) sync.updateRemote(dt);

    // ==================== OBJETOS / COLISIONES ==================
    const box1 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(players.player1.position.x, players.player1.position.y + 0.6, players.player1.position.z),
      new THREE.Vector3(3.2, 1.6, 2.0)
    );

    const box2 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(players.player2.position.x, players.player2.position.y + 0.6, players.player2.position.z),
      new THREE.Vector3(3.2, 1.6, 2.0)
    );

    for (let i = objetos.length - 1; i >= 0; i--) {
      const obj = objetos[i];

      // 🔥 Validar objeto
      if (!obj || !obj.position) {
        console.warn("🔥 Objeto inválido eliminado");
        objetos.splice(i, 1);
        continue;
      }

      // ⏳ Objeto aún cargando → no colisionar pero sí mover
      if (obj.userData.loading) {
        const g = obj.userData.esBomba ? gravedad * 1.3 : gravedad;
        obj.position.y -= g;

        if (obj.userData.esBomba && obj.userData.velocidad) {
          obj.position.add(obj.userData.velocidad);
        }
        continue;
      }

      // 🔄 Física normal
      const g = obj.userData.esBomba ? gravedad * 1.3 : gravedad;
      obj.position.y -= g;

      if (obj.userData.esBomba && obj.userData.velocidad) {
        obj.position.add(obj.userData.velocidad);
      }

      // 🗑️ Caída fuera del mapa
      if (obj.position.y < -3.5) {
        if (esOnline && miRol === "player1" && obj.userData.id) {
          net.send({
            type: "despawn",
            room: net.room,
            id: obj.userData.id
          });
        }

        scene.remove(obj);
        objetos.splice(i, 1);
        continue;
      }

      // 🚫 Ya colisionado → ignorar
      if (obj.userData.colisionado) continue;

      // 📦 Bounding box del objeto
      const objBox = new THREE.Box3().setFromObject(obj);

      // 💥 COLISIÓN JUGADOR 1
      if (box1.intersectsBox(objBox)) {
        if (esOnline && miRol === "player1" && obj.userData.id) {
          net.send({
            type: "despawn",
            room: net.room,
            id: obj.userData.id
          });
        }

        obj.userData.colisionado = true;
        scene.remove(obj);
        objetos.splice(i, 1);

        if (obj.userData.esBomba) perderVida(1);
        else ganarPuntos(1);

        hud.flashHUD?.();
        continue;
      }

      // 💥 COLISIÓN JUGADOR 2
      if (box2.intersectsBox(objBox)) {
        if (esOnline && miRol === "player1" && obj.userData.id) {
          net.send({
            type: "despawn",
            room: net.room,
            id: obj.userData.id
          });
        }

        obj.userData.colisionado = true;
        scene.remove(obj);
        objetos.splice(i, 1);

        if (obj.userData.esBomba) perderVida(2);
        else ganarPuntos(2);

        hud.flashHUD?.();
        continue;
      }
    }

    gravedad = Math.min(gravedadMax, gravedad + 0.00004);
  }

  // ==================================================
  // 🔁 LOOP PRINCIPAL
  // ==================================================
  let last = performance.now();

  function loop() {
    if (!activo) return;

    const now = performance.now();
    const dt = (now - last) * 0.06;
    last = now;

    update(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  loop();

  return {
    detener: () => activo = false,
    reanudar: () => activo = true,
    isRunning: () => activo
  };
}