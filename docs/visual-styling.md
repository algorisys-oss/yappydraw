# Visual Styling & Depth

This document details the advanced visual styling features added in Phase 50, enabling professional-grade diagrams with depth, texture, and rich colors.

## 1. Gradient Fills
Support for **Linear** and **Radial** gradients has been added to the Architectural (Solid) render style.

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `fillStyle` | `'solid' \| 'linear' \| 'radial'` | Determines the fill mode. |
| `gradientStart` | `string` (Hex/RGB) | The starting color (0%). |
| `gradientEnd` | `string` (Hex/RGB) | The ending color (100%). |
| `gradientDirection` | `number` (Degrees) | Angle of the linear gradient (e.g., 45°). |

> [!NOTE]
> Gradient properties only appear in the Property Panel when `fillStyle` is set to **Linear Gradient** or **Radial Gradient**.

### Implementation Details
*   **Coordinate System**: Gradients are rendered using a **local coordinate system** centered on the element (`cx, cy`). This ensures that:
    1.  Gradients move and rotate perfectly with the shape.
    2.  The angle of the gradient is relative to the shape's rotation (or screen? currently screen-relative rotation applied to local coords).
*   **Shape Support**: A new `shapeGeometry.ts` utility normalizes shape paths (Rect, Circle, Polygon, Star, etc.) so gradients apply uniformly to any closed shape.

## 2. Drop Shadows
Elements now support configurable drop shadows to add depth.

### Properties
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `shadowEnabled` | `boolean` | `false` | Master toggle for shadow. |
| `shadowColor` | `string` | `rgba(0,0,0,0.3)` | Color and alpha of the shadow. |
| `shadowBlur` | `number` | `10` | Softness of the shadow edge. |
| `shadowOffsetX` | `number` | `5` | Horizontal displacement. |
| `shadowOffsetY` | `number` | `5` | Vertical displacement. |

### Render Logic
*   Shadows are applied at the `ctx` level using standard Canvas API properties (`shadowColor`, `shadowBlur`, etc.) before drawing the main shape path.
*   This works automatically for both `roughjs` shapes (via context settings) and architectural shapes.

## 3. Global Canvas Texture
To reduce the digital "sterility" of plain backgrounds, a global texture overlay system was implemented.

### Options
*   **None**: Standard vector view.
*   **Dots / Grid**: Functional guidelines.
*   **Graph**: Specialized sub-grid density.
*   **Paper**: Adds a subtle grain/noise texture via CSS overlay (`pointer-events: none`), simulating physical paper without impacting canvas render performance.

### Architecture
*   The texture is rendered on a separate `<div>` layer or Canvas pass to avoid re-rendering complex textures on every frame.
*   Grid/Dots are drawn in the main `draw()` loop for precise alignment with pan/zoom.

## 4. Text Styling
Independent text styling was introduced in Phase 51, decoupling text attributes from shape stroke properties.

### Properties
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `textColor` | `string` | `strokeColor` | Independent color for text content. |
| `textHighlightEnabled` | `boolean` | `false` | Toggles a background highlight for text. |
| `textHighlightColor` | `string` | `rgba(255,255,0,0.4)` | Color of the highlight box. |
| `textHighlightPadding` | `number` | `4` | Spacing around the text inside the highlight. |
| `textHighlightRadius` | `number` | `2` | Corner radius for the highlight box. |

### Precision Alignment
*   **Baseline Correction**: Hand-drawn fonts often have shifting baselines. The system applies a standard vertical correction (e.g., +2px for Handlee) to ensure visual centering within the highlight box.
*   **Multi-line Support**: Highlights are measured per-line, creating a clean "wrapped" look for multi-line labels and text elements.
