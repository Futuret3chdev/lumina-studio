import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio/store";
import { CatalogRail, MobileCatalog } from "./catalog-rail";
import { CutoutEditor } from "./cutout-editor";
import { GalleryPanel } from "./gallery-panel";
import { Inspector } from "./inspector";
import { PhotoCapture } from "./photo-capture";
import { Topbar } from "./topbar";
import Viewport from "./viewport";

export function StudioApp() {
  const loadGallery = useStudio((s) => s.loadGallery);
  const randomizeItem = useStudio((s) => s.randomizeItem);
  const galleryOpen = useStudio((s) => s.galleryOpen);
  const selectedPlaceId = useStudio((s) => s.selectedPlaceId);
  const worldPlaces = useStudio((s) => s.worldPlaces);
  const editingCutoutId = useStudio((s) => s.editingCutoutId);
  const [sheet, setSheet] = useState<"inspector" | null>(null);
  const selected = worldPlaces.find((p) => p.id === selectedPlaceId);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        useStudio.getState().randomizeLook();
      }
      if (e.key === " ") {
        e.preventDefault();
        const s = useStudio.getState();
        s.setAutoRotate(!s.autoRotate);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0">
        <Viewport />
      </div>

      <Topbar />
      <PhotoCapture />
      {editingCutoutId ? <CutoutEditor /> : null}

      <div className="pointer-events-none absolute bottom-3 left-3 top-20 hidden md:flex lg:bottom-4 lg:left-4">
        <CatalogRail />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 top-20 hidden w-72 lg:flex lg:bottom-4 lg:right-4">
        {galleryOpen ? <GalleryPanel /> : <Inspector />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto rounded-xl bg-surface/95 p-2 shadow-[var(--shadow-border)]">
          <MobileCatalog
            onOpenGallery={() => {
              useStudio.getState().setGalleryOpen(true);
              setSheet("inspector");
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                useStudio.getState().setGalleryOpen(false);
                setSheet("inspector");
              }}
            >
              <SlidersHorizontal className="size-4" />
              {selected?.photoUrl ? "This picture" : "Adjust"}
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={randomizeItem}>
              Surprise me
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden md:block lg:hidden">
        <Button
          type="button"
          className="pointer-events-auto"
          onClick={() => setSheet("inspector")}
        >
          <SlidersHorizontal className="size-4" />
          Adjust
        </Button>
      </div>

      {sheet === "inspector" && (
        <div className="absolute inset-0 z-30 flex items-end bg-bg/60 lg:hidden">
          <div className="flex h-[80dvh] w-full flex-col rounded-t-xl bg-surface shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-medium">
                {selected?.photoUrl ? "This picture" : "Adjust"}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setSheet(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-1 pb-3">
              {galleryOpen ? <GalleryPanel /> : <Inspector />}
            </div>
          </div>
        </div>
      )}

      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          className: "bg-elevated text-fg shadow-[var(--shadow-border)] border-0",
        }}
      />
    </div>
  );
}
