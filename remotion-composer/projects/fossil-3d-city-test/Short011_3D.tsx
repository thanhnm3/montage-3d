// Fossil Short 011 (2026-11-03): "Could a Saltwater Crocodile Survive the Dinosaur Era?" — 3D asset có sẵn + ink pass,
// MỘT cú máy liền từ đầu đến cuối (không cắt). Camera là spline Hermite qua các mốc CAM (giây tuyệt đối, khớp lời đọc).
// Một bản đồ duy nhất: dòng sông kỷ Phấn trắng chạy theo trục X (tâm z = zc(x)), bờ bắc (+z) có đàn mỏ vịt (75 Tr năm)
// rồi T. rex + Triceratops (66 Tr năm). Câu chuyện: cá sấu rơi từ trời xuống sông -> đo 6 m, cú đớp -> nước động ->
// Deinosuchus trồi lên cạnh, đo 7,7 m, đớp đuôi con mỏ vịt -> quay sang cá sấu ("snack?") -> "Not so fast": đóng băng,
// tua nhanh 75 -> 66 Tr năm -> thiên thạch, sóng xung kích, T. rex ngã, Triceratops ngã, tro rơi -> máy lặn xuống đáy sông:
// cá sấu nằm chờ (đếm ngày) -> trồi lên mặt nước dưới bầu trời trong -> "It already did".
// Model: caiman (Poly by Google, CC-BY) uốn đỉnh làm cá sấu + Deinosuchus; T. rex/Parasaurolophus/Triceratops Quaternius CC0;
// cây đá Kenney Nature Kit CC0. Nguồn: projects/fossil-mysteries-short-011-3d/public/free/CREDITS.md.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { C, CLAMP, Captions, EndCardView, FieldNote, Grain, HookHeadline, Ammonite, PANEL, mono, sans } from "./short008Overlays";
import type { SceneProps } from "./short008Overlays";
import { QAsset, useFBX } from "./QModel";
import { InkPass } from "./Ink";

type V3 = [number, number, number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ramp = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);
const TAU = Math.PI * 2;
const sstep = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getHexString();

// ------------------------------------------------------------------ mốc thời gian (giây, khớp props: beat 1..8)
// 0 hook | 4.43 sáu mét | 8.87 75 Tr năm | 13.33 Deinosuchus | 19.1 snack? | 22.27 thiên thạch | 28.37 dưới sông | 34.33 kết
const T_SPLASH = 2.22, T_SNAP = 7.36, T_LUNGE = 18.12, T_FREEZE = 21.0, T_LAPSE0 = 21.25, T_LAPSE1 = 22.35;
const T_ROAR = 23.0, T_IMPACT = 24.16, T_REXDIE = 25.0, T_TRIDIE = 26.45, T_WAVE = 27.2;
const T_DIVE = 29.9, T_RISE0 = 34.5, T_RISE1 = 36.3, T_STILL = 37.45;

// ------------------------------------------------------------------ địa hình
const zc = (x: number) => 2.5 * Math.sin(x / 23);
const BED = -2.4;
function noise2(x: number, z: number) {
  return Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * 0.5 + Math.sin(z * 0.13 + x * 0.05) * 0.35 + Math.sin((x + z) * 0.031) * 0.6;
}
export function ground(x: number, z: number): number {
  const d = Math.abs(z - zc(x));
  let h: number;
  if (d < 5.5) h = BED;
  else if (d < 10) h = lerp(BED, 0.1, sstep(5.5, 10, d));
  else if (d < 13) h = lerp(0.1, 0.55, sstep(10, 13, d));
  else h = 0.55 + 0.35 * noise2(x, z) * sstep(13, 30, d) + 6 * sstep(45, 110, d) * (0.6 + 0.4 * noise2(x * 0.5, z * 0.5)) + 40 * sstep(140, 260, d);
  return h;
}

const Terrain: React.FC = () => {
  const geo = useMemo(() => {
    const xs: number[] = [];
    for (let x = -320; x <= 320; x += 2) xs.push(x);
    const zs: number[] = [];
    for (let z = -330; z <= 330; ) {
      zs.push(z);
      const a = Math.abs(z);
      z += a < 22 ? 0.5 : a < 60 ? 1.5 : a < 140 ? 4 : 10;
    }
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const cBed = new THREE.Color("#4F4A3A"), cMud = new THREE.Color("#8A7A55"), cGrass = new THREE.Color("#6F8A44"),
      cGrass2 = new THREE.Color("#58743A"), cRock = new THREE.Color("#6E6A5E"), c = new THREE.Color();
    for (const z of zs)
      for (const x of xs) {
        // z lưới theo tâm sông để bờ luôn mịn
        const zz = z + zc(x);
        const h = ground(x, zz);
        pos.push(x, h, zz);
        const d = Math.abs(z);
        if (h < -0.3) c.copy(cBed);
        else if (h < 0.35) c.copy(cMud).lerp(cBed, sstep(0.3, -0.3, h));
        else c.copy(cGrass).lerp(cGrass2, 0.5 + 0.5 * Math.sin(x * 0.3 + zz * 0.21 + noise2(x, zz)));
        if (d > 50) c.lerp(cRock, sstep(60, 200, d) * 0.7);
        col.push(c.r, c.g, c.b);
      }
    const W = xs.length;
    for (let j = 0; j < zs.length - 1; j++)
      for (let i = 0; i < W - 1; i++) {
        const a = j * W + i, b = a + 1, cc = a + W, d = cc + 1;
        idx.push(a, cc, b, b, cc, d);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} flatShading />
    </mesh>
  );
};

// mặt nước: nhìn từ trên (mờ đục xanh rêu) + mặt dưới (sáng hơn, khi máy lặn)
const Water: React.FC<{ under: boolean; dark: number; clear?: number }> = ({ under, dark, clear = 0 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} renderOrder={2}>
      <planeGeometry args={[700, 60]} />
      <meshStandardMaterial color={mixC("#3F6E62", "#465A4C", dark)} emissive={mixC("#16302A", "#3A3A30", dark)} roughness={0.6} metalness={0} transparent opacity={under ? 0 : lerp(0.84, 0.45, clear)} depthWrite={!under} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} renderOrder={2}>
      <planeGeometry args={[700, 60]} />
      <meshBasicMaterial color={mixC("#8DB7A2", "#5B5E4E", dark)} transparent opacity={under ? 0.96 : 0} depthWrite={under} />
    </mesh>
  </group>
);

const Sky: React.FC<{ top: string; hor: string }> = ({ top, hor }) => {
  const geo = useMemo(() => new THREE.SphereGeometry(900, 32, 16), []);
  useMemo(() => {
    const pos = geo.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const T = new THREE.Color(top), H = new THREE.Color(hor), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 900;
      c.copy(H).lerp(T, THREE.MathUtils.smoothstep(y, -0.02, 0.45));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }, [geo, top, hor]);
  return (
    <mesh geometry={geo} userData={{ noNormal: true }}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

// ------------------------------------------------------------------ asset
const GLB_FILES = ["caiman", "tree_palmTall", "tree_palmDetailedTall", "tree_palmBend", "tree_palmShort", "tree_pineTallA", "tree_pineDefaultA",
  "tree_cone_dark", "plant_bushLarge", "plant_bushDetailed", "grass_leafsLarge", "grass_large", "rock_largeA", "rock_largeC", "rock_tallA",
  "lily_large", "log_large", "plant_flatTall"] as const;
type GName = (typeof GLB_FILES)[number];
type Assets = { glb: Record<GName, THREE.Group> };

function useAssets(): Assets | null {
  const [a, setA] = useState<Assets | null>(null);
  const [handle] = useState(() => delayRender("011 glb"));
  useEffect(() => {
    let alive = true;
    (async () => {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      const glb = {} as Record<GName, THREE.Group>;
      await Promise.all(GLB_FILES.map(async (n) => {
        const buf = await (await fetch(staticFile(`free/${n}.glb`))).arrayBuffer();
        glb[n] = await new Promise<THREE.Group>((res, rej) => loader.parse(buf, "", (g) => res(g.scene), rej));
      }));
      if (alive) setA({ glb });
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (a) continueRender(handle);
  }, [a, handle]);
  return a;
}

// Kenney: cỏ xanh ngọc + "dirt" cam -> bảng màu kỷ Phấn trắng
const NAME_COL: Record<string, string> = {
  grass: "#5F7F38", leafsGreen: "#56803A", leafsDark: "#3B5C30", dirt: "#7A7062", woodBark: "#6B4B33", woodBarkDark: "#4E3A2B",
  woodInner: "#C8A87E", colorRed: "#B9583F", _defaultMat: "#7A7062",
};
function flatClone(src: THREE.Group, tint?: string) {
  const o = src.clone(true);
  o.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mats = ([] as THREE.Material[]).concat(mesh.material).map((mt) => {
      const c = new THREE.Color(NAME_COL[mt.name] ?? "#777777");
      if (tint) c.lerp(new THREE.Color(tint), 0.25);
      return new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0, flatShading: true });
    });
    mesh.material = mats.length === 1 ? mats[0] : mats;
  });
  const box = new THREE.Box3().setFromObject(o);
  o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  const g = new THREE.Group();
  g.add(o);
  return { g, h: box.max.y - box.min.y };
}

type Plant = { n: GName; x: number; z: number; s: number; r: number };
const Flora: React.FC<{ A: Assets }> = ({ A }) => {
  const objs = useMemo(() => {
    const r = rng(11);
    const out: Plant[] = [];
    const busy = (x: number, z: number) => x > -2 && x < 24 && z > 9 && z < 26; // chỗ thú đứng ở bờ bắc
    const put = (n: GName, s: number, dmin: number, dmax: number, xr: [number, number], k: number, keepBusy = false) => {
      for (let i = 0; i < k; i++) {
        const x = lerp(xr[0], xr[1], r());
        const side = r() < 0.55 ? 1 : -1;
        const z = zc(x) + side * lerp(dmin, dmax, r() ** 1.3);
        if (!keepBusy && busy(x, z)) continue;
        out.push({ n, x, z, s: s * (0.75 + 0.5 * r()), r: r() * TAU });
      }
    };
    put("tree_palmTall", 9, 13, 40, [-70, 80], 34);
    put("tree_palmDetailedTall", 8, 12.5, 35, [-70, 80], 26);
    put("tree_palmBend", 7, 11.5, 22, [-60, 70], 16);
    put("tree_palmShort", 4, 11, 30, [-60, 70], 22);
    put("tree_pineTallA", 17, 22, 70, [-90, 100], 40);
    put("tree_pineDefaultA", 13, 20, 70, [-90, 100], 28);
    put("tree_cone_dark", 11, 25, 80, [-90, 100], 26);
    put("plant_bushLarge", 2.2, 11, 30, [-50, 60], 40);
    put("plant_bushDetailed", 1.6, 10.6, 26, [-50, 60], 40, true);
    put("grass_leafsLarge", 1.3, 10.3, 24, [-40, 50], 90, true);
    put("plant_flatTall", 1.4, 10.5, 24, [-40, 50], 40, true);
    put("rock_largeA", 1.8, 10, 40, [-50, 60], 16);
    put("rock_largeC", 1.4, 9.5, 30, [-50, 60], 14);
    put("rock_tallA", 4, 25, 60, [-60, 70], 8);
    put("log_large", 0.9, 10, 18, [-30, 40], 6);
    // lá súng sát mép nước
    for (let i = 0; i < 26; i++) {
      const x = lerp(-30, 40, r());
      out.push({ n: "lily_large", x, z: zc(x) + (r() < 0.5 ? 1 : -1) * lerp(7.2, 9.2, r()), s: 0.9, r: r() * TAU });
    }
    const path: V3[] = [];
    for (let t = 0; t <= 43.5; t += 0.08) path.push(camAt(t).p);
    for (let t = 0; t <= 3.2; t += 0.05) { const cp = crocState(Math.min(t, T_SPLASH)).p; path.push([cp[0] - 9, cp[1] + 3, cp[2] + 11.5]); }
    const tall = (n: GName) => n.startsWith("tree_pine") || n === "tree_cone_dark" || n === "tree_palmTall";
    const clear = out.filter((p) => {
      // cửa sổ trời phía sau T. rex: không cây cao để thấy quả cầu lửa ở chân trời
      if (tall(p.n) && p.x > -30 && p.x < 40 && p.z > zc(p.x) + 13 && p.z < 90) return false;
      const top = ground(p.x, p.z) + p.s;
      return !path.some((c) => Math.hypot(c[0] - p.x, c[2] - p.z) < 3.5 + p.s * 0.35 && top > c[1] - 1.5);
    });
    return clear.map((p) => {
      const { g, h } = flatClone(A.glb[p.n]);
      g.scale.setScalar(p.s / h);
      const y = p.n === "lily_large" ? 0.02 : ground(p.x, p.z) - 0.05;
      g.position.set(p.x, y, p.z);
      g.rotation.y = p.r;
      return g;
    });
  }, [A]);
  return (
    <>
      {objs.map((o, i) => <primitive key={i} object={o} />)}
    </>
  );
};

const Volcano: React.FC<{ T: number }> = ({ T }) => (
  <group position={[110, 0, 230]}>
    <mesh position={[0, 38, 0]} castShadow>
      <coneGeometry args={[95, 80, 9, 1, true]} />
      <meshStandardMaterial color="#5A5048" roughness={1} flatShading />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => {
      const k = ((T * 0.12 + i / 9) % 1);
      return (
        <mesh key={i} position={[k * 30 - 8, 78 + k * 70, -k * 12]} scale={8 + k * 26}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8C8478" roughness={1} flatShading transparent opacity={0.75 * (1 - k)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

// ------------------------------------------------------------------ cá sấu (caiman tĩnh, uốn đỉnh): đuôi quẫy, hàm mở
// model: dài theo +z (đầu +z, đuôi -z), 18 đơn vị, cao 2,19; khớp hàm ~ (z 5.6, y 1.05)
type CrocLook = { len: number; girth: number; back: string; belly: string; band: string };
const CROC: CrocLook = { len: 6, girth: 1, back: "#55603A", belly: "#CDBF8E", band: "#3C4429" };
const DEINO: CrocLook = { len: 7.7, girth: 1.32, back: "#4A443A", belly: "#A99C80", band: "#2F2A24" };
const HZ = 5.6, HY = 1.05;
const mouthY = (z: number) => 1.04 + (z - HZ) * 0.06;

type CrocRig = { geo: THREE.BufferGeometry; rest: Float32Array; lower: Uint8Array; upper: Uint8Array };
function buildCroc(src: THREE.Group, L: CrocLook): CrocRig {
  let mesh: THREE.Mesh | null = null;
  src.traverse((m) => { if ((m as THREE.Mesh).isMesh && !mesh) mesh = m as THREE.Mesh; });
  const geo = (mesh as unknown as THREE.Mesh).geometry.clone().toNonIndexed();
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  const n = geo.getAttribute("normal") as THREE.BufferAttribute;
  const rest = new Float32Array(p.array as Float32Array);
  const lower = new Uint8Array(p.count), upper = new Uint8Array(p.count);
  const col = new Float32Array(p.count * 3);
  const back = new THREE.Color(L.back), belly = new THREE.Color(L.belly), band = new THREE.Color(L.band), c = new THREE.Color();
  // hàm: gán NGUYÊN tam giác theo trọng tâm (gán theo đỉnh làm tam giác vắt qua khe miệng bị kéo thành song chắn)
  for (let t = 0; t < p.count; t += 3) {
    const cy = (rest[t * 3 + 1] + rest[t * 3 + 4] + rest[t * 3 + 7]) / 3, cz = (rest[t * 3 + 2] + rest[t * 3 + 5] + rest[t * 3 + 8]) / 3;
    if (cz > HZ - 0.2) for (let k = 0; k < 3; k++) (cy < mouthY(cz) ? lower : upper)[t + k] = 1;
  }
  for (let i = 0; i < p.count; i++) {
    const y = rest[i * 3 + 1], z = rest[i * 3 + 2];
    const ny = n.getY(i);
    const bel = Math.max(sstep(0.75, 0.35, y), sstep(-0.1, -0.6, ny));
    c.copy(back).lerp(belly, bel);
    if (z < 1 && Math.sin(z * 2.6) > 0.55 && bel < 0.5) c.lerp(band, 0.75); // vằn ngang trên đuôi
    if (y > 1.6 && z > -2 && z < 5) c.lerp(band, 0.35); // gờ vảy lưng sẫm
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return { geo, rest, lower, upper };
}

const Croc: React.FC<{ rig: CrocRig; L: CrocLook; pos: V3; yaw: number; T: number; swim: number; jaw: number; roll?: number; pitch?: number; scale?: number; tint?: number }> = ({ rig, L, pos, yaw, T, swim, jaw, roll = 0, pitch = 0, scale = 1, tint = 0 }) => {
  const geo = useMemo(() => rig.geo.clone(), [rig]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true }), []);
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  const a = p.array as Float32Array, R = rig.rest;
  const ca = Math.cos(jaw), sa = Math.sin(jaw), cu = Math.cos(-jaw * 0.45), su = Math.sin(-jaw * 0.45);
  for (let i = 0; i < p.count; i++) {
    let x = R[i * 3], y = R[i * 3 + 1], z = R[i * 3 + 2];
    if (rig.lower[i] || rig.upper[i]) {
      const dy = y - HY, dz = z - HZ;
      const [c0, s0] = rig.lower[i] ? [ca, sa] : [cu, su];
      y = HY + dy * c0 - dz * s0;
      z = HZ + dy * s0 + dz * c0;
    }
    if (z < 2.5) {
      const u = (2.5 - z) / 11.5;
      x += swim * 1.5 * Math.sin(T * 5.2 + z * 0.55) * u ** 1.5;
    } else if (z > 4) x += swim * 0.12 * Math.sin(T * 5.2 + 1.7);
    a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
  }
  p.needsUpdate = true;
  mat.emissive.set("#6FB2FF");
  mat.emissiveIntensity = tint;
  const s = (L.len / 18) * scale;
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <group rotation={[pitch, 0, roll]} scale={[s * L.girth, s * L.girth, s]}>
        <mesh geometry={geo} material={mat} castShadow receiveShadow frustumCulled={false} />
        {/* khoang miệng + răng: quay theo hàm dưới / hàm trên quanh khớp */}
        {jaw > 0.02 && (
          <>
            <group position={[0, HY, HZ]} rotation={[jaw, 0, 0]}>
              <mesh position={[0, 0.02, 1.6]}><boxGeometry args={[0.95, 0.05, 3.1]} /><meshStandardMaterial color="#B5675C" roughness={0.8} /></mesh>
              {[-1, 1].map((k) => Array.from({ length: 7 }, (_, j) => (
                <mesh key={`${k}${j}`} position={[k * (0.42 - j * 0.035), 0.12, 0.5 + j * 0.42]}><coneGeometry args={[0.05, 0.2, 5]} /><meshStandardMaterial color="#EFE6CF" roughness={0.5} /></mesh>
              )))}
            </group>
            <group position={[0, HY, HZ]} rotation={[-jaw * 0.45, 0, 0]}>
              <mesh position={[0, 0.06, 1.6]}><boxGeometry args={[0.95, 0.05, 3.1]} /><meshStandardMaterial color="#6E2E28" roughness={0.9} /></mesh>
              {[-1, 1].map((k) => Array.from({ length: 7 }, (_, j) => (
                <mesh key={`${k}${j}`} position={[k * (0.44 - j * 0.035), -0.04, 0.6 + j * 0.42]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.05, 0.22, 5]} /><meshStandardMaterial color="#EFE6CF" roughness={0.5} /></mesh>
              )))}
            </group>
          </>
        )}
        {/* mắt: hai chấm vàng có đồng tử dọc */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.5, 1.95, 4.95]}>
            <mesh scale={[0.2, 0.17, 0.24]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#D9B33C" roughness={0.4} />
            </mesh>
            <mesh position={[k * 0.12, 0.02, 0.06]} scale={[0.05, 0.15, 0.1]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#141210" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ khủng long Quaternius (clip theo thời gian, Death giữ khung cuối)
type QLook = { length: number; colors: Record<string, string> };
const REX: QLook = { length: 12, colors: { Green: "#6B5A40", LightGreen: "#B39B72", Black: "#1C1712", Red: "#8E3B2E", LightYellow: "#E8D9A8" } };
const PARA: QLook = { length: 9.5, colors: { Green: "#5E7A4C", LightGreen: "#C2B585", LightYellow: "#E8D9A8", Red: "#B4553A" } };
const TRI: QLook = { length: 8.5, colors: { Purple: "#6E5A48", LightBrown: "#CDB48C", Brown: "#4C3A2C" } };

const Dino: React.FC<{ asset: QAsset; look: QLook; clip: string; ct: number; once?: boolean; pos: V3; yaw: number; scale?: number }> = ({ asset, look, clip, ct, once, pos, yaw, scale = 1 }) => {
  const inst = useMemo(() => {
    const o = SkeletonUtils.clone(asset.obj) as THREE.Group;
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const mats = ([] as THREE.Material[]).concat(mesh.material);
      const nm = mats.map((mt) => new THREE.MeshStandardMaterial({ color: new THREE.Color(look.colors[mt.name] ?? "#888888"), roughness: 0.85, flatShading: true }));
      mesh.material = nm.length === 1 ? nm[0] : nm;
    });
    return { o, mixer: new THREE.AnimationMixer(o), actions: new Map<string, THREE.AnimationAction>() };
  }, [asset, look]);
  const c = asset.clips.find((k) => k.name.toLowerCase().endsWith(`_${clip.toLowerCase()}`)) ?? asset.clips[0];
  let act = inst.actions.get(c.name);
  if (!act) {
    act = inst.mixer.clipAction(c);
    inst.actions.set(c.name, act);
  }
  inst.mixer.stopAllAction();
  act.play();
  inst.mixer.setTime(once ? Math.min(Math.max(ct, 0), c.duration - 0.02) : ((ct % c.duration) + c.duration) % c.duration);
  const s = (look.length / asset.len) * scale;
  if (scale <= 0.001) return null;
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <group rotation={[0, -Math.PI / 2, 0]} scale={s}>
        <primitive object={inst.o} position={[-asset.center.x, -asset.minY, -asset.center.z]} />
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ hiệu ứng
const Splash: React.FC<{ t: number; p: V3; n?: number; size?: number }> = ({ t, p, n = 40, size = 1 }) => {
  const parts = useMemo(() => {
    const r = rng(n * 7 + Math.round(p[0] * 10));
    return Array.from({ length: n }, () => ({ a: r() * TAU, v: (2 + r() * 5) * size, up: (4 + r() * 7) * size, s: 0.08 + r() * 0.16 }));
  }, [n, p, size]);
  if (t < 0 || t > 2.2) return null;
  return (
    <group position={p}>
      {parts.map((q, i) => {
        const y = q.up * t - 4.9 * t * t;
        if (y < -0.2) return null;
        return (
          <mesh key={i} position={[Math.cos(q.a) * q.v * t, y, Math.sin(q.a) * q.v * t]} scale={q.s * size}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#E6F1EC" roughness={0.3} />
          </mesh>
        );
      })}
      {[0, 0.35].map((d, i) => {
        const k = t - d;
        if (k < 0 || k > 1.8) return null;
        const R = (0.6 + k * 4) * size;
        return (
          <mesh key={`r${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03 - p[1], 0]}>
            <ringGeometry args={[R, R + 0.18 * size, 48]} />
            <meshBasicMaterial color="#EEF6F2" transparent opacity={0.85 * (1 - k / 1.8)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// vệt sóng chữ V trên mặt nước (thứ gì đó đang bơi bên dưới)
const Wake: React.FC<{ p: V3; yaw: number; k: number; T: number; len?: number }> = ({ p, yaw, k, T, len = 5 }) => {
  if (k <= 0.01) return null;
  return (
    <group position={[p[0], 0.02, p[2]]} rotation={[0, yaw, 0]}>
      {Array.from({ length: 8 }, (_, i) => {
        const u = ((T * 1.4 + i / 8) % 1);
        const back = -u * len;
        const w = 0.4 + u * 2.4;
        return [-1, 1].map((sd) => (
          <mesh key={`${i}${sd}`} position={[sd * w * 0.5, 0, back]} rotation={[-Math.PI / 2, 0, sd * 0.5]}>
            <planeGeometry args={[0.14, 0.9]} />
            <meshBasicMaterial color="#E4EEE8" transparent opacity={0.8 * k * (1 - u)} depthWrite={false} />
          </mesh>
        ));
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#DDE9E2" transparent opacity={0.35 * k} depthWrite={false} />
      </mesh>
    </group>
  );
};

const IMPACT: V3 = [-70, 0, 430];
const Asteroid: React.FC<{ T: number }> = ({ T }) => {
  const a0 = 23.05;
  if (T < a0) return null;
  const S: V3 = [-320, 280, 300];
  const k = clamp01((T - a0) / (T_IMPACT - a0));
  const kk = k ** 1.6;
  const P: V3 = [lerp(S[0], IMPACT[0], kk), lerp(S[1], IMPACT[1] + 4, kk), lerp(S[2], IMPACT[2], kk)];
  const dir = new THREE.Vector3(IMPACT[0] - S[0], IMPACT[1] - S[1], IMPACT[2] - S[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
  const u = T - T_IMPACT;
  return (
    <>
      {k < 1 && (
        <group position={P}>
          <mesh userData={{ noNormal: true }}>
            <sphereGeometry args={[5, 16, 12]} />
            <meshBasicMaterial color="#FFE3A8" fog={false} />
          </mesh>
          <mesh quaternion={q} position={[-dir.x * 45, -dir.y * 45, -dir.z * 45]} userData={{ noNormal: true }}>
            <coneGeometry args={[6, 95, 16, 1, true]} />
            <meshBasicMaterial color="#FF9A4A" transparent opacity={0.75} fog={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {u > 0 && (
        <group position={IMPACT}>
          {/* quả cầu lửa nở ra rồi tối dần thành cột bụi */}
          <mesh scale={[1, 0.8, 1]} userData={{ noNormal: true }}>
            <sphereGeometry args={[Math.min(170, 20 + u * 120), 24, 16, 0, TAU, 0, Math.PI / 2]} />
            <meshBasicMaterial color={mixC("#FFF2C8", "#B4441E", clamp01(u / 1.6))} transparent opacity={clamp01(1.4 - u * 0.25)} fog={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, Math.min(260, u * 70), 0]} scale={[1, 0.55, 1]} userData={{ noNormal: true }}>
            <sphereGeometry args={[Math.min(200, 30 + u * 60), 20, 12]} />
            <meshBasicMaterial color={mixC("#E0723A", "#3A2A22", clamp01((u - 0.6) / 2.5))} transparent opacity={clamp01(u * 1.5) * 0.85} fog={false} depthWrite={false} />
          </mesh>
          {/* vòng sóng xung kích lan về phía máy */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]} userData={{ noNormal: true }}>
            <ringGeometry args={[u * 130, u * 130 + 14 + u * 6, 96]} />
            <meshBasicMaterial color="#F2B26A" transparent opacity={clamp01(1 - u / 4.2) * 0.8} fog={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </>
  );
};

// tro rơi quanh máy (sau va chạm), bụi lơ lửng + bọt khi dưới nước
const Flakes: React.FC<{ center: V3; T: number; k: number; under: boolean }> = ({ center, T, k, under }) => {
  const P = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 220 }, () => ({ x: r() * 40 - 20, y: r() * 26, z: r() * 40 - 20, s: 0.03 + r() * 0.07, ph: r() * TAU, v: 0.6 + r() * 0.8 }));
  }, []);
  if (k <= 0.01) return null;
  return (
    <group position={[center[0], 0, center[2]]}>
      {P.map((q, i) => {
        const span = under ? 3 : 26;
        let y = (q.y - T * q.v * (under ? 0.15 : 1.4)) % span;
        if (y < 0) y += span;
        y = under ? -0.2 - y : y + center[1] - 10;
        if (i / P.length > k) return null;
        return (
          <mesh key={i} position={[q.x + Math.sin(T + q.ph) * 0.4, y, q.z + Math.cos(T * 0.7 + q.ph) * 0.4]} scale={q.s * (under ? 0.6 : 1)}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={under ? "#B8C2A8" : "#9A948C"} transparent opacity={0.85} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// cá con bơi ngang qua mõm cá sấu ("tiny appetites") — cá sấu không thèm đớp
const Fish: React.FC<{ T: number; origin: V3 }> = ({ T, origin }) => {
  const u = T - 31.3;
  if (u < 0 || u > 3.2) return null;
  return (
    <group position={[origin[0] + 4.5 - u * 2.2, origin[1] + 0.55, origin[2] + 0.5]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[i * 0.45, Math.sin(i * 2.1) * 0.25, Math.cos(i * 1.7) * 0.35]} rotation={[0, Math.PI + Math.sin(T * 9 + i) * 0.25, 0]}>
          <mesh scale={[0.06, 0.1, 0.22]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#C9D3B4" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// thanh đo vàng nổi trên lưng: mọc từ đuôi tới mõm theo k
const MeasureBar: React.FC<{ p: V3; yaw: number; len: number; k: number; h: number; color?: string }> = ({ p, yaw, len, k, h, color = "#F2C94C" }) => {
  if (k <= 0.001) return null;
  const L = len * k;
  return (
    <group position={[p[0], h, p[2]]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0, -len / 2 + L / 2]}>
        <boxGeometry args={[0.07, 0.07, L]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {[-len / 2, -len / 2 + L].map((z, i) => (
        <mesh key={i} position={[0, -0.18, z]}>
          <boxGeometry args={[0.06, 0.42, 0.06]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ diễn viên theo thời gian
const CROC_HEAD = 3.0; // m từ gốc tới giữa đầu (cá sấu 6 m)
function crocState(T: number): { p: V3; yaw: number; swim: number; jaw: number; roll: number; pitch: number } {
  const yaw = Math.PI / 2; // đầu về +X
  const sx = (t: number) => Math.min(0.35 * Math.max(0, t - T_SPLASH), 3.8);
  if (T < T_SPLASH) {
    const k = T / T_SPLASH;
    return { p: [0, lerp(34, 0, k * k), zc(0)], yaw, swim: 0.6, jaw: 0.25 + 0.15 * Math.sin(T * 5), roll: Math.sin(T * 2.4) * 0.5, pitch: 0.55 - 0.35 * k };
  }
  let x = sx(T), y = -0.45;
  const u = T - T_SPLASH;
  if (u < 1.3) y = -0.45 - 1.3 * Math.sin((u / 1.3) * Math.PI) * Math.exp(-u);
  let swim = T < 13.2 ? 1 : 0.35;
  let jaw = 0.85 * pulse(T, T_SNAP - 0.45, T_SNAP + 0.05) + 0.12 * pulse(T, 2.6, 3.4);
  if (T > T_SNAP - 0.05 && T < T_SNAP + 0.12) jaw = 0;
  // đóng băng rồi chìm xuống đáy trong lúc tua nhanh, nằm chờ, trồi lên lúc kết
  const tt = Math.min(T, T_FREEZE);
  if (T >= T_FREEZE) { x = sx(tt); swim = T < T_LAPSE0 ? 0 : 0.15; jaw = 0; }
  const sink = ramp(T, T_LAPSE0, T_LAPSE1) * (1 - ramp(T, T_RISE0, T_RISE1));
  y = lerp(y, BED + 0.05, sink);
  if (T > T_RISE0) { x = lerp(3.8, 5.5, ramp(T, T_RISE0, 38)); swim = T < 38 ? 0.8 : 0.25; }
  // lúc đớp: ngóc đầu khỏi mặt nước cho thấy miệng
  const lift = pulse(T, T_SNAP - 0.9, T_SNAP + 0.5);
  y += 0.28 * lift;
  const pitch = -0.3 * lift + (T > T_RISE0 && T < T_RISE1 ? -0.18 * pulse(T, T_RISE0, T_RISE1) : 0);
  return { p: [x, y, zc(x)], yaw, swim: T >= T_FREEZE && T < T_LAPSE1 ? 0 : swim, jaw, roll: 0, pitch };
}

function deinoState(T: number): { p: V3; yaw: number; swim: number; jaw: number; scale: number; under: number } {
  let x = -10 + 1.05 * (T - 8), z = 2.9, y = -2.15, yaw = Math.PI / 2, jaw = 0, swim = 1;
  if (T > 11.6) { x = lerp(x, 2.4, ramp(T, 11.6, 13.7)); }
  if (T > 12.6) y = lerp(-2.15, -0.62, ramp(T, 12.9, 14.0));
  if (T > 13.7) { x = 2.4 + 0.05 * (T - 13.7); swim = 0.4; }
  // đớp đuôi con mỏ vịt trên bờ
  const yawL = 0.72;
  if (T > 16.9) yaw = lerp(Math.PI / 2, yawL, ramp(T, 16.9, 17.5));
  const lunge = ramp(T, 17.55, T_LUNGE - 0.02) * (1 - ramp(T, 18.5, 19.3));
  const base: V3 = [x, y, z];
  x = base[0] + Math.sin(yawL) * 3.4 * lunge;
  z = base[2] + Math.cos(yawL) * 3.4 * lunge;
  y = base[1] + 0.45 * lunge;
  jaw = 0.9 * pulse(T, 17.45, T_LUNGE);
  if (T > T_LUNGE - 0.02 && T < T_LUNGE + 0.1) jaw = 0;
  // quay sang cá sấu
  if (T > 18.6) {
    const k = ramp(T, 18.6, 19.6);
    yaw = lerp(yawL, Math.PI + 0.25, k);
    x = lerp(x, 4.9, k);
    z = lerp(z, 5.6, k);
  }
  if (T > 19.5) jaw = Math.max(jaw, 0.75 * ramp(T, 19.6, 20.2));
  if (T >= T_FREEZE) { jaw = 0.75; swim = 0; }
  const fade = ramp(T, T_LAPSE0 + 0.1, T_LAPSE1 - 0.2);
  return { p: [x, y - 2.5 * fade, z], yaw, swim, jaw, scale: 1 - fade, under: y < -1 ? 1 : 0 };
}

const HERD: { p: [number, number]; ph: number }[] = [
  { p: [9.3, 11.2], ph: 0 }, { p: [12.6, 13.0], ph: 0.7 }, { p: [16.2, 12.0], ph: 1.4 }, { p: [19.4, 14.2], ph: 0.3 }, { p: [7.0, 15.5], ph: 1.9 },
];
const TRIS: { p: [number, number]; yaw: number; d: number }[] = [
  { p: [15, 18.5], yaw: -2.6, d: 0 }, { p: [19.5, 20.5], yaw: -2.2, d: 0.3 }, { p: [12.5, 22.5], yaw: -1.9, d: 0.55 },
];
const REX_P: [number, number] = [5.5, 16.5];

// ------------------------------------------------------------------ camera: spline Hermite qua các mốc (một cú máy)
type Key = { t: number; p: V3; l: V3; fov: number };
const CAM: Key[] = [
  { t: 0.0, p: [-7, 32, 11], l: [0, 31, 0], fov: 48 },
  { t: 1.2, p: [-9.5, 19, 13], l: [0, 15, 0], fov: 46 },
  { t: 2.3, p: [-10, 4.2, 12], l: [0, 0.6, 0.3], fov: 44 },
  { t: 3.6, p: [-6.5, 1.3, 7.5], l: [1, 0, 0.3], fov: 42 },
  { t: 5.0, p: [-3, 1.5, 6.6], l: [1.2, 0.2, 0.3], fov: 40 },
  { t: 6.3, p: [1.2, 1.15, 5.0], l: [2.3, 0.2, 0.3], fov: 40 },
  { t: 7.4, p: [8.2, 1.7, 5.0], l: [3.9, 0.7, 0.3], fov: 40 },
  { t: 8.5, p: [6.4, 1.5, 3.6], l: [3.2, 0.4, 0.6], fov: 42 },
  { t: 9.05, p: [5.4, 2.4, -2.0], l: [3.4, 0.4, 0.8], fov: 44 },
  { t: 9.7, p: [1.2, 3.9, -5.6], l: [5.0, 1.0, 4.0], fov: 45 },
  { t: 10.3, p: [-3.5, 7.5, -12], l: [8, 1.5, 6], fov: 46 },
  { t: 11.8, p: [-3, 3.0, -7.5], l: [3, 0.2, 1], fov: 44 },
  { t: 12.9, p: [-1.2, 0.75, -4.6], l: [2.5, 0.0, 1.6], fov: 44 },
  { t: 14.2, p: [0.3, 1.6, -6.8], l: [3.6, 0.4, 1.5], fov: 44 },
  { t: 16.0, p: [2.0, 6.5, -9.5], l: [4.2, 0, 1.8], fov: 46 },
  { t: 17.5, p: [3.5, 3.8, -6.5], l: [7.6, 0.8, 7.5], fov: 46 },
  { t: 18.6, p: [4.6, 2.7, -3.4], l: [8.0, 1.2, 8.6], fov: 46 },
  { t: 20.0, p: [0.9, 2.3, -3.2], l: [4.6, 0.4, 1.4], fov: 44 },
  { t: 21.1, p: [0.5, 2.7, -4.1], l: [4.6, 0.4, 1.6], fov: 44 },
  { t: 22.3, p: [1.0, 3.6, -3.6], l: [4.8, 3.4, 12], fov: 46 },
  { t: 23.4, p: [1.5, 3.2, -1.2], l: [5.5, 6.0, 16], fov: 48 },
  { t: 24.5, p: [2.0, 2.9, 0.4], l: [5.0, 8.0, 22], fov: 52 },
  { t: 25.8, p: [-4.0, 3.6, 6.2], l: [5.5, 2.2, 16], fov: 48 },
  { t: 27.4, p: [2.0, 5.2, 4.2], l: [14, 1.5, 19.5], fov: 48 },
  { t: 29.0, p: [6.2, 3.6, 1.6], l: [4.6, -1.2, 0.4], fov: 46 },
  { t: 29.8, p: [6.2, 0.7, 3.4], l: [4.6, -1.6, 0.5], fov: 44 },
  { t: 30.5, p: [5.6, -0.8, 3.4], l: [4.6, -1.9, 0.4], fov: 46 },
  { t: 32.5, p: [8.0, -1.25, 1.9], l: [5.0, -1.95, 0.4], fov: 46 },
  { t: 34.3, p: [8.8, -1.35, -1.2], l: [5.5, -1.8, 0.4], fov: 46 },
  { t: 35.4, p: [9.4, -0.6, -1.9], l: [6.2, -0.8, 0.5], fov: 44 },
  { t: 36.3, p: [10.8, 0.55, -2.4], l: [7.4, 0.15, 0.5], fov: 42 },
  { t: 38.0, p: [12.0, 0.5, -1.2], l: [8.6, 0.3, 0.6], fov: 40 },
  { t: 40.0, p: [13.6, 1.6, -3.4], l: [8.2, 0.4, 0.7], fov: 42 },
  { t: 43.5, p: [16.5, 4.6, -6.8], l: [7.8, 0.8, 1.2], fov: 46 },
];
function hermite(T: number, get: (k: Key) => number) {
  const K = CAM;
  if (T <= K[0].t) return get(K[0]);
  if (T >= K[K.length - 1].t) return get(K[K.length - 1]);
  let i = 0;
  while (K[i + 1].t < T) i++;
  const a = K[i], b = K[i + 1];
  const pa = K[Math.max(0, i - 1)], pb = K[Math.min(K.length - 1, i + 2)];
  const h = b.t - a.t, s = (T - a.t) / h;
  const m0 = ((get(b) - get(pa)) / (b.t - pa.t)) * h;
  const m1 = ((get(pb) - get(a)) / (pb.t - a.t)) * h;
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * get(a) + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * get(b) + (s3 - s2) * m1;
}
function camAt(T: number): { p: V3; l: V3; fov: number } {
  const p: V3 = [0, 1, 2].map((j) => hermite(T, (k) => k.p[j])) as V3;
  const l: V3 = [0, 1, 2].map((j) => hermite(T, (k) => k.l[j])) as V3;
  return { p, l, fov: hermite(T, (k) => k.fov) };
}
// rung máy vẫn liền mạch: chỉ lệch nhỏ cộng thêm vào spline
const HITS: [number, number][] = [[T_SPLASH, 0.35], [T_SNAP, 0.25], [T_LUNGE, 0.3], [T_IMPACT, 0.9], [T_WAVE, 0.6], [T_REXDIE + 1.1, 0.35]];
function hitEnv(T: number) {
  let e = 0;
  for (const [h, k] of HITS) if (T >= h) e = Math.max(e, k * Math.exp(-(T - h) * 3.2));
  return e;
}

// ------------------------------------------------------------------ bầu trời / ánh sáng theo thời gian
function skyAt(T: number) {
  const day = { top: "#6FA8D6", hor: "#EDE3C6", sun: 3.1, sunC: "#FFF0D2", hemi: 1.15, fog: "#DCE2D2", dark: 0 };
  const late = { top: "#7FA2C2", hor: "#F2D2A2", sun: 2.8, sunC: "#FFE0B0", hemi: 1.05, fog: "#E6D6B8", dark: 0 };
  const fire = { top: "#6A3022", hor: "#EE8040", sun: 2.3, sunC: "#FFA868", hemi: 1.05, fog: "#C06A40", dark: 0.25 };
  const ash = { top: "#3A2E26", hor: "#7A5A44", sun: 1.25, sunC: "#D09070", hemi: 0.85, fog: "#6A5040", dark: 0.5 };
  const clear = { top: "#5C9ED6", hor: "#EEF2E6", sun: 3.2, sunC: "#FFF4DE", hemi: 1.2, fog: "#DDE6DC", dark: 0 };
  type S = typeof day;
  const mix = (a: S, b: S, k: number): S => ({
    top: mixC(a.top, b.top, k), hor: mixC(a.hor, b.hor, k), sun: lerp(a.sun, b.sun, k), sunC: mixC(a.sunC, b.sunC, k),
    hemi: lerp(a.hemi, b.hemi, k), fog: mixC(a.fog, b.fog, k), dark: lerp(a.dark, b.dark, k),
  });
  let s = day;
  if (T > T_LAPSE0) {
    // tua nhanh: ngày đêm nhấp nháy
    const k = ramp(T, T_LAPSE0, T_LAPSE1);
    const flick = T < T_LAPSE1 ? 0.5 + 0.5 * Math.cos((T - T_LAPSE0) * 26) : 1;
    s = mix(mix(day, late, k), { ...ash, top: "#141A2C", hor: "#2B3346", fog: "#2B3346" }, (1 - flick) * 0.85 * (T < T_LAPSE1 ? 1 : 0));
  }
  if (T > T_IMPACT) s = mix(late, fire, ramp(T, T_IMPACT, T_IMPACT + 1.2));
  if (T > T_IMPACT + 1.2) s = mix(fire, ash, ramp(T, T_IMPACT + 1.2, 28.6));
  if (T > T_RISE0 - 0.5) s = mix(ash, clear, ramp(T, T_RISE0 - 0.5, T_RISE1 + 0.4));
  return s;
}

const Cam: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...look));
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
  return null;
};

type Rigs = { croc: CrocRig; deino: CrocRig };
const World: React.FC<{ T: number; cam: V3; look: V3; fov: number; A: Assets; rigs: Rigs; rex: QAsset; para: QAsset; tri: QAsset }> = ({ T, cam, look, fov, A, rigs, rex, para, tri }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(look[0], 0, look[2]);
  const sky = skyAt(T);
  const under = cam[1] < 0;
  const dist = Math.hypot(cam[0] - look[0], cam[1] - look[1], cam[2] - look[2]);
  const S = Math.max(18, Math.min(70, dist * 1.6));
  const frozen = T >= T_FREEZE && T < T_LAPSE1;
  const Ta = frozen ? T_FREEZE : T; // thời gian của chuyển động (đóng băng lúc "Not so fast")
  const cs = crocState(T);
  const ds = deinoState(T);
  const era75 = 1 - ramp(T, T_LAPSE0 + 0.1, T_LAPSE1 - 0.2);
  const era66 = ramp(T, T_LAPSE0 + 0.4, T_LAPSE1);
  const ash = T > T_IMPACT + 0.6 && T < T_RISE1 + 0.5 ? clamp01((T - T_IMPACT - 0.6) / 1.2) * (1 - ramp(T, T_RISE0, T_RISE1 + 0.5)) : 0;
  const fogC = under ? mixC("#4A6E5A", "#34402F", sky.dark * 0.7) : sky.fog;
  const fogN = under ? 1.0 : 40, fogF = under ? 15 : 330 - 200 * sky.dark;
  return (
    <>
      <Cam pos={cam} look={look} fov={fov} />
      <fog attach="fog" args={[fogC, fogN, fogF]} />
      <primitive object={tgt} />
      <hemisphereLight args={[mixC("#DDE8F2", sky.top, 0.3), "#5A5038", sky.hemi]} />
      <directionalLight position={[look[0] - S * 0.8, S * 1.4, look[2] - S * 0.9]} target={tgt} intensity={sky.sun * (under ? 0.9 : 1) + (under ? 0.8 : 0)} color={sky.sunC} castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
        shadow-camera-near={0.5} shadow-camera-far={S * 6} shadow-bias={-0.0004} shadow-normalBias={S * 0.0015} />
      {T > T_IMPACT && <directionalLight position={[IMPACT[0], 60, IMPACT[2]]} intensity={3.5 * Math.exp(-(T - T_IMPACT) * 0.8)} color="#FFB060" />}
      <Sky top={sky.top} hor={sky.hor} />
      <Terrain />
      <Water under={under} dark={sky.dark} clear={ramp(T, 27.8, 28.8) * (1 - ramp(T, 35.5, 36.5))} />
      <Flora A={A} />
      <Volcano T={T} />
      {/* cá sấu */}
      <Croc rig={rigs.croc} L={CROC} pos={cs.p} yaw={cs.yaw} T={Ta} swim={cs.swim} jaw={cs.jaw} roll={cs.roll} pitch={cs.pitch}
        tint={0} />
      <Wake p={cs.p} yaw={cs.yaw} k={T > 3.4 && T < T_FREEZE ? cs.swim * 0.8 : T > T_RISE1 && T < 38.5 ? 0.6 : 0} T={T} len={3.5} />
      <Splash t={T - T_SPLASH} p={[0, 0, zc(0)]} n={46} size={1.2} />
      {/* Deinosuchus */}
      {ds.scale > 0.01 && T > 8 && (
        <Croc rig={rigs.deino} L={DEINO} pos={ds.p} yaw={ds.yaw} T={Ta + 0.7} swim={ds.swim} jaw={ds.jaw} scale={ds.scale} />
      )}
      <Wake p={ds.p} yaw={ds.yaw} k={ramp(T, 11.4, 12.1) * (1 - ramp(T, 13.3, 13.9)) * 1.2} T={T} len={5} />
      <Splash t={T - T_LUNGE} p={[ds.p[0], 0, ds.p[2]]} n={34} size={0.9} />
      <Splash t={T - 13.5} p={[2.4 + Math.sin(0.72) * 3.0, 0, 2.9 + 0.3]} n={18} size={0.6} />
      {/* thanh đo 6 m / 7,7 m */}
      <MeasureBar p={[cs.p[0] + 0.2, 0, cs.p[2]]} yaw={cs.yaw} len={6} k={ramp(T, 4.55, 5.5) * (1 - ramp(T, 6.5, 6.9)) + ramp(T, 15.0, 15.8) * (1 - ramp(T, 17.0, 17.4))} h={0.85} />
      <MeasureBar p={[ds.p[0] + 0.2, 0, ds.p[2]]} yaw={ds.yaw} len={7.7} k={ramp(T, 15.2, 16.2) * (1 - ramp(T, 17.0, 17.4))} h={1.25} color="#E8735A" />
      {/* 75 triệu năm: đàn mỏ vịt; con gần nước giật mình bỏ chạy khi bị đớp */}
      {era75 > 0.01 && HERD.map((h, i) => {
        const startle = T - (T_LUNGE + (i === 0 ? 0 : 0.25 + i * 0.12));
        const run = startle > 0 && !frozen;
        const turn = ramp(startle, 0, 0.35);
        const yaw = lerp(-Math.PI / 2 + Math.sin(i * 1.3) * 0.25, Math.PI / 2 + 0.3, turn);
        const dz = run ? Math.max(0, startle - 0.2) * 6.5 : 0;
        const x = h.p[0] + (run ? Math.max(0, startle - 0.2) * 1.5 : 0), z = h.p[1] + dz;
        const clip = run ? "Run" : i === 0 && T > 17.3 && T < T_LUNGE ? "Idle" : "Idle";
        return <Dino key={i} asset={para} look={PARA} clip={clip} ct={(frozen ? T_FREEZE : T) + h.ph} pos={[x, ground(x, z), z]} yaw={yaw} scale={era75} />;
      })}
      {/* 66 triệu năm: T. rex + Triceratops */}
      {era66 > 0.01 && (
        <>
          <Dino asset={rex} look={REX} clip={T >= T_REXDIE ? "Death" : T >= T_ROAR && T < T_ROAR + 1.17 ? "Attack" : "Idle"}
            ct={T >= T_REXDIE ? T - T_REXDIE : T >= T_ROAR && T < T_ROAR + 1.17 ? T - T_ROAR : T} once={T >= T_REXDIE}
            pos={[REX_P[0], ground(REX_P[0], REX_P[1]), REX_P[1]]} yaw={-Math.PI / 2 - 0.35} scale={era66 * (1 - ramp(T, 30.5, 31))} />
          {TRIS.map((q, i) => {
            const dieT = T_TRIDIE + q.d;
            return <Dino key={i} asset={tri} look={TRI} clip={T >= dieT ? "Death" : "Idle"} ct={T >= dieT ? T - dieT : T + i} once={T >= dieT}
              pos={[q.p[0], ground(q.p[0], q.p[1]), q.p[1]]} yaw={q.yaw} scale={era66 * (1 - ramp(T, 30.5, 31))} />;
          })}
        </>
      )}
      {!under && <Asteroid T={T} />}
      <Flakes center={cam} T={T} k={under ? Math.max(ash, 0.6 * (1 - ramp(T, T_RISE0, T_RISE1))) : ash} under={under} />
      {under && <Fish T={T} origin={cs.p} />}
    </>
  );
};

// ------------------------------------------------------------------ chữ trên màn hình
function project(p: V3, cam: V3, look: V3, fov: number, w: number, h: number) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.01, 2000);
  c.position.set(...cam);
  c.lookAt(new THREE.Vector3(...look));
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h, ok: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 };
}

const BarLabel: React.FC<{ x: number; y: number; name: string; val: string; color: string; o: number }> = ({ x, y, name, val, color, o }) => (
  <div style={{ position: "absolute", left: Math.min(Math.max(x, 200), 880), top: Math.min(Math.max(y, 780), 1120), transform: "translate(-50%, -100%)", textAlign: "center", opacity: o }}>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 26, letterSpacing: 5, color, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{name}</div>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 104, lineHeight: 1, color: C.bone, WebkitTextStroke: "5px rgba(10,14,15,0.95)", paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{val}</div>
  </div>
);

const BigCounter: React.FC<{ top: string; val: string; sub: string; o: number; pop: number }> = ({ top, val, sub, o, pop }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", opacity: o, transform: `scale(${1 + 0.12 * pop})` }}>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: 7, color: C.ochreLight, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{top}</div>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 150, lineHeight: 1.02, color: C.bone, WebkitTextStroke: "6px rgba(10,14,15,0.95)", paintOrder: "stroke fill" }}>{val}</div>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: 6, color: C.bone, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{sub}</div>
  </div>
);

const Stamp: React.FC<{ f: number; text: string; color: string; rot: number }> = ({ f, text, color, rot }) => {
  const p = interpolate(f, [0, 6], [0, 1], CLAMP);
  const sc = interpolate(f, [0, 6, 10], [2.2, 0.94, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1030, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${sc})`, border: `8px solid ${color}`, borderRadius: 14, padding: "8px 30px 10px", color, fontFamily: sans, fontWeight: 800, fontSize: 76, letterSpacing: 4, background: "rgba(10,14,15,0.45)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
        {text}
      </div>
    </div>
  );
};
const StampSeq: React.FC<{ text: string; color: string; rot: number; hold: number }> = ({ hold, ...q }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [hold - 8, hold], [1, 0], CLAMP);
  return <div style={{ opacity: o }}><Stamp f={f} {...q} /></div>;
};

// ------------------------------------------------------------------ khung chính
const useScene = () => {
  const A = useAssets();
  const rex = useFBX("free/Trex.fbx");
  const para = useFBX("free/Parasaurolophus.fbx");
  const tri = useFBX("free/Triceratops.fbx");
  const rigs = useMemo<Rigs | null>(() => (A ? { croc: buildCroc(A.glb.caiman, CROC), deino: buildCroc(A.glb.caiman, DEINO) } : null), [A]);
  return A && rex && para && tri && rigs ? { A, rex, para, tri, rigs } : null;
};

export const Short011_3D: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const sc = useScene();
  const T = f / fps;
  const c = camAt(T);
  if (T < 3.2) {
    const cp = crocState(Math.min(T, T_SPLASH)).p;
    const k = ramp(T, 1.9, 3.2);
    const off: V3 = [lerp(-7, -10, ramp(T, 0, 2.2)), lerp(1.5, 4, ramp(T, 0, 2.2)), lerp(10, 12, ramp(T, 0, 2.2))];
    for (let j = 0; j < 3; j++) {
      c.p[j] = lerp(cp[j] + off[j], c.p[j], k);
      c.l[j] = lerp(cp[j] + (j === 1 ? -1.5 : 0), c.l[j], k);
    }
  }
  const h = hitEnv(T);
  const dist = Math.hypot(c.p[0] - c.l[0], c.p[1] - c.l[1], c.p[2] - c.l[2]);
  const amp = Math.min(1.2, dist / 10) * h;
  const cam: V3 = [c.p[0] + amp * Math.sin(T * 61), c.p[1] + amp * Math.sin(T * 47 + 1.3), c.p[2] + amp * Math.sin(T * 53 + 2.1)];
  const look: V3 = [c.l[0] + amp * 0.6 * Math.sin(T * 43 + 0.7), c.l[1] + amp * 0.6 * Math.sin(T * 57 + 2.4), c.l[2]];
  const sky = skyAt(T);
  const flash = T >= T_IMPACT ? Math.exp(-(T - T_IMPACT) * 2.6) : 0;
  const freezeK = T >= T_FREEZE && T < T_LAPSE1 + 0.3 ? 1 - ramp(T, T_LAPSE1 - 0.2, T_LAPSE1 + 0.3) : 0;
  const markIn = interpolate(f, [p.scenes[1].startFrame, p.scenes[1].startFrame + 20], [0, 1], CLAMP);
  // nhãn thanh đo
  const cs = crocState(T), ds = deinoState(T);
  const lab: React.ReactNode[] = [];
  const oC = ramp(T, 4.6, 5.0) * (1 - ramp(T, 6.5, 6.9)) + ramp(T, 15.1, 15.5) * (1 - ramp(T, 16.95, 17.3));
  if (oC > 0.01) {
    const q = project([cs.p[0] + 0.6, 1.25, cs.p[2]], cam, look, c.fov, width, height);
    const v = T < 9 ? 6 * ramp(T, 4.55, 5.5) : 6;
    if (q.ok) lab.push(<BarLabel key="c" x={q.x} y={q.y} name="SALTWATER CROC" val={`${v.toFixed(v < 5.95 ? 1 : 0)} m`} color="#F2C94C" o={oC} />);
  }
  const oD = ramp(T, 15.3, 15.7) * (1 - ramp(T, 16.95, 17.3));
  if (oD > 0.01) {
    const q = project([ds.p[0], 2.3, ds.p[2]], cam, look, c.fov, width, height);
    const v = 7.7 * ramp(T, 15.2, 16.2);
    if (q.ok) lab.push(<BarLabel key="d" x={q.x} y={q.y - 30} name="DEINOSUCHUS" val={`${v.toFixed(1)} m`} color="#E8735A" o={oD} />);
  }
  // đồng hồ triệu năm (tua nhanh) và đếm ngày nhịn ăn
  const yrsO = ramp(T, T_FREEZE + 0.15, T_FREEZE + 0.35) * (1 - ramp(T, T_LAPSE1 + 0.15, T_LAPSE1 + 0.45));
  const yrs = Math.round(lerp(75, 66, ramp(T, T_LAPSE0, T_LAPSE1 - 0.1)));
  const dayO = ramp(T, 32.8, 33.0) * (1 - ramp(T, 34.4, 34.7));
  const days = Math.round(lerp(1, 180, ramp(T, 32.9, 34.2) ** 1.4));
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: freezeK > 0.01 ? `saturate(${1 - 0.85 * freezeK}) contrast(${1 + 0.15 * freezeK})` : undefined }}>
        {sc && (
          <ThreeCanvas width={width} height={height} shadows camera={{ fov: 44, near: 0.1, far: 4000 }} gl={{ antialias: true }}>
            <World T={T} cam={cam} look={look} fov={c.fov} {...sc} />
            <InkPass p={{ focus: dist, blur: 3.5, night: sky.dark * 0.35, cow: 0, flash: flash * 0.9, redPulse: 0, ink: 1, vig: 0.35, hdr: 1 }} />
          </ThreeCanvas>
        )}
        {lab}
      </AbsoluteFill>
      {freezeK > 0.01 && (
        <AbsoluteFill style={{ opacity: freezeK, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)" }} />
      )}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.18, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.45) 63%, rgba(10,14,15,0.55) 76%, rgba(10,14,15,0.2) 90%, rgba(10,14,15,0) 100%)" }} />
      {yrsO > 0.01 && <BigCounter top="TIME SKIP" val={`${yrs}`} sub="MILLION YEARS AGO" o={yrsO} pop={pulse(T, T_LAPSE1 - 0.15, T_LAPSE1 + 0.15)} />}
      {dayO > 0.01 && <BigCounter top="NO FOOD" val={`DAY ${days}`} sub="AND STILL WAITING" o={dayO} pop={pulse(T, 34.1, 34.4)} />}
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D ILLUSTRATION
      </div>
      <Sequence from={Math.round(19.85 * fps)} durationInFrames={Math.round(1.1 * fps)}>
        <StampSeq text="SNACK?" color="#E8735A" rot={-5} hold={33} />
      </Sequence>
      <Sequence from={Math.round(25.05 * fps)} durationInFrames={Math.round(0.75 * fps)}>
        <StampSeq text="GONE" color="#D9D2C2" rot={4} hold={22} />
      </Sequence>
      <Sequence from={Math.round(27.7 * fps)} durationInFrames={Math.round(0.7 * fps)}>
        <StampSeq text="GONE" color="#D9D2C2" rot={-3} hold={21} />
      </Sequence>
      <Sequence from={Math.round(T_STILL * fps)} durationInFrames={Math.round(1.6 * fps)}>
        <StampSeq text="STILL HERE ✓" color="#7CD992" rot={-4} hold={48} />
      </Sequence>
      {p.notes.map((n, i) => (
        <Sequence key={i} from={n.startFrame} durationInFrames={n.durationFrames}>
          <FieldNote n={n} />
        </Sequence>
      ))}
      <Sequence from={p.endCard.startFrame} durationInFrames={p.endCard.durationFrames}>
        <EndCardView c={p.endCard} />
      </Sequence>
      {p.hookText ? (
        <Sequence from={0} durationInFrames={p.scenes[1].startFrame}>
          <HookHeadline text={p.hookText} dur={p.scenes[1].startFrame} />
        </Sequence>
      ) : null}
      <Captions groups={p.karaoke} fps={p.fps} />
      <div style={{ position: "absolute", right: 48, top: PANEL.top - 64, display: "flex", alignItems: "center", gap: 12, opacity: markIn }}>
        <Ammonite size={36} />
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 6, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>FOSSIL MYSTERIES</div>
      </div>
      <Grain srcs={p.grain} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ thumbnail (không chữ): Deinosuchus há mõm sau lưng cá sấu, trời lửa
export const Thumb011: React.FC = () => {
  const { width, height } = useVideoConfig();
  const sc = useScene();
  const T = 20.4;
  const cam: V3 = [1.2, 1.0, -3.6], look: V3 = [4.4, 1.0, 1.6];
  return (
    <AbsoluteFill style={{ background: "#1A1410" }}>
      {sc && (
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 44, near: 0.1, far: 4000 }} gl={{ antialias: true }}>
          <World T={T} cam={cam} look={look} fov={46} {...sc} />
          <InkPass p={{ focus: 5, blur: 3, night: 0.1, cow: 0, flash: 0, redPulse: 0, ink: 1, vig: 0.5, hdr: 1 }} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};
