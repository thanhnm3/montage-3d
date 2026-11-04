// 2D check sheet for beastMore.ts: each new animal walking (left) and doing its attack move (right);
// BeastSolo draws one animal alone on a transparent 1600 x 1000 canvas (used to measure x0 / x1).
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import type { AnimalPose } from "./toonAnimals";
import { BEAST_ALL, BEAST_MORE, BeastName } from "./beastMore";
const K = 0.45;
const Cell: React.FC<{ a: BeastName; o: AnimalPose; label: string }> = ({ a, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(K, 0, 0, K, 0, 0); BEAST_ALL[a].draw(new Pen(g), o); }, [a, o]);
  return <div style={{ width: 1600 * K, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={1600 * K} height={1000 * K} /><div>{label}</div></div>;
};
const MOVE: Record<string, string> = { steg: "tail swing", ankylo: "club swing", sauro: "bellow", edmonto: "bellow", pachy: "ram", spino: "bite", quetz: "gape",
  mosa: "bite", dunkle: "bite", smilo: "sabre gape", rhino: "charge", bear: "roar" };
export const BeastMoreSheet: React.FC<{ only?: string[] }> = ({ only }) => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {(only ?? Object.keys(BEAST_MORE)).flatMap((a) => [
      <Cell key={a + "w"} a={a as BeastName} o={{ walk: 0.6, phase: 0.1 }} label={`${a}: walk`} />,
      <Cell key={a + "x"} a={a as BeastName} o={{ roar: 1 }} label={`${a}: ${MOVE[a] ?? "roar"}`} />,
    ])}
  </AbsoluteFill>
);
export const BeastSolo: React.FC<{ name: string }> = ({ name }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; BEAST_ALL[name as BeastName].draw(new Pen(g), {}); }, [name]);
  return <AbsoluteFill><canvas ref={ref} width={1600} height={1000} /></AbsoluteFill>;
};
