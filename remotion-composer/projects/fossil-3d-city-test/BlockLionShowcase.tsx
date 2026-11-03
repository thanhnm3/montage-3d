// 8 s sư tử khối vuông: đi bộ trên savanna (camera bám theo), dừng lại và gầm.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { BlockLion } from "./BlockLion";
import { Cam, Savanna } from "./Short008_3D";

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

export const BlockLionShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  // đi tới 5.2 s rồi dừng (hãm dần), gầm 5.8 → 7.6 s
  const walk = 1 - ease((t - 4.6) / 0.8);
  const SPEED = 0.56;
  const x = -SPEED * (t < 4.6 ? t : 4.6 + 0.4 * Math.min(0.8, t - 4.6));
  const k = ease(t / 8);
  const a = -1.15 + 0.75 * k;
  const R = 7.0 - 1.2 * k;
  const look: [number, number, number] = [x - 0.1, 0.95, 0];
  const cam: [number, number, number] = [x - 0.1 + Math.sin(a) * R, 1.1 - 0.25 * k, Math.cos(a) * R];
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, 0);
  return (
    <AbsoluteFill style={{ background: "#111819" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.05, far: 800 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={look} />
        <fog attach="fog" args={["#E6CFA6", 30, 220]} />
        <hemisphereLight args={["#CFE0F0", "#8A6A3A", 1.2]} />
        <primitive object={tgt} />
        <directionalLight position={[x - 6, 7, 6]} target={tgt} intensity={3.4} color="#FFD9A6" castShadow shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.02} />
        <directionalLight position={[x + 8, 4, -8]} intensity={0.9} color="#B9CCE4" />
        <Savanna />
        <group position={[x, 0, 0]}>
          <BlockLion t={t} walk={walk} roarA={5.8} roarB={7.6} />
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(8,12,13,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
