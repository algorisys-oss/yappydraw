# Rocket Backend — Context Reference

> Reference document for integrating Yappy with Rocket Backend.
> Source: `/home/rajesh/work/rocket-backend` (ExpressJS implementation only)

## What is Rocket Backend?

A **metadata-driven, no/low-code backend framework** where entities, relations, and business logic are defined as JSON metadata and interpreted at runtime. No per-entity code generation — a single engine dynamically serves REST APIs for any entity.

## ExpressJS Implementation

**Location:** `/home/rajesh/work/rocket-backend/backend/expressjs/`
**Stack:** Node.js + TypeScript + PostgreSQL (also supports SQLite)
**~64 TypeScript files** across a clean layered architecture.

## Project Structure

```
backend/expressjs/src/
├── index.ts                 # Express app bootstrap
├── config/                  # Config loader (app.yaml + env vars)
├── store/                   # DB abstraction (pg Pool, dialect pattern)
│   ├── postgres.ts          # queryRows, queryRow, exec, beginTx
│   ├── dialect.ts           # Dialect interface
│   ├── dialect-postgres.ts  # Postgres SQL generation
│   ├── dialect-sqlite.ts    # SQLite adapter
│   ├── migrator.ts          # Auto-migration (CREATE/ALTER TABLE)
│   └── bootstrap.ts         # System tables DDL
├── metadata/                # Entity/relation/rule type definitions + registry
│   ├── types.ts             # Entity, Field, Relation, Rule, StateMachine, etc.
│   ├── registry.ts          # In-memory metadata cache
│   └── loader.ts            # Load metadata from DB into registry
├── engine/                  # Core CRUD + business logic
│   ├── handler.ts           # list, getById, create, update, delete
│   ├── router.ts            # Dynamic route registration
│   ├── query.ts             # Query plan builder (filters, sort, pagination)
│   ├── writer.ts            # SQL builders (INSERT, UPDATE, DELETE)
│   ├── nested-write.ts      # Write plan + transaction executor
│   ├── diff.ts              # Nested write diff algorithm
│   ├── includes.ts          # Relation loading (separate queries)
│   ├── rules.ts             # Rule evaluation engine
│   ├── state-machine.ts     # State transition validation
│   ├── webhook.ts           # Webhook dispatch
│   ├── workflow.ts          # Workflow engine
│   └── file-handler.ts      # File upload/serve/delete
├── auth/                    # JWT auth, RBAC, row-level security
│   ├── auth.ts              # JWT helpers + bcrypt
│   ├── handler.ts           # login, refresh, logout, accept-invite
│   ├── middleware.ts        # JWT validation
│   └── permissions.ts       # Permission engine + row-level filters
├── admin/
│   └── handler.ts           # Admin CRUD for metadata + export/import
├── multi-app/               # Database-per-app isolation
│   ├── manager.ts           # AppManager (create, load, delete apps)
│   ├── context.ts           # AppContext (per-app handlers + registry)
│   ├── platform-handler.ts  # Platform API (app CRUD)
│   └── app-routes.ts        # Route registration for all app endpoints
├── storage/                 # File storage interface + local disk impl
├── instrument/              # Request tracing, event buffering, stats
└── ai/                      # AI schema generation
```

## Core Concepts

### Dynamic REST API
Single set of handlers serves all entities via `/api/:app/:entity`:
- `GET    /api/:app/:entity`       — list (filter, sort, paginate)
- `GET    /api/:app/:entity/:id`   — get by ID
- `POST   /api/:app/:entity`       — create
- `PUT    /api/:app/:entity/:id`   — update
- `DELETE /api/:app/:entity/:id`   — delete (soft or hard)

### Entity Metadata (JSON)
```json
{
  "name": "customer",
  "table": "customers",
  "primary_key": { "field": "id", "type": "uuid", "generated": true },
  "soft_delete": true,
  "fields": [
    { "name": "id", "type": "uuid", "required": true },
    { "name": "name", "type": "string", "required": true },
    { "name": "email", "type": "string", "required": true, "unique": true },
    { "name": "status", "type": "string", "enum": ["active", "inactive"] },
    { "name": "created_at", "type": "timestamp", "auto": "create" }
  ]
}
```

**Field types:** uuid, string, text, int, bigint, float, decimal, boolean, timestamp, date, json, file

### Relations
- **one_to_one**, **one_to_many**, **many_to_many** (with join table)
- Loaded via `?include=items,customer` (separate queries, no cartesian product)
- Write modes: `diff` (merge), `replace` (full truth), `append` (additive)
- Ownership + on_delete policies (cascade, set_null, restrict, detach)

### Nested Writes
Atomic parent+children in a single transaction:
1. Plan phase — validate fields, separate relations, build operations
2. Execute phase — run in transaction with rules, state machines, webhooks

### Validation & Rules
- **Field rules:** required, unique, enum, type checking
- **Expression rules:** JS expressions evaluated at runtime (`record.amount > 0`)
- **Computed fields:** Auto-set values before write

### State Machines
- Define transitions on a state field (from → to)
- Guards (expressions that must be true)
- Actions (set_field, webhook, create_record)

### Workflows
- Triggered by state changes
- Step types: action, condition, approval
- Multi-step approval chains with deadlines/timeouts
- Background scheduler for timeout processing

### Authentication & Permissions
- JWT (15-min access + 7-day refresh tokens)
- Whitelist RBAC — no permission row = denied, admin bypasses all
- Row-level security filters injected into queries
- Per-app JWT secrets

### Webhooks
- Sync (fire before commit, non-2xx rolls back) and async (after commit)
- Retry with exponential backoff
- Logged to `_webhook_logs`

### Multi-App (Database-per-App)
- Management DB: `rocket` (shared `_apps`, `_platform_users`)
- Each app gets its own database + AppContext (registry, handlers, auth)
- Route pattern: `/api/:app/<route>`

### Auto-Migration
Entity metadata changes automatically trigger `CREATE TABLE` / `ALTER TABLE`.

### File Uploads
- `POST /api/:app/_files/upload` — multipart upload
- Stored on local disk, metadata as JSONB in DB
- File field type links records to uploads

## API Patterns

### Query Parameters
- `?filter[field]=value` or `?filter[field.op]=value` (eq, neq, gt, gte, lt, lte, in, not_in, like)
- `?sort=field,-field` (- prefix = DESC)
- `?page=1&per_page=25`
- `?include=rel1,rel2`

### Response Format
```json
{ "data": {}, "meta": { "page": 1, "per_page": 25, "total": 100 } }
```

### Error Format
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [] } }
```

## Admin API

All at `/api/:app/_admin/*`:
- Entities, Relations, Rules, State Machines CRUD
- Workflows, Permissions, Users, Webhooks CRUD
- `GET /export` — export all metadata as JSON
- `POST /import` — idempotent schema import
- AI schema generation from natural language prompts

## Examples

`/home/rajesh/work/rocket-backend/examples/` contains ready-to-import JSON configs:
- **Backend schemas:** Entity/relation/rule definitions (helpdesk-ticketing, content-management, employee-management, skills-assessment)
- **Frontend configs:** Corresponding UI configurations
- Can be imported directly via the admin UI's import feature

## Admin & Client UIs

- **Admin UI:** `/home/rajesh/work/rocket-backend/admin/` — SolidJS + Tailwind, manages all metadata
- **Client UI:** `/home/rajesh/work/rocket-backend/client/` — Sample app template for end-user CRUD

## Running

```bash
# Backend
cd /home/rajesh/work/rocket-backend/backend/expressjs
npm install && npx tsx src/index.ts   # starts on :8080

# Admin UI
cd /home/rajesh/work/rocket-backend/admin
npm install && npm run dev            # starts on :5173
```
