import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

function Leg({
  position,
  h,
  color,
  metalness,
  roughness,
}: {
  position: [number, number, number];
  h: number;
  color: string;
  metalness: number;
  roughness: number;
}) {
  return (
    <mesh position={position} castShadow name="Leg">
      <cylinderGeometry args={[0.035, 0.04, h, 8]} />
      <Surface color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

export function FurnitureMesh({
  kind,
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const width = n(params, "width");
  const depth = n(params, "depth");
  const height = n(params, "height");

  if (kind === "chair") {
    const w = 0.7 * width;
    const d = 0.7 * depth;
    const seat = 0.46;
    const back = 0.9 * height;
    return (
      <group scale={scale}>
        <RoundedBox args={[w, 0.07, d]} radius={0.03} position={[0, seat, 0]} castShadow name="Seat">
          <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
        </RoundedBox>
        <RoundedBox
          args={[w, back, 0.07]}
          radius={0.03}
          position={[0, seat + back / 2, -d / 2 + 0.03]}
          castShadow
          name="Back"
        >
          <Surface color={accentColor} metalness={metalness} roughness={roughness} />
        </RoundedBox>
        <Leg position={[w / 2 - 0.06, seat / 2, d / 2 - 0.06]} h={seat} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[-w / 2 + 0.06, seat / 2, d / 2 - 0.06]} h={seat} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[w / 2 - 0.06, seat / 2, -d / 2 + 0.06]} h={seat} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[-w / 2 + 0.06, seat / 2, -d / 2 + 0.06]} h={seat} color={accentColor} metalness={metalness} roughness={roughness} />
      </group>
    );
  }

  if (kind === "table") {
    const w = 1.7 * width;
    const d = 0.95 * depth;
    const h = 0.75 * height;
    return (
      <group scale={scale}>
        <RoundedBox args={[w, 0.07, d]} radius={0.03} position={[0, h, 0]} castShadow receiveShadow name="Top">
          <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
        </RoundedBox>
        <Leg position={[w / 2 - 0.1, h / 2, d / 2 - 0.1]} h={h} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[-w / 2 + 0.1, h / 2, d / 2 - 0.1]} h={h} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[w / 2 - 0.1, h / 2, -d / 2 + 0.1]} h={h} color={accentColor} metalness={metalness} roughness={roughness} />
        <Leg position={[-w / 2 + 0.1, h / 2, -d / 2 + 0.1]} h={h} color={accentColor} metalness={metalness} roughness={roughness} />
      </group>
    );
  }

  if (kind === "sofa") {
    const w = 2.1 * width;
    const d = 0.9 * depth;
    const backH = 0.7 * height;
    return (
      <group scale={scale}>
        <RoundedBox args={[w, 0.28, d]} radius={0.08} position={[0, 0.28, 0]} castShadow name="Base">
          <Surface color={bodyColor} metalness={0.05} roughness={Math.max(0.55, roughness)} />
        </RoundedBox>
        <RoundedBox
          args={[w, backH, 0.22]}
          radius={0.08}
          position={[0, 0.42 + backH / 2, -d / 2 + 0.12]}
          castShadow
          name="SofaBack"
        >
          <Surface color={bodyColor} metalness={0.05} roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.42, d * 0.9]} radius={0.07} position={[w / 2 - 0.08, 0.5, 0.02]} castShadow name="ArmL">
          <Surface color={accentColor} metalness={0.05} roughness={0.68} />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.42, d * 0.9]} radius={0.07} position={[-w / 2 + 0.08, 0.5, 0.02]} castShadow name="ArmR">
          <Surface color={accentColor} metalness={0.05} roughness={0.68} />
        </RoundedBox>
        {[-0.55, 0, 0.55].map((x) => (
          <RoundedBox
            key={x}
            args={[w * 0.28, 0.1, d * 0.55]}
            radius={0.04}
            position={[x * width, 0.48, 0.08]}
            name="Cushion"
          >
            <Surface color={accentColor} metalness={0.04} roughness={0.75} />
          </RoundedBox>
        ))}
      </group>
    );
  }

  if (kind === "lamp") {
    const h = 1.8 * height;
    const shade = 0.35 * width;
    return (
      <group scale={scale}>
        <mesh position={[0, 0.04, 0]} name="LampBase">
          <cylinderGeometry args={[0.18 * depth, 0.22 * depth, 0.08, 20]} />
          <Surface color={accentColor} metalness={Math.max(0.4, metalness)} roughness={0.35} />
        </mesh>
        <mesh position={[0, h * 0.45, 0]} name="Stem">
          <cylinderGeometry args={[0.03, 0.03, h * 0.9, 10]} />
          <Surface color={accentColor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, h * 0.92, 0]} name="Shade">
          <coneGeometry args={[shade, 0.38, 16, 1, true]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.7}
            metalness={0.05}
            side={DoubleSide}
            emissive="#f5e6c8"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh position={[0, h * 0.86, 0]} name="Bulb">
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#fff7e6" emissive="#ffe8b0" emissiveIntensity={1.6} />
        </mesh>
      </group>
    );
  }

  const w = 1.1 * width;
  const d = 0.38 * depth;
  const h = 1.7 * height;
  return (
    <group scale={scale}>
      <mesh position={[-w / 2, h / 2, 0]} castShadow name="SideL">
        <boxGeometry args={[0.06, h, d]} />
        <Surface color={accentColor} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} castShadow name="SideR">
        <boxGeometry args={[0.06, h, d]} />
        <Surface color={accentColor} metalness={metalness} roughness={roughness} />
      </mesh>
      {[0.08, 0.42, 0.78, 1.14, 1.5].map((y, i) => (
        <mesh key={i} position={[0, Math.min(y * height, h - 0.04), 0]} receiveShadow name={`Board${i}`}>
          <boxGeometry args={[w - 0.04, 0.05, d - 0.02]} />
          <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
        </mesh>
      ))}
    </group>
  );
}
