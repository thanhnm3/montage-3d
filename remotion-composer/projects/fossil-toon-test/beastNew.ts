// More beasts (2026-11-05, user: "thêm tối đa các con khác" — sea / Palaeozoic, Ice Age / Cenozoic, fantasy). Same look and API.
//   sea + Palaeozoic: Cameroceras, Opabinia, Shonisaurus, Leedsichthys, Onchopristis, coelacanth, giant ammonite, Tully monster
//   Cenozoic: Doedicurus (beastAncient), Arsinoitherium, Uintatherium, Chalicotherium, Macrauchenia, Toxodon, Arctodus,
//             Ambulocetus, Megalochelys, Hyaenodon
//   fantasy: wendigo, Jörmungandr, eastern dragon, qilin, behemoth, roc (beastAncient drawSoarB), mothman, cockatrice, Fenrir
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, claw, digiLeg, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, colLeg, furFlicks, hairStrands, scars } from "./beastMore";
import { DRG, dragonHead, fire, memWing, plumes } from "./beastWings";
import { flipper } from "./beastExtra";
import { QuadSpec, drawDoedB, drawQuadB, drawSoarB, quadHead } from "./beastAncient";

const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const offs = (pts: P2[], dx: number, dy: number): P2[] => pts.map(([x, y]) => [x + dx, y + dy] as P2);
const bobOf = (o: AnimalPose, a: number) => a * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
type Draw = (p: Pen, o: AnimalPose) => void;
function ribbon(line: P2[], r: (i: number) => number): P2[] {
  const L: P2[] = [], R: P2[] = [], n = line.length - 1;
  line.forEach((q, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(n, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; L.push([q[0] - dy * r(i), q[1] + dx * r(i)]); R.push([q[0] + dy * r(i), q[1] - dx * r(i)]); });
  return [...L, ...R.reverse()];
}

// ================================================================== sea + Palaeozoic (swimmers centred on y ~520)
type FishSpec = { top: string; side: string; belly: string; fin: string; x0: number; x1: number; depth: number; tail: "crescent" | "lobe"; dorsal: number; flipL: number;
  head: "beak" | "gape" | "saw" | "lobe"; teeth: number; toothL: number; iris: string; eye: number; spots?: string };
function drawFishB(p: Pen, o: AnimalPose, S: FishSpec) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.16 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const prof = (u: number) => S.depth * Math.sin(Math.min(1, u * 2.3) * Math.PI / 2) * (1 - 0.35 * Math.max(0, u - 0.72) / 0.28);
  const top: P2[] = [], bot: P2[] = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30, x = S.x0 + (S.x1 - S.x0) * u, d = prof(u); top.push([x, cy - d * 0.85]); bot.push([x, cy + d]); }
  const tc: P2 = [S.x0 + 20, cy];
  if (S.tail === "crescent") cel(p, rotAll([add(tc, 20, -10), add(tc, -150, -S.depth * 1.5), add(tc, -80, 0), add(tc, -150, S.depth * 1.4), add(tc, 20, 14)], sw, tc), S.fin, light, { d: 10 });
  else cel(p, rotAll(chaikin([add(tc, 20, -8), add(tc, -60, -S.depth * 0.9), add(tc, -150, -S.depth * 0.6), add(tc, -170, 0), add(tc, -150, S.depth * 0.6), add(tc, -60, S.depth * 0.9), add(tc, 20, 10)], 2), sw, tc), S.fin, light, { d: 8 }); // lobed (coelacanth) tail
  flipper(p, [S.x0 + (S.x1 - S.x0) * 0.7, cy + S.depth * 0.6], -0.3 + sw, S.flipL, mul(S.fin, FAR), light);
  const body = chaikin([...top, ...bot.slice().reverse()], 1);
  cel(p, body, S.side, light, { d: 26, tex: () => {
    p.poly(chaikin([...bot.slice().reverse().map(([x, y]) => [x, y - (y - cy) * 0.45] as P2), ...bot], 1), S.belly, 0);
    p.poly(chaikin([...top, ...top.slice().reverse().map(([x, y]) => [x, y + (cy - y) * 0.45] as P2)], 1), S.top, 0);
    scales(p, S.x0, cy - S.depth * 1.2, S.x1, cy + S.depth * 1.2, 14, S.top, 41, 0.35);
    if (S.spots) { const r = rng(9); for (let i = 0; i < 40; i++) p.ell(S.x0 + r() * (S.x1 - S.x0), cy - S.depth * 0.8 + r() * S.depth * 1.6, 8 + r() * 10, 6 + r() * 6, S.spots, 0); }
    for (let i = 0; i < 4; i++) p.stroke(curve([S.x1 - 170 - i * 24, cy - S.depth * 0.5], [S.x1 - 182 - i * 24, cy], [S.x1 - 172 - i * 24, cy + S.depth * 0.5], 6), 5, INKB);
    scars(p, (S.x0 + S.x1) / 2, cy - S.depth * 0.5, "#D8D8D0", 3, 60);
  } });
  if (S.dorsal) cel(p, [[S.x0 + (S.x1 - S.x0) * 0.42, cy - prof(0.42) * 0.8], [S.x0 + (S.x1 - S.x0) * 0.47, cy - prof(0.47) - S.dorsal], [S.x0 + (S.x1 - S.x0) * 0.52, cy - prof(0.52) - S.dorsal * 0.9], [S.x0 + (S.x1 - S.x0) * 0.6, cy - prof(0.6) * 0.8]], S.fin, light, { d: 8 });
  flipper(p, [S.x0 + (S.x1 - S.x0) * 0.68, cy + S.depth * 0.7], 0.05 - sw, S.flipL * 1.08, S.fin, light);
  if (S.head === "lobe") for (const x of [0.4, 0.55]) { const b: P2 = [S.x0 + (S.x1 - S.x0) * x, cy + S.depth * 0.8]; cel(p, tube(curve(b, add(b, -20, 60), add(b, -60 + 30 * Math.sin(ph * 2 + x * 6), 120), 6), 26, 10), S.fin, light, { d: 4 }); } // the fleshy lobe fins
  // head
  const hinge: P2 = [S.x1 - 80, cy + 20], ja = rad(S.head === "gape" ? 50 : 32) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  const snout = S.head === "beak" ? 300 : S.head === "saw" ? 80 : S.head === "gape" ? 80 : 60, tip: P2 = [S.x1 + snout, cy + 6];
  p.poly([[hinge[0], hinge[1] - 14], tip, ...J([add(tip, -6, 18), [hinge[0], hinge[1] + 10]])], "#22090E", 0);
  if (S.head === "gape" && roar > 0.05) { p.g.globalAlpha = 0.8; for (let i = 0; i < 10; i++) p.stroke([add(hinge, 10 + i * 12, -10), J([add(hinge, 10 + i * 12, 30)])[0]], 3, "#E8DCC8"); p.g.globalAlpha = 1; } // gill rakers
  for (let i = 0; i < S.teeth; i++) { const q = lerp2(hinge, tip, (i + 0.5) / S.teeth), [tx, ty] = J([add(q, 0, 4)])[0]; tooth(p, tx, ty, S.toothL, false, ja, 0.3); tooth(p, q[0], q[1] - 8, S.toothL, true, 0, 0.3); }
  cel(p, J([[hinge[0] - 30, hinge[1]], add(tip, -6, 16), add(tip, -40, 40), [hinge[0], hinge[1] + 50]]), S.belly, light, { d: 6, ow: OW * 0.8 });
  cel(p, chaikin([[S.x1 - 150, cy - S.depth * 0.75], [S.x1 - 20, cy - S.depth * 0.65], [tip[0] - snout * 0.5, cy - 30], tip, [tip[0] - 20, tip[1] + 4], [hinge[0], hinge[1] - 12], [S.x1 - 170, cy + 20]], 2), S.side, light, { d: 12, tex: () => scales(p, S.x1 - 180, cy - S.depth, tip[0] + 40, cy + 60, 10, S.top, 43, 0.35) });
  if (S.head === "saw") { const b: P2 = [S.x1 + 60, cy - 10], e: P2 = [S.x1 + 60 + 300, cy - 16]; cel(p, tube([b, e], 22, 14), S.side, light, { d: 4, ow: 9 }); for (let i = 0; i < 9; i++) { const q = lerp2(b, e, (i + 0.5) / 9); for (const sd of [-1, 1]) p.poly(horn([add(q, 0, sd * 12), add(q, -8, sd * 30), add(q, -20, sd * 44)], 7), "#EDE2C4", 3); } } // barbed rostrum
  beastEye(p, S.x1 - 60, cy - S.depth * 0.35, S.eye, expr, o.blink ?? 0, S.top, S.iris);
}
export const drawShoniB: Draw = (p, o) => drawFishB(p, o, { top: "#2E3A44", side: "#5E6E7A", belly: "#D2D6D0", fin: "#22303A", x0: 230, x1: 1180, depth: 170, tail: "crescent", dorsal: 40, flipL: 260, head: "beak", teeth: 4, toothL: 10, iris: "#F2D23A", eye: 1.3 });
export const drawLeedsB: Draw = (p, o) => drawFishB(p, o, { top: "#3A4048", side: "#7A848C", belly: "#E0E2DC", fin: "#2A3036", x0: 200, x1: 1300, depth: 150, tail: "crescent", dorsal: 90, flipL: 150, head: "gape", teeth: 0, toothL: 0, iris: "#E8E2D0", eye: 0.9, spots: "#5A6068" });
export const drawOnchoB: Draw = (p, o) => drawFishB(p, o, { top: "#4A4436", side: "#8A806A", belly: "#E2DAC4", fin: "#3A3428", x0: 200, x1: 1150, depth: 90, tail: "crescent", dorsal: 110, flipL: 230, head: "saw", teeth: 5, toothL: 10, iris: "#F2D23A", eye: 0.8 });
export const drawCoelaB: Draw = (p, o) => drawFishB(p, o, { top: "#1E2A3E", side: "#3A4E6E", belly: "#8A9AB0", fin: "#1A2236", x0: 300, x1: 1200, depth: 160, tail: "lobe", dorsal: 90, flipL: 130, head: "lobe", teeth: 5, toothL: 12, iris: "#9AE0FF", eye: 1.1, spots: "#E8E8E2" });

// Cameroceras (Ordovician; a straight-shelled nautiloid, maybe 6+ m) and a giant ammonite (Parapuzosia; shell ~2 m)
export function drawCameroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const shell = "#C8A878", band = "#7A4A2A", sk = "#9A4A3A";
  const tent = (i: number, col: string) => { const pts: P2[] = []; let q: P2 = [1120, cy + 10 + (i - 4) * 10], a = rad(-30 + i * 8); for (let j = 0; j < 12; j++) { pts.push(q); a += 0.08 * Math.sin(ph * 2 + i + j * 0.5) + (roar > 0.05 ? (i < 4 ? -0.03 : 0.03) : 0.02); q = add(q, Math.cos(a) * (30 + 10 * roar), Math.sin(a) * (30 + 10 * roar)); } cel(p, tube(pts, 18, 5), col, light, { d: 4, ow: 8, rim: false }); };
  for (let i = 0; i < 9; i += 2) tent(i, mul(sk, FAR));
  const cone = [[1080, cy - 120], [200, cy - 30], [140, cy], [200, cy + 30], [1080, cy + 120]] as P2[];
  cel(p, cone, shell, light, { d: 20, tex: () => { for (let i = 0; i < 22; i++) { const x = 200 + i * 40; p.stroke([[x, cy - 30 - i * 4.2], [x, cy + 30 + i * 4.2]], 4, band); } for (let i = 0; i < 8; i++) p.poly([[260 + i * 110, cy - 50 - i * 8], [300 + i * 110, cy - 56 - i * 8], [300 + i * 110, cy + 56 + i * 8], [260 + i * 110, cy + 50 + i * 8]], mul(band, [1.2, 1.2, 1.2]), 0); scars(p, 700, cy - 60, "#F2E6D0", 3, 50); } });
  cel(p, blob(1110, cy, 70, 120, 0, 3), sk, light, { d: 12, tex: () => scales(p, 1040, cy - 120, 1180, cy + 120, 10, mul(sk, [0.5, 0.5, 0.5]), 5, 0.5) });
  cel(p, [[1040, cy - 130], [1180, cy - 110], [1150, cy - 70]], mul(sk, [0.7, 0.7, 0.7]), light, { d: 4, ow: 8 }); // the hood
  for (let i = 1; i < 9; i += 2) tent(i, sk);
  beastEye(p, 1110, cy - 40, 1.2, expr, o.blink ?? 0, sk, "#F2D23A");
  if (roar > 0.05) p.poly(horn([[1160, cy + 20], [1210, cy + 30], [1230, cy + 60]], 18), "#1A1210", 3); // the beak
}
export function drawAmmoniteB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", c: P2 = [640, 500];
  const sk = "#A85A3A", shell = "#D8B07A", rib = "#7A4A22";
  for (let i = 0; i < 10; i++) { const pts: P2[] = []; let q: P2 = [990, 560 + (i - 5) * 12], a = rad(-20 + i * 10); for (let j = 0; j < 10; j++) { pts.push(q); a += 0.1 * Math.sin(ph * 2 + i + j * 0.6) + 0.04 * (1 - roar); q = add(q, Math.cos(a) * (34 + 14 * roar), Math.sin(a) * (34 + 14 * roar)); } cel(p, tube(pts, 18, 5), i % 2 ? sk : mul(sk, FAR), light, { d: 4, ow: 8, rim: false }); }
  const R = 380;
  cel(p, blob(c[0], c[1], R, R, 0, 3, 0, 2, 2), shell, light, { d: 40, tex: () => {
    for (let w = 0; w < 4; w++) { const rr = R * (1 - w * 0.24); for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; p.stroke([add(c, Math.cos(a) * rr * 0.78, Math.sin(a) * rr * 0.78), add(c, Math.cos(a + 0.08) * rr, Math.sin(a + 0.08) * rr)], 6, rib); } }
    const sp: P2[] = []; for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 7, rr = 20 + (R / (Math.PI * 7)) * a; sp.push(add(c, Math.cos(a) * rr, Math.sin(a) * rr)); } p.stroke(sp, 9, INKB);
    scars(p, c[0] - 100, c[1] - 200, "#F2E6D0", 3, 80);
  } });
  cel(p, blob(950, 560, 90, 130, 0, 5), sk, light, { d: 10, tex: () => scales(p, 860, 430, 1040, 690, 10, mul(sk, [0.5, 0.5, 0.5]), 7, 0.5) });
  beastEye(p, 960, 500, 1.1, expr, o.blink ?? 0, sk, "#F2D23A");
}
// Opabinia (Cambrian, ~7 cm: five eyes, a clawed trunk) and the Tully monster (Carboniferous, ~35 cm)
export function drawOpabiniaB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 560;
  const sk = "#B86A5A", dark = "#4A1E18", lit = "#E8A08A";
  for (let i = 0; i < 14; i++) { const x = 300 + i * 52, a = Math.sin(ph * 2 - i * 0.6) * 0.5 * (o.walk ?? 0.6); for (const s of [-1, 1]) cel(p, rotAll([[x, cy + s * 40], [x - 60, cy + s * 130], [x + 30, cy + s * 120]], a * s, [x, cy + s * 40]), s > 0 ? sk : mul(sk, FAR), light, { d: 4, ow: 7, rim: false }); }
  for (const [a, b] of [[-30, -70], [30, -70]] as P2[]) cel(p, [[260, cy], [260 + a * 3, cy + b], [200, cy + b * 0.3]], mul(sk, [0.8, 0.8, 0.8]), light, { d: 4, ow: 7 }); // tail fan
  cel(p, chaikin([[260, cy], [320, cy - 60], [1000, cy - 60], [1060, cy], [1000, cy + 60], [320, cy + 60]], 2), sk, light, { d: 14, tex: () => { for (let i = 0; i < 14; i++) p.stroke([[320 + i * 52, cy - 60], [320 + i * 52, cy + 60]], 4, dark); p.ell(660, cy - 40, 320, 10, lit, 0); } });
  for (let i = 0; i < 5; i++) { const b: P2 = [1000 + i * 14, cy - 50], e = add(b, -40 + i * 26, -80 - (i % 2) * 30); p.stroke([b, e], 10, sk); cel(p, blob(e[0], e[1], 20, 16, 0, i), "#1A1210", light, { d: 2, ow: 6, tex: () => p.ell(e[0] + 4, e[1] - 4, 6, 5, "#E8C24A", 0) }); } // five eyes
  const tr: P2[] = []; let q: P2 = [1060, cy + 10], a = rad(10); for (let j = 0; j < 12; j++) { tr.push(q); a += roar > 0.05 ? -0.05 : 0.12 * Math.sin(ph + j * 0.3) + 0.05; q = add(q, Math.cos(a) * 34, Math.sin(a) * 34); }
  cel(p, tube(tr, 20, 12), sk, light, { d: 4, tex: () => tr.forEach((t) => p.stroke([add(t, -14, -14), add(t, 14, 14)], 3, dark)) });
  const e = tr[tr.length - 1]; for (const s of [-1, 1]) p.poly(horn([e, add(e, 30, s * (20 + 20 * roar)), add(e, 60, s * (10 + 30 * roar))], 10), "#E2C29A", 3); // the claw
  void expr;
}
export function drawTullyB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, cy = 520;
  const sk = "#7A6A8A", dark = "#2A2234", lit = "#B8A8C8";
  const line = curve([200, cy + 20 * Math.sin(ph)], [600, cy - 20 * Math.sin(ph + 1)], [1000, cy], 20);
  cel(p, [[220, cy], [120, cy - 120], [150, cy], [120, cy + 120]], mul(sk, [0.8, 0.8, 0.8]), light, { d: 4, ow: 8 }); // tail fin
  cel(p, ribbon(line, (i) => 30 + 50 * Math.sin(Math.min(1, (i / 20) * 1.5) * Math.PI / 2)), sk, light, { d: 14, tex: () => { line.forEach((q, i) => { if (i % 2 === 0) p.stroke([add(q, 0, -60), add(q, 0, 60)], 3, dark); }); p.ell(600, cy - 30, 300, 10, lit, 0); } });
  for (const s of [-1, 1]) cel(p, [add(line[8], -40, 0), add(line[8], -60, s * 120), add(line[8], 40, s * 90)], mul(sk, [0.85, 0.85, 0.85]), light, { d: 3, ow: 7, rim: false });
  const bar: P2 = [900, cy - 70]; p.stroke([add(bar, 0, 50), add(bar, 0, -40)], 12, sk); for (const d of [-30, 30]) cel(p, blob(bar[0] + d, bar[1] - 40, 22, 22, 0, 3), "#1A1210", light, { d: 2, ow: 6, tex: () => p.ell(bar[0] + d + 4, bar[1] - 44, 7, 6, "#F2D23A", 0) }); // eyes on the bar
  const tr = curve([1000, cy], [1150, cy - 20 - 40 * roar], [1300 + 60 * roar, cy + 10], 12);
  cel(p, tube(tr, 14, 8), sk, light, { d: 3 });
  const e = tr[tr.length - 1]; for (const s of [-1, 1]) { const tp = add(e, 50, s * (16 + 30 * roar)); p.poly([e, tp, add(e, 30, 0)], "#E2D2AA", 3); for (let i = 0; i < 4; i++) tooth(p, ...lerp2(e, tp, (i + 1) / 5), 10, s > 0, 0, 0.3); }
}

// ================================================================== Cenozoic mammals (quad bodies)
const QB = (o: Partial<QuadSpec>): QuadSpec => ({ fur: "#6A5A48", dark: "#33281E", lit: "#9A8A74", belly: "#B8A890", skin: "#1A1410", iris: "#FF8A1F",
  x0: 420, x1: 980, ys: 420, yh: 450, yb: 660, hump: 30, hind: [80, 44], front: [80, 46], bendH: 24, bendF: -6, toes: 3, toe: 18,
  head: { L: 240, h: 140, type: "bovine" }, neck: [50, 0, 100], tail: "short", bob: 5, ...o });
export const drawArsinoB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#4E4A44", dark: "#24221E", lit: "#7A766E", scaly: true, charge: true,
  head: { L: 260, h: 150, type: "bovine", ears: true },
  postFn: (p2, o2, light, bob) => { const roar = o2.roar ?? 0, H: P2 = [1040 + 60 * roar * 0, 480 + bob + 60 * roar];
    for (const [d, col] of [[16, mul("#3A3226", FAR)], [0, "#4A4032"]] as [number, string][]) cel(p2, horn(curve(add(H, 150 + d, -40), add(H, 230 + d, -150 - 30 * roar), add(H, 200 + d, -290 + 60 * roar), 12), 46), col, light, { d: 6, ow: 10, tex: () => { for (let i = 0; i < 5; i++) p2.stroke([add(H, 160 + i * 14 + d, -60 - i * 40), add(H, 210 + i * 10 + d, -70 - i * 40)], 4, INKB); } }); } })); // the twin hollow horns over the nose (~30 Ma)
export const drawUintaB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#5A5450", dark: "#2A2624", lit: "#8A8480", scaly: true, x1: 960, ys: 400, hump: 50,
  head: { L: 280, h: 140, type: "big", sabre: 1.2, fangs: 0, ears: true },
  postFn: (p2, o2, light, bob) => { const H: P2 = [1010, 470 + bob]; for (const [dx, dy, l] of [[60, -120, 50], [140, -120, 40], [220, -90, 34]] as [number, number, number][]) for (const d of [10, 0]) cel(p2, blob(H[0] + dx + d, H[1] + dy - l * 0.4, l * 0.55, l, -0.3, dx), d ? mul("#4A4440", FAR) : "#6A6460", light, { d: 4, ow: 8 }); } })); // three pairs of knobs + sabre tusks (Eocene, ~4 m)
export const drawChaliB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#7A5A3A", dark: "#3E2A18", lit: "#A88A60", x0: 440, x1: 960, ys: 330, yh: 520, yb: 680, hump: 30,
  hind: [70, 34], front: [86, 48], bendH: 36, bendF: -26, toes: 3, toe: 60, head: { L: 250, h: 120, type: "horse", ears: true }, neck: [80, 80, 80], tail: "short" })); // long clawed forelimbs, sloping back (~2.6 m)
export const drawMacrauB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#9A7A54", dark: "#4A3420", lit: "#C8A87A", x0: 440, x1: 960, ys: 400, yh: 410, yb: 600, hump: 10, hind: [56, 24], front: [56, 24], bendH: 40, bendF: -8, toes: 3, toe: 16,
  head: { L: 200, h: 100, type: "horse", ears: true }, neck: [120, 220, 66], tail: "short",
  postFn: (p2, o2, light, bob) => { const roar = o2.roar ?? 0, N: P2 = [1290, 140 + bob]; const tr = curve(N, add(N, 60, 30 + 20 * Math.sin(2 * Math.PI * (o2.phase ?? 0))), add(N, 50 - 40 * roar, 110 - 60 * roar), 8); cel(p2, tube(tr, 22, 12), "#9A7A54", light, { d: 4, tex: () => tr.forEach((q, i) => { if (i > 1) p2.stroke([add(q, -16, 0), add(q, 16, 0)], 3, "#4A3420"); }) }); } })); // camel-like, a short trunk (~3 m)
export const drawToxoB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#5E5246", dark: "#2E2620", lit: "#8E8270", scaly: true, x0: 400, x1: 990, ys: 430, yh: 440, yb: 680, hump: 40, hind: [86, 52], front: [88, 54],
  head: { L: 260, h: 170, type: "bovine", ears: true, fangs: 3 }, neck: [40, -20, 120], tail: "short", charge: true })); // rhino-hippo-like (~2.7 m)
export const drawArctoB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#4A3222", dark: "#22160E", lit: "#7A5A3E", belly: "#6A4E38", iris: "#FF6A1F", x0: 420, x1: 960, ys: 330, yh: 400, yb: 560, hump: 60,
  hind: [78, 44], front: [80, 46], bendH: 26, bendF: -8, toes: 5, toe: 30, head: { L: 210, h: 150, type: "dog", fangs: 6, ears: true }, neck: [70, 40, 100], tail: "short", shag: 80, bob: 8 })); // short-faced bear, long legs (~3.4 m standing)
export const drawAmbuloB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#4A4436", dark: "#22201A", lit: "#7A7460", belly: "#9A9480", x0: 380, x1: 900, ys: 700, yh: 700, yb: 840, hump: 10, hind: [54, 30], front: [50, 28], bendH: 60, bendF: -40, toes: 5, toe: 24,
  head: { L: 380, h: 110, type: "big", fangs: 9, open: 50 }, neck: [70, 10, 70], tail: "stiff", scaly: true, bob: 3 })); // the walking whale (Eocene, ~3 m)
export const drawHyaenoB: Draw = (p, o) => drawQuadB(p, o, QB({ fur: "#6A5A46", dark: "#2E2418", lit: "#9A8A70", belly: "#C8B898", iris: "#F2D23A", x0: 420, x1: 940, ys: 520, yh: 520, yb: 680, hump: 20, hind: [56, 24], front: [58, 26], bendH: 50, bendF: -12, toes: 4, toe: 22,
  head: { L: 330, h: 150, type: "dog", fangs: 7, ears: true, open: 60 }, neck: [60, 20, 84], tail: "long", stripes: 6, bob: 7 })); // Hyaenodon gigas (~3 m, a huge skull)
export function drawTortoiseB(p: Pen, o: AnimalPose) { // Megalochelys atlas (Pleistocene; shell ~2.7 m)
  const light = o.light ?? rad(-120), bob = bobOf(o, 3), roar = o.roar ?? 0, expr = o.expr ?? "angry", sk = "#6A6450", dark = "#2E2A20", shell = "#5A4A32", lit = "#8A7650";
  for (const [x, off] of [[560, 0.5], [900, 0]] as [number, number][]) colLeg(p, o, x, 820 + bob, off, mul(sk, FAR), light, { r0: 70, r1: 56, toes: 4, toe: 18, bend: 6, reach: 70, tex: dark });
  const sh = chaikin(offs([[400, 830], [430, 620], [560, 480], [760, 450], [920, 500], [1000, 640], [1010, 830], [720, 850]], 0, bob), 3);
  cel(p, sh, shell, light, { d: 34, tex: () => { const sc: P2[] = [[560, 580], [720, 520], [880, 590], [500, 720], [660, 680], [820, 700], [960, 740]]; sc.forEach(([x, y], i) => { const q = add([x, y], 0, bob); p.poly([add(q, -70, 0), add(q, -40, -50), add(q, 40, -50), add(q, 70, 0), add(q, 40, 50), add(q, -40, 50)], dark, 0); p.poly([add(q, -56, 0), add(q, -32, -40), add(q, 32, -40), add(q, 56, 0), add(q, 32, 40), add(q, -32, 40)], i % 2 ? lit : mul(lit, [0.9, 0.9, 0.9]), 0); for (let k = 1; k < 3; k++) p.ell(q[0], q[1], 56 - k * 16, 40 - k * 12, null, 2); }); scars(p, 700, 520 + bob, "#E8D8B8", 4, 70); } });
  for (const [x, off] of [[600, 0], [940, 0.5]] as [number, number][]) colLeg(p, o, x, 830 + bob, off, sk, light, { r0: 74, r1: 58, toes: 4, toe: 18, bend: 6, reach: 70, tex: dark });
  const nb: P2 = [1000, 720 + bob], H: P2 = [1150, 640 + bob - 60 * roar];
  cel(p, tube(curve(nb, lerp2(nb, H, 0.5), H, 8), 56, 44), sk, light, { d: 8, tex: () => { scales(p, 980, 580, 1200, 780, 10, dark, 3, 0.5); for (let i = 0; i < 5; i++) p.stroke(curve(add(nb, i * 30, -40), add(nb, i * 30 + 10, 0), add(nb, i * 30, 40), 6), 3, dark); } });
  cel(p, chaikin(offs([[-40, -30], [10, -70], [100, -60], [150, -10], [140, 30], [40, 40], [-30, 30]], H[0], H[1]), 2), sk, light, { d: 8, tex: () => { scales(p, H[0] - 50, H[1] - 80, H[0] + 160, H[1] + 50, 8, dark, 5, 0.5); p.poly(offs([[110, -30], [152, -6], [140, 30], [110, 10]], H[0], H[1]), "#1E1A14", 0); } });
  if (roar > 0.05) p.ell(H[0] + 110, H[1] + 24, 26, 14, "#30080E", 3);
  beastEye(p, H[0] + 50, H[1] - 26, 0.7, expr, o.blink ?? 0, sk, "#F2D23A");
}

// ================================================================== fantasy
// wendigo: a gaunt, antlered deer-skull creature on long legs, ribs showing, long clawed hands
export function drawWendigoB(p: Pen, o: AnimalPose) {
  p.g.save(); p.g.translate(800 * 0.25, GROUND * 0.25); p.g.scale(0.75, 0.75); // 0.75 about the ground: room for the antlers
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", bob = bobOf(o, 10), far = walkOf(o, 0.5), near = walkOf(o, 0);
  const sk = "#8A8078", dark = "#2A2420", bone = "#E8DCC0", fur = "#3A302A";
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => { const L = digiLeg(hip, 0.9, w.swing, w.lift); cel(p, tube([L[0], L[1], L[2]], 30, 18), col, light, { d: 6 }); cel(p, tube([L[2], L[3]], 16, 12), col, light, { d: 4 }); for (let i = 0; i < 3; i++) claw(p, add(L[3], 6 + i * 16, 4), 36, 0.2 + i * 0.1, 7); };
  leg([660, 560 + bob], far, mul(sk, FAR));
  const arm = (sh: P2, col: string, back: boolean) => { const hand: P2 = roar > 0.05 ? add(sh, back ? 60 : 260, -220) : add(sh, back ? 30 : 140, 360), el = roar > 0.05 ? add(sh, back ? -40 : 140, -80) : add(sh, back ? -20 : 90, 180);
    cel(p, tube([sh, el, hand], 22, 14), col, light, { d: 4 }); for (let i = 0; i < 4; i++) p.poly(horn(curve(add(hand, i * 6, i * 4), add(hand, 40 + i * 6, 40), add(hand, 60 + i * 4, 90 - 10 * i), 6), 7), "#1A1410", 2); };
  arm([760, 300 + bob], mul(sk, FAR), true);
  const torso = chaikin(offs([[620, 560], [600, 420], [660, 260], [780, 220], [860, 280], [830, 420], [760, 560]], 0, bob), 2);
  hairStrands(p, Array.from({ length: 10 }, (_, i) => [610 + i * 22, 540 + bob] as P2), 60, 3, [fur, dark]);
  cel(p, torso, sk, light, { d: 16, tex: () => { for (let i = 0; i < 7; i++) p.stroke(curve([680, 300 + i * 32 + bob], [760, 290 + i * 32 + bob], [830, 320 + i * 30 + bob], 6), 6, dark); furFlicks(p, 590, 200, 870, 560, 40, 5, [fur], 26, 5); } }); // ribs
  leg([700, 570 + bob], near, sk);
  // the antlered deer skull
  const H: P2 = [830, 200 + bob], hr = -rad(10) * roar, R = (q: P2[]) => rotAll(offs(q, H[0], H[1]), hr, H);
  for (const [d, col] of [[14, mul(bone, FAR)], [0, bone]] as [number, string][]) { const base = R([[20 + d, -60]])[0]; const beam = curve(base, add(base, -60, -120), add(base, -20, -260), 10); cel(p, tube(beam, 12, 6), col, light, { d: 3, ow: 8 }); for (let i = 3; i < beam.length; i += 2) { const q = beam[i]; p.stroke(curve(q, add(q, 30 + i * 4, -20), add(q, 50 + i * 6, -60), 4), 9, col); p.stroke(curve(q, add(q, 30 + i * 4, -20), add(q, 50 + i * 6, -60), 4), 3, INKB); } }
  const ja = rad(30) * roar; p.poly(R([[40, 40], [200, 60], [190, 76], [40, 70]]), "#1A0608", 0);
  cel(p, rotAll(R([[30, 60], [190, 70], [170, 96], [50, 96]]), ja, R([[30, 60]])[0]), bone, light, { d: 4, ow: 8 });
  for (let i = 0; i < 6; i++) tooth(p, ...R([[60 + i * 22, 60]])[0], 16, true, hr, 0.3);
  cel(p, R(chaikin([[-30, 20], [-10, -60], [80, -70], [210, 20], [200, 60], [40, 64]], 2)), bone, light, { d: 8, tex: () => { p.ell(...R([[60, -20]])[0], 30, 26, "#100808", 0); p.ell(...R([[180, 30]])[0], 10, 8, "#100808", 0); for (let i = 0; i < 3; i++) p.stroke(R([[90 + i * 20, -40], [100 + i * 20, 10]]), 3, "#9A8A6A"); } });
  p.g.globalAlpha = 0.85; p.ell(...R([[60, -20]])[0], 12, 10, "#E8F2FF", 0); p.g.globalAlpha = 1; // the cold glowing eye
  void expr; arm([800, 290 + bob], sk, false);
  p.g.restore();
}
// Jörmungandr: the world serpent breaching in great arches, its back spined (swims, cy ~600)
const JOR = { ...DRG, skin: "#2E3A44", back: "#141A22", belly: "#8A9AA6", scale: "#3E4A56", mem: "#2A3A4A", horn: "#C8D0D8", mouth: "#140608", gum: "#4A6A8A", scar: "#B8C8D8" };
export function drawJormunB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, cy = 640;
  const line: P2[] = []; for (let i = 0; i <= 60; i++) { const u = i / 60; line.push([40 + u * 1180, cy - Math.abs(Math.sin(u * 3 * Math.PI - ph * 0.5)) * 280 * (0.4 + 0.6 * u) + 40]); }
  const r = (i: number) => 14 + 70 * Math.sin(Math.min(1, (i / 60) * 1.3) * Math.PI / 2);
  p.g.save(); p.path([[0, 0], [1600, 0], [1600, cy + 60], [0, cy + 60]], true); p.g.clip(); // only above the waterline
  cel(p, ribbon(line, r), JOR.skin, light, { d: 20, tex: () => { scales(p, 30, 200, 1300, 760, 14, JOR.back, 5, 0.55); line.forEach((q, i) => { if (i % 3) return; p.ell(q[0], q[1] + r(i) * 0.6, r(i) * 0.5, r(i) * 0.2, JOR.belly, 0); }); } });
  scutes(p, line.slice(2, 58).map((q, i) => add(q, 0, -r(i + 2))), 40, JOR.back, light, 9);
  p.g.restore();
  p.g.globalAlpha = 0.6; for (let i = 0; i < 26; i++) { const x = 30 + i * 48; p.ell(x, cy + 60 + Math.sin(i + ph) * 6, 30, 8, "#E8F4FF", 0); } p.g.globalAlpha = 1; // foam at the waterline
  const H = add(line[60], 30, -40 - 50 * roar), m = dragonHead(p, o, H, rad(-12) - rad(10) * roar, light, JOR);
  if (roar > 0.05) { p.g.globalAlpha = 0.55; for (let i = 0; i < 10; i++) p.ell(m[0] + 30 + i * 26, m[1] + Math.sin(i) * 20, 14 + i * 3, 10 + i * 2, "#CFE4F4", 3); p.g.globalAlpha = 1; }
}
// eastern (lung) dragon: a long sinuous body that flies without wings, small clawed legs, antlers, whiskers, a flame mane
const LUNG = { ...DRG, skin: "#B8302A", back: "#5A0E0A", belly: "#F2C84A", scale: "#D8502A", mem: "#E8A030", horn: "#F2E6C8", mouth: "#2A0608", gum: "#8A1A20", scar: "#F2D8A0" };
export function drawLungB(p: Pen, o: AnimalPose) {
  p.g.save(); p.g.translate(800 * 0.15, 500 * 0.15); p.g.scale(0.85, 0.85); // room for the whiskers and the fire
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, cy = 500;
  const line: P2[] = []; for (let i = 0; i <= 50; i++) { const u = i / 50; line.push([60 + u * 1100, cy + 150 * Math.sin(u * 2.4 * Math.PI - ph) * (1 - u * 0.5)]); }
  const r = (i: number) => 10 + 52 * Math.sin(Math.min(1, (i / 50) * 1.6) * Math.PI / 2);
  const legAt = (i: number, col: string) => { const q = line[i], ft = add(q, 30, 110); cel(p, tube([add(q, 0, 20), add(q, -20, 70), ft], 18, 10), col, light, { d: 3, ow: 8 }); for (let k = 0; k < 4; k++) claw(p, ft, 26, 0.2 + k * 0.3, 6); };
  legAt(16, mul(LUNG.skin, FAR)); legAt(38, mul(LUNG.skin, FAR));
  plumes(p, line.slice(4, 48).map((q, i) => add(q, 0, -r(i + 4))), 60, rad(-150), LUNG.mem, 5, 14); // flame mane along the spine
  cel(p, ribbon(line, r), LUNG.skin, light, { d: 16, tex: () => { scales(p, 40, 250, 1200, 760, 12, LUNG.back, 5, 0.55); line.forEach((q, i) => { if (i % 2) return; p.ell(q[0], q[1] + r(i) * 0.6, r(i) * 0.5, r(i) * 0.22, LUNG.belly, 0); }); } });
  plumes(p, [line[0], line[1], line[2]], 120, rad(180), LUNG.mem, 7, 20); // tail tuft
  legAt(20, LUNG.skin); legAt(42, LUNG.skin);
  const H = add(line[50], 30, -20), m = dragonHead(p, o, H, rad(-6) - rad(8) * roar, light, LUNG);
  for (let i = 0; i < 2; i++) { const b = add(H, 220, 20 + i * 14); p.stroke(curve(b, add(b, 120, 30 + 40 * Math.sin(ph + i)), add(b, 230, -20 + 60 * Math.sin(ph * 1.3 + i)), 10), 5, LUNG.belly); } // whiskers
  for (const d of [14, 0]) { const b = add(H, 40 + d, -60), beam = curve(b, add(b, -60, -80), add(b, -140, -120), 8); cel(p, tube(beam, 10, 5), d ? mul(LUNG.horn, FAR) : LUNG.horn, light, { d: 3, ow: 7 }); for (let i = 3; i < 8; i += 2) p.stroke([beam[i], add(beam[i], 10, -40)], 7, LUNG.horn); } // deer antlers
  plumes(p, [add(H, 20, -30), add(H, 0, -10), add(H, -20, 10), add(H, -30, 30)], 90, rad(-170), LUNG.mem, 9, 16);
  fire(p, m, rad(10), 420, roar, o.phase ?? 0);
  p.g.restore();
}
// qilin: a scaled deer-horse with hooves, a single horn, a flame mane and tail
export const drawQilinB: Draw = (p, o) => drawQuadB(p, o, { fur: "#3E6A4A", dark: "#1A3422", lit: "#7AA884", belly: "#E8D08A", skin: "#1A1410", iris: "#FFD23A", mane: "#E8703A", horn: "#F2E2B8",
  x0: 440, x1: 980, ys: 400, yh: 420, yb: 600, hump: 20, hind: [58, 22], front: [56, 22], bendH: 40, bendF: -6, toes: 2, toe: 18, scaly: true, charge: true,
  head: { L: 240, h: 120, type: "horse", horns: "unicorn" }, neck: [100, 160, 84], tail: "long", bob: 7,
  tailFn: (p2, end, o2, light) => plumes(p2, [end, add(end, 0, -40), add(end, 6, -80), add(end, -6, 30)], 140, rad(100), "#F2A030", 3, 18),
  postFn: (p2, o2, light, bob) => { const r = rng(Math.floor((o2.phase ?? 0) * 20) + 3); for (let i = 0; i < 4; i++) { const x = [520, 560, 860, 900][i]; p2.g.globalAlpha = 0.75; p2.ell(x + 40, 640 + bob, 26 + r() * 8, 16, "#FFB040", 0); p2.g.globalAlpha = 1; } } }); // flames curl at its hooves
// behemoth: a titanic armoured bull-hippo
export const drawBehemothB: Draw = (p, o) => drawQuadB(p, o, { fur: "#4A3E36", dark: "#1E1814", lit: "#7A6A5E", belly: "#8A7A6A", skin: "#120E0C", iris: "#FF3A1A", horn: "#E2D6BA",
  x0: 360, x1: 1000, ys: 380, yh: 420, yb: 700, hump: 80, hind: [110, 76], front: [116, 80], bendH: 14, bendF: 0, toes: 4, toe: 22, scaly: true, charge: true,
  head: { L: 300, h: 200, type: "bovine", horns: "bull", fangs: 4 }, neck: [30, -30, 150], tail: "tuft", bob: 4,
  postFn: (p2, o2, light, bob) => scutes(p2, curve([400, 380 + bob], [640, 260 + bob], [960, 330 + bob], 16), 70, "#1E1814", light, 31) });
export const drawRocB: Draw = (p, o) => drawSoarB(p, o, { body: "#5A3A22", lit: "#C89A5A", head: "#E8D8B0", beak: "#E2B84A", tip: "#3A2A14", span: 620, kind: "roc", iris: "#F2C230" });
// mothman: a dark humanoid on moth wings with glowing red eyes
export function drawMothmanB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, ph = 2 * Math.PI * (o.phase ?? 0), w = o.walk ?? 0, bob = 14 * Math.sin(ph) * w;
  const sk = "#2A2428", dark = "#100C0E", wing = "#4A3E36", wingLit = "#8A7A62";
  const wingAt = (c: P2, k: number, col: string) => { const up = Math.cos(Math.PI * (0.2 + 0.6 * (0.5 - 0.5 * Math.cos(ph)) * w)) * (1 + 0.3 * roar);
    for (const [dy, s] of [[-1, 1], [1, 0.7]] as [number, number][]) { const pts = chaikin([c, add(c, -200 * s * k, dy * 260 * up * s), add(c, -360 * s * k, dy * 200 * up * s - 40), add(c, -300 * s * k, dy * 40), add(c, -80 * k, dy * 20)], 2);
      cel(p, pts, col, light, { d: 10, ow: 9, tex: () => { const q = lerp2(c, add(c, -240 * s * k, dy * 180 * up * s), 0.6); p.ell(q[0], q[1], 40 * s, 30 * s, dark, 0); p.ell(q[0], q[1], 22 * s, 16 * s, "#C84A2A", 0); p.ell(q[0], q[1], 9 * s, 7 * s, dark, 0); for (let i = 0; i < 8; i++) p.stroke([c, lerp2(pts[Math.floor(pts.length * 0.15)], pts[Math.floor(pts.length * 0.55)], i / 7)], 2, dark); p.g.globalAlpha = 0.4; p.ell(q[0] + 40, q[1] - 20, 50, 20, wingLit, 0); p.g.globalAlpha = 1; } }); } };
  wingAt([780, 400 + bob], 1, mul(wing, FAR));
  for (const [x, col] of [[740, mul(sk, FAR)], [700, sk]] as [number, string][]) cel(p, tube([[x, 560 + bob], [x + 20, 720 + bob], [x - 10, 860 + bob]], 30, 16), col, light, { d: 4 }); // legs dangling
  cel(p, chaikin(offs([[650, 580], [640, 420], [700, 300], [800, 290], [840, 420], [800, 580]], 0, bob), 2), sk, light, { d: 14, tex: () => furFlicks(p, 630, 280, 850, 590, 50, 5, [dark, "#4A4048"], 26, 5) });
  for (const [b, col] of [[[700, 360], mul(sk, FAR)], [[800, 360], sk]] as [P2, string][]) { const sh = add(b, 0, bob), hand = add(sh, 60 + 100 * roar, 200 - 260 * roar); cel(p, tube([sh, lerp2(sh, hand, 0.5), hand], 24, 14), col, light, { d: 4 }); for (let i = 0; i < 4; i++) claw(p, hand, 30, 0.8 + i * 0.3 - roar * 2, 6); }
  const H: P2 = [760, 240 + bob]; cel(p, blob(H[0], H[1], 80, 70, 0, 3), sk, light, { d: 8, tex: () => { for (const s of [-1, 1]) p.stroke(curve(add(H, s * 20, -60), add(H, s * 70, -130), add(H, s * 120, -110), 8), 6, dark); } }); // feathery antennae
  for (const d of [-30, 30]) { p.g.globalAlpha = 0.6; p.ell(H[0] + d, H[1], 40, 34, "#FF2A1A", 0); p.g.globalAlpha = 1; p.ell(H[0] + d, H[1], 22, 20, "#FF5A3A", 3); p.ell(H[0] + d, H[1], 8, 8, "#FFE0C0", 0); } // the glowing red eyes
  wingAt([800, 410 + bob], 1, wing);
}
// cockatrice: a rooster-dragon on two legs: comb + wattles, bat wings, a serpent tail
export function drawCockatriceB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), roar = o.roar ?? 0, expr = o.expr ?? "angry", bob = bobOf(o, 8), far = walkOf(o, 0.5), near = walkOf(o, 0);
  const sk = "#3E5A2E", feather = "#8A5A22", featherLit = "#D8A03A", comb = "#D02A1E", beak = "#E2B84A";
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => { const L = digiLeg(hip, 0.75, w.swing, w.lift); cel(p, tube([L[0], L[1], L[2]], 40, 20), col, light, { d: 6 }); cel(p, tube([L[2], L[3]], 16, 12), "#C8A040", light, { d: 4 }); for (let i = 0; i < 3; i++) claw(p, add(L[3], 6 + i * 20, 4), 36, 0.1 + i * 0.2, 8); p.poly(horn([add(L[2], 0, 60), add(L[2], -30, 70), add(L[2], -50, 60)], 8), "#1A1210", 2); }; // spur
  leg([640, 600 + bob], far, mul(feather, FAR));
  memWing(p, { sh: [740, 470 + bob], rear: [560, 540 + bob], span: 380, flapK: 0.1 - 0.08 * roar, col: mul(sk, FAR), mem: mul("#5A2A1A", FAR), light, fingers: 3, scallop: 0.3, arm: 20, seed: 3 });
  const tl = curve([520, 560 + bob], [300, 640 + bob], [140, 520 + bob - 30 * Math.sin(2 * Math.PI * (o.phase ?? 0))], 16);
  cel(p, ribbon(tl, (i) => 50 - i * 2.6), sk, light, { d: 8, tex: () => scales(p, 100, 400, 560, 720, 12, "#1A2A12", 5, 0.5) });
  const th = tl[tl.length - 1]; cel(p, chaikin([add(th, 0, -20), add(th, -60, -30), add(th, -100, 0), add(th, -60, 26), add(th, 0, 20)], 2), sk, light, { d: 4, ow: 8 }); tooth(p, th[0] - 80, th[1] + 10, 22, true, 0, 0.25); p.ell(th[0] - 50, th[1] - 10, 6, 6, "#F2D23A", 2); // the tail ends in a snake head
  const body = blob(680, 520 + bob, 160, 130, -0.4, 3, 0.1, 1.8, 2.1);
  cel(p, body, feather, light, { d: 20, tex: () => { furFlicks(p, 520, 380, 840, 660, 90, 5, ["#5A3412", featherLit], 30, 6); } });
  plumes(p, Array.from({ length: 6 }, (_, i) => [560, 470 + bob + i * 16] as P2), 200, rad(-150 + 0), "#2A4A2A", 7, 22); // the rooster tail
  leg([680, 610 + bob], near, feather);
  const nb: P2 = [780, 440 + bob], hr = rad(20) * roar, R = (q: P2[]) => rotAll(q, hr, nb), H: P2 = [860, 300 + bob];
  cel(p, tube(R(curve(nb, [830, 370 + bob], H, 8)), 60, 44), featherLit, light, { d: 6, tex: () => furFlicks(p, 760, 250, 900, 470, 30, 7, [feather], 22, 5) });
  const Hr = R([H])[0], T = (q: P2[]) => rotAll(offs(q, Hr[0], Hr[1]), hr, Hr), ja = rad(34) * roar;
  cel(p, T([[-20, -40], [0, -110], [30, -70], [50, -130], [70, -70], [100, -110], [100, -40]]), comb, light, { d: 4, ow: 8 }); // comb
  p.poly([...T([[60, 0], [170, 10]]), ...rotAll(T([[160, 26], [60, 20]]), ja, T([[60, 10]])[0])], "#30080E", 0);
  cel(p, rotAll(T([[50, 14], [160, 24], [140, 40], [60, 38]]), ja, T([[60, 10]])[0]), beak, light, { d: 3, ow: 7 });
  cel(p, T(chaikin([[-40, 0], [-10, -50], [70, -50], [110, -20], [100, 10], [0, 30], [-40, 20]], 2)), sk, light, { d: 6, tex: () => scales(p, Hr[0] - 50, Hr[1] - 60, Hr[0] + 120, Hr[1] + 40, 8, "#1A2A12", 3, 0.5) });
  cel(p, T(chaikin([[110, -30], [180, 0], [170, 16], [100, 8]], 1)), beak, light, { d: 3, ow: 7 });
  cel(p, T([[60, 30], [90, 100], [110, 40]]), comb, light, { d: 3, ow: 7, rim: false }); // wattle
  beastEye(p, ...T([[50, -20]])[0], 0.7, expr, o.blink ?? 0, sk, "#F2D23A");
  memWing(p, { sh: [720, 480 + bob], rear: [560, 560 + bob], span: 400, flapK: 0.1 - 0.08 * roar, col: sk, mem: "#5A2A1A", light, fingers: 3, scallop: 0.3, arm: 24, seed: 5, holes: true });
}
// Fenrir: a giant wolf, eyes burning, a broken chain still on its neck
export const drawFenrirB: Draw = (p, o) => drawQuadB(p, o, { fur: "#3A3840", dark: "#141218", lit: "#6A6874", belly: "#5A5864", skin: "#0A0A0C", iris: "#FFB21A", mane: "#1E1C22",
  x0: 400, x1: 960, ys: 420, yh: 470, yb: 640, hump: 50, hind: [66, 30], front: [70, 32], bendH: 50, bendF: -10, toes: 4, toe: 30,
  head: { L: 300, h: 160, type: "dog", fangs: 7, ears: true, open: 55 }, neck: [90, 60, 100], tail: "long", shag: 90, bob: 7,
  postFn: (p2, o2, light, bob) => { const pts = curve([930, 480 + bob], [1000, 640 + bob], [1080, 760 + bob + 30 * Math.sin(2 * Math.PI * (o2.phase ?? 0))], 9); pts.forEach((q, i) => { p2.ell(q[0], q[1], 22, 14, null, 9); p2.ell(q[0], q[1], 22, 14, "#8A8A90", 0); p2.ell(q[0], q[1], 22, 14, null, 4); void i; }); const e = pts[pts.length - 1]; p2.poly([add(e, -10, 10), add(e, 10, 30), add(e, -6, 40)], "#8A8A90", 4); } }); // the broken chain Gleipnir

// ================================================================== registry (x0 / x1 measured with BeastSolo; len in m over that extent)
// wendigo ~2.8 m tall, mothman ~2 m tall (len = their width); ammonite: shell ~2 m across
export const BEAST_NEW = {
  shoni: { draw: drawShoniB, len: 15, x0: 98, x1: 1483 }, leeds: { draw: drawLeedsB, len: 16, x0: 68, x1: 1385 }, oncho: { draw: drawOnchoB, len: 8, x0: 69, x1: 1530 }, coela: { draw: drawCoelaB, len: 2, x0: 148, x1: 1266 },
  camero: { draw: drawCameroB, len: 6, x0: 134, x1: 1457 }, ammonite: { draw: drawAmmoniteB, len: 2.8, x0: 249, x1: 1301 }, opabinia: { draw: drawOpabiniaB, len: 0.07, x0: 170, x1: 1334 }, tully: { draw: drawTullyB, len: 0.35, x0: 120, x1: 1352 },
  doed: { draw: drawDoedB, len: 3.6, x0: 44, x1: 1184 }, arsino: { draw: drawArsinoB, len: 3.5, x0: 349, x1: 1315 }, uinta: { draw: drawUintaB, len: 4, x0: 349, x1: 1316 }, chali: { draw: drawChaliB, len: 2.6, x0: 369, x1: 1319 },
  macrau: { draw: drawMacrauB, len: 3, x0: 369, x1: 1368 }, toxo: { draw: drawToxoB, len: 2.7, x0: 329, x1: 1315 }, arcto: { draw: drawArctoB, len: 3, x0: 349, x1: 1265 }, ambulo: { draw: drawAmbuloB, len: 3, x0: 93, x1: 1381 },
  tortoise: { draw: drawTortoiseB, len: 2.7, x0: 405, x1: 1307 }, hyaeno: { draw: drawHyaenoB, len: 3, x0: 256, x1: 1358 },
  wendigo: { draw: drawWendigoB, len: 1.2, x0: 641, x1: 985 }, jormun: { draw: drawJormunB, len: 120, x0: 0, x1: 1514 }, lung: { draw: drawLungB, len: 30, x0: 86, x1: 1516 }, qilin: { draw: drawQilinB, len: 3.4, x0: 252, x1: 1452 },
  behemoth: { draw: drawBehemothB, len: 20, x0: 193, x1: 1357 }, roc: { draw: drawRocB, len: 12, x0: 175, x1: 1156 }, mothman: { draw: drawMothmanB, len: 1.25, x0: 439, x1: 888 }, cockatrice: { draw: drawCockatriceB, len: 2.4, x0: 47, x1: 1042 },
  fenrir: { draw: drawFenrirB, len: 8, x0: 236, x1: 1377 },
} as const;
void blob; void GROUND; void scars;
