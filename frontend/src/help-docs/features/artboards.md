---
id: artboards
name: Artboards
icon: "▭"
category: Design
description: "Named export-region frames: presets, on-canvas move/resize/delete, and per-region PNG export"
---

# Artboards

An **artboard** is a named frame on the infinite canvas that marks a fixed-size export region — like a page or a screen. Lay out several side by side (a poster, an A4 sheet, a set of social posts) and export each one to its exact pixel dimensions.

## What it’s for

The canvas itself is infinite and unitless. Artboards add **bounded, named regions** with real dimensions so you can compose multiple deliverables in one document and export each at a precise size — without cropping by hand. They’re drawn as light frames *behind* your artwork and never appear in the exported image (only the content inside the region is exported).

:::tip
Artboards are a layout/export aid, not containers — objects aren’t “inside” an artboard, they just overlap its region. Anything within the frame’s bounds is what that artboard exports.
:::

## Add an artboard

Right-click empty canvas → **Artboards** → pick a preset (Square 1080, A4 Portrait / Landscape, Instagram Story, Web 1280, Slide 16:9), or **Artboard from Selection** to fit a frame around what you’ve selected. New artboards are placed to the right of any existing ones.

```
const Y = window.Yappy;
Y.addArtboard('Square 1080');      // 1080×1080 preset
Y.addArtboard('A4 Portrait', 1200, 0);
Y.addArtboard('selection');        // fit around the current selection
```

## Move, resize & delete

Each artboard shows a small **name chip** (with its live width × height) at its top-left corner:

- **Move** — drag the name chip.
- **Select** — click the chip; the frame gains 8 **resize handles** (corners + edge midpoints). Drag a handle to resize.
- **Delete** — the red **×** on the chip, or press **Delete / Backspace** while it’s selected.
- **Deselect** — click anywhere off the artboard, or press **Esc**.

:::tip
The frame is visual only — you can still draw *inside* a selected artboard; only the chip and handles respond to the pointer.
:::

## Export a region

Right-click empty canvas → **Artboards** → an artboard’s submenu → **Export PNG (2× / 1×)** to render just that region at the chosen scale. 2× gives a crisp, retina-resolution image.

```
const Y = window.Yappy;
const id = Y.addArtboard('Web 1280');
Y.exportArtboard(id, 2);   // download a 2× PNG of that frame
```

:::tip
API: `addArtboard(preset?, x?, y?)`, `renameArtboard(id, name)`, ` updateArtboard(id, patch)`, `deleteArtboard(id)`, ` listArtboards()`, `exportArtboard(id, scale)`.
:::

## Rearrange, duplicate & fit

**Rearrange All** lays every artboard out in a tidy grid (auto columns, or pass a count + gap). **Duplicate** copies a frame *and the artwork on it* to the right. **Fit to Artwork** shrink-wraps a frame to the content sitting on it — perfect for a logo lock-up with even clear space. **Paste on All Artboards** drops the selection onto every other artboard at the same relative position (great for a watermark or logo).

```
Y.rearrangeArtboards(3, 40);   // 3 columns, 40px gap (omit args = auto grid)
Y.duplicateArtboard(id);       // frame + its artwork, placed to the right
Y.fitArtboardToArtwork(id, 20);// resize to content + 20px padding
Y.pasteOnAllArtboards();       // copy the selection onto every artboard
```

:::tip
Print: set a **bleed** in Settings → Print Bleed (`Y.setBleed(20)`) to draw a bleed boundary + crop marks around each artboard.
:::

## Scripting (API)

The full artboard workflow is scriptable from the global `window.Yappy` object — add frames, rename/resize them, list them, and batch-export.

```
const Y = window.Yappy;

// add, rename, resize, inspect
const id = Y.addArtboard('Square 1080', 0, 0);
Y.renameArtboard(id, 'Cover');
Y.updateArtboard(id, { width: 1200, height: 1200 });
Y.listArtboards();               // [{ id, name, x, y, width, height }, …]

// tidy + export every frame at 2×
Y.rearrangeArtboards(3, 40);     // 3 columns, 40px gap
Y.listArtboards().forEach(a => Y.exportArtboard(a.id, 2));

Y.deleteArtboard(id);            // remove one frame
```

| Method | What it does |
| --- | --- |
| `addArtboard(preset?, x?, y?)` | Add a frame from a preset (or `'selection'`); returns its id. |
| `renameArtboard(id, name)` | Rename a frame. |
| `updateArtboard(id, patch)` | Patch position/size (`x,y,width,height`). |
| `deleteArtboard(id)` | Remove a frame. |
| `rearrangeArtboards(cols?, gap?)` | Lay every frame out in a grid. |
| `duplicateArtboard(id?, gap?)` | Copy a frame and its artwork. |
| `fitArtboardToArtwork(id?, pad?)` | Shrink-wrap a frame to its content. |
| `listArtboards()` | Return all frames as plain objects. |
| `exportArtboard(id, scale?)` | Download a PNG of just that region. |
