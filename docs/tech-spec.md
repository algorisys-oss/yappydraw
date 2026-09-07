# Yappy Technical Specification

Single source of truth for all architecture, types, properties, behaviors, animations, slides, layers, and subsystems.

---

## 1. Architecture Overview

### Tech Stack
- **Framework**: Solid.js 1.9 (reactive UI)
- **Rendering**: HTML5 Canvas 2D + RoughJS 4.6 (hand-drawn aesthetic)
- **Build**: Vite 7 + TypeScript 5.9
- **Server**: Express 5 (optional, for workspace storage)
- **Testing**: Playwright

### Source Structure
```
src/
  api.ts                   # Public API (window.Yappy)
  app.tsx                  # Root component
  index.tsx                # Solid.js bootstrap
  types.ts                 # Core type definitions
  types/
    slide-types.ts         # Slide & document types
    motion-types.ts        # Animation & state types
    template-types.ts      # Template types
  store/
    app-store.ts           # Solid.js store (state management, 1660 lines)
  components/
    canvas.tsx             # Main rendering loop & interaction (3600+ lines)
    toolbar.tsx            # Shape/pen tool bar
    menu.tsx               # Top menu bar
    property-panel.tsx     # Element property editor
    layer-panel.tsx        # Layer management
    slide-navigator.tsx    # Slide thumbnails & reordering
    export-dialog.tsx      # Export format picker
    ...35+ components
  shapes/
    shape-registry.ts      # Type-to-renderer mapping
    register-shapes.ts     # Shape registration
    base/
      shape-renderer.ts    # Abstract base renderer
      render-pipeline.ts   # Universal transforms & fills
    renderers/             # 16 specialized renderers
  utils/
    export.ts              # PNG, SVG, PDF, PPTX export
    render-element.ts      # Rendering entry point
    animation/             # Animation engine + subsystems
    mindmap-layout.ts      # Mindmap auto-layout
    alignment.ts           # Align & distribute
    object-snapping.ts     # Smart snapping
    routing.ts             # Elbow connector routing
    migration.ts           # v2 → v4 format conversion
    video-recorder.ts      # WebM/MP4 recording
    ...33 utility files
  storage/
    file-system-storage.ts # Server-backed persistence
    storage-interface.ts   # Storage contract
```

### Rendering Pipeline
```
requestAnimationFrame(draw)
  ├── Clear canvas
  ├── Apply camera transform (panX, panY, scale)
  ├── Render background / grid / texture
  ├── For each layer (sorted by order):
  │   ├── Render layer background
  │   └── For each element (with viewport culling):
  │       ├── ShapeRegistry.getRenderer(type)
  │       ├── RenderPipeline: rotation, opacity, shadow, blend mode
  │       ├── Complex fills: gradients, dot patterns
  │       ├── renderSketch() (RoughJS) or renderArchitectural() (clean lines)
  │       ├── Render text (containerText / text)
  │       ├── Flow animation (marching ants / dots / pulse)
  │       └── Persistent animations (spin, orbit)
  ├── Render selection handles & snap guides
  └── Schedule next frame
```

---

## 2. Document Format (SlideDocument v4)

```typescript
interface SlideDocument {
  version: 4;
  metadata: {
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    docType?: 'infinite' | 'slides';
  };
  elements: DrawingElement[];    // All elements across all slides
  layers: Layer[];
  slides: Slide[];
  globalSettings?: GlobalSettings;
  gridSettings?: GridSettings;
  states?: DisplayState[];       // State morphing snapshots
}
```

**Document types**:
- `'slides'` — Presentation mode. Only the active slide's elements render. Strict spatial isolation.
- `'infinite'` — Freeform canvas. All elements visible, slide frames shown as dashed outlines.

**Migration**: v2 (flat DrawingData) is auto-migrated to v4 on load via `migrateToSlideFormat()`.

### Data Compatibility & Persistence Strategy
To ensure long-term stability and forward compatibility of the file format (`.yappy`, `.json`):

1.  **Versioning**: The root document contains a `version` field (e.g., `version: 4`). Major format changes take this version to apply migration logic in `src/utils/migration.ts`.
2.  **Normalization (`normalizeElement`)**:
    *   Located in `src/utils/migration.ts`, this function is the **gatekeeper** for data integrity.
    *   It accepts partial or legacy element data and returns a strictly typed `DrawingElement`.
    *   **Forward Compatibility**: When new properties (e.g., `glowEffect`) are added to the codebase, `normalizeElement` automatically assigns default values to older files that lack them. This ensures the app never crashes when loading old files.
3.  **Migration Pipeline**:
    *   On load, `menu.tsx` detects the schema version.
    *   If the version is outdated, it runs specific migration transforms (e.g., wrapping flat elements into slides) before the app state receives the data.
    *   This decouples the storage format from the runtime application state.

---

## 3. Element System

### DrawingElement Interface

Every element on the canvas is a `DrawingElement`. All properties listed below:

#### Identity & Position
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | UUID | Unique identifier |
| `type` | `ElementType` | — | Shape/element type |
| `x` | `number` | — | Left position (px) |
| `y` | `number` | — | Top position (px) |
| `width` | `number` | — | Width (px) |
| `height` | `number` | — | Height (px) |
| `angle` | `number` | `0` | Rotation (radians) |
| `layerId` | `string` | active layer | Parent layer |
| `locked` | `boolean` | `false` | Prevent editing |
| `link` | `string \| null` | `null` | Hyperlink URL |

#### Visual Style
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `strokeColor` | `string` | `'#000000'` | Border/line color |
| `backgroundColor` | `string` | `'transparent'` | Fill color |
| `fillStyle` | `FillStyle` | `'hachure'` | Fill pattern |
| `strokeWidth` | `number` | `2` | Border thickness |
| `strokeStyle` | `StrokeStyle` | `'solid'` | Border pattern |
| `strokeLineJoin` | `'round' \| 'bevel' \| 'miter'` | — | Corner join |
| `roughness` | `number` | `1` | Hand-drawn intensity (0 = sharp) |
| `opacity` | `number` | `100` | Opacity (0–100) |
| `renderStyle` | `'sketch' \| 'architectural'` | `'sketch'` | RoughJS or clean lines |
| `seed` | `number` | random | RoughJS randomization seed |
| `roundness` | `null \| { type: number }` | `null` | Corner rounding |
| `blendMode` | `BlendMode` | `'normal'` | Composite operation |
| `filter` | `string` | — | CSS filter string |
| `fillDensity` | `number` | — | RoughJS fill density |

#### Shadow
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shadowEnabled` | `boolean` | `false` | Toggle shadow |
| `shadowColor` | `string` | `'rgba(0,0,0,0.3)'` | Shadow color |
| `shadowBlur` | `number` | `10` | Blur radius |
| `shadowOffsetX` | `number` | `5` | X offset |
| `shadowOffsetY` | `number` | `5` | Y offset |

#### Gradient
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `gradientType` | `GradientType` | — | `'linear' \| 'radial' \| 'conic'` |
| `gradientDirection` | `number` | `45` | Angle in degrees (0–360) |
| `gradientStops` | `GradientStop[]` | — | Array of `{ offset: 0–1, color: string }` |
| `gradientHandlePositions` | `{ start: Point; end: Point }` | — | UI handle positions |
| `gradientStart` | `string` | — | _(deprecated)_ Start color |
| `gradientEnd` | `string` | — | _(deprecated)_ End color |

#### Inner Border
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `drawInnerBorder` | `boolean` | — | Double border toggle |
| `innerBorderColor` | `string` | — | Inner border color |
| `innerBorderDistance` | `number` | — | Padding between borders |

#### Text
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | — | Rendered text (standalone text elements) |
| `rawText` | `string` | — | Original text before formatting |
| `containerText` | `string` | `''` | Text inside shapes (labels) |
| `fontSize` | `number` | `20` | Font size (px) |
| `fontFamily` | `FontFamily` | `'hand-drawn'` | Font selection |
| `fontWeight` | `boolean \| string` | `false` | Bold |
| `fontStyle` | `boolean \| string` | `false` | Italic |
| `textAlign` | `TextAlign` | `'left'` | Horizontal alignment |
| `verticalAlign` | `VerticalAlign` | `'middle'` | Vertical alignment |
| `textColor` | `string` | — | Text color override |
| `textHighlightEnabled` | `boolean` | `false` | Background highlight |
| `textHighlightColor` | `string` | — | Highlight color |
| `textHighlightPadding` | `number` | — | Highlight padding |
| `textHighlightRadius` | `number` | — | Highlight border radius |

#### Shape-Specific
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `starPoints` | `number` | `5` | Star points (3–12) |
| `polygonSides` | `number` | `6` | Polygon sides (3–20) |
| `borderRadius` | `number` | `0` | Corner radius % (0–50) |
| `burstPoints` | `number` | `16` | Burst shape points (8–32) |
| `tailPosition` | `number` | `20` | Callout tail position % (0–100) |
| `shapeRatio` | `number` | — | Inner/outer radius ratio % (10–90) |

#### Connector / Path
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `Point[] \| number[]` | — | Path points |
| `pointsEncoding` | `'packed' \| 'flat'` | — | `'flat'` = `[x,y,x,y,...]` |
| `controlPoints` | `{ x, y }[]` | — | Bezier control points |
| `startArrowhead` | `ArrowHead` | `null` | Start arrowhead type |
| `endArrowhead` | `ArrowHead` | `'arrow'` | End arrowhead type |
| `curveType` | `'straight' \| 'bezier' \| 'elbow'` | `'straight'` | Routing algorithm |
| `startBinding` | `{ elementId, focus, gap, position? } \| null` | — | Connection to start element |
| `endBinding` | `{ elementId, focus, gap, position? } \| null` | — | Connection to end element |
| `labelPosition` | `'start' \| 'middle' \| 'end'` | — | Line label position |
| `boundElements` | `{ id, type }[] \| null` | — | Elements bound to this shape |

#### Image
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dataURL` | `string` | — | Base64 image data |
| `fileId` | `string` | — | File reference |
| `mimeType` | `string` | — | Image MIME type |
| `scale` | `[number, number]` | — | Scale factors [x, y] |
| `crop` | `{ x, y, width, height } \| null` | — | Crop region |
| `status` | `'pending' \| 'loaded' \| 'error'` | — | Loading state |

#### Hierarchy (Mindmap)
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `parentId` | `string \| null` | `null` | Parent element in tree |
| `isCollapsed` | `boolean` | `false` | Collapse children |
| `groupIds` | `string[]` | — | Group membership |
| `containerId` | `string \| null` | — | Parent container |

#### Interaction
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `constrained` | `boolean` | `false` | Maintain aspect ratio |
| `autoResize` | `boolean` | `false` | Auto-resize for text |
| `isEditing` | `boolean` | — | Text editing mode |

#### Animation
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `animations` | `ElementAnimation[]` | — | Animation sequence |
| `entranceAnimation` | `EntranceAnimation` | — | _(deprecated)_ Use `animations` |
| `isMotionPath` | `boolean` | — | Can act as motion path |

#### Flow Animation
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `flowAnimation` | `boolean` | — | Enable flow visualization |
| `flowSpeed` | `number` | — | Speed (0–10) |
| `flowStyle` | `'dashes' \| 'dots' \| 'pulse'` | — | Visual pattern |
| `flowColor` | `string` | — | Flow color (defaults to strokeColor) |
| `flowDensity` | `number` | — | Density (1–10) |

#### Persistent Animation
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `spinEnabled` | `boolean` | — | Continuous rotation |
| `spinSpeed` | `number` | — | Degrees per frame |
| `orbitEnabled` | `boolean` | — | Orbit around element |
| `orbitCenterId` | `string` | — | Center element ID |
| `orbitRadius` | `number` | — | Orbit radius (px) |
| `orbitSpeed` | `number` | — | Orbit speed |
| `orbitDirection` | `'cw' \| 'ccw'` | — | Direction |
| `ttl` | `number` | — | Time-to-live (ms timestamp) |

#### Pen/Freehand
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `smoothing` | `number` | `3` | Stroke smoothing |
| `taperAmount` | `number` | `0.15` | Taper end amount |
| `velocitySensitivity` | `number` | `0.5` | Pressure response |

---

### ElementType (77+ types)

#### Basic Shapes
`rectangle`, `circle`, `diamond`, `triangle`

#### Polygons
`hexagon`, `octagon`, `parallelogram`, `trapezoid`, `rightTriangle`, `pentagon`, `septagon`, `polygon`

#### Specialty Shapes
`star`, `cloud`, `heart`, `cross`, `checkmark`, `burst`, `capsule`, `callout`, `speechBubble`, `ribbon`, `bracketLeft`, `bracketRight`, `arrowLeft`, `arrowRight`, `arrowUp`, `arrowDown`

#### Connectors
`line`, `arrow`, `bezier`, `organicBranch`

#### Freehand Tools
`fineliner`, `inkbrush`, `marker`, `ink`, `eraser`, `pen`, `laser`

#### Text & Image
`text`, `image`, `stickyNote`

#### Sketchnote
`starPerson`, `lightbulb`, `signpost`, `burstBlob`, `scroll`, `wavyDivider`, `doubleBanner`

#### Flowchart
`database`, `document`, `predefinedProcess`, `internalStorage`

#### Infrastructure
`server`, `loadBalancer`, `firewall`, `user`, `messageQueue`, `lambda`, `router`, `browser`

#### Wireframe
`browserWindow`, `mobilePhone`, `ghostButton`, `inputField`

#### Technical / Diagram
`dfdProcess`, `dfdDataStore`, `isometricCube`, `cylinder`, `stateStart`, `stateEnd`, `stateSync`, `activationBar`, `externalEntity`

#### Tool Modes
`selection`, `pan`

---

## 4. Style System

### FillStyle (10 types)
| Value | Description |
|-------|-------------|
| `hachure` | Default crosshatch (RoughJS) |
| `solid` | Solid fill |
| `cross-hatch` | Denser crosshatch |
| `zigzag` | Zigzag pattern |
| `dots` | Dotted pattern |
| `dashed` | Dashed line fill |
| `zigzag-line` | Zigzag line fill |
| `linear` | Linear gradient |
| `radial` | Radial gradient |
| `conic` | Conic gradient |

### StrokeStyle (3 types)
| Value | Dash Pattern |
|-------|-------------|
| `solid` | Continuous |
| `dashed` | `[8, 8]` |
| `dotted` | `[2, 4]` |

### FontFamily (3 types)
`hand-drawn`, `sans-serif`, `monospace`

### TextAlign
`left`, `center`, `right`

### VerticalAlign
`top`, `middle`, `bottom`

### BlendMode (18 types)
`normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `source-over`, `destination-over`

### ArrowHead (9 types)
| Value | Description |
|-------|-------------|
| `arrow` | Open arrow (two lines) |
| `triangle` | Filled triangle |
| `dot` | Filled circle |
| `circle` | Open circle |
| `bar` | Perpendicular bar |
| `diamond` | Open diamond |
| `diamondFilled` | Filled diamond |
| `crowsfoot` | Database crow's foot |
| `null` | No arrowhead |

### GradientType
`linear`, `radial`, `conic`

---

## 5. Layer System

### Layer Interface
```typescript
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;              // 0–1
  order: number;                // z-index (lower = behind)
  backgroundColor?: string;
  colorTag?: string;            // Organizational color
  parentId?: string;            // Group parent
  isGroup?: boolean;
  expanded?: boolean;           // Group UI state
}
```

### Layer Operations
| Operation | Function | Description |
|-----------|----------|-------------|
| Add | `addLayer(name?, parentId?)` | Create new layer at top |
| Delete | `deleteLayer(id)` | Remove layer and reassign elements |
| Activate | `setActiveLayer(id)` | Set working layer |
| Update | `updateLayer(id, updates)` | Modify properties |
| Duplicate | `duplicateLayer(id)` | Clone with all elements |
| Reorder | `reorderLayers(from, to)` | Move layer position |
| Merge | `mergeLayerDown(id)` | Combine with layer below |
| Flatten | `flattenLayers()` | Merge all into one |
| Isolate | `isolateLayer(id)` | Hide all other layers |
| Show All | `showAllLayers()` | Unhide all layers |
| Move Elements | `moveElementsToLayer(ids, targetId)` | Transfer elements |
| Create Group | `createLayerGroup(name?)` | New group container |
| Toggle Group | `toggleLayerGroupExpansion(id)` | Expand/collapse |
| Query Visible | `isLayerVisible(id)` | Recursive visibility check |
| Query Locked | `isLayerLocked(id)` | Recursive lock check |

### Rendering Order
Layers rendered in ascending `order`. Within a layer, elements rendered in array order. Viewport culling skips off-screen elements.

---

## 6. Slide System

### Slide Interface
```typescript
interface Slide {
  id: string;
  name: string;
  spatialPosition: { x: number; y: number };  // Position in infinite canvas
  dimensions: { width: number; height: number }; // Default 1920x1080
  order: number;                               // Presentation order
  backgroundColor?: string;                    // Default '#ffffff'
  thumbnail?: string;                          // Data URL preview
  transition?: SlideTransition;
}

interface SlideTransition {
  type: SlideTransitionType;
  duration: number;   // milliseconds, default 500
  easing: SlideTransitionEasing;
}
```

### Transition Types
| Type | Description |
|------|-------------|
| `none` | Immediate switch |
| `fade` | Overlay fade to target slide background |
| `slide-left` | Pan viewport left |
| `slide-right` | Pan viewport right |
| `slide-up` | Pan viewport up |
| `slide-down` | Pan viewport down |
| `zoom-in` | Two-phase zoom in with pan |
| `zoom-out` | Two-phase zoom out with pan |

### Transition Easings
`linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeOutBack`, `easeSpring`

### Spatial Canvas Model
- All elements stored in a single flat array (`store.elements`).
- Slides define spatial regions in the infinite canvas via `spatialPosition` + `dimensions`.
- An element belongs to a slide when its **center** falls within the slide's bounds:
  ```
  cx = el.x + el.width / 2
  cy = el.y + el.height / 2
  isOnSlide = cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH
  ```
- In `'slides'` mode, only active slide's elements render. In `'infinite'` mode, all render.
- Default horizontal spacing between slides: 2000px.

### Slide Operations
| Operation | Function |
|-----------|----------|
| Add | `addSlide()` |
| Delete | `deleteSlide(index)` |
| Switch | `setActiveSlide(index)` |
| Reorder | `reorderSlides(from, to)` |
| Set Transition | `updateSlideTransition(index, transition)` |
| Set Background | `updateSlideBackground(index, color)` |
| Set Document Type | `setDocType('infinite' \| 'slides')` |
| Zoom to Fit | `zoomToFitSlide()` |

### Global Settings
```typescript
interface GlobalSettings {
  theme?: 'light' | 'dark';
  defaultStyles?: Partial<DrawingElement>;
  animationEnabled?: boolean;    // Global toggle
  reducedMotion?: boolean;       // Accessibility
  renderStyle?: 'sketch' | 'architectural';
  showMindmapToolbar?: boolean;
}
```

---

## 7. Animation System

### Animation Engine

Singleton `AnimationEngine` class with `requestAnimationFrame` loop.

**Core API**:
- `create(id, onUpdate, config)` — Register animation
- `start(id)` / `pause(id)` / `stop(id)` / `reset(id)`
- `stopAll()` / `pauseAll()` / `resumeAll()`
- `globalTime()` — Reactive signal for current animation time

### Animation Types

```typescript
type AnimationTrigger = 'on-load' | 'on-click' | 'on-hover' | 'after-prev' | 'with-prev' | 'programmatic';
type AnimationAction = 'preset' | 'property' | 'rotate' | 'path' | 'transition' | 'orbit' | 'spin';

interface BaseAnimation {
  id: string;
  trigger: AnimationTrigger;
  duration: number;         // ms
  delay: number;            // ms
  easing: EasingName;
  repeat?: number;          // 0 = none, -1 = infinite
  yoyo?: boolean;           // Reverse on alternate
  restoreAfter?: boolean;   // Restore original state after
}
```

**PresetAnimation** — Predefined effects (name string, e.g. `'fadeIn'`, `'bounce'`).
**PropertyAnimation** — Tween a specific property (`x`, `y`, `opacity`, `angle`, colors).
**PathAnimation** — Move along a path element with optional `orientToPath`.
**RotateAnimation** — Rotate by angle, supports `relative` mode.

### Animatable Properties
Numeric: `x`, `y`, `width`, `height`, `opacity`, `angle`, `strokeWidth`, `roughness`
Colors: `strokeColor`, `backgroundColor`
Immediate: `flowAnimation`, `flowSpeed`, `flowStyle`

### Entrance Animations (62 presets)

**Attention Seekers**: `bounce`, `flash`, `pulse`, `rubberBand`, `shakeX`, `shakeY`, `headShake`, `swing`, `tada`, `wobble`, `jello`, `heartBeat`

**Back Entrances**: `backInDown`, `backInLeft`, `backInRight`, `backInUp`

**Bouncing Entrances**: `bounceIn`, `bounceInDown`, `bounceInLeft`, `bounceInRight`, `bounceInUp`

**Fading Entrances**: `fadeIn`, `fadeInDown`, `fadeInDownBig`, `fadeInLeft`, `fadeInLeftBig`, `fadeInRight`, `fadeInRightBig`, `fadeInUp`, `fadeInUpBig`, `fadeInTopLeft`, `fadeInTopRight`, `fadeInBottomLeft`, `fadeInBottomRight`

**Flippers**: `flip`, `flipInX`, `flipInY`

**Lightspeed**: `lightSpeedInRight`, `lightSpeedInLeft`

**Rotating Entrances**: `rotateIn`, `rotateInDownLeft`, `rotateInDownRight`, `rotateInUpLeft`, `rotateInUpRight`

**Zooming Entrances**: `zoomIn`, `zoomInDown`, `zoomInLeft`, `zoomInRight`, `zoomInUp`

**Sliding Entrances**: `slideInDown`, `slideInLeft`, `slideInRight`, `slideInUp`

**Special**: `rollIn`, `jackInTheBox`, `scaleIn`, `revolve`

`none` — No animation

### Exit Animations (62 presets)
Mirror of entrance animations: `fadeOut*`, `bounceOut*`, `zoomOut*`, `slideOut*`, `backOut*`, `rotateOut*`, `flipOut*`, `lightSpeedOut*`, `rollOut`, `hinge`, `scaleOut`

### Easing Functions (20+)
| Name | Type |
|------|------|
| `linear` | Linear |
| `easeInQuad`, `easeOutQuad`, `easeInOutQuad` | Quadratic |
| `easeInCubic`, `easeOutCubic`, `easeInOutCubic` | Cubic |
| `easeInExpo`, `easeOutExpo`, `easeInOutExpo` | Exponential |
| `easeInBounce`, `easeOutBounce`, `easeInOutBounce` | Bounce |
| `easeInElastic`, `easeOutElastic` | Elastic |
| `easeInBack`, `easeOutBack` | Back (overshoot) |
| `easeSpring` | Physics-based spring |

**Spring physics**: Configurable `stiffness` (170), `damping` (26), `mass` (1). Handles under-damped (oscillating), critically-damped, and over-damped cases.

### Sequence Animator
Manages ordered playback of per-element animation arrays:
- `playSequence(elementId, trigger)` — Play animations for one element
- `playAll(trigger)` / `stopAll()` — All elements
- Handles `after-prev` (sequential) and `with-prev` (parallel) triggers
- Captures original state for `restoreAfter` and programmatic preview

### Slide Transition Manager
Handles animated slide switching in presentation mode:
- Calculates viewport state to center and fit target slide
- Applies transition animation (fade, slide, zoom)
- Default margin: 40px, offset: 200px
- Respects `reducedMotion` accessibility preference

### Morph Animator
"Magic Move" between display states:
- `morphTo(targetState, duration = 800)` — Tween shared elements, fade in new ones
- Animates: `x`, `y`, `width`, `height`, `opacity`, `angle`, `backgroundColor`, `strokeColor`
- Uses `easeInOutQuad` easing

---

## 8. Display States (State Morphing)

```typescript
interface DrawingElementState {
  x: number; y: number;
  width: number; height: number;
  opacity: number; angle: number;
  backgroundColor: string; strokeColor: string;
  text: string;
}

interface DisplayState {
  id: string;
  name: string;
  overrides: Record<string, Partial<DrawingElementState>>;
  // elementId → property overrides
}
```

### Operations
| Operation | Function |
|-----------|----------|
| Capture | `addDisplayState(name)` |
| Update | `updateDisplayState(id)` |
| Delete | `deleteDisplayState(id)` |
| Apply | `applyDisplayState(id, animate?)` |
| Next | `applyNextState()` |
| Previous | `applyPreviousState()` |
| Panel | `toggleStatePanel(visible?)` |

---

## 9. Connector System

### Binding Structure
```typescript
startBinding / endBinding: {
  elementId: string;    // Connected shape
  focus: number;        // 0–1 position on shape
  gap: number;          // Distance from edge (px)
  position?: string;    // 'top' | 'bottom' | 'left' | 'right'
} | null
```

When the bound element moves, connector endpoints are recalculated automatically.

### Curve Types
| Type | Description |
|------|-------------|
| `straight` | Direct line between points |
| `bezier` | Cubic bezier (auto or manual control points) |
| `elbow` | Orthogonal right-angle routing |

### Elbow Routing Algorithm (`routing.ts`)
- `calculateElbowRoute(start, end, startPos?, endPos?)` → `Point[]`
- Respects entry/exit directions (top/bottom/left/right)
- 20px offset from element edges
- Cleans collinear and duplicate points

### Arrowhead Rendering
- Head length: 12px constant
- Angles calculated from curve tangent (45 degrees)
- Sketch mode: RoughJS hand-drawn
- Architectural mode: Canvas precise lines

---

## 10. Mindmap System

### Hierarchy
- `parentId` links child to parent element
- `isCollapsed` hides subtree
- Connectors (`arrow` or `organicBranch`) auto-created between parent-child

### Layout Algorithms

```typescript
type LayoutDirection = 'horizontal-right' | 'horizontal-left' | 'vertical-down' | 'vertical-up' | 'radial';
```

- **Horizontal**: Calculates subtree heights, assigns positions with horizontal spacing
- **Vertical**: Calculates subtree widths, assigns positions with vertical spacing
- **Radial**: Circular arrangement around root

**Spacing**: `hSpacing = 100px` (between levels), `vSpacing = 40px` (between siblings)

### Operations
| Operation | Function |
|-----------|----------|
| Add Child | `addChildNode(parentId)` |
| Add Sibling | `addSiblingNode(siblingId)` |
| Collapse | `toggleCollapse(id)` |
| Reparent | `setParent(childId, parentId)` |
| Layout | `reorderMindmap(rootId, direction)` |
| Style | `applyMindmapStyling(rootId)` |

### Semantic Styling Palette (depth-based)
```
Level 0: #e03131 (Red)     Level 1: #1971c2 (Blue)     Level 2: #2f9e44 (Green)
Level 3: #f08c00 (Orange)  Level 4: #9c36b5 (Purple)   Level 5: #0b7285 (Teal)
Level 6: #748ffc (Indigo)  Level 7: #f76707 (Deep Orange) Level 8: #099268 (Green-Teal)
```

---

## 11. Rendering Pipeline Details

### Shape Registry
Maps `ElementType` → `ShapeRenderer`. 16 specialized renderers:

| Renderer | Handles |
|----------|---------|
| `RectangleRenderer` | rectangle |
| `CircleRenderer` | circle (ellipse) |
| `DiamondRenderer` | diamond |
| `TextRenderer` | text |
| `ImageRenderer` | image |
| `StickyNoteRenderer` | stickyNote |
| `PolygonRenderer` | triangle, hexagon, octagon, parallelogram, trapezoid, rightTriangle, pentagon, septagon, polygon |
| `FlowchartRenderer` | database, document, predefinedProcess, internalStorage |
| `SketchnoteRenderer` | starPerson, lightbulb, signpost, burstBlob, scroll, wavyDivider, doubleBanner |
| `InfraRenderer` | server, loadBalancer, firewall, user, messageQueue, lambda, router |
| `ContainerRenderer` | browserWindow, mobilePhone |
| `PathRenderer` | organicBranch |
| `WireframeRenderer` | browser, ghostButton, inputField |
| `ConnectorRenderer` | line, arrow, bezier |
| `FreehandRenderer` | fineliner, inkbrush, marker, ink |
| `SpecialtyShapeRenderer` | star, cloud, heart, burst, callout, speechBubble, ribbon, brackets, cross, checkmark, capsule, directional arrows, DFD, cylinder, state shapes, externalEntity |

### Render Pipeline (`render-pipeline.ts`)
1. **Apply transformations**: rotation (around center), opacity (element * layer), blend mode, shadow
2. **Persistent animations**: spin (continuous rotation), orbit (around `orbitCenterId`)
3. **Complex fills**: Linear/radial/conic gradients, dot pattern fills
4. **Delegate**: `renderSketch()` (RoughJS) or `renderArchitectural()` (Canvas API)
5. **Text**: Auto-wrapping, font composition, highlight backgrounds
6. **Flow animation**: Animated `lineDash` offset (dashes/dots/pulse)

### Dark Mode
- Color inversion: `#000000` ↔ `#ffffff`
- Canvas background: `'#121212'` (dark) vs `'#ffffff'` (light)
- Grid color adjustment
- Theme persisted in `localStorage`

### Viewport Culling
- Visible rect calculated from `panX`, `panY`, `scale`, canvas `width`/`height`
- Elements outside visible bounds skipped
- AABB intersection test per element

---

## 12. Grid & Snapping

### Grid Settings
```typescript
interface GridSettings {
  enabled: boolean;           // Show grid, default false
  snapToGrid: boolean;        // Snap elements, default false
  objectSnapping: boolean;    // Snap to other objects, default true
  gridSize: number;           // Spacing px, default 20
  gridColor: string;          // Default '#cccccc'
  gridOpacity: number;        // 0–1, default 0.5
  style: 'lines' | 'dots';   // Grid visual style
}
```

### Object Snapping (`object-snapping.ts`)
- Detects alignment with other elements: left, center, right edges (vertical) and top, middle, bottom edges (horizontal)
- Threshold: ~5–10px
- Returns `SnappingGuide[]` with guide lines + delta to apply
- Layer-aware: only snaps within visible elements

### Spacing Guides (`spacing.ts`)
- Detects equal spacing between elements
- Visual feedback for maintaining consistent gaps

### Snap-to-Grid (`snap-helpers.ts`)
- `snapToGrid(value, gridSize)` — Round to nearest grid multiple
- `snapPoint(x, y, gridSize)` — Snap both coordinates
- `snapDimension(dimension, gridSize, minSize)` — Snap sizes

---

## 13. Selection & Interaction

### Selection State
- `store.selection: string[]` — Array of selected element IDs
- Click: Select single element (clears previous)
- Shift+Click: Add/remove from selection
- Drag box: Select all within bounds
- Double-click: Start text editing

### Resize Handles
8 corner + 4 edge handles per selected element:
- Corners: `tl`, `tr`, `bl`, `br` → `nwse-resize` / `nesw-resize`
- Edges: `tm`, `bm`, `lm`, `rm` → `ns-resize` / `ew-resize`

**Modifiers**:
- Shift: Proportional resize
- Alt: Resize from center
- Constrained elements (`constrained: true`): Always proportional

### Rotation
- Angle stored as radians
- Canvas context `rotate()` transform applied at element center

### Hit Detection
| Shape Type | Algorithm |
|-----------|-----------|
| Rectangles, polygons | `isPointInPolygon()` |
| Lines, paths | `distanceToSegment()` (threshold-based) |
| Bezier curves | `isPointOnBezier()` |
| Circles | Distance from center vs radius |
| Ellipses | `isPointInEllipse()` |

### Context Menu (Right-Click)
- Edit text
- Copy / Paste / Cut / Duplicate / Delete
- Bring to Front / Send to Back / Bring Forward / Send Backward
- Group / Ungroup
- Lock / Unlock
- Move to Layer
- Copy Style / Paste Style

### Alignment & Distribution
| Alignment | Direction |
|-----------|-----------|
| `left`, `center`, `right` | Horizontal |
| `top`, `middle`, `bottom` | Vertical |

Distribution: `horizontal`, `vertical` — evenly spaces selected elements.

---

## 14. History System (Undo/Redo)

```typescript
interface HistorySnapshot {
  elements: DrawingElement[];
  layers: Layer[];
}
```

- **Stack limit**: 50 snapshots
- `pushToHistory()` — Called before mutating operations
- `undo()` — Pops from undo stack, pushes current to redo
- `redo()` — Pops from redo stack, pushes current to undo
- New actions clear the redo stack
- `clearHistory()` — Called on document load / new document

**Tracked mutations**: Add/delete elements, move, resize, rotate, style changes, layer operations, grouping, alignment, distribution.

---

## 15. Storage & Persistence

### Server API (`/api/drawings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drawings/{id}` | Save drawing |
| GET | `/api/drawings/{id}` | Load drawing |
| GET | `/api/drawings` | List all drawings |
| DELETE | `/api/drawings/{id}` | Delete drawing |

### Format Migration
- v2 (flat `DrawingData`) → v4 (`SlideDocument`) via `migrateToSlideFormat()`
- Point encoding upgrade: `{ x, y }[]` → flat `[x, y, x, y, ...]`
- Preserves metadata timestamps

### Browser Storage
- IndexedDB for workspace saves (via `storage` interface)
- `localStorage` for theme preference and UI state

---

## 16. Export System

### Supported Formats
| Format | Function | Type | Multi-page |
|--------|----------|------|-----------|
| PNG | `exportToPng(scale, bg, selection)` | Raster | No |
| SVG | `exportToSvg(selection)` | Vector | No |
| PDF | `exportToPdf(scale, bg, selection)` | Raster-in-PDF | Yes |
| PPTX | `exportToPptx(scale, bg, selection)` | Raster-in-PPTX | Yes |
| WebM | Canvas `captureStream(60)` + MediaRecorder | Video | N/A |
| MP4 | Canvas `captureStream(60)` + MediaRecorder | Video | N/A |

### Common Options
- **Scale**: 1x, 2x, 3x (DPI multiplier for raster)
- **Background**: White fill or transparent
- **Selection only**: Export only selected elements

### Multi-page Export (PDF/PPTX)
- In slides mode: One page/slide per document slide
- Elements filtered by spatial bounds (center-in-slide check)
- Each slide rendered to offscreen canvas → embedded as image
- PDF: JPEG 0.92 quality via jsPDF
- PPTX: PNG lossless via PptxGenJS (10" base width)

### Video Recording (`video-recorder.ts`)
- Canvas `captureStream(60)` at 60 FPS
- MediaRecorder with VP9 (WebM) or H.264 (MP4)
- Fallback MIME type negotiation
- Filename: `yappy-recording-{timestamp}.{ext}`

---

## 17. Programmatic API (`window.Yappy`)

Mounted via `initAPI()` in `app.tsx`. Provides full programmatic control.

### Element Creation
| Method | Signature |
|--------|-----------|
| `createElement` | `(type, x, y, w, h, options?) → id` |
| `createRectangle` | `(x, y, w, h, options?) → id` |
| `createCircle` | `(x, y, w, h, options?) → id` |
| `createDiamond` | `(x, y, w, h, options?) → id` |
| `createTriangle` | `(x, y, w, h, options?) → id` |
| `createStar` | `(x, y, w, h, points?, options?) → id` |
| `createPolygonalShape` | `(type, x, y, w, h, options?) → id` |
| `createLine` | `(x1, y1, x2, y2, options?) → id` |
| `createArrow` | `(x1, y1, x2, y2, options?) → id` |
| `createBezier` | `(x1, y1, x2, y2, options?) → id` |
| `createOrganicBranch` | `(x1, y1, x2, y2, options?) → id` |
| `createText` | `(x, y, text, options?) → id` |
| `createImage` | `(x, y, dataURL, w, h, options?) → id` |
| `createBrowserWindow` | `(x, y, w, h, options?) → id` |
| `createStickyNote` | `(x, y, w, h, text?, options?) → id` |
| `connect` | `(sourceId, targetId, options?) → id` |

### Element Manipulation
`getElement(id)`, `updateElement(id, updates)`, `deleteElement(id)`, `clear()`, `duplicate(id)`

### Selection
`setSelected(ids)`, `clearSelection()`, `moveSelectedElements(dx, dy)`

### View
`setView(scale, panX, panY)`, `zoomToFit()`, `zoomToFitSlide()`

### History
`undo()`, `redo()`

### Grouping
`groupSelection()`, `ungroupSelection()`

### Z-Order
`bringToFront(ids)`, `sendToBack(ids)`, `moveElementZIndex(id, direction)`

### Alignment
`alignSelectedElements(type)`, `distributeSelectedElements(type)`

### Layers
`addLayer(name?)`, `deleteLayer(id)`, `setActiveLayer(id)`, `updateLayer(id, updates)`, `duplicateLayer(id)`, `reorderLayers(from, to)`, `mergeLayerDown(id)`, `flattenLayers()`, `isolateLayer(id)`, `showAllLayers()`, `moveElementsToLayer(ids, targetId)`, `createLayerGroup(name?)`, `toggleLayerGroupExpansion(id)`, `isLayerVisible(id)`, `isLayerLocked(id)`

### Slides
`addSlide()`, `deleteSlide(index)`, `setActiveSlide(index)`, `reorderSlides(from, to)`, `updateSlideTransition(index, transition)`, `updateSlideBackground(index, color)`, `setDocType(type)`, `loadDocument(doc)`, `resetToNewDocument(docType)`

### Display States
`addDisplayState(name)`, `updateDisplayState(id)`, `deleteDisplayState(id)`, `applyDisplayState(id, animate?)`, `toggleStatePanel(visible?)`, `applyNextState()`, `applyPreviousState()`

### Mindmap
`addChildNode(parentId)`, `addSiblingNode(siblingId)`, `toggleCollapse(id)`, `toggleCollapseSelection()`, `setParent(childId, parentId)`, `reorderMindmap(rootId, direction)`, `applyMindmapStyling(rootId)`

### UI Panels
`togglePropertyPanel(visible?)`, `toggleLayerPanel(visible?)`, `toggleCommandPalette(visible?)`, `togglePresentationMode(visible?)`, `toggleMinimap(visible?)`, `toggleZenMode(visible?)`, `toggleSlideNavigator(visible?)`, `toggleStatePanel(visible?)`

### Canvas
`toggleGrid()`, `toggleSnapToGrid()`, `updateGridSettings(settings)`, `updateDefaultStyles(styles)`, `setCanvasBackgroundColor(color)`, `setCanvasTexture(texture)`, `toggleTheme()`, `setSelectedTool(tool)`

### Animation
`animateElement`, `animateElements`, `createTimeline`, `fadeIn`, `fadeOut`, `scaleIn`, `bounce`, `pulse`, `shakeX`, `stopElementAnimation`, `pauseElementAnimation`, `resumeElementAnimation`, `easings`, `animationEngine`, `createSpring`

### Clipboard
`copyToClipboard`, `cutToClipboard`, `pasteFromClipboard`, `copyStyle`, `pasteStyle`

### Template
`loadTemplate(templateData)`

---

## 18. Keyboard Shortcuts

### Tool Selection (Single Key)
| Key | Tool |
|-----|------|
| V | Selection |
| R | Rectangle |
| O | Circle |
| L | Line |
| A | Arrow |
| T | Text |
| E | Eraser |
| B | Bezier |
| D | Diamond |
| H | Pan |

### Actions
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+G | Group |
| Ctrl+Shift+G | Ungroup |
| Ctrl+] | Bring to Front |
| Ctrl+[ | Send to Back |
| Delete | Delete selected |
| Ctrl+A | Select all |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+D | Duplicate |

### View
| Shortcut | Action |
|----------|--------|
| Shift+' | Toggle Grid |
| Shift+; | Toggle Snap to Grid |
| Alt+Z | Toggle Zen Mode |
| Alt+Enter | Toggle Properties Panel |
| Alt+L | Toggle Layers Panel |
| Alt+M | Toggle Minimap |
| Alt+N | New Sketch |
| Ctrl+Shift+E | Export Dialog |

### Layers
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+N | Add Layer |

### Mindmap
| Key | Action |
|-----|--------|
| Tab | Add child node |
| Enter | Add sibling node |

### Navigation
| Input | Action |
|-------|--------|
| Scroll | Zoom in/out |
| Shift+Scroll | Pan horizontally |
| Space+Drag | Pan canvas |
| Arrow keys | Nudge selected elements |

---

## 19. Templates

```typescript
type TemplateCategory = 'diagrams' | 'sketchnotes' | 'animations' | 'wireframes';

interface Template {
  metadata: {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
    tags: string[];
    thumbnail?: string;
    author?: string;
    order?: number;
  };
  data: {
    elements: DrawingElement[];
    layers: Layer[];
    viewState?: ViewState;
    gridSettings?: GridSettings;
    globalSettings?: GlobalSettings;
    canvasBackgroundColor?: string;
  };
}
```

`loadTemplate(data)` clears history, replaces canvas content with template data.

---

## 20. Configuration Defaults

### Default Element Styles
```typescript
{
  strokeColor: '#000000',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  renderStyle: 'sketch',
  opacity: 100,
  angle: 0,
  roundness: null,
  locked: false,
  fontSize: 20,
  fontFamily: 'hand-drawn',
  fontWeight: false,
  fontStyle: false,
  textAlign: 'left',
  startArrowhead: null,
  endArrowhead: 'arrow',
  autoResize: false,
  shadowEnabled: false,
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  gradientDirection: 45,
  smoothing: 3,
  taperAmount: 0.15,
  velocitySensitivity: 0.5
}
```

### Default Grid
```typescript
{
  enabled: false,
  snapToGrid: false,
  objectSnapping: true,
  gridSize: 20,
  gridColor: '#cccccc',
  gridOpacity: 0.5,
  style: 'lines'
}
```

### Default Slide
```typescript
{
  dimensions: { width: 1920, height: 1080 },
  backgroundColor: '#ffffff',
  transition: { type: 'none', duration: 500, easing: 'easeInOutQuad' }
}
```

### Canvas Textures
`'none'`, `'dots'`, `'grid'`, `'graph'`, `'paper'`

### Performance Limits
| Limit | Value |
|-------|-------|
| Undo stack | 50 snapshots |
| Laser trail | 100 points, 800ms decay |
| Pen point throttle | 16ms (60 FPS) |
| Snap calculation throttle | 16ms |
| Thumbnail capture debounce | 1000ms |
| Video capture | 60 FPS |
