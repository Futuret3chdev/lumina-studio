export type GaitId = "still" | "walk" | "run" | "bounce";

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
  { id: "walk", label: "Walk", speed: 6.2, arms: 1.05, stride: 0.78, bob: 0.04, sway: 0.04 },
  { id: "run", label: "Run", speed: 9.4, arms: 1.45, stride: 1.12, bob: 0.07, sway: 0.05 },
  { id: "bounce", label: "Bounce", speed: 7.6, arms: 0.55, stride: 0.28, bob: 0.14, sway: 0.03 },
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
