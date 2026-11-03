import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Why Why Why pose library (POSE_FORMAT.md). Every frame shows one whole AI-drawn pose: nothing is bent or
// stitched. Code only swaps poses (limited animation: a 3-frame squash before the key, a stretch-and-settle
// after it, a blink), moves the figure rigidly (breathing ~1%, a sway of under 1° about the feet, a dip with the
// voice, a nod at phrase starts, walking = 4 walk drawings cycled while sliding) and puts the live face on the
// pose's painted-out head: eyes / brows / mouth sprites at that pose's measured anchors, blinks, glances, Rhubarb.
// Poses without anchors (back view, a tilted head) show their drawn face.

type Cue = { start: number; end: number; value: string };
type Anchor = { p: [number, number]; w: number; h: number };
export type PoseInfo = { w: number; h: number; ground: [number, number]; anchor?: [number, number]; face: Record<"eye_l" | "eye_r" | "brow_l" | "brow_r" | "mouth", Anchor> | null };
export type PoseKey = { frame: number; pose?: string; expression?: string; look?: { x: number; y: number }; flip?: boolean; x?: number };
export interface PoseSceneProps {
  durationInFrames: number;
  audio: string;
  background: string;
  grain: string[];
  grainOpacity: number;
  look: { tint: string; tintAmount: number; shadow: string; shadowOpacity: number; boil: number };
  x: number; // screen px of the ground point
  y: number;
  height: number; // screen px of the standing idle pose, hair to soles
  seed: number;
  cues: Cue[];
  keys: PoseKey[];
  poses: { dir: string; items: Record<string, PoseInfo> };
  face: { dir: string; sizes: Record<string, [number, number]>; pad: number };
}

const EXPR: Record<string, [string, string, string]> = {
  neutral: ["open", "normal", "closed"], happy: ["happy", "normal", "smile"], sad: ["half", "sad", "sad"],
  surprised: ["wide", "raised", "o"], thinking: ["side", "raised", "closed"], angry: ["open", "angry", "closed"],
  laughing: ["happy", "raised", "wide"], confused: ["side", "sad", "small"], curious: ["wide", "raised", "closed"],
  skeptical: ["half", "angry", "closed"], wink: ["half", "raised", "smile"],
};
const RHUBARB: Record<string, string> = { A: "closed", B: "small", C: "teeth", D: "wide", E: "o", F: "o", G: "e", H: "small" };
const OPEN: Record<string, number> = { A: 0, B: 0.35, C: 0.7, D: 1, E: 0.6, F: 0.4, G: 0.3, H: 0.5, X: 0 };
const WALK = ["walk_contact", "walk_down", "walk_passing", "walk_up"];
const WALK_HOLD = 4; // frames per walk drawing (7.5 drawings/s, on fours: a cartoon walk)
const SQUASH = 3; // anticipation frames before a pose key

const cueAt = (cues: Cue[], t: number) => {
  for (const c of cues) if (t >= c.start && t < c.end) return c.value;
  return "X";
};

function blinkAt(f: number, fps: number, seed: number, forced: number[]): string | null {
  for (const t of forced) {
    const d = f - t;
    if (d >= 0 && d < 3) return d === 1 ? "closed" : "half";
  }
  let t = Math.round(fps * (1.2 + random(`b${seed}`) * 1.5));
  for (let i = 0; t <= f + 3 && i < 400; i++) {
    const d = f - t;
    if (d >= 0 && d < 3) return d === 1 ? "closed" : "half";
    t += Math.round(fps * (2.8 + random(`b${seed}-${i}`) * 2.4));
  }
  return null;
}

function glanceAt(f: number, fps: number, seed: number): number {
  let t = Math.round(fps * (2.5 + random(`g${seed}`) * 2));
  for (let i = 0; t <= f && i < 200; i++) {
    const len = Math.round(fps * (0.6 + random(`gl${seed}-${i}`) * 0.6));
    const d = f - t;
    if (d >= 0 && d < len) return (random(`gd${seed}-${i}`) < 0.5 ? -1 : 1) * Math.min(1, d / 3, (len - d) / 3);
    t += len + Math.round(fps * (4 + random(`g${seed}-${i}`) * 3));
  }
  return 0;
}

export const PoseScene: React.FC<PoseSceneProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = p.poses.items;

  // state from the keys; pose-change frames; x track (a walk slides from its key's x to the next key's x)
  let st = { pose: "idle", expression: "neutral", look: { x: 0, y: 0 }, flip: false };
  const changes: number[] = [];
  let prevPose = "idle";
  const ks = p.keys;
  for (const k of ks) {
    if (k.pose && k.pose !== prevPose) {
      changes.push(k.frame);
      prevPose = k.pose;
    }
    if (k.frame <= f) st = { ...st, ...Object.fromEntries(Object.entries(k).filter(([key]) => key !== "frame" && key !== "x")) } as typeof st;
  }
  let x = p.x;
  {
    let curX = p.x;
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i];
      if (k.frame > f) break;
      if (k.x !== undefined) curX = k.x;
      const next = ks.slice(i + 1).find((n) => n.x !== undefined);
      if (k.pose === "walk" && next && next.frame > f) {
        x = interpolate(f, [k.frame, next.frame], [curX, next.x!]);
        break;
      }
      x = curX;
    }
  }
  // the pose shown: during the 3 anticipation frames the old pose squashes, then the new one takes over
  const nextChange = changes.find((c) => c > f && c - f <= SQUASH);
  const lastChange = [...changes].reverse().find((c) => c <= f) ?? -100;
  let pose = st.pose;
  if (pose === "walk") pose = WALK[Math.floor((f - lastChange) / WALK_HOLD) % 4];
  if (!P[pose]) pose = "idle";
  const info = P[pose];

  // voice: energy and phrase starts
  let energy = 0;
  for (let j = 0; j < 4; j++) energy += OPEN[cueAt(p.cues, (f - j) / fps)] ?? 0;
  energy /= 4;
  let nod = 0;
  for (let j = 0; j < 12; j++) {
    const t = f - j;
    if (cueAt(p.cues, t / fps) !== "X" && [1, 2, 3, 4, 5, 6, 7, 8].every((q) => cueAt(p.cues, (t - q) / fps) === "X")) {
      nod = Math.sin((Math.PI * j) / 12);
      break;
    }
  }

  // squash & stretch around a pose change (scale about the feet), breathing, sway, voice dip
  const walking = st.pose === "walk";
  let sy = 1, sx = 1;
  if (nextChange !== undefined) {
    const t = 1 - (nextChange - f) / SQUASH;
    sy = 1 - 0.035 * t;
    sx = 1 + 0.02 * t;
  } else {
    const d = f - lastChange;
    if (d >= 0 && d < 14) {
      const e = Math.exp(-d / 3.2) * Math.cos(d * 0.75);
      sy = 1 + 0.03 * e;
      sx = 1 - 0.018 * e;
    }
  }
  const breath = Math.sin((2 * Math.PI * f) / (fps * 3.4));
  if (!walking) {
    sy *= 1 + 0.007 * breath - 0.006 * energy;
    sx *= 1 - 0.003 * breath;
  }
  const sway = walking ? 0 : Math.sin((2 * Math.PI * f) / (fps * 6.5) + p.seed) * 0.6 + nod * 0.9;
  const bob = 0; // a walk's up/down is in the drawings themselves

  // face
  const [eyesSet, browSet, restMouth] = EXPR[st.expression] ?? EXPR.neutral;
  const blink = ["closed", "happy"].includes(eyesSet) ? null : blinkAt(f, fps, p.seed, changes.map((c) => c + 1));
  const eyes = blink ?? eyesSet;
  const mouthOf = (g: number) => {
    const c = cueAt(p.cues, g / fps);
    return c === "X" ? restMouth : RHUBARB[c] ?? restMouth;
  };
  const mouth = mouthOf(f);
  const mAge = mouth !== mouthOf(f - 1) ? 0 : mouth !== mouthOf(f - 2) ? 1 : 2;
  const S = p.face;
  // every sprite is a Remotion <Img>: each frame waits until its image has loaded, so a pose or mouth change can
  // never show the previous drawing for a few frames (SVG <image> isn't awaited, which caused exactly that)
  const part = (name: string, a: Anchor, by: "w" | "h", dx = 0, dy = 0, ky = 1, extra = 1) => {
    const sz = S.sizes[name];
    if (!sz) return null;
    // the neutral shape of each group is sized to the drawn mark; other shapes keep their size relative to it
    const refName = name.replace(/eyes_\w+?_(l|r)$/, "eyes_open_$1").replace(/brows_\w+?_(l|r)$/, "brows_normal_$1").replace(/mouth_\w+$/, "mouth_closed");
    const ref = S.sizes[refName] ?? sz;
    const kk = (by === "w" ? a.w : a.h) / Math.max(1, (by === "w" ? ref[0] : ref[1]) - 2 * S.pad);
    return (
      <Img
        key={name.split("/")[0] + name.slice(-2)}
        src={staticFile(`${S.dir}/${name}.png`)}
        style={{
          position: "absolute", left: a.p[0] + dx - sz[0] / 2, top: a.p[1] + dy - sz[1] / 2, width: sz[0], height: sz[1],
          transform: `scale(${kk * extra}, ${kk * ky * extra})`, transformOrigin: "50% 50%",
        }}
      />
    );
  };
  const F = info.face;
  let face: React.ReactNode = null;
  if (F) {
    const eyeH = (F.eye_l.h + F.eye_r.h) / 2;
    const lx = (st.look.x + glanceAt(f, fps, p.seed)) * eyeH * 0.35;
    const ly = st.look.y * eyeH * 0.25;
    const browUp = -(energy * 0.15 + nod * 0.3) * eyeH;
    face = (
      <>
        {part(`brows/brows_${browSet}_l`, F.brow_l, "w", lx * 0.3, ly * 0.3 + browUp)}
        {part(`brows/brows_${browSet}_r`, F.brow_r, "w", lx * 0.3, ly * 0.3 + browUp)}
        {part(`eyes/eyes_${eyes}_l`, F.eye_l, "h", lx, ly, blink ? 0.9 : 1)}
        {part(`eyes/eyes_${eyes}_r`, F.eye_r, "h", lx, ly, blink ? 0.9 : 1)}
        {part(`mouth/mouth_${mouth}`, F.mouth, "w", 0, 0, 1, [0.9, 0.96, 1][mAge])}
      </>
    );
  }

  const k = p.height / P.idle.h; // every pose is drawn at the same face size: one scale for all
  const flip = st.flip ? -1 : 1;
  const fid = `pose-${p.seed}`;
  const push = interpolate(f, [0, p.durationInFrames], [1, 1.04]);
  const src = staticFile(`${p.poses.dir}/${pose}${F ? "" : "_face"}.png`);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background ? "#000" : "transparent" }}>
      {p.background ? (
        <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 60%" }}>
          <Img src={staticFile(p.background)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      ) : null}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={Math.floor(f / 2)} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={p.look.boil * 2} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feFlood floodColor={p.look.tint} floodOpacity={p.look.tintAmount} result="t" />
            <feComposite in="t" in2="d" operator="in" result="tm" />
            <feBlend in="tm" in2="d" mode="multiply" />
          </filter>
          <radialGradient id={`${fid}-sh`}>
            <stop offset="0%" stopColor={p.look.shadow} stopOpacity={p.look.shadowOpacity} />
            <stop offset="100%" stopColor={p.look.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={x} cy={p.y} rx={p.height * 0.17 * sx} ry={p.height * 0.022} fill={`url(#${fid}-sh)`} />
      </svg>
      {/* ground point of the pose on (x, y); squash/stretch and sway about the feet; line boil + tint via the
          SVG filter above, applied to the HTML layer */}
      <AbsoluteFill style={{ filter: `url(#${fid})` }}>
        <div
          style={{
            position: "absolute", left: 0, top: 0, width: info.w, height: info.h, transformOrigin: "0 0",
            transform: `translate(${x}px, ${p.y + bob}px) rotate(${sway}deg) scale(${k * sx * flip}, ${k * sy}) translate(${-(info.anchor ?? info.ground)[0]}px, ${-(info.anchor ?? info.ground)[1]}px)`,
          }}
        >
          <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: info.w, height: info.h }} />
          {face}
        </div>
      </AbsoluteFill>
      {p.grain.length ? (
        <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: p.grainOpacity }}>
          <Img src={staticFile(p.grain[Math.floor(f / 2) % p.grain.length])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      ) : null}
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
    </AbsoluteFill>
  );
};
