import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadSans } from "@remotion/google-fonts/SourceSans3";

// Fossil Mysteries, vertical Short (1080x1920). Same museum-archive brand as the long-form
// composition (palette, fonts, grade, grain, catalogue tags, field notes), laid out for Shorts:
// a specimen plate in the upper half on a blurred copy of itself, karaoke captions under it,
// everything kept out of the Shorts UI zones (top ~220 px, bottom from ~1500 px, right column).

export const serif = loadSerif("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
export const sans = loadSans("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;

export const C = {
  deep: "#111819",
  bone: "#EFE6D2",
  ochre: "#C08A3E",
  ochreLight: "#E4B56C",
  teal: "#2C4A4A",
  ink: "#1B2526",
};
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.inOut(Easing.sin);

export const PANEL = { top: 290, height: 880 };
export const CAPTION_Y = 1245;

export interface SceneSpec {
  beat: number;
  startFrame: number;
  durationFrames: number;
  src: string;
  tag: string;
  real?: boolean;
  credit?: string | null;
  fit?: "cover" | "contain";
  focus?: [number, number];
  move?: "push" | "pull" | "drift-left" | "drift-right" | "none";
  playbackRate?: number;
  // r02 anti-hook (2026-10-25): the hook beat fills the whole 9:16 frame instead of sitting in the plate,
  // with a hard punch-in cut at `punchAt` frames so the first shot changes by ~3 s
  full?: boolean;
  punchAt?: number;
}
export interface Word { text: string; startMs: number; endMs: number }
export interface Group { startMs: number; endMs: number; words: Word[] }
export interface Note { startFrame: number; durationFrames: number; big: string; small: string }
export interface EndCard { startFrame: number; durationFrames: number; label: string; name: string }
export interface SceneProps {
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  overlap: number;
  scenes: SceneSpec[];
  notes: Note[];
  endCard: EndCard;
  karaoke: Group[];
  narrationSrc: string;
  musicSrc: string;
  musicVolume: number;
  grain: string[];
  hookText?: string;
}

// ------------------------------------------------------------------ brand mark
const TURNS = 3.1;
const A_R = 1.6;
const B_R = Math.log(46 / A_R) / (TURNS * 2 * Math.PI);
const AMMONITE_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 220; i++) {
    const t = (i / 220) * TURNS * 2 * Math.PI;
    const r = A_R * Math.exp(B_R * t);
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return "M" + pts.join(" L");
})();
export const Ammonite: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <path d={AMMONITE_PATH} fill="none" stroke={C.ochre} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

export const Grain: React.FC<{ srcs: string[] }> = ({ srcs }) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 2) % srcs.length;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.11 }}>
      {srcs.map((s, i) => (
        <Img key={s} src={staticFile(s)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === k ? 1 : 0 }} />
      ))}
    </AbsoluteFill>
  );
};

const camera = (s: SceneSpec, f: number, len: number): React.CSSProperties => {
  const p = interpolate(f, [0, len], [0, 1], { ...CLAMP, easing: EASE_IO });
  const [fx, fy] = s.focus ?? [0.5, 0.5];
  let scale = 1;
  let tx = 0;
  switch (s.move) {
    case "push": scale = 1.02 + 0.08 * p; break;
    case "pull": scale = 1.1 - 0.07 * p; break;
    case "drift-left": scale = 1.07; tx = 30 - 60 * p; break;
    case "drift-right": scale = 1.07; tx = -30 + 60 * p; break;
    default: break;
  }
  return { transform: `translateX(${tx.toFixed(2)}px) scale(${scale.toFixed(4)})`, transformOrigin: `${fx * 100}% ${fy * 100}%` };
};

// ------------------------------------------------------------------ one beat
const Media: React.FC<{ s: SceneSpec; style: React.CSSProperties }> = ({ s, style }) =>
  s.src.endsWith(".mp4") ? (
    <OffthreadVideo src={staticFile(s.src)} muted playbackRate={s.playbackRate ?? 1} style={style} />
  ) : (
    <Img src={staticFile(s.src)} style={style} />
  );

// Full-bleed hook: the subject fills the phone screen from frame 0. No wipe-in tag (one moving thing at a
// time: the caption); a small static reconstruction label keeps the AI disclosure.
const FullBleedView: React.FC<{ s: SceneSpec }> = ({ s }) => {
  const f = useCurrentFrame();
  const [fx, fy] = s.focus ?? [0.5, 0.5];
  const punched = s.punchAt !== undefined && f >= s.punchAt;
  const p = interpolate(f, [0, s.durationFrames], [0, 1], { ...CLAMP, easing: EASE_IO });
  const scale = (punched ? 1.16 : 1.0) + 0.04 * p;
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: "saturate(0.95) contrast(1.05)", transform: `scale(${scale.toFixed(4)})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}>
        <Media s={s} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%` }} />
      </div>
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.25, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
      {/* dark band under the caption line so white text reads on any clip */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0) 52%, rgba(10,14,15,0.55) 62%, rgba(10,14,15,0.62) 74%, rgba(10,14,15,0.2) 88%, rgba(10,14,15,0) 100%)" }} />
      <div style={{ position: "absolute", left: 48, top: 236, fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 4, color: C.bone, opacity: 0.7, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
        {s.tag}
      </div>
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ s: SceneSpec; overlap: number; first: boolean }> = ({ s, overlap, first }) => {
  const f = useCurrentFrame();
  if (s.full) return <FullBleedView s={s} />;
  const len = s.durationFrames + overlap;
  const fadeIn = first ? 1 : interpolate(f, [0, overlap], [0, 1], { ...CLAMP, easing: EASE_IO });
  const [fx, fy] = s.focus ?? [0.5, 0.5];
  const fit = s.fit ?? "cover";
  const filt = s.real ? "saturate(0.8) contrast(1.05) sepia(0.12)" : "saturate(0.92) contrast(1.05)";
  const tagIn = interpolate(f, [overlap, overlap + 16], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* the same picture, blurred, fills the frame behind the plate */}
      <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
        <Media s={s} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: `blur(38px) brightness(0.5) ${filt}` }} />
        <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.45, background: `linear-gradient(170deg, ${C.ochre} 0%, rgba(192,138,62,0) 40%, ${C.teal} 100%)` }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,15,0.55) 0%, rgba(10,14,15,0.1) 30%, rgba(10,14,15,0.35) 62%, rgba(10,14,15,0.85) 100%)" }} />
      </AbsoluteFill>
      {/* the specimen plate */}
      <div style={{ position: "absolute", left: 0, top: PANEL.top, width: 1080, height: PANEL.height, overflow: "hidden", background: fit === "contain" ? "#E9E0CC" : C.deep, boxShadow: "0 18px 60px rgba(0,0,0,0.55)" }}>
        <div style={{ position: "absolute", inset: 0, filter: filt, ...camera(s, f, len) }}>
          <Media s={s} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%` }} />
        </div>
        <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: s.real ? 0.42 : 0.3, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, rgba(44,74,74,0) 55%, ${C.teal} 100%)` }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 48%, rgba(0,0,0,0) 60%, rgba(8,12,13,0.5) 100%)" }} />
        {s.real ? <div style={{ position: "absolute", inset: 18, border: "1px solid rgba(239,230,210,0.35)" }} /> : null}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: "rgba(239,230,210,0.35)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "rgba(239,230,210,0.35)" }} />
      </div>
      {/* catalogue tag above the plate */}
      <div style={{ position: "absolute", left: 48, top: PANEL.top - 58, clipPath: `inset(0 ${(1 - tagIn) * 100}% 0 0)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 11, height: 11, background: C.ochre, transform: "rotate(45deg)" }} />
          <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 23, letterSpacing: 5, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            {s.tag}
            <span style={{ color: C.ochreLight, marginLeft: 18 }}>No. {String(s.beat).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
      {s.credit ? (
        <div style={{ position: "absolute", left: 48, top: PANEL.top + PANEL.height + 16, fontFamily: mono, fontSize: 19, letterSpacing: 0.5, color: C.bone, opacity: 0.75 * tagIn, textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
          {s.credit}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ captions
export const Captions: React.FC<{ groups: Group[]; fps: number }> = ({ groups, fps }) => {
  const f = useCurrentFrame();
  const tMs = (f / fps) * 1000;
  const g = groups.find((x) => tMs >= x.startMs && tMs < x.endMs);
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: CAPTION_Y, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 22, rowGap: 4 }}>
      {g.words.map((w, i) => {
        const on = tMs >= w.startMs && tMs < w.endMs;
        const past = tMs >= w.endMs;
        const lift = on ? interpolate(tMs, [w.startMs, w.startMs + 90], [0, 1], CLAMP) : 0;
        return (
          <span key={i} style={{
            fontFamily: sans, fontWeight: 800, fontSize: 82, lineHeight: 1.08,
            color: on ? C.ochreLight : C.bone, opacity: on || past ? 1 : 0.72,
            transform: `translateY(${-6 * lift}px)`, display: "inline-block",
            textShadow: "0 3px 0 rgba(10,14,15,0.9), 0 0 22px rgba(10,14,15,0.85)",
            borderBottom: on ? `5px solid ${C.ochre}` : "5px solid transparent",
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ hook headline (r04, 2026-10-29)
// The claim in big type over the hook from frame 0, so a muted feed viewer gets it before the voice does.
export const HookHeadline: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 300, textAlign: "center", opacity: out }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 108, lineHeight: 1.0, letterSpacing: 1, color: C.bone,
        WebkitTextStroke: "3px rgba(10,14,15,0.95)", paintOrder: "stroke fill",
        textShadow: "0 5px 0 rgba(10,14,15,0.9), 0 0 36px rgba(10,14,15,0.9)" }}>{text}</div>
    </div>
  );
};

// ------------------------------------------------------------------ field note (big number)
export const FieldNote: React.FC<{ n: Note }> = ({ n }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const out = interpolate(f, [n.durationFrames - 10, n.durationFrames], [1, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: 48, top: PANEL.top + 28, opacity: p * out, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ background: "rgba(17,24,25,0.78)", borderLeft: `6px solid ${C.ochre}`, padding: "18px 30px 20px 26px" }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 6, color: C.ochreLight }}>FIELD NOTE</div>
        <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 118, lineHeight: 1, color: C.bone, marginTop: 6 }}>{n.big}</div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 30, color: C.bone, opacity: 0.9, marginTop: 6 }}>{n.small}</div>
      </div>
    </div>
  );
};

export const EndCardView: React.FC<{ c: EndCard }> = ({ c }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 16], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: CAPTION_Y + 165, opacity: p, transform: `translateY(${(1 - p) * 16}px)`, textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: 7, color: C.ochreLight }}>{c.label}</div>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 58, lineHeight: 1.05, color: C.bone, marginTop: 8, textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>{c.name}</div>
    </div>
  );
};

// ------------------------------------------------------------------ root
export const Scene: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  // the wordmark waits until the plate layout starts, so nothing but the caption moves over the hook
  const markFrom = p.scenes[0]?.full && p.scenes.length > 1 ? p.scenes[1].startFrame : 0;
  const markIn = interpolate(f, [markFrom, markFrom + 20], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      {p.scenes.map((s, i) => {
        const from = i === 0 ? 0 : s.startFrame - p.overlap;
        const dur = s.durationFrames + (i === 0 ? 0 : p.overlap);
        return (
          <Sequence key={s.beat} from={from} durationInFrames={dur}>
            <BeatView s={s} overlap={p.overlap} first={i === 0} />
          </Sequence>
        );
      })}
      {p.notes.map((n, i) => (
        <Sequence key={i} from={n.startFrame} durationInFrames={n.durationFrames}>
          <FieldNote n={n} />
        </Sequence>
      ))}
      <Sequence from={p.endCard.startFrame} durationInFrames={p.endCard.durationFrames}>
        <EndCardView c={p.endCard} />
      </Sequence>
      {p.hookText && p.scenes.length > 1 ? (
        <Sequence from={0} durationInFrames={p.scenes[1].startFrame}>
          <HookHeadline text={p.hookText} dur={p.scenes[1].startFrame} />
        </Sequence>
      ) : null}
      <Captions groups={p.karaoke} fps={p.fps} />
      {/* wordmark, top right of the plate */}
      <div style={{ position: "absolute", right: 48, top: PANEL.top - 64, display: "flex", alignItems: "center", gap: 12, opacity: markIn }}>
        <Ammonite size={36} />
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 19, letterSpacing: 6, color: C.bone, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>FOSSIL MYSTERIES</div>
      </div>
      <Grain srcs={p.grain} />
      <Audio src={staticFile(p.narrationSrc)} />
      <Audio src={staticFile(p.musicSrc)} loop volume={p.musicVolume} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ cover (9:16 thumbnail)
// Plate + one big claim; everything that matters stays inside the 3:4 profile-grid crop (y 285–1635).
export const Cover: React.FC<{ src: string; big: string; kicker: string; sub?: string; focus?: [number, number] }> = ({ src, big, kicker, sub, focus = [0.5, 0.5] }) => (
  <AbsoluteFill style={{ background: C.deep }}>
    <Img src={staticFile(src)} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(38px) brightness(0.45)" }} />
    <div style={{ position: "absolute", left: 0, top: 345, width: 1080, height: 885, overflow: "hidden", boxShadow: "0 18px 60px rgba(0,0,0,0.55)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`, filter: "saturate(0.95) contrast(1.08)" }} />
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.3, background: `linear-gradient(160deg, ${C.ochre} 0%, rgba(192,138,62,0) 45%, ${C.teal} 100%)` }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1245, textAlign: "center" }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 66, letterSpacing: 4, lineHeight: 1, color: C.ochreLight, textShadow: "0 3px 16px rgba(0,0,0,0.8)" }}>{kicker}</div>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 220, lineHeight: 0.95, color: C.bone, fontVariantNumeric: "lining-nums", textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>{big}</div>
      {sub ? <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 62, letterSpacing: 2, lineHeight: 1.05, color: C.bone, marginTop: 4, textShadow: "0 3px 16px rgba(0,0,0,0.8)" }}>{sub}</div> : null}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 276, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
      <Ammonite size={40} />
      <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 22, letterSpacing: 7, color: C.bone }}>FOSSIL MYSTERIES</div>
    </div>
  </AbsoluteFill>
);

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = ({ props }) => ({
  durationInFrames: props.totalFrames,
  fps: props.fps,
  width: props.width,
  height: props.height,
});
