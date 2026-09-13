var h = {}, R;
function J() {
  return R || (R = 1, (function(n) {
    var A = h && h.__values || function(r) {
      var e = typeof Symbol == "function" && Symbol.iterator, a = e && r[e], t = 0;
      if (a) return a.call(r);
      if (r && typeof r.length == "number") return {
        next: function() {
          return r && t >= r.length && (r = void 0), { value: r && r[t++], done: !r };
        }
      };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, m = h && h.__read || function(r, e) {
      var a = typeof Symbol == "function" && r[Symbol.iterator];
      if (!a) return r;
      var t = a.call(r), u, f = [], o;
      try {
        for (; (e === void 0 || e-- > 0) && !(u = t.next()).done; ) f.push(u.value);
      } catch (i) {
        o = { error: i };
      } finally {
        try {
          u && !u.done && (a = t.return) && a.call(t);
        } finally {
          if (o) throw o.error;
        }
      }
      return f;
    }, w = h && h.__spreadArray || function(r, e, a) {
      if (a || arguments.length === 2) for (var t = 0, u = e.length, f; t < u; t++)
        (f || !(t in e)) && (f || (f = Array.prototype.slice.call(e, 0, t)), f[t] = e[t]);
      return r.concat(f || Array.prototype.slice.call(e));
    };
    Object.defineProperty(n, "__esModule", { value: !0 }), n.lookup = n.separateOptions = n.selectOptionsFromKeys = n.selectOptions = n.userOptions = n.defaultOptions = n.insert = n.copy = n.keys = n.makeArray = n.expandable = n.Expandable = n.OPTIONS = n.REMOVE = n.APPEND = n.isObject = void 0;
    var j = {}.constructor;
    function g(r) {
      return typeof r == "object" && r !== null && (r.constructor === j || r.constructor === s);
    }
    n.isObject = g, n.APPEND = "[+]", n.REMOVE = "[-]", n.OPTIONS = {
      invalidOption: "warn",
      optionError: function(r, e) {
        if (n.OPTIONS.invalidOption === "fatal")
          throw new Error(r);
        console.warn("MathJax: " + r);
      }
    };
    var s = /* @__PURE__ */ (function() {
      function r() {
      }
      return r;
    })();
    n.Expandable = s;
    function M(r) {
      return Object.assign(Object.create(s.prototype), r);
    }
    n.expandable = M;
    function V(r) {
      return Array.isArray(r) ? r : [r];
    }
    n.makeArray = V;
    function b(r) {
      return r ? Object.keys(r).concat(Object.getOwnPropertySymbols(r)) : [];
    }
    n.keys = b;
    function p(r) {
      var e, a, t = {};
      try {
        for (var u = A(b(r)), f = u.next(); !f.done; f = u.next()) {
          var o = f.value, i = Object.getOwnPropertyDescriptor(r, o), v = i.value;
          Array.isArray(v) ? i.value = E([], v, !1) : g(v) && (i.value = p(v)), i.enumerable && (t[o] = i);
        }
      } catch (l) {
        e = { error: l };
      } finally {
        try {
          f && !f.done && (a = u.return) && a.call(u);
        } finally {
          if (e) throw e.error;
        }
      }
      return Object.defineProperties(r.constructor === s ? M({}) : {}, t);
    }
    n.copy = p;
    function E(r, e, a) {
      var t, u;
      a === void 0 && (a = !0);
      var f = function(l) {
        if (a && r[l] === void 0 && r.constructor !== s)
          return typeof l == "symbol" && (l = l.toString()), n.OPTIONS.optionError('Invalid option "'.concat(l, '" (no default value).'), l), "continue";
        var c = e[l], y = r[l];
        if (g(c) && y !== null && (typeof y == "object" || typeof y == "function")) {
          var O = b(c);
          Array.isArray(y) && (O.length === 1 && (O[0] === n.APPEND || O[0] === n.REMOVE) && Array.isArray(c[O[0]]) || O.length === 2 && O.sort().join(",") === n.APPEND + "," + n.REMOVE && Array.isArray(c[n.APPEND]) && Array.isArray(c[n.REMOVE])) ? (c[n.REMOVE] && (y = r[l] = y.filter(function(d) {
            return c[n.REMOVE].indexOf(d) < 0;
          })), c[n.APPEND] && (r[l] = w(w([], m(y), !1), m(c[n.APPEND]), !1))) : E(y, c, a);
        } else Array.isArray(c) ? (r[l] = [], E(r[l], c, !1)) : g(c) ? r[l] = p(c) : r[l] = c;
      };
      try {
        for (var o = A(b(e)), i = o.next(); !i.done; i = o.next()) {
          var v = i.value;
          f(v);
        }
      } catch (l) {
        t = { error: l };
      } finally {
        try {
          i && !i.done && (u = o.return) && u.call(o);
        } finally {
          if (t) throw t.error;
        }
      }
      return r;
    }
    n.insert = E;
    function T(r) {
      for (var e = [], a = 1; a < arguments.length; a++)
        e[a - 1] = arguments[a];
      return e.forEach(function(t) {
        return E(r, t, !1);
      }), r;
    }
    n.defaultOptions = T;
    function I(r) {
      for (var e = [], a = 1; a < arguments.length; a++)
        e[a - 1] = arguments[a];
      return e.forEach(function(t) {
        return E(r, t, !0);
      }), r;
    }
    n.userOptions = I;
    function D(r) {
      for (var e, a, t = [], u = 1; u < arguments.length; u++)
        t[u - 1] = arguments[u];
      var f = {};
      try {
        for (var o = A(t), i = o.next(); !i.done; i = o.next()) {
          var v = i.value;
          r.hasOwnProperty(v) && (f[v] = r[v]);
        }
      } catch (l) {
        e = { error: l };
      } finally {
        try {
          i && !i.done && (a = o.return) && a.call(o);
        } finally {
          if (e) throw e.error;
        }
      }
      return f;
    }
    n.selectOptions = D;
    function F(r, e) {
      return D.apply(void 0, w([r], m(Object.keys(e)), !1));
    }
    n.selectOptionsFromKeys = F;
    function K(r) {
      for (var e, a, t, u, f = [], o = 1; o < arguments.length; o++)
        f[o - 1] = arguments[o];
      var i = [];
      try {
        for (var v = A(f), l = v.next(); !l.done; l = v.next()) {
          var c = l.value, y = {}, O = {};
          try {
            for (var d = (t = void 0, A(Object.keys(r || {}))), P = d.next(); !P.done; P = d.next()) {
              var N = P.value;
              (c[N] === void 0 ? O : y)[N] = r[N];
            }
          } catch (S) {
            t = { error: S };
          } finally {
            try {
              P && !P.done && (u = d.return) && u.call(d);
            } finally {
              if (t) throw t.error;
            }
          }
          i.push(y), r = O;
        }
      } catch (S) {
        e = { error: S };
      } finally {
        try {
          l && !l.done && (a = v.return) && a.call(v);
        } finally {
          if (e) throw e.error;
        }
      }
      return i.unshift(r), i;
    }
    n.separateOptions = K;
    function q(r, e, a) {
      return a === void 0 && (a = null), e.hasOwnProperty(r) ? e[r] : a;
    }
    n.lookup = q;
  })(h)), h;
}
export {
  J as r
};
