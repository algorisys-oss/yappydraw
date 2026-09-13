# Illustration assets — attribution

The Elements-panel illustrations are **Microsoft Fluent Emoji**, flat style
(https://github.com/microsoft/fluentui-emoji).

- **License:** MIT — the full text ships next to the SVGs as
  `frontend/public/illustrations/LICENSE.txt` (Copyright (c) Microsoft Corporation).
- **Source:** `assets/<name>/Flat/*.svg` (or `Default/Flat/` for skin-toned emoji), with
  names and keywords from each folder's `metadata.json`.
- **Modifications:** coordinates rounded to 2 decimals and whitespace minified; SVGs that
  use gradients, clip paths, masks or filters are excluded because the canvas importer
  cannot reproduce them. No other visual changes.

Regenerate `index-data.ts` and `public/illustrations/` with `scripts/build-illustrations.mjs`
(its header has the checkout commands).

Earlier releases (v0.8.88–v0.8.245) bundled 85 OpenMoji illustrations (CC BY-SA 4.0). They
were replaced because ShareAlike is awkward for users' own designs and the two styles clashed;
documents that already contain them are unaffected, since an inserted illustration is plain
vector paths with no link back to the library.
