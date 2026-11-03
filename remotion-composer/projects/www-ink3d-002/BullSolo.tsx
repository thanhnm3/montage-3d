// SOLO cut (2026-11-02, user: "no narrator, only the bull; give him eyes and more detail"): same script, voice and
// pen as BullMyth.tsx, but the bull is the actor: cartoon eyes/brows/horns/nose ring on his Head bone, a mood per
// line, snort steam, hoof dust; every host shot re-staged on him.
// Why Why Why — ink-3D 002 "Do bulls hate red?" (2026-11-02): the myth-explainer format (myth -> principle -> test ->
// real reason -> punchline) in the 001 r03 hybrid look: free CC0 world (FreeWorld.tsx) around a dirt bull pen, the
// channel's pose-library host as an overlay with the world's ink contour, a Quaternius cow re-tinted as the bull,
// code-made capes on poles. Cones card + bull vision (Ink cow matrix) carry the principle.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { PoseInfo } from "./PoseScene";
import { InkPass } from "./Ink";
import { FreeFarm, M, Models, place, useModels } from "./FreeWorld";
import { Clouds, Sky, Tex, V3, clamp01, col, ease, lerp, lerpV, toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;

// word times (s) in public/audio/narration.wav (artifacts/whisper_words_r03.json)
export const T: Record<string, number> = {
  angry: 0.88, knows: 1.78, except: 2.9, bull: 3.38, cant: 3.78, see: 4.58, our: 5.46, three: 6.12, cones: 7.28,
  bulls2: 8.12, two: 9.28, so: 9.92, cape: 10.8, dull: 11.44, muddy: 12.06, what: 13.14, charge: 13.7, movement: 15.08,
  myth: 16.04, every: 17.88, then: 19.32, ignored: 19.7, still: 21.1, went: 21.96, moved: 22.64, us: 23.62, stains: 25.14,
  dramatic: 26.62, notred: 27.86, wave: 30.36, end: 31.2,
};

// ------------------------------------------------------------------ the pen
const PEN: V3 = [0, 0, 26];
const PEN_R = 6.0; // portrait frame is narrow: everything stays within ~5 m of the camera axis
// r04 layout (user: "the bull's moves are wrong, they don't match his legs; re-lay it out, the camera has to rush"):
// the three capes stand close together in one shallow arc in front of the barn, cloth flying to +x; the bull lives
// between them and the camera, so every charge is a short smooth curve and the camera can watch from one area.
const WHITE: V3 = [-2.6, 0, 23.6], BLUE: V3 = [-0.3, 0, 22.6], RED: V3 = [1.9, 0, 23.6];
const CLOTH = 0.6; // cloth centre = pole + 0.6 m along x
const cloth = (p: V3): V3 => [p[0] + CLOTH, 0, p[2]];
const HOME: V3 = [0.6, 0, 27.6];

// ------------------------------------------------------------------ bull choreography
// Runs are smooth curves (Catmull-Rom through the points) with a speed profile that starts and ends at rest, so he
// accelerates, charges and brakes instead of jumping between straight legs. The leg clips are phased by the DISTANCE
// he covers, at each clip's own measured ground speed (Cow.fbx at 1.75 m: Run ~2.3 m/s, WalkSlow ~0.72 m/s, from a
// planted hoof's speed), so the hooves stay planted at any pace. Between runs he stands and turns to `face`.
const CLIP_SPEED = { run: 2.3, walkslow: 0.72 };
type Seg = { t0: number; t1: number; pts: [number, number][]; face: number; acc?: number; dec?: number };
const SEGS: Seg[] = [
  // hook: from behind the red cape, through it at us, braking to his spot (HOME) and turning to camera
  { t0: 0.5, t1: 2.85, pts: [[2.7, 19.6], [2.5, 23.6], [1.7, 26.4], [HOME[0], HOME[2]]], face: 0.2, acc: 0.3, dec: 0.3 },
  // the test: white, blue, red one after another, then a wide brake back toward the middle
  { t0: T.movement, t1: 19.75, pts: [[HOME[0], HOME[2]], [-0.9, 26.2], [-2.0, 23.6], [-1.4, 21.4], [0.3, 22.6], [1.3, 21.3], [2.5, 23.6], [3.4, 25.4], [2.0, 26.9], [0.0, 26.4]],
    face: 2.2, acc: 0.12, dec: 0.18 },
  // "ignored a red target standing still": a slow walk right up to the still red cape
  { t0: 19.85, t1: 21.85, pts: [[0.0, 26.4], [0.7, 25.9], [1.4, 25.3]], face: 2.6, acc: 0.25, dec: 0.3 },
  // "went for whatever moved": turns, charges the waving white cape and stops with his nose in it
  { t0: T.went - 0.05, t1: 23.35, pts: [[1.4, 25.3], [0.6, 26.1], [-0.9, 26.2], [-2.0, 25.2]], face: 0.3, acc: 0.3, dec: 0.35 },
  // the wave: from the white cape across to the waving red one, through it and away
  { t0: 29.2, t1: 30.9, pts: [[-2.0, 25.2], [-0.6, 24.6], [1.2, 24.0], [2.5, 23.6], [4.0, 22.8]], face: 2.0, acc: 0.3, dec: 0.05 },
];
const START_FACE = 0.0;
const curves = SEGS.map((s) => {
  const c = new THREE.CatmullRomCurve3(s.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
  return { c, len: c.getLength() };
});
// fraction of the path covered at fraction x of the time: accelerate over `a`, cruise, brake over `d`
function travel(x: number, a: number, d: number) {
  const V = 1 / (1 - a / 2 - d / 2);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x < a) return (V * x * x) / (2 * a);
  if (x < 1 - d) return V * (a / 2 + (x - a));
  return 1 - (V * (1 - x) * (1 - x)) / (2 * d);
}
const angLerp = (a: number, b: number, x: number) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * x; };
const headingOf = (i: number, u: number) => { const tg = curves[i].c.getTangentAt(Math.min(0.999, Math.max(0.001, u))); return Math.atan2(tg.x, tg.z); };
// distance covered before each segment (drives the leg phase across the whole film)
const DIST0 = curves.reduce((acc, c, i) => { acc.push((acc[i - 1] ?? 0) + (i ? curves[i - 1].len : 0)); return acc; }, [] as number[]);

function bullAt(t: number) {
  let i = -1;
  for (let k = 0; k < SEGS.length; k++) if (SEGS[k].t0 <= t) i = k;
  if (i < 0) return { pos: [SEGS[0].pts[0][0], 0, SEGS[0].pts[0][1]] as V3, face: START_FACE, clip: "idle" as const, v: 0, dist: 0 };
  const s = SEGS[i], cv = curves[i], a = s.acc ?? 0.25, d = s.dec ?? 0.25;
  const dur = s.t1 - s.t0;
  const x = (t - s.t0) / dur;
  if (x >= 1) {
    // standing: turn from the arrival heading to his `face` over 0.6 s
    const p = cv.c.getPointAt(1);
    return { pos: [p.x, 0, p.z] as V3, face: angLerp(headingOf(i, 1), s.face, ease(clamp01((t - s.t1) / 0.6))), clip: "idle" as const, v: 0, dist: DIST0[i] + cv.len };
  }
  const u = travel(x, a, d);
  const p = cv.c.getPointAt(u);
  const v = ((travel(x + 0.002, a, d) - travel(x - 0.002, a, d)) / 0.004) * cv.len / dur;
  // leaving a stand: blend from the standing heading into the path over the first 0.3 s
  const prevFace = i > 0 ? SEGS[i - 1].face : START_FACE;
  const face = angLerp(prevFace, headingOf(i, u), ease(clamp01((t - s.t0) / 0.3)));
  const clip = v > 1.3 ? ("run" as const) : v > 0.05 ? ("walkslow" as const) : ("idle" as const);
  return { pos: [p.x, 0, p.z] as V3, face, clip, v, dist: DIST0[i] + u * cv.len };
}
// when the bull passes nearest a point during a segment (for tags, flags, flashes, SFX)
function passTime(seg: number, p: V3) {
  let best = SEGS[seg].t0, bd = 1e9;
  for (let t = SEGS[seg].t0; t <= SEGS[seg].t1; t += 0.01) {
    const b = bullAt(t).pos, dd = Math.hypot(b[0] - p[0], b[2] - p[2]);
    if (dd < bd) { bd = dd; best = t; }
  }
  return best;
}
export const PASS = { hookRed: passTime(0, cloth(RED)), white: passTime(1, cloth(WHITE)), blue: passTime(1, cloth(BLUE)), red: passTime(1, cloth(RED)),
  waveRed: passTime(4, cloth(RED)) };

// cape waving strength per station (0 still .. 1 full flap)
const on = (t: number, a: number, b: number, k = 0.25) => clamp01((t - a) / k) * (1 - clamp01((t - b) / k));
const waveOf = (name: "red" | "blue" | "white", t: number) => {
  if (name === "red") return Math.max(on(t, 0, PASS.hookRed + 0.6), on(t, 9.9, 13.0, 0.4) * 0.6, on(t, PASS.blue, PASS.red + 0.5), on(t, T.us, 27.6, 0.4) * 0.5, on(t, 29.0, 40));
  if (name === "blue") return on(t, PASS.white, PASS.blue + 0.5);
  return Math.max(on(t, T.movement - 0.2, PASS.white + 0.5), on(t, T.went - 0.5, 23.6));
};
// blue and white only exist from the test on
const showOf = (name: string, t: number) => (name === "red" ? 1 : ease(clamp01((t - (T.movement - 0.5)) / 0.35)));

// mood per line: brow (+ angry, inner ends down; - raised/worried), lid (1 open .. 0 shut), gaze gx/gy (-1..1),
// rage 0..1 (user r02: "the video is about an angry bull and I can't see the anger"): head down, deep V brows,
// bloodshot eyes, small pupils, bigger/faster steam, pawing + trembling while he stands, an anger mark over his head
type Mood = { brow: number; lid: number; gx: number; gy: number; steam?: boolean; rage?: number };
const MOODS: [number, Mood][] = [
  [0, { brow: 1, lid: 0.7, gx: 0, gy: 0.15, steam: true, rage: 1 }], // glaring at the cape, then charging
  [T.except - 0.1, { brow: -0.4, lid: 1.1, gx: 0, gy: 0.1 }], // "except the bull": huh?
  [T.cant, { brow: -0.1, lid: 0.55, gx: -0.3, gy: 0 }], // deadpan: can't even see red
  [T.three, { brow: -0.3, lid: 1, gx: 0, gy: 0.9 }], // looks up at the card
  [T.bulls2, { brow: 0, lid: 0.95, gx: 0, gy: 0 }], // into the lens
  [T.so, { brow: -0.05, lid: 0.6, gx: -0.8, gy: 0 }], // side-eye at the cape
  [T.what, { brow: -0.3, lid: 1, gx: -0.8, gy: 0.2 }], // looking around
  [T.what + 0.6, { brow: -0.3, lid: 1, gx: 0.8, gy: 0.2 }],
  [T.charge + 0.3, { brow: 1, lid: 0.68, gx: 0, gy: 0.15, steam: true, rage: 1 }], // winding up
  [T.then, { brow: -0.1, lid: 0.45, gx: 0.9, gy: 0 }], // bored, ignores the still cape
  [T.went - 0.15, { brow: -0.5, lid: 1.15, gx: 0, gy: 0 }], // something moved!
  [T.went + 0.25, { brow: 1, lid: 0.7, gx: 0, gy: 0, steam: true, rage: 1 }],
  [T.us, { brow: -0.05, lid: 0.55, gx: -0.4, gy: 0.6 }], // eye roll: "it's for you"
  [T.dramatic, { brow: 0.3, lid: 0.9, gx: 0, gy: 0 }], // hero
  [T.notred, { brow: -0.1, lid: 0.5, gx: 0, gy: 0 }], // deadpan into the lens
  [28.75, { brow: 1, lid: 0.68, gx: 0, gy: 0.15, steam: true, rage: 1 }], // sees the wave, winds up, charges
];
function moodAt(t: number): Mood {
  let i = 0;
  while (i + 1 < MOODS.length && MOODS[i + 1][0] <= t) i++;
  const [t0, b] = MOODS[i];
  const a = i > 0 ? MOODS[i - 1][1] : b;
  const x = ease(clamp01((t - t0) / 0.18));
  const ph = (t + 0.9) % 2.7; // a blink every 2.7 s
  const blink = ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0;
  // rage eases in/out slower than the face so the head drop reads as a move, not a pop
  const xr = ease(clamp01((t - t0) / 0.35));
  return { brow: lerp(a.brow, b.brow, x), lid: lerp(a.lid, b.lid, x) * (1 - 0.92 * blink), gx: lerp(a.gx, b.gx, x), gy: lerp(a.gy, b.gy, x), steam: b.steam,
    rage: lerp(a.rage ?? 0, b.rage ?? 0, xr) };
}
// pawing: while he stands raging, a front-hoof scrape every 0.6 s (body dips, dust kicks back)
const PAW = 0.6;
const pawAt = (t: number) => {
  const r = moodAt(t).rage ?? 0;
  if (r < 0.5 || bullAt(t).clip !== "idle") return -1;
  return (t % PAW) / PAW; // 0..1 phase
};
const steamStart = (t: number) => {
  let best = -1;
  for (const [t0, m] of MOODS) if (t0 <= t) best = m.steam ? t0 : -1;
  return best;
};

// Features are authored in the placed model's frame (metres, feet at y 0, head toward +z; Cow.fbx Head bone at
// [0, 1.60, 0.99], forehead front ~z 1.25-1.3 at eye height, muzzle tip ~[0, 1.25, 1.56]) and re-parented onto the
// Head bone, so they ride every head move of the clips.
const EYE: V3 = [0.15, 1.56, 1.27];
function buildFace(g: THREE.Group) {
  const head = g.getObjectByName("Head") as THREE.Bone;
  g.updateMatrixWorld(true);
  const F = new THREE.Group();
  F.matrixAutoUpdate = false;
  F.matrix.copy(head.matrixWorld).invert(); // placed frame -> bone local
  head.add(F);
  const mat = (c: string) => toon({ color: new THREE.Color(c) });
  const white = mat("#FFF8EC"), pupilM = mat("#140E0C"), coat = mat("#4A2A1E"), browM = mat("#140E0C");
  const horn = mat("#F0E4C6"), hornTip = mat("#6B5440"), gold = mat("#E3B23C");
  const shine = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const eyes: { lid: THREE.Group; pupil: THREE.Group; brow: THREE.Mesh; side: number }[] = [];
  for (const side of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(side * EYE[0], EYE[1], EYE[2]);
    e.lookAt(side * EYE[0] + side * 0.6, EYE[1] + 0.12, EYE[2] + 1); // facing out-forward, a touch up
    const lid = new THREE.Group();
    const w = new THREE.Mesh(sph, white); w.scale.set(0.078, 0.084, 0.045); lid.add(w);
    const pupil = new THREE.Group(); pupil.position.z = 0.036; lid.add(pupil);
    const p = new THREE.Mesh(sph, pupilM); p.scale.set(0.034, 0.039, 0.014); pupil.add(p);
    const h = new THREE.Mesh(sph, shine); h.scale.setScalar(0.011); h.position.set(0.013, 0.017, 0.012); pupil.add(h);
    e.add(lid);
    const ridge = new THREE.Mesh(sph, coat); ridge.scale.set(0.09, 0.045, 0.05); ridge.position.set(0, 0.078, -0.006); e.add(ridge);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.026, 0.03), browM); brow.position.set(0, 0.1, 0.03); e.add(brow);
    F.add(e);
    eyes.push({ lid, pupil, brow, side });
    // horn: thick base out to the side, then a cone curving up, dark tip
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.052, 0.22, 10), horn);
    hb.position.set(side * 0.21, 1.71, 1.08); hb.rotation.set(0, 0, -side * 1.2); F.add(hb);
    const ht = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.22, 10), horn);
    ht.position.set(side * 0.35, 1.83, 1.08); ht.rotation.set(0, 0, -side * 0.35); F.add(ht);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.06, 8), hornTip);
    tip.position.set(side * 0.385, 1.93, 1.08); tip.rotation.set(0, 0, -side * 0.35); F.add(tip);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 10, 28), gold);
  ring.position.set(0, 1.2, 1.57); ring.rotation.set(0.25, 0, 0); F.add(ring);
  // snort puffs: two per nostril, reused every snort
  const puffM = Array.from({ length: 4 }, () => new THREE.MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0, depthWrite: false }));
  const puffs = puffM.map((m) => { const q = new THREE.Mesh(sph, m); q.userData.noNormal = true; F.add(q); return q; });
  return { eyes, puffs, puffM, white, head };
}
const EYE_WHITE = new THREE.Color("#FFF8EC"), EYE_BLOOD = new THREE.Color("#FF8A78");

const Bull: React.FC<{ models: Models; t: number }> = ({ models, t }) => {
  const inst = useMemo(() => {
    // the Quaternius cow as a bull: dark coat, and the pink (udder, muzzle) painted over in the coat colour
    const g = place(models.Cow, 1.75, "y", { colors: { White: "#5A3526", Black: "#1A1210", Pink: "#5A3526" } });
    const face = buildFace(g);
    const mixer = new THREE.AnimationMixer(g.children[0]);
    const clip = (n: string) => models.Cow.clips.find((c) => c.name.toLowerCase().endsWith(`|${n}`)) ?? models.Cow.clips[0];
    const acts = { idle: mixer.clipAction(clip("idle")), run: mixer.clipAction(clip("run")), walkslow: mixer.clipAction(clip("walkslow")) };
    Object.values(acts).forEach((a) => a.play());
    return { g, mixer, acts, face };
  }, [models]);
  const s = bullAt(t);
  const face = s.face;
  // gait from ground speed: walk -> run cross-fade, each clip phased by distance covered (hooves stay planted)
  const run = clamp01((s.v - 0.9) / 0.8), walk = (1 - run) * clamp01(s.v / 0.25);
  const w = { run, walkslow: walk, idle: 1 - run - walk };
  for (const [n, a] of Object.entries(inst.acts)) {
    const k = n as keyof typeof w;
    a.setEffectiveWeight(w[k]);
    const dur = a.getClip().duration;
    a.time = k === "idle" ? t % dur : ((s.dist / CLIP_SPEED[k]) % dur + dur) % dur;
  }
  inst.mixer.update(0);
  const m = moodAt(t);
  const rage = m.rage ?? 0;
  const paw = pawAt(t);
  // head down, horns forward: an extra pitch on the Head bone about the bull's own side axis (in the bone's parent space)
  inst.g.rotation.set(0, face, 0);
  inst.g.updateMatrixWorld(true);
  const hd = inst.face.head;
  const pq = hd.parent!.getWorldQuaternion(new THREE.Quaternion());
  const side = new THREE.Vector3(1, 0, 0).applyQuaternion(inst.g.getWorldQuaternion(new THREE.Quaternion())).applyQuaternion(pq.invert());
  const nod = paw >= 0 ? Math.sin(paw * Math.PI) * 0.08 : 0; // head bobs with each scrape
  hd.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(side, rage * 0.2 + nod));
  inst.face.white.color.copy(EYE_WHITE).lerp(EYE_BLOOD, rage * 0.75);
  for (const e of inst.face.eyes) {
    e.lid.scale.set(1, Math.max(0.06, Math.min(1.2, m.lid)), 1);
    e.pupil.position.set(m.gx * 0.032, m.gy * 0.03, 0.036);
    e.pupil.scale.setScalar(1 - rage * 0.35); // pinpoint pupils
    e.brow.rotation.z = e.side * m.brow * (0.6 + rage * 0.25);
    e.brow.position.y = 0.1 + (m.brow < 0 ? -m.brow * 0.03 : -m.brow * (0.012 + rage * 0.02));
  }
  // snort steam: forward and down out of the nostrils, a pair every 0.9 s (0.55 s and bigger when raging)
  const t0 = steamStart(t);
  const per = 0.9 - rage * 0.35, big = 1 + rage * 0.4;
  inst.face.puffs.forEach((q, i) => {
    const sd = i % 2 ? 1 : -1;
    const age = t0 >= 0 ? (t - t0 - (i >> 1) * 0.12) % per : -1;
    const k = age >= 0 && age < 0.5 ? age / 0.5 : -1;
    q.visible = k >= 0;
    inst.face.puffM[i].opacity = k < 0 ? 0 : 0.7 * (1 - k);
    q.position.set(sd * (0.05 + k * 0.1 * big), 1.21 - k * 0.16, 1.6 + k * 0.32 * big);
    q.scale.setScalar((0.03 + k * 0.085) * big);
  });
  // trembling with rage while he stands; a dip on each scrape
  const still = s.clip === "idle";
  const shake = still ? rage * 0.012 : 0;
  const pos: V3 = [s.pos[0] + Math.sin(t * 53) * shake, s.pos[1] - (paw >= 0 ? Math.sin(paw * Math.PI) * 0.04 : 0), s.pos[2] + Math.cos(t * 47) * shake];
  return <primitive object={inst.g} position={pos} rotation={[0, face, 0]} />;
};

// hoof dust: a puff every 0.07 s while running, rising and fading over 0.8 s (built from the path, so deterministic)
const Dust: React.FC<{ t: number }> = ({ t }) => {
  const mats = useMemo(() => Array.from({ length: 12 }, () => new THREE.MeshBasicMaterial({ color: "#D9BF98", transparent: true, opacity: 0, depthWrite: false })), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);
  const kick = useMemo(() => Array.from({ length: 6 }, () => new THREE.MeshBasicMaterial({ color: "#C9A57A", transparent: true, opacity: 0, depthWrite: false })), []);
  return (
    <group>
      {mats.map((mat, i) => {
        const ts = Math.floor(t / 0.07) * 0.07 - i * 0.07;
        const age = t - ts;
        const b = bullAt(ts);
        if (b.clip !== "run" || age > 0.8 || ts < 0) return null;
        const r = Math.sin(ts * 91.7) * 0.5, r2 = Math.cos(ts * 57.3) * 0.5;
        mat.opacity = 0.55 * (1 - age / 0.8);
        return (
          <mesh key={i} geometry={geo} material={mat} userData={{ noNormal: true }} scale={0.12 + age * 0.45}
            position={[b.pos[0] + r * 0.8 - Math.sin(b.face) * 0.9, 0.1 + age * 0.35, b.pos[2] + r2 * 0.8 - Math.cos(b.face) * 0.9]} />
        );
      })}
      {/* pawing: each scrape of the right front hoof flings a spray of dirt backwards */}
      {kick.map((mat, i) => {
        const tk = Math.floor(t / PAW) * PAW - (i >> 1) * PAW; // this scrape and the last two
        const age = t - tk - 0.12;
        if (age < 0 || age > 0.9 || pawAt(tk + 0.01) < 0) return null;
        const b = bullAt(tk);
        const sn = Math.sin(b.face), cs = Math.cos(b.face);
        const sp = i % 2 ? 0.25 : -0.15; // two clods per scrape, a little apart
        const lx = 0.28 + sp, lz = 0.75 - age * 1.4; // placed frame: right front hoof, thrown back
        mat.opacity = 0.7 * (1 - age / 0.9);
        return (
          <mesh key={`k${i}`} geometry={geo} material={mat} userData={{ noNormal: true }} scale={0.1 + age * 0.35}
            position={[b.pos[0] + lx * cs + lz * sn, 0.08 + Math.sin(Math.min(1, age / 0.5) * Math.PI) * 0.35 + age * 0.15, b.pos[2] - lx * sn + lz * cs]} />
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ cape on a pole
const Cape: React.FC<{ pos: V3; color: string; wave: number; t: number; show: number; seed: number }> = ({ pos, color, wave, t, show, seed }) => {
  const r = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.15, 0.85, 18, 12);
    const base = Float32Array.from(geo.attributes.position.array as Float32Array);
    return {
      geo, base,
      cloth: toon({ color: new THREE.Color(color), side: THREE.DoubleSide }),
      wood: toon({ color: new THREE.Color("#7A5236") }),
    };
  }, [color]);
  const p = r.geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = r.base[i * 3], y = r.base[i * 3 + 1];
    const u = (x + 0.575) / 1.15; // 0 at the pole .. 1 free end
    const sag = (1 - wave) * u * u * 0.18;
    const z = wave * u * (0.22 * Math.sin(u * 5.5 - t * 9 + seed) + 0.08 * Math.sin(y * 6 + t * 13 + seed));
    p.setXYZ(i, x - sag * 0.4, y - sag, z);
  }
  p.needsUpdate = true;
  r.geo.computeVertexNormals();
  if (show <= 0.001) return null;
  return (
    <group position={pos} scale={show}>
      <mesh material={r.wood} castShadow position={[0, 0.95, 0]}><cylinderGeometry args={[0.045, 0.055, 1.9, 10]} /></mesh>
      <mesh material={r.wood} castShadow position={[0.6, 1.82, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 1.25, 8]} /></mesh>
      <mesh geometry={r.geo} material={r.cloth} castShadow position={[0.64, 1.38, 0.02]} />
    </group>
  );
};

const Pen: React.FC<{ models: Models }> = ({ models }) => {
  const dirt = useMemo(() => toon({ color: new THREE.Color("#B8936E") }), []);
  const n = 16;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PEN[0], 0.03, PEN[2]]} material={dirt} receiveShadow><circleGeometry args={[PEN_R + 0.4, 64]} /></mesh>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <M key={i} models={models} name="Fence" size={2 * Math.PI * PEN_R / n + 0.05} axis="x"
          pos={[PEN[0] + Math.sin(a) * PEN_R, 0, PEN[2] + Math.cos(a) * PEN_R]} rot={a + Math.PI / 2} />;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ camera
// roll = dutch angle (deg); aim = look at the bull (pos fixed); follow = pos is the bull + offset (a tracking shot).
// The bull target is smoothed over `lag` s so a tracking camera eases into his turns instead of snapping.
type CamKey = { t: number; pos?: V3; look?: V3; fov: number; glide?: number; cut?: boolean; push?: number; focus?: number; blur?: number;
  roll?: number; aim?: boolean; follow?: V3; lag?: number };
// r02 (user: "the camera isn't continuous, the viewer's eye keeps jumping"): ONE unbroken camera, no cuts.
// r04 (user: "this layout makes the camera rush"): with the capes and the bull in one small area the camera lives in
// one zone too (x -1..2.5, z 28..32, inside the fence) and mostly pans, zooms and drifts; glides are 0.8-1.5 s.
const K: CamKey[] = [
  // hook: long lens on him glaring behind the red cape, widening as he charges through it toward us
  { t: 0, pos: [-0.6, 1.05, 31.0], look: [2.7, 1.25, 20.9], fov: 15, roll: -3 }, // left of the cape's line, so he shows beside it
  { t: 0.6, pos: [0.2, 0.95, 31.0], aim: true, lag: 0.2, fov: 46, glide: 2.0, roll: -5 },
  // "everyone except the bull": drift into his face (huh?)
  { t: T.except - 0.3, pos: [1.35, 1.5, 30.6], look: [0.89, 1.5, 29.02], fov: 40, glide: 1.0, push: 0.008, roll: 3 },
  // principle: ease back to show the red cape behind him; zoom in; back to his eye; pan across to the cape
  { t: T.cant, pos: [2.3, 1.25, 31.8], look: [1.0, 1.2, 25.4], fov: 44, glide: 1.3, push: 0.008, roll: -2 },
  { t: T.three - 0.05, pos: [2.3, 1.25, 31.8], look: [1.0, 1.4, 27.8], fov: 34, glide: 0.8, push: 0.006, roll: -2 },
  { t: T.bulls2 - 0.4, pos: [1.3, 1.58, 30.3], look: [0.9, 1.5, 29.05], fov: 38, glide: 1.2, push: 0.006, roll: 3 },
  { t: T.so - 0.2, pos: [1.5, 1.45, 30.6], look: [2.5, 1.35, 23.6], fov: 36, glide: 1.1, push: 0.008 },
  // the question: rise a little and widen, then sink back to him as he winds up
  { t: T.what - 0.3, pos: [1.1, 2.6, 31.8], look: [0.6, 0.9, 25.8], fov: 50, glide: 1.4, push: 0.004 },
  { t: T.charge + 0.1, pos: [1.8, 1.3, 31.2], look: [0.89, 1.4, 29.0], fov: 42, glide: 1.4, push: 0.004, roll: -3 },
  // the test: one vantage that rises slowly and swings after him around the three capes
  { t: T.movement - 0.1, pos: [1.2, 1.6, 31.4], aim: true, lag: 0.4, fov: 54, glide: 1.0 },
  { t: 17.0, pos: [0.4, 2.8, 31.6], aim: true, lag: 0.45, fov: 56, glide: 2.0 },
  // the still red cape: sink low on the right as he walks up to it and ignores it, then swing after him to the white one
  { t: T.then + 0.2, pos: [2.4, 1.2, 31.4], aim: true, lag: 0.4, fov: 54, glide: 1.6, roll: -4 },
  // the real reason: drift in to his eye roll at the white cape; pan across to the red one; low hero; deadpan
  { t: T.us - 0.4, pos: [-1.0, 1.5, 28.2], look: [-1.57, 1.5, 26.6], fov: 44, glide: 1.4, push: 0.006, roll: -3 },
  { t: T.stains - 0.55, pos: [-1.0, 1.5, 28.2], look: [2.5, 1.35, 23.6], fov: 36, glide: 0.7, push: 0.006 },
  { t: T.dramatic - 0.35, pos: [-0.7, 0.4, 28.4], look: [-1.57, 1.55, 26.6], fov: 50, glide: 0.9, push: 0.006, roll: -7 },
  { t: T.notred - 0.3, pos: [-1.05, 1.5, 28.1], look: [-1.57, 1.5, 26.6], fov: 44, glide: 0.9, push: 0.008, roll: 3 },
  // the wave: ease back and swing after him as he charges the waving red cape
  { t: 28.6, pos: [0.2, 1.1, 30.0], aim: true, lag: 0.25, fov: 54, glide: 1.3, roll: 5 },
];
const bullTarget = (t: number, lag: number): V3 => {
  const n = Math.max(1, Math.round(lag / 0.04));
  const acc = [0, 0, 0];
  for (let i = 0; i < n; i++) { const p = bullAt(t - i * 0.04).pos; acc[0] += p[0]; acc[2] += p[2]; }
  return [acc[0] / n, 0.85, acc[2] / n];
};
function keyState(k: CamKey, t: number) {
  const tg = bullTarget(t, k.lag ?? 0.2);
  const base: V3 = k.follow ? [tg[0] + k.follow[0], k.follow[1], tg[2] + k.follow[2]] : k.pos!;
  const look: V3 = k.aim || k.follow ? tg : k.look!;
  const e = Math.max(0, t - k.t) * (k.push ?? 0);
  return { pos: lerpV(base, look, Math.min(0.5, e)), look, fov: k.fov, focus: k.focus, blur: k.blur, roll: k.roll ?? 0 };
}
// a glide blends from wherever the camera was (the previous key's own, possibly still gliding, state), so overlapping
// moves chain into one continuous path instead of jumping
function stateAt(i: number, t: number): ReturnType<typeof keyState> {
  const k = K[i];
  let s = keyState(k, t);
  const g = k.glide ?? 0;
  if (i > 0 && !k.cut && g > 0 && t - k.t < g) {
    const a = stateAt(i - 1, t);
    const x = ease((t - k.t) / g);
    const da = new THREE.Vector3(...a.look).sub(new THREE.Vector3(...a.pos)).normalize();
    const db = new THREE.Vector3(...s.look).sub(new THREE.Vector3(...s.pos)).normalize();
    const pos = lerpV(a.pos, s.pos, x);
    const dir = da.lerp(db, x).normalize();
    const dist = lerp(new THREE.Vector3(...a.look).distanceTo(new THREE.Vector3(...a.pos)), new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos)), x);
    s = { pos, look: [pos[0] + dir.x * dist, pos[1] + dir.y * dist, pos[2] + dir.z * dist], fov: lerp(a.fov, s.fov, x), focus: s.focus, blur: s.blur, roll: lerp(a.roll, s.roll, x) };
  }
  return s;
}
function camAt(t: number) {
  let i = 0;
  while (i + 1 < K.length && K[i + 1].t <= t) i++;
  const s = stateAt(i, t);
  // drift + a thump when the bull thunders past the camera at the end
  const sh = t > PASS.waveRed ? Math.exp(-(t - PASS.waveRed) * 3) * 0.04 : 0;
  const pos: V3 = [s.pos[0] + Math.sin(t * 0.7) * 0.025 + Math.sin(t * 37) * sh, s.pos[1] + Math.sin(t * 0.9 + 1) * 0.018 + Math.cos(t * 41) * sh, s.pos[2]];
  return { ...s, pos };
}

const SHADOW_POSES: string[] = [];

// ------------------------------------------------------------------ props from build.py
type Cue = { start: number; end: number; value: string };
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number };
export type BullProps = {
  durationInFrames: number; audio: string; cues: Cue[]; captions: Captions;
  poses: { dir: string; items: Record<string, PoseInfo> }; face: { dir: string; sizes: Record<string, [number, number]>; pad: number };
};

function useTextures(poseDir: string) {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    const load = (url: string) => new Promise<THREE.Texture>((res, rej) => L.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej));
    Promise.all([
      load(staticFile("tex/cloud.png")).then((t) => ["cloud", t] as const),
      ...SHADOW_POSES.map((n) => load(staticFile(`${poseDir}/${n}.png`)).then((t) => [`pose_${n}`, t] as const)),
    ]).then((all) => setTex(Object.fromEntries(all)));
  }, [poseDir]);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}

const CamSet: React.FC<{ pos: V3; look: V3; fov: number; roll: number }> = ({ pos, look, fov, roll }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.1; c.far = 4000; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...look); c.rotateZ(THREE.MathUtils.degToRad(roll)); c.updateMatrixWorld();
  return null;
};
function project(cam: { pos: V3; look: V3; fov: number; roll: number }, p: V3) {
  const c = new THREE.PerspectiveCamera(cam.fov, ASPECT, 0.1, 4000);
  c.position.set(...cam.pos); c.lookAt(...cam.look); c.rotateZ(THREE.MathUtils.degToRad(cam.roll)); c.updateMatrixWorld();
  const v = new THREE.Vector3(...p);
  const inFront = v.clone().applyMatrix4(c.matrixWorldInverse).z < 0;
  v.project(c);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: inFront };
}

const bullVision = (t: number) => clamp01((t - T.dull + 0.1) / 0.35) * (1 - clamp01((t - (T.what - 0.25)) / 0.3));

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof camAt> }> = ({ t, tex, models, cam }) => {
  const sun: V3 = [-30, 34, 52];
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <fogExp2 attach="fog" args={[new THREE.Color("#E4D2B4").getHex(), 0.0042]} />
      <Sky night={0} sunDir={sun} />
      <hemisphereLight args={[new THREE.Color("#AFCBFF"), new THREE.Color("#6E8A4C"), 1.15]} />
      <directionalLight position={sun} intensity={2.7} color="#FFD49A" castShadow
        shadow-mapSize={[4096, 4096]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-far={200} />
      <Clouds map={tex.cloud} t={t} night={0} />
      <FreeFarm models={models} t={t} clear={[PEN[0], PEN[2], 14]} />
      <M models={models} name="BigBarn" size={12} axis="x" pos={[0, 0, 0]} />
      <M models={models} name="TowerWindmill" size={9} pos={[-11.5, 0, 5.5]} rot={0.8} />
      <Pen models={models} />
      <Cape pos={RED} color="#C8202A" wave={waveOf("red", t)} t={t} show={showOf("red", t)} seed={0} />
      <Cape pos={BLUE} color="#2E5BD0" wave={waveOf("blue", t)} t={t} show={showOf("blue", t)} seed={1.7} />
      <Cape pos={WHITE} color="#F2EDE4" wave={waveOf("white", t)} t={t} show={showOf("white", t)} seed={3.1} />
      <Bull models={models} t={t} />
      <Dust t={t} />
      <InkPass p={{ focus: cam.focus ?? new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look)), blur: cam.blur ?? 7.5,
        night: 0, cow: bullVision(t), flash: t > PASS.waveRed ? Math.exp(-(t - PASS.waveRed) * 6) * 0.5 : 0,
        redPulse: (moodAt(t).rage ?? 0) * (0.22 + 0.12 * Math.max(0, Math.sin(t * 9))), ink: 1 }} />
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
const Word: React.FC<{ size: number; color?: string; children: React.ReactNode }> = ({ size, color = "#FFF8EC", children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 4, color, WebkitTextStroke: `${size * 0.16}px ${INK}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{children}</div>
);
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: anton, fontSize: 74, color: INK, background: "#FFF3D6", border: `7px solid ${INK}`, borderRadius: 18, padding: "6px 26px",
    boxShadow: "7px 9px 0 rgba(34,26,48,0.35)", whiteSpace: "nowrap" }}>{children}</div>
);

// "you: 3 cones / bull: 2 cones": dots pop in on the words
const Cones: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.our - 0.1 || t > T.so + 0.3) return null;
  const out = clamp01((T.so + 0.3 - t) / 0.2);
  const dot = (c: string, t0: number, i: number) => {
    const s = t < t0 ? 0 : spring({ frame: Math.round((t - t0) * 30) - i * 3, fps: 30, config: { damping: 9, stiffness: 240 } });
    return <div key={i} style={{ width: 124, height: 124, borderRadius: 62, background: c, border: `7px solid ${INK}`, transform: `scale(${Math.max(0, s)})` }} />;
  };
  const row = (label: string, cols: string[], t0: number, dim: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: t < t0 - 0.2 ? 0 : 1 }}>
      <div style={{ width: 250, fontSize: 100, textAlign: "right", color: dim ? "#6B5F78" : INK }}>{label}</div>
      {cols.map((c, i) => dot(c, t0, i))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: W / 2, top: 230, transform: `translateX(-50%) scale(${out})`, background: "#FFF3D6", border: `8px solid ${INK}`,
      borderRadius: 26, padding: "26px 44px 30px 20px", boxShadow: "9px 12px 0 rgba(34,26,48,0.35)", fontFamily: anton, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 64, color: "#B7462E", letterSpacing: 3, marginLeft: 30 }}>COLOR CONES</div>
      {row("YOU", ["#E5342F", "#3FB64A", "#3567E0"], T.three, false)}
      {row("BULL", ["#E2C43A", "#3567E0"], T.two, false)}
    </div>
  );
};


// cartoon anger mark (four red veins) pulsing above his brow while he rages, pinned to the head in 3D
const AngerMark: React.FC<{ t: number; cam: ReturnType<typeof camAt> }> = ({ t, cam }) => {
  const r = moodAt(t).rage ?? 0;
  if (r < 0.3) return null;
  const b = bullAt(t);
  const sn = Math.sin(b.face), cs = Math.cos(b.face);
  const lx = 0.32, ly = 2.05, lz = 1.0; // placed frame: above the right horn root
  const p = project(cam, [b.pos[0] + lx * cs + lz * sn, ly, b.pos[2] - lx * sn + lz * cs]);
  const dist = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(b.pos[0], 1.5, b.pos[2]));
  const size = Math.min(260, Math.max(70, (900 / dist) * (46 / cam.fov)));
  if (!p.ok || p.x < -100 || p.x > W + 100 || p.y < -100 || p.y > H + 100) return null;
  const beat = 1 + 0.18 * Math.max(0, Math.sin(t * 9)); // throbs with the red vignette
  const vein = (rot: number) => (
    <path key={rot} d="M 20 6 Q 7 7 6 20" transform={`rotate(${rot} 0 0)`} fill="none" stroke="#E5241F" strokeWidth={6.5} strokeLinecap="round" />
  );
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 60" style={{ position: "absolute", left: p.x - size / 2, top: p.y - size / 2,
      transform: `scale(${clamp01((r - 0.3) / 0.4) * beat}) rotate(-10deg)`, filter: `drop-shadow(0 0 3px ${INK}) drop-shadow(0 0 1px ${INK})` }}>
      {[0, 90, 180, 270].map(vein)}
    </svg>
  );
};

// ------------------------------------------------------------------ composition
export const BullSolo: React.FC<BullProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const tex = useTextures(P.poses.dir);
  const models = useModels();
  const cam = camAt(t);
  const red = project(cam, [RED[0] + 0.6, 2.25, RED[2]]);
  const blue = project(cam, [BLUE[0] + 0.6, 2.25, BLUE[2]]);
  const white = project(cam, [WHITE[0] + 0.6, 2.25, WHITE[2]]);
  const capY = 1640;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} />
        </ThreeCanvas>
      ) : null}
      <AngerMark t={t} cam={cam} />
      {/* myth framing */}
      <Tag x={540} y={420} t={t} t0={0.15} t1={T.bull - 0.05} rot={-4}><Word size={110}>RED = <span style={{ color: "#FF4A3D" }}>ANGRY?</span></Word></Tag>
      <Tag x={540} y={440} t={t} t0={T.bull - 0.05} t1={T.cant - 0.1} rot={-8}>
        <div style={{ fontFamily: anton, fontSize: 150, letterSpacing: 8, color: "#E5342F", border: `14px solid #E5342F`, borderRadius: 20, padding: "0 34px",
          background: "rgba(255,243,214,0.9)", boxShadow: "8px 10px 0 rgba(34,26,48,0.35)" }}>MYTH</div>
      </Tag>
      <Cones t={t} />
      <Tag x={540} y={380} t={t} t0={T.dull - 0.05} t1={T.what - 0.25} rot={0}><Word size={96}>BULL VISION</Word></Tag>
      <Tag x={540} y={400} t={t} t0={T.movement} t1={T.myth + 0.9} rot={-5}><Word size={124} color="#FFD23F">MOVEMENT!</Word></Tag>
      <Tag x={red.x} y={red.y} t={t} t0={PASS.red} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={blue.x} y={blue.y} t={t} t0={PASS.blue} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={white.x} y={white.y} t={t} t0={PASS.white} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={Math.min(780, Math.max(300, red.x))} y={red.y} t={t} t0={T.still - 0.2} t1={T.us - 0.2} rot={4}><Card>STILL = IGNORED</Card></Tag>
      <Tag x={540} y={400} t={t} t0={T.stains - 0.05} t1={T.dramatic - 0.15} rot={-4}><Card>HIDES STAINS</Card></Tag>
      <Tag x={540} y={400} t={t} t0={T.dramatic - 0.05} t1={T.notred - 0.1} rot={5}><Card>LOOKS DRAMATIC</Card></Tag>
      <Tag x={540} y={420} t={t} t0={29.25} t1={T.end + 1} rot={-5}><Word size={128} color="#FFD23F">THE WAVE.</Word></Tag>
      <Karaoke c={P.captions} y={capY} />
      <Audio src={staticFile(P.audio)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ thumbnail
// one frame of the 3D scene with no captions/tags (headline added later by whywhywhy_pipeline/thumb_text.py):
// the bull mid-rage at his spot (t ~14.4: head down, bloodshot, steam, anger mark), the red cape flying behind him
export const BullThumb: React.FC<{ t: number; pos: V3; look: V3; fov: number; roll: number }> = ({ t, pos, look, fov, roll }) => {
  const tex = useTextures("");
  const models = useModels();
  const cam = { pos, look, fov, roll, focus: undefined as number | undefined, blur: 4 };
  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} />
        </ThreeCanvas>
      ) : null}
      <AngerMark t={t} cam={cam} />
    </AbsoluteFill>
  );
};
