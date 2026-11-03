// Ink look for the 3D world (post pass, replaces R3F's own render):
//   1. colour pass into an MSAA target with a depth texture; 2. view-normal pass (cutouts, sky, glows hidden);
//   3. one full-screen shader: depth-of-field gather -> grade (saturation, cool shadows / warm highlights, lifted
//      blacks: no pure black anywhere) -> ink lines from depth + normal edges ON TOP (the blur must never run after
//      the ink, that wiped the lines out in the reference build) -> cow-vision / flash / vignette.
import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type InkParams = {
  focus: number; // m, distance in focus
  blur: number; // px of max blur radius at 1080 wide
  night: number; // 0 day .. 1 night grade
  cow: number; // 0..1 cow (dichromat) vision
  flash: number; // 0..1 white flash
  redPulse: number; // 0..1 red heartbeat vignette
  ink: number; // line strength
};

const frag = /* glsl */ `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tNormal;
uniform vec2 res; uniform float cNear; uniform float cFar;
uniform float focus; uniform float blur; uniform float night; uniform float cow; uniform float flash; uniform float redPulse; uniform float inkK;
varying vec2 vUv;
float zAt(vec2 uv){ float d = texture2D(tDepth, uv).x; return -perspectiveDepthToViewZ(d, cNear, cFar); }
float cocAt(float z){ return clamp(abs(1.0 - focus / z) * 1.25, 0.0, 1.0); }
vec3 nAt(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
void main(){
  vec2 px = 1.0 / res;
  float s = res.x / 1080.0;
  float z = zAt(vUv);
  float coc = cocAt(z);
  // --- depth of field: golden-angle gather, samples weighted by their own blur (sharp foreground doesn't smear)
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.0;
  float R = blur * s * coc;
  if (R > 0.5) {
    for (int i = 1; i < 28; i++) {
      float fi = float(i);
      float r = sqrt(fi / 28.0) * R;
      float a = fi * 2.39996;
      vec2 o = vec2(cos(a), sin(a)) * r * px;
      float zs = zAt(vUv + o);
      float cs = cocAt(zs) * blur * s;
      float w = clamp((cs - r) * 0.5 + 0.6, 0.0, 1.0);
      w *= mix(1.0, 0.08, step(z * 1.06, zs));                       // a blurred foreground must stay opaque: no background seen through it
      acc += texture2D(tColor, vUv + o).rgb * w; wsum += w;
    }
  }
  vec3 c = acc / wsum;
  c = c / (1.0 + 0.18 * max(c - 0.8, 0.0));                          // soft shoulder for hot values (linear HDR)
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));                               // linear -> display, the grade works there
  // --- grade
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 1.32 - 0.12 * night);                         // saturated
  c = c + (1.0 - smoothstep(0.0, 0.55, l)) * vec3(-0.025, 0.0, 0.07) // cool blue-violet shadows
        + smoothstep(0.45, 1.0, l) * vec3(0.05, 0.025, -0.03);       // warm highlights
  c = clamp(c, 0.0, 1.0);
  c = c * c * (3.0 - 2.0 * c) * 0.55 + c * 0.45;                      // gentle S curve, contrast
  c = mix(c, c * vec3(0.62, 0.74, 1.22), night * 0.55);                // night blue
  c = vec3(0.045, 0.035, 0.085) + c * 0.955;                           // lifted, violet blacks
  // --- ink: depth + normal edges, a little over 1 px, faded with distance (far hills keep few lines)
  float k = 1.9 * s;
  vec2 o1 = vec2(k, 0.0) * px, o2 = vec2(0.0, k) * px;
  float zl = zAt(vUv - o1), zr = zAt(vUv + o1), zd = zAt(vUv - o2), zu = zAt(vUv + o2);
  float dz = max(max(abs(zl - z), abs(zr - z)), max(abs(zd - z), abs(zu - z))) / z;
  float lap = abs(zl + zr + zd + zu - 4.0 * z) / z;                    // crease on smooth curved ground: ignore
  float eD = smoothstep(0.02, 0.05, dz) * smoothstep(0.008, 0.03, lap);
  vec3 n = nAt(vUv);
  float dn = max(max(1.0 - dot(n, nAt(vUv - o1)), 1.0 - dot(n, nAt(vUv + o1))), max(1.0 - dot(n, nAt(vUv - o2)), 1.0 - dot(n, nAt(vUv + o2))));
  float eN = smoothstep(0.14, 0.3, dn);
  float e = max(eD, eN) * (1.0 - smoothstep(60.0, 260.0, z)) * inkK;
  vec3 inkCol = mix(vec3(0.13, 0.10, 0.19), vec3(0.07, 0.07, 0.16), night);
  c = mix(c, inkCol, clamp(e, 0.0, 0.92));
  // --- cow vision (dichromat: red and green collapse to olive)
  vec3 cv = vec3(dot(c, vec3(0.567, 0.433, 0.0)), dot(c, vec3(0.558, 0.442, 0.0)), dot(c, vec3(0.0, 0.242, 0.758)));
  c = mix(c, cv, cow);
  // --- vignette, red pulse, flash
  vec2 q = vUv - 0.5; q.x *= res.x / res.y;
  float v = smoothstep(0.35, 0.95, length(q * vec2(1.0, 0.8)));
  c *= 1.0 - v * (0.32 + 0.18 * night);
  c = mix(c, vec3(0.75, 0.05, 0.08), v * redPulse * 0.75);
  c = mix(c, vec3(1.0, 0.97, 0.9), flash);
  gl_FragColor = vec4(c, 1.0);
}`;

const vert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const InkPass: React.FC<{ p: InkParams }> = ({ p }) => {
  const { gl, scene, camera, size } = useThree();
  const dpr = gl.getPixelRatio();
  const W = Math.round(size.width * dpr), H = Math.round(size.height * dpr);
  const res = useMemo(() => {
    const depth = new THREE.DepthTexture(W, H);
    depth.type = THREE.FloatType;
    const color = new THREE.WebGLRenderTarget(W, H, { samples: 4, depthTexture: depth, type: THREE.HalfFloatType });
    color.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const normal = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
    const normalMat = new THREE.MeshNormalMaterial();
    const flatMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.5, 1.0), alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
      uniforms: {
        tColor: { value: color.texture }, tDepth: { value: depth }, tNormal: { value: normal.texture },
        res: { value: new THREE.Vector2(W, H) }, cNear: { value: 0.1 }, cFar: { value: 4000 },
        focus: { value: 10 }, blur: { value: 6 }, night: { value: 0 }, cow: { value: 0 }, flash: { value: 0 }, redPulse: { value: 0 }, inkK: { value: 1 },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    const qScene = new THREE.Scene();
    qScene.add(quad);
    const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { color, normal, normalMat, flatMat, mat, qScene, qCam };
  }, [W, H]);
  useEffect(() => () => { res.color.dispose(); res.normal.dispose(); }, [res]);

  useFrame(() => {
    const u = res.mat.uniforms;
    const cam = camera as THREE.PerspectiveCamera;
    u.cNear.value = cam.near; u.cFar.value = cam.far;
    u.focus.value = p.focus; u.blur.value = p.blur; u.night.value = p.night; u.cow.value = p.cow;
    u.flash.value = p.flash; u.redPulse.value = p.redPulse; u.inkK.value = p.ink;
    // 1. colour (output in linear: the shader grades, then writes sRGB through the renderer's output conversion)
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    gl.setRenderTarget(res.color);
    gl.clear();
    gl.render(scene, camera);
    // 2. normals: hide cutouts / sky / glows (they'd draw as full quads)
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => { if (o.userData.noNormal && o.visible) { o.visible = false; hidden.push(o); } });
    const bg = scene.background, fog = scene.fog;
    scene.background = null; scene.fog = null;
    scene.overrideMaterial = res.normalMat;
    gl.setRenderTarget(res.normal);
    gl.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 1);
    gl.clear();
    gl.render(scene, camera);
    scene.overrideMaterial = null;
    // cutouts go back in as a flat camera-facing normal: hidden, the edges of whatever stands behind them were inked through the drawing
    const ac = gl.autoClear; gl.autoClear = false;
    for (const o of hidden) {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !o.userData.flatNormal) continue;
      res.flatMat.map = o.userData.flatNormal; res.flatMat.needsUpdate = true;
      const keep = m.material; m.material = res.flatMat; o.visible = true;
      gl.render(o, camera);
      m.material = keep; o.visible = false;
    }
    gl.autoClear = ac;
    scene.background = bg; scene.fog = fog;
    for (const o of hidden) o.visible = true;
    // 3. composite
    gl.setRenderTarget(null);
    gl.render(res.qScene, res.qCam);
  }, 1);
  return null;
};
