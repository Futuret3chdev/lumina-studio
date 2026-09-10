import { useEffect, type ChangeEvent, type ReactNode, forwardRef } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { fileToShot, isPhotoFile } from "@/lib/studio/photo";
import { useStudio } from "@/lib/studio/store";
import type { PhotoImportMode } from "@/lib/studio/store";
import { cn } from "@/lib/utils";

export function isModelFile(file: File) {
  return (
    file.type === "model/gltf-binary" ||
    file.type === "model/gltf+json" ||
    /\.(glb|gltf)$/i.test(file.name)
  );
}

export async function ingestPhotoFile(
  file: File,
  intent: PhotoImportMode = "sculpt",
) {
  if (isModelFile(file)) {
    await ingestModelFile(file);
    return;
  }
  if (!isPhotoFile(file)) {
    toast.error("That file is not a photo");
    return;
  }
  useStudio.getState().setPhotoBusy(true);
  try {
    const shot = await fileToShot(file);
    const mode = useStudio.getState().mode;
    const next =
      intent === "avatar" ? "avatar" : mode === "world" ? "sculpt" : intent;
    useStudio.getState().importShot(shot, next);
    if (next === "avatar") {
      toast.success("That's you — you're in the house. Dress, then place models.");
    } else if (mode === "world") {
      toast.success("They're in the world as a character — tap the floor to move them");
    } else {
      toast.success("Photo is on the stage — drag to orbit");
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not read photo");
  } finally {
    useStudio.getState().setPhotoBusy(false);
  }
}

export async function ingestModelFile(file: File) {
  if (!isModelFile(file)) {
    toast.error("Upload a .glb or .gltf model");
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    toast.error("That model is too large (12 MB max)");
    return;
  }
  const url = URL.createObjectURL(file);
  useStudio.getState().placeUpload(file.name.replace(/\.[^.]+$/, "") || "Model", url);
  toast.success("Model is in the world — tap the floor to place it");
}

function onFileInput(intent: PhotoImportMode) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (file) void ingestPhotoFile(file, intent);
    window.setTimeout(() => {
      input.value = "";
    }, 0);
  };
}

function onModelInput(event: ChangeEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (file) void ingestModelFile(file);
  window.setTimeout(() => {
    input.value = "";
  }, 0);
}

export const ShotFileLabel = forwardRef<
  HTMLLabelElement,
  {
    capture?: boolean;
    className?: string;
    children: ReactNode;
    ariaLabel?: string;
    intent?: PhotoImportMode;
  }
>(function ShotFileLabel(
  { capture, className, children, ariaLabel, intent = "sculpt" },
  ref,
) {
  return (
    <label
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center overflow-hidden",
        className,
      )}
    >
      <input
        type="file"
        accept={
          capture
            ? "image/*"
            : "image/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
        }
        capture={
          capture
            ? intent === "avatar"
              ? "user"
              : "environment"
            : undefined
        }
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        onChange={onFileInput(intent)}
      />
      {children}
    </label>
  );
});

export const ModelFileLabel = forwardRef<
  HTMLLabelElement,
  { className?: string; children: ReactNode; ariaLabel?: string }
>(function ModelFileLabel({ className, children, ariaLabel }, ref) {
  return (
    <label
      ref={ref}
      aria-label={ariaLabel ?? "Upload 3D model"}
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center overflow-hidden",
        className,
      )}
    >
      <input
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        onChange={onModelInput}
      />
      {children}
    </label>
  );
});

export function PhotoCapture() {
  const busy = useStudio((s) => s.photoBusy);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = [...(e.clipboardData?.files ?? [])].find(
        (f) => isPhotoFile(f) || isModelFile(f),
      );
      if (file) void ingestPhotoFile(file);
    }
    function onDragOver(e: DragEvent) {
      if ([...(e.dataTransfer?.types ?? [])].includes("Files")) e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      const file = [...(e.dataTransfer?.files ?? [])].find(
        (f) => isPhotoFile(f) || isModelFile(f),
      );
      if (!file) return;
      e.preventDefault();
      void ingestPhotoFile(file);
    }
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  if (!busy) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-bg/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-surface px-5 py-6 text-center shadow-[var(--shadow-border)]">
        <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-elevated">
          <Camera className="size-6 text-subtle" />
        </div>
        <p className="font-display text-xl leading-tight">Sculpting photo</p>
        <p className="text-sm text-muted">Lifting your shot onto the stage…</p>
      </div>
    </div>
  );
}
