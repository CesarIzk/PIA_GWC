// ===============================
// 🔸 BOTONES DE MODO DE JUEGO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const btnLocal = document.getElementById("btnLocal");
  const btnLAN = document.getElementById("btnLAN");
  const btnOnline = document.getElementById("btnOnline");

  if (btnLocal) {
    btnLocal.addEventListener("click", () => {
      window.location.href = "multiplayer/local/localHUD.html"
    });
  }

  

  if (btnOnline) {
    btnOnline.addEventListener("click", () => {
      window.location.href = "multiplayer/public/publicHUD.html"; // Modo online
    });
  }
});
