import { g as w, a as P, b as E, c as T } from "./ai-providers-CycU8sO1.js";
import { s as u, b as r, p as y, u as b, Z as B, f as v, g as j } from "./index-BaeYsOfX.js";
const z = {
  rewrite: "Rewrite this text to be clearer and more engaging while keeping its meaning and rough length.",
  shorten: "Shorten this text to roughly half its length while keeping the key message.",
  expand: "Expand this text with one or two extra sentences of relevant detail.",
  fix: "Fix any spelling and grammar mistakes. Change nothing else."
};
async function C(p, s = "rewrite", i) {
  const { provider: e, model: t, apiKey: a } = E();
  if (!a)
    return r("Add an API key in AI Settings first", "error"), 0;
  const n = p.map((g) => u.elements.find((d) => d.id === g)).filter((g) => !!g && g.type === "text" && !!(g.text || "").trim());
  if (n.length === 0)
    return r("Select a text element first", "info"), 0;
  const o = s === "custom" ? i || "Improve this text." : z[s];
  r("Magic Write…", "loading");
  let l = 0, c = !1;
  for (const g of n) {
    const d = await T({
      provider: e,
      model: t,
      apiKey: a,
      systemPrompt: "You are a copywriter working inside a graphic design tool. Reply with ONLY the final text — no quotes, no markdown, no explanations. Preserve intentional line breaks.",
      userPrompt: `${o}

Text:
${g.text}`,
      temperature: 0.7,
      maxTokens: 1024
    });
    if (d.success && d.content.trim())
      l === 0 && y(), b(g.id, { text: d.content.trim() }), l++;
    else if (!d.success) {
      r(d.error || "Magic Write failed", "error"), c = !0;
      break;
    }
  }
  return l > 0 ? r(`Magic Write updated ${l} text element${l === 1 ? "" : "s"}`, "success") : c || B(), l;
}
async function S(p, s, i) {
  const e = w("openai");
  if (!e) return { dataURL: null, error: "Add an OpenAI API key in AI Settings first" };
  try {
    const t = { model: i, prompt: p, n: 1, size: s };
    i.startsWith("dall-e") && (t.response_format = "b64_json");
    const a = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${e}` },
      body: JSON.stringify(t)
    });
    if (!a.ok) {
      const c = await a.text().catch(() => "");
      let g = "";
      try {
        g = JSON.parse(c).error?.message || "";
      } catch {
        g = c.slice(0, 200);
      }
      return { dataURL: null, error: `OpenAI image error ${a.status}: ${g}` };
    }
    const n = await a.json(), o = n.data?.[0]?.b64_json;
    if (o) return { dataURL: `data:image/png;base64,${o}` };
    const l = n.data?.[0]?.url;
    if (l) {
      const g = await (await fetch(l)).blob();
      return { dataURL: await new Promise((m, I) => {
        const h = new FileReader();
        h.onload = () => m(String(h.result)), h.onerror = I, h.readAsDataURL(g);
      }) };
    }
    return { dataURL: null, error: "OpenAI returned no image data" };
  } catch (t) {
    return { dataURL: null, error: `Network error calling OpenAI Images: ${t?.message || t}` };
  }
}
function D(p, s, i, e) {
  const t = u.slides[u.activeSlideIndex], a = t ? t.dimensions.width * 0.6 : 512, n = Math.min(1, a / s), o = Math.round(s * n), l = Math.round(i * n), c = t ? t.spatialPosition.x + (t.dimensions.width - o) / 2 : 120, g = t ? t.spatialPosition.y + (t.dimensions.height - l) / 2 : 120, d = {
    id: `image-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    type: "image",
    x: c,
    y: g,
    width: o,
    height: l,
    dataURL: p,
    status: "loaded",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeColor: "transparent",
    strokeWidth: 0,
    strokeStyle: "solid",
    opacity: 100,
    angle: 0,
    roughness: 0,
    renderStyle: "architectural",
    locked: !1,
    link: null,
    layerId: u.activeLayerId || "default-layer",
    seed: Math.floor(Math.random() * 2 ** 31),
    roundness: null
  };
  return y(), v("elements", (m) => [...m, d]), v("selection", [d.id]), j(), r(`${e} added`, "success"), d.id;
}
async function K(p, s = {}) {
  const i = s.size || "1024x1024", e = P("openai"), t = i === "1536x1024" ? "1792x1024" : i === "1024x1536" ? "1024x1792" : "1024x1024";
  r("Generating image…", "loading");
  let a = await S(p, e.startsWith("dall-e") ? t : i, e);
  if (!a.dataURL && e !== "dall-e-3") {
    const l = await S(p, t, "dall-e-3");
    l.dataURL && (a = l);
  }
  if (!a.dataURL)
    return r(a.error || "Image generation failed", "error"), null;
  const [n, o] = i.split("x").map(Number);
  return D(a.dataURL, n || 1024, o || 1024, "AI image");
}
const k = (p) => new Promise((s, i) => {
  const e = new Image();
  e.onload = () => s(e), e.onerror = i, e.src = p;
});
async function F(p, s) {
  try {
    const [i, e] = await Promise.all([k(p), k(s)]), t = document.createElement("canvas");
    t.width = i.naturalWidth, t.height = i.naturalHeight;
    const a = t.getContext("2d");
    if (!a) return null;
    a.drawImage(i, 0, 0), a.globalCompositeOperation = "destination-in", a.drawImage(e, 0, 0, t.width, t.height);
    const n = a.getImageData(0, 0, t.width, t.height).data, o = n.length / 4, l = 4 * Math.max(1, Math.floor(o / 1e3));
    let c = 0, g = 0;
    for (let d = 3; d < n.length; d += l)
      n[d] < 16 ? c++ : g++;
    return c === 0 || g === 0 ? null : t.toDataURL("image/png");
  } catch {
    return null;
  }
}
async function x(p, s) {
  try {
    const i = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${s}` },
      body: p
    });
    if (!i.ok) {
      const a = await i.text().catch(() => "");
      let n = "";
      try {
        n = JSON.parse(a).error?.message || "";
      } catch {
        n = a.slice(0, 200);
      }
      return { b64: null, error: `OpenAI image edit error ${i.status}: ${n}` };
    }
    const t = (await i.json()).data?.[0]?.b64_json;
    return t ? { b64: t } : { b64: null, error: "OpenAI returned no image data" };
  } catch (i) {
    return { b64: null, error: `Network error calling OpenAI Images: ${i?.message || i}` };
  }
}
async function W(p, s) {
  const i = p || u.selection[0], e = u.elements.find((c) => c.id === i);
  if (!e || e.type !== "image" || !e.dataURL)
    return r("Select an image element first", "info"), !1;
  if (!s?.trim())
    return r("Describe the change first", "info"), !1;
  const t = w("openai");
  if (!t)
    return r("Add an OpenAI API key in AI Settings first", "error"), !1;
  r("Magic Edit…", "loading");
  const a = await (await fetch(e.dataURL)).blob(), n = new FormData();
  n.append("model", "gpt-image-1"), n.append("image", new File([a], "image.png", { type: a.type || "image/png" })), n.append(
    "prompt",
    `${s.trim()}. Apply ONLY this change — keep everything else in the image pixel-identical to the input: same composition, colors, style, and framing.`
  ), n.append("size", "auto");
  const { b64: o, error: l } = await x(n, t);
  return o ? (y(), b(e.id, { dataURL: `data:image/png;base64,${o}` }), r("Magic Edit applied", "success"), !0) : (r(l || "Magic Edit failed", "error"), !1);
}
async function J(p, s) {
  const i = p || u.selection[0], e = u.elements.find((c) => c.id === i);
  if (!e || e.type !== "image" || !e.dataURL)
    return r("Select an image element first", "info"), !1;
  if (!s?.trim())
    return r("Describe the new background first", "info"), !1;
  const t = w("openai");
  if (!t)
    return r("Add an OpenAI API key in AI Settings first", "error"), !1;
  r("Replacing background…", "loading");
  const a = await (await fetch(e.dataURL)).blob(), n = new FormData();
  n.append("model", "gpt-image-1"), n.append("image", new File([a], "image.png", { type: a.type || "image/png" })), n.append(
    "prompt",
    `Replace the background behind the main foreground subject with: ${s.trim()}. Keep the foreground subject pixel-identical to the input — do not restyle, repaint, recolor, move, crop, or resize it. Change ONLY the background, blending the new background naturally with realistic lighting and edges around the subject.`
  ), n.append("size", "auto"), n.append("input_fidelity", "high");
  let { b64: o, error: l } = await x(n, t);
  return !o && l?.includes("input_fidelity") && (n.delete("input_fidelity"), { b64: o, error: l } = await x(n, t)), o ? (y(), b(e.id, { dataURL: `data:image/png;base64,${o}` }), r("Background replaced", "success"), !0) : (r(l || "Replace Background failed", "error"), !1);
}
async function Y(p, s = {}) {
  const i = p || u.selection[0], e = u.elements.find((c) => c.id === i);
  if (!e || e.type !== "image" || !e.dataURL)
    return r("Select an image element first", "info"), !1;
  const t = w("openai");
  if (!t)
    return r("Add an OpenAI API key in AI Settings first", "error"), !1;
  const a = Math.max(0, s.left ?? 0.25), n = Math.max(0, s.right ?? 0.25), o = Math.max(0, s.top ?? 0.25), l = Math.max(0, s.bottom ?? 0.25);
  if (a + n + o + l === 0) return !1;
  r("Magic Expand…", "loading");
  try {
    const c = await k(e.dataURL), g = c.naturalWidth, d = c.naturalHeight, m = Math.round(g * (1 + a + n)), I = Math.round(d * (1 + o + l)), h = document.createElement("canvas");
    h.width = m, h.height = I;
    const A = h.getContext("2d");
    if (!A)
      return r("Magic Expand failed: no canvas context", "error"), !1;
    A.drawImage(c, Math.round(g * a), Math.round(d * o));
    const R = await new Promise((U, O) => h.toBlob((M) => M ? U(M) : O(new Error("canvas.toBlob failed")), "image/png")), f = new FormData();
    f.append("model", "gpt-image-1"), f.append("image", new File([R], "image.png", { type: "image/png" })), f.append("mask", new File([R], "mask.png", { type: "image/png" })), f.append(
      "prompt",
      (s.prompt?.trim() ? `${s.prompt.trim()}. ` : "") + "Extend the existing image seamlessly into the transparent areas, continuing its scene, lighting, style, and perspective. Keep the original (non-transparent) pixels unchanged."
    ), f.append("size", "auto");
    const { b64: L, error: $ } = await x(f, t);
    return L ? (y(), b(e.id, {
      dataURL: `data:image/png;base64,${L}`,
      x: e.x - e.width * a,
      y: e.y - e.height * o,
      width: e.width * (1 + a + n),
      height: e.height * (1 + o + l)
    }), r("Magic Expand applied", "success"), !0) : (r($ || "Magic Expand failed", "error"), !1);
  } catch (c) {
    return r(`Magic Expand failed: ${c?.message || c}`, "error"), !1;
  }
}
async function H(p, s = {}) {
  const i = p || u.selection[0], e = u.elements.find((a) => a.id === i);
  if (!e || e.type !== "image" || !e.dataURL)
    return r("Select an image element first", "info"), !1;
  const t = w("openai");
  if (!t)
    return r("Add an OpenAI API key in AI Settings first", "error"), !1;
  r("Removing background…", "loading");
  try {
    const a = await (await fetch(e.dataURL)).blob(), n = (d) => {
      const m = new FormData();
      return m.append("model", "gpt-image-1"), m.append("image", new File([a], "image.png", { type: a.type || "image/png" })), m.append(
        "prompt",
        "Remove the background completely so it is fully transparent. Keep the foreground subject pixel-identical to the input — do not restyle, repaint, recolor, sharpen, or add any effects, glow, outlines, or shadows. Do not move, crop, or resize the subject."
      ), m.append("background", "transparent"), m.append("size", "auto"), d && m.append("input_fidelity", "high"), m;
    };
    let o = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
      body: n(!0)
    });
    if (o.status === 400 && (await o.clone().text().catch(() => "")).includes("input_fidelity") && (o = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
      body: n(!1)
    })), !o.ok) {
      const d = await o.text().catch(() => "");
      let m = "";
      try {
        m = JSON.parse(d).error?.message || "";
      } catch {
        m = d.slice(0, 200);
      }
      return r(`Background removal failed (${o.status}): ${m}`, "error"), !1;
    }
    const c = (await o.json()).data?.[0]?.b64_json;
    if (!c)
      return r("Background removal returned no image", "error"), !1;
    let g = `data:image/png;base64,${c}`;
    if (s.preserveOriginal !== !1) {
      const d = await F(e.dataURL, g);
      d && (g = d);
    }
    return y(), b(e.id, { dataURL: g }), r("Background removed", "success"), !0;
  } catch (a) {
    return r(`Background removal failed: ${a?.message || a}`, "error"), !1;
  }
}
export {
  Y as expandImage,
  K as generateImage,
  W as magicEditImage,
  C as magicWrite,
  H as removeBackground,
  J as replaceBackground
};
