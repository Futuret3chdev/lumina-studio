import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

export function PropMesh({
  kind,
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const size = n(params, "size");
  const band = n(params, "band");

  if (kind === "crate") {
    const s = 0.9 * size;
    const t = 0.07 * band;
    return (
      <group scale={scale}>
        <RoundedBox args={[s, s, s]} radius={0.03} position={[0, s / 2, 0]} castShadow receiveShadow name="Crate">
          <Surface color={bodyColor} metalness={0.08} roughness={Math.max(0.55, roughness)} />
        </RoundedBox>
        {[
          [0, s - t / 2, 0, s + 0.01, t, s + 0.01],
          [0, t / 2, 0, s + 0.01, t, s + 0.01],
          [0, s / 2, s / 2, s + 0.01, t, t],
          [0, s / 2, -s / 2, s + 0.01, t, t],
        ].map((v, i) => (
          <mesh key={i} position={[v[0], v[1], v[2]]} name={`Band${i}`}>
            <boxGeometry args={[v[3], v[4], v[5]]} />
            <Surface color={accentColor} metalness={Math.max(0.35, metalness)} roughness={0.4} />
          </mesh>
        ))}
      </group>
    );
  }

  if (kind === "barrel") {
    const h = 1.15 * size;
    const r = 0.38 * size * band;
    return (
      <group scale={scale}>
        <mesh position={[0, h / 2, 0]} castShadow name="Barrel">
          <cylinderGeometry args={[r * 0.92, r * 0.92, h, 20]} />
          <Surface color={bodyColor} metalness={0.1} roughness={0.7} />
        </mesh>
        <mesh position={[0, h * 0.22, 0]} name="HoopLow">
          <torusGeometry args={[r * 0.94, 0.03, 8, 24]} />
          <Surface color={accentColor} metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, h * 0.78, 0]} name="HoopHigh">
          <torusGeometry args={[r * 0.94, 0.03, 8, 24]} />
          <Surface color={accentColor} metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, h * 0.5, 0]} name="HoopMid">
          <torusGeometry args={[r * 0.98, 0.025, 8, 24]} />
          <Surface color={accentColor} metalness={0.75} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (kind === "traffic-cone") {
    const h = 1.15 * size;
    return (
      <group scale={scale}>
        <mesh position={[0, 0.05, 0]} name="ConeBase">
          <boxGeometry args={[0.55 * size, 0.08, 0.55 * size]} />
          <Surface color={accentColor} metalness={0.1} roughness={0.6} />
        </mesh>
        <mesh position={[0, h * 0.52, 0]} castShadow name="Cone">
          <coneGeometry args={[0.28 * size, h, 16]} />
          <Surface color={bodyColor} metalness={0.08} roughness={0.45} />
        </mesh>
        <mesh position={[0, h * 0.45 * band, 0]} name="Stripe">
          <cylinderGeometry args={[0.2 * size, 0.23 * size, 0.1, 16]} />
          <meshStandardMaterial color="#f4f4f5" roughness={0.5} metalness={0.05} />
        </mesh>
      </group>
    );
  }

  if (kind === "hydrant") {
    const h = 1.15 * size;
    const r = 0.18 * band;
    return (
      <group scale={scale}>
        <mesh position={[0, 0.08, 0]} name="Flange">
          <cylinderGeometry args={[0.28 * size, 0.28 * size, 0.1, 16]} />
          <Surface color={accentColor} metalness={0.35} roughness={0.45} />
        </mesh>
        <mesh position={[0, h * 0.45, 0]} castShadow name="Body">
          <cylinderGeometry args={[r * size, r * 1.05 * size, h * 0.7, 16]} />
          <Surface color={bodyColor} metalness={Math.max(0.3, metalness)} roughness={0.4} />
        </mesh>
        <mesh position={[0, h * 0.82, 0]} name="Dome">
          <sphereGeometry args={[r * 0.95 * size, 16, 12]} />
          <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
        </mesh>
        <mesh position={[r * size + 0.08, h * 0.5, 0]} rotation={[0, 0, Math.PI / 2]} name="CapL">
          <cylinderGeometry args={[0.07, 0.07, 0.16, 10]} />
          <Surface color={accentColor} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-(r * size + 0.08), h * 0.5, 0]} rotation={[0, 0, Math.PI / 2]} name="CapR">
          <cylinderGeometry args={[0.07, 0.07, 0.16, 10]} />
          <Surface color={accentColor} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  const h = 1.2 * size;
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const y = t * h;
      const belly = 0.16 + Math.sin(t * Math.PI) * 0.18 * band;
      const lip = t > 0.88 ? 0.05 : 0;
      pts.push(new THREE.Vector2(belly + lip, y));
    }
    return pts;
  }, [h, band]);

  const lathe = useMemo(
    () => new THREE.LatheGeometry(points, 24),
    [points],
  );
  useEffect(() => () => lathe.dispose(), [lathe]);

  return (
    <group scale={scale}>
      <mesh geometry={lathe} castShadow receiveShadow name="Vase">
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  );
}
