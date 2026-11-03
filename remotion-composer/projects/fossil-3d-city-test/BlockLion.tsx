// Sư tử khối vuông (kiểu minh hoạ, cố ý đơn giản): toàn hộp màu phẳng, đầu về -X, đất y = 0.
// Chuyển động thuần theo t: 4 chân đi bộ, đầu gật, đuôi vẫy, há miệng gầm trong khoảng [roarA, roarB].
import React from "react";

const C = {
  body: "#D9A055",
  belly: "#E8C48A",
  mane: "#8A4A1F",
  maneDark: "#6E3815",
  snout: "#F2DDB8",
  nose: "#3A2418",
  eye: "#1E1410",
  mouth: "#7A2E2A",
  paw: "#C98F48",
};

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number] }> = ({ p, s, c, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.85} flatShading />
  </mesh>
);

const TAU = Math.PI * 2;
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);

// một chân: xoay quanh hông/vai (đỉnh chân), cẳng dưới gập khi nhấc
const Leg: React.FC<{ x: number; z: number; ph: number; amp: number }> = ({ x, z, ph, amp }) => {
  const swing = -amp * Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph));
  return (
    <group position={[x, 0.9, z]} rotation={[0, 0, swing]}>
      <Box p={[0, -0.25, 0]} s={[0.24, 0.5, 0.22]} c={C.body} />
      <group position={[0, -0.5, 0]} rotation={[0, 0, 0.6 * lift * lift * Math.sign(amp || 1)]}>
        <Box p={[0, -0.18, 0]} s={[0.2, 0.36, 0.2]} c={C.body} />
        <Box p={[-0.04, -0.36, 0]} s={[0.28, 0.08, 0.24]} c={C.paw} />
      </group>
    </group>
  );
};

export const BlockLion: React.FC<{ t: number; walk?: number; roarA?: number; roarB?: number }> = ({ t, walk = 1, roarA = 99, roarB = 99 }) => {
  const ph = (TAU * t) / 1.2;
  const amp = 0.38 * walk;
  const roar = pulse(t, roarA, roarB);
  const bob = 0.025 * walk * Math.abs(Math.sin(ph));
  const headBob = 0.04 * walk * Math.sin(2 * ph) - 0.12 * roar;
  const tail = 0.35 * Math.sin((TAU * t) / 2.4);
  return (
    <group position={[0, bob, 0]}>
      {/* thân */}
      <Box p={[0, 1.05, 0]} s={[1.6, 0.62, 0.6]} c={C.body} />
      <Box p={[0, 0.78, 0]} s={[1.3, 0.1, 0.5]} c={C.belly} />
      {/* chân: trước (-X), sau (+X); thứ tự bước sau-trái, trước-trái, sau-phải, trước-phải */}
      <Leg x={-0.58} z={0.19} ph={ph + TAU * 0.25} amp={amp} />
      <Leg x={-0.58} z={-0.19} ph={ph + TAU * 0.75} amp={amp} />
      <Leg x={0.6} z={0.19} ph={ph} amp={amp} />
      <Leg x={0.6} z={-0.19} ph={ph + TAU * 0.5} amp={amp} />
      {/* đuôi + chùm lông */}
      <group position={[0.8, 1.22, 0]} rotation={[tail, 0, -0.9]}>
        <Box p={[0.32, 0, 0]} s={[0.64, 0.08, 0.08]} c={C.body} />
        <Box p={[0.68, 0, 0]} s={[0.16, 0.16, 0.16]} c={C.maneDark} />
      </group>
      {/* đầu + bờm */}
      <group position={[-0.85, 1.3, 0]} rotation={[0, 0, headBob]}>
        <Box p={[0.05, -0.02, 0]} s={[0.5, 0.92, 0.92]} c={C.mane} />
        <Box p={[0.12, 0.12, 0]} s={[0.36, 0.7, 1.02]} c={C.maneDark} />
        <Box p={[-0.2, 0.0, 0]} s={[0.4, 0.46, 0.5]} c={C.body} />
        {/* tai */}
        <Box p={[-0.05, 0.5, 0.26]} s={[0.12, 0.14, 0.14]} c={C.body} />
        <Box p={[-0.05, 0.5, -0.26]} s={[0.12, 0.14, 0.14]} c={C.body} />
        {/* mắt */}
        <Box p={[-0.41, 0.1, 0.13]} s={[0.03, 0.07, 0.07]} c={C.eye} />
        <Box p={[-0.41, 0.1, -0.13]} s={[0.03, 0.07, 0.07]} c={C.eye} />
        {/* mõm + mũi */}
        <Box p={[-0.5, -0.08, 0]} s={[0.22, 0.18, 0.3]} c={C.snout} />
        <Box p={[-0.615, -0.02, 0]} s={[0.03, 0.08, 0.12]} c={C.nose} />
        {/* hàm dưới: xoay quanh khớp hàm khi gầm */}
        <group position={[-0.32, -0.17, 0]} rotation={[0, 0, 0.55 * roar]}>
          <Box p={[-0.15, -0.04, 0]} s={[0.3, 0.08, 0.26]} c={C.snout} />
          <Box p={[-0.13, 0.005, 0]} s={[0.24, 0.02, 0.2]} c={C.mouth} />
        </group>
      </group>
    </group>
  );
};
