import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Layers, SquareStack, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATALOG_BY_ID } from "@/lib/studio/catalog";
import {
  canvasToShot,
  fileToShot,
  registerPhotoCapture,
  type PhotoShot,
} from "@/lib/studio/photo";
import { useStudio } from "@/lib/studio/store";

export function PhotoCapture() {
  const open = useStudio((s) => s.captureOpen);
  const setCaptureOpen = useStudio((s) => s.setCaptureOpen);
  const importShot = useStudio((s) => s.importShot);
  const kind = useStudio((s) => s.kind);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PhotoShot | null>(null);

  useEffect(() => {
    registerPhotoCapture({
      openCamera: () => cameraRef.current?.click(),
      openLibrary: () => fileRef.current?.click(),
    });
  }, []);

  useEffect(() => {
    if (!open && !pending) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLive(false);
    }
  }, [open, pending]);

  useEffect(() => {
    function isImageFile(file: File) {
      return file.type.startsWith("image/");
    }
    function onPaste(e: ClipboardEvent) {
      const file = [...(e.clipboardData?.files ?? [])].find(isImageFile);
      if (file) void ingestFile(file);
    }
    function onDragOver(e: DragEvent) {
      if ([...(e.dataTransfer?.types ?? [])].includes("Files")) e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      const file = [...(e.dataTransfer?.files ?? [])].find(isImageFile);
      if (!file) return;
      e.preventDefault();
      void ingestFile(file);
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

  function stopLive() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  async function ingestFile(file: File) {
    setBusy(true);
    setCaptureOpen(true);
    try {
      const shot = await fileToShot(file);
      presentShot(shot);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read photo");
    } finally {
      setBusy(false);
    }
  }

  function presentShot(shot: PhotoShot) {
    stopLive();
    const current = useStudio.getState().kind;
    if (current === "photo-relief") {
      importShot(shot, "sculpt");
      setPending(null);
      toast.success("Photo sculpted in 3D");
      return;
    }
    setPending(shot);
  }

  async function startLive() {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setLive(true);
      }
    } catch {
      toast.error("Camera is blocked here — take a photo or upload from your library.");
    } finally {
      setBusy(false);
    }
  }

  async function snapLive() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not capture");
      ctx.drawImage(video, 0, 0);
      const shot = await canvasToShot(canvas, "Capture");
      presentShot(shot);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not capture");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    stopLive();
    setPending(null);
    setCaptureOpen(false);
  }

  function apply(mode: "sculpt" | "wrap") {
    if (!pending) return;
    importShot(pending, mode);
    setPending(null);
    toast.success(
      mode === "wrap"
        ? `Photo wrapped onto ${CATALOG_BY_ID[kind].name}`
        : "Photo sculpted in 3D",
    );
  }

  const showSheet = open || Boolean(pending) || busy;
  const modelName = CATALOG_BY_ID[kind]?.name ?? "model";

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          e.target.value = "";
          if (files?.[0]) void ingestFile(files[0]);
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          e.target.value = "";
          if (files?.[0]) void ingestFile(files[0]);
        }}
      />
      {showSheet && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-bg/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-display text-xl leading-tight">Photograph</p>
                <p className="text-sm text-muted">
                  {pending
                    ? "Place it on the stage as a 3D sculpt, or wrap it onto the current model."
                    : "Shoot or upload — Lumina turns it into a 3D render."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={close}
              >
                <X className="size-4" />
              </Button>
            </div>

            {pending ? (
              <>
                <div className="relative mx-4 mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-elevated">
                  <img
                    src={pending.url}
                    alt={pending.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 px-4 pb-4">
                  <Button type="button" onClick={() => apply("sculpt")}>
                    <Layers className="size-4" />
                    Sculpt in 3D
                  </Button>
                  {kind !== "photo-relief" && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => apply("wrap")}
                    >
                      <SquareStack className="size-4" />
                      Wrap onto {modelName}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="relative mx-4 mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-elevated">
                  <video
                    ref={videoRef}
                    className="size-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {!live && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                      <Camera className="size-6 text-subtle" />
                      <p className="text-sm text-muted">
                        {busy
                          ? "Reading your photo…"
                          : "Take a photo or pick one from your library. It lands on the stage as a 3D sculpt."}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {live ? (
                    <Button type="button" disabled={busy} onClick={() => void snapLive()}>
                      <Camera className="size-4" />
                      {busy ? "Sculpting…" : "Shutter"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => cameraRef.current?.click()}
                    >
                      <Camera className="size-4" />
                      {busy ? "Reading photo…" : "Take photo"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImageUp className="size-4" />
                    Upload from library
                  </Button>
                  {!live && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void startLive()}
                    >
                      Live camera
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
