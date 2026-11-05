// Fossil toon sets, part 2 (2026-11-04, user: "làm tiếp hang đá với núi lửa đi"): same toon ramp + ink pass.
//   CaveSet     — a limestone chamber (noise-bent dome seen from inside), the cave mouth open to a bright snowy day,
//                 a campfire as the key light (flickering flames, embers, smoke; a spot light from the fire throws the
//                 animals' shadows onto the walls), stalactites + stalagmites, a cave bear den of scattered bones,
//                 ochre/charcoal cave paintings (mammoths, a horse, hand stencils, our own drawings) painted straight
//                 into the back-wall shader so they follow the rock.
//   VolcanoSet  — cracked basalt plain with glowing lava seams, a lava river with drifting crust plates, a big volcano
//                 with lava streaks and a crater glow, an eruption plume lit orange from below, lava bombs on arcs,
//                 falling ash + rising embers, charred trees, dark rocks, a red-brown sky.
// Heights: caveFloorY(x, z) / basaltY(x, z). ToonSetsDemo2 (10 s): cave shots then volcano shots.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Pen } from "./toon";
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { FloraField, scatter } from "./FloraField";
import { V3, clamp01, ease, lerp, lerpV, toon } from "./World";
import { BeastCard3D, canvasTex, domeMat, glowTex, heightPlane, rng, toonWP, win } from "./ToonSets";

const W = 1080, H = 1920, ASPECT = W / H;
const INKC = "#0E080C";
const flameTex = () => canvasTex(128, 256, (g) => {
  const gr = g.createRadialGradient(64, 190, 4, 64, 170, 110);
  gr.addColorStop(0, "rgba(255,250,210,1)"); gr.addColorStop(0.3, "rgba(255,200,80,0.95)"); gr.addColorStop(0.65, "rgba(240,90,20,0.6)"); gr.addColorStop(1, "rgba(200,40,10,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(64, 10); g.bezierCurveTo(100, 90, 124, 150, 110, 210); g.quadraticCurveTo(64, 260, 18, 210); g.bezierCurveTo(4, 150, 28, 90, 64, 10); g.fill();
});
const puffTex = () => canvasTex(128, 128, (g) => {
  const r = rng(5);
  for (let i = 0; i < 9; i++) { const x = 34 + r() * 60, y = 34 + r() * 60, rr = 20 + r() * 22; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
});

// ------------------------------------------------------------------ cave paintings (our own drawings), 1024 x 512, transparent
const paintingTex = () => canvasTex(1024, 512, (g) => {
  const ochre = "rgba(168,62,30,0.85)", black = "rgba(30,20,18,0.85)", yellow = "rgba(196,140,52,0.8)";
  g.lineCap = "round"; g.lineJoin = "round";
  const mammoth = (x: number, y: number, s: number, col: string) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-90, 10); g.bezierCurveTo(-90, -60, -40, -70, 0, -80); g.bezierCurveTo(30, -100, 70, -80, 80, -40); // back + hump + head
    g.bezierCurveTo(95, 0, 100, 40, 85, 70); g.stroke(); // trunk
    g.beginPath(); g.moveTo(70, -10); g.bezierCurveTo(110, 10, 130, -10, 125, -40); g.stroke(); // tusk
    for (const lx of [-70, -40, 30, 55]) { g.beginPath(); g.moveTo(lx, 10); g.lineTo(lx + 4, 70); g.stroke(); }
    g.beginPath(); g.moveTo(-90, 10); g.quadraticCurveTo(0, 40, 60, 15); g.stroke();
    g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-70 + i * 14, 20); g.lineTo(-74 + i * 14, 40); g.stroke(); } // hair fringe
    g.restore();
  };
  const horse = (x: number, y: number, s: number) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = yellow; g.strokeStyle = black; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-70, -10); g.quadraticCurveTo(-20, -40, 30, -30); g.quadraticCurveTo(60, -70, 85, -60); g.quadraticCurveTo(95, -45, 70, -30); g.quadraticCurveTo(60, 0, 40, 10);
    g.quadraticCurveTo(-10, 25, -60, 15); g.quadraticCurveTo(-85, 0, -70, -10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(30, -36); g.quadraticCurveTo(50, -62, 70, -62); g.lineWidth = 10; g.stroke(); // mane
    g.lineWidth = 6; for (const lx of [-55, -35, 20, 35]) { g.beginPath(); g.moveTo(lx, 12); g.lineTo(lx + (lx > 0 ? 6 : -4), 55); g.stroke(); }
    g.beginPath(); g.moveTo(-75, -5); g.quadraticCurveTo(-100, 10, -95, 40); g.stroke();
    g.restore();
  };
  const hand = (x: number, y: number, s: number, a: number) => { // sprayed stencil: halo of pigment, the hand left bare
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
    const gr = g.createRadialGradient(0, 0, 20, 0, 0, 80); gr.addColorStop(0, "rgba(160,50,24,0.85)"); gr.addColorStop(1, "rgba(160,50,24,0)"); g.fillStyle = gr; g.fillRect(-90, -90, 180, 180);
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
    g.beginPath(); g.ellipse(0, 18, 26, 30, 0, 0, Math.PI * 2); g.fill();
    for (const [fx, fl, fa] of [[-22, 34, -0.5], [-9, 46, -0.15], [4, 50, 0], [17, 44, 0.15], [28, 30, 0.6]] as [number, number, number][]) { g.save(); g.translate(fx, 0); g.rotate(fa); g.beginPath(); g.ellipse(0, -fl / 2, 7, fl / 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.restore();
  };
  mammoth(300, 240, 1.25, ochre); mammoth(560, 300, 0.9, black); horse(800, 220, 1.1); mammoth(140, 380, 0.6, black);
  hand(110, 120, 0.8, -0.3); hand(190, 100, 0.7, 0.2); hand(930, 380, 0.75, 0.4); hand(690, 120, 0.6, -0.2);
  g.fillStyle = ochre; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(420 + i * 22, 440 + Math.sin(i) * 8, 7, 0, Math.PI * 2); g.fill(); } // dot row
});

// ------------------------------------------------------------------ CAVE
const CAM0 = { pos: [0, 3, 30] as V3 };
const CAVE_FLORA = scatter(5, 40, [["rockpile", 2], ["boulder", 1.5], ["mushrooms", 2], ["pebbles", 2], ["bones", 1]], [-16, 16, -12, 5], [-8, 8, -7]);
export const CAVE = { rx: 22, ry: 10, rz: 16, cy: 1.6, fire: [2.2, 0, -2.5] as V3, mouthW: 6.5, mouthH: 7.5, day: "#FFF8EC", fog: "#2A1E1A" };
export const caveFloorY = (x: number, z: number) => 0.22 * Math.sin(x * 0.7 + z * 0.3) + 0.15 * Math.sin(z * 0.9 - x * 0.4) + 0.04 * Math.sin(x * 3.1 + z * 2.3);
const n3 = (x: number, y: number, z: number) => Math.sin(x * 2.1 + y * 1.3) * 0.5 + Math.sin(y * 3.7 - z * 2.2) * 0.3 + Math.sin(z * 5.3 + x * 4.1) * 0.15 + Math.sin(x * 9.0 + y * 8.0 + z * 7.0) * 0.06;
function chamberGeo() {
  const g = new THREE.SphereGeometry(1, 120, 80), p = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const flat = clamp01((-v.z - 0.8) / 0.12) * clamp01((0.45 - Math.abs(v.x)) / 0.1) * clamp01((0.55 - Math.abs(v.y - 0.25)) / 0.1); // smooth wall for the paintings
    const d = 1 + 0.11 * n3(v.x * 2, v.y * 2, v.z * 2) * (1 - 0.85 * flat);
    p.setXYZ(i, v.x * CAVE.rx * d, CAVE.cy + v.y * CAVE.ry * d, v.z * CAVE.rz * d);
  }
  g.computeVertexNormals(); return g;
}
const ceilY = (x: number, z: number) => CAVE.cy + CAVE.ry * Math.sqrt(Math.max(0, 1 - (x / CAVE.rx) ** 2 - (z / CAVE.rz) ** 2)) * 0.9;

export const CaveSet: React.FC<{ models: Models; t: number; cam?: { pos: V3 } }> = ({ models, t, cam = CAM0 }) => {
  const r = useMemo(() => {
    const uT = { value: 0 }, uPaint = { value: paintingTex() };
    const wall = toonWP("#7A6656", uT, `
      float st = sin(vWP.y * 2.6 + sin(vWP.x * 0.8) * 1.5) * 0.5 + 0.5;
      diffuseColor.rgb *= 0.82 + 0.18 * st;                                                   // strata bands
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.36, 0.3), smoothstep(0.82, 1.0, sin(vWP.x * 1.7 + vWP.y * 0.4)) * 0.35); // damp streaks
      if (vWP.z > 6.0 && pow(vWP.x / ${CAVE.mouthW.toFixed(1)}, 2.0) + pow((vWP.y - 0.6) / ${CAVE.mouthH.toFixed(1)}, 2.0) < 1.0) discard;  // the mouth
      if (vWP.z < -10.0) { vec2 puv = vec2((vWP.x + 4.5) / 9.0, (vWP.y - 1.6) / 4.5);
        if (puv.x > 0.0 && puv.x < 1.0 && puv.y > 0.0 && puv.y < 1.0) { vec4 pc = texture2D(uPaint, puv); diffuseColor.rgb = mix(diffuseColor.rgb, pc.rgb, pc.a * 0.85); } }`,
      { side: THREE.BackSide }, { uPaint }, "uniform sampler2D uPaint;");
    const floor = toonWP("#5E4E40", uT, `diffuseColor.rgb *= 0.85 + 0.15 * sin(vWP.x * 1.9 + vWP.z * 1.1) * sin(vWP.z * 2.3);`);
    const drip = toon({ color: new THREE.Color("#9C8A72") }), bone = toon({ color: new THREE.Color("#D8C8A0") }), log = toon({ color: new THREE.Color("#3A2618") }), stone = toon({ color: new THREE.Color("#4A403A") });
    const day = new THREE.MeshBasicMaterial({ color: CAVE.day, fog: false });
    const flame = new THREE.SpriteMaterial({ map: flameTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const ember = new THREE.SpriteMaterial({ map: glowTex(), color: "#FFA040", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const smoke = new THREE.SpriteMaterial({ map: puffTex(), color: "#5A4E48", transparent: true, opacity: 0.35, depthWrite: false });
    const rr = rng(21);
    const tites = Array.from({ length: 70 }, () => { const x = (rr() - 0.5) * 34, z = -13 + rr() * 22; return { x, z, h: 0.6 + rr() * 2.6, r: 0.12 + rr() * 0.3 }; })
      .filter((q) => !(q.z > 5 && Math.abs(q.x) < 8));
    const mites = Array.from({ length: 30 }, () => { const x = (rr() - 0.5) * 34, z = -12 + rr() * 18; return { x, z, h: 0.4 + rr() * 1.8, r: 0.15 + rr() * 0.35 }; })
      .filter((q) => !(q.x > -9 && q.x < 9 && q.z > -6)); // keep the floor in front of the fire clear
    const bones = Array.from({ length: 16 }, () => ({ x: -10 + rr() * 5, z: -6 + rr() * 5, a: rr() * 6, l: 0.4 + rr() * 0.6, k: rr() }));
    const embers = Array.from({ length: 40 }, () => ({ ph: rr() * 6, x: (rr() - 0.5) * 0.8, z: (rr() - 0.5) * 0.8, sp: 0.6 + rr() * 0.8 }));
    const tgt = new THREE.Object3D(); tgt.position.set(-2, 3, -15);
    return { uT, wall, floor, drip, bone, log, stone, day, flame, ember, smoke, tites, mites, bones, embers, tgt, chamber: chamberGeo(), floorG: heightPlane(90, 140, caveFloorY) };
  }, []);
  r.uT.value = t;
  const fl = 1 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 37 + 1) + 0.05 * Math.sin(t * 61);
  const [fx, , fz] = CAVE.fire;
  return (
    <group>
      <mesh geometry={r.chamber} material={r.wall} receiveShadow castShadow />
      <mesh geometry={r.floorG} material={r.floor} receiveShadow />
      <mesh material={r.day} position={[0, 10, 60]} userData={{ noNormal: true }}><planeGeometry args={[300, 120]} /></mesh>
      <mesh material={r.day} position={[0, 0.02, 36]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noNormal: true }}><planeGeometry args={[300, 40]} /></mesh>
      {r.tites.map((q, i) => <mesh key={`t${i}`} material={r.drip} position={[q.x, ceilY(q.x, q.z) - q.h / 2 + 0.4, q.z]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[q.r, q.h + 0.8, 7]} /></mesh>)}
      {r.mites.map((q, i) => <mesh key={`m${i}`} material={r.drip} position={[q.x, caveFloorY(q.x, q.z) + q.h / 2 - 0.1, q.z]} castShadow><coneGeometry args={[q.r, q.h, 7]} /></mesh>)}
      {r.bones.map((b, i) => <group key={`b${i}`} position={[b.x, caveFloorY(b.x, b.z) + 0.06, b.z]} rotation={[0, b.a, 0]}>
        {b.k < 0.8 ? <>
          <mesh material={r.bone} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.04, 0.05, b.l, 6]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={r.bone} position={[s * b.l / 2, 0.02, 0]} castShadow><sphereGeometry args={[0.08, 8, 6]} /></mesh>)}
        </> : <>
          <mesh material={r.bone} position={[0, 0.16, 0]} scale={[1.4, 0.9, 1]} castShadow><sphereGeometry args={[0.2, 10, 8]} /></mesh>
          <mesh material={r.bone} position={[0.28, 0.1, 0]} castShadow><boxGeometry args={[0.3, 0.14, 0.18]} /></mesh>
        </>}
      </group>)}
      {/* campfire: stone ring, crossed logs, flames, embers, smoke */}
      <group position={[fx, caveFloorY(fx, fz), fz]}>
        {Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return <mesh key={i} material={r.stone} position={[Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75]} scale={[1.2, 0.7, 1]} castShadow><sphereGeometry args={[0.16, 8, 6]} /></mesh>; })}
        {[0, 1.1, 2.2].map((a, i) => <mesh key={i} material={r.log} position={[0, 0.12, 0]} rotation={[0, a, Math.PI / 2 - 0.25]}><cylinderGeometry args={[0.07, 0.08, 1.1, 6]} /></mesh>)}
        {[0, 1, 2, 3, 4].map((i) => { const s = (0.8 + 0.25 * Math.sin(t * (9 + i) + i * 2)) * (i ? 0.7 : 1.1);
          return <sprite key={i} material={r.flame} position={[Math.sin(i * 2.3) * 0.22, 0.45 * s + 0.1, Math.cos(i * 2.3) * 0.22]} scale={[0.6 * s, 1.1 * s, 1]} userData={{ noNormal: true }} />; })}
        {r.embers.map((e, i) => { const k = ((t * e.sp + e.ph) % 2.4) / 2.4; return <sprite key={`e${i}`} material={r.ember} position={[e.x + Math.sin(t * 3 + e.ph) * 0.15 * k, 0.3 + k * 3.2, e.z]} scale={[0.07 * (1 - k), 0.07 * (1 - k), 1]} userData={{ noNormal: true }} />; })}
        {[0, 1, 2, 3, 4, 5].map((i) => { const k = ((t * 0.25 + i / 6) % 1); return <sprite key={`s${i}`} material={r.smoke} position={[Math.sin(i * 1.7 + t * 0.3) * 0.4, 1.4 + k * 5, -k * 0.8]} scale={[1 + k * 3, 1 + k * 3, 1]} userData={{ noNormal: true }} />; })}
        <pointLight position={[0, 1.0, 0]} intensity={26 * fl} distance={0} decay={1.4} color="#FF9A48" />
      </group>
      <FloraField items={CAVE_FLORA} ground={caveFloorY} cam={cam} t={t} pal="cave" wind={0.2} tint="#9A7A66" />
      <primitive object={r.tgt} />
      <spotLight position={[fx, 1.1, fz + 0.2]} target={r.tgt} angle={1.25} penumbra={0.7} intensity={70 * fl} decay={1.3} distance={0} color="#FFB060" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-normalBias={0.04} shadow-camera-near={0.3} shadow-camera-far={40} />
    </group>
  );
};

// ------------------------------------------------------------------ VOLCANO
const VOL_FLORA = [...scatter(29, 80, [["deadtree", 3], ["boulder", 2], ["rockpile", 2], ["pebbles", 1.5], ["fern", 0.6]], [-75, 75, -70, 25], [-18, 16, -14]),
  ...scatter(30, 40, [["deadtree", 2], ["boulder", 2], ["rockpile", 2], ["pebbles", 2]], [-26, 26, -30, -12]), ...scatter(31, 20, [["pebbles", 2], ["rockpile", 2]], [-16, 16, 6, 22], [-7, 7, -99], 0.6)];
export const VOL = { fog: "#5A3328", sun: [-30, 10, 30] as V3, cone: [20, 0, -170] as V3, coneR: 110, coneH: 72, riverZ: -9 };
const RIVER = (x: number) => VOL.riverZ + 2.2 * Math.sin(x * 0.08) + 1.2 * Math.sin(x * 0.21 + 1);
export const basaltY = (x: number, z: number) => {
  const d = Math.abs(z - RIVER(x));
  return 0.35 * Math.sin(x * 0.17 + z * 0.09) + 0.25 * Math.sin(z * 0.23 - x * 0.11) + 0.06 * Math.sin(x * 1.7 + z * 1.3) - (d < 3.2 ? 0.9 * (1 - d / 3.2) ** 1.5 : 0);
};
function volcanoGeo() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 30; i++) { const k = i / 30; pts.push(new THREE.Vector2(VOL.coneR * (1 - k) ** 1.6 + 16, VOL.coneH * k)); }
  pts.push(new THREE.Vector2(13, VOL.coneH - 4)); // crater lip dips in
  const g = new THREE.LatheGeometry(pts, 64), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const k = 1 + 0.05 * Math.sin(a * 7 + y * 0.1) + 0.03 * Math.sin(a * 17); p.setXYZ(i, x * k, y, z * k); }
  g.computeVertexNormals(); return g;
}
export const VolcanoSet: React.FC<{ models: Models; t: number; erupt?: number; cam?: { pos: V3 } }> = ({ models, t, erupt = 1, cam = CAM0 }) => {
  const r = useMemo(() => {
    const uT = { value: 0 };
    const ground = toonWP("#3A3330", uT, `diffuseColor.rgb *= 0.85 + 0.15 * sin(vWP.x * 2.3 + vWP.z * 1.7);`, {}, {}, "",
      `float cr = abs(sin(vWP.x * 0.9 + sin(vWP.z * 0.7) * 2.0) * sin(vWP.z * 0.8 + sin(vWP.x * 0.5) * 1.6));
       float seam = smoothstep(0.022, 0.0, cr) * smoothstep(0.2, 0.7, sin(vWP.x * 0.13 + vWP.z * 0.21) * 0.5 + 0.5) * (0.7 + 0.3 * sin(uT * 2.0 + vWP.x));
       totalEmissiveRadiance += vec3(1.4, 0.4, 0.07) * seam;                                               // glowing cracks`);
    const cone = toonWP("#2E2826", uT, `diffuseColor.rgb *= 0.8 + 0.2 * sin(vWP.y * 0.6);`, {}, {}, "",
      `float a = atan(vWP.z - ${VOL.cone[2].toFixed(1)}, vWP.x - ${VOL.cone[0].toFixed(1)});
       float rib = smoothstep(0.93, 1.0, sin(a * 9.0 + sin(vWP.y * 0.12) * 1.5)) * smoothstep(${(VOL.coneH * 0.25).toFixed(1)}, ${(VOL.coneH * 0.95).toFixed(1)}, vWP.y);
       float lip = smoothstep(${(VOL.coneH - 8).toFixed(1)}, ${VOL.coneH.toFixed(1)}, vWP.y);
       totalEmissiveRadiance += vec3(2.2, 0.6, 0.1) * (rib * (0.8 + 0.2 * sin(uT * 1.5 + vWP.y * 0.2)) + lip * 1.2);   // lava streaks + crater`);
    const lava = new THREE.ShaderMaterial({ fog: false, uniforms: { uT },
      vertexShader: "varying vec3 vWP; void main(){ vWP = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWP, 1.0); }",
      fragmentShader: `varying vec3 vWP; uniform float uT;
        void main(){ vec2 p = vec2(vWP.x - uT * 0.9, vWP.z);
          float c = sin(p.x * 1.3 + sin(p.y * 2.1) * 1.2) * sin(p.y * 1.7 + sin(p.x * 0.9) * 1.4);
          float crust = smoothstep(0.25, 0.55, c);
          vec3 hot = mix(vec3(1.0, 0.86, 0.35), vec3(1.0, 0.42, 0.08), smoothstep(-0.6, 0.3, c));
          gl_FragColor = vec4(mix(hot * 1.6, vec3(0.14, 0.09, 0.08), crust), 1.0); }` });
    const plume = [new THREE.SpriteMaterial({ map: puffTex(), color: "#1E1818", transparent: true, opacity: 0.95, depthWrite: false, fog: false }),
      new THREE.SpriteMaterial({ map: puffTex(), color: "#6E5A56", transparent: true, opacity: 0.92, depthWrite: false, fog: false }),
      new THREE.SpriteMaterial({ map: puffTex(), color: "#C8582A", transparent: true, opacity: 0.75, depthWrite: false, fog: false })];
    const ember = new THREE.SpriteMaterial({ map: glowTex(), color: "#FF8A30", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const ash = new THREE.SpriteMaterial({ map: glowTex(), color: "#9A9090", transparent: true, opacity: 0.7, depthWrite: false });
    const rr = rng(31);
    const props = Array.from({ length: 200 }, () => ({ x: (rr() - 0.5) * 150, z: -70 + rr() * 95, k: rr(), s: rr() }))
      .filter((q) => !(q.x > -18 && q.x < 16 && q.z > -14) && Math.abs(q.z - RIVER(q.x)) > 4).slice(0, 70);
    const puffs = Array.from({ length: 90 }, (_, i) => ({ ph: i / 90, dx: (rr() - 0.5) * 40, dz: (rr() - 0.5) * 30, s: 0.8 + rr() * 0.7 }));
    const bombs = Array.from({ length: 24 }, () => ({ ph: rr(), a: rr() * Math.PI * 2, v: 25 + rr() * 30, up: 40 + rr() * 30 }));
    const ashP = Array.from({ length: 220 }, () => ({ x: (rr() - 0.5) * 50, y: rr() * 22, z: -25 + rr() * 45, s: 0.04 + rr() * 0.06, ph: rr() * 6 }));
    const embersP = Array.from({ length: 60 }, () => ({ x: (rr() - 0.5) * 50, ph: rr() * 4, sp: 0.5 + rr() }));
    return { uT, ground, cone, lava, plume, ember, ash, props, puffs, bombs, ashP, embersP, groundG: heightPlane(700, 260, basaltY), coneG: volcanoGeo(), dome: domeMat("#1E1416", "#A8482A", "#2A1A14") };
  }, []);
  r.uT.value = t;
  const [cx, , cz] = VOL.cone, top = VOL.coneH;
  const riverG = useMemo(() => { const g = new THREE.PlaneGeometry(240, 1, 240, 1); g.rotateX(-Math.PI / 2); const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), side = p.getZ(i) > 0 ? 1 : -1; p.setXYZ(i, x, -0.42, RIVER(x) + side * 1.9); } g.computeVertexNormals(); return g; }, []);
  return (
    <group>
      <mesh material={r.dome} userData={{ noNormal: true }} renderOrder={-10}><sphereGeometry args={[1800, 48, 24]} /></mesh>
      <mesh geometry={r.groundG} material={r.ground} receiveShadow />
      <mesh geometry={riverG} material={r.lava} userData={{ noNormal: true }} />
      <mesh geometry={r.coneG} material={r.cone} position={[cx, -2, cz]} />
      <FloraField items={VOL_FLORA.filter((q) => Math.abs(q.z - RIVER(q.x)) > 4)} ground={basaltY} cam={cam} t={t} pal="ash" wind={0.7} tint="#D8A898" />
      {/* eruption plume: puffs rise from the crater and spread; the lowest glow from the lava */}
      {r.puffs.map((pf, i) => { const k = (pf.ph + t * 0.05) % 1, y = top - 4 + k * 190 * erupt, s = (26 + k * 130) * pf.s * (0.3 + 0.7 * erupt);
        return <sprite key={`p${i}`} material={r.plume[k < 0.12 ? 2 : i % 2]} position={[cx + pf.dx * k * 2 + k * 30, y, cz + pf.dz * k]} scale={[s, s, 1]} userData={{ noNormal: true }} />; })}
      {r.bombs.map((b, i) => { const k = (b.ph + t * 0.35) % 1, tt = k * 3.2; const x = cx + Math.cos(b.a) * b.v * tt, z = cz + Math.sin(b.a) * b.v * tt * 0.6, y = top + b.up * tt - 0.5 * 30 * tt * tt;
        return y > 0 && erupt > 0.2 ? <sprite key={`bo${i}`} material={r.ember} position={[x, y, z]} scale={[4, 4, 1]} userData={{ noNormal: true }} /> : null; })}
      {r.ashP.map((a, i) => <sprite key={`a${i}`} material={r.ash} position={[a.x + Math.sin(t * 0.6 + a.ph) * 0.5, ((a.y - t * 0.9) % 22 + 22) % 22, a.z]} scale={[a.s, a.s, 1]} userData={{ noNormal: true }} />)}
      {r.embersP.map((e, i) => { const k = ((t * e.sp * 0.4 + e.ph) % 1); return <sprite key={`em${i}`} material={r.ember} position={[e.x + Math.sin(t + e.ph) * 0.5, -0.2 + k * 5, RIVER(e.x) + Math.sin(e.ph * 3) * 1.4]} scale={[0.12 * (1 - k), 0.12 * (1 - k), 1]} userData={{ noNormal: true }} />; })}
      <pointLight position={[0, 1.5, VOL.riverZ]} intensity={60} distance={0} decay={1.2} color="#FF6A20" />
    </group>
  );
};

// ------------------------------------------------------------------ demo: 5 s cave, 5 s volcano
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
const SHOTS: { t: number; set: "cave" | "vol"; a: Cam; b: Cam }[] = [
  { t: 0, set: "cave", a: { pos: [4, 2.2, 9], look: [-1, 2.6, -8], fov: 52 }, b: { pos: [3.5, 2.0, 8], look: [-1, 2.6, -8], fov: 52 } },              // wide: fire, bear, paintings
  { t: 1.8, set: "cave", a: { pos: [0.6, 2.8, 1.5], look: [0, 3.8, -15], fov: 44 }, b: { pos: [0.4, 2.8, 0], look: [0, 3.8, -15], fov: 44 } },  // the paintings, firelit
  { t: 3.3, set: "cave", a: { pos: [3, 1.1, -8], look: [1.5, 2.2, 8], fov: 50, roll: -4 }, b: { pos: [3, 1.0, -9], look: [1.5, 2.0, 8], fov: 50, roll: -5 } }, // looking out: Smilodon in the mouth
  { t: 5, set: "vol", a: { pos: [0, 3.5, 30], look: [4, 14, -60], fov: 50 }, b: { pos: [0, 3.0, 26], look: [4, 16, -60], fov: 50 } },                 // wide: eruption, rex
  { t: 6.8, set: "vol", a: { pos: [6, 0.8, 10], look: [0, 5, 0], fov: 48, roll: -5 }, b: { pos: [6.5, 0.7, 9], look: [0, 5.3, 0], fov: 48, roll: -6 } }, // low: rex roar
  { t: 8.4, set: "vol", a: { pos: [15, 2.2, 7], look: [4.5, 2.2, -6], fov: 42 }, b: { pos: [14, 2.1, 6], look: [4.5, 2.2, -6], fov: 42 } },               // trike at the lava river
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
const GLB = ["tree_tall", "tree_cone_dark", "stump_round", "rock_largeA", "rock_largeC", "rock_tallA", "rock_smallA"];

export const ToonSetsDemo2: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30;
  const models = useModels([], GLB);
  const c = camAt(t), cam = { pos: c.pos, look: c.look };
  const cave = c.set === "cave";
  const focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  const fireSun: V3 = [CAVE.fire[0], 1.2, CAVE.fire[2]];
  const roar = win(t, 6.9, 8.4) ? ease(clamp01((t - 6.9) / 0.25)) : 0;
  const rexX = lerp(-6, -0.5, clamp01((t - 5) / 1.8));
  return (
    <AbsoluteFill style={{ background: cave ? CAVE.fog : VOL.fog }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={c} />
          <fogExp2 attach="fog" args={[new THREE.Color(cave ? CAVE.fog : VOL.fog).getHex(), cave ? 0.03 : 0.006]} />
          {cave ? (
            <group>
              <hemisphereLight args={[new THREE.Color("#6A6A80"), new THREE.Color("#2A1E18"), 0.35]} />
              <directionalLight position={[0, 6, 40]} intensity={0.45} color="#CFE0FF" />
              <CaveSet models={models} t={t} cam={cam} />
              <BeastCard3D name="bear" t={t} sun={fireSun} pos={[-2.8, 0, -4.5]} heading={0} cam={cam} pose={{ roar: win(t, 0.8, 1.8) ? 1 : 0 }} />
              <BeastCard3D name="smilo" t={t} sun={[0, 6, 40]} pos={[lerp(3.5, 1.2, clamp01((t - 3.3) / 1.4)), 0, 8.8]} heading={Math.PI} cam={cam} pose={{ walk: t < 4.7 ? 1 : 0, phase: t, roar: t > 4.7 ? 1 : 0 }} />
            </group>
          ) : (
            <group>
              <hemisphereLight args={[new THREE.Color("#B07A6A"), new THREE.Color("#2A1A14"), 0.75]} />
              <directionalLight position={VOL.sun} intensity={1.6} color="#FF9A64" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
                shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} />
              <VolcanoSet models={models} t={t} cam={cam} />
              {c.i !== 5 && <BeastCard3D name="rex" t={t} sun={VOL.sun} pos={[rexX, 0, 0]} heading={0} cam={cam} pose={{ walk: t < 6.8 ? 1 : 0, phase: t * 0.9, roar }} />}
              <BeastCard3D name="trike" t={t} sun={VOL.sun} pos={[4.5, 0, -5]} heading={Math.PI} cam={cam} pose={{ expr: t > 8.6 ? "shock" : "angry" }} />
            </group>
          )}
          <InkPass p={{ focus, blur: c.i === 1 || c.i === 4 ? 9 : 4, night: cave ? 0.25 : 0.2, cow: 0, flash: 0, redPulse: !cave && roar > 0 ? 0.2 * roar : 0, ink: 1, cold: cave ? 0.1 : 0, warm: cave ? 0.45 : 0.5 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
