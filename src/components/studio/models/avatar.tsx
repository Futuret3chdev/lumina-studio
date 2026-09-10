import { useEffect, useState } from "react";
import { SRGBColorSpace, Texture } from "three";
import { useThree } from "@react-three/fiber";
import type { MeshViewProps } from "@/lib/studio/types";
import { n, Surface } from "./shared";

function useFaceTexture(url: string | null | undefined) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let disposed = false;
    const img = new Image();
    if (url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed) return;
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      setTexture((prev) => {
        prev?.dispose();
        return tex;
      });
      invalidate();
    };
    img.onerror = () => {
      if (!disposed) setTexture(null);
    };
    img.src = url;
    return () => {
      disposed = true;
    };
  }, [url, invalidate]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  return texture;
}

function outfitColors(dress: number, body: string, accent: string) {
  const id = Math.round(dress);
  if (id === 0) {
    return { top: "#5c3a2e", pants: "#1c1c1f", trim: "#cfc6b8", boot: "#1a1a1d", skin: "#e7cbb6" };
  }
  if (id === 1) {
    return { top: "#27272a", pants: "#3f3f46", trim: accent, boot: "#18181b", skin: "#e7cbb6" };
  }
  if (id === 2) {
    return { top: "#18181b", pants: "#111113", trim: "#b42318", boot: "#18181b", skin: "#e7cbb6" };
  }
  if (id === 3) {
    return { top: body, pants: "#334155", trim: accent, boot: "#27272a", skin: "#e7cbb6" };
  }
  if (id === 4) {
    return { top: "#b42318", pants: "#18181b", trim: "#f4f4f5", boot: "#18181b", skin: "#e7cbb6" };
  }
  if (id === 5) {
    return { top: "#1c1917", pants: "#1c1917", trim: "#c9a227", boot: "#1c1917", skin: "#e7cbb6" };
  }
  return { top: "#14532d", pants: "#052e16", trim: "#19d37e", boot: "#052e16", skin: "#19d37e" };
}

export function AvatarMesh({
  params,
  bodyColor,
  accentColor,
  metalness,
  roughness,
  scale,
  photoUrl,
}: MeshViewProps) {
  const height = n(params, "height", 1);
  const build = n(params, "build", 1);
  const dress = Math.round(n(params, "dress", 0));
  const face = useFaceTexture(photoUrl);
  const clothes = outfitColors(dress, bodyColor, accentColor);
  const h = 1.62 * height;
  const w = 0.42 * build;
  const isAviator = dress === 0;
  const isFormal = dress === 2;
  const isMt = dress === 4;
  const isCape = dress === 5;
  const isToken = dress === 6;
  const skin = isToken ? clothes.skin : "#e7cbb6";
  const clothMetal = isCape ? 0.72 : metalness * 0.2;

  return (
    <group scale={scale}>
      <mesh position={[-0.11 * build, 0.42 * h, 0]} castShadow name="LegL">
        <capsuleGeometry args={[0.07 * build, 0.48 * h, 6, 10]} />
        <Surface color={clothes.pants} metalness={clothMetal} roughness={0.7} />
      </mesh>
      <mesh position={[0.11 * build, 0.42 * h, 0]} castShadow name="LegR">
        <capsuleGeometry args={[0.07 * build, 0.48 * h, 6, 10]} />
        <Surface color={clothes.pants} metalness={clothMetal} roughness={0.7} />
      </mesh>
      <mesh position={[-0.11 * build, 0.07, 0.03]} castShadow name="ShoeL">
        <boxGeometry args={[0.14 * build, 0.09, 0.22]} />
        <Surface color={clothes.boot} metalness={0.12} roughness={0.65} />
      </mesh>
      <mesh position={[0.11 * build, 0.07, 0.03]} castShadow name="ShoeR">
        <boxGeometry args={[0.14 * build, 0.09, 0.22]} />
        <Surface color={clothes.boot} metalness={0.12} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.92 * h, 0]} castShadow name="Torso">
        <capsuleGeometry args={[0.16 * build, 0.32 * h, 6, 12]} />
        <Surface
          color={clothes.top}
          metalness={isCape ? 0.45 : metalness * 0.25}
          roughness={Math.max(0.42, roughness)}
        />
      </mesh>
      {isAviator && (
        <mesh position={[0, 0.9 * h, 0.01]} castShadow name="Jacket">
          <capsuleGeometry args={[0.18 * build, 0.34 * h, 6, 12]} />
          <Surface color="#4a2f26" metalness={0.18} roughness={0.62} />
        </mesh>
      )}
      {isFormal && (
        <mesh position={[0, 0.88 * h, 0.12]} castShadow name="Tie">
          <boxGeometry args={[0.055, 0.26 * h, 0.02]} />
          <Surface color={clothes.trim} metalness={0.1} roughness={0.5} />
        </mesh>
      )}
      {isMt && (
        <mesh position={[0.1 * build, 1.02 * h, 0.12]} castShadow name="Badge">
          <boxGeometry args={[0.12, 0.08, 0.02]} />
          <Surface color={clothes.trim} metalness={0.45} roughness={0.32} />
        </mesh>
      )}
      {isCape && (
        <mesh position={[0, 0.78 * h, -0.16]} rotation={[0.18, 0, 0]} castShadow name="Cape">
          <boxGeometry args={[0.46 * build, 0.7 * h, 0.04]} />
          <Surface color="#c9a227" metalness={0.85} roughness={0.22} />
        </mesh>
      )}
      <mesh position={[-0.26 * build, 0.88 * h, 0]} castShadow name="ArmL">
        <capsuleGeometry args={[0.055 * build, 0.34 * h, 5, 10]} />
        <Surface
          color={isAviator ? "#4a2f26" : clothes.top}
          metalness={0.1}
          roughness={0.65}
        />
      </mesh>
      <mesh position={[0.26 * build, 0.88 * h, 0]} castShadow name="ArmR">
        <capsuleGeometry args={[0.055 * build, 0.34 * h, 5, 10]} />
        <Surface
          color={isAviator ? "#4a2f26" : clothes.top}
          metalness={0.1}
          roughness={0.65}
        />
      </mesh>
      <mesh position={[0, 1.18 * h, 0]} castShadow name="Neck">
        <cylinderGeometry args={[0.055, 0.065, 0.1 * h, 10]} />
        <Surface color={skin} metalness={0.05} roughness={0.7} />
      </mesh>
      {isToken ? (
        <mesh position={[0, 1.4 * h, 0]} rotation={[0, 0, Math.PI / 2]} castShadow name="TokenHead">
          <cylinderGeometry args={[0.2, 0.2, 0.08, 6]} />
          <Surface
            color="#19d37e"
            metalness={0.35}
            roughness={0.28}
            emissive="#14532d"
            emissiveIntensity={0.35}
          />
        </mesh>
      ) : (
        <group position={[0, 1.38 * h, 0]}>
          <mesh castShadow name="Head">
            <sphereGeometry args={[0.16, 18, 14]} />
            <Surface color={skin} metalness={0.04} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.01, 0.155]} name="Face">
            <circleGeometry args={[0.12, 24]} />
            <meshStandardMaterial
              map={face}
              color={face ? "#ffffff" : skin}
              roughness={0.5}
              metalness={0.04}
            />
          </mesh>
        </group>
      )}
      {isAviator && !isToken && (
        <group position={[0, 1.4 * h, 0.12]}>
          <mesh position={[-0.07, 0.01, 0.02]} castShadow name="GoggleL">
            <sphereGeometry args={[0.045, 10, 8]} />
            <Surface color="#18181b" metalness={0.75} roughness={0.16} />
          </mesh>
          <mesh position={[0.07, 0.01, 0.02]} castShadow name="GoggleR">
            <sphereGeometry args={[0.045, 10, 8]} />
            <Surface color="#18181b" metalness={0.75} roughness={0.16} />
          </mesh>
          <mesh position={[0, 0.11, -0.04]} castShadow name="Cap">
            <sphereGeometry args={[0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Surface color="#27272a" metalness={0.08} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.14, 0.04]} rotation={[0.45, 0, 0]} castShadow name="Scarf">
            <boxGeometry args={[0.2, 0.14, 0.07]} />
            <Surface color={clothes.trim} metalness={0.05} roughness={0.8} />
          </mesh>
        </group>
      )}
      {dress === 1 && (
        <mesh position={[0, 1.22 * h, 0]} castShadow name="Hood">
          <sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, 1.2]} />
          <Surface color="#18181b" metalness={0.08} roughness={0.75} />
        </mesh>
      )}
    </group>
  );
}
