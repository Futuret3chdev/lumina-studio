import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, SRGBColorSpace, Texture, type Group } from "three";
import { cutoutPerson } from "@/lib/studio/cutout";
import { buildPuppet, type PuppetPart, type PuppetRig } from "@/lib/studio/puppet";
import type { MeshViewProps } from "@/lib/studio/types";
import { gaitFromParams } from "@/lib/studio/walk";
import { AvatarMesh } from "./avatar";
import { n } from "./shared";

const AVIATOR_H = 1.62;

type CutState = {
  rig: PuppetRig | null;
  textures: Map<HTMLCanvasElement, Texture>;
  full: Texture;
  aspect: number;
  fullBody: boolean;
  pet: boolean;
};

function texFrom(canvas: HTMLCanvasElement) {
  const tex = new Texture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

function usePuppet(url: string | null | undefined) {
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
      const textures = new Map<HTMLCanvasElement, Texture>();
      const add = (p: PuppetPart | null) => {
        if (!p) return;
        textures.set(p.canvas, texFrom(p.canvas));
      };
      if (rig) {
        add(rig.head);
        add(rig.torso);
        add(rig.armL);
        add(rig.armR);
        add(rig.thighL);
        add(rig.thighR);
        add(rig.shinL);
        add(rig.shinR);
      }
      const full = texFrom(result.canvas);
      setCut((prev) => {
        prev?.textures.forEach((t) => t.dispose());
        prev?.full.dispose();
        return {
          rig,
          textures,
          full,
          aspect: result.aspect,
          fullBody: result.fullBody,
          pet: result.pet,
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
      cut?.textures.forEach((t) => t.dispose());
      cut?.full.dispose();
    },
    [cut],
  );

  return cut;
}

function Limb({
  piece,
  tex,
  fullW,
  fullH,
  worldW,
  worldH,
}: {
  piece: PuppetPart;
  tex: Texture | undefined;
  fullW: number;
  fullH: number;
  worldW: number;
  worldH: number;
}) {
  const tw = (piece.w / fullW) * worldW;
  const th = (piece.h / fullH) * worldH;
  const ox = ((piece.w / 2 - piece.px) / fullW) * worldW;
  const oy = -((piece.h / 2 - piece.py) / fullH) * worldH;
  return (
    <mesh position={[ox, oy, 0]} castShadow>
      <planeGeometry args={[Math.max(0.02, tw), Math.max(0.02, th)]} />
      <meshStandardMaterial
        map={tex}
        transparent
        alphaTest={0.1}
        roughness={0.62}
        metalness={0.04}
        side={DoubleSide}
        depthWrite
      />
    </mesh>
  );
}

function WalkPuppet({
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
  const { rig, textures, pet } = cut;
  const root = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const motion = gaitFromParams(params);
  if (!rig) return null;

  const worldH = (pet ? 0.52 : AVIATOR_H) * height;
  const worldW = worldH * (rig.fullW / Math.max(1, rig.fullH));
  const toX = (x: number) => (x / rig.fullW - 0.5) * worldW;
  const toY = (y: number) => (1 - y / rig.fullH) * worldH;
  const t = (p: PuppetPart | null) => (p ? textures.get(p.canvas) : undefined);

  useFrame((state) => {
    const time = state.clock.elapsedTime + phase;
    const spd = motion.speed;
    const s = spd <= 0.05 ? 0 : Math.sin(time * spd);
    const c = spd <= 0.05 ? 0 : Math.cos(time * spd);
    const step = spd <= 0.05 ? 0 : Math.abs(Math.sin(time * spd));
    if (root.current) root.current.position.y = step * motion.bob;
    if (body.current) {
      body.current.rotation.y = s * motion.sway;
      body.current.rotation.z = c * motion.sway * 0.35;
    }
    if (head.current) head.current.rotation.x = step * 0.08;
    if (hipL.current) {
      hipL.current.rotation.x = s * motion.stride;
      hipL.current.position.z = s * 0.04;
    }
    if (hipR.current) {
      hipR.current.rotation.x = -s * motion.stride;
      hipR.current.position.z = -s * 0.04;
    }
    if (kneeL.current) kneeL.current.rotation.x = Math.max(0, -s) * motion.stride * 1.15;
    if (kneeR.current) kneeR.current.rotation.x = Math.max(0, s) * motion.stride * 1.15;
    if (armL.current) {
      armL.current.rotation.x = -s * motion.arms;
      armL.current.rotation.z = 0.12 + c * 0.18;
      armL.current.position.z = -s * 0.06;
    }
    if (armR.current) {
      armR.current.rotation.x = s * motion.arms;
      armR.current.rotation.z = -0.12 - c * 0.18;
      armR.current.position.z = s * 0.06;
    }
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={body}>
        <group position={[toX(rig.hipL.x * 0.5 + rig.hipR.x * 0.5), toY(rig.hipL.y), 0]}>
          <Limb
            piece={rig.torso}
            tex={t(rig.torso)}
            fullW={rig.fullW}
            fullH={rig.fullH}
            worldW={worldW}
            worldH={worldH}
          />
        </group>
        <group ref={head} position={[toX(rig.neck.x), toY(rig.neck.y), 0.01]}>
          <Limb
            piece={rig.head}
            tex={t(rig.head)}
            fullW={rig.fullW}
            fullH={rig.fullH}
            worldW={worldW}
            worldH={worldH}
          />
        </group>
        {rig.armL && (
          <group ref={armL} position={[toX(rig.shoulderL.x), toY(rig.shoulderL.y), 0.02]}>
            <Limb
              piece={rig.armL}
              tex={t(rig.armL)}
              fullW={rig.fullW}
              fullH={rig.fullH}
              worldW={worldW}
              worldH={worldH}
            />
          </group>
        )}
        {rig.armR && (
          <group ref={armR} position={[toX(rig.shoulderR.x), toY(rig.shoulderR.y), 0.02]}>
            <Limb
              piece={rig.armR}
              tex={t(rig.armR)}
              fullW={rig.fullW}
              fullH={rig.fullH}
              worldW={worldW}
              worldH={worldH}
            />
          </group>
        )}
      </group>
      <group ref={hipL} position={[toX(rig.hipL.x), toY(rig.hipL.y), 0]}>
        <Limb
          piece={rig.thighL}
          tex={t(rig.thighL)}
          fullW={rig.fullW}
          fullH={rig.fullH}
          worldW={worldW}
          worldH={worldH}
        />
        <group ref={kneeL} position={[0, toY(rig.kneeL.y) - toY(rig.hipL.y), 0]}>
          <Limb
            piece={rig.shinL}
            tex={t(rig.shinL)}
            fullW={rig.fullW}
            fullH={rig.fullH}
            worldW={worldW}
            worldH={worldH}
          />
        </group>
      </group>
      <group ref={hipR} position={[toX(rig.hipR.x), toY(rig.hipR.y), 0]}>
        <Limb
          piece={rig.thighR}
          tex={t(rig.thighR)}
          fullW={rig.fullW}
          fullH={rig.fullH}
          worldW={worldW}
          worldH={worldH}
        />
        <group ref={kneeR} position={[0, toY(rig.kneeR.y) - toY(rig.hipR.y), 0]}>
          <Limb
            piece={rig.shinR}
            tex={t(rig.shinR)}
            fullW={rig.fullW}
            fullH={rig.fullH}
            worldW={worldW}
            worldH={worldH}
          />
        </group>
      </group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16 + worldW * 0.12, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SimpleWalker({
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
  const ref = useRef<Group>(null);
  const h = (pet ? 0.55 : AVIATOR_H) * height;
  const w = Math.min(h * (pet ? 1.1 : 0.72), h * aspect);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const motion = gaitFromParams(params);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    const spd = motion.speed || (pet ? 8 : 0);
    const s = spd <= 0.05 ? 0 : Math.sin(t * spd);
    g.position.y = Math.abs(s) * Math.max(motion.bob, pet ? 0.03 : 0);
    g.rotation.y = s * motion.sway;
    g.rotation.z = s * motion.arms * 0.08;
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
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16 + w * 0.12, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PersonMesh(props: MeshViewProps) {
  const cut = usePuppet(props.photoUrl);
  const height = n(props.params, "height", 1);

  if (cut?.rig) {
    return (
      <WalkPuppet
        cut={cut}
        scale={props.scale}
        height={height}
        params={props.params}
      />
    );
  }

  if (cut) {
    return (
      <SimpleWalker
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
