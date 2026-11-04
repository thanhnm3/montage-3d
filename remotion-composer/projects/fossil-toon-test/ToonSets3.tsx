// Fossil toon sets, part 3 (2026-11-04, user: "làm tiếp badlands với bãi khai quật đi"): same toon ramp + ink pass.
//   BadlandsSet — today's fossil country: banded red / orange / cream / grey strata on eroded mounds with rills, flat-topped
//                 mesas with a dark caprock, hoodoos (columns with balanced cap rocks), cracked dry-mud flats, a dry wash,
//                 sagebrush and straw grass, hot dusty sky. The strata come from one world-height shader (stripes match
//                 across every landform, like real layers).
//   DigSet      — a dig on the badlands floor: a stepped pit whose walls show the same strata, a T. rex skeleton lying on
//                 its side half freed from the rock (skull with its openings, jaw, teeth, spine, ribs, hips, legs), a string
//                 grid on stakes, finds flags, plaster jackets, buckets, pickaxe, shovel, wheelbarrow, sieve, a shade
//                 umbrella, a field tent with a table and crates.
//   PersonCard  — toon.ts person (youToon.drawYou) on a card; DIGGER / DIGGER2 outfits.
// Heights: badY(x, z), digY(x, z) (pit floor at DIG.floor). ToonSetsDemo3 (10 s): badlands shots, then the dig.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { Sky, V3, clamp01, ease, lerp, lerpV, toon } from "./World";
import { BeastCard3D, heightPlane as hp0, rng, toonWP, win } from "./ToonSets";
/** height plane whose gentle slopes get an upward normal (no toon bands on the flats); steep cuts keep theirs */
function heightPlane(size: number, seg: number, h: (x: number, z: number) => number) {
  const g = hp0(size, seg, h), n = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) { const ny = n.getY(i), k = clamp01((ny - 0.82) / 0.12); const x = n.getX(i) * (1 - k), z = n.getZ(i) * (1 - k), y = ny * (1 - k) + k, l = Math.hypot(x, y, z); n.setXYZ(i, x / l, y / l, z / l); }
  return g;
}
import { DIGGER, DIGGER2, YouPose, drawYou } from "./youToon";
import type { Outfit } from "./toon";

const W = 1080, H = 1920, ASPECT = W / H;

// ------------------------------------------------------------------ strata: one palette by world height (sRGB -> linear in the shader)
const STRATA = `
  float yy = vWP.y + 0.35 * sin(vWP.x * 0.12) + 0.25 * sin(vWP.z * 0.09 + 1.0) + 0.08 * sin(vWP.x * 1.3 + vWP.z * 0.7);
  float m = mod(floor(yy / 0.85), 7.0);
  vec3 sc = m < 1.0 ? vec3(0.92, 0.84, 0.70) : m < 2.0 ? vec3(0.72, 0.32, 0.19) : m < 3.0 ? vec3(0.86, 0.56, 0.30) : m < 4.0 ? vec3(0.58, 0.53, 0.50)
          : m < 5.0 ? vec3(0.80, 0.44, 0.25) : m < 6.0 ? vec3(0.50, 0.25, 0.18) : vec3(0.88, 0.74, 0.55);
  sc *= 0.9 + 0.1 * sin(vWP.x * 5.0 + vWP.y * 9.0 + vWP.z * 3.0);                     // grain
  sc *= 0.86 + 0.14 * smoothstep(-0.6, 0.9, sin(vWP.x * 4.3 + vWP.z * 3.1 + sin(vWP.y * 1.7) * 2.0)); // rills
  sc = pow(sc, vec3(2.2));`;
const strataMat = (uT: { value: number }) => toonWP("#FFFFFF", uT, STRATA + "\n  diffuseColor.rgb = sc;");

export const BAD = { fog: "#E8CDA6", sun: [-26, 30, 22] as V3 };
export const badY = (x: number, z: number) => {
  const wash = Math.abs(z - (9 + 5 * Math.sin(x * 0.05)));
  return 0.25 * Math.sin(x * 0.09 + z * 0.05) + 0.2 * Math.sin(z * 0.13 - x * 0.07) + 0.04 * Math.sin(x * 1.1 + z * 0.9) - (wash < 2.2 ? 0.7 * (1 - wash / 2.2) ** 2 : 0);
};
export const DIG = { cx: 0, cz: -3, hx: 5, hz: 3, floor: -1.5 };
export const digY = (x: number, z: number) => {
  const m = clamp01((DIG.hx - Math.abs(x - DIG.cx)) / 0.3) * clamp01((DIG.hz - Math.abs(z - DIG.cz)) / 0.3);
  const step = clamp01((DIG.hx - 0.9 - Math.abs(x - DIG.cx)) / 0.2) * clamp01((DIG.hz - 0.9 - Math.abs(z - DIG.cz)) / 0.2); // a working ledge
  return badY(x, z) * (1 - m) + m * (lerp(DIG.floor * 0.5, DIG.floor, step) + 0.03 * Math.sin(x * 3 + z * 2));
};
const groundMat = (uT: { value: number }) => toonWP("#FFFFFF", uT, STRATA + `
  float cr = min(abs(sin(vWP.x * 1.7 + sin(vWP.z * 1.3) * 0.8)), abs(sin(vWP.z * 1.9 + sin(vWP.x * 1.1) * 0.9)));
  float near_ = smoothstep(30.0, 10.0, distance(vWP, cameraPosition));                              // fade the cracks out with distance (no moire)
  vec3 flat_ = pow(vec3(0.86, 0.72, 0.52), vec3(2.2)) * (1.0 - 0.35 * near_ * smoothstep(0.08, 0.0, cr));   // dry-mud cracks
  diffuseColor.rgb = mix(flat_, sc, smoothstep(-0.62, -0.85, vWP.y));                                  // cut banks show the strata
  diffuseColor.rgb = mix(diffuseColor.rgb, pow(vec3(0.42, 0.34, 0.3), vec3(2.2)) * (0.85 + 0.15 * sin(vWP.x * 9.0) * sin(vWP.z * 7.0)), smoothstep(-1.2, -1.42, vWP.y)); // grey-brown rock at the dig floor`);

function moundGeo(R: number, Hh: number, mesa: boolean, seed: number) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(mesa ? new THREE.Vector2(R * (1 - 0.32 * k ** 0.7) * (k > 0.92 ? 1 - (k - 0.92) * 6 : 1), Hh * Math.min(1, k * 1.04)) : new THREE.Vector2(R * Math.cos(k * Math.PI / 2) ** 0.7, Hh * Math.sin(k * Math.PI / 2))); }
  pts.push(new THREE.Vector2(0.01, Hh));
  const g = new THREE.LatheGeometry(pts, 72), p = g.attributes.position as THREE.BufferAttribute, r = rng(seed), ph = r() * 6;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
    const k = 1 + 0.05 * Math.sin(a * 26 + y * 0.6 + ph) + 0.08 * Math.sin(a * 3 + ph) + 0.04 * Math.sin(a * 9 - ph); p.setXYZ(i, x * k, y, z * k); }
  g.computeVertexNormals(); return g;
}
function hoodooGeo(R: number, Hh: number, seed: number) {
  const pts: THREE.Vector2[] = [], r = rng(seed), ph = r() * 6;
  for (let i = 0; i <= 30; i++) { const k = i / 30; pts.push(new THREE.Vector2(R * (1.25 - 0.55 * k + 0.16 * Math.sin(k * 14 + ph)), Hh * k)); }
  pts.push(new THREE.Vector2(0.01, Hh));
  const g = new THREE.LatheGeometry(pts, 24); g.computeVertexNormals(); return g;
}

export const BadlandsSet: React.FC<{ models: Models; t: number; dig?: boolean }> = ({ models, t, dig = false }) => {
  const r = useMemo(() => {
    const uT = { value: 0 }, rr = rng(41);
    const mounds: { x: number; z: number; R: number; H: number; mesa: boolean; s: number }[] = [];
    for (let i = 0; i < 70 && mounds.length < 26; i++) { const a = rr() * Math.PI * 2, d = 22 + rr() * 170, x = Math.cos(a) * d, z = -Math.abs(Math.sin(a)) * d - 6;
      if (x > -22 && x < 20 && z > -18) continue; const mesa = d > 70 && rr() < 0.6; mounds.push({ x, z, R: mesa ? 14 + rr() * 26 : 4 + rr() * 9, H: mesa ? 14 + rr() * 20 : 3 + rr() * 6, mesa, s: i }); }
    const hoodoos = Array.from({ length: 30 }, (_, i) => ({ x: (rr() - 0.5) * 90, z: -20 - rr() * 40, R: 0.5 + rr() * 0.6, H: 3 + rr() * 6, s: i })).filter((q) => !(q.x > -22 && q.x < 20 && q.z > -18));
    const props = Array.from({ length: 160 }, () => ({ x: (rr() - 0.5) * 120, z: -50 + rr() * 75, k: rr(), s: rr() })).filter((q) => !(q.x > -16 && q.x < 14 && q.z > -12)).slice(0, 70);
    return { uT, strata: strataMat(uT), ground: groundMat(uT), cap: toon({ color: new THREE.Color("#4A3A30") }),
      mounds: mounds.map((m) => ({ ...m, g: moundGeo(m.R, m.H, m.mesa, m.s) })), hoodoos: hoodoos.map((h) => ({ ...h, g: hoodooGeo(h.R, h.H, h.s) })), props,
      groundG: dig ? heightPlane(70, 420, digY) : heightPlane(600, 300, badY), far: heightPlane(900, 150, (x, z) => (Math.abs(x) < 34 && Math.abs(z) < 34 ? -30 : badY(x, z) - 0.02)) };
  }, [dig]);
  r.uT.value = t;
  const Y = dig ? digY : badY;
  return (
    <group>
      <Sky night={0} sunDir={BAD.sun} />
      <mesh geometry={r.groundG} material={r.ground} receiveShadow />
      {dig ? <mesh geometry={r.far} material={r.ground} receiveShadow /> : null}
      {r.mounds.map((m, i) => <group key={`m${i}`} position={[m.x, badY(m.x, m.z) - 0.5, m.z]}>
        <mesh geometry={m.g} material={r.strata} castShadow receiveShadow />
        {m.mesa ? <mesh material={r.cap} position={[0, m.H - 0.2, 0]} scale={[m.R * 0.72, 0.9, m.R * 0.72]}><cylinderGeometry args={[1, 1.04, 1, 40]} /></mesh> : null}
      </group>)}
      {r.hoodoos.map((h, i) => <group key={`h${i}`} position={[h.x, badY(h.x, h.z) - 0.2, h.z]}>
        <mesh geometry={h.g} material={r.strata} castShadow receiveShadow />
        <mesh material={r.cap} position={[0, h.H + 0.25, 0]} scale={[h.R * 1.7, 0.45, h.R * 1.5]} rotation={[0.1, h.s, 0.12]} castShadow><sphereGeometry args={[1, 12, 8]} /></mesh>
      </group>)}
      {r.props.map((q, i) => { const y = Y(q.x, q.z);
        if (q.k < 0.45) return <M key={i} models={models} name={i % 2 ? "plant_bush" : "plant_bushLarge"} size={0.5 + q.s * 0.8} pos={[q.x, y - 0.05, q.z]} rot={i} tint="#8E9A6A" tintK={0.75} />;
        if (q.k < 0.75) return <M key={i} models={models} name={i % 2 ? "grass" : "grass_large"} size={0.4 + q.s * 0.5} pos={[q.x, y - 0.05, q.z]} rot={i} tint="#D2B26A" tintK={0.85} />;
        return <M key={i} models={models} name={["rock_largeA", "rock_largeC", "rock_smallA"][i % 3]} size={0.4 + q.s * 1.6} pos={[q.x, y - 0.15, q.z]} rot={i * 1.3} tint="#A8583A" tintK={0.6} />;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ the skeleton (T. rex lying on its left side, ~12 m)
function skullShape() {
  const s = new THREE.Shape();
  const P: [number, number][] = [[0, 0], [0.05, 0.28], [0.22, 0.46], [0.45, 0.5], [0.6, 0.44], [1.0, 0.36], [1.35, 0.22], [1.45, 0.08], [1.38, -0.02], [0.9, -0.04], [0.3, -0.06]];
  s.moveTo(...P[0]); P.slice(1).forEach((q) => s.lineTo(...q)); s.closePath();
  const hole = (cx: number, cy: number, rx: number, ry: number) => { const h = new THREE.Path(); h.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0); s.holes.push(h); };
  hole(0.42, 0.33, 0.08, 0.1); hole(0.82, 0.2, 0.17, 0.08); hole(0.15, 0.2, 0.07, 0.1); // orbit, antorbital fenestra, temporal opening
  return s;
}
function jawShape() { const s = new THREE.Shape(); const P: [number, number][] = [[0.1, -0.1], [1.38, -0.1], [1.34, -0.22], [0.9, -0.3], [0.4, -0.36], [0.08, -0.26]]; s.moveTo(...P[0]); P.slice(1).forEach((q) => s.lineTo(...q)); s.closePath(); return s; }
function plateShape(w: number, h: number) { const s = new THREE.Shape(); s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0); return s; }
export const Skeleton: React.FC<{ pos: V3; yaw?: number; s?: number }> = ({ pos, yaw = 0, s = 1 }) => {
  const r = useMemo(() => {
    const bone = toonWP("#F2E4BE", { value: 0 }, `diffuseColor.rgb *= 0.86 + 0.14 * smoothstep(-0.6, 0.8, sin(vWP.x * 7.0 + vWP.z * 5.0) * sin(vWP.z * 3.0 - vWP.x * 2.0));`);
    const tooth = toon({ color: new THREE.Color("#4A3A2A") });
    const ex = (sh: THREE.Shape, d: number) => { const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); return g; };
    const spine: [number, number][] = []; for (let i = 0; i < 40; i++) { const u = i / 39; spine.push([-0.2 - u * 10.5, 0.4 * Math.sin(u * 4 + 0.5) + (u > 0.55 ? (u - 0.55) * 2.2 : 0)]); }
    return { bone, tooth, skull: ex(skullShape(), 0.22), jaw: ex(jawShape(), 0.12), ilium: ex(plateShape(1.1, 0.5), 0.1), spine };
  }, []);
  const at = (i: number) => r.spine[Math.min(r.spine.length - 1, i)];
  return (
    <group position={pos} rotation={[0, yaw, 0]} scale={s}>
      <mesh geometry={r.skull} material={r.bone} castShadow receiveShadow position={[0, 0.02, -0.1]} />
      <mesh geometry={r.jaw} material={r.bone} castShadow position={[0.1, 0.0, 0.22]} rotation={[0, 0.12, 0]} />
      {Array.from({ length: 12 }, (_, i) => <mesh key={`t${i}`} material={r.tooth} position={[0.4 + i * 0.08, 0.1, 0.04 + (i % 2) * 0.02]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.022, 0.12, 5]} /></mesh>)}
      {r.spine.map(([x, z], i) => { const nx = at(i + 1), a = Math.atan2(nx[1] - z, nx[0] - x), sz = i < 26 ? 1 : 1 - (i - 26) / 18;
        return <group key={`v${i}`} position={[x, 0.06 * sz, z]} rotation={[0, -a, 0]}>
          <mesh material={r.bone} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1 * sz, 0.1 * sz, 0.2, 8]} /></mesh>
          <mesh material={r.bone} position={[0, 0.02, -0.22 * sz]} castShadow><boxGeometry args={[0.06, 0.05, 0.36 * sz]} /></mesh>
          {i < 26 ? <mesh material={r.bone} position={[0, 0.02, 0.14 * sz]} castShadow><boxGeometry args={[0.05, 0.04, 0.14 * sz]} /></mesh> : null}
        </group>; })}
      {Array.from({ length: 11 }, (_, i) => { const [x, z] = at(5 + i * 1.2 | 0); return <mesh key={`r${i}`} material={r.bone} position={[x, 0.05, z + 0.1]} rotation={[-Math.PI / 2, 0, -Math.PI * 0.05 - i * 0.02]} castShadow>
        <torusGeometry args={[0.55 + Math.sin((i / 10) * Math.PI) * 0.3, 0.035, 6, 14, Math.PI * 0.62]} /></mesh>; })}
      {/* hips + legs */}
      <mesh geometry={r.ilium} material={r.bone} castShadow position={[at(22)[0], 0.02, at(22)[1] - 0.1]} />
      {[[0, 0.55, 1.2, 0.09], [0.9, 1.25, 1.1, 0.07], [1.6, 1.9, 0.6, 0.05]].map(([dx, dz, L, rad], i) => { const [x, z] = at(22);
        return <group key={`l${i}`} position={[x + 0.3 + dx * 0.4, 0.07, z + dz]} rotation={[0, 0.6 - i * 0.5, 0]}>
          <mesh material={r.bone} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[rad, rad * 0.85, L, 8]} /></mesh>
          {[-1, 1].map((e) => <mesh key={e} material={r.bone} position={[e * L / 2, 0, 0]} castShadow><sphereGeometry args={[rad * 1.6, 8, 6]} /></mesh>)}
        </group>; })}
      {[0, 1, 2].map((i) => { const [x, z] = at(22); return <mesh key={`f${i}`} material={r.bone} position={[x + 1.6 + i * 0.12, 0.05, z + 2.6 + i * 0.08]} rotation={[0, 0.4 + i * 0.25, Math.PI / 2]} castShadow><cylinderGeometry args={[0.035, 0.02, 0.45, 6]} /></mesh>; })}
    </group>
  );
};

// ------------------------------------------------------------------ person card (toon.ts person, heavy outline)
const SU = 0.00216, YK = 1.0;
const lightAngle = (sun: THREE.Vector3, cam: THREE.Camera) => { const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1); return Math.round(Math.atan2(-sun.dot(up), sun.dot(right)) / (Math.PI / 4)) * (Math.PI / 4); };
export const PersonCard: React.FC<{ pose: YouPose; pos: V3; cam: { pos: V3; look: V3 }; sun: V3; outfit?: Outfit; seed?: number }> = ({ pose, pos, cam, sun, outfit, seed = 6 }) => {
  const r = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = 600 * YK; cv.height = 1000 * YK; const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const geo = new THREE.PlaneGeometry(600 * SU, 1000 * SU); geo.translate(0, (975 - 500) * SU, 0);
    return { g, tex, mat, depth, geo, camO: new THREE.PerspectiveCamera() };
  }, []);
  r.camO.position.set(...cam.pos); r.camO.lookAt(...cam.look); r.camO.updateMatrixWorld();
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, 600 * YK, 1000 * YK);
  drawYou(r.g, YK, { ...pose, light: lightAngle(new THREE.Vector3(...sun).normalize(), r.camO) }, 7, outfit ?? DIGGER, seed);
  r.tex.needsUpdate = true;
  const yaw = Math.atan2(cam.pos[0] - pos[0], cam.pos[2] - pos[2]);
  return <group position={pos} rotation={[0, yaw, 0]}><mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} castShadow userData={{ noNormal: true, noInk: true, flatNormal: r.tex }} /></group>;
};

// ------------------------------------------------------------------ dig props
export const DigProps: React.FC = () => {
  const m = useMemo(() => ({ wood: toon({ color: new THREE.Color("#8A6A44") }), string: toon({ color: new THREE.Color("#F4F0E6") }), plaster: toonWP("#ECE4D2", { value: 0 }, `diffuseColor.rgb *= 0.9 + 0.1 * sin(vWP.x * 30.0) * sin(vWP.z * 30.0);`),
    red: toon({ color: new THREE.Color("#C0442E") }), blue: toon({ color: new THREE.Color("#3E6A9A") }), metal: toon({ color: new THREE.Color("#6A6E74") }), flag: toon({ color: new THREE.Color("#FF7A1A"), side: THREE.DoubleSide }),
    canvas: toon({ color: new THREE.Color("#D8C8A0"), side: THREE.DoubleSide }), umb: toon({ color: new THREE.Color("#F2EDE2"), side: THREE.DoubleSide }), umb2: toon({ color: new THREE.Color("#D9542E"), side: THREE.DoubleSide }),
    tape: toon({ color: new THREE.Color("#F2C230") }), crate: toon({ color: new THREE.Color("#A8804E") }) }), []);
  const { cx, cz, hx, hz } = DIG, gy = (x: number, z: number) => digY(x, z);
  const stakes: V3[] = []; for (let x = -hx; x <= hx + 0.01; x += 1) for (const z of [cz - hz - 0.2, cz + hz + 0.2]) stakes.push([cx + x, gy(cx + x, z), z]);
  for (let z = -hz + 1; z <= hz - 0.99; z += 1) for (const x of [cx - hx - 0.2, cx + hx + 0.2]) stakes.push([x, gy(x, cz + z), cz + z]);
  const flags: V3[] = [[-2.6, 0, -2.2], [-0.8, 0, -4.4], [1.4, 0, -1.9], [2.6, 0, -3.8], [-3.6, 0, -3.4]];
  const jackets: [number, number, number][] = [[6.6, -1.2, 0.8], [7.4, 0.4, 0.6], [6.2, 1.4, 0.5]];
  return (
    <group>
      {stakes.map((p, i) => <mesh key={`s${i}`} material={m.wood} position={[p[0], p[1] + 0.22, p[2]]} castShadow><boxGeometry args={[0.05, 0.5, 0.05]} /></mesh>)}
      {Array.from({ length: 2 * hx + 1 }, (_, i) => { const x = cx - hx + i; return <mesh key={`gx${i}`} material={m.string} position={[x, 0.32, cz]}><boxGeometry args={[0.012, 0.012, 2 * hz + 0.4]} /></mesh>; })}
      {Array.from({ length: 2 * hz - 1 }, (_, i) => { const z = cz - hz + 1 + i; return <mesh key={`gz${i}`} material={m.string} position={[cx, 0.32, z]}><boxGeometry args={[2 * hx + 0.4, 0.012, 0.012]} /></mesh>; })}
      {flags.map(([x, , z], i) => { const y = gy(x, z); return <group key={`f${i}`} position={[x, y, z]}><mesh material={m.metal} position={[0, 0.2, 0]}><cylinderGeometry args={[0.006, 0.006, 0.4, 4]} /></mesh><mesh material={m.flag} position={[0.06, 0.36, 0]}><planeGeometry args={[0.12, 0.08]} /></mesh></group>; })}
      <mesh material={m.tape} position={[cx, DIG.floor + 0.02, cz + hz - 1.2]}><boxGeometry args={[7, 0.006, 0.03]} /></mesh>
      {jackets.map(([x, z, s], i) => <mesh key={`j${i}`} material={m.plaster} position={[x, gy(x, z) + s * 0.3, z]} scale={[s * 1.4, s * 0.7, s]} rotation={[0, i, 0]} castShadow receiveShadow><sphereGeometry args={[0.6, 14, 10]} /></mesh>)}
      {[[5.8, 2.4, m.red], [6.3, 2.6, m.blue], [-6.2, 1.6, m.red]].map(([x, z, mt], i) => <mesh key={`b${i}`} material={mt as THREE.Material} position={[x as number, gy(x as number, z as number) + 0.16, z as number]} castShadow><cylinderGeometry args={[0.17, 0.13, 0.32, 14, 1, true]} /></mesh>)}
      {/* pickaxe on the ledge, shovel stuck in the spoil heap */}
      <group position={[-4.3, DIG.floor * 0.5 + 0.06, -0.8]} rotation={[0, 0.6, Math.PI / 2]}><mesh material={m.wood} castShadow><cylinderGeometry args={[0.025, 0.03, 0.9, 6]} /></mesh><mesh material={m.metal} position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><boxGeometry args={[0.05, 0.62, 0.04]} /></mesh></group>
      <mesh material={m.plaster} position={[-7.5, gy(-7.5, -1) + 0.2, -1]} scale={[2.2, 0.8, 1.6]} receiveShadow><sphereGeometry args={[0.7, 14, 8]} /></mesh>
      <group position={[-7.4, gy(-7.4, -1) + 0.9, -1]} rotation={[0.2, 0, -0.25]}><mesh material={m.wood} castShadow><cylinderGeometry args={[0.025, 0.025, 1.3, 6]} /></mesh><mesh material={m.metal} position={[0, -0.75, 0]} castShadow><boxGeometry args={[0.22, 0.3, 0.02]} /></mesh></group>
      {/* wheelbarrow + sieve */}
      <group position={[-7, gy(-7, 1.8), 1.8]} rotation={[0, 0.5, 0]}>
        <mesh material={m.blue} position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.45, 0.3, 0.3, 4, 1, true]} /></mesh>
        <mesh material={m.metal} position={[0.55, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.08, 14]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={m.wood} position={[-0.5, 0.4, s * 0.22]} rotation={[0, 0, 0.25]} castShadow><boxGeometry args={[0.8, 0.04, 0.04]} /></mesh>)}
      </group>
      <group position={[5.6, gy(5.6, -0.6) + 0.5, -0.6]} rotation={[0.25, 0.3, 0]}>
        {[[0, 0.35], [0, -0.35]].map(([x, z], i) => <mesh key={i} material={m.wood} position={[x, 0, z]} castShadow><boxGeometry args={[0.8, 0.08, 0.05]} /></mesh>)}
        {[-0.38, 0.38].map((x) => <mesh key={x} material={m.wood} position={[x, 0, 0]} castShadow><boxGeometry args={[0.05, 0.08, 0.7]} /></mesh>)}
        {Array.from({ length: 7 }, (_, i) => <mesh key={`w${i}`} material={m.metal} position={[-0.3 + i * 0.1, 0, 0]}><boxGeometry args={[0.006, 0.006, 0.66]} /></mesh>)}
        {[[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].map(([x, z], i) => <mesh key={`l${i}`} material={m.wood} position={[x, -0.3, z]}><boxGeometry args={[0.04, 0.6, 0.04]} /></mesh>)}
      </group>
      {/* shade umbrella over the skull end */}
      <group position={[6.6, gy(6.6, -4.2), -4.2]} rotation={[0, 0, 0.12]}>
        <mesh material={m.metal} position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 2.8, 6]} /></mesh>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} material={i % 2 ? m.umb : m.umb2} position={[0, 2.85, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]} castShadow>
          <coneGeometry args={[1.5, 0.45, 2, 1, true, 0, Math.PI / 4]} /></mesh>)}
      </group>
      {/* field tent, table, crates */}
      <group position={[-9.5, gy(-9.5, -7), -7]} rotation={[0, 0.4, 0]}>
        {[-1, 1].map((s) => <mesh key={s} material={m.canvas} position={[0, 1.0, s * 0.8]} rotation={[s * 0.9, 0, 0]} castShadow receiveShadow><planeGeometry args={[3.4, 2.4]} /></mesh>)}
        <mesh material={m.wood} position={[0.6, 0.4, 2.0]} castShadow><boxGeometry args={[1.6, 0.06, 0.8]} /></mesh>
        {[[-0.1, 1.7], [1.3, 1.7], [-0.1, 2.3], [1.3, 2.3]].map(([x, z], i) => <mesh key={i} material={m.wood} position={[x, 0.2, z]}><boxGeometry args={[0.05, 0.4, 0.05]} /></mesh>)}
        {[[2.2, 1.2, 0.5], [2.3, 1.8, 0.4], [2.25, 1.5, 0.35]].map(([x, z, s], i) => <mesh key={`c${i}`} material={m.crate} position={[x, s / 2 + (i === 2 ? 0.45 : 0), z]} castShadow><boxGeometry args={[s, s, s]} /></mesh>)}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ demo: 5 s badlands, 5 s dig
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
const SHOTS: { t: number; set: "bad" | "dig"; a: Cam; b: Cam }[] = [
  { t: 0, set: "bad", a: { pos: [2, 2.4, 34], look: [0, 6, -20], fov: 50 }, b: { pos: [0, 2.2, 30], look: [0, 6, -20], fov: 50 } },                     // vista: mesas, hoodoos, Allosaurus
  { t: 2.4, set: "bad", a: { pos: [7, 0.8, 10], look: [1, 4.5, 0], fov: 48, roll: -5 }, b: { pos: [6.5, 0.7, 9], look: [1, 4.8, 0], fov: 48, roll: -6 } }, // low: Allosaurus roar, Stegosaurus
  { t: 5, set: "dig", a: { pos: [9, 6, 12], look: [0, -1, -3], fov: 46 }, b: { pos: [7, 5.4, 11], look: [0, -1, -3], fov: 46 } },                       // the dig from above
  { t: 7.4, set: "dig", a: { pos: [4.6, 1.8, 1.4], look: [2.4, -1.5, -3.3], fov: 44 }, b: { pos: [4.2, 1.6, 1.0], look: [2.4, -1.5, -3.3], fov: 44 } },  // close: brushing the skull
];
const END = 10;
function camAt(t: number) {
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END, k = ease(clamp01((t - s.t) / (t1 - s.t)));
  return { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), roll: lerp(s.a.roll ?? 0, s.b.roll ?? 0, k), i, set: s.set };
}
const CamSet: React.FC<{ c: ReturnType<typeof camAt> }> = ({ c }) => {
  const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.05; cc.far = 4000; cc.aspect = ASPECT; cc.updateProjectionMatrix();
  cc.lookAt(...c.look); cc.rotateZ(THREE.MathUtils.degToRad(c.roll)); cc.updateMatrixWorld();
  return null;
};
const GLB = ["plant_bush", "plant_bushLarge", "grass", "grass_large", "rock_largeA", "rock_largeC", "rock_smallA"];
export const ToonSetsDemo3: React.FC = () => {
  const t = useCurrentFrame() / 30, models = useModels([], GLB), c = camAt(t), cam = { pos: c.pos, look: c.look };
  const dig = c.set === "dig", focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  const roar = win(t, 2.8, 5) ? ease(clamp01((t - 2.8) / 0.25)) : 0, alloX = lerp(-7, -0.5, clamp01(t / 2.4));
  return (
    <AbsoluteFill style={{ background: BAD.fog }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={c} />
          <fogExp2 attach="fog" args={[new THREE.Color(BAD.fog).getHex(), 0.0035]} />
          <hemisphereLight args={[new THREE.Color("#CFE0FF"), new THREE.Color("#B07A50"), 1.05]} />
          <directionalLight position={BAD.sun} intensity={2.5} color="#FFE2B8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0008} shadow-normalBias={0.08}
            shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} />
          <BadlandsSet models={models} t={t} dig={dig} />
          {dig ? <group>
            <Skeleton pos={[3.0, DIG.floor + 0.02, -3.2]} yaw={0.06} s={0.72} />
            <DigProps />
            <PersonCard pos={[1.4, DIG.floor, -2.0]} cam={cam} sun={BAD.sun} pose={{ mode: "sit", gesture: "present", expr: "smile", look: 0.4 }} />
            <PersonCard pos={[-5.6, digY(-5.6, 1.2), 1.2]} cam={cam} sun={BAD.sun} outfit={DIGGER2} seed={9} pose={{ gesture: "point_up", expr: "grin" }} />
          </group> : <group>
            <BeastCard3D name="allo" t={t} sun={BAD.sun} pos={[alloX, badY(alloX, 0), 0]} heading={0} cam={cam} pose={{ walk: t < 2.4 ? 1 : 0, phase: t * 0.9, roar }} />
            <BeastCard3D name="steg" t={t} sun={BAD.sun} pos={[7.5, badY(7.5, -3), -3]} heading={Math.PI} cam={cam} pose={{ roar: t > 3.2 ? 1 : 0, expr: "angry" }} />
          </group>}
          <InkPass p={{ focus, blur: c.i === 1 || c.i === 3 ? 8 : 4, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: 0, warm: 0.35 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
