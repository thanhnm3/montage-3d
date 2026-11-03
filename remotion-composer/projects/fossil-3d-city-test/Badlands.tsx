// Bối cảnh "đáng sợ" cho tập dài Top 5 khủng long: đất đá núi lửa tối, trời bão, chân trời đỏ than, núi lửa phát sáng xa xa,
// cây chết khối, tro bay. Đèn: ngược sáng cam phía sau (viền sáng), phụ sáng lạnh yếu phía máy.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box } from "./BlockAnimals";

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const noise = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (x: number, z: number) => {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = noise(xi, zi), b = noise(xi + 1, zi), c = noise(xi, zi + 1), d = noise(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x: number, z: number) => 0.5 * smooth(x, z) + 0.3 * smooth(x * 2.1, z * 2.1) + 0.2 * smooth(x * 4.3, z * 4.3);

export const BAD = { fog: "#2E2420", skyTop: "#14171D", skyHor: "#9A4422", rim: "#FF8A3A", fill: "#A9B6D0" };

// bảng màu (2026-10-30: "red" bị chê chói mắt -> thêm "storm" xám bão và "moon" đêm trăng lạnh, cùng độ tối/đáng sợ)
export type Pal = {
  fog: string; skyTop: string; skyHor: string; skyMid: string; cloud: string; rim: string; rimI: number; fill: string; hemiSky: string; hemiGround: string;
  basalt: string; ash: string; mud: string; ember: string; emberAmt: number; volcano: string; volcanoGlow: string; glowO: number;
  rock: [string, string, string]; tree: string; spark: string; dust: string;
};
export const PALS: Record<string, Pal> = {
  red: {
    fog: "#2E2420", skyTop: "#14171D", skyHor: "#9A4422", skyMid: "#3A2A2A", cloud: "#0C0E12", rim: "#FF8A3A", rimI: 4.2, fill: "#A9B6D0", hemiSky: "#7A86A2", hemiGround: "#3A2A20",
    basalt: "#2B2622", ash: "#4A4038", mud: "#5A3E2C", ember: "#6E2E18", emberAmt: 0.8, volcano: "#1E1A18", volcanoGlow: "#FF6A2A", glowO: 0.55,
    rock: ["#2E2824", "#3A322C", "#25201C"], tree: "#1C1714", spark: "#FF8A3A", dust: "#8A8078",
  },
  storm: {
    fog: "#25282C", skyTop: "#101318", skyHor: "#5C5650", skyMid: "#2A2D32", cloud: "#0A0C10", rim: "#E2CDAE", rimI: 3.6, fill: "#9DAEC6", hemiSky: "#7C8798", hemiGround: "#2A2724",
    basalt: "#2A2927", ash: "#464441", mud: "#4A4239", ember: "#5E3A24", emberAmt: 0.3, volcano: "#1A1A1A", volcanoGlow: "#C07A44", glowO: 0.22,
    rock: ["#2C2B29", "#383633", "#222120"], tree: "#18171A", spark: "#D9A26A", dust: "#86827C",
  },
  // ban ngày, hẻm núi sa thạch đỏ Utah (cảnh khai quật 1991, mỏ đá Stikes)
  canyon: {
    fog: "#B89A7E", skyTop: "#5E7A98", skyHor: "#D6B08A", skyMid: "#9AA2AA", cloud: "#7E8C9A", rim: "#FFE2B0", rimI: 3.4, fill: "#C2CEDC", hemiSky: "#C8D4E2", hemiGround: "#7A5A3A",
    basalt: "#9A5A36", ash: "#B87A4A", mud: "#8A4E2E", ember: "#7A4428", emberAmt: 0, volcano: "#7A4E34", volcanoGlow: "#000000", glowO: 0,
    rock: ["#8A4A2C", "#A45E38", "#6E3A22"], tree: "#3A2A20", spark: "#E8C8A0", dust: "#C8A27A",
  },
  moon: {
    fog: "#1A212B", skyTop: "#0A0F17", skyHor: "#34495C", skyMid: "#18222E", cloud: "#070A10", rim: "#B4CCEC", rimI: 3.4, fill: "#7A8CAA", hemiSky: "#62738F", hemiGround: "#1E2228",
    basalt: "#232629", ash: "#3A3E43", mud: "#33363A", ember: "#6A2E1A", emberAmt: 0.22, volcano: "#14171B", volcanoGlow: "#B65A2C", glowO: 0.25,
    rock: ["#272A2E", "#33373C", "#1E2124"], tree: "#14161A", spark: "#C9783E", dust: "#7C8290",
  },
};

// đèn tối: key ngược sáng từ phía sau con vật (so với máy), fill lạnh từ phía máy
export const BadLights: React.FC<{ x: number; z?: number; r?: number; cam?: [number, number, number]; fog?: [number, number]; dim?: number; flash?: number; pal?: string }> = ({ x, z = 0, r = 16, cam, fog = [25, 190], dim = 1, flash = 0, pal = "red" }) => {
  const P = PALS[pal] ?? PALS.red;
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, z);
  const cx = cam ? cam[0] - x : -10, cz = cam ? cam[2] - z : 10;
  const n = Math.hypot(cx, cz) || 1;
  const dx = cx / n, dz = cz / n;
  return (
    <>
      <fog attach="fog" args={[P.fog, fog[0], fog[1]]} />
      <hemisphereLight args={[P.hemiSky, P.hemiGround, 1.5 * dim + 6 * flash]} />
      <primitive object={tgt} />
      {/* ngược sáng: đối diện máy, thấp, cam */}
      <directionalLight position={[x - dx * 18 + dz * 6, 9, z - dz * 18 - dx * 6]} target={tgt} intensity={P.rimI} color={P.rim} castShadow shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-r} shadow-camera-right={r} shadow-camera-top={r} shadow-camera-bottom={-r} shadow-camera-far={80} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      {/* phụ sáng lạnh từ phía máy, chéo trên */}
      <directionalLight position={[x + dx * 14 - dz * 5, 7, z + dz * 14 + dx * 5]} target={tgt} intensity={2.6 * dim} color={P.fill} />
    </>
  );
};

export const Badlands: React.FC<{ t: number; pal?: string }> = ({ t, pal = "red" }) => {
  const P = PALS[pal] ?? PALS.red;
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(420, 420, 300, 300);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const basalt = new THREE.Color(P.basalt), ash = new THREE.Color(P.ash), mud = new THREE.Color(P.mud), ember = new THREE.Color(P.ember);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      pos.setY(i, Math.max(0, r - 18) * 0.02 * (fbm(x * 0.03, z * 0.03) - 0.3) * 6);
      const n = fbm(x * 0.25, z * 0.25), m = fbm(x * 0.06 + 9, z * 0.06);
      c.copy(basalt).lerp(ash, n).lerp(mud, THREE.MathUtils.smoothstep(m, 0.5, 0.75) * 0.6);
      // vết nứt đỏ than
      const crack = Math.abs(fbm(x * 0.12 + 3, z * 0.12) - 0.5);
      c.lerp(ember, THREE.MathUtils.smoothstep(0.025, 0.0, crack) * P.emberAmt);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [P]);

  const sky = useMemo(() => {
    const g = new THREE.SphereGeometry(320, 40, 20);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const top = new THREE.Color(P.skyTop), hor = new THREE.Color(P.skyHor), mid = new THREE.Color(P.skyMid), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 320, x = pos.getX(i) / 320, z = pos.getZ(i) / 320;
      c.copy(hor).lerp(mid, THREE.MathUtils.smoothstep(y, 0.0, 0.12)).lerp(top, THREE.MathUtils.smoothstep(y, 0.1, 0.5));
      // mây bão: mảng tối hơn
      const cl = fbm(Math.atan2(z, x) * 3 + 5, y * 8);
      c.lerp(new THREE.Color(P.cloud), THREE.MathUtils.smoothstep(cl, 0.45, 0.8) * THREE.MathUtils.smoothstep(y, 0.05, 0.3) * 0.7);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [P]);

  const rocks = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 60 }, () => {
      const a = r() * Math.PI * 2, d = 24 + r() * 90;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.4 + r() * r() * 2.5, ry: r() * 6.3, k: r() };
    });
  }, []);
  const trees = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2, d = 24 + r() * 70;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, h: 3 + r() * 4, ry: r() * 6.3, b: r() };
    });
  }, []);
  // tro bay: hạt nhỏ trôi chậm, lấp lánh đỏ
  const ash = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 140 }, () => ({ x: (r() - 0.5) * 70, y: r() * 14, z: (r() - 0.5) * 70, v: 0.2 + r() * 0.5, e: r() < 0.35 }));
  }, []);

  return (
    <>
      <mesh geometry={sky}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
      </mesh>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.97} />
      </mesh>
      {/* núi lửa xa + quầng sáng miệng núi */}
      {[[-150, -170, 60, 46], [170, -150, 46, 30], [-220, 90, 52, 26]].map(([x, z, w, h], i) => (
        <group key={i} position={[x, -2, z]}>
          <mesh scale={[w, h, w]}>
            <coneGeometry args={[1, 1, 7]} />
            <meshStandardMaterial color={P.volcano} roughness={1} />
          </mesh>
          {i === 0 && (
            <mesh position={[0, h * 0.5 + 1, 0]}>
              <sphereGeometry args={[7, 12, 8]} />
              <meshBasicMaterial color={P.volcanoGlow} fog={false} transparent opacity={P.glowO} />
            </mesh>
          )}
        </group>
      ))}
      {rocks.map((o, i) => (
        <group key={i} position={[o.x, o.s * 0.3, o.z]} rotation={[0, o.ry, 0]}>
          <Box p={[0, 0, 0]} s={[o.s * 1.3, o.s * 0.8, o.s]} c={o.k < 0.5 ? P.rock[0] : P.rock[1]} />
          <Box p={[o.s * 0.3, o.s * 0.45, 0.1 * o.s]} s={[o.s * 0.6, o.s * 0.5, o.s * 0.6]} c={P.rock[2]} />
        </group>
      ))}
      {trees.map((o, i) => (
        <group key={i} position={[o.x, 0, o.z]} rotation={[0, o.ry, 0]}>
          <Box p={[0, o.h / 2, 0]} s={[0.35, o.h, 0.35]} c={P.tree} />
          <group position={[0, o.h * 0.7, 0]} rotation={[0, 0, 0.8]}>
            <Box p={[0, o.h * 0.18, 0]} s={[0.18, o.h * 0.36, 0.18]} c={P.tree} />
          </group>
          <group position={[0, o.h * 0.55, 0]} rotation={[0.2, 0, -0.9 - 0.3 * o.b]}>
            <Box p={[0, o.h * 0.15, 0]} s={[0.16, o.h * 0.3, 0.16]} c={P.tree} />
          </group>
        </group>
      ))}
      {ash.map((a, i) => {
        const y = (a.y + t * a.v) % 14;
        const x = a.x + 1.2 * Math.sin(t * 0.4 + i);
        return (
          <mesh key={i} position={[x, y, a.z]}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            {a.e ? <meshBasicMaterial color={P.spark} /> : <meshStandardMaterial color={P.dust} />}
          </mesh>
        );
      })}
    </>
  );
};
