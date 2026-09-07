# Smart Spacing Guides: Algorithms & Implementation

Implementing **Smart Spacing** (also known as "Distribute Snapping") allows users to position elements with consistent gaps relative to other objects on the canvas. 

This guide explains the mathematical logic behind detecting equal spacing and rendering the visual indicators.

---

## 1. Core Logic

The goal is to detect when a moving element (the **active** element) creates equal gaps between two other static elements (**neighbors**).

### Scenario A: Gap Filling (Midpoint)
The active element `B` is moved between `A` and `C`.
We want: `Gap(A, B) == Gap(B, C)`

### Scenario B: Successive Spacing (Sequence)
The active element `C` is moved to the side of `A` and `B`.
We want: `Gap(B, C) == Gap(A, B)`

---

## 2. Mathematical Algorithm

The spacing engine (`src/utils/spacing.ts`) iterates through pairs of static elements and identifies the geometric relationship to the active element.

### Variables:
- `Left`, `Mid`, `Right`: The three elements involved, sorted by their X coordinates.
- `gap1 = Mid.minX - Left.maxX`
- `gap2 = Right.minX - Mid.maxX`
- `correction`: The delta to move the active element to make `gap1 == gap2`.

### Case 1: Active Element is `Left`
If the moving element is the leftmost in the sequence:
- `Target_Left_MaxX = Mid.minX - Gap(Mid, Right)`
- `Correction = Target_Left_MaxX - Current_Left_MaxX`

### Case 2: Active Element is `Mid`
If the moving element is in the middle:
- `Target_Mid_CenterX = (Left.maxX + Right.minX) / 2`
- `Correction = Target_Mid_CenterX - Current_Mid_CenterX`

### Case 3: Active Element is `Right`
If the moving element is the rightmost:
- `Target_Right_MinX = Mid.maxX + Gap(Left, Mid)`
- `Correction = Target_Right_MinX - Current_Right_MinX`

---

## 3. Vertical Spacing
The same logic applies to the Y-axis using `Top`, `Mid`, and `Bottom` elements with their `maxY` and `minY` attributes.

---

## 4. Visual Feedback System

When a snap correction is within the threshold (default: 5px), the canvas renders **Spacing Guides**:

1. **Arrows**: Pink/Magenta lines with arrows spanning the gaps.
2. **Text Labels**: Small white-on-pink pills showing the exact pixel distance of the gap.
3. **Ticks**: Short vertical (or horizontal) bars at the edges of the elements to define the boundary of the gap.

### Rendering Integration
The guides are calculated in `handlePointerMove` and stored in a signal. The `draw()` loop in `Canvas.tsx` then iterates through these guides to render the overlays imperatively on the context.

---

## 5. Implementation Files
- **Logic**: [spacing.ts](file:///home/rajesh/work/yappy/src/utils/spacing.ts)
- **Rendering**: [Canvas.tsx](file:///home/rajesh/work/yappy/src/components/Canvas.tsx)
