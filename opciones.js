import { reproducirMusica, detenerMusica } from "./core/audioManager.js";

// === sliders ===
const sliderMusic = document.getElementById("musicVolume");
const sliderSFX = document.getElementById("sfxVolume");

// Cargar valores guardados
sliderMusic.value = localStorage.getItem("musicVolume") ?? 0.5;
sliderSFX.value = localStorage.getItem("sfxVolume") ?? 1;

// Aplicar volumen inicial
reproducirMusica("Assets/musica/menu.mp3", sliderMusic.value);

// Guardar y aplicar cambios
sliderMusic.addEventListener("input", () => {
  localStorage.setItem("musicVolume", sliderMusic.value);
  reproducirMusica("Assets/musica/menu.mp3", sliderMusic.value);
});

sliderSFX.addEventListener("input", () => {
  localStorage.setItem("sfxVolume", sliderSFX.value);
});


// =========================
// 1. Cargar preferencias guardadas
// =========================
const checkboxSound = document.getElementById("checkboxSound");
const checkboxMusic = document.getElementById("checkboxMusic");

const soundEnabled = localStorage.getItem("soundEnabled");
const musicEnabled = localStorage.getItem("musicEnabled");

checkboxSound.checked = soundEnabled !== "false"; // default = encendido
checkboxMusic.checked = musicEnabled !== "false";

// =========================
// 2. Reproducir música del menú
// =========================
window.addEventListener("click", () => {
  if (checkboxMusic.checked) {
    reproducirMusica("Assets/musica/menu.mp3", 0.4);
  }
}, { once: true });

// =========================
// 3. Manejar interruptor de sonido
// =========================
checkboxSound.addEventListener("change", () => {
  localStorage.setItem("soundEnabled", checkboxSound.checked);
});

// =========================
// 4. Manejar interruptor de música
// =========================
checkboxMusic.addEventListener("change", () => {
  localStorage.setItem("musicEnabled", checkboxMusic.checked);

  if (checkboxMusic.checked) {
    reproducirMusica("Assets/musica/menu.mp3", 0.4);
  } else {
    detenerMusica();
  }
});
