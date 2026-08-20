---
id: sketchnote
name: Sketchnote
icon: "🎨"
category: Design
description: Visual vocabulary for sketchnoting and visual thinking
seoTitle: "How to make sketchnotes online — banners, arrows and doodles"
seoDescription: "Sketchnote in the browser: hand-drawn banners, ribbons, arrows, containers and figures, in a style that stays readable at any zoom."
---

# Sketchnote Shapes

A visual vocabulary for sketchnoting, visual thinking, and creating engaging illustrated notes. Transform ideas into memorable visuals.

## Adding Sketchnote Shapes

The sketchnote vocabulary lives in the **Sketchnote & People** group on the toolbar (icons, faces, people, containers, dividers and markers). Drop them onto the canvas like any other shape:

1. Open the **Sketchnote & People** group in the toolbar, or press <kbd>/</kbd> to open the command palette and search by name (e.g. "lightbulb", "thumbs up", "wavy divider").
2. Pick a shape, then click once on the canvas to drop it at a default size, or click-drag to size it while placing.
3. Double-click a container shape (sticky note, scroll, banner, speech bubble) to type a label inside it.
4. Use the **Properties** panel to set stroke and fill colour, and increase **Roughness** for a loose, hand-drawn look.
5. Switch the drawing style to **Sketch** for the classic sketchnote feel, or **Architectural** for clean lines — every shape renders in both.

:::tip Tip: Search beats scrolling
There are dozens of sketchnote icons. The quickest way to place one is the command palette (<kbd>/</kbd>) — type the name and press <kbd>Enter</kbd>.
:::

## Icons & Symbols

| Shape | Meaning | Use For |
| --- | --- | --- |
| **Lightbulb** | Idea, insight | Key insights, "aha" moments |
| **Target** | Goal, focus | Objectives, main points |
| **Rocket** | Launch, growth | Startups, new initiatives |
| **Flag** | Milestone, marker | Achievements, checkpoints |
| **Trophy** | Success, win | Accomplishments, goals met |
| **Key** | Important, unlock | Key takeaways, solutions |
| **Gear** | Process, work | Systems, mechanics |
| **Clock** | Time, schedule | Deadlines, timing |
| **Magnifying Glass** | Search, analyze | Research, deep dives |
| **Book** | Knowledge, learning | Education, resources |
| **Megaphone** | Announce, communicate | Important messages, marketing |
| **Eye** | Vision, observe | Perspective, watchfulness |

## People & Expressions

| Shape | Description |
| --- | --- |
| **Star Person** | Simple character for representing people |
| **Stick Figure** | Basic human figure |
| **Sitting Person** | Person in seated position |
| **Presenting Person** | Person gesturing/presenting |
| **Hand Pointing** | Directional indicator |
| **Thumbs Up** | Approval, agreement |

### Emotion Faces

| Face | Use For |
| --- | --- |
| **Happy Face** | Positive outcomes, success |
| **Sad Face** | Problems, pain points |
| **Confused Face** | Questions, complexity |

## Containers & Frames

| Shape | Best For |
| --- | --- |
| **Sticky Note** | Quick ideas, reminders |
| **Scroll** | Lists, step-by-step content |
| **Ribbon** | Titles, headers, banners |
| **Double Banner** | Important titles, emphasis |
| **Speech Bubble** | Quotes, dialogue |
| **Thought Bubble** | Internal thoughts, ideas |
| **Callout** | Annotations, callouts |
| **Cloud** | Dreamy ideas, cloud topics |
| **Burst** | Emphasis, "POW!" moments |

## Status & Markers

| Shape | Use For |
| --- | --- |
| **Checkbox (empty)** | To-do items, action items |
| **Checkbox (checked)** | Completed items |
| **Numbered Badge** | Step numbers, priorities |
| **Question Mark** | Questions, unknowns |
| **Exclamation Mark** | Important, warnings |
| **Pin** | Location, pinned items |
| **Tag** | Labels, categories |
| **Checkmark** | Done, correct, approved |

## Growth & Connection

| Shape | Meaning |
| --- | --- |
| **Seedling** | Growth, beginning, potential |
| **Tree** | Hierarchy, branching, organic growth |
| **Mountain** | Challenge, peak, achievement |
| **Bridge** | Connection, transition |
| **Puzzle Piece** | Part of whole, fitting together |
| **Chain Link** | Connection, dependency |
| **Scale** | Balance, comparison |
| **Funnel** | Process, filtering, conversion |

## Dividers & Separators

- **Wavy Divider** - Organic section separator
- **Dashed Line** - Subtle separation
- **Arrow Trail** - Directional flow between sections

:::tip Visual Hierarchy
Use dividers to create visual breathing room between different topics or sections of your sketchnotes.
:::

## Sketchnoting Tips

### Start Simple

- Begin with basic shapes (circles, squares, triangles)
- Add simple icons to convey meaning
- Use containers to group related ideas

### Create Visual Hierarchy

- **Size** - Bigger = more important
- **Color** - Use accent colors for key points
- **Position** - Top/center for main ideas
- **Containers** - Frame important content

### Connect Ideas

- Use arrows to show relationships
- Group related items visually
- Create flow with directional elements

### Add Personality

- Include people and faces
- Use hand-drawn style (increase roughness)
- Add small decorative elements

## Layout Patterns

- **Linear** - Top to bottom, like a list
- **Radial** - Central topic with branches
- **Path** - Follow a journey or timeline
- **Modular** - Grid of related sections
- **Popcorn** - Scattered, organic placement

## Scripting (API)

Sketchnote shapes are ordinary Yappy elements, so you can generate a whole visual note from code. The API is exposed on the global `window.Yappy` object. Use `Yappy.createElement(type, x, y, width, height, options)` with a sketchnote **type** string, then adjust it with `Yappy.updateElement(id, { ... })`.

### Element Types

| Category | Type strings |
| --- | --- |
| Icons | `'lightbulb'`, `'target'`, `'rocket'`, `'flag'`, `'trophy'`, `'key'`, `'gear'`, `'clock'`, `'magnifyingGlass'`, `'book'`, `'megaphone'`, `'eye'`, `'signpost'`, `'burstBlob'` |
| People & faces | `'starPerson'`, `'stickFigure'`, `'sittingPerson'`, `'presentingPerson'`, `'handPointRight'`, `'thumbsUp'`, `'faceHappy'`, `'faceSad'`, `'faceConfused'` |
| Containers | `'scroll'`, `'ribbon'`, `'doubleBanner'`, `'speechBubble'`, `'thoughtBubble'`, `'callout'`, `'cloud'`, `'burst'`, `'stickyNote'` |
| Markers & status | `'checkbox'`, `'checkboxChecked'`, `'numberedBadge'`, `'questionMark'`, `'exclamationMark'`, `'pin'`, `'tag'`, `'stamp'`, `'wavyDivider'` |
| Growth & connection | `'seedling'`, `'tree'`, `'mountain'`, `'bridge'`, `'puzzlePiece'`, `'chainLink'`, `'scale'`, `'funnel'` |

### Compose a Sketchnote

```
// window.Yappy is the global scripting entry point.

// A key insight, called out with a lightbulb and a banner label
const idea = Yappy.createElement('lightbulb', 120, 120, 80, 100, {
    strokeColor: '#f59e0b',
    roughness: 2               // loose, hand-drawn line
});

const banner = Yappy.createElement('doubleBanner', 240, 130, 220, 60, {
    containerText: 'Big Idea', // label rendered inside the container
    strokeColor: '#1e293b'
});

// A to-do marker and a happy face for a positive outcome
Yappy.createElement('checkbox', 120, 280, 40, 40);
Yappy.createElement('faceHappy', 200, 275, 50, 50, {
    strokeColor: '#16a34a'
});

// Show a relationship between two ideas
Yappy.connect(idea, banner, { type: 'arrow' });
```

### Restyle a Shape Later

```
// Give the banner a solid fill and a new label
Yappy.updateElement(banner, {
    backgroundColor: '#fef3c7',
    fillStyle: 'solid',
    containerText: 'Key Takeaway'
});
```

:::tip Tip: Turn up the roughness
Pass `roughness: 2` (or higher) in the options to get the loose, sketchy line quality that makes sketchnotes feel hand-drawn. Container shapes accept `containerText` to place a label inside them.
:::
