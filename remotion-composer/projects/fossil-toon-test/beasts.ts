// All beast-style animals in one registry: beastAnimals.ts (6) + beastMore.ts (12 + Parasaurolophus) + beastWings.ts (8,
// flyers + dragons) + beastExtra.ts (15).
// Entry = { draw, len (m over the x0..x1 design extent), x0, x1, fly? }. Flyers / swimmers: place cards with anchor 520.
import { BEAST_ALL } from "./beastMore";
import { BEAST_WINGS } from "./beastWings";
import { BEAST_EXTRA } from "./beastExtra";
import { drawDiploB, drawIguB, drawParaB } from "./beastMore";
import { drawBaryB, drawKronoB, drawOviB, drawPuruB, drawSarcoB } from "./beastExtra";
import { drawDeinotherB, drawHallucigeniaB, drawMegalaniaB, drawVeloB, drawXiphoB } from "./beastRedo";
import { BEAST_ANCIENT } from "./beastAncient";
import { BEAST_MYTH } from "./beastMyth";
export const BEASTS = { ...BEAST_ALL, ...BEAST_WINGS, ...BEAST_EXTRA, para: { draw: drawParaB, len: 9.5, x0: 26, x1: 1349 },
  ...BEAST_ANCIENT, ...BEAST_MYTH,
  // variants of existing bodies (x0 / x1 measured with BeastSolo)
  diplo: { draw: drawDiploB, len: 26, x0: 6, x1: 1457 },
  igu: { draw: drawIguB, len: 10, x0: 26, x1: 1349 },
  bary: { draw: drawBaryB, len: 9.5, x0: 16, x1: 1438 },
  ovi: { draw: drawOviB, len: 1.8, x0: 16, x1: 1107 },
  velo: { draw: drawVeloB, len: 1.8, x0: 68, x1: 1137 },
  sarco: { draw: drawSarcoB, len: 9.5, x0: 23, x1: 1592 },
  puru: { draw: drawPuruB, len: 10, x0: 23, x1: 1426 },
  krono: { draw: drawKronoB, len: 9.5, x0: 106, x1: 1585, fly: true },
  megalania: { draw: drawMegalaniaB, len: 6, x0: 133, x1: 1423 },
  deinother: { draw: drawDeinotherB, len: 5.5, x0: 329, x1: 1225 },
  xipho: { draw: drawXiphoB, len: 5.5, x0: 138, x1: 1406, fly: true },
  halluci: { draw: drawHallucigeniaB, len: 0.035, x0: 97, x1: 1437 },
};

export type BeastName = keyof typeof BEASTS;
