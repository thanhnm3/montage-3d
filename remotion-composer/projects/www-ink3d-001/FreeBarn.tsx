// r02 FREE-ASSETS build of the same Short (same voice, captions, camera timing, ink pass) — every model / character is a
// CC0 download (FreeWorld.tsx, FREE_ASSETS.md); only code effects are kept (sky, clouds, star, sparkles, mold, liquid).
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
import type { PoseInfo } from "./PoseScene";
import { Cow, FreeFarm, M, Models, paintUni, useModels } from "./FreeWorld";
import { InkPass } from "./Ink";
import { Clouds, Cutout, DustRain, Mold, Sky, Station, Supernova, Tex, V3, clamp01, col, ease, lerp, lerpV } from "./World";

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
  { t: 0, pose: "interact", flip: true },
  { t: T.idea - 0.05, pose: "wide" },
  { t: T.think - 0.05, pose: "talk", flip: false },
  { t: T.nope - 0.05, pose: "hold" },
  { t: T.barely - 0.05, pose: "wide" },
  { t: T.y1800, pose: "idle", flip: false },
  { t: T.paint - 0.05, pose: "interact" },
  { t: T.mix - 0.05, pose: "think" },
  { t: T.red - 0.05, pose: "cheer1" },
  { t: T.yousee - 0.05, pose: "talk" },
  { t: T.rust + 7.98, pose: "think" },
  { t: T.atom - 0.05, pose: "show" },
  { t: T.every - 0.05, pose: "show" },
  { t: T.blood - 0.05, pose: "think" },
];
const hostSpot = (t: number): V3 => (t < T.y1800 ? HOST_A : HOST_B);
const HOST_M = 1.62;
const BARN_ROT = 0; // the Quaternius BigBarn's doors face +z after this turn // m, hair to soles of the idle pose

// ------------------------------------------------------------------ props from build.py
type Cue = { start: number; end: number; value: string };
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number; keywordsOnly?: boolean };
export type BarnProps = {
  durationInFrames: number; audio: string; cues: Cue[]; captions: Captions;
  poses: { dir: string; items: Record<string, PoseInfo> }; face: { dir: string; sizes: Record<string, [number, number]>; pad: number };
};

const TEX = ["mold", "cloud", "glow", "rust", "wood_plank"];
const HOST_POSES = ["interact", "wide", "talk", "hold", "idle", "think", "cheer1", "show"];
const KDIR = "free/man";

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
      ...HOST_POSES.map((n) => load(staticFile(`${KDIR}/${n}.png`)).then((t) => [`pose_${n}`, t] as const)),
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
const KEN: Record<string, PoseInfo> = {};
const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof camAt>; night: number; pose: string; flip: boolean; P: BarnProps; talk: number }> = ({ t, tex, models, cam, night, pose, flip, P, talk }) => {
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
  const ptex = tex[`pose_${pose}`];
  const idleT = tex.pose_idle;
  const hostH = HOST_M * (ptex.image as HTMLImageElement).height / (idleT.image as HTMLImageElement).height;
  const aspect = (ptex.image as HTMLImageElement).width / (ptex.image as HTMLImageElement).height;
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
      <M models={models} name="BigBarn" size={12} axis="x" pos={[0, 0, 0]} rot={BARN_ROT} paintable />
      <M models={models} name="pot_large" size={0.9} axis="x" pos={[-3.7, 0, 12.2]} />
      <M models={models} name="stump_round" size={0.55} pos={[-2.5, 0, 13.0]} rot={0.4} />
      <Station tex={tex} t={t} T={T} liquid={liquid} level={level} bare={{ y0: 0.06, y1: 0.27, r: 0.37, canY: 0.55 }} />
      <M models={models} name="TowerWindmill" size={9} pos={[-11.5, 0, 5.5]} rot={0.8} tint="#9A4A22" tintK={0.75} />
      <M models={models} name="log_stack" size={1.0} pos={[-9.4, 0, 9.0]} rot={0.3} />
      <Mold map={tex.mold} k={t < T.y1800 || t > T.yousee ? 1 : moldK} />
      {([[9.9, 19.4, 1.9], [12.5, 20.5, 2.6], [15.0, 18.4, 1.2], [17.8, 20.0, 2.2]] as V3[]).map(([x, z, r], i) => (
        <Cow key={i} models={models} pos={[x, 0, z]} rot={r} t={t + i * 1.7} clip={i % 2 ? "eat" : "idle"} />
      ))}
      {/* host = Kenney Toon Characters pose as a lit, shadow-casting billboard; "talking" = a squash bob with the voice */}
      <Cutout map={ptex} pos={hostSpot(t)} h={hostH * (1 - 0.02 * talk)} aspect={aspect * (1 + 0.015 * talk)} camPos={cam.pos} flip={flip} />
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
export const Ink3DBarnFree: React.FC<BarnProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const tex = useTextures(P.poses.dir);
  const cam = camAt(t);
  const night = ease((t - T.yousee) / 0.9);
  const models = useModels();
  let st = { pose: "interact", flip: true };
  for (const k of HOST_KEYS) if (k.t <= t) st = { pose: k.pose ?? st.pose, flip: k.flip ?? st.flip };
  const spot = hostSpot(t);
  // voice energy from the Rhubarb cues (open mouth shapes) -> squash bob
  const open = (tt: number) => { const c = P.cues.find((q) => tt >= q.start && tt < q.end); return c && "CDEF".includes(c.value) ? 1 : 0; };
  const talk = (open(t) + open(t - 1 / 30) + open(t - 2 / 30)) / 3;
  // price tag above the store paint can, Fe tile by the host's hand
  const can = project(cam, [-2.5, 1.35, 13.0]);
  const hand = project(cam, [spot[0] + 0.45, 1.7, spot[2]]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} night={night} pose={st.pose} flip={st.flip} P={P} talk={talk} />
        </ThreeCanvas>
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

// caption height: mid-frame, lower during the sky shots (the star sits high)
const capY = (t: number) => (t >= T.atom && t < T.every ? 1320 : 1180);
