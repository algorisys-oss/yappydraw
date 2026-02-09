# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
