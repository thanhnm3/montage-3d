// Chuyển động từng loài — hàm thuần của t (giây). Mọi chu kỳ chia hết 8 s để video quay vòng 240 frame lặp liền.
// bones: góc xoay [rx, ry, rz] (+ dịch [dx, dy, dz] tuỳ chọn) quanh pivot của xương (toạ độ gốc).
// warp: cộng thêm độ lệch theo toạ độ GỐC của đỉnh (sóng bơi, quẫy đuôi, gật đầu).
export type Pose = { bones: Record<string, number[]>; warp?: (x: number, y: number, z: number, out: number[]) => void };

const TAU = Math.PI * 2;
const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// nhịp "gầm"/há miệng: 0 -> 1 -> 0 trong khoảng [a, b] của chu kỳ period
const pulse = (t: number, period: number, a: number, b: number) => {
  const u = ((t % period) + period) % period;
  return u < a || u > b ? 0 : Math.sin((Math.PI * (u - a)) / (b - a)) ** 2;
};

// chân đi bộ: đùi lắc quanh hông, cẳng gập khi nhấc chân (pha vung về trước)
function stride(ph: number, hipAmp: number, knee: number, kneeSign = 1) {
  const hip = -hipAmp * Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph));
  return { up: [0, 0, hip], lo: [0, 0, kneeSign * knee * lift * lift] };
}

// theropod đi 2 chân (T. rex, Spinosaurus)
function theropod(t: number, o: { period: number; hip: number; knee: number; tailX: number; tailLen: number; tailAmp: number; neckX: number; roar: number; s?: number; roarAt?: [number, number] }): Pose {
  const ph = (TAU * t) / o.period;
  const k = o.s ?? 1;
  const L = stride(ph, o.hip, o.knee);
  const R = stride(ph + Math.PI, o.hip, o.knee);
  const roar = pulse(t, 8, ...(o.roarAt ?? [4.4, 6.0]));
  return {
    bones: {
      legL_up: L.up, legL_lo: L.lo, legR_up: R.up, legR_lo: R.lo,
      armL: [0, 0, 0.18 * Math.sin(ph + 0.6)], armR: [0, 0, 0.18 * Math.sin(ph + 0.6 + Math.PI)],
      jaw: [0, 0, -0.2 + o.roar * roar],
    },
    warp(x, y, z, out) {
      if (x > o.tailX) {
        const s = Math.min(1, (x - o.tailX) / o.tailLen);
        out[2] += o.tailAmp * s ** 1.6 * Math.sin(ph - 2.4 * s);
        out[1] += 0.06 * k * s * Math.sin(2 * ph - 1);
      }
      if (x < o.neckX) {
        const h = Math.min(1, (o.neckX - x) / (2.5 * k));
        out[2] += 0.1 * k * h * Math.sin(ph + 0.8);
        out[1] += k * h * (0.05 * Math.sin(2 * ph + 0.4) + 0.25 * roar * h);
      }
    },
  };
}

// 4 chân, thứ tự bước kiểu đi bộ: sau-trái, trước-trái, sau-phải, trước-phải
function quadLegs(ph: number, o: { front: [string, string]; hind: [string, string]; hip: number; knee: number; hipF?: number; kneeF?: number }) {
  const out: Record<string, number[]> = {};
  const legs: [string, number, number, number][] = [
    [o.hind[0], 0, o.hip, o.knee],
    [o.front[0], 0.25, o.hipF ?? o.hip, o.kneeF ?? o.knee],
    [o.hind[1], 0.5, o.hip, o.knee],
    [o.front[1], 0.75, o.hipF ?? o.hip, o.kneeF ?? o.knee],
  ];
  for (const [n, f, a, k] of legs) {
    const s = stride(ph + TAU * f, a, k);
    out[`${n}_up`] = s.up;
    out[`${n}_lo`] = s.lo;
  }
  return out;
}

// cá/bò sát biển bơi: sóng ngang chạy dọc thân, biên độ lớn dần về đuôi
function swim(t: number, o: { period: number; x0: number; len: number; amp: number; head: number; waves: number }) {
  const ph = (TAU * t) / o.period;
  return (x: number, y: number, z: number, out: number[]) => {
    const s = Math.min(1, Math.max(0, (x - o.x0) / o.len));
    out[2] += (o.head + o.amp * s ** 2.2) * Math.sin(ph - TAU * o.waves * s);
    out[1] += 0.04 * Math.sin(ph * 2 - 2 * s);
  };
}

// raptor: đơn vị Velociraptor (dài 2 m), S = tỉ lệ; walk = 0 -> đứng thở
const raptor = (S: number, period: number, walk = 1) => (t: number) =>
  theropod(t, { period, hip: 0.34 * walk, knee: 0.8 * walk, tailX: 0.15 * S, tailLen: 1.1 * S, tailAmp: (walk ? 0.07 : 0.04) * S, neckX: -0.35 * S, roar: 0.35, s: 0.2 * S, roarAt: [2.2, 3.4] });

const lion = (walk: number) => (t: number): Pose => {
  const ph = (TAU * t) / 1.6;
  const snarl = pulse(t, 8, 3.0, 4.6);
  return {
    bones: {
      ...quadLegs(ph, { front: ["FL", "FR"], hind: ["HL", "HR"], hip: 0.32 * walk, knee: 0.7 * walk }),
      tail: [0.25 * Math.sin((TAU * t) / 4), 0.15 * Math.sin((TAU * t) / 2), 0.08 * Math.sin(ph)],
      jaw: [0, 0, 0.35 * snarl],
    },
    warp(x, y, z, out) {
      out[1] += 0.008 * Math.sin((TAU * t) / 4) * Math.max(0, 1 - Math.abs(x) / 1.5);
      if (x < -0.9) out[1] += (walk ? 0.03 : 0.01) * Math.sin(2 * ph);
    },
  };
};

export const ANIM: Record<string, (t: number) => Pose> = {
  velociraptor: raptor(1, 0.8),
  velociraptor_idle: raptor(1, 4, 0),
  deinonychus: raptor(1.7, 1),
  deinonychus_idle: raptor(1.7, 4, 0),
  utahraptor: raptor(2.95, 1.6),
  utahraptor_idle: raptor(2.95, 4, 0),
  lion: lion(1),
  lion_idle: lion(0),

  t_rex: (t) => theropod(t, { period: 1.6, hip: 0.3, knee: 0.7, tailX: 0.6, tailLen: 6.2, tailAmp: 0.32, neckX: -2.6, roar: 0.55 }),
  spinosaurus: (t) => theropod(t, { period: 2, hip: 0.26, knee: 0.6, tailX: 0.8, tailLen: 7, tailAmp: 0.45, neckX: -3.2, roar: 0.4 }),

  mosasaurus: (t) => {
    const ph = (TAU * t) / 2;
    const snap = pulse(t, 4, 1.2, 2.2);
    const fl = 0.28 * Math.sin(ph + 0.5), hl = 0.22 * Math.sin(ph + 1.8);
    return {
      bones: { jaw: [0, 0, -0.22 + 0.5 * snap], finFL: [fl, 0, 0], finFR: [-fl, 0, 0], finHL: [hl, 0, 0], finHR: [-hl, 0, 0] },
      warp: swim(t, { period: 2, x0: -6.6, len: 13.4, amp: 0.75, head: 0.06, waves: 0.75 }),
    };
  },
  dunkleosteus: (t) => {
    const ph = (TAU * t) / 1.6;
    const snap = pulse(t, 4, 2.0, 2.8);
    const pec = 0.3 * Math.sin(ph + 0.7);
    return {
      bones: { jaw: [0, 0, -0.35 + 0.55 * snap], pecL: [pec, 0, 0], pecR: [-pec, 0, 0] },
      warp: swim(t, { period: 1.6, x0: -2.1, len: 4.5, amp: 0.42, head: 0.025, waves: 0.6 }),
    };
  },

  quetzalcoatlus: (t) => {
    const ph = (TAU * t) / 2;
    return {
      bones: quadLegs(ph, { front: ["armL", "armR"], hind: ["legL", "legR"], hip: 0.3, knee: 0.45, hipF: 0.22, kneeF: 0.3 }),
      warp(x, y, z, out) {
        if (y > 2.9 && x < -0.5) {
          const h = Math.min(1, (y - 2.9) / 2.1);
          out[0] += 0.14 * h * Math.sin(2 * ph);
          out[1] += 0.06 * h * Math.sin(2 * ph - 0.6);
        }
      },
    };
  },
  giraffe: (t) => {
    const ph = (TAU * t) / 2;
    return {
      bones: { ...quadLegs(ph, { front: ["FL", "FR"], hind: ["HL", "HR"], hip: 0.26, knee: 0.55 }), tail: [0.35 * Math.sin(ph * 0.5), 0, 0.1 * Math.sin(ph)] },
      warp(x, y, z, out) {
        if (y > 2.7 && x < -0.8) {
          const h = Math.min(1, (y - 2.7) / 2.6);
          out[0] += 0.16 * h * Math.sin(2 * ph);
          out[2] += 0.05 * h * Math.sin(ph);
        }
      },
    };
  },
  woolly_mammoth: (t) => {
    const ph = (TAU * t) / 2;
    return {
      bones: { ...quadLegs(ph, { front: ["FL", "FR"], hind: ["HL", "HR"], hip: 0.2, knee: 0.4 }), trunk: [0.12 * Math.sin(ph), 0, 0.1 * Math.sin(ph + 1.2)], tail: [0.3 * Math.sin(ph), 0, 0] },
      warp(x, y, z, out) {
        if (x < -1.4) out[1] += 0.04 * Math.min(1, (-1.4 - x) / 0.8) * Math.sin(2 * ph);
      },
    };
  },
  african_elephant: (t) => {
    const ph = (TAU * t) / 2;
    const flap = 0.28 * (0.5 + 0.5 * Math.sin((TAU * t * 3) / 8));
    return {
      bones: {
        ...quadLegs(ph, { front: ["FL", "FR"], hind: ["HL", "HR"], hip: 0.2, knee: 0.4 }),
        trunk: [0.12 * Math.sin(ph), 0, 0.12 * Math.sin(ph + 1.2)],
        tail: [0.3 * Math.sin(ph), 0, 0],
        earL: [0, -flap, 0],
        earR: [0, flap, 0],
      },
      warp(x, y, z, out) {
        if (x < -1.4) out[1] += 0.04 * Math.min(1, (-1.4 - x) / 0.8) * Math.sin(2 * ph);
      },
    };
  },
};

export { ss, pulse, stride, TAU };
