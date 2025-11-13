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

  // === Retorna las funciones públicas ===
  return {
    /**
     * 🧡 Actualiza las vidas de ambos jugadores
     */
    actualizarVidas(v1, v2) {
      try {
        // 🔧 Fallback de rango (evita valores negativos o >3)
        const vida1 = Math.max(0, Math.min(3, v1));
        const vida2 = Math.max(0, Math.min(3, v2));

        // 🔗 Rutas seguras (asegura que las imágenes existan)
        vidas1.src = getAssetPath(`Images/HUDs/Health${vida1}.png`);
        vidas2.src = getAssetPath(`Images/HUDs/Health${vida2}.png`);

        // ✨ Efecto visual rápido
        vidas1.classList.add("flash");
        vidas2.classList.add("flash");
        setTimeout(() => {
          vidas1.classList.remove("flash");
          vidas2.classList.remove("flash");
        }, 250);
      } catch (err) {
        console.error("⚠️ Error actualizando vidas:", err);
      }
    },

    /**
     * 🧮 Actualiza los puntos
     */
    actualizarPuntos(p1, p2) {
      if (puntos1) puntos1.textContent = String(p1).padStart(3, "0");
      if (puntos2) puntos2.textContent = String(p2).padStart(3, "0");
    },

    /**
     * ⏱️ Actualiza el temporizador global
     */
    actualizarTiempo(tiempo) {
      if (tiempoHUD) tiempoHUD.textContent = tiempo;
    },

    /**
     * ✨ Pequeño destello en todo el HUD (opcional)
     */
    flashHUD() {
      if (!hud) return;
      hud.classList.add("flash");
      setTimeout(() => hud.classList.remove("flash"), 200);
    },
  };
}
