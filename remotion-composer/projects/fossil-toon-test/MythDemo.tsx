// 3D check for the fantasy beasts (6 s): Kraken + Leviathan in the sea, a yeti and a griffin on the Ice Age steppe,
// the hydra breathing fire on the volcano plain.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { useModels } from "./FreeWorld";
import { V3, clamp01, ease, lerp } from "./World";
import { BeastCard3D, ICE, IceSet, SEA, SeaSet, snowY, win } from "./ToonSets";
import { VOL, VolcanoSet } from "./ToonSets2";

const W = 1080, H = 1920;
type Cam = { pos: V3; look: V3; fov: number };
const SHOTS: { t: number; set: "sea" | "ice" | "vol"; c: Cam }[] = [
  { t: 0, set: "sea", c: { pos: [0, 6, 26], look: [0, 8, 0], fov: 52 } },
  { t: 2, set: "ice", c: { pos: [0, 2.2, 13], look: [0, 2.2, 0], fov: 46 } },
  { t: 4, set: "vol", c: { pos: [4, 3, 26], look: [2, 6, 0], fov: 50 } },
];
const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++; return SHOTS[i]; };
const CamSet: React.FC<{ c: Cam }> = ({ c }) => { const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...c.pos); cc.fov = c.fov; cc.near = 0.1; cc.far = 4000; cc.aspect = W / H; cc.updateProjectionMatrix(); cc.lookAt(...c.look); cc.updateMatrixWorld(); return null; };
const GLB = ["tree_tall", "tree_cone_dark", "stump_round", "rock_largeA", "rock_largeC", "rock_tallA", "rock_smallA", "tree_pineTallA", "tree_pineRoundC", "grass", "grass_large"];
export const MythDemo: React.FC = () => {
  const t = useCurrentFrame() / 30, models = useModels([], GLB), s = shotAt(t), cam = { pos: s.c.pos, look: s.c.look };
  const set = s.set, focus = new THREE.Vector3(...s.c.pos).distanceTo(new THREE.Vector3(...s.c.look));
  const sun = set === "sea" ? SEA.sun : set === "ice" ? ICE.sun : VOL.sun, fog = set === "sea" ? SEA.fog : set === "ice" ? ICE.fog : VOL.fog;
  const roar = (a: number) => (win(t, a, a + 1.5) ? ease(clamp01((t - a) / 0.25)) : 0);
  return (
    <AbsoluteFill style={{ background: fog }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet c={s.c} />
          <fogExp2 attach="fog" args={[new THREE.Color(fog).getHex(), set === "sea" ? 0.022 : set === "ice" ? 0.0045 : 0.006]} />
          <hemisphereLight args={[new THREE.Color(set === "vol" ? "#B07A6A" : "#CFE6FF"), new THREE.Color(set === "vol" ? "#2A1A14" : "#4A5A6A"), set === "vol" ? 0.75 : 1.05]} />
          <directionalLight position={sun} intensity={2} color={set === "vol" ? "#FF9A64" : "#FFF0DC"} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-normalBias={0.05}
            shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={200} />
          {set === "sea" ? <group><SeaSet models={models} t={t} cam={cam} />
            <BeastCard3D name="kraken" t={t} sun={sun} anchor={520} pos={[-3, 9, -6]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 0.5, roar: roar(1) }} />
            <BeastCard3D name="leviathan" t={t} sun={sun} anchor={520} pos={[lerp(30, 10, t / 2), 17, -40]} heading={Math.PI} cam={cam} pose={{ walk: 1, phase: t * 0.6 }} />
          </group> : set === "ice" ? <group><IceSet models={models} t={t} cam={cam} />
            <BeastCard3D name="yeti" t={t} sun={sun} pos={[-1.6, snowY(-1.6, 0), 0]} heading={0} cam={cam} pose={{ roar: roar(2.8) }} />
            <BeastCard3D name="griffin" t={t} sun={sun} pos={[2.6, snowY(2.6, -3), -3]} heading={Math.PI} cam={cam} pose={{ walk: 0.6, phase: t, roar: roar(3) }} />
          </group> : <group><VolcanoSet models={models} t={t} cam={cam} />
            <BeastCard3D name="hydra" t={t} sun={sun} pos={[0, 0, 0]} heading={0} cam={cam} pose={{ roar: roar(4.6), phase: t }} />
          </group>}
          <InkPass p={{ focus, blur: 4, night: set === "vol" ? 0.2 : 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: set === "vol" ? 0 : 0.4, warm: set === "vol" ? 0.5 : 0 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
