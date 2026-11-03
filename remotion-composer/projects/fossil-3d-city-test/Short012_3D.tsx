// Fossil Short 012 (2026-11-03): "Could Titanoboa Survive the Dinosaur Era?" — series #2 of "drop X into the dinosaur era"
// (011 = croc). Same one-take recipe as Short011_3D: Hermite spline camera over time-keyed CAM keys, no cuts, ink pass.
// Story on one map (river along X, centre z = zc(x)): Titanoboa coiled in a hot Paleocene jungle (60 Ma) -> time rewind to
// 66 Ma (cooler Hell Creek light, T. rex fades in) -> uncoils, 13 m bar vs T. rex 12 m bar -> swims past leaping fish toward
// baby hadrosaurs -> camera swings to a fossil slab (Sanajeh coiled round a nest, India 67 Ma) -> back: snake rears, strikes,
// FREEZE on "Not so fast" -> bullet-time orbit while the screen reads 30 °C (jungle) then 10 °C (this river), frost creeps
// over the snake -> slow-mo strike misses -> sluggish on the bank, T. rex walks up and roars -> asteroid, flash, T. rex falls,
// GONE -> camera dives into a burrow: tiny snakes waiting out the dark -> back out into the jungle (66 -> 60 Ma), a tiny
// snake grows into Titanoboa -> "No." -> end card.
// Titanoboa + all snakes are procedural (tube along a centreline + jaw rig), no model file. Dinosaurs Quaternius CC0,
// flora Kenney CC0: projects/fossil-mysteries-short-012-3d/public/free/CREDITS.md.
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

// ------------------------------------------------------------------ time marks (absolute seconds, from props word times)
// beat starts: 0 | 6.75 | 11.13 | 17.75 | 25.76 | 29.75 | 39.86 | 47.77 | end card 58.23
const T_REW0 = 5.0, T_REW1 = 6.6; // "So let's send it back": 60 -> 66 Ma
// r03: the video OPENS on the drop (like 011's croc): head-first out of the sky into T. rex's river, body pours in after the head
const T_DROP0 = 0, T_SPLASH = 1.25, T_POUR1 = 2.2;
// r02: "Plenty of fish." -> a 1.5 m gar leaps, the snake rears and snaps it out of the air, holds it, swallows
const T_GAR0 = 14.72, T_GSNAP = 15.2, T_GSWAL = 16.1;
const T_REAR = 26.0, T_STRIKE = 27.55, T_FREEZE = 28.45, T_THAW = 37.5, T_FLOP = 39.4;
const T_REXIN = 40.3, T_ROAR = 42.3, T_IMPACT = 44.55, T_REXDIE = 45.6, T_WAVE = 45.3;
const T_DIVE = 48.7, T_OUT = 52.0, T_GROW0 = 52.5, T_GROW1 = 53.7, T_NO = 55.62;

// ------------------------------------------------------------------ terrain (011's river)
const zc = (x: number) => 2.5 * Math.sin(x / 23);
const BED = -2.4;
function noise2(x: number, z: number) {
  return Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * 0.5 + Math.sin(z * 0.13 + x * 0.05) * 0.35 + Math.sin((x + z) * 0.031) * 0.6;
}
function ground(x: number, z: number): number {
  const d = Math.abs(z - zc(x));
  let h: number;
  if (d < 5.5) h = BED;
  else if (d < 10) h = lerp(BED, 0.1, sstep(5.5, 10, d));
  else if (d < 13) h = lerp(0.1, 0.55, sstep(10, 13, d));
  else h = 0.55 + 0.35 * noise2(x, z) * sstep(13, 30, d) + 6 * sstep(45, 110, d) * (0.6 + 0.4 * noise2(x * 0.5, z * 0.5)) + 40 * sstep(140, 260, d);
  return h;
}
const onBank = (x: number, dz: number): V3 => {
  const z = zc(x) + dz;
  return [x, ground(x, z), z];
};

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

const Water: React.FC<{ tint: number; dark: number }> = ({ tint, dark }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} renderOrder={2}>
    <planeGeometry args={[700, 60]} />
    <meshStandardMaterial color={mixC(mixC("#4C7A5C", "#4E6E78", tint), "#465A4C", dark)} emissive={mixC(mixC("#1C3424", "#1C2E36", tint), "#3A3A30", dark)}
      roughness={0.55} metalness={0} transparent opacity={0.84} />
  </mesh>
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

// ------------------------------------------------------------------ assets
const GLB_FILES = ["tree_palmTall", "tree_palmDetailedTall", "tree_palmBend", "tree_palmShort", "tree_pineTallA", "tree_pineDefaultA",
  "tree_cone_dark", "plant_bushLarge", "plant_bushDetailed", "grass_leafsLarge", "grass_large", "rock_largeA", "rock_largeC", "rock_tallA",
  "lily_large", "log_large", "plant_flatTall"] as const;
type GName = (typeof GLB_FILES)[number];
type Assets = { glb: Record<GName, THREE.Group> };

function useAssets(): Assets | null {
  const [a, setA] = useState<Assets | null>(null);
  const [handle] = useState(() => delayRender("012 glb"));
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

const NAME_COL: Record<string, string> = {
  grass: "#5F7F38", leafsGreen: "#56803A", leafsDark: "#3B5C30", dirt: "#7A7062", woodBark: "#6B4B33", woodBarkDark: "#4E3A2B",
  woodInner: "#C8A87E", colorRed: "#B9583F", _defaultMat: "#7A7062",
};
function flatClone(src: THREE.Group) {
  const o = src.clone(true);
  o.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mats = ([] as THREE.Material[]).concat(mesh.material).map((mt) =>
      new THREE.MeshStandardMaterial({ color: new THREE.Color(NAME_COL[mt.name] ?? "#777777"), roughness: 0.9, metalness: 0, flatShading: true }));
    mesh.material = mats.length === 1 ? mats[0] : mats;
  });
  const box = new THREE.Box3().setFromObject(o);
  o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  const g = new THREE.Group();
  g.add(o);
  return { g, h: box.max.y - box.min.y };
}

// places that must stay free of plants (x, z, radius)
const KEEP: [number, number, number][] = [];

type Plant = { n: GName; x: number; z: number; s: number; r: number };
const Flora: React.FC<{ A: Assets }> = ({ A }) => {
  const objs = useMemo(() => {
    const r = rng(12);
    const out: Plant[] = [];
    const put = (n: GName, s: number, dmin: number, dmax: number, xr: [number, number], k: number) => {
      for (let i = 0; i < k; i++) {
        const x = lerp(xr[0], xr[1], r());
        const side = r() < 0.55 ? 1 : -1;
        const z = zc(x) + side * lerp(dmin, dmax, r() ** 1.3);
        out.push({ n, x, z, s: s * (0.75 + 0.5 * r()), r: r() * TAU });
      }
    };
    put("tree_palmTall", 9, 14, 40, [-60, 80], 36);
    put("tree_palmDetailedTall", 8, 13.5, 35, [-60, 80], 28);
    put("tree_palmBend", 7, 12, 22, [-50, 70], 18);
    put("tree_palmShort", 4, 11.5, 30, [-50, 70], 24);
    put("tree_pineTallA", 17, 24, 70, [-80, 100], 34);
    put("tree_pineDefaultA", 13, 22, 70, [-80, 100], 24);
    put("tree_cone_dark", 11, 26, 80, [-80, 100], 22);
    put("plant_bushLarge", 2.2, 11, 30, [-40, 60], 44);
    put("plant_bushDetailed", 1.6, 10.6, 26, [-40, 60], 44);
    put("grass_leafsLarge", 1.3, 10.3, 24, [-30, 50], 90);
    put("plant_flatTall", 1.4, 10.5, 24, [-30, 50], 44);
    put("rock_largeA", 1.8, 10, 40, [-40, 60], 16);
    put("rock_largeC", 1.4, 9.5, 30, [-40, 60], 14);
    put("rock_tallA", 4, 25, 60, [-50, 70], 8);
    put("log_large", 0.9, 10, 18, [-20, 40], 6);
    for (let i = 0; i < 30; i++) {
      const x = lerp(-20, 40, r());
      out.push({ n: "lily_large", x, z: zc(x) + (r() < 0.5 ? 1 : -1) * lerp(7.2, 9.2, r()), s: 0.9, r: r() * TAU });
    }
    const path: V3[] = [];
    for (let t = 0; t <= 62.5; t += 0.08) path.push(camAt(t).p);
    const tall = (n: GName) => n.startsWith("tree_pine") || n === "tree_cone_dark" || n === "tree_palmTall" || n === "tree_palmDetailedTall";
    const clear = out.filter((p) => {
      // sky window behind the T. rex (+x, +z) so the asteroid and the fireball read
      if (tall(p.n) && p.x > 14 && p.x < 70 && p.z > zc(p.x) + 14 && p.z < 110) return false;
      if (KEEP.some(([kx, kz, kr]) => Math.hypot(p.x - kx, p.z - kz) < kr + p.s * 0.25)) return false;
      const top = ground(p.x, p.z) + p.s;
      return !path.some((c) => Math.hypot(c[0] - p.x, c[2] - p.z) < 3.2 + p.s * 0.35 && top > c[1] - 1.5);
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
  <group position={[-120, 0, 240]}>
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

// ------------------------------------------------------------------ procedural snake
// Centreline = NS+1 points from head (s = 0) to tail (s = L). Body = tube with a boa radius profile, flat-shaded,
// vertex-coloured saddles; head = upper skull + hinged lower jaw, oriented along the first segment.
type SnakeLook = { L: number; R: number; base: string; belly: string; blotch: string; spot: string; eye: string };
const TITAN: SnakeLook = { L: 13, R: 0.5, base: "#6B6438", belly: "#D2C28C", blotch: "#2F2B1C", spot: "#8C8450", eye: "#D9A63A" };
const BABY: SnakeLook = { L: 0.95, R: 0.032, base: "#6B6438", belly: "#D2C28C", blotch: "#2F2B1C", spot: "#8C8450", eye: "#D9A63A" };
const FOSSIL: SnakeLook = { L: 3.0, R: 0.075, base: "#E6D8B6", belly: "#E6D8B6", blotch: "#CDBB92", spot: "#E6D8B6", eye: "#5B4A36" };
const NS = 240, RM = 16;

function radiusAt(u: number) {
  // u = s / L (0 head .. 1 tail)
  if (u < 0.05) return lerp(0.52, 0.6, u / 0.05);
  if (u < 0.38) return lerp(0.6, 1, sstep(0.05, 0.38, u));
  if (u < 0.62) return 1;
  return lerp(1, 0.06, sstep(0.62, 1, u) ** 0.85);
}

type SnakeGeo = { geo: THREE.BufferGeometry; rad: Float32Array };
function buildSnakeGeo(L: SnakeLook): SnakeGeo {
  const n = (NS + 1) * RM;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const col = new Float32Array(n * 3);
  const rad = new Float32Array(NS + 1);
  const base = new THREE.Color(L.base), belly = new THREE.Color(L.belly), blotch = new THREE.Color(L.blotch), spot = new THREE.Color(L.spot), c = new THREE.Color();
  for (let i = 0; i <= NS; i++) {
    const u = i / NS;
    rad[i] = radiusAt(u);
    for (let j = 0; j < RM; j++) {
      const a = (j / RM) * TAU;
      const up = Math.sin(a), side = Math.cos(a);
      c.copy(base);
      // r02: 24 saddles + per-vertex scale checker -- dense pattern reads big, 11 fat saddles read like a garden snake
      const ph = u * 24 * TAU;
      if (up > 0.15 && Math.sin(ph) > 0.25 && u > 0.04) c.lerp(blotch, 0.85); // dorsal saddles
      if (Math.abs(side) > 0.7 && Math.sin(ph + Math.PI) > 0.55 && u > 0.04) c.lerp(blotch, 0.7); // lateral rings
      if (Math.abs(side) > 0.8 && Math.sin(ph + Math.PI) > 0.85) c.lerp(spot, 0.8);
      if (up < -0.45) c.copy(belly);
      c.multiplyScalar((i + j) % 2 === 0 ? 1.07 : 0.93);
      col.set([c.r, c.g, c.b], (i * RM + j) * 3);
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const idx: number[] = [];
  for (let i = 0; i < NS; i++)
    for (let j = 0; j < RM; j++) {
      const a = i * RM + j, b = i * RM + ((j + 1) % RM), cc = a + RM, d = b + RM;
      idx.push(a, b, cc, b, d, cc);
    }
  geo.setIndex(idx);
  return { geo, rad };
}

const UP = new THREE.Vector3(0, 1, 0);
const Snake: React.FC<{ sg: SnakeGeo; look: SnakeLook; pts: V3[]; jaw: number; frost?: number; dark?: number; glow?: number; g?: number }> = ({ sg, look, pts, jaw, frost = 0, dark = 0, glow = 0, g = 1 }) => {
  const geo = useMemo(() => sg.geo.clone(), [sg]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), []);
  const jawMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), []);
  const R = look.R * g;
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  const a = p.array as Float32Array;
  const T = new THREE.Vector3(), Rt = new THREE.Vector3(), Up = new THREE.Vector3(), P = new THREE.Vector3();
  let prevR = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i <= NS; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(NS, i + 1);
    T.set(pts[i0][0] - pts[i1][0], pts[i0][1] - pts[i1][1], pts[i0][2] - pts[i1][2]).normalize();
    Rt.crossVectors(T, UP);
    if (Rt.lengthSq() < 1e-6) Rt.copy(prevR);
    Rt.normalize();
    prevR = Rt.clone();
    Up.crossVectors(Rt, T).normalize();
    const r = sg.rad[i] * R;
    P.set(...pts[i]);
    for (let j = 0; j < RM; j++) {
      const ang = (j / RM) * TAU;
      const cx = Math.cos(ang) * r, cy = Math.sin(ang) * r * (Math.sin(ang) < 0 ? 0.78 : 0.95);
      const k = (i * RM + j) * 3;
      a[k] = P.x + Rt.x * cx + Up.x * cy;
      a[k + 1] = P.y + Rt.y * cx + Up.y * cy;
      a[k + 2] = P.z + Rt.z * cx + Up.z * cy;
    }
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const tint = new THREE.Color("#FFFFFF").lerp(new THREE.Color("#CBCFD2"), frost * 0.6).lerp(new THREE.Color("#5A5550"), dark);
  mat.color.copy(tint);
  mat.emissive.set(glow > 0 ? "#FFE0A0" : "#9FC8FF");
  mat.emissiveIntensity = glow > 0 ? glow * 0.5 : frost * 0.04;
  headMat.color.copy(new THREE.Color(look.base)).multiply(tint);
  headMat.emissive.copy(mat.emissive);
  headMat.emissiveIntensity = mat.emissiveIntensity;
  jawMat.color.copy(new THREE.Color(look.belly)).multiply(tint);
  // head frame
  const f = new THREE.Vector3(pts[0][0] - pts[3][0], pts[0][1] - pts[3][1], pts[0][2] - pts[3][2]).normalize();
  const rt = new THREE.Vector3().crossVectors(f, UP);
  if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0);
  rt.normalize();
  const up = new THREE.Vector3().crossVectors(rt, f).normalize();
  const m = new THREE.Matrix4().makeBasis(rt, up, f);
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const hs = (R / 0.42) * 1.15;
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow frustumCulled={false} />
      <group position={pts[0]} quaternion={q} scale={hs}>
        {/* upper skull + snout */}
        <group rotation={[-jaw * 0.4, 0, 0]}>
          <mesh position={[0, 0.03, 0.26]} scale={[0.21, 0.13, 0.42]} material={headMat} castShadow>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          <mesh position={[0, 0.0, 0.6]} scale={[0.135, 0.085, 0.22]} material={headMat} castShadow>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={`b${k}`} position={[k * 0.13, 0.12, 0.42]} rotation={[0, k * 0.15, 0]} scale={[0.07, 0.035, 0.13]} castShadow>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={look.blotch} roughness={0.8} flatShading />
            </mesh>
          ))}
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.165, 0.085, 0.45]}>
              <mesh scale={[0.045, 0.042, 0.05]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color={look.eye} roughness={0.35} emissive={look.eye} emissiveIntensity={0.15} />
              </mesh>
              <mesh position={[k * 0.035, 0.0, 0.025]} scale={[0.012, 0.05, 0.03]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#141210" />
              </mesh>
            </group>
          ))}
          {jaw > 0.05 && (
            <>
              <mesh position={[0, -0.07, 0.36]} scale={[0.2, 0.03, 0.36]}>
                <sphereGeometry args={[1, 10, 6]} />
                <meshStandardMaterial color="#9C4A48" roughness={0.8} />
              </mesh>
              {[-1, 1].map((k) => Array.from({ length: 6 }, (_, j) => (
                <mesh key={`${k}${j}`} position={[k * (0.17 - j * 0.02), -0.07, 0.18 + j * 0.09]} rotation={[Math.PI - 0.25, 0, 0]}>
                  <coneGeometry args={[0.013, 0.07, 4]} />
                  <meshStandardMaterial color="#F0E8D2" roughness={0.5} />
                </mesh>
              )))}
            </>
          )}
        </group>
        {/* lower jaw, hinged at the back of the head */}
        <group position={[0, -0.05, 0.02]} rotation={[jaw, 0, 0]}>
          <mesh position={[0, -0.03, 0.32]} scale={[0.18, 0.06, 0.42]} material={jawMat} castShadow>
            <sphereGeometry args={[1, 12, 6]} />
          </mesh>
          {jaw > 0.05 && (
            <mesh position={[0, 0.02, 0.33]} scale={[0.17, 0.025, 0.33]}>
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial color="#B5605C" roughness={0.8} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

// ---- centreline builders
// coil: loose 1.1-turn spiral on the ground, neck rising out of the inner end to a raised head
function coilPts(look: SnakeLook, c: V3, face: number, headUp: number, g = 1, wob = 0): V3[] {
  const L = look.L, k = (L / 13) * g, R = look.R * g;
  const Lh = 0.2 * L;
  const out: V3[] = new Array(NS + 1);
  const iJ = Math.round((Lh / L) * NS);
  // spiral from the junction (inner, raised) outwards to the tail
  let phi = face + Math.PI * 0.6;
  for (let i = iJ; i <= NS; i++) {
    const q = (i - iJ) / (NS - iJ);
    const r = lerp(0.95, 2.1, q) * k;
    if (i > iJ) phi -= (L / NS) * g / r;
    const y = c[1] + R * 0.9 + lerp(1.7, 0, q) * R + (wob ? 0.04 * Math.sin(phi * 3 + wob) * k : 0);
    out[i] = [c[0] + Math.cos(phi) * r, y, c[2] + Math.sin(phi) * r];
  }
  // neck: cubic Bezier from the junction to the raised head
  const J = new THREE.Vector3(...out[iJ]);
  const nx = new THREE.Vector3(...out[iJ + 1]);
  const d = J.clone().sub(nx).normalize();
  const hd = new THREE.Vector3(Math.cos(face), -0.25, Math.sin(face)).normalize();
  const H = new THREE.Vector3(c[0] + Math.cos(face) * 1.2 * k, c[1] + headUp * k, c[2] + Math.sin(face) * 1.2 * k);
  const c1 = J.clone().addScaledVector(d, 0.9 * k).add(new THREE.Vector3(0, 0.5 * k, 0));
  const c2 = H.clone().addScaledVector(hd, -0.9 * k);
  for (let i = 0; i < iJ; i++) {
    const t = 1 - i / iJ;
    const b = J.clone().multiplyScalar((1 - t) ** 3).addScaledVector(c1, 3 * (1 - t) ** 2 * t).addScaledVector(c2, 3 * (1 - t) * t * t).addScaledVector(H, t ** 3);
    out[i] = [b.x, b.y, b.z];
  }
  return out;
}

// path: polyline (x, dz from river centre) smoothed, arc-length sampled
type Path = { len: number; at: (u: number) => [number, number]; dir: (u: number) => [number, number] };
function makePath(ctrl: [number, number][]): Path {
  const P = ctrl.map(([x, dz]) => new THREE.Vector3(x, 0, zc(x) + dz));
  const curve = new THREE.CatmullRomCurve3(P, false, "centripetal");
  const len = curve.getLength();
  const at = (u: number): [number, number] => {
    if (u <= 0) {
      const p0 = curve.getPointAt(0), t0 = curve.getTangentAt(0);
      return [p0.x + t0.x * u, p0.z + t0.z * u];
    }
    if (u >= len) {
      const p1 = curve.getPointAt(1), t1 = curve.getTangentAt(1);
      return [p1.x + t1.x * (u - len), p1.z + t1.z * (u - len)];
    }
    const p = curve.getPointAt(u / len);
    return [p.x, p.z];
  };
  const dir = (u: number): [number, number] => {
    const t = curve.getTangentAt(clamp01(u / len));
    return [t.x, t.z];
  };
  return { len, at, dir };
}
// river swim -> shallows by the hatchlings -> up onto the bank
const PATH = makePath([[-16, 1.6], [-8, 2.4], [0, 2.0], [7, 2.6], [12, 4.0], [16, 6.0], [19.5, 7.6], [21.5, 10.2], [22.8, 12.6], [23.6, 14.6]]);
function pathPoint(look: SnakeLook, uHead: number, s: number, amp: number, lift: number, liftLen: number, g = 1): V3 {
  const L = look.L * g, R = look.R * g;
  const u = uHead - s;
  const [x0, z0] = PATH.at(u);
  const [dx, dz] = PATH.dir(u);
  const env = sstep(0, 1.6, s) * (1 - 0.4 * sstep(L * 0.7, L, s));
  const w = amp * Math.sin((u / 4.6) * TAU) * env;
  const x = x0 - dz * w, z = z0 + dx * w;
  const r = radiusAt(s / L) * R;
  const gnd = ground(x, z);
  let y = Math.max(gnd + r * 0.9, r * 0.22); // r02: more back above the water reads bigger
  if (s < liftLen) y += lift * (1 - s / liftLen) ** 1.5;
  return [x, y, z];
}
function pathPts(look: SnakeLook, uHead: number, amp: number, lift: number, liftLen: number, g = 1): V3[] {
  const out: V3[] = new Array(NS + 1);
  for (let i = 0; i <= NS; i++) out[i] = pathPoint(look, uHead, (i / NS) * look.L * g, amp, lift, liftLen, g);
  return out;
}
// the drop: head-first column falling out of the sky; once the head is in, the body "pours" in along PATH
const U_END = 14.2 + 0.6 * (T_POUR1 - T_REW1); // = uHeadAt(T_POUR1): whole body in the water
const U_ENTRY = U_END - TITAN.L;
const ENTRY: V3 = (() => {
  const [x, z] = PATH.at(U_ENTRY);
  return [x, 0, z];
})();
const pouredAt = (T: number) => (T < T_SPLASH ? 0 : TITAN.L * clamp01((T - T_SPLASH) / (T_POUR1 - T_SPLASH)));
function pourPts(T: number): V3[] {
  const L = TITAN.L, out: V3[] = new Array(NS + 1);
  const kf = clamp01((T - T_DROP0) / (T_SPLASH - T_DROP0));
  const yH = 15 * (1 - kf * kf); // r03: low enough that frame 0 already shows a big snake
  const sub = pouredAt(T);
  const [dx, dz] = PATH.dir(U_ENTRY);
  for (let i = 0; i <= NS; i++) {
    const s = (i / NS) * L;
    if (s < sub) {
      out[i] = pathPoint(TITAN, U_ENTRY + sub, s, 0.5 * sstep(0, 2.5, sub - s), 0, 1);
      continue;
    }
    const h = s - sub;
    const w = 0.5 * Math.sin(h * 1.1 - T * 8) * sstep(0, 2.5, h); // writhing in the air
    const back = 0.12 * h;
    out[i] = [ENTRY[0] - dx * back - dz * w, yH + h, ENTRY[2] - dz * back + dx * w];
  }
  return out;
}
const blendPts = (A: V3[], B: V3[], k: number): V3[] => (k <= 0 ? A : k >= 1 ? B : A.map((a, i) => [lerp(a[0], B[i][0], k), lerp(a[1], B[i][1], k), lerp(a[2], B[i][2], k)] as V3));

// ------------------------------------------------------------------ actors over time
const COIL0: V3 = onBank(-3, 10.9); // opening coil (Paleocene jungle)
const COIL_FACE0 = -2.15; // head looks toward -x/-z (camera side)
const BURROW: V3 = onBank(16, 15.6);
const COIL1: V3 = BURROW; // the grown Titanoboa ends coiled over the burrow
const HATCH: [number, number][] = [[21.4, 10.6], [22.4, 11.4], [20.6, 11.6], [23.2, 10.4]]; // x, dz
const ADULTS: { x: number; dz: number; yaw: number }[] = [{ x: 25.5, dz: 13.4, yaw: 2.6 }, { x: 27.8, dz: 12.0, yaw: 2.9 }];
const SLAB: V3 = onBank(4, -12.6);
const FOSSIL_ANCHOR: V3 = [SLAB[0], SLAB[1] + 1.15, SLAB[2] + 0.17];

function uHeadAt(T: number) {
  // head distance along PATH: swims in, waits at the shallows, strike, slow crawl up the bank
  // PATH arc length (measured): x 0 = 16.2, x 7 = 23.3, shallows by the hatchlings (19.5, 7.6) = 37.3, bank edge = 40.7
  let u = 14.2 + 0.6 * Math.min(T - T_REW1, 4.4);
  if (T > 11) u = 16.84 + (37.1 - 16.84) * ramp(T, 11, 25.6) * 0.15 + (37.1 - 16.84) * 0.85 * clamp01((T - 11) / 14.6);
  const strike = T < T_FREEZE ? ramp(T, T_STRIKE, T_FREEZE) * 0.6 : T < T_THAW ? 0.6 : lerp(0.6, 1.9, ramp(T, T_THAW, T_FLOP));
  u += strike * 1.6;
  if (T > T_FLOP + 0.3) u += 0.42 * Math.min(T - T_FLOP - 0.3, 6.5);
  u += 0.9 * ramp(T, T_GAR0 + 0.08, T_GSNAP) * (1 - 0.6 * ramp(T, T_GSWAL - 0.4, T_GSWAL + 0.4)); // lunge at the gar
  u -= 0.55 * pulse(T, 41.9, 44.0); // recoils from the T. rex
  return u;
}

type SState = { pts: V3[] | null; jaw: number; frost: number; dark: number; g: number; swim: boolean };
function snakeState(T: number): SState {
  // 0 .. 6.6: coiled in the jungle (breathing wobble), uncoils during the rewind
  if (T < T_POUR1) return { pts: pourPts(T), jaw: T < T_SPLASH ? 0.75 : 0.75 * (1 - ramp(T, T_SPLASH, T_SPLASH + 0.5)), frost: 0, dark: 0, g: 1, swim: false };
  const frozen = T >= T_FREEZE && T < T_THAW;
  const Tm = frozen ? T_FREEZE : T >= T_THAW ? T_FREEZE + (T - T_THAW) * 0.35 : T; // slow-mo after the thaw
  const uH = uHeadAt(T);
  const rear = T < T_STRIKE ? ramp(T, T_REAR, T_STRIKE - 0.25) : T < T_FREEZE ? 1 - 0.35 * ramp(T, T_STRIKE, T_FREEZE) : T < T_THAW ? 0.65 : 0.65 * (1 - ramp(T, T_THAW + 0.8, T_FLOP + 0.2));
  const crawl = T > T_FLOP ? 0.25 : 1;
  const amp = (T > 25.4 && T < T_FLOP ? 0.2 : 0.5) * crawl;
  // lateral wave travels with Tm (frozen during the freeze)
  // r02 rears: snap at the gar, gape-hiss at the T. rex
  const garLift = 1.3 * ramp(T, T_GAR0, T_GSNAP - 0.05) * (1 - ramp(T, T_GSWAL - 0.5, T_GSWAL + 0.5));
  const hissLift = 1.0 * pulse(T, 41.6, 44.3);
  const path = pathPts(TITAN, uH + 0.0 * Tm, amp, Math.max(1.25 * rear, garLift, hissLift), 3.8);
  const pts = path;
  let jaw = 0;
  if (T > T_GAR0 && T < T_GSWAL + 0.5) {
    jaw = T < 15.12 ? 1.3 * ramp(T, T_GAR0, 15.08) : T < T_GSNAP ? lerp(1.3, 0.34, (T - 15.12) / 0.08) : T < T_GSWAL ? 0.34 : 0.34 * (1 - ramp(T, T_GSWAL, T_GSWAL + 0.45));
  }
  if (T > T_STRIKE - 0.3 && T < T_THAW) jaw = 0.95 * ramp(T, T_STRIKE - 0.3, T_STRIKE + 0.3);
  if (T >= T_THAW) jaw = 0.95 * (1 - ramp(T, T_FLOP - 0.6, T_FLOP));
  if (T > 41.6 && T < 44.3) jaw = Math.max(jaw, 1.3 * pulse(T, 41.6, 44.3) ** 0.5); // wide gape-hiss at the T. rex
  const frost = ramp(T, 35.3, 37.4) * (1 - ramp(T, 47.5, 48.5)) + 0.0;
  const dark = clamp01((T - T_IMPACT - 0.4) / 2) * 0.75;
  if (T > 47.3 && T < T_GROW0) return { pts: null, jaw: 0, frost: 0, dark: 0, g: 1, swim: false };
  if (T >= T_GROW0) {
    const g = lerp(0.075, 1, ramp(T, T_GROW0, T_GROW1) ** 1.2);
    const face = -2.5 + 0.35 * ramp(T, 54, 56.5);
    const pt = coilPts(TITAN, COIL1, face, 1.6 + 0.6 * ramp(T, 54.6, 55.6), g, T * 0.8);
    return { pts: pt, jaw: 0.85 * pulse(T, T_NO - 0.1, T_NO + 1.2), frost: 0, dark: 0, g, swim: false };
  }
  return { pts, jaw, frost: Math.min(frost, 1), dark, g: 1, swim: T > T_POUR1 && T < 25.5 && !(T > T_GAR0 && T < T_GSWAL + 0.3) };
}

// ------------------------------------------------------------------ dinosaurs (Quaternius, clip by time)
type QLook = { length: number; colors: Record<string, string> };
const REX: QLook = { length: 12, colors: { Green: "#6B5A40", LightGreen: "#B39B72", Black: "#1C1712", Red: "#8E3B2E", LightYellow: "#E8D9A8" } };
const PARA: QLook = { length: 9.5, colors: { Green: "#5E7A4C", LightGreen: "#C2B585", LightYellow: "#E8D9A8", Red: "#B4553A" } };
const BONE: QLook = { length: 0.55, colors: {} };

const Dino: React.FC<{ asset: QAsset; look: QLook; clip: string; ct: number; once?: boolean; pos: V3; yaw: number; scale?: number; mono?: string; roll?: number }> = ({ asset, look, clip, ct, once, pos, yaw, scale = 1, mono, roll = 0 }) => {
  const inst = useMemo(() => {
    const o = SkeletonUtils.clone(asset.obj) as THREE.Group;
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const mats = ([] as THREE.Material[]).concat(mesh.material);
      const nm = mats.map((mt) => new THREE.MeshStandardMaterial({ color: new THREE.Color(mono ?? look.colors[mt.name] ?? "#888888"), roughness: 0.85, flatShading: true }));
      mesh.material = nm.length === 1 ? nm[0] : nm;
    });
    return { o, mixer: new THREE.AnimationMixer(o), actions: new Map<string, THREE.AnimationAction>() };
  }, [asset, look, mono]);
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
    <group position={pos} rotation={[0, yaw, roll]}>
      <group rotation={[0, -Math.PI / 2, 0]} scale={s}>
        <primitive object={inst.o} position={[-asset.center.x, -asset.minY, -asset.center.z]} />
      </group>
    </group>
  );
};

// where the T. rex stops (x, dz) at the end, ~6.5 m from the snake's head (21.8, 12.7), and the yaw that faces it
const REX_STOP: [number, number] = [25.7, 15.55];
const REX_BITE_YAW = Math.atan2(12.7 - (zc(25.7) + 15.55), -(21.8 - 25.7));
// T. rex: stands beside the stretched snake (as long as), walks east along the bank, comes back at the end
function rexState(T: number): { p: V3; yaw: number; clip: string; ct: number; once: boolean; vis: number } {
  if (T < 26) {
    const x = T < 10.6 ? -6.5 : -6.5 + 2.1 * (T - 10.6);
    const clip = T < 10.6 ? "Idle" : "Walk";
    return { p: onBank(x, 12.6), yaw: Math.PI, clip, ct: T, once: false, vis: 1 - ramp(T, 17.2, 17.8) };
  }
  // return from the east toward the snake on the bank, turn on it and lunge-bite (r02: was a roar 9 m away)
  // facing for this rig = (-cos yaw, sin yaw) in (x, z)
  const k = ramp(T, T_REXIN, T_ROAR - 0.1);
  const x = lerp(40, REX_STOP[0], k);
  const dz = lerp(19, REX_STOP[1], k);
  let clip = T < T_ROAR - 0.1 ? "Walk" : "Idle", ct = T, once = false;
  if (T >= T_ROAR && T < T_ROAR + 1.17) { clip = "Attack"; ct = T - T_ROAR; }
  if (T >= T_REXDIE) { clip = "Death"; ct = T - T_REXDIE; once = true; }
  const yaw = lerp(-0.25, REX_BITE_YAW, ramp(T, T_ROAR - 1.0, T_ROAR - 0.1));
  const lunge = 1.3 * pulse(T, T_ROAR + 0.05, T_ROAR + 1.15);
  const p = onBank(x - Math.cos(yaw) * lunge, dz + Math.sin(yaw) * lunge);
  return { p, yaw, clip, ct, once, vis: ramp(T, T_REXIN - 0.4, T_REXIN) * (1 - ramp(T, 47.6, 48.2)) };
}

// ------------------------------------------------------------------ effects (011)
const Splash: React.FC<{ t: number; p: V3; n?: number; size?: number; rings?: boolean }> = ({ t, p, n = 40, size = 1, rings = false }) => {
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
          <mesh key={i} position={[Math.cos(q.a) * q.v * t, y, Math.sin(q.a) * q.v * t]} scale={q.s * Math.sqrt(size) * 0.7}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#E6F1EC" roughness={0.3} />
          </mesh>
        );
      })}
      {rings && [0, 0.35].map((d, i) => {
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

// head frame from a centreline: snout tip direction f, right rt, up; mouth = where prey sits between the jaws
const HS_TITAN = (TITAN.R / 0.42) * 1.15;
function headFrame(pts: V3[]) {
  const f = new THREE.Vector3(pts[0][0] - pts[3][0], pts[0][1] - pts[3][1], pts[0][2] - pts[3][2]).normalize();
  const rt = new THREE.Vector3().crossVectors(f, UP);
  if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0);
  rt.normalize();
  const up = new THREE.Vector3().crossVectors(rt, f).normalize();
  const mouth = new THREE.Vector3(...pts[0]).addScaledVector(f, 0.42 * HS_TITAN).addScaledVector(up, -0.05 * HS_TITAN);
  return { f, rt, up, mouth };
}

// "Plenty of fish": a 1.5 m gar (Hell Creek had gars) leaps; the snake snaps it mid-air, holds it crosswise, swallows
function garState(T: number): { p: V3; q: THREE.Quaternion; s: number } | null {
  if (T < T_GAR0 || T > T_GSWAL + 0.5) return null;
  const Z = new THREE.Vector3(0, 0, 1);
  if (T < T_GSNAP) {
    const hs = snakeState(T_GSNAP).pts!;
    const M = headFrame(hs).mouth;
    const fh = headFrame(hs).f.clone().setY(0).normalize();
    const L0 = M.clone().addScaledVector(fh, 2.6).setY(-0.4);
    const at = (t: number) => {
      const k = clamp01((t - T_GAR0) / (T_GSNAP - T_GAR0));
      return L0.clone().lerp(M, k).add(new THREE.Vector3(0, 1.3 * Math.sin(Math.PI * k), 0));
    };
    const p = at(T), v = at(T + 0.02).sub(p).normalize();
    return { p: [p.x, p.y, p.z], q: new THREE.Quaternion().setFromUnitVectors(Z, v), s: 1 };
  }
  const pts = snakeState(T).pts;
  if (!pts) return null;
  const hf = headFrame(pts);
  const wig = 0.35 * Math.sin(T * 15) * Math.exp(-(T - T_GSNAP) * 1.6);
  const axis = hf.rt.clone().applyAxisAngle(hf.up, wig);
  return { p: [hf.mouth.x, hf.mouth.y, hf.mouth.z], q: new THREE.Quaternion().setFromUnitVectors(Z, axis), s: 1 - ramp(T, T_GSWAL, T_GSWAL + 0.45) };
}
const Gar: React.FC<{ T: number }> = ({ T }) => {
  const g = garState(T);
  if (!g || g.s <= 0.01) return null;
  return (
    <group position={g.p} quaternion={g.q} scale={g.s}>
      <mesh scale={[0.13, 0.15, 0.62]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#7E8460" roughness={0.45} metalness={0.15} flatShading />
      </mesh>
      <mesh position={[0, -0.05, 0.02]} scale={[0.11, 0.09, 0.55]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color="#D9D5B4" roughness={0.5} flatShading />
      </mesh>
      {/* long toothy gar snout */}
      <mesh position={[0, 0.0, 0.8]} rotation={[Math.PI / 2, 0, 0]} scale={[0.06, 0.44, 0.045]}>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial color="#6E7452" roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 0.04, -0.7]} rotation={[0, Math.PI / 2, 0]} scale={[0.22, 0.24, 0.02]}>
        <circleGeometry args={[1, 5]} />
        <meshStandardMaterial color="#5E6446" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {[-0.35, -0.12, 0.1, 0.3].map((z, i) => (
        <mesh key={i} position={[(i % 2 ? 1 : -1) * 0.1, 0.07, z]} scale={0.035}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color="#2E2A1C" />
        </mesh>
      ))}
      <mesh position={[0.1, 0.05, 0.42]} scale={0.03}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
};

// scale ghost: a 1.8 m person standing in the shallows next to the snake's neck ("Over a ton")
const GHOST_S = 2.4; // m behind the head
function ghostPos(T: number): V3 | null {
  const pts = snakeState(T).pts;
  if (!pts) return null;
  const n = pts[Math.round((GHOST_S / TITAN.L) * NS)];
  return [n[0] - 0.2, -0.15, n[2] - 1.45];
}
const Ghost: React.FC<{ p: V3; o: number }> = ({ p, o }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#E8F3FA", transparent: true, depthWrite: false }), []);
  mat.opacity = 0.62 * o;
  if (o <= 0.01) return null;
  const cap = (pos: V3, r: number, len: number, rz = 0, key = "") => (
    <mesh key={key} position={pos} rotation={[0, 0, rz]} material={mat}>
      <capsuleGeometry args={[r, len, 4, 10]} />
    </mesh>
  );
  return (
    <group position={p}>
      {cap([-0.1, 0.45, 0], 0.075, 0.72, 0, "l1")}
      {cap([0.1, 0.45, 0], 0.075, 0.72, 0, "l2")}
      {cap([0, 1.18, 0], 0.17, 0.42, 0, "t")}
      {cap([-0.28, 1.12, 0], 0.05, 0.56, 0.12, "a1")}
      {cap([0.28, 1.12, 0], 0.05, 0.56, -0.12, "a2")}
      <mesh position={[0, 1.66, 0]} material={mat}>
        <sphereGeometry args={[0.12, 12, 10]} />
      </mesh>
    </group>
  );
};

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
    </group>
  );
};

// leaping fish ("Plenty of fish")
const FISH = Array.from({ length: 9 }, (_, i) => {
  const r = rng(40 + i);
  return { x: 8.5 + r() * 5, dz: -1.5 + r() * 4, t0: 14.45 + i * 0.14 + r() * 0.12, a: r() * TAU, v: 1.6 + r() * 1.2, up: 4 + r() * 1.5 };
});
const LeapFish: React.FC<{ T: number }> = ({ T }) => (
  <>
    {FISH.map((f, i) => {
      const t = T - f.t0;
      if (t < 0 || t > 1.0) return null;
      const y = f.up * t - 4.9 * t * t;
      if (y < -0.1) return null;
      const x = f.x + Math.cos(f.a) * f.v * t, z = zc(f.x) + f.dz + Math.sin(f.a) * f.v * t;
      const pitch = Math.atan2(f.up - 9.8 * t, f.v);
      return (
        <group key={i} position={[x, y, z]} rotation={[0, -f.a + Math.PI / 2, 0]}>
          <group rotation={[-pitch, 0, 0]}>
            <mesh scale={[0.07, 0.12, 0.3]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#C9D3B4" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]} scale={[0.02, 0.12, 0.12]}>
              <coneGeometry args={[1, 1, 4]} />
              <meshStandardMaterial color="#9AA58A" roughness={0.5} />
            </mesh>
          </group>
        </group>
      );
    })}
    {FISH.map((f, i) => <Splash key={`s${i}`} t={T - f.t0 - 0.85} p={[f.x + Math.cos(f.a) * f.v * 0.85, 0, zc(f.x) + f.dz + Math.sin(f.a) * f.v * 0.85]} n={8} size={0.35} />)}
  </>
);

const IMPACT: V3 = [190, 0, 430];
const Asteroid: React.FC<{ T: number }> = ({ T }) => {
  const a0 = 43.55;
  if (T < a0) return null;
  const S: V3 = [-160, 330, 520];
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
            <sphereGeometry args={[6, 16, 12]} />
            <meshBasicMaterial color="#FFE3A8" fog={false} />
          </mesh>
          <mesh quaternion={q} position={[-dir.x * 50, -dir.y * 50, -dir.z * 50]} userData={{ noNormal: true }}>
            <coneGeometry args={[7, 105, 16, 1, true]} />
            <meshBasicMaterial color="#FF9A4A" transparent opacity={0.75} fog={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {u > 0 && (
        <group position={IMPACT}>
          <mesh scale={[1, 0.8, 1]} userData={{ noNormal: true }}>
            <sphereGeometry args={[Math.min(170, 20 + u * 120), 24, 16, 0, TAU, 0, Math.PI / 2]} />
            <meshBasicMaterial color={mixC("#FFF2C8", "#B4441E", clamp01(u / 1.6))} transparent opacity={clamp01(1.4 - u * 0.25)} fog={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, Math.min(260, u * 70), 0]} scale={[1, 0.55, 1]} userData={{ noNormal: true }}>
            <sphereGeometry args={[Math.min(200, 30 + u * 60), 20, 12]} />
            <meshBasicMaterial color={mixC("#E0723A", "#3A2A22", clamp01((u - 0.6) / 2.5))} transparent opacity={clamp01(u * 1.5) * 0.85} fog={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]} userData={{ noNormal: true }}>
            <ringGeometry args={[u * 150, u * 150 + 14 + u * 6, 96]} />
            <meshBasicMaterial color="#F2B26A" transparent opacity={clamp01(1 - u / 4.2) * 0.8} fog={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </>
  );
};

// ash after the impact; cold mist over the water during the freeze
const Flakes: React.FC<{ center: V3; T: number; k: number; color: string; fall: number }> = ({ center, T, k, color, fall }) => {
  const P = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 220 }, () => ({ x: r() * 40 - 20, y: r() * 26, z: r() * 40 - 20, s: 0.03 + r() * 0.07, ph: r() * TAU, v: 0.6 + r() * 0.8 }));
  }, []);
  if (k <= 0.01) return null;
  return (
    <group position={[center[0], 0, center[2]]}>
      {P.map((q, i) => {
        const span = 26;
        let y = (q.y - T * q.v * fall) % span;
        if (y < 0) y += span;
        y = y + center[1] - 10;
        if (i / P.length > k) return null;
        return (
          <mesh key={i} position={[q.x + Math.sin(T + q.ph) * 0.4, y, q.z + Math.cos(T * 0.7 + q.ph) * 0.4]} scale={q.s}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};
const Mist: React.FC<{ k: number; T: number; c: V3 }> = ({ k, T, c }) => {
  // low banks of cold mist over the water only (z kept inside the channel)
  const P = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 22 }, () => ({ x: r() * 26 - 13, z: r() * 7 - 6, s: 1.0 + r() * 1.6, ph: r() * TAU }));
  }, []);
  if (k <= 0.01) return null;
  return (
    <group position={[c[0], 0.25, c[2]]}>
      {P.map((q, i) => (
        <mesh key={i} position={[q.x + Math.sin(T * 0.3 + q.ph) * 0.8, 0.15 + 0.12 * Math.sin(T + q.ph), q.z]} scale={[q.s, q.s * 0.28, q.s]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshBasicMaterial color="#E8F0F6" transparent opacity={0.1 * k} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

// straight measure bar between two points (tail -> head), growing with k
const MeasureBar: React.FC<{ a: V3; b: V3; k: number; color?: string }> = ({ a, b, k, color = "#F2C94C" }) => {
  if (k <= 0.001) return null;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), k);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const len = A.distanceTo(B);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), B.clone().sub(A).normalize());
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <boxGeometry args={[0.09, 0.09, len]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {[A, B].map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.25, p.z]}>
          <boxGeometry args={[0.08, 0.55, 0.08]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ fossil slab (Sanajeh coiled round a nest, India 67 Ma)
const FossilSlab: React.FC<{ sg: SnakeGeo; para: QAsset; glow: number; hatch: number }> = ({ sg, para, glow, hatch }) => {
  // snake lies in the slab plane (x, y) around three eggs
  const pts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    for (let i = 0; i <= NS; i++) {
      const u = i / NS;
      const a = 1.2 + u * 1.55 * TAU;
      const r = lerp(0.42, 0.86, u) + 0.05 * Math.sin(u * 30);
      out.push([FOSSIL_ANCHOR[0] + Math.cos(a) * r * 1.15, FOSSIL_ANCHOR[1] + Math.sin(a) * r * 0.62, FOSSIL_ANCHOR[2] + 0.02]);
    }
    return out;
  }, []);
  return (
    <group>
      <mesh position={[SLAB[0], SLAB[1] + 1.1, SLAB[2]]} castShadow receiveShadow>
        <boxGeometry args={[3.3, 2.3, 0.32]} />
        <meshStandardMaterial color="#A88E6A" roughness={1} flatShading />
      </mesh>
      <mesh position={[SLAB[0], SLAB[1] + 0.12, SLAB[2] + 0.1]} receiveShadow>
        <boxGeometry args={[3.7, 0.24, 0.9]} />
        <meshStandardMaterial color="#7E6A50" roughness={1} flatShading />
      </mesh>
      {[[-0.2, 0.02], [0.18, 0.12], [0.02, -0.18]].map(([dx, dy], i) => (
        <mesh key={i} position={[FOSSIL_ANCHOR[0] + dx, FOSSIL_ANCHOR[1] + dy, FOSSIL_ANCHOR[2] + 0.02]} scale={[0.2, 0.17, 0.12]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#D9CBA8" roughness={0.9} emissive="#FFE0A0" emissiveIntensity={glow * 0.25} />
        </mesh>
      ))}
      <Snake sg={sg} look={FOSSIL} pts={pts} jaw={0.25} glow={glow} />
      {/* hatchling skeleton: bone-white Parasaurolophus lying flat in the rock, lower right */}
      <Dino asset={para} look={BONE} clip="Death" ct={10} once pos={[FOSSIL_ANCHOR[0] + 1.05, FOSSIL_ANCHOR[1] - 0.5, FOSSIL_ANCHOR[2] + 0.04]}
        yaw={0} roll={0} mono={mixC("#E6D8B6", "#FFE6A0", hatch)} scale={1} />
    </group>
  );
};

// ------------------------------------------------------------------ burrow (tunnel + chamber, BackSide walls)
const TUN_DIR = new THREE.Vector3(-0.15, -0.5, 0.85).normalize();
const TUN_LEN = 4.4;
const CHAMBER: V3 = [BURROW[0] + TUN_DIR.x * (TUN_LEN + 1.2), BURROW[1] + TUN_DIR.y * (TUN_LEN + 1.2), BURROW[2] + TUN_DIR.z * (TUN_LEN + 1.2)];
const tunAt = (d: number, up = 0): V3 => [BURROW[0] + TUN_DIR.x * d, BURROW[1] + 0.05 + TUN_DIR.y * d + up, BURROW[2] + TUN_DIR.z * d];
const Burrow: React.FC<{ sg: SnakeGeo; T: number; vis: number }> = ({ sg, T, vis }) => {
  const tq = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), TUN_DIR), []);
  const babies = useMemo(() => [
    { c: [CHAMBER[0] - 0.45, CHAMBER[1] - 1.05, CHAMBER[2] + 0.1] as V3, f: 0.4 },
    { c: [CHAMBER[0] + 0.4, CHAMBER[1] - 1.05, CHAMBER[2] - 0.25] as V3, f: 2.3 },
    { c: [CHAMBER[0] + 0.15, CHAMBER[1] - 1.05, CHAMBER[2] + 0.55] as V3, f: 4.0 },
    { c: [CHAMBER[0] - 0.2, CHAMBER[1] - 1.05, CHAMBER[2] - 0.6] as V3, f: 1.2 },
  ], []);
  if (vis <= 0.01) return null;
  return (
    <group>
      {/* mound + dark mouth */}
      <mesh position={[BURROW[0], BURROW[1] - 0.15, BURROW[2]]} scale={[1.7, 0.5, 1.7]} castShadow receiveShadow>
        <sphereGeometry args={[1, 14, 8, 0, TAU, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7A6648" roughness={1} flatShading />
      </mesh>
      <mesh position={tunAt(0.15, 0.18)} quaternion={tq}>
        <cylinderGeometry args={[0.72, 0.72, 0.06, 18]} />
        <meshBasicMaterial color="#0E0B08" />
      </mesh>
      <mesh position={tunAt(TUN_LEN / 2 + 0.2)} quaternion={tq}>
        <cylinderGeometry args={[0.78, 0.78, TUN_LEN + 0.6, 18, 6, true]} />
        <meshStandardMaterial color="#5C4A34" roughness={1} side={THREE.BackSide} flatShading />
      </mesh>
      <mesh position={CHAMBER}>
        <sphereGeometry args={[1.65, 18, 12]} />
        <meshStandardMaterial color="#6A5640" roughness={1} side={THREE.BackSide} flatShading />
      </mesh>
      <pointLight position={[CHAMBER[0] - TUN_DIR.x * 1.2, CHAMBER[1] + 0.6, CHAMBER[2] - TUN_DIR.z * 1.2]} intensity={10} distance={7} decay={1.3} color="#FFDDB0" />
      {babies.map((b, i) => (
        <Snake key={i} sg={sg} look={BABY} pts={coilPts(BABY, b.c, b.f + 0.15 * Math.sin(T * 0.7 + i), 0.9, 1, T * 0.6 + i)} jaw={0} />
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ camera: Hermite spline (one take)
type Key = { t: number; p: V3; l: V3; fov: number };
const H0: V3 = [COIL0[0] + Math.cos(COIL_FACE0) * 1.2, COIL0[1] + 1.75, COIL0[2] + Math.sin(COIL_FACE0) * 1.2];
const CAM: Key[] = [
  // r03 opening drop: low camera on the water, looking up as the snake falls, down to the splash
  { t: 0.0, p: [ENTRY[0] - 2.2, 1.2, ENTRY[2] - 5.6], l: [ENTRY[0], 11.5, ENTRY[2]], fov: 60 }, // close: frame 0 = big falling snake
  { t: 0.6, p: [ENTRY[0] - 2.9, 1.2, ENTRY[2] - 7.2], l: [ENTRY[0], 10.2, ENTRY[2]], fov: 60 },
  { t: 1.0, p: [ENTRY[0] - 3.2, 1.1, ENTRY[2] - 8.2], l: [ENTRY[0], 5.0, ENTRY[2]], fov: 58 },
  { t: 1.35, p: [ENTRY[0] - 3.4, 1.05, ENTRY[2] - 8.9], l: [ENTRY[0], 1.8, ENTRY[2]], fov: 56 },
  // low along the body as it pours in and swims (eye-level scale)
  { t: 2.3, p: [-15.0, 1.2, -5.6], l: [-9.5, 0.7, 1.5], fov: 54 },
  { t: 3.9, p: [-7.8, 1.3, -3.9], l: [-4.0, 0.8, 1.8], fov: 50 },
  // rise during "send it back" to see the whole 13 m for the bar, T. rex on the far bank
  { t: 5.3, p: [-9.5, 4.6, -8.0], l: [-6.0, 0.6, 3.0], fov: 52 },
  { t: 6.7, p: [-10.5, 8.4, -10.0], l: [-8.5, 0.2, 3.5], fov: 52 },
  { t: 7.9, p: [-9.6, 8.0, -10.6], l: [-7.5, 0.4, 3.5], fov: 52 },
  // dip to the person ghost at the neck ("Over a ton"), then up for the two bars
  { t: 8.65, p: [-6.4, 1.1, -3.9], l: [-2.8, 0.8, 1.3], fov: 50 },
  { t: 9.15, p: [-4.6, 1.5, -3.8], l: [-1.8, 0.9, 1.4], fov: 50 },
  { t: 9.9, p: [-6.5, 8.4, -11.8], l: [-6.5, 2.0, 6.5], fov: 52 },
  { t: 11.6, p: [-6.0, 8.5, -8.5], l: [2, 0.8, 6], fov: 50 },
  { t: 13.4, p: [-1.5, 5.6, -6.2], l: [6.0, 0.6, 4.5], fov: 48 },
  { t: 15.15, p: [3.6, 0.85, -1.1], l: [6.9, 1.5, 3.4], fov: 50 }, // r02: low under the gar snap
  { t: 15.8, p: [4.9, 1.3, -0.7], l: [7.7, 1.2, 3.5], fov: 48 }, // holds the gar in its jaws
  { t: 16.65, p: [13.0, 3.6, 4.2], l: [21.6, 0.6, 12.4], fov: 46 },
  { t: 17.9, p: [12.0, 5.4, 0.2], l: [6.5, 0.8, -8.5], fov: 48 },
  { t: 19.6, p: [5.6, 2.6, -7.4], l: [4.1, 1.15, -12.4], fov: 46 },
  { t: 22.4, p: [3.3, 2.05, -6.3], l: [4.0, 1.15, -12.4], fov: 44 },
  { t: 24.7, p: [FOSSIL_ANCHOR[0] + 1.0, FOSSIL_ANCHOR[1] + 0.1, FOSSIL_ANCHOR[2] + 2.0], l: [FOSSIL_ANCHOR[0] + 0.95, FOSSIL_ANCHOR[1] - 0.42, FOSSIL_ANCHOR[2]], fov: 40 },
  { t: 25.9, p: [13.8, 2.6, 4.8], l: [19.6, 1.0, 10.4], fov: 46 },
  { t: 27.5, p: [16.0, 1.7, 6.9], l: [20.6, 1.3, 11.6], fov: 44 },
  { t: 28.5, p: [24.4, 2.0, 6.6], l: [20.8, 1.1, 11.0], fov: 44 },
  { t: 31.0, p: [25.8, 2.5, 9.2], l: [20.8, 1.1, 11.2], fov: 44 },
  { t: 34.0, p: [25.2, 2.2, 13.6], l: [20.6, 1.1, 11.0], fov: 44 },
  { t: 37.3, p: [22.6, 1.7, 16.6], l: [20.4, 1.0, 10.8], fov: 44 },
  { t: 39.6, p: [26.0, 2.8, 9.4], l: [21.8, 0.6, 12.4], fov: 46 },
  { t: 40.7, p: [24.6, 2.5, 8.0], l: [21.6, 0.5, 12.0], fov: 46 },
  { t: 41.4, p: [18.6, 3.0, 8.4], l: [25.0, 2.2, 15.4], fov: 50 },
  { t: 42.7, p: [18.6, 1.5, 10.4], l: [24.0, 3.0, 15.6], fov: 50 },
  { t: 43.9, p: [18.2, 1.6, 10.2], l: [40, 18, 32], fov: 52 },
  { t: 44.8, p: [18.0, 1.9, 10.0], l: [70, 26, 70], fov: 54 },
  { t: 46.2, p: [15.8, 3.2, 8.6], l: [26, 2.6, 17], fov: 50 },
  { t: 47.5, p: [13.2, 4.0, 11.4], l: [17.5, 0.6, 16.4], fov: 48 },
  { t: 48.3, p: tunAt(-2.2, 0.9), l: tunAt(1.2, 0), fov: 46 },
  { t: 48.95, p: tunAt(0.3, 0.05), l: tunAt(3.2, 0), fov: 50 },
  { t: 49.7, p: tunAt(2.6, 0.05), l: CHAMBER, fov: 52 },
  { t: 50.6, p: tunAt(TUN_LEN + 0.1, 0.25), l: [CHAMBER[0], CHAMBER[1] - 1.0, CHAMBER[2]], fov: 54 },
  { t: 51.5, p: tunAt(TUN_LEN + 0.5, 0.2), l: [CHAMBER[0] + 0.1, CHAMBER[1] - 1.05, CHAMBER[2] + 0.05], fov: 52 },
  { t: 52.1, p: tunAt(2.0, 0.05), l: tunAt(-1, 0.4), fov: 52 },
  { t: 52.75, p: tunAt(-0.6, 0.6), l: tunAt(-3, 1.6), fov: 52 },
  { t: 53.5, p: [BURROW[0] - 4.6, BURROW[1] + 3.2, BURROW[2] - 4.8], l: [BURROW[0], BURROW[1] + 0.6, BURROW[2]], fov: 46 },
  { t: 55.3, p: [BURROW[0] - 4.3, BURROW[1] + 2.4, BURROW[2] - 2.0], l: [BURROW[0] - 0.6, BURROW[1] + 1.5, BURROW[2] - 0.4], fov: 42 },
  { t: 56.6, p: [BURROW[0] - 3.6, BURROW[1] + 2.4, BURROW[2] - 2.4], l: [BURROW[0] - 0.8, BURROW[1] + 1.8, BURROW[2] - 0.6], fov: 40 },
  { t: 58.2, p: [BURROW[0] - 6.2, BURROW[1] + 4.0, BURROW[2] - 5.6], l: [BURROW[0], BURROW[1] + 1.2, BURROW[2]], fov: 44 },
  { t: 62.5, p: [BURROW[0] - 8.6, BURROW[1] + 6.2, BURROW[2] - 7.4], l: [BURROW[0], BURROW[1] + 1.0, BURROW[2]], fov: 46 },
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
const HITS: [number, number][] = [[T_SPLASH, 0.5], [T_POUR1 - 0.1, 0.2], [T_GSNAP, 0.18], [T_ROAR + 0.55, 0.3], [T_STRIKE + 0.7, 0.2], [T_ROAR + 0.3, 0.35], [T_IMPACT, 0.9], [T_WAVE + 0.2, 0.6], [T_REXDIE + 1.1, 0.35], [T_NO, 0.15]];
function hitEnv(T: number) {
  let e = 0;
  for (const [h, k] of HITS) if (T >= h) e = Math.max(e, k * Math.exp(-(T - h) * 3.2));
  return e;
}
// keep plants off the set pieces
KEEP.push([COIL0[0], COIL0[2], 3.4], [BURROW[0], BURROW[2], 3.8], [SLAB[0], SLAB[2], 3.2], [22, zc(22) + 11, 6.5], [24, zc(24) + 8.5, 4.5],
  [28, zc(28) + 16.5, 5], [34, zc(34) + 18, 4], [-6.5, zc(-6.5) + 12.6, 7], [5, zc(5) + 12.6, 6], [26, zc(26) + 13, 4], [REX_STOP[0], zc(REX_STOP[0]) + REX_STOP[1], 6.5]);

// ------------------------------------------------------------------ sky / light by era
type SkyS = { top: string; hor: string; sun: number; sunC: string; hemi: number; fog: string; fogF: number; dark: number; water: number };
const JUNGLE: SkyS = { top: "#7EAEC0", hor: "#F2DE9C", sun: 3.3, sunC: "#FFE6B0", hemi: 1.2, fog: "#D8DCA8", fogF: 230, dark: 0, water: 0 };
const CREEK: SkyS = { top: "#6E92B6", hor: "#DCE2E2", sun: 2.6, sunC: "#F0F4FF", hemi: 1.05, fog: "#CDD6DA", fogF: 320, dark: 0, water: 0.6 };
const COLD: SkyS = { top: "#5C7698", hor: "#C4CED8", sun: 1.9, sunC: "#DCE6FF", hemi: 0.95, fog: "#B6C4D0", fogF: 150, dark: 0.08, water: 1 };
const FIRE: SkyS = { top: "#6A3022", hor: "#EE8040", sun: 2.3, sunC: "#FFA868", hemi: 1.05, fog: "#C06A40", fogF: 260, dark: 0.25, water: 0.5 };
const ASH: SkyS = { top: "#3A2E26", hor: "#7A5A44", sun: 1.25, sunC: "#D09070", hemi: 0.85, fog: "#6A5040", fogF: 140, dark: 0.5, water: 0.5 };
const mixS = (a: SkyS, b: SkyS, k: number): SkyS => ({
  top: mixC(a.top, b.top, k), hor: mixC(a.hor, b.hor, k), sun: lerp(a.sun, b.sun, k), sunC: mixC(a.sunC, b.sunC, k), hemi: lerp(a.hemi, b.hemi, k),
  fog: mixC(a.fog, b.fog, k), fogF: lerp(a.fogF, b.fogF, k), dark: lerp(a.dark, b.dark, k), water: lerp(a.water, b.water, k),
});
function skyAt(T: number): SkyS {
  let s = CREEK;
  if (T > T_REW0 && T < T_REW1) {
    const flick = 0.5 + 0.5 * Math.cos((T - T_REW0) * 24);
    s = mixS(CREEK, { ...ASH, top: "#141A2C", hor: "#2B3346", fog: "#2B3346" }, (1 - flick) * 0.5);
  }
  if (T > 35.0) s = mixS(CREEK, COLD, ramp(T, 35.0, 37.0));
  if (T > 39.6) s = mixS(COLD, CREEK, ramp(T, 39.6, 41.5) * 0.6);
  if (T > T_IMPACT) s = mixS(mixS(COLD, CREEK, 0.6), FIRE, ramp(T, T_IMPACT, T_IMPACT + 1.2));
  if (T > T_IMPACT + 1.2) s = mixS(FIRE, ASH, ramp(T, T_IMPACT + 1.2, 47.5));
  if (T > T_OUT) s = mixS(ASH, JUNGLE, ramp(T, T_OUT, T_OUT + 0.7));
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

type Rigs = { titan: SnakeGeo; baby: SnakeGeo; fossil: SnakeGeo };
const World: React.FC<{ T: number; cam: V3; look: V3; fov: number; A: Assets; rigs: Rigs; rex: QAsset; para: QAsset }> = ({ T, cam, look, fov, A, rigs, rex, para }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(look[0], 0, look[2]);
  const sky = skyAt(T);
  const under = cam[1] < ground(cam[0], cam[2]) - 0.15 || (T > 48.9 && T < 52.3); // in the burrow
  const dist = Math.hypot(cam[0] - look[0], cam[1] - look[1], cam[2] - look[2]);
  const S = Math.max(18, Math.min(70, dist * 1.6));
  const frozen = T >= T_FREEZE && T < T_THAW;
  const Ta = frozen ? T_FREEZE : T >= T_THAW && T < T_FLOP + 0.5 ? T_FREEZE + (T - T_THAW) * 0.35 : T;
  const ss = snakeState(T);
  const rs = rexState(T);
  const era66 = T < T_OUT + 0.3 ? 1 : 0;
  const ash = T > T_IMPACT + 0.6 && T < T_OUT ? clamp01((T - T_IMPACT - 0.6) / 1.2) : 0;
  const fogC = under ? "#1A140E" : sky.fog;
  const fogN = under ? 2.5 : 40, fogF = under ? 9 : sky.fogF;
  const head = ss.pts ? ss.pts[0] : ([0, 0, 0] as V3);
  const hd = ss.pts ? [ss.pts[0][0] - ss.pts[4][0], ss.pts[0][2] - ss.pts[4][2]] : [1, 0];
  return (
    <>
      <Cam pos={cam} look={look} fov={fov} />
      <fog attach="fog" args={[fogC, fogN, fogF]} />
      <primitive object={tgt} />
      <hemisphereLight args={[mixC("#DDE8F2", sky.top, 0.3), "#5A5038", sky.hemi * (under ? 0.12 : 1)]} />
      <directionalLight position={[look[0] - S * 0.8, S * 1.4, look[2] - S * 0.9]} target={tgt} intensity={sky.sun * (under ? 0.05 : 1)} color={sky.sunC} castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
        shadow-camera-near={0.5} shadow-camera-far={S * 6} shadow-bias={-0.0004} shadow-normalBias={S * 0.0015} />
      {T > T_IMPACT && T < 48.5 && <directionalLight position={[IMPACT[0], 60, IMPACT[2]]} intensity={3.5 * Math.exp(-(T - T_IMPACT) * 0.8)} color="#FFB060" />}
      <Sky top={sky.top} hor={sky.hor} />
      <Terrain />
      <Water tint={sky.water} dark={sky.dark} />
      <Flora A={A} />
      <Volcano T={T} />
      {/* Titanoboa */}
      {ss.pts && <Snake sg={rigs.titan} look={TITAN} pts={ss.pts} jaw={ss.jaw} frost={ss.frost} dark={ss.dark} g={ss.g} />}
      <Wake p={head} yaw={Math.atan2(hd[0], hd[1])} k={ss.swim ? 0.8 : 0} T={T} len={6} />
      {/* r02 drop: one big hit where the head goes in, foam while the body pours in, tail slap at the end */}
      <Splash t={T - T_SPLASH} p={ENTRY} n={70} size={1.9} rings />
      {[0.3, 0.6].map((d) => <Splash key={d} t={T - T_SPLASH - d} p={ENTRY} n={22} size={0.9} />)}
      <Splash t={T - T_POUR1 + 0.1} p={ENTRY} n={30} size={1.1} rings />
      {/* gar: leaps out, snatched, swallowed */}
      <Splash t={T - T_GAR0} p={(() => { const g = garState(T_GAR0 + 0.01); return g ? ([g.p[0], 0, g.p[2]] as V3) : ENTRY; })()} n={20} size={0.7} rings />
      <Splash t={T - T_GSNAP} p={(() => { const g = garState(T_GSNAP); return g ? g.p : ENTRY; })()} n={26} size={0.6} />
      <Gar T={T} />
      {(() => {
        const gp = T > 7.9 && T < 10.0 ? ghostPos(T) : null;
        return gp ? <Ghost p={gp} o={ramp(T, 8.05, 8.4) * (1 - ramp(T, 9.55, 9.9))} /> : null;
      })()}
      {/* 13 m bar along the snake, 12 m bar along the T. rex */}
      {ss.pts && T > 6.5 && T < 11.5 && (
        <MeasureBar a={[ss.pts[NS][0], 1.35, ss.pts[NS][2]]} b={[ss.pts[0][0], 1.35, ss.pts[0][2]]} k={ramp(T, 6.8, 7.9) * (1 - ramp(T, 10.9, 11.3))} />
      )}
      {T > 9.4 && T < 11.5 && (
        <MeasureBar a={[rs.p[0] - 6, rs.p[1] + 5.6, rs.p[2]]} b={[rs.p[0] + 6, rs.p[1] + 5.6, rs.p[2]]} k={ramp(T, 9.6, 10.5) * (1 - ramp(T, 10.9, 11.3))} color="#E8735A" />
      )}
      {/* T. rex */}
      {era66 > 0 && rs.vis > 0.01 && (
        <Dino asset={rex} look={REX} clip={rs.clip} ct={rs.ct} once={rs.once} pos={rs.p} yaw={rs.yaw} scale={rs.vis} />
      )}
      {/* baby hadrosaurs at the water's edge + two adults; they run when the T. rex comes */}
      {era66 > 0 && T > 10 && T < 48 && HATCH.map(([x, dz], i) => {
        const startle = T - (T_THAW + 0.6 + i * 0.15);
        const run = startle > 0 && T < 44;
        const dx = run ? Math.max(0, startle) * 1.6 : 0, dzz = run ? Math.max(0, startle) * 0.9 : 0;
        const fr = frozen ? T_FREEZE : T;
        return <Dino key={i} asset={para} look={{ ...PARA, length: 2.0 }} clip={run ? (T < T_FLOP + 1 ? "Walk" : "Run") : "Idle"} ct={(run ? Ta : fr) * (run && T < T_FLOP ? 0.5 : 1) + i * 0.4}
          pos={onBank(x + dx, dz + dzz)} yaw={run ? -2.3 + i * 0.2 : 2.2 + i * 0.5} scale={T > 45.6 + i * 0.1 ? 1 - ramp(T, 45.8, 46.4) : 1} />;
      })}
      {era66 > 0 && T > 10 && T < 48 && ADULTS.map((a, i) => {
        const dieT = 45.9 + i * 0.35;
        const run = T > T_REXIN && T < dieT;
        const x = a.x + (run ? (T - T_REXIN) * 2.2 : 0), dz = a.dz + (run ? (T - T_REXIN) * 3 : 0);
        return <Dino key={`a${i}`} asset={para} look={PARA} clip={T >= dieT ? "Death" : run ? "Run" : "Idle"} ct={T >= dieT ? T - dieT : (frozen ? T_FREEZE : T) + i} once={T >= dieT}
          pos={onBank(x, dz)} yaw={run ? 1.9 : a.yaw} />;
      })}
      <LeapFish T={T} />
      <FossilSlab sg={rigs.fossil} para={para} glow={pulse(T, 21.6, 23.6)} hatch={pulse(T, 24.6, 25.6)} />
      <Burrow sg={rigs.baby} T={T} vis={T > 46 && T < T_GROW0 + 0.6 ? 1 : 0} />
      <Mist k={ramp(T, 35.3, 37.0) * (1 - ramp(T, 40.5, 42))} T={T} c={[20.5, 0, zc(20.5) + 8]} />
      {!under && <Asteroid T={T} />}
      <Flakes center={cam} T={T} k={ash} color="#9A948C" fall={1.4} />
      <Flakes center={cam} T={T} k={T > 35.4 && T < 41 ? 0.45 * ramp(T, 35.4, 36.4) * (1 - ramp(T, 40, 41)) : 0} color="#EEF4FA" fall={0.6} />
    </>
  );
};

// ------------------------------------------------------------------ on-screen text
function project(p: V3, cam: V3, look: V3, fov: number, w: number, h: number) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.01, 2000);
  c.position.set(...cam);
  c.lookAt(new THREE.Vector3(...look));
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h, ok: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 };
}

const BarLabel: React.FC<{ x: number; y: number; name: string; val: string; color: string; o: number }> = ({ x, y, name, val, color, o }) => (
  <div style={{ position: "absolute", left: Math.min(Math.max(x, 220), 860), top: Math.min(Math.max(y, 640), 1120), transform: "translate(-50%, -100%)", textAlign: "center", opacity: o }}>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 26, letterSpacing: 5, color, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{name}</div>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 104, lineHeight: 1, color: C.bone, WebkitTextStroke: "5px rgba(10,14,15,0.95)", paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{val}</div>
  </div>
);

const BigCounter: React.FC<{ top: string; val: string; sub: string; o: number; pop: number; color?: string }> = ({ top, val, sub, o, pop, color }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", opacity: o, transform: `scale(${1 + 0.12 * pop})` }}>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: 7, color: C.ochreLight, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{top}</div>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 150, lineHeight: 1.02, color: color ?? C.bone, WebkitTextStroke: "6px rgba(10,14,15,0.95)", paintOrder: "stroke fill" }}>{val}</div>
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

// ------------------------------------------------------------------ main
const useScene = () => {
  const A = useAssets();
  const rex = useFBX("free/Trex.fbx");
  const para = useFBX("free/Parasaurolophus.fbx");
  const rigs = useMemo<Rigs>(() => ({ titan: buildSnakeGeo(TITAN), baby: buildSnakeGeo(BABY), fossil: buildSnakeGeo(FOSSIL) }), []);
  return A && rex && para ? { A, rex, para, rigs } : null;
};

export const Short012_3D: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const sc = useScene();
  const T = f / fps;
  const c = camAt(T);
  const h = hitEnv(T);
  const dist = Math.hypot(c.p[0] - c.l[0], c.p[1] - c.l[1], c.p[2] - c.l[2]);
  const amp = Math.min(1.2, dist / 10) * h;
  const cam: V3 = [c.p[0] + amp * Math.sin(T * 61), c.p[1] + amp * Math.sin(T * 47 + 1.3), c.p[2] + amp * Math.sin(T * 53 + 2.1)];
  const look: V3 = [c.l[0] + amp * 0.6 * Math.sin(T * 43 + 0.7), c.l[1] + amp * 0.6 * Math.sin(T * 57 + 2.4), c.l[2]];
  const sky = skyAt(T);
  const flash = (T >= T_IMPACT ? Math.exp(-(T - T_IMPACT) * 2.6) : 0) + 0.85 * pulse(T, T_OUT + 0.35, T_OUT + 1.05);
  const freezeK = T >= T_FREEZE && T < T_THAW + 0.3 ? 1 - ramp(T, T_THAW - 0.2, T_THAW + 0.3) : 0;
  const warmK = ramp(T, 30.6, 31.3) * (1 - ramp(T, 34.4, 35.1));
  const coldK = ramp(T, 35.0, 36.2) * (1 - ramp(T, 40.5, 42));
  const markIn = interpolate(f, [p.scenes[1].startFrame, p.scenes[1].startFrame + 20], [0, 1], CLAMP);
  // bar labels
  const ss = snakeState(T), rs = rexState(T);
  const lab: React.ReactNode[] = [];
  const oG = ramp(T, 8.1, 8.4) * (1 - ramp(T, 9.5, 9.8));
  const gp = oG > 0.01 ? ghostPos(T) : null;
  if (gp) {
    const q = project([gp[0], gp[1] + 2.25, gp[2]], cam, look, c.fov, width, height);
    if (q.ok) lab.push(<BarLabel key="g" x={q.x} y={q.y} name="YOU" val="1.8 m" color="#BFE3FF" o={oG} />);
  }
  const oS = (ramp(T, 6.9, 7.3) * (1 - ramp(T, 8.0, 8.3)) + ramp(T, 9.4, 9.8)) * (1 - ramp(T, 10.9, 11.3));
  if (oS > 0.01 && ss.pts) {
    const m = ss.pts[Math.round(NS * 0.45)];
    const q = project([m[0], 1.7, m[2]], cam, look, c.fov, width, height);
    if (q.ok) lab.push(<BarLabel key="s" x={q.x} y={q.y} name="TITANOBOA" val={`${Math.round(13 * ramp(T, 6.8, 7.9))} m`} color="#F2C94C" o={oS} />);
  }
  const oR = ramp(T, 9.7, 10.1) * (1 - ramp(T, 10.9, 11.3));
  if (oR > 0.01) {
    const q = project([rs.p[0], rs.p[1] + 6.4, rs.p[2]], cam, look, c.fov, width, height);
    if (q.ok) lab.push(<BarLabel key="r" x={q.x} y={q.y} name="T. REX" val={`${Math.round(12 * ramp(T, 9.6, 10.5))} m`} color="#E8735A" o={oR} />);
  }
  // counters: millions of years (rewind / forward), temperature, days without food
  const yrsO = ramp(T, T_REW0 - 0.1, T_REW0 + 0.15) * (1 - ramp(T, T_REW1 + 0.1, T_REW1 + 0.4));
  const yrs = Math.round(lerp(60, 66, ramp(T, T_REW0, T_REW1 - 0.1)));
  const fwdO = ramp(T, T_OUT + 0.6, T_OUT + 0.85) * (1 - ramp(T, T_GROW1 - 0.1, T_GROW1 + 0.2));
  const fwd = Math.round(lerp(66, 60, ramp(T, T_OUT + 0.7, T_GROW1 - 0.3)));
  const tO = ramp(T, 31.9, 32.2) * (1 - ramp(T, 37.2, 37.6));
  const temp = T < 35.2 ? 30 : Math.round(lerp(30, 10, ramp(T, 35.3, 36.6)));
  const dayO = ramp(T, 49.9, 50.1) * (1 - ramp(T, 51.3, 51.6));
  const days = Math.round(lerp(1, 120, ramp(T, 50.0, 51.2) ** 1.4));
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: freezeK > 0.01 ? `saturate(${1 - 0.8 * freezeK * (1 - warmK)}) contrast(${1 + 0.15 * freezeK})` : undefined }}>
        {sc && (
          <ThreeCanvas width={width} height={height} shadows camera={{ fov: 44, near: 0.05, far: 4000 }} gl={{ antialias: true }}>
            <World T={T} cam={cam} look={look} fov={c.fov} {...sc} />
            <InkPass p={{ focus: dist, blur: 3.5, night: sky.dark * 0.35, cow: 0, flash: Math.min(1, flash) * 0.9, redPulse: 0, ink: 1, vig: 0.35, hdr: 1 }} />
          </ThreeCanvas>
        )}
        {lab}
      </AbsoluteFill>
      {freezeK > 0.01 && (
        <AbsoluteFill style={{ opacity: freezeK * 0.8, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)" }} />
      )}
      {/* warm memory of the 30 °C jungle, then the cold of this river */}
      <AbsoluteFill style={{ opacity: warmK * 0.45, mixBlendMode: "soft-light", background: "radial-gradient(ellipse at 50% 40%, #FFB04A 0%, #E0602A 70%)" }} />
      <AbsoluteFill style={{ opacity: coldK * 0.4, mixBlendMode: "soft-light", background: "radial-gradient(ellipse at 50% 40%, #CFE6FF 0%, #4E7CB8 75%)" }} />
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.18, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.45) 63%, rgba(10,14,15,0.55) 76%, rgba(10,14,15,0.2) 90%, rgba(10,14,15,0) 100%)" }} />
      {yrsO > 0.01 && <BigCounter top="SENDING IT BACK" val={`${yrs}`} sub="MILLION YEARS AGO" o={yrsO} pop={pulse(T, T_REW1 - 0.15, T_REW1 + 0.15)} />}
      {fwdO > 0.01 && <BigCounter top="AFTER THE DINOSAURS" val={`${fwd}`} sub="MILLION YEARS AGO" o={fwdO} pop={pulse(T, T_GROW1 - 0.45, T_GROW1 - 0.15)} />}
      {tO > 0.01 && <BigCounter top={T < 35.2 ? "ITS JUNGLE" : "THIS RIVER"} val={`${temp} °C`} sub={T < 35.2 ? "ALL YEAR ROUND" : "TOO COLD TO HUNT"} o={tO}
        pop={pulse(T, 32.1, 32.5) + pulse(T, 36.5, 36.9)} color={T < 35.2 ? "#FFB45A" : "#9FD0FF"} />}
      {dayO > 0.01 && <BigCounter top="UNDERGROUND" val={`DAY ${days}`} sub="NO FOOD" o={dayO} pop={pulse(T, 51.0, 51.3)} />}
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D ILLUSTRATION
      </div>
      <Sequence from={Math.round(15.95 * fps)} durationInFrames={Math.round(1.3 * fps)}>
        <StampSeq text="SNACKS" color="#F2C94C" rot={-4} hold={39} />
      </Sequence>
      <Sequence from={Math.round(28.45 * fps)} durationInFrames={Math.round(1.25 * fps)}>
        <StampSeq text="NOT SO FAST" color="#E8735A" rot={-5} hold={37} />
      </Sequence>
      <Sequence from={Math.round(38.55 * fps)} durationInFrames={Math.round(1.2 * fps)}>
        <StampSeq text="MISSED" color="#9FD0FF" rot={4} hold={36} />
      </Sequence>
      <Sequence from={Math.round(47.0 * fps)} durationInFrames={Math.round(0.8 * fps)}>
        <StampSeq text="GONE" color="#D9D2C2" rot={-3} hold={24} />
      </Sequence>
      <Sequence from={Math.round(T_NO * fps)} durationInFrames={Math.round(1.4 * fps)}>
        <StampSeq text="NO." color="#E8735A" rot={-4} hold={42} />
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

// ------------------------------------------------------------------ thumbnail (no text): r03 = the T. rex lunge vs the snake's gape-hiss
export const Thumb012: React.FC<{ T?: number; cam?: V3; look?: V3; fov?: number }> = (q) => {
  const { width, height } = useVideoConfig();
  const sc = useScene();
  const T = q.T ?? 42.6;
  const cam: V3 = q.cam ?? [14.6, 2.0, 7.6], look: V3 = q.look ?? [22.6, 3.4, 14.2];
  const fov = q.fov ?? 52;
  return (
    <AbsoluteFill style={{ background: "#1A1410" }}>
      {sc && (
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 44, near: 0.05, far: 4000 }} gl={{ antialias: true }}>
          <World T={T} cam={cam} look={look} fov={fov} {...sc} />
          <InkPass p={{ focus: 4, blur: 3, night: 0.1, cow: 0, flash: 0, redPulse: 0, ink: 1, vig: 0.5, hdr: 1 }} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};

// debug hooks for offline camera/actor measurement (scratch scripts)
export const __dbg = { snakeState, camAt, rexState, uHeadAt, PATH, ground, zc, garState, ghostPos, ENTRY, headFrame };
