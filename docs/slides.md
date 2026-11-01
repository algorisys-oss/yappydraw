# Slides and Slide Master

The Slides system transforms YappyDraw into a powerful presentation engine. This guide explains how to manage slides and use the **Slide Master** feature to create professional, consistent decks.

## 1. Managing Slides
- **Add Slide**: Use the `+` button in the Slide Navigator (sidebar).
- **Reorder**: Drag and drop slide thumbnails in the sidebar.
- **Delete**: Right-click a thumbnail and select 'Delete'.
- **Presentation Mode**: Press `F5` or click 'Play Presentation' to enter fullscreen mode.
- **Interactive Tools**: During presentation, hover over the bottom of the screen to access the **Interaction Toolbox**:
    - **Pointer (Selection)**: Default mode. Click anywhere on the slide to advance to the next one.
    - **Laser Pointer**: Create transient highlights that fade away instantly.
    - **Ink Highlighter**: Draw red annotations that automatically disappear after 3 seconds.
    - **Eraser**: Manually remove any ink strokes you've added.

## 2. Slide Master
The Slide Master allows you to define common elements—like logos, footers, or watermarks—that appear automatically on **every slide** in your presentation.

### How to use the Slide Master:
1. Open the **Layer Panel**.
2. Create a new layer (e.g., named "Global Branding").
3. Right-click the layer and select **"Use as Slide Master"**.
4. A **Crown icon (👑)** will appear next to the layer name.
5. Any elements you place on this layer will now show up in the same position on every slide.

### Editing Master Elements
To edit or move master elements, ensure the Master Layer is **active** and **unlocked**. Changes made to master elements are reflected across the entire presentation instantly.

## 3. Dynamic Variables
Yappy supports dynamic text variables that update automatically as you navigate your presentation. These are especially useful when placed on a **Master Layer**.

### Available Variables:
- `${slideNumber}`: Displays the current slide index (starting at 1).
- `${totalSlides}`: Displays the total number of slides.
- `${date}`: Today's date in the reader's locale format.

Resolved by `utils/slide-fields.ts` everywhere a slide is drawn: canvas, thumbnails, recordings
and all exports. Exports also put Slide Master artwork on every page (`pagedScene` in
`utils/export.ts`); before bug #464 they drew it on its home page only, as the raw formula.

> [!NOTE]
> **Formula Syntax**: Any text box containing these variables **must start with an `=` sign** to be processed (e.g., `=Page ${slideNumber}`). Static text without the leading `=` will display as-is.
> 
> **Literal Equals Sign**: To show a literal `=` at the beginning of a line without triggering a formula, use a double equals sign: `==Your Text`. It will render as `=Your Text`.

### Example:
Create a text element on your Master Layer and type:
`=Page ${slideNumber} of ${totalSlides}`

In presentation mode, this will automatically render as:
- `Page 1 of 10`
- `Page 2 of 10`
- ...and so on.

## 4. Performance Optimization
Yappy uses **Spatial Culling** to ensure large decks remain fast. Continuous animations (like spins) on master elements or active slides are prioritized, while off-screen slides are efficiently ignored by the rendering engine.
