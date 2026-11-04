// 3D check for the winged beasts (6 s): a dragon breathing fire on the volcano plain with a second dragon flying over,
// then Pteranodons + a Quetzalcoatlus gliding over the sea (camera just above the surface).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { useModels } from "./FreeWorld";
import { V3, clamp01, ease, lerp, lerpV } from "./World";
import { BeastCard3D, SEA, SeaSet, win } from "./ToonSets";
import { VOL, VolcanoSet } from "./ToonSets2";

const W = 1080, H = 1920;
type Cam = { pos: V3; look: V3; fov: number };
const SHOTS: { t: number; set: "vol" | "sea"; a: Cam; b: Cam }[] = [
  { t: 0, set: "vol", a: { pos: [14, 3, 34], look: [4, 9, 0], fov: 50 }, b: { pos: [12, 2.6, 30], look: [4, 9.5, 0], fov: 50 } },
  { t: 2.2, set: "vol", a: { pos: [22, 1.2, 12], look: [12, 6, 0], fov: 48 }, b: { pos: [21, 1.0, 11], look: [13, 6.5, 0], fov: 48 } },
  { t: 4, set: "sea", a: { pos: [2, 29, 22], look: [2, 34, -12], fov: 52 }, b: { pos: [2, 29.5, 19], look: [2, 34.5, -12], fov: 52 } }, // above the surface
];
const END = 6;
function camAt(t: number) {
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END, k = ease(clamp01((t - s.t) / (t1 - s.t)));
  return { pos: lerpV(s.a.pos, s.b.pos, k), look: lerpV(s.a.look, s.b.look, k), fov: lerp(s.a.fov, s.b.fov, k), i, set: s.set };
}
const CamSet: React.FC<{ c: ReturnType<typeof camAt> }> = ({ c }) => {
  const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = W / H; cc.updateProjectionMatrix(); cc.lookAt(...c.look); cc.updateMatrixWorld();
  return null;
};
const GLB = ["tree_tall", "tree_cone_dark", "stump_round", "rock_largeA", "rock_largeC", "rock_tallA", "rock_smallA"];
export const WingsDemo: React.FC = () => {
  const t = useCurrentFrame() / 30, models = useModels([], GLB), c = camAt(t), cam = { pos: c.pos, look: c.look };
  const vol = c.set === "vol", focus = new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
  const fire = win(t, 1.2, 4) ? ease(clamp01((t - 1.2) / 0.3)) : 0;
  return (
    <AbsoluteFill style={{ background: vol ? VOL.fog : SEA.hor }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={c} />
          <fogExp2 attach="fog" args={[new THREE.Color(vol ? VOL.fog : SEA.fog).getHex(), vol ? 0.006 : 0.004]} />
          <hemisphereLight args={[new THREE.Color(vol ? "#B07A6A" : "#9FE6EE"), new THREE.Color(vol ? "#2A1A14" : "#1E4A5A"), vol ? 0.75 : 1.0]} />
          <directionalLight position={vol ? VOL.sun : SEA.sun} intensity={vol ? 1.6 : 1.9} color={vol ? "#FF9A64" : "#DFFBFF"} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
            shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={200} />
          {vol ? <group>
            <VolcanoSet models={models} t={t} />
            <BeastCard3D name="dragon" t={t} sun={VOL.sun} pos={[0, 0, 0]} heading={0} cam={cam} pose={{ roar: fire, phase: t }} />
            <BeastCard3D name="dragonfly" t={t} sun={VOL.sun} anchor={520} pos={[lerp(-30, 40, t / 4), 22, -18]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 0.9 }} />
          </group> : <group>
            <SeaSet models={models} t={t} />
            {[[-6, 0, 0], [5, -6, 0.4], [12, -12, 0.7]].map(([x, z, ph], i) => (
              <BeastCard3D key={i} name="pteranodon" t={t} sun={SEA.sun} anchor={520} pos={[x + (t - 4) * 3, SEA.surf + 6 + i * 2, z - 12]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 1.1 + ph, roar: i === 0 && t > 5 ? 1 : 0 }} />))}
            <BeastCard3D name="quetzfly" t={t} sun={SEA.sun} anchor={520} pos={[-14 + (t - 4) * 2, SEA.surf + 14, -30]} heading={0} cam={cam} pose={{ walk: 0.3, phase: t * 0.5 }} />
          </group>}
          <InkPass p={{ focus, blur: 4, night: vol ? 0.2 : 0, cow: 0, flash: 0, redPulse: vol ? 0.15 * fire : 0, ink: 1, cold: vol ? 0 : 0.5, warm: vol ? 0.5 : 0 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
