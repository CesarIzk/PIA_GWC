document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.querySelector("table");
  const puntuaciones = JSON.parse(localStorage.getItem("puntuaciones")) || [];

  // Elimina filas previas (excepto encabezado)
  const filas = tabla.querySelectorAll("tr");
  filas.forEach((fila, i) => {
    if (i > 0) fila.remove();
  });

  // Rellena hasta 10 posiciones
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
});
