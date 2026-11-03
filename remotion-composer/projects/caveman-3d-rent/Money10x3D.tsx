// Caveman Short "What If Your Money Grew 10x Every Day?" r01 (2026-10-30): lớp NỀN 3D khối vuông, cùng công thức Rent3D.
// Flint (nhỏ, góc dưới trái), chữ slam, HUD và giọng do PoseReel vẽ lên trên
// (projects/caveman-short-money10x/scenes/make_spec.py). Mốc giây tuyệt đối lấy từ artifacts/whisper_words.json.
import React from "react";
import { Box, V3 } from "../fossil-3d-city-test/BlockAnimals";
import {
  Bill, BlockPerson, BlockTree, Burst, Campfire, Cave, CitySet, Coin, CutKind, Cyl, DAY, DARK, DUSK, Env, GOLD, GOLDEN, Glow,
  Gold, OCHRE, Plate, SEPIA, STUDIO, Shot, Stage, Street, TAU, Table, clamp01, ease, hash, lerp, lerp3, mixEnv, popK,
} from "./Rent3D";

export const CUTS10: [number, CutKind][] = [
  [1.3, "whip"], [3.14, "flash"], [4.67, "whip"], [6.38, "flash"], [9.21, "whip"], [11.36, "cut"], [13.84, "flash"],
  [16.72, "cut"], [18.39, "whip"], [19.84, "cut"], [21.3, "flash"], [24.16, "whip"], [25.84, "cut"], [28.1, "whip"],
  [30.66, "cut"], [33.58, "flash"], [35.42, "cut"], [38.46, "cut"],
];
export const HITS10: [number, number][] = [
  [1.72, 0.05], [2.02, 0.06], [2.32, 0.07], [2.66, 0.08], [3.82, 0.32], [5.58, 0.12], [7.48, 0.3], [10.26, 0.06],
  [12.56, 0.08], [14.94, 0.06], [15.3, 0.08], [17.76, 0.12], [20.02, 0.08], [22.4, 0.12], [23.3, 0.1], [26.06, 0.08],
  [27.26, 0.12], [29.7, 0.33], [32.42, 0.08], [34.2, 0.12], [37.04, 0.25],
];
const SEAM = 38.46;
const JUMPS = [1.72, 2.02, 2.32, 2.66];

function hitEnv(T: number) {
  let e = 0;
  for (const [ht, s] of HITS10) if (T >= ht) e += s * Math.exp(-(T - ht) * 9);
  return e;
}

export const NIGHT: Env = { top: "#0F1630", hor: "#3A3156", fog: ["#2A2844", 30, 200], ground: "#3A4038", hemi: ["#7F8FC0", "#1A1A26", 0.5], sunC: "#AFC0FF", sunI: 0.5, sunDir: [0.5, 1, 0.4] };
const SAVANNA: Env = { ...GOLDEN, ground: "#C9B26A", fog: ["#F0D2A0", 40, 260] };
export const KITCHEN: Env = mixEnv(SEPIA, DARK, 0.55);

// ------------------------------------------------------------------ đạo cụ riêng của tập này
// núi vàng bậc thang n x n (n=1 là một khối)
export const GoldHeap: React.FC<{ n: number; c: number }> = ({ n, c }) => (
  <group>
    {Array.from({ length: n }, (_, l) => {
      const m = n - l;
      return Array.from({ length: m * m }, (_, i) => (
        <Gold key={`${l}-${i}`} p={[((i % m) - (m - 1) / 2) * c, c / 2 + l * c * 0.92, (Math.floor(i / m) - (m - 1) / 2) * c]} s={[c * 0.96, c * 0.92, c * 0.96]} glow={0.3} />
      ));
    })}
  </group>
);

const Stall: React.FC<{ glow: number }> = ({ glow }) => (
  <group>
    <Box p={[0, 0.5, 0]} s={[2.4, 1.0, 0.9]} c="#9A6A40" />
    <Box p={[0, 1.02, 0]} s={[2.5, 0.06, 1.0]} c="#B98A58" />
    {[-1.15, 1.15].map((x) => <Box key={x} p={[x, 1.6, -0.35]} s={[0.1, 2.2, 0.1]} c="#7A5236" />)}
    {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[-1.05 + i * 0.42, 2.72, 0.05]} s={[0.42, 0.08, 1.2]} c={i % 2 ? "#F3EAD9" : "#C4482E"} r={[0.22, 0, 0]} />)}
    {[-0.6, 0, 0.6].map((x, i) => (
      <group key={x} position={[x, 1.15, 0.05]} rotation={[0, (i - 1) * 0.2, 0]}>
        <Box p={[0, 0, 0]} s={[0.42, 0.2, 0.24]} c="#C98E4A" />
        <Box p={[0, 0.09, 0]} s={[0.34, 0.08, 0.18]} c="#DDA864" />
        {glow > 0 && <Glow p={[0, 0, 0]} s={[0.48, 0.26, 0.3]} c="#FFE08A" i={1.2} o={0.35 * glow} />}
      </group>
    ))}
  </group>
);

export const Shells: React.FC<{ n: number; seed?: number }> = ({ n, seed = 0 }) => (
  <group>
    {Array.from({ length: n }, (_, i) => {
      const a = hash(i + seed) * TAU, r = Math.sqrt(i / Math.max(1, n)) * (0.12 + 0.05 * Math.sqrt(n));
      const y = 0.03 + (1 - r / (0.12 + 0.05 * Math.sqrt(n) + 1e-6)) * 0.02 * Math.sqrt(n);
      return <Box key={i} p={[Math.cos(a) * r, y, Math.sin(a) * r]} s={[0.07, 0.03, 0.05]} c={i % 3 ? "#F2E6D8" : "#E8B8A8"} r={[0, a, 0.2]} />;
    })}
  </group>
);

export const Meat: React.FC = () => (
  <group>
    <Box p={[0, 0.12, 0]} s={[0.5, 0.22, 0.34]} c="#A8402E" />
    <Box p={[0, 0.2, 0]} s={[0.4, 0.06, 0.26]} c="#C45A44" />
    <Box p={[0.33, 0.12, 0]} s={[0.3, 0.06, 0.06]} c="#EFE6D4" />
    <Box p={[0.48, 0.12, 0]} s={[0.08, 0.12, 0.12]} c="#EFE6D4" />
  </group>
);

const FLAGS: Record<string, string[]> = {
  de: ["#1E1E1E", "#C8102E", "#F2C300"],
  hu: ["#CE2939", "#FFFFFF", "#477050"],
  zw: ["#2E8B3E", "#F5C518", "#D0262E", "#1E1E1E", "#D0262E", "#F5C518", "#2E8B3E"],
};
const FlagPost: React.FC<{ k: string; T: number }> = ({ k, T }) => {
  const st = FLAGS[k];
  const h = 1.2 / st.length;
  return (
    <group>
      <Box p={[0, 0.75, 0]} s={[2.6, 1.5, 2.6]} c="#CFC4AE" />
      <Box p={[-0.9, 3.3, 0]} s={[0.08, 3.6, 0.08]} c="#5A5248" />
      <group position={[-0.86, 4.35, 0]} rotation={[0, 0.25 * Math.sin(T * 3 + k.length), 0]}>
        {st.map((c, i) => <Box key={i} p={[0.9, 0.6 - h / 2 - i * h, 0]} s={[1.8, h, 0.04]} c={c} />)}
        {k === "zw" && <Box p={[0.25, 0, 0.03]} s={[0.5, 0.7, 0.02]} c="#FFFFFF" />}
      </group>
    </group>
  );
};

const Wheelbarrow: React.FC<{ T: number }> = ({ T }) => (
  <group>
    <Box p={[0, 0.6, 0]} s={[1.3, 0.4, 0.8]} c="#6B4A2E" />
    <Cyl p={[0.75, 0.25, 0]} r={0.25} h={0.12} c="#3A2A20" rot={[Math.PI / 2, 0, T * 4]} />
    {[0.32, -0.32].map((z) => <Box key={z} p={[-0.95, 0.65, z]} s={[0.8, 0.06, 0.06]} c="#5A3E2A" />)}
    {Array.from({ length: 18 }, (_, i) => (
      <Box key={i} p={[-0.45 + (i % 3) * 0.45, 0.88 + Math.floor(i / 6) * 0.15, -0.25 + (Math.floor(i / 3) % 2) * 0.5]} s={[0.42, 0.14, 0.24]} c={i % 2 ? "#8DA06E" : "#B59A6A"} r={[0, (hash(i) - 0.5) * 0.3, 0]} />
    ))}
  </group>
);

export const Stove: React.FC<{ T: number; flare: number }> = ({ T, flare }) => (
  <group>
    <Box p={[0, 0.45, 0]} s={[1.0, 0.9, 0.7]} c="#2A2A2C" />
    <Box p={[0, 0.92, 0]} s={[1.1, 0.06, 0.8]} c="#3A3A3E" />
    <Box p={[0.3, 1.9, -0.15]} s={[0.18, 2, 0.18]} c="#2A2A2C" />
    <Box p={[-0.15, 0.45, 0.37]} s={[0.5, 0.4, 0.02]} c="#140C08" />
    <Glow p={[-0.15, 0.42, 0.36]} s={[0.42, 0.3 + 0.05 * Math.sin(T * 15), 0.02]} c="#FF8A2A" i={2.5 + 2 * flare} />
    <Box p={[-0.5, 0.45, 0.6]} s={[0.04, 0.4, 0.5]} c="#2A2A2C" r={[0, -0.9, 0]} />
    <pointLight position={[-0.15, 0.5, 0.8]} color="#FF9A4A" intensity={(5 + Math.sin(T * 13)) * (1 + 1.5 * flare)} distance={6} decay={1.4} />
  </group>
);

const ShopFront: React.FC = () => (
  <group>
    <Box p={[0, 3, 0]} s={[9, 6, 4]} c="#E7D7B8" />
    <Box p={[0, 6.3, 0]} s={[9.4, 0.6, 4.4]} c="#8A5A3A" />
    <Box p={[-1.6, 1.5, 2.02]} s={[3.6, 2.2, 0.05]} c="#BFD6E2" />
    <Box p={[2.4, 1.2, 2.02]} s={[1.2, 2.4, 0.05]} c="#5A3A22" />
    {Array.from({ length: 8 }, (_, i) => <Box key={i} p={[-3.9 + i * 1.1, 3.0, 2.6]} s={[1.1, 0.08, 1.4]} c={i % 2 ? "#F3EAD9" : "#477050"} r={[0.35, 0, 0]} />)}
    {[-2.4, 0, 2.4].map((x) => <Box key={x} p={[x, 4.6, 2.02]} s={[1.4, 1.2, 0.05]} c="#3A4048" />)}
  </group>
);

const BigNote: React.FC = () => (
  <group>
    <Box p={[0, 0, 0]} s={[3.2, 0.06, 1.4]} c="#6D9AA8" />
    <Box p={[0, 0.035, 0]} s={[2.9, 0.01, 1.15]} c="#8FB8B8" />
    <Box p={[-0.9, 0.04, 0]} s={[0.8, 0.01, 0.8]} c={OCHRE} />
    <Box p={[0.8, 0.04, 0.3]} s={[1.0, 0.01, 0.18]} c="#C4482E" />
    <Box p={[0.8, 0.04, -0.1]} s={[1.2, 0.01, 0.12]} c="#3A4A50" />
  </group>
);

export const Acacia: React.FC<{ h?: number }> = ({ h = 4 }) => (
  <group>
    <Box p={[0, h * 0.45, 0]} s={[0.3, h * 0.9, 0.3]} c="#6A4A2E" r={[0, 0, 0.08]} />
    <Box p={[0.2, h, 0]} s={[4.2, 0.5, 3.2]} c="#6E8A3E" />
    <Box p={[0.2, h + 0.35, 0]} s={[3.0, 0.3, 2.4]} c="#7C9A48" />
  </group>
);

// ------------------------------------------------------------------ các góc máy
function streetShot(t: number): Shot {
  return {
    env: DAY, S: 8, cam: lerp3([2.5, 1.15, 11.4], [2.3, 1.1, 10.9], clamp01(t / 1.3)), look: [1.4, 0.85, 9], fov: 40, shift: 110,
    node: (
      <>
        <Street />
        <group position={[1.4, 0, 9]}>
          <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 1.0]} c="#B07A48" />
          <group rotation={[0, t * 2.5, 0]} position={[0, 0.82, 0]}><Coin p={[0, 0, 0]} r={0.2} rot={[Math.PI / 2, 0, 0]} /></group>
        </group>
      </>
    ),
  };
}

function shot(T: number): Shot {
  // ---------------- B01 "day one: one dollar ... day seven: millionaire"
  if (T < 1.3) return streetShot(T);
  if (T < 3.14) {
    const L = JUMPS.filter((j) => T >= j).length;
    const last = L ? JUMPS[L - 1] : 0;
    const k = popK(T - last, 0.25);
    const heap = L === 0
      ? <Coin p={[0, 0.2, 0]} r={0.2} rot={[Math.PI / 2, 0, T * 2]} />
      : L === 1
        ? <>{Array.from({ length: 10 }, (_, i) => <Coin key={i} p={[0, 0.02 + i * 0.045, 0]} r={0.16} />)}</>
        : <GoldHeap n={L} c={0.18 + 0.1 * L} />;
    return {
      env: DAY, S: 8, cam: lerp3([2.9, 1.25, 12.2], [3.4, 1.7, 13.4], ease((T - 1.3) / 1.84)), look: [1.4, 0.55, 9], fov: 40, shift: 110,
      node: <><Street /><group position={[1.4, 0, 9]} scale={[1, Math.max(0.01, k), 1]}>{heap}</group><group position={[1.4, 0, 9]}><Burst t={T - last} c={GOLD} n={12} s0={0.08} sp={0.6} /></group></>,
    };
  }
  if (T < 4.67) {
    const u = T - 3.52, kd = clamp01(u / 0.3);
    const yOff = 40 * (1 - kd * kd);
    return {
      env: DAY, S: 18, cam: lerp3([10, 1.3, 24], [9.4, 1.3, 22.6], ease((T - 3.14) / 1.53)), look: [3, 3.2, 4], fov: 48, shift: 100,
      node: (
        <>
          <Street />
          <group position={[1.4, 0, 9]}><GoldHeap n={4} c={0.58} /></group>
          {u > 0 && <group position={[6.5, yOff, 3]}><GoldHeap n={6} c={1.1} /></group>}
          <group position={[6.5, 0, 3]}><Burst t={T - 3.82} c={GOLD} n={30} s0={0.5} sp={2.2} /></group>
        </>
      ),
    };
  }
  // ---------------- B02 "day ten: a billion. day fifteen: more than every dollar in America"
  if (T < 6.38) {
    const k = ease((T - 4.67) / 1.71);
    const H = 150 * ease((T - 4.75) / 1.5);
    return {
      env: DAY, S: 90, cam: lerp3([40, 8, 100], [55, 8, 150], k), look: [7, Math.max(20, H * 0.55), 7], fov: lerp(40, 27, k), shift: 60,
      node: <><CitySet red={0} /><Gold p={[7, H / 2, 7]} s={[9, Math.max(0.1, H), 9]} glow={0.45} /></>,
    };
  }
  if (T < 9.21) {
    const k = ease((T - 6.38) / 2.83);
    const h = 38 * ease((T - 6.5) / 2.3);
    return {
      env: DAY, S: 120, cam: lerp3([130, 120, 150], [105, 100, 125], k), look: [0, 12, 0], fov: 44, shift: 0,
      node: (
        <>
          <CitySet red={0} />
          <Gold p={[7, 75, 7]} s={[9, 150, 9]} glow={0.45} />
          {h > 0.2 && <Gold p={[0, h / 2, 0]} s={[400, h, 400]} glow={0.35} />}
        </>
      ),
    };
  }
  // ---------------- B03 "money is just a ticket for stuff"
  if (T < 11.36) {
    const t = T - 9.21;
    const u = T - 10.0, kf = clamp01(u / 0.26);
    return {
      env: DAY, S: 6, cam: lerp3([0.9, 2.5, 6.2], [0.6, 2.2, 5.4], ease(t / 2.15)), look: [0, 1.1, 0], fov: 42, shift: 100,
      node: (
        <>
          <Stall glow={0} />
          {[[-6, -6], [6, -8], [-9, 3], [9, 2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><BlockTree h={4} /></group>)}
          {u > 0 && (
            <group scale={1.5} position={[0.15, lerp(3, 1.09, kf * kf), 0.3]} rotation={[0, (1 - kf) * 4, (1 - kf) * 1.2]}>
              <Box p={[0, 0, 0]} s={[0.7, 0.02, 0.32]} c="#F3EAD9" />
              <Box p={[-0.2, 0.012, 0]} s={[0.04, 0.01, 0.32]} c={OCHRE} />
              <Box p={[0.1, 0.012, 0]} s={[0.36, 0.01, 0.08]} c="#3A3530" />
            </group>
          )}
        </>
      ),
    };
  }
  if (T < 13.84) {
    const t = T - 11.36, a = 0.5 + 0.35 * t;
    const n = 2 + Math.floor(clamp01(t / 2.2) * 5);
    return {
      env: DAY, S: 10, cam: [Math.sin(a) * 6.5, 2.4, Math.cos(a) * 6.5], look: [0, 1.2, 0], fov: 46, shift: 80,
      node: (
        <>
          <Stall glow={0.5 + 0.5 * Math.sin(T * 6)} />
          {[[-2.6, -0.4], [2.6, -0.2], [-1.5, -2.2], [1.6, -2.4]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}><GoldHeap n={Math.max(1, n - (i % 2))} c={0.32} /></group>
          ))}
        </>
      ),
    };
  }
  // ---------------- B04 Flint's cave: more shells, same meat
  if (T < 16.72) {
    const n = T < 14.94 ? 1 : T < 15.3 ? 10 : 100;
    return {
      env: DUSK, S: 10, cam: lerp3([1.4, 1.25, 6.4], [1.1, 1.1, 5.8], ease((T - 13.84) / 2.88)), look: [-0.5, 0.5, 3.2], fov: 40, shift: 100, parts: "embers", partsAt: [1.2, 0, 2.2],
      node: (
        <>
          <group position={[0, 0, -3]}><Cave /></group>
          <group position={[1.2, 0, 2.2]}><Campfire T={T} flare={0} /></group>
          <Box p={[-0.6, 0.15, 3.2]} s={[1.6, 0.3, 1.0]} c="#7D6E5E" />
          <group position={[-0.95, 0.3, 3.2]} scale={1.5}><Meat /></group>
          <group position={[-0.1, 0.3, 3.25]} scale={popK(T - (n === 1 ? 13.9 : n === 10 ? 14.94 : 15.3), 0.25)}><Shells n={n} /></group>
        </>
      ),
    };
  }
  if (T < 18.39) {
    const n = T < 17.54 ? 100 : 260;
    return {
      env: DUSK, S: 5, cam: lerp3([1.0, 0.85, 5.4], [0.8, 0.75, 4.9], ease((T - 16.72) / 1.67)), look: [-0.5, 0.45, 3.2], fov: 38, shift: 90, parts: "embers", partsAt: [1.2, 0, 2.2],
      node: (
        <>
          <group position={[0, 0, -3]}><Cave /></group>
          <group position={[1.2, 0, 2.2]}><Campfire T={T} flare={0} /></group>
          <Box p={[-0.6, 0.15, 3.2]} s={[1.6, 0.3, 1.0]} c="#7D6E5E" />
          <group position={[-0.95, 0.3, 3.2]} scale={1.5}><Meat /></group>
          <group position={[-0.1, 0.3, 3.25]} scale={n === 100 ? 1 : popK(T - 17.54, 0.25)}><Shells n={n} seed={n} /></group>
        </>
      ),
    };
  }
  // ---------------- B05 "whole countries lived it" -> Germany 1923
  if (T < 19.84) {
    const k = ease((T - 18.39) / 1.45);
    const x = lerp(-11, 9, k);
    return {
      env: SEPIA, S: 16, cam: [x, 2.6, 11], look: [x + 1.5, 3.0, 0], fov: 46, shift: 60,
      node: <>{(["de", "hu", "zw"] as const).map((f, i) => <group key={f} position={[(i - 1) * 8, 0, 0]}><FlagPost k={f} T={T} /></group>)}</>,
    };
  }
  if (T < 21.3) {
    const t = T - 19.84, x = -2 + 0.9 * t;
    return {
      env: SEPIA, S: 8, cam: [x + 2.2, 0.55, 4.0], look: [x + 0.2, 0.85, 0], fov: 44, shift: 100,
      node: (
        <>
          <Box p={[0, 0.02, 0]} s={[60, 0.04, 6]} c="#8A8076" />
          {[-8, -2, 4, 10].map((bx, i) => <Box key={bx} p={[bx, 4, -5]} s={[5.6, 8, 4]} c={["#B9A88A", "#A89070", "#C2B494", "#9E8A6E"][i]} />)}
          <group position={[x, 0, 0]}>
            <Wheelbarrow T={T} />
            <group position={[-1.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}><BlockPerson t={T} walk={1} act="slump" shirt="#5A5048" hat="#2A2626" /></group>
          </group>
        </>
      ),
    };
  }
  if (T < 24.16) {
    const t = T - 21.3;
    const flare = T > 22.4 ? Math.exp(-(T - 22.4) * 2.5) : 0;
    return {
      env: KITCHEN, S: 5, cam: lerp3([1.8, 1.35, 3.0], [1.3, 1.1, 2.3], ease(t / 2.86)), look: [-0.1, 0.65, -0.6], fov: 44, shift: 90, parts: "embers", partsAt: [-0.15, 0.4, -0.4],
      node: (
        <>
          <Box p={[0, 0, 0]} s={[6, 0.1, 6]} c="#6B5440" />
          <Box p={[0, 1.6, -1.5]} s={[6, 3.2, 0.1]} c="#B8A27E" />
          <Box p={[-2.5, 1.6, 0]} s={[0.1, 3.2, 6]} c="#A8926E" />
          <group position={[0, 0, -0.8]}><Stove T={T} flare={flare} /></group>
          {[0, 1, 2].map((i) => <Cyl key={i} p={[1.4, 0.15 + i * 0.22, -0.9]} r={0.11} h={0.9} c="#8A6440" rot={[0, 0, Math.PI / 2]} />)}
          <Cyl p={[1.4, 0.26, -0.68]} r={0.11} h={0.9} c="#7A5636" rot={[0, 0, Math.PI / 2]} />
          <group position={[-1.1, 0, 0.1]} rotation={[0, 0.9, 0]}><BlockPerson t={T} act="none" shirt="#7A5A6A" hair="#4A3020" /></group>
          {Array.from({ length: 6 }, (_, i) => {
            const k = ((T - 21.4 - i * 0.45) % 2.7) / 0.45;
            if (T < 21.4 + i * 0.45 || k > 1) return null;
            const p = lerp3([-0.75, 1.1, 0.25], [-0.15, 0.45, -0.4], k);
            p[1] += 0.3 * Math.sin(Math.PI * k);
            return <Bill key={i} p={p} r={[k * 2, k * 3, 0.4]} />;
          })}
        </>
      ),
    };
  }
  // ---------------- B06 Hungary 1946: prices doubled every 15 hours
  if (T < 25.84) {
    const t = T - 24.16;
    const day = 0.5 + 0.5 * Math.cos(t * TAU * 1.3);
    return { env: mixEnv(DAY, NIGHT, 1 - day), S: 10, cam: lerp3([3.4, 1.7, 11], [3.0, 1.6, 10], ease(t / 1.68)), look: [0, 2.6, 0], fov: 46, shift: 100, node: <><Box p={[0, 0.02, 4]} s={[40, 0.04, 4]} c="#8A8076" /><ShopFront /><group position={[-10, 0, 0]}><ShopFront /></group><group position={[10, 0, 0]}><ShopFront /></group></> };
  }
  if (T < 28.1) {
    const t = T - 25.84;
    const n = Math.floor(Math.max(0, T - 25.9) / 0.3);
    const H = 0.12 * Math.pow(2, Math.min(n, 9)) * (0.7 + 0.3 * popK(T - (25.9 + n * 0.3), 0.15));
    return {
      env: STUDIO, S: 10, cam: lerp3([2.0, 1.5, 6.5], [3.0, 3.5, 13], ease(t / 2.26)), look: [0, Math.min(1.4 + H * 0.45, 9), 0], fov: 44, shift: 100,
      node: (
        <>
          <Box p={[0, 1.6, -1.2]} s={[6, 3.2, 0.1]} c="#E9DCC2" />
          <Box p={[0, 0.9, -0.8]} s={[3.6, 0.08, 0.7]} c="#8A603A" />
          {[-1.2, 0, 1.2].map((x, i) => (
            <group key={x} position={[x, 0.94, -0.8]}>
              <Box p={[0, 0.22, 0]} s={[0.4, 0.44, 0.4]} c={["#C9A15A", "#B4462C", "#7FA06A"][i]} />
              <Glow p={[0, 0.5 + H / 2, 0.3]} s={[0.36, H, 0.12]} c={OCHRE} i={0.6} />
            </group>
          ))}
          <group position={[0, 2.6, -1.12]}>
            <Cyl p={[0, 0, 0]} r={0.55} h={0.08} c="#F3EAD9" rot={[Math.PI / 2, 0, 0]} seg={16} />
            <group rotation={[0, 0, -t * TAU * 1.5]}><Box p={[0, 0.2, 0.06]} s={[0.05, 0.4, 0.02]} c="#1E1E20" /></group>
            <group rotation={[0, 0, -t * TAU * 0.25]}><Box p={[0, 0.13, 0.07]} s={[0.07, 0.26, 0.02]} c="#C4482E" /></group>
          </group>
        </>
      ),
    };
  }
  // ---------------- B07 Zimbabwe: a hundred-trillion-dollar note, then it gave up its own money
  if (T < 30.66) {
    const t = T - 28.1;
    const u = T - 29.4, kd = clamp01(u / 0.3);
    const y = u < 0 ? 1.5 + 0.08 * Math.sin(t * 4) : u < 0.3 ? lerp(1.5, 0.86, kd * kd) : 0.86 + 0.08 * Math.exp(-(u - 0.3) * 8) * Math.abs(Math.sin((u - 0.3) * 18));
    return {
      env: STUDIO, S: 5, cam: lerp3([1.6, 2.9, 5.6], [1.2, 2.5, 4.6], ease(t / 2.56)), look: [0, 0.95, 0], fov: 44, shift: 100,
      node: (
        <>
          <Table />
          <group position={[0, y, 0]} rotation={[u < 0.3 ? 0.9 * (1 - kd) : 0, 0.15 + (u < 0 ? 0.3 * Math.sin(t * 2) : 0), u < 0.3 ? 0.2 * (1 - kd) : 0]}><BigNote /></group>
          <group position={[0, 0.85, 0]}><Burst t={T - 29.7} c="#F3EAD9" n={16} s0={0.06} sp={0.6} /></group>
        </>
      ),
    };
  }
  if (T < SEAM - 4.88) {
    const t = T - 30.66, u = Math.max(0, T - 31.1);
    const p: V3 = [2.2 * u + 0.4 * Math.sin(u * 3), 1.0 + 0.8 * Math.abs(Math.sin(u * 2.2)) + 0.3 * u, -0.4 * u];
    return {
      env: SAVANNA, S: 16, cam: lerp3([-2.5, 1.6, 7.5], [-1.0, 2.4, 9.5], ease(t / 2.92)), look: [p[0] * 0.7, 1.6, 0], fov: 44, shift: 90,
      node: (
        <>
          {[[-8, -10, 5], [6, -14, 4.5], [16, -8, 4], [-18, -18, 5], [26, -20, 5]].map(([x, z, h], i) => <group key={i} position={[x, 0, z]}><Acacia h={h} /></group>)}
          {Array.from({ length: 50 }, (_, i) => <Box key={i} p={[(hash(i) - 0.5) * 40, 0.15, (hash(i + 3) - 0.5) * 20 - 4]} s={[0.1, 0.3, 0.1]} c={i % 2 ? "#B89A52" : "#D2BE7A"} />)}
          <group position={p} rotation={[u * 2.2, u * 1.4, u * 3.1]} scale={0.6}><BigNote /></group>
        </>
      ),
    };
  }
  // ---------------- B08 a million now, or a penny that doubles for a month?
  if (T < 35.42) {
    const t = T - 33.58;
    return {
      env: STUDIO, S: 8, cam: lerp3([0.3, 1.7, 7.2], [0.3, 1.5, 6.4], ease(t / 1.84)), look: [0, 1.0, 0], fov: 44, shift: 60,
      node: (
        <>
          <group position={[-1.6, 0, 0]} scale={[1, Math.max(0.01, T < 34.2 ? 0.6 : 0.6 + 0.4 * popK(T - 34.2, 0.3)), 1]}><GoldHeap n={5} c={0.36} /></group>
          <Box p={[1.6, 0.5, 0]} s={[0.8, 1.0, 0.8]} c="#F3EAD9" />
          <Cyl p={[1.6, 1.02, 0]} r={0.12} h={0.03} c="#B8673A" seg={14} />
        </>
      ),
    };
  }
  if (T < SEAM) {
    const t = T - 35.42;
    const H = 0.03 * Math.exp(2.2 * t);
    return {
      env: STUDIO, S: Math.max(8, H), cam: lerp3([1.6, 1.5, 6.5], [4, 9, 24], ease(t / 3.04)), look: [0.4, Math.min(H * 0.5 + 0.6, 9), 0], fov: 44, shift: 60,
      node: (
        <>
          <group position={[-1.6, 0, 0]}><GoldHeap n={5} c={0.36} /></group>
          <Box p={[1.6, 0.5, 0]} s={[0.8, 1.0, 0.8]} c="#F3EAD9" />
          <Cyl p={[1.6, 1.0 + H / 2, 0]} r={0.12 + Math.min(0.6, H * 0.04)} h={H} c="#B8673A" seg={14} />
          {Array.from({ length: 12 }, (_, i) => {
            const y = 1.0 + H * (i + 1) / 13;
            return <Cyl key={i} p={[1.6, y, 0]} r={0.125 + Math.min(0.6, H * 0.04)} h={Math.min(0.02, H / 30) + 0.005} c="#D9895A" seg={14} />;
          })}
        </>
      ),
    };
  }
  return streetShot(T - SEAM);
}

export const Money10x3D: React.FC = () => <Plate cuts={CUTS10} render={(T) => <Stage s={shot(T)} T={T} h={hitEnv(T)} />} />;
