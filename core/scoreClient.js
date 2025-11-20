// core/scoreClient.js
const API_SCORE_URL = "/api/score";  // 👈 ya no localhost:8081

export async function guardarPuntuacion(nombre, puntos, modo = "solo") {
  let almacenadas = JSON.parse(localStorage.getItem("puntuaciones")) || [];

  almacenadas.push({
    nombre,
    puntos,
    modo,
    fecha: new Date().toISOString(),
  });

  almacenadas.sort((a, b) => b.puntos - a.puntos);
  almacenadas = almacenadas.slice(0, 20);

  localStorage.setItem("puntuaciones", JSON.stringify(almacenadas));

  try {
    await fetch(API_SCORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, puntos, modo }),
    });
    console.log("✅ Puntuación enviada al servicio web");
  } catch (err) {
    console.error("❌ Error al enviar puntuación al servicio web:", err);
  }
}
