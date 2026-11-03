// Hươu cao cổ (đực) — cao ~5.5 m tới sừng, vai ~3.3 m. Đốm lưới nâu trên nền kem, đầu về -X, đất y = 0.
import * as THREE from "three";
import { body, tube, slab, ellipsoid, toSurface, addSphere, rotPt, voronoi, fbm, rig, V } from "../sdf.mjs";

function legF(z, a, n) {
  const r = (q) => rotPt(q, [-0.85, 2.4, z], [0, 0, 1], a);
  return [
    ...rig(`F${n}_up`, body("legup", [[-0.82, 2.45, z, 0.32, 0.2], [-0.78, 1.9, z * 1.05, 0.19, 0.13]].map(r), { blend: 0.2 }), tube("leg", [[-0.78, 1.88, z * 1.05, 0.105], [-0.8, 1.35, z, 0.075], [-0.81, 1.02, z, 0.085]].map(r), { blend: 0.04 })),
    ...rig(`F${n}_lo`, tube("leg", [[-0.81, 1.02, z, 0.085], [-0.82, 0.62, z, 0.06], [-0.83, 0.2, z, 0.055], [-0.86, 0.1, z, 0.07]].map(r), { blend: 0.04 }), ellipsoid("hoof", r([-0.89, 0.05, z]), [0.11, 0.05, 0.075], { blend: 0.03 })),
  ];
}
function legH(z, a, n) {
  const r = (q) => rotPt(q, [1.0, 2.3, z], [0, 0, 1], a);
  return [
    ...rig(`H${n}_up`, body("legup", [[1.0, 2.35, z, 0.36, 0.22], [0.85, 1.85, z * 1.05, 0.24, 0.15], [0.8, 1.6, z, 0.12, 0.1]].map(r), { blend: 0.2 }), tube("leg", [[0.8, 1.6, z, 0.09], [1.06, 1.12, z, 0.07]].map(r), { blend: 0.04 })),
    ...rig(`H${n}_lo`, tube("leg", [[1.06, 1.12, z, 0.07], [1.0, 0.62, z, 0.06], [0.98, 0.2, z, 0.055], [0.94, 0.1, z, 0.07]].map(r), { blend: 0.04 }), ellipsoid("hoof", r([0.91, 0.05, z]), [0.11, 0.05, 0.075], { blend: 0.03 })),
  ];
}

export default {
  id: "giraffe",
  voxel: 0.022,
  parts: () => [
    body("body", [[-1.1, 2.68, 0, 0.6, 0.45], [-0.6, 2.62, 0, 0.7, 0.52], [0.2, 2.5, 0, 0.62, 0.48], [0.9, 2.38, 0, 0.52, 0.42], [1.25, 2.33, 0, 0.36, 0.3]], { blend: 0.15 }),
    body("neck", [[-1.0, 2.85, 0, 0.42, 0.3], [-1.3, 3.5, 0, 0.27, 0.19], [-1.55, 4.2, 0, 0.2, 0.14], [-1.72, 4.85, 0, 0.16, 0.12], [-1.78, 5.05, 0, 0.14, 0.11]], { blend: 0.2 }),
    slab("mane", [[-1.05, 3.3], [-1.35, 4.05], [-1.62, 4.95], [-1.55, 5.0], [-1.18, 4.0], [-0.85, 3.2]], { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 0.025, taper: 0.04, blend: 0.05, smooth: false }),
    body("head", [[-1.72, 5.12, 0, 0.15, 0.12], [-1.95, 5.05, 0, 0.13, 0.1], [-2.18, 4.9, 0, 0.11, 0.085], [-2.32, 4.8, 0, 0.1, 0.08]], { blend: 0.08 }),
    ...[1, -1].flatMap((s) => [
      tube("horn", [[-1.78, 5.18, s * 0.06, 0.04], [-1.76, 5.36, s * 0.075, 0.033]], { blend: 0.04 }),
      ellipsoid("hornTip", [-1.76, 5.39, s * 0.075], [0.045, 0.04, 0.045], { blend: 0.02 }),
      slab("ear", [[0, -0.04], [0.16, -0.035], [0.2, 0], [0.16, 0.035], [0, 0.04]], { origin: [-1.7, 5.17, s * 0.1], u: [0.3, 0.15, s * 1], v: [1, 0, 0], half: 0.012, blend: 0.03, bend: -0.6 }),
    ]),
    ...rig("tail", tube("tail", [[1.3, 2.45, 0, 0.05], [1.4, 1.9, 0, 0.03], [1.42, 1.35, 0, 0.022]], { blend: 0.06 }), ellipsoid("tuft", [1.42, 1.22, 0], [0.06, 0.16, 0.06], { blend: 0.03 })),
    ...legF(0.27, 0, "L"),
    ...legF(-0.27, 0, "R"),
    ...legH(0.26, 0, "L"),
    ...legH(-0.26, 0, "R"),
  ],
  bones: ["L", "R"].flatMap((n) => {
    const s = n === "L" ? 1 : -1;
    return [
      { name: `F${n}_up`, pivot: [-0.85, 2.4, 0.27 * s] },
      { name: `F${n}_lo`, pivot: [-0.81, 1.02, 0.27 * s], parent: `F${n}_up` },
      { name: `H${n}_up`, pivot: [1.0, 2.3, 0.26 * s] },
      { name: `H${n}_lo`, pivot: [1.06, 1.12, 0.26 * s], parent: `H${n}_up` },
    ];
  }).concat([{ name: "tail", pivot: [1.3, 2.45, 0] }]),
  color(tag, p, n, c) {
    const cream = new THREE.Color("#EDDDB8");
    if (tag === "hoof") return c.set("#2A2420");
    if (tag === "hornTip" || tag === "mane" || tag === "tuft") return c.set("#3A2618");
    if (tag === "head" || tag === "horn" || tag === "ear") {
      c.set("#D9B47E");
      const [f1, f2] = voronoi(p.x * 14, p.y * 14, p.z * 14);
      if (tag === "head" && f2 - f1 > 0.22 && p.x > -2.05) c.lerp(new THREE.Color("#9A6232"), 0.6);
      if (p.x < -2.15) c.lerp(new THREE.Color("#B8916A"), 0.5);
      return c;
    }
    // đốm lưới: ô Voronoi nâu, đường kem giữa các ô; chân dưới gối trơn màu kem
    const sc = tag === "neck" ? 4.6 : 3.4;
    const w = 0.05 * fbm(p.x * 9, p.y * 9, p.z * 9);
    const [f1, f2, id] = voronoi(p.x * sc + w * 6, p.y * sc, p.z * sc + w * 6);
    const edge = THREE.MathUtils.smoothstep(f2 - f1, 0.06, 0.14);
    const patch = new THREE.Color("#7B4520").lerp(new THREE.Color("#5A2E14"), id * 0.7);
    c.copy(cream).lerp(patch, edge);
    if (tag === "leg" || (tag === "legup" && p.y < 1.8)) {
      const fade = THREE.MathUtils.smoothstep(p.y, 0.9, 1.7);
      c.copy(cream).lerp(c.clone().copy(cream).lerp(patch, edge), fade);
    }
    if (n.y < -0.5) c.lerp(cream, 0.6);
    return c.multiplyScalar(0.95 + 0.08 * fbm(p.x * 6, p.y * 6, p.z * 6));
  },
  extras(surf, { gloss }) {
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-1.92, 5.12, s * 0.11));
      addSphere(gloss, p.addScaledVector(n, -0.012), 0.032, new THREE.Color("#1A0F08"));
    }
  },
};
