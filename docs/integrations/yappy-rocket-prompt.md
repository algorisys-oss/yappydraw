# Yappy-Rocket Integration — DSL Approaches

## Assessment with YappyDSL

### What Already Exists

YappyDSL has:
- UML Class shapes with `umlAttributes` and `umlMethods` properties
- Edge operators including `->`, `--`, `~>`, `=>` with labels
- An adapter pattern (Mermaid adapter already converts external formats → DSLDiagram IR)
- A common IR (`DSLDiagram` → `DSLNode[]` + `DSLEdge[]`) with a `properties` field for custom metadata
- Variables, loops, functions — so you can script repetitive entity patterns
- Frontmatter for diagram-level metadata

---

## Three Possible Approaches

### Approach A: Convention on existing UML Class syntax

Use what's already there, just define a convention:

```ysl
---
title: Invoice System
layout: tree-right
rocket_app: invoicing
---

customer [class] "Customer" {
  umlAttributes: "id: uuid [PK], name: string *, email: string * unique, status: string = active [draft,active,suspended], created_at: timestamp auto:create"
}

invoice [class] "Invoice" {
  umlAttributes: "id: uuid [PK], number: string * unique, customer_id: uuid, total: decimal(2), status: string = draft [draft,sent,paid], created_at: timestamp auto:create"
}

item [class] "InvoiceItem" {
  umlAttributes: "id: uuid [PK], invoice_id: uuid, description: string *, quantity: int *, unit_price: decimal(2) *"
}

customer -> invoice "customer_invoices [1:N cascade]"
invoice -> item "invoice_items [1:N cascade]"
```

A Rocket adapter reads the IR, parses the attribute strings, and outputs Rocket import JSON. Minimal changes to YappyDraw itself.

### Approach B: New entity shape alias + dedicated properties

Add a first-class entity shape type to YappyDSL:

```ysl
---
title: Invoice System
layout: tree-right
rocket_app: invoicing
---

customer [entity] "Customer"
  id: uuid [PK]
  name: string *
  email: string * unique
  status: string = active [draft,active,suspended]
  created_at: timestamp auto:create

invoice [entity] "Invoice"
  id: uuid [PK]
  number: string * unique
  customer_id: uuid
  total: decimal(2)
  status: string = draft
  created_at: timestamp auto:create

customer -> invoice "customer_invoices" { relationType: "one_to_many", onDelete: "cascade" }
```

This uses indented children (which YappyDSL already supports for mindmaps) to define fields. The parser recognizes `[entity]` shapes and treats children as field definitions rather than child nodes.

### Approach C: Dedicated schema DSL block (new syntax)

Extend YappyDSL with a `schema` keyword:

```ysl
---
title: Invoice System
rocket_app: invoicing
---

schema
  entity Customer
    id: uuid PK
    name: string required
    email: string required unique
    status: string default("active") enum("draft", "active", "suspended")
    created_at: timestamp auto_create
  end

  entity Invoice
    id: uuid PK
    number: string required unique
    total: decimal(2)
    status: string default("draft")
  end

  relation customer_invoices
    Customer 1 -> N Invoice on_delete(cascade)
  end
end
```

This is the cleanest but requires the most changes to the parser.

---

## Recommendation

Start with **Approach A** (zero changes to YappyDraw), then evolve to **Approach B** (small addition):

| Step | What | Changes to |
|------|------|-----------|
| 1 | Write a rocket-adapter in YappyDraw's adapter registry | YappyDraw: new file in `src/dsl/adapters/rocket/` |
| 2 | It reads DSLDiagram IR → outputs Rocket import JSON | Same adapter |
| 3 | Add an `entity` shape alias pointing to UML Class | YappyDraw: one line in `shape-aliases.ts` |
| 4 | Add "Export to Rocket" in export menu or as `Yappy.exportToRocket()` | YappyDraw: small UI addition |
| 5 | Add "Import from YappyDraw" in Rocket Admin UI | Rocket: Admin UI page |
| 6 | Reverse direction: Rocket export → YappyDSL text | Both |

The adapter pattern is already proven (Mermaid adapter does exactly this for a different format). The Rocket adapter would follow the same DSLAdapter interface, just producing Rocket JSON instead of rendering to canvas.

---

## What's Powerful About This

You could write a complete backend schema as a `.ysl` script:

```ysl
---
title: SaaS Backend
rocket_app: my_saas
---

# Define reusable field sets
fn timestamps()
  created_at: timestamp auto:create
  updated_at: timestamp auto:update
end

# Entities
user [entity] "User"
  id: uuid [PK]
  email: string * unique
  name: string *
  role: string = member [admin,member,viewer]
  timestamps()

project [entity] "Project"
  id: uuid [PK]
  name: string *
  owner_id: uuid
  timestamps()

task [entity] "Task"
  id: uuid [PK]
  title: string *
  status: string = todo [todo,doing,done]
  project_id: uuid
  assignee_id: uuid
  timestamps()

tag [entity] "Tag"
  id: uuid [PK]
  name: string * unique

# Relations
user -> project "user_projects" { rel: "1:N", onDelete: "cascade" }
project -> task "project_tasks" { rel: "1:N", onDelete: "cascade" }
user -> task "assigned_tasks" { rel: "1:N", onDelete: "set_null", fk: "assignee_id" }
task -- tag "task_tags" { rel: "M:N", joinTable: "task_tags" }
```

Run one command → complete backend with DB tables, REST API, relations, all live. And you get a visual diagram you can share with your team. The script and the diagram are the same artifact.
