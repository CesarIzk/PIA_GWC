import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import SpriteText from "../js/libs/three-spritetext.js";
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
        fbx.position.set(0, 2, 0);   // ⬅️ Z corregido
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
 * 🔹 Carga dos canastas con indicador flotante
 */
export async function loadPlayers(scene) {

function agregarEtiqueta(fbx, texto, color) {
  const label = new SpriteText(texto, 25, color);

  label.position.set(0, 250, 0);
  label.backgroundColor = "rgba(0,0,0,0.4)";
  label.padding = 6;

  // 🔥 ESCALADO REALISTA PARA TU ESCENA
  label.scale.set(170, 120, 150);

  fbx.add(label);
}



  function loadBasket(x, colorHex, etiqueta, colorEtiqueta) {
    return new Promise((resolve, reject) => {
      loader.load(
        getAssetPath("Assets/basket2.fbx"),
        (fbx) => {
          fbx.scale.set(0.010, 0.010, 0.010);
          fbx.position.set(x, 2, 0);  // ⬅️ Z corregido
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

          // ➕ Agregar etiqueta
          agregarEtiqueta(fbx, etiqueta, colorEtiqueta);

          scene.add(fbx);
          resolve(fbx);
        },
        undefined,
        (err) => reject(`❌ Error cargando canasta multijugador: ${err}`)
      );
    });
  }

  const [player1, player2] = await Promise.all([
    loadBasket(-3, 0x00aaff, "J1", "cyan"),
    loadBasket( 3, 0xff6600, "J2", "orange"),
  ]);

  console.log("✅ Canastas multijugador cargadas con etiquetas.");
  return { player1, player2 };
}
