import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/studio/store";

export function GalleryPanel() {
  const gallery = useStudio((s) => s.gallery);
  const restoreSaved = useStudio((s) => s.restoreSaved);
  const removeSaved = useStudio((s) => s.removeSaved);

  return (
    <aside className="pointer-events-auto flex h-full w-full flex-col bg-surface lg:w-72 lg:rounded-xl lg:shadow-[var(--shadow-border)]">
      <div className="px-4 py-3">
        <p className="font-display text-xl leading-tight">Gallery</p>
        <p className="mt-1 text-sm text-muted">
          Saved locally on this device. Restore any asset onto the stage.
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        {gallery.length === 0 ? (
          <div className="rounded-lg bg-elevated px-4 py-8 text-center">
            <p className="text-sm text-muted">
              Nothing saved yet. Stage a model, then tap Save.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {gallery.map((asset) => (
              <li
                key={asset.id}
                className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => restoreSaved(asset)}
                >
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-subtle">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${asset.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSaved(asset.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
