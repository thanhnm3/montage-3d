// Khung chung cho họ "raptor" (Dromaeosauridae) có lông: Velociraptor là đơn vị gốc (dài 2 m, hông 0.5 m),
// Deinonychus / Utahraptor = phóng to + thân nặng hơn. Cánh lông gập ở tay, quạt lông cuối đuôi,
// móng "sát thủ" ở ngón II luôn dựng lên. Đầu về -X, đất y = 0, hàm hé.
import * as THREE from "three";
import { body, tube, slab, ellipsoid, carve, toSurface, addCone, addSphere, rotPt, fbm, rig, lerpNodes, V } from "../sdf.mjs";

export function dromaeosaur(o) {
  const S = o.scale, B = o.bulk ?? 1, LB = o.legBulk ?? B;
  // nút [x,y,z, r...] theo đơn vị Velociraptor -> mét thật; rr = hệ số bán kính
  const n = (q, rr = B) => [q[0] * S, q[1] * S, q[2] * S * rr, ...q.slice(3).map((r) => r * S * rr)];
  const GAPE = o.gape ?? 0.22;
  const HINGE = [-0.515 * S, 0.716 * S, 0];
  const SKULL = [[-0.5, 0.752, 0, 0.05, 0.04], [-0.58, 0.752, 0, 0.044, 0.033], [-0.68, 0.734, 0, 0.03, 0.022], [-0.77, 0.724, 0, 0.018, 0.014], [-0.8, 0.722, 0, 0.008, 0.008]].map((q) => n(q, o.head ?? 1));
  const JAW0 = [[-0.52, 0.712, 0, 0.022, 0.028], [-0.65, 0.702, 0, 0.016, 0.019], [-0.765, 0.704, 0, 0.009, 0.011]].map((q) => n(q, o.head ?? 1));
  const JAW = JAW0.map((q) => rotPt(q, HINGE, [0, 0, 1], GAPE));
  const JAW_UP = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), GAPE);
  const HIPZ = 0.072;
  const KNEE = [-0.08, 0.27];

  function leg(z) {
    const s = z > 0 ? "L" : "R";
    const L = (q) => n(q, LB);
    return [
      ...rig(`leg${s}_up`, body("leg", [[0.02, 0.5, z, 0.088, 0.056], [-0.04, 0.37, z * 1.15, 0.066, 0.044], [KNEE[0], KNEE[1], z * 1.12, 0.032, 0.026]].map(L), { blend: 0.035 * S })),
      ...rig(`leg${s}_lo`,
        tube("leg", [[KNEE[0], KNEE[1], z * 1.12, 0.03], [-0.01, 0.17, z * 1.05, 0.022], [0.05, 0.085, z, 0.015]].map(L), { blend: 0.012 * S }),
        tube("leg", [[0.05, 0.085, z, 0.014], [0.025, 0.05, z, 0.013], [0.0, 0.024, z, 0.013]].map(L), { blend: 0.008 * S }),
        // ngón III, IV chạm đất; ngón II (móng liềm) nhấc lên
        ...[-0.012, 0.012].map((dz) => tube("foot", [[0.0, 0.02, z + dz * 0.4, 0.011], [-0.05, 0.014, z + dz * 0.8, 0.009], [-0.095, 0.011, z + dz, 0.006]].map(L), { blend: 0.006 * S })),
        tube("foot", [[0.0, 0.026, z - Math.sign(z) * 0.016, 0.01], [-0.022, 0.044, z - Math.sign(z) * 0.02, 0.009], [-0.035, 0.05, z - Math.sign(z) * 0.021, 0.007]].map(L), { blend: 0.006 * S }),
      ),
    ];
  }
  function arm(z) {
    const s = z > 0 ? "L" : "R";
    return rig(`arm${s}`,
      tube("arm", [[-0.3, 0.5, z, 0.026], [-0.21, 0.43, z * 1.4, 0.02], [-0.33, 0.405, z * 1.45, 0.015], [-0.39, 0.385, z * 1.4, 0.01]].map((q) => n(q)), { blend: 0.012 * S }),
      // cánh lông gập dọc cẳng tay, rủ ra sau
      slab("wing", [[-0.42, 0.392], [-0.34, 0.43], [-0.22, 0.455], [-0.08, 0.43], [0.03, 0.34], [-0.04, 0.315], [-0.18, 0.33], [-0.32, 0.345]], { origin: [0, 0, z * 1.55 * S * B], u: [S, 0, 0], v: [0, S, 0], half: 0.006 * S, taper: 0.03 * S, blend: 0.008 * S, bend: 0 }),
    );
  }

  return {
    id: o.id,
    voxel: 0.0055 * S,
    boneSharp: 0.012 * S,
    detail: { freq: o.detailFreq ?? 70 / S, amp: 0.0012 * S, stretch: [2.2, 1, 1], tint: 0.08 },
    parts: () => [
      body("body", [[-0.52, 0.735, 0, 0.05, 0.045], [-0.45, 0.645, 0, 0.06, 0.054], [-0.38, 0.56, 0, 0.08, 0.07], [-0.28, 0.51, 0, 0.125, 0.1], [-0.12, 0.5, 0, 0.14, 0.105], [0.02, 0.53, 0, 0.12, 0.095], [0.15, 0.56, 0, 0.09, 0.07], [0.4, 0.585, 0, 0.06, 0.045], [0.7, 0.595, 0, 0.04, 0.03], [1.0, 0.6, 0, 0.025, 0.019], [1.22, 0.6, 0, 0.01, 0.01]].map((q) => n(q)), { blend: 0.02 * S }),
      body("head", SKULL, { blend: 0.02 * S }),
      ...rig("jaw", body("jaw", JAW, { blend: 0.01 * S })),
      ellipsoid("mouth", n([-0.55, 0.722, 0]), [0.04 * S, 0.016 * S, 0.022 * S], { blend: 0.008 * S }),
      slab("tailfan", [[0.62, 0], [0.85, 0.045], [1.1, 0.085], [1.3, 0.055], [1.36, 0], [1.3, -0.055], [1.1, -0.085], [0.85, -0.045]], { origin: [0, 0.6 * S, 0], u: [S, 0, 0], v: [0, 0, S], half: 0.006 * S, taper: 0.025 * S, blend: 0.01 * S }),
      ...leg(HIPZ), ...leg(-HIPZ), ...arm(0.08), ...arm(-0.08),
      carve(ellipsoid("ground", [0, -50, 0], [200, 50, 200]), 0.002 * S),
    ],
    bones: [
      { name: "jaw", pivot: HINGE },
      ...[1, -1].flatMap((s) => {
        const k = s > 0 ? "L" : "R";
        return [
          { name: `leg${k}_up`, pivot: n([0.0, 0.47, s * HIPZ], LB) },
          { name: `leg${k}_lo`, pivot: n([KNEE[0], KNEE[1], s * HIPZ * 1.12], LB), parent: `leg${k}_up` },
          { name: `arm${k}`, pivot: n([-0.3, 0.5, s * 0.08]) },
        ];
      }),
    ],
    // lông: sợi ngắn xuôi về sau (nhiễu kéo dài theo x)
    displace: (x, y, z) => 0.002 * S * fbm((x / S) * 8, (y / S) * 20, (z / S) * 20, 2),
    color(tag, p, nn, c) {
      const q = p.clone().divideScalar(S);
      const mott = fbm(q.x * 9, q.y * 9, q.z * 9);
      if (tag === "mouth") return c.set("#5A2A2A");
      if (tag === "jaw" && nn.dot(JAW_UP) > 0.45 && Math.abs(q.z) < 0.02) return c.set("#7A3A36");
      if (tag === "head" && nn.y < -0.45 && Math.abs(q.z) < 0.025 && q.x < -0.52) return c.set("#7A3A36");
      const s = nn.y + 0.25 * mott;
      c.set(o.belly).lerp(new THREE.Color(o.side), THREE.MathUtils.smoothstep(s, -0.55, -0.1));
      // sọc vằn ngang lưng + đuôi
      const bar = THREE.MathUtils.smoothstep(Math.sin(q.x * (o.barFreq ?? 38) + 1.5 * mott), 0.3, 0.75);
      c.lerp(new THREE.Color(o.back), THREE.MathUtils.smoothstep(s, 0.0, 0.7) * (0.6 + 0.3 * bar));
      if (tag === "wing" || tag === "tailfan") {
        const quill = THREE.MathUtils.smoothstep(Math.abs(Math.sin(q.x * 160)), 0.6, 1.0);
        c.set(o.wing).lerp(new THREE.Color(o.wingTip), THREE.MathUtils.smoothstep(tag === "wing" ? -q.y : Math.abs(q.z), tag === "wing" ? -0.42 : 0.03, tag === "wing" ? -0.35 : 0.08));
        c.multiplyScalar(0.85 + 0.25 * quill);
      }
      // mặt nạ quanh mắt
      if (tag === "head" && o.mask && q.y > 0.735 && q.x > -0.66 && Math.abs(q.z) > 0.02) c.lerp(new THREE.Color(o.mask), 0.75);
      if (tag === "foot" || (tag === "leg" && q.y < 0.14)) c.set(o.scaleFoot);
      return c.multiplyScalar(0.94 + 0.1 * mott);
    },
    extras(surf, { extra, gloss }) {
      const tooth = new THREE.Color("#F0E8D2"), toothB = new THREE.Color("#C9B790"), claw = new THREE.Color("#1F1B17"), clawB = new THREE.Color("#3E362C");
      for (const s of [1, -1]) {
        extra.bone = "root";
        for (let x = -0.775; x <= -0.55; x += 0.016) {
          const nd = lerpNodes(SKULL, x * S);
          const { p } = toSurface(surf, V(x * S, nd[1] - nd[3] * 0.82, s * nd[4] * 0.75));
          addCone(extra, p.addScaledVector(V(0, 1, 0), 0.003 * S), V(0.15, -1, 0), 0.011 * S, 0.003 * S, toothB, tooth, { flat: 0.55, curve: V(0.3, 0, 0) });
        }
        extra.bone = "jaw";
        for (let x = -0.75; x <= -0.57; x += 0.018) {
          const nd = lerpNodes(JAW0, x * S);
          const q = rotPt([x * S, nd[1] + nd[3] * 0.8, s * nd[4] * 0.75], HINGE, [0, 0, 1], GAPE);
          const { p } = toSurface(surf, V(q[0], q[1], q[2]));
          addCone(extra, p.addScaledVector(JAW_UP, -0.003 * S), JAW_UP.clone().add(V(0.15, 0, 0)), 0.009 * S, 0.0026 * S, toothB, tooth, { flat: 0.55 });
        }
        const k = s > 0 ? "L" : "R";
        const z = s * HIPZ;
        extra.bone = `leg${k}_lo`;
        // móng liềm (ngón II) — cong, dựng lên
        addCone(extra, V(-0.032 * S, 0.05 * S, (z - s * 0.021) * S * LB), V(-0.6, 0.75, 0), o.sickle * S, 0.006 * S, clawB, claw, { curve: V(-0.2, -0.9, 0), flat: 0.5 });
        for (const dz of [-0.012, 0.012]) addCone(extra, V(-0.093 * S, 0.011 * S, (z + s * dz) * S * LB), V(-1, -0.3, 0), 0.014 * S, 0.004 * S, clawB, claw, { curve: V(0, -0.5, 0) });
        extra.bone = `arm${k}`;
        for (const dz of [-0.006, 0, 0.006]) addCone(extra, V(-0.392 * S, 0.383 * S, (s * 0.112 + dz) * S * B), V(-0.5, -1, 0), 0.016 * S, 0.0035 * S, clawB, claw, { curve: V(0.4, 0, 0) });
        // mắt
        const { p, n: en } = toSurface(surf, V(-0.565 * S, 0.765 * S, s * 0.03 * S));
        addSphere(gloss, p.addScaledVector(en, -0.002 * S), 0.0085 * S, new THREE.Color(o.eye ?? "#3A2508"));
      }
    },
  };
}
