// ==============================================
// 🎯 HUD MULTIJUGADOR (2 jugadores)
// Maneja las vidas, puntos y tiempo para ambos
// ==============================================
import { getAssetPath } from "../core/pathManager.js"; // ✅ IMPORTAR getAssetPath

export function setupHUDMulti() {
  // Referencias a los elementos del DOM
  const vidas1 = document.getElementById("vidas1");
  const vidas2 = document.getElementById("vidas2");
  const puntos1 = document.getElementById("puntos1");
  const puntos2 = document.getElementById("puntos2");
  const tiempoHUD = document.getElementById("tiempo");
  const hud = document.getElementById("hud");

  // ===========================
  // ESTADO INTERNO DEL HUD
  // ===========================
  let v1 = 3;
  let v2 = 3;
  let p1 = 0;
  let p2 = 0;

  // ===========================
  // FUNCIONES INTERNAS
  // ===========================
  function actualizarVidasInterno() {
    vidas1.src = getAssetPath(`Images/HUDs/Health${v1}.png`);
    vidas2.src = getAssetPath(`Images/HUDs/Health${v2}.png`);
  }

  function actualizarPuntosInterno() {
    puntos1.textContent = String(p1).padStart(3, "0");
    puntos2.textContent = String(p2).padStart(3, "0");
  }

  // ===========================
  // RETORNAMOS INTERFAZ PÚBLICA
  // ===========================
  return {
    // 🧡 Aplicado desde gameManager (HOST)
    perderVida(jugador) {
      if (jugador === 1) v1 = Math.max(0, v1 - 1);
      else v2 = Math.max(0, v2 - 1);

      actualizarVidasInterno();
      hud.classList.add("flash");
      setTimeout(() => hud.classList.remove("flash"), 200);
    },

    // 🧮 Aplicado desde gameManager (HOST)
    ganarPuntos(jugador) {
      if (jugador === 1) p1++;
      else p2++;

      actualizarPuntosInterno();
    },

    // 🧡 Aplicado desde SyncEngine.js (desde servidor)
    actualizarVidas(n1, n2) {
      v1 = n1;
      v2 = n2;
      actualizarVidasInterno();
    },

    // 🧮 Aplicado desde SyncEngine.js (desde servidor)
    actualizarPuntos(n1, n2) {
      p1 = n1;
      p2 = n2;
      actualizarPuntosInterno();
    },

    // ⏱️ Temporizador global
    actualizarTiempo(t) {
      tiempoHUD.textContent = t;
    },

    // ✨ Efecto visual
    flashHUD() {
      hud.classList.add("flash");
      setTimeout(() => hud.classList.remove("flash"), 200);
    },

    // Datos internos accesibles
    get vidas1() { return v1; },
    get vidas2() { return v2; },
    get puntos1() { return p1; },
    get puntos2() { return p2; }
  };
}
