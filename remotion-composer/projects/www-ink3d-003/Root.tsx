import React from "react";
import { Composition } from "remotion";
import { Goosebumps, GooseProps } from "./Goosebumps";
import { PersonTest } from "./PersonTest";

export const Root: React.FC = () => (
  <>
    <Composition id="Goosebumps" component={Goosebumps} fps={30} width={1080} height={1920} durationInFrames={300}
      defaultProps={{} as GooseProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
    <Composition id="PersonTest" component={PersonTest} fps={30} width={1080} height={1920} durationInFrames={900} />
  </>
);
