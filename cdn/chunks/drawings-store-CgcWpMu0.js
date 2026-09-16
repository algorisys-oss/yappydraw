import { A as I, B as u, C as l, D as m, E as S, G as U, H as w, I as y, J as E, K as p, L as N, M as O, N as C } from "./index-CcNfX7W9.js";
const f = "yappy:drawings:index", c = (t) => `yappy:drawing:${t}`;
function G() {
  return `d-${typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`}`;
}
function T(t) {
  const n = t;
  return !!n.gameScript?.trim() || n.gameAuthoringMode === "code" || (n.sceneBehaviors?.length ?? 0) > 0 || n.blueprints && Object.keys(n.blueprints).length > 0 || Array.isArray(t.elements) && t.elements.some((a) => (a.behaviors?.length ?? 0) > 0);
}
class $ extends Error {
  constructor() {
    super("Local storage is unavailable — the drawing was not saved to disk."), this.name = "StorageUnavailableError";
  }
}
async function M() {
  return await m(f), S() === null;
}
async function o() {
  return (await m(f) ?? []).slice().sort((n, a) => (a.updatedAt || "").localeCompare(n.updatedAt || ""));
}
async function g(t) {
  await y(f, t);
}
async function b(t, n = {}) {
  C();
  const a = JSON.stringify(t), i = (/* @__PURE__ */ new Date()).toISOString(), r = await o(), e = n.id ? r.find((d) => d.id === n.id) : void 0, s = e?.id ?? n.id ?? G(), A = (n.name ?? t.metadata?.name ?? e?.name ?? "Untitled").trim() || "Untitled", h = {
    id: s,
    name: A,
    createdAt: e?.createdAt ?? i,
    updatedAt: i,
    docType: t.metadata?.docType ?? e?.docType,
    elementCount: Array.isArray(t.elements) ? t.elements.length : 0,
    pageCount: Array.isArray(t.slides) ? t.slides.length : 0,
    sizeBytes: a.length,
    thumb: n.thumb ?? e?.thumb,
    isGame: T(t)
  }, x = await y(c(s), a), v = [h, ...r.filter((d) => d.id !== s)];
  if (await g(v), !x) throw new $();
  return h;
}
async function j(t = {}) {
  const n = E(), a = t.name ?? p();
  a && a !== p() && w(a);
  let i;
  try {
    i = N();
  } catch {
  }
  const r = t.forceNew ? void 0 : u() ?? void 0, e = await b(n, { id: r, name: a, thumb: i });
  return l(e.id), O(), e;
}
async function k() {
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
async function B(t) {
  const n = await D(t);
  if (!n) return !1;
  try {
    U(n);
    const i = (await o()).find((r) => r.id === t);
    return w(n.metadata?.name || i?.name || "Untitled"), l(t), !0;
  } catch (a) {
    return console.error("[drawings-store] open failed:", a), !1;
  }
}
async function K(t, n) {
  const a = n.trim() || "Untitled", i = await o(), r = i.find((s) => s.id === t);
  if (!r) return;
  r.name = a, r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await g(i);
  const e = await D(t);
  e && (e.metadata = { ...e.metadata, name: a }, await y(c(t), JSON.stringify(e))), u() === t && w(a);
}
async function L(t) {
  const n = await D(t);
  if (!n) return null;
  const i = (await o()).find((s) => s.id === t), r = `${i?.name ?? n.metadata?.name ?? "Untitled"} copy`, e = { ...n, metadata: { ...n.metadata, name: r } };
  return b(e, { name: r, thumb: i?.thumb });
}
async function R(t) {
  const n = await o();
  await g(n.filter((a) => a.id !== t)), await I(c(t)), u() === t && l(null);
}
async function Y() {
  return (await o()).length;
}
export {
  $ as StorageUnavailableError,
  u as activeDrawingId,
  Y as countDrawings,
  R as deleteDrawing,
  L as duplicateDrawing,
  M as galleryReadable,
  D as getDrawingDoc,
  k as listDrawings,
  B as openDrawing,
  K as renameDrawing,
  j as saveCurrentToGallery,
  b as saveDrawingDoc,
  l as setActiveDrawingId
};
