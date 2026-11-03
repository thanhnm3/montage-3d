// Đạo cụ khối cho ACT 1-2 tập dài 006: cuộn phim vỡ, thước đo, gấu xám khối, bàn chân vuốt liềm, cẩu + khối sa thạch x-quang,
// mỏ đá, hố cát lún, cuốc chim, sân sau nhà có hàng rào. Đất y = 0, đơn vị mét, mọi chuyển động là hàm của t.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, Glow, V3 } from "./BlockAnimals";
import { ClawSeg } from "./FossilProps";

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// mảnh vỡ rơi theo trọng lực từ t0 (mỗi mảnh văng ngang một chút rồi nằm trên sàn y = floor)
export type Piece = { p: V3; s: V3; c: string };
export const Shatter: React.FC<{ t: number; t0: number; pieces: Piece[]; floor?: number; seed?: number; force?: number }> = ({ t, t0, pieces, floor = 0, seed = 3, force = 1.5 }) => {
  const v = useMemo(() => {
    const r = rng(seed);
    return pieces.map(() => ({ vx: (r() - 0.5) * force, vy: r() * force * 0.8, vz: (r() - 0.5) * force, sp: (r() - 0.5) * 10 }));
  }, [pieces, seed, force]);
  const u = Math.max(0, t - t0);
  return (
    <>
      {pieces.map((q, i) => {
        const fl = floor + q.s[1] / 2;
        let y = q.p[1] + v[i].vy * u - 4.9 * u * u;
        const landed = y <= fl;
        // thời điểm chạm sàn
        const a = 4.9, b = v[i].vy, c = q.p[1] - fl;
        const tl = (b + Math.sqrt(b * b + 4 * a * c)) / (2 * a);
        const uu = landed ? tl : u;
        if (landed) y = fl;
        return <Box key={i} p={[q.p[0] + v[i].vx * uu, y, q.p[2] + v[i].vz * uu]} s={q.s} c={q.c} r={[v[i].sp * uu * 0.3, 0, v[i].sp * uu]} />;
      })}
    </>
  );
};

// cuộn phim khối đứng: nứt ở crackT, vỡ tung ở breakT ("danh tiếng phim ảnh không tính")
export const FilmReel: React.FC<{ t: number; crackT: number; breakT: number }> = ({ t, crackT, breakT }) => {
  const R = 0.9;
  const pieces = useMemo<Piece[]>(() => {
    const out: Piece[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      out.push({ p: [Math.cos(a) * R * 0.6, 1.1 + Math.sin(a) * R * 0.6, 0], s: [0.45, 0.4, 0.12], c: i % 2 ? "#2A2C30" : "#3A3D42" });
    }
    out.push({ p: [0, 1.1, 0], s: [0.3, 0.3, 0.16], c: "#8A8E94" });
    for (let i = 0; i < 5; i++) out.push({ p: [1.0 + 0.3 * i, 0.25, 0.02], s: [0.28, 0.32, 0.03], c: "#1A1A1C" });
    return out;
  }, []);
  if (t >= breakT) return <Shatter t={t} t0={breakT} pieces={pieces} force={3} seed={8} />;
  const crack = clamp01((t - crackT) / 0.15);
  const shake = t > crackT ? 0.02 * Math.sin(t * 90) : 0;
  return (
    <group position={[shake, 0, 0]}>
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[R, R, 0.12, 24]} />
        <meshStandardMaterial color="#33363B" roughness={0.6} metalness={0.4} flatShading />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        return <Box key={i} p={[Math.cos(a) * 0.5, 1.1 + Math.sin(a) * 0.5, 0.07]} s={[0.26, 0.26, 0.02]} c="#0C0C0E" />;
      })}
      <Box p={[0, 1.1, 0.08]} s={[0.22, 0.22, 0.04]} c="#8A8E94" />
      {/* dải phim chảy xuống đất */}
      <Box p={[0.55, 0.55, 0.02]} s={[0.3, 1.1, 0.02]} c="#1A1A1C" r={[0, 0, 0.5]} />
      {[0, 1, 2, 3, 4].map((i) => <Box key={`f${i}`} p={[1.0 + 0.3 * i, 0.02, 0.2]} s={[0.28, 0.02, 0.36]} c="#1A1A1C" />)}
      {/* vết nứt */}
      {crack > 0 && [[0.1, 1.3, 0.7, 0.5], [-0.2, 0.9, 0.55, -0.9], [0.35, 1.0, 0.4, 1.4]].map(([x, y, l, r], i) => (
        <Box key={`c${i}`} p={[x, y, 0.075]} s={[l * crack, 0.025, 0.01]} c="#E8E4DC" r={[0, 0, r]} />
      ))}
    </group>
  );
};

// thước đo dựng đứng / nằm ngang có vạch chia, k = độ dài đã vẽ (0..1)
export const MeasureBar: React.FC<{ len: number; k: number; vertical?: boolean; c?: string; ticks?: number }> = ({ len, k, vertical, c = "#F2D27A", ticks = 1 }) => {
  if (k <= 0) return null;
  const L = len * k;
  const n = Math.floor(L / ticks);
  return (
    <group rotation={[0, 0, vertical ? Math.PI / 2 : 0]}>
      <Glow p={[L / 2, 0, 0]} s={[L, 0.06, 0.06]} c={c} i={1.6} />
      {Array.from({ length: n + 1 }, (_, i) => <Glow key={i} p={[i * ticks, 0.12, 0]} s={[0.04, 0.24, 0.04]} c={c} i={1.6} />)}
      <Glow p={[L, 0.2, 0]} s={[0.05, 0.4, 0.05]} c={c} i={2} />
    </group>
  );
};

// gấu xám khối (~2,2 m dài, vai ~1 m), quay về -X
export const BlockBear: React.FC<{ t: number; k?: number }> = ({ t, k = 1 }) => {
  if (k <= 0) return null;
  const fur = "#5A4232", dark = "#3A2A20";
  const br = 0.02 * Math.sin(t * 2);
  return (
    <group scale={[k, k, k]}>
      <Box p={[0.05, 0.95 + br, 0]} s={[1.6, 0.85, 0.85]} c={fur} />
      <Box p={[-0.45, 1.25 + br, 0]} s={[0.6, 0.35, 0.8]} c={fur} />
      <group position={[-0.95, 1.1, 0]}>
        <Box p={[0, 0, 0]} s={[0.5, 0.45, 0.48]} c={fur} />
        <Box p={[-0.32, -0.08, 0]} s={[0.24, 0.22, 0.28]} c={dark} />
        <Box p={[-0.45, -0.04, 0]} s={[0.04, 0.08, 0.12]} c="#141010" />
        {[1, -1].map((z) => <Box key={z} p={[0.12, 0.27, z * 0.18]} s={[0.1, 0.14, 0.12]} c={dark} />)}
        {[1, -1].map((z) => <Box key={`e${z}`} p={[-0.2, 0.08, z * 0.245]} s={[0.06, 0.05, 0.01]} c="#0A0806" />)}
      </group>
      {[[-0.55, 1], [-0.55, -1], [0.6, 1], [0.6, -1]].map(([x, z], i) => (
        <group key={i}>
          <Box p={[x, 0.32, z * 0.28]} s={[0.3, 0.64, 0.28]} c={i < 2 ? fur : dark} />
          <Box p={[x - 0.08, 0.04, z * 0.28]} s={[0.4, 0.08, 0.3]} c={dark} />
        </group>
      ))}
    </group>
  );
};

// bàn chân Utahraptor cỡ thật (cận cảnh): ngón 3-4 chạm đất, vuốt liềm ngón 2 dựng lên theo raise (0 hạ -> 1 dựng)
export const ClawFoot: React.FC<{ raise: number; scale?: number }> = ({ raise, scale = 1 }) => {
  const skin = "#54412F", dark = "#2E241A";
  return (
    <group scale={[scale, scale, scale]}>
      {/* cổ chân */}
      <Box p={[0.05, 0.42, 0]} s={[0.16, 0.7, 0.17]} c={skin} r={[0, 0, -0.25]} />
      <Box p={[-0.05, 0.1, 0]} s={[0.26, 0.16, 0.24]} c={skin} />
      {/* hai ngón chạm đất */}
      {[0.06, -0.06].map((z, i) => (
        <group key={i} position={[-0.18, 0.05, z]}>
          <Box p={[-0.1, 0, 0]} s={[0.24, 0.08, 0.07]} c={dark} />
          <Box p={[-0.24, -0.01, 0]} s={[0.06, 0.06, 0.05]} c="#1E1812" r={[0, 0, 0.4]} />
        </group>
      ))}
      {/* ngón 2 với vuốt liềm */}
      <group position={[-0.1, 0.13, 0.13]} rotation={[0, 0, -1.3 + 1.6 * raise]}>
        <Box p={[-0.07, 0, 0]} s={[0.16, 0.07, 0.07]} c={dark} />
        <group position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.75, 0.75, 0.75]}>
          <ClawSeg i={0} />
        </group>
      </group>
    </group>
  );
};

// thước kẻ khối có vạch (đo vuốt 22 cm)
export const Ruler: React.FC<{ len: number }> = ({ len }) => (
  <group>
    <Box p={[len / 2, 0, 0]} s={[len + 0.04, 0.012, 0.06]} c="#E8C55A" />
    {Array.from({ length: Math.round(len * 100) + 1 }, (_, i) => (
      <Box key={i} p={[i * 0.01, 0.008, -0.022 + (i % 5 === 0 ? 0.008 : 0)]} s={[0.0025, 0.004, i % 5 === 0 ? 0.03 : 0.015]} c="#2A2214" />
    ))}
  </group>
);

// cần cẩu khối: tháp + cần + dây xuống móc ở `hook`
export const Crane: React.FC<{ base: V3; hook: V3 }> = ({ base, hook }) => {
  const top: V3 = [base[0], 12, base[2]];
  const dx = hook[0] - top[0], dz = hook[2] - top[2];
  const L = Math.hypot(dx, dz);
  const ang = Math.atan2(-dz, dx);
  const cable = 12.4 - hook[1];
  return (
    <group>
      <Box p={[base[0], 6, base[2]]} s={[0.6, 12, 0.6]} c="#C8962E" />
      <Box p={[base[0], 0.3, base[2]]} s={[2.4, 0.6, 2.4]} c="#3A3A3A" />
      <group position={top} rotation={[0, ang, 0]}>
        <Box p={[L / 2, 0.3, 0]} s={[L + 1.5, 0.45, 0.45]} c="#D8A436" />
        <Box p={[-1.6, 0.1, 0]} s={[1.4, 0.9, 0.9]} c="#4A4A4A" />
      </group>
      <Box p={[hook[0], hook[1] + cable / 2, hook[2]]} s={[0.04, cable, 0.04]} c="#1A1A1A" />
      <Box p={[hook[0], hook[1] + 0.12, hook[2]]} s={[0.25, 0.25, 0.12]} c="#2A2A2A" />
    </group>
  );
};

// khối sa thạch 9 tấn; xray 0..1 làm đá trong suốt dần, lộ các bộ xương Utahraptor lớn + nhỏ phát sáng bên trong
const MiniSkel: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <group scale={[s, s, s]}>
    <Glow p={[-0.55, 0.25, 0]} s={[0.25, 0.1, 0.1]} c={c} i={1.4} />
    {Array.from({ length: 6 }, (_, i) => <Glow key={i} p={[-0.35 + i * 0.12, 0.18, 0]} s={[0.1, 0.06, 0.06]} c={c} i={1.4} />)}
    {Array.from({ length: 7 }, (_, i) => <Glow key={`t${i}`} p={[0.38 + i * 0.12, 0.18 - i * 0.015, 0]} s={[0.1, 0.05, 0.05]} c={c} i={1.4} />)}
    {Array.from({ length: 4 }, (_, i) => <Glow key={`r${i}`} p={[-0.2 + i * 0.1, 0.06, 0]} s={[0.03, 0.22, 0.03]} c={c} i={1.4} />)}
    <Glow p={[0.25, -0.05, 0.05]} s={[0.05, 0.4, 0.05]} c={c} i={1.4} />
    <Glow p={[0.15, -0.3, 0.05]} s={[0.25, 0.04, 0.05]} c={c} i={1.4} />
  </group>
);
export const SandBlock: React.FC<{ xray: number }> = ({ xray }) => {
  const skels = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: 9 }, (_, i) => ({ p: [(r() - 0.5) * 2.2, 0.35 + r() * 0.9, (r() - 0.5) * 1.4] as V3, ry: r() * 6.3, rz: (r() - 0.5) * 1.2, s: i < 4 ? 0.9 + 0.2 * r() : 0.4 + 0.15 * r() }));
  }, []);
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow={xray < 0.5} receiveShadow>
        <boxGeometry args={[3.0, 1.6, 2.0]} />
        <meshStandardMaterial color="#B0815A" roughness={0.95} flatShading transparent opacity={1 - 0.8 * xray} depthWrite={xray < 0.5} />
      </mesh>
      <Box p={[0.6, 1.62, 0.3]} s={[1.2, 0.06, 0.9]} c="#9A6E4A" />
      {xray > 0.05 && skels.map((k, i) => (
        <group key={i} position={k.p} rotation={[0, k.ry, k.rz]}>
          <MiniSkel s={k.s} c={i < 4 ? "#F4E6C2" : "#BDE6F2"} />
        </group>
      ))}
      {/* dây đai treo */}
      {[-0.9, 0.9].map((x) => <Box key={x} p={[x, 0.8, 0]} s={[0.08, 1.64, 2.04]} c="#C24A2A" />)}
    </group>
  );
};

// mỏ đá: hố bậc thang bao quanh tâm (bán kính r)
export const Quarry: React.FC<{ r?: number }> = ({ r = 14 }) => {
  const steps = useMemo(() => {
    const out: { p: V3; s: V3; c: string }[] = [];
    const R = rng(12);
    for (let lv = 0; lv < 3; lv++) {
      const rad = r + lv * 3;
      const n = 22 + lv * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const h = 2 + lv * 2.2 + R() * 0.6;
        out.push({ p: [Math.cos(a) * rad, h / 2, Math.sin(a) * rad], s: [3.4, h, 3.4], c: lv % 2 ? "#9A6A48" : "#B07A52" });
      }
    }
    return out;
  }, [r]);
  return (
    <group>
      {steps.map((q, i) => <Box key={i} p={q.p} s={q.s} c={q.c} />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[r + 1, 40]} />
        <meshStandardMaterial color="#8E6444" roughness={1} />
      </mesh>
    </group>
  );
};

// hố cát lún: vành đá + mặt cát ướt bóng
export const QuickPit: React.FC<{ r?: number }> = ({ r = 5 }) => {
  const rim = useMemo(() => {
    const R = rng(4);
    return Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2;
      return { p: [Math.cos(a) * (r + 0.3), 0.15, Math.sin(a) * (r + 0.3)] as V3, s: 0.5 + R() * 0.7 };
    });
  }, [r]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[r, 40]} />
        <meshStandardMaterial color="#4A3C2E" roughness={0.25} metalness={0.15} />
      </mesh>
      {rim.map((q, i) => <Box key={i} p={q.p} s={[q.s, q.s * 0.5, q.s]} c={i % 2 ? "#5A4A3A" : "#6A5844"} />)}
    </group>
  );
};

// cuốc chim gõ xuống (tap 0..1: 1 = chạm đá)
export const IcePick: React.FC<{ tap: number }> = ({ tap }) => (
  <group rotation={[0, 0, 0.9 - 0.9 * tap]} position={[0.9, 0.35, 0]}>
    <Box p={[0, 0.55, 0]} s={[0.06, 1.1, 0.06]} c="#7A5A3A" />
    <Box p={[-0.15, 1.1, 0]} s={[0.5, 0.07, 0.07]} c="#9AA0A8" />
    <Box p={[-0.42, 1.06, 0]} s={[0.1, 0.05, 0.05]} c="#C8CED6" r={[0, 0, 0.4]} />
  </group>
);

// sân sau nhà ban đêm: bãi cỏ, nhà có cửa sổ sáng, hàng rào gỗ dọc trục Z ở x = fx; brk = thời điểm (s) một đoạn rào bị phá
export const Backyard: React.FC<{ t: number; fx?: number; brk?: number; brkZ?: number }> = ({ t, fx = 0, brk = 99, brkZ = 0 }) => {
  const planks = useMemo<Piece[]>(() => Array.from({ length: 5 }, (_, i) => ({ p: [fx, 0.75, brkZ - 0.6 + i * 0.3], s: [0.06, 1.5, 0.24], c: i % 2 ? "#8A6A4A" : "#9A7A56" })), [fx, brkZ]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#3A4630" roughness={1} />
      </mesh>
      {/* nhà */}
      <group position={[fx + 14, 0, 6]}>
        <Box p={[0, 2.6, 0]} s={[8, 5.2, 9]} c="#4A4440" />
        <group position={[0, 5.2, 0]}>
          <Box p={[0, 1.2, -2.3]} s={[8.6, 0.3, 5.4]} c="#2A2420" r={[-0.62, 0, 0]} />
          <Box p={[0, 1.2, 2.3]} s={[8.6, 0.3, 5.4]} c="#2A2420" r={[0.62, 0, 0]} />
        </group>
        {[[-4.02, 1.6, -2.2], [-4.02, 1.6, 2.2], [-4.02, 3.8, 0]].map((p, i) => <Glow key={i} p={p as V3} s={[0.05, 1.1, 1.3]} c="#FFC870" i={1.2} />)}
        <Box p={[-4.02, 1.1, 0]} s={[0.06, 2.2, 1.0]} c="#2A1E16" />
      </group>
      {/* hàng rào */}
      {Array.from({ length: 60 }, (_, i) => {
        const z = -15 + i * 0.3;
        if (Math.abs(z - brkZ) < 0.75 && t >= brk) return null;
        return <Box key={i} p={[fx, 0.75, z]} s={[0.06, 1.5, 0.24]} c={i % 2 ? "#8A6A4A" : "#9A7A56"} />;
      })}
      <Box p={[fx + 0.06, 1.2, 0]} s={[0.06, 0.1, 30]} c="#6A4E34" />
      <Box p={[fx + 0.06, 0.4, 0]} s={[0.06, 0.1, 30]} c="#6A4E34" />
      {t >= brk && <Shatter t={t} t0={brk} pieces={planks} force={4} seed={5} />}
      {/* bụi cây, xích đu */}
      {[[fx + 5, -6], [fx + 8, 9], [fx - 6, -9], [fx - 9, 7]].map(([x, z], i) => <Box key={i} p={[x, 0.6, z]} s={[1.6, 1.2, 1.4]} c="#1E2A18" />)}
    </group>
  );
};

// ánh trăng + đèn nhà cho sân sau
export const YardLights: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, z);
  return (
    <>
      <color attach="background" args={["#1A2230"]} />
      <fog attach="fog" args={["#1E2632", 14, 70]} />
      <hemisphereLight args={["#7A8AA8", "#262E20", 1.7]} />
      <primitive object={tgt} />
      <directionalLight position={[x - 12, 14, z + 8]} target={tgt} intensity={3.6} color="#C4D4EE" castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-0.0004} />
      <pointLight position={[x + 9, 2, z + 4]} intensity={30} distance={22} color="#FFB45A" />
    </>
  );
};
