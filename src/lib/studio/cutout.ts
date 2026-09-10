/** Knock the studio/backdrop off a person photo. Returns a cropped RGBA canvas. */

export type PersonCutout = {
  canvas: HTMLCanvasElement;
  fullBody: boolean;
  aspect: number;
};

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4;
}

function dist(r: number, g: number, b: number, r2: number, g2: number, b2: number) {
  return Math.hypot(r - r2, g - g2, b - b2);
}

export function cutoutPerson(img: CanvasImageSource, sw: number, sh: number): PersonCutout | null {
  const max = 512;
  const scale = Math.min(1, max / Math.max(sw, sh, 1));
  const w = Math.max(8, Math.round(sw * scale));
  const h = Math.max(8, Math.round(sh * scale));
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  let br = 0;
  let bg = 0;
  let bb = 0;
  const samples = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
    [Math.floor(w / 2), 2],
    [2, Math.floor(h / 2)],
    [w - 3, Math.floor(h / 2)],
  ];
  for (const [x, y] of samples) {
    const i = idx(x, y, w);
    br += d[i] ?? 0;
    bg += d[i + 1] ?? 0;
    bb += d[i + 2] ?? 0;
  }
  br /= samples.length;
  bg /= samples.length;
  bb /= samples.length;

  const keep = new Uint8Array(w * h);
  keep.fill(1);
  const seen = new Uint8Array(w * h);
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    seen[p] = 1;
    qx[qt] = x;
    qy[qt] = y;
    qt += 1;
  };
  for (let x = 0; x < w; x += 1) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y += 1) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  const bgTol = 48;
  const runTol = 28;
  while (qh < qt) {
    const x = qx[qh]!;
    const y = qy[qh]!;
    qh += 1;
    const i = idx(x, y, w);
    const r = d[i] ?? 0;
    const g = d[i + 1] ?? 0;
    const b = d[i + 2] ?? 0;
    if (dist(r, g, b, br, bg, bb) > bgTol + 18) continue;
    keep[y * w + x] = 0;
    const neighbors: [number, number][] = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = idx(nx, ny, w);
      if (dist(r, g, b, d[ni] ?? 0, d[ni + 1] ?? 0, d[ni + 2] ?? 0) <= runTol) {
        enqueue(nx, ny);
      }
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      const i = p * 4;
      if (!keep[p]) {
        d[i + 3] = 0;
        continue;
      }
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (edge < 6 && dist(r, g, b, br, bg, bb) < bgTol + 8) {
        d[i + 3] = 0;
      }
    }
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let solid = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if ((d[(y * w + x) * 4 + 3] ?? 0) < 16) continue;
      solid += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (solid < 80 || maxX <= minX || maxY <= minY) return null;

  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.putImageData(image, -minX, -minY);
  return {
    canvas: out,
    fullBody: ch / Math.max(1, cw) >= 1.28,
    aspect: cw / Math.max(1, ch),
  };
}

export function looksLikePersonShot(aspect: number) {
  return aspect > 0 && aspect < 0.92;
}
