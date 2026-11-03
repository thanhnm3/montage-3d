import React from "react";
import { Composition } from "remotion";
import { Ink3DBarn, BarnProps } from "./Barn";
import { Sheet } from "./Sheet";
import { Ink3DBarnFree } from "./FreeBarn";
import { Ink3DBarnHybrid } from "./HybridBarn";

export const Root: React.FC = () => (
  <>
  <Composition id="KenneySheet" component={Sheet} fps={30} width={5184} height={3840} durationInFrames={1} defaultProps={{ file: "free/kenney_man.svg" }} />
  <Composition id="Ink3DBarn" component={Ink3DBarn} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as BarnProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
  <Composition id="Ink3DBarnFree" component={Ink3DBarnFree} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as BarnProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
  <Composition id="Ink3DBarnHybrid" component={Ink3DBarnHybrid} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as BarnProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
  </>
);
