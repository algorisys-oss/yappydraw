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
