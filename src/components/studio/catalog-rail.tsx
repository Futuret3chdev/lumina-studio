import {
  Armchair,
  Box,
  Camera,
  CarFront,
  House,
  Library,
  Shapes,
  Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATALOG, CATEGORIES, itemsIn } from "@/lib/studio/catalog";
import { openNativeCamera, prefersNativeCamera } from "@/lib/studio/photo";
import { useStudio } from "@/lib/studio/store";
import type { CategoryId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const ICONS: Record<CategoryId, LucideIcon> = {
  photo: Camera,
  vehicle: CarFront,
  building: House,
  nature: Trees,
  furniture: Armchair,
  prop: Box,
  primitive: Shapes,
};

export function CatalogRail() {
  const category = useStudio((s) => s.category);
  const kind = useStudio((s) => s.kind);
  const galleryOpen = useStudio((s) => s.galleryOpen);
  const photos = useStudio((s) => s.photos);
  const activePhotoId = useStudio((s) => s.activePhotoId);
  const setCategory = useStudio((s) => s.setCategory);
  const setKind = useStudio((s) => s.setKind);
  const setGalleryOpen = useStudio((s) => s.setGalleryOpen);
  const setCaptureOpen = useStudio((s) => s.setCaptureOpen);
  const selectPhoto = useStudio((s) => s.selectPhoto);
  const items = itemsIn(category);

  return (
    <aside className="pointer-events-auto flex h-full w-56 shrink-0 flex-col rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-1 p-2">
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            if (prefersNativeCamera()) openNativeCamera();
            else setCaptureOpen(true);
          }}
        >
          <Camera className="size-4" />
          Take photo
        </Button>
        <div className="grid grid-cols-4 gap-1">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.id];
            const active = !galleryOpen && category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex h-11 flex-col items-center justify-center gap-1 rounded-md text-subtle transition-colors duration-150 hover:bg-elevated hover:text-fg",
                  active && "bg-elevated text-fg",
                )}
                aria-label={cat.label}
                title={cat.label}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          {CATEGORIES.find((c) => c.id === category)?.label}
        </p>
        {category === "photo" && (
          <ul className="mb-2 flex flex-col gap-1">
            {photos.length === 0 && (
              <li className="px-3 py-2 text-xs text-subtle">
                No shots yet. Take or upload a photo — it becomes a 3D sculpt on the stage.
              </li>
            )}
            {photos.map((shot) => {
              const active = !galleryOpen && activePhotoId === shot.id && kind === "photo-relief";
              return (
                <li key={shot.id}>
                  <button
                    type="button"
                    onClick={() => selectPhoto(shot.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-elevated",
                      active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    <img
                      src={shot.thumb}
                      alt=""
                      className="size-9 shrink-0 rounded-md object-cover"
                    />
                    <span className="truncate text-sm font-medium text-fg">
                      {shot.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {category !== "photo" && (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = !galleryOpen && kind === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setKind(item.id)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-md px-3 py-2.5 text-left transition-colors duration-150 hover:bg-elevated",
                      active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    <span className="text-sm font-medium text-fg">{item.name}</span>
                    <span className="text-xs text-subtle">{item.blurb}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
      <div className="p-2">
        <Button
          type="button"
          variant={galleryOpen ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setGalleryOpen(!galleryOpen)}
        >
          <Library className="size-4" />
          Gallery
        </Button>
      </div>
    </aside>
  );
}

export function MobileCatalog({ onOpenGallery }: { onOpenGallery?: () => void }) {
  const kind = useStudio((s) => s.kind);
  const setKind = useStudio((s) => s.setKind);
  const setCaptureOpen = useStudio((s) => s.setCaptureOpen);

  return (
    <div className="flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => {
          if (prefersNativeCamera()) openNativeCamera();
          else setCaptureOpen(true);
        }}
        className="h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-border)]"
      >
        Take photo
      </button>
      {CATALOG.filter((item) => item.id !== "photo-relief").map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setKind(item.id)}
          className={cn(
            "h-11 shrink-0 rounded-full px-4 text-sm font-medium shadow-[var(--shadow-border)] transition-colors duration-150",
            kind === item.id
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted hover:text-fg",
          )}
        >
          {item.name}
        </button>
      ))}
      <button
        type="button"
        onClick={onOpenGallery}
        className="h-11 shrink-0 rounded-full bg-surface px-4 text-sm font-medium text-muted shadow-[var(--shadow-border)] hover:text-fg"
      >
        Gallery
      </button>
    </div>
  );
}
