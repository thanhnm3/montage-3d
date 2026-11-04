// Own shapes for the animals that were colour variants before (2026-11-04, user: "vẽ lại riêng 6 con đổi màu cho có dáng
// riêng") + the last missing ones ("render hết các con còn thiếu"). Same beast look and API.
//   Velociraptor, wyvern, basilisk, Nessie, hydra (Sarcosuchus is a snout variant of drawDeinoB in beastExtra.ts);
//   Megalania, Deinotherium, Xiphactinus, Hallucigenia (Purussaurus / Kronosaurus: beastExtra.ts).
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, claw, digiLeg, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, furFlicks, scars } from "./beastMore";
import { DRG, dragonHead, fire, memWing, plumes } from "./beastWings";
import { QuadSpec, drawQuadB } from "./beastAncient";

const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const offs = (pts: P2[], dx: number, dy: number): P2[] => pts.map(([x, y]) => [x + dx, y + dy] as P2);
const bobOf = (o: AnimalPose, a: number) => a * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);
type Draw = (p: Pen, o: AnimalPose) => void;
/** a variable-width body along a centre line (snakes, necks): r(i) = radius at point i */
function ribbon(line: P2[], r: (i: number) => number): P2[] {
  const L: P2[] = [], R: P2[] = [], n = line.length - 1;
  line.forEach((q, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(n, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; L.push([q[0] - dy * r(i), q[1] + dx * r(i)]); R.push([q[0] + dy * r(i), q[1] - dx * r(i)]); });
  return [...L, ...R.reverse()];
}

// ------------------------------------------------------------------ Velociraptor (Late Cretaceous Mongolia; ~1.8 m, turkey-sized, feathered)
const VEL = { skin: "#7A4628", feather: "#5A2E18", lit: "#C07840", bar: "#24140C", belly: "#E2C8A0", mouth: "#30080E" };
export function drawVeloB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 10), roar = o.roar ?? 0, expr = o.expr ?? "angry", far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.62, w.swing, w.lift);
    cel(p, tube(curve(L[1], lerp2(L[1], L[2], 0.5), L[2], 6), 22, 14), col, light, { d: 6, rim: false });
    cel(p, tube([L[2], L[3]], 14, 11), col, light, { d: 4, rim: false });
    for (let i = 0; i < 2; i++) claw(p, add(L[3], 14 + i * 14, 4), 24, 0.3, 6);
    p.poly(horn(curve(add(L[3], -2, -6), add(L[3], 8, -52), add(L[3], 46, -60), 8), 12), "#120A08", 3); // the 6.5 cm sickle claw, held up
    cel(p, rotAll(blob(hip[0] + 12, hip[1] + 26, 62, 84, 0.35, 9, -0.2, 1.7, 2.0), w.swing * 0.6, hip), col, light, { d: 10, tex: () => furFlicks(p, hip[0] - 60, hip[1] - 40, hip[0] + 90, hip[1] + 110, 24, 3, [VEL.bar, VEL.lit], 18, 4) });
  };
  leg([620, 650 + bob], far, mul(VEL.skin, FAR));
  // long stiff tail, rods of tendons, a feather fan at the end
  const tl = curve([540, 600 + bob], [340, 570 + bob], [130, 560 + bob + 6 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 14);
  plumes(p, tl.slice(6), 80, rad(-158), VEL.feather, 3, 12); plumes(p, tl.slice(6), 70, rad(158), VEL.feather, 4, 12);
  cel(p, tube(tl, 42, 8), VEL.skin, light, { d: 8, tex: () => { for (let i = 1; i < tl.length; i += 2) p.stroke([add(tl[i], 0, -44), add(tl[i], 0, 44)], 8, VEL.bar); } });
  const body = blob(680, 610 + bob, 150, 76, -0.15, 3, -0.12, 1.7, 2.1);
  cel(p, body, VEL.skin, light, { d: 12, tex: () => { p.poly(blob(720, 660 + bob, 120, 34, -0.15, 5), VEL.belly, 0); furFlicks(p, 520, 520, 840, 700, 60, 3, [VEL.bar, VEL.lit], 22, 4); for (let i = 0; i < 5; i++) p.stroke([[560 + i * 50, 540 + bob], [580 + i * 50, 620 + bob]], 9, VEL.bar); scars(p, 680, 570 + bob, "#F0D8B8", 2, 34, 10); } });
  plumes(p, curve([560, 545 + bob], [680, 520 + bob], [800, 540 + bob], 8), 50, rad(-150), VEL.feather, 5, 10);
  leg([660, 660 + bob], near, VEL.skin);
  // winged arm folded, the three claws out on the attack
  const sh: P2 = [800, 600 + bob], wr = add(sh, 70 + 70 * roar, 40 - 50 * roar);
  plumes(p, curve(sh, lerp2(sh, wr, 0.5), wr, 6), 90, rad(150 - 60 * roar), VEL.feather, 7, 14);
  cel(p, tube([sh, add(sh, 30, 40), wr], 16, 10), VEL.skin, light, { d: 4, ow: 9 });
  for (let i = 0; i < 3; i++) claw(p, add(wr, i * 4, i * 6), 30, 0.6 + i * 0.25 - 0.8 * roar, 6);
  // neck + long low skull with a slight upturn, teeth
  const neck = curve([800, 580 + bob], [860, 520 + bob], [900, 480 + bob], 8);
  plumes(p, neck.slice(1), 40, rad(-160), VEL.feather, 9, 10);
  cel(p, tube(neck, 40, 28), VEL.skin, light, { d: 6, tex: () => furFlicks(p, 760, 440, 940, 600, 20, 7, [VEL.bar], 14, 3) });
  const hinge: P2 = [905, 486 + bob], ja = rad(34) * roar, J = (q: P2[]) => rotAll(offs(q, 0, bob), ja, hinge);
  p.poly([[905, 478 + bob], [1120, 472 + bob], ...J([[1110, 488], [905, 494]])], VEL.mouth, 0);
  for (let i = 0; i < 8; i++) { const [tx, ty] = J([[930 + i * 22, 492]])[0]; tooth(p, tx, ty, 10, false, ja, 0.3); }
  cel(p, J([[900, 490], [1110, 486], [1096, 502], [930, 512]]), mul(VEL.skin, [0.9, 0.9, 0.92]), light, { d: 4, ow: OW * 0.7 });
  for (let i = 0; i < 9; i++) tooth(p, 925 + i * 21, 478 + bob - i * 0.4, 12 + (i % 2) * 4, true, 0, 0.3);
  cel(p, chaikin(offs([[880, 470], [905, 440], [960, 432], [1060, 446], [1130, 462], [1124, 472], [1000, 476], [905, 484]], 0, bob), 2), VEL.skin, light, { d: 6, tex: () => { scales(p, 870, 420, 1140, 490, 8, VEL.bar, 11, 0.45); p.stroke([[990, 444 + bob], [1050, 460 + bob]], 4, INKB); } });
  plumes(p, [[900, 440 + bob], [890, 450 + bob]], 46, rad(-150), VEL.feather, 13, 9);
  beastEye(p, 945, 452 + bob, 0.72, expr, o.blink ?? 0, VEL.skin, "#F2D23A");
}

// ------------------------------------------------------------------ wyvern: two legs, the wings are its forelimbs (walks on the wrists), barbed tail, venom
const WYV = { ...DRG, skin: "#2E3A2A", back: "#141A12", belly: "#9AA06A", scale: "#3E4A36", mem: "#3A4A1E", memLit: "#7A8A3A", horn: "#C8C8A6", mouth: "#1A0A08", gum: "#5A6A20", scar: "#B8C08A" };
export function drawWyvernB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 8), roar = o.roar ?? 0, far = walkOf(o, 0.5), near = walkOf(o, 0), wk = 0.04 - 0.03 * roar;
  memWing(p, { sh: [820, 500 + bob], rear: [560, 560 + bob], span: 480, flapK: wk, col: mul(WYV.skin, FAR), mem: mul(WYV.mem, FAR), light, fingers: 4, scallop: 0.3, arm: 26, seed: 3, back: 0.2 });
  const wristLeg = (sh: P2, w: { swing: number; lift: number }, col: string) => { // the folded wing's wrist is planted like a foot
    const wr: P2 = [sh[0] + 120 + Math.sin(w.swing) * 140, GROUND - 30 - w.lift], el: P2 = [sh[0] + 40, (sh[1] + wr[1]) / 2 + 20];
    cel(p, tube([sh, el, wr], 34, 22), col, light, { d: 6 }); for (let i = 0; i < 3; i++) claw(p, add(wr, -10 + i * 14, 18), 30, 0.3 + i * 0.1, 8);
  };
  wristLeg([860, 560 + bob], walkOf(o, 0.75), mul(WYV.skin, FAR));
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => { const L = digiLeg(hip, 0.85, w.swing, w.lift);
    cel(p, tube(curve(L[1], lerp2(L[1], L[2], 0.5), L[2], 6), 56, 34), col, light, { d: 10 }); cel(p, tube([L[2], L[3]], 34, 26), col, light, { d: 6 });
    for (let i = 0; i < 3; i++) claw(p, add(L[3], 10 + i * 22, 8), 40, 0.2 + i * 0.12, 10);
    cel(p, rotAll(blob(hip[0] + 24, hip[1] + 30, 100, 120, 0.4, 9, -0.2, 1.7, 2.0), w.swing * 0.6, hip), col, light, { tex: () => scales(p, hip[0] - 90, hip[1] - 60, hip[0] + 120, hip[1] + 160, 16, WYV.back, 3, 0.4) }); };
  leg([620, 580 + bob], far, mul(WYV.skin, FAR));
  // tail with the barbed sting
  const tl = curve([520, 560 + bob], [320, 600 + bob], [150, 520 + bob + 30 * Math.sin(2 * Math.PI * (o.phase ?? 0))], 18);
  cel(p, tube(tl, 72, 10), WYV.skin, light, { tex: () => scales(p, 40, 400, 560, 700, 16, WYV.back, 5) });
  scutes(p, tl.slice(0, 15).map(([x, y], i) => [x, y - (70 - i * 4)] as P2), 30, WYV.back, light, 7);
  const st = tl[tl.length - 1]; for (const s of [-1, 1]) cel(p, horn([add(st, 10, 0), add(st, -40, s * 30), add(st, -60, s * 60)], 14), WYV.horn, light, { d: 3, ow: 8 }); cel(p, horn([add(st, 4, 0), add(st, -50, 0), add(st, -100, -6)], 16), WYV.horn, light, { d: 3, ow: 8 });
  const body = chaikin(offs([[440, 580], [520, 480], [700, 450], [860, 470], [930, 540], [900, 640], [740, 690], [540, 670]], 0, bob), 3);
  cel(p, body, WYV.skin, light, { tex: () => { p.poly(blob(720, 660 + bob, 180, 34, -0.1, 5), WYV.belly, 0); scales(p, 430, 440, 940, 700, 16, WYV.back, 9, 0.5); scars(p, 680, 500 + bob, WYV.scar, 4, 60); } });
  scutes(p, curve([480, 490 + bob], [680, 430 + bob], [880, 470 + bob], 12), 40, WYV.back, light, 11);
  leg([660, 590 + bob], near, WYV.skin);
  // neck rises steeply; head spits venom
  const nb: P2 = [880, 520 + bob], neckL = rotAll(curve(nb, [980, 420 + bob], [1000, 300 + bob], 12), -rad(8) * roar, nb);
  cel(p, tube(neckL, 70, 46), WYV.skin, light, { tex: () => scales(p, 840, 220, 1080, 560, 14, WYV.back, 13) });
  scutes(p, neckL.map(([x, y]) => [x - 40, y - 52] as P2), 26, WYV.back, light, 17);
  p.g.save(); const H = neckL[neckL.length - 1]; p.g.translate(H[0], H[1]); p.g.scale(0.82, 0.82); p.g.translate(-H[0], -H[1]);
  const m = dragonHead(p, o, H, rad(6) - rad(10) * roar, light, WYV); p.g.restore();
  const mm = lerp2(H, m, 0.82); fire(p, mm, rad(18), 600, roar, o.phase ?? 0, true);
  memWing(p, { sh: [800, 510 + bob], rear: [560, 580 + bob], span: 500, flapK: wk, col: WYV.skin, mem: WYV.mem, light, fingers: 4, scallop: 0.3, arm: 30, seed: 5, holes: true, back: 0.2 });
  wristLeg([830, 570 + bob], walkOf(o, 0.25), WYV.skin);
  void near;
}

// ------------------------------------------------------------------ basilisk: the king of serpents, rearing, a spined hood, a crown, the deadly stare
const BAS = { skin: "#2E3A22", band: "#C8A82A", belly: "#D8C890", hood: "#5A6A2A", hoodDark: "#1A2010", crown: "#E2B83A", mouth: "#2A0A10" };
export function drawBasiliskB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", w = o.walk ?? 0.4;
  const line: P2[] = [];
  for (let i = 0; i <= 44; i++) { const t = i / 44; if (t < 0.62) { const x = 60 + (t / 0.62) * 900; line.push([x, GROUND - 50 - Math.sin(t * 10 - ph * 2) * 34 * (0.4 + w) - t * 10]); } else { const k = (t - 0.62) / 0.38; line.push([960 + Math.sin(k * Math.PI * 0.55) * (180 + 60 * roar), GROUND - 60 - (1 - Math.cos(k * Math.PI * 0.5)) * 560 - k * 40]); } }
  const r = (i: number) => { const t = i / 44; return 12 + 78 * Math.sin(Math.min(1, t * 1.7) * Math.PI / 2) - (t > 0.8 ? (t - 0.8) * 150 : 0); };
  const H = line[44];
  // the hood: a fan of spines with membrane behind the head
  const hc: P2 = add(H, -30, 70), spines: P2[] = []; for (let i = 0; i < 9; i++) { const a = rad(-200 + i * 26); spines.push(add(hc, Math.cos(a) * (170 + 30 * roar) * (i % 2 ? 0.85 : 1), Math.sin(a) * (200 + 30 * roar) * (i % 2 ? 0.85 : 1))); }
  cel(p, chaikin([add(hc, -20, 120), ...spines, add(hc, 20, 120)], 1), BAS.hood, light, { d: 10, tex: () => { spines.forEach((sp) => p.stroke([hc, sp], 6, BAS.hoodDark)); p.g.globalAlpha = 0.8; for (const [dx, dy] of [[-80, -40], [60, -60], [-30, 60]]) { p.ell(hc[0] + dx, hc[1] + dy, 24, 18, BAS.hoodDark, 0); p.ell(hc[0] + dx, hc[1] + dy, 10, 8, BAS.band, 0); } p.g.globalAlpha = 1; } });
  spines.forEach((sp) => p.poly(horn([sp, add(sp, (sp[0] - hc[0]) * 0.12, (sp[1] - hc[1]) * 0.12), add(sp, (sp[0] - hc[0]) * 0.24, (sp[1] - hc[1]) * 0.24)], 9), BAS.crown, 3));
  const outline = ribbon(line, r);
  cel(p, outline, BAS.skin, light, { d: 22, tex: () => { line.forEach((q, i) => { if (i % 4 || i > 40) return; p.poly(ribbon(line.slice(i, i + 2), (j) => r(i + j) * 1.02), BAS.band, 0); }); line.forEach((q, i) => { if (i % 2) return; p.ell(q[0] - 6, q[1] + r(i) * 0.6, r(i) * 0.4, r(i) * 0.2, BAS.belly, 0); }); scales(p, 40, 300, 1300, 990, 14, "#141A10", 41, 0.35); } });
  // head: broad, crowned, long fangs, venom drip
  const ja = rad(46) * roar, hx = H[0] + 20, hy = H[1] - 10, J = (q: P2[]) => rotAll(offs(q, hx, hy), ja, [hx - 30, hy + 14]);
  p.poly([[hx - 30, hy + 6], [hx + 170, hy + 4], ...J([[160, 30], [-30, 30]])], BAS.mouth, 0);
  if (roar > 0.05) { for (const [x, l] of [[120, 70], [90, 56]] as [number, number][]) { tooth(p, hx + x, hy + 4, l, true, 0, 0.16); p.g.globalAlpha = 0.8; p.stroke([[hx + x + 4, hy + 4 + l], [hx + x + 6, hy + 30 + l + 30 * roar]], 5, "#B8E05A"); p.g.globalAlpha = 1; } }
  cel(p, J([[-30, 22], [160, 26], [140, 56], [-20, 60]]), BAS.belly, light, { d: 4, ow: OW * 0.8 });
  const head = chaikin(offs([[-70, -20], [-20, -70], [90, -76], [180, -30], [190, 6], [160, 18], [-20, 18], [-70, 14]], hx, hy), 2);
  cel(p, head, BAS.skin, light, { d: 12, tex: () => { scales(p, hx - 80, hy - 90, hx + 200, hy + 30, 10, "#141A10", 43, 0.5); p.poly(offs([[0, -60], [90, -64], [70, -40], [10, -40]], hx, hy), BAS.band, 0); } });
  for (let i = 0; i < 5; i++) { const b: P2 = [hx - 20 + i * 30, hy - 66 - Math.abs(i - 2) * -2], L = 50 + (2 - Math.abs(i - 2)) * 26; cel(p, horn([b, add(b, -6, -L * 0.5), add(b, -14, -L)], 11), BAS.crown, light, { d: 3, ow: 8 }); } // the crown
  p.g.globalAlpha = 0.5; p.ell(hx + 70, hy - 26, 60, 40, "#FFF070", 0); p.g.globalAlpha = 1; // the deadly glare
  beastEye(p, hx + 70, hy - 26, 1.0, expr, o.blink ?? 0, BAS.skin, "#FFF04A");
}

// ------------------------------------------------------------------ Nessie: a bulky humped lake monster, thick maned neck, small horse-like head (swims, cy 560)
const NES = { skin: "#3A4630", dark: "#1E2618", spot: "#5E6A44", belly: "#B8B490", fin: "#262E1E", mane: "#141A10", mouth: "#22090E" };
export function drawNessieB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.35 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 600;
  const fl = (at: P2, a: number, L: number, col: string) => cel(p, rotAll([at, add(at, -L * 0.3, L * 0.9), add(at, -L * 0.7, L), add(at, -L * 0.45, L * 0.2)], a, at), col, light, { d: 8 });
  fl([760, cy + 60], -0.3 + sw, 210, mul(NES.fin, FAR)); fl([420, cy + 60], -0.3 - sw, 170, mul(NES.fin, FAR));
  cel(p, tube(curve([330, cy + 20], [220, cy + 50], [90, cy + 30], 8), 60, 10), NES.skin, light, { d: 8 });
  // bulky body with two humps along the back
  const body = chaikin([[300, cy + 30], [360, cy - 70], [460, cy - 160], [560, cy - 100], [640, cy - 190], [760, cy - 120], [860, cy - 60], [880, cy + 80], [700, cy + 150], [420, cy + 130]], 3);
  cel(p, body, NES.skin, light, { d: 26, tex: () => { p.poly(blob(600, cy + 110, 240, 40, 0, 5), NES.belly, 0); const r = rng(5); for (let i = 0; i < 40; i++) p.ell(320 + r() * 560, cy - 160 + r() * 260, 10 + r() * 22, 7 + r() * 14, r() < 0.5 ? NES.spot : NES.dark, 0); scars(p, 600, cy - 80, "#D8D0B0", 3, 60); } });
  scutes(p, curve([380, cy - 80], [560, cy - 230], [820, cy - 90], 14), 20, NES.dark, light, 7);
  fl([740, cy + 80], -0.1 - sw, 230, NES.fin); fl([400, cy + 80], -0.1 + sw, 180, NES.fin);
  // thick neck, mane ridge; the head lunges on the attack
  const nk = curve([840, cy - 40], [1050 + 60 * roar, cy - 300 + 80 * roar], [1180 + 120 * roar, 260 + 140 * roar], 16);
  cel(p, tube(nk, 96, 50), NES.skin, light, { d: 12, tex: () => { scales(p, 800, 180, 1400, cy, 11, NES.dark, 9, 0.35); for (let i = 3; i < nk.length - 1; i += 2) p.stroke([add(nk[i], 30, 30), add(nk[i], 70, 26)], 4, NES.belly); } });
  plumes(p, nk.slice(2, 15).map(([x, y]) => [x - 26, y - 46] as P2), 60, rad(-150), NES.mane, 9, 16);
  const H = nk[nk.length - 1], ja = rad(34) * roar, J = (q: P2[]) => rotAll(offs(q, H[0], H[1]), ja, add(H, 0, 20));
  p.poly([add(H, 0, 12), add(H, 150, 30), ...J([[140, 44], [0, 30]])], NES.mouth, 0);
  for (let i = 0; i < 6; i++) { tooth(p, H[0] + 30 + i * 20, H[1] + 16 + i * 2.5, 16, true, 0.15, 0.28); const [tx, ty] = J([[30 + i * 20, 30 + i * 2.5]])[0]; tooth(p, tx, ty, 14, false, ja, 0.28); }
  cel(p, J([[-10, 26], [140, 40], [120, 64], [10, 60]]), NES.belly, light, { d: 4, ow: OW * 0.75 });
  cel(p, chaikin(offs([[-40, 0], [0, -50], [80, -46], [150, 10], [154, 30], [0, 30], [-40, 26]], H[0], H[1]), 2), NES.skin, light, { d: 8, tex: () => scales(p, H[0] - 50, H[1] - 70, H[0] + 170, H[1] + 40, 9, NES.dark, 11, 0.4) });
  for (const d of [0, 24]) cel(p, blob(H[0] + 10 + d, H[1] - 56, 12, 20, -0.3, 3), NES.dark, light, { d: 3, ow: 7, rim: false }); // horn-knobs
  beastEye(p, H[0] + 50, H[1] - 18, 0.75, expr, o.blink ?? 0, NES.skin, "#F2D23A");
}

// ------------------------------------------------------------------ hydra: heavy swamp reptile, five serpent heads with frilled crests, venom breath
const HYD = { skin: "#3A4A26", back: "#18200E", belly: "#C8B860", frill: "#8A2A1A", fang: "#EDE2C4", mouth: "#2A0A10" };
function serpentHead(p: Pen, H: P2, roar: number, light: number, rot: number, expr: AnimalPose["expr"], blink: number) {
  const R = (q: P2[]) => rotAll(offs(q, H[0], H[1]), rot, H), ja = rad(44) * roar, J = (q: P2[]) => rotAll(R(q), ja, R([[-10, 16]])[0]);
  cel(p, R([[-40, -10], [-90, -110], [-30, -70], [0, -130], [30, -60], [70, -110], [60, -30]]), HYD.frill, light, { d: 6, ow: 9, tex: () => { const a = R([[-10, -20]])[0]; for (const t of R([[-90, -110], [0, -130], [70, -110]])) p.stroke([a, t], 4, "#3A0E08"); } }); // frilled crest
  p.poly([...R([[-10, 8], [170, 14]]), ...J([[160, 34], [-10, 30]])], HYD.mouth, 0);
  for (const [x, l] of [[130, 48], [100, 30], [70, 24]] as [number, number][]) tooth(p, ...R([[x, 10]])[0], l, true, rot, 0.22);
  cel(p, J([[-20, 24], [160, 30], [130, 58], [-10, 56]]), HYD.belly, light, { d: 4, ow: OW * 0.75, tex: () => { for (let i = 0; i < 4; i++) { const [tx, ty] = J([[30 + i * 30, 26]])[0]; tooth(p, tx, ty, 14, false, rot + ja, 0.25); } } });
  cel(p, R(chaikin([[-50, -10], [-10, -60], [90, -56], [180, 0], [176, 16], [-20, 16], [-50, 14]], 2)), HYD.skin, light, { d: 8, tex: () => { const a = R([[-60, -70]])[0], b = R([[190, 30]])[0]; scales(p, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), 9, HYD.back, 13, 0.5); } });
  const e = R([[60, -26]])[0]; beastEye(p, e[0], e[1], 0.7, expr, blink, HYD.skin, "#FFE04A");
  return R([[170, 22]])[0];
}
const HYDRA: QuadSpec = { fur: HYD.skin, dark: HYD.back, lit: "#6A7A40", belly: HYD.belly, skin: "#0A0808", iris: "#FFE04A",
  x0: 360, x1: 880, ys: 600, yh: 610, yb: 790, hump: 50, hind: [96, 56], front: [92, 54], bendH: 40, bendF: -20, toes: 4, toe: 44,
  head: { L: 1, h: 1, type: "reptile" }, neck: [0, 0, 0], tail: "stiff", scaly: true, heads: 0, bob: 4 };
export const drawHydraB: Draw = (p, o) => drawQuadB(p, o, { ...HYDRA,
  postFn: (p2, o2, light, bob) => {
    const roar = o2.roar ?? 0;
    scutes(p2, curve([400, 560 + bob], [620, 500 + bob], [860, 560 + bob], 14), 40, HYD.back, light, 21);
    for (let k = 0; k < 5; k++) {
      const b: P2 = [840 - k * 20, 640 + bob], a = rad(-112 + k * 30), sw = 0.14 * Math.sin(2 * Math.PI * (o2.phase ?? 0) + k * 1.4), L = 300 + (k % 2) * 60;
      const H: P2 = [b[0] + Math.cos(a + sw) * L + 140, b[1] + Math.sin(a + sw) * L - 40], neck = curve(b, add(lerp2(b, H, 0.5), -40, 30), H, 12);
      cel(p2, ribbon(neck, (i) => 46 - i * 1.6), k % 2 ? mul(HYD.skin, FAR) : HYD.skin, light, { d: 6, tex: () => { scales(p2, Math.min(b[0], H[0]) - 60, H[1] - 80, Math.max(b[0], H[0]) + 60, b[1] + 60, 10, HYD.back, k, 0.5); neck.forEach((q, i) => { if (i % 3 === 0) p2.ell(q[0] + 18, q[1] + 20, 14, 8, HYD.belly, 0); }); } });
      const m = serpentHead(p2, H, k === 2 ? roar : roar * 0.5, light, rad(-8 + k * 6) - rad(8) * roar, o2.expr ?? "angry", o2.blink ?? 0);
      if (k === 2) fire(p2, m, rad(14), 560, roar, o2.phase ?? 0, true);
    }
  } });

// ------------------------------------------------------------------ Megalania (Pleistocene Australia; ~5-7 m monitor lizard)
export const drawMegalaniaB: Draw = (p, o) => drawQuadB(p, o, { fur: "#5A5236", dark: "#2A2618", lit: "#8A8256", belly: "#C8BC90", skin: "#0E0A08", iris: "#F2C230",
  x0: 420, x1: 900, ys: 730, yh: 740, yb: 860, hump: 10, hind: [64, 34], front: [60, 32], bendH: 70, bendF: -40, toes: 5, toe: 30,
  head: { L: 300, h: 110, type: "reptile", fangs: 8, open: 50 }, neck: [90, 20, 76], tail: "stiff", scaly: true, stripes: 7, bob: 3,
  postFn: (p2, o2, light, bob) => { if ((o2.roar ?? 0) < 0.05) p2.stroke(curve([1300, 742 + bob], [1370, 736 + bob], [1420, 750 + bob], 6), 6, "#B0303E"); } }); // forked tongue tasting the air

// ------------------------------------------------------------------ Deinotherium (Miocene-Pleistocene; ~4 m tall, tusks curving down from the lower jaw)
const DEINT = { skin: "#6A625A", dark: "#3A3430", lit: "#9A928A", belly: "#8A827A", tusk: "#E6D8B4", mouth: "#30080E" };
export const drawDeinotherB: Draw = (p, o) => drawQuadB(p, o, { fur: DEINT.skin, dark: DEINT.dark, lit: DEINT.lit, belly: DEINT.belly, skin: "#1A1410", iris: "#FF8A1F",
  x0: 400, x1: 940, ys: 330, yh: 380, yb: 600, hump: 40, hind: [92, 70], front: [96, 74], bendH: 10, bendF: 0, toes: 4, toe: 14,
  head: { L: 1, h: 1, type: "reptile" }, neck: [40, -20, 120], tail: "short", scaly: true, charge: true, bob: 5,
  headFn: (p2, H, o2, light, rot) => {
    const roar = o2.roar ?? 0, R = (q: P2[]) => rotAll(offs(q, H[0], H[1]), rot - rad(10) * roar, H);
    const trunk = R(curve([150, 40], [230 + 20 * Math.sin(2 * Math.PI * (o2.phase ?? 0)), 200], [190, 340 - 120 * roar], 14));
    cel(p2, tube(trunk, 44, 20), DEINT.skin, light, { d: 8, tex: () => trunk.forEach((q, i) => { if (i > 2) p2.stroke([add(q, -30, -2), add(q, 30, 2)], 3, DEINT.dark); }) });
    cel(p2, R(chaikin([[-60, -60], [0, -130], [110, -130], [190, -40], [190, 60], [100, 110], [0, 90], [-60, 30]], 2)), DEINT.skin, light, { d: 12, tex: () => { const a = R([[-60, -130]])[0], b = R([[200, 110]])[0]; scales(p2, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), 12, DEINT.dark, 7, 0.4); } });
    cel(p2, R(blob(10, -20, 70, 90, 0.2, 5)), mul(DEINT.skin, [0.85, 0.85, 0.85]), light, { d: 6, rim: false }); // ear
    if (roar > 0.05) p2.ell(...R([[120, 100]])[0], 30, 20, DEINT.mouth, 4);
    for (const [d, col] of [[16, mul(DEINT.tusk, FAR)], [0, DEINT.tusk]] as [number, string][]) cel(p2, horn(R(curve([110 + d, 100], [150 + d, 200], [70 + d, 260], 12)), 22), col, light, { d: 4, ow: 9 }); // the down-curved lower tusks
    const e = R([[110, -50]])[0]; beastEye(p2, e[0], e[1], 0.8, o2.expr ?? "angry", o2.blink ?? 0, DEINT.skin, "#FF8A1F");
  } });

// ------------------------------------------------------------------ Xiphactinus (Late Cretaceous sea; ~5.5 m bulldog fish, upturned jaw, fangs) (cy 520)
const XIP = { top: "#2E3E4E", side: "#7A92A6", belly: "#E2E6E2", fin: "#22303C", mouth: "#22090E", gum: "#8A2C38" };
export function drawXiphoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sweep = Math.sin(ph) * 0.18 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  cel(p, rotAll([[300, cy - 10], [140, cy - 230], [200, cy - 20], [200, cy + 20], [140, cy + 230], [300, cy + 10]] as P2[], sweep, [280, cy]), XIP.fin, light, { d: 10 });
  const body = chaikin(rotAll([[280, cy - 10], [420, cy - 90], [700, cy - 140], [1000, cy - 140], [1200, cy - 110], [1300, cy - 60], [1310, cy + 60], [1200, cy + 120], [900, cy + 140], [600, cy + 110], [400, cy + 60], [290, cy + 10]] as P2[], sweep * 0.25, [800, cy]), 3);
  cel(p, body, XIP.side, light, { d: 26, tex: () => { p.poly(chaikin([[290, cy + 10], [700, cy + 40], [1300, cy + 30], [1200, cy + 140], [600, cy + 150], [300, cy + 40]], 2), XIP.belly, 0); p.poly(chaikin([[300, cy - 20], [700, cy - 160], [1250, cy - 110], [1280, cy - 60], [700, cy - 60]], 2), XIP.top, 0); scales(p, 280, cy - 160, 1320, cy + 160, 16, XIP.top, 31, 0.35); scars(p, 800, cy - 80, "#D8DCE0"); } });
  cel(p, [[640, cy - 130], [700, cy - 250], [760, cy - 236], [800, cy - 128]], XIP.fin, light, { d: 8 });
  for (const [x, a] of [[1080, 0.1], [700, 0.2]] as [number, number][]) cel(p, rotAll([[x, cy + 80], [x - 160, cy + 200], [x - 190, cy + 180], [x - 40, cy + 70]] as P2[], a + sweep, [x, cy + 80]), XIP.fin, light, { d: 6 });
  // bulldog head: the lower jaw juts up and forward, fangs
  const hinge: P2 = [1200, cy + 60], ja = rad(38) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1200, cy - 40], [1380, cy - 60], ...J([[1400, cy - 10], [1200, cy + 70]])], XIP.mouth, 0);
  if (roar > 0.05) p.poly(J([[1220, cy + 50], [1390, cy - 10], [1380, cy + 10], [1230, cy + 64]]), XIP.gum, 0);
  for (let i = 0; i < 7; i++) { const [tx, ty] = J([lerp2([1230, cy + 50], [1395, cy - 12], i / 6)])[0]; tooth(p, tx, ty, i === 5 ? 50 : 24, false, ja - 0.4, 0.28); }
  cel(p, J([[1180, cy + 70], [1405, cy - 14], [1400, cy + 30], [1250, cy + 120], [1190, cy + 110]]), XIP.belly, light, { d: 8, ow: OW * 0.85 });
  for (let i = 0; i < 6; i++) tooth(p, 1240 + i * 24, cy - 44 - i * 3, i === 4 ? 46 : 22, true, 0, 0.28);
  cel(p, chaikin([[1180, cy - 120], [1300, cy - 110], [1380, cy - 70], [1385, cy - 50], [1220, cy - 36], [1180, cy + 40]], 2), XIP.side, light, { d: 10, tex: () => { p.poly([[1180, cy - 120], [1300, cy - 110], [1330, cy - 90], [1190, cy - 80]], XIP.top, 0); for (let i = 0; i < 3; i++) p.stroke(curve([1190 - i * 18, cy - 60], [1180 - i * 18, cy], [1190 - i * 18, cy + 60], 6), 6, INKB); } });
  beastEye(p, 1290, cy - 80, 1.1, expr, o.blink ?? 0, XIP.top, "#F2D23A");
}

// ------------------------------------------------------------------ Hallucigenia (Cambrian; ~3.5 cm) — a nightmare close up: back spines, clawed tentacle legs, a ring of teeth
export function drawHallucigeniaB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const sk = "#C88A7A", dark = "#5A2A22", spine = "#E8D4B0";
  const line = curve([260, 760], [800, 700 - 60 * roar], [1300, 560 - 160 * roar], 30), r = (i: number) => 40 + 10 * Math.sin(i * 0.4);
  for (let k = 0; k < 7; k++) { const q = line[3 + k * 3], sw = Math.sin(ph * 3 + k) * 30 * (o.walk ?? 0.5); for (const s of [0, 1]) { const ft: P2 = [q[0] + 20 + sw + s * 14, GROUND - 6]; p.stroke(curve(add(q, s * 10, 30), lerp2(add(q, 0, 40), ft, 0.5), ft, 8), 18 - s * 4, s ? sk : mul(sk, FAR)); for (let i = 0; i < 2; i++) claw(p, ft, 22, 0.2 + i * 0.3, 6); } }
  for (let k = 0; k < 7; k++) { const q = line[3 + k * 3]; for (const s of [6, 0]) cel(p, horn([add(q, s, -30), add(q, -10 + s, -150), add(q, -26 + s, -270)], 18), s ? mul(spine, FAR) : spine, light, { d: 4, ow: 9 }); }
  cel(p, ribbon(line, r), sk, light, { d: 14, tex: () => { line.forEach((q, i) => { if (i % 2) return; p.stroke([add(q, 0, -r(i)), add(q, 0, r(i))], 4, dark); }); } });
  // head: a bulb with tiny eyes and a radial mouth of teeth; the tail end trails thin tentacles
  const H = line[line.length - 1]; cel(p, blob(H[0] + 40, H[1] - 10, 70, 56, 0, 3), sk, light, { d: 8 });
  p.ell(H[0] + 100, H[1], 34, 34, "#1A0608", 5); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; tooth(p, H[0] + 100 + Math.cos(a) * 30, H[1] + Math.sin(a) * 30, 18, false, a + Math.PI / 2 + Math.PI, 0.3); }
  for (const d of [0, 20]) beastEye(p, H[0] + 40 + d, H[1] - 44, 0.4, expr, o.blink ?? 0, sk, "#1A1A1A");
  for (let i = 0; i < 4; i++) p.stroke(curve(line[0], add(line[0], -80, -20 + i * 14), add(line[0], -160, -40 + i * 26), 6), 6, sk);
}

void blob; void FAR; void scars; void rng; void furFlicks;
