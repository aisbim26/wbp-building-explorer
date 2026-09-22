# WBP Building Explorer — V39 Demolition Sequence

Run `Start-Viewer.ps1`, or run `node server.mjs` in this folder and open http://127.0.0.1:4173/ . Node.js is required. Dependencies and models are included; no package download is needed. Do not open index.html directly.

## Controls

- **Demolition progress:** 47 steps, following the completion of each visibility change in Blender V39. Components disappear or protective enclosures appear in place. No animation or movement is played.
- Drag left to restore earlier stages. Use the arrow buttons to advance or reverse one step. **Start over** restores the initial model and hides the protective enclosures.
- Each step displays an English title, description and step number. Edit `title` and `description` in `demolition.json` to change the wording. See `Demolition_Sequence.md` for the complete list.
- **Roof off** and **Interior** are additional viewing filters; they do not change the demolition step. Select **Exterior** to review the complete sequence without these filters.
- Drag to orbit, right-drag to pan and scroll to zoom. ISO, Plan and Front provide preset views.
- **Airport context** loads the surrounding site on demand and preserves the demolition progress.

## Source and retained components

The sequence comes from `WBP_Demolition_v39_00-60s.blend`, using its component groups, Visible_Amount keyframes and frame-one geometry. Each group occupies one slider step; slider spacing does not represent elapsed video time.

All four T1 lift platforms, guardrails and controls are retained. Protective enclosures appear in order 1–4 before removal of the T1 roof and steelwork. The final three zones are removed in order 1–2–3, with columns removed after the main beams and trusses. The floor, foundations and protected equipment remain at the end.

The grey L-shaped T1_Closure_Grey_Wall is excluded as requested. The source Blender file and Premiere video are unchanged. This viewer presents the source animation's sequence.

## Files

- `demolition.json`: stage order, English text and source frames.
- `models/wbp_demolition_v39.glb`: stationary V39 components grouped by controller, category and material, without animation tracks.
- `manifest.json`: airport context layers and GIS origin.
- `vendor/three`: Three.js and its loaders.
- `reports`: export and validation records. Older records document earlier versions.
- `previous-exploded-view`: backup of the previous interface.
- `source`: conversion scripts and preserved Blender backups; not required for website hosting.

Materials reuse the existing baked textures, with projected UVs transferred to the V39 geometry. The silver-grey roof uses the corrected texture. New protective enclosures use their source materials. UV projection distances are recorded in the export report; new cut faces sample the nearest source surface.

## Coordinates

HK1980 / EPSG:2326, in metres: E = Three.x + 809874; N = 817662 - Three.z; H = Three.y. The vertical datum follows the source and has not been independently verified. Visibility changes do not move the geometry.

The viewer runs locally and has not been published to GitHub or another hosting service.
