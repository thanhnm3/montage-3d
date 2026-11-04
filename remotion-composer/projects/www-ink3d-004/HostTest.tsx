// stills harness for StickHost: frame 0 = every pose, frame 1 = every expression (2D only, no 3D)
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HOST_EXPR, HOST_POSES, drawHost, hostState } from "./StickHost";

const Cell: React.FC<{ pose: string; expr: string; label: string }> = ({ pose, expr, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    drawHost(ctx, hostState([{ t: -5, pose, expr }], 1.0), 1.0, 0);
  }, [pose, expr]);
  return (
    <div style={{ width: 256, textAlign: "center", fontFamily: "sans-serif", fontSize: 22 }}>
      <canvas ref={ref} width={512} height={768} style={{ width: 256, height: 384 }} />
      <div>{label}</div>
    </div>
  );
};
export const HostTest: React.FC = () => {
  const f = useCurrentFrame();
  const items = f === 0 ? Object.keys(HOST_POSES).map((p) => [p, "neutral", p]) : Object.keys(HOST_EXPR).map((e) => ["idle", e, e]);
  return (
    <AbsoluteFill style={{ background: "#C9D6EA", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 8, padding: 10 }}>
      {items.map(([p, e, l]) => <Cell key={l} pose={p} expr={e} label={l} />)}
    </AbsoluteFill>
  );
};
