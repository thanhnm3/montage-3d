// "Beast" variant (r3, 2026-11-04, user: "giống thật một tí và hầm hố hơn, thêm gai góc và đáng sợ hơn").
// Keeps the toon expressions (eyes / brows / mouths swap with expr) but moves the anatomy toward the real animals:
// T. rex horizontal posture, deep boxy skull with brow boss, digitigrade 3-segment legs with 3 clawed toes;
// Triceratops heavy barrel body, long brow horns, spiked frill, hoof claws; mammoth shoulder hump, sloping back,
// long hanging hair strands. Surfaces: 3-tone cel shading (shadow / mid / lit) + a thin rim light, pebbly scales,
// skin folds, bony scutes along the back, scars, cracked horns; eyes deep in dark sockets with a hot slit iris;
// uneven teeth, drool on the roar. Same Pen (toon.ts, MIT), same card / scale API as toonAnimals.ts. Our own drawings.
import { Pen, mul, thickAngle } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";

const INKB = "#0E080C";
const OW = 15;
type C3 = [number, number, number];
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/** 3-tone cel: deep shadow everywhere, mid tone where the shape shifted toward the light still covers it, lit tone on a
 *  second shift, a thin rim light on the lit edge; `tex` paints texture inside the shape; then the ink ring. */
function cel(p: Pen, pts: P2[], col: string, light: number, o: { d?: number; ow?: number; tex?: () => void; rim?: boolean; shadow?: C3 } = {}) {
  const d = o.d ?? 26, ow = o.ow ?? OW, dx = Math.cos(light), dy = Math.sin(light);
  const sh = (k: number) => pts.map(([x, y]) => [x + dx * d * k, y + dy * d * k] as P2);
  p.path(pts, true); p.g.fillStyle = mul(col, o.shadow ?? [0.42, 0.44, 0.56]); p.g.fill();
  p.clip(pts, () => {
    p.path(sh(1), true); p.g.fillStyle = mul(col, [0.7, 0.71, 0.78]); p.g.fill();
    p.path(sh(2.1), true); p.g.fillStyle = col; p.g.fill();
    if (o.tex) o.tex();
    if (o.rim !== false) { p.path(pts.map(([x, y]) => [x - dx * 5, y - dy * 5] as P2), true); p.g.strokeStyle = mul(col, [1.35, 1.32, 1.18]); p.g.lineWidth = 7; p.g.stroke(); }
  });
  p.inkRing(pts, ow, thickAngle(light), 0.8, INKB);
}
/** pebbly scales: jittered small blobs, darker, inside the current clip */
function scales(p: Pen, x0: number, y0: number, x1: number, y1: number, size: number, col: string, seed: number, alpha = 0.45) {
  const r = rng(seed); p.g.globalAlpha = alpha;
  for (let y = y0; y < y1; y += size * 1.1) for (let x = x0 + ((y / size) % 2) * size * 0.5; x < x1; x += size * 1.2)
    p.ell(x + (r() - 0.5) * size * 0.4, y + (r() - 0.5) * size * 0.4, size * (0.32 + r() * 0.18), size * (0.26 + r() * 0.14), col, 0);
  p.g.globalAlpha = 1;
}
/** skin folds: short dark arcs */
const folds = (p: Pen, pts: [P2, P2, P2][], w = 5, col = INKB) => { p.g.globalAlpha = 0.55; for (const [a, k, b] of pts) p.stroke(curve(a, k, b, 8), w, col); p.g.globalAlpha = 1; };
/** pointed horn / claw / tooth outline: a tube ending in a sharp tip, round base */
function horn(path: P2[], r0: number): P2[] {
  const t = tube(path, r0, 0.5, false), s = path[0], d = Math.atan2(path[1][1] - s[1], path[1][0] - s[0]), cap: P2[] = [];
  for (let i = 1; i < 8; i++) { const a = d - Math.PI / 2 - (Math.PI * i) / 8; cap.push([s[0] + Math.cos(a) * r0, s[1] + Math.sin(a) * r0]); }
  return [...t, ...cap];
}
const claw = (p: Pen, a: P2, len: number, ang: number, w = 10) => {
  const pts = curve(a, [a[0] + Math.cos(ang) * len * 0.6, a[1] + Math.sin(ang) * len * 0.6 - len * 0.1], [a[0] + Math.cos(ang + 0.5) * len, a[1] + Math.sin(ang + 0.5) * len], 6);
  p.poly(horn(pts, w), "#1A1210", 3);
};
const tooth = (p: Pen, x: number, y: number, len: number, down: boolean, a = 0, w = 0.3) => {
  const s = down ? 1 : -1;
  p.poly(rotAll([[x - len * w, y], [x + len * w, y], [x + len * 0.12, y + s * len * 0.75], [x + len * 0.05, y + s * len]], a, [x, y]), "#EDE2C4", 3);
};
/** bony scutes along a back line: irregular sharp plates, bigger in the middle */
function scutes(p: Pen, line: P2[], h: number, col: string, light: number, seed: number) {
  const r = rng(seed), n = line.length;
  for (let i = 1; i < n - 1; i++) {
    const [x, y] = line[i], a = Math.atan2(line[i + 1][1] - line[i - 1][1], line[i + 1][0] - line[i - 1][0]) - Math.PI / 2;
    const k = Math.sin((Math.PI * i) / (n - 1)) * (0.6 + r() * 0.6) * h, w = h * 0.35;
    const tip: P2 = [x + Math.cos(a) * k + 6, y + Math.sin(a) * k];
    cel(p, [[x - w, y + 4], tip, [x + w, y + 4]], col, light, { d: 6, ow: 7, rim: false });
  }
}
/** deep socket + hot slit iris; expr swaps the shapes (the toon part the user liked) */
function beastEye(p: Pen, x: number, y: number, s: number, expr: AnimalPose["expr"], blink: number, skin: string, iris = "#FF6A1F") {
  p.ell(x, y, 30 * s, 20 * s, mul(skin, [0.25, 0.22, 0.28]), 0, 0, 360, -8); // socket shadow
  if (blink > 0.6 || expr === "sleepy") { p.stroke([[x - 18 * s, y + 2 * s], [x + 18 * s, y - 3 * s]], 5 * s, INKB); return; }
  const wide = expr === "shock" ? 1.7 : expr === "happy" ? 0.75 : 1, h = 10 * s * wide;
  p.poly([[x - 19 * s, y + 3 * s], [x - 5 * s, y - h], [x + 19 * s, y - 4 * s], [x + 3 * s, y + h * 0.85]], iris, 3.5 * s);
  p.g.globalAlpha = 0.6; p.ell(x, y, 8 * s, 5 * s, "#FFE08A", 0); p.g.globalAlpha = 1; // inner glow
  p.poly([[x + 1 * s, y - h * 0.9], [x + 3.5 * s, y], [x + 1 * s, y + h * 0.75], [x - 1.5 * s, y]], INKB, 0);
  if (expr !== "shock") p.poly([[x - 30 * s, y - 14 * s], [x + 26 * s, y - 3 * s], [x + 26 * s, y - 11 * s], [x - 26 * s, y - 26 * s]], INKB, 0); // brow ridge
  else p.stroke([[x - 22 * s, y - 26 * s], [x + 20 * s, y - 30 * s]], 6 * s, INKB);
}
/** digitigrade leg: hip -> knee (forward) -> ankle (back) -> toes, swung about the hip, foot lifted on the swing half */
function digiLeg(hip: P2, scale: number, swing: number, lift: number) {
  // T. rex proportions: thigh ~ shin ~ metatarsus; the toes are always planted on the ground line (minus the lift)
  const K: P2 = [hip[0] + 75 * scale, hip[1] + 150 * scale], A: P2 = [hip[0] - 35 * scale, hip[1] + 285 * scale];
  let pts = [hip, K, A].map((q) => rot(q, swing, hip));
  const foot: P2 = [pts[2][0] + 70 * scale, GROUND - 10 - lift];
  pts = [...pts, foot];
  return pts;
}
const chaikin = (pts: P2[], n = 3): P2[] => {
  for (let k = 0; k < n; k++) pts = pts.flatMap((a, i) => { const b = pts[(i + 1) % pts.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]] as P2[]; });
  return pts;
};
const rot = (q: P2, a: number, c: P2): P2 => { const s = Math.sin(a), k = Math.cos(a), x = q[0] - c[0], y = q[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };

// ------------------------------------------------------------------ T. rex
export const REXB = { skin: "#55693A", back: "#2E3C22", belly: "#AE9E72", stripe: "#2A3320", scute: "#3A4428", mouth: "#30080E", gum: "#7A2430", scar: "#C9B48A" };
export function drawRexB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 7 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string, s: number) => {
    const L = digiLeg(hip, s, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 10, (L[1][1] + L[2][1]) / 2], L[2], 8), 70 * s, 46 * s), col, light, { d: 14 });
    cel(p, tube([L[2], L[3]], 46 * s, 34 * s), col, light, { d: 10 });
    for (let i = 0; i < 3; i++) claw(p, [L[3][0] + 10 + i * 24 * s, L[3][1] + 8], 52 * s, 0.2 + i * 0.12, 12 * s);
    cel(p, rotAll(blob(hip[0] + 30, hip[1] + 40, 118 * s, 138 * s, 0.45, 9, -0.3, 1.7, 2.0), w.swing * 0.6, hip), col, light, {
      tex: () => { folds(p, [[[hip[0] - 40, hip[1] + 120], [hip[0] + 10, hip[1] + 150], [hip[0] + 70, hip[1] + 140]]]); scales(p, hip[0] - 100, hip[1] - 50, hip[0] + 140, hip[1] + 230, 26, REXB.back, 3, 0.3); } });
    return L;
  };
  // far leg, darker
  leg([590, 500 + bob], far, mul(REXB.skin, [0.72, 0.74, 0.84]), 0.95);
  // tail: thick, long, slightly raised S
  const tailLine = curve([500, 470 + bob], [300, 400 + bob], [30, 420 + bob + 24 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 18);
  const tail = tube(tailLine, 118, 8);
  cel(p, tail, REXB.skin, light, { tex: () => { scales(p, 20, 300, 560, 600, 24, REXB.back, 5); for (let i = 0; i < 6; i++) { const q = tailLine[2 + i * 2]; p.poly([[q[0] - 14, q[1] - 70], [q[0] + 14, q[1] - 70], [q[0] + 4, q[1] + 30], [q[0] - 8, q[1] + 20]], REXB.stripe, 0); } } });
  scutes(p, tailLine.slice(0, 14).map(([x, y], i) => [x, y - (118 - i * 7)] as P2), 34, REXB.scute, light, 7);
  // torso: deep chest, belly hanging, horizontal
  const body = blob(700, 480 + bob, 255, 170, -0.16, 3, -0.14, 1.7, 2.1);
  cel(p, body, REXB.skin, light, { tex: () => {
    p.poly(blob(790, 610 + bob, 220, 90, -0.25, 5), REXB.belly, 0);
    for (let i = 0; i < 7; i++) p.poly([[520 + i * 52, 330 + bob + i * 4], [552 + i * 52, 330 + bob + i * 4], [545 + i * 52, 450 + bob], [528 + i * 52, 440 + bob]], REXB.stripe, 0);
    scales(p, 450, 320, 960, 660, 22, REXB.back, 9);
    for (let i = 0; i < 3; i++) p.stroke([[690 + i * 20, 430 + bob], [770 + i * 20, 520 + bob]], 6, REXB.scar);
    folds(p, [[[880, 520 + bob], [900, 580 + bob], [880, 640 + bob]], [[910, 500 + bob], [935, 560 + bob], [915, 620 + bob]]]);
  } });
  scutes(p, curve([470, 345 + bob], [650, 290 + bob], [860, 320 + bob], 12), 40, REXB.scute, light, 11);
  // near leg
  leg([645, 510 + bob], near, REXB.skin, 1.05);
  // neck: thick S with folds
  const neckL = curve([830, 440 + bob], [900, 370 + bob], [960, 350 + bob], 10);
  cel(p, tube(neckL, 120, 98), REXB.skin, light, { tex: () => { scales(p, 760, 230, 1060, 560, 20, REXB.back, 13); folds(p, [[[880, 450 + bob], [905, 470 + bob], [935, 450 + bob]], [[900, 480 + bob], [930, 500 + bob], [960, 478 + bob]]]); } });
  scutes(p, neckL.map(([x, y]) => [x - 20, y - 110] as P2), 26, REXB.scute, light, 17);
  // head: deep boxy skull with brow boss, long deep jaw, rows of uneven teeth, drool when roaring
  const hinge: P2 = [960, 380 + bob], ha = -rad(16) * roar, ja = rad(30) * roar;
  const R = (pts: P2[]) => rotAll(pts, ha, hinge), J = (pts: P2[]) => rotAll(pts, ja, hinge);
  const jaw = J([[945, 372 + bob], [1290, 366 + bob], [1300, 384 + bob], [1240, 410 + bob], [1080, 440 + bob], [990, 452 + bob], [950, 430 + bob]]);
  const top = R([[965, 372 + bob], [1300, 352 + bob]]), bot = J([[1290, 366 + bob], [965, 372 + bob]]);
  p.poly([...top, ...bot], REXB.mouth, 0);
  if (roar > 0.05) {
    const g = J([[1020, 380 + bob], [1200, 372 + bob]]); p.ell((g[0][0] + g[1][0]) / 2, (g[0][1] + g[1][1]) / 2 - 4, 90, 16, "#B0404E", 0);
    p.g.globalAlpha = 0.75; // drool strings between the jaws
    for (const x of [1060, 1150, 1230]) { const a = R([[x, 362 + bob]])[0], b = J([[x - 10, 372 + bob]])[0]; p.stroke(curve(a, [(a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 + 18], b, 8), 4, "#E8F0F2"); }
    p.g.globalAlpha = 1;
  }
  for (let i = 0; i < 9; i++) { const [tx, ty] = J([[1000 + i * 32, 372 + bob - i * 0.6]])[0]; tooth(p, tx, ty, 20 + ((i * 5) % 3) * 9, false, ja); }
  cel(p, jaw, mul(REXB.skin, [0.92, 0.92, 0.94]), light, { d: 16, tex: () => { scales(p, 940, 360, 1310, 460, 16, REXB.back, 21); p.stroke([[1000, 425 + bob], [1250, 395 + bob]], 5, mul(REXB.skin, [0.5, 0.5, 0.55])); } });
  for (let i = 0; i < 10; i++) { const [tx, ty] = R([[985 + i * 31, 364 + bob - i * 1.2]])[0]; tooth(p, tx, ty, 24 + ((i * 7) % 4) * 8, true, ha, 0.26); }
  const skull = R([[945, 300 + bob], [975, 240 + bob], [1040, 222 + bob], [1062, 196 + bob], [1092, 214 + bob], [1110, 236 + bob], [1230, 252 + bob],
    [1290, 278 + bob], [1312, 318 + bob], [1300, 358 + bob], [1150, 366 + bob], [970, 376 + bob]]);
  cel(p, skull, REXB.skin, light, { tex: () => {
    p.poly(R([[1040, 230 + bob], [1110, 236 + bob], [1150, 250 + bob], [1110, 262 + bob]]), REXB.back, 0); // dark brow band
    scales(p, 940, 190, 1320, 380, 15, REXB.back, 23);
    p.g.globalAlpha = 0.5; p.poly(R([[1130, 290 + bob], [1215, 285 + bob], [1190, 320 + bob], [1130, 322 + bob]]), INKB, 0); p.g.globalAlpha = 1; // antorbital hollow
    p.stroke(R([[1150, 268 + bob], [1215, 330 + bob]]), 6, REXB.scar); p.stroke(R([[1170, 262 + bob], [1232, 322 + bob]]), 5, REXB.scar);
  } });
  const [nx, ny] = R([[1282, 290 + bob]])[0]; p.poly([[nx - 10, ny - 3], [nx + 10, ny - 7], [nx + 6, ny + 5]], INKB, 0);
  const [ex, ey] = R([[1060, 262 + bob]])[0];
  beastEye(p, ex, ey, 1.45, expr, o.blink ?? 0, REXB.skin);
  // tiny arm, two hooked claws
  const arm = curve([900, 545 + bob], [945, 575 + bob], [962, 610 + bob - 25 * roar], 6);
  cel(p, tube(arm, 19, 13), REXB.skin, light, { d: 8, ow: OW * 0.75 });
  const h = arm[arm.length - 1]; claw(p, h, 26, 0.9, 7); claw(p, [h[0] - 4, h[1] + 6], 24, 1.1, 7);
}

// ------------------------------------------------------------------ Triceratops
export const TRIB = { skin: "#5E4A31", back: "#3A2C1C", belly: "#8F7752", frill: "#7E2617", frillEdge: "#2A120C", spot: "#120A08", horn: "#DCCDA8", hornTip: "#241A14" };
export function drawTrikeB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 5 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "angry";
  const limb = (x: number, y: number, off: number, col: string, front: boolean) => {
    const w = walkOf(o, off), L = curve([x, y], [x + (front ? -16 : 22) + Math.sin(w.swing) * 80, y + 140], [x + Math.sin(w.swing) * 160, GROUND - 16 - w.lift], 10);
    cel(p, tube(L, front ? 62 : 70, 50), col, light, { d: 14, tex: () => { scales(p, x - 90, y, x + 110, GROUND, 22, TRIB.back, x | 0); folds(p, [[[x - 40, y + 170], [x, y + 185], [x + 40, y + 170]]]); } });
    const f = L[L.length - 1];
    for (let i = 0; i < 4; i++) claw(p, [f[0] - 34 + i * 22, f[1] + 30], 22, 0.3, 8);
  };
  limb(470, 640 + bob, 0.25, mul(TRIB.skin, [0.72, 0.74, 0.84]), false); limb(870, 650 + bob, 0.75, mul(TRIB.skin, [0.72, 0.74, 0.84]), true);
  const tailL = curve([390, 560 + bob], [240, 570 + bob], [90, 650 + bob], 12);
  cel(p, tube(tailL, 92, 8), TRIB.skin, light, { tex: () => scales(p, 60, 460, 440, 700, 22, TRIB.back, 4) });
  scutes(p, tailL.map(([x, y], i) => [x, y - (92 - i * 7)] as P2), 22, TRIB.back, light, 5);
  const body = blob(680, 560 + bob, 315, 190, -0.04, 4, 0.03, 1.7, 2.0);
  cel(p, body, TRIB.skin, light, { tex: () => {
    p.poly(blob(710, 720 + bob, 270, 85, 0, 6), TRIB.belly, 0);
    scales(p, 360, 360, 1000, 760, 30, TRIB.back, 8, 0.5);
    for (let i = 0; i < 7; i++) p.poly([[430 + i * 75, 390 + bob], [462 + i * 75, 390 + bob], [455 + i * 75, 540 + bob], [440 + i * 75, 520 + bob]], TRIB.back, 0);
    for (let i = 0; i < 3; i++) p.stroke([[600 + i * 18, 470 + bob], [660 + i * 18, 560 + bob]], 6, "#B9A57E");
    folds(p, [[[930, 520 + bob], [955, 590 + bob], [935, 660 + bob]]]);
  } });
  scutes(p, curve([400, 395 + bob], [650, 340 + bob], [900, 380 + bob], 14), 30, TRIB.back, light, 9);
  limb(530, 660 + bob, 0.75, TRIB.skin, false); limb(910, 670 + bob, 0.25, TRIB.skin, true);
  // frill: big, ringed with long sharp epoccipitals, dark edge, eye-spots, veins
  const fc: P2 = [1000, 410 + bob];
  for (let i = 0; i < 11; i++) {
    const a = rad(-190 + i * 22), bx = fc[0] + Math.cos(a) * 160, by = fc[1] + Math.sin(a) * 200, L = 60 + (i % 2) * 26;
    p.poly(horn([[bx, by], [bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5], [bx + Math.cos(a + 0.12) * L, by + Math.sin(a + 0.12) * L]], 20), TRIB.hornTip, 3);
  }
  const frill = blob(fc[0], fc[1], 162, 202, 0.35, 8, 0.05, 1.8, 2.0);
  cel(p, frill, TRIB.frill, light, { tex: () => {
    p.g.globalAlpha = 0.5; for (let i = 0; i < 9; i++) { const a = rad(-180 + i * 22); p.stroke(curve([fc[0] + 40, fc[1] + 40], [fc[0] + Math.cos(a) * 80, fc[1] + Math.sin(a) * 100], [fc[0] + Math.cos(a) * 150, fc[1] + Math.sin(a) * 190], 8), 4, TRIB.frillEdge); } p.g.globalAlpha = 1;
    for (const [dx, dy] of [[-70, -110], [-110, 0], [-50, 90]]) { p.ell(fc[0] + dx, fc[1] + dy, 34, 24, TRIB.spot, 0); p.ell(fc[0] + dx + 8, fc[1] + dy - 4, 12, 9, "#D9A13A", 0); }
    p.path(frill, true); p.g.strokeStyle = TRIB.frillEdge; p.g.lineWidth = 26; p.g.stroke();
  } });
  // head: heavy, angular, hooked beak, cheek horn
  const head = [[990, 500], [1080, 445], [1200, 460], [1260, 500], [1250, 600], [1170, 650], [1050, 640], [985, 600]].map(([x, y]) => [x, y + bob] as P2);
  cel(p, head, TRIB.skin, light, { tex: () => { scales(p, 980, 430, 1270, 660, 18, TRIB.back, 12); folds(p, [[[1030, 560 + bob], [1060, 600 + bob], [1100, 610 + bob]]]); } });
  cel(p, [[1245, 480 + bob], [1350, 548 + bob], [1335, 592 + bob], [1290, 648 + bob], [1240, 622 + bob]], mul(TRIB.skin, [0.55, 0.55, 0.58]), light, { d: 12 });
  p.poly(horn(curve([1040, 610 + bob], [1010, 640 + bob], [990, 676 + bob], 4), 16), TRIB.hornTip, 3); // cheek horn
  for (const [pts, r] of [[curve([1060, 465 + bob], [1170, 330 + bob], [1370, 270 + bob], 14), 30], [curve([1225, 485 + bob], [1255, 440 + bob], [1268, 400 + bob], 6), 20]] as [P2[], number][]) {
    const hp = horn(pts, r);
    cel(p, hp, TRIB.horn, light, { d: 8, ow: OW * 0.85, tex: () => {
      const tp = pts[pts.length - 1]; p.ell(tp[0], tp[1], r * 2.6, r * 2.6, TRIB.hornTip, 0);
      p.g.globalAlpha = 0.5; for (let i = 2; i < pts.length - 3; i += 3) p.stroke([[pts[i][0] - 8, pts[i][1] - 10], [pts[i][0] + 8, pts[i][1] + 10]], 3, INKB); p.g.globalAlpha = 1; // cracks
    } });
  }
  p.stroke([[1160, 615 + bob], [1250, 602 + bob]], 6, INKB);
  beastEye(p, 1115, 520 + bob, 1.4, expr, o.blink ?? 0, TRIB.skin, "#FF8A1F");
}

// ------------------------------------------------------------------ woolly mammoth
export const MAMB = { fur: "#43291A", furDark: "#24150D", furLit: "#6E4428", skin: "#2C211C", tusk: "#E6D8B4", tuskDark: "#9C8A66" };
export function drawMammothB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const expr = o.expr ?? "angry";
  /** long hair: curved strands hanging from a line, drawn dark-to-light in two passes */
  const hair = (line: P2[], len: number, seed: number, cols = [MAMB.furDark, MAMB.fur]) => {
    const r = rng(seed);
    cols.forEach((c, k) => { for (const [x, y] of line) { const l = len * (0.7 + r() * 0.5), sw = (r() - 0.5) * 30; p.stroke(curve([x, y], [x + sw * 0.4 - 6, y + l * 0.55], [x + sw - 10, y + l], 6), 13 - k * 5, c); } });
  };
  const leg = (x: number, off: number, col: string) => {
    const w = walkOf(o, off), L = curve([x, 640 + bob], [x + Math.sin(w.swing) * 70, 790 + bob], [x + Math.sin(w.swing) * 140, GROUND - 22 - w.lift], 10);
    cel(p, tube(L, 74, 62), col, light, { d: 14, rim: false });
    const f = L[L.length - 1];
    p.ell(f[0], f[1] + 12, 66, 20, MAMB.skin, 5);
    hair(Array.from({ length: 6 }, (_, i) => [x - 60 + i * 22 + Math.sin(w.swing) * 70, 700 + bob] as P2), 150, x | 0);
  };
  leg(560, 0.25, mul(MAMB.fur, [0.7, 0.72, 0.82])); leg(880, 0.75, mul(MAMB.fur, [0.7, 0.72, 0.82]));
  // body: high shoulder hump, sloping back
  const body: P2[] = chaikin([[420, 520], [450, 400], [560, 330], [760, 300], [900, 230], [980, 250], [1030, 360], [1020, 560], [900, 680], [600, 690], [460, 640]].map(([x, y]) => [x, y + bob] as P2));
  const bodyS = blob(0, 0, 1, 1); void bodyS;
  hair(Array.from({ length: 22 }, (_, i) => [440 + i * 27, 630 + bob + Math.sin(i) * 10] as P2), 120, 3);
  cel(p, body, MAMB.fur, light, { d: 30, tex: () => {
    const r = rng(7);
    for (let i = 0; i < 160; i++) { const x = 420 + r() * 620, y = 230 + bob + r() * 460; p.stroke(curve([x, y], [x - 6, y + 22], [x - 14, y + 44], 4), 5, r() < 0.5 ? MAMB.furDark : MAMB.furLit); }
    for (let i = 0; i < 3; i++) p.stroke([[700 + i * 18, 400 + bob], [760 + i * 18, 470 + bob]], 6, "#B99A78");
  } });
  hair(Array.from({ length: 16 }, (_, i) => [600 + i * 26, 600 + bob - i * 4] as P2), 150, 5); // belly skirt over the far legs
  leg(600, 0.75, MAMB.fur); leg(920, 0.25, MAMB.fur);
  // head: domed, small ear, hair crest
  const head = blob(1050, 380 + bob, 150, 185, 0.12, 13, -0.15, 1.6, 2.2);
  cel(p, head, MAMB.fur, light, { d: 26, tex: () => { const r = rng(17); for (let i = 0; i < 70; i++) { const x = 920 + r() * 270, y = 200 + bob + r() * 360; p.stroke(curve([x, y], [x - 5, y + 18], [x - 12, y + 36], 4), 5, r() < 0.5 ? MAMB.furDark : MAMB.furLit); } } });
  scutes(p, curve([960, 230 + bob], [1040, 180 + bob], [1130, 220 + bob], 10), 34, MAMB.furDark, light, 19);
  cel(p, blob(985, 430 + bob, 40, 56, 0.2, 14), MAMB.furDark, light, { d: 8, rim: false });
  hair(Array.from({ length: 8 }, (_, i) => [960 + i * 24, 520 + bob] as P2), 110, 9);
  // trunk: wrinkled, curling
  const sw = 0.05 * Math.sin(2 * Math.PI * (o.phase ?? 0));
  const trunkL = curve([1140, 460 + bob], [1250 + 40 * sw, 700 + bob], [1170, 900 + bob], 18);
  cel(p, tube(trunkL, 64, 24), MAMB.fur, light, { d: 16, tex: () => { for (let i = 3; i < trunkL.length - 1; i += 1) { const [x, y] = trunkL[i]; p.stroke([[x - 40, y - 4], [x + 40, y + 4]], 4, MAMB.furDark); } } });
  // tusks: huge, spiralling forward and up, chipped, ringed
  const tk = curve([1100, 560 + bob], [1440, 700 + bob], [1395, 300 + bob], 24);
  const tp = horn(tk, 34);
  cel(p, tp, MAMB.tusk, light, { d: 10, ow: OW * 0.9, tex: () => { for (let i = 3; i < tk.length - 2; i += 3) p.stroke([[tk[i][0] - 30, tk[i][1] + 10], [tk[i][0] + 30, tk[i][1] - 10]], 3, MAMB.tuskDark); } });
  beastEye(p, 1095, 395 + bob, 1.35, expr, o.blink ?? 0, MAMB.fur, "#FF4A1A");
}


// ------------------------------------------------------------------ Megalodon (Miocene-Pliocene, 23-3.6 Ma; ~15 m)
// side view swimming right; `walk` = tail sweep, `roar` = gape. Drawn with its belly on design y ~ 700 (place the card
// at the depth you want in water).
export const MEG = { top: "#3E4A55", side: "#6E7C88", belly: "#D9DCD6", fin: "#2C353D", gum: "#8A2C38", mouth: "#22090E", scar: "#C9CED0" };
export function drawMegB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sweep = Math.sin(ph) * 0.18 * (o.walk ?? 0.6);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const cy = 520;
  // tail: crescent caudal fin swinging about the tail stock
  const stock: P2 = [270, cy - 10];
  const caudal = rotAll([[300, cy - 20], [150, cy - 230], [205, cy - 40], [230, cy + 10], [130, cy + 190], [300, cy + 30]] as P2[], sweep, stock);
  cel(p, caudal, MEG.fin, light, { d: 10 });
  // far pectoral fin
  cel(p, [[930, cy + 110], [720, cy + 250], [690, cy + 236], [860, cy + 100]], mul(MEG.fin, [0.75, 0.75, 0.82]), light, { d: 8, rim: false });
  // body: torpedo, countershaded, gills, scars
  const body: P2[] = chaikin(rotAll([[260, cy - 20], [420, cy - 120], [700, cy - 175], [1000, cy - 160], [1250, cy - 100], [1380, cy - 30], [1395, cy + 30],
    [1300, cy + 90], [1050, cy + 140], [750, cy + 150], [480, cy + 90], [280, cy + 20]] as P2[], sweep * 0.25, [800, cy]), 3);
  cel(p, body, MEG.side, light, { d: 30, tex: () => {
    p.poly(chaikin([[260, cy + 10], [600, cy + 40], [1000, cy + 40], [1330, cy + 40], [1300, cy + 160], [700, cy + 200], [280, cy + 60]], 2), MEG.belly, 0);
    p.poly(chaikin([[300, cy - 30], [700, cy - 220], [1250, cy - 140], [1300, cy - 70], [900, cy - 70], [500, cy - 40]], 2), MEG.top, 0);
    for (let i = 0; i < 5; i++) p.stroke(curve([1090 - i * 28, cy - 70], [1075 - i * 28, cy], [1085 - i * 28, cy + 70], 6), 7, INKB);
    for (let i = 0; i < 3; i++) p.stroke([[720 + i * 22, cy - 90], [800 + i * 22, cy - 10]], 6, MEG.scar);
    scales(p, 280, cy - 200, 1400, cy + 200, 14, MEG.top, 31, 0.18);
  } });
  // dorsal + near pectoral fins
  cel(p, [[700, cy - 165], [790, cy - 360], [830, cy - 352], [900, cy - 160]], MEG.fin, light, { d: 10 });
  cel(p, [[400, cy - 90], [430, cy - 150], [470, cy - 85]], MEG.fin, light, { d: 6, ow: OW * 0.7 });
  cel(p, [[990, cy + 100], [760, cy + 270], [715, cy + 252], [905, cy + 88]], MEG.fin, light, { d: 8 });
  // jaw: the lower jaw drops, rows of serrated triangular teeth
  const hinge: P2 = [1110, cy + 40], ja = rad(40) * roar;
  const J = (q: P2[]) => rotAll(q, ja, hinge);
  if (roar > 0.05) {
    p.poly([[1110, cy + 20], [1385, cy + 6], ...J([[1370, cy + 40], [1110, cy + 50]])], MEG.mouth, 0);
    p.poly(J([[1150, cy + 46], [1340, cy + 40], [1320, cy + 60], [1160, cy + 66]]), MEG.gum, 0);
    p.poly([[1130, cy + 18], [1380, cy + 4], [1370, cy + 22], [1140, cy + 34]], MEG.gum, 0);
    for (let i = 0; i < 9; i++) tooth(p, 1150 + i * 26, cy + 20 - i * 1.5, 34 - (i % 2) * 6, true, 0, 0.42);
    for (let i = 0; i < 8; i++) { const [tx, ty] = J([[1160 + i * 25, cy + 46]])[0]; tooth(p, tx, ty, 28 - (i % 2) * 6, false, ja, 0.42); }
    const lj = J([[1110, cy + 50], [1370, cy + 40], [1330, cy + 120], [1120, cy + 130]]);
    cel(p, lj, MEG.belly, light, { d: 10 });
  } else {
    p.stroke(curve([1180, cy + 50], [1290, cy + 60], [1385, cy + 28], 8), 7, INKB);
    for (let i = 0; i < 5; i++) tooth(p, 1240 + i * 26, cy + 52 - i * 4, 18, true, 0, 0.42);
  }
  beastEye(p, 1270, cy - 52, 1.45, expr, o.blink ?? 0, MEG.top, "#E8E2D0");
}

// ------------------------------------------------------------------ Titanoboa (Paleocene, ~60 Ma; ~13 m)
// an S-shaped body along the ground rising into a striking head on the right; `walk` = slither wave, `roar` = gape.
export const BOA = { skin: "#5C6B3C", blotch: "#2A3020", belly: "#C9BE8A", mouth: "#2A0A10", tongue: "#B0303E" };
export function drawBoaB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), w = o.walk ?? 0.4;
  const roar = o.roar ?? 0, expr = o.expr ?? "angry";
  // centreline: tail at the left on the ground, waves, then the neck rears up to the head at (1220, 420)
  const line: P2[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    if (t < 0.72) { const x = 60 + t / 0.72 * 980; line.push([x, GROUND - 40 - Math.sin(t * 9 - ph * 2) * 30 * (0.4 + w) - t * 20]); }
    else { const k = (t - 0.72) / 0.28; line.push([1040 + Math.sin(k * Math.PI * 0.5) * 170, GROUND - 60 - (1 - Math.cos(k * Math.PI * 0.5)) * 470 - k * 30]); }
  }
  const radius = (i: number) => { const t = i / 40; return 14 + 70 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) - (t > 0.78 ? (t - 0.78) * 200 : 0); };
  // build a variable-width outline
  const L: P2[] = [], R: P2[] = [];
  line.forEach((q, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const r = radius(i);
    L.push([q[0] - dy * r, q[1] + dx * r]); R.push([q[0] + dy * r, q[1] - dx * r]);
  });
  const outline = [...L, ...R.reverse()];
  cel(p, outline, BOA.skin, light, { d: 22, tex: () => {
    // belly scutes along one side, blotches along the back
    line.forEach((q, i) => { if (i % 2 || i > 37) return; const r = radius(i); p.ell(q[0] - 8, q[1] + r * 0.62, r * 0.4, r * 0.22, BOA.belly, 0); });
    line.forEach((q, i) => { if (i % 3 || i < 2 || i > 36) return; const r = radius(i); p.poly([[q[0] - r * 0.6, q[1] - r * 0.1], [q[0], q[1] - r * 0.75], [q[0] + r * 0.6, q[1] - r * 0.1], [q[0], q[1] + r * 0.35]], BOA.blotch, 0); });
    scales(p, 40, 380, 1300, 980, 14, BOA.blotch, 41, 0.3);
  } });
  // head: wedge skull, jaw drops on the strike, fangs, forked tongue
  const H: P2 = line[line.length - 1];
  const hx = H[0] + 30, hy = H[1] - 10, ja = rad(40) * roar;
  const HS = 1.55; // head bigger than the neck
  p.g.save(); p.g.translate(hx, hy); p.g.scale(HS, HS); p.g.translate(-hx, -hy);
  const J = (q: P2[]) => rotAll(q, ja, [hx - 40, hy + 18]);
  if (roar > 0.05) {
    p.poly([[hx - 40, hy + 10], [hx + 140, hy + 4], ...J([[hx + 130, hy + 30], [hx - 40, hy + 30]])], BOA.mouth, 0);
    tooth(p, hx + 100, hy + 6, 34, true, 0, 0.22); tooth(p, hx + 70, hy + 6, 26, true, 0, 0.22);
    const tg = J([[hx + 20, hy + 26]])[0];
    p.stroke(curve(tg, [tg[0] + 90, tg[1] - 10], [tg[0] + 150, tg[1] + 10], 6), 7, BOA.tongue);
    cel(p, J([[hx - 40, hy + 22], [hx + 130, hy + 26], [hx + 110, hy + 60], [hx - 30, hy + 64]]), BOA.belly, light, { d: 8, ow: OW * 0.8 });
  }
  const head: P2[] = chaikin([[hx - 60, hy - 30], [hx + 20, hy - 66], [hx + 120, hy - 40], [hx + 160, hy + 4], [hx + 120, hy + 26], [hx - 20, hy + 36], [hx - 70, hy + 20]], 2);
  cel(p, head, BOA.skin, light, { d: 14, tex: () => { scales(p, hx - 80, hy - 70, hx + 170, hy + 40, 12, BOA.blotch, 43, 0.35); p.poly([[hx - 30, hy - 44], [hx + 60, hy - 50], [hx + 30, hy - 26]], BOA.blotch, 0); } });
  if (roar <= 0.05) {
    p.stroke(curve([hx - 30, hy + 18], [hx + 60, hy + 26], [hx + 150, hy + 6], 8), 6, INKB);
    const t = Math.sin(ph * 6) > 0.3; // tongue flicks
    if (t) p.stroke(curve([hx + 150, hy + 8], [hx + 200, hy + 14], [hx + 230, hy + 2], 6), 6, BOA.tongue);
  }
  beastEye(p, hx + 60, hy - 22, 0.95, expr, o.blink ?? 0, BOA.skin, "#F2C230");
  p.g.restore();
}

// ------------------------------------------------------------------ Acheroraptor (Hell Creek, 66 Ma; mid-sized dromaeosaurid)
// feathered (dromaeosaurs had feathers), stiff tail with a feather fan, winged arms, sickle claw held up off the ground
export const RAP = { skin: "#4E4A3A", feather: "#3A3328", featherLit: "#7A6A4A", belly: "#A8987A", mouth: "#2A0A10" };
export function drawRaptorB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = 9 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const featherRow = (pts: P2[], len: number, ang: number, col: string, seed: number) => {
    const r = rng(seed);
    for (const [x, y] of pts) { const l = len * (0.7 + r() * 0.5), a = ang + (r() - 0.5) * 0.4; p.poly(horn([[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 12), col, 4); }
  };
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.62, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 8, (L[1][1] + L[2][1]) / 2], L[2], 8), 26, 18), col, light, { d: 8, rim: false });
    cel(p, tube([L[2], L[3]], 18, 14), col, light, { d: 6, rim: false });
    for (let i = 0; i < 2; i++) claw(p, [L[3][0] + 14 + i * 14, L[3][1] + 4], 26, 0.3, 7);
    // the sickle claw, held up
    p.poly(horn(curve([L[3][0] - 2, L[3][1] - 8], [L[3][0] + 6, L[3][1] - 50], [L[3][0] + 40, L[3][1] - 54], 8), 12), "#160E0C", 3);
    cel(p, rotAll(blob(hip[0] + 15, hip[1] + 30, 70, 92, 0.35, 9, -0.2, 1.7, 2.0), w.swing * 0.6, hip), col, light, { d: 12 });
  };
  leg([640, 640 + bob], far, mul(RAP.skin, [0.7, 0.72, 0.82]));
  // tail: long, stiff, straight, feather fan at the end
  const tailL = curve([560, 590 + bob], [360, 560 + bob], [90, 540 + bob + 10 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 14);
  featherRow(tailL.slice(7), 90, rad(-150), RAP.feather, 3); featherRow(tailL.slice(7), 80, rad(150), RAP.feather, 4);
  cel(p, tube(tailL, 52, 10), RAP.skin, light, { d: 10 });
  // body + feather cape along the back
  const body = blob(700, 600 + bob, 170, 92, -0.12, 3, -0.12, 1.7, 2.1);
  featherRow(curve([560, 530 + bob], [690, 500 + bob], [820, 520 + bob], 9), 70, rad(-150), RAP.feather, 5);
  cel(p, body, RAP.skin, light, { d: 16, tex: () => { p.poly(blob(740, 660 + bob, 140, 46, -0.15, 5), RAP.belly, 0); scales(p, 520, 500, 880, 700, 14, RAP.feather, 7, 0.5); } });
  leg([690, 650 + bob], near, RAP.skin);
  // neck + head: long narrow snout, teeth, jaw drops on the screech
  const neck = curve([820, 570 + bob], [880, 500 + bob], [920, 450 + bob], 8);
  featherRow(neck.slice(1), 50, rad(-160), RAP.feather, 9);
  cel(p, tube(neck, 52, 40), RAP.skin, light, { d: 10 });
  const hinge: P2 = [930, 455 + bob], ja = rad(30) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[930, 448 + bob], [1110, 452 + bob], ...J([[1100, 466 + bob], [930, 470 + bob]])], RAP.mouth, 0);
  cel(p, J([[925, 460 + bob], [1100, 462 + bob], [1090, 482 + bob], [960, 492 + bob]]), mul(RAP.skin, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.8 });
  for (let i = 0; i < 6; i++) tooth(p, 960 + i * 24, 452 + bob, 14, true, 0, 0.3);
  const head: P2[] = chaikin([[900, 440], [930, 405], [990, 398], [1080, 420], [1125, 446], [1100, 458], [940, 466]].map(([x, y]) => [x, y + bob] as P2), 2);
  cel(p, head, RAP.skin, light, { d: 10, tex: () => scales(p, 890, 380, 1130, 470, 10, RAP.feather, 11, 0.45) });
  featherRow([[930, 405 + bob], [950, 400 + bob], [915, 418 + bob]], 46, rad(-140), RAP.feather, 13); // crest
  beastEye(p, 990, 425 + bob, 0.95, expr, o.blink ?? 0, RAP.skin, "#F2D23A");
  // winged arm folded at the side, claws out
  const arm = curve([820, 600 + bob], [880, 630 + bob], [930, 610 + bob - 20 * roar], 6);
  featherRow(arm.slice(1), 70, rad(120), RAP.feather, 15);
  cel(p, tube(arm, 18, 12), RAP.skin, light, { d: 6, ow: OW * 0.75 });
  const h = arm[arm.length - 1]; claw(p, h, 26, 0.6, 6); claw(p, [h[0] + 4, h[1] + 6], 24, 0.9, 6);
}

export const BEAST = {
  rex: { draw: drawRexB, len: 12.3, x0: 20, x1: 1320 },
  trike: { draw: drawTrikeB, len: 8.5, x0: 80, x1: 1370 },
  mammoth: { draw: drawMammothB, len: 5.6, x0: 410, x1: 1440 },
  meg: { draw: drawMegB, len: 15, x0: 130, x1: 1395 },
  boa: { draw: drawBoaB, len: 13, x0: 40, x1: 1440 },
  raptor: { draw: drawRaptorB, len: 3.0, x0: 80, x1: 1130 },
} as const;
