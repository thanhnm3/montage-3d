// Duyệt khủng long khối (16:9).
// DinoBlock: một loài, đứng cạnh người khối 1,8 m, quay đầu rồi gầm; máy quay vòng từ hông sang 3/4 chính diện.
// DinoLineup: 5 loài xếp hàng theo thứ hạng #5 → #1, máy trượt dọc hàng, từng con gầm lần lượt.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { BlockHuman, BlockTheropod, DINOS } from "./BlockAnimals";
import { Cam } from "./Short008_3D";
import { Badlands, BadLights, BAD } from "./Badlands";

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);

export const DinoShowcase: React.FC<{ sp: string }> = ({ sp }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  const S = DINOS[sp];
  const k0 = S.hip / 3.15;
  const walk = 1 - ease((t - 3.6) / 0.9);
  const SPEED = 2.2 * Math.sqrt(k0);
  const x = 6 * k0 - SPEED * (t < 3.6 ? t : 3.6 + 0.45 * Math.min(0.9, t - 3.6));
  const roar = pulse(t, 5.0, 7.6);
  const k = ease(t / 8);
  const a = 0.3 - 1.4 * k;
  const R = (19 - 6 * k) * Math.max(0.55, k0);
  const lookY = S.hip + 0.5 * k0 + 0.6 * roar;
  const look: [number, number, number] = [x - 2 * k0, lookY, 0];
  // máy thấp sát đất, ngước lên
  const cam: [number, number, number] = [x - 2 * k0 + Math.sin(a) * R, 0.7 * Math.max(0.6, k0) + 0.3 * k, Math.cos(a) * R];
  return (
    <AbsoluteFill style={{ background: BAD.skyTop }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 38, near: 0.1, far: 900 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={look} />
        <BadLights x={x} cam={cam} />
        <Badlands t={t} />
        <group position={[x, 0, 0]}>
          <BlockTheropod t={t} spec={S} walk={walk} roar={roar} look={-0.25 * ease((t - 4) / 0.8) * (1 - roar)} />
        </group>
        <group position={[-4.5 * k0 - 1, 0, 3.2 * k0]} rotation={[0, Math.PI, 0]}>
          <BlockHuman t={t} />
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(4,4,6,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

// thứ hạng #5 → #1, đặt theo trục Z, cùng quay đầu về -X
export const LINEUP = ["utahraptor", "carnotaurus", "spinosaurus", "giganotosaurus", "trex"];
const GAP = 11;
const LABEL: Record<string, string> = { utahraptor: "#5 UTAHRAPTOR", carnotaurus: "#4 CARNOTAURUS", spinosaurus: "#3 SPINOSAURUS", giganotosaurus: "#2 GIGANOTOSAURUS", trex: "#1 T. REX" };

export const DinoLineup: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  // 2,4 s mỗi con: máy trượt tới con đó trong 0,8 s đầu, con đó gầm ở 0,9 → 2,3 s
  const SEG = 2.4;
  const idx = Math.min(LINEUP.length - 1, Math.floor(t / SEG));
  const u = t - idx * SEG;
  const zOf = (i: number) => (i - 2) * GAP;
  const camZ = idx === 0 ? zOf(0) : zOf(idx - 1) + (zOf(idx) - zOf(idx - 1)) * ease(u / 0.8);
  const end = ease((t - SEG * 5) / 1.6); // lùi ra toàn cảnh
  // khoảng cách máy theo cỡ từng con (con nhỏ đứng gần hơn)
  const kOf = (i: number) => DINOS[LINEUP[i]].hip / 3.15;
  const kk = idx === 0 ? kOf(0) : kOf(idx - 1) + (kOf(idx) - kOf(idx - 1)) * ease(u / 0.8);
  const D = 0.35 + 0.65 * kk;
  const cam: [number, number, number] = [(-13 * D) * (1 - end) - 46 * end, (1.0 * D) * (1 - end) + 4 * end, (camZ + 10 * D) * (1 - end) - 4 * end];
  const look: [number, number, number] = [-2 * D * (1 - end) - 2 * end, 3.4 * D * (1 - end) + 3 * end, camZ * (1 - end)];
  return (
    <AbsoluteFill style={{ background: BAD.skyTop }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, near: 0.1, far: 900 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={look} />
        <BadLights x={0} r={34} cam={cam} />
        <Badlands t={t} />
        {LINEUP.map((sp, i) => {
          const roar = i === idx ? pulse(u, 0.9, 2.3) : 0;
          return (
            <group key={sp} position={[0, 0, zOf(i)]}>
              <BlockTheropod t={t} spec={DINOS[sp]} walk={0} roar={roar} phase={i * 1.3} />
            </group>
          );
        })}
        <group position={[-3.5, 0, zOf(2) - 5]} rotation={[0, Math.PI, 0]}>
          <BlockHuman t={t} />
        </group>
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 80, bottom: 70, fontFamily: "Arial Black, Arial", fontSize: 64, color: "#FFF6E4", textShadow: "0 4px 18px rgba(0,0,0,0.55)", opacity: 1 - end }}>
        {LABEL[LINEUP[idx]]}
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(4,4,6,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

// cận mặt 3/4 chính diện, máy thấp hơn mắt (để duyệt độ dữ tợn và làm thumbnail)
export const DinoFace: React.FC<{ sp: string }> = ({ sp }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  const S = DINOS[sp];
  const k0 = S.hip / 3.15;
  const roar = pulse(t, 2.0, 5.5) * 0.85;
  const headX = -(0.76 * S.body[0] + S.neck[0] * 0.8 + S.skull[0] * 0.5) - 0.2 * k0;
  const headY = S.hip + 0.2 * k0 + S.body[1] * 0.3;
  const R = 3.2 + 4.2 * k0 + S.snout[0] * 1.2;
  const a = -0.95 + 0.12 * Math.sin(t * 0.5);
  const look: [number, number, number] = [headX, headY + 0.1, 0];
  const cam: [number, number, number] = [headX + Math.sin(a) * R, headY - 0.9 * k0, Math.cos(a) * R];
  return (
    <AbsoluteFill style={{ background: BAD.skyTop }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 34, near: 0.1, far: 900 }} gl={{ antialias: true }}>
        <Cam pos={cam} look={look} />
        <BadLights x={headX} cam={cam} />
        <Badlands t={t} />
        <BlockTheropod t={t} spec={S} walk={0} roar={roar} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,4,6,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
