// 8 s T. rex khối (16:9, duyệt model): đi tới, dừng cạnh người khối 1,8 m, ngóc đầu gầm; máy quay vòng từ thấp lên.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { BlockHuman, BlockTRex } from "./BlockAnimals";
import { Cam, Savanna } from "./Short008_3D";

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);

export const BlockRexShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  const walk = 1 - ease((t - 3.6) / 0.9);
  const SPEED = 2.2;
  const x = 6 - SPEED * (t < 3.6 ? t : 3.6 + 0.45 * Math.min(0.9, t - 3.6));
  const roar = pulse(t, 5.0, 7.6);
  const k = ease(t / 8);
  const a = 0.3 - 1.4 * k;
  const R = 22 - 5 * k;
  const look: [number, number, number] = [x - 2, 3.4 + 0.6 * roar, 0];
  const cam: [number, number, number] = [x - 2 + Math.sin(a) * R, 1.4 + 1.2 * k, Math.cos(a) * R];
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(x, 0, 0);
  return (
    <AbsoluteFill style={{ background: "#111819" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 38, near: 0.1, far: 900 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={look} />
        <fog attach="fog" args={["#E6CFA6", 40, 300]} />
        <hemisphereLight args={["#CFE0F0", "#8A6A3A", 1.2]} />
        <primitive object={tgt} />
        <directionalLight position={[x - 12, 16, 12]} target={tgt} intensity={3.4} color="#FFD9A6" castShadow shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.03} />
        <directionalLight position={[x + 14, 6, -12]} intensity={0.9} color="#B9CCE4" />
        <Savanna />
        <group position={[x, 0, 0]}>
          <BlockTRex t={t} walk={walk} roar={roar} look={-0.25 * ease((t - 4) / 0.8) * (1 - roar)} />
        </group>
        <group position={[-4.5, 0, 3.2]} rotation={[0, Math.PI, 0]}>
          <BlockHuman t={t} />
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(8,12,13,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
