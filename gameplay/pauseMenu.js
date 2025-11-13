/**
 * Crea y controla el menú de pausa.
 * @param {Object} loopControl - Control del gameLoop (con .detener() y .reanudar()).
 */
export function setupPauseMenu(loopControl) {
  const btnPause = document.getElementById("btnPause");
  const pauseMenu = document.getElementById("pauseMenu");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const btnExit = document.getElementById("btnExit");

  let pausaActiva = false;

  // 🔹 Mostrar/Ocultar menú
  function togglePausa() {
    pausaActiva = !pausaActiva;

    if (pausaActiva) {
      loopControl.detener();
      pauseMenu.classList.remove("hidden");
      console.log("⏸️ Juego en pausa");
    } else {
      loopControl.reanudar();
      pauseMenu.classList.add("hidden");
      console.log("▶️ Juego reanudado");
    }
  }

  // 🔹 Eventos
  if (btnPause) btnPause.addEventListener("click", togglePausa);
  if (btnResume) btnResume.addEventListener("click", togglePausa);
  if (btnRestart)
    btnRestart.addEventListener("click", () => {
      window.location.reload();
    });
  if (btnExit)
    btnExit.addEventListener("click", () => {
      window.location.href = "solojugador.html";
    });

  // 🔹 Tecla Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") togglePausa();
  });

  return { togglePausa, isPaused: () => pausaActiva };
}
