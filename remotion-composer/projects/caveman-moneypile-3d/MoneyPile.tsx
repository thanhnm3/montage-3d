// Caveman Economics Short "money pile vs YOU, ranked" (2026-11-03), ink-3D look like the movie ticket Short, no host.
// A countdown #5 -> #1 of piles of $1 bills next to one grey-hoodie person "YOU": $10K (belt high), $100K (seesaw +
// a 3-floor column), $1M (balance vs 11 people, column vs the Statue of Liberty), $1B (a 10 m cube whose column reaches
// space), the richest man's ~$870B (a 99 m cube on a balance vs 2.6 Empire-State-like towers, a ribbon around Earth).
// Regions far apart in one world, one shown at a time: street (x 0..100), harbour (x 1000), giant city (x -20000,
// scaled 1/10), space (x 20000, Earth R = 20). Ink.tsx / Kit.tsx are the movie ticket's.
// Script: tts/episodes/caveman-economics/shorts/2026-11-03-money-pile-ranked-short.txt
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { InkPass } from "./Ink";
import { M, Models, NightSky, Tex, V3, clamp01, ease, lerp, lerpV, ramp, toon, useModels, useTextures } from "./Kit";

const anton = loadAnton().fontFamily;
const W = 1080, H = 1920, ASPECT = W / H;
const TAU = Math.PI * 2;

// beat starts + word starts (s) in public/audio/narration.wav (voice/beats/result.json, artifacts/whisper_words.json)
const T = {
  twice: 3.6, b2: 4.904, p10k: 5.9, lb22: 7.16, belt: 8.4, b3: 9.603, hk: 10.38, heavier: 11.54, floors: 12.6,
  b4: 13.937, mil: 14.52, ton: 15.24, eleven: 15.86, taller: 17.16, b5: 18.607, bil: 19.24, tons: 20.2, stand: 21.4,
  space: 22.42, b6: 23.411, musk: 23.96, n870: 25.2, esb: 27.0, wraps: 29.58, b7: 31.706, earn: 32.28, sec: 32.5, m1: 34.94,
  days: 36.04, bn: 36.8, yrs: 37.76, pile: 38.74, k27: 39.32, farm: 41.34, b8: 43.179,
};

// ------------------------------------------------------------------ regions
const SP: V3 = [20000, 0, 0]; // space: Earth centre
const ER = 20;                // Earth radius (units); 1 unit = 318.6 km
const KM = ER / 6371;
const GX = -20000;            // giant city origin, built in metres at 1/10 scale
const g = (x: number, y: number, z: number): V3 => [GX + x * 0.1, y * 0.1, z * 0.1];
const sp = (x: number, y: number, z: number): V3 => [SP[0] + x, SP[1] + y, SP[2] + z];
const SW: V3 = [-30, 0, 0];   // seesaw ($100K)
const C2: V3 = [12, 0, 0];    // $100K column + 3-floor house
const B1: V3 = [40, 0, 0];    // $1M balance
const HB: V3 = [1000, 0, 0];  // harbour: statue
const CB: V3 = [80, 0, 0];    // $1B cube
const GB = 1500;              // giant balance x (local metres)
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ------------------------------------------------------------------ materials / boxes
const matCache = new Map<string, THREE.Material>();
const tm = (c: string) => { let m = matCache.get(c); if (!m) { m = toon({ color: c }); matCache.set(c, m); } return m; };
const Box: React.FC<{ p: V3; s: V3; c: string; r?: V3 }> = ({ p, s, c, r }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} material={tm(c)} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);

// bill stack box: bill faces on top, paper edges + straps on the sides (1 tile = 100 bills = 10.9 mm)
const BW = 0.156, BD = 0.066, STRAP = 0.01092;
const Cash: React.FC<{ tex: Tex; s: V3; p: V3; k?: number; r?: V3 }> = ({ tex, s, p, k = 1, r }) => {
  const mats = useMemo(() => {
    const rep = (t: THREE.Texture, x: number, y: number) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(x, y);
      c.needsUpdate = true;
      return c;
    };
    const tall = s[1] / STRAP;
    // cubes (>= 0.4 m) show strapped bundles; a tile = 4 x 6 bundles, real size up to a 1 m cube, then capped at 12
    // tiles a face so the 10 m and 99 m cubes still read as money (an exaggeration of bundle size, not of the cube)
    const cube = s[0] >= 0.4;
    const nb = (len: number, unit: number) => Math.max(1, Math.min(12, len / unit));
    const side = (w: number, bw: number) => cube ? toon({ map: rep(tex.bundle_side, nb(w, BW * 4), nb(s[1], STRAP * 100 * 6 / 6 * 6)) })
      : tall > 600 ? toon({ color: "#9DC584" }) : toon({ map: rep(tex.stack_side, w / bw, tall) });
    const top = toon({ map: rep(tex.bill, cube ? nb(s[0], BW) : s[0] / BW, cube ? nb(s[2], BD) * 2.4 : s[2] / BD) });
    const sx = side(s[2], BD), sz = side(s[0], BW);
    return [sx, sx, top, top, sz, sz];
  }, [tex, s]);
  const h = Math.max(1e-4, s[1] * k);
  return (
    <group position={p} rotation={r ?? [0, 0, 0]}>
      <mesh material={mats} position={[0, h / 2, 0]} scale={[1, h / s[1], 1]} castShadow receiveShadow><boxGeometry args={s} /></mesh>
    </group>
  );
};

// ------------------------------------------------------------------ YOU (grey hoodie, faces +z, feet at y = 0)
const Person: React.FC<{ t: number; act?: "idle" | "wave" | "flail" | "look"; phase?: number; shirt?: string; s?: number }> = ({ t, act = "idle", phase = 0, shirt = "#8A8F98", s = 1 }) => {
  const br = Math.sin(t * 2.2 + phase) * 0.015;
  let armL = 0.05, armR = -0.05, zL = 0.12, zR = -0.12, head = 0;
  if (act === "wave") { armR = -2.7 + 0.25 * Math.sin(t * 9 + phase); zR = -0.3; }
  if (act === "flail") { armL = -2.4 + 0.5 * Math.sin(t * 11 + phase); armR = -2.4 + 0.5 * Math.sin(t * 11 + 1.7 + phase); zL = 0.5; zR = -0.5; }
  if (act === "look") head = -0.45;
  return (
    <group scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.11 * sd, 0.85, 0]}>
          <Box p={[0, -0.42, 0]} s={[0.17, 0.85, 0.19]} c="#2F3A4E" />
          <Box p={[0, -0.82, 0.05]} s={[0.19, 0.08, 0.29]} c="#F1F1EE" />
        </group>
      ))}
      <group position={[0, 0.85 + br, 0]}>
        <Box p={[0, 0.32, 0]} s={[0.47, 0.64, 0.27]} c={shirt} />
        <Box p={[0, 0.3, 0.14]} s={[0.24, 0.12, 0.02]} c="#767B84" />
        <group position={[0, 0.83, 0]} rotation={[head, 0, 0]}>
          <Box p={[0, 0, 0]} s={[0.32, 0.34, 0.3]} c="#E2B48A" />
          <Box p={[0, 0.17, -0.02]} s={[0.34, 0.1, 0.33]} c="#3B2A1E" />
          <Box p={[0, 0.04, -0.15]} s={[0.34, 0.26, 0.06]} c="#3B2A1E" />
          {[-0.075, 0.075].map((x) => <Box key={x} p={[x, 0.03, 0.155]} s={[0.05, 0.06, 0.02]} c="#1E1A18" />)}
          <Box p={[0, -0.09, 0.155]} s={[0.1, 0.025, 0.02]} c="#7A4A3A" />
          <Box p={[0, 0.0, -0.17]} s={[0.4, 0.4, 0.04]} c="#7E838C" />
        </group>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.3 * sd, 0.6, 0]} rotation={[sd < 0 ? armL : armR, 0, sd < 0 ? zL : zR]}>
            <Box p={[0, -0.28, 0]} s={[0.13, 0.58, 0.15]} c={shirt} />
            <Box p={[0, -0.62, 0]} s={[0.12, 0.12, 0.13]} c="#E2B48A" />
          </group>
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ props
const Seesaw: React.FC<{ len: number; h: number; ang: number; children?: React.ReactNode; c?: string }> = ({ len, h, ang, children, c = "#C4572F" }) => (
  <group>
    <mesh position={[0, h / 2, 0]} material={tm("#4A4250")} castShadow><cylinderGeometry args={[h * 0.12, h * 0.5, h, 4]} /></mesh>
    <group position={[0, h, 0]} rotation={[0, 0, ang]}>
      <Box p={[0, 0.04 * len, 0]} s={[len, 0.08 * len * 0.5, 0.9 * len * 0.12]} c={c} />
      <group position={[0, 0.06 * len, 0]}>{children}</group>
    </group>
  </group>
);
// keeps a child upright on a tilted plank
const OnPlank: React.FC<{ x: number; ang: number; children: React.ReactNode }> = ({ x, ang, children }) => (
  <group position={[x, 0, 0]} rotation={[0, 0, -ang]}>{children}</group>
);

const House: React.FC<{ floors: number; fh: number; w: number; c: string }> = ({ floors, fh, w, c }) => (
  <group>
    <Box p={[0, (floors * fh) / 2, 0]} s={[w, floors * fh, w * 0.8]} c={c} />
    <Box p={[0, floors * fh + 0.15, 0]} s={[w + 0.3, 0.3, w * 0.8 + 0.3]} c="#EFE3C8" />
    {Array.from({ length: floors }, (_, f) => [-1, 0, 1].map((k) => (
      <Box key={`${f}_${k}`} p={[k * w * 0.3, f * fh + fh * 0.55, w * 0.4 + 0.02]} s={[w * 0.17, fh * 0.42, 0.04]} c="#3C5D7A" />
    )))}
    <Box p={[0, 1.1, w * 0.4 + 0.03]} s={[1.1, 2.2, 0.05]} c="#6E3A2A" />
  </group>
);

// blocky torch-bearing statue on a star fort + pedestal, 93 m to the torch tip
const Statue: React.FC<{ glow: THREE.Texture }> = ({ glow }) => {
  const G = "#73B29B";
  return (
    <group>
      <mesh position={[0, 5, 0]} material={tm("#B9AE98")} castShadow receiveShadow><cylinderGeometry args={[42, 46, 10, 11]} /></mesh>
      <Box p={[0, 10 + 13.5, 0]} s={[20, 27, 20]} c="#C9BCA2" />
      <Box p={[0, 37 + 4, 0]} s={[15, 8, 15]} c="#BBAE94" />
      {/* robe, body, head + crown */}
      <mesh position={[0, 45 + 15, 0]} material={tm(G)} castShadow><cylinderGeometry args={[3.6, 7, 30, 8]} /></mesh>
      <mesh position={[0, 45 + 33, 0]} material={tm(G)} castShadow><sphereGeometry args={[3.0, 10, 8]} /></mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 6 - 0.5) * 2.2;
        return <Box key={i} p={[Math.sin(a) * 2.8, 45 + 35.5 + Math.cos(a) * 1.2, Math.cos(a) * 0.6]} s={[0.6, 3.2, 0.6]} c={G} r={[0, 0, -a * 0.8]} />;
      })}
      {/* raised right arm + torch, tablet in the left */}
      <group position={[3.6, 45 + 27, 0]} rotation={[0, 0, -0.18]}>
        <Box p={[0, 7, 0]} s={[2.2, 14, 2.2]} c={G} />
        <Box p={[0, 14.6, 0]} s={[2.6, 2.4, 2.6]} c="#C9A23A" />
        <mesh position={[0, 17.0, 0]} material={new THREE.MeshBasicMaterial({ color: "#FFC34D" })}><coneGeometry args={[1.5, 3.4, 8]} /></mesh>
        <sprite position={[0, 17, 0]} scale={[12, 12, 1]} userData={{ noNormal: true }}>
          <spriteMaterial map={glow} color="#FFB040" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      <Box p={[-4.4, 45 + 22, 1.5]} s={[2.4, 6, 1.2]} c={G} r={[0.2, 0, 0.25]} />
    </group>
  );
};

// stepped art-deco tower, ~443 m with the spire (metres; the giant region scales it)
const Tower: React.FC<{ k?: number }> = ({ k = 1 }) => (
  <group scale={[1, k, 1]}>
    {[[0, 85, 60, 45], [85, 265, 44, 32], [265, 320, 30, 24], [320, 375, 20, 16], [375, 390, 12, 10]].map(([y0, y1, w, d], i) => (
      <group key={i}>
        <Box p={[0, (y0 + y1) / 2, 0]} s={[w, y1 - y0, d]} c={i % 2 ? "#C9C3B6" : "#B8B1A3"} />
        {Array.from({ length: Math.floor((y1 - y0) / 12) }, (_, j) => (
          <Box key={j} p={[0, y0 + 6 + j * 12, d / 2 + 0.3]} s={[w * 0.86, 5, 0.6]} c="#56708A" />
        ))}
      </group>
    ))}
    <mesh position={[0, 390 + 26, 0]} material={tm("#D8D2C4")} castShadow><cylinderGeometry args={[0.8, 4.5, 52, 8]} /></mesh>
  </group>
);

// ------------------------------------------------------------------ Earth + the $870B ribbon (2.37 laps)
const LAPS = 2.37;
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number) { super(); }
  getPoint(u: number, out = new THREE.Vector3()) {
    const th = u * LAPS * TAU;
    const inc = 0.42 + 0.22 * (th / TAU);
    return out.set(this.r * Math.cos(th), this.r * Math.sin(th) * Math.sin(inc), this.r * Math.sin(th) * Math.cos(inc));
  }
}
const SEG = 900, RAD = 8;
const ribbonAt = (t: number) => {
  if (t < T.b2) return lerp(0.42, 1, ramp(t, EARTH, T.twice + 0.25)); // hook: races from 1 lap to the full 2.37
  if (t >= T.b6 && t < T.b7) return lerp(0.0, 1, ramp(t, T.wraps - 0.15, T.b7 - 0.4));
  return 1;
};
const Earth: React.FC<{ tex: Tex; t: number; spike: boolean }> = ({ tex, t, spike }) => {
  const mats = useMemo(() => ({
    earth: toon({ map: tex.earth, emissiveMap: tex.earth, emissive: new THREE.Color("#FFFFFF"), emissiveIntensity: 0.3 }),
    clouds: new THREE.MeshLambertMaterial({ map: tex.clouds, transparent: true, depthWrite: false }),
    atmo: new THREE.MeshBasicMaterial({ color: "#8CC8FF", transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }),
    rib: toon({ color: "#7DBE62", emissive: new THREE.Color("#2E6A2A"), emissiveIntensity: 0.5 }),
    spike: toon({ color: "#8FCB6E", emissive: new THREE.Color("#2E6A2A"), emissiveIntensity: 0.4 }),
    dash: new THREE.MeshBasicMaterial({ color: "#FFFFFF" }),
  }), [tex]);
  const geo = useMemo(() => new THREE.TubeGeometry(new Helix(ER * 1.035), SEG, 0.32, RAD, false), []);
  const k = ribbonAt(t);
  geo.setDrawRange(0, Math.floor(k * SEG) * RAD * 6);
  const rot = t * 0.05;
  return (
    <group position={SP}>
      <group rotation={[0.38, 0, 0.12]}>
        <mesh material={mats.earth} rotation={[0, rot - 1.9, 0]} castShadow receiveShadow><sphereGeometry args={[ER, 96, 64]} /></mesh>
        <mesh material={mats.clouds} rotation={[0, rot * 1.3 - 1.9, 0]} userData={{ noNormal: true }}><sphereGeometry args={[ER * 1.012, 64, 48]} /></mesh>
      </group>
      <mesh material={mats.atmo} userData={{ noNormal: true }}><sphereGeometry args={[ER * 1.07, 64, 48]} /></mesh>
      {k > 0.002 ? <group rotation={[0.25, rot * 0.6, -0.35]}><mesh geometry={geo} material={mats.rib} /></group> : null}
      {spike ? (
        <group position={[0, ER, 0]}>
          {/* $1B column: 109 km (to scale); the dashed arc is 100 km, where space starts */}
          <mesh material={mats.spike} position={[0, (109 * KM * ramp(t, T.space - 0.1, T.space + 0.7)) / 2, 0]}
            scale={[1, Math.max(0.001, ramp(t, T.space - 0.1, T.space + 0.7)), 1]}><boxGeometry args={[0.012, 109 * KM, 0.012]} /></mesh>
          {Array.from({ length: 26 }, (_, i) => {
            const a = (i - 12.5) * 0.0042;
            const r = ER + 100 * KM;
            return <mesh key={i} material={mats.dash} position={[Math.sin(a) * r, Math.cos(a) * r - ER, 0]} rotation={[0, 0, -a]} userData={{ noNormal: true }}>
              <boxGeometry args={[0.05, 0.004, 0.004]} /></mesh>;
          })}
        </group>
      ) : null}
    </group>
  );
};

// ------------------------------------------------------------------ day sky
const skyVert = `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = `varying vec3 vD; void main(){ float y = clamp(vD.y, 0.0, 1.0);
  vec3 c = mix(vec3(0.86,0.93,0.98), vec3(0.36,0.62,0.92), pow(y, 0.6)); gl_FragColor = vec4(c, 1.0); }`;
const DaySky: React.FC<{ at: V3 }> = ({ at }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false }), []);
  return <mesh material={mat} position={at} userData={{ noNormal: true }} renderOrder={-10}><sphereGeometry args={[1800, 32, 16]} /></mesh>;
};

// ------------------------------------------------------------------ hook: $1B (10.4 m, 1,000 t) in free fall onto YOU
const FX: V3 = [-80, 0, 0];
const IMPACT = 2.0, EARTH = 2.55, G = 40; // cinematic g: 80 m of drop in 2 s
const fallY = (t: number) => t >= IMPACT ? 0 : 0.5 * G * (IMPACT - t) * (IMPACT - t);
const FLY = Array.from({ length: 90 }, (_, i) => {
  const h = (k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const a = h(1) * TAU;
  return { a, v: 6 + h(2) * 14, up: 5 + h(3) * 13, spin: (h(4) - 0.5) * 30, y0: h(5) * 8 };
});
const Fall: React.FC<{ tex: Tex; t: number }> = ({ tex, t }) => {
  const y = fallY(t);
  const after = t - IMPACT;
  const bill = useMemo(() => { const m = toon({ map: tex.bill }); m.side = THREE.DoubleSide; return m; }, [tex]);
  const shadow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#1A1826", transparent: true, depthWrite: false }), []);
  const dust = useMemo(() => new THREE.SpriteMaterial({ map: tex.glow, color: "#E8DCC2", transparent: true, depthWrite: false }), [tex]);
  // the shadow darkens and tightens as the cube comes down
  shadow.opacity = after >= 0 ? 0 : 0.15 + 0.6 * clamp01(1 - y / 80);
  const sh = 10.4 * (1 + y / 120);
  dust.opacity = after < 0 ? 0 : 0.85 * Math.exp(-after * 1.6);
  return (
    <group position={FX}>
      <group position={[0, y, -y / 2]} rotation={[after < 0 ? 0.05 * (IMPACT - t) : 0, after < 0 ? 0.35 * (IMPACT - t) : 0, after < 0 ? -0.04 * (IMPACT - t) : 0]}>
        <Cash tex={tex} s={[10.4, 10.4, 10.4]} p={[0, 0, 0]} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -y / 6]} material={shadow} userData={{ noNormal: true }}><planeGeometry args={[sh, sh]} /></mesh>
      {after < 0 ? <group><Person t={t} act={t > 1.45 ? "flail" : "look"} /></group> : null}
      {after >= 0 ? <>
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * TAU, r = 5.5 + 13 * (1 - Math.exp(-after * 3));
          return <sprite key={i} material={dust} position={[Math.cos(a) * r, 0.8 + after * 1.5 + (i % 3) * 0.7, Math.sin(a) * r]} scale={[7 + after * 6, 5 + after * 4, 1]} userData={{ noNormal: true }} />;
        })}
        {FLY.map((b, i) => {
          const x = after;
          const r = 5.2 + b.v * x;
          const yy = Math.max(0.02, b.y0 * 0.4 + b.up * x - 4.9 * x * x);
          return <mesh key={i} material={bill} position={[Math.cos(b.a) * r, yy, Math.sin(b.a) * r]} rotation={[b.spin * x, b.a, b.spin * 0.7 * x]} userData={{ noNormal: true }}>
            <planeGeometry args={[BW * 2.2, BD * 2.2]} /></mesh>;
        })}
      </> : null}
    </group>
  );
};

// ------------------------------------------------------------------ the street (x 0..100)
const drop = (t: number, t0: number, hgt: number, dur = 0.45) => {
  const x = clamp01((t - t0) / dur);
  return t < t0 ? hgt : hgt * (1 - x * x);
};
const Street: React.FC<{ tex: Tex; models: Models; t: number }> = ({ tex, models, t }) => {
  // seesaw: YOU's side down until the $100K brick lands, then it slams the other way
  const sx = t - T.hk - 0.42;
  const angS = sx < 0 ? 0.2 : -0.2 + 0.4 * Math.exp(-sx * 5) * Math.cos(sx * 6);
  const ang1 = t < T.ton + 0.42 ? 0.16 : 0.16 * Math.cos((t - T.ton - 0.42) * 7) * Math.exp(-(t - T.ton - 0.42) * 2.6);
  const col2 = ramp(t, T.floors - 0.45, T.floors + 0.35);
  const colB = t < T.stand ? 0 : Math.pow(clamp01((t - T.stand) / 1.1), 2.2);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0, 0]} material={tm("#9CC27C")} receiveShadow><planeGeometry args={[600, 600]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.01, 2.2]} material={tm("#C9C2B4")} receiveShadow><planeGeometry args={[600, 3]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.01, 7.5]} material={tm("#55515C")} receiveShadow><planeGeometry args={[600, 7]} /></mesh>
      {Array.from({ length: 40 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-60 + i * 6, 0.02, 7.5]} material={tm("#F1E7C6")}><planeGeometry args={[2.4, 0.16]} /></mesh>)}
      {/* backdrop: CC0 Kenney buildings behind the lawn */}
      {[["bA", -46, 12], ["bC", -36, 11], ["bE", -22, 13], ["bH", -10, 12], ["bJ", 2, 15], ["bK", 24, 12], ["bF", 34, 11], ["bB", 52, 12],
        ["bI", 64, 13], ["skyA", 96, 34], ["skyB", 108, 40], ["bE", 122, 14], ["skyA", -60, 30]].map(([n, x, s], i) => (
        <M key={i} models={models} name={n as string} size={s as number} pos={[x as number, 0, -14 - (i % 3) * 4]} />
      ))}
      {[-12, -4, 6, 30, 46, 60].map((x) => <M key={x} models={models} name="plant" size={1.4} pos={[x, 0, -3]} />)}
      <M models={models} name="bench" size={0.9} pos={[-3.2, 0, -1.2]} />
      {t < EARTH ? <Fall tex={tex} t={t} /> : null}
      {/* #5: YOU + $10K (1.09 m) + tape */}
      <group><Person t={t} act={t > T.belt && t < T.b3 ? "look" : t > T.b2 + 0.2 && t < T.p10k ? "wave" : "idle"} /></group>
      <Cash tex={tex} s={[BW, 1.0922, BD]} p={[0.55, 0, 0.05]} k={ramp(t, T.p10k - 0.15, T.p10k + 0.75)} r={[0, 0.25, 0]} />
      <group position={[0.92, 0, 0.12]} scale={[1, ramp(t, T.belt - 0.5, T.belt), 1]}>
        <mesh position={[0, 0.546, 0]} material={toon({ map: tex.tape })}><boxGeometry args={[0.05, 1.0922, 0.005]} /></mesh>
      </group>
      {/* #4: seesaw, YOU vs a 0.48 m brick of $100K */}
      <group position={SW}>
        <Seesaw len={4.2} h={0.55} ang={angS}>
          <OnPlank x={-1.75} ang={angS}><group position={[0, 0.02, 0]}><Person t={t} act={t > T.hk + 0.5 ? "flail" : "idle"} /></group></OnPlank>
          <OnPlank x={1.65} ang={angS}><group position={[0, drop(t, T.hk, 6), 0]}><Cash tex={tex} s={[0.483, 0.483, 0.483]} p={[0, 0, 0]} /></group></OnPlank>
        </Seesaw>
      </group>
      {/* #4: the $100K column (10.9 m; drawn 2x thick) next to a 3-floor house */}
      <group position={C2}>
        <Cash tex={tex} s={[BW * 2, 10.922, BD * 2]} p={[0, 0, 0.6]} k={col2} />
        <group position={[5.2, 0, -1]}><House floors={3} fh={3.55} w={7} c="#D88A55" /></group>
        <group position={[1.6, 0, 1.4]}><Person t={t} act="look" /></group>
      </group>
      {/* #3: balance, 11 x YOU vs a 1.04 m cube of $1M */}
      <group position={B1}>
        <Seesaw len={9} h={1.2} ang={ang1} c="#3D6E9C">
          {Array.from({ length: 11 }, (_, i) => (
            <OnPlank key={i} x={-4.1 + (i % 4) * 0.5} ang={ang1}>
              <group position={[0, 0, -0.35 + Math.floor(i / 4) * 0.34]}><Person t={t} phase={i * 1.3} act={t > T.eleven && i % 3 === 0 ? "wave" : "idle"} /></group>
            </OnPlank>
          ))}
          <OnPlank x={3.6} ang={ang1}><group position={[0, drop(t, T.ton, 7), 0]}><Cash tex={tex} s={[1.04, 1.04, 1.04]} p={[0, 0, 0]} /></group></OnPlank>
        </Seesaw>
      </group>
      {/* #2: the $1B cube (10.4 m), then its column takes off */}
      <group position={CB}>
        <group position={[0, drop(t, T.bil, 40, 0.5), 0]}><Cash tex={tex} s={[10.4, 10.4, 10.4]} p={[0, 0, 0]} /></group>
        {colB > 0 ? <Cash tex={tex} s={[1.2, 2400, 1.2]} p={[0, 10.4, 0]} k={colB} /> : null}
        <group position={[8.5, 0, 3.5]}><Person t={t} act={t > T.stand ? "look" : "idle"} /></group>
        <M models={models} name="bC" size={11} pos={[-14, 0, -2]} />
        <M models={models} name="bE" size={12} pos={[15, 0, -3]} />
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ harbour: $1M column (109 m, drawn 1.2 m wide) vs the statue
const Harbour: React.FC<{ tex: Tex; models: Models; t: number }> = ({ tex, models, t }) => (
  <group position={HB}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} material={tm("#4F92C4")} receiveShadow><planeGeometry args={[4000, 4000]} /></mesh>
    <mesh position={[20, -0.3, 0]} material={tm("#8DB46E")} receiveShadow><cylinderGeometry args={[80, 84, 1, 24]} /></mesh>
    <Statue glow={tex.glow} />
    <Cash tex={tex} s={[1.2, 109.22, 1.2]} p={[48, 0, 8]} k={ramp(t, T.taller - 0.6, T.taller + 0.4)} />
    <group position={[52, 0, 14]}><Person t={t} act="look" s={1} /></group>
    {[[-260, 70], [-180, 110], [-90, 60], [140, 90], [230, 130], [320, 75]].map(([x, s], i) => (
      <M key={i} models={models} name={i % 2 ? "skyA" : "skyB"} size={s} pos={[x, 0, -700]} tint="#AFC6DE" tintK={0.55} />
    ))}
  </group>
);

// ------------------------------------------------------------------ giant city (1/10): the ~$870B cube (99 m) + the balance
const Giant: React.FC<{ tex: Tex; models: Models; t: number }> = ({ tex, models, t }) => {
  const ang = t < T.esb - 0.4 ? 0.13 : 0.13 * Math.cos((t - T.esb + 0.4) * 5) * Math.exp(-(t - T.esb + 0.4) * 2.2);
  const towers = clamp01((t - (T.esb - 0.6)) / 0.4);
  return (
    <group position={[GX, 0, 0]} scale={0.1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[700, 0, 0]} material={tm("#A7B39D")} receiveShadow><planeGeometry args={[9000, 9000]} /></mesh>
      {/* the cube among real-size skyscrapers (Kenney, 90-200 m) */}
      <Cash tex={tex} s={[99.4, 99.4, 99.4]} p={[0, 0, 0]} k={ramp(t, T.b6 - 0.05, T.musk + 0.3)} />
      {[[-150, 120, -60], [-110, 180, 120], [150, 160, -40], [130, 95, 130], [-240, 140, 40], [260, 200, -150], [40, 110, -220], [-40, 90, 230]].map(([x, s, z], i) => (
        <M key={i} models={models} name={i % 3 === 0 ? "skyB" : "skyA"} size={s} pos={[x, 0, z]} />
      ))}
      {[[-60, 160], [70, 150], [-80, -150], [90, -140]].map(([x, z], i) => <M key={i} models={models} name="bH" size={14} pos={[x, 0, z]} />)}
      {/* balance: the cube vs 2.6 towers */}
      <group position={[GB, 0, 0]}>
        <Seesaw len={760} h={70} ang={ang} c="#3D6E9C">
          <OnPlank x={-260} ang={ang}><Cash tex={tex} s={[99.4, 99.4, 99.4]} p={[0, 0, 0]} /></OnPlank>
          {[[90, 1], [200, 1], [310, 0.6]].map(([x, k], i) => (
            <OnPlank key={i} x={x} ang={ang}><group position={[0, (1 - ease(towers)) * 400, 0]}><Tower k={k} /></group></OnPlank>
          ))}
        </Seesaw>
        {[[-500, 150, -500], [480, 120, -520], [0, 180, -700]].map(([x, s, z], i) => <M key={i} models={models} name="skyA" size={s} pos={[x, 0, z]} tint="#C9D6E2" tintK={0.4} />)}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ camera
type Mode = "space" | "street" | "harbour" | "giant" | "card";
type CamKey = { t: number; mode: Mode; pos: V3; look: V3; fov: number; glide?: number; cut?: boolean; push?: number; roll?: number; blur?: number };
const hookA = { pos: sp(5, 8, 78), look: sp(0, 1, 0) };
const K: CamKey[] = [
  // HOOK: worm's-eye under the falling cube -> high over its shoulder down onto YOU -> low dutch wide for the slam
  { t: 0, mode: "street", pos: add(FX, [1.0, 0.3, 4.6]), look: add(FX, [0.1, 15.5, -10.2]), fov: 76, push: 0.0, roll: 6, blur: 2 },
  { t: 0.85, mode: "street", pos: add(FX, [9, 62, 14]), look: add(FX, [0, 0, 0]), fov: 46, cut: true, push: 0.06, roll: -6, blur: 2 },
  { t: 1.55, mode: "street", pos: add(FX, [10, 0.6, 18]), look: add(FX, [0, 5.0, -1]), fov: 60, cut: true, push: 0.0, roll: -11, blur: 2 },
  { t: EARTH, mode: "space", ...hookA, fov: 40, cut: true, roll: -4 },
  { t: EARTH + 0.25, mode: "space", pos: sp(-4, 12, 118), look: sp(0, 0, 0), fov: 40, glide: 1.6, roll: 2 },
  // #5
  { t: T.b2, mode: "street", pos: [1.0, 1.2, 4.4], look: [0.35, 1.3, 0], fov: 44, cut: true, push: 0.012, roll: 2 },
  { t: T.lb22 - 0.2, mode: "street", pos: [1.7, 1.0, 3.2], look: [0.5, 1.05, 0], fov: 42, glide: 0.8, push: 0.01, roll: -3 },
  // #4 seesaw, then the column
  { t: T.b3, mode: "street", pos: add(SW, [0.4, 2.2, 11.5]), look: add(SW, [0, 1.6, 0]), fov: 44, cut: true, push: 0.008, roll: 3 },
  { t: T.floors - 0.5, mode: "street", pos: add(C2, [3.6, 1.1, 13]), look: add(C2, [1.0, 4.5, 0]), fov: 56, cut: true, roll: -3 },
  { t: T.floors + 0.1, mode: "street", pos: add(C2, [3.8, 1.0, 15.0]), look: add(C2, [1.2, 7.0, 0]), fov: 58, glide: 0.9, push: 0.004, roll: -2 },
  // #3 balance, then the harbour
  { t: T.b4, mode: "street", pos: add(B1, [0.3, 3.8, 21]), look: add(B1, [0, 2.9, 0]), fov: 46, cut: true, push: 0.008, roll: 2 },
  { t: T.taller - 0.12, mode: "harbour", pos: add(HB, [30, 10, 235]), look: add(HB, [26, 60, 0]), fov: 52, cut: true, push: 0.012, roll: -2 },
  // #2 cube drops, column takes off, cut to the Earth's limb
  { t: T.b5, mode: "street", pos: add(CB, [7, 3.2, 27]), look: add(CB, [0, 5.5, 0]), fov: 50, cut: true, push: 0.006, roll: 3 },
  { t: T.stand, mode: "street", pos: add(CB, [9, 1.6, 23]), look: add(CB, [0, 40, 0]), fov: 64, glide: 1.0, roll: -4 },
  { t: T.space - 0.12, mode: "space", pos: sp(0.42, ER + 0.12, 0.95), look: sp(0, ER + 0.17, 0), fov: 40, cut: true, push: 0.01, blur: 3 },
  // #1 giant cube in the city, the balance, then the ribbon around the Earth
  { t: T.b6, mode: "giant", pos: g(170, 6, 330), look: g(0, 70, 0), fov: 62, cut: true, push: 0.01, roll: -5 },
  { t: T.esb - 0.65, mode: "giant", pos: g(GB + 20, 300, 1650), look: g(GB, 250, 0), fov: 52, cut: true, push: 0.008, roll: 2 },
  { t: T.wraps - 0.15, mode: "space", pos: sp(-8, 16, 96), look: sp(0, 0, 0), fov: 40, cut: true },
  { t: T.wraps + 0.4, mode: "space", pos: sp(-2, 8, 122), look: sp(0, 0, 0), fov: 40, glide: 1.6, roll: 2 },
  { t: T.b7, mode: "card", pos: sp(0, 0, 120), look: sp(0, 0, 0), fov: 40, cut: true },
  // close: the hook's frame (loop seam)
  { t: T.b8, mode: "space", pos: sp(-4, 12, 118), look: sp(0, 0, 0), fov: 40, cut: true, roll: 2 },
  { t: T.b8 + 0.4, mode: "space", ...hookA, fov: 40, glide: 1.6, roll: -4 },
];
function keyState(k: CamKey, t: number) {
  const e = Math.max(0, t - k.t) * (k.push ?? 0);
  return { pos: lerpV(k.pos, k.look, Math.min(0.5, e)), look: k.look, fov: k.fov, blur: k.blur ?? 4, roll: k.roll ?? 0, mode: k.mode };
}
function stateAt(i: number, t: number): ReturnType<typeof keyState> {
  const k = K[i];
  let s = keyState(k, t);
  const gl = k.glide ?? 0;
  if (i > 0 && !k.cut && gl > 0 && t - k.t < gl) {
    const a = stateAt(i - 1, t);
    const x = ease((t - k.t) / gl);
    s = { ...s, pos: lerpV(a.pos, s.pos, x), look: lerpV(a.look, s.look, x), fov: lerp(a.fov, s.fov, x), roll: lerp(a.roll, s.roll, x), blur: lerp(a.blur, s.blur, x) };
  }
  return s;
}
function camAt(t: number) {
  let i = 0;
  while (i + 1 < K.length && K[i + 1].t <= t) i++;
  const s = stateAt(i, t);
  const d = new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos));
  const j = d * 0.0016;
  const sk = t >= IMPACT && t < EARTH ? Math.exp(-(t - IMPACT) * 5) * 0.55 : 0;
  const pos: V3 = [s.pos[0] + Math.sin(t * 0.7) * j + Math.sin(t * 61) * sk, s.pos[1] + Math.sin(t * 0.9 + 1) * j + Math.sin(t * 47 + 2) * sk, s.pos[2]];
  return { ...s, pos, dist: d };
}
type Cam = ReturnType<typeof camAt>;
const CamSet: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...cam.pos); c.fov = cam.fov; c.near = cam.mode === "space" ? 0.01 : 0.05; c.far = 4000; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...cam.look); c.rotateZ(THREE.MathUtils.degToRad(cam.roll)); c.updateMatrixWorld();
  return null;
};
// the sun follows the shot so every region gets crisp shadows
const Sun: React.FC<{ cam: Cam }> = ({ cam }) => {
  const target = useMemo(() => new THREE.Object3D(), []);
  const big = cam.mode === "harbour" ? 140 : cam.mode === "giant" ? 70 : cam.mode === "space" ? 40 : 22;
  const L = cam.look;
  target.position.set(...L);
  target.updateMatrixWorld();
  return (
    <>
      <primitive object={target} />
      <directionalLight position={[L[0] - big * 0.8, L[1] + big * 1.3, L[2] + big]} target={target} intensity={cam.mode === "space" ? 2.6 : 2.3} color="#FFF3DC" castShadow
        shadow-mapSize={[4096, 4096]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-big} shadow-camera-right={big} shadow-camera-top={big} shadow-camera-bottom={-big} shadow-camera-far={big * 5} />
    </>
  );
};

const flashAt = (t: number) => Math.max(t >= IMPACT && t < EARTH ? Math.exp(-(t - IMPACT) * 9) * 0.75 : 0, t >= T.space - 0.12 ? Math.exp(-(t - T.space + 0.12) * 6) * 0.8 : 0,
  t >= T.b2 ? Math.exp(-(t - T.b2) * 9) * 0.25 * (t < T.b2 + 0.5 ? 1 : 0) : 0);

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: Cam }> = ({ t, tex, models, cam }) => {
  const m = cam.mode;
  const fog = m === "street" ? ["#D6E8F5", t < EARTH ? 0.0028 : 0.0065] : m === "harbour" ? ["#D6E8F5", 0.0011] : m === "giant" ? ["#D6E8F5", 0.0042] : ["#05040A", 0.0];
  return (
    <>
      <CamSet cam={cam} />
      {m !== "space" ? <fogExp2 attach="fog" args={[new THREE.Color(fog[0] as string).getHex(), fog[1] as number]} /> : null}
      {m === "space" ? <group position={cam.pos}><NightSky /></group> : <DaySky at={cam.pos} />}
      <hemisphereLight args={[new THREE.Color("#CFE4FF"), new THREE.Color("#7C6E58"), m === "space" ? 0.35 : 1.05]} />
      <Sun cam={cam} />
      {m === "street" ? <Street tex={tex} models={models} t={t} /> : null}
      {m === "harbour" ? <Harbour tex={tex} models={models} t={t} /> : null}
      {m === "giant" ? <Giant tex={tex} models={models} t={t} /> : null}
      {m === "space" ? <Earth tex={tex} t={t} spike={t >= T.space - 0.2 && t < T.b6} /> : null}
      <InkPass p={{ focus: cam.dist, blur: cam.blur, night: m === "space" ? 0.15 : 0, cow: 0, flash: flashAt(t), redPulse: 0, ink: 1 }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#1E1828", PAPER = "#FFF8EC", YEL = "#FFD23F", GREEN = "#8BE07A", RED = "#FF5A4A";
type Cap = { f0: number; f1: number; words: { t: string; f0: number; f1: number; k?: boolean }[] };
export type PileProps = { durationInFrames: number; audio: string; thumbT?: number; captions: { chunks: Cap[]; y: number; size: number; maxWidth: number } };

const pop = (t: number, t0: number) => t < t0 ? 0 : spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 10, stiffness: 240 } });
const Big: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = PAPER, children, style }) => (
  <div style={{ fontFamily: anton, fontSize: size, lineHeight: 1.0, letterSpacing: 2, color, WebkitTextStroke: `${size * 0.11}px ${INK}`, paintOrder: "stroke fill",
    whiteSpace: "nowrap", textShadow: `0 ${size * 0.05}px ${size * 0.08}px rgba(10,5,25,0.55)`, ...style }}>{children}</div>
);
function project(cam: Cam, p: V3) {
  const c = new THREE.PerspectiveCamera(cam.fov, ASPECT, 0.01, 4000);
  c.position.set(...cam.pos); c.lookAt(...cam.look); c.rotateZ(THREE.MathUtils.degToRad(cam.roll)); c.updateMatrixWorld();
  const v = new THREE.Vector3(...p);
  const d = v.clone().applyMatrix4(c.matrixWorldInverse).z;
  v.project(c);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, depth: -d };
}

// world-pinned tags: a measurement / weight written next to the thing it measures
type TagDef = { t0: number; t1: number; mode: Mode; at: V3; text: string; color?: string; size?: number; dx?: number };
const TAGS: TagDef[] = [
  { t0: T.b2 + 0.15, t1: T.lb22 - 0.2, mode: "street", at: [0, 2.08, 0], text: "YOU", size: 64 },
  { t0: T.lb22, t1: T.b3, mode: "street", at: [0.55, 0.62, 0.05], text: "22 LB", color: YEL, size: 92, dx: 150 },
  { t0: T.belt, t1: T.b3, mode: "street", at: [0.92, 1.14, 0.12], text: "3.6 FT", color: PAPER, size: 76, dx: 120 },
  { t0: T.hk + 0.5, t1: T.floors - 0.5, mode: "street", at: add(SW, [1.7, 1.25, 0]), text: "220 LB", color: YEL, size: 84 },
  { t0: T.heavier, t1: T.floors - 0.5, mode: "street", at: add(SW, [-1.75, 3.0, 0]), text: "YOU ~200 LB", color: PAPER, size: 62 },
  { t0: T.floors + 0.2, t1: T.b4, mode: "street", at: add(C2, [0, 11.3, 0.6]), text: "36 FT", color: YEL, size: 96 },
  { t0: T.ton + 0.4, t1: T.taller - 0.12, mode: "street", at: add(B1, [3.6, 3.6, 0]), text: "1 TON", color: YEL, size: 96 },
  { t0: T.eleven, t1: T.taller - 0.12, mode: "street", at: add(B1, [-3.4, 3.9, 0]), text: "= 11 x YOU", color: PAPER, size: 78 },
  { t0: T.taller + 0.2, t1: T.b5, mode: "harbour", at: add(HB, [48, 112, 8]), text: "$1M · 358 FT", color: YEL, size: 76, dx: 40 },
  { t0: T.taller + 0.7, t1: T.b5, mode: "harbour", at: add(HB, [0, 97, 0]), text: "305 FT", color: PAPER, size: 70, dx: -110 },
  { t0: T.tons, t1: T.stand + 0.3, mode: "street", at: add(CB, [0, 6.5, 5.3]), text: "1,000 TONS", color: YEL, size: 100 },
  { t0: T.space + 0.6, t1: T.b6, mode: "space", at: sp(0, ER + 109 * KM, 0), text: "68 MI", color: YEL, size: 90, dx: 160 },
  { t0: T.space + 0.25, t1: T.b6, mode: "space", at: sp(-0.08, ER + 100 * KM, 0), text: "SPACE · 62 MI", color: PAPER, size: 60, dx: -40 },
  { t0: T.esb + 0.1, t1: T.wraps - 0.15, mode: "giant", at: g(GB + 120, -40, 0), text: "= 2.6 EMPIRE STATE BLDGS", color: PAPER, size: 66 },
  { t0: T.esb - 0.5, t1: T.wraps - 0.15, mode: "giant", at: g(GB - 260, 210, 0), text: "$870B", color: YEL, size: 90 },
  { t0: T.wraps + 0.5, t1: T.b7, mode: "space", at: sp(0, -ER * 0.35, ER), text: "59,000 MILES", color: YEL, size: 96 },
];
const Tags: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => (
  <>
    {TAGS.filter((d) => t >= d.t0 && t < d.t1 && cam.mode === d.mode).map((d, i) => {
      const p = project(cam, d.at);
      if (p.depth <= 0) return null;
      const s = pop(t, d.t0) * clamp01((d.t1 - t) / 0.12);
      return (
        <div key={i} style={{ position: "absolute", left: p.x + (d.dx ?? 0), top: p.y, transform: `translate(-50%,-100%) scale(${s})`, transformOrigin: "50% 100%" }}>
          <Big size={d.size ?? 80} color={d.color}>{d.text}</Big>
        </div>
      );
    })}
  </>
);

// rank card at the top of each countdown beat
const RANKS: { t0: number; t1: number; rank: string; value: string }[] = [
  { t0: T.b2, t1: T.b3, rank: "#5", value: "$10,000" },
  { t0: T.b3, t1: T.b4, rank: "#4", value: "$100,000" },
  { t0: T.b4, t1: T.b5, rank: "#3", value: "$1,000,000" },
  { t0: T.b5, t1: T.b6, rank: "#2", value: "$1,000,000,000" },
  { t0: T.b6, t1: T.b7, rank: "#1", value: "RICHEST MAN" },
];
const Rank: React.FC<{ t: number }> = ({ t }) => {
  const r = RANKS.find((k) => t >= k.t0 && t < k.t1);
  if (!r) return null;
  const s = pop(t, r.t0);
  const sub = r.rank === "#1" && t >= T.n870 ? "~$870,000,000,000" : r.value;
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 150, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.6 + 0.4 * s})`, opacity: clamp01(s * 2) }}>
      <Big size={190} color={YEL}>{r.rank}</Big>
      <Big size={r.value.length > 12 || sub.length > 12 ? 84 : 110} style={{ marginTop: -4 }}>{sub}</Big>
    </div>
  );
};

const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= T.b2) return null;
  if (t < EARTH) return (
    <div style={{ position: "absolute", left: 0, width: W, top: 190, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `scale(${t >= IMPACT ? 1 + 0.12 * Math.exp(-(t - IMPACT) * 6) : 1})` }}>
      <Big size={150} color={YEL}>$1,000,000,000</Big>
      <Big size={96} color={GREEN}>IN $1 BILLS · 1,000 TONS</Big>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 190, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Big size={110}>RICHEST MAN</Big>
      <Big size={110} color={GREEN}>IN $1 BILLS</Big>
      <div style={{ transform: `scale(${pop(t, T.twice)})`, marginTop: 10 }}><Big size={150} color={YEL}>x2 AROUND EARTH</Big></div>
    </div>
  );
};

// beat 7: black pattern interrupt, the $1-a-second counter
const fmt = (n: number) => "$" + Math.floor(n).toLocaleString("en-US");
const CountCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.b7 || t >= T.b8) return null;
  const row = (t0: number, a: string, b: string, col: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: 900, marginTop: 34, opacity: t < t0 ? 0 : 1, transform: `scale(${t < t0 ? 0.6 : 0.6 + 0.4 * pop(t, t0)})`, transformOrigin: "0 50%" }}>
      <Big size={78} color={PAPER}>{a}</Big><Big size={110} color={col}>{b}</Big>
    </div>
  );
  // the counter runs in real seconds from "$1 a second"
  const n = t < T.sec ? 0 : 1 + (t - T.sec);
  return (
    <AbsoluteFill style={{ backgroundColor: "#07060A", alignItems: "center" }}>
      <div style={{ marginTop: 160, display: "flex", flexDirection: "column", alignItems: "center", opacity: ramp(t, T.b7, T.b7 + 0.2) }}>
        <Big size={64} color={PAPER}>IF YOU EARNED</Big>
        <div style={{ transform: `scale(${pop(t, T.earn)})` }}><Big size={96} color={GREEN}>$1 EVERY SECOND</Big></div>
        <div style={{ fontFamily: anton, fontSize: 150, color: PAPER, marginTop: 14, fontVariantNumeric: "tabular-nums" }}>{fmt(n)}</div>
        <div style={{ fontFamily: anton, fontSize: 46, color: "#8D8698", letterSpacing: 4 }}>NO SLEEP. NO BREAKS.</div>
      </div>
      <div style={{ position: "absolute", top: 640, left: 90 }}>
        {row(T.m1, "$1 MILLION", "11 DAYS", PAPER)}
        {row(T.bn, "$1 BILLION", "31 YEARS", YEL)}
        {row(T.pile, "$870B", t >= T.k27 ? "27,000 YEARS" : "...", RED)}
      </div>
      <div style={{ position: "absolute", top: 1130, width: W, display: "flex", justifyContent: "center", transform: `scale(${pop(t, T.farm)})` }}>
        <Big size={70} color={PAPER}>STARTED BEFORE FARMING</Big>
      </div>
    </AbsoluteFill>
  );
};

const Close: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.b8) return null;
  const items = [["#5", "$10K"], ["#4", "$100K"], ["#3", "$1M"], ["#2", "$1B"], ["#1", "$870B"]];
  return (
    <div style={{ position: "absolute", top: 200, left: 0, width: W, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Big size={92}>WHERE DO YOU STOP?</Big>
      <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
        {items.map(([r, v], i) => (
          <div key={r} style={{ textAlign: "center", transform: `scale(${pop(t, T.b8 + 0.05 + i * 0.12)})`, background: "rgba(20,14,32,0.6)", borderRadius: 18, padding: "8px 12px" }}>
            <Big size={60} color={YEL}>{r}</Big><Big size={56}>{v}</Big>
          </div>
        ))}
      </div>
    </div>
  );
};

const Captions: React.FC<{ c: PileProps["captions"]; hide: boolean }> = ({ c, hide }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ch = c.chunks.find((k) => f >= k.f0 && f < k.f1);
  if (!ch || hide) return null;
  const p = spring({ frame: f - ch.f0, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: c.y, transform: `translateY(-50%) scale(${0.9 + 0.1 * p})`, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: c.maxWidth, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: c.size * 0.35, fontFamily: anton, fontSize: c.size, lineHeight: 1.05 }}>
        {ch.words.map((w, i) => (
          <span key={i} style={{ color: w.k ? YEL : PAPER, opacity: f >= w.f0 ? 1 : 0.75, WebkitTextStroke: `${c.size * 0.12}px ${INK}`, paintOrder: "stroke fill" }}>{w.t}</span>
        ))}
      </div>
    </div>
  );
};

export const MoneyPile: React.FC<PileProps> = (P) => {
  const f = useCurrentFrame();
  const t = P.thumbT ?? f / 30;
  const live = P.thumbT === undefined;
  const tex = useTextures(["bill", "stack_side", "bundle_side", "earth", "clouds", "glow", "tape"]);
  const models = useModels();
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#140F22" }}>
      {tex && models && cam.mode !== "card" ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 40, near: 0.05, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} />
        </ThreeCanvas>
      ) : null}
      {live ? <>
        <AbsoluteFill style={{ background: "linear-gradient(rgba(14,10,26,0.42) 0%, rgba(14,10,26,0.12) 20%, rgba(14,10,26,0) 32%)" }} />
        <Tags t={t} cam={cam} />
        <Rank t={t} />
        <Hook t={t} />
        <CountCard t={t} />
        <Close t={t} />
        <Captions c={P.captions} hide={t >= T.b7 && t < T.b8} />
        <Audio src={staticFile(P.audio)} />
      </> : null}
    </AbsoluteFill>
  );
};
