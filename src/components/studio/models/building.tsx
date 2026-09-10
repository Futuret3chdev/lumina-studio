import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DoubleSide } from "three";
import { useStudio } from "@/lib/studio/store";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

function GableRoof({
  width,
  depth,
  rise,
  color,
  metalness,
  roughness,
}: {
  width: number;
  depth: number;
  rise: number;
  color: string;
  metalness: number;
  roughness: number;
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [width, depth, rise]);

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh geometry={geom} castShadow name="Roof">
      <Surface color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function Pane({
  position,
  w,
  h,
  lit,
  rotY = 0,
}: {
  position: [number, number, number];
  w: number;
  h: number;
  lit: boolean;
  rotY?: number;
}) {
  return (
    <mesh position={position} rotation={[0, rotY, 0]} name="Window">
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        color={lit ? "#fde7c2" : "#8eb8c9"}
        emissive={lit ? "#fbbf24" : "#0b1c24"}
        emissiveIntensity={lit ? 0.85 : 0.08}
        metalness={0.7}
        roughness={0.12}
        transparent
        opacity={0.78}
        side={DoubleSide}
      />
    </mesh>
  );
}

export function BuildingMesh({
  kind,
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
}: MeshViewProps) {
  const env = useStudio((s) => s.env);
  const lit = env === "night" || env === "sunset";
  const width = n(params, "width");
  const depth = n(params, "depth");
  const stories = n(params, "stories");
  const roof = n(params, "roof");

  if (kind === "modern-house") {
    const w = 2.4 * width;
    const d = 1.8 * depth;
    const h = 1.35 * stories;
    const wingW = 1.35 * width;
    const overhang = 0.18 * roof;
    return (
      <group scale={scale}>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow name="VolumeA">
          <boxGeometry args={[w, h, d]} />
          <Surface color={bodyColor} metalness={metalness * 0.4} roughness={Math.max(0.35, roughness)} />
        </mesh>
        <mesh
          position={[w * 0.28, (h * 0.72) / 2, d * 0.42]}
          castShadow
          name="VolumeB"
        >
          <boxGeometry args={[wingW, h * 0.72, d * 0.7]} />
          <Surface color={accentColor} metalness={metalness * 0.3} roughness={0.55} />
        </mesh>
        <mesh position={[0, h + 0.04, 0]} castShadow name="RoofSlab">
          <boxGeometry args={[w + overhang * 2, 0.08, d + overhang * 2]} />
          <Surface color={accentColor} metalness={0.35} roughness={0.5} />
        </mesh>
        <Pane position={[0, h * 0.55, d / 2 + 0.01]} w={w * 0.7} h={h * 0.42} lit={lit} />
        <Pane
          position={[w / 2 + 0.01, h * 0.5, 0]}
          w={d * 0.45}
          h={h * 0.38}
          lit={lit}
          rotY={Math.PI / 2}
        />
        <mesh position={[-w * 0.32, 0.45, d / 2 + 0.02]} name="Door">
          <boxGeometry args={[0.38, 0.9, 0.06]} />
          <Surface color={accentColor} metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (kind === "tower") {
    const base = 1.15 * width;
    const h = 2.6 * stories;
    return (
      <group scale={scale}>
        <mesh position={[0, h * 0.22, 0]} castShadow name="Keep">
          <boxGeometry args={[base, h * 0.44, base]} />
          <Surface color={bodyColor} metalness={0.1} roughness={0.8} />
        </mesh>
        <mesh position={[0, h * 0.55, 0]} castShadow name="Mid">
          <boxGeometry args={[base * 0.82, h * 0.28, base * 0.82]} />
          <Surface color={bodyColor} metalness={0.1} roughness={0.78} />
        </mesh>
        <mesh position={[0, h * 0.78, 0]} castShadow name="Upper">
          <boxGeometry args={[base * 0.64, h * 0.22, base * 0.64]} />
          <Surface color={accentColor} metalness={0.15} roughness={0.7} />
        </mesh>
        <mesh position={[0, h * 0.98, 0]} rotation={[0, Math.PI / 4, 0]} castShadow name="Cap">
          <coneGeometry args={[base * 0.52 * roof, 0.55 * roof, 4]} />
          <Surface color={accentColor} metalness={0.25} roughness={0.45} />
        </mesh>
        <Pane position={[0, h * 0.55, base * 0.41 + 0.01]} w={0.28} h={0.36} lit={lit} />
        <Pane position={[0, h * 0.78, base * 0.32 + 0.01]} w={0.22} h={0.28} lit={lit} />
      </group>
    );
  }

  if (kind === "shop") {
    const w = 2.3 * width;
    const d = 1.6 * depth;
    const h = 1.5 * stories;
    return (
      <group scale={scale}>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow name="ShopBody">
          <boxGeometry args={[w, h, d]} />
          <Surface color={bodyColor} metalness={0.15} roughness={0.7} />
        </mesh>
        <mesh position={[0, h + 0.06, 0]} name="Cornice">
          <boxGeometry args={[w + 0.08, 0.12, d + 0.08]} />
          <Surface color={accentColor} metalness={0.2} roughness={0.55} />
        </mesh>
        <mesh
          position={[0, 1.15, d / 2 + 0.16]}
          rotation={[-0.35, 0, 0]}
          castShadow
          name="Awning"
        >
          <boxGeometry args={[w * 0.92, 0.05, 0.55 * roof]} />
          <Surface color={accentColor} metalness={0.1} roughness={0.65} />
        </mesh>
        <Pane position={[0, 0.72, d / 2 + 0.01]} w={w * 0.72} h={0.85} lit={lit} />
        <mesh position={[-w * 0.38, 0.5, d / 2 + 0.02]} name="ShopDoor">
          <boxGeometry args={[0.42, 1, 0.05]} />
          <Surface color={accentColor} metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  const w = (kind === "cabin" ? 2.2 : 2.1) * width;
  const d = (kind === "cabin" ? 1.7 : 1.55) * depth;
  const h = 1.2 * stories;
  const rise = 0.85 * roof;
  const wallColor = bodyColor;
  const roofColor = accentColor;

  return (
    <group scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow name="Walls">
        <boxGeometry args={[w, h, d]} />
        <Surface color={wallColor} metalness={0.08} roughness={Math.max(0.45, roughness)} />
      </mesh>
      <group position={[0, h, 0]}>
        <GableRoof
          width={w + 0.12}
          depth={d + 0.12}
          rise={rise}
          color={roofColor}
          metalness={0.15}
          roughness={0.55}
        />
      </group>
      {kind !== "cabin" && (
        <mesh position={[w * 0.28, h + rise * 0.35, 0]} castShadow name="Chimney">
          <boxGeometry args={[0.22, 0.7, 0.22]} />
          <Surface color={accentColor} metalness={0.1} roughness={0.8} />
        </mesh>
      )}
      {kind === "cabin" && (
        <mesh position={[0, 0.08, d / 2 + 0.28]} receiveShadow name="Porch">
          <boxGeometry args={[w * 0.7, 0.08, 0.55]} />
          <Surface color={accentColor} metalness={0.05} roughness={0.75} />
        </mesh>
      )}
      <mesh position={[0, 0.48, d / 2 + 0.02]} name="Door">
        <boxGeometry args={[0.4, 0.95, 0.06]} />
        <Surface color={accentColor} metalness={0.12} roughness={0.6} />
      </mesh>
      <Pane position={[-w * 0.28, 0.75, d / 2 + 0.01]} w={0.38} h={0.38} lit={lit} />
      <Pane position={[w * 0.28, 0.75, d / 2 + 0.01]} w={0.38} h={0.38} lit={lit} />
      <Pane
        position={[w / 2 + 0.01, 0.75, 0]}
        w={0.36}
        h={0.36}
        lit={lit}
        rotY={Math.PI / 2}
      />
    </group>
  );
}
