// Thú khối vuông (cùng kiểu BlockLion): toàn hộp màu phẳng, đầu về -X, đất y = 0, mọi chuyển động là hàm của t.
// BlockProboscid = voi châu Á <-> voi ma mút qua tham số `mammoth` (0..1) + lớp lông khối `fur` (0..1, mọc dần / bay đi).
import React from "react";

export type V3 = [number, number, number];
const TAU = Math.PI * 2;

export const Box: React.FC<{ p: V3; s: V3; c: string; r?: V3 }> = ({ p, s, c, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.88} flatShading />
  </mesh>
);

// khối phát sáng (mắt)
export const Glow: React.FC<{ p: V3; s: V3; c: string; i?: number }> = ({ p, s, c, i = 1.4 }) => (
  <mesh position={p}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} roughness={0.4} />
  </mesh>
);

const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const mix = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
  return "#" + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0");
};

// các khối lông: váy lông hai bên sườn, lưng, vai, đùi, đỉnh đầu (toạ độ con trưởng thành)
type Fur = { p: V3; s: V3; d: number; dir: V3 };
const FUR: Fur[] = (() => {
  const out: Fur[] = [];
  let i = 0;
  const add = (p: V3, s: V3, dir: V3) => out.push({ p, s, d: hash(i++), dir });
  for (let x = -1.15; x <= 1.2; x += 0.29) for (const z of [0.78, -0.78]) add([x, 1.3 - 0.08 * hash(i), z], [0.3, 0.62 + 0.2 * hash(i + 50), 0.18], [0, 0.4, Math.sign(z)]);
  for (let x = -1.0; x <= 1.1; x += 0.36) add([x, 2.86, 0], [0.4, 0.22, 1.2], [0, 1, 0]);
  for (const z of [0.5, -0.5]) for (const x of [-0.85, 0.85]) add([x, 0.95, z * 1.25], [0.62, 0.55, 0.22], [Math.sign(x) * 0.3, 0.2, Math.sign(z)]);
  add([-1.55, 3.0, 0], [0.55, 0.25, 0.7], [-0.3, 1, 0]);
  for (const z of [0.42, -0.42]) add([-1.7, 2.05, z], [0.5, 0.5, 0.14], [-0.4, 0, Math.sign(z)]);
  add([-0.7, 2.25, 0.8], [0.9, 0.5, 0.16], [0, 0.3, 1]);
  add([-0.7, 2.25, -0.8], [0.9, 0.5, 0.16], [0, 0.3, -1]);
  return out;
})();
export const FUR_COUNT = FUR.length;

type ProbProps = {
  t: number;
  walk?: number; // 0 đứng, 1 đi
  mammoth?: number; // 0 voi châu Á, 1 voi ma mút (đầu vồng, bướu vai, tai nhỏ, ngà dài)
  fur?: number; // tỉ lệ khối lông đang có (mọc theo thứ tự ngẫu nhiên)
  furPop?: number; // 0..1: lông bung ra rồi rơi mất
  tusks?: number; // chiều dài ngà (0 = không ngà)
  skin?: string;
  furColor?: string;
  phase?: number;
  period?: number;
  raise?: number; // 0..1: ngóc đầu, cuộn vòi lên, xoè tai (rống)
  furDrop?: boolean; // khối lông rơi từ trên xuống vào chỗ thay vì phóng to dần
  coat?: number; // ép mức nhuộm màu lông lên da (mặc định theo fur)
};

export const BlockProboscid: React.FC<ProbProps> = ({ t, walk = 1, mammoth = 0, fur = 0, furPop = 0, tusks = 0.3, skin = "#8E8C88", furColor = "#5B3A22", phase = 0, period = 1.8, raise = 0, furDrop = false, coat }) => {
  const ph = (TAU * t) / period + phase;
  const amp = 0.28 * walk;
  const bob = 0.03 * walk * Math.abs(Math.sin(ph));
  const furDark = mix(furColor, "#000000", 0.25);
  const bodyC = mix(skin, furColor, (coat ?? Math.min(1, fur * 1.2)) * (1 - furPop));
  const trunk = 0.18 * Math.sin((TAU * t) / 2.4 + phase) + 0.1 * walk * Math.sin(ph);
  const ear = 0.25 * (1 - mammoth) * (0.5 + 0.5 * Math.sin((TAU * t) / 3 + phase)) + 0.7 * raise * (1 - 0.5 * mammoth);
  const tail = 0.3 * Math.sin((TAU * t) / 2 + phase);
  const earS = 1 - 0.6 * mammoth;
  const legs: [number, number, number][] = [
    [-0.85, 0.48, ph + TAU * 0.25],
    [-0.85, -0.48, ph + TAU * 0.75],
    [0.85, 0.48, ph],
    [0.85, -0.48, ph + TAU * 0.5],
  ];
  const tusk = (s: number) => {
    const n = 5;
    const L = (0.95 * tusks) / n;
    const seg = (k: number): React.ReactNode =>
      k >= n ? null : (
        <group position={[-L, 0, 0]} rotation={[s * (0.12 + 0.12 * mammoth), 0, -0.2 - 0.18 * mammoth * k]}>
          <Box p={[-L / 2, 0, 0]} s={[L * 1.15, 0.13 - k * 0.016, 0.13 - k * 0.016]} c="#EFE6CF" />
          {seg(k + 1)}
        </group>
      );
    return tusks > 0.02 ? <group position={[-1.95, 2.0, s * 0.27]} rotation={[0, 0, 1.15]}>{seg(0)}</group> : null;
  };
  // vòi: 6 đốt lồng nhau, mỗi đốt cong thêm một chút
  const trunkSeg = (k: number): React.ReactNode =>
    k >= 6 ? null : (
      <group position={[0, k === 0 ? 0 : -0.3, 0]} rotation={[0, 0, (k === 0 ? 0 : 0.1) + trunk * 0.35 * (1 - raise) - raise * (k === 0 ? 0.5 : 0.55)]}>
        <Box p={[0, -0.15, 0]} s={[0.34 - k * 0.03, 0.34, 0.34 - k * 0.03]} c={k < 2 ? bodyC : skin} />
        {trunkSeg(k + 1)}
      </group>
    );
  return (
    <group position={[0, bob, 0]}>
      {/* thân: voi ma mút lưng dốc về sau */}
      <group rotation={[0, 0, -0.08 * mammoth]}>
        <Box p={[0, 2.0, 0]} s={[2.6, 1.6, 1.5]} c={bodyC} />
        {mammoth > 0.02 && <Box p={[-0.75, 2.85, 0]} s={[1.1, 0.45 * mammoth, 1.3]} c={bodyC} />}
      </group>
      {legs.map(([x, z, p], i) => {
        const sw = -amp * Math.sin(p);
        return (
          <group key={i} position={[x, 1.3, z]} rotation={[0, 0, sw]}>
            <Box p={[0, -0.62, 0]} s={[0.5, 1.25, 0.5]} c={bodyC} />
            <Box p={[0, -1.23, 0]} s={[0.56, 0.14, 0.56]} c={mix(skin, "#000000", 0.2)} />
          </group>
        );
      })}
      {/* đuôi */}
      <group position={[1.3, 2.4, 0]} rotation={[tail, 0, -0.35]}>
        <Box p={[0.08, -0.4, 0]} s={[0.1, 0.8, 0.1]} c={bodyC} />
        <Box p={[0.1, -0.85, 0]} s={[0.16, 0.2, 0.16]} c="#2C2622" />
      </group>
      {/* đầu */}
      <group position={[-1.55, 2.45, 0]} rotation={[0, 0, -0.25 * raise]}>
        <Box p={[0, 0, 0]} s={[0.95, 1.05, 1.0]} c={bodyC} />
        {mammoth > 0.02 && <Box p={[0.1, 0.62, 0]} s={[0.7, 0.4 * mammoth, 0.8]} c={bodyC} />}
        {/* tai */}
        {[1, -1].map((s) => (
          <group key={s} position={[0.35, 0.1, s * 0.52]} rotation={[s * ear, 0, 0]}>
            <Box p={[0.15 * earS, 0, s * 0.3 * earS]} s={[0.1, 0.9 * earS, 0.6 * earS]} c={mix(skin, "#6E5A55", 0.3)} />
          </group>
        ))}
        {/* mắt */}
        <Box p={[-0.48, 0.18, 0.3]} s={[0.04, 0.1, 0.1]} c="#151010" />
        <Box p={[-0.48, 0.18, -0.3]} s={[0.04, 0.1, 0.1]} c="#151010" />
        <group position={[-0.42, -0.25, 0]}>{trunkSeg(0)}</group>
      </group>
      {tusk(1)}
      {tusk(-1)}
      {/* lông khối: hiện dần theo `fur`, bung ra + rơi theo `furPop` */}
      {FUR.map((b, i) => {
        if (b.d > fur) return null;
        const grow = Math.min(1, (fur - b.d) * 8);
        const fly = Math.max(0, Math.min(1, furPop * 1.6 - b.d * 0.6));
        if (fly >= 1) return null;
        const drop = furDrop ? 6 * (1 - grow) ** 2 : 0;
        const p: V3 = [b.p[0] + b.dir[0] * fly * 1.2, b.p[1] + drop + b.dir[1] * fly * 1.5 - 3.2 * fly * fly, b.p[2] + b.dir[2] * fly * 1.6];
        const sc = (furDrop ? 1 : grow) * (1 - fly * 0.6);
        return (
          <group key={i} position={p} rotation={[fly * 2 * (b.d - 0.5), fly * 3 * b.d, fly * 2]} scale={sc}>
            <Box p={[0, 0, 0]} s={b.s} c={i % 3 === 0 ? furDark : furColor} />
          </group>
        );
      })}
    </group>
  );
};

// chuột (đơn vị mét thật, ~10 cm), lông dài vàng tuỳ chọn
export const BlockMouse: React.FC<{ t: number; golden?: boolean; phase?: number }> = ({ t, golden, phase = 0 }) => {
  const c = golden ? "#D9A84E" : "#8D8A86";
  const sniff = 0.006 * Math.sin((TAU * t) / 0.35 + phase);
  const tail = 0.4 * Math.sin((TAU * t) / 1.6 + phase);
  const hair = golden ? [-0.03, -0.01, 0.01, 0.03].flatMap((x) => [0.028, -0.028].map((z) => ({ x, z }))) : [];
  return (
    <group>
      <Box p={[0, 0.035, 0]} s={[0.08, 0.05, 0.05]} c={c} />
      <group position={[-0.05 + sniff, 0.04, 0]}>
        <Box p={[0, 0, 0]} s={[0.035, 0.035, 0.035]} c={c} />
        <Box p={[-0.022, -0.004, 0]} s={[0.012, 0.012, 0.014]} c="#E59A9A" />
        <Box p={[0.004, 0.024, 0.014]} s={[0.006, 0.02, 0.018]} c="#E8B3AE" />
        <Box p={[0.004, 0.024, -0.014]} s={[0.006, 0.02, 0.018]} c="#E8B3AE" />
        <Box p={[-0.012, 0.008, 0.017]} s={[0.006, 0.006, 0.004]} c="#111" />
        <Box p={[-0.012, 0.008, -0.017]} s={[0.006, 0.006, 0.004]} c="#111" />
      </group>
      {[[-0.025, 0.018], [-0.025, -0.018], [0.025, 0.018], [0.025, -0.018]].map(([x, z], i) => (
        <Box key={i} p={[x, 0.006, z]} s={[0.014, 0.012, 0.012]} c="#E8B3AE" />
      ))}
      <group position={[0.04, 0.025, 0]} rotation={[0, tail, 0]}>
        <Box p={[0.04, 0, 0]} s={[0.08, 0.006, 0.006]} c="#E8B3AE" />
      </group>
      {hair.map((h, i) => (
        <Box key={i} p={[h.x, 0.028, h.z]} s={[0.022, 0.05, 0.012]} c={i % 2 ? "#E8BE62" : "#C4923A"} r={[Math.sign(h.z) * 0.3, 0, 0]} />
      ))}
    </group>
  );
};

// kim tự tháp bậc thang
export const BlockPyramid: React.FC<{ size: number }> = ({ size }) => {
  const N = 9;
  return (
    <group>
      {Array.from({ length: N }, (_, i) => {
        const w = size * (1 - i / N);
        const h = (size * 0.64) / N;
        return <Box key={i} p={[0, h * (i + 0.5), 0]} s={[w, h, w]} c={i % 2 ? "#D8B878" : "#CDAA68"} />;
      })}
    </group>
  );
};

// thông khối
export const BlockPine: React.FC<{ h: number }> = ({ h }) => (
  <group>
    <Box p={[0, h * 0.12, 0]} s={[h * 0.08, h * 0.24, h * 0.08]} c="#4A3626" />
    {[0, 1, 2].map((i) => (
      <Box key={i} p={[0, h * (0.32 + i * 0.22), 0]} s={[h * (0.42 - i * 0.11), h * 0.22, h * (0.42 - i * 0.11)]} c={i === 2 ? "#E8EEF0" : i ? "#3E5A44" : "#365040"} />
    ))}
  </group>
);

// Khủng long chân thú khối (T. rex, Giganotosaurus, Carnotaurus, Spinosaurus, Utahraptor): hai chân, đầu về -X, đất y = 0, mét thật.
// Mỗi loài là một DinoSpec; T. rex là bản gốc đã duyệt (2026-10-30), các loài khác co giãn từ cùng khung.
// Đầu về -X nên rotation z > 0 làm phần trước chúi XUỐNG (há hàm = +z, ngóc cổ = -z).
export type DinoSpec = {
  hip: number; // chiều cao hông (T. rex 3.15); cả chân co giãn đều theo hip / 3.15
  legW?: number; // độ dày chân so với T. rex
  body: V3; // dài, cao, rộng thân
  tilt?: number; // độ chúi thân lúc nghỉ (âm = ngóc phần trước)
  neck: V3;
  neckUp?: number;
  skull: V3;
  snout: V3;
  arm: [number, number]; // dài cánh tay trên, độ dày
  claws?: number; // số vuốt tay (0 = tay cụt kiểu Carnotaurus)
  tail: { n: number; L: number; h: number; w: number; stiff?: number; fin?: number };
  skin: string;
  back: string;
  belly: string;
  accent?: string;
  teeth?: number; // răng hàm trên mỗi bên
  horns?: number; // sừng trên mắt (m)
  sail?: number; // buồm lưng cao nhất (m)
  feathers?: boolean;
  sickle?: number; // vuốt liềm ngón 2 (m)
  scutes?: boolean; // hàng vảy gai dọc sườn
  stripes?: boolean; // sọc ngang lưng
  period?: number; // chu kỳ bước (s)
  eye?: string; // màu mắt phát sáng
};

export const DINOS: Record<string, DinoSpec> = {
  trex: {
    hip: 3.15, body: [3.9, 1.75, 1.5], tilt: -0.06, neck: [0.9, 1.2, 1.0], neckUp: 0.3, skull: [1.3, 0.8, 0.86], snout: [0.7, 0.58, 0.62],
    arm: [0.48, 0.18], claws: 2, tail: { n: 7, L: 0.85, h: 1.15, w: 1.0 }, skin: "#635D43", back: "#2E2B20", belly: "#B9A47C", eye: "#FFB21F", teeth: 7, period: 1.6,
  },
  giganotosaurus: {
    hip: 3.2, legW: 0.92, body: [4.0, 1.6, 1.3], tilt: -0.05, neck: [1.0, 1.1, 0.92], neckUp: 0.3, skull: [1.55, 0.78, 0.7], snout: [0.8, 0.55, 0.54],
    arm: [0.68, 0.2], claws: 3, tail: { n: 7, L: 0.95, h: 1.05, w: 0.9 }, skin: "#76695A", back: "#3A332B", belly: "#C9BB9A", accent: "#211D19", eye: "#FFD23A", teeth: 9, stripes: true, period: 1.65,
  },
  carnotaurus: {
    hip: 2.4, legW: 0.82, body: [3.0, 1.3, 1.05], tilt: -0.05, neck: [0.75, 0.9, 0.75], neckUp: 0.25, skull: [0.85, 0.75, 0.74], snout: [0.36, 0.58, 0.58],
    arm: [0.22, 0.14], claws: 0, tail: { n: 7, L: 0.74, h: 0.85, w: 0.7 }, skin: "#6E2A1C", back: "#36130C", belly: "#C99D74", accent: "#D9B44A", eye: "#FF5A1F", teeth: 6, horns: 0.48, scutes: true, period: 1.2,
  },
  spinosaurus: {
    hip: 2.3, legW: 0.9, body: [4.6, 1.5, 1.2], tilt: 0.0, neck: [1.35, 0.8, 0.7], neckUp: 0.45, skull: [0.9, 0.55, 0.56], snout: [1.15, 0.32, 0.34],
    arm: [0.85, 0.25], claws: 3, tail: { n: 8, L: 0.8, h: 0.7, w: 0.45, fin: 0.55 }, skin: "#4A5A50", back: "#232D28", belly: "#BDB59A", accent: "#8E2A1E", eye: "#E8FF4A", teeth: 10, sail: 1.7, period: 1.45,
  },
  // con mồi ăn cỏ (kiểu Iguanodon nhỏ) cho cảnh hố cát lún tập 006
  iguanodon: {
    hip: 1.9, legW: 1.05, body: [3.2, 1.35, 1.15], tilt: 0.02, neck: [0.9, 0.6, 0.5], neckUp: 0.35, skull: [0.62, 0.42, 0.38], snout: [0.42, 0.3, 0.3],
    arm: [0.75, 0.22], claws: 3, tail: { n: 7, L: 0.8, h: 0.75, w: 0.65, stiff: 0.3 }, skin: "#5E6A48", back: "#3A4430", belly: "#B8B49A", eye: "#8A7A3A", teeth: 0, period: 1.3,
  },
  utahraptor: {
    hip: 1.55, legW: 1.1, body: [2.3, 0.95, 0.85], tilt: -0.05, neck: [0.75, 0.5, 0.45], neckUp: 0.7, skull: [0.6, 0.36, 0.36], snout: [0.36, 0.26, 0.26],
    arm: [0.6, 0.13], claws: 3, tail: { n: 7, L: 0.6, h: 0.5, w: 0.45, stiff: 0.6 }, skin: "#54412F", back: "#241B14", belly: "#CFC3AC", accent: "#C25A22", eye: "#FFC21F", teeth: 6, feathers: true, sickle: 0.24, period: 1.0,
  },
};

type TheropodProps = {
  t: number;
  spec: DinoSpec;
  walk?: number; // 0 đứng, 1 đi
  roar?: number; // ngóc đầu + há hàm + xoè tay
  bite?: number; // cúi đầu đớp
  look?: number; // quay đầu sang ±Z (rad)
  phase?: number;
  period?: number;
  skin?: string; // ghi đè màu
  stalk?: number; // 0..1: cúi cổ, đầu chĩa tới, mắt nhìn thẳng (tư thế rình mồi)
  eyeI?: number; // 0 = mắt tắt (tối), 1 = sáng bình thường; > 1 sáng hơn
  flap?: number; // 0..1: hai tay vẫy lia lịa (gag tay cụt vô dụng)
};

const span = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / Math.max(1, n - 1));

export const BlockTheropod: React.FC<TheropodProps> = ({ t, spec: S, walk = 1, roar = 0, bite = 0, look = 0, phase = 0, period, skin: skinO, stalk = 0.5, eyeI = 1, flap = 0 }) => {
  const s = S.hip / 3.15;
  const lw = S.legW ?? 1;
  const skin = skinO ?? S.skin, back = S.back, belly = S.belly, acc = S.accent ?? S.back;
  const dark = mix(skin, "#000000", 0.3);
  const per = period ?? S.period ?? 1.6;
  const ph = (TAU * t) / per + phase;
  const breathe = 0.03 * s * Math.sin((TAU * t) / 3.2 + phase);
  const bob = 0.09 * s * walk * Math.abs(Math.cos(ph));
  const roll = 0.03 * walk * Math.sin(ph);
  const jaw = (0.1 + 0.08 * (0.5 + 0.5 * Math.sin((TAU * t) / 2.7 + phase))) * (1 - roar) + 0.88 * roar + 0.6 * bite; // luôn hé hàm, nhe răng
  const nod = 0.05 * walk * Math.sin(2 * ph);
  const stiff = S.tail.stiff ?? 0;
  const tailSway = (0.12 * Math.sin((TAU * t) / (per * 2) + phase) * (0.4 + walk) + 0.1 * roar * Math.sin(TAU * t * 1.5)) * (1 - stiff);
  const [bL, bH, bW] = S.body;
  const backEdge = 0.244 * bL, front = backEdge - bL, bx = backEdge - bL / 2;
  const [nL, nH, nW] = S.neck, nUp = S.neckUp ?? 0.3;
  const [kL, kH, kW] = S.skull, [sL, sH, sW] = S.snout;
  const yb = 0.05 - kH / 2;
  const hf = 0.2 - kL - sL; // đầu mõm
  const JL = -hf + 0.05;
  const ts = sH / 0.58;
  const tz = sW / 2 - 0.035 * ts;
  const claw = "#2A221C";
  const jh = Math.min(1, ts * 1.2);
  const jw = Math.min(kW, sW * 1.3);
  const nT = S.teeth ?? 7;
  const teeth = (y: number, xs: number[], down: boolean) =>
    xs.flatMap((x, i) => [1, -1].map((z) => {
      const len = (i === 1 || i === 3 ? 0.3 : 0.17 + 0.08 * hash(i * 7 + (down ? 1 : 2))) * ts;
      const dy = down ? -1 : 1;
      const c = i === 1 || i === 3 ? "#F4ECD2" : "#E2D6B2";
      // răng nanh nhọn: chân to + mũi nhỏ
      return (
        <group key={`${x}${z}`} position={[x, y, z * tz]}>
          <Box p={[0, dy * len * 0.3, 0]} s={[0.09 * ts, len * 0.6, 0.08 * ts]} c={c} />
          <Box p={[-0.008 * ts, dy * len * 0.78, 0]} s={[0.045 * ts, len * 0.44, 0.04 * ts]} c={c} />
        </group>
      );
    }));

  // chân (khung T. rex, co giãn đều theo s): đùi chúi tới, ống chân chéo về sau, bàn chân dựng
  const leg = (side: number, p: number) => {
    const sw = -0.32 * walk * Math.sin(p);
    const lift = walk * Math.max(0, Math.cos(p)) ** 2;
    return (
      <group key={side} position={[0.15 * s, S.hip, side * Math.max(0.62 * s, bW * 0.4)]} rotation={[0, 0, -0.35 + sw]} scale={s}>
        <Box p={[0, -0.55, 0]} s={[0.95 * lw, 1.5, 0.62 * lw]} c={skin} />
        {S.feathers && <Box p={[0.05, -0.35, 0]} s={[1.05 * lw, 0.9, 0.7 * lw]} c={back} />}
        <group position={[0, -1.25, 0]} rotation={[0, 0, 0.75 + 0.55 * lift]}>
          <Box p={[0, -0.6, 0]} s={[0.42 * lw, 1.3, 0.4 * lw]} c={skin} />
          <group position={[0, -1.22, 0]} rotation={[0, 0, -0.6 - 0.45 * lift]}>
            <Box p={[0, -0.35, 0]} s={[0.3 * lw, 0.8, 0.32 * lw]} c={dark} />
            <group position={[0, -0.72, 0]} rotation={[0, 0, 0.2 - 0.25 * lift - sw]}>
              <Box p={[-0.28, -0.06, 0]} s={[0.7, 0.14, 0.5 * lw]} c={dark} />
              {[-0.16, 0, 0.16].map((z) => <Box key={z} p={[-0.72, -0.1, z * lw]} s={[0.24, 0.12, 0.09]} c={claw} r={[0, 0, 0.35]} />)}
              {S.sickle && (
                <group position={[-0.3, 0.02, side * 0.12 * lw]} rotation={[0, 0, -0.55]}>
                  <Box p={[0, (0.5 * S.sickle) / s, 0]} s={[0.1, S.sickle / s, 0.08]} c="#EFE7D2" />
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
    );
  };

  // đuôi: n đốt lồng nhau, thu nhỏ dần, lắc ngang
  const T = S.tail;
  const segL = (k: number) => T.L * (1 - 0.047 * k);
  const tailSeg = (k: number): React.ReactNode => {
    if (k >= T.n) return null;
    const L = segL(k);
    const g = 1 - (0.91 * k) / T.n;
    const h = T.h * g, w = T.w * g;
    const fin = T.fin ? T.fin * (0.6 + 0.4 * Math.sin((Math.PI * (k + 1)) / (T.n + 1))) : 0;
    const last = k === T.n - 1;
    return (
      <group position={[k === 0 ? 0 : segL(k - 1), 0, 0]} rotation={[0, tailSway * (0.5 + k * 0.18), k === 0 ? -0.12 : 0.05 * Math.sin((TAU * t) / 3 + k) * (1 - stiff)]}>
        <Box p={[L / 2, 0, 0]} s={[L + 0.04, h, w]} c={skin} />
        <Box p={[L / 2, h / 2 + 0.03 * s, 0]} s={[L * 0.6, 0.08 * s, w * 0.55]} c={back} />
        {fin > 0 && <Box p={[L / 2, h / 2 + fin * 0.55, 0]} s={[L + 0.02, fin * 1.1, 0.08]} c={k % 2 ? acc : back} />}
        {fin > 0 && <Box p={[L / 2, -h / 2 - fin * 0.3, 0]} s={[L + 0.02, fin * 0.6, 0.08]} c={back} />}
        {S.stripes && k % 2 === 0 && <Box p={[L / 2, h * 0.2, 0]} s={[L * 0.35, h * 0.62, w + 0.02]} c={acc} />}
        {S.feathers && <Box p={[L / 2, h * 0.15, 0]} s={[L + 0.02, h * 0.8, w * 1.25]} c={k % 2 ? back : mix(back, skin, 0.4)} />}
        {S.feathers && last && <Box p={[L * 1.1, 0, 0]} s={[L * 1.4, 0.06, w * 3.2]} c={acc} />}
        {tailSeg(k + 1)}
      </group>
    );
  };

  // buồm lưng (Spinosaurus): các tấm mỏng, cao nhất ở giữa
  const sailN = 11;
  const sail = S.sail
    ? span(front + 0.12 * bL, backEdge - 0.12 * bL, sailN).map((x, i) => {
        const u = i / (sailN - 1);
        const hh = S.sail! * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * u)), 0.8);
        const wx = (0.76 * bL) / (sailN - 1) + 0.02;
        return (
          <group key={x}>
            <Box p={[x, bH / 2 + hh / 2, 0]} s={[wx, hh, 0.12]} c={i % 2 ? acc : mix(acc, "#000000", 0.18)} />
            <Box p={[x, bH / 2 + hh - 0.05, 0]} s={[wx, 0.1, 0.14]} c={mix(acc, "#FFE0A0", 0.35)} />
          </group>
        );
      })
    : null;

  const nC = S.claws ?? 2;
  const aL = S.arm[0], aT = S.arm[1];
  return (
    <group position={[0, bob, 0]} rotation={[roll, 0, 0]}>
      {leg(1, ph)}
      {leg(-1, ph + Math.PI)}
      {/* thân */}
      <group position={[0.2 * s, S.hip + 0.2 * s, 0]} rotation={[0, 0, (S.tilt ?? -0.06) + 0.04 * stalk * (1 - roar) - 0.08 * roar + 0.06 * bite]}>
        <Box p={[bx, 0, 0]} s={[bL, bH + breathe, bW + breathe]} c={skin} />
        <Box p={[bx - 0.128 * bL, -bH / 2 + 0.015, 0]} s={[0.67 * bL, 0.12 * s, 0.8 * bW]} c={belly} />
        <Box p={[bx - 0.05 * bL, bH / 2 + 0.025, 0]} s={[0.74 * bL, 0.1 * s, 0.53 * bW]} c={back} />
        {!S.sail && !S.feathers && span(front + 0.06 * bL, front + 0.92 * bL, 9).map((x, i) => (
          <group key={x}>
            <Box p={[x, bH / 2 + 0.1 * s, 0]} s={[0.26 * s, 0.16 * s, 0.24 * s]} c={back} />
            <Box p={[x - 0.03 * s, bH / 2 + (0.22 + 0.04 * (i % 2)) * s, 0]} s={[0.12 * s, 0.14 * s, 0.1 * s]} c={mix(back, "#000000", 0.25)} />
          </group>
        ))}
        {S.stripes && span(front + 0.25 * bL, front + 0.9 * bL, 4).map((x) => <Box key={x} p={[x, bH * 0.2, 0]} s={[0.07 * bL, bH * 0.62, bW + 0.03]} c={acc} />)}
        {S.scutes && [1, -1].flatMap((z) => span(front + 0.15 * bL, front + 0.92 * bL, 7).flatMap((x, i) => [
          <Box key={`a${x}${z}`} p={[x, bH * 0.3, z * (bW / 2 + 0.03)]} s={[0.12, 0.1, 0.08]} c={acc} />,
          <Box key={`b${x}${z}`} p={[x + 0.12, bH * 0.05 - (i % 2) * 0.05, z * (bW / 2 + 0.03)]} s={[0.1, 0.08, 0.07]} c={back} />,
        ]))}
        {S.feathers && <Box p={[bx, bH * 0.12, 0]} s={[bL * 1.03, bH * 0.86, bW * 1.08]} c={mix(back, skin, 0.3)} />}
        {S.feathers && span(front + 0.05 * bL, backEdge - 0.05 * bL, 7).map((x, i) => (
          <Box key={x} p={[x, bH / 2 + 0.06, 0]} s={[0.22, 0.14, bW * 0.7]} c={i % 2 ? back : acc} r={[0, 0, 0.3]} />
        ))}
        {sail}
        {/* tay */}
        {[1, -1].map((z) => (
          <group key={z} position={[front + 0.13 * bL, nC > 0 ? -0.26 * bH : -0.42 * bH, z * (nC > 0 ? bW / 2 - 0.03 : bW / 2 + aT * 0.4)]} rotation={[z * 0.25 * roar, 0, -0.3 + 0.1 * Math.sin((TAU * t) / 2 + z) - 0.5 * roar + flap * 0.9 * Math.sin(TAU * t * 6 + z * 1.3)]}>
            <Box p={[0, -aL / 2.2, 0]} s={[aT, aL, aT * 0.9]} c={skin} />
            {nC > 0 && (
              <group position={[0, -aL * 0.92, 0]} rotation={[0, 0, -0.7]}>
                <Box p={[0, -aL * 0.33, 0]} s={[aT * 0.8, aL * 0.71, aT * 0.72]} c={skin} />
                {S.feathers && <Box p={[0.1, -aL * 0.3, 0]} s={[0.2, aL * 0.9, 0.04]} c={back} />}
                {span(-0.28 * aT, 0.28 * aT, nC).map((cz) => (
                  <Box key={cz} p={[-0.06, -aL * 0.8, cz]} s={[0.33 * aT, aL * 0.3, 0.22 * aT]} c={claw} r={[0, 0, -0.35]} />
                ))}
              </group>
            )}
          </group>
        ))}
        {/* cổ + đầu */}
        <group position={[front + 0.05, 0.2 * bH, 0]} rotation={[0, look, -nUp + 0.24 * stalk * (1 - roar) - 0.25 * roar + 0.3 * bite + nod]}>
          <Box p={[-0.39 * nL, 0.083 * nH, 0]} s={[nL, nH, nW]} c={skin} />
          {S.feathers && <Box p={[-0.39 * nL, 0.2 * nH, 0]} s={[nL * 1.02, nH * 0.9, nW * 1.15]} c={mix(back, skin, 0.3)} />}
          {S.sail && <Box p={[-0.3 * nL, nH / 2 + 0.12, 0]} s={[nL * 0.7, 0.25, 0.1]} c={acc} />}
          <group position={[-0.78 * nL, 0.29 * nH, 0]} rotation={[0, 0, nUp - 0.2 * stalk * (1 - roar) - 0.3 * roar + 0.3 * bite - nod]}>
            <Box p={[0.1 - kL / 2, 0.05, 0]} s={[kL, kH, kW]} c={skin} />
            <Box p={[0.1 - kL / 2, 0.05 + kH / 2 + 0.02, 0]} s={[0.85 * kL, 0.06 * ts, 0.58 * kW]} c={back} />
            <Box p={[0.2 - kL - sL / 2, yb + sH / 2 + 0.04 * ts, 0]} s={[sL, sH, sW]} c={skin} />
            <Box p={[hf - 0.01, yb + sH * 0.8, 0]} s={[0.04, 0.08 * ts, 0.48 * sW]} c="#2A2418" />
            {S.feathers && <Box p={[0.15 - kL / 2, 0.05 + kH / 2 + 0.06, 0]} s={[0.5 * kL, 0.12, 0.3 * kW]} c={acc} r={[0, 0, 0.4]} />}
            {[1, -1].map((z) => (
              <group key={z}>
                {/* gờ mày chéo xuống phía mõm (mắt cau có) */}
                <Box p={[0.1 - 0.7 * kL, 0.05 + 0.43 * kH, z * 0.45 * kW]} s={[0.44 * kL, 0.19 * kH, 0.26 * kW]} c={dark} r={[0, 0, 0.36]} />
                <Box p={[0.1 - 0.7 * kL, 0.05 + 0.3 * kH, z * (kW / 2 + 0.004)]} s={[0.28 * kL, 0.2 * kH, 0.015]} c="#120C08" />
                <Glow p={[0.1 - 0.7 * kL, 0.05 + 0.29 * kH, z * (kW / 2 + 0.012)]} s={[0.2 * kL, 0.13 * kH, 0.012]} c={mix("#120C08", S.eye ?? "#FFB21F", Math.min(1, eyeI))} i={4 * eyeI} />
                <Box p={[0.1 - 0.7 * kL, 0.05 + 0.29 * kH, z * (kW / 2 + 0.02)]} s={[0.03 * kL, 0.13 * kH, 0.008]} c="#0A0604" />
                {/* cơ hàm phồng hai bên */}
                <Box p={[0.05 - 0.2 * kL, yb + 0.14 * kH, z * (kW / 2 + 0.03)]} s={[0.36 * kL, 0.34 * kH, 0.08]} c={skin} />
                {z === 1 && <Box p={[0.2 - kL - 0.45 * sL, yb + 0.62 * sH, sW / 2 + 0.006]} s={[0.36 * sL, 0.025, 0.008]} c="#C9A88C" r={[0, 0, 0.55]} />}
                {z === 1 && <Box p={[0.1 - 0.35 * kL, 0.05 + 0.1 * kH, kW / 2 + 0.035]} s={[0.3 * kL, 0.022, 0.008]} c="#C9A88C" r={[0, 0, -0.4]} />}
                {S.horns && (
                  <group position={[0.15 - 0.7 * kL, 0.05 + kH / 2, z * 0.3 * kW]} rotation={[z * 0.5, 0, 0.15]}>
                    <Box p={[0, S.horns / 2, 0]} s={[0.22, S.horns, 0.2]} c={mix(dark, "#E8D8B0", 0.55)} />
                    <Box p={[0, S.horns + 0.04, 0]} s={[0.14, 0.1, 0.13]} c={mix(dark, "#E8D8B0", 0.55)} />
                  </group>
                )}
              </group>
            ))}
            {teeth(yb + 0.02, span(hf + 0.15 * ts, -0.35 * kL, nT), true)}
            <Box p={[(hf + 0.08) / 2 - 0.02, yb + 0.02, 0]} s={[-hf - 0.06, 0.04 * ts, 0.68 * sW]} c="#4A1414" />
            <group position={[0.05, yb + 0.03, 0]} rotation={[0, 0, jaw]}>
              <Box p={[-JL / 2 + 0.075, -0.2 * kH * jh, 0]} s={[JL, 0.375 * kH * jh, 0.81 * jw]} c={skin} />
              <Box p={[-JL / 2 + 0.075, -0.375 * kH * jh, 0]} s={[0.86 * JL, 0.06 * ts, 0.58 * jw]} c={belly} />
              <Box p={[-JL / 2 + 0.075, 0, 0]} s={[0.89 * JL, 0.03, 0.49 * sW]} c="#5E1A18" />
              {teeth(0, span(hf + 0.25 * ts, -0.42 * kL, Math.max(3, nT - 2)), false)}
            </group>
          </group>
        </group>
      </group>
      {/* đuôi từ hông về +X */}
      <group position={[0.2 * s + backEdge - 0.1 * s, S.hip + 0.27 * s, 0]}>{tailSeg(0)}</group>
    </group>
  );
};

// T. rex khối (bản gốc đã duyệt 2026-10-30)
export const BlockTRex: React.FC<Omit<TheropodProps, "spec">> = (p) => <BlockTheropod spec={DINOS.trex} {...p} />;

// người khối 1,8 m để so cỡ (áo khoác thám hiểm), quay về -X
export const BlockHuman: React.FC<{ t: number; walk?: number; wave?: number; coat?: string }> = ({ t, walk = 0, wave = 0, coat = "#C4693A" }) => {
  const ph = (TAU * t) / 1.0;
  const sw = 0.45 * walk * Math.sin(ph);
  return (
    <group>
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0.9, s * 0.11]} rotation={[0, 0, s * sw]}>
          <Box p={[0, -0.44, 0]} s={[0.17, 0.88, 0.17]} c="#3E4A5A" />
          <Box p={[-0.05, -0.86, 0]} s={[0.26, 0.08, 0.17]} c="#2A2420" />
        </group>
      ))}
      <Box p={[0, 1.22, 0]} s={[0.28, 0.66, 0.44]} c={coat} />
      {[1, -1].map((s) => (
        <group key={s} position={[0, 1.5, s * 0.28]} rotation={[s === 1 ? -2.6 * wave : 0, 0, -s * sw]}>
          <Box p={[0, -0.3, 0]} s={[0.12, 0.6, 0.12]} c={coat} />
          <Box p={[0, -0.64, 0]} s={[0.1, 0.1, 0.1]} c="#E2B48C" />
        </group>
      ))}
      <Box p={[0, 1.7, 0]} s={[0.24, 0.26, 0.22]} c="#E2B48C" />
      <Box p={[0, 1.86, 0]} s={[0.36, 0.06, 0.36]} c="#B89A62" />
      <Box p={[0, 1.92, 0]} s={[0.24, 0.1, 0.24]} c="#B89A62" />
    </group>
  );
};
