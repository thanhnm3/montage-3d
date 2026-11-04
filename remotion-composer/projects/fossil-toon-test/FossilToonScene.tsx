// Fossil Mysteries look test (2026-11-04): "can the cartoon-3d-short style work for the animals?"
// The animals are 2D toon drawings (toonAnimals.ts, toon.ts Pen) on yaw-only cards in a 3D Cretaceous plain (Kenney CC0
// flora, Sky + ink + grade from the Why Why Why 004 pass). Cards cast silhouette shadows, get no world ink (noInk),
// their painted light side follows the sun, and they mirror when their heading points to screen-left (the reference's
// cut-out flip). 9 s, four shots: wide (rex walks in, trike stands), low-angle rex roar, trike shock close-up,
// mammoth walking past (different era, just to see the third animal in 3D).
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Pen } from "./toon";
import { ANIMALS, AnimalName, AnimalPose, GROUND } from "./toonAnimals";
import { InkPass } from "./Ink";
import { M, Models, useModels } from "./FreeWorld";
import { Sky, V3, clamp01, ease, lerp, lerpV } from "./World";

const W = 1080, H = 1920, ASPECT = W / H;
const GLB = ["tree_pineTallA", "tree_pineRoundC", "tree_cone_dark", "tree_fat", "tree_tall", "grass", "grass_large", "rock_largeA",
  "rock_largeC", "rock_tallA", "rock_smallA", "plant_bush", "stump_round"];
const SUN: V3 = [-30, 26, 34];

// ------------------------------------------------------------------ animal card
const K = 0.75; // canvas px per design unit (1200 x 750 canvas)
const lightAngle = (sun: THREE.Vector3, cam: THREE.Camera) => {
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  return Math.round(Math.atan2(-sun.dot(up), sun.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
};
export const AnimalCard: React.FC<{ name: AnimalName; pose: AnimalPose; pos: V3; heading: number; cam: { pos: V3; look: V3 }; t: number }> = ({ name, pose, pos, heading, cam, t }) => {
  const A = ANIMALS[name], mpu = A.len / (A.x1 - A.x0);
  const r = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = 1600 * K; cv.height = 1000 * K;
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const geo = new THREE.PlaneGeometry(1600 * mpu, 1000 * mpu);
    geo.translate((800 - (A.x0 + A.x1) / 2) * mpu, (GROUND - 500) * mpu, 0); // animal centred on pos, feet on the ground
    const camO = new THREE.PerspectiveCamera();
    return { g, tex, mat, depth, geo, camO };
  }, [A, mpu]);
  r.camO.position.set(...cam.pos); r.camO.lookAt(...cam.look); r.camO.updateMatrixWorld();
  const camRight = new THREE.Vector3().setFromMatrixColumn(r.camO.matrixWorld, 0);
  const flip = Math.cos(heading) * camRight.x + Math.sin(heading) * camRight.z < 0; // heading (radians in xz) points to screen-left
  let light = lightAngle(new THREE.Vector3(...SUN).normalize(), r.camO);
  if (flip) light = Math.PI - light; // the drawing is mirrored, so is its light side
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, 1600 * K, 1000 * K); r.g.setTransform(K, 0, 0, K, 0, 0);
  const blink = (() => { const n = Math.floor(t / 2.1); const at = n * 2.1 + 0.5 + ((Math.sin(n * 91.7) + 1) / 2) * 1.2; const d = (t - at) * 30; return d >= 0 && d < 4 ? 1 : 0; })();
  A.draw(new Pen(r.g), { ...pose, light, blink });
  r.tex.needsUpdate = true;
  const yaw = Math.atan2(cam.pos[0] - pos[0], cam.pos[2] - pos[2]);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} castShadow scale={[flip ? -1 : 1, 1, 1]}
        userData={{ noNormal: true, noInk: true, flatNormal: r.tex }} />
    </group>
  );
};

// ------------------------------------------------------------------ shots
type Cam = { pos: V3; look: V3; fov: number; roll?: number };
const SHOTS: { t: number; a: Cam; b: Cam }[] = [
  { t: 0, a: { pos: [1.5, 2.2, 34], look: [1.5, 4.0, 0], fov: 40 }, b: { pos: [1.5, 2.0, 30], look: [1.5, 4.0, 0], fov: 40 } }, // wide: rex walks in, trike waits
  { t: 2.6, a: { pos: [7.5, 0.8, 13], look: [3.0, 5.2, 0], fov: 46, roll: -5 }, b: { pos: [7.0, 0.8, 11.5], look: [3.0, 5.4, 0], fov: 46, roll: -6 } }, // low angle: the roar
  { t: 4.6, a: { pos: [0.6, 2.6, 9.5], look: [3.8, 2.8, -1], fov: 38, roll: 3 }, b: { pos: [1.0, 2.6, 8.5], look: [3.8, 2.9, -1], fov: 38, roll: 4 } }, // trike shock CU
  { t: 6.4, a: { pos: [2, 2.4, 26], look: [0, 2.6, 5], fov: 42 }, b: { pos: [0, 2.4, 24], look: [-1, 2.6, 5], fov: 42 } }, // mammoth walks past
];
const END = 9;
function camAt(t: number) {
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END, k = ease(clamp01((t - s.t) / (t1 - s.t)));
  const shake = i === 1 && t > 3.0 ? Math.exp(-(t - 3.0) * 4) * 0.06 : 0;
  const p = lerpV(s.a.pos, s.b.pos, k);
  return { pos: [p[0] + Math.sin(t * 47) * shake, p[1] + Math.cos(t * 41) * shake, p[2]] as V3, look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), roll: lerp(s.a.roll ?? 0, s.b.roll ?? 0, k), i };
}

const CamSet: React.FC<{ c: ReturnType<typeof camAt> }> = ({ c }) => {
  const { camera } = useThree();
  const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = ASPECT; cc.updateProjectionMatrix();
  cc.lookAt(...c.look); cc.rotateZ(THREE.MathUtils.degToRad(c.roll)); cc.updateMatrixWorld();
  return null;
};

const Plain: React.FC<{ models: Models }> = ({ models }) => {
  const mats = useMemo(() => ({ ground: new THREE.MeshToonMaterial({ color: "#A7B865" }), hill: [new THREE.MeshToonMaterial({ color: "#8FA35A" }), new THREE.MeshToonMaterial({ color: "#B7A46E" })] }), []);
  const flora: [string, number, number, number][] = [["tree_pineTallA", -9, -8, 9], ["tree_cone_dark", -4, -14, 11], ["tree_pineRoundC", 12, -10, 8], ["tree_pineTallA", 17, -18, 12],
    ["tree_fat", -15, -4, 6], ["tree_tall", 4, -20, 12], ["rock_largeC", 9, -4, 2.2], ["rock_tallA", -6, -3, 2.6], ["plant_bush", 3, 3, 1.2], ["grass_large", -3, 5, 0.9],
    ["grass_large", 7, 4, 0.9], ["grass", 1, 7, 0.6], ["rock_smallA", -1, 8, 0.5], ["stump_round", 12, 2, 0.8], ["plant_bush", -10, 2, 1.4], ["grass", 9, 9, 0.6]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.ground} receiveShadow><planeGeometry args={[800, 800]} /></mesh>
      {flora.map(([n, x, z, h], i) => <M key={i} models={models} name={n} size={h} pos={[x, 0, z]} rot={i * 1.7} />)}
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.4, R = 160 + (i % 3) * 50;
        return <mesh key={`h${i}`} material={mats.hill[i % 2]} position={[Math.cos(a) * R, -8, Math.sin(a) * R - 60]} scale={[80, 30 + (i % 3) * 12, 60]}><sphereGeometry args={[1, 32, 16]} /></mesh>; })}
    </group>
  );
};

export const FossilToonScene: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30;
  const models = useModels([], GLB);
  const c = camAt(t);
  const camLite = { pos: c.pos, look: c.look };
  const rexX = lerp(-7, -0.5, ease(clamp01(t / 2.6)));
  const rexWalk = t < 2.6 ? 1 : 0;
  const roar = t > 2.9 && t < 4.6 ? ease(clamp01((t - 2.9) / 0.25)) : 0;
  const mamX = lerp(9, -7, clamp01((t - 6.4) / 2.6));
  const focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  return (
    <AbsoluteFill style={{ background: "#9CC3E6" }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={c} />
          <fogExp2 attach="fog" args={[new THREE.Color("#E4D9BE").getHex(), 0.006]} />
          <Sky night={0} sunDir={SUN} />
          <hemisphereLight args={[new THREE.Color("#CFE3FF"), new THREE.Color("#8C8A5A"), 1.15]} />
          <directionalLight position={SUN} intensity={2.3} color="#FFE2B8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
            shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-camera-far={150} />
          <Plain models={models} />
          <AnimalCard name="rex" t={t} pos={[rexX, 0, 0]} heading={0} cam={camLite} pose={{ walk: rexWalk, phase: t * 0.9, roar, expr: roar > 0 ? "angry" : "neutral" }} />
          <AnimalCard name="trike" t={t} pos={[6.5, 0, -1]} heading={Math.PI} cam={camLite} pose={{ expr: t > 3.0 ? "shock" : "neutral" }} />
          {t > 6.3 ? <AnimalCard name="mammoth" t={t} pos={[mamX, 0, 5]} heading={Math.PI} cam={camLite} pose={{ walk: 1, phase: t * 0.8, expr: "sleepy" }} /> : null}
          <InkPass p={{ focus, blur: c.i === 1 || c.i === 2 ? 9 : 4, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: 0, warm: 0.2 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
