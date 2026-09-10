import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { downloadBlob, downloadDataUrl, slugify } from "@/lib/utils";
import { CATALOG_BY_ID } from "./catalog";
import { studioBridge } from "./bridge";
import type { AssetKind } from "./types";

function fileBase(kind: AssetKind) {
  return `lumina-${slugify(CATALOG_BY_ID[kind].name)}`;
}

export function capturePng(): string | null {
  const { gl, scene, camera } = studioBridge;
  if (!gl || !scene || !camera) return null;
  gl.render(scene, camera);
  return gl.domElement.toDataURL("image/png");
}

export function exportPng(kind: AssetKind) {
  const dataUrl = capturePng();
  if (!dataUrl) throw new Error("The viewport is not ready yet.");
  downloadDataUrl(dataUrl, `${fileBase(kind)}.png`);
}

export async function exportGlb(kind: AssetKind) {
  const group = studioBridge.group;
  if (!group) throw new Error("The model is not ready yet.");
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(group, {
    binary: true,
  });
  const blob =
    result instanceof Blob
      ? result
      : new Blob([result as BlobPart], { type: "model/gltf-binary" });
  downloadBlob(blob, `${fileBase(kind)}.glb`);
}
