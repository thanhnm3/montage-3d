// Hand-drawn 2D plants, rocks and ground clutter (2026-11-05, user: "kể cả cây cỏ, đất đá, tất cả đều phải vẽ thật chi
// tiết"), drawn with the same Pen + cel shading + heavy ink as the beasts so the sets match the animals.
// Design space 800 x 1000, ground at y = 980, centred on x = 400. Each kind: draw(p, seed, pal) + real height (m).
// Prehistoric plants: fern, tree fern, cycad, horsetail, araucaria, palm, ginkgo-ish broadleaf, magnolia shrub,
// reeds / cattails, grass tuft, bush, sagebrush, dead tree, snowy pine; ground: boulder, rock pile, pebbles, mossy log,
// mushrooms, fallen bones; sea: kelp, sea fan, sponge, sea lily, brain coral. Palettes per set via `pal`.
import { Pen, mul } from "./toon";
import { P2, blob, curve, rad, tube } from "./toonAnimals";
import { cel, chaikin, horn, rng, scales } from "./beastAnimals";

const INKB = "#0E080C";
const LIGHT = rad(-120);
const G = 980, CX = 400;
const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export type FloraPal = { leaf: string; leafDark: string; leafLit: string; bark: string; barkDark: string; rock: string; rockDark: string; rockLit: string; moss: string; snow?: string };
export const PALS: Record<string, FloraPal> = {
  jungle: { leaf: "#4E7A34", leafDark: "#24401A", leafLit: "#8AB84E", bark: "#6A4A30", barkDark: "#2E1E12", rock: "#7A7266", rockDark: "#3A342E", rockLit: "#B0A898", moss: "#5E8A3A" },
  dry: { leaf: "#8A9A5A", leafDark: "#4A5230", leafLit: "#C8C88A", bark: "#7A5E44", barkDark: "#3A2A1C", rock: "#B0644A", rockDark: "#5A2E20", rockLit: "#E09A70", moss: "#9A9A5A" },
  snow: { leaf: "#2E4A3E", leafDark: "#14241C", leafLit: "#5A7A66", bark: "#5A4636", barkDark: "#2A1E16", rock: "#7A808A", rockDark: "#3A3E46", rockLit: "#B8C0CA", moss: "#6A7A6A", snow: "#F4F8FC" },
  ash: { leaf: "#3A3428", leafDark: "#1A1612", leafLit: "#6A5E48", bark: "#2A2220", barkDark: "#100C0A", rock: "#3A3432", rockDark: "#181414", rockLit: "#6A5E58", moss: "#4A3A2A" },
  cave: { leaf: "#6A7A5A", leafDark: "#2E3628", leafLit: "#9AA888", bark: "#5A4A3A", barkDark: "#2A2018", rock: "#7A6656", rockDark: "#3A2E26", rockLit: "#A8927E", moss: "#5A6A44" },
  sea: { leaf: "#6A7A3A", leafDark: "#2E3A1A", leafLit: "#A8B05A", bark: "#5A4A3A", barkDark: "#2A2018", rock: "#5A6A72", rockDark: "#2A343A", rockLit: "#8A9CA6", moss: "#4A7A5A" },
};

// ------------------------------------------------------------------ helpers
/** a leaf blade (pointed) along a short curve */
function leaf(p: Pen, a: P2, ang: number, L: number, w: number, col: string, ow = 3) {
  const tip = add(a, Math.cos(ang) * L, Math.sin(ang) * L), m = lerp2(a, tip, 0.45), n = [-Math.sin(ang), Math.cos(ang)];
  p.poly(chaikin([a, add(m, n[0] * w, n[1] * w), tip, add(m, -n[0] * w, -n[1] * w)], 1), col, ow);
}
/** a pinnate frond: rachis curve with leaflets on both sides, lit tops / dark undersides */
function frond(p: Pen, pts: P2[], L: number, P: FloraPal, seed: number, dense = 1) {
  const r = rng(seed), n = pts.length;
  for (let i = 1; i < n; i++) {
    const a = pts[i - 1], b = pts[i], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), k = 1 - i / n, l = L * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, (i / n) * 1.15))) * (0.85 + r() * 0.3);
    for (let d = 0; d < dense; d++) { const q = lerp2(a, b, d / dense); leaf(p, q, ang - 1.1 - k * 0.2, l, l * 0.18, P.leafDark, 2.5); leaf(p, q, ang + 1.1 + k * 0.2, l, l * 0.18, P.leaf, 2.5); }
  }
  p.stroke(pts, 4, P.leafDark);
  for (let i = 2; i < n; i += 3) { const q = pts[i], ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); leaf(p, q, ang + 1.0, L * 0.5, L * 0.07, P.leafLit, 0); } // light catches
}
const bend = (base: P2, ang: number, L: number, droop: number, n = 14): P2[] => { const tip = add(base, Math.cos(ang) * L, Math.sin(ang) * L + droop); return curve(base, add(base, Math.cos(ang) * L * 0.6, Math.sin(ang) * L * 0.6 - droop * 0.3), tip, n); };

// ------------------------------------------------------------------ plants
function fern(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 11; i++) { const a = rad(-158 + i * 13.6 + (r() - 0.5) * 8), L = 380 + r() * 200; frond(p, bend([CX + (r() - 0.5) * 30, G - 20], a, L, 40 + r() * 90 + Math.abs(i - 5) * 30), 72, P, s + i, 2); }
  for (let i = 0; i < 3; i++) { const b: P2 = [CX - 30 + i * 30, G - 30]; p.stroke(curve(b, add(b, 10, -60), add(b, -10, -110), 6), 6, P.leafDark); p.ell(b[0] - 10, b[1] - 116, 14, 14, null, 5); } // fiddleheads
  cel(p, blob(CX, G - 18, 50, 24, 0, s), P.barkDark, LIGHT, { d: 4, ow: 8, rim: false });
}
function treeFern(p: Pen, s: number, P: FloraPal) {
  const r = rng(s), top: P2 = [CX + 10, 330];
  const trunk = curve([CX - 10, G], [CX - 30, 650], top, 10);
  cel(p, tube(trunk, 34, 26), P.bark, LIGHT, { d: 8, tex: () => { for (let i = 0; i < 60; i++) { const q = lerp2(trunk[0], top, r()); p.stroke([add(q, -26, 0), add(q, -8 + r() * 20, 12)], 4, P.barkDark); } } });
  for (let i = 0; i < 11; i++) { const a = rad(-200 + i * 22 + (r() - 0.5) * 8), L = 260 + r() * 90; frond(p, bend(top, a, L, 200 + r() * 80, 12), 46, P, s + 10 + i); }
  cel(p, blob(top[0], top[1], 40, 30, 0, s), P.barkDark, LIGHT, { d: 4, ow: 8, rim: false });
}
function cycad(p: Pen, s: number, P: FloraPal) {
  const r = rng(s), trunkTop = 560;
  const body = chaikin([[CX - 90, G], [CX - 80, 760], [CX - 60, trunkTop], [CX + 60, trunkTop], [CX + 80, 760], [CX + 90, G]], 2);
  cel(p, body, P.bark, LIGHT, { d: 18, tex: () => { for (let y = trunkTop + 10; y < G; y += 26) for (let x = CX - 90 + ((y / 26) % 2) * 14; x < CX + 90; x += 28) p.poly([[x, y], [x + 14, y - 12], [x + 28, y], [x + 14, y + 12]], (x + y) % 3 ? P.barkDark : mul(P.bark, [1.2, 1.15, 1.1]), 2); } });
  for (let i = 0; i < 14; i++) { // stiff spiky fronds
    const a = rad(-180 + i * 13 + (r() - 0.5) * 6), L = 300 + r() * 80, base: P2 = [CX, trunkTop + 10], pts = bend(base, a, L, 60 + r() * 50, 12);
    for (let j = 2; j < pts.length; j++) { const q = pts[j], an = Math.atan2(q[1] - pts[j - 1][1], q[0] - pts[j - 1][0]); leaf(p, q, an - 0.9, 46, 5, P.leafDark, 2); leaf(p, q, an + 0.9, 46, 5, P.leaf, 2); }
    p.stroke(pts, 5, P.leafDark);
  }
  cel(p, blob(CX, trunkTop - 30, 44, 60, 0, s), "#B8803A", LIGHT, { d: 6, tex: () => scales(p, CX - 50, trunkTop - 100, CX + 50, trunkTop + 30, 10, "#5A3A18", s, 0.6) }); // the cone
}
function horsetail(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 9; i++) {
    const x = CX - 140 + i * 35 + (r() - 0.5) * 20, top = 120 + r() * 300, stem = curve([x, G], [x + (r() - 0.5) * 30, (G + top) / 2], [x + (r() - 0.5) * 60, top], 10);
    cel(p, tube(stem, 12, 8), P.leaf, LIGHT, { d: 4, ow: 6, tex: () => { for (let j = 1; j < stem.length; j++) p.stroke([add(stem[j], -14, 0), add(stem[j], 14, 0)], 5, P.leafDark); } });
    for (let j = 2; j < stem.length - 1; j++) for (const sd of [-1, 1]) leaf(p, stem[j], rad(sd > 0 ? -30 : -150) + (r() - 0.5) * 0.3, 50, 4, sd > 0 ? P.leaf : P.leafDark, 2); // whorls
    const t = stem[stem.length - 1]; cel(p, blob(t[0], t[1] - 20, 12, 30, 0, s + i), "#8A6A3A", LIGHT, { d: 3, ow: 6, rim: false });
  }
}
function araucaria(p: Pen, s: number, P: FloraPal, snow = false) {
  const r = rng(s), top = 40;
  cel(p, tube(curve([CX, G], [CX - 10, 500], [CX, top + 40], 10), 32, 12), P.bark, LIGHT, { d: 6, tex: () => { for (let y = top; y < G; y += 30) p.stroke([[CX - 30, y], [CX + 30, y + 6]], 3, P.barkDark); } });
  for (let tier = 0; tier < 8; tier++) { // tufted branch tiers, longer low down
    const y = top + 60 + tier * 75, L = 90 + tier * 26;
    for (const sd of [-1, 1]) {
      const br = curve([CX, y], [CX + sd * L * 0.6, y - 20], [CX + sd * L, y + 30], 8);
      p.stroke(br, 8, P.barkDark);
      cel(p, chaikin([add(br[2], 0, -10), add(br[8], sd * 20, -30), add(br[8], sd * 40, 20), add(br[4], 0, 40), add(br[2], 0, 20)], 2), tier % 2 ? P.leaf : mul(P.leaf, [0.9, 0.95, 0.9]), LIGHT, { d: 10, tex: () => { for (let i = 0; i < 16; i++) { const q = lerp2(br[2], br[8], r()); leaf(p, add(q, 0, 10), rad(sd > 0 ? 60 : 120) + (r() - 0.5), 40, 4, P.leafDark, 0); } } });
      for (let i = 0; i < 14; i++) { const q = lerp2(br[3], br[8], i / 13); leaf(p, add(q, 0, -14), rad(-90 + sd * 30) + (r() - 0.5) * 0.6, 34, 4, P.leafDark, 1.5); leaf(p, add(q, 0, 34), rad(90 - sd * 20) + (r() - 0.5) * 0.6, 26, 4, P.leafDark, 1.5); }
      if (snow && P.snow) p.poly(chaikin([add(br[3], 0, -14), add(br[8], sd * 24, -30), add(br[8], sd * 40, -10), add(br[4], 0, 0)], 1), P.snow, 3);
    }
  }
  cel(p, blob(CX, top + 30, 40, 50, 0, s), P.leaf, LIGHT, { d: 6 });
  if (snow && P.snow) p.poly(blob(CX, top + 10, 34, 18, 0, s), P.snow, 3);
}
function palm(p: Pen, s: number, P: FloraPal) {
  const r = rng(s), top: P2 = [CX + 120, 220];
  const trunk = curve([CX - 40, G], [CX - 70, 560], top, 14);
  cel(p, tube(trunk, 40, 26), P.bark, LIGHT, { d: 8, tex: () => { for (let i = 1; i < trunk.length; i++) p.stroke([add(trunk[i], -40, 0), add(trunk[i], 40, -8)], 4, P.barkDark); } });
  for (let i = 0; i < 9; i++) { const a = rad(-190 + i * 25 + (r() - 0.5) * 8), pts = bend(top, a, 300 + r() * 60, 180 + r() * 80, 12); for (let j = 2; j < pts.length; j++) { const q = pts[j], an = Math.atan2(q[1] - pts[j - 1][1], q[0] - pts[j - 1][0]); leaf(p, q, an + 1.3, 90 - j * 3, 9, P.leafDark, 2); leaf(p, q, an - 1.3, 90 - j * 3, 9, P.leaf, 2); } p.stroke(pts, 6, P.leafDark); }
}
function broadleaf(p: Pen, s: number, P: FloraPal, flowers = false) {
  const r = rng(s);
  cel(p, tube(curve([CX, G], [CX - 20, 700], [CX + 10, 520], 8), 24, 12), P.bark, LIGHT, { d: 4 });
  for (const [dx, dy, a, b] of [[-90, 520, 170, 140], [90, 500, 160, 150], [0, 400, 190, 160], [-40, 610, 150, 110], [80, 620, 140, 100]] as [number, number, number, number][])
  { const col = dy < 450 ? P.leafLit : dy < 560 ? P.leaf : P.leafDark; for (let i = 0; i < 22; i++) { const an = (i / 22) * Math.PI * 2; leaf(p, [CX + dx + Math.cos(an) * a * 0.85, dy + Math.sin(an) * b * 0.85], an + (r() - 0.5) * 0.5, 60 + r() * 30, 20, col, 3); }
    cel(p, blob(CX + dx, dy, a, b, 0, s + dx), col, LIGHT, { d: 20, tex: () => { for (let i = 0; i < 34; i++) leaf(p, [CX + dx + (r() - 0.5) * a * 1.6, dy + (r() - 0.5) * b * 1.6], rad(-60 - r() * 60), 40, 14, r() < 0.5 ? P.leafDark : P.leafLit, 0); } }); }
  if (flowers) for (let i = 0; i < 10; i++) { const q: P2 = [CX + (r() - 0.5) * 300, 360 + r() * 280]; for (let k = 0; k < 5; k++) leaf(p, q, (k / 5) * Math.PI * 2, 26, 11, "#F2E6D8", 2); p.ell(q[0], q[1], 6, 6, "#E8B830", 0); }
}
function reeds(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 18; i++) { const x = CX - 180 + r() * 360, top = 200 + r() * 400, lean = (r() - 0.5) * 120; const st = curve([x, G], [x + lean * 0.3, (G + top) / 2], [x + lean, top], 8); p.stroke(st, 7, i % 2 ? P.leaf : P.leafDark); if (i % 3 === 0) cel(p, blob(st[6][0], st[6][1], 12, 44, 0, i), "#6A4428", LIGHT, { d: 3, ow: 6, rim: false }); }
  for (let i = 0; i < 12; i++) { const x = CX - 160 + r() * 320; leaf(p, [x, G], rad(-90 + (r() - 0.5) * 50), 300 + r() * 200, 14, i % 2 ? P.leaf : P.leafDark, 3); }
}
function grassTuft(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 46; i++) { const x = CX - 170 + r() * 340, a = rad(-90 + (x - CX) * 0.12 + (r() - 0.5) * 30), L = 240 + r() * 420; leaf(p, [x, G], a, L, 10 + r() * 6, i % 3 === 0 ? P.leafDark : i % 3 === 1 ? P.leaf : P.leafLit, 2); }
  for (let i = 0; i < 6; i++) { const x = CX - 120 + r() * 240, top = 420 + r() * 200; p.stroke(curve([x, G], [x + 10, (G + top) / 2], [x + 30, top], 6), 4, P.leafDark); cel(p, blob(x + 34, top - 20, 9, 30, 0.3, i), mul(P.leafLit, [1, 0.95, 0.7]), LIGHT, { d: 2, ow: 5, rim: false }); } // seed heads
}
function bush(p: Pen, s: number, P: FloraPal, sage = false) {
  const r = rng(s);
  if (sage) for (let i = 0; i < 20; i++) { const a = rad(-160 + r() * 140); p.stroke(curve([CX, G], add([CX, G], Math.cos(a) * 120, -160), add([CX, G], Math.cos(a) * 320, Math.sin(a) * 360), 6), 5, P.barkDark); }
  for (let i = 0; i < 9; i++) { const q: P2 = [CX + (r() - 0.5) * 420, G - 120 - r() * 260]; for (let k = 0; k < 16; k++) { const an = (k / 16) * Math.PI * 2; leaf(p, [q[0] + Math.cos(an) * 80, q[1] + Math.sin(an) * 60], an + (r() - 0.5) * 0.5, sage ? 40 : 56, sage ? 8 : 16, i % 2 ? P.leaf : P.leafDark, 2); } cel(p, blob(q[0], q[1], 90 + r() * 60, 70 + r() * 40, 0, s + i), q[1] < G - 260 ? P.leafLit : i % 2 ? P.leaf : P.leafDark, LIGHT, { d: 14, tex: () => { for (let k = 0; k < (sage ? 30 : 16); k++) leaf(p, [q[0] + (r() - 0.5) * 160, q[1] + (r() - 0.5) * 110], rad(-50 - r() * 80), sage ? 24 : 36, sage ? 6 : 12, r() < 0.5 ? P.leafDark : P.leafLit, 0); } }); }
}
function deadTree(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  const branch = (a: P2, ang: number, L: number, w: number, depth: number) => {
    const b = add(a, Math.cos(ang) * L, Math.sin(ang) * L), pts = curve(a, add(lerp2(a, b, 0.5), (r() - 0.5) * 40, 0), b, 6);
    cel(p, tube(pts, w, w * 0.6), P.bark, LIGHT, { d: 4, ow: Math.max(5, w * 0.4), tex: () => { for (let i = 0; i < 4; i++) p.stroke([lerp2(a, b, r()), lerp2(a, b, r())], 3, P.barkDark); } });
    if (depth > 0) for (let k = 0; k < 2 + (depth > 2 ? 1 : 0); k++) branch(b, ang + (r() - 0.5) * 1.3 - (k - 0.5) * 0.5, L * (0.55 + r() * 0.2), w * 0.62, depth - 1);
  };
  branch([CX, G], rad(-90), 340, 50, 4);
  for (const sd of [-1, 1]) cel(p, [[CX + sd * 30, G], [CX + sd * 110, G], [CX + sd * 40, G - 60]], P.bark, LIGHT, { d: 3, ow: 8 }); // root flare
}
// ------------------------------------------------------------------ rocks + ground clutter
function boulder(p: Pen, s: number, P: FloraPal, moss = true) {
  const r = rng(s), pts: P2[] = [];
  for (let i = 0; i < 15; i++) { const a = Math.PI + (i / 14) * Math.PI, rr = 300 * (0.85 + r() * 0.2); pts.push([CX + Math.cos(a) * rr * 1.1, G + Math.sin(a) * rr * (i === 0 || i === 14 ? 0 : 1) * 1.15]); }
  const body = chaikin([...pts, [CX + 300, G] as P2, [CX - 300, G] as P2], 2);
  cel(p, body, P.rock, LIGHT, { d: 50, tex: () => {
    for (let i = 0; i < 4; i++) { const a = pts[3 + i * 2], b = add(a, 60 + r() * 80, 120 + r() * 160); p.poly([a, lerp2(a, b, 0.5), b, add(lerp2(a, b, 0.5), 30, 0)], mul(P.rock, [0.78, 0.78, 0.82]), 0); } // facets
    for (let i = 0; i < 5; i++) { let q: P2 = [CX - 200 + r() * 400, G - 300 + r() * 200]; const crack: P2[] = [q]; for (let k = 0; k < 5; k++) { q = add(q, (r() - 0.5) * 60, 30 + r() * 30); crack.push(q); } p.stroke(crack, 4, P.rockDark); } // cracks
    for (let i = 0; i < 30; i++) p.ell(CX - 280 + r() * 560, G - 340 + r() * 330, 6 + r() * 10, 4 + r() * 6, r() < 0.5 ? P.rockLit : P.rockDark, 0); // grain + lichen
    if (moss) for (let i = 0; i < 7; i++) p.ell(CX - 200 + r() * 260, G - 300 - r() * 40 + i * 12, 40 + r() * 30, 14 + r() * 8, P.moss, 0);
    if (P.snow) p.poly(chaikin([...pts.slice(4, 12).map(([x, y]) => [x, y - 6] as P2), ...pts.slice(4, 12).reverse().map(([x, y], i) => [x, y + 30 + (i % 2) * 18] as P2)], 1), P.snow, 0);
  } });
  for (let i = 0; i < 5; i++) cel(p, blob(CX - 330 + r() * 660, G - 14, 24 + r() * 20, 16 + r() * 10, 0, i), P.rock, LIGHT, { d: 6, ow: 6, rim: false }); // scree at the base
}
function rockPile(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 9; i++) { const x = CX - 260 + r() * 520, a = 60 + r() * 90, b = 40 + r() * 60, y = G - b * 0.8 - (i > 5 ? 60 : 0); cel(p, blob(x, y, a, b, (r() - 0.5) * 0.6, s + i, 0.1, 1.6, 2.4), i % 2 ? P.rock : mul(P.rock, [0.9, 0.9, 0.95]), LIGHT, { d: 14, ow: 9, tex: () => { p.stroke([add([x, y], -a * 0.4, -b * 0.2), add([x, y], a * 0.2, b * 0.3)], 3, P.rockDark); if (P.snow) p.poly(blob(x, y - b * 0.7, a * 0.7, b * 0.25, 0, i), P.snow, 0); } }); }
}
function pebbles(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 26; i++) { const x = CX - 350 + r() * 700, a = 14 + r() * 26, b = 10 + r() * 14; cel(p, blob(x, G - b - r() * 20, a, b, 0, s + i), r() < 0.5 ? P.rock : P.rockLit, LIGHT, { d: 4, ow: 5, rim: false }); }
  for (let i = 0; i < 8; i++) leaf(p, [CX - 300 + r() * 600, G], rad(-90 + (r() - 0.5) * 60), 60 + r() * 60, 6, P.leaf, 2);
}
function mossyLog(p: Pen, s: number, P: FloraPal) {
  const r = rng(s), lg = curve([60, G - 90], [400, G - 130], [740, G - 80], 10);
  cel(p, tube(lg, 90, 80), P.bark, LIGHT, { d: 16, tex: () => { for (let i = 0; i < 14; i++) { const x = 80 + i * 48; p.stroke(curve([x, G - 170], [x + 10, G - 110], [x, G - 40], 6), 4, P.barkDark); } for (let i = 0; i < 10; i++) p.ell(120 + r() * 560, G - 200 + r() * 30, 50, 16, P.moss, 0); } });
  cel(p, blob(740, G - 80, 34, 88, 0, s), mul(P.bark, [1.3, 1.25, 1.1]), LIGHT, { d: 4, tex: () => { for (let k = 1; k < 4; k++) p.ell(740, G - 80, 34 - k * 8, 88 - k * 22, null, 3); } }); // cut end rings
  for (let i = 0; i < 4; i++) { const x = 200 + r() * 400; mush(p, [x, G - 160 - r() * 20], 0.5, s + i); }
}
function mush(p: Pen, at: P2, k: number, s: number) { const r = rng(s); p.poly(tube([at, add(at, 4, -60 * k)], 10 * k, 8 * k), "#E8DCC0", 3); cel(p, chaikin([add(at, -50 * k, -50 * k), add(at, 0, -110 * k), add(at, 50 * k, -50 * k)], 2), r() < 0.5 ? "#A8402A" : "#C8904A", LIGHT, { d: 4, ow: 6, tex: () => { for (let i = 0; i < 4; i++) p.ell(at[0] - 30 * k + r() * 60 * k, at[1] - 70 * k - r() * 20 * k, 6 * k, 5 * k, "#F2E6D0", 0); } }); }
function mushrooms(p: Pen, s: number) { const r = rng(s); for (let i = 0; i < 7; i++) mush(p, [CX - 220 + r() * 440, G - 4], 0.7 + r() * 0.9, s + i); }
function boneScatter(p: Pen, s: number) {
  const r = rng(s), bone = "#E6D8B4";
  for (let i = 0; i < 6; i++) { const a: P2 = [CX - 280 + r() * 560, G - 20 - r() * 30], an = (r() - 0.5) * 0.8, L = 120 + r() * 120, b = add(a, Math.cos(an) * L, Math.sin(an) * L); cel(p, tube([a, b], 14, 12), bone, LIGHT, { d: 4, ow: 7 }); for (const q of [a, b]) cel(p, blob(q[0], q[1], 22, 18, 0, i), bone, LIGHT, { d: 3, ow: 6, rim: false }); }
  cel(p, chaikin([[CX - 120, G], [CX - 110, G - 120], [CX + 20, G - 150], [CX + 160, G - 100], [CX + 170, G - 20]], 2), bone, LIGHT, { d: 10, tex: () => { p.ell(CX - 20, G - 90, 30, 26, INKB, 0); p.ell(CX + 80, G - 70, 22, 18, INKB, 0); for (let i = 0; i < 6; i++) p.poly(horn([[CX + 60 + i * 18, G - 30], [CX + 64 + i * 18, G - 10], [CX + 66 + i * 18, G + 4]], 6), "#C8B88A", 2); } }); // skull
}
// ------------------------------------------------------------------ sea
function kelp(p: Pen, s: number, P: FloraPal) {
  const r = rng(s);
  for (let i = 0; i < 5; i++) { const x = CX - 120 + i * 60, st = curve([x, G], [x + (r() - 0.5) * 160, 500], [x + (r() - 0.5) * 120, 30 + r() * 100], 18); p.stroke(st, 8, P.leafDark); for (let j = 1; j < st.length; j++) { const ang = rad(j % 2 ? -20 : -160) + (r() - 0.5) * 0.4; leaf(p, st[j], ang, 90 + r() * 50, 22, j % 3 ? P.leaf : P.leafLit, 3); if (j % 4 === 0) cel(p, blob(st[j][0] + 12, st[j][1], 12, 14, 0, j), "#8A8A3A", LIGHT, { d: 2, ow: 5, rim: false }); } }
}
function seaFan(p: Pen, s: number) {
  const r = rng(s), col = "#C84A5A", dark = "#5A1A24";
  const br = (a: P2, ang: number, L: number, d: number) => { const b = add(a, Math.cos(ang) * L, Math.sin(ang) * L); p.stroke([a, b], 3 + d * 2, d > 2 ? dark : col); if (d > 0) { br(b, ang - 0.35 - r() * 0.2, L * 0.75, d - 1); br(b, ang + 0.35 + r() * 0.2, L * 0.75, d - 1); } };
  for (let k = 0; k < 3; k++) br([CX + (k - 1) * 40, G], rad(-90 + (k - 1) * 18), 230, 5);
  for (let i = 0; i < 80; i++) p.ell(CX - 300 + r() * 600, 200 + r() * 600, 5, 5, "#F28A8A", 0);
}
function sponge(p: Pen, s: number) {
  const r = rng(s);
  for (let i = 0; i < 4; i++) { const x = CX - 180 + i * 120, h = 300 + r() * 360, w = 60 + r() * 40, col = ["#D9A23A", "#B85A2E", "#C8803A", "#8A5A9A"][i % 4];
    cel(p, chaikin([[x - w * 0.6, G], [x - w, G - h * 0.5], [x - w * 0.8, G - h], [x + w * 0.8, G - h], [x + w, G - h * 0.5], [x + w * 0.6, G]], 2), col, LIGHT, { d: 12, tex: () => { p.ell(x, G - h, w * 0.7, 20, mul(col, [0.35, 0.3, 0.3]), 0); for (let k = 0; k < 14; k++) p.ell(x + (r() - 0.5) * w * 1.4, G - r() * h * 0.9, 6, 6, mul(col, [0.6, 0.55, 0.55]), 0); } }); }
}
function brainCoral(p: Pen, s: number) {
  const r = rng(s), col = "#C8A86A";
  cel(p, chaikin([[CX - 320, G], [CX - 300, G - 200], [CX - 120, G - 330], [CX + 140, G - 320], [CX + 300, G - 180], [CX + 320, G]], 2), col, LIGHT, { d: 30, tex: () => { for (let i = 0; i < 26; i++) { const y = G - 20 - i * 12; p.stroke(curve([CX - 300 + Math.abs(i - 13) * 8, y], [CX + (r() - 0.5) * 100, y - 30], [CX + 300 - Math.abs(i - 13) * 8, y], 12), 5, mul(col, [0.5, 0.45, 0.4])); } } });
}

// ------------------------------------------------------------------ registry: kind -> draw + real height (m) + how much the top sways in wind / current
type FloraDraw = (p: Pen, s: number, P: FloraPal) => void;
export const FLORA: Record<string, { draw: FloraDraw; h: number; sway: number }> = {
  fern: { draw: fern, h: 1.3, sway: 0.08 }, treefern: { draw: treeFern, h: 5, sway: 0.05 }, cycad: { draw: cycad, h: 2.4, sway: 0.03 }, horsetail: { draw: horsetail, h: 1.8, sway: 0.07 },
  araucaria: { draw: (p, s, P) => araucaria(p, s, P), h: 14, sway: 0.02 }, snowpine: { draw: (p, s, P) => araucaria(p, s, P, true), h: 10, sway: 0.02 }, palm: { draw: palm, h: 7, sway: 0.04 },
  broadleaf: { draw: (p, s, P) => broadleaf(p, s, P), h: 4, sway: 0.03 }, magnolia: { draw: (p, s, P) => broadleaf(p, s, P, true), h: 3, sway: 0.03 },
  reeds: { draw: reeds, h: 2, sway: 0.1 }, grass: { draw: grassTuft, h: 0.8, sway: 0.12 }, bush: { draw: (p, s, P) => bush(p, s, P), h: 1.4, sway: 0.05 }, sage: { draw: (p, s, P) => bush(p, s, P, true), h: 0.9, sway: 0.06 },
  deadtree: { draw: deadTree, h: 6, sway: 0.01 }, boulder: { draw: (p, s, P) => boulder(p, s, P), h: 1.8, sway: 0 }, rockpile: { draw: rockPile, h: 1.0, sway: 0 },
  pebbles: { draw: pebbles, h: 0.35, sway: 0 }, log: { draw: mossyLog, h: 1.1, sway: 0 }, mushrooms: { draw: (p, s) => mushrooms(p, s), h: 0.35, sway: 0.02 }, bones: { draw: (p, s) => boneScatter(p, s), h: 0.6, sway: 0 },
  kelp: { draw: kelp, h: 5, sway: 0.15 }, seafan: { draw: (p, s) => seaFan(p, s), h: 1.4, sway: 0.08 }, sponge: { draw: (p, s) => sponge(p, s), h: 1.2, sway: 0.02 }, braincoral: { draw: (p, s) => brainCoral(p, s), h: 0.9, sway: 0 },
};
export type FloraKind = keyof typeof FLORA;
