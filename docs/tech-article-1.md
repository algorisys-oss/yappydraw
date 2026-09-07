# YappyDraw: Building an Animation-First Diagramming Tool with SolidJS and RoughJS

*An in-depth look at the origin story, architecture, rendering pipeline, and feature set that sets YappyDraw apart from Excalidraw, tldraw, and Miro.*

**Try it**: [yappydraw.com](https://yappydraw.com) | 100% local — no data is sent to the cloud.

---

## The Origin Story: Why Another Drawing Tool?

I created YappyDraw because my team and I were using too many tools. Excalidraw for quick sketches. Miro for workshops. PowerPoint for presentations. Krita and Procreate for illustration ideas. A separate animation tool for demos. Every time we switched contexts, we lost momentum. I wanted one tool that combined the features I liked from each — the hand-drawn feel of Excalidraw, the freeform canvas of Miro, presentation-grade slides, Procreate-inspired drawing tools, and a real animation engine — while keeping the UI/UX simple and opinionated.

So I built it. Not by writing every line myself in the traditional sense, but through what I call **vibe architecting**.

### 65K+ Lines, 100% Vibe Architected

YappyDraw is 65,000+ lines of TypeScript, SolidJS, and CSS. The entire design — code structure, component architecture, state management patterns, rendering pipeline, animation engine design — was directed by me, drawing on 30+ years of experience in software and this domain. Every architectural decision, every UX interaction model, every abstraction boundary reflects that experience.

The implementation itself was AI-assisted. It took roughly **120 hours of vibe architecting** — describing the architecture, specifying behaviors, reviewing and iterating on generated code — plus an additional **100 hours of manual review**, refactoring, and testing. If I had coded it all by hand, the equivalent effort would have been **200+ man-days**. A massive savings, and a genuine test of how far AI-based coding can go.

The question everyone asks about AI-generated code is whether it turns into sloppy, unmaintainable output. I'm happy to say we achieved great success here. Every line has been manually reviewed and refactored. Some refactoring is still in progress — we're changing each line of code we don't like — and you're welcome to be the judge once it's fully open-sourced.

### Battle-Tested, Not Just a Demo

This isn't a weekend prototype. YappyDraw is actively being tested by **50+ engineers** on our team at Algorisys. We've used it to create diagrams, run demos, and train people. There will be edge cases — testing is ongoing — but the tool is real and being used daily. A huge thanks to the Algorisys team for putting this through its paces every single day, filing bugs, suggesting features, and pushing the tool to its limits. Without their daily testing and feedback, this wouldn't be where it is.

It was also a deliberate test of **SolidJS** in a large, complex application. I have 10+ years of experience with React and could have built this with it — but I chose SolidJS for its simplicity. No virtual DOM reconciliation, no `useCallback`/`useMemo` dance, no stale closure bugs. Just signals and stores that update exactly what they need to. I'm happy with how the code turned out. SolidJS's fine-grained reactivity model is a natural fit for a canvas tool with hundreds of reactive properties — more on that below.

---

## The Problem Space

The open-source diagramming landscape has strong players. Excalidraw nails the hand-drawn aesthetic. tldraw provides a polished SDK for building custom canvas apps. Miro dominates collaborative workflows. But none of them treat **animation as a first-class citizen**. None of them let you build a technical diagram — servers, load balancers, UML classes, mindmaps — and then *animate it* with spring physics, state morphing, and presentation transitions, all inside the same tool.

The slide mode alone is as good as any modern presentation software — but it's integrated into the same canvas where you draw architecture diagrams and animate data flows.

| Tool | Core Focus |
|------|-----------|
| Excalidraw | Hand-drawn simplicity |
| Procreate / Krita | Digital illustration |
| tldraw | Extensibility & SDK |
| Miro | Collaboration & workflows |
| **YappyDraw** | **Animation + Presentation + Technical diagrams** |

---

## Why SolidJS?

Most canvas applications in the ecosystem are built with React (Excalidraw, tldraw) or vanilla JS. Having worked with React for over a decade, I could have gone that route. But for YappyDraw, I chose **SolidJS** for its simplicity and performance model: fine-grained reactivity without a virtual DOM.

In a diagramming tool, the state graph is complex — hundreds of elements, each with dozens of properties (position, size, rotation, colors, gradients, animation configs), plus a viewport (zoom, pan), selection state, layers, slides, and tool state. With React, any state change triggers a reconciliation pass — and you end up fighting stale closures, wrapping everything in `useCallback` and `useMemo`, and carefully managing dependency arrays. With SolidJS, none of that exists. Signals and stores update exactly the DOM nodes that depend on them, nothing more. This distinction matters when you're running a 60fps animation loop alongside a reactive UI.

### The Store Architecture

The entire application state lives in a single SolidJS `createStore`:

```
Elements[]          — every shape, connector, text, image on the canvas
Layers[]            — z-order, visibility, locking, opacity
Slides[]            — spatial slides with per-slide viewState and dimensions
ViewState           — { scale, panX, panY }
Selection[]         — array of selected element IDs
GlobalSettings      — theme, renderStyle, showQuickToolbar
DefaultElementStyles — font, stroke, fill defaults for new elements
History             — undo/redo snapshots (max 50)
```

Updates use `setStore()` with path-based updates for surgical reactivity. Multi-element operations use `batch()` to coalesce changes into a single render pass — critical when dragging a group of 50 shapes or running a staggered animation across a table.

### Derived State with createMemo

Computed values like "which elements are visible in the viewport" or "which elements belong to the active slide" are wrapped in `createMemo()`. SolidJS tracks their dependencies at the signal level and only recomputes when the specific properties they read actually change — not when *any* store property changes.

---

## Dual Rendering: RoughJS Sketch + Architectural Clean Lines

Every shape in YappyDraw supports two rendering modes, toggled globally or per-element:

**Sketch Mode** uses [RoughJS](https://roughjs.com/) to produce a hand-drawn aesthetic. Each shape gets a seed value (stored on creation) so the sketch strokes remain stable across re-renders. Roughness is configurable from 0 (clean but sketchy) to 3+ (chaotic). Fill styles include hachure, cross-hatch, zigzag, zigzag-line, and solid.

**Architectural Mode** renders with clean Canvas 2D paths — crisp corners, precise curves, no randomization. This mode is preferred for technical documentation, UML diagrams, and export-quality output.

### The Render Pipeline

All 25 renderer classes share a common pipeline (`render-pipeline.ts`, 401 lines) that handles:

1. **Transform setup**: translate, rotate, scale, flip
2. **Opacity and blend modes**: 17 canvas composite operations
3. **Shadow application**: color, blur, offset
4. **Stroke styling**: color, width, dash patterns (solid, dashed, dotted)
5. **Complex fills**: linear/radial/conic gradients (42 presets), dot patterns (with caching), image fills
6. **Shape geometry**: delegated to the specific renderer (RoughJS or Canvas 2D)
7. **Text rendering**: word wrapping, alignment, font resolution, text highlights
8. **Double borders**: inner stroke with configurable offset
9. **Filter effects**: CSS filter string passthrough

The pipeline guarantees that every shape — from a basic rectangle to an isometric cube — gets consistent styling, shadowing, and blending regardless of which renderer draws it.

---

## The Animation Engine: 90+ Presets, Spring Physics, and State Morphing

This is where YappyDraw diverges most sharply from the competition. The animation system is a 5,000+ line subsystem spanning five core modules:

### Animation Presets

90+ animation functions organized into categories:

- **Attention Seekers**: bounce, flash, pulse, rubberBand, shakeX/Y, swing, tada, wobble, jello, heartBeat
- **Entrances** (50+ variations): fadeIn (14 directions), bounceIn (5), slideIn (4), scaleIn, rotateIn (5), flipIn, zoomIn (5), lightSpeedIn, rollIn, jackInTheBox
- **Exits**: Mirror of entrances — fadeOut, bounceOut, slideOut, etc.
- **Special**: backIn/Out, revolve, drawIn/Out (progressive path drawing)
- **Table-specific** (12): tableRowReveal, tableColReveal, tableCellFill, tableHeatmapFadeIn, tableRowHighlight, tableColPulse, tableGridDraw, tableHeaderSlam, tableCountUp, tableAccordion, tableCellsAssemble, tableLightningSplit

Each preset is a function that takes an element, duration, and options, then applies keyframed property changes over time.

### Easing and Spring Physics

19 standard easing functions (quadratic, cubic, exponential, bounce, elastic, back — each in in/out/inOut variants) plus a **damped harmonic oscillator** for spring physics:

The spring implementation models mass-spring-damper dynamics with configurable stiffness, damping, mass, and initial velocity. It correctly handles all three regimes:

- **Under-damped** (oscillating settle) — the natural, bouncy feel
- **Critically damped** — fastest settle without overshoot
- **Over-damped** — slow, heavy return

Default spring parameters (`stiffness: 170, damping: 26, mass: 1`) produce a snappy bounce that feels physical without being distracting.

### Animatable Properties

The engine can animate 30+ element properties:

- **Spatial**: x, y, width, height, angle (rotation)
- **Visual**: opacity, strokeWidth, roughness, drawProgress
- **3D shapes**: depth, viewAngle, openAmount, taper, skewX/Y
- **Colors**: strokeColor, backgroundColor — with hex color interpolation
- **Table**: tableAnimProgress (drives all 12 table animation types)
- **Connectors**: flowAnimation, flowSpeed, flowStyle

### Animation Triggers

Animations can be triggered by:

- **on-load**: Play when the slide or canvas loads
- **on-click**: Play when the element is clicked
- **on-hover**: Play on mouse enter
- **after-prev**: Sequential — starts after the previous animation completes
- **with-prev**: Parallel — starts simultaneously with the previous animation

This trigger model, borrowed from PowerPoint/Keynote, enables complex build sequences where shapes fly in one-by-one or animate in coordinated groups.

### GSAP-like Stagger

Multi-element animations support stagger with:

- **Grid-based distribution**: 2D stagger across rows and columns
- **Radial distribution**: Distance from center or a specific point
- **Distribution modes**: center, edges, random
- **Custom stagger easing**: Independent of the element animation easing

### State Morphing ("Magic Move")

The `MorphAnimator` module enables Keynote-style Magic Move transitions. Save an element arrangement as a "display state" (position, size, color, opacity overrides), then smoothly morph between states. The engine:

1. Identifies shared elements between source and target states
2. Computes per-property deltas
3. Interpolates all properties simultaneously with the chosen easing

This is particularly powerful for presentations where you want a diagram to *evolve* — show the architecture first, then animate in the new microservice, then highlight the data flow.

### Persistent Animations

Beyond triggered animations, YappyDraw supports continuous effects:

- **Spin**: Constant rotation at configurable speed
- **Orbit**: Element revolves around a center element (radius, speed, CW/CCW)
- **Flow**: Animated dashes, dots, or pulses along connectors

These run on a dedicated animation frame ticker that persists even without traditional animation playback.

---

## 139 Shapes Across 10 Categories

YappyDraw's shape library goes far beyond rectangles and circles. 25 specialized renderer classes handle:

### Basic & Specialty (40+ shapes)
Rectangle, circle, diamond, triangle, hexagon, octagon, parallelogram, pentagon, star, cloud, heart, cross, checkmark, capsule, callout, burst, speechBubble, ribbon, brackets, directional arrows, and more.

### Infrastructure & Cloud (15 shapes)
Server, load balancer, firewall, user, message queue, lambda, router, Kubernetes, container, API gateway, CDN, storage blob, event bus, microservice, shield. Purpose-built for architecture diagrams.

### UML (14 shapes)
Class (with attributes/methods compartments), interface, actor, use case, note, package, component, state, lifeline, fragment, signal send/receive, provided/required interface. Full UML modeling support.

### Sketchnote Icons (19 shapes)
Star person, lightbulb, signpost, burst blob, scroll, wavy divider, double banner, trophy, clock, gear, target, rocket, flag, key, magnifying glass, book, megaphone, eye, thought bubble. Hand-drawn visual vocabulary for presentations and workshops.

### People & Status (16 shapes)
Stick figures (standing, sitting, presenting), hand gestures (pointing, thumbs up), face expressions (happy, sad, confused), checkboxes, numbered badges, tags, pins, stamps.

### Data & Metrics (6 shapes)
Bar chart, pie chart, trend up/down, funnel, gauge. Inline data visualization shapes.

### Wireframe (4 shapes)
Browser window, mobile phone, ghost button, input field. Quick UI mockups.

### DFD & Flowchart (8 shapes)
Process, data store, state start/end, sync, external entity, activation bar, predefined process, internal storage, document.

### 3D Shapes
Solid block, perspective block, open box, isometric cube, cylinder — all with configurable depth, view angle, and taper. Animatable 3D properties enable reveal and rotation effects.

### Connectors (4 routing modes)
Line, arrow, bezier (smooth curves with control points), polyline (multi-segment), plus organic branch connectors for mindmaps (tapered bezier curves). 8 arrowhead types: arrow, triangle, dot, circle, bar, diamond, diamond-filled, and crow's foot (for ER diagrams). Configurable arrowhead size on both endpoints independently.

---

## The Mindmap System

YappyDraw includes a full mindmap engine with five layout algorithms:

1. **Horizontal Right** — classic left-to-right tree
2. **Horizontal Left** — right-to-left
3. **Vertical Down** — top-to-bottom
4. **Vertical Up** — bottom-to-top
5. **Radial** — neuron-style with children in circular wedges

### Organic Branch Connectors

Mindmap branches aren't straight lines — they're rendered as tapered bezier curves that thin out at deeper levels, producing an organic, natural appearance. Branch styling is semantic:

- **9-color auto-palette**: First-level children get distinct colors; descendants inherit
- **Depth-based stroke width**: `max(1.5, 4 - depth * 1)` — thicker at root, thinner at leaves
- **Depth-based opacity**: `max(40%, 100% - depth * 10%)` — progressively faded

### Keyboard-Driven Editing

- **Tab**: Add child node
- **Enter**: Add sibling node
- **Space**: Collapse/expand branch
- **Arrow keys**: Navigate between nodes
- **Shift+F**: Focus mode — dims everything outside the selected branch
- **Alt+Drag**: Move entire subtree
- **Drag to reparent**: Drop a node onto a new parent

The layout engine recursively calculates subtree dimensions to prevent overlaps, with 100px horizontal and 40px vertical spacing defaults.

---

## Tables: Not an Afterthought

Tables in YappyDraw are first-class canvas elements with:

- Configurable rows and columns
- Optional header row with distinct styling
- Cell merging across rows and columns
- Per-cell formatting (number, currency, percentage, date, text)
- Per-cell borders with configurable width
- Column alignment (left, center, right)
- Fractional column widths and row heights
- Column reordering and sorting (ascending/descending)
- Alternating row colors

But the standout feature is **12 table-specific animation presets**:

| Animation | Effect |
|-----------|--------|
| tableRowReveal | Rows slide in one by one |
| tableColReveal | Columns appear sequentially |
| tableCellFill | Cells fill with color progressively |
| tableHeatmapFadeIn | Cells fade in with intensity mapping |
| tableRowHighlight | Rows highlight in sequence |
| tableColPulse | Columns pulse with emphasis |
| tableGridDraw | Grid lines draw themselves |
| tableHeaderSlam | Header drops in with impact |
| tableCountUp | Numeric cells count from 0 to value |
| tableAccordion | Rows expand accordion-style |
| tableCellsAssemble | Cells fly in from random positions |
| tableLightningSplit | Table splits with electric effect |

These animations are driven by a single `tableAnimProgress` property (0-1), making them composable with the standard animation trigger system.

---

## The Presentation System

YappyDraw supports two document modes: **infinite canvas** (freeform) and **slides** (presentation). In slides mode:

### Spatial Slides on an Infinite Canvas

Slides are positioned *on* the canvas, not in a linear sequence. Each slide has its own dimensions, background color, and viewport. You can zoom out to see all slides at once, then zoom into one to edit. This spatial model makes it easy to build non-linear presentations and reuse elements across slides.

### Slide Transitions (7 types)

- **Fade**: Cross-fade through background
- **Slide** (4 directions): New slide enters from left, right, up, or down
- **Zoom In/Out**: Scale transitions
- **None**: Instant cut

Each transition is configurable with duration (100-5000ms) and 9 easing options including spring physics.

### Presentation Tools

- **Laser Pointer**: Leaves temporary trails with decay animation for highlighting during live presentations
- **Temporary Ink**: Freehand strokes with time-to-live that automatically fade out
- **Build Animations**: Click-to-advance sequences using the animation trigger system (on-click, after-prev, with-prev)
- **Auto-hiding HUD**: Presentation controls appear on mouse movement, fade after 3 seconds

### Slide Master

Define global branding — logos, headers, footers — that repeat on every slide. Dynamic variable replacement (`${slideNumber}`, `${totalSlides}`) updates automatically across the deck.

---

## Connector System: Beyond Simple Arrows

### Routing

- **Straight**: Direct line
- **Bezier**: Smooth curves with draggable control points
- **Elbow**: Orthogonal routing with smart waypoints
- **Polyline**: Multi-segment paths with user-defined points
- **Organic Branch**: Tapered bezier curves for mindmaps

### Smart Binding

Connectors attach to shapes at 8 anchor positions (top, right, bottom, left, and four corners). When a connected shape moves, the connector updates automatically. Bindings store position, gap, and focus parameters for precise anchor control.

### Flow Animations

Connectors can have continuous animated effects:

- **Dashes**: Marching ants effect
- **Dots**: Particles flowing along the path with configurable density
- **Pulse**: Glowing pulse that travels along the connector

Flow speed and style are per-connector properties, animatable like any other property.

### Curved Text on Paths

Text labels can follow the connector path — useful for labeling relationships in entity diagrams or data flow annotations. Labels can be positioned at start, middle, or end of the path.

---

## Advanced Styling

### Gradient System (42 presets)

Three gradient types — linear, radial, conic — with multi-stop support. 42 categorized presets:

- **Warm**: sunset, warmFlame, juicyPeach, etc.
- **Cool**: oceanBlue, coolSky, deepPurple, etc.
- **Nature**: freshLeaf, cherryBlossom, etc.
- **Metallic**: silverSteel, goldShimmer, etc.
- **Pastel, Vibrant, Dark, Light**: 6 presets each

Gradients are rendered via the Canvas 2D gradient API, working identically in both sketch and architectural modes.

### Blend Modes (17)

Full canvas composite operation support: normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity, destination-over.

### Additional Properties

- **Shadows**: color, blur, offset (x/y), toggleable
- **Double borders**: Inner stroke with configurable distance
- **Text highlighting**: Background color behind text with padding and radius
- **Border radius**: 0-50% for rounded corners
- **Star points**: 3-12 configurable
- **Polygon sides**: 3-20 configurable
- **Filter effects**: CSS filter string passthrough (blur, brightness, contrast, etc.)

---

## Export & Recording

| Format | Features |
|--------|----------|
| **PNG** | Scale (1x-4x), transparent or colored background, selection-only, copy to clipboard |
| **JPG** | White background, 0.92 quality |
| **SVG** | Vector output via RoughJS SVG generator, preserves sketch rendering |
| **PDF** | Via jsPDF, rasterized canvas |
| **PowerPoint** | Via PptxGenJS, slide-by-slide export |
| **Video** | WebM (VP9) or MP4, 60fps canvas capture via MediaRecorder API |

Video recording captures the live canvas — including running animations, flow effects, and presentation transitions — as a timestamped video file.

---

## Layer System

- Up to 20 layers with z-order control
- Per-layer: visibility, locked, opacity, color tags
- Layer grouping with expand/collapse
- Per-element layer assignment
- Layer opacity multiplied with element opacity for final rendering

---

## Developer-Facing API

YappyDraw exposes a public JavaScript API (`window.Yappy`) for programmatic control:

- Element CRUD (create, read, update, delete)
- Animation playback (play, pause, seek)
- Slide navigation
- Export triggers
- Auto-save management (`Yappy.forceAutoSave()`, `Yappy.clearAutoSave()`)
- State morphing between display states

This makes it possible to embed YappyDraw in other applications or drive it from external scripts.

---

## Performance Considerations

### Canvas Over SVG DOM

YappyDraw renders to a single `<canvas>` element rather than an SVG DOM tree. This avoids the performance cliff that SVG-based tools hit when element counts grow — no thousands of DOM nodes to reconcile, no layout thrashing, no style recalculation.

### Dot Pattern Caching

Complex fills (dot patterns) are cached as reusable Canvas patterns, keyed by visual parameters. The cache holds up to 100 entries, preventing redundant pattern generation during rapid re-renders.

### Single Animation Frame Loop

All animations — triggered presets, persistent orbit/spin, flow effects — share a single `requestAnimationFrame` loop managed by the `AnimationEngine` singleton. This avoids the overhead of multiple independent RAF callbacks.

### SolidJS Fine-Grained Updates

The UI layer (property panels, toolbars, status bar, layer panel) re-renders only the specific DOM nodes affected by a state change. Dragging an element updates its x/y in the store, which triggers a canvas re-render and updates the coordinate display in the status bar — but nothing else in the DOM.

### Auto-Save with Debouncing

Changes are auto-saved to localStorage with a 1-second debounce. Immediate saves fire on slide navigation and tab close (`beforeunload`). Multi-tab awareness uses `storage` events to detect conflicts.

---

## What's Next

The roadmap includes RBAC and collaboration features, more shape categories, additional animation presets, and a plugin system. But the core thesis remains: a diagramming tool should let you not just *draw* your ideas, but *animate* and *present* them — all in one place.

---

## The Bigger Picture

YappyDraw started as a personal tool — something I wanted for myself and my team. It grew into something larger: a proof that AI-assisted development, guided by deep domain experience, can produce production-grade software at a pace that would have been unthinkable a few years ago.

120 hours of vibe architecting. 100 hours of manual review. 65,000+ lines. 50+ engineers using it daily. Every line reviewed and refactored.

It's still a work in progress. But feel free to use it, break it, and tell us what you think.

None of this would have been possible without the Algorisys team — 50+ engineers who test this tool every day, catch edge cases, and push for better UX. They are the reason YappyDraw is battle-tested and not just a polished demo.

---

**Try it**: [yappydraw.com](https://yappydraw.com)
**GitHub**: [github.com/algorisys-oss/yappydraw](https://github.com/algorisys-oss/yappydraw) *(soon to be open-sourced)*
**Built by**: Rajesh Pillai & the Algorisys Open Source Team
**Stack**: SolidJS + RoughJS + Canvas 2D + TypeScript
**Inspired by**: Excalidraw, Procreate, Krita, Miro — plus a lot of our own ideas for UX and animations
**Privacy**: 100% local. No data is sent to the cloud.
