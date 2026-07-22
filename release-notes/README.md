# Release notes

One Markdown file per shipped version: `release-notes/<version>.md` (e.g.
`0.5.2.md`). Created as part of the **"ship it"** workflow (see `CLAUDE.md`) —
never skipped. Newest at the top of the index below.

## Template

```markdown
# <version> — <short title> (<YYYY-MM-DD>)

## Highlights
- One-line, user-facing summary of the headline change(s).

## Features
- New capabilities (with the `window.Yappy` API where relevant).

## Fixes
- Bugs fixed (link the symptom → cause briefly).

## Internal / tests / docs
- Infra, test, refactor, doc changes.

## Breaking changes / migration
- Anything users/integrations must adjust (or "None").
```

## Index

- [0.8.143](0.8.143.md) — Animation Studio: Animate-class frame timeline (keyframes, tweens, onion skin, movie clips, GIF export) + 3 sample templates
- [0.8.142](0.8.142.md) — Beta badge on the wordmark; footer credit points to Algorisys Technologies
- [0.8.141](0.8.141.md) — Cropping a rotated image no longer makes it jump (76px at 45°); undo/redo for crop confirmed
- [0.8.140](0.8.140.md) — Finishing a crop leaves the Crop tool, so clicking the image no longer looks like it undid the crop
- [0.8.139](0.8.139.md) — Re-cropping works (widen a crop, un-crop); on-screen Apply/Cancel so crop is usable on a tablet
- [0.8.138](0.8.138.md) — Floating panels were WHITE in dark mode: 24 CSS tokens were referenced but never defined; contrast sweep widened from 9 to 27 surfaces
- [0.8.137](0.8.137.md) — Crop fix now reaches the actual UI (0.8.136 fixed an API path the editor never used)
- [0.8.136](0.8.136.md) — Crop no longer distorts images; saved swatches visible & removable in the palette; image insert returns to Select; Layers panel contrast
- [0.8.135](0.8.135.md) — Focus theme finally differs from Dark (darkens the page itself, paged docs only); OKLCH picker can save a swatch
- [0.8.134](0.8.134.md) — Whole-app WCAG AA contrast audit: 635 findings across 11 selectors fixed in light, dark and focus; permanent audit test
- [0.8.133](0.8.133.md) — WCAG AA contrast for every filled primary button in both themes (19 were failing); P3 wide-gamut is now the default palette
- [0.8.132](0.8.132.md) — Toasts no longer cover or block the presentation toolbar; help-doc API references audited
- [0.8.131](0.8.131.md) — Committed regression suite for video/GIF capture (asserts the downloaded bytes; verified to fail against the bugs it guards)
- [0.8.130](0.8.130.md) — Looping GIF capture (start/stop) from the presentation toolbar; GIF frame-rate control; failed captures no longer disable the feature
- [0.8.129](0.8.129.md) — Record button in both presentation toolbars (MP4 of a whole run); Ctrl+Shift+E no longer ambushes you on Esc; Animation recording docs corrected
- [0.8.128](0.8.128.md) — Default Tool + Canvas Pointer settings; Ctrl+S asks for a name; My Drawings keeps every drawing (was overwriting after File → New)
- [0.8.127](0.8.127.md) — Smart shapes recognise your stroke reliably, mouse included (corner counting rewritten); open strokes stay as ink unless they're a line
- [0.8.126](0.8.126.md) — Smart shapes (hold to correct) keep your pen tool active instead of switching to Select
- [0.8.125](0.8.125.md) — Shape text is centred by default; the Properties panel no longer opens by itself when you pick a tool
- [0.8.106](0.8.106.md) — Excalidraw import/export (+ open Yappy format spec); text auto-size reachable & sticky; mindmap Tab/Enter inherit the parent's fonts/style; Slingshot overhaul (Y-fork + elastic bands via new `tether` action, destructible blocks, per-sprite gravity, grab margin); fix random middle-click paste on Linux; Alt+Enter opens Canvas properties; Behaviors panel no longer buried under the slide-navigator
- [0.8.102](0.8.102.md) — "What's new" popup: click the version number for a plain-language list of recent updates (+ "new" dot, Reload-latest button, `Yappy.showWhatsNew()`)
- [0.8.101](0.8.101.md) — Fix: elements/images/text no longer vanish when dragged past the page edge on design/slide docs (AABB-overlap visibility + always-render-selected instead of centre-point culling)
- [0.8.100](0.8.100.md) — First-visit guided onboarding tour (spotlight walkthrough; replay from Help or `Yappy.startTour()`); AA-contrast in light & dark
- [0.8.99](0.8.99.md) — Magenta equal-spacing guides always clear on pointer-up (no longer stuck on canvas after a drag / click-outside)
- [0.8.98](0.8.98.md) — Text box re-fits to the glyphs when the font grows (selection box no longer tiny); no quick-toolbar flicker while dragging Font Size; font size range up to 800; font-load repaint
- [0.8.97](0.8.97.md) — Shift+drag axis-constrained move (H/V/45°); unfilled boolean/compound results are click-selectable in their interior
- [0.8.96](0.8.96.md) — Bake dimension annotations into exports (opt-in): PNG/JPG/PDF raster + real vector SVG
- [0.8.95](0.8.95.md) — Measurement polish: px/mm/in units, angular/radial (radius/diameter/angle) dimensions, rotation-aware bounds, and true-outline intersection snapping
- [0.8.94](0.8.94.md) — Snap to path intersections (drop a corner where two outlines cross); completes the Precision & Measurement plan
- [0.8.93](0.8.93.md) — Precision & measurement: measure-to-neighbour (Alt-hover), richer Measure readout (Δx/Δy triangle + W/H/area/perimeter), fixed-angle constraint (Shift→15°), and snap-to-point while dragging
- [0.8.92](0.8.92.md) — Fix native colour picker not dragging in the Appearance fill/stroke rows (`<For>`→`<Index>` so the popup's DOM survives a live drag)
- [0.8.88](0.8.88.md) — Element search Phases 2–3: bundled OpenMoji illustrations + semantic keyword aliases + scriptable searchElements/insertElement API + Alt+E; connector-swarm & group/ungroup context-menu fixes
- [0.8.87](0.8.87.md) — Unified element search Phase 1: one "Search elements" box across icons/shapes/photos in a blended grid (+ alias map)
- [0.8.86](0.8.86.md) — One-click Replace Background (AI) + persistent in-progress spinner
- [0.8.85](0.8.85.md) — Stick figures: smaller default drop size (130→110) + baked figures no longer show un-draggable anchor squares
- [0.8.84](0.8.84.md) — Embedding doc: restrict who can frame Yappy (frame-ancestors / X-Frame-Options)
- [0.8.83](0.8.83.md) — Embed & drive the full editor from another project via a secure cross-origin postMessage bridge (+ host-side client)
- [0.8.82](0.8.82.md) — Custom stroke dash patterns (any on/off pixel array) + setStrokeDash API
- [0.8.81](0.8.81.md) — Numeric Transform panel (X/Y/W/H/rotation fields) + setElementTransform angle
- [0.8.80](0.8.80.md) — 3D Extrude keeps image pixels when tilted / beveled / expanded (was flattening to a solid colour)
- [0.8.58](0.8.58.md) — Dockable panels Phase D: History & Swatches migrated onto the dock (edge-dock / float / persist), via a setPanelOpen bridge
- [0.8.57](0.8.57.md) — Dockable panels: drag-to-dock + tear-out + reorder (Align/Arrange panels); fix invisible "ghost" line/arrow/pen elements from stray clicks
- [0.8.56](0.8.56.md) — Brand mascot (paint-brush bicycle) splash + welcome; full mobile/tablet responsive pass (untappable phone buttons, off-screen panels)
- [0.8.55](0.8.55.md) — Image placeholder + replace-in-place flow; tunable Glow & Feather panel sliders
- [0.8.54](0.8.54.md) — 3D Bevel & Revolve (lathe); consolidated Effects menu (+ Feather/Glow/Scribble now in UI); export image + "works once" fixes
- [0.8.53](0.8.53.md) — Fix export transparent border (20px→2px) + quick-toolbar font-size snap-to-8; OSS ships a clean lockfile
- [0.8.52](0.8.52.md) — Two-audience help docs (UI + verified Scripting API in every doc) + grouped context menu (Create/Select/Arrange/Export)
- [0.8.51](0.8.51.md) — Smooth Morph blend (true shape morph) + Envelope Make-with-Top-Object (warp into a silhouette)
- [0.8.50](0.8.50.md) — Desktop Phase 2: native Open/Save (.yappy), Open Recent, file associations, single-instance & auto-update
- [0.8.49](0.8.49.md) — Native desktop app (Tauri v2, builds `.deb`/`.rpm`/`.AppImage`); export crop/dropped-element/missing-effect fix
- [0.8.48](0.8.48.md) — Live 3D Extrude (+ tilt & Expand-to-faces), Blend-along-spine, Warp-preset panel editor; numeric-input clear fix
- [0.8.47](0.8.47.md) — Live Transform effect (accumulating copies) + named Warp presets (Arc/Flag/Wave…); createElement type-alias fix
- [0.8.46](0.8.46.md) — Palette + theme icons clear the Properties panel (no overlap)
- [0.8.45](0.8.45.md) — Draggable in-shape text labels + movable colour palette panel
- [0.8.44](0.8.44.md) — Tidy Canvas Theme + Texture (Texture moved under the Theme picker, no duplication)
- [0.8.43](0.8.43.md) — Canvas background themes (dot/line/graph/notebook/paper/blueprint/dark…)
- [0.8.42](0.8.42.md) — Fix empty-looking Sitemap / Random Words menu items
- [0.8.41](0.8.41.md) — Mind-map presets: Sitemap (top-down) & Random Words (radial)
- [0.8.40](0.8.40.md) — Advanced colour picker: square (SV + hue) & triangle (Krita-style hue ring) modes
- [0.8.39](0.8.39.md) — New Mind Map menu action + createMindMap API (seeds a ready-to-edit map)
- [0.8.38](0.8.38.md) — Escape closes every dialog (9 dialogs fixed via a shared hook)
- [0.8.37](0.8.37.md) — Mind-map layouts (dual-side + top-down) from the DSL, per-branch colour + curved links; curved connectors export as real curves
- [0.8.36](0.8.36.md) — Quick-toolbar font-size slider steps by 1 (was 2)
- [0.8.35](0.8.35.md) — Global colour palette: transparent swatch reads as transparent (checkerboard)
- [0.8.34](0.8.34.md) — UML relations: spread fan-in arrowheads + edge arrowheads in the text DSL
- [0.8.33](0.8.33.md) — UML class boxes auto-size to their members (no more wrapped/dropped types)
- [0.8.32](0.8.32.md) — Begin/end arrowheads on curvy bezier lines
- [0.8.31](0.8.31.md) — Real UML class diagrams in exported SVG + YSL class members + headless render CLI
- [0.8.30](0.8.30.md) — Mermaid UML class diagrams: real members & distinct UML arrowheads
- [0.8.29](0.8.29.md) — Tap/click to type an exact value on quick-toolbar sliders
- [0.8.28](0.8.28.md) — Stick-figure neck stops at the head outline, not the centre
- [0.8.27](0.8.27.md) — Timeline block reorder (drag-move) + slide-synced animation
- [0.8.26](0.8.26.md) — More stick-figure motions (Run/Clap/Dance/Cheer) + timeline block resize
- [0.8.25](0.8.25.md) — Exported HTML now plays stick-figure animations
- [0.8.24](0.8.24.md) — Scene Timeline: play & scrub all stick figures together
- [0.8.23](0.8.23.md) — Record stick-figure animations to video (webm)
- [0.8.22](0.8.22.md) — Stick-figure action sequences (chain motions over time) + smooth transitions
- [0.8.21](0.8.21.md) — Animated stick figures (walk/wave/talk/point/jump, walk-along-a-path) + Convert-to-Path fix
- [0.8.20](0.8.20.md) — More stick-figure poses (225 assets) + monochrome preview fix
- [0.8.19](0.8.19.md) — Stick-figure browsing ergonomics (colour/mono, favourites, recents, keyboard)
- [0.8.18](0.8.18.md) — Stick-figure variant filter fix (props/scenes no longer bleed into gender views)
- [0.8.17](0.8.17.md) — Stick-figure full catalog: variants, props & scenes
- [0.8.16](0.8.16.md) — Stick-figure library (drawify-style editable people)
- [0.8.15](0.8.15.md) — Flappy sample game (one-button flyer)
- [0.8.14](0.8.14.md) — One-click game Export on the canvas game bar
- [0.8.13](0.8.13.md) — Pointer & velocity nodes → a drag-aim Blueprint Slingshot
- [0.8.12](0.8.12.md) — Blueprint sample games (Platformer/Breakout) + a canvas view switcher
- [0.8.11](0.8.11.md) — Slingshot & Platformer play right; Play button no longer clipped
- [0.8.10](0.8.10.md) — Slingshot: an Angry-Birds sample game
- [0.7.1](0.7.1.md) — Quick toolbar font colour fix (text / rich-text)
- [0.7.0](0.7.0.md) — Game Engine: variables, sound, physics & the node graph
- [0.6.0](0.6.0.md) — Arcade: build games on the canvas (visual Game Builder + runtime)
- [0.5.33](0.5.33.md) — Template pack + polish round
- [0.5.32](0.5.32.md) — Magic Resize, offline PWA, version history & AI studio round 2
- [0.5.31](0.5.31.md) — Design workflow gaps closed + Google Fonts live preview
- [0.5.30](0.5.30.md) — Page thumbnails, font pairings & stock photos
- [0.5.29](0.5.29.md) — Faithful background removal + image model setting
- [0.5.28](0.5.28.md) — Design Studio: Canva-style design documents, templates, brand kit, elements, text effects, AI
- [0.5.27](0.5.27.md) — Letter Spacing for shape & connector labels
- [0.5.26](0.5.26.md) — Touch Type works with letter spacing
- [0.5.25](0.5.25.md) — Touch Type: dragging a letter moves only that letter
- [0.5.24](0.5.24.md) — Reliable Touch Type letter selection
- [0.5.23](0.5.23.md) — Spinner arrows on numeric property fields
- [0.5.22](0.5.22.md) — Puppet Warp gated to warp-capable elements
- [0.5.21](0.5.21.md) — Touch Type: multi-letter select & shape labels
- [0.5.20](0.5.20.md) — Letter spacing now drives text auto-resize & wrapping (Illustrator parity)
- [0.5.19](0.5.19.md) — Hatch fills (hachure/cross-hatch/zigzag/dashed) in architectural mode
- [0.5.18](0.5.18.md) — UML Object, Port, History & Activity Action shapes
- [0.5.17](0.5.17.md) — UML Deployment Node & Artifact shapes
- [0.5.16](0.5.16.md) — Google Fonts, custom-font hardening & UML in the Architecture group
- [0.5.15](0.5.15.md) — Industry-grade sequence diagrams, unified Architecture group, custom/per-char fonts & a UX sweep
- [0.5.14](0.5.14.md) — Appearance pattern fills export as true SVG `<pattern>`
- [0.5.13](0.5.13.md) — Live-link pattern swatches + pattern stack-fills
- [0.5.12](0.5.12.md) — Reusable pattern-swatch library
- [0.5.11](0.5.11.md) — Make Pattern from Selection
- [0.5.10](0.5.10.md) — Vector pattern fills
- [0.5.9](0.5.9.md) — Pen options bar placement hotfix
- [0.5.8](0.5.8.md) — Clock-Method constrain + keyboard-free anchor editing
- [0.5.7](0.5.7.md) — Procreate-style layer swipe gestures
- [0.5.6](0.5.6.md) — Tap-version hard refresh (iOS Safari)
- [0.5.5](0.5.5.md) — Movable toolbar on tablets
- [0.5.4](0.5.4.md) — Table reorder feedback & touch select-all
- [0.5.3](0.5.3.md) — Tablet select+delete & richer touch gestures
- [0.5.2](0.5.2.md) — DSL parser strictness + full test-suite cleanup
- [0.5.1](0.5.1.md) — deleteSlide fix
- [0.5.0](0.5.0.md) — Illustrator-parity baseline + version reset

> Versioning reset to **0.5.0** on 2026-06-27 (continuing from there). Prior
> internal `0.27.x` history rolled into the 0.5.0 baseline note.
