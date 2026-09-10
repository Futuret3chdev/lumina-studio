import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, SRGBColorSpace, Texture, type Group } from "three";
import { cutoutPerson } from "@/lib/studio/cutout";
import { npcLook, type NpcLook } from "@/lib/studio/npc-look";
import type { MeshViewProps } from "@/lib/studio/types";
import { gaitFromParams } from "@/lib/studio/walk";
import { AvatarMesh } from "./avatar";
import { NpcMesh } from "./npc";
import { n } from "./shared";

const AVIATOR_H = 1.62;

type CutState = {
  full: Texture;
  aspect: number;
  pet: boolean;
  look: NpcLook;
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
      const look = npcLook(result.canvas);
      setCut((prev) => {
        prev?.full.dispose();
        return { full, aspect: result.aspect, pet: result.pet, look };
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

function PhotoWalker({
  texture,
  aspect,
  scale,
  height,
  params,
}: {
  texture: Texture;
  aspect: number;
  scale: number;
  height: number;
  params: Record<string, number>;
}) {
  const root = useRef<Group>(null);
  const h = 0.55 * height;
  const w = Math.min(h * 1.15, h * Math.max(0.35, aspect));
  const motion = gaitFromParams(params);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    const spd = motion.speed;
    if (spd < 0.05) {
      g.position.y = 0;
      g.rotation.y = 0;
      return;
    }
    const step = Math.sin(t * spd);
    g.position.y = Math.abs(step) * motion.bob;
    g.rotation.y = step * motion.sway * 0.4;
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
    </group>
  );
}

export function PersonMesh(props: MeshViewProps) {
  const cut = useCutout(props.photoUrl);
  const height = n(props.params, "height", 1);

  if (cut?.pet) {
    return (
      <PhotoWalker
        texture={cut.full}
        aspect={cut.aspect}
        scale={props.scale}
        height={height}
        params={props.params}
      />
    );
  }

  if (cut) {
    return <NpcMesh look={cut.look} params={props.params} scale={props.scale} />;
  }

  return <AvatarMesh {...props} />;
}
