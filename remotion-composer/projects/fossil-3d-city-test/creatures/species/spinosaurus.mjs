// Spinosaurus aegyptiacus — dài ~14.5 m, buồm lưng ~1.6 m, mõm cá sấu, chân sau ngắn, đuôi mái chèo (bản 2020).
import * as THREE from "three";
import { body, tube, ellipsoid, slab, toSurface, addCone, addSphere, rotPt, fbm, lerpNodes, rig, V } from "../sdf.mjs";

const GAPE = 0.2;
const HINGE = [-4.85, 3.56, 0];
const SKULL = [[-4.8, 3.76, 0, 0.25, 0.21], [-5.25, 3.7, 0, 0.19, 0.14], [-5.7, 3.59, 0, 0.13, 0.1], [-6.15, 3.51, 0, 0.1, 0.08], [-6.45, 3.49, 0, 0.11, 0.1], [-6.62, 3.48, 0, 0.065, 0.065]];
const JAW0 = [[-4.85, 3.5, 0, 0.13, 0.17], [-5.4, 3.41, 0, 0.1, 0.11], [-6.0, 3.34, 0, 0.075, 0.08], [-6.45, 3.32, 0, 0.08, 0.09], [-6.58, 3.32, 0, 0.05, 0.06]];
const JAW = JAW0.map((n) => rotPt(n, HINGE, [0, 0, 1], GAPE));
const JAW_UP = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), GAPE);
const HIP = [0.1, 2.45];
const LEGS = [{ z: 0.48, a: 0, n: "L" }, { z: -0.48, a: 0, n: "R" }];

function leg(z, a) {
  const r = (n) => rotPt(n, [HIP[0], HIP[1], z], [0, 0, 1], a);
  const n = z > 0 ? "L" : "R";
  return [
    ...rig(`leg${n}_up`, body("leg", [[0.22, 2.62, z * 1.05, 0.56, 0.37], [0.0, 2.1, z * 1.14, 0.48, 0.32], [-0.3, 1.55, z * 1.1, 0.26, 0.22]].map(r), { blend: 0.3 })),
    ...rig(`leg${n}_lo`, body("leg", [[-0.3, 1.52, z * 1.1, 0.22, 0.2], [-0.05, 1.1, z * 1.05, 0.17, 0.15], [0.18, 0.7, z, 0.11, 0.1]].map(r), { blend: 0.1 }),
    tube("leg", [[0.18, 0.7, z, 0.1], [0.08, 0.36, z, 0.09], [0.0, 0.15, z, 0.09]].map(r), { blend: 0.07 }),
    ...[-0.22, -0.07, 0.08, 0.22].map((dz, i) =>
      tube("foot", [[0.0, 0.13, z + dz * 0.3, 0.07], [-0.3, 0.07, z + dz * 0.8, 0.055], [i === 0 ? -0.42 : -0.62, 0.05, z + dz, 0.04]].map(r), { blend: 0.06 }),
    )),
  ];
}

export default {
  id: "spinosaurus",
  voxel: 0.04,
  parts: () => [
    body("body", [[-4.85, 3.62, 0, 0.27, 0.23], [-4.3, 3.45, 0, 0.32, 0.27], [-3.6, 3.12, 0, 0.46, 0.38], [-2.8, 2.78, 0, 0.72, 0.58], [-1.8, 2.62, 0, 0.86, 0.68], [-0.8, 2.62, 0, 0.82, 0.66], [0.2, 2.72, 0, 0.66, 0.52], [1.4, 2.76, 0.02, 0.56, 0.36], [2.6, 2.72, 0.1, 0.52, 0.25], [3.8, 2.64, 0.28, 0.48, 0.18], [5.0, 2.56, 0.52, 0.4, 0.13], [6.2, 2.52, 0.8, 0.28, 0.09], [7.2, 2.53, 1.02, 0.14, 0.055], [7.9, 2.58, 1.14, 0.04, 0.03]], { blend: 0.18 }),
    body("head", SKULL, { blend: 0.18 }),
    ellipsoid("head", [-5.1, 3.9, 0], [0.32, 0.09, 0.05], { blend: 0.1, rotZ: 0.1 }),
    ...rig("jaw", body("jaw", JAW, { blend: 0.08 })),
    ellipsoid("mouth", [-5.0, 3.55, 0], [0.32, 0.12, 0.14], { blend: 0.08 }),
    slab("sail", [[-3.45, 3.15], [-3.3, 3.95], [-2.8, 4.6], [-2.0, 4.98], [-1.2, 5.08], [-0.4, 4.88], [0.4, 4.38], [1.1, 3.78], [1.65, 3.25], [1.2, 2.95], [-1.0, 2.95]], { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 0.075, taper: 0.5, blend: 0.3 }),
    ...LEGS.flatMap((l) => leg(l.z, l.a)),
    ...[0.55, -0.55].flatMap((z) => rig(z > 0 ? "armL" : "armR", [
      tube("arm", [[-2.5, 2.35, z, 0.18], [-2.58, 1.78, z * 1.1, 0.13], [-2.9, 1.36, z * 1.05, 0.1]], { blend: 0.14 }),
      ...[0.06, 0, -0.06].map((dz) => tube("arm", [[-2.9, 1.36, z * 1.05 + dz * 0.5, 0.075], [-3.06, 1.12, z * 1.05 + dz, 0.045]], { blend: 0.04 })),
    ])),
  ],
  bones: [
    { name: "jaw", pivot: HINGE },
    { name: "legL_up", pivot: [HIP[0], HIP[1], 0.48] },
    { name: "legL_lo", pivot: [-0.3, 1.53, 0.53], parent: "legL_up" },
    { name: "legR_up", pivot: [HIP[0], HIP[1], -0.48] },
    { name: "legR_lo", pivot: [-0.3, 1.53, -0.53], parent: "legR_up" },
    { name: "armL", pivot: [-2.5, 2.35, 0.55] },
    { name: "armR", pivot: [-2.5, 2.35, -0.55] },
  ],
  color(tag, p, n, c) {
    const mott = fbm(p.x * 1.8, p.y * 1.8, p.z * 1.8);
    if (tag === "mouth") return c.set("#5E2A2A");
    if (tag === "jaw" && n.dot(JAW_UP) > 0.45 && Math.abs(p.z) < 0.08) return c.set("#7A3A36");
    if (tag === "head" && n.y < -0.45 && Math.abs(p.z) < 0.09 && p.x < -4.8) return c.set("#7A3A36");
    if (tag === "sail") {
      const h = THREE.MathUtils.smoothstep(p.y, 3.3, 4.6);
      c.set("#5A4B3A").lerp(new THREE.Color("#A2472A"), h);
      const spine = Math.abs(((p.x / 0.24) % 1 + 1) % 1 - 0.5) * 2;
      c.multiplyScalar(0.72 + 0.28 * THREE.MathUtils.smoothstep(spine, 0.1, 0.5));
      if (p.y > 4.5) c.lerp(new THREE.Color("#2F2620"), THREE.MathUtils.smoothstep(p.y, 4.6, 5.0) * 0.6);
      return c.multiplyScalar(0.92 + 0.15 * mott);
    }
    const s = n.y + 0.25 * mott;
    c.set("#D4CAA9").lerp(new THREE.Color("#6E6B57"), THREE.MathUtils.smoothstep(s, -0.6, -0.1));
    const band = THREE.MathUtils.smoothstep(Math.sin(p.x * 2.4 + 2 * fbm(p.x * 0.7, 0, p.z)), 0.4, 0.9);
    c.lerp(new THREE.Color("#353B37"), THREE.MathUtils.smoothstep(s, 0.1, 0.8) * (0.6 + 0.4 * band));
    if (tag === "foot" || (tag === "leg" && p.y < 0.8)) c.lerp(new THREE.Color("#3E3A32"), 0.45);
    return c.multiplyScalar(0.92 + 0.16 * mott);
  },
  extras(surf, { extra, gloss }) {
    const tooth = new THREE.Color("#EEE6CF"), toothB = new THREE.Color("#C2AE86"), claw = new THREE.Color("#27231D"), clawB = new THREE.Color("#4A4235");
    for (const s of [1, -1]) {
      extra.bone = "root";
      for (let x = -6.55; x <= -5.0; x += 0.075) {
        const nd = lerpNodes(SKULL, x);
        const { p } = toSurface(surf, V(x, nd[1] - nd[3] * 0.8, s * nd[4] * 0.8));
        const big = x < -6.3 ? 1.3 : 1;
        addCone(extra, p.addScaledVector(V(0, 1, 0), 0.02), V(-0.05, -1, s * 0.25), 0.07 * big, 0.016, toothB, tooth, { flat: 0.8 });
      }
      extra.bone = "jaw";
      for (let x = -6.5; x <= -5.1; x += 0.08) {
        const nd = lerpNodes(JAW0, x);
        const q = rotPt([x, nd[1] + nd[3] * 0.8, s * nd[4] * 0.8], HINGE, [0, 0, 1], GAPE);
        const { p } = toSurface(surf, V(q[0], q[1], q[2]));
        addCone(extra, p.addScaledVector(JAW_UP, -0.02), JAW_UP.clone().add(V(0, 0, s * 0.25)), 0.06, 0.015, toothB, tooth, { flat: 0.8 });
      }
    }
    for (const l of LEGS)
      for (const [dz, x] of [[-0.22, -0.42], [-0.07, -0.62], [0.08, -0.62], [0.22, -0.62]]) {
        extra.bone = `leg${l.n}_lo`;
        const tip = rotPt([x, 0.05, l.z + dz], [HIP[0], HIP[1], l.z], [0, 0, 1], l.a);
        addCone(extra, V(tip[0] + 0.02, tip[1], tip[2]), V(-1, -0.3, dz * 0.5), 0.12, 0.035, clawB, claw, { curve: V(0, -0.35, 0) });
      }
    for (const z of [0.55, -0.55])
      for (const [dz, L] of [[0.06, 0.2], [0, 0.13], [-0.06, 0.13]]) (extra.bone = z > 0 ? "armL" : "armR"), addCone(extra, V(-3.05, 1.13, z * 1.05 + dz), V(-0.5, -1, 0), L, 0.03, clawB, claw, { curve: V(0.3, 0, 0) });
    for (const s of [1, -1]) {
      const { p, n } = toSurface(surf, V(-4.98, 3.86, s * 0.18));
      addSphere(gloss, p.addScaledVector(n, -0.012), 0.035, new THREE.Color("#2E1C08"));
    }
  },
};
