import { DoubleSide } from "three";
import type { WorldSceneId } from "@/lib/studio/types";
import { Surface } from "./shared";

function Room() {
  const w = 10;
  const d = 8;
  const h = 3.15;
  const t = 0.12;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow name="Floor">
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#c4b7a4" roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#8a3a32" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} receiveShadow castShadow name="WallBack">
        <boxGeometry args={[w, h, t]} />
        <Surface color="#ece7df" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow castShadow name="WallLeft">
        <boxGeometry args={[t, h, d]} />
        <Surface color="#e7e1d8" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} receiveShadow castShadow name="WallRight">
        <boxGeometry args={[t, h, d]} />
        <Surface color="#e7e1d8" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[-2.6, h / 2, d / 2]} receiveShadow castShadow>
        <boxGeometry args={[4.8, h, t]} />
        <Surface color="#ece7df" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[3.15, h / 2, d / 2]} receiveShadow castShadow>
        <boxGeometry args={[3.7, h, t]} />
        <Surface color="#ece7df" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[0.7, h - 0.35, d / 2]} receiveShadow>
        <boxGeometry args={[1.5, 0.7, t]} />
        <Surface color="#ece7df" metalness={0.04} roughness={0.88} />
      </mesh>
      <mesh position={[0, h + 0.04, 0]} receiveShadow>
        <boxGeometry args={[w + 0.2, 0.08, d + 0.2]} />
        <Surface color="#f4f1ea" metalness={0.05} roughness={0.9} />
      </mesh>
      <mesh position={[-w / 2 + 0.08, 1.7, -0.4]} name="Window">
        <planeGeometry args={[1.6, 1.2]} />
        <meshStandardMaterial
          color="#cfe4f2"
          emissive="#fde7c2"
          emissiveIntensity={0.35}
          metalness={0.2}
          roughness={0.2}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[-w / 2 + 0.06, 0.08, 0]} receiveShadow>
        <boxGeometry args={[0.08, 0.16, d]} />
        <Surface color="#5c4033" metalness={0.08} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Lot() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#6b7a52" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[5.2, 48]} />
        <meshStandardMaterial color="#b7b0a4" roughness={0.88} metalness={0.05} />
      </mesh>
    </group>
  );
}

function Garden() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#5f7348" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[2.2, 12]} />
        <meshStandardMaterial color="#c4b496" roughness={0.85} metalness={0.04} />
      </mesh>
      {([-7, 7] as const).map((x) =>
        [-6, 0, 6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.55, z]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 1.1, 6]} />
            <Surface color="#4a3428" metalness={0.05} roughness={0.8} />
          </mesh>
        )),
      )}
      {([-7, 7] as const).map((x) =>
        [-6, 0, 6].map((z) => (
          <mesh key={`c${x}-${z}`} position={[x, 1.45, z]} castShadow>
            <sphereGeometry args={[0.7, 10, 8]} />
            <Surface color="#3f5c34" metalness={0} roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function WorldSet({ scene }: { scene: WorldSceneId }) {
  if (scene === "lot") return <Lot />;
  if (scene === "garden") return <Garden />;
  return <Room />;
}

export function WorldFloor({
  scene,
  onPlace,
}: {
  scene: WorldSceneId;
  onPlace: (x: number, z: number) => void;
}) {
  const w = scene === "house" ? 10 : 22;
  const d = scene === "house" ? 8 : 22;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPlace(e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
