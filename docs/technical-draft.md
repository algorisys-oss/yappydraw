# Technical Draft: Advanced Relationship Connectors

This document outlines the architecture for specialized relationship markers (UML/ER) on line and arrow elements.

## Objective
Enable the creation of technical diagrams (UML, ERD) by extending the existing relationship connector system with specialized endpoints and line styles.

## Proposed Extensions

### 1. Arrowhead Types (`ArrowheadType`)
Extend the current system with:
- `triangle`: ▷ (Hollow triangle for inheritance/generalization)
- `diamond`: ◇ (Hollow diamond for aggregation)
- `diamondFilled`: ◆ (Solid diamond for composition)
- `crowsfoot`: ⋈ (ER diagram many-to-one/many-to-many)
- `circle`: ○ (Optional/Zero-or-one relationship)

### 2. Line Styles
Add support for:
- `dashed`: Used for Dependency (UML) or Realization
- `dotted`: Alternative line style for specialized connectors

## Data Model Changes

### `src/types.ts`
```typescript
export type ArrowheadType = 
    | 'none' | 'arrow' | 'dot' 
    | 'triangle' | 'diamond' | 'diamondFilled' | 'crowsfoot' | 'circle';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface DrawingElement {
    // ...
    lineStyle?: LineStyle;
    // ...
}
```

## Rendering Implementation
The `LineRenderer` or `ArrowRenderer` will be updated to handle these new endpoint types using standard Canvas API transformations (translate/rotate) to position markers at the stroke ends.

### Marker Rendering Logic
- **Triangle**: Render a hollow polygon with stroke.
- **Diamond/DiamondFilled**: Render a 4-point polygon, optionally filled.
- **Crowsfoot**: Render three distinct lines branching from the endpoint.
- **Circle**: Render a hollow ellipse at the tip.

## UI Integration
- Update `src/config/properties.ts` to include the new options in the "Start Marker" and "End Marker" dropdowns.
- Add "Line Style" property for lines and arrows.

## Future Considerations
- Multiplicity labels (1..*, 0..1) attached to connector ends.
- Orthogonal routing with specialized markers.
- Auto-routing between UML classes.
