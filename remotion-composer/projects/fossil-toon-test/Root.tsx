import React from "react";
import { Composition } from "remotion";
import { AnimalSheet } from "./AnimalSheet";
import { BeastMoreSheet, BeastSolo } from "./BeastMoreSheet";
import { ToonSetsDemo } from "./ToonSets";
import { FossilToonScene } from "./FossilToonScene";

export const Root: React.FC = () => (
  <>
    <Composition id="AnimalSheet" component={AnimalSheet} fps={30} width={1560} height={3400} durationInFrames={1} />
    <Composition id="BeastMoreSheet" component={BeastMoreSheet} fps={30} width={1480} height={5800} durationInFrames={1} defaultProps={{}} />
    <Composition id="BeastSolo" component={BeastSolo} fps={30} width={1600} height={1000} durationInFrames={1} defaultProps={{ name: "steg" }} />
    <Composition id="ToonSetsDemo" component={ToonSetsDemo} fps={30} width={1080} height={1920} durationInFrames={300} />
    <Composition id="FossilToonScene" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} />
    <Composition id="FossilToonSceneFierce" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ fierce: true }} />
    <Composition id="FossilToonSceneBeast" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ beast: true }} />
  </>
);
