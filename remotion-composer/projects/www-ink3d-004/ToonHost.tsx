// r03 host (2026-11-04): the channel host drawn with toon.ts from the cartoon-3d-short skill (bean head with a
// thick-thin plum outline, bean torso, single-stroke limbs with ink-dot hands, painted crescent shading weighted away
// from the light, the skill's face library) on a camera-facing card in the 3D world, the way its cast.ts does it:
// - yaw-only billboard, alpha-tested, casts its silhouette shadow, a soft contact blob under the feet;
// - no world ink on the card (userData.noInk, Ink.tsx), it carries its own outline;
// - the painted light side follows the real sun as seen from the camera (45 degree steps);
// - limited animation: poses snap with a 3-frame squash + settle, blinks every 0.5-2.3 s lasting 4 frames,
//   a small breathing bob; no lip sync (the reference does not have it either).
// Character design is the channel's own: black hair, mustard hoodie, jeans, white sneakers.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Expr, Gesture, Outfit, Pen, bodyFront } from "./toon";
import { V3 } from "./World";

export const HOST: Outfit = { jacket: "#D9A033", pants: "#3F6FA8", boots: "#F4F1EA", hat: "hair", hair: "#2A2230", skin: "#ffe2c2", buttons: "none" };
export type HostKey = { t: number; gesture?: Gesture | "idle" | "wave"; expr?: Expr; look?: number; facing?: -1 | 0 | 1; mode?: "stand" | "fall" };

// design space 600 x 1000 (soles at y = 975), drawn at K px per unit
const K = 1.2, CW = 600 * K, CH = 1000 * K;
export const SU = 0.00216; // m per design unit (the skill's scale: adults ~1.68 m)
export const HOST_HEAD_Y = (975 - 309) * SU; // head centre height, m

const hash = (n: number) => { const s = Math.sin(n * 127.1 + 17.3) * 43758.5453; return s - Math.floor(s); };
/** 4-frame blink windows, gaps 0.5-2.3 s (characters.md) */
function blinkAt(t: number, seed: number) {
  let at = 0.6 + hash(seed) * 1.2, i = 0;
  while (at < t - 0.2 && i++ < 400) at += 0.5 + hash(seed + i) * 1.8;
  const d = (t - at) * 30;
  return d >= 0 && d < 4 ? (d < 1 || d >= 3 ? 0.5 : 1) : 0;
}

export function hostAt(keys: HostKey[], t: number) {
  let g: HostKey["gesture"] = "idle", e: Expr = "neutral", look = 0, facing: -1 | 0 | 1 = 0, since = 99, mode: "stand" | "fall" = "stand";
  for (const k of keys) {
    if (k.t > t) break;
    if (k.gesture && k.gesture !== g) { g = k.gesture; since = t - k.t; } else if (k.gesture) since = Math.min(since, t - k.t);
    if (k.expr) e = k.expr;
    if (k.look !== undefined) look = k.look;
    if (k.facing !== undefined) facing = k.facing;
    if (k.mode) mode = k.mode;
  }
  // squash 3 frames after the snap, then a short stretch that settles
  const f = since * 30;
  const squash = f < 3 ? -0.05 : f < 9 ? 0.035 * Math.sin(((f - 3) / 6) * Math.PI) : 0;
  return { gesture: g, expr: e, look, facing, squash, mode };
}

/** canvas angle the light comes FROM on a camera-facing card, snapped to 45 degrees */
export function lightAngle(sunDir: THREE.Vector3, cam: THREE.Camera) {
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  const a = Math.atan2(-sunDir.dot(upv), sunDir.dot(right));
  return Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
}

// r04: lift (m, flying / jumping), roll (rad, about the body centre: lying on the ground), glow (0..1 glowing eyes,
// "100% unlocked"), hit (extra squash, the WRONG stamp), and the card is marked as the host for the time-freeze grade
const PIVOT = (975 - 600) * SU; // body centre above the soles, m
export const ToonHost: React.FC<{ keys: HostKey[]; t: number; pos: V3; camPos: V3; camLook: V3; sun: V3; tint?: string; seed?: number; flip?: boolean;
  lift?: number; roll?: number; glow?: number; hit?: number; blobK?: number }> = ({ keys, t, pos, camPos, camLook, sun, tint = "#FFFFFF", seed = 4, flip = false,
  lift = 0, roll = 0, glow = 0, hit = 0, blobK = 1 }) => {
  const r = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = CW; cv.height = CH;
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const geo = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
    geo.translate(0, (975 - 500) * SU, 0); // soles (design y = 975) on the ground
    // contact blob: soft dark ellipse on the ground
    const bc = document.createElement("canvas"); bc.width = bc.height = 128;
    const bg = bc.getContext("2d")!, grd = bg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(20,12,30,0.55)"); grd.addColorStop(0.6, "rgba(20,12,30,0.3)"); grd.addColorStop(1, "rgba(20,12,30,0)");
    bg.fillStyle = grd; bg.fillRect(0, 0, 128, 128);
    const blob = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    return { g, tex, mat, depth, geo, blob };
  }, []);
  // the camera as the card sees it (for the light side)
  const cam = useMemo(() => new THREE.PerspectiveCamera(), []);
  cam.position.set(...camPos); cam.lookAt(...camLook); cam.updateMatrixWorld();
  const s = hostAt(keys, t);
  const light = lightAngle(new THREE.Vector3(...sun).normalize(), cam);
  r.g.setTransform(1, 0, 0, 1, 0, 0); r.g.clearRect(0, 0, CW, CH);
  // squash/stretch about the soles, breathing bob
  const sq = s.squash - hit;
  const sy = 1 + sq + 0.006 * Math.sin(t * 2 * Math.PI * 0.45);
  r.g.setTransform(K * (1 - sq * 0.5), 0, 0, K * sy, 300 * K * (sq * 0.5), 975 * K * (1 - sy));
  bodyFront(new Pen(r.g), HOST, {
    mode: s.mode, expr: s.expr, look: s.look, facing: s.facing, light, seed,
    blink: blinkAt(t, seed), gesture: s.gesture === "idle" || s.gesture === "wave" ? undefined : s.gesture,
    wave: s.gesture === "wave" ? Math.sin(t * 14) : undefined,
  });
  if (glow > 0.01) { // glowing eyes: soft gold halo + white-hot core over each eye
    for (const ex of [300 - 30.7, 300 + 30.7]) {
      const gr = r.g.createRadialGradient(ex, 309, 0, ex, 309, 46);
      gr.addColorStop(0, `rgba(255,255,235,${glow.toFixed(3)})`); gr.addColorStop(0.35, `rgba(255,214,80,${(0.9 * glow).toFixed(3)})`); gr.addColorStop(1, "rgba(255,190,40,0)");
      r.g.fillStyle = gr; r.g.beginPath(); r.g.arc(ex, 309, 46, 0, Math.PI * 2); r.g.fill();
    }
  }
  r.tex.needsUpdate = true;
  r.mat.color.set(tint);
  const yaw = Math.atan2(camPos[0] - pos[0], camPos[2] - pos[2]);
  return (
    <group position={pos}>
      {blobK > 0.02 ? <mesh material={r.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[blobK, blobK, 1]} userData={{ noNormal: true }}>
        <planeGeometry args={[0.75, 0.32]} />
      </mesh> : null}
      <group rotation={[0, yaw, 0]}>
        <group position={[0, lift + PIVOT, 0]} rotation={[0, 0, roll]}>
          <mesh geometry={r.geo} material={r.mat} customDepthMaterial={r.depth} castShadow scale={[flip ? -1 : 1, 1, 1]} position={[0, -PIVOT, 0]}
            userData={{ noNormal: true, noInk: true, hostCard: true, flatNormal: r.tex }} />
        </group>
      </group>
    </group>
  );
};
