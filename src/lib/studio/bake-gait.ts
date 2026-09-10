import type { PuppetPart, PuppetRig } from "@/lib/studio/puppet";
import type { Gait } from "@/lib/studio/walk";

function rotPt(x: number, y: number, ox: number, oy: number, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = x - ox;
  const dy = y - oy;
  return { x: ox + dx * c - dy * s, y: oy + dx * s + dy * c };
}

function blit(
  ctx: CanvasRenderingContext2D,
  part: PuppetPart | null,
  x: number,
  y: number,
  rot: number,
  scale: number,
) {
  if (!part) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.drawImage(part.canvas, -part.px, -part.py);
  ctx.restore();
}

function poseAt(gait: Gait, t: number) {
  const s = Math.sin(t * Math.PI * 2);
  const c = Math.cos(t * Math.PI * 2);
  return {
    hipL: s * gait.stride * 0.55,
    hipR: -s * gait.stride * 0.55,
    kneeL: Math.max(0, -s) * gait.stride * 0.7,
    kneeR: Math.max(0, s) * gait.stride * 0.7,
    armL: -s * gait.arms * 0.55,
    armR: s * gait.arms * 0.55,
    bob: Math.abs(s) * gait.bob * 80,
    sway: c * gait.sway * 0.12,
  };
}

export function bakeGait(
  src: HTMLCanvasElement,
  rig: PuppetRig | null,
  gait: Gait,
): HTMLCanvasElement[] {
  const frames = gait.speed < 0.05 ? 1 : 8;
  const outW = 360;
  const outH = 640;
  const list: HTMLCanvasElement[] = [];
  for (let i = 0; i < frames; i += 1) {
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d");
    if (!ctx) {
      list.push(c);
      continue;
    }
    const t = frames === 1 ? 0 : i / frames;
    if (!rig) {
      const bob = frames === 1 ? 0 : Math.abs(Math.sin(t * Math.PI * 2)) * 12;
      const scale = Math.min(outW / src.width, outH / src.height) * 0.92;
      const x = (outW - src.width * scale) / 2;
      const y = (outH - src.height * scale) / 2 - bob;
      ctx.drawImage(src, x, y, src.width * scale, src.height * scale);
      list.push(c);
      continue;
    }
    const pose = poseAt(gait, t);
    const scale = Math.min(outW / rig.fullW, outH / rig.fullH) * 0.9;
    const ox = (outW - rig.fullW * scale) / 2;
    const oy = (outH - rig.fullH * scale) / 2 - pose.bob * scale;
    const sx = (x: number) => ox + x * scale;
    const sy = (y: number) => oy + y * scale;
    ctx.translate(outW / 2, outH * 0.92);
    ctx.rotate(pose.sway);
    ctx.translate(-outW / 2, -outH * 0.92);

    const kneeLW = rotPt(rig.kneeL.x, rig.kneeL.y, rig.hipL.x, rig.hipL.y, pose.hipL);
    const kneeRW = rotPt(rig.kneeR.x, rig.kneeR.y, rig.hipR.x, rig.hipR.y, pose.hipR);

    blit(ctx, rig.armL, sx(rig.shoulderL.x), sy(rig.shoulderL.y), pose.armL, scale);
    blit(ctx, rig.thighL, sx(rig.hipL.x), sy(rig.hipL.y), pose.hipL, scale);
    blit(ctx, rig.shinL, sx(kneeLW.x), sy(kneeLW.y), pose.hipL + pose.kneeL, scale);
    blit(ctx, rig.thighR, sx(rig.hipR.x), sy(rig.hipR.y), pose.hipR, scale);
    blit(ctx, rig.shinR, sx(kneeRW.x), sy(kneeRW.y), pose.hipR + pose.kneeR, scale);
    blit(ctx, rig.torso, sx(rig.hipL.x * 0.5 + rig.hipR.x * 0.5), sy(rig.hipL.y), 0, scale);
    blit(ctx, rig.armR, sx(rig.shoulderR.x), sy(rig.shoulderR.y), pose.armR, scale);
    blit(ctx, rig.head, sx(rig.neck.x), sy(rig.neck.y), pose.sway * 0.4, scale);
    list.push(c);
  }
  return list;
}
