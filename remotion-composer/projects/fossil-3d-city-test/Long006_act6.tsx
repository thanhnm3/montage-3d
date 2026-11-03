// Tập dài 006, ACT 6 (#1 T. rex, beat 35-39). Mốc giây trong beat lấy từ long/006/raw/words_all.json.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BlockCar, CityStreet } from "./CityProps";
import { BlockHuman, BlockProboscid, BlockTheropod, Box } from "./BlockAnimals";
import { CLAMP, REX, RH, Shot, clamp01, ease, extent, lerp3, mono, pulse, sans } from "./Long006_common";
import { MeasureBar } from "./ActProps";
import { BlockCroc, Museum } from "./Act4Props";
import { Balance } from "./Act5Props";
import { Banana, BigBone, BlockBird, Coprolite, RexMount, RexSkullModel, RexTooth, SensorPad, WeighPad } from "./Act6Props";
import { RankSlam, Tag } from "./Long006_act12";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS6: Record<number, Cut[]> = {
  35: [[0, "flash"], [4.09, "cut"], [9.0, "whip"], [12.0, "cut"], [17.6, "whip"]],
  36: [[0, "cut"], [2.2, "whip"], [7.8, "cut"]],
  37: [[0, "cut"], [3.2, "whip"], [5.26, "cut"], [7.78, "whip"]],
  38: [[0, "cut"], [2.43, "flash"], [3.77, "cut"]],
  39: [[1.85, "whip"], [12.9, "whip"]],
};
export const HITS6: Record<number, [number, number][]> = {
  35: [[0.1, 0.3], [2.6, 0.15]],
  37: [[1.6, 0.15], [4.02, 0.1], [4.24, 0.1], [4.52, 0.12]],
  38: [[2.95, 0.2], [6.6, 0.25]],
  39: [[16.4, 0.25]],
};
export const LIGHTNING6: Record<number, number[]> = { 35: [0.15, 2.4], 39: [13.0] };

const RX = extent(REX);
const rex = (T: number, o: { walk?: number; roar?: number; look?: number; bite?: number; stalk?: number; eyeI?: number; skin?: string } = {}) => (
  <BlockTheropod t={T} spec={REX} walk={o.walk ?? 0} roar={o.roar ?? 0} look={o.look ?? 0} bite={o.bite ?? 0} stalk={o.stalk} eyeI={o.eyeI ?? 1} skin={o.skin} />
);
// cú đớp ngắn: nhịp hàm quanh mốc a (0 → 1 → 0 trong ~0.32 s)
const chomp = (t: number, times: number[]) => Math.max(0, ...times.map((a) => pulse(t, a - 0.12, a + 0.2)));
// cân lắc rồi lắng về 0 kể từ u = 0
const settle = (u: number) => (u < 0 ? 0 : 1 - Math.exp(-3 * u) * Math.cos(8 * u));
const BITES = [4.07, 4.53, 4.83, 5.21, 5.43, 5.79, 6.25];

// sọ mẫu trên giá đỡ: gốc toạ độ ở bản lề hàm, giá cắm xuống đất
const SkullOnStand: React.FC<{ bite: number; y: number }> = ({ bite, y }) => (
  <group position={[0, y, 0]}>
    <RexSkullModel bite={bite} />
    <Box p={[-0.3, -y / 2, 0]} s={[0.1, y, 0.1]} c="#2A2A2E" />
    <Box p={[-0.3, -y + 0.04, 0]} s={[0.8, 0.08, 0.8]} c="#2A2A2E" />
  </group>
);

export function shotAct6(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 35: {
      if (t < 4.09) {
        const x = 8 - 1.2 * t;
        return { env: "bad", fov: 38, fog: [8, 50], dim: 0.7, lightsAt: x, cam: [-11, 1.3, 4.8], look: [x + RH[0] + 2, 3.2, 0], actors: <group position={[x, 0, 0]}>{rex(T, { walk: t < 2.2 ? 1 : 0, roar: pulse(t, 2.2, 3.9) * 0.95 })}</group> };
      }
      if (t < 9.0) {
        // Sue dựng trong bảo tàng, khách đứng dưới chân
        const u = ease((t - 4.09) / 4.9);
        return {
          env: "set", fov: 46, cam: lerp3([4.5, 2.2, 8], [2.6, 2.6, 6.4], u), look: [-0.6, 2.1, 0],
          actors: (
            <>
              <Museum t={t} alarm={0} boom={999} flash={0} />
              <group position={[-0.4, 0.5, 0]} scale={0.55}><RexMount /></group>
              <group position={[-3.9, 0, 1.3]} rotation={[0, -2.3, 0]} scale={0.6}><BlockHuman t={T} coat="#4A6A8A" /></group>
              <group position={[-3.3, 0, 1.8]} rotation={[0, -2.0, 0]} scale={0.6}><BlockHuman t={T} coat="#C4693A" /></group>
            </>
          ),
        };
      }
      if (t < 12.0) {
        const k = ease((t - 9.3) / 0.9);
        return {
          env: "bad", fov: 44, lightsAt: 0, cam: [1.0, 7.5, 19], look: [0.5, 1.6, 0],
          actors: (
            <>
              {rex(T, { look: 0.2 })}
              <group position={[RX[0], 0.06, 2.4]}><MeasureBar len={RX[1] - RX[0]} k={k} ticks={1} /></group>
              <group position={[RX[0] - 1.6, 0, 1.5]} rotation={[0, -1.6, 0]}><BlockHuman t={T} /></group>
            </>
          ),
        };
      }
      if (t < 17.6) {
        // cân: T. rex một bên, một voi châu Phi rưỡi bên kia
        const tilt = -0.35 + 0.23 * settle(t - 15.95) + 0.12 * settle(t - 17.25);
        const drop = (a: number) => Math.max(0, 0.9 - 9.8 * Math.max(0, t - a) ** 2 / 2);
        return {
          env: "plate", plateX: 600, fov: 40, cam: [600, 2.8, 8.8], look: [600, 2.0, 0],
          actors: (
            <group position={[600, 0, 0]}>
              <Balance
                tilt={tilt}
                left={<group scale={0.1} position={[0.1, 0, 0]}><BlockTheropod t={T} spec={REX} walk={0} /></group>}
                right={
                  <>
                    {t > 15.75 && <group scale={0.16} position={[-0.3, drop(15.75), 0]}><BlockProboscid t={T} walk={0} tusks={0.5} /></group>}
                    {t > 17.05 && <group scale={0.1} position={[0.65, drop(17.05), 0]}><BlockProboscid t={T} walk={0} tusks={0} /></group>}
                  </>
                }
              />
            </group>
          ),
        };
      }
      const x = 6 - 1.5 * (t - 17.6);
      return { env: "bad", fov: 40, fog: [8, 60], dim: 0.6, lightsAt: x, cam: [x - 4, 2.2, 13], look: [x - 1, 2.8, 0], actors: <group position={[x, 0, 0]}>{rex(T, { walk: 1 })}</group> };
    }
    case 36: {
      if (t < 2.2) {
        const u = t / 2.2;
        return { env: "bad", fov: 32, dim: 0.5, fog: [6, 40], lightsAt: 0, cam: [RH[0] - 3.8 + 0.9 * u, RH[1] - 0.3, 4.4 - 1.0 * u], look: [RH[0], RH[1], 0], actors: rex(T, { eyeI: 1.5, look: 0.15 }) };
      }
      if (t < 7.8) {
        // phòng thí nghiệm: sọ mẫu, cảm biến lực trượt vào giữa hai hàm
        const slide = ease((t - 4.4) / 0.8);
        return {
          env: "plate", plateX: 640, fov: 38, cam: [640 - 3.6, 1.9, 3.8], look: [640 - 0.9, 1.1, 0],
          actors: (
            <group position={[640, 0, 0]}>
              <SkullOnStand bite={0} y={0.95} />
              <group position={[-1.55, 1.15, 1.6 * (1 - slide)]}><SensorPad hot={0} /></group>
            </group>
          ),
        };
      }
      // họ hàng còn sống: cá sấu và chim hai bên sọ mẫu
      return {
        env: "plate", plateX: 680, fov: 42, cam: [680 - 0.5, 2.0, 7.5], look: [680, 0.9, 0],
        actors: (
          <group position={[680, 0, 0]}>
            <SkullOnStand bite={0.3} y={0.95} />
            <group position={[-2.6, 0.25, 0.6]} rotation={[0, -0.5, 0]} scale={0.45}><BlockCroc t={T} jaw={0.4 + 0.4 * pulse(t, 8.2, 9.2)} /></group>
            <group position={[2.7, 0, 0.6]} rotation={[0, Math.PI - 0.5, 0]} scale={1.2}><BlockBird t={T} /></group>
          </group>
        ),
      };
    }
    case 37: {
      if (t < 3.2) {
        const bite = ease((t - 0.3) / 1.3);
        return {
          env: "plate", plateX: 640, fov: 36, cam: [640 - 3.0, 1.5, 2.8], look: [640 - 1.3, 1.1, 0],
          actors: (
            <group position={[640, 0, 0]}>
              <SkullOnStand bite={0.82 * bite} y={0.95} />
              <group position={[-1.55, 1.15, 0]}><SensorPad hot={bite} /></group>
            </group>
          ),
        };
      }
      if (t < 5.26) {
        // ba xe nhỏ rơi chồng lên bệ cân
        const lands = [4.02, 4.24, 4.52];
        const cols = ["#C4693A", "#2E5E8E", "#6A8A4A"];
        return {
          env: "plate", plateX: 720, fov: 40, cam: [720 - 1.5, 3.4, 12], look: [720, 2.4, 0],
          actors: (
            <group position={[720, 0, 0]}>
              <WeighPad />
              {lands.map((a, i) => {
                const u = t - (a - 0.78);
                if (u < 0) return null;
                const y = 0.32 + i * 1.55 + Math.max(0, 3 - 4.9 * u * u);
                return <group key={i} position={[0.15 * (i - 1), y, 0]} rotation={[0, 0.08 * (i - 1), 0]}><BlockCar t={0} c={cols[i]} light={false} /></group>;
              })}
            </group>
          ),
        };
      }
      if (t < 7.78) {
        const a = -0.35 + 0.7 * (t - 5.26) / 2.52;
        return {
          env: "plate", plateX: 760, fov: 38, cam: [760 + Math.sin(a) * 5.6, 1.7, Math.cos(a) * 5.6], look: [760, 1.25, 0],
          actors: <group position={[760, 0, 0]}><group position={[-1.1, 0, 0]}><RexTooth /></group><group position={[1.2, 0, 0]}><Banana /></group></group>,
        };
      }
      // đầu răng ép xuống xương: áp lực dồn vào một điểm, xương nứt
      const press = ease((t - 8.2) / 2.0);
      const u = (t - 7.78) / 5.19;
      return {
        env: "plate", plateX: 800, fov: 36, cam: [800 - 2.6 + 0.6 * u, 1.7, 3.8 - 0.4 * u], look: [800, 1.2, 0],
        actors: (
          <group position={[800, 0, 0]}>
            <BigBone t={t} t0={99} crack={ease((t - 9.6) / 2.4)} />
            <group position={[0.35, 0.83 + 2.42 + 0.4 * (1 - press), 0]} rotation={[0, 0, Math.PI]}><RexTooth tip={press} /></group>
          </group>
        ),
      };
    }
    case 38: {
      if (t < 2.43) {
        // cá sấu ngoạm xương mà xương vẫn nguyên
        const jaw = 1 - 0.8 * (pulse(t, 0.5, 1.3) + pulse(t, 1.5, 2.3));
        return {
          env: "plate", plateX: 840, fov: 40, cam: [840 - 2.2, 1.0, 3.6], look: [840 - 1.2, 0.35, 0],
          actors: (
            <group position={[840, 0.25, 0]} scale={0.55}>
              <BlockCroc t={T} jaw={jaw} />
              <group position={[-3.5, -0.3, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.6}><BigBone t={t} t0={99} crack={0} /></group>
            </group>
          ),
        };
      }
      if (t < 3.77) {
        return { env: "bad", fov: 36, dim: 0.65, lightsAt: 0, cam: [RH[0] - 4.5, RH[1] - 1.2, 3.6], look: [RH[0] + 0.3, RH[1], 0], actors: rex(T, { roar: pulse(t, 2.45, 3.1) * 0.9, bite: pulse(t, 2.85, 3.5), eyeI: 1.3 }) };
      }
      return skullBite(t, T, t);
    }
    case 39: {
      if (t < 1.85) return skullBite(t + 7.6, T, t + 7.6, t / 1.85);
      if (t < 12.9) {
        // phân hoá thạch: trưng bày, thước đo, rồi soi xuyên thấu
        const u = (t - 1.85) / 11.05;
        return {
          env: "plate", plateX: 920, fov: 38, cam: [920 - 1.4 + 1.0 * u, 2.0 - 0.3 * u, 4.8 - 0.9 * u], look: [920, 0.55, 0],
          actors: (
            <group position={[920, 0, 0]}>
              <Coprolite xray={ease((t - 8.8) / 0.6)} />
              {t > 7.0 && <group position={[-2.2, 0.04, 0.75]}><MeasureBar len={4.4} k={ease((t - 7.1) / 0.6)} ticks={0.5} /></group>}
            </group>
          ),
        };
      }
      // phố đêm: T. rex bước tới, đớp nóc chiếc xe đang đỗ
      const carX = -2;
      const u = t - 12.9;
      const x = Math.max(carX - RH[0] - 1.6, 9 - 2.4 * u);
      const crush = ease((t - 16.35) / 0.15);
      return {
        env: "city", fov: 46, lightsAt: carX, cam: [carX - 3, 1.6, 7.5], look: [carX + 2, 2.6, -2.5],
        actors: (
          <>
            <CityStreet />
            {[-8, 4, 10].map((cx, i) => <group key={cx} position={[cx, 0, -4.4]}><BlockCar t={0} c={["#6A6A70", "#2E5E8E", "#8A3A2A"][i]} light={false} /></group>)}
            <group position={[carX, 0, -4.4]} scale={[1, 1 - 0.45 * crush, 1]}><BlockCar t={0} c="#C9A227" light={false} /></group>
            <group position={[x, 0, -1.4]}>{rex(T, { walk: x > carX - RH[0] - 1.59 ? 1 : 0, look: -0.45 * ease((t - 15.6) / 0.4), bite: pulse(t, 16.0, 16.9), stalk: 0.7 })}</group>
          </>
        ),
      };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// sọ mẫu cắn đi cắn lại một chỗ trên khúc xương tới khi vỡ (beat 38 từ 3.77, tràn sang đầu beat 39)
function skullBite(tb: number, T: number, t: number, down = 0): Shot {
  const n = BITES.filter((a) => a < tb).length;
  const bite = 0.62 * chomp(tb, BITES);
  return {
    env: "plate", plateX: 880, fov: 38, cam: [880 - 1.5, 1.45 - 0.6 * down, 3.3], look: [880 - 0.1, 1.0 - 0.6 * down, 0],
    actors: (
      <group position={[880, 0, 0]}>
        <group position={[1.5, 0, 0]}><SkullOnStand bite={tb < 6.6 ? bite : 0} y={1.15} /></group>
        <group position={[0, 0.7, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.35}>
          <BigBone t={t} t0={6.6} crack={n / BITES.length} floor={-0.7 / 0.35} />
        </group>
      </group>
    ),
  };
}

// ------------------------------------------------------------------ chữ trên màn hình
const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
const ForceGauge: React.FC<{ v: number }> = ({ v }) => {
  const MAX = 40000;
  const a = -120 + (240 * Math.min(v, MAX)) / MAX;
  return (
    <div style={{ position: "absolute", right: 140, bottom: 110, width: 320, textAlign: "center" }}>
      <svg width="320" height="210" viewBox="0 0 260 170">
        <path d="M30 150 A100 100 0 1 1 230 150" fill="none" stroke="rgba(255,243,222,0.35)" strokeWidth="10" />
        {[0, 10, 20, 30, 40].map((k) => {
          const r = ((-120 + (240 * k) / 40 - 90) * Math.PI) / 180;
          return <text key={k} x={130 + 78 * Math.cos(r)} y={108 + 78 * Math.sin(r)} fill="#FFF3DE" fontSize="15" fontFamily={mono} textAnchor="middle">{k ? `${k}k` : 0}</text>;
        })}
        <g transform={`rotate(${a} 130 106)`}><rect x="127" y="22" width="6" height="88" fill="#FF5A3A" /></g>
        <circle cx="130" cy="106" r="10" fill="#FF5A3A" />
      </svg>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 56, color: "#FFF3DE", marginTop: -36, textShadow: "0 3px 12px rgba(0,0,0,0.9)" }}>{fmt(v)} <span style={{ fontSize: 26 }}>N</span></div>
      <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: 4, color: "#FF5A3A" }}>BITE FORCE</div>
    </div>
  );
};
const PsiCounter: React.FC<{ v: number; done: boolean }> = ({ v, done }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center" }}>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 104, color: done ? "#FF5A3A" : "#FFF3DE", textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>{fmt(v)}{done ? "+" : ""}</div>
    <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 8, color: "#E8B464" }}>PSI · AT THE TOOTH TIP</div>
  </div>
);
const LightsOut: React.FC<{ f: number }> = ({ f }) => <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 4], [0, 1], CLAMP) }} />;

type Ov = [number, number, number, (f: number) => React.ReactNode];
export const OVERLAYS6: Ov[] = [
  [35, 0.1, 2.9, (f) => <RankSlam f={f} rank="#1" name="TYRANNOSAURUS REX" />],
  [35, 6.67, 8.95, (f) => <Tag f={f} text="“SUE” · FIELD MUSEUM" sub="CHICAGO · LARGEST T. REX SKELETON" pos="bl" />],
  [35, 9.49, 11.95, (f) => <Tag f={f} text="12+ m / 40+ ft" pos="bl" />],
  [35, 14.09, 17.55, (f) => <Tag f={f} text="~8–9 TONS" pos="bl" />],
  [35, 16.51, 17.55, (f) => <Tag f={f} text="≈ 1.5 AFRICAN ELEPHANTS" pos="tc" />],
  [35, 18.91, 22.3, (f) => <Tag f={f} text="~67 MILLION YEARS AGO" sub="SOUTH DAKOTA" pos="bl" />],
  [36, 2.41, 7.75, (f) => <Tag f={f} text="2017 · GIGNAC & ERICKSON" sub="HOW HARD COULD T. REX BITE?" pos="bl" />],
  [36, 7.85, 10.35, (f) => <Tag f={f} text="CROCODILES + BIRDS" sub="T. REX'S CLOSEST LIVING RELATIVES" pos="tc" />],
  [37, 0.2, 3.15, (f) => <ForceGauge v={interpolate(f / 30, [0.1, 2.14], [0, 34000], { ...CLAMP, easing: (x) => 1 - (1 - x) ** 3 })} />],
  [37, 4.02, 5.2, (f) => <Tag f={f} text="≈ 3 SMALL CARS" pos="tc" />],
  [37, 5.76, 7.75, (f) => <Tag f={f} text="TEETH AS THICK AS BANANAS" pos="bl" />],
  [37, 9.38, 12.95, (f) => <PsiCounter v={interpolate(f / 30, [0, 1.98], [0, 400000], CLAMP)} done={f / 30 > 1.98} />],
  [38, 0.75, 2.4, (f) => <Tag f={f} text="LIVING REPTILES: CAN'T" sub="CRUSH BONE LIKE THAT" pos="bl" />],
  [38, 4.07, 7.55, (f) => <Tag f={f} text="SAME SPOT · AGAIN AND AGAIN" pos="bl" />],
  [39, 3.43, 6.95, (f) => <Tag f={f} text="KAREN CHIN · 1998" sub="SASKATCHEWAN, CANADA" pos="bl" />],
  [39, 4.99, 8.6, (f) => <Tag f={f} text="COPROLITE" sub="FOSSIL DUNG" pos="tc" />],
  [39, 7.41, 8.6, (f) => <Tag f={f} text="44 cm / 17 in" pos="bl" />],
  [39, 9.23, 12.85, (f) => <Tag f={f} text="1/3 – 1/2 CRUSHED BONE" sub="FROM A PLANT-EATER" pos="bl" />],
  [39, 14.83, 17.65, (f) => <Tag f={f} text="NOT MUCH OF A HIDING PLACE" pos="tc" />],
  [39, 17.7, 18.18, (f) => <LightsOut f={f} />],
];
export const CHAPTER6: [number, number, string][] = [[35, 39, "#1 T. REX"]];
