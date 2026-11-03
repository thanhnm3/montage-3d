// Đạo cụ khối cho ACT 6 tập dài 006 (#1 T. rex): bộ xương Sue dựng trong bảo tàng, sọ mẫu cắn cảm biến lực,
// răng dày như quả chuối, chim mặt đất, khúc xương bị cắn nứt rồi vỡ, phân hoá thạch (coprolite) soi xuyên thấu,
// bệ cân xe. Đất y = 0, đơn vị mét, đầu hướng -X; chuyển động là hàm của t.
import React from "react";
import { Box, Glow, V3 } from "./BlockAnimals";
import { Piece, Shatter } from "./ActProps";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const BONE = "#D9C8A2", BONE_D = "#B29C74";

// ---------------------------------------------------------------- bộ xương T. rex dựng đứng (~12,5 m, đầu hướng -X)
const MOUNT = (() => {
  const out: { p: V3; s: V3; r?: V3; c: string }[] = [];
  // đuôi: 18 đốt hạ dần, nhỏ dần
  for (let i = 0; i < 18; i++) {
    const k = i / 17;
    out.push({ p: [1.0 + i * 0.34, 3.45 - 1.1 * k * k, 0], s: [0.3, 0.42 * (1 - 0.75 * k), 0.3 * (1 - 0.6 * k)], c: BONE });
    if (i < 12) out.push({ p: [1.0 + i * 0.34, 3.45 - 1.1 * k * k + 0.32 * (1 - k), 0], s: [0.08, 0.3 * (1 - k), 0.08], c: BONE_D });
  }
  // thân: đốt sống lưng + xương sườn hai bên
  for (let i = 0; i < 10; i++) {
    const x = 0.8 - i * 0.36, y = 3.55 + 0.03 * i;
    out.push({ p: [x, y, 0], s: [0.32, 0.36, 0.3], c: BONE });
    out.push({ p: [x, y + 0.34, 0], s: [0.08, 0.4, 0.08], c: BONE_D });
    if (i > 1 && i < 9) {
      const h = 1.5 - Math.abs(i - 5) * 0.16;
      for (const z of [1, -1]) out.push({ p: [x, y - h / 2, z * 0.48], s: [0.07, h, 0.06], r: [z * 0.18, 0, 0], c: BONE });
    }
  }
  // cổ cong lên tới sọ
  for (let i = 0; i < 5; i++) out.push({ p: [-2.95 - i * 0.28, 3.85 + i * 0.12, 0], s: [0.28, 0.32, 0.28], c: BONE });
  // chậu hông, chân, bàn chân
  out.push({ p: [0.55, 3.25, 0], s: [1.5, 0.75, 0.32], c: BONE });
  for (const z of [1, -1]) {
    out.push({ p: [0.7, 2.35, z * 0.42], s: [0.34, 1.55, 0.34], r: [0, 0, 0.28], c: BONE });
    out.push({ p: [0.55, 0.95, z * 0.42], s: [0.26, 1.5, 0.26], r: [0, 0, -0.22], c: BONE });
    out.push({ p: [0.2, 0.09, z * 0.42], s: [1.1, 0.16, 0.42], c: BONE_D });
    out.push({ p: [-2.25, 3.05, z * 0.5], s: [0.5, 0.12, 0.12], r: [0, 0, 0.5], c: BONE });
  }
  return out;
})();

export const RexMount: React.FC<{ jaw?: number }> = ({ jaw = 0.15 }) => (
  <group>
    {MOUNT.map((b, i) => <Box key={i} p={b.p} s={b.s} r={b.r} c={b.c} />)}
    {/* sọ + hàm dưới */}
    <group position={[-4.3, 4.35, 0]}>
      <Box p={[-0.55, 0.1, 0]} s={[1.5, 0.78, 0.74]} c={BONE} />
      <Box p={[-1.0, 0.25, 0.38]} s={[0.36, 0.3, 0.02]} c="#2A241C" />
      <Box p={[-1.0, 0.25, -0.38]} s={[0.36, 0.3, 0.02]} c="#2A241C" />
      <Box p={[-0.35, 0.3, 0.38]} s={[0.24, 0.22, 0.02]} c="#2A241C" />
      <Box p={[-0.35, 0.3, -0.38]} s={[0.24, 0.22, 0.02]} c="#2A241C" />
      {Array.from({ length: 6 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-1.15 + i * 0.18, -0.38, z * 0.3]} s={[0.07, 0.2, 0.07]} c="#F4ECD8" />))}
      <group position={[0.05, -0.3, 0]} rotation={[0, 0, jaw]}>
        <Box p={[-0.7, -0.08, 0]} s={[1.45, 0.24, 0.62]} c={BONE_D} />
      </group>
    </group>
    {/* cột đỡ */}
    {[0.55, -1.8, 3.6].map((x) => <Box key={x} p={[x, 1.7, 0]} s={[0.06, 3.4, 0.06]} c="#2A2A2E" />)}
  </group>
);

// ---------------------------------------------------------------- sọ mẫu trong phòng thí nghiệm; bite 0 = há, 1 = ngậm
export const RexSkullModel: React.FC<{ bite: number; c?: string }> = ({ bite, c = BONE }) => {
  const open = 0.55 * (1 - bite) + 0.06;
  return (
    <group>
      <group rotation={[0, 0, -open * 0.35]}>
        <Box p={[-0.75, 0.5, 0]} s={[1.5, 0.75, 0.78]} c={c} />
        <Box p={[-1.75, 0.38, 0]} s={[0.7, 0.5, 0.6]} c={c} />
        <Box p={[-0.45, 0.72, 0.4]} s={[0.3, 0.26, 0.02]} c="#2A241C" />
        <Box p={[-0.45, 0.72, -0.4]} s={[0.3, 0.26, 0.02]} c="#2A241C" />
        {Array.from({ length: 8 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-2.0 + i * 0.22, 0.03, z * 0.27]} s={[0.09, 0.26, 0.09]} c="#F4ECD8" />))}
      </group>
      <group position={[0, 0.12, 0]} rotation={[0, 0, open]}>
        <Box p={[-1.15, -0.08, 0]} s={[2.3, 0.26, 0.6]} c={BONE_D} />
        {Array.from({ length: 7 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-1.9 + i * 0.22, 0.12, z * 0.23]} s={[0.08, 0.18, 0.08]} c="#F4ECD8" />))}
      </group>
    </group>
  );
};

// cảm biến lực kẹp giữa hai hàm; hot 0..1 làm đèn đỏ sáng lên
export const SensorPad: React.FC<{ hot: number }> = ({ hot }) => (
  <group>
    <Box p={[0, 0, 0]} s={[0.5, 0.12, 0.7]} c="#8A9098" />
    <Glow p={[0, 0.07, 0]} s={[0.3, 0.02, 0.4]} c="#FF3A1A" i={0.3 + 4 * hot} />
    <Box p={[0.9, -0.02, 0]} s={[1.4, 0.04, 0.04]} c="#1A1A1A" />
  </group>
);

// ---------------------------------------------------------------- răng T. rex (dày như quả chuối) + quả chuối
export const RexTooth: React.FC<{ tip?: number }> = ({ tip = 0 }) => (
  <group>
    {Array.from({ length: 10 }, (_, i) => {
      const k = i / 9;
      const w = 0.62 * (1 - 0.7 * k * k);
      return <Box key={i} p={[0.35 * k * k, 0.2 + i * 0.24, 0]} s={[w, 0.25, w * 0.9]} r={[0, 0, -0.25 * k]} c={i < 3 ? "#A88C66" : "#EFE4C8"} />;
    })}
    {tip > 0 && <Glow p={[0.35, 2.42, 0]} s={[0.14, 0.14, 0.14]} c="#FF4A2A" i={1 + 6 * tip} />}
  </group>
);
export const Banana: React.FC = () => (
  <group>
    {Array.from({ length: 9 }, (_, i) => {
      const a = -0.9 + (1.8 * i) / 8;
      return <Box key={i} p={[Math.sin(a) * 1.2, 1.25 - Math.cos(a) * 1.0, 0]} s={[0.28, 0.46, 0.46]} r={[0, 0, a]} c={i === 0 || i === 8 ? "#5A4020" : "#E8C53A"} />;
    })}
  </group>
);

// ---------------------------------------------------------------- chim mặt đất (họ hàng còn sống), cao ~1 m
export const BlockBird: React.FC<{ t: number; phase?: number }> = ({ t, phase = 0 }) => {
  const peck = Math.max(0, Math.sin(t * 2.2 + phase)) ** 6;
  return (
    <group>
      {[1, -1].map((z) => <Box key={z} p={[0.05, 0.25, z * 0.1]} s={[0.05, 0.5, 0.05]} c="#D89A3A" />)}
      <Box p={[0.05, 0.62, 0]} s={[0.6, 0.38, 0.36]} c="#7A5A3A" />
      <Box p={[0.4, 0.74, 0]} s={[0.3, 0.2, 0.3]} c="#5A4028" />
      <group position={[-0.2, 0.75, 0]} rotation={[0, 0, peck * 0.9]}>
        <Box p={[-0.05, 0.18, 0]} s={[0.1, 0.34, 0.1]} c="#7A5A3A" />
        <Box p={[-0.1, 0.38, 0]} s={[0.2, 0.16, 0.16]} c="#8A6A48" />
        <Box p={[-0.25, 0.36, 0]} s={[0.12, 0.05, 0.06]} c="#E8A43A" />
        <Box p={[-0.16, 0.42, 0.08]} s={[0.03, 0.03, 0.01]} c="#111" />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- khúc xương lớn: crack 0..1 nứt dần, vỡ ở t0
const BIG_BONE: Piece[] = (() => {
  const out: Piece[] = [];
  for (let i = 0; i < 10; i++) for (const y of [0.35, 0.7]) out.push({ p: [-1.3 + i * 0.29, y, 0], s: [0.28, 0.34, 0.45], c: i % 2 ? BONE : "#E6D7B2" });
  for (const x of [-1.6, 1.6]) for (const y of [0.25, 0.8]) for (const z of [-0.2, 0.2]) out.push({ p: [x, y, z], s: [0.38, 0.38, 0.38], c: BONE });
  return out;
})();
const CRACKS = (() => {
  const r = rng(61);
  return Array.from({ length: 8 }, (_, i) => ({ x: (r() - 0.5) * 0.9, rz: (r() - 0.5) * 1.4, h: 0.25 + 0.3 * r(), i }));
})();
export const BigBone: React.FC<{ t: number; t0: number; crack: number; floor?: number }> = ({ t, t0, crack, floor = 0 }) =>
  t >= t0 ? (
    <Shatter t={t} t0={t0} pieces={BIG_BONE} force={3.2} seed={29} floor={floor} />
  ) : (
    <group>
      <Box p={[0, 0.52, 0]} s={[2.9, 0.62, 0.45]} c={BONE} />
      {[-1.6, 1.6].map((x) => <Box key={x} p={[x, 0.52, 0]} s={[0.6, 1.0, 0.8]} c={BONE} />)}
      {CRACKS.filter((c) => c.i < Math.floor(crack * 8.99)).map((c) => (
        <Box key={c.i} p={[c.x, 0.62, 0.23]} s={[0.035, c.h, 0.02]} r={[0, 0, c.rz]} c="#2A2018" />
      ))}
    </group>
  );

// ---------------------------------------------------------------- phân hoá thạch: 44 cm phóng to 10x; xray soi thấy mảnh xương
const COPRO = (() => {
  const r = rng(77);
  return Array.from({ length: 7 }, (_, i) => ({ p: [-1.9 + i * 0.63, 0.5 + 0.08 * (r() - 0.5), 0] as V3, s: [0.85, 0.7 + 0.25 * r(), 0.75 + 0.2 * r()] as V3, rz: (r() - 0.5) * 0.4 }));
})();
const CHIPS = (() => {
  const r = rng(83);
  return Array.from({ length: 24 }, () => ({ p: [(r() - 0.5) * 3.8, 0.3 + 0.45 * r(), (r() - 0.5) * 0.5] as V3, s: [0.08 + 0.12 * r(), 0.05 + 0.06 * r(), 0.06 + 0.08 * r()] as V3, rz: r() * 3 }));
})();
export const Coprolite: React.FC<{ xray: number }> = ({ xray }) => (
  <group>
    {COPRO.map((q, i) => (
      <mesh key={i} position={q.p} rotation={[0, 0, q.rz]} castShadow={xray < 0.5} receiveShadow>
        <boxGeometry args={q.s} />
        <meshStandardMaterial color={i % 2 ? "#6E5238" : "#5E4630"} roughness={0.95} flatShading transparent opacity={1 - 0.8 * xray} depthWrite={xray < 0.5} />
      </mesh>
    ))}
    {xray > 0.05 && CHIPS.map((c, i) => <group key={i} rotation={[0, 0, 0]}><Glow p={c.p} s={c.s} c="#F4E6C2" i={0.4 + 1.8 * xray} /></group>)}
  </group>
);

// bệ cân phẳng (cho ba xe rơi xuống)
export const WeighPad: React.FC = () => (
  <group>
    <Box p={[0, 0.15, 0]} s={[6, 0.3, 3]} c="#3A3E44" />
    <Box p={[0, 0.31, 0]} s={[5.6, 0.02, 2.6]} c="#5A6068" />
  </group>
);
