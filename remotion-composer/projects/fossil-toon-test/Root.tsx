import React from "react";
import { Composition } from "remotion";
import { AnimalSheet } from "./AnimalSheet";
import { FossilToonScene } from "./FossilToonScene";

export const Root: React.FC = () => (
  <>
    <Composition id="AnimalSheet" component={AnimalSheet} fps={30} width={1960} height={1940} durationInFrames={1} />
    <Composition id="FossilToonScene" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} />
    <Composition id="FossilToonSceneFierce" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ fierce: true }} />
    <Composition id="FossilToonSceneBeast" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ beast: true }} />
  </>
);
