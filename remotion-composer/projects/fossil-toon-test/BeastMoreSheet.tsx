// 2D check sheet for beastMore.ts: each new animal walking (left) and doing its attack move (right);
// BeastSolo draws one animal alone on a transparent 1600 x 1000 canvas (used to measure x0 / x1).
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import type { AnimalPose } from "./toonAnimals";
import { BEAST_MORE } from "./beastMore";
import { BEAST_WINGS } from "./beastWings";
import { BEAST_EXTRA } from "./beastExtra";
import { BEAST_ANCIENT } from "./beastAncient";
import { BEAST_MYTH } from "./beastMyth";
import { BEASTS, BeastName } from "./beasts";
const K = 0.45;
const Cell: React.FC<{ a: BeastName; o: AnimalPose; label: string }> = ({ a, o, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(K, 0, 0, K, 0, 0); BEASTS[a].draw(new Pen(g), o); }, [a, o]);
  return <div style={{ width: 1600 * K, fontFamily: "sans-serif", fontSize: 22, textAlign: "center" }}><canvas ref={ref} width={1600 * K} height={1000 * K} /><div>{label}</div></div>;
};
const MOVE: Record<string, string> = { steg: "tail swing", ankylo: "club swing", sauro: "bellow", edmonto: "bellow", pachy: "ram", spino: "bite", quetz: "gape",
  mosa: "bite", dunkle: "bite", smilo: "sabre gape", rhino: "charge", bear: "roar",
  pteranodon: "screech", quetzfly: "gape", micro: "claws out", haast: "talon strike", terror: "axe-beak strike", meganeura: "grab", dragon: "fire", dragonfly: "fire", velo: "sickle claws", sarco: "bite", puru: "bite", krono: "bite", megalania: "bite", deinother: "charge", xipho: "bite", halluci: "rears up", wyvern: "venom", basilisk: "strike", nessie: "lunge", hydra: "venom",
  allo: "roar", carno: "roar", giga: "roar", dilo: "roar", theri: "claws up", deino: "lunge bite", elasmo: "neck strike", liopleuro: "bite", dimetro: "bite",
  megather: "rears up", direwolf: "snarl", hellpig: "gape", arthro: "rears up", anomalo: "grab", helico: "whorl bite", para: "bellow" };
export const BeastMoreSheet: React.FC<{ only?: string[]; wings?: boolean; extra?: boolean; group?: "ancient" | "myth" | "redo" | "all" }> = ({ only, wings, extra, group }) => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 8 }}>
    {(only ?? (group === "redo" ? ["velo", "sarco", "wyvern", "basilisk", "nessie", "hydra", "puru", "krono", "megalania", "deinother", "xipho", "halluci"] : group === "ancient" ? [...Object.keys(BEAST_ANCIENT), "diplo", "igu", "bary", "ovi", "velo", "sarco"] : group === "myth" ? Object.keys(BEAST_MYTH) : extra ? [...Object.keys(BEAST_EXTRA), "para"] : Object.keys(wings ? BEAST_WINGS : BEAST_MORE))).flatMap((a) => [
      <Cell key={a + "w"} a={a as BeastName} o={{ walk: 0.6, phase: 0.1 }} label={`${a}: ${a in BEAST_WINGS ? "flap / walk" : "walk"}`} />,
      <Cell key={a + "x"} a={a as BeastName} o={{ roar: 1 }} label={`${a}: ${MOVE[a] ?? "roar"}`} />,
    ])}
  </AbsoluteFill>
);
export const BeastSolo: React.FC<{ name: string }> = ({ name }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; BEASTS[name as BeastName].draw(new Pen(g), {}); }, [name]);
  return <AbsoluteFill><canvas ref={ref} width={1600} height={1000} /></AbsoluteFill>;
};
// the whole library on one page: every BEASTS entry standing (or swimming / flying), with its key
const CK = 0.15;
const Mini: React.FC<{ a: BeastName }> = ({ a }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current!.getContext("2d")!; g.setTransform(CK, 0, 0, CK, 0, 0); BEASTS[a].draw(new Pen(g), {}); }, [a]);
  return <div style={{ width: 1600 * CK, fontFamily: "sans-serif", fontSize: 15, textAlign: "center" }}><canvas ref={ref} width={1600 * CK} height={1000 * CK} /><div>{a}</div></div>;
};
export const BeastCatalog: React.FC = () => (
  <AbsoluteFill style={{ background: "#CFE0EE", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 4, padding: 6 }}>
    {(Object.keys(BEASTS) as BeastName[]).map((a) => <Mini key={a} a={a} />)}
  </AbsoluteFill>
);
