// Đạo cụ khối cho ACT 5 tập dài 006 (#2 Giganotosaurus): vương miện, xe địa hình, xương đùi lộ trên cát, xe buýt,
// sọ so với người, răng lưỡi dao răng cưa vs răng nhọn, khủng long cổ dài (titanosaur), bãi đỗ xe + xe giao hàng,
// bộ xương thiếu khối, cân thăng bằng. Đất y = 0, đơn vị mét, đầu con vật hướng -X; chuyển động là hàm của t.
import React from "react";
import { Box, Glow, V3 } from "./BlockAnimals";
import { BlockCar, Lamppost } from "./CityProps";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const TAU = Math.PI * 2;

export const Crown: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <group>
    <Box p={[0, 0.12, 0]} s={[0.9, 0.24, 0.9]} c="#C9A227" />
    {[[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38], [0, -0.42], [0, 0.42], [-0.42, 0], [0.42, 0]].map(([x, z], i) => <Box key={i} p={[x, 0.36, z]} s={[0.14, 0.26, 0.14]} c="#D8B23A" />)}
    {[[0, -0.46], [0, 0.46]].map(([x, z], i) => <Glow key={i} p={[x, 0.14, z]} s={[0.14, 0.12, 0.04]} c="#E5533D" i={1.5 * glow} />)}
    <pointLight position={[0, 0.6, 0]} intensity={6 * glow} distance={5} color="#FFD27A" />
  </group>
);

// xe địa hình khối (~3 m), đầu xe -X, có người lái
export const DuneBuggy: React.FC<{ t: number; v?: number }> = ({ t, v = 0 }) => {
  const spin = -t * v * 3;
  return (
    <group>
      <Box p={[0, 0.7, 0]} s={[2.8, 0.35, 1.4]} c="#D8742A" />
      <Box p={[-1.1, 0.95, 0]} s={[0.6, 0.3, 1.3]} c="#C8642A" />
      {[[-0.4, 0.62], [-0.4, -0.62], [0.9, 0.62], [0.9, -0.62]].map(([x, z], i) => <Box key={i} p={[x, 1.35, z]} s={[0.08, 1.0, 0.08]} c="#2A2A2A" />)}
      <Box p={[0.25, 1.85, 0]} s={[1.4, 0.08, 1.32]} c="#2A2A2A" />
      {[[-1.1, 0.8], [-1.1, -0.8], [1.0, 0.8], [1.0, -0.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0.42, z]} rotation={[0, 0, spin]}>
          <Box p={[0, 0, 0]} s={[0.84, 0.84, 0.36]} c="#161616" />
        </group>
      ))}
      <group position={[0.15, 0.85, 0]}>
        <Box p={[0, 0.35, 0]} s={[0.3, 0.6, 0.42]} c="#4A6A8A" />
        <Box p={[0, 0.8, 0]} s={[0.24, 0.26, 0.22]} c="#E2B48C" />
        <Box p={[0, 0.96, 0]} s={[0.34, 0.06, 0.34]} c="#E8E0D0" />
      </group>
      <Glow p={[-1.42, 0.8, 0.45]} s={[0.04, 0.14, 0.24]} c="#FFF2C8" i={2} />
      <Glow p={[-1.42, 0.8, -0.45]} s={[0.04, 0.14, 0.24]} c="#FFF2C8" i={2} />
    </group>
  );
};

// xương đùi khổng lồ (~1,6 m) trồi một nửa khỏi cát
export const LegBone: React.FC<{ glint?: number }> = ({ glint = 0 }) => (
  <group rotation={[0, 0, 0.35]}>
    <Box p={[0, 0, 0]} s={[1.3, 0.24, 0.24]} c="#E6DAB8" />
    <Box p={[-0.75, 0.04, 0]} s={[0.34, 0.4, 0.38]} c="#EADFC0" />
    <Box p={[0.72, -0.02, 0]} s={[0.3, 0.36, 0.42]} c="#DCCFAA" />
    {glint > 0 && glint < 1 && <Glow p={[-0.6 + 1.2 * glint, 0.14, 0.13]} s={[0.12, 0.08, 0.02]} c="#FFFFFF" i={4 * Math.sin(Math.PI * glint)} />}
  </group>
);

// xe buýt thành phố khối (~11 m), đầu xe -X
export const CityBus: React.FC<{ t: number; v?: number }> = ({ t, v = 0 }) => (
  <group>
    <Box p={[0, 1.65, 0]} s={[11, 2.7, 2.5]} c="#C83A2A" />
    <Box p={[0, 3.04, 0]} s={[10.6, 0.1, 2.3]} c="#B8B4AC" />
    {Array.from({ length: 8 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-4.3 + i * 1.25, 2.2, z * 1.26]} s={[1.0, 0.85, 0.02]} c="#26303A" />))}
    <Box p={[-5.51, 2.1, 0]} s={[0.02, 1.4, 2.2]} c="#26303A" />
    <Glow p={[-5.52, 0.75, 0.85]} s={[0.04, 0.22, 0.4]} c="#FFF2C8" i={2.5} />
    <Glow p={[-5.52, 0.75, -0.85]} s={[0.04, 0.22, 0.4]} c="#FFF2C8" i={2.5} />
    {[[-3.6, 1], [-3.6, -1], [3.4, 1], [3.4, -1]].map(([x, z], i) => (
      <group key={i} position={[x, 0.5, z * 1.1]} rotation={[0, 0, -t * v * 2]}>
        <Box p={[0, 0, 0]} s={[1.0, 1.0, 0.36]} c="#141414" />
      </group>
    ))}
  </group>
);

// sọ Giganotosaurus khối (~1,8 m) đặt trên đất, mõm hướng -X
export const GigaSkull: React.FC = () => (
  <group>
    <Box p={[0, 0.55, 0]} s={[1.8, 0.8, 0.62]} c="#E2D4B4" />
    <Box p={[0.55, 0.95, 0]} s={[0.7, 0.5, 0.56]} c="#D8C9A6" />
    {[0.38, -0.38].map((z) => <Box key={z} p={[0.25, 0.75, z * 0.86]} s={[0.36, 0.28, 0.04]} c="#1A1612" />)}
    {[0.32, -0.32].map((z) => <Box key={z} p={[-0.3, 0.7, z * 0.92]} s={[0.42, 0.22, 0.04]} c="#1A1612" />)}
    <Box p={[-0.1, 0.12, 0]} s={[1.6, 0.18, 0.5]} c="#D2C4A0" />
    {Array.from({ length: 9 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-0.82 + i * 0.16, 0.17, z * 0.26]} s={[0.05, 0.18, 0.04]} c="#F4ECD6" />))}
  </group>
);

// răng lưỡi dao: dẹt, cong ra sau, răng cưa hai mép; k = lấp lánh chạy dọc mép
export const BladeTooth: React.FC<{ glint?: number }> = ({ glint = -1 }) => {
  const n = 10;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const u = i / (n - 1);
        const w = 0.9 * (1 - u) + 0.08;
        const x = 0.25 * u * u;
        return (
          <group key={i} position={[x, 0.2 + u * 2.0, 0]}>
            <Box p={[0, 0, 0]} s={[w, 0.2, 0.18]} c="#F2EAD2" />
            {[1, -1].map((s) => <Box key={s} p={[s * (w / 2 + 0.03), 0.04, 0]} s={[0.07, 0.07, 0.12]} c="#E2D8BA" r={[0, 0, 0.785]} />)}
          </group>
        );
      })}
      {glint >= 0 && glint <= 1 && [1, -1].map((s) => {
        const u = glint;
        return <Glow key={s} p={[0.25 * u * u + s * ((0.9 * (1 - u) + 0.08) / 2 + 0.06), 0.25 + u * 2.0, 0.08]} s={[0.12, 0.12, 0.04]} c="#FFFFFF" i={5} />;
      })}
    </group>
  );
};
// răng nhọn hình nón (để so sánh)
export const SpikeTooth: React.FC = () => (
  <group>
    {Array.from({ length: 10 }, (_, i) => {
      const u = i / 9;
      const w = 0.7 * (1 - u) + 0.06;
      return <Box key={i} p={[0, 0.2 + u * 2.0, 0]} s={[w, 0.2, w]} c="#E6DAB8" />;
    })}
  </group>
);

// khủng long cổ dài (titanosaur ~ 30 m, cao ~ 14 m), đầu hướng -X, walk 0..1
export const BlockTitanosaur: React.FC<{ t: number; walk?: number; phase?: number }> = ({ t, walk = 0, phase = 0 }) => {
  const ph = (TAU * t) / 3.2 + phase;
  const leg = (x: number, z: number, o: number) => (
    <group key={`${x}${z}`} position={[x, 6.2, z]} rotation={[0, 0, 0.18 * walk * Math.sin(ph + o)]}>
      <Box p={[0, -3.1, 0]} s={[1.4, 6.2, 1.4]} c="#6A6458" />
      <Box p={[0, -6.05, 0]} s={[1.7, 0.3, 1.7]} c="#4A453E" />
    </group>
  );
  const sway = 0.05 * Math.sin(t * 0.7 + phase);
  return (
    <group position={[0, 0.25 * walk * Math.abs(Math.sin(ph)), 0]}>
      {leg(-3.2, 1.4, 0)}{leg(-3.2, -1.4, Math.PI)}{leg(3.2, 1.4, Math.PI)}{leg(3.2, -1.4, 0)}
      <Box p={[0, 8.2, 0]} s={[9.5, 4.4, 4.2]} c="#7A7262" />
      <Box p={[0, 10.5, 0]} s={[8, 0.4, 2.6]} c="#5A5448" />
      <Box p={[-0.3, 6.1, 0]} s={[8.6, 0.3, 3.8]} c="#A8A08C" />
      {/* cổ: 9 khúc ngóc lên */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = 0.75 + sway;
        const x = -4.6 - i * 1.15 * Math.cos(a), y = 9.2 + i * 1.15 * Math.sin(a);
        return <Box key={i} p={[x, y, 0]} s={[1.5, 1.4 - i * 0.07, 1.3 - i * 0.06]} c="#7A7262" r={[0, 0, -a]} />;
      })}
      <group position={[-4.6 - 9 * 1.15 * Math.cos(0.75 + sway), 9.2 + 9 * 1.15 * Math.sin(0.75 + sway), 0]}>
        <Box p={[-0.4, 0, 0]} s={[1.3, 0.75, 0.75]} c="#7A7262" />
        {[0.38, -0.38].map((z) => <Box key={z} p={[-0.55, 0.15, z]} s={[0.14, 0.12, 0.02]} c="#141210" />)}
      </group>
      {/* đuôi */}
      {Array.from({ length: 10 }, (_, i) => (
        <Box key={i} p={[5 + i * 1.3, 8.6 - i * 0.55, Math.sin(t * 0.9 + i * 0.4 + phase) * 0.06 * i * i]} s={[1.5, 2.2 - i * 0.18, 2.2 - i * 0.18]} c="#7A7262" />
      ))}
    </group>
  );
};

// vết rạch đỏ trên sườn (k = 0..1 mở ra)
export const Slash: React.FC<{ k: number; p: V3; a?: number }> = ({ k, p, a = 0.4 }) =>
  k <= 0 ? null : (
    <group position={p} rotation={[0, 0, a]}>
      <Glow p={[0, 0, 0]} s={[2.4 * clamp01(k * 2), 0.12, 0.05]} c="#E8251A" i={1.4} />
    </group>
  );

// xe giao hàng khối (~6 m, cao 2,8 m), đầu xe -X; rock = lắc
export const DeliveryVan: React.FC<{ rock?: number }> = ({ rock = 0 }) => (
  <group rotation={[0.05 * rock, 0, 0]}>
    <Box p={[0.6, 1.65, 0]} s={[4.4, 2.5, 2.1]} c="#E8E4DA" />
    <Box p={[-2.2, 1.15, 0]} s={[1.4, 1.5, 2.0]} c="#D8D4CA" />
    <Box p={[-2.6, 1.55, 0]} s={[0.6, 0.6, 1.8]} c="#26303A" r={[0, 0, -0.4]} />
    <Box p={[0.6, 1.8, 1.06]} s={[3.2, 0.5, 0.02]} c="#C83A2A" />
    <Box p={[0.6, 1.8, -1.06]} s={[3.2, 0.5, 0.02]} c="#C83A2A" />
    {[[-2.0, 1], [-2.0, -1], [2.0, 1], [2.0, -1]].map(([x, z], i) => <Box key={i} p={[x, 0.4, z * 0.95]} s={[0.8, 0.8, 0.3]} c="#141414" />)}
    <Glow p={[-2.91, 0.75, 0.7]} s={[0.04, 0.18, 0.3]} c="#FFF2C8" i={1.5} />
  </group>
);

// bãi đỗ xe: lối đi dọc trục X ở z = 0, xe đỗ hai bên đầu chĩa ra lối đi; alarm = đèn xe nháy
export const CarPark: React.FC<{ t: number; alarm?: number; vanRock?: number }> = ({ t, alarm = 0, vanRock = 0 }) => {
  const cols = ["#2E5E8E", "#8E2E2E", "#3A3A3A", "#C8C2B4", "#2E6E4E", "#6A5A3A"];
  const blink = alarm > 0 && Math.sin(t * 14) > 0 ? 1 : 0;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#2A2C30" roughness={0.9} /></mesh>
      {Array.from({ length: 30 }, (_, i) => -45 + i * 3).map((x) => [1, -1].map((s) => (
        <mesh key={`${x}${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, s * 4.6]}><planeGeometry args={[0.12, 4.6]} /><meshStandardMaterial color="#C8C4B8" emissive="#C8C4B8" emissiveIntensity={0.2} /></mesh>
      )))}
      {Array.from({ length: 29 }, (_, i) => -43.5 + i * 3).map((x, i) => [1, -1].map((s) => {
        if ((i * 7 + (s > 0 ? 3 : 0)) % 5 === 0) return null;
        if (s < 0 && Math.abs(x - -7.5) < 3) return null;
        return <group key={`${x}${s}`} position={[x, 0, s * 4.6]} rotation={[0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}><BlockCar t={0} c={cols[(i + (s > 0 ? 2 : 0)) % cols.length]} brake={x === 1.5 && s > 0 ? blink : 0} light={false} /></group>;
      }))}
      <group position={[-7.5, 0, -4.4]}><DeliveryVan rock={vanRock} /></group>
      {[-30, -10, 10, 30].map((x) => [8, -8].map((z) => <group key={`${x}${z}`} position={[x, 0, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}><Lamppost /></group>))}
    </group>
  );
};

// bộ xương khối nằm nghiêng (theropod), các khối "thiếu" là khung đỏ nhấp nháy
export const PartialSkeleton: React.FC<{ t: number; miss: number }> = ({ t, miss }) => {
  const bones: { p: V3; s: V3; m: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    const x = -5 + i * 0.42;
    const y = i < 6 ? 2.6 + i * 0.12 : 3.3 - Math.max(0, i - 12) * 0.12;
    bones.push({ p: [x, y, 0], s: [0.36, 0.3, 0.3], m: [3, 7, 8, 14, 15, 16, 19, 22, 23, 25].includes(i) });
    if (i > 5 && i < 14) bones.push({ p: [x, y - 0.6, 0], s: [0.06, 0.9, 0.5], m: i % 3 === 0 });
  }
  bones.push({ p: [-5.6, 2.6, 0], s: [1.4, 0.7, 0.5], m: false });
  bones.push({ p: [-0.8, 1.6, 0], s: [0.3, 1.6, 0.3], m: false }, { p: [-0.6, 0.6, 0], s: [0.26, 1.2, 0.26], m: true }, { p: [-0.4, 0.06, 0], s: [0.6, 0.12, 0.3], m: true });
  const on = 0.5 + 0.5 * Math.sin(t * 8);
  return (
    <group>
      {bones.map((b, i) =>
        b.m ? (miss > 0 ? <Glow key={i} p={b.p} s={b.s} c="#E5533D" i={0.6 + 1.2 * on * miss} /> : null) : <Box key={i} p={b.p} s={b.s} c="#E2D4B4" />,
      )}
    </group>
  );
};

// cân đòn: tilt (rad) nghiêng đòn; left/right = nội dung trên hai đĩa
export const Balance: React.FC<{ tilt: number; left: React.ReactNode; right: React.ReactNode }> = ({ tilt, left, right }) => {
  const L = 2.6;
  const end = (s: number): V3 => [s * L * Math.cos(tilt), 3.0 - s * L * Math.sin(tilt), 0];
  return (
    <group>
      <Box p={[0, 0.1, 0]} s={[1.6, 0.2, 1.0]} c="#3A3430" />
      <Box p={[0, 1.6, 0]} s={[0.18, 2.9, 0.18]} c="#6A5A48" />
      <group position={[0, 3.0, 0]} rotation={[0, 0, -tilt]}><Box p={[0, 0, 0]} s={[2 * L + 0.3, 0.14, 0.16]} c="#C9A227" /></group>
      {[-1, 1].map((s) => {
        const e = end(s);
        return (
          <group key={s} position={e}>
            <Box p={[0, -0.6, 0]} s={[0.03, 1.2, 0.03]} c="#9A8A6A" />
            <Box p={[0, -1.22, 0]} s={[1.9, 0.08, 1.2]} c="#C9A227" />
            <group position={[0, -1.18, 0]}>{s < 0 ? left : right}</group>
          </group>
        );
      })}
    </group>
  );
};
