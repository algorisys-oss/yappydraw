# Agentic Slide Generation — Design Document

## Overview

The AI slide generator supports two modes: **Quick** (single LLM call) and **Deep** (2-stage agentic pipeline). Deep mode produces richer, more substantive presentations by separating content creation from visual design.

## Problem

Single-shot slide generation asks one LLM call to simultaneously:
1. Research the topic
2. Write substantive content
3. Choose visual layouts (slideType, palette, icons)
4. Structure the narrative arc

This results in generic, shallow slides because the model spreads its attention across all four concerns.

## Solution: 2-Stage Agentic Pipeline

```
User Prompt
    │
    ▼
┌──────────────────────────────────┐
│  Stage 1: Content Agent          │  temperature: 0.7
│  - Research topic deeply         │  ~5-8s
│  - Write substantive content     │
│  - Structure narrative arc       │
│  - Mark slide "intent" (not type)│
│  Output: sections + slides +     │
│          intent + content fields  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Stage 2: Visual Designer Agent  │  temperature: 0.3
│  - Map intent → slideType        │  ~3-5s
│  - Choose color palette          │
│  - Pick icons for card-grids     │
│  - Insert section-break slides   │
│  Output: final JSON spec         │
│  (same format as Quick mode)     │
└──────────────┬───────────────────┘
               │
               ▼
      slide-element-factory → Canvas
```

## Stage 1: Content Agent

**System prompt**: `frontend/src/ai/slide-content-prompt.ts`

The content agent focuses purely on **what to say**. It uses semantic "intent" labels instead of visual slide types:

| Intent | Purpose |
|--------|---------|
| `title` | Opening slide |
| `stats` | Data-driven metrics and KPIs |
| `points` | Key talking points / bullet list |
| `story` | Narrative or explanatory paragraph |
| `comparison` | Side-by-side contrasting |
| `features` | Feature showcase with descriptions |
| `roadmap` | Timeline of milestones |
| `quote` | Impactful statement |
| `overview` | Two-column parallel information |
| `closing` | Final slide / CTA |

### Content Agent Output Schema

```json
{
  "title": "Deck Title",
  "toneSuggestion": "professional | energetic | technical | creative | minimal",
  "sections": [
    {
      "sectionTitle": "Section Name",
      "slides": [
        {
          "intent": "stats",
          "title": "Short Title",
          "content": {
            "metrics": [{ "value": "$12M", "label": "Revenue (+35% YoY)" }]
          }
        }
      ]
    }
  ]
}
```

## Stage 2: Visual Designer Agent

**System prompt**: `frontend/src/ai/slide-visual-prompt.ts`

The visual agent receives the content agent's JSON output and maps it to the rendering system's slide types:

| Content Intent | → Best SlideType |
|---|---|
| title | → title |
| stats | → metrics |
| points | → content / bullets |
| story | → content / image-text |
| comparison | → comparison |
| features | → card-grid |
| roadmap | → timeline |
| quote | → quote |
| overview | → two-column |
| closing | → closing |

It also:
- Chooses the color palette based on topic tone
- Picks icons for card-grid items
- Inserts section-break slides between sections
- Ensures visual variety (3+ different slide types)

### Visual Agent Output

Same JSON format as the single-shot Quick mode — directly consumed by `createSlideElements()`.

## Fallback: Heuristic Mapping

If the Visual Agent call fails (network error, rate limit, parse failure), a **heuristic fallback** maps content intents to slide types using deterministic rules. This ensures the user always gets a result, even if it's less visually optimized.

Located in `slide-generator.ts` → `heuristicVisualMapping()`.

## UX

The AI Slides Dialog offers a **Quick | Deep** toggle:

- **Quick**: Single LLM call, ~4s, good for drafts
- **Deep**: 2-stage pipeline, ~10-12s, richer content and better layout choices

Progress indicator shows which stage is active:
- "Researching and writing content..."
- "Designing visual layout..."

## Files

| File | Role |
|------|------|
| `frontend/src/ai/slide-content-prompt.ts` | Stage 1 system prompt |
| `frontend/src/ai/slide-visual-prompt.ts` | Stage 2 system prompt |
| `frontend/src/ai/slide-generator.ts` | Orchestrator (dispatches quick/deep) |
| `frontend/src/ai/slide-system-prompt.ts` | Quick mode prompt (unchanged) |
| `frontend/src/components/ai-slides-dialog.tsx` | UI with mode toggle |

## Future Enhancements

### Web Search Integration (Stage 0)
Add a research stage before content writing that uses a web search API (Brave, Serper) to gather real-time data, statistics, and quotes. This would make slides factually current.

```
Stage 0: Web Research → Stage 1: Content Writer → Stage 2: Visual Designer
```

### Speaker Notes Agent
A post-processing agent that generates speaker notes for each slide — what to say when presenting. High value for users who want a complete presentation kit.

### Refinement Agent
A quality review pass that checks for:
- Text overflow (too many bullets, titles too long)
- Visual monotony (5 content slides in a row)
- Consistency (naming conventions, formatting)
- Data accuracy cross-referencing

### Model Strategy Optimization
- Stage 1 (Content): Use full-capability model (Sonnet/Opus) for content quality
- Stage 2 (Visual): Use faster/cheaper model (Haiku) since it's just mapping content to layout types

This requires the AI settings to expose model selection per-stage, or auto-selecting based on available models.

### Parallel Execution
For very large decks (30+ slides), split sections across parallel content agent calls, then merge results before visual design. This could cut Stage 1 time significantly.
