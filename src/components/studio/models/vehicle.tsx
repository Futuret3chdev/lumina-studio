import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

function Wheel({
  position,
  radius,
  width,
  chrome,
}: {
  position: [number, number, number];
  radius: number;
  width: number;
  chrome: string;
}) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow name="Tire">
        <cylinderGeometry args={[radius, radius, width, 22]} />
        <meshStandardMaterial color="#141416" roughness={0.78} metalness={0.15} />
      </mesh>
      <mesh name="Rim">
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, width + 0.02, 16]} />
        <meshStandardMaterial color={chrome} roughness={0.28} metalness={0.92} />
      </mesh>
      <mesh name="Hub">
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, width + 0.03, 12]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function Glass({
  args,
  position,
  rotation,
}: {
  args: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} name="Glass">
      <planeGeometry args={args} />
      <meshStandardMaterial
        color="#9ec5d8"
        metalness={0.85}
        roughness={0.08}
        transparent
        opacity={0.42}
        envMapIntensity={1.4}
        side={DoubleSide}
      />
    </mesh>
  );
}

export function VehicleMesh({
  kind,
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const length = n(params, "length");
  const width = n(params, "width");
  const height = n(params, "height");
  const ride = n(params, "ride");
  const wheel = n(params, "wheel");

  const isSports = kind === "sports-car";
  const isSuv = kind === "suv";
  const isPickup = kind === "pickup";
  const isVan = kind === "van";

  const L = (isSports ? 2.55 : isPickup ? 2.9 : isVan ? 2.7 : 2.7) * length;
  const W = (isSuv || isVan ? 1.22 : 1.16) * width;
  const bodyH = (isSports ? 0.32 : isSuv ? 0.5 : isVan ? 0.72 : 0.38) * height;
  const wr = (isSports ? 0.3 : isSuv ? 0.34 : 0.3) * wheel;
  const yBody = wr + 0.1 * ride;
  const cabinH = isSports ? 0.34 : isVan ? 0.42 : isSuv ? 0.46 : 0.4;
  const cabinL = isSports ? L * 0.42 : isPickup ? L * 0.38 : isVan ? L * 0.72 : L * 0.5;
  const cabinX = isSports ? -0.08 : isPickup ? -L * 0.22 : isVan ? 0.05 : -0.05;
  const wheelX = L * 0.32;
  const wheelZ = W * 0.5;
  const chrome = "#c5c8ce";

  return (
    <group scale={scale}>
      <RoundedBox
        args={[L * 0.92, bodyH, W]}
        radius={0.07}
        smoothness={4}
        position={[0, yBody + bodyH / 2, 0]}
        castShadow
        receiveShadow
        name="Body"
      >
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </RoundedBox>

      <RoundedBox
        args={[L * 0.28, bodyH * 0.72, W * 0.92]}
        radius={0.05}
        smoothness={3}
        position={[L * 0.38, yBody + bodyH * 0.42, 0]}
        castShadow
        name="Nose"
      >
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </RoundedBox>

      {!isPickup && (
        <RoundedBox
          args={[cabinL, cabinH, W * 0.9]}
          radius={0.06}
          smoothness={4}
          position={[cabinX, yBody + bodyH + cabinH * 0.38, 0]}
          castShadow
          name="Cabin"
        >
          <Surface color={accentColor} metalness={Math.min(1, metalness + 0.1)} roughness={0.22} />
        </RoundedBox>
      )}

      {isPickup && (
        <>
          <RoundedBox
            args={[cabinL, cabinH, W * 0.9]}
            radius={0.05}
            smoothness={3}
            position={[cabinX, yBody + bodyH + cabinH * 0.35, 0]}
            castShadow
            name="Cab"
          >
            <Surface color={accentColor} metalness={metalness} roughness={0.28} />
          </RoundedBox>
          <RoundedBox
            args={[L * 0.38, bodyH * 0.55, W * 0.88]}
            radius={0.04}
            smoothness={3}
            position={[L * 0.22, yBody + bodyH * 0.7, 0]}
            castShadow
            name="Bed"
          >
            <Surface color={accentColor} metalness={0.2} roughness={0.7} />
          </RoundedBox>
        </>
      )}

      <mesh
        position={[L * 0.46, yBody + bodyH * 0.55, 0]}
        name="Grille"
      >
        <boxGeometry args={[0.08, bodyH * 0.42, W * 0.55]} />
        <meshStandardMaterial color="#111113" metalness={0.7} roughness={0.35} />
      </mesh>

      <mesh position={[L * 0.47, yBody + bodyH * 0.58, W * 0.28]} name="HeadlightL">
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#f8f4e8"
          emissive="#fff6d6"
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[L * 0.47, yBody + bodyH * 0.58, -W * 0.28]} name="HeadlightR">
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#f8f4e8"
          emissive="#fff6d6"
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-L * 0.46, yBody + bodyH * 0.55, W * 0.28]} name="TaillightL">
        <boxGeometry args={[0.05, 0.08, 0.22]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-L * 0.46, yBody + bodyH * 0.55, -W * 0.28]} name="TaillightR">
        <boxGeometry args={[0.05, 0.08, 0.22]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.9} />
      </mesh>

      <Glass
        args={[cabinL * 0.7, cabinH * 0.72]}
        position={[cabinX + (isSports ? 0.22 : 0.18), yBody + bodyH + cabinH * 0.42, W * 0.46]}
        rotation={[0, 0, 0]}
      />
      <Glass
        args={[cabinL * 0.7, cabinH * 0.72]}
        position={[cabinX + (isSports ? 0.22 : 0.18), yBody + bodyH + cabinH * 0.42, -W * 0.46]}
        rotation={[0, Math.PI, 0]}
      />
      <Glass
        args={[W * 0.72, cabinH * 0.7]}
        position={[cabinX + cabinL * 0.42, yBody + bodyH + cabinH * 0.4, 0]}
        rotation={[0, Math.PI / 2, -0.45]}
      />

      {isSports && (
        <RoundedBox
          args={[0.18, 0.06, W * 0.72]}
          radius={0.02}
          smoothness={2}
          position={[-L * 0.42, yBody + bodyH + 0.28, 0]}
          castShadow
          name="Spoiler"
        >
          <Surface color={accentColor} metalness={metalness} roughness={roughness} />
        </RoundedBox>
      )}

      {isSuv && (
        <>
          <mesh position={[0.1, yBody + bodyH + cabinH + 0.02, W * 0.28]} name="RailL">
            <boxGeometry args={[L * 0.45, 0.03, 0.04]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.1, yBody + bodyH + cabinH + 0.02, -W * 0.28]} name="RailR">
            <boxGeometry args={[L * 0.45, 0.03, 0.04]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.8} roughness={0.3} />
          </mesh>
        </>
      )}

      <Wheel position={[wheelX, wr, wheelZ]} radius={wr} width={0.2} chrome={chrome} />
      <Wheel position={[wheelX, wr, -wheelZ]} radius={wr} width={0.2} chrome={chrome} />
      <Wheel position={[-wheelX, wr, wheelZ]} radius={wr} width={0.2} chrome={chrome} />
      <Wheel position={[-wheelX, wr, -wheelZ]} radius={wr} width={0.2} chrome={chrome} />
    </group>
  );
}
