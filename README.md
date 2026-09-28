# WBP Building Explorer — Project Sequence

Open the published website: https://aisbim26.github.io/wbp-building-explorer/

For a local copy, run `Start-Viewer.ps1` or `node server.mjs`, then open http://127.0.0.1:4173/. Do not open index.html directly.

## Project phases

| Phase | Source version | Steps |
|---|---|---:|
| WBP demolition | Demolition Revision V69 — Upper | 48 |
| Existing foundations | Demolition Revision V69 — Foundation | 107 |
| New foundations | Foundation Animation V04, used for Final Render V04 | 132 |
| Building & footbridge | Building Construction V04, used for Final Render V04 | 49 |

Choose a project phase in the left panel. Each phase loads on demand. Drag **Sequence progress** to show or hide groups in the source sequence; drag left to restore an earlier stage. The arrows move one step, and **Start over** restores the selected phase. Each step has an English title and explanation.

Objects stay in their installed or original positions. The website does not play crane, excavator, camera, lifting or falling animations. Visibility fades become complete group changes; pile installation is shown when insertion completes. Slider spacing represents steps, not elapsed video time.

## Inspect the model

- Drag to orbit, scroll to zoom, and right-drag to pan.
- **Roof off** and **Interior** reveal the building beneath its envelope.
- **Below ground** is available in the two foundation phases. It hides the soil, slabs and surrounding temporary equipment so piles, caps, beams and excavation support can be inspected.
- Component checkboxes provide independent visibility filters. They do not change the sequence order.
- **Airport context** loads the surrounding site on demand. The project phase and progress are retained.
- **Reset model** restores the initial view and stage of the selected phase.

## Source and geometry

The source files are `WBP_Upper_Revised_v69.blend`, `WBP_Foundation_Revised_v69.blend`, `New_Foundation_Animation_15s_v04.blend` and `New_Building_Construction_28s_v04.blend`. Final Render files are video-editing containers; the 3D files used by their rendering scripts supply the geometry and sequence.

Original Blender files remain unchanged. The exported models preserve evaluated geometry and local coordinates. Animation-only transparency wrappers are removed. Existing compatible WBP baked materials are reused, including the corrected roof texture. Unsupported procedural colour ramps use their average source colour; browser lighting and reflections can differ from Blender renders. Remote flat reference faces in the source are excluded from automatic camera framing.

The foundation export was checked against the V04 revision list: 31 interior piles participate in installation and 40 perimeter piles remain stationary. The building phase follows the source order for frame bays, canopies, internal plates, roof supports, external envelope, signage, footbridge and final boundary works.

## Files and coordinates

`sequences.json` defines phase titles, stages, source frames and group visibility. The four `models/sequence_*.glb` files contain stationary geometry without animation tracks. `manifest.json` defines the airport context and GIS origin. `Project_Sequence.md` lists every step. Three.js is included in `vendor/three`.

HK1980 / EPSG:2326, metres: E = Three.x + 809874; N = 817662 - Three.z; H = Three.y. Vertical datum follows the source and has not been independently verified.
