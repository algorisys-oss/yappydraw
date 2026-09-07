# Yappy Browser API

Yappy exposes a global API on `window.Yappy` that allows you to programmatically create, manipulate, and connect elements on the canvas. This is useful for generating diagrams from external data, automating tasks, or integrating with other tools.

## Getting Started

Open your browser's developer console (F12) while running Yappy. You can immediately access the API:

```javascript
window.Yappy.createRectangle(100, 100, 200, 150);
```

## Methods

### Creation methods

#### `createRectangle(x, y, width, height, options)`
Creates a rectangle.
- **x, y**: Coordinates of top-left corner.
- **width, height**: Dimensions.
- **options**: Style options (see below).
- **Returns**: `id` (string) of created element.

#### `createDiamond(x, y, width, height, options)`
Creates a diamond (rhombus).

#### `createCircle(x, y, width, height, options)`
Creates a circle/ellipse.

#### `createLine(x1, y1, x2, y2, options)`
Creates a linear line from point 1 to point 2.

#### `createArrow(x1, y1, x2, y2, options)`
Creates an arrow from point 1 to point 2.

#### `createBezier(x1, y1, x2, y2, options)`
Creates a bezier curve element from point 1 to point 2.
- **Returns**: `id` (string) of created element (type: `'bezier'`).

#### `createText(x, y, text, options)`
Creates a text element.
- **text**: String content.
- **options.fontSize**: font size (default 20).

### Connection Methods

#### `connect(sourceId, targetId, options)`
Connects two existing elements with an arrow or line.
- **sourceId**: ID of start element.
- **targetId**: ID of end element.
- **options**:
  - `type`: 'arrow' (default), 'line', or 'bezier'.
  - `curveType`: 'bezier' (default), 'straight', or 'elbow'.
  - Style options (color, etc).

Example:
```javascript
const id1 = Yappy.createRectangle(100, 100, 100, 50);
const id2 = Yappy.createRectangle(300, 100, 100, 50);
Yappy.connect(id1, id2, { type: 'bezier' });
```

### Manipulation Methods

#### `updateElement(id, updates)`
Updates properties of an existing element.
```javascript
Yappy.updateElement(someId, { backgroundColor: 'red', strokeStyle: 'dashed' });
```

#### `deleteElement(id)`
Deletes an element by ID.

#### `clear()`
Clears the entire canvas history and elements.

#### `zoomToFit()`
Adjusts the viewport to fit all elements.

#### `setView(scale, panX, panY)`
Manually sets the viewport view state.

#### `setSelected(ids)`
Sets the current selection.
- **ids**: Array of element IDs to select.

## Types

### ElementOptions
Optional object passed to creation methods.
```typescript
{
    strokeColor?: string;       // e.g. "#000000"
    backgroundColor?: string;   // e.g. "transparent", "#ff0000"
    fillStyle?: 'hachure' | 'solid' | 'dots' | 'zigzag';
    strokeWidth?: number;       // default 4
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    opacity?: number;           // 0-100
    roughness?: number;         // 0 (clean) - 2 (sketchy)
    angle?: number;             // radians
    fontFamily?: 'hand-drawn' | 'sans-serif' | 'monospace';
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    containerText?: string;     // Text inside shape
    startArrowhead?: 'arrow' | 'dot' | 'circle' | 'bar' | null;
    endArrowhead?: 'arrow' | 'triangle' | 'dot' | 'circle' | 'bar' | null;
    points?: Point[] | number[];// Absolute/Relative coordinates
    status?: 'pending' | 'loaded' | 'error'; // For images
    dataURL?: string;           // Base64 image data
    // Text Styling
    textColor?: string;
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;
}
```

## State Access
You can read the full application state via:
```javascript
Yappy.state
// Returns: { elements: [...], viewState: {...}, ... }
```
This is a read-only proxy of the SolidJS store.

## Animation Studio (`Yappy.anim`)

Frame-timeline scripting for `animation` documents (Menu → New → New Animation…). Frames are 0-based; `layerId`/`frame` default to the active layer and the playhead.

```javascript
Yappy.anim.newDocument({ width: 1280, height: 720, fps: 24, frames: 48 });

const id = Yappy.createRectangle(100, 100, 80, 80, { backgroundColor: '#f00' });
Yappy.anim.gotoFrame(24);
const [copy] = Yappy.anim.insertKeyframe();     // F6 — duplicates the previous cel (shared contentId)
Yappy.updateElement(copy, { x: 500 });
Yappy.anim.setTween('motion', undefined, 0);    // tween the span leaving frame 0
Yappy.anim.setFrameEasing('easeInOutQuad', undefined, 0);
Yappy.anim.play();
```

- `newDocument({ width?, height?, fps?, frames? })` — fresh animation doc (Stage + timeline)
- `timeline()` / `currentFrame()` / `isPlaying()` / `visibleIds()` / `evaluate(frame?)`
- `gotoFrame(f)` · `stepFrame(±n)` · `play()` · `pause()` · `stop()`
- `insertFrame(layerId?, frame?)` (F5) · `insertKeyframe(...)` (F6, returns new element ids) · `insertBlankKeyframe(...)` (F7)
- `clearKeyframe(...)` (Shift+F6) · `removeFrames(...)` (Shift+F5) · `moveKeyframe(layerId, from, to)`
- `setTween('motion'|'shape'|'none', layerId?, frame?)` — 'shape' also morphs the outline between the two cels · `setFrameEasing(name, ...)` · `setFrameEaseCurve({ox,oy,ix,iy}, ...)` (custom bezier, overrides the named easing) · `setFrameGuide(pathId|null, orient?, ...)` (tween follows a line/path; orient rotates along it) · `setFrameLabel(text, ...)`
- `setFps(n)` · `setFrameCount(n)` · `setOnion(enabled, before?, after?)` · `toggleTimeline(visible?)`
- Frame blocks (a rectangle of rows × frames): `selectFrames(layerIds, from, to?)` · `frameSelection()` · `copyFrames()` · `cutFrames()` · `pasteFrames(frame?, layerIds?)` · `duplicateFrames()` · `deleteFrames()`. The frame clipboard is separate from the element clipboard (UI: Ctrl+Alt+C/X/V/D, so Ctrl+C/V still copy drawings). **Paste overwrites** the destination range and creates fresh element copies — a pasted cel is fully independent of its source.
- Timing: `setCelDuration(frames)` (exposure of the selected cel; everything after slides) · `splitFrames(every)` (re-expose the selection on 1s/2s/3s… — cels with content are deep-copied per split) · `insertInbetween()` · `setNewCelFrames(n)` (default exposure for new F6/F7 cels — 2 = shoot on twos; stored on the document)
- Flipping: `stepCel(±1)` — moves drawing to drawing rather than frame to frame (UI: Alt+, / Alt+.) · `stepMarker(±1)` (Alt+Shift+, / .)
- Markers + play range: `setMarker(name, frame?, color?)` · `removeMarker(frame?)` · `markers()` · `setMarkRange(in|null, out|null)` · `playRange()`. Markers live on the **ruler**, so they stay put when cels are retimed (`setFrameLabel` belongs to a cel and moves with it). The mark in/out range is honoured by playback, looping, Stop, and MP4/WebM/GIF export.
- Out of pegs: `setPeg({x, y, angle, scale} | null, layerId?, frame?)` · `peg(layerId?, frame?)` · `startPegEdit(...)` / `endPegEdit()` (arms the canvas so a drag slides the ghost; Alt rotates, Shift scales) · `resetAllPegs()`. The offset applies **only where that cel renders as an onion ghost** — it never touches the elements, and playback, export and hit-testing are unaware of it.
- Pose keyframes: pin a stick figure's pose per cel via `updateElement(id, { stickRig: { ...cur, playing: false, previewPhase, clip, facing } })` — tweens glide the phase (same clip) or blend skeletons (different clips)
- Movie clips: `Yappy.createSymbol(name?, ids?, 'movieclip')` (F8); instances take `loopMode: 'loop'|'once'|'single'` and `firstFrame` via `updateElement`; double-click an instance (or `Yappy.enterSymbolEdit(id)`) to edit its nested timeline.
- Camera: `setCameraKey({frame?, x, y, zoom, easing?})` (stage coords, zoom 1 = full stage) · `setCameraKeyFromView()` · `clearCameraKey(frame?)` · `camera()` — plays back as a zoom/pan move
- Frame actions: `setFrameAction({kind:'stop'} | {kind:'goto',frame,play?} | {kind:'nextScene'} | null, layerId?, frame?)` — fires on playback (editor + HTML player), never on scrub
- Scenes: `addScene()` · `setScene(index)` · `deleteScene(index)` · `sceneCount()` — each slide is a scene with its own stage + timeline
- Audio row: `addSound(sfxName, frame?)` (coin/jump/hit/powerup/explosion/blip/win/lose/click) · `sounds()` · `moveSound(id, frame)` · `removeSound(id)` — plays on timeline playback and is muxed into MP4/WebM exports
- `loadExample('bouncing-ball' | 'rocket-launch' | 'yappy-intro')` — load a built-in animation template (also in Menu → Templates → Animations)
