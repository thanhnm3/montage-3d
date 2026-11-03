// Fossil Short 010 (2026-11-02): "Every sea monster, lined up by size" — size ladder 3D khối vuông, làm thẳng bản 3D
// (không có bản ảnh thật). Giọng Chirp3-HD Charon, phụ đề/field note/headline/end card như 009.
// Ý chính của hình: thợ lặn 1,8 m ("you") đứng ở ô đầu hàng; mỗi beat một con bơi ngang vào, rồi dựng đứng (mũi lên)
// vào ô của nó, thanh đo vàng mọc lên cùng bộ đếm mét. Mỗi con có góc máy riêng ở vùng biển khác (HERO) trước khi xếp hàng.
// Gag: Liopleurodon phình lên 25 m kiểu phim tài liệu 1999 rồi xì hơi về 6 m; xe buýt rơi xuống dựng đứng cạnh Mosasaurus;
// răng Livyatan so với cẳng tay trên bàn mẫu vật; bãi biển Blue Anchor nơi cô bé 11 tuổi nhặt được hàm Ichthyotitan;
// cá voi xanh bơi qua đầu cả hàng rồi dựng vào ô cuối. Mốc thời gian (giây trong beat) khớp sfx010.py.
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, CLAMP, Captions, EndCardView, FieldNote, Grain, HookHeadline, Ammonite, PANEL, mono, sans } from "./short008Overlays";
import type { SceneProps } from "./short008Overlays";
import { Box, BlockHuman, V3 } from "./BlockAnimals";
import { CityBus } from "./Act5Props";
import { BigTooth, BlockBlueWhale, BlockDiver, BlockIchthyosaur, BlockLivyatan, BlockMosasaur, BlockPliosaur, BlockShark, Forearm, JawBone } from "./SeaAnimals";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);
const TAU = Math.PI * 2;
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ------------------------------------------------------------------ hàng xếp theo cỡ
// 0 thợ lặn, 1 cá mập trắng, 2 Liopleurodon, 3 Mosasaurus, 4 Livyatan, 5 Megalodon, 6 Ichthyotitan, 7 cá voi xanh
const LEN = [1.8, 6, 6, 12, 17, 24, 25, 30];
const SLOT = [0, 4, 9, 14.5, 21, 29, 38, 47];
const HW = [0.4, 0.75, 0.8, 0.75, 1.6, 2.9, 1.9, 2.1]; // nửa bề ngang khi dựng đứng (phía bụng, -X)
const NAME = ["YOU", "GREAT WHITE", "LIOPLEURODON", "MOSASAURUS", "LIVYATAN", "MEGALODON", "ICHTHYOTITAN", "BLUE WHALE"];
const BASE = 0.3; // chóp đuôi cách cát
const HERO: V3 = [-150, 0, -150]; // vùng biển riêng cho các góc máy từng con (không vẽ hàng ở đó)
const h3 = (x: number, y: number, z: number): V3 => [HERO[0] + x, y, HERO[2] + z];
const barX = (i: number) => SLOT[i] - HW[i] - 0.7 * Math.max(1, LEN[i] / 10);

type AnimalP = { t: number; jaw?: number; swim?: number; phase?: number; dark?: boolean; flick?: number; wave?: number };
const Animal: React.FC<AnimalP & { i: number }> = ({ i, ...p }) => {
  switch (i) {
    case 0: return <BlockDiver t={p.t} wave={p.wave} />;
    case 1: return <BlockShark {...p} />;
    case 2: return <BlockPliosaur {...p} />;
    case 3: return <BlockMosasaur {...p} />;
    case 4: return <BlockLivyatan {...p} />;
    case 5: return <BlockShark {...p} meg />;
    case 6: return <BlockIchthyosaur {...p} />;
    default: return <BlockBlueWhale {...p} />;
  }
};

// k = 0: bơi ngang phía trước hàng, k = 1: dựng đứng trong ô (xoay quanh tâm thân)
const InSlot: React.FC<{ i: number; t: number; k?: number; sc?: number; jaw?: number; wave?: number }> = ({ i, t, k = 1, sc = 1, jaw = 0, wave = 0 }) => {
  if (i === 0)
    return (
      <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <BlockDiver t={t} wave={wave} />
      </group>
    );
  const L = LEN[i] * sc;
  const zf = 2.5 + LEN[i] * 0.12;
  const pos: V3 = [SLOT[i] + (1 - ease(k * 1.4)) * L * 0.35, BASE + L / 2, zf * (1 - ease(k))];
  return (
    <group position={pos} rotation={[0, 0, (-Math.PI / 2) * ease(k)]} scale={sc}>
      <Animal i={i} t={t} jaw={jaw} swim={lerp(1, 0.35, k)} phase={i * 0.37} />
    </group>
  );
};

type LineupSpec = { n: number; act?: { i: number; k: number; sc?: number; jaw?: number }; wave?: number };
const Lineup: React.FC<{ spec: LineupSpec; t: number }> = ({ spec, t }) => (
  <>
    {Array.from({ length: spec.n }, (_, i) =>
      spec.act && spec.act.i === i ? (
        <InSlot key={i} i={i} t={t} k={spec.act.k} sc={spec.act.sc} jaw={spec.act.jaw} />
      ) : (
        <InSlot key={i} i={i} t={t} wave={i === 0 ? spec.wave : 0} />
      ),
    )}
  </>
);

// thanh đo vàng bên trái con vật, cao đúng `val` mét
const MeasureBar: React.FC<{ i: number; val: number }> = ({ i, val }) => {
  const th = Math.max(1, LEN[i] / 8);
  const x = barX(i);
  const step = val <= 7 ? 1 : 5;
  return (
    <group>
      <Glow p={[x, BASE + val / 2, 0]} s={[0.08 * th, Math.max(0.01, val), 0.08 * th]} c="#F2D27A" i={1.6} />
      <Glow p={[x, BASE + val, 0]} s={[0.9 * th, 0.07 * th, 0.07 * th]} c="#FFE7A0" i={2.2} />
      <Glow p={[x, BASE, 0]} s={[0.9 * th, 0.07 * th, 0.07 * th]} c="#F2D27A" i={1.6} />
      {Array.from({ length: Math.floor(val / step) }, (_, j) => (
        <Glow key={j} p={[x + 0.12 * th, BASE + (j + 1) * step, 0]} s={[0.3 * th, 0.035 * th, 0.035 * th]} c="#F2D27A" i={1.2} />
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ cắt cảnh + va chạm (giây trong beat)
type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS: Record<number, Cut[]> = {
  1: [[1.12, "whip"], [2.02, "flash"], [3.5, "whip"]],
  2: [[0, "flash"], [1.54, "cut"]],
  3: [[0, "whip"], [1.65, "cut"], [2.67, "whip"]],
  4: [[0, "flash"], [1.6, "cut"], [4.36, "whip"]],
  5: [[0, "whip"], [1.22, "cut"], [2.3, "whip"]],
  6: [[0, "whip"], [1.03, "cut"], [2.39, "cut"], [3.79, "flash"]],
  7: [[0, "flash"], [1.24, "cut"]],
  8: [[0, "whip"], [1.34, "cut"], [2.92, "cut"], [4.74, "whip"], [6.02, "cut"], [6.98, "cut"]],
  9: [[1.06, "whip"], [2.88, "cut"], [4.32, "flash"]],
  10: [[0, "cut"]],
};
export const HITS: Record<number, [number, number][]> = {
  1: [[0.45, 0.14], [1.6, 0.08], [2.66, 0.16], [4.88, 0.3]],
  2: [[2.1, 0.06]],
  3: [[2.3, 0.1], [3.45, 0.14]],
  4: [[0.5, 0.1], [1.2, 0.08], [3.0, 0.22], [5.66, 0.15], [6.1, 0.08]],
  5: [[0.62, 0.12], [1.9, 0.08], [3.44, 0.32]],
  6: [[1.27, 0.18], [3.0, 0.1], [4.91, 0.16]],
  7: [[0.06, 0.32], [0.9, 0.12], [2.45, 0.25]],
  8: [[3.4, 0.12], [7.56, 0.14]],
  9: [[2.98, 0.1], [4.32, 0.38], [4.95, 0.2]],
};
function hitEnv(beat: number, t: number) {
  let e = 0;
  for (const [ht, s] of HITS[beat] ?? []) if (t >= ht) e += s * Math.exp(-(t - ht) * 9);
  return e;
}

// bộ đếm mét: [ô, từ, đến, t0, t1]
const CTR: Record<number, [number, number, number, number, number][]> = {
  2: [[0, 0, 1.8, 1.54, 2.1]],
  3: [[1, 1.8, 6, 1.65, 2.3]],
  4: [[2, 6, 25, 2.2, 3.0], [2, 25, 6, 5.66, 6.1]],
  5: [[3, 6, 12, 1.22, 1.9]],
  6: [[4, 12, 17, 2.39, 3.0]],
  7: [[5, 17, 24, 1.6, 2.45]],
  8: [[6, 24, 25, 2.92, 3.4]],
  9: [[7, 25, 30, 4.32, 4.95]],
};
type Ctr = { slot: number; val: number; pop: number; down: boolean };
function ctrAt(beat: number, t: number): Ctr | null {
  const L = CTR[beat];
  if (!L) return null;
  let e = L[0];
  for (const x of L) if (t >= x[3]) e = x;
  const [slot, a, b, t0, t1] = e;
  return { slot, val: lerp(a, b, ease((t - t0) / (t1 - t0))), pop: Math.exp(-Math.max(0, t - t1) * 6) * (t >= t1 ? 1 : 0), down: b < a && t >= t0 };
}

// ------------------------------------------------------------------ các góc máy
type Env = "ocean" | "beach" | "bench";
type Tag = { p: V3; text: string; big?: boolean };
type Shot = {
  env: Env; cam: V3; look: V3; fov?: number; shadow: number; actors?: React.ReactNode;
  lineup?: LineupSpec; bar?: boolean; dim?: number; tv?: boolean; tags?: Tag[];
};
const D21 = Math.tan((21 * Math.PI) / 180);
// khung đứng cho ô i: thấy trọn con vật + thanh đo + một phần con trước; ang xoay máy quanh điểm nhìn
function ladder(i: number, push = 0, sc = 1, ang = 0): Pick<Shot, "cam" | "look" | "fov"> {
  const H = BASE + LEN[i] * sc;
  const half = 0.56 * H + 1.3;
  const D = (half / D21) * (1 - 0.07 * push);
  const lx = SLOT[i] - Math.min(LEN[i] * 0.22, 4.5);
  const a = -0.12 + ang;
  return { cam: [lx + Math.sin(a) * D, H * 0.47 + 0.05 * D, Math.cos(a) * D], look: [lx, H * 0.47, 0], fov: 42 };
}
const you = (): Tag => ({ p: [0, 2.35, 0], text: "YOU" });

function shot(beat: number, t: number, d: number): Shot {
  const c = ctrAt(beat, t);
  switch (beat) {
    case 1: {
      if (t < 1.12) {
        // Megalodon lao thẳng vào máy, há hàm
        const x = 12 - 8 * t;
        return {
          env: "ocean", shadow: 30, cam: h3(-16, 9.2, 3.5), look: h3(x - 10, 9.6, 0), fov: 46,
          actors: <group position={h3(x, 10, 0)}><BlockShark t={t} meg jaw={0.3 + 0.7 * ease(t / 0.8)} /></group>,
        };
      }
      if (t < 2.02) {
        const u = t - 1.12, x = 6 - 7 * u;
        return {
          env: "ocean", shadow: 16, cam: h3(-3, 3.4, 6.5), look: h3(x - 3.5, 5.2, 0), fov: 50,
          actors: <group position={h3(x, 5, 0)}><BlockMosasaur t={t} jaw={pulse(t, 1.35, 1.75)} /></group>,
        };
      }
      if (t < 3.5) {
        // cả hàng (chưa có cá voi), máy sát đáy trượt dọc từ thợ lặn tới Ichthyotitan
        const k = ease((t - 2.02) / 1.48);
        return { env: "ocean", shadow: 40, lineup: { n: 7 }, cam: [lerp(2, 24, k), 2.6, 44], look: [lerp(8, 28, k), 11, 0], fov: 52, tags: [you()] };
      }
      // máy ngửa lên: bóng đen khổng lồ bơi phía trên ô cuối
      const k = ease((t - 3.5) / 1.6);
      const wx = 78 - 5 * (t - 3.5);
      return {
        env: "ocean", shadow: 40, lineup: { n: 7 }, cam: [36, 2.2, 24], look: [lerp(37, 50, k), lerp(14, 34, k), 0], fov: 56,
        actors: <group position={[wx, 40, -6]}><BlockBlueWhale t={t} dark flick={pulse(t, 4.7, 5.6)} /></group>,
      };
    }
    case 2: {
      if (t < 1.54)
        return {
          env: "ocean", shadow: 4, lineup: { n: 1, wave: pulse(t, 0.2, 1.4) },
          cam: lerp3([-0.7, 1.6, 3.7], [-0.5, 1.6, 3.2], t / 1.54), look: [0, 1.58, 0], fov: 40,
          actors: <Bubbles t={t} p={[-0.2, 1.7, 0.1]} />,
        };
      return { env: "ocean", shadow: 6, lineup: { n: 1, wave: pulse(t, 2.0, 3.2) * 0.6 }, bar: true, ...ladder(0, (t - 1.54) * 0.8), actors: <Bubbles t={t} p={[-0.2, 1.7, 0.1]} /> };
    }
    case 3: {
      if (t < 1.65) {
        const x = 6 - 4.2 * t;
        return { env: "ocean", shadow: 12, cam: h3(-4.5, 3.3, 5.6), look: h3(x - 2.2, 4.1, 0), fov: 44, actors: <group position={h3(x, 4, 0)}><BlockShark t={t} jaw={0.15} /></group> };
      }
      const act = { i: 1, k: ease((t - 1.65) / 0.6) };
      if (t < 2.67) return { env: "ocean", shadow: 10, lineup: { n: 2, act }, bar: true, tags: [you()], ...ladder(1, t - 1.65) };
      // POV thợ lặn: ngửa nhìn con cá mập dựng đứng
      return { env: "ocean", shadow: 10, lineup: { n: 2 }, cam: lerp3([-1.0, 1.05, 2.3], [-0.9, 0.9, 2.0], (t - 2.67) / 1.7), look: [4, 4.8, 0], fov: 54 };
    }
    case 4: {
      if (t < 1.6) {
        const x = 2 - 1.5 * t;
        return {
          env: "ocean", shadow: 12, cam: h3(-6.6, 4.5, 3.1), look: h3(x - 2.4, 5, 0), fov: 44,
          actors: <group position={h3(x, 5, 0)} rotation={[0, -0.25, 0]}><BlockPliosaur t={t} jaw={pulse(t, 0.25, 0.75) + pulse(t, 0.95, 1.45)} /></group>,
        };
      }
      // phình lên theo bộ đếm (25 m "trên TV"), rồi xì về 6 m
      const sc = c ? c.val / 6 : 1;
      const act = { i: 2, k: ease((t - 1.6) / 0.55), sc, jaw: pulse(t, 3.0, 3.6) };
      if (t < 4.36) return { env: "ocean", shadow: 30, lineup: { n: 3, act }, bar: true, tv: true, tags: [you()], ...ladder(2, 0, sc) };
      return { env: "ocean", shadow: 30, lineup: { n: 3, act }, bar: true, tags: [you()], ...ladder(2, (t - 4.36) * 0.5, sc, 0.45) };
    }
    case 5: {
      if (t < 1.22) {
        const x = 10 - 6 * t;
        return { env: "ocean", shadow: 14, cam: h3(-9, 5.3, 1.9), look: h3(x - 5, 5.1, 0), fov: 46, actors: <group position={h3(x, 5, 0)}><BlockMosasaur t={t} jaw={pulse(t, 0.4, 0.8)} /></group> };
      }
      const act = { i: 3, k: ease((t - 1.22) / 0.6) };
      if (t < 2.3) return { env: "ocean", shadow: 16, lineup: { n: 4, act }, bar: true, tags: [you()], ...ladder(3, t - 1.22) };
      // xe buýt rơi từ trên xuống, dựng đứng cạnh Mosasaurus (chạm cát đúng chữ "bus")
      const kf = clamp01((t - 2.6) / 0.84);
      const yb = 5.8 + 32 * (1 - kf) * (1 - kf) + (t > 3.44 ? 0.5 * Math.abs(Math.sin((t - 3.44) * 9)) * Math.exp(-(t - 3.44) * 5) : 0);
      return {
        env: "ocean", shadow: 18, lineup: { n: 4 }, bar: true,
        cam: lerp3([14.0, 6.0, 22], [14.6, 6.4, 20], (t - 2.3) / 1.8), look: [16.4, 6.4, 0], fov: 42,
        tags: t > 3.5 ? [{ p: [18.6, 12.6, 0.5], text: "CITY BUS · 11 m" }] : [],
        actors: (
          <>
            <group position={[18.6, yb, 0.5]} rotation={[0, 0, -Math.PI / 2]}>
              <group position={[0, -1.65, 0]}><CityBus t={0} /></group>
            </group>
            <Puff t={t - 3.44} p={[18.6, 0.2, 0.5]} />
          </>
        ),
      };
    }
    case 6: {
      if (t < 1.03) {
        const x = 3 - 3 * t;
        return { env: "ocean", shadow: 20, cam: h3(-7, 6.2, 19), look: h3(x - 3.5, 6.8, 0), fov: 44, actors: <group position={h3(x, 7, 0)}><BlockLivyatan t={t} jaw={0.25} /></group> };
      }
      if (t < 2.39) {
        const x = 3 - 3 * t;
        const jaw = t < 1.27 ? ease((t - 1.03) / 0.2) : 1 - ease((t - 1.27) / 0.12) + 0.3 * ease((t - 1.6) / 0.6);
        return { env: "ocean", shadow: 20, cam: h3(x - 14.5, 5.0, 3.6), look: h3(x - 7.2, 6.6, 0), fov: 44, actors: <group position={h3(x, 7, 0)}><BlockLivyatan t={t} jaw={jaw} /></group> };
      }
      const act = { i: 4, k: ease((t - 2.39) / 0.6) };
      if (t < 3.79) return { env: "ocean", shadow: 22, lineup: { n: 5, act }, bar: true, tags: [you()], ...ladder(4, t - 2.39) };
      // bàn mẫu vật: răng 36 cm cạnh cẳng tay ~26 cm
      const a = -0.2 + 0.35 * ease((t - 3.79) / 2.0);
      return {
        env: "bench", shadow: 1, cam: [Math.sin(a) * 1.35, 0.32, Math.cos(a) * 1.35], look: [0, 0.22, 0], fov: 38,
        tags: [
          ...(t > 4.0 ? [{ p: [-0.13, 0.44, 0] as V3, text: "TOOTH · 36 cm" }] : []),
          ...(t > 4.55 ? [{ p: [0.15, 0.4, 0] as V3, text: "FOREARM · ~26 cm" }] : []),
        ],
        actors: (
          <>
            <group position={[-0.13, 0, 0]}><BigTooth /></group>
            <group position={[0.15, 0, 0]}><Forearm /></group>
            {Array.from({ length: 5 }, (_, j) => <Glow key={j} p={[0.0, j * 0.1, 0.05]} s={[0.06, 0.004, 0.004]} c="#F2D27A" i={1.4} />)}
            <Glow p={[0.0, 0.2, 0.05]} s={[0.004, 0.4, 0.004]} c="#F2D27A" i={1.4} />
          </>
        ),
      };
    }
    case 7: {
      if (t < 1.24) {
        const x = 14 - 10 * t;
        return {
          env: "ocean", shadow: 30, cam: h3(-12 - 4 * t, 8.6, 2.6), look: h3(x - 10.5, 9.1, 0), fov: 48,
          actors: <group position={h3(x, 9, 0)}><BlockShark t={t} meg jaw={0.4 + 0.6 * ease(t / 0.5)} /></group>,
        };
      }
      const act = { i: 5, k: ease((t - 1.24) / 0.6), jaw: pulse(t, 2.2, 3.2) * 0.8 };
      return { env: "ocean", shadow: 34, lineup: { n: 6, act }, bar: true, tags: [you()], ...ladder(5, (t - 1.24) * 0.5) };
    }
    case 8: {
      if (t < 2.92) {
        const x = 6 - 4.5 * t;
        const actors = <group position={h3(x, 10, 0)}><BlockIchthyosaur t={t} /></group>;
        if (t < 1.34) return { env: "ocean", shadow: 30, cam: h3(-5, 9.2, 32), look: h3(x - 2, 10, 0), fov: 46, actors };
        // mắt to cỡ đĩa
        const ex = x - 0.425 * 25;
        return { env: "ocean", shadow: 8, cam: h3(ex - 1.7, 10.7, 4.4), look: h3(ex + 0.2, 10.4, 0.9), fov: 40, actors };
      }
      if (t < 4.74) return { env: "ocean", shadow: 36, lineup: { n: 7, act: { i: 6, k: ease((t - 2.92) / 0.6) } }, bar: true, tags: [you()], ...ladder(6, t - 2.92) };
      // bãi Blue Anchor (Somerset): vách đá sọc đỏ-xám, bố con đi dọc bãi, cô bé nhặt được mảnh hàm
      const walkX = -1.0 * (t - 4.74);
      const raise = ease((t - 7.05) / 0.5);
      const people = (
        <>
          <group position={[t < 6.02 ? 2 + walkX : -0.2, 0, 0]} scale={0.78}>
            <BlockHuman t={t} walk={t < 6.02 ? 1 : 0} wave={t >= 6.98 ? raise : 0} coat="#E2583A" />
          </group>
          <group position={[t < 6.02 ? 4 + walkX : 2.2, 0, 1.6]} rotation={[0, t < 6.02 ? 0 : -0.6, 0]}>
            <BlockHuman t={t} walk={t < 6.02 ? 1 : 0} coat="#3F6A8A" />
          </group>
          {t >= 6.02 && (
            <group position={raise > 0 ? lerp3([-0.75, 0.06, 0.25], [-0.2, 1.62, 0.5], raise) : [-0.75, 0.06, 0.25]} rotation={[0, 0.4, raise * 0.5]}>
              <JawBone />
            </group>
          )}
          {t >= 6.02 && <Sparkles t={t} p={raise > 0 ? [-0.2, 1.65, 0.5] : [-0.75, 0.12, 0.25]} />}
        </>
      );
      if (t < 6.02) return { env: "beach", shadow: 12, cam: lerp3([-11, 2.6, -8], [-10, 2.4, -7.2], (t - 4.74) / 1.3), look: [2.2, 1.6, 2], fov: 44, actors: people };
      if (t < 6.98) return { env: "beach", shadow: 4, cam: [-3.0, 1.35, 2.7], look: [-0.5, 0.45, 0.2], fov: 40, actors: people };
      return { env: "beach", shadow: 5, cam: lerp3([-3.4, 0.55, 2.3], [-3.1, 0.5, 2.1], (t - 6.98) / 1.6), look: [-0.2, 1.2, 0.3], fov: 46, actors: people, tags: t > 7.55 ? [{ p: [-0.2, 2.05, 0.5], text: "AGE 11" }] : [] };
    }
    case 9: {
      // cá voi xanh: bóng tối phủ lên cả hàng, bơi qua đầu, rồi dựng vào ô cuối
      const wx = 80 - 6 * t;
      const dim = t < 4.32 ? 0.55 * ease(t / 1.0) : 0.55 * (1 - ease((t - 4.32) / 0.4));
      const k = ease((t - 4.32) / 0.65);
      const whale =
        t < 4.32 ? (
          <group position={[wx, 40, -4]}><BlockBlueWhale t={t} /></group>
        ) : (
          <group position={lerp3([wx, 40, -4], [SLOT[7], BASE + 15, 0], k)} rotation={[0, 0, (-Math.PI / 2) * k]}>
            <BlockBlueWhale t={t} swim={lerp(1, 0.35, k)} flick={pulse(t, 4.3, 5.0)} />
          </group>
        );
      const base = { env: "ocean" as Env, shadow: 50, lineup: { n: 7 }, dim, actors: whale };
      if (t < 1.06) return { ...base, cam: [22, 3, 54], look: [24, 13, 0], fov: 50, tags: [you()] };
      if (t < 2.88) return { ...base, cam: [31, 1.4, 9], look: [45, 30, -3], fov: 62 };
      if (t < 4.32) return { ...base, cam: [30, 17, 96], look: [40, 22, 0], fov: 44, tags: [you()] };
      return { ...base, bar: true, cam: lerp3([70, 16, 50], [78, 18, 56], ease((t - 4.32) / 1.2)), look: [27, 14.5, 0], fov: 50, tags: [you()] };
    }
    default: {
      const k = ease(t / d);
      const a = 0.9 - 0.3 * k;
      const R = lerp(80, 82, k);
      return { env: "ocean", shadow: 50, lineup: { n: 8, wave: pulse(t, 0.4, 1.6) }, cam: [29 + Math.sin(a) * R, 12, Math.cos(a) * R], look: [29, 14.5, 0], fov: 50, tags: [you()] };
    }
  }
}

// ------------------------------------------------------------------ hiệu ứng 3D
const Glow: React.FC<{ p: V3; s: V3; c: string; i?: number; o?: number; r?: V3 }> = ({ p, s, c, i = 1.5, o = 1, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent={o < 1} opacity={o} depthWrite={o >= 1} />
  </mesh>
);

const Bubbles: React.FC<{ t: number; p: V3; n?: number }> = ({ t, p, n = 12 }) => (
  <group position={p}>
    {Array.from({ length: n }, (_, i) => {
      const u = (t * 0.7 + i / n) % 1;
      const s = 0.03 + 0.03 * hash(i);
      return <Glow key={i} p={[0.08 * Math.sin(i * 3.1 + t * 4), u * 2.2, 0.08 * Math.cos(i * 1.7 + t * 3)]} s={[s, s, s]} c="#D8F4FF" i={0.6} o={0.8 * (1 - u)} />;
    })}
  </group>
);

const Sparkles: React.FC<{ t: number; p: V3 }> = ({ t, p }) => (
  <group position={p}>
    {Array.from({ length: 7 }, (_, i) => {
      const s = Math.max(0, Math.sin(t * 5 + i * 2.1)) ** 3 * 0.06;
      return s > 0.004 ? <Glow key={i} p={[(hash(i) - 0.5) * 0.6, (hash(i + 3) - 0.3) * 0.3, (hash(i + 6) - 0.5) * 0.4]} s={[s, s, s]} c="#FFE7A0" i={4} r={[0.6, 0.8, 0.3]} /> : null;
    })}
  </group>
);

// bụi cát bung ra khi xe buýt chạm đáy
const Puff: React.FC<{ t: number; p: V3 }> = ({ t, p }) => {
  if (t < 0 || t > 1.8) return null;
  return (
    <group position={p}>
      {Array.from({ length: 30 }, (_, i) => {
        const a = hash(i) * TAU, sp = 2 + 4 * hash(i + 2);
        const s = 0.7 * (1 - t / 1.8) + 0.2;
        return <Box key={i} p={[Math.cos(a) * sp * Math.sqrt(t), 0.3 + (1 + 2 * hash(i + 4)) * Math.sqrt(t), Math.sin(a) * sp * Math.sqrt(t)]} s={[s, s, s]} c={i % 2 ? "#CDBB90" : "#B9A67C"} />;
      })}
    </group>
  );
};

// tuyết biển (hạt trắng trôi xuống), theo thời gian tuyệt đối T cho liền mạch qua cú cắt; scale theo cỡ khung
const MarineSnow: React.FC<{ center: V3; T: number; scale: number }> = ({ center, T, scale }) => {
  const W = 16 * scale, H = 12 * scale;
  return (
    <group position={[center[0], center[1] - H / 2, center[2]]}>
      {Array.from({ length: 150 }, (_, i) => {
        const u = hash(i), v = hash(i + 100), w = hash(i + 200);
        const y = (((v * H - 0.25 * T * scale) % H) + H) % H;
        const s = (0.035 + 0.03 * hash(i + 300)) * scale;
        return (
          <mesh key={i} position={[(u - 0.5) * W + 0.3 * Math.sin(T * 0.5 + i) * scale, y, (w - 0.5) * W]}>
            <boxGeometry args={[s, s, s]} />
            <meshBasicMaterial color="#DDEFF4" transparent opacity={0.55} />
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
const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

const Sky: React.FC<{ top: string; hor: string; bot?: string }> = ({ top, hor, bot }) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(400, 32, 16);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const T = new THREE.Color(top), H = new THREE.Color(hor), B = new THREE.Color(bot ?? hor), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 400;
      if (y >= 0) c.copy(H).lerp(T, THREE.MathUtils.smoothstep(y, 0, 0.5));
      else c.copy(H).lerp(B, THREE.MathUtils.smoothstep(-y, 0, 0.4));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [top, hor, bot]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

const Ocean: React.FC<{ T: number }> = ({ T }) => {
  const deco = useMemo(() => {
    const r = rng(23);
    const area = () => (r() < 0.5 ? [-30 + r() * 110, -40 + r() * 70] : [HERO[0] - 60 + r() * 120, HERO[2] - 60 + r() * 120]);
    const rocks = Array.from({ length: 110 }, () => { const [x, z] = area(); return { x, z, s: 0.5 + r() * 2.4, ry: r() * 3 }; });
    const kelp = Array.from({ length: 90 }, () => { const [x, z] = area(); return { x, z, h: 3 + r() * 9, ph: r() * 6 }; });
    const coral = Array.from({ length: 70 }, () => { const [x, z] = area(); return { x, z, s: 0.3 + r() * 0.8, c: ["#E07A5F", "#F2CC8F", "#C9729B", "#81B29A"][Math.floor(r() * 4)] }; });
    const rays = Array.from({ length: 46 }, () => { const [x, z] = area(); return { x, z, w: 1.5 + r() * 4, ry: r() * 3 }; });
    return { rocks, kelp, coral, rays };
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#B9AC84" roughness={1} />
      </mesh>
      {deco.rocks.map((s, i) => <Box key={`r${i}`} p={[s.x, s.s * 0.3, s.z]} s={[s.s, s.s * 0.6, s.s * 0.8]} c={i % 3 ? "#6F7A78" : "#5C6664"} r={[0, s.ry, 0]} />)}
      {deco.coral.map((s, i) => <Box key={`c${i}`} p={[s.x, s.s * 0.5, s.z]} s={[s.s, s.s, s.s]} c={s.c} r={[0, i, 0]} />)}
      {deco.kelp.map((k, i) => (
        <group key={`k${i}`} position={[k.x, 0, k.z]}>
          {Array.from({ length: 4 }, (_, j) => (
            <Box key={j} p={[0.25 * j * Math.sin(T * 0.8 + k.ph), (k.h / 4) * (j + 0.5), 0.15 * j * Math.cos(T * 0.6 + k.ph)]} s={[0.22, k.h / 4 + 0.05, 0.08]} c={j % 2 ? "#3F7A4E" : "#4C8C58"} />
          ))}
        </group>
      ))}
      {/* tia sáng chéo từ mặt nước */}
      {deco.rays.map((g, i) => (
        <mesh key={`g${i}`} position={[g.x, 24, g.z]} rotation={[0.18, g.ry, 0.22]}>
          <boxGeometry args={[g.w, 52, 0.05]} />
          <meshBasicMaterial color="#BFEAF5" transparent opacity={0.055} depthWrite={false} />
        </mesh>
      ))}
      {/* mặt nước nhìn từ dưới lên */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 48, 0]}>
        <planeGeometry args={[900, 900]} />
        <meshBasicMaterial color="#8FD0E4" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

const Beach: React.FC = () => {
  const pebbles = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 140 }, () => ({ x: (r() - 0.5) * 50, z: -10 + r() * 30, s: 0.06 + r() * 0.2, c: ["#8C8F86", "#9E6A56", "#B8AE98"][Math.floor(r() * 3)] }));
  }, []);
  const BANDS = ["#9E5A48", "#8C8F86", "#B07A5E", "#7E8A7A", "#A2604C", "#93968C"];
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#C9B48E" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -140]}>
        <planeGeometry args={[600, 260]} />
        <meshStandardMaterial color="#5E8FA6" roughness={0.3} metalness={0.2} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => <Box key={`w${i}`} p={[-60 + i * 11 + ((i * 7) % 5), 0.05, -10.2 - (i % 3) * 0.6]} s={[6, 0.04, 0.25]} c="#E8F0F0" />)}
      {pebbles.map((p, i) => <Box key={i} p={[p.x, p.s * 0.4, p.z]} s={[p.s, p.s * 0.6, p.s * 0.8]} c={p.c} />)}
      {/* vách đá Blue Anchor: các lớp đá bùn đỏ / xám */}
      {Array.from({ length: 5 }, (_, s) => (
        <group key={s} position={[-60 + s * 30, 0, 30 + (s % 2) * 3]}>
          {BANDS.map((c, j) => <Box key={j} p={[0, 1.6 + j * 3.1, 0]} s={[31, 3.2, 8 - j * 0.4]} c={c} />)}
        </group>
      ))}
    </>
  );
};

const Bench: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[4, 4]} />
      <meshStandardMaterial color="#2C3638" roughness={0.8} />
    </mesh>
    <Box p={[0, 0.6, -0.6]} s={[4, 1.2, 0.02]} c="#1C2426" />
    <Box p={[0, -0.002, 0]} s={[0.8, 0.004, 0.4]} c="#3E4A4C" />
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

// rung máy: lệch vị trí + điểm nhìn theo vài sóng sin, tắt dần sau mỗi va chạm
function shake(s: Shot, beat: number, t: number, T: number): { cam: V3; look: V3 } {
  const h = hitEnv(beat, t);
  const sh = (f: number, o: number) => h * 0.9 * Math.sin(T * f + o);
  const dist = Math.hypot(s.cam[0] - s.look[0], s.cam[1] - s.look[1], s.cam[2] - s.look[2]);
  const amp = Math.min(3, dist / 6);
  return {
    cam: [s.cam[0] + sh(61, 0) * amp, s.cam[1] + sh(47, 1.3) * amp, s.cam[2] + sh(53, 2.1) * amp],
    look: [s.look[0] + sh(43, 0.7) * amp, s.look[1] + sh(57, 2.4) * amp, s.look[2]],
  };
}

const World: React.FC<{ s: Shot; cam: V3; look: V3; t: number; T: number; ctr: Ctr | null }> = ({ s, cam, look, t, T, ctr }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(s.look[0], 0, s.look[2]);
  const S = s.shadow;
  const dim = s.dim ?? 0;
  const dist = Math.hypot(cam[0] - look[0], cam[1] - look[1], cam[2] - look[2]);
  let lights: React.ReactNode;
  if (s.env === "ocean") {
    const fogC = mixC("#14627F", "#071E2A", dim);
    lights = (
      <>
        <fog attach="fog" args={[fogC, 10 + dist * 0.25, 70 + dist * 2.2]} />
        <hemisphereLight args={["#A6DCEB", "#21404A", 1.35 * (1 - 0.6 * dim)]} />
        <directionalLight position={[s.look[0] - S * 0.4, 70, s.look[2] + S * 0.5]} target={tgt} intensity={2.7 * (1 - 0.7 * dim)} color="#E4F6FA" castShadow
          shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
          shadow-camera-near={1} shadow-camera-far={160} shadow-bias={-0.0004} shadow-normalBias={S * 0.002} />
        <directionalLight position={[s.look[0] + 20, 10, s.look[2] + 30]} intensity={0.8 * (1 - 0.5 * dim)} color="#7FC4D8" />
        <Sky top={mixC("#3FA7CC", "#0B2E40", dim)} hor={fogC} bot={mixC("#0D4A62", "#04141C", dim)} />
        <Ocean T={T} />
        <MarineSnow center={look} T={T} scale={Math.max(0.25, dist / 14)} />
      </>
    );
  } else if (s.env === "beach") {
    lights = (
      <>
        <fog attach="fog" args={["#DDE7EA", 40, 260]} />
        <hemisphereLight args={["#DCE9F4", "#8A7650", 1.1]} />
        <primitive object={tgt} />
        <directionalLight position={[s.look[0] - S, S * 1.1, s.look[2] - S * 0.6]} target={tgt} intensity={3.4} color="#FFF0D8" castShadow
          shadow-mapSize={[4096, 4096]} shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
          shadow-camera-near={0.05} shadow-camera-far={S * 5} shadow-bias={-0.0004} shadow-normalBias={S * 0.002} />
        <Sky top="#6FA8D6" hor="#E8EEEC" />
        <Beach />
      </>
    );
  } else {
    lights = (
      <>
        <fog attach="fog" args={["#141B1D", 2, 6]} />
        <hemisphereLight args={["#C8D6DA", "#1A2224", 0.9]} />
        <primitive object={tgt} />
        <spotLight position={[-0.6, 1.6, 0.9]} target={tgt} angle={0.5} penumbra={0.6} intensity={9} color="#FFF1DE" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} />
        <directionalLight position={[0.8, 0.6, -0.6]} intensity={1.6} color="#E8927C" />
        <color attach="background" args={["#141B1D"]} />
        <Bench />
      </>
    );
  }
  return (
    <>
      <Cam pos={cam} look={look} fov={s.fov ?? 42} />
      {s.env === "ocean" && <primitive object={tgt} />}
      {lights}
      {s.lineup && <Lineup spec={s.lineup} t={t} />}
      {s.bar && ctr && <MeasureBar i={ctr.slot} val={ctr.val} />}
      {s.actors}
    </>
  );
};

// ------------------------------------------------------------------ chữ trên màn hình
function project(p: V3, cam: V3, look: V3, fov: number, w: number, h: number) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.01, 2000);
  c.position.set(...cam);
  c.lookAt(new THREE.Vector3(...look));
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h, ok: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 };
}

const TagView: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <div style={{ position: "absolute", left: Math.min(Math.max(x, 200), 880), top: Math.max(y, 380), transform: "translate(-50%, -100%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: 4, color: C.bone, background: "rgba(10,14,15,0.72)", border: `2px solid ${C.ochreLight}`, borderRadius: 8, padding: "4px 14px", whiteSpace: "nowrap" }}>{text}</div>
    <div style={{ width: 3, height: 26, background: C.ochreLight }} />
  </div>
);

const CounterView: React.FC<{ x: number; y: number; ctr: Ctr }> = ({ x, y, ctr }) => {
  const v = ctr.val;
  const txt = v < 2.5 ? v.toFixed(1) : String(Math.round(v));
  const sc = 1 + 0.25 * ctr.pop;
  const col = ctr.down ? "#7CD992" : C.bone;
  return (
    <div style={{ position: "absolute", left: Math.min(Math.max(x, 230), 850), top: Math.min(Math.max(y, 730), 1150), transform: `translate(-50%, -100%) scale(${sc})`, textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 28, letterSpacing: 6, color: C.ochreLight, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{NAME[ctr.slot]}</div>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 132, lineHeight: 1, color: col, WebkitTextStroke: "5px rgba(10,14,15,0.95)", paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
        {txt}<span style={{ fontSize: 70 }}> m</span>
      </div>
    </div>
  );
};

const Stamp: React.FC<{ f: number; text: string; color: string; rot: number }> = ({ f, text, color, rot }) => {
  const p = interpolate(f, [0, 6], [0, 1], CLAMP);
  const sc = interpolate(f, [0, 6, 10], [2.2, 0.94, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${sc})`, border: `8px solid ${color}`, borderRadius: 14, padding: "8px 30px 10px", color, fontFamily: sans, fontWeight: 800, fontSize: 76, letterSpacing: 4, background: "rgba(10,14,15,0.45)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
        {text}
      </div>
    </div>
  );
};

// lớp "phim tài liệu 1999": sọc quét, viền tối, nhãn PLAY góc trên
const TvLayer: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)" }} />
    <AbsoluteFill style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.75)" }} />
    <div style={{ position: "absolute", left: 60, top: 1150, fontFamily: mono, fontSize: 44, color: "#F4F1E6", letterSpacing: 4, textShadow: "3px 0 #FF3B3B, -3px 0 #3BC4FF", opacity: Math.floor(f / 12) % 2 ? 1 : 0.65 }}>
      ▶ PLAY · TV 1999
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ khung chính
export const Short010_3D: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const idx = Math.max(0, p.scenes.findIndex((s, i) => f >= s.startFrame && (i === p.scenes.length - 1 || f < p.scenes[i + 1].startFrame)));
  const sc = p.scenes[idx];
  const t = (f - sc.startFrame) / fps;
  const T = f / fps;
  const s = shot(sc.beat, t, sc.durationFrames / fps);
  const { cam, look } = shake(s, sc.beat, t, T);
  const fov = s.fov ?? 42;
  const ctr = s.bar ? ctrAt(sc.beat, t) : null;
  const markIn = interpolate(f, [p.scenes[1].startFrame, p.scenes[1].startFrame + 20], [0, 1], CLAMP);
  let whip = 0, flash = 0;
  for (const q of p.scenes) {
    for (const [ct, kind] of CUTS[q.beat] ?? []) {
      const cf = q.startFrame + Math.round(ct * fps);
      const dfm = f - cf;
      if (kind === "whip" && dfm >= -2 && dfm <= 3) whip = Math.max(whip, 1 - Math.abs(dfm + 0.5) / 3.5);
      if (kind === "flash" && dfm >= 0 && dfm <= 5) flash = Math.max(flash, (cf === 0 ? 0 : 0.85) * (1 - dfm / 5));
    }
  }
  const punch = 1 + 0.35 * hitEnv(sc.beat, t);
  const dir = idx % 2 ? 1 : -1;
  const beatStart = (b: number) => p.scenes.find((q) => q.beat === b)!.startFrame;
  const tags = (s.tags ?? []).map((g) => ({ g, q: project(g.p, cam, look, fov, width, height) })).filter((x) => x.q.ok);
  const cpos = ctr ? project([barX(ctr.slot), BASE + ctr.val + 0.4 * Math.max(1, LEN[ctr.slot] / 8), 0], cam, look, fov, width, height) : null;
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch + 0.06 * whip}) translateX(${dir * 70 * whip}px)`, filter: [whip > 0.05 ? `blur(${18 * whip}px)` : "", s.tv ? "sepia(0.55) contrast(1.15) saturate(0.8)" : ""].join(" ").trim() || undefined }}>
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, near: 0.01, far: 1200 }} gl={{ antialias: true }}>
          <World s={s} cam={cam} look={look} t={t} T={T} ctr={ctr} />
        </ThreeCanvas>
        {tags.map(({ g, q }, i) => <TagView key={i} x={q.x} y={q.y} text={g.text} />)}
        {ctr && cpos && <CounterView x={cpos.x} y={cpos.y} ctr={ctr} />}
      </AbsoluteFill>
      {s.tv && <TvLayer f={f} />}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.2, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(6,9,10,0.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.45) 63%, rgba(10,14,15,0.55) 76%, rgba(10,14,15,0.2) 90%, rgba(10,14,15,0) 100%)" }} />
      {flash > 0 && <AbsoluteFill style={{ background: "#FFF8EC", opacity: flash }} />}
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D ILLUSTRATION
      </div>
      <Sequence from={beatStart(4) + Math.round(5.66 * fps)} durationInFrames={Math.round(1.1 * fps)}>
        <StampSeq text="ACTUAL SIZE" color="#7CD992" rot={-5} />
      </Sequence>
      <Sequence from={beatStart(9) + Math.round(4.32 * fps)} durationInFrames={Math.round(1.25 * fps)}>
        <StampSeq text="STILL ALIVE" color="#F2D27A" rot={4} />
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

const StampSeq: React.FC<{ text: string; color: string; rot: number }> = (q) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [24, 32], [1, 0], CLAMP);
  return <div style={{ opacity: o }}><Stamp f={f} {...q} /></div>;
};

// ------------------------------------------------------------------ thumbnail 9:16 (không chữ; chữ do thumb_text.py chèn)
// cả hàng dựng đứng nhìn từ dưới lên, cá voi xanh cao nhất bên phải, thợ lặn tí hon ở góc trái dưới; chừa nước trống phía trên
export const Thumb010: React.FC = () => {
  const { width, height } = useVideoConfig();
  const cam: V3 = [82, 2.2, 56], look: V3 = [31, 25, 0];
  return (
    <AbsoluteFill style={{ background: "#0B2A38" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, near: 0.05, far: 1200 }} gl={{ antialias: true }}>
        <World s={{ env: "ocean", cam, look, fov: 56, shadow: 50, lineup: { n: 8 }, dim: 0.25 }} cam={cam} look={look} t={0.8} T={0.8} ctr={null} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 55%, rgba(0,0,0,0) 50%, rgba(4,10,14,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
