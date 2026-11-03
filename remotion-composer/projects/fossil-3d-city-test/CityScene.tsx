// Fossil Mysteries — thử cảnh 3D "megalodon bơi giữa phố" (Size pillar).
// Phỏng theo file mô phỏng đô thị Three.js, nhưng: mọi thứ chạy theo frame (không đồng hồ thật),
// random có seed, camera đi theo keyframe, palette Fossil. Đơn vị = mét.
import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { Megalodon, BODY_HALF_H, SHARK_TOP } from "./Megalodon3D";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const serif = loadSerif("normal", { weights: ["600"], subsets: ["latin"] }).fontFamily;
const mono = loadMono("normal", { weights: ["500", "600"], subsets: ["latin"] });

// Palette lấy từ fossil_pipeline/template
const C = {
  ink: "#111819",
  slate: "#1E2A2C",
  teal: "#2C4A4A",
  tealGrey: "#3B4A4B",
  ochre: "#C08A3E",
  ochreLight: "#E4B56C",
  sand: "#CDB98F",
  cream: "#EFE6D2",
  umber: "#5B4631",
  dust: "#7A6A4F",
  moss: "#6E7B4F",
  fog: "#D8C8A2",
};

const SHARK_LEN = 18; // m, mức ước tính trên phổ biến (mõm -> chóp đuôi)
const SHARK_BAR_Y = SHARK_TOP + 0.5;
const BUS_LEN = 12;

// ---------- random có seed ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- texture cửa sổ (1 ô = 1 tầng x 1 gian) ----------
function windowTexture(wall: string, glass: string, lit: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = wall;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = glass;
  g.fillRect(12, 14, 40, 34);
  g.fillStyle = lit;
  g.globalAlpha = 0.35;
  g.fillRect(12, 14, 40, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  return t;
}


// ---------- bố cục thành phố ----------
const BLOCK = 46; // lô đất
const ROAD = 14; // lòng đường
const PITCH = BLOCK + ROAD;
const GRID = 4; // -4..4

type Building = { x: number; z: number; w: number; d: number; h: number; style: number };
type Tree = { x: number; z: number; s: number };

const isPlaza = (gx: number, gz: number) => gz === 0 && gx >= -1 && gx <= 2;

function buildCity() {
  const rnd = mulberry32(20261029);
  const buildings: Building[] = [];
  const trees: Tree[] = [];
  for (let gx = -GRID; gx <= GRID; gx++) {
    for (let gz = -GRID; gz <= GRID; gz++) {
      // tâm lô: đường chính chạy dọc trục X tại z = 0, nên lô lệch nửa nhịp theo Z
      const cx = gx * PITCH;
      const cz = (gz + 0.5) * PITCH;
      const dist = Math.hypot(gx, gz + 0.5);
      if (isPlaza(gx, gz)) {
        // quảng trường đối diện cá: chỗ trống cho camera, cây chỉ ở mép xa
        for (let i = 0; i < 6; i++) {
          trees.push({ x: cx + (rnd() - 0.5) * 40, z: cz + 12 + rnd() * 9, s: 0.8 + rnd() * 0.5 });
        }
        continue;
      }
      if (gx === -3 && gz === -2) {
        // công viên
        for (let i = 0; i < 14; i++) {
          trees.push({ x: cx + (rnd() - 0.5) * 36, z: cz + (rnd() - 0.5) * 36, s: 0.8 + rnd() * 0.6 });
        }
        continue;
      }
      // chia lô thành 2x2 hoặc 3x2 toà nhà
      const nx = rnd() < 0.5 ? 2 : 3;
      const nz = 2;
      const cellW = (BLOCK - 4) / nx;
      const cellD = (BLOCK - 4) / nz;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const w = cellW - 2 - rnd() * 3;
          const d = cellD - 2 - rnd() * 3;
          const base = dist < 1.5 ? 10 : dist < 3 ? 16 : 22;
          const h = base + rnd() * (dist < 1.5 ? 16 : 40) + (rnd() < 0.08 ? 40 : 0);
          buildings.push({
            x: cx - BLOCK / 2 + 2 + cellW * (i + 0.5),
            z: cz - BLOCK / 2 + 2 + cellD * (j + 0.5),
            w,
            d,
            h,
            style: Math.floor(rnd() * 4),
          });
        }
      }
      // cây dọc vỉa hè đường chính
      if (gz === -1) {
        const edgeZ = gz === 0 ? cz - BLOCK / 2 + 1.2 : cz + BLOCK / 2 - 1.2;
        for (let k = -2; k <= 2; k++) trees.push({ x: cx + k * 9 + 2, z: edgeZ, s: 0.9 + rnd() * 0.3 });
      }
    }
  }
  return { buildings, trees };
}

// ---------- camera theo keyframe ----------
const CAM_POS = [
  new THREE.Vector3(-13, 1.7, 9.5), // người đi bộ ở mép quảng trường, ngước nhìn đầu cá
  new THREE.Vector3(-10, 2.4, 14),
  new THREE.Vector3(-4, 4.5, 25), // lùi lại: cá + xe buýt cùng khung
  new THREE.Vector3(2, 8, 33),
  new THREE.Vector3(5, 12, 40), // cao hơn: cá + xe buýt giữa dãy phố
];
const CAM_LOOK = [
  new THREE.Vector3(-6, 4.6, -3),
  new THREE.Vector3(-5, 4.4, -2),
  new THREE.Vector3(-1, 4, -1),
  new THREE.Vector3(0, 6, -2),
  new THREE.Vector3(0, 8.5, -4), // nhìn cao hơn để cá + xe nằm ở nửa trên, chừa chỗ cho phụ đề
];
const camPosCurve = new THREE.CatmullRomCurve3(CAM_POS, false, "centripetal");
const camLookCurve = new THREE.CatmullRomCurve3(CAM_LOOK, false, "centripetal");

const FOV = 52;

function placeCamera(camera: THREE.Camera, t: number) {
  camera.position.copy(camPosCurve.getPoint(t));
  camera.lookAt(camLookCurve.getPoint(t));
  camera.updateMatrixWorld();
}

const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const camera = useThree((s) => s.camera);
  placeCamera(camera, t);
  return null;
};

// cá lướt chậm sang trái, nhấp nhô nhẹ
const SHARK_Z = -3.2;
function sharkPose(frame: number) {
  return {
    x: interpolate(frame, [0, 300], [3, -3]),
    y: 2.2 + BODY_HALF_H + Math.sin(frame / 22) * 0.18,
    tilt: Math.sin(frame / 22 + 0.8) * 0.012,
  };
}
const BUS_POS = new THREE.Vector3(2, 0, 3.6);

// Chiếu một điểm 3D ra toạ độ pixel (để đặt nhãn HTML sắc nét thay vì texture chữ trong 3D)
function project(p: THREE.Vector3, t: number, w: number, h: number) {
  const cam = new THREE.PerspectiveCamera(FOV, w / h, 0.3, 1500);
  placeCamera(cam, t);
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, behind: v.z > 1 };
}

// ---------- mô hình ----------
const Tree3D: React.FC<Tree> = ({ x, z, s }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 1.2, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.26, 2.4, 6]} />
      <meshLambertMaterial color={C.umber} />
    </mesh>
    <mesh position={[0, 3.6, 0]} castShadow>
      <icosahedronGeometry args={[1.9, 0]} />
      <meshLambertMaterial color={C.moss} flatShading />
    </mesh>
  </group>
);

const Bus: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
      <boxGeometry args={[BUS_LEN, 2.9, 2.55]} />
      <meshStandardMaterial color={C.ochre} roughness={0.55} />
    </mesh>
    {/* dải kính */}
    <mesh position={[0.3, 2.35, 1.285]}>
      <planeGeometry args={[BUS_LEN - 1.4, 1.0]} />
      <meshStandardMaterial color={C.slate} roughness={0.2} metalness={0.3} />
    </mesh>
    <mesh position={[0.3, 2.35, -1.285]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[BUS_LEN - 1.4, 1.0]} />
      <meshStandardMaterial color={C.slate} roughness={0.2} metalness={0.3} />
    </mesh>
    <mesh position={[-BUS_LEN / 2 - 0.01, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[2.3, 1.4]} />
      <meshStandardMaterial color={C.slate} roughness={0.2} metalness={0.3} />
    </mesh>
    {[-4, 3.6].map((wx) =>
      [-1.3, 1.3].map((wz) => (
        <mesh key={`${wx}${wz}`} position={[wx, 0.5, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 14]} />
          <meshLambertMaterial color={C.ink} />
        </mesh>
      )),
    )}
  </group>
);

const Car: React.FC<{ x: number; z: number; rot: number; color: string }> = ({ x, z, rot, color }) => (
  <group position={[x, 0, z]} rotation={[0, rot, 0]}>
    <mesh position={[0, 0.65, 0]} castShadow>
      <boxGeometry args={[4.4, 0.8, 1.8]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh position={[-0.2, 1.3, 0]} castShadow>
      <boxGeometry args={[2.3, 0.6, 1.6]} />
      <meshStandardMaterial color={C.slate} roughness={0.25} />
    </mesh>
  </group>
);

const Person: React.FC<{ x: number; z: number; color: string; phase: number; frame: number }> = ({
  x,
  z,
  color,
  phase,
  frame,
}) => {
  const bob = Math.sin(frame / 9 + phase) * 0.015;
  return (
    <group position={[x, bob, z]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.9, 6]} />
        <meshLambertMaterial color={C.slate} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.62, 8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.64, 0]} castShadow>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshLambertMaterial color={C.sand} />
      </mesh>
    </group>
  );
};

// Thước đo (vạch + 2 đầu) đặt trên đầu một vật
const MeasureBar: React.FC<{ len: number; y: number; opacity: number }> = ({ len, y, opacity }) => (
  <group position={[0, y, 0]}>
    <mesh>
      <boxGeometry args={[len, 0.12, 0.12]} />
      <meshBasicMaterial color={C.ochreLight} transparent opacity={opacity} />
    </mesh>
    {[-len / 2, len / 2].map((x) => (
      <mesh key={x} position={[x, -0.35, 0]}>
        <boxGeometry args={[0.12, 0.8, 0.12]} />
        <meshBasicMaterial color={C.ochreLight} transparent opacity={opacity} />
      </mesh>
    ))}
  </group>
);


// ---------- cảnh ----------
const World: React.FC<{
  frame: number;
  t: number;
  labelsIn: number;
}> = ({ frame, t, labelsIn }) => {
  const city = useMemo(buildCity, []);
  const wallTex = useMemo(
    () => [
      windowTexture(C.sand, C.tealGrey, C.cream),
      windowTexture(C.cream, C.teal, C.cream),
      windowTexture(C.dust, C.slate, C.ochreLight),
      windowTexture(C.tealGrey, C.ink, C.ochreLight),
    ],
    [],
  );
  const buildingMats = useMemo(
    () =>
      city.buildings.map((b) => {
        const tex = wallTex[b.style].clone();
        tex.needsUpdate = true;
        tex.repeat.set(Math.max(1, Math.round(Math.max(b.w, b.d) / 4)), Math.max(1, Math.round(b.h / 3.4)));
        return new THREE.MeshLambertMaterial({ map: tex });
      }),
    [city, wallTex],
  );

  const { x: sharkX, y: sharkY, tilt: sharkTilt } = sharkPose(frame);

  const cars = useMemo(() => {
    const rnd = mulberry32(7);
    const cols = [C.cream, C.teal, C.umber, C.sand, C.dust];
    return Array.from({ length: 14 }, (_, i) => ({
      road: (i % 7) - 3, // đường ngang (dọc Z) số mấy
      off: rnd() * PITCH * 6,
      speed: 6 + rnd() * 5,
      dir: rnd() < 0.5 ? 1 : -1,
      color: cols[i % cols.length],
    }));
  }, []);

  const people = useMemo(() => {
    const rnd = mulberry32(99);
    const cols = [C.ochre, C.teal, C.cream, C.umber, C.moss];
    return Array.from({ length: 16 }, (_, i) => ({
      // phía quảng trường chỉ đứng bên phải, tránh đường bay của camera
      x: i % 2 ? 2 + rnd() * 24 : -26 + rnd() * 52,
      z: i % 2 ? 8.4 + rnd() * 1.6 : -8.4 - rnd() * 1.6,
      color: cols[i % cols.length],
      phase: rnd() * 6,
    }));
  }, []);

  const span = PITCH * (GRID * 2 + 2);
  return (
    <>
      <CameraRig t={t} />
      <fog attach="fog" args={[C.fog, 60, 420]} />
      <hemisphereLight args={[C.cream, C.tealGrey, 0.9]} />
      <directionalLight
        position={[-60, 70, 45]}
        intensity={2.2}
        color="#FFE0AE"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-near={10}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
      />

      {/* nền: cỏ ngoài cùng, mặt đường, vỉa hè từng lô */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[span * 3, span * 3]} />
        <meshLambertMaterial color={C.moss} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[span, span]} />
        <meshLambertMaterial color="#3A4140" />
      </mesh>
      {Array.from({ length: (GRID * 2 + 1) ** 2 }, (_, k) => {
        const gx = (k % (GRID * 2 + 1)) - GRID;
        const gz = Math.floor(k / (GRID * 2 + 1)) - GRID;
        const park = isPlaza(gx, gz) || (gx === -3 && gz === -2);
        return (
          <mesh key={k} position={[gx * PITCH, 0.15, (gz + 0.5) * PITCH]} receiveShadow>
            <boxGeometry args={[BLOCK, 0.3, BLOCK]} />
            <meshLambertMaterial color={isPlaza(gx, gz) ? "#B3A88C" : park ? C.moss : "#9C9480"} />
          </mesh>
        );
      })}
      {/* vạch giữa đường chính */}
      {Array.from({ length: 60 }, (_, i) => (
        <mesh key={`d${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-270 + i * 9, 0.02, 0]}>
          <planeGeometry args={[4, 0.2]} />
          <meshBasicMaterial color={C.ochreLight} />
        </mesh>
      ))}
      {/* vạch qua đường ở hai ngã tư gần nhất */}
      {[-PITCH / 2, PITCH / 2].flatMap((ix) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`z${ix}${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[ix + (ix < 0 ? 8 : -8), 0.02, -6 + i * 2]}>
            <planeGeometry args={[3, 0.9]} />
            <meshBasicMaterial color={C.cream} />
          </mesh>
        )),
      )}

      {city.buildings.map((b, i) => (
        <group key={i} position={[b.x, 0.3, b.z]}>
          <mesh position={[0, b.h / 2, 0]} material={buildingMats[i]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
          <mesh position={[0, b.h + 0.5, 0]} castShadow>
            <boxGeometry args={[b.w * 0.8, 1, b.d * 0.8]} />
            <meshLambertMaterial color={C.slate} />
          </mesh>
        </group>
      ))}
      {city.trees.map((tr, i) => (
        <Tree3D key={`t${i}`} {...tr} />
      ))}

      {/* xe chạy trên các đường ngang (dọc trục Z), xe đỗ ở đường chính */}
      {cars.map((c, i) => {
        const roadX = c.road * PITCH + PITCH / 2;
        const travel = PITCH * 8;
        const z = ((((c.off + (c.speed * frame) / 30) % travel) + travel) % travel) - travel / 2;
        return (
          <Car key={`c${i}`} x={roadX + c.dir * 3.5} z={c.dir * z} rot={c.dir > 0 ? -Math.PI / 2 : Math.PI / 2} color={c.color} />
        );
      })}
      <Car x={-24} z={5} rot={0} color={C.cream} />
      <Car x={20} z={5} rot={0} color={C.teal} />
      {people.map((p, i) => (
        <Person key={`p${i}`} {...p} frame={frame} />
      ))}

      {/* xe buýt đứng ở làn gần, cá ở làn xa */}
      <group position={BUS_POS.toArray()}>
        <Bus x={0} z={0} />
        <group position={[0, 0, 1.4]}>
          <MeasureBar len={BUS_LEN} y={3.9} opacity={labelsIn} />
        </group>
      </group>

      <group position={[sharkX, sharkY, SHARK_Z]} rotation={[0, 0, sharkTilt]}>
        <Megalodon frame={frame} />
        <MeasureBar len={SHARK_LEN} y={SHARK_BAR_Y} opacity={labelsIn} />
      </group>
    </>
  );
};

// Nhãn kích thước, neo đáy-giữa vào điểm chiếu từ 3D (ngay trên thước đo)
const SizeTag: React.FC<{
  x: number;
  y: number;
  behind: boolean;
  big: string;
  small: string;
  opacity: number;
  scale: number;
}> = ({ x, y, behind, big, small, opacity, scale }) =>
  behind ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, calc(-100% - 18px)) scale(${scale * (0.9 + 0.1 * opacity)})`,
        transformOrigin: "50% 100%",
        opacity,
        background: "rgba(17,24,25,0.86)",
        border: `3px solid ${C.ochreLight}`,
        borderRadius: 18,
        padding: "10px 26px 12px",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontFamily: mono.fontFamily, fontWeight: 600, fontSize: 64, color: C.ochreLight, lineHeight: 1 }}>{big}</div>
      <div style={{ fontFamily: mono.fontFamily, fontWeight: 500, fontSize: 26, color: C.cream, letterSpacing: 3, marginTop: 6 }}>
        {small}
      </div>
    </div>
  );

export const CityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const [fontReady, setFontReady] = useState(false);
  const [handle] = useState(() => delayRender("font"));

  useEffect(() => {
    mono.waitUntilDone().then(() => setFontReady(true));
  }, [handle]);

  // Nhả delayRender SAU khi ThreeCanvas đã mount (effect của con chạy trước cha, nên lúc này
  // ThreeCanvas đã giữ delayRender riêng "chờ R3F vẽ frame") — tránh chụp khung trống.
  useEffect(() => {
    if (fontReady) continueRender(handle);
  }, [fontReady, handle]);

  // camera: chậm ở đầu (nhìn từ vỉa hè), kéo lên mượt, chậm lại ở toàn cảnh
  const t = interpolate(frame, [0, 40, durationInFrames - 1], [0, 0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: "clamp",
  });
  // tiêu đề vào rồi nhường chỗ cho nhãn kích thước
  const head = interpolate(frame, [10, 34, 104, 124], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelsIn = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = sharkPose(frame);
  const sharkTag = project(new THREE.Vector3(sp.x, sp.y + SHARK_BAR_Y, SHARK_Z), t, width, height);
  const busTag = project(BUS_POS.clone().add(new THREE.Vector3(0, 3.9, 1.4)), t, width, height);
  const vignette = "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(17,24,25,0.55) 100%)";

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #7F9A97 0%, #B8BFA6 38%, ${C.fog} 62%)` }}>
      {fontReady ? (
        <ThreeCanvas
          width={width}
          height={height}
          shadows
          camera={{ fov: FOV, near: 0.3, far: 1500 }}
          gl={{ antialias: true, alpha: true }}
        >
          <World frame={frame} t={t} labelsIn={labelsIn} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ background: vignette, pointerEvents: "none" }} />
      <SizeTag {...sharkTag} big="~18 m" small="MEGALODON · 60 FT" opacity={labelsIn} scale={1} />
      <SizeTag {...busTag} big="12 m" small="CITY BUS · 40 FT" opacity={labelsIn} scale={0.78} />
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        <div style={{ fontFamily: mono.fontFamily, fontSize: 30, letterSpacing: 6, color: C.ochreLight }}>
          FOSSIL MYSTERIES · SIZE CHECK
        </div>
        <div
          style={{
            fontFamily: serif,
            fontSize: 84,
            lineHeight: 1.02,
            color: C.cream,
            marginTop: 14,
            textShadow: "0 4px 24px rgba(17,24,25,0.7)",
          }}
        >
          If Megalodon swam down your street
        </div>
      </div>
    </AbsoluteFill>
  );
};
