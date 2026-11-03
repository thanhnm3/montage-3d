// Tập dài 006, ACT 4 (#3 Spinosaurus, beat 22-27). Mốc giây trong beat lấy từ long/006/raw/words_all.json.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BlockHuman, BlockTheropod, DINOS, Glow, V3 } from "./BlockAnimals";
import { CLAMP, Shot, clamp01, ease, extent, faceShot, headOf, lerp, lerp3, mono, pulse, sans } from "./Long006_common";
import { CrumbleSkeleton, FossilSlab } from "./FossilProps";
import { MeasureBar } from "./ActProps";
import { BlockCroc, BlockFish, BlockPterosaur, Bubbles, Delta, MoroccoMap, Museum, PaddleTail, Ripple, Splash, WATER_Y } from "./Act4Props";
import { RankSlam, Tag } from "./Long006_act12";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS4: Record<number, Cut[]> = {
  22: [[0, "flash"], [5.21, "cut"], [9.45, "whip"], [12.47, "cut"]],
  23: [[0, "cut"], [4.39, "cut"], [6.15, "whip"], [13.33, "cut"]],
  24: [[0, "cut"], [4.95, "whip"], [6.53, "cut"], [8.81, "whip"], [13.81, "cut"]],
  25: [[0, "cut"], [3.47, "whip"], [7.81, "cut"]],
  26: [[0, "cut"], [3.03, "whip"], [8.37, "whip"], [10.33, "cut"], [12.83, "whip"]],
  27: [[0, "cut"], [4.91, "cut"], [7.25, "cut"]],
};
export const HITS4: Record<number, [number, number][]> = {
  22: [[0.13, 0.3], [0.9, 0.15], [15.3, 0.12]],
  23: [[10.4, 0.08]],
  24: [[5.4, 0.12], [14.4, 0.15]],
  25: [[9.39, 0.35], [9.7, 0.2]],
  27: [[7.4, 0.35]],
};
export const LIGHTNING4: Record<number, number[]> = { 22: [0.1], 24: [10.5] };

const SPINO = DINOS.spinosaurus;
const SH = headOf(SPINO);
const SX = extent(SPINO);
const SZ = -10; // giữa sông
const SY = -1.2; // đứng trong nước
const spino = (T: number, o: { walk?: number; roar?: number; look?: number; bite?: number; stalk?: number; period?: number; eyeI?: number; phase?: number } = {}) => (
  <BlockTheropod t={T} spec={SPINO} walk={o.walk ?? 0} roar={o.roar ?? 0} look={o.look ?? 0} bite={o.bite ?? 0} stalk={o.stalk} period={o.period} eyeI={o.eyeI ?? 1} phase={o.phase ?? 0} />
);

// thằn lằn bay lượn vòng quanh tâm c
const Flock: React.FC<{ T: number; c: V3; R: number; n?: number }> = ({ T, c, R, n = 4 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = T * 0.45 + (i * 2 * Math.PI) / n;
      const y = c[1] + 1.5 * Math.sin(T * 0.8 + i);
      return (
        <group key={i} position={[c[0] + Math.cos(a) * R * (1 + 0.15 * i), y, c[2] + Math.sin(a) * R * (1 + 0.15 * i)]} rotation={[0, Math.PI / 2 - a, 0.35]}>
          <BlockPterosaur t={T} phase={i} />
        </group>
      );
    })}
  </>
);

// ba loài ăn thịt khổng lồ khác đi dọc bờ gần
const Prowlers: React.FC<{ T: number; u: number; x0: number; v: number; look?: number; eyeI?: number }> = ({ T, u, x0, v, look = 0, eyeI = 1 }) => (
  <>
    {([["giganotosaurus", 2.5, 1, 0], ["carnotaurus", 5.5, 1, 1.3], ["giganotosaurus", 8.5, 0.8, 2.1]] as [string, number, number, number][]).map(([sp, z, sc, ph], i) => (
      <group key={i} position={[x0 - v * u + i * 7, 0, z]} scale={sc}>
        <BlockTheropod t={T} spec={DINOS[sp]} walk={v > 0 ? 1 : 0} phase={ph} look={look} eyeI={eyeI} />
      </group>
    ))}
  </>
);

// token khủng long nhỏ rơi xuống thành hai đống (beat 23)
const PRED = ["giganotosaurus", "carnotaurus", "spinosaurus", "trex", "giganotosaurus", "carnotaurus", "spinosaurus", "giganotosaurus", "carnotaurus", "spinosaurus", "giganotosaurus", "carnotaurus", "spinosaurus", "giganotosaurus"];
const Tokens: React.FC<{ t: number; T: number }> = ({ t, T }) => (
  <>
    {PRED.map((sp, i) => {
      const k = ease((t - 13.45 - i * 0.1) / 0.3);
      if (k <= 0) return null;
      const col = i % 5, row = Math.floor(i / 5);
      return <group key={i} position={[-2.6 + col * 0.7, 2.5 * (1 - k), -0.6 + row * 0.7]} scale={0.1}><BlockTheropod t={T} spec={DINOS[sp]} walk={0} phase={i} /></group>;
    })}
    {[0, 1, 2].map((i) => {
      const k = ease((t - 14.85 - i * 0.18) / 0.3);
      if (k <= 0) return null;
      return <group key={i} position={[2.2 + i * 0.7, 2.5 * (1 - k), 0]} scale={0.1}><BlockTheropod t={T} spec={DINOS.iguanodon} walk={0} eyeI={0.2} phase={i} /></group>;
    })}
    <Glow p={[-1.2, 0.01, 0.1]} s={[3.6, 0.02, 2.4]} c="#7A1E14" i={0.6} />
    <Glow p={[2.9, 0.01, 0]} s={[2.4, 0.02, 1.2]} c="#2A5A2E" i={0.6} />
  </>
);

export function shotAct4(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 22: {
      if (t < 5.21) {
        // trồi lên khỏi sông, nước xối xuống
        const y = lerp(-4.2, SY, ease((t - 0.4) / 2.4));
        return {
          env: "river", fov: 40, lightsAt: 0, cam: [-9, 0.6, -3], look: [-1, 1.5 + 0.3 * y, SZ],
          actors: (
            <>
              <group position={[0, y, SZ]}>{spino(T, { roar: pulse(t, 3.0, 4.7) * 0.85 })}</group>
              <Splash t={t} t0={0.9} p={[-1, WATER_Y, SZ]} n={70} w={7} h={5} />
              <Splash t={t} t0={1.7} p={[2, WATER_Y, SZ]} n={40} w={5} h={3} seed={5} />
              <Ripple t={t} t0={0.8} p={[0, 0, SZ]} big={2.2} />
            </>
          ),
        };
      }
      if (t < 9.45) {
        // thước dọc thân 14 m, người đứng trên bờ
        const k = ease((t - 6.4) / 1.0);
        const u = (t - 5.21) / 4.24;
        return {
          env: "river", fov: 44, lightsAt: 0, cam: [1 - 2 * u, 4.5, 15], look: [1, 0.6, -6],
          actors: (
            <>
              <group position={[0, SY, SZ]}>{spino(T)}</group>
              <group position={[SX[0], WATER_Y + 0.15, SZ + 2.2]}><MeasureBar len={SX[1] - SX[0]} k={k} ticks={1} /></group>
              <group position={[SX[0] - 1.5, 0, -0.8]} rotation={[0, Math.PI, 0]}><BlockHuman t={T} /></group>
            </>
          ),
        };
      }
      if (t < 12.47) {
        // buồm lưng ngược sáng, thước 1,8 m dựng cạnh
        const k = ease((t - 11.6) / 0.6);
        const u = (t - 9.45) / 3.02;
        return {
          env: "river", fov: 38, lightsAt: 0, cam: [3 - 1.5 * u, 2.4, SZ + 9], look: [0.3, 2.4, SZ],
          actors: (
            <>
              <group position={[0, SY, SZ]}>{spino(T)}</group>
              <group position={[0.8, 1.6, SZ + 1.6]}><MeasureBar len={1.8} k={k} vertical c="#9FE0FF" ticks={0.5} /></group>
            </>
          ),
        };
      }
      // mõm dài cúi sát nước, đớp con cá nhảy lên
      const hx = SH[0], hy = SH[1] + SY - 0.6;
      const fk = clamp01((t - 14.4) / 0.9);
      const caught = t >= 15.3;
      const fish: V3 = caught ? [hx - 1.0, hy - 0.15, SZ] : [hx - 2.4 + 1.4 * fk, WATER_Y + 1.6 * Math.sin(Math.PI * Math.min(1, fk * 0.9)) + (hy - WATER_Y - 0.15) * fk * fk, SZ];
      return {
        env: "river", fov: 34, lightsAt: 0, cam: [hx - 4.5, hy + 0.9, SZ + 6], look: [hx + 0.4, hy + 0.5, SZ],
        actors: (
          <>
            <group position={[0, SY, SZ]}>{spino(T, { stalk: 1, bite: pulse(t, 15.0, 15.9) })}</group>
            {t > 14.35 && !caught && <group position={fish} rotation={[0, 0, caught ? 0.9 : -1.2 + 2 * fk]}><BlockFish /></group>}
            <Splash t={t} t0={14.35} p={[hx - 2.4, WATER_Y, SZ]} n={24} w={1.2} h={3} seed={7} />
            <Ripple t={t} t0={14.3} p={[hx - 2.4, 0, SZ]} />
          </>
        ),
      };
    }
    case 23: {
      if (t < 4.39) {
        const u = t / 4.39;
        return { env: "lit", fov: 50, lightsAt: 0, cam: [-34 + 10 * u, 38, 28], look: [-12 + 10 * u, 0, 0], actors: <Delta t={T} /> };
      }
      if (t < 6.15) {
        const s = faceShot("spinosaurus", (t - 4.39) / 1.76, T, -1);
        return { ...s, env: "river", dim: 0.5, actors: spino(T, { eyeI: 1.6, roar: pulse(t, 4.8, 6.1) * 0.6 }) };
      }
      if (t < 13.33) {
        const k = ease((t - 6.3) / 0.6);
        const u = (t - 6.15) / 7.18;
        return { env: "plate", plateX: 200, dim: 1.5, fov: 46, cam: [200 + 1 - 2 * u, 10 - 1.5 * u, 8 - 1.5 * u], look: [200, 0, 0], actors: <group position={[200, 0, 0]}><MoroccoMap k={k} pin={(t - 10.15) / 0.4} /></group> };
      }
      return { env: "plate", plateX: 240, fov: 40, cam: [240, 2.8, 5.6], look: [240, 0.3, 0], actors: <group position={[240, 0, 0]}><Tokens t={t} T={T} /></group> };
    }
    case 24: {
      const croc = (y: number, jaw = 0) => <group position={[-6, y, -6]} rotation={[0, -0.3, 0]}><BlockCroc t={T} jaw={jaw} swim={1} /></group>;
      if (t < 4.95) {
        return {
          env: "river", fov: 46, lightsAt: 14, cam: [4, 5.5, -17], look: [14, 2, 4],
          actors: <><group position={[4, SY, SZ]} rotation={[0, Math.PI, 0]}>{spino(T, { walk: 0.4 })}</group><Prowlers T={T} u={t} x0={20} v={1.6} /></>,
        };
      }
      if (t < 6.53) {
        const y = lerp(-1.8, -0.35, ease((t - 5.0) / 0.7));
        return {
          env: "river", fov: 38, lightsAt: -6, cam: [-12.5, 0.35, -3.8], look: [-7, 0.1, -6],
          actors: <>{croc(y, pulse(t, 5.5, 6.5))}<Splash t={t} t0={5.15} p={[-7, WATER_Y, -6]} n={36} w={4} h={2.5} seed={3} /><Ripple t={t} t0={5.0} p={[-6, 0, -6]} big={1.5} /></>,
        };
      }
      if (t < 8.81) {
        return { env: "river", fov: 52, lightsAt: 0, cam: [-7, 1.2, -1], look: [0, 8, -10], actors: <><Flock T={T} c={[0, 9, -10]} R={7} /><group position={[4, SY, SZ]} rotation={[0, Math.PI, 0]}>{spino(T)}</group></> };
      }
      const turn = ease((t - 14.0) / 0.5);
      const eye = 1 + 1.6 * ease((t - 14.2) / 0.3);
      const all = (
        <>
          <group position={[4, SY, SZ]} rotation={[0, Math.PI, 0]}>{spino(T, { look: -0.5 * turn, eyeI: eye })}</group>
          <Prowlers T={T} u={Math.min(t, 13.81)} x0={20} v={1.6} look={0.6 * turn} eyeI={eye} />
          {croc(-0.35)}
          <Flock T={T} c={[0, 10, -10]} R={9} />
        </>
      );
      if (t < 13.81) {
        const u = (t - 8.81) / 5;
        return { env: "river", fov: 50, lightsAt: 0, cam: [-20 + 4 * u, 6, 9], look: [-2, 2, -4], actors: all };
      }
      // người du hành thời gian bước vào, mọi con mắt quay lại
      return {
        env: "river", fov: 46, lightsAt: 0, cam: [-11, 1.9, 13.5], look: [2, 2.2, -2],
        actors: <>{all}<group position={[-6.5 + 1.2 * ease((t - 13.85) / 0.8), 0, 10.5]} rotation={[0, 0.4, 0]}><BlockHuman t={T} walk={1 - ease((t - 14.4) / 0.4)} coat="#3A7AB8" /></group></>,
      };
    }
    case 25: {
      if (t < 3.47) {
        return { env: "river", fov: 40, fog: [3, 22], dim: 0.35, lightsAt: 0, cam: [-12, 1.2, -1], look: [0, 1.5, SZ], actors: <group position={[0, SY, SZ]}>{spino(T, { eyeI: 0.6 })}</group> };
      }
      const alarm = clamp01((t - 8.0) / 0.4);
      const flash = pulse(t, 9.36, 9.75);
      const u = (t - 3.47) / 8.93;
      return {
        env: "set", fov: 44, cam: lerp3([-6.5, 3.2, 8], [-4, 2.6, 6.5], ease(u)), look: [0.6, 2.0, 0],
        actors: (
          <>
            <Museum t={t} alarm={alarm} boom={9.45} flash={flash} />
            <group position={[-0.8, 0.5, 0]}><CrumbleSkeleton t={t} t0={t < 7.81 ? 99 : 9.65} /></group>
          </>
        ),
      };
    }
    case 26: {
      if (t < 3.03) {
        const u = t / 3.03;
        return { env: "plate", plateX: 280, fov: 38, cam: [280 - 2.4 + 0.6 * u, 2.4, 3.2 - 0.4 * u], look: [280, 0.2, 0], actors: <group position={[280, 0, 0]}><FossilSlab glint={(t - 1.6) / 0.8} /></group> };
      }
      if (t < 8.37) {
        const a = -0.5 + 0.35 * (t - 3.03) / 5.34;
        return { env: "plate", plateX: 320, fov: 40, cam: [320 + 0.2 + Math.sin(a) * 7.5, 2.6, Math.cos(a) * 7.5], look: [320 + 0.2, 1.2, 0], actors: <group position={[320, 0, 0]}><PaddleTail t={t} t0={3.6} /></group> };
      }
      if (t < 10.33) {
        // dưới nước: bơi đuổi mồi
        const x = 6 - 4.5 * (t - 8.37);
        return {
          env: "under", fov: 44, lightsAt: x, cam: [x - 7, -2.2, SZ + 6], look: [x - 1, -2.4, SZ],
          actors: (
            <>
              <group position={[x, -4.4, SZ]}>{spino(T, { walk: 0.6, period: 1.0, stalk: 1 })}</group>
              <Bubbles t={T} p={[x - 2, -3.6, SZ]} />
              {[0, 1, 2, 3].map((i) => <group key={i} position={[x - 6 - i * 0.9 + Math.sin(T * 3 + i) * 0.3, -2.5 + 0.4 * Math.sin(i * 2.1), SZ + (i - 1.5) * 0.7]}><BlockFish s={0.8} /></group>)}
            </>
          ),
        };
      }
      if (t < 12.83) {
        // lội nước như con diệc khổng lồ
        const u = (t - 10.33) / 2.5;
        return { env: "river", fov: 40, lightsAt: 0, cam: [-11 + u, 1.6, 5], look: [-2, 1.6, -4], actors: <><group position={[0, -0.7, -4]}>{spino(T, { stalk: 1, bite: pulse(t, 11.0, 11.9) })}</group><Ripple t={t} t0={11.3} p={[SH[0] - 1, 0, -4]} /></> };
      }
      return { env: "river", fov: 42, dim: 0.6, lightsAt: 0, cam: [-14 + 2 * (t - 12.83) / 2.5, 2.2, 3], look: [0, 1.8, SZ], actors: <group position={[0, SY, SZ]}>{spino(T)}</group> };
    }
    case 27: {
      if (t < 4.91) {
        const u = t / 4.91;
        return { env: "bad", fov: 44, cam: [-30 + 6 * u, 1.8, 10], look: [-10 + 6 * u, 1.4, -10], actors: null };
      }
      if (t < 7.25) {
        const eyes = ease((t - 6.6) / 0.5);
        return {
          env: "river", fov: 40, dim: 0.7, lightsAt: 0, cam: [1.4, 1.7, 4.2], look: [-0.5, 0.4, -9],
          actors: (
            <>
              <group position={[0, 0, -1.5]} rotation={[0, -Math.PI / 2, 0]}><BlockHuman t={T} /></group>
              {eyes > 0 && [-0.35, 0.35].map((dx) => <Glow key={dx} p={[-3.4 + dx, WATER_Y + 0.04, -7.5]} s={[0.18, 0.04, 0.1]} c={SPINO.eye ?? "#E8FF4A"} i={2.4 * eyes} />)}
            </>
          ),
        };
      }
      // lao lên khỏi mặt nước thẳng vào ống kính
      const k = ease((t - 7.3) / 0.7);
      return {
        env: "river", fov: 44, dim: 0.7, lightsAt: 0, cam: [1.2, 1.4, 3.2], look: [-0.6, 1.6, -6],
        actors: (
          <>
            <group position={[-0.8, lerp(-5.5, -2.0, k), lerp(-12, -4.4, k)]} rotation={[0, Math.PI / 2, 0]}>{spino(T, { roar: k, stalk: 1, eyeI: 2 })}</group>
            <Splash t={t} t0={7.3} p={[-0.8, WATER_Y, -6]} n={80} w={6} h={6} seed={11} />
          </>
        ),
      };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// ------------------------------------------------------------------ chữ trên màn hình
const EpisodeCard: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 8], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
      <div style={{ background: "rgba(12,12,14,0.82)", border: "3px solid #E8B464", borderRadius: 14, padding: "26px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 8, color: "#E8B464" }}>FULL EPISODE ON THIS CHANNEL</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 76, color: "#FFF3DE", letterSpacing: 3, marginTop: 10 }}>COULD SPINOSAURUS SWIM?</div>
      </div>
    </div>
  );
};
const Black: React.FC = () => <AbsoluteFill style={{ background: "#000" }} />;

type Ov = [number, number, number, (f: number) => React.ReactNode];
export const OVERLAYS4: Ov[] = [
  [22, 0.13, 2.9, (f) => <RankSlam f={f} rank="#3" name="SPINOSAURUS" />],
  [22, 3.29, 5.1, (f) => <Tag f={f} text="LONGEST PREDATOR ON THIS LIST" pos="bl" />],
  [22, 6.69, 9.4, (f) => <Tag f={f} text="~14 m / 46 ft" sub="RECENT ESTIMATES" pos="bl" />],
  [22, 11.6, 12.4, (f) => <Tag f={f} text="SAIL ≈ A GROWN MAN" pos="br" />],
  [22, 14.13, 16.8, (f) => <Tag f={f} text="CONE-SHAPED TEETH" sub="FOR SLIPPERY PREY" pos="bl" />],
  [23, 2.53, 4.35, (f) => <Tag f={f} text="NORTH AFRICA" sub="~95 MILLION YEARS AGO" pos="bl" />],
  [23, 7.57, 13.3, (f) => <Tag f={f} text="2020 · IBRAHIM ET AL." sub="REVIEW OF THE KEM KEM BEDS" pos="bl" />],
  [23, 10.15, 13.3, (f) => <Tag f={f} text="KEM KEM · MOROCCO" pos="tc" />],
  [23, 13.49, 15.8, (f) => <Tag f={f} text="FAR MORE PREDATORS" sub="THAN PLANT-EATERS" pos="tc" />],
  [24, 2.23, 4.9, (f) => <Tag f={f} text="+3 OTHER GIANT MEAT-EATERS" pos="bl" />],
  [24, 5.39, 6.5, (f) => <Tag f={f} text="HUGE CROCODILE RELATIVES" pos="bl" />],
  [24, 6.81, 8.75, (f) => <Tag f={f} text="FLYING REPTILES" pos="bl" />],
  [24, 10.47, 13.7, (f) => <Tag f={f} text="“THE MOST DANGEROUS PLACE”" sub="IN THE HISTORY OF THE PLANET · IBRAHIM" pos="tc" />],
  [25, 1.97, 3.4, (f) => <Tag f={f} text="BARELY KNOWN" sub="FOR DECADES" pos="bl" />],
  [25, 5.53, 7.8, (f) => <Tag f={f} text="1915 · ERNST STROMER" sub="FIRST SKELETON" pos="bl" />],
  [25, 10.93, 12.35, (f) => <Tag f={f} text="DESTROYED · MUNICH 1944" pos="bl" />],
  [26, 1.87, 3.0, (f) => <Tag f={f} text="NEW FOSSILS" pos="bl" />],
  [26, 5.57, 8.3, (f) => <Tag f={f} text="TAIL · MOROCCO · 2020" sub="TALL AND FLAT, LIKE A PADDLE" pos="bl" />],
  [26, 8.6, 10.3, (f) => <Tag f={f} text="SWIM?" pos="tc" />],
  [26, 10.33, 12.8, (f) => <Tag f={f} text="OR WADE?" pos="tc" />],
  [26, 12.09, 12.8, (f) => <Tag f={f} text="STILL ARGUED" pos="bl" />],
  [26, 13.0, 15.3, (f) => <EpisodeCard f={f} />],
  [27, 8.79, 11.03, () => <Black />],
];
export const CHAPTER4: [number, number, string][] = [[22, 27, "#3 SPINOSAURUS"]];
