# Yappydraw Features

## What Makes Yappydraw Unique

Yappydraw is positioned for **animated technical diagrams, presentations, and interactive visualizations** - a niche that Excalidraw, Miro, and tldraw don't fully address.

| Tool | Focus |
|------|-------|
| Excalidraw | Hand-drawn simplicity |
| Miro | Collaboration & workflows |
| tldraw | Extensibility & SDK |
| **Yappydraw** | **Animation + Presentation + Technical diagrams** |

---

## Animation System

### Animation Engine
- **30+ animation presets**: fadeIn, slideUp, bounce, pulse, shake, flip, morph, wiggle, typewriter, etc.
- **Spring physics easing**: Damped harmonic oscillator with stiffness/damping/mass parameters
- **20+ easing functions**: Quadratic, cubic, exponential, bounce, elastic, back easings
- **Keyframe system**: Support for keyframes at normalized timeline positions

### Element-Level Animations
- **Animatable properties**: x, y, width, height, opacity, angle, strokeWidth, roughness
- **Color animation**: Smooth hex color interpolation
- **Animation triggers**: on-load, on-click, on-hover, after-prev, with-prev, programmatic
- **Animation actions**: preset, property, rotate, path, transition, orbit, spin

### Persistent/Looping Animations
- **Spin**: Element rotation with configurable speed
- **Orbit**: Elements revolve around a center element (radius, speed, CW/CCW)
- **Flow effects**: Animated dashes, dots, or pulses along connectors
- **TTL (Time-To-Live)**: Expiring elements with automatic cleanup

### State Morphing ("Magic Move")
- **MorphAnimator**: Smooth transitions between saved display states
- **Intelligent mapping**: Identifies shared elements and animates them
- **DisplayState system**: Save and apply element state overrides

---

## Presentation & Slides

### Slide System
- **Spatial slides**: Slides positioned on infinite canvas (v4 format)
- **Slide navigator**: Visual browser with thumbnails
- **Per-slide settings**: Background color, name, transition
- **Slide Master**: Define global branding, logos, and headers that repeat on every slide
- **Dynamic Variable Replacement**: Automatically update text (e.g., `${slideNumber}`, `${totalSlides}`) across the entire deck

### Slide Transitions
- **8 transition types**: none, fade, slide-left/right/up/down, zoom-in/out
- **Duration control**: 100-3000ms configurable
- **9 easing options**: Linear, quad, cubic, back, spring
- **Preview button**: Test transitions before presenting

### Presentation Tools
- **Laser pointer**: Transient trails with decay animation
- **Temporary ink**: Time-to-live strokes that fade out
- **Keyboard navigation**: Arrow keys to navigate slides

---

## Mindmap System

### Layout Engine
- **5 layout directions**:
  - Horizontal Left/Right
  - Vertical Up/Down
  - Radial
- **Auto-styling**: Recursive color palette (8 colors) for visual hierarchy
- **Collapsible nodes**: Toggle visibility of child branches

### Mindmap Features
- **Organic branch connectors**: Tapered bezier curves for natural look
- **Hierarchy management**: Parent-child relationships
- **Keyboard shortcuts**: Tab (child), Enter (sibling), Space (collapse), Arrow keys (navigate), Shift+F (focus branch)
- **Mindmap toolbar**: Add child/sibling, auto-style, reorder layouts

---

## Drawing Tools

### Pen Tool Variants
| Tool | Description |
|------|-------------|
| Fineliner | Thin, precise drawing |
| Inkbrush | Medium weight with brush feel |
| Marker | Bold, thick strokes |
| Laser | Pointer with decay trails |
| Ink (TTL) | Strokes that fade out over time |

### Pen Features
- **Pressure sensitivity**: Optional pressure values for stroke variation
- **Flat point encoding**: Optimized storage format
- **Performance optimized**: Local buffering, throttled updates

---

## Shape Library (95+ Shapes)

### Basic Shapes
Rectangle, Circle, Diamond, Triangle, Hexagon, Octagon, Parallelogram, Star, Polygon, Ellipse

### Specialty Shapes
Cloud, Heart, Burst, Callout, Speech Bubble, Ribbon, Brackets, Cross, Checkmark, Capsule, Arrows

### Infrastructure/Architecture (13)
| Shape | Use Case |
|-------|----------|
| Server | Backend systems |
| LoadBalancer | Traffic distribution |
| Firewall | Security boundaries |
| Lambda | Serverless functions |
| MessageQueue | Async messaging |
| Router | Network routing |
| Database | Data storage |
| Browser | Client applications |

### DFD & State Machine
- dfdProcess, dfdDataStore
- stateStart, stateEnd, stateSync, externalEntity, activationBar

### Flowchart
- PredefinedProcess, InternalStorage, Document

### Sketchnote (7)
StarPerson, Lightbulb, Signpost, BurstBlob, Scroll, WavyDivider, DoubleBanner

### BPMN 2.0 (15)
Start Event, End Event, Intermediate Event, Exclusive Gateway, Parallel Gateway, Inclusive Gateway, Event Gateway, Task, Sub-Process, Call Activity, Data Object, Data Store, Text Annotation, Group, Pool/Swimlane

### Wireframe
BrowserWindow, MobilePhone, InputField, GhostButton, SearchBar, Toggle, Slider

---

## Advanced Styling

### Gradient System
- **Types**: Linear, Radial, Conic
- **Configurable stops**: Multiple color stops at normalized offsets
- **Gradient handles**: Visual editor for positioning

### Shadow Properties
- shadowEnabled, shadowColor, shadowBlur
- shadowOffsetX, shadowOffsetY

### Blend Modes (18)
normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity, source-over, destination-over

### Text Styling
- **Text highlighting**: Background color with padding and radius
- **Custom fonts**: Font family, size, weight, style
- **Text alignment**: Left, center, right

### Advanced Shape Properties
- **Double borders**: Inner border with configurable distance
- **Star points**: 3-12 configurable
- **Polygon sides**: 3-20 configurable
- **Border radius**: 0-50% corner radius
- **Filter effects**: CSS filter string support

---

## Connector System

### Arrowhead Types (9)
| Type | Symbol |
|------|--------|
| Arrow | → |
| Triangle | ▷ (Inheritance) |
| Dot | ● |
| Circle | ○ |
| Bar | \| |
| Diamond | ◇ (Aggregation) |
| DiamondFilled | ◆ (Composition) |
| Crowsfoot | ⋔ (ER diagrams) |
| None | - |

### Curve Routing
- **Straight**: Direct line
- **Bezier**: Smooth curves with control points
- **Elbow**: Orthogonal routing with A* smart pathfinding
- **Polyline**: Click-to-place multi-segment paths

### Elbow Connector Features
- **Multi-bend drawing**: Direction changes during draw automatically create bend points
- **Smart arrow direction**: Auto-detects best anchor position (top/bottom/left/right) based on relative shape positions
- **Draggable bend points**: Click and drag individual bend vertices to reshape the route
- **Draggable edge segments**: Drag horizontal/vertical segments to adjust routing
- **Smart routing**: A* pathfinding routes around obstacles for bound connectors

### Connector Features
- Smart binding to shapes
- Label positioning (start, middle, end)
- Flow animation (dashes, dots, pulse)

---

## BPMN Swimlanes

### Pool / Lane System
- **Dynamic lanes**: Add/remove lanes via context menu (up to 6 lanes)
- **Orientation toggle**: Horizontal (top-to-bottom) or Vertical (left-to-right)
- **Lane labels**: Editable per-lane labels with rotated text rendering
- **Pool header**: Dedicated header strip with pool title

### Lane Customization
- **Per-lane colors**: Background and text colors via context menu swatches
- **Drag-to-resize**: Draggable lane dividers for proportional sizing
- **Draggable header/label widths**: Adjust pool header and lane label strip widths
- **Collapsible lanes**: Collapse to thin strip, hiding contained elements

### Element Containment
- **Auto-assign on drop**: Elements dropped inside a lane auto-associate
- **Move with pool**: Contained elements move when pool is moved
- **Lane-aware deletion**: Removing a lane uncontains its elements and shifts indices

### Rendering
- **Sketch + Architectural modes**: Both RoughJS hand-drawn and clean line rendering
- **BPMN demo diagram**: "Ordering a drink from a Vending machine" example included

---

## Export & Recording

### Image Export
- **PNG**: With scale options (1x, 2x, 3x), background control, selection-only
- **SVG**: Vector format with full shape support

### Video Recording
- **Canvas capture**: 60 FPS recording
- **Formats**: WebM (VP9/H264), MP4
- **Auto-download**: Timestamped file names

---

## Layer System

### Layer Features
- **Hierarchy**: Parent/child relationships with groups
- **Properties**: Visibility, locked, opacity, z-order
- **Color tags**: Organizational tagging
- **Groups**: Container layers with expand/collapse

---

## Rendering Modes

### Sketch vs Architectural
- **Sketch**: Hand-drawn look with RoughJS
- **Architectural**: Clean, precise lines

### Fill Styles
hachure, solid, cross-hatch, zigzag, dots, dashed, zigzag-line, linear gradient, radial gradient, conic gradient

### Roughness Control
- Configurable sketch roughness (0-100)

---

## Grid & Snapping

- **Grid styles**: Lines or dots
- **Configurable size**: Custom spacing
- **Snap to grid**: Toggleable
- **Object snapping**: Snap to other elements
- **Smart spacing guides**: Visual distance indicators

---

## Keyboard Shortcuts

### Tools
| Key | Tool |
|-----|------|
| V | Selection |
| R | Rectangle |
| C | Circle |
| D | Diamond |
| L | Line |
| A | Arrow |
| T | Text |
| P | Pen |
| E | Eraser |
| H | Pan (Hand) |
| B | Bezier curve |
| 0 | Bezier curve (alt) |
| Double-click tool | Lock tool (stay active after drawing) |

### Actions
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Ctrl+A | Select All |
| Ctrl+G | Group |
| Ctrl+Shift+G | Ungroup |
| Delete | Delete selected |
| Escape | Deselect / Close dialogs |

### Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl+M | Add slide |
| Arrow keys | Navigate slides |
| Alt+M | Toggle minimap |
| Shift+? | Help dialog |

---

## Bulk Editing & Selection

### Multi-Select Property Editing
- **Common property panel**: When multiple elements are selected, shows only properties shared by ALL selected types
- **Mixed value detection**: Properties with differing values show "Mixed" indicators (badges, placeholders, indeterminate checkboxes)
- **Bulk apply**: Changing any property value applies to all selected elements at once
- **Selection summary**: Header shows count and type breakdown (e.g., "3 rectangle, 2 arrow")

### Select by Type (Context Menu)
- **Category shortcuts**: All Lines & Arrows, Text & Notes, Images, Videos, All Shapes
- **Per-type selection**: Individual type entries with element counts
- **All Same Type**: Expand selection to all elements matching current selection's type(s)
- Available from both canvas and element right-click menus

### Select by Same Property (Context Menu)
- **Property matching**: Right-click a single element to find all elements sharing a property value
- **Matchable properties**: Fill Color, Stroke Color, Text Color, Stroke Width, Font Size, Font Family, Opacity, Fill Style, Stroke Style, Drawing Style
- **Count indicators**: Shows how many elements share each property value

---

## Unique Differentiators Summary

1. **Physics-based animation engine** with spring easing
2. **State morphing/magic move** transitions
3. **Laser pointer** with decay trails
4. **Organic branch connectors** for mindmaps
5. **Comprehensive mindmap system** with 5 layouts
6. **95+ specialized shapes** (BPMN, UML, DFD, infrastructure, wireframe, sketchnote)
7. **Persistent animations** (orbit, spin, flow)
8. **18 blend modes** and advanced effects
9. **Slide-based presentation** with 8 transition types
10. **Display states system** for interactive diagrams
11. **Slide Master system** with dynamic variable replacement
12. **Video export** (WebM/MP4 recording)
12. **Double border capability** for shapes
