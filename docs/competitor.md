# Competitor Analysis: Presenti.ai

> **Date:** 2026-02-28
> **Source:** https://presenti.ai/

## Overview

Presenti.ai is an AI-powered presentation tool that converts text, documents, and mind maps into polished slide decks. It focuses on **AI content generation** and **document-to-slides conversion** rather than manual design or animation. Yappy's strengths (animations, sketch rendering, infinite canvas, WASM performance) are complementary — Presenti excels where Yappy has gaps.

---

## Feature Comparison

| Feature | Presenti.ai | Yappy | Gap |
|---|---|---|---|
| Text-to-Presentation (AI) | Yes | No | HIGH |
| Word/PDF import → slides | Yes | No | HIGH |
| Markdown → slides | Yes | No | MEDIUM |
| Mind Map → slides (Xmind) | Yes | No | LOW |
| AI Auto-Layout & Design | Yes | No | HIGH |
| AI Content Rewrite/Polish | Yes | No | MEDIUM |
| Template Library | Yes (industry-specific) | No | HIGH |
| Brand Kit (logo, fonts, colors) | Yes | Partial (themes) | MEDIUM |
| Auto Icon Insertion | Yes | No | LOW |
| Real-time Collaboration | Yes | No | HIGH |
| PPTX Export | Yes | No | HIGH |
| PDF Export | Yes | No | MEDIUM |
| Rich Animations | No | Yes (20+ types) | Yappy advantage |
| Kinetic Typography | No | Yes | Yappy advantage |
| Infinite Canvas | No | Yes | Yappy advantage |
| Sketch/Hand-drawn Style | No | Yes (RoughJS) | Yappy advantage |
| Shape Connectors & Flowcharts | No | Yes | Yappy advantage |
| Layers System | No | Yes | Yappy advantage |
| WASM-accelerated Rendering | No | Yes | Yappy advantage |
| Data Structure Visualizations | No | Yes | Yappy advantage |
| Pen/Ink/Brush Tools | No | Yes | Yappy advantage |
| Code Block Animations | No | Yes | Yappy advantage |

---

## Actionable Feature Tasks (Prioritized)

### P0 — High Impact, Differentiating

#### 1. AI Slide Generator (Text-to-Presentation)
- [ ] Design prompt UI (topic input, optional style/tone selection)
- [ ] Build LLM integration for slide content generation (title, bullets, speaker notes)
- [ ] Auto-create slide deck from generated content (layout assignment per slide type)
- [ ] Support follow-up prompts ("make it more concise", "add a summary slide")
- [ ] Store generated content in existing slide data model

#### 2. Template Library
- [ ] Design template data format (slide layouts, color palettes, typography presets)
- [ ] Create 10–15 starter templates (pitch deck, education, report, creative, minimal, corporate)
- [ ] Build template picker UI (gallery with preview thumbnails)
- [ ] Apply template to new or existing presentation (restyle without losing content)
- [ ] Allow saving custom templates from existing slides

#### 3. PPTX Export
- [ ] Research JS PPTX generation libraries (pptxgenjs, officegen)
- [ ] Map Yappy element types → PPTX equivalents (text, shapes, images, tables)
- [ ] Handle slide dimensions, backgrounds, and transitions
- [ ] Handle rich text formatting (bold, italic, colors, sizes)
- [ ] Handle grouped elements and connectors
- [ ] Add "Export as PPTX" option to export menu

### P1 — High Value, Moderate Effort

#### 4. Document Import (PDF / Word / Markdown → Slides)
- [ ] Markdown → slides: Parse headings as slide breaks, bullets as content
- [ ] PDF → slides: Extract text per page, map to slide content
- [ ] Word → slides: Parse docx structure (headings, paragraphs, images)
- [ ] Build import dialog with file upload and preview
- [ ] Map extracted content to template layouts automatically

#### 5. PDF Export
- [ ] Render each slide to high-resolution canvas
- [ ] Assemble pages into PDF (jspdf or pdf-lib)
- [ ] Preserve text as selectable text (not just rasterized image)
- [ ] Handle multi-slide documents with correct page sizes
- [ ] Add "Export as PDF" option to export menu

#### 6. AI Auto-Layout
- [ ] Analyze content density per slide (text length, element count)
- [ ] Suggest layout templates (title-only, two-column, image+text, full-bleed)
- [ ] Auto-position and resize elements to match layout grid
- [ ] Color palette generation from a seed color or image
- [ ] Typography pairing suggestions

### P2 — Nice to Have

#### 7. AI Content Rewrite
- [ ] Add "Rewrite" button on text elements and slides
- [ ] LLM integration to rephrase, shorten, or expand text
- [ ] Tone options (professional, casual, persuasive, academic)
- [ ] Preserve formatting while replacing content

#### 8. Brand Kit
- [ ] Design brand kit settings UI (logo upload, primary/secondary colors, font selection)
- [ ] Save brand kit per document or globally
- [ ] "Apply Brand" action to restyle entire presentation
- [ ] Auto-apply brand kit to AI-generated slides

#### 9. Real-time Collaboration
- [ ] WebSocket or CRDT-based sync architecture
- [ ] Cursor presence (show collaborator cursors)
- [ ] Conflict resolution for concurrent edits
- [ ] User avatars and permissions (viewer, editor, owner)
- [ ] Share link generation

#### 10. Auto Icon Insertion
- [ ] Integrate icon library (Lucide, Phosphor, or similar)
- [ ] AI-powered icon suggestions based on slide content keywords
- [ ] Icon search and browse UI
- [ ] Drag-and-drop icon placement

---

## Implementation Notes

- **AI features (1, 6, 7)** require an LLM backend (Claude API recommended). Can start with a simple prompt-based approach and iterate.
- **PPTX Export (3)** is the most requested presentation feature globally. `pptxgenjs` is the most mature JS library for this.
- **Template Library (2)** can start small (5 templates) and grow. Templates are just pre-configured slide+element JSON.
- **Document Import (4)** can leverage existing markdown parsers and `pdf.js` for PDF text extraction.
- **Collaboration (9)** is the largest engineering effort. Consider Yjs or Automerge for CRDT-based sync. This is a P2 because it requires server infrastructure.

## References

- https://presenti.ai/
- https://ppt.softtooler.com/blog/reviews/presenti-ai-review/
- https://www.bestaitools.com/tool/presenti/
