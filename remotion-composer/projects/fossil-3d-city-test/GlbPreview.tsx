// Xem nhanh nhiều GLB cạnh nhau (chọn model). Mỗi model chuẩn hoá dài 4 m theo trục dài nhất.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGLB, GAsset } from "./QModel";

const Cam: React.FC<{ pos: [number, number, number] }> = ({ pos }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(0, 0.4, 0);
  camera.updateMatrixWorld();
  return null;
};

const Fit: React.FC<{ a: GAsset; x: number }> = ({ a, x }) => {
  const inst = React.useMemo(() => a.scene.clone(true), [a]);
  const { min, max } = a.box;
  const L = Math.max(max.x - min.x, max.z - min.z);
  const s = 4 / L;
  return (
    <group position={[x, 0, 0]} scale={s}>
      <primitive object={inst} position={[-(min.x + max.x) / 2, -min.y, -(min.z + max.z) / 2]} />
    </group>
  );
};

export const GlbPreview: React.FC<{ files: string[]; az?: number }> = ({ files, az = 0.7 }) => {
  const as = files.map((f) => useGLB(f));
  const D = 7;
  return (
    <AbsoluteFill style={{ background: "#DCD6C8" }}>
      {as.every(Boolean) && <ThreeCanvas width={1600} height={900} camera={{ fov: 50 }}>
        <Cam pos={[Math.sin(az) * D * 2.2, 4.5, Math.cos(az) * D * 2.2]} />
        <hemisphereLight args={["#ffffff", "#555", 1.6]} />
        <directionalLight position={[5, 10, 6]} intensity={2.6} />
        {as.map((a, i) => (a ? <Fit key={i} a={a} x={(i - (files.length - 1) / 2) * 4.6} /> : null))}
      </ThreeCanvas>}
    </AbsoluteFill>
  );
};
