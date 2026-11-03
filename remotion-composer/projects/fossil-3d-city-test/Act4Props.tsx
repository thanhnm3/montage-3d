// Đạo cụ khối cho ACT 4 tập dài 006 (#3 Spinosaurus): sông đêm (mặt nước y = WATER_Y, bờ gần z > -2, bờ xa z < -22),
// nước bắn, gợn sóng, cá, cá sấu khổng lồ, thằn lằn bay, đồng bằng sông nhìn từ trên, bản đồ Morocco, bảo tàng Munich,
// đuôi mái chèo, bọt nước, ánh sáng dưới nước. Mọi chuyển động là hàm của t.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, Glow, V3 } from "./BlockAnimals";
import { PALS } from "./Badlands";
import { Piece, Shatter } from "./ActProps";

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const WATER_Y = -0.15;
export const RIVER_Z: [number, number] = [-22, -2];

// ---------------------------------------------------------------- sông
export const RiverSet: React.FC<{ t: number; pal?: string; bg?: boolean }> = ({ t, pal = "storm", bg = true }) => {
  const P = PALS[pal] ?? PALS.storm;
  const deco = useMemo(() => {
    const r = rng(41);
    const reeds: [V3, number][] = [];
    for (let i = 0; i < 260; i++) {
      const far = r() < 0.45;
      reeds.push([[-120 + r() * 240, 0, far ? RIVER_Z[0] - 0.3 - r() * 3 : RIVER_Z[1] + 0.3 + r() * 2.5], 0.6 + r() * 1.4]);
    }
    const rocks: [V3, V3][] = [];
    for (let i = 0; i < 60; i++) rocks.push([[-120 + r() * 240, 0.3, r() < 0.5 ? 2 + r() * 30 : RIVER_Z[0] - 4 - r() * 30], [0.6 + r() * 2.4, 0.4 + r() * 1.4, 0.6 + r() * 2]]);
    const trees: V3[] = [];
    for (let i = 0; i < 22; i++) trees.push([-110 + r() * 220, 0, RIVER_Z[0] - 6 - r() * 24]);
    return { reeds, rocks, trees };
  }, []);
  return (
    <group>
      {bg && <color attach="background" args={[P.skyMid]} />}
      {/* hai bờ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 60 + RIVER_Z[1]]} receiveShadow><planeGeometry args={[400, 120]} /><meshStandardMaterial color={P.mud} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, RIVER_Z[0] - 60]} receiveShadow><planeGeometry args={[400, 120]} /><meshStandardMaterial color={P.mud} roughness={1} /></mesh>
      {/* lòng sông + mép bờ dốc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, (RIVER_Z[0] + RIVER_Z[1]) / 2]}><planeGeometry args={[400, 22]} /><meshStandardMaterial color="#1A1A18" roughness={1} /></mesh>
      <Box p={[0, -1.4, RIVER_Z[1] - 0.2]} s={[400, 2.9, 0.4]} c={P.basalt} />
      <Box p={[0, -1.4, RIVER_Z[0] + 0.2]} s={[400, 2.9, 0.4]} c={P.basalt} />
      {/* mặt nước */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, (RIVER_Z[0] + RIVER_Z[1]) / 2]} receiveShadow>
        <planeGeometry args={[400, RIVER_Z[1] - RIVER_Z[0]]} />
        <meshStandardMaterial color="#26323A" roughness={0.12} metalness={0.55} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* vệt sáng trôi trên mặt nước */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = ((i * 37.3 + t * 0.8) % 240) - 120;
        return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, WATER_Y + 0.01, RIVER_Z[0] + 1 + ((i * 7.7) % 18)]}><planeGeometry args={[2.4, 0.05]} /><meshStandardMaterial color="#8A98A8" emissive="#8A98A8" emissiveIntensity={0.25} transparent opacity={0.5} /></mesh>;
      })}
      {deco.reeds.map(([p, h], i) => <Box key={i} p={[p[0], h / 2, p[2]]} s={[0.06, h, 0.06]} c={i % 3 ? "#3A3C2A" : "#4A4630"} r={[0.08 * Math.sin(t * 1.3 + i), 0, 0.1 * Math.sin(t * 0.9 + i * 0.7)]} />)}
      {deco.rocks.map(([p, s], i) => <Box key={i} p={p} s={s} c={P.rock[i % 3]} />)}
      {deco.trees.map((p, i) => (
        <group key={i} position={p}>
          <Box p={[0, 2.5, 0]} s={[0.35, 5, 0.35]} c={P.tree} />
          <Box p={[0.7, 4.2, 0]} s={[1.6, 0.18, 0.18]} c={P.tree} r={[0, 0, 0.5]} />
          <Box p={[-0.5, 3.4, 0]} s={[1.1, 0.16, 0.16]} c={P.tree} r={[0, 0, -0.6]} />
        </group>
      ))}
    </group>
  );
};

// nước bắn ra khi con vật trồi lên (giọt rơi theo trọng lực từ t0)
export const Splash: React.FC<{ t: number; t0: number; p: V3; n?: number; w?: number; h?: number; seed?: number }> = ({ t, t0, p, n = 40, w = 3, h = 4, seed = 2 }) => {
  const drops = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }, () => ({ x: (r() - 0.5) * w, z: (r() - 0.5) * w * 0.6, vy: h * (0.5 + r()), vx: (r() - 0.5) * 3, vz: (r() - 0.5) * 2, d: r() * 0.3, s: 0.06 + r() * 0.12 }));
  }, [n, w, h, seed]);
  const u0 = t - t0;
  if (u0 < 0 || u0 > 2.4) return null;
  return (
    <group position={p}>
      {drops.map((q, i) => {
        const u = u0 - q.d;
        if (u < 0) return null;
        const y = q.vy * u - 4.9 * u * u;
        if (y < -0.3) return null;
        return <mesh key={i} position={[q.x + q.vx * u, y, q.z + q.vz * u]}><boxGeometry args={[q.s, q.s * 1.6, q.s]} /><meshStandardMaterial color="#C8D6E2" emissive="#8AA0B4" emissiveIntensity={0.4} transparent opacity={0.85} /></mesh>;
      })}
    </group>
  );
};

// gợn sóng tròn lan ra trên mặt nước
export const Ripple: React.FC<{ t: number; t0: number; p: V3; big?: number }> = ({ t, t0, p, big = 1 }) => {
  const u = t - t0;
  if (u < 0 || u > 3) return null;
  return (
    <group position={[p[0], WATER_Y + 0.02, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 0.4, 0.8].map((d) => {
        const k = u - d;
        if (k < 0) return null;
        const r = (0.6 + k * 2.6) * big;
        return <mesh key={d}><ringGeometry args={[r, r + 0.12 * big, 40]} /><meshStandardMaterial color="#B8C8D8" emissive="#8AA0B4" emissiveIntensity={0.3} transparent opacity={0.6 * (1 - k / 3)} /></mesh>;
      })}
    </group>
  );
};

// cá khối (đầu hướng -X)
export const BlockFish: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <group scale={s}>
    <Box p={[0, 0, 0]} s={[0.9, 0.32, 0.18]} c="#8A96A0" />
    <Box p={[-0.05, -0.1, 0]} s={[0.7, 0.1, 0.16]} c="#C8D0D6" />
    <Box p={[0.55, 0, 0]} s={[0.22, 0.4, 0.06]} c="#6A7680" />
    <Box p={[-0.36, 0.06, 0.1]} s={[0.06, 0.06, 0.02]} c="#101010" />
  </group>
);

// cá sấu khổng lồ (họ hàng cá sấu, ~10 m), đầu hướng -X; jaw 0..1 há miệng
export const BlockCroc: React.FC<{ t: number; jaw?: number; swim?: number }> = ({ t, jaw = 0, swim = 0 }) => {
  const sway = 0.15 * swim * Math.sin(t * 3);
  return (
    <group>
      <Box p={[0, 0, 0]} s={[4.0, 0.8, 1.6]} c="#56624A" />
      {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[-1.7 + i * 0.45, 0.46, 0]} s={[0.3, 0.14, 1.1]} c="#2A3024" />)}
      <group position={[-2.0, 0.1, 0]}>
        <Box p={[-0.6, 0.05, 0]} s={[1.2, 0.6, 1.1]} c="#56624A" />
        <Box p={[-0.85, 0.42, 0.32]} s={[0.22, 0.18, 0.22]} c="#2A3024" />
        <Box p={[-0.85, 0.42, -0.32]} s={[0.22, 0.18, 0.22]} c="#2A3024" />
        <Glow p={[-0.96, 0.44, 0.32]} s={[0.03, 0.08, 0.1]} c="#E8C83A" i={2} />
        <Glow p={[-0.96, 0.44, -0.32]} s={[0.03, 0.08, 0.1]} c="#E8C83A" i={2} />
        <group position={[-1.1, 0.1, 0]} rotation={[0, 0, -0.35 * jaw]}>
          <Box p={[-0.9, 0.05, 0]} s={[1.8, 0.3, 0.62]} c="#56624A" />
          {Array.from({ length: 6 }, (_, i) => [1, -1].map((z) => <Box key={`${i}${z}`} p={[-0.25 - i * 0.28, -0.13, z * 0.27]} s={[0.06, 0.12, 0.06]} c="#E8E0C8" />))}
        </group>
        <group position={[-1.1, -0.18, 0]} rotation={[0, 0, 0.35 * jaw]}>
          <Box p={[-0.9, 0, 0]} s={[1.8, 0.22, 0.56]} c="#B8B49A" />
        </group>
      </group>
      {Array.from({ length: 6 }, (_, i) => {
        const a = sway * (i + 1);
        return <Box key={i} p={[2.2 + i * 0.6, -0.05 * i, Math.sin(a) * i * 0.3]} s={[0.62, 0.6 - i * 0.08, 1.2 - i * 0.16]} c="#56624A" />;
      })}
    </group>
  );
};

// thằn lằn bay khối, sải cánh ~ 5 m, đầu hướng -X, vỗ cánh
export const BlockPterosaur: React.FC<{ t: number; phase?: number }> = ({ t, phase = 0 }) => {
  const f = 0.55 * Math.sin(t * 5 + phase);
  return (
    <group>
      <Box p={[0, 0, 0]} s={[1.0, 0.28, 0.32]} c="#4A3E36" />
      <Box p={[-0.75, 0.12, 0]} s={[0.6, 0.18, 0.16]} c="#4A3E36" />
      <Box p={[-1.3, 0.12, 0]} s={[0.7, 0.14, 0.12]} c="#C8B48A" />
      <Box p={[-0.85, 0.42, 0]} s={[0.5, 0.36, 0.04]} c="#8E2A1E" r={[0, 0, -0.5]} />
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0.08, s * 0.16]} rotation={[s * f, 0, 0]}>
          <Box p={[0.05, 0, s * 1.3]} s={[0.9, 0.04, 2.6]} c="#6A5446" />
          <Box p={[-0.35, 0.03, s * 1.3]} s={[0.08, 0.06, 2.6]} c="#3A2E26" />
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- đồng bằng sông nhìn từ trên (beat 23)
export const Delta: React.FC<{ t: number }> = ({ t }) => {
  const segs = useMemo(() => {
    const out: { p: V3; len: number; a: number; w: number }[] = [];
    for (let k = 0; k < 5; k++) {
      const z0 = -40 + k * 20, w = k === 2 ? 3 : 1.4;
      let px = -120, pz = z0;
      for (let i = 0; i < 70; i++) {
        const nx = px + 3.6, nz = z0 + 8 * Math.sin(i * 0.33 + k * 1.7) + 3 * Math.sin(i * 0.9 + k);
        out.push({ p: [(px + nx) / 2, 0.03, (pz + nz) / 2], len: Math.hypot(nx - px, nz - pz) + 0.4, a: Math.atan2(nz - pz, nx - px), w });
        px = nx; pz = nz;
      }
    }
    return out;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[400, 300]} /><meshStandardMaterial color="#4A4236" roughness={1} /></mesh>
      {segs.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[-Math.PI / 2, 0, -s.a]}>
          <planeGeometry args={[s.len, s.w]} />
          <meshStandardMaterial color="#5A7488" emissive="#3A5468" emissiveIntensity={0.25 + 0.05 * Math.sin(t * 2 + i * 0.3)} roughness={0.2} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

// bản đồ Morocco khối (đường viền gần đúng, kinh/vĩ độ -> mét: 1 độ = 1 m) + ghim Kem Kem
const MOROCCO: [number, number][] = [
  [-2.2, 35.1], [-5.3, 35.9], [-6.3, 35.0], [-6.9, 34.0], [-8.5, 33.3], [-9.3, 32.5], [-9.8, 30.6], [-9.6, 29.9], [-10.3, 29.3], [-11.5, 28.3], [-13.2, 27.7],
  [-8.7, 27.7], [-8.7, 28.7], [-7.1, 29.6], [-5.5, 29.9], [-4.4, 30.6], [-3.6, 31.6], [-2.9, 31.8], [-1.2, 32.1], [-1.0, 32.5], [-1.7, 33.3], [-1.8, 34.5],
];
export const KEMKEM: [number, number] = [-4.0, 30.9];
export const MoroccoMap: React.FC<{ k: number; pin: number }> = ({ k, pin }) => {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    MOROCCO.forEach(([lo, la], i) => (i ? sh.lineTo(lo + 7, -(la - 31.5)) : sh.moveTo(lo + 7, -(la - 31.5))));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const px = KEMKEM[0] + 7, pz = -(KEMKEM[1] - 31.5);
  return (
    <group scale={[1, Math.max(0.01, k), 1]}>
      <mesh geometry={geo} position={[0, 0.25, 0]} castShadow receiveShadow><meshStandardMaterial color="#C89A5E" flatShading /></mesh>
      {pin > 0 && (
        <group position={[px, 0.25 + 1.2 * (1 - ease(pin)), pz]}>
          <Glow p={[0, 0.5, 0]} s={[0.08, 0.9, 0.08]} c="#E5533D" i={1.5} />
          <Glow p={[0, 1.05, 0]} s={[0.36, 0.36, 0.36]} c="#E5533D" i={2.5} />
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- bảo tàng Munich về đêm (beat 25), kèm đèn riêng
const CEIL: Piece[] = (() => {
  const out: Piece[] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) out.push({ p: [-6 + i * 2, 7.6, -3 + j * 2], s: [1.9, 0.5, 1.9], c: (i + j) % 2 ? "#5A544C" : "#4A453E" });
  return out;
})();
export const Museum: React.FC<{ t: number; alarm: number; boom: number; flash: number }> = ({ t, alarm, boom, flash }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  const siren = alarm * (0.5 + 0.5 * Math.sin(t * 9));
  return (
    <group>
      <color attach="background" args={["#08080A"]} />
      <fog attach="fog" args={["#0A0A0C", 8, 36]} />
      <hemisphereLight args={["#4A5060", "#141010", 0.5 + 6 * flash]} />
      <primitive object={tgt} />
      <spotLight position={[0, 7, 4]} target={tgt} angle={0.6} penumbra={0.7} intensity={180 * (1 - 0.5 * alarm)} color="#FFE3BC" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      <pointLight position={[0, 6, 0]} intensity={60 * siren} distance={26} color="#FF2A1A" />
      {/* sàn, tường, cột, mái */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#3A3430" roughness={0.6} /></mesh>
      <Box p={[0, 4, -5.5]} s={[18, 8, 0.4]} c="#4A443C" />
      {[-7.5, -3.5, 3.5, 7.5].map((x) => <Box key={x} p={[x, 3.8, -4.6]} s={[0.8, 7.6, 0.8]} c="#6A6258" />)}
      {[-1.8, 0, 1.8].map((x) => <Glow key={x} p={[x * 2, 6.2, -5.28]} s={[1.6, 2.2, 0.04]} c="#3A4A6A" i={0.6 + 4 * flash} />)}
      <Box p={[0, 0.25, 0]} s={[7, 0.5, 2.6]} c="#2A2622" />
      {t < boom ? CEIL.map((q, i) => <Box key={i} p={q.p} s={q.s} c={q.c} />) : <Shatter t={t} t0={boom} pieces={CEIL} force={2.5} seed={13} />}
    </group>
  );
};

// ---------------------------------------------------------------- đuôi mái chèo ráp dần từ khối (beat 26)
const PADDLE = (() => {
  const r = rng(23);
  const out: { p: V3; s: V3; o: V3; d: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const x = -3 + i * 0.32, h = 2.0 * Math.pow(1 - i / 22, 0.6) + 0.3;
    out.push({ p: [x, 0.7, 0], s: [0.26, 0.24, 0.24], o: [(r() - 0.5) * 6, 3 + r() * 3, (r() - 0.5) * 4], d: i * 0.08 });
    out.push({ p: [x, 0.7 + 0.15 + h / 2, 0], s: [0.07, h, 0.06], o: [(r() - 0.5) * 6, 4 + r() * 3, (r() - 0.5) * 4], d: i * 0.08 + 0.05 });
    out.push({ p: [x + 0.08, 0.7 - 0.2 - h * 0.25, 0], s: [0.06, h * 0.5, 0.05], o: [(r() - 0.5) * 6, 3 + r() * 2, (r() - 0.5) * 4], d: i * 0.08 + 0.1 });
  }
  return out;
})();
export const PaddleTail: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => (
  <group>
    {PADDLE.map((q, i) => {
      const k = ease((t - t0 - q.d) / 0.5);
      if (k <= 0) return null;
      return <Box key={i} p={[q.p[0] + q.o[0] * (1 - k), q.p[1] + q.o[1] * (1 - k), q.p[2] + q.o[2] * (1 - k)]} s={q.s} c="#E2D4B4" r={[0, (1 - k) * 2, (1 - k) * 1.5]} />;
    })}
  </group>
);

// ---------------------------------------------------------------- dưới nước (beat 26)
export const UnderLights: React.FC<{ x: number }> = ({ x }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, -3, -12);
  return (
    <>
      <color attach="background" args={["#0C2230"]} />
      <fog attach="fog" args={["#0E2634", 3, 26]} />
      <hemisphereLight args={["#6AA0B8", "#0A1418", 1.6]} />
      <primitive object={tgt} />
      <directionalLight position={[x - 4, 12, -8]} target={tgt} intensity={2.6} color="#A8D8E8" />
    </>
  );
};
export const Bubbles: React.FC<{ t: number; p: V3; n?: number }> = ({ t, p, n = 18 }) => (
  <group position={p}>
    {Array.from({ length: n }, (_, i) => {
      const u = ((t * 0.6 + i / n) % 1);
      return <mesh key={i} position={[Math.sin(i * 3.1 + t) * 0.6, u * 3.2, Math.cos(i * 1.7) * 0.6]}><boxGeometry args={[0.07, 0.07, 0.07]} /><meshStandardMaterial color="#CFEFFF" emissive="#8ACDE8" emissiveIntensity={0.6} transparent opacity={0.8 * (1 - u)} /></mesh>;
    })}
  </group>
);
