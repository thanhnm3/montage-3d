// Dunkleosteus terrelli — dài ~4.1 m, đang bơi, gốc ở giữa. Giáp xương bọc đầu + ngực (1/3 trước),
// hàm há với các phiến xương sắc thay răng, thân sau giống cá mập, đuôi lệch (thuỳ trên dài).
import * as THREE from "three";
import { body, slab, ellipsoid, toSurface, addCone, addSphere, rotPt, voronoi, fbm, rig, V } from "../sdf.mjs";

const GAPE = 0.5;
const HINGE = [-1.42, -0.12, 0];
const JAW = [[-1.45, -0.2, 0, 0.2, 0.4], [-1.8, -0.24, 0, 0.15, 0.31], [-2.02, -0.22, 0, 0.09, 0.16]].map((n) => rotPt(n, HINGE, [0, 0, 1], GAPE));
const JAW_UP = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), GAPE);
const ARMOR_END = -0.35;

const fin = (tag, pts, o, u, v, half = 0.025) => slab(tag, pts, { origin: o, u, v, half, taper: 0.08, blend: 0.08 });

export default {
  id: "dunkleosteus",
  voxel: 0.016,
  parts: () => [
    body("armor", [[-1.4, 0.18, 0, 0.5, 0.52], [-1.0, 0.08, 0, 0.62, 0.6], [-0.6, 0.02, 0, 0.62, 0.58], [-0.3, 0.0, 0, 0.58, 0.53]], { blend: 0.1 }),
    body("head", [[-1.35, 0.3, 0, 0.42, 0.5], [-1.75, 0.24, 0, 0.32, 0.42], [-2.02, 0.12, 0, 0.17, 0.28], [-2.1, 0.06, 0, 0.08, 0.14]], { blend: 0.14 }),
    ...rig("jaw", body("jaw", JAW, { blend: 0.06 })),
    ellipsoid("mouth", [-1.55, -0.02, 0], [0.32, 0.16, 0.3], { blend: 0.06 }),
    body("body", [[-0.3, 0.0, 0, 0.56, 0.5], [0.15, 0.0, 0, 0.5, 0.42], [0.6, 0.03, 0, 0.38, 0.3], [1.05, 0.07, 0, 0.25, 0.18], [1.45, 0.12, 0, 0.14, 0.09], [1.75, 0.2, 0, 0.07, 0.05]], { blend: 0.12 }),
    fin("fin", [[1.45, 0.08], [1.85, 0.5], [2.3, 0.98], [2.38, 0.88], [2.05, 0.3], [2.1, -0.12], [1.9, -0.45], [1.78, -0.42], [1.6, -0.1]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 0.035),
    fin("fin", [[-0.05, 0.45], [0.2, 0.85], [0.45, 0.95], [0.5, 0.82], [0.65, 0.35]], [0, 0, 0], [1, 0, 0], [0, 1, 0]),
    ...[1, -1].flatMap((s) => [
      ...rig(s > 0 ? "pecL" : "pecR", fin("fin", [[0, -0.12], [0.45, -0.02], [0.75, 0.12], [0.6, 0.18], [0, 0.14]], [-0.45, -0.32, s * 0.42], [0.55, -0.35, s * 0.8], [1, 0, 0])),
      fin("fin", [[0, -0.08], [0.25, 0], [0.35, 0.1], [0, 0.1]], [0.55, -0.25, s * 0.18], [0.4, -0.6, s * 0.7], [1, 0, 0]),
    ]),
  ],
  bones: [
    { name: "jaw", pivot: HINGE },
    { name: "pecL", pivot: [-0.45, -0.32, 0.42] },
    { name: "pecR", pivot: [-0.45, -0.32, -0.42] },
  ],
  color(tag, p, n, c) {
    const mott = fbm(p.x * 6, p.y * 6, p.z * 6);
    if (tag === "mouth") return c.set("#4E2626");
    if (tag === "jaw" && n.dot(JAW_UP) > 0.4 && Math.abs(p.z) < 0.3) return c.set("#7A4040");
    if (tag === "head" && n.y < -0.4 && Math.abs(p.z) < 0.34 && p.x < -1.35) return c.set("#7A4040");
    const s = n.y + 0.2 * mott;
    if (tag === "armor" || tag === "head" || tag === "jaw" || p.x < ARMOR_END) {
      // tấm giáp: nền xương xám nâu, rãnh nối tấm tối, vân lỗ chỗ
      c.set("#B4A58A").lerp(new THREE.Color("#6B5E4C"), THREE.MathUtils.smoothstep(s, -0.2, 0.7));
      const [f1, f2] = voronoi(p.x * 2.2, p.y * 2.2, p.z * 2.2);
      c.multiplyScalar(0.55 + 0.45 * THREE.MathUtils.smoothstep(f2 - f1, 0.02, 0.09));
      c.multiplyScalar(0.85 + 0.25 * fbm(p.x * 22, p.y * 22, p.z * 22));
      return c;
    }
    c.set("#D2CDBE").lerp(new THREE.Color("#4B5257"), THREE.MathUtils.smoothstep(s, -0.4, -0.05));
    c.lerp(new THREE.Color("#2A3034"), THREE.MathUtils.smoothstep(s, 0.1, 0.8));
    if (tag === "fin") c.lerp(new THREE.Color("#262B2E"), 0.4);
    return c.multiplyScalar(0.92 + 0.14 * mott);
  },
  extras(surf, { extra, gloss }) {
    const bone = new THREE.Color("#E6DCC3"), boneB = new THREE.Color("#9C8E73");
    for (const s of [1, -1]) {
      extra.bone = "root";
      // răng nanh xương phía trước + phiến cắt dọc hàm
      const { p: up } = toSurface(surf, V(-2.02, -0.02, s * 0.08));
      addCone(extra, up.addScaledVector(V(0, 1, 0), 0.03), V(-0.15, -1, 0), 0.16, 0.05, boneB, bone, { flat: 0.5, curve: V(0.3, 0, 0) });
      for (let x = -1.92; x <= -1.55; x += 0.07) {
        const { p } = toSurface(surf, V(x, 0.0, s * (0.22 + (x + 1.92) * 0.4)));
        addCone(extra, p.addScaledVector(V(0, 1, 0), 0.02), V(0, -1, 0), 0.07, 0.04, boneB, bone, { flat: 0.35 });
      }
      extra.bone = "jaw";
      const tip = rotPt([-2.05, -0.12, s * 0.07], HINGE, [0, 0, 1], GAPE);
      const { p: lo } = toSurface(surf, V(tip[0], tip[1], tip[2]));
      addCone(extra, lo.addScaledVector(JAW_UP, -0.03), JAW_UP.clone().add(V(-0.1, 0, 0)), 0.15, 0.05, boneB, bone, { flat: 0.5 });
      for (let x = -1.9; x <= -1.6; x += 0.07) {
        const q = rotPt([x, -0.04, s * (0.2 + (x + 1.9) * 0.4)], HINGE, [0, 0, 1], GAPE);
        const { p } = toSurface(surf, V(q[0], q[1], q[2]));
        addCone(extra, p.addScaledVector(JAW_UP, -0.02), JAW_UP, 0.06, 0.035, boneB, bone, { flat: 0.35 });
      }
      extra.bone = "root";
      // mắt có vòng xương
      const { p, n } = toSurface(surf, V(-1.6, 0.36, s * 0.36));
      addSphere(gloss, p.clone().addScaledVector(n, -0.01), 0.055, new THREE.Color("#2B220F"));
      addSphere(extra, p.addScaledVector(n, -0.025), 0.07, new THREE.Color("#8F826A"));
    }
  },
};
