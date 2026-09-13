import { g as R } from "./PrioritizedList-TjDg4i-s.js";
import { r as Z } from "./Options-BStFr0zv.js";
import { r as tt } from "./Entities-XwxJEcR3.js";
import { r as et } from "./Styles-DdTYCumM.js";
function rt(A, O) {
  for (var b = 0; b < O.length; b++) {
    const v = O[b];
    if (typeof v != "string" && !Array.isArray(v)) {
      for (const s in v)
        if (s !== "default" && !(s in A)) {
          const f = Object.getOwnPropertyDescriptor(v, s);
          f && Object.defineProperty(A, s, f.get ? f : {
            enumerable: !0,
            get: () => v[s]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(A, Symbol.toStringTag, { value: "Module" }));
}
var w = {}, P = {}, B;
function nt() {
  if (B) return P;
  B = 1;
  var A = P && P.__values || function(b) {
    var v = typeof Symbol == "function" && Symbol.iterator, s = v && b[v], f = 0;
    if (s) return s.call(b);
    if (b && typeof b.length == "number") return {
      next: function() {
        return b && f >= b.length && (b = void 0), { value: b && b[f++], done: !b };
      }
    };
    throw new TypeError(v ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(P, "__esModule", { value: !0 }), P.AbstractDOMAdaptor = void 0;
  var O = (function() {
    function b(v) {
      v === void 0 && (v = null), this.document = v;
    }
    return b.prototype.node = function(v, s, f, p) {
      var y, h;
      s === void 0 && (s = {}), f === void 0 && (f = []);
      var d = this.create(v, p);
      this.setAttributes(d, s);
      try {
        for (var g = A(f), n = g.next(); !n.done; n = g.next()) {
          var i = n.value;
          this.append(d, i);
        }
      } catch (a) {
        y = { error: a };
      } finally {
        try {
          n && !n.done && (h = g.return) && h.call(g);
        } finally {
          if (y) throw y.error;
        }
      }
      return d;
    }, b.prototype.setAttributes = function(v, s) {
      var f, p, y, h, d, g;
      if (s.style && typeof s.style != "string")
        try {
          for (var n = A(Object.keys(s.style)), i = n.next(); !i.done; i = n.next()) {
            var a = i.value;
            this.setStyle(v, a.replace(/-([a-z])/g, function(t, e) {
              return e.toUpperCase();
            }), s.style[a]);
          }
        } catch (t) {
          f = { error: t };
        } finally {
          try {
            i && !i.done && (p = n.return) && p.call(n);
          } finally {
            if (f) throw f.error;
          }
        }
      if (s.properties)
        try {
          for (var l = A(Object.keys(s.properties)), _ = l.next(); !_.done; _ = l.next()) {
            var a = _.value;
            v[a] = s.properties[a];
          }
        } catch (t) {
          y = { error: t };
        } finally {
          try {
            _ && !_.done && (h = l.return) && h.call(l);
          } finally {
            if (y) throw y.error;
          }
        }
      try {
        for (var c = A(Object.keys(s)), r = c.next(); !r.done; r = c.next()) {
          var a = r.value;
          (a !== "style" || typeof s.style == "string") && a !== "properties" && this.setAttribute(v, a, s[a]);
        }
      } catch (t) {
        d = { error: t };
      } finally {
        try {
          r && !r.done && (g = c.return) && g.call(c);
        } finally {
          if (d) throw d.error;
        }
      }
    }, b.prototype.replace = function(v, s) {
      return this.insert(v, s), this.remove(s), s;
    }, b.prototype.childNode = function(v, s) {
      return this.childNodes(v)[s];
    }, b.prototype.allClasses = function(v) {
      var s = this.getAttribute(v, "class");
      return s ? s.replace(/  +/g, " ").replace(/^ /, "").replace(/ $/, "").split(/ /) : [];
    }, b;
  })();
  return P.AbstractDOMAdaptor = O, P;
}
var T = {}, q;
function it() {
  return q || (q = 1, (function(A) {
    var O = T && T.__extends || /* @__PURE__ */ (function() {
      var f = function(p, y) {
        return f = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, d) {
          h.__proto__ = d;
        } || function(h, d) {
          for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (h[g] = d[g]);
        }, f(p, y);
      };
      return function(p, y) {
        if (typeof y != "function" && y !== null)
          throw new TypeError("Class extends value " + String(y) + " is not a constructor or null");
        f(p, y);
        function h() {
          this.constructor = p;
        }
        p.prototype = y === null ? Object.create(y) : (h.prototype = y.prototype, new h());
      };
    })(), b = T && T.__assign || function() {
      return b = Object.assign || function(f) {
        for (var p, y = 1, h = arguments.length; y < h; y++) {
          p = arguments[y];
          for (var d in p) Object.prototype.hasOwnProperty.call(p, d) && (f[d] = p[d]);
        }
        return f;
      }, b.apply(this, arguments);
    };
    Object.defineProperty(A, "__esModule", { value: !0 }), A.NodeMixin = A.NodeMixinOptions = void 0;
    var v = Z();
    A.NodeMixinOptions = {
      badCSS: !0,
      badSizes: !0
    };
    function s(f, p) {
      var y;
      return p === void 0 && (p = {}), p = (0, v.userOptions)((0, v.defaultOptions)({}, A.NodeMixinOptions), p), y = (function(h) {
        O(d, h);
        function d() {
          for (var g = [], n = 0; n < arguments.length; n++)
            g[n] = arguments[n];
          var i = h.call(this, g[0]) || this, a = i.constructor;
          return i.options = (0, v.userOptions)((0, v.defaultOptions)({}, a.OPTIONS), g[1]), i;
        }
        return d.prototype.fontSize = function(g) {
          return p.badCSS ? this.options.fontSize : h.prototype.fontSize.call(this, g);
        }, d.prototype.fontFamily = function(g) {
          return p.badCSS ? this.options.fontFamily : h.prototype.fontFamily.call(this, g);
        }, d.prototype.nodeSize = function(g, n, i) {
          if (n === void 0 && (n = 1), i === void 0 && (i = null), !p.badSizes)
            return h.prototype.nodeSize.call(this, g, n, i);
          var a = this.textContent(g), l = Array.from(a.replace(d.cjkPattern, "")).length, _ = Array.from(a).length - l;
          return [
            _ * this.options.cjkCharWidth + l * this.options.unknownCharWidth,
            this.options.unknownCharHeight
          ];
        }, d.prototype.nodeBBox = function(g) {
          return p.badSizes ? { left: 0, right: 0, top: 0, bottom: 0 } : h.prototype.nodeBBox.call(this, g);
        }, d;
      })(f), y.OPTIONS = b(b({}, p.badCSS ? {
        fontSize: 16,
        fontFamily: "Times"
      } : {}), p.badSizes ? {
        cjkCharWidth: 1,
        unknownCharWidth: 0.6,
        unknownCharHeight: 0.8
      } : {}), y.cjkPattern = new RegExp([
        "[",
        "ᄀ-ᅟ",
        "〈〉",
        "⺀-〾",
        "぀-㉇",
        "㉐-䶿",
        "一-꓆",
        "ꥠ-ꥼ",
        "가-힣",
        "豈-﫿",
        "︐-︙",
        "︰-﹫",
        "！-｠￠-￦",
        "𛀀-𛀁",
        "🈀-🉑",
        "𠀀-𿿽",
        "]"
      ].join(""), "gu"), y;
    }
    A.NodeMixin = s;
  })(T)), T;
}
var k = {}, j = {}, N;
function F() {
  if (N) return j;
  N = 1;
  var A = j && j.__assign || function() {
    return A = Object.assign || function(f) {
      for (var p, y = 1, h = arguments.length; y < h; y++) {
        p = arguments[y];
        for (var d in p) Object.prototype.hasOwnProperty.call(p, d) && (f[d] = p[d]);
      }
      return f;
    }, A.apply(this, arguments);
  }, O = j && j.__read || function(f, p) {
    var y = typeof Symbol == "function" && f[Symbol.iterator];
    if (!y) return f;
    var h = y.call(f), d, g = [], n;
    try {
      for (; (p === void 0 || p-- > 0) && !(d = h.next()).done; ) g.push(d.value);
    } catch (i) {
      n = { error: i };
    } finally {
      try {
        d && !d.done && (y = h.return) && y.call(h);
      } finally {
        if (n) throw n.error;
      }
    }
    return g;
  }, b = j && j.__spreadArray || function(f, p, y) {
    if (y || arguments.length === 2) for (var h = 0, d = p.length, g; h < d; h++)
      (g || !(h in p)) && (g || (g = Array.prototype.slice.call(p, 0, h)), g[h] = p[h]);
    return f.concat(g || Array.prototype.slice.call(p));
  }, v = j && j.__values || function(f) {
    var p = typeof Symbol == "function" && Symbol.iterator, y = p && f[p], h = 0;
    if (y) return y.call(f);
    if (f && typeof f.length == "number") return {
      next: function() {
        return f && h >= f.length && (f = void 0), { value: f && f[h++], done: !f };
      }
    };
    throw new TypeError(p ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(j, "__esModule", { value: !0 }), j.LiteElement = void 0;
  var s = /* @__PURE__ */ (function() {
    function f(p, y, h) {
      var d, g;
      y === void 0 && (y = {}), h === void 0 && (h = []), this.kind = p, this.attributes = A({}, y), this.children = b([], O(h), !1);
      try {
        for (var n = v(this.children), i = n.next(); !i.done; i = n.next()) {
          var a = i.value;
          a.parent = this;
        }
      } catch (l) {
        d = { error: l };
      } finally {
        try {
          i && !i.done && (g = n.return) && g.call(n);
        } finally {
          if (d) throw d.error;
        }
      }
      this.styles = null;
    }
    return f;
  })();
  return j.LiteElement = s, j;
}
var W;
function J() {
  if (W) return k;
  W = 1, Object.defineProperty(k, "__esModule", { value: !0 }), k.LiteDocument = void 0;
  var A = F(), O = (function() {
    function b() {
      this.root = new A.LiteElement("html", {}, [
        this.head = new A.LiteElement("head"),
        this.body = new A.LiteElement("body")
      ]), this.type = "";
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "#document";
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })();
  return k.LiteDocument = O, k;
}
var D = {}, G;
function K() {
  if (G) return D;
  G = 1;
  var A = D && D.__extends || /* @__PURE__ */ (function() {
    var v = function(s, f) {
      return v = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(p, y) {
        p.__proto__ = y;
      } || function(p, y) {
        for (var h in y) Object.prototype.hasOwnProperty.call(y, h) && (p[h] = y[h]);
      }, v(s, f);
    };
    return function(s, f) {
      if (typeof f != "function" && f !== null)
        throw new TypeError("Class extends value " + String(f) + " is not a constructor or null");
      v(s, f);
      function p() {
        this.constructor = s;
      }
      s.prototype = f === null ? Object.create(f) : (p.prototype = f.prototype, new p());
    };
  })();
  Object.defineProperty(D, "__esModule", { value: !0 }), D.LiteComment = D.LiteText = void 0;
  var O = (function() {
    function v(s) {
      s === void 0 && (s = ""), this.value = s;
    }
    return Object.defineProperty(v.prototype, "kind", {
      get: function() {
        return "#text";
      },
      enumerable: !1,
      configurable: !0
    }), v;
  })();
  D.LiteText = O;
  var b = (function(v) {
    A(s, v);
    function s() {
      return v !== null && v.apply(this, arguments) || this;
    }
    return Object.defineProperty(s.prototype, "kind", {
      get: function() {
        return "#comment";
      },
      enumerable: !1,
      configurable: !0
    }), s;
  })(O);
  return D.LiteComment = b, D;
}
var I = {}, E = {}, U;
function ot() {
  if (U) return E;
  U = 1;
  var A = E && E.__read || function(v, s) {
    var f = typeof Symbol == "function" && v[Symbol.iterator];
    if (!f) return v;
    var p = f.call(v), y, h = [], d;
    try {
      for (; (s === void 0 || s-- > 0) && !(y = p.next()).done; ) h.push(y.value);
    } catch (g) {
      d = { error: g };
    } finally {
      try {
        y && !y.done && (f = p.return) && f.call(p);
      } finally {
        if (d) throw d.error;
      }
    }
    return h;
  }, O = E && E.__spreadArray || function(v, s, f) {
    if (f || arguments.length === 2) for (var p = 0, y = s.length, h; p < y; p++)
      (h || !(p in s)) && (h || (h = Array.prototype.slice.call(s, 0, p)), h[p] = s[p]);
    return v.concat(h || Array.prototype.slice.call(s));
  };
  Object.defineProperty(E, "__esModule", { value: !0 }), E.LiteList = void 0;
  var b = (function() {
    function v(s) {
      this.nodes = [], this.nodes = O([], A(s), !1);
    }
    return v.prototype.append = function(s) {
      this.nodes.push(s);
    }, v.prototype[Symbol.iterator] = function() {
      var s = 0;
      return {
        next: function() {
          return s === this.nodes.length ? { value: null, done: !0 } : { value: this.nodes[s++], done: !1 };
        }
      };
    }, v;
  })();
  return E.LiteList = b, E;
}
var S = {}, $;
function X() {
  return $ || ($ = 1, (function(A) {
    var O = S && S.__createBinding || (Object.create ? (function(n, i, a, l) {
      l === void 0 && (l = a);
      var _ = Object.getOwnPropertyDescriptor(i, a);
      (!_ || ("get" in _ ? !i.__esModule : _.writable || _.configurable)) && (_ = { enumerable: !0, get: function() {
        return i[a];
      } }), Object.defineProperty(n, l, _);
    }) : (function(n, i, a, l) {
      l === void 0 && (l = a), n[l] = i[a];
    })), b = S && S.__setModuleDefault || (Object.create ? (function(n, i) {
      Object.defineProperty(n, "default", { enumerable: !0, value: i });
    }) : function(n, i) {
      n.default = i;
    }), v = S && S.__importStar || function(n) {
      if (n && n.__esModule) return n;
      var i = {};
      if (n != null) for (var a in n) a !== "default" && Object.prototype.hasOwnProperty.call(n, a) && O(i, n, a);
      return b(i, n), i;
    }, s = S && S.__read || function(n, i) {
      var a = typeof Symbol == "function" && n[Symbol.iterator];
      if (!a) return n;
      var l = a.call(n), _, c = [], r;
      try {
        for (; (i === void 0 || i-- > 0) && !(_ = l.next()).done; ) c.push(_.value);
      } catch (t) {
        r = { error: t };
      } finally {
        try {
          _ && !_.done && (a = l.return) && a.call(l);
        } finally {
          if (r) throw r.error;
        }
      }
      return c;
    }, f = S && S.__values || function(n) {
      var i = typeof Symbol == "function" && Symbol.iterator, a = i && n[i], l = 0;
      if (a) return a.call(n);
      if (n && typeof n.length == "number") return {
        next: function() {
          return n && l >= n.length && (n = void 0), { value: n && n[l++], done: !n };
        }
      };
      throw new TypeError(i ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(A, "__esModule", { value: !0 }), A.LiteParser = A.PATTERNS = void 0;
    var p = v(tt()), y = F(), h = K(), d;
    (function(n) {
      n.TAGNAME = "[a-z][^\\s\\n>]*", n.ATTNAME = "[a-z][^\\s\\n>=]*", n.VALUE = `(?:'[^']*'|"[^"]*"|[^\\s\\n]+)`, n.VALUESPLIT = `(?:'([^']*)'|"([^"]*)"|([^\\s\\n]+))`, n.SPACE = "(?:\\s|\\n)+", n.OPTIONALSPACE = "(?:\\s|\\n)*", n.ATTRIBUTE = n.ATTNAME + "(?:" + n.OPTIONALSPACE + "=" + n.OPTIONALSPACE + n.VALUE + ")?", n.ATTRIBUTESPLIT = "(" + n.ATTNAME + ")(?:" + n.OPTIONALSPACE + "=" + n.OPTIONALSPACE + n.VALUESPLIT + ")?", n.TAG = "(<(?:" + n.TAGNAME + "(?:" + n.SPACE + n.ATTRIBUTE + ")*" + n.OPTIONALSPACE + "/?|/" + n.TAGNAME + "|!--[^]*?--|![^]*?)(?:>|$))", n.tag = new RegExp(n.TAG, "i"), n.attr = new RegExp(n.ATTRIBUTE, "i"), n.attrsplit = new RegExp(n.ATTRIBUTESPLIT, "i");
    })(d = A.PATTERNS || (A.PATTERNS = {}));
    var g = (function() {
      function n() {
      }
      return n.prototype.parseFromString = function(i, a, l) {
        l === void 0 && (l = null);
        for (var _ = l.createDocument(), c = l.body(_), r = i.replace(/<\?.*?\?>/g, "").split(d.tag); r.length; ) {
          var t = r.shift(), e = r.shift();
          t && this.addText(l, c, t), e && e.charAt(e.length - 1) === ">" && (e.charAt(1) === "!" ? this.addComment(l, c, e) : e.charAt(1) === "/" ? c = this.closeTag(l, c, e) : c = this.openTag(l, c, e, r));
        }
        return this.checkDocument(l, _), _;
      }, n.prototype.addText = function(i, a, l) {
        return l = p.translate(l), i.append(a, i.text(l));
      }, n.prototype.addComment = function(i, a, l) {
        return i.append(a, new h.LiteComment(l));
      }, n.prototype.closeTag = function(i, a, l) {
        for (var _ = l.slice(2, l.length - 1).toLowerCase(); i.parent(a) && i.kind(a) !== _; )
          a = i.parent(a);
        return i.parent(a);
      }, n.prototype.openTag = function(i, a, l, _) {
        var c = this.constructor.PCDATA, r = this.constructor.SELF_CLOSING, t = l.match(/<(.*?)[\s\n>\/]/)[1].toLowerCase(), e = i.node(t), o = l.replace(/^<.*?[\s\n>]/, "").split(d.attrsplit);
        return (o.pop().match(/>$/) || o.length < 5) && (this.addAttributes(i, e, o), i.append(a, e), !r[t] && !l.match(/\/>$/) && (c[t] ? this.handlePCDATA(i, e, t, _) : a = e)), a;
      }, n.prototype.addAttributes = function(i, a, l) {
        for (var _ = this.constructor.CDATA_ATTR; l.length; ) {
          var c = s(l.splice(0, 5), 5), r = c[1], t = c[2], e = c[3], o = c[4], u = t || e || o || "";
          _[r] || (u = p.translate(u)), i.setAttribute(a, r, u);
        }
      }, n.prototype.handlePCDATA = function(i, a, l, _) {
        for (var c = [], r = "</" + l + ">", t = ""; _.length && t !== r; )
          c.push(t), c.push(_.shift()), t = _.shift();
        i.append(a, i.text(c.join("")));
      }, n.prototype.checkDocument = function(i, a) {
        var l, _, c, r, t = this.getOnlyChild(i, i.body(a));
        if (t) {
          try {
            for (var e = f(i.childNodes(i.body(a))), o = e.next(); !o.done; o = e.next()) {
              var u = o.value;
              if (u === t)
                break;
              u instanceof h.LiteComment && u.value.match(/^<!DOCTYPE/) && (a.type = u.value);
            }
          } catch (C) {
            l = { error: C };
          } finally {
            try {
              o && !o.done && (_ = e.return) && _.call(e);
            } finally {
              if (l) throw l.error;
            }
          }
          switch (i.kind(t)) {
            case "html":
              try {
                for (var m = f(t.children), L = m.next(); !L.done; L = m.next()) {
                  var u = L.value;
                  switch (i.kind(u)) {
                    case "head":
                      a.head = u;
                      break;
                    case "body":
                      a.body = u;
                      break;
                  }
                }
              } catch (C) {
                c = { error: C };
              } finally {
                try {
                  L && !L.done && (r = m.return) && r.call(m);
                } finally {
                  if (c) throw c.error;
                }
              }
              a.root = t, i.remove(t), i.parent(a.body) !== t && i.append(t, a.body), i.parent(a.head) !== t && i.insert(a.head, a.body);
              break;
            case "head":
              a.head = i.replace(t, a.head);
              break;
            case "body":
              a.body = i.replace(t, a.body);
              break;
          }
        }
      }, n.prototype.getOnlyChild = function(i, a) {
        var l, _, c = null;
        try {
          for (var r = f(i.childNodes(a)), t = r.next(); !t.done; t = r.next()) {
            var e = t.value;
            if (e instanceof y.LiteElement) {
              if (c)
                return null;
              c = e;
            }
          }
        } catch (o) {
          l = { error: o };
        } finally {
          try {
            t && !t.done && (_ = r.return) && _.call(r);
          } finally {
            if (l) throw l.error;
          }
        }
        return c;
      }, n.prototype.serialize = function(i, a, l) {
        var _ = this;
        l === void 0 && (l = !1);
        var c = this.constructor.SELF_CLOSING, r = this.constructor.CDATA_ATTR, t = i.kind(a), e = i.allAttributes(a).map(function(m) {
          return m.name + '="' + (r[m.name] ? m.value : _.protectAttribute(m.value)) + '"';
        }).join(" "), o = this.serializeInner(i, a, l), u = "<" + t + (e ? " " + e : "") + ((!l || o) && !c[t] ? ">".concat(o, "</").concat(t, ">") : l ? "/>" : ">");
        return u;
      }, n.prototype.serializeInner = function(i, a, l) {
        var _ = this;
        l === void 0 && (l = !1);
        var c = this.constructor.PCDATA;
        return c.hasOwnProperty(a.kind) ? i.childNodes(a).map(function(r) {
          return i.value(r);
        }).join("") : i.childNodes(a).map(function(r) {
          var t = i.kind(r);
          return t === "#text" ? _.protectHTML(i.value(r)) : t === "#comment" ? r.value : _.serialize(i, r, l);
        }).join("");
      }, n.prototype.protectAttribute = function(i) {
        return typeof i != "string" && (i = String(i)), i.replace(/"/g, "&quot;");
      }, n.prototype.protectHTML = function(i) {
        return i.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }, n.SELF_CLOSING = {
        area: !0,
        base: !0,
        br: !0,
        col: !0,
        command: !0,
        embed: !0,
        hr: !0,
        img: !0,
        input: !0,
        keygen: !0,
        link: !0,
        menuitem: !0,
        meta: !0,
        param: !0,
        source: !0,
        track: !0,
        wbr: !0
      }, n.PCDATA = {
        option: !0,
        textarea: !0,
        fieldset: !0,
        title: !0,
        style: !0,
        script: !0
      }, n.CDATA_ATTR = {
        style: !0,
        datafld: !0,
        datasrc: !0,
        href: !0,
        src: !0,
        longdesc: !0,
        usemap: !0,
        cite: !0,
        datetime: !0,
        action: !0,
        axis: !0,
        profile: !0,
        content: !0,
        scheme: !0
      }, n;
    })();
    A.LiteParser = g;
  })(S)), S;
}
var H;
function at() {
  if (H) return I;
  H = 1, Object.defineProperty(I, "__esModule", { value: !0 }), I.LiteWindow = void 0;
  var A = F(), O = J(), b = ot(), v = X(), s = /* @__PURE__ */ (function() {
    function f() {
      this.DOMParser = v.LiteParser, this.NodeList = b.LiteList, this.HTMLCollection = b.LiteList, this.HTMLElement = A.LiteElement, this.DocumentFragment = b.LiteList, this.Document = O.LiteDocument, this.document = new O.LiteDocument();
    }
    return f;
  })();
  return I.LiteWindow = s, I;
}
var V;
function ut() {
  if (V) return w;
  V = 1;
  var A = w && w.__extends || /* @__PURE__ */ (function() {
    var c = function(r, t) {
      return c = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, o) {
        e.__proto__ = o;
      } || function(e, o) {
        for (var u in o) Object.prototype.hasOwnProperty.call(o, u) && (e[u] = o[u]);
      }, c(r, t);
    };
    return function(r, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      c(r, t);
      function e() {
        this.constructor = r;
      }
      r.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
    };
  })(), O = w && w.__assign || function() {
    return O = Object.assign || function(c) {
      for (var r, t = 1, e = arguments.length; t < e; t++) {
        r = arguments[t];
        for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (c[o] = r[o]);
      }
      return c;
    }, O.apply(this, arguments);
  }, b = w && w.__values || function(c) {
    var r = typeof Symbol == "function" && Symbol.iterator, t = r && c[r], e = 0;
    if (t) return t.call(c);
    if (c && typeof c.length == "number") return {
      next: function() {
        return c && e >= c.length && (c = void 0), { value: c && c[e++], done: !c };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, v = w && w.__read || function(c, r) {
    var t = typeof Symbol == "function" && c[Symbol.iterator];
    if (!t) return c;
    var e = t.call(c), o, u = [], m;
    try {
      for (; (r === void 0 || r-- > 0) && !(o = e.next()).done; ) u.push(o.value);
    } catch (L) {
      m = { error: L };
    } finally {
      try {
        o && !o.done && (t = e.return) && t.call(e);
      } finally {
        if (m) throw m.error;
      }
    }
    return u;
  }, s = w && w.__spreadArray || function(c, r, t) {
    if (t || arguments.length === 2) for (var e = 0, o = r.length, u; e < o; e++)
      (u || !(e in r)) && (u || (u = Array.prototype.slice.call(r, 0, e)), u[e] = r[e]);
    return c.concat(u || Array.prototype.slice.call(r));
  };
  Object.defineProperty(w, "__esModule", { value: !0 }), w.liteAdaptor = w.LiteAdaptor = w.LiteBase = void 0;
  var f = nt(), p = it(), y = J(), h = F(), d = K(), g = at(), n = X(), i = et(), a = (function(c) {
    A(r, c);
    function r() {
      var t = c.call(this) || this;
      return t.parser = new n.LiteParser(), t.window = new g.LiteWindow(), t;
    }
    return r.prototype.parse = function(t, e) {
      return this.parser.parseFromString(t, e, this);
    }, r.prototype.create = function(t, e) {
      return new h.LiteElement(t);
    }, r.prototype.text = function(t) {
      return new d.LiteText(t);
    }, r.prototype.comment = function(t) {
      return new d.LiteComment(t);
    }, r.prototype.createDocument = function() {
      return new y.LiteDocument();
    }, r.prototype.head = function(t) {
      return t.head;
    }, r.prototype.body = function(t) {
      return t.body;
    }, r.prototype.root = function(t) {
      return t.root;
    }, r.prototype.doctype = function(t) {
      return t.type;
    }, r.prototype.tags = function(t, e, o) {
      o === void 0 && (o = null);
      var u = [], m = [];
      if (o)
        return m;
      for (var L = t; L; ) {
        var C = L.kind;
        C !== "#text" && C !== "#comment" && (L = L, C === e && m.push(L), L.children.length && (u = L.children.concat(u))), L = u.shift();
      }
      return m;
    }, r.prototype.elementById = function(t, e) {
      for (var o = [], u = t; u; ) {
        if (u.kind !== "#text" && u.kind !== "#comment") {
          if (u = u, u.attributes.id === e)
            return u;
          u.children.length && (o = u.children.concat(o));
        }
        u = o.shift();
      }
      return null;
    }, r.prototype.elementsByClass = function(t, e) {
      for (var o = [], u = [], m = t; m; ) {
        if (m.kind !== "#text" && m.kind !== "#comment") {
          m = m;
          var L = (m.attributes.class || "").trim().split(/ +/);
          L.includes(e) && u.push(m), m.children.length && (o = m.children.concat(o));
        }
        m = o.shift();
      }
      return u;
    }, r.prototype.getElements = function(t, e) {
      var o, u, m = [], L = this.body(e);
      try {
        for (var C = b(t), M = C.next(); !M.done; M = C.next()) {
          var x = M.value;
          if (typeof x == "string")
            if (x.charAt(0) === "#") {
              var z = this.elementById(L, x.slice(1));
              z && m.push(z);
            } else x.charAt(0) === "." ? m = m.concat(this.elementsByClass(L, x.slice(1))) : x.match(/^[-a-z][-a-z0-9]*$/i) && (m = m.concat(this.tags(L, x)));
          else Array.isArray(x) ? m = m.concat(x) : x instanceof this.window.NodeList || x instanceof this.window.HTMLCollection ? m = m.concat(x.nodes) : m.push(x);
        }
      } catch (Q) {
        o = { error: Q };
      } finally {
        try {
          M && !M.done && (u = C.return) && u.call(C);
        } finally {
          if (o) throw o.error;
        }
      }
      return m;
    }, r.prototype.contains = function(t, e) {
      for (; e && e !== t; )
        e = this.parent(e);
      return !!e;
    }, r.prototype.parent = function(t) {
      return t.parent;
    }, r.prototype.childIndex = function(t) {
      return t.parent ? t.parent.children.findIndex(function(e) {
        return e === t;
      }) : -1;
    }, r.prototype.append = function(t, e) {
      return e.parent && this.remove(e), t.children.push(e), e.parent = t, e;
    }, r.prototype.insert = function(t, e) {
      if (t.parent && this.remove(t), e && e.parent) {
        var o = this.childIndex(e);
        e.parent.children.splice(o, 0, t), t.parent = e.parent;
      }
    }, r.prototype.remove = function(t) {
      var e = this.childIndex(t);
      return e >= 0 && t.parent.children.splice(e, 1), t.parent = null, t;
    }, r.prototype.replace = function(t, e) {
      var o = this.childIndex(e);
      return o >= 0 && (e.parent.children[o] = t, t.parent = e.parent, e.parent = null), e;
    }, r.prototype.clone = function(t) {
      var e = this, o = new h.LiteElement(t.kind);
      return o.attributes = O({}, t.attributes), o.children = t.children.map(function(u) {
        if (u.kind === "#text")
          return new d.LiteText(u.value);
        if (u.kind === "#comment")
          return new d.LiteComment(u.value);
        var m = e.clone(u);
        return m.parent = o, m;
      }), o;
    }, r.prototype.split = function(t, e) {
      var o = new d.LiteText(t.value.slice(e));
      return t.value = t.value.slice(0, e), t.parent.children.splice(this.childIndex(t) + 1, 0, o), o.parent = t.parent, o;
    }, r.prototype.next = function(t) {
      var e = t.parent;
      if (!e)
        return null;
      var o = this.childIndex(t) + 1;
      return o >= 0 && o < e.children.length ? e.children[o] : null;
    }, r.prototype.previous = function(t) {
      var e = t.parent;
      if (!e)
        return null;
      var o = this.childIndex(t) - 1;
      return o >= 0 ? e.children[o] : null;
    }, r.prototype.firstChild = function(t) {
      return t.children[0];
    }, r.prototype.lastChild = function(t) {
      return t.children[t.children.length - 1];
    }, r.prototype.childNodes = function(t) {
      return s([], v(t.children), !1);
    }, r.prototype.childNode = function(t, e) {
      return t.children[e];
    }, r.prototype.kind = function(t) {
      return t.kind;
    }, r.prototype.value = function(t) {
      return t.kind === "#text" ? t.value : t.kind === "#comment" ? t.value.replace(/^<!(--)?((?:.|\n)*)\1>$/, "$2") : "";
    }, r.prototype.textContent = function(t) {
      var e = this;
      return t.children.reduce(function(o, u) {
        return o + (u.kind === "#text" ? u.value : u.kind === "#comment" ? "" : e.textContent(u));
      }, "");
    }, r.prototype.innerHTML = function(t) {
      return this.parser.serializeInner(this, t);
    }, r.prototype.outerHTML = function(t) {
      return this.parser.serialize(this, t);
    }, r.prototype.serializeXML = function(t) {
      return this.parser.serialize(this, t, !0);
    }, r.prototype.setAttribute = function(t, e, o, u) {
      u === void 0 && (u = null), typeof o != "string" && (o = String(o)), u && (e = u.replace(/.*\//, "") + ":" + e.replace(/^.*:/, "")), t.attributes[e] = o, e === "style" && (t.styles = null);
    }, r.prototype.getAttribute = function(t, e) {
      return t.attributes[e];
    }, r.prototype.removeAttribute = function(t, e) {
      delete t.attributes[e];
    }, r.prototype.hasAttribute = function(t, e) {
      return t.attributes.hasOwnProperty(e);
    }, r.prototype.allAttributes = function(t) {
      var e, o, u = t.attributes, m = [];
      try {
        for (var L = b(Object.keys(u)), C = L.next(); !C.done; C = L.next()) {
          var M = C.value;
          m.push({ name: M, value: u[M] });
        }
      } catch (x) {
        e = { error: x };
      } finally {
        try {
          C && !C.done && (o = L.return) && o.call(L);
        } finally {
          if (e) throw e.error;
        }
      }
      return m;
    }, r.prototype.addClass = function(t, e) {
      var o = (t.attributes.class || "").split(/ /);
      o.find(function(u) {
        return u === e;
      }) || (o.push(e), t.attributes.class = o.join(" "));
    }, r.prototype.removeClass = function(t, e) {
      var o = (t.attributes.class || "").split(/ /), u = o.findIndex(function(m) {
        return m === e;
      });
      u >= 0 && (o.splice(u, 1), t.attributes.class = o.join(" "));
    }, r.prototype.hasClass = function(t, e) {
      var o = (t.attributes.class || "").split(/ /);
      return !!o.find(function(u) {
        return u === e;
      });
    }, r.prototype.setStyle = function(t, e, o) {
      t.styles || (t.styles = new i.Styles(this.getAttribute(t, "style"))), t.styles.set(e, o), t.attributes.style = t.styles.cssText;
    }, r.prototype.getStyle = function(t, e) {
      if (!t.styles) {
        var o = this.getAttribute(t, "style");
        if (!o)
          return "";
        t.styles = new i.Styles(o);
      }
      return t.styles.get(e);
    }, r.prototype.allStyles = function(t) {
      return this.getAttribute(t, "style");
    }, r.prototype.insertRules = function(t, e) {
      t.children = [this.text(e.join(`

`) + `

` + this.textContent(t))];
    }, r.prototype.fontSize = function(t) {
      return 0;
    }, r.prototype.fontFamily = function(t) {
      return "";
    }, r.prototype.nodeSize = function(t, e, o) {
      return [0, 0];
    }, r.prototype.nodeBBox = function(t) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }, r;
  })(f.AbstractDOMAdaptor);
  w.LiteBase = a;
  var l = (function(c) {
    A(r, c);
    function r() {
      return c !== null && c.apply(this, arguments) || this;
    }
    return r;
  })((0, p.NodeMixin)(a));
  w.LiteAdaptor = l;
  function _(c) {
    return c === void 0 && (c = null), new l(null, c);
  }
  return w.liteAdaptor = _, w;
}
var Y = ut();
const lt = /* @__PURE__ */ R(Y), yt = /* @__PURE__ */ rt({
  __proto__: null,
  default: lt
}, [Y]);
export {
  yt as l
};
