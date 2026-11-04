// 2D check sheet: every beast-style animal standing and roaring (or shocked), plus the round and fierce versions
// via the `st` column if needed
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import { ANIMALS, AnimalPose } from "./toonAnimals";
import { FIERCE } from "./fierceAnimals";
import { BEAST } from "./beastAnimals";
import { YouPose, drawYou } from "./youToon";
type Style = "toon" | "fierce" | "beast";
type Drawer = Record<string, { draw: (p: Pen, o: AnimalPose) => void }>;
const SETS: Record<Style, Drawer> = { toon: ANIMALS, fierce: FIERCE, beast: BEAST };
const K = 0.45;

const Cell: React.FC<{ a: string; st: Style; o: AnimalPose; label: string }> = ({ a, st, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(K, 0, 0, K, 0, 0); (SETS[st][a] ?? SETS.beast[a]).draw(new Pen(g), o); }, [a, st, o]);
  return <div style={{ width: 1600 * K, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={1600 * K} height={1000 * K} /><div>{label}</div></div>;
};
const YouCell: React.FC<{ o: YouPose; label: string }> = ({ o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { drawYou(ref.current!.getContext("2d")!, 0.42, o, 4); }, [o]);
  return <div style={{ width: 252, fontFamily: "sans-serif", fontSize: 20, textAlign: "center" }}><canvas ref={ref} width={252} height={420} /><div>{label}</div></div>;
};
const YOU_STATES: [string, YouPose][] = [["fall / shock", { mode: "fall", expr: "shock" }], ["breath / relief", { expr: "relief" }], ["slap / pained", { gesture: "facepalm", expr: "pained" }],
  ["back off / nervous", { gesture: "shrug", expr: "nervous" }], ["freeze / shock", { gesture: "hips", expr: "shock" }], ["sit / grin", { mode: "sit", expr: "grin" }]];
const ALL = ["raptor", "rex", "trike", "mammoth", "meg", "boa"];
const BITES = ["rex", "meg", "boa"];
export const AnimalSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {YOU_STATES.map(([l, o]) => <YouCell key={l} o={o} label={`you: ${l}`} />)}
    {ALL.flatMap((a) => [
      <Cell key={a + "r"} a={a} st="beast" o={{ walk: 0.5, phase: 0.1 }} label={`${a}: beast`} />,
      <Cell key={a + "x"} a={a} st="beast" o={BITES.includes(a) ? { roar: 1 } : { expr: "shock" }} label={`${a}: ${BITES.includes(a) ? "roar" : "shock"}`} />,
    ])}
  </AbsoluteFill>
);
