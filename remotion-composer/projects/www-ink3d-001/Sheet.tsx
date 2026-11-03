import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
// rasterise a Kenney Toon Characters vector sheet (864x640, 9x5 poses) at 6x
export const Sheet: React.FC<{ file: string }> = ({ file }) => (
  <AbsoluteFill style={{ background: "transparent" }}>
    <Img src={staticFile(file)} style={{ width: 864 * 6, height: 640 * 6 }} />
  </AbsoluteFill>
);
