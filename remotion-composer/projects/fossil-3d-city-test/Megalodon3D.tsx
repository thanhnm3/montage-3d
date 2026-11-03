// Megalodon dựng hoàn toàn bằng code: thân "loft" qua các mặt cắt elip, vây ép từ Shape,
// màu đổ bóng ngược (lưng xám nâu, bụng kem) bằng vertex color. Bơi = sóng ngang chạy dọc thân,
// biên độ tăng dần về đuôi, tính theo frame. Đơn vị mét, đầu quay về -X, lưng +Y, sườn +Z.
import React, { useMemo } from "react";
import * as THREE from "three";

export const BODY_LEN = 15.4; // mõm -> cuống đuôi; vây đuôi thêm ~2.7 m => tổng ~18 m
export const SNOUT_X = -9;
export const BODY_HALF_H = 1.95;
export const SHARK_TOP = BODY_HALF_H + 2.5; // tính cả vây lưng, dùng để đặt thước đo

const U_SEG = 96;
const V_SEG = 64;

// Biên dạng thân (u: 0 = mõm, 1 = cuống đuôi)
const PROFILE_U = [0, 0.012, 0.035, 0.07, 0.12, 0.19, 0.28, 0.38, 0.5, 0.62, 0.73, 0.83, 0.92, 1];
const PROFILE_H = [0.0, 0.16, 0.34, 0.53, 0.71, 0.86, 0.97, 1.0, 0.94, 0.78, 0.55, 0.34, 0.22, 0.19];
// tâm mặt cắt lệch: mõm hơi chúc, bụng đầy hơn lưng
const PROFILE_CY = [-0.18, -0.16, -0.13, -0.1, -0.07, -0.05, -0.04, -0.03, -0.01, 0.0, 0.02, 0.03, 0.04, 0.04];

// Nội suy Hermite (tiếp tuyến kiểu Catmull-Rom) — trơn qua các điểm, không bị "bậc thang"
function sampleProfile(arr: number[], u: number) {
  const U = PROFILE_U;
  const n = U.length;
  const x = Math.min(1, Math.max(0, u));
  let i = 0;
  while (i < n - 2 && x > U[i + 1]) i++;
  const tan = (k: number) => {
    const a = Math.max(0, k - 1);
    const b = Math.min(n - 1, k + 1);
    return (arr[b] - arr[a]) / (U[b] - U[a]);
  };
  const h = U[i + 1] - U[i];
  const t = (x - U[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * arr[i] +
    (t3 - 2 * t2 + t) * h * tan(i) +
    (-2 * t3 + 3 * t2) * arr[i + 1] +
    (t3 - t2) * h * tan(i + 1)
  );
}

const halfH = (u: number) => BODY_HALF_H * sampleProfile(PROFILE_H, u);
const halfW = (u: number) => halfH(u) * (u < 0.1 ? 0.92 : 0.8);
const centerY = (u: number) => BODY_HALF_H * sampleProfile(PROFILE_CY, u);
const xOf = (u: number) => SNOUT_X + u * BODY_LEN;

// sóng bơi: lệch ngang theo Z
export function sway(u: number, frame: number) {
  const amp = 0.05 + 0.75 * Math.pow(u, 2.2);
  return amp * Math.sin(2 * Math.PI * (u * 0.85 - frame / 54));
}
const swaySlope = (u: number, frame: number) => (sway(u + 0.01, frame) - sway(u - 0.01, frame)) / (0.02 * BODY_LEN);

// điểm trên bề mặt thân (chưa có sóng): theta = 0 sườn +Z, pi/2 lưng, -pi/2 bụng; inflate > 1 = nổi khỏi da
function surface(u: number, theta: number, inflate = 1) {
  return new THREE.Vector3(
    xOf(u),
    centerY(u) + halfH(u) * Math.sin(theta) * inflate,
    halfW(u) * Math.cos(theta) * inflate,
  );
}

// nhiễu rẻ, xác định — cho mép đổ bóng ngược và vệt loang
const wobble = (u: number, th: number) =>
  0.09 * Math.sin(u * 29 + 1.3) + 0.05 * Math.sin(u * 61 + th * 2) + 0.03 * Math.sin(th * 5 + u * 13);

const COL = {
  back: new THREE.Color("#55594F"),
  side: new THREE.Color("#7D7963"),
  ochre: new THREE.Color("#8F7752"),
  belly: new THREE.Color("#E6DCC5"),
  fin: new THREE.Color("#6E6F61"),
  finTip: new THREE.Color("#585A50"),
  dark: new THREE.Color("#1B1D1B"),
  tooth: new THREE.Color("#F2EBDC"),
};

// ---------- miệng há ----------
// Hàm dưới = phần bụng nằm dưới đường môi (theta trong (-pi+LIP, -LIP)), từ đường cong chữ U
// phía trước (uFront) tới khoé miệng (U_HINGE). Vùng đó trên thân bị ép phẳng lên ngang môi
// thành vòm miệng; hàm dưới là mesh riêng xoay quanh khoé.
const LIP = 0.62;
const U_JTIP = 0.04;
const U_HINGE = 0.175;
const K_FRONT = 0.05;
const uFront = (th: number) => U_JTIP + (K_FRONT * Math.cos(th) ** 2) / Math.cos(LIP) ** 2;
const lipY = (u: number) => centerY(u) - halfH(u) * Math.sin(LIP);
const inMouth = (u: number, th: number) => th > -Math.PI + LIP && th < -LIP && u >= uFront(th) && u <= U_HINGE;

const MOUTH = {
  palate: new THREE.Color("#5A2A2A"),
  floor: new THREE.Color("#6B3030"),
  throat: new THREE.Color("#241112"),
  tooth: new THREE.Color("#EFE8D6"),
  toothBase: new THREE.Color("#CDBF9E"),
};

function skinColor(u: number, th: number, c: THREE.Color) {
  // đổ bóng ngược: s = độ cao trên mặt cắt (-1 bụng .. 1 lưng)
  const s = Math.sin(th) + wobble(u, th);
  const tBelly = THREE.MathUtils.smoothstep(s, -0.2, -0.06);
  c.copy(COL.belly).lerp(COL.side, tBelly);
  const patch = THREE.MathUtils.smoothstep(Math.sin(u * 23 + th * 2.1) + Math.sin(u * 9.7 - th), 0.6, 1.4);
  if (s > -0.05) c.lerp(COL.ochre, patch * 0.45);
  c.lerp(COL.back, THREE.MathUtils.smoothstep(s, 0.25, 0.95));
  return c;
}

function buildBody() {
  const geo = new THREE.BufferGeometry();
  const n = (U_SEG + 1) * (V_SEG + 1);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2); // giữ (u, theta) để cập nhật sóng mỗi frame
  const c = new THREE.Color();
  let k = 0;
  for (let i = 0; i <= U_SEG; i++) {
    // dồn điểm về mõm để đầu tròn
    const u = Math.pow(i / U_SEG, 1.35);
    for (let j = 0; j <= V_SEG; j++) {
      const th = (j / V_SEG) * Math.PI * 2 - Math.PI;
      const p = surface(u, th);
      const mouth = inMouth(u, th);
      if (mouth) p.y = lipY(u); // vòm miệng phẳng ngang môi (z giữ nguyên để sóng bơi vẫn đúng)
      pos.set([p.x, p.y, p.z], k * 3);
      uv.set([u, th], k * 2);
      if (mouth) c.copy(MOUTH.palate);
      else skinColor(u, th, c);
      col.set([c.r, c.g, c.b], k * 3);
      k++;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < U_SEG; i++) {
    for (let j = 0; j < V_SEG; j++) {
      const a = i * (V_SEG + 1) + j;
      const b = a + V_SEG + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  geo.setIndex(idx);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("uvt", new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

function finGeometry(shape: THREE.Shape, depth: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.45,
    bevelSize: Math.min(0.12, depth * 0.6),
    bevelSegments: 3,
    curveSegments: 18,
  });
  g.translate(0, 0, -depth / 2);
  // mép vây tối hơn: tô theo khoảng cách tới gốc (y)
  const p = g.getAttribute("position");
  const cols = new Float32Array(p.count * 3);
  const box = new THREE.Box3().setFromBufferAttribute(p as THREE.BufferAttribute);
  const span = Math.max(box.max.y - box.min.y, 0.001);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const t = Math.abs(p.getY(i)) / span;
    c.copy(COL.fin).lerp(COL.finTip, THREE.MathUtils.smoothstep(t, 0.55, 1));
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

function shapes() {
  const dorsal = new THREE.Shape();
  dorsal.moveTo(0, 0);
  dorsal.quadraticCurveTo(0.9, 1.5, 2.15, 2.45);
  dorsal.quadraticCurveTo(2.05, 1.0, 2.9, 0.12);
  dorsal.lineTo(2.9, -0.4);
  dorsal.lineTo(0, -0.4);
  dorsal.closePath();

  // vây ngực: vẽ trong mặt phẳng (dọc thân, dài ra ngoài), sau đó xoay chúc xuống
  const pect = new THREE.Shape();
  pect.moveTo(0, 0);
  pect.quadraticCurveTo(1.0, -1.6, 2.9, -3.5);
  pect.quadraticCurveTo(2.6, -1.6, 2.5, 0);
  pect.closePath();

  const small = new THREE.Shape();
  small.moveTo(0, 0);
  small.quadraticCurveTo(0.35, 0.5, 0.75, 0.75);
  small.quadraticCurveTo(0.7, 0.3, 0.95, 0);
  small.lineTo(0.95, -0.2);
  small.lineTo(0, -0.2);
  small.closePath();

  // vây đuôi hình lưỡi liềm, thuỳ trên dài hơn
  const caudal = new THREE.Shape();
  caudal.moveTo(-0.3, 0.3);
  caudal.quadraticCurveTo(1.1, 1.0, 2.75, 3.1);
  caudal.quadraticCurveTo(2.05, 1.5, 1.15, 0.05);
  caudal.quadraticCurveTo(1.85, -1.1, 2.35, -2.45);
  caudal.quadraticCurveTo(1.0, -1.0, -0.3, -0.3);
  caudal.closePath();
  return { dorsal, pect, small, caudal };
}

function tubeAlong(points: THREE.Vector3[], r: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, r, 6, false);
}

// Đường viền miệng (chữ U nhìn từ dưới): khoé +Z -> vòng qua trước -> khoé -Z, ở độ cao môi.
// t = 0 ở khoé .. 1 ở giữa phía trước (răng trước to nhất).
function mouthRim(n: number, inset: number, yOff: number) {
  const pts: { p: THREE.Vector3; t: number }[] = [];
  const sideN = Math.round(n * 0.32);
  const frontN = n - 2 * sideN;
  const uSide0 = U_HINGE - 0.012;
  const uSide1 = uFront(-LIP);
  const push = (u: number, th: number, t: number) => {
    const z = halfW(u) * Math.cos(th) * inset;
    pts.push({ p: new THREE.Vector3(xOf(u) + (1 - inset) * 0.6, lipY(u) + yOff, z), t });
  };
  for (let i = 0; i < sideN; i++) {
    const k = i / sideN;
    push(uSide0 - k * (uSide0 - uSide1), -LIP, k * 0.5);
  }
  for (let i = 0; i <= frontN; i++) {
    const th = -LIP - (i / frontN) * (Math.PI - 2 * LIP);
    push(uFront(th) + 0.004, th, 0.5 + 0.5 * Math.sin((i / frontN) * Math.PI));
  }
  for (let i = 1; i <= sideN; i++) {
    const k = 1 - i / sideN;
    push(uSide0 - k * (uSide0 - uSide1), -Math.PI + LIP, k * 0.5);
  }
  return pts;
}

// Một chiếc răng: lưỡi tam giác dẹt, gốc ngà đậm hơn, chóp hướng +Y (xoay sau)
function toothGeometry(h: number, w: number) {
  const g = new THREE.ConeGeometry(w, h, 4, 2);
  g.scale(1, 1, 0.42);
  g.translate(0, h / 2, 0);
  const p = g.getAttribute("position");
  const cols = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.copy(MOUTH.toothBase).lerp(MOUTH.tooth, THREE.MathUtils.smoothstep(p.getY(i) / h, 0.05, 0.5));
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

// Răng hàm trên: chĩa xuống; to ở phía trước, nhỏ dần về khoé
function buildUpperTeeth() {
  return mouthRim(30, 0.93, 0.02).map(({ p, t }) => {
    const h = 0.2 + 0.2 * t;
    const g = toothGeometry(h, h * 0.36);
    g.rotateX(Math.PI);
    g.rotateY(Math.atan2(p.z, 1.5) * 0.9); // mặt dẹt của răng xoay theo viền miệng
    g.translate(p.x, p.y, p.z);
    return g;
  });
}

// Hàm dưới: vỏ ngoài là da bụng, mặt trên là sàn miệng, hai đầu bịt kín; răng chĩa lên.
// Toạ độ đã trừ tâm bản lề (khoé miệng) để xoay quanh đó.
function buildLowerJaw() {
  const S = 16;
  const T = 24;
  const hx = xOf(U_HINGE);
  const hy = lipY(U_HINGE);
  const outer: THREE.Vector3[] = [];
  const inner: THREE.Vector3[] = [];
  const oc: THREE.Color[] = [];
  for (let i = 0; i <= S; i++) {
    for (let j = 0; j <= T; j++) {
      const th = -LIP - (j / T) * (Math.PI - 2 * LIP);
      const u = uFront(th) + (i / S) * (U_HINGE - uFront(th));
      const o = surface(u, th, 0.985);
      outer.push(new THREE.Vector3(o.x - hx, o.y - hy, o.z));
      inner.push(new THREE.Vector3(o.x - hx, lipY(u) - 0.05 - hy, halfW(u) * Math.cos(th) * 0.93));
      oc.push(skinColor(u, th, new THREE.Color()));
    }
  }
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const add = (v: THREE.Vector3, c: THREE.Color) => {
    pos.push(v.x, v.y, v.z);
    col.push(c.r, c.g, c.b);
    return pos.length / 3 - 1;
  };
  const grid = (pts: THREE.Vector3[], colOf: (k: number) => THREE.Color) => {
    const base = pos.length / 3;
    pts.forEach((v, k) => add(v, colOf(k)));
    for (let i = 0; i < S; i++)
      for (let j = 0; j < T; j++) {
        const a = base + i * (T + 1) + j;
        const b = a + T + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
  };
  grid(outer, (k) => oc[k]);
  grid(inner, () => MOUTH.floor);
  // bịt mép trước và khoé bằng dải màu sàn miệng
  for (const i of [0, S]) {
    for (let j = 0; j < T; j++) {
      const k = i * (T + 1) + j;
      const a = add(outer[k], MOUTH.floor);
      const b = add(outer[k + 1], MOUTH.floor);
      const c2 = add(inner[k + 1], MOUTH.floor);
      const d = add(inner[k], MOUTH.floor);
      idx.push(a, b, c2, a, c2, d);
    }
  }
  const jaw = new THREE.BufferGeometry();
  jaw.setIndex(idx);
  jaw.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  jaw.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  jaw.computeVertexNormals();

  const teeth = mouthRim(26, 0.86, -0.04).map(({ p, t }) => {
    const h = 0.19 + 0.2 * t;
    const g = toothGeometry(h, h * 0.3);
    g.rotateY(Math.atan2(p.z, 1.5) * 0.9);
    g.translate(p.x - hx, p.y - hy, p.z);
    return g;
  });
  return { jaw, teeth, hx, hy };
}

// Mắt, khe mang — dựng ở frame 0 rồi dịch theo sóng tại vùng đầu
function buildHeadDetails() {
  const groups: { geo: THREE.BufferGeometry; color: THREE.Color }[] = [];
  for (const side of [1, -1]) {
    const flip = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, v.z * side);
    // khe mang: 5 cung dọc trên sườn
    for (let g = 0; g < 5; g++) {
      const u = 0.205 + g * 0.021;
      const pts = Array.from({ length: 7 }, (_, i) => {
        const th = -0.42 + (i / 6) * 0.95;
        return flip(surface(u + (i - 3) * 0.0015, th, 1.012));
      });
      groups.push({ geo: tubeAlong(pts, 0.036), color: COL.dark });
    }
    // mắt
    const eye = new THREE.SphereGeometry(0.13, 16, 12);
    const ep = flip(surface(0.075, 0.3, 1.0));
    eye.translate(ep.x, ep.y, ep.z);
    groups.push({ geo: eye, color: COL.dark });
  }
  return groups;
}

export const Megalodon: React.FC<{ frame: number }> = ({ frame }) => {
  const body = useMemo(buildBody, []);
  const fins = useMemo(() => {
    const s = shapes();
    return {
      dorsal: finGeometry(s.dorsal, 0.24),
      pect: finGeometry(s.pect, 0.16),
      small: finGeometry(s.small, 0.12),
      caudal: finGeometry(s.caudal, 0.2),
    };
  }, []);
  const head = useMemo(buildHeadDetails, []);
  const upperTeeth = useMemo(buildUpperTeeth, []);
  const lower = useMemo(buildLowerJaw, []);
  const toothMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 }), []);
  // hàm dưới vẽ hai mặt: không phải canh chiều winding của sàn/mép bịt
  const jawMat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }),
    [],
  );
  const throatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: MOUTH.throat, roughness: 0.8 }), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.02 }), []);
  const flatMats = useMemo(
    () => head.map((h) => new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.35 })),
    [head],
  );

  // cập nhật sóng bơi trên thân
  const pos = body.getAttribute("position") as THREE.BufferAttribute;
  const ut = body.getAttribute("uvt") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = ut.getX(i);
    const th = ut.getY(i);
    pos.setZ(i, halfW(u) * Math.cos(th) + sway(u, frame));
  }
  pos.needsUpdate = true;
  body.computeVertexNormals();

  // một phần thân đi kèm sóng: dịch Z theo sway(u) và xoay theo độ dốc sóng
  const attach = (u: number) => ({
    z: sway(u, frame),
    yaw: -Math.atan(swaySlope(u, frame)),
  });
  const headA = attach(0.1);
  const dA = attach(0.36);
  const pA = attach(0.25);
  const d2A = attach(0.82);
  const tA = attach(1);
  const pelvA = attach(0.6);
  const top = (u: number) => centerY(u) + halfH(u) * 0.93;
  const bottom = (u: number) => centerY(u) - halfH(u) * 0.9;
  const pectFlap = Math.sin((2 * Math.PI * frame) / 108) * 0.05;
  // há miệng ~30°, khép mở nhẹ
  const gape = 0.62 + 0.06 * Math.sin((2 * Math.PI * frame) / 75);

  return (
    <group>
      <mesh geometry={body} material={mat} castShadow receiveShadow />
      {/* xoay quanh chính vùng đầu, không phải gốc toạ độ (xoay quanh gốc sẽ đẩy chi tiết lệch ~0.4 m) */}
      <group position={[xOf(0.1), 0, headA.z]} rotation={[0, headA.yaw, 0]}>
        <group position={[-xOf(0.1), 0, -sway(0.1, 0)]}>
          {head.map((h, i) => (
            <mesh key={i} geometry={h.geo} material={flatMats[i]} />
          ))}
          {upperTeeth.map((g, i) => (
            <mesh key={`ut${i}`} geometry={g} material={toothMat} />
          ))}
          {/* họng tối: lấp khoảng hở hai bên khi hàm há */}
          <mesh position={[xOf(0.13), lipY(0.13) - 0.2, 0]} scale={[1.0, 0.4, halfW(0.13) * 0.7]} material={throatMat}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          {/* hàm dưới xoay quanh khoé miệng */}
          <group position={[lower.hx, lower.hy, 0]} rotation={[0, 0, gape]}>
            <mesh geometry={lower.jaw} material={jawMat} castShadow />
            {lower.teeth.map((g, i) => (
              <mesh key={`lt${i}`} geometry={g} material={toothMat} />
            ))}
          </group>
        </group>
      </group>
      {/* vây lưng */}
      <group position={[xOf(0.33), top(0.36), dA.z]} rotation={[0, dA.yaw, 0]}>
        <mesh geometry={fins.dorsal} material={mat} castShadow />
      </group>
      {/* vây lưng thứ hai + vây hậu môn */}
      <group position={[xOf(0.8), top(0.82) - 0.05, d2A.z]} rotation={[0, d2A.yaw, 0]} scale={0.75}>
        <mesh geometry={fins.small} material={mat} castShadow />
      </group>
      <group position={[xOf(0.79), bottom(0.81) + 0.05, d2A.z]} rotation={[Math.PI, d2A.yaw, 0]} scale={0.7}>
        <mesh geometry={fins.small} material={mat} castShadow />
      </group>
      {/* vây bụng */}
      {[1, -1].map((side) => (
        <group
          key={`pv${side}`}
          position={[xOf(0.58), bottom(0.6) + 0.15, pelvA.z + side * halfW(0.6) * 0.45]}
          rotation={[Math.PI - side * 0.55, pelvA.yaw, 0]}
          scale={1.05}
        >
          <mesh geometry={fins.small} material={mat} castShadow />
        </group>
      ))}
      {/* vây ngực: gốc ở sườn dưới, chúc xuống và xoè ra ngoài */}
      {[1, -1].map((side) => (
        <group
          key={`pc${side}`}
          position={[xOf(0.24), centerY(0.25) - halfH(0.25) * 0.55, pA.z + side * halfW(0.25) * 0.75]}
          rotation={[-side * (0.5 + pectFlap), pA.yaw, -0.12]}
          scale={0.8}
        >
          <mesh geometry={fins.pect} material={mat} castShadow />
        </group>
      ))}
      {/* vây đuôi */}
      <group position={[xOf(1) - 0.15, centerY(1) + 0.05, tA.z]} rotation={[0, tA.yaw * 1.3, 0]}>
        <mesh geometry={fins.caudal} material={mat} castShadow />
      </group>
    </group>
  );
};
