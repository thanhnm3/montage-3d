// All beast-style animals in one registry: beastAnimals.ts (6) + beastMore.ts (12 + Parasaurolophus) + beastWings.ts (8,
// flyers + dragons) + beastExtra.ts (15).
// Entry = { draw, len (m over the x0..x1 design extent), x0, x1, fly? }. Flyers / swimmers: place cards with anchor 520.
import { BEAST_ALL } from "./beastMore";
import { BEAST_WINGS } from "./beastWings";
import { BEAST_EXTRA } from "./beastExtra";
import { drawParaB } from "./beastMore";
export const BEASTS = { ...BEAST_ALL, ...BEAST_WINGS, ...BEAST_EXTRA, para: { draw: drawParaB, len: 9.5, x0: 26, x1: 1349 } };
export type BeastName = keyof typeof BEASTS;
