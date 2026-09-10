export type CategoryId =
  | "vehicle"
  | "building"
  | "nature"
  | "furniture"
  | "prop"
  | "primitive";

export type AssetKind =
  | "sports-car"
  | "sedan"
  | "suv"
  | "pickup"
  | "van"
  | "modern-house"
  | "cottage"
  | "cabin"
  | "tower"
  | "shop"
  | "oak"
  | "pine"
  | "palm"
  | "willow"
  | "rock"
  | "chair"
  | "table"
  | "sofa"
  | "lamp"
  | "shelf"
  | "crate"
  | "barrel"
  | "traffic-cone"
  | "hydrant"
  | "vase"
  | "box"
  | "sphere"
  | "cylinder"
  | "torus"
  | "capsule";

export type EnvPreset =
  | "studio"
  | "sunset"
  | "warehouse"
  | "night"
  | "city"
  | "forest";

export type CameraPreset = "hero" | "front" | "side" | "top";

export type RangeParam = {
  key: string;
  label: string;
  type: "range";
  min: number;
  max: number;
  step: number;
};

export type ParamDef = RangeParam;

export type CatalogItem = {
  id: AssetKind;
  name: string;
  category: CategoryId;
  blurb: string;
  defaults: Record<string, number>;
  params: ParamDef[];
};

export type SavedAsset = {
  id: string;
  kind: AssetKind;
  name: string;
  bodyColor: string;
  accentColor: string;
  metalness: number;
  roughness: number;
  scale: number;
  params: Record<string, number>;
  env: EnvPreset;
  thumbnail: string;
  createdAt: number;
};

export type MeshViewProps = {
  kind: AssetKind;
  params: Record<string, number>;
  bodyColor: string;
  accentColor: string;
  metalness: number;
  roughness: number;
  scale: number;
};
