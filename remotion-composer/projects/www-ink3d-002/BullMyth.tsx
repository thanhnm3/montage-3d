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
import { PoseScene, PoseInfo, PoseKey } from "./PoseScene";
import { InkPass } from "./Ink";
import { FreeFarm, M, Models, place, useModels } from "./FreeWorld";
import { Clouds, ShadowCaster, Sky, Tex, V3, clamp01, col, ease, lerp, lerpV, toon } from "./World";

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
const RED: V3 = [-2.0, 0, 25.4], BLUE: V3 = [0.2, 0, 23.6], WHITE: V3 = [2.3, 0, 25.4];
const HOST: V3 = [0.9, 0, 33.0];
const HOST_M = 1.62;

// cape waving strength per station (0 still .. 1 full flap)
const on = (t: number, a: number, b: number, k = 0.25) => clamp01((t - a) / k) * (1 - clamp01((t - b) / k));
const waveOf = (name: "red" | "blue" | "white", t: number) => {
  if (name === "red") return Math.max(on(t, 0, 3.0), on(t, 9.9, 13.0, 0.4) * 0.6, on(t, T.movement - 0.1, 16.6), on(t, T.us, 27.6, 0.4) * 0.5, on(t, 29.1, 40));
  if (name === "blue") return on(t, 17.2, 18.4);
  return Math.max(on(t, 18.2, 19.2), on(t, T.went - 0.5, 23.2));
};
// blue and white only exist from "MythBusters" on
const showOf = (name: string, t: number) => (name === "red" ? 1 : ease(clamp01((t - 15.9) / 0.35)));

// ------------------------------------------------------------------ bull choreography
type BKey = { t: number; pos: V3; clip: "idle" | "run" | "walkslow"; face?: number };
const BK: BKey[] = [
  { t: 0, pos: [-2.6, 0, 19.6], clip: "idle", face: 0.2 },
  { t: 0.25, pos: [-2.6, 0, 19.6], clip: "run" },
  { t: 1.95, pos: [-1.5, 0, 25.4], clip: "run" }, // through the red cape
  { t: 2.6, pos: [0.9, 0, 30.0], clip: "run" }, // past the low camera
  { t: 3.5, pos: [4.6, 0, 24.6], clip: "run" },
  { t: 3.75, pos: [4.9, 0, 24.0], clip: "idle", face: -1.3 },
  { t: T.movement, pos: [4.9, 0, 24.0], clip: "run" },
  { t: 16.0, pos: [-1.4, 0, 25.6], clip: "run" },
  { t: 16.5, pos: [-4.3, 0, 27.6], clip: "run" },
  { t: 17.25, pos: [-3.2, 0, 25.0], clip: "run" },
  { t: 17.9, pos: [0.8, 0, 23.8], clip: "run" },
  { t: 18.3, pos: [1.8, 0, 22.6], clip: "run" },
  { t: 18.85, pos: [2.9, 0, 25.6], clip: "run" },
  { t: 19.25, pos: [3.6, 0, 28.0], clip: "run" },
  { t: 19.55, pos: [3.4, 0, 28.4], clip: "walkslow" },
  { t: 21.6, pos: [-1.2, 0, 28.6], clip: "walkslow" },
  { t: 21.9, pos: [-1.2, 0, 28.6], clip: "run" },
  { t: 22.75, pos: [2.9, 0, 25.8], clip: "run" },
  { t: 23.2, pos: [4.6, 0, 24.2], clip: "run" },
  { t: 23.5, pos: [4.9, 0, 24.0], clip: "idle", face: -1.3 },
  { t: 29.4, pos: [4.9, 0, 24.0], clip: "run" },
  { t: 30.6, pos: [-1.4, 0, 25.6], clip: "run" },
  { t: 31.6, pos: [-4.5, 0, 27.5], clip: "run" },
];
function bullAt(t: number) {
  let i = 0;
  while (i + 1 < BK.length && BK[i + 1].t <= t) i++;
  const a = BK[i], b = BK[Math.min(i + 1, BK.length - 1)];
  const x = b === a ? 0 : clamp01((t - a.t) / (b.t - a.t));
  const moving = a.clip !== "idle";
  const pos = moving ? lerpV(a.pos, b.pos, x) : a.pos;
  // heading = travel direction while moving, else the key's own facing
  let face = a.face ?? 0;
  if (moving && (b.pos[0] !== a.pos[0] || b.pos[2] !== a.pos[2])) face = Math.atan2(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2]);
  else if (a.face === undefined) for (let k = i; k >= 0; k--) if (BK[k].face !== undefined) { face = BK[k].face!; break; }
  return { pos, face, clip: a.clip, since: t - a.t };
}

const Bull: React.FC<{ models: Models; t: number }> = ({ models, t }) => {
  const inst = useMemo(() => {
    // the Quaternius cow as a bull: dark coat, and the pink (udder, muzzle) painted over in the coat colour
    const g = place(models.Cow, 1.75, "y", { colors: { White: "#5A3526", Black: "#1A1210", Pink: "#5A3526" } });
    const mixer = new THREE.AnimationMixer(g.children[0]);
    const clip = (n: string) => models.Cow.clips.find((c) => c.name.toLowerCase().endsWith(`|${n}`)) ?? models.Cow.clips[0];
    const acts = { idle: mixer.clipAction(clip("idle")), run: mixer.clipAction(clip("run")), walkslow: mixer.clipAction(clip("walkslow")) };
    Object.values(acts).forEach((a) => a.play());
    return { g, mixer, acts };
  }, [models]);
  const s = bullAt(t);
  // smooth heading turns: blend from the previous key's heading over 0.25 s
  const prev = bullAt(t - Math.min(s.since, 0.25));
  let d = s.face - prev.face;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const face = prev.face + d * ease(Math.min(1, s.since / 0.25));
  for (const [n, a] of Object.entries(inst.acts)) a.setEffectiveWeight(n === s.clip ? 1 : 0);
  inst.mixer.setTime(t);
  return <primitive object={inst.g} position={s.pos} rotation={[0, face, 0]} />;
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
const K: CamKey[] = [
  // hook: ground level behind the red cape, the bull charges through it at us
  { t: 0, pos: [-1.1, 0.42, 29.6], aim: true, lag: 0.15, fov: 54, roll: -6 },
  { t: T.except - 0.02, pos: [-0.6, 2.5, 40.8], look: [0.3, 1.0, 26.0], fov: 46, cut: true, push: 0.012 },
  // principle: host + bull, snap-zoom on "three", extreme close-up on the bull's eye, whip pan to the cape
  { t: T.cant, pos: [-0.9, 1.6, 38.9], look: [2.8, 1.2, 25.0], fov: 44, cut: true, push: 0.012, roll: 3 },
  { t: T.three - 0.05, pos: [-0.9, 1.6, 38.9], look: [2.8, 1.2, 25.0], fov: 35, glide: 0.22, push: 0.012, roll: 3 },
  { t: T.bulls2, pos: [2.2, 1.45, 25.5], look: [3.7, 1.6, 24.34], fov: 38, cut: true, push: 0.008, roll: -5 },
  { t: T.so, pos: [-0.6, 1.5, 29.4], look: [-1.6, 1.3, 25.4], fov: 44, glide: 0.3, push: 0.01 },
  // the question: crane up wide, then the frame tilts and creeps in during the pause
  { t: T.what, pos: [0.3, 4.2, 40.5], look: [0.2, 0.6, 26.0], fov: 50, glide: 0.7, push: 0.006 },
  { t: T.charge, pos: [0.3, 3.6, 38.0], look: [0.2, 0.7, 26.0], fov: 42, glide: 1.3, push: 0.004, roll: -5 },
  // MOVEMENT: low, the bull coming at the lens
  { t: T.movement, pos: [-3.4, 0.45, 27.2], aim: true, lag: 0.1, fov: 52, cut: true, roll: 5 },
  { t: T.myth - 0.1, pos: [0.3, 4.4, 40.5], look: [0.2, 0.6, 25.5], fov: 50, cut: true, push: 0.006 },
  { t: 17.25, follow: [0.4, 1.7, 6.2], lag: 0.3, fov: 50, glide: 0.5 },
  { t: T.then, pos: [0.2, 8.5, 34.5], look: [0.2, 0.0, 26.0], fov: 46, glide: 0.6, push: 0.01 },
  { t: T.still + 0.35, pos: [-2.6, 0.45, 30.6], aim: true, lag: 0.15, fov: 50, cut: true, roll: -6 },
  // the real reason: host + cape, then a low hero angle on "dramatic"
  { t: T.us, pos: [4.6, 1.6, 38.8], look: [-1.0, 1.3, 27.0], fov: 46, glide: 0.85, push: 0.01 },
  { t: T.dramatic - 0.05, pos: [0.4, 0.35, 36.6], look: [0.9, 1.5, 33.0], fov: 52, cut: true, push: 0.01, roll: -8 },
  // punchline: low behind the cape, then the charge into the lens
  { t: T.notred, pos: [-0.4, 1.0, 31.0], look: [-0.6, 1.25, 24.0], fov: 50, cut: true, push: 0.02 },
  { t: 29.25, pos: [-0.6, 0.55, 31.4], aim: true, lag: 0.12, fov: 56, glide: 0.4, roll: 7 },
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
function camAt(t: number) {
  let i = 0;
  while (i + 1 < K.length && K[i + 1].t <= t) i++;
  const k = K[i];
  let s = keyState(k, t);
  const g = k.glide ?? 0;
  if (i > 0 && !k.cut && g > 0 && t - k.t < g) {
    const a = keyState(K[i - 1], t);
    const x = ease((t - k.t) / g);
    const da = new THREE.Vector3(...a.look).sub(new THREE.Vector3(...a.pos)).normalize();
    const db = new THREE.Vector3(...s.look).sub(new THREE.Vector3(...s.pos)).normalize();
    const pos = lerpV(a.pos, s.pos, x);
    const dir = da.lerp(db, x).normalize();
    const dist = lerp(new THREE.Vector3(...a.look).distanceTo(new THREE.Vector3(...a.pos)), new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos)), x);
    s = { pos, look: [pos[0] + dir.x * dist, pos[1] + dir.y * dist, pos[2] + dir.z * dist], fov: lerp(a.fov, s.fov, x), focus: s.focus, blur: s.blur, roll: lerp(a.roll, s.roll, x) };
  }
  // drift + a thump when the bull thunders past the camera at the end
  const sh = t > 30.5 ? Math.exp(-(t - 30.5) * 3) * 0.06 : 0;
  const pos: V3 = [s.pos[0] + Math.sin(t * 0.7) * 0.025 + Math.sin(t * 37) * sh, s.pos[1] + Math.sin(t * 0.9 + 1) * 0.018 + Math.cos(t * 41) * sh, s.pos[2]];
  return { ...s, pos };
}

// ------------------------------------------------------------------ host
type HKey = { t: number; pose?: string; expression?: string; flip?: boolean };
const HOST_KEYS: HKey[] = [
  { t: 0, pose: "point_far", expression: "curious", flip: true },
  { t: T.except - 0.3, pose: "shrug", expression: "happy" },
  { t: T.cant - 0.05, pose: "explain_wide", expression: "skeptical", flip: true },
  { t: T.three - 0.1, pose: "count", expression: "curious" },
  { t: T.two - 0.1, pose: "point_up", expression: "thinking" },
  { t: T.what - 0.05, pose: "think", expression: "thinking" },
  { t: T.movement - 0.08, pose: "point_far", expression: "surprised", flip: true },
  { t: T.every - 0.1, pose: "explain_wide", expression: "happy" },
  { t: T.then - 0.05, pose: "arms_crossed", expression: "skeptical" },
  { t: T.went - 0.1, pose: "point_far", expression: "surprised" },
  { t: T.us - 0.05, pose: "explain_self", expression: "curious", flip: true },
  { t: T.stains - 0.05, pose: "present", expression: "neutral" },
  { t: T.dramatic - 0.05, pose: "celebrate", expression: "laughing" },
  { t: T.notred - 0.05, pose: "point_up", expression: "skeptical" },
  { t: 29.2, pose: "wave", expression: "happy" },
];
const SHADOW_POSES = ["point_far", "shrug", "explain_wide", "count", "point_up", "think", "arms_crossed", "explain_self", "present", "celebrate", "wave"];

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

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof camAt>; pose: string; flip: boolean; P: BullProps }> = ({ t, tex, models, cam, pose, flip, P }) => {
  const sun: V3 = [-30, 34, 52];
  const idle = P.poses.items.idle;
  const info = P.poses.items[pose] ?? idle;
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
      <ShadowCaster map={tex[`pose_${pose}`] ?? null} pos={HOST} h={HOST_M * info.h / idle.h} aspect={info.w / info.h}
        ground={[info.ground[0] / info.w, info.ground[1] / info.h]} camPos={cam.pos} flip={flip} />
      <InkPass p={{ focus: cam.focus ?? new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look)), blur: cam.blur ?? 7.5,
        night: 0, cow: bullVision(t), flash: t > 30.45 ? Math.exp(-(t - 30.45) * 6) * 0.5 : 0, redPulse: 0, ink: 1 }} />
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

// the world's ink contour around the host (the AI art has no outer outline; next to inked models it read as pasted on)
const inkOutline = (hPx: number) => {
  const r = Math.max(1.2, Math.min(3.2, hPx * 0.0028)); // user 2026-11-02: 0.75% read as "super thick"
  return [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]
    .map(([x, y]) => `drop-shadow(${(x * r).toFixed(1)}px ${(y * r).toFixed(1)}px 0 #211A30)`).join(" ");
};

// ------------------------------------------------------------------ composition
export const BullMyth: React.FC<BullProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const tex = useTextures(P.poses.dir);
  const models = useModels();
  const cam = camAt(t);
  let st = { pose: "point_far", flip: true };
  for (const k of HOST_KEYS) if (k.t <= t) st = { pose: k.pose ?? st.pose, flip: k.flip ?? st.flip };
  const keys: PoseKey[] = HOST_KEYS.map((k) => ({ frame: Math.round(k.t * 30), ...(k.pose ? { pose: k.pose } : {}), ...(k.expression ? { expression: k.expression } : {}), ...(k.flip !== undefined ? { flip: k.flip } : {}) }));
  const feet = project(cam, HOST);
  const head = project(cam, [HOST[0], HOST_M, HOST[2]]);
  const hPx = Math.hypot(feet.x - head.x, feet.y - head.y);
  const lean = Math.atan2(head.x - feet.x, feet.y - head.y) * 180 / Math.PI;
  const showHost = feet.ok && head.ok && hPx > 40 && feet.x > -600 && feet.x < W + 600 && Math.min(head.y, feet.y) < H;
  const red = project(cam, [RED[0] + 0.6, 2.25, RED[2]]);
  const blue = project(cam, [BLUE[0] + 0.6, 2.25, BLUE[2]]);
  const white = project(cam, [WHITE[0] + 0.6, 2.25, WHITE[2]]);
  const capY = 1660; // under the host's feet in every shot

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} pose={st.pose} flip={st.flip} P={P} />
        </ThreeCanvas>
      ) : null}
      {showHost ? (
        <AbsoluteFill style={{ filter: `saturate(1.15) brightness(1.02) ${inkOutline(hPx)}`, transform: `rotate(${lean}deg)`, transformOrigin: `${feet.x}px ${feet.y}px` }}>
          <PoseScene durationInFrames={P.durationInFrames} audio="" background="" grain={[]} grainOpacity={0}
            look={{ tint: "#FFE0B0", tintAmount: 0.1, shadow: "#1B1530", shadowOpacity: 0.28, boil: 0.6 }}
            x={feet.x} y={feet.y} height={hPx} seed={3} cues={P.cues} keys={keys} poses={P.poses} face={P.face} />
        </AbsoluteFill>
      ) : null}
      {/* myth framing */}
      <Tag x={540} y={420} t={t} t0={0.15} t1={T.bull - 0.05} rot={-4}><Word size={110}>RED = <span style={{ color: "#FF4A3D" }}>ANGRY?</span></Word></Tag>
      <Tag x={540} y={440} t={t} t0={T.bull - 0.05} t1={T.cant - 0.1} rot={-8}>
        <div style={{ fontFamily: anton, fontSize: 150, letterSpacing: 8, color: "#E5342F", border: `14px solid #E5342F`, borderRadius: 20, padding: "0 34px",
          background: "rgba(255,243,214,0.9)", boxShadow: "8px 10px 0 rgba(34,26,48,0.35)" }}>MYTH</div>
      </Tag>
      <Cones t={t} />
      <Tag x={540} y={380} t={t} t0={T.dull - 0.05} t1={T.what - 0.25} rot={0}><Word size={96}>BULL VISION</Word></Tag>
      <Tag x={540} y={400} t={t} t0={T.movement} t1={T.myth + 0.9} rot={-5}><Word size={124} color="#FFD23F">MOVEMENT!</Word></Tag>
      <Tag x={red.x} y={red.y} t={t} t0={16.3} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={blue.x} y={blue.y} t={t} t0={18.0} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={white.x} y={white.y} t={t} t0={18.9} t1={T.then - 0.1}><Card>✓</Card></Tag>
      <Tag x={Math.min(780, Math.max(300, red.x))} y={red.y} t={t} t0={T.still - 0.2} t1={T.us - 0.2} rot={4}><Card>STILL = IGNORED</Card></Tag>
      <Tag x={540} y={400} t={t} t0={T.stains - 0.05} t1={T.dramatic - 0.15} rot={-4}><Card>HIDES STAINS</Card></Tag>
      <Tag x={540} y={400} t={t} t0={T.dramatic - 0.05} t1={T.notred - 0.1} rot={5}><Card>LOOKS DRAMATIC</Card></Tag>
      <Tag x={540} y={420} t={t} t0={29.25} t1={T.end + 1} rot={-5}><Word size={128} color="#FFD23F">THE WAVE.</Word></Tag>
      <Karaoke c={P.captions} y={capY} />
      <Audio src={staticFile(P.audio)} />
    </AbsoluteFill>
  );
};
