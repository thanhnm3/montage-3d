// Smooth secondary motion for the 2D beast cards (2026-11-05, user: "làm cho chuyển động thật mượt mà"). The card plane
// is subdivided and bent in the vertex shader, so every drawing gets it without touching the 89 draw functions:
//   walk    — breathing swell of the torso, a travelling wave down the tail, a slow head / neck sway, a soft body bob
//   swim    — a body wave that grows toward the tail (fish / whale / reptile undulation), slight pitch
//   fly     — a hovering bob + pitch with the wingbeat, tail flutter
//   serpent — a large wave running along the whole body (snakes, sea serpents)
// The shadow (customDepthMaterial) bends the same way. All of it is a pure function of time (deterministic frames).
// Plus `ramp` / `keys` helpers so poses blend in and out (attack and release eased) instead of switching.
import * as THREE from "three";

export type MotionKind = "walk" | "swim" | "fly" | "serpent" | "none";
const SWIM = new Set(["meg", "mosa", "dunkle", "elasmo", "liopleuro", "anomalo", "helico", "ichthy", "basilo", "livyatan", "archelon", "eurypterid", "krono", "xipho", "nessie", "kraken", "shoni", "leeds", "oncho", "coela", "camero", "ammonite", "opabinia", "tully"]);
const FLY = new Set(["pteranodon", "quetzfly", "micro", "haast", "meganeura", "dragonfly", "argentavis", "pelagornis", "phoenix", "thunderbird", "roc", "mothman", "lung"]);
const SERPENT = new Set(["boa", "basilisk", "leviathan", "arthro", "halluci", "jormun"]);
export const motionKindOf = (name: string): MotionKind => (SWIM.has(name) ? "swim" : FLY.has(name) ? "fly" : SERPENT.has(name) ? "serpent" : "walk");
export function registerMotion(name: string, kind: MotionKind) { (kind === "swim" ? SWIM : kind === "fly" ? FLY : kind === "serpent" ? SERPENT : null)?.add(name); }

export type MotionUniforms = { uT: { value: number }; uAmp: { value: number }; uKind: { value: number }; uX0: { value: number }; uX1: { value: number }; uY0: { value: number }; uH: { value: number }; uExcite: { value: number } };
export const motionUniforms = (kind: MotionKind, x0: number, x1: number, y0: number, h: number): MotionUniforms => ({
  uT: { value: 0 }, uAmp: { value: kind === "none" ? 0 : 1 }, uKind: { value: ["walk", "swim", "fly", "serpent", "none"].indexOf(kind) }, uX0: { value: x0 }, uX1: { value: x1 }, uY0: { value: y0 }, uH: { value: h }, uExcite: { value: 0 },
});
const VERT = /* glsl */ `
  float mu = clamp((position.x - uX0) / max(1e-4, uX1 - uX0), 0.0, 1.0);   // 0 = tail end, 1 = snout (drawings face +x)
  float mv = clamp((position.y - uY0) / max(1e-4, uH), 0.0, 1.0);          // 0 = ground / belly line, 1 = top
  float TAU = 6.2831853;
  float calm = 1.0 - 0.6 * uExcite;                                         // less idle sway while attacking
  if (uKind < 0.5) {                                                         // walk
    float torso = smoothstep(0.22, 0.42, mu) * (1.0 - smoothstep(0.62, 0.8, mu));
    transformed.y += uAmp * uH * 0.014 * sin(TAU * uT / 3.1) * torso * mv;                       // breathing
    float tail = pow(max(0.0, 1.0 - mu / 0.38), 1.7);
    transformed.y += uAmp * calm * uH * 0.05 * sin(TAU * uT * 0.42 - mu * 9.0) * tail;           // tail wave
    transformed.x += uAmp * calm * uH * 0.012 * sin(TAU * uT * 0.42 - mu * 9.0 + 1.2) * tail;
    float head = smoothstep(0.7, 1.0, mu);
    transformed.y += uAmp * calm * uH * 0.018 * sin(TAU * uT * 0.31 + 1.3) * head * mv;          // head / neck sway
    transformed.x += uAmp * calm * uH * 0.008 * sin(TAU * uT * 0.23 + 0.4) * head;
  } else if (uKind < 1.5) {                                                  // swim
    float g = pow(1.0 - mu, 1.3);
    transformed.y += uAmp * uH * 0.06 * sin(TAU * uT * 0.55 - mu * 6.5) * (0.25 + g);
    transformed.y += uAmp * uH * 0.02 * sin(TAU * uT * 0.18) * (mu - 0.5);                      // slow pitch
  } else if (uKind < 2.5) {                                                  // fly
    transformed.y += uAmp * uH * 0.035 * sin(TAU * uT * 0.5);
    transformed.y += uAmp * uH * 0.02 * sin(TAU * uT * 0.5 + 1.0) * (mu - 0.5);
    transformed.y += uAmp * uH * 0.03 * sin(TAU * uT * 1.1 - mu * 7.0) * pow(max(0.0, 1.0 - mu / 0.3), 1.5);
  } else if (uKind < 3.5) {                                                  // serpent
    transformed.y += uAmp * calm * uH * 0.05 * sin(TAU * uT * 0.35 - mu * 11.0) * (1.0 - mv * 0.5);
    transformed.x += uAmp * calm * uH * 0.015 * sin(TAU * uT * 0.35 - mu * 11.0 + 1.5);
  }`;
const DECL = "uniform float uT; uniform float uAmp; uniform float uKind; uniform float uX0; uniform float uX1; uniform float uY0; uniform float uH; uniform float uExcite;\n";
/** bend this material's vertices with the card motion (works for MeshBasicMaterial and MeshDepthMaterial) */
export function withMotion<M extends THREE.Material>(m: M, U: MotionUniforms, key: string): M {
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\n" + DECL).replace("#include <begin_vertex>", "#include <begin_vertex>\n" + VERT);
  };
  m.customProgramCacheKey = () => "cardMotion|" + key;
  return m;
}

// ------------------------------------------------------------------ pose timing helpers (pure functions of t)
const sm = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
/** 0 before `a`, eases up over `attack`, holds, eases down over `release` ending at `b` */
export const ramp = (t: number, a: number, b: number, attack = 0.25, release = 0.35) => Math.min(sm((t - a) / attack), 1 - sm((t - (b - release)) / release));
/** smooth piecewise curve through [time, value] keys (eased between keys) */
export function keys(t: number, k: [number, number][]) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i + 1 < k.length; i++) if (t < k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * sm((t - k[i][0]) / (k[i + 1][0] - k[i][0]));
  return k[k.length - 1][1];
}
/** gait phase that keeps running smoothly while the walk weight fades in and out (no snapping of the legs) */
export const gait = (t: number, speed: number, walk: number) => ({ phase: t * speed, walk });
