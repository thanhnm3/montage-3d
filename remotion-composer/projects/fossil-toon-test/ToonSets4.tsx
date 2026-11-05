// Jurassic forest set (2026-11-05): the hand-drawn flora kit in full — araucarias and tree ferns behind, cycads,
// horsetails and ferns in the mid-ground, a fern / grass / log / boulder floor, mossy ground with leaf litter, a stream,
// soft god rays and drifting pollen. Everything sways (FloraField). ForestDemo (6 s): Allosaurus stalks a Stegosaurus,
// an eastern dragon glides over the canopy; the cards breathe / sway (cardMotion).
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { Sky, V3, clamp01, ease, lerp, lerpV } from "./World";
import { BeastCard3D, glowTex, heightPlane, toonWP } from "./ToonSets";
import { FloraField, scatter } from "./FloraField";
import { keys, ramp } from "./cardMotion";

const W = 1080, H = 1920;
export const FOREST = { fog: "#B8C8A0", sun: [-24, 34, 26] as V3, streamZ: -16 };
export const forestY = (x: number, z: number) => { const d = Math.abs(z - (FOREST.streamZ + 3 * Math.sin(x * 0.1))); return 0.3 * Math.sin(x * 0.11 + z * 0.07) + 0.22 * Math.sin(z * 0.15 - x * 0.05) - (d < 2.6 ? 0.7 * (1 - d / 2.6) ** 2 : 0); };
const CLEAR: [number, number, number] = [-14, 14, -9];
const TALL = [...scatter(51, 60, [["araucaria", 3], ["treefern", 3], ["palm", 1]], [-80, 80, -80, -22]), ...scatter(52, 24, [["araucaria", 2], ["treefern", 2]], [-60, 60, -24, 10], CLEAR)];
const MID = [...scatter(53, 70, [["cycad", 3], ["horsetail", 3], ["treefern", 1], ["broadleaf", 1], ["magnolia", 0.6]], [-50, 50, -34, 10], CLEAR), ...scatter(54, 40, [["horsetail", 2], ["reeds", 3]], [-40, 40, FOREST.streamZ - 3, FOREST.streamZ + 3])];
const FLOOR = [...scatter(55, 110, [["fern", 5], ["grass", 2], ["bush", 1.5], ["boulder", 1], ["rockpile", 1], ["log", 0.8], ["mushrooms", 1]], [-40, 40, -30, 24], CLEAR), ...scatter(56, 36, [["fern", 5], ["grass", 2], ["pebbles", 1], ["mushrooms", 0.5]], [-9, 9, 3, 20], undefined, 0.55)]; // a low fern fringe in front (it may cover feet, like real undergrowth)
export const ForestSet: React.FC<{ t: number; cam: { pos: V3 } }> = ({ t, cam }) => {
  const r = useMemo(() => {
    const uT = { value: 0 };
    const ground = toonWP("#5E7A3A", uT, `
      float m = sin(vWP.x * 0.6 + sin(vWP.z * 0.4) * 2.0) * sin(vWP.z * 0.7 + sin(vWP.x * 0.3) * 1.5);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.26, 0.14), smoothstep(0.35, 0.8, m) * 0.6);                      // bare earth patches
      vec2 lc = floor(vWP.xz * 2.5), lf = fract(vWP.xz * 2.5) - 0.5;
      float h1 = fract(sin(dot(lc, vec2(12.9898, 78.233))) * 43758.5), h2 = fract(sin(dot(lc, vec2(39.3468, 11.135))) * 24634.6);
      vec2 lo = lf - (vec2(h1, h2) - 0.5) * 0.5; float ld = length(lo * vec2(1.0, 1.8 + h2));                                     // small oval leaves at random spots
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.55, 0.42, 0.18), vec3(0.42, 0.22, 0.1), h2), step(0.72, h1) * smoothstep(0.2, 0.14, ld) * 0.75 * smoothstep(30.0, 6.0, distance(vWP, cameraPosition))); // leaf litter`);
    const water = new THREE.MeshBasicMaterial({ color: "#5A8A9A", transparent: true, opacity: 0.85 });
    const ray = new THREE.SpriteMaterial({ map: glowTex(), color: "#FFF2C8", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
    const pollen = Array.from({ length: 120 }, (_, i) => ({ x: Math.sin(i * 12.9) * 25, y: 1 + ((i * 37) % 80) / 10, z: Math.cos(i * 7.7) * 20, ph: i }));
    return { uT, ground, water, ray, pollen, groundG: heightPlane(600, 300, forestY), streamG: (() => { const g = new THREE.PlaneGeometry(300, 4, 150, 1); g.rotateX(-Math.PI / 2); const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + FOREST.streamZ + 3 * Math.sin(x * 0.1)); p.setY(i, -0.45); } return g; })() };
  }, []);
  r.uT.value = t;
  return (
    <group>
      <Sky night={0} sunDir={FOREST.sun} />
      <mesh geometry={r.groundG} material={r.ground} receiveShadow />
      <mesh geometry={r.streamG} material={r.water} userData={{ noNormal: true }} />
      <FloraField items={TALL} ground={forestY} cam={cam} t={t} pal="jungle" wind={0.7} />
      <FloraField items={MID} ground={forestY} cam={cam} t={t} pal="jungle" wind={1} />
      <FloraField items={FLOOR} ground={forestY} cam={cam} t={t} pal="jungle" wind={1.2} />
      {r.pollen.map((q, i) => <sprite key={i} material={r.ray} position={[q.x + Math.sin(t * 0.4 + q.ph) * 1.5, q.y + Math.sin(t * 0.6 + q.ph) * 0.5, q.z]} scale={[0.08, 0.08, 1]} userData={{ noNormal: true }} />)}
    </group>
  );
};

type Cam = { pos: V3; look: V3; fov: number };
const SHOTS: { t: number; a: Cam; b: Cam }[] = [
  { t: 0, a: { pos: [3, 2.6, 30], look: [0, 4.5, 0], fov: 50 }, b: { pos: [1, 2.4, 26], look: [0, 4.5, 0], fov: 50 } },
  { t: 3, a: { pos: [9, 1.0, 11], look: [1, 3.5, 0], fov: 48 }, b: { pos: [8.5, 0.9, 10], look: [1, 3.8, 0], fov: 48 } },
];
const camAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++; const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : 6, k = ease(clamp01((t - s.t) / (t1 - s.t))); return { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k) }; };
const CamSet: React.FC<{ c: Cam }> = ({ c }) => { const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera; cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = W / H; cc.updateProjectionMatrix(); cc.lookAt(...c.look); cc.updateMatrixWorld(); return null; };
export const ForestDemo: React.FC = () => {
  const t = useCurrentFrame() / 30, c = camAt(t), cam = { pos: c.pos, look: c.look };
  const walk = 1 - ramp(t, 2.6, 9, 0.6, 0.4), alloX = keys(t, [[0, -9], [3, -2.5]]), roar = ramp(t, 3.4, 5.6, 0.3, 0.4), steg = ramp(t, 3.8, 5.8, 0.4, 0.4);
  return (
    <AbsoluteFill style={{ background: FOREST.fog }}>
      <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
        <CamSet c={c} />
        <fogExp2 attach="fog" args={[new THREE.Color(FOREST.fog).getHex(), 0.012]} />
        <hemisphereLight args={[new THREE.Color("#DCEAFF"), new THREE.Color("#5A6A3A"), 1.0]} />
        <directionalLight position={FOREST.sun} intensity={2.4} color="#FFE8C0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0008} shadow-normalBias={0.08}
          shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} />
        <ForestSet t={t} cam={cam} />
        <BeastCard3D name="steg" t={t} sun={FOREST.sun} pos={[6.5, forestY(6.5, -3), -3]} heading={Math.PI} cam={cam} pose={{ roar: steg, expr: steg > 0.1 ? "angry" : "neutral" }} />
        <BeastCard3D name="allo" t={t} sun={FOREST.sun} pos={[alloX, forestY(alloX, 0), 0]} heading={0} cam={cam} pose={{ walk, phase: t * 0.85, roar }} />
        <BeastCard3D name="lung" t={t} sun={FOREST.sun} anchor={520} pos={[lerp(-40, 40, t / 6), 20, -26]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 0.5 }} />
        <InkPass p={{ focus: new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look)), blur: 5, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: 0, warm: 0.25 }} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
