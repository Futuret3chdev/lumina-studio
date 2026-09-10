import { CATALOG_BY_ID } from "./catalog";
import type { AssetKind, OutfitId, WorldPlace, WorldSceneId } from "./types";

export const OUTFITS: { id: OutfitId; label: string; dress: number }[] = [
  { id: "aviator", label: "Aviator", dress: 0 },
  { id: "street", label: "Street", dress: 1 },
  { id: "formal", label: "Formal", dress: 2 },
  { id: "casual", label: "Casual", dress: 3 },
  { id: "mt", label: "MT", dress: 4 },
  { id: "cape", label: "Gold cape", dress: 5 },
  { id: "token", label: "Token head", dress: 6 },
];

export const WORLD_SCENES: { id: WorldSceneId; label: string; blurb: string }[] =
  [
    { id: "house", label: "My house", blurb: "Empty rooms. Furnish them." },
    { id: "lot", label: "Empty lot", blurb: "Open pad. Drop anything." },
    { id: "garden", label: "Garden", blurb: "Lawn and path, yours to fill." },
  ];

export function uid(prefix = "w") {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 999)}`;
}

export function dressToOutfit(dress: number): OutfitId {
  return OUTFITS[Math.max(0, Math.min(OUTFITS.length - 1, Math.round(dress)))]!
    .id;
}

export function placeScaleFor(kind: AssetKind | "upload") {
  if (kind === "upload") return 1;
  if (kind === "avatar") return 1;
  if (kind === "photo-relief") return 0.48;
  const category = CATALOG_BY_ID[kind]?.category;
  if (category === "vehicle") return 0.4;
  if (category === "building") return 0.26;
  if (category === "nature") return 0.42;
  if (category === "primitive") return 0.7;
  return 1;
}

export function nextSlot(
  places: WorldPlace[],
  scene: WorldSceneId,
): { x: number; z: number } {
  const spacing = scene === "house" ? 1.55 : 2.1;
  const maxX = scene === "house" ? 3.6 : 6;
  const maxZ = scene === "house" ? 2.6 : 6;
  for (let i = 0; i < 90; i += 1) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = (col - 2) * spacing;
    const z = (1 - row) * spacing;
    if (Math.abs(x) > maxX || Math.abs(z) > maxZ) continue;
    const taken = places.some(
      (p) => Math.hypot(p.x - x, p.z - z) < spacing * 0.45,
    );
    if (!taken) return { x, z };
  }
  return { x: 0, z: 1.4 };
}

export function clampToScene(
  x: number,
  z: number,
  scene: WorldSceneId,
): { x: number; z: number } {
  const maxX = scene === "house" ? 4.2 : 10;
  const maxZ = scene === "house" ? 3.2 : 10;
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    z: Math.max(-maxZ, Math.min(maxZ, z)),
  };
}
