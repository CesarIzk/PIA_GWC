// ===========================================
// ⚙️ Configuración de dificultad (Single & Multi)
// ===========================================

export function getConfig() {
  const dificultad = localStorage.getItem("selectedDifficulty") || "facil";
  const modo = localStorage.getItem("selectedMode") || "clasico";

  let config = {};

  if (modo === "survival") {
    config = {
      modo,
      vidas: 3,
      tiempo: Infinity,
      gravedad: 0.07,
      incremento: 0.00005,
      velocidad: 0.3,
      spawn: 1200,
      probBomba: 1.0, // solo bombas
      dinamico: false,
    };
  } else {
    // 🎮 modo clásico
    switch (dificultad) {
      case "facil":
        config = {
          modo,
          vidas: 3,
          tiempo: 70,
          gravedad: 0.05,
          incremento: 0.00003,
          velocidad: 0.35,
          spawn: 1800,
          probBomba: 0.15,
          dinamico: true,
        };
        break;
      case "media":
        config = {
          modo,
          vidas: 3,
          tiempo: 60,
          gravedad: 0.07,
          incremento: 0.00004,
          velocidad: 0.3,
          spawn: 1500,
          probBomba: 0.25,
          dinamico: true,
        };
        break;
      case "dificil":
        config = {
          modo,
          vidas: 3,
          tiempo: 50,
          gravedad: 0.09,
          incremento: 0.00006,
          velocidad: 0.25,
          spawn: 1000,
          probBomba: 0.35,
          dinamico: true,
        };
        break;
    }
  }

  return config;
}

export function getConfigMulti() {
  const config = JSON.parse(localStorage.getItem("configMultijugador")) || {
    dificultad: "media",
    modo: "clasico",
  };

  const presets = {
    facil: { gravedad: 0.05, spawn: 2000, vidas: 3, tiempo: 60, probBomba: 0.15 },
    media: { gravedad: 0.07, spawn: 1500, vidas: 3, tiempo: 60, probBomba: 0.25 },
    dificil: { gravedad: 0.09, spawn: 1000, vidas: 3, tiempo: 60, probBomba: 0.35 },
  };

  return {
    ...presets[config.dificultad],
    modo: config.modo,
    escenario: config.escenario,
    dinamico: config.modo === "clasico", // solo sube bombas en clásico
  };
}
