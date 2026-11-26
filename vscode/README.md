# YappyDraw for VS Code

Draw diagrams, flowcharts, mind maps, wireframes, UML and slides without leaving VS Code.
Open a `.yappy` file and you get the full [YappyDraw](https://yappydraw.com) editor in the tab.
Your drawings live in your repository, next to the code they describe.

## Features

- **Opens `.yappy` files** in the full YappyDraw editor: shapes, connectors, sketch and
  architectural styles, slides, layers, the element library and the command palette (Ctrl+K).
- **Editable images.** `.yappy.svg` and `.yappy.png` files are ordinary images that GitHub,
  Markdown and browsers display, with the whole drawing stored inside. Put
  `![Architecture](docs/architecture.yappy.svg)` in a README, and click the file to edit it.
- **Saves like any other file.** Ctrl+S writes the `.yappy` file. The tab shows unsaved
  changes, Revert works, and VS Code keeps unsaved drawings across restarts.
- **Works offline.** The editor is bundled inside the extension. Nothing loads from the
  internet unless you use an online feature such as AI generation or image search.
- **Follows your theme.** The editor switches to light or dark with VS Code.
- **Exports go where you choose.** PNG, SVG, PDF and the other exports open VS Code's Save
  dialog, starting in the drawing's own folder.
- **The same files as the web app.** A `.yappy` file saved here opens on yappydraw.com and in
  the desktop app, and the other way round.

## Getting started

- **New drawing:** run **YappyDraw: New Drawing** from the Command Palette, or use
  **File ▸ New File…** and choose YappyDraw. Pick **Drawing**, **Editable SVG** or
  **Editable PNG**. VS Code asks where to save it the first time you
  press Ctrl+S.
- **Existing drawing:** click any `.yappy`, `.yappy.svg` or `.yappy.png` file in the Explorer.

## Keyboard

The editor's own shortcuts work as on the website. Ctrl+Z and Ctrl+Y undo and redo inside the
drawing. Ctrl+S saves the file.

## Privacy

The extension sends nothing anywhere. The website's analytics are removed from the bundled
editor.

## License

AGPL-3.0-only. Source: https://github.com/algorisys-oss/yappydraw
