import React from "react";
import { Composition } from "remotion";
import { MovieTicket, TicketProps } from "./MovieTicket";

export const Root: React.FC = () => (
  <Composition id="MovieTicket3D" component={MovieTicket} fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{} as TicketProps} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames ?? 300 })} />
);
