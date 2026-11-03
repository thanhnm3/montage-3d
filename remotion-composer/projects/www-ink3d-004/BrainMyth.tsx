// Why Why Why — ink-3D 004 "Do we only use 10% of our brain?" (2026-11-03). Myth explainer in the 003 r02 look:
// free CC0 world + the Quaternius person with the drawn live face (Person.tsx), ink pass + mood grade (Ink.tsx).
// Two sets cut against each other:
//   - "stage": a giant procedural brain (no free model fits: sulci are grooves carved along the zero lines of a 3D noise,
//     so the ink pass draws them as folds) split into 12 regions that light up / switch off with the narration;
//   - "meadow": the host on a sunny Kenney meadow, a mini brain floats over his head on "2% of your body weight".
// Shot list = one shot per phrase (lesson from 003): every shot shows the literal action of its line.
// Timing: word times come from props.words (whisper output of the real voice, see scenes/build.py). Without it the
// comp falls back to T_EST (an estimate at ~3.2 words/s), so stills can be checked before the voice exists.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { Person, PersonKey, personAt, Cue } from "./Person";
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { Sky, Tex, V3, clamp01, ease, lerp, lerpV, toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;
const GLB_LIST = ["man", "tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_tall", "grass", "grass_large", "flower_redA", "flower_yellowA",
  "flower_purpleA", "rock_largeA", "rock_smallA", "plant_bush", "stump_round"];

// ------------------------------------------------------------------ timing
// anchor words in script order; each one is matched to the next occurrence of that word after the previous anchor
const ANCHORS: [string, string][] = [
  ["only", "only"], ["brain", "brain"], ["movies", "movies"], ["idea", "idea"], ["your", "your"], ["doesnt", "doesnt"], ["brain2", "brain"],
  ["weight", "weight"], ["burns", "burns"], ["energy", "energy"], ["body", "body"], ["pay", "pay"], ["keep", "keep"], ["switched", "switched"],
  ["evolution", "evolution"], ["cut", "cut"], ["ago", "ago"], ["scans", "scans"], ["agree", "agree"], ["not", "not"], ["lights", "lights"],
  ["once", "once"], ["over", "over"], ["day", "day"], ["almost", "almost"], ["region", "region"], ["turn", "turn"], ["so", "so"], ["dont", "dont"],
  ["all", "all"], ["just", "just"], ["once2", "once"], ["follow", "follow"], ["why", "why"], ["behind", "behind"],
];
type Times = Record<string, number>;
const T_EST: Times = {
  only: 0.24, brain: 1.74, movies: 2.29, idea: 3.18, your: 3.71, doesnt: 4.28, brain2: 5.19, weight: 7.19, burns: 8.1, energy: 9.7, body: 10.56,
  pay: 11.45, keep: 12.44, switched: 13.22, evolution: 14.13, cut: 15.16, ago: 15.87, scans: 16.66, agree: 16.97, not: 17.53, lights: 18.35,
  once: 19.1, over: 19.73, day: 20.17, almost: 20.52, region: 21.18, turn: 22.03, so: 22.55, dont: 22.99, all: 25.56, just: 26.32, once2: 27.27,
  follow: 27.79, why: 28.13, behind: 29.56, end: 30.39,
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
// module-level so the helpers below read it like 003's constant T; set once per render from the props (deterministic)
let T: Times = T_EST;

// ------------------------------------------------------------------ helpers
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const up = (t: number, a: number, d = 0.45) => ease((t - a) / d);
const smooth = (a: number, b: number, x: number) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ shot list
type SetName = "stage" | "meadow";
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Shot = { t: number; set: SetName; a: Cam; b: Cam; k?: (x: number) => number; note: string };
const snap = (x: number) => ease(clamp01((x - 0.12) / 0.14));
const B: V3 = [0, 1.75, 0]; // brain centre on the stage
function buildShots(): Shot[] {
  return [
    { t: 0, set: "stage", note: "hook: a giant brain, only one small patch glowing",
      a: { pos: [0.6, 2.3, 7.0], look: B, fov: 40, roll: -3 }, b: { pos: [0.3, 2.0, 5.6], look: B, fov: 38, roll: -1 } },
    { t: T.movies - 0.04, set: "meadow", note: "movies love that idea: the host, excited, points up",
      a: { pos: [1.2, 1.3, 5.2], look: [0, 1.1, 0], fov: 42 }, b: { pos: [0.9, 1.3, 4.6], look: [0, 1.15, 0], fov: 42 } },
    { t: T.your - 0.04, set: "meadow", note: "your brain doesn't: snap zoom on his deadpan face", k: snap,
      a: { pos: [-0.3, 1.6, 2.4], look: [0, 1.5, 0], fov: 34, roll: 1 }, b: { pos: [-0.3, 1.6, 2.4], look: [0, 1.6, 0], fov: 16, roll: 4 } },
    { t: T.brain2 - 0.04, set: "meadow", note: "2% of your body weight: a tiny brain floats over his head",
      a: { pos: [-1.6, 1.2, 4.6], look: [0, 1.95, 0], fov: 44, roll: 2 }, b: { pos: [-1.1, 1.3, 3.9], look: [0, 2.0, 0], fov: 44, roll: 1 } },
    { t: T.burns - 0.04, set: "stage", note: "burns 20% of your energy: low angle, the whole brain glows, embers rise",
      a: { pos: [-2.2, 1.0, 4.6], look: B, fov: 42, roll: 3 }, b: { pos: [-1.6, 1.15, 3.9], look: B, fov: 42, roll: 2 } },
    { t: T.body - 0.04, set: "stage", note: "keep 90% switched off: high angle, region after region goes dark",
      a: { pos: [0.0, 3.8, 5.8], look: [0, 1.6, 0], fov: 40 }, b: { pos: [0.4, 3.3, 5.0], look: [0, 1.6, 0], fov: 40 } },
    { t: T.evolution - 0.04, set: "stage", note: "evolution would have cut it: scissors snip, the brain shrinks",
      a: { pos: [2.4, 1.0, 5.4], look: [0, 1.5, 0], fov: 44, roll: -4 }, b: { pos: [2.0, 1.1, 4.8], look: [0, 1.5, 0], fov: 44, roll: -3 } },
    { t: T.scans - 0.04, set: "stage", note: "brain scans agree: flash, scanner frame, a scan line sweeps",
      a: { pos: [0, 1.85, 5.4], look: B, fov: 40 }, b: { pos: [0, 1.85, 4.7], look: B, fov: 40 } },
    { t: T.not - 0.04, set: "stage", note: "not every part at once: regions light one at a time",
      a: { pos: [-1.4, 2.5, 4.2], look: B, fov: 38, roll: 2 }, b: { pos: [-0.6, 2.7, 3.8], look: B, fov: 38, roll: 1 } },
    { t: T.over - 0.04, set: "stage", note: "over a day every region gets its turn: orbit, 24h clock, all lit by 'turn'",
      a: { pos: [3.5, 2.6, 5.0], look: B, fov: 42 }, b: { pos: [-3.5, 2.4, 5.0], look: B, fov: 42 } },
    { t: T.so - 0.04, set: "meadow", note: "so you don't use 10%: the host shrugs, MYTH BUSTED",
      a: { pos: [2.0, 1.2, 5.0], look: [0, 1.0, 0], fov: 42 }, b: { pos: [-1.5, 1.2, 5.0], look: [0, 1.0, 0], fov: 42 } },
    { t: T.all - 0.04, set: "stage", note: "you use all of it, just not all at once: everything lit, pulsing in turns",
      a: { pos: [0.5, 1.95, 4.4], look: B, fov: 40, roll: -2 }, b: { pos: [0.2, 1.9, 3.7], look: B, fov: 40, roll: -1 } },
    { t: T.follow - 0.04, set: "meadow", note: "follow: he waves, crane up",
      a: { pos: [0.5, 1.2, 4.6], look: [0, 1.1, 0], fov: 42 }, b: { pos: [0.5, 3.4, 9.5], look: [0, 1.0, 0], fov: 44 } },
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
  // handheld drift + a jolt on the twist (the scan flash)
  const jolt = t > T.scans && t < T.scans + 0.6 ? Math.exp(-(t - T.scans) * 7) * 0.05 : 0;
  cam.pos = [cam.pos[0] + Math.sin(t * 0.7) * 0.02 + Math.sin(t * 43) * jolt, cam.pos[1] + Math.sin(t * 0.9 + 1) * 0.015 + Math.cos(t * 39) * jolt, cam.pos[2]];
  return { ...cam, set: s.set, i };
}

// ------------------------------------------------------------------ the mood track
function gradeAt(t: number, set: SetName) {
  let cold = 0, warm = 0, night = 0;
  if (set === "stage") {
    night = 0.3;
    if (t >= T.burns - 0.1 && t < T.body) warm = 0.6;
    else if (t >= T.body && t < T.scans) { cold = 0.7 * up(t, T.switched - 0.2, 0.6); night = 0.3 + 0.25 * up(t, T.switched - 0.2, 0.6); }
    else if (t >= T.over) warm = 0.45 * up(t, T.over, 1.5);
  } else {
    warm = t >= T.follow ? 0.5 * up(t, T.follow + 0.2, 1.4) : 0.15;
  }
  const flash = t > T.scans - 0.04 ? Math.exp(-(t - T.scans + 0.04) * 5) * 0.85 : 0;
  return { cold, warm, night, red: 0, flash: Math.min(1, flash) };
}

// ------------------------------------------------------------------ procedural brain
// 3D value noise (deterministic, no deps)
const hash3 = (x: number, y: number, z: number) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a: number, b: number, d: number) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
// narrow grooves along the zero lines of a noise field: meandering sulci, wide gyri between them
const sulcus = (x: number, y: number, z: number, f: number, wd: number) => {
  const a = Math.abs(2 * vnoise(x * f + 11.3, y * f + 3.7, z * f + 5.1) - 1);
  return Math.exp(-((a / wd) ** 2));
};
const N_REG = 12;
const SEEDS: THREE.Vector3[] = (() => {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < N_REG; i++) {
    const y = 1 - (i + 0.5) / N_REG * 1.6; // skip the flat underside
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.39996;
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize());
  }
  // region 0 = the "10%": upper front of the side that faces the camera
  const target = new THREE.Vector3(0.75, 0.45, 0.35).normalize();
  let best = 0;
  out.forEach((s, i) => { if (s.dot(target) > out[best].dot(target)) best = i; });
  [out[0], out[best]] = [out[best], out[0]];
  out[0] = target;
  return out;
})();
const BRAIN_YAW = -Math.PI / 2 + 0.6; // left side to camera, front turned a little toward it

type BrainGeo = { geo: THREE.BufferGeometry; region: Uint8Array; region2: Uint8Array; blend: Float32Array; lit: THREE.BufferAttribute; dark: THREE.BufferAttribute };
function makeCerebrum(): BrainGeo {
  const geo = new THREE.SphereGeometry(1, 256, 192);
  const p = geo.attributes.position;
  const n = p.count;
  const region = new Uint8Array(n), region2 = new Uint8Array(n), blend = new Float32Array(n);
  const colors = new Float32Array(n * 3);
  const crest = new THREE.Color("#F4A7AE"), groove = new THREE.Color("#B8505F"), c = new THREE.Color();
  const q = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    q.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    const g = Math.max(sulcus(q.x, q.y, q.z, 3.1, 0.11), 0.6 * sulcus(q.x, q.y, q.z, 6.3, 0.09));
    const fis = Math.exp(-((q.x / 0.06) ** 2)) * smooth(-0.25, 0.45, q.y); // the split between the hemispheres
    const s = 1 - 0.055 * g - 0.17 * fis;
    let x = q.x * 0.8 * s, y = q.y * 0.72 * s;
    const z = q.z * 1.0 * s;
    if (y < -0.3) y = -0.3 + (y + 0.3) * 0.45; // flat underside
    x *= 1 + 0.12 * smooth(0.0, -0.3, q.y) * smooth(-0.6, 0.2, q.z); // temporal lobes bulge out low and forward
    p.setXYZ(i, x, y, z);
    c.copy(crest).lerp(groove, Math.max(g * 0.85, fis));
    colors.set([c.r, c.g, c.b], i * 3);
    let best = 0, bd = -2, sec = 0, sd = -2;
    for (let r = 0; r < N_REG; r++) {
      const d = q.dot(SEEDS[r]);
      if (d > bd) { sec = best; sd = bd; bd = d; best = r; } else if (d > sd) { sd = d; sec = r; }
    }
    region[i] = best; region2[i] = sec;
    blend[i] = 0.5 * (1 - smooth(0, 0.06, bd - sd)); // 0.5 on the border, 0 inside: soft edge instead of a stair step
  }
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const lit = new THREE.BufferAttribute(new Float32Array(n), 1);
  const dark = new THREE.BufferAttribute(new Float32Array(n), 1);
  geo.setAttribute("lit", lit);
  geo.setAttribute("dark", dark);
  return { geo, region, region2, blend, lit, dark };
}
function brainMaterial() {
  const m = toon({ vertexColors: true });
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nattribute float lit; attribute float dark; varying float vLit; varying float vDark;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLit = lit; vDark = dark;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vLit; varying float vDark;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.40, 0.38, 0.47) * (0.6 + 0.4 * diffuseColor.r), vDark * 0.85);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.86, 0.38), vLit * 0.6);`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.68, 0.18) * vLit * 0.6;");
  };
  return m;
}

// per region: how lit (0..1) and how switched off (0..1) at time t
function regionState(t: number, r: number, mini: boolean): [number, number] {
  const pulse = (ph: number, sp = 5) => 0.5 + 0.5 * Math.sin(t * sp + ph);
  if (mini) return [0.25 + 0.2 * pulse(r * 1.7, 4), 0];
  if (t < T.movies) return r === 0 ? [up(t, 0.1, 0.4) * (0.7 + 0.3 * pulse(0, 6)), 0] : [0, 0.35 * up(t, 0.2, 0.6)];
  if (t < T.body) return [up(t, T.burns - 0.1, 0.5) * (0.55 + 0.3 * pulse(r * 2.3, 9)), 0];
  if (t < T.scans) {
    if (r === 0) return [0.8 + 0.2 * pulse(0, 6), 0];
    const off = up(t, T.switched - 0.2 + (r % 4) * 0.08, 0.3);
    return [0.5 * (1 - off), off];
  }
  if (t < T.not) { // the scan line sweeps front to back; each region flares as it passes
    const sweep = lerp(1.2, -1.2, clamp01((t - T.scans) / Math.max(0.3, T.not - T.scans)));
    const d = Math.abs(SEEDS[r].z - sweep);
    return [Math.exp(-((d / 0.3) ** 2)), 0];
  }
  if (t < T.over) { // one at a time
    const per = 0.32;
    const k = (t - T.not) / per;
    const order = (r * 5) % N_REG; // hop around instead of walking neighbours
    const ph = k - order - Math.floor((k - order) / N_REG) * N_REG; // 0..12, this region's window is [0,1)
    return [ph < 1 ? Math.sin(Math.PI * ph) : 0, 0];
  }
  if (t < T.all) { // over a day every region gets its turn: they light and stay lit
    const at = T.over + (((r * 7) % N_REG) / N_REG) * Math.max(0.5, T.turn - T.over);
    return [up(t, at, 0.3) * (0.75 + 0.25 * pulse(r * 1.3, 4)), 0];
  }
  // all of it, just not all at once: everything on, pulsing out of phase
  const full = 1 - up(t, T.just, 0.5);
  return [full * (0.85 + 0.15 * pulse(r, 6)) + (1 - full) * (0.3 + 0.7 * Math.max(0, Math.sin(t * 3.2 + r * 2.1)) ** 2), 0];
}

const Brain: React.FC<{ t: number; pos: V3; scale: number; yaw: number; mini?: boolean }> = ({ t, pos, scale, yaw, mini = false }) => {
  const r = useMemo(() => {
    const cer = makeCerebrum();
    const mat = brainMaterial();
    // cerebellum (striped) + brain stem
    const cb = new THREE.SphereGeometry(1, 96, 64);
    const cp = cb.attributes.position;
    const cc = new Float32Array(cp.count * 3);
    const a = new THREE.Color("#E58E99"), b = new THREE.Color("#B8505F"), c = new THREE.Color();
    for (let i = 0; i < cp.count; i++) {
      const y = cp.getY(i);
      const st = Math.exp(-((Math.sin(y * 22) / 0.35) ** 2));
      const s = 1 - 0.05 * st;
      cp.setXYZ(i, cp.getX(i) * 0.52 * s, y * 0.27 * s, cp.getZ(i) * 0.36 * s);
      c.copy(a).lerp(b, st * 0.8);
      cc.set([c.r, c.g, c.b], i * 3);
    }
    cb.computeVertexNormals();
    cb.setAttribute("color", new THREE.BufferAttribute(cc, 3));
    return { cer, mat, cb, cbMat: toon({ vertexColors: true }), stemMat: toon({ color: new THREE.Color("#D98390") }) };
  }, []);
  const { region, region2, blend, lit, dark } = r.cer;
  const st: [number, number][] = Array.from({ length: N_REG }, (_, i) => regionState(t, i, mini));
  for (let i = 0; i < region.length; i++) {
    const a = st[region[i]], b = st[region2[i]], w = blend[i];
    lit.setX(i, lerp(a[0], b[0], w)); dark.setX(i, lerp(a[1], b[1], w));
  }
  lit.needsUpdate = true; dark.needsUpdate = true;
  const bob = Math.sin(t * 1.4) * 0.04;
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0.08, yaw, 0]} scale={[scale, scale, scale]}>
      <mesh geometry={r.cer.geo} material={r.mat} castShadow receiveShadow />
      <mesh geometry={r.cb} material={r.cbMat} position={[0, -0.36, -0.62]} castShadow />
      <mesh material={r.stemMat} position={[0, -0.5, -0.32]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.42, 24]} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ stage set
const SPARKS = (() => {
  const r = rng(31);
  return Array.from({ length: 70 }, () => ({ x: -7 + r() * 14, y: 0.3 + r() * 6, z: -9 + r() * 8, ph: r() * 6.28, s: 0.08 + r() * 0.16 }));
})();
const EMBERS = (() => {
  const r = rng(47);
  return Array.from({ length: 40 }, () => ({ a: r() * 6.28, rad: 0.9 + r() * 0.9, ph: r(), sp: 0.5 + r() * 0.6, s: 0.1 + r() * 0.18 }));
})();
function brainScale(t: number) {
  // evolution would have cut it: shrinks to a stub, pops back on the scan flash
  const cut = up(t, T.cut - 0.1, 0.35);
  const back = t > T.scans - 0.05 ? spring({ frame: Math.round((t - T.scans + 0.05) * 30), fps: 30, config: { damping: 9, stiffness: 160 } }) : 0;
  return 1.3 * lerp(1, 0.45, cut * (1 - back));
}
const Stage: React.FC<{ t: number; tex: Tex }> = ({ t, tex }) => {
  const m = useMemo(() => ({
    floor: toon({ color: new THREE.Color("#3A3260") }),
    disc: toon({ color: new THREE.Color("#4C4380") }),
    spark: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#9FB4FF"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    ember: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#FF9A3D"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    pool: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#FFC56A"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [tex]);
  const burn = t >= T.burns - 0.1 && t < T.body + 0.4 ? up(t, T.burns - 0.1, 0.4) * (1 - up(t, T.body, 0.4)) : 0;
  const sc = brainScale(t);
  m.spark.opacity = 0.55;
  m.ember.opacity = burn * 0.9;
  m.pool.opacity = 0.35 + 0.3 * (t > T.over ? up(t, T.over, 1) : 0);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow><planeGeometry args={[200, 200]} /></mesh>
      <mesh material={m.disc} position={[0, 0.06, 0]} receiveShadow castShadow><cylinderGeometry args={[1.6, 1.75, 0.12, 64]} /></mesh>
      <sprite material={m.pool} position={[0, 0.2, 0]} scale={[3.4, 1.2, 1]} userData={{ noNormal: true }} />
      {SPARKS.map((s, i) => <sprite key={i} material={m.spark} position={[s.x, s.y + Math.sin(t * 0.6 + s.ph) * 0.1, s.z]}
        scale={[s.s * (0.7 + 0.3 * Math.sin(t * 3 + s.ph)), s.s * (0.7 + 0.3 * Math.sin(t * 3 + s.ph)), 1]} userData={{ noNormal: true }} />)}
      {burn > 0.01 ? EMBERS.map((e, i) => {
        const ph = (e.ph + (t - T.burns) * e.sp) % 1;
        return <sprite key={`e${i}`} material={m.ember} position={[Math.cos(e.a + ph) * e.rad, B[1] - 0.6 + ph * 2.4, Math.sin(e.a + ph) * e.rad]}
          scale={[e.s * (1 - ph), e.s * (1 - ph), 1]} userData={{ noNormal: true }} />;
      }) : null}
      <Brain t={t} pos={B} scale={sc} yaw={BRAIN_YAW + Math.sin(t * 0.35) * 0.25} />
    </group>
  );
};

// ------------------------------------------------------------------ meadow set
const Meadow: React.FC<{ models: Models; t: number }> = ({ models, t }) => {
  const ground = useMemo(() => toon({ color: new THREE.Color("#79B653") }), []);
  const hill = useMemo(() => [toon({ color: new THREE.Color("#8CC463") }), toon({ color: new THREE.Color("#6FA94B") })], []);
  const trees: [string, number, number, number][] = [["tree_oak", -4.5, -5, 4.2], ["tree_fat", 4.2, -6.5, 3.6], ["tree_default", -8, -10, 4.8],
    ["tree_tall", 7.5, -11, 5.5], ["tree_detailed", -1.5, -13, 5], ["tree_oak", 11, -7, 4.6], ["tree_default", -12, -4, 4.2], ["tree_fat", 2.5, -16, 5.5]];
  const deco: [string, number, number, number][] = [["grass_large", -1.4, 0.6, 0.5], ["grass", 1.3, 0.9, 0.35], ["flower_redA", -0.9, 1.5, 0.35],
    ["flower_yellowA", 1.0, 1.8, 0.35], ["flower_purpleA", -1.9, -0.6, 0.4], ["grass_large", 2.0, -1.2, 0.5], ["rock_smallA", 2.4, 0.4, 0.35],
    ["plant_bush", -2.8, -2.2, 0.9], ["stump_round", 3.2, -2.6, 0.45], ["rock_largeA", -3.6, -3.8, 1.0], ["flower_yellowA", -2.2, 2.4, 0.3],
    ["grass", 0.4, 2.6, 0.35], ["flower_redA", 2.6, 2.0, 0.3]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[600, 600]} /></mesh>
      {trees.map(([n, x, z, h], i) => <M key={i} models={models} name={n} size={h} pos={[x, 0, z]} rot={i * 1.3} />)}
      {deco.map(([n, x, z, h], i) => <M key={`d${i}`} models={models} name={n} size={h} pos={[x, 0, z]} rot={i * 2.1} />)}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        const R = 150 + (i % 3) * 40;
        return <mesh key={`h${i}`} material={hill[i % 2]} position={[Math.cos(a) * R, -6, Math.sin(a) * R - 30]} scale={[70 + (i % 4) * 14, 24 + (i % 3) * 10, 50]}>
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>;
      })}
      {/* "2% of your body weight": a tiny brain floats over his head */}
      {t > T.brain2 - 0.1 && t < T.burns ? <Brain t={t} pos={[0, 2.2, 0]} scale={0.2 * up(t, T.brain2 - 0.05, 0.35)} yaw={BRAIN_YAW + t * 0.8} mini /> : null}
    </group>
  );
};

// ------------------------------------------------------------------ host
const PERSON_KEYS = (): PersonKey[] => [
  { t: 0, clip: "Idle_Neutral", pose: "armsDown", face: "neutral" },
  { t: T.movies - 0.05, pose: "pointUp", face: "happy" }, // "movies love that idea"
  { t: T.your - 0.08, pose: "armsDown", face: "deadpan" }, // "your brain doesn't"
  { t: T.brain2 - 0.08, pose: "pointUp", face: "curious" }, // looks up at the tiny brain
  { t: T.so - 0.1, pose: "shrug", face: "shrug" },
  { t: T.dont + 0.3, pose: "facepalm", face: "laugh" },
  { t: T.follow - 0.05, clip: "Wave", pose: "clip", face: "happy" },
];

// ------------------------------------------------------------------ props from build.py
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number };
export type BrainProps = { durationInFrames: number; audio?: string; cues?: Cue[]; captions?: Captions; words?: Word[] };

function useTextures() {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    const load = (url: string) => new Promise<THREE.Texture>((res, rej) => L.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej));
    Promise.all([
      load(staticFile("tex/cloud.png")).then((t) => ["cloud", t] as const),
      load(staticFile("tex/glow.png")).then((t) => ["glow", t] as const),
    ]).then((all) => setTex(Object.fromEntries(all)));
  }, []);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}

const CamSet: React.FC<{ pos: V3; look: V3; fov: number; roll: number }> = ({ pos, look, fov, roll }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.05; c.far = 4000; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...look); c.rotateZ(THREE.MathUtils.degToRad(roll)); c.updateMatrixWorld();
  return null;
};

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof shotAt>; keys: PersonKey[]; cues: Cue[] }> = ({ t, tex, models, cam, keys, cues }) => {
  const g = gradeAt(t, cam.set);
  const focus = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look));
  if (cam.set === "stage") {
    return (
      <>
        <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
        <color attach="background" args={["#241E44"]} />
        <fogExp2 attach="fog" args={[new THREE.Color("#241E44").getHex(), 0.045]} />
        <hemisphereLight args={[new THREE.Color("#C9C2FF"), new THREE.Color("#3A2E50"), 1.15]} />
        <directionalLight position={[-4, 8, 6]} intensity={2.1} color="#FFE6D0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
          shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={40} />
        <pointLight position={[2.5, 3.2, -3]} color="#9C7BFF" intensity={14} distance={12} decay={1.6} />
        <Stage t={t} tex={tex} />
        <InkPass p={{ focus, blur: 6, night: g.night, cow: 0, flash: g.flash, redPulse: 0, ink: 1, cold: g.cold, warm: g.warm }} />
      </>
    );
  }
  const sunUp = t > T.follow ? up(t, T.follow + 0.2, 1.4) : 0;
  const sun: V3 = [-30, 34, 40];
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <fogExp2 attach="fog" args={[new THREE.Color("#D8EAF2").getHex(), 0.012]} />
      <Sky night={0} sunDir={sun} />
      <hemisphereLight args={[new THREE.Color("#DDEBFF"), new THREE.Color("#7FA36A"), 1.2]} />
      <directionalLight position={sun} intensity={1.9 + sunUp * 0.8} color="#FFF0D8" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={120} />
      <Meadow models={models} t={t} />
      <Person models={models} pos={[0, 0, 0]} rot={0} t={t} st={personAt(keys, t)} cues={cues} />
      <InkPass p={{ focus, blur: 7, night: g.night, cow: 0, flash: g.flash, redPulse: 0, ink: 1, cold: g.cold, warm: g.warm }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#221A30";
const Karaoke: React.FC<{ c: Captions; y: number }> = ({ c, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ch = c.chunks.find((k) => f >= k.f0 && f < k.f1);
  if (!ch) return null;
  const pop = spring({ frame: f - ch.f0, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(-50%) scale(${0.88 + 0.12 * pop})`, display: "flex", justifyContent: "center" }}>
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
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) rotate(${rot}deg) scale(${s * out})`, transformOrigin: "50% 100%" }}>
      {children}
    </div>
  );
};
const Big: React.FC<{ size: number; color?: string; children: React.ReactNode }> = ({ size, color = "#FFF8EC", children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 4, color, WebkitTextStroke: `${size * 0.16}px ${INK}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{children}</div>
);
const Stamp: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 140, children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 8, color: "#E5342F", border: `${size * 0.09}px solid #E5342F`, borderRadius: 20, padding: "0 34px",
    background: "rgba(255,243,214,0.9)", boxShadow: "8px 10px 0 rgba(34,26,48,0.35)", whiteSpace: "nowrap" }}>{children}</div>
);
const card = { background: "#FFF3D6", border: `8px solid ${INK}`, borderRadius: 26, boxShadow: "9px 12px 0 rgba(34,26,48,0.35)" };

// "movies love that idea": a film card with sprocket holes
const FilmCard: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.movies - 0.05, t1 = T.your - 0.08;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 10, stiffness: 220 } });
  const out = clamp01((t1 - t) / 0.15);
  const holes = (top: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 16px", [top ? "borderBottom" : "borderTop"]: `6px solid ${INK}` }}>
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ width: 40, height: 30, borderRadius: 6, background: "#FFF3D6" }} />)}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: W / 2, top: 230, transform: `translateX(-50%) rotate(-4deg) scale(${s * out})`, transformOrigin: "50% 0%",
      background: "#2B2340", border: `8px solid ${INK}`, borderRadius: 18, boxShadow: "9px 12px 0 rgba(34,26,48,0.35)", width: 760 }}>
      {holes(true)}
      <div style={{ padding: "18px 0 12px", textAlign: "center" }}>
        <div style={{ fontFamily: anton, fontSize: 50, color: "#FFD23F", letterSpacing: 6 }}>NOW IN CINEMAS</div>
        <div style={{ fontFamily: anton, fontSize: 120, color: "#FFF8EC", letterSpacing: 4, lineHeight: 1.05 }}>UNLOCK 100%!</div>
      </div>
      {holes(false)}
    </div>
  );
};

// "2% of your body weight ... 20% of your energy": two bars that draw on
const Stats: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.brain2 + 0.1, t1 = T.body - 0.1;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 12, stiffness: 200 } });
  const out = clamp01((t1 - t) / 0.18);
  const row = (label: string, pct: number, color: string, at: number) => {
    const k = up(t, at, 0.6);
    const vis = t > at - 0.25;
    return (
      <div style={{ opacity: vis ? 1 : 0, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: anton, fontSize: 54, color: INK, letterSpacing: 3 }}>
          <span>{label}</span><span style={{ color }}>{Math.round(pct * k)}%</span>
        </div>
        <div style={{ height: 56, border: `6px solid ${INK}`, borderRadius: 10, background: "#FFFFFF", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(pct * k, pct > 0 && k > 0 ? 1.2 : 0)}%`, height: "100%", background: color, borderRight: k > 0 ? `5px solid ${INK}` : "none" }} />
        </div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: W / 2, top: 180, transform: `translateX(-50%) scale(${s * out})`, transformOrigin: "50% 0%", ...card, width: 780, padding: "18px 30px 28px" }}>
      <div style={{ fontFamily: anton, fontSize: 56, color: "#B7462E", letterSpacing: 3 }}>YOUR BRAIN</div>
      {row("BODY WEIGHT", 2, "#F08A9A", T.brain2 + 0.35)}
      {row("ENERGY USED", 20, "#FF9A3D", T.burns + 0.3)}
    </div>
  );
};

// "evolution would have cut it": scissors snip along a dashed line across the brain
const Scissors: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.evolution - 0.05, t1 = T.scans - 0.08;
  if (t < t0 || t > t1) return null;
  const out = clamp01((t1 - t) / 0.15);
  const draw = up(t, t0, 0.5);
  const run = up(t, T.cut - 0.25, 0.5);
  const x = lerp(160, 920, run), y = 760;
  const snipA = 14 * Math.abs(Math.sin(t * 22));
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out }}>
      <line x1={120} y1={y} x2={lerp(120, 960, draw)} y2={y} stroke="#FFF8EC" strokeWidth={10} strokeDasharray="34 22" strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(0)`}>
        <g transform={`rotate(${-snipA})`}>
          <path d="M 0 0 L 150 -10 L 150 4 Z" fill="#DDE3EE" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <circle cx={-48} cy={-26} r={30} fill="none" stroke="#E5342F" strokeWidth={16} />
        </g>
        <g transform={`rotate(${snipA})`}>
          <path d="M 0 0 L 150 10 L 150 -4 Z" fill="#DDE3EE" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <circle cx={-48} cy={26} r={30} fill="none" stroke="#E5342F" strokeWidth={16} />
        </g>
        <circle r={9} fill={INK} />
      </g>
    </svg>
  );
};

// "brain scans agree": scanner frame + sweeping line
const Scan: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.scans - 0.05, t1 = T.not - 0.05;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 11, stiffness: 240 } });
  const out = clamp01((t1 - t) / 0.15);
  const sweep = clamp01((t - T.scans) / Math.max(0.3, T.not - T.scans));
  const bx = 120, by = 520, bw = 840, bh = 900;
  const c = "#5CFFB0";
  const corner = (x: number, y: number, dx: number, dy: number) => <path d={`M ${x} ${y + dy * 90} L ${x} ${y} L ${x + dx * 90} ${y}`} fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" />;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out, transform: `scale(${0.9 + 0.1 * s})`, transformOrigin: "50% 50%" }}>
      {corner(bx, by, 1, 1)}{corner(bx + bw, by, -1, 1)}{corner(bx, by + bh, 1, -1)}{corner(bx + bw, by + bh, -1, -1)}
      <rect x={bx + 20} y={lerp(by + 20, by + bh - 20, sweep) - 4} width={bw - 40} height={8} fill={c} opacity={0.9} />
      <rect x={bx + 20} y={lerp(by + 20, by + bh - 20, sweep) - 60} width={bw - 40} height={56} fill={c} opacity={0.15} />
      <text x={W / 2} y={by - 30} textAnchor="middle" fontFamily={anton} fontSize={78} fill="#FFF8EC" stroke={INK} strokeWidth={14} paintOrder="stroke" letterSpacing={6}>BRAIN SCAN</text>
    </svg>
  );
};

// "over a day": a 24 hour clock whose hand runs once round
const Clock: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.over - 0.05, t1 = T.so - 0.1;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 10, stiffness: 220 } });
  const out = clamp01((t1 - t) / 0.15);
  const k = clamp01((t - T.over) / Math.max(0.5, T.turn - T.over));
  const ang = k * 360;
  const R = 120;
  const arc = (a: number) => [Math.sin(a * Math.PI / 180) * R, -Math.cos(a * Math.PI / 180) * R];
  const [ex, ey] = arc(Math.min(ang, 359.9));
  return (
    <div style={{ position: "absolute", left: W - 210, top: 250, transform: `translate(-50%,0) scale(${s * out})`, transformOrigin: "50% 0%", textAlign: "center" }}>
      <svg width={300} height={300} viewBox="-150 -150 300 300">
        <circle r={R + 14} fill="#FFF3D6" stroke={INK} strokeWidth={10} />
        <path d={`M 0 0 L 0 ${-R} A ${R} ${R} 0 ${ang > 180 ? 1 : 0} 1 ${ex} ${ey} Z`} fill="#FFD23F" opacity={0.85} />
        {Array.from({ length: 12 }, (_, i) => { const [x, y] = arc(i * 30); return <line key={i} x1={x * 0.85} y1={y * 0.85} x2={x} y2={y} stroke={INK} strokeWidth={6} />; })}
        <line x1={0} y1={0} x2={ex * 0.9} y2={ey * 0.9} stroke="#E5342F" strokeWidth={12} strokeLinecap="round" />
        <circle r={12} fill={INK} />
      </svg>
      <div style={{ marginTop: -6 }}><Big size={64}>24 HOURS</Big></div>
    </div>
  );
};

// ------------------------------------------------------------------ composition
export const BrainMyth: React.FC<BrainProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const keys = useMemo(() => { T = timesFrom(P.words); SHOTS = buildShots(); return PERSON_KEYS(); }, [P.words]);
  const tex = useTextures();
  const models = useModels([], GLB_LIST);
  const cam = shotAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 42, near: 0.05, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} keys={keys} cues={P.cues ?? []} />
        </ThreeCanvas>
      ) : null}
      <Tag x={540} y={430} t={t} t0={0.12} t1={T.movies - 0.08} rot={-4}><Big size={130}>ONLY <span style={{ color: "#FFD23F" }}>10%?</span></Big></Tag>
      <FilmCard t={t} />
      <Tag x={540} y={500} t={t} t0={T.doesnt - 0.06} t1={T.brain2 - 0.1} rot={-8}><Stamp>MYTH</Stamp></Tag>
      <Stats t={t} />
      <Tag x={540} y={440} t={t} t0={T.switched - 0.05} t1={T.evolution - 0.1} rot={5}><Big size={130} color="#CFE6FF">90% OFF?</Big></Tag>
      <Tag x={540} y={440} t={t} t0={T.evolution - 0.05} t1={T.scans - 0.1} rot={-4}><Big size={110} color="#FFD23F">EVOLUTION SAYS</Big></Tag>
      <Tag x={540} y={600} t={t} t0={T.cut - 0.05} t1={T.scans - 0.1} rot={-7}><Stamp size={120}>CUT IT!</Stamp></Tag>
      <Scissors t={t} />
      <Scan t={t} />
      <Tag x={540} y={430} t={t} t0={T.not} t1={T.over - 0.1} rot={-3}><Big size={110} color="#FFD23F">ONE AT A TIME</Big></Tag>
      <Clock t={t} />
      <Tag x={430} y={640} t={t} t0={T.turn - 0.05} t1={T.so - 0.1} rot={-6}><Stamp size={130}>100% USED</Stamp></Tag>
      <Tag x={540} y={480} t={t} t0={T.so + 0.05} t1={T.all - 0.1} rot={-7}><Stamp size={120}>MYTH BUSTED</Stamp></Tag>
      <Tag x={540} y={430} t={t} t0={T.all - 0.02} t1={T.follow - 0.1} rot={-4}><Big size={130} color="#FFD23F">ALL OF IT</Big></Tag>
      <Tag x={540} y={570} t={t} t0={T.just - 0.05} t1={T.follow - 0.1} rot={4}><Big size={92}>JUST NOT ALL AT ONCE</Big></Tag>
      {P.captions ? <Karaoke c={P.captions} y={1660} /> : null}
      {P.audio ? <Audio src={staticFile(P.audio)} /> : null}
    </AbsoluteFill>
  );
};
