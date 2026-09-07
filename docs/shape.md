# Shape & Tool Documentation

This document describes the supported properties, attributes, and implementation details for all elements in Yappy.

## Legend
- ✅ : Supported
- ❌ : Not Supported / Not Applicable
- 🛠 : Partial Support / Indirect (e.g., via bounding box)

## Attribute Matrix: Standard Shapes

| Attribute | Rect / Box | Circle | Diamond | Triangle | Polygons¹ | Text | Image | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `x`, `y` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Position (Top-left) |
| `width`, `height` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Dimensions |
| `angle` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Rotation angle (radians) |
| `opacity` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Opacity (0-100) |
| `strokeColor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Border color |
| `strokeWidth` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Border thickness |
| `backgroundColor`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Fill color |
| `fillStyle` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Solid, Hachure, Hatch |
| `roughness` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Sloppiness (RoughJS) |
| `roundness` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Rounded corners toggle |
| `containerText` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Internal label content |
| `shadowEnabled` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Drop shadow toggle |
| `gradientStart` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Linear/Radial start color |
| `gradientDirection`| ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Gradient Angle |
| `drawInnerBorder` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Double border toggle |
| `innerBorderDistance`| ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Distance from outer border |
| `innerBorderColor`| ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Color of inner border |

> ¹ **Polygons / Complex Shapes** include: Hexagon, Octagon, Star, Cloud, Heart, Arrow (Left/Right/Up/Down), Capsule, Sticky Note, Speech Bubble, Database, Document, Component, State, Lifeline, Fragment, Signal Send/Receive, etc.

## Attribute Matrix: Linear & Pen Tools

| Attribute | Line / Arrow | Bezier | Fineliner | Ink Brush | Marker | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `points` | ✅ | ✅ | ✅ | ✅ | ✅ | Coordinate array |
| `curveType` | ✅ | ✅ | ❌ | ❌ | ❌ | Straight vs Curved |
| `startArrowhead` | ✅ | ❌ | ❌ | ❌ | ❌ | Start decoration |
| `endArrowhead` | ✅ | ❌ | ❌ | ❌ | ❌ | End decoration |
| `pressureEnabled`| ❌ | ❌ | ✅ | ✅ | ❌ | Variable thickness |
| `strokeWidth` | ✅ | ✅ | ✅ | ✅ | ✅ | Base thickness |
| `globalAlpha` | ✅ | ✅ | ✅ | ✅ | ✅ (0.5) | Rendering alpha |
| `blending` | solid | solid | solid | soft | multiply | Composite mode |

---

# Developer Guide: Creating New Custom Shapes

## Architecture Overview

Yappy uses a **Strategy pattern** for shape rendering. Each shape type has a registered `ShapeRenderer` that handles both **Sketch** (RoughJS hand-drawn) and **Architectural** (clean Canvas 2D) rendering modes.

### Rendering Pipeline Flow

```
ShapeRenderer.render()
  -> applyTransformations() (rotation, opacity, shadow, blend)
  -> check draw-in animation progress
  -> if renderStyle === 'sketch' -> renderSketch() (RoughJS)
  -> if renderStyle === 'architectural' -> renderArchitectural() (Canvas 2D)
  -> apply flow animation (marching ants) if enabled
  -> restore transformations
```

### Key Base Classes

- **`ShapeRenderer`** (`src/shapes/base/shape-renderer.ts`) - Abstract base. Must implement:
  - `renderArchitectural(context, cx, cy)` - Clean Canvas 2D rendering
  - `renderSketch(context, cx, cy)` - RoughJS hand-drawn rendering
  - `definePath(ctx, element)` - Path definition for hit-testing/clipping

- **`RenderPipeline`** (`src/shapes/base/render-pipeline.ts`) - Static utilities:
  - `adjustColor(color, isDarkMode)` - Dark mode color inversion
  - `applyStrokeStyle(ctx, el, isDarkMode)` - Stroke properties (color, width, dash)
  - `buildRenderOptions(el, isDarkMode)` - Build RoughJS options
  - `renderText(context, cx, cy)` - Text rendering with alignment and wrapping

- **`RenderContext`** (`src/shapes/base/types.ts`) - Passed to all render methods:
  ```
  { ctx, rc, element, isDarkMode, layerOpacity }
  ```

---

## Complete Checklist: Adding a New Shape

### Files to Modify (9 files)

| # | File | What to do | Purpose |
|---|------|------------|---------|
| 1 | `src/types.ts` | Add to `ElementType` union | Type definition |
| 2 | `src/shapes/renderers/<renderer>.ts` | Add `case` blocks or create new renderer | Shape rendering |
| 3 | `src/shapes/register-shapes.ts` | Register type with renderer | Shape registry |
| 4 | `src/components/<group>-tool-group.tsx` | Add SVG icon + tool entry | Toolbar UI |
| 5 | `src/store/app-store.ts` | Add to `selected*Type` union + setter | Tool state |
| 6 | `src/config/properties.ts` | Add to all relevant `applicableTo` arrays | Property panel |
| 7 | `src/utils/element-transforms.ts` | Add to shapes array + iconMap | Shape transforms |
| 8 | `src/utils/hit-testing.ts` | Add to hit-test whitelist | Click detection |
| 9 | `src/utils/tool-handlers/text-editing-handler.ts` | Add to `shapeTypes` array | Double-click text editing |

### Files That Need NO Changes

- **Export/Import** - `DrawingElement` is directly serializable; no custom handling needed
- **Minimap** - Automatically renders all registered shapes via `renderElement()`
- **Undo/Redo** - Works through the store system automatically
- **Canvas event handling** - `draw-handler.ts` uses `store.selectedTool` generically
- **Animation** - Works with the shape geometry system automatically

---

## Step-by-Step Details

### Step 1: Define the Type

**File:** `src/types.ts`

Add your new type to the `ElementType` union:

```typescript
export type ElementType = '...' | 'myNewShape';
```

### Step 2: Create / Extend a Renderer

**File:** `src/shapes/renderers/<renderer>.ts`

You can either **create a new renderer class** or **add cases to an existing one**.

**Existing renderer groups:**
| Renderer | Handles |
|----------|---------|
| `RectangleRenderer` | rectangle |
| `CircleRenderer` | circle |
| `DiamondRenderer` | diamond |
| `PolygonRenderer` | triangle, hexagon, octagon, parallelogram, trapezoid, rightTriangle, pentagon, septagon, polygon |
| `FlowchartRenderer` | database, document, predefinedProcess, internalStorage |
| `SketchnoteRenderer` | starPerson, lightbulb, signpost, burstBlob, scroll, wavyDivider, doubleBanner, trophy, clock, gear, target, rocket, flag, key, magnifyingGlass, book, megaphone, eye, thoughtBubble |
| `InfraRenderer` | server, loadBalancer, firewall, user, messageQueue, lambda, router |
| `ContainerRenderer` | browserWindow, mobilePhone |
| `WireframeRenderer` | browser, ghostButton, inputField |
| `ConnectorRenderer` | line, arrow, bezier |
| `FreehandRenderer` | fineliner, inkbrush, marker, ink |
| `SpecialtyShapeRenderer` | cloud, heart, star, burst, callout, speechBubble, ribbon, brackets, arrows, DFD, isometric, cylinder, state, UML signals/interfaces |
| `UmlClassRenderer` | umlClass |
| `UmlStateRenderer` | umlState |
| `UmlGeneralRenderer` | umlInterface, umlActor, umlUseCase, umlNote, umlPackage, umlComponent, umlLifeline, umlFragment |
| `PathRenderer` | organicBranch |
| `TextRenderer` | text |
| `ImageRenderer` | image |
| `StickyNoteRenderer` | stickyNote |

**Both rendering modes must be implemented:**

```typescript
// Architectural mode (clean Canvas 2D)
protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
    const { ctx, rc, element: el, isDarkMode } = context;
    const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

    // 1. Fill (if applicable)
    if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
        ctx.fillStyle = options.fill;
        ctx.fill(new Path2D(myPath));
    }
    // 2. Stroke
    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
    ctx.stroke(new Path2D(myPath));
    // 3. Text
    RenderPipeline.renderText(context, cx, cy);
}

// Sketch mode (RoughJS hand-drawn)
protected renderSketch(context: RenderContext, cx: number, cy: number): void {
    const { rc, element: el, isDarkMode } = context;
    const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

    // RoughJS API: rc.path(), rc.polygon(), rc.circle(), rc.rectangle(), rc.ellipse()
    rc.path(myPath, options);
    RenderPipeline.renderText(context, cx, cy);
}
```

**Path generation pattern:** Create a private method that returns an SVG path string:
```typescript
private getMyShapePath(x: number, y: number, w: number, h: number): string {
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} Z`;
}
```

### Step 3: Register the Renderer

**File:** `src/shapes/register-shapes.ts`

Either add to an existing group's type array or register individually:

```typescript
// Adding to an existing group:
const sketchnoteTypes = ['starPerson', ..., 'myNewShape'] as const;
sketchnoteTypes.forEach(type => shapeRegistry.register(type, sketchnoteRenderer));

// Or register individually:
const myRenderer = new MyRenderer();
shapeRegistry.register('myNewShape', myRenderer);
```

### Step 4: Add Toolbar Icon + Entry

**File:** `src/components/<group>-tool-group.tsx`

**Existing tool groups:**

| File | Group | Store Signal |
|------|-------|-------------|
| `shape-tool-group.tsx` | Basic shapes | `selectedShapeType` |
| `infra-tool-group.tsx` | Infrastructure | `selectedInfraType` |
| `math-tool-group.tsx` | Math/Polygons | `selectedMathType` |
| `sketchnote-tool-group.tsx` | Sketchnote | `selectedSketchnoteType` |
| `wireframe-tool-group.tsx` | Wireframe | `selectedWireframeType` |
| `uml-tool-group.tsx` | UML | `selectedUmlType` |
| `technical-tool-group.tsx` | DFD/3D/State | `selectedTechnicalType` |
| `pen-tool-group.tsx` | Freehand | `selectedPenType` |

Each tool group follows the same pattern:

```tsx
// 1. Define SVG icon component
const MyShapeIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="..." />
    </svg>
);

// 2. Add to the tools array
const tools = [
    ...,
    { type: 'myNewShape', icon: MyShapeIcon, label: 'My Shape (Description)' },
];
```

### Step 5: Update Store Types

**File:** `src/store/app-store.ts`

Add your type to the relevant `selected*Type` union in two places:

1. **Store interface** (around line ~52):
```typescript
selectedSketchnoteType: 'starPerson' | ... | 'myNewShape';
```

2. **Setter function** (search for `setSelected*Type`):
```typescript
export const setSelectedSketchnoteType = (type: '...' | 'myNewShape') => {
    setStore('selectedSketchnoteType', type);
};
```

### Step 6: Update Property Panel Config

**File:** `src/config/properties.ts`

This is the most tedious step. Add your shape type to every relevant `applicableTo` array.

**Properties that typically apply to all shapes:**

| Property Key | Group | What it controls |
|-------------|-------|-----------------|
| `renderStyle` | style | Sketch vs Architectural toggle |
| `backgroundColor` | background | Fill color |
| `fillStyle` | background | Fill pattern (solid, hachure, cross-hatch, dots, gradients, image) |
| `fillDensity` | background | Density of hachure/pattern fills |
| `strokeWidth` | stroke | Border thickness |
| `strokeStyle` | stroke | Border pattern (solid, dashed, dotted) |
| `roughness` | stroke | Sloppiness of hand-drawn lines (sketch mode) |
| `fontSize` | text | Text size for containerText |
| `fontFamily` | text | Font selection (hand-drawn, sans-serif, monospace) |
| `fontWeight` | text | Bold toggle |
| `fontStyle` | text | Italic toggle |
| `textAlign` | text | Left/center/right alignment |
| `containerText` | text | The label text content |
| `autoResize` | text | Auto-fit shape to text dimensions |

**Properties with `applicableTo: 'all'` (no changes needed):**
- `strokeColor`, `opacity`, `rotation`, `textColor`, `flowAnimation`

**Shape-specific properties (only add if relevant):**
- `borderRadius` - Rounded corners (rectangle, diamond, capsule, etc.)
- `starPoints` - Number of points (star only)
- `polygonSides` - Number of sides (polygon only)
- `burstPoints` - Number of burst rays (burst only)
- `depth`, `viewAngle` - 3D shapes (solidBlock, perspectiveBlock, cylinder)
- `attributesText`, `methodsText` - UML class/state only

### Step 7: Update Element Transforms

**File:** `src/utils/element-transforms.ts`

Two things to update:

1. **`getTransformOptions()`** - Add to the `shapes` array so users can transform to/from your shape:
```typescript
const shapes: ElementType[] = [
    ..., 'myNewShape',
];
```

2. **`getShapeIcon()`** - Add a Unicode icon for display in the transform menu:
```typescript
const iconMap: Record<string, string> = {
    ...,
    'myNewShape': '🔑',
};
```

**Transform groups** (shapes can only transform within their group):
- **Connectors**: line, arrow, bezier, organicBranch
- **Shapes**: All standard, polygon, sketchnote, infra, wireframe, flowchart, DFD, 3D, state shapes
- **UML**: 14 UML diagram types

### Step 8: Update Hit-Testing

**File:** `src/utils/hit-testing.ts`

Add your shape to the bounding-box hit-test whitelist (around line ~195-222):

```typescript
el.type === '...' || el.type === 'myNewShape'
```

Most custom shapes use **bounding-box hit-testing** (the default). The hit-test function first does a broad-phase AABB check, then for whitelisted types simply returns `true`. Complex shapes (circle, diamond, polygon) have specialized narrow-phase geometry checks.

### Step 9: Update Text Editing Whitelist

**File:** `src/utils/tool-handlers/text-editing-handler.ts`

Add your shape to the `shapeTypes` array (around line ~138) to enable double-click text editing:

```typescript
const shapeTypes = ['rectangle', ..., 'myNewShape'];
```

**Text property types:**
- Most shapes use `containerText` (the default)
- `text` type uses the `text` property
- `umlClass` uses `containerText` + `attributesText` + `methodsText`
- `umlState` uses `containerText` + `attributesText`
- `umlFragment` uses `containerText` + `attributesText`

---

## Creating a Drawing Tool (Pen/Marker)

Drawing tools are point-based and captured in real-time.

1. **Define Type**: Add to `ElementType` in `src/types.ts`.
2. **UI Integration**: Add to `penTools` in `src/components/pen-tool-group.tsx`.
3. **Interaction Flow** (handled by `src/utils/tool-handlers/draw-handler.ts`):
   - **Pointer Down**: Initialize `points: [{ x: 0, y: 0, t: Date.now() }]`.
   - **Pointer Move**: Append relative coordinates to `points`. Capture `e.pressure` if supported.
   - **Pointer Up**: Call `normalizePencil` to calculate the minimal bounding box and offset points.
4. **Rendering**: Create a renderer extending `FreehandRenderer` or handle in existing one.
   - Use `ctx.beginPath()` for raw canvas performance or `perfect-freehand` for smooth strokes.
   - **Marker Specific**: Use `ctx.globalAlpha` and `ctx.globalCompositeOperation = 'multiply'` for highlighter effects.
5. **Minimap**: No changes needed - minimap uses `renderElement()` which uses registered renderers.

---

## Element Creation Defaults

When a new element is created (in `src/utils/tool-handlers/draw-handler.ts`), it receives:

```typescript
const newElement = {
    ...store.defaultElementStyles,   // User's current style defaults
    id: uniqueId,
    type: selectedToolType,
    x, y, width: 0, height: 0,
    seed: Math.random(),             // RoughJS seed for consistent randomness
    layerId: store.activeLayerId,
};
```

**Default element styles** (from store) include: `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `renderStyle`, `opacity`, `fontSize`, `fontFamily`, `shadowEnabled`, gradient properties.

**Special defaults per shape:**
- **Sticky Note**: `backgroundColor: '#fef08a'`, `fillStyle: 'solid'`
- **SOLID_STROKE_SHAPES** (rectangle, circle, diamond, triangle, hexagon, octagon, etc.): Force `strokeStyle: 'solid'`

---

## Key Considerations

- **Dark Mode**: Use `RenderPipeline.adjustColor(color, isDarkMode)` for all colors in the renderer.
- **Rotation**: The base `ShapeRenderer.render()` handles rotation via `applyTransformations()`. Your render methods receive pre-rotated context.
- **Performance**: For complex paths, build the SVG path string once and reuse with `new Path2D(path)`.
- **Z-Index**: Elements render in `store.elements` array order. No per-shape changes needed.
- **Binding**: If you want connectors to "stick" to your shape, implement intersection logic in `src/utils/geometry.ts` and `src/utils/shape-geometry.ts`.
- **Minimap**: Automatically included. No extra work needed.
- **Export/Import**: `DrawingElement` is fully serializable. No custom handling needed for standard properties.
- **Animation**: Morph animations use `src/utils/shape-geometry.ts`. Add a case in `getShapeGeometry()` if you want smooth morph transitions between shapes.

---

## Quick Reference: Shape Families

| Family | Example Types | Tool Group | Renderer |
|--------|--------------|------------|----------|
| Basic | rectangle, circle, diamond | (core toolbar) | Individual renderers |
| Polygons | triangle, hexagon, pentagon, polygon | shape-tool-group | PolygonRenderer |
| Specialty | star, cloud, heart, burst, speechBubble, capsule | shape-tool-group | SpecialtyShapeRenderer |
| Sketchnote | starPerson, lightbulb, trophy, key, eye, book | sketchnote-tool-group | SketchnoteRenderer |
| Infrastructure | server, loadBalancer, firewall, router | infra-tool-group | InfraRenderer |
| Flowchart | database, document, predefinedProcess | (core toolbar) | FlowchartRenderer |
| Wireframe | browserWindow, mobilePhone, ghostButton | wireframe-tool-group | WireframeRenderer |
| Connectors | line, arrow, bezier | (core toolbar) | ConnectorRenderer |
| Freehand | fineliner, inkbrush, marker, ink | pen-tool-group | FreehandRenderer |
| UML | umlClass, umlState, umlActor, umlLifeline | uml-tool-group | UmlClass/State/General |
| Technical | dfdProcess, isometricCube, stateStart | technical-tool-group | SpecialtyShapeRenderer |
| Container | browserWindow, mobilePhone | wireframe-tool-group | ContainerRenderer |


## Hint: Steps to create a new shape
- Add (n) types to ElementType union in types.ts
- Create ConnectionRelRenderer with architectural + sketch rendering
- Create <Your Tool Group> component with SVG icons
- Register shapes in register-shapes.ts
- Add selectedConnectionRelType to app-store.ts
- Add ConnectionRelToolGroup to toolbar.tsx
- Update element-transforms.ts with transforms + icons
- Update hit-testing.ts whitelist
- Update text-editing-handler.ts whitelist
- Update properties.ts applicableTo arrays
- Update shape-geometry.ts for gradient fills
- TypeScript build check
- Update todo.md with completed phases