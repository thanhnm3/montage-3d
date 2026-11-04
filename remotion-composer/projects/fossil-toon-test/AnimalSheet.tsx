// 2D check sheet: per animal, the round toon version next to the fierce one (rest / walk / roar or shock)
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import { ANIMALS, AnimalName, AnimalPose } from "./toonAnimals";
import { FIERCE } from "./fierceAnimals";
import { BEAST } from "./beastAnimals";
type Style = "toon" | "fierce" | "beast";
const SETS = { toon: ANIMALS, fierce: FIERCE, beast: BEAST };

const Cell: React.FC<{ a: AnimalName; st: Style; o: AnimalPose; label: string }> = ({ a, st, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(0.6, 0, 0, 0.6, 0, 0); SETS[st][a].draw(new Pen(g), o); }, [a, st, o]);
  return <div style={{ width: 960, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={960} height={600} /><div>{label}</div></div>;
};
const CELLS: [Style, string, AnimalPose][] = [["beast", "beast (v3)", {}], ["beast", "beast roar / shock", { roar: 1 }]];
export const AnimalSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {(Object.keys(ANIMALS) as AnimalName[]).flatMap((a) => CELLS.map(([f, l, o]) =>
      <Cell key={a + l} a={a} st={f} o={a !== "rex" && l.includes("roar") ? { expr: "shock" } : o} label={`${a}: ${l}`} />))}
  </AbsoluteFill>
);
