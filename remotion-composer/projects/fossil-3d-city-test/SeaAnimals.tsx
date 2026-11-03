// Thú biển khối vuông cho Fossil Short 010 (size ladder quái vật biển), cùng kiểu BlockAnimals: hộp màu phẳng.
// Mỗi con dựng theo chiều dài 1 (đầu về -X, tâm thân ở gốc), rồi tự scale theo chiều dài thật L (mét).
// Thân = chuỗi đốt hộp có sóng bơi (ngang cho cá/bò sát, dọc cho cá voi); đầu và vây gắn vào khung của đốt
// (`At`) nên đi theo sóng. Lưng tối, bụng sáng (hai hộp mỗi đốt). Mọi chuyển động là hàm của t.
import React from "react";
import { Box, Glow } from "./BlockAnimals";

const TAU = Math.PI * 2;
type Prof = [number, number, number][]; // [u (0 = mũi, 1 = đuôi), cao, rộng] theo phần chiều dài
const prof = (pr: Prof, u: number, k: 1 | 2) => {
  if (u <= pr[0][0]) return pr[0][k];
  for (let i = 1; i < pr.length; i++)
    if (u <= pr[i][0]) {
      const a = pr[i - 1], b = pr[i];
      return a[k] + ((b[k] - a[k]) * (u - a[0])) / (b[0] - a[0]);
    }
  return pr[pr.length - 1][k];
};
export type Wave = { vert?: boolean; amp: number; freq: number; k?: number; phase?: number };

// lệch ngang + góc của thân tại u (sóng tăng dần từ u = 0.2 về đuôi)
function seg(w: Wave, u: number, t: number) {
  const k = w.k ?? 0.9;
  const r = Math.max(0, (u - 0.2) / 0.8);
  const ph = TAU * (w.freq * t + (w.phase ?? 0)) - TAU * k * u;
  const off = w.amp * r * r * Math.sin(ph);
  const d = w.amp * ((u > 0.2 ? (2 * r) / 0.8 : 0) * Math.sin(ph) - r * r * Math.cos(ph) * TAU * k);
  return { off, ang: Math.atan(d) };
}

const At: React.FC<{ w: Wave; u: number; t: number; children: React.ReactNode }> = ({ w, u, t, children }) => {
  const { off, ang } = seg(w, u, t);
  const x = -0.5 + u;
  return w.vert ? (
    <group position={[x, off, 0]} rotation={[0, 0, ang]}>{children}</group>
  ) : (
    <group position={[x, 0, off]} rotation={[0, -ang, 0]}>{children}</group>
  );
};

const Body: React.FC<{ w: Wave; t: number; pr: Prof; u0: number; n?: number; top: string; belly: string; band?: string }> = ({ w, t, pr, u0, n = 16, top, belly, band }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const u = u0 + ((i + 0.5) * (1 - u0)) / n;
      const h = prof(pr, u, 1), wd = prof(pr, u, 2), len = ((1 - u0) / n) * 1.12;
      return (
        <At key={i} w={w} u={u} t={t}>
          <Box p={[0, h * 0.12, 0]} s={[len, h * 0.76, wd]} c={band && i % 2 ? band : top} />
          <Box p={[0, -h * 0.3, 0]} s={[len * 0.98, h * 0.4, wd * 0.9]} c={belly} />
        </At>
      );
    })}
  </>
);

const Teeth: React.FC<{ x0: number; x1: number; y: number; z: number; n: number; h: number; down?: boolean; c?: string }> = ({ x0, x1, y, z, n, h, down, c = "#F1ECDD" }) => (
  <>
    {Array.from({ length: n }, (_, i) =>
      [1, -1].map((s) => <Box key={`${i}${s}`} p={[x0 + ((x1 - x0) * i) / (n - 1), y + (down ? -h / 2 : h / 2), s * z]} s={[h * 0.45, h, h * 0.4]} c={c} />),
    )}
  </>
);

// mắt đen + đốm sáng, hai bên
const Eyes: React.FC<{ x: number; y: number; z: number; s: number; ring?: string }> = ({ x, y, z, s, ring }) => (
  <>
    {[1, -1].map((k) => (
      <group key={k}>
        {ring && <Box p={[x, y, k * z]} s={[s * 1.7, s * 1.7, s * 0.25]} c={ring} />}
        <Box p={[x, y, k * (z + s * 0.12)]} s={[s, s, s * 0.25]} c="#0D0F10" />
        <Glow p={[x - s * 0.2, y + s * 0.22, k * (z + s * 0.2)]} s={[s * 0.25, s * 0.25, s * 0.1]} c="#FFFFFF" i={1.2} />
      </group>
    ))}
  </>
);
const MOUTH = "#5A1E22";

export type SeaProps = { t: number; L?: number; jaw?: number; swim?: number; phase?: number; dark?: boolean };
const shade = (dark: boolean | undefined, c: string) => (dark ? "#0C2533" : c);

// ---------------------------------------------------------------- cá mập (cá mập trắng 6 m / Megalodon 24 m qua `meg`)
export const BlockShark: React.FC<SeaProps & { meg?: boolean }> = ({ t, L, jaw = 0, swim = 1, phase = 0, meg, dark }) => {
  const len = L ?? (meg ? 24 : 6);
  const g = meg ? 1.18 : 1; // Megalodon bè hơn
  const top = shade(dark, meg ? "#4C5961" : "#6E7C86"), belly = shade(dark, meg ? "#D3D2C8" : "#E4E6E0");
  const w: Wave = { amp: 0.07 * swim, freq: meg ? 0.45 : 0.85, phase };
  const PR: Prof = [[0.1, 0.13 * g, 0.11 * g], [0.25, 0.2 * g, 0.17 * g], [0.45, 0.19 * g, 0.16 * g], [0.65, 0.13 * g, 0.1 * g], [0.82, 0.07 * g, 0.05 * g], [0.95, 0.04 * g, 0.03 * g], [1, 0.035 * g, 0.025 * g]];
  return (
    <group scale={len}>
      <Body w={w} t={t} pr={PR} u0={0.12} top={top} belly={belly} />
      <At w={w} u={0.06} t={t}>
        <group scale={[1, g, g]}>
          <Box p={[0, 0.03, 0]} s={[0.13, 0.1, 0.12]} c={top} />
          <Box p={[-0.09, 0.035, 0]} s={[0.07, 0.072, 0.088]} c={top} />
          <Box p={[-0.135, 0.035, 0]} s={[0.03, 0.05, 0.06]} c={top} />
          <Box p={[0.02, -0.017, 0]} s={[0.12, 0.028, 0.106]} c={belly} />
          <Box p={[-0.05, -0.014, 0]} s={[0.1, 0.02, 0.08]} c={MOUTH} />
          <Teeth x0={-0.125} x1={-0.025} y={-0.004} z={0.038} n={6} h={meg ? 0.02 : 0.016} down />
          <group position={[0.05, -0.022, 0]} rotation={[0, 0, 0.6 * jaw]}>
            <Box p={[-0.085, -0.012, 0]} s={[0.15, 0.026, 0.095]} c={belly} />
            <Teeth x0={-0.15} x1={-0.045} y={0.001} z={0.036} n={6} h={meg ? 0.016 : 0.013} />
          </group>
          {!dark && <Eyes x={-0.07} y={0.05} z={0.043} s={0.014} />}
        </group>
      </At>
      <At w={w} u={0.15} t={t}>
        {Array.from({ length: 5 }, (_, i) => <Box key={i} p={[-0.02 + i * 0.011, 0.015, 0]} s={[0.004, 0.07 * g, 0.136 * g]} c={shade(dark, "#3C454C")} />)}
      </At>
      <At w={w} u={0.38} t={t}>
        <group position={[0, 0.09 * g, 0]} rotation={[0, 0, -0.45]}>
          <Box p={[0, 0.06, 0]} s={[0.09, 0.13, 0.014]} c={top} />
        </group>
      </At>
      <At w={w} u={0.27} t={t}>
        {[1, -1].map((s) => (
          <group key={s} position={[0, -0.05 * g, s * 0.07 * g]} rotation={[s * 0.5, 0, -0.35]}>
            <Box p={[0.02, 0, s * 0.08]} s={[0.09, 0.012, 0.16]} c={top} />
          </group>
        ))}
      </At>
      <At w={w} u={0.78} t={t}>
        <Box p={[0, 0.05 * g, 0]} s={[0.04, 0.04, 0.008]} c={top} />
        <Box p={[0, -0.045 * g, 0]} s={[0.04, 0.035, 0.008]} c={top} />
      </At>
      <At w={w} u={1} t={t}>
        <group rotation={[0, 0, -0.75]}><Box p={[0, 0.11, 0]} s={[0.045, 0.24, 0.014]} c={top} /></group>
        <group rotation={[0, 0, 0.7]}><Box p={[0, -0.07, 0]} s={[0.04, 0.14, 0.014]} c={top} /></group>
      </At>
    </group>
  );
};

// ---------------------------------------------------------------- Liopleurodon (pliosaur ~6 m): đầu to, cổ ngắn, 4 chân chèo
export const BlockPliosaur: React.FC<SeaProps> = ({ t, L = 6, jaw = 0, swim = 1, phase = 0 }) => {
  const top = "#3E4A55", belly = "#CFC6B0";
  const w: Wave = { amp: 0.03 * swim, freq: 0.5, phase };
  const pa = 0.45 * swim * Math.sin(TAU * 0.5 * t + phase * TAU);
  const PR: Prof = [[0.22, 0.08, 0.09], [0.3, 0.12, 0.15], [0.45, 0.19, 0.25], [0.6, 0.19, 0.25], [0.75, 0.14, 0.17], [0.88, 0.07, 0.07], [1, 0.02, 0.02]];
  const flip = (u: number, a: number, s3: [number, number, number]) => (
    <At w={w} u={u} t={t}>
      {[1, -1].map((s) => (
        <group key={s} position={[0, -0.06, s * 0.1]} rotation={[s * (0.2 + a), 0, 0]}>
          <Box p={[0.03, 0, s * s3[2] * 0.5]} s={s3} c={top} r={[0, s * 0.35, 0]} />
        </group>
      ))}
    </At>
  );
  return (
    <group scale={L}>
      <Body w={w} t={t} pr={PR} u0={0.21} top={top} belly={belly} band="#36424C" />
      <At w={w} u={0.11} t={t}>
        <Box p={[0.02, 0.02, 0]} s={[0.18, 0.075, 0.11]} c={top} />
        <Box p={[-0.1, 0.015, 0]} s={[0.08, 0.055, 0.07]} c={top} />
        <Box p={[-0.15, 0.012, 0]} s={[0.03, 0.045, 0.06]} c={top} />
        <Box p={[-0.05, -0.024, 0]} s={[0.16, 0.02, 0.07]} c={MOUTH} />
        <Teeth x0={-0.16} x1={-0.02} y={-0.017} z={0.03} n={7} h={0.024} down />
        <group position={[0.1, -0.02, 0]} rotation={[0, 0, 0.55 * jaw]}>
          <Box p={[-0.12, -0.014, 0]} s={[0.25, 0.03, 0.085]} c={belly} />
          <Teeth x0={-0.24} x1={-0.07} y={0.002} z={0.032} n={7} h={0.02} />
        </group>
        <Eyes x={0.06} y={0.055} z={0.05} s={0.016} />
      </At>
      {flip(0.4, pa, [0.11, 0.016, 0.26])}
      {flip(0.72, -pa, [0.1, 0.015, 0.22])}
      <At w={w} u={1} t={t}><Box p={[0.01, 0, 0]} s={[0.04, 0.03, 0.006]} c={top} /></At>
    </group>
  );
};

// ---------------------------------------------------------------- Mosasaurus (~12 m): thằn lằn biển, đuôi có thuỳ cong xuống
export const BlockMosasaur: React.FC<SeaProps> = ({ t, L = 12, jaw = 0, swim = 1, phase = 0 }) => {
  const top = "#4D5E4A", belly = "#D6CFB4";
  const w: Wave = { amp: 0.09 * swim, freq: 0.55, phase };
  const PR: Prof = [[0.13, 0.065, 0.065], [0.2, 0.09, 0.085], [0.35, 0.1, 0.095], [0.5, 0.09, 0.085], [0.65, 0.065, 0.05], [0.85, 0.045, 0.025], [1, 0.03, 0.015]];
  const fa = 0.25 * swim * Math.sin(TAU * 0.55 * t + phase * TAU);
  const flip = (u: number) => (
    <At w={w} u={u} t={t}>
      {[1, -1].map((s) => (
        <group key={s} position={[0, -0.03, s * 0.04]} rotation={[s * (0.3 + fa), 0, 0]}>
          <Box p={[0.01, 0, s * 0.045]} s={[0.06, 0.008, 0.09]} c={top} r={[0, s * 0.4, 0]} />
        </group>
      ))}
    </At>
  );
  return (
    <group scale={L}>
      <Body w={w} t={t} pr={PR} u0={0.13} top={top} belly={belly} band="#43533F" />
      <At w={w} u={0.065} t={t}>
        <Box p={[0.01, 0.012, 0]} s={[0.11, 0.05, 0.07]} c={top} />
        <Box p={[-0.07, 0.008, 0]} s={[0.07, 0.035, 0.05]} c={top} />
        <Box p={[-0.11, 0.006, 0]} s={[0.025, 0.03, 0.04]} c={top} />
        <Box p={[-0.04, -0.015, 0]} s={[0.12, 0.014, 0.05]} c={MOUTH} />
        <Teeth x0={-0.115} x1={-0.01} y={-0.012} z={0.022} n={7} h={0.012} down />
        <group position={[0.06, -0.014, 0]} rotation={[0, 0, 0.55 * jaw]}>
          <Box p={[-0.07, -0.01, 0]} s={[0.14, 0.02, 0.055]} c={belly} />
          <Teeth x0={-0.13} x1={-0.03} y={0.0} z={0.02} n={7} h={0.011} />
        </group>
        <Eyes x={0.035} y={0.031} z={0.035} s={0.01} />
        {[1, -1].map((s) => <Box key={s} p={[0.035, 0.039, s * 0.032]} s={[0.03, 0.008, 0.01]} c="#2E3A2C" />)}
      </At>
      {flip(0.22)}
      {flip(0.5)}
      <At w={w} u={1} t={t}>
        <group rotation={[0, 0, 0.55]}><Box p={[0, -0.06, 0]} s={[0.035, 0.13, 0.008]} c={top} /></group>
        <group rotation={[0, 0, -0.6]}><Box p={[0, 0.025, 0]} s={[0.025, 0.05, 0.008]} c={top} /></group>
      </At>
    </group>
  );
};

// ---------------------------------------------------------------- Livyatan (~17 m): cá nhà táng sát thủ, đầu hộp, răng cả hai hàm
export const BlockLivyatan: React.FC<SeaProps> = ({ t, L = 17, jaw = 0, swim = 1, phase = 0 }) => {
  const top = "#3B3F45", belly = "#80858A";
  const w: Wave = { vert: true, amp: 0.05 * swim, freq: 0.3, phase };
  const PR: Prof = [[0.22, 0.16, 0.14], [0.35, 0.175, 0.155], [0.5, 0.16, 0.14], [0.65, 0.12, 0.1], [0.8, 0.07, 0.06], [0.92, 0.04, 0.035], [1, 0.03, 0.03]];
  return (
    <group scale={L}>
      <Body w={w} t={t} pr={PR} u0={0.21} top={top} belly={belly} band="#363A40" />
      <At w={w} u={0.105} t={t}>
        <Box p={[0, 0.015, 0]} s={[0.21, 0.14, 0.135]} c={top} />
        <Box p={[-0.1, 0.03, 0]} s={[0.03, 0.11, 0.12]} c={top} />
        <Box p={[-0.03, -0.068, 0]} s={[0.14, 0.02, 0.1]} c={MOUTH} />
        <Teeth x0={-0.1} x1={0.03} y={-0.055} z={0.05} n={6} h={0.022} down c="#EDE6D2" />
        <group position={[0.09, -0.066, 0]} rotation={[0, 0, 0.45 * jaw]}>
          <Box p={[-0.1, -0.015, 0]} s={[0.2, 0.035, 0.1]} c={belly} />
          <Teeth x0={-0.19} x1={-0.04} y={0.003} z={0.042} n={6} h={0.024} c="#EDE6D2" />
        </group>
        <Eyes x={0.07} y={-0.025} z={0.068} s={0.012} />
      </At>
      <At w={w} u={0.28} t={t}>
        {[1, -1].map((s) => (
          <group key={s} position={[0, -0.06, s * 0.075]} rotation={[s * 0.4, 0, 0]}>
            <Box p={[0.02, 0, s * 0.04]} s={[0.06, 0.01, 0.08]} c={top} r={[0, s * 0.4, 0]} />
          </group>
        ))}
      </At>
      <At w={w} u={0.66} t={t}><Box p={[0, 0.065, 0]} s={[0.05, 0.03, 0.03]} c={top} /></At>
      <At w={w} u={1} t={t}>
        {[1, -1].map((s) => <Box key={s} p={[0.03, 0, s * 0.07]} s={[0.06, 0.01, 0.13]} c={top} r={[0, s * 0.45, 0]} />)}
      </At>
    </group>
  );
};

// ---------------------------------------------------------------- Ichthyotitan (~25 m): thằn lằn cá khổng lồ, mõm dài, mắt to, đuôi lưỡi liềm
export const BlockIchthyosaur: React.FC<SeaProps> = ({ t, L = 25, jaw = 0, swim = 1, phase = 0 }) => {
  const top = "#55606E", belly = "#DAD5C7";
  const w: Wave = { amp: 0.05 * swim, freq: 0.5, phase };
  const PR: Prof = [[0.1, 0.06, 0.055], [0.18, 0.11, 0.1], [0.35, 0.14, 0.12], [0.55, 0.12, 0.1], [0.75, 0.07, 0.06], [0.9, 0.035, 0.03], [1, 0.025, 0.02]];
  const fl = 0.2 * swim * Math.sin(TAU * 0.5 * t + phase * TAU);
  const flip = (u: number, s3: [number, number, number], y: number) => (
    <At w={w} u={u} t={t}>
      {[1, -1].map((s) => (
        <group key={s} position={[0, y, s * 0.05]} rotation={[s * (0.55 + fl), 0, 0]}>
          <Box p={[0.03, 0, s * s3[2] * 0.5]} s={s3} c={top} r={[0, s * 0.4, 0]} />
        </group>
      ))}
    </At>
  );
  return (
    <group scale={L}>
      <Body w={w} t={t} pr={PR} u0={0.1} top={top} belly={belly} n={18} />
      <At w={w} u={0.05} t={t}>
        <Box p={[0.02, 0.01, 0]} s={[0.07, 0.07, 0.07]} c={top} />
        <Box p={[-0.06, 0.002, 0]} s={[0.09, 0.028, 0.032]} c={top} />
        <Box p={[-0.11, 0.0, 0]} s={[0.03, 0.022, 0.026]} c={top} />
        <Box p={[-0.05, -0.011, 0]} s={[0.12, 0.004, 0.034]} c="#2A3036" />
        <group position={[0.03, -0.013, 0]} rotation={[0, 0, 0.35 * jaw]}>
          <Box p={[-0.07, -0.004, 0]} s={[0.12, 0.012, 0.028]} c={belly} />
        </group>
        <Eyes x={0.025} y={0.02} z={0.036} s={0.022} ring="#D9C99A" />
      </At>
      <At w={w} u={0.42} t={t}>
        <group position={[0, 0.065, 0]} rotation={[0, 0, -0.5]}><Box p={[0, 0.04, 0]} s={[0.07, 0.09, 0.01]} c={top} /></group>
      </At>
      {flip(0.2, [0.07, 0.01, 0.14], -0.045)}
      {flip(0.5, [0.05, 0.01, 0.08], -0.04)}
      <At w={w} u={1} t={t}>
        <group rotation={[0, 0, -0.7]}><Box p={[0, 0.08, 0]} s={[0.035, 0.17, 0.01]} c={top} /></group>
        <group rotation={[0, 0, 0.7]}><Box p={[0, -0.08, 0]} s={[0.035, 0.17, 0.01]} c={top} /></group>
      </At>
    </group>
  );
};

// ---------------------------------------------------------------- cá voi xanh (~30 m): thân dài thon, đầu bẹt, nếp họng, vây đuôi ngang
export const BlockBlueWhale: React.FC<SeaProps & { flick?: number }> = ({ t, L = 30, swim = 1, phase = 0, dark, flick = 0 }) => {
  const top = shade(dark, "#5E7A98"), belly = shade(dark, "#A4B6C8");
  const w: Wave = { vert: true, amp: 0.035 * swim + 0.06 * flick, freq: 0.18 + 0.3 * flick, phase };
  const PR: Prof = [[0.0, 0.05, 0.07], [0.06, 0.09, 0.12], [0.15, 0.115, 0.14], [0.3, 0.13, 0.14], [0.5, 0.12, 0.12], [0.68, 0.09, 0.08], [0.84, 0.05, 0.04], [0.94, 0.032, 0.028], [1, 0.028, 0.024]];
  return (
    <group scale={L}>
      <Body w={w} t={t} pr={PR} u0={0} n={22} top={top} belly={belly} band={dark ? undefined : "#57718E"} />
      <At w={w} u={0.06} t={t}><Box p={[0.01, -0.022, 0]} s={[0.12, 0.004, 0.124]} c={shade(dark, "#2B3A4A")} /></At>
      <At w={w} u={0.12} t={t}><Box p={[0, 0.058, 0]} s={[0.02, 0.012, 0.03]} c={shade(dark, "#4A6280")} /></At>
      {!dark && <At w={w} u={0.1} t={t}><Eyes x={0} y={-0.02} z={0.07} s={0.008} /></At>}
      <At w={w} u={0.18} t={t}>
        {Array.from({ length: 6 }, (_, j) => <Box key={j} p={[0, -0.064, -0.05 + j * 0.02]} s={[0.3, 0.004, 0.006]} c={shade(dark, "#7C8C9C")} />)}
      </At>
      <At w={w} u={0.27} t={t}>
        {[1, -1].map((s) => (
          <group key={s} position={[0, -0.04, s * 0.065]} rotation={[s * 0.5, 0, 0]}>
            <Box p={[0.03, 0, s * 0.09]} s={[0.05, 0.008, 0.18]} c={top} r={[0, s * 0.35, 0]} />
          </group>
        ))}
      </At>
      <At w={w} u={0.76} t={t}>
        <group rotation={[0, 0, -0.6]}><Box p={[0, 0.045, 0]} s={[0.025, 0.02, 0.008]} c={top} /></group>
      </At>
      <At w={w} u={1} t={t}>
        {[1, -1].map((s) => <Box key={s} p={[0.025, 0, s * 0.09]} s={[0.05, 0.008, 0.18]} c={top} r={[0, s * 0.5, 0]} />)}
      </At>
    </group>
  );
};

// ---------------------------------------------------------------- thợ lặn 1,8 m (đứng, chân ở y = 0, mặt hướng -X)
export const BlockDiver: React.FC<{ t: number; kick?: number; wave?: number }> = ({ t, kick = 0, wave = 0 }) => {
  const k = 0.35 * kick * Math.sin(TAU * 1.2 * t);
  const suit = "#1F2830", acc = "#E8B23A";
  return (
    <group>
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0.95, s * 0.1]} rotation={[0, 0, s * k]}>
          <Box p={[0, -0.45, 0]} s={[0.16, 0.9, 0.16]} c={suit} />
          <Box p={[-0.18, -0.92, 0]} s={[0.5, 0.03, 0.2]} c={acc} />
        </group>
      ))}
      <Box p={[0, 1.25, 0]} s={[0.3, 0.65, 0.42]} c={suit} />
      <Box p={[-0.152, 1.25, 0]} s={[0.01, 0.6, 0.07]} c={acc} />
      <Box p={[0.25, 1.3, 0]} s={[0.2, 0.6, 0.2]} c={acc} />
      <Box p={[0.25, 1.65, 0]} s={[0.06, 0.1, 0.06]} c="#9AA2A8" />
      {[1, -1].map((s) => (
        <group key={s} position={[0, 1.52, s * 0.28]} rotation={[s === 1 ? -2.6 * wave : 0, 0, 0.15]}>
          <Box p={[0, -0.3, 0]} s={[0.12, 0.6, 0.12]} c={suit} />
          <Box p={[0, -0.64, 0]} s={[0.1, 0.1, 0.1]} c="#2A2A2A" />
        </group>
      ))}
      <Box p={[0, 1.72, 0]} s={[0.24, 0.26, 0.24]} c={suit} />
      <Box p={[-0.121, 1.71, 0]} s={[0.01, 0.2, 0.18]} c="#E2B48C" />
      <Glow p={[-0.13, 1.76, 0]} s={[0.02, 0.09, 0.2]} c="#7FD3E8" i={0.8} />
      <Box p={[-0.15, 1.64, 0]} s={[0.06, 0.06, 0.06]} c="#333A40" />
    </group>
  );
};

// ---------------------------------------------------------------- răng Livyatan 36 cm (đứng trên bàn, chân ở y = 0)
export const BigTooth: React.FC<{ h?: number }> = ({ h = 0.36 }) => (
  <group>
    {Array.from({ length: 8 }, (_, i) => {
      const u = i / 8, wd = 0.075 * (1 - 0.75 * u) + 0.012;
      return <Box key={i} p={[0.03 * u * u, h * (u + 0.0625), 0]} s={[wd, h / 8 + 0.004, wd * 0.9]} c={i < 3 ? "#C8B48C" : "#EDE4CC"} />;
    })}
  </group>
);

// cẳng tay khối đứng từ khuỷu (chân ở y = 0): cẳng tay ~26 cm + nắm tay
export const Forearm: React.FC<{ len?: number }> = ({ len = 0.26 }) => (
  <group>
    <Box p={[0, 0.03, 0]} s={[0.08, 0.06, 0.08]} c="#1F2830" />
    <Box p={[0, len / 2, 0]} s={[0.065, len, 0.06]} c="#E2B48C" />
    <Box p={[0, len - 0.01, 0]} s={[0.072, 0.018, 0.068]} c="#E8B23A" />
    <Box p={[0, len + 0.045, 0]} s={[0.08, 0.09, 0.07]} c="#E2B48C" />
  </group>
);

// mảnh xương hàm Ichthyotitan (~0,5 m)
export const JawBone: React.FC = () => (
  <group>
    <Box p={[0, 0, 0]} s={[0.5, 0.07, 0.11]} c="#B9A07A" />
    <Box p={[-0.2, 0.035, 0]} s={[0.12, 0.05, 0.1]} c="#A88E68" />
    <Box p={[0.16, -0.02, 0.01]} s={[0.16, 0.05, 0.08]} c="#C8B08A" />
  </group>
);
