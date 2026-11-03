// Tập dài 006, CLOSER (beat 40-42): điểm lại bảng xếp hạng, vì sao T. rex đứng đầu, năm con chưa từng gặp nhau
// (trục thời gian), nhá tập sau. Mốc giây trong beat lấy từ long/006/raw/words_all.json.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BlockTheropod, DINOS, V3 } from "./BlockAnimals";
import { BarGlow, CLAMP, RANK, REX, RH, Shot, ease, extent, faceShot, mono, pulse, sans } from "./Long006_common";
import { TrikeFrill } from "./FossilProps";
import { BlockPterosaur } from "./Act4Props";
import { Tag } from "./Long006_act12";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS7: Record<number, Cut[]> = {
  40: [[0, "cut"], [1.59, "whip"], [4.25, "whip"], [5.53, "whip"], [8.85, "whip"], [10.93, "flash"]],
  41: [[0, "cut"], [5.44, "cut"], [6.14, "cut"], [6.78, "cut"], [7.44, "cut"], [8.46, "whip"], [9.74, "cut"]],
  42: [[0, "cut"], [2.26, "whip"], [8.9, "whip"]],
};
export const HITS7: Record<number, [number, number][]> = {
  40: [[10.95, 0.2], [12.9, 0.15]],
  41: [[8.5, 0.15]],
};
export const LIGHTNING7: Record<number, number[]> = { 40: [10.95], 42: [9.0, 11.5] };

const rex = (T: number, o: { walk?: number; roar?: number; eyeI?: number } = {}) => <BlockTheropod t={T} spec={REX} walk={o.walk ?? 0} roar={o.roar ?? 0} eyeI={o.eyeI ?? 1} />;
const Flock: React.FC<{ T: number; c: V3; R: number; n?: number }> = ({ T, c, R, n = 4 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = T * 0.45 + (i * 2 * Math.PI) / n;
      return (
        <group key={i} position={[c[0] + Math.cos(a) * R * (1 + 0.15 * i), c[1] + 1.5 * Math.sin(T * 0.8 + i), c[2] + Math.sin(a) * R * (1 + 0.15 * i)]} rotation={[0, Math.PI / 2 - a, 0.35]}>
          <BlockPterosaur t={T} phase={i} />
        </group>
      );
    })}
  </>
);
// năm con đứng song song theo thứ hạng #5 → #1 (trái → phải khi nhìn từ phía -X)
const Lineup: React.FC<{ T: number }> = ({ T }) => (
  <>
    {RANK.map((sp, i) => (
      <group key={sp} position={[0, 0, -9 + 4.5 * i]}>
        <BlockTheropod t={T} spec={DINOS[sp]} walk={0} phase={i} />
      </group>
    ))}
  </>
);
// nhìn từ trên: mõm thẳng hàng ở x = 0, vạch dài từng con (Spinosaurus, Giganotosaurus dài hơn T. rex → đỏ)
const LENGTH_Z = [-7.2, -3.6, 0, 3.6, 7.2];
const LengthRow: React.FC<{ T: number; k: number }> = ({ T, k }) => (
  <>
    {RANK.map((sp, i) => {
      const [x0, x1] = extent(DINOS[sp]);
      const L = (x1 - x0) * k;
      const c = sp === "trex" ? "#F2D27A" : sp === "spinosaurus" || sp === "giganotosaurus" ? "#E5533D" : "#9FB0C0";
      return (
        <group key={sp}>
          <group position={[-x0, 0, LENGTH_Z[i]]}><BlockTheropod t={T} spec={DINOS[sp]} walk={0} phase={i} /></group>
          <BarGlow x0={0} x1={L} z={LENGTH_Z[i] + 1.3} c={c} />
        </group>
      );
    })}
  </>
);

export function shotCloser(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 40: {
      if (t < 1.59) {
        const u = t / 1.59;
        return { env: "bad", fov: 42, lightsAt: 0, cam: [-17 + 2 * u, 3.2, -1.5 + 2.5 * u], look: [0, 2.8, 0], actors: <Lineup T={T} /> };
      }
      if (t < 4.25) {
        // bầy Utahraptor chạy
        const x = 10 - 7 * (t - 1.59);
        const R = DINOS.utahraptor;
        return {
          env: "bad", fov: 42, lightsAt: x, cam: [x - 3, 1.5, 7], look: [x - 1, 1.3, 0],
          actors: (
            <>
              {([[0, 0], [2.6, -2.2], [3.4, 2.0]] as [number, number][]).map(([dx, dz], i) => (
                <group key={i} position={[x + dx, 0, dz]}><BlockTheropod t={T} spec={R} walk={1} period={0.6} phase={i * 1.7} /></group>
              ))}
            </>
          ),
        };
      }
      if (t < 5.53) {
        const x = 6 - 9 * (t - 4.25);
        return { env: "bad", fov: 44, lightsAt: x, cam: [x - 6, 1.0, 4], look: [x, 1.8, 0], actors: <group position={[x, 0, 0]}><BlockTheropod t={T} spec={DINOS.carnotaurus} walk={1} period={0.55} /></group> };
      }
      if (t < 8.85) {
        // Spinosaurus lội sông, thằn lằn bay lượn trên đầu
        return {
          env: "river", fov: 46, lightsAt: 0, cam: [-7, 1.8, 6], look: [0, 3.0, -8],
          actors: (
            <>
              <Flock T={T} c={[2, 9, -12]} R={7} />
              <group position={[1 - 0.6 * (t - 5.53), -0.9, -8]}><BlockTheropod t={T} spec={DINOS.spinosaurus} walk={0.6} /></group>
            </>
          ),
        };
      }
      if (t < 10.93) return faceShot("giganotosaurus", (t - 8.85) / 2.08, T);
      // T. rex: thứ cắn xuyên được xương
      const u = (t - 10.93) / 3.2;
      return { env: "bad", fov: 36, dim: 0.75, lightsAt: 0, cam: [RH[0] - 6.5 + 1.2 * u, RH[1] - 1.6, 5.2 - 0.8 * u], look: [RH[0] + 0.8, RH[1] - 0.2, 0], actors: rex(T, { roar: pulse(t, 12.3, 13.9) * 0.95, eyeI: 1.4 }) };
    }
    case 41: {
      if (t < 5.44) return { env: "bad", fov: 40, lightsAt: 7, cam: [6.5, 30, 0.3], look: [6.5, 0, -0.6], actors: <LengthRow T={T} k={ease((t - 0.3) / 1.2)} /> };
      // mũi, mắt, hàm, răng — cắt cận từng bộ phận
      const [nx] = extent(REX);
      if (t < 6.14) return { env: "bad", fov: 30, dim: 0.75, lightsAt: 0, cam: [nx - 2.6, RH[1] + 0.5, 2.6], look: [nx + 0.7, RH[1], 0], actors: rex(T) };
      if (t < 6.78) return { env: "bad", fov: 28, dim: 0.75, lightsAt: 0, cam: [RH[0] - 1.0, RH[1] + 0.7, 3.4], look: [RH[0] + 0.2, RH[1] + 0.3, 0], actors: rex(T, { eyeI: 1.8 }) };
      if (t < 7.44) return { env: "bad", fov: 34, dim: 0.75, lightsAt: 0, cam: [RH[0] - 0.8, RH[1] + 0.2, 5.4], look: [RH[0] - 0.5, RH[1] + 0.5, 0], actors: rex(T, { roar: pulse(t, 6.8, 7.6) * 0.9 }) };
      if (t < 8.46) return { env: "bad", fov: 30, dim: 0.75, lightsAt: 0, cam: [nx - 2.4, RH[1] + 0.1, 1.8], look: [RH[0] - 0.3, RH[1] - 0.1, 0], actors: rex(T, { roar: 0.85 }) };
      if (t < 9.74) {
        const u = (t - 8.46) / 1.28;
        return { env: "bad", fov: 40, lightsAt: 0, cam: [RH[0] - 4 - 5 * u, RH[1] - 1.0, 4 + 5 * u], look: [RH[0] + 2, RH[1] - 0.6, 0], actors: rex(T, { roar: pulse(t, 8.4, 9.7) * 0.95, eyeI: 1.4 }) };
      }
      const u = (t - 9.74) / 2.2;
      return { env: "bad", fov: 38, lightsAt: 40, cam: [40 - 2.4 + 0.6 * u, 2.5 - 0.4 * u, 3.6 - 0.6 * u], look: [40 - 0.4, 0.9, 0], actors: <group position={[40, 0, 0]}><TrikeFrill /></group> };
    }
    case 42: {
      if (t < 2.26) {
        const u = t / 2.26;
        return { env: "bad", fov: 44, fog: [10, 60], dim: 0.6, lightsAt: 0, cam: [-20, 4 + 6 * u, 2], look: [0, 2.5, 0], actors: <Lineup T={T} /> };
      }
      if (t < 8.9) return { env: "plate", plateX: 1000, dim: 0.25, fov: 40, cam: [1000, 3, 9], look: [1000, 1, 0], actors: null };
      // tập sau: những gã khổng lồ trên trời
      return {
        env: "bad", fov: 48, dim: 0.7, lightsAt: 0, cam: [-11, 1.0, 7], look: [0, 6.5, -2],
        actors: (
          <>
            <Flock T={T} c={[2, 11, -5]} R={8} n={6} />
            {rex(T, { roar: pulse(t, 10.2, 11.6) * 0.8 })}
          </>
        ),
      };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// ------------------------------------------------------------------ chữ trên màn hình
const RANK_ROWS: [number, string, string][] = [
  [1.59, "#5", "UTAHRAPTOR"],
  [4.25, "#4", "CARNOTAURUS"],
  [5.53, "#3", "SPINOSAURUS"],
  [8.85, "#2", "GIGANOTOSAURUS"],
  [10.93, "#1", "T. REX"],
];
// danh sách xếp hạng dồn dần bên trái (f tính từ beat 40, 1.59 s)
const RankList: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: "absolute", left: 90, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
    {RANK_ROWS.map(([a, r, n]) => {
      const k = interpolate(s, [a, a + 0.2], [0, 1], CLAMP);
      const top = r === "#1";
      return (
        <div key={r} style={{ opacity: k, transform: `translateX(${(1 - k) * -40}px)`, display: "flex", alignItems: "baseline", gap: 18, fontFamily: sans, fontWeight: 900, textShadow: "0 3px 12px rgba(0,0,0,0.9)" }}>
          <span style={{ fontSize: top ? 64 : 44, color: top ? "#FF5A3A" : "#E8B464", width: 90 }}>{r}</span>
          <span style={{ fontSize: top ? 64 : 40, color: "#FFF3DE", letterSpacing: 2 }}>{n}</span>
        </div>
      );
    })}
  </div>
);
const LengthKey: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 8], [0, 1], CLAMP);
  const rows: [string, string, string][] = [["SPINOSAURUS", "~14 m", "#E5533D"], ["GIGANOTOSAURUS", "~12–13 m", "#E5533D"], ["T. REX", "~12 m", "#F2D27A"]];
  return (
    <div style={{ position: "absolute", right: 110, bottom: 110, textAlign: "right", opacity: k, fontFamily: sans, fontWeight: 900, textShadow: "0 3px 12px rgba(0,0,0,0.9)" }}>
      {rows.map(([n, l, c]) => <div key={n} style={{ fontSize: 40, color: c, letterSpacing: 2 }}>{n} <span style={{ color: "#FFF3DE" }}>{l}</span></div>)}
    </div>
  );
};

// trục thời gian 140 triệu năm trước → nay (s = giây trong beat 42)
const TL: [string, number, number][] = [["UTAHRAPTOR", 135, 2.4], ["GIGANOTOSAURUS", 98, 2.6], ["SPINOSAURUS", 95, 2.8], ["CARNOTAURUS", 71, 3.0], ["T. REX", 67, 3.2]];
const px = (m: number) => 160 + ((140 - m) / 140) * 1600;
const Timeline: React.FC<{ s: number }> = ({ s }) => {
  const ax = interpolate(s, [2.3, 2.8], [0, 1], CLAMP);
  const br1 = interpolate(s, [3.6, 4.1], [0, 1], CLAMP);
  const br2 = interpolate(s, [6.0, 6.5], [0, 1], CLAMP);
  const you = interpolate(s, [7.9, 8.15], [0, 1], CLAMP);
  const Y = 560;
  const bracket = (a: number, b: number, k: number, label: string, c: string, up: boolean) => (
    <div style={{ position: "absolute", left: px(a), width: (px(b) - px(a)) * k, top: up ? Y - 210 : Y + 120, height: 0, borderTop: `5px solid ${c}`, opacity: k }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: up ? -64 : 14, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 44, color: c, whiteSpace: "nowrap", textShadow: "0 3px 12px rgba(0,0,0,0.9)" }}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 160, top: Y, width: 1600 * ax, height: 6, background: "#FFF3DE" }} />
      {[140, 100, 60, 20].map((m) => (
        <div key={m} style={{ position: "absolute", left: px(m) - 60, top: Y + 22, width: 120, textAlign: "center", fontFamily: mono, fontSize: 22, color: "#B8AE9C", opacity: ax }}>{m} MYA</div>
      ))}
      {TL.map(([n, m, a], i) => {
        const k = interpolate(s, [a, a + 0.2], [0, 1], CLAMP);
        const up = i % 2 === 0;
        return (
          <div key={n} style={{ position: "absolute", left: px(m), top: Y, opacity: k }}>
            <div style={{ position: "absolute", left: -11, top: -8, width: 22, height: 22, borderRadius: 11, background: n === "T. REX" ? "#FF5A3A" : "#E8B464" }} />
            <div style={{ position: "absolute", left: -2, top: up ? -70 : 18, width: 4, height: 52, background: "rgba(255,243,222,0.5)" }} />
            <div style={{ position: "absolute", left: -200, width: 400, top: up ? -112 : 74, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 28, color: "#FFF3DE", letterSpacing: 1 }}>{n}</div>
          </div>
        );
      })}
      {bracket(135, 67, br1, "~70 MILLION YEARS APART", "#E8B464", true)}
      {bracket(67, 0, br2, "66 MILLION YEARS", "#9FE0FF", false)}
      <div style={{ position: "absolute", left: px(0) - 80, top: Y - 90, width: 160, textAlign: "center", opacity: you, fontFamily: sans, fontWeight: 900, fontSize: 56, color: "#9FE0FF" }}>YOU</div>
      <div style={{ position: "absolute", left: px(0) - 12, top: Y - 9, width: 24, height: 24, borderRadius: 12, background: "#9FE0FF", opacity: you }} />
    </AbsoluteFill>
  );
};
const NextCard: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 8], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
      <div style={{ background: "rgba(12,12,14,0.82)", border: "3px solid #E8B464", borderRadius: 14, padding: "26px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 8, color: "#E8B464" }}>NEXT FILE</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 76, color: "#FFF3DE", letterSpacing: 3, marginTop: 10 }}>GIANTS OF THE SKY</div>
      </div>
    </div>
  );
};
const LightsOut: React.FC<{ f: number }> = ({ f }) => <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 14], [0, 1], CLAMP) }} />;

type Ov = [number, number, number, (f: number) => React.ReactNode];
export const OVERLAYS7: Ov[] = [
  [40, 0.19, 1.55, (f) => <Tag f={f} text="THE RANKING" pos="tc" />],
  [40, 1.59, 14.13, (f) => <RankList s={1.59 + f / 30} />],
  [41, 1.42, 5.4, (f) => <Tag f={f} text="NOT LENGTH" sub="IT LOSES THAT TO TWO OF THE OTHERS" pos="tc" />],
  [41, 1.42, 5.4, (f) => <LengthKey f={f} />],
  [41, 5.44, 6.12, (f) => <Tag f={f} text="NOSE" pos="c" />],
  [41, 6.14, 6.76, (f) => <Tag f={f} text="EYES" pos="c" />],
  [41, 6.78, 7.42, (f) => <Tag f={f} text="JAWS" pos="c" />],
  [41, 7.44, 8.44, (f) => <Tag f={f} text="TEETH" pos="c" />],
  [41, 8.46, 9.72, (f) => <Tag f={f} text="ONE JOB" sub="BITE THROUGH BONE" pos="tc" />],
  [41, 10.06, 11.9, (f) => <Tag f={f} text="THE FOSSILS SHOW IT" sub="BITTEN BONES · BONE-FILLED DUNG" pos="bl" />],
  [42, 0.1, 2.2, (f) => <Tag f={f} text="THESE FIVE NEVER MET" pos="tc" />],
  [42, 2.26, 8.88, (f) => <Timeline s={2.26 + f / 30} />],
  [42, 11.42, 12.96, (f) => <NextCard f={f} />],
  [42, 12.45, 12.96, (f) => <LightsOut f={f} />],
];
export const CHAPTER7: [number, number, string][] = [[40, 42, "THE RANKING"]];
