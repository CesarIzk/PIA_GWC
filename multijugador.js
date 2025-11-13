document.addEventListener("DOMContentLoaded", () => {
  let tipoJuego = null;
  let escenarioSeleccionado = null;

  const btnLocal = document.getElementById("btnLocal");
  const btnOnline = document.getElementById("btnOnline");
  const escenarios = document.querySelectorAll(".selectStage");
  const btnIniciar = document.getElementById("btnIniciar");
  const contenedor = document.querySelector(".chosenStage");

  // === Seleccionar tipo de multijugador ===
  btnLocal.addEventListener("click", () => {
    tipoJuego = "local";
    btnLocal.classList.add("active");
    btnOnline.classList.remove("active");
    verificarListo();
  });

  btnOnline.addEventListener("click", () => {
    tipoJuego = "online";
    btnOnline.classList.add("active");
    btnLocal.classList.remove("active");
    verificarListo();
  });

  // === Seleccionar escenario ===
  escenarios.forEach((esc) => {
    esc.addEventListener("click", () => {
      escenarios.forEach((e) => e.classList.remove("active"));
      esc.classList.add("active");
      escenarioSeleccionado = esc.dataset.id;
      verificarListo();
    });
  });

  // === Obtener dificultad y modo actual ===
  function getSeleccion() {
    const dificultad = document.querySelector('input[name="dificultad"]:checked').value;
    const modo = document.querySelector('input[name="modo"]:checked').value;
    return { dificultad, modo };
  }

  // === Verificar si todo está listo ===
  function verificarListo() {
    if (tipoJuego && escenarioSeleccionado) {
      contenedor.setAttribute("aria-disabled", "false");
      btnIniciar.disabled = false;
    } else {
      contenedor.setAttribute("aria-disabled", "true");
      btnIniciar.disabled = true;
    }
  }

  // === Iniciar partida ===
  btnIniciar.addEventListener("click", () => {
    const { dificultad, modo } = getSeleccion();
    if (!tipoJuego || !escenarioSeleccionado)
      return alert("Selecciona el modo y escenario primero.");

    const config = {
      tipoJuego,
      escenario: escenarioSeleccionado,
      dificultad,
      modo,
      timestamp: Date.now(), // opcional para debug
    };

    // Guardar configuración
    localStorage.setItem("configMultijugador", JSON.stringify(config));

    // Redirigir según tipo
    if (tipoJuego === "local") {
      window.location.href = "multiplayer/local/localHUD.html";
    } else {
      // ✅ Redirige al nuevo lobby online
      window.location.href = "multiplayer/public/lobby.html";
    }
  });
});
