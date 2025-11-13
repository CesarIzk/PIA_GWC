import * as THREE from "three";

/**
 * @param {THREE.Scene} scene 
 * @param {THREE.Camera} camera 
 * @param {THREE.WebGLRenderer} renderer 
 * @param {THREE.Object3D} player 
 * @param {Array} objetos 
 * @param {Object} config 
 * @param {Function} perderVida 
 * @param {Function} ganarPuntos 
 * @param {Object} hud 
 */
export function startGameLoop(scene, camera, renderer, player, objetos, config, perderVida, ganarPuntos, hud) {
  let gravedad = config.gravedad;
  const incremento = config.incremento;
  const gravedadMaxima = 0.2;
  let suavizado = 0.08;
  let objetivoX = 0;

  const teclas = {};
  window.addEventListener("keydown", (e) => teclas[e.key] = true);
  window.addEventListener("keyup", (e) => delete teclas[e.key]);

  let juegoActivo = true;

  function update() {
    if (!juegoActivo) return;

    // === Movimiento jugador ===
    if (teclas["ArrowLeft"] || teclas["a"]) objetivoX -= config.velocidad;
    if (teclas["ArrowRight"] || teclas["d"]) objetivoX += config.velocidad;
    objetivoX = Math.max(-8, Math.min(8, objetivoX));
    player.position.x += (objetivoX - player.position.x) * (1 - suavizado);

    // === Movimiento de objetos ===
    for (let i = objetos.length - 1; i >= 0; i--) {
      const obj = objetos[i];
      if (!obj) continue;

      obj.userData.tiempoDeVida ??= 0;
      obj.userData.tiempoDeVida++;

      const g = obj.userData.esBomba ? gravedad * 1.3 : gravedad;
      obj.position.y -= g;

      // Eliminar si sale del mapa
      if (obj.position.y < -3.5) {
        scene.remove(obj);
        objetos.splice(i, 1);
        continue;
      }

      // Colisiones
    // === Colisiones ===
const playerBox = new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(player.position.x, player.position.y + 0.6, 2), // 🔹 Z corregido
  new THREE.Vector3(2.8, 1.5, 1.0) // 🔹 caja más gruesa
);
const objBox = new THREE.Box3().setFromObject(obj);

if (!obj.userData.colisionado && playerBox.intersectsBox(objBox)) {
  obj.userData.colisionado = true;

  if (obj.userData.esBomba) perderVida();
  else ganarPuntos(obj);

  scene.remove(obj);
  objetos.splice(i, 1);
}

    }

    // Aumentar gravedad gradualmente
    gravedad = Math.min(gravedadMaxima, gravedad + incremento);
  }

  // === Bucle principal ===
  function animar() {
    requestAnimationFrame(animar);
    if (player) update();
    renderer.render(scene, camera);
  }

  animar();

  // Retorna controladores por si el juego necesita pausar
  return {
    detener: () => juegoActivo = false,
    reanudar: () => juegoActivo = true,
    isRunning: () => juegoActivo
  };
}
