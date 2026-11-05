// Card motion check (4 s): T. rex idling then walking in (eased), a mammoth breathing, a Titanoboa wave, a Pteranodon
// hovering — on the badlands. Compare consecutive stills / render a short clip.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { useModels } from "./FreeWorld";
import { V3 } from "./World";
import { BeastCard3D } from "./ToonSets";
import { BAD, BadlandsSet, badY } from "./ToonSets3";
import { keys, ramp } from "./cardMotion";

const W = 1080, H = 1920;
const CamSet: React.FC<{ pos: V3; look: V3 }> = ({ pos, look }) => { const { camera } = useThree(); const cc = camera as THREE.PerspectiveCamera;
  cc.position.set(...pos); cc.fov = 50; cc.near = 0.1; cc.far = 4000; cc.aspect = W / H; cc.updateProjectionMatrix(); cc.lookAt(...look); cc.updateMatrixWorld(); return null; };
const GLB = ["plant_bush", "plant_bushLarge", "grass", "grass_large", "rock_largeA", "rock_largeC", "rock_smallA"];
export const MotionTest: React.FC = () => {
  const t = useCurrentFrame() / 30, models = useModels([], GLB);
  const cam = { pos: [0, 4, 32] as V3, look: [0, 5, 0] as V3 };
  const walk = ramp(t, 1.0, 9, 0.6, 0.5), rexX = keys(t, [[0, -6], [1, -6], [4, 0]]), roar = ramp(t, 3.0, 4.0, 0.25, 0.3);
  return (
    <AbsoluteFill style={{ background: BAD.fog }}>
      {models ? (
        <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false }}>
          <CamSet {...cam} />
          <fogExp2 attach="fog" args={[new THREE.Color(BAD.fog).getHex(), 0.0035]} />
          <hemisphereLight args={[new THREE.Color("#CFE0FF"), new THREE.Color("#B07A50"), 1.05]} />
          <directionalLight position={BAD.sun} intensity={2.5} color="#FFE2B8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0008} shadow-normalBias={0.08}
            shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} />
          <BadlandsSet models={models} t={t} cam={cam} />
          <BeastCard3D name="mammoth" t={t} sun={BAD.sun} pos={[8, badY(8, -6), -6]} heading={Math.PI} cam={cam} pose={{ expr: "angry" }} />
          <BeastCard3D name="boa" t={t} sun={BAD.sun} pos={[-9, badY(-9, -4), -4]} heading={0} cam={cam} pose={{ walk: 0.4, phase: t * 0.3 }} />
          <BeastCard3D name="rex" t={t} sun={BAD.sun} pos={[rexX, badY(rexX, 0), 0]} heading={0} cam={cam} pose={{ walk, phase: t * 0.9, roar }} />
          <BeastCard3D name="pteranodon" t={t} sun={BAD.sun} anchor={520} pos={[2, 14, -8]} heading={0} cam={cam} pose={{ walk: 1, phase: t * 1.1 }} />
          <InkPass p={{ focus: 32, blur: 3, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1, cold: 0, warm: 0.3 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
