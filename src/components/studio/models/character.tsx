import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DoubleSide,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
  type Group,
  type Mesh,
} from "three";
import { cutoutPerson } from "@/lib/studio/cutout";
import type { MeshViewProps } from "@/lib/studio/types";
import { gaitFromParams } from "@/lib/studio/walk";
import { AvatarMesh } from "./avatar";
import { n } from "./shared";

const AVIATOR_H = 1.62;

type CutState = {
  full: Texture;
  aspect: number;
  pet: boolean;
};

function texFrom(canvas: HTMLCanvasElement) {
  const tex = new Texture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

function useCutout(url: string | null | undefined) {
  const [cut, setCut] = useState<CutState | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!url) {
      setCut(null);
      return;
    }
    let disposed = false;
    const img = new Image();
    if (url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed) return;
      const result = cutoutPerson(img, img.width || 1, img.height || 1);
      if (!result) {
        setCut(null);
        return;
      }
      const full = texFrom(result.canvas);
      setCut((prev) => {
        prev?.full.dispose();
        return { full, aspect: result.aspect, pet: result.pet };
      });
      invalidate();
    };
    img.onerror = () => {
      if (!disposed) setCut(null);
    };
    img.src = url;
    return () => {
      disposed = true;
    };
  }, [url, invalidate]);

  useEffect(
    () => () => {
      cut?.full.dispose();
    },
    [cut],
  );

  return cut;
}

function rot(
  x: number,
  y: number,
  ox: number,
  oy: number,
  a: number,
): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = x - ox;
  const dy = y - oy;
  return [ox + dx * c - dy * s, oy + dx * s + dy * c];
}

function PhotoWalker({
  texture,
  aspect,
  scale,
  height,
  pet,
  params,
}: {
  texture: Texture;
  aspect: number;
  scale: number;
  height: number;
  pet: boolean;
  params: Record<string, number>;
}) {
  const meshRef = useRef<Mesh>(null);
  const root = useRef<Group>(null);
  const rest = useRef<Float32Array | null>(null);
  const h = (pet ? 0.55 : AVIATOR_H) * height;
  const w = Math.min(h * (pet ? 1.15 : 0.72), h * Math.max(0.35, aspect));
  const motion = gaitFromParams(params);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  const geom = useMemo(() => {
    const g = new PlaneGeometry(w, h, 14, 22);
    g.translate(0, h / 2, 0);
    rest.current = Float32Array.from(g.attributes.position!.array as Float32Array);
    return g;
  }, [w, h]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const pos = mesh?.geometry.attributes.position;
    if (!mesh || !pos || !rest.current) return;
    const arr = pos.array as Float32Array;
    const src = rest.current;
    const t = state.clock.elapsedTime + phase;
    const spd = motion.speed;
    const wave = spd < 0.05 ? 0 : Math.sin(t * spd);
    const bob = Math.abs(wave) * motion.bob;

    if (root.current) root.current.position.y = bob;

    if (pet || spd < 0.05) {
      for (let i = 0; i < arr.length; i += 1) arr[i] = src[i]!;
      pos.needsUpdate = true;
      if (root.current) root.current.rotation.y = pet ? wave * motion.sway : 0;
      return;
    }

    const hipY = h * 0.5;
    const kneeY = h * 0.25;
    const shY = h * 0.74;
    const hipXL = -w * 0.08;
    const hipXR = w * 0.08;
    const shXL = -w * 0.18;
    const shXR = w * 0.18;
    const hipL = wave * motion.stride;
    const hipR = -wave * motion.stride;
    const kneeL = Math.max(0, -wave) * motion.stride * 0.95;
    const kneeR = Math.max(0, wave) * motion.stride * 0.95;
    const armL = -wave * motion.arms;
    const armR = wave * motion.arms;

    for (let i = 0; i < arr.length; i += 3) {
      let x = src[i]!;
      let y = src[i + 1]!;
      let z = src[i + 2]!;
      const u = x / w + 0.5;
      const v = y / h;

      if (v < 0.52 && u < 0.5) {
        [x, y] = rot(x, y, hipXL, hipY, hipL);
        if (v < 0.28) {
          const [kx, ky] = rot(hipXL, kneeY, hipXL, hipY, hipL);
          [x, y] = rot(x, y, kx, ky, kneeL);
        }
        z += wave * 0.035;
      } else if (v < 0.52 && u >= 0.5) {
        [x, y] = rot(x, y, hipXR, hipY, hipR);
        if (v < 0.28) {
          const [kx, ky] = rot(hipXR, kneeY, hipXR, hipY, hipR);
          [x, y] = rot(x, y, kx, ky, kneeR);
        }
        z -= wave * 0.035;
      } else if (v < 0.84 && v > 0.4 && u < 0.36) {
        [x, y] = rot(x, y, shXL, shY, armL);
        z -= wave * 0.05;
      } else if (v < 0.84 && v > 0.4 && u > 0.64) {
        [x, y] = rot(x, y, shXR, shY, armR);
        z += wave * 0.05;
      }

      arr[i] = x;
      arr[i + 1] = y;
      arr[i + 2] = z;
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={root} scale={scale}>
      <mesh ref={meshRef} geometry={geom} castShadow>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.12}
          roughness={0.62}
          metalness={0.04}
          side={DoubleSide}
          depthWrite
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16 + w * 0.12, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PersonMesh(props: MeshViewProps) {
  const cut = useCutout(props.photoUrl);
  const height = n(props.params, "height", 1);

  if (cut) {
    return (
      <PhotoWalker
        texture={cut.full}
        aspect={cut.aspect}
        scale={props.scale}
        height={height}
        pet={cut.pet}
        params={props.params}
      />
    );
  }

  return <AvatarMesh {...props} />;
}
