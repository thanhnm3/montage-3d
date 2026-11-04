// All beast-style animals in one registry: beastAnimals.ts (6) + beastMore.ts (12) + beastWings.ts (8, flyers + dragons).
// Entry = { draw, len (m over the x0..x1 design extent), x0, x1, fly? }. Flyers / swimmers: place cards with anchor 520.
import { BEAST_ALL } from "./beastMore";
import { BEAST_WINGS } from "./beastWings";
export const BEASTS = { ...BEAST_ALL, ...BEAST_WINGS };
export type BeastName = keyof typeof BEASTS;
