export type GaitId = "still" | "walk" | "stroll" | "strut" | "march" | "bounce";

export type Gait = {
  id: GaitId;
  label: string;
  speed: number;
  arms: number;
  stride: number;
  bob: number;
  sway: number;
};

export const GAITS: Gait[] = [
  { id: "still", label: "Stand", speed: 0, arms: 0, stride: 0, bob: 0, sway: 0 },
  { id: "walk", label: "Walk", speed: 6.4, arms: 1.05, stride: 0.78, bob: 0.045, sway: 0.06 },
  { id: "stroll", label: "Stroll", speed: 4.2, arms: 0.62, stride: 0.48, bob: 0.02, sway: 0.04 },
  { id: "strut", label: "Strut", speed: 5.8, arms: 1.25, stride: 0.95, bob: 0.07, sway: 0.08 },
  { id: "march", label: "March", speed: 7.6, arms: 1.45, stride: 1.12, bob: 0.055, sway: 0.03 },
  { id: "bounce", label: "Bounce", speed: 8.8, arms: 0.85, stride: 0.42, bob: 0.14, sway: 0.1 },
];

export function gaitFromParams(params: Record<string, number>): Gait & {
  speed: number;
  arms: number;
  stride: number;
  bob: number;
} {
  const idx = Math.max(0, Math.min(GAITS.length - 1, Math.round(params.gait ?? 1)));
  const base = GAITS[idx] ?? GAITS[1]!;
  const tempo = params.tempo ?? 1;
  const armsMul = params.arms ?? 1;
  const strideMul = params.stride ?? 1;
  const bounceMul = params.bounce ?? 1;
  return {
    ...base,
    speed: base.speed * tempo,
    arms: base.arms * armsMul,
    stride: base.stride * strideMul,
    bob: base.bob * bounceMul,
  };
}

export function applyGait(
  params: Record<string, number>,
  gait: Gait,
): Record<string, number> {
  return {
    ...params,
    gait: GAITS.findIndex((g) => g.id === gait.id),
    arms: 1,
    stride: 1,
    tempo: 1,
    bounce: 1,
  };
}
