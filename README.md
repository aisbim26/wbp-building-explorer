# AAT — Western Bypass Project Explorer

REBUILDING WESTERN BYPASS AND ASSOCIATED A&A WORKS FOR ASIA AIRFREIGHT TERMINAL CO LTD (AAT)

[Open the website](https://aisbim26.github.io/wbp-building-explorer/)

Choose one of the four phase buttons at the top: WBP demolition, foundation removal, new foundations, or building and footbridge construction. Drag **Sequence progress** to reveal each step and its explanation. The arrows move one step; **Start over** restores the selected phase.

Components appear or disappear in their original positions. The slider represents construction steps, rather than video running time.

## Viewing controls

- Drag to orbit, scroll or pinch to zoom, and right-drag or use two fingers to pan.
- On a phone, tap **Controls** to open or close the component panel. The model and progress slider remain available when the panel is closed.
- **Roof off**, **Interior**, and the component checkboxes reveal individual parts.
- **Below ground**, available in the foundation phases, reveals piles, caps and excavation support.
- **Airport context** shows the surrounding buildings, adjoining tower panels and blue canopy, guardhouse and barriers. The context surface has a cutout matching the source soil footprint so it does not cover the foundation works.
- **Reset view** returns the camera to the project; zoom out to explore the wider airport.

## Local copy

Run `Start-Viewer.ps1` or `node server.mjs`, then open http://127.0.0.1:4173/. Do not open index.html directly.

Original Blender models are unchanged. Browser lighting and procedural material appearance can differ from rendered animation. Geometry is displayed in local coordinates; original GIS origin metadata remains in manifest.json.

## Playback and loading

Tap **Play** to advance through the selected phase in 10 seconds from start to finish. **Pause** holds the current step; resuming keeps the same pace. Playback from an intermediate step takes the remaining fraction of 10 seconds. Dragging the slider, using the step arrows, switching phase, or hiding the browser tab pauses playback.

The three-line button to the left of the project title opens the viewing controls. Models load only when their phase is selected and remain available for switching back during the same visit. Meshopt compression reduces model download size while retaining vertex values and construction groups. The loading message shows download progress, followed by model preparation.
