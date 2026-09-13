var h = {}, m;
function S() {
  return m || (m = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.px = e.emRounded = e.em = e.percent = e.length2em = e.MATHSPACE = e.RELUNITS = e.UNITS = e.BIGDIMEN = void 0, e.BIGDIMEN = 1e6, e.UNITS = {
      px: 1,
      in: 96,
      cm: 96 / 2.54,
      mm: 96 / 25.4
    }, e.RELUNITS = {
      em: 1,
      ex: 0.431,
      pt: 1 / 10,
      pc: 12 / 10,
      mu: 1 / 18
    }, e.MATHSPACE = {
      veryverythinmathspace: 1 / 18,
      verythinmathspace: 2 / 18,
      thinmathspace: 3 / 18,
      mediummathspace: 4 / 18,
      thickmathspace: 5 / 18,
      verythickmathspace: 6 / 18,
      veryverythickmathspace: 7 / 18,
      negativeveryverythinmathspace: -1 / 18,
      negativeverythinmathspace: -2 / 18,
      negativethinmathspace: -3 / 18,
      negativemediummathspace: -4 / 18,
      negativethickmathspace: -5 / 18,
      negativeverythickmathspace: -6 / 18,
      negativeveryverythickmathspace: -7 / 18,
      thin: 0.04,
      medium: 0.06,
      thick: 0.1,
      normal: 1,
      big: 2,
      small: 1 / Math.sqrt(2),
      infinity: e.BIGDIMEN
    };
    function v(i, n, a, c) {
      if (n === void 0 && (n = 0), a === void 0 && (a = 1), c === void 0 && (c = 16), typeof i != "string" && (i = String(i)), i === "" || i == null)
        return n;
      if (e.MATHSPACE[i])
        return e.MATHSPACE[i];
      var u = i.match(/^\s*([-+]?(?:\.\d+|\d+(?:\.\d*)?))?(pt|em|ex|mu|px|pc|in|mm|cm|%)?/);
      if (!u)
        return n;
      var r = parseFloat(u[1] || "1"), t = u[2];
      return e.UNITS.hasOwnProperty(t) ? r * e.UNITS[t] / c / a : e.RELUNITS.hasOwnProperty(t) ? r * e.RELUNITS[t] : t === "%" ? r / 100 * n : r * n;
    }
    e.length2em = v;
    function f(i) {
      return (100 * i).toFixed(1).replace(/\.?0+$/, "") + "%";
    }
    e.percent = f;
    function d(i) {
      return Math.abs(i) < 1e-3 ? "0" : i.toFixed(3).replace(/\.?0+$/, "") + "em";
    }
    e.em = d;
    function y(i, n) {
      return n === void 0 && (n = 16), i = (Math.round(i * n) + 0.05) / n, Math.abs(i) < 1e-3 ? "0em" : i.toFixed(3).replace(/\.?0+$/, "") + "em";
    }
    e.emRounded = y;
    function I(i, n, a) {
      return n === void 0 && (n = -e.BIGDIMEN), a === void 0 && (a = 16), i *= a, n && i < n && (i = n), Math.abs(i) < 0.1 ? "0" : i.toFixed(1).replace(/\.0$/, "") + "px";
    }
    e.px = I;
  })(h)), h;
}
export {
  S as r
};
