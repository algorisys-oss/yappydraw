# Display States and Interactive Diagrams

Display States allow you to capture snapshots of your entire canvas and transition between them using smooth, "Magic Move" style animations. This feature is perfect for creating interactive diagrams, step-by-step walkthroughs, or dynamic sketchnotes.

## Key Concepts

### What is a Display State?
A Display State is a saved collection of properties for all elements currently on the canvas. Instead of saving a new copy of the elements, it saves **overrides** for existing elements, such as:
- **Position** (X, Y)
- **Size** (Width, Height)
- **Rotation** (Angle)
- **Style** (Opacity, Background Color, Stroke Color)
- **Content** (Text)

### Magic Move Transitions
When you switch from one state to another, Yappy calculates the difference between the current properties and the target properties. It then animates the changes smoothly over time, creating a cinematic transition where elements "morph" into their new roles.

---

## How to use Display States

### 1. Open the State Panel
Toggle the **State Panel** from the Menu, using the command palette, or with the keyboard shortcut **Alt + S**. You'll see a list of your saved states and a "Capture" button.

### 2. Capture a State
Structure your diagram as you want it to appear initially. Click the **Capture** button in the State Panel. Give it a descriptive name like "Step 1: Introduction".

### 3. Create a Sequence
1. Move, resize, or change the color of your elements.
2. Capture a new state (e.g., "Step 2: Process Block").
3. Repeat this for as many steps as your diagram needs.

### 4. Transitioning
Simply click on a state in the list to "morph" to that state. Yappy will handle the interpolation for all transformed properties.

---

## Creating Interactive Diagrams

### Example: A Sequential Flow
You can represent a complex algorithm or business process by capturing states at each critical junction:
- **State A**: Only the entry point is visible (Opacity: 100), others are hidden (Opacity: 0).
- **State B**: Arrow moves from Entry to Process 1. Process 1 fades in.
- **State C**: Process 1 changes color to Green (Success) and a result box appears.

### Tips for Better Transitions
- **Consistent IDs**: The morphing logic relies on element IDs. If you delete an element and create a new one that looks the same, it will fade out/in instead of moving. Try to reuse elements across states for the best "Magic Move" effect.
- **Nudging**: Small changes in position or size can make a diagram feel alive. Use states to show "active" or "hover" equivalents of your diagram components.
- **Text Morphing**: You can even change the text content between states!

---

## Technical Details (For Developers)

- **Storage**: States are stored in the `states` array within the `app-store.ts`.
- **Animation Engine**: The `MorphAnimator` class (`src/utils/animation/morph-animator.ts`) handles the calculation of deltas and triggers the `animateElement` utility.
- **Properties Tracked**: See the `DrawingElementState` interface in `src/types/motion-types.ts` for the full list of animated properties.
