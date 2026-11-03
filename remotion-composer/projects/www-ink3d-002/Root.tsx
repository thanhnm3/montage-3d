import React from "react";
import { Composition } from "remotion";
import { BullMyth, BullProps } from "./BullMyth";
import { BullSolo, BullThumb } from "./BullSolo";

export const Root: React.FC = () => (
  <>
  <Composition id="BullSolo" component={BullSolo} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as BullProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
  <Composition id="BullThumb" component={BullThumb} fps={30} width={1080} height={1920} durationInFrames={1}
    defaultProps={{ t: 14.45, pos: [1.25, 0.75, 31.1], look: [1.35, 1.45, 26.0], fov: 40, roll: -4 }} />
  <Composition id="BullMyth" component={BullMyth} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as BullProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
  </>
);
