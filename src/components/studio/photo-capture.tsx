import { useEffect, type ChangeEvent, type ReactNode, forwardRef } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { fileToShot, isPhotoFile } from "@/lib/studio/photo";
import { useStudio } from "@/lib/studio/store";
import { cn } from "@/lib/utils";

export async function ingestPhotoFile(file: File) {
  if (!isPhotoFile(file)) {
    toast.error("That file is not a photo");
    return;
  }
  useStudio.getState().setPhotoBusy(true);
  try {
    const shot = await fileToShot(file);
    useStudio.getState().importShot(shot, "sculpt");
    toast.success("Photo is on the stage — drag to orbit");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not read photo");
  } finally {
    useStudio.getState().setPhotoBusy(false);
  }
}

function onFileInput(event: ChangeEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (file) void ingestPhotoFile(file);
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
  }
>(function ShotFileLabel({ capture, className, children, ariaLabel }, ref) {
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
        accept={capture ? "image/*" : "image/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"}
        capture={capture ? "environment" : undefined}
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        onChange={onFileInput}
      />
      {children}
    </label>
  );
});

export function PhotoCapture() {
  const busy = useStudio((s) => s.photoBusy);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = [...(e.clipboardData?.files ?? [])].find(isPhotoFile);
      if (file) void ingestPhotoFile(file);
    }
    function onDragOver(e: DragEvent) {
      if ([...(e.dataTransfer?.types ?? [])].includes("Files")) e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      const file = [...(e.dataTransfer?.files ?? [])].find(isPhotoFile);
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
        <p className="text-sm text-muted">Lifting your shot onto the turntable…</p>
      </div>
    </div>
  );
}
