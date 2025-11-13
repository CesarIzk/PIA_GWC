// core/playerManager.js
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { getAssetPath } from "./pathManager.js";
const loader = new FBXLoader();

/**
 * 🔹 Carga una sola canasta (modo solitario)
 */
export async function loadPlayer(scene) {
  return new Promise((resolve, reject) => {
    loader.load(
      getAssetPath("Assets/basket2.fbx"),
      (fbx) => {
        fbx.scale.set(0.010, 0.010, 0.010);
        fbx.position.set(0, 2, 2);
        fbx.rotation.y = Math.PI;

        fbx.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(fbx);
        console.log("🏀 Canasta (jugador único) cargada correctamente.");
        resolve(fbx);
      },
      undefined,
      (err) => reject(`❌ Error cargando canasta: ${err}`)
    );
  });
}

/**
 * 🔹 Carga dos canastas con color diferente (modo multijugador)
 */
export async function loadPlayers(scene) {
  function loadBasket(x, colorHex) {
    return new Promise((resolve, reject) => {
      loader.load(
        getAssetPath("Assets/basket2.fbx"),
        (fbx) => {
          fbx.scale.set(0.010, 0.010, 0.010);
          fbx.position.set(0, 2, 2);
          fbx.rotation.y = Math.PI;

          fbx.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material?.color) {
                child.material.color.set(colorHex);
              }
            }
          });

          scene.add(fbx);
          resolve(fbx);
        },
        undefined,
        (err) => reject(`❌ Error cargando canasta multijugador: ${err}`)
      );
    });
  }

  const [player1, player2] = await Promise.all([
    loadBasket(-3, 0x00aaff), // Azul — Jugador 1
    loadBasket(3, 0xff6600),  // Naranja — Jugador 2
  ]);

  console.log("✅ Canastas multijugador cargadas correctamente.");
  return { player1, player2 };
}
