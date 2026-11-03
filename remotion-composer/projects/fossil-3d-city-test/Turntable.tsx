// Xem riêng con megalodon 3D (kiểm tra hình dáng): camera quay quanh, nền trơn.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Megalodon } from "./Megalodon3D";

const Cam: React.FC<{ a: number; elev: number; dist: number; tx: number }> = ({ a, elev, dist, tx }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(tx + Math.sin(a) * dist, elev, Math.cos(a) * dist);
  camera.lookAt(tx, dist < 15 ? -0.6 : 0.6, 0);
  camera.updateMatrixWorld();
  return null;
};

export const Turntable: React.FC<{ dist?: number; tx?: number; a0?: number }> = ({ dist = 24, tx = 0, a0 = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const a = a0 + (frame / durationInFrames) * Math.PI * 2;
  return (
    <AbsoluteFill style={{ background: "#D8C8A2" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.3, far: 200 }} gl={{ antialias: true, alpha: true }}>
        <Cam a={a} elev={(dist < 15 ? -1.5 : 3) + 4 * Math.sin(a * 2)} dist={dist} tx={tx} />
        <hemisphereLight args={["#EFE6D2", "#3B4A4B", 1.0]} />
        <directionalLight position={[-20, 30, 20]} intensity={2.2} color="#FFE0AE" />
        <Megalodon frame={frame} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
