// 3D placement of the hand-drawn flora (toonFlora.ts): yaw-billboard cards like the beasts, drawn once per
// (kind, palette, variant) and shared; the top sways in the wind / sea current in the vertex shader (the shadow too).
//   <FloraField items={[{ kind, x, z, h?, seed?, pal? }...]} ground={(x,z)=>y} cam={...} t={t} pal="jungle" wind={1} />
//   FloraSheet comp: every kind, in several palettes.
import React, { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { Pen } from "./toon";
import { FLORA, FloraKind, PALS } from "./toonFlora";
import { V3 } from "./World";

const K = 0.5, CW = 800 * K, CH = 1000 * K;
const texCache = new Map<string, THREE.CanvasTexture>();
function floraTex(kind: FloraKind, pal: string, variant: number) {
  const key = `${kind}|${pal}|${variant}`;
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
    const g = cv.getContext("2d")!; g.setTransform(K, 0, 0, K, 0, 0); g.lineJoin = "round"; g.lineCap = "round";
    FLORA[kind].draw(new Pen(g), 17 + variant * 131, PALS[pal] ?? PALS.jungle);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(key, t);
  }
  return t;
}
const SWAY = /* glsl */ `
  float fv = clamp((position.y - uY0) / max(1e-4, uH), 0.0, 1.0);
  float gust = 0.6 + 0.4 * sin(uT * 0.7 + uSeed * 3.1);
  transformed.x += uSway * uH * fv * fv * gust * sin(uT * 1.9 + uSeed * 6.28 + position.y * 0.15);
  transformed.y -= uSway * uH * 0.15 * fv * fv * fv * gust * (0.5 + 0.5 * sin(uT * 1.9 + uSeed * 6.28));`;
const DECL = "uniform float uT; uniform float uSway; uniform float uY0; uniform float uH; uniform float uSeed;\n";
type Uni = { uT: { value: number }; uSway: { value: number }; uY0: { value: number }; uH: { value: number }; uSeed: { value: number } };
function swayMat<M extends THREE.Material>(m: M, U: Uni, key: string): M {
  m.onBeforeCompile = (s) => { Object.assign(s.uniforms, U); s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\n" + DECL).replace("#include <begin_vertex>", "#include <begin_vertex>\n" + SWAY); };
  m.customProgramCacheKey = () => "floraSway|" + key;
  return m;
}
export type FloraItem = { kind: FloraKind; x: number; z: number; h?: number; seed?: number; pal?: string; tint?: string };
export const FloraCard: React.FC<{ it: FloraItem; y: number; cam: { pos: V3 }; t: number; pal: string; wind: number }> = ({ it, y, cam, t, pal, wind }) => {
  const F = FLORA[it.kind], seed = it.seed ?? Math.abs(Math.sin(it.x * 12.9 + it.z * 78.2)) * 1000, variant = Math.floor(seed) % 3;
  const r = useMemo(() => {
    const tex = floraTex(it.kind, it.pal ?? pal, variant), hM = it.h ?? F.h, s = hM / (980 - 20) ; // 1 design unit = s metres (the drawing fills ~y 20..980)
    const U: Uni = { uT: { value: 0 }, uSway: { value: F.sway }, uY0: { value: 0 }, uH: { value: hM }, uSeed: { value: (seed % 97) / 97 } };
    const mat = swayMat(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(it.tint ?? "#ffffff") }), U, "b");
    const depth = swayMat(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }), U, "d");
    const geo = new THREE.PlaneGeometry(800 * s, 1000 * s, 10, 14); geo.translate(0, (500 - 980) * -s, 0);
    return { mat, depth, geo, U, tex };
  }, [it.kind, it.pal, pal, variant, it.h, F, seed, it.tint]);
  r.U.uT.value = t; r.U.uSway.value = F.sway * wind;
  const yaw = Math.atan2(cam.pos[0] - it.x, cam.pos[2] - it.z);
  return <mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} position={[it.x, y, it.z]} rotation={[0, yaw, 0]} castShadow userData={{ noNormal: true, noInk: true, flatNormal: r.tex }} />;
};
export const FloraField: React.FC<{ items: FloraItem[]; ground: (x: number, z: number) => number; cam: { pos: V3 }; t: number; pal: string; wind?: number; tint?: string }> = ({ items, ground, cam, t, pal, wind = 1, tint }) => (
  <group>{items.map((it, i) => <FloraCard key={i} it={tint && !it.tint ? { ...it, tint } : it} y={ground(it.x, it.z) - 0.05} cam={cam} t={t} pal={pal} wind={wind} />)}</group>
);
/** scatter helper: n items of the given kinds in a box, keeping a clear zone (x0..x1, z > zc) */
export function scatter(seed: number, n: number, kinds: [FloraKind, number][], box: [number, number, number, number], clear?: [number, number, number], scale = 1): FloraItem[] {
  let s = seed; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const tot = kinds.reduce((a, [, w]) => a + w, 0), out: FloraItem[] = [];
  for (let i = 0; i < n * 4 && out.length < n; i++) {
    const x = box[0] + r() * (box[1] - box[0]), z = box[2] + r() * (box[3] - box[2]);
    if (clear && x > clear[0] && x < clear[1] && z > clear[2]) continue;
    let w = r() * tot, k = kinds[0][0]; for (const [kk, ww] of kinds) { if ((w -= ww) <= 0) { k = kk; break; } }
    out.push({ kind: k, x, z, h: FLORA[k].h * scale * (0.75 + r() * 0.5), seed: Math.floor(r() * 1000) });
  }
  return out;
}

// ------------------------------------------------------------------ preview sheet
const Cell: React.FC<{ kind: FloraKind; pal: string }> = ({ kind, pal }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.drawImage(floraTex(kind, pal, 0).image as HTMLCanvasElement, 0, 0, 240, 300); }, [kind, pal]);
  return <div style={{ width: 240, fontFamily: "sans-serif", fontSize: 16, textAlign: "center" }}><canvas ref={ref} width={240} height={300} /><div>{kind} · {pal}</div></div>;
};
const SHEET: [FloraKind, string][] = [["fern", "jungle"], ["treefern", "jungle"], ["cycad", "jungle"], ["horsetail", "jungle"], ["araucaria", "jungle"], ["palm", "jungle"],
  ["broadleaf", "jungle"], ["magnolia", "jungle"], ["reeds", "jungle"], ["grass", "jungle"], ["bush", "jungle"], ["log", "jungle"],
  ["boulder", "jungle"], ["rockpile", "jungle"], ["pebbles", "jungle"], ["mushrooms", "cave"], ["bones", "dry"], ["deadtree", "ash"],
  ["sage", "dry"], ["grass", "dry"], ["boulder", "dry"], ["snowpine", "snow"], ["boulder", "snow"], ["rockpile", "snow"],
  ["boulder", "ash"], ["kelp", "sea"], ["seafan", "sea"], ["sponge", "sea"], ["braincoral", "sea"], ["boulder", "sea"]];
export const FloraSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 4, padding: 6 }}>
    {SHEET.map(([k, p], i) => <Cell key={i} kind={k} pal={p} />)}
  </AbsoluteFill>
);
