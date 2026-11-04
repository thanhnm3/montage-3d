// Fantasy beasts (2026-11-04, user: "kể cả các con thú trong tưởng tượng ... làm hết"), same beast look and API.
// Built from the shared bodies: drawQuadB / quadHead (griffin, manticore, chimera, cerberus, unicorn, pegasus), drawApeB
// (yeti, bigfoot), drawSoarB (phoenix, thunderbird), dragonHead + memWing (hydra, leviathan, manticore wings),
// canvas-filter colour variants (wyvern, basilisk, Nessie). Our own designs (no copied film / game creature).
import { Pen, mul } from "./toon";
import { AnimalPose, P2, blob, curve, rad, rotAll, tube } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, furFlicks } from "./beastMore";
import { drawBoaB } from "./beastAnimals";
import { DRG, dragonHead, drawDragonFlyB, featherWing, fire, memWing, plumes } from "./beastWings";
import { drawElasmoB } from "./beastExtra";
import { QuadSpec, drawApeB, drawQuadB, drawSoarB, quadHead, tinted } from "./beastAncient";

const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
type Draw = (p: Pen, o: AnimalPose) => void;
/** draw something scaled about a point (for small dragon heads on the hydra, etc.) */
function scaled(p: Pen, at: P2, s: number, fn: () => void) { p.g.save(); p.g.translate(at[0], at[1]); p.g.scale(s, s); p.g.translate(-at[0], -at[1]); fn(); p.g.restore(); }

// ------------------------------------------------------------------ eagle head (griffin)
function eagleHead(p: Pen, H: P2, o: AnimalPose, light: number, rot: number, C: { head: string; beak: string; tip: string; ruff: string }) {
  const roar = o.roar ?? 0, ja = rad(32) * roar, R = (q: P2[]) => rotAll(q.map(([x, y]) => [H[0] + x, H[1] + y] as P2), rot, H), J = (q: P2[]) => rotAll(R(q), ja, R([[60, 10]])[0]);
  plumes(p, R([[-40, -40], [-50, 0], [-40, 40], [-20, 70]]), 80, rot + rad(160), C.ruff, 3, 18);
  p.poly([...R([[60, 4], [230, 20]]), ...J([[220, 36], [60, 24]])], "#30080E", 0);
  cel(p, J([[50, 20], [220, 34], [190, 60], [70, 56]]), C.beak, light, { d: 4, ow: OW * 0.75 });
  cel(p, R(chaikin([[-60, 0], [-30, -70], [60, -90], [130, -60], [140, 10], [60, 30], [-40, 50]], 2)), C.head, light, { d: 10, tex: () => furFlicks(p, H[0] - 80, H[1] - 110, H[0] + 160, H[1] + 60, 30, 11, [C.ruff], 16, 4) });
  cel(p, R(chaikin([[110, -60], [200, -50], [260, -10], [270, 50], [240, 70], [230, 20], [160, 10], [110, 6]], 2)), C.beak, light, { d: 6, ow: OW * 0.85, tex: () => p.poly(R([[230, -10], [272, 30], [250, 76], [226, 30]]), C.tip, 0) });
  p.poly(R([[20, -70], [140, -66], [140, -46], [30, -46]]), INKB, 0);
  const e = R([[80, -40]])[0]; beastEye(p, e[0], e[1], 0.95, o.expr ?? "angry", o.blink ?? 0, C.head, "#F2C230");
}
function snakeHead(p: Pen, H: P2, roar: number, light: number, col: string, rot: number) {
  const R = (q: P2[]) => rotAll(q.map(([x, y]) => [H[0] + x, H[1] + y] as P2), rot, H), ja = rad(40) * roar, J = (q: P2[]) => rotAll(R(q), ja, R([[0, 10]])[0]);
  p.poly([...R([[0, 4], [110, 8]]), ...J([[100, 22], [0, 18]])], "#30080E", 0);
  tooth(p, ...R([[80, 6]])[0], 28, true, rot, 0.2); tooth(p, ...R([[60, 6]])[0], 22, true, rot, 0.2);
  cel(p, J([[-10, 12], [100, 20], [80, 40], [0, 36]]), col, light, { d: 4, ow: OW * 0.7 });
  cel(p, R(chaikin([[-40, -10], [0, -40], [80, -34], [130, 0], [110, 12], [0, 14], [-40, 14]], 2)), col, light, { d: 6, tex: () => scales(p, H[0] - 60, H[1] - 60, H[0] + 140, H[1] + 40, 9, mul(col, [0.5, 0.5, 0.5]), 3, 0.5) });
  const e = R([[40, -14]])[0]; beastEye(p, e[0], e[1], 0.6, "angry", 0, col, "#F2D23A");
}

// ------------------------------------------------------------------ griffin: lion body, eagle head + wings
const LION: QuadSpec = { fur: "#B08A56", dark: "#6A4A2A", lit: "#D8B07A", belly: "#E2CCA0", skin: "#2A1A14", iris: "#F2D23A",
  x0: 420, x1: 980, ys: 480, yh: 500, yb: 660, hump: 10, hind: [70, 34], front: [74, 38], bendH: 44, bendF: -12, toes: 4, toe: 26,
  head: { L: 230, h: 150, type: "cat", fangs: 5 }, neck: [70, 50, 92], tail: "tuft", bob: 7 };
export const drawGriffinB: Draw = (p, o) => {
  const w = { span: 470, k: (o.roar ?? 0) > 0.05 ? 0.02 : 0.15 + 0.1 * Math.sin(2 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0) };
  drawQuadB(p, o, { ...LION, fur: "#9A7A50", lit: "#C8A070", neck: [80, 90, 86],
    preFn: (p2, o2, light, bob) => featherWing(p2, [880, 470 + bob], [620, 520 + bob], w.span, w.k, mul("#4A3420", FAR), "#8A6A44", light, 3, 12),
    headFn: (p2, H, o2, light, rot) => eagleHead(p2, H, o2, light, rot, { head: "#E8E2D6", beak: "#E2B84A", tip: "#3A2A14", ruff: "#C8C0B0" }),
    postFn: (p2, o2, light, bob) => featherWing(p2, [860, 480 + bob], [620, 530 + bob], w.span + 20, w.k, "#4A3420", "#9A7A50", light, 7, 12) });
};
// ------------------------------------------------------------------ manticore: red lion, a mouth of fangs, bat wings, scorpion tail
export const drawManticoreB: Draw = (p, o) => {
  const roar = o.roar ?? 0;
  drawQuadB(p, o, { ...LION, fur: "#8A3A24", dark: "#3A140C", lit: "#C0603A", belly: "#C89A7A", iris: "#FF3A1A", mane: "#2A0E08", tail: "none",
    head: { L: 250, h: 160, type: "cat", fangs: 9 },
    preFn: (p2, o2, light, bob) => {
      memWing(p2, { sh: [840, 470 + bob], rear: [600, 520 + bob], span: 480, flapK: 0.1 - 0.08 * roar, col: mul(DRG.skin, FAR), mem: mul("#5A1410", FAR), light, fingers: 4, scallop: 0.3, arm: 26, seed: 3 });
      // scorpion tail arching over the back, stinger strikes forward on the attack
      const pts = curve([440, 540 + bob], [250, 200 + bob], [560 + 220 * roar, 150 + bob + 60 * roar], 12);
      pts.forEach((q, i) => cel(p2, blob(q[0], q[1], 34 - i * 1.2, 30 - i, 0, i), i % 2 ? "#5A2A1A" : "#3A1A10", light, { d: 4, ow: 8, rim: false }));
      const e = pts[pts.length - 1]; cel(p2, horn(curve(e, add(e, 60, 10), add(e, 90, 70), 8), 22), "#2A100A", light, { d: 3, ow: 8 });
    },
    postFn: (p2, o2, light, bob) => memWing(p2, { sh: [820, 480 + bob], rear: [600, 540 + bob], span: 500, flapK: 0.1 - 0.08 * roar, col: DRG.skin, mem: "#5A1410", light, fingers: 4, scallop: 0.3, arm: 30, seed: 5, holes: true }) });
};
// ------------------------------------------------------------------ chimera: lion + a goat head rising from the back + a snake for a tail
export const drawChimeraB: Draw = (p, o) => {
  const roar = o.roar ?? 0;
  drawQuadB(p, o, { ...LION, fur: "#A0703E", mane: "#4A2A14", head: { L: 240, h: 155, type: "cat", fangs: 6 },
    tailFn: (p2, end, o2, light) => { const neck = curve(end, add(end, -60, 40), add(end, -40, -40 - 60 * roar), 8); cel(p2, tube(neck, 20, 16), "#3E5A30", light, { d: 4 }); snakeHead(p2, neck[neck.length - 1], roar, light, "#4E6A3A", rad(-150)); },
    postFn: (p2, o2, light, bob) => {
      const b: P2 = [700, 470 + bob], H: P2 = [780 + 30 * roar, 250 + bob];
      cel(p2, tube(curve(b, [720, 360 + bob], H, 8), 54, 40), "#8A7A66", light, { d: 6, tex: () => furFlicks(p2, 640, 220, 840, 500, 30, 5, ["#4A3E30"], 20, 4) });
      quadHead(p2, add(H, 0, 40), { L: 170, h: 100, type: "horse", horns: "goat", ears: true }, { fur: "#8A7A66", dark: "#4A3E30", lit: "#B8A890", belly: "#C8BCA8", skin: "#1A1410", iris: "#FF8A1F", horn: "#3A3026" }, { ...o2, roar: roar * 0.7 }, light, -rad(20) - rad(10) * roar, 1);
    } });
};
// ------------------------------------------------------------------ Cerberus: a black hound with three heads
export const drawCerberusB: Draw = (p, o) => drawQuadB(p, o, { fur: "#2A2426", dark: "#100C0E", lit: "#5A4E52", belly: "#3A3236", skin: "#0A0808", iris: "#FF3A1A", mane: "#141012",
  x0: 400, x1: 960, ys: 470, yh: 500, yb: 660, hump: 20, hind: [62, 28], front: [66, 30], bendH: 50, bendF: -10, toes: 4, toe: 24,
  head: { L: 250, h: 130, type: "dog", fangs: 6, open: 50 }, neck: [90, 60, 80], tail: "long", heads: 3, bob: 7,
  postFn: (p2, o2, light, bob) => { for (let i = 0; i < 9; i++) { const q: P2 = [930 + i * 6, 470 + bob + i * 18]; p2.poly(horn([q, add(q, 20, -6), add(q, 40, -14)], 8), "#B8B0A8", 3); } } }); // spiked collar
// ------------------------------------------------------------------ unicorn (a dark, red-eyed one) and Pegasus (storm-grey)
const HORSE: QuadSpec = { fur: "#2A2228", dark: "#120E12", lit: "#5A4E58", belly: "#3A3038", skin: "#0E0A0E", iris: "#FF2A1A", mane: "#E8E2EE", horn: "#E8DCC0",
  x0: 440, x1: 980, ys: 400, yh: 420, yb: 600, hump: 20, hind: [60, 22], front: [58, 22], bendH: 40, bendF: -6, toes: 2, toe: 18,
  head: { L: 260, h: 120, type: "horse", horns: "unicorn" }, neck: [110, 170, 86], tail: "long", charge: true, bob: 7 };
export const drawUnicornB: Draw = (p, o) => drawQuadB(p, o, { ...HORSE, tailFn: (p2, end, o2, light) => plumes(p2, [end, add(end, 0, -40), add(end, 4, -80)], 120, rad(100), "#E8E2EE", 3, 16) });
export const drawPegasusB: Draw = (p, o) => {
  const k = (o.roar ?? 0) > 0.05 ? 0.02 : 0.12 + 0.2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (o.phase ?? 0))) * (o.walk ?? 0);
  drawQuadB(p, o, { ...HORSE, fur: "#5A5E66", dark: "#2A2C32", lit: "#9AA0AA", belly: "#7A7E86", mane: "#1A1C22", iris: "#7AD8FF", head: { L: 260, h: 120, type: "horse" }, charge: false,
    preFn: (p2, o2, light, bob) => featherWing(p2, [880, 400 + bob], [640, 460 + bob], 420, k, mul("#3A3E46", FAR), "#C8CCD4", light, 3, 12),
    postFn: (p2, o2, light, bob) => featherWing(p2, [860, 410 + bob], [640, 470 + bob], 440, k, "#3A3E46", "#D8DCE4", light, 7, 12) });
};
// ------------------------------------------------------------------ yeti + bigfoot
export const drawYetiB: Draw = (p, o) => drawApeB(p, o, { fur: "#E8ECF0", dark: "#9AA6B4", lit: "#FFFFFF", face: "#5A6E86", iris: "#7AD8FF" });
export const drawBigfootB: Draw = (p, o) => drawApeB(p, o, { fur: "#4A3426", dark: "#22160E", lit: "#7A5A40", face: "#3A2A22", iris: "#FF6A1F" });
// ------------------------------------------------------------------ phoenix + thunderbird
export const drawPhoenixB: Draw = (p, o) => drawSoarB(p, o, { body: "#C8301A", lit: "#FFB020", head: "#E85A1A", beak: "#F2D26A", tip: "#5A2A10", span: 560, kind: "phoenix", iris: "#FFF6A0" });
export const drawThunderbirdB: Draw = (p, o) => drawSoarB(p, o, { body: "#1E2430", lit: "#4A6A9A", head: "#2A3448", beak: "#D8C88A", tip: "#2A2014", span: 600, kind: "thunder", iris: "#FFF6A0" });
// ------------------------------------------------------------------ wyvern (green, two legs), basilisk (king of serpents), Nessie
export const drawWyvernB: Draw = tinted(drawDragonFlyB, "hue-rotate(95deg) saturate(1.25)");
export const drawNessieB: Draw = tinted(drawElasmoB, "hue-rotate(-75deg) saturate(1.5) brightness(0.88)");
export const drawBasiliskB: Draw = (p, o) => {
  tinted(drawBoaB, "hue-rotate(-35deg) saturate(1.6) brightness(0.9)")(p, o);
  const hx = 1240, hy = 390, S = 1.55; // the boa's head (see drawBoaB)
  for (let i = 0; i < 5; i++) { const b: P2 = [hx + (-40 + i * 20) * S, hy - (52 + Math.abs(i - 2) * -4) * S], a = rad(-120 + i * 12); cel(p, horn([b, add(b, Math.cos(a) * 30 * S, Math.sin(a) * 30 * S), add(b, Math.cos(a) * (60 + (2 - Math.abs(i - 2)) * 20) * S, Math.sin(a) * (60 + (2 - Math.abs(i - 2)) * 20) * S)], 10 * S), "#D8A82A", o.light ?? rad(-120), { d: 3, ow: 8 }); } // the crown
  p.g.globalAlpha = 0.55; p.ell(hx + 60 * S, hy - 22 * S, 50, 34, "#FFF070", 0); p.g.globalAlpha = 1; // the deadly glare
};
// ------------------------------------------------------------------ hydra: a reptile body with five dragon necks
export const drawHydraB: Draw = tinted((p, o) => {
  const roar = o.roar ?? 0;
  drawQuadB(p, o, { fur: DRG.skin, dark: DRG.back, lit: "#6A4A50", belly: DRG.belly, skin: "#0A0808", iris: "#FFD23A",
    x0: 380, x1: 900, ys: 560, yh: 560, yb: 760, hump: 40, hind: [80, 44], front: [76, 42], bendH: 40, bendF: -16, toes: 4, toe: 40,
    head: { L: 1, h: 1, type: "reptile" }, neck: [0, 0, 0], tail: "stiff", scaly: true, heads: 0, bob: 5,
    postFn: (p2, o2, light, bob) => {
      for (let k = 0; k < 5; k++) {
        const b: P2 = [860, 600 + bob], a = rad(-100 + k * 30), sw = 0.15 * Math.sin(2 * Math.PI * (o.phase ?? 0) + k);
        const H: P2 = [b[0] + Math.cos(a + sw) * 380 + 120, b[1] + Math.sin(a + sw) * 380 - 60], neck = curve(b, lerp2(b, H, 0.5), H, 10);
        cel(p2, tube(neck, 52, 34), k % 2 ? mul(DRG.skin, FAR) : DRG.skin, light, { d: 6, tex: () => scales(p2, b[0] - 60, H[1] - 80, H[0] + 80, b[1] + 60, 12, DRG.back, k, 0.5) });
        scutes(p2, neck.map(([x, y]) => [x - 10, y - 40] as P2), 18, DRG.back, light, k + 3);
        scaled(p2, H, 0.5, () => { const m = dragonHead(p2, { ...o2, roar: k === 2 ? roar : roar * 0.6 }, H, rad(-10 + k * 8), light); if (k === 2) fire(p2, m, rad(20), 520, roar, o.phase ?? 0); });
      }
    } });
}, "hue-rotate(95deg) saturate(1.2)");
// ------------------------------------------------------------------ Leviathan: an ocean serpent (swims, cy 520)
export const drawLeviathanB: Draw = tinted((p, o) => {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, cy = 520;
  const line: P2[] = []; for (let i = 0; i <= 40; i++) { const u = i / 40; line.push([60 + u * 1150, cy + 140 * Math.sin(u * 8 - ph * 2) * (1 - u * 0.7) * (0.4 + (o.walk ?? 0.6))]); }
  const rad_ = (i: number) => 12 + 80 * Math.sin(Math.min(1, (i / 40) * 1.4) * Math.PI / 2);
  const L: P2[] = [], Rr: P2[] = [];
  line.forEach((q, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(40, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; L.push([q[0] - dy * rad_(i), q[1] + dx * rad_(i)]); Rr.push([q[0] + dy * rad_(i), q[1] - dx * rad_(i)]); });
  for (let i = 6; i < 38; i += 6) { const q = line[i]; cel(p, rotAll([q, add(q, -60, 160), add(q, -110, 150)], 0.3 * Math.sin(ph + i), q), mul(DRG.mem, FAR), light, { d: 4, ow: 8, rim: false }); } // fins
  cel(p, [...L, ...Rr.reverse()], DRG.skin, light, { d: 20, tex: () => { scales(p, 40, cy - 260, 1260, cy + 260, 14, DRG.back, 5, 0.5); line.forEach((q, i) => { if (i % 2) return; p.ell(q[0], q[1] + rad_(i) * 0.6, rad_(i) * 0.5, rad_(i) * 0.2, DRG.belly, 0); }); } });
  // the crest: a long torn membrane sail along the back
  const tops = line.slice(4, 38).map((q, i) => add(q, 0, -rad_(i + 4) - 50 - 30 * Math.sin(i * 0.9)));
  cel(p, [...line.slice(4, 38).map((q, i) => add(q, 0, -rad_(i + 4) + 10)).reverse(), ...tops], DRG.mem, light, { d: 8, ow: 9, tex: () => tops.forEach((t, i) => p.stroke([add(line[i + 4], 0, -rad_(i + 4)), t], 4, DRG.back)) });
  const H = add(line[40], 40, -10 - 40 * roar), m = dragonHead(p, o, H, rad(-6) - rad(10) * roar, light);
  if (roar > 0.05) { p.g.globalAlpha = 0.5; for (let i = 0; i < 8; i++) p.ell(m[0] + 40 + i * 30, m[1] - 10 + Math.sin(i) * 20, 16 + i * 3, 12 + i * 2, "#CFF4FF", 3); p.g.globalAlpha = 1; } // bubbles of its roar
}, "hue-rotate(160deg) saturate(1.3)");
// ------------------------------------------------------------------ Kraken (swims, cy 520): long mantle, huge eyes, eight arms + two club tentacles, the beak
export function drawKrakenB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  const sk = "#8A2E3A", dark = "#3A0E16", lit = "#D8606A", sucker = "#F2C8C0";
  const arm = (i: number, n: number, col: string, len: number, club: boolean) => {
    const a0 = rad(-50 + (i * 100) / (n - 1)), pts: P2[] = []; let q: P2 = [880, cy + 20], a = a0;
    for (let j = 0; j < 16; j++) { pts.push(q); a += 0.18 * Math.sin(ph * 2 + i * 1.3 + j * 0.4) - (roar > 0.05 ? 0.04 * Math.sign(a0) : 0) + (j > 10 ? 0.12 * Math.sign(a0 || 1) * (1 - roar) : 0); q = add(q, Math.cos(a) * len, Math.sin(a) * len); }
    cel(p, tube(pts, club ? 20 : 34, club ? 8 : 6), col, light, { d: 6, tex: () => pts.forEach((t, j) => { if (j % 2 === 0 && j > 1) p.ell(t[0], t[1] + 14, 7, 5, sucker, 2); }) });
    if (club) { const e = pts[pts.length - 1]; cel(p, blob(e[0], e[1], 44, 26, Math.atan2(e[1] - pts[13][1], e[0] - pts[13][0]), 5), col, light, { d: 4, tex: () => { for (let k = 0; k < 6; k++) p.ell(e[0] - 20 + k * 8, e[1] + 6, 5, 5, sucker, 2); } }); }
  };
  arm(0, 2, mul(sk, FAR), 48 + 8 * roar, true); arm(1, 2, mul(sk, FAR), 46 + 8 * roar, true);
  for (let i = 0; i < 8; i += 2) arm(i, 8, mul(sk, FAR), 30, false);
  // mantle pointing back (left), fins at the tip
  cel(p, [[260, cy - 40], [120, cy - 160], [160, cy], [120, cy + 160], [260, cy + 40]], sk, light, { d: 6, ow: 10 });
  const mantle = chaikin([[200, cy], [300, cy - 110], [600, cy - 170], [820, cy - 140], [900, cy - 60], [900, cy + 70], [820, cy + 140], [600, cy + 160], [300, cy + 110]], 3);
  cel(p, mantle, sk, light, { d: 26, tex: () => { const r = rng(5); for (let i = 0; i < 60; i++) p.ell(260 + r() * 640, cy - 150 + r() * 300, 8 + r() * 14, 6 + r() * 10, r() < 0.5 ? dark : lit, 0); for (let i = 0; i < 4; i++) p.stroke([[500 + i * 40, cy - 120], [560 + i * 40, cy - 40]], 6, "#F0D8D0"); } });
  cel(p, blob(870, cy - 30, 80, 64, 0, 7), "#F2E8C8", light, { d: 6, ow: 10, tex: () => { p.ell(880, cy - 30, 48, 48, "#E8B020", 0); p.poly([[872, cy - 74], [888, cy - 74], [892, cy + 14], [868, cy + 14]], INKB, 0); } }); // the giant eye
  if (expr !== "shock") p.poly([[790, cy - 104], [960, cy - 90], [956, cy - 72], [800, cy - 82]], INKB, 0);
  for (let i = 1; i < 8; i += 2) arm(i, 8, sk, 32, false);
  if (roar > 0.05) { p.ell(960, cy + 40, 50, 40, "#1A0608", 4); p.poly(horn([[940, cy + 10], [990, cy + 20], [1000, cy + 50]], 16), "#2A2020", 3); p.poly(horn([[940, cy + 70], [990, cy + 60], [1000, cy + 34]], 16), "#2A2020", 3); } // the beak
}

// ------------------------------------------------------------------ registry (x0 / x1 measured with BeastSolo)
export const BEAST_MYTH = {
  griffin: { draw: drawGriffinB, len: 4.5, x0: 253, x1: 1336 },
  manticore: { draw: drawManticoreB, len: 4.5, x0: 336, x1: 1325 },
  chimera: { draw: drawChimeraB, len: 4.5, x0: 130, x1: 1315 },
  cerberus: { draw: drawCerberusB, len: 3.5, x0: 236, x1: 1284 },
  unicorn: { draw: drawUnicornB, len: 3.2, x0: 259, x1: 1492 },
  pegasus: { draw: drawPegasusB, len: 3.2, x0: 276, x1: 1379 },
  yeti: { draw: drawYetiB, len: 1.5, x0: 520, x1: 1041 },
  bigfoot: { draw: drawBigfootB, len: 1.35, x0: 520, x1: 1041 },
  phoenix: { draw: drawPhoenixB, len: 2.5, x0: 112, x1: 1156, fly: true },
  thunderbird: { draw: drawThunderbirdB, len: 5, x0: 338, x1: 1156, fly: true },
  wyvern: { draw: drawWyvernB, len: 14, x0: 16, x1: 1152, fly: true },
  basilisk: { draw: drawBasiliskB, len: 18, x0: 52, x1: 1487 },
  nessie: { draw: drawNessieB, len: 12, x0: 49, x1: 1536, fly: true },
  hydra: { draw: drawHydraB, len: 14, x0: 93, x1: 1485 },
  leviathan: { draw: drawLeviathanB, len: 40, x0: 46, x1: 1517, fly: true },
  kraken: { draw: drawKrakenB, len: 20, x0: 117, x1: 1504, fly: true },
} as const;
