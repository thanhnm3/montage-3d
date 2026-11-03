// r02 person: a free CC0 rigged human (Quaternius "Casual Character", Poly Pizza kZ3DmIoGip) instead of the 2D host.
// - body: the model's own clips (Idle / HitRecieve / Wave ...) + procedural arm/head poses aimed in character space
//   (axis-agnostic: each bone is swung so it points at a target direction, so no per-bone euler guessing)
// - face: the model's painted eyes/brows are hidden and a canvas face (eyes, brows, nose, mouth) is drawn every frame
//   and projected onto the head skin in the skin shader, so it sticks to the head through every turn and nod
// - lip sync from the Rhubarb cues, blinks, teeth chattering in the cold, goosebumps that rise on the forearm
import React, { useMemo } from "react";
import * as THREE from "three";
import { Models, place } from "./FreeWorld";
import { V3, clamp01, ease, lerp, toon } from "./World";

// ------------------------------------------------------------------ face
export type Face = {
  bL: number; bR: number; // brow height -1..1
  tL: number; tR: number; // brow tilt: + inner end up (worried), - inner end down (angry)
  lid: number; // upper lid 0 open .. 1 shut
  wide: number; // 0..1 eyes popped
  px: number; py: number; ps: number; // pupil offset -1..1, pupil scale
  smile: number; // -1 frown .. 1 smile
  open: number; // extra jaw open 0..1
  teeth: number; // 0..1 clenched teeth showing
  blush: number; nose: number; // cold red cheeks / nose
  happyEyes: number; // 0..1 ^^ closed-arc eyes
  side: number; // mouth pulled to one side -1..1 (smirk / confused)
  chatter: number; // teeth chattering when silent
};
const F0: Face = { bL: 0, bR: 0, tL: 0, tR: 0, lid: 0.12, wide: 0, px: 0, py: 0, ps: 1, smile: 0.1, open: 0, teeth: 0, blush: 0, nose: 0, happyEyes: 0, side: 0, chatter: 0 };
export const EXPR: Record<string, Partial<Face>> = {
  neutral: {},
  cold: { tL: 0.7, tR: 0.7, bL: 0.2, bR: 0.2, lid: 0.28, smile: -0.45, blush: 0.75, nose: 1, chatter: 1 },
  smug: { bL: 0.75, bR: -0.15, tL: -0.1, tR: 0.1, lid: 0.38, smile: 0.55, side: 0.6, blush: 0.4, nose: 0.7 },
  confused: { bL: 0.6, bR: -0.35, tL: 0.4, tR: -0.3, lid: 0.12, px: 0.35, py: 0.8, smile: -0.2, side: -0.55, blush: 0.5, nose: 0.8, chatter: 0.4 },
  deadpan: { bL: -0.2, bR: -0.2, lid: 0.58, smile: -0.05, px: 0, py: 0, blush: 0.4, nose: 0.6 },
  scared: { bL: 1, bR: 1, tL: 0.6, tR: 0.6, lid: 0, wide: 1, ps: 0.55, smile: -0.6, open: 0.55, teeth: 0.4 },
  strain: { bL: -0.7, bR: -0.7, tL: -0.75, tR: -0.75, lid: 0.45, smile: 0.1, teeth: 1, blush: 1 },
  happy: { bL: 0.35, bR: 0.35, tL: 0.1, tR: 0.1, lid: 0.1, smile: 1, blush: 0.25 },
  laugh: { bL: 0.4, bR: 0.4, tL: 0.3, tR: 0.3, happyEyes: 1, smile: 1, open: 0.35, blush: 0.7 },
  curious: { bL: 0.6, bR: 0.3, tL: 0.15, tR: 0, lid: 0.05, wide: 0.35, py: 0.9, px: -0.3, smile: 0.25 },
  shrug: { bL: 0.7, bR: 0.7, tL: 0.25, tR: 0.25, lid: 0.3, smile: 0.35, side: 0.4 },
};
export const mixFace = (a: Face, b: Face, k: number): Face => {
  const o = { ...a };
  for (const key of Object.keys(a) as (keyof Face)[]) o[key] = lerp(a[key], b[key], k);
  return o;
};
export const faceOf = (name: string): Face => ({ ...F0, ...(EXPR[name] ?? {}) });

// Rhubarb mouth shapes -> [open, width, round, teeth]
const VIS: Record<string, [number, number, number, number]> = {
  X: [0, 1, 0, 0], A: [0, 0.92, 0, 0], B: [0.22, 1.02, 0, 0.9], C: [0.48, 1.05, 0, 0.5], D: [0.9, 1.0, 0, 0.35],
  E: [0.55, 0.78, 0.55, 0.15], F: [0.3, 0.55, 1, 0], G: [0.2, 0.98, 0, 1], H: [0.5, 0.95, 0, 0.3],
};
export type Cue = { start: number; end: number; value: string };
export function mouthAt(cues: Cue[], t: number) {
  const i = cues.findIndex((c) => t >= c.start && t < c.end);
  if (i < 0) return { v: VIS.X, talk: false };
  const cur = VIS[cues[i].value] ?? VIS.X;
  const prev = i > 0 ? VIS[cues[i - 1].value] ?? VIS.X : VIS.X;
  const k = clamp01((t - cues[i].start) / 0.06);
  return { v: cur.map((x, j) => lerp(prev[j], x, k)) as [number, number, number, number], talk: cues[i].value !== "X" };
}

const SKIN = "#F2C29E", INK = "#211A30";
function drawFace(ctx: CanvasRenderingContext2D, f: Face, m: [number, number, number, number], t: number, blink: number) {
  const S = 512;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  ctx.setTransform(1.22, 0, 0, 1.22, 256 - 256 * 1.22, 236 - 236 * 1.22); // features sized for the model's head
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // cold cheeks + nose
  if (f.blush > 0.01) {
    ctx.fillStyle = `rgba(232,92,92,${0.42 * f.blush})`;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(256 + sx * 118, 318, 52, 30, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  // eyes
  const ey = 238, ex = 84;
  const lid = Math.max(f.lid, blink) * (1 - f.wide * 0.8);
  for (const sx of [-1, 1]) {
    const cx = 256 + sx * ex;
    const rx = 31 + f.wide * 7, ry = 38 + f.wide * 10;
    if (f.happyEyes > 0.5) {
      ctx.strokeStyle = INK; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.arc(cx, ey + 14, 30, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      continue;
    }
    if (lid > 0.93) { // shut: one lid line
      ctx.strokeStyle = INK; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(cx - rx, ey + 6); ctx.quadraticCurveTo(cx, ey + 18, cx + rx, ey + 6); ctx.stroke();
      continue;
    }
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, ey, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFDF6"; ctx.fill();
    ctx.clip();
    const pr = 17 * f.ps;
    const pxx = cx + f.px * 12 + Math.sin(t * 0.9 + sx) * 1.2, pyy = ey + 4 - f.py * -1 * 0 + f.py * 12;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(pxx, pyy, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(pxx - pr * 0.35, pyy - pr * 0.4, Math.max(3, pr * 0.32), 0, Math.PI * 2); ctx.fill();
    // upper lid
    if (lid > 0.01) {
      const ly = ey - ry + lid * 2 * ry;
      ctx.fillStyle = SKIN; ctx.fillRect(cx - rx - 4, ey - ry - 4, rx * 2 + 8, ly - (ey - ry) + 4);
      ctx.strokeStyle = INK; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(cx - rx - 2, ly); ctx.lineTo(cx + rx + 2, ly); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(cx, ey, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // brows: thick strokes, height + tilt (inner end up = worried)
  for (const sx of [-1, 1]) {
    const h = sx < 0 ? f.bR : f.bL, tilt = sx < 0 ? f.tR : f.tL; // canvas left = character's right
    const cx = 256 + sx * 88, cy = 168 - h * 26 - f.wide * 8;
    const inner = cx - sx * 40, outer = cx + sx * 40;
    ctx.strokeStyle = "#3A2A22"; ctx.lineWidth = 17;
    ctx.beginPath(); ctx.moveTo(inner, cy - tilt * 18); ctx.quadraticCurveTo(cx, cy - 10 - tilt * 4, outer, cy + tilt * 12); ctx.stroke();
  }
  // nose
  // nose: the model has its own; only the cold red tip is painted
  if (f.nose > 0.01) { ctx.fillStyle = `rgba(226,70,70,${0.75 * f.nose})`; ctx.beginPath(); ctx.ellipse(256, 292, 20, 15, 0, 0, Math.PI * 2); ctx.fill(); }
  // mouth
  const [vo, vw, vr, vt] = m;
  const chat = f.chatter * (0.12 + 0.12 * Math.abs(Math.sin(t * 38)));
  const open = clamp01(vo * 0.85 + f.open + chat);
  const w = 64 * vw * (1 - vr * 0.35) * (1 + f.smile * 0.12);
  const mx = 256 + f.side * 16, my = 330;
  const curve = f.smile * 22; // + corners up
  const tilt = f.side * 10;
  const lx = mx - w, rx = mx + w, ly = my - curve - tilt, ry = my - curve + tilt;
  const oh = open * 70;
  if (oh < 4) {
    ctx.strokeStyle = INK; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(mx, my + curve * 1.2, rx, ry); ctx.stroke();
    if (f.teeth > 0.5) { // clenched grin
      ctx.fillStyle = "#FFFDF6"; ctx.beginPath(); ctx.moveTo(lx + 6, ly - 4); ctx.quadraticCurveTo(mx, my + curve * 1.2 - 14, rx - 6, ry - 4);
      ctx.quadraticCurveTo(mx, my + curve * 1.2 + 16, lx + 6, ly - 4); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 4; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(mx + i * 18, my - 8); ctx.lineTo(mx + i * 18, my + 12); ctx.stroke(); }
    }
    return;
  }
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.quadraticCurveTo(mx, my + curve * 0.6 - oh * 0.25, rx, ry); // upper lip
  ctx.quadraticCurveTo(mx, my + curve * 1.2 + oh, lx, ly); // lower lip
  ctx.closePath();
  ctx.fillStyle = "#7A2232"; ctx.fill();
  ctx.save(); ctx.clip();
  const teeth = Math.max(vt, f.teeth, f.chatter > 0.5 ? 0.8 : 0);
  if (teeth > 0.05) { ctx.fillStyle = "#FFFDF6"; ctx.fillRect(lx, my - oh * 0.35 - 30, w * 2, 30 + oh * 0.28 * teeth); }
  ctx.fillStyle = "#D9566A"; ctx.beginPath(); ctx.ellipse(mx, my + curve + oh * 0.75, w * 0.55, oh * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.quadraticCurveTo(mx, my + curve * 0.6 - oh * 0.25, rx, ry);
  ctx.quadraticCurveTo(mx, my + curve * 1.2 + oh, lx, ly);
  ctx.closePath(); ctx.stroke();
}

// ------------------------------------------------------------------ body poses (directions in character space: +x = his left, +y up, +z forward)
type D3 = [number, number, number];
export type Pose = {
  uaL?: D3; laL?: D3; uaR?: D3; laR?: D3;
  head?: D3; // yaw (+ = turn to his left), pitch (+ = look down), roll (+ = tilt to his left)
  chest?: D3; // same, on the chest
  shrug?: number; // shoulders up 0..1
  grip?: number; // finger curl 0 open .. 1 fist (default 0.55 relaxed)
  hunch?: number; // shoulders forward 0..1
};
const mirror = (d: D3): D3 => [-d[0], d[1], d[2]];
const both = (ua: D3, la: D3) => ({ uaL: ua, laL: la, uaR: mirror(ua), laR: mirror(la) });
export const POSES: Record<string, Pose> = {
  clip: {},
  hug: { ...both([0.1, -0.88, 0.46], [-0.97, 0.2, 0.08]), head: [0, 0.18, 0], hunch: 0.7, shrug: 0.5, grip: 0.9 },
  chest: { uaR: [-0.25, -0.85, 0.45], laR: [0.6, 0.3, 0.72], head: [0.1, -0.05, 0.12] },
  selfCheck: { uaR: [-0.25, -0.85, 0.45], laR: [0.6, 0.3, 0.72], uaL: [0.25, -0.85, 0.45], laL: [-0.35, 0.1, 0.92], head: [0, 0.45, 0], chest: [0, 0.1, 0] },
  lookArm: { uaR: [-0.42, -0.52, 0.74], laR: [0.82, 0.28, 0.5], uaL: [0.2, -0.95, 0.1], laL: [0.15, -0.9, 0.35], head: [-0.32, 0.42, -0.1], chest: [-0.12, 0.08, 0] },
  armsDown: { ...both([0.14, -0.98, 0.05], [0.08, -0.95, 0.25]), head: [0, 0.02, 0] },
  scared: { ...both([0.4, -0.55, 0.62], [-0.12, 0.88, 0.45]), head: [0.25, -0.12, 0], chest: [0.15, -0.12, 0], shrug: 1 },
  puff: { ...both([0.98, 0.0, 0.2], [0.05, 0.99, -0.1]), head: [0, -0.12, 0], chest: [0, -0.15, 0], shrug: 0.4, grip: 1 },
  shrug: { ...both([0.3, -0.92, 0.15], [0.55, 0.12, 0.82]), head: [0, 0, 0.2], shrug: 1 },
  pointUp: { uaR: [-0.3, 0.88, 0.32], laR: [-0.08, 0.99, 0.1], uaL: [0.18, -0.96, 0.1], laL: [0.12, -0.9, 0.38], head: [-0.25, -0.35, 0] },
  facepalm: { uaR: [-0.2, -0.35, 0.92], laR: [0.32, 0.82, -0.42], uaL: [0.16, -0.97, 0.1], laL: [0.1, -0.92, 0.36], head: [0, 0.4, 0.05], chest: [0, 0.12, 0] },
};

// swing `bone` so the direction bone -> child points along `dir` (world), by k
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _pqi = new THREE.Quaternion(), _id = new THREE.Quaternion(), _qt = new THREE.Quaternion();
function aim(bone: THREE.Object3D, child: THREE.Object3D, dir: THREE.Vector3, k: number) {
  if (k <= 0.001) return;
  bone.updateMatrixWorld(true);
  bone.getWorldPosition(_a); child.getWorldPosition(_b);
  const d0 = _b.sub(_a).normalize();
  _q.slerpQuaternions(_id, _qt.setFromUnitVectors(d0, dir.clone().normalize()), k);
  bone.parent!.getWorldQuaternion(_pq); _pqi.copy(_pq).invert();
  bone.quaternion.premultiply(_pqi.clone().multiply(_q).multiply(_pq));
  bone.updateMatrixWorld(true);
}
function turn(bone: THREE.Object3D, axis: THREE.Vector3, ang: number) {
  if (Math.abs(ang) < 1e-4) return;
  _q.setFromAxisAngle(axis, ang);
  bone.parent!.getWorldQuaternion(_pq); _pqi.copy(_pq).invert();
  bone.quaternion.premultiply(_pqi.clone().multiply(_q).multiply(_pq));
  bone.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the person
export type PersonKey = { t: number; clip?: string; clipFrom?: number; loop?: boolean; pose?: string; face?: string; poseW?: number };
export type PersonState = { clip: string; clipT: number; loop: boolean; prevClip: string; prevT: number; clipK: number; pose: Pose; poseW: number; face: Face };
const BLEND = 0.22;
export const CURL_AXIS = new THREE.Vector3(0, 0, 1); // tested: +z curls this rig's fingers into the palm
export let CURL_SIGN = 1;
export const setCurl = (axis: [number, number, number], sign: number) => { CURL_AXIS.set(...axis); CURL_SIGN = sign; };
export function personAt(keys: PersonKey[], t: number): PersonState {
  let cur: Required<Pick<PersonKey, "clip" | "pose" | "face">> & { clipStart: number; loop: boolean; poseW: number } = { clip: "Idle", pose: "clip", face: "neutral", clipStart: 0, loop: true, poseW: 1 };
  let prev = cur, poseStart = 0, faceStart = 0, prevPose = "clip", prevFace = "neutral", prevPoseW = 1;
  for (const k of keys) {
    if (k.t > t) break;
    const nx = { ...cur };
    if (k.clip && k.clip !== cur.clip) { prev = cur; nx.clip = k.clip; nx.clipStart = k.t - (k.clipFrom ?? 0); nx.loop = k.loop ?? true; }
    if (k.pose && k.pose !== cur.pose) { prevPose = cur.pose; prevPoseW = cur.poseW; nx.pose = k.pose; nx.poseW = k.poseW ?? 1; poseStart = k.t; }
    if (k.face && k.face !== cur.face) { prevFace = cur.face; nx.face = k.face; faceStart = k.t; }
    cur = nx;
  }
  const pk = ease(clamp01((t - poseStart) / BLEND));
  const fk = ease(clamp01((t - faceStart) / 0.16));
  const ck = ease(clamp01((t - cur.clipStart) / BLEND));
  const a = POSES[prevPose] ?? {}, b = POSES[cur.pose] ?? {};
  // pose blend: lerp each target (missing target = the clip's own direction, handled by its weight)
  const pose: Pose = {};
  const wA: Record<string, number> = {}, wB: Record<string, number> = {};
  for (const key of ["uaL", "laL", "uaR", "laR", "head", "chest"] as const) {
    const va = a[key], vb = b[key];
    if (va && vb) pose[key] = [0, 1, 2].map((j) => lerp(va[j], vb[j], pk)) as D3;
    else if (vb) pose[key] = vb;
    else if (va) pose[key] = va;
    wA[key] = va ? prevPoseW * (1 - pk) : 0; wB[key] = vb ? cur.poseW * pk : 0;
  }
  (pose as Record<string, unknown>).__w = Object.fromEntries(Object.keys(wA).map((k) => [k, Math.max(wA[k] + wB[k], 0)]));
  pose.shrug = lerp(a.shrug ?? 0, b.shrug ?? 0, pk);
  pose.hunch = lerp(a.hunch ?? 0, b.hunch ?? 0, pk);
  pose.grip = lerp(a.grip ?? 0.55, b.grip ?? 0.55, pk);
  return {
    clip: cur.clip, clipT: t - cur.clipStart, loop: cur.loop, prevClip: prev.clip, prevT: t - prev.clipStart, clipK: prev === cur ? 1 : ck,
    pose, poseW: 1, face: mixFace(faceOf(prevFace), faceOf(cur.face), fk),
  };
}

const ARM = 0.0; void ARM;
export const PERSON_H = 1.78;
const N_BUMPS = 170;
export const Person: React.FC<{ models: Models; pos: V3; rot: number; t: number; st: PersonState; cues: Cue[]; shiver?: number; bumps?: number; hairUp?: number }> = ({ models, pos, rot, t, st, cues, shiver = 0, bumps = 0, hairUp = 0 }) => {
  const r = useMemo(() => {
    const src = models.man;
    src.obj.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) m.userData.matName = (m.material as THREE.Material).name; });
    const g = place(src, PERSON_H, "y", { colors: { LightBrown: "#2C8C88" } }); // teal tee: the grey one read as bare skin under the orange yard light
    const bones: Record<string, THREE.Object3D> = {};
    let headMesh: THREE.Mesh | null = null;
    g.traverse((n) => {
      if ((n as THREE.Bone).isBone) bones[n.name.replace(/\./g, "")] = n; // GLTFLoader drops the dots
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const nm = m.userData.matName as string;
      if (nm === "Eye" || nm === "Eyebrows") m.visible = false;
      if (nm === "Skin" && m.parent && /Head/.test(m.name + m.parent.name)) headMesh = m;
    });
    // fall back: the skin primitive whose bounding box is highest
    if (!headMesh) {
      let best = -1e9;
      g.traverse((n) => {
        const m = n as THREE.Mesh;
        if (!m.isMesh || m.userData.matName !== "Skin") return;
        const b = new THREE.Box3().setFromObject(m, true);
        if (b.max.y > best) { best = b.max.y; headMesh = m; }
      });
    }
    const o = g.children[0];
    const mixer = new THREE.AnimationMixer(o);
    // face canvas + projector
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const faceTex = new THREE.CanvasTexture(canvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 4;
    const uni = { faceMat: { value: new THREE.Matrix4() }, faceTex: { value: faceTex }, faceSize: { value: 0.2 } };
    const hm = headMesh as THREE.Mesh | null;
    if (hm) {
      const mat = (hm.material as THREE.Material).clone();
      mat.onBeforeCompile = (s) => {
        Object.assign(s.uniforms, uni);
        s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 faceMat; varying vec3 vFace; varying float vFaceN;")
          .replace("#include <skinning_vertex>", "#include <skinning_vertex>\nvFace = (faceMat * vec4(transformed, 1.0)).xyz;\nvFaceN = (mat3(faceMat) * normalize(objectNormal)).z;");
        s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D faceTex; uniform float faceSize; varying vec3 vFace; varying float vFaceN;")
          .replace("#include <color_fragment>", `#include <color_fragment>
            vec2 fuv = vFace.xy / faceSize + 0.5;
            if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0 && vFace.z > -0.14 && vFaceN > 0.05) {
              vec4 fc = texture2D(faceTex, fuv);
              diffuseColor.rgb = mix(diffuseColor.rgb, fc.rgb, fc.a * smoothstep(0.05, 0.3, vFaceN));
            }`);
      };
      hm.material = mat;
    }
    // face frame: a child of the head bone at the face centre, looking forward (+z of the character)
    const head = bones["Head"];
    const frame = new THREE.Object3D();
    g.updateMatrixWorld(true);
    // rest pose: the face centre a little above the head bone, measured from the head skin box
    const hb = hm ? new THREE.Box3().setFromObject(hm, true) : new THREE.Box3(new THREE.Vector3(-0.1, 1.5, -0.1), new THREE.Vector3(0.1, 1.78, 0.1));
    const hs = hb.getSize(new THREE.Vector3());
    const centre = new THREE.Vector3(head.getWorldPosition(new THREE.Vector3()).x, hb.min.y + hs.y * 0.47, hb.max.z);
    head.add(frame);
    frame.position.copy(head.worldToLocal(centre.clone()));
    const hq = head.getWorldQuaternion(new THREE.Quaternion());
    frame.quaternion.copy(hq.invert());
    frame.scale.setScalar(1 / head.getWorldScale(new THREE.Vector3()).x); // face space in metres
    uni.faceSize.value = hs.x * 0.98;
    // goosebumps: small domes around the right forearm (bone space)
    const la = bones["LowerArmR"], wr = bones["WristR"];
    const axis = wr.position.clone();
    const len = axis.length(); axis.normalize();
    const ws = la.getWorldScale(new THREE.Vector3()).x;
    const t1 = new THREE.Vector3(1, 0, 0); if (Math.abs(t1.dot(axis)) > 0.9) t1.set(0, 0, 1);
    const u = t1.clone().cross(axis).normalize(), v = axis.clone().cross(u).normalize();
    const radius = 0.034 / ws;
    let s = 17;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const bumpPts = Array.from({ length: N_BUMPS }, () => {
      const a = rnd() * Math.PI * 2, along = 0.12 + rnd() * 0.72;
      return { p: axis.clone().multiplyScalar(len * along).addScaledVector(u, Math.cos(a) * radius).addScaledVector(v, Math.sin(a) * radius), n: u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)), d: rnd() };
    });
    const bumpGeo = new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const bumpMesh = new THREE.InstancedMesh(bumpGeo, (bones && (headMesh as THREE.Mesh | null)?.material) ? toon({ color: new THREE.Color("#E3A57E") }) : new THREE.MeshToonMaterial(), N_BUMPS);
    const hairGeo = new THREE.CylinderGeometry(0.12, 0.3, 1, 4); hairGeo.translate(0, 0.5, 0);
    const hairMesh = new THREE.InstancedMesh(hairGeo, new THREE.MeshToonMaterial({ color: new THREE.Color("#4A3226") }), N_BUMPS);
    la.add(bumpMesh); la.add(hairMesh);
    bumpMesh.frustumCulled = hairMesh.frustumCulled = false;
    return { g, o, bones, mixer, ctx, faceTex, uni, frame, hm, bumpPts, bumpMesh, hairMesh, ws, axis };
  }, [models]);

  // --- body: clip(s)
  const clips = models.man.clips;
  const find = (n: string) => clips.find((c) => c.name === `CharacterArmature|${n}`) ?? clips.find((c) => c.name === n) ?? clips[0];
  r.mixer.stopAllAction();
  const ca = find(st.clip);
  const tA = st.loop ? st.clipT % ca.duration : Math.min(st.clipT, ca.duration - 0.001);
  const actA = r.mixer.clipAction(ca); actA.reset(); actA.play(); actA.time = Math.max(0, tA); actA.weight = st.clipK;
  if (st.clipK < 1) {
    const cb = find(st.prevClip);
    const actB = r.mixer.clipAction(cb); actB.reset(); actB.play(); actB.time = Math.max(0, st.prevT % cb.duration); actB.weight = 1 - st.clipK;
  }
  r.mixer.update(0);
  r.g.position.set(...pos); r.g.rotation.set(0, rot, 0);
  r.g.updateMatrixWorld(true);

  // --- body: procedural pose on top, in character space -> world
  const B = r.bones;
  const cq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0));
  const W = (d: D3) => new THREE.Vector3(...d).normalize().applyQuaternion(cq);
  const p = st.pose as Pose & { __w?: Record<string, number> };
  const w = p.__w ?? {};
  const X = new THREE.Vector3(1, 0, 0).applyQuaternion(cq), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1).applyQuaternion(cq);
  const sh = shiver * (0.5 + 0.5 * Math.sin(t * 3.1));
  if (p.chest && w.chest) { turn(B["Chest"], Y, p.chest[0] * w.chest); turn(B["Chest"], X, p.chest[1] * w.chest); turn(B["Chest"], Z, -p.chest[2] * w.chest); }
  if (sh > 0) turn(B["Chest"], Y, Math.sin(t * 61) * 0.035 * sh);
  for (const side of ["L", "R"] as const) {
    const s = side === "L" ? 1 : -1;
    if (p.shrug) turn(B[`Shoulder${side}`], Z, s * 0.28 * p.shrug);
    if (p.hunch) turn(B[`Shoulder${side}`], Y, -s * 0.22 * p.hunch);
    const ua = p[`ua${side}`], laD = p[`la${side}`];
    if (ua) aim(B[`UpperArm${side}`], B[`LowerArm${side}`], W(ua), w[`ua${side}`] ?? 1);
    if (laD) aim(B[`LowerArm${side}`], B[`Wrist${side}`], W(laD), w[`la${side}`] ?? 1);
    if (sh > 0) turn(B[`UpperArm${side}`], Z, Math.sin(t * 67 + s) * 0.05 * sh);
  }
  // fingers: the model ships them splayed wide (spidery at a distance) -> curl every segment about its own bend axis
  const grip = p.grip ?? 0.55;
  for (const side of ["L", "R"]) for (const fn of ["Index", "Middle", "Ring", "Pinky"]) for (let j = 2; j <= 4; j++) {
    const b = B[`${fn}${j}${side}`];
    if (b) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(CURL_AXIS, CURL_SIGN * grip * (j === 2 ? 0.9 : 0.75)));
  }
  for (const side of ["L", "R"]) { const b = B[`Thumb2${side}`]; if (b) b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(CURL_AXIS, CURL_SIGN * grip * 0.4)); }
  if (p.head && w.head) { turn(B["Head"], Y, p.head[0] * w.head); turn(B["Head"], X, p.head[1] * w.head); turn(B["Head"], Z, -p.head[2] * w.head); }
  // talking: little nods on stressed syllables
  const m = mouthAt(cues, t);
  turn(B["Head"], X, (m.talk ? 0.035 * m.v[0] : 0) + Math.sin(t * 1.7) * 0.015);
  if (sh > 0) turn(B["Head"], Z, Math.sin(t * 71) * 0.03 * sh);
  r.g.updateMatrixWorld(true);

  // --- face
  const blinkPh = (t + 0.37) % 3.1;
  const blink = blinkPh < 0.14 ? Math.sin((blinkPh / 0.14) * Math.PI) : 0;
  drawFace(r.ctx, st.face, m.v, t, blink);
  r.faceTex.needsUpdate = true;
  if (r.hm) {
    r.frame.updateMatrixWorld(true);
    r.uni.faceMat.value.copy(r.frame.matrixWorld).invert().multiply(r.hm.matrixWorld);
  }

  // --- goosebumps on the forearm
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), yA = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3();
  const bumpR = 0.0042 / r.ws;
  r.bumpPts.forEach((b, i) => {
    const k = clamp01(bumps * 1.4 - b.d * 0.4);
    q.setFromUnitVectors(yA, b.n);
    sc.set(bumpR * (0.4 + 0.6 * k), bumpR * 0.9 * k + 1e-6, bumpR * (0.4 + 0.6 * k));
    r.bumpMesh.setMatrixAt(i, mm.compose(b.p, q, sc));
    const hk = clamp01(hairUp * 1.4 - b.d * 0.4);
    const dir = b.n.clone().multiplyScalar(0.25 + hk).addScaledVector(r.axis, 1 - hk).normalize();
    q.setFromUnitVectors(yA, dir);
    sc.set(0.0012 / r.ws, (0.014 / r.ws) * (k > 0.01 ? 1 : 0) + 1e-6, 0.0012 / r.ws);
    r.hairMesh.setMatrixAt(i, mm.compose(b.p, q, sc));
  });
  r.bumpMesh.instanceMatrix.needsUpdate = true; r.hairMesh.instanceMatrix.needsUpdate = true;
  r.bumpMesh.visible = bumps > 0.01; r.hairMesh.visible = bumps > 0.01;

  return <primitive object={r.g} />;
};
