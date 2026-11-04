// r02 host: a flat 2D cutout character living in the 3D world (2026-11-04), the technique of the reference Short
// (youtube.com/shorts/7xS87iActkU, analysed frame by frame): big round white head, bean torso, stick limbs, thick dark
// outline, flat fills; the face is a set of swappable parts (eyes / brows / mouth + extras: sweat, steam, face tint)
// on a static round head; the body is a cutout puppet (limbs hinged at shoulder/elbow, hip/knee) that snaps between
// poses with a little overshoot, steps on twos (12 fps), bobs and squashes; it flips on X to face its direction.
// Our own character design (the channel's host: spiky black hair, mustard hoodie, jeans): nothing is copied from the
// reference's characters, only the way they are built.
// The drawing is redrawn into a canvas every frame and shown on a yaw-only billboard in the 3D scene, alpha-tested so
// it casts a real shadow on the 3D ground and the ink pass outlines its silhouette.
import React, { useMemo } from "react";
import * as THREE from "three";
import { V3, clamp01, ease, lerp } from "./World";

// ------------------------------------------------------------------ canvas layout (px)
const CW = 512, CH = 768;
const FEET_Y = 740, TOP_Y = 52; // soles, top of the hair
const HX = 256, HY = 210, HR = 128; // head
const INK = "#1E1A24", LW = 11;
const HOODIE = "#D9A033", HOODIE_D = "#A8741F", JEANS = "#3F6FA8", SKIN = "#FFFFFF";

// ------------------------------------------------------------------ poses
// limb angles in screen space, degrees: 0 = straight down, +90 = to screen right, 180 = up.
// A = the arm/leg on screen left, B = screen right. [upper, lower] are absolute directions of each segment.
export type HostPose = {
  A: [number, number]; B: [number, number]; legA: [number, number]; legB: [number, number];
  tilt?: number; // body lean, degrees (+ = leans to screen right)
  head?: number; // head tilt, degrees
  shrug?: number; // shoulders up 0..1
  front?: "A" | "B"; // that arm is drawn over the head (hand to face)
  point?: "A" | "B"; // that hand points a finger
  open?: boolean; // open palms (shrug / present)
};
export const HOST_POSES: Record<string, HostPose> = {
  idle: { A: [-10, -4], B: [10, 4], legA: [-5, -3], legB: [5, 3] },
  pointUp: { A: [-10, -4], B: [148, 176], legA: [-5, -3], legB: [5, 3], tilt: -3, head: 6, point: "B" },
  present: { A: [-62, -88], B: [12, 4], legA: [-6, -3], legB: [5, 3], tilt: -4, head: -5, open: true },
  shrug: { A: [-38, -118], B: [38, 118], legA: [-5, -3], legB: [5, 3], shrug: 1, head: 7, open: true },
  armsUp: { A: [-148, -170], B: [148, 170], legA: [-9, -5], legB: [9, 5], open: true },
  surprised: { A: [-112, -168], B: [112, 168], legA: [-8, -4], legB: [8, 4], shrug: 0.6, tilt: 0, open: true },
  think: { A: [-18, 72], B: [131, -98], legA: [-5, -3], legB: [6, 3], head: -8, front: "B" },
  facepalm: { A: [-12, -5], B: [166, -143], legA: [-5, -3], legB: [5, 3], head: 12, tilt: 3, front: "B" },
  hips: { A: [-40, 58], B: [40, -58], legA: [-9, -5], legB: [9, 5], head: -4 },
  wave: { A: [-10, -4], B: [128, 160], legA: [-5, -3], legB: [5, 3], tilt: -2, open: true },
};

// ------------------------------------------------------------------ expressions: swappable face parts
type EyeT = "dot" | "open" | "half" | "happy" | "closed" | "squeeze" | "wide" | "angry";
type BrowT = "none" | "flat" | "angry" | "worried" | "raised" | "low";
type MouthT = "line" | "smile" | "grin" | "o" | "small" | "squiggle" | "teeth" | "frown" | "smirk" | "open";
export type HostExpr = { eyeA: EyeT; eyeB: EyeT; browA: BrowT; browB: BrowT; mouth: MouthT; look?: [number, number];
  sweat?: boolean; steam?: boolean; blush?: boolean; tint?: string; lines?: boolean };
const E = (eye: EyeT, brow: BrowT, mouth: MouthT, x: Partial<HostExpr> = {}): HostExpr => ({ eyeA: eye, eyeB: eye, browA: brow, browB: brow, mouth, ...x });
export const HOST_EXPR: Record<string, HostExpr> = {
  neutral: E("dot", "none", "line"),
  smug: E("half", "flat", "smirk"),
  skeptical: { ...E("half", "low", "line"), browB: "raised", eyeB: "open" },
  deadpan: E("half", "none", "line"),
  happy: E("happy", "raised", "grin"),
  laugh: E("squeeze", "raised", "grin", { blush: true }),
  curious: E("open", "raised", "small", { look: [0.4, -0.5] }),
  thinking: { ...E("open", "flat", "smirk", { look: [-0.6, -0.8] }), browB: "worried" },
  surprised: E("wide", "raised", "o"),
  manic: E("wide", "raised", "grin"),
  strain: E("squeeze", "angry", "teeth", { sweat: true }),
  rage: E("angry", "angry", "teeth", { tint: "#B98BD8", steam: true }),
  nauseous: E("wide", "worried", "squiggle", { sweat: true, tint: "#D8EBC8", lines: true }),
  worried: E("open", "worried", "frown", { sweat: true }),
  wink: { ...E("open", "raised", "smile"), eyeA: "happy", browA: "low" },
};

export type HostKey = { t: number; pose?: string; expr?: string; flip?: boolean };
type Cue = { start: number; end: number; value: string };

// ------------------------------------------------------------------ helpers
const STEP = 1 / 12; // the body steps on twos, like the reference's cutout animation
const backOut = (x: number) => { const c = 1.9; const k = clamp01(x) - 1; return 1 + (c + 1) * k * k * k + c * k * k; };
const dirOf = (deg: number): [number, number] => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
const mixPose = (a: HostPose, b: HostPose, k: number): HostPose => {
  const m2 = (p: [number, number], q: [number, number]): [number, number] => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
  return { A: m2(a.A, b.A), B: m2(a.B, b.B), legA: m2(a.legA, b.legA), legB: m2(a.legB, b.legB), tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, k),
    head: lerp(a.head ?? 0, b.head ?? 0, k), shrug: lerp(a.shrug ?? 0, b.shrug ?? 0, k), front: k < 0.5 ? a.front : b.front,
    point: k < 0.5 ? a.point : b.point, open: k < 0.5 ? a.open : b.open };
};
const hash = (n: number) => { const s = Math.sin(n * 91.345) * 47453.21; return s - Math.floor(s); };

export function hostState(keys: HostKey[], t: number) {
  const tq = Math.floor(t / STEP) * STEP;
  let pose = keys[0].pose ?? "idle", prev = pose, since = 99, expr = keys[0].expr ?? "neutral", flip = keys[0].flip ?? false, exprSince = 99;
  for (const k of keys) {
    if (k.t > tq) break;
    if (k.pose && k.pose !== pose) { prev = pose; pose = k.pose; since = tq - k.t; } else if (k.pose) since = Math.min(since, tq - k.t);
    if (k.expr) { expr = k.expr; exprSince = tq - k.t; }
    if (k.flip !== undefined) flip = k.flip;
  }
  const k = backOut(since / 0.22);
  const p = mixPose(HOST_POSES[prev] ?? HOST_POSES.idle, HOST_POSES[pose] ?? HOST_POSES.idle, k);
  // wave: the forearm swings
  if (pose === "wave") p.B = [p.B[0], p.B[1] + 22 * Math.sin(tq * 14)];
  // squash before / stretch after a pose change
  const sq = since < 0.08 ? -0.05 : since < 0.3 ? 0.04 * Math.sin(((since - 0.08) / 0.22) * Math.PI) : 0;
  return { tq, pose: p, expr: HOST_EXPR[expr] ?? HOST_EXPR.neutral, exprName: expr, exprSince, flip, squash: sq };
}

// ------------------------------------------------------------------ drawing
function stroke(ctx: CanvasRenderingContext2D, w = LW, c = INK) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }
function fillStroke(ctx: CanvasRenderingContext2D, fill: string, w = LW) { ctx.fillStyle = fill; ctx.fill(); stroke(ctx, w); }

function limb(ctx: CanvasRenderingContext2D, x: number, y: number, ang: [number, number], l1: number, l2: number) {
  const d1 = dirOf(ang[0]), d2 = dirOf(ang[1]);
  const ex = x + d1[0] * l1, ey = y + d1[1] * l1;
  const hx = ex + d2[0] * l2, hy = ey + d2[1] * l2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy);
  stroke(ctx, LW + 1);
  return { ex, ey, hx, hy, dir: d2 };
}
function hand(ctx: CanvasRenderingContext2D, x: number, y: number, dir: [number, number], point: boolean, open: boolean) {
  ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); fillStroke(ctx, SKIN, 8);
  if (point) { // index finger along the forearm
    ctx.beginPath(); ctx.moveTo(x + dir[0] * 12, y + dir[1] * 12); ctx.lineTo(x + dir[0] * 36, y + dir[1] * 36); stroke(ctx, 16); stroke(ctx, 7, SKIN);
  } else if (open) { // thumb nub
    ctx.beginPath(); ctx.arc(x - dir[1] * 15, y + dir[0] * 15, 7, 0, Math.PI * 2); fillStroke(ctx, SKIN, 6);
  }
}
function foot(ctx: CanvasRenderingContext2D, x: number, y: number, side: number) {
  ctx.beginPath(); ctx.ellipse(x + side * 12, y - 8, 26, 14, 0, 0, Math.PI * 2); fillStroke(ctx, "#F4F1EA", 8);
  ctx.beginPath(); ctx.moveTo(x + side * 12 - 22, y - 2); ctx.lineTo(x + side * 12 + 22, y - 2); stroke(ctx, 5, "#B9B2A6");
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, t: EyeT, side: number, look: [number, number], blink: boolean) {
  const lx = look[0] * 6, ly = look[1] * 6;
  if (blink && t !== "happy" && t !== "squeeze" && t !== "closed") t = "closed";
  ctx.fillStyle = INK;
  switch (t) {
    case "dot": ctx.beginPath(); ctx.arc(x + lx, y + ly, 10, 0, Math.PI * 2); ctx.fill(); break;
    case "open": ctx.beginPath(); ctx.ellipse(x + lx, y + ly, 11, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(x + lx - 3, y + ly - 6, 4, 0, Math.PI * 2); ctx.fill(); break;
    case "half": case "angry": { // flat-topped lid: a half ellipse under a (slanted) lid line
      const s = t === "angry" ? 9 * side : -3 * side; // inner end lower when angry
      ctx.save(); ctx.beginPath(); ctx.moveTo(x - 24, y - 3 - s); ctx.lineTo(x + 24, y - 3 + s); ctx.lineTo(x + 24, y + 30); ctx.lineTo(x - 24, y + 30); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.ellipse(x + lx * 0.6, y + 2, 15, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(x - 22, y - 3 - s * 0.92); ctx.lineTo(x + 22, y - 3 + s * 0.92); stroke(ctx, 7); break;
    }
    case "happy": ctx.beginPath(); ctx.arc(x, y + 6, 15, Math.PI * 1.1, Math.PI * 1.9); stroke(ctx, 8); break;
    case "closed": ctx.beginPath(); ctx.moveTo(x - 15, y + 2); ctx.quadraticCurveTo(x, y + 8, x + 15, y + 2); stroke(ctx, 7); break;
    case "squeeze": ctx.beginPath(); ctx.moveTo(x - 14 * side, y - 11); ctx.lineTo(x + 12 * side, y); ctx.lineTo(x - 14 * side, y + 11); stroke(ctx, 8); break;
    case "wide": ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill(); stroke(ctx, 7);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + lx * 1.5, y + ly * 1.5, 7, 0, Math.PI * 2); ctx.fill(); break;
  }
}
function brow(ctx: CanvasRenderingContext2D, x: number, y: number, t: BrowT, side: number) {
  if (t === "none") return;
  // side: -1 = screen-left brow (its inner end is on the right)
  const inner = { flat: 0, angry: 12, worried: -12, raised: -6, low: 6 }[t];
  const lift = { flat: 0, angry: 4, worried: -4, raised: -14, low: 8 }[t];
  const xi = x - side * 20, xo = x + side * 20;
  ctx.beginPath(); ctx.moveTo(xo, y + lift - (t === "raised" ? 0 : 0)); ctx.quadraticCurveTo(x, y + lift - (t === "raised" ? 8 : 2), xi, y + lift + inner);
  stroke(ctx, 9);
}
function mouth(ctx: CanvasRenderingContext2D, x: number, y: number, t: MouthT, talk: number, ts: number) {
  // talking: the mouth opens a bit on the voice (limited flap, 2 shapes), keeping the expression's character
  if (talk > 0.5 && (t === "line" || t === "smirk" || t === "small" || t === "frown")) t = "open";
  if (talk > 0.5 && t === "smile") t = "grin";
  ctx.fillStyle = INK;
  switch (t) {
    case "line": ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); stroke(ctx, 7); break;
    case "smirk": ctx.beginPath(); ctx.moveTo(x - 16, y + 2); ctx.quadraticCurveTo(x + 4, y + 6, x + 20, y - 6); stroke(ctx, 7); break;
    case "smile": ctx.beginPath(); ctx.arc(x, y - 14, 22, Math.PI * 0.2, Math.PI * 0.8); stroke(ctx, 7); break;
    case "frown": ctx.beginPath(); ctx.arc(x, y + 16, 18, Math.PI * 1.2, Math.PI * 1.8); stroke(ctx, 7); break;
    case "small": ctx.beginPath(); ctx.ellipse(x, y, 7, 6, 0, 0, Math.PI * 2); ctx.fill(); break;
    case "o": ctx.beginPath(); ctx.ellipse(x, y + 2, 13, 17, 0, 0, Math.PI * 2); ctx.fill(); break;
    case "open": { const h = 8 + 5 * Math.abs(Math.sin(ts * 9)); ctx.beginPath(); ctx.ellipse(x, y + 2, 13, h, 0, 0, Math.PI * 2); ctx.fill(); break; }
    case "grin": {
      ctx.beginPath(); ctx.moveTo(x - 32, y - 6); ctx.quadraticCurveTo(x, y - 2, x + 32, y - 6); ctx.quadraticCurveTo(x + 26, y + 34, x, y + 34); ctx.quadraticCurveTo(x - 26, y + 34, x - 32, y - 6);
      ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x - 34, y - 8, 68, 11);
      ctx.fillStyle = "#E86A6A"; ctx.beginPath(); ctx.ellipse(x, y + 32, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); break;
    }
    case "teeth": {
      ctx.beginPath(); ctx.roundRect(x - 26, y - 11, 52, 22, 8); ctx.fillStyle = "#FFFFFF"; ctx.fill(); stroke(ctx, 6);
      ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x + 24, y);
      for (const dx of [-13, 0, 13]) { ctx.moveTo(x + dx, y - 10); ctx.lineTo(x + dx, y + 10); }
      stroke(ctx, 4); break;
    }
    case "squiggle": ctx.beginPath(); ctx.moveTo(x - 24, y);
      for (let i = 1; i <= 6; i++) ctx.lineTo(x - 24 + i * 8, y + (i % 2 ? -6 : 6));
      stroke(ctx, 6); break;
  }
}

export function drawHost(ctx: CanvasRenderingContext2D, s: ReturnType<typeof hostState>, t: number, talk: number) {
  const p = s.pose, x = s.expr;
  ctx.clearRect(0, 0, CW, CH);
  ctx.save();
  // squash & stretch + breathing bob + lean, all about the feet
  const bob = Math.round(Math.sin(s.tq * 2 * Math.PI * 0.9) * 3);
  ctx.translate(HX, FEET_Y);
  ctx.rotate(((p.tilt ?? 0) * Math.PI) / 180);
  ctx.scale(1 - s.squash * 0.6, 1 + s.squash);
  ctx.translate(-HX, -FEET_Y);
  // legs (sticks) + sneakers
  const hipY = 548, legL1 = 98, legL2 = 92;
  for (const [ang, side] of [[p.legA, -1], [p.legB, 1]] as [[number, number], number][]) {
    const l = limb(ctx, HX + side * 34, hipY, ang, legL1, legL2);
    foot(ctx, l.hx, l.hy + 4, side);
  }
  // torso: mustard hoodie bean + pocket + strings
  const sy = (p.shrug ?? 0) * 10;
  const ty = 330 + bob;
  const armY = ty + 40 - sy;
  const drawArm = (which: "A" | "B") => {
    const side = which === "A" ? -1 : 1;
    const l = limb(ctx, HX + side * 66, armY, p[which], 92, 86);
    hand(ctx, l.hx, l.hy, l.dir, p.point === which, !!p.open);
  };
  if (p.front !== "A") drawArm("A");
  if (p.front !== "B") drawArm("B");
  ctx.beginPath();
  ctx.moveTo(HX - 70, ty + 10 - sy);
  ctx.bezierCurveTo(HX - 96, ty + 90, HX - 92, ty + 200, HX - 64, ty + 228);
  ctx.lineTo(HX + 64, ty + 228);
  ctx.bezierCurveTo(HX + 92, ty + 200, HX + 96, ty + 90, HX + 70, ty + 10 - sy);
  ctx.quadraticCurveTo(HX, ty - 22 - sy, HX - 70, ty + 10 - sy);
  fillStroke(ctx, HOODIE);
  ctx.beginPath(); ctx.moveTo(HX - 64, ty + 214); ctx.lineTo(HX + 64, ty + 214); stroke(ctx, 18, HOODIE_D); // waistband
  ctx.beginPath(); ctx.moveTo(HX - 64, ty + 228); ctx.lineTo(HX + 64, ty + 228); stroke(ctx, LW);
  ctx.beginPath(); ctx.moveTo(HX - 48, ty + 196); ctx.lineTo(HX - 36, ty + 140); ctx.lineTo(HX + 36, ty + 140); ctx.lineTo(HX + 48, ty + 196); ctx.closePath();
  fillStroke(ctx, HOODIE_D, 7); // pocket
  ctx.beginPath(); ctx.moveTo(HX - 16, ty + 20); ctx.lineTo(HX - 20, ty + 76); ctx.moveTo(HX + 16, ty + 20); ctx.lineTo(HX + 20, ty + 76); stroke(ctx, 5, "#FFFFFF");
  // jeans: a short band under the hoodie the legs come out of
  ctx.beginPath(); ctx.roundRect(HX - 58, ty + 230, 116, 24, 10); fillStroke(ctx, JEANS, 8);
  // head (static round base, the face parts are swapped on it)
  ctx.save();
  const hy = HY + bob;
  ctx.translate(HX, hy + HR * 0.8);
  ctx.rotate(((p.head ?? 0) * Math.PI) / 180);
  ctx.translate(-HX, -(hy + HR * 0.8));
  // spiky hair behind the head top
  ctx.beginPath();
  const spikes = [[-120, 10], [-128, -40], [-92, -62], [-80, -110], [-40, -96], [-14, -150], [18, -104], [58, -132], [70, -86], [116, -96], [104, -46], [130, -20], [116, 10]];
  ctx.moveTo(HX - 112, hy + 20);
  for (const [dx, dy] of spikes) ctx.lineTo(HX + dx, hy + dy);
  ctx.closePath(); fillStroke(ctx, "#25202C");
  ctx.beginPath(); ctx.arc(HX, hy, HR, 0, Math.PI * 2); fillStroke(ctx, x.tint ?? SKIN);
  // fringe over the forehead
  ctx.beginPath(); ctx.moveTo(HX - 112, hy - 64);
  for (const [dx, dy] of [[-74, -62], [-52, -88], [-26, -66], [-2, -96], [24, -68], [52, -92], [76, -60], [110, -66], [100, -108], [0, -136], [-100, -106]]) ctx.lineTo(HX + dx, hy + dy);
  ctx.closePath(); fillStroke(ctx, "#25202C", 8);
  // face parts
  const blink = (() => { const n = Math.floor(t / 3.1); const at = n * 3.1 + 0.4 + hash(n) * 1.6; return t >= at && t < at + 0.1; })();
  const look = x.look ?? [0, 0];
  const ey = hy + 2;
  ctx.save(); ctx.translate(HX, hy + 14); ctx.scale(1.3, 1.3); ctx.translate(-HX, -(hy + 14));
  if (x.lines) { ctx.beginPath(); for (const dx of [-40, -20, 0, 20, 40]) { ctx.moveTo(HX + dx, hy - 30); ctx.lineTo(HX + dx, hy - 6); } stroke(ctx, 4, "#5E86C9"); }
  if (x.blush) for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(HX + side * 70, hy + 40, 18, 9, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(240,120,130,0.55)"; ctx.fill(); }
  eye(ctx, HX - 42, ey, x.eyeA, -1, look, blink);
  eye(ctx, HX + 42, ey, x.eyeB, 1, look, blink);
  brow(ctx, HX - 42, ey - 34, x.browA, -1);
  brow(ctx, HX + 42, ey - 34, x.browB, 1);
  mouth(ctx, HX + 2, hy + 58, x.mouth, talk, t);
  ctx.restore();
  if (x.sweat) { ctx.beginPath(); ctx.moveTo(HX + 92, hy - 46); ctx.quadraticCurveTo(HX + 108, hy - 18, HX + 100, hy - 10); ctx.arc(HX + 92, hy - 14, 9, 0, Math.PI); ctx.closePath(); fillStroke(ctx, "#9FD2F2", 5); }
  ctx.restore();
  if (x.steam) for (let i = 0; i < 3; i++) {
    const ph = (s.tq * 1.4 + i / 3) % 1;
    ctx.beginPath(); ctx.arc(HX - 70 + i * 70, HY - HR - 20 - ph * 60, 12 + ph * 14, 0, Math.PI * 2);
    ctx.globalAlpha = 1 - ph; fillStroke(ctx, "#FFFFFF", 6); ctx.globalAlpha = 1;
  }
  if (p.front) drawArm(p.front);
  ctx.restore();
}

// ------------------------------------------------------------------ the billboard in the 3D world
export const HOST_H = 1.7; // m, soles to top of the hair
const PLANE_H = (HOST_H * CH) / (FEET_Y - TOP_Y), PLANE_W = (PLANE_H * CW) / CH;
export const HEAD_Y = ((FEET_Y - HY) / (FEET_Y - TOP_Y)) * HOST_H; // m, head centre above the ground

const talkAt = (cues: Cue[], t: number) => { for (const c of cues) if (t >= c.start && t < c.end) return c.value === "A" || c.value === "X" ? 0 : 1; return 0; };

export const StickHost: React.FC<{ keys: HostKey[]; t: number; pos: V3; camPos: V3; cues: Cue[]; tint?: string; scale?: number }> = ({ keys, t, pos, camPos, cues, tint = "#FFFFFF", scale = 1 }) => {
  const r = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CW; canvas.height = CH;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    return { ctx, tex, mat, depth };
  }, []);
  const s = hostState(keys, t);
  drawHost(r.ctx, s, t, talkAt(cues, t));
  r.tex.needsUpdate = true;
  r.mat.color.set(tint);
  const yaw = Math.atan2(camPos[0] - pos[0], camPos[2] - pos[2]);
  const groundOff = ((CH - FEET_Y) / CH) * PLANE_H;
  return (
    <group position={pos} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
      <mesh material={r.mat} customDepthMaterial={r.depth} castShadow userData={{ noNormal: true, flatNormal: r.tex }}
        position={[0, PLANE_H / 2 - groundOff, 0]} scale={[s.flip ? -1 : 1, 1, 1]}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
    </group>
  );
};
void ease;
