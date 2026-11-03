// Voi ma mút lông xoăn — vai ~3.3 m (tính cả lông), đầu vòm cao, bướu vai, lưng dốc, tai nhỏ,
// ngà dài xoắn, bờm lông dài phủ xuống bụng. Đầu về -X, đất y = 0.
import * as THREE from "three";
import { body, tube, ellipsoid, carve, toSurface, addSphere, fbm, rig, V } from "../sdf.mjs";

const column = (n, x, z, top, rTop) => [
  ...rig(`${n}_up`, body("leg", [[x, top, z, 0.42, rTop], [x, 1.05, z, 0.29, 0.27]], { blend: 0.3 })),
  ...rig(`${n}_lo`, body("leg", [[x, 1.05, z, 0.29, 0.27], [x - 0.02, 0.4, z, 0.25, 0.24], [x - 0.02, 0.12, z, 0.27, 0.26]], { blend: 0.12 })),
];

const FX = -1.2, FZ = 0.48, HX = 0.98, HZ = 0.45;
const EXTRA_BONES = [{ name: "trunk", pivot: [-2.3, 2.3, 0] }, { name: "tail", pivot: [1.5, 2.1, 0] }];

export default {
  id: "woolly_mammoth",
  voxel: 0.032,
  parts: () => [
    body("body", [[-1.45, 2.22, 0, 0.85, 0.74], [-0.85, 2.3, 0, 1.0, 0.86], [0.0, 2.18, 0, 0.96, 0.86], [0.8, 2.0, 0, 0.84, 0.78], [1.3, 1.88, 0, 0.58, 0.55]], { blend: 0.2 }),
    body("hair", [[-1.35, 1.72, 0, 0.62, 0.8], [-0.35, 1.58, 0, 0.72, 0.92], [0.65, 1.55, 0, 0.62, 0.86], [1.15, 1.55, 0, 0.45, 0.6]], { blend: 0.3 }),
    ellipsoid("head", [-1.95, 2.85, 0], [0.55, 0.62, 0.5], { blend: 0.35, rotZ: 0.35 }),
    ellipsoid("head", [-1.82, 3.3, 0], [0.36, 0.3, 0.33], { blend: 0.3 }),
    ellipsoid("face", [-2.25, 2.42, 0], [0.3, 0.42, 0.33], { blend: 0.25 }),
    ...rig("trunk", tube("trunk", [[-2.3, 2.3, 0, 0.26], [-2.5, 1.7, 0, 0.2], [-2.52, 1.05, 0, 0.15], [-2.4, 0.55, 0, 0.11], [-2.2, 0.36, 0, 0.08]], { blend: 0.2 })),
    ...[1, -1].flatMap((s) => [
      tube("tusk", [[-2.15, 2.18, s * 0.22, 0.11], [-2.55, 1.7, s * 0.42, 0.1], [-3.1, 1.52, s * 0.72, 0.085], [-3.58, 1.8, s * 0.78, 0.068], [-3.72, 2.3, s * 0.52, 0.046], [-3.55, 2.62, s * 0.25, 0.022]], { blend: 0.03 }),
      ellipsoid("ear", [-1.62, 2.82, s * 0.47], [0.13, 0.19, 0.07], { blend: 0.08 }),
    ]),
    ...column("FL", -1.2, 0.48, 1.95, 0.34),
    ...column("FR", -1.2, -0.48, 1.95, 0.34),
    ...column("HL", 0.98, 0.45, 1.85, 0.36),
    ...column("HR", 0.98, -0.45, 1.85, 0.36),
    ...rig("tail", tube("tail", [[1.5, 2.1, 0, 0.08], [1.66, 1.6, 0, 0.05]], { blend: 0.08 }), ellipsoid("tuft", [1.7, 1.45, 0], [0.07, 0.15, 0.07], { blend: 0.04 })),
    carve(ellipsoid("ground", [0, -50, 0], [200, 50, 200]), 0.04),
  ],
  bones: ["FL", "FR", "HL", "HR"].flatMap((n) => {
    const x = n[0] === "F" ? FX : HX, z = (n[1] === "L" ? 1 : -1) * (n[0] === "F" ? FZ : HZ);
    return [
      { name: `${n}_up`, pivot: [x, n[0] === "F" ? 1.95 : 1.88, z] },
      { name: `${n}_lo`, pivot: [x, 1.05, z], parent: `${n}_up` },
    ];
  }).concat(EXTRA_BONES),
  // lông: sợi rủ dọc (nhiễu kéo dài theo trục y), không đụng ngà / vòi / bàn chân
  displace(x, y, z) {
    if (y < 0.25 || (x < -2.12 && y < 2.6)) return 0;
    const len = y < 1.7 ? 1 : 0.6;
    return len * (0.05 * fbm(x * 7, y * 1.4, z * 7, 3) + 0.018 * fbm(x * 22, y * 4, z * 22, 2));
  },
  color(tag, p, n, c) {
    if (tag === "tusk") return c.set("#E9DEC2").lerp(new THREE.Color("#BFAE88"), THREE.MathUtils.smoothstep(-p.x, 3.0, 3.7));
    // sợi lông mảnh: sáng ở ngọn (mặt ngoài), tối ở chân lông
    const strand = fbm(p.x * 26, p.y * 4, p.z * 26, 2);
    const broad = fbm(p.x * 2, p.y * 2, p.z * 2, 2);
    c.set("#6A4226").lerp(new THREE.Color("#9A6A3C"), THREE.MathUtils.smoothstep(strand, 0.0, 0.45) * 0.7);
    c.lerp(new THREE.Color("#3A2414"), THREE.MathUtils.smoothstep(strand, -0.1, -0.5) * 0.6);
    c.multiplyScalar(0.9 + 0.2 * broad);
    if (tag === "trunk" || tag === "face") c.lerp(new THREE.Color("#3B281B"), 0.45);
    if (tag === "leg" && p.y < 0.35) c.lerp(new THREE.Color("#2A1D14"), 0.6);
    c.lerp(new THREE.Color("#3A2414"), THREE.MathUtils.smoothstep(-p.y, -1.2, -0.4) * 0.35);
    return c;
  },
  sharp: 0.05,
  extras(surf, { gloss }) {
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-2.22, 2.85, s * 0.35));
      addSphere(gloss, p.addScaledVector(n, -0.01), 0.03, new THREE.Color("#140C06"));
    }
  },
};
