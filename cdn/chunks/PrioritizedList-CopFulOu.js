var r = {}, o;
function u() {
  if (o) return r;
  o = 1, Object.defineProperty(r, "__esModule", { value: !0 }), r.PrioritizedList = void 0;
  var n = (function() {
    function e() {
      this.items = [], this.items = [];
    }
    return e.prototype[Symbol.iterator] = function() {
      var t = 0, i = this.items;
      return {
        next: function() {
          return { value: i[t++], done: t > i.length };
        }
      };
    }, e.prototype.add = function(t, i) {
      i === void 0 && (i = e.DEFAULTPRIORITY);
      var s = this.items.length;
      do
        s--;
      while (s >= 0 && i < this.items[s].priority);
      return this.items.splice(s + 1, 0, { item: t, priority: i }), t;
    }, e.prototype.remove = function(t) {
      var i = this.items.length;
      do
        i--;
      while (i >= 0 && this.items[i].item !== t);
      i >= 0 && this.items.splice(i, 1);
    }, e.DEFAULTPRIORITY = 5, e;
  })();
  return r.PrioritizedList = n, r;
}
export {
  u as r
};
