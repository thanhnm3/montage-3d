// 2D check sheet: frame 0 = each animal in 4 states (rest / walking / expression / roar), drawn on plain canvases
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import { ANIMALS, AnimalName, AnimalPose } from "./toonAnimals";

const Cell: React.FC<{ a: AnimalName; o: AnimalPose; label: string }> = ({ a, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(0.6, 0, 0, 0.6, 0, 0); ANIMALS[a].draw(new Pen(g), o); }, [a, o]);
  return <div style={{ width: 960, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={960} height={600} /><div>{label}</div></div>;
};
const STATES: [string, AnimalPose][] = [["angry / shock", { expr: "angry" }], ["roar / happy", { roar: 1, expr: "happy" }]];
export const AnimalSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {(Object.keys(ANIMALS) as AnimalName[]).flatMap((a) => STATES.map(([l, o]) => <Cell key={a + l} a={a} o={a !== "rex" && l.startsWith("angry") ? { expr: "shock" } : o} label={`${a}: ${l}`} />))}
  </AbsoluteFill>
);
