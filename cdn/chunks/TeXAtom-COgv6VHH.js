import { r as wt } from "./Options-BStFr0zv.js";
import { b as Nt, a as g, r as xt, f as Pt, c as At } from "./Factory-B4kWsy6c.js";
var V = {}, Y;
function Et() {
  if (Y) return V;
  Y = 1, Object.defineProperty(V, "__esModule", { value: !0 }), V.AbstractOutputJax = void 0;
  var y = wt(), s = Nt(), c = (function() {
    function f(i) {
      i === void 0 && (i = {}), this.adaptor = null;
      var n = this.constructor;
      this.options = (0, y.userOptions)((0, y.defaultOptions)({}, n.OPTIONS), i), this.postFilters = new s.FunctionList();
    }
    return Object.defineProperty(f.prototype, "name", {
      get: function() {
        return this.constructor.NAME;
      },
      enumerable: !1,
      configurable: !0
    }), f.prototype.setAdaptor = function(i) {
      this.adaptor = i;
    }, f.prototype.initialize = function() {
    }, f.prototype.reset = function() {
    }, f.prototype.getMetrics = function(i) {
    }, f.prototype.styleSheet = function(i) {
      return null;
    }, f.prototype.pageElements = function(i) {
      return null;
    }, f.prototype.executeFilters = function(i, n, t, e) {
      var r = { math: n, document: t, data: e };
      return i.execute(r), r.data;
    }, f.NAME = "generic", f.OPTIONS = {}, f;
  })();
  return V.AbstractOutputJax = c, V;
}
var C = {}, Z;
function kt() {
  if (Z) return C;
  Z = 1;
  var y = C && C.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = C && C.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(C, "__esModule", { value: !0 }), C.MmlMath = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      return i !== null && i.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "math";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setChildInheritedAttributes = function(t, e, r, o) {
      this.attributes.get("mode") === "display" && this.attributes.setInherited("display", "block"), t = this.addInheritedAttributes(t, this.attributes.getAllAttributes()), e = !!this.attributes.get("displaystyle") || !this.attributes.get("displaystyle") && this.attributes.get("display") === "block", this.attributes.setInherited("displaystyle", e), r = this.attributes.get("scriptlevel") || this.constructor.defaults.scriptlevel, i.prototype.setChildInheritedAttributes.call(this, t, e, r, o);
    }, n.defaults = s(s({}, c.AbstractMmlLayoutNode.defaults), { mathvariant: "normal", mathsize: "normal", mathcolor: "", mathbackground: "transparent", dir: "ltr", scriptlevel: 0, displaystyle: !1, display: "inline", maxwidth: "", overflow: "linebreak", altimg: "", "altimg-width": "", "altimg-height": "", "altimg-valign": "", alttext: "", cdgroup: "", scriptsizemultiplier: 1 / Math.sqrt(2), scriptminsize: "8px", infixlinebreakstyle: "before", lineleading: "1ex", linebreakmultchar: "⁢", indentshift: "auto", indentalign: "auto", indenttarget: "", indentalignfirst: "indentalign", indentshiftfirst: "indentshift", indentalignlast: "indentalign", indentshiftlast: "indentshift" }), n;
  })(c.AbstractMmlLayoutNode);
  return C.MmlMath = f, C;
}
var M = {}, tt;
function qt() {
  if (tt) return M;
  tt = 1;
  var y = M && M.__extends || /* @__PURE__ */ (function() {
    var t = function(e, r) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, a) {
        o.__proto__ = a;
      } || function(o, a) {
        for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u]);
      }, t(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      t(e, r);
      function o() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (o.prototype = r.prototype, new o());
    };
  })(), s = M && M.__assign || function() {
    return s = Object.assign || function(t) {
      for (var e, r = 1, o = arguments.length; r < o; r++) {
        e = arguments[r];
        for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
      }
      return t;
    }, s.apply(this, arguments);
  }, c = M && M.__values || function(t) {
    var e = typeof Symbol == "function" && Symbol.iterator, r = e && t[e], o = 0;
    if (r) return r.call(t);
    if (t && typeof t.length == "number") return {
      next: function() {
        return t && o >= t.length && (t = void 0), { value: t && t[o++], done: !t };
      }
    };
    throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(M, "__esModule", { value: !0 }), M.MmlInferredMrow = M.MmlMrow = void 0;
  var f = g(), i = (function(t) {
    y(e, t);
    function e() {
      var r = t !== null && t.apply(this, arguments) || this;
      return r._core = null, r;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "mrow";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "isSpacelike", {
      get: function() {
        var r, o;
        try {
          for (var a = c(this.childNodes), u = a.next(); !u.done; u = a.next()) {
            var l = u.value;
            if (!l.isSpacelike)
              return !1;
          }
        } catch (p) {
          r = { error: p };
        } finally {
          try {
            u && !u.done && (o = a.return) && o.call(a);
          } finally {
            if (r) throw r.error;
          }
        }
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "isEmbellished", {
      get: function() {
        var r, o, a = !1, u = 0;
        try {
          for (var l = c(this.childNodes), p = l.next(); !p.done; p = l.next()) {
            var d = p.value;
            if (d) {
              if (d.isEmbellished) {
                if (a)
                  return !1;
                a = !0, this._core = u;
              } else if (!d.isSpacelike)
                return !1;
            }
            u++;
          }
        } catch (h) {
          r = { error: h };
        } finally {
          try {
            p && !p.done && (o = l.return) && o.call(l);
          } finally {
            if (r) throw r.error;
          }
        }
        return a;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.core = function() {
      return !this.isEmbellished || this._core == null ? this : this.childNodes[this._core];
    }, e.prototype.coreMO = function() {
      return !this.isEmbellished || this._core == null ? this : this.childNodes[this._core].coreMO();
    }, e.prototype.nonSpaceLength = function() {
      var r, o, a = 0;
      try {
        for (var u = c(this.childNodes), l = u.next(); !l.done; l = u.next()) {
          var p = l.value;
          p && !p.isSpacelike && a++;
        }
      } catch (d) {
        r = { error: d };
      } finally {
        try {
          l && !l.done && (o = u.return) && o.call(u);
        } finally {
          if (r) throw r.error;
        }
      }
      return a;
    }, e.prototype.firstNonSpace = function() {
      var r, o;
      try {
        for (var a = c(this.childNodes), u = a.next(); !u.done; u = a.next()) {
          var l = u.value;
          if (l && !l.isSpacelike)
            return l;
        }
      } catch (p) {
        r = { error: p };
      } finally {
        try {
          u && !u.done && (o = a.return) && o.call(a);
        } finally {
          if (r) throw r.error;
        }
      }
      return null;
    }, e.prototype.lastNonSpace = function() {
      for (var r = this.childNodes.length; --r >= 0; ) {
        var o = this.childNodes[r];
        if (o && !o.isSpacelike)
          return o;
      }
      return null;
    }, e.prototype.setTeXclass = function(r) {
      var o, a, u, l;
      if (this.getProperty("open") != null || this.getProperty("close") != null) {
        this.getPrevClass(r), r = null;
        try {
          for (var p = c(this.childNodes), d = p.next(); !d.done; d = p.next()) {
            var h = d.value;
            r = h.setTeXclass(r);
          }
        } catch (_) {
          o = { error: _ };
        } finally {
          try {
            d && !d.done && (a = p.return) && a.call(p);
          } finally {
            if (o) throw o.error;
          }
        }
        this.texClass == null && (this.texClass = f.TEXCLASS.INNER);
      } else {
        try {
          for (var m = c(this.childNodes), v = m.next(); !v.done; v = m.next()) {
            var h = v.value;
            r = h.setTeXclass(r);
          }
        } catch (_) {
          u = { error: _ };
        } finally {
          try {
            v && !v.done && (l = m.return) && l.call(m);
          } finally {
            if (u) throw u.error;
          }
        }
        this.childNodes[0] && this.updateTeXclass(this.childNodes[0]);
      }
      return r;
    }, e.defaults = s({}, f.AbstractMmlNode.defaults), e;
  })(f.AbstractMmlNode);
  M.MmlMrow = i;
  var n = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "inferredMrow";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "isInferred", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "notParent", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.toString = function() {
      return "[" + this.childNodes.join(",") + "]";
    }, e.defaults = i.defaults, e;
  })(i);
  return M.MmlInferredMrow = n, M;
}
var E = {}, et;
function Xt() {
  if (et) return E;
  et = 1;
  var y = E && E.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = E && E.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(E, "__esModule", { value: !0 }), E.MmlMi = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mi";
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setInheritedAttributes = function(t, e, r, o) {
      t === void 0 && (t = {}), e === void 0 && (e = !1), r === void 0 && (r = 0), o === void 0 && (o = !1), i.prototype.setInheritedAttributes.call(this, t, e, r, o);
      var a = this.getText();
      a.match(n.singleCharacter) && !t.mathvariant && this.attributes.setInherited("mathvariant", "italic");
    }, n.prototype.setTeXclass = function(t) {
      this.getPrevClass(t);
      var e = this.getText();
      return e.length > 1 && e.match(n.operatorName) && this.attributes.get("mathvariant") === "normal" && this.getProperty("autoOP") === void 0 && this.getProperty("texClass") === void 0 && (this.texClass = c.TEXCLASS.OP, this.setProperty("autoOP", !0)), this;
    }, n.defaults = s({}, c.AbstractMmlTokenNode.defaults), n.operatorName = /^[a-z][a-z0-9]*$/i, n.singleCharacter = /^[\uD800-\uDBFF]?.[\u0300-\u036F\u1AB0-\u1ABE\u1DC0-\u1DFF\u20D0-\u20EF]*$/, n;
  })(c.AbstractMmlTokenNode);
  return E.MmlMi = f, E;
}
var k = {}, rt;
function It() {
  if (rt) return k;
  rt = 1;
  var y = k && k.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = k && k.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(k, "__esModule", { value: !0 }), k.MmlMn = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mn";
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s({}, c.AbstractMmlTokenNode.defaults), n;
  })(c.AbstractMmlTokenNode);
  return k.MmlMn = f, k;
}
var q = {}, nt;
function Rt() {
  if (nt) return q;
  nt = 1;
  var y = q && q.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = q && q.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(q, "__esModule", { value: !0 }), q.MmlMs = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "ms";
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s(s({}, c.AbstractMmlTokenNode.defaults), { lquote: '"', rquote: '"' }), n;
  })(c.AbstractMmlTokenNode);
  return q.MmlMs = f, q;
}
var X = {}, ot;
function Lt() {
  if (ot) return X;
  ot = 1;
  var y = X && X.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = X && X.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(X, "__esModule", { value: !0 }), X.MmlMtext = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mtext";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isSpacelike", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s({}, c.AbstractMmlTokenNode.defaults), n;
  })(c.AbstractMmlTokenNode);
  return X.MmlMtext = f, X;
}
var I = {}, it;
function Dt() {
  if (it) return I;
  it = 1;
  var y = I && I.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = I && I.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(I, "__esModule", { value: !0 }), I.MmlMerror = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "merror";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return -1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s({}, c.AbstractMmlNode.defaults), n;
  })(c.AbstractMmlNode);
  return I.MmlMerror = f, I;
}
var R = {}, at;
function Bt() {
  if (at) return R;
  at = 1;
  var y = R && R.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = R && R.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(R, "__esModule", { value: !0 }), R.MmlMspace = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.NONE, t;
    }
    return n.prototype.setTeXclass = function(t) {
      return t;
    }, Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mspace";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return 0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isSpacelike", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "hasNewline", {
      get: function() {
        var t = this.attributes;
        return t.getExplicit("width") == null && t.getExplicit("height") == null && t.getExplicit("depth") == null && t.get("linebreak") === "newline";
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s(s({}, c.AbstractMmlTokenNode.defaults), { width: "0em", height: "0ex", depth: "0ex", linebreak: "auto" }), n;
  })(c.AbstractMmlTokenNode);
  return R.MmlMspace = f, R;
}
var L = {}, ut;
function Ft() {
  if (ut) return L;
  ut = 1;
  var y = L && L.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = L && L.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(L, "__esModule", { value: !0 }), L.MmlMpadded = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      return i !== null && i.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mpadded";
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s(s({}, c.AbstractMmlLayoutNode.defaults), { width: "", height: "", depth: "", lspace: 0, voffset: 0 }), n;
  })(c.AbstractMmlLayoutNode);
  return L.MmlMpadded = f, L;
}
var D = {}, st;
function Kt() {
  if (st) return D;
  st = 1;
  var y = D && D.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = D && D.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(D, "__esModule", { value: !0 }), D.MmlMphantom = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mphantom";
      },
      enumerable: !1,
      configurable: !0
    }), n.defaults = s({}, c.AbstractMmlLayoutNode.defaults), n;
  })(c.AbstractMmlLayoutNode);
  return D.MmlMphantom = f, D;
}
var w = {}, lt;
function zt() {
  if (lt) return w;
  lt = 1;
  var y = w && w.__extends || /* @__PURE__ */ (function() {
    var n = function(t, e) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
        r.__proto__ = o;
      } || function(r, o) {
        for (var a in o) Object.prototype.hasOwnProperty.call(o, a) && (r[a] = o[a]);
      }, n(t, e);
    };
    return function(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      n(t, e);
      function r() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (r.prototype = e.prototype, new r());
    };
  })(), s = w && w.__assign || function() {
    return s = Object.assign || function(n) {
      for (var t, e = 1, r = arguments.length; e < r; e++) {
        t = arguments[e];
        for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
      }
      return n;
    }, s.apply(this, arguments);
  }, c = w && w.__values || function(n) {
    var t = typeof Symbol == "function" && Symbol.iterator, e = t && n[t], r = 0;
    if (e) return e.call(n);
    if (n && typeof n.length == "number") return {
      next: function() {
        return n && r >= n.length && (n = void 0), { value: n && n[r++], done: !n };
      }
    };
    throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(w, "__esModule", { value: !0 }), w.MmlMfrac = void 0;
  var f = g(), i = (function(n) {
    y(t, n);
    function t() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "mfrac";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setTeXclass = function(e) {
      var r, o;
      this.getPrevClass(e);
      try {
        for (var a = c(this.childNodes), u = a.next(); !u.done; u = a.next()) {
          var l = u.value;
          l.setTeXclass(null);
        }
      } catch (p) {
        r = { error: p };
      } finally {
        try {
          u && !u.done && (o = a.return) && o.call(a);
        } finally {
          if (r) throw r.error;
        }
      }
      return this;
    }, t.prototype.setChildInheritedAttributes = function(e, r, o, a) {
      (!r || o > 0) && o++, this.childNodes[0].setInheritedAttributes(e, !1, o, a), this.childNodes[1].setInheritedAttributes(e, !1, o, !0);
    }, t.defaults = s(s({}, f.AbstractMmlBaseNode.defaults), { linethickness: "medium", numalign: "center", denomalign: "center", bevelled: !1 }), t;
  })(f.AbstractMmlBaseNode);
  return w.MmlMfrac = i, w;
}
var B = {}, ct;
function Ht() {
  if (ct) return B;
  ct = 1;
  var y = B && B.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = B && B.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(B, "__esModule", { value: !0 }), B.MmlMsqrt = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "msqrt";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return -1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setTeXclass = function(t) {
      return this.getPrevClass(t), this.childNodes[0].setTeXclass(null), this;
    }, n.prototype.setChildInheritedAttributes = function(t, e, r, o) {
      this.childNodes[0].setInheritedAttributes(t, e, r, !0);
    }, n.defaults = s({}, c.AbstractMmlNode.defaults), n;
  })(c.AbstractMmlNode);
  return B.MmlMsqrt = f, B;
}
var F = {}, ft;
function Jt() {
  if (ft) return F;
  ft = 1;
  var y = F && F.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = F && F.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(F, "__esModule", { value: !0 }), F.MmlMroot = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mroot";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setTeXclass = function(t) {
      return this.getPrevClass(t), this.childNodes[0].setTeXclass(null), this.childNodes[1].setTeXclass(null), this;
    }, n.prototype.setChildInheritedAttributes = function(t, e, r, o) {
      this.childNodes[0].setInheritedAttributes(t, e, r, !0), this.childNodes[1].setInheritedAttributes(t, !1, r + 2, o);
    }, n.defaults = s({}, c.AbstractMmlNode.defaults), n;
  })(c.AbstractMmlNode);
  return F.MmlMroot = f, F;
}
var N = {}, pt;
function $t() {
  if (pt) return N;
  pt = 1;
  var y = N && N.__extends || /* @__PURE__ */ (function() {
    var n = function(t, e) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
        r.__proto__ = o;
      } || function(r, o) {
        for (var a in o) Object.prototype.hasOwnProperty.call(o, a) && (r[a] = o[a]);
      }, n(t, e);
    };
    return function(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      n(t, e);
      function r() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (r.prototype = e.prototype, new r());
    };
  })(), s = N && N.__assign || function() {
    return s = Object.assign || function(n) {
      for (var t, e = 1, r = arguments.length; e < r; e++) {
        t = arguments[e];
        for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
      }
      return n;
    }, s.apply(this, arguments);
  }, c = N && N.__values || function(n) {
    var t = typeof Symbol == "function" && Symbol.iterator, e = t && n[t], r = 0;
    if (e) return e.call(n);
    if (n && typeof n.length == "number") return {
      next: function() {
        return n && r >= n.length && (n = void 0), { value: n && n[r++], done: !n };
      }
    };
    throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(N, "__esModule", { value: !0 }), N.MmlMfenced = void 0;
  var f = g(), i = (function(n) {
    y(t, n);
    function t() {
      var e = n !== null && n.apply(this, arguments) || this;
      return e.texclass = f.TEXCLASS.INNER, e.separators = [], e.open = null, e.close = null, e;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "mfenced";
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setTeXclass = function(e) {
      this.getPrevClass(e), this.open && (e = this.open.setTeXclass(e)), this.childNodes[0] && (e = this.childNodes[0].setTeXclass(e));
      for (var r = 1, o = this.childNodes.length; r < o; r++)
        this.separators[r - 1] && (e = this.separators[r - 1].setTeXclass(e)), this.childNodes[r] && (e = this.childNodes[r].setTeXclass(e));
      return this.close && (e = this.close.setTeXclass(e)), this.updateTeXclass(this.open), e;
    }, t.prototype.setChildInheritedAttributes = function(e, r, o, a) {
      var u, l;
      this.addFakeNodes();
      try {
        for (var p = c([this.open, this.close].concat(this.separators)), d = p.next(); !d.done; d = p.next()) {
          var h = d.value;
          h && h.setInheritedAttributes(e, r, o, a);
        }
      } catch (m) {
        u = { error: m };
      } finally {
        try {
          d && !d.done && (l = p.return) && l.call(p);
        } finally {
          if (u) throw u.error;
        }
      }
      n.prototype.setChildInheritedAttributes.call(this, e, r, o, a);
    }, t.prototype.addFakeNodes = function() {
      var e, r, o = this.attributes.getList("open", "close", "separators"), a = o.open, u = o.close, l = o.separators;
      if (a = a.replace(/[ \t\n\r]/g, ""), u = u.replace(/[ \t\n\r]/g, ""), l = l.replace(/[ \t\n\r]/g, ""), a && (this.open = this.fakeNode(a, { fence: !0, form: "prefix" }, f.TEXCLASS.OPEN)), l) {
        for (; l.length < this.childNodes.length - 1; )
          l += l.charAt(l.length - 1);
        var p = 0;
        try {
          for (var d = c(this.childNodes.slice(1)), h = d.next(); !h.done; h = d.next()) {
            var m = h.value;
            m && this.separators.push(this.fakeNode(l.charAt(p++)));
          }
        } catch (v) {
          e = { error: v };
        } finally {
          try {
            h && !h.done && (r = d.return) && r.call(d);
          } finally {
            if (e) throw e.error;
          }
        }
      }
      u && (this.close = this.fakeNode(u, { fence: !0, form: "postfix" }, f.TEXCLASS.CLOSE));
    }, t.prototype.fakeNode = function(e, r, o) {
      r === void 0 && (r = {}), o === void 0 && (o = null);
      var a = this.factory.create("text").setText(e), u = this.factory.create("mo", r, [a]);
      return u.texClass = o, u.parent = this, u;
    }, t.defaults = s(s({}, f.AbstractMmlNode.defaults), { open: "(", close: ")", separators: "," }), t;
  })(f.AbstractMmlNode);
  return N.MmlMfenced = i, N;
}
var b = {}, dt;
function St() {
  if (dt) return b;
  dt = 1;
  var y = b && b.__extends || /* @__PURE__ */ (function() {
    var t = function(e, r) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, a) {
        o.__proto__ = a;
      } || function(o, a) {
        for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u]);
      }, t(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      t(e, r);
      function o() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (o.prototype = r.prototype, new o());
    };
  })(), s = b && b.__assign || function() {
    return s = Object.assign || function(t) {
      for (var e, r = 1, o = arguments.length; r < o; r++) {
        e = arguments[r];
        for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
      }
      return t;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(b, "__esModule", { value: !0 }), b.MmlMsup = b.MmlMsub = b.MmlMsubsup = void 0;
  var c = g(), f = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "msubsup";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 3;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "base", {
      get: function() {
        return 0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "sub", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "sup", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.setChildInheritedAttributes = function(r, o, a, u) {
      var l = this.childNodes;
      l[0].setInheritedAttributes(r, o, a, u), l[1].setInheritedAttributes(r, !1, a + 1, u || this.sub === 1), l[2] && l[2].setInheritedAttributes(r, !1, a + 1, u || this.sub === 2);
    }, e.defaults = s(s({}, c.AbstractMmlBaseNode.defaults), { subscriptshift: "", superscriptshift: "" }), e;
  })(c.AbstractMmlBaseNode);
  b.MmlMsubsup = f;
  var i = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "msub";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s({}, f.defaults), e;
  })(f);
  b.MmlMsub = i;
  var n = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "msup";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "sup", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "sub", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s({}, f.defaults), e;
  })(f);
  return b.MmlMsup = n, b;
}
var O = {}, yt;
function Ut() {
  if (yt) return O;
  yt = 1;
  var y = O && O.__extends || /* @__PURE__ */ (function() {
    var t = function(e, r) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, a) {
        o.__proto__ = a;
      } || function(o, a) {
        for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u]);
      }, t(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      t(e, r);
      function o() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (o.prototype = r.prototype, new o());
    };
  })(), s = O && O.__assign || function() {
    return s = Object.assign || function(t) {
      for (var e, r = 1, o = arguments.length; r < o; r++) {
        e = arguments[r];
        for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
      }
      return t;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(O, "__esModule", { value: !0 }), O.MmlMover = O.MmlMunder = O.MmlMunderover = void 0;
  var c = g(), f = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "munderover";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 3;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "base", {
      get: function() {
        return 0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "under", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "over", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.setChildInheritedAttributes = function(r, o, a, u) {
      var l = this.childNodes;
      l[0].setInheritedAttributes(r, o, a, u || !!l[this.over]);
      var p = !!(!o && l[0].coreMO().attributes.get("movablelimits")), d = this.constructor.ACCENTS;
      l[1].setInheritedAttributes(r, !1, this.getScriptlevel(d[1], p, a), u || this.under === 1), this.setInheritedAccent(1, d[1], o, a, u, p), l[2] && (l[2].setInheritedAttributes(r, !1, this.getScriptlevel(d[2], p, a), u || this.under === 2), this.setInheritedAccent(2, d[2], o, a, u, p));
    }, e.prototype.getScriptlevel = function(r, o, a) {
      return (o || !this.attributes.get(r)) && a++, a;
    }, e.prototype.setInheritedAccent = function(r, o, a, u, l, p) {
      var d = this.childNodes[r];
      if (this.attributes.getExplicit(o) == null && d.isEmbellished) {
        var h = d.coreMO().attributes.get("accent");
        this.attributes.setInherited(o, h), h !== this.attributes.getDefault(o) && d.setInheritedAttributes({}, a, this.getScriptlevel(o, p, u), l);
      }
    }, e.defaults = s(s({}, c.AbstractMmlBaseNode.defaults), { accent: !1, accentunder: !1, align: "center" }), e.ACCENTS = ["", "accentunder", "accent"], e;
  })(c.AbstractMmlBaseNode);
  O.MmlMunderover = f;
  var i = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "munder";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s({}, f.defaults), e;
  })(f);
  O.MmlMunder = i;
  var n = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "mover";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "over", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "under", {
      get: function() {
        return 2;
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s({}, f.defaults), e.ACCENTS = ["", "accent", "accentunder"], e;
  })(f);
  return O.MmlMover = n, O;
}
var j = {}, ht;
function Gt() {
  if (ht) return j;
  ht = 1;
  var y = j && j.__extends || /* @__PURE__ */ (function() {
    var e = function(r, o) {
      return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(a, u) {
        a.__proto__ = u;
      } || function(a, u) {
        for (var l in u) Object.prototype.hasOwnProperty.call(u, l) && (a[l] = u[l]);
      }, e(r, o);
    };
    return function(r, o) {
      if (typeof o != "function" && o !== null)
        throw new TypeError("Class extends value " + String(o) + " is not a constructor or null");
      e(r, o);
      function a() {
        this.constructor = r;
      }
      r.prototype = o === null ? Object.create(o) : (a.prototype = o.prototype, new a());
    };
  })(), s = j && j.__assign || function() {
    return s = Object.assign || function(e) {
      for (var r, o = 1, a = arguments.length; o < a; o++) {
        r = arguments[o];
        for (var u in r) Object.prototype.hasOwnProperty.call(r, u) && (e[u] = r[u]);
      }
      return e;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(j, "__esModule", { value: !0 }), j.MmlNone = j.MmlMprescripts = j.MmlMmultiscripts = void 0;
  var c = g(), f = St(), i = (function(e) {
    y(r, e);
    function r() {
      return e !== null && e.apply(this, arguments) || this;
    }
    return Object.defineProperty(r.prototype, "kind", {
      get: function() {
        return "mmultiscripts";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(r.prototype, "arity", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), r.prototype.setChildInheritedAttributes = function(o, a, u, l) {
      this.childNodes[0].setInheritedAttributes(o, a, u, l);
      for (var p = !1, d = 1, h = 0; d < this.childNodes.length; d++) {
        var m = this.childNodes[d];
        if (m.isKind("mprescripts")) {
          if (!p && (p = !0, d % 2 === 0)) {
            var v = this.factory.create("mrow");
            this.childNodes.splice(d, 0, v), v.parent = this, d++;
          }
        } else {
          var _ = l || h % 2 === 0;
          m.setInheritedAttributes(o, !1, u + 1, _), h++;
        }
      }
      this.childNodes.length % 2 === (p ? 1 : 0) && (this.appendChild(this.factory.create("mrow")), this.childNodes[this.childNodes.length - 1].setInheritedAttributes(o, !1, u + 1, l));
    }, r.prototype.verifyChildren = function(o) {
      for (var a = !1, u = o.fixMmultiscripts, l = 0; l < this.childNodes.length; l++) {
        var p = this.childNodes[l];
        p.isKind("mprescripts") && (a ? p.mError(p.kind + " can only appear once in " + this.kind, o, !0) : (a = !0, l % 2 === 0 && !u && this.mError("There must be an equal number of prescripts of each type", o)));
      }
      this.childNodes.length % 2 === (a ? 1 : 0) && !u && this.mError("There must be an equal number of scripts of each type", o), e.prototype.verifyChildren.call(this, o);
    }, r.defaults = s({}, f.MmlMsubsup.defaults), r;
  })(f.MmlMsubsup);
  j.MmlMmultiscripts = i;
  var n = (function(e) {
    y(r, e);
    function r() {
      return e !== null && e.apply(this, arguments) || this;
    }
    return Object.defineProperty(r.prototype, "kind", {
      get: function() {
        return "mprescripts";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(r.prototype, "arity", {
      get: function() {
        return 0;
      },
      enumerable: !1,
      configurable: !0
    }), r.prototype.verifyTree = function(o) {
      e.prototype.verifyTree.call(this, o), this.parent && !this.parent.isKind("mmultiscripts") && this.mError(this.kind + " must be a child of mmultiscripts", o, !0);
    }, r.defaults = s({}, c.AbstractMmlNode.defaults), r;
  })(c.AbstractMmlNode);
  j.MmlMprescripts = n;
  var t = (function(e) {
    y(r, e);
    function r() {
      return e !== null && e.apply(this, arguments) || this;
    }
    return Object.defineProperty(r.prototype, "kind", {
      get: function() {
        return "none";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(r.prototype, "arity", {
      get: function() {
        return 0;
      },
      enumerable: !1,
      configurable: !0
    }), r.prototype.verifyTree = function(o) {
      e.prototype.verifyTree.call(this, o), this.parent && !this.parent.isKind("mmultiscripts") && this.mError(this.kind + " must be a child of mmultiscripts", o, !0);
    }, r.defaults = s({}, c.AbstractMmlNode.defaults), r;
  })(c.AbstractMmlNode);
  return j.MmlNone = t, j;
}
var A = {}, mt;
function Qt() {
  if (mt) return A;
  mt = 1;
  var y = A && A.__extends || /* @__PURE__ */ (function() {
    var t = function(e, r) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, a) {
        o.__proto__ = a;
      } || function(o, a) {
        for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u]);
      }, t(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      t(e, r);
      function o() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (o.prototype = r.prototype, new o());
    };
  })(), s = A && A.__assign || function() {
    return s = Object.assign || function(t) {
      for (var e, r = 1, o = arguments.length; r < o; r++) {
        e = arguments[r];
        for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
      }
      return t;
    }, s.apply(this, arguments);
  }, c = A && A.__values || function(t) {
    var e = typeof Symbol == "function" && Symbol.iterator, r = e && t[e], o = 0;
    if (r) return r.call(t);
    if (t && typeof t.length == "number") return {
      next: function() {
        return t && o >= t.length && (t = void 0), { value: t && t[o++], done: !t };
      }
    };
    throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(A, "__esModule", { value: !0 }), A.MmlMtable = void 0;
  var f = g(), i = xt(), n = (function(t) {
    y(e, t);
    function e() {
      var r = t !== null && t.apply(this, arguments) || this;
      return r.properties = {
        useHeight: !0
      }, r.texclass = f.TEXCLASS.ORD, r;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "mtable";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.setInheritedAttributes = function(r, o, a, u) {
      var l, p;
      try {
        for (var d = c(f.indentAttributes), h = d.next(); !h.done; h = d.next()) {
          var m = h.value;
          r[m] && this.attributes.setInherited(m, r[m][1]), this.attributes.getExplicit(m) !== void 0 && delete this.attributes.getAllAttributes()[m];
        }
      } catch (v) {
        l = { error: v };
      } finally {
        try {
          h && !h.done && (p = d.return) && p.call(d);
        } finally {
          if (l) throw l.error;
        }
      }
      t.prototype.setInheritedAttributes.call(this, r, o, a, u);
    }, e.prototype.setChildInheritedAttributes = function(r, o, a, u) {
      var l, p, d, h;
      try {
        for (var m = c(this.childNodes), v = m.next(); !v.done; v = m.next()) {
          var _ = v.value;
          _.isKind("mtr") || this.replaceChild(this.factory.create("mtr"), _).appendChild(_);
        }
      } catch (T) {
        l = { error: T };
      } finally {
        try {
          v && !v.done && (p = m.return) && p.call(m);
        } finally {
          if (l) throw l.error;
        }
      }
      a = this.getProperty("scriptlevel") || a, o = !!(this.attributes.getExplicit("displaystyle") || this.attributes.getDefault("displaystyle")), r = this.addInheritedAttributes(r, {
        columnalign: this.attributes.get("columnalign"),
        rowalign: "center"
      });
      var U = this.attributes.getExplicit("data-cramped"), G = (0, i.split)(this.attributes.get("rowalign"));
      try {
        for (var Q = c(this.childNodes), S = Q.next(); !S.done; S = Q.next()) {
          var _ = S.value;
          r.rowalign[1] = G.shift() || r.rowalign[1], _.setInheritedAttributes(r, o, a, !!U);
        }
      } catch (T) {
        d = { error: T };
      } finally {
        try {
          S && !S.done && (h = Q.return) && h.call(Q);
        } finally {
          if (d) throw d.error;
        }
      }
    }, e.prototype.verifyChildren = function(r) {
      for (var o = null, a = this.factory, u = 0; u < this.childNodes.length; u++) {
        var l = this.childNodes[u];
        if (l.isKind("mtr"))
          o = null;
        else {
          var p = l.isKind("mtd");
          if (o ? (this.removeChild(l), u--) : o = this.replaceChild(a.create("mtr"), l), o.appendChild(p ? l : a.create("mtd", {}, [l])), !r.fixMtables) {
            l.parent.removeChild(l), l.parent = this, p && o.appendChild(a.create("mtd"));
            var d = l.mError("Children of " + this.kind + " must be mtr or mlabeledtr", r, p);
            o.childNodes[o.childNodes.length - 1].appendChild(d);
          }
        }
      }
      t.prototype.verifyChildren.call(this, r);
    }, e.prototype.setTeXclass = function(r) {
      var o, a;
      this.getPrevClass(r);
      try {
        for (var u = c(this.childNodes), l = u.next(); !l.done; l = u.next()) {
          var p = l.value;
          p.setTeXclass(null);
        }
      } catch (d) {
        o = { error: d };
      } finally {
        try {
          l && !l.done && (a = u.return) && a.call(u);
        } finally {
          if (o) throw o.error;
        }
      }
      return this;
    }, e.defaults = s(s({}, f.AbstractMmlNode.defaults), { align: "axis", rowalign: "baseline", columnalign: "center", groupalign: "{left}", alignmentscope: !0, columnwidth: "auto", width: "auto", rowspacing: "1ex", columnspacing: ".8em", rowlines: "none", columnlines: "none", frame: "none", framespacing: "0.4em 0.5ex", equalrows: !1, equalcolumns: !1, displaystyle: !1, side: "right", minlabelspacing: "0.8em" }), e;
  })(f.AbstractMmlNode);
  return A.MmlMtable = n, A;
}
var x = {}, gt;
function Vt() {
  if (gt) return x;
  gt = 1;
  var y = x && x.__extends || /* @__PURE__ */ (function() {
    var r = function(o, a) {
      return r = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(u, l) {
        u.__proto__ = l;
      } || function(u, l) {
        for (var p in l) Object.prototype.hasOwnProperty.call(l, p) && (u[p] = l[p]);
      }, r(o, a);
    };
    return function(o, a) {
      if (typeof a != "function" && a !== null)
        throw new TypeError("Class extends value " + String(a) + " is not a constructor or null");
      r(o, a);
      function u() {
        this.constructor = o;
      }
      o.prototype = a === null ? Object.create(a) : (u.prototype = a.prototype, new u());
    };
  })(), s = x && x.__assign || function() {
    return s = Object.assign || function(r) {
      for (var o, a = 1, u = arguments.length; a < u; a++) {
        o = arguments[a];
        for (var l in o) Object.prototype.hasOwnProperty.call(o, l) && (r[l] = o[l]);
      }
      return r;
    }, s.apply(this, arguments);
  }, c = x && x.__values || function(r) {
    var o = typeof Symbol == "function" && Symbol.iterator, a = o && r[o], u = 0;
    if (a) return a.call(r);
    if (r && typeof r.length == "number") return {
      next: function() {
        return r && u >= r.length && (r = void 0), { value: r && r[u++], done: !r };
      }
    };
    throw new TypeError(o ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(x, "__esModule", { value: !0 }), x.MmlMlabeledtr = x.MmlMtr = void 0;
  var f = g(), i = Pt(), n = xt(), t = (function(r) {
    y(o, r);
    function o() {
      return r !== null && r.apply(this, arguments) || this;
    }
    return Object.defineProperty(o.prototype, "kind", {
      get: function() {
        return "mtr";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(o.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), o.prototype.setChildInheritedAttributes = function(a, u, l, p) {
      var d, h, m, v;
      try {
        for (var _ = c(this.childNodes), U = _.next(); !U.done; U = _.next()) {
          var G = U.value;
          G.isKind("mtd") || this.replaceChild(this.factory.create("mtd"), G).appendChild(G);
        }
      } catch (W) {
        d = { error: W };
      } finally {
        try {
          U && !U.done && (h = _.return) && h.call(_);
        } finally {
          if (d) throw d.error;
        }
      }
      var Q = (0, n.split)(this.attributes.get("columnalign"));
      this.arity === 1 && Q.unshift(this.parent.attributes.get("side")), a = this.addInheritedAttributes(a, {
        rowalign: this.attributes.get("rowalign"),
        columnalign: "center"
      });
      try {
        for (var S = c(this.childNodes), T = S.next(); !T.done; T = S.next()) {
          var G = T.value;
          a.columnalign[1] = Q.shift() || a.columnalign[1], G.setInheritedAttributes(a, u, l, p);
        }
      } catch (W) {
        m = { error: W };
      } finally {
        try {
          T && !T.done && (v = S.return) && v.call(S);
        } finally {
          if (m) throw m.error;
        }
      }
    }, o.prototype.verifyChildren = function(a) {
      var u, l;
      if (this.parent && !this.parent.isKind("mtable")) {
        this.mError(this.kind + " can only be a child of an mtable", a, !0);
        return;
      }
      try {
        for (var p = c(this.childNodes), d = p.next(); !d.done; d = p.next()) {
          var h = d.value;
          if (!h.isKind("mtd")) {
            var m = this.replaceChild(this.factory.create("mtd"), h);
            m.appendChild(h), a.fixMtables || h.mError("Children of " + this.kind + " must be mtd", a);
          }
        }
      } catch (v) {
        u = { error: v };
      } finally {
        try {
          d && !d.done && (l = p.return) && l.call(p);
        } finally {
          if (u) throw u.error;
        }
      }
      r.prototype.verifyChildren.call(this, a);
    }, o.prototype.setTeXclass = function(a) {
      var u, l;
      this.getPrevClass(a);
      try {
        for (var p = c(this.childNodes), d = p.next(); !d.done; d = p.next()) {
          var h = d.value;
          h.setTeXclass(null);
        }
      } catch (m) {
        u = { error: m };
      } finally {
        try {
          d && !d.done && (l = p.return) && l.call(p);
        } finally {
          if (u) throw u.error;
        }
      }
      return this;
    }, o.defaults = s(s({}, f.AbstractMmlNode.defaults), { rowalign: i.INHERIT, columnalign: i.INHERIT, groupalign: i.INHERIT }), o;
  })(f.AbstractMmlNode);
  x.MmlMtr = t;
  var e = (function(r) {
    y(o, r);
    function o() {
      return r !== null && r.apply(this, arguments) || this;
    }
    return Object.defineProperty(o.prototype, "kind", {
      get: function() {
        return "mlabeledtr";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(o.prototype, "arity", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), o;
  })(t);
  return x.MmlMlabeledtr = e, x;
}
var K = {}, vt;
function Wt() {
  if (vt) return K;
  vt = 1;
  var y = K && K.__extends || /* @__PURE__ */ (function() {
    var n = function(t, e) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
        r.__proto__ = o;
      } || function(r, o) {
        for (var a in o) Object.prototype.hasOwnProperty.call(o, a) && (r[a] = o[a]);
      }, n(t, e);
    };
    return function(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      n(t, e);
      function r() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (r.prototype = e.prototype, new r());
    };
  })(), s = K && K.__assign || function() {
    return s = Object.assign || function(n) {
      for (var t, e = 1, r = arguments.length; e < r; e++) {
        t = arguments[e];
        for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
      }
      return n;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(K, "__esModule", { value: !0 }), K.MmlMtd = void 0;
  var c = g(), f = Pt(), i = (function(n) {
    y(t, n);
    function t() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "mtd";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "arity", {
      get: function() {
        return -1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "linebreakContainer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.verifyChildren = function(e) {
      if (this.parent && !this.parent.isKind("mtr")) {
        this.mError(this.kind + " can only be a child of an mtr or mlabeledtr", e, !0);
        return;
      }
      n.prototype.verifyChildren.call(this, e);
    }, t.prototype.setTeXclass = function(e) {
      return this.getPrevClass(e), this.childNodes[0].setTeXclass(null), this;
    }, t.defaults = s(s({}, c.AbstractMmlBaseNode.defaults), { rowspan: 1, columnspan: 1, rowalign: f.INHERIT, columnalign: f.INHERIT, groupalign: f.INHERIT }), t;
  })(c.AbstractMmlBaseNode);
  return K.MmlMtd = i, K;
}
var z = {}, _t;
function Yt() {
  if (_t) return z;
  _t = 1;
  var y = z && z.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = z && z.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(z, "__esModule", { value: !0 }), z.MmlMaction = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      return i !== null && i.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "maction";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "selected", {
      get: function() {
        var t = this.attributes.get("selection"), e = Math.max(1, Math.min(this.childNodes.length, t)) - 1;
        return this.childNodes[e] || this.factory.create("mrow");
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isEmbellished", {
      get: function() {
        return this.selected.isEmbellished;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isSpacelike", {
      get: function() {
        return this.selected.isSpacelike;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.core = function() {
      return this.selected.core();
    }, n.prototype.coreMO = function() {
      return this.selected.coreMO();
    }, n.prototype.verifyAttributes = function(t) {
      if (i.prototype.verifyAttributes.call(this, t), this.attributes.get("actiontype") !== "toggle" && this.attributes.getExplicit("selection") !== void 0) {
        var e = this.attributes.getAllAttributes();
        delete e.selection;
      }
    }, n.prototype.setTeXclass = function(t) {
      this.attributes.get("actiontype") === "tooltip" && this.childNodes[1] && this.childNodes[1].setTeXclass(null);
      var e = this.selected;
      return t = e.setTeXclass(t), this.updateTeXclass(e), t;
    }, n.prototype.nextToggleSelection = function() {
      var t = Math.max(1, this.attributes.get("selection") + 1);
      t > this.childNodes.length && (t = 1), this.attributes.set("selection", t);
    }, n.defaults = s(s({}, c.AbstractMmlNode.defaults), { actiontype: "toggle", selection: 1 }), n;
  })(c.AbstractMmlNode);
  return z.MmlMaction = f, z;
}
var H = {}, Mt;
function Zt() {
  if (Mt) return H;
  Mt = 1;
  var y = H && H.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = H && H.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(H, "__esModule", { value: !0 }), H.MmlMenclose = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "menclose";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return -1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "linebreakContininer", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setTeXclass = function(t) {
      return t = this.childNodes[0].setTeXclass(t), this.updateTeXclass(this.childNodes[0]), t;
    }, n.defaults = s(s({}, c.AbstractMmlNode.defaults), { notation: "longdiv" }), n;
  })(c.AbstractMmlNode);
  return H.MmlMenclose = f, H;
}
var P = {}, bt;
function te() {
  if (bt) return P;
  bt = 1;
  var y = P && P.__extends || /* @__PURE__ */ (function() {
    var t = function(e, r) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, a) {
        o.__proto__ = a;
      } || function(o, a) {
        for (var u in a) Object.prototype.hasOwnProperty.call(a, u) && (o[u] = a[u]);
      }, t(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      t(e, r);
      function o() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (o.prototype = r.prototype, new o());
    };
  })(), s = P && P.__assign || function() {
    return s = Object.assign || function(t) {
      for (var e, r = 1, o = arguments.length; r < o; r++) {
        e = arguments[r];
        for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
      }
      return t;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(P, "__esModule", { value: !0 }), P.MmlAnnotation = P.MmlAnnotationXML = P.MmlSemantics = void 0;
  var c = g(), f = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "semantics";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "arity", {
      get: function() {
        return 1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "notParent", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s(s({}, c.AbstractMmlBaseNode.defaults), { definitionUrl: null, encoding: null }), e;
  })(c.AbstractMmlBaseNode);
  P.MmlSemantics = f;
  var i = (function(t) {
    y(e, t);
    function e() {
      return t !== null && t.apply(this, arguments) || this;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "annotation-xml";
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.setChildInheritedAttributes = function() {
    }, e.defaults = s(s({}, c.AbstractMmlNode.defaults), { definitionUrl: null, encoding: null, cd: "mathmlkeys", name: "", src: null }), e;
  })(c.AbstractMmlNode);
  P.MmlAnnotationXML = i;
  var n = (function(t) {
    y(e, t);
    function e() {
      var r = t !== null && t.apply(this, arguments) || this;
      return r.properties = {
        isChars: !0
      }, r;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "annotation";
      },
      enumerable: !1,
      configurable: !0
    }), e.defaults = s({}, i.defaults), e;
  })(i);
  return P.MmlAnnotation = n, P;
}
var J = {}, Ot;
function ee() {
  if (Ot) return J;
  Ot = 1;
  var y = J && J.__extends || /* @__PURE__ */ (function() {
    var i = function(n, t) {
      return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (e[o] = r[o]);
      }, i(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      i(n, t);
      function e() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), s = J && J.__assign || function() {
    return s = Object.assign || function(i) {
      for (var n, t = 1, e = arguments.length; t < e; t++) {
        n = arguments[t];
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (i[r] = n[r]);
      }
      return i;
    }, s.apply(this, arguments);
  };
  Object.defineProperty(J, "__esModule", { value: !0 }), J.MmlMglyph = void 0;
  var c = g(), f = (function(i) {
    y(n, i);
    function n() {
      var t = i !== null && i.apply(this, arguments) || this;
      return t.texclass = c.TEXCLASS.ORD, t;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "mglyph";
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.verifyAttributes = function(t) {
      var e = this.attributes.getList("src", "fontfamily", "index"), r = e.src, o = e.fontfamily, a = e.index;
      r === "" && (o === "" || a === "") ? this.mError("mglyph must have either src or fontfamily and index attributes", t, !0) : i.prototype.verifyAttributes.call(this, t);
    }, n.defaults = s(s({}, c.AbstractMmlTokenNode.defaults), { alt: "", src: "", index: "", width: "auto", height: "auto", valign: "0em" }), n;
  })(c.AbstractMmlTokenNode);
  return J.MmlMglyph = f, J;
}
var $ = {}, jt;
function re() {
  if (jt) return $;
  jt = 1;
  var y = $ && $.__extends || /* @__PURE__ */ (function() {
    var n = function(t, e) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
        r.__proto__ = o;
      } || function(r, o) {
        for (var a in o) Object.prototype.hasOwnProperty.call(o, a) && (r[a] = o[a]);
      }, n(t, e);
    };
    return function(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      n(t, e);
      function r() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (r.prototype = e.prototype, new r());
    };
  })(), s = $ && $.__assign || function() {
    return s = Object.assign || function(n) {
      for (var t, e = 1, r = arguments.length; e < r; e++) {
        t = arguments[e];
        for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
      }
      return n;
    }, s.apply(this, arguments);
  };
  Object.defineProperty($, "__esModule", { value: !0 }), $.TeXAtom = void 0;
  var c = g(), f = At(), i = (function(n) {
    y(t, n);
    function t(e, r, o) {
      var a = n.call(this, e, r, o) || this;
      return a.texclass = c.TEXCLASS.ORD, a.setProperty("texClass", a.texClass), a;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "TeXAtom";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "arity", {
      get: function() {
        return -1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "notParent", {
      get: function() {
        return this.childNodes[0] && this.childNodes[0].childNodes.length === 1;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setTeXclass = function(e) {
      return this.childNodes[0].setTeXclass(null), this.adjustTeXclass(e);
    }, t.prototype.adjustTeXclass = function(e) {
      return e;
    }, t.defaults = s({}, c.AbstractMmlBaseNode.defaults), t;
  })(c.AbstractMmlBaseNode);
  return $.TeXAtom = i, i.prototype.adjustTeXclass = f.MmlMo.prototype.adjustTeXclass, $;
}
export {
  kt as a,
  qt as b,
  Xt as c,
  It as d,
  Rt as e,
  Lt as f,
  Dt as g,
  Bt as h,
  Ft as i,
  Kt as j,
  zt as k,
  Ht as l,
  Jt as m,
  $t as n,
  St as o,
  Ut as p,
  Gt as q,
  Et as r,
  Qt as s,
  Vt as t,
  Wt as u,
  Yt as v,
  Zt as w,
  te as x,
  ee as y,
  re as z
};
