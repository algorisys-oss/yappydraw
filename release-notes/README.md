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
