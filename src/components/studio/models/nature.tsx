import type { MeshViewProps } from "@/lib/studio/types";
import { mulberry32, n, Surface } from "./shared";

function LeafBlob({
  position,
  radius,
  color,
  scaleY = 1,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  scaleY?: number;
}) {
  return (
    <mesh position={position} scale={[1, scaleY, 1]} castShadow name="Foliage">
      <icosahedronGeometry args={[radius, 0]} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0.02} flatShading />
    </mesh>
  );
}

export function NatureMesh({
  kind,
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const height = n(params, "height");
  const fullness = n(params, "fullness");
  const seed = n(params, "seed", 12);
  const rand = mulberry32(Math.floor(seed * 97));
  const bark = bodyColor;
  const leaf = accentColor;

  if (kind === "rock") {
    const s = 0.85 * height;
    return (
      <group scale={scale}>
        <mesh position={[0, 0.45 * s, 0]} rotation={[0.2, 0.4, 0.1]} castShadow name="RockA">
          <icosahedronGeometry args={[0.7 * s * fullness, 0]} />
          <Surface color={bark} metalness={0.08} roughness={0.9} />
        </mesh>
        <mesh position={[0.35 * s, 0.28 * s, 0.2 * s]} rotation={[0.5, -0.3, 0]} castShadow name="RockB">
          <dodecahedronGeometry args={[0.42 * s, 0]} />
          <Surface color={leaf} metalness={0.06} roughness={0.88} />
        </mesh>
        <mesh position={[-0.3 * s, 0.22 * s, -0.15 * s]} castShadow name="RockC">
          <icosahedronGeometry args={[0.32 * s, 0]} />
          <Surface color={bark} metalness={metalness * 0.2} roughness={Math.max(0.7, roughness)} />
        </mesh>
      </group>
    );
  }

  if (kind === "pine") {
    const h = 2.6 * height;
    const layers = 5;
    return (
      <group scale={scale}>
        <mesh position={[0, h * 0.28, 0]} castShadow name="Trunk">
          <cylinderGeometry args={[0.09, 0.14, h * 0.55, 8]} />
          <Surface color={bark} metalness={0.05} roughness={0.85} />
        </mesh>
        {Array.from({ length: layers }, (_, i) => {
          const t = i / (layers - 1);
          const y = 0.7 * height + t * (h - 0.85 * height);
          const r = (1.05 - t * 0.72) * 0.85 * fullness;
          return (
            <mesh key={i} position={[0, y, 0]} castShadow name={`Bough${i}`}>
              <coneGeometry args={[r, 0.85 - t * 0.2, 8]} />
              <meshStandardMaterial color={leaf} roughness={0.8} metalness={0.02} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (kind === "palm") {
    const h = 2.5 * height;
    const fronds = 8;
    return (
      <group scale={scale}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 0.18) * 0.08, 0.28 + i * (h / 6), 0]}
            rotation={[0, 0, i * 0.05]}
            castShadow
            name={`Trunk${i}`}
          >
            <cylinderGeometry args={[0.1 - i * 0.008, 0.13 - i * 0.008, h / 5.2, 8]} />
            <Surface color={bark} metalness={0.05} roughness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: fronds }, (_, i) => {
          const a = (i / fronds) * Math.PI * 2 + rand() * 0.2;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 0.12, h * 0.92, Math.cos(a) * 0.12]}
              rotation={[0.95, a, 0]}
              castShadow
              name={`Frond${i}`}
            >
              <boxGeometry args={[0.16 * fullness, 0.03, 1.15 * fullness]} />
              <meshStandardMaterial color={leaf} roughness={0.7} metalness={0.02} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (kind === "willow") {
    const h = 2.3 * height;
    return (
      <group scale={scale}>
        <mesh position={[0, h * 0.4, 0]} castShadow name="Trunk">
          <cylinderGeometry args={[0.1, 0.16, h * 0.8, 8]} />
          <Surface color={bark} metalness={0.05} roughness={0.86} />
        </mesh>
        <LeafBlob position={[0, h * 0.85, 0]} radius={0.55 * fullness} color={leaf} scaleY={0.7} />
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0.35, h * 0.55, 0]} rotation={[0.15, 0, 0.35]} name="Curtain">
                <cylinderGeometry args={[0.03, 0.05, 1.1 * height * fullness, 5]} />
                <meshStandardMaterial color={leaf} roughness={0.78} metalness={0.02} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  const h = 2.2 * height;
  const blobs = 7;
  return (
    <group scale={scale}>
      <mesh position={[0, h * 0.28, 0]} castShadow name="Trunk">
        <cylinderGeometry args={[0.11, 0.18, h * 0.55, 8]} />
        <Surface color={bark} metalness={0.05} roughness={0.88} />
      </mesh>
      {Array.from({ length: 3 }, (_, i) => {
        const a = (i / 3) * Math.PI * 2 + 0.3;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.18, h * 0.55, Math.cos(a) * 0.18]}
            rotation={[0.55, a, 0]}
            castShadow
            name={`Branch${i}`}
          >
            <cylinderGeometry args={[0.04, 0.07, 0.7, 6]} />
            <Surface color={bark} metalness={0.05} roughness={0.85} />
          </mesh>
        );
      })}
      {Array.from({ length: blobs }, (_, i) => {
        const a = (i / blobs) * Math.PI * 2;
        const r = 0.45 + rand() * 0.25;
        return (
          <LeafBlob
            key={i}
            position={[
              Math.sin(a) * 0.45 * fullness,
              h * 0.72 + rand() * 0.35,
              Math.cos(a) * 0.45 * fullness,
            ]}
            radius={r * 0.55 * fullness}
            color={leaf}
          />
        );
      })}
    </group>
  );
}
