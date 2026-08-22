---
id: flowchart
name: Flowchart
icon: "📋"
category: Diagrams
description: Standard flowchart symbols for process flows
seoTitle: "How to make a flowchart online — free, no signup"
seoDescription: "Draw a flowchart in your browser with the standard symbols: process, decision, terminator, data and connectors. Free, no account, nothing uploaded."
---

# Flowchart Shapes

Standard flowchart symbols following ISO 5807 conventions. Create professional process flows, algorithms, and workflow diagrams.

## Standard Flowchart Symbols

| Symbol | Shape | Meaning |
| --- | --- | --- |
| **Process** | Rectangle | A processing step or action |
| **Decision** | Diamond | A yes/no question or branch point |
| **Start/End** | Circle/Oval | Beginning or termination point |
| **Data** | Parallelogram | Input/output of data |
| **Document** | Document shape | A printed document or report |
| **Database** | Cylinder | Data storage or database |
| **Predefined Process** | Rectangle with bars | A subroutine or function call |
| **Manual Operation** | Trapezoid | A manual/human process step |

## Process (Rectangle)

The most common flowchart symbol. Represents any processing step, action, or operation in a workflow.

### Best Practices

- Use verb phrases: "Calculate total", "Send email"
- Keep descriptions concise (2-5 words)
- One action per box
- Maintain consistent sizing

:::tip Tip
Use rounded rectangles for a softer, more modern appearance. Adjust the border radius in the properties panel.
:::

## Decision (Diamond)

Represents a point where the flow branches based on a condition. Always has at least two exit paths (Yes/No, True/False).

### Guidelines

- Frame as a yes/no question
- Label output paths clearly (Yes/No, True/False)
- "Yes" typically exits right or down
- "No" typically exits left or down

```
Example Decision Labels:
- "Is order valid?"
- "User authenticated?"
- "Amount > $1000?"
- "All items processed?"
```

## Database (Cylinder)

Represents data storage, typically a database system. The cylinder shape mimics traditional disk storage.

:::note
This is the flowchart **Database** symbol (type `database`) — a fixed drum with no 3D
controls. If you want a cylinder you can tilt or foreshorten (a pillar, a can, a tank),
use the **Cylinder** shape instead; see the **Geometric Shapes** help page.
:::

### Use Cases

- Database read/write operations
- Data warehouses
- File systems
- Cache storage

## Document

Represents a printed document, report, or form. The wavy bottom edge symbolizes a piece of paper.

### When to Use

- Reports being generated
- Forms being created or processed
- Printed output
- Paper documents in a workflow

## Predefined Process

A rectangle with vertical bars on the sides. Represents a subroutine, function call, or process defined elsewhere.

### Use For

- Function or method calls
- References to other flowcharts
- Reusable process blocks
- Library or API calls

## Flow Lines (Arrows)

Arrows connect shapes and show the direction of process flow.

### Arrow Conventions

| Style | Meaning |
| --- | --- |
| **Solid arrow** | Primary flow direction |
| **Dashed arrow** | Alternate or exception path |
| **Bidirectional** | Two-way data flow |

:::tip Best Practice
Maintain consistent flow direction: top-to-bottom for main flow, left-to-right for secondary paths. Avoid crossing lines when possible.
:::

## Layout Guidelines

- **Start at the top** - Begin with start symbol at top center
- **Flow downward** - Main process flows top to bottom
- **Align shapes** - Use grid snapping for clean alignment
- **Consistent sizing** - Keep similar shapes the same size
- **Minimize crossings** - Rearrange to avoid line crossings
- **Label decision branches** - Always label Yes/No paths

## Quick Access

:::shortcuts
R | Rectangle (Process)
D | Diamond (Decision)
O | Circle (Start/End)
A | Arrow (Flow line)
:::

## Scripting (API)

Flowchart symbols are plain shapes, so build them from the console via the global `window.Yappy` object with the generic `createElement(type, x, y, width, height, options)` and wire them up with `createArrow`.

```
// Start -> Process -> Decision
const start = Yappy.createElement('ellipse', 120, 40, 120, 50, { containerText: 'Start' });
const proc  = Yappy.createElement('rectangle', 120, 130, 120, 60, { containerText: 'Validate input' });
const dec   = Yappy.createElement('diamond', 110, 230, 140, 90, { containerText: 'Valid?' });

Yappy.createArrow(180, 90, 180, 130);   // Start -> Process
Yappy.createArrow(180, 190, 180, 230);  // Process -> Decision
```

Symbol → `type` string: **Process** = `rectangle`, **Decision** = `diamond`, **Start/End** = `ellipse` (or `circle`), **Data** = `parallelogram`, **Document** = `document`, **Database** = `cylinder`, **Predefined Process** = `predefinedProcess`, **Manual Operation** = `trapezoid`.

:::tip
Pass a label as `containerText`, and restyle any shape afterwards with `Yappy.updateElement(id, { backgroundColor: '#eef', strokeColor: '#334' })`.
:::
