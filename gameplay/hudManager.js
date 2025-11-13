export function setupHUD() {
  const vidasImg = document.getElementById("vidasImg");
  const puntosHUD = document.getElementById("puntos");
  const tiempoHUD = document.getElementById("tiempo");
  const hud = document.getElementById("hud");

  return {
    actualizarVidas(vidas) {
      // ✅ usar ruta absoluta
      vidasImg.src = `/Images/HUDs/Health${vidas}.png`;

      // animación rápida de parpadeo
      vidasImg.classList.add("flash");
      setTimeout(() => vidasImg.classList.remove("flash"), 300);
    },

    actualizarPuntos(puntos) {
      puntosHUD.textContent = String(puntos).padStart(3, "0");
    },

    actualizarTiempo(tiempo) {
      tiempoHUD.textContent = tiempo;
    },

    flashHUD() {
      hud.classList.add("flash");
      setTimeout(() => hud.classList.remove("flash"), 200);
    },
  };
}
