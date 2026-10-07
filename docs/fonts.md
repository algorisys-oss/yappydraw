# Fonts: how text gets its typeface, weight and width

How Yappy chooses, loads, measures, renders and exports fonts, and where each piece lives.
Read this before adding a built-in font, touching the Style menu, or changing how text is measured.
User-facing behaviour is documented in the in-app help (Drawing Tools → *Font weights and width*,
*Scaling text by dragging a corner*; Logo Toolkit → *Create Outlines*).

## 1. The model on an element

| Field | Values | Notes |
| --- | --- | --- |
| `fontFamily` | a **key**: a built-in key (below) or `custom-N` / `google-<Family>` | Never a CSS family name. `resolveFontFamily(key)` gives the CSS stack. |
| `fontWeight` | number 100–900 | Older documents may hold `true`, `'bold'`, `'normal'`; always read it through `normalizeFontWeight()` (`true`/`'bold'` → 700). |
| `fontStyle` | `'italic'` \| `'normal'` | `true` is the older encoding for italic; read via `normalizeFontStyle()`. |
| `fontStretch` | CSS `font-stretch` keyword: `ultra-condensed` … `normal` … `ultra-expanded` | Width of a variable font with a `wdth` axis. Keywords only (the canvas font shorthand rejects percentages). |
| `fontSize` | px | |
| `textScaleX` | number (1 = none) | A *stretch* of the drawn glyphs, not a font property. Set by corner / Shift+side scaling. |
| `letterSpacing`, `lineHeight` | | |

**Everything builds one font string with `fontShorthand(weight, style, size, family, stretch)`**
(`utils/font-variants.ts`), or `getFontString(el)` (`utils/text-utils.ts`) for an element. The canvas,
the text-editing overlay (as CSS `font:`), measurement and the SVG renderer all consume that string,
so a new font property belongs there, not in each renderer.

## 2. Built-in fonts

Keys are **not** family names. `monospace` is Source Code Pro and `code` is JetBrains Mono.

| Key | Family | Weights | Italic | Create Outlines files |
| --- | --- | --- | --- | --- |
| `hand-drawn` | Handlee | 400 | – | 400 |
| `marker` | Permanent Marker | 400 | – | 400 |
| `caveat` | Caveat | 400–700 (variable) | – | 400, 700 |
| `sans-serif` | Inter | 100–900 (variable) | ✓ | 400, 700, italic 400 |
| `poppins` | Poppins | 100–900 (static, one file per weight) | ✓ | 400, 700, italic 400/700 |
| `serif` | Merriweather | 300–900 (variable) | ✓ | 400, 700, italic 400 |
| `monospace` | Source Code Pro | 200–900 (variable) | ✓ | 400, 700, italic 400/700 |
| `code` | JetBrains Mono | 100–800 (variable) | ✓ | 400, 700, italic 400/700 |

Where each fact lives:

- **CSS family per key:** `fontFamilyMap` in `utils/text-utils.ts`.
- **Weights per key:** `BUILTIN_FONT_WEIGHTS` in `config/builtin-fonts.ts`.
- **Italic / bold capability:** `fontCapabilities` in `config/properties.ts` (carries the weights too).
- **The stylesheet:** `BUILTIN_FONTS_CSS_URL` in `config/builtin-fonts.ts`, used by
  `frontend/index.html` (a literal copy, since HTML can't import), SVG export (`@import` in the
  SVG's `<defs>`), HTML export, and the SDK.
- **Outline binaries:** `frontend/public/fonts/outline/`, listed in `FONT_FILES` in
  `utils/text-to-outlines.ts`. Fetched lazily and excluded from the PWA precache.

`config/builtin-fonts.test.ts` keeps these honest: `index.html` must contain the URL verbatim, and
each key's weights must equal what the URL requests for that key's family (resolved through
`fontFamilyMap`). The second check exists because `monospace` and `code` once had each other's
ranges.

### Adding a built-in font

1. Add the key → CSS stack to `fontFamilyMap`, and a picker option to the `fontFamily` property.
2. Add the family to `BUILTIN_FONTS_CSS_URL` at its full range. **Check the URL returns 200**: a range
   wider than the family's axis (`wght@100..900` on a family that is 300–800) fails the *whole* request,
   so every built-in font would stop loading. Static families list their weights (`wght@100;200;…`).
3. Paste the new URL into `frontend/index.html` (the test will tell you if you forget).
4. Add `BUILTIN_FONT_WEIGHTS[key]` and `fontCapabilities[key]`.
5. For Create Outlines, add the 400 (and 700 / italic if the family has them) TTF or WOFF to
   `public/fonts/outline/` and `FONT_FILES`. opentype.js can't read WOFF2.
6. Run `bun test frontend/src/config/builtin-fonts.test.ts`.

## 3. Loading, and why measurement is the hard part

Text boxes are **sized from `measureText()` when they're created or when a font property changes,
and that size is saved in the document**. A measurement taken before the face has loaded measures
a *fallback* font and the wrong size is kept. Two mechanisms cover this:

- **Boot preload** (`utils/font-loading.ts`) calls `document.fonts.load()` for every built-in family at
  400, 700, italic 400 and italic 700. Only those. Other weights load on first use.
- **Re-fit after load** (`refitWhenFontLoads` in `store/app-store.ts`). When `updateElement` changes a
  font property on a text element (`FONT_METRIC_KEYS`, which includes `fontStretch`), it re-fits
  immediately *and* calls `document.fonts.load(fontString, text)`. When that resolves it fits again,
  writing the size only if it changed and without an undo step.

**Do not use `document.fonts.check()` to decide whether a face is ready.** Chromium returns `true`
for a face whose status is still `unloaded`. Measured: Poppins 100 `unloaded`, `check()` → true,
`measureText` 297.7 px (a system fallback) against 368 px once loaded. `load()` resolves immediately
when the face is already there, so just call it. Tests that need to know should read
`[...document.fonts].find(…).status`.

Variable families (Inter, Merriweather…) are one file for every weight, so once Regular has loaded
every weight is available. Static families (Poppins) have one file per weight, and that's where an
unloaded weight shows up. **Test with Poppins.**

The canvas also redraws on `document.fonts` `loadingdone` (`components/canvas.tsx`), so text drawn
in a fallback face is repainted once the real one arrives.

## 4. The Style menu

`groupFontFamilies()` (`utils/font-variants.ts`) turns the flat option list into families with styles:

| Source | Styles offered |
| --- | --- |
| Built-in with `weights` | One per weight, plus the same set in italic when the family has italics. The style rides on `fontWeight`/`fontStyle`; the key never changes. |
| Google font (by name) | Exactly the weights discovered for it (`CustomFont.weights`), italics if `CustomFont.italic`. |
| Variable font file (`weightRange`) | Every named weight inside the range. |
| Static font files | One style per file, parsed from the file name (`Montserrat-SemiBoldItalic`), grouped by family. |

The **B** button is a Regular ↔ Bold toggle on top of this (`normalizeFontWeight(v) >= 600` counts
as bold).

## 5. Fonts the user adds (`utils/custom-fonts.ts`)

Stored in `localStorage` (`yappy.customFonts.v1`) as `CustomFont` records. Keys are `custom-N` for
files and `google-<Family>` for Google fonts.

**Files** (.ttf/.otf/.woff/.woff2) are registered with `new FontFace(family, dataUrl, descriptors)`.
A variable file **must** declare its ranges, or the face is registered as weight 400 / width normal
only and every other request clamps:

- `weight: "<min> <max>"` from `weightRange`
- `stretch: "<min>% <max>%"` from `widthRange`

Both ranges are read from the font's `fvar` table by `utils/font-axes.ts` (`readFontWeightRange`,
`readFontWidthRange`; any axis via `readFontAxis`). TTF/OTF are read directly and WOFF by inflating
just the `fvar` table. WOFF2 is Brotli and can't be read in the browser, so the file name decides:
`…VariableFont_wght` → 100–900, `…_wdth` → 75–125 %.

**Google fonts by name.** `googleFontCssUrl(family)` requests **all nine weights plus italics as a
list** (`ital,wght@0,100;…;1,900`). Google answers a list with faces for only the styles the family
has (Lobster: 400; Open Sans: 300–800 and italics), whereas a range it doesn't span is a 400 error.
The stylesheet is fetched (Google sends `Access-Control-Allow-Origin: *`),
`parseGoogleFontFaces()` reads which weights came back, the CSS is injected as a `<style>`, and
the weights are stored on the record. If the fetch fails (offline) it falls back to a plain `<link>`
for 400/700.

## 6. Width (`fontStretch`)

- Offered only when the element's font has a width axis: the **Width** property has
  `visibleWhen: el => !!fontWidthRange(el.fontFamily)`.
- Rendered through the font shorthand (`… condensed 16px Family`), which the canvas honours: it
  selects the real `wdth` instance, provided the FontFace declared its stretch range.
- **Only for uploaded variable files.** Google fonts are loaded without a `wdth` request, and none of
  the built-ins has a width axis.
- Different from `textScaleX`, which stretches the drawn glyphs. `fontStretch` uses the font's own
  condensed and expanded designs.

## 7. Scaling text by hand (`utils/tool-handlers/selection-handler.ts`)

| Gesture | Effect |
| --- | --- |
| Corner drag | Font size follows the height; leftover width becomes `textScaleX`. |
| Shift + corner | Font size only (proportional). |
| Shift + left/right | `textScaleX` only (horizontal scale). |
| Shift + top/bottom | Font size follows the height and `textScaleX` compensates, so the width holds. |
| Left/right (no Shift) | Sets the wrap width; an auto-width box becomes fixed-width. |
| Top/bottom (no Shift) | Resizes the box; the text is unchanged. |
| Ctrl + side / corner | Shear / free distort (not text-specific). |

All four scaling rows go through `textCornerScaleUpdates(init, kx, ky)`. The Shift + side case is
flagged by `pState.textAxisScale`.

## 8. Export

- **PNG / JPG**: the canvas, so whatever renders.
- **SVG**:
  - The built-in stylesheet is `@import`ed in `<defs>`. Set it as raw `textContent`; the serializer
    escapes `&` itself, and pre-escaping gives `&amp;amp;`.
  - Text elements write `font-weight` (numeric), `font-style` and `font-stretch`, and so do shape
    labels (they wrote none of these before v0.8.269).
  - Shapes drawn through `SvgRenderer` get their font from the shorthand. `parseFont()` must keep the
    **numeric** weight and the stretch keyword: it used to collapse every weight to bold/normal.
- **HTML export / SDK**: link `BUILTIN_FONTS_CSS_URL`. User-added fonts are not embedded.

## 9. Create Outlines (`utils/text-to-outlines.ts`)

Converts text to paths with opentype.js. The outlines are permanent, so it **refuses** rather than
approximating:

| Font | Outlines | Refused with a message |
| --- | --- | --- |
| Built-in | 400 and 700 (and the italics listed in §2) | any other weight: add the static file |
| Uploaded static file | its own weight | – |
| Uploaded variable file | its default instance (usually 400) | other weights: opentype.js ignores variations |
| Google font | – | always: the browser gets WOFF2, which can't be parsed |

Why not fetch other weights from Google on demand: Google serves static per-weight **TTFs** only to
non-browser user agents (curl gets them); a real browser gets WOFF2 variable files, and
`User-Agent` is a forbidden header for `fetch`. Bundling every weight of every built-in would add
roughly 15 MB to the repository and the OSS mirror.

## 10. Scripting

```js
const Y = window.Yappy;
const t = Y.createText(100, 100, 'Hello', { fontFamily: 'poppins', fontSize: 48 });
Y.updateElement(t, { fontWeight: 200 });            // Poppins ExtraLight
Y.updateElement(t, { fontStyle: 'italic' });
Y.updateElement(t, { fontStretch: 'condensed' });   // only with a width axis
Y.updateElement(t, { textScaleX: 1.3 });            // stretch the drawn glyphs
```

`createText` sizes the box from an estimate and leaves it fixed-width. Set `autoResize: true` to have
the box follow the text.

## History

- v0.8.269: full weight ranges for the built-ins and Google fonts; the Width axis; Shift + side
  scaling; SVG keeps weights; Create Outlines refuses unbundled weights.
- Follow-up fixes: `monospace`/`code` weights swapped; the box re-fits once a newly picked weight loads.
