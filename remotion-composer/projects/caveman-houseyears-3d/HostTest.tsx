// stills harness for the toon.ts host (2D only): frame 0 = every gesture, frame 1 = every expression
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Expr, Gesture, Pen, bodyFront } from "./toon";
import { HOST } from "./ToonHost";

const GESTURES: (Gesture | "idle" | "wave")[] = ["idle", "point_up", "present", "shrug", "arms_up", "think", "facepalm", "hips", "cross", "wave"];
const EXPRS: Expr[] = ["neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief", "relief_open", "dazed", "pained", "smile", "smile_closed", "lick", "bloodshot", "bloodshot_shock"];
const Cell: React.FC<{ g: (typeof GESTURES)[number]; e: Expr }> = ({ g, e }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    bodyFront(new Pen(ctx), HOST, { mode: g === "idle" && (e === "bloodshot" || e === "bloodshot_shock") ? "sit" : "stand", expr: e, seed: 4, light: -2.1, gesture: g === "idle" || g === "wave" ? undefined : g, wave: g === "wave" ? 0.5 : undefined });
  }, [g, e]);
  return (
    <div style={{ width: 300, textAlign: "center", fontFamily: "sans-serif", fontSize: 24 }}>
      <canvas ref={ref} width={300} height={500} />
      <div>{g === "idle" ? e : g}</div>
    </div>
  );
};
export const HostTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#EDE6D8", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 6, padding: 10 }}>
      {f === 0 ? GESTURES.map((g) => <Cell key={g} g={g} e="smile" />) : EXPRS.slice(9).map((e) => <Cell key={e} g="idle" e={e} />)}
    </AbsoluteFill>
  );
};
