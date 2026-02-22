# YappyDSL Examples (.ysl)

This folder contains example YSL (Yappy Scripting Language) files demonstrating various use cases of the YappyDraw DSL format.

## How to Use

1. Open YappyDraw
2. Click **Menu > Import from Text** (or press `Ctrl+Shift+I`)
3. Copy and paste any example into the dialog
4. Click **Import Diagram**

The import dialog also supports **Mermaid** flowcharts — just paste a `graph TD` / `flowchart LR` block directly.

## Examples

| File | Description | Layout |
|------|-------------|--------|
| `01-simple-flowchart.ysl` | Basic login flow | tree-down |
| `02-flowchart-left-right.ysl` | Horizontal order flow | tree-right |
| `03-mindmap.ysl` | Indentation-based mindmap | tree-right |
| `04-infrastructure-diagram.ysl` | Cloud architecture | tree-down |
| `05-bpmn-process.ysl` | BPMN process flow | tree-right |
| `06-bpmn-with-pools.ysl` | BPMN with swimlanes | tree-right |
| `07-uml-class-diagram.ysl` | UML class relationships | tree-down |
| `08-sequence-diagram.ysl` | API sequence diagram | sequence |
| `09-data-structures.ysl` | Data structure shapes | grid |
| `10-styled-flowchart.ysl` | Custom colors and styles | tree-down |
| `11-radial-layout.ysl` | Radial topic map | radial |
| `12-bezier-and-elbow-edges.ysl` | Edge type demo | tree-down |
| `13-json-format.json` | JSON format example | tree-down |
| `14-decision-tree.ysl` | Database decision tree | tree-down |
| `15-bottom-up-tree.ysl` | Bottom-up org chart | tree-up |
| `16-shapes-showcase.ysl` | All shape types | grid |

## YSL Text Syntax

```
---
title: My Diagram
layout: tree-down
---

# Comments start with #

nodeId [shape] "Label" { style }
fromId -> toId "Edge Label"
```

### Edge Types
- `->` Arrow (straight)
- `--` Line (no arrowhead)
- `~>` Bezier curve arrow
- `=>` Elbow connector arrow

### Layout Strategies
`tree-down`, `tree-up`, `tree-right`, `tree-left`, `grid`, `sequence`, `radial`, `manual`

### Mermaid Support
The import dialog auto-detects Mermaid syntax:
```
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Error]
```
