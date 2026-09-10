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
  const thighLC = copyRect(src, minX, hipY, mid + 1, kneeY + 2);
  const thighRC = copyRect(src, mid, hipY, maxX + 1, kneeY + 2);
  const shinLC = copyRect(src, minX, kneeY, mid + 1, footY + 1);
  const shinRC = copyRect(src, mid, kneeY, maxX + 1, footY + 1);

  if (!headC || !torsoC || !thighLC || !thighRC || !shinLC || !shinRC) return null;

  const neck = { x: mid, y: neckY };
  const shoulderL = { x: torsoLeft, y: shoulderY + 4 };
  const shoulderR = { x: torsoRight, y: shoulderY + 4 };
  const hipLp = { x: hipL, y: hipY };
  const hipRp = { x: hipR, y: hipY };
  const kneeL = { x: hipL, y: kneeY };
  const kneeR = { x: hipR, y: kneeY };

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
    thighL: rel(thighLC, minX, hipY, hipLp.x, hipLp.y),
    thighR: rel(thighRC, mid, hipY, hipRp.x, hipRp.y),
    shinL: rel(shinLC, minX, kneeY, kneeL.x, kneeL.y),
    shinR: rel(shinRC, mid, kneeY, kneeR.x, kneeR.y),
    neck,
    shoulderL,
    shoulderR,
    hipL: hipLp,
    hipR: hipRp,
    kneeL,
    kneeR,
  };
}
