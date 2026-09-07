# Template System Documentation

## Overview

The Yappy template system provides a flexible and extensible way to create pre-made diagrams that users can quickly insert into their canvas. Templates are organized by categories and can include flowcharts, mind maps, wireframes, org charts, network diagrams, and more.

## Architecture

### Core Components

1. **Type Definitions** (`src/types/templateTypes.ts`)
   - Defines the structure of templates, categories, and metadata
   - `Template`, `TemplateCategory`, `TemplateMetadata`, `DrawingData`, `CategoryInfo`

2. **Template Registry** (`src/templates/registry.ts`)
   - Central registry for all templates
   - Category management system
   - Search functionality
   - Singleton pattern for global access

3. **Template Browser UI** (`src/components/TemplateBrowser.tsx`)
   - Modal dialog for browsing and selecting templates
   - Category tabs for organization
   - Responsive grid layout for template cards

4. **Template Data** (`src/templates/data/`)
   - Organized by category (e.g., `diagrams/`)
   - Each template is a separate TypeScript file

## Creating a New Template

### Step 1: Define Template Structure

Create a new file in the appropriate category directory (e.g., `src/templates/data/diagrams/mytemplate.ts`):

```typescript
import type { Template } from '../../../types/templateTypes';

export const myTemplate: Template = {
    metadata: {
        id: 'unique-template-id',
        name: 'Display Name',
        category: 'diagrams',
        description: 'Brief description of what this template provides',
        tags: ['tag1', 'tag2', 'tag3'],
        order: 1 // Display order within category
    },
    data: {
        version: 1,
        elements: [
            // Array of DrawingElement objects
        ],
        layers: [
            // Array of Layer objects
        ],
        viewState: {
            scale: 1,
            panX: 0,
            panY: 0
        },
        gridSettings: {
            enabled: false,
            snapToGrid: false,
            objectSnapping: true,
            gridSize: 20,
            gridColor: '#e0e0e0',
            gridOpacity: 0.5,
            style: 'dots'
        }
    }
};
```

### Step 2: Define Elements

Each element in the template must include all required properties:

#### Required Properties for All Elements

```typescript
{
    id: 'unique-element-id',
    type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'diamond',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    
    // Style properties (REQUIRED)
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'hachure' | 'solid' | 'cross-hatch',
    strokeWidth: 1,
    strokeStyle: 'solid' | 'dashed' | 'dotted',
    opacity: 100,
    roughness: 1,
    angle: 0,
    renderStyle: 'sketch' | 'architectural',
    seed: Math.floor(Math.random() * 2147483647),
    roundness: null,
    locked: false,
    link: null,
    layerId: 'default-layer'
}
```

#### Optional Properties

- **Text content**: `containerText: 'Text inside shape'`
- **Font size**: `fontSize: 16`
- **Connections**: `boundElements: [{ id: 'arrow-id', type: 'arrow' }]`

#### Arrow/Line Specific Properties

```typescript
{
    // ... all required properties above ...
    curveType: 'straight' | 'bezier' | 'elbow',
    startArrowhead: null | 'arrow' | 'triangle' | 'dot' | 'circle' | 'bar',
    endArrowhead: 'arrow',
    startBinding: {
        elementId: 'source-element-id',
        focus: 0,
        gap: 5
    },
    endBinding: {
        elementId: 'target-element-id',
        focus: 0,
        gap: 5
    }
}
```

### Step 3: Create Connected Elements

For elements that connect to each other:

1. **Add `boundElements` to shapes**:
   ```typescript
   boundElements: [
       { id: 'arrow-1', type: 'arrow' },
       { id: 'line-2', type: 'arrow' }
   ]
   ```

2. **Add bindings to arrows/lines**:
   ```typescript
   startBinding: {
       elementId: 'shape-1',
       focus: 0,  // -1 to 1, offset from center
       gap: 5     // pixels from edge
   },
   endBinding: {
       elementId: 'shape-2',
       focus: 0,
       gap: 5
   }
   ```

3. **Order matters**: Define shapes before arrows that reference them

### Step 4: Export Template

Add your template to the category index file:

**`src/templates/data/diagrams/index.ts`:**
```typescript
export { flowchartTemplate } from './flowchart';
export { myTemplate } from './mytemplate';
```

### Step 5: Register Template

Add the template to the registry:

**`src/templates/registry.ts`:**
```typescript
private registerDefaultTemplates() {
    // Register diagram templates
    this.registerTemplate(diagramTemplates.flowchartTemplate);
    this.registerTemplate(diagramTemplates.myTemplate);
}
```

## Property Normalization

The system includes automatic property normalization via `normalizeElement()` in `src/utils/migration.ts`. This ensures all elements have required properties with sane defaults:

- Missing `opacity` → defaults to `100`
- Missing `roughness` → defaults to `1`
- Missing `angle` → defaults to `0`
- Missing `locked` → defaults to `false`
- Missing `strokeStyle` → defaults to `'solid'`
- Missing `backgroundColor` → defaults to `'transparent'`

**However**, it's best practice to explicitly set all properties in templates for clarity and predictability.

## Best Practices

### 1. Use Meaningful IDs
```typescript
id: 'ceo-node'  // Good
id: 'n1'        // Avoid
```

### 2. Use Semantic Colors
```typescript
// Good - semantic colors
strokeColor: '#2563eb',  // Blue for primary
backgroundColor: '#dbeafe'

// Avoid - random colors
strokeColor: '#ff00ff'
```

### 3. Group Related Elements
```typescript
elements: [
    // Header section
    { id: 'header', ... },
    
    // Content section
    { id: 'content', ... },
    
    // Footer section
    { id: 'footer', ... }
]
```

### 4. Add Descriptive Comments
```typescript
// CEO - Top of hierarchy
{
    id: 'ceo',
    containerText: 'CEO',
    ...
}
```

### 5. Use Consistent Spacing
```typescript
// Good - aligned layout
x: 100, y: 50,   // Element 1
x: 100, y: 150,  // Element 2 (100px below)
x: 100, y: 250   // Element 3 (100px below)
```

### 6. Set Appropriate Grid Settings
```typescript
// For wireframes - enable grid
gridSettings: {
    enabled: true,
    snapToGrid: true,
    ...
}

// For organic diagrams - disable grid
gridSettings: {
    enabled: false,
    snapToGrid: false,
    ...
}
```

## Example: Simple Two-Node Template

```typescript
import type { Template } from '../../../types/templateTypes';

export const simpleFlowTemplate: Template = {
    metadata: {
        id: 'simple-flow',
        name: 'Simple Flow',
        category: 'diagrams',
        description: 'Two connected nodes showing a simple flow',
        tags: ['flow', 'simple', 'beginner'],
        order: 10
    },
    data: {
        version: 1,
        elements: [
            // Start Node
            {
                id: 'start',
                type: 'rectangle',
                x: 100,
                y: 100,
                width: 150,
                height: 80,
                strokeColor: '#2563eb',
                backgroundColor: '#dbeafe',
                fillStyle: 'solid',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'Start',
                boundElements: [{ id: 'arrow-1', type: 'arrow' }]
            },
            // End Node
            {
                id: 'end',
                type: 'rectangle',
                x: 350,
                y: 100,
                width: 150,
                height: 80,
                strokeColor: '#059669',
                backgroundColor: '#d1fae5',
                fillStyle: 'solid',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'End',
                boundElements: [{ id: 'arrow-1', type: 'arrow' }]
            },
            // Arrow connecting them
            {
                id: 'arrow-1',
                type: 'arrow',
                x: 250,
                y: 140,
                width: 100,
                height: 0,
                strokeColor: '#374151',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'start',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'end',
                    focus: 0,
                    gap: 5
                }
            }
        ],
        layers: [
            {
                id: 'default-layer',
                name: 'Simple Flow',
                visible: true,
                locked: false,
                opacity: 1,
                order: 0
            }
        ],
        viewState: {
            scale: 1,
            panX: 0,
            panY: 0
        },
        gridSettings: {
            enabled: false,
            snapToGrid: false,
            objectSnapping: true,
            gridSize: 20,
            gridColor: '#e0e0e0',
            gridOpacity: 0.5,
            style: 'dots'
        }
    }
};
```

## Adding New Categories

To add a new template category:

1. **Update Type Definition** (`src/types/templateTypes.ts`):
   ```typescript
   export type TemplateCategory = 'diagrams' | 'sketchnotes' | 'your-new-category';
   ```

2. **Create Category Directory**:
   ```
   src/templates/data/your-new-category/
   ```

3. **Register Category** (`src/templates/registry.ts`):
   ```typescript
   private initializeCategories() {
       this.categoriesInfo.set('your-new-category', {
           id: 'your-new-category',
           name: 'Your Display Name',
           description: 'Description of this category',
           icon: '📊'
       });
   }
   ```

## Troubleshooting

### Issue: Elements Not Connected

**Problem**: Arrows/lines don't move with shapes when dragged.

**Solution**: Ensure both `boundElements` on shapes AND bindings on arrows are correctly set:
```typescript
// On the shape
boundElements: [{ id: 'arrow-id', type: 'arrow' }]

// On the arrow
startBinding: { elementId: 'shape-id', focus: 0, gap: 5 }
```

### Issue: Template Not Showing in Browser

**Checklist**:
1. ✅ Template exported from category index file
2. ✅ Template registered in registry.ts
3. ✅ Metadata category matches registered category
4. ✅ Template ID is unique

### Issue: Elements Have Missing Properties

**Solution**: Use the property checklist above or rely on `normalizeElement()` to fill defaults. Better to be explicit in templates.

## Reference Templates

See existing templates for examples:
- **Flowchart**: `src/templates/data/diagrams/flowchart.ts`
- **Mind Map**: `src/templates/data/diagrams/mindmap.ts`
- **Wireframe**: `src/templates/data/diagrams/wireframe.ts`
- **Org Chart**: `src/templates/data/diagrams/orgchart.ts`
- **Network Diagram**: `src/templates/data/diagrams/network.ts`

## API Reference

### Template Loading

Templates are loaded via `loadTemplate()` in `src/store/appStore.ts`:
```typescript
loadTemplate(templateData: DrawingData)
```

This function:
1. Clears current canvas (with user confirmation if not empty)
2. Resets history
3. Loads elements, layers, viewState, gridSettings, and canvasBackgroundColor
4. Normalizes all elements to ensure required properties

### Template Registry Methods

```typescript
// Get all templates in a category
getTemplatesByCategory(category: TemplateCategory): Template[]

// Get template by ID
getTemplateById(id: string): Template | undefined

// Search templates
searchTemplates(query: string): Template[]

// Get all active categories (those with templates)
getActiveCategories(): CategoryInfo[]
```
