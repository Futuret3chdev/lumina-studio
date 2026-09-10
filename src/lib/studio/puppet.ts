/** Slice a cut-out figure into a walkable puppet (head, torso, arms, thighs, shins). */

export type PuppetPart = {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  px: number;
  py: number;
};

export type PuppetRig = {
  fullW: number;
  fullH: number;
  pet: boolean;
  head: PuppetPart;
  torso: PuppetPart;
  armL: PuppetPart | null;
  armR: PuppetPart | null;
  thighL: PuppetPart;
  thighR: PuppetPart;
  shinL: PuppetPart;
  shinR: PuppetPart;
  neck: { x: number; y: number };
  shoulderL: { x: number; y: number };
  shoulderR: { x: number; y: number };
  hipL: { x: number; y: number };
  hipR: { x: number; y: number };
  kneeL: { x: number; y: number };
  kneeR: { x: number; y: number };
};

function alphaAt(data: Uint8ClampedArray, w: number, x: number, y: number) {
  return data[(y * w + x) * 4 + 3] ?? 0;
}

function copyRect(
  src: HTMLCanvasElement,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): HTMLCanvasElement | null {
  const w = Math.max(1, Math.round(x1 - x0));
  const h = Math.max(1, Math.round(y1 - y0));
  if (w < 2 || h < 2) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  return c;
}

function part(
  canvas: HTMLCanvasElement,
  px: number,
  py: number,
): PuppetPart {
  return { canvas, w: canvas.width, h: canvas.height, px, py };
}

function rowRuns(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number) {
  const runs: { a: number; b: number }[] = [];
  let start = -1;
  for (let x = x0; x <= x1; x += 1) {
    const on = alphaAt(data, w, x, y) > 18;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      runs.push({ a: start, b: x - 1 });
      start = -1;
    }
  }
  if (start >= 0) runs.push({ a: start, b: x1 });
  return runs;
}

function meanOpaque(
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
  const yb = Math.round(y1);
  for (let y = ya; y <= yb; y += 1) {
    for (let x = xa; x <= xb; x += 1) {
      const i = (y * w + x) * 4;
      if ((data[i + 3] ?? 0) < 28) continue;
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      n += 1;
    }
  }
  if (!n) return { r: 72, g: 68, b: 64 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function shade(c: { r: number; g: number; b: number }, m: number) {
  return `rgb(${Math.max(0, Math.min(255, Math.round(c.r * m)))},${Math.max(0, Math.min(255, Math.round(c.g * m)))},${Math.max(0, Math.min(255, Math.round(c.b * m)))})`;
}

/** Soft CGI limb that still wears the photo's colour — not a plastic doll. */
function cgiLimb(
  width: number,
  height: number,
  color: { r: number; g: number; b: number },
  photo: HTMLCanvasElement | null,
) {
  const w = Math.max(10, Math.round(width));
  const h = Math.max(14, Math.round(height));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const rad = Math.min(w / 2, h / 6);
  ctx.beginPath();
  ctx.moveTo(rad, 0);
  ctx.lineTo(w - rad, 0);
  ctx.quadraticCurveTo(w, 0, w, rad);
  ctx.lineTo(w, h - rad);
  ctx.quadraticCurveTo(w, h, w - rad, h);
  ctx.lineTo(rad, h);
  ctx.quadraticCurveTo(0, h, 0, h - rad);
  ctx.lineTo(0, rad);
  ctx.quadraticCurveTo(0, 0, rad, 0);
  ctx.closePath();
  const grd = ctx.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, shade(color, 0.58));
  grd.addColorStop(0.22, shade(color, 1.08));
  grd.addColorStop(0.5, shade(color, 1));
  grd.addColorStop(0.82, shade(color, 0.88));
  grd.addColorStop(1, shade(color, 0.5));
  ctx.fillStyle = grd;
  ctx.fill();
  if (photo) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.48;
    ctx.drawImage(photo, 0, 0, w, h);
    ctx.restore();
  }
  const rim = ctx.createLinearGradient(0, 0, 0, h);
  rim.addColorStop(0, "rgba(255,255,255,0.14)");
  rim.addColorStop(0.45, "rgba(255,255,255,0)");
  rim.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = rim;
  ctx.fill();
  return c;
}

function legsNeedStraighten(
  data: Uint8ClampedArray,
  w: number,
  minX: number,
  maxX: number,
  hipY: number,
  footY: number,
) {
  let split = 0;
  let joined = 0;
  let footSpan = 0;
  let footN = 0;
  const band = Math.max(1, Math.round((footY - hipY) * 0.18));
  for (let y = hipY; y <= footY; y += 2) {
    const runs = rowRuns(data, w, y, minX, maxX).filter((r) => r.b - r.a > 2);
    if (runs.length >= 2) split += 1;
    else joined += 1;
    if (y >= footY - band) {
      const span = runs.reduce((a, r) => a + (r.b - r.a), 0);
      footSpan += span;
      footN += 1;
    }
  }
  const hipW = Math.max(1, maxX - minX);
  const avgFoot = footN ? footSpan / footN : hipW;
  return joined >= split || avgFoot < hipW * 0.44;
}

export function buildPuppet(src: HTMLCanvasElement, petHint = false): PuppetRig | null {
  const w = src.width;
  const h = src.height;
  if (w < 8 || h < 8) return null;
  const ctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (alphaAt(data, w, x, y) < 18) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX - minX < 6 || maxY - minY < 8) return null;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const mid = minX + bw / 2;
  const pet = petHint || bh / Math.max(1, bw) < 1.22;

  let hipY = Math.round(minY + bh * (pet ? 0.42 : 0.52));
  for (let y = Math.round(minY + bh * 0.44); y < Math.round(minY + bh * 0.82); y += 1) {
    const runs = rowRuns(data, w, y, minX, maxX).filter((r) => r.b - r.a > 2);
    if (runs.length >= 2) {
      const gap = runs[1]!.a - runs[0]!.b;
      if (gap > bw * 0.04) {
        hipY = y;
        break;
      }
    }
  }

  const footY = maxY;
  const kneeY = Math.round(hipY + (footY - hipY) * 0.46);
  const neckY = Math.round(minY + bh * (pet ? 0.22 : 0.16));
  const shoulderY = Math.round(minY + bh * (pet ? 0.3 : 0.22));

  const hipRow = rowRuns(data, w, Math.min(maxY, hipY + 2), minX, maxX);
  let hipL = minX + bw * 0.28;
  let hipR = minX + bw * 0.72;
  if (hipRow.length >= 2) {
    hipL = (hipRow[0]!.a + hipRow[0]!.b) / 2;
    hipR = (hipRow[hipRow.length - 1]!.a + hipRow[hipRow.length - 1]!.b) / 2;
  }

  const chestRuns = rowRuns(data, w, shoulderY, minX, maxX);
  let leftEdge = minX;
  let rightEdge = maxX;
  if (chestRuns.length) {
    leftEdge = chestRuns[0]!.a;
    rightEdge = chestRuns[chestRuns.length - 1]!.b;
  }
  const chestW = rightEdge - leftEdge;
  const armCut = Math.max(6, chestW * (pet ? 0.18 : 0.22));
  const torsoLeft = leftEdge + armCut;
  const torsoRight = rightEdge - armCut;

  const headC = copyRect(src, minX, minY, maxX + 1, neckY + 2);
  const torsoC = copyRect(src, torsoLeft, neckY, torsoRight + 1, hipY + 2);
  const armLC = copyRect(src, minX, shoulderY, torsoLeft + 2, hipY - 4);
  const armRC = copyRect(src, torsoRight - 2, shoulderY, maxX + 1, hipY - 4);

  const straighten = !pet && legsNeedStraighten(data, w, minX, maxX, hipY, footY);
  const thighH = Math.max(16, kneeY - hipY);
  const shinH = Math.max(16, footY - kneeY);
  const thighW = Math.max(12, bw * (straighten ? 0.2 : 0.28));
  const shinW = Math.max(10, bw * (straighten ? 0.16 : 0.24));
  const pants = meanOpaque(data, w, minX, hipY, maxX, kneeY);
  const lower = meanOpaque(data, w, minX, kneeY, maxX, footY - 6);
  const photoThigh = copyRect(src, minX, hipY, maxX + 1, kneeY + 1);
  const photoShin = copyRect(src, minX, kneeY, maxX + 1, footY + 1);

  const thighLC = straighten
    ? cgiLimb(thighW, thighH, pants, photoThigh)
    : copyRect(src, minX, hipY, mid + 1, kneeY + 2);
  const thighRC = straighten
    ? cgiLimb(thighW, thighH, pants, photoThigh)
    : copyRect(src, mid, hipY, maxX + 1, kneeY + 2);
  const shinLC = straighten
    ? cgiLimb(shinW, shinH, lower, photoShin)
    : copyRect(src, minX, kneeY, mid + 1, footY + 1);
  const shinRC = straighten
    ? cgiLimb(shinW, shinH, lower, photoShin)
    : copyRect(src, mid, kneeY, maxX + 1, footY + 1);

  if (!headC || !torsoC || !thighLC || !thighRC || !shinLC || !shinRC) return null;

  const neck = { x: mid, y: neckY };
  const shoulderL = { x: torsoLeft, y: shoulderY + 4 };
  const shoulderR = { x: torsoRight, y: shoulderY + 4 };
  const stance = straighten ? bw * 0.11 : 0;
  const hipLp = { x: (straighten ? mid - stance : hipL), y: hipY };
  const hipRp = { x: (straighten ? mid + stance : hipR), y: hipY };
  const kneeL = { x: hipLp.x, y: kneeY };
  const kneeR = { x: hipRp.x, y: kneeY };

  const rel = (c: HTMLCanvasElement, originX: number, originY: number, jx: number, jy: number) =>
    part(c, jx - originX, jy - originY);

  return {
    fullW: w,
    fullH: h,
    pet,
    head: rel(headC, minX, minY, neck.x, neck.y),
    torso: rel(torsoC, torsoLeft, neckY, mid, hipY),
    armL: armLC ? rel(armLC, minX, shoulderY, shoulderL.x, shoulderL.y) : null,
    armR: armRC ? rel(armRC, torsoRight - 2, shoulderY, shoulderR.x, shoulderR.y) : null,
    thighL: straighten ? part(thighLC, thighLC.width / 2, 2) : rel(thighLC, minX, hipY, hipLp.x, hipLp.y),
    thighR: straighten ? part(thighRC, thighRC.width / 2, 2) : rel(thighRC, mid, hipY, hipRp.x, hipRp.y),
    shinL: straighten ? part(shinLC, shinLC.width / 2, 2) : rel(shinLC, minX, kneeY, kneeL.x, kneeL.y),
    shinR: straighten ? part(shinRC, shinRC.width / 2, 2) : rel(shinRC, mid, kneeY, kneeR.x, kneeR.y),
    neck,
    shoulderL,
    shoulderR,
    hipL: hipLp,
    hipR: hipRp,
    kneeL,
    kneeR,
  };
}
