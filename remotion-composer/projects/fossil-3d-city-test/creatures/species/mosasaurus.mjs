// Mosasaurus hoffmannii — dài ~13 m, đang bơi, gốc toạ độ ở giữa thân. Đuôi chúc xuống thành vây lưỡi liềm,
// 4 vây chèo, hàm há với răng nón lớn. Đổ bóng ngược: lưng xám đen, bụng trắng.
import * as THREE from "three";
import { body, slab, ellipsoid, toSurface, addCone, addSphere, rotPt, fbm, lerpNodes, rig, V } from "../sdf.mjs";

const GAPE = 0.32;
const HINGE = [-4.45, -0.08, 0];
const SKULL = [[-4.3, 0.18, 0, 0.5, 0.48], [-4.75, 0.2, 0, 0.4, 0.4], [-5.3, 0.17, 0, 0.29, 0.29], [-5.95, 0.11, 0, 0.18, 0.18], [-6.45, 0.07, 0, 0.1, 0.1], [-6.6, 0.06, 0, 0.05, 0.05]];
const JAW0 = [[-4.45, -0.12, 0, 0.27, 0.42], [-5.0, -0.14, 0, 0.21, 0.32], [-5.6, -0.12, 0, 0.15, 0.21], [-6.2, -0.08, 0, 0.09, 0.11], [-6.45, -0.06, 0, 0.05, 0.06]];
const JAW = JAW0.map((n) => rotPt(n, HINGE, [0, 0, 1], GAPE));
const JAW_UP = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), GAPE);

const flipper = (root, s, len, out) =>
  slab("flipper", [[0, -0.22 * len], [0.3 * len, -0.27 * len], [0.65 * len, -0.22 * len], [0.95 * len, -0.06 * len], [1.05 * len, 0.1 * len], [0.85 * len, 0.25 * len], [0.45 * len, 0.27 * len], [0.1 * len, 0.22 * len]], {
    origin: root,
    u: [out[0], out[1], s * out[2]],
    v: [1, 0.12, -0.35 * s],
    half: 0.07 * len,
    taper: 0.25 * len,
    blend: 0.18,
  });

export default {
  id: "mosasaurus",
  voxel: 0.04,
  parts: () => [
    body("body", [[-4.3, 0.12, 0, 0.6, 0.55], [-3.4, 0.05, 0, 0.8, 0.68], [-2.2, 0.0, 0, 0.88, 0.74], [-0.9, -0.02, 0, 0.86, 0.72], [0.4, 0.0, 0, 0.74, 0.6], [1.6, 0.0, 0, 0.62, 0.48], [2.8, -0.04, 0, 0.53, 0.36], [3.9, -0.12, 0, 0.45, 0.25], [4.9, -0.3, 0, 0.35, 0.15], [5.7, -0.62, 0, 0.24, 0.09], [6.2, -1.05, 0, 0.13, 0.06], [6.45, -1.45, 0, 0.05, 0.04]], { blend: 0.2 }),
    body("head", SKULL, { blend: 0.25 }),
    ...rig("jaw", body("jaw", JAW, { blend: 0.12 })),
    ellipsoid("mouth", [-4.6, -0.02, 0], [0.45, 0.2, 0.32], { blend: 0.1 }),
    slab("fluke", [[4.6, -0.1], [5.3, 0.35], [6.0, 0.95], [6.45, 1.15], [6.3, 0.55], [6.1, -0.15], [6.35, -0.9], [6.85, -1.75], [6.55, -1.9], [5.9, -1.3], [5.2, -0.7], [4.7, -0.4]], { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 0.08, taper: 0.35, blend: 0.2 }),
    slab("fin", [[0.8, 0.6], [1.5, 0.95], [2.4, 0.88], [3.0, 0.5], [1.4, 0.45]], { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 0.05, taper: 0.15, blend: 0.15 }),
    ...[1, -1].flatMap((s) => [...rig(s > 0 ? "finFL" : "finFR", flipper([-3.15, -0.48, s * 0.48], s, 1.7, [0.45, -0.35, 1])), ...rig(s > 0 ? "finHL" : "finHR", flipper([1.5, -0.38, s * 0.36], s, 1.25, [0.6, -0.3, 1]))]),
  ],
  bones: [
    { name: "jaw", pivot: HINGE },
    { name: "finFL", pivot: [-3.15, -0.48, 0.48] },
    { name: "finFR", pivot: [-3.15, -0.48, -0.48] },
    { name: "finHL", pivot: [1.5, -0.38, 0.36] },
    { name: "finHR", pivot: [1.5, -0.38, -0.36] },
  ],
  color(tag, p, n, c) {
    const mott = fbm(p.x * 1.5, p.y * 1.5, p.z * 1.5);
    if (tag === "mouth") return c.set("#5C2A2C");
    if (tag === "jaw" && n.dot(JAW_UP) > 0.45 && Math.abs(p.z) < 0.3) return c.set("#8A4848");
    if (tag === "head" && n.y < -0.45 && Math.abs(p.z) < 0.34 && p.x < -4.3) return c.set("#8A4848");
    // ranh giới lưng/bụng lượn sóng
    const s = n.y + 0.18 * Math.sin(p.x * 2.1) + 0.25 * mott;
    c.set("#DCDBD0").lerp(new THREE.Color("#55606A"), THREE.MathUtils.smoothstep(s, -0.35, -0.15));
    c.lerp(new THREE.Color("#222A32"), THREE.MathUtils.smoothstep(s, -0.05, 0.55));
    if (tag === "flipper" || tag === "fluke" || tag === "fin") c.lerp(new THREE.Color("#1E252C"), 0.35);
    return c.multiplyScalar(0.92 + 0.14 * mott);
  },
  extras(surf, { extra, gloss }) {
    const tooth = new THREE.Color("#F1EADA"), toothB = new THREE.Color("#C9B892");
    for (const s of [1, -1]) {
      extra.bone = "root";
      for (let x = -6.45; x <= -4.6; x += 0.12) {
        const nd = lerpNodes(SKULL, x);
        const { p } = toSurface(surf, V(x, nd[1] - nd[3] * 0.82, s * nd[4] * 0.78));
        addCone(extra, p.addScaledVector(V(0, 1, 0), 0.03), V(0.15, -1, 0), 0.12, 0.03, toothB, tooth, { curve: V(0.25, 0, 0) });
      }
      extra.bone = "jaw";
      for (let x = -6.3; x <= -4.8; x += 0.12) {
        const nd = lerpNodes(JAW0, x);
        const q = rotPt([x, nd[1] + nd[3] * 0.8, s * nd[4] * 0.75], HINGE, [0, 0, 1], GAPE);
        const { p } = toSurface(surf, V(q[0], q[1], q[2]));
        addCone(extra, p.addScaledVector(JAW_UP, -0.03), JAW_UP.clone().add(V(0.15, 0, 0)), 0.11, 0.028, toothB, tooth, { curve: V(0.2, 0, 0) });
      }
      const { p, n } = toSurface(surf, V(-4.7, 0.42, s * 0.36));
      addSphere(gloss, p.addScaledVector(n, -0.02), 0.06, new THREE.Color("#3A2A0C"));
    }
  },
};
