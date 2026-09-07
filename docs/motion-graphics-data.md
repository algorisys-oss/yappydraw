# Motion Graphics Data Structure

This document details the data structures powering the UI/Diagram Motion Graphics system in Yappy.

## Overview

The motion graphics system allows for complex, sequenced animations and state-based transitions. It is built on two core concepts:
1.  **Element Animations**: Sequences of effects applied to individual elements.
2.  **Display States**: Snapshots of element properties for "Magic Move" style transitions.

## 1. Element Animations

Everything is typed in `src/types/motion-types.ts`.

The `DrawingElement` interface now includes an `animations` array:

```typescript
interface DrawingElement {
  // ...
  animations?: ElementAnimation[];
}
```

### Animation Types

There are three types of `ElementAnimation`:

#### A. Preset Animation
Predefined effects like fades, bounces, and shakes.

```typescript
interface PresetAnimation {
  type: 'preset';
  name: string;      // e.g., 'fadeIn', 'bounceOut'
  trigger: 'on-load' | 'on-click' | 'after-prev';
  // ... timing properties
}
```

#### B. Property Animation (Tweening)
Granular control over specific properties.

```typescript
interface PropertyAnimation {
  type: 'property';
  property: string;  // e.g., 'x', 'opacity', 'rotation'
  from?: number;     // Optional start value
  to: number;        // Target value
  easing: EasingName;
}
```

#### C. Path Animation
Move an element along a path (defined by another element or SVG data).

```typescript
interface PathAnimation {
  type: 'path';
  pathId?: string;   // ID of the path element (e.g., a bezier curve)
  orientToPath?: boolean; // Auto-rotate element to follow path tangent
}
```

## 2. Display States

For "Magic Move" transitions (like Keynote/PowerPoint), we use `DisplayState`. A slide can define multiple states, and the engine interpolates between them.

```typescript
interface Slide {
  // ...
  states?: DisplayState[];
  initialStateId?: string;
}

interface DisplayState {
  id: string;
  name: string;      // e.g., "Loading", "Success"
  overrides: Record<string, Partial<DrawingElementState>>;
}
```

### How it works
1.  **Base State**: The `DrawingElement`'s current properties in the `elements` array define the "Base" state.
2.  **Overrides**: Each `DisplayState` contains a map of element IDs to property overrides.
3.  **Transition**: When switching states, the engine interpolates all properties (x, y, color, opacity) from the *current* state to the *target* state.

## 3. Forward Compatibility

The structure is designed to be extensible:
- **Triggers**: The `trigger` field ('on-load', 'on-click', 'programmatic') allows adding new interaction types (e.g., 'on-scroll') without changing the animation definition.
- **Sequencing**: The `animations` array inherently supports infinite chaining.
- **New Animation Types**: The `ElementAnimation` union type can be extended with new interfaces (e.g., `FilterAnimation`) without breaking existing renderers.

## 4. Global Animation Settings

`GlobalSettings` in `src/types/slide-types.ts` now includes:

```typescript
interface GlobalSettings {
  // ...
  animationEnabled?: boolean; // Master toggle (default: true)
  reducedMotion?: boolean;    // Accessibility (default: false)
}
```

- **`animationEnabled`**: Master toggle. When `false`, it **must disable all**:
  - Element animations (entrance/exit/sequences).
  - State transitions (Magic Move).
  - **Flow animations** (dashed lines, pulsing effects).
- **`reducedMotion`**: Should be respected by the engine to show simpler/no animations for users with vestibular disorders.
