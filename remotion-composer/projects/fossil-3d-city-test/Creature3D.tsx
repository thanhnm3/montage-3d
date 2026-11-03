// Sinh vật dựng sẵn bằng creatures/build.mjs (SDF + marching cubes) -> public/creatures/<id>.json/.bin
// Chuyển động: mỗi đỉnh gắn 2 xương (trọng số mềm ở khớp), xoay xương theo creatureAnim.ts, rồi
// uốn cả thân theo "warp" (sóng bơi, đuôi quẫy) tính trên toạ độ gốc. Tất cả là hàm thuần của t.
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { ANIM } from "./creatureAnim";

type MeshInfo = { name: string; mat: "skin" | "gloss"; vcount: number; icount: number; offs: number[] };
type Bone = { name: string; pivot: number[]; parent: number };
type Rest = { pos: Float32Array; nor: Float32Array; bi: Uint8Array; bw: Float32Array };
type Detail = { freq: number; amp: number; stretch?: number[]; tint?: number };
export type CreatureData = { id: string; meshes: MeshInfo[]; bones: Bone[]; bbox: { min: number[]; max: number[] }; roughness: number; detail?: Detail; geos: THREE.BufferGeometry[]; rest: Rest[] };

// Chi tiết nhỏ (vảy / lông / da nhăn) vẽ trong shader: nhiễu theo toạ độ vật thể -> làm lệch pháp tuyến
// (bump) và tối nhẹ chỗ lõm. Lưới SDF chỉ ~1-4 cm nên thiếu chi tiết này thì con vật trông "mờ" như đất nặn.
function detailMaterial(base: THREE.MeshStandardMaterial, d?: Detail) {
  if (!d) return base;
  const st = d.stretch ?? [1, 1, 1];
  base.onBeforeCompile = (sh) => {
    sh.uniforms.uFreq = { value: d.freq };
    sh.uniforms.uAmp = { value: d.amp };
    sh.uniforms.uTint = { value: d.tint ?? 0.22 };
    sh.uniforms.uStretch = { value: new THREE.Vector3(st[0], st[1], st[2]) };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    const noise = `
varying vec3 vObj;
uniform float uFreq; uniform float uAmp; uniform float uTint; uniform vec3 uStretch;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
// ô vảy/lông: cạnh tối, giữa phồng
float cell(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); float m = 1.0;
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c = -1; c <= 1; c++) {
    vec3 g = vec3(float(a), float(b), float(c)); vec3 o = vec3(h3(i + g), h3(i + g + 7.1), h3(i + g + 13.7));
    m = min(m, length(g + o - f)); }
  return m; }
// mờ dần khi ô nhỏ hơn ~1 px (nhìn xa) để khỏi thành nhiễu hạt
float detailFade(){ vec3 p = vObj * uFreq / uStretch; return 1.0 - smoothstep(0.25, 0.7, length(fwidth(p))); }
float detailH(){ vec3 p = vObj * uFreq / uStretch;
  return 0.5 + detailFade() * (0.65 * (1.0 - smoothstep(0.0, 0.85, cell(p))) + 0.35 * vn(p * 3.1) - 0.5); }
`;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + noise)
      .replace("#include <color_fragment>", "#include <color_fragment>\nfloat dH = detailH();\ndiffuseColor.rgb *= 1.0 - uTint + 2.0 * uTint * dH;")
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
{ vec3 dpdx = dFdx(-vViewPosition); vec3 dpdy = dFdy(-vViewPosition);
  float hx = dFdx(dH) * uAmp, hy = dFdy(dH) * uAmp;
  vec3 r1 = cross(dpdy, normal); vec3 r2 = cross(normal, dpdx); float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (hx * r1 + hy * r2);
  normal = normalize(abs(det) * normal - grad); }`,
      );
  };
  return base;
}

export function useCreature(id: string): CreatureData | null {
  const [data, setData] = useState<CreatureData | null>(null);
  const [handle] = useState(() => delayRender(`creature ${id}`));
  useEffect(() => {
    let alive = true;
    (async () => {
      const meta = await (await fetch(staticFile(`creatures/${id}.json`))).json();
      const buf = await (await fetch(staticFile(`creatures/${id}.bin`))).arrayBuffer();
      const rest: Rest[] = [];
      const geos = (meta.meshes as MeshInfo[]).map((m) => {
        const pos = new Float32Array(buf, m.offs[0], m.vcount * 3);
        const nor = new Float32Array(buf, m.offs[1], m.vcount * 3);
        rest.push({ pos, nor, bw: new Float32Array(buf, m.offs[4], m.vcount * 2), bi: new Uint8Array(buf, m.offs[5], m.vcount * 2) });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
        g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(buf, m.offs[2], m.vcount * 3), 3));
        g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, m.offs[3], m.icount), 1));
        return g;
      });
      if (alive) setData({ ...meta, geos, rest });
    })();
    return () => {
      alive = false;
    };
  }, [id]);
  useEffect(() => {
    if (data) continueRender(handle);
  }, [data, handle]);
  return data;
}

const _m = new THREE.Matrix4();
const _t = new THREE.Matrix4();
const _e = new THREE.Euler();

function boneMatrices(data: CreatureData, rot: Record<string, number[]>) {
  const world: THREE.Matrix4[] = [];
  data.bones.forEach((b, i) => {
    const r = rot[b.name];
    const local = new THREE.Matrix4();
    if (r) {
      const [px, py, pz] = b.pivot;
      _e.set(r[0], r[1], r[2], "YZX");
      local.makeTranslation(px + (r[3] ?? 0), py + (r[4] ?? 0), pz + (r[5] ?? 0));
      local.multiply(_m.makeRotationFromEuler(_e)).multiply(_t.makeTranslation(-px, -py, -pz));
    }
    world.push(b.parent >= 0 ? world[b.parent].clone().multiply(local) : local);
  });
  return world.map((m) => m.elements);
}

// Đặt tư thế cho frame t (ghi thẳng vào position/normal của geometry)
export function poseCreature(data: CreatureData, t: number, animId?: string) {
  const anim = ANIM[animId ?? data.id];
  if (!anim) return;
  const { bones, warp } = anim(t);
  const M = boneMatrices(data, bones);
  const off = [0, 0, 0];
  data.geos.forEach((g, gi) => {
    const { pos, nor, bi, bw } = data.rest[gi];
    const P = g.getAttribute("position").array as Float32Array;
    const N = g.getAttribute("normal").array as Float32Array;
    const n = pos.length / 3;
    for (let v = 0; v < n; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
      const nx = nor[v * 3], ny = nor[v * 3 + 1], nz = nor[v * 3 + 2];
      let ox = 0, oy = 0, oz = 0, qx = 0, qy = 0, qz = 0;
      for (let k = 0; k < 2; k++) {
        const w = bw[v * 2 + k];
        if (w <= 0) continue;
        const e = M[bi[v * 2 + k]];
        ox += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
        oy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
        oz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
        qx += w * (e[0] * nx + e[4] * ny + e[8] * nz);
        qy += w * (e[1] * nx + e[5] * ny + e[9] * nz);
        qz += w * (e[2] * nx + e[6] * ny + e[10] * nz);
      }
      if (warp) {
        off[0] = off[1] = off[2] = 0;
        warp(x, y, z, off);
        ox += off[0];
        oy += off[1];
        oz += off[2];
      }
      P[v * 3] = ox;
      P[v * 3 + 1] = oy;
      P[v * 3 + 2] = oz;
      const l = Math.hypot(qx, qy, qz) || 1;
      N[v * 3] = qx / l;
      N[v * 3 + 1] = qy / l;
      N[v * 3 + 2] = qz / l;
    }
    g.getAttribute("position").needsUpdate = true;
    g.getAttribute("normal").needsUpdate = true;
    g.computeBoundingSphere();
  });
}

export const Creature: React.FC<{ data: CreatureData; t?: number; anim?: string }> = ({ data, t, anim }) => {
  const mats = useMemo(
    () => ({
      skin: detailMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: data.roughness, metalness: 0 }), data.detail),
      gloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.1 }),
    }),
    [data],
  );
  if (t !== undefined) poseCreature(data, t, anim);
  return (
    <group>
      {data.meshes.map((m, i) => (
        <mesh key={m.name} geometry={data.geos[i]} material={mats[m.mat]} castShadow receiveShadow frustumCulled={false} />
      ))}
    </group>
  );
};
