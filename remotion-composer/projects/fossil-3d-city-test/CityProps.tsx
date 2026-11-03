// Phố đêm khối cho ACT 3 tập dài 006 (Carnotaurus đua xe): đường chạy dọc trục X, ngã tư ở x = CROSS_X,
// nhà hai bên có cửa sổ sáng, cột đèn, xe hơi khối. Đất y = 0, đơn vị mét.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, Glow, V3 } from "./BlockAnimals";

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
export const CROSS_X = -120;
const X0 = -260, X1 = 80;
const LAMP_GAP = 20;

// xe hơi khối ~4,4 m, đầu xe hướng -X
export const BlockCar: React.FC<{ t: number; v?: number; c?: string; brake?: number; light?: boolean }> = ({ t, v = 0, c = "#2E5E8E", brake = 0, light = true }) => {
  const spin = -t * v * 2.6;
  return (
    <group>
      <Box p={[0, 0.62, 0]} s={[4.4, 0.66, 1.86]} c={c} />
      <Box p={[0.25, 1.22, 0]} s={[2.3, 0.6, 1.66]} c={c} />
      <Box p={[-0.95, 1.2, 0]} s={[0.06, 0.5, 1.5]} c="#9FB8D0" r={[0, 0, -0.5]} />
      <Box p={[0.25, 1.22, 0.84]} s={[1.9, 0.42, 0.02]} c="#7A90A8" />
      <Box p={[0.25, 1.22, -0.84]} s={[1.9, 0.42, 0.02]} c="#7A90A8" />
      {[[-1.4, 1], [-1.4, -1], [1.4, 1], [1.4, -1]].map(([x, z], i) => (
        <group key={i} position={[x, 0.36, z * 0.92]} rotation={[0, 0, spin]}>
          <Box p={[0, 0, 0]} s={[0.72, 0.72, 0.28]} c="#141414" />
          <Box p={[0, 0, z * 0.15]} s={[0.3, 0.3, 0.02]} c="#8A8A8A" />
        </group>
      ))}
      {[0.6, -0.6].map((z) => <Glow key={z} p={[-2.21, 0.72, z]} s={[0.04, 0.2, 0.42]} c="#FFF2C8" i={4} />)}
      {[0.65, -0.65].map((z) => <Glow key={z} p={[2.21, 0.75, z]} s={[0.04, 0.18, 0.4]} c="#FF2A1A" i={1.5 + 4 * brake} />)}
      {light && <pointLight position={[-3.2, 0.9, 0]} intensity={14} distance={16} color="#FFEBC0" />}
    </group>
  );
};

// cột đèn đường; hit > 0 thì cột nghiêng (bị đâm)
export const Lamppost: React.FC<{ hit?: number }> = ({ hit = 0 }) => (
  <group rotation={[0.35 * hit, 0, -0.25 * hit]}>
    <Box p={[0, 2.6, 0]} s={[0.16, 5.2, 0.16]} c="#3A3E44" />
    <Box p={[0, 5.15, -0.6]} s={[0.14, 0.12, 1.3]} c="#3A3E44" />
    <Glow p={[0, 5.02, -1.15]} s={[0.4, 0.08, 0.5]} c="#FFD9A0" i={3} />
  </group>
);

export const CityStreet: React.FC<{ hitLamp?: number }> = ({ hitLamp = 0 }) => {
  const blocks = useMemo(() => {
    const r = rng(19);
    const out: { x: number; z: number; w: number; d: number; h: number; c: string; win: { y: number; dx: number }[] }[] = [];
    for (const side of [1, -1]) {
      for (let x = X0; x < X1; ) {
        const w = 8 + r() * 8;
        if (Math.abs(x + w / 2 - CROSS_X) < 12) { x += w; continue; }
        const h = 6 + r() * 16, d = 8 + r() * 6;
        const win: { y: number; dx: number }[] = [];
        for (let y = 2.2; y < h - 1; y += 3) for (let dx = -w / 2 + 1.4; dx < w / 2 - 1; dx += 2.2) if (r() < 0.38) win.push({ y, dx });
        out.push({ x: x + w / 2, z: side * (9 + d / 2), w: w - 0.6, d, h, c: ["#2A2C34", "#33302E", "#24282E", "#3A3632"][Math.floor(r() * 4)], win });
        x += w;
      }
    }
    return out;
  }, []);
  const lamps = useMemo(() => {
    const out: V3[] = [];
    for (let x = X0; x < X1; x += LAMP_GAP) for (const z of [6.4, -6.4]) if (Math.abs(x - CROSS_X) > 6) out.push([x, 0, z]);
    return out;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#1A1C20" roughness={1} />
      </mesh>
      {/* mặt đường + vạch giữa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(X0 + X1) / 2, 0.005, 0]} receiveShadow>
        <planeGeometry args={[X1 - X0, 11]} />
        <meshStandardMaterial color="#2A2C30" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CROSS_X, 0.006, 0]} receiveShadow>
        <planeGeometry args={[11, 200]} />
        <meshStandardMaterial color="#2A2C30" roughness={0.85} />
      </mesh>
      {Array.from({ length: Math.floor((X1 - X0) / 6) }, (_, i) => X0 + i * 6).filter((x) => Math.abs(x - CROSS_X) > 7).map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, 0]}>
          <planeGeometry args={[3, 0.18]} />
          <meshStandardMaterial color="#C8B26A" emissive="#C8B26A" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {/* vỉa hè */}
      {[1, -1].map((s) => <Box key={s} p={[(X0 + X1) / 2, 0.08, s * 7.2]} s={[X1 - X0, 0.16, 3.2]} c="#4A4A4E" />)}
      {blocks.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <Box p={[0, b.h / 2, 0]} s={[b.w, b.h, b.d]} c={b.c} />
          {b.win.map((w, j) => <Glow key={j} p={[w.dx, w.y, -Math.sign(b.z) * (b.d / 2 + 0.02)]} s={[1.2, 1.3, 0.04]} c={j % 3 ? "#FFC870" : "#E8D2A0"} i={1.1} />)}
        </group>
      ))}
      {lamps.map((p, i) => (
        <group key={i} position={p} rotation={[0, p[2] > 0 ? 0 : Math.PI, 0]}>
          <Lamppost hit={Math.abs(p[0] - (CROSS_X - 8)) < 1 && p[2] < 0 ? hitLamp : 0} />
        </group>
      ))}
    </group>
  );
};

// ánh trăng + 4 đèn đường gần máy (point light đắt, chỉ bật quanh điểm nhìn)
export const CityLights: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, z);
  const base = Math.round(x / LAMP_GAP) * LAMP_GAP;
  return (
    <>
      <color attach="background" args={["#121828"]} />
      <fog attach="fog" args={["#1A2030", 18, 110]} />
      <hemisphereLight args={["#7080A0", "#202024", 1.3]} />
      <primitive object={tgt} />
      <directionalLight position={[x - 10, 18, z + 12]} target={tgt} intensity={2.4} color="#B8C8E8" castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-0.0004} />
      {[-LAMP_GAP, 0, LAMP_GAP].map((dx) => <pointLight key={dx} position={[base + dx, 4.8, dx % 40 ? 5.2 : -5.2]} intensity={45} distance={24} color="#FFC888" />)}
    </>
  );
};
