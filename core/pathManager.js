// ================================================
// 🧭 pathManager.js
// Devuelve rutas absolutas según desde dónde se ejecute el juego
// (modo solo desde raíz o modo multijugador dentro de /multiplayer/)
// ================================================

export function getAssetPath(subruta) {
  // Detecta si estamos ejecutando desde una subcarpeta de multijugador
  const isMultiplayer = window.location.pathname.includes("/multiplayer/");

  // Ajusta la ruta base
  const base = isMultiplayer ? "../../" : "./";

  // Retorna la ruta final unificada
  return base + subruta;
}