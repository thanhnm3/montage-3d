// r02 "free assets" world: every model is a ready-made CC0 download (no hand-made art), see
// projects/www-ink3d-001/FREE_ASSETS.md. Quaternius Farm Buildings + Farm Animals (FBX), Kenney Nature Kit (GLB),
// Kenney Toon Characters (vector sheet -> poses). Models keep their own flat colours, converted to the same toon ramp
// so the ink / grade pass from r01 applies unchanged.
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { toon, V3 } from "./World";

export const FBX = ["BigBarn", "Silo", "Fence", "Windmill", "TowerWindmill", "Well", "Cow"];
export const GLB = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_simple", "tree_tall", "rock_largeA", "rock_largeC", "rock_smallA",
  "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "log_stack", "pot_large", "crop_pumpkin", "crops_wheatStageB",
  "plant_bush", "plant_bushLarge", "stump_round"];
export type Models = Record<string, { obj: THREE.Object3D; clips: THREE.AnimationClip[] }>;

export function useModels(fbx: string[] = FBX, glb: string[] = GLB) {
  const [m, setM] = useState<Models | null>(null);
  const [handle] = useState(() => delayRender("free models"));
  useEffect(() => {
    (async () => {
      const out: Models = {};
      await Promise.all([
        ...fbx.map(async (n) => {
          const buf = await (await fetch(staticFile(`free/fbx/${n}.fbx`))).arrayBuffer();
          const obj = new FBXLoader().parse(buf, "");
          out[n] = { obj, clips: obj.animations };
        }),
        ...glb.map(async (n) => {
          const buf = await (await fetch(staticFile(`free/glb/${n}.glb`))).arrayBuffer();
          await new Promise<void>((res, rej) => new GLTFLoader().parse(buf, "", (g) => { out[n] = { obj: g.scene, clips: g.animations }; res(); }, rej));
        }),
      ]);
      setM(out);
    })();
  }, []);
  useEffect(() => { if (m) continueRender(handle); }, [m, handle]);
  return m;
}

// colour of a material as the model ships it
const baseColor = (mt: THREE.Material) => ((mt as THREE.MeshStandardMaterial).color ?? new THREE.Color("#888")).clone();
const isRed = (c: THREE.Color) => { const h = { h: 0, s: 0, l: 0 }; c.getHSL(h); return (h.h < 0.05 || h.h > 0.95) && h.s > 0.35; };

// barn paint: the model's red wood turns weathered grey until `paint` sweeps red back in along a ragged edge
export const paintUni = { paint: { value: 14 } };
// Kenney Nature Kit ships teal leaves/grass and orange "dirt" rocks: remapped by material name to the farm palette
export const NAME_COL: Record<string, string> = { grass: "#4F9A38", leafsGreen: "#3E8C36", woodBark: "#7A5236", dirt: "#9C958C" };
type PlaceOpts = { paintable?: boolean; tint?: string; tintK?: number; colors?: Record<string, string> };
function toonOf(mt: THREE.Material, opts: PlaceOpts = {}) {
  const own = opts.colors?.[mt.name] ?? NAME_COL[mt.name];
  const c = own ? new THREE.Color(own) : baseColor(mt);
  if (opts.tint) c.lerp(new THREE.Color(opts.tint), opts.tintK ?? 0.6);
  const map = (mt as THREE.MeshStandardMaterial).map ?? null;
  const t = toon({ color: c, map, side: THREE.FrontSide });
  if (opts.paintable && isRed(c)) {
    const grey = new THREE.Color("#8F877E");
    t.onBeforeCompile = (s) => {
      s.uniforms.paint = paintUni.paint;
      s.uniforms.grey = { value: grey };
      s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform float paint; uniform vec3 grey;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float u = vWP.x + 0.45 * vWP.z + 0.55 * sin(vWP.y * 2.7) + 0.3 * sin(vWP.y * 7.3 + vWP.z * 1.7);
          float m = smoothstep(paint + 0.12, paint - 0.12, u);
          diffuseColor.rgb = mix(grey, diffuseColor.rgb, m);`);
    };
  }
  return t;
}

// clone + toon materials + shadows, then fit: `size` metres along `axis`, centred on x/z, standing on y = 0
export function place(src: { obj: THREE.Object3D }, size: number, axis: "x" | "y" | "z" = "y", opts: PlaceOpts = {}) {
  const o = SkeletonUtils.clone(src.obj);
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

export const M: React.FC<{ models: Models; name: string; size: number; axis?: "x" | "y" | "z"; pos: V3; rot?: number; paintable?: boolean; tint?: string; tintK?: number }> = (p) => {
  const g = useMemo(() => place(p.models[p.name], p.size, p.axis ?? "y", { paintable: p.paintable, tint: p.tint, tintK: p.tintK }),
    [p.models, p.name, p.size, p.axis, p.paintable, p.tint, p.tintK]);
  return <primitive object={g} position={p.pos} rotation={[0, p.rot ?? 0, 0]} />;
};

// Quaternius cow with its own clip, time-driven
export const Cow: React.FC<{ models: Models; pos: V3; rot: number; t: number; clip: string }> = ({ models, pos, rot, t, clip }) => {
  const inst = useMemo(() => {
    const g = place(models.Cow, 1.45, "y");
    const o = g.children[0];
    const mixer = new THREE.AnimationMixer(o);
    return { g, mixer };
  }, [models]);
  const clips = models.Cow.clips;
  const c = clips.find((k) => k.name.toLowerCase().includes(clip)) ?? clips[0];
  if (c) {
    inst.mixer.stopAllAction();
    const a = inst.mixer.clipAction(c);
    a.play();
    inst.mixer.setTime((t + pos[0]) % c.duration);
  }
  return <primitive object={inst.g} position={pos} rotation={[0, rot, 0]} />;
};

export const FreeFarm: React.FC<{ models: Models; t: number; clear?: [number, number, number] }> = ({ models, t, clear }) => {
  // keep a round patch free (e.g. a bull pen): anything placed inside [x, z, r] is skipped
  const out = (x: number, z: number) => !clear || Math.hypot(x - clear[0], z - clear[1]) > clear[2];
  const ground = useMemo(() => toon({ color: "#78B24A" }), []);
  const dirt = useMemo(() => toon({ color: "#B48A5E" }), []);
  const hill = useMemo(() => [toon({ color: "#5E9E46" }), toon({ color: "#6FA25E" })], []);
  const trees: [string, number, number, number][] = [["tree_oak", -19, -6, 8], ["tree_default", -23, 9, 9], ["tree_detailed", 21, -14, 9], ["tree_fat", 27, 3, 7],
    ["tree_tall", -31, -19, 12], ["tree_oak", -12, -22, 9], ["tree_default", 31, 25, 8], ["tree_detailed", -27, 27, 9], ["tree_tall", -40, 2, 13],
    ["tree_fat", 40, -6, 9], ["tree_simple", 6, -26, 9], ["tree_oak", -6, 38, 7], ["tree_detailed", 16, 42, 9], ["tree_default", -20, 48, 10], ["tree_tall", 48, 30, 12]];
  const fencePts: [number, number][] = [];
  for (let z = 4; z <= 19; z += 3) fencePts.push([9.5, z]);
  const fenceZ: [number, number][] = [];
  for (let x = 11; x <= 24; x += 3) fenceZ.push([x, 22]);
  const deco: [string, number, number, number, number][] = [["rock_largeA", -15, 23, 1.0, 0.3], ["rock_largeC", 1.5, 33, 1.3, 1.2], ["rock_smallA", 4.0, 30, 0.5, 2],
    ["rock_largeA", -21, 13, 1.1, 2.5], ["rock_largeC", 12, 27, 1.4, 0.7], ["plant_bushLarge", -14, 12, 1.6, 0], ["plant_bush", 2.8, 20.5, 0.9, 1],
    ["flower_redA", 2.2, 22.5, 0.45, 0], ["flower_yellowA", -2.1, 21.2, 0.45, 1], ["flower_purpleA", 2.6, 25.5, 0.45, 2], ["flower_yellowA", -2.6, 27, 0.45, 0.5],
    ["flower_redA", -6.8, 15.4, 0.45, 0], ["grass_large", 1.9, 19.2, 0.6, 0], ["grass_large", -2.3, 18.4, 0.6, 1], ["grass", 6.4, 23.8, 0.5, 0], ["grass_large", 7.2, 19.6, 0.6, 2],
    ["log_stack", -8.2, 12.6, 1.0, 0.4], ["crop_pumpkin", 3.4, 12.4, 0.6, 0], ["crop_pumpkin", 4.3, 13.1, 0.5, 1], ["stump_round", -11.8, 16.5, 0.6, 0],
    ["plant_bush", -7.5, 10.4, 0.9, 0], ["grass_large", -5.8, 14.6, 0.6, 0.6], ["flower_purpleA", -3.0, 14.9, 0.4, 0]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[900, 900]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 34]} material={dirt} receiveShadow><planeGeometry args={[3.6, 52]} /></mesh>
      <M models={models} name="Silo" size={14} pos={[10.5, 0, -4]} />
      <M models={models} name="Windmill" size={16} pos={[-30, 0, -34]} rot={0.6} />
      <M models={models} name="Well" size={2.2} pos={[-9.5, 0, 17]} rot={0.4} />
      {fencePts.filter(([x, z]) => out(x, z + 1.5)).map(([x, z], i) => <M key={`a${i}`} models={models} name="Fence" size={3.1} axis="x" pos={[x, 0, z + 1.5]} rot={Math.PI / 2} />)}
      {fenceZ.filter(([x, z]) => out(x, z)).map(([x, z], i) => <M key={`b${i}`} models={models} name="Fence" size={3.1} axis="x" pos={[x, 0, z]} />)}
      {trees.filter(([, x, z]) => out(x, z)).map(([n, x, z, h], i) => <M key={`t${i}`} models={models} name={n} size={h} pos={[x, 0, z]} rot={i * 1.3} />)}
      {deco.filter(([, x, z]) => out(x, z)).map(([n, x, z, h, r], i) => <M key={`d${i}`} models={models} name={n} size={h} pos={[x, 0, z]} rot={r} />)}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const R = 170 + (i % 3) * 45;
        return (
          <mesh key={i} material={hill[i % 2]} position={[Math.cos(a) * R, -6, Math.sin(a) * R - 20]} scale={[70 + (i % 4) * 14, 22 + (i % 3) * 9, 50]}>
            <sphereGeometry args={[1, 32, 16]} />
          </mesh>
        );
      })}
    </group>
  );
};
