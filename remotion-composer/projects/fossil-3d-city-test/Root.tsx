import { Composition } from "remotion";
import { CityScene } from "./CityScene";
import { Turntable } from "./Turntable";
import { ModelViewer } from "./ModelViewer";
import { GlbPreview } from "./GlbPreview";
import { Short008_3D } from "./Short008_3D";
import { LionShowcase } from "./LionShowcase";
import { BlockLionShowcase } from "./BlockLionShowcase";
import { BlockRexShowcase } from "./BlockRexShowcase";
import { DinoShowcase, DinoLineup, DinoFace, LINEUP } from "./BlockDinoShowcase";
import { Short009_3D, Short009_3D_Free, Short009_3D_Ink, Thumb009 } from "./Short009_3D";
import { Short010_3D, Thumb010 } from "./Short010_3D";
import { Short011_3D, Thumb011 } from "./Short011_3D";
import { Short012_3D, Thumb012 } from "./Short012_3D";
import { Short013_3D, EST013 } from "./Short013_3D";
import { Long006_3D, HOOK_FRAMES, EP_FRAMES } from "./Long006_3D";
import { Thumb006 } from "./Thumb006";
import { MerchPoster } from "./MerchPoster";
import { MerchLineup, MerchSolo, MerchSide, SIDE_W, SIDE_H } from "./MerchLineup";
import { calculateMetadata, SceneProps } from "./short008Overlays";

export const Root: React.FC = () => (
  <>
  <Composition
    id="FossilCity3D"
    component={CityScene}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
  <Composition id="MegalodonTurntable" component={Turntable} durationInFrames={240} fps={30} width={1600} height={900} />
  <Composition id="MegalodonHead" component={Turntable} durationInFrames={240} fps={30} width={1600} height={900} defaultProps={{ dist: 9, tx: -7, a0: -0.9 }} />
  <Composition id="GlbPreview" component={GlbPreview} durationInFrames={1} fps={30} width={1600} height={900} defaultProps={{ files: [] as string[] }} />
  <Composition id="ModelViewer" component={ModelViewer} durationInFrames={240} fps={30} width={1600} height={900} defaultProps={{ model: "t_rex" }} />
  <Composition id="Short008-3D" component={Short008_3D} durationInFrames={1208} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="LionTrellis" component={LionShowcase} durationInFrames={240} fps={30} width={1080} height={1920} />
  <Composition id="RexBlock" component={BlockRexShowcase} durationInFrames={240} fps={30} width={1920} height={1080} />
  {LINEUP.map((sp) => <Composition key={sp} id={`Dino-${sp}`} component={DinoShowcase} durationInFrames={240} fps={30} width={1920} height={1080} defaultProps={{ sp }} />)}
  {LINEUP.map((sp) => <Composition key={`f${sp}`} id={`Face-${sp}`} component={DinoFace} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={{ sp }} />)}
  <Composition id="DinoLineup" component={DinoLineup} durationInFrames={420} fps={30} width={1920} height={1080} />
  <Composition id="LionBlock" component={BlockLionShowcase} durationInFrames={240} fps={30} width={1080} height={1920} />
  <Composition id="Short009-3D" component={Short009_3D} durationInFrames={1309} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Short009-3D-Ink" component={Short009_3D_Ink} durationInFrames={1309} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Short009-3D-Free" component={Short009_3D_Free} durationInFrames={1309} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Short011-3D" component={Short011_3D} durationInFrames={1276} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Thumb011" component={Thumb011} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Short013-3D" component={Short013_3D} durationInFrames={EST013.totalFrames} fps={30} width={1080} height={1920} defaultProps={EST013} calculateMetadata={calculateMetadata} />
  <Composition id="Short012-3D" component={Short012_3D} durationInFrames={1873} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Thumb012" component={Thumb012} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Short010-3D" component={Short010_3D} durationInFrames={1605} fps={30} width={1080} height={1920} defaultProps={{} as SceneProps} calculateMetadata={calculateMetadata} />
  <Composition id="Thumb010" component={Thumb010} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Thumb009" component={Thumb009} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Long006Hook" component={Long006_3D} durationInFrames={HOOK_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ pal: "storm" }} />
  <Composition id="Thumb006" component={Thumb006} durationInFrames={1} fps={30} width={1920} height={1080} />
  <Composition id="MerchLineup" component={MerchLineup} durationInFrames={1} fps={30} width={3840} height={1600} />
  {LINEUP.map((sp) => <Composition key={`m${sp}`} id={`MerchSolo-${sp}`} component={MerchSolo} durationInFrames={1} fps={30} width={2400} height={2400} defaultProps={{ sp }} />)}
  {["human", ...LINEUP].map((sp) => <Composition key={`s${sp}`} id={`MerchSide-${sp}`} component={MerchSide} durationInFrames={1} fps={30} width={SIDE_W} height={SIDE_H} defaultProps={{ sp }} />)}
  <Composition id="MerchPoster" component={MerchPoster} durationInFrames={1} fps={30} width={3600} height={5400} defaultProps={{ meta: {} as any }} />
  <Composition id="Long006" component={Long006_3D} durationInFrames={EP_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ pal: "storm" }} />
  </>
);
