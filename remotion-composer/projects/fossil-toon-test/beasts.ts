// All beast-style animals in one registry: beastAnimals.ts (6) + beastMore.ts (12 + Parasaurolophus) + beastWings.ts (8,
// flyers + dragons) + beastExtra.ts (15).
// Entry = { draw, len (m over the x0..x1 design extent), x0, x1, fly? }. Flyers / swimmers: place cards with anchor 520.
import { BEAST_ALL } from "./beastMore";
import { BEAST_WINGS } from "./beastWings";
import { BEAST_EXTRA } from "./beastExtra";
import { drawDiploB, drawIguB, drawParaB } from "./beastMore";
import { drawRaptorB } from "./beastAnimals";
import { drawBaryB, drawDeinoB, drawOviB } from "./beastExtra";
import { BEAST_ANCIENT, tinted } from "./beastAncient";
import { BEAST_MYTH } from "./beastMyth";
export const BEASTS = { ...BEAST_ALL, ...BEAST_WINGS, ...BEAST_EXTRA, para: { draw: drawParaB, len: 9.5, x0: 26, x1: 1349 },
  ...BEAST_ANCIENT, ...BEAST_MYTH,
  // variants of existing bodies (x0 / x1 measured with BeastSolo)
  diplo: { draw: drawDiploB, len: 26, x0: 6, x1: 1457 },
  igu: { draw: drawIguB, len: 10, x0: 26, x1: 1349 },
  bary: { draw: drawBaryB, len: 9.5, x0: 16, x1: 1438 },
  ovi: { draw: drawOviB, len: 1.8, x0: 16, x1: 1107 },
  velo: { draw: tinted(drawRaptorB, "hue-rotate(-25deg) saturate(1.5) brightness(1.1)"), len: 1.8, x0: 9, x1: 1128 },
  sarco: { draw: tinted(drawDeinoB, "hue-rotate(30deg) saturate(0.8) brightness(1.1)"), len: 9.5, x0: 23, x1: 1556 },
};

export type BeastName = keyof typeof BEASTS;
