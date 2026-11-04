// Winged beasts + dragons (2026-11-04, user: "còn thiếu những con thú có cánh, và làm cả rồng nữa, phải thật đáng sợ").
// Same beast look and API as beastAnimals.ts / beastMore.ts: side views facing screen right, design 1600 x 1000.
// Flyers are drawn around design y ~ 520 (place their cards with anchor 520, like the swimmers):
//   walk = flap strength (0 = glide with the wings held up), phase = wingbeat, roar = the attack move.
// Our own drawings; the dragons are fantasy animals (for myth / legend episodes), the rest are real fossil animals.
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, claw, digiLeg, folds, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, colLeg, furFlicks, scars } from "./beastMore";

const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
/** 0 = wings up, 1 = wings down; walk 0 = glide (wings held up a little) */
const flapOf = (o: AnimalPose, glide = 0.3) => { const w = o.walk ?? 0; return glide + (0.5 - 0.5 * Math.cos(2 * Math.PI * (o.phase ?? 0)) - glide) * w; };

/** wing geometry seen from the side: the span shows as height (up-stroke above, down-stroke below the shoulder) */
export function wingFrame(sh: P2, span: number, flapK: number, back = 0.35) {
  const psi = Math.PI * flapK, c = Math.cos(psi), s = Math.abs(Math.sin(psi));
  const tip: P2 = [sh[0] - span * (back + 0.2 * s), sh[1] - span * c * 0.95];
  const elbow = add(lerp2(sh, tip, 0.3), span * 0.1, 0), wrist = add(lerp2(sh, tip, 0.52), span * 0.14, 0);
  return { tip, elbow, wrist, c };
}
/** membrane wing (pterosaur / dragon / bat): arm bones on the leading edge, fingers fanning to a scalloped trailing edge */
type MemO = { sh: P2; rear: P2; span: number; flapK: number; col: string; mem: string; light: number; fingers: number; scallop: number; arm: number; back?: number; seed?: number; holes?: boolean };
export function memWing(p: Pen, m: MemO) {
  const f = wingFrame(m.sh, m.span, m.flapK, m.back), n = Math.max(1, m.fingers);
  const ends: P2[] = []; // finger ends along the trailing edge, from the tip toward the body
  for (let j = 1; j <= n; j++) { const k = j / (n + 1), q = lerp2(f.tip, m.rear, k); ends.push(add(q, -m.span * 0.18 * Math.sin(Math.PI * k), m.span * 0.08 * (f.c > 0 ? 1 : -1) * Math.sin(Math.PI * k))); }
  const trail: P2[] = [];
  const chain = [f.tip, ...ends, m.rear];
  for (let j = 0; j < chain.length - 1; j++) { // scallops: the edge bows in toward the wrist between two finger ends
    const a = chain[j], b = chain[j + 1], mid = lerp2(lerp2(a, b, 0.5), f.wrist, m.scallop);
    trail.push(...curve(a, mid, b, 6).slice(0, -1));
  }
  trail.push(m.rear);
  const poly = [m.sh, f.elbow, f.wrist, ...curve(f.wrist, add(lerp2(f.wrist, f.tip, 0.5), m.span * 0.06, -m.span * 0.04 * f.c), f.tip, 6).slice(1), ...trail.slice(1)];
  cel(p, poly, m.mem, m.light, { d: 14, ow: OW * 0.8, tex: () => {
    p.g.globalAlpha = 0.35; const r = rng(m.seed ?? 3);
    for (let i = 0; i < 18; i++) { const a = lerp2(f.wrist, ends[i % n], 0.2 + r() * 0.3), b = lerp2(m.sh, m.rear, r()); p.stroke(curve(a, lerp2(lerp2(a, b, 0.5), f.wrist, 0.2), b, 6), 3, INKB); } // veins
    p.g.globalAlpha = 1;
    if (m.holes) for (let i = 0; i < 3; i++) { const q = lerp2(lerp2(f.wrist, ends[i % n], 0.6), m.rear, r() * 0.3); p.ell(q[0], q[1], 14 + r() * 12, 8 + r() * 6, "#2A1010", 3); } // torn holes
  } });
  for (const e of ends) cel(p, tube(curve(f.wrist, lerp2(lerp2(f.wrist, e, 0.5), f.tip, 0.12), e, 6), m.arm * 0.45, m.arm * 0.18), m.col, m.light, { d: 4, ow: 8, rim: false });
  if (m.fingers === 0) cel(p, tube(curve(f.wrist, lerp2(lerp2(f.wrist, f.tip, 0.5), m.sh, -0.05), f.tip, 8), m.arm * 0.5, m.arm * 0.15), m.col, m.light, { d: 4, ow: 8, rim: false });
  cel(p, tube([m.sh, f.elbow, f.wrist], m.arm, m.arm * 0.7), m.col, m.light, { d: 8 });
  for (let i = 0; i < 3; i++) claw(p, add(f.wrist, 4, 6 + i * 10), m.arm * 1.1, -0.6 + i * 0.25, m.arm * 0.3); // thumb claws
  return f;
}
/** feathered wing (birds, Microraptor): a dark base, primaries fanning back with jagged tips, feather lines */
export function featherWing(p: Pen, sh: P2, rear: P2, span: number, flapK: number, col: string, lit: string, light: number, seed: number, n = 10, back = 0.35) {
  const f = wingFrame(sh, span, flapK, back), r = rng(seed);
  const lead = [sh, f.elbow, f.wrist, ...curve(f.wrist, add(lerp2(f.wrist, f.tip, 0.5), span * 0.05, 0), f.tip, 6).slice(1)];
  const tips: P2[] = [], bases: P2[] = [];
  for (let j = 0; j <= n; j++) {
    const k = j / n, base = lerp2(f.tip, lerp2(f.wrist, rear, 0.6), k), L = span * (0.32 - 0.18 * k) * (0.9 + r() * 0.2);
    bases.push(base); tips.push(add(base, -L * 0.85, L * 0.35 * (f.c >= 0 ? 1 : -1) + L * 0.2));
  }
  const edge: P2[] = [];
  tips.forEach((t, j) => { edge.push(t); if (j < n) edge.push(lerp2(lerp2(t, tips[j + 1], 0.5), bases[j], 0.35)); });
  const poly = [...lead, ...edge, rear];
  cel(p, poly, col, light, { d: 12, ow: OW * 0.8, tex: () => {
    p.g.globalAlpha = 0.6; tips.forEach((t, j) => p.stroke([lerp2(bases[j], t, 0.1), t], 4, INKB)); p.g.globalAlpha = 1;
    p.g.globalAlpha = 0.5; for (let i = 0; i < 12; i++) { const q = lerp2(lerp2(sh, f.wrist, r()), rear, r() * 0.5); p.ell(q[0], q[1], 22, 9, lit, 0, 0, 360, -0.4); } p.g.globalAlpha = 1; // covert feathers
  } });
  return f;
}
/** small pointed feathers along a line (crests, ruffs, tails) */
export function plumes(p: Pen, pts: P2[], len: number, ang: number, col: string, seed: number, w = 12) {
  const r = rng(seed);
  for (const [x, y] of pts) { const l = len * (0.7 + r() * 0.5), a = ang + (r() - 0.5) * 0.4; p.poly(horn([[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], w), col, 4); }
}

// ------------------------------------------------------------------ pterosaurs in flight (shared): Pteranodon, Quetzalcoatlus
type PteroSpec = { skin: string; fuzz: string; mem: string; beak: string; crest: string; neck: P2[]; head: P2; beakTip: P2; crestPts: P2[]; span: number; arm: number; iris: string; hs: number };
const PTER: PteroSpec = { skin: "#4E4640", fuzz: "#6A5A4C", mem: "#7A3A2A", beak: "#C9B88E", crest: "#B2361E", neck: [[830, 520], [880, 500], [925, 475]], head: [930, 468], beakTip: [1290, 520],
  crestPts: [[935, 455], [840, 380], [690, 330], [720, 360], [880, 450]], span: 490, arm: 20, iris: "#FFB21F", hs: 0.8 };
const QUEF: PteroSpec = { skin: "#4C4A44", fuzz: "#6A5E50", mem: "#8A4630", beak: "#C9B98E", crest: "#A8321E", neck: [[830, 520], [940, 470], [1050, 420]], head: [1055, 415], beakTip: [1420, 520],
  crestPts: [[1050, 400], [1030, 330], [1080, 300], [1095, 390]], span: 500, arm: 24, iris: "#FFB21F", hs: 0.8 };
function drawPteroFly(p: Pen, o: AnimalPose, S: PteroSpec) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", k = roar > 0.05 ? 0.05 : flapOf(o);
  const bob = 10 * Math.sin(2 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const sh: P2 = [800, 510 + bob], hip: P2 = [660, 555 + bob], ankle: P2 = [530, 585 + bob];
  memWing(p, { sh: add(sh, 24, -12), rear: add(ankle, 20, -10), span: S.span * 0.96, flapK: k, col: mul(S.skin, FAR), mem: mul(S.mem, FAR), light, fingers: 0, scallop: 0.4, arm: S.arm, seed: 2, back: 0.62 });
  // legs trailing back, clawed feet
  for (const dy of [0, 14]) { cel(p, tube([add(hip, 0, dy), add(ankle, 0, dy)], 16, 10), S.skin, light, { d: 4, ow: 9 }); for (let i = 0; i < 3; i++) claw(p, add(ankle, -8, dy + i * 7), 20, 2.4 + i * 0.2, 5); }
  const body = blob(740, 535 + bob, 120, 58, -0.12, 3, -0.1, 1.8, 2.1);
  cel(p, body, S.fuzz, light, { d: 12, tex: () => { furFlicks(p, 600, 470, 880, 600, 50, 3, [S.skin, "#8A7A66"], 18, 4); scars(p, 720, 500 + bob, "#D8C49A", 2, 30, 12); } });
  // neck + head; the beak gapes on the screech
  const neck = S.neck.map((q) => add(q, 0, bob));
  cel(p, tube(curve(neck[0], neck[1], neck[2], 10), 40, 28), S.skin, light, { d: 8, tex: () => furFlicks(p, 780, 380, 1080, 560, 30, 7, [S.fuzz], 16, 4) });
  const H = add(S.head, 0, bob), T = add(S.beakTip, 0, bob), dn = rad(22) * roar, up = -rad(6) * roar;
  const along = (u: number, v: number): P2 => { const dx = T[0] - H[0], dy = T[1] - H[1], L = Math.hypot(dx, dy); return [H[0] + dx * u - (dy / L) * v, H[1] + dy * u + (dx / L) * v]; };
  cel(p, S.crestPts.map((q) => add(q, 0, bob)), S.crest, light, { d: 8, ow: OW * 0.8, tex: () => { p.g.globalAlpha = 0.4; p.stroke([add(S.crestPts[0], 0, bob), add(S.crestPts[2], 0, bob)], 4, INKB); p.g.globalAlpha = 1; } });
  p.poly([along(0.05, 6), ...rotAll([along(0.98, 0)], up, H), ...rotAll([along(0.95, 4)], dn, H), along(0.05, 18)], "#30080E", 0);
  if (roar > 0.05) { p.g.globalAlpha = 0.8; const q = rotAll([along(0.35, 10)], dn * 0.5, H)[0]; p.ell(q[0], q[1], 60, 10, "#B0404E", 0, 0, 360, rad(12)); p.g.globalAlpha = 1; }
  cel(p, rotAll(chaikin([along(-0.04, 14), along(0.4, 34), along(0.96, 8), along(0.92, 2), along(0.4, 14), along(0, 24)], 2), dn, H), mul(S.beak, [0.88, 0.88, 0.88]), light, { d: 3, ow: OW * 0.75 });
  cel(p, rotAll(chaikin([along(-0.08, -30), along(0.12, -34), along(0.5, -14), along(1.0, 0), along(0.96, 4), along(0.45, 6), along(0.02, 14)], 2), up, H), S.beak, light, { d: 5, ow: OW * 0.8, tex: () => {
    p.poly(rotAll([along(-0.08, -30), along(0.12, -30), along(0.1, 10), along(-0.06, 12)], up, H), S.skin, 0);
    p.g.globalAlpha = 0.4; for (let i = 0; i < 6; i++) p.stroke(rotAll([along(0.3 + i * 0.1, -6), along(0.34 + i * 0.1, 4)], up, H), 3, INKB); p.g.globalAlpha = 1;
  } });
  const e = rotAll([along(0.0, -8)], up, H)[0];
  beastEye(p, e[0], e[1], S.hs, expr, o.blink ?? 0, S.skin, S.iris);
  // near wing on top
  memWing(p, { sh, rear: ankle, span: S.span, flapK: k, col: S.skin, mem: S.mem, light, fingers: 0, scallop: 0.4, arm: S.arm, seed: 5, holes: true, back: 0.62 });
}
export const drawPteranodonB = (p: Pen, o: AnimalPose) => drawPteroFly(p, o, PTER);
export const drawQuetzFlyB = (p: Pen, o: AnimalPose) => drawPteroFly(p, o, QUEF);

// ------------------------------------------------------------------ Microraptor (Early Cretaceous; ~0.8 m, four feathered wings, black with a blue sheen)
const MIC = { body: "#17161C", lit: "#3A4A7A", sheen: "#5A7AC0", skin: "#2A2622", mouth: "#30080E" };
export function drawMicroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", k = flapOf(o, 0.35), bob = 12 * Math.sin(2 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const sh: P2 = [860, 500 + bob], hip: P2 = [680, 540 + bob];
  featherWing(p, add(sh, 20, -10), add(hip, 60, -10), 420, k, mul(MIC.body, FAR), MIC.lit, light, 3);
  featherWing(p, add(hip, 10, 10), [470, 590 + bob], 260, 0.78, mul(MIC.body, FAR), MIC.lit, light, 4, 8, 0.7); // hind wing (leg feathers)
  // tail with the end fan
  const tl = curve(add(hip, -20, 0), [470, 545 + bob], [180, 520 + bob], 12);
  cel(p, tube(tl, 30, 10), MIC.body, light, { d: 6 });
  plumes(p, tl.slice(7), 110, rad(-160), MIC.body, 5, 14); plumes(p, tl.slice(7), 100, rad(160), MIC.body, 6, 14);
  cel(p, [[170, 520 + bob], [60, 470 + bob], [80, 520 + bob], [60, 570 + bob]], MIC.body, light, { d: 6, ow: 9 });
  const body = blob(780, 520 + bob, 140, 64, -0.15, 3, -0.1, 1.8, 2.1);
  cel(p, body, MIC.body, light, { d: 10, tex: () => { furFlicks(p, 640, 450, 930, 590, 50, 3, [MIC.lit, MIC.sheen], 20, 4); } });
  // legs: hanging, or thrown forward with the claws open on the attack
  const fwd = roar;
  for (const dx of [0, 18]) {
    const knee = add(hip, 40 + dx + 60 * fwd, 60 - 20 * fwd), foot = add(hip, -20 + dx + 220 * fwd, 120 - 30 * fwd);
    cel(p, tube([add(hip, dx, 0), knee, foot], 22, 10), MIC.skin, light, { d: 4, ow: 9 });
    for (let i = 0; i < 3; i++) claw(p, foot, 28, 0.2 + i * 0.4 - 0.8 * fwd, 6);
    p.poly(horn(curve(foot, add(foot, 6, -24), add(foot, 30, -30), 6), 7), "#100A08", 3); // sickle
  }
  // neck + head with teeth
  cel(p, tube(curve([880, 500 + bob], [930, 470 + bob], [960, 450 + bob], 8), 34, 26), MIC.body, light, { d: 6, tex: () => furFlicks(p, 860, 420, 1000, 530, 20, 7, [MIC.sheen], 14, 3) });
  const hinge: P2 = [960, 455 + bob], ja = rad(32) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[960, 448 + bob], [1090, 450 + bob], ...J([[1085, 462 + bob], [960, 466 + bob]])], MIC.mouth, 0);
  cel(p, J([[955, 458 + bob], [1085, 460 + bob], [1075, 476 + bob], [975, 484 + bob]]), MIC.skin, light, { d: 4, ow: OW * 0.7 });
  for (let i = 0; i < 6; i++) tooth(p, 985 + i * 17, 450 + bob, 12, true, 0, 0.3);
  cel(p, chaikin([[935, 445 + bob], [960, 412 + bob], [1010, 405 + bob], [1080, 428 + bob], [1100, 450 + bob], [970, 462 + bob]], 2), MIC.skin, light, { d: 6 });
  plumes(p, [[950, 410 + bob], [970, 404 + bob], [935, 420 + bob]], 50, rad(-140), MIC.body, 9, 10);
  beastEye(p, 1000, 428 + bob, 0.7, expr, o.blink ?? 0, MIC.skin, "#F2D23A");
  featherWing(p, sh, add(hip, 40, 0), 440, k, MIC.body, MIC.sheen, light, 7);
}

// ------------------------------------------------------------------ Haast's eagle (New Zealand, extinct ~600 years ago; span ~3 m, hunted moa)
const HAA = { body: "#3A2A1E", lit: "#7A5A3A", head: "#5A4634", beak: "#E2C27A", beakTip: "#2A1E14", leg: "#D9B24A", mouth: "#30080E" };
export function drawHaastB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", k = roar > 0.05 ? 0.12 : flapOf(o, 0.3), bob = 12 * Math.sin(2 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const sh: P2 = [820, 490 + bob], hip: P2 = [660, 540 + bob];
  featherWing(p, add(sh, 26, -12), add(hip, 50, -10), 480, k, mul(HAA.body, FAR), HAA.lit, light, 3, 11);
  // tail fan
  plumes(p, Array.from({ length: 7 }, (_, i) => [600, 520 + bob + i * 9] as P2), 190, rad(178), HAA.body, 4, 22);
  // talons: tucked back, thrown forward under the head on the strike
  for (const dx of [0, 22]) {
    const a = add(hip, 30 + dx, 30), foot: P2 = roar > 0.05 ? add(hip, 360 + dx, 150) : add(hip, -110 + dx, 70);
    const knee = lerp2(a, foot, 0.5);
    cel(p, tube([a, add(knee, 0, 30), foot], 36, 16), HAA.body, light, { d: 6, tex: () => furFlicks(p, a[0] - 60, a[1] - 20, foot[0] + 40, foot[1] + 20, 20, 9, [HAA.lit], 16, 4) });
    cel(p, tube([lerp2(knee, foot, 0.5), foot], 16, 12), HAA.leg, light, { d: 4, ow: 9, rim: false });
    for (let i = 0; i < 4; i++) claw(p, foot, 46, (roar > 0.05 ? -0.6 : 2.2) + i * 0.45, 9);
  }
  const body = blob(760, 515 + bob, 160, 80, -0.15, 3, -0.1, 1.8, 2.1);
  cel(p, body, HAA.body, light, { d: 12, tex: () => furFlicks(p, 590, 430, 930, 600, 70, 3, [HAA.lit, "#24180F"], 22, 5) });
  // head: huge hooked beak, heavy brow, ruff
  cel(p, tube(curve([880, 500 + bob], [920, 470 + bob], [950, 455 + bob], 6), 54, 44), HAA.body, light, { d: 8, tex: () => furFlicks(p, 850, 400, 1000, 540, 26, 7, [HAA.lit], 18, 4) });
  const hinge: P2 = [990, 470 + bob], ja = rad(28) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[990, 462 + bob], [1110, 470 + bob], ...J([[1090, 486 + bob], [990, 482 + bob]])], HAA.mouth, 0);
  cel(p, J([[985, 476 + bob], [1090, 482 + bob], [1070, 500 + bob], [1000, 500 + bob]]), HAA.beak, light, { d: 4, ow: OW * 0.75 });
  cel(p, chaikin([[920, 470 + bob], [940, 420 + bob], [1000, 405 + bob], [1050, 420 + bob]], 1).concat([[1060, 430 + bob], [995, 480 + bob], [930, 495 + bob]] as P2[]), HAA.head, light, { d: 8, tex: () => furFlicks(p, 910, 390, 1060, 500, 20, 11, [HAA.lit], 14, 3) });
  const beak = chaikin([[1040, 418 + bob], [1100, 418 + bob], [1150, 445 + bob], [1160, 490 + bob], [1138, 505 + bob], [1130, 470 + bob], [1090, 466 + bob], [1035, 470 + bob]], 2);
  cel(p, beak, HAA.beak, light, { d: 6, ow: OW * 0.8, tex: () => p.poly([[1135, 445 + bob], [1165, 470 + bob], [1150, 510 + bob], [1128, 480 + bob]], HAA.beakTip, 0) });
  p.poly([[960, 418 + bob], [1050, 412 + bob], [1052, 428 + bob], [975, 436 + bob]], INKB, 0); // brow
  beastEye(p, 1010, 440 + bob, 0.85, expr, o.blink ?? 0, HAA.head, "#F2C230");
  featherWing(p, sh, add(hip, 30, 0), 500, k, HAA.body, HAA.lit, light, 7, 11);
}

// ------------------------------------------------------------------ terror bird (Phorusrhacos, Miocene S. America; ~2.5 m tall, axe beak)
const TER = { body: "#5A5048", dark: "#2A221C", lit: "#8A7A66", stripe: "#1E1814", beak: "#D9C08A", beakTip: "#2A1E14", leg: "#B89A5A", mouth: "#30080E" };
export function drawTerrorB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", bob = 10 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.82, w.swing, w.lift);
    cel(p, tube(curve(L[0], L[1], L[2], 8), 40, 20), col, light, { d: 8, tex: () => furFlicks(p, hip[0] - 60, hip[1], hip[0] + 120, hip[1] + 200, 20, 5, [TER.dark], 18, 4) });
    cel(p, tube([L[2], L[3]], 18, 14), TER.leg, light, { d: 6, tex: () => { for (let i = 0; i < 6; i++) p.stroke([lerp2(L[2], L[3], i / 6), add(lerp2(L[2], L[3], i / 6), 16, 0)], 3, INKB); } });
    for (let i = 0; i < 3; i++) claw(p, add(L[3], 10 + i * 20, 6), 34, 0.2 + i * 0.1, 8);
    p.poly(horn(curve(add(L[3], 0, -4), add(L[3], 8, -40), add(L[3], 40, -46), 6), 10), "#160E0C", 3); // raised killing claw
  };
  leg([600, 560 + bob], far, mul(TER.body, FAR));
  plumes(p, Array.from({ length: 6 }, (_, i) => [470, 470 + bob + i * 14] as P2), 170, rad(165), TER.dark, 3, 22); // tail plumes
  const body = blob(620, 480 + bob, 170, 120, -0.35, 3, -0.15, 1.8, 2.1);
  cel(p, body, TER.body, light, { d: 18, tex: () => { furFlicks(p, 440, 340, 800, 620, 90, 3, [TER.dark, TER.lit], 30, 5); for (let i = 0; i < 4; i++) p.stroke(curve([520 + i * 50, 380 + bob], [540 + i * 50, 480 + bob], [520 + i * 50, 580 + bob], 6), 8, TER.stripe); scars(p, 620, 420 + bob, "#D8C49A"); } });
  // stubby wing with a claw
  cel(p, chaikin([[640, 430 + bob], [720, 440 + bob], [740, 520 + bob], [680, 560 + bob], [620, 520 + bob]], 2), TER.dark, light, { d: 8 });
  claw(p, [735, 520 + bob], 30, 1.2, 8);
  leg([630, 570 + bob], near, TER.body);
  // neck: thick S; on the strike the head drops and the beak opens
  const nb: P2 = [720, 430 + bob], hr = rad(36) * roar, R = (q: P2[]) => rotAll(q, hr, nb);
  const neckL = R(curve(nb, [800, 330 + bob], [880, 290 + bob], 10));
  cel(p, tube(neckL, 72, 56), TER.body, light, { d: 10, tex: () => furFlicks(p, 680, 220, 960, 480, 50, 7, [TER.dark, TER.lit], 20, 4) });
  plumes(p, neckL.slice(2, 9).map(([x, y]) => [x - 30, y - 40] as P2), 50, rad(-130), TER.dark, 9, 12);
  const hinge = R([[900, 300 + bob]])[0], ja = rad(30) * roar, J = (q: P2[]) => rotAll(R(q), ja, hinge);
  p.poly([...R([[900, 292 + bob], [1170, 300 + bob]]), ...J([[1150, 316 + bob], [900, 312 + bob]])], TER.mouth, 0);
  if (roar > 0.05) { const q = J([[1000, 312 + bob]])[0]; p.ell(q[0], q[1], 70, 10, "#B0404E", 0); }
  cel(p, J([[890, 308 + bob], [1150, 312 + bob], [1120, 340 + bob], [930, 346 + bob]]), mul(TER.beak, [0.9, 0.9, 0.9]), light, { d: 4, ow: OW * 0.8 });
  const skull = R(chaikin([[860, 300 + bob], [880, 240 + bob], [960, 215 + bob], [1080, 222 + bob], [1170, 250 + bob], [1210, 300 + bob], [1205, 350 + bob], [1180, 330 + bob], [1150, 302 + bob], [900, 316 + bob]], 2));
  cel(p, skull, TER.beak, light, { d: 8, ow: OW * 0.85, tex: () => {
    p.poly(R([[860, 300 + bob], [880, 240 + bob], [960, 215 + bob], [985, 240 + bob], [960, 300 + bob]]), TER.body, 0);
    p.poly(R([[1170, 250 + bob], [1215, 300 + bob], [1205, 352 + bob], [1170, 300 + bob]]), TER.beakTip, 0);
    p.g.globalAlpha = 0.4; for (let i = 0; i < 4; i++) p.stroke(R([[1000 + i * 40, 240 + bob], [1010 + i * 40, 290 + bob]]), 4, INKB); p.g.globalAlpha = 1;
  } });
  const e = R([[945, 262 + bob]])[0];
  p.poly(R([[905, 238 + bob], [990, 236 + bob], [985, 250 + bob], [915, 254 + bob]]), INKB, 0);
  beastEye(p, e[0], e[1], 0.85, expr, o.blink ?? 0, TER.body, "#F2D23A");
}

// ------------------------------------------------------------------ Meganeura (Carboniferous, ~300 Ma; wingspan ~70 cm)
const MEGN = { body: "#2E4A3A", lit: "#5A8A5E", eye: "#3A6A8A", eyeLit: "#9AD0E8", wing: "rgba(200,220,230,0.32)", vein: "#1E2A28", mouth: "#30080E" };
export function drawMeganeuraB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", ph = 2 * Math.PI * (o.phase ?? 0) * 6, wk = o.walk ?? 0.8;
  const th: P2 = [1000, 500];
  const wing = (dx: number, len: number, a0: number, front: boolean) => {
    const a = a0 + Math.sin(ph + (front ? 0 : 1.2)) * 0.45 * wk, base: P2 = [th[0] + dx, th[1] - 20];
    const tip: P2 = [base[0] - len * 0.35, base[1] - len * Math.cos(a)];
    const pts = chaikin([base, add(lerp2(base, tip, 0.5), 30, 0), tip, add(tip, -50, 20 * Math.sign(Math.cos(a))), add(lerp2(base, tip, 0.5), -60, 6), add(base, -50, 6)], 2);
    p.path(pts, true); p.g.fillStyle = MEGN.wing; p.g.fill();
    p.g.globalAlpha = 0.55; for (let i = 0; i < 6; i++) p.stroke([lerp2(base, add(base, -40, 4), i / 6), lerp2(tip, add(tip, -40, 16), i / 6)], 2.5, MEGN.vein); p.g.globalAlpha = 1;
    p.inkRing(pts, 6, 0, 0.5, INKB);
    p.ell(tip[0] - 20, tip[1] + 6 * Math.sign(Math.cos(a)), 12, 6, "#2A2A2A", 0); // wing spot
  };
  wing(30, 430, 0.2, true); wing(-30, 400, 0.5, false);
  // abdomen: long, segmented
  const ab = curve([950, 515], [700, 520], [260, 540], 16);
  cel(p, tube(ab, 44, 18), MEGN.body, light, { d: 6, tex: () => { for (let i = 1; i < ab.length; i++) { const [x, y] = ab[i]; p.stroke([[x, y - 46], [x, y + 46]], 4, INKB); p.ell(x + 10, y - 14, 14, 6, MEGN.lit, 0); } } });
  cel(p, [[262, 528], [180, 500], [200, 540], [180, 580], [262, 552]], MEGN.body, light, { d: 4, ow: 9 }); // cerci
  // legs: spiny, thrown forward to grab on the attack
  for (let i = 0; i < 3; i++) {
    const b: P2 = [980 + i * 26, 530], kn = add(b, 30 + roar * 80, 70 - roar * 40), ft = add(b, 10 + roar * 220 - i * 20, 150 - roar * 90);
    cel(p, tube([b, kn, ft], 10, 5), MEGN.body, light, { d: 2, ow: 7, rim: false });
    for (let s = 1; s < 4; s++) { const q = lerp2(kn, ft, s / 4); p.stroke([q, add(q, 12, 8)], 3, INKB); }
  }
  cel(p, blob(th[0], th[1], 80, 60, 0, 4), MEGN.body, light, { d: 10, tex: () => { scales(p, 920, 440, 1080, 560, 12, MEGN.lit, 9, 0.4); } });
  // head: huge compound eyes, mandibles open on the attack
  const hx = 1120, hy = 495;
  for (const s of [-1, 1]) {
    const a = rad(25) * roar * s, b: P2 = [hx + 50, hy + 30 + s * 10];
    p.poly(horn(rotAll(curve(b, add(b, 40, s * 10), add(b, 70, -s * 14), 6), a, b), 12), "#1A1210", 3);
  }
  cel(p, blob(hx + 10, hy + 20, 50, 46, 0, 5), MEGN.body, light, { d: 6 });
  cel(p, blob(hx, hy - 10, 66, 60, 0.1, 6), MEGN.eye, light, { d: 10, tex: () => { scales(p, hx - 70, hy - 70, hx + 70, hy + 50, 9, "#0E2030", 7, 0.6); p.ell(hx - 18, hy - 34, 18, 10, MEGN.eyeLit, 0); } });
  if (expr === "shock") p.ell(hx + 10, hy - 10, 12, 12, "#FFFFFF", 3);
  void folds;
}

// ------------------------------------------------------------------ dragons (fantasy): standing (fire on the roar) and flying
export const DRG = { skin: "#3E2A2E", back: "#1E1216", belly: "#9C7A52", scale: "#5A3A3E", mem: "#6E1E1A", memLit: "#B0402A", horn: "#D9C9A6", hornTip: "#1E1612", mouth: "#2A0608", gum: "#8A2030", scar: "#C9A07A" };
export function fire(p: Pen, m: P2, ang: number, len: number, k: number, ph: number) {
  if (k <= 0.02) return;
  const r = rng(Math.floor(ph * 30) + 1), L = len * k;
  const layer = (w: number, l: number, c0: string, c1: string) => {
    const pts: P2[] = [m];
    for (let i = 1; i <= 12; i++) { const u = i / 12, wob = (r() - 0.5) * 30 * u; pts.push([m[0] + Math.cos(ang) * l * u - Math.sin(ang) * (w * u + wob), m[1] + Math.sin(ang) * l * u + Math.cos(ang) * (w * u + wob)]); }
    for (let i = 12; i >= 1; i--) { const u = i / 12, wob = (r() - 0.5) * 30 * u; pts.push([m[0] + Math.cos(ang) * l * u + Math.sin(ang) * (w * u + wob), m[1] + Math.sin(ang) * l * u - Math.cos(ang) * (w * u + wob)]); }
    const g = p.g.createLinearGradient(m[0], m[1], m[0] + Math.cos(ang) * l, m[1] + Math.sin(ang) * l);
    g.addColorStop(0, c0); g.addColorStop(1, c1); p.path(chaikin(pts, 2), true); p.g.fillStyle = g; p.g.fill();
  };
  layer(150, L, "rgba(230,80,20,0.95)", "rgba(120,20,10,0.0)");
  layer(95, L * 0.85, "rgba(255,150,40,0.95)", "rgba(230,70,20,0.2)");
  layer(45, L * 0.6, "rgba(255,245,200,1)", "rgba(255,190,60,0.4)");
  for (let i = 0; i < 18; i++) { const u = r(), s = (r() - 0.5) * 2; p.ell(m[0] + Math.cos(ang) * L * u - Math.sin(ang) * s * 140 * u, m[1] + Math.sin(ang) * L * u + Math.cos(ang) * s * 140 * u, 5, 5, "#FFE08A", 0); }
}
export function dragonHead(p: Pen, o: AnimalPose, H: P2, rotA: number, light: number) {
  const roar = o.roar ?? 0, expr = o.expr ?? "angry", R = (q: P2[]) => rotAll(q.map(([x, y]) => [x + H[0], y + H[1]] as P2), rotA, H);
  const ja = rad(34) * roar, J = (q: P2[]) => rotAll(R(q), ja, R([[0, 20]])[0]);
  // horns behind the skull: two long back-swept, ridged
  for (const [b, c, t, w] of [[[20, -40], [-80, -110], [-200, -110], 26], [[0, -20], [-110, -60], [-210, -20], 20]] as [P2, P2, P2, number][]) {
    const hp = R(curve(b, c, t, 12));
    cel(p, horn(hp, w), DRG.horn, light, { d: 6, ow: OW * 0.8, tex: () => { const tp = hp[hp.length - 1]; p.ell(tp[0], tp[1], w * 3, w * 3, DRG.hornTip, 0); for (let i = 2; i < hp.length - 3; i += 2) p.stroke([add(hp[i], -8, -10), add(hp[i], 8, 10)], 3, INKB); } });
  }
  p.poly([...R([[30, 14], [250, 24]]), ...J([[240, 36], [30, 30]])], DRG.mouth, 0);
  if (roar > 0.05) { p.poly([...R([[40, 16], [240, 26]]), ...J([[230, 34], [40, 30]])].map((q, i, a) => i < 2 ? q : q), DRG.gum, 0); }
  for (let i = 0; i < 8; i++) { const [x, y] = J([[60 + i * 24, 30]])[0]; tooth(p, x, y, 18 + (i % 3) * 8, false, rotA + ja, 0.3); }
  cel(p, J([[20, 26], [240, 32], [220, 62], [120, 74], [40, 64]]), mul(DRG.skin, [0.9, 0.9, 0.92]), light, { d: 8, ow: OW * 0.85, tex: () => scales(p, H[0] - 60, H[1] - 60, H[0] + 300, H[1] + 160, 12, DRG.back, 21, 0.4) });
  for (let i = 0; i < 9; i++) { const [x, y] = R([[50 + i * 22, 20]])[0]; tooth(p, x, y, 22 + ((i * 5) % 3) * 10, true, rotA, 0.26); }
  const skull = R(chaikin([[-40, 0], [-10, -50], [70, -64], [150, -50], [230, -20], [262, 6], [250, 26], [120, 24], [10, 30], [-30, 24]], 2));
  cel(p, skull, DRG.skin, light, { d: 12, tex: () => {
    scales(p, H[0] - 80, H[1] - 120, H[0] + 300, H[1] + 60, 12, DRG.back, 23, 0.5);
    p.poly(R([[60, -60], [150, -46], [120, -30], [60, -36]]), DRG.back, 0);
    p.stroke(R([[120, -40], [190, 10]]), 6, DRG.scar); p.stroke(R([[140, -42], [205, 4]]), 5, DRG.scar);
  } });
  for (const [b, a, l] of [[[200, -28], rad(-120), 40], [[150, -48], rad(-110), 34], [[-20, 20], rad(140), 46], [[10, 34], rad(120), 40]] as [P2, number, number][]) { // brow + cheek spikes
    const q = R([b])[0], a2 = a + rotA; cel(p, horn([q, add(q, Math.cos(a2) * l * 0.5, Math.sin(a2) * l * 0.5), add(q, Math.cos(a2) * l, Math.sin(a2) * l)], 12), DRG.horn, light, { d: 3, ow: 7, rim: false });
  }
  const nq = R([[240, -8]])[0]; p.poly([add(nq, -12, -4), add(nq, 10, -8), add(nq, 4, 6)], INKB, 0);
  if (roar > 0.05) { p.g.globalAlpha = 0.6; p.ell(nq[0] + 20, nq[1] - 10, 30, 14, "#6A5A52", 0); p.g.globalAlpha = 1; } // smoke from the nostril
  const e = R([[90, -26]])[0];
  beastEye(p, e[0], e[1], 1.15, expr, o.blink ?? 0, DRG.skin, "#FFD23A");
  return R([[250, 30]])[0]; // mouth point
}
export function drawDragonB(p: Pen, o: AnimalPose) {
  p.g.save(); p.g.translate(40, GROUND * 0.2); p.g.scale(0.8, 0.8); // 0.8 about the ground line: room for the fire
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, bob = 6 * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
  const wingK = 0.1 + 0.08 * Math.sin(2 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0) - 0.08 * roar; // raised, spread wider on the roar
  memWing(p, { sh: [820, 470 + bob], rear: [560, 540 + bob], span: 560, flapK: wingK, col: mul(DRG.skin, FAR), mem: mul(DRG.mem, FAR), light, fingers: 4, scallop: 0.28, arm: 30, seed: 3 });
  colLeg(p, o, 580, 640 + bob, 0.5, mul(DRG.skin, FAR), light, { r0: 76, r1: 42, toes: 4, toe: 44, bend: 34, tex: DRG.back });
  colLeg(p, o, 900, 650 + bob, 0, mul(DRG.skin, FAR), light, { r0: 60, r1: 38, toes: 4, toe: 44, bend: -14, tex: DRG.back });
  // tail with the spade
  const tl = curve([450, 610 + bob], [260, 680 + bob], [70, 560 + bob + 20 * Math.sin(2 * Math.PI * (o.phase ?? 0))], 18);
  cel(p, tube(tl, 86, 12), DRG.skin, light, { tex: () => scales(p, 40, 450, 500, 760, 18, DRG.back, 5) });
  scutes(p, tl.slice(0, 16).map(([x, y], i) => [x, y - (84 - i * 4.5)] as P2), 40, DRG.back, light, 7);
  const sp = tl[tl.length - 1]; cel(p, [add(sp, 30, 0), add(sp, -20, -60), add(sp, -90, -10), add(sp, -20, 50)], DRG.back, light, { d: 6, ow: 10 });
  const body = chaikin([[420, 610], [480, 500], [650, 450], [850, 440], [960, 500], [985, 600], [900, 690], [620, 705], [470, 680]].map(([x, y]) => [x, y + bob] as P2), 3);
  cel(p, body, DRG.skin, light, { tex: () => {
    p.poly(chaikin([[520, 650], [700, 690], [900, 660], [960, 600], [900, 700], [620, 715]].map(([x, y]) => [x, y + bob] as P2), 2), DRG.belly, 0);
    for (let i = 0; i < 8; i++) p.stroke([[540 + i * 50, 660 + bob], [550 + i * 50, 710 + bob]], 4, mul(DRG.belly, [0.6, 0.5, 0.45]));
    scales(p, 410, 430, 1000, 720, 18, DRG.back, 9, 0.5); scars(p, 690, 500 + bob, DRG.scar, 4, 80);
    folds(p, [[[930, 520 + bob], [960, 580 + bob], [940, 650 + bob]]]);
  } });
  scutes(p, curve([470, 500 + bob], [700, 400 + bob], [920, 470 + bob], 14), 58, DRG.back, light, 11);
  colLeg(p, o, 540, 650 + bob, 0, DRG.skin, light, { r0: 82, r1: 44, toes: 4, toe: 46, bend: 34, tex: DRG.back });
  colLeg(p, o, 860, 660 + bob, 0.5, DRG.skin, light, { r0: 64, r1: 40, toes: 4, toe: 46, bend: -14, tex: DRG.back });
  // neck: S up to the head, lifted back on the roar
  const nb: P2 = [920, 520 + bob], nr = -rad(6) * roar, neckL = rotAll(curve(nb, [1040, 430 + bob], [1060, 330 + bob], 12), nr, nb);
  cel(p, tube(neckL, 96, 62), DRG.skin, light, { tex: () => { scales(p, 860, 230, 1160, 600, 16, DRG.back, 13); for (let i = 2; i < neckL.length - 1; i++) { const [x, y] = neckL[i]; p.stroke([[x + 20, y + 30], [x + 70, y + 30]], 4, mul(DRG.belly, [0.8, 0.7, 0.6])); } } });
  scutes(p, neckL.map(([x, y]) => [x - 50, y - 70] as P2), 36, DRG.back, light, 17);
  const m = dragonHead(p, o, neckL[neckL.length - 1], -rad(10) * roar + rad(8), light);
  memWing(p, { sh: [800, 480 + bob], rear: [560, 560 + bob], span: 600, flapK: wingK, col: DRG.skin, mem: DRG.mem, light, fingers: 4, scallop: 0.28, arm: 34, seed: 5, holes: true });
  fire(p, m, rad(12), 640, roar, o.phase ?? 0);
  p.g.restore();
}
export function drawDragonFlyB(p: Pen, o: AnimalPose) {
  p.g.save(); p.g.translate(40, 520 * 0.2); p.g.scale(0.8, 0.8); // 0.8 about the body line: room for the fire
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, k = flapOf(o, 0.25), ph = 2 * Math.PI * (o.phase ?? 0), bob = 14 * Math.sin(ph) * (o.walk ?? 0);
  memWing(p, { sh: [840, 470 + bob], rear: [560, 530 + bob], span: 560, flapK: k, col: mul(DRG.skin, FAR), mem: mul(DRG.mem, FAR), light, fingers: 4, scallop: 0.28, arm: 30, seed: 3 });
  const tl = curve([470, 540 + bob], [300, 540 + bob - 30 * Math.sin(ph + 1)], [60, 600 + bob], 18);
  cel(p, tube(tl, 74, 10), DRG.skin, light, { tex: () => scales(p, 30, 420, 500, 700, 18, DRG.back, 5) });
  scutes(p, tl.slice(0, 16).map(([x, y], i) => [x, y - (72 - i * 4)] as P2), 34, DRG.back, light, 7);
  const sp = tl[tl.length - 1]; cel(p, [add(sp, 30, 0), add(sp, -20, -56), add(sp, -86, 0), add(sp, -20, 56)], DRG.back, light, { d: 6, ow: 10 });
  // legs tucked, claws hanging
  for (const [x, l] of [[560, 140], [600, 130], [860, 100], [890, 96]] as [number, number][]) {
    const a: P2 = [x, 560 + bob], b = add(a, -60, l * 0.7), c = add(b, -30, l * 0.4);
    cel(p, tube([a, b, c], 34, 16), mul(DRG.skin, [0.85, 0.85, 0.9]), light, { d: 6 });
    for (let i = 0; i < 3; i++) claw(p, c, 34, 1.4 + i * 0.3, 8);
  }
  const body = blob(730, 520 + bob, 270, 100, -0.06, 3, -0.08, 1.8, 2.1);
  cel(p, body, DRG.skin, light, { tex: () => {
    p.poly(blob(760, 590 + bob, 220, 40, -0.06, 5), DRG.belly, 0);
    scales(p, 450, 400, 1010, 640, 18, DRG.back, 9, 0.5); scars(p, 700, 470 + bob, DRG.scar, 4, 70);
  } });
  scutes(p, curve([480, 450 + bob], [720, 400 + bob], [960, 440 + bob], 14), 50, DRG.back, light, 11);
  const neckL = curve([960, 500 + bob], [1060, 470 + bob], [1130, 420 + bob], 10);
  cel(p, tube(neckL, 84, 58), DRG.skin, light, { tex: () => scales(p, 900, 330, 1200, 580, 16, DRG.back, 13) });
  scutes(p, neckL.map(([x, y]) => [x - 30, y - 70] as P2), 30, DRG.back, light, 17);
  const m = dragonHead(p, o, add(neckL[neckL.length - 1], 0, -10), rad(14) + rad(8) * roar, light);
  memWing(p, { sh: [820, 480 + bob], rear: [560, 550 + bob], span: 600, flapK: k, col: DRG.skin, mem: DRG.mem, light, fingers: 4, scallop: 0.28, arm: 34, seed: 5, holes: true });
  fire(p, m, rad(30), 620, roar, o.phase ?? 0);
  p.g.restore();
}

// ------------------------------------------------------------------ registry (x0 / x1 measured with BeastSolo; len in m over that extent)
// pteranodon: skull + crest ~1.8 m (wingspan ~6 m); quetzfly: neck + skull ~5 m (wingspan ~10 m); terror: ~2.5 m tall;
// meganeura: body ~0.4 m (wingspan ~0.7 m); dragons: fantasy, 18 m.
export const BEAST_WINGS = {
  pteranodon: { draw: drawPteranodonB, len: 2.7, x0: 377, x1: 1289, fly: true },
  quetzfly: { draw: drawQuetzFlyB, len: 6.5, x0: 371, x1: 1420, fly: true },
  micro: { draw: drawMicroB, len: 0.8, x0: 60, x1: 1102, fly: true },
  haast: { draw: drawHaastB, len: 1.3, x0: 407, x1: 1166, fly: true },
  terror: { draw: drawTerrorB, len: 3.0, x0: 277, x1: 1217, fly: false },
  meganeura: { draw: drawMeganeuraB, len: 0.4, x0: 179, x1: 1242, fly: true },
  dragon: { draw: drawDragonB, len: 18, x0: 21, x1: 1100, fly: false },
  dragonfly: { draw: drawDragonFlyB, len: 18, x0: 16, x1: 1152, fly: true },
} as const;
