const API_TOP_URL = "/api/score/top";

document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.querySelector("table");

  // 1) Leer del servicio web
  let puntuaciones = [];
  try {
    const resp = await fetch(API_TOP_URL);
    if (resp.ok) {
      puntuaciones = await resp.json();
    }
  } catch (e) {
    console.warn("⚠️ No se pudo leer del servicio web, uso localStorage:", e);
    puntuaciones = JSON.parse(localStorage.getItem("puntuaciones")) || [];
  }

  // 🧹 Limpiar filas estáticas (dejar solo el encabezado)
  const filas = tabla.querySelectorAll("tr");
  filas.forEach((fila, i) => {
    if (i > 0) fila.remove();
  });

  async function cargarPuntuaciones() {
    let puntuaciones = [];

    try {
      // 1️⃣ Intentar servicio web
      const res = await fetch(API_TOP_URL);
      if (!res.ok) throw new Error("Status " + res.status);
      puntuaciones = await res.json();
      console.log("✅ Puntuaciones desde API:", puntuaciones);
    } catch (err) {
      console.warn("⚠️ No se pudo usar el servicio web, usando localStorage:", err);
      puntuaciones = JSON.parse(localStorage.getItem("puntuaciones")) || [];
    }

    // Ordenar por puntos de mayor a menor, por si vienen desordenadas
    puntuaciones.sort((a, b) => (b.puntos || 0) - (a.puntos || 0));

    // 🏆 Rellenar la tabla con top 10
    for (let i = 0; i < 10; i++) {
      const fila = document.createElement("tr");
      const pos = document.createElement("td");
      const nombre = document.createElement("td");
      const puntos = document.createElement("td");

      pos.classList.add("position");
      nombre.classList.add("player16");
      puntos.classList.add("record");

      pos.textContent = `${i + 1}.`;

      if (puntuaciones[i]) {
        nombre.textContent = puntuaciones[i].nombre;
        puntos.textContent = puntuaciones[i].puntos;
      } else {
        nombre.textContent = "---";
        puntos.textContent = "--";
      }

      fila.appendChild(pos);
      fila.appendChild(nombre);
      fila.appendChild(puntos);
      tabla.appendChild(fila);
    }
  }

  cargarPuntuaciones();

  // 🗑️ Botón para reiniciar puntuaciones locales
  const btnReset = document.createElement("button");
  btnReset.textContent = "Borrar Puntuaciones (local)";
  btnReset.id = "btnReset";
  btnReset.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas borrar las puntuaciones locales?")) {
      localStorage.removeItem("puntuaciones");
      location.reload();
    }
  });
  document.getElementById("idRecordTable").appendChild(btnReset);
});
