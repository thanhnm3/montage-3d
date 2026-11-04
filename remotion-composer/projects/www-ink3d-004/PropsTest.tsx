// r04 stills harness: every toon.ts-style prop of props2d.ts on one sheet (2D only, light from the upper left)
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import * as P from "./props2d";

const L = -2.1;
const Cell: React.FC<{ w: number; h: number; s: number; label: string; draw: (p: Pen) => void }> = ({ w, h, s, label, draw }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(s, 0, 0, s, 0, 0); draw(new Pen(g)); }, [draw, s]);
  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: 22, margin: 6 }}>
      <canvas ref={ref} width={w * s} height={h * s} />
      <div>{label}</div>
    </div>
  );
};
const allLit: P.RegionState = Array.from({ length: P.N_REG }, () => [0.9, 0]);
const tenPct: P.RegionState = Array.from({ length: P.N_REG }, (_, i) => (i === 0 ? [0.9, 0] : [0, 0.85]));
const plain: P.RegionState = Array.from({ length: P.N_REG }, () => [0, 0]);
export const PropsTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#C9D6EA", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", padding: 10 }}>
    <Cell w={P.COW_W} h={P.COW_H} s={0.45} label="cow" draw={(p) => P.drawCow(p, { eyes: "dot" }, L)} />
    <Cell w={P.COW_W} h={P.COW_H} s={0.45} label="cow lifted" draw={(p) => P.drawCow(p, { eyes: "shock", dangle: 1 }, L)} />
    <Cell w={P.COW_W} h={P.COW_H} s={0.45} label="cow wave" draw={(p) => P.drawCow(p, { eyes: "half", wave: 1 }, L)} />
    <Cell w={P.BIRD_W} h={P.BIRD_H} s={0.8} label="bird" draw={(p) => P.drawBird(p, 0.8, L)} />
    <Cell w={P.BIRD_W} h={P.BIRD_H} s={0.8} label="bird shock" draw={(p) => P.drawBird(p, -0.6, L, true)} />
    <Cell w={P.ROCK_W} h={P.ROCK_H} s={0.8} label="rock" draw={(p) => P.drawRock(p, 3, L)} />
    <Cell w={P.LEAF_W} h={P.LEAF_H} s={1} label="leaf" draw={(p) => P.drawLeaf(p, L)} />
    <Cell w={P.WATCH_W} h={P.WATCH_H} s={0.5} label="stopwatch" draw={(p) => P.drawStopwatch(p, 0.13, L)} />
    <Cell w={P.CLOCK_W} h={P.CLOCK_H} s={0.55} label="24h clock" draw={(p) => P.drawClock24(p, 0.6, L)} />
    <Cell w={P.SCIS_W} h={P.SCIS_H} s={0.6} label="scissors" draw={(p) => P.drawScissors(p, 0.8, L)} />
    <Cell w={P.BRAIN_W} h={P.BRAIN_H} s={0.34} label="brain" draw={(p) => P.drawBrain(p, plain, L)} />
    <Cell w={P.BRAIN_W} h={P.BRAIN_H} s={0.34} label="brain 10% / 90% off" draw={(p) => P.drawBrain(p, tenPct, L)} />
    <Cell w={P.BRAIN_W} h={P.BRAIN_H} s={0.34} label="brain all lit" draw={(p) => P.drawBrain(p, allLit, L)} />
  </AbsoluteFill>
);
