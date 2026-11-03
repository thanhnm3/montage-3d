import { Composition } from "remotion";
import { Rent3D } from "./Rent3D";
import { Money10x3D } from "./Money10x3D";
import { MoneyLadder3D } from "./MoneyLadder3D";

// lớp nền 3D cho các Caveman Short (PoseReel vẽ Flint/chữ/HUD lên trên)
export const Root: React.FC = () => (
  <>
    <Composition id="Rent3D" component={Rent3D} durationInFrames={1399} fps={30} width={1080} height={1920} />
    <Composition id="Money10x3D" component={Money10x3D} durationInFrames={1190} fps={30} width={1080} height={1920} />
    <Composition id="MoneyLadder3D" component={MoneyLadder3D} durationInFrames={1428} fps={30} width={1080} height={1920} />
  </>
);
