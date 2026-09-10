import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, SRGBColorSpace, Texture, type Group } from "three";
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

function PhotoFigure({
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
  const root = useRef<Group>(null);
  const h = (pet ? 0.55 : AVIATOR_H) * height;
  const w = Math.min(h * (pet ? 1.15 : 0.72), h * Math.max(0.35, aspect));
  const motion = gaitFromParams(params);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const spd = motion.speed;
    if (spd < 0.05) {
      g.position.y = 0;
      g.rotation.y = 0;
      g.rotation.z = 0;
      return;
    }
    const t = state.clock.elapsedTime + phase;
    const step = Math.sin(t * spd);
    g.position.y = Math.abs(step) * motion.bob;
    g.rotation.y = step * motion.sway * 0.35;
  });

  return (
    <group ref={root} scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <planeGeometry args={[w, h]} />
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
      <PhotoFigure
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
