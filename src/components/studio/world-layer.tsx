import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { useStudio } from "@/lib/studio/store";
import { AssetMesh } from "./models/asset-mesh";
import { UploadedMesh } from "./models/uploaded";
import { WorldFloor, WorldSet } from "./models/world-set";

function PlacedItem({
  id,
  selected,
}: {
  id: string;
  selected: boolean;
}) {
  const place = useStudio((s) => s.worldPlaces.find((p) => p.id === id));
  const selectPlace = useStudio((s) => s.selectPlace);
  if (!place) return null;

  function onDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    selectPlace(id);
  }

  return (
    <group
      position={[place.x, 0, place.z]}
      rotation={[0, place.rotY, 0]}
      onPointerDown={onDown}
    >
      {place.kind === "upload" && place.glbUrl ? (
        <UploadedMesh url={place.glbUrl} scale={place.scale} />
      ) : place.kind !== "upload" ? (
        <AssetMesh
          kind={place.kind}
          params={place.params}
          bodyColor={place.bodyColor}
          accentColor={place.accentColor}
          metalness={place.metalness}
          roughness={place.roughness}
          scale={place.scale}
          photoUrl={place.photoUrl}
        />
      ) : null}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 32]} />
          <meshBasicMaterial color="#f4f4f5" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

export function WorldLayer() {
  const groupRef = useRef<Group>(null);
  const scene = useStudio((s) => s.worldScene);
  const places = useStudio((s) => s.worldPlaces);
  const selectedPlaceId = useStudio((s) => s.selectedPlaceId);
  const movePlace = useStudio((s) => s.movePlace);
  const selectPlace = useStudio((s) => s.selectPlace);

  return (
    <group ref={groupRef}>
      <WorldSet scene={scene} />
      <WorldFloor
        scene={scene}
        onPlace={(x, z) => {
          if (selectedPlaceId) movePlace(selectedPlaceId, x, z);
          else selectPlace(null);
        }}
      />
      {places.map((place) => (
        <PlacedItem
          key={place.id}
          id={place.id}
          selected={place.id === selectedPlaceId}
        />
      ))}
    </group>
  );
}
