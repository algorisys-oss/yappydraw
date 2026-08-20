---
id: uml
name: UML
icon: "📐"
category: Diagrams
description: UML shapes for class, sequence, and state diagrams
seoTitle: "How to draw UML diagrams online — class, sequence and state"
seoDescription: "Draw UML class, sequence and state diagrams in the browser. Class boxes with attributes and methods, lifelines, messages, and every standard arrow head."
---

# UML Shapes

Create professional UML diagrams including class diagrams, use case diagrams, sequence diagrams, state machines, and component diagrams.

## Available UML Shapes

| Shape | Diagram Type | Purpose |
| --- | --- | --- |
| **Class Box** | Class Diagram | Represents a class with attributes and methods |
| **Interface** | Class Diagram | Interface definition |
| **Actor** | Use Case | External entity interacting with the system |
| **Use Case** | Use Case | A system function or feature |
| **Lifeline** | Sequence | Object's existence over time |
| **Activation Bar** | Sequence | Period of active processing |
| **State** | State Machine | A state in the state machine |
| **Component** | Component | A modular software component |
| **Package** | Package | Groups related elements |
| **Note** | All | Comments and annotations |

## How to (in the app)

### Place a UML shape

1. Open the **Architecture** toolbar group and choose the **UML** section (Class, Use Case, Sequence, State, Component, Deployment).
2. Click the shape you want (e.g. **Class Box**), then click or drag on the canvas to place and size it.
3. Double-click the shape to edit its text — for a class box, type the name, attributes and methods on separate lines.
4. Restyle fill, stroke and text from the **Properties** panel on the right; both *sketch* and *architectural* render styles are supported.

### Connect shapes with UML relationships

1. Pick the **Arrow** tool (<kbd>A</kbd>) and drag from one shape to another — hover an edge to snap to a connection point.
2. With the connector selected, choose the arrowhead / line style (open arrow, hollow triangle, filled/hollow diamond, dashed) from the Properties panel to express association, inheritance, composition, aggregation, dependency or implementation.
3. Double-click the connector to add cardinality or role labels (e.g. `1` … `0..*`).

:::tip Faster: generate from text
For a whole diagram at once, open the **Import Diagram** dialog and paste Mermaid (`classDiagram`, `sequenceDiagram`, `stateDiagram`) or native YSL — Yappy lays out the shapes and draws the correct UML arrowheads automatically. Everything stays editable on the canvas afterwards.
:::

## Class Diagrams

Model the static structure of a system showing classes, their attributes, methods, and relationships.

### Class Box Structure

```
┌─────────────────────┐
│     ClassName       │  ← Class name (bold)
├─────────────────────┤
│ - privateAttr: Type │  ← Attributes
│ + publicAttr: Type  │
├─────────────────────┤
│ + method(): RetType │  ← Methods
│ - helper(): void    │
└─────────────────────┘
```

### Visibility Modifiers

| Symbol | Visibility |
| --- | --- |
| **+** | Public |
| **-** | Private |
| **#** | Protected |
| **~** | Package |

### Relationships

When you import a Mermaid `classDiagram`, each relationship arrow renders with its proper UML arrowhead (not just a text label). The decoration lands on the correct end automatically — the hollow triangle on the base class, the diamond on the whole/aggregate, the open arrow on the target.

| Mermaid Syntax | Arrow Style | Relationship |
| --- | --- | --- |
| `A --> B` | Solid line, open arrow | Association |
| `A *-- B` | Solid line, filled diamond | Composition |
| `A o-- B` | Solid line, hollow diamond | Aggregation |
| `A ..> B` | Dashed line, open arrow | Dependency |
| `A <\|-- B` | Solid line, hollow triangle | Inheritance |
| `A <\|.. B` | Dashed line, hollow triangle | Implementation |

Reversed forms (`B --|> A`, `B --* A`, `B --o A`) and navigable composites/aggregates (`A *--> B`, `A o--> B`) are also recognised, and optional cardinality/role labels are preserved, e.g. `Subject "1" o-- "0..*" Observer : observers`.

## Use Case Diagrams

Show system functionality from a user's perspective. Identify actors and the use cases they interact with.

### Elements

- **Actor (stick figure)** - External entity (user, system)
- **Use Case (ellipse)** - System function
- **System boundary (rectangle)** - Scope of the system

### Relationships

- **Association** - Actor participates in use case
- **Include** - Use case includes another (dashed arrow)
- **Extend** - Optional extension of a use case
- **Generalization** - Inheritance between actors/use cases

## Sequence Diagrams

Show how objects interact over time through message passing.

### Elements

| Element | Description |
| --- | --- |
| **Lifeline** | Vertical dashed line showing object's existence |
| **Activation Bar** | Rectangle on lifeline showing active processing |
| **Message (solid arrow)** | Synchronous method call |
| **Response (dashed arrow)** | Return value |
| **Fragment** | Groups messages (loop, alt, opt) |

:::tip Reading Sequence Diagrams
Time flows from top to bottom. Messages between lifelines show the order of interactions between objects.
:::

### Generate from text (DSL)

The fastest way to build a complete sequence diagram is to describe it in the **Import Diagram** dialog (Mermaid `sequenceDiagram` syntax or native YSL). Yappy lays out lifelines, cascades the messages, and draws combined fragments, notes and activation bars automatically.

| Feature | Mermaid | YSL |
| --- | --- | --- |
| Participant / actor | `participant A as Alice` / `actor U as User` | `a [lifeline] "Alice"` / `u [actor] "User"` |
| Sync call (solid, filled head) | `A->>B: msg` | `a ->> b "msg"` |
| Reply (dashed) | `B-->>A: ok` | `b -->> a "ok"` |
| Async / lost | `A-)B` / `A-xB` | `a -> b` |
| Self message | `A->>A: think` | `a ->> a "think"` |
| Activation | `A->>+B` … `B-->>-A` | `activate b` … `deactivate b` |
| Loop / opt / break | `loop label` … `end` | `loop "label"` … `end` |
| Alternatives | `alt cond` … `else other` … `end` | `alt "cond"` … `else "other"` … `end` |
| Parallel | `par a` … `and b` … `end` | `par "a"` … `and "b"` … `end` |
| Note | `Note over A,B: text` | `note over a,b "text"` |
| Auto-number messages | `autonumber` | `autonumber` |

:::tip Known limitations
Lost-message (`-x`) arrows render with a normal arrowhead (no cross glyph yet), and nested activation bars on the same lifeline are staggered rather than precisely boxed. Generated diagrams are fully editable on the canvas afterwards — drag participants, edit message text, or restyle any element.
:::

## State Machine Diagrams

Model the dynamic behavior of an object through its states and transitions.

### Elements

- **Initial State** - Filled circle (start point)
- **State** - Rounded rectangle with state name
- **Transition** - Arrow with event/guard/action
- **Final State** - Circle with inner filled circle

### Transition Syntax

```
event [guard] / action

Examples:
- click [isEnabled] / doAction()
- timeout / retry()
- submit [isValid]
```

## Component Diagrams

Show the organization and dependencies among software components.

### Elements

- **Component** - Rectangle with component icon
- **Interface (provided)** - Lollipop symbol
- **Interface (required)** - Socket symbol
- **Port** - Small square on component edge

## Deployment Diagrams

Show how software is deployed onto hardware/runtime nodes and which artifacts run where. Find **Deployment Node** and **Artifact** in the **Architecture** toolbar group (UML Structure section), or via DSL with `[node]` / `[artifact]`.

| Element | Description |
| --- | --- |
| **Deployment Node** | 3-D box for a device, server or execution environment (label on the front face). |
| **Artifact** | Rectangle with a folded-corner document icon — a deployable file (e.g. `app.jar`, a binary, a script). |

Both render in sketch and architectural styles and accept full fill / stroke / text styling.

## UML Best Practices

- **Keep it simple** - Don't try to model everything
- **Use consistent notation** - Follow UML conventions
- **Label relationships** - Add multiplicities and roles
- **Group related elements** - Use packages for organization
- **Add notes** - Clarify complex parts with annotations

## Scripting (API)

UML shapes are created from the console via the global `window.Yappy` object using the generic `createElement(type, x, y, width, height, options)`, then connected with `createArrow`.

```
// Two classes with an inheritance relationship
const base = Yappy.createElement('umlClass', 200, 80, 180, 120, {
  containerText: 'Shape\\n- x: number\\n- y: number\\n+ area(): number',
});
const sub = Yappy.createElement('umlClass', 200, 260, 180, 120, {
  containerText: 'Circle\\n- r: number\\n+ area(): number',
});
// Sub -> Base (style the arrowhead as a hollow triangle in the panel)
Yappy.createArrow(290, 260, 290, 200);
```

UML `type` strings include: `umlClass`, `umlInterface`, `umlEnum`, `umlObject`, `umlActor`, `umlUseCase`, `umlLifeline`, `umlState`, `umlAction`, `umlHistory`, `umlComponent`, `umlPackage`, `umlNode`, `umlArtifact`, `umlPort`, `umlProvidedInterface`, `umlRequiredInterface`, `umlSignalSend`, `umlSignalReceive`, `umlFragment`, and `umlNote`.

:::tip
Update any shape later with `Yappy.updateElement(id, { containerText: '...', backgroundColor: '#f5f5ff' })`. For a full diagram from text, prefer the Import Diagram dialog (Mermaid / YSL) described above.
:::
