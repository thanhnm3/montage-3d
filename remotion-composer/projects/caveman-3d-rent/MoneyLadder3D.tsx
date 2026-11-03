// Caveman Short "What If Your Money Grew 10x Every Day?" r02 (2026-10-30), bản "thang leo": mỗi nấc là một món bạn
// thấy mình mua được (pizza, xe, nhà, chuyên cơ, tháp vàng, sân bóng, tên lửa vàng, Trái Đất bọc vàng), rồi cú lật
// Đức 1923 + hang Flint ở cuối. Lớp NỀN; Flint/chữ/HUD/giọng do PoseReel vẽ (projects/caveman-short-money10x/scenes/make_spec.py).
// Mốc giây tuyệt đối lấy từ artifacts/whisper_words.json (giọng r02, 47.6 s).
import React, { useMemo } from "react";
import { Box, V3 } from "../fossil-3d-city-test/BlockAnimals";
import {
  Bill, BlockTree, Burst, CitySet, Coin, CutKind, Cyl, DAY, DUSK, Env, GOLD, Glow, Gold, ModernHouse, Plate, SEPIA, Shot,
  Stage, Street, TAU, Campfire, Cave, clamp01, ease, hash, lerp, lerp3, mixEnv, popK, rng,
} from "./Rent3D";
import { GoldHeap, KITCHEN, Meat, Shells } from "./Money10x3D";

export const CUTS_L: [number, CutKind][] = [
  [4.22, "whip"], [7.1, "whip"], [9.82, "cut"], [13.2, "whip"], [16.62, "flash"], [18.1, "whip"], [20.98, "flash"],
  [24.62, "whip"], [26.98, "flash"], [30.28, "cut"], [32.72, "whip"], [36.98, "cut"], [41.34, "flash"], [44.99, "cut"],
];
export const HITS_L: [number, number][] = [
  [2.18, 0.06], [3.68, 0.06], [5.02, 0.12], [7.78, 0.22], [10.52, 0.14], [12.34, 0.25], [15.62, 0.2], [17.24, 0.28],
  [20.08, 0.2], [23.92, 0.3], [26.22, 0.15], [29.1, 0.3], [32.28, 0.05], [38.04, 0.33], [39.36, 0.15], [43.22, 0.08],
  [44.48, 0.06],
];
const SEAM = 44.99;

function hitEnv(T: number) {
  let e = 0;
  for (const [ht, s] of HITS_L) if (T >= ht) e += s * Math.exp(-(T - ht) * 9);
  return e;
}

const SPACE: Env = { top: "#04050B", hor: "#0B1022", fog: ["#04050B", 300, 3000], ground: null, hemi: ["#B8C8FF", "#0A0A12", 0.55], sunC: "#FFF0DA", sunI: 3.4, sunDir: [-0.7, 0.4, 0.8] };
const PURPLE = "#55257B";

// ------------------------------------------------------------------ đạo cụ
const PizzaStack: React.FC<{ n: number }> = ({ n }) => (
  <group>
    {Array.from({ length: n }, (_, i) => (
      <group key={i} position={[(hash(i) - 0.5) * 0.06, 0.05 + i * 0.105, (hash(i + 9) - 0.5) * 0.06]} rotation={[0, (hash(i + 4) - 0.5) * 0.3, 0]}>
        <Box p={[0, 0, 0]} s={[0.62, 0.1, 0.62]} c="#E9DCC2" />
        <Box p={[0, 0.052, 0]} s={[0.3, 0.005, 0.3]} c="#C4482E" />
      </group>
    ))}
  </group>
);

const Car: React.FC<{ c?: string }> = ({ c = "#4F7FA8" }) => (
  <group>
    <Box p={[0, 0.55, 0]} s={[3.6, 0.6, 1.6]} c={c} />
    <Box p={[-0.2, 1.1, 0]} s={[2.0, 0.55, 1.45]} c={c} />
    <Box p={[-0.2, 1.1, 0]} s={[1.85, 0.42, 1.5]} c="#BFD6E2" />
    <Box p={[1.82, 0.6, 0.5]} s={[0.04, 0.16, 0.3]} c="#FFF2C8" />
    <Box p={[1.82, 0.6, -0.5]} s={[0.04, 0.16, 0.3]} c="#FFF2C8" />
    <Box p={[0.6, 0.62, 0.81]} s={[0.5, 0.06, 0.02]} c="#2A2A2C" />
    {[[-1.2, 0.8], [1.2, 0.8], [-1.2, -0.8], [1.2, -0.8]].map(([x, z], i) => (
      <Cyl key={i} p={[x, 0.33, z]} r={0.33} h={0.26} c="#232326" rot={[Math.PI / 2, 0, 0]} seg={10} />
    ))}
  </group>
);

const SoldSign: React.FC = () => (
  <group>
    <Box p={[0, 0.9, 0]} s={[0.1, 1.8, 0.1]} c="#5A3E2A" />
    <Box p={[0.55, 1.55, 0]} s={[1.1, 0.06, 0.06]} c="#5A3E2A" />
    <Box p={[0.6, 1.15, 0]} s={[0.95, 0.6, 0.05]} c="#C4482E" />
    <Box p={[0.6, 1.15, 0.03]} s={[0.7, 0.14, 0.01]} c="#F3EAD9" />
  </group>
);

const Jet: React.FC = () => (
  <group>
    <Box p={[0, 0, 0]} s={[7, 0.95, 0.95]} c="#F1F1EE" />
    <Box p={[3.75, -0.05, 0]} s={[0.6, 0.7, 0.75]} c="#E4E4E0" />
    <Box p={[-3.8, 0.1, 0]} s={[0.7, 0.6, 0.6]} c="#E4E4E0" />
    <Box p={[0.3, -0.25, 0]} s={[1.6, 0.12, 6.4]} c="#D8D8D4" r={[0, 0.25, 0]} />
    <Box p={[-3.6, 1.0, 0]} s={[0.9, 1.5, 0.1]} c="#C9A227" />
    <Box p={[-3.8, 1.7, 0]} s={[0.4, 0.08, 2.2]} c="#D8D8D4" />
    <Box p={[-2.2, 0.35, 0.62]} s={[1.0, 0.45, 0.3]} c="#B8B8B4" />
    <Box p={[-2.2, 0.35, -0.62]} s={[1.0, 0.45, 0.3]} c="#B8B8B4" />
    {Array.from({ length: 7 }, (_, i) => <Box key={i} p={[2.4 - i * 0.6, 0.15, 0.48]} s={[0.22, 0.22, 0.01]} c="#2E3E50" />)}
    <Box p={[3.4, 0.25, 0.4]} s={[0.4, 0.22, 0.2]} c="#2E3E50" />
    <Box p={[0.1, 0.32, 0.48]} s={[7, 0.06, 0.01]} c={GOLD} />
    {[[2.6, 0], [-0.1, 0.9], [-0.1, -0.9]].map(([x, z], i) => <Box key={i} p={[x, -0.75, z]} s={[0.12, 0.6, 0.12]} c="#3A3A3E" />)}
  </group>
);

const Arena: React.FC<{ flag: number; T: number }> = ({ flag, T }) => (
  <group>
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * TAU;
      return (
        <group key={i} position={[Math.cos(a) * 9, 0, Math.sin(a) * 6]} rotation={[0, -a + Math.PI / 2, 0]}>
          <Box p={[0, 2.5, 0]} s={[3.8, 5, 1.2]} c={i % 2 ? PURPLE : "#62308C"} />
          <Box p={[0, 5.2, 0]} s={[3.9, 0.4, 1.3]} c="#E8B62C" />
          <Box p={[0, 1.4, 0.62]} s={[2.4, 1.6, 0.02]} c="#BFD6E2" />
        </group>
      );
    })}
    <Box p={[0, 5.6, 0]} s={[15, 0.4, 9]} c="#E8E2D6" />
    <Box p={[0, 0.03, 9]} s={[30, 0.06, 8]} c="#CFC7B8" />
    {flag > 0 && (
      <group position={[0, 5.8, 0]} scale={[1, Math.max(0.01, flag), 1]}>
        <Box p={[0, 3, 0]} s={[0.2, 6, 0.2]} c="#3A3A3E" />
        <group position={[0.1, 5.2, 0]} rotation={[0, 0.2 * Math.sin(T * 3), 0]}>
          <Box p={[1.6, 0, 0]} s={[3.2, 1.6, 0.06]} c="#C4482E" />
          <Box p={[1.6, 0, 0.04]} s={[2.4, 0.36, 0.01]} c="#F3EAD9" />
        </group>
      </group>
    )}
  </group>
);

const Cone: React.FC<{ p: V3; r: number; h: number; c: string }> = ({ p, r, h, c }) => (
  <mesh position={p} castShadow>
    <coneGeometry args={[r, h, 10]} />
    <meshStandardMaterial color={c} emissive="#7A4C00" emissiveIntensity={0.3} roughness={0.45} metalness={0.25} flatShading />
  </mesh>
);

const GoldRocket: React.FC = () => (
  <group>
    <Cyl p={[0, 4.5, 0]} r={0.9} h={7} c={GOLD} seg={10} glow={0.3} />
    <Cone p={[0, 9.0, 0]} r={0.9} h={2} c={GOLD} />
    {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[0.92, 2.2 + i * 1.1, 0]} s={[0.02, 0.06, 1.5]} c="#9A6A10" r={[0, 0, 0]} />)}
    {[0, 1, 2, 3].map((i) => (
      <group key={i} rotation={[0, (i * TAU) / 4, 0]}><Gold p={[1.05, 1.5, 0]} s={[0.7, 1.6, 0.12]} /></group>
    ))}
    <Cyl p={[0, 0.8, 0]} r={0.6} h={0.6} c="#3A3A3E" seg={10} />
  </group>
);

const Pad: React.FC = () => (
  <group>
    <Box p={[0, 0.25, 0]} s={[8, 0.5, 8]} c="#8E8A82" />
    <Box p={[-3, 6, -1.5]} s={[1.2, 12, 1.2]} c="#B4462C" />
    {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[-2.2, 1.5 + i * 2, -1.5]} s={[1.6, 0.12, 0.3]} c="#7A3A28" />)}
  </group>
);

// Trái Đất khối: thân cầu low-poly + các khối vàng phủ dần (điểm Fibonacci trên mặt cầu)
const N_GOLD = 420;
const GoldEarth: React.FC<{ cover: number; T: number }> = ({ cover, T }) => {
  const pts = useMemo(() => Array.from({ length: N_GOLD }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / N_GOLD, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    return { p: [Math.cos(a) * r, y, Math.sin(a) * r] as V3, k: hash(i * 7 + 1) };
  }), []);
  const R = 6;
  return (
    <group rotation={[0.35, T * 0.12, 0]}>
      <mesh>
        <icosahedronGeometry args={[R, 2]} />
        <meshStandardMaterial color="#2F6FA8" roughness={0.9} flatShading />
      </mesh>
      {useMemo(() => {
        const r = rng(5);
        return Array.from({ length: 26 }, (_, i) => {
          const y = r() * 1.6 - 0.8, a = r() * TAU, q = Math.sqrt(1 - y * y);
          return <Box key={i} p={[Math.cos(a) * q * R, y * R, Math.sin(a) * q * R]} s={[2.2, 2.2, 2.2]} c={i % 3 ? "#5E8F4A" : "#7FA06A"} />;
        });
      }, [])}
      {pts.map((d, i) => {
        const k = clamp01((cover - d.k) * 6);
        if (k <= 0) return null;
        const s = 1.25 * popK(k * 0.35, 0.35);
        return <Gold key={i} p={[d.p[0] * (R + 0.35), d.p[1] * (R + 0.35), d.p[2] * (R + 0.35)]} s={[s, s, s]} glow={0.35} />;
      })}
    </group>
  );
};

const Stars: React.FC = () => (
  <group>
    {useMemo(() => {
      const r = rng(77);
      return Array.from({ length: 160 }, (_, i) => {
        const a = r() * TAU, b = (r() - 0.5) * Math.PI, d = 120;
        return <Glow key={i} p={[Math.cos(a) * Math.cos(b) * d, Math.sin(b) * d, Math.sin(a) * Math.cos(b) * d - 40]} s={[0.35, 0.35, 0.35]} c="#FFFFFF" i={2} />;
      });
    }, [])}
  </group>
);

const Loaf: React.FC = () => (
  <group>
    <Box p={[0, 0.12, 0]} s={[0.56, 0.24, 0.3]} c="#C98E4A" />
    <Box p={[0, 0.25, 0]} s={[0.46, 0.06, 0.22]} c="#DDA864" />
    {[-0.15, 0, 0.15].map((x) => <Box key={x} p={[x, 0.285, 0]} s={[0.04, 0.01, 0.2]} c="#A8702E" r={[0, 0.4, 0]} />)}
  </group>
);

const NoteBricks: React.FC<{ n: number; seed: number; w: number }> = ({ n, seed, w }) => (
  <group>
    {Array.from({ length: n }, (_, i) => {
      const r = rng(seed + i);
      const L = Math.floor(Math.sqrt(i / 3));
      return <Box key={i} p={[(r() - 0.5) * w * (1 - L * 0.12), 0.08 + L * 0.15 + r() * 0.05, (r() - 0.5) * w * 0.6 * (1 - L * 0.12)]} s={[0.42, 0.14, 0.22]} c={i % 3 === 0 ? "#B59A6A" : i % 3 === 1 ? "#8DA06E" : "#9AA8B0"} r={[0, (r() - 0.5) * 1.2, 0]} />;
    })}
  </group>
);

// ------------------------------------------------------------------ các góc máy
function streetShot(t: number): Shot {
  return {
    env: DAY, S: 8, cam: lerp3([2.5, 1.15, 11.4], [2.25, 1.1, 10.7], clamp01(t / 4.2)), look: [1.4, 0.85, 9], fov: 40, shift: 110,
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

const drop = (T: number, t0: number, h: number, d = 0.28) => {
  const k = clamp01((T - (t0 - d)) / d);
  return T < t0 - d ? h : h * (1 - k * k);
};

function shot(T: number): Shot {
  // ---------------- B01 "your money grows ten times. every day. day one: one dollar"
  if (T < 4.22) return streetShot(T);
  // ---------------- B02 day 3 pizza / day 5 used car / day 7 house + cash
  if (T < 7.1) {
    const n = T < 5.02 ? 0 : 6;
    return {
      env: DAY, S: 8, cam: lerp3([2.8, 1.5, 12.2], [2.5, 1.35, 11.4], ease((T - 4.22) / 2.88)), look: [1.4, 0.9, 9], fov: 42, shift: 110,
      node: (
        <>
          <Street />
          <group position={[1.4, 0, 9]}>
            <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 1.0]} c="#B07A48" />
            <group position={[0, 0.6 + drop(T, 5.02, 3), 0]}><PizzaStack n={6} /></group>
            {n > 0 && <Burst t={T - 5.02} c="#E9DCC2" n={12} s0={0.06} sp={0.5} />}
          </group>
        </>
      ),
    };
  }
  if (T < 9.82) {
    const y = drop(T, 7.78, 9, 0.35);
    const sq = T > 7.78 ? 1 - 0.12 * Math.exp(-(T - 7.78) * 10) * Math.cos((T - 7.78) * 30) : 1;
    return {
      env: DAY, S: 10, cam: lerp3([6.5, 1.6, 19.5], [5.8, 1.45, 18.2], ease((T - 7.1) / 2.72)), look: [3.0, 0.9, 13], fov: 44, shift: 100,
      node: (
        <>
          <Street />
          <group position={[3.0, y, 13]} rotation={[0, 0.5, 0]} scale={[1, sq, 1]}><Car /></group>
          <group position={[3.0, 0, 13]}><Burst t={T - 7.78} c="#CFC7B8" n={18} s0={0.12} sp={1.2} /></group>
        </>
      ),
    };
  }
  if (T < 13.2) {
    const k = popK(T - 10.52, 0.3);
    return {
      env: DAY, S: 18, cam: lerp3([8.5, 2.6, 24], [7.2, 2.2, 21], ease((T - 9.82) / 3.38)), look: [1.5, 2.6, 2], fov: 44, shift: 90,
      node: (
        <>
          <Street />
          <group position={[3.0, 0, 13]} rotation={[0, 0.5, 0]}><Car /></group>
          <group position={[4.8, 0, 6.6]} scale={[1, Math.max(0.01, T < 10.52 ? 0.01 : k), 1]}><SoldSign /></group>
          {T > 11.9 && <group position={[2.0, 0.55 + drop(T, 12.34, 6), 5.1]}><GoldHeap n={3} c={0.42} /></group>}
          <group position={[2.0, 0.55, 5.1]}><Burst t={T - 12.34} c={GOLD} n={18} s0={0.12} sp={1} /></group>
        </>
      ),
    };
  }
  // ---------------- B03 day 9 jet / day 10 billionaire / day 11 Lakers
  if (T < 16.62) {
    const u = clamp01((T - 13.2) / 2.42);
    const p: V3 = [lerp(-30, 2, ease(u * 0.5 + u * u * 0.5)), lerp(9, 1.15, u < 1 ? 1 - Math.pow(1 - u, 2) : 1), 13];
    const roll = T > 15.62 ? Math.max(0, 1 - (T - 15.62) / 1.0) : 1;
    return {
      env: DAY, S: 30, cam: lerp3([7, 1.6, 23], [6, 1.4, 20.5], ease((T - 13.2) / 3.42)), look: [p[0] * 0.6 + 1.5, 2.0, 12], fov: 42, shift: 70,
      node: (
        <>
          <Street />
          <group position={[p[0] + (T > 15.62 ? (T - 15.62) * 3 * roll : 0), p[1], p[2]]} rotation={[0, 0, T < 15.62 ? 0.12 * (1 - u) : 0]}><Jet /></group>
          <group position={[2, 0, 13]}><Burst t={T - 15.62} c="#CFC7B8" n={20} s0={0.15} sp={1.4} /></group>
        </>
      ),
    };
  }
  if (T < 18.1) {
    const H = 120 * popK(T - 17.04, 0.35);
    return {
      env: DAY, S: 90, cam: lerp3([40, 6, 100], [48, 6, 125], ease((T - 16.62) / 1.48)), look: [7, Math.max(18, H * 0.5), 7], fov: lerp(40, 30, ease((T - 16.62) / 1.48)), shift: 60,
      node: <><CitySet red={0} />{T > 17.04 && <Gold p={[7, H / 2, 7]} s={[9, Math.max(0.1, H), 9]} glow={0.45} />}<group position={[7, 0, 7]}><Burst t={T - 17.24} c={GOLD} n={30} s0={0.8} sp={4} /></group></>,
    };
  }
  if (T < 20.98) {
    const flag = popK(T - 19.9, 0.35);
    return {
      env: DAY, S: 30, cam: lerp3([10, 5, 30], [8, 4.2, 25], ease((T - 18.1) / 2.88)), look: [0, 4.5, 0], fov: 44, shift: 70,
      node: (
        <>
          <Arena flag={T < 19.9 ? 0 : flag} T={T} />
          {[[-16, -10], [16, -10], [-20, 6], [20, 8]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><BlockTree h={5} /></group>)}
          <group position={[0, 11.5, 0]}><Burst t={T - 20.08} c="#E8B62C" n={24} s0={0.3} sp={2} /></group>
        </>
      ),
    };
  }
  // ---------------- B04 day 13 trillion: gold rocket lifts off on "musk"
  if (T < 24.62) {
    const lift = Math.max(0, T - 23.92);
    const y = 0.5 + 6 * lift * lift;
    return {
      env: mixEnv(DUSK, DAY, 0.35), S: 20, cam: lerp3([9, 3, 22], [8, 3.5, 20], ease((T - 20.98) / 3.64)), look: [0, 5 + y * 0.6, 0], fov: 46, shift: 90,
      parts: lift > 0 ? "embers" : undefined, partsAt: [0, 0.5, 0],
      node: (
        <>
          <Pad />
          <group position={[0, y, 0]}><GoldRocket />{lift > 0 && <Glow p={[0, 0, 0]} s={[1.2, 1.4 + lift * 3, 1.2]} c="#FF9A3A" i={4} o={0.85} />}</group>
          {lift > 0 && <pointLight position={[0, y - 1, 2]} color="#FFAA55" intensity={40} distance={30} />}
          <group position={[0, 0.6, 0]}><Burst t={T - 23.92} c="#E8E2D6" n={40} s0={0.4} sp={3} /></group>
        </>
      ),
    };
  }
  // ---------------- B05 day 15 every dollar in America / day 16 everything on Earth
  if (T < 26.98) {
    const k = ease((T - 24.62) / 2.36);
    const h = 38 * ease((T - 24.75) / 1.6);
    return {
      env: DAY, S: 120, cam: lerp3([130, 120, 150], [110, 102, 128], k), look: [0, 12, 0], fov: 44, shift: 0,
      node: <><CitySet red={0} />{h > 0.2 && <Gold p={[0, h / 2, 0]} s={[400, h, 400]} glow={0.35} />}</>,
    };
  }
  if (T < 30.28) {
    const k = ease((T - 26.98) / 3.3);
    return {
      env: SPACE, S: 30, cam: lerp3([0, 4, 52], [0, 3, 40], k), look: [0, 0, 0], fov: 40, shift: 50,
      node: <><Stars /><GoldEarth cover={1.3 * ease((T - 27.3) / 2.1)} T={T} /></>,
    };
  }
  // ---------------- B06 day 17: nothing left to buy (still, one coin "tink")
  if (T < 32.72) {
    const y = drop(T, 32.28, 6, 0.5);
    return {
      env: SPACE, S: 30, cam: [0, 3, 38], look: [0, 2.5, 0], fov: 40, shift: 50,
      node: (
        <>
          <Stars />
          <GoldEarth cover={1.4} T={30.28} />
          <Coin p={[0, 7.1 + y, 0]} r={0.35} rot={[Math.PI / 2, 0, T * 3]} />
          <group position={[0, 7.1, 0]}><Burst t={T - 32.28} c={GOLD} n={8} s0={0.08} sp={0.6} /></group>
        </>
      ),
    };
  }
  // ---------------- B07 Germany 1923: a loaf of bread = 200 billion marks
  const kitchen = (extra: React.ReactNode) => (
    <>
      <Box p={[0, 0, 0]} s={[8, 0.1, 8]} c="#6B5440" />
      <Box p={[0, 1.8, -2]} s={[8, 3.6, 0.1]} c="#B8A27E" />
      <Box p={[-3, 1.8, 0]} s={[0.1, 3.6, 8]} c="#A8926E" />
      <Box p={[1.2, 2.1, -1.94]} s={[1.2, 0.9, 0.02]} c="#E9DCC2" />
      <Box p={[0, 0.78, 0]} s={[2.6, 0.08, 1.5]} c="#8A603A" />
      {[[-1.2, -0.65], [1.2, -0.65], [-1.2, 0.65], [1.2, 0.65]].map(([x, z], i) => <Box key={i} p={[x, 0.37, z]} s={[0.1, 0.74, 0.1]} c="#6B4A2E" />)}
      <group position={[0.35, 0.82, 0.1]}><Loaf /></group>
      {extra}
    </>
  );
  if (T < 36.98) {
    const t = T - 32.72;
    return {
      env: KITCHEN, S: 6, cam: lerp3([2.4, 2.0, 4.4], [1.9, 1.7, 3.6], ease(t / 4.26)), look: [0, 0.9, 0], fov: 44, shift: 40,
      node: kitchen(
        <>
          {Array.from({ length: 7 }, (_, i) => {
            const u = ((T - 32.8 - i * 0.55) % 3.85) / 1.6;
            if (T < 32.8 + i * 0.55 || u > 1) return null;
            const p = lerp3([-1.2 + i * 0.35, 3.2, 0.6 - (i % 3) * 0.4], [-0.8 + i * 0.3, 0.84, -0.3 + (i % 2) * 0.5], u);
            return <Bill key={i} p={p} r={[u * 3 + i, u * 2, 0.3]} />;
          })}
        </>,
      ),
    };
  }
  if (T < 41.34) {
    const y1 = drop(T, 38.04, 5, 0.3), y2 = drop(T, 39.36, 5, 0.3);
    return {
      env: KITCHEN, S: 5, cam: lerp3([1.1, 1.25, 2.3], [1.5, 1.6, 3.3], ease((T - 36.98) / 4.36)), look: [-0.1, 1.0, 0], fov: 44, shift: 40,
      node: kitchen(
        <>
          {T > 37.7 && <group position={[-0.55, 0.82 + y1, 0]}><NoteBricks n={60} seed={11} w={1.6} /></group>}
          {T > 39.0 && <group position={[-0.7, 1.45 + y2, -0.2]}><NoteBricks n={30} seed={41} w={1.0} /></group>}
          <group position={[-0.55, 0.9, 0]}><Burst t={T - 38.04} c="#B59A6A" n={22} s0={0.08} sp={0.8} /></group>
        </>,
      ),
    };
  }
  // ---------------- B08 cave: more shells never made more meat
  if (T < SEAM) {
    const n = T < 43.22 ? 1 : T < 43.7 ? 10 : 100;
    return {
      env: DUSK, S: 10, cam: lerp3([1.4, 1.25, 6.4], [1.1, 1.1, 5.8], ease((T - 41.34) / 3.65)), look: [-0.5, 0.5, 3.2], fov: 40, shift: 100, parts: "embers", partsAt: [1.2, 0, 2.2],
      node: (
        <>
          <group position={[0, 0, -3]}><Cave /></group>
          <group position={[1.2, 0, 2.2]}><Campfire T={T} flare={0} /></group>
          <Box p={[-0.6, 0.15, 3.2]} s={[1.6, 0.3, 1.0]} c="#7D6E5E" />
          <group position={[-0.95, 0.3, 3.2]} scale={1.5}><Meat /></group>
          <group position={[-0.1, 0.3, 3.25]} scale={popK(T - (n === 1 ? 41.4 : n === 10 ? 43.22 : 43.7), 0.25)}><Shells n={n} seed={n} /></group>
        </>
      ),
    };
  }
  // ---------------- B09 "so, would you still take that one dollar?" -> loop to the beat 01 frame
  return streetShot(T - SEAM);
}

export const MoneyLadder3D: React.FC = () => <Plate cuts={CUTS_L} render={(T) => <Stage s={shot(T)} T={T} h={hitEnv(T)} />} />;
