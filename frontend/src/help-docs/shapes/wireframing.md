---
id: wireframing
name: Wireframing
icon: "📱"
category: Design
description: UI mockup elements for web and mobile design
seoTitle: "How to wireframe a website or app — free wireframe tool"
seoDescription: "Sketch screens with wireframe components: buttons, input fields, dropdowns, checkboxes, phones and browser frames. Free, in the browser."
---

# Wireframing

Create UI mockups, wireframes, and prototype layouts with specialized elements for web and mobile interfaces.

## How to (in the app)

1. Open the **Wireframe / UI** group in the shape toolbar (device frames, buttons, inputs, cards, nav bars, and more).
2. Click a component, then click or drag on the canvas to place and size it. Start with a **Browser Window** or **Mobile Phone** frame, then drop UI elements inside it.
3. Double-click a button, input or card to edit its label text.
4. Use the **Properties** panel to adjust fill, stroke, corner radius and roughness — bump roughness up for a low-fidelity "sketch" feel, or switch to the architectural style for crisp mockups.
5. Hold <kbd>Alt</kbd> and drag to duplicate a component, and use grid snapping to keep rows and columns aligned.
6. Connect screens with the **Arrow** tool (<kbd>A</kbd>) to sketch a user flow, labelling each arrow with the triggering action.

:::tip Tip
Group a completed screen (<kbd>Ctrl</kbd>+<kbd>G</kbd>) so you can move and duplicate the whole layout as one unit.
:::

## Device Containers

| Element | Description |
| --- | --- |
| **Browser Window** | Desktop browser frame with address bar |
| **Mobile Phone** | Smartphone frame with notch and home indicator |

:::tip Tip: Responsive Design
Create multiple wireframes at different breakpoints using browser windows of varying widths (mobile, tablet, desktop).
:::

## UI Components

### Buttons

| Type | Description |
| --- | --- |
| **Solid Button** | Filled button for primary actions |
| **Ghost Button** | Outline-only button for secondary actions |
| **Capsule** | Pill-shaped button or tag |

### Form Elements

| Element | Description |
| --- | --- |
| **Input Field** | Text input box with placeholder line |
| **Checkbox** | Checkable option (empty or checked) |

## Building Wireframes

### Basic Layout

```
┌────────────────────────────────────┐
│  Logo    Nav    Nav    Nav   [CTA] │  ← Header
├────────────────────────────────────┤
│                                    │
│         Hero Section               │  ← Main content
│    [Primary Button]                │
│                                    │
├────────────────────────────────────┤
│  Card  │  Card  │  Card            │  ← Grid layout
├────────────────────────────────────┤
│  Footer links                      │  ← Footer
└────────────────────────────────────┘
```

### Common Patterns

- **Card layout** - Grid of rounded rectangles
- **Navigation** - Horizontal row of text elements
- **Sidebar** - Vertical list with icons and labels
- **Modal** - Centered rectangle with backdrop
- **Form** - Stacked input fields with labels

## Placeholder Content

Use these techniques to indicate content without designing it:

### Images

- Rectangle with diagonal cross lines
- Gray rectangle with image icon
- Placeholder text: "[Image]" or "[Hero Image]"

### Text

- Gray horizontal lines for paragraph text
- Actual lorem ipsum for realistic feel
- Wavy lines (~~~~~) for abstract text blocks

### Icons

- Small circles or squares as icon placeholders
- Simple geometric shapes

## Annotating Wireframes

Add context and specifications to your wireframes:

### Annotation Styles

- **Callouts** - Speech bubbles pointing to elements
- **Numbered badges** - Reference numbers for spec documents
- **Sticky notes** - Design notes and questions
- **Arrows** - Show user flow between screens

:::tip Annotation Best Practices
Use a consistent color (blue or red) for all annotations to distinguish them from the actual UI design.
:::

## User Flows

Connect wireframe screens to show user journeys:

1. Create wireframes for each screen state
2. Arrange screens in logical flow order
3. Connect with arrows showing navigation paths
4. Label arrows with actions ("Click CTA", "Submit form")
5. Use different arrow styles for success/error paths

## Mobile Wireframing

### Mobile-Specific Patterns

- **Bottom navigation** - Tab bar with icons
- **Pull to refresh** - Indicator at top
- **Swipe gestures** - Show with arrows
- **Bottom sheets** - Partial overlays from bottom
- **Floating action button** - Circle in corner

### Touch Targets

Remember to size interactive elements appropriately:

- Minimum 44×44 points for iOS
- Minimum 48×48 dp for Android
- Adequate spacing between tap targets

## Wireframing Tips

- **Start low-fidelity** - Focus on layout, not details
- **Use grayscale** - Avoid color decisions early
- **Keep it rough** - Higher roughness = more "sketch" feel
- **Iterate quickly** - Wireframes should be fast to change
- **Test with users** - Validate layouts before high-fidelity

## Scripting (API)

Wireframe elements can be scripted from the console via the global `window.Yappy` object. There are convenience helpers plus the generic `createUIComponent(type, x, y, width?, height?, options?)`, which applies each component's default size.

```
// A browser frame with a primary button and an input inside it
Yappy.createBrowserWindow(80, 80, 480, 320);
Yappy.createSolidButton(120, 260, 'Sign up');
Yappy.createUIComponent('inputField', 120, 180, 300, 40, { containerText: 'Email' });
Yappy.createUIComponent('checkbox', 120, 230);
```

Component `type` strings include: `browserWindow`, `mobilePhone`, `solidButton`, `ghostButton`, `capsule`, `inputField`, `checkbox`, `checkboxChecked`, `radioButton`, `toggleSwitch`, `slider`, `dropdown`, `avatar`, `card`, and `navbar`.

:::tip
Convenience helpers: `createBrowserWindow(x, y, w, h)`, `createSolidButton(x, y, label)`, `createDropdown(x, y, label)`, and `createCard(x, y, w, h)`. Set labels with `containerText` and restyle later via `Yappy.updateElement(id, {...})`.
:::
