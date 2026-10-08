---
id: mindmap
name: Mind Maps
icon: "🧠"
category: Structure
description: Create hierarchical mind maps for brainstorming
seoTitle: "How to make a mind map online — free mind map maker"
seoDescription: "Build a mind map from a central idea outwards, with auto-arranged branches, colours and collapsible nodes. Free, in the browser, no signup."
---

# Mind Maps

Create hierarchical mind maps for brainstorming, note-taking, and organizing ideas. Yappy's mind map mode provides automatic layout and intuitive keyboard navigation.

## Getting Started

1. **Menu → New Mind Map** drops a ready-made central topic with four branches, already laid out and colour-themed. Pick **Sitemap** or **Random Words** from the same menu for the top-down and radial variants.
2. Or start from scratch: press <kbd>M</kbd> for the cloud central-topic shape (any shape works — rectangle, capsule, circle), draw it, and press <kbd>Enter</kbd> to label it.
3. Use keyboard shortcuts to add child and sibling nodes
4. Or click the **＋** on a selected node to add a child with the mouse
5. Paste an indented / bulleted outline onto a node to build a whole subtree at once

:::tip Quick Start
**New Mind Map** from the menu is the fastest start — you get a central topic and four branches to rename, rather than an empty canvas.
:::

## Keyboard Shortcuts

:::shortcuts
Tab | Add child node (opens text editing)
Enter | Add sibling node (opens text editing)
Space | Toggle collapse/expand
Delete | Delete the node and its whole subtree
Arrow Keys | Navigate between nodes (follows the layout)
Alt+Shift+Arrow | Reorder the node within its branch
Alt+Arrow | Nudge the node 1px (bare arrows navigate)
Shift+F | Focus this branch / show the whole map again
F2 | Edit node text
:::

:::tip Keyboard-only flow
After a root exists, build the whole map without the mouse: press <kbd>Tab</kbd>/<kbd>Enter</kbd> to add a node — it drops straight into text editing so you can type its label. Press <kbd>Esc</kbd> to commit, then <kbd>Tab</kbd>/<kbd>Enter</kbd> again for the next. <kbd>F2</kbd> re-edits the selected node.
:::

## Build Faster

- **Paste an outline:** copy an indented or bulleted list (2-space, 4-space, or tab indentation all work) and paste it onto a selected node — each line becomes a node, nesting is preserved, and the new subtree is laid out tidily in one step.
- **Add-child handle:** a selected node shows a **＋** button on its right edge — click it to add a child (the mouse equivalent of <kbd>Tab</kbd>).
- **Labels that fit:** commit a label too long for its box and the node grows taller to hold the extra lines (and wider only if a single word won't fit), then the tree reflows around the new size — text never spills over the branches. Turn on **Auto-resize** in the property panel if you'd rather the box shrink-wrap the text exactly.
- **Collapsed counts:** a collapsed node shows a badge with the number of hidden descendants, so you know how much is tucked away.
- **Drag to reparent:** drag a node over another; a dashed preview branch shows the new connection before you drop.
- **Reorder a branch:** <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Arrow</kbd> swaps a node with the sibling in that direction — up/down in a horizontal map, left/right in a vertical one, whichever way the layout stacks them. **Move Earlier** / **Move Later** in the right-click **Hierarchy** menu and the property panel do the same thing by position in the branch. The node's own subtree comes with it, and the new order survives a re-layout: it *is* the order, not just a position.

## Node Styles

Mind map nodes can use different container styles:

| Style | Description | Best For |
| --- | --- | --- |
| **Rectangle** | Standard box container | General topics, formal maps |
| **Rounded** | Soft, rounded corners | Friendly, creative maps |
| **Cloud** | Organic cloud shape | Brainstorming, ideas |
| **Circle** | Circular node | Central topics, emphasis |
| **Capsule** | Pill-shaped container | Modern, clean look |

## Branch Styles

The lines connecting nodes can have different appearances:

| Style | Description |
| --- | --- |
| **Organic** | Curved, hand-drawn looking branches |
| **Straight** | Direct lines between nodes |
| **Curved** | Smooth bezier curves |
| **Orthogonal** | Right-angle connections |

## Layout Options

### Auto Layout

Mind maps automatically reflow into a tidy arrangement every time you add, collapse, expand, delete, or reparent a node — and the change animates so the tree stays readable as it reorganizes. New maps use **Balanced** (branches split left and right of the central topic, which keeps the map widescreen rather than growing into one tall column); you can switch a tree to Horizontal, Vertical, or Radial from the property panel or right-click menu, and that choice is remembered per tree. Collapsing a branch frees its space so the rest of the map packs in tighter.

Auto layout and the default direction both live in **Settings → Mindmap**. Prefer to place nodes by hand? Turn **Auto Layout** off and nodes stay exactly where you put them.

### Manual Adjustment

- Drag nodes to reposition; child nodes follow their parent when moved
- To change the *order* of nodes within a branch, use <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Arrow</kbd> or **Move Earlier** / **Move Later** — dragging moves a node's position, which auto layout then recalculates, so it won't stick as a reorder
- With **Auto Layout** off, dragging is the whole story: nodes stay exactly where you put them

### Layout Directions

| Direction | Description | Best for |
| --- | --- | --- |
| **Balanced** | Branches split left and right of the central topic (the default) | Most maps — stays widescreen as it grows |
| **Radial** | Concentric rings around the centre, each branch given room in proportion to its size | Wheel-style maps, random-word exercises |
| **Horizontal (Right/Left)** | Every branch extends to one side, stacked vertically | Outlines, long single-sided lists |
| **Vertical (Down/Up)** | Branches flow top-down, leaf siblings packed tight | Org charts, sitemaps, breakdowns |

## Collapsing Branches

Hide child nodes to focus on high-level structure or reduce visual clutter.

### How to Collapse

- Select a node and tap <kbd>Space</kbd> (hold <kbd>Space</kbd> instead to pan)
- Click the collapse indicator on the node
- Collapsed nodes show a badge indicating how many descendants are hidden
- A collapsed branch reserves no space, so the rest of the map packs in tighter

:::tip Presentation Mode
Collapse branches before presenting, then progressively reveal content by expanding branches during your talk.
:::

## Focus Mode

Working on one branch of a dense map? Select a node and press <kbd>Shift</kbd>+<kbd>F</kbd> (or use **Focus This Branch** in the right-click **Hierarchy** menu, or the 🎯 button in the property panel). The branch, its path back to the central topic, and the connecting lines stay bright; everything else dims right back and becomes unclickable, so you can't accidentally grab something you can barely see. The view fits itself to the branch, and a bar across the top names what you're focused on.

Press <kbd>Esc</kbd> or <kbd>Shift</kbd>+<kbd>F</kbd> again — or click **Show all** on the bar — to bring the whole map back.

Focus mode is a *view* setting: nothing is moved or changed, it isn't saved into your file, and it doesn't appear in undo.

## Styling Mind Maps

### Color Coding

Use different colors to categorize branches or indicate importance:

- Each main branch can have its own color theme
- New nodes added with <kbd>Tab</kbd> (child) or <kbd>Enter</kbd> (sibling) inherit the source node's full style — font, size, bold/italic, text alignment and colour, fill, and corner rounding — so a branch stays visually consistent as you build it. (Stroke colour and width still follow the depth-based branch tapering.)
- Override individual node styles afterwards as needed

### Visual Hierarchy

- **Central topic** - Largest, most prominent
- **Main branches** - Medium size, bold colors
- **Sub-topics** - Smaller, lighter colors
- **Details** - Smallest nodes

## Common Use Cases

### Brainstorming

Rapidly capture ideas without worrying about organization. Add nodes quickly, reorganize later.

### Note Taking

Structure information hierarchically during meetings or lectures. Main points branch into details.

### Project Planning

Break down projects into phases, tasks, and sub-tasks. Visualize the scope at a glance.

### Knowledge Mapping

Organize and connect concepts for learning and retention. Show relationships between ideas.

### Decision Making

Map out options, pros/cons, and consequences for complex decisions.

## Taking a Map Out as Text

A map can leave as an outline as easily as it arrived as one. Right-click a node → **Hierarchy → Export Outline**, or use the 📄 button in the property panel, and pick a format:

| Format | Use it for |
| --- | --- |
| **Markdown** (`.md`) | Pasting into docs, READMEs, issue trackers, or an AI prompt. Nested `-` bullets. |
| **Indented text** (`.txt`) | Plain notes, or anything that reads indentation. |
| **OPML** (`.opml`) | Opening the map in FreeMind, Xmind, Workflowy and other outliners. |

Export starts from the node you picked, so you can take out one branch rather than the whole map. Markdown and indented text paste straight back in (see **Paste an outline** above), which makes the round trip lossless *for structure* — colours, shapes, fonts and positions aren't represented in an outline, and a collapsed branch still exports in full since collapse is only a view setting.

## Spacing

**Settings → Mindmap** has two gaps, both in pixels:

- **Branch Spacing** — how far apart whole subtrees sit (the vertical gap scales with it). Larger makes airier maps.
- **Leaf Spacing** — how far apart two neighbouring leaf nodes sit. Kept tighter than the branch gap on purpose, so a row of leaves packs together instead of each one claiming a whole subtree's width.

Switch a tree's layout (or add a node) after changing them to see the new spacing applied.

## Mind Mapping Tips

- **Start with the main idea** - Place your central concept in the middle
- **Use keywords** - Keep node text brief (1-3 words)
- **Add images** - Visual elements aid memory
- **Use colors meaningfully** - Create a consistent color scheme
- **Don't overthink** - Capture ideas first, organize later
- **Review and refine** - Reorganize branches as the map grows

## Scripting (API)

Mind maps have a dedicated API on the global `window.Yappy` object. The quickest way is `createMindMap`, which builds a laid-out, colour-themed tree in one call:

```
// Central topic with two branches (one has children)
const rootId = Yappy.createMindMap({
  x: 400, y: 300,
  title: 'Product Launch',
  direction: 'balanced',
  branches: [
    { label: 'Marketing', children: ['Ads', 'Social', 'PR'] },
    { label: 'Engineering', children: ['API', 'UI'] },
  ],
});
```

`direction` is any layout: `balanced`, `radial`, `horizontal-right`, `horizontal-left`, `vertical-down`, or `vertical-up`. `Yappy.getMindmapDefaults()` reports the `{ autoLayout, direction }` a new map will use.

### Growing a tree node-by-node

```
// Add a child to a node, then a sibling; re-layout + recolour the whole tree
const childId = Yappy.addChildNode(rootId, { text: 'Detail' });
const sibId   = Yappy.addSiblingNode(childId);
Yappy.setParent(sibId, rootId);          // reparent a node (null detaches it)

Yappy.reorderMindmap(rootId, 'radial');  // switch layout direction + reflow
Yappy.applyMindmapStyling(rootId);       // per-branch colour theme

// Deleting a node takes its subtree (and the branches drawn to it) in one undo step
Yappy.deleteElements([childId]);
```

### Taking the map out as text

```
// 'markdown' (nested "- " bullets) and 'text' (bare indented lines) both read back through
// mindmapFromOutline; 'opml' is the interchange format other outliners import.
const md = Yappy.mindmapToOutline(rootId, 'markdown');
Yappy.mindmapFromOutline(otherNodeId, md);        // straight back in

await Yappy.saveMindmapOutline(rootId, 'opml');   // same, plus a Save dialog
```

### Focus mode

```
Yappy.setFocusBranch(nodeId);   // dim + disable everything else, fit the view to this branch
Yappy.focusedBranch;            // the focused node id, or null
Yappy.toggleFocusBranch();      // what Shift+F does
Yappy.setFocusBranch(null);     // show the whole map again
```

### Layout spacing

```
Yappy.setMindmapSpacing({ spacing: 140, leafSpacing: 24 });   // px, both clamped
Yappy.reorderMindmap(rootId, 'balanced');                     // re-layout to apply it
Yappy.getMindmapDefaults();   // { autoLayout, direction, spacing, leafSpacing }
```

### Reordering a branch

```
// Position in the branch — 'earlier' / 'later', not a screen direction (which way that
// reads depends on the layout). Returns false at the ends of the row, and for a root.
Yappy.moveMindmapNode(nodeId, 'earlier');

// Or by screen direction, the way Alt+Shift+Arrow does it:
const above = Yappy.mindmapSiblingInDirection(nodeId, 'up');
if (above) Yappy.swapMindmapSiblings(nodeId, above);
```

Pass `{ animate: false }` to `addChildNode` / `addSiblingNode` when you need the reflow to finish
before the call returns — scripts and tests that read positions straight afterwards want this.

### Re-fitting a label set from script

```
// Setting containerText directly skips the editor, so re-fit the node yourself.
Yappy.updateElement(nodeId, { containerText: 'A much longer branch label' });
Yappy.fitMindmapNodeToText(nodeId);   // grow-only, then reflow the tree
```

### Build a subtree from an outline

```
// Indented / bulleted text becomes nested nodes under the given parent
Yappy.mindmapFromOutline(rootId, \`
Phase 1
  Research
  Prototype
Phase 2
  Build
  Test
\`);
```

:::tip
`createMindMap`, `addChildNode` and `addSiblingNode` all return the new node id(s), so you can chain further edits or pass them to `Yappy.updateElement(id, {...})`.
:::
