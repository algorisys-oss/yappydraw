# Offline HTML Export (Standalone Player)

Yappy allows you to export your slide presentations as a single, standalone HTML file. This file contains everything needed to view and present your slides without an internet connection or the Yappy editor.

## Features

- **Single File**: All assets, styles, and drawing instructions are bundled into one `.html` file.
- **Offline Ready**: Works completely offline.
- **Embedded Player**: Includes a streamlined version of the Yappy engine optimized for presentation.
- **Interactive Tools**: 
  - **Navigation**: Use the on-screen buttons or arrow keys to move between slides.
  - **Laser Pointer**: Use the laser tool to highlight areas during your talk.
  - **Ink Highlighter**: Draw directly on slides for live annotations (annotations are transient and not saved to the file).
- **Auto-Sync**: The player automatically centers on the first slide and scales to fit your screen.

## How to Export

1. Open a Slide Document in Yappy.
2. Go to the **Menu** (top left).
3. Select **Export**.
4. Choose **Export as HTML (Standalone Player)**.
5. Save the file to your computer.

## Technical Deep Dive

The HTML export feature uses a sophisticated "Compiled Asset Injection" architecture to ensure the resulting file is portable and performs identically to the Yappy editor.

### 1. The Player Build Pipeline

The standalone player is treated as a secondary application within the codebase.

- **Vite Configuration (`vite.player.config.ts`)**: This file defines a specific build target for the player. It points to `src/player.tsx` as the entry point and outputs minified JS/CSS to `dist/player`. It is configured to exclude public assets and produce a clean, self-contained output.
- **Embedding Script (`scripts/embed-player.js`)**: This Node.js script orchestrates the build process. After running Vite, it reads the generated `.js` and `.css` files and serializes them into a TypeScript module: `src/assets/player-assets.ts`. 

```typescript
// Example of generated player-assets.ts
export const PLAYER_JS = "/* Minified engine code... */";
export const PLAYER_CSS = "/* Minified styles... */";
```

This allows the main Yappy application to import the entire player engine as simple string constants, eliminating the need for complex runtime fetching.

### 2. Standalone Export Logic

When you click "Export as HTML", the following happens in `src/utils/export-to-html.ts`:

1. **Asset Embedding**: The document is traversed. Any local images (stored as `blob:` URLs in the browser) are converted to Base64 `data:` URLs.
2. **Template Interpolation**: A massive HTML template is constructed.
    - `PLAYER_CSS` is injected into the `<head>`.
    - The document data is serialized into `window.__PRESENTATION_DATA__`.
    - `PLAYER_JS` is injected as a `<script type="module">`.
3. **Blob Download**: The final HTML string is converted to a Blob and triggered as a download in the user's browser.

### 3. Player Runtime

Upon opening the HTML file:
- The browser executes the module script containing `PLAYER_JS`.
- The `PlayerApp` component mounts.
- It retrieves data from `window.__PRESENTATION_DATA__`.
- It executes `registerShapes()` to initialize the drawing instructions.
- It enters a read-only presentation state and automatically frames the first slide.
