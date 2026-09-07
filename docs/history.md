# Project History & Engineering Log

This document tracks the complete evolution of the **Yappy** project. It includes high-level phase summaries and detailed engineering logs for complex debugging sessions, capturing the decision-making process, troubleshooting steps, and technical resolutions.

## Phase 1: Core Foundation
**Goal:** Initialize a performant infinite canvas engine.
*   **Decisions:** Chosen SolidJS for reactivity and performance. HTML5 Canvas API over SVG for better performance with high element counts (infinite canvas).
*   **Architecture:** `requestAnimationFrame` loop in `Canvas.tsx` driven by a central `appStore`.

## Phase 7: Pan Tool
**Goal:** Explicit tool for canvas navigation.

*   **User Request:** Add a "Hand" symbol for panning, similar to Excalidraw.
*   **Implementation:**
    *   **Tool:** Added `pan` type to `ElementType` and `Hand` icon to Toolbar.
    *   **Logic:** In `Canvas.tsx`, handled `pan` tool to allow dragging the canvas (`setViewState` with `movementX/Y`) and updated cursor to `grab`/`grabbing`.

## Current State
*   **Architecture:** SolidJS Store + HTML5 Canvas.
*   **Features:** Infinite Canvas, Shapes, Pencil, Text, Selection/Resize/Rotate, Undo/Redo, Save/Load, Eraser, Auto-Scroll, Pan Tool.
*   **Stability:** Scroll bugs fixed; coordinate systems normalized.

## Phase 8: Property Sidebar Redesign
**Goal:** Excalidraw-like selection UI.

*   **User Request:** "Select an object -> sidebar appears -> icons for properties".
*   **Implementation:**
    *   **Component:** Rewrote `PropertyPanel.tsx`.
    *   **UI:** Vertical icon strip for Stroke, Background, Properties, Layers, Delete.
    *   **Popovers:** Implemented flyout panels for color grids and style options.
    *   **Features:**
        *   Added `strokeStyle` (solid/dashed/dotted) support.
        *   Added **Duplicate** icon/action.
        *   Implemented **Layers** (Bring to Front, Send to Back, etc.) with Z-index manipulation in `appStore`.
    *   **Fixes:** Resolved missing icons issue by correcting imports and type definitions; fixed `size` prop type error in Toolbar.

## Phase 2: UI & Interaction
**Goal:** Excalidraw-like feel.
*   **Implementation:** separated styles into `Toolbar`/`Menu`. Implemented `hitTestElement` using point-to-segment distance for lines and ellipse checks for circles to ensure clicking "feels" right (not just bounding boxes).

## Phase 3: File Management
**Goal:** JSON Persistence.
*   **Implementation:** Simple Node.js backend to serve/save JSON. Created a custom `FileOpenDialog` to list files, moving away from browser alerts.

## Phase 4: Undo/Redo
**Goal:** State recovery.
*   **Decision:** "Snapshot" approach over "Command Pattern".
    *   *Reasoning:* Command pattern requires wrapping every mutation (drag, resize, color change) in a class. Snapshots are easier to implement rapidly for this scale: simply deep-clone the `elements` array into a history stack before any mutation.

## Phase 5: Eraser
**Goal:** Deletion tools.
*   **Logic:** Implemented "Drag-to-Erase" by checking collisions in `handleMouseMove` while the eraser tool is active, allowing users to wipe across the screen.

---

## Phase 6: Viewport, Optimization & The "Scroll Bug" (Deep Dive)
**Date:** 2026-01-11
**Goal:** Improve scrolling UX, add auto-scroll modifiers, and optimize rendering.

### 1. Requirements & Initial Plan
The user requested:
1.  **Visibilty Culling:** Only render what is on screen.
2.  **Auto-Scroll:** Dragging to edge should pan the view.
3.  **Horizontal Scroll:** `Shift + Wheel`.

### 2. Implementation Steps
*   **Auto-Scroll:** Added bounds checking in `handleMouseMove`. If `clientX` is within 50px of the edge, modify `viewState.panX/Y`.
*   **Culling:** Implemented an AABB (Axis-Aligned Bounding Box) check in the `draw` loop. `if (!isElementVisible) continue;`.

### 3. The Incident: "Scrolling Getting Lost"
**User Report:** "The scroll is not smooth", "The scroll is getting lost", "Opening a page after scrolling is not displayed".

**Troubleshooting Log:**
1.  **Hypothesis A (Culling Bug):** I suspected my new culling logic was too aggressive, hiding elements that should be visible.
    *   *Action:* I disabled the culling logic block.
    *   *Result:* User still reported issues ("drawings disappeared").
2.  **Hypothesis B (Coordinate Math):** Maybe negative numbers (scrolling up/left) were breaking the visibility check for the "Scroll back" button.
    *   *Action:* I rewrote the bounds calculation to specifically handle `Math.min` for all corners of the elements. Added a visual debug overlay to see the exact `panX` constants.
    *   *Result:* The numbers looked "okay" but the drawing was still flying off screen.
3.  **Hypothesis C (The "Transform Accumulation" Bug):**
    *   *Analysis:* I looked closely at the `draw()` function.
    *   *Code:*
        ```typescript
        const draw = () => {
            ctx.clearRect(0,0,width,height); // Clears pixels
            ctx.translate(panX, panY);       // Applies transformation
            // ... draw elements ...
        }
        ```
    *   *The Realization:* `ctx.clearRect` clears the *pixels* but does **NOT** reset the *transformation matrix*.
    *   *The Failure Mode:*
        *   Frame 1: `translate(10, 0)`. Matrix is at (10, 0). Draw at (10, 0).
        *   Frame 2: `translate(10, 0)`. Matrix is now at (20, 0)!! (Previous 10 + New 10).
        *   Frame 100: Matrix is at (1000, 0). The drawing has flown off to infinity.
    *   *Verification:* This explained exactly why the user felt it was "accumulating" and "getting lost".

### 4. The Fix
I added an explicit matrix reset at the start of the render loop:
```typescript
// Reset Transform Matrix to Identity (1,0,0,1,0,0) so we don't accumulate translations!
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.clearRect(0, 0, width, height);
```

### 5. Recovery Features
To prevent users from ever feeling "lost" again, I implemented specific UI safeguards:
*   **"Scroll back to content" Button:** A reactive button that appears whenever the bounding box of all elements is completely outside the current viewport. Clicking it calculates the center of the content and snaps the view to it.
*   **"Reset View" Button:** Added a manual trigger (Maximize icon) to reset pan to (0,0) and scale to 1.
*   **Canvas Clearing:** Fixed a bug in the "New" button where I was setting the store but not clearing history, causing state inconsistencies. Added `clearHistory()` to `appStore`.

**Outcome:** The scrolling is now mathematically stable, smooth (matrix no longer drifts), and users have recovery tools if they pan too far.

## Session 1: Fixing Scrolling and View
**ID:** `f83f8400-fb1a-44f0-bef3-a251957be780`
**Date:** 2026-01-10
**Goal:** Fix issues with canvas scrolling, element visibility, and the "New" button functionality.

### Summary
The user's main objective was to resolve issues with canvas scrolling, element visibility, and the "New" button functionality. This session resulted in significant enhancements to the codebase, moving from a basic implementation to a more robust and feature-rich application (Phases 1-6).

### Detailed Conversation & Analysis Log

#### Initial Analysis & Plan
The session began with an objective to refine the physics simulation, but shifted focus to the "Yappy" project (Excalidraw clone). The plan was structured into phases:
1.  **Core Canvas Logic**: Implement infinite pan/zoom.
2.  **Drawing Tools**: Add basic shapes (Rect, Circle, Line/Arrow) and Freehand.
3.  **Selection & Properties**: Implement handling for moving, resizing, and rotating elements.
4.  **File Management & Storage**: Create `StorageInterface` and a simple Node.js backend for JSON persistence.
5.  **Undo/Redo**: Implement a history stack.
6.  **Optimization**: Viewport culling and auto-scrolling.

#### Key Developments

**1. Canvas & Tools**
- **Infinite Canvas**: Implemented interactive canvas with `requestAnimationFrame` for performance.
- **Tools**: Added Rectangle, Circle, Line, Arrow, and Pencil (Freehand) tools.
- **Text**: Added text input with on-canvas editing.
- **Selection**: Implemented precise hit testing (including for curved pencil paths) and geometry-based proximity checks. Added resize handles and a rotation handle.

**2. UI Improvements**
- **Properties Panel**: Created a side panel for changing stroke/fill colors, stroke width, and opacity.
- **Toolbar**: Added a floating top toolbar with tool icons.
- **Menu**: Added a top-left menu for file operations (New, Save, Load, Share).

**3. File Management**
- **Backend**: Set up a simple Node.js/Express server to handle JSON file operations in a `data/` folder.
- **Dialogs**: Replaced basic prompts with a proper UI "File Open Dialog" that lists saved drawings.
- **Sharing**: Implemented a "Share" button that generates a link with `?id=drawingId`.

**4. Advanced Features**
- **Undo/Redo**: Implemented `undo` and `redo` operations using a snapshot-based history stack, mapped to `Ctrl+Z` and `Ctrl+Y`.
- **Eraser**: Added an Eraser tool and support for Backspace/Delete keys.
- **Scrolling**: Fixed scrolling smoothness. Added `Shift + Wheel` for horizontal scrolling. Added "Auto-Scroll" when dragging near edges.
- **Reset View**: Added a button to quickly center the canvas or return to the drawing if scrolled away.

#### Artifacts Created
- **Walkthrough**: [walkthrough.md](file:///C:/Users/Admin/.gemini/antigravity/brain/f83f8400-fb1a-44f0-bef3-a251957be780/walkthrough.md)
- **Implementation Plan**: [implementation_plan.md](file:///C:/Users/Admin/.gemini/antigravity/brain/f83f8400-fb1a-44f0-bef3-a251957be780/implementation_plan.md)

### Verification
Manual verification was performed for:
- Canvas interaction (smooth pan/zoom).
- all drawing tools.
- Persistence (saving/loading from server).
- Undo/Redo functionality.
- Correct rendering of arrows and pencil paths.

---

## Session 2: Current Session
**ID:** `2f963b82-aa1e-4e60-8b4e-38ac704acbb4`
**Date:** 2026-01-11
**Goal:** Document Project History

### User Request
> "Can you save the full conversation of this project right from first prompt, responses, your analysis into history.md in this project's root folder"

### Analysis & Actions
1.  **Context**: The user requested a log of the project's conversation history.
2.  **Action**: Identified the relevant previous session (`f83f...`) related to the active workspace (`d:\work\rajesh\yappy`).
3.  **Action**: Retrieved the `walkthrough.md` and `implementation_plan.md` artifacts from the previous session's "Brain" directory to reconstruct the history.
4.  **Action**: Compiled this `history.md` file to serve as a permanent record of the project's evolution.
