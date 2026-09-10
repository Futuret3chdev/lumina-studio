import {
  Armchair,
  Box,
  CarFront,
  House,
  Library,
  Shapes,
  Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATALOG, CATEGORIES, itemsIn } from "@/lib/studio/catalog";
import { useStudio } from "@/lib/studio/store";
import type { CategoryId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const ICONS: Record<CategoryId, LucideIcon> = {
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
  const setCategory = useStudio((s) => s.setCategory);
  const setKind = useStudio((s) => s.setKind);
  const setGalleryOpen = useStudio((s) => s.setGalleryOpen);
  const items = itemsIn(category);

  return (
    <aside className="pointer-events-auto flex h-full w-56 shrink-0 flex-col rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <div className="grid grid-cols-3 gap-1 p-2">
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
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          {CATEGORIES.find((c) => c.id === category)?.label}
        </p>
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

  return (
    <div className="flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATALOG.map((item) => (
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
