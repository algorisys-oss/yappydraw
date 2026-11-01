# Third-party notices

Components bundled with Yappy that carry their own licence terms, and the acknowledgements those
terms require. Runtime npm dependencies are not listed here — `package.json` and the lockfile are
the record for those. This file is for **data and assets compiled into what ships**, where the
licence asks for something to travel with the artefact.

## Hershey single-line fonts

`frontend/public/fonts/stroke/*.json` — the glyph data behind `Yappy.strokeText`.

> The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the
> U. S. National Bureau of Standards.
>
> The format of the Font data in this distribution was originally created by
> James Hurt, Cognition, Inc., 900 Technology Park Drive, Billerica, MA 01821.

Copyright 1967 Dr. A. V. Hershey, James Hurt.

The distribution may be used by anyone for any purpose, commercial or otherwise, provided the
acknowledgements above are distributed with the font data, and provided the data is not converted
into the format distributed by the U.S. NTIS. Yappy converts it to JSON, which the licence
explicitly permits.

The acknowledgement is also embedded in each generated JSON file's `notice` field, so it cannot
be separated from the data it applies to.

- Source: <https://github.com/kamalmostafa/hershey-fonts> (`hershey-fonts/*.jhf`), the
  distribution Debian packages as `hershey-fonts-data`. Fetched 2026-10-08.
- Faces used: `rowmans`, `rowmand`, `futural`, `scripts`, `gothiceng`.
- The upstream repository's own `COPYING` places its *software* under GPL-2.0. Only the `.jhf`
  **data** is used here, which carries the separate licence above.
- Conversion: `scripts/build-stroke-fonts.mjs`. Inputs and the verbatim licence text are kept in
  `scripts/data/hershey/`.

## Bundled outline fonts

`frontend/public/fonts/outline/*.ttf` — the glyph binaries behind **Text → Create Outlines**.
These are the curated open-licence families that match the in-app font picker; each carries its
upstream licence (SIL Open Font License 1.1 unless stated otherwise in the family's own
distribution).

## ECMA-376 preset shape definitions

`frontend/src/utils/pptx/presets.json` — the geometry of PowerPoint's 187 preset shapes, compiled
by `scripts/pptx-presets.mjs` from `presetShapeDefinitions.xml`, the machine-readable part of
**ECMA-376 Office Open XML, Part 1** (© Ecma International), which Ecma publishes for free use
in implementations of the standard.

- Source: the copy Apache POI distributes under the Apache License 2.0,
  <https://github.com/apache/poi> (`poi/src/main/resources/org/apache/poi/sl/draw/geom/presetShapeDefinitions.xml`).
  Fetched 2026-10-31.
- Used by the PowerPoint importer to draw shapes with their exact outlines.

## DeckCraft (logic adapted)

`frontend/src/utils/morph.ts` adapts the slide-to-slide Morph matching order from DeckCraft's
`crates/anim/src/morph.rs` (`morph_pairs`), rewritten in TypeScript. The PowerPoint writer's
part list and notes-master layout (`frontend/src/utils/pptx/write.ts`) follow DeckCraft's
`crates/pptx/src/write.rs`. DeckCraft is dual-licensed MIT OR Apache-2.0; Yappy uses it under
the MIT licence below. No DeckCraft names, logos or brand assets are used.

- Source: DeckCraft (Rust presentation app), read-only clone.

```
MIT License

Copyright (c) 2026 ArtCraft Team and the DeckCraft contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

