import React from "react";
import { Composition } from "remotion";
import { HouseYears, HouseProps } from "./HouseYears";
import { HostTest } from "./HostTest";

// default length = the estimated timing (T_EST); build.py writes the real length into props.json
export const Root: React.FC = () => (
  <>
    <Composition id="HouseYears" component={HouseYears} fps={30} width={1080} height={1920} durationInFrames={1200}
      defaultProps={{ durationInFrames: 1200 } as HouseProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 1200 })} />
    <Composition id="HostTest" component={HostTest} fps={30} width={1080} height={1920} durationInFrames={2} />
  </>
);
