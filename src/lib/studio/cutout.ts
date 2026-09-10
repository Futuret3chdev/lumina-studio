/** Knock the studio/backdrop off a person or animal. Returns a cropped RGBA canvas. */

export type PersonCutout = {
  canvas: HTMLCanvasElement;
  fullBody: boolean;
  pet: boolean;
  aspect: number;
};

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4;
}

function dist(r: number, g: number, b: number, r2: number, g2: number, b2: number) {
  return Math.hypot(r - r2, g - g2, b - b2);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

function morph(
  src: Uint8Array,
  w: number,
  h: number,
  radius: number,
  dilate: boolean,
) {
  const out = new Uint8Array(src.length);
  const r = Math.max(1, radius);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let hit = dilate ? 0 : 1;
      for (let dy = -r; dy <= r && (dilate ? !hit : hit); dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const v = src[yy * w + xx]!;
          if (dilate) {
            if (v) {
              hit = 1;
              break;
            }
          } else if (!v) {
            hit = 0;
            break;
          }
        }
      }
      out[y * w + x] = hit;
    }
  }
  return out;
}

function largestComponent(keep: Uint8Array, w: number, h: number) {
  const seen = new Int32Array(w * h);
  seen.fill(-1);
  let best = -1;
  let bestSize = 0;
  let label = 0;
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  for (let i = 0; i < keep.length; i += 1) {
    if (!keep[i] || seen[i] >= 0) continue;
    let qh = 0;
    let qt = 0;
    const sx = i % w;
    const sy = (i / w) | 0;
    seen[i] = label;
    qx[qt] = sx;
    qy[qt] = sy;
    qt += 1;
    let size = 0;
    let cx = 0;
    let cy = 0;
    while (qh < qt) {
      const x = qx[qh]!;
      const y = qy[qh]!;
      qh += 1;
      size += 1;
      cx += x;
      cy += y;
      const nbs: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of nbs) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const p = ny * w + nx;
        if (!keep[p] || seen[p] >= 0) continue;
        seen[p] = label;
        qx[qt] = nx;
        qy[qt] = ny;
        qt += 1;
      }
    }
    const dx = cx / size - w / 2;
    const dy = cy / size - h / 2;
    const centered = size - Math.hypot(dx, dy) * 0.15;
    if (centered > bestSize) {
      bestSize = centered;
      best = label;
    }
    label += 1;
  }
  if (best < 0) return keep;
  const out = new Uint8Array(keep.length);
  for (let i = 0; i < keep.length; i += 1) {
    out[i] = seen[i] === best ? 1 : 0;
  }
  return out;
}

function fillHoles(keep: Uint8Array, w: number, h: number) {
  const outside = new Uint8Array(w * h);
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (keep[p] || outside[p]) return;
    outside[p] = 1;
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
  while (qh < qt) {
    const x = qx[qh]!;
    const y = qy[qh]!;
    qh += 1;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  const out = keep.slice();
  for (let i = 0; i < out.length; i += 1) {
    if (!outside[i]) out[i] = 1;
  }
  return out;
}

function cropFromData(d: Uint8ClampedArray, w: number, h: number): PersonCutout | null {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let solid = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if ((d[(y * w + x) * 4 + 3] ?? 0) < 18) continue;
      solid += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (solid < 80 || maxX <= minX || maxY <= minY) return null;
  const pad = 3;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const crop = octxImage(d, w, minX, minY, cw, ch);
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.putImageData(crop, 0, 0);
  const ratio = ch / Math.max(1, cw);
  return {
    canvas: out,
    fullBody: ratio >= 1.28,
    pet: ratio < 1.22,
    aspect: cw / Math.max(1, ch),
  };
}

export function cutoutPerson(img: CanvasImageSource, sw: number, sh: number): PersonCutout | null {
  const max = 560;
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

  let trans = 0;
  const nPix = w * h;
  for (let i = 3; i < d.length; i += 4) {
    if ((d[i] ?? 255) < 248) trans += 1;
  }
  if (trans > nPix * 0.03) {
    return cropFromData(d, w, h);
  }

  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.035));
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const clusters: { r: number; g: number; b: number }[] = [];
  const pushBorder = (x: number, y: number) => {
    const i = idx(x, y, w);
    rs.push(d[i] ?? 0);
    gs.push(d[i + 1] ?? 0);
    bs.push(d[i + 2] ?? 0);
  };
  for (let x = 0; x < w; x += 1) {
    for (let t = 0; t < ring; t += 1) {
      pushBorder(x, t);
      pushBorder(x, h - 1 - t);
    }
  }
  for (let y = ring; y < h - ring; y += 1) {
    for (let t = 0; t < ring; t += 1) {
      pushBorder(t, y);
      pushBorder(w - 1 - t, y);
    }
  }
  const mr = median(rs);
  const mg = median(gs);
  const mb = median(bs);
  clusters.push({ r: mr, g: mg, b: mb });
  const extremes = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
    [Math.floor(w / 2), 2],
    [Math.floor(w / 2), h - 3],
  ];
  for (const [x, y] of extremes) {
    const i = idx(x, y, w);
    const cr = d[i] ?? 0;
    const cg = d[i + 1] ?? 0;
    const cb = d[i + 2] ?? 0;
    if (clusters.every((c) => dist(cr, cg, cb, c.r, c.g, c.b) > 36)) {
      clusters.push({ r: cr, g: cg, b: cb });
    }
  }

  const nearestBg = (r: number, g: number, b: number) => {
    let best = 1e9;
    for (const c of clusters) {
      const v = dist(r, g, b, c.r, c.g, c.b);
      if (v < best) best = v;
    }
    return best;
  };

  const textured = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = idx(x, y, w);
      const l = (d[i] ?? 0) * 2 + (d[i + 1] ?? 0) * 3 + (d[i + 2] ?? 0);
      let acc = 0;
      let acc2 = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const j = idx(x + dx, y + dy, w);
          const v = (d[j] ?? 0) * 2 + (d[j + 1] ?? 0) * 3 + (d[j + 2] ?? 0);
          acc += v;
          acc2 += v * v;
        }
      }
      const mean = acc / 9;
      const vr = acc2 / 9 - mean * mean;
      if (vr > 2800) textured[y * w + x] = 1;
    }
  }

  const cx = (w - 1) / 2;
  const cy = (h - 1) * 0.46;
  const rx = w * 0.22;
  const ry = h * 0.28;
  const protectedCore = (x: number, y: number) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy < 1;
  };

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

  const bgTol = 58;
  const runTol = 34;
  while (qh < qt) {
    const x = qx[qh]!;
    const y = qy[qh]!;
    qh += 1;
    if (protectedCore(x, y)) continue;
    const i = idx(x, y, w);
    const r = d[i] ?? 0;
    const g = d[i + 1] ?? 0;
    const b = d[i + 2] ?? 0;
    if (textured[y * w + x] && nearestBg(r, g, b) > 24) continue;
    if (nearestBg(r, g, b) > bgTol) continue;
    keep[y * w + x] = 0;
    const nbs: [number, number][] = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of nbs) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (protectedCore(nx, ny)) continue;
      const ni = idx(nx, ny, w);
      if (dist(r, g, b, d[ni] ?? 0, d[ni + 1] ?? 0, d[ni + 2] ?? 0) <= runTol) {
        enqueue(nx, ny);
      }
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (protectedCore(x, y)) continue;
      const i = idx(x, y, w);
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (nearestBg(d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0) < bgTol - 6 && edge < Math.max(10, ring * 3)) {
        keep[y * w + x] = 0;
      }
    }
  }

  const opened = morph(morph(keep, w, h, 1, false), w, h, 2, true);
  const main = fillHoles(largestComponent(opened, w, h), w, h);
  const restored = new Uint8Array(w * h);
  for (let i = 0; i < restored.length; i += 1) {
    restored[i] = main[i] && keep[i] ? 1 : 0;
  }
  const mask = morph(morph(restored, w, h, 1, true), w, h, 1, false);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      const i = p * 4;
      if (!mask[p]) {
        d[i + 3] = 0;
        continue;
      }
      const edgeGap = (() => {
        let min = 9;
        for (let dy = -3; dy <= 3; dy += 1) {
          for (let dx = -3; dx <= 3; dx += 1) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h || !mask[yy * w + xx]) {
              const g = Math.hypot(dx, dy);
              if (g < min) min = g;
            }
          }
        }
        return min;
      })();
      if (edgeGap < 2.2) {
        d[i + 3] = Math.max(0, Math.min(255, Math.round(255 * (edgeGap / 2.2))));
      }
    }
  }

  return cropFromData(d, w, h);
}

function octxImage(
  src: Uint8ClampedArray,
  srcW: number,
  x0: number,
  y0: number,
  cw: number,
  ch: number,
) {
  const out = new ImageData(cw, ch);
  const d = out.data;
  for (let y = 0; y < ch; y += 1) {
    const sy = y0 + y;
    for (let x = 0; x < cw; x += 1) {
      const si = ((sy * srcW + (x0 + x)) * 4) | 0;
      const di = ((y * cw + x) * 4) | 0;
      d[di] = src[si] ?? 0;
      d[di + 1] = src[si + 1] ?? 0;
      d[di + 2] = src[si + 2] ?? 0;
      d[di + 3] = src[si + 3] ?? 0;
    }
  }
  return out;
}
