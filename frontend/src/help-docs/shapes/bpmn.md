---
id: bpmn
name: BPMN
icon: "🔀"
category: Diagrams
description: BPMN 2.0 events, gateways, tasks, artifacts, and swimlanes for business process diagrams
keywords: bpmn business process model notation 2.0 event gateway task activity pool lane swimlane sequence flow message flow exclusive parallel inclusive event-based gateway start end intermediate boundary timer error signal escalation compensation conditional link terminate multiple user task service task script task manual task business rule receive send loop multi-instance sequential parallel marker data object data store text annotation group subprocess call activity transaction ad-hoc
seoTitle: "How to draw a BPMN diagram online — free BPMN 2.0 shapes"
seoDescription: "Model a business process with BPMN 2.0 notation: events, gateways, tasks, pools and lanes, sequence and message flows. Free and in the browser."
---

# BPMN 2.0 Shapes

Create standardized business process diagrams using BPMN 2.0 notation. Model workflows, orchestrations, and process flows with 15 dedicated shapes covering events, gateways, activities, artifacts, and swimlanes.

## Available BPMN Shapes (15)

### Events

| Shape | Symbol | Description |
| --- | --- | --- |
| **Start Event** | Thin circle | Entry point that triggers a process |
| **End Event** | Thick circle (3x stroke) | Termination point where a process ends |
| **Intermediate Event** | Double concentric circles | Event occurring between start and end (catching or throwing) |

### Gateways

| Shape | Symbol | Description |
| --- | --- | --- |
| **Exclusive (XOR)** | Diamond with X | Routes flow to exactly one outgoing path based on conditions |
| **Parallel (AND)** | Diamond with + | Splits flow into all outgoing paths simultaneously |
| **Inclusive (OR)** | Diamond with O | Routes flow to one or more outgoing paths based on conditions |
| **Event-based** | Diamond with double circle + pentagon | Routes based on which event occurs first (not data conditions) |

### Activities

| Shape | Symbol | Description |
| --- | --- | --- |
| **Task** | Rounded rectangle | An atomic unit of work within a process |
| **Sub-Process** | Rounded rectangle with [+] marker | A compound activity containing a nested process |
| **Call Activity** | Rounded rectangle (bold border 2.5x) | Invokes a globally defined process or task |

### Artifacts & Swimlanes

| Shape | Symbol | Description |
| --- | --- | --- |
| **Data Object** | Document with folded corner | Represents data required or produced by an activity |
| **Data Store** | Cylinder | Persistent data repository (database) |
| **Annotation** | Open bracket with text | Adds explanatory notes or comments to the diagram |
| **Group** | Dashed rounded rectangle | Visual grouping of elements for documentation purposes |
| **Pool / Lane** | Horizontal banded container | Organizes activities by participant or role (supports up to 6 lanes) |

## Event Type Icons (11 types)

Events can be further classified by the icon displayed inside the circle. Select an event shape and use the **Event Type** dropdown in the property panel.

| Type | Icon | Description |
| --- | --- | --- |
| **None** | Empty | Generic event with no specific trigger |
| **Message** | Envelope | Triggered by or sends a message |
| **Timer** | Clock | Triggered by a time condition or cycle |
| **Error** | Zigzag (lightning bolt) | Catches or throws an error |
| **Signal** | Triangle | Broadcasts or receives a signal across processes |
| **Conditional** | Page with lines | Triggered when a business condition becomes true |
| **Escalation** | Upward chevron | Escalation raised or caught within a process |
| **Compensation** | Double rewind triangles | Compensation triggered for rollback |
| **Link** | Right-pointing pentagon | Off-page connector (catch/throw pair) |
| **Terminate** | Filled circle | Immediately terminates the entire process |
| **Cancel** | X mark | Transaction cancellation |

:::tip Tip: Catching vs Throwing
Catching events have unfilled icons (waiting for a trigger). Throwing events have filled icons (producing a trigger). Use the **Fill Icon** toggle to switch between catching and throwing. Start events are always catching; end events are always throwing.
:::

## Non-Interrupting Events

Start and Intermediate events support a **Non-Interrupting** mode (toggle in property panel). When enabled, the event border becomes dashed, indicating the event doesn't stop the enclosing activity.

Common use: boundary events on sub-processes that trigger parallel paths without interrupting the main flow.

## Task Type Markers (8 types)

Tasks display a small icon in the upper-left corner to indicate how the work is performed. Select a task and use the **Task Type** dropdown.

| Type | Marker | Description |
| --- | --- | --- |
| **None** | No marker | Abstract task with no specific type |
| **User** | Person | Performed by a human with system assistance |
| **Service** | Gears | Automated task executed by a service or application |
| **Script** | Scroll | Executed by a business process engine script |
| **Manual** | Hand | Performed by a human without system assistance |
| **Send** | Filled arrow | Sends a message to an external participant |
| **Receive** | Envelope | Waits for a message from an external participant |
| **Business Rule** | Table/grid | Evaluates a business rule (DMN decision table) |

## Loop/Multi-Instance Markers (5 types)

Activities can display a bottom-center marker to indicate repetition or parallel execution. Select an activity and use the **Loop / Multi-Instance** dropdown.

| Type | Marker | Description |
| --- | --- | --- |
| **None** | No marker | Activity executes once |
| **Standard Loop** | Circular arrow | Repeats until a condition is met (like a while loop) |
| **Parallel Multi-Instance** | Three vertical bars | Multiple instances execute simultaneously |
| **Sequential Multi-Instance** | Three horizontal bars | Multiple instances execute one after another |
| **Compensation** | Double rewind triangles | Compensation handler activity for rollback |

## Icon Customization

All BPMN markers and icons can be fine-tuned via the property panel:

| Property | Type | Description |
| --- | --- | --- |
| **Icon Scale** | Slider (0.5 - 2.0) | Scale factor for all markers and icons within the shape |
| **Icon Color** | Color picker | Override icon color independently of shape stroke color |
| **Fill Icon** | Toggle | Fill event/gateway icons instead of outline only (catching vs throwing) |

## Pool Lanes

Pools support up to **6 horizontal lanes** via the **Lane Count** slider in the property panel. Each lane represents a role or department within a participant. The left panel displays the pool label (rotated text).

## Sequence Flows

BPMN uses different connection types to represent various relationships between elements. Use arrows and connectors with different styles:

| Flow Type | Style | Meaning |
| --- | --- | --- |
| **Sequence Flow** | Solid arrow | Order of activities within a process |
| **Message Flow** | Dashed arrow (open circle to open arrowhead) | Communication between participants (across pools) |
| **Association** | Dotted line | Links artifacts (data objects, annotations) to elements |

## Common BPMN Patterns

### Simple Sequential Process

```
(Start) --> [Task A] --> [Task B] --> [Task C] --> (End)
```

### Exclusive Decision

```
                      --> [Approve] -->
(Start) --> <XOR> --+                    +--> (End)
                      --> [Reject]  -->
```

### Parallel Split and Join

```
                      --> [Task A] -->
(Start) --> <AND> --+                    +-- <AND> --> (End)
                      --> [Task B] -->
```

### Error Boundary Event

```
(Start) --> [ Service Task ] --> (End)
                  |
            (Error Event) --> [Handle Error] --> (Error End)
```

### Timer-based Escalation

```
(Start) --> [ Review Task ] --> (End)
                  |
            (Timer, non-interrupting) --> [Send Reminder]
```

## Best Practices

- **Name activities with verb-noun** - "Review Order", "Send Invoice"
- **Label all gateway branches** - Indicate the condition for each path
- **Use pools and lanes** - Clearly separate responsibilities by role
- **Match gateway pairs** - Every split gateway should have a corresponding join
- **Keep processes on one level** - Use sub-processes to hide complexity
- **Flow left to right** - Maintain consistent direction for readability
- **Use event-based gateways** - When routing depends on external events, not data
- **Group related elements** - Use the Group shape to visually organize related tasks

## Quick Access

:::shortcuts
O | Circle (Event)
D | Diamond (Gateway)
R | Rectangle (Task/Activity)
A | Arrow (Sequence Flow)
:::

## Scripting (API)

Every BPMN shape can be created from the browser console (or a script) via the global `window.Yappy` object. Use the dedicated `createBpmnShape` helper (it applies a sensible default size per shape) or the generic `createElement`.

```
// Build a tiny process: Start -> Task -> End
const start = Yappy.createBpmnShape('bpmnStartEvent', 100, 200);
const task  = Yappy.createBpmnShape('bpmnTask', 200, 190, 120, 80, { containerText: 'Review Order' });
const end   = Yappy.createBpmnShape('bpmnEndEvent', 380, 200);

// Connect them with sequence-flow arrows
Yappy.createArrow(150, 225, 200, 230);
Yappy.createArrow(320, 230, 380, 225);
```

Shape `type` strings: `bpmnStartEvent`, `bpmnEndEvent`, `bpmnIntermediateEvent`, `bpmnExclusiveGateway`, `bpmnParallelGateway`, `bpmnInclusiveGateway`, `bpmnEventGateway`, `bpmnTask`, `bpmnSubProcess`, `bpmnCallActivity`, `bpmnDataObject`, `bpmnDataStore`, `bpmnAnnotation`, `bpmnGroup`, `bpmnPool`.

### Setting event / task / loop markers

The property-panel dropdowns map to element attributes you can set with `updateElement`:

```
// A timer intermediate event + a user task with a parallel multi-instance marker
const timer = Yappy.createBpmnShape('bpmnIntermediateEvent', 200, 300);
Yappy.updateElement(timer, { bpmnEventType: 'timer' });

const t = Yappy.createBpmnShape('bpmnTask', 300, 290, 120, 80);
Yappy.updateElement(t, { bpmnTaskType: 'user', bpmnLoopType: 'parallel' });
```

| Attribute | Accepted values |
| --- | --- |
| `bpmnEventType` | none, message, timer, error, signal, conditional, escalation, compensation, link, terminate, cancel |
| `bpmnTaskType` | none, user, service, script, manual, send, receive, businessRule |
| `bpmnLoopType` | none, standard, parallel, sequential, compensation |
