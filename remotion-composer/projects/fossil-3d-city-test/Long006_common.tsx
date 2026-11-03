// Phần dùng chung cho các cảnh của tập dài 006 (Long006_3D.tsx + Long006_act12.tsx).
import React from "react";
import { BlockTheropod, DINOS, DinoSpec, V3 } from "./BlockAnimals";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const sans = "Inter, 'Segoe UI', Arial, sans-serif";
export const mono = "'JetBrains Mono', Consolas, monospace";


// vị trí đầu (gần đúng) của một loài khi đứng ở gốc toạ độ, quay về -X
export const headOf = (S: DinoSpec): V3 => {
  const k = S.hip / 3.15;
  return [-(0.76 * S.body[0] + S.neck[0] * 0.8 + S.skull[0] * 0.5) - 0.2 * k, S.hip + 0.2 * k + S.body[1] * 0.3, 0];
};
// mút mõm và chóp đuôi theo trục X (gần đúng)
export const extent = (S: DinoSpec): [number, number] => {
  const k = S.hip / 3.15, L = S.tail.L, n = S.tail.n;
  return [headOf(S)[0] - S.skull[0] * 0.5 - S.snout[0], 0.2 * k + 0.244 * S.body[0] - 0.1 * k + L * (n - (0.047 * n * (n - 1)) / 2)];
};
export const BarGlow: React.FC<{ x0: number; x1: number; z: number; c: string }> = ({ x0, x1, z, c }) => (
  <mesh position={[(x0 + x1) / 2, 0.06, z]}>
    <boxGeometry args={[Math.max(0.01, x1 - x0), 0.08, 0.35]} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.5} />
  </mesh>
);
export const REX = DINOS.trex;
export const RH = headOf(REX);
export const RANK = ["utahraptor", "carnotaurus", "spinosaurus", "giganotosaurus", "trex"];

export type Shot = {
  env: "bad" | "plate" | "yard" | "city" | "river" | "lit" | "under" | "set"; cam: V3; look: V3; fov?: number; actors: React.ReactNode;
  plateX?: number; dim?: number; fog?: [number, number]; lightsAt?: number; pal?: string;
};

// góc 3/4 trước mặt một con, máy thấp (dùng cho loạt whip giới thiệu 4 đối thủ)
export function faceShot(sp: string, u: number, t: number, side = 1): Shot {
  const S = DINOS[sp];
  const k = S.hip / 3.15;
  const h = headOf(S);
  const R = 3.6 + 4.6 * k + S.snout[0] * 1.2;
  const a = -0.85 - 0.25 * u;
  return {
    env: "bad", fov: 36,
    cam: [h[0] + Math.sin(a) * R, h[1] - 0.9 * k, side * Math.cos(a) * R],
    look: [h[0] + 0.3, h[1] + 0.1, 0],
    actors: <BlockTheropod t={t} spec={S} walk={0} roar={pulse(u, 0.05, 0.95) * 0.9} />,
  };
}

