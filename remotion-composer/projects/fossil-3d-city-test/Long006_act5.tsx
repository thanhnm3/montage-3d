// Tập dài 006, ACT 5 (#2 Giganotosaurus, beat 28-34). Mốc giây trong beat lấy từ long/006/raw/words_all.json.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BlockHuman, BlockTheropod, DINOS, V3 } from "./BlockAnimals";
import { CLAMP, REX, Shot, clamp01, ease, extent, headOf, lerp, lerp3, mono, pulse, sans } from "./Long006_common";
import { Dust } from "./FossilProps";
import { MeasureBar } from "./ActProps";
import { Balance, BladeTooth, BlockTitanosaur, CarPark, CityBus, Crown, DuneBuggy, GigaSkull, LegBone, PartialSkeleton, Slash, SpikeTooth } from "./Act5Props";
import { RankSlam, Tag } from "./Long006_act12";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS5: Record<number, Cut[]> = {
  28: [[0, "flash"], [3.0, "whip"], [6.74, "cut"]],
  29: [[0, "whip"], [3.87, "cut"], [8.01, "whip"], [10.61, "cut"]],
  30: [[0, "cut"], [2.33, "whip"], [6.09, "cut"]],
  31: [[0, "cut"], [3.62, "whip"], [6.86, "cut"]],
  32: [[0, "whip"], [5.13, "cut"], [8.43, "whip"]],
  33: [[0, "whip"], [2.86, "cut"]],
  34: [[0, "flash"], [2.16, "cut"], [6.46, "whip"], [11.4, "cut"], [12.64, "whip"]],
};
export const HITS5: Record<number, [number, number][]> = {
  28: [[0.1, 0.3], [8.7, 0.12]],
  29: [[7.6, 0.1], [8.59, 0.08]],
  30: [[6.6, 0.1]],
  31: [[4.9, 0.06]],
  32: [[1.9, 0.1], [2.4, 0.1], [6.0, 0.15], [7.0, 0.15], [8.8, 0.1]],
  33: [[4.4, 0.1]],
  34: [[0.18, 0.25], [13.66, 0.3]],
};
export const LIGHTNING5: Record<number, number[]> = { 28: [0.1], 34: [0.15] };

const GIGA = DINOS.giganotosaurus;
const GH = headOf(GIGA);
const GX = extent(GIGA);
const giga = (T: number, o: { walk?: number; roar?: number; look?: number; bite?: number; stalk?: number; eyeI?: number; phase?: number } = {}) => (
  <BlockTheropod t={T} spec={GIGA} walk={o.walk ?? 0} roar={o.roar ?? 0} look={o.look ?? 0} bite={o.bite ?? 0} stalk={o.stalk} eyeI={o.eyeI ?? 1} phase={o.phase ?? 0} />
);

export function shotAct5(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 28: {
      if (t < 3.0) {
        const x = 8 - 1.3 * t;
        return { env: "bad", fov: 38, fog: [8, 50], dim: 0.75, lightsAt: x, cam: [-11, 1.4, 4.5], look: [x - 2.5, 3.0, 0], actors: <group position={[x, 0, 0]}>{giga(T, { walk: 1, roar: pulse(t, 1.6, 2.9) * 0.7 })}</group> };
      }
      if (t < 6.74) {
        const x = 4.1 - 1.3 * (t - 3.0) - 1.3 * 0;
        return { env: "bad", fov: 40, lightsAt: x, cam: [x - 1, 2.4, 13], look: [x + 0.5, 2.6, 0], actors: <group position={[x, 0, 0]}>{giga(T, { walk: 1 })}</group> };
      }
      // vương miện bay xuống đậu lên đầu ở chữ "found"
      const k = ease((t - 7.0) / 1.7);
      const head: V3 = [GH[0] + 0.3, GH[1] + 0.85, 0];
      return {
        env: "bad", fov: 36, lightsAt: 0, cam: [GH[0] - 6, GH[1] - 0.4, 5.5], look: [GH[0] + 0.6, GH[1] + 0.3, 0],
        actors: (
          <>
            {giga(T, { look: 0.25 })}
            <group position={[head[0], head[1] + 3.5 * (1 - k), head[2]]} rotation={[0, (1 - k) * 4, 0]}><Crown glow={0.6 + 0.6 * pulse(t, 8.6, 9.4)} /></group>
          </>
        ),
      };
    }
    case 29: {
      if (t < 3.87) {
        // xe địa hình nảy trên cát
        const x = 20 - 9 * t;
        const bump = 0.35 * Math.abs(Math.sin(t * 4.2));
        return { env: "bad", pal: "canyon", fov: 40, lightsAt: x, cam: [x - 3, 1.6, 8], look: [x - 1, 0.9, 0], actors: <group position={[x, bump, 0]} rotation={[0, 0, 0.12 * Math.sin(t * 4.2)]}><DuneBuggy t={T} v={9} /></group> };
      }
      if (t < 8.01) {
        // chạy tới, phanh trượt dừng cạnh khúc xương
        const u = t - 3.87;
        const x = u < 3.6 ? -14.8 - 9 * u + (u > 3.0 ? 4.5 * (u - 3.0) ** 2 : 0) : -14.8 - 9 * 3.6 + 4.5 * 0.36;
        const bump = u < 3.0 ? 0.3 * Math.abs(Math.sin(t * 4.2)) : 0;
        const skid = clamp01((u - 3.0) / 0.4) * (1 - clamp01((u - 3.7) / 0.3));
        return {
          env: "bad", pal: "canyon", fov: 38, lightsAt: -47, cam: [-52, 1.0, 4.5], look: [x + 1, 0.9, 0],
          actors: (
            <>
              <group position={[x, bump, 0]} rotation={[0, 0.5 * skid, 0]}><DuneBuggy t={u < 3.6 ? T : 0} v={u < 3.6 ? 9 : 0} /></group>
              <group position={[x + 1.5, 0, 0]}><Dust t={u - 3.0} /></group>
              <group position={[-50, 0.2, -2.2]}><LegBone /></group>
            </>
          ),
        };
      }
      if (t < 10.61) {
        return {
          env: "bad", pal: "canyon", fov: 34, lightsAt: -50, cam: [-52.6, 1.2, 0.4], look: [-50, 0.3, -2.2],
          actors: <><group position={[-50, 0.2, -2.2]}><LegBone glint={(t - 8.6) / 0.6} /></group><group position={[-48.4, 0, -4.4]} rotation={[0, 2.4, 0]}><BlockHuman t={T} coat="#4A6A8A" /></group></>,
        };
      }
      // hai nhà cổ sinh vật học đào khúc xương, đặt tên hai năm sau
      const a = 0.4 + 0.25 * (t - 10.61) / 5.2;
      return {
        env: "bad", pal: "canyon", fov: 40, lightsAt: -50, cam: [-50 + Math.sin(a) * -6, 2.4, Math.cos(a) * 6 - 2.2], look: [-50, 0.6, -2.2],
        actors: (
          <>
            <group position={[-50, 0.2, -2.2]}><LegBone /></group>
            <group position={[-51.2, 0, -1.4]} rotation={[0, 0.8, 0]}><BlockHuman t={T} coat="#C4693A" wave={0.3 * pulse(t, 12.8, 13.8)} /></group>
            <group position={[-48.9, 0, -3.0]} rotation={[0, -2.4, 0]}><BlockHuman t={T} coat="#6A7A4A" /></group>
          </>
        ),
      };
    }
    case 30: {
      if (t < 2.33) {
        const x = 3 - 1.2 * t;
        return { env: "bad", fov: 40, fog: [8, 60], lightsAt: x, cam: [x - 8, 2.0, 7], look: [x - 1, 2.6, 0], actors: <group position={[x, 0, 0]}>{giga(T, { walk: 1 })}</group> };
      }
      // thước dọc thân, xe buýt trượt vào cạnh, ngắn hơn
      const k = ease((t - 2.6) / 0.9);
      const bus = ease((t - 6.1) / 0.7);
      const bx = GX[0] + 5.5;
      return {
        env: "bad", fov: 44, lightsAt: 0, cam: [1.5, 9, 22], look: [1.5, 1.0, -1],
        actors: (
          <>
            {giga(T)}
            <group position={[GX[0], 0.06, 2.4]}><MeasureBar len={GX[1] - GX[0]} k={k} ticks={1} /></group>
            {bus > 0 && <group position={[bx + 30 * (1 - bus), 0, -5.2]}><CityBus t={T} v={8 * (1 - bus)} /></group>}
          </>
        ),
      };
    }
    case 31: {
      if (t < 3.62) {
        const k = ease((t - 0.9) / 0.6);
        const u = t / 3.62;
        return {
          env: "plate", plateX: 360, fov: 38, cam: [360 - 0.6 + 0.4 * u, 1.8, 5.6 - 0.4 * u], look: [360 - 0.4, 0.9, 0],
          actors: (
            <group position={[360, 0, 0]}>
              <GigaSkull />
              <group position={[-1.8, 0, 0.7]} rotation={[0, Math.PI, 0]}><BlockHuman t={T} /></group>
              <group position={[-0.9, 0.04, 0.6]}><MeasureBar len={1.8} k={k} ticks={0.5} c="#9FE0FF" /></group>
              <group position={[-2.3, 0, 0.7]}><MeasureBar len={1.8} k={k} vertical ticks={0.5} c="#9FE0FF" /></group>
            </group>
          ),
        };
      }
      if (t < 6.86) {
        const u = (t - 3.62) / 3.24;
        return { env: "plate", plateX: 400, fov: 34, cam: [400 - 1.6 + 0.8 * u, 1.6, 4.2 - 0.6 * u], look: [400, 1.2, 0], actors: <group position={[400, 0, 0]} rotation={[0, 0.3 * u, 0]}><BladeTooth glint={(t - 4.8) / 1.1} /></group> };
      }
      return {
        env: "plate", plateX: 440, fov: 38, cam: [440, 1.8, 6.4], look: [440, 1.1, 0],
        actors: <group position={[440, 0, 0]}><group position={[-1.4, 0, 0]} rotation={[0, 0.5 + 0.3 * (t - 6.86), 0]}><BladeTooth glint={(t - 7.4) / 0.8} /></group><group position={[1.4, 0, 0]}><SpikeTooth /></group></group>,
      };
    }
    case 32: {
      const tx = 6, tz = -4;
      const titan = (walk: number) => <group position={[tx - walk * 1.2 * Math.max(0, t - 5.13), 0, tz]}><BlockTitanosaur t={T} walk={walk} /></group>;
      if (t < 5.13) {
        // cắn rạch sườn titanosaur
        const lunge = pulse(t, 1.6, 2.2) + pulse(t, 2.15, 2.75);
        return {
          env: "bad", fov: 46, lightsAt: 3, cam: [-6, 3.2, 14], look: [3, 5.5, -2],
          actors: (
            <>
              {titan(0)}
              <group position={[0.5 + 0.8 * lunge, 0, 2.4]} rotation={[0, -0.5, 0]}>{giga(T, { bite: lunge, stalk: 0.4 })}</group>
              <Slash k={(t - 1.9) / 0.3} p={[tx - 1, 7.5, tz + 2.15]} a={0.35} />
              <Slash k={(t - 2.45) / 0.3} p={[tx + 0.6, 7.0, tz + 2.15]} a={0.5} />
            </>
          ),
        };
      }
      if (t < 8.43) {
        // góc thấp, titanosaur bước tới
        return { env: "bad", fov: 50, lightsAt: 3, cam: [-14, 0.8, 10], look: [2, 8, -4], actors: <>{titan(1)}<group position={[-1, 0, 3.5]} rotation={[0, -0.4, 0]}>{giga(T, { look: 0.3 })}</group></> };
      }
      const u = (t - 8.43) / 2.54;
      return { env: "bad", fov: 46, lightsAt: 3, cam: [-24 + 4 * u, 6, 26], look: [2, 6, -2], actors: <>{titan(1)}<group position={[-1, 0, 3.5]} rotation={[0, -0.4, 0]}>{giga(T)}</group></> };
    }
    case 33: {
      if (t < 2.86) {
        const x = 10 - 2.6 * t;
        return { env: "city", fov: 44, lightsAt: x, cam: [x - 9, 2.2, 3.0], look: [x - 1, 2.8, 0], actors: <><CarPark t={t} alarm={t > 2.2 ? 1 : 0} /><group position={[x, 0, 0]}>{giga(T, { walk: 1 })}</group></> };
      }
      // nhìn xuống nóc xe giao hàng mà không cần ngẩng đầu
      const x = Math.max(-7.5 - GH[0] - 0.4, 2.6 - 2.6 * (t - 2.86));
      return {
        env: "city", fov: 40, lightsAt: -7, cam: [-7.5, 2.4, -15], look: [-7.5, 3.2, -3],
        actors: <><CarPark t={t} alarm={1} vanRock={pulse(t, 4.3, 5.2) * Math.sin(t * 18)} /><group position={[x, 0, -1.2]}>{giga(T, { walk: t < 4.2 ? 1 : 0, stalk: 0.8, look: -0.35 * ease((t - 4.2) / 0.5) })}</group></>,
      };
    }
    case 34: {
      if (t < 2.16) return { env: "bad", fov: 40, fog: [6, 40], dim: 0.5, lightsAt: 0, cam: [-9, 2.6, 9], look: [-2, 3, 0], actors: giga(T, { eyeI: 1.4 }) };
      if (t < 6.46) {
        const u = (t - 2.16) / 4.3;
        return { env: "plate", plateX: 480, fov: 44, cam: [480 + 0.5 - 1 * u, 3.0, 10.5], look: [480 + 0.5, 2.2, 0], actors: <group position={[480, 0, 0]}><PartialSkeleton t={T} miss={ease((t - 3.2) / 0.4)} /><group position={[-5.8, 0.4, 1.2]}><MeasureBar len={11 * (1 + 0.12 * Math.sin((t - 4.6) * 6) * clamp01((t - 4.6) / 0.3))} k={ease((t - 4.5) / 0.4)} ticks={1} /></group></group> };
      }
      if (t < 11.4) {
        // cân hai con thu nhỏ, đòn cân lắc rồi cân bằng
        const tilt = 0.35 * Math.exp(-(t - 6.9) * 1.1) * Math.cos((t - 6.9) * 5) * (t > 6.9 ? 1 : 0) + (t < 6.9 ? 0.35 : 0);
        return {
          env: "plate", plateX: 520, fov: 40, cam: [520, 3.0, 8], look: [520, 2.2, 0],
          actors: (
            <group position={[520, 0, 0]}>
              <Balance tilt={tilt} left={<group scale={0.11} position={[0.2, 0, 0]}><BlockTheropod t={T} spec={GIGA} walk={0} /></group>} right={<group scale={0.11} position={[0.2, 0, 0]}><BlockTheropod t={T} spec={REX} walk={0} /></group>} />
            </group>
          ),
        };
      }
      if (t < 12.64) {
        // chiều dài gần bằng: hai con song song nhìn từ trên
        const [rx] = extent(REX);
        return { env: "bad", fov: 40, lightsAt: 0, cam: [0, 22, 14], look: [0, 0, 0], actors: <><group position={[0, 0, -3.5]}>{giga(T)}</group><group position={[GX[0] - rx, 0, 3.5]}><BlockTheropod t={T} spec={REX} walk={0} /></group></> };
      }
      // hàm T. rex sập lại trong bóng tối, đèn tắt
      const RH = headOf(REX);
      return { env: "bad", fov: 32, dim: 0.35, fog: [6, 40], lightsAt: 0, cam: [RH[0] - 3.5, RH[1] - 0.4, 4.2], look: [RH[0], RH[1], 0], actors: <BlockTheropod t={T} spec={REX} walk={0} roar={pulse(t, 12.7, 13.6) * 0.9} bite={pulse(t, 13.5, 14.2)} eyeI={1.6} /> };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// ------------------------------------------------------------------ chữ trên màn hình
const NameCard: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 8], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: k }}>
      <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 84, color: "#FFF3DE", textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>Giganotosaurus carolinii</div>
      <div style={{ fontFamily: mono, fontSize: 28, letterSpacing: 6, color: "#E8B464", marginTop: 8 }}>NAMED 1995 · CORIA & SALGADO</div>
    </div>
  );
};
const PanLabel: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 6], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", gap: 520, opacity: k, fontFamily: sans, fontWeight: 900, fontSize: 44, color: "#FFF3DE", letterSpacing: 3 }}>
      <span>GIGANOTOSAURUS</span><span>T. REX</span>
    </div>
  );
};
const ToothLabel: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 6], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, display: "flex", justifyContent: "center", gap: 470, opacity: k, fontFamily: sans, fontWeight: 900, fontSize: 56, letterSpacing: 4 }}>
      <span style={{ color: "#FFF3DE" }}>BLADE</span><span style={{ color: "#8A8A8A" }}>SPIKE</span>
    </div>
  );
};
const LightsOut: React.FC<{ f: number }> = ({ f }) => <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 4], [0, 1], CLAMP) }} />;

type Ov = [number, number, number, (f: number) => React.ReactNode];
export const OVERLAYS5: Ov[] = [
  [28, 0.1, 2.9, (f) => <RankSlam f={f} rank="#2" name="GIGANOTOSAURUS" />],
  [28, 3.1, 5.5, (f) => <Tag f={f} text="“GIANT SOUTHERN LIZARD”" pos="bl" />],
  [28, 6.74, 9.4, (f) => <Tag f={f} text="BIGGEST MEAT-EATER FOUND" sub="FOR A FEW YEARS IN THE 1990s" pos="tc" />],
  [29, 1.35, 3.8, (f) => <Tag f={f} text="RUBÉN CAROLINI" sub="AMATEUR FOSSIL HUNTER" pos="bl" />],
  [29, 4.61, 8.0, (f) => <Tag f={f} text="VILLA EL CHOCÓN · ARGENTINA" sub="1993" pos="bl" />],
  [29, 8.59, 10.5, (f) => <Tag f={f} text="A HUGE LEG BONE" pos="bl" />],
  [29, 12.87, 15.8, (f) => <NameCard f={f} />],
  [30, 0.63, 2.3, (f) => <Tag f={f} text="~98 MILLION YEARS AGO" pos="bl" />],
  [30, 3.33, 7.7, (f) => <Tag f={f} text="~12–13 m / 40 ft" pos="bl" />],
  [30, 6.3, 7.7, (f) => <Tag f={f} text="LONGER THAN A CITY BUS" pos="tc" />],
  [31, 1.4, 3.6, (f) => <Tag f={f} text="SKULL ≈ A GROWN MAN" pos="bl" />],
  [31, 4.9, 6.8, (f) => <Tag f={f} text="SERRATED · BOTH EDGES" pos="bl" />],
  [31, 7.3, 9.5, (f) => <ToothLabel f={f} />],
  [32, 1.83, 5.0, (f) => <Tag f={f} text="SLICE, THEN WAIT" sub="THE USUAL READING" pos="bl" />],
  [32, 7.19, 10.9, (f) => <Tag f={f} text="TITANOSAURS" sub="AMONG THE HEAVIEST ANIMALS EVER" pos="bl" />],
  [33, 4.5, 6.7, (f) => <Tag f={f} text="EYE LEVEL WITH A VAN ROOF" sub="WITHOUT LIFTING ITS HEAD" pos="bl" />],
  [34, 0.18, 2.1, (f) => <RankSlam f={f} rank="#2" name="WHY NOT #1?" />],
  [34, 3.28, 6.4, (f) => <Tag f={f} text="INCOMPLETE SKELETON" sub="SIZE ESTIMATES SWING WIDELY" pos="bl" />],
  [34, 7.0, 11.3, (f) => <PanLabel f={f} />],
  [34, 8.02, 11.3, (f) => <Tag f={f} text="SAME WEIGHT CLASS" sub="NOT ABOVE IT" pos="tc" />],
  [34, 11.5, 12.6, (f) => <Tag f={f} text="LENGTH: CLOSE" pos="tc" />],
  [34, 13.66, 14.6, (f) => <Tag f={f} text="THE JAWS DECIDE IT" pos="tc" />],
  [34, 14.7, 16.37, (f) => <LightsOut f={f} />],
];
export const CHAPTER5: [number, number, string][] = [[28, 34, "#2 GIGANOTOSAURUS"]];
