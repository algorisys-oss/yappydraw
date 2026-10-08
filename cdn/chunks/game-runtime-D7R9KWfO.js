import { s as o, b as m, d as b, z as W, w as z, g as a, x as U, y as B } from "./index-DJSTqwMl.js";
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
}, q = (e) => {
  h.has(e) || (h.add(e), I(e));
}, Q = (e) => {
  h.delete(e);
}, I = (e) => {
  for (const r of x) r.button === e && L(r.fn);
}, u = { x: 0, y: 0, down: !1 }, v = [], ee = (e, r) => {
  u.x = e, u.y = r;
}, te = (e, r) => {
  u.x = e, u.y = r, u.down = !0;
  for (const s of v) L(() => s(e, r));
}, ne = () => {
  u.down = !1;
};
class A {
  id;
  constructor(r) {
    this.id = r;
  }
  el() {
    return o.elements.find((r) => r.id === this.id);
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
    const r = this.el();
    return r ? r.x + r.width / 2 : 0;
  }
  get cy() {
    const r = this.el();
    return r ? r.y + r.height / 2 : 0;
  }
  set(r) {
    return C(this.id, r), this;
  }
  moveTo(r, s) {
    return this.set({ x: r, y: s });
  }
  moveBy(r, s) {
    return this.set({ x: this.x + r, y: this.y + s });
  }
  centerAt(r, s) {
    return this.set({ x: r - this.width / 2, y: s - this.height / 2 });
  }
  rotateBy(r) {
    return this.set({ angle: this.angle + r * Math.PI / 180 });
  }
  color(r) {
    return this.set({ backgroundColor: r, fillStyle: "solid" });
  }
  setText(r) {
    return this.set({ text: r });
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
const C = (e, r) => {
  a("elements", (s) => s.id === e, r);
}, H = (e) => {
  a("elements", (r) => r.filter((s) => s.id !== e));
};
let g = null, y = null, w = [], k = 0, M = 0, c = null, T = !1, F = "", f = 0;
const N = "SCORE ";
let $ = null, V = !1, E = () => {
};
const re = (e) => {
  E = e;
}, J = (e) => {
  $ = e, E();
}, P = (e) => {
  T = e, V = e, E();
}, L = (e) => {
  try {
    e();
  } catch (r) {
    console.error("[arcade] script error:", r), m(`Game error: ${r?.message || r}`, "error"), p();
  }
}, K = (e) => {
  if (e.key === "Escape") {
    p();
    return;
  }
  const r = G[e.key];
  r && (e.preventDefault(), h.has(r) || (h.add(r), I(r)));
}, O = (e) => {
  const r = G[e.key];
  r && h.delete(r);
};
let X = 0;
function Y() {
  const e = o.slides[o.activeSlideIndex] || o.slides[0];
  return e ? { x: e.spatialPosition.x, y: e.spatialPosition.y, width: e.dimensions.width, height: e.dimensions.height } : { x: 0, y: 0, width: 800, height: 600 };
}
function Z() {
  const e = Y(), r = {
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
  }, s = (n, t, i, d, l, S) => {
    const D = {
      id: `game-${Date.now()}-${++X}`,
      type: n,
      x: t,
      y: i,
      width: d,
      height: l,
      backgroundColor: "#3b82f6",
      seed: 1,
      ...r,
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
      const t = o.elements.find((i) => i.id === n || i.tag === n || i.text === n);
      return t ? new A(t.id) : null;
    },
    findAll: (n) => o.elements.filter((t) => t.id === n || t.tag === n || t.text === n).map((t) => new A(t.id)),
    spawn: (n, t, i, d, l, S) => s(n, t, i, d, l, S),
    spawnText: (n, t, i, d = 32, l) => s("text", t, i, Math.max(60, n.length * d * 0.6), d * 1.4, {
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
      if (c && o.elements.some((i) => i.id === c))
        C(c, { text: t });
      else {
        const i = Math.round(e.width / 18);
        c = s("text", e.x + e.width * 0.1, e.y + 16, e.width * 0.8, i * 1.5, {
          text: t,
          fontSize: i,
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
      const t = o.states.find((i) => i.name === n || i.id === n);
      t && B(t.id);
    },
    playAnim: (n, t) => {
      n?.alive && import("./index-DJSTqwMl.js").then((i) => i.aq).then((i) => i.sequenceAnimator.playAnimation(n.id, { id: `bhv-${Date.now()}`, type: "preset", name: t, trigger: "programmatic" }, () => {
      }));
    },
    goToPage: (n) => {
      n >= 0 && n < o.slides.length && U(n);
    },
    sound: (n) => {
      import("./index-DJSTqwMl.js").then((t) => t.ar).then((t) => t.playSfx(n));
    },
    music: (n) => {
      import("./index-DJSTqwMl.js").then((t) => t.ar).then((t) => n ? t.startMusic() : t.stopMusic());
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
    clamp: (n, t, i) => Math.max(t, Math.min(i, n))
  };
}
const ie = () => o.gameActive;
function _(e) {
  o.gameActive && p();
  const r = e ?? o.gameScript;
  if (!r?.trim())
    return m("No game script yet — open Menu → Game Script…", "info"), !1;
  g = {
    elements: JSON.stringify(o.elements),
    selection: [...o.selection],
    activeSlideIndex: o.activeSlideIndex,
    appMode: o.appMode,
    viewState: { ...o.viewState }
  }, F = r, w = [], x.length = 0, v.length = 0, h.clear(), c = null, f = 0, P(!1), $ = null;
  let s;
  try {
    s = new Function("game", `'use strict';
${r}`);
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
    const i = Math.min(0.05, (t - M) / 1e3);
    if (M = t, T) return;
    const d = (t - k) / 1e3;
    try {
      b(() => {
        for (const l of w) l(i, d);
      });
    } catch (l) {
      console.error("[arcade] tick error:", l), m(`Game error: ${l?.message || l}`, "error"), p();
    }
  };
  return y = requestAnimationFrame(n), !0;
}
function p() {
  if (y !== null && (cancelAnimationFrame(y), y = null), window.removeEventListener("keydown", K, !0), window.removeEventListener("keyup", O, !0), import("./index-DJSTqwMl.js").then((e) => e.ar).then((e) => e.stopMusic()), h.clear(), w = [], x.length = 0, v.length = 0, g) {
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
  ie as isGameRunning,
  re as onGameUiSignal,
  q as padPress,
  Q as padRelease,
  $ as padVisibleOverride,
  se as restartGame,
  _ as startGame,
  p as stopGame
};
