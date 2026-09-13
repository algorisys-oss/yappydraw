var u = {}, T;
function S() {
  return T || (T = 1, (function(i) {
    Object.defineProperty(i, "__esModule", { value: !0 }), i.newState = i.STATE = i.AbstractMathItem = i.protoItem = void 0;
    function r(n, t, e, o, h, E, a) {
      a === void 0 && (a = null);
      var c = {
        open: n,
        math: t,
        close: e,
        n: o,
        start: { n: h },
        end: { n: E },
        display: a
      };
      return c;
    }
    i.protoItem = r;
    var s = (function() {
      function n(t, e, o, h, E) {
        o === void 0 && (o = !0), h === void 0 && (h = { i: 0, n: 0, delim: "" }), E === void 0 && (E = { i: 0, n: 0, delim: "" }), this.root = null, this.typesetRoot = null, this.metrics = {}, this.inputData = {}, this.outputData = {}, this._state = i.STATE.UNPROCESSED, this.math = t, this.inputJax = e, this.display = o, this.start = h, this.end = E, this.root = null, this.typesetRoot = null, this.metrics = {}, this.inputData = {}, this.outputData = {};
      }
      return Object.defineProperty(n.prototype, "isEscaped", {
        get: function() {
          return this.display === null;
        },
        enumerable: !1,
        configurable: !0
      }), n.prototype.render = function(t) {
        t.renderActions.renderMath(this, t);
      }, n.prototype.rerender = function(t, e) {
        e === void 0 && (e = i.STATE.RERENDER), this.state() >= e && this.state(e - 1), t.renderActions.renderMath(this, t, e);
      }, n.prototype.convert = function(t, e) {
        e === void 0 && (e = i.STATE.LAST), t.renderActions.renderConvert(this, t, e);
      }, n.prototype.compile = function(t) {
        this.state() < i.STATE.COMPILED && (this.root = this.inputJax.compile(this, t), this.state(i.STATE.COMPILED));
      }, n.prototype.typeset = function(t) {
        this.state() < i.STATE.TYPESET && (this.typesetRoot = t.outputJax[this.isEscaped ? "escaped" : "typeset"](this, t), this.state(i.STATE.TYPESET));
      }, n.prototype.updateDocument = function(t) {
      }, n.prototype.removeFromDocument = function(t) {
      }, n.prototype.setMetrics = function(t, e, o, h, E) {
        this.metrics = {
          em: t,
          ex: e,
          containerWidth: o,
          lineWidth: h,
          scale: E
        };
      }, n.prototype.state = function(t, e) {
        return t === void 0 && (t = null), e === void 0 && (e = !1), t != null && (t < i.STATE.INSERTED && this._state >= i.STATE.INSERTED && this.removeFromDocument(e), t < i.STATE.TYPESET && this._state >= i.STATE.TYPESET && (this.outputData = {}), t < i.STATE.COMPILED && this._state >= i.STATE.COMPILED && (this.inputData = {}), this._state = t), this._state;
      }, n.prototype.reset = function(t) {
        t === void 0 && (t = !1), this.state(i.STATE.UNPROCESSED, t);
      }, n;
    })();
    i.AbstractMathItem = s, i.STATE = {
      UNPROCESSED: 0,
      FINDMATH: 10,
      COMPILED: 20,
      CONVERT: 100,
      METRICS: 110,
      RERENDER: 125,
      TYPESET: 150,
      INSERTED: 200,
      LAST: 1e4
    };
    function f(n, t) {
      if (n in i.STATE)
        throw Error("State " + n + " already exists");
      i.STATE[n] = t;
    }
    i.newState = f;
  })(u)), u;
}
export {
  S as r
};
