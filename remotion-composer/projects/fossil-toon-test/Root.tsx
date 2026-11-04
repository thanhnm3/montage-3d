import React from "react";
import { Composition } from "remotion";
import { AnimalSheet } from "./AnimalSheet";
import { BeastMoreSheet, BeastSolo } from "./BeastMoreSheet";
import { ToonSetsDemo } from "./ToonSets";
import { ToonSetsDemo2 } from "./ToonSets2";
import { WingsDemo } from "./WingsDemo";
import { ToonSetsDemo3 } from "./ToonSets3";
import { FossilToonScene } from "./FossilToonScene";

export const Root: React.FC = () => (
  <>
    <Composition id="AnimalSheet" component={AnimalSheet} fps={30} width={1560} height={3400} durationInFrames={1} />
    <Composition id="BeastMoreSheet" component={BeastMoreSheet} fps={30} width={1480} height={5800} durationInFrames={1} defaultProps={{}} />
    <Composition id="BeastWingSheet" component={BeastMoreSheet} fps={30} width={1480} height={3880} durationInFrames={1} defaultProps={{ wings: true }} />
    <Composition id="BeastExtraSheet" component={BeastMoreSheet} fps={30} width={1480} height={7750} durationInFrames={1} defaultProps={{ extra: true }} />
    <Composition id="BeastSolo" component={BeastSolo} fps={30} width={1600} height={1000} durationInFrames={1} defaultProps={{ name: "steg" }} />
    <Composition id="ToonSetsDemo" component={ToonSetsDemo} fps={30} width={1080} height={1920} durationInFrames={300} />
    <Composition id="ToonSetsDemo2" component={ToonSetsDemo2} fps={30} width={1080} height={1920} durationInFrames={300} />
    <Composition id="WingsDemo" component={WingsDemo} fps={30} width={1080} height={1920} durationInFrames={180} />
    <Composition id="ToonSetsDemo3" component={ToonSetsDemo3} fps={30} width={1080} height={1920} durationInFrames={300} />
    <Composition id="FossilToonScene" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} />
    <Composition id="FossilToonSceneFierce" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ fierce: true }} />
    <Composition id="FossilToonSceneBeast" component={FossilToonScene} fps={30} width={1080} height={1920} durationInFrames={270} defaultProps={{ beast: true }} />
  </>
);
