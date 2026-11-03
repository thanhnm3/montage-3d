// Quetzalcoatlus northropi — tư thế đi bộ trên đất (cánh gập, chống "khuỷu tay"/đốt bàn xuống đất),
// cao ~5 m tới đầu, mỏ dài ~2.5 m, mào thấp. Đầu về -X, mặt đất y = 0.
import * as THREE from "three";
import { body, tube, slab, ellipsoid, toSurface, addCone, addSphere, fbm, rig, V } from "../sdf.mjs";

export default {
  id: "quetzalcoatlus",
  voxel: 0.025,
  parts: () => {
    const P = [];
    // thân nhỏ, phủ lông tơ
    P.push(body("body", [[-0.75, 2.85, 0, 0.3, 0.3], [-0.35, 2.75, 0, 0.42, 0.36], [0.15, 2.55, 0, 0.38, 0.32], [0.55, 2.38, 0, 0.24, 0.2], [0.75, 2.3, 0, 0.08, 0.07]], { blend: 0.15 }));
    // cổ dài cứng
    P.push(tube("neck", [[-0.7, 3.0, 0, 0.21], [-1.1, 3.75, 0, 0.17], [-1.45, 4.45, 0, 0.14], [-1.62, 4.85, 0, 0.13]], { blend: 0.15 }));
    // đầu + mỏ
    P.push(body("head", [[-1.55, 5.0, 0, 0.2, 0.13], [-1.85, 4.92, 0, 0.21, 0.11], [-2.35, 4.72, 0, 0.15, 0.075], [-2.95, 4.45, 0, 0.09, 0.05], [-3.55, 4.18, 0, 0.045, 0.03], [-3.9, 4.03, 0, 0.012, 0.012]], { blend: 0.1 }));
    P.push(slab("crest", [[-1.95, 5.0], [-1.65, 5.22], [-1.35, 5.3], [-1.22, 5.15], [-1.45, 4.98]], { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 0.03, taper: 0.08, blend: 0.08 }));
    for (const s of [1, -1]) {
      const z = 0.3 * s;
      const n = s > 0 ? "L" : "R";
      // chi trước: cánh tay -> cẳng -> đốt bàn dài chống xuống đất
      P.push(...rig(`arm${n}_up`, tube("arm", [[-0.55, 2.85, z, 0.16], [-0.2, 2.35, z * 1.6, 0.12], [-0.05, 2.15, z * 1.75, 0.1]], { blend: 0.12 })));
      P.push(...rig(`arm${n}_lo`, tube("arm", [[-0.05, 2.15, z * 1.75, 0.1], [-0.25, 1.4, z * 1.85, 0.08], [-0.35, 0.95, z * 1.85, 0.075]], { blend: 0.05 })));
      P.push(...rig(`arm${n}_lo`, tube("arm", [[-0.35, 0.95, z * 1.85, 0.07], [-0.42, 0.45, z * 1.8, 0.055], [-0.45, 0.06, z * 1.75, 0.06]], { blend: 0.04 })));
      // ngón cánh gập ngược lên dọc theo cẳng tay + màng cánh xếp gọn
      P.push(...rig(`arm${n}_lo`, tube("wingfinger", [[-0.4, 0.95, z * 2.0, 0.055], [-0.05, 1.7, z * 2.1, 0.045], [0.35, 2.45, z * 2.05, 0.035], [0.6, 2.9, z * 1.95, 0.02]], { blend: 0.04 })));
      P.push(...rig(`arm${n}_lo`, slab("membrane", [[-0.38, 1.0], [0.3, 2.45], [0.62, 2.95], [0.78, 2.7], [0.4, 2.0], [-0.1, 1.15]], { origin: [0, 0, z * 1.9], u: [1, 0, 0], v: [0, 1, 0], half: 0.03, taper: 0.1, blend: 0.08, bend: 0.03 * s })));
      // chi sau
      P.push(...rig(`leg${n}_up`, body("leg", [[0.4, 2.35, z * 0.75, 0.2, 0.15], [0.35, 1.85, z * 0.85, 0.13, 0.11]], { blend: 0.12 })));
      P.push(...rig(`leg${n}_lo`, tube("leg", [[0.35, 1.8, z * 0.85, 0.09], [0.6, 1.0, z * 0.9, 0.065], [0.72, 0.28, z * 0.9, 0.05]], { blend: 0.05 })));
      P.push(...rig(`leg${n}_lo`, tube("foot", [[0.72, 0.28, z * 0.9, 0.05], [0.62, 0.08, z * 0.9, 0.05], [0.4, 0.04, z * 0.95, 0.04]], { blend: 0.04 })));
      P.push(...rig(`arm${n}_lo`, ellipsoid("arm", [-0.48, 0.06, z * 1.75], [0.12, 0.05, 0.08], { blend: 0.05 })));
    }
    return P;
  },
  bones: [1, -1].flatMap((s) => {
    const z = 0.3 * s, n = s > 0 ? "L" : "R";
    return [
      { name: `arm${n}_up`, pivot: [-0.55, 2.85, z] },
      { name: `arm${n}_lo`, pivot: [-0.05, 2.15, z * 1.75], parent: `arm${n}_up` },
      { name: `leg${n}_up`, pivot: [0.4, 2.35, z * 0.75] },
      { name: `leg${n}_lo`, pivot: [0.35, 1.82, z * 0.85], parent: `leg${n}_up` },
    ];
  }),
  color(tag, p, n, c) {
    const mott = fbm(p.x * 4, p.y * 4, p.z * 4);
    if (tag === "head") {
      const t = THREE.MathUtils.smoothstep(-p.x, 2.4, 3.6);
      c.set("#E3D3A9").lerp(new THREE.Color("#2D2A26"), t);
      if (p.x > -2.2) c.lerp(new THREE.Color("#E9E2D2"), 0.6);
      return c.multiplyScalar(0.95 + 0.08 * mott);
    }
    if (tag === "crest") return c.set("#B4452A").lerp(new THREE.Color("#E07A3C"), THREE.MathUtils.smoothstep(p.y, 5.05, 5.3)).multiplyScalar(0.95 + 0.1 * mott);
    if (tag === "membrane" || tag === "wingfinger") return c.set("#3A3534").lerp(new THREE.Color("#5A4A42"), 0.4 + 0.3 * mott);
    if (tag === "arm" || tag === "leg" || tag === "foot") {
      c.set("#7A6F64").lerp(new THREE.Color("#3E3833"), THREE.MathUtils.smoothstep(-p.y, -1.2, -0.2));
      return c.multiplyScalar(0.92 + 0.12 * mott);
    }
    // lông tơ: thân/cổ trắng ngà, lưng xám
    c.set("#ECE6DA").lerp(new THREE.Color("#8C8378"), THREE.MathUtils.smoothstep(n.y + 0.3 * mott, 0.2, 0.9));
    return c.multiplyScalar(0.94 + 0.12 * fbm(p.x * 14, p.y * 14, p.z * 14));
  },
  displace: (x, y, z) => (y > 2.0 && y < 3.4 && x > -0.9 && x < 0.8 ? 0.012 * fbm(x * 18, y * 6, z * 18, 2) : 0),
  extras(surf, { gloss }) {
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-1.72, 5.03, s * 0.12));
      addSphere(gloss, p.addScaledVector(n, -0.01), 0.03, new THREE.Color("#1E1408"));
    }
  },
};
