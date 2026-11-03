// Voi bụi châu Phi (đực) — vai ~3.3 m, tai lớn hình bản đồ châu Phi, lưng võng, da xám nhăn,
// ngà cong lên. Đầu về -X, đất y = 0.
import * as THREE from "three";
import { body, tube, ellipsoid, slab, carve, toSurface, addSphere, fbm, rig, V } from "../sdf.mjs";

const column = (n, x, z, top, rTop) => [
  ...rig(`${n}_up`, body("leg", [[x, top, z, 0.45, rTop], [x, 1.05, z, 0.29, 0.27]], { blend: 0.3 })),
  ...rig(`${n}_lo`, body("leg", [[x, 1.05, z, 0.29, 0.27], [x - 0.02, 0.4, z, 0.25, 0.24], [x - 0.02, 0.12, z, 0.27, 0.26]], { blend: 0.12 })),
];

const FX = -1.15, FZ = 0.5, HX = 1.0, HZ = 0.47;
const EXTRA_BONES = [{ name: "trunk", pivot: [-2.25, 2.15, 0] }, { name: "tail", pivot: [1.55, 2.3, 0] }, { name: "earL", pivot: [-1.66, 2.8, 0.42] }, { name: "earR", pivot: [-1.66, 2.8, -0.42] }];

export default {
  id: "african_elephant",
  voxel: 0.03,
  parts: () => [
    body("body", [[-1.35, 2.25, 0, 0.88, 0.74], [-0.7, 2.32, 0, 0.98, 0.84], [0.15, 2.22, 0, 0.95, 0.84], [0.85, 2.2, 0, 0.86, 0.76], [1.3, 2.08, 0, 0.58, 0.52]], { blend: 0.2 }),
    ellipsoid("head", [-1.88, 2.72, 0], [0.5, 0.62, 0.5], { blend: 0.35, rotZ: 0.2 }),
    ellipsoid("head", [-2.15, 2.25, 0], [0.32, 0.45, 0.36], { blend: 0.25 }),
    ...rig("trunk", tube("trunk", [[-2.25, 2.15, 0, 0.25], [-2.42, 1.5, 0, 0.19], [-2.44, 0.9, 0, 0.14], [-2.36, 0.42, 0, 0.1], [-2.24, 0.22, 0, 0.08]], { blend: 0.2 })),
    ...[1, -1].flatMap((s) => [
      tube("tusk", [[-2.12, 2.05, s * 0.24, 0.09], [-2.55, 1.66, s * 0.3, 0.08], [-2.95, 1.56, s * 0.32, 0.06], [-3.22, 1.74, s * 0.3, 0.03]], { blend: 0.03 }),
      ...rig(s > 0 ? "earL" : "earR", slab("ear", [[0, 0.45], [0.5, 0.62], [1.0, 0.48], [1.28, 0.0], [1.12, -0.55], [0.78, -0.98], [0.46, -1.12], [0.2, -0.72], [0.04, -0.2]], { origin: [-1.66, 2.8, s * 0.42], u: [1, 0, 0.45 * s], v: [0, 1, 0.08 * s], half: 0.05, taper: 0.3, blend: 0.18, bend: 0.09 * s })),
    ]),
    ...column("FL", -1.15, 0.5, 1.95, 0.36),
    ...column("FR", -1.15, -0.5, 1.95, 0.36),
    ...column("HL", 1.0, 0.47, 1.9, 0.38),
    ...column("HR", 1.0, -0.47, 1.9, 0.38),
    ...rig("tail", tube("tail", [[1.55, 2.3, 0, 0.07], [1.68, 1.7, 0, 0.04], [1.7, 1.3, 0, 0.03]], { blend: 0.08 }), ellipsoid("tuft", [1.71, 1.2, 0], [0.04, 0.12, 0.04], { blend: 0.03 })),
    carve(ellipsoid("ground", [0, -50, 0], [200, 50, 200]), 0.04),
  ],
  bones: ["FL", "FR", "HL", "HR"].flatMap((n) => {
    const x = n[0] === "F" ? FX : HX, z = (n[1] === "L" ? 1 : -1) * (n[0] === "F" ? FZ : HZ);
    return [
      { name: `${n}_up`, pivot: [x, n[0] === "F" ? 1.95 : 1.88, z] },
      { name: `${n}_lo`, pivot: [x, 1.05, z], parent: `${n}_up` },
    ];
  }).concat(EXTRA_BONES),
  displace: (x, y, z) => 0.01 * fbm(x * 9, y * 9, z * 9, 2),
  color(tag, p, n, c) {
    if (tag === "tusk") return c.set("#EDE4CC").lerp(new THREE.Color("#C9B98F"), THREE.MathUtils.smoothstep(-p.x, 2.7, 3.2));
    const wr = fbm(p.x * 14, p.y * 14, p.z * 14, 3);
    c.set("#7C766E").multiplyScalar(0.86 + 0.22 * wr);
    if (tag === "trunk") c.multiplyScalar(0.8 + 0.25 * THREE.MathUtils.smoothstep(Math.sin(p.y * 70 + wr * 3), -0.4, 0.6));
    if (tag === "ear") c.multiplyScalar(0.92 + 0.1 * fbm(p.x * 30, p.y * 30, p.z * 30));
    // bùn khô ở chân và bụng
    c.lerp(new THREE.Color("#8A7A64"), THREE.MathUtils.smoothstep(-p.y, -0.8, -0.1) * 0.6);
    return c;
  },
  extras(surf, { gloss }) {
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-2.14, 2.66, s * 0.38));
      addSphere(gloss, p.addScaledVector(n, -0.01), 0.03, new THREE.Color("#140C06"));
    }
  },
};
