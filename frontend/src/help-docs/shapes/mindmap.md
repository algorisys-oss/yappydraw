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

1. Press <kbd>M</kbd> (or pick the **Mind Map** tool) and click to create a central topic
2. Use keyboard shortcuts to add child and sibling nodes
3. Or click the **＋** on a selected node to add a child with the mouse
4. Paste an indented / bulleted outline onto a node to build a whole subtree at once

:::tip Quick Start
Double-click on the canvas with the mind map tool to create a new root node and start building immediately.
:::

## Keyboard Shortcuts

:::shortcuts
Tab | Add child node (opens text editing)
Enter | Add sibling node (opens text editing)
Space | Toggle collapse/expand
Delete | Delete node and children
Arrow Keys | Navigate between nodes
F2 | Edit node text
:::

:::tip Keyboard-only flow
After a root exists, build the whole map without the mouse: press <kbd>Tab</kbd>/<kbd>Enter</kbd> to add a node — it drops straight into text editing so you can type its label. Press <kbd>Esc</kbd> to commit, then <kbd>Tab</kbd>/<kbd>Enter</kbd> again for the next. <kbd>F2</kbd> re-edits the selected node.
:::

## Build Faster

- **Paste an outline:** copy an indented or bulleted list (2-space, 4-space, or tab indentation all work) and paste it onto a selected node — each line becomes a node, nesting is preserved, and the new subtree is laid out tidily in one step.
- **Add-child handle:** a selected node shows a **＋** button on its right edge — click it to add a child (the mouse equivalent of <kbd>Tab</kbd>).
- **Collapsed counts:** a collapsed node shows a badge with the number of hidden descendants, so you know how much is tucked away.
- **Drag to reparent:** drag a node over another; a dashed preview branch shows the new connection before you drop.

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

Mind maps automatically reflow into a tidy arrangement every time you add, collapse, expand, delete, or reparent a node — and the change animates so the tree stays readable as it reorganizes. New maps use a **Balanced** layout (branches split left and right of the central topic); you can switch a tree to Horizontal, Vertical, or Radial from the property panel or right-click menu, and that choice is remembered. Collapsing a branch frees its space so the rest of the map packs in tighter.

Prefer to place nodes by hand? Turn off **Settings → Mindmap → Auto Layout** and nodes stay exactly where you put them.

### Manual Adjustment

- Drag nodes to reposition within their branch
- The layout will adapt to your changes
- Child nodes follow their parent when moved

### Layout Directions

| Direction | Description |
| --- | --- |
| **Radial** | Branches spread in all directions from center |
| **Right** | All branches extend to the right |
| **Left** | All branches extend to the left |
| **Down** | Branches flow downward (org chart style) |

## Collapsing Branches

Hide child nodes to focus on high-level structure or reduce visual clutter.

### How to Collapse

- Select a node and press <kbd>Space</kbd>
- Click the collapse indicator on the node
- Collapsed nodes show a badge indicating hidden children

:::tip Presentation Mode
Collapse branches before presenting, then progressively reveal content by expanding branches during your talk.
:::

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

`direction` is any layout: `balanced`, `radial`, `horizontal-right`, `horizontal-left`, `vertical-down`, or `vertical-up`.

### Growing a tree node-by-node

```
// Add a child to a node, then a sibling; re-layout + recolour the whole tree
const childId = Yappy.addChildNode(rootId);
const sibId   = Yappy.addSiblingNode(childId);
Yappy.setParent(sibId, rootId);          // reparent a node (null detaches it)

Yappy.reorderMindmap(rootId, 'radial');  // switch layout direction + reflow
Yappy.applyMindmapStyling(rootId);       // per-branch colour theme
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
