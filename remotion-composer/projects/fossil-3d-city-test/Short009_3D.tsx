// Fossil Short 009 bản 3D khối vuông, r02 (2026-10-29): cùng lời Charon r04, phụ đề, field note, headline, end card.
// r01 bị nhàm (mỗi beat một góc máy chậm) -> r02: mỗi beat 2-4 góc cắt theo chữ trong lời đọc, rung máy khi va chạm,
// whip/flash khi cắt, hạt tuyết/cát/bụi chân, cảnh tế bào + chuỗi DNA khối, time-lapse sa mạc, dolly zoom kim tự tháp,
// tem/bộ đếm trên màn hình. Mốc thời gian SFX (sfx009.py) khớp với các hằng số trong file này.
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { InkPass } from "./Ink";
import { FreeCtx, ModelMouse, ModelProboscid, Prop, useFree, useFreeAssets } from "./ModelAnimals";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, CLAMP, Captions, EndCardView, FieldNote, Grain, HookHeadline, Ammonite, PANEL, mono, sans } from "./short008Overlays";
import type { SceneProps } from "./short008Overlays";
import { Box, BlockMouse, BlockPine, BlockProboscid, BlockPyramid, V3 } from "./BlockAnimals";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);
const TAU = Math.PI * 2;
const SPEED = 0.8; // m/s khi đi (chu kỳ 1.8 s)
const HAIRY = "#8A6A48";

type Env = "steppe" | "lab" | "desert" | "cell";
type Shot = {
  env: Env; cam: V3; look: V3; fov?: number; shadow: number; actors: React.ReactNode;
  sun?: V3; sunI?: number; night?: number; particles?: "snow" | "sand" | "bokeh";
};

// ------------------------------------------------------------------ cắt cảnh + va chạm (giây trong beat)
// kind: "whip" = nhoè ngang + whoosh, "flash" = chớp trắng, "cut" = cắt thẳng
type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS: Record<number, Cut[]> = {
  1: [[1.48, "whip"], [2.55, "cut"]],
  2: [[0, "flash"], [3.4, "whip"], [4.6, "cut"]],
  3: [[0, "whip"], [0.95, "flash"], [3.0, "cut"]],
  4: [[0, "whip"], [2.28, "cut"], [4.06, "cut"]],
  5: [[0, "whip"], [1.29, "whip"], [1.85, "whip"], [2.43, "flash"]],
  6: [[0, "whip"], [1.79, "cut"], [3.41, "whip"], [4.79, "cut"]],
  7: [[0, "flash"], [1.89, "cut"], [3.67, "whip"]],
  8: [[0, "whip"], [1.25, "whip"], [1.73, "flash"]],
};
// [giây, độ mạnh]: rung máy + đập phóng nhẹ cả khung
export const HITS: Record<number, [number, number][]> = {
  1: [[0.35, 0.05], [1.25, 0.05], [1.6, 0.32], [2.62, 0.14]],
  2: [[1.07, 0.05], [1.73, 0.05], [2.27, 0.05], [2.61, 0.08]],
  3: [[4.61, 0.12]],
  4: [[2.78, 0.22]],
  5: [[2.43, 0.1]],
  6: [[0.3, 0.07], [0.75, 0.07], [1.2, 0.07], [1.65, 0.07]],
  7: [[4.67, 0.28]],
  8: [[1.78, 0.38]],
};
export const DNA_EDITS: [number, number][] = [[1.07, 5], [1.33, 9], [1.73, 12], [1.99, 16], [2.27, 19], [2.61, 23]];

function hitEnv(beat: number, t: number) {
  let e = 0;
  for (const [ht, s] of HITS[beat] ?? []) if (t >= ht) e += s * Math.exp(-(t - ht) * 9);
  return e;
}

// ------------------------------------------------------------------ khối tự dựng hay model tải về (r04 "free"): cùng props
type ProbP = React.ComponentProps<typeof BlockProboscid>;
const Proboscid: React.FC<ProbP> = (p) => (useFree() ? <ModelProboscid {...p} /> : <BlockProboscid {...p} />);
const Mouse: React.FC<React.ComponentProps<typeof BlockMouse>> = (p) => (useFree() ? <ModelMouse {...p} /> : <BlockMouse {...p} />);
const PYR_COL = { lambert2SG: "#CFAE6E", lambert3SG: "#E6D2A2" };
const Pyramid: React.FC<{ size: number }> = ({ size }) => (useFree() ? <Prop name="pyramid" size={size} axis="x" colors={PYR_COL} /> : <BlockPyramid size={size} />);
const PINES = ["tree_pineTallA", "tree_pineTallB", "tree_pineDefaultA", "tree_pineRoundC"] as const;
const PINE_COL = { leafsDark: "#365040", woodBarkDark: "#4A3626" };
const Pine: React.FC<{ h: number; i: number }> = ({ h, i }) => (useFree() ? <Prop name={PINES[i % 4]} size={h} colors={PINE_COL} rot={i * 1.7} /> : <BlockPine h={h} />);
const ROCK_COL = { dirt: "#8D8F8E", grass: "#E6EBEB", _defaultMat: "#8D8F8E" }; // đỉnh cỏ của đá Kenney -> tuyết

// ------------------------------------------------------------------ các góc máy
function shot(beat: number, t: number, d: number): Shot {
  switch (beat) {
    case 1: {
      // voi ma mút đi tới (rống), lông bung hết, hoá voi châu Á
      const pop = clamp01((t - 1.6) / 1.2);
      const m = 1 - ease((t - 1.8) / 0.8);
      const x = 1.5 - SPEED * t;
      const actors = (
        <group position={[x, 0, 0]}>
          <Proboscid t={t} mammoth={m} fur={1} furPop={pop} tusks={0.3 + 0.7 * m} raise={pulse(t, 0.15, 1.4)} />
        </group>
      );
      if (t < 1.48)
        return { env: "steppe", shadow: 9, particles: "snow", cam: lerp3([-6.4, 0.45, 2.9], [-6.0, 0.5, 2.5], t / 1.48), look: [x - 0.6, 2.5, 0], fov: 46, actors };
      if (t < 2.55)
        return { env: "steppe", shadow: 9, particles: "snow", cam: [x - 5.6, 1.9, 7.2], look: [x - 0.5, 2.0, 0], actors };
      const k = ease((t - 2.55) / 0.9);
      return { env: "steppe", shadow: 9, particles: "snow", cam: lerp3([x - 7.4, 2.7, 3.4], [x - 6.4, 2.6, 2.8], k), look: [x - 1.6, 2.2, 0], fov: 40, actors };
    }
    case 2: {
      if (t < 3.4) {
        // phóng vào tế bào: chuỗi DNA khối, gen ma mút chèn vào từng nấc
        const a = -0.9 + 0.55 * ease(t / 3.4);
        const R = lerp(7.5, 4.6, ease(t / 3.4));
        return { env: "cell", shadow: 4, particles: "bokeh", cam: [Math.sin(a) * R, lerp(-1.2, 1.2, t / 3.4), Math.cos(a) * R], look: [0, lerp(-0.6, 1.0, t / 3.4), 0], actors: <Helix t={t} /> };
      }
      const actors = (
        <>
          <Proboscid t={t} walk={0} tusks={0.12} phase={0.4} />
          <group position={[-0.9, 0, 2.1]} rotation={[0, -0.25, 0]} scale={0.42}>
            <Proboscid t={t} walk={0} tusks={0} fur={0.55} furColor={HAIRY} phase={1.7} raise={pulse(t, 4.8, 5.6)} />
          </group>
        </>
      );
      if (t < 4.6) return { env: "steppe", shadow: 8, particles: "snow", cam: lerp3([-6.8, 2.2, 7.8], [-5.8, 1.9, 7.4], (t - 3.4) / 1.2), look: [-0.6, 1.6, 0.8], actors };
      return { env: "steppe", shadow: 8, particles: "snow", cam: lerp3([-5.0, 1.3, 5.2], [-4.4, 1.25, 4.7], (t - 4.6) / 1.1), look: [-1.2, 1.2, 1.6], fov: 40, actors };
    }
    case 3: {
      const actors = (
        <>
          {MICE.map(([x, z, r, g], i) => (
            <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
              <Mouse t={t} golden={g} phase={i * 1.3} />
            </group>
          ))}
          <LaserScan t={t} />
          {t > 1.75 && <Sparkles t={t - 1.75} pts={GOLD_SPARK} size={0.008} />}
        </>
      );
      if (t < 0.95) return { env: "lab", shadow: 0.6, cam: [Math.sin(t * 0.4) * 0.05, 0.95 - 0.15 * t, 0.06], look: [0, 0, 0], actors };
      if (t < 3.0) {
        const k = ease((t - 0.95) / 2.05);
        return { env: "lab", shadow: 0.6, cam: lerp3([-0.24, 0.07, 0.15], [-0.15, 0.055, 0.08], k), look: [-0.02, 0.04, -0.01], fov: 38, actors };
      }
      return { env: "lab", shadow: 0.6, cam: lerp3([-0.5, 0.2, 0.45], [-0.42, 0.15, 0.36], (t - 3.0) / 2.4), look: [0, 0.035, 0], actors };
    }
    case 4: {
      // lông khối rơi từ trời xuống từng nấc (150+ chỉnh sửa)… rồi tuột mất một mảng (mốc 2028 trượt)
      const fur = 0.04 + 0.62 * ease((t - 0.1) / 1.6);
      const actors = (
        <>
          <Proboscid t={t} walk={0} fur={fur} furDrop mammoth={0.3 * ease(t / 2)} furColor={HAIRY} tusks={0.15} raise={pulse(t, 4.5, 5.8) * 0.6} />
          <Debris t={t - 2.78} />
        </>
      );
      if (t < 2.28) {
        const a = -1.1 + 0.9 * ease(t / 2.28);
        return { env: "steppe", shadow: 8, particles: "snow", cam: [Math.sin(a) * 8.5, 2.0 + 1.5 * ease(t / 2.28), Math.cos(a) * 8.5], look: [-0.3, 2.2, 0], actors };
      }
      if (t < 4.06) return { env: "steppe", shadow: 8, particles: "snow", cam: lerp3([3.4, 0.5, 5.2], [3.0, 0.55, 4.7], (t - 2.28) / 1.8), look: [-0.2, 2.0, 0], fov: 44, actors };
      return { env: "steppe", shadow: 8, particles: "snow", cam: lerp3([-6.0, 2.3, 6.2], [-8.0, 2.8, 8.0], ease((t - 4.06) / 2.1)), look: [-0.4, 1.9, 0], actors };
    }
    case 5: {
      const actors = (
        <>
          <group position={[0.3, 0, -1.6]}>
            <Proboscid t={t} walk={0} mammoth={1} fur={1} tusks={1} phase={0.9} />
          </group>
          <group position={[-0.3, 0, 1.9]}>
            <Proboscid t={t} walk={0} tusks={0.15} phase={2.2} />
          </group>
          {t > 2.43 && <ScanPlane k={ease((t - 2.5) / 1.7)} />}
        </>
      );
      if (t < 1.29) return { env: "steppe", shadow: 10, particles: "snow", cam: lerp3([-12.5, 2.0, 9.0], [-12.0, 2.3, 4.0], ease(t / 1.29)), look: [0, 2.1, 0], actors };
      if (t < 1.85) return { env: "steppe", shadow: 10, particles: "snow", cam: lerp3([-6.4, 2.9, 0.6], [-5.9, 2.85, 0.3], (t - 1.29) / 0.56), look: [-1.2, 2.4, -1.6], fov: 40, actors };
      if (t < 2.43) return { env: "steppe", shadow: 10, particles: "snow", cam: lerp3([-6.6, 2.7, 4.2], [-6.1, 2.65, 3.9], (t - 1.85) / 0.58), look: [-1.7, 2.3, 1.9], fov: 40, actors };
      return { env: "steppe", shadow: 10, particles: "snow", cam: lerp3([-11.5, 4.5, 6.5], [-14.5, 3.4, 6.0], ease((t - 2.43) / 2.6)), look: [0, 2.0, 0], actors };
    }
    case 6: {
      // đàn voi đi, con non lông lá ở giữa… và con voi ma mút thật thì đi xa dần trong sương
      const x = 2.5 - SPEED * t;
      const herd = (
        <group position={[x, 0, 0]}>
          {HERD.map(([hx, hz, sc, tusk, ph], i) => (
            <group key={i} position={[hx, 0, hz]} scale={sc}>
              <Proboscid t={t} period={1.8 * sc} tusks={tusk} phase={ph} {...(sc < 1 ? { fur: 1, furColor: HAIRY } : {})} />
            </group>
          ))}
          <Footfalls t={t} />
        </group>
      );
      if (t < 1.79) return { env: "steppe", shadow: 12, particles: "snow", cam: [-3.2, 0.3, 8.6], look: [lerp(2.0, 0.6, t / 1.79), 1.5, 0.4], fov: 50, actors: herd };
      if (t < 3.41) return { env: "steppe", shadow: 12, particles: "snow", cam: [x - 2.7, 0.95, 4.9], look: [x - 0.45, 0.95, 2.2], fov: 40, actors: <>{herd}{<Sparkles t={t} pts={CALF_SPARK.map((p) => [p[0] + x, p[1], p[2]] as V3)} size={0.05} />}</> };
      if (t < 4.79) return { env: "steppe", shadow: 14, particles: "snow", cam: [x - 0.6, 23 - 2 * (t - 3.41), 7.0], look: [x - 0.8, 0, 0.2], actors: herd };
      const zM = -14 - SPEED * (t - 4.79);
      return {
        env: "steppe", shadow: 14, particles: "snow", cam: [x - 1.5, 2.3, 12.5], look: [x - 6.5, 2.0, -6.5],
        actors: (
          <>
            {herd}
            <group position={[x - 11, 0, zM]} rotation={[0, -Math.PI / 2, 0]}>
              <Proboscid t={t} mammoth={1} fur={1} tusks={1} />
            </group>
          </>
        ),
      };
    }
    case 7: {
      if (t < 1.89) {
        const x = 1.0 - SPEED * t;
        return { env: "desert", shadow: 9, particles: "sand", cam: [x - 7.0, 1.1, 6.6], look: [x - 0.5, 2.2, 0], actors: <group position={[x, 0, 0]}><Proboscid t={t} mammoth={1} fur={1} tusks={1} /></group> };
      }
      if (t < 3.67) {
        // time-lapse 4.000 năm: mặt trời quay vòng, ngày đêm chớp tắt, con voi ma mút chìm dần vào cát
        const k = (t - 1.89) / 1.78;
        const sa = k * TAU * 2.2;
        const day = 0.5 + 0.5 * Math.cos(sa);
        const sink = 4.6 * ease((k - 0.12) / 0.8);
        return {
          env: "desert", shadow: 10, particles: "sand", cam: [-9.5, 2.2, 9.5], look: [-1.8, 2.0, -1.5],
          sun: [Math.cos(sa) * -10, 3 + 8 * day, 7], sunI: 0.6 + 3.2 * day, night: 1 - day,
          actors: <group position={[-0.5, -sink, 0]}><Proboscid t={1.4} walk={0} mammoth={1} fur={1} tusks={1} /></group>,
        };
      }
      // dolly zoom: lùi máy + thu góc -> kim tự tháp phình to phía sau
      const k = ease((t - 3.67) / 1.6);
      return { env: "desert", shadow: 9, particles: "sand", cam: lerp3([-4.5, 1.6, 9.0], [-15, 1.6, 22.5], k), look: [16, 6.5, -32], fov: lerp(62, 24, k), actors: null };
    }
    default: {
      // voi lông lá vs voi ma mút thật: cận mặt từng con, rồi đối đầu (cả hai rống), máy vòng chậm
      const actors = (
        <>
          <group position={[-3.3, 0, 0]} rotation={[0, Math.PI, 0]}>
            <Proboscid t={t} walk={0} fur={1} furColor={HAIRY} tusks={0.2} phase={0.5} raise={pulse(t, 1.75, 3.0)} />
          </group>
          <group position={[3.3, 0, 0]}>
            <Proboscid t={t} walk={0} mammoth={1} fur={1} tusks={1} phase={2.0} raise={pulse(t, 1.8, 3.1)} />
          </group>
          <Burst t={t - 1.78} />
        </>
      );
      if (t < 1.25) return { env: "steppe", shadow: 12, particles: "snow", cam: lerp3([1.4, 2.8, 4.8], [1.0, 2.75, 4.3], t / 1.25), look: [-1.9, 2.3, 0], fov: 40, actors };
      if (t < 1.73) return { env: "steppe", shadow: 12, particles: "snow", cam: lerp3([-1.4, 2.8, 4.8], [-1.0, 2.75, 4.3], (t - 1.25) / 0.48), look: [1.9, 2.3, 0], fov: 40, actors };
      const k = ease((t - 1.73) / 4.3);
      const a = -0.25 - 0.7 * k;
      const R = lerp(16, 20, k);
      return { env: "steppe", shadow: 12, particles: "snow", cam: [Math.sin(a) * R, lerp(1.2, 2.8, k), Math.cos(a) * R], look: [0, 2.2, 0], actors };
    }
  }
}

// ------------------------------------------------------------------ dàn diễn viên cố định
const MICE: [number, number, number, boolean][] = [[0, 0, -0.4, true], [0.12, 0.09, 0.5, true], [-0.08, -0.12, -1.2, true], [0.2, -0.1, 0.2, false]];
const GOLD_SPARK: V3[] = [[0, 0.07, 0.02], [-0.03, 0.06, -0.02], [0.03, 0.065, -0.01], [0.13, 0.07, 0.1], [0.1, 0.06, 0.07], [-0.08, 0.07, -0.1], [-0.06, 0.06, -0.14]];
const HERD: [number, number, number, number, number][] = [[0, -1.9, 1, 0.15, 0.3], [2.9, 0.6, 1, 0, 2.1], [-2.6, 1.1, 1, 0.2, 4.0], [0.1, 2.2, 0.42, 0, 1.0]];
const CALF_SPARK: V3[] = [[0.1, 1.3, 2.6], [-0.3, 1.15, 2.6], [0.5, 1.1, 2.55], [-0.6, 0.9, 2.5], [0.2, 0.75, 2.55]];

// ------------------------------------------------------------------ hiệu ứng 3D
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const Glow: React.FC<{ p: V3; s: V3; c: string; i?: number; o?: number; r?: V3 }> = ({ p, s, c, i = 1.5, o = 1, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} userData={{ noNormal: true }}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent={o < 1} opacity={o} depthWrite={o >= 1} />
  </mesh>
);

// chuỗi xoắn kép bằng khối; các nấc được "chỉnh gene" đổi sang vàng ma mút, có tia chèn từ trên rọi xuống
const Helix: React.FC<{ t: number }> = ({ t }) => {
  const N = 30;
  return (
    <group rotation={[0, 0, 0.18]}>
      {Array.from({ length: N }, (_, i) => {
        const y = (i - N / 2) * 0.34;
        const ang = i * 0.42 + t * 0.7;
        const ed = DNA_EDITS.find((e) => e[1] === i);
        const done = ed && t >= ed[0];
        const popS = done ? 1 + 0.7 * Math.exp(-(t - ed![0]) * 7) : 1;
        const beam = ed ? pulse(t, ed[0] - 0.22, ed[0] + 0.05) : 0;
        const cA = done ? "#E3A43A" : i % 3 === 0 ? "#E8927C" : "#6FBEA3";
        const cB = done ? "#B9772A" : i % 3 === 0 ? "#6FBEA3" : "#7FA8D6";
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, -ang, 0]}>
            <group scale={popS}>
              <Box p={[0.5, 0, 0]} s={[0.95, 0.09, 0.09]} c={cA} />
              <Box p={[-0.5, 0, 0]} s={[0.95, 0.09, 0.09]} c={cB} />
            </group>
            <Box p={[1.05, 0, 0]} s={[0.24, 0.24, 0.24]} c="#DDE7EA" />
            <Box p={[-1.05, 0, 0]} s={[0.24, 0.24, 0.24]} c="#DDE7EA" />
            {done && <Glow p={[0, 0, 0]} s={[2.3, 0.14, 0.14]} c="#FFC861" i={2.5 * Math.exp(-(t - ed![0]) * 3)} o={0.5} />}
            {beam > 0.01 && <Glow p={[0, 3, 0]} s={[0.06, 6, 0.06]} c="#FFE29A" i={4} o={beam} />}
          </group>
        );
      })}
    </group>
  );
};

// tia laser đỏ quét qua đàn chuột (đo lông)
const LaserScan: React.FC<{ t: number }> = ({ t }) => {
  const k = (t % 2.4) / 2.4;
  return <Glow p={[0, 0.065, lerp(-0.35, 0.35, ease(k))]} s={[0.7, 0.002, 0.003]} c="#FF4A3D" i={4} o={0.8} />;
};

const Sparkles: React.FC<{ t: number; pts: V3[]; size: number }> = ({ t, pts, size }) => (
  <>
    {pts.map((p, i) => {
      const s = Math.max(0, Math.sin(t * 5 + i * 2.1)) ** 3;
      return s > 0.02 ? <Glow key={i} p={p} s={[size * s, size * s, size * s]} c="#FFE7A0" i={4} r={[0.6, 0.8, 0.3]} /> : null;
    })}
  </>
);

// mảng lông tuột khỏi lưng, rơi nảy xuống đất
const Debris: React.FC<{ t: number }> = ({ t }) => {
  const free = useFree();
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const x0 = -1.0 + 2.0 * hash(i), z0 = (hash(i + 9) - 0.5) * 1.6;
        const vx = (hash(i + 3) - 0.5) * 2, vz = Math.sign(z0) * (0.8 + hash(i + 5)), vy = 1 + 2 * hash(i + 7);
        let y = 2.9 + vy * t - 4.9 * t * t;
        if (y < 0.15) y = 0.15 + Math.abs(Math.sin(t * 6 + i)) * 0.25 * Math.exp(-t * 2);
        const tt = Math.min(t, 1.1);
        const p: V3 = [x0 + vx * tt, y, z0 + vz * tt];
        const r: V3 = [t * 3 * hash(i), t * 2, t * 4 * hash(i + 1)];
        // bản model: mảng lông là mảnh tam giác dẹt (cùng kiểu lớp lông ModelProboscid) thay vì hộp
        return free ? (
          <mesh key={i} position={p} rotation={r} scale={[0.3, 0.36, 0.06]} castShadow>
            <tetrahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={i % 3 ? HAIRY : "#6E5236"} roughness={0.95} flatShading />
          </mesh>
        ) : (
          <Box key={i} p={p} s={[0.3, 0.32, 0.18]} c={i % 3 ? HAIRY : "#6E5236"} r={r} />
        );
      })}
    </>
  );
};

// bụi tuyết bắn ra giữa hai con khi đối đầu
const Burst: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0 || t > 1.6) return null;
  return (
    <>
      {Array.from({ length: 28 }, (_, i) => {
        const a = hash(i) * TAU, sp = 2 + 4 * hash(i + 2);
        const y = 0.2 + (1.5 + 2 * hash(i + 4)) * t - 3 * t * t;
        const s = 0.25 * (1 - t / 1.6);
        return <Box key={i} p={[Math.cos(a) * sp * t * 0.6, Math.max(0.05, y), Math.sin(a) * sp * t]} s={[s, s, s]} c="#E9EEF0" />;
      })}
    </>
  );
};

// bụi tuyết dưới chân đàn voi (toạ độ trong group của đàn)
const Footfalls: React.FC<{ t: number }> = ({ t }) => {
  const out: React.ReactNode[] = [];
  HERD.forEach(([hx, hz, sc, , ph], h) => {
    const period = 1.8 * sc;
    [[-0.85, 0.48, 0.25], [-0.85, -0.48, 0.75], [0.85, 0.48, 0], [0.85, -0.48, 0.5]].forEach(([lx, lz, off], l) => {
      const o = off * TAU + ph;
      const kNow = Math.floor(((TAU * t) / period + o) / TAU);
      for (const kk of [kNow, kNow - 1]) {
        const tp = ((kk * TAU - o) * period) / TAU;
        const age = (t - tp) / 0.7;
        if (age < 0 || age > 1) continue;
        // chân đứng yên trên đất trong khi đàn trôi: bù lại quãng đã đi
        const fx = hx + lx * sc + SPEED * (t - tp);
        for (let q = 0; q < 4; q++) {
          const a = q * 1.57 + h + l, r = 0.15 + 0.5 * age;
          const s = 0.16 * sc * (1 - age);
          out.push(<Box key={`${h}${l}${kk}${q}`} p={[fx + Math.cos(a) * r * sc, 0.06 + 0.25 * age * sc, hz + lz * sc + Math.sin(a) * r * sc]} s={[s, s, s]} c="#E4E9EA" />);
        }
      }
    });
  });
  return <>{out}</>;
};

// mặt quét DNA trong suốt lướt qua cả hai con
const ScanPlane: React.FC<{ k: number }> = ({ k }) => (
  <>
    <Glow p={[lerp(-3.4, 2.6, k), 2.2, 0.15]} s={[0.04, 4.6, 7.6]} c="#6FE0C8" i={2.2} o={0.35 * (1 - Math.max(0, k - 0.9) * 10)} />
  </>
);

// hạt bay: tuyết rơi / cát thổi / bụi sáng trong tế bào — theo thời gian tuyệt đối T cho liền mạch giữa các cú cắt
const Particles: React.FC<{ kind: "snow" | "sand" | "bokeh"; center: V3; T: number; scale: number; ink?: boolean }> = ({ kind, center, T, scale, ink }) => {
  const N = kind === "bokeh" ? 60 : 170;
  const W = (kind === "bokeh" ? 12 : 18) * scale;
  return (
    <group position={[center[0], 0, center[2]]}>
      {Array.from({ length: N }, (_, i) => {
        const u = hash(i), v = hash(i + 100), w = hash(i + 200);
        let p: V3, s: V3, c: string;
        if (kind === "snow") {
          const H = 9 * scale;
          const y = (((v * H - 0.7 * T * scale) % H) + H) % H;
          p = [(u - 0.5) * W + 0.4 * Math.sin(T * 0.9 + i) * scale, y, (w - 0.5) * W];
          s = [0.05 * scale, 0.05 * scale, 0.05 * scale];
          c = "#F4F7F8";
        } else if (kind === "sand") {
          const x = (((u * W + 5 * T) % W) + W) % W - W / 2;
          p = [x, 0.05 + v * 1.6 + 0.1 * Math.sin(T * 3 + i), (w - 0.5) * W];
          s = [0.22, 0.025, 0.025];
          c = i % 2 ? "#E9D3A2" : "#D5B57C";
        } else {
          p = [(u - 0.5) * W, center[1] + (v - 0.5) * 10 + 0.3 * Math.sin(T * 0.5 + i), (w - 0.5) * W];
          s = [0.07, 0.07, 0.07];
          c = i % 3 ? "#8FD9C6" : "#F2C07A";
          return <Glow key={i} p={p} s={s} c={c} i={2} o={0.55} />;
        }
        return (
          <mesh key={i} position={p} userData={{ noNormal: ink }}>
            <boxGeometry args={s} />
            <meshBasicMaterial color={c} depthWrite={!ink} />
          </mesh>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ môi trường
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const SKY: Record<Env, [string, string, string]> = {
  steppe: ["#93ADC4", "#E3E6E2", "#DDE2E2"],
  desert: ["#86AFD6", "#F3DEB2", "#EBD5A8"],
  lab: ["#E6EAED", "#E6EAED", "#E6EAED"],
  cell: ["#0B2430", "#123844", "#0E2E3A"],
};
const NIGHT: [string, string, string] = ["#141B33", "#3A3150", "#2E2A44"];
const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

const Sky: React.FC<{ top: string; hor: string }> = ({ top, hor }) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(300, 32, 16);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const T = new THREE.Color(top), H = new THREE.Color(hor), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.copy(H).lerp(T, THREE.MathUtils.smoothstep(pos.getY(i) / 300, 0, 0.45));
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

const Steppe: React.FC = () => {
  const free = useFree();
  const items = useMemo(() => {
    const r = rng(11);
    const snow = Array.from({ length: 40 }, () => ({ x: (r() - 0.5) * 90, z: (r() - 0.5) * 90, w: 1 + r() * 4, d: 1 + r() * 3 }));
    const tufts = Array.from({ length: 260 }, () => ({ x: (r() - 0.5) * 60, z: (r() - 0.5) * 60, h: 0.1 + r() * 0.25 }));
    const pines = Array.from({ length: 34 }, () => {
      const a = r() * Math.PI * 2, d = 22 + r() * 60;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, h: 4 + r() * 5 };
    });
    const rocks = Array.from({ length: 30 }, () => ({ x: (r() - 0.5) * 70, z: (r() - 0.5) * 70, s: 0.3 + r() * 0.9, ry: r() * 3 }));
    return { snow, tufts, pines, rocks };
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#949A78" roughness={1} />
      </mesh>
      {items.snow.map((s, i) => <Box key={`s${i}`} p={[s.x, 0.01, s.z]} s={[s.w, 0.02, s.d]} c="#EEF2F2" />)}
      {free ? (
        <>
          {items.tufts.map((s, i) => <Prop key={`t${i}`} name={i % 2 ? "grass" : "grass_large"} size={s.h} colors={{ grass: i % 2 ? "#8C8E66" : "#B4A874" }} pos={[s.x, 0, s.z]} rot={i} />)}
          {items.rocks.map((s, i) => <Prop key={`r${i}`} name={(["rock_largeA", "rock_largeC", "rock_smallA", "rock_smallC"] as const)[i % 4]} size={s.s} axis="x" colors={ROCK_COL} pos={[s.x, 0, s.z]} rot={s.ry} />)}
        </>
      ) : (
        <>
          {items.tufts.map((s, i) => <Box key={`t${i}`} p={[s.x, s.h / 2, s.z]} s={[0.12, s.h, 0.12]} c={i % 2 ? "#8C8E66" : "#B4A874"} />)}
          {items.rocks.map((s, i) => <Box key={`r${i}`} p={[s.x, s.s * 0.3, s.z]} s={[s.s, s.s * 0.6, s.s * 0.8]} c="#8D8F8E" r={[0, s.ry, 0]} />)}
        </>
      )}
      {items.pines.map((p, i) => <group key={`p${i}`} position={[p.x, 0, p.z]}><Pine h={p.h} i={i} /></group>)}
      {[[-110, -210, 60, 16], [30, -240, 80, 22], [160, -170, 60, 14], [-230, -60, 70, 18], [230, 50, 70, 17]].map(([x, z, w, h], i) =>
        free ? (
          <Prop key={`m${i}`} name={i % 2 ? "rock_tallA" : "rock_tallB"} size={w} axis="x" colors={{ dirt: "#8E979E", grass: "#EEF2F4", _defaultMat: "#8E979E" }} pos={[x, 0, z]} rot={i * 0.7} />
        ) : (
          <group key={`m${i}`} position={[x, 0, z]} rotation={[0, i * 0.7, 0]}>
            <Box p={[0, h / 2, 0]} s={[w, h, w * 0.7]} c="#8E979E" />
            <Box p={[0, h + 3, 0]} s={[w * 0.55, 6, w * 0.4]} c="#EEF2F4" />
          </group>
        ),
      )}
    </>
  );
};

const Desert: React.FC = () => {
  const free = useFree();
  const dunes = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 20 }, () => ({ x: (r() - 0.5) * 160, z: -20 - r() * 100, w: 8 + r() * 20, h: 0.6 + r() * 2 }));
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#DCC08A" roughness={1} />
      </mesh>
      {dunes.map((d, i) =>
        free ? (
          <mesh key={i} position={[d.x, 0, d.z]} scale={[d.w / 2, d.h, d.w / 4]} receiveShadow castShadow>
            <sphereGeometry args={[1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={i % 2 ? "#D2B57E" : "#E2C996"} roughness={1} flatShading />
          </mesh>
        ) : (
          <Box key={i} p={[d.x, d.h / 2, d.z]} s={[d.w, d.h, d.w * 0.5]} c={i % 2 ? "#D2B57E" : "#E2C996"} />
        ),
      )}
      <group position={[16, 0, -32]} rotation={[0, 0.3, 0]}><Pyramid size={22} /></group>
      <group position={[38, 0, -44]} rotation={[0, 0.3, 0]}><Pyramid size={18} /></group>
      <group position={[52, 0, -30]} rotation={[0, 0.3, 0]}><Pyramid size={9} /></group>
    </>
  );
};

const Lab: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial color="#E9ECEE" roughness={0.7} />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[-1.5 + i * 0.25, 0.0005, 0]} s={[0.004, 0.001, 6]} c="#CBD2D6" />)}
    <Box p={[0.6, 0.4, 0]} s={[0.02, 0.8, 3]} c="#C9D2D8" />
    <Box p={[0, 0.4, -0.7]} s={[3, 0.8, 0.02]} c="#D3DADF" />
    {useFree() ? (
      <>
        <Prop name="tube_rack" size={0.26} axis="x" pos={[0.33, 0, -0.42]} rot={Math.PI / 2} />
        <Prop name="microscope" size={0.3} pos={[-0.32, 0, -0.5]} rot={0.6} />
      </>
    ) : (
      <>
        {[0, 1, 2, 3].map((i) => <Box key={`v${i}`} p={[0.35, 0.05, -0.45 + i * 0.05]} s={[0.025, 0.1, 0.025]} c={i % 2 ? "#7FB3C8" : "#A9D3C0"} />)}
        <Box p={[-0.3, 0.04, -0.5]} s={[0.25, 0.08, 0.16]} c="#8FA6B6" />
      </>
    )}
    {/* nhãn ống nghiệm, đèn báo trên máy */}
    <Glow p={[-0.2, 0.085, -0.5]} s={[0.012, 0.004, 0.012]} c="#5BE07A" i={3} />
    <Glow p={[-0.25, 0.085, -0.5]} s={[0.012, 0.004, 0.012]} c="#FFB347" i={3} />
  </>
);

const CellBg: React.FC = () => (
  <>
    {/* màng tế bào mờ phía sau */}
    {Array.from({ length: 10 }, (_, i) => (
      <Glow key={i} p={[(hash(i) - 0.5) * 30, (hash(i + 1) - 0.5) * 20, -12 - hash(i + 2) * 10]} s={[3 + 4 * hash(i + 3), 3 + 4 * hash(i + 4), 0.5]} c={i % 2 ? "#1F5A63" : "#2A4C70"} i={0.6} o={0.5} />
    ))}
  </>
);

const Cam: React.FC<{ pos: V3; look: V3; fov: number }> = ({ pos, look, fov }) => {
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

const World: React.FC<{ beat: number; t: number; d: number; T: number; ink?: boolean }> = ({ beat, t, d, T, ink }) => {
  const s = shot(beat, t, d);
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(s.look[0], 0, s.look[2]);
  // rung máy: lệch vị trí + điểm nhìn theo vài sóng sin, tắt dần sau mỗi va chạm
  const h = hitEnv(beat, t);
  const sh = (f: number, o: number) => h * 0.9 * Math.sin(T * f + o);
  const camDist = Math.hypot(s.cam[0] - s.look[0], s.cam[1] - s.look[1], s.cam[2] - s.look[2]);
  const amp = Math.min(1, camDist / 6);
  const cam: V3 = [s.cam[0] + sh(61, 0) * amp, s.cam[1] + sh(47, 1.3) * amp, s.cam[2] + sh(53, 2.1) * amp];
  const look: V3 = [s.look[0] + sh(43, 0.7) * amp, s.look[1] + sh(57, 2.4) * amp, s.look[2]];
  const S = s.shadow;
  const sun: V3 = s.sun
    ? [s.look[0] + s.sun[0], s.sun[1], s.look[2] + s.sun[2]]
    : s.env === "lab" ? [s.look[0] - 0.6, 1.2, s.look[2] + 0.5] : [s.look[0] - S, S * 0.9, s.look[2] + S * 0.7];
  const night = s.night ?? 0;
  const sky = SKY[s.env];
  const top = mixC(sky[0], NIGHT[0], night), hor = mixC(sky[1], NIGHT[1], night), fogC = mixC(sky[2], NIGHT[2], night);
  const scale = s.env === "lab" ? 0.06 : 1;
  return (
    <>
      <Cam pos={cam} look={look} fov={s.fov ?? 42} />
      <fog attach="fog" args={[fogC, s.env === "lab" ? 3 : s.env === "cell" ? 4 : 50, s.env === "lab" ? 12 : s.env === "cell" ? 26 : 260]} />
      <hemisphereLight args={[s.env === "cell" ? "#7FD3D0" : s.env === "desert" ? "#D8E6F2" : "#D5E2EE", s.env === "cell" ? "#1A2A4A" : s.env === "desert" ? "#9A7A48" : "#5E6356", (s.env === "lab" ? 1.6 : s.env === "cell" ? 1.2 : 1.0) * (1 - 0.6 * night)]} />
      <primitive object={tgt} />
      <directionalLight position={sun} target={tgt} intensity={s.sunI ?? (s.env === "desert" ? 3.6 : s.env === "lab" ? 2.2 : s.env === "cell" ? 1.4 : 3.5)} color={s.env === "desert" ? "#FFDDAA" : "#FFF1DE"} castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
        shadow-camera-near={0.01} shadow-camera-far={S * 5} shadow-bias={-0.0004} shadow-normalBias={S * 0.002} />
      <directionalLight position={[s.look[0] + 8, 4, s.look[2] - 8]} intensity={0.7 * (1 - 0.5 * night)} color={s.env === "cell" ? "#E8927C" : "#C2D3E6"} />
      <Sky top={top} hor={hor} />
      {s.env === "steppe" ? <Steppe /> : s.env === "desert" ? <Desert /> : s.env === "lab" ? <Lab /> : <CellBg />}
      {s.particles && <Particles kind={s.particles} center={look} T={T} scale={scale} ink={ink} />}
      {s.actors}
      {ink && <InkPass p={{ focus: camDist, blur: 5, night, cow: 0, flash: 0, redPulse: 0, ink: 1, vig: 0.35, hdr: 1 }} />}
    </>
  );
};

// ------------------------------------------------------------------ chữ / tem trên màn hình
const Stamp: React.FC<{ f: number; text: string; color: string; rot: number }> = ({ f, text, color, rot }) => {
  const p = interpolate(f, [0, 6], [0, 1], CLAMP);
  const sc = interpolate(f, [0, 6, 10], [2.2, 0.94, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${sc})`, border: `8px solid ${color}`, borderRadius: 14, padding: "10px 34px 12px", color, fontFamily: sans, fontWeight: 800, fontSize: 92, letterSpacing: 4, background: "rgba(10,14,15,0.35)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
        {text}
      </div>
    </div>
  );
};

// bộ đếm chỉnh sửa gen (beat 4) + mốc 2028 bị gạch rồi trượt xuống
const EditCounter: React.FC<{ t: number }> = ({ t }) => {
  const n = Math.round(150 * ease((t - 0.15) / 0.95));
  const inP = clamp01(t / 0.2);
  const tgtIn = clamp01((t - 2.4) / 0.2);
  const strike = clamp01((t - 3.3) / 0.25);
  const slide = ease((t - 3.7) / 0.6);
  return (
    <>
      <div style={{ position: "absolute", right: 56, top: 1010, textAlign: "right", opacity: inP * (1 - clamp01((t - 2.2) / 0.3)), fontFamily: mono, color: C.bone, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: C.ochreLight }}>GENE EDITS</div>
        <div style={{ fontSize: 96, fontWeight: 500, lineHeight: 1 }}>{String(n).padStart(3, "0")}{n >= 150 ? "+" : ""}</div>
      </div>
      {tgtIn > 0 && (
        <div style={{ position: "absolute", right: 56, top: 1010 + 260 * slide, textAlign: "right", opacity: tgtIn * (1 - slide), transform: `rotate(${8 * slide}deg)`, fontFamily: mono, color: C.bone, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
          <div style={{ fontSize: 24, letterSpacing: 6, color: C.ochreLight }}>TARGET</div>
          <div style={{ position: "relative", fontSize: 96, fontWeight: 500, lineHeight: 1 }}>
            2028
            <div style={{ position: "absolute", left: -6, top: "52%", height: 9, width: `${strike * 104}%`, background: "#E5533D" }} />
          </div>
        </div>
      )}
    </>
  );
};

const VsSlam: React.FC<{ f: number }> = ({ f }) => {
  const sc = interpolate(f, [0, 5, 9], [3, 0.92, 1], CLAMP);
  const o = interpolate(f, [0, 3, 40, 52], [0, 1, 1, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", opacity: o, transform: `scale(${sc})`, fontFamily: sans, fontWeight: 800, fontSize: 170, color: C.bone, WebkitTextStroke: "5px rgba(10,14,15,0.95)", paintOrder: "stroke fill", letterSpacing: 4 }}>
      VS
    </div>
  );
};

// ------------------------------------------------------------------ khung chính
export const Short009_3D: React.FC<SceneProps & { ink?: boolean; free?: boolean }> = (p) => {
  const f = useCurrentFrame();
  const assets = useFreeAssets(!!p.free);
  const { width, height, fps } = useVideoConfig();
  const idx = Math.max(0, p.scenes.findIndex((s, i) => f >= s.startFrame && (i === p.scenes.length - 1 || f < p.scenes[i + 1].startFrame)));
  const sc = p.scenes[idx];
  const t = (f - sc.startFrame) / fps;
  const T = f / fps;
  const markIn = interpolate(f, [p.scenes[1].startFrame, p.scenes[1].startFrame + 20], [0, 1], CLAMP);
  // whip/flash quanh mỗi cú cắt (tính theo frame tuyệt đối để whip của beat sau nhoè cả 2 frame cuối beat trước)
  let whip = 0, flash = 0;
  for (const s of p.scenes) {
    for (const [ct, kind] of CUTS[s.beat] ?? []) {
      const cf = s.startFrame + Math.round(ct * fps);
      const dfm = f - cf;
      if (kind === "whip" && dfm >= -2 && dfm <= 3) whip = Math.max(whip, 1 - Math.abs(dfm + 0.5) / 3.5);
      if (kind === "flash" && dfm >= 0 && dfm <= 5) flash = Math.max(flash, (cf === 0 ? 0 : 0.85) * (1 - dfm / 5));
    }
  }
  const punch = 1 + 0.35 * hitEnv(sc.beat, t);
  const dir = idx % 2 ? 1 : -1;
  const beatStart = (b: number) => p.scenes.find((s) => s.beat === b)!.startFrame;
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch + 0.06 * whip}) translateX(${dir * 70 * whip}px)`, filter: whip > 0.05 ? `blur(${18 * whip}px)` : undefined }}>
        {/* canvas chỉ mount khi model đã nạp xong (mount sớm -> frame trắng ngẫu nhiên) */}
        {(!p.free || assets) && (
          <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, near: 0.01, far: 800 }} gl={{ antialias: true }}>
            <FreeCtx.Provider value={assets}>
              <World beat={sc.beat} t={t} d={sc.durationFrames / fps} T={T} ink={p.ink} />
            </FreeCtx.Provider>
          </ThreeCanvas>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.22, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(6,9,10,0.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.45) 63%, rgba(10,14,15,0.55) 76%, rgba(10,14,15,0.2) 90%, rgba(10,14,15,0) 100%)" }} />
      {flash > 0 && <AbsoluteFill style={{ background: "#FFF8EC", opacity: flash }} />}
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D ILLUSTRATION
      </div>
      <Sequence from={beatStart(3) + Math.round(4.61 * fps)} durationInFrames={Math.round(0.85 * fps)}>
        <StampSeq text="IT WORKED ✓" color="#7CD992" rot={-6} />
      </Sequence>
      <Sequence from={beatStart(4)} durationInFrames={p.scenes.find((s) => s.beat === 4)!.durationFrames}>
        <CounterSeq />
      </Sequence>
      <Sequence from={beatStart(8) + Math.round(1.73 * fps)} durationInFrames={60}>
        <VsSeq />
      </Sequence>
      {p.notes.map((n, i) => (
        <Sequence key={i} from={n.startFrame} durationInFrames={n.durationFrames}>
          <FieldNote n={n} />
        </Sequence>
      ))}
      <Sequence from={p.endCard.startFrame} durationInFrames={p.endCard.durationFrames}>
        <EndCardView c={p.endCard} />
      </Sequence>
      {p.hookText ? (
        <Sequence from={0} durationInFrames={p.scenes[1].startFrame}>
          <HookHeadline text={p.hookText} dur={p.scenes[1].startFrame} />
        </Sequence>
      ) : null}
      <Captions groups={p.karaoke} fps={p.fps} />
      <div style={{ position: "absolute", right: 48, top: PANEL.top - 64, display: "flex", alignItems: "center", gap: 12, opacity: markIn }}>
        <Ammonite size={36} />
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 6, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>FOSSIL MYSTERIES</div>
      </div>
      <Grain srcs={p.grain} />
    </AbsoluteFill>
  );
};

// bản thử viền mực (r03_ink): cùng cảnh, cùng tiếng, thêm lớp Ink.tsx
export const Short009_3D_Ink: React.FC<SceneProps> = (p) => <Short009_3D {...p} ink />;
// r04: như r03_ink nhưng thú + cây + đá + kim tự tháp + đồ lab là model tải về (Poly Pizza / Kenney), không tự dựng khối
export const Short009_3D_Free: React.FC<SceneProps> = (p) => <Short009_3D {...p} ink free />;

const StampSeq: React.FC<{ text: string; color: string; rot: number }> = (q) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [18, 25], [1, 0], CLAMP);
  return <div style={{ opacity: o }}><Stamp f={f} {...q} /></div>;
};
const CounterSeq: React.FC = () => {
  const f = useCurrentFrame();
  return <EditCounter t={f / 30} />;
};
const VsSeq: React.FC = () => <VsSlam f={useCurrentFrame()} />;

// ------------------------------------------------------------------ thumbnail 9:16 (không chữ; chữ do thumb_text.py chèn)
// "voi lông lá": nửa voi nửa ma mút nhìn thẳng máy, nền chạng vạng tối, viền sáng từ sau lưng, chừa trời trống phía trên
export const Thumb009: React.FC = () => {
  const { width, height } = useVideoConfig();
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(-0.8, 0, 0);
  return (
    <AbsoluteFill style={{ background: "#16242A" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 38, near: 0.05, far: 800 }} gl={{ antialias: true }}>
        <Cam pos={[-8.2, 1.35, 2.5]} look={[-0.6, 2.85, 0.35]} fov={40} />
        <fog attach="fog" args={["#2B3B44", 14, 120]} />
        <hemisphereLight args={["#9FB6C8", "#3A3F38", 0.95]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><planeGeometry args={[400, 400]} /><meshStandardMaterial color="#59614C" roughness={1} transparent opacity={0.7} /></mesh>
        <primitive object={tgt} />
        <directionalLight position={[-10, 7, 4]} target={tgt} intensity={2.4} color="#FFE6C4" castShadow shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.016} />
        {/* viền sáng: đèn ấm ngược sáng từ phía sau */}
        <directionalLight position={[6, 5, -6]} intensity={5.5} color="#FFB45A" />
        <directionalLight position={[4, 3, 7]} intensity={1.2} color="#8FC7D6" />
        <Sky top="#0F1B26" hor="#5A6470" />
        <Steppe />
        <group rotation={[0, 0.72, 0]}>
          <Proboscid t={0.6} walk={0} mammoth={0.3} fur={0.85} coat={0.12} furColor="#6B4528" tusks={0.35} raise={0.3} phase={0.4} />
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 52%, rgba(0,0,0,0) 50%, rgba(6,9,10,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};
