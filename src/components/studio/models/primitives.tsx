import { RoundedBox } from "@react-three/drei";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

export function PrimitiveMesh({
  kind,
  params,
  bodyColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const x = n(params, "sizeX");
  const y = n(params, "sizeY");
  const z = n(params, "sizeZ");

  if (kind === "box") {
    return (
      <RoundedBox
        args={[1.2 * x, 1.2 * y, 1.2 * z]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.6 * y, 0]}
        castShadow
        receiveShadow
        name="Box"
        scale={scale}
      >
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </RoundedBox>
    );
  }

  if (kind === "sphere") {
    const r = 0.7 * x;
    return (
      <mesh position={[0, r, 0]} castShadow receiveShadow name="Sphere" scale={scale}>
        <sphereGeometry args={[r, 32, 24]} />
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </mesh>
    );
  }

  if (kind === "cylinder") {
    const r = 0.45 * x;
    const h = 1.3 * y;
    return (
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow name="Cylinder" scale={scale}>
        <cylinderGeometry args={[r, r, h, 28]} />
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </mesh>
    );
  }

  if (kind === "torus") {
    const r = 0.55 * x;
    const tube = 0.18 * y;
    return (
      <mesh
        position={[0, r + tube, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
        name="Torus"
        scale={scale}
      >
        <torusGeometry args={[r, tube, 16, 40]} />
        <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
      </mesh>
    );
  }

  const r = 0.32 * x;
  const h = 1.1 * y;
  return (
    <mesh position={[0, h / 2 + r * 0.15, 0]} castShadow receiveShadow name="Capsule" scale={scale}>
      <capsuleGeometry args={[r, h, 8, 16]} />
      <Surface color={bodyColor} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}
