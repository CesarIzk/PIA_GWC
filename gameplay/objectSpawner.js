// ===================================================
// 🍎 objectSpawner.js — Creación sincronizable
// ===================================================

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { getAssetPath } from "../core/pathManager.js";

const textureLoader = new THREE.TextureLoader();
export const comidaModelos = [
  "ajo", "banana", "bellota", "calabaza",
  "cebolla", "cereza", "chayote", "chicharos"
];
/**
 * Crear objeto sincronizable.
 * RETORNA INMEDIATAMENTE un placeholder que se reemplaza cuando carga el modelo.
 * 
 * - En modo local/offline: elige el modelo aleatoriamente.
 * - En modo online: si se pasa forcedNombre, usa ese modelo exacto
 *   para que ambos jugadores vean la misma comida.
 */
export function crearObjeto(
  scene,
  objetos,
  config,
  debugVisible = false,
  forcedX = null,
  forcedBomba = null,
  forcedY = null,
  forcedVelX = null,
  forcedVelY = null,
  forcedId = null,
  forcedNombre = null       // ⬅️ NUEVO: forzar modelo concreto
) {
  const loader = new FBXLoader();

  // Opcional: evitar rutas internas de FBX (reduce problemas de texturas internas)
  loader.setResourcePath("");
  loader.setPath("");

  // === Tipo (bomba o comida) ===
  const esBomba = forcedBomba !== null
    ? forcedBomba
    : Math.random() < config.probBomba;

  // === Nombre de modelo ===
  // - Si viene forzado (desde el servidor), lo usamos tal cual.
  // - Si no, lo elegimos aleatoriamente (modo local / host).
  const nombre = esBomba
    ? "bomba"
    : (forcedNombre ?? comidaModelos[Math.floor(Math.random() * comidaModelos.length)]);

  // === Posición sincronizada ===
  const posX = forcedX ?? (Math.random() - 0.5) * 16;
  const posY = forcedY ?? (10 + Math.random() * 3);
  const velX = forcedVelX ?? (esBomba ? (-Math.sign(posX) * (0.015 + Math.random() * 0.025)) : 0);
  const velY = forcedVelY ?? (esBomba ? (-0.05 - Math.random() * 0.04) : 0);

  const rutaModelo = getAssetPath(
    esBomba ? "Assets/bomb/source/bomb.fbx" : `Assets/comida/${nombre}.fbx`
  );
  const rutaTextura = getAssetPath(`Assets/comida/${nombre}.png`);

  // 🟢 CREAR PLACEHOLDER INMEDIATO (invisible pero funcional)
  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({
      color: esBomba ? 0xff0000 : 0x00ff00,
      transparent: true,
      opacity: debugVisible ? 0.3 : 0 // invisible por defecto
    })
  );

  placeholder.position.set(posX, posY, 0);
  placeholder.userData.esBomba = esBomba;
  placeholder.userData.colisionado = false;
  placeholder.userData.loading = true;
  placeholder.userData.nombre = nombre;   // ⬅️ IMPORTANTE: guardar tipo
  placeholder.userData.id = forcedId ?? null;

  // Velocidad para bombas
  if (esBomba) {
    placeholder.userData.velocidad = new THREE.Vector3(velX, velY, 0);
  }

  // 🔥 AGREGAR INMEDIATAMENTE a la escena y array
  scene.add(placeholder);
  objetos.push(placeholder);

  // 🔄 Cargar modelo real en segundo plano
  loader.load(
    rutaModelo,
    (objeto) => {
      // Material (solo comida, la bomba puede usar lo que traiga su FBX)
      if (!esBomba) {
        const textura = textureLoader.load(rutaTextura);
        objeto.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: textura,
              roughness: 0.4,
              metalness: 0.1,
            });
            child.material.needsUpdate = true;
          }
        });
      }

      // Copiar propiedades del placeholder
      objeto.position.copy(placeholder.position);
      objeto.scale.setScalar(esBomba ? 0.01 : 0.016);

      objeto.userData = {
        ...placeholder.userData,
        loading: false
      };
// Caja de colisión fija para bombas (porque FBX es muy pequeño)
if (objeto.userData.esBomba) {
  objeto.userData.hitbox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 0, 0),  // relativo al objeto
    new THREE.Vector3(1.0, 1.0, 1.0)  // tamaño fijo para colisión
  );
}

      // 🔄 REEMPLAZAR placeholder en la escena
      scene.remove(placeholder);
      scene.add(objeto);

      // 🔄 REEMPLAZAR en el array
      const index = objetos.indexOf(placeholder);
      if (index !== -1) {
        objetos[index] = objeto;
      }
    },
    undefined,
    (error) => {
      console.error("❌ Error cargando objeto:", rutaModelo, error);
      // El placeholder sigue funcionando aunque falle la carga
      // (y mantiene id, nombre, esBomba, etc.)
    }
  );

  return placeholder;
}
