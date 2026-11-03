// The farm, built in code: barn (paint mask gray -> red), silo, fence, cows (flat 2D cutouts that are lit and cast
// shadows), trees, hills, clouds, the paint bucket station, rusty props, mold, the night sky with the supernova.
// Every texture is painted by scenes/gen_textures.py. Sizes in metres; barn front faces +z, doors at z = 8.
import React, { useMemo } from "react";
import * as THREE from "three";

export type V3 = [number, number, number];
export type Tex = Record<string, THREE.Texture>;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const col = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k));

// toon ramp: 4 flat steps (shadow side stays readable, not black)
const RAMP = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export const toon = (o: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ gradientMap: RAMP, ...o });

const meterUV = (g: THREE.BufferGeometry, w: number, h: number) => {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  uv.needsUpdate = true;
  return g;
};

// wall material: grey weathered planks, red paint sweeping in along a ragged edge as `paint` goes -14 .. 14
function paintMaterial(tex: Tex, uni: { paint: { value: number }; glow: { value: number } }) {
  const m = toon({ map: tex.wood_grey });
  m.onBeforeCompile = (s) => {
    s.uniforms.mapRed = { value: tex.wood_red };
    s.uniforms.paint = uni.paint;
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform sampler2D mapRed; uniform float paint;")
      .replace("#include <map_fragment>", `
        vec4 g0 = texture2D(map, vMapUv); vec4 r0 = texture2D(mapRed, vMapUv);
        float u = vWP.x + 0.45 * vWP.z + 0.55 * sin(vWP.y * 2.7) + 0.3 * sin(vWP.y * 7.3 + vWP.z * 1.7);
        float m = smoothstep(paint + 0.12, paint - 0.12, u);
        diffuseColor *= mix(g0, r0, m);`);
  };
  return m;
}

const tiled = (t: THREE.Texture, rx = 1, ry = 1) => {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  c.needsUpdate = true;
  return c;
};

// ------------------------------------------------------------------ sky dome (day gradient + sun / night + stars)
const skyVert = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = `varying vec3 vD; uniform float night; uniform vec3 sunDir;
float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
void main(){
  float y = clamp(vD.y, -0.1, 1.0);
  vec3 dayZ = vec3(0.23,0.47,0.86), dayH = vec3(1.0,0.80,0.55);
  vec3 nZ = vec3(0.012,0.02,0.09), nH = vec3(0.09,0.13,0.33);
  float k = pow(clamp(y, 0.0, 1.0), 0.55);
  vec3 c = mix(mix(dayH, dayZ, k), mix(nH, nZ, k), night);
  float sd = max(dot(vD, normalize(sunDir)), 0.0);
  c += (1.0 - night) * (pow(sd, 400.0) * 2.5 + pow(sd, 12.0) * 0.35) * vec3(1.0, 0.85, 0.6);
  vec3 p = floor(vD * 420.0);
  float st = step(0.9965, h(p)) * smoothstep(0.02, 0.25, y);
  c += night * st * (0.55 + 0.45 * h(p + 3.0)) * vec3(0.85, 0.9, 1.0);
  c += night * 0.06 * smoothstep(0.3, 0.0, abs(dot(vD, normalize(vec3(0.5, 0.6, -0.62))) - 0.3)) * vec3(0.5, 0.4, 0.9); // milky band
  gl_FragColor = vec4(c, 1.0);
}`;

export const Sky: React.FC<{ night: number; sunDir: V3 }> = ({ night, sunDir }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { night: { value: 0 }, sunDir: { value: new THREE.Vector3() } } }), []);
  mat.uniforms.night.value = night;
  mat.uniforms.sunDir.value.set(...sunDir);
  return <mesh material={mat} userData={{ noNormal: true }} renderOrder={-10}><sphereGeometry args={[1800, 48, 24]} /></mesh>;
};

// ------------------------------------------------------------------ barn
export const Barn: React.FC<{ tex: Tex; paint: number; night: number }> = ({ tex, paint, night }) => {
  const uni = useMemo(() => ({ paint: { value: 0 }, glow: { value: 0 } }), []);
  uni.paint.value = paint;
  const r = useMemo(() => {
    const wall = paintMaterial({ ...tex, wood_grey: tiled(tex.wood_grey, 1 / 2.6, 1 / 2.6), wood_red: tiled(tex.wood_red, 1 / 2.6, 1 / 2.6) }, uni);
    const roof = toon({ map: tiled(tex.roof, 1 / 3, 1 / 3) });
    const trim = toon({ color: "#F4EEDF" });
    const dark = toon({ color: "#3A2C3A" });
    const gable = new THREE.Shape([[-6, 0], [6, 0], [6, 5], [4.3, 7.5], [0, 9.4], [-4.3, 7.5], [-6, 5]].map(([x, y]) => new THREE.Vector2(x, y)));
    const gableG = new THREE.ShapeGeometry(gable);
    const side = meterUV(new THREE.PlaneGeometry(16, 5), 16, 5);
    // roof: 4 slabs per side along the gambrel profile, a little overhang
    const prof: [number, number][] = [[-6.5, 4.75], [-4.45, 7.65], [0, 9.6], [4.45, 7.65], [6.5, 4.75]];
    const slabs = prof.slice(0, -1).map(([x0, y0], i) => {
      const [x1, y1] = prof[i + 1];
      const L = Math.hypot(x1 - x0, y1 - y0);
      const g = meterUV(new THREE.BoxGeometry(L + 0.06, 0.2, 17.2), L, 17.2);
      return { g, pos: [(x0 + x1) / 2, (y0 + y1) / 2, 0] as V3, rot: Math.atan2(y1 - y0, x1 - x0) };
    });
    return { wall, roof, trim, dark, gableG, side, slabs };
  }, [tex, uni]);
  const glow = toon({ color: col("#2A2030", "#B2501A", night).getStyle(), emissive: col("#000000", "#FF7A1A", night), emissiveIntensity: 0.55 * night });
  const board = (p: V3, s: V3, rz = 0, k = 0) => (
    <mesh key={`b${k}`} position={p} rotation={[0, 0, rz]} material={r.trim} castShadow><boxGeometry args={s} /></mesh>
  );
  return (
    <group>
      {/* walls: front / back gables, two sides */}
      <mesh geometry={r.gableG} material={r.wall} position={[0, 0, 8]} castShadow receiveShadow />
      <mesh geometry={r.gableG} material={r.wall} position={[0, 0, -8]} rotation={[0, Math.PI, 0]} castShadow receiveShadow />
      <mesh geometry={r.side} material={r.wall} position={[6, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />
      <mesh geometry={r.side} material={r.wall} position={[-6, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow />
      {r.slabs.map((s, i) => (
        <mesh key={i} geometry={s.g} material={r.roof} position={s.pos} rotation={[0, 0, s.rot]} castShadow receiveShadow />
      ))}
      {/* white trim: corners, door frames with the X brace, hayloft door, fascia */}
      {[[-6.05, 8.05], [6.05, 8.05], [-6.05, -8.05], [6.05, -8.05]].map(([x, z], i) => board([x, 2.5, z], [0.32, 5, 0.32], 0, i))}
      <group position={[0, 0, 8.06]}>
        <mesh position={[0, 1.9, -0.03]} material={r.dark}><boxGeometry args={[4.6, 3.8, 0.05]} /></mesh>
        {board([-2.35, 1.95, 0], [0.26, 3.9, 0.14], 0, 10)}
        {board([2.35, 1.95, 0], [0.26, 3.9, 0.14], 0, 11)}
        {board([0, 3.9, 0], [4.96, 0.26, 0.14], 0, 12)}
        {board([0, 1.95, 0], [0.18, 3.9, 0.14], 0, 13)}
        {board([-1.15, 1.95, 0.02], [0.2, 4.2, 0.12], Math.atan2(3.7, 2.2), 14)}
        {board([-1.15, 1.95, 0.02], [0.2, 4.2, 0.12], -Math.atan2(3.7, 2.2), 15)}
        {board([1.15, 1.95, 0.02], [0.2, 4.2, 0.12], Math.atan2(3.7, 2.2), 16)}
        {board([1.15, 1.95, 0.02], [0.2, 4.2, 0.12], -Math.atan2(3.7, 2.2), 17)}
        {/* hayloft door (glows warm at night) */}
        <mesh position={[0, 6.4, 0.0]} material={glow}><boxGeometry args={[1.8, 1.7, 0.06]} /></mesh>
        {board([0, 7.32, 0.02], [2.2, 0.2, 0.12], 0, 18)}
        {board([0, 5.48, 0.02], [2.2, 0.2, 0.12], 0, 19)}
        {board([-1.0, 6.4, 0.02], [0.2, 2.0, 0.12], 0, 20)}
        {board([1.0, 6.4, 0.02], [0.2, 2.0, 0.12], 0, 21)}
      </group>
      {/* small side windows */}
      {[-4, 0, 4].map((z, i) => (
        <group key={i} position={[-6.04, 3.3, z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={glow}><boxGeometry args={[1.0, 0.8, 0.05]} /></mesh>
          {board([0, 0.48, 0.02], [1.3, 0.16, 0.1], 0, 30 + i)}
          {board([0, -0.48, 0.02], [1.3, 0.16, 0.1], 0, 40 + i)}
        </group>
      ))}
      {/* cupola on the ridge */}
      <group position={[0, 9.6, 0]}>
        <mesh material={r.trim} position={[0, 0.6, 0]} castShadow><boxGeometry args={[1.3, 1.2, 1.3]} /></mesh>
        <mesh material={r.roof} position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.25, 0.9, 4]} /></mesh>
        <mesh material={r.dark} position={[0, 2.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.9]} /></mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ silo, fence, trees, rocks, hills, path, hay
export const Farm: React.FC<{ tex: Tex; t: number }> = ({ tex, t }) => {
  const m = useMemo(() => {
    const grass = toon({ map: tiled(tex.grass, 90, 90) });
    const dirt = toon({ map: tiled(tex.dirt, 1.5, 22) });
    const plank = toon({ map: tiled(tex.wood_plank, 0.6, 0.6) });
    const silo = toon({ color: "#C9CFD8" });
    const siloTop = toon({ color: "#9B2F2A" });
    const band = toon({ color: "#7E8796" });
    const trunk = toon({ color: "#7A5236" });
    const leaves = ["#3F9A3A", "#5BB043", "#2F8A45", "#6CBF4A"].map((c) => toon({ color: c }));
    const rock = toon({ color: "#9A97A6", flatShading: true });
    const hill = toon({ color: "#4F9A47" });
    const hill2 = toon({ color: "#5E9C7A" });
    const hay = toon({ map: tiled(tex.wheat, 1, 1) });
    return { grass, dirt, plank, silo, siloTop, band, trunk, leaves, rock, hill, hill2, hay };
  }, [tex]);
  const trees: [number, number, number][] = [[-19, -6, 1.1], [-23, 9, 1.3], [21, -14, 1.2], [27, 3, 1.0], [-31, -19, 1.5], [-12, -22, 1.2],
    [31, 25, 1.3], [-27, 27, 1.1], [-40, 2, 1.6], [40, -6, 1.5], [6, -26, 1.3], [-6, 38, 1.0], [16, 42, 1.2], [-20, 48, 1.4], [48, 30, 1.6]];
  const fence: [number, number, number, number][] = [[8, 4, 8, 22], [8, 22, 24, 22], [8, 4, 24, 4]];
  const sway = (i: number) => Math.sin(t * 1.3 + i * 1.7) * 0.025;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.grass} receiveShadow><planeGeometry args={[900, 900]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 34]} material={m.dirt} receiveShadow>
        <planeGeometry args={[3.6, 52]} />
      </mesh>
      {/* silo */}
      <group position={[10.5, 0, -4]}>
        <mesh material={m.silo} position={[0, 6.5, 0]} castShadow receiveShadow><cylinderGeometry args={[2.6, 2.6, 13, 40]} /></mesh>
        {[2, 4.5, 7, 9.5, 12].map((y) => (
          <mesh key={y} material={m.band} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.63, 0.07, 6, 48]} /></mesh>
        ))}
        <mesh material={m.siloTop} position={[0, 13, 0]} castShadow><sphereGeometry args={[2.7, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      </group>
      {/* fence */}
      {fence.map(([x0, z0, x1, z1], fi) => {
        const L = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.round(L / 2.4);
        const ang = Math.atan2(x1 - x0, z1 - z0);
        return (
          <group key={fi}>
            {Array.from({ length: n + 1 }, (_, i) => (
              <mesh key={i} material={m.plank} position={[lerp(x0, x1, i / n), 0.7, lerp(z0, z1, i / n)]} castShadow>
                <boxGeometry args={[0.18, 1.4, 0.18]} />
              </mesh>
            ))}
            {[0.55, 1.1].map((y) => (
              <mesh key={y} material={m.plank} position={[(x0 + x1) / 2, y, (z0 + z1) / 2]} rotation={[0, ang, 0]} castShadow>
                <boxGeometry args={[0.08, 0.16, L]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* trees: a trunk and a few round canopy blobs, swaying a hair in the wind */}
      {trees.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh material={m.trunk} position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.28, 0.4, 3.2, 10]} /></mesh>
          <group rotation={[sway(i), 0, sway(i + 5)]} position={[0, 3.0, 0]}>
            {[[0, 1.6, 0, 2.1], [1.2, 1.0, 0.4, 1.5], [-1.1, 1.1, -0.3, 1.6], [0.2, 2.6, -0.2, 1.4], [-0.3, 0.9, 1.1, 1.3]].map(([a, b, c, r], k) => (
              <mesh key={k} material={m.leaves[(i + k) % 4]} position={[a, b, c]} castShadow receiveShadow><sphereGeometry args={[r, 20, 14]} /></mesh>
            ))}
          </group>
        </group>
      ))}
      {/* rocks */}
      {[[3.2, 18, 0.5], [-2.6, 24, 0.7], [4.0, 30, 0.4], [-9, 19, 0.6], [12, 26, 0.8], [-14, 12, 0.5]].map(([x, z, s], i) => (
        <mesh key={i} material={m.rock} position={[x, s * 0.35, z]} rotation={[i, i * 2, 0]} scale={[s * 1.3, s * 0.8, s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {/* hay bales */}
      {[[3.6, 10.6, 0.2], [4.9, 11.6, 1.1], [4.2, 10.8, 0.6]].map(([x, z, r], i) => (
        <mesh key={i} material={m.hay} position={[x, i === 2 ? 1.75 : 0.62, z]} rotation={[0, r, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.62, 1.2, 24]} />
        </mesh>
      ))}
      {/* rolling hills ring (fog fades them blue) */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const R = 170 + (i % 3) * 45;
        return (
          <mesh key={i} material={i % 2 ? m.hill : m.hill2} position={[Math.cos(a) * R, -6, Math.sin(a) * R - 20]} scale={[70 + (i % 4) * 14, 22 + (i % 3) * 9, 50]}>
            <sphereGeometry args={[1, 32, 16]} />
          </mesh>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ flat 2D cutouts that live in the 3D world
// a camera-facing (yaw only) plane; alphaTest so its depth + shadow follow the drawing's silhouette
export const Cutout: React.FC<{ map: THREE.Texture; pos: V3; h: number; aspect: number; camPos: V3; flip?: boolean; lit?: boolean;
  anchor?: [number, number]; bob?: number }> = ({ map, pos, h, aspect, camPos, flip, lit = true, anchor = [0.5, 0], bob = 0 }) => {
  const mats = useMemo(() => {
    const mat = lit ? toon({ map, alphaTest: 0.5, side: THREE.DoubleSide }) : new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
    return { mat, depth };
  }, [map, lit]);
  const yaw = Math.atan2(camPos[0] - pos[0], camPos[2] - pos[2]);
  const w = h * aspect;
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <mesh material={mats.mat} customDepthMaterial={mats.depth} castShadow userData={{ noNormal: true, flatNormal: map }}
        position={[(0.5 - anchor[0]) * w * (flip ? -1 : 1), h / 2 - anchor[1] * h + bob, 0]} scale={[flip ? -1 : 1, 1, 1]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
};

// invisible caster: the host is drawn as an HTML overlay (live face rig), this gives him a real shadow in the world
export const ShadowCaster: React.FC<{ map: THREE.Texture | null; pos: V3; h: number; aspect: number; ground: [number, number]; camPos: V3; flip?: boolean }> = (p) => {
  const mats = useMemo(() => ({
    mat: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }),
    depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 }),
  }), []);
  if (!p.map) return null;
  mats.depth.map = p.map;
  mats.depth.needsUpdate = true;
  const yaw = Math.atan2(p.camPos[0] - p.pos[0], p.camPos[2] - p.pos[2]);
  const w = p.h * p.aspect;
  const gx = p.ground[0];
  return (
    <group position={p.pos} rotation={[0, yaw, 0]}>
      <mesh material={mats.mat} customDepthMaterial={mats.depth} castShadow userData={{ noNormal: true }}
        position={[(0.5 - gx) * w * (p.flip ? -1 : 1), p.h / 2 - (1 - p.ground[1]) * p.h, 0]} scale={[p.flip ? -1 : 1, 1, 1]}>
        <planeGeometry args={[w, p.h]} />
      </mesh>
    </group>
  );
};

export const Clouds: React.FC<{ map: THREE.Texture; t: number; night: number }> = ({ map, t, night }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false }), [map]);
  mat.color.copy(col("#FFFFFF", "#38457E", night));
  const C: [number, number, number, number][] = [[-160, 110, -420, 120], [60, 140, -460, 150], [240, 100, -380, 110], [-320, 130, -300, 130],
    [380, 150, -200, 140], [-60, 90, -330, 90], [160, 120, 260, 120], [-260, 115, 200, 120]];
  return (
    <group>
      {C.map(([x, y, z, s], i) => (
        <mesh key={i} material={mat} userData={{ noNormal: true }} position={[x + t * (1.2 + (i % 3) * 0.4), y, z]}
          rotation={[0, Math.atan2(-x, -z), 0]} renderOrder={-5}>
          <planeGeometry args={[s, s * 0.47]} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ paint station: bucket, crate, store paint can
// bare (r02 free-assets build): no bucket / crate geometry, the liquid + falling items sit in a downloaded pot
export const Station: React.FC<{ tex: Tex; t: number; T: Record<string, number>; liquid: string; level: number; bare?: { y0: number; y1: number; r: number; canY: number } }> = ({ tex, t, T, liquid, level, bare }) => {
  const m = useMemo(() => ({
    plank: toon({ map: tiled(tex.wood_plank, 1, 1), side: THREE.DoubleSide }),
    band: toon({ color: "#55505E" }),
    can: toon({ color: "#C5CCD8" }),
    label: toon({ color: "#2F5FA8" }),
    rust: toon({ map: tiled(tex.rust, 1, 1) }),
    amber: toon({ color: "#C8862A" }),
    cork: toon({ color: "#9C6B3E" }),
    milk: toon({ color: "#F4EFE4" }),
    sack: toon({ color: "#E6DCC6" }),
    rope: toon({ color: "#8A6A44" }),
    inner: toon({ color: "#4A3426", side: THREE.BackSide }),
  }), [tex]);
  const liq = toon({ color: liquid });
  // falling items: [time, from height] -> y and visibility (they vanish into the paint)
  const fall = (t0: number) => {
    const k = (t - (t0 - 0.38)) / 0.38;
    return { show: k > -2.5 && k < 1, y: k <= 0 ? 2.6 : lerp(2.6, 0.45, k * k), r: k * 2.2 };
  };
  const B = [-3.7, 0, 12.2] as V3;
  const items = [
    { t0: T.oil, el: (<group><mesh material={m.amber}><cylinderGeometry args={[0.1, 0.1, 0.32, 16]} /></mesh><mesh material={m.amber} position={[0, 0.22, 0]}><cylinderGeometry args={[0.035, 0.07, 0.14, 12]} /></mesh><mesh material={m.cork} position={[0, 0.31, 0]}><cylinderGeometry args={[0.04, 0.04, 0.06, 8]} /></mesh></group>) },
    { t0: T.milk, el: (<group><mesh material={m.milk}><cylinderGeometry args={[0.12, 0.15, 0.34, 18]} /></mesh><mesh material={m.milk} position={[0, 0.22, 0]}><cylinderGeometry args={[0.06, 0.12, 0.12, 18]} /></mesh></group>) },
    { t0: T.lime, el: (<group><mesh material={m.sack} scale={[1, 1.3, 0.75]}><sphereGeometry args={[0.18, 16, 12]} /></mesh><mesh material={m.rope} position={[0, 0.22, 0]}><torusGeometry args={[0.06, 0.02, 6, 12]} /></mesh></group>) },
    { t0: T.rust, el: (<group>{[0, 1, 2].map((i) => <mesh key={i} material={m.rust} position={[(i - 1) * 0.16, i * 0.08, 0]} rotation={[0.4 * i, 0, 0.5]}><torusGeometry args={[0.1, 0.028, 8, 16, Math.PI * 1.5]} /></mesh>)}</group>) },
  ];
  return (
    <group>
      {/* bucket */}
      <group position={B}>
        {!bare && (
          <>
            <mesh material={m.plank} position={[0, 0.25, 0]} castShadow receiveShadow><cylinderGeometry args={[0.4, 0.33, 0.5, 28, 1, true]} /></mesh>
            <mesh material={m.inner} position={[0, 0.25, 0]}><cylinderGeometry args={[0.39, 0.32, 0.5, 28, 1, true]} /></mesh>
            <mesh material={m.band} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.33, 28]} /></mesh>
            {[0.08, 0.42].map((y) => <mesh key={y} material={m.band} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.34 + y * 0.14, 0.018, 6, 32]} /></mesh>)}
          </>
        )}
        <mesh material={liq} position={[0, bare ? bare.y0 + level * (bare.y1 - bare.y0) : 0.05 + level * 0.42, 0]} rotation={[-Math.PI / 2, 0, t * 0.9]}>
          <circleGeometry args={[bare ? bare.r : 0.33 + level * 0.065, 28]} />
        </mesh>
        {items.map((it, i) => {
          const f = fall(it.t0);
          return f.show ? <group key={i} position={[0.03 * (i - 1.5), f.y, 0]} rotation={[f.r * 0.6, f.r, f.r * 0.3]}>{it.el}</group> : null;
        })}
      </group>
      {/* crate + store-bought paint can */}
      {!bare && <mesh material={m.plank} position={[-2.5, 0.42, 13.0]} rotation={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.85, 0.84, 0.85]} /></mesh>}
      <group position={[-2.5, bare ? bare.canY : 0.84, 13.0]}>
        <mesh material={m.can} position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.4, 24]} /></mesh>
        <mesh material={m.label} position={[0, 0.2, 0]}><cylinderGeometry args={[0.205, 0.205, 0.22, 24]} /></mesh>
        <mesh material={m.band} position={[0, 0.41, 0]}><cylinderGeometry args={[0.19, 0.2, 0.02, 24]} /></mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ "rust was everywhere": plow, wheel, can, horseshoes
export const RustYard: React.FC<{ tex: Tex }> = ({ tex }) => {
  const m = useMemo(() => ({ rust: toon({ map: tiled(tex.rust, 2, 2) }), wood: toon({ map: tiled(tex.wood_plank, 1, 1) }) }), [tex]);
  return (
    <group>
      {/* plow */}
      <group position={[-9.6, 0, 7.6]} rotation={[0, 0.7, 0]}>
        <mesh material={m.wood} position={[0, 0.75, 0]} rotation={[0, 0, -0.35]} castShadow><boxGeometry args={[2.6, 0.16, 0.16]} /></mesh>
        <mesh material={m.rust} position={[1.15, 0.35, 0]} rotation={[0, 0, 0.9]} castShadow><cylinderGeometry args={[0.45, 0.45, 0.5, 16, 1, true, 0, Math.PI * 0.8]} /></mesh>
        <mesh material={m.rust} position={[1.4, 0.06, 0.05]} rotation={[0, 0, -0.2]} castShadow><boxGeometry args={[0.7, 0.06, 0.24]} /></mesh>
        {[-0.18, 0.18].map((z) => <mesh key={z} material={m.wood} position={[-1.15, 1.25, z]} rotation={[0, 0, 0.9]} castShadow><boxGeometry args={[1.1, 0.07, 0.07]} /></mesh>)}
      </group>
      {/* wagon wheel leaning on the barn's left wall */}
      <group position={[-6.45, 1.0, 5.2]} rotation={[0, Math.PI / 2, 0.18]}>
        <mesh material={m.rust} castShadow><torusGeometry args={[0.95, 0.07, 8, 40]} /></mesh>
        <mesh material={m.wood} castShadow><torusGeometry args={[0.86, 0.06, 8, 40]} /></mesh>
        {Array.from({ length: 6 }, (_, i) => <mesh key={i} material={m.wood} rotation={[0, 0, (i * Math.PI) / 6]} castShadow><boxGeometry args={[1.7, 0.06, 0.05]} /></mesh>)}
        <mesh material={m.rust} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.2, 12]} /></mesh>
      </group>
      {/* old milk can, horseshoes on a nail board */}
      <group position={[-10.8, 0, 9.6]} rotation={[0, 0.4, 0.12]}>
        <mesh material={m.rust} position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.22, 0.25, 0.8, 18]} /></mesh>
        <mesh material={m.rust} position={[0, 0.88, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 0.18, 18]} /></mesh>
      </group>
      {[[-8.4, 0.05, 6.4], [-10.6, 0.05, 9.0], [-8.9, 0.05, 8.6]].map(([x, y, z], i) => (
        <mesh key={i} material={m.rust} position={[x, y, z]} rotation={[-Math.PI / 2, 0, i * 1.3]} castShadow>
          <torusGeometry args={[0.13, 0.035, 8, 16, Math.PI * 1.5]} />
        </mesh>
      ))}
    </group>
  );
};

// mold patches on the left wall's outer face; shrink away as the rust paint goes on
export const Mold: React.FC<{ map: THREE.Texture; k: number }> = ({ map, k }) => {
  const mat = useMemo(() => new THREE.MeshToonMaterial({ gradientMap: RAMP, map, transparent: true, alphaTest: 0.15, depthWrite: false }), [map]);
  const P: [number, number, number][] = [[1.4, 0.8, 1.9], [2.9, 1.5, 1.4], [0.4, 1.7, 1.2], [3.8, 0.6, 1.6], [2.0, 2.4, 1.0], [0.9, 0.4, 1.1]];
  return (
    <group position={[-6.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {P.map(([z, y, s], i) => {
        const kk = clamp01(k * 1.6 - i * 0.12);
        return kk < 1 ? (
          <mesh key={i} material={mat} userData={{ noNormal: true }} position={[z, y, 0.01]} scale={s * (1 - ease(kk))} renderOrder={2}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        ) : null;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ the star: swell, explode, debris, then dust rain
const glowMat = (map: THREE.Texture, c: string) => new THREE.SpriteMaterial({ map, color: c, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true });

export const Supernova: React.FC<{ glow: THREE.Texture; t: number; T: Record<string, number>; S: V3 }> = ({ glow, t, T, S }) => {
  const mats = useMemo(() => ({ core: glowMat(glow, "#CFE2FF"), hot: glowMat(glow, "#FFB040"), deb: glowMat(glow, "#FF7A3A"), neb: glowMat(glow, "#C24A9A") }), [glow]);
  const shell = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { a: { value: 0 } },
    vertexShader: `varying float f; void main(){ vec3 n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); f = 1.0 - abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float f; uniform float a; void main(){ gl_FragColor = vec4(vec3(1.0,0.55,0.2) * pow(f, 2.2) * a, 1.0); }`,
  }), []);
  const deb = useMemo(() => Array.from({ length: 140 }, (_, i) => {
    const u = Math.sin(i * 12.9898) * 43758.5453, v = Math.sin(i * 78.233) * 12345.678;
    const th = (u - Math.floor(u)) * Math.PI * 2, ph = Math.acos(2 * (v - Math.floor(v)) - 1);
    return { d: [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)] as V3, sp: 0.6 + ((u * 7) % 1 + 1) % 1 * 0.6, s: 3 + (i % 5) * 2 };
  }), []);
  if (t < T.atom - 0.5) return null;
  const pre = t < T.exploded;
  const swell = ease((t - T.forged) / (T.exploded - T.forged));
  const flick = 1 + 0.08 * Math.sin(t * 31) * swell;
  const e = Math.max(0, t - T.exploded);
  const R = 240 * (1 - Math.exp(-e * 1.1));
  shell.uniforms.a.value = pre ? 0 : Math.exp(-e * 0.5) * 1.4;
  mats.core.color.set(pre ? col("#CFE2FF", "#FFD38A", swell) : new THREE.Color("#FFF2D6"));
  return (
    <group position={S} userData={{ noNormal: true }}>
      <sprite material={mats.core} scale={pre ? (34 + 60 * swell) * flick : 120 * Math.exp(-e * 1.2) + 20} />
      <sprite material={mats.hot} scale={pre ? 70 + 120 * swell : 420 * Math.exp(-e * 0.6) + 60} />
      {!pre && (
        <>
          <mesh material={shell} scale={R}><sphereGeometry args={[1, 32, 16]} /></mesh>
          <sprite material={mats.neb} scale={R * 2.2} />
          {deb.map((d, i) => {
            const r = R * d.sp * 1.15;
            return <sprite key={i} material={mats.deb} position={[d.d[0] * r, d.d[1] * r, d.d[2] * r]} scale={d.s * (1 + e * 0.6)} />;
          })}
        </>
      )}
    </group>
  );
};

// star dust falling on the farm (gold / red sparks)
export const DustRain: React.FC<{ glow: THREE.Texture; t: number; t0: number }> = ({ glow, t, t0 }) => {
  const mats = useMemo(() => [glowMat(glow, "#FFC45A"), glowMat(glow, "#FF6A4A"), glowMat(glow, "#FFE9B0")], [glow]);
  const P = useMemo(() => Array.from({ length: 420 }, (_, i) => {
    const h = (k: number) => { const s = Math.sin(i * 91.17 + k * 17.3) * 43758.5; return s - Math.floor(s); };
    return { x: -24 + h(1) * 40, z: -6 + h(2) * 32, y0: 10 + h(3) * 26, v: 3.5 + h(4) * 3, s: 0.35 + h(5) * 0.6, ph: h(6) * 6 };
  }), []);
  if (t < t0) return null;
  const e = t - t0;
  return (
    <group userData={{ noNormal: true }}>
      {P.map((p, i) => {
        const y = p.y0 - e * p.v;
        if (y < 0.1) return null;
        const tw = 0.7 + 0.3 * Math.sin(t * 9 + p.ph);
        return <sprite key={i} material={mats[i % 3]} position={[p.x + Math.sin(e + p.ph) * 0.6, y, p.z]} scale={p.s * tw * Math.min(1, e * 2)} />;
      })}
    </group>
  );
};

export const lerpV = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export { lerp, col, clamp01 };
