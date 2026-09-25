---
id: doodles
name: Doodles (Pattern Generator)
icon: "〰️"
category: Features
description: "Seeded, knob-driven patterns that fill a page — Truchet tiles, flow-field lines and contour maps — as a few editable, recolourable paths you can reopen and change later"
keywords: doodle doodles generator generative pattern patterns truchet tiles arcs maze flow field streamlines lines topography contour contours map landscape seed reroll random variations knobs colouring coloring page line art palette paper ink fill background texture art generative-art createDoodle updateDoodle getDoodle
---

# Doodles — generated patterns

A doodle is a pattern that fills a page: **Truchet** tiles that weave into long lines, a
**Flow Field** of evenly spaced streamlines, or the contour lines of an imaginary
**Topography**. Pick one, turn its knobs, reroll until you like it, and colour it. It stays a
doodle afterwards, so you can reopen it and change any of that later.

:::note
**Doodles are still being built, so they live behind Dev Mode.** Turn on **Settings ▸ General ▸
Dev Mode** to see the menu entries below. The `Yappy.*Doodle` APIs, and doodles already in a
document, work either way.
:::

## Making one

1. Open the main menu (☰) → **Doodle Generator…**, right-click empty canvas → **Insert →
   Doodle…**, or open the command palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>) and run
   **Doodle Generator…**
2. A page-shaped doodle appears in the middle of the view and the Doodle panel opens beside it.
   **Everything you change shows on the canvas straight away**, in your current drawing style
   (sketch wobble included).
3. Press **Done** to keep it, or **Cancel** (or <kbd>Esc</kbd>) to put everything back as it was.

The next doodle you make starts from the settings you last used, with a new seed.

## The panel

- **Generator:** *Truchet*, *Flow Field* or *Topography*. Switching resets the knobs to that
  generator's defaults.
- **Pattern:** the knobs for this generator.
  - *Truchet*: **Tile size**, **Lines per tile**, **Style** (arcs, diagonal chords, or a mix),
    and **Shade corners**, which fills the innermost corner of each tile with *Fill 1* / *Fill 2*.
  - *Flow Field*: **Spacing** between lines, **Line length**, **Curl** (how many swirls fit across
    the page), and an optional **Dot at each start**.
  - *Topography*: number of **Contours**, **Hill size**, **Detail**, and **Bold every** *N*th
    contour (0 for none), the way index lines are drawn on a real map.
- **Seed:** the same seed and the same knobs always give the same doodle. **Reroll** picks a new
  seed and keeps the knobs. Type a seed in to get a doodle back exactly.
- **Variations:** six nearby designs (new seeds, knobs nudged a little). Click one to use it, or
  **More** for another six.
- **Colour:** a doodle is painted by *role*: **Paper** (an optional backdrop; untick *show* to
  leave the canvas bare), **Ink** (the lines), **Fill 1** and **Fill 2**. The swatches at the top
  set all four at once. **Line weight** sets the ink width (bold contours are drawn at twice
  that), and **Line art only** drops the fills, which leaves a colouring page.

## Editing it later

Select the doodle, right-click → **Edit Doodle…** The panel opens with its current settings, and
the same Done/Cancel rules apply.

- **Moved or resized it?** It regenerates where it is now. The pattern re-lays at its own scale
  rather than stretching.
- **Duplicated it?** The copy is a separate doodle, so editing one leaves the other alone.
- A doodle is a **group** of a few paths, one per colour role, so you can also recolour a single
  role directly, e.g. select into the group and change the ink. The next *Edit Doodle…* repaints
  it from the panel's colours.

:::note
**Good to know**
- **Rotated doodles stay rotated.** Editing one rebuilds it at the same angle and centre.
- **Ungrouping ends it.** Once ungrouped, the paths are ordinary paths and *Edit Doodle…* no
  longer appears for them together. Group them again and they are still ordinary paths.
- **Very large doodles take a moment to rebuild.** A doodle several screens across is tens of
  thousands of curve points, so each knob change takes a fraction of a second. Once built,
  panning and zooming reuse it, in both drawing styles.
:::


## API

```js
// kind, x, y, width, height, options → returns a member id
const id = Yappy.createDoodle('truchet', 0, 0, 420, 594, {
  seed: 42,                                   // omit for a random one
  params: { tileSize: 36, lines: 3, style: 'mixed', shade: true },
  palette: { paper: '#f6ede3', ink: '#5b3a29', fill1: '#c8553d', fill2: '#f0b67f' },
  lineWeight: 1.5,
  colouring: false,                           // true = line art only
});

Yappy.updateDoodle(id, { seed: 7 });                    // any subset of the options above
Yappy.updateDoodle(id, { kind: 'topography' });         // switch generator (its defaults)
Yappy.getDoodle(id);   // { id, spec, palette, lineWeight, colouring, elementIds }
Yappy.doodleGenerators; // kinds, tags and every param with its range and default
```

`updateDoodle` returns a member id to use from then on (a change that adds or removes a colour
role replaces the elements), or `null` if the id isn't part of a doodle. Out-of-range params are
clamped and unknown ones ignored, so an old or hand-written spec can't break a doodle.
