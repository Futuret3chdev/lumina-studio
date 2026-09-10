export type PhotoShot = {
  id: string;
  name: string;
  url: string;
  thumb: string;
  createdAt: number;
  aspect: number;
};

export type PhotoPixels = {
  data: Uint8ClampedArray;
  cols: number;
  rows: number;
  aspect: number;
};

const MAX_EDGE = 1024;
const THUMB_EDGE = 192;
const JPEG_QUALITY = 0.86;

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now()}`;
}

function sourceSize(source: ImageBitmap | HTMLImageElement) {
  return { width: source.width || 1, height: source.height || 1 };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const finish = () => resolve(img);
      if (typeof img.decode === "function") {
        void img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => reject(new Error("Could not read that photo"));
    img.src = src;
  });
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.readAsDataURL(blob);
  });
}

async function decodeBlob(blob: Blob): Promise<{
  source: ImageBitmap | HTMLImageElement;
  objectUrl: string | null;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
      if (bitmap.width > 1 && bitmap.height > 1) {
        return { source: bitmap, objectUrl: null };
      }
      bitmap.close();
    } catch {
      try {
        const bitmap = await createImageBitmap(blob);
        if (bitmap.width > 1 && bitmap.height > 1) {
          return { source: bitmap, objectUrl: null };
        }
        bitmap.close();
      } catch {
        // fall through
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(objectUrl);
    return { source: img, objectUrl };
  } catch {
    URL.revokeObjectURL(objectUrl);
    const dataUrl = await blobToDataUrl(blob);
    const img = await loadImage(dataUrl);
    return { source: img, objectUrl: null };
  }
}

function drawFitted(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  maxEdge: number,
) {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh, 1));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function toJpeg(canvas: HTMLCanvasElement, quality = JPEG_QUALITY) {
  return canvas.toDataURL("image/jpeg", quality);
}

export function isPhotoFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif{1,2})$/i.test(file.name);
}

export async function blobToShot(blob: Blob, name: string): Promise<PhotoShot> {
  const { source, objectUrl } = await decodeBlob(blob);
  try {
    const { width, height } = sourceSize(source);
    if (width < 2 || height < 2) {
      throw new Error("Could not read that photo");
    }
    const full = drawFitted(source, width, height, MAX_EDGE);
    const thumbCanvas = drawFitted(source, width, height, THUMB_EDGE);
    return {
      id: uid(),
      name: name.replace(/\.[^.]+$/, "") || "Photo",
      url: toJpeg(full),
      thumb: toJpeg(thumbCanvas, 0.72),
      createdAt: Date.now(),
      aspect: full.width / Math.max(1, full.height),
    };
  } finally {
    if ("close" in source && typeof source.close === "function") source.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function fileToShot(file: File) {
  return blobToShot(file, file.name || "Photo");
}

export async function canvasToShot(canvas: HTMLCanvasElement, name = "Capture") {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not capture"))),
      "image/jpeg",
      0.92,
    );
  });
  return blobToShot(blob, name);
}

export function revokeShot(_shot: PhotoShot) {
  // Shots are data URLs — nothing to revoke.
}

export async function loadPixels(
  url: string,
  cols: number,
  rows: number,
): Promise<PhotoPixels> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, cols, rows);
  return {
    data: ctx.getImageData(0, 0, cols, rows).data,
    cols,
    rows,
    aspect: img.width / Math.max(1, img.height),
  };
}
