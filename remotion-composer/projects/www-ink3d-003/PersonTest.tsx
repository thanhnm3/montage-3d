// stills harness for Person.tsx: frame n -> test case n
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InkPass } from "./Ink";
import { useModels } from "./FreeWorld";
import { Person, personAt, setCurl } from "./Person";
import { toon } from "./World";

const CASES: [string, string, string, number][] = [
  ["Idle_Neutral", "clip", "neutral", 0], ["Idle_Neutral", "hug", "cold", 0],
  ["Idle", "clip", "neutral", 0], ["Idle", "hug", "cold", 0], ["Idle", "chest", "smug", 0], ["Idle", "lookArm", "confused", 1],
  ["Idle", "armsDown", "deadpan", 0], ["HitRecieve", "scared", "scared", 0], ["Idle", "puff", "strain", 0], ["Idle", "shrug", "shrug", 0],
  ["Idle", "pointUp", "curious", 0], ["Idle", "facepalm", "laugh", 0], ["Wave", "clip", "happy", 0],
];
const Cam: React.FC<{ close: boolean; side: number }> = ({ close, side }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(side, close ? 1.6 : 1.1, close ? 1.1 : 4.2); c.fov = 40; c.aspect = 1080 / 1920; c.near = 0.05; c.far = 100;
  c.updateProjectionMatrix(); c.lookAt(0, close ? 1.58 : 1.0, 0); c.updateMatrixWorld();
  return null;
};
export const PersonTest: React.FC = () => {
  const f = useCurrentFrame();
  const models = useModels([], ["man"]);
  const close = f >= 100 && f < 200;
  const ax = [[1, 0, 0], [0, 0, 1], [0, 1, 0]][Math.floor(f / 300)] ?? [1, 0, 0];
  setCurl(ax as [number, number, number], f % 300 >= 150 ? -1 : 1);
  const n = f % 100;
  const [clip, pose, face, bumps] = CASES[Math.min(n, CASES.length - 1)];
  const st = personAt([{ t: 0, clip, pose: "clip", face: "neutral" }, { t: 0.01, pose, face }], 1.0);
  const ground = React.useMemo(() => toon({ color: "#EEF2F8" }), []);
  return (
    <AbsoluteFill style={{ background: "#DCE5F0" }}>
      {models ? (
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false }}>
          <Cam close={close} side={f >= 200 ? 1.2 : 0} />
          <color attach="background" args={["#DCE5F0"]} />
          <hemisphereLight args={[new THREE.Color("#CFE0FF"), new THREE.Color("#B9C4D6"), 1.25]} />
          <directionalLight position={[-3, 6, 5]} intensity={1.8} castShadow />
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[50, 50]} /></mesh>
          <Person models={models} pos={[0, 0, 0]} rot={0} t={1.0 + n * 0.37} st={st} cues={[]} bumps={bumps} hairUp={bumps} />
          <InkPass p={{ focus: close ? 1.2 : 4.2, blur: 4, night: 0, cow: 0, flash: 0, redPulse: 0, ink: 1 }} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
