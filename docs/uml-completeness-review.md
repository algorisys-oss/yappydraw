# UML tools — completeness review (2026-06-30)

UML tools now live under the unified **Architecture** toolbar group
(*UML Structure* + *UML Behavior* sections), plus the *State* section for state
machines. The DSL/Mermaid path additionally renders full **sequence** diagrams.

## Shape inventory (dedicated UML shapes)

- **Structure:** `umlClass` (attribute/method sections), `umlInterface`, `umlEnum`,
  `umlPackage`, `umlComponent`, `umlNote`.
- **Behavior:** `umlActor`, `umlUseCase`, `umlState`, `umlLifeline`, `umlFragment`,
  `umlSignalSend`, `umlSignalReceive`, `umlProvidedInterface`, `umlRequiredInterface`.
- **State machine:** `stateStart` (initial), `stateEnd` (final), `stateSync`
  (fork/join bar), `activationBar`.

## Coverage by UML 2.5 diagram type

| Diagram | Status | Notes |
|---|---|---|
| **Class** | ✅ Strong | Class/Interface/Enum/Package/Note + connector arrowheads (inheritance/association/composition). |
| **Sequence** | ✅ Best-in-class | Lifeline/Actor/Activation/Fragment + full DSL timeline (fragments, notes, activations, autonumber). |
| **State machine** | ✅ Strong (v0.5.18) | State (+composite via sections), initial/final, fork/join, **History** pseudostate (`umlHistory`); choice via diamond. |
| **Use case** | ✅ Good | Actor + Use Case; system boundary via Package. |
| **Component** | ✅ Good (v0.5.18) | Component + provided/required (ball-and-socket) + **Port** (`umlPort`). |
| **Package** | ✅ | Package. |
| **Activity** | ✅ Good (v0.5.18) | Initial/final + fork/join + signal send/receive + dedicated **Action** node (`umlAction`); decision via diamond, swimlanes via BPMN pool. |
| **Object** | ✅ Added (v0.5.18) | Dedicated **Object/Instance** (`umlObject`) with an underlined `name:Class` label. |
| **Deployment** | ✅ Added (v0.5.17) | Dedicated **Deployment Node** (3-D box) + **Artifact** (folded-corner doc). «device»/«execution environment» via stereotype text. |
| **Communication** | ⚠️ Partial | Objects + numbered messages (class + arrows + autonumber). |
| **Composite structure** | ⚠️ Partial | No **Port** / Part / Collaboration. |
| **Timing** | ❌ Gap | Niche; not modelled. |
| **Profile** | ❌ Gap | Niche; stereotypes via «text». |

## Prioritized gaps (recommended additions)

- ✅ **Deployment Node + Artifact** — added in v0.5.17 (`umlNode`, `umlArtifact`).
- ✅ **Object/instance, Port, History pseudostate, Activity Action** — added in v0.5.18
  (`umlObject`, `umlPort`, `umlHistory`, `umlAction`).

Remaining (niche): Timing diagrams, Profile/stereotype shapes, Composite-structure
parts/collaborations, and include/extend/«stereotype» edge decorations.

Each new shape needs: `ElementType` entry, a renderer (architectural **and** sketch),
`shape-geometry` + `register-shapes` + `shape-defaults`, a tool entry in the
Architecture group, `api.ts`, and help docs — i.e. a focused, separately-verified
change rather than a quick add.

## Strengths

Class, Sequence (notably upgraded), State machine, Use case and Component diagrams
are well covered and render in both **sketch** and **architectural** styles.
