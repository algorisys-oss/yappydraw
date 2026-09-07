# UML Class Shape

## Overview

The UML Class shape (`umlClass`) renders a standard three-compartment class diagram:

```
┌──────────────────────┐
│      ClassName        │  ← Header (bold, centered)
├──────────────────────┤
│ + name: string        │  ← Attributes (left-aligned, 90% font)
│ - email: string       │
├──────────────────────┤
│ + getName(): string   │  ← Methods (left-aligned, 90% font)
│ - validate(): void    │
└──────────────────────┘
```

## Properties

| Property | Description | Example |
|----------|-------------|---------|
| `containerText` | Class name (header section) | `Customer` |
| `attributesText` | Attributes, one per line | `+ name: string\n- age: int` |
| `methodsText` | Methods, one per line | `+ getName(): string` |

## Visibility Modifiers

| Prefix | Meaning |
|--------|---------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |

## Attribute Syntax

Each line in `attributesText` follows this format:

```
[visibility] name: type [constraints]
```

### Examples

```
+ id: uuid [PK]                    # Primary key
+ name: string *                   # Required field
+ email: string * unique           # Required + unique
- password: string                 # Private field
+ status: string = active          # Default value
+ role: string [admin,user,viewer] # Enum values
+ total: decimal(2)                # Precision
+ created_at: timestamp auto:create # Auto timestamp
# internal: string                 # Protected field
```

### Constraint Reference

| Syntax | Meaning |
|--------|---------|
| `*` | Required (not null) |
| `unique` | Unique constraint |
| `[PK]` | Primary key |
| `= value` | Default value |
| `[val1,val2,val3]` | Enum values |
| `(N)` after type | Precision (e.g., `decimal(2)`) |
| `auto:create` | Auto-set on creation |
| `auto:update` | Auto-set on update |

### Type Mapping

| DSL Type | Maps To |
|----------|---------|
| `string` | String/VARCHAR |
| `int`, `integer` | Integer |
| `uuid` | UUID |
| `bool`, `boolean` | Boolean |
| `text` | Text/CLOB |
| `date` | Date |
| `datetime`, `timestamp` | Timestamp |
| `json` | JSON |
| `float` | Float |
| `decimal` | Decimal |
| `file` | File reference |
| `bigint` | Big integer |

## Method Syntax

Each line in `methodsText` follows this format:

```
[visibility] name(params): returnType
```

### Examples

```
+ getName(): string
+ setName(name: string): void
- validate(): boolean
# calculateTotal(items: Item[]): decimal
```

## Creating a UML Class

### From Toolbar

1. Select the UML tool group in the drawing toolbar
2. Choose "UML Class"
3. Draw on canvas — shape is created with default placeholder text:
   - Header: `ClassName`
   - Attributes: `+ attribute: type`
   - Methods: `+ method(): void`

### From DSL

```ysl
customer [class] "Customer"
```

Or using the `entity` alias (for database-oriented diagrams):

```ysl
customer [entity] "Customer"
```

## Editing Sections

### Double-Click on Canvas

Double-click on any section to edit it directly:
- Click in the **top section** → edit class name
- Click in the **middle section** → edit attributes
- Click in the **bottom section** → edit methods

### Property Panel

Select the UML class shape, then use the property panel:
- **Label** textarea → class name
- **Attributes** textarea → attributes (one per line)
- **Methods** textarea → methods (one per line)

Each section has a **+** button with a dropdown to quickly add:
- `+ public` — adds a public member template
- `- private` — adds a private member template
- `# protected` — adds a protected member template

## Rendering Modes

The UML Class shape supports both rendering styles:

- **Sketch mode** — hand-drawn appearance using RoughJS (`rc.rectangle`, `rc.line`)
- **Architectural mode** — clean straight lines using Canvas 2D API

Both modes draw:
1. Outer rectangle
2. Header divider line (below class name)
3. Attributes divider line (between attributes and methods)
4. Section text in their respective compartments

## Rocket Backend Integration

UML Class shapes can be exported to Rocket Backend import JSON via:

- **Export dialog**: Menu → Export/Save → Export to Rocket
- **API**: `window.Yappy.exportToRocket({ appName: 'my_app' })`
- **MCP**: `diagram_to_rocket_schema` tool

The attribute syntax is parsed into Rocket entity field definitions, and connector labels define relations between entities.

### Edge Label Convention for Relations

```
"relation_name [1:N cascade]"     # one-to-many, cascade delete
"relation_name [1:1 set_null]"    # one-to-one, set null on delete
"relation_name [M:N]"             # many-to-many (auto join table)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/shapes/renderers/uml-class-renderer.ts` | Canvas rendering (both modes) |
| `src/utils/tool-handlers/text-editing-handler.ts` | Double-click section hit testing |
| `src/components/text-editing-overlay.tsx` | Textarea overlay positioning per section |
| `src/components/property-panel.tsx` | Property panel with + buttons |
| `src/utils/tool-handlers/draw-handler.ts` | Default text on shape creation |
| `src/config/properties.ts` | `attributesText` / `methodsText` config |
| `src/dsl/shape-aliases.ts` | `entity` and `class` aliases |
| `src/dsl/adapters/rocket/field-parser.ts` | Attribute string → Rocket field parser |
