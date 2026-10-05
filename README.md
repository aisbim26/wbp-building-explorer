# AAT · Western Bypass — Project Journey

REBUILDING WESTERN BYPASS AND ASSOCIATED A&A WORKS FOR ASIA AIRFREIGHT TERMINAL CO LTD

[Open the website](https://aisbim26.github.io/wbp-building-explorer/)

The five source models form one continuous project journey with four chapters: demolition, foundation removal, new foundations, and the new building. Select a chapter on the left, click a phase name below the timeline, or use the project slider. **Play** gives a ten-second overview after the required models are ready. Pause or move the slider at any time; changing tabs pauses playback.

The new-foundations chapter compares **Option 1 — Re-use existing piles and additional piles** with **Option 2 — Cellular Raft Foundation**. The cameras are linked. Both options follow their own original sequence; matching progress percentages do not represent matching construction dates, durations or equivalent engineering milestones. Desktop uses a side-by-side view; narrow screens use a stacked comparison.

## Viewing controls

The menu beside the AIS logo opens component controls. Roof off, Interior and Below ground affect both options in comparison mode. Drag to orbit, scroll or pinch to zoom, and right-drag or use two fingers to pan. Reset view returns to the works area. Airport context loads separately and retains its ground cutout, adjoining tower components, guardhouse and barriers.

The loading screen distinguishes downloading from preparation. Percentages use each asset's actual decoded byte size, because compressed HTTP transfer sizes are not comparable with the decoded stream. A view is released only after its models are prepared. Failed requests can be retried; an interrupted context load can be skipped without losing the project position.

Original Blender files and model geometry are unchanged by this redesign. Existing terrain repairs and retained-topography settings are preserved. Browser lighting can differ from rendered animation.

## Local use

Run `Start-Viewer.ps1` or `node server.mjs`, then open the displayed local URL. Do not open index.html directly. The viewer uses vendored Three.js dependencies and needs no package installation.

## Data and future integration

- `data/project.json`: project identity, original GIS origin, chapter ranges, option relationships, model byte sizes and content fingerprints, source frames, stable step and component IDs, and visibility changes.
- `data/model-index.json`: source element IDs and names linked to the model groups and categories. This index is not downloaded during ordinary viewing.
- `app/project.js`: pure position and visibility logic shared by the viewer and automated checks.
- `app/viewer.js`: model loading, geometry, linked cameras, context and picking.
- `main.js`: interface and playback orchestration.

`window.wbpViewer` exposes `getState()`, `getProject()`, `setProgress(0..1)`, `jumpToChapter(id)` and `setContext(boolean)`. `wbp:statechange` publishes the current chapter, local steps, selected component, visible groups and readiness. IDs refer to this published data snapshot; future model exports must preserve or explicitly migrate identifiers. Picking resolves a web mesh group, not an individual element within a batched mesh. Source element membership is available in the separate index.

The lower-right AI Copilot button opens an interface preview with a local conversation, suggested prompts and a composer. Step explanations quote the current viewer data; foundation comparisons use fixed project labels. Every reply is marked as a preview. Free-text messages receive a preview acknowledgement, are kept only in page memory and are never sent to an AI service. Opening the panel pauses playback. No AI service, schedule inference or cost estimation is connected.

## Design reference

The interface follows the Apple Design, Design Engineering and Mobile Native guidance in [Emil Kowalski's skills](https://github.com/emilkowalski/skills), while retaining the AIS logo and company blue. Reduced-motion, reduced-transparency, keyboard focus and touch-safe controls are supported. Desktop and mobile viewport layouts are checked in-browser; real iOS/Android device behavior still needs device testing.
