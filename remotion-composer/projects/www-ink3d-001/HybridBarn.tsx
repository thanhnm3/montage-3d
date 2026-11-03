// r03 HYBRID (2026-11-02): r01 composition with the world swapped for the free CC0 models of r02 (FreeWorld.tsx: Quaternius
// barn/cows/windmill, Kenney trees/rocks), host and hand-made props (bucket, can, mold, supernova) kept from r01.
// Why Why Why — ink-3D test 001 "Why are barns red?" (2026-11-02). Style study of the viral "flat 2D characters in a
// 3D world with ink lines" Shorts: one continuous world, the camera TRAVELS into each next moment (eased ~0.8 s glides,
// one hard cut), a slow push-in the rest of the time; warm day while it sets up, deep night blue from "But you see".
// The host is the approved pose-library teen (PoseScene: whole AI poses + live face), drawn as an overlay anchored to
// a 3D point every frame, with a real shadow from an invisible caster in the world.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { PoseScene, PoseInfo, PoseKey } from "./PoseScene";
import { InkPass } from "./Ink";
import { Cow, FreeFarm, M, Models, paintUni, useModels } from "./FreeWorld";
import { Clouds, DustRain, Mold, ShadowCaster, Sky, Station, Supernova, Tex, V3, clamp01, col, ease, lerp, lerpV } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;

// word times (s) in public/audio/narration.wav (artifacts/whisper_words_r03.json)
export const T: Record<string, number> = {
  stars: 2.08, idea: 3.22, think: 4.3, cows: 5.52, nope: 7.28, barely: 8.12, y1800: 9.62, paint: 10.82, mix: 12.36,
  oil: 13.96, milk: 14.96, lime: 15.6, rust: 16.48, everywhere: 17.08, cheap: 19.02, mold: 19.98, moldOff: 20.9,
  red: 22.16, yousee: 23.74, iron: 25.1, atom: 25.84, forged: 27.94, star: 28.9, exploded: 29.4, sun: 30.46,
  every: 31.5, dead: 33.16, blood: 34.2, end: 35.9,
};

// ------------------------------------------------------------------ camera: keys + eased glides + slow push
type CamKey = { t: number; pos: V3; look: V3; fov: number; glide?: number; cut?: boolean; push?: number; focus?: number; blur?: number };
const STAR: V3 = [260, 1050, -1150];
const HOST_A: V3 = [5.8, 0, 21.2]; // hook + cows (faces left to the barn, then right to the cows)
const HOST_B: V3 = [-4.9, 0, 12.5]; // 1800s paint station, end
const K: CamKey[] = [
  { t: 0, pos: [9.5, 1.5, 27.5], look: [1.0, 4.0, 7], fov: 52, push: 0.016 },
  { t: T.think, pos: [2.4, 1.6, 27.5], look: [13.5, 1.2, 12.5], fov: 50, glide: 0.85, push: 0.012 },
  { t: T.y1800, pos: [-3.0, 1.6, 19.4], look: [-3.9, 1.1, 12.4], fov: 52, cut: true, push: 0.012 },
  { t: T.mix, pos: [-2.5, 2.0, 14.6], look: [-3.7, 0.35, 12.2], fov: 46, glide: 0.8, push: 0.01 },
  { t: T.everywhere, pos: [-5.6, 1.6, 13.4], look: [-10.5, 3.6, 6.0], fov: 52, glide: 0.75, push: 0.012 },
  { t: T.mold, pos: [-9.6, 1.25, 3.4], look: [-6.0, 1.05, 1.6], fov: 42, glide: 0.75, push: 0.01 },
  { t: T.red, pos: [-17, 4.0, 30], look: [-0.5, 4.0, 4], fov: 52, glide: 0.9, push: 0.008 },
  { t: T.yousee, pos: [-2.6, 1.5, 17.3], look: [-4.4, 1.25, 12.5], fov: 46, glide: 0.85, push: 0.012 },
  { t: T.atom, pos: [-3.2, 3.2, 17.5], look: STAR, fov: 50, glide: 1.25, push: 0, focus: 1500, blur: 2 },
  { t: T.forged, pos: [-3.2, 3.2, 17.5], look: STAR, fov: 26, glide: 1.4, push: 0, focus: 1500, blur: 2 },
  { t: T.every, pos: [-13, 3.4, 27], look: [-0.5, 3.4, 3], fov: 46, glide: 1.1, push: 0.01 },
  { t: T.blood, pos: [-3.5, 1.45, 15.6], look: [-4.75, 1.2, 12.5], fov: 42, glide: 0.75, push: 0.014 },
];

function keyState(k: CamKey, t: number) {
  const e = Math.max(0, t - k.t) * (k.push ?? 0);
  const pos = lerpV(k.pos, k.look, Math.min(0.5, e));
  return { pos, look: k.look, fov: k.fov, focus: k.focus, blur: k.blur };
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
    // look direction blends as a direction (so a big tilt up to the sky stays a smooth arc)
    const da = new THREE.Vector3(...a.look).sub(new THREE.Vector3(...a.pos)).normalize();
    const db = new THREE.Vector3(...s.look).sub(new THREE.Vector3(...s.pos)).normalize();
    const pos = lerpV(a.pos, s.pos, x);
    const dir = da.lerp(db, x).normalize();
    const dist = lerp(new THREE.Vector3(...a.look).distanceTo(new THREE.Vector3(...a.pos)), new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos)), x);
    const look: V3 = [pos[0] + dir.x * dist, pos[1] + dir.y * dist, pos[2] + dir.z * dist];
    s = { pos, look, fov: lerp(a.fov, s.fov, x), focus: s.focus ?? a.focus, blur: x < 0.5 ? a.blur ?? s.blur : s.blur };
  }
  // tiny drift (never perfectly still), plus the explosion shake
  const sh = t > T.exploded ? Math.exp(-(t - T.exploded) * 4) * 0.08 : 0;
  const pos: V3 = [s.pos[0] + Math.sin(t * 0.7) * 0.025 + Math.sin(t * 37) * sh, s.pos[1] + Math.sin(t * 0.9 + 1) * 0.018 + Math.cos(t * 41) * sh, s.pos[2]];
  return { ...s, pos };
}

// ------------------------------------------------------------------ host: pose keys (time s), world spots
type HKey = { t: number; pose?: string; expression?: string; flip?: boolean };
const HOST_KEYS: HKey[] = [
  { t: 0, pose: "point_far", expression: "curious", flip: true },
  { t: T.idea - 0.05, pose: "shrug", expression: "happy" },
  { t: T.think - 0.05, pose: "explain_wide", expression: "neutral", flip: false },
  { t: T.nope - 0.05, pose: "point_up", expression: "skeptical" },
  { t: T.barely - 0.05, pose: "shrug", expression: "happy" },
  { t: T.y1800, pose: "idle", expression: "curious", flip: false },
  { t: T.paint - 0.05, pose: "present", expression: "skeptical" },
  { t: T.mix - 0.05, pose: "look_down", expression: "neutral" },
  { t: T.red - 0.05, pose: "celebrate", expression: "laughing" },
  { t: T.yousee - 0.05, pose: "point_up", expression: "curious" },
  { t: T.rust + 7.98, pose: "hold_show", expression: "thinking" }, // "rust is iron" 24.46
  { t: T.atom - 0.05, pose: "surprised", expression: "surprised" },
  { t: T.every - 0.05, pose: "surprised", expression: "surprised" },
  { t: T.blood - 0.05, pose: "hold_show", expression: "surprised" },
];
const hostSpot = (t: number): V3 => (t < T.y1800 ? HOST_A : HOST_B);
const HOST_M = 1.62; // m, hair to soles of the idle pose

// ------------------------------------------------------------------ props from build.py
type Cue = { start: number; end: number; value: string };
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number; keywordsOnly?: boolean };
export type BarnProps = {
  durationInFrames: number; audio: string; cues: Cue[]; captions: Captions;
  poses: { dir: string; items: Record<string, PoseInfo> }; face: { dir: string; sizes: Record<string, [number, number]>; pad: number };
};

const TEX = ["wood_grey", "wood_red", "wood_plank", "roof", "grass", "dirt", "rust", "wheat", "mold", "cow", "cloud", "glow"];
const SHADOW_POSES = ["point_far", "shrug", "explain_wide", "point_up", "idle", "present", "look_down", "celebrate", "hold_show", "surprised"];

function useTextures(poseDir: string) {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    const load = (url: string, srgb = true) => new Promise<THREE.Texture>((res, rej) => L.load(url, (t) => {
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      res(t);
    }, undefined, rej));
    Promise.all([
      ...TEX.map((n) => load(staticFile(`tex/${n}.png`)).then((t) => [n, t] as const)),
      ...SHADOW_POSES.map((n) => load(staticFile(`${poseDir}/${n}.png`)).then((t) => [`pose_${n}`, t] as const)),
    ]).then((all) => setTex(Object.fromEntries(all)));
  }, [poseDir]);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}

// camera inside the canvas, set from the same numbers the overlay projection uses
const CamSet: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.near = 0.1;
  c.far = 4000;
  c.aspect = ASPECT;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  c.updateMatrixWorld();
  return null;
};

function project(cam: { pos: V3; look: V3; fov: number }, p: V3) {
  const c = new THREE.PerspectiveCamera(cam.fov, ASPECT, 0.1, 4000);
  c.position.set(...cam.pos);
  c.lookAt(...cam.look);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p);
  const inFront = v.clone().applyMatrix4(c.matrixWorldInverse).z < 0;
  v.project(c);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: inFront };
}

// ------------------------------------------------------------------ the world at time t
const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof camAt>; night: number; pose: string; flip: boolean; P: BarnProps }> = ({ t, tex, models, cam, night, pose, flip, P }) => {
  const sunDay: V3 = [-40, 30, 38], moon: V3 = [36, 52, -24];
  const sun = lerpV(sunDay, moon, night);
  const paint = t < T.y1800 ? 14 : t < T.red ? -14 : lerp(-14, 14, ease((t - T.red) / 1.3));
  // bucket liquid: empty -> oil -> milk -> lime -> rust red
  const stages: [number, string, number][] = [[0, "#3A2A22", 0.04], [T.oil + 0.02, "#D9A23A", 0.22], [T.milk + 0.02, "#F1E5C6", 0.34],
    [T.lime + 0.02, "#F6F2E8", 0.42], [T.rust + 0.02, "#B9281F", 0.5]];
  let liquid = stages[0][1], level = stages[0][2];
  for (let i = 1; i < stages.length; i++) {
    if (t >= stages[i][0]) {
      const k = ease((t - stages[i][0]) / (i === 4 ? 0.7 : 0.25));
      liquid = col(stages[i - 1][1], stages[i][1], k).getStyle();
      level = lerp(stages[i - 1][2], stages[i][2], k);
    }
  }
  paintUni.paint.value = paint;
  const idle = P.poses.items.idle;
  const info = P.poses.items[pose] ?? idle;
  const hostH = HOST_M * info.h / idle.h;
  const shadowTex = tex[`pose_${pose}`] ?? null;
  const moldK = clamp01((t - T.moldOff) / 0.9);
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} />
      <fogExp2 attach="fog" args={[col("#E4D2B4", "#1A2350", night).getHex(), 0.0042]} />
      <Sky night={night} sunDir={sunDay} />
      <hemisphereLight args={[col("#AFCBFF", "#2C3C86", night), col("#6E8A4C", "#121830", night), lerp(1.15, 0.5, night)]} />
      <directionalLight position={sun} intensity={lerp(2.7, 0.95, night)} color={col("#FFD49A", "#9BB2FF", night)} castShadow
        shadow-mapSize={[4096, 4096]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-far={200} />
      {night > 0 && <pointLight position={[0, 6.4, 9.2]} color="#FFB45A" intensity={night * 40} distance={16} decay={2} />}
      <Clouds map={tex.cloud} t={t} night={night} />
      <FreeFarm models={models} t={t} />
      <M models={models} name="BigBarn" size={12} axis="x" pos={[0, 0, 0]} paintable />
      <Station tex={tex} t={t} T={T} liquid={liquid} level={level} />
      <M models={models} name="TowerWindmill" size={9} pos={[-11.5, 0, 5.5]} rot={0.8} tint="#9A4A22" tintK={0.75} />
      <M models={models} name="log_stack" size={1.0} pos={[-9.4, 0, 9.0]} rot={0.3} />
      <Mold map={tex.mold} k={t < T.y1800 || t > T.yousee ? 1 : moldK} />
      {([[9.9, 19.4, 1.9], [12.5, 20.5, 2.6], [15.0, 18.4, 1.2], [17.8, 20.0, 2.2]] as V3[]).map(([x, z, r], i) => (
        <Cow key={i} models={models} pos={[x, 0, z]} rot={r} t={t + i * 1.7} clip={i % 2 ? "eat" : "idle"} />
      ))}
      <ShadowCaster map={shadowTex} pos={hostSpot(t)} h={hostH} aspect={info.w / info.h} ground={[info.ground[0] / info.w, info.ground[1] / info.h]}
        camPos={cam.pos} flip={flip} />
      <Supernova glow={tex.glow} t={t} T={T} S={STAR} />
      <DustRain glow={tex.glow} t={t} t0={T.every - 0.3} />
      <InkPass p={{
        focus: cam.focus ?? new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look)),
        blur: cam.blur ?? 7.5, night, cow: cowVision(t), flash: flashAt(t), redPulse: redPulse(t), ink: 1,
      }} />
    </>
  );
};

const cowVision = (t: number) => clamp01((t - T.barely) / 0.25) * (1 - clamp01((t - (T.y1800 - 0.3)) / 0.25));
const flashAt = (t: number) => (t >= T.exploded ? Math.exp(-(t - T.exploded) * 5) * 0.85 : 0);
const redPulse = (t: number) => {
  let p = 0;
  for (const b of [T.blood + 0.55, T.blood + 1.15]) if (t >= b) p += Math.exp(-(t - b) * 5) * 0.55;
  return Math.min(0.6, p);
};

// ------------------------------------------------------------------ overlays
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
          const on = f >= w.f0 && f < Math.max(w.f1, w.f0 + 4);
          const said = f >= w.f1;
          const lift = on ? spring({ frame: f - w.f0, fps, config: { damping: 10, stiffness: 300 } }) : 0;
          return (
            <span key={i} style={{
              display: "inline-block", color: w.k ? "#FFD23F" : "#FFF8EC", opacity: on || said ? 1 : 0.8,
              transform: `translateY(${-lift * c.size * 0.05}px) scale(${1 + lift * 0.06})`, transformOrigin: "50% 100%",
              WebkitTextStroke: `${c.size * 0.12}px #221A30`, paintOrder: "stroke fill", textShadow: `0 ${c.size * 0.06}px ${c.size * 0.1}px rgba(20,10,40,0.5)`,
            }}>{w.t}</span>
          );
        })}
      </div>
    </div>
  );
};

const Tag: React.FC<{ x: number; y: number; t: number; t0: number; t1: number; children: React.ReactNode; rot?: number }> = ({ x, y, t, t0, t1, children, rot = -6 }) => {
  if (t < t0 || t > t1) return null;
  const fps = 30;
  const s = spring({ frame: Math.round((t - t0) * fps), fps, config: { damping: 9, stiffness: 220 } });
  const out = clamp01((t1 - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) rotate(${rot}deg) scale(${s * out})`, transformOrigin: "50% 100%" }}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ composition
export const Ink3DBarnHybrid: React.FC<BarnProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const tex = useTextures(P.poses.dir);
  const models = useModels();
  const cam = camAt(t);
  const night = ease((t - T.yousee) / 0.9);
  // host pose state (same keys feed PoseScene and the 3D shadow)
  let st = { pose: "point_far", flip: true };
  for (const k of HOST_KEYS) if (k.t <= t) st = { pose: k.pose ?? st.pose, flip: k.flip ?? st.flip };
  const keys: PoseKey[] = HOST_KEYS.map((k) => ({ frame: Math.round(k.t * 30), ...(k.pose ? { pose: k.pose } : {}), ...(k.expression ? { expression: k.expression } : {}), ...(k.flip !== undefined ? { flip: k.flip } : {}) }));
  const spot = hostSpot(t);
  const feet = project(cam, spot);
  const head = project(cam, [spot[0], HOST_M, spot[2]]);
  const hPx = feet.y - head.y;
  const showHost = !(t > T.mix + 0.85 && t < T.red) && feet.ok && hPx > 40 && feet.x > -400 && feet.x < W + 400 && head.y < H;
  const tint = col("#FFE0B0", "#5266C8", night).getStyle();
  // price tag above the store paint can, Fe tile by the host's hand
  const can = project(cam, [-2.5, 1.35, 13.0]);
  const hand = project(cam, [spot[0] + 0.45, 1.7, spot[2]]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} night={night} pose={st.pose} flip={st.flip} P={P} />
        </ThreeCanvas>
      ) : null}
      {showHost ? (
        <AbsoluteFill style={{ filter: `saturate(${lerp(1.15, 0.85, night)}) brightness(${lerp(1.02, 0.78, night)}) ${inkOutline(hPx, night)}` }}>
          <PoseScene durationInFrames={P.durationInFrames} audio="" background="" grain={[]} grainOpacity={0}
            look={{ tint, tintAmount: lerp(0.1, 0.42, night), shadow: "#1B1530", shadowOpacity: 0.28, boil: 0.6 }}
            x={feet.x} y={feet.y} height={hPx} seed={3} cues={P.cues} keys={keys} poses={P.poses} face={P.face} />
        </AbsoluteFill>
      ) : null}
      <Tag x={can.x} y={can.y} t={t} t0={T.paint} t1={T.mix - 0.1}>
        <div style={{ fontFamily: anton, fontSize: 64, color: "#221A30", background: "#FFF3D6", border: "6px solid #221A30", borderRadius: 14, padding: "4px 22px", boxShadow: "6px 8px 0 rgba(34,26,48,0.35)" }}>$$$</div>
      </Tag>
      <Tag x={540} y={420} t={t} t0={T.barely} t1={T.y1800 - 0.2} rot={0}>
        <div style={{ fontFamily: anton, fontSize: 88, letterSpacing: 4, color: "#FFF8EC", WebkitTextStroke: "14px #221A30", paintOrder: "stroke fill" }}>COW VISION</div>
      </Tag>
      <Tag x={540} y={360} t={t} t0={T.y1800} t1={T.paint} rot={-3}>
        <div style={{ fontFamily: anton, fontSize: 96, letterSpacing: 4, color: "#FFD23F", WebkitTextStroke: "16px #221A30", paintOrder: "stroke fill" }}>1800s</div>
      </Tag>
      <Tag x={hand.x + 30} y={hand.y} t={t} t0={T.iron - 0.05} t1={T.atom + 0.4} rot={6}>
        <div style={{ width: 170, height: 190, background: "#E07A3A", border: "8px solid #221A30", borderRadius: 18, boxShadow: "8px 10px 0 rgba(10,10,30,0.4)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: anton, color: "#221A30" }}>
          <div style={{ fontSize: 34, alignSelf: "flex-start", marginLeft: 16 }}>26</div>
          <div style={{ fontSize: 96, lineHeight: 0.9 }}>Fe</div>
          <div style={{ fontSize: 28 }}>IRON</div>
        </div>
      </Tag>
      <Karaoke c={P.captions} y={capY(t)} />
      <Audio src={staticFile(P.audio)} />
    </AbsoluteFill>
  );
};

// the world's ink contour around the host: 8 hard drop-shadows in the ink colour of Ink.tsx, ~0.28% of his height
// (the AI art has thin inner lines but no outer contour, so next to the inked 3D models he read as pasted on)
export const inkOutline = (hPx: number, night: number) => {
  const r = Math.max(1.2, Math.min(3.2, hPx * 0.0028)); // user 2026-11-02: 0.75% read as "super thick"
  const c = col("#211A30", "#12122A", night).getStyle();
  return [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]
    .map(([x, y]) => `drop-shadow(${(x * r).toFixed(1)}px ${(y * r).toFixed(1)}px 0 ${c})`).join(" ");
};

// caption height: mid-frame, lower during the sky shots (the star sits high)
const capY = (t: number) => (t >= T.atom && t < T.every ? 1320 : 1180);
