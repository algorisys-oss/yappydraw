# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.0] - 2026-02-11

### Added
- **BPMN 2.0 shape library** with 15 dedicated shapes for business process modeling:
  - **Events**: Start Event, End Event, Intermediate Event (thin/thick/double circle)
  - **Gateways**: Exclusive (XOR), Parallel (AND), Inclusive (OR), Event-based (4 diamond variants)
  - **Activities**: Task, Sub-Process (with [+] marker), Call Activity (bold border)
  - **Artifacts**: Data Object (folded page), Data Store (cylinder), Text Annotation (bracket), Group (dashed rect)
  - **Swimlanes**: Pool / Lane with up to 6 horizontal lane dividers
- **11 event type icons** — message (envelope), timer (clock), error (zigzag), signal (triangle), conditional (page), escalation (chevron), compensation (rewind), link (pentagon), terminate (filled circle), cancel (X mark)
- **8 task type markers** — user, service, script, manual, send, receive, business rule (table/grid)
- **5 loop/multi-instance markers** — standard loop, parallel multi-instance, sequential multi-instance, compensation
- **Non-interrupting events** — dashed border toggle for Start and Intermediate events (boundary events)
- **BPMN icon customization** — Icon Scale (0.5–2.0), Icon Color override, Fill Icon toggle (catching vs throwing)
- **BPMN toolbar dropdown** with 15 custom SVG icons grouped by category
- **`data/bpmn.json`** — comprehensive BPMN 2.0 shape reference file for review
- **BPMN help documentation** covering all shapes, markers, patterns, and best practices
- Welcome screen BPMN 2.0 category pill
- `createBpmnShape()` API method with smart defaults per shape type

### Fixed
- **RoughJS cache invalidation for BPMN** — `computeElementHash` now includes all BPMN properties, preventing stale cached renders when event type, task type, or other BPMN properties change
- **Shape geometry for Event Gateway and Data Store** — fixed undefined `cx`/`cy` variables (should be `0` in local coordinates)
- **Property type mismatch** — `bpmnIconFilled` and `bpmnNonInterrupting` now use `'toggle'` type instead of invalid `'boolean'`
- **Draw handler defaults** — BPMN shapes now correctly default to solid strokes and normalize negative dimensions

## [1.9.0] - 2026-02-10

### Added
- **14 new UI/UX wireframe shapes** for rapid prototyping:
  - **Form**: Solid Button, Dropdown, Checkbox, Radio Button, Toggle Switch, Search Bar, Slider
  - **Container**: Card (rounded rect with header divider)
  - **Navigation**: Navbar (hamburger + title + action icons), Tab Bar (Material Design text tabs with underline indicator)
  - **Feedback**: Avatar (person silhouette), Progress Bar, Badge (pill label), Tooltip (rect with pointer)
- **Data-driven shape architecture** — new `ui-shape-defs.tsx` config array replaces hard-coded renderers; adding a new UI shape now requires only one config entry instead of touching 8+ files
- **Categorized wireframe toolbar** — dropdown grouped by Container, Form, Navigation, Feedback with category headers
- **Custom text rendering** for Navbar, Tab Bar, and Input Field — comma-separated labels parsed and rendered with active tab indicators
- **API methods**: `createUIComponent()`, `createSolidButton()`, `createDropdown()`, `createCard()` for programmatic shape creation
- Click-to-create support for all UI shapes using config-defined default dimensions

### Changed
- Unified `UIComponentRenderer` dispatches to config-defined render functions (architectural + sketch modes)
- Shape registration, toolbar, icon maps, and property configs now auto-derived from config array
- Wireframe tool group refactored from hard-coded tool list to config-driven categorized layout

## [1.8.6] - 2026-02-10

### Fixed
- Diamond shape fill color in architectural mode with borderRadius > 0 — was inheriting fill from previously rendered shape due to missing `ctx.fillStyle` and Path2D rendering quirk (Bug #22)
- Multi-select property panel now only shows properties applicable to selected shape types — table-only properties (Row Color, Alt Row Color, Header Text, etc.) no longer appear when no table is selected (Bug #23)

## [1.8.5] - 2026-02-09

### Added
- Contextual modifier hints in status bar — reactive keyboard shortcut hints based on active tool and selection (shape, connector, drawing, mindmap, etc.)
- Mindmap-specific hints: Alt+Drag (move tree), Tab (add child), Enter (add sibling)
- Global settings button in bottom-left floating buttons (gear icon before property toggle)
- Quick Toolbar toggle in global settings dialog (on/off switch)
- Drawing Style (Sketch/Architectural) selector in global settings dialog
- Line Width mini-slider (1–20px) in connector floating quick toolbar

### Fixed
- Sketch-mode arrowheads on dashed/dotted connectors now render solid (no longer incomplete)
- Presentation mode for infinite canvas documents now starts at 100% zoom centered on content (slides still fit-to-screen)

### Changed
- Standardized mindmap drag behavior: Drag moves only the selected node, Alt+Drag moves the entire subtree (uniform for root and child nodes)
- Settings dialog reorganized: new "General" section with Quick Toolbar toggle and Drawing Style; removed duplicate Render Style from defaults

## [1.8.4] - 2026-02-09

### Added
- localStorage auto-save with silent restore on startup (like Excalidraw/tldraw)
- Real-time debounced saves (1s after last change), immediate save on slide navigation and tab close
- Dirty state indicator (red dot) in status bar next to document name
- Multi-tab awareness with toast warning when another tab edits the same document
- `Yappy.forceAutoSave()` and `Yappy.clearAutoSave()` on public API

### Fixed
- Arrow connector handle endpoints now include `position` in endBinding for proper anchor tracking (Bug #19)
- Moving shape+arrow selections no longer corrupts arrow geometry — uses `batch()` and two-pass update (Bug #20)
- SVG export now renders standalone text and container text with proper font, alignment, and word wrapping (Bug #21)

## [1.8.3] - 2026-02-09

### Fixed
- Pasted organic branches no longer change curve orientation — `controlPoints` (absolute coordinates) are now offset by the paste displacement
- Pasted connectors no longer anchor to original shapes — bindings referencing elements outside the pasted selection are cleared instead of preserved

## [1.8.2] - 2026-02-09

### Fixed
- Copy-paste now maintains relative positions of shapes instead of stacking them at a single point
- Copy serialization properly unwraps SolidJS store proxies before clipboard write
- Paste handler uses already-parsed clipboard data directly instead of unreliable async re-read
- Duplicate (Ctrl+D) now generates human-readable sequential IDs (e.g. `rect-3`) instead of GUIDs
- `generateId()` batch uniqueness — multiple elements of the same type no longer get duplicate IDs

### Changed
- Migrated all element, layer, slide, and state ID generation from `crypto.randomUUID()` to `generateId()` with human-readable sequential naming pattern (`{type}-{n}`)
- `generateId()` now accepts optional `batchIds` parameter for multi-element operations
- `generateId()` now scans all store collections (elements, layers, slides, states) for prefix uniqueness

## [1.8.1] - 2026-02-09

### Fixed
- Text tool not switching to selection on first click outside (pointerdown/blur race condition)
- Bold/Italic toggles now disabled for fonts without those variants (Handlee, Permanent Marker, Caveat italic)

## [1.7.0] - 2026-02-06

### Added
- **Organic branch connectors**: Mindmap connectors rendered as smooth bezier curves with curved text labels
- **Semantic branch styling**: Auto-coloring, depth-based strokeWidth tapering, and opacity fading for mindmap branches
- **Focus mode (Shift+F)**: Dim all elements outside the selected mindmap branch for focused editing
- **Arrow key navigation**: Navigate between mindmap nodes using arrow keys
- **Drag-to-reparent**: Drag mindmap nodes onto new parents with SweetAlert2 confirmation and auto-alignment
- **Kinetic typography animations**: Typewriter, word-by-word, text scramble, and wave text animation presets
- **Glitch effect animation preset**: RGB channel splitting, scan lines, and noise overlay
- **Canvas right-click export**: Export as PNG, JPG, SVG or copy as PNG from the context menu
- **Collapsed toolbar icon-selects**: Quick toolbar uses single-button popovers for cleaner UI
- **Drawing Style for openBox**: Sketch and Architectural render styles for openBox 3D shapes
- **Examples/Showcase page**: Modern diagram templates for quick starts

### Fixed
- Infinite recursion in mindmap buildTree (connectors inheriting parentId from SolidJS proxy)
- Child node overlap when pressing Tab on parent repeatedly
- Kinetic typography multiline text positioning and replay state restore
- Text element bounding box not recalculating on fontSize change
- getBranchInfo counting connectors as children (wrong PALETTE color assignment)
- Bezier midpoint text editing overlay position for organicBranch

## [1.6.0] - 2026-02-05

### Added
- **Open Box click-to-open animation**: Click openBox in presentation mode to animate lid opening with element reveal
- **Reveal animations**: fadeIn, slideUp, scaleUp, and pop effects for revealed elements
- **Restore after reveal**: Auto-close box and hide reveal element after animation completes
- **Lid style options**: Single, split, double, quad, and flaps configurations for openBox
- **45 gradient presets**: Predefined gradients in 8 categories (warm, cool, nature, metallic, pastel, vibrant, dark, light)
- **13 openBox style presets**: Quick styling presets in 4 categories (presentation, product, fantasy, playful)
- **Per-face gradient shading**: 3D shapes now render gradients with proper lighting simulation per face
- **Tool locking**: Double-click any tool to keep it active after drawing
- **Open box lid customization**: Separate fill/stroke colors for lid and backface edges
- **Text editing for openBox**: Double-click to edit text directly on the shape

### Fixed
- Gradient fills now render correctly on all 3D shapes (solidBlock, cylinder, isometricCube, perspectiveBlock, openBox)
- Sketch mode no longer shows hachure artifacts when using gradient fills
- Reveal elements properly hide when entering presentation mode or switching slides
- OpenBox elements reset to closed state when exiting presentation mode (ESC)
- Perspective block rotation handle position corrected
- 3D shape depth now scales proportionally with shape size

## [1.5.0] - 2026-02-04

### Added
- **Excalidraw-like text element behavior**: Text elements now support drag-to-create with customizable width and height
- **Text word wrapping**: Text automatically wraps within the element width instead of stretching
- **Background color support for text elements**: Text elements can now have a background fill color
- **Visual feedback during text creation**: Dashed border shows the text box bounds while dragging

### Changed
- **Text resize behavior**: Font size stays constant during resize (no more scaling)
  - Horizontal resize (side handles): Text re-wraps, height auto-adjusts to fit content
  - Vertical resize (top/bottom handles): Adds padding, text centers vertically
  - Corner resize: Free resize with minimum height to fit wrapped text
- **Text editing overlay**: Input is now centered both vertically and horizontally within the element bounds
- **Text commit behavior**: Preserves user-defined width, only recalculates height based on content

### Fixed
- Resize handlers now correctly oriented when shape is rotated

## [1.4.0] - 2026-01-XX

### Added
- Ink highlighter and eraser tools in infinite canvas presentation mode
- GSAP-like stagger animations with UI support
- Text animations (typewriter, wordByWord, textScramble, etc.)
- GoatCounter analytics for privacy-friendly visitor tracking
- Mobile layout reorganization with bottom toolbar and collapsible utility menu

### Fixed
- Eraser in presentation mode now only affects items drawn during presentation

---

For detailed release notes, see the [release-notes](./release-notes/) folder.
