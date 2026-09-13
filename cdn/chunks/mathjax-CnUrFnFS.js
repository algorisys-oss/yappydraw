import { r as x } from "./PrioritizedList-TjDg4i-s.js";
var y = {}, v = {}, _;
function L() {
  return _ || (_ = 1, Object.defineProperty(v, "__esModule", { value: !0 }), v.VERSION = void 0, v.VERSION = "3.2.1"), v;
}
var o = {}, p;
function O() {
  if (p) return o;
  p = 1;
  var a = o && o.__extends || /* @__PURE__ */ (function() {
    var e = function(t, r) {
      return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, u) {
        n.__proto__ = u;
      } || function(n, u) {
        for (var s in u) Object.prototype.hasOwnProperty.call(u, s) && (n[s] = u[s]);
      }, e(t, r);
    };
    return function(t, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      e(t, r);
      function n() {
        this.constructor = t;
      }
      t.prototype = r === null ? Object.create(r) : (n.prototype = r.prototype, new n());
    };
  })(), c = o && o.__values || function(e) {
    var t = typeof Symbol == "function" && Symbol.iterator, r = t && e[t], n = 0;
    if (r) return r.call(e);
    if (e && typeof e.length == "number") return {
      next: function() {
        return e && n >= e.length && (e = void 0), { value: e && e[n++], done: !e };
      }
    };
    throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(o, "__esModule", { value: !0 }), o.HandlerList = void 0;
  var f = x(), i = (function(e) {
    a(t, e);
    function t() {
      return e !== null && e.apply(this, arguments) || this;
    }
    return t.prototype.register = function(r) {
      return this.add(r, r.priority);
    }, t.prototype.unregister = function(r) {
      this.remove(r);
    }, t.prototype.handlesDocument = function(r) {
      var n, u;
      try {
        for (var s = c(this), d = s.next(); !d.done; d = s.next()) {
          var R = d.value, h = R.item;
          if (h.handlesDocument(r))
            return h;
        }
      } catch (w) {
        n = { error: w };
      } finally {
        try {
          d && !d.done && (u = s.return) && u.call(s);
        } finally {
          if (n) throw n.error;
        }
      }
      throw new Error("Can't find handler for document");
    }, t.prototype.document = function(r, n) {
      return n === void 0 && (n = null), this.handlesDocument(r).create(r, n);
    }, t;
  })(f.PrioritizedList);
  return o.HandlerList = i, o;
}
var l = {}, m;
function P() {
  if (m) return l;
  m = 1, Object.defineProperty(l, "__esModule", { value: !0 }), l.retryAfter = l.handleRetriesFor = void 0;
  function a(f) {
    return new Promise(function i(e, t) {
      try {
        e(f());
      } catch (r) {
        r.retry && r.retry instanceof Promise ? r.retry.then(function() {
          return i(e, t);
        }).catch(function(n) {
          return t(n);
        }) : r.restart && r.restart.isCallback ? MathJax.Callback.After(function() {
          return i(e, t);
        }, r.restart) : t(r);
      }
    });
  }
  l.handleRetriesFor = a;
  function c(f) {
    var i = new Error("MathJax retry");
    throw i.retry = f, i;
  }
  return l.retryAfter = c, l;
}
var j;
function H() {
  return j || (j = 1, (function(a) {
    Object.defineProperty(a, "__esModule", { value: !0 }), a.mathjax = void 0;
    var c = L(), f = O(), i = P();
    a.mathjax = {
      version: c.VERSION,
      handlers: new f.HandlerList(),
      document: function(e, t) {
        return a.mathjax.handlers.document(e, t);
      },
      handleRetriesFor: i.handleRetriesFor,
      retryAfter: i.retryAfter,
      asyncLoad: null
    };
  })(y)), y;
}
export {
  P as a,
  H as r
};
