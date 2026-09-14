import { h as T, i as it, o as nt, j as st, k as x, s as U, l as h, S as A, m as S, n as g, q as v, F as at, r as lt, v as C } from "./index-DwuNgPra.js";
var ct = /* @__PURE__ */ C("<svg><rect rx=10 fill=black></svg>", !1, !0, !1), ut = /* @__PURE__ */ C("<div class=tour-spotlight-ring>"), dt = /* @__PURE__ */ C('<div class=tour-overlay role=dialog aria-modal=true aria-label="Product tour"><svg class=tour-mask width=100% height=100%><defs><mask id=tour-spotlight><rect width=100% height=100% fill=white></rect></mask></defs><rect width=100% height=100% fill=rgba(0,0,0,0.6) mask=url(#tour-spotlight)></rect></svg><div class=tour-tooltip><div class=tour-tooltip-head><span class=tour-step-count> of </span><button class=tour-skip>Skip tour</button></div><h3 class=tour-title></h3><p class=tour-content></p><div class=tour-nav><button class="tour-btn tour-btn-secondary">Back</button><button class="tour-btn tour-btn-primary"></button></div><div class=tour-dots>'), ht = /* @__PURE__ */ C("<button class=tour-dot>");
const Q = "yappy:tour:seen", L = [{
  id: "welcome",
  title: "Welcome to YappyDraw 👋",
  content: "A quick tour of the essentials — about a minute. Click Next to explore each area, or Skip anytime. You can replay this later from Help (?).",
  target: ".text-logo",
  position: "bottom"
}, {
  id: "toolbar",
  title: "Your tools",
  content: "Pick shapes, pen, text, connectors, images and more here. Click a tool — or press its number key — to switch. Drag the handle to move the toolbar.",
  target: ".toolbar-container",
  position: "bottom"
}, {
  id: "canvas",
  title: "The canvas",
  content: "This is your infinite canvas. Draw or drag to create, click to select, scroll to zoom, and hold Space + drag to pan around.",
  target: ".canvas-drop-zone",
  position: "center"
}, {
  id: "properties",
  title: "Properties",
  content: "Select anything to fine-tune it here — fill, stroke, size, text, effects, animation and more. Toggle it with Alt+Enter, and dock, float or collapse it like any other panel.",
  // The BUTTON, not the panel: Properties is a dock panel now, so the panel element only
  // exists while it happens to be open — spotlighting it would silently no-op mid-tour.
  target: ".topbar-properties-btn",
  position: "bottom"
}, {
  id: "utilities",
  title: "Settings & Help",
  content: "Global settings, the Properties toggle, and Help live up here in the top bar. Open Help for keyboard shortcuts and docs — both it and Settings are searchable.",
  target: ".topbar-view-controls",
  position: "bottom"
}, {
  id: "finish",
  title: "You're all set 🎨",
  content: "That's the tour! Reopen it anytime from Help (?) → “Take the tour”. Have fun creating.",
  target: ".help-btn",
  position: "bottom"
}], [w, X] = T(!1), [f, $] = T(0), ft = w;
function pt() {
  $(0), X(!0);
}
let Z = !1;
function tt() {
  Z = !0;
  try {
    localStorage.setItem(Q, "1");
  } catch {
  }
}
function V(s = !0) {
  X(!1), s && tt();
}
function J() {
  if (Z) return !0;
  try {
    return localStorage.getItem(Q) === "1";
  } catch {
    return !1;
  }
}
function gt() {
  J() || U.appMode !== "presentation" && setTimeout(() => {
    J() || U.appMode === "presentation" || (tt(), pt());
  }, 900);
}
const m = 340, b = 200, p = 16, mt = () => {
  const [s, P] = T(null), [H, R] = T({
    top: 0,
    left: 0
  }), E = () => L[f()], D = () => L.length, M = () => f() === D() - 1, O = () => f() === 0, z = () => {
    M() ? V(!0) : $((e) => e + 1);
  }, I = () => {
    O() || $((e) => e - 1);
  }, q = () => V(!0), F = (e, l) => ({
    top: Math.max(p, Math.min(e, window.innerHeight - b - p)),
    left: Math.max(p, Math.min(l, window.innerWidth - m - p))
  }), Y = () => {
    const e = E();
    if (!e) return;
    const l = e.target ? document.querySelector(e.target) : null;
    if (!l || e.position === "center") {
      P(l ? l.getBoundingClientRect() : null), R(F(window.innerHeight / 2 - b / 2, window.innerWidth / 2 - m / 2));
      return;
    }
    const r = l.getBoundingClientRect();
    P(r);
    let c = 0, a = 0;
    switch (e.position ?? "bottom") {
      case "top":
        c = r.top - b - p, a = r.left + r.width / 2 - m / 2;
        break;
      case "bottom":
        c = r.bottom + p, a = r.left + r.width / 2 - m / 2;
        break;
      case "left":
        c = r.top + r.height / 2 - b / 2, a = r.left - m - p;
        break;
      case "right":
        c = r.top + r.height / 2 - b / 2, a = r.right + p;
        break;
    }
    R(F(c, a));
  };
  it(() => {
    w() && (f(), requestAnimationFrame(() => requestAnimationFrame(Y)));
  });
  const k = () => {
    w() && Y();
  }, W = (e) => {
    w() && (e.key === "Escape" ? (e.preventDefault(), q()) : e.key === "ArrowRight" || e.key === "Enter" ? (e.preventDefault(), z()) : e.key === "ArrowLeft" && (e.preventDefault(), I()));
  };
  return nt(() => {
    window.addEventListener("resize", k), window.addEventListener("scroll", k, !0), document.addEventListener("keydown", W);
  }), st(() => {
    window.removeEventListener("resize", k), window.removeEventListener("scroll", k, !0), document.removeEventListener("keydown", W);
  }), x(A, {
    get when() {
      return w();
    },
    get children() {
      var e = dt(), l = e.firstChild, r = l.firstChild, c = r.firstChild;
      c.firstChild;
      var a = l.nextSibling, B = a.firstChild, y = B.firstChild, et = y.firstChild, ot = y.nextSibling, G = B.nextSibling, K = G.nextSibling, N = K.nextSibling, _ = N.firstChild, j = _.nextSibling, rt = N.nextSibling;
      return h(c, x(A, {
        get when() {
          return s();
        },
        get children() {
          var o = ct();
          return S((t) => {
            var n = s().left - 6, i = s().top - 6, u = s().width + 12, d = s().height + 12;
            return n !== t.e && g(o, "x", t.e = n), i !== t.t && g(o, "y", t.t = i), u !== t.a && g(o, "width", t.a = u), d !== t.o && g(o, "height", t.o = d), t;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0
          }), o;
        }
      }), null), h(e, x(A, {
        get when() {
          return s();
        },
        get children() {
          var o = ut();
          return S((t) => {
            var n = `${s().top - 6}px`, i = `${s().left - 6}px`, u = `${s().width + 12}px`, d = `${s().height + 12}px`;
            return n !== t.e && v(o, "top", t.e = n), i !== t.t && v(o, "left", t.t = i), u !== t.a && v(o, "width", t.a = u), d !== t.o && v(o, "height", t.o = d), t;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0
          }), o;
        }
      }), a), h(y, () => f() + 1, et), h(y, D, null), ot.$$click = q, h(G, () => E()?.title), h(K, () => E()?.content), _.$$click = I, j.$$click = z, h(j, () => M() ? "Get started" : "Next"), h(rt, x(at, {
        each: L,
        children: (o, t) => (() => {
          var n = ht();
          return n.$$click = () => $(t()), S((i) => {
            var u = t() === f(), d = `Go to step ${t() + 1}`;
            return u !== i.e && n.classList.toggle("active", i.e = u), d !== i.t && g(n, "aria-label", i.t = d), i;
          }, {
            e: void 0,
            t: void 0
          }), n;
        })()
      })), S((o) => {
        var t = `${H().top}px`, n = `${H().left}px`, i = O();
        return t !== o.e && v(a, "top", o.e = t), n !== o.t && v(a, "left", o.t = n), i !== o.a && (_.disabled = o.a = i), o;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      }), e;
    }
  });
};
lt(["click"]);
export {
  mt as OnboardingTour,
  mt as default,
  V as endTour,
  J as hasSeenTour,
  ft as isTourActive,
  gt as maybeAutoStartTour,
  pt as startTour,
  L as tourSteps
};
