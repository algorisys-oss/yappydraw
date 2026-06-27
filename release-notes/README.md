# Release notes

One Markdown file per shipped version: `release-notes/<version>.md` (e.g.
`0.5.2.md`). Created as part of the **"ship it"** workflow (see `CLAUDE.md`) —
never skipped. Newest at the top of the index below.

## Template

```markdown
# <version> — <short title> (<YYYY-MM-DD>)

## Highlights
- One-line, user-facing summary of the headline change(s).

## Features
- New capabilities (with the `window.Yappy` API where relevant).

## Fixes
- Bugs fixed (link the symptom → cause briefly).

## Internal / tests / docs
- Infra, test, refactor, doc changes.

## Breaking changes / migration
- Anything users/integrations must adjust (or "None").
```

## Index

- [0.5.2](0.5.2.md) — DSL parser strictness + full test-suite cleanup
- [0.5.1](0.5.1.md) — deleteSlide fix
- [0.5.0](0.5.0.md) — Illustrator-parity baseline + version reset

> Versioning reset to **0.5.0** on 2026-06-27 (continuing from there). Prior
> internal `0.27.x` history rolled into the 0.5.0 baseline note.
