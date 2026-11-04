// "Fierce" variant of the toon animals (2026-11-04, user: "gai góc và hầm hố hơn"). Same Pen / card / scale as
// toonAnimals.ts, but: angular silhouettes (boxy skulls, hooked beaks, sawtooth fur), spikes and scutes along the backs,
// hard two-tone cel shading (a sharp shadow block instead of the soft crescent), near-black heavier ink with a stronger
// thick-thin swing, narrow slit-pupil eyes under a heavy brow ridge, rows of long uneven teeth, claws, scars, a darker
// earthier palette. Our own drawings.
import { Pen, mul, thickAngle } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, legPath, rad, rotAll, tube, walkOf } from "./toonAnimals";

const INKF = "#120A12";
const OW = 17;
type C3 = [number, number, number];
const DARK: C3 = [0.52, 0.55, 0.66];

/** flat fill + a HARD shadow block on the side away from the light (the shape minus itself shifted toward the light) */
function hard(p: Pen, pts: P2[], col: string, light: number, d = 26, ow = OW, sh: C3 = DARK) {
  const dx = Math.cos(light) * d, dy = Math.sin(light) * d;
  p.path(pts, true); p.g.fillStyle = mul(col, sh); p.g.fill();
  p.clip(pts, () => { p.path(pts.map(([x, y]) => [x + dx, y + dy] as P2), true); p.g.fillStyle = col; p.g.fill(); });
  p.inkRing(pts, ow, thickAngle(light), 0.75, INKF);
}
/** spikes on the edges of a closed outline whose outward normal points up-ish (backs, crests), every `every` points */
function spiky(pts: P2[], amp: number, every: number, minUp = 0.35, from = 0, to = 1): P2[] {
  const n = pts.length, out: P2[] = [];
  let cx = 0, cy = 0; for (const [x, y] of pts) { cx += x / n; cy += y / n; }
  for (let i = 0; i < n; i++) {
    out.push(pts[i]);
    if (i % every !== 0 || i < from * n || i > to * n) continue;
    const a = pts[i], b = pts[(i + 1) % n];
    let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if ((a[0] - cx) * nx + (a[1] - cy) * ny < 0) { nx = -nx; ny = -ny; } // make it point outward
    if (-ny < minUp) continue;
    const m: P2 = [(a[0] + b[0]) / 2 + nx * amp, (a[1] + b[1]) / 2 + ny * amp];
    out.push(m);
  }
  return out;
}
/** sawtooth all round (fur): every point alternates in/out */
const shag = (pts: P2[], amp: number) => {
  const n = pts.length; let cx = 0, cy = 0; for (const [x, y] of pts) { cx += x / n; cy += y / n; }
  return pts.map(([x, y], i) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, k = i % 2 ? amp : -amp * 0.3; return [x + (dx / l) * k, y + (dy / l) * k] as P2; });
};
/** pointed horn / claw / tooth: a tube along a path ending in a sharp tip */
function horn(path: P2[], r0: number): P2[] {
  const t = tube(path, r0, 0.5, false), n = path.length;
  const s = path[0], d = Math.atan2(path[1][1] - s[1], path[1][0] - s[0]), cap: P2[] = [];
  for (let i = 1; i < 8; i++) { const a = d - Math.PI / 2 - (Math.PI * i) / 8; cap.push([s[0] + Math.cos(a) * r0, s[1] + Math.sin(a) * r0]); }
  void n; return [...t, ...cap];
}
const tooth = (p: Pen, x: number, y: number, len: number, down: boolean, a = 0) => {
  const s = down ? 1 : -1;
  p.poly(rotAll([[x - len * 0.32, y], [x + len * 0.32, y], [x + len * 0.08, y + s * len]], a, [x, y]), "#F3EAD2", 3);
};
/** slit-pupil eye under a heavy brow ridge; `glare` narrows it */
function fierceEye(p: Pen, x: number, y: number, s: number, expr: AnimalPose["expr"], blink: number, iris = "#F2C230") {
  if (blink > 0.6 || expr === "sleepy") { p.stroke([[x - 16 * s, y + 2 * s], [x + 16 * s, y - 2 * s]], 5 * s, INKF); return; }
  const wide = expr === "shock" ? 1.6 : expr === "happy" ? 0.8 : 1;
  const h = 9 * s * wide;
  p.poly([[x - 18 * s, y + 2 * s], [x - 4 * s, y - h], [x + 18 * s, y - 3 * s], [x + 2 * s, y + h * 0.8]], iris, 3.5 * s);
  p.poly([[x, y - h * 0.85], [x + 3 * s, y], [x, y + h * 0.7], [x - 3 * s, y]], INKF, 0);
  if (expr !== "shock") p.poly([[x - 24 * s, y - 16 * s], [x + 22 * s, y - 2 * s], [x + 22 * s, y - 9 * s], [x - 20 * s, y - 24 * s]], INKF, 0); // brow ridge
}

// ------------------------------------------------------------------ T. rex
export const REXF = { skin: "#56733A", belly: "#BFAE7C", stripe: "#7E3420", scute: "#3B4E2A", mouth: "#3A0E14" };
export function drawRexF(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const claws = (f: P2, s: number) => { for (let i = 0; i < 3; i++) p.poly(horn(curve([f[0] + 10 + i * 22 * s, f[1] + 4], [f[0] + 30 + i * 22 * s, f[1] + 10], [f[0] + 44 + i * 22 * s, f[1] + 26], 4), 9), INKF, 0); };
  // far leg
  const lpF = legPath([600, 610 + bob], 300, far.swing, far.lift, -1);
  hard(p, tube(lpF, 52, 28), mul(REXF.skin, [0.75, 0.77, 0.86]), light);
  claws(lpF[lpF.length - 1], 1);
  // tail with a row of scutes
  const tail = curve([520, 540 + bob], [330, 460 + bob], [40, 450 + bob + 20 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 18);
  hard(p, spiky(tube(tail, 98, 6), 34, 2, 0.5), REXF.skin, light);
  // body: angular, spiky spine, stripes, scars
  const body = spiky(blob(690, 520 + bob, 255, 165, -0.2, 3, -0.12, 1.6, 2.0), 40, 3, 0.55, 0, 0.6);
  hard(p, body, REXF.skin, light);
  p.clip(body, () => {
    p.poly(blob(770, 650 + bob, 210, 90, -0.22, 5), REXF.belly, 0);
    for (let i = 0; i < 5; i++) p.poly([[540 + i * 62, 380 + bob], [575 + i * 62, 380 + bob], [565 + i * 62, 500 + bob], [548 + i * 62, 480 + bob]], REXF.stripe, 0);
    for (let i = 0; i < 3; i++) p.stroke([[700 + i * 18, 470 + bob], [760 + i * 18, 540 + bob]], 5, "#D9C9A0"); // scar
  });
  p.inkRing(body, OW, thickAngle(light), 0.75, INKF);
  // near leg: blocky thigh, shin, clawed foot
  const lp = legPath([680, 660 + bob], 250, near.swing, near.lift, -1);
  hard(p, tube(lp, 48, 32), REXF.skin, light);
  claws(lp[lp.length - 1], 1.1);
  hard(p, rotAll(blob(660, 610 + bob, 108, 138, 0.2, 9, -0.1, 1.5, 1.9), near.swing * 0.5, [650, 540 + bob]), REXF.skin, light);
  // neck
  hard(p, tube(curve([820, 470 + bob], [880, 410 + bob], [930, 370 + bob], 8), 112, 90), REXF.skin, light);
  // head: boxy skull, brow horn, long jaw full of uneven teeth
  const hinge: P2 = [925, 372 + bob], ha = -rad(18) * roar, ja = rad(28) * roar;
  const R = (pts: P2[]) => rotAll(pts, ha, hinge), J = (pts: P2[]) => rotAll(pts, ja, hinge);
  const jaw = J([[915, 370 + bob], [1170, 364 + bob], [1182, 384 + bob], [1120, 404 + bob], [980, 430 + bob], [935, 420 + bob]]);
  const top = R([[935, 372 + bob], [1190, 356 + bob]]), bot = J([[1170, 364 + bob], [935, 372 + bob]]);
  p.poly([...top, ...bot], REXF.mouth, 0);
  for (let i = 0; i < 6; i++) { const [tx, ty] = J([[985 + i * 30, 368 + bob]])[0]; tooth(p, tx, ty, 18 + (i % 2) * 10, false, ja); }
  hard(p, jaw, mul(REXF.skin, [0.9, 0.9, 0.92]), light, 18);
  // upper teeth after the jaw so they hang over it even with the mouth shut
  for (let i = 0; i < 7; i++) { const [tx, ty] = R([[975 + i * 31, 364 + bob - i * 1.5]])[0]; tooth(p, tx, ty, 22 + ((i * 7) % 3) * 9, true, ha); }
  const skull = R([[920, 330 + bob], [960, 268 + bob], [1010, 262 + bob], [1028, 236 + bob], [1052, 262 + bob], [1150, 272 + bob], [1196, 300 + bob],
    [1204, 334 + bob], [1192, 362 + bob], [1060, 370 + bob], [935, 376 + bob]]);
  hard(p, skull, REXF.skin, light);
  p.clip(skull, () => { const sc = R([[1080, 290 + bob], [1130, 330 + bob]]); p.stroke(sc, 5, "#D9C9A0"); }); // snout scar
  const [nx, ny] = R([[1172, 296 + bob]])[0]; p.poly([[nx - 9, ny - 3], [nx + 9, ny - 6], [nx + 5, ny + 4]], INKF, 0);
  const [ex, ey] = R([[1030, 300 + bob]])[0];
  fierceEye(p, ex, ey, 1.75, expr, o.blink ?? 0);
  // arm with two claws
  const arm = curve([860, 560 + bob], [905, 590 + bob], [925, 625 + bob - 25 * roar], 6);
  hard(p, tube(arm, 19, 13), REXF.skin, light, 10, OW * 0.75);
  const h = arm[arm.length - 1];
  for (let i = 0; i < 2; i++) p.poly(horn(curve([h[0], h[1] + i * 8], [h[0] + 14, h[1] + 10 + i * 8], [h[0] + 16, h[1] + 26 + i * 8], 4), 6), INKF, 0);
}

// ------------------------------------------------------------------ Triceratops
export const TRIF = { skin: "#6F5536", stripe: "#4A3824", frill: "#9E2F1C", spot: "#1C1012", horn: "#E9DDBE", hornTip: "#2A1E18", belly: "#A88B62" };
export function drawTrikeF(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 5 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "angry";
  const foot = (f: P2) => { for (let i = 0; i < 3; i++) p.poly(horn(curve([f[0] - 30 + i * 26, f[1] + 30], [f[0] - 20 + i * 26, f[1] + 40], [f[0] - 4 + i * 26, f[1] + 46], 3), 10), INKF, 0); };
  for (const [x, off] of [[480, 0.25], [880, 0.75]] as const) {
    const w = walkOf(o, off), lp = legPath([x, 680 + bob], 250, w.swing, w.lift, 1);
    hard(p, tube(lp, 54, 46), mul(TRIF.skin, [0.75, 0.77, 0.86]), light); foot(lp[lp.length - 1]);
  }
  hard(p, spiky(tube(curve([400, 560 + bob], [250, 560 + bob], [100, 640 + bob], 14), 86, 6), 26, 2, 0.4), TRIF.skin, light);
  const body = spiky(blob(690, 580 + bob, 305, 175, -0.05, 4, 0.02, 1.6, 2.0), 26, 4, 0.6, 0, 0.6);
  hard(p, body, TRIF.skin, light);
  p.clip(body, () => {
    p.poly(blob(720, 730 + bob, 260, 80, 0, 6), TRIF.belly, 0);
    for (let i = 0; i < 6; i++) p.poly([[460 + i * 70, 420 + bob], [500 + i * 70, 420 + bob], [490 + i * 70, 560 + bob], [470 + i * 70, 540 + bob]], TRIF.stripe, 0);
  });
  p.inkRing(body, OW, thickAngle(light), 0.75, INKF);
  for (const [x, off] of [[540, 0.75], [900, 0.25]] as const) {
    const w = walkOf(o, off), lp = legPath([x, 690 + bob], 250, w.swing, w.lift, 1);
    hard(p, tube(lp, 62, 50), TRIF.skin, light); foot(lp[lp.length - 1]);
  }
  // frill ringed with sharp spikes, black eye-spots
  const fc: P2 = [990, 430 + bob];
  for (let i = 0; i < 9; i++) {
    const a = rad(-185 + i * 26), bx = fc[0] + Math.cos(a) * 150, by = fc[1] + Math.sin(a) * 185;
    p.poly(horn([[bx, by], [bx + Math.cos(a) * 30, by + Math.sin(a) * 30], [bx + Math.cos(a) * 62, by + Math.sin(a) * 62]], 18), TRIF.hornTip, 3);
  }
  const frill = blob(fc[0], fc[1], 152, 192, 0.35, 8, 0.05, 1.8, 2.0);
  hard(p, frill, TRIF.frill, light);
  p.clip(frill, () => { for (const [dx, dy] of [[-70, -100], [-100, 0], [-40, 80]]) { p.ell(fc[0] + dx, fc[1] + dy, 30, 22, TRIF.spot, 0); p.ell(fc[0] + dx + 6, fc[1] + dy - 3, 10, 8, "#E9C46A", 0); } });
  // head: angular, hooked beak
  const head = [[990, 520], [1080, 470], [1190, 485], [1240, 520], [1225, 610], [1150, 640], [1040, 630], [985, 590]].map(([x, y]) => [x, y + bob] as P2);
  hard(p, head, TRIF.skin, light);
  hard(p, [[1220, 500 + bob], [1320, 560 + bob], [1300, 600 + bob], [1250, 650 + bob], [1218, 618 + bob]], mul(TRIF.skin, [0.62, 0.62, 0.66]), light, 12);
  // horns: long, curved, dark tips
  for (const [pts, r] of [[curve([1050, 480 + bob], [1150, 360 + bob], [1330, 300 + bob], 12), 26], [curve([1205, 500 + bob], [1235, 455 + bob], [1250, 420 + bob], 6), 18]] as [P2[], number][]) {
    const hp = horn(pts, r);
    hard(p, hp, TRIF.horn, light, 8, OW * 0.8);
    p.clip(hp, () => { const tp = pts[pts.length - 1]; p.ell(tp[0], tp[1], r * 2.4, r * 2.4, TRIF.hornTip, 0); });
    p.inkRing(hp, OW * 0.8, thickAngle(light), 0.75, INKF);
  }
  p.stroke([[1150, 610 + bob], [1220, 600 + bob]], 6, INKF);
  fierceEye(p, 1110, 535 + bob, 1.7, expr, o.blink ?? 0, "#E8A23A");
}

// ------------------------------------------------------------------ woolly mammoth
export const MAMF = { fur: "#4E2F1D", furDark: "#2F1A10", furLit: "#6B4128", tusk: "#EFE3C4", foot: "#1E1410" };
export function drawMammothF(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "angry";
  for (const [x, off] of [[560, 0.25], [880, 0.75]] as const) {
    const w = walkOf(o, off), lp = legPath([x, 640 + bob], 290, w.swing, w.lift, 1);
    hard(p, shag(tube(lp, 68, 60), 6), MAMF.furDark, light);
  }
  const body = shag(blob(700, 510 + bob, 330, 245, -0.12, 5, -0.05, 1.7, 2.2), 15);
  hard(p, body, MAMF.fur, light, 34);
  p.clip(body, () => { for (let i = 0; i < 20; i++) p.poly([[420 + i * 32, 330 + bob + (i % 3) * 40], [436 + i * 32, 330 + bob + (i % 3) * 40], [424 + i * 32, 420 + bob + (i % 3) * 40]], MAMF.furDark, 0); });
  p.inkRing(body, OW, thickAngle(light), 0.75, INKF);
  for (const [x, off] of [[600, 0.75], [920, 0.25]] as const) {
    const w = walkOf(o, off), lp = legPath([x, 660 + bob], 280, w.swing, w.lift, 1);
    hard(p, shag(tube(lp, 70, 62), 6), MAMF.fur, light);
    const f = lp[lp.length - 1];
    p.ell(f[0], f[1] + 44, 64, 18, MAMF.foot, 5);
  }
  // head with a spiky hair crest, small glaring eye
  const head = spiky(shag(blob(1020, 395 + bob, 165, 190, 0.1, 13, -0.1, 1.6, 2.2), 8), 30, 4, 0.6);
  hard(p, head, MAMF.fur, light, 28);
  const sw = 0.05 * Math.sin(2 * Math.PI * (o.phase ?? 0));
  const trunk = shag(tube(curve([1110, 470 + bob], [1225 + 40 * sw, 690 + bob], [1150, 885 + bob], 20), 64, 24), 4);
  hard(p, trunk, MAMF.fur, light, 20);
  // tusks: long, sweeping, sharp
  const tk = curve([1075, 560 + bob], [1380, 680 + bob], [1345, 330 + bob], 22);
  hard(p, horn(tk, 30), MAMF.tusk, light, 10, OW * 0.85);
  fierceEye(p, 1080, 410 + bob, 1.7, expr, o.blink ?? 0, "#F07A2B");
}

export const FIERCE = {
  rex: { draw: drawRexF, len: 12.3, x0: 30, x1: 1330 },
  trike: { draw: drawTrikeF, len: 8.5, x0: 90, x1: 1330 },
  mammoth: { draw: drawMammothF, len: 5.6, x0: 330, x1: 1390 },
} as const;
void GROUND;
