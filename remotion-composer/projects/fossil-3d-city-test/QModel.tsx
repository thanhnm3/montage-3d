// Model có sẵn (Quaternius CC0, FBX đã gắn xương + clip chuyển động) cho Remotion:
// nạp một lần, mỗi con là một bản clone + AnimationMixer, frame nào cũng đặt thời gian clip = t (thuần theo frame).
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type QAsset = { obj: THREE.Group; clips: THREE.AnimationClip[]; len: number; center: THREE.Vector3; minY: number };

export function useFBX(file: string): QAsset | null {
  const [a, setA] = useState<QAsset | null>(null);
  const [handle] = useState(() => delayRender(`fbx ${file}`));
  useEffect(() => {
    let alive = true;
    (async () => {
      const buf = await (await fetch(staticFile(file))).arrayBuffer();
      const obj = new FBXLoader().parse(buf, "");
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      if (alive) setA({ obj, clips: obj.animations, len: box.max.z - box.min.z, center, minY: box.min.y });
    })();
    return () => {
      alive = false;
    };
  }, [file]);
  useEffect(() => {
    if (a) continueRender(handle);
  }, [a, handle]);
  return a;
}

export type QLook = { length: number; colors: Record<string, string> };

// Một con: đầu hướng -X (giống các model tự dựng), dài `length` mét, chân chạm y = 0
export const QActor: React.FC<{ asset: QAsset; look: QLook; clip: string; t: number }> = ({ asset, look, clip, t }) => {
  const inst = useMemo(() => {
    const o = SkeletonUtils.clone(asset.obj) as THREE.Group;
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const mats = ([] as THREE.Material[]).concat(mesh.material);
      const nm = mats.map((mt) => new THREE.MeshStandardMaterial({ color: new THREE.Color(look.colors[mt.name] ?? "#888888"), roughness: 0.85, flatShading: true }));
      mesh.material = nm.length === 1 ? nm[0] : nm;
    });
    const mixer = new THREE.AnimationMixer(o);
    return { o, mixer, actions: new Map<string, THREE.AnimationAction>() };
  }, [asset, look]);
  const c = asset.clips.find((k) => k.name.toLowerCase().endsWith(`_${clip.toLowerCase()}`)) ?? asset.clips[0];
  let act = inst.actions.get(c.name);
  if (!act) {
    act = inst.mixer.clipAction(c);
    inst.actions.set(c.name, act);
  }
  inst.mixer.stopAllAction();
  act.play();
  inst.mixer.setTime(t % c.duration);
  const s = look.length / asset.len;
  return (
    <group rotation={[0, -Math.PI / 2, 0]} scale={s}>
      <primitive object={inst.o} position={[-asset.center.x, -asset.minY, -asset.center.z]} />
    </group>
  );
};

// Model tĩnh sinh bằng AI ảnh→3D (TRELLIS / Hunyuan3D): GLB có texture, không xương, không chuyển động
export type GAsset = { scene: THREE.Group; box: THREE.Box3 };
export function useGLB(file: string): GAsset | null {
  const [a, setA] = useState<GAsset | null>(null);
  const [handle] = useState(() => delayRender(`glb ${file}`));
  useEffect(() => {
    let alive = true;
    (async () => {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const buf = await (await fetch(staticFile(file))).arrayBuffer();
      new GLTFLoader().parse(buf, "", (g) => {
        g.scene.traverse((m) => {
          const mesh = m as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          // lưới đã giảm mạnh: gộp đỉnh trùng rồi tính lại pháp tuyến mượt để khỏi lộ mặt tam giác
          mesh.geometry.deleteAttribute("normal");
          mesh.geometry = mergeVertices(mesh.geometry, 1e-4);
          mesh.geometry.computeVertexNormals();
          // glTF không ghi metallicFactor thì mặc định = 1 (kim loại) -> lông thú tối đen
          for (const mt of ([] as THREE.Material[]).concat(mesh.material)) {
            const sm = mt as THREE.MeshStandardMaterial;
            sm.metalness = 0;
            sm.roughness = 0.9;
          }
        });
        if (alive) setA({ scene: g.scene, box: new THREE.Box3().setFromObject(g.scene) });
      });
    })();
    return () => {
      alive = false;
    };
  }, [file]);
  useEffect(() => {
    if (a) continueRender(handle);
  }, [a, handle]);
  return a;
}

// dài `length` mét theo trục X của model, chân chạm y = 0; flip = quay 180° nếu đầu model hướng +X
export const GActor: React.FC<{ asset: GAsset; length: number; flip?: boolean }> = ({ asset, length, flip }) => {
  const inst = useMemo(() => asset.scene.clone(true), [asset]);
  const { min, max } = asset.box;
  const s = length / (max.x - min.x);
  return (
    <group rotation={[0, flip ? Math.PI : 0, 0]} scale={s}>
      <primitive object={inst} position={[-(min.x + max.x) / 2, -min.y, -(min.z + max.z) / 2]} />
    </group>
  );
};
