import { g as $ } from "./PrioritizedList-TjDg4i-s.js";
import { r as k } from "./InputJax-DQpRzuU2.js";
import { r as m } from "./Options-BStFr0zv.js";
import { r as D, a as J } from "./Factory-B4kWsy6c.js";
import { r as U } from "./MathItem-DD5NNBjZ.js";
import { r as L, a as z, b as B, c as Z, d as G, e as H, f as K } from "./BaseConfiguration-B0Un-ANd.js";
function Q(x, b) {
  for (var F = 0; F < b.length; F++) {
    const p = b[F];
    if (typeof p != "string" && !Array.isArray(p)) {
      for (const O in p)
        if (O !== "default" && !(O in x)) {
          const v = Object.getOwnPropertyDescriptor(p, O);
          v && Object.defineProperty(x, O, v.get ? v : {
            enumerable: !0,
            get: () => p[O]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(x, Symbol.toStringTag, { value: "Module" }));
}
var T = {}, j = {}, w = {}, q;
function V() {
  if (q) return w;
  q = 1, Object.defineProperty(w, "__esModule", { value: !0 }), w.AbstractFindMath = void 0;
  var x = m(), b = (function() {
    function F(p) {
      var O = this.constructor;
      this.options = (0, x.userOptions)((0, x.defaultOptions)({}, O.OPTIONS), p);
    }
    return F.OPTIONS = {}, F;
  })();
  return w.AbstractFindMath = b, w;
}
var N;
function W() {
  if (N) return j;
  N = 1;
  var x = j && j.__extends || /* @__PURE__ */ (function() {
    var g = function(h, f) {
      return g = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(l, n) {
        l.__proto__ = n;
      } || function(l, n) {
        for (var a in n) Object.prototype.hasOwnProperty.call(n, a) && (l[a] = n[a]);
      }, g(h, f);
    };
    return function(h, f) {
      if (typeof f != "function" && f !== null)
        throw new TypeError("Class extends value " + String(f) + " is not a constructor or null");
      g(h, f);
      function l() {
        this.constructor = h;
      }
      h.prototype = f === null ? Object.create(f) : (l.prototype = f.prototype, new l());
    };
  })(), b = j && j.__read || function(g, h) {
    var f = typeof Symbol == "function" && g[Symbol.iterator];
    if (!f) return g;
    var l = f.call(g), n, a = [], i;
    try {
      for (; (h === void 0 || h-- > 0) && !(n = l.next()).done; ) a.push(n.value);
    } catch (c) {
      i = { error: c };
    } finally {
      try {
        n && !n.done && (f = l.return) && f.call(l);
      } finally {
        if (i) throw i.error;
      }
    }
    return a;
  };
  Object.defineProperty(j, "__esModule", { value: !0 }), j.FindTeX = void 0;
  var F = V(), p = D(), O = U(), v = (function(g) {
    x(h, g);
    function h(f) {
      var l = g.call(this, f) || this;
      return l.getPatterns(), l;
    }
    return h.prototype.getPatterns = function() {
      var f = this, l = this.options, n = [], a = [], i = [];
      this.end = {}, this.env = this.sub = 0;
      var c = 1;
      l.inlineMath.forEach(function(d) {
        return f.addPattern(n, d, !1);
      }), l.displayMath.forEach(function(d) {
        return f.addPattern(n, d, !0);
      }), n.length && a.push(n.sort(p.sortLength).join("|")), l.processEnvironments && (a.push("\\\\begin\\s*\\{([^}]*)\\}"), this.env = c, c++), l.processEscapes && i.push("\\\\([\\\\$])"), l.processRefs && i.push("(\\\\(?:eq)?ref\\s*\\{[^}]*\\})"), i.length && (a.push("(" + i.join("|") + ")"), this.sub = c), this.start = new RegExp(a.join("|"), "g"), this.hasPatterns = a.length > 0;
    }, h.prototype.addPattern = function(f, l, n) {
      var a = b(l, 2), i = a[0], c = a[1];
      f.push((0, p.quotePattern)(i)), this.end[i] = [c, n, this.endPattern(c)];
    }, h.prototype.endPattern = function(f, l) {
      return new RegExp((l || (0, p.quotePattern)(f)) + "|\\\\(?:[a-zA-Z]|.)|[{}]", "g");
    }, h.prototype.findEnd = function(f, l, n, a) {
      for (var i = b(a, 3), c = i[0], d = i[1], u = i[2], r = u.lastIndex = n.index + n[0].length, e, t = 0; e = u.exec(f); ) {
        if ((e[1] || e[0]) === c && t === 0)
          return (0, O.protoItem)(n[0], f.substr(r, e.index - r), e[0], l, n.index, e.index + e[0].length, d);
        e[0] === "{" ? t++ : e[0] === "}" && t && t--;
      }
      return null;
    }, h.prototype.findMathInString = function(f, l, n) {
      var a, i;
      for (this.start.lastIndex = 0; a = this.start.exec(n); ) {
        if (a[this.env] !== void 0 && this.env) {
          var c = "\\\\end\\s*(\\{" + (0, p.quotePattern)(a[this.env]) + "\\})";
          i = this.findEnd(n, l, a, ["{" + a[this.env] + "}", !0, this.endPattern(null, c)]), i && (i.math = i.open + i.math + i.close, i.open = i.close = "");
        } else if (a[this.sub] !== void 0 && this.sub) {
          var d = a[this.sub], c = a.index + a[this.sub].length;
          d.length === 2 ? i = (0, O.protoItem)("", d.substr(1), "", l, a.index, c) : i = (0, O.protoItem)("", d, "", l, a.index, c, !1);
        } else
          i = this.findEnd(n, l, a, this.end[a[0]]);
        i && (f.push(i), this.start.lastIndex = i.end.n);
      }
    }, h.prototype.findMath = function(f) {
      var l = [];
      if (this.hasPatterns)
        for (var n = 0, a = f.length; n < a; n++)
          this.findMathInString(l, n, f[n]);
      return l;
    }, h.OPTIONS = {
      inlineMath: [
        ["\\(", "\\)"]
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"]
      ],
      processEscapes: !0,
      processEnvironments: !0,
      processRefs: !0
    }, h;
  })(F.AbstractFindMath);
  return j.FindTeX = v, j;
}
var M = {}, X;
function Y() {
  if (X) return M;
  X = 1;
  var x = M && M.__values || function(v) {
    var g = typeof Symbol == "function" && Symbol.iterator, h = g && v[g], f = 0;
    if (h) return h.call(v);
    if (v && typeof v.length == "number") return {
      next: function() {
        return v && f >= v.length && (v = void 0), { value: v && v[f++], done: !v };
      }
    };
    throw new TypeError(g ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, b = M && M.__importDefault || function(v) {
    return v && v.__esModule ? v : { default: v };
  };
  Object.defineProperty(M, "__esModule", { value: !0 });
  var F = J(), p = b(L()), O;
  return (function(v) {
    v.cleanStretchy = function(n) {
      var a, i, c = n.data;
      try {
        for (var d = x(c.getList("fixStretchy")), u = d.next(); !u.done; u = d.next()) {
          var r = u.value;
          if (p.default.getProperty(r, "fixStretchy")) {
            var e = p.default.getForm(r);
            e && e[3] && e[3].stretchy && p.default.setAttribute(r, "stretchy", !1);
            var t = r.parent;
            if (!p.default.getTexClass(r) && (!e || !e[2])) {
              var o = c.nodeFactory.create("node", "TeXAtom", [r]);
              t.replaceChild(o, r), o.inheritAttributesFrom(r);
            }
            p.default.removeProperties(r, "fixStretchy");
          }
        }
      } catch (s) {
        a = { error: s };
      } finally {
        try {
          u && !u.done && (i = d.return) && i.call(d);
        } finally {
          if (a) throw a.error;
        }
      }
    }, v.cleanAttributes = function(n) {
      var a = n.data.root;
      a.walkTree(function(i, c) {
        var d, u, r = i.attributes;
        if (r) {
          var e = new Set((r.get("mjx-keep-attrs") || "").split(/ /));
          delete r.getAllAttributes()["mjx-keep-attrs"];
          try {
            for (var t = x(r.getExplicitNames()), o = t.next(); !o.done; o = t.next()) {
              var s = o.value;
              !e.has(s) && r.attributes[s] === i.attributes.getInherited(s) && delete r.attributes[s];
            }
          } catch (y) {
            d = { error: y };
          } finally {
            try {
              o && !o.done && (u = t.return) && u.call(t);
            } finally {
              if (d) throw d.error;
            }
          }
        }
      }, {});
    }, v.combineRelations = function(n) {
      var a, i, c, d, u = [];
      try {
        for (var r = x(n.data.getList("mo")), e = r.next(); !e.done; e = r.next()) {
          var t = e.value;
          if (!(t.getProperty("relationsCombined") || !t.parent || t.parent && !p.default.isType(t.parent, "mrow") || p.default.getTexClass(t) !== F.TEXCLASS.REL)) {
            for (var o = t.parent, s = void 0, y = o.childNodes, _ = y.indexOf(t) + 1, S = p.default.getProperty(t, "variantForm"); _ < y.length && (s = y[_]) && p.default.isType(s, "mo") && p.default.getTexClass(s) === F.TEXCLASS.REL; )
              if (S === p.default.getProperty(s, "variantForm") && h(t, s)) {
                p.default.appendChildren(t, p.default.getChildren(s)), g(["stretchy", "rspace"], t, s);
                try {
                  for (var E = (c = void 0, x(s.getPropertyNames())), P = E.next(); !P.done; P = E.next()) {
                    var I = P.value;
                    t.setProperty(I, s.getProperty(I));
                  }
                } catch (A) {
                  c = { error: A };
                } finally {
                  try {
                    P && !P.done && (d = E.return) && d.call(E);
                  } finally {
                    if (c) throw c.error;
                  }
                }
                y.splice(_, 1), u.push(s), s.parent = null, s.setProperty("relationsCombined", !0);
              } else {
                t.attributes.getExplicit("rspace") == null && p.default.setAttribute(t, "rspace", "0pt"), s.attributes.getExplicit("lspace") == null && p.default.setAttribute(s, "lspace", "0pt");
                break;
              }
            t.attributes.setInherited("form", t.getForms()[0]);
          }
        }
      } catch (A) {
        a = { error: A };
      } finally {
        try {
          e && !e.done && (i = r.return) && i.call(r);
        } finally {
          if (a) throw a.error;
        }
      }
      n.data.removeFromList("mo", u);
    };
    var g = function(n, a, i) {
      var c = a.attributes, d = i.attributes;
      n.forEach(function(u) {
        var r = d.getExplicit(u);
        r != null && c.set(u, r);
      });
    }, h = function(n, a) {
      var i, c, d = function(_, S) {
        var E = _.getExplicitNames();
        return E.filter(function(P) {
          return P !== S && (P !== "stretchy" || _.getExplicit("stretchy"));
        });
      }, u = n.attributes, r = a.attributes, e = d(u, "lspace"), t = d(r, "rspace");
      if (e.length !== t.length)
        return !1;
      try {
        for (var o = x(e), s = o.next(); !s.done; s = o.next()) {
          var y = s.value;
          if (u.getExplicit(y) !== r.getExplicit(y))
            return !1;
        }
      } catch (_) {
        i = { error: _ };
      } finally {
        try {
          s && !s.done && (c = o.return) && c.call(o);
        } finally {
          if (i) throw i.error;
        }
      }
      return !0;
    }, f = function(n, a, i) {
      var c, d, u = [];
      try {
        for (var r = x(n.getList("m" + a + i)), e = r.next(); !e.done; e = r.next()) {
          var t = e.value, o = t.childNodes;
          if (!(o[t[a]] && o[t[i]])) {
            var s = t.parent, y = o[t[a]] ? n.nodeFactory.create("node", "m" + a, [o[t.base], o[t[a]]]) : n.nodeFactory.create("node", "m" + i, [o[t.base], o[t[i]]]);
            p.default.copyAttributes(t, y), s ? s.replaceChild(y, t) : n.root = y, u.push(t);
          }
        }
      } catch (_) {
        c = { error: _ };
      } finally {
        try {
          e && !e.done && (d = r.return) && d.call(r);
        } finally {
          if (c) throw c.error;
        }
      }
      n.removeFromList("m" + a + i, u);
    };
    v.cleanSubSup = function(n) {
      var a = n.data;
      a.error || (f(a, "sub", "sup"), f(a, "under", "over"));
    };
    var l = function(n, a, i) {
      var c, d, u = [];
      try {
        for (var r = x(n.getList(a)), e = r.next(); !e.done; e = r.next()) {
          var t = e.value;
          if (!t.attributes.get("displaystyle")) {
            var o = t.childNodes[t.base], s = o.coreMO();
            if (o.getProperty("movablelimits") && !s.attributes.getExplicit("movablelimits")) {
              var y = n.nodeFactory.create("node", i, t.childNodes);
              p.default.copyAttributes(t, y), t.parent ? t.parent.replaceChild(y, t) : n.root = y, u.push(t);
            }
          }
        }
      } catch (_) {
        c = { error: _ };
      } finally {
        try {
          e && !e.done && (d = r.return) && d.call(r);
        } finally {
          if (c) throw c.error;
        }
      }
      n.removeFromList(a, u);
    };
    v.moveLimits = function(n) {
      var a = n.data;
      l(a, "munderover", "msubsup"), l(a, "munder", "msub"), l(a, "mover", "msup");
    }, v.setInherited = function(n) {
      n.data.root.setInheritedAttributes({}, n.math.display, 0, !1);
    };
  })(O || (O = {})), M.default = O, M;
}
var C;
function tt() {
  if (C) return T;
  C = 1;
  var x = T && T.__extends || /* @__PURE__ */ (function() {
    var u = function(r, e) {
      return u = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, o) {
        t.__proto__ = o;
      } || function(t, o) {
        for (var s in o) Object.prototype.hasOwnProperty.call(o, s) && (t[s] = o[s]);
      }, u(r, e);
    };
    return function(r, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      u(r, e);
      function t() {
        this.constructor = r;
      }
      r.prototype = e === null ? Object.create(e) : (t.prototype = e.prototype, new t());
    };
  })(), b = T && T.__assign || function() {
    return b = Object.assign || function(u) {
      for (var r, e = 1, t = arguments.length; e < t; e++) {
        r = arguments[e];
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (u[o] = r[o]);
      }
      return u;
    }, b.apply(this, arguments);
  }, F = T && T.__read || function(u, r) {
    var e = typeof Symbol == "function" && u[Symbol.iterator];
    if (!e) return u;
    var t = e.call(u), o, s = [], y;
    try {
      for (; (r === void 0 || r-- > 0) && !(o = t.next()).done; ) s.push(o.value);
    } catch (_) {
      y = { error: _ };
    } finally {
      try {
        o && !o.done && (e = t.return) && e.call(t);
      } finally {
        if (y) throw y.error;
      }
    }
    return s;
  }, p = T && T.__importDefault || function(u) {
    return u && u.__esModule ? u : { default: u };
  };
  Object.defineProperty(T, "__esModule", { value: !0 }), T.TeX = void 0;
  var O = k(), v = m(), g = W(), h = p(Y()), f = p(L()), l = p(z()), n = p(B()), a = p(Z()), i = G(), c = H();
  K();
  var d = (function(u) {
    x(r, u);
    function r(e) {
      e === void 0 && (e = {});
      var t = this, o = F((0, v.separateOptions)(e, r.OPTIONS, g.FindTeX.OPTIONS), 3), s = o[0], y = o[1], _ = o[2];
      t = u.call(this, y) || this, t.findTeX = t.options.FindTeX || new g.FindTeX(_);
      var S = t.options.packages, E = t.configuration = r.configure(S), P = t._parseOptions = new a.default(E, [t.options, i.TagsFactory.OPTIONS]);
      return (0, v.userOptions)(P.options, s), E.config(t), r.tags(P, E), t.postFilters.add(h.default.cleanSubSup, -6), t.postFilters.add(h.default.setInherited, -5), t.postFilters.add(h.default.moveLimits, -4), t.postFilters.add(h.default.cleanStretchy, -3), t.postFilters.add(h.default.cleanAttributes, -2), t.postFilters.add(h.default.combineRelations, -1), t;
    }
    return r.configure = function(e) {
      var t = new c.ParserConfiguration(e, ["tex"]);
      return t.init(), t;
    }, r.tags = function(e, t) {
      i.TagsFactory.addTags(t.tags), i.TagsFactory.setDefault(e.options.tags), e.tags = i.TagsFactory.getDefault(), e.tags.configuration = e;
    }, r.prototype.setMmlFactory = function(e) {
      u.prototype.setMmlFactory.call(this, e), this._parseOptions.nodeFactory.setMmlFactory(e);
    }, Object.defineProperty(r.prototype, "parseOptions", {
      get: function() {
        return this._parseOptions;
      },
      enumerable: !1,
      configurable: !0
    }), r.prototype.reset = function(e) {
      e === void 0 && (e = 0), this.parseOptions.tags.reset(e);
    }, r.prototype.compile = function(e, t) {
      this.parseOptions.clear(), this.executeFilters(this.preFilters, e, t, this.parseOptions);
      var o = e.display;
      this.latex = e.math;
      var s;
      this.parseOptions.tags.startEquation(e);
      var y;
      try {
        var _ = new l.default(this.latex, { display: o, isInner: !1 }, this.parseOptions);
        s = _.mml(), y = _.stack.global;
      } catch (S) {
        if (!(S instanceof n.default))
          throw S;
        this.parseOptions.error = !0, s = this.options.formatError(this, S);
      }
      return s = this.parseOptions.nodeFactory.create("node", "math", [s]), y?.indentalign && f.default.setAttribute(s, "indentalign", y.indentalign), o && f.default.setAttribute(s, "display", "block"), this.parseOptions.tags.finishEquation(e), this.parseOptions.root = s, this.executeFilters(this.postFilters, e, t, this.parseOptions), this.mathNode = this.parseOptions.root, this.mathNode;
    }, r.prototype.findMath = function(e) {
      return this.findTeX.findMath(e);
    }, r.prototype.formatError = function(e) {
      var t = e.message.replace(/\n.*/, "");
      return this.parseOptions.nodeFactory.create("error", t, e.id, this.latex);
    }, r.NAME = "TeX", r.OPTIONS = b(b({}, O.AbstractInputJax.OPTIONS), { FindTeX: null, packages: ["base"], digits: /^(?:[0-9]+(?:\{,\}[0-9]{3})*(?:\.[0-9]*)?|\.[0-9]+)/, maxBuffer: 5 * 1024, formatError: function(e, t) {
      return e.formatError(t);
    } }), r;
  })(O.AbstractInputJax);
  return T.TeX = d, T;
}
var R = tt();
const et = /* @__PURE__ */ $(R), ut = /* @__PURE__ */ Q({
  __proto__: null,
  default: et
}, [R]);
export {
  ut as t
};
