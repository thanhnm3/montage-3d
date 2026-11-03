// Shared bits for the ink-3D movie ticket Short: toon ramp, night sky, CC0 model loader + placement (from
// www-ink3d-002's World.tsx / FreeWorld.tsx), texture loader. Models are Kenney CC0 GLBs in public/free/<pack>/,
// whose external "Textures/colormap.png" resolves against the pack folder.
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

export type V3 = [number, number, number];
export type Tex = Record<string, THREE.Texture>;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpV = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// 0 before a, 1 after b, eased in between
export const ramp = (t: number, a: number, b: number) => ease((t - a) / (b - a));

const RAMP = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
export const toon = (o: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ gradientMap: RAMP, ...o });

// night sky: deep blue gradient + stars
const skyVert = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = `varying vec3 vD;
float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
void main(){
  float y = clamp(vD.y, -0.1, 1.0);
  float k = pow(clamp(y, 0.0, 1.0), 0.55);
  vec3 c = mix(vec3(0.16,0.12,0.32), vec3(0.015,0.025,0.10), k);
  vec3 p = floor(vD * 420.0);
  c += step(0.9965, h(p)) * smoothstep(0.05, 0.3, y) * (0.5 + 0.5 * h(p + 3.0)) * vec3(0.85, 0.9, 1.0);
  gl_FragColor = vec4(c, 1.0);
}`;
export const NightSky: React.FC = () => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false }), []);
  return <mesh material={mat} userData={{ noNormal: true }} renderOrder={-10}><sphereGeometry args={[1800, 48, 24]} /></mesh>;
};

// ------------------------------------------------------------------ CC0 models
export const MODELS: Record<string, string> = {
  bA: "city/building-a", bB: "city/building-b", bC: "city/building-c", bE: "city/building-e", bF: "city/building-f", bH: "city/building-h",
  bI: "city/building-i", bJ: "city/building-j", bK: "city/building-k", skyA: "city/building-skyscraper-a", skyB: "city/building-skyscraper-b",
  soda: "food/soda", bag: "food/bag",
  chair: "furn/chairModernCushion", lounge: "furn/loungeChair", lamp: "furn/lampSquareFloor", plant: "furn/pottedPlant", trash: "furn/trashcan", bench: "furn/bench",
};
export type Models = Record<string, THREE.Object3D>;

export function useModels() {
  const [m, setM] = useState<Models | null>(null);
  const [handle] = useState(() => delayRender("cc0 models"));
  useEffect(() => {
    (async () => {
      const out: Models = {};
      await Promise.all(Object.entries(MODELS).map(async ([k, p]) => {
        const buf = await (await fetch(staticFile(`free/${p}.glb`))).arrayBuffer();
        const dir = staticFile(`free/${p.split("/")[0]}/`);
        await new Promise<void>((res, rej) => new GLTFLoader().parse(buf, dir, (g) => { out[k] = g.scene; res(); }, rej));
      }));
      setM(out);
    })();
  }, []);
  useEffect(() => { if (m) continueRender(handle); }, [m, handle]);
  return m;
}

type PlaceOpts = { colors?: Record<string, string>; tint?: string; tintK?: number };
function toonOf(mt: THREE.Material, opts: PlaceOpts) {
  const std = mt as THREE.MeshStandardMaterial;
  const own = opts.colors?.[mt.name];
  const c = own ? new THREE.Color(own) : (std.color ?? new THREE.Color("#888")).clone();
  if (opts.tint) c.lerp(new THREE.Color(opts.tint), opts.tintK ?? 0.5);
  return toon({ color: c, map: own ? null : std.map ?? null, side: THREE.FrontSide });
}
// clone + toon materials + shadows, then fit `size` metres along `axis`, centred on x/z, standing on y = 0
export function place(src: THREE.Object3D, size: number, axis: "x" | "y" | "z" = "y", opts: PlaceOpts = {}) {
  const o = SkeletonUtils.clone(src);
  o.traverse((n) => {
    const mesh = n as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const mats = ([] as THREE.Material[]).concat(mesh.material);
    const nm = mats.map((mt) => toonOf(mt, opts));
    mesh.material = nm.length === 1 ? nm[0] : nm;
  });
  o.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(o);
  const sz = box.getSize(new THREE.Vector3());
  const k = size / Math.max(1e-6, sz[axis]);
  const g = new THREE.Group();
  o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  g.add(o);
  g.scale.setScalar(k);
  return g;
}
export const M: React.FC<{ models: Models; name: string; size: number; axis?: "x" | "y" | "z"; pos: V3; rot?: number; colors?: Record<string, string>; tint?: string; tintK?: number }> = (p) => {
  const g = useMemo(() => place(p.models[p.name], p.size, p.axis ?? "y", { colors: p.colors, tint: p.tint, tintK: p.tintK }),
    [p.models, p.name, p.size, p.axis, p.colors, p.tint, p.tintK]);
  return <primitive object={g} position={p.pos} rotation={[0, p.rot ?? 0, 0]} />;
};

export function useTextures(names: string[]) {
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const L = new THREE.TextureLoader();
    Promise.all(names.map((n) => new Promise<[string, THREE.Texture]>((res, rej) =>
      L.load(staticFile(`tex/${n}.png`), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res([n, t]); }, undefined, rej))))
      .then((all) => setTex(Object.fromEntries(all)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (tex) continueRender(handle); }, [tex, handle]);
  return tex;
}
