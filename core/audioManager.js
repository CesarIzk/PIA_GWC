let musica = null;

export function reproducirMusica(src, volumen = 0.5) {

  if (localStorage.getItem("musicEnabled") === "false") return;

  const vol = Number(localStorage.getItem("musicVolume") ?? volumen);

  if (musica && musica.src.includes(src)) {
    musica.volume = vol;
    musica.play();
    return;
  }

  musica = new Audio(src);
  musica.loop = true;
  musica.volume = vol;

  musica.play().catch(() => {
    console.warn("⚠️ Interacción requerida.");
  });
}

export function detenerMusica() {
  if (musica) musica.pause();
}

export function reproducirSFX(ruta, volumen = 1) {
  if (localStorage.getItem("soundEnabled") === "false") return;

  const vol = Number(localStorage.getItem("sfxVolume") ?? volumen);

  const audio = new Audio(ruta);
  audio.volume = vol;
  audio.play();
}
