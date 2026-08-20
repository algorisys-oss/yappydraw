---
id: ysl-tutorial
name: YSL Tutorial
icon: "{}"
category: Features
description: Create diagrams from text using the Yappy Scripting Language
---

# YSL — Yappy Scripting Language

YSL is a compact text format for creating diagrams. Write plain text and Yappy renders it as a fully interactive diagram with automatic layout, connectors, and styling. Open the import dialog with <kbd>Ctrl+Shift+I</kbd> or **File > Import from Text**.

## How to run it (in the app)

You don't need the console to use YSL — it's built into the menu:

1. Open the import dialog: **Menu → Import from Text**, or press <kbd>Ctrl+Shift+I</kbd>.
2. **Paste your YSL** (or JSON / Mermaid) into the text box. A badge shows the format Yappy detected — *Text DSL*, *JSON*, *Mermaid*, or *Markdown → Slides*.
3. Optionally pick a **Layout** from the dropdown to override the ` layout:` in your frontmatter.
4. Click **Import Diagram**. Yappy creates the shapes, wires up the connectors, and auto-arranges everything on the canvas.
5. Nothing happens? Check the syntax against the examples below — every non-blank line must be a node, an edge, or frontmatter.

:::tip
Some built-in templates open this same dialog pre-filled with their YSL, so you can tweak the text and re-import to see the diagram change.
:::

## Quick Start

A minimal flowchart in 6 lines:

```
---
title: My First Diagram
layout: tree-down
---

start [circle] "Start"
login [rect] "Login"
check [decision] "Valid?"
ok [rect] "Dashboard"

start -> login
login -> check
check -> ok "Yes"
```

Paste this into the import dialog and click **Import**. Yappy creates the shapes, connects them with arrows, and auto-arranges everything using a top-down tree layout.

## Frontmatter

The `---` delimited header sets diagram-level options:

```
---
title: My Diagram
layout: tree-down
hSpacing: 120
vSpacing: 80
columns: 3
---
```

| Key | Values | Description |
| --- | --- | --- |
| `title` | Any text | Diagram title (metadata) |
| `layout` | `tree-down`, `tree-right`, `tree-up`, `tree-left`, `grid`, `radial`, `mindmap-right`, `sequence`, `manual` | Auto-layout strategy |
| `hSpacing` | Number (default: 100) | Horizontal gap between nodes |
| `vSpacing` | Number (default: 80) | Vertical gap between nodes |
| `columns` | Number | Column count for grid layout |
| `targetWidth` | Number (px) | Lay out to fit this width — fewer columns, more rows. Nothing is scaled down, so content that cannot fit stays wide. `grid` and `byte-grid` only. |

## Nodes

The basic node syntax:

```
nodeId [shape] "Label" { style }
```

Only `nodeId` is required. Shape defaults to `rect`, label and style are optional.

### Examples

```
# Minimal node
a [rect] "Hello"

# Shape + label
db [database] "Users DB"

# With inline style
warn [rect] "Warning" { backgroundColor: "#fef9c3", strokeColor: "#ca8a04" }

# Custom size
big [rect] "Large Box" { width: 300, height: 200 }
```

:::tip Comments
Lines starting with `#` are comments and are ignored.
:::

## Shape Reference

Use any of these shape names in brackets. Aliases map to Yappy's built-in shapes.

### Flowchart

| Alias | Shape |
| --- | --- |
| `rect`, `box`, `process` | Rectangle |
| `oval`, `ellipse` | Circle / Ellipse |
| `decision`, `condition` | Diamond |
| `io` | Parallelogram (I/O) |
| `terminal` | Capsule (start/end) |
| `subroutine` | Predefined Process |

### BPMN

| Alias | Shape |
| --- | --- |
| `start-event` | BPMN Start Event |
| `end-event` | BPMN End Event |
| `task` | BPMN Task |
| `gateway`, `xor-gateway` | Exclusive Gateway |
| `and-gateway` | Parallel Gateway |
| `pool` | BPMN Swimlane Pool |

### UML

| Alias | Shape |
| --- | --- |
| `class` | UML Class |
| `interface` | UML Interface |
| `actor` | UML Actor (stick figure) |
| `state` | UML State |
| `lifeline` | UML Lifeline |

### Infrastructure

| Alias | Shape |
| --- | --- |
| `db` | Database |
| `server` | Server |
| `lb` | Load Balancer |
| `queue` | Message Queue |
| `firewall` | Firewall |
| `browser` | Browser |
| `k8s` | Kubernetes |

### Data Structures

| Alias | Shape |
| --- | --- |
| `array` | Array |
| `stack` | Stack |
| `ds-queue` | Queue |
| `linked-list` | Linked List |
| `binary-tree` | Binary Tree |
| `hash-table` | Hash Table |

### Common

| Alias | Shape |
| --- | --- |
| `note`, `sticky` | Sticky Note |
| `text` | Text label |
| `table` | Table |
| `code` | Code Block |
| `cloud`, `hexagon`, `star`, `triangle`, `heart`, `cylinder` | Basic shapes |

:::tip Direct Type Names
You can also use any Yappy `ElementType` name directly, e.g. `[bpmnStartEvent]`, `[umlClass]`, `[dsArray]`.
:::

## Edges (Connectors)

Connect nodes using edge operators:

```
fromId -> toId "label" { style }
```

| Operator | Type | Description |
| --- | --- | --- |
| `->` | Arrow | Straight arrow (default) |
| `--` | Line | Plain line, no arrowhead |
| `~>` | Bezier arrow | Smooth curved arrow |
| `=>` | Elbow arrow | Right-angle connector |

### Edge Labels and Styling

```
a -> b "Yes" { strokeColor: "#16a34a", strokeWidth: 3 }
a -> c "No" { strokeColor: "#dc2626" }
x -- y
p ~> q "Curved"
r => s "Elbow"
```

### Edge Arrowheads (UML relations)

Set `startArrowhead` / `endArrowhead` in an edge's ` { } ` block to decorate either end — handy for hand-built UML relations. Values: `arrow`, `triangle` (inheritance), `diamond` (aggregation), `diamondFilled` (composition), `circle`, `dot`, `bar`, or `none` for a bare end.

```
sub  -> base  { endArrowhead: triangle }        # inheritance
part -> whole { endArrowhead: diamondFilled }   # composition
a    -> b     { startArrowhead: none, endArrowhead: arrow }
```

## Inline Styling

Add `{ key: value, key: value }` after a node or edge to style it. String values with commas or special characters must be quoted.

### Supported Style Properties

| Category | Properties |
| --- | --- |
| Fill & Stroke | `backgroundColor`, `strokeColor`, `strokeWidth`, `strokeStyle` (solid/dashed/dotted), `opacity`, `borderRadius` |
| Text | `fontFamily`, `fontSize`, `fontWeight`, `textColor`, `textAlign` |
| Text Highlight | `textHighlightEnabled`: true, `textHighlightColor` |
| Gradient | `gradientPreset` (e.g. "ocean"), `gradientDirection` |
| Shadow | `shadowEnabled`: true, `shadowColor`, `shadowBlur` |
| Size | `width`, `height` |

### Styling Example

```
start [circle] "Go" {
  backgroundColor: "#dcfce7",
  strokeColor: "#16a34a",
  shadowEnabled: true,
  shadowColor: "#16a34a",
  shadowBlur: 12
}
```

## Layout Strategies

Set `layout` in the frontmatter to control automatic positioning:

| Layout | Best For | Description |
| --- | --- | --- |
| `tree-down` | Flowcharts | Root at top, branches flow down |
| `tree-right` | Mind maps, org charts | Root at left, branches flow right |
| `tree-up` | Bottom-up trees | Root at bottom, branches flow up |
| `tree-left` | Right-to-left flows | Root at right, branches flow left |
| `radial` | Topic maps | Root at center, branches radiate outward |
| `mindmap-radial` | Mind maps | Central node, branches split dual-side (left/right) — auto pill nodes, per-branch colour, curved links |
| `mindmap-down-curved` | Mind maps | Top-down, curved branch connectors + per-branch colour |
| `mindmap-down-straight` | Mind maps | Top-down, straight connectors + per-branch colour |
| `grid` | Showcases, catalogs | Row-major grid with configurable columns |
| `byte-grid` | Bit and byte diagrams | A run of cells grouped into named spans — a float's sign/exponent/mantissa, a header's magic bytes. One node per span, sized by `properties.bits` / `bytes` / `cells`, with an optional hex or decimal offset gutter. JSON form only: the text syntax has no way to declare a span size |
| `sequence` | Sequence diagrams | Lifelines left-to-right, messages vertical |
| `manual` | Free placement | Uses explicit x/y positions or auto-grid fallback |

## Sequence Diagrams

With `layout: sequence`, participants become lifelines (or actors) laid out left-to-right, and edges become time-ordered messages flowing top to bottom. Beyond plain messages you can add activation bars, combined fragments (loop / alt / opt / par), notes and auto-numbering.

### Message arrows

| Operator | Meaning |
| --- | --- |
| `->>` | Synchronous call — solid line, filled arrowhead |
| `-->>` | Reply / return — dashed line, filled arrowhead |
| `->` / `-->` | Open arrow — solid / dashed |
| `a ->> a "label"` | Self message (loops back on the same lifeline) |

### Structure keywords

| Keyword | Effect |
| --- | --- |
| `autonumber` | Prefix every message with an incrementing number |
| `activate id` / `deactivate id` | Start / end an activation bar on a lifeline |
| `loop "label"` … `end` | Repeat fragment |
| `alt "cond"` … `else "other"` … `end` | Alternatives with a divider |
| `opt "cond"` / `break "cond"` … `end` | Optional / break fragment |
| `par "a"` … `and "b"` … `end` | Parallel branches |
| `note over a,b "text"` | Note spanning one or more lifelines (also `left`/`right`) |

```
---
title: Login Flow
layout: sequence
hSpacing: 200
vSpacing: 60
---

autonumber
user    [actor]    "User"
gateway [lifeline] "API Gateway"
auth    [lifeline] "Auth Service"

user ->> gateway "POST /login"
activate gateway
loop "retry up to 3x"
  gateway ->> auth "Validate"
  auth -->> gateway "200 OK"
end
alt "valid"
  gateway -->> user "Welcome"
else "invalid"
  gateway -->> user "401"
end
note over gateway,auth "token cached 15m"
deactivate gateway
```

## Indentation Hierarchy (Mind Maps)

Use indentation to create parent-child relationships. Edges are auto-generated. Combine with `tree-right` or `radial` layout.

```
---
title: Project Plan
layout: tree-right
---

root [rect] "Project"
  design [rect] "Design"
    ui [rect] "UI/UX"
    arch [rect] "Architecture"
  develop [rect] "Development"
    frontend [rect] "Frontend"
    backend [rect] "Backend"
  testing [rect] "Testing"
    unit [rect] "Unit Tests"
    e2e [rect] "E2E"
```

Indented nodes become children of the nearest less-indented node above them. Connectors and toggle (expand/collapse) icons are added automatically.

## BPMN Pools & Swimlanes

Declare pools and lanes, then assign nodes with the `@poolId/laneId` syntax:

```
---
title: Order Process
layout: tree-right
---

pool sales "Sales Department"
  lane rep "Sales Rep"
  lane mgr "Manager"

pool warehouse "Warehouse"
  lane picker "Picker"
  lane shipper "Shipper"

start [start-event] "Order" @sales/rep
review [task] "Review" @sales/rep
approve [gateway] "OK?" @sales/mgr
pick [task] "Pick Items" @warehouse/picker
ship [task] "Ship" @warehouse/shipper

start -> review
review -> approve
approve -> pick "Yes"
pick -> ship
```

## Data Structure Shapes

Data structure shapes accept a `dsValues` property with comma-separated values. Quote the value string if it contains commas.

```
---
layout: grid
columns: 3
---

arr [array] "My Array" {
  width: 300, height: 80,
  dsValues: "10, 20, 30, 40, 50",
  dsShowIndices: true
}
stk [stack] "Call Stack" {
  width: 120, height: 200,
  dsValues: "main, foo, bar"
}
ht [hash-table] "Config" {
  width: 200, height: 180,
  dsValues: "host:localhost, port:3000, env:dev",
  dsCapacity: 5
}
```

## Mermaid Import

The import dialog auto-detects Mermaid syntax. Paste any Mermaid diagram and Yappy converts it to interactive shapes:

```
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
```

Supported Mermaid diagram types:

- **Flowchart** — `graph TD`, `graph LR`
- **Sequence** — `sequenceDiagram`
- **Class** — `classDiagram`
- **State** — `stateDiagram-v2`

## Console API

Import YSL and Mermaid diagrams programmatically from the browser console:

```
// Import YSL text
Yappy.importDSL(\`
---
layout: tree-down
---
a [rect] "Hello"
b [circle] "World"
a -> b
\`);

// Import with options
Yappy.importDSL(yslText, {
    clearCanvas: true,   // Clear existing elements first
    offsetX: 200,        // Shift diagram right
    offsetY: 100,        // Shift diagram down
    zoomToFit: true      // Auto-zoom (default: true)
});

// Import Mermaid
Yappy.importMermaid(\`graph TD
    A --> B --> C
\`);
```

## UML Class Members

Give a `[class]` (or `[interface]`) node attribute and method compartments with `attributes:` and `methods:` keys inside its `{ … }` block. Separate members with a semicolon (`;`):

```
Subject [class] "Subject" {
  attributes: "-observers: List",
  methods: "subscribe(o); notify(data)"
}
```

The equivalent Mermaid `classDiagram` block works too — both the same-line brace (`class Subject {`) and the brace on the next line are accepted, and each relationship arrow renders its proper UML arrowhead (see the UML shapes help).

## Colour Palettes

Declare named colour roles once, then refer to them from any style with `@name`. Each role becomes a document swatch and every element using it is **linked** to that swatch, so recolouring the role (in the Swatches panel, or via `Yappy.updateSwatchColor`) updates the whole diagram at once.

```
{
  "version": 1,
  "palette": {
    "danger": "#ef4444",
    "live":   { "light": "#2563eb", "dark": "#60a5fa" }
  },
  "layout": { "strategy": "grid", "columns": 2 },
  "nodes": [
    { "id": "a", "shape": "rectangle", "label": "freed",
      "style": { "backgroundColor": "@danger" } },
    { "id": "b", "shape": "rectangle", "label": "allocated",
      "style": { "backgroundColor": "@live", "strokeColor": "@danger" } }
  ],
  "edges": []
}
```

Roles work on `backgroundColor` and `strokeColor` (both linked), and on `textColor`, `textHighlightColor`, `shadowColor` and `innerBorderColor` (resolved, but not linked, since elements have no swatch field for those). The object form's `dark` colour is used by the themeable SVG export below. An unknown role is left as-is with a console warning rather than failing the render.

## Reproducible Renders

Sketch style feeds each element's `seed` into rough.js, so the same source normally draws slightly different lines every time. Set `meta.seed` and every element's seed becomes a pure function of the diagram seed and the element's id, which makes a render byte-identical run to run. That is what lets a build cache, diff, or review generated SVG.

```
{ "version": 1, "meta": { "seed": 2026 }, ... }

// pin one element regardless of the diagram seed:
{ "id": "a", "shape": "rectangle", "style": { "seed": 424242 } }
```

Seeds are keyed by node id, so adding or reordering a node does not reshuffle its siblings' geometry. Leave `meta.seed` unset for the normal interactive behaviour of a fresh random seed per element.

## Headless SVG Export (CLI)

Render a `.ysl` / `.mmd` file to SVG from the terminal — handy for batch or CI diagram generation. It boots a headless browser, imports the DSL, and writes the exported SVG:

```
npm run render:dsl -- diagram.ysl -o diagram.svg

# against an already-running instance, or to stdout:
npm run render:dsl -- diagram.mmd --url http://localhost:5173 -o -
```

Pass several sources with `-d` to render them all in **one** browser session. Booting Chromium and warming the webfonts costs far more than drawing a diagram, so a batch is dramatically faster than one invocation per file:

```
npm run render:dsl -- src/*.ysl -d dist/ --theme variables

# or read the list from a file (JSON array, or one path per line):
npm run render:dsl -- --manifest diagrams.txt -d dist/ --keep-going
```

Other flags: `--var-prefix` renames the CSS custom properties, `--keep-going` continues past a bad source instead of stopping, and `--selected` exports only the selection. Exit codes are `0` success, `1` usage or IO error, `2` render failure.

## Themeable SVG Export

A normal SVG export bakes literal colours, so a diagram exported from a light canvas stays light forever — including when embedded in a dark page. Export with `theme: 'variables'` and any *swatch-linked* colour becomes a CSS custom property instead, keeping the hex as its fallback:

```
Yappy.exportSVG(false, { theme: 'variables' });

// in the output:
//   fill="var(--yd-danger, #ef4444)"
//
//   :root { --yd-danger: #ef4444; --yd-live: #2563eb; }
//   @media (prefers-color-scheme: dark) {
//     :root { --yd-live: #60a5fa; }
//   }
```

Swatches with a `darkColor` (set from a palette's `dark` value) get the `prefers-color-scheme` override, which is what makes one file work on both a light and a dark page. A themed export leaves the background **transparent**, since the embedding page owns it. Pass `{ varPrefix: 'bx' }` to rename the properties. Both render styles are supported. Colours that are not linked to a swatch are exported literally, so only what you named is themeable.

## Complete Example

A styled flowchart demonstrating multiple features:

```
---
title: Styled Flowchart
layout: tree-down
---

# Rich formatting: gradients, shadows, rounded corners
start [circle] "Start" {
  backgroundColor: "#dcfce7",
  strokeColor: "#16a34a",
  shadowEnabled: true,
  shadowBlur: 12
}
input [parallelogram] "User Input" {
  backgroundColor: "#dbeafe",
  strokeColor: "#2563eb",
  fontSize: 16
}
validate [decision] "Valid?" {
  backgroundColor: "#fef9c3",
  strokeColor: "#ca8a04",
  strokeWidth: 3
}
process [rect] "Process Data" {
  gradientPreset: "ocean",
  borderRadius: 15
}
error [rect] "Error" {
  backgroundColor: "#fecaca",
  strokeColor: "#dc2626"
}
end [circle] "Done"

start -> input
input -> validate
validate -> process "Yes" { strokeColor: "#16a34a" }
validate -> error "No" { strokeColor: "#dc2626" }
error -> input "Retry"
process -> end
```

## Tips

- Use <kbd>Ctrl+Shift+I</kbd> to open the import dialog quickly
- The dialog auto-detects YSL vs Mermaid vs JSON format
- Toggle **Clear canvas** to replace or append to existing elements
- Node IDs must be unique within a diagram — use short, descriptive IDs
- Edge labels are optional: `a -> b` works without a label
- Blank lines and `#` comments help organize large diagrams
- For complex inline values with commas, wrap the value in quotes: `dsValues: "a, b, c"`
