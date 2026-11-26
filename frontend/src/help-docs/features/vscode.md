---
id: vscode
name: VS Code Extension
icon: "🧩"
category: Features
description: Open and edit .yappy drawings and editable .yappy.svg / .yappy.png images inside VS Code, Cursor and VSCodium with the full editor, offline
keywords: editable svg editable png .yappy.svg .yappy.png image with drawing inside embedded scene github readme markdown diagram exportEditableImage openEditableImage vscode vs code visual studio code extension plugin cursor vscodium windsurf open vsx marketplace custom editor .yappy file open in editor diagrams in repo docs as code save ctrl+s dirty unsaved revert hot exit backup offline theme light dark export png svg pdf save dialog new drawing file new file vsix install
seoTitle: "YappyDraw for VS Code — draw diagrams inside your editor"
seoDescription: "Coming soon: open and edit .yappy diagrams in VS Code, Cursor and VSCodium with the full YappyDraw editor. Works offline, saves with Ctrl+S, follows your theme."
---

# VS Code Extension

The **YappyDraw** extension opens `.yappy` files inside VS Code with the full editor. Your
diagrams live in the repository next to the code they describe, and you edit them without
leaving the IDE. It also works in Cursor, VSCodium and other editors built on VS Code.

## Install

> **Coming soon.** The extension is not in the VS Code Marketplace or the Open VSX registry
> yet, so searching the Extensions view will not find it. This page describes how it works
> so you can plan for it; it will say here when it is published.

- **VS Code:** once it is published, open the Extensions view
  (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>), search for **YappyDraw** and click
  **Install**.
- **Cursor, VSCodium, Windsurf:** the same search will find it, through the Open VSX registry.
- **From a file:** if you have been given a `.vsix`, run **Extensions: Install from VSIX…**
  from the Command Palette and pick it. This works today.

Editable `.yappy.svg` and `.yappy.png` images (below) already open on the website, with no
extension needed.

## How to

1. **Open a drawing.** Click any `.yappy`, `.yappy.svg` or `.yappy.png` file in the
   Explorer. It opens in the YappyDraw editor.
2. **Start a new one.** Run **YappyDraw: New Drawing** from the Command Palette
   (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>), or use **File ▸ New File…** and choose
   **New Drawing**, then pick **Drawing**, **Editable SVG** or **Editable PNG**. A file
   that is empty on disk opens on the welcome screen, so you can pick a canvas, slides or
   another document type.
3. **Draw.** Every tool, panel and shortcut works as on the website, including the command
   palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>).
4. **Save.** Press <kbd>Ctrl</kbd>+<kbd>S</kbd>. The tab shows a dot while there are unsaved
   changes. A new drawing asks where to save on the first save.

## Editable images: `.yappy.svg` and `.yappy.png`

A `.yappy.svg` or `.yappy.png` file is an ordinary image that also carries the whole drawing.
GitHub, Markdown previews and browsers show the picture; VS Code opens the drawing for
editing. Use them for diagrams in a README or in docs:

```markdown
![Architecture](docs/architecture.yappy.svg)
```

1. **Create one.** Run **YappyDraw: New Drawing** and pick **Editable SVG** or
   **Editable PNG**, or create an empty file with that name and open it.
2. **Draw and save.** <kbd>Ctrl</kbd>+<kbd>S</kbd> redraws the image and stores the drawing
   inside it.
3. **Edit later.** Click the file in the Explorer. The drawing opens exactly as you left it.

The SVG is the vector export. The PNG is the PNG export at 2×, on the drawing's background.

These files also open on the website (**Export / Save… → Load → Load from file**), and the
API writes them: ` Yappy.exportEditableImage('svg')` or ` Yappy.exportEditableImage('png')`.
` Yappy.openEditableImage(blob)` reads one back.

A plain SVG or PNG renamed to `.yappy.svg` / `.yappy.png` has no drawing inside. VS Code
shows an error and leaves the file alone; saving it would replace the image with your new
drawing.

## How it behaves

- **The file is the document.** The editor in VS Code does not use the website's autosave or
  **My Drawings** gallery. What you see is the file, and <kbd>Ctrl</kbd>+<kbd>S</kbd> writes it.
- **Unsaved changes survive a restart.** VS Code keeps a backup of an unsaved drawing and
  restores it the next time it opens. **File ▸ Revert File** goes back to what is on disk.
- **Undo and redo** (<kbd>Ctrl</kbd>+<kbd>Z</kbd>, <kbd>Ctrl</kbd>+<kbd>Y</kbd>) use the
  drawing's own history, as on the website.
- **Theme.** The editor opens in light or dark to match VS Code, and switches when you
  change the VS Code theme. You can still pick another theme in the editor; the next VS Code
  theme change takes over again. **Focus** mode is the exception: it stays until you leave it.
- **Exports.** PNG, SVG, PDF, PowerPoint and the other exports open VS Code's Save dialog,
  starting in the drawing's folder.
- **Offline.** The editor is bundled inside the extension. Online features (AI generation,
  image search, web fonts) still need a connection, and only reach out when you use them.
- **Same files everywhere.** A `.yappy` saved in VS Code opens on yappydraw.com and in the
  desktop app, and the other way round. Editable images open on yappydraw.com too; the
  desktop app does not read them yet.
- **Links to the website.** Pages that live only on the website, such as the **Learn**
  articles, open in your browser.

## Known limitations

- **One tab per drawing.** Opening the same file in a second editor group shows the existing
  tab.
- **Cloud storage** (Google Drive and similar) and the **My Drawings** gallery are website
  features. Keep drawings in your workspace instead.
