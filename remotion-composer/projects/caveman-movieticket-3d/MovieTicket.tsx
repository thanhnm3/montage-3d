// Caveman Economics Short "price in minutes #2: the movie ticket" (2026-11-02) in the ink-3D look (user: brand-new 3D
// style, free downloaded assets, NO host). World = Kenney CC0 city buildings / furniture (seats) / food (soda) around a
// code-built cinema: facade, marquee with chasing bulbs, box-office booth with a flipping price board, a big WORK clock,
// the hero paper ticket (cut into pieces on screen), and an auditorium. Ink.tsx is www-ink3d-002's post pass.
// Script: tts/episodes/caveman-economics/shorts/2026-11-02-movie-ticket-minutes-short.txt
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

// beat starts + word starts (s) in public/audio/narration.wav (voice/beats/result.json, artifacts/whisper_words.json)
const T = {
  b2: 5.6, work: 5.88, two: 7.46, b3: 9.34, today: 9.38, p1114: 10.88, same2: 11.94, p725: 13.2,
  b4: 14.28, n92: 14.3, ticket4: 15.72, wage4: 17.72, b5: 20.77, p94: 21.98, today5: 23.82, p65: 24.32,
  b6: 25.74, date: 26.18, y1985: 26.78, today6: 30.02, b7: 33.01, still: 33.74, screen: 36.0, earn: 37.44,
  b8: 38.76, which: 41.24, end: 43.02,
};

// ------------------------------------------------------------------ hero ticket
const TW = 0.5, TH = TW * 480 / 1024, TD = 0.006;
// the hero ticket floats over the sidewalk on the line from the hook camera up to the marquee, so the lit cinema
// (booth, bulbs, marquee) sits blurred behind it instead of a flat booth window
const LOOKHOOK: V3 = [0, 3.4, 0];
const HT: V3 = [0.06, 1.67, 6.75];
// camera `d` m in front of the ticket on that line, looking through it at the marquee; focus on the ticket
const hookCam = (d: number) => {
  const v = new THREE.Vector3(...HT).sub(new THREE.Vector3(...LOOKHOOK)).normalize().multiplyScalar(d);
  // look a little above the line: the ticket sits in the lower half, the marquee and price board above it
  return { pos: [HT[0] + v.x, HT[1] + v.y, HT[2] + v.z] as V3, look: [LOOKHOOK[0], LOOKHOOK[1] + 0.8, LOOKHOOK[2]] as V3, focus: d };
};
// a box whose front/back faces show only the [u0, u1] slice of the ticket texture
function sliceGeo(u0: number, u1: number) {
  const g = new THREE.BoxGeometry(TW * (u1 - u0), TH, TD);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 16; i < 24; i++) uv.setX(i, i < 20 ? u0 + uv.getX(i) * (u1 - u0) : u1 - uv.getX(i) * (u1 - u0));
  uv.needsUpdate = true;
  return g;
}
const FLIPS: [number, string][] = [[0, "1985"], [9.75, "2025"], [T.b5 - 0.05, "1985"], [T.today5 - 0.1, "2025"], [T.b8 - 0.05, "2025"], [41.3, "1985"]];
const CUTS: { t: number; k: number }[] = [{ t: 22.45, k: 0.94 }, { t: 24.4, k: 0.65 }];
function ticketState(t: number) {
  let i = 0;
  while (i + 1 < FLIPS.length && FLIPS[i + 1][0] <= t) i++;
  const [t0] = FLIPS[i];
  // a flip = one turn around y over 0.45 s; the face swaps at the half turn (edge-on)
  const x = clamp01((t - t0) / 0.45);
  const spin = t0 > 0 && x < 1 ? ease(x) * Math.PI * 2 : 0;
  const year = t0 > 0 && x < 0.25 && i > 0 ? FLIPS[i - 1][1] : FLIPS[i][1];
  // kept fraction: a cut sticks until the next flip
  let k = 1, cutAt = -1;
  for (const c of CUTS) if (t >= c.t && c.t > t0) { k = c.k; cutAt = c.t; }
  return { year, spin, k, cutAt };
}
const Ticket: React.FC<{ tex: Tex; t: number }> = ({ tex, t }) => {
  const s = ticketState(t);
  const paper = useMemo(() => ({ "1985": toon({ color: "#F3E6C4" }), "2025": toon({ color: "#EAF2F8" }) }), []);
  const face = useMemo(() => ({ "1985": toon({ map: tex.ticket_1985, emissiveMap: tex.ticket_1985, emissive: new THREE.Color("#FFFFFF"), emissiveIntensity: 0.55 }),
    "2025": toon({ map: tex.ticket_2025, emissiveMap: tex.ticket_2025, emissive: new THREE.Color("#FFFFFF"), emissiveIntensity: 0.55 }) }), [tex]);
  const kq = Math.round(s.k * 100) / 100;
  const left = useMemo(() => sliceGeo(0, kq), [kq]);
  const right = useMemo(() => sliceGeo(kq, 1), [kq]);
  const y = s.year as "1985" | "2025";
  const mats = [paper[y], paper[y], paper[y], paper[y], face[y], face[y]];
  const bob = Math.sin(t * 1.3) * 0.012;
  const fall = s.cutAt >= 0 ? t - s.cutAt : -1;
  return (
    <group position={[HT[0], HT[1] + bob, HT[2]]} rotation={[-0.2 + 0.05 * Math.sin(t * 0.9), s.spin + 0.06 * Math.sin(t * 0.7), 0.03 * Math.sin(t * 1.1)]}>
      <mesh geometry={left} material={mats} position={[-TW / 2 + (TW * kq) / 2 - (fall >= 0 ? Math.min(0.02, fall * 0.1) : 0), 0, 0]} castShadow />
      {kq < 1 && fall < 1.6 ? (
        <mesh geometry={right} material={mats} castShadow
          position={[TW / 2 - (TW * (1 - kq)) / 2 + fall * 0.12, -4.9 * fall * fall * 0.35, fall * 0.25]}
          rotation={[fall * 2.2, fall * 0.8, -fall * 3.1]} />
      ) : null}
    </group>
  );
};

// ------------------------------------------------------------------ cinema exterior (code) + CC0 street
const MAROON = "#6E1B27", CREAM = "#EFE3C8", GOLD = "#E0A93A";
const Bulbs: React.FC<{ glow: THREE.Texture; t: number; pts: V3[] }> = ({ glow, t, pts }) => {
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFE2A0") }), []);
  return (
    <group>
      {pts.map((p, i) => {
        const on = 0.55 + 0.45 * (Math.floor(t * 8 - i * 0.34) % 3 === 0 ? 1 : 0); // chasing marquee bulbs
        return (
          <group key={i} position={p}>
            <mesh material={bulb}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
            <sprite scale={[0.55 * on, 0.55 * on, 1]} userData={{ noNormal: true }}>
              <spriteMaterial map={glow} color="#FFB85C" transparent opacity={0.55 * on} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        );
      })}
    </group>
  );
};

const Clock: React.FC<{ tex: Tex; t: number }> = ({ tex, t }) => {
  const mins = 64 * ramp(t, T.work, T.work + 1.5) + 0.7 * Math.max(0, t - T.work - 1.5);
  const minA = -(mins / 60) * Math.PI * 2, hrA = -((18 * 60 + mins) / 720) * Math.PI * 2;
  const rim = useMemo(() => toon({ color: GOLD }), []);
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex.clock }), [tex]);
  const hand = useMemo(() => toon({ color: "#1C1820" }), []);
  return (
    <group position={[4.6, 8.0, 0.12]}>
      <mesh material={rim} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.45, 1.45, 0.24, 48]} /></mesh>
      <mesh material={face} position={[0, 0, 0.125]}><circleGeometry args={[1.3, 48]} /></mesh>
      <group position={[0, 0, 0.2]} rotation={[0, 0, hrA]}><mesh material={hand} position={[0, 0.36, 0]}><boxGeometry args={[0.12, 0.78, 0.05]} /></mesh></group>
      <group position={[0, 0, 0.24]} rotation={[0, 0, minA]}><mesh material={hand} position={[0, 0.52, 0]}><boxGeometry args={[0.07, 1.1, 0.05]} /></mesh></group>
      <mesh material={hand} position={[0, 0, 0.27]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.06, 16]} /></mesh>
    </group>
  );
};

// a sign that flips 1985 <-> 2025 with the ticket: the price board above the booth window and (r02) the minimum-wage
// sign taped inside it, so both numbers live in the world instead of on overlays
const Flipper: React.FC<{ tex: Tex; t: number; name: string; pos: V3; size: [number, number]; at: number }> = ({ tex, t, name, pos, size, at }) => {
  const m85 = useMemo(() => new THREE.MeshBasicMaterial({ map: tex[`${name}_1985`] }), [tex, name]);
  const m25 = useMemo(() => new THREE.MeshBasicMaterial({ map: tex[`${name}_2025`] }), [tex, name]);
  // [start, shows 2025 after, flip length]; beat 5 opens on a cut back to the 1985 ticket, so the signs snap back unseen
  const flips: [number, boolean, number][] = [[at, true, 0.5], [T.b5 - 0.05, false, 0.01], [T.today5 - 0.1 + (at - 9.55), true, 0.5], [41.15 + (at - 9.55), false, 0.5]];
  let is25 = false, ang = 0;
  for (const [t0, to, dur] of flips) {
    if (t < t0) continue;
    const x = clamp01((t - t0) / dur);
    ang = x < 1 ? Math.sin(x * Math.PI) * Math.PI * 0.5 * (x < 0.5 ? 1 : -1) : 0;
    is25 = x < 0.5 ? !to : to;
  }
  return (
    <group position={pos} rotation={[ang, 0, 0]}>
      <mesh material={is25 ? m25 : m85}><planeGeometry args={size} /></mesh>
    </group>
  );
};

const Exterior: React.FC<{ tex: Tex; models: Models; t: number }> = ({ tex, models, t }) => {
  const mt = useMemo(() => ({
    maroon: toon({ color: MAROON }), cream: toon({ color: CREAM }), gold: toon({ color: GOLD }), dark: toon({ color: "#2A2433" }),
    glass: toon({ color: "#2C4A63" }), side: toon({ color: "#3A3640" }), walk: toon({ color: "#9A949E" }), street: toon({ color: "#3B3743" }),
    line: toon({ color: "#E3C04A" }), pole: toon({ color: "#2A2433" }),
    marquee: new THREE.MeshBasicMaterial({ map: tex.marquee }), blade: new THREE.MeshBasicMaterial({ map: tex.blade }),
    posters: ["poster_a", "poster_b", "poster_c"].map((n) => new THREE.MeshBasicMaterial({ map: tex[n] })),
    lampHead: new THREE.MeshBasicMaterial({ color: "#FFE6B0" }), booth: new THREE.MeshBasicMaterial({ color: "#3B2A3E" }),
  }), [tex]);
  const bulbs = useMemo(() => {
    const p: V3[] = [];
    for (let x = -5.8; x <= 5.81; x += 0.4) { p.push([x, 6.3, 1.72]); p.push([x, 3.9, 1.72]); }
    for (let y = 4.3; y <= 5.9; y += 0.4) { p.push([-6.0, y, 1.72]); p.push([6.0, y, 1.72]); }
    return p;
  }, []);
  return (
    <group>
      {/* sidewalk, curb, street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4.5]} material={mt.walk} receiveShadow><planeGeometry args={[120, 9]} /></mesh>
      <mesh position={[0, 0.08, 9.05]} material={mt.cream}><boxGeometry args={[120, 0.16, 0.25]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 30]} material={mt.street} receiveShadow><planeGeometry args={[300, 42]} /></mesh>
      {Array.from({ length: 14 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-39 + i * 6, 0.005, 16]} material={mt.line}><planeGeometry args={[2.6, 0.18]} /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -20]} material={mt.walk}><planeGeometry args={[300, 40]} /></mesh>
      {/* facade */}
      <mesh position={[0, 5, -3]} material={mt.maroon} castShadow receiveShadow><boxGeometry args={[16, 10, 6]} /></mesh>
      <mesh position={[0, 10.15, -2.9]} material={mt.cream}><boxGeometry args={[16.4, 0.3, 6.3]} /></mesh>
      <mesh position={[0, 0.25, 0.05]} material={mt.cream}><boxGeometry args={[16.2, 0.5, 0.3]} /></mesh>
      {[-7.6, 7.6].map((x) => <mesh key={x} position={[x, 5, 0.12]} material={mt.cream}><boxGeometry args={[0.6, 10, 0.3]} /></mesh>)}
      {/* doors behind the booth */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => <mesh key={x} position={[x, 1.65, 0.06]} material={mt.glass}><boxGeometry args={[1.4, 2.8, 0.12]} /></mesh>)}
      {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => <mesh key={x} position={[x, 1.65, 0.14]} material={mt.gold}><boxGeometry args={[0.12, 2.9, 0.1]} /></mesh>)}
      {/* posters in light boxes */}
      {[[-5.3, 0], [5.3, 1], [-6.4, 2]].slice(0, 2).map(([x, i]) => (
        <group key={x} position={[x, 2.0, 0.12]}>
          <mesh material={mt.gold}><boxGeometry args={[1.9, 2.75, 0.14]} /></mesh>
          <mesh material={mt.posters[i]} position={[0, 0, 0.08]}><planeGeometry args={[1.62, 2.43]} /></mesh>
        </group>
      ))}
      {/* marquee */}
      <mesh position={[0, 5.1, 0.85]} material={mt.cream} castShadow><boxGeometry args={[12.4, 2.6, 1.7]} /></mesh>
      <mesh position={[0, 5.1, 1.71]} material={mt.marquee}><planeGeometry args={[11.2, 2.1]} /></mesh>
      <mesh position={[0, 6.55, 0.85]} material={mt.maroon}><boxGeometry args={[12.8, 0.3, 1.9]} /></mesh>
      <Bulbs glow={tex.glow} t={t} pts={bulbs} />
      {/* vertical blade sign */}
      <group position={[-6.9, 8.4, 1.2]}>
        <mesh material={mt.maroon}><boxGeometry args={[1.3, 4.6, 0.35]} /></mesh>
        <mesh material={mt.blade} position={[0, 0, 0.18]}><planeGeometry args={[1.1, 4.3]} /></mesh>
      </group>
      <Clock tex={tex} t={t} />
      {/* box office booth */}
      <group>
        <mesh position={[0, 0.5, 2.4]} material={mt.cream} castShadow receiveShadow><boxGeometry args={[2.6, 1.0, 1.6]} /></mesh>
        <mesh position={[0, 2.25, 2.4]} material={mt.maroon} castShadow><boxGeometry args={[2.6, 2.5, 1.6]} /></mesh>
        <mesh position={[0, 3.55, 2.4]} material={mt.gold}><boxGeometry args={[2.8, 0.2, 1.8]} /></mesh>
        <mesh position={[0, 1.55, 3.21]} material={mt.booth}><planeGeometry args={[2.1, 0.95]} /></mesh>
        <mesh position={[0, 1.02, 3.35]} material={mt.gold} castShadow><boxGeometry args={[2.3, 0.08, 0.35]} /></mesh>
        <Flipper tex={tex} t={t} name="board" pos={[0, 2.68, 3.24]} size={[2.3, 1.15]} at={9.55} />
        <Flipper tex={tex} t={t} name="wage" pos={[0, 1.68, 3.23]} size={[1.1, 0.6]} at={9.75} />
      </group>
      <pointLight position={[0, 1.6, 3.8]} intensity={4} distance={6} color="#FFD7A0" />
      <pointLight position={[0, 4.0, 3.2]} intensity={10} distance={14} color="#FFC27A" />
      {/* street lamps */}
      {[-6.5, 6.5].map((x) => (
        <group key={x} position={[x, 0, 7.6]}>
          <mesh material={mt.pole} position={[0, 2.4, 0]}><cylinderGeometry args={[0.09, 0.12, 4.8, 12]} /></mesh>
          <mesh material={mt.lampHead} position={[0, 4.85, 0]}><sphereGeometry args={[0.3, 16, 12]} /></mesh>
          <sprite position={[0, 4.85, 0]} scale={[2.6, 2.6, 1]} userData={{ noNormal: true }}>
            <spriteMaterial map={tex.glow} color="#FFC888" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <pointLight position={[0, 4.6, 0]} intensity={6} distance={12} color="#FFD29A" />
        </group>
      ))}
      {/* CC0 city around it */}
      <M models={models} name="bH" size={13} pos={[-15.5, 0, -3.5]} />
      <M models={models} name="bK" size={12} pos={[15.5, 0, -3.5]} />
      <M models={models} name="skyA" size={34} pos={[-27, 0, -9]} />
      <M models={models} name="skyB" size={38} pos={[28, 0, -10]} />
      <M models={models} name="bJ" size={17} pos={[-4, 0, -18]} />
      <M models={models} name="bE" size={15} pos={[9, 0, -20]} />
      <M models={models} name="bA" size={11} pos={[-25, 0, 4]} rot={Math.PI / 2} />
      <M models={models} name="bF" size={11} pos={[26, 0, 4]} rot={-Math.PI / 2} />
      <M models={models} name="bench" size={0.9} pos={[-4.8, 0, 3.0]} />
      <M models={models} name="trash" size={0.95} pos={[4.6, 0, 3.4]} />
      <M models={models} name="plant" size={1.3} pos={[-3.6, 0, 0.8]} />
      <M models={models} name="plant" size={1.3} pos={[3.6, 0, 0.8]} />
    </group>
  );
};

// ------------------------------------------------------------------ auditorium (far away at X0)
const X0 = 300;
const ROWS = 7, SEATS = 12;
const SEAT_Y = 0.33; // cushion top of the Kenney lounge chair at 0.72 m wide
const rowZ = (r: number) => r * 1.25, rowY = (r: number) => r * 0.32;
const seatX = (i: number) => X0 + (i - (SEATS - 1) / 2) * 0.74;
const DATE: V3[] = [[seatX(5), rowY(3), rowZ(3)], [seatX(6), rowY(3), rowZ(3)]];
const LONE: V3 = [seatX(8), rowY(0), rowZ(0)];
const Popcorn: React.FC<{ tex: Tex; pos: V3 }> = ({ tex, pos }) => {
  const cup = useMemo(() => { const m = toon({ map: tex.stripes }); m.side = THREE.DoubleSide; return m; }, [tex]);
  const corn = useMemo(() => toon({ color: "#FFF1C8" }), []);
  const pts = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const a = i * 2.4, r = 0.03 + 0.075 * Math.sqrt((i % 17) / 17);
    return [Math.cos(a) * r, 0.33 + 0.035 * Math.floor(i / 17) + 0.02 * Math.sin(i * 7), Math.sin(a) * r] as V3;
  }), []);
  return (
    <group position={pos}>
      <mesh material={cup} position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.13, 0.095, 0.34, 20, 1, true]} /></mesh>
      {pts.map((p, i) => <mesh key={i} material={corn} position={p}><icosahedronGeometry args={[0.032, 0]} /></mesh>)}
    </group>
  );
};
const Auditorium: React.FC<{ tex: Tex; models: Models; t: number }> = ({ tex, models, t }) => {
  const mt = useMemo(() => ({
    carpet: toon({ color: "#3A1E2C" }), wall: toon({ color: "#4A1B2A" }), riser: toon({ color: "#2E1724" }), trim: toon({ color: GOLD }),
    screen: new THREE.MeshBasicMaterial({ map: tex.screen }), frame: toon({ color: "#15111A" }),
    beam: new THREE.MeshBasicMaterial({ color: "#FFF2D0", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    ticket: toon({ map: tex.ticket_1985 }),
  }), [tex]);
  const seatCol = useMemo(() => ({ carpet: "#C42A26", wood: "#3A2232" }), []);
  const spot = ramp(t, T.b7 + 0.2, T.b7 + 1.2);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  // the date's two tickets drop onto the seats
  const drop = (i: number) => { const x = clamp01((t - (T.date + i * 0.18)) / 0.5); return { y: lerp(1.6, 0, x * x), r: (1 - x) * 3 }; };
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[X0, -0.01, 2]} material={mt.carpet} receiveShadow><planeGeometry args={[16, 30]} /></mesh>
      {Array.from({ length: ROWS }, (_, r) => r === 0 ? null : (
        <mesh key={r} position={[X0, rowY(r) / 2, rowZ(r) + 2]} material={mt.riser} receiveShadow><boxGeometry args={[11, rowY(r), 1.25 + 0.01]} /></mesh>
      ))}
      {[-6.2, 6.2].map((x) => <mesh key={x} position={[X0 + x, 4.5, 1]} material={mt.wall} receiveShadow><boxGeometry args={[0.3, 9, 24]} /></mesh>)}
      <mesh position={[X0, 4.5, 12.5]} material={mt.wall}><boxGeometry args={[12.6, 9, 0.3]} /></mesh>
      <mesh position={[X0, 4.5, -8.6]} material={mt.wall}><boxGeometry args={[12.6, 9, 0.3]} /></mesh>
      <mesh position={[X0, 4.2, -8.4]} material={mt.frame}><boxGeometry args={[10.6, 4.7, 0.1]} /></mesh>
      <mesh position={[X0, 4.2, -8.32]} material={mt.screen}><planeGeometry args={[10, 4.17]} /></mesh>
      {[-6.0, 6.0].map((x) => <mesh key={x} position={[X0 + x, 0.4, 1]} material={mt.trim}><boxGeometry args={[0.1, 0.08, 24]} /></mesh>)}
      {Array.from({ length: ROWS }, (_, r) => Array.from({ length: SEATS }, (_, i) => (
        <M key={`${r}_${i}`} models={models} name="lounge" size={0.72} axis="x" pos={[seatX(i), rowY(r), rowZ(r)]} rot={Math.PI} colors={seatCol} />
      )))}
      <Popcorn tex={tex} pos={[seatX(4), rowY(3) + SEAT_Y, rowZ(3) - 0.05]} />
      <M models={models} name="soda" size={0.32} pos={[seatX(7), rowY(3) + SEAT_Y, rowZ(3) - 0.05]} />
      {DATE.map((p, i) => {
        const d = drop(i);
        return <mesh key={i} material={mt.ticket} position={[p[0], p[1] + SEAT_Y + d.y + 0.01, p[2] - 0.05]} rotation={[-Math.PI / 2 + 0.1, 0, 0.4 - i * 0.7 + d.r]} castShadow>
          <boxGeometry args={[0.24, 0.112, 0.004]} /></mesh>;
      })}
      {/* projector beam from the back wall, spotlight on the lone seat (beat 7) */}
      <mesh position={[X0, 5.8, 2.0]} rotation={[Math.PI / 2 + 0.17, 0, 0]} material={mt.beam} userData={{ noNormal: true }}><coneGeometry args={[2.6, 21, 24, 1, true]} /></mesh>
      <pointLight position={[X0, 4.2, -6.5]} intensity={260} distance={30} decay={1.6} color="#CFE0FF" />
      <pointLight position={[X0, 7.5, 6]} intensity={120} distance={30} decay={1.6} color="#E0A6C8" />
      <pointLight position={[X0 + 3, 2.5, 6.5]} intensity={60} distance={12} decay={1.6} color="#FFC890" />
      <primitive object={spotTarget} position={[LONE[0], LONE[1] + 0.3, LONE[2]]} />
      <spotLight position={[LONE[0], 7.6, LONE[2] + 0.4]} target={spotTarget} angle={0.17} penumbra={0.6} intensity={900 * spot} distance={14} color="#FFE7B8" castShadow />
      <mesh position={[LONE[0], (7.6 + LONE[1]) / 2, LONE[2] + 0.2]} material={mt.beam} userData={{ noNormal: true }} scale={[1, 1, 1]} visible={spot > 0.01}>
        <coneGeometry args={[0.95, 7.6 - LONE[1], 24, 1, true]} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ camera
type CamKey = { t: number; pos: V3; look: V3; fov: number; glide?: number; cut?: boolean; push?: number; roll?: number; focus?: number; blur?: number; night?: number };
const LT: V3 = [0, 2.6, 2.0];
const K: CamKey[] = [
  // HOOK: the ticket fills the lens in front of the box office, then the camera backs off to the whole cinema
  { t: 0, ...hookCam(1.5), fov: 40, push: 0.0, roll: -3, blur: 10 },
  { t: 2.9, pos: [1.3, 2.3, 11.5], look: LT, fov: 46, glide: 1.4, push: 0.006, roll: 2 },
  // 64 minutes: tilt up to the WORK clock while its hand runs; two hours: swing down onto the marquee
  { t: T.b2 - 0.25, pos: [3.3, 6.9, 6.2], look: [4.6, 8.0, 0.1], fov: 38, glide: 0.75, push: 0.012, roll: -4 },
  { t: T.two - 0.2, pos: [-1.6, 4.6, 9.4], look: [0, 5.1, 1.7], fov: 42, glide: 0.8, push: 0.01, roll: 3 },
  // TODAY: hard cut onto the price board as it flips; then a low hero angle under the marquee
  { t: T.b3, pos: [0.5, 2.75, 6.1], look: [0, 2.68, 3.24], fov: 36, cut: true, push: 0.02 },
  { t: T.same2 - 0.2, pos: [-1.5, 0.5, 9.2], look: [0.3, 3.4, 1.2], fov: 50, glide: 1.0, push: 0.005, roll: -6 },
  // (beat 4 is a black card) -> beat 5 opens close on the ticket
  { t: T.b4 + 0.3, ...hookCam(1.25), fov: 40, cut: true, blur: 10 },
  { t: T.today5 - 0.25, ...hookCam(1.3), fov: 40, glide: 0.5, roll: 4, blur: 10 },
  // DATE: inside, low along the row onto the two seats; rise behind them toward the screen
  { t: T.b6, pos: [X0 + 1.5, rowY(3) + 1.25, rowZ(3) - 2.0], look: [X0, rowY(3) + 0.5, rowZ(3)], fov: 44, cut: true, push: 0.02, roll: 4, night: 0.3 },
  { t: 28.6, pos: [X0 + 0.0, rowY(3) + 1.9, rowZ(3) + 3.4], look: [X0, 3.6, -8.3], fov: 50, glide: 1.6, push: 0.008, night: 0.3 },
  // SAME 2 HOURS: wide from the back, a slow push to the one lit empty seat
  { t: T.b7, pos: [X0 + 3.9, 5.2, 11.6], look: [X0, 2.4, -4], fov: 48, cut: true, push: 0.0, night: 0.45 },
  { t: T.b7 + 0.6, pos: [LONE[0] + 1.3, LONE[1] + 1.35, LONE[2] - 2.9], look: [LONE[0], LONE[1] + 0.5, LONE[2]], fov: 42, glide: 4.6, push: 0.006, night: 0.45 },
  // CLOSE: back outside wide, then the camera glides into the hook's frame (loop seam)
  { t: T.b8, pos: [1.3, 2.3, 11.5], look: LT, fov: 46, cut: true, push: 0.0, roll: 2 },
  { t: 41.0, ...hookCam(1.5), fov: 40, glide: 2.0, roll: -3, blur: 10 },
];
function keyState(k: CamKey, t: number) {
  const e = Math.max(0, t - k.t) * (k.push ?? 0);
  return { pos: lerpV(k.pos, k.look, Math.min(0.5, e)), look: k.look, fov: k.fov, focus: k.focus, blur: k.blur ?? 6, roll: k.roll ?? 0, night: k.night ?? 0.42 };
}
// glides chain from the previous key's own (possibly still gliding) state: one continuous path between cuts
function stateAt(i: number, t: number): ReturnType<typeof keyState> {
  const k = K[i];
  let s = keyState(k, t);
  const g = k.glide ?? 0;
  if (i > 0 && !k.cut && g > 0 && t - k.t < g) {
    const a = stateAt(i - 1, t);
    const x = ease((t - k.t) / g);
    const da = new THREE.Vector3(...a.look).sub(new THREE.Vector3(...a.pos)).normalize();
    const db = new THREE.Vector3(...s.look).sub(new THREE.Vector3(...s.pos)).normalize();
    const pos = lerpV(a.pos, s.pos, x);
    const dir = da.lerp(db, x).normalize();
    const dist = lerp(new THREE.Vector3(...a.look).distanceTo(new THREE.Vector3(...a.pos)), new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos)), x);
    const fa = a.focus ?? new THREE.Vector3(...a.look).distanceTo(new THREE.Vector3(...a.pos));
    const fb = s.focus ?? new THREE.Vector3(...s.look).distanceTo(new THREE.Vector3(...s.pos));
    s = { pos, look: [pos[0] + dir.x * dist, pos[1] + dir.y * dist, pos[2] + dir.z * dist], fov: lerp(a.fov, s.fov, x), focus: lerp(fa, fb, x),
      blur: lerp(a.blur, s.blur, x), roll: lerp(a.roll, s.roll, x), night: lerp(a.night, s.night, x) };
  }
  return s;
}
function camAt(t: number) {
  let i = 0;
  while (i + 1 < K.length && K[i + 1].t <= t) i++;
  const s = stateAt(i, t);
  const pos: V3 = [s.pos[0] + Math.sin(t * 0.7) * 0.012, s.pos[1] + Math.sin(t * 0.9 + 1) * 0.01, s.pos[2]];
  return { ...s, pos };
}
const CamSet: React.FC<{ pos: V3; look: V3; fov: number; roll: number }> = ({ pos, look, fov, roll }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.05; c.far = 4000; c.aspect = ASPECT;
  c.updateProjectionMatrix(); c.lookAt(...look); c.rotateZ(THREE.MathUtils.degToRad(roll)); c.updateMatrixWorld();
  return null;
};

const flashAt = (t: number) => Math.max(t >= T.b3 ? Math.exp(-(t - T.b3) * 7) * 0.7 : 0, t >= 41.15 && t < 42 ? Math.exp(-(t - 41.15) * 8) * 0.35 : 0);

const Scene: React.FC<{ t: number; tex: Tex; models: Models; cam: ReturnType<typeof camAt> }> = ({ t, tex, models, cam }) => {
  const inside = cam.pos[0] > 150;
  return (
    <>
      <CamSet pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
      <fogExp2 attach="fog" args={[new THREE.Color(inside ? "#120C18" : "#1D1838").getHex(), inside ? 0.008 : 0.011]} />
      <NightSky />
      <hemisphereLight args={[new THREE.Color("#8FA2E8"), new THREE.Color("#5A3E4E"), inside ? lerp(1.1, 0.4, ramp(t, T.b7, T.b7 + 1.0)) : 0.85]} />
      <directionalLight position={[-14, 22, 30]} intensity={inside ? 0.0 : 1.3} color="#B9C6FF" castShadow
        shadow-mapSize={[4096, 4096]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-far={120} />
      <Exterior tex={tex} models={models} t={t} />
      <Ticket tex={tex} t={t} />
      <Auditorium tex={tex} models={models} t={t} />
      <InkPass p={{ focus: cam.focus ?? new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...cam.look)), blur: cam.blur,
        night: cam.night, cow: 0, flash: flashAt(t), redPulse: 0, ink: 1 }} />
    </>
  );
};

// ------------------------------------------------------------------ overlays
const INK = "#1E1828";
const RED = "#FF4A3D", GREY = "#A8A2B0", YEL = "#FFD23F", PAPER = "#FFF8EC";
type Cap = { f0: number; f1: number; words: { t: string; f0: number; f1: number; k?: boolean }[] };
// thumbT: freeze the world at that time with no overlays/captions/audio (thumbnail stills)
export type TicketProps = { durationInFrames: number; audio: string; thumbT?: number; captions: { chunks: Cap[]; y: number; size: number; maxWidth: number } };

const pop = (t: number, t0: number) => t < t0 ? 0 : spring({ frame: Math.round((t - t0) * 30), fps: 30, config: { damping: 10, stiffness: 240 } });
const Big: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = PAPER, children, style }) => (
  <div style={{ fontFamily: anton, fontSize: size, lineHeight: 1.0, letterSpacing: 2, color, WebkitTextStroke: `${size * 0.11}px ${INK}`, paintOrder: "stroke fill",
    whiteSpace: "nowrap", textShadow: `0 ${size * 0.05}px ${size * 0.08}px rgba(10,5,25,0.55)`, ...style }}>{children}</div>
);
// a block that pops in at t0 and out at t1 (anchored at its top-centre unless left is given)
const Pop: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; rot?: number; children: React.ReactNode; anchor?: string }> = ({ t, t0, t1, x, y, rot = 0, children, anchor = "-50%,0" }) => {
  if (t < t0 || t > t1) return null;
  const s = pop(t, t0) * clamp01((t1 - t) / 0.12);
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(${anchor}) rotate(${rot}deg) scale(${s})`, transformOrigin: "50% 50%" }}>{children}</div>;
};
function project(cam: { pos: V3; look: V3; fov: number; roll: number }, p: V3) {
  const c = new THREE.PerspectiveCamera(cam.fov, ASPECT, 0.05, 4000);
  c.position.set(...cam.pos); c.lookAt(...cam.look); c.rotateZ(THREE.MathUtils.degToRad(cam.roll)); c.updateMatrixWorld();
  const v = new THREE.Vector3(...p);
  const d = v.clone().applyMatrix4(c.matrixWorldInverse).z;
  v.project(c);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, depth: -d };
}
// the clock's lower face carries a counter of the minutes worked (r02: replaces the "63.6 MIN" overlay)
const CLOCK_LCD: V3 = [4.6, 7.42, 0.4];
const ClockCount: React.FC<{ t: number; cam: ReturnType<typeof camAt> }> = ({ t, cam }) => {
  if (t < T.b2 - 0.3 || t >= T.b3) return null;
  const p = project(cam, CLOCK_LCD);
  if (p.depth <= 0) return null;
  // px per metre at that depth, so the strip stays glued to the clock as the camera moves
  const ppm = H / (2 * p.depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  const mins = 63.6 * ramp(t, T.work, T.work + 1.5);
  const fs = 0.3 * ppm;
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${-cam.roll}deg)`, fontFamily: anton, fontSize: fs, lineHeight: 1,
      color: "#FF5A3C", background: "#1C1820", border: `${fs * 0.08}px solid ${GOLD}`, borderRadius: fs * 0.15, padding: `${fs * 0.08}px ${fs * 0.25}px`,
      textShadow: `0 0 ${fs * 0.15}px #FF5A3C`, whiteSpace: "nowrap" }}>{mins.toFixed(1)} MIN</div>
  );
};

const Bars: React.FC<{ t: number }> = ({ t }) => {
  // beat 4 pattern interrupt: black, two numbers, two bars
  if (t < T.b4 || t >= T.b5) return null;
  const bar = (t0: number, k: number, col: string, label: string, pct: string) => {
    const g = ease((t - t0) / 0.7);
    return (
      <div style={{ opacity: t < t0 ? 0 : 1, marginBottom: 70 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
          <Big size={64} color={col}>{label}</Big>
          <Big size={170} color={PAPER}>{pct}</Big>
        </div>
        <div style={{ height: 70, width: 260 * lerp(1, k, g), background: col, borderRadius: 8, border: `5px solid ${PAPER}` }} />
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#07060A" }}>
      <div style={{ position: "absolute", left: 90, top: 330 }}>
        <div style={{ transform: `scale(${pop(t, T.n92)})`, transformOrigin: "0 50%", marginBottom: 90 }}>
          <Big size={150} color={PAPER}>92 MIN</Big>
        </div>
        {bar(T.ticket4, 3.14, RED, "TICKET", "+214%")}
        {bar(T.wage4, 2.16, GREY, "WAGE", "+116%")}
      </div>
    </AbsoluteFill>
  );
};

const DateBars: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.y1985 - 0.1 || t >= T.b7) return null;
  const sc = 4.6; // px per minute
  const row = (t0: number, label: string, mins: number, col: string, txt: string) => {
    const g = ease((t - t0) / 0.6);
    return (
      <div style={{ opacity: t < t0 ? 0 : 1, marginTop: 18 }}>
        <div style={{ fontFamily: anton, fontSize: 44, color: INK, letterSpacing: 2 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ height: 52, width: mins * sc * g, background: col, border: `5px solid ${INK}`, borderRadius: 6 }} />
          <div style={{ fontFamily: anton, fontSize: 56, color: col === GREY ? "#5C5566" : col }}>{txt}</div>
        </div>
      </div>
    );
  };
  const s = pop(t, T.y1985 - 0.1) * clamp01((T.b7 - t) / 0.12);
  return (
    <div style={{ position: "absolute", left: 60, top: 170, width: 960, transform: `scale(${s})`, transformOrigin: "50% 0", background: "#FFF3D6",
      border: `8px solid ${INK}`, borderRadius: 24, padding: "20px 34px 30px", boxShadow: "9px 12px 0 rgba(20,14,32,0.4)" }}>
      <div style={{ fontFamily: anton, fontSize: 70, color: "#B3241F", letterSpacing: 3 }}>2 TICKETS = ? HOURS OF WORK</div>
      {/* the movie's length as a dashed line through every row */}
      <div style={{ position: "relative" }}>
        {row(T.y1985, "THE MOVIE", 120, GREY, "2h")}
        {row(T.y1985 + 0.5, "1985 WORK", 127, GOLD, "2h07")}
        {row(T.today6, "2025 WORK", 184, RED, "3h04")}
        <div style={{ position: "absolute", left: 120 * sc, top: 0, bottom: 0, borderLeft: `5px dashed ${INK}`, opacity: 0.55 }} />
      </div>
    </div>
  );
};

const Captions: React.FC<{ c: TicketProps["captions"]; hide: boolean }> = ({ c, hide }) => {
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

export const MovieTicket: React.FC<TicketProps> = (P) => {
  const f = useCurrentFrame();
  const t = P.thumbT ?? f / 30;
  const live = P.thumbT === undefined;
  const tex = useTextures(["ticket_1985", "ticket_2025", "board_1985", "board_2025", "marquee", "blade", "clock", "screen", "poster_a", "poster_b", "poster_c", "stripes", "glow", "wage_1985", "wage_2025"]);
  const models = useModels();
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#140F22" }}>
      {tex && models ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 40, near: 0.05, far: 4000 }} gl={{ antialias: false }}>
          <Scene t={t} tex={tex} models={models} cam={cam} />
        </ThreeCanvas>
      ) : null}
      {live ? <>
      {/* dark wash behind the top text block: the marquee lettering otherwise competes with it */}
      <AbsoluteFill style={{ opacity: ramp(t, T.b8, T.b8 + 0.3), background: "linear-gradient(rgba(14,10,26,0.72) 0%, rgba(14,10,26,0.45) 22%, rgba(14,10,26,0) 40%)" }} />
      <ClockCount t={t} cam={cam} />
      <Bars t={t} />
      <DateBars t={t} />
      {/* close: pick a year, held to the end */}
      <Pop t={t} t0={T.b8 + 0.05} t1={99} x={540} y={250}>
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ textAlign: "center", background: "rgba(20,14,32,0.55)", borderRadius: 20, padding: "10px 30px" }}><Big size={90} color={GOLD}>1985</Big><Big size={150}>64 MIN</Big></div>
          <div style={{ textAlign: "center", background: "rgba(20,14,32,0.55)", borderRadius: 20, padding: "10px 30px", transform: `scale(${t >= 40.16 ? pop(t, 40.16) : 0.0001})` }}><Big size={90} color={RED}>2025</Big><Big size={150}>92 MIN</Big></div>
        </div>
      </Pop>
      <Captions c={P.captions} hide={t >= T.b4 && t < T.b5} />
      <Audio src={staticFile(P.audio)} />
      </> : null}
    </AbsoluteFill>
  );
};
