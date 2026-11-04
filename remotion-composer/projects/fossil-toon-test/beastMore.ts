// More "beast" animals (2026-11-04, user: "làm bản hầm hố, làm list các con vật, bản hầm hố nhất"): same look and API
// as beastAnimals.ts (3-tone cel + rim, pebbly scales, folds, scutes, scars, deep sockets with a hot slit iris, uneven
// teeth), side views facing screen right, design space 1600 x 1000, ground at y = 960. Our own drawings.
//   walk + phase = gait, roar = the animal's signature attack move (bite / gape / tail swing / head-down charge),
//   expr = neutral | angry (default) | shock | happy | sleepy, blink 0..1.
// BEAST_ALL = BEAST (beastAnimals.ts) + these; len = real length in m over the x0..x1 design extent (measured).
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { BEAST, INKB, OW, beastEye, cel, chaikin, claw, digiLeg, folds, horn, rng, scales, scutes, tooth } from "./beastAnimals";

type C3 = [number, number, number];
export const FAR: C3 = [0.7, 0.72, 0.82];
const ph0 = (o: AnimalPose) => o.phase ?? 0;
const bobOf = (o: AnimalPose, a: number) => a * Math.cos(4 * Math.PI * ph0(o)) * (o.walk ?? 0);
const offs = (pts: P2[], dx: number, dy: number): P2[] => pts.map(([x, y]) => [x + dx, y + dy] as P2);

/** column leg (quadrupeds): hip/shoulder (x, y) to the ground, knee bent `bend`, claws/hoof nails at the foot */
type LegO = { r0: number; r1: number; bend?: number; toes?: number; toe?: number; tex?: string; seed?: number; nail?: string; reach?: number };
export function colLeg(p: Pen, o: AnimalPose, x: number, y: number, off: number, col: string, light: number, L: LegO) {
  const w = walkOf(o, off), bend = L.bend ?? 18, reach = L.reach ?? 150;
  const fy = GROUND - L.r1 * 0.75 - w.lift;
  const pts = curve([x, y], [x + bend + Math.sin(w.swing) * reach * 0.5, (y + fy) / 2], [x + Math.sin(w.swing) * reach, fy], 10);
  const q = pts[7], r = L.r1 * 0.85;
  cel(p, tube(pts, L.r0, L.r1), col, light, { d: 14, tex: () => {
    if (L.tex) scales(p, x - L.r0 - 80, y, x + L.r0 + 120, GROUND + 30, 20, L.tex, L.seed ?? (x | 0), 0.4);
    folds(p, [[[q[0] - r, q[1] - 6], [q[0], q[1] + 10], [q[0] + r, q[1] - 6]], [[q[0] - r, q[1] + 22], [q[0], q[1] + 38], [q[0] + r, q[1] + 22]]]);
  } });
  const f = pts[pts.length - 1], n = L.toes ?? 3;
  for (let i = 0; i < n; i++) claw(p, [f[0] - L.r1 * 0.55 + (i * L.r1 * 1.3) / Math.max(1, n - 1), f[1] + L.r1 * 0.55], L.toe ?? 24, 0.25, 8);
  return f;
}
/** long hanging hair strands from a line (mammoth style), dark pass then mid pass */
export function hairStrands(p: Pen, line: P2[], len: number, seed: number, cols: string[]) {
  const r = rng(seed);
  cols.forEach((c, k) => { for (const [x, y] of line) { const l = len * (0.7 + r() * 0.5), sw = (r() - 0.5) * 30; p.stroke(curve([x, y], [x + sw * 0.4 - 6, y + l * 0.55], [x + sw - 10, y + l], 6), 13 - k * 5, c); } });
}
/** short fur flicks inside the current clip */
export function furFlicks(p: Pen, x0: number, y0: number, x1: number, y1: number, n: number, seed: number, cols: string[], len = 40, w = 5) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); p.stroke(curve([x, y], [x - 6, y + len * 0.5], [x - 14, y + len], 4), w, cols[i % cols.length]); }
}
export const scars = (p: Pen, x: number, y: number, col: string, n = 3, len = 70, gap = 18) => { for (let i = 0; i < n; i++) p.stroke([[x + i * gap, y], [x + i * gap + len * 0.8, y + len]], 6, col); };

// ------------------------------------------------------------------ Stegosaurus (Late Jurassic, ~9 m)
// two staggered rows of tall plates, 4 tail spikes (thagomizer); roar = tail swing up with the spikes, mouth open hiss
export const STEGB = { skin: "#5B5A39", back: "#30301D", belly: "#A79A6E", plate: "#8E3520", plateEdge: "#24100A", plateLit: "#D9822E", spike: "#DCCDA8", spikeTip: "#1E1612", scar: "#C9B48A" };
export function drawStegB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 5), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const plate = (x: number, y: number, h: number, col: string, seed: number) => {
    const a = rad(-100) - 0.25, s = a + Math.PI / 2, w = h * 0.36, r = rng(seed);
    const at = (k: number, side: number): P2 => [x + Math.cos(a) * h * k + Math.cos(s) * w * side, y + Math.sin(a) * h * k + Math.sin(s) * w * side];
    const pts = chaikin([at(0, -0.35), at(0.42, -1), at(0.8, -0.45), [x + Math.cos(a) * h, y + Math.sin(a) * h], at(0.8, 0.4 + r() * 0.2), at(0.45, 1), at(0, 0.35)], 2);
    cel(p, pts, col, light, { d: 10, ow: 9, tex: () => {
      p.g.globalAlpha = 0.55; for (let i = -2; i <= 2; i++) p.stroke(curve(at(0, i * 0.12), at(0.5, i * 0.45), at(0.95, i * 0.15), 6), 3, STEGB.plateEdge); p.g.globalAlpha = 1;
      p.path(pts, true); p.g.strokeStyle = STEGB.plateEdge; p.g.lineWidth = 16; p.g.stroke();
      p.g.globalAlpha = 0.6; p.ell(at(0.55, -0.3)[0], at(0.55, -0.3)[1], w * 0.25, h * 0.12, STEGB.plateLit, 0); p.g.globalAlpha = 1;
    } });
  };
  const back = curve([440, 480 + bob], [650, 300 + bob], [960, 500 + bob], 14);
  const hs = (i: number) => 40 + 150 * Math.sin((Math.PI * i) / (back.length - 1)) ** 0.8;
  // far legs, far plate row
  colLeg(p, o, 600, 610 + bob, 0.5, mul(STEGB.skin, FAR), light, { r0: 84, r1: 56, toes: 3, tex: STEGB.back });
  colLeg(p, o, 950, 640 + bob, 0, mul(STEGB.skin, FAR), light, { r0: 58, r1: 46, toes: 4, tex: STEGB.back, reach: 120 });
  for (let i = 1; i < back.length - 1; i += 2) plate(back[i][0] + 26, back[i][1] + 8, hs(i) * 0.92, mul(STEGB.plate, FAR), i);
  // tail: thick, swings up on the attack; 4 spikes near the end
  const tb: P2 = [410, 590 + bob], sway = 0.06 * Math.sin(2 * Math.PI * ph0(o)) * (o.walk ?? 0);
  const tailL = rotAll(curve(tb, [290, 560 + bob], [190, 470 + bob], 18), rad(28) * roar + sway, tb);
  for (const [i, a, l] of [[13, -2.3, 170], [16, -2.6, 185], [13, -1.8, 140], [16, -2.05, 160]] as [number, number, number][]) {
    const q = tailL[i], ang = a + rad(28) * roar;
    const sp = curve(q, [q[0] + Math.cos(ang) * l * 0.5, q[1] + Math.sin(ang) * l * 0.5], [q[0] + Math.cos(ang - 0.15) * l, q[1] + Math.sin(ang - 0.15) * l], 8);
    cel(p, horn(sp, 22), STEGB.spike, light, { d: 6, ow: 9, tex: () => { const t = sp[sp.length - 1]; p.ell(t[0], t[1], 34, 34, STEGB.spikeTip, 0); } });
  }
  cel(p, tube(tailL, 86, 12), STEGB.skin, light, { tex: () => { scales(p, 30, 380, 460, 720, 22, STEGB.back, 5); } });
  // body: arched, hips high
  const body = chaikin(offs([[360, 590], [430, 470], [560, 380], [700, 362], [830, 400], [940, 480], [1010, 560], [990, 640], [880, 700], [620, 718], [440, 676]], 0, bob), 3);
  cel(p, body, STEGB.skin, light, { tex: () => {
    p.poly(blob(720, 690 + bob, 260, 60, 0, 6), STEGB.belly, 0);
    scales(p, 350, 350, 1020, 730, 26, STEGB.back, 8, 0.5);
    for (let i = 0; i < 6; i++) p.poly([[470 + i * 80, 420 + bob], [500 + i * 80, 410 + bob], [492 + i * 80, 560 + bob], [478 + i * 80, 540 + bob]], STEGB.back, 0);
    scars(p, 640, 470 + bob, STEGB.scar);
    folds(p, [[[930, 520 + bob], [960, 590 + bob], [940, 660 + bob]], [[560, 640 + bob], [600, 680 + bob], [660, 690 + bob]]]);
  } });
  // near legs, near plate row
  colLeg(p, o, 560, 620 + bob, 0, STEGB.skin, light, { r0: 90, r1: 58, toes: 3, tex: STEGB.back });
  colLeg(p, o, 910, 650 + bob, 0.5, STEGB.skin, light, { r0: 62, r1: 48, toes: 4, tex: STEGB.back, reach: 120 });
  for (let i = 2; i < back.length - 1; i += 2) plate(back[i][0], back[i][1], hs(i), STEGB.plate, i + 50);
  // neck + small low head, throat studs, beak; hiss on the attack
  const neck = curve([960, 560 + bob], [1050, 610 + bob], [1120, 640 + bob], 8);
  cel(p, tube(neck, 76, 46), STEGB.skin, light, { d: 12, tex: () => { scales(p, 900, 500, 1180, 720, 16, STEGB.back, 13); for (let i = 0; i < 6; i++) p.ell(990 + i * 22, 640 + bob + i * 6, 9, 7, STEGB.back, 0); } });
  const hinge: P2 = [1120, 660 + bob], ja = rad(24) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1120, 655 + bob], [1262, 655 + bob], ...J([[1250, 668 + bob], [1120, 672 + bob]])], "#30080E", 0);
  cel(p, J([[1110, 660 + bob], [1250, 664 + bob], [1236, 684 + bob], [1130, 690 + bob]]), mul(STEGB.skin, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.75 });
  const head = chaikin(offs([[1090, 625], [1150, 598], [1220, 610], [1268, 640], [1262, 660], [1140, 668], [1096, 652]], 0, bob), 2);
  cel(p, head, STEGB.skin, light, { d: 10, tex: () => { scales(p, 1080, 590, 1280, 680, 12, STEGB.back, 15); p.poly(offs([[1240, 630], [1270, 645], [1262, 662], [1236, 660]], 0, bob), STEGB.spikeTip, 0); } });
  beastEye(p, 1165, 626 + bob, 0.85, expr, o.blink ?? 0, STEGB.skin, "#FF8A1F");
}

// ------------------------------------------------------------------ Ankylosaurus (Hell Creek, 66 Ma; ~7 m)
// low armoured tank: osteoderm rows, flank spikes, horned wedge head, tail club; roar = club swing up
export const ANKB = { skin: "#5E5440", back: "#2F2A1E", belly: "#9C8C68", osteo: "#7A6A4E", osteoLit: "#B8A27A", spike: "#D6C6A0", spikeTip: "#1E1612", scar: "#C9B48A" };
export function drawAnkyB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 4), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const spike = (q: P2, a: number, l: number, r0: number, col = ANKB.spike) => {
    const sp = curve(q, [q[0] + Math.cos(a) * l * 0.5, q[1] + Math.sin(a) * l * 0.5], [q[0] + Math.cos(a - 0.12) * l, q[1] + Math.sin(a - 0.12) * l], 6);
    cel(p, horn(sp, r0), col, light, { d: 5, ow: 8, rim: false, tex: () => { const t = sp[sp.length - 1]; p.ell(t[0], t[1], l * 0.35, l * 0.35, ANKB.spikeTip, 0); } });
  };
  colLeg(p, o, 580, 690 + bob, 0.5, mul(ANKB.skin, FAR), light, { r0: 64, r1: 50, toes: 3, tex: ANKB.back, reach: 110 });
  colLeg(p, o, 930, 700 + bob, 0, mul(ANKB.skin, FAR), light, { r0: 56, r1: 46, toes: 4, tex: ANKB.back, reach: 110 });
  // tail + club (swings up on the attack)
  const tb: P2 = [430, 640 + bob], sway = 0.08 * Math.sin(2 * Math.PI * ph0(o)) * (o.walk ?? 0);
  const tailL = rotAll(curve(tb, [270, 645 + bob], [140, 610 + bob], 14), rad(32) * roar + sway, tb);
  cel(p, tube(tailL, 74, 28), ANKB.skin, light, { tex: () => scales(p, 60, 480, 480, 780, 20, ANKB.back, 4) });
  tailL.slice(1, 11).forEach((q, i) => { if (i % 2 === 0) spike([q[0], q[1] - (60 - i * 3)], rad(-120), 36, 12); if (i % 2 === 1) spike([q[0], q[1] + (56 - i * 3)], rad(125), 34, 11); });
  const c = tailL[tailL.length - 1];
  for (const [dx, dy, a, b] of [[-30, -20, 46, 40], [-20, 26, 44, 36], [-70, 4, 50, 46]] as [number, number, number, number][]) cel(p, blob(c[0] + dx, c[1] + dy, a, b, 0.3, dx | 0), ANKB.osteo, light, { d: 10, ow: OW * 0.8 });
  // body: low, wide, flat-topped dome
  const body = chaikin(offs([[400, 650], [460, 530], [630, 470], [860, 475], [990, 540], [1030, 640], [960, 726], [700, 744], [470, 724]], 0, bob), 3);
  cel(p, body, ANKB.skin, light, { tex: () => {
    p.poly(blob(720, 730 + bob, 270, 40, 0, 6), ANKB.belly, 0);
    const r = rng(9);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
      const x = 470 + i * 62 + (row % 2) * 30 + (r() - 0.5) * 10, y = 520 + bob + row * 52 + Math.abs(i - 4) * 6;
      p.ell(x, y, 25 - row * 2, 17 - row * 2, ANKB.back, 0); p.ell(x - 2, y - 3, 17 - row * 2, 11 - row * 2, ANKB.osteo, 0); p.ell(x - 6, y - 7, 6, 4, ANKB.osteoLit, 0);
    }
    scars(p, 690, 560 + bob, ANKB.scar);
  } });
  scutes(p, curve([450, 560 + bob], [700, 420 + bob], [1000, 560 + bob], 14), 46, ANKB.osteo, light, 11);
  for (let i = 0; i < 8; i++) { const x = 490 + i * 66; spike([x, 712 + bob - Math.abs(i - 3.5) * 4], rad(118 + i * 5), 58 + (i % 2) * 14, 16); } // flank spikes
  colLeg(p, o, 540, 700 + bob, 0, ANKB.skin, light, { r0: 70, r1: 54, toes: 3, tex: ANKB.back, reach: 110 });
  colLeg(p, o, 900, 706 + bob, 0.5, ANKB.skin, light, { r0: 60, r1: 48, toes: 4, tex: ANKB.back, reach: 110 });
  // head: horned armoured wedge, beak; jaw opens on the attack
  const hinge: P2 = [1030, 640 + bob], ja = rad(20) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1030, 630 + bob], [1190, 640 + bob], ...J([[1180, 652 + bob], [1030, 650 + bob]])], "#30080E", 0);
  cel(p, J([[1020, 640 + bob], [1180, 650 + bob], [1160, 676 + bob], [1050, 682 + bob]]), mul(ANKB.skin, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.75 });
  const head = offs([[985, 560], [1060, 528], [1160, 548], [1205, 600], [1190, 646], [1040, 660], [990, 630]], 0, bob);
  spike([1060, 545 + bob], rad(-150), 64, 18); spike([1040, 650 + bob], rad(150), 56, 16);
  cel(p, head, ANKB.skin, light, { d: 12, tex: () => {
    scales(p, 980, 520, 1210, 670, 14, ANKB.back, 12);
    for (const [x, y] of [[1050, 560], [1100, 556], [1150, 570], [1080, 600]]) { p.ell(x, y + bob, 18, 12, ANKB.back, 0); p.ell(x - 2, y + bob - 2, 12, 8, ANKB.osteo, 0); }
  } });
  p.poly(offs([[1180, 590], [1210, 610], [1196, 646], [1170, 640]], 0, bob), ANKB.spikeTip, 0);
  beastEye(p, 1110, 590 + bob, 0.95, expr, o.blink ?? 0, ANKB.skin, "#FF7A1F");
}

// ------------------------------------------------------------------ sauropod (Brachiosaurus-like, Late Jurassic; ~22 m)
// shoulders high, long front legs, neck up; roar = head up + bellow (jaw open)
export const SAUB = { skin: "#5C6150", back: "#30342A", belly: "#A9A68A", stripe: "#3A3F32", scar: "#C9C0A0", mouth: "#30080E" };
export function drawSauroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 5), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  colLeg(p, o, 540, 640 + bob, 0.5, mul(SAUB.skin, FAR), light, { r0: 96, r1: 70, toes: 3, tex: SAUB.back, bend: 10 });
  colLeg(p, o, 920, 600 + bob, 0, mul(SAUB.skin, FAR), light, { r0: 84, r1: 66, toes: 1, tex: SAUB.back, bend: 6 });
  const tb: P2 = [400, 570 + bob], sway = 0.05 * Math.sin(2 * Math.PI * ph0(o)) * (o.walk ?? 0);
  const tailL = rotAll(curve(tb, [220, 620 + bob], [70, 715 + bob], 18), sway, tb);
  cel(p, tube(tailL, 110, 8), SAUB.skin, light, { tex: () => scales(p, 0, 450, 460, 800, 24, SAUB.back, 4) });
  scutes(p, tailL.slice(0, 15).map(([x, y], i) => [x, y - (108 - i * 7)] as P2), 22, SAUB.back, light, 5);
  // neck: rises from the shoulders, raised a bit more on the bellow
  const nb: P2 = [930, 450 + bob], neckL = rotAll(curve(nb, [1090, 390 + bob], [1170, 210 + bob], 16), -rad(8) * roar, nb);
  cel(p, tube(neckL, 132, 50), SAUB.skin, light, { tex: () => {
    scales(p, 850, 120, 1300, 600, 20, SAUB.back, 13);
    for (let i = 3; i < neckL.length - 2; i += 2) { const [x, y] = neckL[i]; p.stroke(curve([x - 30, y + 30], [x + 5, y + 50], [x + 40, y + 40], 6), 5, INKB); }
  } });
  scutes(p, neckL.slice(1, 15).map(([x, y], i) => [x - 30 + i * 2, y - (125 - i * 5)] as P2), 18, SAUB.back, light, 17);
  const body = chaikin(offs([[360, 580], [450, 440], [640, 370], [860, 340], [960, 390], [1010, 490], [970, 630], [830, 696], [570, 708], [410, 660]], 0, bob), 3);
  cel(p, body, SAUB.skin, light, { tex: () => {
    p.poly(blob(700, 690 + bob, 270, 70, 0, 6), SAUB.belly, 0);
    for (let i = 0; i < 7; i++) p.poly([[470 + i * 70, 420 + bob - i * 6], [500 + i * 70, 414 + bob - i * 6], [494 + i * 70, 560 + bob], [478 + i * 70, 540 + bob]], SAUB.stripe, 0);
    scales(p, 350, 330, 1020, 720, 28, SAUB.back, 8, 0.5);
    scars(p, 620, 470 + bob, SAUB.scar, 4, 90);
    folds(p, [[[940, 470 + bob], [965, 550 + bob], [950, 630 + bob]]]);
  } });
  colLeg(p, o, 500, 650 + bob, 0, SAUB.skin, light, { r0: 104, r1: 74, toes: 3, tex: SAUB.back, bend: 10 });
  colLeg(p, o, 880, 610 + bob, 0.5, SAUB.skin, light, { r0: 90, r1: 70, toes: 1, tex: SAUB.back, bend: 6 });
  // head: boxy with the nasal arch, peg teeth, jaw drops on the bellow
  const H = neckL[neckL.length - 1], hx = H[0], hy = H[1];
  const hinge: P2 = [hx + 10, hy + 22], ja = rad(28) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[hx + 10, hy + 14], [hx + 140, hy + 18], ...J([[hx + 130, hy + 34], [hx + 10, hy + 30]])], SAUB.mouth, 0);
  for (let i = 0; i < 5; i++) tooth(p, hx + 70 + i * 14, hy + 18, 14, true, 0, 0.25);
  cel(p, J([[hx, hy + 22], [hx + 130, hy + 28], [hx + 116, hy + 48], [hx + 20, hy + 52]]), mul(SAUB.skin, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.75 });
  const head = chaikin([[hx - 30, hy + 10], [hx - 10, hy - 30], [hx + 40, hy - 60], [hx + 80, hy - 52], [hx + 110, hy - 20], [hx + 150, hy + 4], [hx + 140, hy + 24], [hx + 20, hy + 32]], 2);
  cel(p, head, SAUB.skin, light, { d: 10, tex: () => { scales(p, hx - 40, hy - 70, hx + 160, hy + 40, 12, SAUB.back, 21); p.poly([[hx + 40, hy - 54], [hx + 76, hy - 50], [hx + 60, hy - 30]], INKB, 0); } });
  beastEye(p, hx + 20, hy - 12, 0.9, expr, o.blink ?? 0, SAUB.skin, "#FF7A1F");
}

// ------------------------------------------------------------------ Edmontosaurus (Hell Creek, 66 Ma; ~12 m)
// duck-billed, fleshy red comb, stiff tail with a healed T. rex bite (real: DMNH 1493); roar = head up + bellow
export const EDMB = { skin: "#5D6346", back: "#2F3424", belly: "#B0A57E", stripe: "#3A4030", comb: "#9E2A1C", bill: "#2A2018", scar: "#D8C49A", mouth: "#30080E" };
export function drawEdmoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string, s: number) => {
    const L = digiLeg(hip, s, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 10, (L[1][1] + L[2][1]) / 2], L[2], 8), 64 * s, 42 * s), col, light, { d: 12 });
    cel(p, tube([L[2], L[3]], 42 * s, 32 * s), col, light, { d: 8 });
    for (let i = 0; i < 3; i++) p.ell(L[3][0] + 18 + i * 22 * s, L[3][1] + 16, 16, 11, EDMB.bill, 3); // hoof-like nails
    cel(p, rotAll(blob(hip[0] + 30, hip[1] + 40, 112 * s, 130 * s, 0.45, 9, -0.3, 1.7, 2.0), w.swing * 0.6, hip), col, light, { tex: () => scales(p, hip[0] - 100, hip[1] - 60, hip[0] + 140, hip[1] + 200, 22, EDMB.back, 3, 0.3) });
  };
  leg([620, 520 + bob], far, mul(EDMB.skin, FAR), 0.92);
  colLeg(p, o, 900, 600 + bob, 0, mul(EDMB.skin, FAR), light, { r0: 46, r1: 28, toes: 3, toe: 16, bend: 26, reach: 110 });
  // tail: stiff (ossified tendons), the healed bite
  const tb: P2 = [520, 500 + bob], sway = 0.05 * Math.sin(4 * Math.PI * ph0(o)) * (o.walk ?? 0);
  const tailL = rotAll(curve(tb, [320, 470 + bob], [40, 500 + bob], 16), sway, tb);
  cel(p, tube(tailL, 104, 8), EDMB.skin, light, { tex: () => {
    scales(p, 20, 340, 560, 640, 22, EDMB.back, 5);
    p.g.globalAlpha = 0.35; for (let i = 0; i < 14; i++) p.stroke([[60 + i * 34, 470 + bob], [90 + i * 34, 520 + bob]], 3, INKB); p.g.globalAlpha = 1;
    const q = tailL[6]; p.ell(q[0], q[1] - 60, 50, 18, mul(EDMB.skin, [0.6, 0.55, 0.55]), 0); for (let i = 0; i < 5; i++) p.stroke([[q[0] - 40 + i * 20, q[1] - 74], [q[0] - 34 + i * 20, q[1] - 48]], 5, EDMB.scar);
  } });
  scutes(p, tailL.slice(0, 13).map(([x, y], i) => [x, y - (102 - i * 7)] as P2), 20, EDMB.back, light, 7);
  const body = blob(740, 520 + bob, 270, 160, -0.08, 3, -0.1, 1.7, 2.1);
  cel(p, body, EDMB.skin, light, { tex: () => {
    p.poly(blob(800, 640 + bob, 230, 70, -0.15, 5), EDMB.belly, 0);
    for (let i = 0; i < 7; i++) p.poly([[540 + i * 56, 380 + bob], [570 + i * 56, 378 + bob], [562 + i * 56, 500 + bob], [548 + i * 56, 486 + bob]], EDMB.stripe, 0);
    scales(p, 460, 350, 1010, 690, 22, EDMB.back, 9);
    scars(p, 700, 440 + bob, EDMB.scar);
  } });
  scutes(p, curve([500, 390 + bob], [700, 340 + bob], [930, 380 + bob], 12), 24, EDMB.back, light, 11);
  leg([660, 530 + bob], near, EDMB.skin, 1.0);
  colLeg(p, o, 870, 610 + bob, 0.5, EDMB.skin, light, { r0: 48, r1: 30, toes: 3, toe: 16, bend: 26, reach: 110 });
  // neck + head (raised on the bellow)
  const nb: P2 = [930, 470 + bob], hr = -rad(14) * roar, R = (q: P2[]) => rotAll(q, hr, nb);
  cel(p, tube(R(curve(nb, [1000, 420 + bob], [1060, 400 + bob], 8)), 86, 62), EDMB.skin, light, { tex: () => { scales(p, 880, 330, 1120, 540, 18, EDMB.back, 13); folds(p, [[[980, 470 + bob], [1010, 490 + bob], [1040, 470 + bob]]]); } });
  const hinge = R([[1090, 432 + bob]])[0], ja = rad(26) * roar, J = (q: P2[]) => rotAll(R(q), ja, hinge);
  p.poly([...R([[1090, 425 + bob], [1330, 418 + bob]]), ...J([[1320, 432 + bob], [1090, 440 + bob]])], EDMB.mouth, 0);
  cel(p, J([[1080, 432 + bob], [1320, 432 + bob], [1300, 456 + bob], [1110, 470 + bob]]), mul(EDMB.skin, [0.9, 0.9, 0.92]), light, { d: 8, ow: OW * 0.8, tex: () => p.poly(J([[1250, 430 + bob], [1320, 432 + bob], [1300, 456 + bob], [1250, 458 + bob]]), EDMB.bill, 0) });
  cel(p, R([[1090, 352 + bob], [1110, 318 + bob], [1150, 306 + bob], [1190, 320 + bob], [1170, 352 + bob]]), EDMB.comb, light, { d: 8, ow: OW * 0.8 });
  const head = R(chaikin(offs([[1040, 380], [1100, 345], [1190, 350], [1300, 380], [1345, 408], [1330, 428], [1220, 432], [1090, 436], [1040, 418]], 0, bob), 2));
  cel(p, head, EDMB.skin, light, { d: 12, tex: () => {
    scales(p, 1030, 320, 1350, 450, 14, EDMB.back, 21);
    p.poly(R(offs([[1250, 378], [1345, 406], [1332, 430], [1240, 432]], 0, bob)), EDMB.bill, 0);
    p.g.globalAlpha = 0.5; p.poly(R(offs([[1200, 370], [1260, 382], [1230, 400], [1196, 398]], 0, bob)), INKB, 0); p.g.globalAlpha = 1;
  } });
  const [ex, ey] = R([[1130, 378 + bob]])[0];
  beastEye(p, ex, ey, 1.0, expr, o.blink ?? 0, EDMB.skin, "#FF8A1F");
}

// ------------------------------------------------------------------ Pachycephalosaurus (Hell Creek, 66 Ma; ~4.5 m)
// thick bony dome ringed with knobs and spikes; roar = head-down ram charge
export const PACB = { skin: "#6A5236", back: "#33261A", belly: "#B39A70", dome: "#B79A6E", domeDark: "#5E4A30", knob: "#E0CFA6", stripe: "#3E2C1C", scar: "#D8C49A", mouth: "#30080E" };
export function drawPachyB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 8), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.66, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 8, (L[1][1] + L[2][1]) / 2], L[2], 8), 34, 22), col, light, { d: 8 });
    cel(p, tube([L[2], L[3]], 22, 16), col, light, { d: 6 });
    for (let i = 0; i < 3; i++) claw(p, [L[3][0] + 12 + i * 14, L[3][1] + 6], 26, 0.25, 7);
    cel(p, rotAll(blob(hip[0] + 18, hip[1] + 30, 76, 96, 0.4, 9, -0.2, 1.7, 2.0), w.swing * 0.6, hip), col, light, { d: 12 });
  };
  leg([640, 630 + bob], far, mul(PACB.skin, FAR));
  const tailL = curve([560, 600 + bob], [380, 580 + bob], [150, 580 + bob + 14 * Math.sin(4 * Math.PI * ph0(o))], 14);
  cel(p, tube(tailL, 62, 8), PACB.skin, light, { d: 12, tex: () => scales(p, 140, 500, 600, 680, 16, PACB.back, 5) });
  scutes(p, tailL.slice(0, 11).map(([x, y], i) => [x, y - (60 - i * 4)] as P2), 16, PACB.back, light, 5);
  const body = blob(710, 600 + bob, 180, 110, -0.12, 3, -0.12, 1.7, 2.1);
  cel(p, body, PACB.skin, light, { d: 16, tex: () => {
    p.poly(blob(760, 670 + bob, 150, 46, -0.15, 5), PACB.belly, 0);
    for (let i = 0; i < 5; i++) p.poly([[580 + i * 50, 510 + bob], [604 + i * 50, 506 + bob], [598 + i * 50, 600 + bob], [586 + i * 50, 590 + bob]], PACB.stripe, 0);
    scales(p, 520, 480, 900, 720, 14, PACB.back, 7, 0.5); scars(p, 700, 540 + bob, PACB.scar, 3, 50, 14);
  } });
  scutes(p, curve([560, 520 + bob], [700, 480 + bob], [840, 510 + bob], 10), 24, PACB.back, light, 9);
  leg([690, 640 + bob], near, PACB.skin);
  // arm
  const arm = curve([840, 620 + bob], [880, 650 + bob], [905, 640 + bob], 6);
  cel(p, tube(arm, 16, 11), PACB.skin, light, { d: 6, ow: OW * 0.7 });
  claw(p, arm[arm.length - 1], 20, 0.8, 6);
  // neck + head: rotate down about the shoulder for the ram
  const sh: P2 = [820, 580 + bob], hr = rad(38) * roar, R = (q: P2[]) => rotAll(q, hr, sh);
  cel(p, tube(R(curve(sh, [870, 520 + bob], [910, 480 + bob], 8)), 56, 46), PACB.skin, light, { d: 10, tex: () => scales(p, 780, 400, 980, 640, 12, PACB.back, 13) });
  const muzzle = R(chaikin(offs([[900, 470], [970, 450], [1050, 470], [1080, 500], [1050, 520], [950, 522], [905, 505]], 0, bob), 2));
  cel(p, muzzle, PACB.skin, light, { d: 10, tex: () => scales(p, 880, 420, 1100, 540, 10, PACB.back, 15) });
  p.stroke(R(curve([960, 506 + bob], [1010, 512 + bob], [1060, 500 + bob], 6)), 5, INKB);
  for (let i = 0; i < 4; i++) { const [tx, ty] = R([[990 + i * 18, 508 + bob]])[0]; tooth(p, tx, ty, 10, true, hr, 0.3); }
  // dome + knob ring
  const dc = R([[950, 430 + bob]])[0];
  for (let i = 0; i < 9; i++) {
    const a = rad(110 + i * 22) + hr, bx = dc[0] + Math.cos(a) * 92, by = dc[1] + Math.sin(a) * 74, L = 22 + (i % 3) * 12;
    cel(p, horn([[bx, by], [bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5], [bx + Math.cos(a) * L, by + Math.sin(a) * L]], 12), PACB.knob, light, { d: 4, ow: 7, rim: false });
  }
  const dome = rotAll(blob(950, 430 + bob, 96, 82, 0.15, 21, 0.2, 1.8, 2.4), hr, sh);
  cel(p, dome, PACB.dome, light, { d: 16, tex: () => {
    p.g.globalAlpha = 0.5; for (let i = 0; i < 6; i++) p.stroke(R([[880 + i * 26, 370 + bob], [900 + i * 24, 470 + bob]]), 4, PACB.domeDark); p.g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) p.stroke(R([[930 + i * 14, 368 + bob], [960 + i * 14, 410 + bob]]), 5, "#F2E6C8"); // battle chips
  } });
  const [ex, ey] = R([[985, 470 + bob]])[0];
  beastEye(p, ex, ey, 0.8, expr, o.blink ?? 0, PACB.skin, "#FF6A1F");
}

// ------------------------------------------------------------------ Spinosaurus (mid Cretaceous, ~95 Ma; ~14 m)
// huge sail of spines, paddle tail, crocodile snout, short legs, big thumb claws; roar = jaws open
export const SPIB = { skin: "#4A5848", back: "#232C24", belly: "#B9B194", sail: "#8E2A1E", sailDark: "#3A120C", sailLit: "#D9682E", stripe: "#2A3328", scar: "#C9C0A0", mouth: "#30080E" };
export function drawSpinoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.72, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 8, (L[1][1] + L[2][1]) / 2], L[2], 8), 50, 34), col, light, { d: 10 });
    cel(p, tube([L[2], L[3]], 34, 26), col, light, { d: 8 });
    for (let i = 0; i < 3; i++) claw(p, [L[3][0] + 12 + i * 18, L[3][1] + 6], 34, 0.2, 9);
    cel(p, rotAll(blob(hip[0] + 24, hip[1] + 30, 92, 100, 0.4, 9, -0.2, 1.7, 2.0), w.swing * 0.6, hip), col, light, { d: 14 });
  };
  leg([640, 640 + bob], far, mul(SPIB.skin, FAR));
  // paddle tail: tall fin above and below
  const tw = 0.08 * Math.sin(2 * Math.PI * ph0(o)) * (0.4 + (o.walk ?? 0));
  const tb: P2 = [500, 590 + bob], tailL = rotAll(curve(tb, [300, 570 + bob], [40, 610 + bob], 16), tw, tb);
  const fin: P2[] = [...tailL.slice(4).map(([x, y], i) => [x, y - 40 - 70 * Math.sin((Math.PI * (i + 1)) / 14)] as P2), ...tailL.slice(4).reverse().map(([x, y], i) => [x, y + 36 + 40 * Math.sin((Math.PI * (i + 1)) / 14)] as P2)];
  const finP = chaikin(fin, 2);
  cel(p, finP, mul(SPIB.skin, [0.8, 0.8, 0.85]), light, { d: 10, tex: () => { p.path(finP, true); p.g.strokeStyle = SPIB.sail; p.g.lineWidth = 30; p.g.stroke(); p.g.globalAlpha = 0.6; tailL.slice(4).forEach(([x, y]) => p.stroke([[x, y - 120], [x, y + 90]], 4, SPIB.back)); p.g.globalAlpha = 1; } });
  cel(p, tube(tailL, 82, 14), SPIB.skin, light, { tex: () => scales(p, 20, 450, 540, 720, 20, SPIB.back, 5) });
  // sail: spines along the back, membrane between, ragged top
  const backL = curve([480, 520 + bob], [720, 470 + bob], [960, 500 + bob], 16), r = rng(31);
  const tops = backL.map(([x, y], i) => { const k = Math.sin((Math.PI * i) / (backL.length - 1)); return [x + 10, y - 60 - 300 * k ** 0.9 + (r() - 0.5) * 18] as P2; });
  const sail = [...backL.map(([x, y]) => [x, y + 30] as P2).reverse(), ...tops.map(([x, y], i) => [x, y + (i % 2) * 14] as P2)];
  cel(p, sail, SPIB.sail, light, { d: 18, tex: () => {
    p.poly(chaikin([...tops.map(([x, y]) => [x, y + 40] as P2), ...tops.slice().reverse().map(([x, y]) => [x, y + 110] as P2)], 1), SPIB.sailLit, 0);
    tops.forEach((t, i) => p.stroke([backL[i], t], 6, SPIB.sailDark));
    p.g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) p.ell(600 + i * 90, 300 + bob + Math.abs(i - 1.5) * 30, 24, 16, SPIB.sailDark, 0); p.g.globalAlpha = 1;
  } });
  const body = blob(730, 590 + bob, 300, 125, -0.06, 3, -0.08, 1.7, 2.1);
  cel(p, body, SPIB.skin, light, { tex: () => {
    p.poly(blob(780, 680 + bob, 250, 55, -0.08, 5), SPIB.belly, 0);
    for (let i = 0; i < 8; i++) p.poly([[480 + i * 62, 490 + bob], [508 + i * 62, 488 + bob], [500 + i * 62, 600 + bob], [486 + i * 62, 586 + bob]], SPIB.stripe, 0);
    scales(p, 420, 460, 1040, 720, 20, SPIB.back, 9); scars(p, 760, 520 + bob, SPIB.scar);
  } });
  leg([690, 650 + bob], near, SPIB.skin);
  // arm with the hooked thumb claw
  const arm = curve([960, 640 + bob], [1010, 690 + bob], [1050, 700 + bob - 30 * roar], 6);
  cel(p, tube(arm, 30, 20), SPIB.skin, light, { d: 8 });
  const h = arm[arm.length - 1]; claw(p, h, 60, 0.6, 12); claw(p, [h[0] - 6, h[1] + 8], 40, 1.0, 9);
  // neck + long croc snout
  cel(p, tube(curve([960, 560 + bob], [1030, 500 + bob], [1090, 470 + bob], 8), 76, 54), SPIB.skin, light, { tex: () => scales(p, 900, 400, 1140, 640, 16, SPIB.back, 13) });
  const hinge: P2 = [1090, 470 + bob], ja = rad(32) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1090, 462 + bob], [1400, 448 + bob], ...J([[1395, 466 + bob], [1090, 476 + bob]])], SPIB.mouth, 0);
  for (let i = 0; i < 12; i++) { const [tx, ty] = J([[1120 + i * 23, 470 + bob - i * 0.4]])[0]; tooth(p, tx, ty, 16 + (i % 3) * 6, false, ja, 0.25); }
  cel(p, J([[1080, 470 + bob], [1395, 462 + bob], [1380, 486 + bob], [1110, 500 + bob]]), mul(SPIB.skin, [0.9, 0.9, 0.92]), light, { d: 8, ow: OW * 0.8, tex: () => scales(p, 1080, 450, 1400, 510, 10, SPIB.back, 17) });
  for (let i = 0; i < 13; i++) tooth(p, 1110 + i * 22, 462 + bob - i * 0.5, 20 + ((i * 7) % 3) * 7, true, 0, 0.24);
  const skull = chaikin(offs([[1060, 430], [1110, 398], [1170, 392], [1200, 384], [1230, 400], [1380, 430], [1410, 446], [1400, 462], [1100, 470]], 0, bob), 2);
  cel(p, skull, SPIB.skin, light, { d: 12, tex: () => { scales(p, 1050, 370, 1420, 480, 12, SPIB.back, 19); p.poly(offs([[1170, 392], [1200, 380], [1232, 400], [1196, 404]], 0, bob), SPIB.back, 0); p.stroke(offs([[1260, 420], [1330, 446]], 0, bob), 5, SPIB.scar); } });
  p.poly(offs([[1205, 410], [1222, 406], [1218, 416]], 0, bob), INKB, 0);
  beastEye(p, 1130, 418 + bob, 1.0, expr, o.blink ?? 0, SPIB.skin, "#E8FF4A");
}

// ------------------------------------------------------------------ Quetzalcoatlus (Hell Creek age, 68-66 Ma; wingspan ~10 m)
// standing like a giraffe-stork on folded wings, huge beak, crest; roar = beak gape + head thrust
export const QUEB = { skin: "#4C4A44", fuzz: "#6A5E50", belly: "#B8AE98", membrane: "#8A4630", beak: "#C9B98E", beakDark: "#3A3020", crest: "#A8321E", scar: "#D8C49A" };
export function drawQuetzB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  // far limbs
  colLeg(p, o, 560, 560 + bob, 0.5, mul(QUEB.skin, FAR), light, { r0: 24, r1: 15, toes: 3, toe: 16, bend: 30, reach: 120 });
  const wing = (sh: P2, off: number, col: string, mem: string) => {
    const w = walkOf(o, off), hand: P2 = [sh[0] + 110 + Math.sin(w.swing) * 140, GROUND - 14 - w.lift];
    const elbow: P2 = [sh[0] + 70, sh[1] + 140], wrist: P2 = [hand[0] - 20, hand[1] - 190];
    const finger = curve(wrist, [wrist[0] - 60, wrist[1] - 300], [wrist[0] - 330, wrist[1] - 400], 10);
    const tip = finger[finger.length - 1];
    cel(p, chaikin([sh, elbow, wrist, finger[5], tip, [sh[0] - 70, sh[1] - 90], [sh[0] - 40, sh[1] - 10]], 2), mem, light, { d: 6, ow: 9, tex: () => {
      p.g.globalAlpha = 0.45; for (let i = 1; i < 4; i++) p.stroke(curve(sh, [sh[0] + 20 * i - 40, sh[1] + 60], finger[2 + i * 2], 6), 4, INKB); p.g.globalAlpha = 1; } }); // folded membrane
    cel(p, tube(finger, 22, 7), col, light, { d: 4, ow: 9 });
    cel(p, tube(curve(sh, elbow, wrist, 8), 34, 22), col, light, { d: 8 });
    cel(p, tube([wrist, hand], 20, 14), col, light, { d: 6 });
    for (let i = 0; i < 3; i++) claw(p, [wrist[0] + 6, wrist[1] + 8 + i * 12], 22, 0.6, 6);
  };
  wing([690, 450 + bob], 0, mul(QUEB.skin, FAR), mul(QUEB.membrane, FAR));
  // body (small, fuzzy)
  const body = blob(620, 470 + bob, 135, 100, -0.3, 3, -0.1, 1.8, 2.1);
  cel(p, body, QUEB.fuzz, light, { d: 14, tex: () => { furFlicks(p, 500, 380, 740, 560, 60, 3, [QUEB.skin, "#8A7A66"], 22, 4); p.poly(blob(650, 520 + bob, 80, 30, -0.3, 5), QUEB.belly, 0); } });
  colLeg(p, o, 600, 560 + bob, 0, QUEB.skin, light, { r0: 26, r1: 16, toes: 3, toe: 16, bend: 30, reach: 120 });
  wing([700, 460 + bob], 0.5, QUEB.skin, QUEB.membrane);
  // neck: long, stiff; thrusts forward on the attack
  const nb: P2 = [700, 420 + bob], hr = rad(26) * roar, R = (q: P2[]) => rotAll(q, hr, nb);
  const neckL = R(curve(nb, [760, 260 + bob], [830, 170 + bob], 12));
  cel(p, tube(neckL, 44, 30), QUEB.skin, light, { d: 8, tex: () => { furFlicks(p, 660, 120, 880, 450, 40, 7, [QUEB.fuzz], 18, 4); folds(p, [[[740, 300 + bob], [760, 310 + bob], [780, 300 + bob]]]); } });
  // head: crest + enormous beak, opens wide
  const H = neckL[neckL.length - 1], hx = H[0], hy = H[1];
  const T = (q: P2[]) => rotAll(q, hr * 0.6, [hx, hy]);
  const up = rad(-6) * roar, dn = rad(17) * roar;
  cel(p, T([[hx - 30, hy - 10], [hx - 10, hy - 90], [hx + 30, hy - 130], [hx + 40, hy - 40]]), QUEB.crest, light, { d: 8, ow: OW * 0.8 });
  p.poly(T([[hx + 10, hy + 10], ...rotAll([[hx + 200, hy + 62], [hx + 430, hy + 122]], up, [hx + 10, hy]), ...rotAll([[hx + 410, hy + 132], [hx + 200, hy + 74]], dn, [hx + 10, hy + 10]), [hx + 10, hy + 30]]), "#30080E", 0);
  if (roar > 0.05) { p.g.globalAlpha = 0.8; p.ell(...T(rotAll([[hx + 130, hy + 70]], dn * 0.5, [hx + 10, hy + 10]))[0], 70, 12, "#B0404E", 0); p.g.globalAlpha = 1; } // tongue
  const lower = T(rotAll(chaikin([[hx - 20, hy + 20], [hx + 200, hy + 66], [hx + 410, hy + 126], [hx + 400, hy + 140], [hx + 190, hy + 100], [hx + 10, hy + 56]], 2), dn, [hx + 10, hy + 10]));
  cel(p, lower, mul(QUEB.beak, [0.9, 0.9, 0.9]), light, { d: 3, ow: OW * 0.8, tex: () => scales(p, hx - 30, hy, hx + 430, hy + 300, 10, QUEB.beakDark, 61, 0.2) });
  const upper = T(rotAll(chaikin([[hx - 40, hy - 20], [hx + 10, hy - 40], [hx + 120, hy - 10], [hx + 300, hy + 60], [hx + 440, hy + 118], [hx + 420, hy + 124], [hx + 200, hy + 60], [hx + 20, hy + 30], [hx - 30, hy + 20]], 2), up, [hx + 10, hy]));
  cel(p, upper, QUEB.beak, light, { d: 5, tex: () => {
    p.poly(T(rotAll([[hx - 40, hy - 20], [hx + 60, hy - 30], [hx + 40, hy + 20], [hx - 30, hy + 20]], up, [hx + 10, hy])), QUEB.skin, 0);
    p.g.globalAlpha = 0.45; for (let i = 0; i < 6; i++) p.stroke(T(rotAll([[hx + 120 + i * 50, hy + 4 + i * 18], [hx + 150 + i * 50, hy + 30 + i * 18]], up, [hx + 10, hy])), 4, QUEB.beakDark); p.g.globalAlpha = 1;
    p.stroke(T(rotAll([[hx + 200, hy + 30], [hx + 280, hy + 70]], up, [hx + 10, hy])), 5, QUEB.scar);
  } });
  const [ex, ey] = T(rotAll([[hx + 10, hy - 6]], up, [hx + 10, hy]))[0];
  beastEye(p, ex, ey, 0.8, expr, o.blink ?? 0, QUEB.skin, "#FFB21F");
}

// ------------------------------------------------------------------ Mosasaurus (Late Cretaceous seas, ~13 m)
// swimming right, countershaded, shark-like down-turned tail fluke, 4 flippers, two rows of teeth; roar = gape
export const MOSB = { top: "#2E3A40", side: "#56656A", belly: "#D6D4C6", fin: "#232C30", gum: "#8A2C38", mouth: "#22090E", scar: "#C9CED0" };
export function drawMosaB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * ph0(o), sweep = Math.sin(ph) * 0.12 * (o.walk ?? 0.6);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const stock: P2 = [300, cy + 10];
  cel(p, rotAll([[330, cy], [190, cy - 120], [215, cy - 10], [200, cy + 30], [70, cy + 230], [330, cy + 50]] as P2[], sweep, stock), MOSB.fin, light, { d: 10 });
  const flip = (x: number, y: number, a: number, col: string) => cel(p, rotAll([[x, y], [x - 70, y + 150], [x - 130, y + 170], [x - 60, y + 40]] as P2[], a, [x, y]), col, light, { d: 8, rim: false });
  flip(1010, cy + 70, -0.2 + sweep, mul(MOSB.fin, FAR)); flip(640, cy + 80, -0.1 - sweep, mul(MOSB.fin, FAR));
  const body = chaikin(rotAll([[300, cy - 10], [450, cy - 70], [700, cy - 125], [950, cy - 130], [1150, cy - 100], [1300, cy - 70], [1460, cy - 20], [1470, cy + 20],
    [1300, cy + 60], [1100, cy + 110], [850, cy + 125], [600, cy + 100], [420, cy + 60], [310, cy + 30]] as P2[], sweep * 0.25, [850, cy]), 3);
  cel(p, body, MOSB.side, light, { d: 28, tex: () => {
    p.poly(chaikin([[300, cy + 20], [700, cy + 40], [1100, cy + 30], [1450, cy + 10], [1300, cy + 150], [700, cy + 180], [300, cy + 60]], 2), MOSB.belly, 0);
    p.poly(chaikin([[320, cy - 20], [700, cy - 160], [1250, cy - 110], [1300, cy - 40], [900, cy - 50], [500, cy - 30]], 2), MOSB.top, 0);
    scales(p, 300, cy - 160, 1480, cy + 160, 12, MOSB.top, 33, 0.35);
    scars(p, 800, cy - 90, MOSB.scar, 3, 70); scars(p, 1050, cy - 60, MOSB.scar, 2, 50);
  } });
  scutes(p, curve([400, cy - 60], [800, cy - 170], [1200, cy - 110], 16), 18, MOSB.top, light, 35); // low dorsal ridge
  flip(980, cy + 80, 0.15 - sweep, MOSB.fin); flip(610, cy + 90, 0.2 + sweep, MOSB.fin);
  // jaw: lower jaw drops; palatal (pterygoid) teeth show in the open mouth
  const hinge: P2 = [1170, cy + 20], ja = rad(36) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  if (roar > 0.05) {
    p.poly([[1170, cy], [1475, cy], ...J([[1460, cy + 26], [1170, cy + 30]])], MOSB.mouth, 0);
    p.poly([[1190, cy + 4], [1470, cy + 2], [1460, cy + 18], [1200, cy + 22]], MOSB.gum, 0);
    for (let i = 0; i < 6; i++) tooth(p, 1200 + i * 26, cy + 24, 14, true, 0, 0.3); // the second row
    for (let i = 0; i < 11; i++) tooth(p, 1200 + i * 25, cy + 4, 26 + (i % 3) * 6, true, 0, 0.3);
    for (let i = 0; i < 10; i++) { const [tx, ty] = J([[1200 + i * 26, cy + 30]])[0]; tooth(p, tx, ty, 24 + (i % 2) * 8, false, ja, 0.3); }
    cel(p, J([[1170, cy + 30], [1460, cy + 26], [1430, cy + 80], [1180, cy + 100]]), MOSB.belly, light, { d: 10 });
  } else {
    p.stroke(curve([1180, cy + 30], [1330, cy + 36], [1468, cy + 12], 8), 7, INKB);
    for (let i = 0; i < 8; i++) tooth(p, 1220 + i * 30, cy + 34 - i * 2.5, 18, true, 0, 0.3);
  }
  p.poly([[1440, cy - 30], [1456, cy - 34], [1452, cy - 24]], INKB, 0);
  beastEye(p, 1250, cy - 52, 1.2, expr, o.blink ?? 0, MOSB.top, "#F2D23A");
}

// ------------------------------------------------------------------ Dunkleosteus (Late Devonian, ~372 Ma; ~3.5 m, 2023 estimate)
// armoured head shield with plate seams, self-sharpening bony blades instead of teeth; roar = gape
export const DUNB = { armor: "#6E6450", armorDark: "#3A3428", armorLit: "#A89A7A", body: "#45505A", belly: "#C6C8BE", fin: "#2A3238", mouth: "#1E0A0C", blade: "#E6DCC0" };
export function drawDunkB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * ph0(o), sweep = Math.sin(ph) * 0.16 * (o.walk ?? 0.6);
  const roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const stock: P2 = [250, cy];
  cel(p, rotAll([[280, cy - 10], [120, cy - 200], [170, cy - 20], [180, cy + 20], [130, cy + 150], [280, cy + 20]] as P2[], sweep, stock), DUNB.fin, light, { d: 10 });
  cel(p, [[860, cy + 110], [700, cy + 230], [670, cy + 210], [800, cy + 100]], mul(DUNB.fin, FAR), light, { d: 8, rim: false });
  const body = chaikin(rotAll([[250, cy - 10], [400, cy - 90], [650, cy - 150], [900, cy - 170], [920, cy + 150], [650, cy + 140], [400, cy + 70], [260, cy + 20]] as P2[], sweep * 0.3, [800, cy]), 3);
  cel(p, body, DUNB.body, light, { d: 26, tex: () => { p.poly(chaikin([[260, cy + 10], [600, cy + 50], [920, cy + 60], [920, cy + 170], [600, cy + 160], [280, cy + 40]], 2), DUNB.belly, 0); scales(p, 250, cy - 180, 940, cy + 180, 12, DUNB.fin, 41, 0.25); } });
  cel(p, [[600, cy - 140], [680, cy - 300], [720, cy - 290], [760, cy - 150]], DUNB.fin, light, { d: 8 });
  // head shield: the jaw (lower blade) drops about the hinge, the whole skull tips up a little
  const hinge: P2 = [1030, cy + 40], ja = rad(40) * roar, sa = -rad(10) * roar, J = (q: P2[]) => rotAll(q, ja, hinge), S = (q: P2[]) => rotAll(q, sa, hinge);
  p.poly([...S([[1040, cy + 20], [1330, cy + 40]]), ...J([[1320, cy + 60], [1040, cy + 60]])], DUNB.mouth, 0);
  const lowJ = J([[1000, cy + 50], [1300, cy + 54], [1340, cy + 30], [1330, cy + 80], [1280, cy + 140], [1050, cy + 150], [960, cy + 120]]);
  cel(p, lowJ, DUNB.armor, light, { d: 10, tex: () => { scales(p, 950, cy + 20, 1360, cy + 180, 10, DUNB.armorDark, 43, 0.35); } });
  p.poly(J([[1250, cy + 58], [1335, cy + 32], [1320, cy + 70]]), DUNB.blade, 4); // lower blade tip
  const shield = S(chaikin([[880, cy - 175], [1000, cy - 200], [1160, cy - 150], [1300, cy - 60], [1360, cy + 10], [1340, cy + 40], [1040, cy + 40], [900, cy + 150], [870, cy - 20]], 2));
  cel(p, shield, DUNB.armor, light, { d: 18, tex: () => {
    for (const seam of [[[960, cy - 190], [990, cy - 40], [960, cy + 120]], [[1100, cy - 170], [1120, cy - 70], [1080, cy + 30]], [[990, cy - 40], [1200, cy - 60], [1320, cy - 30]]] as P2[][])
      p.stroke(S(curve(seam[0], seam[1], seam[2], 8)), 7, DUNB.armorDark);
    scales(p, 860, cy - 220, 1370, cy + 160, 11, DUNB.armorDark, 47, 0.3);
    for (let i = 0; i < 3; i++) p.stroke(S([[1150 + i * 16, cy - 120], [1190 + i * 16, cy - 70]]), 5, DUNB.armorLit);
  } });
  p.poly(S([[1290, cy + 30], [1360, cy + 20], [1350, cy + 74], [1320, cy + 60]]), DUNB.blade, 4); // upper fang plate
  const [ex, ey] = S([[1180, cy - 70]])[0];
  p.ell(ex, ey, 46, 40, DUNB.armorDark, 0); // bony eye ring
  beastEye(p, ex, ey, 1.1, expr, o.blink ?? 0, DUNB.armor, "#F2E2A0");
}

// ------------------------------------------------------------------ Smilodon populator (Ice Age S. America; ~2 m body)
// heavy forequarters, bobtail, 28 cm sabres; roar = the 110-degree gape
export const SMIB = { fur: "#A8723A", furDark: "#5E3A1A", furLit: "#D8A064", belly: "#E2C9A0", nose: "#2A1A14", mouth: "#30080E", gum: "#9A3A44", sabre: "#EDE2C4", scar: "#F0DEC0" };
export function drawSmiloB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 7) + 60, roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const fl = { r0: 50, r1: 28, toes: 4, toe: 18, reach: 130 };
  colLeg(p, o, 560, 600 + bob, 0.5, mul(SMIB.fur, FAR), light, { ...fl, bend: 46 });
  colLeg(p, o, 940, 600 + bob, 0, mul(SMIB.fur, FAR), light, { ...fl, r0: 58, r1: 34, bend: -14 });
  cel(p, tube(curve([450, 500 + bob], [400, 520 + bob], [380, 560 + bob], 6), 30, 22), SMIB.fur, light, { d: 8 }); // bobtail
  const body = chaikin(offs([[440, 520], [500, 440], [640, 420], [820, 390], [960, 400], [1020, 470], [1000, 600], [900, 660], [640, 650], [480, 610]], 0, bob), 3);
  cel(p, body, SMIB.fur, light, { d: 24, tex: () => {
    p.poly(blob(740, 640 + bob, 230, 50, 0, 6), SMIB.belly, 0);
    furFlicks(p, 440, 380, 1030, 660, 140, 5, [SMIB.furDark, SMIB.furLit], 34, 5);
    for (let i = 0; i < 6; i++) p.poly([[560 + i * 70, 430 + bob], [584 + i * 70, 426 + bob], [576 + i * 70, 520 + bob], [564 + i * 70, 506 + bob]], SMIB.furDark, 0);
    scars(p, 760, 450 + bob, SMIB.scar);
  } });
  scutes(p, curve([520, 440 + bob], [760, 380 + bob], [980, 400 + bob], 12), 16, SMIB.furDark, light, 7); // raised hackles
  colLeg(p, o, 520, 610 + bob, 0, SMIB.fur, light, { ...fl, bend: 46 });
  colLeg(p, o, 900, 610 + bob, 0.5, SMIB.fur, light, { ...fl, r0: 60, r1: 36, bend: -14 });
  // head: low, ears back; the jaw drops ~ 90 deg on the attack, sabres hang below the chin
  cel(p, tube(curve([960, 480 + bob], [1010, 450 + bob], [1050, 440 + bob], 6), 84, 70), SMIB.fur, light, { d: 14, tex: () => furFlicks(p, 900, 360, 1120, 560, 40, 9, [SMIB.furDark, SMIB.furLit], 26, 5) });
  const hinge: P2 = [1080, 480 + bob], ja = rad(80) * roar, hr = -rad(14) * roar, R = (q: P2[]) => rotAll(q, hr, hinge), J = (q: P2[]) => rotAll(q, ja, hinge);
  if (roar > 0.05) p.poly([...R([[1080, 470 + bob], [1230, 470 + bob]]), ...J([[1220, 490 + bob], [1080, 494 + bob]])], SMIB.mouth, 0);
  cel(p, J([[1070, 484 + bob], [1220, 486 + bob], [1210, 512 + bob], [1100, 530 + bob]]), SMIB.fur, light, { d: 8, ow: OW * 0.8, tex: () => p.poly(J([[1110, 500 + bob], [1215, 498 + bob], [1205, 514 + bob], [1110, 526 + bob]]), SMIB.belly, 0) });
  for (let i = 0; i < 3; i++) { const [tx, ty] = J([[1170 + i * 16, 486 + bob]])[0]; tooth(p, tx, ty, 12, false, ja, 0.3); }
  // sabres
  for (const [x, l, c] of [[1176, 150, mul(SMIB.sabre, FAR)], [1160, 160, SMIB.sabre]] as [number, number, string][]) {
    const b = R([[x, 470 + bob]])[0], sp = curve(b, [b[0] + 18, b[1] + l * 0.55], [b[0] - 6, b[1] + l], 8);
    cel(p, horn(sp, 15), c, light, { d: 4, ow: 8, rim: false, tex: () => { p.g.globalAlpha = 0.4; p.stroke([[b[0] + 6, b[1] + 20], [b[0] + 6, b[1] + l * 0.8]], 3, "#9C8A66"); p.g.globalAlpha = 1; } });
  }
  const head = R(chaikin(offs([[1020, 420], [1060, 380], [1140, 372], [1210, 400], [1240, 440], [1236, 474], [1170, 482], [1060, 486], [1020, 460]], 0, bob), 2));
  cel(p, head, SMIB.fur, light, { d: 14, tex: () => {
    furFlicks(p, 1010, 360, 1250, 490, 30, 11, [SMIB.furDark], 18, 4);
    p.poly(R(offs([[1150, 440], [1236, 448], [1236, 476], [1160, 480]], 0, bob)), SMIB.belly, 0);
    p.poly(R(offs([[1160, 406], [1200, 400], [1190, 420]], 0, bob)), SMIB.furDark, 0);
    p.g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) p.stroke(R(offs([[1080 + i * 20, 384], [1110 + i * 20, 404]], 0, bob)), 4, INKB); p.g.globalAlpha = 1; // snarl wrinkles
  } });
  cel(p, R(offs([[1040, 400], [1050, 350], [1080, 380]], 0, bob)), SMIB.furDark, light, { d: 4, ow: OW * 0.7, rim: false }); // ear, flattened back
  p.poly(R(offs([[1222, 430], [1244, 436], [1238, 452], [1220, 446]], 0, bob)), SMIB.nose, 0);
  const [ex, ey] = R([[1140, 412 + bob]])[0];
  beastEye(p, ex, ey, 0.85, expr, o.blink ?? 0, SMIB.fur, "#F2D23A");
}

// ------------------------------------------------------------------ woolly rhino (Coelodonta, Ice Age; ~3.6 m)
// shaggy, shoulder hump, huge flattened front horn worn by snow-sweeping; roar = head-down charge
export const RHIB = { fur: "#5A3F26", furDark: "#2E1F12", furLit: "#8A6640", skin: "#3A2E26", horn: "#3A3026", hornLit: "#8A7656", scar: "#D8C49A" };
export function drawRhinoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 5), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const leg = { r0: 62, r1: 50, toes: 3, toe: 18, reach: 120 };
  colLeg(p, o, 560, 660 + bob, 0.5, mul(RHIB.fur, FAR), light, { ...leg, bend: 20 });
  colLeg(p, o, 900, 670 + bob, 0, mul(RHIB.fur, FAR), light, { ...leg, bend: -8 });
  cel(p, tube(curve([440, 560 + bob], [400, 600 + bob], [390, 660 + bob], 6), 22, 12), RHIB.fur, light, { d: 6 });
  hairStrands(p, Array.from({ length: 20 }, (_, i) => [470 + i * 27, 660 + bob + Math.sin(i) * 8] as P2), 110, 3, [RHIB.furDark, RHIB.fur]);
  const body = chaikin(offs([[430, 560], [470, 460], [600, 420], [790, 380], [900, 340], [980, 380], [1010, 480], [990, 640], [880, 700], [600, 710], [460, 660]], 0, bob), 3);
  cel(p, body, RHIB.fur, light, { d: 28, tex: () => { furFlicks(p, 420, 330, 1020, 710, 160, 7, [RHIB.furDark, RHIB.furLit], 40, 5); scars(p, 700, 450 + bob, RHIB.scar); } });
  hairStrands(p, Array.from({ length: 14 }, (_, i) => [620 + i * 26, 660 + bob - i * 3] as P2), 120, 5, [RHIB.furDark, RHIB.fur]);
  colLeg(p, o, 520, 670 + bob, 0, RHIB.fur, light, { ...leg, bend: 20 });
  colLeg(p, o, 860, 680 + bob, 0.5, RHIB.fur, light, { ...leg, bend: -8 });
  // head: long, low, hangs; on the charge it drops further and the horn points ahead
  const sh: P2 = [960, 470 + bob], hr = rad(22) * roar, R = (q: P2[]) => rotAll(q, hr, sh);
  const head = R(chaikin(offs([[930, 420], [1020, 430], [1150, 520], [1240, 600], [1250, 650], [1200, 670], [1100, 640], [980, 600], [930, 540]], 0, bob), 2));
  cel(p, head, RHIB.fur, light, { d: 18, tex: () => { furFlicks(p, 920, 400, 1260, 680, 60, 11, [RHIB.furDark, RHIB.furLit], 26, 4); p.poly(R(offs([[1180, 590], [1250, 620], [1250, 650], [1200, 668], [1160, 640]], 0, bob)), RHIB.skin, 0); } });
  cel(p, R(offs([[990, 420], [1000, 370], [1030, 410]], 0, bob)), RHIB.furDark, light, { d: 4, ow: OW * 0.7, rim: false });
  hairStrands(p, R(Array.from({ length: 7 }, (_, i) => [990 + i * 24, 600 + bob + i * 10] as P2)), 70, 9, [RHIB.furDark]);
  for (const [b, k, t, r] of [[[1180, 560], [1300, 470], [1380, 300], 46], [[1110, 520], [1150, 470], [1170, 430], 24]] as [P2, P2, P2, number][]) {
    const hp = R(curve([b[0], b[1] + bob], [k[0], k[1] + bob], [t[0], t[1] + bob], 14));
    cel(p, horn(hp, r), RHIB.horn, light, { d: 8, ow: OW * 0.85, tex: () => { for (let i = 2; i < hp.length - 2; i += 2) p.stroke([[hp[i][0] - 30, hp[i][1] - 6], [hp[i][0] + 26, hp[i][1] + 8]], 4, RHIB.hornLit); } });
  }
  const [ex, ey] = R([[1080, 520 + bob]])[0];
  beastEye(p, ex, ey, 0.75, expr, o.blink ?? 0, RHIB.fur, "#FF4A1A");
}

// ------------------------------------------------------------------ cave bear (Ursus spelaeus, Ice Age Europe; ~3 m)
// huge shoulder hump, steep domed forehead; roar = head up, jaws wide, fangs
export const BEARB = { fur: "#4A3426", furDark: "#24180F", furLit: "#7A5A40", muzzle: "#6A4C36", nose: "#160E0A", mouth: "#30080E", gum: "#9A3A44", scar: "#D8C49A" };
export function drawBearB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const leg = { r0: 74, r1: 54, toes: 5, toe: 30, reach: 130 };
  colLeg(p, o, 560, 620 + bob, 0.5, mul(BEARB.fur, FAR), light, { ...leg, bend: 18 });
  colLeg(p, o, 920, 630 + bob, 0, mul(BEARB.fur, FAR), light, { ...leg, bend: -6 });
  const body = chaikin(offs([[420, 560], [450, 440], [580, 380], [760, 360], [880, 310], [990, 350], [1020, 470], [990, 620], [880, 690], [600, 700], [450, 660]], 0, bob), 3);
  hairStrands(p, Array.from({ length: 18 }, (_, i) => [470 + i * 28, 660 + bob] as P2), 70, 3, [BEARB.furDark, BEARB.fur]);
  cel(p, body, BEARB.fur, light, { d: 28, tex: () => { furFlicks(p, 410, 290, 1030, 700, 170, 7, [BEARB.furDark, BEARB.furLit], 40, 6); scars(p, 680, 430 + bob, BEARB.scar, 4, 80); } });
  colLeg(p, o, 520, 630 + bob, 0, BEARB.fur, light, { ...leg, bend: 18 });
  colLeg(p, o, 880, 640 + bob, 0.5, BEARB.fur, light, { ...leg, bend: -6 });
  // head: raised on the roar, jaw drops
  const sh: P2 = [960, 430 + bob], hr = -rad(18) * roar, R = (q: P2[]) => rotAll(q, hr, sh);
  const hinge = R([[1080, 520 + bob]])[0], ja = rad(40) * roar, J = (q: P2[]) => rotAll(R(q), ja, hinge);
  if (roar > 0.05) {
    p.poly([...R([[1080, 505 + bob], [1250, 500 + bob]]), ...J([[1230, 520 + bob], [1080, 524 + bob]])], BEARB.mouth, 0);
    p.poly(R([[1100, 506 + bob], [1240, 502 + bob], [1230, 514 + bob], [1100, 516 + bob]]), BEARB.gum, 0);
    for (let i = 0; i < 6; i++) { const [tx, ty] = R([[1110 + i * 22, 508 + bob]])[0]; tooth(p, tx, ty, i === 4 ? 36 : 14, true, hr, 0.3); }
    for (let i = 0; i < 5; i++) { const [tx, ty] = J([[1110 + i * 24, 522 + bob]])[0]; tooth(p, tx, ty, i === 3 ? 30 : 12, false, hr + ja, 0.3); }
  }
  cel(p, J([[1070, 520 + bob], [1230, 516 + bob], [1220, 546 + bob], [1100, 560 + bob]]), BEARB.muzzle, light, { d: 8, ow: OW * 0.8 });
  const head = R(chaikin(offs([[930, 420], [990, 340], [1070, 330], [1110, 370], [1170, 420], [1250, 450], [1262, 490], [1240, 512], [1080, 520], [960, 510]], 0, bob), 2));
  cel(p, head, BEARB.fur, light, { d: 18, tex: () => {
    furFlicks(p, 920, 320, 1270, 520, 60, 11, [BEARB.furDark, BEARB.furLit], 24, 5);
    p.poly(R(offs([[1150, 440], [1258, 460], [1262, 500], [1150, 506]], 0, bob)), BEARB.muzzle, 0);
    if (roar > 0.05) { p.g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) p.stroke(R(offs([[1150 + i * 24, 430], [1170 + i * 24, 452]], 0, bob)), 4, INKB); p.g.globalAlpha = 1; }
  } });
  for (const [x, y] of [[990, 345], [1040, 330]] as P2[]) cel(p, R(blob(x, y + bob, 26, 22, 0, x | 0)), BEARB.fur, light, { d: 4, ow: OW * 0.7, rim: false, tex: () => p.ell(x, y + bob + 4, 12, 10, BEARB.furDark, 0) });
  p.poly(R(offs([[1240, 448], [1268, 460], [1262, 484], [1236, 478]], 0, bob)), BEARB.nose, 0);
  const [ex, ey] = R([[1090, 400 + bob]])[0];
  beastEye(p, ex, ey, 0.8, expr, o.blink ?? 0, BEARB.fur, "#FF6A1F");
}

// ------------------------------------------------------------------ registry: x0 / x1 = measured extent of the animal (design units, BeastSolo),
// len = real length in m over that extent. quetz: len set so it stands ~5 m tall to the top of the crest; smilo: head-body
// ~2 m + bobtail; dunkle: 3.4-4.1 m (Engelman 2023, smaller than the old 6-10 m figures).
export const BEAST_MORE = {
  steg: { draw: drawStegB, len: 9, x0: 40, x1: 1276 },
  ankylo: { draw: drawAnkyB, len: 7, x0: 14, x1: 1214 },
  sauro: { draw: drawSauroB, len: 22, x0: 54, x1: 1327 },
  edmonto: { draw: drawEdmoB, len: 12, x0: 26, x1: 1349 },
  pachy: { draw: drawPachyB, len: 4.5, x0: 136, x1: 1082 },
  spino: { draw: drawSpinoB, len: 14, x0: 20, x1: 1416 },
  quetz: { draw: drawQuetzB, len: 4.5, x0: 441, x1: 1273 },
  mosa: { draw: drawMosaB, len: 13, x0: 68, x1: 1475 },
  dunkle: { draw: drawDunkB, len: 3.5, x0: 120, x1: 1363 },
  smilo: { draw: drawSmiloB, len: 2.2, x0: 350, x1: 1249 },
  rhino: { draw: drawRhinoB, len: 3.6, x0: 367, x1: 1384 },
  bear: { draw: drawBearB, len: 3, x0: 420, x1: 1270 },
} as const;
export const BEAST_ALL = { ...BEAST, ...BEAST_MORE };
export type BeastName = keyof typeof BEAST_ALL;
