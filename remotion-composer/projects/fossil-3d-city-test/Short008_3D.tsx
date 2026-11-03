// Fossil Short 008 bản 3D (2026-10-29): cùng lời, phụ đề, field note, end card của r04, nhưng hình là
// cảnh 3D tự dựng (đồng cỏ savanna, nắng chiều thấp) thay cho ảnh Commons / clip Flow.
// Mỗi beat = một shot: camera + các con vật (vị trí, hướng, kiểu chuyển động). Một ThreeCanvas cho cả video.
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Creature, CreatureData, poseCreature, useCreature } from "./Creature3D";
import { C, CAPTION_Y, CLAMP, Captions, EndCardView, FieldNote, Grain, HookHeadline, Ammonite, PANEL, mono } from "./short008Overlays";
import type { SceneProps } from "./short008Overlays";
import { GActor, GAsset, QActor, QAsset, QLook, useFBX, useGLB } from "./QModel";

// raptor = model Quaternius (CC0), phóng to + đổi màu cho Deinonychus / Utahraptor
const Q_LOOK: Record<string, QLook> = {
  velociraptor: { length: 2.0, colors: { Brown: "#8A5A36", LightBrown: "#CFAE84", Black: "#1C1712" } },
  deinonychus: { length: 3.4, colors: { Brown: "#4E4A43", LightBrown: "#BDB29E", Black: "#1C1712" } },
  utahraptor: { length: 6.0, colors: { Brown: "#6E5643", LightBrown: "#DCCDB6", Black: "#1C1712" } },
};

type V3 = [number, number, number];
type Actor = { id: string; anim: string; pos: V3; rotY: number; vel?: [number, number] };
type Shot = { cam: V3; look: V3; actors: Actor[]; tOff?: number; bar?: boolean; sun?: V3 };

const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
const LION_FLIP = true;
const FACE_PX = Math.PI; // đầu hướng +X
const FACE_MX = 0; // đầu hướng -X

// t = giây trong beat, d = độ dài beat
function shot(beat: number, t: number, d: number): Shot {
  const k = ease(t / d);
  switch (beat) {
    case 1: {
      // nhìn qua vai con raptor nhỏ về phía con sư tử; cắt cận sư tử ở punch (frame 81)
      const actors: Actor[] = [
        { id: "velociraptor", anim: "velociraptor_idle", pos: [-0.9, 0, 0.25], rotY: FACE_PX - 0.15 },
        { id: "lion", anim: "lion_idle", pos: [2.3, 0, -0.1], rotY: FACE_MX + 0.1 },
      ];
      if (t < 81 / 30) return { cam: lerp3([-2.9, 0.55, 1.55], [-2.6, 0.55, 1.4], t / 2.7), look: [1.4, 0.85, 0], actors, tOff: 0 };
      return { cam: lerp3([-0.2, 0.75, 1.95], [0.05, 0.75, 1.8], (t - 2.7) / (d - 2.7)), look: [1.9, 0.95, -0.05], actors, tOff: 0 };
    }
    case 2:
      // toàn thân, thước 2 m dưới chân: phần đuôi tô màu ochre
      return { cam: lerp3([-3.0, 1.8, 3.6], [-2.7, 1.7, 3.9], k), look: [0.2, 0.35, 0], actors: [{ id: "velociraptor", anim: "velociraptor_idle", pos: [0, 0, 0], rotY: FACE_MX }], bar: true, tOff: 1 };
    case 3:
      // cận đầu + cánh lông
      return { cam: lerp3([-1.9, 0.95, 1.5], [-1.6, 0.9, 1.3], k), look: [-0.35, 0.6, 0], actors: [{ id: "velociraptor", anim: "velociraptor_idle", pos: [0, 0, 0], rotY: FACE_MX - 0.35 }], tOff: 1.5 };
    case 4: {
      // sư tử đứng giữa, kéo ra thấy 10 con raptor đứng sau
      const raptors: Actor[] = [];
      for (let i = 0; i < 10; i++) {
        const row = i % 2, j = Math.floor(i / 2);
        raptors.push({ id: "velociraptor", anim: "velociraptor_idle", pos: [-1.1 - row * 0.9 - j * 0.25, 0, 0.9 - j * 1.1 - row * 0.5], rotY: Math.PI * 0.8 });
      }
      return {
        cam: lerp3([1.2, 1.15, 3.2], [2.2, 1.9, 7.4], ease((t - 1.0) / (d - 1.6))),
        look: lerp3([0.3, 0.9, 0], [-0.8, 0.6, -1.4], ease((t - 1.0) / (d - 1.6))),
        actors: [{ id: "lion", anim: "lion_idle", pos: [0.6, 0, 0.3], rotY: FACE_MX - 0.45 }, ...raptors],
        tOff: 5,
      };
    }
    case 5:
      // Velociraptor cạnh Deinonychus đi tới
      return {
        cam: lerp3([-3.6, 1.1, 4.8], [-4.2, 1.3, 6.0], k), look: [0.2, 0.65, -0.2],
        actors: [
          { id: "velociraptor", anim: "velociraptor_idle", pos: [-1.0, 0, 1.0], rotY: FACE_PX - 0.6 },
          { id: "deinonychus", anim: "deinonychus", pos: [1.6, 0, -1.2], rotY: FACE_MX - 0.55, vel: [-0.62 * 0.85, 0.62 * 0.52] },
        ],
        tOff: 2,
      };
    case 6:
      // Utahraptor đi chéo về phía camera, sư tử đứng cạnh để so cỡ
      return {
        cam: lerp3([3.6, 1.4, 8.2], [3.2, 1.5, 9.0], k), look: [0, 1.3, -0.5],
        actors: [
          { id: "utahraptor", anim: "utahraptor", pos: [-2.6, 0, -4.2], rotY: Math.PI - 0.93, vel: [1.23 * 0.6, 1.23 * 0.8] },
          { id: "lion", anim: "lion_idle", pos: [2.6, 0, 1.4], rotY: FACE_MX + 0.35 },
        ],
        tOff: 0,
      };
    case 7:
      // cận móng liềm
      return { cam: lerp3([-2.5, 0.6, 3.1], [-2.1, 0.5, 2.6], k), look: [-0.1, 0.4, 0.3], actors: [{ id: "utahraptor", anim: "utahraptor_idle", pos: [0, 0, 0], rotY: FACE_MX }], tOff: 0.5 };
    default: {
      // đối đầu: Utahraptor gầm, sư tử nhe nanh; camera vòng chậm
      const a = -0.95 + 0.25 * k;
      const R = 11;
      return {
        cam: [0.8 + Math.sin(a) * R, 1.7, -0.3 + Math.cos(a) * R], look: [0.8, 1.0, -0.3],
        actors: [
          { id: "utahraptor", anim: "utahraptor_idle", pos: [-1.4, 0, 0.1], rotY: FACE_PX },
          { id: "lion", anim: "lion_idle", pos: [3.4, 0, -1.3], rotY: FACE_MX - 0.25 },
        ],
        tOff: 1.2,
      };
    }
  }
}

// ------------------------------------------------------------------ savanna
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function vnoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
const fbm2 = (x: number, y: number) => 0.5 * vnoise(x, y) + 0.25 * vnoise(x * 2.1, y * 2.1) + 0.125 * vnoise(x * 4.3, y * 4.3) + 0.0625 * vnoise(x * 8.7, y * 8.7);

export const Savanna: React.FC = () => {
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 320, 320);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const dry = new THREE.Color("#C9A764"), straw = new THREE.Color("#DDBF7E"), dirt = new THREE.Color("#9C7A4C"), green = new THREE.Color("#8C8A4E");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      // mặt đất phẳng quanh chỗ diễn, gợn nhẹ ra xa
      pos.setY(i, Math.max(0, r - 14) * 0.012 * (fbm2(x * 0.03, z * 0.03) - 0.35) * 6);
      const n = fbm2(x * 0.35, z * 0.35), m = fbm2(x * 0.08 + 7, z * 0.08);
      c.copy(dry).lerp(straw, n).lerp(dirt, THREE.MathUtils.smoothstep(m, 0.55, 0.75) * 0.7).lerp(green, THREE.MathUtils.smoothstep(n, 0.62, 0.8) * 0.4);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  // cỏ khô: mỗi bụi 3 lá mỏng
  const grass = useMemo(() => {
    const blade = new THREE.ConeGeometry(0.006, 1, 3, 1);
    blade.translate(0, 0.5, 0);
    const N = 26000;
    const mesh = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: "#D2B06A", roughness: 0.9 }), N);
    const r = rng(7);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const rad = 1.5 + Math.pow(r(), 1.6) * 40, a = r() * Math.PI * 2;
      p.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      e.set((r() - 0.5) * 0.6, r() * 6.3, (r() - 0.5) * 0.6);
      q.setFromEuler(e);
      const h = 0.08 + r() * r() * 0.3;
      s.set(1 + 0.6 * r(), h, 1 + 0.6 * r());
      mesh.setMatrixAt(i, m.compose(p, q, s));
      mesh.setColorAt(i, col.set("#D9BC7A").lerp(new THREE.Color("#9E8448"), r() * 0.6));
    }
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }, []);

  const trees = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 14 }, () => {
      const a = r() * Math.PI * 2, d = 28 + r() * 70;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, h: 3.5 + r() * 3, w: 3 + r() * 3.5 };
    });
  }, []);

  const sky = useMemo(() => {
    const g = new THREE.SphereGeometry(300, 32, 16);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const top = new THREE.Color("#7FA3C6"), hor = new THREE.Color("#F2D3A2"), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 300;
      c.copy(hor).lerp(top, THREE.MathUtils.smoothstep(y, 0.0, 0.45));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  return (
    <>
      <mesh geometry={sky}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
      </mesh>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      <primitive object={grass} />
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.2, t.h, 6]} />
            <meshStandardMaterial color="#4A3A2A" roughness={1} />
          </mesh>
          <mesh position={[0, t.h, 0]} scale={[t.w, 0.55, t.w * 0.8]} castShadow>
            <sphereGeometry args={[1, 16, 8]} />
            <meshStandardMaterial color="#5F6B3A" roughness={1} />
          </mesh>
        </group>
      ))}
      {/* đồi xa */}
      {[[-120, -160, 70, 14], [60, -190, 90, 18], [180, -80, 60, 11], [-200, 40, 80, 12], [100, 170, 90, 15]].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, -2, z]} scale={[w, h, w * 0.6]}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color="#B5A27E" roughness={1} />
        </mesh>
      ))}
    </>
  );
};

// thước đo 2 m: phần thân màu xương, phần đuôi màu ochre (mép trước mõm -> chóp quạt đuôi)
const MeasureBar: React.FC<{ x0: number; x1: number; split: number; z: number; grow: number }> = ({ x0, x1, split, z, grow }) => {
  const xe = x0 + (x1 - x0) * grow;
  const seg = (a: number, b: number, color: string) =>
    b > a ? (
      <mesh position={[(a + b) / 2, 0.012, z]}>
        <boxGeometry args={[b - a, 0.012, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    ) : null;
  return (
    <>
      {seg(x0, Math.min(xe, split), "#EFE6D2")}
      {seg(split, xe, "#C08A3E")}
      {[x0, x1].map((x, i) => (grow >= i ? (
        <mesh key={i} position={[x, 0.06, z]}>
          <boxGeometry args={[0.014, 0.12, 0.05]} />
          <meshStandardMaterial color="#EFE6D2" />
        </mesh>
      ) : null))}
    </>
  );
};

export const Cam: React.FC<{ pos: V3; look: V3 }> = ({ pos, look }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...look));
  camera.updateMatrixWorld();
  return null;
};

const World: React.FC<{ beat: number; t: number; d: number; models: Record<string, CreatureData>; raptor: QAsset; lionG: GAsset }> = ({ beat, t, d, models, raptor, lionG }) => {
  const s = shot(beat, t, d);
  // mỗi loài một tư thế / frame (các bản sao cùng loài dùng chung hình học)
  const posed = new Set<string>();
  for (const a of s.actors) {
    if (posed.has(a.id) || Q_LOOK[a.id] || a.id === "lion") continue;
    posed.add(a.id);
    poseCreature(models[a.id], t + (s.tOff ?? 0), a.anim);
  }
  const center = s.look;
  const sun: V3 = [center[0] - 9, 7, center[2] + 6];
  const vr = models.velociraptor.bbox;
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...center);
  return (
    <>
      <primitive object={tgt} />
      <Cam pos={s.cam} look={s.look} />
      <fog attach="fog" args={["#E6CFA6", 30, 220]} />
      <hemisphereLight args={["#CFE0F0", "#8A6A3A", 1.0]} />
      <directionalLight
        position={sun}
        target={tgt}
        intensity={3.6}
        color="#FFD9A6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[center[0] + 8, 4, center[2] - 8]} intensity={0.8} color="#B9CCE4" />
      <Savanna />
      {s.bar && <MeasureBar x0={-1.0} x1={1.0} split={0.0} z={0.32} grow={Math.min(1, t / 1.2)} />}
      {s.actors.map((a, i) => {
        const p: V3 = a.vel ? [a.pos[0] + a.vel[0] * t, a.pos[1], a.pos[2] + a.vel[1] * t] : a.pos;
        return (
          <group key={i} position={p} rotation={[0, a.rotY, 0]}>
            {Q_LOOK[a.id] ? (
              <QActor asset={raptor} look={Q_LOOK[a.id]} clip={a.anim.endsWith("_idle") ? "Idle" : "Walk"} t={t + (s.tOff ?? 0) + i * 0.37} />
            ) : a.id === "lion" ? (
              <GActor asset={lionG} length={2.9} flip={LION_FLIP} />
            ) : (
              <Creature data={models[a.id]} />
            )}
          </group>
        );
      })}
    </>
  );
};

export const Short008_3D: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const ms = { velociraptor: useCreature("velociraptor"), lion: useCreature("lion") };
  const raptor = useFBX("models/velociraptor_q.fbx");
  const lionG = useGLB("models/lion_trellis.glb");
  const ready = Object.values(ms).every(Boolean) && !!raptor && !!lionG;
  const idx = Math.max(0, p.scenes.findIndex((s, i) => f >= s.startFrame && (i === p.scenes.length - 1 || f < p.scenes[i + 1].startFrame)));
  const sc = p.scenes[idx];
  const t = (f - sc.startFrame) / fps;
  const d = sc.durationFrames / fps;
  const markIn = interpolate(f, [p.scenes[1].startFrame, p.scenes[1].startFrame + 20], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      {ready && (
        <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, near: 0.05, far: 800 }} gl={{ antialias: true }}>
          <World beat={sc.beat} t={t} d={d} models={ms as Record<string, CreatureData>} raptor={raptor!} lionG={lionG!} />
        </ThreeCanvas>
      )}
      {/* grade: ochre/teal như bản ảnh, tối nhẹ dải phụ đề */}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.28, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(8,12,13,0.45) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.35) 0%, rgba(10,14,15,0) 18%, rgba(10,14,15,0) 55%, rgba(10,14,15,0.5) 63%, rgba(10,14,15,0.6) 76%, rgba(10,14,15,0.25) 90%, rgba(10,14,15,0) 100%)" }} />
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 52, fontFamily: mono, fontWeight: 500, fontSize: 21, letterSpacing: 5, color: C.bone, opacity: 0.8, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        3D RECONSTRUCTION
      </div>
      {p.notes.map((n, i) => (
        <Sequence key={i} from={n.startFrame} durationInFrames={n.durationFrames}>
          <FieldNote n={n} />
        </Sequence>
      ))}
      <Sequence from={p.endCard.startFrame} durationInFrames={p.endCard.durationFrames}>
        <EndCardView c={p.endCard} />
      </Sequence>
      {p.hookText ? (
        <Sequence from={0} durationInFrames={p.scenes[1].startFrame}>
          <HookHeadline text={p.hookText} dur={p.scenes[1].startFrame} />
        </Sequence>
      ) : null}
      <Captions groups={p.karaoke} fps={p.fps} />
      <div style={{ position: "absolute", right: 48, top: PANEL.top - 64, display: "flex", alignItems: "center", gap: 12, opacity: markIn }}>
        <Ammonite size={36} />
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 6, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>FOSSIL MYSTERIES</div>
      </div>
      <Grain srcs={p.grain} />
    </AbsoluteFill>
  );
};
void CAPTION_Y;
