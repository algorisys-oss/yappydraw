# Illustration assets — attribution

The illustrations bundled in `assets.ts` are a curated subset of **OpenMoji**
(https://openmoji.org), the open-source emoji and icon project of HfG Schwäbisch
Gmünd.

- **License:** Creative Commons Attribution-ShareAlike 4.0 International
  (CC BY-SA 4.0) — https://creativecommons.org/licenses/by-sa/4.0/
- **Source:** https://github.com/hfg-gmuend/openmoji (`color/svg/<HEX>.svg`)
- **Modifications:** SVGs are inlined and whitespace-minified for offline bundling;
  they are inserted onto the canvas as editable vector paths. No visual changes.

CC BY-SA 4.0 requires attribution and share-alike. Keep this notice with the
assets, and retain the OpenMoji credit surfaced in the Elements panel.

Regenerate the bundle with `scripts/build-illustrations.mjs` (see its `TABLE`
for the codepoint → name/tags mapping).
