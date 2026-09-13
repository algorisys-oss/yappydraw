import { r as f } from "./Options-BStFr0zv.js";
import { d as l } from "./Factory--zguTNZ7.js";
var e = {}, a;
function y() {
  if (a) return e;
  a = 1, Object.defineProperty(e, "__esModule", { value: !0 }), e.AbstractInputJax = void 0;
  var o = f(), i = l(), s = (function() {
    function t(r) {
      r === void 0 && (r = {}), this.adaptor = null, this.mmlFactory = null;
      var n = this.constructor;
      this.options = (0, o.userOptions)((0, o.defaultOptions)({}, n.OPTIONS), r), this.preFilters = new i.FunctionList(), this.postFilters = new i.FunctionList();
    }
    return Object.defineProperty(t.prototype, "name", {
      get: function() {
        return this.constructor.NAME;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.setAdaptor = function(r) {
      this.adaptor = r;
    }, t.prototype.setMmlFactory = function(r) {
      this.mmlFactory = r;
    }, t.prototype.initialize = function() {
    }, t.prototype.reset = function() {
    }, Object.defineProperty(t.prototype, "processStrings", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.findMath = function(r, n) {
      return [];
    }, t.prototype.executeFilters = function(r, n, p, c) {
      var u = { math: n, document: p, data: c };
      return r.execute(u), u.data;
    }, t.NAME = "generic", t.OPTIONS = {}, t;
  })();
  return e.AbstractInputJax = s, e;
}
export {
  y as r
};
