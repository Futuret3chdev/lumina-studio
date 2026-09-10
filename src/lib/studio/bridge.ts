import type { Camera, Group, Scene, WebGLRenderer } from "three";

export const studioBridge: {
  gl: WebGLRenderer | null;
  scene: Scene | null;
  camera: Camera | null;
  group: Group | null;
} = {
  gl: null,
  scene: null,
  camera: null,
  group: null,
};
