// Fossil Mysteries tập dài 006 "5 Scariest Dinosaurs That Ever Lived (Ranked)", 16:9, 3D khối (BlockTheropod + Badlands).
// Giọng Chirp3-HD Charon (tts/episodes/fossil-mysteries/long/006/episode_audio_chirp_r04.wav). Mốc giây trong shot()/CUTS/HITS
// là giây tính từ đầu beat, lấy từ raw/words_hook.json (Whisper word timestamps). Hiện có HOOK (beat 1-5).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { BlockHuman, BlockTheropod, DINOS, DinoSpec, V3 } from "./BlockAnimals";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Badlands, BadLights, PALS } from "./Badlands";
import { BarGlow, CLAMP, RANK, REX, RH, Shot, clamp01, ease, extent, faceShot, headOf, lerp, lerp3, mono, pulse, sans } from "./Long006_common";
import { BreathPuff, ClawInStone, CrumbleSkeleton, FossilSlab, Plate, SkullInRock, TrikeFrill } from "./FossilProps";
import { YardLights } from "./ActProps";
import { CityLights } from "./CityProps";
import { RiverSet, UnderLights } from "./Act4Props";
import { CHAPTER4, CUTS4, HITS4, LIGHTNING4, OVERLAYS4, shotAct4 } from "./Long006_act4";
import { CHAPTER5, CUTS5, HITS5, LIGHTNING5, OVERLAYS5, shotAct5 } from "./Long006_act5";
import { CHAPTER6, CUTS6, HITS6, LIGHTNING6, OVERLAYS6, shotAct6 } from "./Long006_act6";
import { CHAPTER7, CUTS7, HITS7, LIGHTNING7, OVERLAYS7, shotCloser } from "./Long006_closer";
import { CHAPTER3, CUTS3, HITS3, LIGHTNING3, OVERLAYS3, shotAct3 } from "./Long006_act3";
import { CHAPTER12, CUTS12, HITS12, OVERLAYS12, shotAct12 } from "./Long006_act12";

// thời lượng từng beat (s, đã gồm khoảng lặng sau beat) từ chirp_r04/result.json
export const BEAT_DUR = [6.93, 6.82, 7.154, 8.102, 7.748, 10.953, 14.625, 12.805, 11.319, 6.972, 16.976, 10.253, 7.174, 8.303, 13.064, 14.986, 15.579, 11.969, 5.341, 9.944, 9.491, 16.865, 15.862, 16.273, 12.401, 15.384, 11.031, 9.466, 15.817, 7.708, 9.576, 10.972, 6.721, 16.366, 22.323, 10.365, 12.972, 7.604, 18.175, 14.129, 11.944, 12.956];
export const BEAT_START = BEAT_DUR.reduce<number[]>((a, d) => [...a, a[a.length - 1] + d], [0]);
export const HOOK_FRAMES = Math.round(BEAT_START[5] * 30);
export const ACT2_END_FRAMES = Math.round(BEAT_START[14] * 30);
export const EP_FRAMES = Math.round(BEAT_START[BEAT_DUR.length] * 30);

type Cut = [number, "whip" | "flash" | "cut"];
const CUTS: Record<number, Cut[]> = {
  1: [[1.74, "cut"], [3.74, "flash"], [5.34, "whip"]],
  2: [[0, "cut"], [2.95, "cut"], [4.37, "whip"]],
  3: [[0, "cut"], [1.99, "whip"], [2.53, "whip"], [3.17, "whip"], [3.93, "whip"], [5.65, "cut"], [6.39, "flash"]],
  4: [[0, "flash"], [3.18, "cut"], [4.24, "cut"], [6.14, "cut"]],
  5: [[0, "whip"], [3.31, "flash"], [4.47, "cut"]],
  ...CUTS12,
  ...CUTS3,
  ...CUTS4,
  ...CUTS5,
  ...CUTS6,
  ...CUTS7,
};
const HITS: Record<number, [number, number][]> = {
  1: [[0.25, 0.1], [3.74, 0.18], [5.4, 0.12]],
  2: [[0.1, 0.06], [4.6, 0.05]],
  3: [[0.8, 0.05], [2.0, 0.08], [2.55, 0.08], [3.2, 0.08], [3.95, 0.14], [6.39, 0.2]],
  4: [[3.2, 0.08], [4.26, 0.08], [6.5, 0.24]],
  5: [[2.05, 0.16], [3.31, 0.3]],
  ...HITS12,
  ...HITS3,
  ...HITS4,
  ...HITS5,
  ...HITS6,
  ...HITS7,
};
// chớp sét (giây trong beat)
const LIGHTNING: Record<number, number[]> = { 1: [0.2, 0.42], 3: [0.7], 6: [0.5], 8: [0.15], 12: [0.4], 14: [6.6], ...LIGHTNING3, ...LIGHTNING4, ...LIGHTNING5, ...LIGHTNING6, ...LIGHTNING7 };

function hitEnv(beat: number, t: number) {
  let e = 0;
  for (const [ht, s] of HITS[beat] ?? []) if (t >= ht) e += s * Math.exp(-(t - ht) * 9);
  return e;
}
function boltEnv(beat: number, t: number) {
  let e = 0;
  for (const b of LIGHTNING[beat] ?? []) if (t >= b && t < b + 0.25) e = Math.max(e, (1 - (t - b) / 0.25) * (0.6 + 0.4 * Math.sin(80 * (t - b))));
  return e;
}

function shot(beat: number, t: number, T: number): Shot {
  if (beat >= 40) return shotCloser(beat, t, T);
  if (beat >= 35) return shotAct6(beat, t, T);
  if (beat >= 28) return shotAct5(beat, t, T);
  if (beat >= 22) return shotAct4(beat, t, T);
  if (beat >= 15) return shotAct3(beat, t, T);
  if (beat >= 6) return shotAct12(beat, t, T);
  switch (beat) {
    case 1: {
      const rex = (roar: number, eyeI = 1) => <BlockTheropod t={T} spec={REX} walk={0} roar={roar} eyeI={eyeI} />;
      if (t < 1.74) {
        // máy hạ từ mây bão xuống bóng T. rex, mắt bật sáng
        const k = ease(t / 1.74);
        return { env: "bad", fov: 40, cam: lerp3([-16, 15, 18], [-13, 2.0, 13], k), look: lerp3([-3, 6, 0], [-3.2, 3.6, 0], k), actors: rex(0, ease((t - 0.85) / 0.45)) };
      }
      if (t < 3.74) {
        // máy thấp lướt ngang qua đầu, hàm nhe ra
        const u = (t - 1.74) / 2.0;
        return { env: "bad", fov: 34, cam: [RH[0] - 3.6 + 2.6 * u, RH[1] - 1.4, 4.6 - 0.6 * u], look: [RH[0] + 0.2, RH[1] - 0.1, 0], actors: rex(pulse(t, 2.15, 3.9) * 0.85) };
      }
      if (t < 5.34) {
        // cực cận răng nanh
        const u = (t - 3.74) / 1.6;
        return { env: "bad", fov: 30, cam: [RH[0] - 2.7 + 0.2 * u, RH[1] - 0.9, 2.6 - 0.4 * u], look: [RH[0] - 0.45, RH[1] + 0.15, 0], actors: rex(0.32) };
      }
      // sọ Triceratops trên đất, diềm cổ đầy vết cắn
      const u = (t - 5.34) / 1.6;
      return { env: "bad", fov: 38, lightsAt: 40, cam: [40 - 2.4 + 0.6 * u, 2.5 - 0.4 * u, 3.6 - 0.6 * u], look: [40 - 0.4, 0.9, 0], actors: <group position={[40, 0, 0]}><TrikeFrill /></group> };
    }
    case 2: {
      if (t < 2.95) {
        // sau lưng người khối 1,8 m, ngước dần lên T. rex
        const k = ease((t - 0.3) / 2.4);
        return {
          env: "bad", fov: 44, cam: [-15.5, 1.0, 7.6], look: lerp3([-9.2, 1.5, 3.6], [-3.6, 4.4, 0.4], k),
          actors: (
            <>
              <BlockTheropod t={T} spec={REX} walk={0} look={0.12} />
              <group position={[-9.2, 0, 3.6]} rotation={[0, Math.PI - 0.3, 0]}><BlockHuman t={T} /></group>
            </>
          ),
        };
      }
      if (t < 4.37) {
        // dolly zoom vào người đứng cạnh đầu gối T. rex
        const u = ease((t - 2.95) / 1.42);
        const fov = lerp(16, 46, u);
        const W = 5.2;
        const d = W / (2 * Math.tan((fov * Math.PI) / 360));
        return {
          env: "bad", fov, cam: [-1.2, 1.3, 2.2 + d], look: [-1.2, 1.7, 2.2],
          actors: (
            <>
              <BlockTheropod t={T} spec={REX} walk={0} />
              <group position={[-1.3, 0, 2.2]} rotation={[0, -0.6, 0]}><BlockHuman t={T} /></group>
            </>
          ),
        };
      }
      // cận lỗ mũi, phả hơi, đầu quay lại nhìn thẳng ống kính
      const u = (t - 4.37) / 2.45;
      const turn = ease((t - 4.9) / 1.1);
      const th = 0.4 * turn, dx = RH[0] + 2.75 - 0.4;
      const nose: V3 = [-2.75 + dx * Math.cos(th), RH[1] - 0.25, -dx * Math.sin(th)];
      return {
        env: "bad", fov: 32, cam: [RH[0] - 2.4 + 0.3 * u, RH[1] + 0.25, 4.4 - 0.4 * u], look: [RH[0] - 0.6, RH[1] - 0.1, 0.5 * turn],
        actors: (
          <>
            <BlockTheropod t={T} spec={REX} walk={0} look={0.4 * turn} />
            <BreathPuff t={t - 4.45} p={nose} dir={[-0.6, -0.15, 0.3]} />
            <BreathPuff t={t - 5.45} p={nose} dir={[-0.3, -0.15, 0.7]} />
          </>
        ),
      };
    }
    case 3: {
      if (t < 1.99) {
        // T. rex quay đi; bốn cặp mắt bật sáng trong sương phía sau
        const rivals: [string, V3][] = [["utahraptor", [-17, 0, -9]], ["carnotaurus", [-8, 0, -15]], ["spinosaurus", [5, 0, -16]], ["giganotosaurus", [15, 0, -11]]];
        return {
          env: "bad", fov: 42, fog: [10, 70], dim: 0.55, cam: [-9 + 0.5 * t, 2.4, 17], look: [-1, 3.4, -6],
          actors: (
            <>
              <BlockTheropod t={T} spec={REX} walk={0} look={-0.45 * ease((t - 0.3) / 0.8)} />
              {rivals.map(([sp, p], i) => (
                <group key={sp} position={p} rotation={[0, Math.PI / 2 + (p[0] < 0 ? 0.35 : -0.3), 0]}>
                  <BlockTheropod t={T} spec={DINOS[sp]} walk={0} eyeI={3.2 * ease((t - 0.8 - 0.18 * i) / 0.25)} phase={i} />
                </group>
              ))}
            </>
          ),
        };
      }
      // whip qua từng đối thủ
      const W: [number, string][] = [[1.99, "utahraptor"], [2.53, "carnotaurus"], [3.17, "spinosaurus"], [3.93, "giganotosaurus"]];
      for (let i = W.length - 1; i >= 0; i--) {
        if (t >= W[i][0] && t < 5.65) {
          const end = i < W.length - 1 ? W[i + 1][0] : 5.65;
          return faceShot(W[i][1], (t - W[i][0]) / (end - W[i][0]), T, i % 2 ? -1 : 1);
        }
      }
      // so chiều dài: Spinosaurus và Giganotosaurus trượt tới, mõm thẳng hàng với T. rex
      const u = ease((t - 5.65) / 1.0);
      const bar = clamp01((t - 6.3) / 0.5);
      const lane = (sp: string, z: number, slide: number) => {
        const [sx, tx] = extent(DINOS[sp]);
        const off = extent(REX)[0] - sx;
        return (
          <group position={[off + slide * (1 - u), 0, z]}>
            <BlockTheropod t={T} spec={DINOS[sp]} walk={1 - u} phase={z} />
            {bar > 0 && <BarGlow x0={sx} x1={sx + (tx - sx) * bar} z={2.4} c={sp === "trex" ? "#FFB21F" : "#FF5A3A"} />}
          </group>
        );
      };
      return {
        env: "bad", fov: 36, lightsAt: 2, cam: [-3, 24, 27], look: [2, 0, 0],
        actors: <>{lane("trex", 0, 0)}{lane("spinosaurus", -8, 14)}{lane("giganotosaurus", 8, 18)}</>,
      };
    }
    case 4: {
      if (t < 3.18) {
        const u = t / 3.18;
        return { env: "plate", plateX: 0, fov: 38, cam: lerp3([-2.6, 2.7, 3.3], [-1.3, 1.5, 1.9], ease(u)), look: [0, 0.2, 0], actors: <FossilSlab glint={(t - 1.6) / 0.9} /> };
      }
      if (t < 4.24) {
        const u = (t - 3.18) / 1.06;
        return { env: "plate", plateX: 20, fov: 34, cam: [20 - 0.9 + 0.3 * u, 1.0, 1.9 - 0.3 * u], look: [20, 0.85, 0], actors: <group position={[20, 0, 0]}><ClawInStone glint={(t - 3.4) / 0.6} /></group> };
      }
      if (t < 6.14) {
        const u = (t - 4.24) / 1.9;
        return { env: "plate", plateX: 40, fov: 36, cam: [40 - 1.3 + 0.8 * u, 1.15, 3.6 - 0.4 * u], look: [40 - 0.2, 0.85, 0], actors: <group position={[40, 0, 0]}><SkullInRock glint={(t - 4.6) / 0.9} /></group> };
      }
      const u = (t - 6.14) / 1.96;
      return { env: "plate", plateX: 60, fov: 40, cam: [60 - 2.5 + 0.6 * u, 2.3, 6.6 - 0.4 * u], look: [60 - 0.3, 1.3, 0], actors: <group position={[60, 0, 0]}><CrumbleSkeleton t={t} t0={6.45} /></group> };
    }
    case 5: {
      const GAP = 6.5;
      if (t < 4.47) {
        // năm con trong sương, gầm lần lượt #5 -> #1
        const k = ease(t / 4.47);
        return {
          env: "bad", lightsAt: 0, cam: [-27 + 4 * k, 3.4 - 0.4 * k, -1.5 + 1.5 * k], look: [-2, 2.6, 0], fov: 50,
          actors: (
            <>
              {RANK.map((sp, i) => (
                <group key={sp} position={[0, 0, (i - 2) * GAP]}>
                  <BlockTheropod t={T} spec={DINOS[sp]} walk={0} roar={pulse(t, 0.35 + 0.42 * i, 1.25 + 0.42 * i + (i === 4 ? 0.5 : 0))} phase={i * 1.3} />
                </group>
              ))}
            </>
          ),
        };
      }
      // cực cận mắt T. rex trong bóng tối, mắt mở sáng ở chữ "one"
      const u = (t - 4.47) / 3.28;
      const eye: V3 = [RH[0] - 0.3, RH[1] + 0.55, 0.45];
      return {
        env: "bad", fov: 30, dim: 0.35, fog: [8, 60], cam: [eye[0] - 1.2 + 0.3 * u, eye[1] + 0.1, eye[2] + 3.2 - 0.7 * u], look: eye,
        actors: <BlockTheropod t={T} spec={REX} walk={0} look={0} eyeI={1.6 * ease((t - 4.62) / 0.35)} />,
      };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

export const Cam: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
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

const World: React.FC<{ beat: number; t: number; T: number; pal: string }> = ({ beat, t, T, pal }) => {
  const s = shot(beat, t, T);
  const h = hitEnv(beat, t);
  const sh = (f: number, o: number) => h * 0.9 * Math.sin(T * f + o);
  const dist = Math.hypot(s.cam[0] - s.look[0], s.cam[1] - s.look[1], s.cam[2] - s.look[2]);
  const amp = Math.min(1, dist / 6);
  const cam: V3 = [s.cam[0] + sh(61, 0) * amp, s.cam[1] + sh(47, 1.3) * amp, s.cam[2] + sh(53, 2.1) * amp];
  const look: V3 = [s.look[0] + sh(43, 0.7) * amp, s.look[1] + sh(57, 2.4) * amp, s.look[2]];
  const lx = s.lightsAt ?? s.look[0];
  return (
    <>
      <Cam pos={cam} look={look} fov={s.fov ?? 40} />
      {s.env === "bad" ? (
        <>
          <BadLights x={lx} z={s.look[2]} cam={cam} fog={s.fog} dim={s.dim} flash={boltEnv(beat, t)} r={lx === s.look[0] ? 16 : 34} pal={s.pal ?? pal} />
          <Badlands t={T} pal={s.pal ?? pal} />
        </>
      ) : s.env === "yard" ? (
        <YardLights x={lx} z={s.look[2]} />
      ) : s.env === "city" ? (
        <CityLights x={lx} z={s.look[2]} />
      ) : s.env === "river" || s.env === "lit" ? (
        <>
          <BadLights x={lx} z={s.look[2]} cam={cam} fog={s.fog ?? [20, 160]} dim={s.dim} flash={boltEnv(beat, t)} r={22} pal={s.pal ?? pal} />
          {s.env === "river" ? <RiverSet t={T} pal={s.pal ?? pal} /> : <color attach="background" args={[(PALS[s.pal ?? pal] ?? PALS.storm).skyMid]} />}
        </>
      ) : s.env === "under" ? (
        <>
          <UnderLights x={lx} />
          <RiverSet t={T} bg={false} />
        </>
      ) : s.env === "set" ? null : (
        <Plate x={s.plateX ?? 0} />
      )}
      {s.actors}
    </>
  );
};

// ------------------------------------------------------------------ chữ trên màn hình
const Stamp: React.FC<{ f: number; text: string }> = ({ f, text }) => {
  const o = interpolate(f, [0, 4, 30, 38], [0, 1, 1, 0], CLAMP);
  const sc = interpolate(f, [0, 5, 9], [2.6, 0.94, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 430, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ transform: `rotate(-5deg) scale(${sc})`, border: "10px solid #E5533D", borderRadius: 16, padding: "8px 46px 12px", color: "#E5533D", fontFamily: sans, fontWeight: 900, fontSize: 150, letterSpacing: 10, background: "rgba(10,8,8,0.35)" }}>
        {text}
      </div>
    </div>
  );
};

// nhãn địa điểm có ghim (beat 4)
const PlaceTag: React.FC<{ f: number; place: string; note: string }> = ({ f, place, note }) => {
  const k = interpolate(f, [0, 6], [0, 1], CLAMP);
  const pin = interpolate(f, [0, 5, 8], [-60, 6, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: 110, bottom: 130, opacity: k, display: "flex", alignItems: "center", gap: 22 }}>
      <svg width="46" height="64" viewBox="0 0 46 64" style={{ transform: `translateY(${pin}px)` }}>
        <path d="M23 2C11 2 2 11 2 23c0 16 21 39 21 39s21-23 21-39C44 11 35 2 23 2z" fill="#E5533D" stroke="#120C08" strokeWidth="3" />
        <circle cx="23" cy="23" r="8" fill="#FFF3DE" />
      </svg>
      <div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 72, color: "#FFF3DE", letterSpacing: 6, lineHeight: 1, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>{place}</div>
        <div style={{ fontFamily: mono, fontSize: 26, color: "#E8B464", letterSpacing: 5, marginTop: 8 }}>{note}</div>
      </div>
    </div>
  );
};

const at = (beat: number, sec: number) => Math.round((BEAT_START[beat - 1] + sec) * 30);

export const Long006_3D: React.FC<{ pal?: string }> = ({ pal = "storm" }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = f / fps;
  let beat = 1;
  while (beat < BEAT_DUR.length && T >= BEAT_START[beat]) beat++;
  const t = T - BEAT_START[beat - 1];
  let whip = 0, flash = 0;
  for (const b of [beat - 1, beat, beat + 1]) {
    for (const [ct, kind] of CUTS[b] ?? []) {
      const dfm = f - at(b, ct);
      if (kind === "whip" && dfm >= -2 && dfm <= 3) whip = Math.max(whip, 1 - Math.abs(dfm + 0.5) / 3.5);
      if (kind === "flash" && dfm >= 0 && dfm <= 5 && at(b, ct) > 0) flash = Math.max(flash, 0.85 * (1 - dfm / 5));
    }
  }
  const bolt = boltEnv(beat, t);
  const punch = 1 + 0.3 * hitEnv(beat, t);
  const dir = beat % 2 ? 1 : -1;
  // cuối HOOK: tối dần vào khoảng lặng trước ACT 1
  const outro = beat === 5 ? interpolate(t, [6.5, 7.4], [0, 1], CLAMP) : 0;
  const fadeIn = interpolate(f, [0, 12], [1, 0], CLAMP);
  const tags: [number, string, string][] = [[at(4, 3.4), "UTAH", "CLAW"], [at(4, 4.86), "ARGENTINA", "SKULL"], [at(4, 6.96), "GERMANY", "SKELETON · DESTROYED 1944"]];
  const tagEnd = [at(4, 4.24), at(4, 6.14), at(5, 0)];
  return (
    <AbsoluteFill style={{ background: (PALS[pal] ?? PALS.red).skyTop, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch + 0.06 * whip}) translateX(${dir * 90 * whip}px)`, filter: whip > 0.05 ? `blur(${22 * whip}px)` : undefined }}>
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.05, far: 900 }} gl={{ antialias: true }}>
          <World beat={beat} t={t} T={T} pal={pal} />
        </ThreeCanvas>
      </AbsoluteFill>
      {bolt > 0 && <AbsoluteFill style={{ background: "#DCE6FF", opacity: 0.25 * bolt, mixBlendMode: "screen" }} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 48%, rgba(0,0,0,0) 55%, rgba(4,4,6,0.65) 100%)" }} />
      {flash > 0 && <AbsoluteFill style={{ background: "#FFF6E8", opacity: flash }} />}
      {tags.map(([fr, place, note], i) =>
        f >= fr && f < tagEnd[i] ? <PlaceTag key={place} f={f - fr} place={place} note={note} /> : null,
      )}
      {f >= at(5, 3.31) && f < at(5, 4.47) ? <Stamp f={f - at(5, 3.31)} text="RANKED" /> : null}
      {[...OVERLAYS12, ...OVERLAYS3, ...OVERLAYS4, ...OVERLAYS5, ...OVERLAYS6, ...OVERLAYS7].map(([b, a, e, el], i) => (f >= at(b, a) && f < at(b, e) ? <React.Fragment key={i}>{el(f - at(b, a))}</React.Fragment> : null))}
      {[...CHAPTER12, ...CHAPTER3, ...CHAPTER4, ...CHAPTER5, ...CHAPTER6, ...CHAPTER7].map(([b0, b1, txt]) =>
        beat >= b0 && beat <= b1 && f >= at(b0, 3.0) ? (
          <div key={txt} style={{ position: "absolute", right: 56, top: 40, fontFamily: sans, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#FFF3DE", background: "rgba(229,83,61,0.85)", padding: "6px 18px", borderRadius: 6 }}>{txt}</div>
        ) : null,
      )}
      <div style={{ position: "absolute", left: 56, top: 44, fontFamily: mono, fontSize: 20, letterSpacing: 6, color: "#F2E6D0", opacity: 0.7, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>3D ILLUSTRATION</div>
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(outro, fadeIn) }} />
    </AbsoluteFill>
  );
};
