// Fossil toon sets (2026-11-04, user: "làm địa hình còn thiếu đi, biển với kỷ băng hà"): two 3D worlds for the beast
// cards, in the same toon ramp + ink pass as the Hell Creek map of Short 013.
//   SeaSet  — an ancient sea floor: rippled sand with moving caustics, light shafts from the surface, the surface seen
//             from below, a water dome (bright Snell window above, deep blue below), rocks, sea lilies (crinoids),
//             sponges, drifting ammonites and a fish school (2D cards), marine snow.
//   IceSet  — Ice Age mammoth steppe: wind-carved snow with dry grass tussocks, a glacier wall with a snow cap and
//             crevasses, faceted snowy mountains, frosted pines, snow-capped boulders, falling snow, low cold sun.
// Heights: seaFloorY(x, z) / snowY(x, z) give the ground height, so cards and props stand on it.
// ToonSetsDemo (10 s): sea shots (Mosasaurus, Megalodon, Dunkleosteus) then Ice Age shots (mammoths, woolly rhino
// charge, Smilodon, cave bear).
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Pen } from "./toon";
import { AnimalPose, GROUND } from "./toonAnimals";
import { BEASTS, BeastName } from "./beasts";
import { MotionKind, motionKindOf, motionUniforms, withMotion } from "./cardMotion";
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { FloraField, scatter } from "./FloraField";
import { Sky, V3, clamp01, ease, lerp, lerpV, toon } from "./World";

const W = 1080, H = 1920, ASPECT = W / H;
export const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const canvasTex = (w: number, h: number, f: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
/** height-field ground: a plane bent by h(x, z) */
export function heightPlane(size: number, seg: number, h: (x: number, z: number) => number) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, h(p.getX(i), p.getZ(i)));
  g.computeVertexNormals(); return g;
}
/** toon material with a world-position hook: `frag` runs after the colour is set (vWP = world position, uT = time) */
export function toonWP(color: string, uT: { value: number }, frag: string, extra: THREE.MeshToonMaterialParameters = {}, uni: Record<string, { value: unknown }> = {}, decl = "", emissive = "") {
  const m = toon({ color: new THREE.Color(color), ...extra });
  m.onBeforeCompile = (s) => {
    s.uniforms.uT = uT; Object.assign(s.uniforms, uni);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform float uT;\n" + decl)
      .replace("#include <color_fragment>", "#include <color_fragment>\n" + frag)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n" + emissive);
  };
  // three caches compiled programs by onBeforeCompile.toString(), the same text for every toonWP material: give each its own key
  m.customProgramCacheKey = () => "toonWP|" + frag + "|" + decl + "|" + emissive + "|" + (extra.side ?? "");
  return m;
}

// ------------------------------------------------------------------ beast card (any of BEAST_ALL), standing or swimming
const K = 0.75;
const lightAngle = (sun: THREE.Vector3, cam: THREE.Camera) => {
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  return Math.round(Math.atan2(-sun.dot(up), sun.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
};
const blinkAt = (t: number, seed: number) => { const n = Math.floor((t + seed) / 2.1); const at = n * 2.1 + 0.5 + ((Math.sin(n * 91.7 + seed) + 1) / 2) * 1.2 - seed; const d = (t - at) * 30; return d >= 0 && d < 4 ? 1 : 0; };
/** `anchor` = design y that sits on pos.y: GROUND for walkers (feet on the ground), 520 for swimmers (body centre) */
const seedOf = (n: string) => { let h = 7; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997; return (h / 997) * 5; };
export const BeastCard3D: React.FC<{ name: BeastName; pose: AnimalPose; pos: V3; heading: number; cam: { pos: V3; look: V3 }; t: number; sun: V3; anchor?: number; size?: number; motion?: MotionKind; motionAmp?: number }> =
  ({ name, pose, pos, heading, cam, t, sun, anchor = GROUND, size = 1, motion, motionAmp = 1 }) => {
  const A = BEASTS[name], mpu = (A.len / (A.x1 - A.x0)) * size;
  const r = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = 1600 * K; cv.height = 1000 * K;
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    // subdivided plane, bent in the vertex shader for breathing / tail / swim / flight motion (cardMotion.ts)
    const dx = (800 - (A.x0 + A.x1) / 2) * mpu, dy = (anchor - 500) * mpu, kind = motion ?? motionKindOf(name);
    const U = motionUniforms(kind, (A.x0 - 800) * mpu + dx, (A.x1 - 800) * mpu + dx, (500 - GROUND) * mpu + dy, 1000 * mpu * 0.75);
    const mat = withMotion(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), U, "basic");
    const depth = withMotion(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }), U, "depth");
    const geo = new THREE.PlaneGeometry(1600 * mpu, 1000 * mpu, 64, 32);
    geo.translate(dx, dy, 0);
    return { g, tex, mat, depth, geo, U, camO: new THREE.PerspectiveCamera() };
  }, [A, mpu, anchor, name, motion]);
  // a fixed per-animal time offset (a position-based one would speed up while the animal walks)
  r.U.uT.value = t + seedOf(name); r.U.uAmp.value = motionAmp; r.U.uExcite.value = Math.min(1, Math.max(0, pose.roar ?? 0));
  r.camO.position.set(...cam.pos); r.camO.lookAt(...cam.look); r.camO.updateMatrixWorld();
  const camRight = new THREE.Vector3().setFromMatrixColumn(r.camO.matrixWorld, 0);
  const flip = Math.cos(heading) * camRight.x + Math.sin(heading) * camRight.z < 0;
  let light = lightAngle(new THREE.Vector3(...sun).normalize(), r.camO);
  if (flip) light = Math.PI - light;
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, 1600 * K, 1000 * K); r.g.setTransform(K, 0, 0, K, 0, 0);
  A.draw(new Pen(r.g), { ...pose, light, blink: pose.blink ?? blinkAt(t, pos[0]) });
  r.tex.needsUpdate = true;
  const yaw = Math.atan2(cam.pos[0] - pos[0], cam.pos[2] - pos[2]);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} castShadow scale={[flip ? -1 : 1, 1, 1]} userData={{ noNormal: true, noInk: true, flatNormal: r.tex }} />
    </group>
  );
};

// ------------------------------------------------------------------ small 2D cards: ammonite, fish (toon ink look)
const INKC = "#0E080C";
const ammoniteTex = () => canvasTex(256, 256, (g) => {
  const p = new Pen(g); g.lineJoin = "round";
  // tentacles under the shell opening
  for (let i = 0; i < 7; i++) p.stroke([[150, 150], [190 + i * 6, 180 + i * 7], [205 + i * 4, 215 + i * 4]], 6, "#B8664A");
  const pts: [number, number][] = []; for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 5.2, r = 8 + a * 15; pts.push([118 + Math.cos(a) * r, 120 + Math.sin(a) * r]); }
  p.ell(118, 120, 96, 96, "#C99A62", 7); // outer whorl
  g.save(); g.beginPath(); g.arc(118, 120, 96, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#7A4E2E"; g.beginPath(); g.ellipse(140, 140, 96, 96, 0, 0, Math.PI * 2); g.fill(); // shadow side
  g.fillStyle = "#D9B07A"; g.beginPath(); g.ellipse(104, 104, 80, 80, 0, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; p.stroke([[118 + Math.cos(a) * 60, 120 + Math.sin(a) * 60], [118 + Math.cos(a + 0.12) * 94, 120 + Math.sin(a + 0.12) * 94]], 4, "#6A3E22"); } // ribs
  g.restore();
  p.stroke(pts, 6, INKC);
  p.ell(118, 120, 96, 96, null, 8);
});
const fishTex = () => canvasTex(128, 64, (g) => {
  g.fillStyle = "#9FB8C0"; g.strokeStyle = INKC; g.lineWidth = 4;
  g.beginPath(); g.moveTo(112, 32); g.quadraticCurveTo(80, 6, 34, 26); g.lineTo(10, 8); g.lineTo(16, 32); g.lineTo(10, 56); g.lineTo(34, 38); g.quadraticCurveTo(80, 58, 112, 32); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#3E5A66"; g.beginPath(); g.moveTo(108, 30); g.quadraticCurveTo(80, 10, 36, 28); g.lineTo(60, 30); g.closePath(); g.fill();
  g.fillStyle = INKC; g.beginPath(); g.arc(94, 28, 4, 0, Math.PI * 2); g.fill();
});
export const glowTex = () => canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const shaftTex = () => canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, 64, 256); });

// ------------------------------------------------------------------ SEA
const CAM0 = { pos: [0, 3, 30] as V3 };
const SEA_FLORA = [...scatter(91, 70, [["kelp", 3], ["seafan", 2], ["sponge", 2], ["braincoral", 1.5], ["boulder", 2], ["rockpile", 1.5]], [-60, 60, -45, 30], [-20, 16, -9]),
  ...scatter(92, 46, [["kelp", 4], ["seafan", 2], ["sponge", 2], ["braincoral", 1], ["rockpile", 1]], [-24, 24, -26, -10]), ...scatter(93, 24, [["braincoral", 2], ["sponge", 1], ["rockpile", 2]], [-14, 14, 8, 22], [-7, 7, -99], 0.7)];
export const SEA = { surf: 26, fog: "#2D7488", top: "#9FE6EE", hor: "#2D7488", deep: "#0C2A3E", sand: "#C9B88A", rock: "#4E5E66", sun: [8, 40, 18] as V3 };
export const seaFloorY = (x: number, z: number) =>
  0.7 * Math.sin(x * 0.11 + z * 0.05) + 0.45 * Math.sin(z * 0.17 - x * 0.06) + 0.08 * Math.sin(x * 1.3 + z * 0.5) + (z < -30 ? (-30 - z) * 0.14 : 0);
export const domeMat = (top: string, hor: string, deep: string) => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(hor) }, deep: { value: new THREE.Color(deep) } },
  vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `varying vec3 vD; uniform vec3 top; uniform vec3 hor; uniform vec3 deep;
    void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.8)) : mix(hor, deep, pow(-y, 0.5));
      c += vec3(0.55, 0.85, 0.9) * pow(max(y, 0.0), 10.0) * 0.8; gl_FragColor = vec4(c, 1.0); }` });

export const SeaSet: React.FC<{ models: Models; t: number; cam?: { pos: V3 } }> = ({ models, t, cam = CAM0 }) => {
  const r = useMemo(() => {
    const uT = { value: 0 };
    const sand = toonWP(SEA.sand, uT, `
      float c1 = sin(vWP.x * 1.1 + uT * 0.9 + sin(vWP.z * 0.7 + uT * 0.5) * 1.6);
      float c2 = sin(vWP.z * 1.3 - uT * 0.7 + sin(vWP.x * 0.8 - uT * 0.6) * 1.4);
      float ca = smoothstep(0.55, 0.95, 1.0 - abs(c1 + c2) * 0.5);
      diffuseColor.rgb += vec3(0.32, 0.42, 0.4) * ca;                            // caustics
      diffuseColor.rgb *= 0.9 + 0.1 * sin(vWP.x * 3.0 + vWP.z * 0.8);            // sand ripples`);
    const floorG = heightPlane(500, 220, seaFloorY);
    const surf = new THREE.ShaderMaterial({ side: THREE.DoubleSide, depthWrite: false, fog: false, transparent: true, uniforms: { uT },
      vertexShader: "varying vec3 vWP; void main(){ vWP = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWP, 1.0); }",
      fragmentShader: `varying vec3 vWP; uniform float uT;
        void main(){ float w = sin(vWP.x * 0.35 + uT * 0.8) * sin(vWP.z * 0.3 - uT * 0.6) + 0.5 * sin((vWP.x - vWP.z) * 0.7 + uT * 1.2);
          float d = length(vWP.xz) / 160.0; vec3 c = mix(vec3(0.72, 0.95, 0.96), vec3(0.18, 0.46, 0.54), clamp(d, 0.0, 1.0));
          c += smoothstep(0.6, 1.2, w) * 0.25 * (1.0 - clamp(d, 0.0, 1.0)); gl_FragColor = vec4(c, 0.92); }` });
    const shaft = new THREE.MeshBasicMaterial({ map: shaftTex(), color: "#CFF8FF", transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const am = new THREE.SpriteMaterial({ map: ammoniteTex(), transparent: true, alphaTest: 0.3 });
    const fish = new THREE.SpriteMaterial({ map: fishTex(), transparent: true, alphaTest: 0.3 });
    const snow = new THREE.SpriteMaterial({ map: glowTex(), color: "#E6FBFF", transparent: true, opacity: 0.55, depthWrite: false });
    const stalk = toon({ color: new THREE.Color("#8A5A6E") }), crown = toon({ color: new THREE.Color("#C2476A") }), sponge = toon({ color: new THREE.Color("#D9A23A") }), sponge2 = toon({ color: new THREE.Color("#B85A2E") });
    const rr = rng(7);
    const props = Array.from({ length: 140 }, () => ({ x: (rr() - 0.5) * 120, z: -60 + rr() * 90, k: rr(), s: rr() })).filter((q) => !(q.x > -20 && q.x < 16 && q.z > -9) && q.z > -45).slice(0, 80); // keep the action zone clear
    const snowP = Array.from({ length: 160 }, () => ({ x: (rr() - 0.5) * 60, y: rr() * SEA.surf, z: -30 + rr() * 50, s: 0.04 + rr() * 0.06 }));
    const school = Array.from({ length: 34 }, () => ({ a: rr() * Math.PI * 2, r: 2 + rr() * 2.5, y: rr() * 2.4, sp: 0.85 + rr() * 0.3 }));
    const ams = Array.from({ length: 9 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (14 + rr() * 10), y: 3 + rr() * 9, z: -24 + rr() * 26, s: 0.5 + rr() * 0.6, ph: rr() * 6 })); // off the action line
    return { uT, sand, floorG, surf, shaft, am, fish, snow, stalk, crown, sponge, sponge2, props, snowP, school, ams, dome: domeMat(SEA.top, SEA.hor, SEA.deep) };
  }, []);
  r.uT.value = t;
  return (
    <group>
      <mesh material={r.dome} userData={{ noNormal: true }} renderOrder={-10}><sphereGeometry args={[1800, 48, 24]} /></mesh>
      <mesh geometry={r.floorG} material={r.sand} receiveShadow />
      <mesh position={[0, SEA.surf, 0]} rotation={[Math.PI / 2, 0, 0]} material={r.surf} userData={{ noNormal: true }}><planeGeometry args={[600, 600]} /></mesh>
      {Array.from({ length: 9 }, (_, i) => { const x = -24 + i * 6 + Math.sin(i * 3.1) * 2, z = -14 + (i % 3) * 7;
        return <mesh key={`s${i}`} material={r.shaft} position={[x + Math.sin(t * 0.4 + i) * 0.8, SEA.surf / 2, z]} rotation={[0, i * 0.7, 0.18 + 0.04 * Math.sin(t * 0.5 + i)]} userData={{ noNormal: true }}><planeGeometry args={[2.2 + (i % 3), SEA.surf * 1.2]} /></mesh>; })}
      {r.props.map((q, i) => {
        const y = seaFloorY(q.x, q.z);
        if (q.k < 0.42) return null; // rocks: hand-drawn now (SEA_FLORA)
        if (q.k < 0.72) { // sea lily: swaying stalk, feathery crown
          const h = 1.2 + q.s * 2.2, sw = 0.12 * Math.sin(t * 0.9 + i);
          return <group key={i} position={[q.x, y, q.z]} rotation={[sw * 0.5, i, sw]}>
            <mesh material={r.stalk} position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.035, 0.06, h, 6]} /></mesh>
            {Array.from({ length: 6 }, (_, j) => <mesh key={j} material={r.crown} position={[0, h, 0]} rotation={[0.9 + 0.15 * Math.sin(t * 1.4 + j + i), (j / 6) * Math.PI * 2, 0]} castShadow>
              <coneGeometry args={[0.07, 0.8, 5]} /></mesh>)}
          </group>;
        }
        return null; // sponges: hand-drawn now (SEA_FLORA)
      })}
      <FloraField items={SEA_FLORA} ground={seaFloorY} cam={cam} t={t} pal="sea" wind={0.8} tint="#BFE0E6" />
      {r.ams.map((a, i) => <sprite key={`a${i}`} material={r.am} position={[a.x + Math.sin(t * 0.3 + a.ph) * 1.5, a.y + Math.sin(t * 0.8 + a.ph) * 0.3, a.z]} scale={[a.s, a.s, 1]} userData={{ noNormal: true }} />)}
      {r.school.map((f, i) => { const a = f.a + t * 0.45 * f.sp; return <sprite key={`f${i}`} material={r.fish} position={[8 + Math.cos(a) * f.r * 2.2, 7 + f.y + Math.sin(a * 2) * 0.4, -10 + Math.sin(a) * f.r]} scale={[0.6, 0.3, 1]} userData={{ noNormal: true }} />; })}
      {r.snowP.map((s, i) => <sprite key={`m${i}`} material={r.snow} position={[s.x + Math.sin(t * 0.5 + i) * 0.3, ((s.y - t * 0.25) % SEA.surf + SEA.surf) % SEA.surf, s.z]} scale={[s.s, s.s, 1]} userData={{ noNormal: true }} />)}
    </group>
  );
};

// ------------------------------------------------------------------ ICE AGE
const ICE_FLORA = scatter(17, 80, [["snowpine", 3], ["boulder", 2], ["rockpile", 1.5]], [-90, 90, -75, 25], [-18, 16, -14]);
const ICE_GRASS = [...scatter(23, 60, [["grass", 3], ["sage", 1]], [-60, 60, -40, 25], [-18, 16, -14], 0.8), ...scatter(24, 40, [["grass", 3], ["sage", 1]], [-24, 24, -24, -6], undefined, 0.8), ...scatter(25, 20, [["grass", 2]], [-14, 14, 6, 20], [-6, 6, -99], 0.7)];
const ICE_BACK = [...scatter(26, 22, [["snowpine", 2], ["boulder", 2], ["rockpile", 2]], [-30, 30, -34, -14]), ...scatter(27, 12, [["rockpile", 2], ["boulder", 1]], [-16, 16, 6, 22], [-7, 7, -99], 0.6)];
export const ICE = { fog: "#C6D3DF", snow: "#EEF3F8", snowShade: "#B9CADB", grass: "#C9A55E", ice: "#8EC3DD", iceDark: "#4E8EAE", rock: "#6A6E74", pine: "#2F4A40", sun: [-34, 14, 30] as V3 };
export const snowY = (x: number, z: number) =>
  0.45 * Math.sin(x * 0.08 + z * 0.03) + 0.3 * Math.sin(z * 0.13 - x * 0.04) + 0.05 * Math.sin(x * 0.9 - z * 0.6) + (z < -40 ? (-40 - z) * 0.08 : 0);
function glacierGeo(len: number, seed: number) {
  const r = rng(seed), sh = new THREE.Shape(); sh.moveTo(-len / 2, -4);
  for (let x = -len / 2; x <= len / 2; x += 4 + r() * 5) sh.lineTo(x, 18 + r() * 14 + 8 * Math.sin(x * 0.03));
  sh.lineTo(len / 2, -4); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 40, bevelEnabled: false }); g.translate(0, 0, -40); return g;
}
export const IceSet: React.FC<{ models: Models; t: number; cam?: { pos: V3 } }> = ({ models, t, cam = CAM0 }) => {
  const r = useMemo(() => {
    const uT = { value: 0 };
    const snow = toonWP(ICE.snow, uT, `
      float d = sin(vWP.x * 0.9 + vWP.z * 0.35 + sin(vWP.z * 0.4) * 1.2);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.8, 0.88), smoothstep(0.75, 1.0, d) * 0.5);   // wind ridges
      float tr = sin(vWP.x * 0.21 + 1.3) * sin(vWP.z * 0.19 - 0.4);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.55, 0.42), smoothstep(0.55, 0.8, tr) * 0.55); // bare steppe patches`);
    const ice = toonWP(ICE.ice, uT, `
      float cv = abs(sin(vWP.x * 0.55 + sin(vWP.y * 0.3) * 0.8));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.42, 0.56), smoothstep(0.96, 1.0, cv));       // crevasses
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 1.0), smoothstep(0.82, 1.0, sin(vWP.y * 0.9 + vWP.x * 0.05)) * 0.35); // layers`);
    const cap = toon({ color: new THREE.Color("#F4F8FB") }), mtn = toon({ color: new THREE.Color("#8C96A4") }), mtnSnow = toon({ color: new THREE.Color("#F2F6FA") });
    const flake = new THREE.SpriteMaterial({ map: glowTex(), color: "#FFFFFF", transparent: true, opacity: 0.9, depthWrite: false });
    const groundG = heightPlane(700, 240, snowY);
    const rr = rng(13);
    const props = Array.from({ length: 220 }, () => { const k = rr(), x0 = (rr() - 0.5) * 140, z0 = -70 + rr() * 95;
      const [x, z] = k < 0.3 ? [x0 * 1.3, z0 - 20] : k < 0.5 ? [x0, z0] : [x0 * 0.6, z0 * 0.6 + 8];
      return { x, z, k, s: rr() }; }).filter((q) => !(q.x > -18 && q.x < 16 && q.z > -14)).slice(0, 90); // keep the action zone clear
    const flakes = Array.from({ length: 260 }, () => ({ x: (rr() - 0.5) * 50, y: rr() * 20, z: -25 + rr() * 45, s: 0.05 + rr() * 0.07, ph: rr() * 6 }));
    return { uT, snow, ice, cap, mtn, mtnSnow, flake, groundG, props, flakes, glacier: glacierGeo(260, 3), glacierCap: glacierGeo(262, 3) };
  }, []);
  r.uT.value = t;
  return (
    <group>
      <Sky night={0.08} sunDir={ICE.sun} />
      <mesh geometry={r.groundG} material={r.snow} receiveShadow />
      {/* glacier wall + snow cap, behind the steppe */}
      <mesh geometry={r.glacier} material={r.ice} position={[0, 0, -95]} castShadow receiveShadow />
      <mesh geometry={r.glacierCap} material={r.cap} position={[0, 1.2, -96]} scale={[1, 1.0, 1.02]} />
      {Array.from({ length: 9 }, (_, i) => { const a = -0.9 + i * 0.22, R = 250 + (i % 3) * 40, h = 55 + (i % 4) * 18;
        return <group key={`mt${i}`} position={[Math.sin(a) * R, -5, -Math.cos(a) * R]}>
          <mesh material={r.mtn} position={[0, h / 2, 0]}><coneGeometry args={[h * 0.9, h, 7]} /></mesh>
          <mesh material={r.mtnSnow} position={[0, h * 0.78, 0]}><coneGeometry args={[h * 0.9 * 0.44, h * 0.44, 7]} /></mesh>
        </group>; })}
      <FloraField items={[...ICE_FLORA, ...ICE_BACK]} ground={snowY} cam={cam} t={t} pal="snow" wind={0.6} />
      <FloraField items={ICE_GRASS} ground={snowY} cam={cam} t={t} pal="dry" wind={1.2} tint="#E8ECF2" />
      {r.flakes.map((f, i) => <sprite key={`fl${i}`} material={r.flake} position={[f.x + Math.sin(t * 0.7 + f.ph) * 0.6 + t * 0.8 % 50, ((f.y - t * 1.1) % 20 + 20) % 20, f.z]} scale={[f.s, f.s, 1]} userData={{ noNormal: true }} />)}
    </group>
  );
};

// ------------------------------------------------------------------ demo: 5 s sea, 5 s Ice Age
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
const SHOTS: { t: number; set: "sea" | "ice"; a: Cam; b: Cam }[] = [
  { t: 0, set: "sea", a: { pos: [0, 3.5, 30], look: [0, 6, 0], fov: 46 }, b: { pos: [0, 3.2, 26], look: [0, 6.5, 0], fov: 46 } },                 // wide: mosasaur across, meg far
  { t: 1.8, set: "sea", a: { pos: [11, 1.4, 11], look: [6.5, 8, 0], fov: 50, roll: -6 }, b: { pos: [11.5, 1.2, 10], look: [7, 8.5, 0], fov: 50, roll: -7 } }, // low: the bite under the light shafts
  { t: 3.4, set: "sea", a: { pos: [-9, 3.0, 5], look: [-12, 2.6, -6], fov: 40 }, b: { pos: [-9.5, 3.0, 4], look: [-12, 2.8, -6], fov: 40 } },    // Dunkleosteus + ammonites
  { t: 5, set: "ice", a: { pos: [2, 2.6, 36], look: [0, 4, 0], fov: 44 }, b: { pos: [0, 2.6, 32], look: [-1, 4, 0], fov: 44 } },               // wide: glacier, mammoths
  { t: 6.8, set: "ice", a: { pos: [7, 0.7, 9], look: [1, 1.8, 0], fov: 48, roll: 5 }, b: { pos: [6.5, 0.6, 8], look: [1, 1.8, 0], fov: 48, roll: 6 } }, // rhino charge, low
  { t: 8.4, set: "ice", a: { pos: [-5.2, 1.5, 16], look: [-5.4, 1.4, 0], fov: 42 }, b: { pos: [-5.4, 1.5, 14.5], look: [-5.4, 1.5, 0], fov: 42 } },       // Smilodon vs cave bear
];
const END = 10;
function camAt(t: number) {
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END, k = ease(clamp01((t - s.t) / (t1 - s.t)));
  return { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), roll: lerp(s.a.roll ?? 0, s.b.roll ?? 0, k), i, set: s.set };
}
const CamSet: React.FC<{ c: ReturnType<typeof camAt> }> = ({ c }) => {
  const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = ASPECT; cc.updateProjectionMatrix();
  cc.lookAt(...c.look); cc.rotateZ(THREE.MathUtils.degToRad(c.roll)); cc.updateMatrixWorld();
  return null;
};
const GLB = ["tree_pineTallA", "tree_pineRoundC", "tree_cone_dark", "grass", "grass_large", "rock_largeA", "rock_largeC", "rock_tallA", "rock_smallA"];
export const win = (t: number, a: number, b: number) => t >= a && t < b;

export const ToonSetsDemo: React.FC<{ set?: "sea" | "ice" }> = () => {
  const f = useCurrentFrame(), t = f / 30;
  const models = useModels([], GLB);
  const c = camAt(t), cam = { pos: c.pos, look: c.look };
  const sea = c.set === "sea";
  const sun = sea ? SEA.sun : ICE.sun;
  const focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  const bite = win(t, 2.2, 3.4) ? ease(clamp01((t - 2.2) / 0.3)) : 0;
  const charge = win(t, 7.2, 8.4) ? ease(clamp01((t - 7.2) / 0.3)) : 0;
  const rhinoX = lerp(4, -0.5, clamp01((t - 6.8) / 1.6));
  return (
    <AbsoluteFill style={{ background: sea ? SEA.hor : ICE.fog }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={c} />
          <fogExp2 attach="fog" args={[new THREE.Color(sea ? SEA.fog : ICE.fog).getHex(), sea ? 0.028 : 0.0045]} />
          <hemisphereLight args={[new THREE.Color(sea ? "#9FE6EE" : "#DCE8FF"), new THREE.Color(sea ? "#1E4A5A" : "#8A8E9A"), sea ? 1.0 : 1.15]} />
          <directionalLight position={sun} intensity={sea ? 1.9 : 2.2} color={sea ? "#DFFBFF" : "#FFE9CC"} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
            shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} />
          {sea ? (
            <group>
              <SeaSet models={models} t={t} cam={cam} />
              <BeastCard3D name="mosa" t={t} sun={sun} anchor={520} pos={[lerp(-7, 6, clamp01(t / 3.4)), 8, 0]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 0.8, roar: bite }} />
              <BeastCard3D name="meg" t={t} sun={sun} anchor={520} pos={[lerp(30, 10, clamp01(t / 5)), 13, -26]} heading={Math.PI} cam={cam} pose={{ walk: 1, phase: t * 0.7 }} />
              <BeastCard3D name="dunkle" t={t} sun={sun} anchor={520} pos={[lerp(-9, -13, clamp01((t - 3.4) / 1.6)), 2.6, -6]} heading={Math.PI} cam={cam} pose={{ walk: 1, phase: t * 1.1, roar: win(t, 4.0, 5) ? 1 : 0 }} />
            </group>
          ) : (
            <group>
              <IceSet models={models} t={t} cam={cam} />
              {c.i === 3 && [[-6, -16, 0.0], [2, -20, 0.3], [9, -14, 0.6], [15, -22, 0.15]].map(([x, z, ph], i) => (
                <BeastCard3D key={i} name="mammoth" t={t} sun={sun} pos={[x - (t - 5) * 1.2, snowY(x, z), z]} heading={Math.PI} cam={cam} pose={{ walk: 1, phase: t * 0.7 + ph, expr: "angry" }} />))}
              <BeastCard3D name="rhino" t={t} sun={sun} pos={[rhinoX, snowY(rhinoX, 0), 0]} heading={Math.PI} cam={cam} pose={{ walk: 1, phase: t * 1.4, roar: charge }} />
              <BeastCard3D name="smilo" t={t} sun={sun} pos={[-7.8, snowY(-7.8, 0.5), 0.5]} heading={0} cam={cam} pose={{ roar: win(t, 8.9, 10) ? 1 : 0 }} />
              <BeastCard3D name="bear" t={t} sun={sun} pos={[-3.2, snowY(-3.2, -1), -1]} heading={Math.PI} cam={cam} pose={{ roar: win(t, 9.2, 10) ? 1 : 0 }} />
            </group>
          )}
          <InkPass p={{ focus, blur: c.i === 1 || c.i === 4 ? 9 : 4, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: sea ? 0.55 : 0.4, warm: sea ? 0 : 0.1 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
