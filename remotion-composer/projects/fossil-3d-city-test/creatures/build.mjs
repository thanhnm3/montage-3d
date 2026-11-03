// node creatures/build.mjs <id> [outDir]  -> <outDir>/<id>.json + <id>.bin
import fs from "node:fs";
import path from "node:path";
import { buildSurface, colorize, newAcc, smoothMesh, bakeAO } from "./sdf.mjs";

const id = process.argv[2];
const outDir = process.argv[3] ?? "D:/youtube/openmontage/projects/fossil-3d-city-test/public/creatures";
const sp = (await import(`./species/${id}.mjs`)).default;

const t0 = Date.now();
const parts = sp.parts();
const surf = buildSurface(parts, { voxel: sp.voxel, displace: sp.displace });
smoothMesh(surf, sp.smooth ?? 6);
const col = colorize(surf, parts, sp.color, sp.sharp ?? 0.03, sp.boneSharp ?? 0.05);
bakeAO(surf, col, sp.ao ?? {});

// xương: root + các xương loài khai báo (cha đứng trước con)
const bones = [{ name: "root", pivot: [0, 0, 0], parent: -1 }];
for (const b of sp.bones ?? []) bones.push({ name: b.name, pivot: b.pivot, parent: b.parent ? bones.findIndex((x) => x.name === b.parent) : 0 });
const bi = (name) => {
  const i = bones.findIndex((b) => b.name === name);
  if (i < 0) throw new Error(`xương không có: ${name}`);
  return i;
};

const skin = newAcc();
skin.pos = Array.from(surf.pos);
skin.nor = Array.from(surf.nor);
skin.col = Array.from(col);
skin.idx = Array.from(surf.idx);
skin.b = [];
skin.w = [];
for (const bw of surf.bones) {
  skin.b.push(bi(bw[0][0]), bw[1] ? bi(bw[1][0]) : 0);
  skin.w.push(bw[0][1], bw[1] ? bw[1][1] : 0);
}
const gloss = newAcc();
const extra = newAcc();
sp.extras?.(surf, { extra, gloss });
const rigid = (acc) => {
  acc.b = acc.bn.flatMap((n) => [bi(n), 0]);
  acc.w = acc.bn.flatMap(() => [1, 0]);
};
rigid(extra);
rigid(gloss);

// gộp phụ kiện (răng, móng) vào mesh da
const off = skin.pos.length / 3;
skin.pos.push(...extra.pos);
skin.nor.push(...extra.nor);
skin.col.push(...extra.col);
skin.b.push(...extra.b);
skin.w.push(...extra.w);
for (const i of extra.idx) skin.idx.push(i + off);

const meshes = [];
const chunks = [];
let byte = 0;
for (const [name, m, mat] of [["skin", skin, "skin"], ["gloss", gloss, "gloss"]]) {
  if (!m.idx.length) continue;
  const arrs = [new Float32Array(m.pos), new Float32Array(m.nor), new Float32Array(m.col), new Uint32Array(m.idx), new Float32Array(m.w), new Uint8Array(m.b)];
  const offs = [];
  for (const a of arrs) {
    const pad = (4 - (byte % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      byte += pad;
    }
    offs.push(byte);
    chunks.push(Buffer.from(a.buffer));
    byte += a.byteLength;
  }
  meshes.push({ name, mat, vcount: m.pos.length / 3, icount: m.idx.length, offs });
}
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let i = 0; i < skin.pos.length; i += 3)
  for (let d = 0; d < 3; d++) {
    min[d] = Math.min(min[d], skin.pos[i + d]);
    max[d] = Math.max(max[d], skin.pos[i + d]);
  }
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${id}.bin`), Buffer.concat(chunks));
fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify({ id, meshes, bones, bbox: { min, max }, roughness: sp.roughness ?? 0.8, detail: sp.detail }));
const size = max.map((v, i) => (v - min[i]).toFixed(2));
console.log(`${id}: grid ${surf.size.join("x")}, ${skin.idx.length / 3} tris, ${bones.length} bones, size ${size.join(" x ")} m, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
