import { toast } from "sonner";
import { cleanDebris } from "@/lib/studio/cutout";
import { liftSubject } from "@/lib/studio/lift-subject";
import { useStudio } from "@/lib/studio/store";

function loadToCanvas(src: string) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
      const c = document.createElement("canvas");
      c.width = Math.max(8, Math.round(img.width * scale));
      c.height = Math.max(8, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c);
    };
    img.onerror = () => reject(new Error("Could not read that picture"));
    img.src = src;
  });
}

const inflight = new Set<string>();

export async function autoRigPlace(id: string, sourceUrl: string) {
  if (inflight.has(id)) return;
  inflight.add(id);
  const studio = useStudio.getState();
  studio.setPhotoBusy(true);
  toast.message("Building a walker from that photo");
  try {
    const canvas = await loadToCanvas(sourceUrl);
    const lifted = await liftSubject(canvas);
    cleanDebris(lifted, true);
    useStudio.getState().applyCutout(id, lifted.toDataURL("image/png"));
    toast.success("They're walking — Advanced edit if you want to tidy");
  } catch {
    toast.message("Using the photo as-is — Advanced edit to cut it out");
  } finally {
    inflight.delete(id);
    useStudio.getState().setPhotoBusy(false);
  }
}
