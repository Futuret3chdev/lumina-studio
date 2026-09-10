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

const CAMERA_POS: Record<string, [number, number, number]> = {
  hero: [3.9, 2.05, 4.5],
  front: [0, 1.45, 6.1],
  side: [5.8, 1.55, 0.25],
  top: [0.2, 7.4, 0.2],
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
  const { camera, controls } = useThree();

  useLayoutEffect(() => {
    const pos = CAMERA_POS[preset] ?? CAMERA_POS.hero;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 0.7, 0);
    const orbit = controls as { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null;
    orbit?.target?.set(0, 0.7, 0);
    orbit?.update?.();
  }, [preset, tick, camera, controls]);

  return null;
}

function StageLights() {
  const intensity = useStudio((s) => s.lightIntensity);
  return (
    <>
      <ambientLight intensity={0.18 * intensity} />
      <directionalLight
        position={[4.2, 8, 5.5]}
        intensity={1.35 * intensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
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

  return (
    <group ref={groupRef}>
      <RegisterBridge groupRef={groupRef} />
      <AssetMesh
        kind={kind}
        params={params}
        bodyColor={bodyColor}
        accentColor={accentColor}
        metalness={metalness}
        roughness={roughness}
        scale={scale}
      />
    </group>
  );
}

function SceneContents() {
  const env = useStudio((s) => s.env);
  const envBackground = useStudio((s) => s.envBackground);
  const autoRotate = useStudio((s) => s.autoRotate);
  const showGrid = useStudio((s) => s.showGrid);
  const showPlatform = useStudio((s) => s.showPlatform);

  return (
    <>
      <color attach="background" args={["#0e0e10"]} />
      <fog attach="fog" args={["#0e0e10", 12, 28]} />
      <StageLights />
      <Suspense fallback={null}>
        <Environment
          preset={env}
          background={envBackground}
          blur={envBackground ? 0.35 : 0}
        />
      </Suspense>
      <CameraRig />
      <StagedAsset />
      {showPlatform && (
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
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.48}
        scale={12}
        blur={2.2}
        far={5}
      />
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
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minDistance={2.2}
        maxDistance={14}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.06}
        target={[0, 0.7, 0]}
      />
    </>
  );
}

export default function Viewport() {
  const autoRotate = useStudio((s) => s.autoRotate);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={autoRotate ? "always" : "demand"}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFShadowMap;
      }}
      camera={{ position: [3.9, 2.05, 4.5], fov: 35, near: 0.1, far: 80 }}
      className="touch-none"
      style={{ touchAction: "none" }}
    >
      <SceneContents />
    </Canvas>
  );
}
