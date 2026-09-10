export type LiftProgress = (label: string, pct: number) => void;

let libPromise: Promise<typeof import("@imgly/background-removal")> | null = null;

function loadLib() {
  libPromise ??= import("@imgly/background-removal");
  return libPromise;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not read that picture"))),
      "image/jpeg",
      0.92,
    );
  });
}

function blobToCanvas(blob: Blob) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not lift that subject"));
    };
    img.src = url;
  });
}

export async function liftSubject(
  source: HTMLCanvasElement,
  onProgress?: LiftProgress,
): Promise<HTMLCanvasElement> {
  const { removeBackground } = await loadLib();
  onProgress?.("Loading the cutter", 4);
  const input = await canvasToBlob(source);
  const blob = await removeBackground(input, {
    model: "isnet_quint8",
    output: { format: "image/png", quality: 0.92 },
    progress: (key, current, total) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      const label =
        key.includes("wasm") || key.includes("ort")
          ? "Starting on this phone"
          : "Finding the person or animal";
      onProgress?.(label, Math.min(99, Math.max(5, pct)));
    },
  });
  onProgress?.("Cutting out", 100);
  return blobToCanvas(blob);
}

export function preloadLift() {
  void loadLib();
}
