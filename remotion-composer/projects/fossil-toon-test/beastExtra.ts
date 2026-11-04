// The rest of the prehistoric list (2026-11-04, user: "xem còn những con vật nào thời tiền sử thì làm nốt đi"), same beast
// look and API (side views facing right, design 1600 x 1000, ground y = 960; swimmers centred on y ~520).
//   Big theropods from one parametric body (drawTheroB + a spec): Allosaurus, Carnotaurus, Giganotosaurus, Dilophosaurus;
//   Therizinosaurus; Deinosuchus; Elasmosaurus, Liopleurodon (swim); Dimetrodon; Megatherium; dire wolf; Daeodon
//   ("hell pig"); Arthropleura; Anomalocaris, Helicoprion (swim). Our own drawings.
import { Pen, mul } from "./toon";
import { AnimalPose, GROUND, P2, blob, curve, rad, rotAll, tube, walkOf } from "./toonAnimals";
import { INKB, OW, beastEye, cel, chaikin, claw, digiLeg, folds, horn, rng, scales, scutes, tooth } from "./beastAnimals";
import { FAR, colLeg, furFlicks, hairStrands, scars } from "./beastMore";

const add = (a: P2, dx: number, dy: number): P2 => [a[0] + dx, a[1] + dy];
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const offs = (pts: P2[], dx: number, dy: number): P2[] => pts.map(([x, y]) => [x + dx, y + dy] as P2);
const bobOf = (o: AnimalPose, a: number) => a * Math.cos(4 * Math.PI * (o.phase ?? 0)) * (o.walk ?? 0);

// ------------------------------------------------------------------ parametric big theropod (the T. rex body of beastAnimals.ts)
export type TheroSpec = {
  skin: string; back: string; belly: string; stripe: string; scute: string; mouth: string; scar: string; iris: string; horn?: string;
  hipY: number; legS: number; A: number; B: number; tailR: number; hs: number; sx: number; sy: number; arm: number; claws: number; teeth: number;
  extra: "allo" | "carno" | "giga" | "dilo" | "bary" | "ovi"; stripes: number; neckUp: number; feathers?: string; beak?: string;
};
// head outline relative to the jaw hinge (taken from the T. rex skull), scaled per species by (hs * sx, hs * sy)
const SKULL: P2[] = [[-15, -80], [15, -140], [80, -158], [102, -184], [132, -166], [150, -144], [270, -128], [330, -102], [352, -62], [340, -22], [190, -14], [10, -4]];
const JAW: P2[] = [[-15, -8], [330, -14], [340, 4], [280, 30], [120, 60], [30, 72], [-10, 50]];
export function drawTheroB(p: Pen, o: AnimalPose, S: TheroSpec) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 7), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const far = walkOf(o, 0.5), near = walkOf(o, 0), dy = S.hipY - 500 + bob, k = S.B / 170, Y = (y: number) => y + dy;
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string, s: number) => {
    const L = digiLeg(hip, s, w.swing, w.lift);
    cel(p, tube(curve(L[1], [(L[1][0] + L[2][0]) / 2 + 10, (L[1][1] + L[2][1]) / 2], L[2], 8), 70 * s, 46 * s), col, light, { d: 14 });
    cel(p, tube([L[2], L[3]], 46 * s, 34 * s), col, light, { d: 10 });
    for (let i = 0; i < 3; i++) claw(p, [L[3][0] + 10 + i * 24 * s, L[3][1] + 8], 52 * s, 0.2 + i * 0.12, 12 * s);
    cel(p, rotAll(blob(hip[0] + 30, hip[1] + 40, 118 * s * k, 138 * s * k, 0.45, 9, -0.3, 1.7, 2.0), w.swing * 0.6, hip), col, light, { tex: () => scales(p, hip[0] - 100, hip[1] - 50, hip[0] + 140, hip[1] + 230, 26, S.back, 3, 0.3) });
    return L;
  };
  leg([590, Y(500)], far, mul(S.skin, FAR), 0.95 * S.legS);
  const tailL = curve([500, Y(470)], [300, Y(400)], [30, Y(420) + 24 * Math.sin(4 * Math.PI * (o.phase ?? 0))], 18);
  cel(p, tube(tailL, S.tailR, 8), S.skin, light, { tex: () => { scales(p, 20, Y(300), 560, Y(600), 24, S.back, 5); for (let i = 0; i < 6; i++) { const q = tailL[2 + i * 2]; p.poly([[q[0] - 14, q[1] - 70], [q[0] + 14, q[1] - 70], [q[0] + 4, q[1] + 30], [q[0] - 8, q[1] + 20]], S.stripe, 0); } } });
  scutes(p, tailL.slice(0, 14).map(([x, y], i) => [x, y - (S.tailR - i * S.tailR / 17)] as P2), 34 * k, S.scute, light, 7);
  const body = blob(700, Y(480), S.A, S.B, -0.16, 3, -0.14, 1.7, 2.1);
  cel(p, body, S.skin, light, { tex: () => {
    p.poly(blob(790, Y(480) + S.B * 0.75, S.A * 0.86, S.B * 0.5, -0.25, 5), S.belly, 0);
    for (let i = 0; i < S.stripes; i++) p.poly([[520 + i * 52, Y(330)], [552 + i * 52, Y(330)], [545 + i * 52, Y(450)], [528 + i * 52, Y(440)]], S.stripe, 0);
    scales(p, 450, Y(300), 960, Y(680), 22, S.back, 9); scars(p, 690, Y(430), S.scar);
    folds(p, [[[880, Y(520)], [900, Y(580)], [880, Y(640)]]]);
  } });
  scutes(p, curve([470, Y(480 - S.B * 0.8)], [650, Y(480 - S.B * 1.1)], [860, Y(480 - S.B * 0.95)], 12), 40 * k, S.scute, light, 11);
  leg([645, Y(510)], near, S.skin, 1.05 * S.legS);
  // neck + head
  const nUp = S.neckUp, neckL = curve([830, Y(440)], [900, Y(370 - nUp * 0.5)], [960, Y(350 - nUp)], 10);
  cel(p, tube(neckL, 120 * k, 98 * k), S.skin, light, { tex: () => { scales(p, 760, Y(200 - nUp), 1060, Y(560), 20, S.back, 13); folds(p, [[[880, Y(450)], [905, Y(470)], [935, Y(450)]]]); } });
  scutes(p, neckL.map(([x, y]) => [x - 20, y - 110 * k] as P2), 26 * k, S.scute, light, 17);
  if (S.feathers) { furFlicks(p, 420, Y(260), 980, Y(660), 120, 3, [S.feathers, S.back], 34, 6); plumes0(p, tailL.slice(9, 16), 60, rad(-150), S.feathers, 3); plumes0(p, tailL.slice(9, 16), 55, rad(150), S.feathers, 4); }
  const H: P2 = [960, Y(380 - nUp)], ha = -rad(16) * roar, ja = rad(32) * roar;
  const at = (q: P2): P2 => [H[0] + q[0] * S.hs * S.sx, H[1] + q[1] * S.hs * S.sy];
  const R = (q: P2[]) => rotAll(q.map(at), ha, H), J = (q: P2[]) => rotAll(q.map(at), ja, H);
  // crests behind the skull (Dilophosaurus: a pair of thin plates)
  if (S.extra === "dilo") for (const d of [18, 0]) cel(p, R([[100 + d, -150], [130 + d, -250], [200 + d, -280], [250 + d, -230], [300 + d, -150], [200, -132]]), d ? mul(S.horn ?? S.scute, FAR) : (S.horn ?? S.scute), light, { d: 6, ow: OW * 0.7, tex: () => { p.g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) p.stroke(R([[140 + i * 40 + d, -150], [150 + i * 35 + d, -240]]), 4, INKB); p.g.globalAlpha = 1; } });
  p.poly([...R([[5, -8], [340, -28]]), ...J([[330, -14], [5, -8]])], S.mouth, 0);
  if (roar > 0.05) { const g = J([[60, 0], [240, -8]]); p.ell((g[0][0] + g[1][0]) / 2, (g[0][1] + g[1][1]) / 2 - 4, 90 * S.hs * S.sx, 14, "#B0404E", 0);
    p.g.globalAlpha = 0.75; for (const x of [100, 190, 270]) { const a = R([[x, -18]])[0], b = J([[x - 10, -8]])[0]; p.stroke(curve(a, [(a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 + 18], b, 8), 4, "#E8F0F2"); } p.g.globalAlpha = 1; }
  for (let i = 0; i < S.teeth; i++) { const u = 40 + (i * 290) / S.teeth, [tx, ty] = J([[u, -8 - i * 0.6]])[0]; tooth(p, tx, ty, (18 + ((i * 5) % 3) * 8) * S.hs, false, ja); }
  cel(p, J(JAW), mul(S.skin, [0.92, 0.92, 0.94]), light, { d: 16, tex: () => { scales(p, H[0] - 40, H[1] - 40, H[0] + 400, H[1] + 120, 16, S.back, 21); } });
  for (let i = 0; i < S.teeth + 1; i++) { const u = 25 + (i * 300) / (S.teeth + 1), [tx, ty] = R([[u, -16 - i * 1.2]])[0]; tooth(p, tx, ty, (22 + ((i * 7) % 4) * 8) * S.hs, true, ha, 0.26); }
  cel(p, R(SKULL), S.skin, light, { tex: () => {
    p.poly(R([[80, -150], [150, -144], [190, -130], [150, -118]]), S.back, 0);
    scales(p, H[0] - 40, H[1] - 220, H[0] + 400, H[1], 15, S.back, 23);
    p.g.globalAlpha = 0.5; p.poly(R([[170, -90], [255, -95], [230, -60], [170, -58]]), INKB, 0); p.g.globalAlpha = 1;
    p.stroke(R([[190, -112], [255, -50]]), 6, S.scar);
  } });
  const hornCol = S.horn ?? S.scute;
  if (S.extra === "allo") { // lacrimal horns + a rough nasal ridge
    cel(p, R([[60, -150], [90, -205], [118, -152]]), hornCol, light, { d: 4, ow: 8 });
    for (let i = 0; i < 7; i++) cel(p, R([[160 + i * 24, -134 + i * 4], [170 + i * 24, -152 + i * 4], [180 + i * 24, -132 + i * 4]]), hornCol, light, { d: 2, ow: 6, rim: false });
  }
  if (S.extra === "carno") for (const d of [10, 0]) { // the bull horns over the eyes
    const hp = R(curve([70 + d, -150], [100 + d, -230], [30 + d, -290], 10));
    cel(p, horn(hp, 34), d ? mul(hornCol, FAR) : hornCol, light, { d: 6, ow: OW * 0.85 });
  }
  if (S.extra === "giga") for (let i = 0; i < 6; i++) cel(p, R([[70 + i * 22, -152], [80 + i * 22, -176 + (i % 2) * 6], [92 + i * 22, -150]]), hornCol, light, { d: 2, ow: 6, rim: false }); // rough brow
  if (S.extra === "bary") cel(p, R([[200, -120], [250, -150], [300, -116]]), hornCol, light, { d: 2, ow: 6, rim: false }); // small nasal crest
  if (S.extra === "ovi") { // tall cassowary crest + toothless parrot beak
    cel(p, R([[40, -150], [90, -330], [200, -260], [250, -140]]), hornCol, light, { d: 6, ow: OW * 0.8, tex: () => { p.g.globalAlpha = 0.4; p.stroke(R([[80, -160], [110, -290]]), 5, INKB); p.g.globalAlpha = 1; } });
    cel(p, R([[240, -120], [352, -70], [356, -10], [300, -16], [230, -40]]), S.beak ?? "#C9B88A", light, { d: 4, ow: OW * 0.8 });
  }
  const [nx, ny] = R([[322, -90]])[0]; p.poly([[nx - 10, ny - 3], [nx + 10, ny - 7], [nx + 6, ny + 5]], INKB, 0);
  const [ex, ey] = R([[100, -118]])[0];
  beastEye(p, ex, ey, 1.45 * S.hs, expr, o.blink ?? 0, S.skin, S.iris);
  const arm = curve([900, Y(545)], [900 + 45 * S.arm, Y(575)], [900 + 62 * S.arm, Y(545 + 65 * S.arm) - 25 * roar], 6);
  cel(p, tube(arm, 19 * Math.max(0.8, S.arm * 0.8), 13), S.skin, light, { d: 8, ow: OW * 0.75 });
  const hd = arm[arm.length - 1];
  for (let i = 0; i < S.claws; i++) claw(p, add(hd, -4 * i, 6 * i), 26 * S.arm * (S.extra === "bary" && i === 0 ? 1.8 : 1), 0.9 + i * 0.2, 7 * (S.extra === "bary" && i === 0 ? 1.6 : 1));
  if (S.feathers) plumes0(p, arm.slice(1), 60, rad(120), S.feathers, 15);
}
function plumes0(p: Pen, pts: P2[], len: number, ang: number, col: string, seed: number) { const r = rng(seed); for (const [x, y] of pts) { const l = len * (0.7 + r() * 0.5), a = ang + (r() - 0.5) * 0.4; p.poly(horn([[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 12), col, 4); } }
const ALLO: TheroSpec = { skin: "#7A5A3A", back: "#3A2618", belly: "#C9B08A", stripe: "#3A2214", scute: "#4A3020", horn: "#A8381E", mouth: "#30080E", scar: "#E0C8A0", iris: "#FF8A1F",
  hipY: 520, legS: 0.95, A: 230, B: 140, tailR: 100, hs: 0.95, sx: 1.05, sy: 0.78, arm: 1.6, claws: 3, teeth: 10, extra: "allo", stripes: 8, neckUp: 10 };
const CARN: TheroSpec = { skin: "#7A2A1C", back: "#3A120C", belly: "#C99D74", stripe: "#2A0E08", scute: "#4A1A10", horn: "#5A1C12", mouth: "#30080E", scar: "#E8C8A0", iris: "#FFB21F",
  hipY: 520, legS: 0.95, A: 225, B: 135, tailR: 96, hs: 0.95, sx: 0.66, sy: 0.92, arm: 0.45, claws: 0, teeth: 7, extra: "carno", stripes: 6, neckUp: 0 };
const GIGA: TheroSpec = { skin: "#6E665A", back: "#36312B", belly: "#C9BB9A", stripe: "#211D19", scute: "#3A342C", horn: "#4A4036", mouth: "#30080E", scar: "#D8CCB0", iris: "#FFD23A",
  hipY: 500, legS: 1.0, A: 255, B: 160, tailR: 112, hs: 1.05, sx: 1.12, sy: 0.84, arm: 1.3, claws: 3, teeth: 11, extra: "giga", stripes: 8, neckUp: 0 };
const DILO: TheroSpec = { skin: "#5E6A3A", back: "#2E3420", belly: "#C9C08A", stripe: "#2A3018", scute: "#3A4228", horn: "#C2481E", mouth: "#30080E", scar: "#E0D0A0", iris: "#F2D23A",
  hipY: 540, legS: 0.85, A: 200, B: 110, tailR: 80, hs: 0.8, sx: 1.05, sy: 0.7, arm: 1.5, claws: 3, teeth: 10, extra: "dilo", stripes: 7, neckUp: 40 };
export const drawAlloB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, ALLO);
export const drawCarnoB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, CARN);
export const drawGigaB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, GIGA);
export const drawDiloB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, DILO);
// Baryonyx (Early Cretaceous, ~9 m): long low crocodile snout, big thumb claw; Oviraptor (~1.8 m): feathered, crest, beak
const BARY: TheroSpec = { skin: "#5A6A4A", back: "#2A3424", belly: "#C9C49A", stripe: "#22301E", scute: "#3A4A30", horn: "#8A3A22", mouth: "#30080E", scar: "#E0D8B0", iris: "#F2D23A",
  hipY: 530, legS: 0.9, A: 230, B: 125, tailR: 92, hs: 0.95, sx: 1.4, sy: 0.55, arm: 1.6, claws: 3, teeth: 14, extra: "bary", stripes: 8, neckUp: 0 };
const OVI: TheroSpec = { skin: "#5A4A5A", back: "#2A2030", belly: "#C9B8C0", stripe: "#2A1E2A", scute: "#3A2E3A", horn: "#D04A2A", mouth: "#30080E", scar: "#E0D0D8", iris: "#F2D23A",
  hipY: 560, legS: 0.8, A: 170, B: 110, tailR: 70, hs: 0.7, sx: 0.55, sy: 1.0, arm: 1.4, claws: 3, teeth: 0, extra: "ovi", stripes: 0, neckUp: 70, feathers: "#3A2A3E", beak: "#E2C27A" };
export const drawBaryB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, BARY);
export const drawOviB = (p: Pen, o: AnimalPose) => drawTheroB(p, o, OVI);

// ------------------------------------------------------------------ Therizinosaurus (Late Cretaceous Mongolia; ~9 m, ~1 m hand claws)
const THZ = { skin: "#5A5040", feather: "#4A3A2A", lit: "#8A7656", belly: "#B8A880", beak: "#C9B88A", mouth: "#30080E" };
export function drawTheriB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry", far = walkOf(o, 0.5), near = walkOf(o, 0);
  const leg = (hip: P2, w: { swing: number; lift: number }, col: string) => {
    const L = digiLeg(hip, 0.75, w.swing, w.lift);
    cel(p, tube(curve(L[1], lerp2(L[1], L[2], 0.5), L[2], 6), 52, 36), col, light, { d: 10 });
    cel(p, tube([L[2], L[3]], 36, 30), col, light, { d: 8 });
    for (let i = 0; i < 4; i++) claw(p, [L[3][0] + i * 18, L[3][1] + 8], 30, 0.3, 8);
    cel(p, rotAll(blob(hip[0] + 20, hip[1] + 30, 110, 120, 0.4, 9, -0.2, 1.7, 2.0), w.swing * 0.5, hip), col, light, { d: 14, tex: () => furFlicks(p, hip[0] - 90, hip[1] - 60, hip[0] + 130, hip[1] + 150, 30, 5, [THZ.feather, THZ.lit], 26, 5) });
  };
  leg([620, 600 + bob], far, mul(THZ.skin, FAR));
  const tl = curve([520, 560 + bob], [360, 540 + bob], [200, 560 + bob], 10);
  cel(p, tube(tl, 70, 14), THZ.skin, light, { tex: () => furFlicks(p, 180, 470, 560, 640, 40, 3, [THZ.feather, THZ.lit], 24, 5) });
  // pot belly, upright posture, feather cape
  const body = blob(700, 520 + bob, 200, 170, -0.7, 3, 0.15, 1.8, 2.1);
  cel(p, body, THZ.feather, light, { d: 22, tex: () => { furFlicks(p, 500, 340, 900, 700, 140, 5, [THZ.skin, THZ.lit], 34, 6); p.poly(blob(760, 600 + bob, 110, 110, -0.6, 5), THZ.belly, 0); scars(p, 680, 420 + bob, "#E0D0A0"); } });
  leg([660, 610 + bob], near, THZ.skin);
  // long neck, small head with a beak
  const nb: P2 = [800, 380 + bob], hr = rad(18) * roar, R = (q: P2[]) => rotAll(q, hr, nb);
  const neckL = R(curve(nb, [860, 240 + bob], [960, 190 + bob], 10));
  cel(p, tube(neckL, 70, 46), THZ.feather, light, { d: 10, tex: () => furFlicks(p, 760, 120, 1020, 420, 50, 7, [THZ.skin, THZ.lit], 22, 5) });
  const hinge = R([[990, 200 + bob]])[0], ja = rad(28) * roar, J = (q: P2[]) => rotAll(R(q), ja, hinge);
  p.poly([...R([[990, 196 + bob], [1110, 206 + bob]]), ...J([[1100, 220 + bob], [990, 214 + bob]])], THZ.mouth, 0);
  cel(p, J([[985, 210 + bob], [1100, 216 + bob], [1080, 236 + bob], [1000, 240 + bob]]), THZ.beak, light, { d: 4, ow: OW * 0.7 });
  cel(p, R(chaikin([[950, 200 + bob], [970, 160 + bob], [1030, 150 + bob], [1100, 180 + bob], [1120, 205 + bob], [1000, 214 + bob]], 2)), THZ.skin, light, { d: 6, tex: () => p.poly(R([[1070, 170 + bob], [1122, 200 + bob], [1100, 210 + bob], [1060, 200 + bob]]), THZ.beak, 0) });
  const e = R([[1015, 178 + bob]])[0]; beastEye(p, e[0], e[1], 0.7, expr, o.blink ?? 0, THZ.skin, "#FF7A1F");
  // the arms: long, raised on the threat, three scythe claws ~1 m
  for (const [dx, col] of [[24, mul(THZ.feather, FAR)], [0, THZ.feather]] as [number, string][]) {
    const sh: P2 = [820 + dx, 420 + bob], el = add(sh, 120, 80 - 200 * roar), wr = add(el, 120, 60 - 160 * roar);
    cel(p, tube([sh, el, wr], 40, 26), col, light, { d: 8, tex: () => furFlicks(p, sh[0] - 40, Math.min(sh[1], wr[1]) - 60, wr[0] + 40, Math.max(sh[1], el[1]) + 60, 20, 9, [THZ.lit], 26, 5) });
    for (let i = 0; i < 3; i++) { const b = add(wr, i * 6, i * 10), a = 1.1 - 1.2 * roar + i * 0.15; p.poly(horn(curve(b, add(b, Math.cos(a) * 110, Math.sin(a) * 110), add(b, Math.cos(a + 0.5) * 210, Math.sin(a + 0.5) * 210), 10), 14), "#E2D2AA", 4); }
  }
}

// ------------------------------------------------------------------ Deinosuchus (Late Cretaceous; ~10 m, ate dinosaurs)
const DEI = { skin: "#3E4430", back: "#22261A", belly: "#A89C78", scute: "#2E3222", mouth: "#30080E", gum: "#8A3040", scar: "#D8C8A0" };
export function drawDeinoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 3), roar = o.roar ?? 0, expr = o.expr ?? "angry", G = 940;
  const leg = (x: number, off: number, col: string) => { const w = walkOf(o, off), hip: P2 = [x, 820 + bob], kn = add(hip, 30 + Math.sin(w.swing) * 80, 60), ft: P2 = [x + 60 + Math.sin(w.swing) * 140, GROUND - 14 - w.lift * 0.5];
    cel(p, tube([hip, kn, ft], 46, 26), col, light, { d: 8, tex: () => scales(p, x - 60, 780, x + 220, GROUND, 14, DEI.back, x | 0, 0.4) }); for (let i = 0; i < 4; i++) claw(p, add(ft, -10 + i * 14, 10), 22, 0.2, 7); };
  leg(560, 0.5, mul(DEI.skin, FAR)); leg(940, 0, mul(DEI.skin, FAR));
  const tl = curve([480, 830 + bob], [280, 860 + bob], [40, 880 + bob + 20 * Math.sin(2 * Math.PI * (o.phase ?? 0))], 18);
  cel(p, tube(tl, 80, 10), DEI.skin, light, { tex: () => scales(p, 20, 760, 520, G, 18, DEI.back, 5) });
  for (const row of [0, 1]) scutes(p, tl.slice(0, 16).map(([x, y], i) => [x + row * 10, y - (78 - i * 4.6) + row * 6] as P2), 26, DEI.scute, light, 7 + row);
  const body = chaikin(offs([[440, 840], [520, 770], [800, 750], [1050, 770], [1120, 830], [1060, 890], [800, 910], [520, 900]], 0, bob), 3);
  cel(p, body, DEI.skin, light, { tex: () => { p.poly(blob(800, 900 + bob, 300, 24, 0, 6), DEI.belly, 0); scales(p, 440, 740, 1120, 910, 18, DEI.back, 9, 0.5); scars(p, 760, 790 + bob, DEI.scar, 3, 50); } });
  for (const row of [0, 1, 2]) scutes(p, curve([500, 790 + bob + row * 16], [800, 740 + bob + row * 16], [1080, 790 + bob + row * 14], 14), 30 - row * 6, DEI.scute, light, 11 + row);
  leg(600, 0, DEI.skin); leg(980, 0.5, DEI.skin);
  // long heavy snout; on the attack the head lifts and the jaws gape
  const hinge: P2 = [1110, 830 + bob], hr = -rad(10) * roar, ja = rad(36) * roar, R = (q: P2[]) => rotAll(offs(q, 0, bob), hr, hinge), J = (q: P2[]) => rotAll(R(q), ja, hinge);
  p.poly([...R([[1110, 820], [1540, 830]]), ...J([[1530, 846], [1110, 846]])], DEI.mouth, 0);
  if (roar > 0.05) p.poly(J([[1130, 846], [1520, 848], [1500, 860], [1140, 862]]), DEI.gum, 0);
  for (let i = 0; i < 13; i++) { const [tx, ty] = J([[1140 + i * 29, 846]])[0]; tooth(p, tx, ty, 18 + (i % 3) * 8, false, hr + ja, 0.3); }
  cel(p, J([[1100, 840], [1530, 846], [1510, 872], [1200, 890], [1110, 880]]), mul(DEI.skin, [0.9, 0.9, 0.92]), light, { d: 8, ow: OW * 0.85, tex: () => scales(p, 1080, 820, 1560, 900, 12, DEI.back, 17, 0.4) });
  for (let i = 0; i < 14; i++) { const [tx, ty] = R([[1130 + i * 28, 826]])[0]; tooth(p, tx, ty, 20 + ((i * 5) % 3) * 9, true, hr, 0.28); }
  cel(p, R(chaikin([[1080, 790], [1150, 760], [1230, 770], [1300, 790], [1500, 800], [1550, 818], [1540, 830], [1110, 834]], 2)), DEI.skin, light, { d: 12, tex: () => { scales(p, 1070, 740, 1560, 840, 12, DEI.back, 19, 0.5); p.ell(1520, 806, 22, 14, DEI.back, 0); } });
  for (let i = 0; i < 5; i++) cel(p, R([[1130 + i * 20, 770], [1140 + i * 20, 750], [1150 + i * 20, 772]]), DEI.scute, light, { d: 2, ow: 6, rim: false });
  const e = R([[1200, 772]])[0]; beastEye(p, e[0], e[1], 0.8, expr, o.blink ?? 0, DEI.skin, "#F2D23A");
}

// ------------------------------------------------------------------ swimmers: Elasmosaurus, Liopleurodon (cy 520)
const ELA = { top: "#3A4A4E", side: "#5E7074", belly: "#D2D2C4", fin: "#2A363A", mouth: "#22090E", scar: "#C9CED0" };
export function flipper(p: Pen, at: P2, a: number, L: number, col: string, light: number) { cel(p, rotAll([at, add(at, -L * 0.35, L * 0.9), add(at, -L * 0.75, L * 1.0), add(at, -L * 0.4, L * 0.25)], a, at), col, light, { d: 8 }); }
export function drawElasmoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.35 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 600;
  flipper(p, [720, cy + 40], -0.3 + sw, 200, mul(ELA.fin, FAR), light); flipper(p, [430, cy + 40], -0.3 - sw, 160, mul(ELA.fin, FAR), light);
  cel(p, tube(curve([340, cy], [200, cy + 10], [60, cy - 20], 10), 70, 6), ELA.side, light, { d: 10 });
  const body = blob(560, cy, 260, 110, -0.05, 3, 0.05, 1.9, 2.0);
  cel(p, body, ELA.side, light, { d: 24, tex: () => { p.poly(blob(580, cy + 70, 220, 50, 0, 5), ELA.belly, 0); p.poly(blob(540, cy - 70, 220, 50, 0, 6), ELA.top, 0); scales(p, 300, cy - 120, 820, cy + 120, 12, ELA.top, 7, 0.3); scars(p, 520, cy - 60, ELA.scar); } });
  // neck: very long, S-curved up to the head; strikes forward on the attack
  const nk = curve([780, cy - 40], [1100 + 100 * roar, cy - 380 + 120 * roar], [1380 + 100 * roar, 260 + 160 * roar], 20);
  cel(p, tube(nk, 70, 34), ELA.side, light, { d: 10, tex: () => { scales(p, 760, 150, 1520, cy, 10, ELA.top, 9, 0.3); for (let i = 2; i < nk.length - 1; i += 2) p.stroke([add(nk[i], -20, 26), add(nk[i], 24, 26)], 3, mul(ELA.belly, [0.7, 0.7, 0.7])); } });
  flipper(p, [700, cy + 50], -0.1 - sw, 220, ELA.fin, light); flipper(p, [410, cy + 50], -0.1 + sw, 170, ELA.fin, light);
  const H = nk[nk.length - 1], ja = rad(34) * roar, J = (q: P2[]) => rotAll(offs(q, H[0], H[1]), ja, add(H, 10, 10));
  p.poly([add(H, 10, 4), add(H, 140, 8), ...J([[130, 20], [10, 18]])], ELA.mouth, 0);
  for (let i = 0; i < 9; i++) { tooth(p, H[0] + 24 + i * 13, H[1] + 6, 22, true, 0.25, 0.18); const [tx, ty] = J([[24 + i * 13, 18]])[0]; tooth(p, tx, ty, 20, false, ja - 0.2, 0.18); } // needle teeth
  cel(p, J([[0, 14], [130, 18], [110, 34], [20, 36]]), ELA.belly, light, { d: 4, ow: OW * 0.7 });
  cel(p, chaikin(offs([[-20, 0], [20, -30], [100, -26], [150, -4], [140, 8], [10, 12]], H[0], H[1]), 2), ELA.side, light, { d: 6, tex: () => scales(p, H[0] - 30, H[1] - 40, H[0] + 160, H[1] + 20, 8, ELA.top, 11, 0.4) });
  beastEye(p, H[0] + 50, H[1] - 12, 0.65, expr, o.blink ?? 0, ELA.side, "#F2D23A");
}
const LIO = { top: "#2E2A30", side: "#5A5260", belly: "#D4CCC4", fin: "#221E24", mouth: "#22090E", gum: "#8A2C38", scar: "#D0C6CA" };
export function drawLiopleuroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sw = Math.sin(ph) * 0.35 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  flipper(p, [880, cy + 60], -0.3 + sw, 230, mul(LIO.fin, FAR), light); flipper(p, [500, cy + 50], -0.3 - sw, 200, mul(LIO.fin, FAR), light);
  cel(p, tube(curve([360, cy], [230, cy + 10], [120, cy - 10], 8), 70, 8), LIO.side, light, { d: 10 });
  const body = chaikin([[340, cy], [460, cy - 110], [750, cy - 170], [1000, cy - 150], [1100, cy - 110], [1120, cy + 90], [900, cy + 150], [600, cy + 140], [400, cy + 70]], 3);
  cel(p, body, LIO.side, light, { d: 26, tex: () => { p.poly(blob(760, cy + 100, 330, 60, 0, 5), LIO.belly, 0); p.poly(blob(740, cy - 110, 330, 60, 0, 6), LIO.top, 0); scales(p, 330, cy - 180, 1130, cy + 160, 12, LIO.top, 7, 0.3); scars(p, 760, cy - 110, LIO.scar, 4, 70); } });
  flipper(p, [860, cy + 80], -0.1 - sw, 250, LIO.fin, light); flipper(p, [480, cy + 70], -0.1 + sw, 210, LIO.fin, light);
  // the huge head: long jaws, fangs, gape
  const hinge: P2 = [1090, cy - 10], ja = rad(40) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  p.poly([[1090, cy - 20], [1520, cy - 4], ...J([[1500, cy + 16], [1090, cy + 10]])], LIO.mouth, 0);
  if (roar > 0.05) p.poly(J([[1110, cy + 10], [1490, cy + 14], [1470, cy + 30], [1120, cy + 28]]), LIO.gum, 0);
  for (let i = 0; i < 10; i++) { const [tx, ty] = J([[1130 + i * 36, cy + 12]])[0]; tooth(p, tx, ty, 30 + (i % 3) * 12, false, ja, 0.3); }
  cel(p, J([[1080, cy], [1500, cy + 10], [1460, cy + 60], [1200, cy + 90], [1090, cy + 80]]), LIO.belly, light, { d: 10, ow: OW * 0.9 });
  for (let i = 0; i < 11; i++) tooth(p, 1120 + i * 34, cy - 14 + i * 0.8, 34 + ((i * 5) % 3) * 12, true, 0, 0.28);
  cel(p, chaikin([[1060, cy - 120], [1150, cy - 150], [1300, cy - 100], [1480, cy - 40], [1530, cy - 10], [1500, cy], [1090, cy - 6]], 2), LIO.side, light, { d: 14, tex: () => { p.poly([[1060, cy - 120], [1250, cy - 120], [1250, cy - 90], [1070, cy - 80]], LIO.top, 0); scales(p, 1050, cy - 160, 1540, cy, 11, LIO.top, 13, 0.4); p.stroke([[1300, cy - 80], [1380, cy - 40]], 6, LIO.scar); } });
  beastEye(p, 1220, cy - 90, 1.0, expr, o.blink ?? 0, LIO.side, "#F2D23A");
}

// ------------------------------------------------------------------ Dimetrodon (Early Permian, ~290 Ma; ~3.5 m, a synapsid, not a dinosaur)
const DIM = { skin: "#5A4A3A", back: "#2E2418", belly: "#B8A07A", sail: "#9A3A22", sailDark: "#3A140C", sailLit: "#D9822E", mouth: "#30080E" };
export function drawDimetroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 4), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const leg = (x: number, off: number, col: string) => { const w = walkOf(o, off), hip: P2 = [x, 760 + bob], kn = add(hip, -50 + Math.sin(w.swing) * 60, 70), ft: P2 = [x + 40 + Math.sin(w.swing) * 150, GROUND - 14 - w.lift];
    cel(p, tube([hip, kn, ft], 44, 24), col, light, { d: 8 }); for (let i = 0; i < 5; i++) claw(p, add(ft, -16 + i * 10, 10), 22, 0.2, 6); };
  leg(560, 0.5, mul(DIM.skin, FAR)); leg(920, 0, mul(DIM.skin, FAR));
  cel(p, tube(curve([480, 760 + bob], [280, 800 + bob], [60, 820 + bob], 14), 60, 8), DIM.skin, light, { tex: () => scales(p, 40, 700, 520, 860, 14, DIM.back, 5) });
  // the sail: tall spines with a membrane, banded
  const bl = curve([520, 700 + bob], [720, 660 + bob], [940, 700 + bob], 14), r = rng(5);
  const tops = bl.map(([x, y], i) => [x + 6, y - 60 - 360 * Math.sin((Math.PI * i) / (bl.length - 1)) ** 0.8 + (r() - 0.5) * 14] as P2);
  cel(p, [...bl.map(([x, y]) => [x, y + 30] as P2).reverse(), ...tops], DIM.sail, light, { d: 18, tex: () => {
    for (let b = 0; b < 3; b++) p.poly(chaikin([...tops.map(([x, y]) => [x, y + 80 + b * 90] as P2), ...tops.slice().reverse().map(([x, y]) => [x, y + 120 + b * 90] as P2)], 1), b % 2 ? DIM.sailDark : DIM.sailLit, 0);
    tops.forEach((t, i) => p.stroke([bl[i], t], 7, DIM.sailDark));
  } });
  tops.forEach((t) => p.ell(t[0], t[1], 8, 8, "#E2D2AA", 3));
  const body = blob(730, 770 + bob, 250, 85, 0, 3, 0, 1.9, 2.0);
  cel(p, body, DIM.skin, light, { tex: () => { p.poly(blob(760, 830 + bob, 210, 30, 0, 5), DIM.belly, 0); scales(p, 470, 680, 990, 860, 14, DIM.back, 9, 0.5); scars(p, 720, 730 + bob, "#E0C8A0", 3, 40); } });
  leg(600, 0, DIM.skin); leg(960, 0.5, DIM.skin);
  // deep skull with two kinds of teeth: big stabbing canines
  const hinge: P2 = [1010, 760 + bob], ja = rad(40) * roar, J = (q: P2[]) => rotAll(offs(q, 0, bob), ja, hinge);
  p.poly([[1010, 752 + bob], [1250, 760 + bob], ...J([[1240, 774], [1010, 772]])], DIM.mouth, 0);
  for (let i = 0; i < 7; i++) { const [tx, ty] = J([[1040 + i * 28, 772]])[0]; tooth(p, tx, ty, i === 1 ? 34 : 14, false, ja, 0.3); }
  cel(p, J([[1000, 770], [1240, 774], [1220, 796], [1040, 806]]), mul(DIM.skin, [0.9, 0.9, 0.92]), light, { d: 6, ow: OW * 0.8 });
  for (let i = 0; i < 8; i++) tooth(p, 1030 + i * 28, 756 + bob, i === 2 ? 46 : 16, true, 0, 0.3);
  cel(p, chaikin(offs([[980, 740], [1010, 680], [1100, 670], [1200, 700], [1260, 740], [1250, 760], [1010, 764]], 0, bob), 2), DIM.skin, light, { d: 10, tex: () => scales(p, 970, 660, 1270, 770, 11, DIM.back, 13, 0.5) });
  beastEye(p, 1080, 704 + bob, 0.85, expr, o.blink ?? 0, DIM.skin, "#FF8A1F");
}

// ------------------------------------------------------------------ Megatherium (Ice Age S. America; ~6 m, ~4 t, walked on its knuckles)
const MEGT = { fur: "#6A4A30", furDark: "#3A2818", furLit: "#9A7650", skin: "#3A2A20", claw: "#E2D2AA", mouth: "#30080E" };
export function drawMegatherB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 5), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const hip: P2 = [520, 620 + bob], R = (q: P2[]) => rotAll(q, -rad(55) * roar, hip); // rears up about the hips on the threat
  colLeg(p, o, 520, 640 + bob, 0.5, mul(MEGT.fur, FAR), light, { r0: 90, r1: 60, toes: 3, toe: 40, bend: 20 });
  cel(p, tube(curve([440, 640 + bob], [340, 760 + bob], [300, GROUND - 30], 8), 80, 40), MEGT.fur, light, { d: 10, tex: () => furFlicks(p, 260, 600, 480, GROUND, 30, 3, [MEGT.furDark], 30, 5) }); // thick tail, a tripod when rearing
  const body = R(chaikin(offs([[400, 620], [450, 470], [620, 390], [820, 400], [960, 460], [1000, 560], [960, 680], [780, 720], [560, 720], [430, 690]], 0, bob), 3));
  hairStrands(p, R(Array.from({ length: 18 }, (_, i) => [460 + i * 28, 700 + bob] as P2)), 80, 3, [MEGT.furDark, MEGT.fur]);
  cel(p, body, MEGT.fur, light, { d: 28, tex: () => { furFlicks(p, 300, 150, 1050, 760, 180, 5, [MEGT.furDark, MEGT.furLit], 40, 6); scars(p, 650, 470 + bob, "#E8D8B8", 3, 70); } });
  colLeg(p, o, 560, 650 + bob, 0, MEGT.fur, light, { r0: 96, r1: 62, toes: 3, toe: 40, bend: 20 });
  // arms: knuckle-walking, or raised high with the claws out
  for (const [dx, col] of [[30, mul(MEGT.fur, FAR)], [0, MEGT.fur]] as [number, string][]) {
    const sh = R([[900 + dx, 520 + bob]])[0], walk = walkOf(o, dx ? 0.25 : 0.75);
    const hand: P2 = roar > 0.05 ? add(sh, 200, -120) : [920 + dx + Math.sin(walk.swing) * 120, GROUND - 40 - walk.lift];
    const el: P2 = roar > 0.05 ? add(sh, 150, 40) : [lerp2(sh, hand, 0.5)[0] + 40, lerp2(sh, hand, 0.5)[1]];
    cel(p, tube([sh, el, hand], 66, 44), col, light, { d: 10, tex: () => furFlicks(p, Math.min(sh[0], hand[0]) - 60, Math.min(sh[1], hand[1]) - 60, Math.max(sh[0], hand[0]) + 60, Math.max(sh[1], hand[1]) + 60, 30, 9, [MEGT.furDark, MEGT.furLit], 30, 5) });
    for (let i = 0; i < 3; i++) { const a = roar > 0.05 ? -0.9 + i * 0.3 : 2.4 + i * 0.25, l = 120 - i * 15; p.poly(horn(curve(add(hand, 4 * i, 6 * i), add(hand, Math.cos(a) * l * 0.5, Math.sin(a) * l * 0.5), add(hand, Math.cos(a + 0.45) * l, Math.sin(a + 0.45) * l), 8), 14), MEGT.claw, 4); }
  }
  // head: small, long snout, prehensile lip
  const nh = R([[980, 470 + bob]])[0], hr = -rad(55) * roar - rad(20) * roar;
  const hd = rotAll(chaikin(offs([[-40, -30], [20, -70], [110, -60], [200, -10], [210, 30], [150, 50], [40, 50], [-30, 30]], nh[0], nh[1]), 2), hr * 0.3, nh);
  cel(p, hd, MEGT.fur, light, { d: 12, tex: () => { furFlicks(p, nh[0] - 60, nh[1] - 80, nh[0] + 220, nh[1] + 60, 30, 11, [MEGT.furDark], 20, 4); } });
  const mz = rotAll([add(nh, 180, 0)], hr * 0.3, nh)[0]; cel(p, blob(mz[0], mz[1], 40, 34, 0, 13), MEGT.skin, light, { d: 6 });
  if (roar > 0.05) { p.ell(mz[0] - 10, mz[1] + 30, 40, 20, MEGT.mouth, 4); tooth(p, mz[0] - 20, mz[1] + 16, 16, true, 0, 0.3); }
  const e = rotAll([add(nh, 80, -30)], hr * 0.3, nh)[0]; beastEye(p, e[0], e[1], 0.8, expr, o.blink ?? 0, MEGT.fur, "#FF6A1F");
  void folds;
}

// ------------------------------------------------------------------ dire wolf (Ice Age N. America; ~1.7 m) and Daeodon (Miocene "hell pig"; ~3.6 m)
const WOLF = { fur: "#5E5650", furDark: "#2E2824", furLit: "#9A928A", belly: "#C8BEB0", nose: "#141010", mouth: "#30080E", gum: "#9A3A44" };
export function drawWolfB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 8) + 90, roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const lg = { r0: 44, r1: 22, toes: 4, toe: 18, reach: 150 };
  colLeg(p, o, 520, 600 + bob, 0.5, mul(WOLF.fur, FAR), light, { ...lg, bend: 50 }); colLeg(p, o, 920, 600 + bob, 0, mul(WOLF.fur, FAR), light, { ...lg, bend: -10 });
  const tl = curve([440, 540 + bob], [330, 560 + bob], [250, 640 + bob], 8);
  cel(p, tube(tl, 46, 16), WOLF.fur, light, { d: 8, tex: () => furFlicks(p, 220, 480, 470, 700, 40, 3, [WOLF.furDark, WOLF.furLit], 24, 5) });
  const body = chaikin(offs([[430, 560], [480, 470], [640, 450], [820, 420], [960, 440], [1010, 520], [960, 620], [800, 640], [600, 620], [470, 610]], 0, bob), 3);
  cel(p, body, WOLF.fur, light, { d: 22, tex: () => { p.poly(blob(740, 620 + bob, 220, 34, 0, 5), WOLF.belly, 0); furFlicks(p, 420, 400, 1020, 650, 130, 5, [WOLF.furDark, WOLF.furLit], 30, 5); scars(p, 700, 480 + bob, "#E8D8C8", 3, 50); } });
  scutes(p, curve([520, 470 + bob], [760, 410 + bob], [980, 430 + bob], 14), 26 * (1 + roar), WOLF.furDark, light, 7); // hackles up
  colLeg(p, o, 480, 610 + bob, 0, WOLF.fur, light, { ...lg, bend: 50 }); colLeg(p, o, 880, 610 + bob, 0.5, WOLF.fur, light, { ...lg, bend: -10 });
  // head low, snarling: lips pull back from the fangs
  const nb: P2 = [960, 470 + bob], hr = rad(12) * roar, R = (q: P2[]) => rotAll(offs(q, 0, bob), hr, nb);
  cel(p, tube(R(curve([940, 480], [1000, 460], [1040, 450], 6)), 76, 62), WOLF.fur, light, { d: 12, tex: () => furFlicks(p, 900, 380, 1100, 560, 30, 9, [WOLF.furDark, WOLF.furLit], 24, 5) });
  const hinge = R([[1060, 480]])[0], ja = rad(34) * roar, J = (q: P2[]) => rotAll(R(q), ja, hinge);
  if (roar > 0.05) { p.poly([...R([[1060, 470], [1230, 476]]), ...J([[1220, 490], [1060, 494]])], WOLF.mouth, 0); p.poly(R([[1080, 468], [1230, 474], [1220, 484], [1080, 482]]), WOLF.gum, 0); }
  for (let i = 0; i < 6; i++) { const [tx, ty] = R([[1090 + i * 22, 476]])[0]; tooth(p, tx, ty, i === 4 ? 30 : 12, true, hr, 0.3); const [bx, by] = J([[1090 + i * 22, 490]])[0]; tooth(p, bx, by, i === 3 ? 26 : 10, false, hr + ja, 0.3); }
  cel(p, J([[1060, 486], [1220, 490], [1200, 512], [1080, 520]]), WOLF.fur, light, { d: 6, ow: OW * 0.8 });
  cel(p, R(chaikin([[1010, 440], [1050, 400], [1120, 400], [1240, 440], [1250, 470], [1170, 476], [1060, 480], [1010, 470]], 2)), WOLF.fur, light, { d: 12, tex: () => { furFlicks(p, 1000, 380, 1260, 490, 24, 11, [WOLF.furDark], 16, 4); p.g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) p.stroke(R([[1150 + i * 20, 420], [1170 + i * 20, 446]]), 4, INKB); p.g.globalAlpha = 1; } });
  for (const d of [16, 0]) cel(p, R([[1030 + d, 410], [1010 + d, 330], [1070 + d, 400]]), d ? WOLF.furDark : WOLF.fur, light, { d: 4, ow: OW * 0.7, rim: false }); // ears
  p.poly(R([[1236, 434], [1258, 444], [1250, 462], [1230, 456]]), WOLF.nose, 0);
  const e = R([[1110, 424]])[0]; beastEye(p, e[0], e[1], 0.72, expr, o.blink ?? 0, WOLF.fur, "#F2D23A");
}
const HOG = { skin: "#4A3A32", hair: "#2A201A", lit: "#7A6656", belly: "#9A8676", knob: "#5E4A40", tusk: "#E6D8B4", mouth: "#30080E", gum: "#9A3A44" };
export function drawHellPigB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), bob = bobOf(o, 6), roar = o.roar ?? 0, expr = o.expr ?? "angry";
  const lg = { r0: 56, r1: 26, toes: 2, toe: 22, reach: 140 };
  colLeg(p, o, 520, 620 + bob, 0.5, mul(HOG.skin, FAR), light, { ...lg, bend: 30 }); colLeg(p, o, 880, 620 + bob, 0, mul(HOG.skin, FAR), light, { ...lg, bend: -10 });
  const body = chaikin(offs([[420, 560], [470, 460], [640, 420], [800, 360], [920, 380], [980, 470], [960, 620], [800, 670], [560, 660], [440, 630]], 0, bob), 3);
  cel(p, body, HOG.skin, light, { d: 24, tex: () => { p.poly(blob(720, 650 + bob, 220, 34, 0, 5), HOG.belly, 0); furFlicks(p, 410, 340, 990, 680, 120, 5, [HOG.hair, HOG.lit], 26, 5); scars(p, 650, 470 + bob, "#E0C8B0", 4, 60); } });
  scutes(p, curve([520, 450 + bob], [760, 350 + bob], [940, 380 + bob], 14), 40, HOG.hair, light, 7); // bristle mane
  colLeg(p, o, 480, 630 + bob, 0, HOG.skin, light, { ...lg, bend: 30 }); colLeg(p, o, 840, 630 + bob, 0.5, HOG.skin, light, { ...lg, bend: -10 });
  // huge head: jowl knobs, long jaws with tusks, opens wide
  const hinge: P2 = [1010, 560 + bob], ja = rad(40) * roar, J = (q: P2[]) => rotAll(offs(q, 0, bob), ja, hinge);
  p.poly([[1010, 550 + bob], [1290, 556 + bob], ...J([[1280, 572], [1010, 572]])], HOG.mouth, 0);
  if (roar > 0.05) p.poly([[1030, 556 + bob], [1280, 560 + bob], [1270, 570 + bob], [1030, 568 + bob]], HOG.gum, 0);
  for (let i = 0; i < 7; i++) { const [tx, ty] = J([[1050 + i * 32, 572]])[0]; tooth(p, tx, ty, i === 5 ? 50 : 16, false, ja, 0.3); tooth(p, 1050 + i * 32, 554 + bob, i === 5 ? 44 : 16, true, 0, 0.3); }
  cel(p, J([[1000, 568], [1280, 572], [1250, 612], [1120, 640], [1040, 650], [990, 620]]), HOG.skin, light, { d: 10, ow: OW * 0.85, tex: () => furFlicks(p, 990, 560, 1300, 660, 20, 9, [HOG.hair], 14, 4) });
  cel(p, J([[1060, 640], [1110, 690], [1140, 640]]), HOG.knob, light, { d: 4, ow: 9 }); // jaw knob
  cel(p, chaikin(offs([[960, 470], [1000, 400], [1080, 390], [1180, 440], [1290, 520], [1300, 556], [1010, 556], [960, 530]], 0, bob), 2), HOG.skin, light, { d: 14, tex: () => furFlicks(p, 950, 380, 1300, 560, 30, 11, [HOG.hair, HOG.lit], 18, 4) });
  cel(p, blob(1020, 560 + bob, 50, 40, 0, 17), HOG.knob, light, { d: 6 }); // cheek flange
  p.ell(1290, 530 + bob, 18, 26, "#1A1210", 4);
  const e = [1090, 452 + bob] as P2; beastEye(p, e[0], e[1], 0.8, expr, o.blink ?? 0, HOG.skin, "#FF6A1F");
}

// ------------------------------------------------------------------ Arthropleura (Carboniferous; ~2.6 m millipede)
const ART = { shell: "#4A3A2E", dark: "#1E1612", lit: "#8A6A4A", leg: "#6A4A30", mouth: "#30080E" };
export function drawArthroB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", n = 24;
  const seg = (i: number): P2 => { const u = i / (n - 1), lift = roar * Math.max(0, (u - 0.65) / 0.35) ** 1.6 * 300; return [140 + u * 1180, 870 - lift + 8 * Math.sin(ph * 2 + i * 0.6) * (o.walk ?? 0)]; };
  for (let i = 0; i < n; i++) { const q = seg(i), sw = Math.sin(ph * 3 + i * 0.8) * 26 * (o.walk ?? 0.5); for (const s of [0, 1]) p.stroke([add(q, s * 8, 20), add(q, 20 + sw + s * 6, 60), add(q, 10 + sw + s * 6, Math.min(GROUND - q[1] - 4, 90))], 7, s ? ART.leg : mul(ART.leg, FAR)); }
  for (let i = 0; i < n; i++) { const q = seg(i), w = 58 - Math.abs(i - n * 0.55) * 1.2;
    cel(p, blob(q[0], q[1], 34, w, 0, i), i % 2 ? ART.shell : mul(ART.shell, [0.85, 0.85, 0.85]), light, { d: 8, ow: 9, tex: () => { p.ell(q[0] - 6, q[1] - w * 0.55, 18, 8, ART.lit, 0); p.stroke([add(q, -26, -w * 0.2), add(q, 26, -w * 0.2)], 3, ART.dark); } });
    cel(p, [add(q, -10, -w + 4), add(q, 4, -w - 26), add(q, 16, -w + 4)], ART.dark, light, { d: 2, ow: 6, rim: false }); }
  const h = add(seg(n - 1), 60, 0);
  cel(p, blob(h[0], h[1], 60, 54, 0, 31), ART.shell, light, { d: 8 });
  for (const s of [-1, 1]) p.stroke(curve(add(h, 40, -30), add(h, 120, -90 + s * 20), add(h, 180, -60 + s * 30), 8), 7, ART.dark); // antennae
  for (const s of [-1, 1]) p.poly(horn(curve(add(h, 46, 20), add(h, 80, 30 + s * 10 + roar * 20 * s), add(h, 96, 10 + s * 20), 6), 10), "#1A1210", 3);
  beastEye(p, h[0] + 20, h[1] - 20, 0.55, expr, o.blink ?? 0, ART.shell, "#F2D23A");
}

// ------------------------------------------------------------------ Anomalocaris (Cambrian, ~508 Ma; ~1 m, the first top predator) and Helicoprion (Permian; ~5-8 m)
const ANO = { body: "#8A3A2E", dark: "#3A120C", lit: "#D9824A", flap: "#B8584A", eye: "#1A1210", spine: "#E2C29A" };
export function drawAnomaloB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  for (let i = 0; i < 11; i++) { const x = 320 + i * 75, a = Math.sin(ph * 2 - i * 0.7) * 0.5 * (o.walk ?? 0.6); // swimming flaps
    for (const s of [-1, 1]) cel(p, rotAll([[x, cy + s * 50], [x - 80, cy + s * 150], [x + 40, cy + s * 140]], a * s, [x, cy + s * 50]), s > 0 ? ANO.flap : mul(ANO.flap, FAR), light, { d: 6, ow: 9, rim: false }); }
  cel(p, [[330, cy], [180, cy - 110], [220, cy], [180, cy + 110]], ANO.flap, light, { d: 6, ow: 9 }); // tail fan
  const body = chaikin([[320, cy], [420, cy - 70], [900, cy - 80], [1080, cy - 60], [1100, cy + 60], [900, cy + 80], [420, cy + 60]], 3);
  cel(p, body, ANO.body, light, { d: 18, tex: () => { for (let i = 0; i < 11; i++) p.stroke([[350 + i * 70, cy - 76], [350 + i * 70, cy + 76]], 4, ANO.dark); p.poly(blob(700, cy - 50, 360, 18, 0, 3), ANO.lit, 0); } });
  // stalked eyes
  for (const s of [1, -1]) { const b: P2 = [1040, cy - 40], e = add(b, 40, -90 + s * 6); p.stroke([b, e], 14, ANO.dark); cel(p, blob(e[0], e[1], 30, 22, 0.3, 7), ANO.eye, light, { d: 4, ow: 8 }); p.ell(e[0] + 8, e[1] - 6, 8, 5, "#E8C24A", 0); }
  // grasping frontal appendages: curled, or reaching forward with the spines open
  for (const [s, col] of [[1, mul(ANO.body, FAR)], [-1, ANO.body]] as [number, string][]) {
    const pts: P2[] = []; let q: P2 = [1090, cy + 10 * s], a = -0.2;
    for (let i = 0; i < 12; i++) { pts.push(q); a += (0.32 - roar * 0.26) * (1 + i * 0.05); q = add(q, Math.cos(a) * 34, Math.sin(a) * 34); }
    cel(p, tube(pts, 28, 12), col, light, { d: 6, tex: () => { for (const t of pts) p.stroke([add(t, -20, -20), add(t, 20, 20)], 3, ANO.dark); } });
    pts.forEach((t, i) => { if (i % 2) return; const n2 = Math.atan2(pts[Math.min(11, i + 1)][1] - t[1], pts[Math.min(11, i + 1)][0] - t[0]) + Math.PI / 2; p.poly(horn([t, add(t, Math.cos(n2) * 20, Math.sin(n2) * 20), add(t, Math.cos(n2) * 40, Math.sin(n2) * 40)], 6), ANO.spine, 3); });
  }
  p.ell(1090, cy + 40, 26, 26, ANO.dark, 4); // the round mouth underneath
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.stroke([[1090 + Math.cos(a) * 8, cy + 40 + Math.sin(a) * 8], [1090 + Math.cos(a) * 22, cy + 40 + Math.sin(a) * 22]], 4, ANO.spine); }
  void expr;
}
const HEL = { top: "#3A4048", side: "#6A747E", belly: "#D6D8D2", fin: "#2A3036", mouth: "#22090E", tooth: "#EDE2C4", scar: "#C9CED0" };
export function drawHelicoB(p: Pen, o: AnimalPose) {
  const light = o.light ?? rad(-120), ph = 2 * Math.PI * (o.phase ?? 0), sweep = Math.sin(ph) * 0.16 * (o.walk ?? 0.6), roar = o.roar ?? 0, expr = o.expr ?? "angry", cy = 520;
  cel(p, rotAll([[300, cy - 10], [150, cy - 220], [205, cy - 30], [230, cy + 10], [130, cy + 170], [300, cy + 30]] as P2[], sweep, [270, cy]), HEL.fin, light, { d: 10 });
  const body = chaikin(rotAll([[260, cy - 10], [420, cy - 110], [700, cy - 160], [1000, cy - 150], [1250, cy - 90], [1390, cy - 20], [1395, cy + 30], [1300, cy + 90], [1050, cy + 130], [750, cy + 140], [480, cy + 80], [280, cy + 20]] as P2[], sweep * 0.25, [800, cy]), 3);
  cel(p, body, HEL.side, light, { d: 28, tex: () => { p.poly(chaikin([[260, cy + 10], [700, cy + 40], [1330, cy + 40], [1300, cy + 150], [700, cy + 190], [280, cy + 60]], 2), HEL.belly, 0); p.poly(chaikin([[300, cy - 30], [700, cy - 200], [1250, cy - 130], [1300, cy - 70], [900, cy - 70], [500, cy - 40]], 2), HEL.top, 0); for (let i = 0; i < 5; i++) p.stroke(curve([1080 - i * 26, cy - 60], [1066 - i * 26, cy], [1076 - i * 26, cy + 60], 6), 6, INKB); scars(p, 760, cy - 90, HEL.scar); } });
  cel(p, [[700, cy - 150], [780, cy - 330], [820, cy - 322], [880, cy - 146]], HEL.fin, light, { d: 10 });
  cel(p, [[980, cy + 100], [780, cy + 250], [735, cy + 236], [905, cy + 88]], HEL.fin, light, { d: 8 });
  // the tooth whorl: a spiral of serrated teeth in the lower jaw, shown when the jaw drops
  const hinge: P2 = [1120, cy + 40], ja = rad(36) * roar, J = (q: P2[]) => rotAll(q, ja, hinge);
  if (roar > 0.05) {
    p.poly([[1120, cy + 20], [1390, cy + 6], ...J([[1370, cy + 40], [1120, cy + 50]])], HEL.mouth, 0);
    const c = J([[1280, cy + 70]])[0];
    for (let i = 0; i < 26; i++) { const a = -1.2 + i * 0.3, r = 14 + i * 3.2; const q = add(c, Math.cos(a) * r, Math.sin(a) * r); tooth(p, q[0], q[1], 10 + i * 1.3, false, a + Math.PI / 2 + ja, 0.45); }
    cel(p, J([[1120, cy + 50], [1370, cy + 40], [1330, cy + 120], [1130, cy + 130]]), HEL.belly, light, { d: 10 });
    const c2 = J([[1280, cy + 70]])[0]; for (let i = 0; i < 8; i++) { const a = -1.4 + i * 0.32; tooth(p, c2[0] + Math.cos(a) * 46, c2[1] + Math.sin(a) * 46 - 30, 18 + i * 2, false, a + Math.PI / 2, 0.4); }
  } else p.stroke(curve([1180, cy + 50], [1290, cy + 60], [1385, cy + 28], 8), 7, INKB);
  beastEye(p, 1270, cy - 52, 1.3, expr, o.blink ?? 0, HEL.top, "#E8E2D0");
}

// ------------------------------------------------------------------ registry (x0 / x1 measured with BeastSolo)
export const BEAST_EXTRA = {
  allo: { draw: drawAlloB, len: 9.5, x0: 16, x1: 1321 },
  carno: { draw: drawCarnoB, len: 8, x0: 16, x1: 1192 },
  giga: { draw: drawGigaB, len: 12.5, x0: 16, x1: 1384 },
  dilo: { draw: drawDiloB, len: 7, x0: 16, x1: 1266 },
  theri: { draw: drawTheriB, len: 9, x0: 180, x1: 1123 },
  deino: { draw: drawDeinoB, len: 10.5, x0: 23, x1: 1556 },
  elasmo: { draw: drawElasmoB, len: 10.5, x0: 49, x1: 1536, fly: true },
  liopleuro: { draw: drawLiopleuroB, len: 6.5, x0: 106, x1: 1532, fly: true },
  dimetro: { draw: drawDimetroB, len: 3.5, x0: 45, x1: 1267 },
  megather: { draw: drawMegatherB, len: 6, x0: 249, x1: 1210 },
  direwolf: { draw: drawWolfB, len: 1.8, x0: 225, x1: 1258 },
  hellpig: { draw: drawHellPigB, len: 3.3, x0: 420, x1: 1310 },
  arthro: { draw: drawArthroB, len: 2.6, x0: 102, x1: 1564 },
  anomalo: { draw: drawAnomaloB, len: 0.9, x0: 180, x1: 1222, fly: true },
  helico: { draw: drawHelicoB, len: 6, x0: 127, x1: 1403, fly: true },
} as const;
