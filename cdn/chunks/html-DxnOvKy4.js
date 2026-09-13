import { r as Lt, g as Et } from "./PrioritizedList-TjDg4i-s.js";
import { r as Dt } from "./mathjax-CnUrFnFS.js";
import { r as it } from "./Options-BStFr0zv.js";
import { r as Pt } from "./InputJax-BYq2tqUz.js";
import { a as Ht, c as kt, d as It, f as qt, h as Nt, e as Rt, b as Ct, k as Ft, l as Jt, m as Bt, g as $t, i as Xt, j as zt, n as Wt, w as Yt, v as Kt, o as Ut, p as Gt, q as Qt, s as Vt, t as Zt, u as te, y as ee, x as re, z as ne, r as ie } from "./TeXAtom-Bp5xoo7F.js";
import { r as ot } from "./MathItem-DD5NNBjZ.js";
import { b as oe, a as rt, f as jt, c as ae } from "./Factory--zguTNZ7.js";
function se(f, O) {
  for (var w = 0; w < O.length; w++) {
    const h = O[w];
    if (typeof h != "string" && !Array.isArray(h)) {
      for (const o in h)
        if (o !== "default" && !(o in f)) {
          const n = Object.getOwnPropertyDescriptor(h, o);
          n && Object.defineProperty(f, o, n.get ? n : {
            enumerable: !0,
            get: () => h[o]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(f, Symbol.toStringTag, { value: "Module" }));
}
var tt = {}, z = {}, W = {}, N = {}, Y = {}, R = {}, at;
function ue() {
  return at || (at = 1, (function(f) {
    var O = R && R.__generator || function(r, e) {
      var i = { label: 0, sent: function() {
        if (c[0] & 1) throw c[1];
        return c[1];
      }, trys: [], ops: [] }, y, u, c, p;
      return p = { next: _(0), throw: _(1), return: _(2) }, typeof Symbol == "function" && (p[Symbol.iterator] = function() {
        return this;
      }), p;
      function _(d) {
        return function(T) {
          return x([d, T]);
        };
      }
      function x(d) {
        if (y) throw new TypeError("Generator is already executing.");
        for (; i; ) try {
          if (y = 1, u && (c = d[0] & 2 ? u.return : d[0] ? u.throw || ((c = u.return) && c.call(u), 0) : u.next) && !(c = c.call(u, d[1])).done) return c;
          switch (u = 0, c && (d = [d[0] & 2, c.value]), d[0]) {
            case 0:
            case 1:
              c = d;
              break;
            case 4:
              return i.label++, { value: d[1], done: !1 };
            case 5:
              i.label++, u = d[1], d = [0];
              continue;
            case 7:
              d = i.ops.pop(), i.trys.pop();
              continue;
            default:
              if (c = i.trys, !(c = c.length > 0 && c[c.length - 1]) && (d[0] === 6 || d[0] === 2)) {
                i = 0;
                continue;
              }
              if (d[0] === 3 && (!c || d[1] > c[0] && d[1] < c[3])) {
                i.label = d[1];
                break;
              }
              if (d[0] === 6 && i.label < c[1]) {
                i.label = c[1], c = d;
                break;
              }
              if (c && i.label < c[2]) {
                i.label = c[2], i.ops.push(d);
                break;
              }
              c[2] && i.ops.pop(), i.trys.pop();
              continue;
          }
          d = e.call(r, i);
        } catch (T) {
          d = [6, T], u = 0;
        } finally {
          y = c = 0;
        }
        if (d[0] & 5) throw d[1];
        return { value: d[0] ? d[1] : void 0, done: !0 };
      }
    }, w = R && R.__read || function(r, e) {
      var i = typeof Symbol == "function" && r[Symbol.iterator];
      if (!i) return r;
      var y = i.call(r), u, c = [], p;
      try {
        for (; (e === void 0 || e-- > 0) && !(u = y.next()).done; ) c.push(u.value);
      } catch (_) {
        p = { error: _ };
      } finally {
        try {
          u && !u.done && (i = y.return) && i.call(y);
        } finally {
          if (p) throw p.error;
        }
      }
      return c;
    }, h = R && R.__spreadArray || function(r, e, i) {
      if (i || arguments.length === 2) for (var y = 0, u = e.length, c; y < u; y++)
        (c || !(y in e)) && (c || (c = Array.prototype.slice.call(e, 0, y)), c[y] = e[y]);
      return r.concat(c || Array.prototype.slice.call(e));
    }, o = R && R.__values || function(r) {
      var e = typeof Symbol == "function" && Symbol.iterator, i = e && r[e], y = 0;
      if (i) return i.call(r);
      if (r && typeof r.length == "number") return {
        next: function() {
          return r && y >= r.length && (r = void 0), { value: r && r[y++], done: !r };
        }
      };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(f, "__esModule", { value: !0 }), f.LinkedList = f.ListItem = f.END = void 0, f.END = /* @__PURE__ */ Symbol();
    var n = /* @__PURE__ */ (function() {
      function r(e) {
        e === void 0 && (e = null), this.next = null, this.prev = null, this.data = e;
      }
      return r;
    })();
    f.ListItem = n;
    var t = (function() {
      function r() {
        for (var e = [], i = 0; i < arguments.length; i++)
          e[i] = arguments[i];
        this.list = new n(f.END), this.list.next = this.list.prev = this.list, this.push.apply(this, h([], w(e), !1));
      }
      return r.prototype.isBefore = function(e, i) {
        return e < i;
      }, r.prototype.push = function() {
        for (var e, i, y = [], u = 0; u < arguments.length; u++)
          y[u] = arguments[u];
        try {
          for (var c = o(y), p = c.next(); !p.done; p = c.next()) {
            var _ = p.value, x = new n(_);
            x.next = this.list, x.prev = this.list.prev, this.list.prev = x, x.prev.next = x;
          }
        } catch (d) {
          e = { error: d };
        } finally {
          try {
            p && !p.done && (i = c.return) && i.call(c);
          } finally {
            if (e) throw e.error;
          }
        }
        return this;
      }, r.prototype.pop = function() {
        var e = this.list.prev;
        return e.data === f.END ? null : (this.list.prev = e.prev, e.prev.next = this.list, e.next = e.prev = null, e.data);
      }, r.prototype.unshift = function() {
        for (var e, i, y = [], u = 0; u < arguments.length; u++)
          y[u] = arguments[u];
        try {
          for (var c = o(y.slice(0).reverse()), p = c.next(); !p.done; p = c.next()) {
            var _ = p.value, x = new n(_);
            x.next = this.list.next, x.prev = this.list, this.list.next = x, x.next.prev = x;
          }
        } catch (d) {
          e = { error: d };
        } finally {
          try {
            p && !p.done && (i = c.return) && i.call(c);
          } finally {
            if (e) throw e.error;
          }
        }
        return this;
      }, r.prototype.shift = function() {
        var e = this.list.next;
        return e.data === f.END ? null : (this.list.next = e.next, e.next.prev = this.list, e.next = e.prev = null, e.data);
      }, r.prototype.remove = function() {
        for (var e, i, y = [], u = 0; u < arguments.length; u++)
          y[u] = arguments[u];
        var c = /* @__PURE__ */ new Map();
        try {
          for (var p = o(y), _ = p.next(); !_.done; _ = p.next()) {
            var x = _.value;
            c.set(x, !0);
          }
        } catch (L) {
          e = { error: L };
        } finally {
          try {
            _ && !_.done && (i = p.return) && i.call(p);
          } finally {
            if (e) throw e.error;
          }
        }
        for (var d = this.list.next; d.data !== f.END; ) {
          var T = d.next;
          c.has(d.data) && (d.prev.next = d.next, d.next.prev = d.prev, d.next = d.prev = null), d = T;
        }
      }, r.prototype.clear = function() {
        return this.list.next.prev = this.list.prev.next = null, this.list.next = this.list.prev = this.list, this;
      }, r.prototype[Symbol.iterator] = function() {
        var e;
        return O(this, function(i) {
          switch (i.label) {
            case 0:
              e = this.list.next, i.label = 1;
            case 1:
              return e.data === f.END ? [3, 3] : [4, e.data];
            case 2:
              return i.sent(), e = e.next, [3, 1];
            case 3:
              return [2];
          }
        });
      }, r.prototype.reversed = function() {
        var e;
        return O(this, function(i) {
          switch (i.label) {
            case 0:
              e = this.list.prev, i.label = 1;
            case 1:
              return e.data === f.END ? [3, 3] : [4, e.data];
            case 2:
              return i.sent(), e = e.prev, [3, 1];
            case 3:
              return [2];
          }
        });
      }, r.prototype.insert = function(e, i) {
        i === void 0 && (i = null), i === null && (i = this.isBefore.bind(this));
        for (var y = new n(e), u = this.list.next; u.data !== f.END && i(u.data, y.data); )
          u = u.next;
        return y.prev = u.prev, y.next = u, u.prev.next = u.prev = y, this;
      }, r.prototype.sort = function(e) {
        var i, y;
        e === void 0 && (e = null), e === null && (e = this.isBefore.bind(this));
        var u = [];
        try {
          for (var c = o(this), p = c.next(); !p.done; p = c.next()) {
            var _ = p.value;
            u.push(new r(_));
          }
        } catch (T) {
          i = { error: T };
        } finally {
          try {
            p && !p.done && (y = c.return) && y.call(c);
          } finally {
            if (i) throw i.error;
          }
        }
        for (this.list.next = this.list.prev = this.list; u.length > 1; ) {
          var x = u.shift(), d = u.shift();
          x.merge(d, e), u.push(x);
        }
        return u.length && (this.list = u[0].list), this;
      }, r.prototype.merge = function(e, i) {
        var y, u, c, p, _;
        i === void 0 && (i = null), i === null && (i = this.isBefore.bind(this));
        for (var x = this.list.next, d = e.list.next; x.data !== f.END && d.data !== f.END; )
          i(d.data, x.data) ? (y = w([x, d], 2), d.prev.next = y[0], x.prev.next = y[1], u = w([x.prev, d.prev], 2), d.prev = u[0], x.prev = u[1], c = w([e.list, this.list], 2), this.list.prev.next = c[0], e.list.prev.next = c[1], p = w([e.list.prev, this.list.prev], 2), this.list.prev = p[0], e.list.prev = p[1], _ = w([d.next, x], 2), x = _[0], d = _[1]) : x = x.next;
        return d.data !== f.END && (this.list.prev.next = e.list.next, e.list.next.prev = this.list.prev, e.list.prev.next = this.list, this.list.prev = e.list.prev, e.list.next = e.list.prev = e.list), this;
      }, r;
    })();
    f.LinkedList = t;
  })(R)), R;
}
var st;
function St() {
  if (st) return Y;
  st = 1;
  var f = Y && Y.__extends || /* @__PURE__ */ (function() {
    var h = function(o, n) {
      return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, r) {
        t.__proto__ = r;
      } || function(t, r) {
        for (var e in r) Object.prototype.hasOwnProperty.call(r, e) && (t[e] = r[e]);
      }, h(o, n);
    };
    return function(o, n) {
      if (typeof n != "function" && n !== null)
        throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
      h(o, n);
      function t() {
        this.constructor = o;
      }
      o.prototype = n === null ? Object.create(n) : (t.prototype = n.prototype, new t());
    };
  })();
  Object.defineProperty(Y, "__esModule", { value: !0 }), Y.AbstractMathList = void 0;
  var O = ue(), w = (function(h) {
    f(o, h);
    function o() {
      return h !== null && h.apply(this, arguments) || this;
    }
    return o.prototype.isBefore = function(n, t) {
      return n.start.i < t.start.i || n.start.i === t.start.i && n.start.n < t.start.n;
    }, o;
  })(O.LinkedList);
  return Y.AbstractMathList = w, Y;
}
var K = {}, U = {}, ut;
function le() {
  if (ut) return U;
  ut = 1;
  var f = U && U.__extends || /* @__PURE__ */ (function() {
    var h = function(o, n) {
      return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, r) {
        t.__proto__ = r;
      } || function(t, r) {
        for (var e in r) Object.prototype.hasOwnProperty.call(r, e) && (t[e] = r[e]);
      }, h(o, n);
    };
    return function(o, n) {
      if (typeof n != "function" && n !== null)
        throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
      h(o, n);
      function t() {
        this.constructor = o;
      }
      o.prototype = n === null ? Object.create(n) : (t.prototype = n.prototype, new t());
    };
  })();
  Object.defineProperty(U, "__esModule", { value: !0 }), U.AbstractNodeFactory = void 0;
  var O = oe(), w = (function(h) {
    f(o, h);
    function o() {
      return h !== null && h.apply(this, arguments) || this;
    }
    return o.prototype.create = function(n, t, r) {
      return t === void 0 && (t = {}), r === void 0 && (r = []), this.node[n](t, r);
    }, o;
  })(O.AbstractFactory);
  return U.AbstractNodeFactory = w, U;
}
var et = {}, F = {}, lt;
function ce() {
  if (lt) return F;
  lt = 1;
  var f = F && F.__extends || /* @__PURE__ */ (function() {
    var n = function(t, r) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, i) {
        e.__proto__ = i;
      } || function(e, i) {
        for (var y in i) Object.prototype.hasOwnProperty.call(i, y) && (e[y] = i[y]);
      }, n(t, r);
    };
    return function(t, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      n(t, r);
      function e() {
        this.constructor = t;
      }
      t.prototype = r === null ? Object.create(r) : (e.prototype = r.prototype, new e());
    };
  })(), O = F && F.__assign || function() {
    return O = Object.assign || function(n) {
      for (var t, r = 1, e = arguments.length; r < e; r++) {
        t = arguments[r];
        for (var i in t) Object.prototype.hasOwnProperty.call(t, i) && (n[i] = t[i]);
      }
      return n;
    }, O.apply(this, arguments);
  };
  Object.defineProperty(F, "__esModule", { value: !0 }), F.MmlMstyle = void 0;
  var w = rt(), h = jt(), o = (function(n) {
    f(t, n);
    function t() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "mstyle";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "notParent", {
      get: function() {
        return this.childNodes[0] && this.childNodes[0].childNodes.length === 1;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setChildInheritedAttributes = function(r, e, i, y) {
      var u = this.attributes.getExplicit("scriptlevel");
      u != null && (u = u.toString(), u.match(/^\s*[-+]/) ? i += parseInt(u) : i = parseInt(u), y = !1);
      var c = this.attributes.getExplicit("displaystyle");
      c != null && (e = c === !0, y = !1);
      var p = this.attributes.getExplicit("data-cramped");
      p != null && (y = p), r = this.addInheritedAttributes(r, this.attributes.getAllAttributes()), this.childNodes[0].setInheritedAttributes(r, e, i, y);
    }, t.defaults = O(O({}, w.AbstractMmlLayoutNode.defaults), { scriptlevel: h.INHERIT, displaystyle: h.INHERIT, scriptsizemultiplier: 1 / Math.sqrt(2), scriptminsize: "8px", mathbackground: h.INHERIT, mathcolor: h.INHERIT, dir: h.INHERIT, infixlinebreakstyle: "before" }), t;
  })(w.AbstractMmlLayoutNode);
  return F.MmlMstyle = o, F;
}
var J = {}, ct;
function fe() {
  if (ct) return J;
  ct = 1;
  var f = J && J.__extends || /* @__PURE__ */ (function() {
    var n = function(t, r) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, i) {
        e.__proto__ = i;
      } || function(e, i) {
        for (var y in i) Object.prototype.hasOwnProperty.call(i, y) && (e[y] = i[y]);
      }, n(t, r);
    };
    return function(t, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      n(t, r);
      function e() {
        this.constructor = t;
      }
      t.prototype = r === null ? Object.create(r) : (e.prototype = r.prototype, new e());
    };
  })(), O = J && J.__assign || function() {
    return O = Object.assign || function(n) {
      for (var t, r = 1, e = arguments.length; r < e; r++) {
        t = arguments[r];
        for (var i in t) Object.prototype.hasOwnProperty.call(t, i) && (n[i] = t[i]);
      }
      return n;
    }, O.apply(this, arguments);
  };
  Object.defineProperty(J, "__esModule", { value: !0 }), J.MmlMaligngroup = void 0;
  var w = rt(), h = jt(), o = (function(n) {
    f(t, n);
    function t() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(t.prototype, "kind", {
      get: function() {
        return "maligngroup";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(t.prototype, "isSpacelike", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setChildInheritedAttributes = function(r, e, i, y) {
      r = this.addInheritedAttributes(r, this.attributes.getAllAttributes()), n.prototype.setChildInheritedAttributes.call(this, r, e, i, y);
    }, t.defaults = O(O({}, w.AbstractMmlLayoutNode.defaults), { groupalign: h.INHERIT }), t;
  })(w.AbstractMmlLayoutNode);
  return J.MmlMaligngroup = o, J;
}
var B = {}, ft;
function pe() {
  if (ft) return B;
  ft = 1;
  var f = B && B.__extends || /* @__PURE__ */ (function() {
    var o = function(n, t) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, e) {
        r.__proto__ = e;
      } || function(r, e) {
        for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
      }, o(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      o(n, t);
      function r() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
    };
  })(), O = B && B.__assign || function() {
    return O = Object.assign || function(o) {
      for (var n, t = 1, r = arguments.length; t < r; t++) {
        n = arguments[t];
        for (var e in n) Object.prototype.hasOwnProperty.call(n, e) && (o[e] = n[e]);
      }
      return o;
    }, O.apply(this, arguments);
  };
  Object.defineProperty(B, "__esModule", { value: !0 }), B.MmlMalignmark = void 0;
  var w = rt(), h = (function(o) {
    f(n, o);
    function n() {
      return o !== null && o.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "malignmark";
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
    }), n.defaults = O(O({}, w.AbstractMmlNode.defaults), { edge: "left" }), n;
  })(w.AbstractMmlNode);
  return B.MmlMalignmark = h, B;
}
var $ = {}, pt;
function he() {
  if (pt) return $;
  pt = 1;
  var f = $ && $.__extends || /* @__PURE__ */ (function() {
    var o = function(n, t) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, e) {
        r.__proto__ = e;
      } || function(r, e) {
        for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
      }, o(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      o(n, t);
      function r() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
    };
  })(), O = $ && $.__assign || function() {
    return O = Object.assign || function(o) {
      for (var n, t = 1, r = arguments.length; t < r; t++) {
        n = arguments[t];
        for (var e in n) Object.prototype.hasOwnProperty.call(n, e) && (o[e] = n[e]);
      }
      return o;
    }, O.apply(this, arguments);
  };
  Object.defineProperty($, "__esModule", { value: !0 }), $.MathChoice = void 0;
  var w = rt(), h = (function(o) {
    f(n, o);
    function n() {
      return o !== null && o.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "MathChoice";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "arity", {
      get: function() {
        return 4;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "notParent", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.setInheritedAttributes = function(t, r, e, i) {
      var y = r ? 0 : Math.max(0, Math.min(e, 2)) + 1, u = this.childNodes[y] || this.factory.create("mrow");
      this.parent.replaceChild(u, this), u.setInheritedAttributes(t, r, e, i);
    }, n.defaults = O({}, w.AbstractMmlBaseNode.defaults), n;
  })(w.AbstractMmlBaseNode);
  return $.MathChoice = h, $;
}
var ht;
function de() {
  if (ht) return et;
  ht = 1;
  var f;
  Object.defineProperty(et, "__esModule", { value: !0 }), et.MML = void 0;
  var O = rt(), w = Ht(), h = kt(), o = It(), n = ae(), t = qt(), r = Nt(), e = Rt(), i = Ct(), y = Ft(), u = Jt(), c = Bt(), p = ce(), _ = $t(), x = Xt(), d = zt(), T = Wt(), L = Yt(), v = Kt(), a = Ut(), l = Gt(), s = Qt(), m = Vt(), M = Zt(), g = te(), j = fe(), S = pe(), A = ee(), b = re(), D = ne(), E = he();
  return et.MML = (f = {}, f[w.MmlMath.prototype.kind] = w.MmlMath, f[h.MmlMi.prototype.kind] = h.MmlMi, f[o.MmlMn.prototype.kind] = o.MmlMn, f[n.MmlMo.prototype.kind] = n.MmlMo, f[t.MmlMtext.prototype.kind] = t.MmlMtext, f[r.MmlMspace.prototype.kind] = r.MmlMspace, f[e.MmlMs.prototype.kind] = e.MmlMs, f[i.MmlMrow.prototype.kind] = i.MmlMrow, f[i.MmlInferredMrow.prototype.kind] = i.MmlInferredMrow, f[y.MmlMfrac.prototype.kind] = y.MmlMfrac, f[u.MmlMsqrt.prototype.kind] = u.MmlMsqrt, f[c.MmlMroot.prototype.kind] = c.MmlMroot, f[p.MmlMstyle.prototype.kind] = p.MmlMstyle, f[_.MmlMerror.prototype.kind] = _.MmlMerror, f[x.MmlMpadded.prototype.kind] = x.MmlMpadded, f[d.MmlMphantom.prototype.kind] = d.MmlMphantom, f[T.MmlMfenced.prototype.kind] = T.MmlMfenced, f[L.MmlMenclose.prototype.kind] = L.MmlMenclose, f[v.MmlMaction.prototype.kind] = v.MmlMaction, f[a.MmlMsub.prototype.kind] = a.MmlMsub, f[a.MmlMsup.prototype.kind] = a.MmlMsup, f[a.MmlMsubsup.prototype.kind] = a.MmlMsubsup, f[l.MmlMunder.prototype.kind] = l.MmlMunder, f[l.MmlMover.prototype.kind] = l.MmlMover, f[l.MmlMunderover.prototype.kind] = l.MmlMunderover, f[s.MmlMmultiscripts.prototype.kind] = s.MmlMmultiscripts, f[s.MmlMprescripts.prototype.kind] = s.MmlMprescripts, f[s.MmlNone.prototype.kind] = s.MmlNone, f[m.MmlMtable.prototype.kind] = m.MmlMtable, f[M.MmlMlabeledtr.prototype.kind] = M.MmlMlabeledtr, f[M.MmlMtr.prototype.kind] = M.MmlMtr, f[g.MmlMtd.prototype.kind] = g.MmlMtd, f[j.MmlMaligngroup.prototype.kind] = j.MmlMaligngroup, f[S.MmlMalignmark.prototype.kind] = S.MmlMalignmark, f[A.MmlMglyph.prototype.kind] = A.MmlMglyph, f[b.MmlSemantics.prototype.kind] = b.MmlSemantics, f[b.MmlAnnotation.prototype.kind] = b.MmlAnnotation, f[b.MmlAnnotationXML.prototype.kind] = b.MmlAnnotationXML, f[D.TeXAtom.prototype.kind] = D.TeXAtom, f[E.MathChoice.prototype.kind] = E.MathChoice, f[O.TextNode.prototype.kind] = O.TextNode, f[O.XMLNode.prototype.kind] = O.XMLNode, f), et;
}
var dt;
function ye() {
  if (dt) return K;
  dt = 1;
  var f = K && K.__extends || /* @__PURE__ */ (function() {
    var o = function(n, t) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, e) {
        r.__proto__ = e;
      } || function(r, e) {
        for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
      }, o(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      o(n, t);
      function r() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
    };
  })();
  Object.defineProperty(K, "__esModule", { value: !0 }), K.MmlFactory = void 0;
  var O = le(), w = de(), h = (function(o) {
    f(n, o);
    function n() {
      return o !== null && o.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "MML", {
      get: function() {
        return this.node;
      },
      enumerable: !1,
      configurable: !0
    }), n.defaultNodes = w.MML, n;
  })(O.AbstractNodeFactory);
  return K.MmlFactory = h, K;
}
var H = {}, yt;
function ve() {
  if (yt) return H;
  yt = 1;
  var f = H && H.__extends || /* @__PURE__ */ (function() {
    var t = function(r, e) {
      return t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(i, y) {
        i.__proto__ = y;
      } || function(i, y) {
        for (var u in y) Object.prototype.hasOwnProperty.call(y, u) && (i[u] = y[u]);
      }, t(r, e);
    };
    return function(r, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      t(r, e);
      function i() {
        this.constructor = r;
      }
      r.prototype = e === null ? Object.create(e) : (i.prototype = e.prototype, new i());
    };
  })(), O = H && H.__values || function(t) {
    var r = typeof Symbol == "function" && Symbol.iterator, e = r && t[r], i = 0;
    if (e) return e.call(t);
    if (t && typeof t.length == "number") return {
      next: function() {
        return t && i >= t.length && (t = void 0), { value: t && t[i++], done: !t };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, w = H && H.__read || function(t, r) {
    var e = typeof Symbol == "function" && t[Symbol.iterator];
    if (!e) return t;
    var i = e.call(t), y, u = [], c;
    try {
      for (; (r === void 0 || r-- > 0) && !(y = i.next()).done; ) u.push(y.value);
    } catch (p) {
      c = { error: p };
    } finally {
      try {
        y && !y.done && (e = i.return) && e.call(i);
      } finally {
        if (c) throw c.error;
      }
    }
    return u;
  }, h = H && H.__spreadArray || function(t, r, e) {
    if (e || arguments.length === 2) for (var i = 0, y = r.length, u; i < y; i++)
      (u || !(i in r)) && (u || (u = Array.prototype.slice.call(r, 0, i)), u[i] = r[i]);
    return t.concat(u || Array.prototype.slice.call(r));
  };
  Object.defineProperty(H, "__esModule", { value: !0 }), H.BitFieldClass = H.BitField = void 0;
  var o = (function() {
    function t() {
      this.bits = 0;
    }
    return t.allocate = function() {
      for (var r, e, i = [], y = 0; y < arguments.length; y++)
        i[y] = arguments[y];
      try {
        for (var u = O(i), c = u.next(); !c.done; c = u.next()) {
          var p = c.value;
          if (this.has(p))
            throw new Error("Bit already allocated for " + p);
          if (this.next === t.MAXBIT)
            throw new Error("Maximum number of bits already allocated");
          this.names.set(p, this.next), this.next <<= 1;
        }
      } catch (_) {
        r = { error: _ };
      } finally {
        try {
          c && !c.done && (e = u.return) && e.call(u);
        } finally {
          if (r) throw r.error;
        }
      }
    }, t.has = function(r) {
      return this.names.has(r);
    }, t.prototype.set = function(r) {
      this.bits |= this.getBit(r);
    }, t.prototype.clear = function(r) {
      this.bits &= ~this.getBit(r);
    }, t.prototype.isSet = function(r) {
      return !!(this.bits & this.getBit(r));
    }, t.prototype.reset = function() {
      this.bits = 0;
    }, t.prototype.getBit = function(r) {
      var e = this.constructor.names.get(r);
      if (!e)
        throw new Error("Unknown bit-field name: " + r);
      return e;
    }, t.MAXBIT = 1 << 31, t.next = 1, t.names = /* @__PURE__ */ new Map(), t;
  })();
  H.BitField = o;
  function n() {
    for (var t = [], r = 0; r < arguments.length; r++)
      t[r] = arguments[r];
    var e = (function(i) {
      f(y, i);
      function y() {
        return i !== null && i.apply(this, arguments) || this;
      }
      return y;
    })(o);
    return e.allocate.apply(e, h([], w(t), !1)), e;
  }
  return H.BitFieldClass = n, H;
}
var vt;
function Tt() {
  return vt || (vt = 1, (function(f) {
    var O = N && N.__extends || /* @__PURE__ */ (function() {
      var v = function(a, l) {
        return v = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(s, m) {
          s.__proto__ = m;
        } || function(s, m) {
          for (var M in m) Object.prototype.hasOwnProperty.call(m, M) && (s[M] = m[M]);
        }, v(a, l);
      };
      return function(a, l) {
        if (typeof l != "function" && l !== null)
          throw new TypeError("Class extends value " + String(l) + " is not a constructor or null");
        v(a, l);
        function s() {
          this.constructor = a;
        }
        a.prototype = l === null ? Object.create(l) : (s.prototype = l.prototype, new s());
      };
    })(), w = N && N.__values || function(v) {
      var a = typeof Symbol == "function" && Symbol.iterator, l = a && v[a], s = 0;
      if (l) return l.call(v);
      if (v && typeof v.length == "number") return {
        next: function() {
          return v && s >= v.length && (v = void 0), { value: v && v[s++], done: !v };
        }
      };
      throw new TypeError(a ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, h = N && N.__read || function(v, a) {
      var l = typeof Symbol == "function" && v[Symbol.iterator];
      if (!l) return v;
      var s = l.call(v), m, M = [], g;
      try {
        for (; (a === void 0 || a-- > 0) && !(m = s.next()).done; ) M.push(m.value);
      } catch (j) {
        g = { error: j };
      } finally {
        try {
          m && !m.done && (l = s.return) && l.call(s);
        } finally {
          if (g) throw g.error;
        }
      }
      return M;
    }, o = N && N.__spreadArray || function(v, a, l) {
      if (l || arguments.length === 2) for (var s = 0, m = a.length, M; s < m; s++)
        (M || !(s in a)) && (M || (M = Array.prototype.slice.call(a, 0, s)), M[s] = a[s]);
      return v.concat(M || Array.prototype.slice.call(a));
    };
    Object.defineProperty(f, "__esModule", { value: !0 }), f.AbstractMathDocument = f.resetAllOptions = f.resetOptions = f.RenderList = void 0;
    var n = it(), t = Pt(), r = ie(), e = St(), i = ot(), y = ye(), u = ve(), c = Lt(), p = (function(v) {
      O(a, v);
      function a() {
        return v !== null && v.apply(this, arguments) || this;
      }
      return a.create = function(l) {
        var s, m, M = new this();
        try {
          for (var g = w(Object.keys(l)), j = g.next(); !j.done; j = g.next()) {
            var S = j.value, A = h(this.action(S, l[S]), 2), b = A[0], D = A[1];
            D && M.add(b, D);
          }
        } catch (E) {
          s = { error: E };
        } finally {
          try {
            j && !j.done && (m = g.return) && m.call(g);
          } finally {
            if (s) throw s.error;
          }
        }
        return M;
      }, a.action = function(l, s) {
        var m, M, g, j, S, A, b = !0, D = s[0];
        if (s.length === 1 || typeof s[1] == "boolean")
          s.length === 2 && (b = s[1]), m = h(this.methodActions(l), 2), S = m[0], A = m[1];
        else if (typeof s[1] == "string")
          if (typeof s[2] == "string") {
            s.length === 4 && (b = s[3]);
            var E = h(s.slice(1), 2), k = E[0], P = E[1];
            M = h(this.methodActions(k, P), 2), S = M[0], A = M[1];
          } else
            s.length === 3 && (b = s[2]), g = h(this.methodActions(s[1]), 2), S = g[0], A = g[1];
        else
          s.length === 4 && (b = s[3]), j = h(s.slice(1), 2), S = j[0], A = j[1];
        return [{ id: l, renderDoc: S, renderMath: A, convert: b }, D];
      }, a.methodActions = function(l, s) {
        return s === void 0 && (s = l), [
          function(m) {
            return l && m[l](), !1;
          },
          function(m, M) {
            return s && m[s](M), !1;
          }
        ];
      }, a.prototype.renderDoc = function(l, s) {
        var m, M;
        s === void 0 && (s = i.STATE.UNPROCESSED);
        try {
          for (var g = w(this.items), j = g.next(); !j.done; j = g.next()) {
            var S = j.value;
            if (S.priority >= s && S.item.renderDoc(l))
              return;
          }
        } catch (A) {
          m = { error: A };
        } finally {
          try {
            j && !j.done && (M = g.return) && M.call(g);
          } finally {
            if (m) throw m.error;
          }
        }
      }, a.prototype.renderMath = function(l, s, m) {
        var M, g;
        m === void 0 && (m = i.STATE.UNPROCESSED);
        try {
          for (var j = w(this.items), S = j.next(); !S.done; S = j.next()) {
            var A = S.value;
            if (A.priority >= m && A.item.renderMath(l, s))
              return;
          }
        } catch (b) {
          M = { error: b };
        } finally {
          try {
            S && !S.done && (g = j.return) && g.call(j);
          } finally {
            if (M) throw M.error;
          }
        }
      }, a.prototype.renderConvert = function(l, s, m) {
        var M, g;
        m === void 0 && (m = i.STATE.LAST);
        try {
          for (var j = w(this.items), S = j.next(); !S.done; S = j.next()) {
            var A = S.value;
            if (A.priority > m || A.item.convert && A.item.renderMath(l, s))
              return;
          }
        } catch (b) {
          M = { error: b };
        } finally {
          try {
            S && !S.done && (g = j.return) && g.call(j);
          } finally {
            if (M) throw M.error;
          }
        }
      }, a.prototype.findID = function(l) {
        var s, m;
        try {
          for (var M = w(this.items), g = M.next(); !g.done; g = M.next()) {
            var j = g.value;
            if (j.item.id === l)
              return j.item;
          }
        } catch (S) {
          s = { error: S };
        } finally {
          try {
            g && !g.done && (m = M.return) && m.call(M);
          } finally {
            if (s) throw s.error;
          }
        }
        return null;
      }, a;
    })(c.PrioritizedList);
    f.RenderList = p, f.resetOptions = {
      all: !1,
      processed: !1,
      inputJax: null,
      outputJax: null
    }, f.resetAllOptions = {
      all: !0,
      processed: !0,
      inputJax: [],
      outputJax: []
    };
    var _ = (function(v) {
      O(a, v);
      function a() {
        return v !== null && v.apply(this, arguments) || this;
      }
      return a.prototype.compile = function(l) {
        return null;
      }, a;
    })(t.AbstractInputJax), x = (function(v) {
      O(a, v);
      function a() {
        return v !== null && v.apply(this, arguments) || this;
      }
      return a.prototype.typeset = function(l, s) {
        return null;
      }, a.prototype.escaped = function(l, s) {
        return null;
      }, a;
    })(r.AbstractOutputJax), d = (function(v) {
      O(a, v);
      function a() {
        return v !== null && v.apply(this, arguments) || this;
      }
      return a;
    })(e.AbstractMathList), T = (function(v) {
      O(a, v);
      function a() {
        return v !== null && v.apply(this, arguments) || this;
      }
      return a;
    })(i.AbstractMathItem), L = (function() {
      function v(a, l, s) {
        var m = this, M = this.constructor;
        this.document = a, this.options = (0, n.userOptions)((0, n.defaultOptions)({}, M.OPTIONS), s), this.math = new (this.options.MathList || d)(), this.renderActions = p.create(this.options.renderActions), this.processed = new v.ProcessBits(), this.outputJax = this.options.OutputJax || new x();
        var g = this.options.InputJax || [new _()];
        Array.isArray(g) || (g = [g]), this.inputJax = g, this.adaptor = l, this.outputJax.setAdaptor(l), this.inputJax.map(function(j) {
          return j.setAdaptor(l);
        }), this.mmlFactory = this.options.MmlFactory || new y.MmlFactory(), this.inputJax.map(function(j) {
          return j.setMmlFactory(m.mmlFactory);
        }), this.outputJax.initialize(), this.inputJax.map(function(j) {
          return j.initialize();
        });
      }
      return Object.defineProperty(v.prototype, "kind", {
        get: function() {
          return this.constructor.KIND;
        },
        enumerable: !1,
        configurable: !0
      }), v.prototype.addRenderAction = function(a) {
        for (var l = [], s = 1; s < arguments.length; s++)
          l[s - 1] = arguments[s];
        var m = h(p.action(a, l), 2), M = m[0], g = m[1];
        this.renderActions.add(M, g);
      }, v.prototype.removeRenderAction = function(a) {
        var l = this.renderActions.findID(a);
        l && this.renderActions.remove(l);
      }, v.prototype.render = function() {
        return this.renderActions.renderDoc(this), this;
      }, v.prototype.rerender = function(a) {
        return a === void 0 && (a = i.STATE.RERENDER), this.state(a - 1), this.render(), this;
      }, v.prototype.convert = function(a, l) {
        l === void 0 && (l = {});
        var s = (0, n.userOptions)({
          format: this.inputJax[0].name,
          display: !0,
          end: i.STATE.LAST,
          em: 16,
          ex: 8,
          containerWidth: null,
          lineWidth: 1e6,
          scale: 1,
          family: ""
        }, l), m = s.format, M = s.display, g = s.end, j = s.ex, S = s.em, A = s.containerWidth, b = s.lineWidth, D = s.scale, E = s.family;
        A === null && (A = 80 * j);
        var k = this.inputJax.reduce(function(q, C) {
          return C.name === m ? C : q;
        }, null), P = new this.options.MathItem(a, k, M);
        return P.start.node = this.adaptor.body(this.document), P.setMetrics(S, j, A, b, D), this.outputJax.options.mtextInheritFont && (P.outputData.mtextFamily = E), this.outputJax.options.merrorInheritFont && (P.outputData.merrorFamily = E), P.convert(this, g), P.typesetRoot || P.root;
      }, v.prototype.findMath = function(a) {
        return this.processed.set("findMath"), this;
      }, v.prototype.compile = function() {
        var a, l, s, m;
        if (!this.processed.isSet("compile")) {
          var M = [];
          try {
            for (var g = w(this.math), j = g.next(); !j.done; j = g.next()) {
              var S = j.value;
              this.compileMath(S), S.inputData.recompile !== void 0 && M.push(S);
            }
          } catch (E) {
            a = { error: E };
          } finally {
            try {
              j && !j.done && (l = g.return) && l.call(g);
            } finally {
              if (a) throw a.error;
            }
          }
          try {
            for (var A = w(M), b = A.next(); !b.done; b = A.next()) {
              var S = b.value, D = S.inputData.recompile;
              S.state(D.state), S.inputData.recompile = D, this.compileMath(S);
            }
          } catch (E) {
            s = { error: E };
          } finally {
            try {
              b && !b.done && (m = A.return) && m.call(A);
            } finally {
              if (s) throw s.error;
            }
          }
          this.processed.set("compile");
        }
        return this;
      }, v.prototype.compileMath = function(a) {
        try {
          a.compile(this);
        } catch (l) {
          if (l.retry || l.restart)
            throw l;
          this.options.compileError(this, a, l), a.inputData.error = l;
        }
      }, v.prototype.compileError = function(a, l) {
        a.root = this.mmlFactory.create("math", null, [
          this.mmlFactory.create("merror", { "data-mjx-error": l.message, title: l.message }, [
            this.mmlFactory.create("mtext", null, [
              this.mmlFactory.create("text").setText("Math input error")
            ])
          ])
        ]), a.display && a.root.attributes.set("display", "block"), a.inputData.error = l.message;
      }, v.prototype.typeset = function() {
        var a, l;
        if (!this.processed.isSet("typeset")) {
          try {
            for (var s = w(this.math), m = s.next(); !m.done; m = s.next()) {
              var M = m.value;
              try {
                M.typeset(this);
              } catch (g) {
                if (g.retry || g.restart)
                  throw g;
                this.options.typesetError(this, M, g), M.outputData.error = g;
              }
            }
          } catch (g) {
            a = { error: g };
          } finally {
            try {
              m && !m.done && (l = s.return) && l.call(s);
            } finally {
              if (a) throw a.error;
            }
          }
          this.processed.set("typeset");
        }
        return this;
      }, v.prototype.typesetError = function(a, l) {
        a.typesetRoot = this.adaptor.node("mjx-container", {
          class: "MathJax mjx-output-error",
          jax: this.outputJax.name
        }, [
          this.adaptor.node("span", {
            "data-mjx-error": l.message,
            title: l.message,
            style: {
              color: "red",
              "background-color": "yellow",
              "line-height": "normal"
            }
          }, [
            this.adaptor.text("Math output error")
          ])
        ]), a.display && this.adaptor.setAttributes(a.typesetRoot, {
          style: {
            display: "block",
            margin: "1em 0",
            "text-align": "center"
          }
        }), a.outputData.error = l.message;
      }, v.prototype.getMetrics = function() {
        return this.processed.isSet("getMetrics") || (this.outputJax.getMetrics(this), this.processed.set("getMetrics")), this;
      }, v.prototype.updateDocument = function() {
        var a, l;
        if (!this.processed.isSet("updateDocument")) {
          try {
            for (var s = w(this.math.reversed()), m = s.next(); !m.done; m = s.next()) {
              var M = m.value;
              M.updateDocument(this);
            }
          } catch (g) {
            a = { error: g };
          } finally {
            try {
              m && !m.done && (l = s.return) && l.call(s);
            } finally {
              if (a) throw a.error;
            }
          }
          this.processed.set("updateDocument");
        }
        return this;
      }, v.prototype.removeFromDocument = function(a) {
        return this;
      }, v.prototype.state = function(a, l) {
        var s, m;
        l === void 0 && (l = !1);
        try {
          for (var M = w(this.math), g = M.next(); !g.done; g = M.next()) {
            var j = g.value;
            j.state(a, l);
          }
        } catch (S) {
          s = { error: S };
        } finally {
          try {
            g && !g.done && (m = M.return) && m.call(M);
          } finally {
            if (s) throw s.error;
          }
        }
        return a < i.STATE.INSERTED && this.processed.clear("updateDocument"), a < i.STATE.TYPESET && (this.processed.clear("typeset"), this.processed.clear("getMetrics")), a < i.STATE.COMPILED && this.processed.clear("compile"), this;
      }, v.prototype.reset = function(a) {
        var l;
        return a === void 0 && (a = { processed: !0 }), a = (0, n.userOptions)(Object.assign({}, f.resetOptions), a), a.all && Object.assign(a, f.resetAllOptions), a.processed && this.processed.reset(), a.inputJax && this.inputJax.forEach(function(s) {
          return s.reset.apply(s, o([], h(a.inputJax), !1));
        }), a.outputJax && (l = this.outputJax).reset.apply(l, o([], h(a.outputJax), !1)), this;
      }, v.prototype.clear = function() {
        return this.reset(), this.math.clear(), this;
      }, v.prototype.concat = function(a) {
        return this.math.merge(a), this;
      }, v.prototype.clearMathItemsWithin = function(a) {
        var l, s = this.getMathItemsWithin(a);
        return (l = this.math).remove.apply(l, o([], h(s), !1)), s;
      }, v.prototype.getMathItemsWithin = function(a) {
        var l, s, m, M;
        Array.isArray(a) || (a = [a]);
        var g = this.adaptor, j = [], S = g.getElements(a, this.document);
        try {
          t: for (var A = w(this.math), b = A.next(); !b.done; b = A.next()) {
            var D = b.value;
            try {
              for (var E = (m = void 0, w(S)), k = E.next(); !k.done; k = E.next()) {
                var P = k.value;
                if (D.start.node && g.contains(P, D.start.node)) {
                  j.push(D);
                  continue t;
                }
              }
            } catch (q) {
              m = { error: q };
            } finally {
              try {
                k && !k.done && (M = E.return) && M.call(E);
              } finally {
                if (m) throw m.error;
              }
            }
          }
        } catch (q) {
          l = { error: q };
        } finally {
          try {
            b && !b.done && (s = A.return) && s.call(A);
          } finally {
            if (l) throw l.error;
          }
        }
        return j;
      }, v.KIND = "MathDocument", v.OPTIONS = {
        OutputJax: null,
        InputJax: null,
        MmlFactory: null,
        MathList: d,
        MathItem: T,
        compileError: function(a, l, s) {
          a.compileError(l, s);
        },
        typesetError: function(a, l, s) {
          a.typesetError(l, s);
        },
        renderActions: (0, n.expandable)({
          find: [i.STATE.FINDMATH, "findMath", "", !1],
          compile: [i.STATE.COMPILED],
          metrics: [i.STATE.METRICS, "getMetrics", "", !1],
          typeset: [i.STATE.TYPESET],
          update: [i.STATE.INSERTED, "updateDocument", !1]
        })
      }, v.ProcessBits = (0, u.BitFieldClass)("findMath", "compile", "getMetrics", "typeset", "updateDocument"), v;
    })();
    f.AbstractMathDocument = L;
  })(N)), N;
}
var mt;
function me() {
  if (mt) return W;
  mt = 1;
  var f = W && W.__extends || /* @__PURE__ */ (function() {
    var o = function(n, t) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, e) {
        r.__proto__ = e;
      } || function(r, e) {
        for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
      }, o(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      o(n, t);
      function r() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
    };
  })();
  Object.defineProperty(W, "__esModule", { value: !0 }), W.AbstractHandler = void 0;
  var O = Tt(), w = (function(o) {
    f(n, o);
    function n() {
      return o !== null && o.apply(this, arguments) || this;
    }
    return n;
  })(O.AbstractMathDocument), h = (function() {
    function o(n, t) {
      t === void 0 && (t = 5), this.documentClass = w, this.adaptor = n, this.priority = t;
    }
    return Object.defineProperty(o.prototype, "name", {
      get: function() {
        return this.constructor.NAME;
      },
      enumerable: !1,
      configurable: !0
    }), o.prototype.handlesDocument = function(n) {
      return !1;
    }, o.prototype.create = function(n, t) {
      return new this.documentClass(n, this.adaptor, t);
    }, o.NAME = "generic", o;
  })();
  return W.AbstractHandler = h, W;
}
var I = {}, G = {}, Mt;
function Me() {
  if (Mt) return G;
  Mt = 1;
  var f = G && G.__extends || /* @__PURE__ */ (function() {
    var h = function(o, n) {
      return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, r) {
        t.__proto__ = r;
      } || function(t, r) {
        for (var e in r) Object.prototype.hasOwnProperty.call(r, e) && (t[e] = r[e]);
      }, h(o, n);
    };
    return function(o, n) {
      if (typeof n != "function" && n !== null)
        throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
      h(o, n);
      function t() {
        this.constructor = o;
      }
      o.prototype = n === null ? Object.create(n) : (t.prototype = n.prototype, new t());
    };
  })();
  Object.defineProperty(G, "__esModule", { value: !0 }), G.HTMLMathItem = void 0;
  var O = ot(), w = (function(h) {
    f(o, h);
    function o(n, t, r, e, i) {
      return r === void 0 && (r = !0), e === void 0 && (e = { node: null, n: 0, delim: "" }), i === void 0 && (i = { node: null, n: 0, delim: "" }), h.call(this, n, t, r, e, i) || this;
    }
    return Object.defineProperty(o.prototype, "adaptor", {
      get: function() {
        return this.inputJax.adaptor;
      },
      enumerable: !1,
      configurable: !0
    }), o.prototype.updateDocument = function(n) {
      if (this.state() < O.STATE.INSERTED) {
        if (this.inputJax.processStrings) {
          var t = this.start.node;
          if (t === this.end.node)
            this.end.n && this.end.n < this.adaptor.value(this.end.node).length && this.adaptor.split(this.end.node, this.end.n), this.start.n && (t = this.adaptor.split(this.start.node, this.start.n)), this.adaptor.replace(this.typesetRoot, t);
          else {
            for (this.start.n && (t = this.adaptor.split(t, this.start.n)); t !== this.end.node; ) {
              var r = this.adaptor.next(t);
              this.adaptor.remove(t), t = r;
            }
            this.adaptor.insert(this.typesetRoot, t), this.end.n < this.adaptor.value(t).length && this.adaptor.split(t, this.end.n), this.adaptor.remove(t);
          }
        } else
          this.adaptor.replace(this.typesetRoot, this.start.node);
        this.start.node = this.end.node = this.typesetRoot, this.start.n = this.end.n = 0, this.state(O.STATE.INSERTED);
      }
    }, o.prototype.updateStyleSheet = function(n) {
      n.addStyleSheet();
    }, o.prototype.removeFromDocument = function(n) {
      if (n === void 0 && (n = !1), this.state() >= O.STATE.TYPESET) {
        var t = this.adaptor, r = this.start.node, e = t.text("");
        if (n) {
          var i = this.start.delim + this.math + this.end.delim;
          if (this.inputJax.processStrings)
            e = t.text(i);
          else {
            var y = t.parse(i, "text/html");
            e = t.firstChild(t.body(y));
          }
        }
        t.parent(r) && t.replace(e, r), this.start.node = this.end.node = e, this.start.n = this.end.n = 0;
      }
    }, o;
  })(O.AbstractMathItem);
  return G.HTMLMathItem = w, G;
}
var Q = {}, _t;
function _e() {
  if (_t) return Q;
  _t = 1;
  var f = Q && Q.__extends || /* @__PURE__ */ (function() {
    var h = function(o, n) {
      return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, r) {
        t.__proto__ = r;
      } || function(t, r) {
        for (var e in r) Object.prototype.hasOwnProperty.call(r, e) && (t[e] = r[e]);
      }, h(o, n);
    };
    return function(o, n) {
      if (typeof n != "function" && n !== null)
        throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
      h(o, n);
      function t() {
        this.constructor = o;
      }
      o.prototype = n === null ? Object.create(n) : (t.prototype = n.prototype, new t());
    };
  })();
  Object.defineProperty(Q, "__esModule", { value: !0 }), Q.HTMLMathList = void 0;
  var O = St(), w = (function(h) {
    f(o, h);
    function o() {
      return h !== null && h.apply(this, arguments) || this;
    }
    return o;
  })(O.AbstractMathList);
  return Q.HTMLMathList = w, Q;
}
var V = {}, gt;
function ge() {
  if (gt) return V;
  gt = 1;
  var f = V && V.__read || function(h, o) {
    var n = typeof Symbol == "function" && h[Symbol.iterator];
    if (!n) return h;
    var t = n.call(h), r, e = [], i;
    try {
      for (; (o === void 0 || o-- > 0) && !(r = t.next()).done; ) e.push(r.value);
    } catch (y) {
      i = { error: y };
    } finally {
      try {
        r && !r.done && (n = t.return) && n.call(t);
      } finally {
        if (i) throw i.error;
      }
    }
    return e;
  };
  Object.defineProperty(V, "__esModule", { value: !0 }), V.HTMLDomStrings = void 0;
  var O = it(), w = (function() {
    function h(o) {
      o === void 0 && (o = null);
      var n = this.constructor;
      this.options = (0, O.userOptions)((0, O.defaultOptions)({}, n.OPTIONS), o), this.init(), this.getPatterns();
    }
    return h.prototype.init = function() {
      this.strings = [], this.string = "", this.snodes = [], this.nodes = [], this.stack = [];
    }, h.prototype.getPatterns = function() {
      var o = (0, O.makeArray)(this.options.skipHtmlTags), n = (0, O.makeArray)(this.options.ignoreHtmlClass), t = (0, O.makeArray)(this.options.processHtmlClass);
      this.skipHtmlTags = new RegExp("^(?:" + o.join("|") + ")$", "i"), this.ignoreHtmlClass = new RegExp("(?:^| )(?:" + n.join("|") + ")(?: |$)"), this.processHtmlClass = new RegExp("(?:^| )(?:" + t + ")(?: |$)");
    }, h.prototype.pushString = function() {
      this.string.match(/\S/) && (this.strings.push(this.string), this.nodes.push(this.snodes)), this.string = "", this.snodes = [];
    }, h.prototype.extendString = function(o, n) {
      this.snodes.push([o, n.length]), this.string += n;
    }, h.prototype.handleText = function(o, n) {
      return n || this.extendString(o, this.adaptor.value(o)), this.adaptor.next(o);
    }, h.prototype.handleTag = function(o, n) {
      if (!n) {
        var t = this.options.includeHtmlTags[this.adaptor.kind(o)];
        this.extendString(o, t);
      }
      return this.adaptor.next(o);
    }, h.prototype.handleContainer = function(o, n) {
      this.pushString();
      var t = this.adaptor.getAttribute(o, "class") || "", r = this.adaptor.kind(o) || "", e = this.processHtmlClass.exec(t), i = o;
      return this.adaptor.firstChild(o) && !this.adaptor.getAttribute(o, "data-MJX") && (e || !this.skipHtmlTags.exec(r)) ? (this.adaptor.next(o) && this.stack.push([this.adaptor.next(o), n]), i = this.adaptor.firstChild(o), n = (n || this.ignoreHtmlClass.exec(t)) && !e) : i = this.adaptor.next(o), [i, n];
    }, h.prototype.handleOther = function(o, n) {
      return this.pushString(), this.adaptor.next(o);
    }, h.prototype.find = function(o) {
      var n, t;
      this.init();
      for (var r = this.adaptor.next(o), e = !1, i = this.options.includeHtmlTags; o && o !== r; ) {
        var y = this.adaptor.kind(o);
        y === "#text" ? o = this.handleText(o, e) : i.hasOwnProperty(y) ? o = this.handleTag(o, e) : y ? (n = f(this.handleContainer(o, e), 2), o = n[0], e = n[1]) : o = this.handleOther(o, e), !o && this.stack.length && (this.pushString(), t = f(this.stack.pop(), 2), o = t[0], e = t[1]);
      }
      this.pushString();
      var u = [this.strings, this.nodes];
      return this.init(), u;
    }, h.OPTIONS = {
      skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code", "annotation", "annotation-xml"],
      includeHtmlTags: { br: `
`, wbr: "", "#comment": "" },
      ignoreHtmlClass: "mathjax_ignore",
      processHtmlClass: "mathjax_process"
    }, h;
  })();
  return V.HTMLDomStrings = w, V;
}
var xt;
function xe() {
  if (xt) return I;
  xt = 1;
  var f = I && I.__extends || /* @__PURE__ */ (function() {
    var u = function(c, p) {
      return u = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(_, x) {
        _.__proto__ = x;
      } || function(_, x) {
        for (var d in x) Object.prototype.hasOwnProperty.call(x, d) && (_[d] = x[d]);
      }, u(c, p);
    };
    return function(c, p) {
      if (typeof p != "function" && p !== null)
        throw new TypeError("Class extends value " + String(p) + " is not a constructor or null");
      u(c, p);
      function _() {
        this.constructor = c;
      }
      c.prototype = p === null ? Object.create(p) : (_.prototype = p.prototype, new _());
    };
  })(), O = I && I.__assign || function() {
    return O = Object.assign || function(u) {
      for (var c, p = 1, _ = arguments.length; p < _; p++) {
        c = arguments[p];
        for (var x in c) Object.prototype.hasOwnProperty.call(c, x) && (u[x] = c[x]);
      }
      return u;
    }, O.apply(this, arguments);
  }, w = I && I.__read || function(u, c) {
    var p = typeof Symbol == "function" && u[Symbol.iterator];
    if (!p) return u;
    var _ = p.call(u), x, d = [], T;
    try {
      for (; (c === void 0 || c-- > 0) && !(x = _.next()).done; ) d.push(x.value);
    } catch (L) {
      T = { error: L };
    } finally {
      try {
        x && !x.done && (p = _.return) && p.call(_);
      } finally {
        if (T) throw T.error;
      }
    }
    return d;
  }, h = I && I.__values || function(u) {
    var c = typeof Symbol == "function" && Symbol.iterator, p = c && u[c], _ = 0;
    if (p) return p.call(u);
    if (u && typeof u.length == "number") return {
      next: function() {
        return u && _ >= u.length && (u = void 0), { value: u && u[_++], done: !u };
      }
    };
    throw new TypeError(c ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(I, "__esModule", { value: !0 }), I.HTMLDocument = void 0;
  var o = Tt(), n = it(), t = Me(), r = _e(), e = ge(), i = ot(), y = (function(u) {
    f(c, u);
    function c(p, _, x) {
      var d = this, T = w((0, n.separateOptions)(x, e.HTMLDomStrings.OPTIONS), 2), L = T[0], v = T[1];
      return d = u.call(this, p, _, L) || this, d.domStrings = d.options.DomStrings || new e.HTMLDomStrings(v), d.domStrings.adaptor = _, d.styles = [], d;
    }
    return c.prototype.findPosition = function(p, _, x, d) {
      var T, L, v = this.adaptor;
      try {
        for (var a = h(d[p]), l = a.next(); !l.done; l = a.next()) {
          var s = l.value, m = w(s, 2), M = m[0], g = m[1];
          if (_ <= g && v.kind(M) === "#text")
            return { node: M, n: Math.max(_, 0), delim: x };
          _ -= g;
        }
      } catch (j) {
        T = { error: j };
      } finally {
        try {
          l && !l.done && (L = a.return) && L.call(a);
        } finally {
          if (T) throw T.error;
        }
      }
      return { node: null, n: 0, delim: x };
    }, c.prototype.mathItem = function(p, _, x) {
      var d = p.math, T = this.findPosition(p.n, p.start.n, p.open, x), L = this.findPosition(p.n, p.end.n, p.close, x);
      return new this.options.MathItem(d, _, p.display, T, L);
    }, c.prototype.findMath = function(p) {
      var _, x, d, T, L, v, a, l, s;
      if (!this.processed.isSet("findMath")) {
        this.adaptor.document = this.document, p = (0, n.userOptions)({ elements: this.options.elements || [this.adaptor.body(this.document)] }, p);
        try {
          for (var m = h(this.adaptor.getElements(p.elements, this.document)), M = m.next(); !M.done; M = m.next()) {
            var g = M.value, j = w([null, null], 2), S = j[0], A = j[1];
            try {
              for (var b = (d = void 0, h(this.inputJax)), D = b.next(); !D.done; D = b.next()) {
                var E = D.value, k = new this.options.MathList();
                if (E.processStrings) {
                  S === null && (L = w(this.domStrings.find(g), 2), S = L[0], A = L[1]);
                  try {
                    for (var P = (v = void 0, h(E.findMath(S))), q = P.next(); !q.done; q = P.next()) {
                      var C = q.value;
                      k.push(this.mathItem(C, E, A));
                    }
                  } catch (X) {
                    v = { error: X };
                  } finally {
                    try {
                      q && !q.done && (a = P.return) && a.call(P);
                    } finally {
                      if (v) throw v.error;
                    }
                  }
                } else
                  try {
                    for (var nt = (l = void 0, h(E.findMath(g))), Z = nt.next(); !Z.done; Z = nt.next()) {
                      var C = Z.value, bt = new this.options.MathItem(C.math, E, C.display, C.start, C.end);
                      k.push(bt);
                    }
                  } catch (X) {
                    l = { error: X };
                  } finally {
                    try {
                      Z && !Z.done && (s = nt.return) && s.call(nt);
                    } finally {
                      if (l) throw l.error;
                    }
                  }
                this.math.merge(k);
              }
            } catch (X) {
              d = { error: X };
            } finally {
              try {
                D && !D.done && (T = b.return) && T.call(b);
              } finally {
                if (d) throw d.error;
              }
            }
          }
        } catch (X) {
          _ = { error: X };
        } finally {
          try {
            M && !M.done && (x = m.return) && x.call(m);
          } finally {
            if (_) throw _.error;
          }
        }
        this.processed.set("findMath");
      }
      return this;
    }, c.prototype.updateDocument = function() {
      return this.processed.isSet("updateDocument") || (this.addPageElements(), this.addStyleSheet(), u.prototype.updateDocument.call(this), this.processed.set("updateDocument")), this;
    }, c.prototype.addPageElements = function() {
      var p = this.adaptor.body(this.document), _ = this.documentPageElements();
      _ && this.adaptor.append(p, _);
    }, c.prototype.addStyleSheet = function() {
      var p = this.documentStyleSheet(), _ = this.adaptor;
      if (p && !_.parent(p)) {
        var x = _.head(this.document), d = this.findSheet(x, _.getAttribute(p, "id"));
        d ? _.replace(p, d) : _.append(x, p);
      }
    }, c.prototype.findSheet = function(p, _) {
      var x, d;
      if (_)
        try {
          for (var T = h(this.adaptor.tags(p, "style")), L = T.next(); !L.done; L = T.next()) {
            var v = L.value;
            if (this.adaptor.getAttribute(v, "id") === _)
              return v;
          }
        } catch (a) {
          x = { error: a };
        } finally {
          try {
            L && !L.done && (d = T.return) && d.call(T);
          } finally {
            if (x) throw x.error;
          }
        }
      return null;
    }, c.prototype.removeFromDocument = function(p) {
      var _, x;
      if (p === void 0 && (p = !1), this.processed.isSet("updateDocument"))
        try {
          for (var d = h(this.math), T = d.next(); !T.done; T = d.next()) {
            var L = T.value;
            L.state() >= i.STATE.INSERTED && L.state(i.STATE.TYPESET, p);
          }
        } catch (v) {
          _ = { error: v };
        } finally {
          try {
            T && !T.done && (x = d.return) && x.call(d);
          } finally {
            if (_) throw _.error;
          }
        }
      return this.processed.clear("updateDocument"), this;
    }, c.prototype.documentStyleSheet = function() {
      return this.outputJax.styleSheet(this);
    }, c.prototype.documentPageElements = function() {
      return this.outputJax.pageElements(this);
    }, c.prototype.addStyles = function(p) {
      this.styles.push(p);
    }, c.prototype.getStyles = function() {
      return this.styles;
    }, c.KIND = "HTML", c.OPTIONS = O(O({}, o.AbstractMathDocument.OPTIONS), { renderActions: (0, n.expandable)(O(O({}, o.AbstractMathDocument.OPTIONS.renderActions), { styles: [i.STATE.INSERTED + 1, "", "updateStyleSheet", !1] })), MathList: r.HTMLMathList, MathItem: t.HTMLMathItem, DomStrings: null }), c;
  })(o.AbstractMathDocument);
  return I.HTMLDocument = y, I;
}
var Ot;
function Oe() {
  if (Ot) return z;
  Ot = 1;
  var f = z && z.__extends || /* @__PURE__ */ (function() {
    var o = function(n, t) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, e) {
        r.__proto__ = e;
      } || function(r, e) {
        for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (r[i] = e[i]);
      }, o(n, t);
    };
    return function(n, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
      o(n, t);
      function r() {
        this.constructor = n;
      }
      n.prototype = t === null ? Object.create(t) : (r.prototype = t.prototype, new r());
    };
  })();
  Object.defineProperty(z, "__esModule", { value: !0 }), z.HTMLHandler = void 0;
  var O = me(), w = xe(), h = (function(o) {
    f(n, o);
    function n() {
      var t = o !== null && o.apply(this, arguments) || this;
      return t.documentClass = w.HTMLDocument, t;
    }
    return n.prototype.handlesDocument = function(t) {
      var r = this.adaptor;
      if (typeof t == "string")
        try {
          t = r.parse(t, "text/html");
        } catch {
        }
      return t instanceof r.window.Document || t instanceof r.window.HTMLElement || t instanceof r.window.DocumentFragment;
    }, n.prototype.create = function(t, r) {
      var e = this.adaptor;
      if (typeof t == "string")
        t = e.parse(t, "text/html");
      else if (t instanceof e.window.HTMLElement || t instanceof e.window.DocumentFragment) {
        var i = t;
        t = e.parse("", "text/html"), e.append(e.body(t), i);
      }
      return o.prototype.create.call(this, t, r);
    }, n;
  })(O.AbstractHandler);
  return z.HTMLHandler = h, z;
}
var wt;
function we() {
  if (wt) return tt;
  wt = 1, Object.defineProperty(tt, "__esModule", { value: !0 }), tt.RegisterHTMLHandler = void 0;
  var f = Dt(), O = Oe();
  function w(h) {
    var o = new O.HTMLHandler(h);
    return f.mathjax.handlers.register(o), o;
  }
  return tt.RegisterHTMLHandler = w, tt;
}
var At = we();
const je = /* @__PURE__ */ Et(At), Pe = /* @__PURE__ */ se({
  __proto__: null,
  default: je
}, [At]);
export {
  Pe as h
};
