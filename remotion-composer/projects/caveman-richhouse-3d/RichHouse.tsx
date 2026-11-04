// Caveman Economics Short "5 Things Missing From A Rich Man's House" (2026-11-04), ink-3D look of www-ink3d-004 with
// THE GUIDE (the channel's caveman host) drawn by toon.ts on a 2D card standing in the 3D world (ToonHost.tsx).
// Format (user's brief): two 3D dioramas, the FULL room (saturated amber, dark, crammed, logos everywhere) and the EMPTY
// room (ivory + black, one chair). Opening = split screen, no text. Countdown 5 -> 1: every step cuts across the divide
// and the empty room shows a dashed outline exactly where the missing thing would be (the thing itself never appears).
// The flip (beat 8): both rooms in one frame, pulling back until they are two small boxes in a black void. Close: the
// opening split again, but the full room goes dark and the empty one stays lit; "MUSEUM OF FEAR" + the 5 steps as a list.
// Everything is built in code (no free furniture kit reachable from the cloud); one scene graph, rendered by one canvas
// (full-frame / flip shots) or two half-width canvases (split shots), each with its own camera + ink pass.
// Timing: anchor words from props.words (whisper of the real voice, scenes/build.py); T_EST before the voice exists.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { ToonHost, HostKey } from "./ToonHost";
import { InkPass } from "./Ink";
import { Tex, V3, clamp01, ease, lerp, lerpV, toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920;
type Cue = { start: number; end: number; value: string };

// ------------------------------------------------------------------ timing
const ANCHORS: [string, string][] = [
  ["missing", "missing"], ["house", "house"], ["none", "none"], ["money", "money"], ["full", "full"], ["theirs", "theirs"], ["empty", "empty"],
  ["same", "same"], ["different", "different"], ["number", "number"], ["tv", "tv"], ["wall", "wall"], ["art", "art"], ["clutter", "clutter"],
  ["kitchen", "kitchen"], ["storage", "storage"], ["famine", "famine"], ["fridge", "fridge"], ["scarcity", "scarcity"], ["abundance", "abundance"],
  ["visible", "visible"], ["tells", "tells"], ["need", "need"], ["nobodys", "nobodys"], ["isnt", "isnt"], ["where", "where"], ["sits", "sits"],
  ["spent", "spent"], ["filling", "filling"], ["sell", "sell"], ["afternoon", "afternoon"], ["same2", "same"], ["cave", "cave"], ["cost", "cost"],
  ["which", "which"], ["museum", "museum"], ["fear", "fear"], ["pick", "pick"], ["below", "below"],
];
type Times = Record<string, number>;
// ~0.17 s + 0.045 s/letter per word, +0.32 s after "." / "?", +0.15 s after ",", x0.78 (skill recipe)
const T_EST: Times = {
  missing: 0.62, house: 1.98, none: 2.54, money: 3.53, full: 5.02, theirs: 5.55, empty: 6.09, same: 6.65, different: 7.55, number: 8.75,
  tv: 9.82, wall: 10.51, art: 11.22, clutter: 12.07, kitchen: 13.82, storage: 14.57, famine: 15.88, fridge: 17.72, scarcity: 18.82,
  abundance: 19.83, visible: 21.7, tells: 23.08, need: 24.84, nobodys: 25.99, isnt: 27.09, where: 28.33, sits: 29.18, spent: 30.1,
  filling: 30.72, sell: 32.06, afternoon: 32.94, same2: 33.64, cave: 34.99, cost: 36.63, which: 37.73, museum: 39.47, fear: 40.01,
  pick: 40.54, below: 41.12, end: 41.83,
};
type Word = { word: string; start: number; end: number };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function timesFrom(words?: Word[]): Times {
  if (!words || !words.length) return T_EST;
  const out: Times = {};
  let i = 0;
  for (const [name, w] of ANCHORS) {
    let j = i;
    while (j < words.length && norm(words[j].word) !== w) j++;
    if (j >= words.length) return T_EST; // transcript does not match the script: keep the estimate (build.py warns too)
    out[name] = words[j].start;
    i = j + 1;
  }
  out.end = words[words.length - 1].end;
  return out;
}
let T: Times = T_EST;

// ------------------------------------------------------------------ helpers
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const up = (t: number, a: number, d = 0.45) => ease((t - a) / d);
const pop = (t: number, a: number) => (t < a ? 0 : spring({ frame: Math.round((t - a) * 30), fps: 30, config: { damping: 10, stiffness: 200 } }));

// ------------------------------------------------------------------ the two rooms
// Same shell for both: floor 3.6 x 5 m, walls 3.4 m, open front (+z) and top, on a dark plinth (diorama in a void).
const RX = 5; // full room at x = -RX, empty room at x = +RX
const FX = -RX, EX = RX;
const RW = 1.8, RD = 2.5, RH = 3.4;
type RoomKind = "full" | "empty";
const PAL = {
  full: { wall: "#C77A2C", wall2: "#B86A22", floor: "#7A4A22", trim: "#5B3418" },
  empty: { wall: "#F1ECE2", wall2: "#E9E3D7", floor: "#E2D9C9", trim: "#1A181E" },
};
const VOID = "#0D0B11";

type BoxSpec = { p: V3; s: V3; c: string; e?: string; ei?: number; ry?: number; cyl?: boolean; logo?: boolean };
const Box: React.FC<BoxSpec & { k?: number; mats: Mats }> = ({ p, s, c, e, ei = 0, ry = 0, cyl, k = 1, mats }) => {
  if (k <= 0.001) return null;
  const m = mats.get(c, e, ei);
  return (
    <mesh position={[p[0], p[1] - s[1] / 2 * (1 - k), p[2]]} scale={[k, k, k]} rotation={[0, ry, 0]} material={m} castShadow receiveShadow>
      {cyl ? <cylinderGeometry args={[s[0] / 2, s[0] / 2, s[1], 20]} /> : <boxGeometry args={s} />}
    </mesh>
  );
};
// material cache per scene
class Mats {
  m = new Map<string, THREE.Material>();
  get(c: string, e?: string, ei = 0) {
    const key = `${c}|${e}|${ei}`;
    let v = this.m.get(key);
    if (!v) { v = toon({ color: new THREE.Color(c), emissive: new THREE.Color(e ?? "#000000"), emissiveIntensity: ei }); this.m.set(key, v); }
    return v;
  }
}

const Shell: React.FC<{ kind: RoomKind; mats: Mats; plinth: string; plinthGlow: number }> = ({ kind, mats, plinth, plinthGlow }) => {
  const c = PAL[kind];
  return (
    <group>
      <Box mats={mats} p={[0, -0.2, 0.1]} s={[2 * RW + 0.5, 0.36, 2 * RD + 0.5]} c={plinth} e={plinth} ei={plinthGlow} />
      <Box mats={mats} p={[0, -0.01, 0]} s={[2 * RW, 0.02, 2 * RD]} c={c.floor} />
      <Box mats={mats} p={[0, RH / 2, -RD - 0.06]} s={[2 * RW + 0.24, RH, 0.12]} c={c.wall} />
      <Box mats={mats} p={[-RW - 0.06, RH / 2, 0]} s={[0.12, RH, 2 * RD]} c={c.wall2} />
      <Box mats={mats} p={[RW + 0.06, RH / 2, 0]} s={[0.12, RH, 2 * RD]} c={c.wall2} />
      {/* skirting */}
      <Box mats={mats} p={[0, 0.06, -RD + 0.01]} s={[2 * RW, 0.12, 0.02]} c={c.trim} />
    </group>
  );
};

// ---- the full room: everything placed once, deterministic; `ord` = order it pops back in on "filling" (beat 8)
type Item = BoxSpec & { ord: number };
const FULL_ITEMS: Item[] = (() => {
  const r = rng(7), out: Item[] = [];
  let o = 0;
  const add = (b: BoxSpec) => out.push({ ...b, ord: o++ });
  const warm = ["#E8A23A", "#D9572E", "#F2C14E", "#B8462B", "#E07B39", "#7F4FA0", "#3F7CB0", "#E8E0C8", "#2F8F6F"];
  const pick = () => warm[Math.floor(r() * warm.length)];
  // TV wall: stand + TV + speakers + consoles
  add({ p: [-0.3, 0.24, -2.22], s: [1.9, 0.48, 0.5], c: "#5B3A1E" });
  add({ p: [-0.3, 1.78, -2.43], s: [1.5, 0.86, 0.07], c: "#1A1820" });
  add({ p: [-0.3, 1.78, -2.39], s: [1.38, 0.76, 0.01], c: "#3D7FD0", e: "#6FB4FF", ei: 1.4 });
  for (const x of [-1.15, 0.55]) add({ p: [x, 0.78, -2.2], s: [0.2, 0.6, 0.2], c: "#2A2630" });
  for (let i = 0; i < 5; i++) add({ p: [-0.9 + i * 0.32, 0.56, -2.15], s: [0.26, 0.08 + r() * 0.14, 0.3], c: pick(), logo: i % 2 === 0 });
  // shelves on the left wall, crammed
  add({ p: [-1.58, 1.4, -1.35], s: [0.42, 2.8, 2.1], c: "#6E4524" });
  for (let row = 0; row < 5; row++) {
    let z = -2.35;
    while (z < -0.4) {
      const w = 0.12 + r() * 0.3, h = 0.22 + r() * 0.3;
      add({ p: [-1.48, 0.14 + row * 0.55 + h / 2, z + w / 2], s: [0.34, h, w - 0.02], c: pick(), logo: r() < 0.25 });
      z += w;
    }
  }
  // sofa along the left wall, front part, facing +x
  add({ p: [-1.32, 0.22, 1.0], s: [0.9, 0.44, 2.0], c: "#D9A033" });
  add({ p: [-1.68, 0.66, 1.0], s: [0.22, 0.6, 2.0], c: "#C48E2A" });
  for (const z of [0.0, 2.0]) add({ p: [-1.32, 0.34, z], s: [0.9, 0.66, 0.2], c: "#C48E2A" });
  for (let i = 0; i < 4; i++) add({ p: [-1.38, 0.6, 0.35 + i * 0.45], s: [0.18, 0.34, 0.36], c: pick(), ry: (r() - 0.5) * 0.5, logo: i === 1 });
  // kitchen counter on the right wall + upper cabinets + clutter
  add({ p: [1.49, 0.45, 0.25], s: [0.62, 0.9, 2.3], c: "#8A5A2B" });
  add({ p: [1.47, 0.925, 0.25], s: [0.68, 0.05, 2.34], c: "#E0B070" });
  add({ p: [1.62, 2.15, 0.25], s: [0.36, 0.7, 2.3], c: "#9C6A35" });
  for (let i = 0; i < 18; i++) {
    const cyl = r() < 0.5, h = 0.12 + r() * 0.32, w = 0.1 + r() * 0.16;
    add({ p: [1.3 + r() * 0.32, 0.95 + h / 2, -0.8 + i * 0.12 + r() * 0.05], s: [w, h, w], c: pick(), cyl, logo: !cyl && r() < 0.5 });
  }
  add({ p: [1.42, 1.12, 1.15], s: [0.46, 0.34, 0.36], c: "#D8D2C4" }); // microwave
  // fridge, back-right corner, facing +z (door is separate: FullFridge)
  // floor clutter: boxes, bags, a lamp, a coffee table piled up
  add({ p: [0.25, 0.2, 0.9], s: [0.9, 0.4, 0.55], c: "#7B4A26" });
  for (let i = 0; i < 6; i++) add({ p: [-0.05 + r() * 0.6, 0.48 + (i % 3) * 0.14, 0.8 + r() * 0.25], s: [0.2 + r() * 0.15, 0.13, 0.2 + r() * 0.1], c: pick(), logo: i % 2 === 1 });
  for (let i = 0; i < 4; i++) add({ p: [0.6 + (i % 2) * 0.42, 0.25 + Math.floor(i / 2) * 0.46, 1.9], s: [0.4, 0.46, 0.4], c: "#B98B5A", logo: true });
  for (let i = 0; i < 3; i++) add({ p: [-0.55 + i * 0.32, 0.22, 1.95 + (i % 2) * 0.2], s: [0.3, 0.44, 0.14], c: pick(), logo: true });
  add({ p: [0.45, 0.75, -1.65], s: [0.06, 1.5, 0.06], c: "#2A2630", cyl: true });
  add({ p: [0.45, 1.55, -1.65], s: [0.36, 0.3, 0.36], c: "#FFD27A", e: "#FFB347", ei: 1.2, cyl: true });
  return out;
})();
// logo badges: a disc with a white mark on the front (+z) of every item flagged `logo` (generic marks, no real brand)
const LOGO_COLS = ["#E5342F", "#1A1820", "#2F6FD0", "#FFFFFF"];

const FullRoom: React.FC<{ t: number; mats: Mats; dark: number }> = ({ t, mats, dark }) => {
  const n = FULL_ITEMS.length;
  // beat 8, "You spent years filling a room": the room empties on the cut and the things pop back in, one after another
  const fillK = (ord: number) => {
    if (t < T.spent - 0.04) return 1;
    const at = T.spent + 0.1 + (ord / n) * Math.max(0.6, T.sell - T.spent - 0.4);
    return pop(t, at);
  };
  const logoPulse = t > T.tells - 0.1 && t < T.need ? 1 + 0.25 * Math.max(0, Math.sin((t - T.tells) * 12)) : 1;
  const tv = 1 - dark;
  return (
    <group>
      {FULL_ITEMS.map((b, i) => {
        const k = fillK(b.ord);
        const isScreen = b.ei && b.ei > 1 && b.c === "#3D7FD0";
        return (
          <React.Fragment key={i}>
            <Box mats={mats} {...b} ei={isScreen ? (b.ei ?? 0) * tv : b.ei} k={k} />
            {b.logo && k > 0.01 ? (
              <group position={[b.p[0], b.p[1] + 0.02, b.p[2] + (b.cyl ? b.s[0] / 2 : b.s[2] / 2) + 0.012]} scale={[k * logoPulse, k * logoPulse, k]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.get(LOGO_COLS[i % 3])}>
                  <cylinderGeometry args={[Math.min(b.s[0], b.s[1]) * 0.32, Math.min(b.s[0], b.s[1]) * 0.32, 0.012, 24]} />
                </mesh>
                <mesh position={[0, 0, 0.008]} rotation={[0, 0, 0.5]} material={mats.get(i % 3 === 2 ? "#1A1820" : "#FFFFFF")}>
                  <boxGeometry args={[Math.min(b.s[0], b.s[1]) * 0.38, Math.min(b.s[0], b.s[1]) * 0.1, 0.004]} />
                </mesh>
              </group>
            ) : null}
          </React.Fragment>
        );
      })}
      <Fridge t={t} mats={mats} kind="full" k={fillK(n)} />
      {/* rug */}
      <Box mats={mats} p={[0.1, 0.012, 0.6]} s={[2.0, 0.01, 1.6]} c="#A8402C" />
    </group>
  );
};

// fridge in the back-right corner, facing +z; door hinged on its left edge
const FR: V3 = [1.3, 0, -2.08];
function doorOpen(t: number, kind: RoomKind) {
  if (kind === "empty") return t > T.fridge - 0.3 && t < T.visible ? up(t, T.fridge - 0.25, 0.5) : 0;
  return t > T.scarcity - 0.3 && t < T.visible ? up(t, T.scarcity - 0.25, 0.4) : 0;
}
const Fridge: React.FC<{ t: number; mats: Mats; kind: RoomKind; k?: number }> = ({ t, mats, kind, k = 1 }) => {
  const full = kind === "full";
  const body = full ? "#E9E4D8" : "#ECE6DA", inner = "#FFFFFF";
  const open = doorOpen(t, kind);
  const r = useMemo(() => rng(23), []);
  const stuff = useMemo(() => {
    const out: BoxSpec[] = [];
    const cols = ["#E5342F", "#F2C14E", "#3F7CB0", "#2F8F6F", "#E07B39", "#E8E0C8", "#7F4FA0"];
    for (let s = 0; s < 4; s++) {
      let x = -0.3;
      while (x < 0.28) {
        const w = 0.08 + r() * 0.12, h = 0.12 + r() * 0.24;
        out.push({ p: [x + w / 2, 0.2 + s * 0.42 + h / 2, -0.05 + r() * 0.1], s: [w - 0.01, Math.min(h, 0.38), 0.18], c: cols[Math.floor(r() * cols.length)], cyl: r() < 0.4 });
        x += w;
      }
    }
    return out;
  }, [r]);
  if (k <= 0.001) return null;
  return (
    <group position={FR} scale={[k, k, k]}>
      {/* carcass: back + sides + top + bottom, open at the front */}
      <Box mats={mats} p={[0, 0.975, -0.33]} s={[0.76, 1.95, 0.04]} c={body} />
      {[-0.36, 0.36].map((x) => <Box key={x} mats={mats} p={[x, 0.975, 0]} s={[0.04, 1.95, 0.7]} c={body} />)}
      <Box mats={mats} p={[0, 1.93, 0]} s={[0.76, 0.04, 0.7]} c={body} />
      <Box mats={mats} p={[0, 0.02, 0]} s={[0.76, 0.04, 0.7]} c={body} />
      <Box mats={mats} p={[0, 0.975, -0.3]} s={[0.66, 1.85, 0.01]} c={inner} e="#FFF6E0" ei={open * 0.8} />
      {[0.38, 0.8, 1.22, 1.64].map((y) => <Box key={y} mats={mats} p={[0, y, 0]} s={[0.66, 0.02, 0.6]} c="#DCE6EC" />)}
      {full && open > 0 ? stuff.map((b, i) => <Box key={i} mats={mats} {...b} />) : null}
      {/* the door */}
      <group position={[-0.38, 0, 0.36]} rotation={[0, -open * 1.9, 0]}>
        <Box mats={mats} p={[0.38, 0.975, 0.03]} s={[0.76, 1.95, 0.06]} c={body} />
        <Box mats={mats} p={[0.68, 1.2, 0.08]} s={[0.04, 0.5, 0.04]} c={full ? "#8D949C" : "#1A181E"} />
        {full ? [0, 1, 2, 3, 4, 5].map((i) => <Box key={i} mats={mats} p={[0.2 + (i % 3) * 0.16, 1.45 - Math.floor(i / 3) * 0.2, 0.07]} s={[0.1, 0.1, 0.02]}
          c={["#E5342F", "#F2C14E", "#3F7CB0"][i % 3]} />) : null}
      </group>
    </group>
  );
};

// ---- the empty room: one black chair, a sleek empty counter, a flush ivory fridge, a tall window
const CHAIR: V3 = [0, 0, -0.35];
const EmptyRoom: React.FC<{ t: number; mats: Mats; liftY: number }> = ({ t, mats }) => {
  const ink = "#17151B";
  return (
    <group>
      {/* lounge chair */}
      <group position={CHAIR}>
        <Box mats={mats} p={[0, 0.42, 0]} s={[0.74, 0.12, 0.66]} c={ink} />
        <Box mats={mats} p={[0, 0.8, -0.3]} s={[0.74, 0.66, 0.1]} c={ink} />
        {[[-0.32, -0.26], [0.32, -0.26], [-0.32, 0.26], [0.32, 0.26]].map(([x, z], i) => <Box key={i} mats={mats} p={[x, 0.18, z]} s={[0.04, 0.36, 0.04]} c={ink} />)}
      </group>
      {/* counter, nothing on it */}
      <Box mats={mats} p={[1.49, 0.45, 0.25]} s={[0.62, 0.9, 2.3]} c={ink} />
      <Box mats={mats} p={[1.47, 0.925, 0.25]} s={[0.68, 0.05, 2.34]} c="#F7F3EA" />
      <Fridge t={t} mats={mats} kind="empty" />
      {/* tall window on the left wall */}
      <Box mats={mats} p={[-1.73, 1.65, -0.9]} s={[0.02, 2.4, 1.5]} c="#FFFBEF" e="#FFF6DD" ei={0.9} />
      {[-1.65, -0.15].map((z) => <Box key={z} mats={mats} p={[-1.72, 1.65, z]} s={[0.04, 2.44, 0.04]} c={ink} />)}
      {[0.45, 2.85].map((y) => <Box key={y} mats={mats} p={[-1.72, y, -0.9]} s={[0.04, 0.04, 1.54]} c={ink} />)}
    </group>
  );
};

// ---- dashed outline of the thing that is NOT there; points in a vertical plane (u right, v up) at `o`, turned by `yaw`
type P2 = [number, number];
const rectPts = (w: number, h: number): P2[] => [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]];
const circPts = (r: number, cy: number, n = 28): P2[] => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * 6.283) * r, cy + Math.sin((i / n) * 6.283) * r]);
const Dash: React.FC<{ pts: P2[]; o: V3; yaw?: number; k: number; mats: Mats; th?: number; dl?: number; gap?: number; col?: string }> = ({ pts, o, yaw = 0, k, mats, th = 0.03, dl = 0.11, gap = 0.07, col = "#141216" }) => {
  if (k <= 0.001) return null;
  const seg: [P2, P2, number][] = [];
  let L = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l]); L += l; }
  const at = (s: number): P2 => {
    for (const [a, b, l] of seg) { if (s <= l) return [a[0] + (b[0] - a[0]) * (s / l), a[1] + (b[1] - a[1]) * (s / l)]; s -= l; }
    return pts[0];
  };
  const dashes: React.ReactNode[] = [];
  const m = mats.get(col);
  for (let s = 0, i = 0; s < L * k; s += dl + gap, i++) {
    const a = at(s), b = at(Math.min(s + dl, L * k));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 0.005) continue;
    dashes.push(
      <mesh key={i} material={m} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]} rotation={[0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])]}>
        <boxGeometry args={[len, th, 0.012]} />
      </mesh>,
    );
  }
  return <group position={o} rotation={[0, yaw, 0]}>{dashes}</group>;
};
// a seated person, front view (beat 7 "Nobody's home")
const SEATED: P2[] = [[-0.2, 1.08], [-0.25, 0.6], [-0.22, 0.5], [-0.19, 0.04], [-0.05, 0.04], [-0.05, 0.44], [0.05, 0.44], [0.05, 0.04], [0.19, 0.04], [0.22, 0.5], [0.25, 0.6], [0.2, 1.08], [0.08, 1.12], [-0.08, 1.12]];

const Outlines: React.FC<{ t: number; mats: Mats }> = ({ t, mats }) => {
  const draw = (a: number, d = 0.6) => up(t, a, d);
  const tvK = t > T.number - 0.1 && t < T.clutter ? draw(T.tv - 0.05) : 0;
  const clutK = t > T.clutter - 0.1 && t < T.fridge ? draw(T.clutter - 0.05, 0.7) : 0;
  const frK = t > T.fridge - 0.1 && t < T.visible ? draw(T.fridge + 0.25, 0.6) : 0;
  const logoK = t > T.visible - 0.1 && t < T.nobodys ? draw(T.visible - 0.02, 0.5) : 0;
  const seatK = t > T.nobodys - 0.1 && t < T.spent ? draw(T.nobodys - 0.02, 0.7) : 0;
  return (
    <group>
      {/* 5: the TV and its stand on the bare wall */}
      <Dash mats={mats} k={tvK} o={[-0.3, 1.35, -2.42]} pts={rectPts(1.5, 0.86)} />
      <Dash mats={mats} k={tvK} o={[-0.3, 0.0, -2.42]} pts={rectPts(1.9, 0.48)} />
      {/* 4: clutter on the counter (jars, boxes, a microwave) */}
      {[[-0.75, 0.14, 0.3], [-0.45, 0.2, 0.42], [-0.1, 0.16, 0.24], [0.25, 0.22, 0.3], [0.62, 0.16, 0.2], [1.12, 0.46, 0.34]].map(([z, w, h], i) => (
        <Dash key={i} mats={mats} k={clamp01(clutK * 1.6 - i * 0.12)} o={[1.42, 0.955, z]} yaw={-0.9} pts={rectPts(w, h)} th={0.022} dl={0.06} gap={0.045} />
      ))}
      {/* 3: what isn't in the fridge */}
      {[[-0.18, 0.4, 0.12, 0.26], [0.1, 0.4, 0.16, 0.2], [-0.12, 0.82, 0.2, 0.3], [0.16, 0.82, 0.1, 0.24], [0.0, 1.24, 0.3, 0.16]].map(([x, y, w, h], i) => (
        <Dash key={i} mats={mats} k={clamp01(frK * 1.5 - i * 0.1)} o={[FR[0] + x, y, FR[2] + 0.05]} pts={rectPts(w, h)} th={0.018} dl={0.05} gap={0.035} />
      ))}
      {/* 2: logos that aren't on the chair or the wall */}
      <Dash mats={mats} k={logoK} o={[CHAIR[0], 0, CHAIR[2] - 0.24]} pts={circPts(0.13, 0.82)} th={0.024} dl={0.06} gap={0.04} col="#F1ECE2" />
      <Dash mats={mats} k={logoK} o={[-0.6, 0, -2.42]} pts={circPts(0.32, 2.1)} />
      <Dash mats={mats} k={logoK} o={[1.3, 0, -1.72]} pts={circPts(0.12, 1.5)} th={0.022} dl={0.06} gap={0.04} />
      {/* 1: nobody in the chair */}
      <Dash mats={mats} k={seatK} o={[CHAIR[0], 0, CHAIR[2] + 0.36]} pts={SEATED} dl={0.08} gap={0.05} col="#D08A2E" th={0.04} />
      <Dash mats={mats} k={seatK} o={[CHAIR[0], 0, CHAIR[2] + 0.36]} pts={circPts(0.15, 1.3, 40)} dl={0.06} gap={0.04} col="#D08A2E" th={0.04} />
    </group>
  );
};

// ------------------------------------------------------------------ shots
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type View = { a: Cam; b: Cam; room: RoomKind | "both" };
type Shot = { t: number; split?: [View, View]; one?: View; k?: (x: number) => number; host?: V3; note: string };
const snap = (x: number) => ease(clamp01((x - 0.1) / 0.16));
const at = (room: RoomKind, c: Cam): Cam => { const ox = room === "full" ? FX : EX; return { ...c, pos: [c.pos[0] + ox, c.pos[1], c.pos[2]], look: [c.look[0] + ox, c.look[1], c.look[2]] }; };
const V = (room: RoomKind, a: Cam, b: Cam): View => ({ a: at(room, a), b: at(room, b), room });
const SPLIT_A: Cam = { pos: [0, 6.6, 13.8], look: [0, 2.3, -0.4], fov: 56 };
const SPLIT_B: Cam = { pos: [0, 6.1, 12.6], look: [0, 2.3, -0.4], fov: 56 };
const split = (): [View, View] => [V("full", SPLIT_A, SPLIT_B), V("empty", SPLIT_A, SPLIT_B)];
const HOST_SPLIT: V3 = [0.95, 0, 1.0];
function buildShots(): Shot[] {
  return [
    { t: 0, split: split(), note: "hook: full room | empty room, no text" },
    { t: T.full - 0.04, split: split(), host: HOST_SPLIT, note: "setup: the guide stands in the empty room" },
    { t: T.number - 0.04, one: V("full", { pos: [0.1, 1.7, 2.6], look: [-0.3, 1.6, -2.5], fov: 52 }, { pos: [-0.1, 1.75, 1.9], look: [-0.3, 1.7, -2.5], fov: 50 }), note: "5: the TV blaring" },
    { t: T.wall - 0.04, one: V("empty", { pos: [0.3, 1.6, 3.0], look: [-0.2, 1.4, -2.5], fov: 52 }, { pos: [0.1, 1.6, 2.4], look: [-0.25, 1.45, -2.5], fov: 52 }), host: [0.95, 0, -1.3], note: "5: the bare wall, dashed TV" },
    { t: T.clutter - 0.04, one: V("empty", { pos: [-0.7, 1.75, 2.4], look: [1.4, 1.0, -0.2], fov: 50 }, { pos: [-0.5, 1.6, 1.9], look: [1.4, 1.0, -0.2], fov: 50 }), host: [0.65, 0, -1.3], note: "4: the empty counter, dashed clutter" },
    { t: T.kitchen - 0.04, one: V("full", { pos: [-0.5, 0.75, 2.4], look: [1.3, 1.35, -0.4], fov: 54, roll: 5 }, { pos: [-0.3, 0.8, 1.8], look: [1.3, 1.35, -0.4], fov: 54, roll: 7 }), note: "4: the crammed kitchen, low dutch angle (pattern interrupt)" },
    { t: T.fridge - 0.04, one: V("empty", { pos: [0.1, 1.45, 0.9], look: [1.3, 1.05, -2.1], fov: 50 }, { pos: [0.3, 1.4, 0.4], look: [1.3, 1.05, -2.1], fov: 50 }), note: "3: the empty fridge opens" },
    { t: T.scarcity - 0.04, one: V("full", { pos: [0.2, 1.4, 0.6], look: [1.3, 1.0, -2.1], fov: 48 }, { pos: [0.4, 1.35, 0.1], look: [1.3, 1.0, -2.1], fov: 46 }), note: "3: the stuffed fridge" },
    { t: T.abundance - 0.04, one: V("empty", { pos: [-0.2, 1.5, 1.6], look: [0.8, 1.0, -1.6], fov: 50 }, { pos: [-0.1, 1.45, 1.2], look: [0.8, 1.0, -1.6], fov: 50 }), host: [0.25, 0, -1.25], note: "3: abundance, arms crossed" },
    { t: T.visible - 0.04, k: snap, one: V("empty", { pos: [0.6, 1.6, 4.4], look: [0, 0.9, -0.6], fov: 52 }, { pos: [0.6, 1.6, 4.4], look: [0, 0.85, -0.6], fov: 24 }), host: [0.95, 0, 0.2], note: "2: snap zoom on the chair, dashed logos" },
    { t: T.tells - 0.04, one: V("full", { pos: [0.4, 1.3, 3.6], look: [-0.4, 0.8, 0.2], fov: 54 }, { pos: [0.2, 1.25, 3.0], look: [-0.4, 0.8, 0.2], fov: 54 }), note: "2: logos everywhere, pulsing" },
    { t: T.need - 0.04, one: V("empty", { pos: [0.3, 1.5, 3.4], look: [0.3, 1.0, -0.3], fov: 52 }, { pos: [0.3, 1.5, 3.0], look: [0.3, 1.0, -0.3], fov: 52 }), host: [0.85, 0, 0.3], note: "2: they don't need to tell" },
    { t: T.nobodys - 0.04, one: V("empty", { pos: [0, 1.15, 2.9], look: [0, 0.8, -0.4], fov: 46 }, { pos: [0, 1.1, 2.3], look: [0, 0.8, -0.4], fov: 46 }), note: "1: nobody's home, dashed sitter" },
    { t: T.isnt - 0.04, one: V("empty", { pos: [0, 2.0, 4.2], look: [0, 1.1, -0.6], fov: 52 }, { pos: [0, 6.5, 13.5], look: [0, 1.0, -0.4], fov: 52 }), note: "1: pull back, the plinth turns to gold on 'money sits'" },
    { t: T.spent - 0.04, one: { a: { pos: [0, 6.5, 26], look: [0, 1.4, 0], fov: 50 }, b: { pos: [0, 15, 72], look: [0, 1.0, 0], fov: 50 }, room: "both" }, note: "flip: both rooms, pull back into the void" },
    { t: T.cave - 0.04, split: split(), host: HOST_SPLIT, note: "close: full room dark, empty room lit" },
  ];
}
let SHOTS: Shot[] = buildShots();
type Live = { pos: V3; look: V3; fov: number; roll: number; room: RoomKind | "both" };
function shotAt(t: number) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : T.end + 0.6;
  const x = clamp01((t - s.t) / (t1 - s.t));
  const k = s.k ? s.k(x) : s.t === T.spent - 0.04 ? ease(x) : ease(x) * 0.5 + x * 0.5;
  const live = (v: View): Live => {
    const c = { pos: lerpV(v.a.pos, v.b.pos, k), look: lerpV(v.a.look, v.b.look, k), fov: lerp(v.a.fov, v.b.fov, k), roll: lerp(v.a.roll ?? 0, v.b.roll ?? 0, k), room: v.room };
    c.pos = [c.pos[0] + Math.sin(t * 0.7) * 0.015, c.pos[1] + Math.sin(t * 0.9 + 1) * 0.012, c.pos[2]];
    return c;
  };
  return { i, shot: s, views: s.split ? s.split.map(live) : [live(s.one!)] };
}

// ------------------------------------------------------------------ the guide
const HOST_KEYS = (): HostKey[] => [
  { t: 0, gesture: "idle", expr: "neutral" },
  { t: T.theirs - 0.08, gesture: "present", expr: "smile" }, // "theirs is empty"
  { t: T.same - 0.08, gesture: "shrug", expr: "neutral" }, // "same species"
  { t: T.different - 0.08, gesture: "think", expr: "stern" }, // "different wiring"
  { t: T.wall - 0.08, gesture: "present", expr: "smile_closed" }, // "the wall is the art"
  { t: T.clutter - 0.08, gesture: "hips", expr: "neutral" }, // "no clutter on the counters"
  { t: T.fridge - 0.08, gesture: "present", expr: "whistle" }, // "the fridge is empty"
  { t: T.abundance - 0.08, gesture: "cross", expr: "smile" }, // "abundance doesn't have to"
  { t: T.visible - 0.08, gesture: "point_up", expr: "neutral" }, // "no visible logos"
  { t: T.need - 0.08, gesture: "cross", expr: "smile_closed" }, // "they don't need to tell"
  { t: T.cave - 0.08, gesture: "arms_up", expr: "grin" }, // "in my cave, nothing"
  { t: T.cost - 0.08, gesture: "shrug", expr: "smile" }, // "nothing cost me nothing"
  { t: T.which - 0.08, gesture: "point_up", expr: "stern" }, // "which room ... museum of fear?"
  { t: T.pick - 0.08, gesture: "present", expr: "grin" }, // "pick yours below"
];

// ------------------------------------------------------------------ scene
function useTextures() {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    L.load(staticFile("tex/glow.png"), (g) => { g.colorSpace = THREE.SRGBColorSpace; setTex({ glow: g }); });
  }, []);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}

const CamSet: React.FC<{ c: Live; aspect: number }> = ({ c, aspect }) => {
  const { camera } = useThree();
  const p = camera as THREE.PerspectiveCamera;
  p.position.set(...c.pos); p.fov = c.fov; p.near = 0.05; p.far = 600; p.aspect = aspect;
  p.updateProjectionMatrix(); p.lookAt(...c.look); p.rotateZ(THREE.MathUtils.degToRad(c.roll)); p.updateMatrixWorld();
  return null;
};

const SpotAt: React.FC<{ pos: V3; target: V3; color: string; intensity: number; angle: number; shadow?: boolean }> = ({ pos, target, color, intensity, angle, shadow }) => {
  const tg = useMemo(() => new THREE.Object3D(), []);
  tg.position.set(...target);
  return (
    <>
      <primitive object={tg} />
      <spotLight position={pos} target={tg} color={color} intensity={intensity} angle={angle} penumbra={0.6} decay={0} castShadow={shadow}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
    </>
  );
};

function gradeFor(t: number, v: Live) {
  let warm = 0, cold = 0, night = 0;
  if (v.room === "full") {
    warm = 0.45;
    if (t > T.famine - 0.05 && t < T.fridge) { cold = 0.75 * up(t, T.famine - 0.05, 0.5); warm = 0.45 * (1 - cold); night = 0.25 * cold; }
    if (t > T.cave - 0.05) { night = 0.85 * up(t, T.cave - 0.05, 0.5); warm = 0.1; }
  } else if (v.room === "empty") {
    cold = 0.12;
    if (t > T.where - 0.05 && t < T.spent) warm = 0.5 * up(t, T.where - 0.05, 0.5);
  } else {
    night = 0.15;
  }
  return { warm, cold, night };
}

const Scene: React.FC<{ t: number; v: Live; aspect: number; host?: V3; keys: HostKey[] }> = ({ t, v, aspect, host, keys }) => {
  const mats = useMemo(() => new Mats(), []);
  const showFull = v.room !== "empty", showEmpty = v.room !== "full";
  const dark = t > T.cave - 0.05 ? up(t, T.cave - 0.05, 0.5) : 0; // close: the full room goes dark
  const g = gradeFor(t, v);
  const focus = new THREE.Vector3(...v.pos).distanceTo(new THREE.Vector3(...v.look));
  // beat 7: the plinth of the empty room turns to gold on "where the money sits"
  const gold = t > T.where - 0.05 && t < T.spent ? up(t, T.where - 0.05, 0.5) : 0;
  // beat 8: "they sell it in an afternoon": the empty room hops (lifted out like an asset); "same room": both plinths flare
  const hop = t > T.sell - 0.05 && t < T.sell + 0.9 ? Math.sin(clamp01((t - T.sell + 0.05) / 0.9) * Math.PI) * 0.9 : 0;
  const same = t > T.same2 - 0.05 && t < T.cave ? 1 - up(t, T.same2 + 0.4, 0.6) : 0;
  const plinth = (base: string) => new THREE.Color(base).lerp(new THREE.Color("#D9A033"), gold).getStyle();
  const sun: V3 = [-3, 7, 8];
  return (
    <>
      <CamSet c={v} aspect={aspect} />
      <color attach="background" args={[VOID]} />
      <hemisphereLight args={[new THREE.Color("#FFF2E2"), new THREE.Color("#2A2230"), 0.55]} />
      {showFull ? (
        <group position={[FX, 0, 0]}>
          <Shell kind="full" mats={mats} plinth="#24202A" plinthGlow={same * 0.8} />
          <FullRoom t={t} mats={mats} dark={dark} />
          <pointLight position={[0.2, 2.7, 0.6]} color="#FFA246" intensity={22 * (1 - dark * 0.97)} distance={8} decay={1.4} />
          <pointLight position={[-0.3, 1.7, -1.4]} color="#7FB2FF" intensity={7 * (1 - dark)} distance={4} decay={1.5} />
          <SpotAt pos={[-2.5, 7.5, 7]} target={[0, 0.8, -0.6]} color="#FFC07A" intensity={1.7 * (1 - dark * 0.9)} angle={0.42} shadow />
        </group>
      ) : null}
      {showEmpty ? (
        <group position={[EX, hop, 0]}>
          <Shell kind="empty" mats={mats} plinth={plinth("#24202A")} plinthGlow={gold * 0.6 + same * 0.8} />
          <EmptyRoom t={t} mats={mats} liftY={hop} />
          <Outlines t={t} mats={mats} />
          <SpotAt pos={[-3, 7, 8]} target={[0, 0.8, -0.6]} color="#FFFFFF" intensity={2.6} angle={0.42} shadow />
          <pointLight position={[-1.2, 2.0, -0.9]} color="#FFF8EA" intensity={5} distance={5} decay={1.5} />
        </group>
      ) : null}
      {showEmpty && host ? <ToonHost keys={keys} t={t} pos={[EX + host[0], host[1] + hop, host[2]]} camPos={v.pos} camLook={v.look} sun={sun} tint="#FFFFFF" seed={11} /> : null}
      <InkPass p={{ focus, blur: v.room === "both" ? 0 : 5, night: g.night, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: g.cold, warm: g.warm }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#1B1622";
const Karaoke: React.FC<{ c: Captions; y: number }> = ({ c, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ch = c.chunks.find((k) => f >= k.f0 && f < k.f1);
  if (!ch) return null;
  const pp = spring({ frame: f - ch.f0, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(-50%) scale(${0.88 + 0.12 * pp})`, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: c.maxWidth, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: c.size * 0.4, fontFamily: anton, fontSize: c.size, lineHeight: 1.05, letterSpacing: 1 }}>
        {ch.words.map((w, i) => {
          const live = f >= w.f0 && f < Math.max(w.f1, w.f0 + 4);
          const lift = live ? spring({ frame: f - w.f0, fps, config: { damping: 10, stiffness: 300 } }) : 0;
          return (
            <span key={i} style={{
              display: "inline-block", color: w.k ? "#D08A2E" : "#FFF8EC", opacity: live || f >= w.f1 ? 1 : 0.8,
              transform: `translateY(${-lift * c.size * 0.05}px) scale(${1 + lift * 0.06})`, transformOrigin: "50% 100%",
              WebkitTextStroke: `${c.size * 0.12}px ${INK}`, paintOrder: "stroke fill", textShadow: `0 ${c.size * 0.06}px ${c.size * 0.1}px rgba(10,8,14,0.5)`,
            }}>{w.t}</span>
          );
        })}
      </div>
    </div>
  );
};
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number };
export type RichProps = { durationInFrames: number; audio?: string; cues?: Cue[]; captions?: Captions; words?: Word[] };

// the countdown number: big, top-left, same spot all the way, no animation (user's brief)
const Countdown: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.number - 0.04 || t >= T.spent - 0.04) return null;
  const n = t < T.clutter - 0.04 ? 5 : t < T.fridge - 0.04 ? 4 : t < T.visible - 0.04 ? 3 : t < T.nobodys - 0.04 ? 2 : 1;
  return (
    <div style={{ position: "absolute", left: 64, top: 70, fontFamily: anton, fontSize: 300, lineHeight: 1, color: "#FFF8EC",
      WebkitTextStroke: `22px ${INK}`, paintOrder: "stroke fill" }}>{n}</div>
  );
};
const LIST = ["NO TV", "NO CLUTTER", "EMPTY FRIDGE", "NO LOGOS", "NOBODY HOME"];
const Close: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.museum - 0.06) return null;
  const s = pop(t, T.museum - 0.06);
  return (
    <>
      <div style={{ position: "absolute", left: 0, width: W, top: 150, textAlign: "center", transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.5) }}>
        <span style={{ fontFamily: anton, fontSize: 130, letterSpacing: 4, color: "#FFF8EC", WebkitTextStroke: `20px ${INK}`, paintOrder: "stroke fill" }}>MUSEUM OF FEAR.</span>
      </div>
      {t > T.pick - 0.1 ? (
        <div style={{ position: "absolute", left: 120, top: 330 }}>
          {LIST.map((l, i) => {
            const k = pop(t, T.pick - 0.1 + i * 0.09);
            return (
              <div key={l} style={{ fontFamily: anton, fontSize: 66, lineHeight: 1.12, letterSpacing: 3, color: "#FFF8EC", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill",
                transform: `translateX(${(1 - k) * -60}px)`, opacity: k }}>
                <span style={{ color: "#D08A2E" }}>{5 - i}</span>&nbsp;&nbsp;{l}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};

// ------------------------------------------------------------------ composition
export const RichHouse: React.FC<RichProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const keys = useMemo(() => { T = timesFrom(P.words); SHOTS = buildShots(); return HOST_KEYS(); }, [P.words]);
  const tex = useTextures();
  const s = shotAt(t);
  const host = s.shot.host;
  const isSplit = s.views.length === 2;
  // the hook stays text-free: no captions before "full" (beat 2)
  const capsOn = t >= T.full - 0.1;
  return (
    <AbsoluteFill style={{ backgroundColor: VOID }}>
      {tex ? (isSplit ? (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: W / 2, height: H }}>
            <ThreeCanvas width={W / 2} height={H} shadows camera={{ fov: 50, near: 0.05, far: 600 }} gl={{ antialias: false }}>
              <Scene t={t} v={s.views[0]} aspect={W / 2 / H} keys={keys} />
            </ThreeCanvas>
          </div>
          <div style={{ position: "absolute", left: W / 2, top: 0, width: W / 2, height: H }}>
            <ThreeCanvas width={W / 2} height={H} shadows camera={{ fov: 50, near: 0.05, far: 600 }} gl={{ antialias: false }}>
              <Scene t={t} v={s.views[1]} aspect={W / 2 / H} host={host} keys={keys} />
            </ThreeCanvas>
          </div>
          <div style={{ position: "absolute", left: W / 2 - 5, top: 0, width: 10, height: H, background: "#F1ECE2" }} />
        </>
      ) : (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 50, near: 0.05, far: 600 }} gl={{ antialias: false }}>
          <Scene t={t} v={s.views[0]} aspect={W / H} host={s.views[0].room === "empty" ? host : undefined} keys={keys} />
        </ThreeCanvas>
      )) : null}
      <Countdown t={t} />
      <Close t={t} />
      {P.captions && capsOn ? <Karaoke c={P.captions} y={1660} /> : null}
      {P.audio ? <Audio src={staticFile(P.audio)} /> : null}
    </AbsoluteFill>
  );
};
