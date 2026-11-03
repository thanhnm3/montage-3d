// Bản "asset có sẵn" của các con khối trong BlockAnimals.tsx (Short 009 r04): model low-poly tải về (Poly Pizza CC-BY,
// Kenney CC0 — nguồn ghi trong projects/fossil-mysteries-short-009-3d/public/free/CREDITS.md), cùng quy ước: đầu về -X,
// đất y = 0, mét thật, mọi chuyển động là hàm của t.
// Voi không có xương: ModelProboscid tự uốn đỉnh theo vùng (4 chân vung quanh hông, vòi cuộn quanh gốc vòi, tai xoè),
// ma mút = cùng con voi + bướu đầu/vai, tai nhỏ, ngà ống cong dài, lớp lông là bản sao từng tam giác thân đẩy ra ngoài
// (từng mảnh mọc / rơi xuống / bung ra được, giữ gag của bản khối).
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import type { V3 } from "./BlockAnimals";

const TAU = Math.PI * 2;
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const sstep = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// ------------------------------------------------------------------ nạp model
export const FREE_FILES = [
  "elephant", "mouse", "pyramid", "tube_rack", "microscope",
  "tree_pineTallA", "tree_pineTallB", "tree_pineDefaultA", "tree_pineRoundC",
  "rock_largeA", "rock_largeC", "rock_smallA", "rock_smallC", "rock_tallA", "rock_tallB", "grass", "grass_large",
] as const;
export type FreeName = (typeof FREE_FILES)[number];
export type FreeAssets = { scenes: Record<FreeName, THREE.Group>; ele: EleRig; mouseTex: THREE.Texture | null };

export function useFreeAssets(enabled: boolean): FreeAssets | null {
  const [a, setA] = useState<FreeAssets | null>(null);
  const [handle] = useState(() => (enabled ? delayRender("free models") : null));
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      const scenes = {} as Record<FreeName, THREE.Group>;
      await Promise.all(
        FREE_FILES.map(async (n) => {
          const buf = await (await fetch(staticFile(`free/${n}.glb`))).arrayBuffer();
          scenes[n] = await new Promise<THREE.Group>((res, rej) => loader.parse(buf, "", (g) => res(g.scene), rej));
        }),
      );
      let mouseTex: THREE.Texture | null = null;
      scenes.mouse.traverse((m) => {
        const mesh = m as THREE.Mesh;
        if (mesh.isMesh) mouseTex = (mesh.material as THREE.MeshStandardMaterial).map ?? null;
      });
      const ele = buildEleRig(scenes.elephant);
      if (alive) setA({ scenes, ele, mouseTex });
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);
  useEffect(() => {
    if (a && handle !== null) continueRender(handle);
  }, [a, handle]);
  return a;
}

// Canvas của R3F là một reconciler riêng: context phải được cấp lại ở bên trong <ThreeCanvas>
export const FreeCtx = createContext<FreeAssets | null>(null);
export const useFree = () => useContext(FreeCtx);

// ------------------------------------------------------------------ đồ vật tĩnh (cây, đá, kim tự tháp, đồ lab)
// clone, đổi vật liệu sang màu phẳng (theo tên vật liệu nếu có), cao `size` mét (hoặc theo trục `axis`), đứng trên y = 0
export const Prop: React.FC<{ name: FreeName; size: number; axis?: "x" | "y" | "z"; colors?: Record<string, string>; pos?: V3; rot?: number; keepMap?: boolean }> = ({ name, size, axis = "y", colors, pos = [0, 0, 0], rot = 0, keepMap }) => {
  const free = useFree();
  const obj = useMemo(() => {
    if (!free) return null;
    const o = free.scenes[name].clone(true);
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = ([] as THREE.Material[]).concat(mesh.material).map((mt) => {
        const src = mt as THREE.MeshStandardMaterial;
        const c = colors?.[mt.name] ? new THREE.Color(colors[mt.name]) : src.color.clone();
        return new THREE.MeshStandardMaterial({
          color: c, map: keepMap ? src.map : null, roughness: 0.88, metalness: 0, flatShading: true,
          transparent: src.transparent || src.opacity < 1, opacity: src.opacity, depthWrite: src.opacity >= 1,
        });
      });
      mesh.material = mats.length === 1 ? mats[0] : mats;
    });
    const box = new THREE.Box3().setFromObject(o);
    const ext = box.max.clone().sub(box.min);
    const s = size / ext[axis];
    const g = new THREE.Group();
    o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    g.add(o);
    g.scale.setScalar(s);
    return g;
  }, [free, name, size, axis, colors, keepMap]);
  if (!obj) return null;
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <primitive object={obj} />
    </group>
  );
};

// ------------------------------------------------------------------ voi / ma mút
type EleRig = {
  rest: Float32Array; // vị trí nghỉ (mét, đầu -X), không chỉ số: 3 đỉnh / tam giác
  tex: Float32Array; // màu texture của từng đỉnh (tuyến tính)
  body: Float32Array; // 1 = da thân (nhuộm theo skin/lông), 0 = chi tiết (mắt, móng)
  leg: Int8Array; // chân 0..3 hoặc -1
  legW: Float32Array; // trọng số uốn chân (0 ở hông -> 1 ở bàn chân)
  legC: V3[]; // tâm xoay (hông) của 4 chân
  trunkW: Float32Array; // 0..1 thuộc vòi
  earW: Float32Array; // 0..1 thuộc tai (dấu = bên)
  furTris: Int32Array; // tam giác thân được phủ lông
  furN: Float32Array; // pháp tuyến nghỉ của từng tam giác lông
  trunkBase: V3;
  tuskRoot: V3;
  earRoot: V3;
};

const H = 3.2; // chiều cao cả con (đỉnh lưng) — cỡ con voi khối cũ

function buildEleRig(scene: THREE.Group): EleRig {
  scene.updateMatrixWorld(true);
  let mesh: THREE.Mesh | null = null;
  scene.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) mesh = m as THREE.Mesh;
  });
  const src = mesh! as THREE.Mesh;
  const g = src.geometry.toNonIndexed();
  g.applyMatrix4(src.matrixWorld);
  g.rotateY(-Math.PI / 2); // đầu model hướng +Z -> -X
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const s = H / (b.max.y - b.min.y);
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  g.scale(s, s, s);
  const P = g.getAttribute("position").array as Float32Array;
  const n = P.length / 3;
  // màu từ texture bảng màu 32x32
  const tex = new Float32Array(n * 3).fill(0.75);
  const body = new Float32Array(n).fill(1);
  const map = (src.material as THREE.MeshStandardMaterial).map;
  const uv = g.getAttribute("uv");
  const key = new Int32Array(n);
  if (map && uv) {
    const img = map.image as CanvasImageSource & { width: number; height: number };
    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const u = ((uv.getX(i) % 1) + 1) % 1, v = ((uv.getY(i) % 1) + 1) % 1;
      const x = Math.min(cv.width - 1, Math.floor(u * cv.width));
      const y = Math.min(cv.height - 1, Math.floor((map.flipY ? 1 - v : v) * cv.height));
      const k = (y * cv.width + x) * 4;
      c.setRGB(px[k] / 255, px[k + 1] / 255, px[k + 2] / 255, THREE.SRGBColorSpace);
      tex.set([c.r, c.g, c.b], i * 3);
      key[i] = (px[k] >> 3) * 1024 + (px[k + 1] >> 3) * 32 + (px[k + 2] >> 3);
    }
    // da = màu xuất hiện nhiều nhất; mắt/móng (tối) và phần sáng giữ màu riêng
    const cnt = new Map<number, number>();
    for (let i = 0; i < n; i++) cnt.set(key[i], (cnt.get(key[i]) ?? 0) + 1);
    let top = -1, topN = 0;
    cnt.forEach((v, k2) => { if (v > topN) { topN = v; top = k2; } });
    for (let i = 0; i < n; i++) body[i] = key[i] === top ? 1 : 0;
  }
  // 4 chân: đỉnh thấp chia theo góc phần tư (trước/sau theo khe giữa hai cặp chân, trái/phải theo z)
  const low: number[] = [];
  for (let i = 0; i < n; i++) if (P[i * 3 + 1] < 0.45) low.push(i);
  const xs = low.map((i) => P[i * 3]).sort((a, c2) => a - c2);
  let gapX = 0, gap = 0;
  for (let k = 1; k < xs.length; k++) if (xs[k] - xs[k - 1] > gap) { gap = xs[k] - xs[k - 1]; gapX = (xs[k] + xs[k - 1]) / 2; }
  const acc = [0, 1, 2, 3].map(() => [0, 0, 0]);
  for (const i of low) {
    const q = (P[i * 3] < gapX ? 0 : 2) + (P[i * 3 + 2] > 0 ? 0 : 1);
    acc[q][0] += P[i * 3]; acc[q][1] += P[i * 3 + 2]; acc[q][2]++;
  }
  const hip = 1.45;
  const legC: V3[] = acc.map(([x, z, c2]) => [x / Math.max(1, c2), hip, z / Math.max(1, c2)]);
  const leg = new Int8Array(n).fill(-1);
  const legW = new Float32Array(n);
  let minX = Infinity;
  for (let i = 0; i < n; i++) minX = Math.min(minX, P[i * 3]);
  const trunkBase: V3 = [minX + 0.55, 2.05, 0];
  const trunkW = new Float32Array(n);
  const earW = new Float32Array(n);
  let earX = 0, earC = 0, earZ = 0;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    let best = -1, bd = 0.5;
    legC.forEach(([cx, , cz], q) => {
      const d = Math.hypot(x - cx, z - cz);
      if (d < bd) { bd = d; best = q; }
    });
    if (best >= 0 && y < 1.75) { leg[i] = best; legW[i] = sstep(1.75, 1.05, y); }
    trunkW[i] = sstep(trunkBase[0] + 0.15, trunkBase[0] - 0.25, x) * sstep(2.45, 2.0, y);
    if (trunkW[i] > 0.01) { leg[i] = -1; legW[i] = 0; }
    const ear = sstep(0.5, 0.75, Math.abs(z)) * sstep(trunkBase[0] + 0.2, trunkBase[0] + 0.45, x) * sstep(trunkBase[0] + 1.6, trunkBase[0] + 1.1, x) * sstep(1.55, 1.9, y);
    earW[i] = ear * Math.sign(z);
    if (ear > 0.5) { earX += x; earZ += Math.abs(z); earC++; }
  }
  // gốc tai = mép trước (phía đầu), sát mặt đầu
  const earRoot: V3 = [earC ? earX / earC - 0.25 : trunkBase[0] + 0.6, 2.3, earC ? earZ / earC - 0.15 : 0.5];
  // lông: tam giác da thân phía trên ống chân, trừ vòi và tai
  const fur: number[] = [];
  const furN: number[] = [];
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let t = 0; t < n / 3; t++) {
    const i0 = t * 3;
    let cy = 0, bodyAll = 1, tw = 0, ew = 0;
    for (let k = 0; k < 3; k++) { cy += P[(i0 + k) * 3 + 1] / 3; bodyAll *= body[i0 + k]; tw = Math.max(tw, trunkW[i0 + k]); ew = Math.max(ew, Math.abs(earW[i0 + k])); }
    if (!bodyAll || cy < 0.75 || tw > 0.3 || ew > 0.3) continue;
    e1.set(P[(i0 + 1) * 3] - P[i0 * 3], P[(i0 + 1) * 3 + 1] - P[i0 * 3 + 1], P[(i0 + 1) * 3 + 2] - P[i0 * 3 + 2]);
    e2.set(P[(i0 + 2) * 3] - P[i0 * 3], P[(i0 + 2) * 3 + 1] - P[i0 * 3 + 1], P[(i0 + 2) * 3 + 2] - P[i0 * 3 + 2]);
    nn.crossVectors(e1, e2).normalize();
    if (nn.y < -0.6) continue; // bụng
    fur.push(t);
    furN.push(nn.x, nn.y, nn.z);
  }
  return {
    rest: new Float32Array(P), tex, body, leg, legW, legC, trunkW, earW,
    furTris: new Int32Array(fur), furN: new Float32Array(furN), trunkBase,
    tuskRoot: [minX + 0.62, 1.82, 0.2], earRoot,
  };
}

type ProbProps = {
  t: number; walk?: number; mammoth?: number; fur?: number; furPop?: number; tusks?: number; skin?: string; furColor?: string;
  phase?: number; period?: number; raise?: number; furDrop?: boolean; coat?: number;
};

// ngà: ống thuôn dọc một đường cong (ma mút: dài gấp ~2.5, cong lên rồi quặp vào trong)
function tuskGeo(root: V3, side: number, L: number, m: number) {
  const r = new THREE.Vector3(...root);
  r.z *= side;
  const pts = [
    r.clone(),
    r.clone().add(new THREE.Vector3(-0.35 * L, -0.32 * L, side * 0.06 * L)),
    r.clone().add(new THREE.Vector3(-0.72 * L, -0.12 * L + 0.18 * L * m, side * (0.16 * L - 0.12 * L * m))),
    r.clone().add(new THREE.Vector3(-0.9 * L + 0.25 * L * m, 0.12 * L + 0.3 * L * m, side * (0.12 * L - 0.3 * L * m))),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const TS = 14, RS = 7;
  const geo = new THREE.TubeGeometry(curve, TS, 1, RS, false);
  const pos = geo.getAttribute("position");
  const r0 = 0.07 + 0.03 * m;
  for (let i = 0; i <= TS; i++) {
    const c = curve.getPointAt(i / TS);
    const rad = r0 * (1 - 0.75 * (i / TS));
    for (let j = 0; j <= RS; j++) {
      const k = i * (RS + 1) + j;
      pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * rad, c.y + (pos.getY(k) - c.y) * rad, c.z + (pos.getZ(k) - c.z) * rad);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export const ModelProboscid: React.FC<ProbProps> = ({ t, walk = 1, mammoth = 0, fur = 0, furPop = 0, tusks = 0.3, skin = "#8E8C88", furColor = "#5B3A22", phase = 0, period = 1.8, raise = 0, furDrop = false, coat }) => {
  const free = useFree();
  const R = free?.ele;
  const parts = useMemo(() => {
    if (!R) return null;
    const n = R.rest.length / 3;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(R.rest), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const fn = R.furTris.length * 3;
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(fn * 3), 3));
    fg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(fn * 3), 3));
    return {
      g, fg,
      mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, flatShading: true }),
      fmat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true, side: THREE.DoubleSide }),
      tmat: new THREE.MeshStandardMaterial({ color: "#EFE6CF", roughness: 0.6, metalness: 0, flatShading: true }),
    };
  }, [R]);
  // ngà dựng lại khi độ dài / mức ma mút đổi (làm tròn để khỏi dựng mỗi frame khi đứng yên)
  const tq = Math.round(tusks * 40) / 40, mq = Math.round(mammoth * 40) / 40;
  const tGeo = useMemo(() => {
    if (!R || tq < 0.02) return null;
    const L = tq * (0.85 + 0.95 * mq);
    return [tuskGeo(R.tuskRoot, 1, L, mq), tuskGeo(R.tuskRoot, -1, L, mq)];
  }, [R, tq, mq]);
  if (!R || !parts) return null;

  const ph = (TAU * t) / period + phase;
  const amp = 0.3 * walk;
  const bob = 0.03 * walk * Math.abs(Math.sin(ph));
  const legPh = [ph + TAU * 0.25, ph + TAU * 0.75, ph, ph + TAU * 0.5]; // trước-trái, trước-phải, sau-trái, sau-phải
  const swing = legPh.map((p) => -amp * Math.sin(p));
  const lift = legPh.map((p) => 0.07 * walk * Math.max(0, Math.cos(p)));
  const trunkSw = 0.18 * Math.sin((TAU * t) / 2.4 + phase) + 0.1 * walk * Math.sin(ph);
  const ear = 0.25 * (1 - mammoth) * (0.5 + 0.5 * Math.sin((TAU * t) / 3 + phase)) + 0.7 * raise * (1 - 0.5 * mammoth);
  const earS = 1 - 0.55 * mammoth;
  const [bx, by] = R.trunkBase;
  const [ex, , ez] = R.earRoot;

  const P = R.rest;
  const out = parts.g.getAttribute("position") as THREE.BufferAttribute;
  const O = out.array as Float32Array;
  const n = P.length / 3;
  for (let i = 0; i < n; i++) {
    let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    // ma mút: vòm đầu cao, bướu vai, lưng dốc về sau
    if (mammoth > 0) {
      const head = Math.exp(-(((x - (bx + 0.75)) / 0.45) ** 2)) * sstep(2.3, 2.9, y);
      const hump = Math.exp(-(((x - (bx + 1.65)) / 0.55) ** 2)) * sstep(2.4, 3.0, y);
      y += mammoth * (0.38 * head + 0.3 * hump) - mammoth * 0.1 * Math.max(0, x - (bx + 1.6)) * sstep(1.5, 2.5, y);
    }
    // tai: thu nhỏ về gốc tai (ma mút), xoè quanh trục đứng khi rống / quạt nhẹ
    const ew = R.earW[i];
    if (ew !== 0) {
      const w = Math.abs(ew), sd = Math.sign(ew);
      const k = 1 - w + w * earS;
      x = ex + (x - ex) * k;
      y = 2.3 + (y - 2.3) * k;
      const lz = (z - sd * ez) * k;
      const a = sd * ear * w; // mép sau tai (dx > 0) quạt ra ngoài
      const dx = x - ex;
      x = ex + dx * Math.cos(a) - lz * Math.sin(a);
      z = sd * ez + dx * Math.sin(a) + lz * Math.cos(a);
    }
    // vòi: cuộn quanh gốc vòi, càng xa gốc càng cong (rống = cuộn lên trước)
    const tw = R.trunkW[i];
    if (tw > 0) {
      const dx = x - bx, dy = y - by;
      const d = Math.hypot(dx, dy);
      const a = tw * (Math.min(1, d / 1.4) * (trunkSw * 0.6 * (1 - raise) - raise * 2.1));
      x = bx + dx * Math.cos(a) - dy * Math.sin(a);
      y = by + dx * Math.sin(a) + dy * Math.cos(a);
    }
    // chân: vung quanh hông, nhấc bàn chân khi đưa lên trước
    const lg = R.leg[i];
    if (lg >= 0) {
      const w = R.legW[i];
      const [cx, cy] = R.legC[lg];
      const a = swing[lg] * w;
      const dx = x - cx, dy = y - cy;
      x = cx + dx * Math.cos(a) - dy * Math.sin(a);
      y = cy + dx * Math.sin(a) + dy * Math.cos(a) + lift[lg] * w;
    }
    O[i * 3] = x; O[i * 3 + 1] = y + bob; O[i * 3 + 2] = z;
  }
  out.needsUpdate = true;
  parts.g.computeVertexNormals();
  parts.g.computeBoundingSphere();

  // màu: da thân nhuộm dần sang màu lông
  const bodyC = new THREE.Color(skin).lerp(new THREE.Color(furColor), (coat ?? Math.min(1, fur * 1.2)) * (1 - furPop));
  const col = parts.g.getAttribute("color") as THREE.BufferAttribute;
  const C = col.array as Float32Array;
  for (let i = 0; i < n; i++) {
    if (R.body[i]) { C[i * 3] = bodyC.r; C[i * 3 + 1] = bodyC.g; C[i * 3 + 2] = bodyC.b; }
    else { C[i * 3] = R.tex[i * 3]; C[i * 3 + 1] = R.tex[i * 3 + 1]; C[i * 3 + 2] = R.tex[i * 3 + 2]; }
  }
  col.needsUpdate = true;

  // lông: mỗi mảnh = tam giác thân (đã uốn theo chân) đẩy ra ngoài + kéo xõa xuống
  const fc = new THREE.Color(furColor), fd = new THREE.Color(furColor).lerp(new THREE.Color("#000000"), 0.28);
  const FP = parts.fg.getAttribute("position") as THREE.BufferAttribute;
  const FC = parts.fg.getAttribute("color") as THREE.BufferAttribute;
  const FA = FP.array as Float32Array, FCA = FC.array as Float32Array;
  const q = new THREE.Quaternion(), ax = new THREE.Vector3(), v = new THREE.Vector3();
  let showFur = false;
  for (let f = 0; f < R.furTris.length; f++) {
    const tri = R.furTris[f];
    const d = hash(f + 7);
    const base = f * 9;
    const fly = Math.max(0, Math.min(1, furPop * 1.6 - d * 0.6));
    if (d > fur || fly >= 1) {
      FA.fill(0, base, base + 9);
      continue;
    }
    showFur = true;
    const grow = Math.min(1, (fur - d) * 8);
    const drop = furDrop ? 6 * (1 - grow) ** 2 : 0;
    const sc = (furDrop ? 1 : grow) * (1 - fly * 0.6) * 1.18;
    const nx = R.furN[f * 3], ny = R.furN[f * 3 + 1], nz = R.furN[f * 3 + 2];
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < 3; k++) { cx += O[(tri * 3 + k) * 3] / 3; cy += O[(tri * 3 + k) * 3 + 1] / 3; cz += O[(tri * 3 + k) * 3 + 2] / 3; }
    const off = 0.09 + 0.05 * d;
    const shag = 0.1 + 0.22 * (1 - Math.max(0, ny)) * (0.6 + 0.8 * hash(f + 31));
    ax.set(hash(f + 3) - 0.5, hash(f + 5) - 0.5, hash(f + 9) - 0.5).normalize();
    q.setFromAxisAngle(ax, fly * 5);
    const tx = cx + nx * (off + fly * 1.4), ty = cy + ny * off + drop + fly * 1.5 - 3.2 * fly * fly, tz = cz + nz * (off + fly * 1.6);
    let lowK = 0, lowY = Infinity;
    for (let k = 0; k < 3; k++) if (O[(tri * 3 + k) * 3 + 1] < lowY) { lowY = O[(tri * 3 + k) * 3 + 1]; lowK = k; }
    for (let k = 0; k < 3; k++) {
      const vi = (tri * 3 + k) * 3;
      v.set(O[vi] - cx, O[vi + 1] - cy - (k === lowK ? shag : 0), O[vi + 2] - cz).multiplyScalar(sc).applyQuaternion(q);
      FA[base + k * 3] = tx + v.x; FA[base + k * 3 + 1] = ty + v.y; FA[base + k * 3 + 2] = tz + v.z;
      const c = f % 3 === 0 ? fd : fc;
      FCA[base + k * 3] = c.r; FCA[base + k * 3 + 1] = c.g; FCA[base + k * 3 + 2] = c.b;
    }
  }
  FP.needsUpdate = true;
  FC.needsUpdate = true;
  if (showFur) {
    parts.fg.computeVertexNormals();
    parts.fg.computeBoundingSphere();
  }

  return (
    <group>
      <mesh geometry={parts.g} material={parts.mat} castShadow receiveShadow frustumCulled={false} />
      {showFur && <mesh geometry={parts.fg} material={parts.fmat} castShadow receiveShadow frustumCulled={false} />}
      {tGeo && (
        <group position={[0, bob, 0]}>
          <mesh geometry={tGeo[0]} material={parts.tmat} castShadow />
          <mesh geometry={tGeo[1]} material={parts.tmat} castShadow />
        </group>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ chuột (Poly by Google), ~16 cm kể cả đuôi
export const ModelMouse: React.FC<{ t: number; golden?: boolean; phase?: number }> = ({ t, golden, phase = 0 }) => {
  const free = useFree();
  const obj = useMemo(() => {
    if (!free) return null;
    const o = free.scenes.mouse.clone(true);
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = new THREE.MeshStandardMaterial({ map: free.mouseTex, color: golden ? "#F2C25A" : "#FFFFFF", roughness: 0.9, metalness: 0, flatShading: true });
    });
    const box = new THREE.Box3().setFromObject(o);
    const s = 0.055 / (box.max.y - box.min.y);
    o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const g = new THREE.Group();
    g.add(o);
    g.scale.setScalar(s);
    g.rotation.y = -Math.PI / 2; // đầu model hướng +Z -> -X
    return g;
  }, [free, golden]);
  if (!obj) return null;
  const sniff = 0.006 * Math.sin((TAU * t) / 0.35 + phase);
  const yaw = 0.12 * Math.sin((TAU * t) / 1.7 + phase);
  return (
    <group position={[sniff, 0.002 * Math.abs(Math.sin((TAU * t) / 0.35 + phase)), 0]} rotation={[0, yaw, 0]}>
      <primitive object={obj} />
    </group>
  );
};
