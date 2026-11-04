// Fossil Mysteries test (2026-11-04): prehistoric animals in the cartoon-3d-short look, drawn with the same Pen as the
// skill's toon.ts (github.com/mromidev/claude-animated-shorts, MIT): flat fills + a painted crescent on the side away
// from the light (shadedFill / gradFill), a plum thick-thin ink ring (inkRing) weighted away from the light, dot eyes
// with lids, no blush, no catchlights. Side views facing screen right; the card in 3D mirrors them to turn round.
// Design space 1600 x 1000 units, ground at y = 960. Our own drawings (no reference animal is copied).
import { INK, Pen, blobPts, mul, shade, thickAngle } from "./toon";

export type P2 = [number, number];
type C3 = [number, number, number];
const SH: C3 = [0.66, 0.68, 0.78]; // lit -> far side ratio (cloth value of toon.ts, cool shadow)
const SH_FAR: C3 = [0.78, 0.8, 0.88]; // far legs read a step darker
export const GROUND = 960;
export type AnimalExpr = "neutral" | "angry" | "shock" | "happy" | "sleepy";
export type AnimalPose = { phase?: number; walk?: number; roar?: number; expr?: AnimalExpr; blink?: number; light?: number; look?: number };

export const rad = (d: number) => (d * Math.PI) / 180;
const rot = (q: P2, a: number, c: P2): P2 => {
  const s = Math.sin(a), k = Math.cos(a), x = q[0] - c[0], y = q[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
};
export const rotAll = (pts: P2[], a: number, c: P2) => (a ? pts.map((q) => rot(q, a, c)) : pts);
const bbR = (pts: P2[]) => {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return Math.max(x1 - x0, y1 - y0) / 2;
};
/** a filled body part: flat colour, painted crescent away from the light, plum thick-thin ring */
function part(p: Pen, pts: P2[], col: string, light: number, ow: number, sh: C3 = SH, grad = false) {
  if (grad) p.gradFill(pts, col, mul(col, sh), light, 0.3);
  else p.shadedFill(pts, col, mul(col, sh), light, bbR(pts), 0.4);
  p.inkRing(pts, ow, thickAngle(light), 0.5);
}
export const blob = (cx: number, cy: number, a: number, b: number, r = 0, seed = 1, egg = 0, nTop = 2.1, nBot = 2.3): P2[] =>
  blobPts(cx, cy, { a, b, nTop, nBot, egg, asym: 0, rot: r, noise: 0.006, seed });
/** tapered sausage through a polyline (tails, necks, legs, trunks): radius r0 at the first point to r1 at the last */
export function tube(path: P2[], r0: number, r1: number, cap = true): P2[] {
  const n = path.length, L: P2[] = [], R: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const r = r0 + (r1 - r0) * (i / (n - 1));
    L.push([path[i][0] - dy * r, path[i][1] + dx * r]); R.push([path[i][0] + dy * r, path[i][1] - dx * r]);
  }
  // round caps: the L offset sits at angle thL = atan2(dx, -dy); sweep thL -> thL - PI through the forward direction
  // at the end, and on through the backward direction at the start, so the outline never crosses itself
  const end: P2[] = [], start: P2[] = [];
  if (cap) {
    const dirAt = (i: number, j: number) => Math.atan2(path[j][1] - path[i][1], path[j][0] - path[i][0]);
    const fe = dirAt(n - 2, n - 1), fs = dirAt(0, 1);
    const [ex, ey] = path[n - 1], [sx, sy] = path[0];
    for (let i = 1; i < 8; i++) { const a = fe + Math.PI / 2 - (Math.PI * i) / 8; end.push([ex + Math.cos(a) * r1, ey + Math.sin(a) * r1]); }
    for (let i = 1; i < 8; i++) { const a = fs - Math.PI / 2 - (Math.PI * i) / 8; start.push([sx + Math.cos(a) * r0, sy + Math.sin(a) * r0]); }
  }
  return [...L, ...end, ...R.reverse(), ...start];
}
export const curve = (a: P2, k: P2, b: P2, n = 12): P2[] => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * a[0] + 2 * u * t * k[0] + t * t * b[0], u * u * a[1] + 2 * u * t * k[1] + t * t * b[1]] as P2;
});
/** two-bone leg from hip to the ground, knee bending `kneeDir` (+1 forward), foot lifted on the swing half */
export function legPath(hip: P2, len: number, swing: number, lift: number, kneeDir: number): P2[] {
  const foot: P2 = [hip[0] + Math.sin(swing) * len * 0.9, Math.min(GROUND - 12, hip[1] + len) - lift];
  const mid: P2 = [(hip[0] + foot[0]) / 2 + kneeDir * len * 0.12, (hip[1] + foot[1]) / 2];
  return curve(hip, mid, foot, 10);
}
export const walkOf = (o: AnimalPose, off: number) => {
  const ph = 2 * Math.PI * ((o.phase ?? 0) + off), w = o.walk ?? 0;
  return { swing: Math.sin(ph) * rad(20) * w, lift: Math.max(0, Math.cos(ph)) * 34 * w };
};

/** eye in the toon.ts manner: ink dot, a lid line when sleepy/blinking, a tapered brow for anger */
function eye(p: Pen, x: number, y: number, s: number, expr: AnimalExpr, blink: number, look = 0, skin = "#888888") {
  const lid = blink > 0.6 ? 1 : expr === "sleepy" ? 0.55 : blink > 0 ? 0.5 : 0;
  if (expr === "shock") {
    p.ell(x, y, 15 * s, 15 * s, "#ffffff", 3.5 * s);
    p.dot(x + 3 * s + look * 4 * s, y, 5 * s);
    return;
  }
  if (expr === "happy") { p.arc(x, y + 4 * s, 9 * s, 7 * s, 200, 340, 4 * s); return; }
  if (lid >= 1) { p.stroke([[x - 9 * s, y], [x + 9 * s, y + 1 * s]], 4 * s); return; }
  p.dot(x + look * 3 * s, y, 7.5 * s);
  if (lid > 0) p.poly([[x - 11 * s, y - 11 * s], [x + 11 * s, y - 11 * s], [x + 11 * s, y - 11 * s + 13 * s * lid], [x - 11 * s, y - 11 * s + 13 * s * lid]], skin, 0);
  if (expr === "angry") p.stroke([[x - 16 * s, y - 20 * s], [x + 12 * s, y - 9 * s]], 6 * s);
  else p.stroke([[x - 12 * s, y - 20 * s], [x + 10 * s, y - 22 * s]], 4.5 * s);
}

// ------------------------------------------------------------------ T. rex
export const REX = { skin: "#6E9B4B", belly: "#D9CF96", stripe: "#557D38", mouth: "#5a1e28" };
export function drawRex(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ow = 13, bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const roar = o.roar ?? 0, expr = o.expr ?? "neutral";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  // far leg (darker), behind everything
  const hipF: P2 = [600, 610 + bob];
  part(p, tube(legPath(hipF, 300, far.swing, far.lift, -1), 52, 30), mul(REX.skin, SH_FAR), light, ow);
  // tail
  const tail = curve([520, 540 + bob], [330, 470 + bob], [60, 470 + bob + 20 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 16);
  part(p, tube(tail, 95, 10), REX.skin, light, ow, SH, true);
  // body
  const body = blob(690, 520 + bob, 250, 165, -0.18, 3, -0.08);
  part(p, body, REX.skin, light, ow, SH, true);
  p.clip(body, () => {
    p.poly(blob(760, 640 + bob, 210, 95, -0.2, 5), REX.belly, 0);
    for (let i = 0; i < 4; i++) p.stroke([[560 + i * 70, 395 + bob + i * 6], [590 + i * 70, 470 + bob + i * 4]], 16, REX.stripe);
  });
  p.inkRing(body, ow, thickAngle(light), 0.5);
  // near leg: big thigh + shin + foot
  const hip: P2 = [650, 600 + bob];
  const lp = legPath([hip[0] + 30, hip[1] + 60], 250, near.swing, near.lift, -1);
  part(p, tube(lp, 46, 34), REX.skin, light, ow);
  const ft = lp[lp.length - 1];
  part(p, blob(ft[0] + 34, ft[1] + 6, 62, 22, 0, 7), shade(REX.skin, 0.9), light, ow * 0.8);
  part(p, rotAll(blob(hip[0] + 10, hip[1] + 10, 105, 135, 0.15, 9), near.swing * 0.5, [hip[0], hip[1] - 60]), REX.skin, light, ow);
  // neck + head (head tips up with the roar)
  const neck = tube(curve([820, 470 + bob], [880, 410 + bob], [930, 370 + bob], 8), 110, 88);
  part(p, neck, REX.skin, light, ow);
  const hc: P2 = [1010, 322 + bob], ha = -rad(16) * roar, hinge: P2 = [925, 372 + bob];
  const R = (pts: P2[]) => rotAll(pts, ha, hinge); // the skull tips up with the roar
  const J = (pts: P2[]) => rotAll(pts, rad(22) * roar, hinge); // the jaw drops
  const jaw = J([[915, 372 + bob], [1150, 368 + bob], [1165, 388 + bob], [1100, 410 + bob], [960, 426 + bob]]);
  if (roar > 0.05) { // open mouth: dark inside, tongue, teeth on both jaws
    const top = R([[935, 372 + bob], [1170, 360 + bob]]), bot = J([[1150, 368 + bob], [935, 372 + bob]]);
    p.poly([...top, ...bot], REX.mouth, 0);
    const tg = J([[1000, 378 + bob], [1090, 374 + bob]]);
    p.ell((tg[0][0] + tg[1][0]) / 2, (tg[0][1] + tg[1][1]) / 2 - 2, 52, 14, "#E86E78", 0);
    for (let i = 0; i < 5; i++) { const [tx, ty] = R([[990 + i * 36, 366 + bob - i * 1.5]])[0]; p.poly(rotAll([[tx - 9, ty - 2], [tx + 9, ty - 2], [tx, ty + 18]], ha, [tx, ty]), "#fff8ea", 2.5); }
    for (let i = 0; i < 4; i++) { const [tx, ty] = J([[1010 + i * 36, 370 + bob]])[0]; p.poly(rotAll([[tx - 8, ty + 2], [tx + 8, ty + 2], [tx, ty - 15]], rad(22) * roar, [tx, ty]), "#fff8ea", 2.5); }
  }
  part(p, jaw, shade(REX.skin, 0.94), light, ow * 0.85);
  const head = R(blob(hc[0], hc[1], 178, 62, 0.04, 11, 0.12, 2.4, 2.6));
  part(p, head, REX.skin, light, ow);
  if (roar <= 0.05) { // closed mouth: a long grin line with little teeth
    p.stroke(curve([935, 374 + bob], [1060, 386 + bob], [1170, 364 + bob], 10), 6);
    for (let i = 0; i < 4; i++) p.poly([[1010 + i * 40 - 7, 380 + bob - i * 3], [1010 + i * 40 + 7, 380 + bob - i * 3], [1010 + i * 40, 393 + bob - i * 3]], "#fff8ea", 2.5);
  }
  const [nx, ny] = R([[1160, 300 + bob]])[0]; p.dot(nx, ny, 6);
  const [ex, ey] = R([[1035, 292 + bob]])[0];
  eye(p, ex, ey, 1.4, roar > 0.5 && expr === "neutral" ? "angry" : expr, o.blink ?? 0, o.look, REX.skin);
  // tiny arm on top
  const arm = tube(curve([860, 560 + bob], [905, 590 + bob], [925, 625 + bob - 20 * roar], 6), 18, 13);
  part(p, arm, REX.skin, light, ow * 0.7);
  const [ax, ay] = arm[6] ?? [925, 625]; void ax; void ay;
}

// ------------------------------------------------------------------ Triceratops
export const TRI = { skin: "#B98A57", frill: "#D9673A", spots: "#8E3F26", horn: "#F2E6C8", belly: "#E2C79A" };
export function drawTrike(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ow = 13, bob = 5 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "neutral";
  // far legs
  for (const [x, off] of [[480, 0.25], [880, 0.75]] as const) {
    const w = walkOf(o, off);
    part(p, tube(legPath([x, 680 + bob], 250, w.swing, w.lift, 1), 52, 44), mul(TRI.skin, SH_FAR), light, ow);
  }
  // tail
  part(p, tube(curve([400, 560 + bob], [250, 560 + bob], [110, 630 + bob], 12), 85, 12), TRI.skin, light, ow, SH, true);
  // body
  const body = blob(690, 580 + bob, 300, 175, -0.05, 4, 0.04);
  part(p, body, TRI.skin, light, ow, SH, true);
  p.clip(body, () => p.poly(blob(720, 720 + bob, 260, 80, 0, 6), TRI.belly, 0));
  p.inkRing(body, ow, thickAngle(light), 0.5);
  // near legs
  for (const [x, off] of [[540, 0.75], [900, 0.25]] as const) {
    const w = walkOf(o, off);
    const lp = legPath([x, 690 + bob], 250, w.swing, w.lift, 1);
    part(p, tube(lp, 60, 50), TRI.skin, light, ow);
    const f = lp[lp.length - 1];
    for (let i = 0; i < 3; i++) p.ell(f[0] - 28 + i * 26, f[1] + 34, 11, 8, TRI.horn, 3);
  }
  // frill (behind the head), spotted
  const frill = blob(990, 430 + bob, 150, 190, 0.35, 8, 0.05, 2.2, 2.2);
  part(p, frill, TRI.frill, light, ow);
  p.clip(frill, () => { for (const [dx, dy] of [[-60, -110], [-90, -20], [-40, 60], [20, -150], [-110, 90]]) p.ell(990 + dx, 430 + bob + dy, 22, 17, TRI.spots, 0); });
  for (let i = 0; i < 7; i++) { const a = rad(-170 + i * 30); p.ell(990 + Math.cos(a) * 150 * 1.02, 430 + bob + Math.sin(a) * 190 * 1.0, 13, 13, TRI.horn, 3); }
  // head + beak
  const head = blob(1095, 560 + bob, 150, 92, 0.12, 12, -0.15);
  part(p, head, TRI.skin, light, ow);
  part(p, [[1215, 520 + bob], [1300, 575 + bob], [1225, 640 + bob], [1195, 600 + bob]], shade(TRI.skin, 0.8), light, ow * 0.8);
  // horns: two brow horns + a nose horn
  part(p, tube(curve([1060, 470 + bob], [1150, 380 + bob], [1290, 330 + bob], 10), 24, 4), TRI.horn, light, ow * 0.8);
  part(p, tube(curve([1200, 515 + bob], [1225, 480 + bob], [1240, 455 + bob], 6), 17, 4), TRI.horn, light, ow * 0.7);
  p.stroke(curve([1150, 600 + bob], [1190, 612 + bob], [1225, 600 + bob], 6), 5);
  eye(p, 1105, 520 + bob, 1.3, expr, o.blink ?? 0, o.look, TRI.skin);
}

// ------------------------------------------------------------------ woolly mammoth
export const MAM = { fur: "#7B4B2C", furDark: "#5A341E", tusk: "#F4EBD2", foot: "#3E2A20" };
export function drawMammoth(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ow = 13, bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "neutral";
  const fringe = (pts: P2[], col: string) => { // shaggy hair hanging under a shape
    let x0 = 1e9, x1 = -1e9, yb = -1e9;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); yb = Math.max(yb, y); }
    for (let x = x0 + 30; x < x1 - 30; x += 34) p.stroke([[x, yb - 50], [x - 8, yb + 26]], 16, col);
  };
  for (const [x, off] of [[560, 0.25], [880, 0.75]] as const) {
    const w = walkOf(o, off);
    const lp = legPath([x, 640 + bob], 290, w.swing, w.lift, 1);
    part(p, tube(lp, 64, 58), mul(MAM.fur, SH_FAR), light, ow);
  }
  part(p, tube(curve([420, 470 + bob], [370, 520 + bob], [360, 610 + bob], 6), 22, 14), MAM.furDark, light, ow * 0.7); // tail
  const body = blob(700, 510 + bob, 320, 240, -0.12, 5, -0.05, 1.9, 2.4);
  fringe(body, MAM.furDark);
  part(p, body, MAM.fur, light, ow, SH, true);
  p.clip(body, () => { for (let i = 0; i < 14; i++) p.stroke([[440 + i * 42, 380 + bob + (i % 3) * 30], [425 + i * 42, 440 + bob + (i % 3) * 30]], 6, MAM.furDark); });
  p.inkRing(body, ow, thickAngle(light), 0.5);
  for (const [x, off] of [[600, 0.75], [920, 0.25]] as const) {
    const w = walkOf(o, off);
    const lp = legPath([x, 660 + bob], 280, w.swing, w.lift, 1);
    part(p, tube(lp, 66, 60), MAM.fur, light, ow);
    const f = lp[lp.length - 1];
    p.ell(f[0], f[1] + 40, 62, 18, MAM.foot, 4);
  }
  // head dome + ear + trunk + tusks
  const head = blob(1020, 400 + bob, 160, 185, 0.1, 13, -0.1, 1.8, 2.3);
  part(p, head, MAM.fur, light, ow);
  part(p, blob(960, 450 + bob, 46, 62, 0.2, 14), MAM.furDark, light, ow * 0.8);
  const sw = 0.05 * Math.sin(2 * Math.PI * (o.phase ?? 0));
  const trunk = tube(curve([1110, 470 + bob], [1215 + 40 * sw, 690 + bob], [1150, 880 + bob], 16), 62, 24);
  part(p, trunk, MAM.fur, light, ow);
  for (let i = 0; i < 6; i++) { const t = 0.25 + i * 0.12, y = 470 + bob + (880 - 470) * t; p.stroke([[1150 + 40 * Math.sin(t * 3), y], [1190 + 40 * Math.sin(t * 3), y + 8]], 4, MAM.furDark); }
  part(p, tube(curve([1080, 560 + bob], [1330, 640 + bob], [1290, 400 + bob], 18), 28, 9), MAM.tusk, light, ow * 0.8);
  eye(p, 1080, 410 + bob, 1.3, expr, o.blink ?? 0, o.look, MAM.fur);
}

export const ANIMALS = {
  // len = real length in m, x0..x1 = the drawing's extent in design units -> metres per unit = len / (x1 - x0)
  rex: { draw: drawRex, len: 12.3, x0: 45, x1: 1310 },
  trike: { draw: drawTrike, len: 8.5, x0: 100, x1: 1300 },
  mammoth: { draw: drawMammoth, len: 5.6, x0: 340, x1: 1345 },
} as const;
export type AnimalName = keyof typeof ANIMALS;
void INK;
