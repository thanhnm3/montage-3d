import React from "react";
import { Composition } from "remotion";
import { BrainMyth, BrainProps } from "./BrainMyth";

// default 930 frames = the estimated timing (T_EST, ~31 s); build.py writes the real length into props.json
export const Root: React.FC = () => (
  <Composition id="BrainMyth" component={BrainMyth} fps={30} width={1080} height={1920} durationInFrames={930}
    defaultProps={{ durationInFrames: 930 } as BrainProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 930 })} />
);
