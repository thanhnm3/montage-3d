import React from "react";
import { Composition } from "remotion";
import { BrainMyth, BrainProps } from "./BrainMyth";
import { HostTest } from "./HostTest";
import { PropsTest } from "./PropsTest";

// default 1030 frames = the estimated timing (T_EST, ~34 s); build.py writes the real length into props.json
export const Root: React.FC = () => (
  <>
  <Composition id="BrainMyth" component={BrainMyth} fps={30} width={1080} height={1920} durationInFrames={1030}
    defaultProps={{ durationInFrames: 1030 } as BrainProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 1030 })} />
    <Composition id="HostTest" component={HostTest} fps={30} width={1080} height={1920} durationInFrames={2} />
    <Composition id="PropsTest" component={PropsTest} fps={30} width={1080} height={1920} durationInFrames={1} />
  </>
);
