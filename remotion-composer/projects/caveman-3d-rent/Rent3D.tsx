// Caveman Short "Rent" bản 3D khối vuông (thử nghiệm 2026-10-30): file này chỉ dựng LỚP NỀN 3D.
// Flint, chữ slam, HUD và giọng r05 do PoseReel vẽ lên trên (projects/caveman-short-rent/scenes/make_spec_3d.py dùng
// video render từ comp này làm baseVideo). Theo công thức Fossil 3D (tools/fossil_pipeline/FOSSIL_3D_SHORTS.md):
// 2-4 góc mỗi beat cắt đúng chữ, whip/flash, rung máy khi va chạm, mỗi ý một gag hình.
// Mọi mốc là giây TUYỆT ĐỐI trong r05 (whisper_words.json). Chủ thể đặt lệch phải (shift) vì Flint đứng góc dưới trái.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Box, BlockPine, V3 } from "../fossil-3d-city-test/BlockAnimals";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const TAU = Math.PI * 2;
export const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// bật ra quá tay rồi về 1 (easeOutBack), 0 trước t=0
export const popK = (t: number, d = 0.35) => {
  if (t <= 0) return 0;
  if (t >= d) return 1;
  const x = t / d - 1;
  return 1 + 2.70158 * x * x * x + 1.70158 * x * x;
};

export const OCHRE = "#D08A2E";
export const GOLD = "#E2A93B";
export const RUST = "#C4482E";

// ------------------------------------------------------------------ mốc thời gian (giây tuyệt đối)
export type CutKind = "whip" | "flash" | "cut";
export const CUTS: [number, CutKind][] = [
  [1.88, "whip"], [3.04, "flash"], [4.368, "whip"], [6.56, "flash"], [8.034, "whip"], [9.1, "cut"], [10.3, "cut"],
  [12.371, "whip"], [13.12, "cut"], [13.98, "cut"], [15.46, "flash"], [16.839, "whip"], [18.92, "cut"], [20.24, "cut"],
  [21.76, "flash"], [23.735, "flash"], [25.1, "whip"], [26.801, "whip"], [28.9, "cut"], [32.22, "flash"], [34.74, "cut"],
  [36.325, "whip"], [38.08, "cut"], [39.46, "flash"], [42.728, "whip"], [44.74, "cut"],
];
export const HITS: [number, number][] = [
  [1.98, 0.3], [2.46, 0.08], [3.46, 0.35], [7.38, 0.12], [9.35, 0.05], [10.52, 0.05], [10.78, 0.05], [11.14, 0.08],
  [15.82, 0.2], [17.7, 0.06], [18.92, 0.03], [19.28, 0.03], [19.64, 0.03], [21.88, 0.12], [24.28, 0.3], [26.22, 0.3],
  [28.28, 0.32], [30.12, 0.06], [34.34, 0.12], [35.56, 0.1], [36.48, 0.1], [39.62, 0.12], [41.14, 0.08],
];
const SEAM = 44.74;
const DAYS_LIT = [10.52, 10.78, 11.14];
const ROOM_ON = [18.92, 19.28, 19.64];

function hitEnv(T: number) {
  let e = 0;
  for (const [ht, s] of HITS) if (T >= ht) e += s * Math.exp(-(T - ht) * 9);
  return e;
}

// ------------------------------------------------------------------ môi trường (bầu trời, sương, đất, đèn)
export type Env = { top: string; hor: string; fog: [string, number, number]; ground: string | null; hemi: [string, string, number]; sunC: string; sunI: number; sunDir: V3 };
export const DAY: Env = { top: "#6FA8DC", hor: "#E9F0F2", fog: ["#DCE8EF", 80, 420], ground: "#8DB26A", hemi: ["#DDEBF7", "#6E7C58", 1.15], sunC: "#FFF1DE", sunI: 3.2, sunDir: [-0.7, 1, 0.6] };
export const DUSK: Env = { top: "#2E2846", hor: "#E08A52", fog: ["#9A6A50", 18, 140], ground: "#7A6650", hemi: ["#F0B488", "#2B2433", 0.8], sunC: "#FF9E5E", sunI: 1.6, sunDir: [0.8, 0.5, -0.6] };
export const OVERCAST: Env = { top: "#A9B8C4", hor: "#E6E6DE", fog: ["#D9DCD4", 40, 260], ground: "#7E9E5C", hemi: ["#E4EAF0", "#66724F", 1.25], sunC: "#F4EEE2", sunI: 2.2, sunDir: [-0.5, 1, 0.7] };
export const ROME: Env = { top: "#5E9BD6", hor: "#F5E3C0", fog: ["#EADBC0", 60, 320], ground: "#CDBB98", hemi: ["#E9F0F7", "#A4875E", 1.1], sunC: "#FFE0AE", sunI: 3.6, sunDir: [-0.6, 1, 0.5] };
export const DARK: Env = { top: "#0B0907", hor: "#0B0907", fog: ["#0B0907", 5, 16], ground: null, hemi: ["#B8A688", "#1A140F", 0.45], sunC: "#FFD9A0", sunI: 0.6, sunDir: [0.4, 1, 0.8] };
export const NY: Env = { top: "#A3B3BE", hor: "#EBDCC0", fog: ["#D9CDB6", 40, 220], ground: "#77706A", hemi: ["#EEE6D6", "#5C534A", 1.15], sunC: "#FFE6C0", sunI: 3.0, sunDir: [-0.6, 1, 0.7] };
export const STUDIO: Env = { top: "#EFE3C8", hor: "#EFE3C8", fog: ["#EADCC0", 10, 34], ground: "#E3D2AE", hemi: ["#FFF4E2", "#B89B74", 1.3], sunC: "#FFE9C8", sunI: 2.6, sunDir: [-0.6, 1, 0.8] };
export const SIXTIES: Env = { top: "#8FA6BC", hor: "#E1E5E6", fog: ["#D3D9DC", 80, 520], ground: "#9EA38E", hemi: ["#E6ECF2", "#6A6E5E", 1.15], sunC: "#FFF0DA", sunI: 3.0, sunDir: [-0.7, 1, 0.5] };
export const SEPIA: Env = { top: "#9DB3C6", hor: "#EEE2CC", fog: ["#E2D8C4", 90, 520], ground: "#8FA866", hemi: ["#EAE6DC", "#6E7454", 1.15], sunC: "#FFEBCB", sunI: 3.1, sunDir: [-0.6, 1, 0.6] };
export const GOLDEN: Env = { top: "#5E86C2", hor: "#F5C98C", fog: ["#EFC995", 70, 420], ground: "#9DAE6E", hemi: ["#FFE6C8", "#6E6A4E", 1.1], sunC: "#FFC98A", sunI: 3.0, sunDir: [-0.9, 0.55, 0.3] };

export const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
export const mixEnv = (a: Env, b: Env, k: number): Env => ({
  top: mixC(a.top, b.top, k), hor: mixC(a.hor, b.hor, k),
  fog: [mixC(a.fog[0], b.fog[0], k), lerp(a.fog[1], b.fog[1], k), lerp(a.fog[2], b.fog[2], k)],
  ground: mixC(a.ground ?? "#000000", b.ground ?? "#000000", k),
  hemi: [mixC(a.hemi[0], b.hemi[0], k), mixC(a.hemi[1], b.hemi[1], k), lerp(a.hemi[2], b.hemi[2], k)],
  sunC: mixC(a.sunC, b.sunC, k), sunI: lerp(a.sunI, b.sunI, k), sunDir: lerp3(a.sunDir, b.sunDir, k),
});

// ------------------------------------------------------------------ khối cơ bản
export const Glow: React.FC<{ p: V3; s: V3; c: string; i?: number; o?: number; r?: V3 }> = ({ p, s, c, i = 1.5, o = 1, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent={o < 1} opacity={o} depthWrite={o >= 1} />
  </mesh>
);
export const Gold: React.FC<{ p: V3; s: V3; r?: V3; glow?: number }> = ({ p, s, r, glow = 0.25 }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={GOLD} emissive="#7A4C00" emissiveIntensity={glow} roughness={0.45} metalness={0.25} flatShading />
  </mesh>
);
export const Cyl: React.FC<{ p: V3; r: number; h: number; c: string; rot?: V3; seg?: number; glow?: number }> = ({ p, r, h, c, rot, seg = 10, glow = 0 }) => (
  <mesh position={p} rotation={rot ?? [0, 0, 0]} castShadow receiveShadow>
    <cylinderGeometry args={[r, r, h, seg]} />
    <meshStandardMaterial color={c} emissive={glow > 0 ? "#7A4C00" : "#000000"} emissiveIntensity={glow} roughness={0.6} flatShading />
  </mesh>
);
export const Coin: React.FC<{ p: V3; r?: number; rot?: V3 }> = ({ p, r = 0.3, rot }) => <Cyl p={p} r={r} h={r * 0.2} c={GOLD} rot={rot} seg={12} glow={0.25} />;

// ------------------------------------------------------------------ người khối (quay mặt về +Z, đất y=0)
type Act = "none" | "hoe" | "slump" | "carry" | "cheer";
export const BlockPerson: React.FC<{ t: number; walk?: number; act?: Act; shirt?: string; pants?: string; skin?: string; hair?: string; phase?: number; hat?: string }> = ({
  t, walk = 0, act = "none", shirt = "#5A7FA6", pants = "#3E3A36", skin = "#E2B48A", hair = "#3B2A1E", phase = 0, hat,
}) => {
  const ph = t * TAU / 1.1 + phase;
  const sw = 0.5 * walk * Math.sin(ph);
  const bob = walk * 0.03 * Math.abs(Math.sin(ph));
  let armL = -sw, armR = sw, lean = 0, armZ = 0.08;
  if (act === "hoe") {
    const k = 0.5 + 0.5 * Math.sin(t * TAU / 1.2 + phase);
    armL = armR = lerp(-0.5, -2.5, k * k);
    lean = lerp(0.25, -0.05, k);
  } else if (act === "slump") {
    lean = 0.28;
    armL = armR = 0.1;
  } else if (act === "carry") {
    lean = 0.35;
    armL = armR = -2.7;
  } else if (act === "cheer") {
    armL = armR = -2.9 + 0.2 * Math.sin(t * 9);
    armZ = 0.3;
  }
  return (
    <group position={[0, bob, 0]}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.11 * sd, 0.85, 0]} rotation={[sd * sw, 0, 0]}>
          <Box p={[0, -0.42, 0]} s={[0.17, 0.85, 0.19]} c={pants} />
          <Box p={[0, -0.82, 0.05]} s={[0.18, 0.08, 0.28]} c="#2B2420" />
        </group>
      ))}
      <group position={[0, 0.85, 0]} rotation={[lean, 0, 0]}>
        <Box p={[0, 0.32, 0]} s={[0.46, 0.62, 0.26]} c={shirt} />
        <group position={[0, 0.82, 0]}>
          <Box p={[0, 0, 0]} s={[0.32, 0.34, 0.3]} c={skin} />
          <Box p={[0, 0.17, -0.02]} s={[0.34, 0.1, 0.33]} c={hair} />
          <Box p={[0, 0.04, -0.15]} s={[0.34, 0.26, 0.06]} c={hair} />
          {[-0.075, 0.075].map((x) => <Box key={x} p={[x, 0.03, 0.155]} s={[0.05, 0.06, 0.02]} c="#1E1A18" />)}
          <Box p={[0, -0.09, 0.155]} s={[0.1, 0.025, 0.02]} c="#7A4A3A" />
          {hat && <Box p={[0, 0.26, 0]} s={[0.46, 0.08, 0.46]} c={hat} />}
          {hat && <Box p={[0, 0.34, 0]} s={[0.28, 0.14, 0.28]} c={hat} />}
        </group>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.3 * sd, 0.58, 0]} rotation={[sd < 0 ? armL : armR, 0, sd * armZ]}>
            <Box p={[0, -0.27, 0]} s={[0.13, 0.56, 0.15]} c={shirt} />
            <Box p={[0, -0.6, 0]} s={[0.12, 0.12, 0.13]} c={skin} />
          </group>
        ))}
        {act === "hoe" && (
          <group position={[0, 0.58, 0]} rotation={[armR, 0, 0]}>
            <Box p={[0, -0.62, 0.55]} s={[0.05, 0.05, 1.3]} c="#8A6440" />
            <Box p={[0, -0.78, 1.2]} s={[0.24, 0.3, 0.04]} c="#7D8288" />
          </group>
        )}
        {act === "carry" && <Gold p={[0, 0.95, -0.05]} s={[0.9, 0.4, 0.5]} glow={0.35} />}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ chữ khối 3x5 (rơi xuống, rồi vỡ vụn)
const FONT: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"], "3": ["111", "001", "111", "001", "111"],
  "%": ["101", "001", "010", "100", "101"],
};
export const Voxels: React.FC<{ text: string; v: number; c: string; fall: number; crumble: number; drop?: number }> = ({ text, v, c, fall, crumble, drop = 26 }) => {
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    [...text].forEach((ch, gi) => FONT[ch].forEach((row, r) => [...row].forEach((b, x) => b === "1" && out.push([gi * 4 + x, 4 - r]))));
    return out;
  }, [text]);
  const W = (text.length * 4 - 1) * v;
  if (fall < 0) return null;
  const kd = clamp01(fall / 0.25);
  const yOff = drop * (1 - kd * kd);
  const squash = fall > 0.25 ? 1 - 0.18 * Math.exp(-(fall - 0.25) * 10) * Math.cos((fall - 0.25) * 30) : 1;
  const g = 9.8 * (v / 0.6);
  return (
    <group position={[0, yOff, 0]} scale={[1, squash, 1]}>
      {cells.map(([gx, gy], i) => {
        let p: V3 = [gx * v - W / 2 + v / 2, gy * v + v / 2, 0];
        let r: V3 = [0, 0, 0];
        if (crumble > 0) {
          const tt = crumble - gy * 0.03;
          if (tt > 0) {
            const vx = (hash(i) - 0.5) * 3 * v, vz = (0.4 + hash(i + 7)) * 2.2 * v, vy = (0.5 + hash(i + 3)) * 2 * v;
            let y = p[1] + vy * tt - 0.5 * g * tt * tt;
            const landed = y < v / 2;
            if (landed) y = v / 2;
            const tm = landed ? Math.min(tt, (vy + Math.sqrt(vy * vy + 2 * g * (p[1] - v / 2))) / g) : tt;
            p = [p[0] + vx * tm, y, vz * tm];
            r = [tm * 3 * hash(i + 1), tm * 2 * hash(i + 2), tm * 4 * (hash(i + 5) - 0.5)];
          }
        }
        return <Box key={i} p={p} s={[v * 0.96, v * 0.96, v * 0.96]} c={c} r={r} />;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ đạo cụ
export const Gavel: React.FC<{ a: number }> = ({ a }) => (
  <group rotation={[0, 0, -a]}>
    <Box p={[-1.5, 0, 0]} s={[3, 0.16, 0.16]} c="#8A5A34" />
    <Box p={[-3.1, 0, 0]} s={[0.6, 0.6, 1.3]} c="#6B3F22" />
    {[0.45, -0.45].map((z) => <Box key={z} p={[-3.1, 0, z]} s={[0.64, 0.64, 0.1]} c="#C9A15A" />)}
  </group>
);
// góc búa: nhấc lên chậm, rơi nhanh đúng t0, nảy nhẹ
export const gavelAngle = (t: number, t0: number) => {
  if (t < t0 - 0.16) return lerp(0.6, 1.25, ease((t - (t0 - 1.0)) / 0.84));
  if (t < t0) return 1.25 * (1 - ((t - (t0 - 0.16)) / 0.16) ** 2);
  return 0.14 * Math.exp(-(t - t0) * 7) * Math.abs(Math.sin((t - t0) * 14));
};

export const Burst: React.FC<{ t: number; c?: string; n?: number; s0?: number; sp?: number }> = ({ t, c = "#E9DCC2", n = 26, s0 = 0.22, sp = 1 }) => {
  if (t < 0 || t > 1.4) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i) * TAU, v = (2 + 4 * hash(i + 2)) * sp;
        const y = 0.1 + (1.5 + 2 * hash(i + 4)) * sp * t - 3 * sp * t * t;
        const s = s0 * (1 - t / 1.4);
        return <Box key={i} p={[Math.cos(a) * v * t * 0.6, Math.max(0.05, y), Math.sin(a) * v * t * 0.6]} s={[s, s, s]} c={c} />;
      })}
    </>
  );
};

export const Bill: React.FC<{ p: V3; r?: V3 }> = ({ p, r }) => (
  <group position={p} rotation={r ?? [0, 0, 0]}>
    <Box p={[0, 0, 0]} s={[0.72, 0.012, 0.32]} c="#8DAE74" />
    <Box p={[0, 0.004, 0]} s={[0.46, 0.012, 0.18]} c="#6E9158" />
  </group>
);

export const Piggy: React.FC<{ sq: number }> = ({ sq }) => (
  <group scale={[1 + 0.5 * sq, 1 - sq, 1 + 0.5 * sq]}>
    <Box p={[0, 0.95, 0]} s={[1.6, 1.1, 1.05]} c="#E9A0A8" />
    <Box p={[0.9, 0.95, 0]} s={[0.25, 0.4, 0.45]} c="#E58A94" />
    {[0.1, -0.1].map((z) => <Box key={z} p={[1.03, 0.95, z]} s={[0.02, 0.1, 0.06]} c="#7A3A44" />)}
    {[0.3, -0.3].map((z) => <Box key={z} p={[0.5, 1.6, z]} s={[0.22, 0.26, 0.16]} c="#E58A94" />)}
    {[0.53, -0.53].map((z) => <Box key={z} p={[0.6, 1.15, z]} s={[0.08, 0.1, 0.02]} c="#1E1A18" />)}
    {[[-0.5, 0.32], [-0.5, -0.32], [0.5, 0.32], [0.5, -0.32]].map(([x, z], i) => <Box key={i} p={[x, 0.22, z]} s={[0.25, 0.44, 0.25]} c="#E58A94" />)}
    <Box p={[-0.1, 1.51, 0]} s={[0.5, 0.02, 0.09]} c="#3A1A20" />
    <Box p={[-0.86, 1.1, 0]} s={[0.12, 0.12, 0.06]} c="#E58A94" r={[0, 0, 0.6]} />
  </group>
);

// ------------------------------------------------------------------ nhà cửa (mặt tiền quay về +Z)
export const BlockTree: React.FC<{ h?: number; c?: string }> = ({ h = 4, c = "#5E8F4A" }) => (
  <group>
    <Box p={[0, h * 0.3, 0]} s={[0.35, h * 0.6, 0.35]} c="#7A5536" />
    <Box p={[0, h * 0.72, 0]} s={[2, 1.6, 2]} c={c} />
    <Box p={[0, h * 0.72 + 1, 0]} s={[1.3, 0.9, 1.3]} c={c} />
  </group>
);

export const ModernHouse: React.FC<{ c?: string; roof?: string }> = ({ c = "#F1E6D2", roof = "#59616B" }) => (
  <group>
    <Box p={[0, 2.4, 0]} s={[8, 4.8, 7]} c={c} />
    <Box p={[0, 5.2, 0]} s={[7.9, 0.8, 6]} c={c} />
    <Box p={[0, 5.9, 0]} s={[7.9, 0.7, 3.8]} c={c} />
    <Box p={[0, 6.5, 0]} s={[7.9, 0.6, 1.7]} c={c} />
    <Box p={[0, 5.75, 1.875]} s={[8.6, 0.3, 4.4]} r={[0.55, 0, 0]} c={roof} />
    <Box p={[0, 5.75, -1.875]} s={[8.6, 0.3, 4.4]} r={[-0.55, 0, 0]} c={roof} />
    <Box p={[2.5, 6.8, -1]} s={[0.7, 1.8, 0.7]} c="#9C5B44" />
    <Box p={[0.8, 1.1, 3.52]} s={[1.2, 2.2, 0.08]} c="#7A4A2E" />
    <Box p={[0.8, 0.1, 4.0]} s={[2, 0.2, 1]} c="#C9C1B2" />
    {[-2.4, 2.9].map((x) => (
      <group key={x}>
        <Box p={[x, 2.6, 3.51]} s={[1.8, 1.5, 0.06]} c="#FFFFFF" />
        <Box p={[x, 2.6, 3.53]} s={[1.5, 1.2, 0.06]} c="#9CC8E4" />
      </group>
    ))}
  </group>
);

export const ForRentSign: React.FC = () => (
  <group>
    <Box p={[0, 0.85, 0]} s={[0.1, 1.7, 0.1]} c="#E9E3D8" />
    <Box p={[0.45, 1.62, 0]} s={[1.0, 0.08, 0.08]} c="#E9E3D8" />
    <Box p={[0.6, 1.2, 0]} s={[1.1, 0.7, 0.05]} c="#D23B2A" />
    <Box p={[0.6, 1.32, 0.03]} s={[0.85, 0.16, 0.01]} c="#F5F1E8" />
    <Box p={[0.6, 1.1, 0.03]} s={[0.6, 0.1, 0.01]} c="#F5F1E8" />
  </group>
);

export const SlabTower: React.FC<{ w?: number; h?: number; d?: number }> = ({ w = 30, h = 33, d = 10 }) => (
  <group>
    <Box p={[0, h / 2, 0]} s={[w, h, d]} c="#BDB8AC" />
    {Array.from({ length: Math.floor(h / 3) }, (_, i) => (
      <React.Fragment key={i}>
        <Box p={[0, 2 + i * 3, d / 2 + 0.03]} s={[w - 1.2, 1.2, 0.06]} c="#4E5A63" />
        {i % 3 === 1 && <Box p={[0, 2 + i * 3, d / 2 + 0.7]} s={[w - 1.2, 0.2, 1.4]} c="#A7A296" />}
      </React.Fragment>
    ))}
    <Box p={[0, h + 0.4, 0]} s={[w + 0.4, 0.8, d + 0.4]} c="#9E998E" />
  </group>
);

export const Tenement: React.FC<{ c: string; floors?: number; w?: number; t: number }> = ({ c, floors = 5, w = 7, t }) => {
  const H = floors * 3 + 1;
  return (
    <group>
      <Box p={[0, H / 2, 0]} s={[w, H, 8]} c={c} />
      <Box p={[0, H + 0.3, 0.2]} s={[w + 0.3, 0.6, 8.4]} c="#5E3A2A" />
      {Array.from({ length: floors }, (_, f) => (
        <group key={f}>
          {[-2.2, 0, 2.2].map((x) => <Box key={x} p={[x, 2.4 + f * 3, 4.03]} s={[1, 1.6, 0.06]} c={(f + x) % 2 ? "#2E3640" : "#E8C987"} />)}
          {f > 0 && (
            <>
              <Box p={[-1.1, 1.2 + f * 3, 4.5]} s={[4.4, 0.08, 1]} c="#1E1E20" />
              <Box p={[-1.1, 1.5 + f * 3, 4.98]} s={[4.4, 0.5, 0.04]} c="#1E1E20" />
              <Box p={[-1.6, 2.7 + f * 3 - 3, 4.6]} s={[0.08, 3.4, 0.6]} c="#1E1E20" r={[0, 0, 0.5]} />
            </>
          )}
        </group>
      ))}
      <Box p={[1.8, 0.4, 4.6]} s={[1.6, 0.8, 1.2]} c="#8A7F72" />
      {/* dây phơi đồ phấp phới */}
      {[4, 7, 10].map((y, i) => (
        <group key={y} position={[-0.5, y + 1.6, 6.5]}>
          {[-1.4, -0.4, 0.6, 1.5].map((x, j) => (
            <Box key={x} p={[x, -0.35, 0]} s={[0.6, 0.7, 0.04]} c={["#E8E2D4", "#B4462C", "#5A7FA6", "#D9C27A"][(i + j) % 4]} r={[0.25 * Math.sin(t * 3 + i + j), 0, 0]} />
          ))}
        </group>
      ))}
    </group>
  );
};

export const Insula: React.FC<{ c: string; floors?: number; w?: number }> = ({ c, floors = 5, w = 12 }) => {
  const H = floors * 3;
  return (
    <group>
      <Box p={[0, H / 2, 0]} s={[w, H, 8]} c={c} />
      <Box p={[0, H + 0.25, 0]} s={[w + 0.8, 0.5, 8.8]} c="#A9472E" />
      {Array.from({ length: floors }, (_, f) => (
        <group key={f}>
          <Box p={[0, f * 3, 4.03]} s={[w, 0.2, 0.06]} c="#E8D2B0" />
          {f === 0
            ? [-3.6, 0, 3.6].map((x) => <Box key={x} p={[x, 1.2, 4.04]} s={[2.2, 2.4, 0.06]} c="#2A1E18" />)
            : [-4, -1.3, 1.3, 4].map((x) => <Box key={x} p={[x, f * 3 + 1.4, 4.04]} s={[0.7, 1.0, 0.06]} c="#2A1E18" />)}
        </group>
      ))}
      <Box p={[0, 6.2, 4.6]} s={[w * 0.7, 0.15, 1.2]} c="#7A5236" />
      <Box p={[0, 6.6, 5.15]} s={[w * 0.7, 0.6, 0.08]} c="#7A5236" />
    </group>
  );
};

export const Castle: React.FC = () => (
  <group>
    <Box p={[0, 4, 0]} s={[6, 8, 6]} c="#9A968C" />
    {Array.from({ length: 4 }, (_, s) => Array.from({ length: 4 }, (_, i) => {
      const off = -2.25 + i * 1.5;
      const p: V3 = s === 0 ? [off, 8.3, 2.8] : s === 1 ? [off, 8.3, -2.8] : s === 2 ? [2.8, 8.3, off] : [-2.8, 8.3, off];
      return <Box key={`${s}${i}`} p={p} s={[0.6, 0.6, 0.6]} c="#8E8A80" />;
    }))}
    {[[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <Box p={[0, 5, 0]} s={[2.2, 10, 2.2]} c="#A39F94" />
        <Box p={[0, 10.4, 0]} s={[2.6, 0.8, 2.6]} c="#8E8A80" />
        <Box p={[0, 11.6, 0]} s={[1.6, 1.6, 1.6]} c="#6E4A3A" />
      </group>
    ))}
    <Box p={[0, 1.4, 3.03]} s={[1.6, 2.8, 0.06]} c="#3A2A20" />
    <Box p={[0, 13.4, 3.2]} s={[0.05, 2, 0.05]} c="#5A4A3A" />
    <Box p={[0.45, 14, 3.2]} s={[0.9, 0.55, 0.03]} c="#B4462C" />
  </group>
);

export const Cottage: React.FC = () => (
  <group>
    <Box p={[0, 1.3, 0]} s={[5, 2.6, 4]} c="#D9C7A3" />
    {[-2.4, -0.8, 0.8, 2.4].map((x) => <Box key={x} p={[x, 1.3, 2.02]} s={[0.18, 2.6, 0.06]} c="#5A3E2A" />)}
    <Box p={[0, 2.5, 2.02]} s={[5, 0.18, 0.06]} c="#5A3E2A" />
    <Box p={[0, 2.95, 0]} s={[5.6, 0.7, 4.6]} c="#C9A65A" />
    <Box p={[0, 3.55, 0]} s={[5.4, 0.6, 3.2]} c="#BE9A4E" />
    <Box p={[0, 4.05, 0]} s={[5.2, 0.45, 1.6]} c="#C9A65A" />
    <Box p={[0.2, 0.9, 2.04]} s={[0.9, 1.8, 0.06]} c="#4A3222" />
  </group>
);

export const Cave: React.FC = () => (
  <group>
    <Box p={[0, 3, -3]} s={[13, 6, 6]} c="#6B5D4F" />
    <Box p={[-4.4, 2, 0.8]} s={[4, 4, 4]} c="#7D6E5E" r={[0, 0.15, 0]} />
    <Box p={[4.2, 1.8, 0.8]} s={[3.6, 3.6, 4]} c="#756656" r={[0, -0.1, 0]} />
    <Box p={[0, 4.7, 1.0]} s={[9.5, 2.2, 4.4]} c="#81725F" />
    <Box p={[0, 1.7, -0.6]} s={[4.8, 3.4, 1.2]} c="#1C1714" />
    {[[-3, 6.1, 0], [2.5, 6.2, -0.5], [0, 6.6, -2], [5, 4.5, 0.6]].map(([x, y, z], i) => (
      <Box key={i} p={[x, y, z]} s={[2.4, 1.4, 2.6]} c={i % 2 ? "#6E604F" : "#8A7B66"} r={[0.1, i, 0.12]} />
    ))}
  </group>
);

export const Campfire: React.FC<{ T: number; flare: number }> = ({ T, flare }) => (
  <group>
    {Array.from({ length: 7 }, (_, i) => <Box key={i} p={[Math.cos(i * 0.9) * 0.6, 0.1, Math.sin(i * 0.9) * 0.6]} s={[0.28, 0.2, 0.28]} c="#6E6458" r={[0, i, 0]} />)}
    {[0, 1.05, 2.1].map((a) => <Box key={a} p={[0, 0.15, 0]} s={[1.0, 0.16, 0.16]} c="#5A3A22" r={[0, a, 0]} />)}
    {Array.from({ length: 5 }, (_, i) => {
      const h = (0.45 + 0.25 * Math.sin(T * 13 + i * 2) + 0.15 * Math.sin(T * 21 + i)) * (1 + 0.9 * flare);
      return <Glow key={i} p={[Math.cos(i * 1.3) * 0.18, 0.25 + h / 2, Math.sin(i * 1.3) * 0.18]} s={[0.22, h, 0.22]} c={i % 2 ? "#FF8A2A" : "#FFD25A"} i={2.6} r={[0, i, 0]} />;
    })}
    <pointLight position={[0, 0.9, 0]} color="#FF9A4A" intensity={(14 + 4 * Math.sin(T * 17)) * (1 + 1.5 * flare)} distance={20} decay={1.6} />
  </group>
);

export const Villa: React.FC = () => (
  <group>
    <Box p={[0, 1.3, 0]} s={[6, 2.6, 4]} c="#EFE8DA" />
    <Box p={[0, 2.85, 0.4]} s={[6.8, 0.5, 5.2]} c="#B5553A" />
    <Box p={[0, 3.3, 0.4]} s={[5.6, 0.4, 3.4]} c="#A84C34" />
    {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => <Box key={x} p={[x, 1.25, 2.5]} s={[0.25, 2.5, 0.25]} c="#F6F1E6" />)}
    <Box p={[0, 0.1, 2.5]} s={[6.4, 0.2, 1.4]} c="#D9D0BE" />
    <Box p={[0, 1, 2.03]} s={[1, 2, 0.06]} c="#6B4A2E" />
  </group>
);
export const Cypress: React.FC<{ h?: number }> = ({ h = 5 }) => (
  <group>
    <Box p={[0, h * 0.45, 0]} s={[0.9, h * 0.8, 0.9]} c="#2F5A3A" />
    <Box p={[0, h * 0.9, 0]} s={[0.5, h * 0.25, 0.5]} c="#2B5234" />
  </group>
);

export const Capitol: React.FC = () => (
  <group>
    <Box p={[0, 4, 0]} s={[44, 8, 12]} c="#EEECE6" />
    {[-1, 1].map((sd) => Array.from({ length: 8 }, (_, i) => (
      <React.Fragment key={`${sd}${i}`}>
        <Box p={[sd * (9 + i * 1.6), 3, 6.03]} s={[0.8, 1.6, 0.06]} c="#56606A" />
        <Box p={[sd * (9 + i * 1.6), 6, 6.03]} s={[0.8, 1.6, 0.06]} c="#56606A" />
      </React.Fragment>
    )))}
    <Box p={[0, 1, 9]} s={[14, 2, 6]} c="#E2DED5" />
    {Array.from({ length: 8 }, (_, i) => <Box key={i} p={[-5.6 + i * 1.6, 5, 7]} s={[0.7, 6, 0.7]} c="#F7F5F0" />)}
    <Box p={[0, 8.6, 7]} s={[14.5, 1.2, 1.6]} c="#E8E5DE" />
    <Box p={[0, 9.6, 7]} s={[10, 0.8, 1.4]} c="#E8E5DE" />
    <Box p={[0, 9.5, 0]} s={[13, 3, 12]} c="#E8E5DE" />
    <Box p={[0, 12, 0]} s={[10.5, 2.2, 10.5]} c="#F2F0EA" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * TAU;
      return <Box key={i} p={[Math.sin(a) * 5.4, 12, Math.cos(a) * 5.4]} s={[0.4, 2.2, 0.4]} c="#FFFFFF" />;
    })}
    {[[14.3, 9, 1.6], [15.8, 7.5, 1.4], [17, 5.5, 1.2], [18, 3.5, 1]].map(([y, w, h], i) => <Box key={i} p={[0, y, 0]} s={[w, h, w]} c="#F4F2EC" />)}
    <Box p={[0, 19.2, 0]} s={[1.4, 1.6, 1.4]} c="#ECE9E2" />
    <Box p={[0, 20.4, 0]} s={[0.5, 1, 0.5]} c="#7A7F78" />
  </group>
);

// cửa sổ khối dùng chung cho 3 phòng trọ cắt dọc
const Rooms3: React.FC<{ T: number }> = ({ T }) => (
  <group>
    {[-1, 0, 1].map((i) => {
      const on = clamp01((T - ROOM_ON[i + 1]) / 0.08);
      const x = i * 2.4;
      return (
        <group key={i} position={[x, 0, 0]}>
          <Box p={[0, 0.05, 0]} s={[2.2, 0.1, 2.4]} c="#7A5A40" />
          <Box p={[0, 1.3, -1.2]} s={[2.2, 2.5, 0.1]} c={mixC("#5E554A", "#E6D2A8", on)} />
          <Box p={[0, 2.55, 0]} s={[2.4, 0.1, 2.5]} c="#4A3A2E" />
          <Box p={[-1.15, 1.3, 0]} s={[0.1, 2.6, 2.5]} c="#8E4A36" />
          <Box p={[1.15, 1.3, 0]} s={[0.1, 2.6, 2.5]} c="#8E4A36" />
          <Glow p={[0, 2.42, 0]} s={[0.16, 0.16, 0.16]} c="#FFE2A0" i={on * 4 + 0.1} />
          {on > 0 && <pointLight position={[0, 2.1, 0.3]} color="#FFD999" intensity={5 * on} distance={4} decay={1.5} />}
          {i === -1 && <Box p={[-0.4, 0.3, -0.5]} s={[1.2, 0.4, 1.2]} c="#D9D0BE" />}
          {i === 0 && <><Box p={[0, 0.45, -0.3]} s={[0.9, 0.08, 0.6]} c="#8A6440" /><Box p={[0, 0.22, -0.3]} s={[0.08, 0.44, 0.08]} c="#8A6440" /></>}
          {i === 1 && <Box p={[0.3, 0.6, -0.9]} s={[0.9, 1.0, 0.4]} c="#6B4A2E" />}
          <group position={[i * 0.2, 0.1, 0.4]} scale={i === 0 ? 0.62 : 0.85}>
            <BlockPerson t={T} act={i === 1 ? "slump" : "none"} shirt={["#B4462C", "#D9C27A", "#5A7FA6"][i + 1]} phase={i} />
          </group>
        </group>
      );
    })}
    <Box p={[0, -0.2, 0]} s={[7.6, 0.3, 2.8]} c="#8E4A36" />
    <Box p={[0, 2.85, 0]} s={[7.6, 0.5, 2.8]} c="#8E4A36" />
  </group>
);

export const Table: React.FC = () => (
  <group>
    <Box p={[0, 0.78, 0]} s={[4.6, 0.08, 2.4]} c="#A7774A" />
    {[[-2.1, -1.0], [2.1, -1.0], [-2.1, 1.0], [2.1, 1.0]].map(([x, z], i) => <Box key={i} p={[x, 0.37, z]} s={[0.12, 0.74, 0.12]} c="#8A603A" />)}
  </group>
);

const Grid100: React.FC<{ n: number; extra: number; T: number }> = ({ n, extra, T }) => (
  <group>
    <Box p={[0, 0.2, 0]} s={[4.2, 0.4, 1]} c="#C9B48E" />
    {Array.from({ length: 100 }, (_, i) => {
      const col = i % 10, row = Math.floor(i / 10);
      const lit = i < n ? 1 : i < 25 + extra && i >= 25 ? 1 : 0;
      const isExtra = i >= 25 && i < 30;
      const tOn = i < 25 ? 28.95 + (i / 25) * 1.17 : 33.52 + ((i - 25) / 5) * 0.82;
      const s = lit ? 0.3 * (0.7 + 0.3 * popK(T - tOn, 0.25)) : 0.3;
      const z = isExtra ? 0.45 * clamp01((T - tOn) / 0.15) : 0;
      return <Box key={i} p={[(col - 4.5) * 0.35, 0.6 + row * 0.35, z]} s={[s, s, s]} c={lit ? (isExtra && extra > 0 ? RUST : OCHRE) : "#F3EAD9"} />;
    })}
  </group>
);

// ------------------------------------------------------------------ bối cảnh lớn
export const Street: React.FC = () => {
  const trees = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 14 }, (_, i) => ({ x: (i - 7) * 7 + r() * 2, z: -8 - r() * 12, h: 4 + r() * 3 }));
  }, []);
  return (
    <>
      <Box p={[0, 0.02, 13]} s={[200, 0.04, 7]} c="#5E6268" />
      {Array.from({ length: 20 }, (_, i) => <Box key={i} p={[-50 + i * 5, 0.05, 13]} s={[2, 0.02, 0.2]} c="#E9E3D2" />)}
      <Box p={[0, 0.05, 9]} s={[200, 0.1, 1.6]} c="#C9C4B8" />
      <ModernHouse />
      <group position={[-12, 0, -1]}><ModernHouse c="#C9D8E2" roof="#6B4A3A" /></group>
      <group position={[12, 0, -1]}><ModernHouse c="#E7D3B4" roof="#4E5A63" /></group>
      <group position={[2.4, 0, 6.0]}><ForRentSign /></group>
      {trees.map((t, i) => <group key={i} position={[t.x, 0, t.z]}><BlockTree h={t.h} /></group>)}
      <group position={[-5.5, 0, 6]}><BlockTree h={3.5} c="#6E9A4E" /></group>
    </>
  );
};

const Medieval: React.FC<{ T: number }> = ({ T }) => (
  <>
    <group position={[-14, 0, -45]}>
      <Box p={[0, 1.5, 0]} s={[40, 3, 30]} c="#7C9E52" />
      <Box p={[0, 4, -2]} s={[24, 2, 20]} c="#86A85A" />
      <Box p={[0, 5.5, -3]} s={[14, 1, 12]} c="#7C9E52" />
      <group position={[0, 6, -3]}><Castle /></group>
    </group>
    <group position={[6, 0, -6]} rotation={[0, -0.3, 0]}><Cottage /></group>
    <group position={[-7, 0, -9]} rotation={[0, 0.4, 0]}><Cottage /></group>
    {Array.from({ length: 16 }, (_, i) => <Box key={i} p={[-30 + i * 4, 0.03, 8]} s={[4, 0.06, 26]} c={i % 2 ? "#9C8A5A" : "#7FA35A"} />)}
    {Array.from({ length: 12 }, (_, i) => <Box key={`f${i}`} p={[-11 + i * 2, 0.45, -3]} s={[1.9, 0.08, 0.08]} c="#7A5A3A" />)}
    {Array.from({ length: 13 }, (_, i) => <Box key={`fp${i}`} p={[-12 + i * 2, 0.4, -3]} s={[0.12, 0.8, 0.12]} c="#6A4A2E" />)}
    {[[-20, -20], [14, -18], [22, -30], [-28, -12], [30, -14]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><BlockTree h={5} c="#5A8442" /></group>)}
    <group position={[-4, 0, 6]} rotation={[0, 0.8, 0]}><BlockPerson t={T} act="hoe" shirt="#8A7A5A" pants="#5A4A3A" hair="#6A4A2E" phase={1.3} /></group>
  </>
);

const RomeSet: React.FC<{ T: number }> = ({ T }) => (
  <>
    <Box p={[0, 0.03, 4]} s={[120, 0.06, 6]} c="#B9A47E" />
    <group position={[0, 0, -8]}><Insula c="#C8754A" /></group>
    <group position={[-14, 0, -7]}><Insula c="#D69A5B" floors={4} w={11} /></group>
    <group position={[14, 0, -9]}><Insula c="#B9644A" floors={6} /></group>
    {[0, 1, 2].map((i) => {
      const x = -8 + ((T * 1.1 + i * 7) % 24);
      return (
        <group key={i} position={[x, 0, 2 + i * 1.2]} rotation={[0, Math.PI / 2, 0]}>
          <BlockPerson t={T} walk={1} shirt={i === 1 ? "#A8402E" : "#EDE6D8"} pants={i === 1 ? "#A8402E" : "#EDE6D8"} phase={i * 2} />
        </group>
      );
    })}
  </>
);

const DarkRoom: React.FC<{ T: number; coins: number }> = ({ T, coins }) => (
  <>
    <Box p={[0, 0, 0]} s={[3.4, 0.1, 3.4]} c="#4A3B30" />
    <Box p={[0, 1.4, -1.6]} s={[3.4, 2.8, 0.12]} c="#5B4C40" />
    <Box p={[-1.6, 1.4, 0]} s={[0.12, 2.8, 3.4]} c="#54463A" />
    <Box p={[1.6, 1.4, 0]} s={[0.12, 2.8, 3.4]} c="#54463A" />
    <Box p={[0, 2.8, 0]} s={[3.4, 0.12, 3.4]} c="#3E3228" />
    <Glow p={[0.7, 1.9, -1.53]} s={[0.4, 0.36, 0.02]} c="#FFE7B0" i={2.2} />
    <Glow p={[0.6, 1.15, -0.9]} s={[0.36, 1.8, 0.3]} c="#FFE7B0" i={1} o={0.1} r={[0.55, 0, 0]} />
    <pointLight position={[0.6, 1.7, -1.1]} color="#FFD9A0" intensity={2.5} distance={5} decay={1.4} />
    <Box p={[-0.8, 0.25, -0.7]} s={[1.3, 0.4, 0.8]} c="#6B5440" />
    <Box p={[-0.8, 0.5, -0.7]} s={[1.2, 0.1, 0.7]} c="#A8946E" />
    {coins === 0 && <group position={[-0.2, 0, -0.3]} rotation={[0, 0.5, 0]}><BlockPerson t={T} act="slump" shirt="#D8CFBD" pants="#D8CFBD" hair="#3A2A20" /></group>}
    {coins > 0 && (
      <>
        {Array.from({ length: 12 }, (_, i) => {
          const tOn = 14.0 + i * 0.1;
          const n = Math.round(8 * clamp01((T - tOn) / 0.35));
          const x = -0.55 + (i % 4) * 0.36, z = 0.3 + Math.floor(i / 4) * 0.36;
          return Array.from({ length: n }, (_, k) => <Coin key={`${i}-${k}`} p={[x, 0.07 + k * 0.042, z]} r={0.13} />);
        })}
        <pointLight position={[0, 0.8, 0.8]} color="#FFC861" intensity={3 * coins} distance={4} decay={1.4} />
      </>
    )}
  </>
);

const NYSet: React.FC<{ T: number }> = ({ T }) => (
  <>
    <Box p={[0, 0.03, 8]} s={[120, 0.06, 8]} c="#6A625A" />
    <Box p={[0, 0.08, 4.6]} s={[120, 0.16, 1.4]} c="#9A9286" />
    {[-14, -7, 0, 7, 14, 21, -21].map((x, i) => (
      <group key={x} position={[x, 0, 0]}><Tenement c={["#8E4A36", "#A35A3E", "#7D4433", "#96553A"][i % 4]} floors={5 + (i % 2)} t={T + i} /></group>
    ))}
    <group position={[3, 0, 8]}>
      <Box p={[0, 0.9, 0]} s={[2.6, 0.5, 1.4]} c="#7A5236" />
      {[[-0.9, 0.75], [-0.9, -0.75], [0.9, 0.75], [0.9, -0.75]].map(([x, z], i) => <Cyl key={i} p={[x, 0.45, z]} r={0.45} h={0.1} c="#4A3222" rot={[Math.PI / 2, 0, 0]} />)}
      <Box p={[0, 1.4, 0]} s={[1.6, 0.5, 1]} c="#C9A66B" />
    </group>
    {[0, 1, 2].map((i) => {
      const x = 10 - ((T * 1.2 + i * 9) % 26);
      return (
        <group key={i} position={[x, 0, 6.5 + i]} rotation={[0, -Math.PI / 2, 0]}>
          <BlockPerson t={T} walk={1} shirt={["#4A4E5A", "#7A3A2E", "#5A6A4A"][i]} hat="#2A2626" phase={i * 2} />
        </group>
      );
    })}
  </>
);

const SlabSet: React.FC = () => (
  <>
    <Box p={[0, 0.03, 14]} s={[90, 0.06, 18]} c="#8E9088" />
    <group position={[0, 0, -6]}><SlabTower /></group>
    <group position={[-40, 0, -24]}><SlabTower w={28} /></group>
    <group position={[38, 0, -34]} rotation={[0, -0.3, 0]}><SlabTower w={26} /></group>
    {Array.from({ length: 10 }, (_, i) => <group key={i} position={[-30 + i * 7, 0, 22 + (i % 2) * 3]}><BlockTree h={4} c="#6E8A50" /></group>)}
  </>
);

export const CitySet: React.FC<{ red: number }> = ({ red }) => {
  const towers = useMemo(() => {
    const r = rng(21);
    const out: { x: number; z: number; w: number; h: number; c: string }[] = [];
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
      const h = 12 + r() * r() * 70;
      out.push({ x: i * 14 + (r() - 0.5) * 3, z: j * 14 + (r() - 0.5) * 3, w: 6 + r() * 4, h, c: ["#B9C3CC", "#9FAAB4", "#D5D2C8", "#8C98A4", "#C8BFAE"][Math.floor(r() * 5)] });
    }
    return out;
  }, []);
  return (
    <>
      {towers.map((t, i) => {
        // "một nửa người thuê trả nhiều hơn": nửa trái thành phố đỏ dần, quét từ mép trái vào giữa
        const k = clamp01((-60 + 62 * red - t.x) / 8);
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <Box p={[0, t.h / 2, 0]} s={[t.w, t.h, t.w]} c={mixC(t.c, "#D2553E", 0.9 * k)} />
            <Box p={[0, t.h / 2, t.w / 2 + 0.03]} s={[t.w * 0.3, t.h * 0.9, 0.06]} c="#5C6E80" />
            {k > 0 ? <Glow p={[0, t.h + 0.4, 0]} s={[t.w * 0.9, 0.8 * k, t.w * 0.9]} c={RUST} i={1.6} /> : <Box p={[0, t.h + 0.3, 0]} s={[t.w * 0.7, 0.6, t.w * 0.7]} c="#7A848E" />}
          </group>
        );
      })}
    </>
  );
};

// hàng triệu hộ thuê nhà: ~5000 nhà nhỏ trồi lên thành sóng lan từ giữa ra
const HouseField: React.FC<{ T: number }> = ({ T }) => {
  const data = useMemo(() => {
    const pts: { x: number; z: number; d: number; ry: number }[] = [];
    for (let i = -44; i <= 44; i++) for (let j = -44; j <= 44; j++) {
      const x = i * 2.2 + (hash(i * 91 + j) - 0.5) * 0.6, z = j * 2.2 + (hash(i * 17 + j * 3) - 0.5) * 0.6;
      const d = Math.hypot(x, z);
      if (d < 96) pts.push({ x, z, d, ry: (hash(i + j * 7) - 0.5) * 0.3 });
    }
    const n = pts.length;
    const mk = (geo: THREE.BufferGeometry, cols: string[]) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), n);
      m.castShadow = true;
      m.receiveShadow = true;
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) m.setColorAt(i, c.set(cols[Math.floor(hash(i + 3) * cols.length)]));
      return m;
    };
    const body = mk(new THREE.BoxGeometry(1, 0.8, 1).translate(0, 0.4, 0), ["#F1E6D2", "#E7D3B4", "#C9D8E2", "#E9DCC2", "#D8C9A8"]);
    const roof = mk(new THREE.BoxGeometry(1.15, 0.35, 1.15).translate(0, 0.97, 0), ["#B4462C", "#8E4A36", "#59616B", "#C46A3A"]);
    return { pts, body, roof };
  }, []);
  const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), eul = new THREE.Euler();
  data.pts.forEach((p, i) => {
    const s = Math.max(0.001, popK(T - (39.5 + p.d / 40), 0.4));
    q.setFromEuler(eul.set(0, p.ry, 0));
    mat.compose(pos.set(p.x, 0, p.z), q, sc.set(1, s, 1));
    data.body.setMatrixAt(i, mat);
    data.roof.setMatrixAt(i, mat);
  });
  data.body.instanceMatrix.needsUpdate = true;
  data.roof.instanceMatrix.needsUpdate = true;
  return (
    <>
      <primitive object={data.body} />
      <primitive object={data.roof} />
    </>
  );
};

// con đường thời gian: mỗi thời đại một mô hình nhỏ trên bệ, từ hôm nay về hang
const DIORAMAS: [number, number, string][] = [[7, -6, "modern"], [-8, -20, "slab"], [7, -34, "tenement"], [-7, -48, "insula"], [7, -62, "castle"], [-6, -76, "cave"]];
const Timeline: React.FC<{ T: number }> = ({ T }) => (
  <>
    <Box p={[0, 0.03, -40]} s={[3, 0.06, 140]} c="#C9A66B" />
    {Array.from({ length: 28 }, (_, i) => <Box key={i} p={[0, 0.07, 20 - i * 5]} s={[0.25, 0.02, 2]} c="#F3EAD9" />)}
    {DIORAMAS.map(([x, z, k]) => (
      <group key={k} position={[x, 0, z]}>
        <Box p={[0, 0.25, 0]} s={[11, 0.5, 11]} c="#D8C9A8" />
        <Box p={[0, 0.52, 0]} s={[10.4, 0.06, 10.4]} c={k === "cave" ? "#8A7A5E" : k === "insula" ? "#CDBB98" : "#8DB26A"} />
        <group position={[0, 0.55, 0]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          {k === "modern" && <group scale={0.75}><ModernHouse /><group position={[2.4, 0, 5]}><ForRentSign /></group></group>}
          {k === "slab" && <group scale={0.28}><SlabTower /></group>}
          {k === "tenement" && <group scale={0.45}><group position={[-4, 0, 0]}><Tenement c="#8E4A36" t={T} /></group><group position={[4, 0, 0]}><Tenement c="#A35A3E" t={T + 1} /></group></group>}
          {k === "insula" && <group scale={0.5}><Insula c="#C8754A" /></group>}
          {k === "castle" && <group scale={0.5}><group position={[-3, 0, -3]}><Castle /></group><group position={[5, 0, 4]}><Cottage /></group></group>}
          {k === "cave" && <group scale={0.55}><Cave /><group position={[1.2, 0, 3]}><Campfire T={T} flare={0} /></group></group>}
        </group>
      </group>
    ))}
  </>
);

// ------------------------------------------------------------------ các góc máy
export type Parts = "embers" | "dust" | "speed";
export type Shot = { env: Env; cam: V3; look: V3; fov?: number; shift?: number; S?: number; node: React.ReactNode; parts?: Parts; partsAt?: V3 };

// bàn tay trả tiền nhà: chồng 10 thỏi vàng, 3 thỏi (30%) bay vào cửa nhà ở chữ "rent"
const BarPile: React.FC<{ t: number }> = ({ t }) => {
  const rows = [4, 3, 2, 1];
  const bars: V3[] = [];
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) bars.push([(i - (n - 1) / 2) * 0.52, 0.69 + r * 0.19, 0]);
  });
  const door: V3 = [-0.6, 1.1, -5.4];
  return (
    <>
      <Box p={[0, 0.3, 0]} s={[2.4, 0.6, 1.0]} c="#B07A48" />
      <Box p={[0, 0.3, 0.51]} s={[2.4, 0.1, 0.02]} c="#8A5A34" />
      {bars.map((b, i) => {
        if (i < 7) return <Gold key={i} p={b} s={[0.5, 0.18, 0.26]} />;
        const t0 = 1.22 + (i - 7) * 0.08;
        const k = ease((t - t0) / 0.55);
        if (k >= 1) return null;
        const p = lerp3(b, door, k);
        p[1] += 2.2 * Math.sin(Math.PI * k);
        const s = 1 - 0.6 * k;
        return <Gold key={i} p={p} s={[0.5 * s, 0.18 * s, 0.26 * s]} r={[k * 4, k * 6, 0]} glow={0.25 + k} />;
      })}
    </>
  );
};

function shotStreet(t: number): Shot {
  return {
    env: DAY, S: 16, cam: lerp3([3.4, 1.25, 15.8], [3.0, 1.2, 14.6], clamp01(t / 1.88)), look: [0.9, 1.5, 6.5], fov: 50, shift: 140,
    node: <><Street /><group position={[1.4, 0, 9]}><BarPile t={t} /></group></>,
  };
}

function shot(T: number): Shot {
  // ---------------- B01 HOOK
  if (T < 1.88) return shotStreet(T);
  if (T < 3.04) {
    const t = T - 1.88;
    return {
      env: DAY, S: 14, cam: lerp3([3.8, 0.9, 20.5], [3.4, 0.85, 19], ease(t / 1.16)), look: [0.8, 1.2, 7.2], fov: 46, shift: 120,
      node: <><Street /><group position={[0.6, 0, 7.2]}><Voxels text="30%" v={0.42} c={OCHRE} fall={t} crumble={T - 2.46} /></group></>,
    };
  }
  if (T < 4.368) {
    const t = T - 3.04;
    return {
      env: DAY, S: 12, cam: lerp3([4.8, 1.0, 17], [4.5, 0.95, 16.2], ease(t / 1.3)), look: [2.0, 1.1, 9.0], fov: 46, shift: 110,
      node: (
        <>
          <Street />
          <group position={[0.6, 0, 7.2]}><Voxels text="30%" v={0.42} c={OCHRE} fall={T - 1.88} crumble={T - 2.46} /></group>
          <Cyl p={[1.6, 0.18, 9.2]} r={0.7} h={0.35} c="#6B3F22" seg={12} />
          <group position={[4.7, 0.65, 9.2]}><Gavel a={gavelAngle(T, 3.46)} /></group>
          <group position={[1.6, 0, 9.2]}><Burst t={T - 3.46} /></group>
        </>
      ),
    };
  }
  // ---------------- B02 "every era" -> "in my cave: zero"
  if (T < 6.56) {
    const t = T - 4.368, k = ease(t / 2.19);
    const z = lerp(12, -64, k);
    return { env: mixEnv(DAY, DUSK, ease((t - 0.8) / 1.4)), S: 30, cam: [0.6, lerp(6, 4, k), z], look: [0, 1.2, z - 20], fov: 58, shift: 0, node: <Timeline T={T} />, parts: "speed", partsAt: [0.6, 3, z] };
  }
  if (T < 8.034) {
    const t = T - 6.56;
    const flare = T > 7.38 ? 0.6 * Math.exp(-(T - 7.38) * 2.5) : 0;
    return {
      env: DUSK, S: 14, cam: lerp3([5.6, 2.0, 16.5], [4.8, 1.8, 14.5], ease(t / 1.47)), look: [0.4, 2.4, 0], fov: 46, shift: 120, parts: "embers", partsAt: [1.2, 0, 2.2],
      node: (
        <>
          <group position={[0, 0, -3]}><Cave /></group>
          <group position={[1.2, 0, 2.2]}><Campfire T={T} flare={flare} /><Burst t={T - 7.38} c="#FFB347" n={18} s0={0.1} /></group>
          <group position={[-2.6, 0, 2.6]}>
            <Box p={[-0.6, 0.8, 0]} s={[0.08, 1.6, 0.08]} c="#6A4A2E" /><Box p={[0.6, 0.8, 0]} s={[0.08, 1.6, 0.08]} c="#6A4A2E" />
            <Box p={[0, 1.55, 0]} s={[1.4, 0.07, 0.07]} c="#6A4A2E" /><Box p={[0, 1.1, 0]} s={[1.0, 0.85, 0.04]} c="#8A5E3A" />
          </group>
          {[[2.8, 3.2], [3.2, 3.0], [-0.5, 4.2]].map(([x, z], i) => <Box key={i} p={[x, 0.06, z]} s={[0.5, 0.08, 0.1]} c="#EDE4D0" r={[0, i * 1.1, 0]} />)}
        </>
      ),
    };
  }
  // ---------------- B03 Anh thời Trung cổ: tiền thuê = ngày công
  if (T < 9.1) {
    const t = T - 8.034;
    return { env: OVERCAST, S: 40, cam: lerp3([16, 10, 30], [14, 9, 27], ease(t / 1.07)), look: [-3, 3, -14], fov: 46, shift: 80, node: <Medieval T={T} /> };
  }
  if (T < 10.3) {
    const t = T - 9.1;
    // đồng xu rơi, nảy, rồi lăn đi mất ở chữ "money" (tiền không phải là tiền thuê)
    let y = 3 - 0.5 * 9.8 * t * t, x = 1.2;
    if (t > 0.25) y = 0.04 + Math.abs(Math.sin((t - 0.25) * 9)) * 0.5 * Math.exp(-(t - 0.25) * 4);
    if (t > 0.62) {
      const u = t - 0.62;
      x = 1.2 + 2.6 * u;
      y = 0.04 + Math.abs(Math.sin(u * 7)) * 0.45;
    }
    return {
      env: OVERCAST, S: 6, cam: [2.6, 0.55, 9.4], look: [1.3, 0.45, 6], fov: 40, shift: 100,
      node: <><Medieval T={T} /><Coin p={[x, Math.max(0.04, y), 6]} r={0.3} rot={[t > 0.62 ? 1.4 : 0.15, t * 3, t > 0.62 ? (t - 0.62) * 9 : 0]} /></>,
    };
  }
  if (T < 12.371) {
    const t = T - 10.3;
    return {
      env: OVERCAST, S: 10, cam: lerp3([4.6, 1.5, 13.5], [2.8, 1.6, 13.8], ease(t / 2.07)), look: [0.4, 2.0, 3], fov: 44, shift: 40,
      node: (
        <>
          <Medieval T={T} />
          <group position={[0.6, 0, 3]} rotation={[0, 0.6, 0]}><BlockPerson t={T} act="hoe" shirt="#8A7A5A" pants="#5A4A3A" hair="#6A4A2E" /></group>
          {Array.from({ length: 7 }, (_, i) => {
            const on = i < 3 ? popK(T - DAYS_LIT[i], 0.3) : 0;
            const p: V3 = [0.4 + (i - 3) * 0.62, 3.3, 3];
            return on > 0
              ? <Glow key={i} p={p} s={[0.5 * on, 0.5 * on, 0.5 * on]} c={RUST} i={1.2} />
              : <Box key={i} p={p} s={[0.5, 0.5, 0.5]} c="#F3EAD9" />;
          })}
        </>
      ),
    };
  }
  // ---------------- B04 Rome: phòng tối = nhà trên đồi
  if (T < 13.12) {
    const t = T - 12.371;
    return { env: ROME, S: 24, cam: lerp3([3.5, 0.5, 9.5], [3.0, 0.5, 8.4], t / 0.75), look: [0, 10, -8], fov: 56, shift: 100, node: <RomeSet T={T} /> };
  }
  if (T < 13.98) {
    const t = T - 13.12;
    return { env: DARK, S: 4, cam: lerp3([1.0, 1.35, 3.1], [0.9, 1.3, 2.8], t / 0.86), look: [-0.1, 0.9, -0.6], fov: 52, shift: 90, node: <DarkRoom T={T} coins={0} />, parts: "dust", partsAt: [0.5, 1.2, -0.8] };
  }
  if (T < 15.46) {
    const t = T - 13.98;
    return { env: DARK, S: 4, cam: lerp3([1.2, 1.45, 2.7], [1.0, 1.3, 2.4], ease(t / 1.48)), look: [0.1, 0.3, 0.4], fov: 50, shift: 110, node: <DarkRoom T={T} coins={Math.max(0.001, clamp01((T - 14.0) / 1.2))} />, parts: "dust", partsAt: [0.5, 1.2, -0.8] };
  }
  if (T < 16.839) {
    const t = T - 15.46, k = ease(t / 1.38);
    const s = popK(T - 15.82, 0.4);
    return {
      env: ROME, S: 20, cam: lerp3([5, 5, 18], [8, 6.5, 28], k), look: [0, 4.2, -1], fov: lerp(40, 30, k), shift: 120,
      node: (
        <>
          <Box p={[0, 1.5, -2]} s={[40, 3, 30]} c="#86A85A" />
          <Box p={[0, 3.3, -3]} s={[16, 0.6, 12]} c="#7C9E52" />
          <Box p={[-26, 2.5, -30]} s={[30, 5, 20]} c="#7FA055" />
          <Box p={[24, 3.5, -40]} s={[34, 7, 24]} c="#7A9A50" />
          <group position={[0, 3.6, -3]} scale={[s, s, s]}><Villa /></group>
          {[[-4.5, -4], [4.6, -5], [-5.5, -1], [5.8, -2]].map(([x, z], i) => (
            <group key={i} position={[x, 3.6, z]} scale={popK(T - 15.95 - i * 0.06, 0.35)}><Cypress /></group>
          ))}
          <group position={[0, 3.6, 0]}><Burst t={T - 15.82} c="#F3EAD9" n={20} /></group>
        </>
      ),
    };
  }
  // ---------------- B05 New York 1900
  if (T < 18.92) {
    const t = T - 16.839, k = ease(t / 2.08);
    return { env: NY, S: 26, cam: lerp3([5, 26, 24], [3.5, 2.0, 17], k), look: lerp3([0, 0, 6], [0, 7, 2], k), fov: 50, shift: 110, node: <NYSet T={T} /> };
  }
  if (T < 20.24) {
    const t = T - 18.92;
    return { env: mixEnv(NY, DARK, 0.6), S: 8, cam: lerp3([0.9, 1.7, 12.5], [0.7, 1.6, 11.6], t / 1.32), look: [0.3, 1.25, 0], fov: 50, shift: 110, node: <Rooms3 T={T} /> };
  }
  if (T < 21.76) {
    const t = T - 20.24;
    return {
      env: STUDIO, S: 4, cam: lerp3([1.4, 1.9, 2.7], [1.2, 1.8, 2.4], t / 1.52), look: [0.1, 0.85, 0], fov: 40, shift: 90,
      node: (
        <>
          <Table />
          {Array.from({ length: 10 }, (_, j) => {
            const tl = 20.34 + j * 0.095;
            const u = T - (tl - 0.3);
            if (u < 0) return null;
            const k = clamp01(u / 0.3);
            const y = lerp(2.2, 0.83 + j * 0.014, k);
            const wob = (1 - k) * 0.6;
            return <Bill key={j} p={[(hash(j) - 0.5) * 0.06 * (1 + 4 * (1 - k)), y, (hash(j + 4) - 0.5) * 0.05]} r={[wob * Math.sin(u * 20 + j), (hash(j) - 0.5) * 0.4, wob * Math.cos(u * 17)]} />;
          })}
        </>
      ),
    };
  }
  if (T < 23.735) {
    const t = T - 21.76;
    const glow = popK(T - 21.88, 0.3);
    const u = Math.max(0, T - 22.35);
    const third: V3 = [0.86 + 1.6 * u, 0.98 + (u > 0.35 ? -4.9 * (u - 0.35) ** 2 : 0), 0];
    return {
      env: STUDIO, S: 4, cam: lerp3([0.5, 1.6, 3.6], [0.8, 1.9, 4.8], ease(t / 1.97)), look: [0.2, 0.95, 0], fov: 42, shift: 100,
      node: (
        <>
          <Table />
          {[-0.86, 0].map((x) => <group key={x}>{[0, 1, 2, 3].map((k) => <Bill key={k} p={[x, 0.84 + k * 0.05, 0]} />)}<Box p={[x, 0.97, 0]} s={[0.8, 0.28, 0.36]} c="#8DAE74" /></group>)}
          <group position={third} rotation={[0, 0, -u * 2.2]}>
            <Box p={[0, 0, 0]} s={[0.8, 0.28, 0.36]} c="#8DAE74" />
            {glow > 0 && <Glow p={[0, 0, 0]} s={[0.86, 0.32, 0.4]} c={OCHRE} i={1.2} o={0.45} />}
          </group>
        </>
      ),
    };
  }
  // ---------------- B06 hôm nay 30% <- cắt ngân sách
  if (T < 25.1) {
    const t = T - 23.735;
    return {
      env: SIXTIES, S: 50, cam: lerp3([16, 3, 60], [14, 3.5, 54], ease(t / 1.37)), look: [0, 24, -6], fov: 50, shift: 120,
      node: <><SlabSet /><group position={[0, 33.8, -4]}><Voxels text="30%" v={1.6} c={OCHRE} fall={T - 24.03} crumble={-1} drop={60} /></group><group position={[0, 33.8, -4]}><Burst t={T - 24.28} c="#D8D3C8" n={24} s0={0.9} sp={2.5} /></group></>,
    };
  }
  if (T < 26.801) {
    const t = T - 25.1;
    const by = T < 26.12 ? 3.2 + 0.1 * Math.sin(T * 6) : T < 26.22 ? lerp(3.2, 1.97, ((T - 26.12) / 0.1) ** 2) : 1.97;
    return {
      env: STUDIO, S: 5, cam: lerp3([2.8, 1.9, 5.4], [2.3, 1.7, 4.7], ease(t / 1.7)), look: [0.9, 1.25, 0], fov: 44, shift: 100,
      node: (
        <>
          <Table />
          {Array.from({ length: 12 }, (_, i) => {
            const x = -2.75 + i * 0.5;
            const u = T - 26.22;
            if (i < 8 || u < 0) return <Gold key={i} p={[x, 0.91, 0]} s={[0.48, 0.18, 0.28]} />;
            const vx = 1.2 + (i - 8) * 0.7, vy = 2 + hash(i) * 1.5;
            const y = Math.max(0.09, 0.91 + vy * u - 4.9 * u * u - (x + vx * u > 2.3 ? 0 : 0));
            return <Gold key={i} p={[x + vx * u, y, (hash(i + 3) - 0.5) * 2 * u]} s={[0.48, 0.18, 0.28]} r={[u * 5, u * 3, u * 6 * hash(i)]} />;
          })}
          <group position={[1.0, by, 0]}>
            <Box p={[0, 0, 0]} s={[0.06, 2.0, 1.4]} c="#C3CBD1" />
            <Box p={[0, -1.0, 0]} s={[0.07, 0.1, 1.4]} c="#EEF2F4" />
            <Box p={[0, 1.15, 0]} s={[0.3, 0.4, 1.6]} c="#3A3F44" />
          </group>
          <group position={[1.0, 0.9, 0]}><Burst t={T - 26.22} c={GOLD} n={16} s0={0.08} sp={0.8} /></group>
        </>
      ),
    };
  }
  // ---------------- B07 luật 1969 25% -> 1981 30%, "để tiết kiệm"
  if (T < 28.9) {
    const t = T - 26.801;
    return {
      env: SEPIA, S: 40, cam: lerp3([12, 3, 52], [10, 3, 46], ease(t / 2.1)), look: [2, 7, 0], fov: 44, shift: 110,
      node: (
        <>
          <group position={[0, 0, -12]}><Capitol /></group>
          <Box p={[0, 0.03, 10]} s={[6, 0.06, 40]} c="#D9D0BE" />
          {[-14, -9, 9, 14].map((x) => <group key={x} position={[x, 0, 6]}><BlockTree h={6} c="#5E8F4A" /></group>)}
          <Cyl p={[4, 0.5, 14]} r={2.1} h={1} c="#6B3F22" seg={12} />
          <group position={[13.3, 1.95, 14]} scale={3}><Gavel a={gavelAngle(T, 28.28)} /></group>
          <group position={[4, 0, 14]}><Burst t={T - 28.28} c="#E9DCC2" n={26} s0={0.6} sp={2.2} /></group>
        </>
      ),
    };
  }
  if (T < 32.22) {
    const t = T - 28.9;
    return {
      env: STUDIO, S: 6, cam: lerp3([2.6, 2.1, 10.2], [1.0, 2.1, 10.6], ease(t / 3.32)), look: [0, 2.2, 0], fov: 40, shift: 110,
      node: <Grid100 n={25 * clamp01((T - 28.95) / 1.17)} extra={0} T={T} />,
    };
  }
  if (T < 34.74) {
    const t = T - 32.22;
    return {
      env: STUDIO, S: 6, cam: lerp3([-3.4, 0.7, 9.2], [-2.8, 0.9, 8.6], ease(t / 2.52)), look: [0, 2.2, 0], fov: 42, shift: 110,
      node: <Grid100 n={25} extra={5 * clamp01((T - 33.52) / 0.82)} T={T} />,
    };
  }
  if (T < 36.325) {
    const t = T - 34.74;
    const sq = T > 35.56 ? 0.18 * Math.exp(-(T - 35.56) * 6) * Math.cos((T - 35.56) * 25) : 0;
    return {
      env: STUDIO, S: 5, cam: lerp3([2.6, 1.7, 5.0], [2.2, 1.6, 4.4], ease(t / 1.58)), look: [0.2, 1.5, 0], fov: 42, shift: 100,
      node: (
        <>
          <Table />
          <group position={[0.1, 0.82, 0]}><Piggy sq={sq} /></group>
          {Array.from({ length: 8 }, (_, i) => {
            const t0 = 35.05 + i * 0.07, k = (T - t0) / 0.42;
            if (k < 0 || k > 1) return null;
            const p = lerp3([3.2, 2.6 + hash(i) * 0.8, (hash(i + 2) - 0.5) * 1.2], [0.0, 2.35, 0], k);
            p[1] += 1.0 * Math.sin(Math.PI * k);
            return <Coin key={i} p={p} r={0.16} rot={[k * 8, k * 3, Math.PI / 2]} />;
          })}
          <group position={[0, 2.35, 0]}><Burst t={T - 35.56} c={GOLD} n={14} s0={0.07} sp={0.6} /></group>
        </>
      ),
    };
  }
  // ---------------- B08 nửa người thuê trả hơn 30%, kỷ lục 22,6 triệu hộ
  if (T < 38.08) {
    const t = T - 36.325, a = 0.45 + 0.1 * t;
    return { env: DAY, S: 110, cam: [Math.sin(a) * 150, 88, Math.cos(a) * 150], look: [0, 4, 0], fov: 42, shift: 0, node: <CitySet red={clamp01((T - 36.48) / 0.75)} /> };
  }
  if (T < 39.46) {
    const t = T - 38.08, z = 3 + 1.0 * t;
    return {
      env: DAY, S: 30, cam: [8.8, 0.75, z + 4.6], look: [7.1, 2.4, z - 2], fov: 50, shift: 120,
      node: <><CitySet red={1} /><Box p={[7, 0.03, 0]} s={[6, 0.06, 200]} c="#5E6268" /><group position={[7, 0, z]}><BlockPerson t={T} walk={0.7} act="carry" shirt="#5A7FA6" /></group></>,
    };
  }
  if (T < SEAM - 2.012) {
    const k = ease((T - 39.46) / 3.27);
    return { env: GOLDEN, S: 90, cam: lerp3([4, 2.4, 13], [42, 58, 88], k), look: lerp3([0, 0.8, 0], [0, 0, -24], k), fov: 48, shift: 60, node: <HouseField T={T} /> };
  }
  // ---------------- B09 CTA: chọn thời đại -> nhìn ngang dọc con đường thời gian
  if (T < SEAM) {
    const t = T - 42.728, z = lerp(-4, -46, ease(t / 2.0));
    return { env: GOLDEN, S: 30, cam: [24, 9, z + 10], look: [0, 1.5, z - 6], fov: 46, shift: 0, node: <Timeline T={T} /> };
  }
  // ---------------- vòng lặp: về đúng khung mở đầu
  return shotStreet(T - SEAM);
}

// ------------------------------------------------------------------ hạt bay
export const Particles: React.FC<{ kind: Parts; at: V3; T: number }> = ({ kind, at, T }) => {
  if (kind === "embers")
    return (
      <group position={at}>
        {Array.from({ length: 36 }, (_, i) => {
          const y = ((hash(i) * 3 + T * (0.6 + 0.5 * hash(i + 1))) % 3.2);
          const r = 0.15 + y * 0.25;
          const p: V3 = [Math.cos(i + T * 0.8) * r * hash(i + 2), 0.4 + y, Math.sin(i * 1.7 + T) * r * hash(i + 3)];
          return <Glow key={i} p={p} s={[0.04, 0.04, 0.04]} c={i % 3 ? "#FFB347" : "#FFE08A"} i={4} o={Math.max(0, 1 - y / 3.2)} />;
        })}
      </group>
    );
  if (kind === "dust")
    return (
      <group position={at}>
        {Array.from({ length: 40 }, (_, i) => {
          const p: V3 = [(hash(i) - 0.5) * 1.4 + 0.1 * Math.sin(T * 0.7 + i), (hash(i + 5) - 0.5) * 2 + 0.1 * Math.sin(T * 0.5 + i * 2), (hash(i + 9) - 0.5) * 1.4];
          return <Glow key={i} p={p} s={[0.012, 0.012, 0.012]} c="#FFE9C0" i={3} o={0.7} />;
        })}
      </group>
    );
  return (
    <group position={[at[0], 0, at[2]]}>
      {Array.from({ length: 50 }, (_, i) => {
        const z = (((hash(i) * 40 + T * 60) % 40) + 40) % 40 - 30;
        return <Glow key={i} p={[(hash(i + 1) - 0.5) * 16, 0.5 + hash(i + 2) * 8, -z]} s={[0.03, 0.03, 2.6]} c="#FFF6E2" i={2} o={0.5} />;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ máy quay + đèn
export const Sky: React.FC<{ top: string; hor: string }> = ({ top, hor }) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(600, 32, 16);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const Tc = new THREE.Color(top), H = new THREE.Color(hor), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.copy(H).lerp(Tc, THREE.MathUtils.smoothstep(pos.getY(i) / 600, 0, 0.45));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [top, hor]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

export const Cam: React.FC<{ pos: V3; look: V3; fov: number; shift: number }> = ({ pos, look, fov, shift }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...look));
  camera.fov = fov;
  // lệch khung sang phải `shift` px: chừa góc dưới trái cho Flint
  camera.setViewOffset(size.width, size.height, -shift, 0, size.width, size.height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};

const World: React.FC<{ T: number }> = ({ T }) => <Stage s={shot(T)} T={T} h={hitEnv(T)} />;

// một khung 3D bất kỳ: máy quay (rung theo h), đèn, trời, đất, cảnh, hạt
export const Stage: React.FC<{ s: Shot; T: number; h: number }> = ({ s, T, h }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(s.look[0], 0, s.look[2]);
  const dist = Math.hypot(s.cam[0] - s.look[0], s.cam[1] - s.look[1], s.cam[2] - s.look[2]);
  const amp = h * 0.9 * Math.min(1, dist / 6) * Math.max(1, dist / 30);
  const sh = (f: number, o: number) => amp * Math.sin(T * f + o);
  const cam: V3 = [s.cam[0] + sh(61, 0), s.cam[1] + sh(47, 1.3), s.cam[2] + sh(53, 2.1)];
  const look: V3 = [s.look[0] + sh(43, 0.7), s.look[1] + sh(57, 2.4), s.look[2]];
  const S = s.S ?? 14;
  const e = s.env;
  const sun: V3 = [s.look[0] + e.sunDir[0] * S, e.sunDir[1] * S * 1.2, s.look[2] + e.sunDir[2] * S];
  return (
    <>
      <Cam pos={cam} look={look} fov={s.fov ?? 44} shift={s.shift ?? 0} />
      <fog attach="fog" args={e.fog} />
      <hemisphereLight args={e.hemi} />
      <primitive object={tgt} />
      <directionalLight position={sun} target={tgt} intensity={e.sunI} color={e.sunC} castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
        shadow-camera-near={0.01} shadow-camera-far={S * 5} shadow-bias={-0.0004} shadow-normalBias={S * 0.002} />
      <Sky top={e.top} hor={e.hor} />
      {e.ground && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color={e.ground} roughness={1} />
        </mesh>
      )}
      {s.node}
      {s.parts && <Particles kind={s.parts} at={s.partsAt ?? s.look} T={T} />}
    </>
  );
};

export const Rent3D: React.FC = () => <Plate cuts={CUTS} render={(T) => <World T={T} />} />;

// khung nền chung: canvas 3D + whip (nhoè ngang) / flash (chớp trắng) quanh mỗi cú cắt + chỉnh màu nhẹ
export const Plate: React.FC<{ cuts: [number, CutKind][]; render: (T: number) => React.ReactNode }> = ({ cuts, render }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = f / fps;
  let whip = 0, flash = 0, dir = 1;
  cuts.forEach(([ct, kind], i) => {
    const dfm = f - Math.round(ct * fps);
    if (kind === "whip" && dfm >= -2 && dfm <= 3) {
      const w = 1 - Math.abs(dfm + 0.5) / 3.5;
      if (w > whip) { whip = w; dir = i % 2 ? 1 : -1; }
    }
    if (kind === "flash" && dfm >= 0 && dfm <= 5) flash = Math.max(flash, 0.85 * (1 - dfm / 5));
  });
  return (
    <AbsoluteFill style={{ background: "#121718", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * whip}) translateX(${dir * 70 * whip}px)`, filter: whip > 0.05 ? `blur(${18 * whip}px)` : undefined }}>
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 44, near: 0.05, far: 1500 }} gl={{ antialias: true }}>
          {render(T)}
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.18, background: `linear-gradient(160deg, ${OCHRE} 0%, rgba(208,138,46,0) 50%, #3F8A84 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 100% 80% at 55% 45%, rgba(0,0,0,0) 62%, rgba(10,12,12,0.38) 100%)" }} />
      {flash > 0 && <AbsoluteFill style={{ background: "#FFF8EC", opacity: flash }} />}
    </AbsoluteFill>
  );
};
