import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture, type Group } from "three";
import type { NpcLook } from "@/lib/studio/npc-look";
import { gaitFromParams } from "@/lib/studio/walk";
import { n, Surface } from "./shared";

function useCanvasTex(canvas: HTMLCanvasElement | null) {
  const [tex, setTex] = useState<Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!canvas) {
      setTex(null);
      return;
    }
    const t = new Texture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.needsUpdate = true;
    t.anisotropy = 8;
    setTex((prev) => {
      prev?.dispose();
      return t;
    });
    invalidate();
    return () => t.dispose();
  }, [canvas, invalidate]);
  return tex;
}

export function NpcMesh({
  look,
  params,
  scale,
}: {
  look: NpcLook;
  params: Record<string, number>;
  scale: number;
}) {
  const face = useCanvasTex(look.face);
  const height = n(params, "height", 1);
  const h = 1.62 * height;
  const build = 1.05;
  const motion = gaitFromParams(params);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    const spd = motion.speed;
    const s = spd < 0.05 ? 0 : Math.sin(t * spd);
    const stride = spd < 0.05 ? 0 : motion.stride;
    const arms = spd < 0.05 ? 0 : motion.arms;
    if (root.current) root.current.position.y = Math.abs(s) * motion.bob;
    if (hipL.current) {
      hipL.current.rotation.x = s * stride;
      hipL.current.rotation.z = 0.06;
    }
    if (hipR.current) {
      hipR.current.rotation.x = -s * stride;
      hipR.current.rotation.z = -0.06;
    }
    if (kneeL.current) kneeL.current.rotation.x = Math.max(0, -s) * stride * 1.15;
    if (kneeR.current) kneeR.current.rotation.x = Math.max(0, s) * stride * 1.15;
    if (armL.current) {
      armL.current.rotation.x = -s * arms * 0.7;
      armL.current.rotation.z = 0.14;
    }
    if (armR.current) {
      armR.current.rotation.x = s * arms * 0.7;
      armR.current.rotation.z = -0.14;
    }
  });

  const thighLen = 0.27 * h;
  const shinLen = 0.25 * h;
  const armLen = 0.36 * h;

  return (
    <group ref={root} scale={scale}>
      <group ref={hipL} position={[-0.12 * build, 0.7 * h, 0]}>
        <mesh position={[0, -thighLen / 2, 0]} castShadow>
          <capsuleGeometry args={[0.08 * build, thighLen * 0.7, 6, 12]} />
          <Surface color={look.pants} metalness={0.08} roughness={0.68} />
        </mesh>
        <group ref={kneeL} position={[0, -thighLen, 0]}>
          <mesh position={[0, -shinLen / 2, 0]} castShadow>
            <capsuleGeometry args={[0.072 * build, shinLen * 0.68, 6, 12]} />
            <Surface color={look.pants} metalness={0.08} roughness={0.68} />
          </mesh>
          <mesh position={[0, -shinLen + 0.02, 0.05]} castShadow>
            <boxGeometry args={[0.15 * build, 0.08, 0.24]} />
            <Surface color={look.boot} metalness={0.1} roughness={0.6} />
          </mesh>
        </group>
      </group>
      <group ref={hipR} position={[0.12 * build, 0.7 * h, 0]}>
        <mesh position={[0, -thighLen / 2, 0]} castShadow>
          <capsuleGeometry args={[0.08 * build, thighLen * 0.7, 6, 12]} />
          <Surface color={look.pants} metalness={0.08} roughness={0.68} />
        </mesh>
        <group ref={kneeR} position={[0, -thighLen, 0]}>
          <mesh position={[0, -shinLen / 2, 0]} castShadow>
            <capsuleGeometry args={[0.072 * build, shinLen * 0.68, 6, 12]} />
            <Surface color={look.pants} metalness={0.08} roughness={0.68} />
          </mesh>
          <mesh position={[0, -shinLen + 0.02, 0.05]} castShadow>
            <boxGeometry args={[0.15 * build, 0.08, 0.24]} />
            <Surface color={look.boot} metalness={0.1} roughness={0.6} />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 0.94 * h, 0]} castShadow>
        <capsuleGeometry args={[0.17 * build, 0.34 * h, 6, 14]} />
        <Surface color={look.top} metalness={0.12} roughness={0.58} />
      </mesh>
      <group ref={armL} position={[-0.22 * build, 1.1 * h, 0]}>
        <mesh position={[0, -armLen / 2, 0]} castShadow>
          <capsuleGeometry args={[0.058 * build, armLen * 0.7, 6, 12]} />
          <Surface color={look.top} metalness={0.1} roughness={0.62} />
        </mesh>
        <mesh position={[0, -armLen + 0.02, 0]} castShadow>
          <sphereGeometry args={[0.048 * build, 12, 10]} />
          <Surface color={look.skin} metalness={0.04} roughness={0.7} />
        </mesh>
      </group>
      <group ref={armR} position={[0.22 * build, 1.1 * h, 0]}>
        <mesh position={[0, -armLen / 2, 0]} castShadow>
          <capsuleGeometry args={[0.058 * build, armLen * 0.7, 6, 12]} />
          <Surface color={look.top} metalness={0.1} roughness={0.62} />
        </mesh>
        <mesh position={[0, -armLen + 0.02, 0]} castShadow>
          <sphereGeometry args={[0.048 * build, 12, 10]} />
          <Surface color={look.skin} metalness={0.04} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 1.2 * h, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.1 * h, 12]} />
        <Surface color={look.skin} metalness={0.04} roughness={0.7} />
      </mesh>
      <group position={[0, 1.4 * h, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 20, 16]} />
          <Surface color={look.skin} metalness={0.04} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.08, -0.02]} castShadow>
          <sphereGeometry args={[0.165, 16, 12, 0, Math.PI * 2, 0, 1.2]} />
          <Surface color={look.hair} metalness={0.05} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.01, 0.148]}>
          <circleGeometry args={[0.118, 28]} />
          <meshStandardMaterial
            map={face}
            color={face ? "#ffffff" : look.skin}
            roughness={0.48}
            metalness={0.04}
          />
        </mesh>
      </group>
    </group>
  );
}
