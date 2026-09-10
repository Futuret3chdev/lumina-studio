import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide, SRGBColorSpace, type Group } from "three";
import { bakeGait } from "@/lib/studio/bake-gait";
import { cutoutPerson } from "@/lib/studio/cutout";
import { buildPuppet } from "@/lib/studio/puppet";
import type { MeshViewProps } from "@/lib/studio/types";
import { GAITS, gaitFromParams } from "@/lib/studio/walk";
import { AvatarMesh } from "./avatar";
import { n } from "./shared";

const AVIATOR_H = 1.62;

type Clip = {
  frames: HTMLCanvasElement[];
  fps: number;
};

type CutState = {
  clips: Record<string, Clip>;
  aspect: number;
  pet: boolean;
};

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
      const rig = result.pet ? null : buildPuppet(result.canvas, result.pet);
      const clips: Record<string, Clip> = {};
      for (const gait of GAITS) {
        const frames = bakeGait(result.canvas, rig, gait);
        clips[gait.id] = { frames, fps: Math.max(6, Math.round(gait.speed * 1.3)) };
      }
      setCut({ clips, aspect: result.aspect, pet: result.pet });
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

  return cut;
}

function PhotoGif({
  cut,
  scale,
  height,
  params,
}: {
  cut: CutState;
  scale: number;
  height: number;
  params: Record<string, number>;
}) {
  const root = useRef<Group>(null);
  const motion = gaitFromParams(params);
  const clip = cut.clips[motion.id] ?? cut.clips.walk ?? cut.clips.still;
  const tex = useMemo(() => {
    const t = new CanvasTexture(clip?.frames[0] ?? document.createElement("canvas"));
    t.colorSpace = SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [clip]);

  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((state) => {
    if (!clip?.frames.length) return;
    if (clip.frames.length === 1) {
      tex.image = clip.frames[0]!;
      tex.needsUpdate = true;
      return;
    }
    const i = Math.floor(state.clock.elapsedTime * clip.fps) % clip.frames.length;
    const frame = clip.frames[i];
    if (frame && tex.image !== frame) {
      tex.image = frame;
      tex.needsUpdate = true;
    }
  });

  const h = (cut.pet ? 0.55 : AVIATOR_H) * height;
  const w = Math.min(h * (cut.pet ? 1.15 : 0.62), h * Math.max(0.35, cut.aspect));

  return (
    <group ref={root} scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={tex}
          transparent
          alphaTest={0.08}
          roughness={0.62}
          metalness={0.04}
          side={DoubleSide}
          depthWrite
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16 + w * 0.1, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PersonMesh(props: MeshViewProps) {
  const cut = useCutout(props.photoUrl);
  const height = n(props.params, "height", 1);

  if (cut) {
    return <PhotoGif cut={cut} scale={props.scale} height={height} params={props.params} />;
  }

  return <AvatarMesh {...props} />;
}
