import { r as x } from "./PrioritizedList-TjDg4i-s.js";
var o = {}, K;
function Ou() {
  if (K) return o;
  K = 1;
  var u = o && o.__extends || /* @__PURE__ */ (function() {
    var r = function(M, O) {
      return r = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, t) {
        n.__proto__ = t;
      } || function(n, t) {
        for (var e in t) Object.prototype.hasOwnProperty.call(t, e) && (n[e] = t[e]);
      }, r(M, O);
    };
    return function(M, O) {
      if (typeof O != "function" && O !== null)
        throw new TypeError("Class extends value " + String(O) + " is not a constructor or null");
      r(M, O);
      function n() {
        this.constructor = M;
      }
      M.prototype = O === null ? Object.create(O) : (n.prototype = O.prototype, new n());
    };
  })(), S = o && o.__values || function(r) {
    var M = typeof Symbol == "function" && Symbol.iterator, O = M && r[M], n = 0;
    if (O) return O.call(r);
    if (r && typeof r.length == "number") return {
      next: function() {
        return r && n >= r.length && (r = void 0), { value: r && r[n++], done: !r };
      }
    };
    throw new TypeError(M ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, E = o && o.__read || function(r, M) {
    var O = typeof Symbol == "function" && r[Symbol.iterator];
    if (!O) return r;
    var n = O.call(r), t, e = [], f;
    try {
      for (; (M === void 0 || M-- > 0) && !(t = n.next()).done; ) e.push(t.value);
    } catch (d) {
      f = { error: d };
    } finally {
      try {
        t && !t.done && (O = n.return) && O.call(n);
      } finally {
        if (f) throw f.error;
      }
    }
    return e;
  }, L = o && o.__spreadArray || function(r, M, O) {
    if (O || arguments.length === 2) for (var n = 0, t = M.length, e; n < t; n++)
      (e || !(n in M)) && (e || (e = Array.prototype.slice.call(M, 0, n)), e[n] = M[n]);
    return r.concat(e || Array.prototype.slice.call(M));
  };
  Object.defineProperty(o, "__esModule", { value: !0 }), o.FunctionList = void 0;
  var R = x(), l = (function(r) {
    u(M, r);
    function M() {
      return r !== null && r.apply(this, arguments) || this;
    }
    return M.prototype.execute = function() {
      for (var O, n, t = [], e = 0; e < arguments.length; e++)
        t[e] = arguments[e];
      try {
        for (var f = S(this), d = f.next(); !d.done; d = f.next()) {
          var I = d.value, m = I.item.apply(I, L([], E(t), !1));
          if (m === !1)
            return !1;
        }
      } catch (h) {
        O = { error: h };
      } finally {
        try {
          d && !d.done && (n = f.return) && n.call(f);
        } finally {
          if (O) throw O.error;
        }
      }
      return !0;
    }, M.prototype.asyncExecute = function() {
      for (var O = [], n = 0; n < arguments.length; n++)
        O[n] = arguments[n];
      var t = -1, e = this.items;
      return new Promise(function(f, d) {
        (function I() {
          for (var m; ++t < e.length; ) {
            var h = (m = e[t]).item.apply(m, L([], E(O), !1));
            if (h instanceof Promise) {
              h.then(I).catch(function(a) {
                return d(a);
              });
              return;
            }
            if (h === !1) {
              f(!1);
              return;
            }
          }
          f(!0);
        })();
      });
    }, M;
  })(R.PrioritizedList);
  return o.FunctionList = l, o;
}
var v = {}, q;
function uu() {
  if (q) return v;
  q = 1;
  var u = v && v.__read || function(O, n) {
    var t = typeof Symbol == "function" && O[Symbol.iterator];
    if (!t) return O;
    var e = t.call(O), f, d = [], I;
    try {
      for (; (n === void 0 || n-- > 0) && !(f = e.next()).done; ) d.push(f.value);
    } catch (m) {
      I = { error: m };
    } finally {
      try {
        f && !f.done && (t = e.return) && t.call(e);
      } finally {
        if (I) throw I.error;
      }
    }
    return d;
  }, S = v && v.__spreadArray || function(O, n, t) {
    if (t || arguments.length === 2) for (var e = 0, f = n.length, d; e < f; e++)
      (d || !(e in n)) && (d || (d = Array.prototype.slice.call(n, 0, e)), d[e] = n[e]);
    return O.concat(d || Array.prototype.slice.call(n));
  };
  Object.defineProperty(v, "__esModule", { value: !0 }), v.split = v.isPercent = v.unicodeString = v.unicodeChars = v.quotePattern = v.sortLength = void 0;
  function E(O, n) {
    return O.length !== n.length ? n.length - O.length : O === n ? 0 : O < n ? -1 : 1;
  }
  v.sortLength = E;
  function L(O) {
    return O.replace(/([\^$(){}+*?\-|\[\]\:\\])/g, "\\$1");
  }
  v.quotePattern = L;
  function R(O) {
    return Array.from(O).map(function(n) {
      return n.codePointAt(0);
    });
  }
  v.unicodeChars = R;
  function l(O) {
    return String.fromCodePoint.apply(String, S([], u(O), !1));
  }
  v.unicodeString = l;
  function r(O) {
    return !!O.match(/%\s*$/);
  }
  v.isPercent = r;
  function M(O) {
    return O.trim().split(/\s+/);
  }
  return v.split = M, v;
}
var P = {}, k = {}, z;
function tu() {
  return z || (z = 1, (function(u) {
    var S = k && k.__values || function(L) {
      var R = typeof Symbol == "function" && Symbol.iterator, l = R && L[R], r = 0;
      if (l) return l.call(L);
      if (L && typeof L.length == "number") return {
        next: function() {
          return L && r >= L.length && (L = void 0), { value: L && L[r++], done: !L };
        }
      };
      throw new TypeError(R ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(u, "__esModule", { value: !0 }), u.Attributes = u.INHERIT = void 0, u.INHERIT = "_inherit_";
    var E = (function() {
      function L(R, l) {
        this.global = l, this.defaults = Object.create(l), this.inherited = Object.create(this.defaults), this.attributes = Object.create(this.inherited), Object.assign(this.defaults, R);
      }
      return L.prototype.set = function(R, l) {
        this.attributes[R] = l;
      }, L.prototype.setList = function(R) {
        Object.assign(this.attributes, R);
      }, L.prototype.get = function(R) {
        var l = this.attributes[R];
        return l === u.INHERIT && (l = this.global[R]), l;
      }, L.prototype.getExplicit = function(R) {
        if (this.attributes.hasOwnProperty(R))
          return this.attributes[R];
      }, L.prototype.getList = function() {
        for (var R, l, r = [], M = 0; M < arguments.length; M++)
          r[M] = arguments[M];
        var O = {};
        try {
          for (var n = S(r), t = n.next(); !t.done; t = n.next()) {
            var e = t.value;
            O[e] = this.get(e);
          }
        } catch (f) {
          R = { error: f };
        } finally {
          try {
            t && !t.done && (l = n.return) && l.call(n);
          } finally {
            if (R) throw R.error;
          }
        }
        return O;
      }, L.prototype.setInherited = function(R, l) {
        this.inherited[R] = l;
      }, L.prototype.getInherited = function(R) {
        return this.inherited[R];
      }, L.prototype.getDefault = function(R) {
        return this.defaults[R];
      }, L.prototype.isSet = function(R) {
        return this.attributes.hasOwnProperty(R) || this.inherited.hasOwnProperty(R);
      }, L.prototype.hasDefault = function(R) {
        return R in this.defaults;
      }, L.prototype.getExplicitNames = function() {
        return Object.keys(this.attributes);
      }, L.prototype.getInheritedNames = function() {
        return Object.keys(this.inherited);
      }, L.prototype.getDefaultNames = function() {
        return Object.keys(this.defaults);
      }, L.prototype.getGlobalNames = function() {
        return Object.keys(this.global);
      }, L.prototype.getAllAttributes = function() {
        return this.attributes;
      }, L.prototype.getAllInherited = function() {
        return this.inherited;
      }, L.prototype.getAllDefaults = function() {
        return this.defaults;
      }, L.prototype.getAllGlobals = function() {
        return this.global;
      }, L;
    })();
    u.Attributes = E;
  })(k)), k;
}
var b = {}, U;
function nu() {
  if (U) return b;
  U = 1;
  var u = b && b.__extends || /* @__PURE__ */ (function() {
    var l = function(r, M) {
      return l = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(O, n) {
        O.__proto__ = n;
      } || function(O, n) {
        for (var t in n) Object.prototype.hasOwnProperty.call(n, t) && (O[t] = n[t]);
      }, l(r, M);
    };
    return function(r, M) {
      if (typeof M != "function" && M !== null)
        throw new TypeError("Class extends value " + String(M) + " is not a constructor or null");
      l(r, M);
      function O() {
        this.constructor = r;
      }
      r.prototype = M === null ? Object.create(M) : (O.prototype = M.prototype, new O());
    };
  })(), S = b && b.__assign || function() {
    return S = Object.assign || function(l) {
      for (var r, M = 1, O = arguments.length; M < O; M++) {
        r = arguments[M];
        for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (l[n] = r[n]);
      }
      return l;
    }, S.apply(this, arguments);
  }, E = b && b.__values || function(l) {
    var r = typeof Symbol == "function" && Symbol.iterator, M = r && l[r], O = 0;
    if (M) return M.call(l);
    if (l && typeof l.length == "number") return {
      next: function() {
        return l && O >= l.length && (l = void 0), { value: l && l[O++], done: !l };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(b, "__esModule", { value: !0 }), b.AbstractEmptyNode = b.AbstractNode = void 0;
  var L = (function() {
    function l(r, M, O) {
      var n, t;
      M === void 0 && (M = {}), O === void 0 && (O = []), this.factory = r, this.parent = null, this.properties = {}, this.childNodes = [];
      try {
        for (var e = E(Object.keys(M)), f = e.next(); !f.done; f = e.next()) {
          var d = f.value;
          this.setProperty(d, M[d]);
        }
      } catch (I) {
        n = { error: I };
      } finally {
        try {
          f && !f.done && (t = e.return) && t.call(e);
        } finally {
          if (n) throw n.error;
        }
      }
      O.length && this.setChildren(O);
    }
    return Object.defineProperty(l.prototype, "kind", {
      get: function() {
        return "unknown";
      },
      enumerable: !1,
      configurable: !0
    }), l.prototype.setProperty = function(r, M) {
      this.properties[r] = M;
    }, l.prototype.getProperty = function(r) {
      return this.properties[r];
    }, l.prototype.getPropertyNames = function() {
      return Object.keys(this.properties);
    }, l.prototype.getAllProperties = function() {
      return this.properties;
    }, l.prototype.removeProperty = function() {
      for (var r, M, O = [], n = 0; n < arguments.length; n++)
        O[n] = arguments[n];
      try {
        for (var t = E(O), e = t.next(); !e.done; e = t.next()) {
          var f = e.value;
          delete this.properties[f];
        }
      } catch (d) {
        r = { error: d };
      } finally {
        try {
          e && !e.done && (M = t.return) && M.call(t);
        } finally {
          if (r) throw r.error;
        }
      }
    }, l.prototype.isKind = function(r) {
      return this.factory.nodeIsKind(this, r);
    }, l.prototype.setChildren = function(r) {
      var M, O;
      this.childNodes = [];
      try {
        for (var n = E(r), t = n.next(); !t.done; t = n.next()) {
          var e = t.value;
          this.appendChild(e);
        }
      } catch (f) {
        M = { error: f };
      } finally {
        try {
          t && !t.done && (O = n.return) && O.call(n);
        } finally {
          if (M) throw M.error;
        }
      }
    }, l.prototype.appendChild = function(r) {
      return this.childNodes.push(r), r.parent = this, r;
    }, l.prototype.replaceChild = function(r, M) {
      var O = this.childIndex(M);
      return O !== null && (this.childNodes[O] = r, r.parent = this, M.parent = null), r;
    }, l.prototype.removeChild = function(r) {
      var M = this.childIndex(r);
      return M !== null && (this.childNodes.splice(M, 1), r.parent = null), r;
    }, l.prototype.childIndex = function(r) {
      var M = this.childNodes.indexOf(r);
      return M === -1 ? null : M;
    }, l.prototype.copy = function() {
      var r, M, O = this.factory.create(this.kind);
      O.properties = S({}, this.properties);
      try {
        for (var n = E(this.childNodes || []), t = n.next(); !t.done; t = n.next()) {
          var e = t.value;
          e && O.appendChild(e.copy());
        }
      } catch (f) {
        r = { error: f };
      } finally {
        try {
          t && !t.done && (M = n.return) && M.call(n);
        } finally {
          if (r) throw r.error;
        }
      }
      return O;
    }, l.prototype.findNodes = function(r) {
      var M = [];
      return this.walkTree(function(O) {
        O.isKind(r) && M.push(O);
      }), M;
    }, l.prototype.walkTree = function(r, M) {
      var O, n;
      r(this, M);
      try {
        for (var t = E(this.childNodes), e = t.next(); !e.done; e = t.next()) {
          var f = e.value;
          f && f.walkTree(r, M);
        }
      } catch (d) {
        O = { error: d };
      } finally {
        try {
          e && !e.done && (n = t.return) && n.call(t);
        } finally {
          if (O) throw O.error;
        }
      }
      return M;
    }, l.prototype.toString = function() {
      return this.kind + "(" + this.childNodes.join(",") + ")";
    }, l;
  })();
  b.AbstractNode = L;
  var R = (function(l) {
    u(r, l);
    function r() {
      return l !== null && l.apply(this, arguments) || this;
    }
    return r.prototype.setChildren = function(M) {
    }, r.prototype.appendChild = function(M) {
      return M;
    }, r.prototype.replaceChild = function(M, O) {
      return O;
    }, r.prototype.childIndex = function(M) {
      return null;
    }, r.prototype.walkTree = function(M, O) {
      return M(this, O), O;
    }, r.prototype.toString = function() {
      return this.kind;
    }, r;
  })(L);
  return b.AbstractEmptyNode = R, b;
}
var $;
function Y() {
  return $ || ($ = 1, (function(u) {
    var S = P && P.__extends || /* @__PURE__ */ (function() {
      var h = function(a, i) {
        return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(A, C) {
          A.__proto__ = C;
        } || function(A, C) {
          for (var c in C) Object.prototype.hasOwnProperty.call(C, c) && (A[c] = C[c]);
        }, h(a, i);
      };
      return function(a, i) {
        if (typeof i != "function" && i !== null)
          throw new TypeError("Class extends value " + String(i) + " is not a constructor or null");
        h(a, i);
        function A() {
          this.constructor = a;
        }
        a.prototype = i === null ? Object.create(i) : (A.prototype = i.prototype, new A());
      };
    })(), E = P && P.__assign || function() {
      return E = Object.assign || function(h) {
        for (var a, i = 1, A = arguments.length; i < A; i++) {
          a = arguments[i];
          for (var C in a) Object.prototype.hasOwnProperty.call(a, C) && (h[C] = a[C]);
        }
        return h;
      }, E.apply(this, arguments);
    }, L = P && P.__values || function(h) {
      var a = typeof Symbol == "function" && Symbol.iterator, i = a && h[a], A = 0;
      if (i) return i.call(h);
      if (h && typeof h.length == "number") return {
        next: function() {
          return h && A >= h.length && (h = void 0), { value: h && h[A++], done: !h };
        }
      };
      throw new TypeError(a ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, R = P && P.__read || function(h, a) {
      var i = typeof Symbol == "function" && h[Symbol.iterator];
      if (!i) return h;
      var A = i.call(h), C, c = [], N;
      try {
        for (; (a === void 0 || a-- > 0) && !(C = A.next()).done; ) c.push(C.value);
      } catch (y) {
        N = { error: y };
      } finally {
        try {
          C && !C.done && (i = A.return) && i.call(A);
        } finally {
          if (N) throw N.error;
        }
      }
      return c;
    };
    Object.defineProperty(u, "__esModule", { value: !0 }), u.XMLNode = u.TextNode = u.AbstractMmlEmptyNode = u.AbstractMmlBaseNode = u.AbstractMmlLayoutNode = u.AbstractMmlTokenNode = u.AbstractMmlNode = u.indentAttributes = u.TEXCLASSNAMES = u.TEXCLASS = void 0;
    var l = tu(), r = nu();
    u.TEXCLASS = {
      ORD: 0,
      OP: 1,
      BIN: 2,
      REL: 3,
      OPEN: 4,
      CLOSE: 5,
      PUNCT: 6,
      INNER: 7,
      VCENTER: 8,
      NONE: -1
    }, u.TEXCLASSNAMES = ["ORD", "OP", "BIN", "REL", "OPEN", "CLOSE", "PUNCT", "INNER", "VCENTER"];
    var M = ["", "thinmathspace", "mediummathspace", "thickmathspace"], O = [
      [0, -1, 2, 3, 0, 0, 0, 1],
      [-1, -1, 0, 3, 0, 0, 0, 1],
      [2, 2, 0, 0, 2, 0, 0, 2],
      [3, 3, 0, 0, 3, 0, 0, 3],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, -1, 2, 3, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1],
      [1, -1, 2, 3, 1, 0, 1, 1]
    ];
    u.indentAttributes = [
      "indentalign",
      "indentalignfirst",
      "indentshift",
      "indentshiftfirst"
    ];
    var n = (function(h) {
      S(a, h);
      function a(i, A, C) {
        A === void 0 && (A = {}), C === void 0 && (C = []);
        var c = h.call(this, i) || this;
        return c.prevClass = null, c.prevLevel = null, c.texclass = null, c.arity < 0 && (c.childNodes = [i.create("inferredMrow")], c.childNodes[0].parent = c), c.setChildren(C), c.attributes = new l.Attributes(i.getNodeClass(c.kind).defaults, i.getNodeClass("math").defaults), c.attributes.setList(A), c;
      }
      return a.prototype.copy = function(i) {
        var A, C, c, N;
        i === void 0 && (i = !1);
        var y = this.factory.create(this.kind);
        if (y.properties = E({}, this.properties), this.attributes) {
          var T = this.attributes.getAllAttributes();
          try {
            for (var B = L(Object.keys(T)), D = B.next(); !D.done; D = B.next()) {
              var g = D.value;
              (g !== "id" || i) && y.attributes.set(g, T[g]);
            }
          } catch (H) {
            A = { error: H };
          } finally {
            try {
              D && !D.done && (C = B.return) && C.call(B);
            } finally {
              if (A) throw A.error;
            }
          }
        }
        if (this.childNodes && this.childNodes.length) {
          var w = this.childNodes;
          w.length === 1 && w[0].isInferred && (w = w[0].childNodes);
          try {
            for (var s = L(w), W = s.next(); !W.done; W = s.next()) {
              var _ = W.value;
              _ ? y.appendChild(_.copy()) : y.childNodes.push(null);
            }
          } catch (H) {
            c = { error: H };
          } finally {
            try {
              W && !W.done && (N = s.return) && N.call(s);
            } finally {
              if (c) throw c.error;
            }
          }
        }
        return y;
      }, Object.defineProperty(a.prototype, "texClass", {
        get: function() {
          return this.texclass;
        },
        set: function(i) {
          this.texclass = i;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isToken", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isEmbellished", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isSpacelike", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "linebreakContainer", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "hasNewLine", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "arity", {
        get: function() {
          return 1 / 0;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isInferred", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "Parent", {
        get: function() {
          for (var i = this.parent; i && i.notParent; )
            i = i.Parent;
          return i;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "notParent", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.setChildren = function(i) {
        return this.arity < 0 ? this.childNodes[0].setChildren(i) : h.prototype.setChildren.call(this, i);
      }, a.prototype.appendChild = function(i) {
        var A, C, c = this;
        if (this.arity < 0)
          return this.childNodes[0].appendChild(i), i;
        if (i.isInferred) {
          if (this.arity === 1 / 0)
            return i.childNodes.forEach(function(D) {
              return h.prototype.appendChild.call(c, D);
            }), i;
          var N = i;
          i = this.factory.create("mrow"), i.setChildren(N.childNodes), i.attributes = N.attributes;
          try {
            for (var y = L(N.getPropertyNames()), T = y.next(); !T.done; T = y.next()) {
              var B = T.value;
              i.setProperty(B, N.getProperty(B));
            }
          } catch (D) {
            A = { error: D };
          } finally {
            try {
              T && !T.done && (C = y.return) && C.call(y);
            } finally {
              if (A) throw A.error;
            }
          }
        }
        return h.prototype.appendChild.call(this, i);
      }, a.prototype.replaceChild = function(i, A) {
        return this.arity < 0 ? (this.childNodes[0].replaceChild(i, A), i) : h.prototype.replaceChild.call(this, i, A);
      }, a.prototype.core = function() {
        return this;
      }, a.prototype.coreMO = function() {
        return this;
      }, a.prototype.coreIndex = function() {
        return 0;
      }, a.prototype.childPosition = function() {
        for (var i, A, C = this, c = C.parent; c && c.notParent; )
          C = c, c = c.parent;
        if (c) {
          var N = 0;
          try {
            for (var y = L(c.childNodes), T = y.next(); !T.done; T = y.next()) {
              var B = T.value;
              if (B === C)
                return N;
              N++;
            }
          } catch (D) {
            i = { error: D };
          } finally {
            try {
              T && !T.done && (A = y.return) && A.call(y);
            } finally {
              if (i) throw i.error;
            }
          }
        }
        return null;
      }, a.prototype.setTeXclass = function(i) {
        return this.getPrevClass(i), this.texClass != null ? this : i;
      }, a.prototype.updateTeXclass = function(i) {
        i && (this.prevClass = i.prevClass, this.prevLevel = i.prevLevel, i.prevClass = i.prevLevel = null, this.texClass = i.texClass);
      }, a.prototype.getPrevClass = function(i) {
        i && (this.prevClass = i.texClass, this.prevLevel = i.attributes.get("scriptlevel"));
      }, a.prototype.texSpacing = function() {
        var i = this.prevClass != null ? this.prevClass : u.TEXCLASS.NONE, A = this.texClass || u.TEXCLASS.ORD;
        if (i === u.TEXCLASS.NONE || A === u.TEXCLASS.NONE)
          return "";
        i === u.TEXCLASS.VCENTER && (i = u.TEXCLASS.ORD), A === u.TEXCLASS.VCENTER && (A = u.TEXCLASS.ORD);
        var C = O[i][A];
        return (this.prevLevel > 0 || this.attributes.get("scriptlevel") > 0) && C >= 0 ? "" : M[Math.abs(C)];
      }, a.prototype.hasSpacingAttributes = function() {
        return this.isEmbellished && this.coreMO().hasSpacingAttributes();
      }, a.prototype.setInheritedAttributes = function(i, A, C, c) {
        var N, y;
        i === void 0 && (i = {}), A === void 0 && (A = !1), C === void 0 && (C = 0), c === void 0 && (c = !1);
        var T = this.attributes.getAllDefaults();
        try {
          for (var B = L(Object.keys(i)), D = B.next(); !D.done; D = B.next()) {
            var g = D.value;
            if (T.hasOwnProperty(g) || a.alwaysInherit.hasOwnProperty(g)) {
              var w = R(i[g], 2), s = w[0], W = w[1], _ = (a.noInherit[s] || {})[this.kind] || {};
              _[g] || this.attributes.setInherited(g, W);
            }
          }
        } catch (p) {
          N = { error: p };
        } finally {
          try {
            D && !D.done && (y = B.return) && y.call(B);
          } finally {
            if (N) throw N.error;
          }
        }
        var H = this.attributes.getExplicit("displaystyle");
        H === void 0 && this.attributes.setInherited("displaystyle", A);
        var Z = this.attributes.getExplicit("scriptlevel");
        Z === void 0 && this.attributes.setInherited("scriptlevel", C), c && this.setProperty("texprimestyle", c);
        var j = this.arity;
        if (j >= 0 && j !== 1 / 0 && (j === 1 && this.childNodes.length === 0 || j !== 1 && this.childNodes.length !== j))
          if (j < this.childNodes.length)
            this.childNodes = this.childNodes.slice(0, j);
          else
            for (; this.childNodes.length < j; )
              this.appendChild(this.factory.create("mrow"));
        this.setChildInheritedAttributes(i, A, C, c);
      }, a.prototype.setChildInheritedAttributes = function(i, A, C, c) {
        var N, y;
        try {
          for (var T = L(this.childNodes), B = T.next(); !B.done; B = T.next()) {
            var D = B.value;
            D.setInheritedAttributes(i, A, C, c);
          }
        } catch (g) {
          N = { error: g };
        } finally {
          try {
            B && !B.done && (y = T.return) && y.call(T);
          } finally {
            if (N) throw N.error;
          }
        }
      }, a.prototype.addInheritedAttributes = function(i, A) {
        var C, c, N = E({}, i);
        try {
          for (var y = L(Object.keys(A)), T = y.next(); !T.done; T = y.next()) {
            var B = T.value;
            B !== "displaystyle" && B !== "scriptlevel" && B !== "style" && (N[B] = [this.kind, A[B]]);
          }
        } catch (D) {
          C = { error: D };
        } finally {
          try {
            T && !T.done && (c = y.return) && c.call(y);
          } finally {
            if (C) throw C.error;
          }
        }
        return N;
      }, a.prototype.inheritAttributesFrom = function(i) {
        var A = i.attributes, C = A.get("displaystyle"), c = A.get("scriptlevel"), N = A.isSet("mathsize") ? {
          mathsize: ["math", A.get("mathsize")]
        } : {}, y = i.getProperty("texprimestyle") || !1;
        this.setInheritedAttributes(N, C, c, y);
      }, a.prototype.verifyTree = function(i) {
        if (i === void 0 && (i = null), i !== null) {
          this.verifyAttributes(i);
          var A = this.arity;
          i.checkArity && A >= 0 && A !== 1 / 0 && (A === 1 && this.childNodes.length === 0 || A !== 1 && this.childNodes.length !== A) && this.mError('Wrong number of children for "' + this.kind + '" node', i, !0), this.verifyChildren(i);
        }
      }, a.prototype.verifyAttributes = function(i) {
        var A, C;
        if (i.checkAttributes) {
          var c = this.attributes, N = [];
          try {
            for (var y = L(c.getExplicitNames()), T = y.next(); !T.done; T = y.next()) {
              var B = T.value;
              B.substr(0, 5) !== "data-" && c.getDefault(B) === void 0 && !B.match(/^(?:class|style|id|(?:xlink:)?href)$/) && N.push(B);
            }
          } catch (D) {
            A = { error: D };
          } finally {
            try {
              T && !T.done && (C = y.return) && C.call(y);
            } finally {
              if (A) throw A.error;
            }
          }
          N.length && this.mError("Unknown attributes for " + this.kind + " node: " + N.join(", "), i);
        }
      }, a.prototype.verifyChildren = function(i) {
        var A, C;
        try {
          for (var c = L(this.childNodes), N = c.next(); !N.done; N = c.next()) {
            var y = N.value;
            y.verifyTree(i);
          }
        } catch (T) {
          A = { error: T };
        } finally {
          try {
            N && !N.done && (C = c.return) && C.call(c);
          } finally {
            if (A) throw A.error;
          }
        }
      }, a.prototype.mError = function(i, A, C) {
        if (C === void 0 && (C = !1), this.parent && this.parent.isKind("merror"))
          return null;
        var c = this.factory.create("merror");
        if (c.attributes.set("data-mjx-message", i), A.fullErrors || C) {
          var N = this.factory.create("mtext"), y = this.factory.create("text");
          y.setText(A.fullErrors ? i : this.kind), N.appendChild(y), c.appendChild(N), this.parent.replaceChild(c, this);
        } else
          this.parent.replaceChild(c, this), c.appendChild(this);
        return c;
      }, a.defaults = {
        mathbackground: l.INHERIT,
        mathcolor: l.INHERIT,
        mathsize: l.INHERIT,
        dir: l.INHERIT
      }, a.noInherit = {
        mstyle: {
          mpadded: { width: !0, height: !0, depth: !0, lspace: !0, voffset: !0 },
          mtable: { width: !0, height: !0, depth: !0, align: !0 }
        },
        maligngroup: {
          mrow: { groupalign: !0 },
          mtable: { groupalign: !0 }
        }
      }, a.alwaysInherit = {
        scriptminsize: !0,
        scriptsizemultiplier: !0
      }, a.verifyDefaults = {
        checkArity: !0,
        checkAttributes: !1,
        fullErrors: !1,
        fixMmultiscripts: !0,
        fixMtables: !0
      }, a;
    })(r.AbstractNode);
    u.AbstractMmlNode = n;
    var t = (function(h) {
      S(a, h);
      function a() {
        return h !== null && h.apply(this, arguments) || this;
      }
      return Object.defineProperty(a.prototype, "isToken", {
        get: function() {
          return !0;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.getText = function() {
        var i, A, C = "";
        try {
          for (var c = L(this.childNodes), N = c.next(); !N.done; N = c.next()) {
            var y = N.value;
            y instanceof I && (C += y.getText());
          }
        } catch (T) {
          i = { error: T };
        } finally {
          try {
            N && !N.done && (A = c.return) && A.call(c);
          } finally {
            if (i) throw i.error;
          }
        }
        return C;
      }, a.prototype.setChildInheritedAttributes = function(i, A, C, c) {
        var N, y;
        try {
          for (var T = L(this.childNodes), B = T.next(); !B.done; B = T.next()) {
            var D = B.value;
            D instanceof n && D.setInheritedAttributes(i, A, C, c);
          }
        } catch (g) {
          N = { error: g };
        } finally {
          try {
            B && !B.done && (y = T.return) && y.call(T);
          } finally {
            if (N) throw N.error;
          }
        }
      }, a.prototype.walkTree = function(i, A) {
        var C, c;
        i(this, A);
        try {
          for (var N = L(this.childNodes), y = N.next(); !y.done; y = N.next()) {
            var T = y.value;
            T instanceof n && T.walkTree(i, A);
          }
        } catch (B) {
          C = { error: B };
        } finally {
          try {
            y && !y.done && (c = N.return) && c.call(N);
          } finally {
            if (C) throw C.error;
          }
        }
        return A;
      }, a.defaults = E(E({}, n.defaults), { mathvariant: "normal", mathsize: l.INHERIT }), a;
    })(n);
    u.AbstractMmlTokenNode = t;
    var e = (function(h) {
      S(a, h);
      function a() {
        return h !== null && h.apply(this, arguments) || this;
      }
      return Object.defineProperty(a.prototype, "isSpacelike", {
        get: function() {
          return this.childNodes[0].isSpacelike;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isEmbellished", {
        get: function() {
          return this.childNodes[0].isEmbellished;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "arity", {
        get: function() {
          return -1;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.core = function() {
        return this.childNodes[0];
      }, a.prototype.coreMO = function() {
        return this.childNodes[0].coreMO();
      }, a.prototype.setTeXclass = function(i) {
        return i = this.childNodes[0].setTeXclass(i), this.updateTeXclass(this.childNodes[0]), i;
      }, a.defaults = n.defaults, a;
    })(n);
    u.AbstractMmlLayoutNode = e;
    var f = (function(h) {
      S(a, h);
      function a() {
        return h !== null && h.apply(this, arguments) || this;
      }
      return Object.defineProperty(a.prototype, "isEmbellished", {
        get: function() {
          return this.childNodes[0].isEmbellished;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.core = function() {
        return this.childNodes[0];
      }, a.prototype.coreMO = function() {
        return this.childNodes[0].coreMO();
      }, a.prototype.setTeXclass = function(i) {
        var A, C;
        this.getPrevClass(i), this.texClass = u.TEXCLASS.ORD;
        var c = this.childNodes[0];
        c ? this.isEmbellished || c.isKind("mi") ? (i = c.setTeXclass(i), this.updateTeXclass(this.core())) : (c.setTeXclass(null), i = this) : i = this;
        try {
          for (var N = L(this.childNodes.slice(1)), y = N.next(); !y.done; y = N.next()) {
            var T = y.value;
            T && T.setTeXclass(null);
          }
        } catch (B) {
          A = { error: B };
        } finally {
          try {
            y && !y.done && (C = N.return) && C.call(N);
          } finally {
            if (A) throw A.error;
          }
        }
        return i;
      }, a.defaults = n.defaults, a;
    })(n);
    u.AbstractMmlBaseNode = f;
    var d = (function(h) {
      S(a, h);
      function a() {
        return h !== null && h.apply(this, arguments) || this;
      }
      return Object.defineProperty(a.prototype, "isToken", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isEmbellished", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isSpacelike", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "linebreakContainer", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "hasNewLine", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "arity", {
        get: function() {
          return 0;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "isInferred", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "notParent", {
        get: function() {
          return !1;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "Parent", {
        get: function() {
          return this.parent;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "texClass", {
        get: function() {
          return u.TEXCLASS.NONE;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "prevClass", {
        get: function() {
          return u.TEXCLASS.NONE;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(a.prototype, "prevLevel", {
        get: function() {
          return 0;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.hasSpacingAttributes = function() {
        return !1;
      }, Object.defineProperty(a.prototype, "attributes", {
        get: function() {
          return null;
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.core = function() {
        return this;
      }, a.prototype.coreMO = function() {
        return this;
      }, a.prototype.coreIndex = function() {
        return 0;
      }, a.prototype.childPosition = function() {
        return 0;
      }, a.prototype.setTeXclass = function(i) {
        return i;
      }, a.prototype.texSpacing = function() {
        return "";
      }, a.prototype.setInheritedAttributes = function(i, A, C, c) {
      }, a.prototype.inheritAttributesFrom = function(i) {
      }, a.prototype.verifyTree = function(i) {
      }, a.prototype.mError = function(i, A, C) {
        return null;
      }, a;
    })(r.AbstractEmptyNode);
    u.AbstractMmlEmptyNode = d;
    var I = (function(h) {
      S(a, h);
      function a() {
        var i = h !== null && h.apply(this, arguments) || this;
        return i.text = "", i;
      }
      return Object.defineProperty(a.prototype, "kind", {
        get: function() {
          return "text";
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.getText = function() {
        return this.text;
      }, a.prototype.setText = function(i) {
        return this.text = i, this;
      }, a.prototype.copy = function() {
        return this.factory.create(this.kind).setText(this.getText());
      }, a.prototype.toString = function() {
        return this.text;
      }, a;
    })(d);
    u.TextNode = I;
    var m = (function(h) {
      S(a, h);
      function a() {
        var i = h !== null && h.apply(this, arguments) || this;
        return i.xml = null, i.adaptor = null, i;
      }
      return Object.defineProperty(a.prototype, "kind", {
        get: function() {
          return "XML";
        },
        enumerable: !1,
        configurable: !0
      }), a.prototype.getXML = function() {
        return this.xml;
      }, a.prototype.setXML = function(i, A) {
        return A === void 0 && (A = null), this.xml = i, this.adaptor = A, this;
      }, a.prototype.getSerializedXML = function() {
        return this.adaptor.serializeXML(this.xml);
      }, a.prototype.copy = function() {
        return this.factory.create(this.kind).setXML(this.adaptor.clone(this.xml));
      }, a.prototype.toString = function() {
        return "XML data";
      }, a;
    })(d);
    u.XMLNode = m;
  })(P)), P;
}
var F = {}, G = {}, V;
function iu() {
  return V || (V = 1, (function(u) {
    var S = G && G.__values || function(l) {
      var r = typeof Symbol == "function" && Symbol.iterator, M = r && l[r], O = 0;
      if (M) return M.call(l);
      if (l && typeof l.length == "number") return {
        next: function() {
          return l && O >= l.length && (l = void 0), { value: l && l[O++], done: !l };
        }
      };
      throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(u, "__esModule", { value: !0 }), u.OPTABLE = u.MMLSPACING = u.getRange = u.RANGES = u.MO = u.OPDEF = void 0;
    var E = Y();
    function L(l, r, M, O) {
      return M === void 0 && (M = E.TEXCLASS.BIN), O === void 0 && (O = null), [l, r, M, O];
    }
    u.OPDEF = L, u.MO = {
      ORD: L(0, 0, E.TEXCLASS.ORD),
      ORD11: L(1, 1, E.TEXCLASS.ORD),
      ORD21: L(2, 1, E.TEXCLASS.ORD),
      ORD02: L(0, 2, E.TEXCLASS.ORD),
      ORD55: L(5, 5, E.TEXCLASS.ORD),
      NONE: L(0, 0, E.TEXCLASS.NONE),
      OP: L(1, 2, E.TEXCLASS.OP, { largeop: !0, movablelimits: !0, symmetric: !0 }),
      OPFIXED: L(1, 2, E.TEXCLASS.OP, { largeop: !0, movablelimits: !0 }),
      INTEGRAL: L(0, 1, E.TEXCLASS.OP, { largeop: !0, symmetric: !0 }),
      INTEGRAL2: L(1, 2, E.TEXCLASS.OP, { largeop: !0, symmetric: !0 }),
      BIN3: L(3, 3, E.TEXCLASS.BIN),
      BIN4: L(4, 4, E.TEXCLASS.BIN),
      BIN01: L(0, 1, E.TEXCLASS.BIN),
      BIN5: L(5, 5, E.TEXCLASS.BIN),
      TALLBIN: L(4, 4, E.TEXCLASS.BIN, { stretchy: !0 }),
      BINOP: L(4, 4, E.TEXCLASS.BIN, { largeop: !0, movablelimits: !0 }),
      REL: L(5, 5, E.TEXCLASS.REL),
      REL1: L(1, 1, E.TEXCLASS.REL, { stretchy: !0 }),
      REL4: L(4, 4, E.TEXCLASS.REL),
      RELSTRETCH: L(5, 5, E.TEXCLASS.REL, { stretchy: !0 }),
      RELACCENT: L(5, 5, E.TEXCLASS.REL, { accent: !0 }),
      WIDEREL: L(5, 5, E.TEXCLASS.REL, { accent: !0, stretchy: !0 }),
      OPEN: L(0, 0, E.TEXCLASS.OPEN, { fence: !0, stretchy: !0, symmetric: !0 }),
      CLOSE: L(0, 0, E.TEXCLASS.CLOSE, { fence: !0, stretchy: !0, symmetric: !0 }),
      INNER: L(0, 0, E.TEXCLASS.INNER),
      PUNCT: L(0, 3, E.TEXCLASS.PUNCT),
      ACCENT: L(0, 0, E.TEXCLASS.ORD, { accent: !0 }),
      WIDEACCENT: L(0, 0, E.TEXCLASS.ORD, { accent: !0, stretchy: !0 })
    }, u.RANGES = [
      [32, 127, E.TEXCLASS.REL, "mo"],
      [160, 191, E.TEXCLASS.ORD, "mo"],
      [192, 591, E.TEXCLASS.ORD, "mi"],
      [688, 879, E.TEXCLASS.ORD, "mo"],
      [880, 6688, E.TEXCLASS.ORD, "mi"],
      [6832, 6911, E.TEXCLASS.ORD, "mo"],
      [6912, 7615, E.TEXCLASS.ORD, "mi"],
      [7616, 7679, E.TEXCLASS.ORD, "mo"],
      [7680, 8191, E.TEXCLASS.ORD, "mi"],
      [8192, 8303, E.TEXCLASS.ORD, "mo"],
      [8304, 8351, E.TEXCLASS.ORD, "mo"],
      [8448, 8527, E.TEXCLASS.ORD, "mi"],
      [8528, 8591, E.TEXCLASS.ORD, "mn"],
      [8592, 8703, E.TEXCLASS.REL, "mo"],
      [8704, 8959, E.TEXCLASS.BIN, "mo"],
      [8960, 9215, E.TEXCLASS.ORD, "mo"],
      [9312, 9471, E.TEXCLASS.ORD, "mn"],
      [9472, 10223, E.TEXCLASS.ORD, "mo"],
      [10224, 10239, E.TEXCLASS.REL, "mo"],
      [10240, 10495, E.TEXCLASS.ORD, "mtext"],
      [10496, 10623, E.TEXCLASS.REL, "mo"],
      [10624, 10751, E.TEXCLASS.ORD, "mo"],
      [10752, 11007, E.TEXCLASS.BIN, "mo"],
      [11008, 11055, E.TEXCLASS.ORD, "mo"],
      [11056, 11087, E.TEXCLASS.REL, "mo"],
      [11088, 11263, E.TEXCLASS.ORD, "mo"],
      [11264, 11744, E.TEXCLASS.ORD, "mi"],
      [11776, 11903, E.TEXCLASS.ORD, "mo"],
      [11904, 12255, E.TEXCLASS.ORD, "mi", "normal"],
      [12272, 12351, E.TEXCLASS.ORD, "mo"],
      [12352, 42143, E.TEXCLASS.ORD, "mi", "normal"],
      [42192, 43055, E.TEXCLASS.ORD, "mi"],
      [43056, 43071, E.TEXCLASS.ORD, "mn"],
      [43072, 55295, E.TEXCLASS.ORD, "mi"],
      [63744, 64255, E.TEXCLASS.ORD, "mi", "normal"],
      [64256, 65023, E.TEXCLASS.ORD, "mi"],
      [65024, 65135, E.TEXCLASS.ORD, "mo"],
      [65136, 65791, E.TEXCLASS.ORD, "mi"],
      [65792, 65935, E.TEXCLASS.ORD, "mn"],
      [65936, 74751, E.TEXCLASS.ORD, "mi", "normal"],
      [74752, 74879, E.TEXCLASS.ORD, "mn"],
      [74880, 113823, E.TEXCLASS.ORD, "mi", "normal"],
      [113824, 119391, E.TEXCLASS.ORD, "mo"],
      [119648, 119679, E.TEXCLASS.ORD, "mn"],
      [119808, 120781, E.TEXCLASS.ORD, "mi"],
      [120782, 120831, E.TEXCLASS.ORD, "mn"],
      [122624, 129023, E.TEXCLASS.ORD, "mo"],
      [129024, 129279, E.TEXCLASS.REL, "mo"],
      [129280, 129535, E.TEXCLASS.ORD, "mo"],
      [131072, 195103, E.TEXCLASS.ORD, "mi", "normnal"]
    ];
    function R(l) {
      var r, M, O = l.codePointAt(0);
      try {
        for (var n = S(u.RANGES), t = n.next(); !t.done; t = n.next()) {
          var e = t.value;
          if (O <= e[1]) {
            if (O >= e[0])
              return e;
            break;
          }
        }
      } catch (f) {
        r = { error: f };
      } finally {
        try {
          t && !t.done && (M = n.return) && M.call(n);
        } finally {
          if (r) throw r.error;
        }
      }
      return null;
    }
    u.getRange = R, u.MMLSPACING = [
      [0, 0],
      [1, 2],
      [3, 3],
      [4, 4],
      [0, 0],
      [0, 0],
      [0, 3]
    ], u.OPTABLE = {
      prefix: {
        "(": u.MO.OPEN,
        "+": u.MO.BIN01,
        "-": u.MO.BIN01,
        "[": u.MO.OPEN,
        "{": u.MO.OPEN,
        "|": u.MO.OPEN,
        "||": [0, 0, E.TEXCLASS.BIN, { fence: !0, stretchy: !0, symmetric: !0 }],
        "|||": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0, symmetric: !0 }],
        "¬": u.MO.ORD21,
        "±": u.MO.BIN01,
        "‖": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0 }],
        "‘": [0, 0, E.TEXCLASS.OPEN, { fence: !0 }],
        "“": [0, 0, E.TEXCLASS.OPEN, { fence: !0 }],
        "ⅅ": u.MO.ORD21,
        "ⅆ": L(2, 0, E.TEXCLASS.ORD),
        "∀": u.MO.ORD21,
        "∂": u.MO.ORD21,
        "∃": u.MO.ORD21,
        "∄": u.MO.ORD21,
        "∇": u.MO.ORD21,
        "∏": u.MO.OP,
        "∐": u.MO.OP,
        "∑": u.MO.OP,
        "−": u.MO.BIN01,
        "∓": u.MO.BIN01,
        "√": [1, 1, E.TEXCLASS.ORD, { stretchy: !0 }],
        "∛": u.MO.ORD11,
        "∜": u.MO.ORD11,
        "∠": u.MO.ORD,
        "∡": u.MO.ORD,
        "∢": u.MO.ORD,
        "∫": u.MO.INTEGRAL,
        "∬": u.MO.INTEGRAL,
        "∭": u.MO.INTEGRAL,
        "∮": u.MO.INTEGRAL,
        "∯": u.MO.INTEGRAL,
        "∰": u.MO.INTEGRAL,
        "∱": u.MO.INTEGRAL,
        "∲": u.MO.INTEGRAL,
        "∳": u.MO.INTEGRAL,
        "⋀": u.MO.OP,
        "⋁": u.MO.OP,
        "⋂": u.MO.OP,
        "⋃": u.MO.OP,
        "⌈": u.MO.OPEN,
        "⌊": u.MO.OPEN,
        "〈": u.MO.OPEN,
        "❲": u.MO.OPEN,
        "⟦": u.MO.OPEN,
        "⟨": u.MO.OPEN,
        "⟪": u.MO.OPEN,
        "⟬": u.MO.OPEN,
        "⟮": u.MO.OPEN,
        "⦀": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0 }],
        "⦃": u.MO.OPEN,
        "⦅": u.MO.OPEN,
        "⦇": u.MO.OPEN,
        "⦉": u.MO.OPEN,
        "⦋": u.MO.OPEN,
        "⦍": u.MO.OPEN,
        "⦏": u.MO.OPEN,
        "⦑": u.MO.OPEN,
        "⦓": u.MO.OPEN,
        "⦕": u.MO.OPEN,
        "⦗": u.MO.OPEN,
        "⧼": u.MO.OPEN,
        "⨀": u.MO.OP,
        "⨁": u.MO.OP,
        "⨂": u.MO.OP,
        "⨃": u.MO.OP,
        "⨄": u.MO.OP,
        "⨅": u.MO.OP,
        "⨆": u.MO.OP,
        "⨇": u.MO.OP,
        "⨈": u.MO.OP,
        "⨉": u.MO.OP,
        "⨊": u.MO.OP,
        "⨋": u.MO.INTEGRAL2,
        "⨌": u.MO.INTEGRAL,
        "⨍": u.MO.INTEGRAL2,
        "⨎": u.MO.INTEGRAL2,
        "⨏": u.MO.INTEGRAL2,
        "⨐": u.MO.OP,
        "⨑": u.MO.OP,
        "⨒": u.MO.OP,
        "⨓": u.MO.OP,
        "⨔": u.MO.OP,
        "⨕": u.MO.INTEGRAL2,
        "⨖": u.MO.INTEGRAL2,
        "⨗": u.MO.INTEGRAL2,
        "⨘": u.MO.INTEGRAL2,
        "⨙": u.MO.INTEGRAL2,
        "⨚": u.MO.INTEGRAL2,
        "⨛": u.MO.INTEGRAL2,
        "⨜": u.MO.INTEGRAL2,
        "⫼": u.MO.OP,
        "⫿": u.MO.OP
      },
      postfix: {
        "!!": L(1, 0),
        "!": [1, 0, E.TEXCLASS.CLOSE, null],
        '"': u.MO.ACCENT,
        "&": u.MO.ORD,
        ")": u.MO.CLOSE,
        "++": L(0, 0),
        "--": L(0, 0),
        "..": L(0, 0),
        "...": u.MO.ORD,
        "'": u.MO.ACCENT,
        "]": u.MO.CLOSE,
        "^": u.MO.WIDEACCENT,
        _: u.MO.WIDEACCENT,
        "`": u.MO.ACCENT,
        "|": u.MO.CLOSE,
        "}": u.MO.CLOSE,
        "~": u.MO.WIDEACCENT,
        "||": [0, 0, E.TEXCLASS.BIN, { fence: !0, stretchy: !0, symmetric: !0 }],
        "|||": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0, symmetric: !0 }],
        "¨": u.MO.ACCENT,
        ª: u.MO.ACCENT,
        "¯": u.MO.WIDEACCENT,
        "°": u.MO.ORD,
        "²": u.MO.ACCENT,
        "³": u.MO.ACCENT,
        "´": u.MO.ACCENT,
        "¸": u.MO.ACCENT,
        "¹": u.MO.ACCENT,
        º: u.MO.ACCENT,
        "ˆ": u.MO.WIDEACCENT,
        "ˇ": u.MO.WIDEACCENT,
        "ˉ": u.MO.WIDEACCENT,
        "ˊ": u.MO.ACCENT,
        "ˋ": u.MO.ACCENT,
        "ˍ": u.MO.WIDEACCENT,
        "˘": u.MO.ACCENT,
        "˙": u.MO.ACCENT,
        "˚": u.MO.ACCENT,
        "˜": u.MO.WIDEACCENT,
        "˝": u.MO.ACCENT,
        "˷": u.MO.WIDEACCENT,
        "̂": u.MO.WIDEACCENT,
        "̑": u.MO.ACCENT,
        "϶": u.MO.REL,
        "‖": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0 }],
        "’": [0, 0, E.TEXCLASS.CLOSE, { fence: !0 }],
        "‚": u.MO.ACCENT,
        "‛": u.MO.ACCENT,
        "”": [0, 0, E.TEXCLASS.CLOSE, { fence: !0 }],
        "„": u.MO.ACCENT,
        "‟": u.MO.ACCENT,
        "′": u.MO.ORD,
        "″": u.MO.ACCENT,
        "‴": u.MO.ACCENT,
        "‵": u.MO.ACCENT,
        "‶": u.MO.ACCENT,
        "‷": u.MO.ACCENT,
        "‾": u.MO.WIDEACCENT,
        "⁗": u.MO.ACCENT,
        "⃛": u.MO.ACCENT,
        "⃜": u.MO.ACCENT,
        "⌉": u.MO.CLOSE,
        "⌋": u.MO.CLOSE,
        "〉": u.MO.CLOSE,
        "⎴": u.MO.WIDEACCENT,
        "⎵": u.MO.WIDEACCENT,
        "⏜": u.MO.WIDEACCENT,
        "⏝": u.MO.WIDEACCENT,
        "⏞": u.MO.WIDEACCENT,
        "⏟": u.MO.WIDEACCENT,
        "⏠": u.MO.WIDEACCENT,
        "⏡": u.MO.WIDEACCENT,
        "■": u.MO.BIN3,
        "□": u.MO.BIN3,
        "▪": u.MO.BIN3,
        "▫": u.MO.BIN3,
        "▭": u.MO.BIN3,
        "▮": u.MO.BIN3,
        "▯": u.MO.BIN3,
        "▰": u.MO.BIN3,
        "▱": u.MO.BIN3,
        "▲": u.MO.BIN4,
        "▴": u.MO.BIN4,
        "▶": u.MO.BIN4,
        "▷": u.MO.BIN4,
        "▸": u.MO.BIN4,
        "▼": u.MO.BIN4,
        "▾": u.MO.BIN4,
        "◀": u.MO.BIN4,
        "◁": u.MO.BIN4,
        "◂": u.MO.BIN4,
        "◄": u.MO.BIN4,
        "◅": u.MO.BIN4,
        "◆": u.MO.BIN4,
        "◇": u.MO.BIN4,
        "◈": u.MO.BIN4,
        "◉": u.MO.BIN4,
        "◌": u.MO.BIN4,
        "◍": u.MO.BIN4,
        "◎": u.MO.BIN4,
        "●": u.MO.BIN4,
        "◖": u.MO.BIN4,
        "◗": u.MO.BIN4,
        "◦": u.MO.BIN4,
        "♭": u.MO.ORD02,
        "♮": u.MO.ORD02,
        "♯": u.MO.ORD02,
        "❳": u.MO.CLOSE,
        "⟧": u.MO.CLOSE,
        "⟩": u.MO.CLOSE,
        "⟫": u.MO.CLOSE,
        "⟭": u.MO.CLOSE,
        "⟯": u.MO.CLOSE,
        "⦀": [0, 0, E.TEXCLASS.ORD, { fence: !0, stretchy: !0 }],
        "⦄": u.MO.CLOSE,
        "⦆": u.MO.CLOSE,
        "⦈": u.MO.CLOSE,
        "⦊": u.MO.CLOSE,
        "⦌": u.MO.CLOSE,
        "⦎": u.MO.CLOSE,
        "⦐": u.MO.CLOSE,
        "⦒": u.MO.CLOSE,
        "⦔": u.MO.CLOSE,
        "⦖": u.MO.CLOSE,
        "⦘": u.MO.CLOSE,
        "⧽": u.MO.CLOSE
      },
      infix: {
        "!=": u.MO.BIN4,
        "#": u.MO.ORD,
        $: u.MO.ORD,
        "%": [3, 3, E.TEXCLASS.ORD, null],
        "&&": u.MO.BIN4,
        "": u.MO.ORD,
        "*": u.MO.BIN3,
        "**": L(1, 1),
        "*=": u.MO.BIN4,
        "+": u.MO.BIN4,
        "+=": u.MO.BIN4,
        ",": [0, 3, E.TEXCLASS.PUNCT, { linebreakstyle: "after", separator: !0 }],
        "-": u.MO.BIN4,
        "-=": u.MO.BIN4,
        "->": u.MO.BIN5,
        ".": [0, 3, E.TEXCLASS.PUNCT, { separator: !0 }],
        "/": u.MO.ORD11,
        "//": L(1, 1),
        "/=": u.MO.BIN4,
        ":": [1, 2, E.TEXCLASS.REL, null],
        ":=": u.MO.BIN4,
        ";": [0, 3, E.TEXCLASS.PUNCT, { linebreakstyle: "after", separator: !0 }],
        "<": u.MO.REL,
        "<=": u.MO.BIN5,
        "<>": L(1, 1),
        "=": u.MO.REL,
        "==": u.MO.BIN4,
        ">": u.MO.REL,
        ">=": u.MO.BIN5,
        "?": [1, 1, E.TEXCLASS.CLOSE, null],
        "@": u.MO.ORD11,
        "\\": u.MO.ORD,
        "^": u.MO.ORD11,
        _: u.MO.ORD11,
        "|": [2, 2, E.TEXCLASS.ORD, { fence: !0, stretchy: !0, symmetric: !0 }],
        "||": [2, 2, E.TEXCLASS.BIN, { fence: !0, stretchy: !0, symmetric: !0 }],
        "|||": [2, 2, E.TEXCLASS.ORD, { fence: !0, stretchy: !0, symmetric: !0 }],
        "±": u.MO.BIN4,
        "·": u.MO.BIN4,
        "×": u.MO.BIN4,
        "÷": u.MO.BIN4,
        "ʹ": u.MO.ORD,
        "̀": u.MO.ACCENT,
        "́": u.MO.ACCENT,
        "̃": u.MO.WIDEACCENT,
        "̄": u.MO.ACCENT,
        "̆": u.MO.ACCENT,
        "̇": u.MO.ACCENT,
        "̈": u.MO.ACCENT,
        "̌": u.MO.ACCENT,
        "̲": u.MO.WIDEACCENT,
        "̸": u.MO.REL4,
        "―": [0, 0, E.TEXCLASS.ORD, { stretchy: !0 }],
        "‗": [0, 0, E.TEXCLASS.ORD, { stretchy: !0 }],
        "†": u.MO.BIN3,
        "‡": u.MO.BIN3,
        "•": u.MO.BIN4,
        "…": u.MO.INNER,
        "⁃": u.MO.BIN4,
        "⁄": u.MO.TALLBIN,
        "⁡": u.MO.NONE,
        "⁢": u.MO.NONE,
        "⁣": [0, 0, E.TEXCLASS.NONE, { linebreakstyle: "after", separator: !0 }],
        "⁤": u.MO.NONE,
        "⃗": u.MO.ACCENT,
        ℑ: u.MO.ORD,
        ℓ: u.MO.ORD,
        "℘": u.MO.ORD,
        ℜ: u.MO.ORD,
        "←": u.MO.WIDEREL,
        "↑": u.MO.RELSTRETCH,
        "→": u.MO.WIDEREL,
        "↓": u.MO.RELSTRETCH,
        "↔": u.MO.WIDEREL,
        "↕": u.MO.RELSTRETCH,
        "↖": u.MO.RELSTRETCH,
        "↗": u.MO.RELSTRETCH,
        "↘": u.MO.RELSTRETCH,
        "↙": u.MO.RELSTRETCH,
        "↚": u.MO.RELACCENT,
        "↛": u.MO.RELACCENT,
        "↜": u.MO.WIDEREL,
        "↝": u.MO.WIDEREL,
        "↞": u.MO.WIDEREL,
        "↟": u.MO.WIDEREL,
        "↠": u.MO.WIDEREL,
        "↡": u.MO.RELSTRETCH,
        "↢": u.MO.WIDEREL,
        "↣": u.MO.WIDEREL,
        "↤": u.MO.WIDEREL,
        "↥": u.MO.RELSTRETCH,
        "↦": u.MO.WIDEREL,
        "↧": u.MO.RELSTRETCH,
        "↨": u.MO.RELSTRETCH,
        "↩": u.MO.WIDEREL,
        "↪": u.MO.WIDEREL,
        "↫": u.MO.WIDEREL,
        "↬": u.MO.WIDEREL,
        "↭": u.MO.WIDEREL,
        "↮": u.MO.RELACCENT,
        "↯": u.MO.RELSTRETCH,
        "↰": u.MO.RELSTRETCH,
        "↱": u.MO.RELSTRETCH,
        "↲": u.MO.RELSTRETCH,
        "↳": u.MO.RELSTRETCH,
        "↴": u.MO.RELSTRETCH,
        "↵": u.MO.RELSTRETCH,
        "↶": u.MO.RELACCENT,
        "↷": u.MO.RELACCENT,
        "↸": u.MO.REL,
        "↹": u.MO.WIDEREL,
        "↺": u.MO.REL,
        "↻": u.MO.REL,
        "↼": u.MO.WIDEREL,
        "↽": u.MO.WIDEREL,
        "↾": u.MO.RELSTRETCH,
        "↿": u.MO.RELSTRETCH,
        "⇀": u.MO.WIDEREL,
        "⇁": u.MO.WIDEREL,
        "⇂": u.MO.RELSTRETCH,
        "⇃": u.MO.RELSTRETCH,
        "⇄": u.MO.WIDEREL,
        "⇅": u.MO.RELSTRETCH,
        "⇆": u.MO.WIDEREL,
        "⇇": u.MO.WIDEREL,
        "⇈": u.MO.RELSTRETCH,
        "⇉": u.MO.WIDEREL,
        "⇊": u.MO.RELSTRETCH,
        "⇋": u.MO.WIDEREL,
        "⇌": u.MO.WIDEREL,
        "⇍": u.MO.RELACCENT,
        "⇎": u.MO.RELACCENT,
        "⇏": u.MO.RELACCENT,
        "⇐": u.MO.WIDEREL,
        "⇑": u.MO.RELSTRETCH,
        "⇒": u.MO.WIDEREL,
        "⇓": u.MO.RELSTRETCH,
        "⇔": u.MO.WIDEREL,
        "⇕": u.MO.RELSTRETCH,
        "⇖": u.MO.RELSTRETCH,
        "⇗": u.MO.RELSTRETCH,
        "⇘": u.MO.RELSTRETCH,
        "⇙": u.MO.RELSTRETCH,
        "⇚": u.MO.WIDEREL,
        "⇛": u.MO.WIDEREL,
        "⇜": u.MO.WIDEREL,
        "⇝": u.MO.WIDEREL,
        "⇞": u.MO.REL,
        "⇟": u.MO.REL,
        "⇠": u.MO.WIDEREL,
        "⇡": u.MO.RELSTRETCH,
        "⇢": u.MO.WIDEREL,
        "⇣": u.MO.RELSTRETCH,
        "⇤": u.MO.WIDEREL,
        "⇥": u.MO.WIDEREL,
        "⇦": u.MO.WIDEREL,
        "⇧": u.MO.RELSTRETCH,
        "⇨": u.MO.WIDEREL,
        "⇩": u.MO.RELSTRETCH,
        "⇪": u.MO.RELSTRETCH,
        "⇫": u.MO.RELSTRETCH,
        "⇬": u.MO.RELSTRETCH,
        "⇭": u.MO.RELSTRETCH,
        "⇮": u.MO.RELSTRETCH,
        "⇯": u.MO.RELSTRETCH,
        "⇰": u.MO.WIDEREL,
        "⇱": u.MO.REL,
        "⇲": u.MO.REL,
        "⇳": u.MO.RELSTRETCH,
        "⇴": u.MO.RELACCENT,
        "⇵": u.MO.RELSTRETCH,
        "⇶": u.MO.WIDEREL,
        "⇷": u.MO.RELACCENT,
        "⇸": u.MO.RELACCENT,
        "⇹": u.MO.RELACCENT,
        "⇺": u.MO.RELACCENT,
        "⇻": u.MO.RELACCENT,
        "⇼": u.MO.RELACCENT,
        "⇽": u.MO.WIDEREL,
        "⇾": u.MO.WIDEREL,
        "⇿": u.MO.WIDEREL,
        "∁": L(1, 2, E.TEXCLASS.ORD),
        "∅": u.MO.ORD,
        "∆": u.MO.BIN3,
        "∈": u.MO.REL,
        "∉": u.MO.REL,
        "∊": u.MO.REL,
        "∋": u.MO.REL,
        "∌": u.MO.REL,
        "∍": u.MO.REL,
        "∎": u.MO.BIN3,
        "−": u.MO.BIN4,
        "∓": u.MO.BIN4,
        "∔": u.MO.BIN4,
        "∕": u.MO.TALLBIN,
        "∖": u.MO.BIN4,
        "∗": u.MO.BIN4,
        "∘": u.MO.BIN4,
        "∙": u.MO.BIN4,
        "∝": u.MO.REL,
        "∞": u.MO.ORD,
        "∟": u.MO.REL,
        "∣": u.MO.REL,
        "∤": u.MO.REL,
        "∥": u.MO.REL,
        "∦": u.MO.REL,
        "∧": u.MO.BIN4,
        "∨": u.MO.BIN4,
        "∩": u.MO.BIN4,
        "∪": u.MO.BIN4,
        "∴": u.MO.REL,
        "∵": u.MO.REL,
        "∶": u.MO.REL,
        "∷": u.MO.REL,
        "∸": u.MO.BIN4,
        "∹": u.MO.REL,
        "∺": u.MO.BIN4,
        "∻": u.MO.REL,
        "∼": u.MO.REL,
        "∽": u.MO.REL,
        "∽̱": u.MO.BIN3,
        "∾": u.MO.REL,
        "∿": u.MO.BIN3,
        "≀": u.MO.BIN4,
        "≁": u.MO.REL,
        "≂": u.MO.REL,
        "≂̸": u.MO.REL,
        "≃": u.MO.REL,
        "≄": u.MO.REL,
        "≅": u.MO.REL,
        "≆": u.MO.REL,
        "≇": u.MO.REL,
        "≈": u.MO.REL,
        "≉": u.MO.REL,
        "≊": u.MO.REL,
        "≋": u.MO.REL,
        "≌": u.MO.REL,
        "≍": u.MO.REL,
        "≎": u.MO.REL,
        "≎̸": u.MO.REL,
        "≏": u.MO.REL,
        "≏̸": u.MO.REL,
        "≐": u.MO.REL,
        "≑": u.MO.REL,
        "≒": u.MO.REL,
        "≓": u.MO.REL,
        "≔": u.MO.REL,
        "≕": u.MO.REL,
        "≖": u.MO.REL,
        "≗": u.MO.REL,
        "≘": u.MO.REL,
        "≙": u.MO.REL,
        "≚": u.MO.REL,
        "≛": u.MO.REL,
        "≜": u.MO.REL,
        "≝": u.MO.REL,
        "≞": u.MO.REL,
        "≟": u.MO.REL,
        "≠": u.MO.REL,
        "≡": u.MO.REL,
        "≢": u.MO.REL,
        "≣": u.MO.REL,
        "≤": u.MO.REL,
        "≥": u.MO.REL,
        "≦": u.MO.REL,
        "≦̸": u.MO.REL,
        "≧": u.MO.REL,
        "≨": u.MO.REL,
        "≩": u.MO.REL,
        "≪": u.MO.REL,
        "≪̸": u.MO.REL,
        "≫": u.MO.REL,
        "≫̸": u.MO.REL,
        "≬": u.MO.REL,
        "≭": u.MO.REL,
        "≮": u.MO.REL,
        "≯": u.MO.REL,
        "≰": u.MO.REL,
        "≱": u.MO.REL,
        "≲": u.MO.REL,
        "≳": u.MO.REL,
        "≴": u.MO.REL,
        "≵": u.MO.REL,
        "≶": u.MO.REL,
        "≷": u.MO.REL,
        "≸": u.MO.REL,
        "≹": u.MO.REL,
        "≺": u.MO.REL,
        "≻": u.MO.REL,
        "≼": u.MO.REL,
        "≽": u.MO.REL,
        "≾": u.MO.REL,
        "≿": u.MO.REL,
        "≿̸": u.MO.REL,
        "⊀": u.MO.REL,
        "⊁": u.MO.REL,
        "⊂": u.MO.REL,
        "⊂⃒": u.MO.REL,
        "⊃": u.MO.REL,
        "⊃⃒": u.MO.REL,
        "⊄": u.MO.REL,
        "⊅": u.MO.REL,
        "⊆": u.MO.REL,
        "⊇": u.MO.REL,
        "⊈": u.MO.REL,
        "⊉": u.MO.REL,
        "⊊": u.MO.REL,
        "⊋": u.MO.REL,
        "⊌": u.MO.BIN4,
        "⊍": u.MO.BIN4,
        "⊎": u.MO.BIN4,
        "⊏": u.MO.REL,
        "⊏̸": u.MO.REL,
        "⊐": u.MO.REL,
        "⊐̸": u.MO.REL,
        "⊑": u.MO.REL,
        "⊒": u.MO.REL,
        "⊓": u.MO.BIN4,
        "⊔": u.MO.BIN4,
        "⊕": u.MO.BIN4,
        "⊖": u.MO.BIN4,
        "⊗": u.MO.BIN4,
        "⊘": u.MO.BIN4,
        "⊙": u.MO.BIN4,
        "⊚": u.MO.BIN4,
        "⊛": u.MO.BIN4,
        "⊜": u.MO.BIN4,
        "⊝": u.MO.BIN4,
        "⊞": u.MO.BIN4,
        "⊟": u.MO.BIN4,
        "⊠": u.MO.BIN4,
        "⊡": u.MO.BIN4,
        "⊢": u.MO.REL,
        "⊣": u.MO.REL,
        "⊤": u.MO.ORD55,
        "⊥": u.MO.REL,
        "⊦": u.MO.REL,
        "⊧": u.MO.REL,
        "⊨": u.MO.REL,
        "⊩": u.MO.REL,
        "⊪": u.MO.REL,
        "⊫": u.MO.REL,
        "⊬": u.MO.REL,
        "⊭": u.MO.REL,
        "⊮": u.MO.REL,
        "⊯": u.MO.REL,
        "⊰": u.MO.REL,
        "⊱": u.MO.REL,
        "⊲": u.MO.REL,
        "⊳": u.MO.REL,
        "⊴": u.MO.REL,
        "⊵": u.MO.REL,
        "⊶": u.MO.REL,
        "⊷": u.MO.REL,
        "⊸": u.MO.REL,
        "⊹": u.MO.REL,
        "⊺": u.MO.BIN4,
        "⊻": u.MO.BIN4,
        "⊼": u.MO.BIN4,
        "⊽": u.MO.BIN4,
        "⊾": u.MO.BIN3,
        "⊿": u.MO.BIN3,
        "⋄": u.MO.BIN4,
        "⋅": u.MO.BIN4,
        "⋆": u.MO.BIN4,
        "⋇": u.MO.BIN4,
        "⋈": u.MO.REL,
        "⋉": u.MO.BIN4,
        "⋊": u.MO.BIN4,
        "⋋": u.MO.BIN4,
        "⋌": u.MO.BIN4,
        "⋍": u.MO.REL,
        "⋎": u.MO.BIN4,
        "⋏": u.MO.BIN4,
        "⋐": u.MO.REL,
        "⋑": u.MO.REL,
        "⋒": u.MO.BIN4,
        "⋓": u.MO.BIN4,
        "⋔": u.MO.REL,
        "⋕": u.MO.REL,
        "⋖": u.MO.REL,
        "⋗": u.MO.REL,
        "⋘": u.MO.REL,
        "⋙": u.MO.REL,
        "⋚": u.MO.REL,
        "⋛": u.MO.REL,
        "⋜": u.MO.REL,
        "⋝": u.MO.REL,
        "⋞": u.MO.REL,
        "⋟": u.MO.REL,
        "⋠": u.MO.REL,
        "⋡": u.MO.REL,
        "⋢": u.MO.REL,
        "⋣": u.MO.REL,
        "⋤": u.MO.REL,
        "⋥": u.MO.REL,
        "⋦": u.MO.REL,
        "⋧": u.MO.REL,
        "⋨": u.MO.REL,
        "⋩": u.MO.REL,
        "⋪": u.MO.REL,
        "⋫": u.MO.REL,
        "⋬": u.MO.REL,
        "⋭": u.MO.REL,
        "⋮": u.MO.ORD55,
        "⋯": u.MO.INNER,
        "⋰": u.MO.REL,
        "⋱": [5, 5, E.TEXCLASS.INNER, null],
        "⋲": u.MO.REL,
        "⋳": u.MO.REL,
        "⋴": u.MO.REL,
        "⋵": u.MO.REL,
        "⋶": u.MO.REL,
        "⋷": u.MO.REL,
        "⋸": u.MO.REL,
        "⋹": u.MO.REL,
        "⋺": u.MO.REL,
        "⋻": u.MO.REL,
        "⋼": u.MO.REL,
        "⋽": u.MO.REL,
        "⋾": u.MO.REL,
        "⋿": u.MO.REL,
        "⌅": u.MO.BIN3,
        "⌆": u.MO.BIN3,
        "⌢": u.MO.REL4,
        "⌣": u.MO.REL4,
        "〈": u.MO.OPEN,
        "〉": u.MO.CLOSE,
        "⎪": u.MO.ORD,
        "⎯": [0, 0, E.TEXCLASS.ORD, { stretchy: !0 }],
        "⎰": u.MO.OPEN,
        "⎱": u.MO.CLOSE,
        "─": u.MO.ORD,
        "△": u.MO.BIN4,
        "▵": u.MO.BIN4,
        "▹": u.MO.BIN4,
        "▽": u.MO.BIN4,
        "▿": u.MO.BIN4,
        "◃": u.MO.BIN4,
        "◯": u.MO.BIN3,
        "♠": u.MO.ORD,
        "♡": u.MO.ORD,
        "♢": u.MO.ORD,
        "♣": u.MO.ORD,
        "❘": u.MO.REL,
        "⟰": u.MO.RELSTRETCH,
        "⟱": u.MO.RELSTRETCH,
        "⟵": u.MO.WIDEREL,
        "⟶": u.MO.WIDEREL,
        "⟷": u.MO.WIDEREL,
        "⟸": u.MO.WIDEREL,
        "⟹": u.MO.WIDEREL,
        "⟺": u.MO.WIDEREL,
        "⟻": u.MO.WIDEREL,
        "⟼": u.MO.WIDEREL,
        "⟽": u.MO.WIDEREL,
        "⟾": u.MO.WIDEREL,
        "⟿": u.MO.WIDEREL,
        "⤀": u.MO.RELACCENT,
        "⤁": u.MO.RELACCENT,
        "⤂": u.MO.RELACCENT,
        "⤃": u.MO.RELACCENT,
        "⤄": u.MO.RELACCENT,
        "⤅": u.MO.RELACCENT,
        "⤆": u.MO.RELACCENT,
        "⤇": u.MO.RELACCENT,
        "⤈": u.MO.REL,
        "⤉": u.MO.REL,
        "⤊": u.MO.RELSTRETCH,
        "⤋": u.MO.RELSTRETCH,
        "⤌": u.MO.WIDEREL,
        "⤍": u.MO.WIDEREL,
        "⤎": u.MO.WIDEREL,
        "⤏": u.MO.WIDEREL,
        "⤐": u.MO.WIDEREL,
        "⤑": u.MO.RELACCENT,
        "⤒": u.MO.RELSTRETCH,
        "⤓": u.MO.RELSTRETCH,
        "⤔": u.MO.RELACCENT,
        "⤕": u.MO.RELACCENT,
        "⤖": u.MO.RELACCENT,
        "⤗": u.MO.RELACCENT,
        "⤘": u.MO.RELACCENT,
        "⤙": u.MO.RELACCENT,
        "⤚": u.MO.RELACCENT,
        "⤛": u.MO.RELACCENT,
        "⤜": u.MO.RELACCENT,
        "⤝": u.MO.RELACCENT,
        "⤞": u.MO.RELACCENT,
        "⤟": u.MO.RELACCENT,
        "⤠": u.MO.RELACCENT,
        "⤡": u.MO.RELSTRETCH,
        "⤢": u.MO.RELSTRETCH,
        "⤣": u.MO.REL,
        "⤤": u.MO.REL,
        "⤥": u.MO.REL,
        "⤦": u.MO.REL,
        "⤧": u.MO.REL,
        "⤨": u.MO.REL,
        "⤩": u.MO.REL,
        "⤪": u.MO.REL,
        "⤫": u.MO.REL,
        "⤬": u.MO.REL,
        "⤭": u.MO.REL,
        "⤮": u.MO.REL,
        "⤯": u.MO.REL,
        "⤰": u.MO.REL,
        "⤱": u.MO.REL,
        "⤲": u.MO.REL,
        "⤳": u.MO.RELACCENT,
        "⤴": u.MO.REL,
        "⤵": u.MO.REL,
        "⤶": u.MO.REL,
        "⤷": u.MO.REL,
        "⤸": u.MO.REL,
        "⤹": u.MO.REL,
        "⤺": u.MO.RELACCENT,
        "⤻": u.MO.RELACCENT,
        "⤼": u.MO.RELACCENT,
        "⤽": u.MO.RELACCENT,
        "⤾": u.MO.REL,
        "⤿": u.MO.REL,
        "⥀": u.MO.REL,
        "⥁": u.MO.REL,
        "⥂": u.MO.RELACCENT,
        "⥃": u.MO.RELACCENT,
        "⥄": u.MO.RELACCENT,
        "⥅": u.MO.RELACCENT,
        "⥆": u.MO.RELACCENT,
        "⥇": u.MO.RELACCENT,
        "⥈": u.MO.RELACCENT,
        "⥉": u.MO.REL,
        "⥊": u.MO.RELACCENT,
        "⥋": u.MO.RELACCENT,
        "⥌": u.MO.REL,
        "⥍": u.MO.REL,
        "⥎": u.MO.WIDEREL,
        "⥏": u.MO.RELSTRETCH,
        "⥐": u.MO.WIDEREL,
        "⥑": u.MO.RELSTRETCH,
        "⥒": u.MO.WIDEREL,
        "⥓": u.MO.WIDEREL,
        "⥔": u.MO.RELSTRETCH,
        "⥕": u.MO.RELSTRETCH,
        "⥖": u.MO.RELSTRETCH,
        "⥗": u.MO.RELSTRETCH,
        "⥘": u.MO.RELSTRETCH,
        "⥙": u.MO.RELSTRETCH,
        "⥚": u.MO.WIDEREL,
        "⥛": u.MO.WIDEREL,
        "⥜": u.MO.RELSTRETCH,
        "⥝": u.MO.RELSTRETCH,
        "⥞": u.MO.WIDEREL,
        "⥟": u.MO.WIDEREL,
        "⥠": u.MO.RELSTRETCH,
        "⥡": u.MO.RELSTRETCH,
        "⥢": u.MO.RELACCENT,
        "⥣": u.MO.REL,
        "⥤": u.MO.RELACCENT,
        "⥥": u.MO.REL,
        "⥦": u.MO.RELACCENT,
        "⥧": u.MO.RELACCENT,
        "⥨": u.MO.RELACCENT,
        "⥩": u.MO.RELACCENT,
        "⥪": u.MO.RELACCENT,
        "⥫": u.MO.RELACCENT,
        "⥬": u.MO.RELACCENT,
        "⥭": u.MO.RELACCENT,
        "⥮": u.MO.RELSTRETCH,
        "⥯": u.MO.RELSTRETCH,
        "⥰": u.MO.RELACCENT,
        "⥱": u.MO.RELACCENT,
        "⥲": u.MO.RELACCENT,
        "⥳": u.MO.RELACCENT,
        "⥴": u.MO.RELACCENT,
        "⥵": u.MO.RELACCENT,
        "⥶": u.MO.RELACCENT,
        "⥷": u.MO.RELACCENT,
        "⥸": u.MO.RELACCENT,
        "⥹": u.MO.RELACCENT,
        "⥺": u.MO.RELACCENT,
        "⥻": u.MO.RELACCENT,
        "⥼": u.MO.RELACCENT,
        "⥽": u.MO.RELACCENT,
        "⥾": u.MO.REL,
        "⥿": u.MO.REL,
        "⦁": u.MO.BIN3,
        "⦂": u.MO.BIN3,
        "⦙": u.MO.BIN3,
        "⦚": u.MO.BIN3,
        "⦛": u.MO.BIN3,
        "⦜": u.MO.BIN3,
        "⦝": u.MO.BIN3,
        "⦞": u.MO.BIN3,
        "⦟": u.MO.BIN3,
        "⦠": u.MO.BIN3,
        "⦡": u.MO.BIN3,
        "⦢": u.MO.BIN3,
        "⦣": u.MO.BIN3,
        "⦤": u.MO.BIN3,
        "⦥": u.MO.BIN3,
        "⦦": u.MO.BIN3,
        "⦧": u.MO.BIN3,
        "⦨": u.MO.BIN3,
        "⦩": u.MO.BIN3,
        "⦪": u.MO.BIN3,
        "⦫": u.MO.BIN3,
        "⦬": u.MO.BIN3,
        "⦭": u.MO.BIN3,
        "⦮": u.MO.BIN3,
        "⦯": u.MO.BIN3,
        "⦰": u.MO.BIN3,
        "⦱": u.MO.BIN3,
        "⦲": u.MO.BIN3,
        "⦳": u.MO.BIN3,
        "⦴": u.MO.BIN3,
        "⦵": u.MO.BIN3,
        "⦶": u.MO.BIN4,
        "⦷": u.MO.BIN4,
        "⦸": u.MO.BIN4,
        "⦹": u.MO.BIN4,
        "⦺": u.MO.BIN4,
        "⦻": u.MO.BIN4,
        "⦼": u.MO.BIN4,
        "⦽": u.MO.BIN4,
        "⦾": u.MO.BIN4,
        "⦿": u.MO.BIN4,
        "⧀": u.MO.REL,
        "⧁": u.MO.REL,
        "⧂": u.MO.BIN3,
        "⧃": u.MO.BIN3,
        "⧄": u.MO.BIN4,
        "⧅": u.MO.BIN4,
        "⧆": u.MO.BIN4,
        "⧇": u.MO.BIN4,
        "⧈": u.MO.BIN4,
        "⧉": u.MO.BIN3,
        "⧊": u.MO.BIN3,
        "⧋": u.MO.BIN3,
        "⧌": u.MO.BIN3,
        "⧍": u.MO.BIN3,
        "⧎": u.MO.REL,
        "⧏": u.MO.REL,
        "⧏̸": u.MO.REL,
        "⧐": u.MO.REL,
        "⧐̸": u.MO.REL,
        "⧑": u.MO.REL,
        "⧒": u.MO.REL,
        "⧓": u.MO.REL,
        "⧔": u.MO.REL,
        "⧕": u.MO.REL,
        "⧖": u.MO.BIN4,
        "⧗": u.MO.BIN4,
        "⧘": u.MO.BIN3,
        "⧙": u.MO.BIN3,
        "⧛": u.MO.BIN3,
        "⧜": u.MO.BIN3,
        "⧝": u.MO.BIN3,
        "⧞": u.MO.REL,
        "⧟": u.MO.BIN3,
        "⧠": u.MO.BIN3,
        "⧡": u.MO.REL,
        "⧢": u.MO.BIN4,
        "⧣": u.MO.REL,
        "⧤": u.MO.REL,
        "⧥": u.MO.REL,
        "⧦": u.MO.REL,
        "⧧": u.MO.BIN3,
        "⧨": u.MO.BIN3,
        "⧩": u.MO.BIN3,
        "⧪": u.MO.BIN3,
        "⧫": u.MO.BIN3,
        "⧬": u.MO.BIN3,
        "⧭": u.MO.BIN3,
        "⧮": u.MO.BIN3,
        "⧯": u.MO.BIN3,
        "⧰": u.MO.BIN3,
        "⧱": u.MO.BIN3,
        "⧲": u.MO.BIN3,
        "⧳": u.MO.BIN3,
        "⧴": u.MO.REL,
        "⧵": u.MO.BIN4,
        "⧶": u.MO.BIN4,
        "⧷": u.MO.BIN4,
        "⧸": u.MO.BIN3,
        "⧹": u.MO.BIN3,
        "⧺": u.MO.BIN3,
        "⧻": u.MO.BIN3,
        "⧾": u.MO.BIN4,
        "⧿": u.MO.BIN4,
        "⨝": u.MO.BIN3,
        "⨞": u.MO.BIN3,
        "⨟": u.MO.BIN3,
        "⨠": u.MO.BIN3,
        "⨡": u.MO.BIN3,
        "⨢": u.MO.BIN4,
        "⨣": u.MO.BIN4,
        "⨤": u.MO.BIN4,
        "⨥": u.MO.BIN4,
        "⨦": u.MO.BIN4,
        "⨧": u.MO.BIN4,
        "⨨": u.MO.BIN4,
        "⨩": u.MO.BIN4,
        "⨪": u.MO.BIN4,
        "⨫": u.MO.BIN4,
        "⨬": u.MO.BIN4,
        "⨭": u.MO.BIN4,
        "⨮": u.MO.BIN4,
        "⨯": u.MO.BIN4,
        "⨰": u.MO.BIN4,
        "⨱": u.MO.BIN4,
        "⨲": u.MO.BIN4,
        "⨳": u.MO.BIN4,
        "⨴": u.MO.BIN4,
        "⨵": u.MO.BIN4,
        "⨶": u.MO.BIN4,
        "⨷": u.MO.BIN4,
        "⨸": u.MO.BIN4,
        "⨹": u.MO.BIN4,
        "⨺": u.MO.BIN4,
        "⨻": u.MO.BIN4,
        "⨼": u.MO.BIN4,
        "⨽": u.MO.BIN4,
        "⨾": u.MO.BIN4,
        "⨿": u.MO.BIN4,
        "⩀": u.MO.BIN4,
        "⩁": u.MO.BIN4,
        "⩂": u.MO.BIN4,
        "⩃": u.MO.BIN4,
        "⩄": u.MO.BIN4,
        "⩅": u.MO.BIN4,
        "⩆": u.MO.BIN4,
        "⩇": u.MO.BIN4,
        "⩈": u.MO.BIN4,
        "⩉": u.MO.BIN4,
        "⩊": u.MO.BIN4,
        "⩋": u.MO.BIN4,
        "⩌": u.MO.BIN4,
        "⩍": u.MO.BIN4,
        "⩎": u.MO.BIN4,
        "⩏": u.MO.BIN4,
        "⩐": u.MO.BIN4,
        "⩑": u.MO.BIN4,
        "⩒": u.MO.BIN4,
        "⩓": u.MO.BIN4,
        "⩔": u.MO.BIN4,
        "⩕": u.MO.BIN4,
        "⩖": u.MO.BIN4,
        "⩗": u.MO.BIN4,
        "⩘": u.MO.BIN4,
        "⩙": u.MO.REL,
        "⩚": u.MO.BIN4,
        "⩛": u.MO.BIN4,
        "⩜": u.MO.BIN4,
        "⩝": u.MO.BIN4,
        "⩞": u.MO.BIN4,
        "⩟": u.MO.BIN4,
        "⩠": u.MO.BIN4,
        "⩡": u.MO.BIN4,
        "⩢": u.MO.BIN4,
        "⩣": u.MO.BIN4,
        "⩤": u.MO.BIN4,
        "⩥": u.MO.BIN4,
        "⩦": u.MO.REL,
        "⩧": u.MO.REL,
        "⩨": u.MO.REL,
        "⩩": u.MO.REL,
        "⩪": u.MO.REL,
        "⩫": u.MO.REL,
        "⩬": u.MO.REL,
        "⩭": u.MO.REL,
        "⩮": u.MO.REL,
        "⩯": u.MO.REL,
        "⩰": u.MO.REL,
        "⩱": u.MO.BIN4,
        "⩲": u.MO.BIN4,
        "⩳": u.MO.REL,
        "⩴": u.MO.REL,
        "⩵": u.MO.REL,
        "⩶": u.MO.REL,
        "⩷": u.MO.REL,
        "⩸": u.MO.REL,
        "⩹": u.MO.REL,
        "⩺": u.MO.REL,
        "⩻": u.MO.REL,
        "⩼": u.MO.REL,
        "⩽": u.MO.REL,
        "⩽̸": u.MO.REL,
        "⩾": u.MO.REL,
        "⩾̸": u.MO.REL,
        "⩿": u.MO.REL,
        "⪀": u.MO.REL,
        "⪁": u.MO.REL,
        "⪂": u.MO.REL,
        "⪃": u.MO.REL,
        "⪄": u.MO.REL,
        "⪅": u.MO.REL,
        "⪆": u.MO.REL,
        "⪇": u.MO.REL,
        "⪈": u.MO.REL,
        "⪉": u.MO.REL,
        "⪊": u.MO.REL,
        "⪋": u.MO.REL,
        "⪌": u.MO.REL,
        "⪍": u.MO.REL,
        "⪎": u.MO.REL,
        "⪏": u.MO.REL,
        "⪐": u.MO.REL,
        "⪑": u.MO.REL,
        "⪒": u.MO.REL,
        "⪓": u.MO.REL,
        "⪔": u.MO.REL,
        "⪕": u.MO.REL,
        "⪖": u.MO.REL,
        "⪗": u.MO.REL,
        "⪘": u.MO.REL,
        "⪙": u.MO.REL,
        "⪚": u.MO.REL,
        "⪛": u.MO.REL,
        "⪜": u.MO.REL,
        "⪝": u.MO.REL,
        "⪞": u.MO.REL,
        "⪟": u.MO.REL,
        "⪠": u.MO.REL,
        "⪡": u.MO.REL,
        "⪡̸": u.MO.REL,
        "⪢": u.MO.REL,
        "⪢̸": u.MO.REL,
        "⪣": u.MO.REL,
        "⪤": u.MO.REL,
        "⪥": u.MO.REL,
        "⪦": u.MO.REL,
        "⪧": u.MO.REL,
        "⪨": u.MO.REL,
        "⪩": u.MO.REL,
        "⪪": u.MO.REL,
        "⪫": u.MO.REL,
        "⪬": u.MO.REL,
        "⪭": u.MO.REL,
        "⪮": u.MO.REL,
        "⪯": u.MO.REL,
        "⪯̸": u.MO.REL,
        "⪰": u.MO.REL,
        "⪰̸": u.MO.REL,
        "⪱": u.MO.REL,
        "⪲": u.MO.REL,
        "⪳": u.MO.REL,
        "⪴": u.MO.REL,
        "⪵": u.MO.REL,
        "⪶": u.MO.REL,
        "⪷": u.MO.REL,
        "⪸": u.MO.REL,
        "⪹": u.MO.REL,
        "⪺": u.MO.REL,
        "⪻": u.MO.REL,
        "⪼": u.MO.REL,
        "⪽": u.MO.REL,
        "⪾": u.MO.REL,
        "⪿": u.MO.REL,
        "⫀": u.MO.REL,
        "⫁": u.MO.REL,
        "⫂": u.MO.REL,
        "⫃": u.MO.REL,
        "⫄": u.MO.REL,
        "⫅": u.MO.REL,
        "⫆": u.MO.REL,
        "⫇": u.MO.REL,
        "⫈": u.MO.REL,
        "⫉": u.MO.REL,
        "⫊": u.MO.REL,
        "⫋": u.MO.REL,
        "⫌": u.MO.REL,
        "⫍": u.MO.REL,
        "⫎": u.MO.REL,
        "⫏": u.MO.REL,
        "⫐": u.MO.REL,
        "⫑": u.MO.REL,
        "⫒": u.MO.REL,
        "⫓": u.MO.REL,
        "⫔": u.MO.REL,
        "⫕": u.MO.REL,
        "⫖": u.MO.REL,
        "⫗": u.MO.REL,
        "⫘": u.MO.REL,
        "⫙": u.MO.REL,
        "⫚": u.MO.REL,
        "⫛": u.MO.REL,
        "⫝": u.MO.REL,
        "⫝̸": u.MO.REL,
        "⫞": u.MO.REL,
        "⫟": u.MO.REL,
        "⫠": u.MO.REL,
        "⫡": u.MO.REL,
        "⫢": u.MO.REL,
        "⫣": u.MO.REL,
        "⫤": u.MO.REL,
        "⫥": u.MO.REL,
        "⫦": u.MO.REL,
        "⫧": u.MO.REL,
        "⫨": u.MO.REL,
        "⫩": u.MO.REL,
        "⫪": u.MO.REL,
        "⫫": u.MO.REL,
        "⫬": u.MO.REL,
        "⫭": u.MO.REL,
        "⫮": u.MO.REL,
        "⫯": u.MO.REL,
        "⫰": u.MO.REL,
        "⫱": u.MO.REL,
        "⫲": u.MO.REL,
        "⫳": u.MO.REL,
        "⫴": u.MO.BIN4,
        "⫵": u.MO.BIN4,
        "⫶": u.MO.BIN4,
        "⫷": u.MO.REL,
        "⫸": u.MO.REL,
        "⫹": u.MO.REL,
        "⫺": u.MO.REL,
        "⫻": u.MO.BIN4,
        "⫽": u.MO.BIN4,
        "⫾": u.MO.BIN3,
        "⭅": u.MO.RELSTRETCH,
        "⭆": u.MO.RELSTRETCH,
        "〈": u.MO.OPEN,
        "〉": u.MO.CLOSE,
        "︷": u.MO.WIDEACCENT,
        "︸": u.MO.WIDEACCENT
      }
    }, u.OPTABLE.infix["^"] = u.MO.WIDEREL, u.OPTABLE.infix._ = u.MO.WIDEREL, u.OPTABLE.infix["⫝̸"] = u.MO.REL;
  })(G)), G;
}
var J;
function Eu() {
  if (J) return F;
  J = 1;
  var u = F && F.__extends || /* @__PURE__ */ (function() {
    var O = function(n, t) {
      return O = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, f) {
        e.__proto__ = f;
      } || function(e, f) {
        for (var d in f) Object.prototype.hasOwnProperty.call(f, d) && (e[d] = f[d]);
      }, O(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      O(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), S = F && F.__assign || function() {
    return S = Object.assign || function(O) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var f in n) Object.prototype.hasOwnProperty.call(n, f) && (O[f] = n[f]);
      }
      return O;
    }, S.apply(this, arguments);
  }, E = F && F.__read || function(O, n) {
    var t = typeof Symbol == "function" && O[Symbol.iterator];
    if (!t) return O;
    var e = t.call(O), f, d = [], I;
    try {
      for (; (n === void 0 || n-- > 0) && !(f = e.next()).done; ) d.push(f.value);
    } catch (m) {
      I = { error: m };
    } finally {
      try {
        f && !f.done && (t = e.return) && t.call(e);
      } finally {
        if (I) throw I.error;
      }
    }
    return d;
  }, L = F && F.__values || function(O) {
    var n = typeof Symbol == "function" && Symbol.iterator, t = n && O[n], e = 0;
    if (t) return t.call(O);
    if (O && typeof O.length == "number") return {
      next: function() {
        return O && e >= O.length && (O = void 0), { value: O && O[e++], done: !O };
      }
    };
    throw new TypeError(n ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(F, "__esModule", { value: !0 }), F.MmlMo = void 0;
  var R = Y(), l = iu(), r = uu(), M = (function(O) {
    u(n, O);
    function n() {
      var t = O !== null && O.apply(this, arguments) || this;
      return t._texClass = null, t.lspace = 5 / 18, t.rspace = 5 / 18, t;
    }
    return Object.defineProperty(n.prototype, "texClass", {
      get: function() {
        if (this._texClass === null) {
          var t = this.getText(), e = E(this.handleExplicitForm(this.getForms()), 3), f = e[0], d = e[1], I = e[2], m = this.constructor.OPTABLE, h = m[f][t] || m[d][t] || m[I][t];
          return h ? h[2] : R.TEXCLASS.REL;
        }
        return this._texClass;
      },
      set: function(t) {
        this._texClass = t;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mo";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isEmbellished", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "hasNewLine", {
      get: function() {
        return this.attributes.get("linebreak") === "newline";
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.coreParent = function() {
      for (var t = this, e = this, f = this.factory.getNodeClass("math"); e && e.isEmbellished && e.coreMO() === this && !(e instanceof f); )
        t = e, e = e.parent;
      return t;
    }, n.prototype.coreText = function(t) {
      if (!t)
        return "";
      if (t.isEmbellished)
        return t.coreMO().getText();
      for (; ((t.isKind("mrow") || t.isKind("TeXAtom") && t.texClass !== R.TEXCLASS.VCENTER || t.isKind("mstyle") || t.isKind("mphantom")) && t.childNodes.length === 1 || t.isKind("munderover")) && t.childNodes[0]; )
        t = t.childNodes[0];
      return t.isToken ? t.getText() : "";
    }, n.prototype.hasSpacingAttributes = function() {
      return this.attributes.isSet("lspace") || this.attributes.isSet("rspace");
    }, Object.defineProperty(n.prototype, "isAccent", {
      get: function() {
        var t = !1, e = this.coreParent().parent;
        if (e) {
          var f = e.isKind("mover") ? e.childNodes[e.over].coreMO() ? "accent" : "" : e.isKind("munder") ? e.childNodes[e.under].coreMO() ? "accentunder" : "" : e.isKind("munderover") ? this === e.childNodes[e.over].coreMO() ? "accent" : this === e.childNodes[e.under].coreMO() ? "accentunder" : "" : "";
          if (f) {
            var d = e.attributes.getExplicit(f);
            t = d !== void 0 ? t : this.attributes.get("accent");
          }
        }
        return t;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setTeXclass = function(t) {
      var e = this.attributes.getList("form", "fence"), f = e.form, d = e.fence;
      return this.getProperty("texClass") === void 0 && (this.attributes.isSet("lspace") || this.attributes.isSet("rspace")) ? null : (d && this.texClass === R.TEXCLASS.REL && (f === "prefix" && (this.texClass = R.TEXCLASS.OPEN), f === "postfix" && (this.texClass = R.TEXCLASS.CLOSE)), this.adjustTeXclass(t));
    }, n.prototype.adjustTeXclass = function(t) {
      var e = this.texClass, f = this.prevClass;
      if (e === R.TEXCLASS.NONE)
        return t;
      if (t ? (t.getProperty("autoOP") && (e === R.TEXCLASS.BIN || e === R.TEXCLASS.REL) && (f = t.texClass = R.TEXCLASS.ORD), f = this.prevClass = t.texClass || R.TEXCLASS.ORD, this.prevLevel = this.attributes.getInherited("scriptlevel")) : f = this.prevClass = R.TEXCLASS.NONE, e === R.TEXCLASS.BIN && (f === R.TEXCLASS.NONE || f === R.TEXCLASS.BIN || f === R.TEXCLASS.OP || f === R.TEXCLASS.REL || f === R.TEXCLASS.OPEN || f === R.TEXCLASS.PUNCT))
        this.texClass = R.TEXCLASS.ORD;
      else if (f === R.TEXCLASS.BIN && (e === R.TEXCLASS.REL || e === R.TEXCLASS.CLOSE || e === R.TEXCLASS.PUNCT))
        t.texClass = this.prevClass = R.TEXCLASS.ORD;
      else if (e === R.TEXCLASS.BIN) {
        for (var d = this, I = this.parent; I && I.parent && I.isEmbellished && (I.childNodes.length === 1 || !I.isKind("mrow") && I.core() === d); )
          d = I, I = I.parent;
        I.childNodes[I.childNodes.length - 1] === d && (this.texClass = R.TEXCLASS.ORD);
      }
      return this;
    }, n.prototype.setInheritedAttributes = function(t, e, f, d) {
      t === void 0 && (t = {}), e === void 0 && (e = !1), f === void 0 && (f = 0), d === void 0 && (d = !1), O.prototype.setInheritedAttributes.call(this, t, e, f, d);
      var I = this.getText();
      this.checkOperatorTable(I), this.checkPseudoScripts(I), this.checkPrimes(I), this.checkMathAccent(I);
    }, n.prototype.checkOperatorTable = function(t) {
      var e, f, d = E(this.handleExplicitForm(this.getForms()), 3), I = d[0], m = d[1], h = d[2];
      this.attributes.setInherited("form", I);
      var a = this.constructor.OPTABLE, i = a[I][t] || a[m][t] || a[h][t];
      if (i) {
        this.getProperty("texClass") === void 0 && (this.texClass = i[2]);
        try {
          for (var A = L(Object.keys(i[3] || {})), C = A.next(); !C.done; C = A.next()) {
            var c = C.value;
            this.attributes.setInherited(c, i[3][c]);
          }
        } catch (T) {
          e = { error: T };
        } finally {
          try {
            C && !C.done && (f = A.return) && f.call(A);
          } finally {
            if (e) throw e.error;
          }
        }
        this.lspace = (i[0] + 1) / 18, this.rspace = (i[1] + 1) / 18;
      } else {
        var N = (0, l.getRange)(t);
        if (N) {
          this.getProperty("texClass") === void 0 && (this.texClass = N[2]);
          var y = this.constructor.MMLSPACING[N[2]];
          this.lspace = (y[0] + 1) / 18, this.rspace = (y[1] + 1) / 18;
        }
      }
    }, n.prototype.getForms = function() {
      for (var t = this, e = this.parent, f = this.Parent; f && f.isEmbellished; )
        t = e, e = f.parent, f = f.Parent;
      if (e && e.isKind("mrow") && e.nonSpaceLength() !== 1) {
        if (e.firstNonSpace() === t)
          return ["prefix", "infix", "postfix"];
        if (e.lastNonSpace() === t)
          return ["postfix", "infix", "prefix"];
      }
      return ["infix", "prefix", "postfix"];
    }, n.prototype.handleExplicitForm = function(t) {
      if (this.attributes.isSet("form")) {
        var e = this.attributes.get("form");
        t = [e].concat(t.filter(function(f) {
          return f !== e;
        }));
      }
      return t;
    }, n.prototype.checkPseudoScripts = function(t) {
      var e = this.constructor.pseudoScripts;
      if (t.match(e)) {
        var f = this.coreParent().Parent, d = !f || !(f.isKind("msubsup") && !f.isKind("msub"));
        this.setProperty("pseudoscript", d), d && (this.attributes.setInherited("lspace", 0), this.attributes.setInherited("rspace", 0));
      }
    }, n.prototype.checkPrimes = function(t) {
      var e = this.constructor.primes;
      if (t.match(e)) {
        var f = this.constructor.remapPrimes, d = (0, r.unicodeString)((0, r.unicodeChars)(t).map(function(I) {
          return f[I];
        }));
        this.setProperty("primes", d);
      }
    }, n.prototype.checkMathAccent = function(t) {
      var e = this.Parent;
      if (!(this.getProperty("mathaccent") !== void 0 || !e || !e.isKind("munderover"))) {
        var f = e.childNodes[0];
        if (!(f.isEmbellished && f.coreMO() === this)) {
          var d = this.constructor.mathaccents;
          t.match(d) && this.setProperty("mathaccent", !0);
        }
      }
    }, n.defaults = S(S({}, R.AbstractMmlTokenNode.defaults), { form: "infix", fence: !1, separator: !1, lspace: "thickmathspace", rspace: "thickmathspace", stretchy: !1, symmetric: !1, maxsize: "infinity", minsize: "0em", largeop: !1, movablelimits: !1, accent: !1, linebreak: "auto", lineleading: "1ex", linebreakstyle: "before", indentalign: "auto", indentshift: "0", indenttarget: "", indentalignfirst: "indentalign", indentshiftfirst: "indentshift", indentalignlast: "indentalign", indentshiftlast: "indentshift" }), n.MMLSPACING = l.MMLSPACING, n.OPTABLE = l.OPTABLE, n.pseudoScripts = new RegExp([
      "^[\"'*`",
      "ª",
      "°",
      "²-´",
      "¹",
      "º",
      "‘-‟",
      "′-‷⁗",
      "⁰ⁱ",
      "⁴-ⁿ",
      "₀-₎",
      "]+$"
    ].join("")), n.primes = new RegExp([
      "^[\"'`",
      "‘-‟",
      "]+$"
    ].join("")), n.remapPrimes = {
      34: 8243,
      39: 8242,
      96: 8245,
      8216: 8245,
      8217: 8242,
      8218: 8242,
      8219: 8245,
      8220: 8246,
      8221: 8243,
      8222: 8243,
      8223: 8246
    }, n.mathaccents = new RegExp([
      "^[",
      "´́ˊ",
      "`̀ˋ",
      "¨̈",
      "~̃˜",
      "¯̄ˉ",
      "˘̆",
      "ˇ̌",
      "^̂ˆ",
      "→⃗",
      "˙̇",
      "˚̊",
      "⃛",
      "⃜",
      "]$"
    ].join("")), n;
  })(R.AbstractMmlTokenNode);
  return F.MmlMo = M, F;
}
var X = {}, Q;
function au() {
  if (Q) return X;
  Q = 1;
  var u = X && X.__values || function(R) {
    var l = typeof Symbol == "function" && Symbol.iterator, r = l && R[l], M = 0;
    if (r) return r.call(R);
    if (R && typeof R.length == "number") return {
      next: function() {
        return R && M >= R.length && (R = void 0), { value: R && R[M++], done: !R };
      }
    };
    throw new TypeError(l ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, S = X && X.__read || function(R, l) {
    var r = typeof Symbol == "function" && R[Symbol.iterator];
    if (!r) return R;
    var M = r.call(R), O, n = [], t;
    try {
      for (; (l === void 0 || l-- > 0) && !(O = M.next()).done; ) n.push(O.value);
    } catch (e) {
      t = { error: e };
    } finally {
      try {
        O && !O.done && (r = M.return) && r.call(M);
      } finally {
        if (t) throw t.error;
      }
    }
    return n;
  }, E = X && X.__spreadArray || function(R, l, r) {
    if (r || arguments.length === 2) for (var M = 0, O = l.length, n; M < O; M++)
      (n || !(M in l)) && (n || (n = Array.prototype.slice.call(l, 0, M)), n[M] = l[M]);
    return R.concat(n || Array.prototype.slice.call(l));
  };
  Object.defineProperty(X, "__esModule", { value: !0 }), X.AbstractFactory = void 0;
  var L = (function() {
    function R(l) {
      var r, M;
      l === void 0 && (l = null), this.defaultKind = "unknown", this.nodeMap = /* @__PURE__ */ new Map(), this.node = {}, l === null && (l = this.constructor.defaultNodes);
      try {
        for (var O = u(Object.keys(l)), n = O.next(); !n.done; n = O.next()) {
          var t = n.value;
          this.setNodeClass(t, l[t]);
        }
      } catch (e) {
        r = { error: e };
      } finally {
        try {
          n && !n.done && (M = O.return) && M.call(O);
        } finally {
          if (r) throw r.error;
        }
      }
    }
    return R.prototype.create = function(l) {
      for (var r = [], M = 1; M < arguments.length; M++)
        r[M - 1] = arguments[M];
      return (this.node[l] || this.node[this.defaultKind]).apply(void 0, E([], S(r), !1));
    }, R.prototype.setNodeClass = function(l, r) {
      this.nodeMap.set(l, r);
      var M = this, O = this.nodeMap.get(l);
      this.node[l] = function() {
        for (var n = [], t = 0; t < arguments.length; t++)
          n[t] = arguments[t];
        return new (O.bind.apply(O, E([void 0, M], S(n), !1)))();
      };
    }, R.prototype.getNodeClass = function(l) {
      return this.nodeMap.get(l);
    }, R.prototype.deleteNodeClass = function(l) {
      this.nodeMap.delete(l), delete this.node[l];
    }, R.prototype.nodeIsKind = function(l, r) {
      return l instanceof this.getNodeClass(r);
    }, R.prototype.getKinds = function() {
      return Array.from(this.nodeMap.keys());
    }, R.defaultNodes = {}, R;
  })();
  return X.AbstractFactory = L, X;
}
export {
  Y as a,
  au as b,
  Eu as c,
  Ou as d,
  iu as e,
  tu as f,
  uu as r
};
