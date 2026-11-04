// Shared helpers for caveman-richhouse-3d (trimmed from www-ink3d-004's World.tsx: only the maths + the toon material).
import * as THREE from "three";

export type V3 = [number, number, number];
export type Tex = Record<string, THREE.Texture>;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpV = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// toon ramp: 4 flat steps (shadow side stays readable, not black)
const RAMP = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export const toon = (o: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ gradientMap: RAMP, ...o });
