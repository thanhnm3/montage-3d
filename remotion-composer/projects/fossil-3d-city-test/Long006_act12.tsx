// Tập dài 006, ACT 1 (luật xếp hạng, beat 6-7) + ACT 2 (#5 Utahraptor, beat 8-14).
// Mốc giây (trong beat) lấy từ tts/episodes/fossil-mysteries/long/006/raw/words_all.json.
import React from "react";
import { interpolate } from "remotion";
import { BlockHuman, BlockTheropod, DINOS, V3 } from "./BlockAnimals";
import { CLAMP, REX, RANK, Shot, clamp01, ease, extent, faceShot, headOf, lerp, lerp3, mono, pulse, sans } from "./Long006_common";
import { ClawInStone, Dust, FossilSlab, Glint } from "./FossilProps";
import { Backyard, BlockBear, ClawFoot, Crane, FilmReel, IcePick, MeasureBar, QuickPit, Quarry, Ruler, SandBlock } from "./ActProps";

type Cut = [number, "whip" | "flash" | "cut"];
export const CUTS12: Record<number, Cut[]> = {
  6: [[0, "whip"], [3.43, "cut"], [6.27, "whip"], [8.05, "cut"]],
  7: [[0, "whip"], [2.09, "cut"], [3.43, "flash"], [4.03, "whip"], [7.19, "cut"]],
  8: [[0, "flash"], [3.37, "cut"], [6.01, "whip"], [11.83, "cut"]],
  9: [[0, "cut"], [1.56, "cut"], [4.74, "whip"], [10.4, "flash"]],
  10: [[0, "whip"], [3.28, "cut"]],
  11: [[0, "cut"], [3.35, "whip"], [6.97, "cut"], [8.57, "flash"], [12.41, "whip"]],
  12: [[0, "cut"], [3.14, "cut"], [5.14, "whip"]],
  13: [[0, "cut"], [4.42, "whip"]],
  14: [[0, "cut"], [2.75, "whip"], [6.63, "flash"]],
};
export const HITS12: Record<number, [number, number][]> = {
  6: [[4.79, 0.06], [6.39, 0.06], [8.49, 0.06]],
  7: [[3.43, 0.26], [2.91, 0.06]],
  8: [[0.07, 0.3], [4.0, 0.2], [12.0, 0.08]],
  9: [[5.3, 0.1], [10.4, 0.16]],
  10: [[1.92, 0.12]],
  11: [[7.7, 0.12], [8.6, 0.1]],
  12: [[3.9, 0.12], [7.92, 0.08], [8.36, 0.08], [8.98, 0.1]],
  13: [[5.6, 0.25]],
  14: [[1.0, 0.08], [6.63, 0.3]],
};

const UTAH = DINOS.utahraptor;
const UH = headOf(UTAH);
const UX = extent(UTAH);
const RX = extent(REX);
const utah = (T: number, o: { walk?: number; roar?: number; look?: number; phase?: number; eyeI?: number } = {}) => (
  <BlockTheropod t={T} spec={UTAH} walk={o.walk ?? 0} roar={o.roar ?? 0} look={o.look ?? 0} phase={o.phase ?? 0} eyeI={o.eyeI ?? 1} />
);

// răng cưa khổng lồ + sừng (vũ khí), xoay trên bục
const Weapons: React.FC<{ T: number }> = ({ T }) => (
  <group rotation={[0, T * 0.6, 0]}>
    <group position={[0.9, 0.35, 0]}><ClawFoot raise={1} scale={2.2} /></group>
    <group position={[-0.8, 0.3, 0.5]}>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0, 0.25 + i * 0.22, 0]} castShadow><boxGeometry args={[0.36 - i * 0.065, 0.24, 0.2 - i * 0.03]} /><meshStandardMaterial color={i === 4 ? "#F4ECD6" : "#E6DAB8"} flatShading /></mesh>)}
    </group>
    <group position={[-0.3, 0.3, -0.9]} rotation={[0, 0, 0.3]}>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 0.2 + i * 0.25, 0]} castShadow><boxGeometry args={[0.4 - i * 0.08, 0.26, 0.38 - i * 0.08]} /><meshStandardMaterial color="#A8987A" flatShading /></mesh>)}
    </group>
    <mesh position={[0, 0.15, 0]} receiveShadow><boxGeometry args={[3.4, 0.3, 3.0]} /><meshStandardMaterial color="#2A2622" flatShading /></mesh>
  </group>
);

// tia quét (beat 6, bằng chứng hoá thạch)
const ScanLine: React.FC<{ k: number }> = ({ k }) =>
  k <= 0 || k >= 1 ? null : (
    <mesh position={[-1.7 + 3.4 * k, 0.5, 0]}>
      <boxGeometry args={[0.025, 0.22, 2.2]} />
      <meshStandardMaterial color="#7FE0FF" emissive="#7FE0FF" emissiveIntensity={3} transparent opacity={0.55} />
    </mesh>
  );

export function shotAct12(beat: number, t: number, T: number): Shot {
  switch (beat) {
    case 6: {
      if (t < 3.43) {
        const k = t / 3.43;
        return {
          env: "bad", fov: 46, lightsAt: 0, cam: [-26 + 3 * k, 5.5 - 1.5 * k, 8 - 10 * k], look: [-2, 2.4, 0],
          actors: <>{RANK.map((sp, i) => <group key={sp} position={[0, 0, (i - 2) * 6.5]}><BlockTheropod t={T} spec={DINOS[sp]} walk={0} phase={i * 1.3} /></group>)}</>,
        };
      }
      if (t < 6.27) {
        const u = (t - 3.43) / 2.84;
        return { env: "plate", plateX: 0, fov: 38, cam: [-3.6 + 0.6 * u, 2.4, 3.6 - 0.6 * u], look: [0, 0.9, 0], actors: <Weapons T={T} /> };
      }
      if (t < 8.05) {
        // cỡ: người 1,8 m cạnh T. rex, thước dựng đứng mọc lên
        const k = ease((t - 6.4) / 0.9);
        return {
          env: "bad", fov: 40, cam: [-1.5, 2.6, 16], look: [-1.5, 2.6, 0],
          actors: (
            <>
              <BlockTheropod t={T} spec={REX} walk={0} />
              <group position={[-7.5, 0, 1]} rotation={[0, Math.PI, 0]}><BlockHuman t={T} /></group>
              <group position={[-6.7, 0, 1]}><MeasureBar len={1.8} k={k} vertical c="#9FE0FF" ticks={0.5} /></group>
              <group position={[2.5, 0, 1.5]}><MeasureBar len={4.6} k={k} vertical ticks={1} /></group>
            </>
          ),
        };
      }
      const u = (t - 8.05) / 2.9;
      return { env: "plate", plateX: 20, fov: 36, cam: [20 - 2.2 + 0.6 * u, 2.2, 2.8 - 0.4 * u], look: [20, 0.2, 0], actors: <group position={[20, 0, 0]}><FossilSlab /><ScanLine k={(t - 8.6) / 1.6} /></group> };
    }
    case 7: {
      if (t < 2.09) {
        // tốc độ: Carnotaurus chạy, máy chạy theo ngang
        const x = -9 * t;
        return { env: "bad", fov: 38, lightsAt: x, cam: [x - 2, 1.4, 9], look: [x - 1.5, 2.0, 0], actors: <group position={[x, 0, 0]}><BlockTheropod t={T} spec={DINOS.carnotaurus} walk={1} period={0.62} /></group> };
      }
      if (t < 4.03) {
        const u = (t - 2.09) / 1.94;
        return { env: "plate", plateX: 40, fov: 36, cam: [40 - 1.0 + 0.4 * u, 1.4, 4.0 - 0.5 * u], look: [40 + 0.6, 1.0, 0], actors: <group position={[40, 0, 0]}><FilmReel t={t} crackT={2.91} breakT={3.43} /></group> };
      }
      if (t < 7.19) {
        // top 2 đối mặt trong sương
        const u = (t - 4.03) / 3.16;
        return {
          env: "bad", fov: 36, fog: [12, 70], dim: 0.7, lightsAt: 0, cam: [0, 2.0 + 0.4 * u, 22 - 4 * u], look: [0, 3.2, 0],
          actors: (
            <>
              <group position={[-8.5, 0, 0]} rotation={[0, Math.PI, 0]}><BlockTheropod t={T} spec={DINOS.giganotosaurus} walk={0} roar={pulse(t, 5.0, 6.4) * 0.8} /></group>
              <group position={[8.5, 0, 0]}><BlockTheropod t={T} spec={REX} walk={0} roar={pulse(t, 5.4, 6.9) * 0.8} /></group>
            </>
          ),
        };
      }
      // mọi kích thước là ước tính: thước dọc thân T. rex, đầu thước dao động khi "experts disagree"
      const k = ease((t - 7.5) / 1.0);
      const wob = t > 11.3 ? 0.04 * Math.sin((t - 11.3) * 9) * Math.exp(-(t - 11.3) * 0.6) : 0;
      const u = (t - 7.19) / 7.43;
      return {
        env: "bad", fov: 40, cam: [-2 + 2 * u, 3.0, 19 - 2 * u], look: [-1, 2.0, 0],
        actors: (
          <>
            <BlockTheropod t={T} spec={REX} walk={0} />
            <group position={[RX[0], 0.08, 2.8]}><MeasureBar len={(RX[1] - RX[0]) * (1 + wob)} k={k} ticks={1} /></group>
            {t > 8.8 && (
              <mesh position={[RX[1] + 0.2, 0.3, 2.8]}>
                <boxGeometry args={[1.2, 0.5, 0.5]} />
                <meshStandardMaterial color="#F2D27A" emissive="#F2D27A" emissiveIntensity={1.5} transparent opacity={0.25 + 0.15 * Math.sin(t * 6)} depthWrite={false} />
              </mesh>
            )}
          </>
        ),
      };
    }
    case 8: {
      if (t < 3.37) {
        // Utahraptor rình bước ra khỏi sương, tiến về máy
        const x = 9 - 2.0 * t;
        return { env: "bad", fov: 34, fog: [8, 55], lightsAt: x, cam: [-9, 1.0, 2.6], look: [x - 1.5, 1.6, 0], actors: <group position={[x, 0, 0]}>{utah(T, { walk: 1 })}</group> };
      }
      if (t < 6.01) {
        // đi ngang qua chân T. rex, không hề chùn
        const u = t - 3.37;
        const rx = 4 - 0.8 * u, ux = 4.5 - 2.4 * u;
        return {
          env: "bad", fov: 50, lightsAt: 0, cam: [-6.5, 0.6, 10.5], look: [0.5, 2.6, -1],
          actors: (
            <>
              <group position={[rx, 0, -3.6]}><BlockTheropod t={T} spec={REX} walk={0.7} phase={1.2} /></group>
              <group position={[ux, 0, 1.6]}>{utah(T, { walk: 1, phase: 0.5 })}</group>
              <group position={[rx - 1, 0, -1.6]}><Dust t={t - 4.0} /></group>
            </>
          ),
        };
      }
      // thước dọc thân + người khối; gấu xám hiện ra ở "grizzly bear"
      const k = ease((t - 6.3) / 0.9);
      const bear = ease((t - 11.83) / 0.5);
      const u = (t - 6.01) / 6.8;
      return {
        env: "bad", fov: 38, cam: [-0.5, 1.8, 9.5 - 1 * u], look: [-0.3, 1.1, 0],
        actors: (
          <>
            {utah(T)}
            <group position={[-4.6, 0, 1.2]} rotation={[0, Math.PI, 0]}><BlockHuman t={T} /></group>
            <group position={[UX[0], 0.06, 1.4]}><MeasureBar len={UX[1] - UX[0]} k={k} ticks={1} /></group>
            <group position={[3.3, 0, 0.6]} rotation={[0, -0.3, 0]}><BlockBear t={T} k={bear} /></group>
          </>
        ),
      };
    }
    case 9: {
      if (t < 1.56) return faceShot("utahraptor", t / 1.56, T, 1);
      if (t < 4.74) {
        // nghiêng máy từ đầu xuống bàn chân
        const k = ease((t - 1.7) / 2.2);
        return { env: "bad", fov: 40, cam: [-2.6, lerp(2.2, 0.5, k), 3.6], look: lerp3([UH[0] + 0.3, UH[1], 0], [0.2, 0.25, 0.6], k), actors: utah(T, { look: 0.2 }) };
      }
      // cận vuốt liềm: dựng lên ở "curved claw", thước 22 cm, lắc vuốt + lấp lánh ở "sharp"
      const raise = ease((t - 4.9) / 0.6) - 0.15 * pulse(t, 9.4, 9.9) + 0.0;
      const u = (t - 4.74) / 6.58;
      return {
        env: "bad", fov: 32, lightsAt: 60, cam: [60 - 0.9 + 0.2 * u, 0.42, 1.25 - 0.2 * u], look: [60 - 0.2, 0.32, 0.1],
        actors: (
          <group position={[60, 0, 0]}>
            <ClawFoot raise={raise} />
            {t > 7.6 && <group position={[-0.45, 0.25, 0.26]} rotation={[0, 0, Math.PI / 2]} scale={[clamp01((t - 7.6) / 0.2), 1, 1]}><Ruler len={0.22} /></group>}
            <group position={[-0.3, 0.42, 0.2]}><Glint k={(t - 10.1) / 0.5} w={0.4} h={0.4} y={0} /></group>
          </group>
        ),
      };
    }
    case 10: {
      if (t < 3.28) {
        // vuốt lộ ra trong đá đỏ, bàn tay phủi bụi
        const brush = Math.sin(t * 9) * (t < 1.6 ? 1 : 0);
        return {
          env: "bad", pal: "canyon", fov: 34, lightsAt: 0, cam: [-1.3, 1.25, 1.9], look: [-0.1, 0.7, 0],
          actors: (
            <>
              <ClawInStone />
              <group position={[0.25 + 0.15 * brush, 0.95, 0.35]} rotation={[0, 0, 0.3]}>
                <mesh castShadow><boxGeometry args={[0.18, 0.08, 0.12]} /><meshStandardMaterial color="#E2B48C" flatShading /></mesh>
                <mesh position={[0.25, 0.05, 0]} castShadow><boxGeometry args={[0.4, 0.12, 0.13]} /><meshStandardMaterial color="#5A6A7A" flatShading /></mesh>
              </group>
            </>
          ),
        };
      }
      // ba người khai quật quanh khối đá, nhấc vuốt lên
      const lift = ease((t - 4.4) / 1.4);
      const u = (t - 3.28) / 3.7;
      return {
        env: "bad", pal: "canyon", fov: 40, lightsAt: 0, cam: [-5.5 + 1.5 * u, 2.2, 4.5], look: [0, 0.8, 0],
        actors: (
          <>
            <ClawInStone />
            <group position={[-0.1, 0.4 * lift, 0]}><mesh position={[-0.15, 0.8, 0]}><boxGeometry args={[0.12, 0.3, 0.08]} /><meshStandardMaterial color="#E6DAB8" flatShading /></mesh></group>
            <group position={[-1.1, 0, 0.6]} rotation={[0, 0.5, 0]}><BlockHuman t={T} wave={lift * 0.5} coat="#C4693A" /></group>
            <group position={[1.1, 0, 0.8]} rotation={[0, Math.PI - 0.5, 0]}><BlockHuman t={T} coat="#6A7A4A" /></group>
            <group position={[0.2, 0, -1.2]} rotation={[0, -Math.PI / 2, 0]}><BlockHuman t={T} coat="#4A6A8A" /></group>
          </>
        ),
      };
    }
    case 11: {
      const hookOf = (t0: number) => [0, 1.6 + 3.2 * ease((t - t0) / 3), 0] as V3;
      const quarry = (hook: V3, xray: number) => (
        <>
          <Quarry />
          <Crane base={[7, 0, -4]} hook={[hook[0], hook[1] + 1.65, hook[2]]} />
          <group position={hook}><SandBlock xray={xray} /></group>
        </>
      );
      if (t < 3.35) {
        const h = hookOf(0.2);
        return { env: "bad", pal: "canyon", fov: 40, lightsAt: 0, cam: [-5.5, 0.8, 4.2], look: [0, h[1] + 0.6, 0], actors: quarry([0, h[1] - 1.6, 0], 0) };
      }
      if (t < 6.97) {
        const u = (t - 3.35) / 3.62;
        const a = 0.6 + 0.6 * u;
        return { env: "bad", pal: "canyon", fov: 44, lightsAt: 0, cam: [Math.cos(a) * -24, 16 - 3 * u, Math.sin(a) * 24], look: [0, 2, 0], actors: quarry([0, 3.2, 0], 0) };
      }
      if (t < 12.41) {
        const xray = ease((t - 8.6) / 0.7);
        const u = (t - 6.97) / 5.44;
        return { env: "bad", pal: "canyon", fov: 38, lightsAt: 0, cam: [-5.4 + 1.6 * u, 3.6, 4.6 - 1.2 * u], look: [0, 4.0, 0], actors: quarry([0, 3.2, 0], xray) };
      }
      // tua ngược 135 triệu năm: hố cát lún ướt lúc chạng vạng
      const u = (t - 12.41) / 4.57;
      return { env: "bad", pal: "storm", fov: 42, fog: [10, 70], lightsAt: 0, cam: [-12 + 3 * u, 6 - 2.5 * u, 10 - 2 * u], look: [0, 0.5, 0], actors: <QuickPit /> };
    }
    case 12: {
      const sinkI = 1.25 * ease((t - 1.6) / 6);
      const prey = (
        <group position={[0.8, -sinkI, -0.5]} rotation={[0.08 * Math.sin(t * 5), 0.4, 0]}>
          <BlockTheropod t={T} spec={DINOS.iguanodon} walk={0.5 * (t < 5 ? 1 : 0)} roar={pulse(t, 1.8, 3.0) * 0.7 + pulse(t, 3.6, 4.8) * 0.6} eyeI={0.2} period={0.5} />
        </group>
      );
      if (t < 3.14) {
        const u = t / 3.14;
        return { env: "bad", pal: "storm", fov: 38, lightsAt: 0, cam: [-7 + u, 2.2, 6], look: [0, 0.8, 0], actors: <><QuickPit />{prey}</> };
      }
      if (t < 5.14) {
        // hai con raptor lao vào, lún theo
        const jump = (x0: number, z: number, t0: number, ph: number) => {
          const u = clamp01((t - t0) / 0.75);
          const sink = t > t0 + 0.75 ? 0.35 * (t - t0 - 0.75) : 0;
          return (
            <group key={z} position={[lerp(x0, -2.2, u), 2.2 * Math.sin(Math.PI * u) - sink, lerp(z, z * 0.4, u)]} rotation={[0, 0, -0.3 * Math.sin(Math.PI * u)]}>
              {utah(T, { walk: u < 1 ? 1 : 0.6, phase: ph, roar: pulse(t, t0 + 0.8, t0 + 1.6) * 0.7 })}
            </group>
          );
        };
        return { env: "bad", pal: "storm", fov: 42, lightsAt: 0, cam: [-4, 2.4, 9], look: [-1, 1.0, 0], actors: <><QuickPit />{prey}{jump(-8, 1.5, 3.15, 0)}{jump(-8.5, -1.8, 3.4, 1.4)}</> };
      }
      // khối đá đặc xương, cuốc chim gõ vào đâu cũng trúng
      const tap = Math.max(pulse(t, 7.7, 8.0), pulse(t, 8.15, 8.45), pulse(t, 8.8, 9.1));
      const u = (t - 5.14) / 5.1;
      return {
        env: "plate", plateX: 80, fov: 38, cam: [80 - 3.6 + 0.8 * u, 3.4, 3.2 - 0.4 * u], look: [80, 0.9, 0],
        actors: <group position={[80, 0, 0]}><SandBlock xray={0.8} /><group position={[0.4, 1.3, 0.4]}><IcePick tap={tap} /></group></group>,
      };
    }
    case 13: {
      if (t < 4.42) {
        // ba con theo đội hình bước ra từ sương ở sân sau nhà
        const x = 9 - 1.0 * t;
        return {
          env: "yard", fov: 36, lightsAt: x, cam: [-2.5, 1.0, 2.8], look: [x - 1, 1.4, 0],
          actors: <><Backyard t={t} fx={14} />{[[0, 0], [1.6, -2.2], [1.8, 2.2]].map(([dx, z], i) => <group key={i} position={[x + dx, 0, z]}>{utah(T, { walk: 1, phase: i * 0.7 })}</group>)}</>,
        };
      }
      // một bước nhảy qua hàng rào, ván gỗ văng
      const u = clamp01((t - 5.1) / 0.9);
      const x = t < 5.1 ? 5 - 3 * (t - 4.42) : lerp(2.95, -3.2, u);
      const y = 2.0 * Math.sin(Math.PI * u);
      return {
        env: "yard", fov: 46, lightsAt: 0, cam: [-8, 1.6, 6], look: [0, 1.8, 0],
        actors: (
          <>
            <group position={[x, y, 0]} rotation={[0, 0, -0.35 * Math.sin(Math.PI * u)]}>{utah(T, { walk: 1, roar: pulse(t, 5.2, 6.2) * 0.7 })}</group>
            <Backyard t={t} fx={0} brk={5.6} brkZ={0} />
          </>
        ),
      };
    }
    case 14: {
      if (t < 2.75) {
        const s = faceShot("utahraptor", t / 2.75, T, -1);
        return { ...s, env: "yard", actors: <><Backyard t={t} fx={12} />{utah(T, { roar: pulse(t, 0.8, 2.2) * 0.8 })}</> };
      }
      // lùi máy: bốn con nữa vây quanh
      const u = (t - 2.75) / 5.55;
      const R = 7;
      const pack = [0, 1, 2, 3, 4].map((i) => {
        const a = i * 1.257 + 0.55 * (t - 2.75);
        // quay mặt theo hướng chạy vòng (tiếp tuyến)
        return (
          <group key={i} position={[Math.cos(a) * R, 0, Math.sin(a) * R]} rotation={[0, -a, 0]}>
            {utah(T, { walk: 1, phase: i, roar: i === 2 ? pulse(t, 4.0, 5.2) * 0.7 : 0 })}
          </group>
        );
      });
      return { env: "yard", fov: 46, lightsAt: 0, cam: [lerp(-11, -15, ease(u * 1.4)), lerp(4, 8, ease(u * 1.4)), lerp(6, 11, ease(u * 1.4))], look: [0, 0.8, 0], actors: <><Backyard t={t} fx={12} />{pack}</> };
    }
  }
  return { env: "bad", cam: [-12, 3, 12], look: [0, 2, 0], actors: null };
}

// ------------------------------------------------------------------ chữ trên màn hình
export const Card: React.FC<{ f: number; n: string; text: string; i: number; out: number }> = ({ f, n, text, i, out }) => {
  const k = interpolate(f, [0, 7], [0, 1], CLAMP);
  return (
    <div style={{ position: "absolute", left: 90, top: 300 + i * 120, opacity: k * out, transform: `translateX(${(1 - k) * -60}px)`, display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ width: 78, height: 78, borderRadius: 10, background: "#E8B464", color: "#14110E", fontFamily: sans, fontWeight: 900, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 58, color: "#F4ECDC", letterSpacing: 4, textShadow: "0 3px 16px rgba(0,0,0,0.85)" }}>{text}</div>
    </div>
  );
};
export const Tag: React.FC<{ f: number; text: string; sub?: string; pos?: "bl" | "tc" | "br" | "c" }> = ({ f, text, sub, pos = "bl" }) => {
  const k = interpolate(f, [0, 6], [0, 1], CLAMP);
  const st: React.CSSProperties = pos === "bl" ? { left: 110, bottom: 120 } : pos === "br" ? { right: 110, bottom: 120, textAlign: "right" } : pos === "tc" ? { left: 0, right: 0, top: 110, textAlign: "center" } : { left: 0, right: 0, top: 420, textAlign: "center" };
  return (
    <div style={{ position: "absolute", ...st, opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 66, color: "#FFF3DE", letterSpacing: 4, textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>{text}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: 28, color: "#E8B464", letterSpacing: 5, marginTop: 6, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{sub}</div>}
    </div>
  );
};
export const RankSlam: React.FC<{ f: number; rank: string; name: string }> = ({ f, rank, name }) => {
  const sc = interpolate(f, [0, 5, 9], [2.4, 0.95, 1], CLAMP);
  const o = interpolate(f, [0, 3, 70, 80], [0, 1, 1, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: o, transform: `scale(${sc})` }}>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 210, color: "#E5533D", lineHeight: 1, WebkitTextStroke: "4px #120C08", paintOrder: "stroke fill" }}>{rank}</div>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 92, color: "#FFF3DE", letterSpacing: 10, textShadow: "0 4px 22px rgba(0,0,0,0.9)" }}>{name}</div>
    </div>
  );
};

// [beat, giây vào, giây ra, nội dung]
type Ov = [number, number, number, (f: number) => React.ReactNode];
export const OVERLAYS12: Ov[] = [
  [6, 0.3, 3.3, (f) => <Tag f={f} text="HOW WE RANKED THEM" pos="tc" />],
  [6, 4.79, 10.95, (f) => <Card f={f} n="1" text="WEAPONS" i={0} out={1} />],
  [6, 6.39, 10.95, (f) => <Card f={f} n="2" text="SIZE" i={1} out={1} />],
  [6, 8.49, 10.95, (f) => <Card f={f} n="3" text="FOSSIL EVIDENCE" i={2} out={1} />],
  [7, 0.2, 2.0, (f) => <Tag f={f} text="TIE BREAKERS" sub="SPEED · SENSES" pos="tc" />],
  [7, 2.3, 4.0, (f) => <Tag f={f} text="MOVIE FAME" sub="COUNTS FOR NOTHING" pos="br" />],
  [7, 4.5, 7.1, (f) => <Tag f={f} text="#2  vs  #1" pos="tc" />],
  [7, 8.8, 14.4, (f) => <Tag f={f} text="EVERY SIZE = ESTIMATE" sub="FROM REAL SPECIMENS" pos="bl" />],
  [8, 0.07, 2.9, (f) => <RankSlam f={f} rank="#5" name="UTAHRAPTOR" />],
  [8, 6.6, 11.7, (f) => <Tag f={f} text="~6 m / 20 ft" sub="SNOUT TO TAIL" pos="bl" />],
  [8, 11.9, 12.8, (f) => <Tag f={f} text="≈ A GRIZZLY BEAR" sub="WEIGHT" pos="br" />],
  [9, 7.7, 10.0, (f) => <Tag f={f} text="22 cm / 9 in" sub="SICKLE CLAW" pos="bl" />],
  [10, 1.92, 3.25, (f) => <Tag f={f} text="1991 · UTAH" sub="FIRST CLAW FOUND" pos="bl" />],
  [10, 4.9, 6.9, (f) => <Tag f={f} text="NAMED 1993" sub="KIRKLAND & COLLEAGUES" pos="bl" />],
  [11, 3.6, 6.9, (f) => <Tag f={f} text="STIKES QUARRY" sub="NEAR MOAB, UTAH" pos="bl" />],
  [11, 7.67, 8.55, (f) => <Tag f={f} text="9 TONS" pos="br" />],
  [11, 10.8, 12.4, (f) => <Tag f={f} text="ADULTS + YOUNG" sub="IN ONE BLOCK" pos="br" />],
  [11, 14.6, 16.9, (f) => <Tag f={f} text="~135 MILLION YEARS AGO" sub="A PIT OF QUICKSAND" pos="bl" />],
  [12, 1.5, 3.1, (f) => <Tag f={f} text="PREY STUCK FIRST" pos="bl" />],
  [12, 3.3, 5.1, (f) => <Tag f={f} text="RAPTORS FOLLOWED" sub="LEADING IDEA" pos="bl" />],
  [14, 6.63, 8.3, (f) => <RankSlam f={f} rank="#5" name="UTAHRAPTOR" />],
];
// nhãn góc chương (beat 8-14)
export const CHAPTER12: [number, number, string][] = [[8, 14, "#5 UTAHRAPTOR"]];
