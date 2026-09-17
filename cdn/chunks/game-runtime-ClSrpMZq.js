import { s as o, b as m, d as b, f as a, z as W, w as z, x as U, y as B } from "./index-DDQUjBae.js";
const h = /* @__PURE__ */ new Set(), x = [], G = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  " ": "a",
  z: "a",
  Z: "a",
  Enter: "a",
  x: "b",
  X: "b",
  Shift: "b"
}, Q = (e) => {
  h.has(e) || (h.add(e), I(e));
}, q = (e) => {
  h.delete(e);
}, I = (e) => {
  for (const i of x) i.button === e && L(i.fn);
}, u = { x: 0, y: 0, down: !1 }, v = [], ee = (e, i) => {
  u.x = e, u.y = i;
}, te = (e, i) => {
  u.x = e, u.y = i, u.down = !0;
  for (const s of v) L(() => s(e, i));
}, ne = () => {
  u.down = !1;
};
class A {
  id;
  constructor(i) {
    this.id = i;
  }
  el() {
    return o.elements.find((i) => i.id === this.id);
  }
  get alive() {
    return !!this.el();
  }
  get x() {
    return this.el()?.x ?? 0;
  }
  get y() {
    return this.el()?.y ?? 0;
  }
  get width() {
    return this.el()?.width ?? 0;
  }
  get height() {
    return this.el()?.height ?? 0;
  }
  get angle() {
    return this.el()?.angle ?? 0;
  }
  get text() {
    return this.el()?.text ?? "";
  }
  /** Center coordinates. */
  get cx() {
    const i = this.el();
    return i ? i.x + i.width / 2 : 0;
  }
  get cy() {
    const i = this.el();
    return i ? i.y + i.height / 2 : 0;
  }
  set(i) {
    return C(this.id, i), this;
  }
  moveTo(i, s) {
    return this.set({ x: i, y: s });
  }
  moveBy(i, s) {
    return this.set({ x: this.x + i, y: this.y + s });
  }
  centerAt(i, s) {
    return this.set({ x: i - this.width / 2, y: s - this.height / 2 });
  }
  rotateBy(i) {
    return this.set({ angle: this.angle + i * Math.PI / 180 });
  }
  color(i) {
    return this.set({ backgroundColor: i, fillStyle: "solid" });
  }
  setText(i) {
    return this.set({ text: i });
  }
  hide() {
    return this.set({ opacity: 0 });
  }
  show() {
    return this.set({ opacity: 100 });
  }
  destroy() {
    H(this.id);
  }
}
const C = (e, i) => {
  a("elements", (s) => s.id === e, i);
}, H = (e) => {
  a("elements", (i) => i.filter((s) => s.id !== e));
};
let g = null, y = null, w = [], k = 0, M = 0, c = null, T = !1, F = "", f = 0;
const N = "SCORE ";
let $ = null, V = !1, E = () => {
};
const ie = (e) => {
  E = e;
}, J = (e) => {
  $ = e, E();
}, P = (e) => {
  T = e, V = e, E();
}, L = (e) => {
  try {
    e();
  } catch (i) {
    console.error("[arcade] script error:", i), m(`Game error: ${i?.message || i}`, "error"), p();
  }
}, K = (e) => {
  if (e.key === "Escape") {
    p();
    return;
  }
  const i = G[e.key];
  i && (e.preventDefault(), h.has(i) || (h.add(i), I(i)));
}, O = (e) => {
  const i = G[e.key];
  i && h.delete(i);
};
let X = 0;
function Y() {
  const e = o.slides[o.activeSlideIndex] || o.slides[0];
  return e ? { x: e.spatialPosition.x, y: e.spatialPosition.y, width: e.dimensions.width, height: e.dimensions.height } : { x: 0, y: 0, width: 800, height: 600 };
}
function Z() {
  const e = Y(), i = {
    strokeColor: "transparent",
    strokeWidth: 0,
    strokeStyle: "solid",
    fillStyle: "solid",
    opacity: 100,
    angle: 0,
    roughness: 0,
    renderStyle: "architectural",
    locked: !1,
    layerId: o.activeLayerId || "default-layer",
    roundness: null
  }, s = (n, t, r, d, l, S) => {
    const D = {
      id: `game-${Date.now()}-${++X}`,
      type: n,
      x: t,
      y: r,
      width: d,
      height: l,
      backgroundColor: "#3b82f6",
      seed: 1,
      ...i,
      ...S
    };
    return a("elements", (R) => [...R, D]), new A(D.id);
  };
  return {
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    onTick: (n) => {
      w.push(n);
    },
    onKey: (n, t) => {
      x.push({ button: n, fn: t });
    },
    key: (n) => h.has(n),
    pointer: () => ({ ...u }),
    onPointerDown: (n) => {
      v.push(n);
    },
    find: (n) => {
      const t = o.elements.find((r) => r.id === n || r.tag === n || r.text === n);
      return t ? new A(t.id) : null;
    },
    findAll: (n) => o.elements.filter((t) => t.id === n || t.tag === n || t.text === n).map((t) => new A(t.id)),
    spawn: (n, t, r, d, l, S) => s(n, t, r, d, l, S),
    spawnText: (n, t, r, d = 32, l) => s("text", t, r, Math.max(60, n.length * d * 0.6), d * 1.4, {
      text: n,
      fontSize: d,
      textColor: "#111827",
      textAlign: "center",
      backgroundColor: "transparent",
      fontFamily: "poppins",
      ...l
    }),
    hit: (n, t) => !n?.alive || !t?.alive ? !1 : n.x < t.x + t.width && n.x + n.width > t.x && n.y < t.y + t.height && n.y + n.height > t.y,
    hud: (n) => {
      if (c && o.elements.some((t) => t.id === c))
        C(c, { text: n });
      else {
        const t = Math.round(e.width / 18);
        c = s("text", e.x + e.width * 0.1, e.y + 16, e.width * 0.8, t * 1.5, {
          text: n,
          fontSize: t,
          textColor: "#111827",
          textAlign: "center",
          backgroundColor: "transparent",
          fontFamily: "poppins",
          fontWeight: "bold"
        }).id;
      }
    },
    score: (n) => {
      f += n;
      const t = N + f;
      if (c && o.elements.some((r) => r.id === c))
        C(c, { text: t });
      else {
        const r = Math.round(e.width / 18);
        c = s("text", e.x + e.width * 0.1, e.y + 16, e.width * 0.8, r * 1.5, {
          text: t,
          fontSize: r,
          textColor: "#111827",
          textAlign: "center",
          backgroundColor: "transparent",
          fontFamily: "poppins",
          fontWeight: "bold"
        }).id;
      }
      return f;
    },
    getScore: () => f,
    goToState: (n) => {
      const t = o.states.find((r) => r.name === n || r.id === n);
      t && B(t.id);
    },
    playAnim: (n, t) => {
      n?.alive && import("./index-DDQUjBae.js").then((r) => r.ao).then((r) => r.sequenceAnimator.playAnimation(n.id, { id: `bhv-${Date.now()}`, type: "preset", name: t, trigger: "programmatic" }, () => {
      }));
    },
    goToPage: (n) => {
      n >= 0 && n < o.slides.length && U(n);
    },
    sound: (n) => {
      import("./index-DDQUjBae.js").then((t) => t.ap).then((t) => t.playSfx(n));
    },
    music: (n) => {
      import("./index-DDQUjBae.js").then((t) => t.ap).then((t) => n ? t.startMusic() : t.stopMusic());
    },
    end: (n) => {
      if (P(!0), n) {
        const t = Math.round(e.width / 10);
        s("text", e.x, e.y + e.height / 2 - t, e.width, t * 2, {
          text: n,
          fontSize: t,
          textColor: "#dc2626",
          textAlign: "center",
          backgroundColor: "transparent",
          fontFamily: "poppins",
          fontWeight: "bold"
        });
      }
    },
    pad: (n) => J(n),
    random: (n, t) => n + Math.random() * (t - n),
    clamp: (n, t, r) => Math.max(t, Math.min(r, n))
  };
}
const re = () => o.gameActive;
function _(e) {
  o.gameActive && p();
  const i = e ?? o.gameScript;
  if (!i?.trim())
    return m("No game script yet — open Menu → Game Script…", "info"), !1;
  g = {
    elements: JSON.stringify(o.elements),
    selection: [...o.selection],
    activeSlideIndex: o.activeSlideIndex,
    appMode: o.appMode,
    viewState: { ...o.viewState }
  }, F = i, w = [], x.length = 0, v.length = 0, h.clear(), c = null, f = 0, P(!1), $ = null;
  let s;
  try {
    s = new Function("game", `'use strict';
${i}`);
  } catch (t) {
    return m(`Game script error: ${t?.message || t}`, "error"), g = null, !1;
  }
  b(() => {
    a("selection", []), a("gameActive", !0), a("appMode", "presentation");
  }), W();
  try {
    s(Z());
  } catch (t) {
    return m(`Game error: ${t?.message || t}`, "error"), p(), !1;
  }
  window.addEventListener("keydown", K, !0), window.addEventListener("keyup", O, !0), k = performance.now(), M = k;
  const n = (t) => {
    y = requestAnimationFrame(n);
    const r = Math.min(0.05, (t - M) / 1e3);
    if (M = t, T) return;
    const d = (t - k) / 1e3;
    try {
      b(() => {
        for (const l of w) l(r, d);
      });
    } catch (l) {
      console.error("[arcade] tick error:", l), m(`Game error: ${l?.message || l}`, "error"), p();
    }
  };
  return y = requestAnimationFrame(n), !0;
}
function p() {
  if (y !== null && (cancelAnimationFrame(y), y = null), window.removeEventListener("keydown", K, !0), window.removeEventListener("keyup", O, !0), import("./index-DDQUjBae.js").then((e) => e.ap).then((e) => e.stopMusic()), h.clear(), w = [], x.length = 0, v.length = 0, g) {
    const e = g;
    g = null, b(() => {
      a("elements", JSON.parse(e.elements)), a("selection", e.selection), a("activeSlideIndex", e.activeSlideIndex), a("appMode", e.appMode), a("gameActive", !1);
    }), z(e.viewState);
  } else
    a("gameActive", !1);
  P(!1);
}
function se() {
  const e = F;
  p(), e && _(e);
}
export {
  A as Sprite,
  V as gameEnded,
  te as gamePointerDown,
  ee as gamePointerMove,
  ne as gamePointerUp,
  re as isGameRunning,
  ie as onGameUiSignal,
  Q as padPress,
  q as padRelease,
  $ as padVisibleOverride,
  se as restartGame,
  _ as startGame,
  p as stopGame
};
