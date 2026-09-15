import { b as x, c as S } from "./ai-providers-CycU8sO1.js";
import { b as u, _ as A, s as C, f as y, z as M, g as D } from "./index-CnqZ5pDK.js";
const P = 'You are a senior graphic designer. Reply with ONLY a JSON object, no markdown fences, matching exactly: {"headline": string (max 6 words), "subhead": string (max 12 words), "bullets": string[] (0-4 short items), "cta": string (max 5 words, optional), "palette": {"background": hex, "primary": hex, "accent": hex, "text": hex}}. The palette must be harmonious with strong text/background contrast.';
function $(r) {
  try {
    const e = r.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""), n = JSON.parse(e);
    return !n?.headline || !n?.palette?.background ? null : n;
  } catch {
    return null;
  }
}
let T = 0;
const k = (r) => `${r}-${Date.now()}-${++T}`, p = {
  roughness: 0,
  angle: 0,
  renderStyle: "architectural",
  locked: !1,
  link: null,
  layerId: "default-layer",
  strokeStyle: "solid",
  opacity: 100,
  roundness: null,
  seed: () => Math.floor(Math.random() * 2 ** 31)
}, f = (r, e, n, t, o, s, i, a = {}) => ({
  id: k("text"),
  type: "text",
  x: e,
  y: n,
  width: t,
  height: o,
  text: r,
  fontSize: s,
  fontFamily: "poppins",
  textAlign: "center",
  verticalAlign: "top",
  textColor: i,
  strokeColor: "transparent",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 0,
  ...p,
  seed: p.seed(),
  ...a
}), m = (r, e, n, t, o = {}) => ({
  id: k("rect"),
  type: "rectangle",
  x: r,
  y: e,
  width: n,
  height: t,
  strokeColor: "transparent",
  backgroundColor: "#ffffff",
  fillStyle: "solid",
  strokeWidth: 0,
  ...p,
  seed: p.seed(),
  ...o
});
function v(r, e, n, t, o) {
  const s = r.palette, i = Math.min(t, o), a = [];
  a.push(m(e, n, t, o, {
    backgroundColor: s.background,
    fillStyle: "linear",
    gradientStops: [
      { color: s.background, offset: 0 },
      { color: s.primary, offset: 1 }
    ],
    gradientDirection: 135
  }));
  const g = t * 0.14;
  a.push(m(e + (t - g) / 2, n + o * 0.14, g, i * 0.012, { backgroundColor: s.accent })), a.push(f(
    r.headline,
    e + t * 0.08,
    n + o * 0.18,
    t * 0.84,
    o * 0.2,
    Math.round(i * 0.085),
    s.text,
    { fontWeight: "bold" }
  ));
  let c = n + o * 0.4;
  r.subhead && (a.push(f(
    r.subhead,
    e + t * 0.1,
    c,
    t * 0.8,
    o * 0.1,
    Math.round(i * 0.04),
    s.text,
    { opacity: 88 }
  )), c += o * 0.13);
  const h = (r.bullets || []).slice(0, 4);
  if (h.length > 0 && a.push(f(
    h.map((l) => `•  ${l}`).join(`
`),
    e + t * 0.12,
    c,
    t * 0.76,
    o * 0.28,
    Math.round(i * 0.032),
    s.text,
    { textAlign: "left", opacity: 92 }
  )), r.cta) {
    const l = t * 0.44, d = i * 0.085, b = n + o * 0.86 - d / 2;
    a.push(m(e + (t - l) / 2, b, l, d, {
      backgroundColor: s.accent,
      borderRadius: d / 2
    })), a.push(f(
      r.cta,
      e + (t - l) / 2,
      b + d * 0.22,
      l,
      d * 0.6,
      Math.round(i * 0.032),
      s.background,
      { fontWeight: "bold", verticalAlign: "middle" }
    ));
  }
  return a;
}
async function Y(r, e = { width: 1080, height: 1080 }) {
  const { provider: n, model: t, apiKey: o } = x();
  if (!o)
    return u("Add an API key in AI Settings first", "error"), !1;
  if (!r.trim()) return !1;
  u("Generating design…", "info");
  const s = await S({
    provider: n,
    model: t,
    apiKey: o,
    systemPrompt: P,
    userPrompt: `Design brief: ${r.trim()}
Format: ${e.width}×${e.height}px.`,
    temperature: 0.8,
    maxTokens: 800
  });
  if (!s.success)
    return u(s.error || "Design generation failed", "error"), !1;
  const i = $(s.content);
  if (!i)
    return u("The AI returned an unusable design — try again", "error"), !1;
  A("design", e);
  const a = C.slides[0], g = a?.spatialPosition.x ?? 0, c = a?.spatialPosition.y ?? 0, h = v(i, g, c, e.width, e.height);
  return y("elements", h), y("selection", []), M(), D(), u("Design generated — edit away", "success"), !0;
}
export {
  v as buildDesignElements,
  Y as generateDesign
};
