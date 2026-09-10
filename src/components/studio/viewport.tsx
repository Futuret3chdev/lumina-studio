import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
} from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { PCFShadowMap, type Group } from "three";
import { studioBridge } from "@/lib/studio/bridge";
import { useStudio } from "@/lib/studio/store";
import { AssetMesh } from "./models/asset-mesh";
import { PhotoSkin } from "./models/photo";
import { WorldLayer } from "./world-layer";

const CAMERA_POS: Record<string, [number, number, number]> = {
  hero: [3.9, 2.05, 4.5],
  front: [0, 1.45, 6.1],
  side: [5.8, 1.55, 0.25],
  top: [0.2, 7.4, 0.2],
};

const WORLD_CAM: Record<string, [number, number, number]> = {
  hero: [6.4, 3.4, 7.2],
  front: [0, 2.4, 9.5],
  side: [9.2, 2.6, 0.4],
  top: [0.2, 11, 0.2],
};

function RegisterBridge({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    studioBridge.gl = gl;
    studioBridge.scene = scene;
    studioBridge.camera = camera;
    studioBridge.group = groupRef.current;
    return () => {
      studioBridge.gl = null;
      studioBridge.scene = null;
      studioBridge.camera = null;
      studioBridge.group = null;
    };
  }, [gl, scene, camera, groupRef]);
  useFrame(() => {
    studioBridge.group = groupRef.current;
  });
  return null;
}

function CameraRig() {
  const preset = useStudio((s) => s.cameraPreset);
  const tick = useStudio((s) => s.cameraTick);
  const mode = useStudio((s) => s.mode);
  const { camera, controls } = useThree();

  useLayoutEffect(() => {
    const table = mode === "world" ? WORLD_CAM : CAMERA_POS;
    const pos = table[preset] ?? table.hero;
    const lookY = mode === "world" ? 1.15 : 0.7;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, lookY, 0);
    const orbit = controls as {
      target?: { set: (x: number, y: number, z: number) => void };
      update?: () => void;
    } | null;
    orbit?.target?.set(0, lookY, 0);
    orbit?.update?.();
  }, [preset, tick, camera, controls, mode]);

  return null;
}

function StageLights() {
  const intensity = useStudio((s) => s.lightIntensity);
  const mode = useStudio((s) => s.mode);
  return (
    <>
      <ambientLight intensity={(mode === "world" ? 0.28 : 0.18) * intensity} />
      <directionalLight
        position={[4.2, 8, 5.5]}
        intensity={1.35 * intensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={36}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight
        position={[-5.5, 2.8, -3.5]}
        intensity={0.38 * intensity}
        color="#c9d3e0"
      />
      <spotLight
        position={[0, 6.5, 2.2]}
        intensity={0.45 * intensity}
        angle={0.55}
        penumbra={0.85}
      />
    </>
  );
}

function StagedAsset() {
  const groupRef = useRef<Group>(null);
  const kind = useStudio((s) => s.kind);
  const params = useStudio((s) => s.params);
  const bodyColor = useStudio((s) => s.bodyColor);
  const accentColor = useStudio((s) => s.accentColor);
  const metalness = useStudio((s) => s.metalness);
  const roughness = useStudio((s) => s.roughness);
  const scale = useStudio((s) => s.scale);
  const photos = useStudio((s) => s.photos);
  const activePhotoId = useStudio((s) => s.activePhotoId);
  const wrapPhoto = useStudio((s) => s.wrapPhoto);
  const photoUrl = photos.find((p) => p.id === activePhotoId)?.url ?? null;

  const mesh = (
    <AssetMesh
      kind={kind}
      params={params}
      bodyColor={bodyColor}
      accentColor={accentColor}
      metalness={metalness}
      roughness={roughness}
      scale={scale}
      photoUrl={photoUrl}
    />
  );

  return (
    <group ref={groupRef}>
      <RegisterBridge groupRef={groupRef} />
      {wrapPhoto && photoUrl && kind !== "photo-relief" ? (
        <PhotoSkin url={photoUrl} key={`${kind}-${photoUrl}`}>
          {mesh}
        </PhotoSkin>
      ) : (
        mesh
      )}
    </group>
  );
}

function SceneContents() {
  const env = useStudio((s) => s.env);
  const envBackground = useStudio((s) => s.envBackground);
  const autoRotate = useStudio((s) => s.autoRotate);
  const showGrid = useStudio((s) => s.showGrid);
  const showPlatform = useStudio((s) => s.showPlatform);
  const mode = useStudio((s) => s.mode);
  const world = mode === "world";
  const worldRef = useRef<Group>(null);

  return (
    <>
      <color attach="background" args={[world ? "#121214" : "#0e0e10"]} />
      <fog attach="fog" args={[world ? "#121214" : "#0e0e10", world ? 16 : 12, world ? 42 : 28]} />
      <StageLights />
      <Suspense fallback={null}>
        <Environment
          preset={env}
          background={envBackground}
          blur={envBackground ? 0.35 : 0}
        />
      </Suspense>
      <CameraRig />
      <Suspense fallback={null}>
        {world ? (
          <group ref={worldRef}>
            <RegisterBridge groupRef={worldRef} />
            <WorldLayer />
          </group>
        ) : (
          <StagedAsset />
        )}
      </Suspense>
      {!world && showPlatform && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.001, 0]}
          receiveShadow
        >
          <circleGeometry args={[3.4, 64]} />
          <meshStandardMaterial
            color="#161618"
            metalness={0.42}
            roughness={0.48}
          />
        </mesh>
      )}
      {!world && (
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.48}
          scale={12}
          blur={2.2}
          far={5}
        />
      )}
      {showGrid && (
        <Grid
          args={[16, 16]}
          cellSize={0.5}
          sectionSize={2}
          cellColor="#2a2a30"
          sectionColor="#3d3d46"
          fadeDistance={16}
          fadeStrength={1.4}
          infiniteGrid
          position={[0, -0.01, 0]}
        />
      )}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={!world && autoRotate}
        autoRotateSpeed={0.9}
        minDistance={world ? 2.4 : 2.2}
        maxDistance={world ? 22 : 14}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, world ? 1.15 : 0.7, 0]}
      />
    </>
  );
}

export default function Viewport() {
  const mode = useStudio((s) => s.mode);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop="always"
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFShadowMap;
      }}
      camera={{
        position: mode === "world" ? [6.4, 3.4, 7.2] : [3.9, 2.05, 4.5],
        fov: mode === "world" ? 42 : 35,
        near: 0.1,
        far: 80,
      }}
      className="touch-none"
      style={{ touchAction: "none" }}
    >
      <SceneContents />
    </Canvas>
  );
}
