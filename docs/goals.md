# Project Goals: Excalidraw-like Application (Phase 1)

## Overview
Build a performance-optimized infinite canvas drawing application using SolidJS. The app will allow users to create technical diagrams and prototypes with a hand-drawn feel, similar to Excalidraw.

## Phase 1 Features

### Core Functionality
- [ ] **Infinite Canvas**: 
  - Pan and Zoom capabilities.
  - Performance optimization for handling many elements.
- [ ] **Drawing Tools**: 
  - Basic shapes: Rectangle, Circle/Ellipse, Line, Arrow.
  - Text support.
  - Freehand drawing (pencil).
- [ ] **Data Management**:
  - Save drawings.
  - Create new drawings.
  - **Storage**: Store data as JSON in a local `data` folder.
  - **Abstraction**: Implement a storage interface to facilitate future migration to Postgres or SQLite.

### Collaboration & Sharing
- [ ] **Sharable Links**: Generate links to share drawings (read-only or collaborative logic to be defined).

### UX/UI
- [ ] **Miro-like Features**: Borrow useful interaction patterns from Miro (e.g., sticky notes, easy connection lines).
- [ ] **Prototyping Ready**: Ensure the tool is robust enough for designing technical diagrams and idea prototyping.

## Technical Stack
- **Frontend Framework**: SolidJS
- **Language**: TypeScript
- **Styling**: Vanilla CSS (or Tailwind if preferred, defaulting to Vanilla per instructions)
- **State Management**: SolidJS Stores
