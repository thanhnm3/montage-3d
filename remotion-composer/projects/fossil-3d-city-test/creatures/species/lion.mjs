// Sư tử đực — thân ~2 m (+ đuôi ~0.9 m), vai ~1.15 m, ~190 kg. Bờm xù quanh cổ, đầu về -X, đất y = 0.
import * as THREE from "three";
import { body, tube, ellipsoid, carve, toSurface, addSphere, fbm, rig, V } from "../sdf.mjs";

const MANE = [-0.98, 1.06, 0];
const FZ = 0.17, HZ = 0.16;

function legF(z) {
  const s = z > 0 ? "L" : "R";
  return [
    ...rig(`F${s}_up`, body("legup", [[-0.58, 0.98, z * 0.85, 0.17, 0.12], [-0.54, 0.58, z, 0.11, 0.085]], { blend: 0.12 })),
    ...rig(`F${s}_lo`,
      tube("leg", [[-0.54, 0.58, z, 0.08], [-0.55, 0.3, z, 0.066], [-0.56, 0.12, z, 0.062]], { blend: 0.04 }),
      ellipsoid("paw", [-0.6, 0.055, z], [0.1, 0.06, 0.08], { blend: 0.04 }),
    ),
  ];
}
function legH(z) {
  const s = z > 0 ? "L" : "R";
  return [
    ...rig(`H${s}_up`, body("legup", [[0.52, 0.95, z * 0.85, 0.23, 0.14], [0.44, 0.56, z, 0.12, 0.085]], { blend: 0.12 })),
    ...rig(`H${s}_lo`,
      tube("leg", [[0.44, 0.56, z, 0.08], [0.63, 0.3, z, 0.055], [0.6, 0.12, z, 0.055]], { blend: 0.04 }),
      ellipsoid("paw", [0.56, 0.055, z], [0.1, 0.06, 0.075], { blend: 0.04 }),
    ),
  ];
}

export default {
  id: "lion",
  voxel: 0.011,
  boneSharp: 0.03,
  detail: { freq: 60, amp: 0.0005, stretch: [1, 1, 1], tint: 0.03 },
  parts: () => [
    body("body", [[-0.75, 0.93, 0, 0.3, 0.24], [-0.45, 0.9, 0, 0.33, 0.26], [0.0, 0.86, 0, 0.29, 0.23], [0.45, 0.88, 0, 0.29, 0.23], [0.72, 0.9, 0, 0.22, 0.19]], { blend: 0.12 }),
    body("neck", [[-0.75, 0.98, 0, 0.27, 0.22], [-1.05, 1.1, 0, 0.21, 0.17]], { blend: 0.12 }),
    body("head", [[-1.08, 1.13, 0, 0.17, 0.155], [-1.24, 1.08, 0, 0.14, 0.13], [-1.38, 1.02, 0, 0.1, 0.1], [-1.46, 0.99, 0, 0.075, 0.08]], { blend: 0.06 }),
    ellipsoid("nose", [-1.49, 1.0, 0], [0.03, 0.03, 0.04], { blend: 0.03 }),
    ellipsoid("mane", MANE, [0.3, 0.38, 0.32], { blend: 0.12, rotZ: -0.35 }),
    ellipsoid("mane", [-0.78, 0.78, 0], [0.22, 0.24, 0.2], { blend: 0.12 }),
    ...rig("jaw", body("jaw", [[-1.14, 0.99, 0, 0.09, 0.1], [-1.4, 0.93, 0, 0.055, 0.065]], { blend: 0.04 })),
    ...[1, -1].map((s) => ellipsoid("ear", [-1.06, 1.27, s * 0.12], [0.04, 0.05, 0.03], { blend: 0.03 })),
    ...rig("tail",
      tube("tail", [[0.8, 0.95, 0, 0.045], [1.05, 0.75, 0, 0.032], [1.32, 0.52, 0, 0.026], [1.58, 0.44, 0, 0.022]], { blend: 0.05 }),
      ellipsoid("tuft", [1.66, 0.43, 0], [0.09, 0.06, 0.06], { blend: 0.03 }),
    ),
    ...legF(FZ), ...legF(-FZ), ...legH(HZ), ...legH(-HZ),
    carve(ellipsoid("ground", [0, -50, 0], [200, 50, 200]), 0.004),
  ],
  bones: [
    { name: "jaw", pivot: [-1.12, 1.02, 0] },
    { name: "tail", pivot: [0.8, 0.95, 0] },
    ...["L", "R"].flatMap((n) => {
      const s = n === "L" ? 1 : -1;
      return [
        { name: `F${n}_up`, pivot: [-0.57, 0.95, FZ * s] },
        { name: `F${n}_lo`, pivot: [-0.54, 0.58, FZ * s], parent: `F${n}_up` },
        { name: `H${n}_up`, pivot: [0.52, 0.92, HZ * s] },
        { name: `H${n}_lo`, pivot: [0.44, 0.56, HZ * s], parent: `H${n}_up` },
      ];
    }),
  ],
  // bờm: lọn xù lớn; thân: lông ngắn
  displace(x, y, z) {
    const d = Math.hypot((x - MANE[0]) / 0.42, (y - MANE[1]) / 0.5, z / 0.42);
    const shag = THREE.MathUtils.smoothstep(1.35 - d, 0, 0.4);
    return shag * (0.018 * fbm(x * 9, y * 14, z * 9, 2) + 0.012 * fbm(x * 26, y * 40, z * 26, 2));
  },
  color(tag, p, n, c) {
    const m = fbm(p.x * 5, p.y * 5, p.z * 5);
    if (tag === "nose") return c.set("#3A2420");
    if (tag === "tuft") return c.set("#2E1C12");
    if (tag === "mane") {
      c.set("#6A3E1E").lerp(new THREE.Color("#B07A3E"), THREE.MathUtils.clamp(0.5 + 1.2 * m + 0.4 * n.y, 0, 1));
      return c;
    }
    c.set("#E4CDA4").lerp(new THREE.Color("#C2924F"), THREE.MathUtils.smoothstep(n.y + 0.2 * m, -0.6, -0.05));
    if (tag === "ear") c.lerp(new THREE.Color("#4A3020"), n.x > 0.3 ? 0.7 : 0.2);
    if ((tag === "head" || tag === "jaw") && p.x < -1.33 && n.y < 0.6) c.lerp(new THREE.Color("#EEE4D0"), 0.7);
    if (tag === "paw") c.lerp(new THREE.Color("#A57A45"), 0.3);
    return c.multiplyScalar(0.95 + 0.1 * m);
  },
  extras(surf, { gloss }) {
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-1.27, 1.15, s * 0.08));
      addSphere(gloss, p.addScaledVector(n, -0.006), 0.018, new THREE.Color("#8A5A12"));
    }
  },
};
