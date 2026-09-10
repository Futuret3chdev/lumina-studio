import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, SRGBColorSpace, Texture, type Group } from "three";
import { cutoutPerson } from "@/lib/studio/cutout";
import type { MeshViewProps } from "@/lib/studio/types";
import { AvatarMesh } from "./avatar";
import { n } from "./shared";

const AVIATOR_H = 1.62;

function usePersonCutout(url: string | null | undefined) {
  const [cut, setCut] = useState<{
    texture: Texture;
    aspect: number;
    fullBody: boolean;
  } | null>(null);
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
      const tex = new Texture(result.canvas);
      tex.colorSpace = SRGBColorSpace;
      tex.needsUpdate = true;
      tex.anisotropy = 8;
      setCut((prev) => {
        prev?.texture.dispose();
        return {
          texture: tex,
          aspect: result.aspect,
          fullBody: result.fullBody,
        };
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
      cut?.texture.dispose();
    },
    [cut],
  );

  return cut;
}

function WalkingCutout({
  texture,
  aspect,
  scale,
  height,
}: {
  texture: Texture;
  aspect: number;
  scale: number;
  height: number;
}) {
  const ref = useRef<Group>(null);
  const h = AVIATOR_H * height;
  const w = Math.min(h * 0.72, h * aspect);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    const step = Math.sin(t * 7.2);
    g.position.y = Math.abs(step) * 0.05;
    g.rotation.z = step * 0.045;
    g.rotation.y = Math.sin(t * 0.7) * 0.18;
  });

  return (
    <group ref={ref} scale={scale}>
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
      <mesh position={[0, h / 2, -0.035]} castShadow>
        <planeGeometry args={[w * 0.98, h * 0.98]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.16}
          roughness={0.7}
          metalness={0.02}
          color="#d4d4d8"
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18 + w * 0.12, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PersonMesh(props: MeshViewProps) {
  const cut = usePersonCutout(props.photoUrl);
  const height = n(props.params, "height", 1);

  if (cut?.fullBody) {
    return (
      <WalkingCutout
        texture={cut.texture}
        aspect={cut.aspect}
        scale={props.scale}
        height={height}
      />
    );
  }

  return <AvatarMesh {...props} />;
}
