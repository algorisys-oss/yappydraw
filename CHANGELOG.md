# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.25.5] - 2026-03-05

### Fixed
- **Slide panel drag-to-rearrange not working** — global drag-and-drop handlers (for image file drops) registered on window capture phase were intercepting all drop events with `stopPropagation()`, preventing the slide navigator's drop handler from firing; added early-return guards so the slide navigator and layer panel handle their own drag-to-rearrange events

## [0.25.4] - 2026-03-05

### Added
- **Elixir BYOF slide deck** — 42-slide presentation covering "Build Your Own Elixir Phoenix + LiveView Framework" tutorial (40 steps from TCP socket to production deployment)

### Fixed
- **Presentation mode: clicking locked elements now advances slide** — in slide view (F5), clicking on locked elements was selecting them instead of advancing to the next slide; locked elements now pass through to slide navigation while unlocked elements (annotations, ink) remain interactive

## [0.25.3] - 2026-03-02

### Added
- **Toolbar hotkey badges** — small numeric indicators on toolbar buttons showing keyboard shortcut at a glance
- **Reordered toolbar hotkeys** — numeric shortcuts (1-0) now match the toolbar's left-to-right visual order: Selection(1), Rectangle(2), Diamond(3), Ellipse(4), Arrow(5), Line(6), Pen(7), Text(8), Image(9), Eraser(0)

### Fixed
- **High CPU usage on idle canvas** — animation engine rAF loop kept running for paused/idle animations; SolidJS time signals updated every frame triggering continuous 60fps redraws; ink cleanup interval ran every 500ms forever; cursor position store writes unthrottled at 60+/sec; recording manager thumbnail effect tracked entire elements proxy
- **Flow animation reverse shows solid dark line** — JavaScript negative modulo caused all pulse positions to render when direction was reversed, producing a solid line instead of animated dashes
- **Auto-grow text element height while typing** — text elements now expand vertically as content grows
- **Line/connector text editing and auto-highlight** — improved text editing UX on lines and connectors
- **Lasso and Crop tools moved to end of toolbar** — better toolbar organization

## [0.23.6] - 2026-02-26

### Fixed
- **Animation state not restored on presentation exit** — exiting slideshow left elements in mid-animation positions (moved, rotated, faded) because only startHidden opacity was restored, not animated properties; now captures full element state before entering presentation and restores after stopping all animations on exit
- **Slide drag-to-reorder loses active slide data** — `reorderSlides()` was missing `saveActiveSlide()` call, causing active slide background/dimensions/thumbnail to be lost during reorder
- **Slide operations lack undo support** — added `pushToHistory()` to `addSlide`, `insertNewSlide`, `deleteSlide`, and `reorderSlides` so all slide operations can be undone with Ctrl+Z
- **Deleting active slide leaves stale canvas state** — `deleteSlide()` called `setActiveSlide(nextIndex)` but when the index didn't change, it returned early leaving stale background/dimensions; fixed by invalidating the active index before re-setting it

## [0.23.5] - 2026-02-24

### Added
- **Sketch-to-Diagram (AI Vision)** — upload, paste (Ctrl+V), or drag-drop a hand-drawn sketch or photo into the AI Drawing dialog; the LLM's vision capabilities analyze the image and generate a matching YappyDraw diagram using the correct domain shapes (flowchart, architecture, UML, BPMN)
- **Vision support for all three AI providers** — OpenAI, Gemini, and Anthropic all support image input with provider-specific multi-part content formatting
- **Image preprocessing** — uploaded images are automatically resized (max 2048px) and compressed (JPEG 0.85) to stay within API limits; retries at 1024px if result exceeds 4MB
- **Sketch + text prompt** — optionally add a text description alongside the sketch to guide the AI conversion
- **Relative shape sizing preserved** — vision prompt instructs the AI to set explicit width/height on nodes when shapes in the sketch differ noticeably in size
- **Center-aligned text by default** — AI-generated shapes now have `textAlign: "center"` in their style so labels are centered

### Fixed
- **Sketch upload immediately cleared** — `clearSketch()` read `sketchPreview()` inside a `createEffect`, causing SolidJS to track it as a dependency; uploading an image triggered the effect which immediately cleared it; fixed with `untrack()`

## [0.23.4] - 2026-02-24

### Fixed
- **zoomIn/zoomOut animations not working on text elements** — zoom animations modified width/height which doesn't visually scale text (text renders at fixed fontSize); added `renderScale` property with canvas-level `ctx.scale()` transform so text elements zoom correctly via renderScale+opacity instead of width/height
- **Slide panel not visible after localStorage restore** — auto-save skip guard `elementCount === 0` prevented restoring slide documents with no drawn elements; added `docType` and `slideCount` to auto-save metadata so the skip check distinguishes slides-mode documents from truly empty canvases
- **Presentation numbering absent after restore** — same root cause as above; the `<Show when={docType === 'slides'}>` wrapper hid both SlideNavigator and PresentationControls when docType stayed as 'infinite'
- **Slide order drift on load** — normalized slide `order` property to match array index in `loadDocument()` to prevent ordering inconsistencies
- **activeSlideIndex out-of-bounds on restore** — added bounds validation against `store.slides.length` when restoring saved slide index from auto-save metadata

## [0.23.3] - 2026-02-23

### Fixed
- **Text animations not rendering** — text animations (typewriter, wordByWord, textScramble, lineByLine) were invisible because the renderer prioritized `richText` spans over plain `text`; animations now temporarily clear richText during playback and restore on completion
- **Duplicated slide not visible** — duplicated slides inherited the source's `lastViewState` viewport pointing at the wrong spatial position; cleared `lastViewState` on duplicate to force recalculation
- **Canvas not redrawn when switching slides** — added `store.activeSlideIndex` to the canvas `createEffect` reactive dependency list
- **Environment variables not loaded** — added `envDir: '..'` to vite.config.ts to load `.env.local` from project root
- **Active slide styling improved** — enhanced the active slide highlight in the slide panel

## [0.23.2] - 2026-02-23

### Fixed
- **Dialogs still close when selecting text on Windows/Chrome** — on Windows/Chrome, drag-selecting text inside dialogs where the mouse drifts slightly onto the overlay backdrop still triggered dialog close despite the v1.23.1 fix; added `!window.getSelection()?.toString()` check to all 15 overlay `onClick` handlers to prevent closing when text is selected; also fixed 4 missed dialogs (text-editor-modal, rocket-settings-dialog, command-palette, menu backdrop) that had no `e.target === e.currentTarget` guard at all

## [0.23.1] - 2026-02-23

### Fixed
- **Dialogs close when selecting text** — all 11 modal dialogs (AI Drawing, Import from Text, Templates, Settings, Help, Export, Save, Load, Cloud Storage, AI Settings, File Open) closed unexpectedly when clicking inside textareas to select or edit text; added `e.target === e.currentTarget` guard to overlay click handlers so dialogs only close on direct backdrop clicks

## [0.23.0] - 2026-02-22

### Added
- **AI Rocket Mode** — "Generate for Rocket Backend" checkbox in the AI Drawing dialog teaches the LLM entity field syntax, state diagram shapes, BPMN containerText conventions, and relation cardinality for Rocket-exportable diagrams
- **One-Click Deploy to Rocket** — "Deploy to Rocket" option in the export dialog that authenticates, creates the app if missing, and imports the full schema (entities + state machines + workflows) in one step
- **Rocket Settings Dialog** — persistent connection settings (URL, email, password, app name) stored in localStorage with base64 obfuscation; includes "Test Connection" button
- **BPMN Workflow Exporter** — converts BPMN diagrams (start events, service tasks, user tasks, gateways, end events) to Rocket workflow schema with trigger config, field assignments, webhooks, and approval flows
- **UML State Machine Exporter** — converts UML state diagrams (stateStart → state → stateEnd with transition labels) to Rocket state machine schema with events, guards, and effects
- **UML Compartmented Renderers** — `umlEnum` and `umlInterface` shapes with scrollable sections and draggable dividers; `umlState` scroll support; default text for all UML shapes
- **UML Class Enhancements** — scrollable sections, draggable section dividers, MCP server integration, Rocket entity export from class attributes
- **Shape Aliases** — `state-start`, `state-end`, `state-sync` aliases for AI-friendly kebab-case naming
- **Rocket Feature Flag** — `VITE_ENABLE_ROCKET_EXPORT` env variable to toggle all Rocket UI (export, deploy, AI checkbox, settings)

### Changed
- **Monorepo Reorganization** — project restructured into `frontend/` + `backend/` directories

### Fixed
- **Toast messages hidden behind slide toolbar** — raised toast `z-index` from 2000 to 10010, above all toolbars (10002) and presentation controls (10000)
- **Rocket UI not gated behind feature flag** — wrapped AI dialog checkbox, Rocket Settings link, and RocketSettingsDialog behind `features.enableRocketExport`
- **Leading whitespace lost in text rendering** — preserved leading whitespace in text element rendering

## [0.22.0] - 2026-02-17

### Added
- **Line/Arrow/Bezier Refactor** — lines and arrows now get default cubic bezier control points at creation (1/3 and 2/3 along the line), enabling smooth curves without manual conversion
- **Double-Click Text Editing on Lines/Arrows** — lines and arrows now support double-click to edit containerText, with connector-aware sizing in the text overlay

### Fixed
- **Control point real-time preview** — dragging control points on bezier curves now updates the canvas in real-time; added `controlPoints`/`curveType` to SolidJS reactive tracking and `requestAnimationFrame` call to drag handler
- **Elbow line too many bends** — replaced multi-bend algorithm (BEND_THRESHOLD=15) with clean L-shaped path producing exactly 1 bend; eliminates mouse wobble artifacts during interactive drawing
- **Text jumping when editing standalone text** — switched from `translate(-50%, -50%)` to top-left anchoring with computed vertical padding matching canvas renderer formula
- **Text jumping when editing containerText on shapes** — extended top-left anchoring to container shapes with `measureContainerText()` metrics and shape-specific Y offsets (doubleBanner, starPerson, lightbulb, signpost, UI shapes)
- **Double border during text editing** — canvas renderer now skips text drawing when `isEditing` flag is set on element
- **Consistent fontSize default** — unified all text element creation paths to use `store.defaults?.fontSize ?? 20`
- **Text drag preview** — replaced distracting dashed outline with subtle semi-transparent fill
- **Rich text bullet lists** — fixed bullet list rendering, indentation, text color, and drag visibility
- **Invisible text elements** — added `textColor: '#000000'` default to prevent transparent text on newly created elements
- **Puzzle piece architectural renderer** — normalized negative dimensions in connection-rel renderer to fix shapes becoming invisible when dragged left/upward

## [0.21.0] - 2026-02-17

### Added
- **AI Drawing Engine** — generate entire diagrams from natural language prompts via LLM (OpenAI, Google Gemini, Anthropic); accessible via menu or `Ctrl+Shift+A`

### Fixed
- **Arrow connections for BPMN/UML shapes** — added BPMN events to ellipse intersection, gateways to diamond intersection, and default bounding-box fallback for all unrecognized types
- **Stable anchor bindings** — `connect()` API now computes `anchorFractionX`/`anchorFractionY` for precise, stable bindings
- **Puzzle piece invisible on drag-left** — normalized negative dimensions in architectural renderer

## [0.20.0] - 2026-02-16

### Added
- **RichText Font Selection** — font family picker available in property panel, quick toolbar, and inline editing mini toolbar for RichText elements
  - Per-span font switching via **F** button in the rich text mini toolbar (8 fonts: Virgil, Caveat, Marker, Inter, Poppins, Merriweather, Source Code Pro, JetBrains Mono)
  - Property panel now shows fontSize, fontFamily, fontWeight, fontStyle, and textAlign for RichText
  - Font family round-trip: `htmlToSpans` now parses `font-family` styles and `<font face>` tags back to internal keys

## [0.19.1] - 2026-02-16

### Fixed
- **Canvas background bleed between documents** — `loadDocument` now resets `canvasBackgroundColor` to default before applying theme and slide backgrounds, preventing previous document's background from persisting into newly loaded/created documents

## [0.19.0] - 2026-02-16

### Added
- **Layer Lock Toggle** — inline lock/unlock button in each layer row for quick access (previously context-menu only)

### Fixed
- **HTML export missing fonts** — standalone player now includes Google Fonts `<link>` tags for all 8 font families (Caveat, Handlee, Inter, JetBrains Mono, Merriweather, Permanent Marker, Poppins, Source Code Pro)
- **First slide animation not playing on export open** — exported HTML player now initializes `slideBuildManager` for on-load animations with proper timing after Canvas mount
- **Manual arrow start point drift** — start binding fractions are now always computed regardless of end binding, preventing start point from shifting when connected shapes move

## [0.18.0] - 2026-02-16

### Added
- **Stable Connector Anchoring** — fraction-based positioning system for precise connector endpoints:
  - `anchorFractionX`/`anchorFractionY` (0-1) stored per binding for sub-anchor precision
  - Connectors maintain exact relative positions when shapes are moved
  - Resolution priority: fractions > named anchor > edge intersection fallback
  - Raw mouse position tracking for unique per-connector fractions
- **Auto-Spread Overlapping Connectors** — perpendicular offset for sibling connectors sharing identical anchor positions
- **Connector Handle Arrow Default** — drag-to-connect icon now creates arrows (with arrowhead) instead of plain lines
- **Smart Partial Eraser** — freehand stroke eraser that splits strokes at the eraser path
- **Flow Animation Reverse Direction** — option to reverse flow animation direction
- **Larger Default Arrowhead** — increased default arrowhead size from 12 to 28
- **Auto-Show Property Panel** — property panel automatically shows when a drawing tool is selected

### Fixed
- **Connector convergence/overlap when moving shapes** — removed dynamic anchor switching that caused all connectors to converge to the same point; replaced with stable fraction-based positioning
- **Edge-type binding drift** — edge bindings no longer recalculate dynamically, preventing cumulative position drift
- **Connector handle missing refreshBoundLine** — connector handle path now properly finalizes binding geometry
- **Kubernetes shape fill color leak** — fixed fill state management in kubernetes shape renderer
- **Zen mode exit button** — added visible exit button for zen mode
- **Cross-platform checkbox styling** — consistent checkbox appearance on Windows
- **Ink brush sharp corner gaps** — filled gaps at sharp corners in ink brush strokes
- **HTML export theme preservation** — exported HTML now preserves current theme setting
- **Mobile .yappy.txt save extension** — save-to-disk on mobile uses correct file extension
- **Mobile status bar visibility** — status bar now shows on mobile devices

### Changed
- **Default stroke width** — changed to 4 across all contexts: store defaults, api.ts, migration.ts, settings dialog, data structure renderer fallbacks

## [0.17.0] - 2026-02-15

### Added
- **Image Pixel Effects** — pixel-by-pixel image reveal animations with 14 presets:
  - Effects: left-to-right, top-to-bottom, center-out, random-pixels, spiral-in, diagonal, wave, checker, scanline, dissolve, radial, blinds, mosaic, glitch
  - Pixel Rain effect (Matrix-style digital rain animation)
  - API: `Yappy.animatePixelEffect()`, `Yappy.stopPixelEffect()`, `Yappy.pixelEffectPresets`
  - Integration with animation panel for interactive previews
- **Text Vertical Alignment** — `verticalAlign` property for text elements:
  - Three modes: top, middle, bottom
  - UI controls in quick toolbar and property panel
  - Real-time preview during editing
  - Supported in both plain text and rich text rendering
- **Rich Text Enhancements**:
  - Separate Text and Rich Text tools in toolbar with dedicated TextToolGroup dropdown
  - `backgroundColor` property support for rich text elements
  - Double-click-to-lock for text tool group (consistent with other tool groups)
- **Raylib Rust Renderer — Rich Text Support**:
  - `RichTextSpan` struct with full formatting fields (bold, italic, underline, strikethrough, color, fontSize)
  - Rich text layout engine with word wrapping and per-span rendering
  - Text highlight background rendering
  - Container text with rich formatting for rectangles and sticky notes
  - `"richtext"` element type dispatching

### Fixed
- **Rich text formatting lost on blur** — `updateElement()` guard was clearing `richText` when both `text` and `richText` were in the same commit update. Added `!('richText' in updates)` check to preserve formatting from `commitRichText()`.
- **Text tool resets despite double-click lock** — four blur/Escape handlers unconditionally called `setSelectedTool('selection')` without checking `store.toolLocked`. Added guard to all reset points. Added `'richtext'` to `CONTINUOUS_TOOLS` and `CLICK_EXEMPT` arrays.
- **Text element placeholder dashed border** — removed unnecessary dashed border rendering for empty text elements
- **Text auto-resize overrides manual resize** — disabled auto-resize for standalone text elements; users can freely resize text bounding boxes
- **Vertical text alignment accuracy** — fixed calculation to use `fontSize` instead of `lineHeight` for proper centering
- **Underline/strikethrough dash artifacts** — added `setLineDash([])` before drawing text decoration lines

### Changed
- **Toolbar layout** — moved Lasso and Crop tools after the Connector toolgroup for better logical grouping

## [0.16.0] - 2026-02-14

### Added
- **6 New Mermaid Diagram Types** — extending the Mermaid adapter to 13 total diagram types:
  - Gantt chart — tasks, sections, milestones with timeline layout
  - User Journey — actions, tasks, and participant scores
  - Quadrant chart — 2×2 matrix with labeled axes and positioned points
  - XY chart — bar and line series with axis labels
  - Block diagram — nested blocks with columns and directional arrows
  - Git Graph — commits, branches, merges, and cherry-picks
- **IRenderer Abstraction Layer** — rendering backend portability:
  - `IRenderer` interface decoupling shape renderers from `CanvasRenderingContext2D`
  - `CanvasRenderer` adapter implementing `IRenderer` for browser canvas
  - All shape renderers updated to use `IRenderer` instead of direct canvas context
- **Raylib Rust Renderer (Phase 3)** — native `.yappy` file viewer:
  - Rust-based renderer using Raylib 5.x for native desktop rendering
  - JSON deserialization of `.yappy` files with `DrawingElement` struct
  - Shape renderers for rectangles, circles, diamonds, triangles, text, images, sticky notes, lines/arrows, and 40+ other shapes
  - `RaylibRenderer` implementing the same drawing API as the TypeScript `IRenderer`
  - Pan, zoom, and dark mode support

### Changed
- **Diagram templates modernized** — all 7 built-in diagram templates updated with architectural style and semantic shapes

### Fixed
- **Mermaid pie chart** — now renders actual data slices instead of decorative placeholder

## [0.15.0] - 2026-02-13

### Added
- **YSL Scripting Language (Phase 1)** — full compiler pipeline extending the declarative text DSL with programming constructs:
  - Lexer/tokenizer with ~40 token types (keywords, operators, literals, edge operators)
  - Recursive descent parser producing a typed AST (~25 node types)
  - Tree-walking interpreter that evaluates scripts into DSLDiagram IR
  - Lexical scoping with `let`/`const` variable declarations
  - String interpolation (`"Server ${i}"`) and dynamic node IDs (`server_{i}`)
  - `for` loops with range (`1..n`) and collection (`["a", "b"]`) iteration
  - `if`/`else` conditionals with comparison and logical operators
  - `fn` declarations and calls with parameter passing
  - `group` blocks for element grouping
  - Pool/lane declarations for swimlane diagrams
  - Frontmatter support (`---` blocks) for title and layout configuration
  - Full expression system: arithmetic, comparison, logical, arrays, member access
  - Auto-detection in `parseDSL()` — scripts with `let`, `for`, `fn`, etc. route to YSL parser
  - Produces same DSLDiagram IR as existing text parser — reuses all 11 layout strategies, 88+ shape aliases

### Fixed
- **Rich text first newline lost on save** — `htmlToSpans()` now handles `<div>`/`<p>` elements preceded by non-block siblings (Chrome wraps lines in `text<div>next</div>` DOM structure)
- **TypeScript strict mode errors** — resolved `erasableSyntaxOnly` violations (enum, parameter properties), unused variables/imports across YSL and existing codebase

## [0.14.0] - 2026-02-13

### Added
- **YappyDraw DSL Engine** — full text-to-diagram pipeline with JSON IR, compact text syntax, and auto-layout:
  - DSL Intermediate Representation (IR) with nodes, edges, pools, groups, and layout config
  - JSON parser + schema validation for programmatic diagram definitions
  - Compact text parser (YAML frontmatter + node/edge declarations + indentation hierarchy)
  - Shape alias map (170+ aliases to ElementType) with automatic defaults
  - Tree layout (4 directions + radial), grid layout, sequence layout, swimlane layout
  - Pool/lane rendering with node containment for BPMN diagrams
  - Style support: gradients, shadows, text highlight, inner borders, effects, custom colors
  - Console API: `Yappy.importDSL()`, `Yappy.importMermaid()`, `Yappy.parseDSL()`
- **Mermaid Adapter** — parse 7 Mermaid diagram types into YappyDraw canvas elements:
  - Flowchart (`graph TD/LR`) — nodes, edges, subgraphs, classDef/class/style
  - Sequence diagram — participants, messages, notes, loops/alt
  - Class diagram — classes with attributes/methods, relationships
  - State diagram — states, transitions, start/end markers
  - Pie chart — slices with values, title extraction
  - Mindmap — indentation hierarchy with expand/collapse support, shape brackets
  - ER diagram — entities with typed attributes (PK/FK/UK), relationships with cardinality
- **Import Dialog** — "Import from Text" modal (menu + command palette):
  - Auto-detect format (JSON, YSL text, Mermaid)
  - Live validation with parse error display and line numbers
  - Layout override dropdown
  - Format badge indicator
  - `initialText` prop for pre-loading content from templates
- **DSL Template Browser** — 23 text-based diagram examples as templates:
  - "Text Diagrams" category tab with segmented control UI
  - 15 YSL templates: flowcharts, mindmaps, infrastructure, sequence, BPMN, UML, data structures, radial, edge types, shapes showcase
  - 8 Mermaid templates: flowchart, sequence, class, state, pie, mindmap, ER, styled flowchart
  - Clicking a DSL template opens Import Dialog with code pre-loaded
  - Document icon + YSL/Mermaid format badge in template thumbnails
- **YSL Tutorial** — interactive tutorial in live help documentation
- **Rich Text Support** — per-span formatting (bold, italic, underline, color) for text elements
- **Expanded Text Editor** — modal editor for multi-line text editing

### Fixed
- **Negative radius crash** in data structure renderer — `ctx.roundRect()` throws on negative radius when cells have tiny dimensions. Clamped w/h/r to non-negative, added try-catch in render loop, try-finally for canvas state restoration.
- **ER parser attributes** — regex required leading whitespace but input was pre-trimmed. Changed `^\s+` to `^\s*`.
- **Mermaid pie chart title** — `pie title Browser Market Share` single-line header lost the title. Now extracts inline title via `\btitle\s+(.+)` match.
- **Mermaid mindmap connections** — `organicBranch` connector requires `controlPoints` that `connect()` doesn't compute. Changed to `type: 'line'` with `curveType: 'bezier'`.
- **Mermaid mindmap expand/collapse** — flat nodes+edges didn't support `setParentChildRelationships`. Rewrote parser to build nested `children` hierarchy.
- **Template browser** — lone category tab looked awkward. Hidden when only one category exists.
- **BPMN pool rendering** — proper sizing, stacking, and node placement in lanes.
- **Text bounding box** not updating on font size change.
- **Accidental click-to-create** shapes for all shape tools (discard tiny elements).
- **Rich text formatting** not persisted on commit.

## [0.13.0] - 2026-02-12

### Added
- **Image Filters** — Instagram-style filter system for image elements:
  - 15 filter presets in 5 categories: Basic, Warm, Cool, Vintage, Dramatic
  - Individual sliders for brightness, contrast, saturation, sepia, hue-rotate, blur, invert
  - Filter preset dropdown in property panel (FILTER group) with auto-switch to "Custom" on manual adjustment
  - Quick toolbar shows brightness, contrast, and saturation sliders for images
  - SVG export preserves filter values via CSS `filter` attribute on `<image>` elements
- **Image Crop Tool** — interactive crop with overlay, handles, and rule-of-thirds grid:
  - Crop tool in toolbar (selection/lasso group) with **Shift+C** shortcut
  - Click on image with crop tool to enter crop mode
  - 8 drag handles (4 corners + 4 edges) to resize crop area, drag inside to move
  - Rule-of-thirds grid overlay for composition guidance
  - Dimmed area outside crop region with full-opacity cropped preview
  - Enter to apply crop, Escape to cancel, click outside to apply
  - "Crop Image" and "Reset Crop" buttons in property panel FILTER group
  - Non-image elements show info toast when crop tool is used
- **Desktop Image Drag & Drop** — drag image files from desktop/file manager directly onto the canvas:
  - Single or multiple images supported (staggered placement)
  - Images placed at drop position with automatic compression (WebP 0.8) and resizing
- **YappyDraw Logo** — logo added to menu bar (24px) and welcome screen (96px desktop, 64px mobile)
- **Favicon & Terms of Service** — custom favicon and terms of service page

## [0.12.0] - 2026-02-12

### Added
- **Google Drive Cloud Storage** — save and load drawings from your Google Drive:
  - PKCE OAuth 2.0 sign-in (fully client-side, no backend needed)
  - Save drawings as compressed `.yappy` files in a dedicated "YappyDraw" folder
  - Browse, search, and load saved drawings from Drive
  - Overwrite detection — saves to same-name files update in place instead of creating duplicates
  - Delete files with confirmation dialog
  - User avatar and account info display
  - Shared Drive support (Google Workspace)
  - Pluggable provider architecture for future storage backends (Dropbox, GitHub, etc.)
  - Feature-flagged via `VITE_ENABLE_CLOUD_STORAGE` and `VITE_ENABLE_GOOGLE_DRIVE` env vars
- **Cloud Storage API** — programmatic access via `Yappy.cloudStorage`:
  - `getActiveProvider()`, `isAuthenticated()`, `signIn()`, `signOut()`
  - `save()`, `load()`, `list()` for cloud file operations
- **Privacy Policy** page (`/privacy-policy.html`) with link in status bar
- **SEO improvements** — Open Graph meta tags, `robots.txt`, and `sitemap.xml`

### Fixed
- **Double-click to lock tool not working on Safari/Mac** — replaced native `dblclick` events with manual timestamp-based detection across all 14 tool group components for cross-browser reliability
- Build errors in cloud storage API (replaced CommonJS `require()` with ES module imports)
- Unused imports in cloud storage dialog, settings dialog, and menu

## [0.11.1] - 2026-02-12

### Fixed
- **Group toolbar/submenus broken on mobile and Safari** — all 15 tool group dropdowns now work reliably:
  - Dropdowns open above the toolbar on mobile (were positioned off-screen below the bottom toolbar)
  - Changed toggle buttons from SolidJS delegated `onClick` to native `on:click` for Safari/WebKit compatibility
  - Increased dropdown z-index from 1001 to 10003 (above toolbar's 10002) to prevent dropdowns rendering behind toolbar
  - Added `touch-action: manipulation` on toolbar buttons and dropdown items to eliminate 300ms tap delay

### Added
- **Line start arrowhead control** in quick toolbar — connectors now show both "Line Start" and "Line End" style selectors with mirrored arrow icons (None, Arrow, Triangle, Diamond)
- **Elbow connector** added to quick toolbar connector types — elbow connectors now show the floating property toolbar

## [0.11.0] - 2026-02-11

### Added
- **BPMN Swimlane Pools** — full dynamic swimlane system for process diagrams:
  - Dynamic lane add/remove via context menu (up to 6 lanes per pool)
  - Horizontal and vertical orientation toggle
  - Editable per-lane labels with rotated text rendering
  - Per-lane background and text colors via context menu color swatches
  - Drag-to-resize lane dividers with proportional sizing
  - Draggable pool header and lane-label width dividers
  - Collapsible lanes — collapse to thin strip, hiding contained elements
  - Both Sketch (RoughJS) and Architectural rendering modes
- **Pool Element Containment** — logical parent-child relationship between pools and elements:
  - Elements dropped inside a lane auto-associate (`poolContainerId` + `poolLaneIndex`)
  - Contained elements move with the pool when dragged
  - Deleting a pool uncontains its children; removing a lane shifts indices
  - Pool lane drop highlight (blue overlay) during drag
- **Elbow Connector Tool** with advanced multi-bend routing:
  - Multi-bend drawing — direction changes during draw automatically create bend points
  - Smart arrow direction — auto-detects best anchor position (top/bottom/left/right) based on shape positions
  - Draggable bend points — click and drag individual vertices on selected elbow connectors
  - Draggable edge segments — drag horizontal/vertical segments to adjust routing
  - A* smart pathfinding for bound elbow connectors (routes around shapes)
- **BPMN demo diagram** — "Ordering a drink from a Vending machine" example (`public/examples/bpmn-demo.json`)
- **120+ new E2E tests** — BPMN shapes, code blocks, data structures, layers, elements, z-order, alignment, slides, UI panels, and table features
- Pool containment API: `assignToPoolLane()`, `removeFromPool()`, `getPoolContainedElements()`, `setPoolLaneCollapsed()`, `isPoolLaneCollapsed()`

### Fixed
- Build errors in `text-editing-overlay.tsx`, `status-tool-group.tsx`, `bpmn-renderer.ts`, `app-store.ts`, and `context-menu-builder.ts`
- Unreachable code paths in BPMN pool renderer removed
- Unused imports and parameters cleaned up across multiple files

## [0.10.0] - 2026-02-11

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

## [0.9.0] - 2026-02-10

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

## [0.8.6] - 2026-02-10

### Fixed
- Diamond shape fill color in architectural mode with borderRadius > 0 — was inheriting fill from previously rendered shape due to missing `ctx.fillStyle` and Path2D rendering quirk (Bug #22)
- Multi-select property panel now only shows properties applicable to selected shape types — table-only properties (Row Color, Alt Row Color, Header Text, etc.) no longer appear when no table is selected (Bug #23)

## [0.8.5] - 2026-02-09

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

## [0.8.4] - 2026-02-09

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

## [0.8.3] - 2026-02-09

### Fixed
- Pasted organic branches no longer change curve orientation — `controlPoints` (absolute coordinates) are now offset by the paste displacement
- Pasted connectors no longer anchor to original shapes — bindings referencing elements outside the pasted selection are cleared instead of preserved

## [0.8.2] - 2026-02-09

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

## [0.8.1] - 2026-02-09

### Fixed
- Text tool not switching to selection on first click outside (pointerdown/blur race condition)
- Bold/Italic toggles now disabled for fonts without those variants (Handlee, Permanent Marker, Caveat italic)

## [0.7.0] - 2026-02-06

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

## [0.6.0] - 2026-02-05

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

## [0.5.0] - 2026-02-04

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

## [0.4.0] - 2026-01-XX

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
