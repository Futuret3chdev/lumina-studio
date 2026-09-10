import { useEffect, useRef, useState } from "react";
import { Eraser, Paintbrush, Sparkles, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cutoutPerson } from "@/lib/studio/cutout";
import { useStudio } from "@/lib/studio/store";

type Tool = "erase" | "keep";

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that picture"));
    img.src = src;
  });
}

function pointerOn(
  canvas: HTMLCanvasElement,
  e: React.PointerEvent,
) {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

export function CutoutEditor() {
  const id = useStudio((s) => s.editingCutoutId);
  const places = useStudio((s) => s.worldPlaces);
  const place = places.find((p) => p.id === id) ?? null;
  const workRef = useRef<HTMLCanvasElement>(null);
  const origRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const undo = useRef<ImageData[]>([]);
  const [tool, setTool] = useState<Tool>("erase");
  const [size, setSize] = useState(42);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!place?.photoUrl) {
      setReady(false);
      return;
    }
    let dead = false;
    const source = place.photoSource ?? place.photoUrl;
    void (async () => {
      try {
        const img = await loadImg(source);
        if (dead) return;
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
        const w = Math.max(8, Math.round(img.width * scale));
        const h = Math.max(8, Math.round(img.height * scale));
        const orig = document.createElement("canvas");
        orig.width = w;
        orig.height = h;
        const octx = orig.getContext("2d");
        if (!octx) return;
        octx.drawImage(img, 0, 0, w, h);
        origRef.current = orig;
        const work = workRef.current;
        if (!work) return;
        work.width = w;
        work.height = h;
        work.style.width = "auto";
        work.style.height = "auto";
        work.style.maxWidth = "100%";
        work.style.maxHeight = "100%";
        const wctx = work.getContext("2d");
        if (!wctx) return;
        const auto = cutoutPerson(img, img.width, img.height);
        if (auto) {
          wctx.clearRect(0, 0, w, h);
          const ox = Math.round((w - auto.canvas.width) / 2);
          const oy = Math.round((h - auto.canvas.height) / 2);
          wctx.drawImage(auto.canvas, ox, oy);
        } else {
          wctx.drawImage(orig, 0, 0);
        }
        undo.current = [];
        setReady(true);
      } catch {
        toast.error("Could not open that picture");
        useStudio.getState().setEditingCutout(null);
      }
    })();
    return () => {
      dead = true;
    };
  }, [place?.id, place?.photoUrl, place?.photoSource]);

  function snapshot() {
    const work = workRef.current;
    const ctx = work?.getContext("2d");
    if (!work || !ctx) return;
    undo.current.push(ctx.getImageData(0, 0, work.width, work.height));
    if (undo.current.length > 12) undo.current.shift();
  }

  function paint(e: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const orig = origRef.current;
    const ctx = work?.getContext("2d");
    if (!work || !ctx || !orig) return;
    const p = pointerOn(work, e);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#000";
      const pattern = ctx.createPattern(orig, "no-repeat");
      if (pattern) ctx.strokeStyle = pattern as unknown as string;
    }
    ctx.beginPath();
    if (last.current) ctx.moveTo(last.current.x, last.current.y);
    else ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
    last.current = p;
  }

  function wand(e: React.PointerEvent<HTMLCanvasElement>) {
    const work = workRef.current;
    const ctx = work?.getContext("2d");
    if (!work || !ctx) return;
    const p = pointerOn(work, e);
    const x = Math.max(0, Math.min(work.width - 1, Math.round(p.x)));
    const y = Math.max(0, Math.min(work.height - 1, Math.round(p.y)));
    const image = ctx.getImageData(0, 0, work.width, work.height);
    const d = image.data;
    const w = work.width;
    const h = work.height;
    const i0 = (y * w + x) * 4;
    const tr = d[i0] ?? 0;
    const tg = d[i0 + 1] ?? 0;
    const tb = d[i0 + 2] ?? 0;
    const ta = d[i0 + 3] ?? 0;
    if (ta < 8) return;
    snapshot();
    const seen = new Uint8Array(w * h);
    const qx = [x];
    const qy = [y];
    const tol = 36;
    let qh = 0;
    while (qh < qx.length) {
      const cx = qx[qh]!;
      const cy = qy[qh]!;
      qh += 1;
      const pidx = cy * w + cx;
      if (seen[pidx]) continue;
      seen[pidx] = 1;
      const i = pidx * 4;
      const a = d[i + 3] ?? 0;
      if (a < 8) continue;
      const dr = (d[i] ?? 0) - tr;
      const dg = (d[i + 1] ?? 0) - tg;
      const db = (d[i + 2] ?? 0) - tb;
      if (dr * dr + dg * dg + db * db > tol * tol) continue;
      d[i + 3] = 0;
      if (cx > 0) {
        qx.push(cx - 1);
        qy.push(cy);
      }
      if (cx + 1 < w) {
        qx.push(cx + 1);
        qy.push(cy);
      }
      if (cy > 0) {
        qx.push(cx);
        qy.push(cy - 1);
      }
      if (cy + 1 < h) {
        qx.push(cx);
        qy.push(cy + 1);
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    snapshot();
    drawing.current = true;
    moved.current = false;
    last.current = null;
    startPt.current = pointerOn(e.currentTarget, e);
    paint(e);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = pointerOn(e.currentTarget, e);
    if (startPt.current) {
      const dx = p.x - startPt.current.x;
      const dy = p.y - startPt.current.y;
      if (dx * dx + dy * dy > 36) moved.current = true;
    }
    paint(e);
  }

  function onUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drawing.current && !moved.current && tool === "erase") {
      onUndo();
      wand(e);
    }
    drawing.current = false;
    last.current = null;
    startPt.current = null;
  }

  function onUndo() {
    const work = workRef.current;
    const ctx = work?.getContext("2d");
    const snap = undo.current.pop();
    if (!work || !ctx || !snap) return;
    ctx.putImageData(snap, 0, 0);
  }

  function onAuto() {
    const orig = origRef.current;
    const work = workRef.current;
    const ctx = work?.getContext("2d");
    if (!orig || !work || !ctx) return;
    snapshot();
    const auto = cutoutPerson(orig, orig.width, orig.height);
    ctx.clearRect(0, 0, work.width, work.height);
    if (auto) {
      const ox = Math.round((work.width - auto.canvas.width) / 2);
      const oy = Math.round((work.height - auto.canvas.height) / 2);
      ctx.drawImage(auto.canvas, ox, oy);
    } else {
      ctx.drawImage(orig, 0, 0);
    }
  }

  function onDone() {
    const work = workRef.current;
    if (!work || !place) return;
    const url = work.toDataURL("image/png");
    useStudio.getState().applyCutout(place.id, url);
    toast.success("Cut-out saved on this picture only");
  }

  if (!place) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-bg">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="text-sm font-medium">Cut out</p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onUndo} aria-label="Undo">
            <Undo2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => useStudio.getState().setEditingCutout(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <p className="px-3 pb-2 text-xs text-muted">
        Paint away the backdrop. Tap a colour to drop a whole patch. Only this picture changes.
      </p>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#2a2a30_25%,transparent_25%),linear-gradient(-45deg,#2a2a30_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#2a2a30_75%),linear-gradient(-45deg,transparent_75%,#2a2a30_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2">
        <canvas
          ref={workRef}
          className="max-h-full max-w-full touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      <div className="flex flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tool === "erase" ? "secondary" : "ghost"}
            className="flex-1"
            onClick={() => setTool("erase")}
          >
            <Eraser className="size-4" />
            Erase
          </Button>
          <Button
            type="button"
            variant={tool === "keep" ? "secondary" : "ghost"}
            className="flex-1"
            onClick={() => setTool("keep")}
          >
            <Paintbrush className="size-4" />
            Keep
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={onAuto}>
            <Sparkles className="size-4" />
            Auto
          </Button>
        </div>
        <label className="flex items-center gap-3 text-xs text-muted">
          Brush
          <input
            type="range"
            min={12}
            max={96}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1"
          />
        </label>
        <Button type="button" className="w-full" disabled={!ready} onClick={onDone}>
          Use this cut-out
        </Button>
        <p className="text-center text-xs text-muted">
          Tap a backdrop colour to knock a whole area out. Paint to tidy edges.
        </p>
      </div>
    </div>
  );
}
