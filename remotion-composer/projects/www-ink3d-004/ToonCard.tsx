// r04: any toon.ts-style drawing (props2d.ts) on a camera-facing card in the 3D world, built like the host card
// (ToonHost.tsx): yaw-only billboard (or full billboard for flying things), alpha-tested, casts its silhouette shadow,
// optional soft contact blob on the ground, no world ink on it (it carries its own plum outline), painted light side
// follows the sun as seen from the camera.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Pen } from "./toon";
import { V3 } from "./World";
import { lightAngle } from "./ToonHost";

export type CardDraw = (p: Pen, light: number) => void;
export const ToonCard: React.FC<{
  w: number; h: number; // canvas size (design px)
  width: number; // card width in m (height follows the canvas aspect)
  pos: V3; // world position of the card's anchor (bottom centre unless `center`)
  center?: boolean; // anchor = card centre (flying things)
  draw: CardDraw; camPos: V3; camLook: V3; sun: V3;
  roll?: number; flip?: boolean; tint?: string; opacity?: number;
  shadow?: boolean; blob?: number; // contact blob width in m (0 = none), placed on the ground under the card
  ground?: number; // ground height for the blob
  res?: number; // canvas px per design px
  soft?: boolean; // soft alpha (glows, dust): blended, no depth write, no shadow
}> = (P) => {
  const { w, h, width, pos, center = false, draw, camPos, camLook, sun, roll = 0, flip = false, tint = "#FFFFFF", opacity = 1,
    shadow = true, blob = 0, ground = 0, res = 1, soft = false } = P;
  const r = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * res); cv.height = Math.round(h * res);
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = soft ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
      : new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const bc = document.createElement("canvas"); bc.width = bc.height = 128;
    const bg = bc.getContext("2d")!, grd = bg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(20,12,30,0.5)"); grd.addColorStop(0.6, "rgba(20,12,30,0.26)"); grd.addColorStop(1, "rgba(20,12,30,0)");
    bg.fillStyle = grd; bg.fillRect(0, 0, 128, 128);
    const blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    return { g, tex, mat, depth, blobMat };
  }, [w, h, res, soft]);
  const cam = useMemo(() => new THREE.PerspectiveCamera(), []);
  cam.position.set(...camPos); cam.lookAt(...camLook); cam.updateMatrixWorld();
  const light = lightAngle(new THREE.Vector3(...sun).normalize(), cam);
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, w * res, h * res);
  r.g.setTransform(res, 0, 0, res, 0, 0);
  draw(new Pen(r.g), light);
  r.tex.needsUpdate = true;
  r.mat.color.set(tint);
  const height = (width * h) / w;
  const yaw = Math.atan2(camPos[0] - pos[0], camPos[2] - pos[2]);
  if (opacity <= 0.01) return null;
  return (
    <group>
      {blob > 0 ? (
        <mesh material={r.blobMat} rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], ground + 0.012, pos[2]]} userData={{ noNormal: true }}>
          <planeGeometry args={[blob, blob * 0.42]} />
        </mesh>
      ) : null}
      <group position={pos} rotation={[0, yaw, 0]}>
        <group position={[0, center ? 0 : height / 2, 0]} rotation={[0, 0, roll]}>
          <mesh material={r.mat} customDepthMaterial={r.depth} castShadow={shadow && !soft} scale={[(flip ? -1 : 1) * width, height, 1]}
            userData={soft ? { noNormal: true } : { noNormal: true, noInk: true, flatNormal: r.tex }}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
