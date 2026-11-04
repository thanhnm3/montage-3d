import React from "react";
import { Composition } from "remotion";
import { RichHouse, RichProps } from "./RichHouse";
import { HostTest } from "./HostTest";

// default length = the estimated timing (T_EST); build.py writes the real length into props.json
export const Root: React.FC = () => (
  <>
    <Composition id="RichHouse" component={RichHouse} fps={30} width={1080} height={1920} durationInFrames={1380}
      defaultProps={{ durationInFrames: 1380 } as RichProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 1380 })} />
    <Composition id="HostTest" component={HostTest} fps={30} width={1080} height={1920} durationInFrames={2} />
  </>
);
