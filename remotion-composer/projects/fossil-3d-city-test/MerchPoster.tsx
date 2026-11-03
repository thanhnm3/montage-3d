// Poster Etsy 2:3 (3600x5400): bảng so sánh kích thước 5 loài khủng long so với người 1,8 m.
// Sprite (PNG trong suốt, 234 px/m) nằm trong public dir: sprites/<loài>.png + sprites.json (w,h từng sprite).
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";

const bebas = loadBebas().fontFamily;
const nunito = loadNunito("normal", { weights: ["700", "800"] }).fontFamily;

const INK = "#2B2118", RUST = "#C1502E", CREAM = "#F5ECD7", LINE = "#CDBE9C";
const K = 0.72; // sprite scale: 234 px/m * 0.72 = 168 px/m

type Meta = Record<string, { w: number; h: number }>;
type Row = { sp: string; rank: string; name: string; latin: string; len: string; extra: string };
const ROWS: Row[] = [
  { sp: "trex", rank: "#1", name: "T. REX", latin: "Tyrannosaurus rex", len: "12 m  ·  40 ft", extra: "8–9 tonnes  ·  bite force 34,000 N" },
  { sp: "giganotosaurus", rank: "#2", name: "GIGANOTOSAURUS", latin: "Giganotosaurus carolinii", len: "12–13 m  ·  40 ft", extra: "Skull as long as a grown man is tall" },
  { sp: "spinosaurus", rank: "#3", name: "SPINOSAURUS", latin: "Spinosaurus aegyptiacus", len: "~14 m  ·  46 ft", extra: "The longest predator of the five" },
  { sp: "carnotaurus", rank: "#4", name: "CARNOTAURUS", latin: "Carnotaurus sastrei", len: "~8 m  ·  26 ft", extra: "1–2 tonnes  ·  sprinter" },
  { sp: "utahraptor", rank: "#5", name: "UTAHRAPTOR", latin: "Utahraptor ostrommaysi", len: "~6 m  ·  20 ft", extra: "22 cm sickle claw" },
];

const Img: React.FC<{ sp: string; m: Meta; style?: React.CSSProperties }> = ({ sp, m, style }) => (
  <img src={staticFile(`sprites/${sp}.png`)} width={Math.round(m[sp].w * K)} height={Math.round(m[sp].h * K)} style={{ display: "block", ...style }} />
);

const Label: React.FC<{ r: Row; align?: "left" | "right" }> = ({ r, align = "left" }) => (
  <div style={{ textAlign: align }}>
    <div style={{ fontFamily: bebas, fontSize: 210, lineHeight: 0.9, color: INK }}>
      <span style={{ color: RUST }}>{r.rank}</span> {r.name}
    </div>
    <div style={{ fontFamily: nunito, fontWeight: 700, fontSize: 56, fontStyle: "italic", color: "#6B5A45", marginTop: 6 }}>{r.latin}</div>
    <div style={{ fontFamily: bebas, fontSize: 130, color: RUST, marginTop: 26, lineHeight: 1 }}>{r.len}</div>
    <div style={{ fontFamily: nunito, fontWeight: 800, fontSize: 52, color: INK, marginTop: 8 }}>{r.extra}</div>
  </div>
);

const Ground: React.FC = () => <div style={{ height: 8, background: LINE, borderRadius: 4 }} />;

export const MerchPoster: React.FC<{ meta: Meta }> = ({ meta }) => {
  const [rex, giga, spino, carno, utah] = ROWS;
  const row = (r: Row) => (
    <div style={{ position: "relative", height: Math.round(meta[r.sp].h * K) }}>
      <div style={{ position: "absolute", left: 0, bottom: 0 }}><Img sp={r.sp} m={meta} /></div>
      <div style={{ position: "absolute", right: 0, top: 0 }}><Label r={r} align="right" /></div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: CREAM, padding: "170px 200px 150px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: bebas, fontSize: 400, lineHeight: 0.88, color: INK, letterSpacing: 6 }}>HOW BIG WERE THE</div>
        <div style={{ fontFamily: bebas, fontSize: 400, lineHeight: 0.88, color: RUST, letterSpacing: 6 }}>SCARIEST DINOSAURS?</div>
        <div style={{ fontFamily: nunito, fontWeight: 800, fontSize: 64, color: "#6B5A45", marginTop: 40 }}>
          5 PREDATORS RANKED  ·  SHOWN TO SCALE NEXT TO A 1.8 m (6 ft) HUMAN
        </div>
      </div>
      <div style={{ marginTop: 130, display: "flex", flexDirection: "column", gap: 0 }}>
        {row(rex)}<Ground />
        <div style={{ height: 110 }} />
        {row(giga)}<Ground />
        <div style={{ height: 110 }} />
        {row(spino)}<Ground />
        <div style={{ height: 110 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Label r={carno} />
            <div style={{ height: 30 }} />
            <Img sp="carnotaurus" m={meta} />
          </div>
          <div>
            <Label r={utah} />
            <div style={{ height: 30 }} />
            <Img sp="utahraptor" m={meta} />
          </div>
          <div style={{ textAlign: "center", paddingBottom: 0 }}>
            <Img sp="human" m={meta} style={{ margin: "0 auto" }} />
            <div style={{ fontFamily: bebas, fontSize: 84, color: INK, marginTop: 10, lineHeight: 1 }}>YOU</div>
            <div style={{ fontFamily: nunito, fontWeight: 800, fontSize: 40, color: "#6B5A45" }}>1.8 m / 6 ft</div>
          </div>
        </div>
        <Ground />
      </div>
      <div style={{ position: "absolute", left: 200, right: 200, bottom: 70, textAlign: "center", fontFamily: nunito, fontWeight: 700, fontSize: 38, color: "#8A7A63" }}>
        Sizes are scientific estimates and vary by specimen. Illustrated as stylized blocky models, not exact proportions.
      </div>
    </AbsoluteFill>
  );
};
