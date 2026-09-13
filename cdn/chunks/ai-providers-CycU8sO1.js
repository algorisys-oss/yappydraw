const d = {
  openai: [
    { id: "gpt-image-1", label: "GPT Image 1 (best; needs verified org)" },
    { id: "dall-e-3", label: "DALL·E 3" }
  ],
  gemini: [],
  anthropic: []
}, l = "yappy:ai:config";
function g(e) {
  try {
    return atob(e);
  } catch {
    return e;
  }
}
function m() {
  return {
    activeProvider: "openai",
    providers: {
      openai: { apiKey: "", model: "gpt-4o", imageModel: "gpt-image-1", enabled: !0 },
      gemini: { apiKey: "", model: "gemini-2.0-flash", enabled: !0 },
      anthropic: { apiKey: "", model: "claude-sonnet-4-5-20250929", enabled: !0 }
    }
  };
}
function i() {
  try {
    const e = localStorage.getItem(l);
    if (e) {
      const n = JSON.parse(e), o = m();
      return {
        activeProvider: n.activeProvider || o.activeProvider,
        providers: {
          openai: { ...o.providers.openai, ...n.providers?.openai },
          gemini: { ...o.providers.gemini, ...n.providers?.gemini },
          anthropic: { ...o.providers.anthropic, ...n.providers?.anthropic }
        }
      };
    }
  } catch {
  }
  return m();
}
function y(e) {
  const o = i().providers[e]?.apiKey || "";
  return o ? g(o) : "";
}
function v() {
  const e = i();
  return Object.values(e.providers).some((n) => n.apiKey !== "");
}
function T(e) {
  return i().providers[e]?.imageModel || d[e][0]?.id;
}
function b() {
  const e = i(), n = e.activeProvider;
  return {
    provider: n,
    model: e.providers[n].model,
    apiKey: y(n)
  };
}
async function P(e) {
  switch (e.provider) {
    case "openai":
      return f(e);
    case "gemini":
      return h(e);
    case "anthropic":
      return k(e);
    default:
      return { success: !1, content: "", error: `Unknown provider: ${e.provider}` };
  }
}
async function f(e) {
  const n = "https://api.openai.com/v1/chat/completions", o = e.images?.length ? [
    ...e.images.map((t) => ({
      type: "image_url",
      image_url: { url: `data:${t.mediaType};base64,${t.base64}`, detail: "high" }
    })),
    { type: "text", text: e.userPrompt }
  ] : e.userPrompt, a = {
    model: e.model,
    messages: [
      { role: "system", content: e.systemPrompt },
      { role: "user", content: o }
    ],
    temperature: e.temperature ?? 0.3,
    max_tokens: e.maxTokens ?? 4096
  };
  try {
    const t = await fetch(n, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${e.apiKey}`
      },
      body: JSON.stringify(a)
    });
    if (!t.ok) {
      const r = await t.text().catch(() => "");
      return { success: !1, content: "", error: c("OpenAI", t.status, r) };
    }
    const s = await t.json();
    return {
      success: !0,
      content: s.choices?.[0]?.message?.content || "",
      usage: s.usage ? {
        promptTokens: s.usage.prompt_tokens,
        completionTokens: s.usage.completion_tokens
      } : void 0
    };
  } catch (t) {
    return { success: !1, content: "", error: p("OpenAI", t) };
  }
}
async function h(e) {
  const n = `https://generativelanguage.googleapis.com/v1beta/models/${e.model}:generateContent?key=${e.apiKey}`, o = [];
  if (e.images?.length)
    for (const t of e.images)
      o.push({ inlineData: { mimeType: t.mediaType, data: t.base64 } });
  o.push({ text: e.userPrompt });
  const a = {
    systemInstruction: { parts: [{ text: e.systemPrompt }] },
    contents: [{ parts: o }],
    generationConfig: {
      temperature: e.temperature ?? 0.3,
      maxOutputTokens: e.maxTokens ?? 4096
    }
  };
  try {
    const t = await fetch(n, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a)
    });
    if (!t.ok) {
      const r = await t.text().catch(() => "");
      return { success: !1, content: "", error: c("Gemini", t.status, r) };
    }
    const s = await t.json();
    return {
      success: !0,
      content: s.candidates?.[0]?.content?.parts?.[0]?.text || "",
      usage: s.usageMetadata ? {
        promptTokens: s.usageMetadata.promptTokenCount || 0,
        completionTokens: s.usageMetadata.candidatesTokenCount || 0
      } : void 0
    };
  } catch (t) {
    return { success: !1, content: "", error: p("Gemini", t) };
  }
}
async function k(e) {
  const n = "https://api.anthropic.com/v1/messages", o = e.images?.length ? [
    ...e.images.map((t) => ({
      type: "image",
      source: { type: "base64", media_type: t.mediaType, data: t.base64 }
    })),
    { type: "text", text: e.userPrompt }
  ] : e.userPrompt, a = {
    model: e.model,
    system: e.systemPrompt,
    messages: [{ role: "user", content: o }],
    max_tokens: e.maxTokens ?? 4096,
    temperature: e.temperature ?? 0.3
  };
  try {
    const t = await fetch(n, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": e.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(a)
    });
    if (!t.ok) {
      const r = await t.text().catch(() => "");
      return { success: !1, content: "", error: c("Anthropic", t.status, r) };
    }
    const s = await t.json();
    return {
      success: !0,
      content: s.content?.[0]?.text || "",
      usage: s.usage ? {
        promptTokens: s.usage.input_tokens,
        completionTokens: s.usage.output_tokens
      } : void 0
    };
  } catch (t) {
    return { success: !1, content: "", error: p("Anthropic", t) };
  }
}
function c(e, n, o) {
  let a = "";
  try {
    const t = JSON.parse(o);
    a = t.error?.message || t.error?.status || t.message || "";
  } catch {
    a = o.slice(0, 200);
  }
  switch (n) {
    case 401:
      return `Invalid API key for ${e}. Check your key in AI Settings.`;
    case 403:
      return `Access denied by ${e}. ${a || "Check API key permissions."}`;
    case 429:
      return `Rate limited by ${e}. Please wait a moment and try again.`;
    case 500:
    case 502:
    case 503:
      return `${e} server error (${n}). Please try again later.`;
    default:
      return `${e} error ${n}: ${a || "Unknown error"}`;
  }
}
function p(e, n) {
  return n.name === "TypeError" && n.message?.includes("fetch") ? `Network error: unable to reach ${e} API. Check your internet connection.` : n.message?.includes("CORS") || n.message?.includes("cors") ? `CORS error calling ${e}. This provider may not support direct browser calls.` : `Network error calling ${e}: ${n.message || "Unknown error"}`;
}
export {
  T as a,
  b,
  P as c,
  y as g,
  v as h,
  i as l
};
