# Free assets used in r02 (comp `Ink3DBarnFree`)

All CC0 (public domain): no credit required, commercial use OK. Credit is still nice to give in the description.

| Pack | Author | Licence | Used for | Files |
|---|---|---|---|---|
| Farm Buildings | Quaternius (quaternius.com) | CC0 | barn, silo, fences, windmills, well | `public/free/fbx/*.fbx` |
| Farm Animals | Quaternius | CC0 | cows (with their own idle/eat clips) | `public/free/fbx/Cow.fbx` |
| Nature Kit 2.1 | Kenney (kenney.nl) | CC0 | trees, rocks, grass, flowers, logs, pot, stump, pumpkins | `public/free/glb/*.glb` |
| Toon Characters 1 | Kenney | CC0 | host (male character, 45 poses cut from the vector sheet) | `public/free/man/`, `public/free/woman/` |

Downloads and unzipped packs: `openmontage/projects/free-assets-cc0/`.

Changes made in code (not in the files):
- every material converted to the same 4-step toon ramp as r01;
- Kenney Nature Kit colours remapped by material name (`NAME_COL` in `FreeWorld.tsx`): its teal grass/leaves and orange "dirt" rocks clashed with the farm palette;
- the barn's red wood gets the grey -> red paint sweep (`paintUni`);
- Kenney character sheet rasterised at 6x with the SVG filters stripped (filters left grey halos).

Still code-made in r02 (no free asset fits): sky, clouds, the paint liquid and can, mold patches, supernova, dust rain, captions, tags.

Description credit line: "3D models: Quaternius & Kenney (CC0)."
