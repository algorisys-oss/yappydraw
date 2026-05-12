# 3D Concept Diagram Shape Skill

Use this skill to create educational diagrams in the **3D conceptual visualization style** shown in the reference diagrams. The subject can be anything: programming, AI agents, workflow engines, CRM, payroll, operating systems, databases, queues, memory, or business processes.

The goal is to turn invisible concepts into **physical-looking objects** placed inside a system: rooms, shelves, blocks, clouds, queues, notes, arrows, and value cubes.

---

## 1. Core Visual Philosophy

Create diagrams that look like a **technical concept workshop**.

Abstract ideas should feel like objects that can be touched, moved, stored, passed, queued, or connected.

Instead of a normal flat architecture diagram, use:

- large 3D containers
- layered compartments
- stacked cuboids
- key-value tables
- small value cubes
- cloud labels
- folded paper notes
- queues as stacked cards/envelopes
- arrows for movement
- dashed/dotted arrows for hidden or async flow
- a light blue/grey floor plane

The diagram should answer:

1. Where does each thing live?
2. What does it contain?
3. What moves from one place to another?
4. What waits in a queue?
5. What happens first, next, and later?
6. Which parts are direct, async, hidden, shared, safe, unsafe, local, global, public, or private?

---

## 2. Shape Dictionary

Use a consistent visual vocabulary. Do not randomly change shape meaning between diagrams.

| Shape | Meaning | Use For |
|---|---|---|
| Large 3D box / room | System boundary | browser, runtime, server, AI agent system, CRM, workflow engine |
| Horizontal layer | Responsibility zone | UI layer, business layer, memory zone, data layer |
| 3D cuboid | Component or object | planner, reasoner, task, lead, employee, module, service |
| Stacked cuboid | Multi-part object | class, object, memory frame, API route, data record |
| Small cube | Concrete value | number, ID, status, address, score, amount |
| Key-value table block | Structured data | JSON, object, dictionary, config, memory store, database row |
| Cloud | Abstract concept or external system | memory, heap, stack, rules engine, LLM, API, policy |
| Folded paper note | Code, rule, instruction, function | handler, formula, prompt, SQL, validation rule |
| Envelope/card stack | Queue or pending work | task queue, email queue, event queue, RabbitMQ, async jobs |
| Numbered circle | Sequence step | step 1, step 2, step 3 |
| Solid arrow | Direct flow/reference | request, pointer, call, transfer |
| Dashed arrow | Async/later/indirect flow | callback, event loop, tool result, retry |
| Dotted arrow | Hidden/internal lookup | prototype lookup, memory read, policy check |
| Thick arrow | Main journey | user request, process pipeline, deployment flow |
| Colored tag | Quick label | local, global, private, router, port, status |
| Blue/grey floor plane | Spatial base | gives physical concept-map feeling |
| **Spine-labeled object cube** | A named object with structured fields | class instance, lead, employee, person, customer, caretaker, adapter |
| **Stacked sub-cubes inside a parent** | A list/collection owned by a parent | array property, child items, modification history |
| **Layered cabinet** | Multi-floor runtime/process map | JS engine (engine/global/heap/stack), C process map (code/data/heap/stack) |
| **Side cloud tag on a layer** | Names a layer or region from outside | "Heap", "Stack", "Global Area", "RAM", "JavaScript Engine" |
| **Torn / wavy banner** | Title or emphasis label | slide title ("Memento", "Adapter", "Functional Programming"), warning callouts |
| **Torn-paper class card** | Class declaration / module | `class ContactApp`, `class AddressBook`, library files |
| **Code panel (red border)** | Imperative / problematic / "before" code | nested loops, switch ladders, mutation |
| **Code panel (green border)** | Functional / good / "after" code | reduce/map, declarative pipeline, refactor target |
| **Inline red numbered circle** | Step marker placed *on* the artifact | step ① on the dictionary, step ② next to the function note |
| **Open-circle arrow origin** | Implements / binds-to / uses-interface | adapter → interface, class → contract |
| **Red X over an arrow** | Blocked / cannot happen / type mismatch | "Object does not implement method" |
| **Annotation bracket** with byte/size label | Concrete dimension of an object in memory | `← 4 →` under an int cube, `← 8 →` under a long cube |
| **Rule capsule** | Side note stating a constraint/invariant | "short ≤ int ≤ long", "Float is IEEE 754" |
| **Person figure** (stick or silhouette) | A role / actor invoking the system | Client Code, Caller, User, Notifier |
| **Disk cylinder + DISK cloud** | Persistent storage | database, file on disk, executable on disk |
| **Stack-frame strip** | A sequence of stack frames laid out left→right | function call frames with locals/params/return |
| **Mini-cube with literal text** | A concrete value living in a slot | `5`, `7`, `"Brendan"`, `"approved"` |
| **Branding chip** at corner | Channel / author attribution | `t.me/svworkshops`, "© Author 2026" |

---

## 3. Color Semantics

Use soft pastel colors with mild gradients.

| Color | Meaning |
|---|---|
| Green | concept, memory, safety, success, knowledge, stable process |
| Blue | system, runtime, object, stack, infrastructure, user-facing component |
| Yellow | function, action, queue, label, important step |
| Orange | event, trigger, async action, message |
| Red / Pink | warning, error, unsafe, mutation, tool execution, risk |
| Grey | neutral infrastructure, boundary, platform, base system |
| Purple | orchestration, reasoning loop, coordination |
| White | data/value area, code area, empty storage |

Keep colors consistent inside a diagram.

Example:

- Planner = yellow
- Reasoner = blue
- Memory = green
- Tool execution = red/pink
- Goal monitor = yellow/green
- Runtime/orchestration = purple

### Spine-color semantics (for spine-labeled object cubes)

When an object is rendered with a vertical colored "spine" on its left face, the spine color carries the same role meaning, but applied to *that specific role of the object*:

| Spine | Meaning |
|---|---|
| Green spine | The object whose state we are reading / the "good" / current actor (Object, Person, Employee) |
| Red / pink spine | The object whose private state is unsafe / immutable / "do not touch" (`private data`, prototype, Caretaker in Memento) |
| Blue spine | A neutral system / runtime object (eich, Function, Object root, Web Server) |
| Orange spine | A cross-cutting / adapting / interface-bridging object (Adapter, AddressBook, Object C) |
| Yellow spine | A factory / creator / route handler |
| Pink spine | A coordinator role (Caretaker, Mediator) |

This pattern lets the reader decode the role of an object **before** reading its name — the color carries half the meaning.

---


### Recommended Hex Palette

Use these hex values as a starting palette. Adjust only slightly when you need darker borders, lighter fills, or better contrast.

| Role | Fill Hex | Border Hex | Text Hex | Notes |
|---|---:|---:|---:|---|
| Main background | `#F7F8F5` | `#D9DED8` | `#1F2933` | warm off-white canvas |
| Floor/base plane | `#DCEFF7` | `#4E9BB5` | `#1F2933` | light blue spatial floor |
| Main 3D container front | `#F4F4F1` | `#5B6470` | `#1F2933` | large system boundary |
| Main 3D container top/side | `#F6DCDD` | `#5B6470` | `#1F2933` | soft pink 3D depth face |
| Green concept block | `#B9DFA7` | `#6BA368` | `#1F2933` | memory, success, stable concepts |
| Light green table | `#EAF6E4` | `#79A96F` | `#1F2933` | memory store, knowledge store |
| Blue system block | `#B8D2EC` | `#5F86B3` | `#1F2933` | runtime, object, infrastructure |
| Light blue object/table | `#DDEBF7` | `#6E9AC8` | `#1F2933` | objects, structured records |
| Yellow action block | `#F7E6A6` | `#C49A24` | `#1F2933` | planner, actions, labels |
| Orange event block | `#F4B24D` | `#C87515` | `#1F2933` | triggers, messages, event loop |
| Red/pink execution block | `#F2B6B6` | `#C95757` | `#1F2933` | risk, mutation, tool execution |
| Purple orchestration block | `#D8C5F0` | `#8A67B8` | `#1F2933` | agent loop, coordinator, router |
| Grey infra block | `#E3E5E8` | `#7B838C` | `#1F2933` | OS, platform, neutral boundary |
| White data/code block | `#FFFFFF` | `#9AA3AD` | `#1F2933` | code notes, empty data area |
| Cloud blue | `#BFD7F0` | `#6E95BF` | `#1F2933` | external system, runtime concept |
| Cloud green | `#BFE3AD` | `#78A96C` | `#1F2933` | abstract safe concept |
| Cloud red | `#F0B9B9` | `#C76363` | `#1F2933` | warning, LLM/risk/unsafe concept |
| Label/tag yellow | `#F7C948` | `#B88A00` | `#1F2933` | small tags and captions |
| Label/tag red | `#E96B6B` | `#B73D3D` | `#1F2933` | warning labels |
| Label/tag blue | `#8FB8E8` | `#4D78A8` | `#1F2933` | system labels |
| Arrow direct | `#2F80C1` | — | — | solid request/response arrows |
| Arrow async/tool | `#C94C4C` | — | — | dashed tool call/result arrows |
| Arrow memory | `#8E63B8` | — | — | dotted/dashed memory read/write arrows |
| Arrow success | `#3D8B3D` | — | — | goal-complete path |
| Arrow hidden/internal | `#4A4A4A` | — | — | dotted internal lookup |

### Gradient Suggestions

Use very subtle vertical or diagonal gradients. The diagrams should look physical but not glossy.

| Element | Gradient |
|---|---|
| Yellow block | `#FFF4C2` → `#F7E6A6` |
| Blue block | `#D8E8F8` → `#B8D2EC` |
| Green block | `#DDF2D2` → `#B9DFA7` |
| Red/pink block | `#F9D6D6` → `#F2B6B6` |
| Purple block | `#EEE2FA` → `#D8C5F0` |
| Grey block | `#F2F3F4` → `#E3E5E8` |
| Main container | `#FFFFFF` → `#F4F4F1` |
| Floor plane | `#EAF7FC` → `#DCEFF7` |

### Shadow and Stroke Defaults

| Property | Recommended Value |
|---|---|
| Main stroke width | `1.2px` to `1.8px` |
| Small shape stroke width | `1px` |
| Major arrow width | `2px` to `3px` |
| Dashed arrow pattern | `6 6` |
| Dotted arrow pattern | `2 4` |
| Soft shadow | `rgba(0, 0, 0, 0.15)` with 4–8px blur |
| 3D side face opacity | `0.75` to `0.9` |
| Floor plane opacity | `0.55` to `0.75` |

### Typography Defaults

These sizes target a wide diagram (~2200×1360 canvas) viewed at 100% zoom.
Diagrams that read well at a glance need bigger type than typical UI work —
small labels disappear inside 3D blocks. Scale proportionally for smaller
canvases (drop ~15% per ~500px of width reduction).

| Role | Font Size | Use For |
|---|---:|---|
| Diagram title | `42–46px` | Main banner title |
| Subtitle / tagline | `24–28px` | Use-case line under the title |
| Section / container header | `21–24px` | "Agent Loop", "Memory Store", "Orchestration & Runtime" |
| Component label | `19–22px` | Top-row module names, runtime row blocks |
| Sub-component / tool item | `19–22px` | Items inside the Available Tools box |
| Numbered badge | `19–22px` | Step circles 1–8 |
| Folded note / sticky body | `15–18px` | Plan / Reason / Act / Observe content |
| Memory key-value table cell | `15–18px` | Table contents inside Memory Store |
| Legend text | `15–18px` | Arrow legend at the bottom |
| Caption / small label | `13–15px` | Tiny tags, small metadata |

**Text color:** default to **black (`#000000`)** for all readable text. The
pastel palette has strong fill colors and colored borders, so dark grey text
(`#1F2933`) often blends in. Keep colored text only for status indicators or
when contrast is verified against the underlying fill.

**Where to apply:**
- For `type: "text"` elements, set `strokeColor: "#000000"` (this is the text fill on text elements).
- For shapes carrying `containerText`, set `textColor: "#000000"` so the label stays black even if the shape's `strokeColor` (border) is colored.
- For `table` elements, prefer dark text on light row colors and white text on the colored header row (`tableHeaderTextColor: "#FFFFFF"`).

**Avoid:**
- Using `12px` or smaller for labels inside 3D blocks — the depth/shading reduces legibility.
- Mixing more than three text sizes inside one container — it looks cluttered.
- Letting a colored border bleed into the label color; always set `textColor` explicitly when the shape border is non-neutral.

## 4. Layout Pattern

Use this default layout for most diagrams:

```text
                          Title Banner

       +--------------------------------------------------+
       |                 Big 3D System Box                |
       |                                                  |
       |  Top layer: main modules                         |
       |  +---------+ +---------+ +---------+             |
       |                                                  |
       |  Middle layer: main flow / loop                  |
       |  [Step 1] -> [Step 2] -> [Step 3] -> [Decision]  |
       |                                                  |
       |  Lower layer: memory / data / storage            |
       |  +-------------+ +-------------+ +-------------+ |
       |                                                  |
       |  Bottom layer: runtime / queues / logs           |
       |  [queue] [scheduler] [executor] [logger]         |
       +--------------------------------------------------+

   User / external input on left            External tools/APIs on right
   Final result on left/right bottom        Legend at bottom
```

Recommended regions:

- **Top:** title and high-level system name
- **Left:** user input or trigger
- **Center:** main system container
- **Inside top:** system modules
- **Inside middle:** step-by-step process flow
- **Inside lower:** memory/data structures
- **Inside bottom:** runtime, queues, retries, logs
- **Right:** external APIs, tools, services
- **Bottom:** legend explaining arrow types

---

## 5. Title Banner

Use a soft green or blue rounded/wavy rectangle.

Examples:

```text
Agentic AI Example
Use case: Research a topic and email me a summary
```

```text
CRM Lead Automation
Use case: Convert IndiaMART lead into tasks and follow-ups
```

The title should be short and centered.

---

## 6. Large 3D System Container

The main system should be a large 3D box or room.

It represents the boundary of the system.

Examples:

- Agentic AI System
- JavaScript Engine
- Browser Runtime
- CRM Automation Engine
- Payroll Processing System
- Workflow Engine
- Restaurant POS System

Inside the container, place modules, memory, queues, and flow.

Do not let the main container become visually empty. It should contain meaningful compartments.

---

## 7. Layered Compartments

Use horizontal bands to show responsibility zones.

Example for an agentic AI system:

```text
+--------------------------------------------------+
| Modules: Planner | Reasoner | Memory | Tools     |
|--------------------------------------------------|
| Agent Loop: Plan -> Reason -> Act -> Observe     |
|--------------------------------------------------|
| Memory Store: context | facts | scratchpad       |
|--------------------------------------------------|
| Runtime: queue | scheduler | executor | logging  |
+--------------------------------------------------+
```

Example for CRM:

```text
+--------------------------------------------------+
| UI Layer: Leads | Tasks | Reports                |
|--------------------------------------------------|
| Business Layer: Pipeline | Rules | Follow-ups     |
|--------------------------------------------------|
| Data Layer: Lead | Contact | Task | Activity      |
|--------------------------------------------------|
| Runtime: notifications | jobs | audit logs       |
+--------------------------------------------------+
```

---

## 8. Component Blocks

Represent each major component as a 3D cuboid.

Good labels:

- Planner
- Reasoner
- Memory
- Tools Manager
- Goal Monitor
- Scheduler
- Executor
- Retry Handler
- Logger
- Rules Engine
- Notification Service
- Report Generator

Keep labels short. Prefer 1–3 words.

---

## 9. Key-Value Data Blocks

Use table-like 3D blocks for structured data.

Example:

```text
Short-Term Memory
+----------+----------------------+
| key      | value                |
+----------+----------------------+
| goal     | Research EU AI Act   |
| step     | Find latest updates  |
| status   | in_progress          |
+----------+----------------------+
```

Use these for:

- memory
- object properties
- request context
- user profile
- database records
- configuration
- workflow state
- CRM lead fields

---

## 10. Folded Paper Notes

Use folded paper shapes for text that behaves like an instruction.

Examples:

```text
Plan
1. Search latest updates
2. Extract key points
3. Draft summary
4. Send email
```

```text
Rule
IF lead.status = "new"
THEN create follow-up task
```

```text
Function
handleRequest(req, res) {
  return response;
}
```

Use folded notes for:

- code snippets
- prompts
- rules
- plans
- SQL
- formulas
- policies
- handlers

---

## 11. Queue Shapes

Represent queues as stacked cards or envelopes.

Examples:

- Task Queue
- Event Queue
- Email Queue
- Tool Result Queue
- Retry Queue
- Payroll Job Queue
- Lead Import Queue

A queue should visually show multiple pending items.

Example:

```text
Task Queue
[□][□][□][□]
```

Use arrows into and out of the queue.

---

## 12. Clouds

Use cloud shapes for abstract concepts, environment labels, or external systems.

Examples:

- LLM Reasoning
- Global Policies
- External APIs
- WebAPI
- Stack
- Heap
- Storage
- Rules Engine
- Compliance
- Authentication

Clouds should not contain long text. Use them as concept labels.

---

## 13. Arrows and Flow Meaning

Use arrow styles consistently.

| Arrow Style | Meaning |
|---|---|
| Solid blue arrow | user request / normal response |
| Solid black arrow | direct reference or call |
| Red dashed arrow | tool call / external action / error path |
| Purple dashed arrow | memory read/write |
| Green solid arrow | success / goal completed |
| Dotted arrow | hidden/internal lookup |
| Thick arrow | main flow |

Always add a legend if the diagram has more than two arrow types.

Example legend:

```text
Blue arrow   = User request / response
Red dashed   = Tool call / result
Purple dashed = Memory read/write
Green arrow  = Goal completed
```

---

## 14. Numbered Sequence Bubbles

Use numbered circles when explaining a process.

Example:

```text
1 User gives goal
2 Agent creates plan
3 Agent reasons next step
4 Agent uses tool
5 Agent observes result
6 Loop repeats
7 Final answer prepared
8 Email sent
```

Place numbers near the related arrows or blocks.

Keep the sequence visible and easy to follow.

---

## 15. 3D Value Cubes

Use small cubes for concrete values.

Examples:

- 5
- 7
- 1
- `new`
- `approved`
- `user@example.com`
- `100*`
- `score: 82`

Use cubes when you want to show that a field contains an actual value.

---

## 16. Spatial Rules

Follow these layout rules:

1. Put the user or trigger on the left.
2. Put the main system in the center.
3. Put external tools/APIs on the right.
4. Put memory/data below the main loop.
5. Put runtime/queues/logging near the bottom.
6. Put the final output on the left or bottom-left.
7. Put abstract policies or global constraints outside the main box on the right/top.
8. Use a floor plane under the system for the 3D workshop feel.

---

## 17. Diagram Recipe

For any topic, follow this process.

### Step 1: Identify the system boundary

Ask:

> What is the big system?

Draw it as a large 3D container.

Examples:

- AI Agent System
- Payroll Engine
- Browser Runtime
- Order Processing System
- LMS Platform

### Step 2: Identify zones

Ask:

> What are the major responsibility areas?

Draw zones as horizontal layers.

### Step 3: Identify objects/components

Ask:

> What are the main parts inside the system?

Draw them as 3D cuboids.

### Step 4: Identify data

Ask:

> What information is stored or passed around?

Draw key-value tables and small cubes.

### Step 5: Identify movement

Ask:

> What moves through the system?

Draw arrows.

### Step 6: Identify waiting work

Ask:

> What waits for later processing?

Draw queues.

### Step 7: Identify abstract concepts

Ask:

> What invisible ideas affect the system?

Draw clouds.

### Step 8: Add sequence numbers

Number the main journey.

### Step 9: Add legend

Explain arrow colors and line styles.

---

## 18. Agentic AI Example Diagram Specification

Use this as a reusable example.

### Use case

A user asks:

> Research the latest AI regulations in the EU and email me a short summary.

### Main container

`Agentic AI System`

### Top modules

- Planner
- Reasoner
- Memory
- Tools Manager
- Goal Monitor

### Main loop

Use folded notes or blocks:

1. Plan
2. Reason
3. Act / Use Tool
4. Observe
5. Goal completed?

If goal is not complete, loop back to Reason.

### Memory store

Use key-value table blocks:

- Short-Term Memory / Conversation Context
- Long-Term Memory / Knowledge Facts
- Scratchpad / Working Notes
- User Profile & Preferences

### Runtime layer

Use cuboids and queue shapes:

- Task Queue
- Scheduler
- Execution Engine
- Retry / Error Handler
- Logging & Tracing

### External tools

Place outside on the right as a stacked 3D tool box:

- Web Search
- Document Reader
- News API
- Calculator
- Email Sender

### Outside clouds

- LLM Reasoning
- Global Policies
- External APIs / Apps

### Final output

Draw an email card:

```text
Final Answer (emailed)
To: user@example.com
Subject: AI regulations in EU - summary

Hi,
Here is a short summary...
```

### Flow sequence

1. User provides goal.
2. Agent creates a plan.
3. Agent reasons what to do next.
4. Agent acts by using a tool.
5. Agent observes the result.
6. Loop repeats until goal is complete.
7. Final answer is prepared.
8. Summary is emailed to the user.

---

## 19. Prompt Template for Image Generation

Use this prompt when generating a diagram image in this style:

```text
Create a wide educational 3D conceptual diagram in a digital concept visualization style.

Subject: [SUBJECT]
Use case: [USE CASE]

Use a large 3D system container in the center with layered compartments. Use pastel colors, soft shadows, thin black outlines, and a light blue floor plane. Use 3D cuboid blocks for components, stacked key-value table blocks for data, small cubes for values, cloud shapes for abstract concepts, folded paper notes for rules/code/plans, stacked envelope/card shapes for queues, and numbered circles for process steps.

Layout:
- User/request on the left
- Main system container in the center
- External tools/APIs on the right
- Memory/data blocks below the main loop
- Runtime/queue/logging layer at the bottom
- Final output card on the left or bottom-left
- Legend at the bottom

Arrow meanings:
- solid blue arrow = user request/response
- red dashed arrow = tool call/result
- purple dashed arrow = memory read/write
- green arrow = goal completed
- dotted arrow = hidden/internal reasoning

Keep labels short. Make the diagram clean, readable, and spacious. Avoid overcrowding. Use a workshop/process-map feeling rather than a flat architecture diagram.
```

---

## 20. Mermaid/ASCII Planning Template

Before drawing the final visual, plan the structure in text.

```text
TITLE: [System Name]
USE CASE: [Simple use case]

LEFT:
- User
- User goal bubble
- Final output card

CENTER BIG 3D CONTAINER:
- Top module layer:
  - Module 1
  - Module 2
  - Module 3

- Main flow layer:
  1. Step one
  2. Step two
  3. Step three
  4. Decision

- Memory/data layer:
  - Key-value block 1
  - Key-value block 2
  - Scratchpad

- Runtime layer:
  - Queue
  - Scheduler
  - Executor
  - Error handler
  - Logs

RIGHT:
- External tools/APIs
- Policy cloud
- Model/reasoning cloud

LEGEND:
- Blue = request/response
- Red dashed = tool call
- Purple dashed = memory
- Green = completed
```

---

## 21. Common Mistakes to Avoid

Avoid these mistakes:

1. Do not create a flat box-and-arrow diagram only.
2. Do not use too many different shapes with no meaning.
3. Do not put long paragraphs inside shapes.
4. Do not make every arrow the same style.
5. Do not skip the system boundary.
6. Do not skip memory/data representation when the topic has state.
7. Do not overcrowd the center.
8. Do not use very bright colors; use soft pastel tones.
9. Do not make all components the same size; hierarchy should be visible.
10. Do not forget the legend when using multiple arrow styles.

---

## 22. Quality Checklist

Before finalizing, verify:

- [ ] Is there one clear large 3D system boundary?
- [ ] Are the internal zones/layers clear?
- [ ] Are components shown as 3D blocks?
- [ ] Is data/state shown as key-value tables or value cubes?
- [ ] Are queues shown as stacked cards/envelopes?
- [ ] Are abstract concepts shown as clouds?
- [ ] Are rules/code/plans shown as folded notes?
- [ ] Are arrows meaningful and not random?
- [ ] Are steps numbered?
- [ ] Is there a final output/result?
- [ ] Is there a legend?
- [ ] Is the diagram spacious and readable?
- [ ] Does it feel like a physical process map?

---

## 23. Reusable Subject Patterns

### AI Agent System

Container:

- Agentic AI System

Modules:

- Planner
- Reasoner
- Memory
- Tool Manager
- Goal Monitor

Data:

- Conversation Context
- Long-Term Memory
- Scratchpad
- User Preferences

Queues:

- Task Queue
- Tool Result Queue

External:

- Web Search
- Email
- Calendar
- Database

---

### CRM Automation

Container:

- CRM Automation Engine

Modules:

- Lead Intake
- Pipeline Rules
- Follow-up Planner
- Notification Engine
- Reporting

Data:

- Lead Record
- Contact Record
- Task Record
- Activity Log

Queues:

- Follow-up Queue
- Notification Queue
- Import Queue

External:

- IndiaMART
- Email
- WhatsApp
- ERP

---

### Payroll Processing

Container:

- Payroll Engine

Modules:

- Attendance Reader
- Leave Calculator
- Salary Rule Engine
- Deduction Engine
- Payslip Generator

Data:

- Employee
- Attendance
- Salary Components
- Tax Rules

Queues:

- Payroll Run Queue
- Payslip Email Queue

External:

- Bank API
- Compliance Portal
- Accounting System

---

### Workflow Engine

Container:

- Workflow Runtime

Modules:

- Trigger
- Rule Evaluator
- State Machine
- Task Assigner
- Notification Engine

Data:

- Workflow Definition
- Current State
- Actor Context
- Audit Log

Queues:

- Pending Tasks
- Retry Queue
- Event Queue

External:

- CRM
- HRMS
- Email
- Webhook

---

---

## 24. Spine-Labeled Object Cube (the signature shape)

This is the most distinctive shape in this style. Use it whenever a diagram needs to show **a named object that owns structured data**.

### Anatomy

```text
+--+----------------+
|  |  Key  | Value  |
|S |  ___proto___   |   <- top row (often shown red, indicates inheritance)
|p +-------+--------+
|i |  id   |   1    |
|n +-------+--------+
|e |  name | "Eich" |
|  +-------+--------+
+--+----------------+
```

- **Spine (left band)**: vertically rotated text giving the object's *role/name* (`Object`, `Person`, `Employee`, `Caretaker`, `Adapter`, `Caller`).
- **Body**: a 2-column key/value table on the front face.
- **Top row** is often `__proto__` (red) for prototype-bearing objects, or the most important field.
- **Cells point outward** to small cubes (literal values) or other spine cubes (references) via thin black/dotted arrows.

### Use it for

- Class instances in OOP diagrams (Customer, Employee, Lead).
- The "object under discussion" in a design pattern diagram.
- An entity record in CRM/ERP/payroll diagrams.
- A JS object on the heap (with `__proto__` row).

### Spine color → role

See the spine-color table in §3. Pick the spine color first based on the object's role; pick the body fill to match (light tint of the spine color).

### Companion shapes

- **Cell-to-value arrow**: a short black arrow from a cell to a small cube containing the literal (`5`, `"Brendan"`).
- **Cell-to-function arrow**: a short black arrow from a cell to a folded-paper note containing a function body.
- **Cell-to-other-object arrow**: a thin black solid arrow ending at another spine cube.
- **`__proto__` arrow**: a curved red dotted arrow from the `__proto__` row up to the prototype object.

### Avoid

- More than 6–8 rows per object. Beyond that, summarize with `...` or split into a separate cube.
- Mixing spine color with random body colors — keep the body a tint of the spine.

---

## 25. Layered Runtime Cabinet

A multi-floor 3D box used to show a process or runtime memory model.

### Anatomy

```text
+========================================+   <- engine/header band (red/pink)
|  Memory Mgmt | Interpreter | JIT | GC  |
+========================================+
|  Global Area / Globals                 |   <- light blue band
+----------------------------------------+
|  Heap                                  |   <- white/large central band
|    [object cubes...] [dictionaries]    |
+----------------------------------------+
|  Stack                                  |   <- light green band
|    [stackframe] [stackframe] ...        |
+========================================+
              floor plane
```

### Side cloud tags

Each band gets a small cloud on the **right edge** naming the band:
- `JavaScript Engine` (red cloud) on the engine band
- `Global Area` (blue cloud)
- `Heap` (white cloud)
- `Stack` (green cloud)
- `RAM` (orange cloud) for hardware-level diagrams

### Use it for

- JavaScript engine internals (Memory Mgmt / Interpreter / JIT / GC across the top, Global Area / Heap / Stack as floors).
- C/C++ process map (CODE / DATA / BSS / HEAP / STACK as floors).
- Operating-system process layout.
- Container-runtime / VM internals.

### Sit it on the floor plane

The cabinet should rest on the light-blue floor plane (§16). The floor extends ~10–20% past the cabinet on every side to give the perspective.

---

## 26. Code Panels & Comparison Pairs

Use side-by-side code panels to compare two approaches.

### Convention

| Panel role | Border | Fill | Side label |
|---|---|---|---|
| Imperative / "before" / wrong | red `#C95757` | white or `#FFF8F8` | small red cloud `Imperative` |
| Functional / "after" / right | green `#6BA368` | white or `#F8FFF6` | small green cloud `HoF` / `Pure` |
| Neutral example | grey `#9AA3AD` | white | none |

### Inside a code panel

- Use a monospace font (size 14–18 for diagrams, larger if it's a hero panel).
- Apply syntax coloring even in the diagram: keywords blue/purple, strings red/green, numbers blue, comments grey.
- Keep snippets to ~10 lines max — these are concept teasers, not full programs.
- Place the small cloud label outside the panel, near a corner, with a leader line if needed.

### Use it for

- Refactor demos (loop → reduce, callback → async/await).
- Pattern explanations ("without Adapter" vs "with Adapter").
- Showing the user-facing API alongside the internal model.

---

## 27. Inline Step Markers (Red Numbered Circles)

Small **red filled circles with white numbers** placed *directly on* the artifact being introduced — not at the side of the diagram.

### Difference from regular numbered badges

- Regular `numberedBadge` (§14): a step in the *journey* — placed near arrows and standalone blocks.
- Inline red marker: a step in the *narrative* — placed on the cube/note/table whose creation or use this step describes.

### Use them when

You are walking the reader through a sequence of object creation, function execution, or memory mutations on a *single* diagram. Drop ① on the dictionary, ② on the function declaration, ③ on the prototype object, etc.

### Visual spec

| Property | Value |
|---|---|
| Fill | `#E74C3C` to `#C0392B` |
| Border | none or 1px white |
| Number color | white |
| Size | 18–24px diameter |
| Placement | overlap the top-left corner of the artifact |

---

## 28. Annotation Patterns

These annotations are part of the style's vocabulary and should be reused verbatim:

### Bracket with size/length

Used to indicate a *concrete dimension* of a memory artifact:

```text
+---------------+
|   long int    |
+---------------+
|◄───── 8 ─────►|
```

Place the bracket **below** the cube. The number sits inside a small yellow chip. Use this for byte sizes, capacities, batch sizes.

### Rule capsule

A small rounded rectangle with a one-line invariant. Always pastel-filled, dark-bordered, dark text.

```text
+---------------------------+
| short ≤ int ≤ long        |
+---------------------------+
```

Used for type rules, ordering invariants, mathematical constraints.

### Red X over an arrow

A red `✕` (or two crossed strokes) drawn on top of an arrow's midpoint to mean "this call cannot happen / is forbidden". Pair it with a small red cloud explaining *why*.

### Open-circle arrow origin

A small unfilled circle at the **start** of an arrow (instead of just a tail) to mean "implements" or "binds to" — borrowed from UML interface notation. Use this when an arrow represents a contract, not a runtime call.

---

## 29. Person Figures (Roles)

Stick-figure or silhouette characters represent a *human or external actor* invoking the system.

### Conventions

- Color the figure to match its role: blue for normal user/client code, green for safe/internal actor, orange for an integrating actor, red for an attacker / rogue thread.
- Place the figure **outside** the system container, with a single arrow into the entry point.
- Pair with a small label chip (`Client Code`, `Caller`, `User`, `Notifier`, `Rogue One`).

### Avoid

- More than 2–3 figures in a single diagram — they compete for attention.
- Using them inside the system box; the convention is *external role*.

---

## 30. Multi-Frame Comparison Layout

When the topic has progressively-more-complex variants, lay them out as **N mini-diagrams sitting on one shared floor plane**.

### Example: multitasking → multi-threading → multi-processing

```text
+-----------+  +-----------+  +-----------+  +-----------+
| Single    |  | Multi-    |  | Multi-    |  | Multi-    |
| Tasking   |  | Tasking   |  | Threading |  | Processing|
| [diag 1]  |  | [diag 2]  |  | [diag 3]  |  | [diag 4]  |
+-----------+  +-----------+  +-----------+  +-----------+
====== shared light-blue floor plane ======
```

### Rules

- Each mini-diagram uses the same vocabulary (same shape for "process", same color for "code").
- Mini-diagrams differ only in the *complexity* being introduced — readers learn by diffing.
- Caption each mini-diagram with a small chip below it.
- Keep all mini-diagrams the same size; alignment matters more than detail.

Use this for: concurrency models, scaling stages (monolith → modular → microservices → serverless), evolution timelines, progressive disclosure.

---

## 31. Branding & Attribution

Every finished diagram should carry author / source attribution. This is part of the style.

### Placement

| Element | Where |
|---|---|
| Title banner (wavy green/blue) | top center |
| Author / channel chip (`t.me/svworkshops`) | bottom-left, small text |
| Copyright footer (`Digital Concept Visual, © Author 2026`) | bottom center, light grey |
| Brand logo (e.g., language logo) | top-right corner if topic is language-specific |

### Avoid

- Heavy watermarks across the canvas.
- Multiple competing logos.

---

## 32. Title Banner Variants

The title banner is **always wavy/torn-edged**, never a plain rectangle.

| Variant | Use |
|---|---|
| Green wavy capsule | Default / positive / "this works" topics (most diagrams) |
| Red wavy capsule | Warning / cautionary / "what is X (and why it's hard)" topics |
| Blue wavy capsule | System / runtime / engine topics |

The banner sits **above** the main system container, slightly overlapping it visually (or with a small gap). Title text is dark and sized large (40–48px).

---

## 33. Reusable Subject Patterns (additional)

### JavaScript Runtime Internals

- Container: `JavaScript Engine` (layered cabinet)
- Engine band: Memory Mgmt | Interpreter | JIT Compiler | Garbage Collector
- Global Area: a few key/value cubes (`g`, `window`)
- Heap: spine-labeled object cubes with `__proto__` rows, dotted prototype chains
- Stack: stack-frame strip with `local`, `arguments` slots
- External clouds: `Heap`, `Stack`, `Global Area`, `RAM`

### Design Pattern (single pattern)

- Wavy banner: pattern name (Memento / Adapter / Factory / Prototype)
- Floor plane
- One spine-labeled object per role (Object/green, Caretaker/pink, Adapter/orange)
- Small clouds for the *intent* of each move ("Ask object to package data", "How to save & restore data?")
- Dashed arrows for indirect/conceptual links; solid for direct calls
- Side rule capsule with the pattern's *consequence*

### C/C++ Memory Model

- Container: process cabinet with floors CODE / DATA / BSS / HEAP / STACK
- Top floor split: `_main` and `_printf` symbol panels
- Heap: dynamic-allocation cubes with `8192*` style address tags
- Stack: stack-frame strip with `return value`, `local variables`, `formal params`, `return address`
- Side clouds: `RAM` (orange), `CODE`, `DATA`, `HEAP`, `STACK` (color-matched to floors)

### Workshop Cycle (process-cycle diagram)

- Wavy green title banner
- Big circle with 4 colored discs around it: Visualise (green) → Analyse (blue) → Code (yellow) → Implement (pink)
- Bold white sketch arrows between discs
- Outflow arrow at the bottom into a "Capstone" / "Interview Questions" capsule

### Course Outline Slide

- Two columns:
  - **Left**: a long key/value-style outline table with topic names (light green header, alternating white rows, bold key column)
  - **Right**: 3–5 small thumbnails of representative diagrams from the course
- Title at top using the wavy banner style
- Branding chip bottom-left

---

## 34. Anti-patterns observed (extra "don'ts")

In addition to §21, avoid:

- Mixing flat 2D shapes and 3D shapes for the *same role* in one diagram (pick one and stay).
- Spine-labeling shapes that aren't objects (don't put a spine on a "Queue" — that's an envelope stack).
- Using a layered cabinet for fewer than 3 layers — a 1-floor cabinet is just a box.
- Numbered red inline circles without a corresponding sentence in the legend / caption explaining the order.
- Code panels longer than ~12 lines — past that, screenshot a real editor instead.
- Floor planes under *every* small block — the floor is a single shared base, not a per-element decoration.

---

## 35. Final Principle

The style is not about decoration. It is about **spatial understanding**.

Use 3D shapes to make the learner feel:

> “I can see where the concept lives, what it contains, what points to it, and how it moves through the system.”

That is the essence of this diagram style.