// Tập dài 006, ACT 3 (#4 Carnotaurus, beat 15-21). Mốc giây trong beat lấy từ long/006/raw/words_all.json.
import React from "react";
import { interpolate } from "remotion";
import { BlockHuman, BlockTheropod, DINOS, Glow, V3 } from "./BlockAnimals";
import { CLAMP, Shot, clamp01, ease, extent, headOf, lerp, mono, pulse, sans } from "./Long006_common";
import { Dust, FossilSlab } from "./FossilProps";
import { MeasureBar, Piece, Shatter } from "./ActProps";
import { BlockCar, CROSS_X, CityStreet } from "./CityProps";
import { RankSlam, Tag } from "./Long006_act12";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS3: Record<number, Cut[]> = {
  15: [[0, "flash"], [5.23, "cut"], [8.39, "whip"]],
  16: [[0, "cut"], [6.68, "whip"], [11.54, "cut"]],
  17: [[0, "cut"], [1.92, "whip"], [6.48, "cut"], [10.0, "whip"]],
  18: [[0, "cut"], [3.0, "whip"], [5.32, "cut"]],
  19: [[0, "whip"], [4.43, "cut"]],
  20: [[0, "cut"], [3.77, "whip"]],
  21: [[0, "whip"], [4.66, "cut"], [8.3, "flash"]],
};
export const HITS3: Record<number, [number, number][]> = {
  15: [[0.13, 0.3], [11.43, 0.3]],
  16: [[7.6, 0.05]],
  17: [[7.56, 0.05], [8.08, 0.05], [8.98, 0.05], [9.3, 0.06], [10.66, 0.12]],
  18: [[3.0, 0.08]],
  20: [[2.95, 0.28]],
  21: [[8.3, 0.3]],
};
export const LIGHTNING3: Record<number, number[]> = { 15: [0.1] };

const CARNO = DINOS.carnotaurus;
const CH = headOf(CARNO);
const CX = extent(CARNO);
const carno = (T: number, o: { walk?: number; roar?: number; look?: number; phase?: number; period?: number; skin?: string; flap?: number; stalk?: number } = {}) => (
  <BlockTheropod t={T} spec={CARNO} walk={o.walk ?? 0} roar={o.roar ?? 0} look={o.look ?? 0} phase={o.phase ?? 0} period={o.period} skin={o.skin} flap={o.flap ?? 0} stalk={o.stalk} />
);

// cơ đuôi phát sáng đỏ: k = độ sáng, n = số lớp đã "gắn" (beat 17 dựng cơ trên máy tính)
const TAIL_X0 = 0.9, TAIL_X1 = CX[1] - 0.4;
const TailGlow: React.FC<{ k: number; layers?: number }> = ({ k, layers = 3 }) => {
  if (k <= 0) return null;
  const n = 7;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const u = i / (n - 1);
        const x = lerp(TAIL_X0, TAIL_X1, u);
        const h = lerp(0.95, 0.25, u);
        return Array.from({ length: Math.ceil(layers) }, (_, L) => {
          const a = clamp01(layers - L);
          const g = 1 + 0.14 * L;
          return <Glow key={`${i}-${L}`} p={[x, lerp(2.45, 1.75, u) - 0.05 * L, 0]} s={[0.62 * a, h * g * a, lerp(0.85, 0.3, u) * g * a]} c="#FF3A24" i={1.4 * k} />;
        });
      })}
    </>
  );
};

// mũi tên phát sáng chạy từ tay ra đuôi ("mọi thứ dồn về chỗ khác")
const FlowArrows: React.FC<{ t: number; k: number }> = ({ t, k }) =>
  k <= 0 ? null : (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const u = ((t * 0.55 + i / 6) % 1);
        const x = lerp(-1.4, TAIL_X1, u);
        return (
          <group key={i} position={[x, lerp(2.3, 1.9, u) + 0.9, 1.0]}>
            <Glow p={[0, 0.14, 0]} s={[0.36, 0.08, 0.08]} c="#FFD25A" i={2.2 * k * Math.sin(Math.PI * u)} />
            <group rotation={[0, 0, 0.7]}><Glow p={[0.12, 0, 0]} s={[0.3, 0.08, 0.08]} c="#FFD25A" i={2.2 * k * Math.sin(Math.PI * u)} /></group>
            <group rotation={[0, 0, -0.7]}><Glow p={[0.12, 0.28, 0]} s={[0.3, 0.08, 0.08]} c="#FFD25A" i={2.2 * k * Math.sin(Math.PI * u)} /></group>
          </group>
        );
      })}
    </>
  );

// tảng đá khối, vỡ ở t0
const BOULDER: Piece[] = (() => {
  const out: Piece[] = [];
  const cs = ["#6A625A", "#5A524A", "#7A7068"];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) out.push({ p: [-0.7 + 0.7 * i, 0.4 + 0.75 * j, -0.45 + 0.9 * k], s: [0.68, 0.72, 0.86], c: cs[(i + j + k) % 3] });
  return out;
})();
const Boulder: React.FC<{ t: number; t0: number; crack: number }> = ({ t, t0, crack }) =>
  t < t0 ? (
    <group>
      {BOULDER.map((q, i) => <mesh key={i} position={q.p} castShadow receiveShadow><boxGeometry args={q.s} /><meshStandardMaterial color={q.c} flatShading /></mesh>)}
      {crack > 0 && <Glow p={[-1.06, 1.1, 0]} s={[0.02, 1.6 * crack, 0.06]} c="#FFE0A0" i={1} />}
    </group>
  ) : (
    <Shatter t={t} t0={t0} pieces={BOULDER} force={5} seed={9} />
  );

// cột so sánh cơ đuôi (beat 17): 4 loài ăn thịt khác xám, Carnotaurus đỏ vọt lên
const BARS = [1.2, 1.55, 1.0, 1.35];
const BarChart: React.FC<{ t: number }> = ({ t }) => {
  const k = ease((t - 10.1) / 0.5);
  const c = interpolate(t, [10.5, 10.9, 11.1], [0, 3.6, 3.3], CLAMP);
  return (
    <group>
      {BARS.map((h, i) => {
        const hh = Math.max(0.01, h * k);
        return <mesh key={i} position={[-2.4 + i * 1.2, hh / 2, 0]} castShadow><boxGeometry args={[0.8, hh, 0.8]} /><meshStandardMaterial color="#6A6E76" flatShading /></mesh>;
      })}
      {c > 0 && <Glow p={[2.4, c / 2, 0]} s={[0.8, c, 0.8]} c="#FF3A24" i={1.6} />}
      <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[6.6, 0.04, 1.6]} /><meshStandardMaterial color="#2A2622" /></mesh>
    </group>
  );
};

// vảy da tròn nhỏ (beat 21): mọc dần từ tâm ra
const SCALES = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 16; r++) for (let c = 0; c < 22; c++) out.push([-2.1 + c * 0.2 + (r % 2) * 0.1, -1.4 + r * 0.175]);
  return out;
})();
const ScaleSkin: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => (
  <group>
    <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 3.4]} /><meshStandardMaterial color="#5A4636" /></mesh>
    {SCALES.map(([x, z], i) => {
      const d = Math.hypot(x, z * 1.3) / 2.6;
      const k = ease((t - lerp(t0, t1, d)) / 0.25);
      if (k <= 0) return null;
      const r = (0.07 + 0.02 * ((i * 7) % 3)) * k;
      return <mesh key={i} position={[x, 0.05, z]} castShadow><cylinderGeometry args={[r, r * 1.1, 0.06, 7]} /><meshStandardMaterial color={i % 5 ? "#8A6A4E" : "#A48262"} flatShading /></mesh>;
    })}
  </group>
);

// zigzag: người đổi hướng liên tục, Carnotaurus đuổi theo bằng lò xo ít giảm chấn nên trượt quá mỗi lần rẽ
const ZT0 = 3.77;
const human = (t: number): [number, number] => {
  const u = t - ZT0;
  const ph = (u / 1.3) % 1;
  const tri = ph < 0.5 ? ph * 4 - 1 : 3 - ph * 4;
  return [-140 - 5.5 * u, 3.2 * tri];
};
function chase(t: number) {
  let p: [number, number] = [-131, 0], v: [number, number] = [-6, 0];
  let th = 0, thPrev = 0, tilt = 0;
  const dt = 1 / 60;
  for (let s = ZT0; s < t; s += dt) {
    const h = human(Math.max(ZT0, s - 0.35));
    const a: [number, number] = [9 * (h[0] + 2.6 - p[0]) - 1.6 * v[0], 9 * (h[1] - p[1]) - 1.6 * v[1]];
    v = [v[0] + a[0] * dt, v[1] + a[1] * dt];
    p = [p[0] + v[0] * dt, p[1] + v[1] * dt];
    thPrev = th;
    th = Math.atan2(v[1], -v[0]);
    tilt = lerp(tilt, Math.max(-0.35, Math.min(0.35, (th - thPrev) * 6)), 0.2);
  }
  return { p, th, tilt };
}

export function shotAct3(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 15: {
      if (t < 5.23) {
        const x = 9 - 1.4 * t;
        return { env: "bad", fov: 36, fog: [7, 45], dim: 0.75, lightsAt: x, cam: [-9.5, 1.3, 4.0], look: [x - 2.2, 2.6, 0], actors: <group position={[x, 0, 0]}>{carno(T, { walk: 1, roar: pulse(t, 2.7, 4.2) * 0.8 })}</group> };
      }
      if (t < 8.39) {
        // cận hai sừng trên mắt, đẩy máy chậm
        const u = (t - 5.23) / 3.16;
        return { env: "bad", fov: 32, lightsAt: 0, cam: [CH[0] - 3.4 + 0.6 * u, CH[1] + 1.3, 3.2 - 0.5 * u], look: [CH[0] + 0.1, CH[1] + 0.4, 0], actors: carno(T, { look: 0.15 }) };
      }
      // đầu như búa phá thành: lao vào tảng đá, đá vỡ ở "ram"
      const TI = 11.43, BX = -6;
      const xi = BX + 1.05 - CX[0];
      const x = t < TI ? xi + 5.5 * (TI - t) : xi + 0.6 * ease((t - TI) / 0.35);
      return {
        env: "bad", fov: 40, lightsAt: -2, cam: [-2.5, 1.9, 12.5], look: [-2.5, 1.9, 0],
        actors: (
          <>
            <group position={[x, 0, 0]}>{carno(T, { walk: t < TI ? 1 : 0.2, period: 0.7, stalk: 1 })}</group>
            <group position={[BX, 0, 0]}><Boulder t={t} t0={TI + 0.02} crack={0} /></group>
            <group position={[BX + 0.4, 0, 0]}><Dust t={t - TI} /></group>
          </>
        ),
      };
    }
    case 16: {
      if (t < 6.68) {
        const k = ease((t - 0.6) / 0.9);
        const u = t / 6.68;
        return {
          env: "bad", fov: 40, lightsAt: 0, cam: [0.3, 2.0, 13 - 1.2 * u], look: [0.3, 1.6, 0],
          actors: (
            <>
              {carno(T)}
              <group position={[CX[0] - 1.4, 0, 1.2]} rotation={[0, Math.PI, 0]}><BlockHuman t={T} /></group>
              <group position={[CX[0], 0.06, 1.6]}><MeasureBar len={CX[1] - CX[0]} k={k} ticks={1} /></group>
            </>
          ),
        };
      }
      if (t < 11.54) {
        // cận hai tay cụt vẫy vô ích
        const u = (t - 6.68) / 4.86;
        const flap = clamp01((t - 7.5) / 0.3) * (1 - clamp01((t - 11.2) / 0.3));
        return { env: "bad", fov: 28, lightsAt: 0, cam: [-3.2 + 0.3 * u, 1.75, 3.4 - 0.3 * u], look: [-2.0, 1.95, 0.5], actors: carno(T, { flap }) };
      }
      // mũi tên chảy từ tay ra đuôi, đuôi bắt đầu sáng
      return {
        env: "bad", fov: 40, lightsAt: 0, cam: [1.2, 2.4, 11], look: [1.2, 2.0, 0],
        actors: <>{carno(T)}<FlowArrows t={t} k={ease((t - 11.6) / 0.4)} /><TailGlow k={ease((t - 13.6) / 0.6)} layers={1} /></>,
      };
    }
    case 17: {
      if (t < 1.92) {
        return { env: "bad", fov: 38, lightsAt: 0, cam: [3.4, 2.2, 8.5], look: [2.8, 2.0, 0], actors: <>{carno(T)}<TailGlow k={0.8 + 0.4 * ease((t - 0.9) / 0.4)} layers={1.5} /></> };
      }
      if (t < 10.0) {
        // phòng thí nghiệm tối: Carnotaurus xám, lớp cơ gắn dần lên đuôi
        const u = (t - 1.92) / 8.08;
        const a = -0.9 + 0.7 * u;
        const layers = t < 6.48 ? 0 : [7.56, 8.08, 8.98, 9.3].filter((s) => t >= s).length + clamp01((t - 6.6) / 0.6);
        return {
          env: "plate", plateX: 40, fov: 42, cam: [40 + 1.2 + Math.sin(a) * 11, 3.2, Math.cos(a) * 11], look: [40 + 1.2, 2.0, 0],
          actors: <group position={[40, 0, 0]}>{carno(T, { skin: "#3A4048" })}<TailGlow k={layers > 0 ? 1 : 0} layers={layers} /></group>,
        };
      }
      return { env: "plate", plateX: 80, fov: 38, cam: [80 - 1.0, 2.6, 7.6], look: [80, 1.5, 0], actors: <group position={[80, 0, 0]}><BarChart t={t} /></group> };
    }
    case 18: {
      if (t < 3.0) {
        // quay chậm: đùi kéo ra sau mỗi sải
        return { env: "bad", fov: 34, lightsAt: 0, cam: [-1.6, 2.0, 8.2], look: [0.8, 1.8, 0], actors: <>{carno(T, { walk: 1, period: 3.4 })}<TailGlow k={0.7} layers={1} /></> };
      }
      const x = -11 * (t - 3);
      const dust = Array.from({ length: Math.floor((t - 3) / 0.3) }, (_, i) => 3 + i * 0.3).slice(-8).map((s) => (
        <group key={s} position={[-11 * (s - 3) + 1.5, 0, 0]}><Dust t={t - s} /></group>
      ));
      if (t < 5.32) {
        return { env: "bad", fov: 40, lightsAt: x, cam: [x - 5, 1.4, 7.5], look: [x, 2.0, 0], actors: <><group position={[x, 0, 0]}>{carno(T, { walk: 1, period: 0.55, stalk: 1 })}</group>{dust}</> };
      }
      return { env: "bad", fov: 44, lightsAt: x, cam: [x - 9, 0.7, 3.2], look: [x - 1, 2.3, 0], actors: <><group position={[x, 0, 0]}>{carno(T, { walk: 1, period: 0.55, stalk: 1 })}</group>{dust}</> };
    }
    case 19: {
      // phố đêm: chạy song song với xe hơi, xe vọt lên ở "seconds"
      const v = 14;
      const tp = 4.43;
      const cx = -40 - v * t - (t > tp ? 3 * (t - tp) ** 2 : 0);
      const dx = -40 - v * Math.min(t, tp) - (t > tp ? v * (t - tp) - 4 * (t - tp) ** 2 : 0);
      return {
        env: "city", fov: 46, lightsAt: dx, cam: [dx + 17, 5.2, -0.6], look: [dx - 4, 1.6, 0],
        actors: (
          <>
            <CityStreet />
            <group position={[cx, 0, -2.4]}><BlockCar t={T} v={v} /></group>
            <group position={[dx + 0.6, 0, 2.4]}>{carno(T, { walk: 1, period: t < tp ? 0.55 : 0.75, stalk: 1 })}</group>
          </>
        ),
      };
    }
    case 20: {
      if (t < 3.77) {
        // ngã tư: xe rẽ, Carnotaurus trượt thẳng, đâm cột đèn
        const v = 12, R = 5, tc = 20 / v;
        let car: [number, number, number];
        if (t < tc) car = [-100 - v * t, -2.2, 0];
        else {
          const a = Math.min(Math.PI / 2, ((t - tc) * v) / R);
          const extra = Math.max(0, t - tc - (Math.PI / 2) * R / v) * v;
          car = [CROSS_X - R * Math.sin(a), -2.2 + R - R * Math.cos(a) + extra, a];
        }
        const ts = 2.33, th = 2.95;
        let dp: [number, number] = [-92 - v * t, -2.2];
        let yaw = 0, roll = 0;
        if (t > ts) {
          const k = ease((t - ts) / (th - ts));
          dp = [lerp(CROSS_X, CROSS_X - 7.2, k), lerp(-2.2, -5.4, k * k)];
          yaw = 0.9 * k;
          roll = 0.3 * k;
          if (t > th) { dp = [CROSS_X - 7.2 + 0.4 * ease((t - th) / 0.3), -5.4]; roll = 0.3 - 0.45 * pulse(t, th, th + 0.8); }
        }
        return {
          env: "city", fov: 44, lightsAt: CROSS_X, cam: [CROSS_X + 13, 11, 6], look: [CROSS_X - 3, 1.0, -1],
          actors: (
            <>
              <CityStreet hitLamp={ease((t - th) / 0.3)} />
              <group position={[car[0], 0, car[1]]} rotation={[0, car[2], 0]}><BlockCar t={T} v={v} brake={pulse(t, 1.2, 2.2)} /></group>
              <group position={[dp[0], 0, dp[1]]} rotation={[roll, yaw, 0]}>{carno(T, { walk: t < ts ? 1 : 0.4, period: 0.6, stalk: 1 })}</group>
            </>
          ),
        };
      }
      // đổi hướng liên tục: mỗi lần rẽ, nó trượt quá đà
      const h = human(t);
      const c = chase(t);
      const hp = human(t + 0.05);
      const hth = Math.atan2(hp[1] - h[1], -(hp[0] - h[0]));
      return {
        env: "city", fov: 42, lightsAt: h[0], cam: [h[0] + 14, 5.5, 7.2], look: [h[0] + 2.5, 1.0, 0],
        actors: (
          <>
            <CityStreet />
            <group position={[h[0], 0, h[1]]} rotation={[0, hth, 0]}><BlockHuman t={T * 1.6} walk={1} coat="#3A7AB8" /></group>
            <group position={[c.p[0], 0, c.p[1]]} rotation={[c.tilt, c.th, 0]}>{carno(T, { walk: 1, period: 0.6, stalk: 1 })}</group>
          </>
        ),
      };
    }
    case 21: {
      if (t < 4.66) {
        const u = t / 4.66;
        return { env: "plate", plateX: 120, fov: 38, cam: [120 - 2.6 + 0.8 * u, 2.6 - 0.3 * u, 3.4 - 0.4 * u], look: [120, 0.2, 0], actors: <group position={[120, 0, 0]}><FossilSlab glint={(t - 1.0) / 0.9} /></group> };
      }
      const u = (t - 4.66) / 4.8;
      return { env: "plate", plateX: 160, fov: 36, cam: [160 - 1.4 + 0.5 * u, 2.6 - 0.6 * u, 1.6 - 0.2 * u], look: [160, 0, 0], actors: <group position={[160, 0, 0]}><ScaleSkin t={t} t0={5.9} t1={7.8} /></group> };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// ------------------------------------------------------------------ chữ trên màn hình
const Speedo: React.FC<{ v: number; label: string; x: number; c?: string }> = ({ v, label, x, c = "#E8B464" }) => {
  const a = -120 + (240 * Math.min(v, 80)) / 80;
  return (
    <div style={{ position: "absolute", left: x, bottom: 90, width: 260, textAlign: "center" }}>
      <svg width="260" height="170" viewBox="0 0 260 170">
        <path d="M30 150 A100 100 0 1 1 230 150" fill="none" stroke="rgba(255,243,222,0.35)" strokeWidth="10" />
        {[0, 20, 40, 60, 80].map((k) => {
          const r = ((-120 + (240 * k) / 80 - 90) * Math.PI) / 180;
          return <text key={k} x={130 + 78 * Math.cos(r)} y={108 + 78 * Math.sin(r)} fill="#FFF3DE" fontSize="17" fontFamily={mono} textAnchor="middle">{k}</text>;
        })}
        <g transform={`rotate(${a} 130 106)`}><rect x="127" y="22" width="6" height="88" fill={c} /></g>
        <circle cx="130" cy="106" r="10" fill={c} />
      </svg>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: "#FFF3DE", marginTop: -30, textShadow: "0 3px 12px rgba(0,0,0,0.9)" }}>{Math.round(v)} <span style={{ fontSize: 22 }}>KM/H</span></div>
      <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 4, color: c }}>{label}</div>
    </div>
  );
};
const Fade: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => <div style={{ opacity: interpolate(f, [0, 6], [0, 1], CLAMP) }}>{children}</div>;
const Mono: React.FC<{ f: number; text: string }> = ({ f, text }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: mono, fontSize: 30, letterSpacing: 10, color: "#FFF3DE", opacity: interpolate(f, [0, 6], [0, 0.85], CLAMP) }}>{text}</div>
);

type Ov = [number, number, number, (f: number) => React.ReactNode];
const kmh = (f: number, keys: number[], vals: number[]) => interpolate(f / 30, keys, vals, CLAMP);
export const OVERLAYS3: Ov[] = [
  [15, 0.13, 2.9, (f) => <RankSlam f={f} rank="#4" name="CARNOTAURUS" />],
  [15, 3.63, 5.1, (f) => <Tag f={f} text="“MEAT-EATING BULL”" pos="bl" />],
  [15, 7.19, 8.35, (f) => <Tag f={f} text="THICK BLUNT HORNS" pos="bl" />],
  [15, 10.97, 13.0, (f) => <Tag f={f} text="BATTERING RAM" sub="NOT SHEARS" pos="tc" />],
  [16, 0.74, 6.6, (f) => <Tag f={f} text="~8 m / 26 ft" pos="bl" />],
  [16, 4.74, 6.6, (f) => <Tag f={f} text="1–2 TONNES" pos="br" />],
  [16, 7.6, 11.5, (f) => <Tag f={f} text="ARMS SMALLER THAN T. REX" sub="CLOSE TO USELESS" pos="bl" />],
  [16, 13.38, 14.9, (f) => <Tag f={f} text="SPENT ON THE TAIL" pos="tc" />],
  [17, 2.08, 6.4, (f) => <Tag f={f} text="2011 · UNIVERSITY OF ALBERTA" sub="PERSONS & CURRIE" pos="bl" />],
  [17, 7.56, 9.9, (f) => <Tag f={f} text="MUSCLES REBUILT" sub="ON A COMPUTER" pos="bl" />],
  [17, 10.66, 15.5, (f) => <Tag f={f} text="BIGGEST TAIL MUSCLE" sub="FOR ITS SIZE, OF ANY MEAT-EATER STUDIED" pos="tc" />],
  [18, 0.2, 2.9, (f) => <Mono f={f} text="SLOW MOTION" />],
  [18, 4.3, 5.3, (f) => <Tag f={f} text="SPRINTER" pos="tc" />],
  [18, 5.4, 11.9, (f) => <Fade f={f}><Speedo v={kmh(f, [0, 2.4, 5.3], [0, 52, 50])} label="CARNOTAURUS" x={1560} c="#FF5A3A" /></Fade>],
  [18, 7.76, 11.9, (f) => <Tag f={f} text="30–35 MPH" sub="≈ 50 KM/H · SHORT BURSTS" pos="bl" />],
  [19, 0.3, 5.3, (f) => <Fade f={f}><Speedo v={kmh(f, [0, 4.1, 5.0], [50, 50, 30])} label="CARNOTAURUS" x={1300} c="#FF5A3A" /><Speedo v={kmh(f, [0, 4.1, 5.0], [50, 50, 72])} label="CAR" x={1600} c="#7FC8FF" /></Fade>],
  [20, 2.13, 3.7, (f) => <Tag f={f} text="STIFF TAIL = BAD AT CORNERS" pos="tc" />],
  [20, 7.17, 9.9, (f) => <Tag f={f} text="CHANGE DIRECTION" sub="AND KEEP CHANGING IT" pos="tc" />],
  [21, 1.04, 4.6, (f) => <Tag f={f} text="ONE SKELETON" pos="tc" />],
  [21, 3.46, 4.6, (f) => <Tag f={f} text="1984 · PATAGONIA" sub="ARGENTINA" pos="bl" />],
  [21, 6.06, 8.2, (f) => <Tag f={f} text="SKIN IMPRESSIONS" sub="SMALL ROUND SCALES" pos="bl" />],
  [21, 8.3, 9.49, (f) => <RankSlam f={f} rank="#4" name="CARNOTAURUS" />],
];
export const CHAPTER3: [number, number, string][] = [[15, 21, "#4 CARNOTAURUS"]];
