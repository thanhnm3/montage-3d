// "You" for Fossil Short 013 (2026-11-04): an everyday person (grey hoodie, jeans, sneakers) drawn with toon.ts
// (cartoon-3d-short skill, MIT) so the face keeps the whole toon expression library, then given the beast style's
// heavy near-black silhouette outline so it sits with the beast animals (a dilated dark copy under the drawing).
// Design space 600 x 1000, soles at y = 975, like toon.ts.
import { Expr, Gesture, Outfit, Pen, bodyFront } from "./toon";

export const YOU: Outfit = { jacket: "#5E6A74", pants: "#35557F", boots: "#F2EFE8", hat: "hair", hair: "#3E2C22", skin: "#F1C9A5", buttons: "none" };
/** paleontologist at the dig (khaki field jacket, cap) */
export const DIGGER: Outfit = { jacket: "#B0925A", pants: "#5E5240", boots: "#5A3B2A", hat: "cap", cap: "#D9C48A", skin: "#E2B48C", buttons: "none" };
export const DIGGER2: Outfit = { jacket: "#4E6A7A", pants: "#6A5A44", boots: "#3A2A20", hat: "cap", cap: "#C0482E", skin: "#C99067", buttons: "none" };
export type YouPose = { mode?: "stand" | "stroll" | "fall" | "sit"; gesture?: Gesture; expr?: Expr; phase?: number; look?: number; blink?: number;
  light?: number; facing?: -1 | 0 | 1; wave?: number; tilt?: number };

let tmp: HTMLCanvasElement | null = null, sil: HTMLCanvasElement | null = null;
/** draw "you" into g (already scaled so that 1 unit = k px) with a heavy outline of `ow` px */
export function drawYou(g: CanvasRenderingContext2D, k: number, o: YouPose, ow = 7, outfit: Outfit = YOU, seed = 6) {
  const W = Math.ceil(600 * k), H = Math.ceil(1000 * k);
  if (!tmp || tmp.width !== W || tmp.height !== H) {
    tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
    sil = document.createElement("canvas"); sil.width = W; sil.height = H;
  }
  const t = tmp.getContext("2d")!, s = sil!.getContext("2d")!;
  t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, W, H); t.setTransform(k, 0, 0, k, 0, 0);
  bodyFront(new Pen(t), outfit, { mode: o.mode ?? "stand", expr: o.expr ?? "neutral", gesture: o.gesture, phase: o.phase ?? 0, look: o.look ?? 0,
    blink: o.blink ?? 0, light: o.light, facing: o.facing ?? 0, seed, wave: o.wave, tilt: o.tilt ?? 0 });
  // silhouette in near-black
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H); s.drawImage(tmp, 0, 0);
  s.globalCompositeOperation = "source-in"; s.fillStyle = "#0E080C"; s.fillRect(0, 0, W, H); s.globalCompositeOperation = "source-over";
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.drawImage(sil!, Math.cos(a) * ow, Math.sin(a) * ow + ow * 0.35); }
  g.drawImage(tmp, 0, 0);
  g.restore();
}
