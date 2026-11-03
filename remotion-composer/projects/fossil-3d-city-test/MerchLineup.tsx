// Ảnh bán hàng (Etsy/POD): bảng so sánh kích thước, nhìn ngang, nền trong suốt, ánh sáng phẳng sáng.
// MerchLineup: người 1,8 m + 5 loài (#1 → #5) trên cùng một hàng. MerchSolo: một loài, 3/4.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { BlockHuman, BlockTheropod, DINOS } from "./BlockAnimals";
import { Cam } from "./Short008_3D";

const ORDER = ["trex", "giganotosaurus", "spinosaurus", "carnotaurus", "utahraptor"];

// nửa chiều dài về phía mõm (-X) và phía đuôi (+X), ước lượng từ spec (cùng công thức với BlockTheropod)
const extent = (sp: string) => {
  const S = DINOS[sp];
  const left = 0.756 * S.body[0] + S.neck[0] + S.skull[0] + S.snout[0];
  const right = 0.244 * S.body[0] + S.tail.n * S.tail.L;
  return { left, right };
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={1.15} />
    <directionalLight position={[-8, 18, 14]} intensity={2.6} castShadow={false} />
    <directionalLight position={[10, 6, 8]} intensity={0.9} />
  </>
);

export const MerchLineup: React.FC<{ gap?: number }> = ({ gap = 0.8 }) => {
  const { width, height } = useVideoConfig();
  // đặt từ trái sang phải: người, T. rex, ... Utahraptor; mõm hướng trái nên các con "nhìn" con đứng trước
  let x = 0;
  const items: { sp: string; x: number }[] = [];
  x += 1.2; // chỗ cho người
  for (const sp of ORDER) {
    const e = extent(sp);
    x += e.left + (items.length === 0 ? 1.4 : 0);
    items.push({ sp, x });
    x += e.right + gap;
  }
  const total = x;
  const cx = total / 2 - 0.6;
  const dist = 120;
  const halfW = total / 2 + 1.5;
  const fov = 2 * Math.atan(halfW / (width / height) / dist) * (180 / Math.PI) * 1.0;
  const cam: [number, number, number] = [cx, 3.2, dist];
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov, near: 1, far: 400 }} gl={{ antialias: true, alpha: true }}>
        <Cam pos={cam} look={[cx, 3.2, 0]} />
        <Lights />
        <group position={[0.2, 0, 0]} rotation={[0, -Math.PI / 2 + 0.0, 0]}>
          <BlockHuman t={0} />
        </group>
        {items.map(({ sp, x }) => (
          <group key={sp} position={[x, 0, 0]}>
            <BlockTheropod t={1.2} spec={DINOS[sp]} walk={0} roar={0} />
          </group>
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const MerchSolo: React.FC<{ sp: string; roar?: number }> = ({ sp, roar = 0 }) => {
  const { width, height } = useVideoConfig();
  const S = DINOS[sp];
  const e = extent(sp);
  const cx = (e.right - e.left) / 2;
  const dist = 90;
  const halfW = (e.left + e.right) / 2 + 1.2;
  const fov = 2 * Math.atan(halfW / (width / height) / dist) * (180 / Math.PI);
  const a = 0.45; // quay nhẹ để thấy 3/4 trước
  const cam: [number, number, number] = [cx + Math.sin(a) * dist, S.hip * 0.8, Math.cos(a) * dist];
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov, near: 1, far: 400 }} gl={{ antialias: true, alpha: true }}>
        <Cam pos={cam} look={[cx, S.hip * 0.8, 0]} />
        <Lights />
        <BlockTheropod t={1.2} spec={S} walk={0} roar={roar} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// Sprite nhìn ngang, cùng tỉ lệ (PXM px / mét), cùng hàng đất (y = SIDE_H/2 + 3.4 * PXM) cho mọi loài
export const SIDE_W = 3400, SIDE_H = 1800, PXM = 234;
export const MerchSide: React.FC<{ sp: string }> = ({ sp }) => {
  const { width, height } = useVideoConfig();
  const dist = 120;
  const fov = 2 * Math.atan(height / 2 / PXM / dist) * (180 / Math.PI);
  const isHuman = sp === "human";
  const left = isHuman ? 0.5 : extent(sp).left;
  const cx = -left + 0.3 + width / 2 / PXM; // mõm cách mép trái 0,3 m
  const cam: [number, number, number] = [cx, 3.4, dist];
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov, near: 1, far: 400 }} gl={{ antialias: true, alpha: true }}>
        <Cam pos={cam} look={[cx, 3.4, 0]} />
        <Lights />
        {isHuman ? (
          <group position={[-left + 0.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><BlockHuman t={0} /></group>
        ) : (
          <BlockTheropod t={1.2} spec={DINOS[sp]} walk={0} roar={0} />
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
