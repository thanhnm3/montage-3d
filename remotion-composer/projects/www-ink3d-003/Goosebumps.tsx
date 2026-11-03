// Why Why Why — ink-3D 003 (r02: the 2D host replaced by a free CC0 3D person with a drawn live face, Person.tsx) "Why do we get goosebumps?" (2026-11-03). Myth explainer in the 002 look, rebuilt with the
// lessons from the "trapped samurai" reference: every shot shows the literal action of its line (shot list below,
// one shot per phrase), three sets cut against each other (snow field / a macro "skin landscape" / a dark yard),
// the grade follows the mood (cold blue -> amber when the fur traps warm air -> red-dark fear -> warm sun at the end),
// a cross-section diagram that draws itself on, one white flash on the twist.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { PoseInfo } from "./PoseScene";
import { Person, PersonKey, personAt } from "./Person";
import { InkPass } from "./Ink";
import { M, Models, place, useModels } from "./FreeWorld";
import { Sky, Tex, V3, clamp01, ease, lerp, lerpV, toon } from "./World";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;
const FBX_LIST = ["Pug", "Fence"];
const GLB_LIST = ["man", "cat", "tree_pineDefaultA", "tree_pineDefaultB", "tree_pineRoundC", "tree_pineTallA", "tree_pineTallB", "tree_pineSmallA",
  "rock_largeA", "rock_largeC", "rock_tallA", "stone_tallB", "tree_cone_dark", "fence_simple"];

// word times (s) in public/audio/narration.wav (artifacts/whisper_words_r03.json)
export const T = {
  warm: 0.86, everyone: 1.5, everyone2: 2.58, except: 2.86, body: 3.38, when: 4.12, cold: 4.54, tiny: 5.28, muscles: 5.54, pull: 5.82,
  hair: 6.36, upright: 6.52, if: 7.3, furry: 7.72, fluffed: 8.42, fur: 8.84, trap: 9.22, warmair: 9.46, air: 9.84, but: 10.58, not: 10.96,
  anymore: 11.5, so: 12.18, bumpy: 12.56, skin: 12.78, forn: 13.36, nothing: 13.5, same: 14.12, fear: 14.5, animals: 15.12, puff: 15.38,
  bigger: 16.14, cats: 16.74, dogs: 17.58, your: 18.38, still: 18.7, tries: 18.92, with: 19.68, no: 19.78, nofur: 19.94, puff2: 20.26,
  so2: 21.12, warm2: 22.34, they: 22.86, leftover: 23.0, software: 23.7, running: 24.22, naked: 24.78, hardware: 25.0, follow: 25.46,
  why: 26.06, behind: 27.7, end: 28.7,
};

// ------------------------------------------------------------------ helpers
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const win = (t: number, a: number, b: number, k = 0.25) => clamp01((t - a) / k) * (1 - clamp01((t - b) / k));
const up = (t: number, a: number, d = 0.45) => ease((t - a) / d);

// ------------------------------------------------------------------ shot list: one shot per phrase
type SetName = "snow" | "skin" | "fear";
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Shot = { t: number; set: SetName; a: Cam; b: Cam; k?: (x: number) => number; note: string };
const snap = (x: number) => ease(clamp01((x - 0.12) / 0.14)); // snap zoom shortly after the cut
const SHOTS: Shot[] = [
  { t: 0, set: "skin", note: "hook: bumps pop up across the skin, hairs rise",
    a: { pos: [0.2, 1.25, 9.2], look: [0, 0.35, 0], fov: 46, roll: -3 }, b: { pos: [0.1, 0.95, 6.6], look: [0, 0.35, 0], fov: 44, roll: -1 } },
  { t: T.everyone - 0.04, set: "snow", note: "everyone knows that: the host shivering in the snow",
    a: { pos: [0.7, 1.35, 7.4], look: [0.1, 1.0, 0], fov: 40 }, b: { pos: [0.6, 1.3, 6.3], look: [0.1, 1.0, 0], fov: 40 } },
  { t: T.everyone2 - 0.04, set: "snow", note: "everyone except your body: snap zoom on him", k: snap,
    a: { pos: [-0.4, 1.45, 5.6], look: [0.0, 1.25, 0], fov: 34, roll: 2 }, b: { pos: [-0.4, 1.45, 5.6], look: [0.0, 1.5, 0], fov: 15, roll: 5 } },
  { t: T.when - 0.04, set: "snow", note: "when you get cold: low wide, a gust of snow",
    a: { pos: [-3.6, 0.45, 8.6], look: [0, 1.2, 0], fov: 52, roll: -4 }, b: { pos: [-2.6, 0.55, 7.4], look: [0, 1.2, 0], fov: 50, roll: -2 } },
  { t: T.tiny - 0.06, set: "skin", note: "tiny muscles pull each hair upright (diagram on top)",
    a: { pos: [2.4, 2.4, 7.8], look: [0, 0.25, 0.5], fov: 42 }, b: { pos: [1.4, 1.7, 5.9], look: [0, 0.35, 0.5], fov: 42 } },
  { t: T.if - 0.06, set: "skin", note: "if you were furry: fur grows, fluffs, traps warm air",
    a: { pos: [-1.8, 1.9, 8.2], look: [0, 0.8, 0], fov: 46, roll: 2 }, b: { pos: [1.6, 1.5, 7.0], look: [0, 0.8, 0], fov: 44, roll: -2 } },
  { t: T.but - 0.06, set: "skin", note: "but you're not furry anymore: fur falls away, the warmth floats off, cold wind",
    a: { pos: [0.4, 1.8, 6.6], look: [0, 0.6, 0], fov: 44 }, b: { pos: [0.2, 3.2, 9.4], look: [0, 0.3, 0], fov: 46 } },
  { t: T.so - 0.06, set: "snow", note: "so you just get bumpy skin: he looks at his arm",
    a: { pos: [-1.2, 1.75, 2.6], look: [-0.1, 1.38, 0], fov: 40, roll: -3 }, b: { pos: [-0.95, 1.7, 2.1], look: [-0.1, 1.4, 0], fov: 40, roll: -3 } },
  { t: T.forn - 0.04, set: "snow", note: "for nothing: deadpan close-up, everything stops",
    a: { pos: [0.1, 1.66, 1.75], look: [0.0, 1.58, 0], fov: 30 }, b: { pos: [0.1, 1.66, 1.6], look: [0.0, 1.59, 0], fov: 29 } },
  { t: T.same - 0.04, set: "fear", note: "same with fear: the dark yard, lightning",
    a: { pos: [0.6, 1.5, 7.8], look: [0.4, 0.6, 0], fov: 44, roll: 3 }, b: { pos: [0.4, 1.3, 6.6], look: [0.4, 0.55, 0], fov: 44, roll: 1 } },
  { t: T.animals - 0.04, set: "fear", note: "animals puff up to look bigger: the cat swells",
    a: { pos: [0.4, 0.75, 4.6], look: [0.1, 0.5, 0], fov: 40 }, b: { pos: [0.3, 0.72, 3.9], look: [0.1, 0.55, 0], fov: 40 } },
  { t: T.cats - 0.04, set: "fear", note: "cats do it: low hero angle",
    a: { pos: [1.1, 0.3, 3.0], look: [0.05, 0.55, 0], fov: 40, roll: -7 }, b: { pos: [0.9, 0.3, 2.6], look: [0.05, 0.58, 0], fov: 40, roll: -8 } },
  { t: T.dogs - 0.04, set: "fear", note: "dogs do it: the pug's hackles",
    a: { pos: [3.5, 0.55, 2.2], look: [2.5, 0.42, -0.9], fov: 38, roll: 6 }, b: { pos: [3.2, 0.5, 1.8], look: [2.5, 0.45, -0.9], fov: 38, roll: 7 } },
  { t: T.your - 0.04, set: "fear", note: "your body still tries: the host, scared",
    a: { pos: [-1.6, 1.45, 5.4], look: [-2.4, 1.3, 1.2], fov: 40 }, b: { pos: [-1.9, 1.4, 4.6], look: [-2.4, 1.35, 1.2], fov: 40 } },
  { t: T.with - 0.04, set: "skin", note: "with no fur to puff: bumps rise, almost nothing on them",
    a: { pos: [0.6, 0.85, 5.6], look: [0, 0.4, 0], fov: 40, roll: 4 }, b: { pos: [0.3, 0.75, 4.4], look: [0, 0.4, 0], fov: 40, roll: 2 } },
  { t: T.so2 - 0.04, set: "snow", note: "goosebumps don't keep you warm: white flash, he shrugs",
    a: { pos: [2.6, 1.05, 7.0], look: [0, 1.0, 0], fov: 42 }, b: { pos: [-1.2, 1.05, 7.2], look: [0, 1.0, 0], fov: 42 } },
  { t: T.they - 0.04, set: "snow", note: "leftover fur software on naked hardware: FUR.EXE",
    a: { pos: [1.1, 1.2, 6.4], look: [0.75, 1.75, 0], fov: 42 }, b: { pos: [1.0, 1.2, 5.8], look: [0.72, 1.75, 0], fov: 42 } },
  { t: T.follow - 0.04, set: "snow", note: "follow: the sun breaks through, crane up",
    a: { pos: [0.5, 1.2, 6.6], look: [0, 1.15, 0], fov: 42 }, b: { pos: [0.5, 3.1, 10.5], look: [0, 1.0, 0], fov: 44 } },
];
const END = 29.7;
function shotAt(t: number) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const x = clamp01((t - s.t) / (t1 - s.t));
  const k = s.k ? s.k(x) : ease(x) * 0.5 + x * 0.5;
  const cam = { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), roll: lerp(s.a.roll ?? 0, s.b.roll ?? 0, k) };
  // handheld drift; a shiver in the cold close shots; a jolt on fear
  const shiv = s.set === "snow" && t < T.same ? 0.006 : 0;
  const jolt = t > T.same && t < T.same + 0.6 ? Math.exp(-(t - T.same) * 7) * 0.05 : 0;
  cam.pos = [cam.pos[0] + Math.sin(t * 0.7) * 0.02 + Math.sin(t * 61) * shiv + Math.sin(t * 43) * jolt,
    cam.pos[1] + Math.sin(t * 0.9 + 1) * 0.015 + Math.cos(t * 53) * shiv + Math.cos(t * 39) * jolt, cam.pos[2]];
  return { ...cam, set: s.set, i };
}

// ------------------------------------------------------------------ the mood track
function gradeAt(t: number, set: SetName) {
  let cold = 0, warm = 0, night = 0, red = 0;
  if (set === "snow") {
    cold = t < T.follow ? 0.75 : 0.75 * (1 - up(t, T.follow + 0.2, 1.2));
    warm = t >= T.follow ? 0.55 * up(t, T.follow + 0.2, 1.4) : 0;
  } else if (set === "skin") {
    if (t < T.everyone) cold = 0.45;
    else if (t < T.with) {
      // tiny muscles: cool; fur traps air: amber; not furry: cold again
      cold = 0.5 * (1 - up(t, T.trap - 0.2, 0.6)) + 0.75 * up(t, T.not, 0.7);
      warm = 0.7 * up(t, T.trap - 0.2, 0.6) * (1 - up(t, T.not, 0.7));
    } else { night = 0.55; red = 0.35 + 0.15 * Math.sin(t * 9); }
  } else {
    night = 0.55;
    red = 0.25 + 0.2 * Math.max(0, Math.sin(t * 8.5)) + 0.3 * up(t, T.puff, 0.5) * (1 - up(t, T.your, 0.4));
  }
  // lightning on "same with fear", the white flash on the twist
  const light = set === "fear" ? Math.exp(-Math.max(0, t - T.same) * 9) * (t > T.same ? 0.75 : 0) + (t > T.same + 0.28 ? Math.exp(-(t - T.same - 0.28) * 12) * 0.4 : 0) : 0;
  const flash = (t > T.so2 - 0.04 ? Math.exp(-(t - T.so2 + 0.04) * 5) * 0.85 : 0) + light;
  return { cold, warm, night, red, flash: Math.min(1, flash) };
}

// ------------------------------------------------------------------ skin landscape (macro set)
const SKIN_W = 24, SKIN_SEG = 180, CELL = 1.45;
type Root = { x: number; z: number; delay: number; dir: number; len: number };
const ROOTS: Root[] = (() => {
  const r = rng(7);
  const out: Root[] = [];
  for (let gx = -8; gx <= 8; gx++) for (let gz = -8; gz <= 5; gz++) {
    out.push({ x: (gx + 0.15 + r() * 0.7) * CELL, z: (gz + 0.15 + r() * 0.7) * CELL, delay: r() * 0.35, dir: -0.4 + r() * 0.8, len: 0.62 + r() * 0.36 });
  }
  return out;
})();
const rootGrid = new Map<string, Root[]>();
for (const r of ROOTS) {
  const key = `${Math.floor(r.x / CELL)},${Math.floor(r.z / CELL)}`;
  rootGrid.set(key, [...(rootGrid.get(key) ?? []), r]);
}
// how far each goosebump is raised (0..1) at time t, per root delay
function bumpK(t: number, d: number) {
  if (t < T.everyone) return up(t, 0.15 + d * 1.6, 0.35);
  if (t < T.so) return up(t, T.pull + d, 0.4);
  return up(t, T.no - 0.1 + d * 0.9, 0.35);
}
const hairUpK = (t: number, d: number) => (t < T.everyone ? up(t, 0.3 + d * 1.6, 0.4) : t < T.so ? up(t, T.upright - 0.25 + d, 0.45) : up(t, T.no + d * 0.9, 0.4));
const furGrow = (t: number) => up(t, T.furry - 0.1, 0.55) * (1 - up(t, T.not - 0.05, 0.7));
const furFluff = (t: number) => up(t, T.fluffed - 0.05, 0.5);
const BUMP_R = 0.46, BUMP_H = 0.36;
function skinH(x: number, z: number, t: number) {
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  let h = 0.012 * Math.sin(x * 9.1 + z * 3.3) * Math.sin(z * 7.7 - x * 2.1); // fine skin texture
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const rs = rootGrid.get(`${cx + i},${cz + j}`);
    if (!rs) continue;
    for (const r of rs) {
      const d2 = (x - r.x) ** 2 + (z - r.z) ** 2;
      if (d2 > 1.3) continue;
      h += BUMP_H * bumpK(t, r.delay) * Math.exp(-d2 / (BUMP_R * BUMP_R));
    }
  }
  return h;
}

const FUR_N = 5200;
const FUR = (() => {
  const r = rng(11);
  return Array.from({ length: FUR_N }, () => ({ x: -11 + r() * 22, z: -11 + r() * 17, dir: -0.6 + r() * 1.2, len: 0.95 + r() * 0.55, k: r() }));
})();
const GLOWS = (() => {
  const r = rng(23);
  return Array.from({ length: 46 }, () => ({ x: -4.5 + r() * 9, y: 0.85 + r() * 0.8, z: -4 + r() * 7.5, ph: r() * 6.28, s: 0.75 + r() * 0.6, rise: 0.8 + r() * 1.4 }));
})();

const SkinScape: React.FC<{ t: number; glow: THREE.Texture }> = ({ t, glow }) => {
  const r = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SKIN_W, SKIN_W, SKIN_SEG, SKIN_SEG);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, -2);
    const skin = toon({ color: new THREE.Color("#E7A27C") });
    const hairGeo = new THREE.CylinderGeometry(0.007, 0.024, 1, 6);
    hairGeo.translate(0, 0.5, 0);
    const hairs = new THREE.InstancedMesh(hairGeo, toon({ color: new THREE.Color("#3B2A26") }), ROOTS.length);
    hairs.castShadow = true;
    const furGeo = new THREE.CylinderGeometry(0.004, 0.02, 1, 5);
    furGeo.translate(0, 0.5, 0);
    const fur = new THREE.InstancedMesh(furGeo, toon({ color: new THREE.Color("#5E3B27") }), FUR_N);
    fur.castShadow = true;
    const glowMat = new THREE.SpriteMaterial({ map: glow, color: new THREE.Color("#FFB24A"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const windMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#DDEBFF"), transparent: true, depthWrite: false });
    return { geo, skin, hairs, fur, glowMat, windMat };
  }, [glow]);
  // skin surface
  const p = r.geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, skinH(p.getX(i), p.getZ(i), t));
  p.needsUpdate = true;
  r.geo.computeVertexNormals();
  // hairs: lying flat, then pulled upright by their muscle
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), v = new THREE.Vector3();
  ROOTS.forEach((rt, i) => {
    const k = hairUpK(t, rt.delay);
    const tilt = lerp(1.3, 0.14, k);
    e.set(0, rt.dir, -tilt, "YXZ");
    q.setFromEuler(e);
    v.set(rt.x, skinH(rt.x, rt.z, t) - 0.02, rt.z);
    s.set(1, rt.len, 1);
    r.hairs.setMatrixAt(i, m.compose(v, q, s));
  });
  r.hairs.instanceMatrix.needsUpdate = true;
  // fur: grows in combed flat, fluffs up, falls away
  const g = furGrow(t), fl = furFluff(t);
  FUR.forEach((f, i) => {
    const gi = clamp01(g * 1.25 - f.k * 0.25);
    e.set(0, f.dir, -lerp(1.05, 0.28 + f.k * 0.25, fl), "YXZ");
    q.setFromEuler(e);
    v.set(f.x, gi > 0.001 ? skinH(f.x, f.z, t) - 0.03 : -5, f.z);
    s.set(1 + fl * 0.3, Math.max(0.001, f.len * gi), 1 + fl * 0.3);
    r.fur.setMatrixAt(i, m.compose(v, q, s));
  });
  r.fur.instanceMatrix.needsUpdate = true;
  r.fur.visible = g > 0.001;
  // warm air caught in the fur, then floating away
  const trap = up(t, T.trap - 0.1, 0.5);
  const away = Math.max(0, t - T.not);
  const wind = win(t, T.anymore - 0.3, T.so + 0.2, 0.2);
  return (
    <group>
      <mesh geometry={r.geo} material={r.skin} receiveShadow castShadow />
      <primitive object={r.hairs} />
      <primitive object={r.fur} />
      {trap > 0.01 && t < T.so ? GLOWS.map((gl, i) => {
        const a = trap * (1 - clamp01(away / 1.1));
        const y = gl.y + Math.sin(t * 2 + gl.ph) * 0.08 + away * gl.rise;
        r.glowMat.opacity = a * 0.85;
        return <sprite key={i} material={r.glowMat} position={[gl.x + Math.sin(t * 1.3 + gl.ph) * 0.1, y, gl.z]}
          scale={[gl.s * (0.6 + 0.4 * a), gl.s * (0.6 + 0.4 * a), 1]} userData={{ noNormal: true }} />;
      }) : null}
      {wind > 0.01 ? Array.from({ length: 16 }, (_, i) => {
        const y = 0.3 + (i % 5) * 0.32, z = -3 + (i * 1.7) % 7;
        const x = ((t * 14 + i * 3.1) % 22) - 11;
        r.windMat.opacity = wind * 0.55;
        return <mesh key={i} material={r.windMat} position={[x, y, z]} userData={{ noNormal: true }}>
          <boxGeometry args={[2.4, 0.025, 0.025]} />
        </mesh>;
      }) : null}
    </group>
  );
};

// ------------------------------------------------------------------ fur that stands up on a model (cat / pug)
type Spikes = { pts: THREE.Vector3[]; nrm: THREE.Vector3[]; mesh: THREE.InstancedMesh };
function makeSpikes(g: THREE.Object3D, n: number, color: string, minNy: number, seed: number): Spikes {
  g.updateMatrixWorld(true);
  const pts: THREE.Vector3[] = [], nrm: THREE.Vector3[] = [];
  const meshes: THREE.Mesh[] = [];
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  const r = rng(seed);
  for (const mesh of meshes) {
    let geo = mesh.geometry.clone();
    if (geo.index) geo = geo.toNonIndexed();
    geo.applyMatrix4(mesh.matrixWorld);
    const tmp = new THREE.Mesh(geo);
    const sampler = new MeshSurfaceSampler(tmp).build();
    const p = new THREE.Vector3(), nn = new THREE.Vector3();
    let tries = 0;
    while (pts.length < n && tries++ < n * 6) {
      sampler.sample(p, nn);
      if (nn.y < minNy) continue;
      pts.push(p.clone()); nrm.push(nn.clone().normalize());
    }
    void r;
  }
  const cone = new THREE.ConeGeometry(0.011, 1, 5);
  cone.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(cone, toon({ color: new THREE.Color(color) }), pts.length);
  mesh.castShadow = true;
  return { pts, nrm, mesh };
}
function poseSpikes(sp: Spikes, k: number, len: number, t: number) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), back = new THREE.Vector3(0, 0, -1), d = new THREE.Vector3();
  sp.pts.forEach((p, i) => {
    d.copy(back).multiplyScalar(1 - k).addScaledVector(sp.nrm[i], 0.35 + k).normalize();
    q.setFromUnitVectors(yAxis, d);
    const l = Math.max(0.0001, len * k * (0.7 + 0.3 * Math.sin(i * 12.9898)) * (1 + 0.06 * Math.sin(t * 40 + i)));
    m.compose(p, q, new THREE.Vector3(1 + k * 0.6, l, 1 + k * 0.6));
    sp.mesh.setMatrixAt(i, m);
  });
  sp.mesh.instanceMatrix.needsUpdate = true;
  sp.mesh.visible = k > 0.01;
}

const CAT_POS: V3 = [0, 0, 0], PUG_POS: V3 = [2.5, 0, -0.9];
const Animal: React.FC<{ models: Models; name: "cat" | "Pug"; pos: V3; rot: number; t: number; puffAt: number; size: number; color: string; minNy: number; len: number; n: number }> = (a) => {
  const inst = useMemo(() => {
    const g = place(a.models[a.name], a.size, "z");
    const sp = makeSpikes(g, a.n, a.color, a.minNy, a.name === "cat" ? 3 : 5);
    return { g, sp };
  }, [a.models, a.name, a.size, a.color, a.minNy, a.n]);
  const k = up(a.t, a.puffAt, 0.4);
  poseSpikes(inst.sp, k, a.len, a.t);
  // swell to look bigger + a tremble while puffed
  const sw = 1 + 0.12 * k;
  const tr = k * 0.012;
  return (
    <group position={[a.pos[0] + Math.sin(a.t * 47) * tr, a.pos[1], a.pos[2] + Math.cos(a.t * 53) * tr]} rotation={[0, a.rot, 0]} scale={[sw, 1 + 0.18 * k, sw]}>
      <primitive object={inst.g} />
      <primitive object={inst.sp.mesh} />
    </group>
  );
};

const FearYard: React.FC<{ models: Models; t: number; glow: THREE.Texture }> = ({ models, t, glow }) => {
  const mats = useMemo(() => ({
    ground: toon({ color: new THREE.Color("#5E4B3F") }),
    moon: new THREE.SpriteMaterial({ map: glow, color: new THREE.Color("#DCE4FF"), transparent: true, depthWrite: false }),
    eye: new THREE.SpriteMaterial({ map: glow, color: new THREE.Color("#D6FF5A"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [glow]);
  const fence = Array.from({ length: 9 }, (_, i) => -8 + i * 2);
  const trees: [string, number, number, number][] = [["tree_cone_dark", -6.5, -7, 5.5], ["tree_cone_dark", 5.5, -8, 6.5], ["tree_cone_dark", -2.5, -10, 7],
    ["tree_cone_dark", 9, -6, 5], ["tree_cone_dark", -10, -5, 6], ["tree_cone_dark", 2, -12, 8]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.ground} receiveShadow><planeGeometry args={[300, 300]} /></mesh>
      {fence.map((x, i) => <M key={i} models={models} name="Fence" size={2.05} axis="x" pos={[x, 0, -3.2]} />)}
      {trees.map(([n, x, z, h], i) => <M key={`t${i}`} models={models} name={n} size={h} pos={[x, 0, z]} rot={i} />)}
      <M models={models} name="rock_largeA" size={0.7} pos={[-1.3, 0, -1.4]} rot={0.4} />
      <M models={models} name="rock_tallA" size={1.1} pos={[4.6, 0, -2.0]} rot={1.2} />
      <sprite material={mats.moon} position={[-14, 22, -60]} scale={[9, 9, 1]} userData={{ noNormal: true }} />
      <Animal models={models} name="cat" pos={CAT_POS} rot={Math.PI / 2 - 0.25} t={t} puffAt={T.puff - 0.05} size={1.25} color="#8E8F99" minNy={-0.15} len={0.085} n={1600} />
      <Animal models={models} name="Pug" pos={PUG_POS} rot={-Math.PI / 2 + 0.5} t={t} puffAt={T.dogs - 0.02} size={0.95} color="#A8805A" minNy={0.5} len={0.07} n={420} />
    </group>
  );
};

// ------------------------------------------------------------------ snow field
const FLAKES = 3200;
const SnowField: React.FC<{ models: Models; t: number; tex: Tex }> = ({ models, t, tex }) => {
  const r = useMemo(() => {
    const rr = rng(5);
    const seed = Float32Array.from({ length: FLAKES * 4 }, () => rr());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FLAKES * 3), 3));
    const mat = new THREE.PointsMaterial({ color: new THREE.Color("#FFFFFF"), size: 0.05, transparent: true, opacity: 0.9, depthWrite: false });
    return {
      seed, geo, mat,
      ground: toon({ color: new THREE.Color("#EEF2F8") }),
      hill: [toon({ color: new THREE.Color("#E3EAF4") }), toon({ color: new THREE.Color("#D6E0EE") })],
      puff: [0, 1, 2].map(() => new THREE.SpriteMaterial({ map: tex.cloud, color: new THREE.Color("#FFFFFF"), transparent: true, depthWrite: false })),
    };
  }, [tex]);
  // snow keeps falling until the sun breaks through; a gust on "when you get cold"
  const gust = win(t, T.when - 0.1, T.tiny, 0.3);
  const fall = 1 - up(t, T.follow + 0.4, 1.6);
  const p = r.geo.attributes.position;
  for (let i = 0; i < FLAKES; i++) {
    const sx = r.seed[i * 4], sy = r.seed[i * 4 + 1], sz = r.seed[i * 4 + 2], sp = r.seed[i * 4 + 3];
    const speed = 0.6 + sp * 0.5;
    const y = 7 - ((sy * 7 + t * speed) % 7);
    const drift = t * (0.35 + gust * 5) + Math.sin(t * 1.3 + sp * 9) * 0.2;
    const x = ((sx * 18 + drift + 9) % 18) - 9;
    p.setXYZ(i, x, y, -9 + sz * 18);
  }
  p.needsUpdate = true;
  r.mat.opacity = 0.9 * fall;
  const pines: [string, number, number, number][] = [["tree_pineTallA", -4.2, -4.5, 5.2], ["tree_pineDefaultA", 3.6, -5.8, 4.4], ["tree_pineRoundC", -7.5, -9, 5],
    ["tree_pineTallB", 6.5, -11, 6.5], ["tree_pineDefaultB", -1.5, -13, 5.5], ["tree_pineSmallA", 2.3, -3.2, 2.0], ["tree_pineTallA", 10, -6, 6],
    ["tree_pineRoundC", -11, -3, 4.5], ["tree_pineDefaultA", 12, -16, 7], ["tree_pineTallB", -14, -15, 7.5], ["tree_pineSmallA", -3.2, 2.5, 1.6]];
  const breath = Array.from({ length: 3 }, (_, i) => {
    const ph = ((t + i * 0.55) % 1.65) / 1.65;
    return { ph, ok: t < T.follow + 0.8 };
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={r.ground} receiveShadow><planeGeometry args={[600, 600]} /></mesh>
      {pines.map(([n, x, z, h], i) => <M key={i} models={models} name={n} size={h} pos={[x, 0, z]} rot={i * 1.7} tint="#F2F6FF" tintK={0.22} />)}
      {[-3, -1, 1, 3].map((x, i) => <M key={`f${i}`} models={models} name="fence_simple" size={2.0} axis="x" pos={[x - 6, 0, -6.5]} tint="#FFFFFF" tintK={0.2} />)}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        const R = 150 + (i % 3) * 40;
        return <mesh key={`h${i}`} material={r.hill[i % 2]} position={[Math.cos(a) * R, -6, Math.sin(a) * R - 30]} scale={[70 + (i % 4) * 14, 24 + (i % 3) * 10, 50]}>
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>;
      })}
      <points geometry={r.geo} material={r.mat} userData={{ noNormal: true }} />
      {breath.map((b, i) => { r.puff[i].opacity = 0.32 * Math.sin(Math.PI * b.ph); return b; }).map((b, i) => b.ok ? <sprite key={`b${i}`} material={r.puff[i]} position={[HOST_SNOW[0] - 0.1 - b.ph * 0.45, 1.5 + b.ph * 0.12, HOST_SNOW[2] + 0.22 + b.ph * 0.25]}
        scale={[0.07 + b.ph * 0.26, 0.05 + b.ph * 0.18, 1]} userData={{ noNormal: true }} /> : null)}
    </group>
  );
};

// ------------------------------------------------------------------ host
const HOST_SNOW: V3 = [0, 0, 0], HOST_FEAR: V3 = [-2.4, 0, 1.2];
// the person (free CC0 model, Person.tsx): clip + procedural pose + facial expression per phrase
const PERSON_KEYS: PersonKey[] = [
  { t: 0, clip: "Idle_Neutral", pose: "hug", face: "cold" }, // Idle_Neutral: straight legs (Idle is a bent-knee fighting stance)
  { t: T.everyone - 0.05, face: "smug" }, // "everyone knows that": a smug nod, still hugging
  { t: T.except - 0.05, pose: "selfCheck", face: "confused" }, // "except your body": looks down at himself
  { t: T.when - 0.08, pose: "hug", face: "cold" },
  { t: T.so - 0.1, pose: "lookArm", face: "confused" }, // bumps rise on the forearm he holds up
  { t: T.forn - 0.08, pose: "armsDown", face: "deadpan" },
  { t: T.your - 0.12, pose: "scared", face: "scared" }, // no HitRecieve clip: its bent knees read as deformed in the wide
  { t: T.tries - 0.05, clip: "Idle_Neutral", pose: "puff", face: "strain" }, // tries to puff up
  { t: T.so2 - 0.08, pose: "shrug", face: "shrug" },
  { t: T.they - 0.08, pose: "pointUp", face: "curious" },
  { t: T.naked - 0.08, pose: "facepalm", face: "laugh" },
  { t: T.follow - 0.05, clip: "Wave", pose: "clip", face: "happy" },
];
const shivering = (t: number) => (t < T.tiny || (t > T.so - 0.1 && t < T.same)) && t < T.same;

// ------------------------------------------------------------------ props from build.py
type Cue = { start: number; end: number; value: string };
type CapWord = { t: string; f0: number; f1: number; k?: boolean };
type Captions = { chunks: { f0: number; f1: number; words: CapWord[] }[]; y: number; size: number; maxWidth: number };
export type GooseProps = {
  durationInFrames: number; audio: string; cues: Cue[]; captions: Captions;
  poses: { dir: string; items: Record<string, PoseInfo> }; face: { dir: string; sizes: Record<string, [number, number]>; pad: number };
};

function useTextures() {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    const load = (url: string) => new Promise<THREE.Texture>((res, rej) => L.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej));
    Promise.all([
      load(staticFile("tex/cloud.png")).then((t) => ["cloud", t] as const),
      load(staticFile("tex/glow.png")).then((t) => ["glow", t] as const),
    ]).then((all) => setTex(Object.fromEntries(all)));
  }, []);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}

const CamSet: React.FC<{ pos: V3; look: V3; fov: number; roll: number }> = ({ pos, look, fov, roll }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.05; c.far = 4000; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...look); c.rotateZ(THREE.MathUtils.degToRad(roll)); c.updateMatrixWorld();
  return null;
};
function project(cam: { pos: V3; look: V3; fov: number; roll: number }, p: V3) {
  const c = new THREE.PerspectiveCamera(cam.fov, ASPECT, 0.05, 4000);
  c.position.set(...cam.pos); c.lookAt(...cam.look); c.rotateZ(THREE.MathUtils.degToRad(cam.roll)); c.updateMatrixWorld();
  const v = new THREE.Vector3(...p);
  const inFront = v.clone().applyMatrix4(c.matrixWorldInverse).z < 0;
  v.project(c);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: inFront };
}

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof shotAt>; host: V3 | null; P: GooseProps }> = ({ t, tex, models, cam, host, P }) => {
  const g = gradeAt(t, cam.set);
  const focus = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look));
  if (cam.set === "skin") {
    return (
      <>
        <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
        <color attach="background" args={["#E8B596"]} />
        <fogExp2 attach="fog" args={[new THREE.Color("#E8B596").getHex(), 0.075]} />
        <hemisphereLight args={[new THREE.Color("#FFE6D2"), new THREE.Color("#B06A50"), 1.25]} />
        <directionalLight position={[-6, 9, 5]} intensity={2.4} color="#FFE2C0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006}
          shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} />
        <SkinScape t={t} glow={tex.glow} />
        <InkPass p={{ focus, blur: 9, night: g.night, cow: 0, flash: g.flash, redPulse: g.red, ink: 1, cold: g.cold, warm: g.warm }} />
      </>
    );
  }
  const fear = cam.set === "fear";
  const sun: V3 = fear ? [-14, 22, -20] : [-30, 34, 40];
  const sunUp = !fear && t > T.follow ? up(t, T.follow + 0.2, 1.4) : 0;
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <fogExp2 attach="fog" args={[new THREE.Color(fear ? "#2A2440" : "#DCE5F0").getHex(), fear ? 0.03 : 0.016 * (1 - sunUp * 0.6)]} />
      <Sky night={fear ? 1 : 0.18 * (1 - sunUp)} sunDir={sun} />
      <hemisphereLight args={[new THREE.Color(fear ? "#7A84C8" : "#CFE0FF"), new THREE.Color(fear ? "#3A2E3A" : "#B9C4D6"), fear ? 1.0 : 1.25]} />
      {fear ? <pointLight position={[-1.6, 2.4, 2.2]} color="#FFB070" intensity={9} distance={10} decay={1.6} /> : null}
      <directionalLight position={sun} intensity={fear ? 1.8 : 1.5 + sunUp * 1.8} color={fear ? "#AFC0FF" : sunUp > 0 ? "#FFD49A" : "#F2F4FF"} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={120} />
      {fear ? <FearYard models={models} t={t} glow={tex.glow} /> : <SnowField models={models} t={t} tex={tex} />}
      {host ? <Person models={models} pos={host} rot={fear ? (t < T.your - 0.12 ? 0.75 : 0.2) : 0} t={t} st={personAt(PERSON_KEYS, t)} cues={P.cues}
        shiver={shivering(t) ? 1 : 0} bumps={fear ? 1 : t > T.so - 0.1 ? up(t, T.bumpy - 0.2, 0.5) : up(t, T.except, 0.6)} hairUp={fear ? 1 : t > T.so - 0.1 ? up(t, T.skin - 0.1, 0.5) : up(t, T.body, 0.5)} /> : null}
      <InkPass p={{ focus, blur: 7.5, night: g.night, cow: 0, flash: g.flash, redPulse: g.red, ink: 1, cold: g.cold, warm: g.warm }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#221A30";
const Karaoke: React.FC<{ c: Captions; y: number }> = ({ c, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ch = c.chunks.find((k) => f >= k.f0 && f < k.f1);
  if (!ch) return null;
  const pop = spring({ frame: f - ch.f0, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(-50%) scale(${0.88 + 0.12 * pop})`, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: c.maxWidth, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: c.size * 0.4, fontFamily: anton, fontSize: c.size, lineHeight: 1.05, letterSpacing: 1 }}>
        {ch.words.map((w, i) => {
          const live = f >= w.f0 && f < Math.max(w.f1, w.f0 + 4);
          const lift = live ? spring({ frame: f - w.f0, fps, config: { damping: 10, stiffness: 300 } }) : 0;
          return (
            <span key={i} style={{
              display: "inline-block", color: w.k ? "#FFD23F" : "#FFF8EC", opacity: live || f >= w.f1 ? 1 : 0.8,
              transform: `translateY(${-lift * c.size * 0.05}px) scale(${1 + lift * 0.06})`, transformOrigin: "50% 100%",
              WebkitTextStroke: `${c.size * 0.12}px ${INK}`, paintOrder: "stroke fill", textShadow: `0 ${c.size * 0.06}px ${c.size * 0.1}px rgba(20,10,40,0.5)`,
            }}>{w.t}</span>
          );
        })}
      </div>
    </div>
  );
};

const Tag: React.FC<{ x: number; y: number; t: number; t0: number; t1: number; children: React.ReactNode; rot?: number }> = ({ x, y, t, t0, t1, children, rot = -6 }) => {
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 9, stiffness: 220 } });
  const out = clamp01((t1 - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) rotate(${rot}deg) scale(${s * out})`, transformOrigin: "50% 100%" }}>
      {children}
    </div>
  );
};
const Word: React.FC<{ size: number; color?: string; children: React.ReactNode }> = ({ size, color = "#FFF8EC", children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 4, color, WebkitTextStroke: `${size * 0.16}px ${INK}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{children}</div>
);
const Stamp: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 140, children }) => (
  <div style={{ fontFamily: anton, fontSize: size, letterSpacing: 8, color: "#E5342F", border: `${size * 0.09}px solid #E5342F`, borderRadius: 20, padding: "0 34px",
    background: "rgba(255,243,214,0.9)", boxShadow: "8px 10px 0 rgba(34,26,48,0.35)", whiteSpace: "nowrap" }}>{children}</div>
);

// cross-section of one hair: skin layers draw themselves on, the little muscle shortens and the hair swings upright
const Diagram: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.tiny - 0.1, t1 = T.if - 0.12;
  if (t < t0 || t > t1) return null;
  const inK = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 12, stiffness: 200 } });
  const out = clamp01((t1 - t) / 0.18);
  const draw = (a: number, d = 0.4) => 1 - clamp01((t - a) / d); // dash offset fraction (1 = hidden)
  const pull = up(t, T.pull - 0.05, 0.35);
  const rise = up(t, T.upright - 0.2, 0.4);
  const ang = lerp(68, 12, Math.max(pull * 0.5, rise)); // hair angle from vertical (deg)
  const bump = 26 * Math.max(pull * 0.6, rise);
  const fx = 300, fy = 250; // follicle bulb
  const len = 240;
  const tip = [fx + Math.sin(ang * Math.PI / 180) * len, fy - Math.cos(ang * Math.PI / 180) * len];
  const surf = `M 30 140 C 200 140, ${fx + 70} ${140 - bump}, ${fx + 120} ${140 - bump} S 560 140, 650 140`;
  const mA = [fx + 22, fy - 40], mB = [lerp(470, 440, pull), 150 - bump * 0.6];
  const stroke = { fill: "none", stroke: INK, strokeWidth: 7, strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: 1 };
  return (
    <div style={{ position: "absolute", left: W / 2, top: 170, transform: `translateX(-50%) scale(${inK * out})`, transformOrigin: "50% 0%",
      background: "#FFF3D6", border: `8px solid ${INK}`, borderRadius: 26, boxShadow: "9px 12px 0 rgba(34,26,48,0.35)", padding: "14px 18px 6px" }}>
      <div style={{ fontFamily: anton, fontSize: 54, color: "#B7462E", letterSpacing: 3, marginLeft: 14 }}>INSIDE YOUR SKIN</div>
      <svg width={680} height={380} viewBox="0 0 680 380">
        <rect x={30} y={140 - bump} width={620} height={230} fill="#F4C3A3" opacity={0.55} />
        <path d={surf} {...stroke} strokeDashoffset={draw(t0 + 0.05)} />
        <path d="M 30 205 L 650 205" {...stroke} strokeWidth={4} strokeDasharray="0.02 0.015" opacity={0.5 * (1 - draw(t0 + 0.2))} />
        <ellipse cx={fx} cy={fy + 18} rx={30} ry={40} fill="#E89A78" stroke={INK} strokeWidth={6} opacity={1 - draw(t0 + 0.25, 0.2)} />
        <line x1={fx} y1={fy} x2={tip[0]} y2={tip[1]} stroke="#3B2A26" strokeWidth={12} strokeLinecap="round" opacity={1 - draw(t0 + 0.3, 0.2)} />
        <line x1={mA[0]} y1={mA[1]} x2={mB[0]} y2={mB[1]} stroke="#D7383B" strokeWidth={lerp(16, 26, pull)} strokeLinecap="round" opacity={1 - draw(T.muscles - 0.15, 0.2)} />
        <path d={`M 560 330 Q 520 260 ${(mA[0] + mB[0]) / 2 + 18} ${(mA[1] + mB[1]) / 2 + 22}`} {...stroke} stroke="#D7383B" strokeWidth={6} strokeDashoffset={draw(T.muscles, 0.35)} />
        <text x={470} y={365} fontFamily={anton} fontSize={42} fill="#D7383B" opacity={1 - draw(T.muscles + 0.2, 0.15)}>TINY MUSCLE</text>
        {rise > 0.5 ? <text x={tip[0] + 18} y={tip[1] + 30} fontFamily={anton} fontSize={40} fill={INK} opacity={clamp01((rise - 0.5) * 3)}>HAIR UP!</text> : null}
      </svg>
    </div>
  );
};

// "leftover fur software": a little old program window that runs, then errors out
const FurExe: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.leftover - 0.1, t1 = T.follow - 0.1;
  if (t < t0 || t > t1) return null;
  const s = spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 11, stiffness: 230 } });
  const out = clamp01((t1 - t) / 0.15);
  const prog = clamp01((t - T.software) / (T.hardware - T.software - 0.05));
  const err = t > T.hardware - 0.02;
  const es = err ? spring({ frame: Math.round((t - T.hardware + 0.02) * 30), fps: 30, config: { damping: 7, stiffness: 300 } }) : 0;
  const shake = err ? Math.sin(t * 60) * 8 * Math.exp(-(t - T.hardware) * 5) : 0;
  const box = { border: `7px solid ${INK}`, boxShadow: "8px 10px 0 rgba(34,26,48,0.35)", fontFamily: anton, color: INK };
  return (
    <div style={{ position: "absolute", left: W / 2 + shake, top: 250, transform: `translateX(-50%) scale(${s * out})`, transformOrigin: "50% 0%" }}>
      <div style={{ ...box, width: 760, background: "#FFF3D6", borderRadius: 14 }}>
        <div style={{ background: "#3567E0", color: "#FFF8EC", fontSize: 52, padding: "4px 22px", borderBottom: `7px solid ${INK}`, display: "flex", justifyContent: "space-between" }}>
          <span>FUR.EXE</span><span>v. 100,000 BC</span>
        </div>
        <div style={{ padding: "22px 28px 26px", fontSize: 54 }}>
          {err ? "PUFFING UP FUR... FAILED" : "PUFFING UP FUR..."}
          <div style={{ marginTop: 16, height: 54, border: `6px solid ${INK}`, borderRadius: 8, background: "#FFFFFF" }}>
            <div style={{ width: `${prog * 100}%`, height: "100%", background: err ? "#E5342F" : "#3FB64A" }} />
          </div>
        </div>
      </div>
      {err ? (
        <div style={{ ...box, position: "absolute", left: 120, top: 210, width: 600, background: "#FFFFFF", borderRadius: 14, transform: `scale(${es}) rotate(-3deg)` }}>
          <div style={{ background: "#E5342F", color: "#FFF8EC", fontSize: 46, padding: "2px 20px", borderBottom: `7px solid ${INK}` }}>ERROR</div>
          <div style={{ padding: "16px 24px", fontSize: 64 }}>⚠ NO FUR FOUND</div>
        </div>
      ) : null}
    </div>
  );
};

// arrows that draw outward around the cat on "look bigger"
const Bigger: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => {
  if (t < T.bigger - 0.3 || t > T.cats - 0.08) return null;
  const k = up(t, T.bigger - 0.3, 0.35);
  const out = clamp01((T.cats - 0.08 - t) / 0.12);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: out }}>
      {[[-1, -1], [1, -1], [-1, 0.2], [1, 0.2]].map(([dx, dy], i) => {
        const r0 = 250, r1 = 250 + 120 * k;
        return <line key={i} x1={x + dx * r0} y1={y + dy * r0 * 0.8} x2={x + dx * r1} y2={y + dy * r1 * 0.8} stroke="#FFD23F" strokeWidth={16} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 0 ${INK})` }} />;
      })}
    </svg>
  );
};


// ------------------------------------------------------------------ composition
export const Goosebumps: React.FC<GooseProps> = (P) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const tex = useTextures();
  const models = useModels(FBX_LIST, GLB_LIST);
  const cam = shotAt(t);
  const host = cam.set === "snow" ? HOST_SNOW : cam.set === "fear" ? HOST_FEAR : null;
  const catTop = project(cam, [CAT_POS[0], 0.75, CAT_POS[2]]);
  const capY = 1660;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B1530" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 46, near: 0.05, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} host={host} P={P} />
        </ThreeCanvas>
      ) : null}
      <Tag x={540} y={430} t={t} t0={0.12} t1={T.body - 0.06} rot={-4}><Word size={104}>GOOSEBUMPS = <span style={{ color: "#FF9A3D" }}>WARM?</span></Word></Tag>
      <Tag x={540} y={470} t={t} t0={T.body - 0.06} t1={T.when - 0.1} rot={-8}><Stamp>MYTH</Stamp></Tag>
      <Diagram t={t} />
      <Tag x={540} y={430} t={t} t0={T.trap - 0.05} t1={T.not - 0.05} rot={-5}><Word size={118} color="#FFB24A">WARM AIR</Word></Tag>
      <Tag x={540} y={430} t={t} t0={T.not - 0.05} t1={T.so - 0.1} rot={4}><Word size={118} color="#CFE6FF">NO FUR</Word></Tag>
      <Tag x={540} y={520} t={t} t0={T.forn - 0.04} t1={T.same - 0.08} rot={-5}><Word size={150} color="#FFD23F">FOR NOTHING?</Word></Tag>
      <Bigger t={t} x={catTop.x} y={catTop.y + 60} />
      <Tag x={540} y={430} t={t} t0={T.bigger - 0.1} t1={T.cats - 0.1} rot={-4}><Word size={118} color="#FFD23F">LOOK BIGGER</Word></Tag>
      <Tag x={540} y={430} t={t} t0={T.no - 0.05} t1={T.so2 - 0.08} rot={5}><Word size={118} color="#FF6A5A">NO FUR TO PUFF</Word></Tag>
      <Tag x={540} y={480} t={t} t0={T.so2 + 0.05} t1={T.they - 0.1} rot={-7}><Stamp size={120}>NOT FOR WARMTH</Stamp></Tag>
      <FurExe t={t} />
      <Karaoke c={P.captions} y={capY} />
      <Audio src={staticFile(P.audio)} />
    </AbsoluteFill>
  );
};
