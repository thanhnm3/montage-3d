// r04 (2026-11-04): every animated prop of 004 drawn the way toon.ts draws the host (bean contours, flat fill + a soft
// painted crescent away from the light, thick-thin plum outline weighted away from the light, ink-dot details, deadpan
// faces). Each drawer paints on a canvas in its own design space; ToonCard.tsx puts it on a camera-facing card in 3D.
//   cow 760 x 560 (side, facing right, hooves at y 530)   bird 320 x 240 (side, facing right)   rock 300 x 240
//   leaf 160 x 160   stopwatch 420 x 480   clock24 420 x 420   scissors 560 x 300   cloud 600 x 300 (toon.ts fxCloud)
//   brain 1000 x 760 (side view, front to the left, 12 regions that light up / switch off)
//   aura 600 x 300 (telekinesis glow, top-down ellipse)   burst 500 x 500 / stars 420 x 210 / puff 300 x 300 (toon.ts fx)
import { Blob, INK, Pen, blobPts, mix, shade, thickAngle } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const blob = (a: number, b: number, seed: number, o: Partial<Blob> = {}): Blob =>
  ({ a, b, nTop: 2.2, nBot: 2.5, egg: 0, asym: 0, rot: 0, noise: 0.01, seed, ...o });
/** flat fill + crescent away from the light + thick-thin ink ring: the toon.ts recipe for any closed shape */
const body = (p: Pen, pts: P2[], col: string, light: number, R: number, ow: number, k = 0.7) => {
  p.shadedFill(pts, col, shade(col, k), light, R);
  p.inkRing(pts, ow, thickAngle(light));
};
const PINK = "#F4B3BB", WHITE = "#FFFDF7";

// ---------------------------------------------------------------- cow
export type CowState = { eyes?: "dot" | "shock" | "shut" | "half"; chew?: number; dangle?: number; wave?: number; blink?: boolean };
export const COW_W = 760, COW_H = 560;
export const drawCow = (p: Pen, s: CowState, light: number) => {
  const ow = 11, hide = "#2E2A36", hoof = "#4A3A3A";
  const legCol = mix(WHITE, INK, 0.12), farLeg = mix(WHITE, INK, 0.3);
  const dg = s.dangle ?? 0;
  // legs: far pair first (darker), near pair over the body edge; dangle swings them when the cow is lifted
  const leg = (x: number, far: boolean, ph: number, raise = 0) => {
    const top: P2 = [x, 330], sw = dg * 16 * Math.sin(ph);
    let foot: P2 = [x + sw, 512 - (far ? 6 : 0)];
    if (raise) foot = [x + 70 * raise, 512 - 150 * raise];
    const knee: P2 = [(top[0] + foot[0]) / 2 + (raise ? 26 * raise : 0), (top[1] + foot[1]) / 2];
    p.line([top, knee, foot], far ? farLeg : legCol, 34);
    p.poly([[foot[0] - 20, foot[1] - 8], [foot[0] + 20, foot[1] - 8], [foot[0] + 22, foot[1] + 18], [foot[0] - 22, foot[1] + 18]], hoof, 8);
  };
  leg(215, true, 1.3); leg(470, true, 2.1);
  // tail with a tuft
  p.line([[140, 250], [110, 320], [118, 400]], legCol, 14);
  p.ell(120, 410, 20, 26, hide, 8);
  // body
  const B = blobPts(330, 300, blob(215, 118, 3, { nTop: 2.6, nBot: 2.8 }));
  p.shadedFill(B, WHITE, "#D8D2E2", light, 215);
  p.clip(B, () => {
    for (const [x, y, a, b, sd] of [[230, 240, 70, 52, 5], [410, 330, 64, 48, 6], [300, 395, 50, 30, 7]] as const)
      p.poly(blobPts(x, y, blob(a, b, sd, { noise: 0.06 })), hide, 0);
  });
  p.inkRing(B, ow, thickAngle(light));
  p.ell(240, 410, 34, 22, PINK, 7); // udder
  leg(255, false, 0.4); leg(505, false, 3.2, s.wave ?? 0);
  // head: ears + horns behind, skull, snout
  const hx = 585, hy = 215;
  p.ell(hx - 70, hy - 30, 42, 18, "#E8E1EE", 8, 0, 360, -25);
  p.ell(hx + 74, hy - 36, 42, 18, "#E8E1EE", 8, 0, 360, 20);
  p.poly([[hx - 40, hy - 62], [hx - 52, hy - 104], [hx - 24, hy - 70]], "#F2E3C0", 7);
  p.poly([[hx + 34, hy - 66], [hx + 50, hy - 108], [hx + 56, hy - 64]], "#F2E3C0", 7);
  const Hd = blobPts(hx, hy, blob(82, 76, 11, { nTop: 2.0, nBot: 2.4, egg: -0.1 }));
  body(p, Hd, WHITE, light, 82, ow, 0.86);
  p.clip(Hd, () => p.poly(blobPts(hx - 40, hy - 50, blob(40, 34, 12, { noise: 0.05 })), hide, 0));
  p.inkRing(Hd, ow, thickAngle(light));
  const chew = s.chew ?? 0, my = hy + 64 + 4 * Math.sin(chew * Math.PI * 2);
  const Sn = blobPts(hx + 18, my, blob(64, 40, 13));
  body(p, Sn, PINK, light, 64, 9, 0.85);
  p.dot(hx - 2, my - 6, 7); p.dot(hx + 38, my - 6, 7);
  p.stroke([[hx + 2, my + 22], [hx + 18, my + 26 + 3 * Math.sin(chew * Math.PI * 4)], [hx + 34, my + 22]], 6);
  // eyes (3/4 view: two, the far one smaller)
  const ey = hy - 8;
  for (const [x, r] of [[hx - 18, 1], [hx + 30, 0.9]] as const) {
    const k = s.blink ? "shut" : s.eyes ?? "dot";
    if (k === "dot") p.ell(x, ey, 9 * r, 13 * r, INK, 0);
    else if (k === "half") { p.ell(x, ey + 2, 13 * r, 8 * r, INK, 0, 0, 180); p.stroke([[x - 15, ey + 2], [x + 15, ey + 2]], 6); }
    else if (k === "shut") p.stroke([[x - 13, ey], [x + 13, ey]], 6);
    else { p.ell(x, ey, 20 * r, 20 * r, "#FFFFFF", 6); p.dot(x + 3, ey + 2, 7 * r); }
  }
};

// ---------------------------------------------------------------- bird
export const BIRD_W = 320, BIRD_H = 240;
export const drawBird = (p: Pen, flap: number, light: number, shock = false) => {
  const col = "#4E8FE0", ow = 8;
  p.poly([[96, 130], [30, 108], [40, 150]], shade(col, 0.8), ow); // tail
  const wing = (front: boolean) => {
    const a = rad(-35 - (front ? 55 : 40) * flap); // wing angle from the shoulder (canvas degrees, up = negative)
    const sx = 155 + (front ? 0 : 12), sy = 118, L = 62;
    const cx = sx + Math.cos(a) * L * 0.75 - 18, cy = sy + Math.sin(a) * L * 0.75;
    p.ell(cx, cy, L, 26, front ? shade(col, 0.95) : shade(col, 0.68), ow, 0, 360, (a * 180) / Math.PI + 180);
  };
  wing(false);
  const B = blobPts(165, 135, blob(72, 50, 21, { egg: 0.1 }));
  body(p, B, col, light, 72, ow);
  p.clip(B, () => p.ell(175, 170, 52, 30, "#DCEBFF", 0));
  p.inkRing(B, ow, thickAngle(light));
  p.poly([[232, 118], [272, 128], [230, 140]], "#F2A43A", 6); // beak
  if (shock) { p.ell(208, 112, 13, 13, "#FFFFFF", 5); p.dot(210, 113, 5); } else p.ell(208, 112, 6, 8, INK, 0);
  wing(true);
};

// ---------------------------------------------------------------- rock, leaf
export const ROCK_W = 300, ROCK_H = 240;
export const drawRock = (p: Pen, seed: number, light: number) => {
  const pts = blobPts(150, 140, blob(118, 82, seed, { nTop: 1.8, nBot: 3.2, noise: 0.05, asym: 0.08 }));
  body(p, pts, "#A39CB0", light, 118, 10, 0.68);
  p.stroke([[110 + 10 * rnd(seed, 1), 92], [128, 120], [118, 150]], 6);
  p.stroke([[190, 130], [208, 150]], 5);
};
export const LEAF_W = 160, LEAF_H = 160;
export const drawLeaf = (p: Pen, light: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, w = Math.sin(Math.PI * t) * 46; pts.push([30 + 100 * t, 80 - w]); }
  for (let i = 24; i >= 0; i--) { const t = i / 24, w = Math.sin(Math.PI * t) * 40; pts.push([30 + 100 * t, 80 + w]); }
  body(p, pts, "#7DBB4C", light, 60, 7, 0.75);
  p.stroke([[20, 84], [128, 78]], 5);
};

// ---------------------------------------------------------------- stopwatch (time stops), 24 h clock
export const WATCH_W = 420, WATCH_H = 480;
export const drawStopwatch = (p: Pen, hand: number, light: number) => {
  p.poly([[180, 40], [240, 40], [240, 96], [180, 96]], "#D9A033", 9);
  p.ell(210, 34, 44, 18, "#D9A033", 9);
  const R = blobPts(210, 280, blob(178, 178, 31, { nTop: 2, nBot: 2, noise: 0.004 }));
  body(p, R, "#E5342F", light, 178, 12, 0.72);
  p.ell(210, 280, 140, 140, "#FFF3D6", 9);
  for (let i = 0; i < 12; i++) { const a = rad(i * 30); p.stroke([[210 + 112 * Math.sin(a), 280 - 112 * Math.cos(a)], [210 + 128 * Math.sin(a), 280 - 128 * Math.cos(a)]], i % 3 ? 5 : 9); }
  const a = rad(hand * 360);
  p.stroke([[210, 280], [210 + 104 * Math.sin(a), 280 - 104 * Math.cos(a)]], 10, INK);
  p.dot(210, 280, 13);
};
export const CLOCK_W = 420, CLOCK_H = 420;
export const drawClock24 = (p: Pen, k: number, light: number) => {
  const c = 210, R = 150;
  const ring = blobPts(c, c, blob(R + 34, R + 34, 41, { nTop: 2, nBot: 2, noise: 0.004 }));
  body(p, ring, "#7B5AC9", light, R + 34, 12, 0.72);
  p.ell(c, c, R, R, "#FFF3D6", 9);
  const g = p.g, ang = Math.min(k, 0.9999) * Math.PI * 2;
  if (k > 0) { g.beginPath(); g.moveTo(c, c); g.arc(c, c, R - 6, -Math.PI / 2, -Math.PI / 2 + ang); g.closePath(); g.fillStyle = "#FFD23F"; g.fill(); }
  for (let i = 0; i < 24; i++) { const a = rad(i * 15); p.stroke([[c + (R - (i % 6 ? 16 : 30)) * Math.sin(a), c - (R - (i % 6 ? 16 : 30)) * Math.cos(a)], [c + (R - 4) * Math.sin(a), c - (R - 4) * Math.cos(a)]], i % 6 ? 4 : 8); }
  p.ell(c, c, R, R, null, 9);
  p.stroke([[c, c], [c + (R - 24) * Math.sin(ang), c - (R - 24) * Math.cos(ang)]], 12, "#E5342F");
  p.dot(c, c, 14);
};

// ---------------------------------------------------------------- scissors
export const SCIS_W = 560, SCIS_H = 300;
export const drawScissors = (p: Pen, open: number, light: number) => {
  const piv: P2 = [250, 150];
  // two rigid halves: blade on one side of the axis, its handle ring on the other (they cross at the pivot)
  const half = (s: number) => {
    const a = rad(s * (3 + 22 * open));
    const R = (q: P2): P2 => [piv[0] + (q[0] - piv[0]) * Math.cos(a) - (q[1] - piv[1]) * Math.sin(a), piv[1] + (q[0] - piv[0]) * Math.sin(a) + (q[1] - piv[1]) * Math.cos(a)];
    const ring = blobPts(...R([112, 150 - 50 * s]), blob(46, 34, 51 + s));
    p.line([R([236, 150]), R([150, 150 - 38 * s])], "#E5342F", 26);
    p.inkRing(ring, 34, thickAngle(light), 0.15, INK);
    p.inkRing(ring, 22, thickAngle(light), 0.15, "#E5342F");
    body(p, [R([222, 150]), R([548, 150 + 4 * s]), R([300, 150 + 46 * s]), R([250, 150 + 40 * s])], "#DDE3EE", light, 120, 8, 0.8);
  };
  half(-1); half(1);
  p.dot(piv[0], piv[1], 12);
};

// ---------------------------------------------------------------- telekinesis aura (top-down rings under a lifted object)
export const AURA_W = 600, AURA_H = 300;
export const drawAura = (p: Pen, t: number, k: number) => {
  const g = p.g;
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.9 + i / 3) % 1);
    g.beginPath(); g.ellipse(300, 150, 120 + 160 * u, 50 + 80 * u, 0, 0, Math.PI * 2);
    g.lineWidth = 16 * (1 - u) + 4; g.strokeStyle = `rgba(255,214,90,${(k * (1 - u)).toFixed(3)})`; g.stroke();
  }
};

// ---------------------------------------------------------------- the brain (side view, front to the left)
export const BRAIN_W = 1000, BRAIN_H = 760;
export const N_REG = 12;
/** region seeds, region 0 = the "10%" (upper front) */
export const SEEDS: P2[] = [[250, 190], [420, 130], [600, 150], [760, 230], [180, 330], [360, 280], [540, 300], [720, 380],
  [270, 460], [450, 440], [610, 470], [820, 450]];
const CER: P2[] = (() => {
  const pts = blobPts(490, 330, blob(410, 270, 61, { nTop: 2.15, nBot: 2.5, egg: 0.04, asym: -0.03, noise: 0.012 }), 120);
  return pts.map(([x, y]) => {
    if (y > 470) y = 470 + (y - 470) * 0.45; // flat underside
    if (y > 420 && x < 520 && x > 250) y += 30 * Math.sin(((x - 250) / 270) * Math.PI); // temporal lobe bulges down
    return [x, y] as P2;
  });
})();
const CBL: P2[] = blobPts(720, 548, blob(150, 88, 63, { nTop: 2.2, nBot: 2.4 }), 72);
/** Voronoi cell of one seed, clipped to a box (Sutherland-Hodgman against every bisector) */
const cell = (i: number): P2[] => {
  let poly: P2[] = [[0, 0], [BRAIN_W, 0], [BRAIN_W, BRAIN_H], [0, BRAIN_H]];
  const [sx, sy] = SEEDS[i];
  for (let j = 0; j < N_REG; j++) {
    if (j === i) continue;
    const [ox, oy] = SEEDS[j], nx = ox - sx, ny = oy - sy, c = (nx * (ox + sx) + ny * (oy + sy)) / 2;
    const inside = (q: P2) => q[0] * nx + q[1] * ny <= c;
    const out: P2[] = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k], b = poly[(k + 1) % poly.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const da = a[0] * nx + a[1] * ny - c, db = b[0] * nx + b[1] * ny - c, t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    poly = out;
  }
  return poly;
};
const CELLS = Array.from({ length: N_REG }, (_, i) => cell(i));
/** cartoon gyri: short C / S squiggles on a jittered grid (no crossings), the classic drawn-brain folds */
const SULCI: P2[][] = (() => {
  const out: P2[][] = [];
  let i = 0;
  for (let gy = 110; gy < 500; gy += 92) for (let gx = 120 + ((gy / 92) % 2) * 50; gx < 880; gx += 118) {
    i++;
    const x = gx + (rnd(7, i) - 0.5) * 40, y = gy + (rnd(9, i) - 0.5) * 34, a = (rnd(11, i) - 0.5) * 1.6, L = 34 + rnd(13, i) * 18;
    const bend = (rnd(17, i) < 0.5 ? 1 : -1) * (24 + rnd(19, i) * 16), sS = rnd(23, i) < 0.5;
    const c = Math.cos(a), s2 = Math.sin(a), q = (u: number, v: number): P2 => [x + u * c - v * s2, y + u * s2 + v * c];
    out.push(sS ? [q(-L * 1.5, 0), q(-L * 0.6, bend), q(L * 0.2, 0), q(L * 0.9, -bend * 0.8), q(L * 1.5, 0)] : [q(-L, 0), q(-L * 0.3, bend), q(L * 0.4, bend * 0.9), q(L, 0)]);
  }
  return out;
})();
const smoothLine = (pts: P2[]): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 6; k++) {
      const t = k / 6, t2 = t * t, t3 = t2 * t;
      const f = (u: number, v: number, w: number, z: number) => 0.5 * (2 * v + (-u + w) * t + (2 * u - 5 * v + 4 * w - z) * t2 + (-u + 3 * v - 3 * w + z) * t3);
      out.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
export type RegionState = [number, number][]; // per region [lit 0..1, dark 0..1]
export const drawBrain = (p: Pen, st: RegionState, light: number, halo = 0) => {
  const g = p.g, base = "#F4A7AE", groove = "#C2596A";
  // halo behind the whole brain when it burns
  if (halo > 0.01) {
    const gr = g.createRadialGradient(490, 330, 120, 490, 330, 520);
    gr.addColorStop(0, `rgba(255,214,110,${(0.75 * halo).toFixed(3)})`); gr.addColorStop(1, "rgba(255,214,110,0)");
    g.fillStyle = gr; g.fillRect(0, 0, BRAIN_W, BRAIN_H);
  }
  // brain stem + cerebellum behind the cerebrum
  p.band([[640, 560], [690, 735]], "#D98390", 64, 9, "round");
  p.shadedFill(CBL, "#E58E99", "#B8505F", light, 150);
  p.clip(CBL, () => { for (let i = -3; i <= 4; i++) p.stroke(smoothLine([[580, 548 + i * 22], [720, 540 + i * 22 + 8], [870, 548 + i * 22]]), 6, "#A9475A"); });
  p.inkRing(CBL, 10, thickAngle(light));
  // cerebrum: region fills -> gyri lines -> crescent shade -> ink ring
  p.clip(CER, () => {
    CELLS.forEach((c, i) => {
      const [lit, dark] = st[i];
      let col = mix(base, "#6E687F", dark * 0.85);
      col = mix(col, "#FFD45E", lit * 0.85);
      p.poly(c, col, 0);
      p.g.strokeStyle = col; p.g.lineWidth = 3; p.g.stroke(); // close the seams between cells
    });
    // glow inside lit regions
    CELLS.forEach((c, i) => {
      const lit = st[i][0];
      if (lit < 0.05) return;
      const [sx, sy] = SEEDS[i], gr = g.createRadialGradient(sx, sy, 0, sx, sy, 170);
      gr.addColorStop(0, `rgba(255,250,215,${(0.8 * lit).toFixed(3)})`); gr.addColorStop(1, "rgba(255,240,180,0)");
      p.path(c, true); g.fillStyle = gr; g.fill();
    });
    for (const l of SULCI) p.stroke(smoothLine(l), 11, groove);
    // the two big landmarks so it reads as a brain: central sulcus + lateral (Sylvian) fissure
    p.stroke(smoothLine([[520, 70], [505, 150], [540, 230], [515, 310], [540, 360]]), 14, INK);
    p.stroke(smoothLine([[270, 400], [380, 360], [480, 350], [600, 330], [690, 290]]), 15, INK);
    // painted crescent away from the light
    const dx = Math.cos(light), dy = Math.sin(light);
    const gr = g.createLinearGradient(490 + dx * 420, 330 + dy * 300, 490 - dx * 420, 330 - dy * 300);
    gr.addColorStop(0, "rgba(90,20,50,0)"); gr.addColorStop(0.55, "rgba(90,20,50,0)"); gr.addColorStop(1, "rgba(90,20,50,0.32)");
    g.fillStyle = gr; g.fillRect(0, 0, BRAIN_W, BRAIN_H);
  });
  p.inkRing(CER, 13, thickAngle(light));
};

// ---------------------------------------------------------------- burst (wide toon rays, 500 x 500)
export const drawBurst = (p: Pen, t: number) => {
  const c = 250, e = 1 - (1 - t) ** 3, r0 = 70, r1 = 70 + 175 * e;
  for (let i = 0; i < 14; i++) {
    const a = rad(i * (360 / 14) + 6 * (i % 2)), ra = r1 * (i % 2 ? 0.78 : 1), w = rad(i % 2 ? 7 : 10);
    p.poly([[c + r0 * Math.cos(a - w), c + r0 * Math.sin(a - w)], [c + ra * Math.cos(a), c + ra * Math.sin(a)], [c + r0 * Math.cos(a + w), c + r0 * Math.sin(a + w)]],
      i % 2 ? "#FFF3B0" : "#FFD23F", 7);
  }
  if (t < 0.6) p.ell(c, c, r0 * (1.2 - t), r0 * (1.2 - t), "#FFFDF0", 8);
};
