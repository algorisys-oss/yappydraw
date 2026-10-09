import { g as At } from "./_commonjsHelpers-DaMA6jEr.js";
import { E as te, O as Tt, q as we, M as ke } from "./jspdf.es.min-rJE95jGX.js";
var ct, Lt;
function Me() {
  if (Lt) return ct;
  Lt = 1;
  var i = {}, e = i.hasOwnProperty, t = function(l, u) {
    if (!l)
      return u;
    var f = {};
    for (var c in u)
      f[c] = e.call(l, c) ? l[c] : u[c];
    return f;
  }, r = /[ -,\.\/:-@\[-\^`\{-~]/, n = /[ -,\.\/:-@\[\]\^`\{-~]/, s = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, a = function o(l, u) {
    u = t(u, o.options), u.quotes != "single" && u.quotes != "double" && (u.quotes = "single");
    for (var f = u.quotes == "double" ? '"' : "'", c = u.isIdentifier, p = l.charAt(0), h = "", g = 0, d = l.length; g < d; ) {
      var m = l.charAt(g++), x = m.charCodeAt(), v = void 0;
      if (x < 32 || x > 126) {
        if (x >= 55296 && x <= 56319 && g < d) {
          var S = l.charCodeAt(g++);
          (S & 64512) == 56320 ? x = ((x & 1023) << 10) + (S & 1023) + 65536 : g--;
        }
        v = "\\" + x.toString(16).toUpperCase() + " ";
      } else
        u.escapeEverything ? r.test(m) ? v = "\\" + m : v = "\\" + x.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(m) ? v = "\\" + x.toString(16).toUpperCase() + " " : m == "\\" || !c && (m == '"' && f == m || m == "'" && f == m) || c && n.test(m) ? v = "\\" + m : v = m;
      h += v;
    }
    return c && (/^-[-\d]/.test(h) ? h = "\\-" + h.slice(1) : /\d/.test(p) && (h = "\\3" + p + " " + h.slice(1))), h = h.replace(s, function(w, y, k) {
      return y && y.length % 2 ? w : (y || "") + k;
    }), !c && u.wrap ? f + h + f : h;
  };
  return a.options = {
    escapeEverything: !1,
    isIdentifier: !1,
    quotes: "single",
    wrap: !1
  }, a.version = "3.0.0", ct = a, ct;
}
var Ce = Me();
const ee = /* @__PURE__ */ At(Ce);
var pt, Ot;
function Fe() {
  if (Ot) return pt;
  Ot = 1;
  var i = 0, e = 1, t = 2, r = 3, n = 4, s = 5, a = 6, o = /[a-z0-9_-]/i, l = /[\s\t]/, u = function(p) {
    for (var h = !0, g = i, d = "", m = 0, x, v, S = []; ; ) {
      if (v = p[m], g === i) {
        if (!v && h)
          break;
        if (!v && !h)
          throw new Error("Parse error");
        if (v === '"' || v === "'")
          x = v, g = e, h = !1;
        else if (!l.test(v)) if (o.test(v))
          g = r, h = !1, m--;
        else
          throw new Error("Parse error");
      } else if (g === e)
        if (v)
          v === "\\" ? g = t : v === x ? (S.push(d), d = "", g = n) : d += v;
        else throw new Error("Parse Error");
      else if (g === t)
        if (v === x || v === "\\")
          d += v, g = e;
        else
          throw new Error("Parse error");
      else if (g === r)
        if (v)
          o.test(v) ? d += v : v === "," ? (S.push(d), d = "", g = i) : l.test(v) ? g = s : v === "\\" && (g = a);
        else {
          S.push(d);
          break;
        }
      else if (g === a) {
        if (/[0-9a-f]/i.test(v))
          throw new Error("Parse error");
        d += v, g = r;
      } else if (g === s)
        if (v) {
          if (o.test(v))
            d += " " + v, g = r;
          else if (v === ",")
            S.push(d), d = "", g = i;
          else if (!l.test(v)) throw new Error("Parse error");
        } else {
          S.push(d);
          break;
        }
      else if (g === n)
        if (v) {
          if (v === ",")
            g = i;
          else if (!l.test(v)) throw new Error("Parse error");
        } else break;
      m++;
    }
    return S;
  }, f = /[^a-z0-9_-]/i, c = function(p, h) {
    var g = h && h.quote || '"';
    if (g !== '"' && g !== "'")
      throw new Error("Quote must be `'` or `\"`");
    for (var d = new RegExp(g, "g"), m = [], x = 0; x < p.length; ++x) {
      var v = p[x];
      f.test(v) && (v = v.replace(/\\/g, "\\\\").replace(d, "\\" + g), v = g + v + g), m.push(v);
    }
    return m.join(", ");
  };
  return pt = {
    parse: u,
    stringify: c
  }, pt;
}
var Ae = Fe();
const Te = /* @__PURE__ */ At(Ae);
var dt, qt;
function Pe() {
  if (qt) return dt;
  qt = 1;
  var i = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 }, e = [
    5760,
    6158,
    8192,
    8193,
    8194,
    8195,
    8196,
    8197,
    8198,
    8199,
    8200,
    8201,
    8202,
    8239,
    8287,
    12288,
    65279
  ];
  function t(h) {
    return h === 10 || h === 13 || h === 8232 || h === 8233 || // Line terminators
    // White spaces
    h === 32 || h === 9 || h === 11 || h === 12 || h === 160 || h >= 5760 && e.indexOf(h) >= 0;
  }
  function r(h) {
    switch (h | 32) {
      case 109:
      case 122:
      case 108:
      case 104:
      case 118:
      case 99:
      case 115:
      case 113:
      case 116:
      case 97:
      case 114:
        return !0;
    }
    return !1;
  }
  function n(h) {
    return (h | 32) === 97;
  }
  function s(h) {
    return h >= 48 && h <= 57;
  }
  function a(h) {
    return h >= 48 && h <= 57 || /* 0..9 */
    h === 43 || /* + */
    h === 45 || /* - */
    h === 46;
  }
  function o(h) {
    this.index = 0, this.path = h, this.max = h.length, this.result = [], this.param = 0, this.err = "", this.segmentStart = 0, this.data = [];
  }
  function l(h) {
    for (; h.index < h.max && t(h.path.charCodeAt(h.index)); )
      h.index++;
  }
  function u(h) {
    var g = h.path.charCodeAt(h.index);
    if (g === 48) {
      h.param = 0, h.index++;
      return;
    }
    if (g === 49) {
      h.param = 1, h.index++;
      return;
    }
    h.err = "SvgPath: arc flag can be 0 or 1 only (at pos " + h.index + ")";
  }
  function f(h) {
    var g = h.index, d = g, m = h.max, x = !1, v = !1, S = !1, w = !1, y;
    if (d >= m) {
      h.err = "SvgPath: missed param (at pos " + d + ")";
      return;
    }
    if (y = h.path.charCodeAt(d), (y === 43 || y === 45) && (d++, y = d < m ? h.path.charCodeAt(d) : 0), !s(y) && y !== 46) {
      h.err = "SvgPath: param should start with 0..9 or `.` (at pos " + d + ")";
      return;
    }
    if (y !== 46) {
      if (x = y === 48, d++, y = d < m ? h.path.charCodeAt(d) : 0, x && d < m && y && s(y)) {
        h.err = "SvgPath: numbers started with `0` such as `09` are illegal (at pos " + g + ")";
        return;
      }
      for (; d < m && s(h.path.charCodeAt(d)); )
        d++, v = !0;
      y = d < m ? h.path.charCodeAt(d) : 0;
    }
    if (y === 46) {
      for (w = !0, d++; s(h.path.charCodeAt(d)); )
        d++, S = !0;
      y = d < m ? h.path.charCodeAt(d) : 0;
    }
    if (y === 101 || y === 69) {
      if (w && !v && !S) {
        h.err = "SvgPath: invalid float exponent (at pos " + d + ")";
        return;
      }
      if (d++, y = d < m ? h.path.charCodeAt(d) : 0, (y === 43 || y === 45) && d++, d < m && s(h.path.charCodeAt(d)))
        for (; d < m && s(h.path.charCodeAt(d)); )
          d++;
      else {
        h.err = "SvgPath: invalid float exponent (at pos " + d + ")";
        return;
      }
    }
    h.index = d, h.param = parseFloat(h.path.slice(g, d)) + 0;
  }
  function c(h) {
    var g, d;
    g = h.path[h.segmentStart], d = g.toLowerCase();
    var m = h.data;
    if (d === "m" && m.length > 2 && (h.result.push([g, m[0], m[1]]), m = m.slice(2), d = "l", g = g === "m" ? "l" : "L"), d === "r")
      h.result.push([g].concat(m));
    else
      for (; m.length >= i[d] && (h.result.push([g].concat(m.splice(0, i[d]))), !!i[d]); )
        ;
  }
  function p(h) {
    var g = h.max, d, m, x, v, S;
    if (h.segmentStart = h.index, d = h.path.charCodeAt(h.index), m = n(d), !r(d)) {
      h.err = "SvgPath: bad command " + h.path[h.index] + " (at pos " + h.index + ")";
      return;
    }
    if (v = i[h.path[h.index].toLowerCase()], h.index++, l(h), h.data = [], !v) {
      c(h);
      return;
    }
    for (x = !1; ; ) {
      for (S = v; S > 0; S--) {
        if (m && (S === 3 || S === 4) ? u(h) : f(h), h.err.length) {
          c(h);
          return;
        }
        h.data.push(h.param), l(h), x = !1, h.index < g && h.path.charCodeAt(h.index) === 44 && (h.index++, l(h), x = !0);
      }
      if (!x && (h.index >= h.max || !a(h.path.charCodeAt(h.index))))
        break;
    }
    c(h);
  }
  return dt = function(g) {
    var d = new o(g), m = d.max;
    for (l(d); d.index < m && !d.err.length; )
      p(d);
    return d.result.length && ("mM".indexOf(d.result[0][0]) < 0 ? (d.err = "SvgPath: string should start with `M` or `m`", d.result = []) : d.result[0][0] = "M"), {
      err: d.err,
      segments: d.result
    };
  }, dt;
}
var gt, Dt;
function re() {
  if (Dt) return gt;
  Dt = 1;
  function i(t, r) {
    return [
      t[0] * r[0] + t[2] * r[1],
      t[1] * r[0] + t[3] * r[1],
      t[0] * r[2] + t[2] * r[3],
      t[1] * r[2] + t[3] * r[3],
      t[0] * r[4] + t[2] * r[5] + t[4],
      t[1] * r[4] + t[3] * r[5] + t[5]
    ];
  }
  function e() {
    if (!(this instanceof e))
      return new e();
    this.queue = [], this.cache = null;
  }
  return e.prototype.matrix = function(t) {
    return t[0] === 1 && t[1] === 0 && t[2] === 0 && t[3] === 1 && t[4] === 0 && t[5] === 0 ? this : (this.cache = null, this.queue.push(t), this);
  }, e.prototype.translate = function(t, r) {
    return (t !== 0 || r !== 0) && (this.cache = null, this.queue.push([1, 0, 0, 1, t, r])), this;
  }, e.prototype.scale = function(t, r) {
    return (t !== 1 || r !== 1) && (this.cache = null, this.queue.push([t, 0, 0, r, 0, 0])), this;
  }, e.prototype.rotate = function(t, r, n) {
    var s, a, o;
    return t !== 0 && (this.translate(r, n), s = t * Math.PI / 180, a = Math.cos(s), o = Math.sin(s), this.queue.push([a, o, -o, a, 0, 0]), this.cache = null, this.translate(-r, -n)), this;
  }, e.prototype.skewX = function(t) {
    return t !== 0 && (this.cache = null, this.queue.push([1, 0, Math.tan(t * Math.PI / 180), 1, 0, 0])), this;
  }, e.prototype.skewY = function(t) {
    return t !== 0 && (this.cache = null, this.queue.push([1, Math.tan(t * Math.PI / 180), 0, 1, 0, 0])), this;
  }, e.prototype.toArray = function() {
    if (this.cache)
      return this.cache;
    if (!this.queue.length)
      return this.cache = [1, 0, 0, 1, 0, 0], this.cache;
    if (this.cache = this.queue[0], this.queue.length === 1)
      return this.cache;
    for (var t = 1; t < this.queue.length; t++)
      this.cache = i(this.cache, this.queue[t]);
    return this.cache;
  }, e.prototype.calc = function(t, r, n) {
    var s;
    return this.queue.length ? (this.cache || (this.cache = this.toArray()), s = this.cache, [
      t * s[0] + r * s[2] + (n ? 0 : s[4]),
      t * s[1] + r * s[3] + (n ? 0 : s[5])
    ]) : [t, r];
  }, gt = e, gt;
}
var vt, Ht;
function Ee() {
  if (Ht) return vt;
  Ht = 1;
  var i = re(), e = {
    matrix: !0,
    scale: !0,
    rotate: !0,
    translate: !0,
    skewX: !0,
    skewY: !0
  }, t = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/, r = /[\s,]+/;
  return vt = function(s) {
    var a = new i(), o, l;
    return s.split(t).forEach(function(u) {
      if (u.length) {
        if (typeof e[u] < "u") {
          o = u;
          return;
        }
        switch (l = u.split(r).map(function(f) {
          return +f || 0;
        }), o) {
          case "matrix":
            l.length === 6 && a.matrix(l);
            return;
          case "scale":
            l.length === 1 ? a.scale(l[0], l[0]) : l.length === 2 && a.scale(l[0], l[1]);
            return;
          case "rotate":
            l.length === 1 ? a.rotate(l[0], 0, 0) : l.length === 3 && a.rotate(l[0], l[1], l[2]);
            return;
          case "translate":
            l.length === 1 ? a.translate(l[0], 0) : l.length === 2 && a.translate(l[0], l[1]);
            return;
          case "skewX":
            l.length === 1 && a.skewX(l[0]);
            return;
          case "skewY":
            l.length === 1 && a.skewY(l[0]);
            return;
        }
      }
    }), a;
  }, vt;
}
var mt, Vt;
function Be() {
  if (Vt) return mt;
  Vt = 1;
  var i = Math.PI * 2;
  function e(n, s, a, o) {
    var l = n * o - s * a < 0 ? -1 : 1, u = n * a + s * o;
    return u > 1 && (u = 1), u < -1 && (u = -1), l * Math.acos(u);
  }
  function t(n, s, a, o, l, u, f, c, p, h) {
    var g = h * (n - a) / 2 + p * (s - o) / 2, d = -p * (n - a) / 2 + h * (s - o) / 2, m = f * f, x = c * c, v = g * g, S = d * d, w = m * x - m * S - x * v;
    w < 0 && (w = 0), w /= m * S + x * v, w = Math.sqrt(w) * (l === u ? -1 : 1);
    var y = w * f / c * d, k = w * -c / f * g, B = h * y - p * k + (n + a) / 2, _ = p * y + h * k + (s + o) / 2, P = (g - y) / f, T = (d - k) / c, D = (-g - y) / f, A = (-d - k) / c, R = e(1, 0, P, T), N = e(P, T, D, A);
    return u === 0 && N > 0 && (N -= i), u === 1 && N < 0 && (N += i), [B, _, R, N];
  }
  function r(n, s) {
    var a = 1.3333333333333333 * Math.tan(s / 4), o = Math.cos(n), l = Math.sin(n), u = Math.cos(n + s), f = Math.sin(n + s);
    return [o, l, o - l * a, l + o * a, u + f * a, f - u * a, u, f];
  }
  return mt = function(s, a, o, l, u, f, c, p, h) {
    var g = Math.sin(h * i / 360), d = Math.cos(h * i / 360), m = d * (s - o) / 2 + g * (a - l) / 2, x = -g * (s - o) / 2 + d * (a - l) / 2;
    if (m === 0 && x === 0)
      return [];
    if (c === 0 || p === 0)
      return [];
    c = Math.abs(c), p = Math.abs(p);
    var v = m * m / (c * c) + x * x / (p * p);
    v > 1 && (c *= Math.sqrt(v), p *= Math.sqrt(v));
    var S = t(s, a, o, l, u, f, c, p, g, d), w = [], y = S[2], k = S[3], B = Math.max(Math.ceil(Math.abs(k) / (i / 4)), 1);
    k /= B;
    for (var _ = 0; _ < B; _++)
      w.push(r(y, k)), y += k;
    return w.map(function(P) {
      for (var T = 0; T < P.length; T += 2) {
        var D = P[T + 0], A = P[T + 1];
        D *= c, A *= p;
        var R = d * D - g * A, N = g * D + d * A;
        P[T + 0] = R + S[0], P[T + 1] = N + S[1];
      }
      return P;
    });
  }, mt;
}
var xt, jt;
function Ie() {
  if (jt) return xt;
  jt = 1;
  var i = 1e-10, e = Math.PI / 180;
  function t(r, n, s) {
    if (!(this instanceof t))
      return new t(r, n, s);
    this.rx = r, this.ry = n, this.ax = s;
  }
  return t.prototype.transform = function(r) {
    var n = Math.cos(this.ax * e), s = Math.sin(this.ax * e), a = [
      this.rx * (r[0] * n + r[2] * s),
      this.rx * (r[1] * n + r[3] * s),
      this.ry * (-r[0] * s + r[2] * n),
      this.ry * (-r[1] * s + r[3] * n)
    ], o = a[0] * a[0] + a[2] * a[2], l = a[1] * a[1] + a[3] * a[3], u = ((a[0] - a[3]) * (a[0] - a[3]) + (a[2] + a[1]) * (a[2] + a[1])) * ((a[0] + a[3]) * (a[0] + a[3]) + (a[2] - a[1]) * (a[2] - a[1])), f = (o + l) / 2;
    if (u < i * f)
      return this.rx = this.ry = Math.sqrt(f), this.ax = 0, this;
    var c = a[0] * a[1] + a[2] * a[3];
    u = Math.sqrt(u);
    var p = f + u / 2, h = f - u / 2;
    return this.ax = Math.abs(c) < i && Math.abs(p - l) < i ? 90 : Math.atan(
      Math.abs(c) > Math.abs(p - l) ? (p - o) / c : c / (p - l)
    ) * 180 / Math.PI, this.ax >= 0 ? (this.rx = Math.sqrt(p), this.ry = Math.sqrt(h)) : (this.ax += 90, this.rx = Math.sqrt(h), this.ry = Math.sqrt(p)), this;
  }, t.prototype.isDegenerate = function() {
    return this.rx < i * this.ry || this.ry < i * this.rx;
  }, xt = t, xt;
}
var bt, Wt;
function Ne() {
  if (Wt) return bt;
  Wt = 1;
  var i = Pe(), e = Ee(), t = re(), r = Be(), n = Ie();
  function s(a) {
    if (!(this instanceof s))
      return new s(a);
    var o = i(a);
    this.segments = o.segments, this.err = o.err, this.__stack = [];
  }
  return s.from = function(a) {
    if (typeof a == "string") return new s(a);
    if (a instanceof s) {
      var o = new s("");
      return o.err = a.err, o.segments = a.segments.map(function(l) {
        return l.slice();
      }), o.__stack = a.__stack.map(function(l) {
        return t().matrix(l.toArray());
      }), o;
    }
    throw new Error("SvgPath.from: invalid param type " + a);
  }, s.prototype.__matrix = function(a) {
    var o = this, l;
    a.queue.length && this.iterate(function(u, f, c, p) {
      var h, g, d, m;
      switch (u[0]) {
        // Process 'assymetric' commands separately
        case "v":
          h = a.calc(0, u[1], !0), g = h[0] === 0 ? ["v", h[1]] : ["l", h[0], h[1]];
          break;
        case "V":
          h = a.calc(c, u[1], !1), g = h[0] === a.calc(c, p, !1)[0] ? ["V", h[1]] : ["L", h[0], h[1]];
          break;
        case "h":
          h = a.calc(u[1], 0, !0), g = h[1] === 0 ? ["h", h[0]] : ["l", h[0], h[1]];
          break;
        case "H":
          h = a.calc(u[1], p, !1), g = h[1] === a.calc(c, p, !1)[1] ? ["H", h[0]] : ["L", h[0], h[1]];
          break;
        case "a":
        case "A":
          var x = a.toArray(), v = n(u[1], u[2], u[3]).transform(x);
          if (x[0] * x[3] - x[1] * x[2] < 0 && (u[5] = u[5] ? "0" : "1"), h = a.calc(u[6], u[7], u[0] === "a"), u[0] === "A" && u[6] === c && u[7] === p || u[0] === "a" && u[6] === 0 && u[7] === 0) {
            g = [u[0] === "a" ? "l" : "L", h[0], h[1]];
            break;
          }
          v.isDegenerate() ? g = [u[0] === "a" ? "l" : "L", h[0], h[1]] : g = [u[0], v.rx, v.ry, v.ax, u[4], u[5], h[0], h[1]];
          break;
        case "m":
          m = f > 0, h = a.calc(u[1], u[2], m), g = ["m", h[0], h[1]];
          break;
        default:
          for (d = u[0], g = [d], m = d.toLowerCase() === d, l = 1; l < u.length; l += 2)
            h = a.calc(u[l], u[l + 1], m), g.push(h[0], h[1]);
      }
      o.segments[f] = g;
    }, !0);
  }, s.prototype.__evaluateStack = function() {
    var a, o;
    if (this.__stack.length) {
      if (this.__stack.length === 1) {
        this.__matrix(this.__stack[0]), this.__stack = [];
        return;
      }
      for (a = t(), o = this.__stack.length; --o >= 0; )
        a.matrix(this.__stack[o].toArray());
      this.__matrix(a), this.__stack = [];
    }
  }, s.prototype.toString = function() {
    var a = "", o = "", l = !1;
    this.__evaluateStack();
    for (var u = 0, f = this.segments.length; u < f; u++) {
      var c = this.segments[u], p = c[0];
      p !== o || p === "m" || p === "M" ? (p === "m" && o === "z" && (a += " "), a += p, l = !1) : l = !0;
      for (var h = 1; h < c.length; h++) {
        var g = c[h];
        h === 1 ? l && g >= 0 && (a += " ") : g >= 0 && (a += " "), a += g;
      }
      o = p;
    }
    return a;
  }, s.prototype.translate = function(a, o) {
    return this.__stack.push(t().translate(a, o || 0)), this;
  }, s.prototype.scale = function(a, o) {
    return this.__stack.push(t().scale(a, !o && o !== 0 ? a : o)), this;
  }, s.prototype.rotate = function(a, o, l) {
    return this.__stack.push(t().rotate(a, o || 0, l || 0)), this;
  }, s.prototype.skewX = function(a) {
    return this.__stack.push(t().skewX(a)), this;
  }, s.prototype.skewY = function(a) {
    return this.__stack.push(t().skewY(a)), this;
  }, s.prototype.matrix = function(a) {
    return this.__stack.push(t().matrix(a)), this;
  }, s.prototype.transform = function(a) {
    return a.trim() ? (this.__stack.push(e(a)), this) : this;
  }, s.prototype.round = function(a) {
    var o = 0, l = 0, u = 0, f = 0, c;
    return a = a || 0, this.__evaluateStack(), this.segments.forEach(function(p) {
      var h = p[0].toLowerCase() === p[0];
      switch (p[0]) {
        case "H":
        case "h":
          h && (p[1] += u), u = p[1] - p[1].toFixed(a), p[1] = +p[1].toFixed(a);
          return;
        case "V":
        case "v":
          h && (p[1] += f), f = p[1] - p[1].toFixed(a), p[1] = +p[1].toFixed(a);
          return;
        case "Z":
        case "z":
          u = o, f = l;
          return;
        case "M":
        case "m":
          h && (p[1] += u, p[2] += f), u = p[1] - p[1].toFixed(a), f = p[2] - p[2].toFixed(a), o = u, l = f, p[1] = +p[1].toFixed(a), p[2] = +p[2].toFixed(a);
          return;
        case "A":
        case "a":
          h && (p[6] += u, p[7] += f), u = p[6] - p[6].toFixed(a), f = p[7] - p[7].toFixed(a), p[1] = +p[1].toFixed(a), p[2] = +p[2].toFixed(a), p[3] = +p[3].toFixed(a + 2), p[6] = +p[6].toFixed(a), p[7] = +p[7].toFixed(a);
          return;
        default:
          c = p.length, h && (p[c - 2] += u, p[c - 1] += f), u = p[c - 2] - p[c - 2].toFixed(a), f = p[c - 1] - p[c - 1].toFixed(a), p.forEach(function(g, d) {
            d && (p[d] = +p[d].toFixed(a));
          });
          return;
      }
    }), this;
  }, s.prototype.iterate = function(a, o) {
    var l = this.segments, u = {}, f = !1, c = 0, p = 0, h = 0, g = 0, d, m, x;
    if (o || this.__evaluateStack(), l.forEach(function(v, S) {
      var w = a(v, S, c, p);
      Array.isArray(w) && (u[S] = w, f = !0);
      var y = v[0] === v[0].toLowerCase();
      switch (v[0]) {
        case "m":
        case "M":
          c = v[1] + (y ? c : 0), p = v[2] + (y ? p : 0), h = c, g = p;
          return;
        case "h":
        case "H":
          c = v[1] + (y ? c : 0);
          return;
        case "v":
        case "V":
          p = v[1] + (y ? p : 0);
          return;
        case "z":
        case "Z":
          c = h, p = g;
          return;
        default:
          c = v[v.length - 2] + (y ? c : 0), p = v[v.length - 1] + (y ? p : 0);
      }
    }), !f)
      return this;
    for (x = [], d = 0; d < l.length; d++)
      if (typeof u[d] < "u")
        for (m = 0; m < u[d].length; m++)
          x.push(u[d][m]);
      else
        x.push(l[d]);
    return this.segments = x, this;
  }, s.prototype.abs = function() {
    return this.iterate(function(a, o, l, u) {
      var f = a[0], c = f.toUpperCase(), p;
      if (f !== c)
        switch (a[0] = c, f) {
          case "v":
            a[1] += u;
            return;
          case "a":
            a[6] += l, a[7] += u;
            return;
          default:
            for (p = 1; p < a.length; p++)
              a[p] += p % 2 ? l : u;
        }
    }, !0), this;
  }, s.prototype.rel = function() {
    return this.iterate(function(a, o, l, u) {
      var f = a[0], c = f.toLowerCase(), p;
      if (f !== c && !(o === 0 && f === "M"))
        switch (a[0] = c, f) {
          case "V":
            a[1] -= u;
            return;
          case "A":
            a[6] -= l, a[7] -= u;
            return;
          default:
            for (p = 1; p < a.length; p++)
              a[p] -= p % 2 ? l : u;
        }
    }, !0), this;
  }, s.prototype.unarc = function() {
    return this.iterate(function(a, o, l, u) {
      var f, c, p, h = [], g = a[0];
      return g !== "A" && g !== "a" ? null : (g === "a" ? (c = l + a[6], p = u + a[7]) : (c = a[6], p = a[7]), f = r(l, u, c, p, a[4], a[5], a[1], a[2], a[3]), f.length === 0 ? [[a[0] === "a" ? "l" : "L", a[6], a[7]]] : (f.forEach(function(d) {
        h.push(["C", d[2], d[3], d[4], d[5], d[6], d[7]]);
      }), h));
    }), this;
  }, s.prototype.unshort = function() {
    var a = this.segments, o, l, u, f, c;
    return this.iterate(function(p, h, g, d) {
      var m = p[0], x = m.toUpperCase(), v;
      h && (x === "T" ? (v = m === "t", u = a[h - 1], u[0] === "Q" ? (o = u[1] - g, l = u[2] - d) : u[0] === "q" ? (o = u[1] - u[3], l = u[2] - u[4]) : (o = 0, l = 0), f = -o, c = -l, v || (f += g, c += d), a[h] = [
        v ? "q" : "Q",
        f,
        c,
        p[1],
        p[2]
      ]) : x === "S" && (v = m === "s", u = a[h - 1], u[0] === "C" ? (o = u[3] - g, l = u[4] - d) : u[0] === "c" ? (o = u[3] - u[5], l = u[4] - u[6]) : (o = 0, l = 0), f = -o, c = -l, v || (f += g, c += d), a[h] = [
        v ? "c" : "C",
        f,
        c,
        p[1],
        p[2],
        p[3],
        p[4]
      ]));
    }), this;
  }, bt = s, bt;
}
var yt, Gt;
function Re() {
  return Gt || (Gt = 1, yt = Ne()), yt;
}
var _e = Re();
const Le = /* @__PURE__ */ At(_e);
var Ut = function(i) {
  var e = i, t, r = {
    a: 0,
    b: 0,
    c: 0
  }, n = [], s = /(\[[^\]]+\])/g, a = /(#[^\#\s\+>~\.\[:\)]+)/g, o = /(\.[^\s\+>~\.\[:\)]+)/g, l = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/gi, u = /(:(?!not|global|local)[\w-]+\([^\)]*\))/gi, f = /(:(?!not|global|local)[^\s\+>~\.\[:]+)/g, c = /([^\s\+>~\.\[:]+)/g;
  return t = function(p, h) {
    var g, d, m, x, v, S;
    if (p.test(e))
      for (g = e.match(p), d = 0, m = g.length; d < m; d += 1)
        r[h] += 1, x = g[d], v = e.indexOf(x), S = x.length, n.push({
          selector: i.substr(v, S),
          type: h,
          index: v,
          length: S
        }), e = e.replace(x, Array(S + 1).join(" "));
  }, (function() {
    var p = function(m) {
      var x, v, S, w;
      if (m.test(e))
        for (x = e.match(m), v = 0, S = x.length; v < S; v += 1)
          w = x[v], e = e.replace(w, Array(w.length + 1).join("A"));
    }, h = /\\[0-9A-Fa-f]{6}\s?/g, g = /\\[0-9A-Fa-f]{1,5}\s/g, d = /\\./g;
    p(h), p(g), p(d);
  })(), (function() {
    var p = /{[^]*/gm, h, g, d, m;
    if (p.test(e))
      for (h = e.match(p), g = 0, d = h.length; g < d; g += 1)
        m = h[g], e = e.replace(m, Array(m.length + 1).join(" "));
  })(), t(s, "b"), t(a, "a"), t(o, "b"), t(l, "c"), t(u, "b"), t(f, "b"), e = e.replace(/[\*\s\+>~]/g, " "), e = e.replace(/[#\.]/g, " "), e = e.replace(/:not/g, "    "), e = e.replace(/:local/g, "      "), e = e.replace(/:global/g, "       "), e = e.replace(/[\(\)]/g, " "), t(c, "c"), n.sort(function(p, h) {
    return p.index - h.index;
  }), {
    selector: i,
    specificity: "0," + r.a.toString() + "," + r.b.toString() + "," + r.c.toString(),
    specificityArray: [0, r.a, r.b, r.c],
    parts: n
  };
}, Oe = function(i, e) {
  var t, r, n;
  if (typeof i == "string") {
    if (i.indexOf(",") !== -1)
      throw "Invalid CSS selector";
    t = Ut(i).specificityArray;
  } else if (Array.isArray(i)) {
    if (i.filter(function(s) {
      return typeof s == "number";
    }).length !== 4)
      throw "Invalid specificity array";
    t = i;
  } else
    throw "Invalid CSS selector or specificity array";
  if (typeof e == "string") {
    if (e.indexOf(",") !== -1)
      throw "Invalid CSS selector";
    r = Ut(e).specificityArray;
  } else if (Array.isArray(e)) {
    if (e.filter(function(s) {
      return typeof s == "number";
    }).length !== 4)
      throw "Invalid specificity array";
    r = e;
  } else
    throw "Invalid CSS selector or specificity array";
  for (n = 0; n < 4; n += 1) {
    if (t[n] < r[n])
      return -1;
    if (t[n] > r[n])
      return 1;
  }
  return 0;
}, Ct = function(i, e) {
  return Ct = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, r) {
    t.__proto__ = r;
  } || function(t, r) {
    for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n]);
  }, Ct(i, e);
};
function M(i, e) {
  if (typeof e != "function" && e !== null) throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
  function t() {
    this.constructor = i;
  }
  Ct(i, e), i.prototype = e === null ? Object.create(e) : (t.prototype = e.prototype, new t());
}
var ot = function() {
  return ot = Object.assign || function(i) {
    for (var e, t = 1, r = arguments.length; t < r; t++) for (var n in e = arguments[t]) Object.prototype.hasOwnProperty.call(e, n) && (i[n] = e[n]);
    return i;
  }, ot.apply(this, arguments);
};
function C(i, e, t, r) {
  return new (t || (t = Promise))((function(n, s) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (f) {
        s(f);
      }
    }
    function o(u) {
      try {
        l(r.throw(u));
      } catch (f) {
        s(f);
      }
    }
    function l(u) {
      var f;
      u.done ? n(u.value) : (f = u.value, f instanceof t ? f : new t((function(c) {
        c(f);
      }))).then(a, o);
    }
    l((r = r.apply(i, e || [])).next());
  }));
}
function F(i, e) {
  var t, r, n, s = { label: 0, sent: function() {
    if (1 & n[0]) throw n[1];
    return n[1];
  }, trys: [], ops: [] }, a = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return a.next = o(0), a.throw = o(1), a.return = o(2), typeof Symbol == "function" && (a[Symbol.iterator] = function() {
    return this;
  }), a;
  function o(l) {
    return function(u) {
      return (function(f) {
        if (t) throw new TypeError("Generator is already executing.");
        for (; a && (a = 0, f[0] && (s = 0)), s; ) try {
          if (t = 1, r && (n = 2 & f[0] ? r.return : f[0] ? r.throw || ((n = r.return) && n.call(r), 0) : r.next) && !(n = n.call(r, f[1])).done) return n;
          switch (r = 0, n && (f = [2 & f[0], n.value]), f[0]) {
            case 0:
            case 1:
              n = f;
              break;
            case 4:
              return s.label++, { value: f[1], done: !1 };
            case 5:
              s.label++, r = f[1], f = [0];
              continue;
            case 7:
              f = s.ops.pop(), s.trys.pop();
              continue;
            default:
              if (n = s.trys, !((n = n.length > 0 && n[n.length - 1]) || f[0] !== 6 && f[0] !== 2)) {
                s = 0;
                continue;
              }
              if (f[0] === 3 && (!n || f[1] > n[0] && f[1] < n[3])) {
                s.label = f[1];
                break;
              }
              if (f[0] === 6 && s.label < n[1]) {
                s.label = n[1], n = f;
                break;
              }
              if (n && s.label < n[2]) {
                s.label = n[2], s.ops.push(f);
                break;
              }
              n[2] && s.ops.pop(), s.trys.pop();
              continue;
          }
          f = e.call(i, s);
        } catch (c) {
          f = [6, c], r = 0;
        } finally {
          t = n = 0;
        }
        if (5 & f[0]) throw f[1];
        return { value: f[0] ? f[1] : void 0, done: !0 };
      })([l, u]);
    };
  }
}
var O = (function() {
  function i(e) {
    if (this.a = void 0, this.r = 0, this.g = 0, this.b = 0, this.simpleColors = {}, this.colorDefs = [], this.ok = !1, e) {
      for (var t in e.charAt(0) == "#" && (e = e.substr(1, 6)), e = (e = e.replace(/ /g, "")).toLowerCase(), this.simpleColors = { aliceblue: "f0f8ff", antiquewhite: "faebd7", aqua: "00ffff", aquamarine: "7fffd4", azure: "f0ffff", beige: "f5f5dc", bisque: "ffe4c4", black: "000000", blanchedalmond: "ffebcd", blue: "0000ff", blueviolet: "8a2be2", brown: "a52a2a", burlywood: "deb887", cadetblue: "5f9ea0", chartreuse: "7fff00", chocolate: "d2691e", coral: "ff7f50", cornflowerblue: "6495ed", cornsilk: "fff8dc", crimson: "dc143c", cyan: "00ffff", darkblue: "00008b", darkcyan: "008b8b", darkgoldenrod: "b8860b", darkgray: "a9a9a9", darkgrey: "a9a9a9", darkgreen: "006400", darkkhaki: "bdb76b", darkmagenta: "8b008b", darkolivegreen: "556b2f", darkorange: "ff8c00", darkorchid: "9932cc", darkred: "8b0000", darksalmon: "e9967a", darkseagreen: "8fbc8f", darkslateblue: "483d8b", darkslategray: "2f4f4f", darkslategrey: "2f4f4f", darkturquoise: "00ced1", darkviolet: "9400d3", deeppink: "ff1493", deepskyblue: "00bfff", dimgray: "696969", dimgrey: "696969", dodgerblue: "1e90ff", feldspar: "d19275", firebrick: "b22222", floralwhite: "fffaf0", forestgreen: "228b22", fuchsia: "ff00ff", gainsboro: "dcdcdc", ghostwhite: "f8f8ff", gold: "ffd700", goldenrod: "daa520", gray: "808080", grey: "808080", green: "008000", greenyellow: "adff2f", honeydew: "f0fff0", hotpink: "ff69b4", indianred: "cd5c5c", indigo: "4b0082", ivory: "fffff0", khaki: "f0e68c", lavender: "e6e6fa", lavenderblush: "fff0f5", lawngreen: "7cfc00", lemonchiffon: "fffacd", lightblue: "add8e6", lightcoral: "f08080", lightcyan: "e0ffff", lightgoldenrodyellow: "fafad2", lightgray: "d3d3d3", lightgrey: "d3d3d3", lightgreen: "90ee90", lightpink: "ffb6c1", lightsalmon: "ffa07a", lightseagreen: "20b2aa", lightskyblue: "87cefa", lightslateblue: "8470ff", lightslategray: "778899", lightslategrey: "778899", lightsteelblue: "b0c4de", lightyellow: "ffffe0", lime: "00ff00", limegreen: "32cd32", linen: "faf0e6", magenta: "ff00ff", maroon: "800000", mediumaquamarine: "66cdaa", mediumblue: "0000cd", mediumorchid: "ba55d3", mediumpurple: "9370d8", mediumseagreen: "3cb371", mediumslateblue: "7b68ee", mediumspringgreen: "00fa9a", mediumturquoise: "48d1cc", mediumvioletred: "c71585", midnightblue: "191970", mintcream: "f5fffa", mistyrose: "ffe4e1", moccasin: "ffe4b5", navajowhite: "ffdead", navy: "000080", oldlace: "fdf5e6", olive: "808000", olivedrab: "6b8e23", orange: "ffa500", orangered: "ff4500", orchid: "da70d6", palegoldenrod: "eee8aa", palegreen: "98fb98", paleturquoise: "afeeee", palevioletred: "d87093", papayawhip: "ffefd5", peachpuff: "ffdab9", peru: "cd853f", pink: "ffc0cb", plum: "dda0dd", powderblue: "b0e0e6", purple: "800080", red: "ff0000", rosybrown: "bc8f8f", royalblue: "4169e1", saddlebrown: "8b4513", salmon: "fa8072", sandybrown: "f4a460", seagreen: "2e8b57", seashell: "fff5ee", sienna: "a0522d", silver: "c0c0c0", skyblue: "87ceeb", slateblue: "6a5acd", slategray: "708090", slategrey: "708090", snow: "fffafa", springgreen: "00ff7f", steelblue: "4682b4", tan: "d2b48c", teal: "008080", thistle: "d8bfd8", tomato: "ff6347", turquoise: "40e0d0", violet: "ee82ee", violetred: "d02090", wheat: "f5deb3", white: "ffffff", whitesmoke: "f5f5f5", yellow: "ffff00", yellowgreen: "9acd32" }, this.simpleColors) e == t && (e = this.simpleColors[t]);
      this.colorDefs = [{ re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/, example: ["rgb(123, 234, 45)", "rgb(255,234,245)"], process: function(l) {
        return [parseInt(l[1]), parseInt(l[2]), parseInt(l[3])];
      } }, { re: /^rgb\(([0-9.]+)%,\s*([0-9.]+)%,\s*([0-9.]+)%\)$/, example: ["rgb(50.5%, 25.75%, 75.5%)", "rgb(100%,0%,0%)"], process: function(l) {
        return [Math.round(2.55 * parseFloat(l[1])), Math.round(2.55 * parseFloat(l[2])), Math.round(2.55 * parseFloat(l[3]))];
      } }, { re: /^(\w{2})(\w{2})(\w{2})$/, example: ["#00ff00", "336699"], process: function(l) {
        return [parseInt(l[1], 16), parseInt(l[2], 16), parseInt(l[3], 16)];
      } }, { re: /^(\w{1})(\w{1})(\w{1})$/, example: ["#fb0", "f0f"], process: function(l) {
        return [parseInt(l[1] + l[1], 16), parseInt(l[2] + l[2], 16), parseInt(l[3] + l[3], 16)];
      } }];
      for (var r = 0; r < this.colorDefs.length; r++) {
        var n = this.colorDefs[r].re, s = this.colorDefs[r].process, a = n.exec(e);
        if (a) {
          var o = s(a);
          this.r = o[0], this.g = o[1], this.b = o[2], this.ok = !0;
        }
      }
      this.r = this.r < 0 || isNaN(this.r) ? 0 : this.r > 255 ? 255 : this.r, this.g = this.g < 0 || isNaN(this.g) ? 0 : this.g > 255 ? 255 : this.g, this.b = this.b < 0 || isNaN(this.b) ? 0 : this.b > 255 ? 255 : this.b;
    }
  }
  return i.prototype.toRGB = function() {
    return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
  }, i.prototype.toRGBA = function() {
    return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + (this.a || "1") + ")";
  }, i.prototype.toHex = function() {
    var e = this.r.toString(16), t = this.g.toString(16), r = this.b.toString(16);
    return e.length == 1 && (e = "0" + e), t.length == 1 && (t = "0" + t), r.length == 1 && (r = "0" + r), "#" + e + t + r;
  }, i.prototype.getHelpXML = function() {
    for (var e = [], t = 0; t < this.colorDefs.length; t++) for (var r = this.colorDefs[t].example, n = 0; n < r.length; n++) e[e.length] = r[n];
    for (var s in this.simpleColors) e[e.length] = s;
    var a = document.createElement("ul");
    for (a.setAttribute("id", "rgbcolor-examples"), t = 0; t < e.length; t++) try {
      var o = document.createElement("li"), l = new i(e[t]), u = document.createElement("div");
      u.style.cssText = "margin: 3px; border: 1px solid black; background:" + l.toHex() + "; color:" + l.toHex(), u.appendChild(document.createTextNode("test"));
      var f = document.createTextNode(" " + e[t] + " -> " + l.toRGB() + " -> " + l.toHex());
      o.appendChild(u), o.appendChild(f), a.appendChild(o);
    } catch {
    }
    return a;
  }, i;
})(), I = (function() {
  function i(e) {
    this.color = e;
  }
  return i.prototype.getFillData = function(e, t) {
    return C(this, void 0, void 0, (function() {
      return F(this, (function(r) {
        return [2, void 0];
      }));
    }));
  }, i;
})(), J = (function() {
  function i() {
    this.xmlSpace = "", this.whiteSpace = "", this.fill = null, this.fillOpacity = 1, this.fontFamily = "", this.fontSize = 16, this.fontStyle = "", this.fontWeight = "", this.opacity = 1, this.stroke = null, this.strokeDasharray = null, this.strokeDashoffset = 0, this.strokeLinecap = "", this.strokeLinejoin = "", this.strokeMiterlimit = 4, this.strokeOpacity = 1, this.strokeWidth = 1, this.alignmentBaseline = "", this.textAnchor = "", this.visibility = "", this.color = null, this.contextFill = null, this.contextStroke = null, this.fillRule = null;
  }
  return i.prototype.clone = function() {
    var e = new i();
    return e.xmlSpace = this.xmlSpace, e.whiteSpace = this.whiteSpace, e.fill = this.fill, e.fillOpacity = this.fillOpacity, e.fontFamily = this.fontFamily, e.fontSize = this.fontSize, e.fontStyle = this.fontStyle, e.fontWeight = this.fontWeight, e.opacity = this.opacity, e.stroke = this.stroke, e.strokeDasharray = this.strokeDasharray, e.strokeDashoffset = this.strokeDashoffset, e.strokeLinecap = this.strokeLinecap, e.strokeLinejoin = this.strokeLinejoin, e.strokeMiterlimit = this.strokeMiterlimit, e.strokeOpacity = this.strokeOpacity, e.strokeWidth = this.strokeWidth, e.textAnchor = this.textAnchor, e.alignmentBaseline = this.alignmentBaseline, e.visibility = this.visibility, e.color = this.color, e.fillRule = this.fillRule, e.contextFill = this.contextFill, e.contextStroke = this.contextStroke, e;
  }, i.default = function() {
    var e = new i();
    return e.xmlSpace = "default", e.whiteSpace = "normal", e.fill = new I(new O("rgb(0, 0, 0)")), e.fillOpacity = 1, e.fontFamily = "times", e.fontSize = 16, e.fontStyle = "normal", e.fontWeight = "normal", e.opacity = 1, e.stroke = null, e.strokeDasharray = null, e.strokeDashoffset = 0, e.strokeLinecap = "butt", e.strokeLinejoin = "miter", e.strokeMiterlimit = 4, e.strokeOpacity = 1, e.strokeWidth = 1, e.alignmentBaseline = "baseline", e.textAnchor = "start", e.visibility = "visible", e.color = new O("rgb(0, 0, 0)"), e.fillRule = "nonzero", e.contextFill = null, e.contextStroke = null, e;
  }, i.getContextColors = function(e, t) {
    t === void 0 && (t = !1);
    var r = {};
    return e.attributeState.contextFill && (r.contextFill = e.attributeState.contextFill), e.attributeState.contextStroke && (r.contextStroke = e.attributeState.contextStroke), t && e.attributeState.color && (r.color = e.attributeState.color), r;
  }, i;
})(), Y = (function() {
  function i(e, t) {
    var r, n, s;
    this.pdf = e, this.svg2pdfParameters = t.svg2pdfParameters, this.attributeState = t.attributeState ? t.attributeState.clone() : J.default(), this.viewport = t.viewport, this.refsHandler = t.refsHandler, this.styleSheets = t.styleSheets, this.textMeasure = t.textMeasure, this.transform = (r = t.transform) !== null && r !== void 0 ? r : this.pdf.unitMatrix, this.withinClipPath = (n = t.withinClipPath) !== null && n !== void 0 && n, this.withinUse = (s = t.withinUse) !== null && s !== void 0 && s;
  }
  return i.prototype.clone = function(e) {
    var t, r, n, s;
    return e === void 0 && (e = {}), new i(this.pdf, { svg2pdfParameters: this.svg2pdfParameters, attributeState: e.attributeState ? e.attributeState.clone() : this.attributeState.clone(), viewport: (t = e.viewport) !== null && t !== void 0 ? t : this.viewport, refsHandler: this.refsHandler, styleSheets: this.styleSheets, textMeasure: this.textMeasure, transform: (r = e.transform) !== null && r !== void 0 ? r : this.transform, withinClipPath: (n = e.withinClipPath) !== null && n !== void 0 ? n : this.withinClipPath, withinUse: (s = e.withinUse) !== null && s !== void 0 ? s : this.withinUse });
  }, i;
})(), ie = (function() {
  function i(e) {
    this.renderedElements = {}, this.idMap = e, this.idPrefix = String(i.instanceCounter++);
  }
  return i.prototype.getRendered = function(e, t, r) {
    return C(this, void 0, void 0, (function() {
      var n, s;
      return F(this, (function(a) {
        switch (a.label) {
          case 0:
            return n = this.generateKey(e, t), this.renderedElements.hasOwnProperty(n) ? [2, this.renderedElements[e]] : (s = this.get(e), this.renderedElements[n] = s, [4, r(s)]);
          case 1:
            return a.sent(), [2, s];
        }
      }));
    }));
  }, i.prototype.get = function(e) {
    return this.idMap[ee(e, { isIdentifier: !0 })];
  }, i.prototype.generateKey = function(e, t) {
    var r = "";
    return t && (r = ["color", "contextFill", "contextStroke"].map((function(n) {
      var s, a;
      return (a = (s = t[n]) === null || s === void 0 ? void 0 : s.toRGBA()) !== null && a !== void 0 ? a : "";
    })).join("|")), this.idPrefix + "|" + e + "|" + r;
  }, i.instanceCounter = 0, i;
})();
function zt(i, e) {
  return Math.atan2(e[1] - i[1], e[0] - i[0]);
}
var Yt = 2 / 3;
function Xt(i, e) {
  return [Yt * (e[0] - i[0]) + i[0], Yt * (e[1] - i[1]) + i[1]];
}
function tt(i) {
  var e = Math.sqrt(i[0] * i[0] + i[1] * i[1]);
  return [i[0] / e, i[1] / e];
}
function Q(i, e) {
  return tt([e[0] - i[0], e[1] - i[1]]);
}
function st(i, e) {
  return [i[0] + e[0], i[1] + e[1]];
}
function St(i, e) {
  var t = i[0], r = i[1];
  return [e.a * t + e.c * r + e.e, e.b * t + e.d * r + e.f];
}
var Z = (function() {
  function i() {
    this.segments = [];
  }
  return i.prototype.moveTo = function(e, t) {
    return this.segments.push(new E(e, t)), this;
  }, i.prototype.lineTo = function(e, t) {
    return this.segments.push(new U(e, t)), this;
  }, i.prototype.curveTo = function(e, t, r, n, s, a) {
    return this.segments.push(new q(e, t, r, n, s, a)), this;
  }, i.prototype.close = function() {
    return this.segments.push(new Ft()), this;
  }, i.prototype.transform = function(e) {
    this.segments.forEach((function(t) {
      if (t instanceof E || t instanceof U || t instanceof q) {
        var r = St([t.x, t.y], e);
        t.x = r[0], t.y = r[1];
      }
      if (t instanceof q) {
        var n = St([t.x1, t.y1], e), s = St([t.x2, t.y2], e);
        t.x1 = n[0], t.y1 = n[1], t.x2 = s[0], t.y2 = s[1];
      }
    }));
  }, i.prototype.draw = function(e) {
    var t = e.pdf;
    this.segments.forEach((function(r) {
      r instanceof E ? t.moveTo(r.x, r.y) : r instanceof U ? t.lineTo(r.x, r.y) : r instanceof q ? t.curveTo(r.x1, r.y1, r.x2, r.y2, r.x, r.y) : t.close();
    }));
  }, i;
})(), E = function(i, e) {
  this.x = i, this.y = e;
}, U = function(i, e) {
  this.x = i, this.y = e;
}, q = function(i, e, t, r, n, s) {
  this.x1 = i, this.y1 = e, this.x2 = t, this.y2 = r, this.x = n, this.y = s;
}, Ft = function() {
};
function z(i, e) {
  return e.split(",").indexOf((i.nodeName || i.tagName).toLowerCase()) >= 0;
}
function b(i, e, t, r) {
  var n;
  r === void 0 && (r = t);
  var s = (n = i.style) === null || n === void 0 ? void 0 : n.getPropertyValue(r);
  if (s) return s;
  var a = e.getPropertyValue(i, r);
  return a || i.hasAttribute(t) && i.getAttribute(t) || void 0;
}
function j(i, e, t) {
  if (b(i.element, t.styleSheets, "display") === "none") return !1;
  var r = e, n = b(i.element, t.styleSheets, "visibility");
  return n && (r = n !== "hidden"), r;
}
function X(i, e, t) {
  var r = j(i, e, t);
  return i.element.childNodes.length !== 0 && (i.children.forEach((function(n) {
    n.isVisible(r, t) && (r = !0);
  })), r);
}
var qe = (function() {
  function i() {
    this.markers = [];
  }
  return i.prototype.addMarker = function(e) {
    this.markers.push(e);
  }, i.prototype.draw = function(e) {
    return C(this, void 0, void 0, (function() {
      var t, r, n, s, a, o, l, u;
      return F(this, (function(f) {
        switch (f.label) {
          case 0:
            t = 0, f.label = 1;
          case 1:
            return t < this.markers.length ? (r = this.markers[t], n = void 0, s = r.angle, a = r.anchor, o = Math.cos(s), l = Math.sin(s), n = e.pdf.Matrix(o, l, -l, o, a[0], a[1]), n = e.pdf.matrixMult(e.pdf.Matrix(e.attributeState.strokeWidth, 0, 0, e.attributeState.strokeWidth, 0, 0), n), n = e.pdf.matrixMult(n, e.transform), e.pdf.saveGraphicsState(), u = J.getContextColors(e), [4, e.refsHandler.getRendered(r.id, u, (function(c) {
              return c.apply(e);
            }))]) : [3, 4];
          case 2:
            f.sent(), e.pdf.doFormObject(e.refsHandler.generateKey(r.id, u), n), e.pdf.restoreGraphicsState(), f.label = 3;
          case 3:
            return t++, [3, 1];
          case 4:
            return [2];
        }
      }));
    }));
  }, i;
})(), G = function(i, e, t, r) {
  r === void 0 && (r = !1), this.id = i, this.anchor = e, this.angle = t, this.isStartMarker = r;
}, Pt = /url\(["']?#([^"']+)["']?\)/, De = { bottom: "bottom", "text-bottom": "bottom", top: "top", "text-top": "top", hanging: "hanging", middle: "middle", central: "middle", center: "middle", mathematical: "middle", ideographic: "ideographic", alphabetic: "alphabetic", baseline: "alphabetic" }, $t = "http://www.w3.org/2000/svg";
function H(i, e) {
  var t;
  return (t = i && i.toString().match(/^([-0-9.]+)em$/)) ? parseFloat(t[1]) * e : (t = i && i.toString().match(/^([-0-9.]+)(px|)$/)) ? parseFloat(t[1]) : 0;
}
function ne(i) {
  return De[i] || "alphabetic";
}
function L(i) {
  for (var e, t = [], r = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g; e = r.exec(i); ) t.push(parseFloat(e[0]));
  return t;
}
function K(i, e) {
  if (i === "transparent") {
    var t = new O("rgb(0,0,0)");
    return t.a = 0, t;
  }
  if (e && i.toLowerCase() === "currentcolor") return e.color || new O("rgb(0,0,0)");
  if (e && i.toLowerCase() === "context-stroke") return e.contextStroke || new O("rgb(0,0,0)");
  if (e && i.toLowerCase() === "context-fill") return e.contextFill || new O("rgb(0,0,0)");
  var r = /\s*rgba\(((?:[^,)]*,){3}[^,)]*)\)\s*/.exec(i);
  if (r) {
    var n = L(r[1]), s = new O("rgb(" + n.slice(0, 3).join(",") + ")");
    return s.a = n[3], s;
  }
  return new O(i);
}
var V = { "sans-serif": "helvetica", verdana: "helvetica", arial: "helvetica", fixed: "courier", monospace: "courier", terminal: "courier", serif: "times", cursive: "times", fantasy: "times" }, wt, He = (wt = te.version.split("."), parseFloat(wt[0]) === 2 && parseFloat(wt[1]) === 3);
function ae(i, e) {
  return He ? e == 400 ? i == "italic" ? "italic" : "normal" : e == 700 && i !== "italic" ? "bold" : i + "" + e : e == 400 || e === "normal" ? i === "italic" ? "italic" : "normal" : e != 700 && e !== "bold" || i !== "normal" ? (e == 700 ? "bold" : e) + "" + i : "bold";
}
function Et(i, e) {
  if (b(e.element, i.styleSheets, "display") === "none") return [0, 0, 0, 0];
  var t = [];
  return e.children.forEach((function(r) {
    var n = r.getBoundingBox(i);
    if (n[0] !== 0 || n[1] !== 0 || n[2] !== 0 || n[3] !== 0) {
      var s = r.computeNodeTransform(i);
      n[0] = n[0] * s.sx + s.tx, n[1] = n[1] * s.sy + s.ty, n[2] = n[2] * s.sx, n[3] = n[3] * s.sy, t = t.length === 0 ? n : [Math.min(t[0], n[0]), Math.min(t[1], n[1]), Math.max(t[0] + t[2], n[0] + n[2]) - Math.min(t[0], n[0]), Math.max(t[1] + t[3], n[1] + n[3]) - Math.min(t[1], n[1])];
    }
  })), t.length === 0 ? [0, 0, 0, 0] : t;
}
function et(i, e) {
  var t = parseFloat, r = t(i.getAttribute("x1")) || t(b(i, e.styleSheets, "x")) || t(b(i, e.styleSheets, "cx")) - t(b(i, e.styleSheets, "r")) || 0, n = t(i.getAttribute("x2")) || r + t(b(i, e.styleSheets, "width")) || t(b(i, e.styleSheets, "cx")) + t(b(i, e.styleSheets, "r")) || 0, s = t(i.getAttribute("y1")) || t(b(i, e.styleSheets, "y")) || t(b(i, e.styleSheets, "cy")) - t(b(i, e.styleSheets, "r")) || 0, a = t(i.getAttribute("y2")) || s + t(b(i, e.styleSheets, "height")) || t(b(i, e.styleSheets, "cy")) + t(b(i, e.styleSheets, "r")) || 0;
  return [Math.min(r, n), Math.min(s, a), Math.max(r, n) - Math.min(r, n), Math.max(s, a) - Math.min(s, a)];
}
function rt(i, e, t, r, n, s, a, o) {
  o === void 0 && (o = !1);
  var l, u, f = e[0], c = e[1], p = e[2], h = e[3], g = n / p, d = s / h, m = i.getAttribute("preserveAspectRatio");
  if (m) {
    var x = m.split(" ");
    x[0] === "defer" && (x = x.slice(1)), l = x[0], u = x[1] || "meet";
  } else l = "xMidYMid", u = "meet";
  if (l !== "none" && (u === "meet" ? g = d = Math.min(g, d) : u === "slice" && (g = d = Math.max(g, d))), o) return a.pdf.Matrix(g, 0, 0, d, 0, 0);
  var v = t - f * g, S = r - c * d;
  l.indexOf("xMid") >= 0 ? v += (n - p * g) / 2 : l.indexOf("xMax") >= 0 && (v += n - p * g), l.indexOf("YMid") >= 0 ? S += (s - h * d) / 2 : l.indexOf("YMax") >= 0 && (S += s - h * d);
  var w = a.pdf.Matrix(1, 0, 0, 1, v, S), y = a.pdf.Matrix(g, 0, 0, d, 0, 0);
  return a.pdf.matrixMult(y, w);
}
function lt(i, e) {
  if (!i || i === "none") return e.pdf.unitMatrix;
  for (var t, r, n = /^[\s,]*matrix\(([^)]+)\)\s*/, s = /^[\s,]*translate\(([^)]+)\)\s*/, a = /^[\s,]*rotate\(([^)]+)\)\s*/, o = /^[\s,]*scale\(([^)]+)\)\s*/, l = /^[\s,]*skewX\(([^)]+)\)\s*/, u = /^[\s,]*skewY\(([^)]+)\)\s*/, f = e.pdf.unitMatrix; i.length > 0 && i.length !== r; ) {
    r = i.length;
    var c = n.exec(i);
    if (c && (t = L(c[1]), f = e.pdf.matrixMult(e.pdf.Matrix(t[0], t[1], t[2], t[3], t[4], t[5]), f), i = i.substr(c[0].length)), c = a.exec(i)) {
      t = L(c[1]);
      var p = Math.PI * t[0] / 180;
      if (f = e.pdf.matrixMult(e.pdf.Matrix(Math.cos(p), Math.sin(p), -Math.sin(p), Math.cos(p), 0, 0), f), t[1] || t[2]) {
        var h = e.pdf.Matrix(1, 0, 0, 1, t[1], t[2]), g = e.pdf.Matrix(1, 0, 0, 1, -t[1], -t[2]);
        f = e.pdf.matrixMult(g, e.pdf.matrixMult(f, h));
      }
      i = i.substr(c[0].length);
    }
    (c = s.exec(i)) && (t = L(c[1]), f = e.pdf.matrixMult(e.pdf.Matrix(1, 0, 0, 1, t[0], t[1] || 0), f), i = i.substr(c[0].length)), (c = o.exec(i)) && ((t = L(c[1]))[1] || (t[1] = t[0]), f = e.pdf.matrixMult(e.pdf.Matrix(t[0], 0, 0, t[1], 0, 0), f), i = i.substr(c[0].length)), (c = l.exec(i)) && (t = parseFloat(c[1]), t *= Math.PI / 180, f = e.pdf.matrixMult(e.pdf.Matrix(1, 0, Math.tan(t), 1, 0, 0), f), i = i.substr(c[0].length)), (c = u.exec(i)) && (t = parseFloat(c[1]), t *= Math.PI / 180, f = e.pdf.matrixMult(e.pdf.Matrix(1, Math.tan(t), 0, 1, 0, 0), f), i = i.substr(c[0].length));
  }
  return f;
}
var Bt = (function() {
  function i(e, t) {
    this.element = e, this.children = t, this.parent = null;
  }
  return i.prototype.setParent = function(e) {
    this.parent = e;
  }, i.prototype.getParent = function() {
    return this.parent;
  }, i.prototype.getBoundingBox = function(e) {
    return b(this.element, e.styleSheets, "display") === "none" ? [0, 0, 0, 0] : this.getBoundingBoxCore(e);
  }, i.prototype.computeNodeTransform = function(e) {
    var t = this.computeNodeTransformCore(e), r = b(this.element, e.styleSheets, "transform");
    return r ? e.pdf.matrixMult(t, lt(r, e)) : t;
  }, i;
})(), it = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.render = function(t) {
    return Promise.resolve();
  }, e.prototype.getBoundingBoxCore = function(t) {
    return [];
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e;
})(Bt), se = (function(i) {
  function e(t, r, n) {
    var s = i.call(this, r, n) || this;
    return s.pdfGradientType = t, s.contextColor = void 0, s;
  }
  return M(e, i), e.prototype.apply = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l;
      return F(this, (function(u) {
        return (r = this.element.getAttribute("id")) ? (n = this.getStops(t.styleSheets), s = 0, a = !1, n.forEach((function(f) {
          var c = f.opacity;
          c && c !== 1 && (s += c, a = !0);
        })), a && (o = new Tt({ opacity: s / n.length })), l = new ke(this.pdfGradientType, this.getCoordinates(), n, o), t.pdf.addShadingPattern(r, l), [2]) : [2];
      }));
    }));
  }, e.prototype.getStops = function(t) {
    var r = this;
    if (this.stops) return this.stops;
    if (this.contextColor === void 0) {
      this.contextColor = null;
      for (var n = this; n; ) {
        var s = b(n.element, t, "color");
        if (s) {
          this.contextColor = K(s, null);
          break;
        }
        n = n.getParent();
      }
    }
    var a = [];
    return this.children.forEach((function(o) {
      if (o.element.tagName.toLowerCase() === "stop") {
        var l = b(o.element, t, "color"), u = K(b(o.element, t, "stop-color") || "", l ? { color: K(l, null) } : { color: r.contextColor }), f = parseFloat(b(o.element, t, "stop-opacity") || "1");
        a.push({ offset: e.parseGradientOffset(o.element.getAttribute("offset") || "0"), color: [u.r, u.g, u.b], opacity: f });
      }
    })), this.stops = a;
  }, e.prototype.getBoundingBoxCore = function(t) {
    return et(this.element, t);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.parseGradientOffset = function(t) {
    var r = parseFloat(t);
    return !isNaN(r) && t.indexOf("%") >= 0 ? r / 100 : r;
  }, e;
})(it), oe = (function(i) {
  function e(t, r) {
    return i.call(this, "axial", t, r) || this;
  }
  return M(e, i), e.prototype.getCoordinates = function() {
    return [parseFloat(this.element.getAttribute("x1") || "0"), parseFloat(this.element.getAttribute("y1") || "0"), parseFloat(this.element.getAttribute("x2") || "1"), parseFloat(this.element.getAttribute("y2") || "0")];
  }, e;
})(se), le = (function(i) {
  function e(t, r) {
    return i.call(this, "radial", t, r) || this;
  }
  return M(e, i), e.prototype.getCoordinates = function() {
    var t = this.element.getAttribute("cx"), r = this.element.getAttribute("cy"), n = this.element.getAttribute("fx"), s = this.element.getAttribute("fy");
    return [parseFloat(n || t || "0.5"), parseFloat(s || r || "0.5"), 0, parseFloat(t || "0.5"), parseFloat(r || "0.5"), parseFloat(this.element.getAttribute("r") || "0.5")];
  }, e;
})(se), Ve = (function() {
  function i(e, t) {
    this.key = e, this.gradient = t;
  }
  return i.prototype.getFillData = function(e, t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s;
      return F(this, (function(a) {
        switch (a.label) {
          case 0:
            return [4, t.refsHandler.getRendered(this.key, null, (function(o) {
              return o.apply(new Y(t.pdf, { refsHandler: t.refsHandler, textMeasure: t.textMeasure, styleSheets: t.styleSheets, viewport: t.viewport, svg2pdfParameters: t.svg2pdfParameters }));
            }))];
          case 1:
            return a.sent(), this.gradient.element.hasAttribute("gradientUnits") && this.gradient.element.getAttribute("gradientUnits").toLowerCase() !== "objectboundingbox" ? r = t.pdf.unitMatrix : (n = e.getBoundingBox(t), r = t.pdf.Matrix(n[2], 0, 0, n[3], n[0], n[1])), s = lt(b(this.gradient.element, t.styleSheets, "gradientTransform", "transform"), t), [2, { key: this.key, matrix: t.pdf.matrixMult(s, r) }];
        }
      }));
    }));
  }, i;
})(), ue = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.apply = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            if (!(r = this.element.getAttribute("id"))) return [2];
            n = this.getBoundingBox(t), s = new we([n[0], n[1], n[0] + n[2], n[1] + n[3]], n[2], n[3]), t.pdf.beginTilingPattern(s), a = 0, o = this.children, l.label = 1;
          case 1:
            return a < o.length ? [4, o[a].render(new Y(t.pdf, { attributeState: t.attributeState, refsHandler: t.refsHandler, styleSheets: t.styleSheets, viewport: t.viewport, svg2pdfParameters: t.svg2pdfParameters, textMeasure: t.textMeasure }))] : [3, 4];
          case 2:
            l.sent(), l.label = 3;
          case 3:
            return a++, [3, 1];
          case 4:
            return t.pdf.endTilingPattern(r, s), [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return et(this.element, t);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e;
})(it), je = (function() {
  function i(e, t) {
    this.key = e, this.pattern = t;
  }
  return i.prototype.getFillData = function(e, t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l, u, f, c, p, h, g;
      return F(this, (function(d) {
        switch (d.label) {
          case 0:
            return [4, t.refsHandler.getRendered(this.key, null, (function(m) {
              return m.apply(new Y(t.pdf, { refsHandler: t.refsHandler, textMeasure: t.textMeasure, styleSheets: t.styleSheets, viewport: t.viewport, svg2pdfParameters: t.svg2pdfParameters }));
            }))];
          case 1:
            return d.sent(), r = { key: this.key, boundingBox: void 0, xStep: 0, yStep: 0, matrix: void 0 }, s = t.pdf.unitMatrix, this.pattern.element.hasAttribute("patternUnits") && this.pattern.element.getAttribute("patternUnits").toLowerCase() !== "objectboundingbox" || (n = e.getBoundingBox(t), s = t.pdf.Matrix(1, 0, 0, 1, n[0], n[1]), o = this.pattern.getBoundingBox(t), l = o[0] * n[0] || 0, u = o[1] * n[1] || 0, f = o[2] * n[2] || 0, c = o[3] * n[3] || 0, r.boundingBox = [l, u, l + f, u + c], r.xStep = f, r.yStep = c), a = t.pdf.unitMatrix, this.pattern.element.hasAttribute("patternContentUnits") && this.pattern.element.getAttribute("patternContentUnits").toLowerCase() === "objectboundingbox" && (n || (n = e.getBoundingBox(t)), a = t.pdf.Matrix(n[2], 0, 0, n[3], 0, 0), o = r.boundingBox || this.pattern.getBoundingBox(t), l = o[0] / n[0] || 0, u = o[1] / n[1] || 0, f = o[2] / n[2] || 0, c = o[3] / n[3] || 0, r.boundingBox = [l, u, l + f, u + c], r.xStep = f, r.yStep = c), p = t.pdf.unitMatrix, (h = b(this.pattern.element, t.styleSheets, "patternTransform", "transform")) && (p = lt(h, t)), g = a, g = t.pdf.matrixMult(g, s), g = t.pdf.matrixMult(g, p), g = t.pdf.matrixMult(g, t.transform), r.matrix = g, [2, r];
        }
      }));
    }));
  }, i;
})();
function We(i, e) {
  var t = Pt.exec(i);
  if (t) {
    var r = t[1], n = e.refsHandler.get(r);
    return n && (n instanceof oe || n instanceof le) ? (function(a, o, l) {
      var u = o.getStops(l.styleSheets);
      if (u.length === 0) return null;
      if (u.length === 1) {
        var f = u[0].color, c = new O();
        return c.ok = !0, c.r = f[0], c.g = f[1], c.b = f[2], c.a = u[0].opacity, new I(c);
      }
      return new Ve(a, o);
    })(r, n, e) : n && n instanceof ue ? new je(r, n) : new I(new O("rgb(0, 0, 0)"));
  }
  var s = K(i, e.attributeState);
  return s.ok ? new I(s) : null;
}
function It(i, e, t) {
  var r = t || e.element, n = b(r, i.styleSheets, "color");
  if (n) {
    var s = K(n, i.attributeState);
    s.ok ? i.attributeState.color = s : i.attributeState.color = new O("rgb(0,0,0)");
  }
  var a = b(r, i.styleSheets, "visibility");
  a && (i.attributeState.visibility = a);
  var o = b(r, i.styleSheets, "fill");
  o && (i.attributeState.fill = We(o, i));
  var l = b(r, i.styleSheets, "fill-opacity");
  l && (i.attributeState.fillOpacity = parseFloat(l));
  var u = b(r, i.styleSheets, "stroke-opacity");
  u && (i.attributeState.strokeOpacity = parseFloat(u));
  var f = b(r, i.styleSheets, "opacity");
  f && (i.attributeState.opacity = parseFloat(f));
  var c = b(r, i.styleSheets, "stroke-width");
  c !== void 0 && c !== "" && (i.attributeState.strokeWidth = Math.abs(parseFloat(c)));
  var p = b(r, i.styleSheets, "stroke");
  if (p) if (p === "none") i.attributeState.stroke = null;
  else {
    var h = K(p, i.attributeState);
    h.ok && (i.attributeState.stroke = new I(h));
  }
  p && i.attributeState.stroke instanceof I && (i.attributeState.contextStroke = i.attributeState.stroke.color), o && i.attributeState.fill instanceof I && (i.attributeState.contextFill = i.attributeState.fill.color);
  var g = b(r, i.styleSheets, "stroke-linecap");
  g && (i.attributeState.strokeLinecap = g);
  var d = b(r, i.styleSheets, "stroke-linejoin");
  d && (i.attributeState.strokeLinejoin = d);
  var m = b(r, i.styleSheets, "stroke-dasharray");
  if (m) {
    var x = parseInt(b(r, i.styleSheets, "stroke-dashoffset") || "0");
    i.attributeState.strokeDasharray = L(m), i.attributeState.strokeDashoffset = x;
  }
  var v = b(r, i.styleSheets, "stroke-miterlimit");
  v !== void 0 && v !== "" && (i.attributeState.strokeMiterlimit = parseFloat(v));
  var S = r.getAttribute("xml:space");
  S && (i.attributeState.xmlSpace = S);
  var w = b(r, i.styleSheets, "white-space");
  w && (i.attributeState.whiteSpace = w);
  var y = b(r, i.styleSheets, "font-weight");
  y && (i.attributeState.fontWeight = y);
  var k = b(r, i.styleSheets, "font-style");
  k && (i.attributeState.fontStyle = k);
  var B = b(r, i.styleSheets, "font-family");
  if (B) {
    var _ = Te.parse(B);
    i.attributeState.fontFamily = (function(W, ft, be) {
      var ye = ae(W.fontStyle, W.fontWeight), Se = be.pdf.getFontList(), at = "";
      return ft.some((function($) {
        var _t = Se[$];
        return _t && _t.indexOf(ye) >= 0 ? (at = $, !0) : ($ = $.toLowerCase(), !!V.hasOwnProperty($) && (at = $, !0));
      })) || (at = "times"), at;
    })(i.attributeState, _, i);
  }
  var P = b(r, i.styleSheets, "font-size");
  if (P) {
    var T = i.pdf.getFontSize();
    i.attributeState.fontSize = H(P, T);
  }
  var D = b(r, i.styleSheets, "vertical-align") || b(r, i.styleSheets, "alignment-baseline");
  if (D) {
    var A = D.match(/(baseline|text-bottom|alphabetic|ideographic|middle|central|mathematical|text-top|bottom|center|top|hanging)/);
    A && (i.attributeState.alignmentBaseline = A[0]);
  }
  var R = b(r, i.styleSheets, "text-anchor");
  R && (i.attributeState.textAnchor = R);
  var N = b(r, i.styleSheets, "fill-rule");
  N && (i.attributeState.fillRule = N);
}
function Nt(i, e, t) {
  var r = 1, n = 1;
  r *= i.attributeState.fillOpacity, r *= i.attributeState.opacity, i.attributeState.fill instanceof I && i.attributeState.fill.color.a !== void 0 && (r *= i.attributeState.fill.color.a), n *= i.attributeState.strokeOpacity, n *= i.attributeState.opacity, i.attributeState.stroke instanceof I && i.attributeState.stroke.color.a !== void 0 && (n *= i.attributeState.stroke.color.a);
  var s, a, o = r < 1, l = n < 1;
  if (z(t, "use") ? (o = !0, l = !0, r *= i.attributeState.fill ? 1 : 0, n *= i.attributeState.stroke ? 1 : 0) : i.withinUse && (i.attributeState.fill !== e.attributeState.fill ? (o = !0, r *= i.attributeState.fill ? 1 : 0) : o && !i.attributeState.fill && (r = 0), i.attributeState.stroke !== e.attributeState.stroke ? (l = !0, n *= i.attributeState.stroke ? 1 : 0) : l && !i.attributeState.stroke && (n = 0)), o || l) {
    var u = {};
    o && (u.opacity = r), l && (u["stroke-opacity"] = n), i.pdf.setGState(new Tt(u));
  }
  if (i.attributeState.fill && i.attributeState.fill !== e.attributeState.fill && i.attributeState.fill instanceof I && i.attributeState.fill.color.ok && !z(t, "text") && i.pdf.setFillColor(i.attributeState.fill.color.r, i.attributeState.fill.color.g, i.attributeState.fill.color.b), i.attributeState.strokeWidth !== e.attributeState.strokeWidth && i.pdf.setLineWidth(i.attributeState.strokeWidth), i.attributeState.stroke !== e.attributeState.stroke && i.attributeState.stroke instanceof I && i.pdf.setDrawColor(i.attributeState.stroke.color.r, i.attributeState.stroke.color.g, i.attributeState.stroke.color.b), i.attributeState.strokeLinecap !== e.attributeState.strokeLinecap && i.pdf.setLineCap(i.attributeState.strokeLinecap), i.attributeState.strokeLinejoin !== e.attributeState.strokeLinejoin && i.pdf.setLineJoin(i.attributeState.strokeLinejoin), i.attributeState.strokeDasharray === e.attributeState.strokeDasharray && i.attributeState.strokeDashoffset === e.attributeState.strokeDashoffset || !i.attributeState.strokeDasharray || i.pdf.setLineDashPattern(i.attributeState.strokeDasharray, i.attributeState.strokeDashoffset), i.attributeState.strokeMiterlimit !== e.attributeState.strokeMiterlimit && i.pdf.setLineMiterLimit(i.attributeState.strokeMiterlimit), i.attributeState.fontFamily !== e.attributeState.fontFamily && (s = V.hasOwnProperty(i.attributeState.fontFamily) ? V[i.attributeState.fontFamily] : i.attributeState.fontFamily), i.attributeState.fill && i.attributeState.fill !== e.attributeState.fill && i.attributeState.fill instanceof I && i.attributeState.fill.color.ok) {
    var f = i.attributeState.fill.color;
    i.pdf.setTextColor(f.r, f.g, f.b);
  }
  i.attributeState.fontWeight === e.attributeState.fontWeight && i.attributeState.fontStyle === e.attributeState.fontStyle || (a = ae(i.attributeState.fontStyle, i.attributeState.fontWeight)), s === void 0 && a === void 0 || (s === void 0 && (s = V.hasOwnProperty(i.attributeState.fontFamily) ? V[i.attributeState.fontFamily] : i.attributeState.fontFamily), i.pdf.setFont(s, a)), i.attributeState.fontSize !== e.attributeState.fontSize && i.pdf.setFontSize(i.attributeState.fontSize * i.pdf.internal.scaleFactor);
}
function he(i, e, t) {
  var r = Pt.exec(i);
  if (r) {
    var n = r[1];
    return t.refsHandler.get(n) || void 0;
  }
}
function fe(i, e, t) {
  return C(this, void 0, void 0, (function() {
    var r, n;
    return F(this, (function(s) {
      switch (s.label) {
        case 0:
          return r = t.clone(), e.element.hasAttribute("clipPathUnits") && e.element.getAttribute("clipPathUnits").toLowerCase() === "objectboundingbox" && (n = i.getBoundingBox(t), r.transform = t.pdf.matrixMult(t.pdf.Matrix(n[2], 0, 0, n[3], n[0], n[1]), t.transform)), [4, e.apply(r)];
        case 1:
          return s.sent(), [2];
      }
    }));
  }));
}
var ce = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.render = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a;
      return F(this, (function(o) {
        switch (o.label) {
          case 0:
            return this.isVisible(t.attributeState.visibility !== "hidden", t) ? ((r = t.clone()).transform = r.pdf.matrixMult(this.computeNodeTransform(r), t.transform), It(r, this), n = b(this.element, r.styleSheets, "clip-path"), (s = n && n !== "none") ? (a = he(n, 0, r)) ? a.isVisible(!0, r) ? (r.pdf.saveGraphicsState(), [4, fe(this, a, r)]) : [3, 2] : [3, 4] : [3, 5]) : [2];
          case 1:
            return o.sent(), [3, 3];
          case 2:
            return [2];
          case 3:
            return [3, 5];
          case 4:
            s = !1, o.label = 5;
          case 5:
            return r.withinClipPath || r.pdf.saveGraphicsState(), Nt(r, t, this.element), [4, this.renderCore(r)];
          case 6:
            return o.sent(), r.withinClipPath || r.pdf.restoreGraphicsState(), s && r.pdf.restoreGraphicsState(), [2];
        }
      }));
    }));
  }, e;
})(Bt), ut = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e;
})(ce), nt = (function(i) {
  function e(t, r, n) {
    var s = i.call(this, r, n) || this;
    return s.cachedPath = null, s.hasMarkers = t, s;
  }
  return M(e, i), e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r;
      return F(this, (function(n) {
        switch (n.label) {
          case 0:
            return (r = this.getCachedPath(t)) === null || r.segments.length === 0 ? [2] : (t.withinClipPath ? r.transform(t.transform) : t.pdf.setCurrentTransformationMatrix(t.transform), r.draw(t), [4, this.fillOrStroke(t)]);
          case 1:
            return n.sent(), this.hasMarkers ? [4, this.drawMarkers(t, r)] : [3, 3];
          case 2:
            n.sent(), n.label = 3;
          case 3:
            return [2];
        }
      }));
    }));
  }, e.prototype.getCachedPath = function(t) {
    return this.cachedPath || (this.cachedPath = this.getPath(t));
  }, e.prototype.drawMarkers = function(t, r) {
    return C(this, void 0, void 0, (function() {
      return F(this, (function(n) {
        switch (n.label) {
          case 0:
            return [4, this.getMarkers(r, t).draw(t.clone({ transform: t.pdf.unitMatrix }))];
          case 1:
            return n.sent(), [2];
        }
      }));
    }));
  }, e.prototype.fillOrStroke = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            return t.withinClipPath ? [2] : (r = t.attributeState.fill, n = t.attributeState.stroke && t.attributeState.strokeWidth !== 0, r ? [4, r.getFillData(this, t)] : [3, 2]);
          case 1:
            return a = l.sent(), [3, 3];
          case 2:
            a = void 0, l.label = 3;
          case 3:
            return s = a, o = t.attributeState.fillRule === "evenodd", r && n || t.withinUse ? o ? t.pdf.fillStrokeEvenOdd(s) : t.pdf.fillStroke(s) : r ? o ? t.pdf.fillEvenOdd(s) : t.pdf.fill(s) : n ? t.pdf.stroke() : t.pdf.discardPath(), [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    var r = this.getCachedPath(t);
    if (!r || !r.segments.length) return [0, 0, 0, 0];
    for (var n = Number.POSITIVE_INFINITY, s = Number.POSITIVE_INFINITY, a = Number.NEGATIVE_INFINITY, o = Number.NEGATIVE_INFINITY, l = 0, u = 0, f = 0; f < r.segments.length; f++) {
      var c = r.segments[f];
      (c instanceof E || c instanceof U || c instanceof q) && (l = c.x, u = c.y), c instanceof q ? (n = Math.min(n, l, c.x1, c.x2, c.x), a = Math.max(a, l, c.x1, c.x2, c.x), s = Math.min(s, u, c.y1, c.y2, c.y), o = Math.max(o, u, c.y1, c.y2, c.y)) : (n = Math.min(n, l), a = Math.max(a, l), s = Math.min(s, u), o = Math.max(o, u));
    }
    return [n, s, a - n, o - s];
  }, e.prototype.getMarkers = function(t, r) {
    var n = b(this.element, r.styleSheets, "marker-start"), s = b(this.element, r.styleSheets, "marker-mid"), a = b(this.element, r.styleSheets, "marker-end"), o = new qe();
    if (n || s || a) {
      a && (a = kt(a)), n && (n = kt(n)), s && (s = kt(s));
      for (var l = t.segments, u = [1, 0], f = void 0, c = !1, p = [1, 0], h = !1, g = function(m) {
        var x = l[m], v = n && (m === 1 || !(l[m] instanceof E) && l[m - 1] instanceof E);
        v && l.forEach((function(_, P) {
          if (!h && _ instanceof Ft && P > m) {
            var T = l[P - 1];
            h = (T instanceof E || T instanceof U || T instanceof q) && T;
          }
        }));
        var S = a && (m === l.length - 1 || !(l[m] instanceof E) && l[m + 1] instanceof E), w = s && m > 0 && !(m === 1 && l[m - 1] instanceof E), y = l[m - 1] || null;
        if (y instanceof E || y instanceof U || y instanceof q)
          if (x instanceof q) v && o.addMarker(new G(n, [y.x, y.y], zt(h ? [h.x, h.y] : [y.x, y.y], [x.x1, x.y1]), !0)), S && o.addMarker(new G(a, [x.x, x.y], zt([x.x2, x.y2], [x.x, x.y]))), w && (f = Q([y.x, y.y], [x.x1, x.y1]), f = y instanceof E ? f : tt(st(u, f)), o.addMarker(new G(s, [y.x, y.y], Math.atan2(f[1], f[0])))), u = Q([x.x2, x.y2], [x.x, x.y]);
          else if (x instanceof E || x instanceof U) {
            if (f = Q([y.x, y.y], [x.x, x.y]), v) {
              var k = h ? Q([h.x, h.y], [x.x, x.y]) : f;
              o.addMarker(new G(n, [y.x, y.y], Math.atan2(k[1], k[0]), !0));
            }
            S && o.addMarker(new G(a, [x.x, x.y], Math.atan2(f[1], f[0]))), w && (k = x instanceof E ? u : y instanceof E ? f : tt(st(u, f)), o.addMarker(new G(s, [y.x, y.y], Math.atan2(k[1], k[0])))), u = f;
          } else x instanceof Ft && (f = Q([y.x, y.y], [c.x, c.y]), w && (k = y instanceof E ? f : tt(st(u, f)), o.addMarker(new G(s, [y.x, y.y], Math.atan2(k[1], k[0])))), S && (k = tt(st(f, p)), o.addMarker(new G(a, [c.x, c.y], Math.atan2(k[1], k[0])))), u = f);
        else {
          c = x instanceof E && x;
          var B = l[m + 1];
          (B instanceof E || B instanceof U || B instanceof q) && (p = Q([c.x, c.y], [B.x, B.y]));
        }
      }, d = 0; d < l.length; d++) g(d);
    }
    return o.markers.forEach((function(m) {
      var x = r.refsHandler.get(m.id);
      if (x) {
        var v = b(x.element, r.styleSheets, "orient");
        v != null && (m.isStartMarker && v === "auto-start-reverse" && (m.angle += Math.PI), isNaN(Number(v)) || (m.angle = parseFloat(v) / 180 * Math.PI));
      }
    })), o;
  }, e;
})(ut);
function kt(i) {
  var e = Pt.exec(i);
  return e && e[1] || void 0;
}
var Ge = (function(i) {
  function e(t, r) {
    return i.call(this, !0, t, r) || this;
  }
  return M(e, i), e.prototype.getPath = function(t) {
    if (t.withinClipPath || t.attributeState.stroke === null) return null;
    var r = parseFloat(this.element.getAttribute("x1") || "0"), n = parseFloat(this.element.getAttribute("y1") || "0"), s = parseFloat(this.element.getAttribute("x2") || "0"), a = parseFloat(this.element.getAttribute("y2") || "0");
    return r || s || n || a ? new Z().moveTo(r, n).lineTo(s, a) : null;
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e.prototype.fillOrStroke = function(t) {
    return C(this, void 0, void 0, (function() {
      return F(this, (function(r) {
        switch (r.label) {
          case 0:
            return t.attributeState.fill = null, [4, i.prototype.fillOrStroke.call(this, t)];
          case 1:
            return r.sent(), [2];
        }
      }));
    }));
  }, e;
})(nt), pe = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.apply = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            return this.isVisible(t.attributeState.visibility !== "hidden", t) ? ((r = t.clone()).transform = r.pdf.unitMatrix, It(r, this), n = b(this.element, r.styleSheets, "clip-path"), n && n !== "none" && (s = he(n, 0, r)) ? s.isVisible(!0, r) ? [4, fe(this, s, r)] : [3, 2] : [3, 3]) : [2];
          case 1:
            return l.sent(), [3, 3];
          case 2:
            return [2];
          case 3:
            Nt(r, t, this.element), a = 0, o = this.children, l.label = 4;
          case 4:
            return a < o.length ? [4, o[a].render(r)] : [3, 7];
          case 5:
            l.sent(), l.label = 6;
          case 6:
            return a++, [3, 4];
          case 7:
            return [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return Et(t, this);
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.prototype.computeNodeTransformCore = function(t) {
    var r = parseFloat(b(this.element, t.styleSheets, "x") || "0"), n = parseFloat(b(this.element, t.styleSheets, "y") || "0"), s = this.element.getAttribute("viewBox");
    if (s) {
      var a = L(s), o = parseFloat(b(this.element, t.styleSheets, "width") || b(this.element.ownerSVGElement, t.styleSheets, "width") || s[2]), l = parseFloat(b(this.element, t.styleSheets, "height") || b(this.element.ownerSVGElement, t.styleSheets, "height") || s[3]);
      return rt(this.element, a, r, n, o, l, t);
    }
    return t.pdf.Matrix(1, 0, 0, 1, r, n);
  }, e;
})(it), ht = function(i, e) {
  this.width = i, this.height = e;
}, Ue = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l, u, f, c, p, h, g, d;
      return F(this, (function(m) {
        switch (m.label) {
          case 0:
            return r = parseFloat, (n = this.element.getAttribute("href") || this.element.getAttribute("xlink:href")) ? (s = n.substring(1), a = t.refsHandler.get(s), o = z(a.element, "symbol,svg") && a.element.hasAttribute("viewBox"), l = r(b(this.element, t.styleSheets, "x") || "0"), u = r(b(this.element, t.styleSheets, "y") || "0"), f = void 0, c = void 0, o ? (f = r(b(this.element, t.styleSheets, "width") || b(a.element, t.styleSheets, "width") || "0"), c = r(b(this.element, t.styleSheets, "height") || b(a.element, t.styleSheets, "height") || "0"), l += r(b(a.element, t.styleSheets, "x") || "0"), u += r(b(a.element, t.styleSheets, "y") || "0"), h = L(a.element.getAttribute("viewBox")), p = rt(a.element, h, l, u, f, c, t)) : p = t.pdf.Matrix(1, 0, 0, 1, l, u), g = J.getContextColors(t, !0), d = new Y(t.pdf, { refsHandler: t.refsHandler, styleSheets: t.styleSheets, withinUse: !0, viewport: o ? new ht(f, c) : t.viewport, svg2pdfParameters: t.svg2pdfParameters, textMeasure: t.textMeasure, attributeState: Object.assign(J.default(), g) }), [4, t.refsHandler.getRendered(s, g, (function(x) {
              return e.renderReferencedNode(x, s, d);
            }))]) : [2];
          case 1:
            return m.sent(), t.pdf.saveGraphicsState(), t.pdf.setCurrentTransformationMatrix(t.transform), o && b(a.element, t.styleSheets, "overflow") !== "visible" && (t.pdf.rect(l, u, f, c), t.pdf.clip().discardPath()), t.pdf.doFormObject(t.refsHandler.generateKey(s, g), p), t.pdf.restoreGraphicsState(), [2];
        }
      }));
    }));
  }, e.renderReferencedNode = function(t, r, n) {
    return C(this, void 0, void 0, (function() {
      var s;
      return F(this, (function(a) {
        switch (a.label) {
          case 0:
            return s = [(s = t.getBoundingBox(n))[0] - 0.5 * s[2], s[1] - 0.5 * s[3], 2 * s[2], 2 * s[3]], n.pdf.beginFormObject(s[0], s[1], s[2], s[3], n.pdf.unitMatrix), t instanceof pe ? [4, t.apply(n)] : [3, 2];
          case 1:
            return a.sent(), [3, 4];
          case 2:
            return [4, t.render(n)];
          case 3:
            a.sent(), a.label = 4;
          case 4:
            return n.pdf.endFormObject(n.refsHandler.generateKey(r, n.attributeState)), [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return et(this.element, t);
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e;
})(ut), ze = (function(i) {
  function e(t, r) {
    return i.call(this, !1, t, r) || this;
  }
  return M(e, i), e.prototype.getPath = function(t) {
    var r = parseFloat(b(this.element, t.styleSheets, "width") || "0"), n = parseFloat(b(this.element, t.styleSheets, "height") || "0");
    if (!isFinite(r) || r <= 0 || !isFinite(n) || n <= 0) return null;
    var s = b(this.element, t.styleSheets, "rx"), a = b(this.element, t.styleSheets, "ry"), o = Math.min(parseFloat(s || a || "0"), 0.5 * r), l = Math.min(parseFloat(a || s || "0"), 0.5 * n), u = parseFloat(b(this.element, t.styleSheets, "x") || "0"), f = parseFloat(b(this.element, t.styleSheets, "y") || "0"), c = 4 / 3 * (Math.SQRT2 - 1);
    return o === 0 && l === 0 ? new Z().moveTo(u, f).lineTo(u + r, f).lineTo(u + r, f + n).lineTo(u, f + n).close() : new Z().moveTo(u += o, f).lineTo(u += r - 2 * o, f).curveTo(u + o * c, f, u + o, f + (l - l * c), u += o, f += l).lineTo(u, f += n - 2 * l).curveTo(u, f + l * c, u - o * c, f + l, u -= o, f += l).lineTo(u += 2 * o - r, f).curveTo(u - o * c, f, u - o, f - l * c, u -= o, f -= l).lineTo(u, f += 2 * l - n).curveTo(u, f - l * c, u + o * c, f - l, u += o, f -= l).close();
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e;
})(nt), de = (function(i) {
  function e(t, r) {
    return i.call(this, !1, t, r) || this;
  }
  return M(e, i), e.prototype.getPath = function(t) {
    var r = this.getRx(t), n = this.getRy(t);
    if (!isFinite(r) || n <= 0 || !isFinite(n) || n <= 0) return null;
    var s = parseFloat(b(this.element, t.styleSheets, "cx") || "0"), a = parseFloat(b(this.element, t.styleSheets, "cy") || "0"), o = 4 / 3 * (Math.SQRT2 - 1) * r, l = 4 / 3 * (Math.SQRT2 - 1) * n;
    return new Z().moveTo(s + r, a).curveTo(s + r, a - l, s + o, a - n, s, a - n).curveTo(s - o, a - n, s - r, a - l, s - r, a).curveTo(s - r, a + l, s - o, a + n, s, a + n).curveTo(s + o, a + n, s + r, a + l, s + r, a);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e;
})(nt), Ye = (function(i) {
  function e(t, r) {
    return i.call(this, t, r) || this;
  }
  return M(e, i), e.prototype.getRx = function(t) {
    return parseFloat(b(this.element, t.styleSheets, "rx") || "0");
  }, e.prototype.getRy = function(t) {
    return parseFloat(b(this.element, t.styleSheets, "ry") || "0");
  }, e;
})(de);
function ge(i) {
  var e = "invisible", t = i.stroke && i.strokeWidth !== 0, r = i.fill;
  return r && t ? e = "fillThenStroke" : r ? e = "fill" : t && (e = "stroke"), e;
}
function Qt(i) {
  return i.replace(/[\n\r]/g, "");
}
function Kt(i) {
  return i.replace(/[\t]/g, " ");
}
function Jt(i) {
  return i.replace(/ +/g, " ");
}
function Zt(i, e, t) {
  switch (b(i, t.styleSheets, "text-transform")) {
    case "uppercase":
      return e.toUpperCase();
    case "lowercase":
      return e.toLowerCase();
    default:
      return e;
  }
}
var Mt = (function() {
  function i(e, t, r, n) {
    this.textNode = e, this.texts = [], this.textNodes = [], this.contexts = [], this.textAnchor = t, this.originX = r, this.originY = n, this.textMeasures = [];
  }
  return i.prototype.setX = function(e) {
    this.originX = e;
  }, i.prototype.setY = function(e) {
    this.originY = e;
  }, i.prototype.add = function(e, t, r) {
    this.texts.push(t), this.textNodes.push(e), this.contexts.push(r);
  }, i.prototype.rightTrimText = function() {
    for (var e = this.texts.length - 1; e >= 0; e--)
      if (this.contexts[e].attributeState.xmlSpace === "preserve" || this.contexts[e].attributeState.whiteSpace === "pre" || (this.texts[e] = this.texts[e].replace(/\s+$/, "")), this.texts[e].match(/[^\s]/)) return !1;
    return !0;
  }, i.prototype.measureText = function(e) {
    for (var t = 0; t < this.texts.length; t++) this.textMeasures.push({ width: e.textMeasure.measureTextWidth(this.texts[t], this.contexts[t].attributeState), length: this.texts[t].length });
  }, i.prototype.put = function(e, t) {
    var r, n, s, a, o = [], l = [], u = [], f = this.originX, c = this.originY, p = f, h = f;
    for (r = 0; r < this.textNodes.length; r++) {
      n = this.textNodes[r], s = this.contexts[r], a = this.textMeasures[r] || { width: e.textMeasure.measureTextWidth(this.texts[r], this.contexts[r].attributeState), length: this.texts[r].length };
      var g = f, d = c;
      if (n.nodeName !== "#text" && !o.includes(n)) {
        o.push(n);
        var m = i.resolveRelativePositionAttribute(n, "dx");
        m !== null && (g += H(m, s.attributeState.fontSize));
        var x = i.resolveRelativePositionAttribute(n, "dy");
        x !== null && (d += H(x, s.attributeState.fontSize));
      }
      l[r] = g, u[r] = d, f = g + a.width + a.length * t, c = d, p = Math.min(p, g), h = Math.max(h, f);
    }
    var v = 0;
    switch (this.textAnchor) {
      case "start":
        v = 0;
        break;
      case "middle":
        v = (h - p) / 2;
        break;
      case "end":
        v = h - p;
    }
    for (r = 0; r < this.textNodes.length; r++) if (n = this.textNodes[r], s = this.contexts[r], n.nodeName === "#text" || s.attributeState.visibility !== "hidden") {
      e.pdf.saveGraphicsState(), Nt(s, e, n);
      var S = s.attributeState.alignmentBaseline, w = ge(s.attributeState);
      e.pdf.text(this.texts[r], l[r] - v, u[r], { baseline: ne(S), angle: e.transform, renderingMode: w === "fill" ? void 0 : w, charSpace: t === 0 ? void 0 : t }), e.pdf.restoreGraphicsState();
    }
    return [f, c];
  }, i.resolveRelativePositionAttribute = function(e, t) {
    for (var r, n = e; n && z(n, "tspan"); ) {
      if (n.hasAttribute(t)) return n.getAttribute(t);
      if (((r = e.parentElement) === null || r === void 0 ? void 0 : r.firstChild) !== e) break;
      n = n.parentElement;
    }
    return null;
  }, i;
})(), Xe = (function(i) {
  function e() {
    var t = i !== null && i.apply(this, arguments) || this;
    return t.boundingBox = [], t;
  }
  return M(e, i), e.prototype.processTSpans = function(t, r, n, s, a, o) {
    for (var l = n.pdf.getFontSize(), u = n.attributeState.xmlSpace === "preserve" || n.attributeState.whiteSpace === "pre", f = !0, c = !1, p = 0; p < r.childNodes.length; p++) {
      var h = r.childNodes[p];
      if (h.textContent) {
        var g = h.textContent;
        if (h.nodeName === "#text") {
          var d = Qt(g);
          d = Kt(d), u || (d = Jt(d), f && d.match(/^\s/) && (c = !0), d.match(/[^\s]/) && (f = !1), o.prevText.match(/\s$/) && (d = d.replace(/^\s+/, "")));
          var m = Zt(r, d, n);
          a.add(r, m, n), o.prevText = g, o.prevContext = n;
        } else if (!z(h, "title")) {
          if (z(h, "tspan")) {
            var x = h, v = x.getAttribute("x");
            if (v !== null) {
              var S = H(v, l);
              a = new Mt(this, b(x, n.styleSheets, "text-anchor") || n.attributeState.textAnchor, S, 0), s.push({ type: "y", chunk: a });
            }
            var w = x.getAttribute("y");
            if (w !== null) {
              var y = H(w, l);
              a = new Mt(this, b(x, n.styleSheets, "text-anchor") || n.attributeState.textAnchor, 0, y), s.push({ type: "x", chunk: a });
            }
            var k = n.clone();
            It(k, t, x), this.processTSpans(t, x, k, s, a, o);
          }
        }
      }
    }
    return c;
  }, e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l, u, f, c, p, h, g, d, m, x, v, S, w, y, k, B, _, P, T;
      return F(this, (function(D) {
        if (t.pdf.saveGraphicsState(), r = 0, n = 0, s = 1, a = t.pdf.getFontSize(), o = H(this.element.getAttribute("x"), a), l = H(this.element.getAttribute("y"), a), u = H(this.element.getAttribute("dx"), a), f = H(this.element.getAttribute("dy"), a), c = parseFloat(this.element.getAttribute("textLength") || "0"), p = t.attributeState.visibility, this.element.childElementCount === 0) h = this.element.textContent || "", g = (function(A, R) {
          return A = Kt(A = Qt(A)), R.xmlSpace === "preserve" || R.whiteSpace === "pre" || (A = Jt(A = A.trim())), A;
        })(h, t.attributeState), d = Zt(this.element, g, t), r = t.textMeasure.getTextOffset(d, t.attributeState), c > 0 && (m = t.textMeasure.measureTextWidth(d, t.attributeState), !(t.attributeState.xmlSpace === "preserve" || t.attributeState.whiteSpace === "pre") && h.match(/^\s/) && (s = 0), n = (c - m) / (d.length - s) || 0), p === "visible" && (x = t.attributeState.alignmentBaseline, v = ge(t.attributeState), t.pdf.text(d, o + u - r, l + f, { baseline: ne(x), angle: t.transform, renderingMode: v === "fill" ? void 0 : v, charSpace: n === 0 ? void 0 : n }), S = l + f + 0.1 * a, this.boundingBox = [o + u - r, S - a, t.textMeasure.measureTextWidth(d, t.attributeState), a]);
        else {
          for (w = [], y = new Mt(this, t.attributeState.textAnchor, o + u, l + f), w.push({ type: "", chunk: y }), k = this.processTSpans(this, this.element, t, w, y, { prevText: " ", prevContext: t }), s = k ? 0 : 1, B = !0, _ = w.length - 1; _ >= 0; _--) B && (B = w[_].chunk.rightTrimText());
          c > 0 && (P = 0, T = 0, w.forEach((function(A) {
            var R = A.chunk;
            R.measureText(t), R.textMeasures.forEach((function(N) {
              var W = N.width, ft = N.length;
              P += W, T += ft;
            }));
          })), n = (c - P) / (T - s)), w.reduce((function(A, R) {
            var N = R.type, W = R.chunk;
            return N === "x" ? W.setX(A[0]) : N === "y" && W.setY(A[1]), W.put(t, n);
          }), [0, 0]);
        }
        return t.pdf.restoreGraphicsState(), [2];
      }));
    }));
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.prototype.getBoundingBoxCore = function(t) {
    return this.boundingBox.length > 0 ? this.boundingBox : et(this.element, t);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e;
})(ut), $e = (function(i) {
  function e(t, r) {
    return i.call(this, !0, t, r) || this;
  }
  return M(e, i), e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e.prototype.getPath = function(t) {
    var r, n, s = new Le(b(this.element, t.styleSheets, "d") || "").unshort().unarc().abs(), a = new Z();
    return s.iterate((function(o) {
      switch (o[0]) {
        case "M":
          a.moveTo(o[1], o[2]);
          break;
        case "L":
          a.lineTo(o[1], o[2]);
          break;
        case "H":
          a.lineTo(o[1], n);
          break;
        case "V":
          a.lineTo(r, o[1]);
          break;
        case "C":
          a.curveTo(o[1], o[2], o[3], o[4], o[5], o[6]);
          break;
        case "Q":
          var l = Xt([r, n], [o[1], o[2]]), u = Xt([o[3], o[4]], [o[1], o[2]]);
          a.curveTo(l[0], l[1], u[0], u[1], o[3], o[4]);
          break;
        case "Z":
          a.close();
      }
      switch (o[0]) {
        case "M":
        case "L":
          r = o[1], n = o[2];
          break;
        case "H":
          r = o[1];
          break;
        case "V":
          n = o[1];
          break;
        case "C":
          r = o[5], n = o[6];
          break;
        case "Q":
          r = o[3], n = o[4];
      }
    })), a;
  }, e;
})(nt), Qe = /^\s*data:(([^/,;]+\/[^/,;]+)(?:;([^,;=]+=[^,;=]+))?)?(?:;(base64))?,((?:.|\s)*)$/i, Ke = (function(i) {
  function e(t, r, n) {
    var s = i.call(this, t, r) || this;
    return s.imageLoadingPromise = null, s.imageUrl = s.element.getAttribute("xlink:href") || s.element.getAttribute("href"), s.imageUrl && e.shouldLoadImage(s.imageUrl, n.svg2pdfParameters.loadImages) && (s.imageLoadingPromise = e.fetchImageData(s.imageUrl)), s;
  }
  return M(e, i), e.shouldLoadImage = function(t, r) {
    return r !== !1 && (!(r instanceof RegExp) || (r.lastIndex = 0, r.test(t)));
  }, e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l, u, f, c, p, h, g, d, m, x, v, S, w, y;
      return F(this, (function(k) {
        switch (k.label) {
          case 0:
            return this.imageLoadingPromise ? (t.pdf.setCurrentTransformationMatrix(t.transform), r = parseFloat(b(this.element, t.styleSheets, "width") || "0"), n = parseFloat(b(this.element, t.styleSheets, "height") || "0"), s = parseFloat(b(this.element, t.styleSheets, "x") || "0"), a = parseFloat(b(this.element, t.styleSheets, "y") || "0"), !isFinite(r) || r <= 0 || !isFinite(n) || n <= 0 ? [2] : [4, this.imageLoadingPromise]) : [2];
          case 1:
            return o = k.sent(), l = o.data, (u = o.format).indexOf("svg") !== 0 ? [3, 3] : (f = new DOMParser(), c = f.parseFromString(l, "image/svg+xml").firstElementChild, (!(p = this.element.getAttribute("preserveAspectRatio")) || p.indexOf("defer") < 0 || !c.getAttribute("preserveAspectRatio")) && c.setAttribute("preserveAspectRatio", p || ""), c.setAttribute("x", String(s)), c.setAttribute("y", String(a)), c.setAttribute("width", String(r)), c.setAttribute("height", String(n)), h = {}, g = new Y(t.pdf, { refsHandler: new ie(h), styleSheets: t.styleSheets, viewport: new ht(r, n), svg2pdfParameters: t.svg2pdfParameters, textMeasure: t.textMeasure }), [4, Rt(c, g, h).render(g)]);
          case 2:
            return k.sent(), [2];
          case 3:
            d = "data:image/".concat(u, ";base64,").concat(btoa(l)), k.label = 4;
          case 4:
            return k.trys.push([4, 6, , 7]), [4, e.getImageDimensions(d)];
          case 5:
            return m = k.sent(), x = m[0], v = m[1], S = [0, 0, x, v], w = rt(this.element, S, s, a, r, n, t), t.pdf.setCurrentTransformationMatrix(w), t.pdf.addImage(d, "", 0, 0, x, v), [3, 7];
          case 6:
            return y = k.sent(), typeof console == "object" && console.warn && console.warn("Could not load image ".concat(this.imageUrl, `. 
`).concat(y)), [3, 7];
          case 7:
            return [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return et(this.element, t);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e.fetchImageData = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            if (!(s = t.match(Qe))) return [3, 1];
            if (a = s[2], (o = a.split("/"))[0] !== "image") throw new Error("Unsupported image URL: ".concat(t));
            return n = o[1], r = s[5], s[4] === "base64" ? (r = r.replace(/\s/g, ""), r = atob(r)) : r = decodeURIComponent(r), [3, 3];
          case 1:
            return [4, e.fetchImage(t)];
          case 2:
            r = l.sent(), n = t.substring(t.lastIndexOf(".") + 1), l.label = 3;
          case 3:
            return [2, { data: r, format: n }];
        }
      }));
    }));
  }, e.fetchImage = function(t) {
    return new Promise((function(r, n) {
      var s = new XMLHttpRequest();
      s.open("GET", t, !0), s.responseType = "arraybuffer", s.onload = function() {
        if (s.status !== 200) throw new Error("Error ".concat(s.status, ": Failed to load image '").concat(t, "'"));
        for (var a = new Uint8Array(s.response), o = "", l = 0; l < a.length; l++) o += String.fromCharCode(a[l]);
        r(o);
      }, s.onerror = n, s.onabort = n, s.send(null);
    }));
  }, e.getMimeType = function(t) {
    switch (t = t.toLowerCase()) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      default:
        return "image/".concat(t);
    }
  }, e.getImageDimensions = function(t) {
    return new Promise((function(r, n) {
      var s = new Image();
      s.onload = function() {
        r([s.width, s.height]);
      }, s.onerror = n, s.src = t;
    }));
  }, e;
})(ut), ve = (function(i) {
  function e(t, r, n) {
    var s = i.call(this, !0, r, n) || this;
    return s.closed = t, s;
  }
  return M(e, i), e.prototype.getPath = function(t) {
    if (!this.element.hasAttribute("points") || this.element.getAttribute("points") === "") return null;
    var r = e.parsePointsString(this.element.getAttribute("points")), n = new Z();
    if (r.length < 1) return n;
    n.moveTo(r[0][0], r[0][1]);
    for (var s = 1; s < r.length; s++) n.lineTo(r[s][0], r[s][1]);
    return this.closed && n.close(), n;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.parsePointsString = function(t) {
    for (var r = L(t), n = [], s = 0; s < r.length - 1; s += 2) {
      var a = r[s], o = r[s + 1];
      n.push([a, o]);
    }
    return n;
  }, e;
})(nt), Je = (function(i) {
  function e(t, r) {
    return i.call(this, !0, t, r) || this;
  }
  return M(e, i), e;
})(ve), Ze = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.render = function(t) {
    return Promise.resolve();
  }, e.prototype.getBoundingBoxCore = function(t) {
    return [0, 0, 0, 0];
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e.prototype.isVisible = function(t, r) {
    return j(this, t, r);
  }, e;
})(Bt), tr = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.apply = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o, l;
      return F(this, (function(u) {
        switch (u.label) {
          case 0:
            r = this.computeNodeTransform(t), n = this.getBoundingBox(t), t.pdf.beginFormObject(n[0], n[1], n[2], n[3], r), s = J.getContextColors(t), (function(f) {
              var c = f.attributeState, p = f.pdf, h = 1, g = 1;
              h *= c.fillOpacity, h *= c.opacity, c.fill instanceof I && c.fill.color.a !== void 0 && (h *= c.fill.color.a), g *= c.strokeOpacity, g *= c.opacity, c.stroke instanceof I && c.stroke.color.a !== void 0 && (g *= c.stroke.color.a);
              var d, m = {};
              if (m.opacity = h, m["stroke-opacity"] = g, p.setGState(new Tt(m)), c.fill && c.fill instanceof I && c.fill.color.ok ? p.setFillColor(c.fill.color.r, c.fill.color.g, c.fill.color.b) : p.setFillColor(0, 0, 0), p.setLineWidth(c.strokeWidth), c.stroke instanceof I ? p.setDrawColor(c.stroke.color.r, c.stroke.color.g, c.stroke.color.b) : p.setDrawColor(0, 0, 0), p.setLineCap(c.strokeLinecap), p.setLineJoin(c.strokeLinejoin), c.strokeDasharray ? p.setLineDashPattern(c.strokeDasharray, c.strokeDashoffset) : p.setLineDashPattern([], 0), p.setLineMiterLimit(c.strokeMiterlimit), d = V.hasOwnProperty(c.fontFamily) ? V[c.fontFamily] : c.fontFamily, c.fill && c.fill instanceof I && c.fill.color.ok) {
                var x = c.fill.color;
                p.setTextColor(x.r, x.g, x.b);
              } else p.setTextColor(0, 0, 0);
              var v = "";
              c.fontWeight === "bold" && (v = "bold"), c.fontStyle === "italic" && (v += "italic"), v === "" && (v = "normal"), d !== void 0 || v !== void 0 ? (d === void 0 && (d = V.hasOwnProperty(c.fontFamily) ? V[c.fontFamily] : c.fontFamily), p.setFont(d, v)) : p.setFont("helvetica", v), p.setFontSize(c.fontSize * p.internal.scaleFactor);
            })(a = new Y(t.pdf, { refsHandler: t.refsHandler, styleSheets: t.styleSheets, viewport: t.viewport, svg2pdfParameters: t.svg2pdfParameters, textMeasure: t.textMeasure, attributeState: Object.assign(J.default(), s) })), o = 0, l = this.children, u.label = 1;
          case 1:
            return o < l.length ? [4, l[o].render(a)] : [3, 4];
          case 2:
            u.sent(), u.label = 3;
          case 3:
            return o++, [3, 1];
          case 4:
            return t.pdf.endFormObject(a.refsHandler.generateKey(this.element.getAttribute("id"), s)), [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    var r, n = this.element.getAttribute("viewBox");
    return n && (r = L(n)), [r && r[0] || 0, r && r[1] || 0, r && r[2] || parseFloat(this.element.getAttribute("markerWidth") || "3"), r && r[3] || parseFloat(this.element.getAttribute("markerHeight") || "3")];
  }, e.prototype.computeNodeTransformCore = function(t) {
    var r, n = parseFloat(this.element.getAttribute("refX") || "0"), s = parseFloat(this.element.getAttribute("refY") || "0"), a = this.element.getAttribute("viewBox");
    if (a) {
      var o = L(a);
      r = rt(this.element, o, 0, 0, parseFloat(this.element.getAttribute("markerWidth") || "3"), parseFloat(this.element.getAttribute("markerHeight") || "3"), t, !0), r = t.pdf.matrixMult(t.pdf.Matrix(1, 0, 0, 1, -n, -s), r);
    } else r = t.pdf.Matrix(1, 0, 0, 1, -n, -s);
    return r;
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e;
})(it), er = (function(i) {
  function e(t, r) {
    return i.call(this, t, r) || this;
  }
  return M(e, i), e.prototype.getR = function(t) {
    var r;
    return (r = this.r) !== null && r !== void 0 ? r : this.r = parseFloat(b(this.element, t.styleSheets, "r") || "0");
  }, e.prototype.getRx = function(t) {
    return this.getR(t);
  }, e.prototype.getRy = function(t) {
    return this.getR(t);
  }, e;
})(de), rr = (function(i) {
  function e(t, r) {
    return i.call(this, !1, t, r) || this;
  }
  return M(e, i), e;
})(ve), me = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n;
      return F(this, (function(s) {
        switch (s.label) {
          case 0:
            r = 0, n = this.children, s.label = 1;
          case 1:
            return r < n.length ? [4, n[r].render(t)] : [3, 4];
          case 2:
            s.sent(), s.label = 3;
          case 3:
            return r++, [3, 1];
          case 4:
            return [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return Et(t, this);
  }, e;
})(ce), ir = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.prototype.render = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            return this.isVisible(t.attributeState.visibility !== "hidden", t) ? (r = this.getX(t), n = this.getY(t), s = this.getWidth(t), a = this.getHeight(t), t.pdf.saveGraphicsState(), o = t.transform, this.element.hasAttribute("transform") && (o = t.pdf.matrixMult(lt(this.element.getAttribute("transform"), t), o)), t.pdf.setCurrentTransformationMatrix(o), t.withinUse || b(this.element, t.styleSheets, "overflow") === "visible" || t.pdf.rect(r, n, s, a).clip().discardPath(), [4, i.prototype.render.call(this, t.clone({ transform: t.pdf.unitMatrix, viewport: t.withinUse ? t.viewport : new ht(s, a) }))]) : [2];
          case 1:
            return l.sent(), t.pdf.restoreGraphicsState(), [2];
        }
      }));
    }));
  }, e.prototype.computeNodeTransform = function(t) {
    return this.computeNodeTransformCore(t);
  }, e.prototype.computeNodeTransformCore = function(t) {
    if (t.withinUse) return t.pdf.unitMatrix;
    var r, n = this.getX(t), s = this.getY(t), a = this.getViewBox();
    if (a) {
      var o = this.getWidth(t), l = this.getHeight(t);
      r = rt(this.element, a, n, s, o, l, t);
    } else r = t.pdf.Matrix(1, 0, 0, 1, n, s);
    return r;
  }, e.prototype.getWidth = function(t) {
    if (this.width !== void 0) return this.width;
    var r, n, s = t.svg2pdfParameters;
    if (this.isOutermostSvg(t)) if (s.width != null) r = s.width;
    else if (n = b(this.element, t.styleSheets, "width")) r = parseFloat(n);
    else {
      var a = this.getViewBox();
      if (a && (s.height != null || b(this.element, t.styleSheets, "height"))) {
        var o = a[2] / a[3];
        r = this.getHeight(t) * o;
      } else r = Math.min(300, t.viewport.width, 2 * t.viewport.height);
    }
    else r = (n = b(this.element, t.styleSheets, "width")) ? parseFloat(n) : t.viewport.width;
    return this.width = r;
  }, e.prototype.getHeight = function(t) {
    if (this.height !== void 0) return this.height;
    var r, n, s = t.svg2pdfParameters;
    if (this.isOutermostSvg(t)) if (s.height != null) r = s.height;
    else if (n = b(this.element, t.styleSheets, "height")) r = parseFloat(n);
    else {
      var a = this.getViewBox();
      if (a) {
        var o = a[2] / a[3];
        r = this.getWidth(t) / o;
      } else r = Math.min(150, t.viewport.width / 2, t.viewport.height);
    }
    else r = (n = b(this.element, t.styleSheets, "height")) ? parseFloat(n) : t.viewport.height;
    return this.height = r;
  }, e.prototype.getX = function(t) {
    if (this.x !== void 0) return this.x;
    if (this.isOutermostSvg(t)) return this.x = 0;
    var r = b(this.element, t.styleSheets, "x");
    return this.x = r ? parseFloat(r) : 0;
  }, e.prototype.getY = function(t) {
    if (this.y !== void 0) return this.y;
    if (this.isOutermostSvg(t)) return this.y = 0;
    var r = b(this.element, t.styleSheets, "y");
    return this.y = r ? parseFloat(r) : 0;
  }, e.prototype.getViewBox = function() {
    if (this.viewBox !== void 0) return this.viewBox;
    var t = this.element.getAttribute("viewBox");
    return this.viewBox = t ? L(t) : void 0;
  }, e.prototype.isOutermostSvg = function(t) {
    return t.svg2pdfParameters.element === this.element;
  }, e;
})(me), xe = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.prototype.computeNodeTransformCore = function(t) {
    return t.pdf.unitMatrix;
  }, e;
})(me), nr = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.renderCore = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a;
      return F(this, (function(o) {
        switch (o.label) {
          case 0:
            return [4, i.prototype.renderCore.call(this, t)];
          case 1:
            return o.sent(), (r = b(this.element, t.styleSheets, "href")) && (n = this.getBoundingBox(t), s = t.pdf.internal.scaleFactor, a = t.pdf.internal.pageSize.getHeight(), t.pdf.link(s * (n[0] * t.transform.sx + t.transform.tx), a - s * ((n[1] + n[3]) * t.transform.sy + t.transform.ty), s * n[2], s * n[3], { url: r })), [2];
        }
      }));
    }));
  }, e;
})(xe), ar = (function(i) {
  function e() {
    return i !== null && i.apply(this, arguments) || this;
  }
  return M(e, i), e.prototype.apply = function(t) {
    return C(this, void 0, void 0, (function() {
      var r, n, s, a, o;
      return F(this, (function(l) {
        switch (l.label) {
          case 0:
            if (!this.isVisible(!0, t)) return [2];
            r = t.pdf.matrixMult(this.computeNodeTransform(t), t.transform), t.pdf.setCurrentTransformationMatrix(r), n = 0, s = this.children, l.label = 1;
          case 1:
            return n < s.length ? [4, s[n].render(new Y(t.pdf, { refsHandler: t.refsHandler, styleSheets: t.styleSheets, viewport: t.viewport, withinClipPath: !0, svg2pdfParameters: t.svg2pdfParameters, textMeasure: t.textMeasure }))] : [3, 4];
          case 2:
            l.sent(), l.label = 3;
          case 3:
            return n++, [3, 1];
          case 4:
            return a = this.children.length > 0 && !!b(this.children[0].element, t.styleSheets, "clip-rule"), o = a ? this.getClipRuleAttr(this.children[0].element, t.styleSheets) : this.getClipRuleAttr(this.element, t.styleSheets), t.pdf.clip(o).discardPath(), t.pdf.setCurrentTransformationMatrix(r.inversed()), [2];
        }
      }));
    }));
  }, e.prototype.getBoundingBoxCore = function(t) {
    return Et(t, this);
  }, e.prototype.isVisible = function(t, r) {
    return X(this, t, r);
  }, e.prototype.getClipRuleAttr = function(t, r) {
    return b(t, r, "clip-rule") === "evenodd" ? "evenodd" : void 0;
  }, e;
})(it);
function Rt(i, e, t) {
  var r, n = [];
  switch ((function(a, o) {
    for (var l = [], u = 0; u < a.childNodes.length; u++) {
      var f = a.childNodes[u];
      f.nodeName.charAt(0) !== "#" && l.push(f);
    }
    for (u = 0; u < l.length; u++) o(u, l[u]);
  })(i, (function(a, o) {
    return n.push(Rt(o, e, t));
  })), i.tagName.toLowerCase()) {
    case "a":
      r = new nr(i, n);
      break;
    case "g":
      r = new xe(i, n);
      break;
    case "circle":
      r = new er(i, n);
      break;
    case "clippath":
      r = new ar(i, n);
      break;
    case "ellipse":
      r = new Ye(i, n);
      break;
    case "lineargradient":
      r = new oe(i, n);
      break;
    case "image":
      r = new Ke(i, n, e);
      break;
    case "line":
      r = new Ge(i, n);
      break;
    case "marker":
      r = new tr(i, n);
      break;
    case "path":
      r = new $e(i, n);
      break;
    case "pattern":
      r = new ue(i, n);
      break;
    case "polygon":
      r = new Je(i, n);
      break;
    case "polyline":
      r = new rr(i, n);
      break;
    case "radialgradient":
      r = new le(i, n);
      break;
    case "rect":
      r = new ze(i, n);
      break;
    case "svg":
      r = new ir(i, n);
      break;
    case "symbol":
      r = new pe(i, n);
      break;
    case "text":
      r = new Xe(i, n);
      break;
    case "use":
      r = new Ue(i, n);
      break;
    default:
      r = new Ze(i, n);
  }
  if (t != null && r.element.hasAttribute("id")) {
    var s = ee(r.element.id, { isIdentifier: !0 });
    t[s] = t[s] || r;
  }
  return r.children.forEach((function(a) {
    return a.setParent(r);
  })), r;
}
var sr = (function() {
  function i(e, t) {
    this.rootSvg = e, this.loadExternalSheets = t, this.styleSheets = [];
  }
  return i.prototype.load = function() {
    return C(this, void 0, void 0, (function() {
      var e;
      return F(this, (function(t) {
        switch (t.label) {
          case 0:
            return [4, this.collectStyleSheetTexts()];
          case 1:
            return e = t.sent(), this.parseCssSheets(e), [2];
        }
      }));
    }));
  }, i.prototype.collectStyleSheetTexts = function() {
    return C(this, void 0, void 0, (function() {
      var e, t, r, n, s;
      return F(this, (function(a) {
        switch (a.label) {
          case 0:
            if (e = [], this.loadExternalSheets && this.rootSvg.ownerDocument) for (n = 0; n < this.rootSvg.ownerDocument.childNodes.length; n++) (t = this.rootSvg.ownerDocument.childNodes[n]).nodeName === "xml-stylesheet" && typeof t.data == "string" && e.push(i.loadSheet(t.data.match(/href=["'].*?["']/)[0].split("=")[1].slice(1, -1)));
            for (r = this.rootSvg.querySelectorAll("style,link"), n = 0; n < r.length; n++) z(s = r[n], "style") ? e.push(s.textContent) : this.loadExternalSheets && z(s, "link") && s.getAttribute("rel") === "stylesheet" && s.hasAttribute("href") && e.push(i.loadSheet(s.getAttribute("href")));
            return [4, Promise.all(e)];
          case 1:
            return [2, a.sent().filter((function(o) {
              return o !== null;
            }))];
        }
      }));
    }));
  }, i.prototype.parseCssSheets = function(e) {
    for (var t = document.implementation.createHTMLDocument(""), r = 0, n = e; r < n.length; r++) {
      var s = n[r], a = t.createElement("style");
      a.textContent = s, t.body.appendChild(a);
      var o = a.sheet;
      if (o instanceof CSSStyleSheet) {
        for (var l = o.cssRules.length - 1; l >= 0; l--) {
          var u = o.cssRules[l];
          if (u instanceof CSSStyleRule) {
            var f = u;
            if (f.selectorText.indexOf(",") >= 0) {
              o.deleteRule(l);
              for (var c = f.cssText.substring(f.selectorText.length), p = i.splitSelectorAtCommas(f.selectorText), h = 0; h < p.length; h++) o.insertRule(p[h] + c, l + h);
            }
          } else o.deleteRule(l);
        }
        this.styleSheets.push(o);
      }
    }
  }, i.splitSelectorAtCommas = function(e) {
    if (e.trim().length === 0) return [];
    for (var t, r = /,|["']/g, n = /\\[\s\S]|"/g, s = /\\[\s\S]|'/g, a = [], o = "initial", l = -1, u = n, f = 0; f < e.length; ) switch (o) {
      case "initial":
        r.lastIndex = f, (t = r.exec(e)) ? (t[0] === "," ? (a.push(e.substring(l + 1, r.lastIndex - 1).trim()), l = r.lastIndex - 1) : (o = "withinQuotes", u = t[0] === '"' ? n : s), f = r.lastIndex) : (a.push(e.substring(l + 1).trim()), f = e.length);
        break;
      case "withinQuotes":
        u.lastIndex = f, (t = u.exec(e)) ? (f = u.lastIndex, t[0].length === 1 && (o = "initial")) : f = e.length;
    }
    return a;
  }, i.loadSheet = function(e) {
    return new Promise((function(t, r) {
      var n = new XMLHttpRequest();
      n.open("GET", e, !0), n.responseType = "text", n.onload = function() {
        n.status !== 200 && r(new Error("Error ".concat(n.status, ": Failed to load '").concat(e, "'"))), t(n.responseText);
      }, n.onerror = r, n.onabort = r, n.send(null);
    })).catch((function() {
      return null;
    }));
  }, i.prototype.getPropertyValue = function(e, t) {
    for (var r = [], n = 0, s = this.styleSheets; n < s.length; n++) for (var a = s[n], o = 0; o < a.cssRules.length; o++) {
      var l = a.cssRules[o];
      l.style.getPropertyValue(t) && e.matches(l.selectorText) && r.push(l);
    }
    if (r.length !== 0)
      return r.reduce((function(u, f) {
        return p = f, ((h = (c = u).style.getPropertyPriority(t)) !== p.style.getPropertyPriority(t) ? h === "important" ? 1 : -1 : Oe(c.selectorText, p.selectorText)) === 1 ? u : f;
        var c, p, h;
      })).style.getPropertyValue(t) || void 0;
  }, i;
})(), or = (function() {
  function i() {
    this.measureMethods = {};
  }
  return i.prototype.getTextOffset = function(e, t) {
    var r = t.textAnchor;
    if (r === "start") return 0;
    var n = this.measureTextWidth(e, t), s = 0;
    switch (r) {
      case "end":
        s = n;
        break;
      case "middle":
        s = n / 2;
    }
    return s;
  }, i.prototype.measureTextWidth = function(e, t) {
    if (e.length === 0) return 0;
    var r = t.fontFamily;
    return this.getMeasureFunction(r).call(this, e, t.fontFamily, t.fontSize + "px", t.fontStyle, t.fontWeight);
  }, i.prototype.getMeasurementTextNode = function() {
    if (!this.textMeasuringTextElement) {
      this.textMeasuringTextElement = document.createElementNS($t, "text");
      var e = document.createElementNS($t, "svg");
      e.appendChild(this.textMeasuringTextElement), e.style.setProperty("position", "absolute"), e.style.setProperty("visibility", "hidden"), document.body.appendChild(e);
    }
    return this.textMeasuringTextElement;
  }, i.prototype.canvasTextMeasure = function(e, t, r, n, s) {
    var a = document.createElement("canvas").getContext("2d");
    return a != null ? (a.font = [n, s, r, t].join(" "), a.measureText(e).width) : 0;
  }, i.prototype.svgTextMeasure = function(e, t, r, n, s, a) {
    a === void 0 && (a = this.getMeasurementTextNode());
    var o = a;
    return o.setAttribute("font-family", t), o.setAttribute("font-size", r), o.setAttribute("font-style", n), o.setAttribute("font-weight", s), o.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"), o.textContent = e, o.getBBox().width;
  }, i.prototype.getMeasureFunction = function(e) {
    var t = this.measureMethods[e];
    if (!t) {
      var r = "16px", n = "normal", s = "normal", a = this.canvasTextMeasure(i.testString, e, r, n, s), o = this.svgTextMeasure(i.testString, e, r, n, s);
      t = Math.abs(a - o) < i.epsilon ? this.canvasTextMeasure : this.svgTextMeasure, this.measureMethods[e] = t;
    }
    return t;
  }, i.prototype.cleanupTextMeasuring = function() {
    if (this.textMeasuringTextElement) {
      var e = this.textMeasuringTextElement.parentNode;
      e && document.body.removeChild(e), this.textMeasuringTextElement = void 0;
    }
  }, i.testString = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!"$%&/()=?'\\+*-_.:,;^}][{#~|<>`, i.epsilon = 0.1, i;
})();
function lr(i, e) {
  return C(this, arguments, void 0, (function(t, r, n) {
    var s, a, o, l, u, f, c, p, h, g, d, m, x, v;
    return n === void 0 && (n = {}), F(this, (function(S) {
      switch (S.label) {
        case 0:
          return s = (m = n.x) !== null && m !== void 0 ? m : 0, a = (x = n.y) !== null && x !== void 0 ? x : 0, o = (v = n.loadExternalStyleSheets) !== null && v !== void 0 && v, u = new ie(l = {}), [4, (f = new sr(t, o)).load()];
        case 1:
          return S.sent(), c = new ht(r.internal.pageSize.getWidth(), r.internal.pageSize.getHeight()), p = ot(ot({}, n), { element: t }), h = new or(), g = new Y(r, { refsHandler: u, styleSheets: f, viewport: c, svg2pdfParameters: p, textMeasure: h }), r.advancedAPI(), r.saveGraphicsState(), r.setCurrentTransformationMatrix(r.Matrix(1, 0, 0, 1, s, a)), r.setLineWidth(g.attributeState.strokeWidth), d = g.attributeState.fill.color, r.setFillColor(d.r, d.g, d.b), r.setFont(g.attributeState.fontFamily), r.setFontSize(g.attributeState.fontSize * r.internal.scaleFactor), [4, Rt(t, g, l).render(g)];
        case 2:
          return S.sent(), r.restoreGraphicsState(), r.compatAPI(), g.textMeasure.cleanupTextMeasuring(), [2, r];
      }
    }));
  }));
}
te.API.svg = function(i, e) {
  return e === void 0 && (e = {}), lr(i, this, e);
};
export {
  lr as svg2pdf
};
