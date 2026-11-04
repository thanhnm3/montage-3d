// Caveman Economics Short "A home now costs 5 years of income" (2026-11-04), ink-3D look (www-ink3d-004's InkPass),
// no narrator character. Two sets cut against each other:
//   - "office": a cubicle at night, an exhausted office worker (toon.ts card, seated, bloodshot eyes) lit by his monitor,
//     coffee cups piling up, a wall clock spinning on "5 years straight";
//   - "stage": a house next to a tower of cash bricks, 1 brick = 1 year of a median household's income. The roof line is
//     the house price, so the tower reaching the roof = price-to-income 5 (Harvard JCHS ratio): 1990s ~3, 2005 record,
//     crash back near 3 (2011 ~3.3), climbing again, 2024 = 5 (median $412,500), level with the 2005 record.
// Timing keys off anchor words in props.words (whisper of the real voice, scenes/build.py); T_EST before that.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { ToonHost, HostKey } from "./ToonHost";
import { InkPass } from "./Ink";
import { Tex, V3, clamp01, ease, lerp, lerpV, toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;
type Cue = { start: number; end: number; value: string };

// ------------------------------------------------------------------ timing
const ANCHORS: [string, string][] = [
  ["home", "home"], ["costs", "costs"], ["income", "income"], ["every", "every"], ["earn", "earn"], ["not", "not"], ["savings", "savings"],
  ["entire", "entire"], ["straight", "straight"], ["harvard", "harvard"], ["tracks", "tracks"], ["called", "called"], ["ratio", "ratio"],
  ["sat", "sat"], ["affordable", "affordable"], ["bubble", "bubble"], ["record", "record"], ["crash", "crash"], ["dragged", "dragged"],
  ["climbed", "climbed"], ["after", "after"], ["median", "median"], ["dollars", "dollars"], ["times", "times"], ["tie", "tie"],
  ["bubble2", "bubble"], ["follow", "follow"], ["real", "real"], ["life", "life"], ["keep", "keep"], ["eyes", "eyes"], ["house", "house"], ["away", "away"],
];
type Times = Record<string, number>;
// ~0.17 s + 0.045 s/letter per word, +0.32 s after "." and +0.15 s after ",", x0.78 (skill recipe)
const T_EST: Times = {
  home: 0.17, costs: 0.68, income: 1.67, every: 2.26, earn: 3.49, not: 4.17, savings: 4.41, entire: 5.79, straight: 7.31, harvard: 8.13,
  tracks: 8.51, called: 9.61, ratio: 11.32, sat: 12.98, affordable: 15.88, bubble: 17.28, record: 18.54, crash: 19.37, dragged: 19.68,
  climbed: 21.99, after: 23.07, median: 24.77, dollars: 25.97, times: 26.76, tie: 27.83, bubble2: 28.58, follow: 29.33, real: 30.15,
  life: 31.34, keep: 32.23, eyes: 32.81, house: 33.84, away: 34.83, end: 35.51,
};
type Word = { word: string; start: number; end: number };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function timesFrom(words?: Word[]): Times {
  if (!words || !words.length) return T_EST;
  const out: Times = {};
  let i = 0;
  for (const [name, w] of ANCHORS) {
    let j = i;
    while (j < words.length && norm(words[j].word) !== w) j++;
    if (j >= words.length) return T_EST; // transcript does not match the script: keep the estimate (build.py warns too)
    out[name] = words[j].start;
    i = j + 1;
  }
  out.end = words[words.length - 1].end;
  return out;
}
let T: Times = T_EST;

// ------------------------------------------------------------------ helpers
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const up = (t: number, a: number, d = 0.45) => ease((t - a) / d);
const pop = (t: number, a: number) => (t < a ? 0 : spring({ frame: Math.round((t - a) * 30), fps: 30, config: { damping: 10, stiffness: 200 } }));
class Mats {
  m = new Map<string, THREE.Material>();
  get(c: string, e?: string, ei = 0) {
    const key = `${c}|${e}|${ei}`;
    let v = this.m.get(key);
    if (!v) { v = toon({ color: new THREE.Color(c), emissive: new THREE.Color(e ?? "#000000"), emissiveIntensity: ei }); this.m.set(key, v); }
    return v;
  }
}
const Box: React.FC<{ mats: Mats; p: V3; s: V3; c: string; e?: string; ei?: number; r?: V3; cyl?: boolean; shadow?: boolean }> = ({ mats, p, s, c, e, ei = 0, r = [0, 0, 0], cyl, shadow = true }) => (
  <mesh position={p} rotation={r} material={mats.get(c, e, ei)} castShadow={shadow} receiveShadow>
    {cyl ? <cylinderGeometry args={[s[0] / 2, s[0] / 2, s[1], 24]} /> : <boxGeometry args={s} />}
  </mesh>
);

// ------------------------------------------------------------------ office set
const WORKER: V3 = [0.05, 0.3, -0.72];
const FACE: V3 = [0.05, 1.17, -0.72];
function cityTexture() {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0E1530"); gr.addColorStop(1, "#24305A");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const r = rng(5);
  for (let b = 0; b < 26; b++) {
    const x = r() * 1024, w = 40 + r() * 90, h = 120 + r() * 330;
    g.fillStyle = b % 2 ? "#141C3A" : "#18224A"; g.fillRect(x, 512 - h, w, h);
    for (let yy = 512 - h + 10; yy < 500; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 13)
      if (r() < 0.38) { g.fillStyle = r() < 0.8 ? "#FFD27A" : "#CFE3FF"; g.fillRect(xx, yy, 6, 8); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const CUPS: V3[] = (() => { const r = rng(9), out: V3[] = []; for (let i = 0; i < 16; i++) out.push([-0.72 + (i % 4) * 0.12 + r() * 0.03, 0.83, -0.25 + Math.floor(i / 4) * 0.12 + r() * 0.03]); return out; })();
const Office: React.FC<{ t: number; mats: Mats }> = ({ t, mats }) => {
  const city = useMemo(() => new THREE.MeshBasicMaterial({ map: cityTexture(), toneMapped: false }), []);
  // "5 years straight": cups pile up, the clock spins
  const lapse = clamp01((t - T.not) / Math.max(0.5, T.harvard - T.not));
  const cups = t < T.not ? 3 : 3 + Math.round(13 * lapse);
  const spin = t < T.not ? t * 0.05 : t < T.harvard ? 0.05 * T.not + (t - T.not) * 9 : t * 0.05;
  const wall = "#4A5068", part = "#7D8799";
  return (
    <group>
      <Box mats={mats} p={[0, -0.01, -0.5]} s={[8, 0.02, 6]} c="#3E4658" />
      <Box mats={mats} p={[0, 1.6, -2.3]} s={[8, 3.2, 0.1]} c={wall} />
      <mesh material={city} position={[0.1, 2.05, -2.24]} userData={{ noNormal: true }}><planeGeometry args={[3.4, 1.4]} /></mesh>
      {[-1.6, 0.1, 1.8].map((x) => <Box key={x} mats={mats} p={[x, 2.05, -2.22]} s={[0.06, 1.46, 0.04]} c="#1C2030" />)}
      <Box mats={mats} p={[0.1, 2.76, -2.22]} s={[3.46, 0.06, 0.04]} c="#1C2030" />
      <Box mats={mats} p={[0.1, 1.33, -2.22]} s={[3.46, 0.06, 0.04]} c="#1C2030" />
      {/* cubicle */}
      <Box mats={mats} p={[0.1, 0.62, -1.55]} s={[2.6, 1.24, 0.06]} c={part} />
      <Box mats={mats} p={[-1.2, 0.62, -0.6]} s={[0.06, 1.24, 1.9]} c={part} />
      <Box mats={mats} p={[1.4, 0.62, -0.6]} s={[0.06, 1.24, 1.9]} c={part} />
      {/* sticky notes on the partition */}
      {[0, 1, 2, 3, 4].map((i) => <Box key={i} mats={mats} p={[-0.7 + i * 0.13 + (i % 2) * 0.03, 1.02 - (i % 2) * 0.1, -1.51]} s={[0.09, 0.09, 0.01]} c={["#F7E06A", "#F2A7C3", "#9ED8F0"][i % 3]} shadow={false} />)}
      {/* desk */}
      <Box mats={mats} p={[0.1, 0.75, -0.3]} s={[2.0, 0.05, 0.85]} c="#B9A27F" />
      <Box mats={mats} p={[-0.85, 0.37, -0.3]} s={[0.05, 0.74, 0.8]} c="#8E7A5C" />
      <Box mats={mats} p={[1.05, 0.37, -0.3]} s={[0.05, 0.74, 0.8]} c="#8E7A5C" />
      <Box mats={mats} p={[0.1, 0.45, 0.08]} s={[1.9, 0.6, 0.03]} c="#8E7A5C" />
      {/* monitor turned toward him, keyboard, paper stacks, lamp, cups */}
      <group position={[0.62, 0.78, -0.2]} rotation={[0, Math.PI + 0.75, 0]}>
        <Box mats={mats} p={[0, 0.06, 0]} s={[0.05, 0.12, 0.05]} c="#22252E" />
        <Box mats={mats} p={[0, 0.34, 0]} s={[0.62, 0.38, 0.04]} c="#22252E" />
        <Box mats={mats} p={[0, 0.34, 0.022]} s={[0.56, 0.32, 0.005]} c="#9FC4FF" e="#BFD8FF" ei={1.6} shadow={false} />
      </group>
      <Box mats={mats} p={[0.15, 0.785, -0.35]} s={[0.46, 0.02, 0.16]} c="#2A2D36" />
      {[0, 1, 2].map((i) => <Box key={i} mats={mats} p={[-0.4 + i * 0.03, 0.8 + i * 0.07, -0.42 + i * 0.01]} s={[0.32, 0.07, 0.24]} c={i % 2 ? "#F4F1EA" : "#E8E3D6"} />)}
      <Box mats={mats} p={[0.92, 0.95, -0.55]} s={[0.03, 0.4, 0.03]} c="#2A2630" cyl />
      <Box mats={mats} p={[0.92, 1.17, -0.55]} s={[0.18, 0.12, 0.18]} c="#FFD27A" e="#FFB347" ei={0.9} cyl />
      {CUPS.slice(0, cups).map((p, i) => (
        <group key={i} position={p}>
          <Box mats={mats} p={[0, 0, 0]} s={[0.08, 0.11, 0.08]} c={i % 3 === 2 ? "#C9563A" : "#F4F1EA"} cyl />
          <Box mats={mats} p={[0, 0.045, 0]} s={[0.066, 0.02, 0.066]} c="#4A2F22" cyl shadow={false} />
        </group>
      ))}
      {/* wall clock above the partition */}
      <group position={[-0.95, 2.25, -2.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.get("#F4F1EA")}><cylinderGeometry args={[0.24, 0.24, 0.04, 40]} /></mesh>
        <mesh position={[0, 0, 0.03]} rotation={[0, 0, -spin * 6.283 / 12]} material={mats.get("#1C1A22")}><boxGeometry args={[0.025, 0.28, 0.01]} /></mesh>
        <mesh position={[0, 0, 0.035]} rotation={[0, 0, -spin * 6.283]} material={mats.get("#C2412B")}><boxGeometry args={[0.015, 0.4, 0.01]} /></mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ stage set: house vs the income tower
const HX = -1.25, TX = 1.25, BRICK = 0.52, ROOF = 5 * BRICK; // roof ridge = 5 years of income
const House: React.FC<{ mats: Mats }> = ({ mats }) => {
  const roof = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-1.08, 0); s.lineTo(1.08, 0); s.lineTo(0, ROOF - 1.5); s.lineTo(-1.08, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }); g.translate(0, 0, -0.95); return g;
  }, []);
  return (
    <group position={[HX, 0, 0]}>
      <Box mats={mats} p={[0, 0.75, 0]} s={[1.9, 1.5, 1.7]} c="#F4EFE6" />
      <mesh geometry={roof} position={[0, 1.5, 0]} material={mats.get("#C2412B")} castShadow receiveShadow />
      <Box mats={mats} p={[0.5, 2.25, -0.3]} s={[0.22, 0.6, 0.22]} c="#8A4B32" />
      <Box mats={mats} p={[0, 0.42, 0.86]} s={[0.38, 0.84, 0.03]} c="#2F6F73" />
      {[-0.58, 0.58].map((x) => <Box key={x} mats={mats} p={[x, 0.98, 0.86]} s={[0.4, 0.36, 0.03]} c="#FFE4A8" e="#FFC867" ei={0.7} />)}
      <Box mats={mats} p={[0, 0.03, 1.05]} s={[0.6, 0.06, 0.4]} c="#C9B48E" />
    </group>
  );
};
// tower level (years of income) over time
function towerLevel(t: number) {
  if (t < T.not) return 5 * clamp01((t - T.every - 0.05) / 1.1); // hook: 5 bricks stack up fast
  if (t < T.sat - 0.04) return 5;
  if (t < T.bubble - 0.04) return 3.2;
  if (t < T.crash - 0.04) return lerp(3.2, 5, up(t, T.bubble, Math.max(0.6, T.record - T.bubble + 0.2)));
  if (t < T.climbed - 0.04) return 3.3;
  if (t < T.median - 0.04) return lerp(3.3, 4.6, clamp01((t - T.climbed) / Math.max(0.6, T.median - T.climbed)));
  return lerp(4.6, 5, up(t, T.dollars, Math.max(0.4, T.times - T.dollars)));
}
const Brick: React.FC<{ mats: Mats; y: number; k?: number; red?: number; pos?: V3; rot?: V3 }> = ({ mats, y, k = 1, red = 0, pos, rot }) => {
  const c = red > 0.5 ? "#B8462B" : "#5FA36A";
  const h = BRICK * k;
  return (
    <group position={pos ?? [TX, y + h / 2, 0]} rotation={rot ?? [0, 0, 0]}>
      <Box mats={mats} p={[0, 0, 0]} s={[1.1, h - 0.02, 0.7]} c={c} />
      <Box mats={mats} p={[0, 0, 0]} s={[0.2, h - 0.01, 0.72]} c="#EFE6C8" />
    </group>
  );
};
const Tower: React.FC<{ t: number; mats: Mats }> = ({ t, mats }) => {
  const L = towerLevel(t);
  const n = Math.floor(L + 1e-6), frac = L - n;
  const bubbleHot = t >= T.bubble - 0.04 && t < T.crash - 0.04 ? up(t, T.record - 0.1, 0.3) : 0;
  const wob = t >= T.record - 0.1 && t < T.crash - 0.04 ? Math.sin(t * 22) * 0.035 * up(t, T.record - 0.1, 0.3) : 0;
  const bricks: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) bricks.push(<Brick key={i} mats={mats} y={i * BRICK} red={i >= 3 ? bubbleHot : 0} />);
  if (frac > 0.02) bricks.push(<Brick key="f" mats={mats} y={n * BRICK} k={frac} red={bubbleHot} />);
  // the crash: the bricks above 3.3 fly off and land on the floor
  const debris: React.ReactNode[] = [];
  if (t >= T.crash - 0.04 && t < T.climbed - 0.04) {
    const dt = t - (T.crash - 0.04);
    [[3.3, 1.6, 2.2, 1.0], [4.2, -1.9, 2.6, -1.4], [3.8, 2.4, 1.6, 2.2]].forEach(([lv, vx, vy, spinZ], i) => {
      const y0 = lv * BRICK + BRICK / 2;
      let x = TX + vx * dt * 0.8, y = y0 + vy * dt - 4.9 * dt * dt, z = 0.4 * i * dt;
      const tLand = (vy + Math.sqrt(vy * vy + 4 * 4.9 * (y0 - BRICK * 0.35))) / (2 * 4.9);
      let rz = spinZ * dt * 3;
      if (dt > tLand) { x = TX + vx * tLand * 0.8; y = BRICK * 0.35; z = 0.4 * i * tLand; rz = Math.PI / 2 * Math.round(spinZ * tLand * 3 / (Math.PI / 2)); }
      debris.push(<Brick key={`d${i}`} mats={mats} y={0} red={1} pos={[x, y, z]} rot={[0, 0.3 * i, rz]} />);
    });
  }
  return (
    <group>
      <group rotation={[0, 0, wob]} position={[0, 0, 0]}>{bricks}</group>
      {debris}
      {/* ruler: a tick per year beside the tower */}
      {[1, 2, 3, 4, 5].map((i) => <Box key={i} mats={mats} p={[TX + 0.7, i * BRICK, 0.36]} s={[0.22, 0.03, 0.03]} c="#3A3340" shadow={false} />)}
      <Box mats={mats} p={[TX + 0.8, ROOF / 2, 0.36]} s={[0.03, ROOF, 0.03]} c="#3A3340" shadow={false} />
    </group>
  );
};
// dashed price line from the ridge across to the tower
const PriceLine: React.FC<{ mats: Mats }> = ({ mats }) => (
  <group>
    {Array.from({ length: 14 }, (_, i) => <Box key={i} mats={mats} p={[HX + 0.15 + i * 0.2, ROOF, 0]} s={[0.11, 0.035, 0.035]} c="#E5342F" shadow={false} />)}
  </group>
);
const Stage: React.FC<{ t: number; mats: Mats }> = ({ t, mats }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.get("#E2D2B0")} receiveShadow><planeGeometry args={[200, 200]} /></mesh>
    <mesh position={[0, 0.04, 0]} material={mats.get("#EDE0C4")} receiveShadow><cylinderGeometry args={[3.6, 3.7, 0.08, 72]} /></mesh>
    <House mats={mats} />
    <Tower t={t} mats={mats} />
    <PriceLine mats={mats} />
  </group>
);

// ------------------------------------------------------------------ shots
type SetName = "office" | "stage";
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Shot = { t: number; set: SetName; a: Cam; b: Cam; k?: (x: number) => number; note: string };
const STG: V3 = [0, 1.35, 0];
const HOOK_A: Cam = { pos: [-0.75, 1.4, 1.8], look: [0.1, 1.05, -0.6], fov: 44 };
function buildShots(): Shot[] {
  return [
    { t: 0, set: "office", note: "hook: exhausted worker, bloodshot eyes, push in", a: HOOK_A, b: { pos: [-0.35, 1.25, 0.8], look: FACE, fov: 26 } },
    { t: T.every - 0.04, set: "stage", note: "every dollar: 5 bricks stack up to the roof line", a: { pos: [0, 2.0, 10.6], look: STG, fov: 46 }, b: { pos: [0, 1.9, 9.6], look: STG, fov: 46 } },
    { t: T.not - 0.04, set: "office", note: "5 years straight: cups pile up, clock spins", a: { pos: [-1.1, 1.6, 2.6], look: [0.1, 1.0, -0.6], fov: 48 }, b: { pos: [-0.9, 1.5, 2.1], look: [0.1, 1.0, -0.6], fov: 48 } },
    { t: T.harvard - 0.04, set: "stage", note: "harvard tracks this: low angle on the tower and the house", a: { pos: [-1.8, 0.6, 9.4], look: [0, 1.6, 0], fov: 46, roll: -2 }, b: { pos: [-1.3, 0.7, 8.6], look: [0, 1.6, 0], fov: 46, roll: -1 } },
    { t: T.sat - 0.04, set: "stage", note: "1990s: 3 bricks, the gap to the roof", a: { pos: [0.7, 1.9, 10.2], look: STG, fov: 46 }, b: { pos: [0.4, 1.8, 9.4], look: STG, fov: 46 } },
    { t: T.bubble - 0.04, set: "stage", note: "2005 bubble: high angle, tower rises red to the record and wobbles", a: { pos: [2.6, 4.6, 9.2], look: [0.2, 1.3, 0], fov: 46 }, b: { pos: [2.2, 4.2, 8.4], look: [0.2, 1.4, 0], fov: 46 } },
    { t: T.crash - 0.04, set: "stage", note: "crash: bricks fly off, back near 3", a: { pos: [0.5, 1.5, 10.0], look: [0.3, 1.2, 0], fov: 46 }, b: { pos: [0.4, 1.5, 9.4], look: [0.3, 1.2, 0], fov: 46 } },
    { t: T.climbed - 0.04, set: "stage", note: "climbing again: orbit, years ticking", a: { pos: [6.0, 2.4, 8.0], look: STG, fov: 46 }, b: { pos: [-5.0, 2.4, 8.6], look: STG, fov: 46 } },
    { t: T.median - 0.04, set: "stage", note: "2024: the tower meets the roof line, $412,500", a: { pos: [0, 1.8, 10.4], look: STG, fov: 46 }, b: { pos: [0, 1.75, 9.6], look: STG, fov: 46 } },
    { t: T.follow - 0.04, set: "office", note: "cta: back at the desk, crane up", a: { pos: [-1.2, 1.5, 2.3], look: [0.1, 1.0, -0.6], fov: 48 }, b: { pos: [-1.3, 2.4, 3.1], look: [0.1, 0.95, -0.6], fov: 48 } },
    { t: T.keep - 0.04, set: "office", note: "payoff: close on the red eyes, ends on the hook's first frame (loop)", a: { pos: [-0.35, 1.25, 0.75], look: FACE, fov: 26 }, b: HOOK_A },
  ];
}
let SHOTS: Shot[] = buildShots();
function shotAt(t: number) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : T.end + 0.6;
  const x = clamp01((t - s.t) / (t1 - s.t));
  const k = s.k ? s.k(x) : ease(x) * 0.5 + x * 0.5;
  const cam = { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), roll: lerp(s.a.roll ?? 0, s.b.roll ?? 0, k) };
  const jolt = t > T.crash - 0.04 && t < T.crash + 0.6 ? Math.exp(-(t - T.crash) * 7) * 0.06 : 0;
  cam.pos = [cam.pos[0] + Math.sin(t * 0.7) * 0.012 + Math.sin(t * 43) * jolt, cam.pos[1] + Math.sin(t * 0.9 + 1) * 0.01 + Math.cos(t * 39) * jolt, cam.pos[2]];
  return { ...cam, set: s.set, i };
}

// ------------------------------------------------------------------ the worker
const WORKER_KEYS = (): HostKey[] => [
  { t: 0, expr: "bloodshot", look: 0 },
  { t: T.income - 0.08, expr: "bloodshot_shock" }, // "5 years of income"
  { t: T.not - 0.08, expr: "bloodshot", look: 0.6 }, // grinding at the monitor
  { t: T.follow - 0.08, expr: "dazed", look: 0 },
  { t: T.keep - 0.08, expr: "bloodshot", look: 0 }, // same face as the first frame (loop)
];

// ------------------------------------------------------------------ scene
function useTextures() {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile("tex/glow.png"), (g) => { g.colorSpace = THREE.SRGBColorSpace; setTex({ glow: g }); });
  }, []);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}
const CamSet: React.FC<{ pos: V3; look: V3; fov: number; roll: number }> = ({ pos, look, fov, roll }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.05; c.far = 500; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...look); c.rotateZ(THREE.MathUtils.degToRad(roll)); c.updateMatrixWorld();
  return null;
};
const SpotAt: React.FC<{ pos: V3; target: V3; color: string; intensity: number; angle: number }> = ({ pos, target, color, intensity, angle }) => {
  const tg = useMemo(() => new THREE.Object3D(), []);
  tg.position.set(...target);
  return (
    <>
      <primitive object={tg} />
      <spotLight position={pos} target={tg} color={color} intensity={intensity} angle={angle} penumbra={0.7} decay={0} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
    </>
  );
};
const Scene: React.FC<{ t: number; cam: ReturnType<typeof shotAt>; keys: HostKey[] }> = ({ t, cam, keys }) => {
  const mats = useMemo(() => new Mats(), []);
  const focus = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look));
  if (cam.set === "office") {
    const sun: V3 = [0.62, 1.1, -0.2]; // the monitor lights his face
    return (
      <>
        <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
        <color attach="background" args={["#141827"]} />
        <hemisphereLight args={[new THREE.Color("#7F8FC0"), new THREE.Color("#2A2236"), 0.5]} />
        <pointLight position={[0.45, 1.15, -0.45]} color="#9CC2FF" intensity={9} distance={4} decay={1.4} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
        <pointLight position={[0.92, 1.1, -0.55]} color="#FFC07A" intensity={2.2} distance={2.5} decay={1.5} />
        <SpotAt pos={[-2, 4.5, 3]} target={[0, 0.8, -0.6]} color="#8796C8" intensity={0.9} angle={0.5} />
        <Office t={t} mats={mats} />
        <ToonHost keys={keys} t={t} pos={WORKER} camPos={cam.pos} camLook={cam.look} sun={[sun[0] - WORKER[0], 0.4, sun[2] - WORKER[2] + 1]} tint="#E8ECFF" seed={6} mode="sit" />
        <InkPass p={{ focus, blur: 6, night: 0.45, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: 0.25, warm: 0 }} />
      </>
    );
  }
  const hot = t >= T.record - 0.1 && t < T.crash - 0.04 ? up(t, T.record - 0.1, 0.3) : 0;
  const crashFlash = t > T.crash - 0.06 ? Math.exp(-(t - T.crash + 0.06) * 6) * 0.6 : 0;
  const redPulse = hot * (0.4 + 0.3 * Math.sin(t * 10));
  const cold = t >= T.crash - 0.04 && t < T.climbed - 0.04 ? 0.6 : 0;
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <color attach="background" args={["#F1E3C6"]} />
      <fogExp2 attach="fog" args={[new THREE.Color("#F1E3C6").getHex(), 0.035]} />
      <hemisphereLight args={[new THREE.Color("#FFF4DE"), new THREE.Color("#B49A72"), 1.05]} />
      <directionalLight position={[-4, 8, 6]} intensity={2.0} color="#FFF0D8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
        shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={40} />
      <Stage t={t} mats={mats} />
      <InkPass p={{ focus, blur: 5, night: 0, cow: 0, flash: Math.min(1, crashFlash), redPulse, ink: 1, cold, warm: 0.25 * (1 - cold) }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#221A30";
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number };
export type HouseProps = { durationInFrames: number; audio?: string; cues?: Cue[]; captions?: Captions; words?: Word[] };
const Karaoke: React.FC<{ c: Captions; y: number }> = ({ c, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ch = c.chunks.find((k) => f >= k.f0 && f < k.f1);
  if (!ch) return null;
  const pp = spring({ frame: f - ch.f0, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(-50%) scale(${0.88 + 0.12 * pp})`, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: c.maxWidth, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: c.size * 0.4, fontFamily: anton, fontSize: c.size, lineHeight: 1.05, letterSpacing: 1 }}>
        {ch.words.map((w, i) => {
          const live = f >= w.f0 && f < Math.max(w.f1, w.f0 + 4);
          const lift = live ? spring({ frame: f - w.f0, fps, config: { damping: 10, stiffness: 300 } }) : 0;
          return (
            <span key={i} style={{
              display: "inline-block", color: w.k ? "#FFD23F" : "#FFF8EC", opacity: live || f >= w.f1 ? 1 : 0.8,
              transform: `translateY(${-lift * c.size * 0.05}px) scale(${1 + lift * 0.06})`, transformOrigin: "50% 100%",
              WebkitTextStroke: `${c.size * 0.12}px ${INK}`, paintOrder: "stroke fill", textShadow: `0 ${c.size * 0.06}px ${c.size * 0.1}px rgba(20,10,40,0.5)`,
            }}>{w.t}</span>
          );
        })}
      </div>
    </div>
  );
};
const Tag: React.FC<{ x: number; y: number; t: number; t0: number; t1: number; children: React.ReactNode; rot?: number }> = ({ x, y, t, t0, t1, children, rot = -6 }) => {
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 9, stiffness: 220 } });
  const out = clamp01((t1 - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) rotate(${rot}deg) scale(${s * out})`, transformOrigin: "50% 100%" }}>{children}</div>
  );
};
const Big: React.FC<{ size: number; color?: string; children: React.ReactNode }> = ({ size, color = "#FFF8EC", children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 4, color, WebkitTextStroke: `${size * 0.16}px ${INK}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{children}</div>
);
const Stamp: React.FC<{ size?: number; color?: string; children: React.ReactNode }> = ({ size = 130, color = "#E5342F", children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 8, color, border: `${size * 0.09}px solid ${color}`, borderRadius: 20, padding: "0 34px",
    background: "rgba(255,243,214,0.92)", boxShadow: "8px 10px 0 rgba(34,26,48,0.35)", whiteSpace: "nowrap" }}>{children}</div>
);
const card = { background: "#FFF3D6", border: `8px solid ${INK}`, borderRadius: 26, boxShadow: "9px 12px 0 rgba(34,26,48,0.35)" };
// era + ratio HUD, top-left, from the 1990s on
const Hud: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.sat - 0.04 || t >= T.follow - 0.04) return null;
  let era = "1990s", r = "≈3×", col = "#5FA36A";
  if (t >= T.bubble - 0.04) { era = "2005"; r = "RECORD"; col = "#E5342F"; }
  if (t >= T.crash - 0.04) { era = "2011"; r = "≈3.3×"; col = "#5FA36A"; }
  if (t >= T.climbed - 0.04) { const k = clamp01((t - T.climbed) / Math.max(0.6, T.median - T.climbed)); era = String(2012 + Math.round(k * 11)); r = "▲"; col = "#E8A23A"; }
  if (t >= T.median - 0.04) { era = "2024"; r = t >= T.times - 0.06 ? "5×" : "▲"; col = "#E5342F"; }
  return (
    <div style={{ position: "absolute", left: 50, top: 70, display: "flex", alignItems: "stretch", fontFamily: anton, borderRadius: 18, overflow: "hidden", border: `7px solid ${INK}`, boxShadow: "8px 10px 0 rgba(34,26,48,0.35)" }}>
      <div style={{ background: "#2E6E73", color: "#FFF8EC", fontSize: 76, padding: "6px 26px", letterSpacing: 3 }}>{era}</div>
      <div style={{ background: "#FFF3D6", color: col, fontSize: 76, padding: "6px 26px", letterSpacing: 3 }}>{r}</div>
    </div>
  );
};
// the brick counter in the hook: YEAR 1..5
const YearCount: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.every || t >= T.not - 0.04) return null;
  const n = Math.min(5, Math.max(1, Math.ceil(towerLevel(t) - 1e-3)));
  return <div style={{ position: "absolute", left: 0, width: W, top: 230, textAlign: "center" }}><Big size={150} color="#FFD23F">{n === 5 ? "5 YEARS" : `YEAR ${n}`}</Big></div>;
};
const RatioCard: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.called - 0.05, t1 = T.sat - 0.08;
  if (t < t0 || t > t1) return null;
  const s = pop(t, t0), out = clamp01((t1 - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: W / 2, top: 200, transform: `translateX(-50%) scale(${s * out})`, transformOrigin: "50% 0%", ...card, padding: "18px 40px", textAlign: "center" }}>
      <div style={{ fontFamily: anton, fontSize: 92, color: INK, letterSpacing: 3, lineHeight: 1.05 }}>HOME PRICE</div>
      <div style={{ height: 10, background: INK, borderRadius: 5, margin: "8px 0" }} />
      <div style={{ fontFamily: anton, fontSize: 92, color: "#2E6E73", letterSpacing: 3, lineHeight: 1.05 }}>YEARLY INCOME</div>
    </div>
  );
};
const PriceTag: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.dollars - 0.3, t1 = T.follow - 0.08;
  if (t < t0 || t > t1) return null;
  const s = pop(t, t0), out = clamp01((t1 - t) / 0.15), sw = Math.sin((t - t0) * 4) * 6 * Math.exp(-(t - t0) * 1.2);
  return (
    <div style={{ position: "absolute", left: 200, top: 760, transform: `rotate(${-8 + sw}deg) scale(${s * out})`, transformOrigin: "50% 0%" }}>
      <div style={{ width: 6, height: 60, background: INK, margin: "0 auto" }} />
      <div style={{ ...card, background: "#FFD23F", padding: "6px 30px", fontFamily: anton, fontSize: 100, color: INK, letterSpacing: 2 }}>$412,500</div>
    </div>
  );
};

// ------------------------------------------------------------------ composition
export const HouseYears: React.FC<HouseProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const keys = useMemo(() => { T = timesFrom(P.words); SHOTS = buildShots(); return WORKER_KEYS(); }, [P.words]);
  const tex = useTextures();
  const cam = shotAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#141827" }}>
      {tex ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 42, near: 0.05, far: 500 }} gl={{ antialias: false }}>
          <Scene t={t} cam={cam} keys={keys} />
        </ThreeCanvas>
      ) : null}
      <Tag x={540} y={420} t={t} t0={T.income - 0.06} t1={T.every - 0.1} rot={-4}><Big size={104}>5 YEARS <span style={{ color: "#FFD23F" }}>OF INCOME</span></Big></Tag>
      <YearCount t={t} />
      <Tag x={540} y={420} t={t} t0={T.entire - 0.06} t1={T.harvard - 0.1} rot={-5}><Stamp size={110}>100% OF INCOME</Stamp></Tag>
      <Tag x={540} y={600} t={t} t0={T.straight - 0.06} t1={T.harvard - 0.1} rot={4}><Big size={130} color="#FFD23F">× 5 YEARS</Big></Tag>
      <Tag x={540} y={330} t={t} t0={T.harvard - 0.02} t1={T.called - 0.1} rot={-3}><Big size={96} color="#FFF8EC">HARVARD JCHS</Big></Tag>
      <RatioCard t={t} />
      <Hud t={t} />
      <Tag x={700} y={560} t={t} t0={T.affordable - 0.05} t1={T.bubble - 0.1} rot={-7}><Stamp size={110} color="#2F8F4F">AFFORDABLE</Stamp></Tag>
      <Tag x={560} y={560} t={t} t0={T.record - 0.05} t1={T.crash - 0.1} rot={6}><Stamp size={130}>RECORD</Stamp></Tag>
      <Tag x={560} y={560} t={t} t0={T.crash - 0.03} t1={T.climbed - 0.1} rot={-8}><Big size={150} color="#CFE6FF">CRASH</Big></Tag>
      <PriceTag t={t} />
      <Tag x={540} y={560} t={t} t0={T.times - 0.05} t1={T.follow - 0.1} rot={-4}><Big size={170} color="#FFD23F">5× INCOME</Big></Tag>
      <Tag x={700} y={1520} t={t} t0={T.tie - 0.05} t1={T.follow - 0.1} rot={5}><Stamp size={84}>= 2005 BUBBLE</Stamp></Tag>
      <Tag x={540} y={430} t={t} t0={T.away - 0.3} t1={T.end + 0.3} rot={-4}><Big size={140}>5 YEARS <span style={{ color: "#FFD23F" }}>AWAY</span></Big></Tag>
      {P.captions ? <Karaoke c={P.captions} y={1660} /> : null}
      {P.audio ? <Audio src={staticFile(P.audio)} /> : null}
    </AbsoluteFill>
  );
};
