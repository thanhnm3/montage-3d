// 8 s xem thử con sư tử TRELLIS (model tĩnh, không xương) giữa savanna: camera vòng từ cận mặt ra toàn thân,
// thân "thở" nhẹ để khỏi đứng đơ.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { useMemo } from "react";
import { GActor, useGLB } from "./QModel";
import { Cam, Savanna } from "./Short008_3D";

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

export const LionShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const lion = useGLB("models/lion_trellis.glb");
  const k = ease(f / (durationInFrames - 1));
  const a = -2.15 + 1.5 * k;
  const R = 4.3 + 2.2 * k;
  const look: [number, number, number] = [-0.5 + 0.5 * k, 0.95 - 0.2 * k, 0];
  const cam: [number, number, number] = [Math.sin(a) * R, 0.85 + 0.6 * k, Math.cos(a) * R];
  const breath = 1 + 0.008 * Math.sin((2 * Math.PI * f) / (fps * 2));
  const tgt = useMemo(() => new THREE.Object3D(), []);
  return (
    <AbsoluteFill style={{ background: "#111819" }}>
      {lion && (
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.05, far: 800 }} gl={{ antialias: true }}>
          <Cam pos={cam} look={look} />
          <fog attach="fog" args={["#E6CFA6", 30, 220]} />
          <hemisphereLight args={["#CFE0F0", "#8A6A3A", 1.1]} />
          <primitive object={tgt} />
          <directionalLight position={[-7, 6, 6]} target={tgt} intensity={3.8} color="#FFD9A6" castShadow shadow-mapSize={[4096, 4096]}
            shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.02} />
          <directionalLight position={[8, 4, -8]} intensity={0.9} color="#B9CCE4" />
          <Savanna />
          <group scale={[1, breath, 1]}>
            <GActor asset={lion} length={2.9} flip />
          </group>
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(8,12,13,0.4) 100%)" }} />
    </AbsoluteFill>
  );
};
