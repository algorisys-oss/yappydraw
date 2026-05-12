# Yappy

**Yappy** is an infinite canvas drawing and diagramming application built with SolidJS. Create hand-drawn style diagrams, architecture sketches, mindmaps, wireframes, presentations, and whiteboard illustrations with 100+ shape types and a full-featured toolset.

## How YappyDraw Is Developed

YappyDraw is **vibe-architected** by **Rajesh Pillai**, with every major architectural decision, abstraction, and convention consciously designed and reviewed by an experienced engineer.

This is **not** a prompt-generated demo or a throwaway experiment.

The project has been built over **~300+ focused engineering hours across ~40 active days** (1000+ commits), with continuous iteration, refactoring, and manual review of *every* critical code path. While AI was used as an accelerator, **all structure, boundaries, and correctness decisions were human-driven**.

---

### Architecture First, Code Second

YappyDraw was approached as a **real software system**, not a canvas toy.

Key architectural goals included:

- Clean separation between rendering, interaction, state, tools, and persistence
- Predictable and debuggable data flows (no hidden magic)
- Long-term extensibility for connectors, layers, API-driven drawing, and DSLs
- Performance-aware design suitable for large canvases and complex drawings
- Readable code that a human can reason about months later

Every module, folder structure, naming convention, and pattern was **intentionally chosen**, not auto-accepted.

---

### AI as a Tool, Not the Architect

This project is also a deliberate experiment in evaluating how effective AI-assisted coding can be **when guided by an experienced architect**.

AI was used to:

- Explore implementation options
- Speed up boilerplate and repetitive logic
- Validate ideas and generate alternatives

AI was *not* allowed to:

- Define system boundaries
- Choose core patterns
- Decide state ownership or data models
- Introduce clever abstractions without justification

All generated code was **reviewed, rewritten, simplified, or rejected** where necessary.

> The architecture is human.  
> AI is a power tool, not the brain.

---

### Complexity Hidden Behind Simplicity

What appears visually simple in YappyDraw is backed by:

- Non-trivial canvas math and coordinate transformations
- Interaction systems that balance responsiveness with correctness
- Careful state management to avoid redraw storms and lag
- Forward-compatible design for API-based drawing and automation

The goal was **quiet complexity** — software that feels simple *because* the hard thinking is already done.

---

### Open Source, With Standards

YappyDraw is currently in testing and review by the **Open Source Team at Algorisys**.

The intent is not just to ship features, but to demonstrate how **modern, AI-assisted software should be built**:

- With ownership
- With taste
- With architectural discipline
- With respect for future maintainers

This project stands as proof that **beautiful, complex software still requires experienced engineers** — AI simply helps them move faster, not think for them.


## Features

### Drawing & Shape Tools

| Category | Tools |
|----------|-------|
| **Basic Shapes** | Rectangle, Circle, Diamond, Triangle, Hexagon, Octagon, Star, Cloud, Heart, Capsule, Polygon (parametric), and more |
| **Connectors** | Arrow, Line, Bezier Curve, Polyline (multi-click), Organic Branch (tapered mindmap connector) |
| **Pen Tools** | Fine Liner, Ink Brush, Marker |
| **Text** | Rich text with font selection, sizing, alignment, highlight backgrounds |
| **Images** | Insert, resize, and compress images on canvas |
| **Flowchart** | Database, Document, Predefined Process, Internal Storage |
| **Infrastructure** | Server, Load Balancer, Firewall, Router, Lambda, Message Queue, Browser |
| **Cloud & Containers** | Kubernetes, Container, API Gateway, CDN, Storage Blob, Microservice, Shield |
| **UML** | Class, Interface, Actor, Use Case, Note, Package, Component, State, Lifeline, Fragment, Signal Send/Receive |
| **Data & Metrics** | Bar Chart, Pie Chart, Trend Up/Down, Funnel, Gauge, Table |
| **Wireframe** | Browser Window, Mobile Phone, Ghost Button, Input Field |
| **Sketchnote** | Star Person, Lightbulb, Trophy, Rocket, Flag, Gear, Target, Signpost, Scroll, and more |
| **People** | Stick Figure, Sitting/Presenting Person, Thumbs Up, Happy/Sad/Confused Faces |
| **Status** | Checkbox, Numbered Badge, Question/Exclamation Mark, Tag, Pin, Stamp |
| **Connection** | Puzzle Piece, Chain Link, Bridge, Magnet, Scale, Seedling, Tree, Mountain |
| **3D / Technical** | Isometric Cube, Solid Block, Perspective Block, Open Box (with lid animation), Cylinder, DFD Process/Data Store |
| **State Machine** | Start/End states, Sync Bar, Activation Bar |
| **Math / Geometric** | Trapezoid, Right Triangle, Pentagon, Septagon |

### Connectors & Binding

- **Magnetic snap** — endpoints auto-bind to shape anchors (top, right, bottom, left)
- **Smart elbow routing** — automatic right-angle paths between bound shapes
- **Dynamic anchor switching** — bindings re-route when shapes move
- **Connection anchors** — visual blue dots on nearby shapes while drawing
- **Connector handles** — green drag-out dots on selected shapes to start new connections
- **Polyline shapes** — unbound polylines act as polygon shapes (fill, hit-test, transform)

### 3D Shapes

- **Isometric Cube** — configurable vertical and side ratios
- **Solid Block** — adjustable depth and view angle
- **Perspective Block** — depth, taper, skew controls for vanishing point effects
- **Open Box** — hinged lid with configurable position (back/front/left/right), style (single/split/double/quad/flaps), and click-to-open animation with element reveal
- **Cylinder** — 3D cylinder with configurable depth and view angle
- **Per-face gradient shading** — gradients automatically darken/lighten per face for realistic 3D lighting

### Mindmap

- Organic branch connectors with tapered bezier curves
- Add child / sibling nodes
- Auto-layout: horizontal, vertical, radial
- Auto-style with 9-color branch palette
- Collapse / expand subtrees
- Parent-child hierarchy with visual toggle handles

### Presentation & Slides

- Create multi-slide decks (1920x1080)
- 8 slide transitions (fade, slide, zoom) with configurable easing
- Per-slide background color, image, gradient, and fill style
- Master layers (content repeats on every slide)
- Full-screen presentation mode with slide navigator
- Slides mode or infinite canvas mode per document

### Animation

- **35+ entrance/exit effects** — bounce, fade, zoom, slide, rotate, flip, lightSpeed, rollIn, jackInTheBox, and more
- **Triggers** — on-load, on-click, on-hover, after-prev, with-prev
- **Motion graphics** — flow animation along connectors (dashes, dots, pulse), persistent spin, orbit
- **Shape morphing** — smooth polygon-to-polygon transitions
- **Draw-in/out** — animated stroke drawing effect
- **Timeline** — sequence and overlap animations with delay, duration, easing, repeat, yoyo
- **Text animations** — typewriter, word-by-word, char-by-char, line-by-line, text scramble, count up, delete, replace
- **GSAP-like stagger** — animate multiple elements with stagger delays (start, end, center, edges, random distribution)
- **Multi-element stagger UI** — select multiple elements and apply coordinated stagger animations from the property panel

### Styling & Rendering

- **Dual render modes** — sketch (RoughJS hand-drawn) or architectural (clean lines)
- **Fill styles** — solid, hachure, cross-hatch, zigzag, dots, dashed, zigzag-line, gradients
- **Gradients** — linear, radial, conic with multi-stop color control and 45 predefined presets (warm, cool, nature, metallic, pastel, vibrant, dark, light)
- **18 blend modes** — multiply, screen, overlay, color-dodge, and more
- **Shadows** — color, blur, and offset per element
- **Arrowheads** — arrow, triangle, dot, circle, bar, diamond, crowsfoot (start/end independently)
- **Opacity, roughness, roundness, stroke style** per element
- **Text styling** — font family, size, weight, alignment, vertical alignment, highlight

### Property Panel

Collapsible sections for fill & stroke, appearance, shadows, gradients, blend modes, text, connectors, shape-specific options (star points, polygon sides, burst count, etc.), animation, and canvas properties.

### Layer System

- Create, rename, duplicate, delete, merge, flatten layers
- Show/hide and lock/unlock per layer
- Layer opacity control
- Layer groups with drag-drop reordering
- Move elements between layers
- Master layers for slides
- Auto-switch active layer on selection

### Export

| Format | Options |
|--------|---------|
| **PNG** | Scale 1x-4x, transparent or with background, selected-only |
| **SVG** | Vector export, selected-only |
| **PDF** | Scale, background toggle |
| **PPTX** | PowerPoint presentation |
| **WebM / MP4** | Screen recording |

### Programmatic API

Full browser console API via `window.Yappy`:

```js
// Create elements
Yappy.createRectangle(100, 100, 200, 150, { backgroundColor: '#fef08a' })
Yappy.createArrow(100, 100, 400, 300)
Yappy.connect(sourceId, targetId, { curveType: 'elbow' })

// Animate
Yappy.fadeIn(elementId, { duration: 800 })
Yappy.animateElement(id, { type: 'entrance', name: 'bounceIn' })

// Text animations
Yappy.typewriter(textId, { duration: 2000, cursor: true })
Yappy.wordByWord(textId, { stagger: 150 })

// Stagger animations (GSAP-like)
Yappy.animateElementsFrom([id1, id2, id3], { opacity: 0, y: 50 }, { stagger: { each: 100, from: 'start' } })

// Slides
Yappy.addSlide()
Yappy.updateSlideTransition(0, { type: 'fade', duration: 500 })

// Mindmap
Yappy.addChildNode(parentId)
Yappy.reorderMindmap(rootId, 'horizontal')

// 3D Shapes
Yappy.createOpenBox(100, 100, 200, 150, { depth: 50, openAmount: 0, lidPosition: 'back' })
Yappy.createSolidBlock(100, 100, 200, 150, { depth: 50, viewAngle: 45 })

// And 100+ more functions for elements, layers, view, themes, clipboard, history...
```

### Additional Features

- **Command palette** (Ctrl+K) — searchable tool/action/view/layer commands
- **Template browser** — pre-built diagrams, sketchnotes, animations, wireframes
- **Transform shape** — right-click to convert between shape types within the same family
- **Curve style switching** — change connectors between straight, bezier, and elbow
- **Grid & snap** — configurable grid overlay (lines/dots), snap-to-grid, snap-to-objects
- **Dark mode** — Light / Dark / Focus / System (follows OS `prefers-color-scheme`); render-time canvas inversion preserves stored colors
- **Minimap** — visual canvas overview with click-to-navigate
- **Zen mode** (Alt+Z) — hide all panels for distraction-free drawing
- **Copy/paste styles** — format painter for element formatting
- **Element locking** — prevent accidental edits
- **Undo/redo** — unlimited history stack
- **Mobile & stylus** — touch, pressure sensitivity, responsive layout
- **Auto-scroll** — viewport follows when dragging near edges
- **Block text** — large sketchnote-style lettering generator

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V / 1 | Selection tool |
| H | Pan (Hand) tool |
| R / 2 | Rectangle |
| O / 3 | Circle |
| L / 4 | Line |
| A / 5 | Arrow |
| T / 6 | Text |
| E / 7 | Eraser |
| P / 8 | Fine Liner |
| I / 9 | Insert Image |
| B / 0 | Bezier |
| D | Diamond |
| Shift+P | Laser Pointer |
| Alt+I | Ink Overlay |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+K | Command Palette |
| Ctrl+G | Group |
| Ctrl+Shift+G | Ungroup |
| Ctrl+] | Bring to Front |
| Ctrl+[ | Send to Back |
| Delete / Backspace | Delete selected |
| Shift+' | Toggle Grid |
| Shift+; | Toggle Snap |
| Alt+Z | Zen Mode |
| Alt+Enter | Toggle Properties |
| Alt+L | Toggle Layers |
| Alt+M | Toggle Minimap |
| Alt+N | New Sketch |
| Escape | Cancel / Finalize polyline |

## Tech Stack

- **Framework**: [SolidJS](https://solidjs.com) — reactive JavaScript framework
- **Rendering**: HTML5 Canvas + [RoughJS](https://roughjs.com) for hand-drawn aesthetic
- **Build**: [Vite](https://vitejs.dev)
- **Language**: TypeScript
- **Icons**: [Lucide](https://lucide.dev)
- **PDF Export**: jsPDF
- **PPTX Export**: pptxgenjs
- **State**: Centralized reactive store

## Integrations

### Raylib Rust Viewer

Yappy includes a native desktop viewer built with [raylib](https://www.raylib.com/) and Rust. It reads `.yappy` files (gzip-compressed JSON) exported from the web app and renders them in a standalone desktop window with pan/zoom navigation.

**Supported rendering:**
- Rectangles (with rounded corners), circles, diamonds, triangles, sticky notes
- Text with word wrapping, alignment, bold/italic/underline/strikethrough
- Lines, arrows, bezier curves, and elbow connectors (with arrowheads)
- Fill colors, stroke styles (solid, dashed, dotted), opacity, rotation, and flipping
- Layer visibility and opacity
- Background grid

**Controls:**
- **Mouse wheel** — Zoom in/out
- **Right-click drag** — Pan the canvas
- **ESC** — Quit

**Tech stack:** Rust, raylib 5, serde, flate2

#### Prerequisites

- Rust toolchain (rustup)
- Clang (for raylib-rs bindgen)
- On Linux, if `stdarg.h` is missing from Clang, the `.cargo/config.toml` in the project sets `BINDGEN_EXTRA_CLANG_ARGS` to point to GCC headers

#### Build & Run

```bash
cd renderers/raylib/rust
cargo run --release -- <file.yappy>
```

Example:

```bash
cargo run --release -- ../../../data/default.yappy
```

The viewer opens a 1280x720 resizable window with a HUD showing FPS, element count, zoom level, and pan offset.

#### Project Structure

```
renderers/raylib/rust/
├── Cargo.toml
├── .cargo/config.toml       # Clang/bindgen workaround
└── src/
    ├── main.rs              # Entry point — CLI arg parsing, window loop, HUD
    ├── scene.rs             # .yappy file loading (gzip detection + JSON parsing)
    ├── types.rs             # Serde structs matching the .yappy JSON format
    ├── renderer.rs          # Canvas 2D-like drawing API over raylib
    ├── render_pipeline.rs   # Common rendering utilities (color, transform, style)
    ├── viewport.rs          # Pan/zoom viewport management
    ├── color.rs             # CSS color parsing (#hex, rgb, rgba, named colors)
    ├── text.rs              # Text rendering and measurement
    └── shapes/              # Per-shape renderers
        ├── rectangle.rs
        ├── circle.rs
        ├── diamond.rs
        ├── triangle.rs
        ├── text.rs
        ├── connector.rs
        └── sticky_note.rs
```

> The folder convention is `renderers/<backend>/<language>/`, allowing future viewers in other languages (Zig, C#, etc.) under the same `raylib/` folder.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm, pnpm, yarn, or bun

### Install & Run

```bash
git clone <repository-url>
cd yappy
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

Outputs to `dist/`, optimized for production.

### Deploy

```bash
npm run deploy
```

Builds and pushes to the `gh-pages` branch for GitHub Pages.

### Publish to OSS (Algorisys open-source mirror)

The `scripts/publish-oss.sh` helper produces a cleaned, client-only snapshot of
the repo and pushes it to the public mirror at
[`github.com/algorisys-oss/yappydraw`](https://github.com/algorisys-oss/yappydraw).
It uses `.ossignore` (at the repo root) to drop server code, internal docs, and
anything else that shouldn't ship with the OSS build, and patches `package.json`
and `vite.config.ts` to remove server-only deps / the dev proxy.

**Dry run (recommended first):**

```bash
./scripts/publish-oss.sh
```

This prints the cleaned tree and the resulting `package.json` scripts/deps so
you can verify what would be published — no changes are pushed.

**Publish for real:**

```bash
./scripts/publish-oss.sh --push
```

Commits the snapshot to the OSS remote with a message like
`chore: sync from upstream YYYY-MM-DD` plus the source commit SHA.

**Configuration (env vars, all optional):**

| Variable      | Default                                                | Purpose                                |
|---------------|--------------------------------------------------------|----------------------------------------|
| `OSS_REMOTE`  | `https://github.com/algorisys-oss/yappydraw.git`       | Target remote                          |
| `OSS_BRANCH`  | `main`                                                 | Branch on the OSS remote               |
| `OSS_MESSAGE` | *(auto-generated)*                                     | Custom commit message for this sync    |

Example with a custom message:

```bash
OSS_MESSAGE="feat: color palettes + standalone palette/theme buttons" \
  ./scripts/publish-oss.sh --push
```

## Sample Data

The `data/` directory contains sample drawings that can be loaded into Yappy:

- `flow-chart.json` — deployment pipeline flowchart
- `activity-diagram.json` — logic flow activity diagram
- `sequence-diagram.json` — usage sequence diagram
- `cloud-architecture-demo.json` — cloud architecture sketch
- `six-thinking-hats.json` — sketchnote example
- `dev-arch.json` — development architecture diagram

## Project Structure

```
yappy/
├── src/
│   ├── components/        # UI components (Canvas, Toolbar, PropertyPanel, etc.)
│   ├── config/            # Property and tool configuration
│   ├── shapes/            # Shape renderers (connector, path, sketch, custom)
│   ├── store/             # Reactive state management
│   ├── utils/             # Drawing, hit-testing, geometry, animation, binding, layout
│   └── App.tsx            # Root component
├── renderers/
│   └── raylib/rust/       # Native desktop viewer (Rust + raylib)
├── data/                  # Sample drawings (JSON)
├── docs/                  # Technical documentation
├── public/                # Static assets
└── vite.config.ts         # Vite configuration
```

## Contributing

Contributions welcome. Fork, branch, and open a PR.

## License

## WASM Acceleration (Opt-in)

YappyDraw includes optional WebAssembly modules (via AssemblyScript) for accelerating performance-critical operations like geometry calculations, hit testing, and path routing. **WASM is disabled by default** — the app runs on JS+Canvas as always.

### Enable/Disable

| Method | How | Example |
|--------|-----|---------|
| **URL param** | Add `?wasm=on` or `?wasm=off` to the URL | `http://localhost:5173/?wasm=on` |
| **Specific features** | `?wasm=geometry,hitTesting` | Only enable selected modules |
| **localStorage** | `localStorage.setItem('yappy-wasm', 'off')` | Master kill switch |
| **Disable specific** | `localStorage.setItem('yappy-wasm-disable', 'sketchEngine')` | Disable one module |

Available feature flags: `geometry`, `hitTesting`, `routing`, `snapping`, `shapePaths`, `sketchEngine`, `batchRenderer`

### Build

WASM modules are compiled automatically during `npm run build` and `npm run dev` via the Vite AssemblyScript plugin. No manual steps needed.

To compile manually: `cd frontend/src/wasm/assemblyscript && npx asc --target release`

---

**Dual Licensed**

YappyDraw is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

You are free to use, modify, and distribute this software for **personal and non-commercial purposes** under the terms of the AGPL-3.0. Any modified versions must also be released under the AGPL-3.0, and if you run a modified version as a network service, you must make the source code available to its users.

### Commercial & SaaS Use

If you wish to use YappyDraw in a **commercial product, proprietary application, or SaaS offering** without the AGPL-3.0 obligations (including source disclosure), you must obtain a **commercial license** from the Algorisys Open Source Team.

For commercial licensing inquiries, please contact us via [GitHub](https://github.com/algorisys-oss/yappydraw).

### Attribution

Regardless of license type, all usage of YappyDraw must retain visible attribution to the **Algorisys Open Source Team** and a link to the [original repository](https://github.com/algorisys-oss/yappydraw).
