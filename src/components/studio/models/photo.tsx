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

const COLS = 112;
const ROWS = 112;
const SKIP_SKIN = /glass|tire|rim|hub|shadow|light/i;

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
      const pz = lum * depth;
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
  const depth = n(params, "depth", 0.38);
  const cutout = n(params, "cutout", 1);
  const thickness = n(params, "thickness", 0.1);
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
  const frameDepth = 0.07;

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
            metalness={metalness}
            roughness={roughness}
            side={DoubleSide}
            envMapIntensity={1.05}
          />
        </mesh>
      ) : texture ? (
        <mesh position={[0, frame.h / 2, 0.01]} castShadow name="PhotoPlate">
          <planeGeometry args={[frame.w, frame.h]} />
          <meshStandardMaterial
            map={texture}
            metalness={metalness}
            roughness={roughness}
            side={DoubleSide}
            envMapIntensity={1.05}
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
