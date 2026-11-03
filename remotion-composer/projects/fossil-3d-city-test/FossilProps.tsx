// Đạo cụ hoá thạch khối cho tập dài 006 (Top 5 khủng long đáng sợ): sọ Triceratops có vết cắn, phiến đá xương,
// vuốt liềm trong đá, sọ trong đá, bộ xương trưng bày vỡ vụn, bục tối có đèn rọi. Đất y = 0, đơn vị mét, mọi chuyển động là hàm của t.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, V3 } from "./BlockAnimals";

const BONE = "#CDBF98", BONE_D = "#A8976E", GOUGE = "#2E2016", ROCK = "#8A6A4A", ROCK_D = "#6A4E36";
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

// sọ Triceratops nằm nghiêng trên đất, diềm cổ đầy vết răng cắn (rãnh tối + lỗ thủng)
export const TrikeFrill: React.FC = () => (
  <group rotation={[0, 0, 0]}>
    {/* mặt + mỏ */}
    <Box p={[-0.9, 0.38, 0]} s={[1.3, 0.7, 0.8]} c={BONE} />
    <Box p={[-1.75, 0.3, 0]} s={[0.5, 0.5, 0.5]} c={BONE_D} r={[0, 0, 0.3]} />
    <Box p={[-1.3, 0.85, 0]} s={[0.14, 0.45, 0.14]} c={BONE} r={[0, 0, 0.25]} />
    {/* sừng mày */}
    {[1, -1].map((z) => (
      <group key={z} position={[-0.6, 0.72, z * 0.28]} rotation={[z * 0.25, 0, 0.55]}>
        <Box p={[0, 0.4, 0]} s={[0.2, 0.8, 0.2]} c={BONE_D} />
        <Box p={[0, 0.85, 0]} s={[0.12, 0.16, 0.12]} c={BONE_D} />
      </group>
    ))}
    {/* hốc mắt */}
    {[1, -1].map((z) => <Box key={z} p={[-0.55, 0.5, z * 0.41]} s={[0.22, 0.18, 0.02]} c={GOUGE} />)}
    {/* diềm cổ dựng nghiêng ra sau */}
    <group position={[-0.25, 0.4, 0]} rotation={[0, 0, -0.95]}>
      <Box p={[0, 1.0, 0]} s={[0.16, 2.0, 2.2]} c={BONE} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = -1.1 + (2.2 * i) / 8;
        return <Box key={i} p={[0, 2.0 + 0.08 * Math.cos(a), a]} s={[0.16, 0.22, 0.2]} c={BONE_D} r={[0.78, 0, 0]} />;
      })}
      {/* vết cắn: rãnh song song (răng kéo qua) + lỗ thủng */}
      {[[0.7, -0.5, 0.5], [0.9, -0.3, 0.45], [1.1, -0.1, 0.5], [1.35, 0.35, 0.4], [1.55, 0.55, 0.38]].map(([y, z, l], i) => (
        <Box key={i} p={[-0.085, y, z]} s={[0.02, 0.06, l]} c={GOUGE} r={[0.5, 0, 0]} />
      ))}
      {[[1.2, 0.75], [0.6, 0.3], [1.6, -0.6]].map(([y, z], i) => (
        <Box key={`h${i}`} p={[-0.085, y, z]} s={[0.025, 0.13, 0.13]} c="#1A120C" />
      ))}
    </group>
    {/* đất lấp một phần */}
    <Box p={[-0.4, 0.04, 0]} s={[3.4, 0.12, 2.6]} c="#3A322C" />
  </group>
);

// bục tối + đèn rọi trên cao cho cảnh "trưng bày hoá thạch"
export const Plate: React.FC<{ x: number; dim?: number }> = ({ x, dim = 1 }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, 0);
  return (
    <>
      <color attach="background" args={["#0A0A0C"]} />
      <fog attach="fog" args={["#0A0A0C", 6, 30]} />
      <hemisphereLight args={["#5A6478", "#1A1410", 0.5 * dim]} />
      <primitive object={tgt} />
      <spotLight position={[x - 1.5, 7, 2.5]} target={tgt} angle={0.45} penumbra={0.6} intensity={260 * dim} decay={2} color="#FFE3BC" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      <directionalLight position={[x + 5, 3, -4]} target={tgt} intensity={1.6 * dim} color="#FF8A3A" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#17140F" roughness={1} />
      </mesh>
    </>
  );
};

// tia lấp lánh quét ngang qua đạo cụ (k 0..1)
export const Glint: React.FC<{ k: number; w: number; h: number; y: number }> = ({ k, w, h, y }) =>
  k <= 0 || k >= 1 ? null : (
    <mesh position={[-w / 2 + w * k, y, 0.02]} rotation={[0, 0, 0.5]}>
      <planeGeometry args={[0.07, h]} />
      <meshBasicMaterial color="#FFF4D8" transparent opacity={0.35 * Math.sin(Math.PI * k)} depthWrite={false} />
    </mesh>
  );

// phiến sa thạch với bộ xương raptor nằm nghiêng (nổi lên khỏi mặt đá)
export const FossilSlab: React.FC<{ glint?: number }> = ({ glint = 0 }) => {
  const bones: [V3, V3, number][] = [];
  // sọ, cổ cong, cột sống, đuôi, sườn, chân gập
  bones.push([[-1.15, 0.24, -0.15], [0.42, 0.06, 0.2], 0.2]);
  for (let i = 0; i < 4; i++) bones.push([[-0.85 + i * 0.12, 0.24, -0.05 + i * 0.05], [0.11, 0.05, 0.08], 0]);
  for (let i = 0; i < 8; i++) bones.push([[-0.35 + i * 0.13, 0.24, 0.15], [0.11, 0.05, 0.09], 0]);
  for (let i = 0; i < 9; i++) bones.push([[0.7 + i * 0.13, 0.24, 0.15 - i * 0.04], [0.11, 0.04, 0.07 - i * 0.004], 0]);
  for (let i = 0; i < 6; i++) bones.push([[-0.25 + i * 0.13, 0.24, 0.35], [0.04, 0.04, 0.38], 0.15]);
  bones.push([[0.35, 0.24, -0.25], [0.5, 0.06, 0.07], 0.9], [[0.1, 0.24, -0.55], [0.45, 0.05, 0.06], -0.6], [[-0.1, 0.24, -0.8], [0.3, 0.05, 0.12], 0.2]);
  bones.push([[-0.24, 0.24, -0.86], [0.04, 0.05, 0.16], 0.9]);
  return (
    <group>
      <Box p={[0, 0.1, 0]} s={[3.2, 0.24, 2.2]} c={ROCK} />
      <Box p={[0.9, 0.16, -0.6]} s={[1.0, 0.16, 0.9]} c={ROCK_D} />
      {bones.map(([p, s, r], i) => <Box key={i} p={p} s={s} c={i === 0 ? BONE : i % 3 ? BONE : BONE_D} r={[0, r, 0]} />)}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <Glint k={glint} w={3.4} h={2.6} y={0} />
      </group>
    </group>
  );
};

// vuốt liềm Utahraptor nhô khỏi khối đá đỏ
export const ClawInStone: React.FC<{ glint?: number }> = ({ glint = 0 }) => (
  <group>
    <Box p={[0, 0.3, 0]} s={[1.2, 0.6, 0.9]} c="#9A4E2E" />
    <Box p={[0.3, 0.68, 0.1]} s={[0.6, 0.2, 0.6]} c="#7E3E24" />
    {/* vuốt cong: 5 đốt nối tiếp, mỗi đốt cong thêm về -X */}
    <group position={[0.05, 0.62, 0]} rotation={[0, 0, 0.15]}>
      <ClawSeg i={0} />
    </group>
    <group position={[-0.25, 0.8, 0.07]}>
      <Glint k={glint} w={0.7} h={0.8} y={0} />
    </group>
  </group>
);

export const ClawSeg: React.FC<{ i: number }> = ({ i }) => {
  if (i > 4) return null;
  const L = 0.17 - 0.012 * i, w = 0.16 - 0.028 * i;
  return (
    <group>
      <Box p={[0, L / 2, 0]} s={[w, L + 0.02, 0.1 - 0.014 * i]} c={i === 4 ? "#F4ECD6" : i % 2 ? BONE : "#E6DAB8"} />
      <group position={[0, L, 0]} rotation={[0, 0, 0.32]}>
        <ClawSeg i={i + 1} />
      </group>
    </group>
  );
};

// sọ Giganotosaurus lộ ra trong đá (nhìn nghiêng): hộp sọ, mõm, hốc mắt, hàng răng
export const SkullInRock: React.FC<{ glint?: number }> = ({ glint = 0 }) => {
  // nhìn nghiêng, mõm về -X: hộp sọ cao phía sau, thấp dần ra mõm; hàm dưới hé, răng cưa hai hàng
  const top: [number, number, number][] = [[0.75, 0.62, 0.5], [0.3, 0.56, 0.46], [-0.15, 0.48, 0.42], [-0.6, 0.4, 0.38], [-1.0, 0.33, 0.34], [-1.32, 0.27, 0.3]];
  return (
    <group>
      <Box p={[0.1, 0.22, 0]} s={[3.4, 0.44, 1.5]} c={ROCK} />
      <Box p={[1.1, 0.5, -0.3]} s={[1.0, 0.3, 0.8]} c={ROCK_D} />
      <group position={[0, 0.62, 0.15]} rotation={[0, 0, 0.04]}>
        {top.map(([x, h, w], i) => <Box key={i} p={[x, h / 2, 0]} s={[0.47, h, w]} c={i % 2 ? BONE : "#E3D6B4"} />)}
        <Box p={[0.75, 0.66, 0]} s={[0.5, 0.08, 0.36]} c={BONE_D} />
        {/* hốc mắt + cửa sổ trước mắt + lỗ mũi */}
        <Box p={[0.62, 0.42, 0.26]} s={[0.18, 0.2, 0.02]} c={GOUGE} />
        <Box p={[0.08, 0.28, 0.24]} s={[0.5, 0.2, 0.02]} c={GOUGE} />
        <Box p={[-1.2, 0.17, 0.16]} s={[0.16, 0.08, 0.02]} c={GOUGE} />
        {/* hàng răng trên */}
        {Array.from({ length: 10 }, (_, i) => <Box key={i} p={[-1.38 + i * 0.2, -0.07 - 0.02 * (i % 2), 0.1]} s={[0.06, 0.15 + 0.04 * (i % 2), 0.05]} c="#F4ECD4" r={[0, 0, 0.15]} />)}
        {/* hàm dưới hé */}
        <group position={[0.8, -0.05, 0]} rotation={[0, 0, 0.12]}>
          <Box p={[-1.05, -0.12, 0]} s={[2.1, 0.2, 0.3]} c={BONE_D} />
          {Array.from({ length: 8 }, (_, i) => <Box key={i} p={[-1.95 + i * 0.22, 0.03, 0.08]} s={[0.05, 0.12, 0.04]} c="#EDE2C6" r={[0, 0, -0.15]} />)}
        </group>
      </group>
      <group position={[-0.2, 1.0, 0.55]}>
        <Glint k={glint} w={2.6} h={0.9} y={0} />
      </group>
    </group>
  );
};

// bộ xương Spinosaurus trên bục, vỡ vụn và rơi xuống từ giây `t0` (bom 1944)
type Piece = { p: V3; s: V3; r: number; d: number; vx: number; vz: number; spin: number };
export const CrumbleSkeleton: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const pieces = useMemo(() => {
    const r = rng(77);
    const out: Piece[] = [];
    const add = (p: V3, s: V3, rot = 0) => out.push({ p, s, r: rot, d: r() * 0.5, vx: (r() - 0.5) * 1.6, vz: (r() - 0.5) * 1.6, spin: (r() - 0.5) * 9 });
    const H = 1.9;
    for (let i = 0; i < 14; i++) {
      const x = -1.6 + i * 0.24;
      add([x, H, 0], [0.2, 0.12, 0.14]);
      const sp = 1.15 * Math.sin(Math.PI * (0.1 + 0.8 * (i / 13))) ** 0.8; // gai lưng (khung buồm)
      add([x, H + 0.08 + sp / 2, 0], [0.06, sp, 0.05]);
    }
    for (let i = 0; i < 9; i++) add([1.75 + i * 0.22, H - 0.04 * i, 0], [0.18, 0.1 - 0.006 * i, 0.1]);
    for (let i = 0; i < 4; i++) add([-1.85 - i * 0.18, H + 0.1 + i * 0.1, 0], [0.16, 0.1, 0.1]);
    add([-2.75, H + 0.42, 0], [0.9, 0.18, 0.2]);
    for (let i = 0; i < 6; i++) [1, -1].forEach((z) => add([-0.9 + i * 0.26, H - 0.35, z * 0.16], [0.04, 0.62, 0.04], z * 0.2));
    [1, -1].forEach((z) => {
      add([0.75, H - 0.45, z * 0.2], [0.1, 0.8, 0.1], -0.3);
      add([0.95, H - 1.15, z * 0.2], [0.08, 0.7, 0.08], 0.4);
      add([0.75, 0.08, z * 0.2], [0.35, 0.06, 0.12]);
      add([-1.3, H - 0.4, z * 0.18], [0.06, 0.45, 0.06], 0.5);
    });
    return out;
  }, []);
  // các cột đỡ bằng sắt cũng đổ
  const tt = t - t0;
  return (
    <group>
      <Box p={[0, 0.06, 0]} s={[6.4, 0.12, 1.4]} c="#2A2622" />
      {pieces.map((q, i) => {
        const u = Math.max(0, tt - q.d);
        if (u <= 0) return <Box key={i} p={q.p} s={q.s} c={i % 4 ? BONE : BONE_D} r={[0, 0, q.r]} />;
        const floor = 0.12 + q.s[1] / 2;
        const tf = Math.sqrt((2 * (q.p[1] - floor)) / 9.8);
        const uu = Math.min(u, tf);
        const y = Math.max(floor, q.p[1] - 4.9 * uu * uu);
        const k = uu; // trượt ngang chỉ trong lúc rơi
        return <Box key={i} p={[q.p[0] + q.vx * k, y, q.p[2] + q.vz * k]} s={q.s} c={i % 4 ? BONE : BONE_D} r={[q.spin * k * 0.3, 0, q.r + q.spin * k]} />;
      })}
      {[-1.2, 1.2].map((x, i) => {
        const a = Math.min(1.3, Math.max(0, tt - 0.15) * 2.2) * (i ? 1 : -1);
        return (
          <group key={x} position={[x, 0.12, 0]} rotation={[0, 0, a]}>
            <Box p={[0, 0.85, 0]} s={[0.05, 1.7, 0.05]} c="#3A3A3E" />
          </group>
        );
      })}
      <Dust t={tt} />
    </group>
  );
};

// bụi tung: khối xám nở ra rồi tan
export const Dust: React.FC<{ t: number }> = ({ t }) => {
  const puffs = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 46 }, () => ({ x: (r() - 0.5) * 5, z: (r() - 0.5) * 1.6, v: 0.4 + r() * 1.2, s: 0.15 + r() * 0.35, d: 0.2 + r() * 0.6 }));
  }, []);
  if (t <= 0) return null;
  return (
    <>
      {puffs.map((p, i) => {
        const u = t - p.d;
        if (u <= 0 || u > 2.5) return null;
        const sc = p.s * (1 + 2.2 * u);
        return (
          <mesh key={i} position={[p.x * (1 + 0.3 * u), 0.2 + p.v * u * 0.8, p.z * (1 + 0.5 * u)]}>
            <boxGeometry args={[sc, sc, sc]} />
            <meshStandardMaterial color="#8E8478" transparent opacity={0.55 * (1 - u / 2.5)} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
};

// hơi thở phả ra từ mũi (khối mờ nở dần), t = giây kể từ lúc thở
export const BreathPuff: React.FC<{ t: number; p: V3; dir: V3 }> = ({ t, p, dir }) => {
  if (t <= 0 || t > 1.4) return null;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const u = t - i * 0.06;
        if (u <= 0) return null;
        const sc = 0.08 + 0.35 * u;
        return (
          <mesh key={i} position={[p[0] + dir[0] * u * (1 + 0.2 * i), p[1] + dir[1] * u + 0.05 * i, p[2] + dir[2] * u + 0.04 * (i - 2)]}>
            <boxGeometry args={[sc, sc, sc]} />
            <meshStandardMaterial color="#B8B2AA" transparent opacity={0.4 * (1 - u / 1.4)} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
};
