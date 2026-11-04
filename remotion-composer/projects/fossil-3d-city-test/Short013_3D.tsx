// Fossil Short 013 (2026-11-04): "Could a Human Survive 24 Hours in the Cretaceous?" — first Fossil Short in the toon /
// beast look (projects/fossil-toon-test): 2D cards in a 3D Hell Creek map, beast-style animals (beastAnimals.ts) and
// "you" (youToon.ts: toon.ts person + heavy outline). The viewer is the hero, so the camera stays on "you" and the
// survival clock (top right) counts the day: 24:00 gets struck to 23:30 (days were ~23.5 h, de Winter et al. 2020).
// Story on one map (river along X at z = -6): fall from the sky through clouds -> impact -> first breath -> sun time-lapse
// -> rain + mosquitoes -> river, Triceratops -> ground shakes, T. rex walks in, roars at the frozen you -> night, eyes in
// the ferns, Acheroraptor steps out, sickle claw -> dawn, you on a branch -> an asteroid streaks across the sky.
// Timing: every shot keys off anchor words (ANCHORS) in props.karaoke; without props it runs on EST_WORDS (short013_est.ts).
// Channel overlays (captions, field notes, hook headline, end card, grain, wordmark) come from short008Overlays.
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, CLAMP, Captions, EndCardView, FieldNote, Grain, HookHeadline, Ammonite, PANEL, mono, sans, serif } from "./short008Overlays";
import type { Group, Note, SceneProps } from "./short008Overlays";
import { EST_BEATS, EST_END, EST_WORDS } from "./short013_est";
import { Pen } from "../fossil-toon-test/toon";
import { GROUND } from "../fossil-toon-test/toonAnimals";
import type { AnimalPose } from "../fossil-toon-test/toonAnimals";
import { BEAST } from "../fossil-toon-test/beastAnimals";
import { YouPose, drawYou } from "../fossil-toon-test/youToon";
import { InkPass } from "../fossil-toon-test/Ink";
import { M, Models, useModels } from "../fossil-toon-test/FreeWorld";
import { Sky, V3, clamp01, ease, lerp, lerpV } from "../fossil-toon-test/World";

const W = 1080, H = 1920, ASPECT = W / H, FPS = 30;
const GLB = ["grass_large", "grass_leafsLarge", "lily_large", "log_large", "plant_bushDetailed", "plant_bushLarge", "plant_flatTall", "rock_largeA",
  "rock_largeC", "rock_tallA", "tree_cone_dark", "tree_palmBend", "tree_palmDetailedTall", "tree_palmShort", "tree_palmTall", "tree_pineDefaultA", "tree_pineTallA"];
const up = (t: number, a: number, d = 0.4) => ease((t - a) / d);
const win = (t: number, a: number, b: number) => t >= a && t < b;
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// ------------------------------------------------------------------ timing from words
const ANCHORS: [string, string][] = [["fall", "fall"], ["sky", "sky"], ["montana", "montana"], ["mission", "mission"], ["survive", "survive"], ["hours1", "hours"],
  ["first", "first"], ["breath", "breath"], ["good", "good"], ["air", "air"], ["carbon", "carbon"], ["lungs", "lungs"],
  ["bad", "bad"], ["isnt", "isnt"], ["spun", "spun"], ["half", "half"], ["hours3", "hours"],
  ["jungle", "jungle"], ["wet", "wet"], ["mild", "mild"], ["mosquitoes", "mosquitoes"], ["biting", "biting"],
  ["river", "river"], ["drinking", "drinking"], ["triceratops", "triceratops"], ["horns", "horns"], ["company", "company"],
  ["ground", "ground"], ["shakes", "shakes"], ["rex", "rex"], ["standing", "standing"], ["save", "save"], ["eyes", "eyes"], ["hawk", "hawks"],
  ["night", "night"], ["sleep", "sleep"], ["hunted", "hunted"], ["sickle", "sickle"], ["foot", "foot"],
  ["climb", "climb"], ["quiet", "quiet"], ["sunrise", "sunrise"], ["asteroid", "asteroid"], ["hits", "hits"]];
type Times = Record<string, number>;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function timesFrom(words: { w: string; s: number }[], end: number): Times {
  const out: Times = { end };
  let i = 0;
  for (const [name, w] of ANCHORS) {
    let j = i;
    while (j < words.length && norm(words[j].w) !== w) j++;
    if (j >= words.length) return timesFrom(EST_WORDS, EST_END); // transcript doesn't match: estimate
    out[name] = words[j].s; i = j + 1;
  }
  return out;
}
let T: Times = timesFrom(EST_WORDS, EST_END);
let BEAT: number[] = EST_BEATS;

// ------------------------------------------------------------------ default props (before the voice exists)
const estKaraoke = (): Group[] => { // 3 words per group, never across a beat
  const g: Group[] = [];
  EST_WORDS.forEach((w, i) => {
    const endMs = (EST_WORDS[i + 1]?.s ?? EST_END) * 1000, last = g[g.length - 1];
    const word = { text: w.w, startMs: w.s * 1000, endMs };
    if (last && last.words.length < 3 && EST_WORDS[i - 1].b === w.b) { last.words.push(word); last.endMs = endMs; }
    else g.push({ startMs: word.startMs, endMs, words: [word] });
  });
  return g;
};
const estNote = (word: string, big: string, small: string, dur: number): Note => {
  const w = EST_WORDS.find((x) => norm(x.w).startsWith(word))!;
  return { startFrame: Math.round(w.s * FPS), durationFrames: Math.round(dur * FPS), big, small };
};
export const EST013: SceneProps = {
  fps: FPS, width: W, height: H, totalFrames: Math.round((EST_END + 0.6) * FPS), overlap: 10,
  scenes: EST_BEATS.map((b, i) => ({ beat: i + 1, startFrame: Math.round(b * FPS), durationFrames: Math.round(((EST_BEATS[i + 1] ?? EST_END + 0.6) - b) * FPS), src: "media/3d.jpg", tag: "3D ILLUSTRATION" })),
  notes: [estNote("66", "66 Ma", "Hell Creek, Montana · the last dinosaurs", 2.4), estNote("23", "~23.5 h", "372 days a year · de Winter et al. 2020", 2.6),
    estNote("mild", "~7–12 °C", "yearly average · Hell Creek leaf fossils", 1.6), estNote("mosquitoes", "99 Ma", "oldest mosquito in amber · Borkent & Grimaldi 2004", 2.2),
    estNote("hawks", "55°", "T. rex binocular field · Stevens 2006", 2.4), estNote("acheroraptor", "Acheroraptor", "Hell Creek raptor · Evans et al. 2013", 2.4)],
  endCard: { startFrame: Math.round((EST_END - 1.2) * FPS), durationFrames: Math.round(1.8 * FPS), label: "YOUR PICK  ·  COMMENTS ↓", name: "Which era should we drop you in next?" },
  karaoke: estKaraoke(), narrationSrc: "", musicSrc: "", musicVolume: 0,
  grain: [0, 1, 2, 3].map((i) => `brand/grain_${i}.png`), hookText: "24 HOURS IN THE CRETACEOUS",
};

// ------------------------------------------------------------------ the day: hours on the survival clock, sun, sky
// video time -> hours survived (landing = 0 h at 06:00 local), keyed to the beats
function hoursAt(t: number) {
  const k: [number, number][] = [[T.mission, 0], [BEAT[1], 0.4], [T.spun, 1], [T.half + 0.6, 3.5], [BEAT[3], 4], [BEAT[4], 6], [BEAT[5], 8], [BEAT[6] - 0.6, 12.5],
    [BEAT[6] + 0.4, 15.5], [BEAT[7], 21.5], [T.sunrise, 23.5]];
  if (t <= k[0][0]) return 0;
  for (let i = 0; i + 1 < k.length; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], (t - k[i][0]) / (k[i + 1][0] - k[i][0]));
  return 23.5;
}
function skyAt(t: number) {
  const local = 6.5 + hoursAt(t); // 06:30 at landing, so the sun is back on the horizon at 23:30
  const a = ((local - 6) / 12) * Math.PI; // 0 sunrise .. PI sunset
  let elev = Math.sin(a), az = -1 + (a / Math.PI) * 2;
  let sz = -30;
  if (t > T.spun - 0.2 && t < BEAT[3]) { const k = clamp01((t - T.spun + 0.2) / Math.max(0.8, BEAT[3] - T.spun)); az = lerp(-0.7, 0.7, k); elev = 0.3 + 0.25 * Math.sin(k * Math.PI); sz = -80; }
  const night = clamp01(-elev * 2.2 + 0.05);
  const sun: V3 = [az * 40, Math.max(elev, -0.4) * 40 + 4, sz];
  const dusk = clamp01(1 - Math.abs(elev) * 3);
  return { night, sun, dusk, elev };
}

// ------------------------------------------------------------------ cards
const lightAngle = (sun: THREE.Vector3, cam: THREE.Camera) => {
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  return Math.round(Math.atan2(-sun.dot(upv), sun.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
};
type CamLite = { pos: V3; look: V3 };
const camObj = (c: CamLite) => { const o = new THREE.PerspectiveCamera(); o.position.set(...c.pos); o.lookAt(...c.look); o.updateMatrixWorld(); return o; };
/** a canvas drawn every frame on a camera-facing card (yaw only, or fully facing when `full`), alpha-tested, casting its
 *  silhouette shadow, no world ink */
const Card: React.FC<{ cw: number; ch: number; w: number; h: number; dx: number; dy: number; pos: V3; cam: CamLite; flip?: boolean; full?: boolean; tint?: string;
  paint: (g: CanvasRenderingContext2D) => void }> = (p) => {
  const r = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = p.cw; cv.height = p.ch;
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const geo = new THREE.PlaneGeometry(p.w, p.h); geo.translate(p.dx, p.dy, 0);
    return { g, tex, mat, depth, geo };
  }, [p.cw, p.ch, p.w, p.h, p.dx, p.dy]);
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, p.cw, p.ch);
  p.paint(r.g);
  r.tex.needsUpdate = true;
  r.mat.color.set(p.tint ?? "#ffffff");
  const yaw = Math.atan2(p.cam.pos[0] - p.pos[0], p.cam.pos[2] - p.pos[2]);
  const pitch = p.full ? Math.atan2(p.cam.pos[1] - p.pos[1] - p.dy, Math.hypot(p.cam.pos[0] - p.pos[0], p.cam.pos[2] - p.pos[2])) : 0;
  return (
    <group position={p.pos} rotation={[0, yaw, 0]}>
      <group rotation={[-pitch, 0, 0]}>
        <mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} castShadow scale={[p.flip ? -1 : 1, 1, 1]}
          userData={{ noNormal: true, noInk: true, flatNormal: r.tex }} />
      </group>
    </group>
  );
};
type Beast = keyof typeof BEAST;
const K = 0.75;
const BeastCard: React.FC<{ name: Beast; pose: AnimalPose; pos: V3; heading: number; cam: CamLite; sun: V3; tint?: string }> = ({ name, pose, pos, heading, cam, sun, tint }) => {
  const A = BEAST[name], mpu = A.len / (A.x1 - A.x0);
  const co = camObj(cam), right = new THREE.Vector3().setFromMatrixColumn(co.matrixWorld, 0);
  const flip = Math.cos(heading) * right.x + Math.sin(heading) * right.z < 0;
  let light = lightAngle(new THREE.Vector3(...sun).normalize(), co); if (flip) light = Math.PI - light;
  return <Card cw={1600 * K} ch={1000 * K} w={1600 * mpu} h={1000 * mpu} dx={(800 - (A.x0 + A.x1) / 2) * mpu} dy={(GROUND - 500) * mpu} pos={pos} cam={cam} flip={flip} tint={tint}
    paint={(g) => { g.setTransform(K, 0, 0, K, 0, 0); A.draw(new Pen(g), { ...pose, light }); }} />;
};
const SU = 0.00216, YK = 1.2;
const YouCard: React.FC<{ pose: YouPose; pos: V3; cam: CamLite; sun: V3; full?: boolean; tint?: string }> = ({ pose, pos, cam, sun, full, tint }) => {
  const light = lightAngle(new THREE.Vector3(...sun).normalize(), camObj(cam));
  return <Card cw={600 * YK} ch={1000 * YK} w={600 * SU} h={1000 * SU} dx={0} dy={(975 - 500) * SU} pos={pos} cam={cam} full={full} tint={tint}
    paint={(g) => drawYou(g, YK, { ...pose, light }, 7)} />;
};

// ------------------------------------------------------------------ "you" through the day
const LAND_X = 0, LAND_Z = 4;
function youAt(t: number) {
  const land = T.mission - 0.25;
  const blinkN = Math.floor(t / 1.9), blinkAt = blinkN * 1.9 + 0.6 + ((Math.sin(blinkN * 77.7) + 1) / 2) * 0.9, blink = (t - blinkAt) * 30 >= 0 && (t - blinkAt) * 30 < 4 ? 1 : 0;
  let pos: V3 = [LAND_X, 0, LAND_Z], pose: YouPose = { expr: "neutral", blink }, full = false;
  if (t < land) { // the fall: accelerating from 160 m, a slow tumble sway
    const k = clamp01(t / land);
    pos = [LAND_X + Math.sin(t * 2.1) * 0.6, 160 * (1 - k * k), LAND_Z];
    pose = { mode: "fall", expr: "shock", tilt: Math.sin(t * 3) * 14, blink: 0 }; full = true;
  } else if (t < BEAT[1]) pose = { expr: t < land + 0.7 ? "dazed" : "shock", blink };
  else if (t < BEAT[2]) pose = { expr: t < T.good ? "shock" : "relief", blink };
  else if (t < BEAT[3]) pose = { expr: "whistle", gesture: t > T.spun ? "point_up" : undefined, blink };
  else if (t < BEAT[4]) {
    const slap = t > T.mosquitoes && Math.floor((t - T.mosquitoes) / 0.35) % 2 === 0;
    pose = { expr: t > T.mosquitoes ? "pained" : "nervous", gesture: slap ? "facepalm" : t > T.mosquitoes ? "shrug" : undefined, blink };
  } else if (t < BEAT[5]) {
    const k = up(t, BEAT[4], Math.max(0.5, T.drinking - BEAT[4]));
    pos = [lerp(LAND_X, 1.4, k), 0, lerp(LAND_Z, 1.2, k)];
    pose = t < T.triceratops ? { mode: k < 1 ? "stroll" : "stand", phase: t * 1.6, expr: "neutral", blink } : { gesture: "shrug", expr: "nervous", blink };
    if (t > T.company) pos = [lerp(1.4, 0.6, up(t, T.company, 0.6)), 0, lerp(1.2, 2.2, up(t, T.company, 0.6))];
  } else if (t < BEAT[6]) {
    pos = [0.6, 0, 2.2];
    pose = { expr: t > T.shakes ? "shock" : "nervous", gesture: t > T.standing && t < T.eyes ? "hips" : undefined, blink: t > T.standing ? 0 : blink };
  } else if (t < BEAT[7]) { pos = [-0.9, 0, 1.3]; pose = { expr: t > T.hunted ? "shock" : "nervous", look: -1, blink }; }
  else { pos = [-7.1, 3.25, -0.6]; pose = { mode: "sit", expr: t > T.asteroid ? "shock" : t > T.sunrise - 0.3 ? "grin" : "smile_closed", blink }; }
  return { pos, pose, full };
}

// ------------------------------------------------------------------ shots
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Shot = { t: number; a: (t: number) => Cam; b?: (t: number) => Cam; note: string };
const fixed = (pos: V3, look: V3, fov: number, roll = 0) => () => ({ pos, look, fov, roll });
const REX_X0 = 15, REX_X1 = 7.5, REX_Z = -0.6, TRI: V3 = [7.2, 0, -3.8], RAP0: V3 = [-6.8, 0, -0.8], RAP1: V3 = [-3.8, 0, 0.7];
function buildShots(): Shot[] {
  const land = T.mission - 0.25;
  return [
    { t: 0, note: "the fall: camera rides beside you through the clouds", a: (t) => { const y = youAt(t).pos[1]; return { pos: [LAND_X + 2.2, y + 1.9, LAND_Z + 5.4], look: [LAND_X, y + 1.5, LAND_Z], fov: 50, roll: -6 }; } },
    { t: T.montana - 0.05, note: "from the ground: a speck dropping out of the sky, track it down", a: (t) => { const y = youAt(t).pos[1]; return { pos: [7, 1.2, 18], look: [LAND_X, Math.max(1, y * 0.9), LAND_Z], fov: 46, roll: 2 }; } },
    { t: land - 0.04, note: "impact: low wide, dust, flash, shake", a: fixed([3.4, 0.55, 10.5], [0, 0.9, LAND_Z], 46, -3), b: fixed([3.0, 0.6, 9.4], [0, 1.0, LAND_Z], 46, -2) },
    { t: BEAT[1] - 0.04, note: "first breath: close-up gasp -> relief", a: fixed([0.5, 1.45, 8.4], [0, 1.3, LAND_Z], 30), b: fixed([0.4, 1.45, 7.8], [0, 1.32, LAND_Z], 29) },
    { t: BEAT[2] - 0.04, note: "a day is 23.5 h: low angle, the sun races across the sky", a: fixed([0.6, 1.0, 9.5], [0, 8, -25], 58, 3), b: fixed([0.4, 1.0, 9.0], [0, 9, -25], 58, 4) },
    { t: BEAT[3] - 0.04, note: "wet and mild: drizzle, medium", a: fixed([-1.6, 1.4, 7.6], [0, 1.2, LAND_Z], 40), b: fixed([-1.2, 1.4, 7.0], [0, 1.25, LAND_Z], 40) },
    { t: T.mosquitoes - 0.05, note: "mosquitoes: close-up, slapping", a: fixed([0.5, 1.45, 7.6], [0, 1.3, LAND_Z], 30, 2), b: fixed([0.4, 1.45, 7.1], [0, 1.32, LAND_Z], 29, 3) },
    { t: BEAT[4] - 0.04, note: "the river: over your shoulder toward the water", a: fixed([-2.8, 2.0, 9.4], [4.5, 1.4, -3], 44), b: fixed([-2.2, 1.9, 8.2], [4.5, 1.5, -3], 44) },
    { t: T.triceratops - 0.05, note: "Triceratops looks up: close on its head", a: fixed([2.4, 2.1, 3.4], [4.6, 2.3, -3.8], 38, -3), b: fixed([2.7, 2.1, 2.8], [4.6, 2.35, -3.8], 36, -4) },
    { t: BEAT[5] - 0.04, note: "the ground shakes: low wide, shaking", a: fixed([-3.2, 0.5, 9.5], [5, 2.6, -1], 50, 4), b: fixed([-3.0, 0.5, 9.0], [5, 2.8, -1], 50, 5) },
    { t: T.rex - 0.05, note: "T. rex walks in behind you", a: fixed([-5.0, 1.8, 13.5], [6, 3.0, -1], 46), b: fixed([-4.4, 1.8, 12.5], [5, 3.2, -1], 46) },
    { t: T.save - 0.05, note: "the roar, from under its jaw, you frozen in front", a: fixed([-0.6, 0.55, 6.6], [4.5, 4.6, -0.6], 52, -5), b: fixed([-0.4, 0.55, 6.0], [4.5, 4.9, -0.6], 52, -6) },
    { t: T.eyes - 0.05, note: "its forward-facing eye", a: fixed([1.6, 6.6, 3.6], [3.9, 6.5, REX_Z], 30, 3), b: fixed([1.8, 6.6, 3.0], [3.9, 6.5, REX_Z], 28, 4) },
    { t: BEAT[6] - 0.04, note: "night: you crouched, eyes in the ferns behind", a: fixed([1.6, 1.3, 7.8], [-3.4, 1.0, -0.8], 44), b: fixed([1.3, 1.3, 7.2], [-3.4, 1.0, -0.8], 44) },
    { t: T.hunted - 0.05, note: "Acheroraptor steps out", a: fixed([0.4, 1.0, 6.8], [-4.4, 1.0, -0.2], 42, -3), b: fixed([0.2, 1.0, 6.3], [-4.2, 1.0, 0], 42, -4) },
    { t: T.sickle - 0.05, note: "the sickle claw", a: fixed([-1.6, 0.5, 5.0], [-3.6, 0.45, RAP1[2]], 30, 4), b: fixed([-1.7, 0.5, 4.6], [-3.6, 0.45, RAP1[2]], 29, 5) },
    { t: BEAT[7] - 0.04, note: "dawn: you on a branch", a: fixed([-2.4, 2.4, 8.5], [-7.1, 3.3, -0.8], 44), b: fixed([-3.2, 2.8, 6.8], [-7.1, 3.5, -0.8], 42) },
    { t: T.sunrise - 0.05, note: "sunrise, close on you, the clock fills", a: fixed([-5.6, 3.9, 3.0], [-7.1, 3.75, -0.6], 34), b: fixed([-5.8, 3.9, 2.6], [-7.1, 3.75, -0.6], 32) },
    { t: T.asteroid - 0.05, note: "the asteroid streaks across the sky over your head", a: fixed([-4.6, 2.6, 6.0], [3, 22, -60], 56, -4), b: fixed([-4.4, 2.5, 6.4], [4, 22, -60], 58, -5) },
  ];
}
let SHOTS = buildShots();
function camAt(t: number) {
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : T.end + 1;
  const k = ease(clamp01((t - s.t) / (t1 - s.t))) * 0.5 + clamp01((t - s.t) / (t1 - s.t)) * 0.5;
  const a = s.a(t), b = s.b ? s.b(t) : a;
  const c = { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll ?? 0, b.roll ?? 0, k) };
  // shakes: impact, the rex's footsteps, the roar
  const land = T.mission - 0.25;
  const hit = (at: number, s0: number, d = 6) => (t > at && t < at + 1 ? Math.exp(-(t - at) * d) * s0 : 0);
  let sh = hit(land, 0.18) + hit(T.save, 0.09, 3) + hit(T.hits, 0.12, 4);
  if (t > T.shakes && t < T.rex + 1.6) { const ph = ((t - T.shakes) % 0.62) / 0.62; sh += Math.exp(-ph * 9) * 0.06; }
  c.pos = [c.pos[0] + Math.sin(t * 53) * sh, c.pos[1] + Math.cos(t * 47) * sh, c.pos[2]];
  return { ...c, i };
}

// ------------------------------------------------------------------ world
const CamSet: React.FC<{ c: ReturnType<typeof camAt> }> = ({ c }) => {
  const { camera } = useThree();
  const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = ASPECT; cc.updateProjectionMatrix();
  cc.lookAt(...c.look); cc.rotateZ(THREE.MathUtils.degToRad(c.roll)); cc.updateMatrixWorld();
  return null;
};
const RIVER_Z = -6;
const HellCreek: React.FC<{ models: Models }> = ({ models }) => {
  const m = useMemo(() => ({
    ground: new THREE.MeshToonMaterial({ color: "#76844A" }), bank: new THREE.MeshToonMaterial({ color: "#8A7A56" }),
    water: new THREE.MeshToonMaterial({ color: "#3E6E78" }), hill: [new THREE.MeshToonMaterial({ color: "#5E7240" }), new THREE.MeshToonMaterial({ color: "#7A7A55" })],
    branch: new THREE.MeshToonMaterial({ color: "#5A3E2A" }),
  }), []);
  const r = rng(13);
  const flora = useMemo(() => {
    const out: [string, number, number, number, number][] = [
      ["tree_palmTall", -7.4, -1.6, 10, 0], ["tree_palmTall", 11, -9, 9, 1], ["tree_palmDetailedTall", -14, -12, 10, 2], ["tree_cone_dark", 3, -15, 11, 3],
      ["tree_palmBend", 14, 2, 7, 4], ["tree_pineDefaultA", -16, 0, 8, 5], ["tree_palmShort", 6, 7, 3.5, 6], ["rock_largeC", 10, -2, 2.2, 7], ["rock_tallA", -11, 3, 2.6, 8],
      ["plant_bushLarge", -7.6, -2.4, 1.6, 0], ["plant_bushDetailed", -6.2, -2.8, 1.3, 1], ["plant_bushLarge", -8.8, -1.0, 1.4, 2], // the ferns the raptor comes out of
    ];
    for (let i = 0; i < 40; i++) { const x = -20 + r() * 40, z = -4.5 + r() * 9; if (Math.abs(x) < 5.5 && z > -3) continue; if (Math.hypot(x + 7.2, z + 1) < 2.5) continue; out.push([["plant_flatTall", "grass_leafsLarge", "grass_large"][i % 3], x, z, 0.7 + r() * 0.9, i]); }
    for (let i = 0; i < 9; i++) out.push(["lily_large", -12 + i * 3.2 + r(), RIVER_Z + (r() - 0.5) * 4, 0.9, i]);
    return out;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.ground} receiveShadow><planeGeometry args={[900, 900]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, RIVER_Z]} material={m.bank} receiveShadow><planeGeometry args={[400, 9.5]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, RIVER_Z]} material={m.water} userData={{ noNormal: true }}><planeGeometry args={[400, 7]} /></mesh>
      {flora.map(([n, x, z, h, s], i) => <M key={i} models={models} name={n} size={h} pos={[x, n === "lily_large" ? 0.06 : 0, z]} rot={s * 1.9} />)}
      {/* the branch you sit on at dawn */}
      <mesh material={m.branch} position={[-7.15, 3.18, -0.9]} rotation={[0.25, 0, Math.PI / 2 - 0.12]} castShadow><cylinderGeometry args={[0.11, 0.16, 2.0, 10]} /></mesh>
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3, R = 170 + (i % 3) * 50;
        return <mesh key={`h${i}`} material={m.hill[i % 2]} position={[Math.cos(a) * R, -8, Math.sin(a) * R - 60]} scale={[90, 34 + (i % 3) * 14, 60]}><sphereGeometry args={[1, 32, 16]} /></mesh>; })}
    </group>
  );
};

// small canvas textures: cloud puff, mosquito, glow
function useFxTex() {
  return useMemo(() => {
    const mk = (w: number, h: number, f: (g: CanvasRenderingContext2D) => void) => { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const cloud = mk(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 126); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.6, "rgba(245,240,235,0.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const glow = mk(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    const mosq = mk(128, 128, (g) => {
      g.strokeStyle = "#0E080C"; g.lineWidth = 3; g.lineCap = "round";
      g.fillStyle = "rgba(220,230,240,0.75)"; g.beginPath(); g.ellipse(50, 48, 26, 11, -0.5, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.ellipse(78, 48, 26, 11, 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "#2A1E18"; g.beginPath(); g.ellipse(64, 70, 9, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(64, 50); g.lineTo(64, 28); g.stroke(); // proboscis
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64, 72); g.lineTo(64 + s * 30, 96); g.lineTo(64 + s * 36, 118); g.stroke(); }
    });
    return { cloud, glow, mosq };
  }, []);
}

const Fx: React.FC<{ t: number; you: V3; night: number }> = ({ t, you, night }) => {
  const tex = useFxTex();
  const mats = useMemo(() => ({
    cloud: new THREE.SpriteMaterial({ map: tex.cloud, transparent: true, depthWrite: false, opacity: 0.9 }),
    dust: new THREE.SpriteMaterial({ map: tex.cloud, color: "#B8A27C", transparent: true, depthWrite: false }),
    mosq: new THREE.SpriteMaterial({ map: tex.mosq, transparent: true, depthWrite: false }),
    eye: new THREE.SpriteMaterial({ map: tex.glow, color: "#F2D23A", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    rock: new THREE.SpriteMaterial({ map: tex.glow, color: "#FFF6D8", transparent: true, depthWrite: false, fog: false }),
    trail: new THREE.SpriteMaterial({ map: tex.glow, color: "#E2501E", transparent: true, depthWrite: false, fog: false }),
    rain: new THREE.LineBasicMaterial({ color: "#C8D6E0", transparent: true, opacity: 0.45 }),
  }), [tex]);
  const clouds = useMemo(() => { const r = rng(5); return Array.from({ length: 40 }, () => ({ x: (r() - 0.5) * 26, y: 18 + r() * 140, z: LAND_Z - 8 + r() * 10, s: 6 + r() * 9 })); }, []);
  const rainGeo = useMemo(() => { const r = rng(9), n = 700, a = new Float32Array(n * 6); for (let i = 0; i < n; i++) { const x = -8 + r() * 16, z = -2 + r() * 12, y = r() * 8; a.set([x, y, z, x + 0.03, y - 0.35, z], i * 6); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g; }, []);
  const land = T.mission - 0.25;
  const dustK = t > land ? clamp01((t - land) / 1.6) : -1;
  mats.dust.opacity = dustK >= 0 ? 0.8 * (1 - dustK) : 0;
  const rainOn = win(t, BEAT[3] - 0.2, BEAT[4] + 0.3);
  const mosqOn = win(t, T.mosquitoes - 0.4, BEAT[4]);
  const eyesOn = win(t, BEAT[6], T.hunted + 0.2);
  const astK = clamp01((t - T.asteroid + 0.15) / Math.max(0.6, T.hits - T.asteroid + 0.6));
  return (
    <group>
      {t < land + 0.2 ? clouds.map((c, i) => <sprite key={i} material={mats.cloud} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.6, 1]} userData={{ noNormal: true }} />) : null}
      {dustK >= 0 && dustK < 1 ? Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2, r0 = 0.4 + dustK * 3.2;
        return <sprite key={`d${i}`} material={mats.dust} position={[LAND_X + Math.cos(a) * r0, 0.3 + dustK * 0.8, LAND_Z + Math.sin(a) * r0 * 0.6]} scale={[1.4 + dustK * 2.5, 1 + dustK * 1.6, 1]} userData={{ noNormal: true }} />; }) : null}
      {rainOn ? <lineSegments geometry={rainGeo} material={mats.rain} position={[0, -((t * 9) % 8) + 8, 0]} userData={{ noNormal: true }} /> : null}
      {rainOn ? <lineSegments geometry={rainGeo} material={mats.rain} position={[0, -((t * 9 + 4) % 8), 0]} userData={{ noNormal: true }} /> : null}
      {mosqOn ? Array.from({ length: 14 }, (_, i) => { const a = t * (3 + (i % 4)) + i * 1.7, r0 = 0.35 + (i % 5) * 0.09;
        return <sprite key={`m${i}`} material={mats.mosq} position={[you[0] + Math.cos(a) * r0, you[1] + 1.35 + Math.sin(a * 1.7) * 0.25, you[2] + Math.sin(a) * r0 * 0.6]} scale={[0.09, 0.09, 1]} userData={{ noNormal: true }} />; }) : null}
      {eyesOn ? [[-7.3, 0.95, -1.7], [-7.1, 0.95, -1.7], [-6.2, 0.75, -2.1], [-6.0, 0.75, -2.1]].map((q, i) => { mats.eye.opacity = 0.9 * (0.6 + 0.4 * Math.sin(t * 5 + i)) * night;
        return <sprite key={`e${i}`} material={mats.eye} position={q as V3} scale={[0.12, 0.08, 1]} userData={{ noNormal: true }} />; }) : null}
      {astK > 0 && astK < 1 ? Array.from({ length: 12 }, (_, i) => { const k = astK - i * 0.018; const p = lerpV([-90, 95, -220], [120, 38, -220], k);
        return <sprite key={`a${i}`} material={i ? mats.trail : mats.rock} position={p} scale={[i ? 24 - i * 1.6 : 32, i ? 24 - i * 1.6 : 32, 1]} userData={{ noNormal: true }} />; }) : null}
    </group>
  );
};

const SunDisc: React.FC<{ sun: V3; night: number }> = ({ sun, night }) => {
  const tex = useFxTex();
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: tex.glow, color: "#FFC85A", transparent: true, depthWrite: false, fog: false }), [tex]); // normal blend: additive vanishes on a pale sky
  mat.opacity = 1 - night;
  const d = new THREE.Vector3(...sun).normalize().multiplyScalar(300);
  return <sprite material={mat} position={[d.x, d.y, d.z]} scale={[46, 46, 1]} userData={{ noNormal: true }} />;
};
const World: React.FC<{ t: number; c: ReturnType<typeof camAt>; models: Models }> = ({ t, c, models }) => {
  const sky = skyAt(t);
  const camLite = { pos: c.pos, look: c.look };
  const y = youAt(t);
  const rexOn = t > BEAT[5] - 0.1 && t < BEAT[6];
  const rexX = lerp(REX_X0, REX_X1, ease(clamp01((t - T.rex + 1.4) / Math.max(1, T.standing - T.rex + 1.2))));
  const rexWalk = t < T.standing ? 1 : 0;
  const roar = win(t, T.save - 0.1, T.eyes + 0.3) ? up(t, T.save - 0.1, 0.25) : 0;
  const rapOn = t > T.hunted - 0.6 && t < BEAT[7];
  const rapK = ease(clamp01((t - T.hunted + 0.4) / Math.max(0.6, T.sickle - T.hunted)));
  const rapRoar = t > T.sickle + 0.5 ? up(t, T.sickle + 0.5, 0.2) : 0;
  const triOn = t > BEAT[4] - 0.1 && t < T.save - 0.1; // gone before the roar
  const nightTint = sky.night > 0.3 ? "#C8CCF0" : sky.dusk > 0.5 ? "#FFD6B0" : "#FFFFFF";
  const sunCol = new THREE.Color("#FFF2DC").lerp(new THREE.Color("#FF9A5C"), sky.dusk).lerp(new THREE.Color("#B4C2FF"), sky.night);
  const flashT = (at: number, d = 5) => (t > at ? Math.exp(-(t - at) * d) : 0);
  const land = T.mission - 0.25;
  const flash = Math.min(1, flashT(land, 6) * 0.8 + flashT(T.hits, 3) * 0.9 + (t > T.spun && t < T.half + 0.6 ? 0.06 * Math.abs(Math.sin(t * 20)) : 0));
  const focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  const rain = win(t, BEAT[3] - 0.2, BEAT[4]);
  return (
    <>
      <CamSet c={c} />
      <fogExp2 attach="fog" args={[new THREE.Color(sky.night > 0.3 ? "#1E2440" : rain ? "#9AA4A0" : "#D9CDB0").getHex(), rain ? 0.02 : 0.009]} />
      <Sky night={Math.min(0.9, sky.night + (rain ? 0.25 : 0))} sunDir={sky.sun} />
      <hemisphereLight args={[new THREE.Color(sky.night > 0.3 ? "#8E9AE0" : "#CFE0F0"), new THREE.Color("#5A5236"), 1.15 + 0.15 * (1 - sky.night)]} />
      <directionalLight position={sky.night > 0.5 ? [20, 30, 25] : sky.sun} intensity={1.1 + 1.5 * (1 - sky.night) * (rain ? 0.5 : 1)} color={sunCol} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-camera-far={160} />
      <SunDisc sun={sky.sun} night={sky.night} />
      <HellCreek models={models} />
      {triOn ? <BeastCard name="trike" pos={TRI} heading={Math.PI} cam={camLite} sun={sky.sun} tint={nightTint}
        pose={{ expr: t > T.company ? "angry" : t > T.triceratops ? "neutral" : "sleepy", roar: 0, blink: 0 }} /> : null}
      {rexOn ? <BeastCard name="rex" pos={[rexX, 0, REX_Z]} heading={Math.PI} cam={camLite} sun={sky.sun} tint={nightTint}
        pose={{ walk: rexWalk, phase: t * 0.85, roar, expr: "angry" }} /> : null}
      {rapOn ? <BeastCard name="raptor" pos={lerpV(RAP0, RAP1, rapK)} heading={0} cam={camLite} sun={sky.sun} tint="#C4CAF0"
        pose={{ walk: rapK < 1 ? 1 : 0, phase: t * 1.6, roar: rapRoar, expr: "angry" }} /> : null}
      <YouCard pose={y.pose} pos={y.pos} cam={camLite} sun={sky.sun} full={y.full} tint={nightTint} />
      <Fx t={t} you={y.pos} night={sky.night} />
      <InkPass p={{ focus, blur: c.fov < 36 ? 9 : 4, night: Math.min(0.45, sky.night), cow: 0, flash, redPulse: roar * 0.3 + rapRoar * 0.2, ink: 1, cold: sky.night * 0.4 + (rain ? 0.3 : 0), warm: sky.dusk * 0.45 }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays: survival clock, stamps
const hhmm = (h: number) => { const m = Math.floor(h * 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const Clock: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.mission - 0.2) return null;
  const inK = clamp01((t - T.mission + 0.2) / 0.3);
  const h = hoursAt(t);
  const struck = t > T.half - 0.1;
  const swap = clamp01((t - T.half + 0.1) / 0.3);
  const done = t > T.sunrise - 0.05;
  return (
    <div style={{ position: "absolute", right: 48, top: PANEL.top + 262, opacity: inK, transform: `translateY(${(1 - inK) * -12}px)` }}>
      <div style={{ background: "rgba(17,24,25,0.8)", borderRight: `6px solid ${done ? "#7CD992" : C.ochre}`, padding: "14px 24px 16px", textAlign: "right" }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: 5, color: C.ochreLight }}>{done ? "SURVIVED ✓" : "SURVIVAL CLOCK"}</div>
        <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 86, lineHeight: 1, color: done ? "#BDF2C6" : C.bone, marginTop: 4 }}>{hhmm(h)}</div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 30, color: C.bone, marginTop: 4, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <span style={{ opacity: 0.6 }}>of</span>
          <span style={{ position: "relative", opacity: struck ? 0.5 : 1 }}>24:00{struck ? <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 5, background: "#E8735A", transform: `scaleX(${swap})`, transformOrigin: "0 50%" }} /> : null}</span>
          {struck ? <span style={{ color: C.ochreLight, transform: `scale(${0.6 + 0.4 * swap})` }}>23:30</span> : null}
        </div>
      </div>
    </div>
  );
};
const Stamp: React.FC<{ t: number; at: number; dur: number; text: string; color: string; rot?: number }> = ({ t, at, dur, text, color, rot = -5 }) => {
  if (t < at || t > at + dur) return null;
  const k = clamp01((t - at) / 0.12), out = clamp01((at + dur - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 96, letterSpacing: 4, color, border: `8px solid ${color}`, borderRadius: 14, padding: "4px 30px",
        background: "rgba(17,24,25,0.55)", transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * k})` }}>{text}</div>
    </div>
  );
};

// ------------------------------------------------------------------ composition
export const Short013_3D: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  useMemo(() => {
    const words = p.karaoke.flatMap((g) => g.words.map((w) => ({ w: w.text, s: w.startMs / 1000 })));
    T = words.length ? timesFrom(words, p.totalFrames / p.fps) : timesFrom(EST_WORDS, EST_END);
    BEAT = p.scenes.map((s) => s.startFrame / p.fps);
    SHOTS = buildShots();
  }, [p.karaoke, p.scenes, p.totalFrames, p.fps]);
  const models = useModels([], GLB);
  const c = camAt(t);
  const hookDur = Math.min(p.scenes[1].startFrame, ...p.notes.map((n) => n.startFrame).filter((x) => x > 30)); // end before the first field note
  const markIn = interpolate(f, [BEAT[1] * fps, BEAT[1] * fps + 20], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 44, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <World t={t} c={c} models={models} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.16, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.45) 63%, rgba(10,14,15,0.55) 76%, rgba(10,14,15,0.2) 90%, rgba(10,14,15,0) 100%)" }} />
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D ILLUSTRATION
      </div>
      <Clock t={t} />
      <Stamp t={t} at={T.standing} dur={Math.max(0.8, T.save - T.standing)} text="DON'T MOVE?" color="#E4B56C" rot={-4} />
      <Stamp t={t} at={T.save + 0.05} dur={0.9} text="✗ IT SEES YOU" color="#E8735A" rot={5} />
      {p.notes.map((n, i) => (
        <Sequence key={i} from={n.startFrame} durationInFrames={n.durationFrames}><FieldNote n={n} /></Sequence>
      ))}
      <Sequence from={p.endCard.startFrame} durationInFrames={p.endCard.durationFrames}><EndCardView c={p.endCard} /></Sequence>
      {p.hookText ? <Sequence from={0} durationInFrames={hookDur}><HookHeadline text={p.hookText} dur={hookDur} /></Sequence> : null}
      <Captions groups={p.karaoke} fps={p.fps} />
      <div style={{ position: "absolute", right: 48, top: PANEL.top - 64, display: "flex", alignItems: "center", gap: 12, opacity: markIn }}>
        <Ammonite size={36} />
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 6, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>FOSSIL MYSTERIES</div>
      </div>
      <Grain srcs={p.grain} />
      {p.narrationSrc ? <Audio src={staticFile(p.narrationSrc)} /> : null}
      {p.musicSrc ? <Audio src={staticFile(p.musicSrc)} volume={p.musicVolume} /> : null}
    </AbsoluteFill>
  );
};
