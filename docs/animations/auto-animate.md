# Technical Documentation: Auto-Animate (State Morphing)

Auto-Animate is a feature in Yappy that allows users to create smooth transitions between different "Display States" of a sketch. It works by diffing the properties of elements between two states and automatically tweening them.

## Core Components

### 1. State Management (`app-store.ts`)
Display States are stored in the `AppState` as an array of `DisplayState` objects. Each state contains:
- `id`: A unique identifier.
- `name`: A user-friendly name for the state.
- `overrides`: A record mapping element IDs to their specific properties at that state (e.g., `x`, `y`, `width`, `height`, `opacity`, `angle`, `color`, `text`).

Key actions include:
- `addDisplayState`: Captures the current canvas as a new snapshot.
- `applyDisplayState`: Loads a state, optionally triggering the `MorphAnimator`.
- `updateDisplayState`: Overwrites a saved state with current canvas values.

### 2. Morph Animator (`src/utils/animation/morph-animator.ts`)
The `MorphAnimator` class is responsible for the visual transition logic:
- **Identification**: Diffs the current canvas against the target state's overrides.
- **Shared Elements**: Elements present in both the current and target states are animated smoothly using `animateElement`.
- **Exiting Elements**: Elements not in the target state are faded out.
- **Entering Elements**: Elements appearing in the target state are faded in at their destination.

### 3. UI Layer (`src/components/state-panel.tsx`)
The `StatePanel` provides the user interface for managing states:
- **Capture**: Quick button to snapshot the current view.
- **List**: Display all saved states with a summary of affected elements.
- **Controls**: Play (Morph to State), Refresh (Update State), and Delete.

## Data Persistence
Display States are fully persisted within the Yappy drawing format (v2/v3). The `migration.ts` utility handles normalizing the `states` and `activeStateId` properties during save/load operations, ensuring your "Magic Move" transitions are preserved across sessions.

## Best Practices for Usage
- **Naming**: Use descriptive names like "Initial Setup" and "System Failure" to organize your transitions.
- **Micro-Animations**: Use the alignment tools before capturing a state to create perfectly ordered transitions.
- **Visibility**: Toggle element opacity to create "Build" sequences where parts of a diagram appear one-by-one.
