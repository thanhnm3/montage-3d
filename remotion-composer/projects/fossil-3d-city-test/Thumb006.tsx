// Thumbnail 16:9 cho tập dài 006 (5 Scariest Dinosaurs): T. rex gầm cận cảnh bên phải, bốn con còn lại mờ trong bão
// phía sau, nửa trái để trống cho chữ (chữ chèn sau bằng PIL).
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { BlockTheropod, DINOS } from "./BlockAnimals";
import { Badlands, BadLights, PALS } from "./Badlands";
import { Cam } from "./Long006_3D";
import { REX } from "./Long006_common";

export const Thumb006: React.FC = () => {
  const { width, height } = useVideoConfig();
  const cam: [number, number, number] = [-10.5, 2.2, 5.2];
  return (
    <AbsoluteFill style={{ background: PALS.storm.skyTop }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.05, far: 900 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={[-6.2, 3.9, -1.2]} fov={38} />
        <BadLights x={-3} cam={cam} fog={[14, 90]} dim={1.1} pal="storm" />
        <Badlands t={3} pal="storm" />
        <group rotation={[0, -0.55, 0]}>
          <BlockTheropod t={2.2} spec={REX} walk={0} roar={0.95} eyeI={1.8} />
        </group>
        {([["giganotosaurus", 3, -13], ["spinosaurus", -1.5, -18], ["carnotaurus", -5, -14], ["utahraptor", -7.5, -10]] as const).map(([sp, x, z], i) => (
          <group key={sp} position={[x, 0, z]} rotation={[0, 0.9, 0]}>
            <BlockTheropod t={1 + i} spec={DINOS[sp]} walk={0} eyeI={1.6} phase={i} />
          </group>
        ))}
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 60% 50%, rgba(0,0,0,0) 50%, rgba(4,4,6,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
