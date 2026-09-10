import { useEffect, useState } from "react";
import { Box3, Vector3, type Group, type Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Surface } from "./shared";

export function UploadedMesh({
  url,
  scale,
}: {
  url: string;
  scale: number;
}) {
  const [root, setRoot] = useState<Object3D | null>(null);

  useEffect(() => {
    let alive = true;
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (!alive) return;
        const scene = gltf.scene.clone(true);
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3());
        const max = Math.max(size.x, size.y, size.z, 0.001);
        scene.scale.multiplyScalar(1.7 / max);
        const fitted = new Box3().setFromObject(scene);
        scene.position.y -= fitted.min.y;
        scene.traverse((obj) => {
          const mesh = obj as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        setRoot(scene);
      },
      undefined,
      () => {
        if (alive) setRoot(null);
      },
    );
    return () => {
      alive = false;
    };
  }, [url]);

  if (!root) {
    return (
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <Surface color="#3f3f46" metalness={0.2} roughness={0.6} />
      </mesh>
    );
  }

  return (
    <group scale={scale}>
      <primitive object={root} />
    </group>
  );
}

export type { Group };
