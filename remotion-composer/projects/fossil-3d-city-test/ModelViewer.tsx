// Xem một sinh vật: camera quay quanh hoặc đứng ở góc cố định, nền trơn + bóng đổ trên đất.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Creature, useCreature } from "./Creature3D";

type Props = { model: string; dist?: number; az?: number; spin?: boolean; elev?: number; ty?: number };

const Cam: React.FC<{ pos: THREE.Vector3; look: THREE.Vector3 }> = ({ pos, look }) => {
  const camera = useThree((s) => s.camera);
  camera.position.copy(pos);
  camera.lookAt(look);
  camera.updateMatrixWorld();
  return null;
};

export const ModelViewer: React.FC<Props> = ({ model, dist, az = 0.6, spin = true, elev, ty }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const data = useCreature(model);
  const a = az + (spin ? (frame / durationInFrames) * Math.PI * 2 : 0);
  let scene = null;
  if (data) {
    const { min, max } = data.bbox;
    const c = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const R = Math.max(max[0] - min[0], max[1] - min[1]) * 0.5;
    // vừa khung 16:9 (fov dọc 30°) dù con vật dài hay cao
    const half = Math.max((max[1] - min[1]) / 2, ((max[0] - min[0]) / 2) * (height / width)) * 1.3;
    const D = dist ?? half / Math.tan((15 * Math.PI) / 180);
    const look = new THREE.Vector3(c.x, ty ?? c.y, c.z);
    const pos = new THREE.Vector3(c.x - Math.sin(a) * D, look.y + (elev ?? half * 0.35), c.z + Math.cos(a) * D);
    const floor = min[1] > -0.05 && min[1] < 0.3; // sinh vật đứng đất
    scene = (
      <>
        <Cam pos={pos} look={look} />
        <hemisphereLight args={["#F2EADB", "#4A4A40", 1.5]} />
        <directionalLight
          position={[c.x - R, R * 2.2, c.z + R * 1.2]}
          intensity={3.2}
          color="#FFE6BE"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-R * 1.5}
          shadow-camera-right={R * 1.5}
          shadow-camera-top={R * 1.5}
          shadow-camera-bottom={-R * 1.5}
          shadow-camera-far={R * 8}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[c.x + R, R, c.z - R * 2]} intensity={0.7} color="#BFD2E6" />
        <Creature data={data} t={frame / fps} />
        {floor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0, c.z]} receiveShadow>
            <circleGeometry args={[R * 1.6, 64]} />
            <shadowMaterial opacity={0.28} />
          </mesh>
        )}
      </>
    );
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #E7DCC4 0%, #C9B993 100%)" }}>
      {data && <ThreeCanvas width={width} height={height} shadows camera={{ fov: 30, near: 0.1, far: 500 }} gl={{ antialias: true, alpha: true }}>
        {scene}
      </ThreeCanvas>}
    </AbsoluteFill>
  );
};
