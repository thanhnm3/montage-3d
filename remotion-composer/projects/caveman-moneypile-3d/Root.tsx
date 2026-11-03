import React from "react";
import { Composition } from "remotion";
import { MoneyPile, PileProps } from "./MoneyPile";

export const Root: React.FC = () => (
  <Composition id="MoneyPile3D" component={MoneyPile} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as PileProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
);
