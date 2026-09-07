# Technical Design: Multi-Slide & Presentation System

This document outlines the architecture and implementation details of the Multi-Slide system and Presentation Mode in YappyDraw.

## 1. Overview

The Slides feature transforms YappyDraw from a single-canvas drawing tool into a multi-page presentation engine. It supports a **Hybrid Mode** where users can choose between an "Infinite Canvas" (classic) and a "Slides" (structured) environment.

## 2. Data Structure

### Slide Document (v3)
The document format was upgraded to version 3 to support a list of independent slides.

```typescript
interface Slide {
    id: string;
    name: string;
    dimensions: { width: number; height: number }; // slide boundaries
    elements: DrawingElement[];                    // Local elements
    layers: Layer[];                              // Local layers
    viewState: ViewState;                         // Saved zoom/pan
    thumbnail?: string;                           // Low-res Data URL preview
    states?: DisplayState[];                      // Animation/Morphing states
}

interface SlideDocument {
    version: 3;
    metadata: {
        docType: 'infinite' | 'slides';
    };
    slides: Slide[];
}
```

## 3. Implementation Details

### Viewport Management & Clipping
In "Slides" mode, the canvas renders a visible boundary (16:9 by default).
- **Clipping**: The main drawing loop uses `ctx.clip()` to ensure elements outside the slide dimensions are not rendered during presentations.
- **Scaling**: A `zoomToFitSlide` utility calculates the optimal scale and pan to center the slide within the current browser viewport.

### Interaction Handling
- **Edit Mode**: Standard panning and zooming are enabled.
- **Presentation Mode (F5)**: 
    - Fullscreen API is used.
    - Pointer-down and Wheel events are blocked to "lock" the view.
    - A custom HUD (`PresentationControls`) provides navigation without interfering with the drawing.

### Visual Thumbnails
Thumbnails are generated dynamically using a hidden temporary canvas:
1. When elements change or slides switch, a throttled (1s) capture is triggered.
2. The current slide's elements are rendered to a 320px wide canvas.
3. The result is stored as a JPEG Data URL in the store for immediate sidebar rendering.

## 4. State Management

The `app-store.ts` acts as the coordinator. When a slide is switched:
1. `saveActiveSlide()` serializes the current canvas state into the `slides` array.
2. `setActiveSlide(index)` hydrates the store with the target slide's data.
3. `docType` determines the visibility of the `SlideNavigator` and specific canvas decorations.

## 5. UI Components

- **SlideNavigator**: Vertical sidebar for slide management (reordering, adding, deleting, and visual previews).
- **PresentationControls**: A glassmorphic HUD overlay that auto-hides during mouse inactivity, providing "Slide X of Y" information and navigation.
