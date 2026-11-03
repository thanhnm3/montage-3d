// Bộ dựng sinh vật bằng trường khoảng cách (SDF): thân, chân, đuôi là các "phần" (part) ghép
// mềm với nhau (smooth union) rồi lấy mặt bằng marching cubes => một lớp da liền, không ngấn,
// chân/cổ/đuôi mọc liền vào thân. Chạy bằng Node (offline), xuất mesh nhị phân cho Remotion.
import * as THREE from "three";
import { edgeTable, triTable } from "three/examples/jsm/objects/MarchingCubes.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export { V };

// ---------- toán SDF ----------
const smin = (a, b, k) => {
  if (k <= 1e-6) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a, b, k) => -smin(-a, -b, k);

function sdEllipsoid(px, py, pz, rx, ry, rz) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

// iq: hình nón bo tròn hai đầu (bán kính r1 tại a, r2 tại b)
function sdRoundCone(px, py, pz, a, b, r1, r2) {
  const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = px - a.x, pay = py - a.y, paz = pz - a.z;
  const y = pax * bax + pay * bay + paz * baz;
  const z = y - l2;
  const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

function sdPolygon(px, py, vs) {
  let d = (px - vs[0][0]) ** 2 + (py - vs[0][1]) ** 2;
  let s = 1;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i, i++) {
    const ex = vs[j][0] - vs[i][0], ey = vs[j][1] - vs[i][1];
    const wx = px - vs[i][0], wy = py - vs[i][1];
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= vs[i][1], c2 = py < vs[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

// ---------- spline ----------
// Catmull-Rom qua các nút [x,y,z, ...giá trị kèm]; trả về mẫu dày, cách đều theo độ dài
export function spline(nodes, step) {
  const n = nodes.length;
  const dims = nodes[0].length;
  const at = (i) => nodes[Math.max(0, Math.min(n - 1, i))];
  const raw = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
    const m = Math.max(4, Math.ceil(segLen / (step * 0.25)));
    for (let s = 0; s < m; s++) {
      const t = s / m, t2 = t * t, t3 = t2 * t;
      const out = [];
      for (let d = 0; d < dims; d++) {
        out.push(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3));
      }
      raw.push(out);
    }
  }
  raw.push([...nodes[n - 1]]);
  // lấy lại mẫu cách đều
  const res = [raw[0]];
  let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    acc += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1], raw[i][2] - raw[i - 1][2]);
    if (acc >= step || i === raw.length - 1) {
      res.push(raw[i]);
      acc = 0;
    }
  }
  return res;
}

function frameAt(samples, i) {
  const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
  const t = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  let side = new THREE.Vector3().crossVectors(t, V(0, 1, 0));
  if (side.lengthSq() < 1e-6) side = V(0, 0, 1);
  side.normalize();
  if (side.z < 0) side.negate();
  const up = new THREE.Vector3().crossVectors(side, t).normalize();
  if (up.y < 0) up.negate();
  return { t, up, side };
}

// ---------- các loại phần ----------
// body: chuỗi elip theo xương sống, nút = [x,y,z, nửa cao, nửa rộng]
export function body(tag, nodes, { blend = 0.15, step, roll = 0 } = {}) {
  const minR = Math.min(...nodes.map((n) => Math.min(n[3], n[4])));
  const st = step ?? Math.max(0.012, minR * 0.35);
  const s = spline(nodes, st);
  const prims = s.map((p, i) => {
    const f = frameAt(s, i);
    const ry = Math.max(p[3], 0.004), rz = Math.max(p[4], 0.004);
    const rx = Math.max(st * 1.6, Math.min(ry, rz) * 0.75);
    return { kind: "ell", c: V(p[0], p[1], p[2]), ax: f.t, ay: f.up, az: f.side, r: [rx, ry, rz] };
  });
  return part(tag, prims, blend);
}

// tube: chuỗi nón bo tròn, nút = [x,y,z, bán kính]
export function tube(tag, nodes, { blend = 0.08, step } = {}) {
  const minR = Math.min(...nodes.map((n) => n[3]));
  const st = step ?? Math.max(0.01, minR * 0.6);
  const s = spline(nodes, st);
  const prims = [];
  for (let i = 0; i < s.length - 1; i++) {
    prims.push({ kind: "cone", a: V(s[i][0], s[i][1], s[i][2]), b: V(s[i + 1][0], s[i + 1][1], s[i + 1][2]), r1: Math.max(s[i][3], 0.003), r2: Math.max(s[i + 1][3], 0.003) });
  }
  return part(tag, prims, blend);
}

export function ellipsoid(tag, c, r, { blend = 0.1, rotY = 0, rotZ = 0, rotX = 0 } = {}) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rotX, rotY, rotZ, "YZX"));
  const ax = V(1, 0, 0).applyMatrix4(m), ay = V(0, 1, 0).applyMatrix4(m), az = V(0, 0, 1).applyMatrix4(m);
  return part(tag, [{ kind: "ell", c: V(...c), ax, ay, az, r }], blend);
}

// slab: hình 2D (đường cong kín Catmull-Rom qua outline) đùn dày 2*half, đặt bằng origin + trục u, v
// (w = u x v là pháp tuyến). bend: uốn cong mặt (tai voi khum).
export function slab(tag, outline, { origin, u, v, half = 0.04, blend = 0.06, bend = 0, taper = 0, smooth = true } = {}) {
  const pts = smooth ? closedSpline(outline, 6) : outline;
  const U = V(...u).normalize();
  const Vv = V(...v).normalize();
  const W = new THREE.Vector3().crossVectors(U, Vv).normalize();
  return part(tag, [{ kind: "slab", o: V(...origin), U, V: Vv, W, pts, half, bend, taper }], blend);
}

function closedSpline(pts, per) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  return out;
}

function part(tag, prims, blend) {
  for (const p of prims) p.box = primBox(p);
  const box = new THREE.Box3();
  for (const p of prims) box.union(p.box);
  return { tag, prims, blend, box, mode: "add" };
}
export const carve = (p, k = 0.03) => ({ ...p, mode: "sub", blend: k });

function primBox(p) {
  const b = new THREE.Box3();
  if (p.kind === "ell") {
    const R = Math.max(...p.r);
    b.setFromCenterAndSize(p.c, V(2 * R, 2 * R, 2 * R));
  } else if (p.kind === "cone") {
    b.setFromPoints([p.a, p.b]);
    b.expandByScalar(Math.max(p.r1, p.r2));
  } else {
    for (const q of p.pts) {
      b.expandByPoint(p.o.clone().addScaledVector(p.U, q[0]).addScaledVector(p.V, q[1]));
    }
    const R = Math.max(...p.pts.map((q) => Math.hypot(q[0], q[1])));
    b.expandByScalar(p.half + Math.abs(p.bend) * R * R + 0.02);
  }
  return b;
}

function evalPrim(p, x, y, z) {
  if (p.kind === "ell") {
    const dx = x - p.c.x, dy = y - p.c.y, dz = z - p.c.z;
    return sdEllipsoid(dx * p.ax.x + dy * p.ax.y + dz * p.ax.z, dx * p.ay.x + dy * p.ay.y + dz * p.ay.z, dx * p.az.x + dy * p.az.y + dz * p.az.z, p.r[0], p.r[1], p.r[2]);
  }
  if (p.kind === "cone") return sdRoundCone(x, y, z, p.a, p.b, p.r1, p.r2);
  const dx = x - p.o.x, dy = y - p.o.y, dz = z - p.o.z;
  const a = dx * p.U.x + dy * p.U.y + dz * p.U.z;
  const b = dx * p.V.x + dy * p.V.y + dz * p.V.z;
  const c = dx * p.W.x + dy * p.W.y + dz * p.W.z - p.bend * (a * a + b * b);
  const d2 = sdPolygon(a, b, p.pts);
  // mỏng dần ra mép (taper > 0): độ dày giảm theo khoảng cách vào trong
  const half = p.taper > 0 ? p.half * (0.35 + 0.65 * Math.min(1, -Math.min(d2, 0) / p.taper)) : p.half;
  const wx = d2, wy = Math.abs(c) - half;
  return Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0));
}

function evalPart(part, x, y, z) {
  let d = 1e9;
  for (const p of part.prims) {
    const b = p.box;
    if (x < b.min.x - 0.05 || x > b.max.x + 0.05 || y < b.min.y - 0.05 || y > b.max.y + 0.05 || z < b.min.z - 0.05 || z > b.max.z + 0.05) continue;
    d = Math.min(d, evalPrim(p, x, y, z));
  }
  return d;
}

// ---------- lưới + marching cubes ----------
export function buildSurface(parts, { voxel, displace }) {
  const box = new THREE.Box3();
  for (const p of parts) if (p.mode === "add") box.union(p.box);
  box.expandByScalar(voxel * 3 + 0.15);
  const nx = Math.ceil((box.max.x - box.min.x) / voxel) + 1;
  const ny = Math.ceil((box.max.y - box.min.y) / voxel) + 1;
  const nz = Math.ceil((box.max.z - box.min.z) / voxel) + 1;
  const N = nx * ny * nz;
  const grid = new Float32Array(N).fill(1e3);
  const ox = box.min.x, oy = box.min.y, oz = box.min.z;
  const idx = (i, j, k) => (k * ny + j) * nx + i;

  for (const part of parts) {
    const pad = part.blend + voxel * 2;
    const i0 = Math.max(0, Math.floor((part.box.min.x - pad - ox) / voxel)), i1 = Math.min(nx - 1, Math.ceil((part.box.max.x + pad - ox) / voxel));
    const j0 = Math.max(0, Math.floor((part.box.min.y - pad - oy) / voxel)), j1 = Math.min(ny - 1, Math.ceil((part.box.max.y + pad - oy) / voxel));
    const k0 = Math.max(0, Math.floor((part.box.min.z - pad - oz) / voxel)), k1 = Math.min(nz - 1, Math.ceil((part.box.max.z + pad - oz) / voxel));
    // từng phần: min trong phần, rồi ghép mềm vào lưới chung
    const sx = i1 - i0 + 1, sy = j1 - j0 + 1, sz = k1 - k0 + 1;
    const local = new Float32Array(sx * sy * sz).fill(1e3);
    for (const p of part.prims) {
      const b = p.box;
      const pi0 = Math.max(i0, Math.floor((b.min.x - pad - ox) / voxel)), pi1 = Math.min(i1, Math.ceil((b.max.x + pad - ox) / voxel));
      const pj0 = Math.max(j0, Math.floor((b.min.y - pad - oy) / voxel)), pj1 = Math.min(j1, Math.ceil((b.max.y + pad - oy) / voxel));
      const pk0 = Math.max(k0, Math.floor((b.min.z - pad - oz) / voxel)), pk1 = Math.min(k1, Math.ceil((b.max.z + pad - oz) / voxel));
      for (let k = pk0; k <= pk1; k++) {
        const z = oz + k * voxel;
        for (let j = pj0; j <= pj1; j++) {
          const y = oy + j * voxel;
          let li = ((k - k0) * sy + (j - j0)) * sx + (pi0 - i0);
          for (let i = pi0; i <= pi1; i++, li++) {
            const d = evalPrim(p, ox + i * voxel, y, z);
            if (d < local[li]) local[li] = d;
          }
        }
      }
    }
    for (let k = k0; k <= k1; k++)
      for (let j = j0; j <= j1; j++) {
        let li = ((k - k0) * sy + (j - j0)) * sx;
        let gi = idx(i0, j, k);
        for (let i = i0; i <= i1; i++, li++, gi++) {
          const d = local[li];
          if (part.mode === "add") grid[gi] = smin(grid[gi], d, part.blend);
          else grid[gi] = smax(grid[gi], -d, part.blend);
        }
      }
  }

  // vân bề mặt (lông, nếp nhăn): dời mặt theo hàm displace(x,y,z) -> mét, chỉ gần mặt
  if (displace) {
    for (let k = 0; k < nz; k++)
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const gi = idx(i, j, k);
          if (Math.abs(grid[gi]) < 0.3) grid[gi] -= displace(ox + i * voxel, oy + j * voxel, oz + k * voxel);
        }
  }

  // gradient tại điểm lưới (pháp tuyến mượt)
  const g = (i, j, k) => grid[idx(Math.max(0, Math.min(nx - 1, i)), Math.max(0, Math.min(ny - 1, j)), Math.max(0, Math.min(nz - 1, k)))];
  const grad = (i, j, k) => [g(i + 1, j, k) - g(i - 1, j, k), g(i, j + 1, k) - g(i, j - 1, k), g(i, j, k + 1) - g(i, j, k - 1)];

  const edgeVert = new Int32Array(N * 3).fill(-1);
  const pos = [], nor = [], tri = [];
  const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const EDGE = [[0, 0, 0, 0], [1, 0, 0, 1], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [1, 0, 1, 1], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 2], [1, 0, 0, 2], [1, 1, 0, 2], [0, 1, 0, 2]];
  const vertFor = (i, j, k, e) => {
    const [di, dj, dk, ax] = EDGE[e];
    const a = [i + di, j + dj, k + dk];
    const key = idx(a[0], a[1], a[2]) * 3 + ax;
    if (edgeVert[key] >= 0) return edgeVert[key];
    const b = [...a];
    b[ax]++;
    const va = grid[idx(a[0], a[1], a[2])], vb = grid[idx(b[0], b[1], b[2])];
    const t = va / (va - vb);
    const ga = grad(a[0], a[1], a[2]), gb = grad(b[0], b[1], b[2]);
    const n = [ga[0] + (gb[0] - ga[0]) * t, ga[1] + (gb[1] - ga[1]) * t, ga[2] + (gb[2] - ga[2]) * t];
    const l = Math.hypot(...n) || 1;
    const p = [ox + a[0] * voxel, oy + a[1] * voxel, oz + a[2] * voxel];
    p[ax] += t * voxel;
    pos.push(...p);
    nor.push(n[0] / l, n[1] / l, n[2] / l);
    edgeVert[key] = pos.length / 3 - 1;
    return edgeVert[key];
  };
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let ci = 0;
        for (let c = 0; c < 8; c++) if (grid[idx(i + CORNER[c][0], j + CORNER[c][1], k + CORNER[c][2])] < 0) ci |= 1 << c;
        if (edgeTable[ci] === 0) continue;
        const o = ci << 4;
        for (let q = 0; triTable[o + q] !== -1; q += 3) {
          const a = vertFor(i, j, k, triTable[o + q]), b = vertFor(i, j, k, triTable[o + q + 1]), c = vertFor(i, j, k, triTable[o + q + 2]);
          if (a === b || b === c || a === c) continue;
          // hướng tam giác theo pháp tuyến gradient
          const ax = pos[b * 3] - pos[a * 3], ay = pos[b * 3 + 1] - pos[a * 3 + 1], az = pos[b * 3 + 2] - pos[a * 3 + 2];
          const bx = pos[c * 3] - pos[a * 3], by = pos[c * 3 + 1] - pos[a * 3 + 1], bz = pos[c * 3 + 2] - pos[a * 3 + 2];
          const fx = ay * bz - az * by, fy = az * bx - ax * bz, fz = ax * by - ay * bx;
          const dn = fx * (nor[a * 3] + nor[b * 3] + nor[c * 3]) + fy * (nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1]) + fz * (nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]);
          if (dn >= 0) tri.push(a, b, c);
          else tri.push(a, c, b);
        }
      }

  const sample = (x, y, z) => {
    const fx = (x - ox) / voxel, fy = (y - oy) / voxel, fz = (z - oz) / voxel;
    const i = Math.max(0, Math.min(nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(ny - 2, Math.floor(fy))), k = Math.max(0, Math.min(nz - 2, Math.floor(fz)));
    const tx = fx - i, ty = fy - j, tz = fz - k;
    let v = 0;
    for (let c = 0; c < 8; c++) {
      const [di, dj, dk] = CORNER[c];
      v += grid[idx(i + di, j + dj, k + dk)] * (di ? tx : 1 - tx) * (dj ? ty : 1 - ty) * (dk ? tz : 1 - tz);
    }
    return v;
  };
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint32Array(tri), sample, size: [nx, ny, nz] };
}

// Kéo một điểm về mặt da (để gắn mắt, răng, móng)
export function toSurface(surf, p, steps = 12) {
  const q = p.clone();
  const e = 0.01;
  for (let s = 0; s < steps; s++) {
    const d = surf.sample(q.x, q.y, q.z);
    const gx = surf.sample(q.x + e, q.y, q.z) - surf.sample(q.x - e, q.y, q.z);
    const gy = surf.sample(q.x, q.y + e, q.z) - surf.sample(q.x, q.y - e, q.z);
    const gz = surf.sample(q.x, q.y, q.z + e) - surf.sample(q.x, q.y, q.z - e);
    const n = V(gx, gy, gz).normalize();
    q.addScaledVector(n, -d);
    if (Math.abs(d) < 0.002) return { p: q, n };
  }
  const gx = surf.sample(q.x + e, q.y, q.z) - surf.sample(q.x - e, q.y, q.z);
  const gy = surf.sample(q.x, q.y + e, q.z) - surf.sample(q.x, q.y - e, q.z);
  const gz = surf.sample(q.x, q.y, q.z + e) - surf.sample(q.x, q.y, q.z - e);
  return { p: q, n: V(gx, gy, gz).normalize() };
}

// Tô màu theo phần: trọng số mềm theo khoảng cách tới từng phần (mép chuyển màu êm)
export function colorize(surf, parts, colorFn, sharp = 0.03, boneSharp = 0.05) {
  const { pos, nor } = surf;
  const n = pos.length / 3;
  const col = new Float32Array(n * 3);
  // trọng số xương (2 xương mạnh nhất / đỉnh) để da cong mềm ở khớp
  surf.bones = new Array(n);
  const tmp = new THREE.Color();
  const P = V(0, 0, 0), Nn = V(0, 0, 0);
  const adds = parts.filter((p) => p.mode === "add");
  for (let v = 0; v < n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    P.set(x, y, z);
    Nn.set(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
    const ds = [];
    let dmin = 1e9;
    for (const part of adds) {
      const b = part.box;
      const m = part.blend + 0.1;
      if (x < b.min.x - m || x > b.max.x + m || y < b.min.y - m || y > b.max.y + m || z < b.min.z - m || z > b.max.z + m) continue;
      const d = evalPart(part, x, y, z);
      ds.push([part, d]);
      if (d < dmin) dmin = d;
    }
    const bw = {};
    for (const [part, d] of ds) {
      const b = part.bone ?? "root";
      bw[b] = (bw[b] ?? 0) + Math.exp(-(d - dmin) / boneSharp);
    }
    const top = Object.entries(bw).sort((a, b) => b[1] - a[1]).slice(0, 2);
    const tw = top.reduce((a, e) => a + e[1], 0) || 1;
    surf.bones[v] = top.length ? top.map(([k, w]) => [k, w / tw]) : [["root", 1]];
    let r = 0, g = 0, bl = 0, wsum = 0;
    for (const [part, d] of ds) {
      const w = Math.exp(-(d - dmin) / sharp);
      if (w < 0.01) continue;
      colorFn(part.tag, P, Nn, tmp);
      r += tmp.r * w;
      g += tmp.g * w;
      bl += tmp.b * w;
      wsum += w;
    }
    if (wsum === 0) {
      colorFn("_", P, Nn, tmp);
      r = tmp.r; g = tmp.g; bl = tmp.b; wsum = 1;
    }
    col[v * 3] = r / wsum;
    col[v * 3 + 1] = g / wsum;
    col[v * 3 + 2] = bl / wsum;
  }
  return col;
}

// ---------- nhiễu xác định ----------
function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  let r = 0;
  for (let c = 0; c < 8; c++) {
    const dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
    r += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return r * 2 - 1;
}
export const fbm = (x, y, z, oct = 4) => {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise3(x * f, y * f, z * f);
    a *= 0.5;
    f *= 2.03;
  }
  return s;
};
// Voronoi 3D: trả [F1, F2] (đốm hươu cao cổ)
export function voronoi(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let f1 = 9, f2 = 9, id = 0;
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++)
      for (let c = -1; c <= 1; c++) {
        const cx = xi + a, cy = yi + b, cz = zi + c;
        const px = cx + hash3(cx, cy, cz), py = cy + hash3(cy, cz, cx + 7), pz = cz + hash3(cz + 3, cx, cy);
        const d = Math.hypot(x - px, y - py, z - pz);
        if (d < f1) {
          f2 = f1;
          f1 = d;
          id = hash3(cx + 11, cy, cz);
        } else if (d < f2) f2 = d;
      }
  return [f1, f2, id];
}

// ---------- phụ kiện mesh rời (răng, móng, mắt) ----------
// nón cong nhẹ từ gốc base theo hướng dir, dài len, bán kính gốc r; màu tip -> base
export function addCone(acc, base, dir, len, r, colBase, colTip, { curve = V(0, 0, 0), seg = 8, flat = 1 } = {}) {
  const D = dir.clone().normalize();
  let side = new THREE.Vector3().crossVectors(D, V(0, 1, 0));
  if (side.lengthSq() < 1e-6) side = V(1, 0, 0);
  side.normalize();
  const up = new THREE.Vector3().crossVectors(side, D).normalize();
  const rings = 5;
  const start = acc.pos.length / 3;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const c = base.clone().addScaledVector(D, len * t).addScaledVector(curve, len * t * t);
    const rr = r * (1 - t) ** 0.9 + 0.0015;
    const cl = colBase.clone().lerp(colTip, t);
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const o = side.clone().multiplyScalar(Math.cos(a) * rr * flat).addScaledVector(up, Math.sin(a) * rr);
      const p = c.clone().add(o);
      acc.pos.push(p.x, p.y, p.z);
      const nn = o.normalize();
      acc.nor.push(nn.x, nn.y, nn.z);
      acc.col.push(cl.r, cl.g, cl.b);
      acc.bn.push(acc.bone ?? "root");
    }
  }
  for (let i = 0; i < rings; i++)
    for (let s = 0; s < seg; s++) {
      const a = start + i * seg + s, b = start + i * seg + ((s + 1) % seg), c = a + seg, d = b + seg;
      acc.idx.push(a, c, b, b, c, d);
    }
}

export function addSphere(acc, c, r, col, seg = 16) {
  const start = acc.pos.length / 3;
  for (let i = 0; i <= seg; i++) {
    const th = (i / seg) * Math.PI;
    for (let j = 0; j <= seg; j++) {
      const ph = (j / seg) * Math.PI * 2;
      const n = V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
      acc.pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
      acc.nor.push(n.x, n.y, n.z);
      acc.col.push(col.r, col.g, col.b);
      acc.bn.push(acc.bone ?? "root");
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < seg; j++) {
      const a = start + i * (seg + 1) + j, b = a + seg + 1;
      acc.idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
}
export const newAcc = () => ({ pos: [], nor: [], col: [], idx: [], bn: [], bone: "root" });
// gán xương cho các phần (part) — phần không gán thuộc "root"
export const rig = (bone, ...parts) => parts.flat().map((p) => ((p.bone = bone), p));

// Xoay điểm quanh trục qua pivot (dùng để mở hàm, đặt chân)
export function rotPt(p, pivot, axis, ang) {
  const q = V(p[0] - pivot[0], p[1] - pivot[1], p[2] - pivot[2]).applyAxisAngle(V(...axis).normalize(), ang);
  return [q.x + pivot[0], q.y + pivot[1], q.z + pivot[2], ...p.slice(3)];
}

// Làm mượt Taubin (không co thể tích) + tính lại pháp tuyến: xoá gợn nhỏ của marching cubes
export function smoothMesh(surf, iters = 6) {
  const { pos, idx } = surf;
  const n = pos.length / 3;
  const nb = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    nb[a].add(b); nb[a].add(c); nb[b].add(a); nb[b].add(c); nb[c].add(a); nb[c].add(b);
  }
  const lists = nb.map((s) => Int32Array.from(s));
  const tmp = new Float32Array(pos.length);
  const step = (lam) => {
    for (let v = 0; v < n; v++) {
      const L = lists[v];
      if (!L.length) { tmp[v * 3] = pos[v * 3]; tmp[v * 3 + 1] = pos[v * 3 + 1]; tmp[v * 3 + 2] = pos[v * 3 + 2]; continue; }
      let x = 0, y = 0, z = 0;
      for (const u of L) { x += pos[u * 3]; y += pos[u * 3 + 1]; z += pos[u * 3 + 2]; }
      x /= L.length; y /= L.length; z /= L.length;
      tmp[v * 3] = pos[v * 3] + lam * (x - pos[v * 3]);
      tmp[v * 3 + 1] = pos[v * 3 + 1] + lam * (y - pos[v * 3 + 1]);
      tmp[v * 3 + 2] = pos[v * 3 + 2] + lam * (z - pos[v * 3 + 2]);
    }
    pos.set(tmp);
  };
  for (let i = 0; i < iters; i++) { step(0.5); step(-0.53); }
  const nor = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { nor[k] += fx; nor[k + 1] += fy; nor[k + 2] += fz; }
  }
  for (let v = 0; v < n; v++) {
    const l = Math.hypot(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]) || 1;
    nor[v * 3] /= l; nor[v * 3 + 1] /= l; nor[v * 3 + 2] /= l;
  }
  surf.nor = nor;
}

// Che khuất môi trường (AO) từ SDF: khe nách, háng, trong miệng tối đi
export function bakeAO(surf, col, { dist = 0.35, strength = 1.0 } = {}) {
  const { pos, nor } = surf;
  const n = pos.length / 3;
  for (let v = 0; v < n; v++) {
    let occ = 0, w = 1;
    for (let i = 1; i <= 5; i++) {
      const h = (dist * i) / 5;
      const d = surf.sample(pos[v * 3] + nor[v * 3] * h, pos[v * 3 + 1] + nor[v * 3 + 1] * h, pos[v * 3 + 2] + nor[v * 3 + 2] * h);
      occ += w * Math.max(0, h - d);
      w *= 0.6;
    }
    const ao = Math.max(0.35, 1 - (strength * occ * 2.2) / dist);
    col[v * 3] *= ao; col[v * 3 + 1] *= ao; col[v * 3 + 2] *= ao;
  }
}

// Nội suy tuyến tính trên chuỗi nút theo x (để đặt răng dọc hàm)
export function lerpNodes(nodes, x) {
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if ((x - a[0]) * (x - b[0]) <= 0) {
      const t = (x - a[0]) / (b[0] - a[0] || 1);
      return a.map((v, k) => v + (b[k] - v) * t);
    }
  }
  return nodes[nodes.length - 1];
}
