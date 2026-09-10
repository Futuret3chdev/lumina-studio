import {
  Aperture,
  Box,
  Camera,
  Download,
  Globe,
  Image,
  ImageUp,
  RotateCw,
  Shuffle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATALOG_BY_ID } from "@/lib/studio/catalog";
import { capturePng, exportGlb, exportPng } from "@/lib/studio/export";
import { useStudio } from "@/lib/studio/store";
import { WORLD_SCENES } from "@/lib/studio/world";
import { ShotFileLabel } from "@/components/studio/photo-capture";
import type { CameraPreset } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

const CAMERAS: { id: CameraPreset; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "top", label: "Top" },
];

export function Topbar() {
  const kind = useStudio((s) => s.kind);
  const cameraPreset = useStudio((s) => s.cameraPreset);
  const autoRotate = useStudio((s) => s.autoRotate);
  const mode = useStudio((s) => s.mode);
  const worldScene = useStudio((s) => s.worldScene);
  const setCameraPreset = useStudio((s) => s.setCameraPreset);
  const setAutoRotate = useStudio((s) => s.setAutoRotate);
  const setMode = useStudio((s) => s.setMode);
  const randomizeLook = useStudio((s) => s.randomizeLook);
  const saveCurrent = useStudio((s) => s.saveCurrent);
  const item = CATALOG_BY_ID[kind];
  const scene = WORLD_SCENES.find((s) => s.id === worldScene);

  function handlePng() {
    try {
      exportPng(kind);
      toast.success("Render saved as PNG");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not capture");
    }
  }

  async function handleGlb() {
    try {
      await exportGlb(kind);
      toast.success("GLB exported for your game");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export");
    }
  }

  function handleSave() {
    const thumb = capturePng();
    if (!thumb) {
      toast.error("Viewport is not ready yet");
      return;
    }
    saveCurrent(thumb);
    toast.success("Saved to gallery");
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
        <div className="flex size-9 items-center justify-center rounded-md bg-elevated">
          <Aperture className="size-4 text-accent" strokeWidth={1.75} />
        </div>
        <div className="pr-1">
          <p className="font-display text-lg leading-tight tracking-tight">
            Lumina
          </p>
          <p className="text-xs text-muted">
            {mode === "world" ? `MT World · ${scene?.label ?? "House"}` : item.name}
          </p>
        </div>
      </div>

      <div className="pointer-events-auto hidden items-center gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] md:flex">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-9 px-3", mode === "studio" && "bg-elevated text-fg")}
          onClick={() => setMode("studio")}
        >
          Studio
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-9 px-3", mode === "world" && "bg-elevated text-fg")}
          onClick={() => setMode("world")}
        >
          <Globe className="size-4" />
          World
        </Button>
        {CAMERAS.map((cam) => (
          <Button
            key={cam.id}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3",
              cameraPreset === cam.id && "bg-elevated text-fg",
            )}
            onClick={() => setCameraPreset(cam.id)}
          >
            {cam.label}
          </Button>
        ))}
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn("md:hidden", mode === "world" && "text-fg")}
          aria-label={mode === "world" ? "Back to studio" : "Open MT World"}
          onClick={() => setMode(mode === "world" ? "studio" : "world")}
        >
          <Globe className="size-4" />
        </Button>
        <Button asChild size="sm">
          <ShotFileLabel capture ariaLabel="Take photo">
            <Camera className="size-4" />
            <span className="hidden sm:inline">Photo</span>
          </ShotFileLabel>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <ShotFileLabel capture intent="avatar" ariaLabel="Use photo as aviator">
            <User className="size-4" />
          </ShotFileLabel>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <ShotFileLabel ariaLabel="Upload photo">
            <ImageUp className="size-4" />
          </ShotFileLabel>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Randomize look"
          onClick={randomizeLook}
        >
          <Shuffle className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={autoRotate ? "Stop turntable" : "Start turntable"}
          onClick={() => setAutoRotate(!autoRotate)}
          className={cn(autoRotate && "text-fg")}
        >
          <RotateCw className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Hero camera"
          onClick={() => setCameraPreset("hero")}
        >
          <Aperture className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Save PNG render"
          onClick={handlePng}
        >
          <Image className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Export GLB"
          onClick={() => void handleGlb()}
        >
          <Download className="size-4" />
        </Button>
        <Button type="button" size="sm" className="hidden sm:inline-flex" onClick={handleSave}>
          <Box className="size-4" />
          Save
        </Button>
        <Button
          type="button"
          size="icon-sm"
          className="sm:hidden"
          aria-label="Save to gallery"
          onClick={handleSave}
        >
          <Box className="size-4" />
        </Button>
      </div>
    </header>
  );
}
