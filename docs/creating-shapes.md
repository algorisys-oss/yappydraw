# Complete Guide: Adding New Shapes to Yappy

This comprehensive guide covers **every step** required to add a new shape type without breaking existing functionality. Follow this checklist for each new shape.

---

## Quick Checklist

Before you start, here's what you'll need to update:

- [ ] 1. Add type to `ElementType` union (`src/types.ts`)
- [ ] 2. Implement geometry (`src/utils/shape-geometry.ts`)
- [ ] 3. Register with renderer (`src/shapes/register-shapes.ts`)
- [ ] 4. Add to hit test (`src/components/canvas.tsx` - `hitTestElement`)
- [ ] 5. Add to double-click handler (`src/components/canvas.tsx` - `handleDoubleClick`)
- [ ] 6. Configure properties (`src/config/properties.ts`)
- [ ] 7. Add to toolbar (`src/components/*-tool-group.tsx`)
- [ ] 8. Update store types if needed (`src/store/app-store.ts`)
- [ ] 9. Add anchor points (`src/utils/anchor-points.ts`)
- [ ] 10. Test: click, drag, resize, double-click text, style changes

---

## Step 1: Type Definition

**File**: `src/types.ts`

Add your new shape type to the `ElementType` union:

```typescript
export type ElementType = 
    'rectangle' | 'circle' | 'diamond' | 
    // ... existing types ...
    'myNewShape';  // ← Add here
```

**⚠️ Critical**: This is a union type - just add it to the list with `|` separator.

---

## Step 2: Geometry Definition

**File**: `src/utils/shape-geometry.ts`

Define the mathematical representation of your shape. Find the `getShapeGeometry` function and add a case:

### Understanding the Coordinate System

```typescript
// Inside getShapeGeometry:
const w = el.width;
const h = el.height;
const mw = w / 2;  // Half width
const mh = h / 2;  // Half height
const x = -mw;     // Left edge (negative!)
const y = -mh;     // Top edge (negative!)

// Center point is (0, 0)
// Top-left is (x, y) = (-mw, -mh)
// Bottom-right is (x + w, y + h) = (mw, mh)
```

### Geometry Types

#### Simple Rectangle
```typescript
case 'myBox':
    return { type: 'rect', x: x, y: y, w: w, h: h, r: 0 };
```

#### Circle/Ellipse
```typescript
case 'myCircle':
    return { type: 'ellipse', cx: 0, cy: 0, rx: w / 2, ry: h / 2 };
```

#### Polygon (Closed Path)
```typescript
case 'myTriangle':
    return {
        type: 'points',
        points: [
            { x: 0, y: y },           // Top center
            { x: x + w, y: y + h },   // Bottom right
            { x: x, y: y + h }        // Bottom left
        ]
    };
```

#### Open Path (No auto-close)
```typescript
case 'myBracket':
    return {
        type: 'points',
        isClosed: false,  // ← Important!
        points: [
            { x: x + w, y: y },
            { x: x, y: y + h / 2 },
            { x: x + w, y: y + h }
        ]
    };
```

#### SVG Path
```typescript
case 'myHeart':
    return {
        type: 'path',
        path: `M ${0} ${y + h * 0.3} C ${0} ${y + h * 0.15} ...`
    };
```

#### Multi-Part Shape (Composite)
```typescript
case 'myCylinder':
    const rx = w / 2;
    const ry = h * 0.15;
    return {
        type: 'multi',
        shapes: [
            { type: 'ellipse', cx: 0, cy: y + ry, rx: rx, ry: ry },
            { type: 'ellipse', cx: 0, cy: y + h - ry, rx: rx, ry: ry },
            { 
                type: 'points', 
                isClosed: false,
                points: [{ x: x, y: y + ry }, { x: x, y: y + h - ry }]
            }
        ]
    };
```

### ⚠️ Common Mistakes

1. **Using `mh` when you mean `y + h`**
   - `mh` = half height (for centering)
   - `y + h` = bottom edge
   
2. **Forgetting `isClosed: false` for open paths**
   - Brackets, dividers need this or they'll auto-close

3. **Mixing coordinate systems**
   - Always use `x, y, w, h` from the function scope
   - Don't use absolute screen coordinates

---

## Step 3: Renderer Registration

**File**: `src/shapes/register-shapes.ts`

Register your shape with an appropriate renderer:

```typescript
export function registerShapes() {
    // ... existing registrations ...
    
    // For specialty shapes (most common)
    const specialtyTypes = [
        // ... existing types ...
        'myNewShape'  // ← Add here
    ] as const;
    specialtyTypes.forEach(type => shapeRegistry.register(type, specialtyRenderer));
}
```

### Choosing a Renderer

| Renderer | Use For | Examples |
|----------|---------|----------|
| `SpecialtyShapeRenderer` | Most shapes (paths, polygons, composites) | Cloud, Heart, Arrows, DFD shapes |
| `PolygonRenderer` | Simple closed polygons | Triangle, Hexagon, Pentagon |
| `FlowchartRenderer` | Standard flowchart symbols | Database, Document |
| `InfraRenderer` | Infrastructure icons | Server, Lambda, Firewall |
| `SketchnoteRenderer` | Hand-drawn style icons | Lightbulb, Signpost |

**Default choice**: Use `SpecialtyShapeRenderer` - it handles most cases.

---

## Step 4: Hit Test Detection ⚠️ CRITICAL

**File**: `src/components/canvas.tsx`

**Line**: ~1390 (search for `hitTestElement` function)

Add your shape to the fallback hit test list:

```typescript
const hitTestElement = (el: DrawingElement, x: number, y: number, threshold: number): boolean => {
    // ... bounding box check ...
    
    // Around line 1390, find this section:
    if (el.type === 'rectangle') {
        return true;
    } else if (el.type === 'diamond') {
        // ...
    } 
    // ... many more cases ...
    else if (
        el.type === 'lightbulb' || el.type === 'signpost' ||
        // ... existing types ...
        el.type === 'myNewShape'  // ← Add here
    ) {
        // For new shapes, use bounding box hit test
        return true; // Box check already passed above
    }
    
    return false;
};
```

**⚠️ If you skip this**: Your shape won't be clickable, selectable, or draggable!

---

## Step 5: Double-Click Text Editing

**File**: `src/components/canvas.tsx`

**Line**: ~2946 (search for `handleDoubleClick` function)

Add your shape to the `shapeTypes` array:

```typescript
const handleDoubleClick = (e: MouseEvent) => {
    // ... find element logic ...
    
    // Around line 2946:
    const shapeTypes = [
        'rectangle', 'circle', 'diamond', 
        // ... all existing types ...
        'myNewShape'  // ← Add here
    ];
    
    if (shapeTypes.includes(el.type)) {
        setEditingId(el.id);
        setEditText(el.containerText || '');
        setTimeout(() => textInputRef?.focus(), 0);
        return;
    }
};
```

**⚠️ If you skip this**: Double-clicking won't open the text editor!

---

## Step 6: Property Configuration

**File**: `src/config/properties.ts`

Add your shape to the `applicableTo` arrays for relevant properties:

### Properties to Consider

```typescript
// Drawing Style (Sketch/Architectural) - Line ~39
{
    key: 'renderStyle',
    applicableTo: [
        'rectangle', 'circle', /* ... */, 'myNewShape'
    ]
}

// Background Color - Line ~235
{
    key: 'backgroundColor',
    applicableTo: [
        'rectangle', 'circle', /* ... */, 'myNewShape'
    ]
}

// Fill Style - Line ~255
{
    key: 'fillStyle',
    applicableTo: [
        'rectangle', 'circle', /* ... */, 'myNewShape'
    ]
}

// Stroke Width - Line ~279
{
    key: 'strokeWidth',
    applicableTo: [
        'rectangle', 'circle', /* ... */, 'myNewShape'
    ]
}

// Text Properties - Lines ~443, 456, 464, 472, 485
{
    key: 'fontSize', // fontFamily, fontWeight, fontStyle, textAlign
    applicableTo: [
        'text', 'rectangle', /* ... */, 'myNewShape'
    ]
}

// Label - Line ~501
{
    key: 'containerText',
    applicableTo: [
        'rectangle', 'circle', /* ... */, 'myNewShape'
    ]
}
```

### ⚠️ Properties to Exclude for Circular Shapes

**Don't add circular shapes to these**:

```typescript
// Roundness - Line ~185
// DON'T add: circle, stateStart, stateEnd (already round!)
applicableTo: ['rectangle', 'diamond', /* ... */]

// Corner Style - Line ~218  
// DON'T add: circle, stateStart, stateEnd (no corners!)
applicableTo: ['rectangle', 'diamond', /* ... */]
```

---

## Step 7: Toolbar Integration

**File**: Choose the appropriate tool group file

- `src/components/shape-tool-group.tsx` - Basic shapes
- `src/components/specialty-tool-group.tsx` - Specialty shapes
- `src/components/technical-tool-group.tsx` - Technical/DFD shapes
- `src/components/infra-tool-group.tsx` - Infrastructure icons

### Add Icon and Tool Definition

```typescript
import { MyIcon } from "lucide-solid";

const myTools: { type: ElementType; icon: Component<...>; label: string }[] = [
    // ... existing tools ...
    { type: 'myNewShape', icon: MyIcon, label: 'My New Shape' },
];
```

---

## Step 8: Store Type Updates (If Creating New Tool Group)

**File**: `src/store/app-store.ts`

If you're adding shapes to an **existing** tool group (like Technical), update the union type:

```typescript
// Around line 44
type AppState = {
    // ...
    selectedTechnicalType: 
        'dfdProcess' | 'dfdDataStore' | 
        'myNewShape';  // ← Add here
}
```

**⚠️ If you skip this**: Tool selection will fail silently!

---

## Step 9: Anchor Points (Connection Points)

**File**: `src/utils/anchor-points.ts`

Add your shape to get automatic anchor points for arrow connections:

```typescript
export function getAnchorPoints(element: DrawingElement): AnchorPoint[] {
    // ... existing logic ...
    
    // Around line 108, find the "Complex Shapes" section:
    } else if (
        element.type === 'cloud' || element.type === 'heart' ||
        // ... existing types ...
        element.type === 'myNewShape'  // ← Add here
    ) {
        // Standard 4-point cardinal anchors (Top, Right, Bottom, Left)
        return [
            { x: cx, y: element.y, position: 'top' },
            { x: element.x + element.width, y: cy, position: 'right' },
            { x: cx, y: element.y + element.height, position: 'bottom' },
            { x: element.x, y: cy, position: 'left' }
        ];
    }
}
```

---

## Step 10: Canvas Reactivity (Already Handled)

The canvas rendering effect in `canvas.tsx` (line ~959) already tracks `renderStyle`, so your shape will automatically re-render when the Drawing Style changes.

**No action needed** unless you add custom properties.

---

## Testing Checklist

After implementing your shape, test:

- [ ] **Click to select** - Shape highlights with selection handles
- [ ] **Drag to move** - Shape follows mouse
- [ ] **Resize handles** - All 8 handles work correctly
- [ ] **Rotate** - Rotation handle works
- [ ] **Double-click** - Text editor appears
- [ ] **Type text** - Text appears on shape
- [ ] **Drawing Style** - Toggle Sketch ↔ Architectural updates immediately
- [ ] **Background color** - Changes apply
- [ ] **Stroke width** - Changes apply
- [ ] **Arrow connections** - Can attach arrows to anchor points
- [ ] **Copy/paste** - Shape duplicates correctly
- [ ] **Undo/redo** - Works for all operations
- [ ] **Save/load** - Shape persists across sessions

---

## Common Issues & Solutions

### Issue: Shape doesn't appear when drawn
**Solution**: Check `shape-geometry.ts` - likely returning `null` or invalid geometry

### Issue: Can't click or select shape
**Solution**: Add to `hitTestElement` function in `canvas.tsx` (~line 1390)

### Issue: Double-click doesn't open text editor
**Solution**: Add to `shapeTypes` array in `handleDoubleClick` (~line 2946)

### Issue: Tool dropdown doesn't work
**Solution**: Add shape type to store union type in `app-store.ts`

### Issue: Drawing Style doesn't update
**Solution**: Already fixed! `renderStyle` is tracked in canvas reactive effect

### Issue: Shape renders incorrectly (wrong position/size)
**Solution**: Check coordinate system - remember `x = -mw`, `y = -mh` (centered at origin)

### Issue: SVG path doesn't close properly
**Solution**: Use `isClosed: false` for open paths (brackets, dividers)

### Issue: Wrong properties show in property panel
**Solution**: Update `applicableTo` arrays in `properties.ts`

---

## Example: Complete Implementation

Here's a complete example adding a "Pentagon" shape:

### 1. Type (`src/types.ts`)
```typescript
export type ElementType = /* ... */ | 'pentagon';
```

### 2. Geometry (`src/utils/shape-geometry.ts`)
```typescript
case 'pentagon': {
    const points: { x: number, y: number }[] = [];
    for (let i = 0; i < 5; i++) {
        const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
        points.push({ 
            x: (w / 2) * Math.cos(angle), 
            y: (h / 2) * Math.sin(angle) 
        });
    }
    return { type: 'points', points: points };
}
```

### 3. Register (`src/shapes/register-shapes.ts`)
```typescript
const specialtyTypes = [/* ... */, 'pentagon'] as const;
```

### 4. Hit Test (`src/components/canvas.tsx` ~line 1390)
```typescript
el.type === 'pentagon' || /* ... */
```

### 5. Double-Click (`src/components/canvas.tsx` ~line 2946)
```typescript
const shapeTypes = [/* ... */, 'pentagon'];
```

### 6. Properties (`src/config/properties.ts`)
Add `'pentagon'` to all relevant `applicableTo` arrays

### 7. Toolbar (`src/components/shape-tool-group.tsx`)
```typescript
import { Pentagon } from "lucide-solid";
const shapeTools = [
    /* ... */,
    { type: 'pentagon', icon: Pentagon, label: 'Pentagon' }
];
```

### 8. Anchors (`src/utils/anchor-points.ts`)
```typescript
element.type === 'pentagon' || /* ... */
```

---

## Reference: Shape Categories

| Category | Shapes | Renderer |
|----------|--------|----------|
| **Basic** | Rectangle, Circle, Diamond | Built-in |
| **Polygons** | Triangle, Hexagon, Pentagon, Octagon, Septagon | PolygonRenderer |
| **Specialty** | Cloud, Heart, Star, Burst, Arrows, Brackets | SpecialtyShapeRenderer |
| **Flowchart** | Database, Document, Process, Storage | FlowchartRenderer |
| **Technical** | DFD Process, Data Store, Cylinder, Cube, State markers | SpecialtyShapeRenderer |
| **Infrastructure** | Server, Lambda, Firewall, Router | InfraRenderer |
| **Sketchnote** | Lightbulb, Signpost, Scroll, Burst Blob | SketchnoteRenderer |
| **Wireframe** | Browser, Button, Input Field | WireframeRenderer |

---

## Final Notes

- **Always test thoroughly** - Use the testing checklist above
- **Update documentation** - Add your shape to this list
- **Commit incrementally** - Don't bundle unrelated changes
- **Follow naming conventions** - Use camelCase for type names

**Questions?** Check `docs/learnings.md` for common pitfalls and solutions.
