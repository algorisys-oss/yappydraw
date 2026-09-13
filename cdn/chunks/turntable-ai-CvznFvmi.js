import { s as A, b as t, e as I, t as $, c as S, p as R, d as k, f as v, g as M } from "./index-BaeYsOfX.js";
import { g as x, l as j, c as D } from "./ai-providers-CycU8sO1.js";
import { p as O } from "./image-utils-CJQBaGoQ.js";
function P() {
  return [
    'You are a vector-art "turntable" assistant for YappyDraw.',
    "You receive a raster snapshot of a flat 2D vector illustration plus a target 3D viewpoint.",
    "Redraw the SAME subject as it would look rotated to that viewpoint, as clean 2D vector art,",
    "and return it as a single self-contained SVG document.",
    "",
    "Rules:",
    "- Output ONLY the SVG markup. No prose, no markdown code fences, no explanation.",
    '- Use <path d="…"> elements with an explicit fill (and a stroke where the original has an outline).',
    "  Keep the original colour palette.",
    "- Keep it recognizably the SAME object — same style and colours — just seen from the new angle.",
    "- Invent parts that become newly visible from the rotation (a limb, a side, the far face) so the",
    "  result reads as a coherent solid object, not a flat card.",
    "- Prefer a modest number of smooth paths over thousands of tiny segments.",
    "- Give the <svg> a viewBox that tightly frames the art."
  ].join(`
`);
}
function T(s) {
  if (!s) return null;
  const o = s.match(/```(?:svg|xml|html)?\s*([\s\S]*?)```/i), i = (o ? o[1] : s).match(/<svg[\s\S]*<\/svg>/i);
  return i ? i[0] : null;
}
async function G(s, o) {
  const e = A.elements.find((a) => a.id === s);
  if (!e) return { success: !1, error: "Element not found" };
  const i = j(), c = i.activeProvider, l = i.providers[c], r = x(c);
  if (!r)
    return t("Add an API key in AI Settings first", "error"), { success: !1, error: "No API key" };
  const h = Math.round(o?.yaw ?? e.turntable?.yaw ?? 0), m = Math.round(o?.pitch ?? e.turntable?.pitch ?? 0), n = Math.max(8, Math.round(Math.max(e.width, e.height) * 0.1)), p = I(e.x - n, e.y - n, e.width + n * 2, e.height + n * 2, "tt-src", 2, !1);
  if (!p)
    return t("Could not rasterize the selection", "error"), { success: !1, error: "rasterize failed" };
  const { base64: g, mediaType: f } = O(p), b = `The attached image is a 2D vector drawing. Redraw it as it would appear rotated ${h}° about the vertical axis${m ? ` and tilted ${m}° about the horizontal axis` : ""}, turning the object in 3D toward that viewpoint. Invent any parts that become newly visible so it reads as a coherent solid. Return ONLY a single <svg>…</svg> of clean vector paths, preserving the original colours.`;
  t(`Reconstructing at ${h}°…`, "info");
  let u;
  try {
    u = await D({
      provider: c,
      model: l.model,
      apiKey: r,
      systemPrompt: P(),
      userPrompt: b,
      images: [{ base64: g, mediaType: f }],
      temperature: 0.2,
      maxTokens: 8192
    });
  } catch (a) {
    return t(`AI request failed: ${a.message}`, "error"), { success: !1, error: a.message };
  }
  if (!u.success || !u.content)
    return t(u.error ?? "AI request failed", "error"), { success: !1, error: u.error ?? "no content" };
  const w = T(u.content);
  if (!w)
    return t("AI did not return usable SVG", "error"), { success: !1, error: "no svg" };
  let d;
  try {
    d = S(w, { x: e.x + e.width + 40, y: e.y, targetWidth: e.width });
  } catch (a) {
    return t(`Could not parse AI SVG: ${a.message}`, "error"), { success: !1, error: a.message };
  }
  if (!d.length)
    return t("AI SVG had no drawable paths", "error"), { success: !1, error: "empty svg" };
  R();
  const y = d.map((a) => a.id);
  return k(() => {
    v("elements", (a) => [...a, ...d]), v("selection", y);
  }), M(), t(`AI reconstruction inserted (${d.length} path${d.length > 1 ? "s" : ""})`, "success"), { success: !0, ids: y };
}
async function z(s, o) {
  try {
    const e = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${o}` },
      body: s
    });
    if (!e.ok) {
      const l = await e.text().catch(() => "");
      let r = "";
      try {
        r = JSON.parse(l).error?.message || "";
      } catch {
        r = l.slice(0, 200);
      }
      return { b64: null, error: `OpenAI image error ${e.status}: ${r}` };
    }
    const c = (await e.json()).data?.[0]?.b64_json;
    return c ? { b64: c } : { b64: null, error: "OpenAI returned no image data" };
  } catch (e) {
    return { b64: null, error: `Network error calling OpenAI Images: ${e?.message || e}` };
  }
}
async function K(s, o) {
  const e = A.elements.find((b) => b.id === s);
  if (!e) return { success: !1, error: "Element not found" };
  const i = x("openai");
  if (!i)
    return t("AI Reimagine needs an OpenAI API key (set it in AI Settings)", "error"), { success: !1, error: "No OpenAI key" };
  const c = Math.round(o?.yaw ?? e.turntable?.yaw ?? 0), l = Math.round(o?.pitch ?? e.turntable?.pitch ?? 0), r = Math.max(8, Math.round(Math.max(e.width, e.height) * 0.1)), h = I(e.x - r, e.y - r, e.width + r * 2, e.height + r * 2, "tt-src", 2, !1);
  if (!h)
    return t("Could not rasterize the selection", "error"), { success: !1, error: "rasterize failed" };
  t(`Reimagining at ${c}°…`, "info");
  const m = await (await fetch(h)).blob(), n = new FormData();
  n.append("model", "gpt-image-1"), n.append("image", new File([m], "image.png", { type: "image/png" })), n.append(
    "prompt",
    `Redraw this subject as it would look rotated ${c}° about the vertical axis${l ? ` and tilted ${l}° about the horizontal axis` : ""}, turning the object in 3D toward that viewpoint. Invent any parts that become newly visible so it reads as a coherent solid object. Keep the same subject, flat illustration style, and colours, on a clean white or transparent background.`
  ), n.append("size", "auto");
  const { b64: p, error: g } = await z(n, i);
  if (!p)
    return t(g || "AI Reimagine failed", "error"), { success: !1, error: g || "no image" };
  const f = await $(s, `data:image/png;base64,${p}`, { colors: 12 });
  return f.length ? { success: !0, ids: f } : { success: !1, error: "trace produced no paths" };
}
export {
  G as reconstructTurntableAI,
  K as reconstructTurntableAIImage
};
