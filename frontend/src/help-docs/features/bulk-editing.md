---
id: bulk-editing
name: Bulk Editing
icon: "✏️"
category: Features
description: Select and edit multiple shapes at once with common property editing
---

# Bulk Editing & Selection

Yappy provides powerful tools for selecting multiple elements and editing their properties in bulk. This makes it easy to maintain visual consistency across diagrams with many shapes.

## Multi-Select Property Editing

When you select multiple shapes (Shift+click or drag a selection box), the Property Panel shows every property that **at least one selected element supports**.

- Editing a property applies it to the selected elements that **can** take it, and leaves the rest alone. So **Ctrl+A** then picking a Font restyles every label and text box in one go — the freehand strokes, images and other objects in the selection are simply skipped.
- The value shown, and the "Mixed" check, also consider only those elements — a stroke with no font of its own won't make the Font row read as mixed.
- If all the relevant elements share the same value, that value is displayed normally.
- If values differ, a **"Mixed"** indicator appears (badge, italic label, placeholder, or indeterminate checkbox).

The panel header shows **Selection (N)** with the count, and a summary of selected element types (e.g., "3 rectangle, 2 arrow"). Alignment and distribution controls are also available at the top of the panel.

## Select by Type

Right-click the canvas or any element to access the **Select by Type** submenu. This lets you quickly select all elements of a certain category or shape type.

| Option | Description |
| --- | --- |
| **All Lines & Arrows** | Select all line and arrow connectors |
| **All Text & Notes** | Select all text, rich text, and sticky note elements |
| **All Images / Videos** | Select all image or video elements |
| **All Shapes** | Select all non-linear, non-text, non-media shapes |
| **All Same Type** | Select all elements matching the type(s) of your current selection |
| **Per-type entries** | Individual type entries with counts (e.g., "rectangle (5)") |

## Select by Same Property

When a single element is selected, right-click to access the **Select by Same Property** submenu. This finds all elements on the canvas that share a specific property value with the selected element.

| Matchable Property | Example |
| --- | --- |
| Fill Color | Same Fill Color: #e03131 (7) |
| Stroke Color | Same Stroke Color: #000000 (12) |
| Text Color | Same Text Color: #333333 (5) |
| Stroke Width | Same Stroke Width: 2px (9) |
| Font Size | Same Font Size: 16px (4) |
| Font Family | Same Font Family: sans-serif (6) |
| Opacity | Same Opacity: 100% (15) |
| Fill Style | Same Fill Style: solid (10) |
| Stroke Style | Same Stroke Style: dashed (3) |
| Drawing Style | Same Drawing Style: sketch (8) |

## Typical Workflow

1. **Select by type or property** — Right-click → "Select by Type" → "All Lines & Arrows", or "Select by Same Property" → "Same Fill Color"
2. **Review selection** — Property panel shows common properties with mixed value indicators
3. **Bulk edit** — Change any property (color, font, stroke, etc.) to apply it to all selected elements

## Tips

- Hold **Shift** and click to add/remove elements from the current selection.
- Use **Ctrl+A** to select all elements, then use the property panel to change shared properties. If a drawing tool was active, Ctrl+A switches you to the Selection tool so the selection can be dragged, resized and edited straight away — press your tool's shortcut (**7** for the freehand brush) to go back to drawing.
- The "Mixed" indicator tells you at a glance which properties vary across your selection.
- You can combine Select by Type with manual Shift+click to refine your selection before bulk editing.

## Scripting (API)

The same select-then-restyle workflow is scriptable from the global `window.Yappy` object. Use **Magic Wand** (`selectSimilar`) to grow a selection by a shared property, then loop over `getSelection()` and call `updateElement` to apply a bulk change.

```
const Y = window.Yappy;

// select every object that shares the first selected object's fill
Y.selectSimilar();

// match a different property (from a specific reference object)
Y.selectSimilar('rect-3', 'stroke');   // 'fill' | 'stroke' | 'both' |
                                       // 'fontFamily' | 'fontSize' | 'opacity' |
                                       // 'strokeWidth' | 'type'
```

Bulk-edit the current selection by updating each element:

```
const Y = window.Yappy;

// grab all blue shapes, then recolour + thicken them together
Y.selectSimilar(undefined, 'fill');
Y.getSelection().forEach(id =>
    Y.updateElement(id, { backgroundColor: '#e03131', strokeWidth: 3 })
);

// or set the selection explicitly by id
Y.setSelected(['rect-1', 'rect-2']);
```

| Method | What it does |
| --- | --- |
| `selectSimilar(refId?, match?)` | Grow the selection to objects sharing a property (Magic Wand). |
| `getSelection()` | Return the ids of the currently selected elements. |
| `setSelected(ids)` | Replace the selection with the given ids. |
| `updateElement(id, patch)` | Apply a property patch to one element (loop for bulk). |
