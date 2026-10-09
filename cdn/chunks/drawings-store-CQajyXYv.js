import { k as I, l as u, m as l, n as m, o as S, q as U, r as w, D as E, b as N, v as y, w as O, x as p, y as T, A as C, B as G } from "./index-De-LpBry.js";
const f = "yappy:drawings:index", c = (t) => `yappy:drawing:${t}`;
function $() {
  return `d-${typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`}`;
}
function k(t) {
  const n = t;
  return !!n.gameScript?.trim() || n.gameAuthoringMode === "code" || (n.sceneBehaviors?.length ?? 0) > 0 || n.blueprints && Object.keys(n.blueprints).length > 0 || Array.isArray(t.elements) && t.elements.some((a) => (a.behaviors?.length ?? 0) > 0);
}
class j extends Error {
  constructor() {
    super("Local storage is unavailable — the drawing was not saved to disk."), this.name = "StorageUnavailableError";
  }
}
async function J() {
  return await m(f), S() === null;
}
async function o() {
  return (await m(f) ?? []).slice().sort((n, a) => (a.updatedAt || "").localeCompare(n.updatedAt || ""));
}
async function g(t) {
  await y(f, t);
}
async function b(t, n = {}) {
  G();
  const a = JSON.stringify(t), r = (/* @__PURE__ */ new Date()).toISOString(), i = await o(), e = n.id ? i.find((d) => d.id === n.id) : void 0, s = e?.id ?? n.id ?? $(), x = (n.name ?? t.metadata?.name ?? e?.name ?? "Untitled").trim() || "Untitled", h = {
    id: s,
    name: x,
    createdAt: e?.createdAt ?? r,
    updatedAt: r,
    docType: t.metadata?.docType ?? e?.docType,
    elementCount: Array.isArray(t.elements) ? t.elements.length : 0,
    pageCount: Array.isArray(t.slides) ? t.slides.length : 0,
    sizeBytes: a.length,
    thumb: n.thumb ?? e?.thumb,
    isGame: k(t)
  }, A = await y(c(s), a), v = [h, ...i.filter((d) => d.id !== s)];
  if (await g(v), !A) throw new j();
  return h;
}
async function M(t = {}) {
  const n = O(), a = t.name ?? p();
  a && a !== p() && w(a);
  let r;
  try {
    r = T();
  } catch {
  }
  const i = t.forceNew ? void 0 : u() ?? void 0, e = await b(n, { id: i, name: a, thumb: r });
  return l(e.id), C(), e;
}
async function q() {
  return o();
}
async function D(t) {
  const n = await m(c(t));
  if (!n) return null;
  try {
    return JSON.parse(n);
  } catch {
    return null;
  }
}
async function K(t) {
  const n = await D(t);
  if (!n) return !1;
  try {
    U(n);
    const r = (await o()).find((i) => i.id === t);
    return w(n.metadata?.name || r?.name || "Untitled"), l(t), !0;
  } catch (a) {
    return a instanceof E && N(a.message, "error", 1e4), console.error("[drawings-store] open failed:", a), !1;
  }
}
async function R(t, n) {
  const a = n.trim() || "Untitled", r = await o(), i = r.find((s) => s.id === t);
  if (!i) return;
  i.name = a, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await g(r);
  const e = await D(t);
  e && (e.metadata = { ...e.metadata, name: a }, await y(c(t), JSON.stringify(e))), u() === t && w(a);
}
async function Y(t) {
  const n = await D(t);
  if (!n) return null;
  const r = (await o()).find((s) => s.id === t), i = `${r?.name ?? n.metadata?.name ?? "Untitled"} copy`, e = { ...n, metadata: { ...n.metadata, name: i } };
  return b(e, { name: i, thumb: r?.thumb });
}
async function _(t) {
  const n = await o();
  await g(n.filter((a) => a.id !== t)), await I(c(t)), u() === t && l(null);
}
async function z() {
  return (await o()).length;
}
export {
  j as StorageUnavailableError,
  u as activeDrawingId,
  z as countDrawings,
  _ as deleteDrawing,
  Y as duplicateDrawing,
  J as galleryReadable,
  D as getDrawingDoc,
  q as listDrawings,
  K as openDrawing,
  R as renameDrawing,
  M as saveCurrentToGallery,
  b as saveDrawingDoc,
  l as setActiveDrawingId
};
