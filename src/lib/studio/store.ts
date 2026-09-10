import { create } from "zustand";
import {
  ACCENT_SWATCHES,
  BODY_SWATCHES,
  CATALOG,
  CATALOG_BY_ID,
} from "./catalog";
import type { PhotoShot } from "./photo";
import type {
  AssetKind,
  CameraPreset,
  CategoryId,
  EnvPreset,
  SavedAsset,
} from "./types";

const GALLERY_KEY = "lumina.gallery.v1";

function roundToStep(value: number, step: number) {
  const decimals = String(step).split(".")[1]?.length ?? 0;
  const snapped = Math.round(value / step) * step;
  return Number(snapped.toFixed(decimals));
}

function readGallery(): SavedAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAsset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGallery(items: SavedAsset[]) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
  } catch {
    // quota — ignore
  }
}

export type PhotoImportMode = "sculpt" | "wrap";

export type StudioState = {
  kind: AssetKind;
  category: CategoryId;
  params: Record<string, number>;
  bodyColor: string;
  accentColor: string;
  metalness: number;
  roughness: number;
  scale: number;
  env: EnvPreset;
  envBackground: boolean;
  autoRotate: boolean;
  showGrid: boolean;
  showPlatform: boolean;
  lightIntensity: number;
  cameraPreset: CameraPreset;
  cameraTick: number;
  gallery: SavedAsset[];
  galleryOpen: boolean;
  photos: PhotoShot[];
  activePhotoId: string | null;
  wrapPhoto: boolean;
  previousKind: AssetKind;
  captureOpen: boolean;
  photoBusy: boolean;
  setKind: (kind: AssetKind) => void;
  setCategory: (category: CategoryId) => void;
  setParam: (key: string, value: number) => void;
  setBodyColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setMetalness: (value: number) => void;
  setRoughness: (value: number) => void;
  setScale: (value: number) => void;
  setEnv: (env: EnvPreset) => void;
  setEnvBackground: (value: boolean) => void;
  setAutoRotate: (value: boolean) => void;
  setShowGrid: (value: boolean) => void;
  setShowPlatform: (value: boolean) => void;
  setLightIntensity: (value: number) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  randomizeLook: () => void;
  randomizeItem: () => void;
  loadGallery: () => void;
  saveCurrent: (thumbnail: string) => SavedAsset | null;
  removeSaved: (id: string) => void;
  restoreSaved: (asset: SavedAsset) => void;
  setGalleryOpen: (open: boolean) => void;
  setCaptureOpen: (open: boolean) => void;
  setPhotoBusy: (busy: boolean) => void;
  importShot: (shot: PhotoShot, mode?: PhotoImportMode) => void;
  selectPhoto: (id: string) => void;
  setWrapPhoto: (value: boolean) => void;
};

const KIND_FINISH: Partial<
  Record<
    AssetKind,
    { body: string; accent: string; metalness: number; roughness: number }
  >
> = {
  "sports-car": {
    body: "#b42318",
    accent: "#18181b",
    metalness: 0.62,
    roughness: 0.34,
  },
  sedan: {
    body: "#1e3a5f",
    accent: "#18181b",
    metalness: 0.55,
    roughness: 0.38,
  },
  suv: {
    body: "#27272a",
    accent: "#18181b",
    metalness: 0.5,
    roughness: 0.42,
  },
  pickup: {
    body: "#9a3412",
    accent: "#18181b",
    metalness: 0.45,
    roughness: 0.48,
  },
  van: {
    body: "#e7e0d4",
    accent: "#27272a",
    metalness: 0.25,
    roughness: 0.55,
  },
  "modern-house": {
    body: "#e7e0d4",
    accent: "#27272a",
    metalness: 0.12,
    roughness: 0.7,
  },
  cottage: {
    body: "#e7e0d4",
    accent: "#44403c",
    metalness: 0.08,
    roughness: 0.75,
  },
  cabin: {
    body: "#9a3412",
    accent: "#44403c",
    metalness: 0.05,
    roughness: 0.8,
  },
  tower: {
    body: "#71717a",
    accent: "#27272a",
    metalness: 0.1,
    roughness: 0.82,
  },
  shop: {
    body: "#d4d4d8",
    accent: "#b42318",
    metalness: 0.12,
    roughness: 0.68,
  },
  oak: {
    body: "#5c4033",
    accent: "#3f6212",
    metalness: 0.04,
    roughness: 0.86,
  },
  pine: {
    body: "#44403c",
    accent: "#166534",
    metalness: 0.04,
    roughness: 0.86,
  },
  palm: {
    body: "#78716c",
    accent: "#4d7c0f",
    metalness: 0.04,
    roughness: 0.8,
  },
  willow: {
    body: "#57534e",
    accent: "#65a30d",
    metalness: 0.04,
    roughness: 0.84,
  },
  rock: {
    body: "#57534e",
    accent: "#a8a29e",
    metalness: 0.08,
    roughness: 0.9,
  },
  chair: {
    body: "#e7e0d4",
    accent: "#44403c",
    metalness: 0.08,
    roughness: 0.7,
  },
  table: {
    body: "#d6c7b2",
    accent: "#44403c",
    metalness: 0.08,
    roughness: 0.68,
  },
  sofa: {
    body: "#1e3a5f",
    accent: "#e7e0d4",
    metalness: 0.04,
    roughness: 0.78,
  },
  lamp: {
    body: "#e7e0d4",
    accent: "#27272a",
    metalness: 0.45,
    roughness: 0.4,
  },
  shelf: {
    body: "#d6c7b2",
    accent: "#44403c",
    metalness: 0.08,
    roughness: 0.7,
  },
  crate: {
    body: "#9a3412",
    accent: "#27272a",
    metalness: 0.15,
    roughness: 0.72,
  },
  barrel: {
    body: "#7c2d12",
    accent: "#a1a1aa",
    metalness: 0.2,
    roughness: 0.65,
  },
  "traffic-cone": {
    body: "#c2410c",
    accent: "#27272a",
    metalness: 0.08,
    roughness: 0.5,
  },
  hydrant: {
    body: "#b42318",
    accent: "#d4d4d8",
    metalness: 0.45,
    roughness: 0.4,
  },
  vase: {
    body: "#1e3a5f",
    accent: "#e7e0d4",
    metalness: 0.25,
    roughness: 0.35,
  },
  box: {
    body: "#d4d4d8",
    accent: "#27272a",
    metalness: 0.2,
    roughness: 0.5,
  },
  sphere: {
    body: "#c8ccd4",
    accent: "#27272a",
    metalness: 0.7,
    roughness: 0.22,
  },
  cylinder: {
    body: "#71717a",
    accent: "#27272a",
    metalness: 0.4,
    roughness: 0.4,
  },
  torus: {
    body: "#c8ccd4",
    accent: "#18181b",
    metalness: 0.85,
    roughness: 0.18,
  },
  capsule: {
    body: "#b42318",
    accent: "#18181b",
    metalness: 0.15,
    roughness: 0.55,
  },
  "photo-relief": {
    body: "#f4f4f5",
    accent: "#27272a",
    metalness: 0.12,
    roughness: 0.52,
  },
};

const initial = CATALOG_BY_ID["sports-car"];

function rememberPhoto(photos: PhotoShot[], shot: PhotoShot) {
  return [shot, ...photos.filter((item) => item.id !== shot.id)].slice(0, 12);
}

export const useStudio = create<StudioState>((set, get) => ({
  kind: initial.id,
  category: initial.category,
  params: { ...initial.defaults },
  bodyColor: "#b42318",
  accentColor: "#18181b",
  metalness: 0.62,
  roughness: 0.34,
  scale: 1,
  env: "studio",
  envBackground: false,
  autoRotate: true,
  showGrid: false,
  showPlatform: true,
  lightIntensity: 1,
  cameraPreset: "hero",
  cameraTick: 0,
  gallery: [],
  galleryOpen: false,
  photos: [],
  activePhotoId: null,
  wrapPhoto: false,
  previousKind: "sports-car",
  captureOpen: false,
  photoBusy: false,
  setKind: (kind) => {
    const item = CATALOG_BY_ID[kind];
    const finish = KIND_FINISH[kind];
    const current = get().kind;
    set({
      previousKind: current === "photo-relief" ? get().previousKind : current,
      kind,
      category: item.category,
      params: { ...item.defaults },
      wrapPhoto: kind === "photo-relief" ? false : get().wrapPhoto,
      ...(finish
        ? {
            bodyColor: finish.body,
            accentColor: finish.accent,
            metalness: finish.metalness,
            roughness: finish.roughness,
          }
        : {}),
    });
  },
  setCategory: (category) => set({ category, galleryOpen: false }),
  setParam: (key, value) =>
    set({ params: { ...get().params, [key]: value } }),
  setBodyColor: (bodyColor) => set({ bodyColor }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setMetalness: (metalness) => set({ metalness }),
  setRoughness: (roughness) => set({ roughness }),
  setScale: (scale) => set({ scale }),
  setEnv: (env) => set({ env }),
  setEnvBackground: (envBackground) => set({ envBackground }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowPlatform: (showPlatform) => set({ showPlatform }),
  setLightIntensity: (lightIntensity) => set({ lightIntensity }),
  setCameraPreset: (cameraPreset) =>
    set({ cameraPreset, cameraTick: get().cameraTick + 1 }),
  randomizeLook: () => {
    const item = CATALOG_BY_ID[get().kind];
    const params = { ...item.defaults };
    for (const field of item.params) {
      const span = field.max - field.min;
      params[field.key] = roundToStep(
        field.min + Math.random() * span,
        field.step,
      );
    }
    set({
      params,
      bodyColor: BODY_SWATCHES[Math.floor(Math.random() * BODY_SWATCHES.length)]!,
      accentColor:
        ACCENT_SWATCHES[Math.floor(Math.random() * ACCENT_SWATCHES.length)]!,
      metalness: roundToStep(Math.random() * 0.9, 0.05),
      roughness: roundToStep(0.15 + Math.random() * 0.75, 0.05),
    });
  },
  randomizeItem: () => {
    const pool = CATALOG.filter((item) => item.id !== "photo-relief");
    const item = pool[Math.floor(Math.random() * pool.length)]!;
    get().setKind(item.id);
    get().randomizeLook();
  },
  loadGallery: () => set({ gallery: readGallery() }),
  saveCurrent: (thumbnail) => {
    const state = get();
    const item = CATALOG_BY_ID[state.kind];
    const active = state.photos.find((p) => p.id === state.activePhotoId);
    const saved: SavedAsset = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `a-${Date.now()}`,
      kind: state.kind,
      name: item.name,
      bodyColor: state.bodyColor,
      accentColor: state.accentColor,
      metalness: state.metalness,
      roughness: state.roughness,
      scale: state.scale,
      params: { ...state.params },
      env: state.env,
      thumbnail,
      createdAt: Date.now(),
      photoData: active?.url ?? active?.thumb,
    };
    const gallery = [saved, ...state.gallery].slice(0, 24);
    writeGallery(gallery);
    set({ gallery, galleryOpen: true });
    return saved;
  },
  removeSaved: (id) => {
    const gallery = get().gallery.filter((item) => item.id !== id);
    writeGallery(gallery);
    set({ gallery });
  },
  restoreSaved: (asset) => {
    const item = CATALOG_BY_ID[asset.kind];
    set({
      kind: asset.kind,
      category: item.category,
      params: { ...asset.params },
      bodyColor: asset.bodyColor,
      accentColor: asset.accentColor,
      metalness: asset.metalness,
      roughness: asset.roughness,
      scale: asset.scale,
      env: asset.env,
      galleryOpen: false,
      wrapPhoto: Boolean(asset.photoData) && asset.kind !== "photo-relief",
    });
    if (asset.photoData) {
      const shot: PhotoShot = {
        id: asset.id,
        name: asset.name,
        url: asset.photoData,
        thumb: asset.photoData,
        createdAt: asset.createdAt,
        aspect: 1,
      };
      set({
        photos: rememberPhoto(get().photos, shot),
        activePhotoId: shot.id,
      });
    }
  },
  setGalleryOpen: (galleryOpen) => set({ galleryOpen }),
  setCaptureOpen: (captureOpen) => set({ captureOpen }),
  setPhotoBusy: (photoBusy) => set({ photoBusy }),
  importShot: (shot, mode = "sculpt") => {
    const state = get();
    const photos = rememberPhoto(state.photos, shot);
    const canWrap = state.kind !== "photo-relief";
    if (mode === "wrap" && canWrap) {
      set({
        photos,
        activePhotoId: shot.id,
        captureOpen: false,
        wrapPhoto: true,
        galleryOpen: false,
        autoRotate: true,
        cameraPreset: "hero",
        cameraTick: state.cameraTick + 1,
      });
      return;
    }
    const item = CATALOG_BY_ID["photo-relief"];
    const finish = KIND_FINISH["photo-relief"] ?? {
      body: "#f4f4f5",
      accent: "#27272a",
      metalness: 0.12,
      roughness: 0.52,
    };
    set({
      photos,
      activePhotoId: shot.id,
      captureOpen: false,
      galleryOpen: false,
      wrapPhoto: false,
      previousKind: state.kind === "photo-relief" ? state.previousKind : state.kind,
      kind: "photo-relief",
      category: "photo",
      params: { ...item.defaults },
      bodyColor: finish.body,
      accentColor: finish.accent,
      metalness: finish.metalness,
      roughness: finish.roughness,
      autoRotate: true,
      cameraPreset: "hero",
      cameraTick: state.cameraTick + 1,
    });
  },
  selectPhoto: (id) => {
    const shot = get().photos.find((p) => p.id === id);
    if (!shot) return;
    get().setKind("photo-relief");
    set({ activePhotoId: id, wrapPhoto: false, galleryOpen: false });
  },
  setWrapPhoto: (wrapPhoto) => {
    const state = get();
    if (wrapPhoto && state.kind === "photo-relief") {
      get().setKind(state.previousKind);
      set({ wrapPhoto: true });
      return;
    }
    if (!wrapPhoto && state.kind !== "photo-relief" && state.activePhotoId) {
      get().setKind("photo-relief");
      set({ wrapPhoto: false });
      return;
    }
    set({ wrapPhoto });
  },
}));
