function u(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var o = {}, n;
function d() {
  if (n) return o;
  n = 1, Object.defineProperty(o, "__esModule", { value: !0 }), o.PrioritizedList = void 0;
  var i = (function() {
    function r() {
      this.items = [], this.items = [];
    }
    return r.prototype[Symbol.iterator] = function() {
      var e = 0, t = this.items;
      return {
        next: function() {
          return { value: t[e++], done: e > t.length };
        }
      };
    }, r.prototype.add = function(e, t) {
      t === void 0 && (t = r.DEFAULTPRIORITY);
      var s = this.items.length;
      do
        s--;
      while (s >= 0 && t < this.items[s].priority);
      return this.items.splice(s + 1, 0, { item: e, priority: t }), e;
    }, r.prototype.remove = function(e) {
      var t = this.items.length;
      do
        t--;
      while (t >= 0 && this.items[t].item !== e);
      t >= 0 && this.items.splice(t, 1);
    }, r.DEFAULTPRIORITY = 5, r;
  })();
  return o.PrioritizedList = i, o;
}
export {
  u as g,
  d as r
};
