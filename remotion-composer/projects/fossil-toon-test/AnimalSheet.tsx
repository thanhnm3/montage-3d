// 2D check sheet: per animal, the round toon version next to the fierce one (rest / walk / roar or shock)
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import { ANIMALS, AnimalName, AnimalPose } from "./toonAnimals";
import { FIERCE } from "./fierceAnimals";

const Cell: React.FC<{ a: AnimalName; fierce: boolean; o: AnimalPose; label: string }> = ({ a, fierce, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(0.3, 0, 0, 0.3, 0, 0); (fierce ? FIERCE : ANIMALS)[a].draw(new Pen(g), o); }, [a, fierce, o]);
  return <div style={{ width: 480, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={480} height={300} /><div>{label}</div></div>;
};
const CELLS: [boolean, string, AnimalPose][] = [[false, "toon", {}], [true, "fierce", {}], [true, "fierce walk", { walk: 1, phase: 0.2 }], [true, "fierce roar / shock", { roar: 1 }]];
export const AnimalSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {(Object.keys(ANIMALS) as AnimalName[]).flatMap((a) => CELLS.map(([f, l, o]) =>
      <Cell key={a + l} a={a} fierce={f} o={a !== "rex" && l.includes("roar") ? { expr: "shock" } : o} label={`${a}: ${l}`} />))}
  </AbsoluteFill>
);
