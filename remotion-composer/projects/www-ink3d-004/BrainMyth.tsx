// Why Why Why — ink-3D 004 "Do we only use 10% of our brain?" — r04 (2026-11-04): fantasy first, then reality slaps.
// The movie version plays out for real (unlock 100% -> he flies, lifts a cow with his mind, stops time), a giant WRONG
// stamp knocks him out of the sky, then the facts (2% / 20%, evolution, brain scans), then the callback (no flying, no
// mind powers, just one brain working all day).
// Look: free CC0 world (Kenney meadow) + ink pass + mood grade (Ink.tsx: dream / freeze added in r04). EVERY animated
// thing is a flat 2D card drawn the way toon.ts draws the host (props2d.ts on ToonCard.tsx): the cow, birds, rocks,
// leaf, stopwatch, the big brain and the mini brain, scissors, the 24 h clock, bursts, stars, dust.
// Two sets cut against each other: "meadow" (host, cow, the fantasy) and "stage" (the big 2D brain on a dark stage).
// Timing: word times come from props.words (whisper output of the real voice, see scenes/build.py). Without it the
// comp falls back to T_EST (estimate, skill formula), so stills can be checked before the voice exists.
// r03 (3D procedural brain, plain myth opening) is kept as BrainMyth_r03.tsx.bak.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { ToonHost, HostKey } from "./ToonHost";
import { ToonCard } from "./ToonCard";
import { fxCloud, fxPuff, fxStars } from "./toon";
import {
  AURA_H, AURA_W, BIRD_H, BIRD_W, BRAIN_H, BRAIN_W, CLOCK_H, CLOCK_W, COW_H, COW_W, CowState, LEAF_H, LEAF_W, N_REG, ROCK_H, ROCK_W,
  RegionState, SCIS_H, SCIS_W, SEEDS, WATCH_H, WATCH_W, drawAura, drawBird, drawBrain, drawBurst, drawClock24, drawCow, drawLeaf, drawRock, drawScissors, drawStopwatch,
} from "./props2d";
type Cue = { start: number; end: number; value: string };
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { Sky, Tex, V3, clamp01, ease, lerp, lerpV } from "./World";
import { toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;
const GLB_LIST = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_tall", "grass", "grass_large", "flower_redA", "flower_yellowA",
  "flower_purpleA", "rock_largeA", "rock_smallA", "plant_bush", "stump_round"];

// ------------------------------------------------------------------ timing
// anchor words in script order; each one is matched to the next occurrence of that word after the previous anchor
const ANCHORS: [string, string][] = [
  ["unlock", "unlock"], ["brain", "brain"], ["fly", "fly"], ["move", "move"], ["mind", "mind"], ["even", "even"], ["stop", "stop"], ["time", "time"],
  ["theres", "theres"], ["problem", "problem"], ["youre", "youre"], ["already", "already"], ["allof", "all"], ["brain2", "brain"], ["weight", "weight"],
  ["burns", "burns"], ["energy", "energy"], ["body", "body"], ["pay", "pay"], ["keep", "keep"], ["switched", "switched"], ["evolution", "evolution"],
  ["cut", "cut"], ["ago", "ago"], ["scans", "scans"], ["not", "not"], ["lights", "lights"], ["over", "over"], ["day", "day"], ["turn", "turn"],
  ["so", "so"], ["flying", "flying"], ["mindp", "mind"], ["powers", "powers"], ["just", "just"], ["brain3", "brain"], ["working", "working"],
  ["follow", "follow"], ["behind", "behind"],
];
type Times = Record<string, number>;
const T_EST: Times = {
  unlock: 0.0, brain: 1.33, fly: 2.54, move: 3.03, mind: 4.19, even: 4.71, stop: 4.98, time: 5.26, theres: 5.78, problem: 6.63, youre: 7.26,
  already: 7.57, allof: 8.26, brain2: 9.42, weight: 11.4, burns: 12.3, energy: 13.86, body: 14.73, pay: 15.62, keep: 16.61, switched: 17.36,
  evolution: 18.26, cut: 19.29, ago: 20.0, scans: 20.79, not: 21.66, lights: 22.48, over: 23.86, day: 24.3, turn: 26.16, so: 26.68, flying: 27.09,
  mindp: 27.88, powers: 28.15, just: 28.75, brain3: 29.26, working: 29.68, follow: 30.79, behind: 32.56, end: 33.63,
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
// module-level so the helpers below read it like a constant; set once per render from the props (deterministic)
let T: Times = T_EST;

// ------------------------------------------------------------------ helpers
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const up = (t: number, a: number, d = 0.45) => ease((t - a) / d);
const win = (t: number, a: number, b: number) => t >= a && t < b;
const pop = (t: number, t0: number, stiff = 220) => spring({ frame: Math.max(0, Math.round((t - t0) * 30)), fps: 30, config: { damping: 10, stiffness: stiff } });

// ------------------------------------------------------------------ the fantasy beats (derived times)
const FLY = 2.6; // flight height, m
const tW = () => T.already - 0.12; // the WRONG stamp hits
const tLand = () => tW() + 0.55; // he hits the ground
const tUp1 = () => T.brain2 - 0.14; // back on his feet
const tJump = () => T.so + 0.1; // "so no flying": he tries
const tPlant = () => T.flying + 0.12; // face-plant
const tUp2 = () => T.mindp - 0.34;
const frozen = (t: number) => win(t, T.stop + 0.05, T.theres - 0.06);
/** time as the frozen world sees it: stops while time is stopped, then carries on */
const tf = (t: number) => (t < T.stop + 0.05 ? t : t < T.theres - 0.06 ? T.stop + 0.05 : t - (T.theres - 0.06 - T.stop - 0.05));

/** host position/pose on the meadow */
function hostMotion(t: number) {
  let lift = 0, roll = 0, hit = 0, blobK = 1;
  // take-off: crouch, then up
  hit += 0.07 * Math.exp(-(((t - (T.fly - 0.3)) / 0.08) ** 2));
  if (t > T.fly - 0.2 && t < tW() + 0.1) lift = FLY * up(t, T.fly - 0.2, 0.85) + 0.07 * Math.sin(t * 2.6) * up(t, T.fly + 0.5, 0.4);
  // WRONG: squashed by the stamp, falls, lands flat on his back
  hit += 0.22 * Math.exp(-Math.max(0, t - tW()) * 10) * (t >= tW() ? 1 : 0);
  if (t >= tW() + 0.1 && t < tUp1()) {
    const k = clamp01((t - tW() - 0.1) / (tLand() - tW() - 0.1));
    const bounce = t > tLand() ? 0.12 * Math.abs(Math.sin((t - tLand()) * 11)) * Math.exp(-(t - tLand()) * 7) : 0;
    lift = lerp(FLY, -0.55, k * k) + bounce;
    roll = (Math.PI / 2) * up(k, 0.55, 0.45);
  }
  if (t >= tUp1() && t < tUp1() + 0.1) hit += 0.1;
  // "so no flying": jumps, flaps, face-plants
  if (t >= tJump() && t < tUp2()) {
    const k = clamp01((t - tJump()) / (tPlant() - tJump()));
    lift = 0.55 * 4 * k * (1 - k);
    if (t >= tPlant()) { const q = clamp01((t - tPlant()) / 0.16); lift = lerp(0, -0.55, q); roll = (-Math.PI / 2) * q; }
  }
  if (t >= tUp2() && t < tUp2() + 0.1) hit += 0.1;
  blobK = roll !== 0 ? 1.5 : clamp01(1 - lift / 3.2) * 0.9 + 0.1;
  const glow = up(t, T.brain - 0.06, 0.2) * (1 - up(t, tW(), 0.08));
  return { lift, roll, hit, blobK, glow };
}

// ------------------------------------------------------------------ shot list
type SetName = "stage" | "meadow";
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Shot = { t: number; set: SetName; a: Cam; b: Cam; k?: (x: number) => number; note: string; host?: V3; flip?: boolean };
const snap = (x: number) => ease(clamp01((x - 0.12) / 0.14));
const B: V3 = [0, 1.75, 0]; // brain centre on the stage
const HF = FLY + 1.44; // host face height while flying
function buildShots(): Shot[] {
  return [
    { t: 0, set: "meadow", note: "unlock 100%: he concentrates, the mini brain over his head fills region by region, burst",
      a: { pos: [0.5, 1.55, 4.8], look: [0, 1.65, 0], fov: 40, roll: -2 }, b: { pos: [0.3, 1.6, 3.7], look: [0, 1.75, 0], fov: 40, roll: -1 } },
    { t: T.brain + 0.32, set: "meadow", note: "and you could fly: low angle, he shoots up past the camera into the sky, birds",
      a: { pos: [1.5, 0.35, 4.6], look: [0, 2.0, 0], fov: 52, roll: 4 }, b: { pos: [1.2, 0.5, 4.2], look: [0, 3.6, 0], fov: 52, roll: 2 } },
    { t: T.move - 0.04, set: "meadow", flip: true, note: "move things with your mind: over his shoulder, the cow and rocks float up",
      a: { pos: [-0.7, 3.2, 6.0], look: [0.8, 2.2, -0.5], fov: 52 }, b: { pos: [-0.5, 3.25, 5.6], look: [0.8, 2.3, -0.5], fov: 52 } },
    { t: T.even - 0.04, set: "meadow", note: "even stop time: wide, he snaps, the world goes grey and stops (he keeps his colour)",
      a: { pos: [0.4, 2.7, 8.2], look: [0.4, 2.3, 0], fov: 46 }, b: { pos: [0.3, 2.75, 7.4], look: [0.4, 2.4, 0], fov: 46 } },
    { t: T.theres - 0.04, set: "meadow", note: "there's just one problem: record scratch, colour back, CU, he looks at us", k: snap,
      a: { pos: [0.3, HF, 3.4], look: [0, HF - 0.1, 0], fov: 36, roll: 1 }, b: { pos: [0.3, HF + 0.05, 3.4], look: [0, HF - 0.05, 0], fov: 27, roll: 3 } },
    { t: T.youre - 0.04, set: "meadow", note: "you're already using all of it: WRONG stamp in his face, he drops out of the sky (the camera tilts down with him), lands flat, the cow too",
      k: (x: number) => { const a = (tW() + 0.08 - T.youre) / (T.brain2 - T.youre), b = (tLand() - T.youre) / (T.brain2 - T.youre); return 0.9 * ease(clamp01((x - a) / (b - a))) + 0.1 * x; },
      a: { pos: [0.6, 2.9, 6.6], look: [0.3, 3.55, 0], fov: 46 }, b: { pos: [0.4, 1.45, 5.9], look: [0.25, 0.9, 0], fov: 46 } },
    { t: T.brain2 - 0.04, set: "meadow", note: "2% of your body weight: back up, rubbing it off, the mini brain over his head",
      a: { pos: [-1.6, 1.3, 4.9], look: [0, 1.95, 0], fov: 46, roll: 2 }, b: { pos: [-1.3, 1.3, 4.5], look: [0, 2.0, 0], fov: 46, roll: 1 } },
    { t: T.burns - 0.04, set: "stage", note: "burns 20% of your energy: low angle, the whole brain glows, embers rise",
      a: { pos: [-2.0, 1.0, 5.0], look: B, fov: 44, roll: 3 }, b: { pos: [-1.5, 1.15, 4.3], look: B, fov: 44, roll: 2 } },
    { t: T.body - 0.04, set: "stage", host: [-0.95, 0, 1.5], flip: true, note: "keep 90% switched off: high angle, region after region goes dark",
      a: { pos: [0.2, 3.7, 7.9], look: [-0.25, 1.5, 0.4], fov: 44 }, b: { pos: [0.3, 3.5, 7.3], look: [-0.25, 1.5, 0.4], fov: 44 } },
    { t: T.evolution - 0.04, set: "stage", note: "evolution would have cut it: the scissors snip across, the brain shrinks",
      a: { pos: [1.6, 1.3, 7.0], look: [0, 1.6, 0], fov: 44, roll: -4 }, b: { pos: [1.3, 1.35, 6.4], look: [0, 1.6, 0], fov: 44, roll: -3 } },
    { t: T.scans - 0.04, set: "stage", note: "brain scans agree: the only white flash, scanner frame, a scan line sweeps front to back",
      a: { pos: [0, 1.9, 7.4], look: B, fov: 42 }, b: { pos: [0, 1.9, 6.8], look: B, fov: 42 } },
    { t: T.not - 0.04, set: "stage", note: "not every part at once: regions light one at a time",
      a: { pos: [-1.6, 2.5, 7.0], look: B, fov: 42, roll: 2 }, b: { pos: [-0.9, 2.6, 6.5], look: B, fov: 42, roll: 1 } },
    { t: T.over - 0.04, set: "stage", note: "over a day every region gets its turn: orbit, 24 h clock, all lit by 'turn'",
      a: { pos: [3.6, 2.6, 6.6], look: [0, 2.3, 0], fov: 46 }, b: { pos: [-3.6, 2.5, 6.6], look: [0, 2.3, 0], fov: 46 } },
    { t: T.so - 0.04, set: "meadow", note: "so no flying: he jumps, flaps, face-plants",
      a: { pos: [3.0, 1.2, 4.8], look: [0.2, 0.9, 0], fov: 42 }, b: { pos: [2.4, 1.1, 4.4], look: [0.2, 0.8, 0], fov: 42 } },
    { t: tUp2() - 0.02, set: "meadow", flip: true, note: "no mind powers: he points at the cow with all he has, the cow blinks and chews",
      a: { pos: [-1.7, 1.35, 3.6], look: [1.1, 0.9, -0.7], fov: 44 }, b: { pos: [-1.5, 1.35, 3.3], look: [1.2, 0.9, -0.7], fov: 44 } },
    { t: T.just - 0.04, set: "meadow", note: "just one brain, working all day: CU, the mini brain lit all over, pulsing",
      a: { pos: [0.25, 1.8, 2.9], look: [0, 2.05, 0], fov: 40, roll: -2 }, b: { pos: [0.2, 1.85, 2.6], look: [0, 2.05, 0], fov: 40, roll: -1 } },
    { t: T.follow - 0.04, set: "meadow", note: "follow: he waves, the cow lifts a hoof, crane up",
      a: { pos: [0.9, 1.2, 4.8], look: [0.6, 1.0, 0], fov: 44 }, b: { pos: [0.9, 3.4, 9.6], look: [0.6, 0.9, 0], fov: 46 } },
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
  // handheld drift + a jolt on the WRONG stamp and on the scan flash
  const j1 = t > tW() && t < tW() + 0.7 ? Math.exp(-(t - tW()) * 6) * 0.09 : 0;
  const j2 = t > T.scans && t < T.scans + 0.6 ? Math.exp(-(t - T.scans) * 7) * 0.05 : 0;
  const jolt = j1 + j2;
  cam.pos = [cam.pos[0] + Math.sin(t * 0.7) * 0.02 + Math.sin(t * 43) * jolt, cam.pos[1] + Math.sin(t * 0.9 + 1) * 0.015 + Math.cos(t * 39) * jolt, cam.pos[2]];
  return { ...cam, set: s.set, i };
}

// ------------------------------------------------------------------ the mood track
function gradeAt(t: number, set: SetName) {
  let cold = 0, warm = 0, night = 0, dream = 0, freeze = 0;
  if (set === "stage") {
    night = 0.3;
    if (t >= T.burns - 0.1 && t < T.body) warm = 0.6;
    else if (t >= T.body && t < T.scans) { cold = 0.7 * up(t, T.switched - 0.2, 0.6); night = 0.3 + 0.25 * up(t, T.switched - 0.2, 0.6); }
    else if (t >= T.over) warm = 0.45 * up(t, T.over, 1.5);
  } else {
    dream = t < tW() ? (0.25 * up(t, 0.2, 1.0) + 0.6 * up(t, T.brain - 0.06, 0.25)) * (t > T.theres - 0.06 ? 0.35 : 1) : 0; // record scratch: the dream fades
    freeze = frozen(t) ? up(t, T.stop + 0.05, 0.08) : 0;
    warm = t >= T.follow ? 0.5 * up(t, T.follow + 0.2, 1.4) : t > tW() ? 0.12 : 0;
  }
  const flash = t > T.scans - 0.04 ? Math.exp(-(t - T.scans + 0.04) * 5) * 0.85 : 0;
  return { cold, warm, night, dream, freeze, flash: Math.min(1, flash) };
}

// ------------------------------------------------------------------ brain region states (big brain on the stage, mini brain over his head)
const pulse = (t: number, ph: number, sp = 5) => 0.5 + 0.5 * Math.sin(t * sp + ph);
function bigState(t: number): RegionState {
  return Array.from({ length: N_REG }, (_, r): [number, number] => {
    if (t < T.body) return [up(t, T.burns - 0.1, 0.5) * (0.6 + 0.3 * pulse(t, r * 2.3, 9)), 0];
    if (t < T.scans) {
      if (r === 0) return [0.8 + 0.2 * pulse(t, 0, 6), 0];
      const off = up(t, T.switched - 0.2 + (r % 4) * 0.08, 0.3);
      return [0.5 * (1 - off), off];
    }
    if (t < T.not) { // the scan line sweeps front (left) to back (right); each region flares as it passes
      const sweep = lerp(-0.1, 1.1, clamp01((t - T.scans) / Math.max(0.3, T.not - T.scans)));
      const d = Math.abs(SEEDS[r][0] / BRAIN_W - sweep);
      return [Math.exp(-((d / 0.12) ** 2)), 0];
    }
    if (t < T.over) { // one at a time, hopping around
      const k = (t - T.not) / 0.3, order = (r * 5) % N_REG;
      const ph = k - order - Math.floor((k - order) / N_REG) * N_REG;
      return [ph < 1 ? Math.sin(Math.PI * ph) : 0, 0];
    }
    const at = T.over + (((r * 7) % N_REG) / N_REG) * Math.max(0.5, T.turn - T.over); // over a day: each lights and stays lit
    return [up(t, at, 0.3) * (0.75 + 0.25 * pulse(t, r * 1.3, 4)), 0];
  });
}
function miniState(t: number): RegionState {
  return Array.from({ length: N_REG }, (_, r): [number, number] => {
    if (t < T.fly) { // unlocking: 10% (region 0) -> one region after another -> all, then the burst
      const n = 1 + 11 * up(t, 0.35, Math.max(0.5, T.brain - 0.45));
      const on = r < n ? 0.85 : 0.08;
      return [Math.min(1, on + 0.4 * up(t, T.brain - 0.06, 0.15)), r < n ? 0 : 0.35];
    }
    if (t < T.just) return [0.3 + 0.25 * pulse(t, r * 1.7, 4), 0];
    // just one brain, working all day: everything on, pulsing out of phase
    return [0.45 + 0.55 * Math.max(0, Math.sin(t * 3.4 + r * 2.1)) ** 2, 0];
  });
}

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
type CamV = { camPos: V3; camLook: V3; sun: V3 };

// ------------------------------------------------------------------ stage set (the big 2D brain)
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
  const cut = up(t, T.cut + 0.05, 0.35);
  const back = t > T.scans - 0.05 ? pop(t, T.scans - 0.05, 160) : 0;
  return lerp(1, 0.42, cut * (1 - back));
}
const Stage: React.FC<{ t: number; tex: Tex; v: CamV }> = ({ t, tex, v }) => {
  const m = useMemo(() => ({
    floor: toon({ color: new THREE.Color("#3A3260") }),
    disc: toon({ color: new THREE.Color("#4C4380") }),
    spark: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#9FB4FF"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    ember: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#FF9A3D"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    pool: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#FFC56A"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    halo: new THREE.SpriteMaterial({ map: tex.glow, color: new THREE.Color("#FFD27A"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [tex]);
  const burn = t >= T.burns - 0.1 && t < T.body + 0.4 ? up(t, T.burns - 0.1, 0.4) * (1 - up(t, T.body, 0.4)) : 0;
  const sc = brainScale(t);
  const st = bigState(t);
  m.spark.opacity = 0.55;
  m.ember.opacity = burn * 0.9;
  m.pool.opacity = 0.35 + 0.3 * (t > T.over ? up(t, T.over, 1) : 0);
  m.halo.opacity = 0.55 * burn + 0.4 * (t > T.over ? up(t, T.turn - 0.4, 0.8) : 0);
  const bob = Math.sin(t * 1.4) * 0.04;
  // scissors run across the brain on "cut"
  const run = up(t, T.cut - 0.35, 0.45);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow><planeGeometry args={[200, 200]} /></mesh>
      <mesh material={m.disc} position={[0, 0.06, 0]} receiveShadow castShadow><cylinderGeometry args={[1.6, 1.75, 0.12, 64]} /></mesh>
      <sprite material={m.pool} position={[0, 0.2, 0]} scale={[3.4, 1.2, 1]} userData={{ noNormal: true }} />
      <sprite material={m.halo} position={[0, B[1], -0.3]} scale={[4.6 * sc, 3.8 * sc, 1]} userData={{ noNormal: true }} />
      {SPARKS.map((s, i) => <sprite key={i} material={m.spark} position={[s.x, s.y + Math.sin(t * 0.6 + s.ph) * 0.1, s.z]}
        scale={[s.s * (0.7 + 0.3 * Math.sin(t * 3 + s.ph)), s.s * (0.7 + 0.3 * Math.sin(t * 3 + s.ph)), 1]} userData={{ noNormal: true }} />)}
      {burn > 0.01 ? EMBERS.map((e, i) => {
        const ph = (e.ph + (t - T.burns) * e.sp) % 1;
        return <sprite key={`e${i}`} material={m.ember} position={[Math.cos(e.a + ph) * e.rad, B[1] - 0.6 + ph * 2.4, Math.sin(e.a + ph) * e.rad]}
          scale={[e.s * (1 - ph), e.s * (1 - ph), 1]} userData={{ noNormal: true }} />;
      }) : null}
      <ToonCard w={BRAIN_W} h={BRAIN_H} width={2.9 * sc} pos={[0, B[1] + bob - (1 - sc) * 0.6, 0]} center {...v} draw={(p, l) => drawBrain(p, st, l)} />
      {win(t, T.evolution - 0.05, T.scans - 0.05) ? (
        <ToonCard w={SCIS_W} h={SCIS_H} width={1.15 * pop(t, T.evolution - 0.05)} pos={[lerp(-1.7, 1.1, run), B[1] - 0.05, 0.75]} center {...v}
          roll={-0.05} draw={(p, l) => drawScissors(p, Math.abs(Math.sin(t * (run > 0 && run < 1 ? 24 : 4))), l)} />
      ) : null}
      {win(t, T.over - 0.05, T.so) ? (
        <ToonCard w={CLOCK_W} h={CLOCK_H} width={1.0 * pop(t, T.over - 0.05)} pos={[0, 3.6, 0.3]} center {...v}
          draw={(p, l) => drawClock24(p, clamp01((t - T.over) / Math.max(0.5, T.turn - T.over)), l)} />
      ) : null}
    </group>
  );
};

// ------------------------------------------------------------------ meadow set (host, cow, the fantasy)
const COW: V3 = [1.75, 0, -0.9];
const ROCKS: { p: V3; w: number; h: number; seed: number; at: number }[] = [
  { p: [-1.9, 0, -0.4], w: 0.62, h: 1.5, seed: 3, at: 0.1 }, { p: [1.0, 0, 1.0], w: 0.45, h: 1.9, seed: 8, at: 0.25 }, { p: [-0.4, 0, -1.6], w: 0.75, h: 1.2, seed: 5, at: 0.4 },
];
/** height of a lifted thing: rises on "move", hangs (frozen with time), drops on the WRONG stamp with a small bounce */
function liftOf(t: number, at: number, h: number) {
  const tt = tf(t);
  const rise = up(t, T.move + 0.15 + at, 0.6) * (h + 0.06 * Math.sin(tt * 2.2 + at * 9));
  if (t < tW() + 0.05) return rise;
  const k = clamp01((t - tW() - 0.05 - at * 0.3) / 0.32);
  const land = tW() + 0.05 + at * 0.3 + 0.32;
  return lerp(rise, 0, k * k) + (t > land ? 0.1 * Math.abs(Math.sin((t - land) * 12)) * Math.exp(-(t - land) * 8) : 0);
}
function cowState(t: number): CowState {
  const tt = tf(t);
  const lifted = t > T.move + 0.15 && t < tW() + 0.4;
  const blink = !frozen(t) && ((tt % 2.7) < 0.12 || win(t, T.powers + 0.05, T.powers + 0.2));
  return {
    eyes: lifted ? "shock" : t > tW() ? "half" : "dot",
    chew: lifted ? 0 : tt * 1.6, dangle: lifted ? 1 : 0, blink,
    wave: t > T.follow + 0.25 ? 0.6 + 0.4 * Math.sin((t - T.follow) * 9) : 0,
  };
}
const Meadow: React.FC<{ models: Models; t: number; v: CamV }> = ({ models, t, v }) => {
  const ground = useMemo(() => toon({ color: new THREE.Color("#79B653") }), []);
  const hill = useMemo(() => [toon({ color: new THREE.Color("#8CC463") }), toon({ color: new THREE.Color("#6FA94B") })], []);
  const trees: [string, number, number, number][] = [["tree_oak", -4.5, -5, 4.2], ["tree_fat", 4.2, -6.5, 3.6], ["tree_default", -8, -10, 4.8],
    ["tree_tall", 7.5, -11, 5.5], ["tree_detailed", -1.5, -13, 5], ["tree_oak", 11, -7, 4.6], ["tree_default", -12, -4, 4.2], ["tree_fat", 2.5, -16, 5.5]];
  const deco: [string, number, number, number][] = [["grass_large", -1.4, 1.4, 0.5], ["grass", 1.3, 1.9, 0.35], ["flower_redA", -0.9, 1.9, 0.35],
    ["flower_yellowA", 0.5, 2.2, 0.35], ["flower_purpleA", -2.3, -0.6, 0.4], ["grass_large", 2.6, -2.0, 0.5],
    ["plant_bush", -2.8, -2.4, 0.9], ["stump_round", 3.4, -2.6, 0.45], ["rock_largeA", -3.6, -3.8, 1.0], ["flower_yellowA", -2.2, 2.4, 0.3],
    ["grass", 0.4, 2.8, 0.35], ["flower_redA", 2.6, 2.0, 0.3]];
  const tt = tf(t);
  const fantasy = t < tW() + 0.8;
  const cowY = liftOf(t, 0, 1.75);
  const cs = cowState(t);
  const burst = t - (T.brain - 0.06);
  const land = t - tLand();
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
      {/* the cow (lifted with the mind, dropped by the WRONG stamp, the deadpan witness after) */}
      <ToonCard w={COW_W} h={COW_H} width={1.9} pos={[COW[0], cowY, COW[2]]} {...v} flip blob={1.5 * (1 - clamp01(cowY / 2))} draw={(p, l) => drawCow(p, cs, l)} />
      {cowY > 0.15 && t < tW() + 0.1 ? <ToonCard w={AURA_W} h={AURA_H} width={2.2} pos={[COW[0], cowY + 0.55, COW[2]]} center soft {...v} draw={(p) => drawAura(p, tt, up(t, T.move + 0.1, 0.3))} /> : null}
      {ROCKS.map((r, i) => {
        const y = liftOf(t, r.at, r.h);
        return (
          <React.Fragment key={`r${i}`}>
            <ToonCard w={ROCK_W} h={ROCK_H} width={r.w} pos={[r.p[0], y, r.p[2]]} roll={y > 0.05 ? 0.4 * Math.sin(tt * 1.3 + i) : 0} {...v}
              blob={r.w * 0.9 * (1 - clamp01(y / 1.6))} draw={(p, l) => drawRock(p, r.seed, l)} />
            {y > 0.15 && t < tW() + 0.1 ? <ToonCard w={AURA_W} h={AURA_H} width={r.w * 1.6} pos={[r.p[0], y + r.w * 0.38, r.p[2]]} center soft {...v} draw={(p) => drawAura(p, tt + i * 0.3, up(t, T.move + 0.1 + r.at, 0.3))} /> : null}
          </React.Fragment>
        );
      })}
      {/* unlock: the mini brain fills up, then the burst behind his head */}
      {t < T.fly - 0.25 ? <ToonCard w={BRAIN_W} h={BRAIN_H} width={0.62 * (0.85 + 0.15 * pop(t, 0.1))} pos={[0, 2.32 + 0.03 * Math.sin(t * 3), 0.05]} center {...v} draw={(p, l) => drawBrain(p, miniState(t), l)} /> : null}
      {burst > 0 && burst < 0.55 ? <ToonCard w={500} h={500} width={2.4} pos={[0, 1.55 + FLY * up(t, T.fly - 0.2, 0.85), -0.15]} center {...v} shadow={false} draw={(p) => drawBurst(p, burst / 0.55)} /> : null}
      {/* flight: birds, clouds */}
      {win(t, T.brain, tW() + 0.6) && !win(t, T.move - 0.04, T.even - 0.04) ? <>
        <ToonCard w={BIRD_W} h={BIRD_H} width={0.55} pos={[-2.4 + 1.1 * (tt - T.brain), 3.0 + 0.15 * Math.sin(tt * 3), 0.7]} center {...v}
          draw={(p, l) => drawBird(p, Math.sin(tt * 18), l, win(t, T.move - 0.3, T.move + 0.5))} />
        <ToonCard w={BIRD_W} h={BIRD_H} width={0.5} pos={[2.3 - 1.0 * (tt - T.brain), 3.7 + 0.15 * Math.sin(tt * 3 + 1), -0.5]} center flip {...v}
          draw={(p, l) => drawBird(p, Math.sin(tt * 17 + 1), l)} />
      </> : null}
      {fantasy ? [[-3.2, 4.6, -3.5, 2.6, 1], [2.8, 5.4, -4.5, 3.0, 2], [0.6, 6.2, -6, 3.6, 3]].map(([x, y, z, w, s], i) => (
        <ToonCard key={`c${i}`} w={600} h={300} width={w} pos={[x + 0.25 * tt * (i % 2 ? -1 : 1), y, z]} center shadow={false} {...v} draw={(p) => fxCloud(p, s)} />
      )) : null}
      {/* stop time: stopwatch, a falling leaf that hangs in the air */}
      {win(t, T.stop - 0.12, T.theres + 0.25) ? (
        <ToonCard w={WATCH_W} h={WATCH_H} width={0.75 * pop(t, T.stop - 0.12)} pos={[-1.05, FLY + 1.5, 0.5]} center {...v}
          draw={(p, l) => drawStopwatch(p, frozen(t) ? 0.13 : (t - T.stop) * 2.5, l)} />
      ) : null}
      {win(t, T.even - 0.4, T.theres + 0.8) ? (
        <ToonCard w={LEAF_W} h={LEAF_H} width={0.3} pos={[1.0 + 0.25 * Math.sin(tf(t) * 2.4), 3.3 - 0.45 * (tf(t) - T.even + 0.4), 1.2]} center
          roll={0.8 * Math.sin(tf(t) * 2.4)} {...v} draw={(p, l) => drawLeaf(p, l)} />
      ) : null}
      {/* the fall: dust where he lands, stars over his head while he lies there */}
      {land > 0 && land < 0.6 ? <ToonCard w={300} h={300} width={1.6} pos={[0, 0, 0.2]} soft {...v} draw={(p) => fxPuff(p, land / 0.6)} /> : null}
      {win(t, tLand() + 0.15, tUp1()) ? <ToonCard w={420} h={210} width={0.75} pos={[-0.62 * Math.cos(Math.atan2(v.camPos[0], v.camPos[2])), 0.62, 0.62 * Math.sin(Math.atan2(v.camPos[0], v.camPos[2]))]} center shadow={false} {...v} draw={(p) => fxStars(p, t * 1.2)} /> : null}
      {win(t, tPlant() + 0.1, tPlant() + 0.6) ? <ToonCard w={300} h={300} width={1.4} pos={[0, 0, 0.2]} soft {...v} draw={(p) => fxPuff(p, (t - tPlant() - 0.1) / 0.5)} /> : null}
      {/* the real brain over his head: "2%", and "just one brain, working all day" */}
      {win(t, T.brain2 - 0.1, T.burns) ? <ToonCard w={BRAIN_W} h={BRAIN_H} width={0.5 * pop(t, T.brain2 - 0.1)} pos={[0, 2.28 + 0.03 * Math.sin(t * 3), 0.05]} center {...v} draw={(p, l) => drawBrain(p, miniState(t), l)} /> : null}
      {win(t, T.just - 0.1, T.follow) ? <ToonCard w={BRAIN_W} h={BRAIN_H} width={0.62 * pop(t, T.just - 0.1)} pos={[0, 2.3 + 0.03 * Math.sin(t * 3), 0.05]} center {...v} draw={(p, l) => drawBrain(p, miniState(t), l)} /> : null}
    </group>
  );
};

// ------------------------------------------------------------------ host
// gesture + face from the toon.ts library; every reaction lands 0-3 frames before its word (skill rule)
const HOST_KEYS = (): HostKey[] => {
  const k: HostKey[] = [
    { t: 0, gesture: "think", expr: "stern" }, // "unlock 100% of your brain": concentrating
    { t: T.brain - 0.08, gesture: "arms_up", expr: "shock" }, // the burst, eyes light up
    { t: T.fly - 0.3, gesture: "arms_up", expr: "grin" }, // "and you could fly"
    { t: T.move - 0.08, gesture: "present", expr: "grin" }, // "move things with your mind"
    { t: T.stop - 0.08, gesture: "point_up", expr: "smile_closed" }, // the snap: "stop time"
    { t: T.theres - 0.08, gesture: "idle", expr: "nervous" }, // "there's just one problem"
    { t: tW() - 0.02, gesture: "idle", expr: "shock" }, // WRONG
    { t: tW() + 0.1, mode: "fall", expr: "shock" },
    { t: tLand(), expr: "dazed" },
    { t: tUp1(), mode: "stand", gesture: "point_up", expr: "pained" }, // "2% of your body weight"
    { t: T.body - 0.08, gesture: "hips", expr: "stern" }, // "your body would never pay that much"
    { t: T.switched - 0.08, gesture: "shrug", expr: "nervous" },
    { t: T.over - 0.08, gesture: "present", expr: "smile" },
    { t: T.turn - 0.08, gesture: "arms_up", expr: "grin" },
  ];
  // "so no flying": flapping on the way up, then the face-plant
  for (let x = tJump(); x < tPlant() - 0.05; x += 0.1) k.push({ t: x, gesture: Math.round((x - tJump()) / 0.1) % 2 ? "shrug" : "arms_up", expr: "stern" });
  k.push({ t: tPlant(), mode: "fall", expr: "dazed" });
  k.push({ t: tUp2(), mode: "stand", gesture: "present", expr: "stern" }); // "no mind powers": pointing at the cow, straining
  k.push({ t: T.powers + 0.35, gesture: "idle", expr: "neutral" }); // the cow just blinks: deadpan
  k.push({ t: T.just - 0.08, gesture: "think", expr: "smile" }); // "just one brain"
  k.push({ t: T.working - 0.08, gesture: "point_up", expr: "grin" }); // "working all day"
  k.push({ t: T.follow - 0.08, gesture: "wave", expr: "grin" });
  return k.sort((a, b) => a.t - b.t);
};

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof shotAt>; keys: HostKey[] }> = ({ t, tex, models, cam, keys }) => {
  const g = gradeAt(t, cam.set);
  const focus = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look));
  const shot = SHOTS[cam.i];
  if (cam.set === "stage") {
    const sun: V3 = [-4, 8, 6];
    const v: CamV = { camPos: cam.pos, camLook: cam.look, sun };
    return (
      <>
        <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
        <color attach="background" args={["#241E44"]} />
        <fogExp2 attach="fog" args={[new THREE.Color("#241E44").getHex(), 0.045]} />
        <hemisphereLight args={[new THREE.Color("#C9C2FF"), new THREE.Color("#3A2E50"), 1.15]} />
        <directionalLight position={sun} intensity={2.1} color="#FFE6D0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
          shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={40} />
        <pointLight position={[2.5, 3.2, -3]} color="#9C7BFF" intensity={14} distance={12} decay={1.6} />
        <Stage t={t} tex={tex} v={v} />
        {shot.host ? <ToonHost keys={keys} t={t} pos={shot.host} camPos={cam.pos} camLook={cam.look} sun={sun} tint="#E4DEFF" flip={shot.flip} /> : null}
        <InkPass p={{ focus, blur: 6, night: g.night, cow: 0, flash: g.flash, redPulse: 0, ink: 1, cold: g.cold, warm: g.warm }} />
      </>
    );
  }
  const sunUp = t > T.follow ? up(t, T.follow + 0.2, 1.4) : 0;
  const sun: V3 = [-30, 34, 40];
  const v: CamV = { camPos: cam.pos, camLook: cam.look, sun };
  const hm = hostMotion(t);
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <fogExp2 attach="fog" args={[new THREE.Color("#D8EAF2").getHex(), 0.012]} />
      <Sky night={0} sunDir={sun} />
      <hemisphereLight args={[new THREE.Color("#DDEBFF"), new THREE.Color("#7FA36A"), 1.2]} />
      <directionalLight position={sun} intensity={1.9 + sunUp * 0.8} color="#FFF0D8" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={120} />
      <Meadow models={models} t={t} v={v} />
      <ToonHost keys={keys} t={t} pos={[0, 0, 0]} camPos={cam.pos} camLook={cam.look} sun={sun} tint={sunUp > 0 ? "#FFF1DC" : "#FFFFFF"} flip={shot.flip}
        lift={hm.lift} roll={hm.roll} hit={hm.hit} glow={hm.glow} blobK={hm.blobK} />
      <InkPass p={{ focus, blur: 7, night: g.night, cow: 0, flash: g.flash, redPulse: 0, ink: 1, cold: g.cold, warm: g.warm, dream: g.dream, freeze: g.freeze }} />
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

const Tag: React.FC<{ x: number; y: number; t: number; t0: number; t1: number; children: React.ReactNode; rot?: number; slam?: boolean }> = ({ x, y, t, t0, t1, children, rot = -6, slam = false }) => {
  if (t < t0 || t > t1) return null;
  const s = slam ? lerp(3.2, 1, ease(clamp01((t - t0) / 0.14))) + 0.06 * Math.sin((t - t0) * 40) * Math.exp(-(t - t0) * 8)
    : spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 9, stiffness: 220 } });
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

// "unlock 100% of your brain": a progress bar that fills from 10% to 100%
const UnlockBar: React.FC<{ t: number }> = ({ t }) => {
  const t0 = 0.08, t1 = T.fly - 0.12;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 12, stiffness: 200 } });
  const out = clamp01((t1 - t) / 0.15);
  const k = 10 + 90 * up(t, 0.35, Math.max(0.5, T.brain - 0.45));
  const done = t > T.brain - 0.06;
  return (
    <div style={{ position: "absolute", left: W / 2, top: 200, transform: `translateX(-50%) rotate(-3deg) scale(${s * out * (done ? 1 + 0.08 * Math.exp(-(t - T.brain) * 8) : 1)})`, transformOrigin: "50% 0%", ...card, width: 800, padding: "16px 30px 26px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: anton, fontSize: 60, color: INK, letterSpacing: 3 }}>
        <span>{done ? "BRAIN UNLOCKED" : "UNLOCKING BRAIN"}</span><span style={{ color: done ? "#E5342F" : "#7B5AC9" }}>{Math.round(k)}%</span>
      </div>
      <div style={{ height: 64, border: `6px solid ${INK}`, borderRadius: 12, background: "#FFFFFF", overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${k}%`, height: "100%", background: done ? "#FFD23F" : "#B79CFF", borderRight: `5px solid ${INK}` }} />
      </div>
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

// "brain scans agree": scanner frame + sweeping line (left to right, the way the regions flare on the 2D brain)
const Scan: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.scans - 0.05, t1 = T.not - 0.05;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 11, stiffness: 240 } });
  const out = clamp01((t1 - t) / 0.15);
  const sweep = clamp01((t - T.scans) / Math.max(0.3, T.not - T.scans));
  const bx = 70, by = 560, bw = 940, bh = 780;
  const c = "#5CFFB0";
  const corner = (x: number, y: number, dx: number, dy: number) => <path d={`M ${x} ${y + dy * 90} L ${x} ${y} L ${x + dx * 90} ${y}`} fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" />;
  const x = lerp(bx + 20, bx + bw - 20, sweep);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out, transform: `scale(${0.9 + 0.1 * s})`, transformOrigin: "50% 50%" }}>
      {corner(bx, by, 1, 1)}{corner(bx + bw, by, -1, 1)}{corner(bx, by + bh, 1, -1)}{corner(bx + bw, by + bh, -1, -1)}
      <rect x={x - 4} y={by + 20} width={8} height={bh - 40} fill={c} opacity={0.9} />
      <rect x={x - 60} y={by + 20} width={56} height={bh - 40} fill={c} opacity={0.15} />
      <text x={W / 2} y={by - 30} textAnchor="middle" fontFamily={anton} fontSize={78} fill="#FFF8EC" stroke={INK} strokeWidth={14} paintOrder="stroke" letterSpacing={6}>BRAIN SCAN</text>
    </svg>
  );
};

// ------------------------------------------------------------------ composition
export const BrainMyth: React.FC<BrainProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const keys = useMemo(() => { T = timesFrom(P.words); SHOTS = buildShots(); return HOST_KEYS(); }, [P.words]);
  const tex = useTextures();
  const models = useModels([], GLB_LIST);
  const cam = shotAt(t);
  const wrongEnd = tUp1() - 0.1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 42, near: 0.05, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} keys={keys} />
        </ThreeCanvas>
      ) : null}
      <UnlockBar t={t} />
      <Tag x={540} y={470} t={t} t0={T.fly - 0.06} t1={T.move - 0.1} rot={-6}><Big size={170} color="#FFD23F">FLY!</Big></Tag>
      <Tag x={540} y={1300} t={t} t0={T.move + 0.1} t1={T.even - 0.1} rot={4}><Big size={116} color="#B7F0FF">TELEKINESIS</Big></Tag>
      <Tag x={540} y={420} t={t} t0={T.stop - 0.04} t1={T.theres - 0.1} rot={-4}><Big size={120} color="#FFD23F">100% UNLOCKED</Big></Tag>
      <Tag x={540} y={900} t={t} t0={tW()} t1={wrongEnd} rot={-9} slam><Stamp size={220}>WRONG!</Stamp></Tag>
      <Tag x={540} y={1090} t={t} t0={T.allof - 0.05} t1={wrongEnd} rot={3}><Big size={100}>ALREADY 100%</Big></Tag>
      <Stats t={t} />
      <Tag x={540} y={440} t={t} t0={T.switched - 0.05} t1={T.evolution - 0.1} rot={5}><Big size={130} color="#CFE6FF">90% OFF?</Big></Tag>
      <Tag x={540} y={440} t={t} t0={T.evolution - 0.05} t1={T.scans - 0.1} rot={-4}><Big size={110} color="#FFD23F">EVOLUTION SAYS</Big></Tag>
      <Tag x={540} y={1330} t={t} t0={T.cut - 0.05} t1={T.scans - 0.1} rot={-7}><Stamp size={120}>CUT IT!</Stamp></Tag>
      <Scan t={t} />
      <Tag x={540} y={430} t={t} t0={T.not} t1={T.over - 0.1} rot={-3}><Big size={110} color="#FFD23F">ONE AT A TIME</Big></Tag>
      <Tag x={430} y={1380} t={t} t0={T.turn - 0.05} t1={T.so - 0.1} rot={-6}><Stamp size={130}>100% USED</Stamp></Tag>
      <Tag x={540} y={520} t={t} t0={T.flying - 0.05} t1={T.powers - 0.12} rot={-7} slam><Stamp size={130}>NO FLYING</Stamp></Tag>
      <Tag x={540} y={560} t={t} t0={T.powers - 0.06} t1={T.just - 0.1} rot={6} slam><Stamp size={110}>NO MIND POWERS</Stamp></Tag>
      <Tag x={540} y={330} t={t} t0={T.brain3 - 0.05} t1={T.follow - 0.1} rot={-4}><Big size={120} color="#FFD23F">ALL OF IT.</Big></Tag>
      <Tag x={540} y={1240} t={t} t0={T.working + 0.15} t1={T.follow - 0.1} rot={4}><Big size={120}>ALL DAY.</Big></Tag>
      {P.captions ? <Karaoke c={P.captions} y={1660} /> : null}
      {P.audio ? <Audio src={staticFile(P.audio)} /> : null}
    </AbsoluteFill>
  );
};
