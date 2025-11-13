// gameplay/objectSpawner.js
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { getAssetPath } from "../core/pathManager.js";

const textureLoader = new THREE.TextureLoader();
const comidaModelos = [
  "ajo", "banana", "bellota", "calabaza",
  "cebolla", "cereza", "chayote", "chicharos"
];

export function crearObjeto(scene, objetos, config, debugVisible) {
  const loader = new FBXLoader();
  // Si el modo es "survival", solo lanzar bombas
const esBomba = config.modo === "survival" ? true : Math.random() < config.probBomba;


  const nombre = esBomba
    ? "bomba"
    : comidaModelos[Math.floor(Math.random() * comidaModelos.length)];

  const rutaModelo = getAssetPath(
    esBomba ? "Assets/bomb/source/bomb.fbx" : `Assets/comida/${nombre}.fbx`
  );

  const rutaTextura = getAssetPath(`Assets/comida/${nombre}.png`);

  loader.load(
    rutaModelo,
    (objeto) => {
      // === Texturizado ===
      if (!esBomba) {
        const textura = textureLoader.load(rutaTextura);
        objeto.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: textura,
              roughness: 0.4,
              metalness: 0.1,
            });
            child.castShadow = child.receiveShadow = true;
          }
        });
      } else {
        objeto.traverse((child) => {
          if (child.isMesh) child.castShadow = child.receiveShadow = true;
        });
      }

      // === Posición ===
      const rangoX = 10;
      const posX = (Math.random() - 0.5) * 4;
      const posY = 10 + Math.random() * 3;
      const posZ = 2;

      objeto.scale.setScalar(esBomba ? 0.01 : 0.016);
      objeto.position.set(posX, posY, posZ);

      // === Movimiento inicial ===
      if (esBomba) {
        const direccion = new THREE.Vector3(
          -Math.sign(posX) * (0.02 + Math.random() * 0.03),
          -0.05 - Math.random() * 0.05,
          0
        );
        objeto.userData.velocidad = direccion;
      }

      // === Metadatos ===
      objeto.userData = { esBomba, colisionado: false, tiempoDeVida: 0 };

      // === Debug ===
      const color = esBomba ? 0xff3333 : 0x33ff99;
      const helper = new THREE.Box3Helper(
        new THREE.Box3().setFromObject(objeto),
        color
      );
      helper.visible = debugVisible;
      helper.userData.isDebugHelper = true;
      objeto.userData.debugBox = helper;

      // === Añadir ===
      scene.add(helper);
      scene.add(objeto);
      objetos.push(objeto);

      console.log(`🍎 Objeto creado: ${nombre} (${esBomba ? "bomba" : "fruta"})`);
    },
    undefined,
    (err) => console.error("⚠️ Error al cargar modelo:", rutaModelo, err)
  );
}
