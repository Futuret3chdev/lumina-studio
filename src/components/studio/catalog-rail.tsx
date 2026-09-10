import {
  Armchair,
  Box,
  Camera,
  CarFront,
  Globe,
  House,
  Library,
  Shapes,
  Trees,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATALOG, CATEGORIES, itemsIn } from "@/lib/studio/catalog";
import { CAST_LOOKS, castFaceUrl } from "@/lib/studio/mt-world";
import { ModelFileLabel, ShotFileLabel } from "@/components/studio/photo-capture";
import { useStudio } from "@/lib/studio/store";
import type { CategoryId } from "@/lib/studio/types";
import { OUTFITS, WORLD_SCENES } from "@/lib/studio/world";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ICONS: Record<CategoryId, LucideIcon> = {
  photo: Camera,
  people: User,
  vehicle: CarFront,
  building: House,
  nature: Trees,
  furniture: Armchair,
  prop: Box,
  primitive: Shapes,
};

function usePlaceOrStage() {
  const mode = useStudio((s) => s.mode);
  const setKind = useStudio((s) => s.setKind);
  const placeKind = useStudio((s) => s.placeKind);
  return (kind: Parameters<typeof setKind>[0]) => {
    if (mode === "world" || kind === "avatar") {
      const photo = useStudio.getState().photos.find(
        (p) => p.id === useStudio.getState().activePhotoId,
      );
      placeKind(kind, kind === "avatar" ? photo?.url : undefined);
      toast.success(
        kind === "avatar"
          ? "You're in the house — pick a dress, tap models to furnish"
          : "Placed in the world — tap the floor to move it",
      );
    } else {
      setKind(kind);
    }
  };
}

function wearLook(name: string, url: string) {
  useStudio.getState().placeKind("avatar", url);
  toast.success(`${name} is in the house — pick a dress`);
}

export function CatalogRail() {
  const category = useStudio((s) => s.category);
  const kind = useStudio((s) => s.kind);
  const galleryOpen = useStudio((s) => s.galleryOpen);
  const photos = useStudio((s) => s.photos);
  const activePhotoId = useStudio((s) => s.activePhotoId);
  const mode = useStudio((s) => s.mode);
  const selectedPlaceId = useStudio((s) => s.selectedPlaceId);
  const worldPlaces = useStudio((s) => s.worldPlaces);
  const setCategory = useStudio((s) => s.setCategory);
  const setGalleryOpen = useStudio((s) => s.setGalleryOpen);
  const selectPhoto = useStudio((s) => s.selectPhoto);
  const placeOrStage = usePlaceOrStage();
  const items = itemsIn(category);
  const selected = worldPlaces.find((p) => p.id === selectedPlaceId);

  return (
    <aside className="pointer-events-auto flex h-full w-56 shrink-0 flex-col rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-1 p-2">
        <Button asChild className="w-full">
          <ShotFileLabel capture>
            <Camera className="size-4" />
            Take photo
          </ShotFileLabel>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <ShotFileLabel intent="avatar" capture>
            <User className="size-4" />
            Me · Aviator
          </ShotFileLabel>
        </Button>
        <div className="grid grid-cols-2 gap-1">
          <Button asChild variant="secondary" className="w-full">
            <ShotFileLabel>Upload photo</ShotFileLabel>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <ModelFileLabel>Upload 3D</ModelFileLabel>
          </Button>
        </div>
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
          {mode === "world" ? " · tap to place" : ""}
        </p>
        {category === "photo" && (
          <ul className="mb-2 flex flex-col gap-1">
            {photos.length === 0 && (
              <li className="px-3 py-2 text-xs text-subtle">
                No shots yet. Take a photo of yourself with Me, or upload a shot to
                sculpt.
              </li>
            )}
            {photos.map((shot) => {
              const active =
                !galleryOpen &&
                activePhotoId === shot.id &&
                (kind === "photo-relief" || selected?.photoUrl === shot.url);
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
                    onClick={() => placeOrStage(item.id)}
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
        {category === "people" && (
          <div className="mt-3">
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
              MT World looks
            </p>
            <div className="grid grid-cols-3 gap-1.5 px-1 pb-2">
              {CAST_LOOKS.map((look) => (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => wearLook(look.name, castFaceUrl(look.id))}
                  className="flex flex-col items-center gap-1 rounded-md p-1 text-xs text-muted hover:bg-elevated hover:text-fg"
                >
                  <img
                    src={castFaceUrl(look.id)}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                    loading="lazy"
                    crossOrigin="anonymous"
                  />
                  <span className="truncate">{look.name}</span>
                </button>
              ))}
            </div>
          </div>
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
  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  const worldScene = useStudio((s) => s.worldScene);
  const setWorldScene = useStudio((s) => s.setWorldScene);
  const params = useStudio((s) => s.params);
  const setParam = useStudio((s) => s.setParam);
  const selectedPlaceId = useStudio((s) => s.selectedPlaceId);
  const worldPlaces = useStudio((s) => s.worldPlaces);
  const placeOrStage = usePlaceOrStage();
  const selected = worldPlaces.find((p) => p.id === selectedPlaceId);
  const showDress = kind === "avatar" || selected?.kind === "avatar" || mode === "world";
  const dress = Math.round(params.dress ?? 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setMode(mode === "world" ? "studio" : "world")}
          className={cn(
            "h-11 shrink-0 rounded-full px-4 text-sm font-medium shadow-[var(--shadow-border)]",
            mode === "world"
              ? "bg-primary text-primary-foreground"
              : "bg-elevated text-fg",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Globe className="size-4" />
            {mode === "world" ? "World" : "My house"}
          </span>
        </button>
        <ShotFileLabel
          capture
          intent="avatar"
          className="h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-border)]"
        >
          Me · Aviator
        </ShotFileLabel>
        <ShotFileLabel
          capture
          className="h-11 shrink-0 rounded-full bg-elevated px-4 text-sm font-medium text-fg shadow-[var(--shadow-border)]"
        >
          Take photo
        </ShotFileLabel>
        <ShotFileLabel className="h-11 shrink-0 rounded-full bg-elevated px-4 text-sm font-medium text-fg shadow-[var(--shadow-border)]">
          Upload
        </ShotFileLabel>
        <ModelFileLabel className="h-11 shrink-0 rounded-full bg-elevated px-4 text-sm font-medium text-fg shadow-[var(--shadow-border)]">
          3D
        </ModelFileLabel>
        {CATALOG.filter((item) => item.id !== "photo-relief").map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => placeOrStage(item.id)}
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
      {mode === "world" && (
        <div className="flex gap-1.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WORLD_SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setWorldScene(scene.id)}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-xs font-medium",
                worldScene === scene.id
                  ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              {scene.label}
            </button>
          ))}
        </div>
      )}
      {showDress && (
        <div className="flex gap-1.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {OUTFITS.map((outfit) => (
            <button
              key={outfit.id}
              type="button"
              onClick={() => {
                const s = useStudio.getState();
                const photo = s.photos.find((p) => p.id === s.activePhotoId);
                if (!s.worldPlaces.some((p) => p.kind === "avatar")) {
                  s.placeKind("avatar", photo?.url);
                }
                if (s.mode !== "world") s.setMode("world");
                s.setParam("dress", outfit.dress);
              }}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-xs font-medium",
                dress === outfit.dress
                  ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              {outfit.label}
            </button>
          ))}
        </div>
      )}
      {mode === "world" && (
        <div className="flex gap-1.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CAST_LOOKS.slice(0, 16).map((look) => (
            <button
              key={look.id}
              type="button"
              onClick={() => wearLook(look.name, castFaceUrl(look.id))}
              className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-elevated"
              aria-label={look.name}
            >
              <img
                src={castFaceUrl(look.id)}
                alt=""
                className="size-full object-cover"
                loading="lazy"
                crossOrigin="anonymous"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
