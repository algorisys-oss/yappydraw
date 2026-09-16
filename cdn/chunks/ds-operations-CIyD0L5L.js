import { s as p, u as d, a as g } from "./index-CcNfX7W9.js";
function x(n) {
  return n ? n.split(",").map((r) => r.trim()).filter((r) => r.length > 0) : [];
}
function k(n, r) {
  const e = [...n];
  if (e.length === 0 || e.length === 1 && e[0] === "_")
    return e.length === 0 ? e.push(r) : e[0] = r, { newValues: e, insertIndex: 0 };
  const s = parseFloat(r);
  let t = 0;
  for (; t < e.length && e[t] !== "_"; ) {
    const i = parseFloat(e[t]);
    !isNaN(s) && !isNaN(i) ? t = s < i ? 2 * t + 1 : 2 * t + 2 : t = r < e[t] ? 2 * t + 1 : 2 * t + 2;
  }
  for (; e.length <= t; ) e.push("_");
  return e[t] = r, { newValues: e, insertIndex: t };
}
function w(n, r) {
  const e = [...n], s = e.findIndex((t) => t === r);
  if (s === -1) return { newValues: e, removeIndex: -1 };
  for (b(e, s); e.length > 0 && e[e.length - 1] === "_"; )
    e.pop();
  return { newValues: e, removeIndex: s };
}
function f(n, r) {
  return r < n.length && n[r] !== void 0 && n[r] !== "_";
}
function b(n, r) {
  const e = 2 * r + 1, s = 2 * r + 2, t = f(n, e), i = f(n, s);
  if (!t && !i) {
    n[r] = "_";
    return;
  }
  if (t && i) {
    let u = s;
    for (; f(n, 2 * u + 1); )
      u = 2 * u + 1;
    n[r] = n[u], b(n, u);
    return;
  }
  y(n, t ? e : s, r);
}
function y(n, r, e) {
  const s = /* @__PURE__ */ new Map();
  h(n, r, 0, s), a(n, r), n[e] = "_";
  for (const [t, i] of s) {
    const c = A(e, t);
    for (; n.length <= c; ) n.push("_");
    n[c] = i;
  }
}
function h(n, r, e, s) {
  f(n, r) && (s.set(e, n[r]), h(n, 2 * r + 1, 2 * e + 1, s), h(n, 2 * r + 2, 2 * e + 2, s));
}
function a(n, r) {
  r >= n.length || n[r] === "_" || n[r] === void 0 || (n[r] = "_", a(n, 2 * r + 1), a(n, 2 * r + 2));
}
function A(n, r) {
  if (r === 0) return n;
  const e = [];
  let s = r;
  for (; s > 0; )
    e.push(s % 2 === 0), s = Math.floor((s - 1) / 2);
  let t = n;
  for (let i = e.length - 1; i >= 0; i--)
    t = e[i] ? 2 * t + 2 : 2 * t + 1;
  return t;
}
function m(n, r) {
  let e = 0;
  for (let s = 0; s < n.length; s++)
    e = e * 31 + n.charCodeAt(s) | 0;
  return Math.abs(e) % r;
}
function I(n, r, e) {
  return [...n.filter((t) => {
    const i = t.indexOf(":");
    return (i > 0 ? t.substring(0, i).trim() : t.trim()) !== r;
  }), e ? `${r}:${e}` : r];
}
function v(n, r) {
  return n.filter((e) => {
    const s = e.indexOf(":");
    return (s > 0 ? e.substring(0, s).trim() : e.trim()) !== r;
  });
}
function _(n, r, e, s, t) {
  return new Promise((i) => {
    if (!p.elements.find((u) => u.id === n)) {
      i();
      return;
    }
    e === "dsOpRemove" ? (d(n, {
      dsHighlightIndex: r,
      dsAnimStyle: e,
      dsAnimProgress: 0
    }, !1), g(n, { dsAnimProgress: 100 }, {
      duration: 400,
      easing: "easeOutCubic",
      onComplete: () => {
        d(n, {
          text: t.join(", "),
          dsHighlightIndex: -1,
          dsAnimProgress: void 0,
          dsAnimStyle: void 0
        }, !1), i();
      }
    })) : (d(n, {
      text: t.join(", "),
      dsHighlightIndex: r,
      dsAnimStyle: e,
      dsAnimProgress: 0
    }, !1), g(n, { dsAnimProgress: 100 }, {
      duration: 400,
      easing: "easeOutCubic",
      onComplete: () => {
        d(n, {
          dsHighlightIndex: -1,
          dsAnimProgress: void 0,
          dsAnimStyle: void 0
        }, !1), i();
      }
    }));
  });
}
async function P(n, r, e) {
  const s = p.elements.find((l) => l.id === n);
  if (!s) return;
  const t = x(s.text);
  let i, c = -1, u = "dsOpInsert";
  switch (r) {
    // ── Array / Stack: push ──
    case "push": {
      if (!e.value?.trim()) return;
      i = [...t, e.value.trim()], c = i.length - 1, u = "dsOpInsert";
      break;
    }
    // ── Array / Stack: pop ──
    case "pop": {
      if (t.length === 0) return;
      c = t.length - 1, u = "dsOpRemove", i = t.slice(0, -1);
      break;
    }
    // ── Queue: enqueue (add to back) ──
    case "enqueue": {
      if (!e.value?.trim()) return;
      i = [...t, e.value.trim()], c = i.length - 1, u = "dsOpInsert";
      break;
    }
    // ── Queue: dequeue (remove from front) ──
    case "dequeue": {
      if (t.length === 0) return;
      c = 0, u = "dsOpRemove", i = t.slice(1);
      break;
    }
    // ── LinkedList: append (add to end) ──
    case "append": {
      if (!e.value?.trim()) return;
      i = [...t, e.value.trim()], c = i.length - 1, u = "dsOpInsert";
      break;
    }
    // ── LinkedList: prepend (add to start) ──
    case "prepend": {
      if (!e.value?.trim()) return;
      i = [e.value.trim(), ...t], c = 0, u = "dsOpInsert";
      break;
    }
    // ── LinkedList: removeFirst ──
    case "removeFirst": {
      if (t.length === 0) return;
      c = 0, u = "dsOpRemove", i = t.slice(1);
      break;
    }
    // ── LinkedList: removeLast ──
    case "removeLast": {
      if (t.length === 0) return;
      c = t.length - 1, u = "dsOpRemove", i = t.slice(0, -1);
      break;
    }
    // ── Array: insertAt ──
    case "insertAt": {
      if (!e.value?.trim()) return;
      const l = Math.max(0, Math.min(e.index ?? 0, t.length));
      i = [...t.slice(0, l), e.value.trim(), ...t.slice(l)], c = l, u = "dsOpInsert";
      break;
    }
    // ── Array: removeAt ──
    case "removeAt": {
      const l = e.index ?? 0;
      if (l < 0 || l >= t.length) return;
      c = l, u = "dsOpRemove", i = [...t.slice(0, l), ...t.slice(l + 1)];
      break;
    }
    // ── Array: shuffle (Fisher-Yates) ──
    case "shuffle": {
      if (t.length <= 1) return;
      i = [...t];
      for (let l = i.length - 1; l > 0; l--) {
        const o = Math.floor(Math.random() * (l + 1));
        [i[l], i[o]] = [i[o], i[l]];
      }
      c = -1, u = "dsOpUpdate";
      break;
    }
    // ── Array: update (replace value at index) ──
    case "update": {
      if (!e.value?.trim()) return;
      const l = e.index ?? 0;
      if (l < 0 || l >= t.length) return;
      i = [...t], i[l] = e.value.trim(), c = l, u = "dsOpUpdate";
      break;
    }
    // ── BinaryTree: BST insert ──
    case "insert": {
      if (!e.value?.trim()) return;
      if (s.type === "dsBinaryTree") {
        const l = k(t, e.value.trim());
        i = l.newValues, c = l.insertIndex, u = "dsOpInsert";
      } else
        return;
      break;
    }
    // ── BinaryTree: BST remove / HashTable: remove by key ──
    case "remove": {
      if (s.type === "dsBinaryTree") {
        if (!e.value?.trim()) return;
        const l = w(t, e.value.trim());
        if (l.removeIndex === -1) return;
        i = l.newValues, c = l.removeIndex, u = "dsOpRemove";
      } else if (s.type === "dsHashTable") {
        if (!e.key?.trim()) return;
        const l = e.key.trim(), o = s.dsCapacity || 5;
        if (c = m(l, o), i = v(t, l), i.length === t.length) return;
        u = "dsOpRemove";
      } else
        return;
      break;
    }
    // ── HashTable: put (key:value) ──
    case "put": {
      if (!e.key?.trim()) return;
      const l = e.key.trim(), o = e.value?.trim() || "", O = s.dsCapacity || 5;
      c = m(l, O), i = I(t, l, o), u = "dsOpInsert";
      break;
    }
    default:
      return;
  }
  await _(n, c, u, t, i);
}
export {
  P as executeDsOperation
};
