export type NpcLook = {
  face: HTMLCanvasElement;
  top: string;
  pants: string;
  skin: string;
  hair: string;
  boot: string;
};

function rgb(r: number, g: number, b: number) {
  return `rgb(${r},${g},${b})`;
}

function mean(
  data: Uint8ClampedArray,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const xa = Math.max(0, Math.round(x0));
  const xb = Math.min(w - 1, Math.round(x1));
  const ya = Math.max(0, Math.round(y0));
  const yb = Math.min(data.length / 4 / w - 1, Math.round(y1));
  for (let y = ya; y <= yb; y += 2) {
    for (let x = xa; x <= xb; x += 2) {
      const i = (y * w + x) * 4;
      if ((data[i + 3] ?? 0) < 40) continue;
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      n += 1;
    }
  }
  if (!n) return { r: 80, g: 80, b: 80 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

export function npcLook(src: HTMLCanvasElement): NpcLook {
  const w = src.width;
  const h = src.height;
  const ctx = src.getContext("2d", { willReadFrequently: true });
  const face = document.createElement("canvas");
  face.width = 256;
  face.height = 256;
  if (!ctx || w < 8 || h < 8) {
    return {
      face,
      top: "#2f6f5e",
      pants: "#1f4f44",
      skin: "#e7cbb6",
      hair: "#1c1917",
      boot: "#27272a",
    };
  }
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) < 40) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const fx = minX + bw * 0.22;
  const fy = minY + bh * 0.02;
  const fw = bw * 0.56;
  const fh = bh * 0.28;
  const fctx = face.getContext("2d");
  if (fctx) {
    fctx.fillStyle = "#e7cbb6";
    fctx.fillRect(0, 0, 256, 256);
    fctx.drawImage(src, fx, fy, fw, fh, 0, 0, 256, 256);
  }
  const hair = mean(data, w, minX + bw * 0.3, minY, minX + bw * 0.7, minY + bh * 0.12);
  const skin = mean(data, w, fx, fy + fh * 0.35, fx + fw, fy + fh * 0.85);
  const top = mean(data, w, minX + bw * 0.25, minY + bh * 0.32, minX + bw * 0.75, minY + bh * 0.5);
  const pants = mean(data, w, minX + bw * 0.28, minY + bh * 0.58, minX + bw * 0.72, minY + bh * 0.82);
  const boot = mean(data, w, minX + bw * 0.3, minY + bh * 0.88, minX + bw * 0.7, maxY);
  return {
    face,
    top: rgb(top.r, top.g, top.b),
    pants: rgb(pants.r, pants.g, pants.b),
    skin: rgb(skin.r, skin.g, skin.b),
    hair: rgb(hair.r, hair.g, hair.b),
    boot: rgb(boot.r, boot.g, boot.b),
  };
}
