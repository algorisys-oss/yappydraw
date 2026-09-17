import { h as T, b as C, c as k } from "./ai-providers-CycU8sO1.js";
import { a1 as A, a2 as N, a3 as v, a4 as x, G as L } from "./index-DDQUjBae.js";
const R = `You are a presentation design assistant. Given a topic or description, generate a structured JSON slide deck.

## Output Format
Return ONLY a JSON object (no markdown fences, no explanation) with this exact schema:

{
  "title": "Deck Title",
  "colorPalette": "corporate" | "forest" | "royal" | "sunset" | "dark" | "minimalist",
  "slides": [
    {
      "slideType": "title" | "content" | "two-column" | "bullets" | "quote" | "section-break" | "closing" | "image-text" | "metrics" | "timeline" | "card-grid" | "comparison",
      "title": "Slide Title",
      "subtitle": "Optional subtitle (title/closing/section-break only)",
      "bullets": ["Bullet 1", "Bullet 2"],
      "body": "Longer paragraph text",
      "quote": { "text": "Quote text", "attribution": "Speaker Name" },
      "leftColumn": ["Left item 1", "Left item 2"],
      "rightColumn": ["Right item 1", "Right item 2"],
      "metrics": [{ "value": "95%", "label": "Customer Satisfaction" }],
      "timelineItems": [{ "year": "2023", "text": "Company founded" }],
      "cards": [{ "title": "Feature", "body": "Description", "icon": "gear" }],
      "comparisonLeft": { "title": "Before", "items": ["Item 1", "Item 2"] },
      "comparisonRight": { "title": "After", "items": ["Item 1", "Item 2"] },
      "backgroundColor": "#hex (optional, overrides palette)"
    }
  ]
}

## Slide Types

### Basic Types
- **title**: Opening slide with large centered title + optional subtitle
- **content/bullets**: Title + bullet list or body paragraph
- **two-column**: Title + two side-by-side lists (for leftColumn/rightColumn)
- **quote**: Centered quote with optional attribution
- **section-break**: Bold section divider with gradient background
- **closing**: Final slide with title + optional CTA/contact subtitle
- **image-text**: Split layout with text on left, visual placeholder on right

### Rich Types (use these for visual impact)
- **metrics**: 3-4 large KPI cards in a row. Provide "metrics" array: [{ "value": "2.5M", "label": "Active Users" }]. Great for stats, KPIs, revenue figures, growth numbers.
- **timeline**: Horizontal timeline with milestone dots. Provide "timelineItems" array: [{ "year": "Q1 2024", "text": "Beta launch" }]. Great for roadmaps, history, milestones (max 6 items).
- **card-grid**: 2-6 cards in a grid with optional icons. Provide "cards" array: [{ "title": "Card Title", "body": "Description", "icon": "gear" }]. Available icons: gear, target, lightbulb, trophy, rocket, flag, star, heart, shield, key, book, eye, clock, check, chart, user. Great for features, services, team, benefits.
- **comparison**: Two side-by-side comparison panels with headers. Provide "comparisonLeft" and "comparisonRight": { "title": "Plan A", "items": ["Feature 1", "Feature 2"] }. Great for before/after, pros/cons, plan tiers.

## Color Palettes
- corporate: Professional blue (#3498db primary, white background)
- forest: Nature green (#27ae60 primary, light gray background)
- royal: Rich purple (#8b5cf6 primary, light purple background)
- sunset: Warm orange (#f97316 primary, warm white background)
- dark: Dark theme (#60a5fa primary, dark background, light text)
- minimalist: Clean slate (#334155 primary, white background)

## Rules
1. Generate the number of slides requested by the user. If no count is specified, default to 6–12 slides based on content complexity. For large decks (20+ slides), organize content into clear sections with section-break slides between them.
2. Always start with a "title" slide and end with a "closing" slide.
3. Use at least 3 different slide types per deck for visual variety.
4. Keep bullet points concise (max 8 words each, max 6 bullets per slide).
5. Use "section-break" slides to separate major sections (2–3 per deck).
6. Use "metrics" for KPIs, statistics, revenue, or data highlights.
7. Use "timeline" for roadmaps, history, company milestones, or project phases.
8. Use "card-grid" for features, services, team members, or benefits.
9. Use "comparison" for before/after, pros/cons, or plan tier comparisons.
10. Use "two-column" for comparing two concepts or parallel lists.
11. Use "quote" for impactful statements or key takeaways.
12. Content should be specific and substantive, not generic placeholder text.
13. Match the color palette to the topic tone (e.g., "dark" for tech, "corporate" for business).
14. Each slide's title should be short (max 5 words).
15. For section-break slides, use the palette's secondary color as backgroundColor.
16. Include at least one "metrics" or "card-grid" slide per deck for visual richness.
17. **Product expansion**: When multiple products or services are mentioned, give each product its own section-break + dedicated slides. Each product should get at least one "card-grid" slide showing its core features (with icons) and one additional slide (metrics, content, or comparison). Don't collapse multiple products into a single bullet list.
18. If URLs or websites are mentioned, use your knowledge to extract real product details, features, and capabilities — not generic descriptions.
`;
function q(t, e) {
  let i = t;
  return e?.style && e.style !== "auto" && (i += `

Use the "${e.style}" color palette.`), e?.slideCount && (i += `

Generate exactly ${e.slideCount} slides.`), i;
}
const E = `You are a presentation content strategist. Given a topic, research it thoroughly and produce structured slide content with a compelling narrative arc.

## Your Role
You focus ONLY on **content quality** — what to say, not how to show it. A separate visual designer will handle layout and styling.

## Output Format
Return ONLY a JSON object (no markdown fences, no explanation) with this schema:

{
  "title": "Deck Title",
  "toneSuggestion": "professional" | "energetic" | "technical" | "creative" | "minimal",
  "sections": [
    {
      "sectionTitle": "Section Name",
      "slides": [
        {
          "intent": "title" | "stats" | "points" | "story" | "comparison" | "features" | "roadmap" | "quote" | "overview" | "closing",
          "title": "Short Slide Title",
          "content": { ... see content fields below }
        }
      ]
    }
  ]
}

## Intent Types and Content Fields

Each slide has an "intent" describing its communication purpose. Include the matching content fields:

### "title"
Opening slide. Content: { "subtitle": "Tagline or description" }

### "stats"
Data-driven slide with key metrics. Content: { "metrics": [{ "value": "95%", "label": "Customer Satisfaction" }] }
- Include 3-4 metrics with specific, real/plausible numbers
- Add context in labels (e.g. "+18% YoY", "vs 72% industry avg")

### "points"
Key talking points or arguments. Content: { "bullets": ["Point 1", "Point 2", ...] }
- Max 6 bullets, each max 10 words
- Alternatively use "body" for a paragraph: { "body": "Longer text..." }

### "story"
Narrative or explanatory content. Content: { "body": "Paragraph text explaining a concept or telling a story" }

### "comparison"
Side-by-side comparison. Content: { "leftTitle": "Before", "rightTitle": "After", "leftItems": ["Item 1"], "rightItems": ["Item 1"] }
- Good for before/after, pros/cons, two plans, two approaches

### "features"
Feature showcase with descriptions. Content: { "cards": [{ "title": "Feature Name", "body": "One-line description", "icon": "gear" }] }
- 2-6 cards per slide
- Available icons: gear, target, lightbulb, trophy, rocket, flag, star, heart, shield, key, book, eye, clock, check, chart, user

### "roadmap"
Timeline of milestones or phases. Content: { "timelineItems": [{ "year": "Q1 2025", "text": "Milestone description" }] }
- Max 6 items chronologically ordered

### "quote"
Impactful quote or key takeaway. Content: { "text": "The quote text", "attribution": "Speaker Name, Title" }

### "overview"
Two-column layout for parallel information. Content: { "leftColumn": ["Item 1", "Item 2"], "rightColumn": ["Item 1", "Item 2"] }

### "closing"
Final slide. Content: { "subtitle": "Call to action or closing message" }

## Rules
1. Generate the number of slides requested. If no count specified, default to 6-12 based on topic complexity. For 20+ slides, organize into 3-5 clear sections.
2. Always start with a "title" slide and end with a "closing" slide.
3. Group slides into logical sections (e.g. "Problem", "Solution", "Evidence", "Next Steps").
4. Write **specific, substantive content** — not generic placeholder text. Include real or plausible:
   - Statistics and metrics with sources or context
   - Named examples, companies, technologies
   - Specific dates, quarters, years
   - Dollar amounts, percentages, growth rates
5. Use at least 3 different intent types per deck for variety.
6. Every deck should include at least one "stats" or "features" slide for data richness.
7. Use "comparison" when contrasting two things (before/after, options A vs B).
8. Use "roadmap" for any chronological progression (history, milestones, project phases).
9. Keep slide titles short (max 5 words).
10. Build a narrative arc: hook → context → evidence → insight → action.
11. For business topics, include real market data, industry benchmarks, and growth figures.
12. For technical topics, include architecture decisions, trade-offs, and concrete specs.

## Product & Service Expansion
When the prompt mentions multiple products, services, or offerings:
13. Give **each product/service its own dedicated section** with a section-break slide followed by 2-4 slides.
14. For each product, create at minimum: one "features" slide (core features as cards with icons) and one additional slide (stats, story, or comparison showing the product's value proposition).
15. Extract specific details: product name, tagline, core features, target audience, key differentiators, tech stack, and metrics.
16. If URLs or websites are mentioned, use your knowledge of those products/companies to provide accurate details. Include specific feature names, real capabilities, and actual use cases — not generic descriptions.
17. For company profiles with multiple products, structure as: Company Overview → Product 1 (section) → Product 2 (section) → ... → Combined Value / Why Us → Closing.
`;
function U(t, e) {
  let i = t;
  return e?.style && e.style !== "auto" && (i += `

Tone suggestion: "${e.style}" style.`), e?.slideCount && (i += `

Generate exactly ${e.slideCount} slides (across all sections).`), i;
}
const F = `You are a presentation visual designer. You receive structured slide content from a content strategist and your job is to map it to the optimal visual layout for each slide.

## Your Role
You focus ONLY on **visual design decisions** — which slide type, which palette, which icons. Do NOT rewrite or reduce the content. Preserve all text, metrics, and data exactly as provided.

## Input
You receive a JSON object with sections and slides, each slide having an "intent" and "content" fields.

## Output Format
Return ONLY a JSON object (no markdown fences, no explanation) with this schema:

{
  "title": "Deck Title (from input)",
  "colorPalette": "corporate" | "forest" | "royal" | "sunset" | "dark" | "minimalist",
  "slides": [
    {
      "slideType": "title" | "content" | "two-column" | "bullets" | "quote" | "section-break" | "closing" | "image-text" | "metrics" | "timeline" | "card-grid" | "comparison",
      "title": "Slide Title",
      "subtitle": "...",
      "bullets": ["..."],
      "body": "...",
      "quote": { "text": "...", "attribution": "..." },
      "leftColumn": ["..."],
      "rightColumn": ["..."],
      "metrics": [{ "value": "...", "label": "..." }],
      "timelineItems": [{ "year": "...", "text": "..." }],
      "cards": [{ "title": "...", "body": "...", "icon": "..." }],
      "comparisonLeft": { "title": "...", "items": ["..."] },
      "comparisonRight": { "title": "...", "items": ["..."] },
      "backgroundColor": "#hex (optional)"
    }
  ]
}

## Intent → SlideType Mapping Guide

| Content Intent | Best SlideType Options |
|---|---|
| title | → "title" |
| stats | → "metrics" (best for 3-4 KPIs), or "content" if just one stat |
| points | → "content" or "bullets" (for bullet lists), "image-text" (for body + visual) |
| story | → "content" (body paragraph), "image-text" (narrative + visual), "quote" (if impactful) |
| comparison | → "comparison" (side-by-side panels), "two-column" (lighter comparison) |
| features | → "card-grid" (best for 2-6 features with icons), "content" (for simple list) |
| roadmap | → "timeline" (horizontal milestone dots), "content" (if < 3 items) |
| quote | → "quote" (centered with attribution) |
| overview | → "two-column" (parallel info), "card-grid" (if items have descriptions) |
| closing | → "closing" |

## Color Palettes
Choose based on topic tone:
- **corporate**: Professional blue — business, finance, enterprise
- **forest**: Nature green — sustainability, health, growth
- **royal**: Rich purple — creative, luxury, innovation
- **sunset**: Warm orange — startup, energy, announcement
- **dark**: Dark theme — tech, engineering, dev tools
- **minimalist**: Clean slate — clean, modern, academic

## Section Breaks
Insert "section-break" slides between major sections from the input. Use the section title as the slide title and a brief tagline as subtitle. Set backgroundColor to the palette's darker color for contrast.

## Rules
1. Map EVERY slide from the input — do not drop any slides.
2. Preserve ALL content text exactly as provided. Do not shorten, simplify, or rewrite.
3. Use at least 3 different slideType values per deck for visual variety.
4. Add section-break slides between sections (they don't need to be in the input).
5. For "stats" intent, always prefer "metrics" slideType when there are 3-4 data points.
6. For "features" intent with icons, always use "card-grid" slideType.
7. For "roadmap" intent, always use "timeline" slideType.
8. For "comparison" intent, always use "comparison" slideType.
9. Ensure the first slide is "title" and the last is "closing".
10. Pick icons for card-grid from: gear, target, lightbulb, trophy, rocket, flag, star, heart, shield, key, book, eye, clock, check, chart, user.
11. If input has a toneSuggestion, use it to inform palette choice (but you may override if another palette fits better).
`;
async function J(t, e = {}, i) {
  return e.mode === "deep" ? D(t, e, i) : M(t, e, i);
}
async function M(t, e, i) {
  const a = performance.now();
  if (!T())
    return { success: !1, error: "No API key configured. Open AI Settings to add one." };
  const { provider: o, model: n, apiKey: u } = C(), d = q(t, {
    style: e.style,
    slideCount: e.slideCount || void 0
  }), p = e.slideCount || 10, r = Math.min(Math.max(p * 250, 4096), 16384);
  i?.("Generating slides...");
  const s = await k({
    provider: o,
    model: n,
    apiKey: u,
    systemPrompt: R,
    userPrompt: d,
    temperature: 0.7,
    maxTokens: r
  });
  if (!s.success)
    return { success: !1, error: s.error || "LLM request failed" };
  const c = P(s.content);
  return c.success ? g(c.data, a, s.usage) : { success: !1, error: c.error };
}
async function D(t, e, i) {
  const a = performance.now();
  if (!T())
    return { success: !1, error: "No API key configured. Open AI Settings to add one." };
  const { provider: o, model: n, apiKey: u } = C();
  i?.("Researching and writing content...");
  const d = U(t, {
    style: e.style,
    slideCount: e.slideCount || void 0
  }), p = e.slideCount || 10, r = Math.min(Math.max(p * 300, 4096), 16384), s = await k({
    provider: o,
    model: n,
    apiKey: u,
    systemPrompt: E,
    userPrompt: d,
    temperature: 0.7,
    maxTokens: r
  });
  if (!s.success)
    return { success: !1, error: `Content agent failed: ${s.error || "Unknown error"}` };
  const c = {
    promptTokens: s.usage?.promptTokens || 0,
    completionTokens: s.usage?.completionTokens || 0
  };
  let m;
  try {
    m = S(s.content);
  } catch {
    return { success: !1, error: "Content agent returned invalid JSON. Please try again." };
  }
  if (!m.sections || !Array.isArray(m.sections))
    return { success: !1, error: "Content agent returned no sections. Please try again." };
  i?.("Designing visual layout...");
  const y = m.sections.reduce(
    (h, O) => h + (O.slides?.length || 0),
    0
  ), b = Math.min(Math.max((y + 5) * 250, 4096), 16384), f = await k({
    provider: o,
    model: n,
    apiKey: u,
    systemPrompt: F,
    userPrompt: JSON.stringify(m),
    temperature: 0.3,
    maxTokens: b
  });
  if (!f.success) {
    i?.("Visual agent failed, applying heuristic layout...");
    const h = I(m, e.style);
    return g(h, a, c);
  }
  c.promptTokens += f.usage?.promptTokens || 0, c.completionTokens += f.usage?.completionTokens || 0;
  const w = P(f.content);
  if (!w.success) {
    i?.("Applying heuristic layout...");
    const h = I(m, e.style);
    return g(h, a, c);
  }
  return g(w.data, a, c);
}
function S(t) {
  let e = t.trim();
  e.startsWith("```") && (e = e.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
  try {
    return JSON.parse(e);
  } catch {
  }
  const i = e.indexOf("{"), a = e.lastIndexOf("}");
  if (i !== -1 && a > i)
    return JSON.parse(e.substring(i, a + 1));
  throw new Error("No valid JSON found");
}
function P(t) {
  let e;
  try {
    e = S(t);
  } catch {
    return { success: !1, error: "Failed to parse AI response as JSON. Please try again." };
  }
  return !e.slides || !Array.isArray(e.slides) || e.slides.length === 0 ? { success: !1, error: "AI returned no slides. Please try a different prompt." } : { success: !0, data: e };
}
function g(t, e, i) {
  const a = t.colorPalette || "corporate", o = v[a] || v.corporate, n = 2e3, u = [], d = [];
  t.slides.forEach((s, c) => {
    const m = c * n, y = A(s, o), b = N(y, m, 0), f = Y(b, s.slideType);
    u.push(...f), d.push({
      id: x("slide"),
      name: s.title || `Slide ${c + 1}`,
      spatialPosition: { x: m, y: 0 },
      dimensions: { width: 1920, height: 1080 },
      order: c,
      backgroundColor: s.backgroundColor || o.background,
      transition: G(s.slideType, c)
    });
  });
  const p = {
    version: 4,
    metadata: { name: t.title || "AI Presentation", docType: "slides" },
    elements: u,
    layers: [{ id: "default-layer", name: "Layer 1", visible: !0, locked: !1, opacity: 1, order: 0, backgroundColor: "transparent" }],
    slides: d,
    globalSettings: {}
  };
  L(p);
  const r = performance.now() - e;
  return {
    success: !0,
    slideCount: t.slides.length,
    title: t.title,
    duration: r,
    usage: i
  };
}
function G(t, e) {
  if (e === 0)
    return { type: "fade", duration: 600, easing: "easeInOutCubic" };
  switch (t) {
    case "title":
    case "closing":
      return { type: "fade", duration: 600, easing: "easeInOutCubic" };
    case "section-break":
      return { type: "zoom-in", duration: 500, easing: "easeOutCubic" };
    case "quote":
      return { type: "fade", duration: 700, easing: "easeInOutQuad" };
    default:
      return e % 3 === 0 ? { type: "fade", duration: 500, easing: "easeInOutQuad" } : { type: "slide-left", duration: 450, easing: "easeOutCubic" };
  }
}
function l(t, e = {}) {
  return {
    id: x("anim"),
    type: "preset",
    name: t,
    trigger: e.trigger || "on-load",
    delay: e.delay || 0,
    duration: e.duration || 600,
    easing: e.easing || "easeOutCubic",
    startHidden: e.startHidden ?? !0
  };
}
function Y(t, e) {
  const i = t.map((o) => ({
    el: o,
    role: B(o)
  }));
  let a = 0;
  for (const { el: o, role: n } of i)
    switch (n) {
      case "decorative":
        o.animations = [l("fadeIn", { duration: 800, delay: 0, startHidden: !1 })];
        break;
      case "title":
        o.animations = [l("slideInDown", { duration: 500, delay: 100 })];
        break;
      case "subtitle":
        o.animations = [l("fadeIn", { duration: 500, delay: 300 })];
        break;
      case "content-card":
        o.animations = [l("zoomIn", { duration: 400, delay: 200 + a * 120 })], a++;
        break;
      case "content-text":
        o.animations = [l("slideInLeft", { duration: 400, delay: 200 + a * 100 })], a++;
        break;
      case "metric-value":
        o.animations = [l("zoomIn", { duration: 500, delay: 200 + a * 150, easing: "easeOutBack" })], a++;
        break;
      case "shape-icon":
        o.animations = [l("zoomIn", { duration: 400, delay: 200 + a * 120 })], a++;
        break;
      case "timeline-dot":
        o.animations = [l("zoomIn", { duration: 300, delay: 300 + a * 150, easing: "easeOutBack" })], a++;
        break;
      case "accent":
        o.animations = [l("slideInLeft", { duration: 400, delay: 150, startHidden: !1 })];
        break;
      default:
        o.animations = [l("fadeIn", { duration: 500, delay: 100 + a * 80 })], a++;
        break;
    }
  if (e === "section-break")
    for (const { el: o, role: n } of i)
      n === "title" ? o.animations = [l("zoomIn", { duration: 600, delay: 100, easing: "easeOutBack" })] : n === "subtitle" ? o.animations = [l("fadeIn", { duration: 500, delay: 400 })] : o.animations = [l("fadeIn", { duration: 600, delay: 0, startHidden: !1 })];
  if (e === "quote")
    for (const { el: o, role: n } of i)
      n === "title" ? o.animations = [l("fadeIn", { duration: 800, delay: 200 })] : n === "subtitle" && (o.animations = [l("fadeIn", { duration: 500, delay: 600 })]);
  return t;
}
function B(t) {
  const e = t.id || "", i = t.type;
  if (e.startsWith("shape-") && (t.opacity ?? 100) <= 20 || e.startsWith("grad-") || e.startsWith("rect-") && t.width >= 1800 && t.height >= 900) return "decorative";
  if (e.startsWith("card-")) return "content-card";
  if (e.startsWith("shape-") && (t.opacity ?? 100) > 20)
    return t.width <= 60 && t.height <= 60 ? "shape-icon" : i === "circle" && t.width <= 30 ? "timeline-dot" : "shape-icon";
  if (i === "text") {
    const a = t.fontSize || 28;
    return a >= 36 ? "title" : a <= 20 ? "subtitle" : a >= 48 ? "metric-value" : "content-text";
  }
  return e.startsWith("rect-") && (t.height <= 6 || t.width <= 6) ? "accent" : e.startsWith("rect-") ? "decorative" : "unknown";
}
function I(t, e) {
  const i = {
    title: "title",
    stats: "metrics",
    points: "content",
    story: "content",
    comparison: "comparison",
    features: "card-grid",
    roadmap: "timeline",
    quote: "quote",
    overview: "two-column",
    closing: "closing"
  }, o = e && e !== "auto" ? e : {
    professional: "corporate",
    energetic: "sunset",
    technical: "dark",
    creative: "royal",
    minimal: "minimalist"
  }[t.toneSuggestion] || "corporate", n = [];
  for (const u of t.sections || []) {
    n.length > 0 && n.push({
      slideType: "section-break",
      title: u.sectionTitle || "Section"
    });
    for (const d of u.slides || []) {
      const r = {
        slideType: i[d.intent] || "content",
        title: d.title
      }, s = d.content || {};
      switch (d.intent) {
        case "title":
        case "closing":
          r.subtitle = s.subtitle;
          break;
        case "stats":
          r.metrics = s.metrics;
          break;
        case "points":
          r.bullets = s.bullets, r.body = s.body;
          break;
        case "story":
          r.body = s.body;
          break;
        case "comparison":
          r.comparisonLeft = { title: s.leftTitle || "Option A", items: s.leftItems || [] }, r.comparisonRight = { title: s.rightTitle || "Option B", items: s.rightItems || [] };
          break;
        case "features":
          r.cards = s.cards;
          break;
        case "roadmap":
          r.timelineItems = s.timelineItems;
          break;
        case "quote":
          r.quote = { text: s.text, attribution: s.attribution };
          break;
        case "overview":
          r.leftColumn = s.leftColumn, r.rightColumn = s.rightColumn;
          break;
      }
      n.push(r);
    }
  }
  return {
    title: t.title,
    colorPalette: o,
    slides: n
  };
}
export {
  J as generatePresentation
};
