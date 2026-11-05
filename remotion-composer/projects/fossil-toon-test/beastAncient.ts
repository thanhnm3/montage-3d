// Famous ancient animals, the last batch (2026-11-04, user: "làm nốt các con còn lại đi ... các con thú cổ đại nổi tiếng,
// làm hết"). Same beast look and API. Built from shared bodies so the batch stays consistent:
//   drawQuadB  — any four-legged mammal / synapsid (body, legs, neck, tail, fur / stripes / scales) + quadHead (cat, dog,
//                horse, bovine, big, reptile skulls; fangs, sabres; antlers, bull horns, a unicorn horn, goat horns)
//   drawSwimB  — ichthyosaur / Basilosaurus / Livyatan bodies (cy 520)
//   drawGroundBirdB (moa, dodo), drawSoarB (Argentavis, Pelagornis; reused for the phoenix + thunderbird), drawApeB
//   specials: Archelon, trilobite, Eurypterid, Glyptodon; colour variants through a canvas filter (`tinted`).
// Our own drawings, side views facing right, design 1600 x 1000, ground y = 960.
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, claw, digiLeg, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, colLeg, furFlicks, hairStrands, scars } from "./beastMore";
import { featherWing, plumes } from "./beastWings";
import { flipper } from "./beastExtra";

const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const offs = (pts: P2[], dx: number, dy: number): P2[] => pts.map(([x, y]) => [x + dx, y + dy] as P2);
const bobOf = (o: AnimalPose, a: number) => a * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
type Draw = (p: Pen, o: AnimalPose) => void;
/** colour variant of a drawing through a canvas filter (e.g. "hue-rotate(80deg) saturate(1.3)") */
export const tinted = (draw: Draw, filter: string): Draw => (p, o) => { p.g.save(); p.g.filter = filter; draw(p, o); p.g.restore(); };

// ------------------------------------------------------------------ heads
export type HeadSpec = { L: number; h: number; type: "cat" | "dog" | "horse" | "bovine" | "big" | "reptile"; fangs?: number; sabre?: number; horns?: "antlers" | "bull" | "unicorn" | "goat"; ears?: boolean; open?: number };
export type HeadCol = { fur: string; dark: string; lit: string; belly: string; skin: string; iris: string; horn?: string; mane?: string };
/** a mammal / synapsid head; H = jaw hinge (back of the mouth), facing right; rot turns the whole head about H */
export function quadHead(p: Pen, H: P2, S: HeadSpec, C: HeadCol, o: AnimalPose, light: number, rot = 0, scale = 1) {
  const roar = o.roar ?? 0, expr = o.expr ?? "angry", L = S.L * scale, h = S.h * scale;
  const shp = S.type === "horse" ? 0.55 : S.type === "bovine" ? 0.7 : S.type === "reptile" ? 0.8 : 1;
  const R = (q: P2[]) => rotAll(q.map(([u, v]) => [H[0] + u * L, H[1] + v * h] as P2), rot, H);
  const ja = rad(S.open ?? (S.type === "horse" || S.type === "bovine" ? 18 : 42)) * roar, J = (q: P2[]) => rotAll(R(q), ja, H);
  // horns that sit behind the skull outline
  const hornCol = C.horn ?? "#D9C9A6";
  if (S.horns === "antlers") for (const [d, col] of [[0.12, mul(hornCol, FAR)], [0, hornCol]] as [number, string][]) { // palmate, ~3.5 m span
    const base = R([[0.05 + d, -0.92]])[0], A = (q: P2[]) => rotAll(offs(q, base[0], base[1]), rot, base);
    const beam = A([[0, 0], [-0.25 * L, -0.7 * h], [-0.45 * L, -1.5 * h]]), end = beam[2];
    cel(p, tube(curve(beam[0], beam[1], end, 8), 15 * scale, 12 * scale), col, light, { d: 4, ow: 9 });
    cel(p, tube(A([[-0.08 * L, -0.25 * h], [0.25 * L, -0.55 * h], [0.4 * L, -0.45 * h]]), 9 * scale, 6 * scale), col, light, { d: 3, ow: 8, rim: false }); // brow tine
    const palm = chaikin([add(end, -0.55 * L, 0.25 * h), add(end, -0.65 * L, -0.5 * h), add(end, -0.1 * L, -0.95 * h), add(end, 0.45 * L, -0.75 * h), add(end, 0.5 * L, -0.2 * h), add(end, 0.1 * L, 0.15 * h)], 2);
    cel(p, palm, col, light, { d: 6, ow: 10 });
    for (let i = 0; i < 7; i++) { const q = lerp2(add(end, -0.62 * L, -0.4 * h), add(end, 0.48 * L, -0.5 * h), i / 6), up = -0.9 * h - Math.sin((i / 6) * Math.PI) * 0.3 * h; p.poly(horn([q, add(q, -4, up * 0.5), add(q, 6, up)], 9 * scale), col, 5); }
  }
  if (S.horns === "goat") cel(p, horn(R(curve([0.1, -0.95], [-0.5, -1.9], [-0.9, -1.2], 12)), 18 * scale), hornCol, light, { d: 5, ow: 9 });
  // mouth + teeth
  p.poly([...R([[0.02, -0.05], [0.95, -0.12]]), ...J([[0.9, 0.0], [0.02, 0.02]])], "#30080E", 0);
  if (roar > 0.05) { const q = J([[0.4, 0.06]])[0]; p.ell(q[0], q[1], L * 0.25, h * 0.08, "#B0404E", 0); }
  const nf = S.fangs ?? 0;
  for (let i = 0; i < nf; i++) { const u = 0.2 + (0.65 * i) / Math.max(1, nf - 1), [tx, ty] = J([[u, 0.0]])[0]; tooth(p, tx, ty, h * (i === nf - 2 ? 0.3 : 0.12), false, rot + ja, 0.3); }
  cel(p, J(S.type === "horse" || S.type === "bovine" ? [[-0.05, 0], [0.92, -0.04], [0.85, 0.2], [0.3, 0.3], [-0.05, 0.25]] : [[-0.1, 0.0], [0.9, -0.02], [0.84, 0.26], [0.45, 0.4], [0, 0.38], [-0.15, 0.22]]),
    mul(C.fur, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.8, tex: () => { const q = J([[0.6, 0.2]])[0]; p.ell(q[0], q[1], L * 0.35, h * 0.12, C.belly, 0); } });
  for (let i = 0; i < nf + 1; i++) { const u = 0.15 + (0.75 * i) / Math.max(1, nf), [tx, ty] = R([[u, -0.08]])[0]; tooth(p, tx, ty, h * (i === nf - 1 ? 0.36 : 0.13), true, rot, 0.3); }
  if (S.sabre) for (const d of [0.04, 0]) { const b = R([[0.62 + d, -0.1]])[0], a = rot + Math.PI / 2 - 0.12; p.poly(horn(curve(b, add(b, Math.cos(a) * h * S.sabre * 0.5 + 8, Math.sin(a) * h * S.sabre * 0.5), add(b, Math.cos(a) * h * S.sabre - 4, Math.sin(a) * h * S.sabre), 8), h * 0.07), d ? mul("#EDE2C4", FAR) : "#EDE2C4", 4); }
  // skull
  const skull: P2[] = S.type === "horse" ? [[-0.15, -0.55], [0.05, -0.95], [0.35, -1.0], [0.7, -0.75], [1.0, -0.55], [1.05, -0.2], [0.95, -0.05], [0, 0.0], [-0.2, -0.2]]
    : S.type === "reptile" ? [[-0.2, -0.45], [0.05, -0.85], [0.45, -0.95], [0.85, -0.7], [1.05, -0.4], [1.0, -0.08], [0, 0.0], [-0.25, -0.15]]
    : [[-0.2, -0.5], [0, -0.95], [0.35, -1.0], [0.72, -0.78], [1.0, -0.5], [1.03, -0.12], [0.9, -0.02], [0, 0.04], [-0.25, -0.15]];
  if (S.ears !== false && S.type !== "reptile") for (const d of [0.12, 0]) cel(p, R([[0.0 + d, -0.85], [-0.12 + d, -1.45 * shp - 0.1], [0.22 + d, -0.9]]), d ? C.dark : C.fur, light, { d: 3, ow: 8, rim: false });
  cel(p, R(chaikin(skull, 2)), C.fur, light, { d: 10, tex: () => {
    const q0 = R([[-0.25, -1.0]])[0], q1 = R([[1.1, 0.1]])[0];
    if (S.type === "reptile") scales(p, Math.min(q0[0], q1[0]) - 20, Math.min(q0[1], q1[1]) - 20, Math.max(q0[0], q1[0]) + 20, Math.max(q0[1], q1[1]) + 20, 10, C.dark, 7, 0.5);
    else furFlicks(p, Math.min(q0[0], q1[0]), Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), Math.max(q0[1], q1[1]), 26, 11, [C.dark, C.lit], 16 * scale, 4);
    p.poly(R([[0.65, -0.55], [1.03, -0.45], [1.03, -0.08], [0.6, -0.1]]), C.belly, 0); // muzzle
    if (roar > 0.05 && S.type !== "horse" && S.type !== "bovine") { p.g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) p.stroke(R([[0.5 + i * 0.08, -0.85], [0.58 + i * 0.08, -0.6]]), 4, INKB); p.g.globalAlpha = 1; } // snarl wrinkles
  } });
  const nose = R([[1.0, -0.38]])[0]; p.ell(nose[0], nose[1], L * 0.05, h * 0.08, C.skin, 3);
  p.poly(R([[0.2, -0.82], [0.55, -0.78], [0.5, -0.7], [0.22, -0.72]]), INKB, 0); // brow
  const e = R([[0.38, -0.66]])[0]; beastEye(p, e[0], e[1], Math.max(0.5, h / 160) * 1.0, expr, o.blink ?? 0, C.fur, C.iris);
  if (S.horns === "bull") for (const [d, col] of [[0.1, mul(hornCol, FAR)], [0, hornCol]] as [number, string][]) cel(p, horn(R(curve([0.12 + d, -0.92], [-0.25 + d, -1.7], [0.55 + d, -2.1], 12)), h * 0.13), col, light, { d: 4, ow: 9, tex: () => { const tp = R([[0.55 + d, -2.1]])[0]; p.ell(tp[0], tp[1], 24, 24, "#1E1612", 0); } });
  if (S.horns === "unicorn") { const hp = R(curve([0.55, -0.92], [0.9, -1.8], [1.5, -2.6], 14)); cel(p, horn(hp, h * 0.09), hornCol, light, { d: 4, ow: 9, tex: () => { for (let i = 1; i < hp.length - 1; i++) p.stroke([add(hp[i], -10, 6), add(hp[i], 10, -6)], 3, INKB); } }); }
  if (C.mane) plumes(p, R([[-0.15, -0.9], [-0.25, -0.7], [-0.3, -0.45], [-0.32, -0.2], [-0.3, 0.05]]), 70 * scale, rot + rad(160), C.mane, 3, 16 * scale);
}

// ------------------------------------------------------------------ four-legged body
export type QuadSpec = HeadCol & {
  x0: number; x1: number; ys: number; yh: number; yb: number; hump: number;
  hind: [number, number]; front: [number, number]; bendH: number; bendF: number; toes: number; toe: number;
  head: HeadSpec; neck: [number, number, number]; tail: "long" | "tuft" | "short" | "stiff" | "none"; stripes?: number; scaly?: boolean; shag?: number; bob?: number;
  charge?: boolean; headFn?: (p: Pen, H: P2, o: AnimalPose, light: number, rot: number) => void; preFn?: (p: Pen, o: AnimalPose, light: number, bob: number) => void;
  postFn?: (p: Pen, o: AnimalPose, light: number, bob: number) => void; tailFn?: (p: Pen, end: P2, o: AnimalPose, light: number) => void; heads?: number;
};
export function drawQuadB(p: Pen, o: AnimalPose, S: QuadSpec) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, bob = bobOf(o, S.bob ?? 6), mid = (S.x0 + S.x1) / 2;
  const legH = { r0: S.hind[0], r1: S.hind[1], toes: S.toes, toe: S.toe, bend: S.bendH, tex: S.scaly ? S.dark : undefined }, legF = { r0: S.front[0], r1: S.front[1], toes: S.toes, toe: S.toe, bend: S.bendF, tex: S.scaly ? S.dark : undefined };
  S.preFn?.(p, o, light, bob);
  colLeg(p, o, S.x0 + 140, S.yb - 70 + bob, 0.5, mul(S.fur, FAR), light, legH); colLeg(p, o, S.x1 - 120, S.yb - 60 + bob, 0, mul(S.fur, FAR), light, legF);
  // tail
  if (S.tail !== "none") {
    const tb: P2 = [S.x0 + 30, S.yh + 40 + bob], sw = 0.15 * Math.sin(2 * Math.PI * (o.phase ?? 0));
    const tl = S.tail === "short" ? curve(tb, add(tb, -50, 10), add(tb, -80, 50), 6) : S.tail === "stiff" ? curve(tb, add(tb, -160, 30), add(tb, -300, 60 + 20 * sw), 10) : curve(tb, add(tb, -120, 60), add(tb, -170 + 40 * sw, 260), 10);
    cel(p, tube(tl, S.tail === "stiff" ? 36 : 26, S.tail === "stiff" ? 10 : 12), S.fur, light, { d: 6, tex: () => furFlicks(p, tb[0] - 320, tb[1] - 40, tb[0] + 20, tb[1] + 300, 20, 3, [S.dark], 20, 4) });
    if (S.tail === "tuft") cel(p, blob(tl[tl.length - 1][0], tl[tl.length - 1][1] + 10, 22, 34, 0, 5), S.dark, light, { d: 4, ow: 9 });
    S.tailFn?.(p, tl[tl.length - 1], o, light);
  }
  const body = chaikin(offs([[S.x0, S.yh + 70], [S.x0 + 40, S.yh], [S.x0 + 140, S.yh - 20], [mid, (S.yh + S.ys) / 2 - 10], [S.x1 - 160, S.ys - S.hump], [S.x1 - 60, S.ys], [S.x1, S.ys + 80],
    [S.x1 - 10, S.yb - 40], [S.x1 - 110, S.yb], [mid, S.yb + 10], [S.x0 + 110, S.yb - 10], [S.x0 + 20, S.yb - 60]], 0, bob), 3);
  if (S.shag) hairStrands(p, Array.from({ length: 16 }, (_, i) => [S.x0 + 60 + i * (S.x1 - S.x0 - 120) / 15, S.yb - 10 + bob] as P2), S.shag, 3, [S.dark, S.fur]);
  cel(p, body, S.fur, light, { d: 24, tex: () => {
    p.poly(blob(mid, S.yb - 10 + bob, (S.x1 - S.x0) * 0.4, 30, 0, 5), S.belly, 0);
    if (S.scaly) scales(p, S.x0, S.ys - 60, S.x1, S.yb + 20, 16, S.dark, 9, 0.5); else furFlicks(p, S.x0, S.ys - S.hump - 20, S.x1, S.yb, 140, 5, [S.dark, S.lit], 30, 5);
    for (let i = 0; i < (S.stripes ?? 0); i++) { const x = S.x0 + 40 + i * 42; p.poly([[x, S.yh - 30 + bob], [x + 24, S.yh - 30 + bob], [x + 16, S.yh + 90 + bob], [x + 4, S.yh + 80 + bob]], S.dark, 0); }
    scars(p, mid, S.ys + 30 + bob, "#E8D8C0", 3, 60);
  } });
  colLeg(p, o, S.x0 + 100, S.yb - 60 + bob, 0, S.fur, light, legH); colLeg(p, o, S.x1 - 160, S.yb - 50 + bob, 0.5, S.fur, light, legF);
  // neck + head(s)
  const nb: P2 = [S.x1 - 50, S.ys + 60 + bob], H0: P2 = [S.x1 + S.neck[0], S.ys + 60 - S.neck[1] + bob];
  const hr = S.charge ? rad(24) * roar : -rad(14) * roar;
  const heads = S.heads ?? 1;
  for (let k = heads - 1; k >= 0; k--) {
    const off = heads === 1 ? 0 : (k - (heads - 1) / 2), H = add(H0, -off * 70 - Math.abs(off) * 40, off * 150), sc = heads === 1 ? 1 : 0.72;
    const neckL = rotAll(curve(nb, lerp2(nb, H, 0.5), H, 8), hr, nb);
    cel(p, tube(neckL, S.neck[2], S.neck[2] * 0.75), k === 0 || heads === 1 ? S.fur : mul(S.fur, FAR), light, { d: 10, tex: () => S.scaly ? scales(p, nb[0] - 80, Math.min(nb[1], H[1]) - 100, H[0] + 60, Math.max(nb[1], H[1]) + 100, 14, S.dark, 13, 0.5) : furFlicks(p, nb[0] - 80, Math.min(nb[1], H[1]) - 100, H[0] + 60, Math.max(nb[1], H[1]) + 100, 40, 13, [S.dark, S.lit], 22, 5) });
    const Hr = neckL[neckL.length - 1], sub = { ...o, roar: heads > 1 ? (k === 1 ? roar : roar * 0.8) : roar };
    if (S.headFn) S.headFn(p, Hr, sub, light, hr); else quadHead(p, add(Hr, 10, S.head.h * 0.45 * sc), S.head, S, sub, light, hr, sc);
  }
  S.postFn?.(p, o, light, bob);
}

// ------------------------------------------------------------------ real mammals / synapsids on the quad body
const CAVELION: QuadSpec = { fur: "#B08A56", dark: "#6A4A2A", lit: "#D8B07A", belly: "#E2CCA0", skin: "#2A1A14", iris: "#F2D23A",
  x0: 420, x1: 1000, ys: 470, yh: 490, yb: 650, hump: 10, hind: [70, 34], front: [74, 38], bendH: 44, bendF: -12, toes: 4, toe: 22,
  head: { L: 230, h: 150, type: "cat", fangs: 5 }, neck: [70, 40, 92], tail: "tuft", bob: 7 };
export const drawCaveLionB: Draw = (p, o) => drawQuadB(p, o, CAVELION);
const AUROCHS: QuadSpec = { fur: "#2A2220", dark: "#141010", lit: "#5A4A40", belly: "#3A302A", skin: "#C8B8A8", iris: "#FF4A1A", horn: "#E2D6BA",
  x0: 400, x1: 1010, ys: 400, yh: 470, yb: 660, hump: 50, hind: [70, 30], front: [76, 32], bendH: 36, bendF: -8, toes: 2, toe: 20,
  head: { L: 240, h: 150, type: "bovine", horns: "bull" }, neck: [60, -20, 110], tail: "tuft", charge: true, bob: 5 };
export const drawAurochsB: Draw = (p, o) => drawQuadB(p, o, AUROCHS);
const MEGALOC: QuadSpec = { fur: "#7A5232", dark: "#3E2818", lit: "#A87A50", belly: "#D2B48A", skin: "#1E1410", iris: "#FF6A1F", horn: "#C8B48A",
  x0: 470, x1: 980, ys: 520, yh: 550, yb: 700, hump: 30, hind: [60, 22], front: [60, 22], bendH: 46, bendF: -8, toes: 2, toe: 16,
  head: { L: 200, h: 100, type: "horse", horns: "antlers" }, neck: [90, 80, 80], tail: "short", charge: true, bob: 6 };
export const drawMegalocB: Draw = (p, o) => drawQuadB(p, o, MEGALOC);
const THYLA: QuadSpec = { fur: "#B8925E", dark: "#3A2818", lit: "#D8B888", belly: "#E8D4B0", skin: "#1A1210", iris: "#F2D23A",
  x0: 400, x1: 960, ys: 560, yh: 560, yb: 690, hump: 0, hind: [52, 22], front: [46, 22], bendH: 50, bendF: -10, toes: 4, toe: 16,
  head: { L: 260, h: 120, type: "dog", fangs: 6, open: 75 }, neck: [70, 20, 70], tail: "stiff", stripes: 8, bob: 8 };
export const drawThylaB: Draw = (p, o) => drawQuadB(p, o, THYLA); // the thylacine could open its jaws ~80 degrees
const PARACER: QuadSpec = { fur: "#6E6458", dark: "#3A342C", lit: "#9A8E80", belly: "#B8AC98", skin: "#2A2420", iris: "#FF8A1F",
  x0: 420, x1: 980, ys: 330, yh: 360, yb: 560, hump: 40, hind: [86, 52], front: [86, 54], bendH: 20, bendF: 0, toes: 3, toe: 18,
  head: { L: 230, h: 110, type: "horse" }, neck: [130, 120, 100], tail: "short", scaly: true, bob: 4 };
export const drawParacerB: Draw = (p, o) => drawQuadB(p, o, PARACER);
const ANDREW: QuadSpec = { fur: "#4A3A30", dark: "#22180F", lit: "#7A6656", belly: "#9A8676", skin: "#1A1210", iris: "#FF4A1A",
  x0: 420, x1: 900, ys: 470, yh: 500, yb: 680, hump: 30, hind: [66, 30], front: [70, 32], bendH: 36, bendF: -10, toes: 4, toe: 20,
  head: { L: 400, h: 190, type: "big", fangs: 7 }, neck: [40, 20, 110], tail: "long", bob: 6 };
export const drawAndrewB: Draw = (p, o) => drawQuadB(p, o, ANDREW);
const GORGON: QuadSpec = { fur: "#6A5A44", dark: "#2E2418", lit: "#9A8A6A", belly: "#C8B48A", skin: "#1A1210", iris: "#F2D23A",
  x0: 400, x1: 940, ys: 610, yh: 620, yb: 760, hump: 10, hind: [56, 26], front: [56, 26], bendH: 60, bendF: -30, toes: 5, toe: 22,
  head: { L: 330, h: 170, type: "reptile", fangs: 6, sabre: 0.9, open: 70 }, neck: [60, 30, 90], tail: "stiff", scaly: true, stripes: 6, bob: 5 };
export const drawGorgonB: Draw = (p, o) => drawQuadB(p, o, GORGON); // Inostrancevia, Late Permian, ~3.5 m, 15 cm sabres

// ------------------------------------------------------------------ Glyptodon (Ice Age S. America; ~3.3 m, an armadillo the size of a car)
const GLY0 = { shell: "#7A6044", dark: "#3A2A1C", lit: "#B8946A", skin: "#4A3A2E", ring: "#5A442E" };
export function drawGlyptoB(p: Pen, o: AnimalPose, mace = false) {
  const GLY = mace ? DOED : GLY0; // Doedicurus: a taller dome and a spiked mace on the tail
  const light = o.light ?? rad(-120), bob = bobOf(o, 3), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  for (const [x, off, c] of [[560, 0.5, mul(GLY.skin, FAR)], [920, 0, mul(GLY.skin, FAR)]] as [number, number, string][]) colLeg(p, o, x, 820 + bob, off, c, light, { r0: 60, r1: 44, toes: 4, toe: 20, bend: 10, reach: 90 });
  // armoured tail club swings up on the threat
  const tb: P2 = [440, 760 + bob], tl = rotAll(curve(tb, [330, 790 + bob], [200, 780 + bob], 10), rad(30) * roar, tb);
  for (let i = 0; i < tl.length - 1; i++) cel(p, blob(tl[i][0], tl[i][1], 34 - i * 1.5, 40 - i * 1.6, 0, i), i % 2 ? GLY.ring : GLY.shell, light, { d: 4, ow: 8 });
  const c = tl[tl.length - 1], mk = mace ? 1.7 : 1; cel(p, blob(c[0] - 20, c[1], 50 * mk, 44 * mk, 0, 3), GLY.shell, light, { d: 6 }); for (let i = 0; i < (mace ? 9 : 6); i++) { const a = (i / (mace ? 9 : 6)) * Math.PI * 2; p.poly(horn([add(c, Math.cos(a) * 36 * mk - 20, Math.sin(a) * 34 * mk), add(c, Math.cos(a) * 60 * mk - 20, Math.sin(a) * 56 * mk), add(c, Math.cos(a) * 84 * mk - 20, Math.sin(a) * 80 * mk)], 12), GLY.dark, 3); }
  const shell = chaikin(offs(mace ? [[420, 820], [440, 600], [560, 440], [720, 400], [880, 450], [980, 600], [1000, 820], [720, 840]] : [[420, 820], [450, 640], [560, 520], [720, 490], [880, 530], [980, 640], [1000, 820], [720, 840]], 0, bob), 3);
  cel(p, shell, GLY.shell, light, { d: 30, tex: () => {
    for (let y = 500; y < 840; y += 46) for (let x = 420 + ((y / 46) % 2) * 26; x < 1010; x += 52) { const q = add([x, y], 0, bob); p.poly([add(q, -22, 0), add(q, -11, -20), add(q, 11, -20), add(q, 22, 0), add(q, 11, 20), add(q, -11, 20)], GLY.dark, 0); p.poly([add(q, -16, 0), add(q, -8, -14), add(q, 8, -14), add(q, 16, 0), add(q, 8, 14), add(q, -8, 14)], GLY.lit, 0); }
    p.path(shell, true); p.g.strokeStyle = GLY.dark; p.g.lineWidth = 30; p.g.stroke(); scars(p, 700, 560 + bob, "#E8D8B8", 4, 70);
  } });
  for (let i = 0; i < 12; i++) { const x = 440 + i * 48; p.poly(horn([[x, 818 + bob], [x - 6, 842 + bob], [x - 2, 864 + bob]], 10), GLY.dark, 3); } // skirt spikes
  for (const [x, off] of [[600, 0], [960, 0.5]] as [number, number][]) colLeg(p, o, x, 830 + bob, off, GLY.skin, light, { r0: 64, r1: 46, toes: 4, toe: 22, bend: 10, reach: 90 });
  // head with its bony helmet
  const H: P2 = [1010, 760 + bob], hr = rad(10) * roar;
  const R = (q: P2[]) => rotAll(offs(q, H[0], H[1]), hr, H);
  cel(p, R(chaikin([[-20, -40], [40, -90], [130, -70], [170, -10], [150, 40], [40, 50], [-20, 20]], 2)), GLY.skin, light, { d: 8 });
  cel(p, R([[0, -70], [60, -110], [130, -80], [110, -50], [20, -40]]), GLY.shell, light, { d: 4, ow: 9 });
  if (roar > 0.05) p.ell(...R([[140, 30]])[0], 26, 14, "#30080E", 3);
  const e = R([[70, -40]])[0]; beastEye(p, e[0], e[1], 0.7, expr, o.blink ?? 0, GLY.skin, "#FF6A1F");
}

const DOED = { shell: "#5A4A3A", dark: "#22180F", lit: "#9A7E5A", skin: "#3A2E26", ring: "#4A3A2A" };
export const drawDoedB = (p: Pen, o: AnimalPose) => drawGlyptoB(p, o, true); // Doedicurus (~3.6 m, Pleistocene Argentina)

// ------------------------------------------------------------------ swimmers: ichthyosaur, Basilosaurus, Livyatan (cy 520)
type SwimSpec = { top: string; side: string; belly: string; fin: string; kind: "ichthy" | "basilo" | "livyatan"; teeth: number; toothL: number; iris: string; eye: number };
function drawSwimB(p: Pen, o: AnimalPose, S: SwimSpec) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.14 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const prof = S.kind === "basilo" ? (u: number) => 70 * Math.sin(Math.min(1, u * 5) * Math.PI / 2) * (1 - 0.3 * u) : S.kind === "livyatan" ? (u: number) => 190 * Math.sin(Math.min(1, u * 2.4) * Math.PI / 2) * (u > 0.75 ? 1 : 1) : (u: number) => 150 * Math.sin(Math.min(1, u * 2.2) * Math.PI / 2) * (1 - 0.35 * Math.max(0, u - 0.7) / 0.3);
  const x0 = S.kind === "basilo" ? 190 : 260, x1 = S.kind === "livyatan" ? 1420 : 1250, wav = S.kind === "basilo" ? 50 : 10;
  const top: P2[] = [], bot: P2[] = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30, x = x0 + (x1 - x0) * u, d = prof(u), w = wav * Math.sin(ph * 2 - u * 6) * (1 - u); top.push([x, cy - d * 0.85 + w]); bot.push([x, cy + d + w]); }
  // tail
  if (S.kind === "ichthy") cel(p, rotAll([[x0 + 30, cy], [x0 - 120, cy - 220], [x0 - 60, cy - 20], [x0 - 60, cy + 20], [x0 - 120, cy + 200], [x0 + 30, cy + 20]] as P2[], sw, [x0, cy]), S.fin, light, { d: 10 });
  else cel(p, rotAll([[x0 + 20, cy - 4], [x0 - 120, cy - 30], [x0 - 150, cy + 6], [x0 - 120, cy + 34], [x0 + 20, cy + 8]] as P2[], sw * 0.5, [x0, cy]), S.fin, light, { d: 6 }); // whale fluke seen edge-on
  flipper(p, [S.kind === "livyatan" ? 1000 : 900, cy + 90], -0.2 + sw, S.kind === "basilo" ? 90 : 170, mul(S.fin, FAR), light);
  const body = chaikin([...top, ...bot.reverse()], 1);
  cel(p, body, S.side, light, { d: 28, tex: () => {
    p.poly(chaikin([...top.map(([x, y]) => [x, y + 30] as P2).slice(2, 26), ...bot.slice(4, 28).map(([x, y]) => [x, y - 6] as P2)], 1), S.side, 0);
    p.poly(chaikin([...bot.slice().reverse().map(([x, y]) => [x, y - (y - cy) * 0.45] as P2), ...bot], 1), S.belly, 0);
    p.poly(chaikin([...top, ...top.slice().reverse().map(([x, y]) => [x, y + (cy - y) * 0.45] as P2)], 1), S.top, 0);
    scales(p, x0, cy - 220, x1, cy + 220, 12, S.top, 41, 0.25); scars(p, (x0 + x1) / 2, cy - 60, "#D8D8D0", 4, 70);
  } });
  if (S.kind === "ichthy") cel(p, [[700, cy - 120], [760, cy - 250], [800, cy - 240], [840, cy - 118]], S.fin, light, { d: 8 });
  flipper(p, [S.kind === "livyatan" ? 980 : 880, cy + 100], 0.05 - sw, S.kind === "basilo" ? 100 : 190, S.fin, light);
  if (S.kind === "ichthy") flipper(p, [460, cy + 70], 0.1 + sw, 110, S.fin, light);
  // head: ichthyosaur beak / Basilosaurus snout / Livyatan block head with a short lower jaw
  const hx = x1, hinge: P2 = S.kind === "livyatan" ? [1180, cy + 90] : [hx - 60, cy + 20], ja = rad(S.kind === "livyatan" ? 30 : 34) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  const snout = S.kind === "ichthy" ? 320 : S.kind === "basilo" ? 260 : 120, tip: P2 = [hx + snout, cy + (S.kind === "livyatan" ? 60 : 10)];
  const lowTip: P2 = S.kind === "livyatan" ? [hx + 60, cy + 150] : [tip[0] - 10, tip[1] + 18];
  p.poly([[hinge[0], hinge[1] - 10], [tip[0], tip[1]], ...J([lowTip, [hinge[0], hinge[1] + 10]])], "#22090E", 0);
  for (let i = 0; i < S.teeth; i++) { const u = (i + 0.5) / S.teeth, q = lerp2(hinge, lowTip, u), [tx, ty] = J([add(q, 0, -4)])[0]; tooth(p, tx, ty, S.toothL * (S.kind === "livyatan" ? 1.6 : 1), false, ja, 0.32); }
  cel(p, J([[hinge[0] - 20, hinge[1]], lowTip, add(lowTip, -40, 30), [hinge[0], hinge[1] + 50]]), S.belly, light, { d: 6, ow: OW * 0.8 });
  for (let i = 0; i < S.teeth; i++) { const u = (i + 0.5) / S.teeth, q = lerp2([hinge[0], hinge[1] - 10], tip, u); tooth(p, q[0], q[1], S.toothL * (S.kind === "livyatan" ? 1.3 : 1), true, 0, 0.32); }
  const headTop = S.kind === "livyatan" ? chaikin([[1060, cy - 170], [1300, cy - 175], [1460, cy - 120], [1490, cy + 20], [1480, cy + 70], [1180, cy + 80], [1060, cy + 40]], 2)
    : chaikin([[hx - 120, cy - 80], [hx, cy - 70], [tip[0] - snout * 0.4, cy - 20], tip, [tip[0] - 20, tip[1] - 2], [hinge[0], hinge[1] - 8], [hx - 140, cy + 20]], 2);
  cel(p, headTop, S.side, light, { d: 12, tex: () => scales(p, hx - 160, cy - 200, tip[0] + 60, cy + 100, 10, S.top, 43, 0.3) });
  const e: P2 = S.kind === "livyatan" ? [1240, cy + 20] : [hx - 40, cy - 30];
  if (S.kind === "ichthy") p.ell(e[0], e[1], 44, 40, mul(S.top, [0.6, 0.6, 0.6]), 5); // the huge eye ring
  beastEye(p, e[0], e[1], S.eye, expr, o.blink ?? 0, S.top, S.iris);
}
export const drawIchthyB: Draw = (p, o) => drawSwimB(p, o, { top: "#2E3E4A", side: "#5A7080", belly: "#D2D8D2", fin: "#22303A", kind: "ichthy", teeth: 16, toothL: 14, iris: "#F2D23A", eye: 1.25 });
export const drawBasiloB: Draw = (p, o) => drawSwimB(p, o, { top: "#2A3036", side: "#5A626A", belly: "#CFCFC6", fin: "#20262C", kind: "basilo", teeth: 9, toothL: 30, iris: "#FF8A1F", eye: 0.8 });
export const drawLivyatanB: Draw = (p, o) => drawSwimB(p, o, { top: "#2A2A30", side: "#4E4E58", belly: "#BEBCB8", fin: "#1E1E24", kind: "livyatan", teeth: 9, toothL: 36, iris: "#E8E2D0", eye: 0.9 });

// ------------------------------------------------------------------ Archelon (Late Cretaceous sea turtle; ~4.6 m)
export function drawArchelonB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.5 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const sk = "#4E5A50", dark = "#222A24", shell = "#3E3A30", lit = "#7A7056";
  cel(p, rotAll([[900, cy + 40], [600, cy + 240], [480, cy + 240], [800, cy + 30]] as P2[], -0.2 + sw * 0.6, [900, cy + 40]), mul(sk, FAR), light, { d: 10 }); // far front flipper, swept back
  cel(p, rotAll([[500, cy + 40], [380, cy + 160], [330, cy + 150], [430, cy + 30]] as P2[], sw * 0.5, [500, cy + 40]), sk, light, { d: 6 });
  const sh = chaikin([[380, cy + 40], [440, cy - 120], [640, cy - 200], [860, cy - 180], [1010, cy - 70], [1030, cy + 50], [700, cy + 90]], 3);
  cel(p, sh, shell, light, { d: 30, tex: () => { for (let i = 0; i < 5; i++) p.stroke(curve([420 + i * 140, cy + 60], [460 + i * 140, cy - 80], [440 + i * 140, cy - 190], 8), 10, dark); p.stroke(curve([420, cy - 60], [700, cy - 210], [1010, cy - 60], 12), 10, dark); scars(p, 650, cy - 120, "#C8C0A8", 4, 60); p.ell(700, cy - 120, 120, 30, lit, 0); } });
  scutes(p, curve([440, cy - 130], [700, cy - 230], [980, cy - 100], 12), 30, dark, light, 7);
  cel(p, tube(curve([1000, cy + 10], [1080, cy - 10], [1140, cy - 20], 6), 60, 50), sk, light, { d: 8, tex: () => scales(p, 980, cy - 80, 1160, cy + 80, 10, dark, 5, 0.4) });
  const hinge: P2 = [1150, cy], ja = rad(32) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1150, cy - 6], [1330, cy + 10], ...J([[1310, cy + 30], [1150, cy + 14]])], "#30080E", 0);
  cel(p, J([[1140, cy + 10], [1310, cy + 24], [1290, cy + 60], [1170, cy + 60]]), sk, light, { d: 4, ow: OW * 0.8 });
  cel(p, chaikin([[1120, cy - 30], [1180, cy - 80], [1280, cy - 70], [1350, cy - 10], [1330, cy + 30], [1300, cy + 10], [1150, cy + 6]], 2), sk, light, { d: 8, tex: () => { scales(p, 1110, cy - 90, 1360, cy + 40, 10, dark, 9, 0.5); p.poly([[1300, cy - 30], [1352, cy - 8], [1330, cy + 34], [1300, cy + 10]], "#1E1A14", 0); } }); // hooked beak
  beastEye(p, 1220, cy - 40, 0.75, expr, o.blink ?? 0, sk, "#F2D23A");
  cel(p, rotAll([[960, cy + 40], [640, cy + 270], [500, cy + 270], [860, cy + 30]] as P2[], -0.15 - sw * 0.6, [960, cy + 40]), sk, light, { d: 10, tex: () => scales(p, 640, cy, 980, cy + 380, 14, dark, 11, 0.4) });
}

// ------------------------------------------------------------------ trilobite (Isotelus rex ~0.7 m) and Eurypterid (Jaekelopterus ~2.5 m)
export function drawTrilobiteB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const sh = "#6A5038", dark = "#2A1E14", lit = "#B08A5A";
  for (let i = 0; i < 14; i++) { const x = 380 + i * 60, sw = Math.sin(ph * 3 + i * 0.7) * 20 * (o.walk ?? 0.5); p.stroke([[x, 820], [x + 20 + sw, 900], [x + 10 + sw, GROUND - 4]], 7, i % 2 ? dark : mul(dark, FAR)); }
  const lift = rad(5) * roar, R = (q: P2[]) => rotAll(q, -lift, [380, 840]); // a small rear-up, the legs stay planted
  const body = R(chaikin([[300, 860], [360, 740], [600, 680], [900, 680], [1160, 710], [1300, 800], [1320, 860]], 2));
  cel(p, body, sh, light, { d: 18, tex: () => { for (let i = 0; i < 12; i++) { const [a, b] = R([[440 + i * 60, 860], [450 + i * 60, 690]]); p.stroke([a, b], 6, dark); } const [c0] = R([[760, 700]]); p.ell(c0[0], c0[1], 380, 26, lit, 0); } });
  for (let i = 0; i < 12; i++) { const [q] = R([[440 + i * 60, 700]]); p.poly(horn([q, add(q, -10, -20), add(q, -30, -36)], 8), dark, 3); }
  const [g1, g2] = R([[1180, 720], [1380, 760]]); p.poly(horn(curve(g1, [g1[0] + 120, g1[1] - 60], g2, 6), 14), dark, 3); // genal spine forward
  const [e] = R([[1150, 700]]); cel(p, blob(e[0], e[1] - 20, 40, 36, 0, 3), "#3A3A2A", light, { d: 4, ow: 8, tex: () => scales(p, e[0] - 40, e[1] - 60, e[0] + 40, e[1] + 10, 7, "#141410", 3, 0.7) });
  if (expr === "shock") p.ell(e[0], e[1] - 20, 14, 14, "#FFFFFF", 3);
  for (const s of [0, 1]) { const [a] = R([[1290, 820 + s * 12]]); p.stroke(curve(a, add(a, 120, -40 - s * 20), add(a, 220, 10 - s * 30), 8), 6, dark); }
}
export function drawEurypteridB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const sh = "#7A4A30", dark = "#2E1A10", lit = "#C08050";
  const segs: P2[] = []; for (let i = 0; i < 12; i++) segs.push([300 + i * 70, cy + 10 * Math.sin(ph * 2 - i * 0.6) * (o.walk ?? 0.6)]);
  cel(p, horn([segs[0], [180, cy + 10], [80, cy + 30]], 24), dark, light, { d: 4, ow: 9 }); // telson spine
  for (let i = 0; i < segs.length; i++) { const w = 40 + 70 * Math.sin(Math.min(1, (i + 1) / 9) * Math.PI / 2); cel(p, blob(segs[i][0], segs[i][1], 46, w, 0, i), i % 2 ? sh : mul(sh, [0.85, 0.85, 0.85]), light, { d: 8, ow: 9, tex: () => p.ell(segs[i][0] - 6, segs[i][1] - w * 0.5, 22, 8, lit, 0) }); }
  const a = Math.sin(ph * 2) * 0.4 * (o.walk ?? 0.6);
  cel(p, rotAll([[1020, cy + 40], [880, cy + 200], [830, cy + 180], [940, cy + 40]] as P2[], a, [1020, cy + 40]), sh, light, { d: 6, ow: 9 }); // swimming paddle
  cel(p, chaikin([[1080, cy - 110], [1240, cy - 90], [1320, cy], [1240, cy + 90], [1080, cy + 110]], 2), sh, light, { d: 12, tex: () => scales(p, 1060, cy - 120, 1330, cy + 120, 12, dark, 9, 0.4) });
  for (const [s, col] of [[1, mul(sh, FAR)], [-1, sh]] as [number, string][]) { // the great claws (chelicerae), open on the attack
    const b: P2 = [1300, cy + 20 * s], m = add(b, 120, -30 * s), t1 = add(m, 140, -60 * s - 40 * roar * s), t2 = add(m, 140, 10 * s + 40 * roar * s);
    cel(p, tube([b, m], 30, 24), col, light, { d: 6 });
    for (const t of [t1, t2]) { cel(p, horn(curve(m, lerp2(m, t, 0.5), t, 6), 18), col, light, { d: 4, ow: 8 }); for (let i = 1; i < 5; i++) { const q = lerp2(m, t, i / 5); p.poly(horn([q, add(q, 6, (t === t1 ? 14 : -14)), add(q, 12, (t === t1 ? 26 : -26))], 5), "#E2C29A", 2); } }
  }
  for (const s of [-1, 1]) { const e: P2 = [1200, cy - 60 * s]; cel(p, blob(e[0], e[1], 30, 22, 0, 3), "#1A1210", light, { d: 3, ow: 7 }); if (expr === "shock") p.ell(e[0], e[1], 10, 10, "#FFFFFF", 2); }
}

// ------------------------------------------------------------------ ground birds: moa (Dinornis, ~3.6 m tall with the neck up), dodo (~1 m)
export function drawGroundBirdB(p: Pen, o: AnimalPose, dodo: boolean) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", bob = bobOf(o, 6), far = walkOf(o, 0.5), near = walkOf(o, 0);
  const C = dodo ? { body: "#6A6A70", dark: "#34343A", lit: "#9A9AA2", beak: "#C8A858", tip: "#4A3A20", leg: "#D8B048" } : { body: "#5A4630", dark: "#2E2216", lit: "#8A6E4C", beak: "#C8B48A", tip: "#3A2E20", leg: "#8A7A5A" };
  const hipY = dodo ? 720 : 520, s = dodo ? 0.55 : 0.85;
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => { const L = digiLeg(hip, s, w.swing, w.lift); cel(p, tube([L[1], L[2], L[3]], 22 * s + 6, 14), col, light, { d: 4, ow: 9 }); for (let i = 0; i < 3; i++) claw(p, add(L[3], 6 + i * 16, 6), 26, 0.2 + i * 0.1, 7); };
  leg([640, hipY + bob], far, mul(C.leg, FAR));
  const body = dodo ? blob(640, 640 + bob, 230, 190, -0.2, 3, 0.1, 1.9, 2.0) : blob(640, 430 + bob, 240, 160, -0.25, 3, 0.1, 1.9, 2.0);
  if (!dodo) hairStrands(p, Array.from({ length: 16 }, (_, i) => [440 + i * 26, 520 + bob + Math.sin(i) * 10] as P2), 140, 3, [C.dark, C.body]); // shaggy hair-like plumage
  cel(p, body, C.body, light, { d: 24, tex: () => { furFlicks(p, 380, dodo ? 450 : 260, 900, dodo ? 830 : 600, 120, 5, [C.dark, C.lit], 30, 5); scars(p, 620, (dodo ? 560 : 360) + bob, "#E0D8C8", 3, 40); } });
  if (dodo) { plumes(p, [[420, 600 + bob], [410, 620 + bob], [420, 640 + bob]], 90, rad(-150), "#E8E2D2", 5, 16); cel(p, blob(620, 640 + bob, 90, 60, -0.4, 7), C.dark, light, { d: 6 }); } // curly tail tuft, stubby wing
  leg([660, hipY + 10 + bob], near, C.leg);
  // neck + head; the strike drops the head
  const nb: P2 = dodo ? [800, 560 + bob] : [820, 360 + bob], hr = rad(dodo ? 25 : 40) * roar, R = (q: P2[]) => rotAll(q, hr, nb);
  const H: P2 = dodo ? [880, 460 + bob] : [880, 110 + bob];
  cel(p, tube(R(curve(nb, lerp2(nb, H, 0.5), H, 8)), dodo ? 80 : 46, dodo ? 70 : 30), C.body, light, { d: 8, tex: () => furFlicks(p, nb[0] - 80, H[1] - 60, H[0] + 80, nb[1] + 60, 40, 7, [C.dark], 20, 4) });
  const hs = dodo ? 1.6 : 1, ja = rad(30) * roar, Hr = R([H])[0], T = (q: P2[]) => rotAll(q.map(([u, v]) => [Hr[0] + u * hs, Hr[1] + v * hs] as P2), hr, Hr), Jt = (q: P2[]) => rotAll(T(q), ja, T([[20, 10]])[0]);
  p.poly([...T([[20, 6], [170, 20]]), ...Jt([[160, 28], [20, 16]])], "#30080E", 0);
  cel(p, Jt([[10, 14], [160, 28], [140, 44], [30, 40]]), C.beak, light, { d: 3, ow: OW * 0.7 });
  cel(p, T(chaikin(dodo ? [[-40, -10], [0, -60], [70, -54], [150, -20], [190, 20], [170, 36], [150, 10], [20, 16], [-30, 20]] : [[-30, -10], [0, -40], [60, -36], [170, 4], [176, 18], [20, 14], [-30, 14]], 2)), C.beak, light, { d: 4, ow: OW * 0.8, tex: () => { p.poly(T([[-40, -20], [40, -50], [50, 20], [-30, 20]]), dodo ? "#C8B8A0" : C.body, 0); if (dodo) p.poly(T([[150, -10], [192, 20], [172, 38], [150, 14]]), C.tip, 0); } });
  const e = T([[20, -16]])[0]; beastEye(p, e[0], e[1], dodo ? 0.75 : 0.6, expr, o.blink ?? 0, C.body, "#F2C230");
}
export const drawMoaB: Draw = (p, o) => drawGroundBirdB(p, o, false);
export const drawDodoB: Draw = (p, o) => drawGroundBirdB(p, o, true);

// ------------------------------------------------------------------ soaring giants: Argentavis (span ~6-7 m), Pelagornis (span ~6.4 m, bony teeth)
export type SoarSpec = { body: string; lit: string; head: string; beak: string; tip: string; span: number; kind: "condor" | "pelagornis" | "phoenix" | "thunder" | "roc"; iris: string };
export function drawSoarB(p: Pen, o: AnimalPose, S: SoarSpec) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", w = o.walk ?? 0, ph = 2 * Math.PI * (o.phase ?? 0);
  const k = roar > 0.05 ? 0.1 : 0.3 + (0.5 - 0.5 * Math.cos(ph) - 0.3) * w, bob = 12 * Math.sin(ph) * w;
  const sh: P2 = [800, 500 + bob], hip: P2 = [640, 540 + bob];
  if (S.kind === "phoenix") { // a trail of fire behind
    const r = rng(Math.floor((o.phase ?? 0) * 40) + 1); for (let i = 0; i < 14; i++) { const x = 560 - i * 34 + r() * 20, y = 540 + bob + (r() - 0.5) * 80; p.g.globalAlpha = 0.8 - i * 0.05; p.ell(x, y, 50 - i * 2.5, 26 - i, i % 3 ? "#FF8A20" : "#FFE07A", 0); } p.g.globalAlpha = 1; }
  featherWing(p, add(sh, 26, -12), add(hip, 50, -10), S.span * 0.96, k, mul(S.body, FAR), S.lit, light, 3, 12);
  plumes(p, Array.from({ length: 7 }, (_, i) => [580, 520 + bob + i * 9] as P2), S.kind === "phoenix" || S.kind === "roc" ? 300 : 170, rad(178), S.kind === "phoenix" ? "#E84A1A" : S.body, 4, 22);
  if (S.kind === "roc") for (let i = 0; i < 3; i++) p.stroke(curve([580, 530 + bob + i * 10], [380, 560 + bob + i * 20 + 20 * Math.sin((o.phase ?? 0) * 6 + i)], [180, 520 + bob + i * 40], 10), 10 - i * 2, S.lit); // long tail streamers
  for (const dx of [0, 20]) { const a = add(hip, 20 + dx, 30), ft: P2 = roar > 0.05 ? add(hip, 320 + dx, 150) : S.kind === "roc" ? add(hip, 40 + dx, 170) : add(hip, -100 + dx, 60); cel(p, tube([a, lerp2(a, ft, 0.5), ft], 26, 12), S.body, light, { d: 4, ow: 9 }); for (let i = 0; i < 4; i++) claw(p, ft, 36, (roar > 0.05 ? -0.6 : S.kind === "roc" ? 0.4 : 2.2) + i * 0.45, 8); }
  if (S.kind === "roc" && roar <= 0.05) cel(p, blob(hip[0] + 70, hip[1] + 230, 90, 70, 0, 3), "#7A7266", light, { d: 14, tex: () => p.stroke([[hip[0] + 30, hip[1] + 200], [hip[0] + 90, hip[1] + 260]], 4, INKB) }); // a boulder in its talons
  cel(p, blob(740, 515 + bob, 150, 72, -0.15, 3, -0.1, 1.8, 2.1), S.body, light, { d: 12, tex: () => furFlicks(p, 590, 430, 900, 600, 60, 3, [S.lit, mul(S.body, [0.6, 0.6, 0.6])], 22, 5) });
  if (S.kind === "condor") plumes(p, Array.from({ length: 8 }, (_, i) => [860 + i * 4, 470 + bob + i * 8] as P2), 50, rad(-30), "#E8E2D6", 5, 14); // the white ruff
  cel(p, tube(curve([860, 495 + bob], [910, 470 + bob], [950, 450 + bob], 6), 44, 34), S.kind === "condor" ? "#9A5A4A" : S.body, light, { d: 6 });
  const hinge: P2 = [990, 465 + bob], ja = rad(30) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  const bl = S.kind === "pelagornis" ? 300 : 150;
  p.poly([[990, 458 + bob], [990 + bl, 470 + bob], ...J([[980 + bl, 484 + bob], [990, 480 + bob]])], "#30080E", 0);
  cel(p, J([[985, 474 + bob], [980 + bl, 482 + bob], [960 + bl, 498 + bob], [1000, 500 + bob]]), S.beak, light, { d: 3, ow: OW * 0.75 });
  if (S.kind === "pelagornis") for (let i = 0; i < 10; i++) { tooth(p, 1010 + i * 28, 470 + bob, 14 + (i % 2) * 8, true, 0, 0.3); const [tx, ty] = J([[1010 + i * 28, 482 + bob]])[0]; tooth(p, tx, ty, 10 + (i % 2) * 6, false, ja, 0.3); } // bony pseudo-teeth
  cel(p, chaikin([[920, 470 + bob], [940, 420 + bob], [1000, 405 + bob], [1050, 420 + bob], [1060, 432 + bob], [995, 478 + bob], [930, 492 + bob]], 1), S.head, light, { d: 8 });
  cel(p, chaikin([[1040, 418 + bob], [990 + bl * 0.6, 422 + bob], [990 + bl, 450 + bob], [1000 + bl, 490 + bob], [978 + bl, 500 + bob], [970 + bl, 470 + bob], [1035, 470 + bob]], 2), S.beak, light, { d: 6, ow: OW * 0.8, tex: () => p.poly([[975 + bl, 445 + bob], [1005 + bl, 470 + bob], [990 + bl, 505 + bob], [968 + bl, 480 + bob]], S.tip, 0) });
  p.poly([[960, 418 + bob], [1050, 412 + bob], [1052, 428 + bob], [975, 436 + bob]], INKB, 0);
  if (S.kind === "phoenix") plumes(p, [[950, 410 + bob], [930, 420 + bob], [970, 404 + bob], [910, 434 + bob]], 120, rad(-150), "#FFB020", 9, 14); // flame crest
  if (S.kind === "roc") plumes(p, [[950, 410 + bob], [930, 420 + bob], [970, 404 + bob], [910, 434 + bob], [890, 444 + bob]], 150, rad(-160), S.tip, 9, 16); // swept crest
  beastEye(p, 1010, 440 + bob, 0.85, expr, o.blink ?? 0, S.head, S.iris);
  featherWing(p, sh, add(hip, 30, 0), S.span, k, S.body, S.lit, light, 7, 12);
  if (S.kind === "phoenix") { p.g.globalAlpha = 0.7; const r = rng(Math.floor((o.phase ?? 0) * 40) + 7); for (let i = 0; i < 26; i++) p.ell(sh[0] - r() * 400, sh[1] - (r() - 0.3) * 420 * Math.cos(Math.PI * k), 10 + r() * 16, 6 + r() * 8, r() < 0.5 ? "#FFE07A" : "#FF6A1A", 0); p.g.globalAlpha = 1; }
  if (S.kind === "thunder" && roar > 0.05) { const r = rng(Math.floor((o.phase ?? 0) * 30) + 3); for (let b = 0; b < 3; b++) { let q: P2 = add(sh, -100 - b * 120, -200); const pts: P2[] = [q]; for (let i = 0; i < 8; i++) { q = add(q, (r() - 0.5) * 90, 60); pts.push(q); } p.stroke(pts, 14, "#FFF6A0"); p.stroke(pts, 5, "#FFFFFF"); } }
}
export const drawArgentavisB: Draw = (p, o) => drawSoarB(p, o, { body: "#2A2420", lit: "#5A4A3E", head: "#9A5A4A", beak: "#D8C08A", tip: "#3A2A1C", span: 560, kind: "condor", iris: "#F2D23A" });
export const drawPelagornisB: Draw = (p, o) => drawSoarB(p, o, { body: "#5A6068", lit: "#C8CCD0", head: "#E8E8E2", beak: "#D8B86A", tip: "#5A4020", span: 600, kind: "pelagornis", iris: "#F2D23A" });

// ------------------------------------------------------------------ great apes on two legs: Gigantopithecus (~3 m, Pleistocene China); the yeti / bigfoot reuse it
export type ApeSpec = { fur: string; dark: string; lit: string; face: string; iris: string; crest?: boolean };
export function drawApeB(p: Pen, o: AnimalPose, S: ApeSpec) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", bob = bobOf(o, 10);
  colLeg(p, o, 640, 640 + bob, 0.5, mul(S.fur, FAR), light, { r0: 90, r1: 54, toes: 3, toe: 22, bend: 30, reach: 160 });
  const arm = (sh: P2, col: string, back: boolean) => { // long arms: hanging to the knuckles, or thrown up on the roar
    const hand: P2 = roar > 0.05 ? add(sh, back ? -60 : 180, -300) : add(sh, back ? -30 : 120, 380), el: P2 = roar > 0.05 ? add(sh, back ? -120 : 160, -110) : add(sh, back ? -60 : 90, 190);
    cel(p, tube([sh, el, hand], 70, 50), col, light, { d: 10, tex: () => furFlicks(p, Math.min(sh[0], hand[0]) - 80, Math.min(sh[1], hand[1]) - 60, Math.max(sh[0], hand[0]) + 80, Math.max(sh[1], hand[1]) + 60, 40, 9, [S.dark, S.lit], 30, 5) });
    cel(p, blob(hand[0], hand[1], 50, 46, 0, 3), S.face, light, { d: 6 }); for (let i = 0; i < 4; i++) claw(p, add(hand, -20 + i * 14, 30), 22, 1.2, 6);
  };
  arm([700, 360 + bob], mul(S.fur, FAR), true);
  const body = chaikin(offs([[540, 640], [520, 470], [580, 320], [720, 260], [860, 300], [900, 420], [860, 560], [760, 660], [620, 680]], 0, bob), 3);
  hairStrands(p, Array.from({ length: 14 }, (_, i) => [540 + i * 24, 640 + bob + Math.sin(i) * 10] as P2), 90, 3, [S.dark, S.fur]);
  cel(p, body, S.fur, light, { d: 26, tex: () => { furFlicks(p, 500, 240, 920, 690, 170, 5, [S.dark, S.lit], 40, 6); p.poly(blob(800, 450 + bob, 70, 110, -0.2, 3), mul(S.face, [0.9, 0.9, 0.9]), 0); scars(p, 650, 380 + bob, "#E0D0C0", 3, 60); } });
  colLeg(p, o, 680, 650 + bob, 0, S.fur, light, { r0: 94, r1: 56, toes: 3, toe: 22, bend: 30, reach: 160 });
  // head: heavy brow, sagittal crest, fangs on the roar
  const H: P2 = [860, 240 + bob], hr = -rad(12) * roar, R = (q: P2[]) => rotAll(offs(q, H[0], H[1]), hr, H);
  cel(p, R(chaikin([[-120, 20], [-100, -90], [-20, -150], [80, -120], [130, -40], [140, 60], [60, 110], [-60, 100]], 2)), S.fur, light, { d: 12, tex: () => furFlicks(p, H[0] - 140, H[1] - 170, H[0] + 160, H[1] + 120, 40, 11, [S.dark, S.lit], 20, 4) });
  if (S.crest) cel(p, R([[-80, -110], [-30, -190], [40, -140]]), S.dark, light, { d: 4, ow: 9 });
  const face = R(chaikin([[20, -70], [120, -60], [170, 0], [170, 80], [100, 120], [30, 90], [0, 0]], 2));
  cel(p, face, S.face, light, { d: 8 });
  const ja = rad(30) * roar, mo = R([[110, 70]])[0];
  if (roar > 0.05) { p.ell(mo[0], mo[1] + 10, 46, 30 * (0.4 + roar), "#30080E", 4); for (const s of [-1, 1]) { tooth(p, mo[0] + s * 26, mo[1] - 8, 28, true, hr, 0.3); tooth(p, mo[0] + s * 22, mo[1] + 30 * roar, 22, false, hr, 0.3); } } else p.stroke(R([[70, 74], [150, 70]]), 6, INKB);
  void ja;
  p.poly(R([[20, -50], [170, -40], [170, -20], [30, -26]]), INKB, 0); // brow ridge
  p.ell(...R([[155, 20]])[0], 16, 12, mul(S.face, [0.5, 0.5, 0.5]), 3);
  const e = R([[90, -12]])[0]; beastEye(p, e[0], e[1], 0.75, expr, o.blink ?? 0, S.face, S.iris);
  arm([760, 340 + bob], S.fur, false);
}
export const drawGigantoB: Draw = (p, o) => drawApeB(p, o, { fur: "#A0582A", dark: "#5A2A12", lit: "#D08A4A", face: "#4A3028", iris: "#FF8A1F", crest: true });

// ------------------------------------------------------------------ registry (x0 / x1 measured with BeastSolo)
export const BEAST_ANCIENT = {
  caveLion: { draw: drawCaveLionB, len: 3.1, x0: 253, x1: 1325 },
  aurochs: { draw: drawAurochsB, len: 3.3, x0: 233, x1: 1335 },
  megaloceros: { draw: drawMegalocB, len: 3.1, x0: 399, x1: 1297 },
  thylacine: { draw: drawThylaB, len: 1.9, x0: 113, x1: 1315 },
  paracer: { draw: drawParacerB, len: 7.4, x0: 349, x1: 1368 },
  andrews: { draw: drawAndrewB, len: 3.4, x0: 256, x1: 1372 },
  gorgon: { draw: drawGorgonB, len: 3.5, x0: 113, x1: 1361 },
  glypto: { draw: drawGlyptoB, len: 3.3, x0: 112, x1: 1184 },
  ichthy: { draw: drawIchthyB, len: 5, x0: 140, x1: 1570, fly: true },
  basilo: { draw: drawBasiloB, len: 18, x0: 34, x1: 1510, fly: true },
  livyatan: { draw: drawLivyatanB, len: 15, x0: 104, x1: 1540, fly: true },
  archelon: { draw: drawArchelonB, len: 4.6, x0: 321, x1: 1353, fly: true },
  trilobite: { draw: drawTrilobiteB, len: 0.7, x0: 317, x1: 1513 },
  eurypterid: { draw: drawEurypteridB, len: 2.5, x0: 78, x1: 1564, fly: true },
  moa: { draw: drawMoaB, len: 2.6, x0: 397, x1: 1059 },
  dodo: { draw: drawDodoB, len: 1.3, x0: 333, x1: 1183 },
  argentavis: { draw: drawArgentavisB, len: 2.4, x0: 368, x1: 1156, fly: true },
  pelagornis: { draw: drawPelagornisB, len: 2.6, x0: 338, x1: 1305, fly: true },
  giganto: { draw: drawGigantoB, len: 1.7, x0: 520, x1: 1041 },
} as const;
void scutes;
