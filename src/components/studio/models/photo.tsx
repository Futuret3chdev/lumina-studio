import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  SRGBColorSpace,
  Texture,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { loadPixels } from "@/lib/studio/photo";
import { n, Surface } from "./shared";
import type { MeshViewProps } from "@/lib/studio/types";

const COLS = 168;
const ROWS = 168;
const SKIP_SKIN = /glass|tire|rim|hub|shadow|light/i;

function blurField(
  src: Float32Array,
  cols: number,
  rows: number,
  radius: number,
  passes = 2,
) {
  if (radius < 1) return src.slice();
  const tmp = new Float32Array(src.length);
  let cur = src.slice();
  const k = radius * 2 + 1;
  for (let p = 0; p < passes; p += 1) {
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols;
      let acc = 0;
      for (let i = -radius; i <= radius; i += 1) {
        const x = i < 0 ? 0 : i >= cols ? cols - 1 : i;
        acc += cur[row + x]!;
      }
      for (let x = 0; x < cols; x += 1) {
        tmp[row + x] = acc / k;
        const leave = x - radius;
        const enter = x + radius + 1;
        acc -= cur[row + (leave < 0 ? 0 : leave)]!;
        acc += cur[row + (enter >= cols ? cols - 1 : enter)]!;
      }
    }
    for (let x = 0; x < cols; x += 1) {
      let acc = 0;
      for (let i = -radius; i <= radius; i += 1) {
        const y = i < 0 ? 0 : i >= rows ? rows - 1 : i;
        acc += tmp[y * cols + x]!;
      }
      for (let y = 0; y < rows; y += 1) {
        cur[y * cols + x] = acc / k;
        const leave = y - radius;
        const enter = y + radius + 1;
        acc -= tmp[(leave < 0 ? 0 : leave) * cols + x]!;
        acc += tmp[(enter >= rows ? rows - 1 : enter) * cols + x]!;
      }
    }
  }
  return cur;
}

function percentile(arr: Float32Array, p: number) {
  const copy = Array.from(arr);
  copy.sort((a, b) => a - b);
  const i = Math.min(
    copy.length - 1,
    Math.max(0, Math.floor(p * (copy.length - 1))),
  );
  return copy[i] ?? 0;
}

function remap01(arr: Float32Array, loP = 0.08, hiP = 0.92) {
  const lo = percentile(arr, loP);
  const hi = percentile(arr, hiP);
  const span = Math.max(0.04, hi - lo);
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i += 1) {
    const t = (arr[i]! - lo) / span;
    out[i] = t < 0 ? 0 : t > 1 ? 1 : t;
  }
  return out;
}

function subjectMask(data: Uint8ClampedArray, cols: number, rows: number) {
  let br = 0;
  let bg = 0;
  let bb = 0;
  let bn = 0;
  const add = (x: number, y: number) => {
    const i = (y * cols + x) * 4;
    br += data[i] ?? 0;
    bg += data[i + 1] ?? 0;
    bb += data[i + 2] ?? 0;
    bn += 1;
  };
  for (let x = 0; x < cols; x += 1) {
    add(x, 0);
    add(x, rows - 1);
  }
  for (let y = 1; y < rows - 1; y += 1) {
    add(0, y);
    add(cols - 1, y);
  }
  br /= bn * 255;
  bg /= bn * 255;
  bb /= bn * 255;

  let cr = 0;
  let cg = 0;
  let cb = 0;
  let cn = 0;
  const x0 = Math.floor(cols * 0.3);
  const x1 = Math.ceil(cols * 0.7);
  const y0 = Math.floor(rows * 0.3);
  const y1 = Math.ceil(rows * 0.7);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * cols + x) * 4;
      cr += data[i] ?? 0;
      cg += data[i + 1] ?? 0;
      cb += data[i + 2] ?? 0;
      cn += 1;
    }
  }
  cr /= cn * 255;
  cg /= cn * 255;
  cb /= cn * 255;

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.hypot(cx, cy) || 1;
  const mask = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = (y * cols + x) * 4;
      const r = (data[i] ?? 0) / 255;
      const g = (data[i + 1] ?? 0) / 255;
      const b = (data[i + 2] ?? 0) / 255;
      const dBg = Math.hypot(r - br, g - bg, b - bb);
      const dFg = Math.hypot(r - cr, g - cg, b - cb);
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
      const dist = Math.hypot(x - cx, y - cy) / maxR;
      const center = Math.exp(-dist * dist * 2.6);
      mask[y * cols + x] = (dBg - dFg) * 1.7 + center * 0.5 + sat * 0.28;
    }
  }
  const scored = remap01(mask, 0.14, 0.86);
  for (let i = 0; i < scored.length; i += 1) {
    const t = scored[i]!;
    scored[i] = t * t * (3 - 2 * t);
  }
  return blurField(scored, cols, rows, 5, 2);
}

function chamfer(mask: Float32Array, cols: number, rows: number) {
  const inf = cols + rows;
  const dist = new Float32Array(cols * rows);
  for (let i = 0; i < dist.length; i += 1) {
    dist[i] = mask[i]! > 0.42 ? inf : 0;
  }
  const ortho = 1;
  const diag = 1.41421356;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x;
      if (dist[i] === 0) continue;
      let v = dist[i]!;
      if (x > 0) v = Math.min(v, dist[i - 1]! + ortho);
      if (y > 0) v = Math.min(v, dist[i - cols]! + ortho);
      if (x > 0 && y > 0) v = Math.min(v, dist[i - cols - 1]! + diag);
      if (x + 1 < cols && y > 0) v = Math.min(v, dist[i - cols + 1]! + diag);
      dist[i] = v;
    }
  }
  for (let y = rows - 1; y >= 0; y -= 1) {
    for (let x = cols - 1; x >= 0; x -= 1) {
      const i = y * cols + x;
      if (dist[i] === 0) continue;
      let v = dist[i]!;
      if (x + 1 < cols) v = Math.min(v, dist[i + 1]! + ortho);
      if (y + 1 < rows) v = Math.min(v, dist[i + cols]! + ortho);
      if (x + 1 < cols && y + 1 < rows) v = Math.min(v, dist[i + cols + 1]! + diag);
      if (x > 0 && y + 1 < rows) v = Math.min(v, dist[i + cols - 1]! + diag);
      dist[i] = v;
    }
  }
  let max = 0.0001;
  for (let i = 0; i < dist.length; i += 1) {
    if (dist[i]! < inf) max = Math.max(max, dist[i]!);
  }
  for (let i = 0; i < dist.length; i += 1) {
    dist[i] = dist[i]! >= inf ? 0 : dist[i]! / max;
  }
  return blurField(dist, cols, rows, 4, 2);
}

function laplacian(heights: Float32Array, cols: number, rows: number, times = 2) {
  const next = new Float32Array(heights.length);
  let cur = heights;
  for (let t = 0; t < times; t += 1) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x;
        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
          next[i] = cur[i]!;
          continue;
        }
        next[i] =
          cur[i]! * 0.4 +
          (cur[i - 1]! + cur[i + 1]! + cur[i - cols]! + cur[i + cols]!) * 0.15;
      }
    }
    cur = next.slice();
  }
  return cur;
}

function edgeFalloff(x: number, y: number, cols: number, rows: number) {
  const m = 0.045;
  const u = x / (cols - 1);
  const v = y / (rows - 1);
  const dx = u < m ? u / m : u > 1 - m ? (1 - u) / m : 1;
  const dy = v < m ? v / m : v > 1 - m ? (1 - v) / m : 1;
  const e = Math.min(dx, dy);
  return e * e * (3 - 2 * e);
}

function buildHeights(data: Uint8ClampedArray, cols: number, rows: number) {
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i += 1) {
    const p = i * 4;
    lum[i] =
      (0.2126 * (data[p] ?? 0) +
        0.7152 * (data[p + 1] ?? 0) +
        0.0722 * (data[p + 2] ?? 0)) /
      255;
  }

  const form = remap01(blurField(lum, cols, rows, 8, 3), 0.1, 0.9);
  const mid = blurField(lum, cols, rows, 2, 2);
  const detail = new Float32Array(lum.length);
  for (let i = 0; i < lum.length; i += 1) {
    detail[i] = (lum[i]! - mid[i]!) * 2.4;
  }
  const detailN = remap01(detail, 0.12, 0.88);
  const mask = subjectMask(data, cols, rows);
  let plump = chamfer(mask, cols, rows);
  let plumpMax = 0;
  for (let i = 0; i < plump.length; i += 1) plumpMax = Math.max(plumpMax, plump[i]!);
  if (plumpMax < 0.08) {
    plump = blurField(form, cols, rows, 6, 2);
  }

  const heights = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x;
      const edge = edgeFalloff(x, y, cols, rows);
      const m = mask[i]! * edge;
      const z =
        plump[i]! * 0.74 +
        form[i]! * 0.18 * m +
        (detailN[i]! - 0.5) * 0.16 * m;
      heights[i] = Math.max(0, z) * edge;
    }
  }
  return laplacian(heights, cols, rows, 2);
}

function buildRelief(
  data: Uint8ClampedArray,
  aspect: number,
  depth: number,
  cutout: number,
  thickness: number,
) {
  const width = aspect >= 1 ? 2.2 : 2.2 * aspect;
  const height = aspect >= 1 ? 2.2 / aspect : 2.2;
  const geo = new BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const keep = new Uint8Array(COLS * ROWS);
  const keepAll = cutout >= 0.995;
  const heights = buildHeights(data, COLS, ROWS);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = (y * COLS + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = data[i + 3] ?? 255;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      keep[y * COLS + x] = a > 10 && (keepAll || lum <= cutout) ? 1 : 0;
      const px = (x / (COLS - 1) - 0.5) * width;
      const py = (1 - y / (ROWS - 1)) * height;
      const pz = heights[y * COLS + x]! * depth;
      positions.push(px, py, pz);
      uvs.push(x / (COLS - 1), 1 - y / (ROWS - 1));
    }
  }

  const frontCount = COLS * ROWS;
  for (let i = 0; i < frontCount; i += 1) {
    const x = i % COLS;
    const y = Math.floor(i / COLS);
    const px = (x / (COLS - 1) - 0.5) * width;
    const py = (1 - y / (ROWS - 1)) * height;
    positions.push(px, py, -thickness);
    uvs.push(uvs[i * 2]!, uvs[i * 2 + 1]!);
  }

  const push = (a: number, b: number, c: number) => {
    indices.push(a, b, c);
  };

  for (let y = 0; y < ROWS - 1; y += 1) {
    for (let x = 0; x < COLS - 1; x += 1) {
      const a = y * COLS + x;
      const b = a + 1;
      const c = a + COLS;
      const d = c + 1;
      if (keep[a] && keep[b] && keep[c]) push(a, c, b);
      if (keep[b] && keep[c] && keep[d]) push(b, c, d);
      if (keep[a] && keep[b] && keep[c]) {
        push(frontCount + a, frontCount + b, frontCount + c);
      }
      if (keep[b] && keep[c] && keep[d]) {
        push(frontCount + b, frontCount + d, frontCount + c);
      }
    }
  }

  const edge = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    outward: boolean,
  ) => {
    if (!keep[ay * COLS + ax] || !keep[by * COLS + bx]) return;
    const a = ay * COLS + ax;
    const b = by * COLS + bx;
    if (outward) {
      push(a, b, frontCount + a);
      push(b, frontCount + b, frontCount + a);
    } else {
      push(a, frontCount + a, b);
      push(b, frontCount + a, frontCount + b);
    }
  };

  for (let y = 0; y < ROWS - 1; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const here = keep[y * COLS + x];
      const down = keep[(y + 1) * COLS + x];
      if (here && (!down || x === 0 || x === COLS - 1)) {
        if (x === 0) edge(x, y, x, y + 1, false);
        if (x === COLS - 1) edge(x, y, x, y + 1, true);
        if (!down) edge(x, y, x, y + 1, true);
      }
    }
  }
  for (let x = 0; x < COLS - 1; x += 1) {
    for (let y = 0; y < ROWS; y += 1) {
      const here = keep[y * COLS + x];
      const right = keep[y * COLS + x + 1];
      if (here && (!right || y === 0 || y === ROWS - 1)) {
        if (y === 0) edge(x, y, x + 1, y, false);
        if (y === ROWS - 1) edge(x, y, x + 1, y, true);
        if (!right) edge(x, y, x + 1, y, true);
      }
    }
  }

  geo.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return { geo, width, height };
}

function usePhotoTexture(url: string | null | undefined) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let disposed = false;
    const img = new Image();
    if (url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed) return;
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      setTexture((prev) => {
        prev?.dispose();
        return tex;
      });
      invalidate();
    };
    img.onerror = () => {
      if (!disposed) setTexture(null);
    };
    img.src = url;
    return () => {
      disposed = true;
    };
  }, [url, invalidate]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  return texture;
}

export function PhotoMesh({
  params,
  accentColor,
  metalness,
  roughness,
  scale,
  photoUrl,
}: MeshViewProps) {
  const depth = n(params, "depth", 0.32);
  const cutout = n(params, "cutout", 1);
  const thickness = n(params, "thickness", 0.12);
  const invalidate = useThree((s) => s.invalidate);
  const [built, setBuilt] = useState<{
    geo: BufferGeometry;
    width: number;
    height: number;
  } | null>(null);
  const texture = usePhotoTexture(photoUrl);

  useEffect(() => {
    if (!photoUrl) {
      setBuilt(null);
      return;
    }
    let alive = true;
    void loadPixels(photoUrl, COLS, ROWS)
      .then(({ data, aspect }) => {
        if (!alive) return;
        const next = buildRelief(data, aspect, depth, cutout, thickness);
        setBuilt((prev) => {
          prev?.geo.dispose();
          return next;
        });
        invalidate();
      })
      .catch(() => {
        if (alive) setBuilt(null);
      });
    return () => {
      alive = false;
    };
  }, [photoUrl, depth, cutout, thickness, invalidate]);

  useEffect(
    () => () => {
      built?.geo.dispose();
    },
    [built],
  );

  const frame = useMemo(() => {
    const img = texture?.image as { width?: number; height?: number } | undefined;
    const aspect =
      img?.width && img?.height
        ? img.width / Math.max(1, img.height)
        : built
          ? built.width / Math.max(0.01, built.height)
          : 1;
    const w = aspect >= 1 ? 2.2 : 2.2 * aspect;
    const h = aspect >= 1 ? 2.2 / aspect : 2.2;
    return { w, h };
  }, [built, texture]);

  const border = 0.08;
  const frameDepth = 0.08;

  if (!photoUrl) {
    return (
      <group scale={scale}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[1.7, 1.7, 0.08]} />
          <Surface color="#1a1a1d" metalness={0.2} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={scale}>
      {built && texture ? (
        <mesh
          geometry={built.geo}
          castShadow
          receiveShadow
          position={[0, 0.02, 0]}
          name="PhotoRelief"
        >
          <meshStandardMaterial
            map={texture}
            metalness={Math.min(metalness, 0.18)}
            roughness={Math.max(roughness, 0.58)}
            side={DoubleSide}
            envMapIntensity={0.38}
          />
        </mesh>
      ) : texture ? (
        <mesh position={[0, frame.h / 2, 0.01]} castShadow name="PhotoPlate">
          <planeGeometry args={[frame.w, frame.h]} />
          <meshStandardMaterial
            map={texture}
            metalness={Math.min(metalness, 0.18)}
            roughness={Math.max(roughness, 0.58)}
            side={DoubleSide}
            envMapIntensity={0.38}
          />
        </mesh>
      ) : (
        <mesh position={[0, frame.h / 2, 0]} castShadow>
          <boxGeometry args={[frame.w, frame.h, 0.06]} />
          <Surface color="#1a1a1d" metalness={0.15} roughness={0.7} />
        </mesh>
      )}
      <mesh
        position={[0, frame.h / 2 + border / 2 + 0.02, -thickness / 2]}
        castShadow
        name="PhotoFrameTop"
      >
        <boxGeometry args={[frame.w + border * 2, border, frameDepth]} />
        <Surface color={accentColor} metalness={0.28} roughness={0.5} />
      </mesh>
      <mesh
        position={[0, -border / 2 + 0.02, -thickness / 2]}
        castShadow
        name="PhotoFrameBottom"
      >
        <boxGeometry args={[frame.w + border * 2, border, frameDepth]} />
        <Surface color={accentColor} metalness={0.28} roughness={0.5} />
      </mesh>
      <mesh
        position={[-(frame.w + border) / 2, frame.h / 2 + 0.02, -thickness / 2]}
        castShadow
        name="PhotoFrameLeft"
      >
        <boxGeometry args={[border, frame.h, frameDepth]} />
        <Surface color={accentColor} metalness={0.28} roughness={0.5} />
      </mesh>
      <mesh
        position={[(frame.w + border) / 2, frame.h / 2 + 0.02, -thickness / 2]}
        castShadow
        name="PhotoFrameRight"
      >
        <boxGeometry args={[border, frame.h, frameDepth]} />
        <Surface color={accentColor} metalness={0.28} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, -0.18]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.42]} />
        <Surface color={accentColor} metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function PhotoSkin({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const texture = usePhotoTexture(url);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !texture) return;
    const cloned: Material[] = [];
    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      if (SKIP_SKIN.test(mesh.name)) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const next = mats.map((mat) => {
        const std = mat as MeshStandardMaterial;
        if (std.transparent && (std.opacity ?? 1) < 0.9) return mat;
        const copy = mat.clone() as MeshStandardMaterial;
        if ("map" in copy) {
          copy.map = texture;
          copy.color.set("#ffffff");
          copy.needsUpdate = true;
        }
        cloned.push(copy);
        return copy;
      });
      mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
    });
    invalidate();
    return () => {
      cloned.forEach((mat) => mat.dispose());
    };
  }, [texture, url, invalidate]);

  return <group ref={ref}>{children}</group>;
}
