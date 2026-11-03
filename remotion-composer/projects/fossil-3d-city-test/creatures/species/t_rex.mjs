// Tyrannosaurus rex — dài ~12.4 m, hông ~3.6 m, đầu về -X, mặt đất y = 0, miệng há nhẹ.
import * as THREE from "three";
import { body, tube, ellipsoid, toSurface, addCone, addSphere, rotPt, fbm, rig, V } from "../sdf.mjs";

const GAPE = 0.36;
const HINGE = [-3.95, 4.02, 0];
const SKULL = [[-3.85, 4.32, 0, 0.45, 0.38], [-4.25, 4.32, 0, 0.44, 0.34], [-4.75, 4.2, 0, 0.33, 0.25], [-5.2, 4.08, 0, 0.25, 0.18], [-5.47, 4.0, 0, 0.15, 0.12]];
const JAW0 = [[-3.95, 3.98, 0, 0.26, 0.3], [-4.45, 3.87, 0, 0.21, 0.26], [-5.0, 3.79, 0, 0.15, 0.18], [-5.36, 3.75, 0, 0.09, 0.12]];
const JAW = JAW0.map((n) => rotPt(n, HINGE, [0, 0, 1], GAPE));
const JAW_UP = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), GAPE);
const HIP = [0.15, 3.3];
const LEGS = [{ z: 0.62, a: 0, n: "L" }, { z: -0.62, a: 0, n: "R" }];

const lerpNodes = (nodes, x) => {
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if ((x - a[0]) * (x - b[0]) <= 0) {
      const t = (x - a[0]) / (b[0] - a[0] || 1);
      return a.map((v, k) => v + (b[k] - v) * t);
    }
  }
  return nodes[nodes.length - 1];
};

function leg(z, a) {
  const P = [HIP[0], HIP[1], z];
  const r = (n) => rotPt(n, P, [0, 0, 1], a);
  const n = z > 0 ? "L" : "R";
  return [
    ...rig(`leg${n}_up`, body("leg", [[0.3, 3.4, z * 1.1, 0.72, 0.48], [0.02, 2.75, z * 1.18, 0.66, 0.44], [-0.32, 2.08, z * 1.12, 0.36, 0.3]].map(r), { blend: 0.35 })),
    ...rig(`leg${n}_lo`, body("leg", [[-0.32, 2.05, z * 1.12, 0.3, 0.27], [-0.02, 1.6, z * 1.06, 0.27, 0.22], [0.28, 1.02, z, 0.15, 0.14]].map(r), { blend: 0.12 }),
    tube("leg", [[0.28, 1.02, z, 0.14], [0.15, 0.55, z, 0.12], [0.02, 0.2, z, 0.11]].map(r), { blend: 0.08 }),
    ...[-0.2, 0, 0.2].map((dz, i) =>
      tube("foot", [[0.02, 0.17, z + dz * 0.3, 0.085], [-0.3, 0.1, z + dz * 0.75, 0.065], [i === 1 ? -0.72 : -0.6, 0.07, z + dz, 0.045]].map(r), { blend: 0.07 }),
    )),
  ];
}

export default {
  id: "t_rex",
  voxel: 0.04,
  parts: () => [
    body("body", [[-3.75, 4.05, 0, 0.46, 0.4], [-3.3, 3.78, 0, 0.62, 0.52], [-2.6, 3.35, 0, 0.92, 0.72], [-1.7, 3.2, 0, 1.12, 0.86], [-0.7, 3.3, 0, 1.05, 0.82], [0.2, 3.55, 0, 0.8, 0.64], [1.2, 3.66, 0.02, 0.7, 0.55], [2.4, 3.62, 0.1, 0.56, 0.42], [3.6, 3.52, 0.26, 0.42, 0.3], [4.8, 3.42, 0.48, 0.29, 0.2], [5.9, 3.38, 0.72, 0.17, 0.12], [6.75, 3.4, 0.92, 0.05, 0.04]], { blend: 0.2 }),
    body("head", SKULL, { blend: 0.25 }),
    ellipsoid("head", [-4.35, 4.6, 0.2], [0.16, 0.07, 0.08], { blend: 0.12 }),
    ellipsoid("head", [-4.35, 4.6, -0.2], [0.16, 0.07, 0.08], { blend: 0.12 }),
    ...rig("jaw", body("jaw", JAW, { blend: 0.12 })),
    ellipsoid("mouth", [-4.15, 3.98, 0], [0.38, 0.2, 0.24], { blend: 0.12 }),
    ...LEGS.flatMap((l) => leg(l.z, l.a)),
    ...[0.6, -0.6].flatMap((z) => rig(z > 0 ? "armL" : "armR", [
      tube("arm", [[-2.72, 2.88, z, 0.15], [-2.85, 2.52, z * 1.08, 0.11], [-3.15, 2.42, z * 1.06, 0.08]], { blend: 0.12 }),
      ...[0.035, -0.035].map((dz) => tube("arm", [[-3.15, 2.42, z * 1.06 + dz, 0.06], [-3.33, 2.33, z * 1.06 + dz * 1.5, 0.035]], { blend: 0.04 })),
    ])),
  ],
  bones: [
    { name: "jaw", pivot: HINGE },
    { name: "legL_up", pivot: [HIP[0], HIP[1], 0.62] },
    { name: "legL_lo", pivot: [-0.32, 2.06, 0.69], parent: "legL_up" },
    { name: "legR_up", pivot: [HIP[0], HIP[1], -0.62] },
    { name: "legR_lo", pivot: [-0.32, 2.06, -0.69], parent: "legR_up" },
    { name: "armL", pivot: [-2.72, 2.88, 0.6] },
    { name: "armR", pivot: [-2.72, 2.88, -0.6] },
  ],
  color(tag, p, n, c) {
    const back = new THREE.Color("#382F24"), side = new THREE.Color("#7E6A48"), belly = new THREE.Color("#DCC9A2");
    const mott = fbm(p.x * 1.6, p.y * 1.6, p.z * 1.6);
    if (tag === "mouth") return c.set("#5E2A2A");
    if (tag === "jaw" && n.dot(JAW_UP) > 0.45 && Math.abs(p.z) < 0.24) return c.set("#7A3A36");
    if (tag === "head" && n.y < -0.45 && Math.abs(p.z) < 0.27 && p.x < -3.9) return c.set("#7A3A36");
    const s = n.y + 0.25 * mott;
    c.copy(belly).lerp(side, THREE.MathUtils.smoothstep(s, -0.6, -0.1));
    // sọc ngang lưng
    const stripe = THREE.MathUtils.smoothstep(Math.sin(p.x * 3.1 + 2.2 * fbm(p.x * 0.8, p.y, p.z * 0.8)), 0.35, 0.8);
    c.lerp(back, THREE.MathUtils.smoothstep(s, 0.05, 0.75) * (0.55 + 0.45 * stripe));
    if (tag === "foot" || (tag === "leg" && p.y < 1.0)) c.lerp(new THREE.Color("#4A4033"), 0.5);
    c.multiplyScalar(0.92 + 0.16 * mott);
    return c;
  },
  extras(surf, { extra, gloss }) {
    const tooth = new THREE.Color("#EEE4C8"), toothB = new THREE.Color("#BFA77A"), claw = new THREE.Color("#2A251E"), clawB = new THREE.Color("#4E4436");
    // răng hàm trên
    for (const s of [1, -1])
      for (let x = -5.38; x <= -4.15; x += 0.085) {
        const nd = lerpNodes(SKULL, x);
        const big = 1 - Math.abs((x + 4.85) / 0.75);
        const { p } = toSurface(surf, V(x, nd[1] - nd[3] * 0.82, s * nd[4] * 0.78));
        addCone(extra, p.addScaledVector(V(0, 1, 0), 0.03), V(-0.12, -1, 0), 0.08 + 0.09 * Math.max(0, big), 0.026, toothB, tooth, { flat: 0.6, curve: V(0.12, 0, 0) });
      }
    // răng hàm dưới
    extra.bone = "jaw";
    for (const s of [1, -1])
      for (let x = -5.25; x <= -4.25; x += 0.09) {
        const nd = lerpNodes(JAW0, x);
        const p0 = rotPt([x, nd[1] + nd[3] * 0.8, s * nd[4] * 0.74], HINGE, [0, 0, 1], GAPE);
        const { p } = toSurface(surf, V(p0[0], p0[1], p0[2]));
        addCone(extra, p.addScaledVector(JAW_UP, -0.03), JAW_UP.clone().add(V(-0.1, 0, 0)), 0.07, 0.022, toothB, tooth, { flat: 0.6 });
      }
    // móng chân + móng tay
    for (const l of LEGS)
      for (const [dz, x] of [[-0.2, -0.6], [0, -0.72], [0.2, -0.6]]) {
        extra.bone = `leg${l.n}_lo`;
        const tip = rotPt([x, 0.07, l.z + dz], [HIP[0], HIP[1], l.z], [0, 0, 1], l.a);
        addCone(extra, V(tip[0] + 0.03, tip[1], tip[2]), V(-1, -0.35, dz * 0.6), 0.15, 0.045, clawB, claw, { curve: V(0, -0.4, 0) });
      }
    for (const z of [0.6, -0.6])
      for (const dz of [0.035, -0.035]) (extra.bone = z > 0 ? "armL" : "armR"), addCone(extra, V(-3.31, 2.34, z * 1.06 + dz * 1.5), V(-0.6, -1, 0), 0.06, 0.018, clawB, claw);
    // mắt
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-4.38, 4.47, s * 0.3));
      addSphere(gloss, p.addScaledVector(n, -0.015), 0.045, new THREE.Color("#2A1A08"));
    }
  },
};
