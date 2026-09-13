import { a as At, c as oe, b as ue, d as Zt, e as se } from "./Factory--zguTNZ7.js";
import { r as wt } from "./Options-BStFr0zv.js";
import { r as Qt } from "./PrioritizedList-TjDg4i-s.js";
import { r as Mt } from "./Entities-XwxJEcR3.js";
import { r as te } from "./lengths-DNFHULBn.js";
var ct = {}, kt;
function pt() {
  if (kt) return ct;
  kt = 1;
  var M = ct && ct.__values || function(d) {
    var c = typeof Symbol == "function" && Symbol.iterator, h = c && d[c], e = 0;
    if (h) return h.call(d);
    if (d && typeof d.length == "number") return {
      next: function() {
        return d && e >= d.length && (d = void 0), { value: d && d[e++], done: !d };
      }
    };
    throw new TypeError(c ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, _ = ct && ct.__read || function(d, c) {
    var h = typeof Symbol == "function" && d[Symbol.iterator];
    if (!h) return d;
    var e = h.call(d), r, n = [], a;
    try {
      for (; (c === void 0 || c-- > 0) && !(r = e.next()).done; ) n.push(r.value);
    } catch (i) {
      a = { error: i };
    } finally {
      try {
        r && !r.done && (h = e.return) && h.call(e);
      } finally {
        if (a) throw a.error;
      }
    }
    return n;
  }, X = ct && ct.__spreadArray || function(d, c, h) {
    if (h || arguments.length === 2) for (var e = 0, r = c.length, n; e < r; e++)
      (n || !(e in c)) && (n || (n = Array.prototype.slice.call(c, 0, e)), n[e] = c[e]);
    return d.concat(n || Array.prototype.slice.call(c));
  };
  Object.defineProperty(ct, "__esModule", { value: !0 });
  var j = At(), E = oe(), m;
  return (function(d) {
    var c = /* @__PURE__ */ new Map([
      ["autoOP", !0],
      ["fnOP", !0],
      ["movesupsub", !0],
      ["subsupOK", !0],
      ["texprimestyle", !0],
      ["useHeight", !0],
      ["variantForm", !0],
      ["withDelims", !0],
      ["mathaccent", !0],
      ["open", !0],
      ["close", !0]
    ]);
    function h(I) {
      return String.fromCodePoint(parseInt(I, 16));
    }
    d.createEntity = h;
    function e(I) {
      return I.childNodes;
    }
    d.getChildren = e;
    function r(I) {
      return I.getText();
    }
    d.getText = r;
    function n(I, F) {
      var R, $;
      try {
        for (var J = M(F), S = J.next(); !S.done; S = J.next()) {
          var b = S.value;
          I.appendChild(b);
        }
      } catch (g) {
        R = { error: g };
      } finally {
        try {
          S && !S.done && ($ = J.return) && $.call(J);
        } finally {
          if (R) throw R.error;
        }
      }
    }
    d.appendChildren = n;
    function a(I, F, R) {
      I.attributes.set(F, R);
    }
    d.setAttribute = a;
    function i(I, F, R) {
      I.setProperty(F, R);
    }
    d.setProperty = i;
    function v(I, F) {
      var R, $;
      try {
        for (var J = M(Object.keys(F)), S = J.next(); !S.done; S = J.next()) {
          var b = S.value, g = F[b];
          b === "texClass" ? (I.texClass = g, I.setProperty(b, g)) : b === "movablelimits" ? (I.setProperty("movablelimits", g), (I.isKind("mo") || I.isKind("mstyle")) && I.attributes.set("movablelimits", g)) : b === "inferred" || (c.has(b) ? I.setProperty(b, g) : I.attributes.set(b, g));
        }
      } catch (T) {
        R = { error: T };
      } finally {
        try {
          S && !S.done && ($ = J.return) && $.call(J);
        } finally {
          if (R) throw R.error;
        }
      }
    }
    d.setProperties = v;
    function p(I, F) {
      return I.getProperty(F);
    }
    d.getProperty = p;
    function y(I, F) {
      return I.attributes.get(F);
    }
    d.getAttribute = y;
    function f(I) {
      for (var F = [], R = 1; R < arguments.length; R++)
        F[R - 1] = arguments[R];
      I.removeProperty.apply(I, X([], _(F), !1));
    }
    d.removeProperties = f;
    function A(I, F) {
      return I.childNodes[F];
    }
    d.getChildAt = A;
    function x(I, F, R) {
      var $ = I.childNodes;
      $[F] = R, R && (R.parent = I);
    }
    d.setChild = x;
    function C(I, F) {
      for (var R = I.childNodes, $ = 0; $ < R.length; $++)
        x(F, $, R[$]);
    }
    d.copyChildren = C;
    function t(I, F) {
      F.attributes = I.attributes, v(F, I.getAllProperties());
    }
    d.copyAttributes = t;
    function u(I, F) {
      return I.isKind(F);
    }
    d.isType = u;
    function o(I) {
      return I.isEmbellished;
    }
    d.isEmbellished = o;
    function s(I) {
      return I.texClass;
    }
    d.getTexClass = s;
    function l(I) {
      return I.coreMO();
    }
    d.getCoreMO = l;
    function O(I) {
      return I instanceof j.AbstractMmlNode || I instanceof j.AbstractMmlEmptyNode;
    }
    d.isNode = O;
    function k(I) {
      return I.isInferred;
    }
    d.isInferred = k;
    function N(I) {
      var F, R;
      if (!u(I, "mo"))
        return null;
      var $ = I, J = $.getForms();
      try {
        for (var S = M(J), b = S.next(); !b.done; b = S.next()) {
          var g = b.value, T = E.MmlMo.OPTABLE[g][$.getText()];
          if (T)
            return T;
        }
      } catch (L) {
        F = { error: L };
      } finally {
        try {
          b && !b.done && (R = S.return) && R.call(S);
        } finally {
          if (F) throw F.error;
        }
      }
      return null;
    }
    d.getForm = N;
  })(m || (m = {})), ct.default = m, ct;
}
var nt = {}, ft = {}, Tt = {}, Lt;
function St() {
  if (Lt) return Tt;
  Lt = 1, Object.defineProperty(Tt, "__esModule", { value: !0 });
  var M = (function() {
    function _(X, j) {
      for (var E = [], m = 2; m < arguments.length; m++)
        E[m - 2] = arguments[m];
      this.id = X, this.message = _.processString(j, E);
    }
    return _.processString = function(X, j) {
      for (var E = X.split(_.pattern), m = 1, d = E.length; m < d; m += 2) {
        var c = E[m].charAt(0);
        if (c >= "0" && c <= "9")
          E[m] = j[parseInt(E[m], 10) - 1], typeof E[m] == "number" && (E[m] = E[m].toString());
        else if (c === "{")
          if (c = E[m].substr(1), c >= "0" && c <= "9")
            E[m] = j[parseInt(E[m].substr(1, E[m].length - 2), 10) - 1], typeof E[m] == "number" && (E[m] = E[m].toString());
          else {
            var h = E[m].match(/^\{([a-z]+):%(\d+)\|(.*)\}$/);
            h && (E[m] = "%" + E[m]);
          }
        E[m] == null && (E[m] = "???");
      }
      return E.join("");
    }, _.pattern = /%(\d+|\{\d+\}|\{[a-z]+:\%\d+(?:\|(?:%\{\d+\}|%.|[^\}])*)+\}|.)/g, _;
  })();
  return Tt.default = M, Tt;
}
var Ft;
function Ct() {
  if (Ft) return ft;
  Ft = 1;
  var M = ft && ft.__read || function(e, r) {
    var n = typeof Symbol == "function" && e[Symbol.iterator];
    if (!n) return e;
    var a = n.call(e), i, v = [], p;
    try {
      for (; (r === void 0 || r-- > 0) && !(i = a.next()).done; ) v.push(i.value);
    } catch (y) {
      p = { error: y };
    } finally {
      try {
        i && !i.done && (n = a.return) && n.call(a);
      } finally {
        if (p) throw p.error;
      }
    }
    return v;
  }, _ = ft && ft.__values || function(e) {
    var r = typeof Symbol == "function" && Symbol.iterator, n = r && e[r], a = 0;
    if (n) return n.call(e);
    if (e && typeof e.length == "number") return {
      next: function() {
        return e && a >= e.length && (e = void 0), { value: e && e[a++], done: !e };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, X = ft && ft.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(ft, "__esModule", { value: !0 });
  var j = At(), E = X(pt()), m = X(Et()), d = X(St()), c = Mt(), h;
  return (function(e) {
    var r = 7.2, n = 72, a = {
      em: function(P) {
        return P;
      },
      ex: function(P) {
        return P * 0.43;
      },
      pt: function(P) {
        return P / 10;
      },
      pc: function(P) {
        return P * 1.2;
      },
      px: function(P) {
        return P * r / n;
      },
      in: function(P) {
        return P * r;
      },
      cm: function(P) {
        return P * r / 2.54;
      },
      mm: function(P) {
        return P * r / 25.4;
      },
      mu: function(P) {
        return P / 18;
      }
    }, i = "([-+]?([.,]\\d+|\\d+([.,]\\d*)?))", v = "(pt|em|ex|mu|px|mm|cm|in|pc)", p = RegExp("^\\s*" + i + "\\s*" + v + "\\s*$"), y = RegExp("^\\s*" + i + "\\s*" + v + " ?");
    function f(P, w) {
      w === void 0 && (w = !1);
      var B = P.match(w ? y : p);
      return B ? A([B[1].replace(/,/, "."), B[4], B[0].length]) : [null, null, 0];
    }
    e.matchDimen = f;
    function A(P) {
      var w = M(P, 3), B = w[0], K = w[1], D = w[2];
      if (K !== "mu")
        return [B, K, D];
      var U = C(a[K](parseFloat(B || "1")));
      return [U.slice(0, -2), "em", D];
    }
    function x(P) {
      var w = M(f(P), 2), B = w[0], K = w[1], D = parseFloat(B || "1"), U = a[K];
      return U ? U(D) : 0;
    }
    e.dimen2em = x;
    function C(P) {
      return Math.abs(P) < 6e-4 ? "0em" : P.toFixed(3).replace(/\.?0+$/, "") + "em";
    }
    e.Em = C;
    function t() {
      for (var P = [], w = 0; w < arguments.length; w++)
        P[w] = arguments[w];
      return P.map(function(B) {
        return C(B);
      }).join(" ");
    }
    e.cols = t;
    function u(P, w, B, K, D, U) {
      D === void 0 && (D = ""), U === void 0 && (U = "");
      var H = P.nodeFactory, G = H.create("node", "mrow", [], { open: w, close: K, texClass: j.TEXCLASS.INNER }), z;
      if (D)
        z = new m.default("\\" + D + "l" + w, P.parser.stack.env, P).mml();
      else {
        var Y = H.create("text", w);
        z = H.create("node", "mo", [], { fence: !0, stretchy: !0, symmetric: !0, texClass: j.TEXCLASS.OPEN }, Y);
      }
      if (E.default.appendChildren(G, [z, B]), D)
        z = new m.default("\\" + D + "r" + K, P.parser.stack.env, P).mml();
      else {
        var ot = H.create("text", K);
        z = H.create("node", "mo", [], { fence: !0, stretchy: !0, symmetric: !0, texClass: j.TEXCLASS.CLOSE }, ot);
      }
      return U && z.attributes.set("mathcolor", U), E.default.appendChildren(G, [z]), G;
    }
    e.fenced = u;
    function o(P, w, B, K) {
      var D = P.nodeFactory.create("node", "mrow", [], { open: w, close: K, texClass: j.TEXCLASS.ORD });
      return w && E.default.appendChildren(D, [s(P, w, "l")]), E.default.isType(B, "mrow") ? E.default.appendChildren(D, E.default.getChildren(B)) : E.default.appendChildren(D, [B]), K && E.default.appendChildren(D, [s(P, K, "r")]), D;
    }
    e.fixedFence = o;
    function s(P, w, B) {
      (w === "{" || w === "}") && (w = "\\" + w);
      var K = "{\\bigg" + B + " " + w + "}", D = "{\\big" + B + " " + w + "}";
      return new m.default("\\mathchoice" + K + D + D + D, {}, P).mml();
    }
    e.mathPalette = s;
    function l(P, w) {
      for (var B = 0, K = w.length; B < K; B++) {
        var D = w[B];
        if (D && !E.default.isType(D, "mspace") && (!E.default.isType(D, "TeXAtom") || E.default.getChildren(D)[0] && E.default.getChildren(E.default.getChildren(D)[0]).length)) {
          if (E.default.isEmbellished(D) || E.default.isType(D, "TeXAtom") && E.default.getTexClass(D) === j.TEXCLASS.REL) {
            var U = P.nodeFactory.create("node", "mi");
            w.unshift(U);
          }
          break;
        }
      }
    }
    e.fixInitialMO = l;
    function O(P, w, B, K) {
      if (P.configuration.options.internalMath)
        return P.configuration.options.internalMath(P, w, B, K);
      var D = K || P.stack.env.font, U = D ? { mathvariant: D } : {}, H = [], G = 0, z = 0, Y, ot, Q = "", gt = 0;
      if (w.match(/\\?[${}\\]|\\\(|\\(eq)?ref\s*\{/)) {
        for (; G < w.length; )
          if (Y = w.charAt(G++), Y === "$")
            Q === "$" && gt === 0 ? (ot = P.create("node", "TeXAtom", [new m.default(w.slice(z, G - 1), {}, P.configuration).mml()]), H.push(ot), Q = "", z = G) : Q === "" && (z < G - 1 && H.push(k(P, w.slice(z, G - 1), U)), Q = "$", z = G);
          else if (Y === "{" && Q !== "")
            gt++;
          else if (Y === "}")
            if (Q === "}" && gt === 0) {
              var ae = new m.default(w.slice(z, G), {}, P.configuration).mml();
              ot = P.create("node", "TeXAtom", [ae], U), H.push(ot), Q = "", z = G;
            } else Q !== "" && gt && gt--;
          else if (Y === "\\")
            if (Q === "" && w.substr(G).match(/^(eq)?ref\s*\{/)) {
              var ie = RegExp["$&"].length;
              z < G - 1 && H.push(k(P, w.slice(z, G - 1), U)), Q = "}", z = G - 1, G += ie;
            } else
              Y = w.charAt(G++), Y === "(" && Q === "" ? (z < G - 2 && H.push(k(P, w.slice(z, G - 2), U)), Q = ")", z = G) : Y === ")" && Q === ")" && gt === 0 ? (ot = P.create("node", "TeXAtom", [new m.default(w.slice(z, G - 2), {}, P.configuration).mml()]), H.push(ot), Q = "", z = G) : Y.match(/[${}\\]/) && Q === "" && (G--, w = w.substr(0, G - 1) + w.substr(G));
        if (Q !== "")
          throw new d.default("MathNotTerminated", "Math not terminated in text box");
      }
      return z < w.length && H.push(k(P, w.slice(z), U)), B != null ? H = [P.create("node", "mstyle", H, { displaystyle: !1, scriptlevel: B })] : H.length > 1 && (H = [P.create("node", "mrow", H)]), H;
    }
    e.internalMath = O;
    function k(P, w, B) {
      w = w.replace(/^\s+/, c.entities.nbsp).replace(/\s+$/, c.entities.nbsp);
      var K = P.create("text", w);
      return P.create("node", "mtext", [], B, K);
    }
    e.internalText = k;
    function N(P, w, B, K, D) {
      if (e.checkMovableLimits(w), E.default.isType(w, "munderover") && E.default.isEmbellished(w)) {
        E.default.setProperties(E.default.getCoreMO(w), { lspace: 0, rspace: 0 });
        var U = P.create("node", "mo", [], { rspace: 0 });
        w = P.create("node", "mrow", [U, w]);
      }
      var H = P.create("node", "munderover", [w]);
      E.default.setChild(H, K === "over" ? H.over : H.under, B);
      var G = H;
      return D && (G = P.create("node", "TeXAtom", [H], { texClass: j.TEXCLASS.OP, movesupsub: !0 })), E.default.setProperty(G, "subsupOK", !0), G;
    }
    e.underOver = N;
    function I(P) {
      var w = E.default.isType(P, "mo") ? E.default.getForm(P) : null;
      (E.default.getProperty(P, "movablelimits") || w && w[3] && w[3].movablelimits) && E.default.setProperties(P, { movablelimits: !1 });
    }
    e.checkMovableLimits = I;
    function F(P) {
      if (typeof P != "string")
        return P;
      var w = P.trim();
      return w.match(/\\$/) && P.match(/ $/) && (w += " "), w;
    }
    e.trimSpaces = F;
    function R(P, w) {
      return w = e.trimSpaces(w || ""), w === "t" ? P.arraydef.align = "baseline 1" : w === "b" ? P.arraydef.align = "baseline -1" : w === "c" ? P.arraydef.align = "axis" : w && (P.arraydef.align = w), P;
    }
    e.setArrayAlign = R;
    function $(P, w, B) {
      for (var K = "", D = "", U = 0; U < B.length; ) {
        var H = B.charAt(U++);
        if (H === "\\")
          K += H + B.charAt(U++);
        else if (H === "#")
          if (H = B.charAt(U++), H === "#")
            K += H;
          else {
            if (!H.match(/[1-9]/) || parseInt(H, 10) > w.length)
              throw new d.default("IllegalMacroParam", "Illegal macro parameter reference");
            D = J(P, J(P, D, K), w[parseInt(H, 10) - 1]), K = "";
          }
        else
          K += H;
      }
      return J(P, D, K);
    }
    e.substituteArgs = $;
    function J(P, w, B) {
      if (B.match(/^[a-z]/i) && w.match(/(^|[^\\])(\\\\)*\\[a-z]+$/i) && (w += " "), w.length + B.length > P.configuration.options.maxBuffer)
        throw new d.default("MaxBufferSize", "MathJax internal buffer size exceeded; is there a recursive macro call?");
      return w + B;
    }
    e.addArgs = J;
    function S(P, w) {
      if (w === void 0 && (w = !0), !(++P.macroCount <= P.configuration.options.maxMacros))
        throw w ? new d.default("MaxMacroSub1", "MathJax maximum macro substitution count exceeded; is here a recursive macro call?") : new d.default("MaxMacroSub2", "MathJax maximum substitution count exceeded; is there a recursive latex environment?");
    }
    e.checkMaxMacros = S;
    function b(P) {
      if (P.stack.global.eqnenv)
        throw new d.default("ErroneousNestingEq", "Erroneous nesting of equation structures");
      P.stack.global.eqnenv = !0;
    }
    e.checkEqnEnv = b;
    function g(P, w) {
      var B = P.copy(), K = w.configuration;
      return B.walkTree(function(D) {
        var U, H;
        K.addNode(D.kind, D);
        var G = (D.getProperty("in-lists") || "").split(/,/);
        try {
          for (var z = _(G), Y = z.next(); !Y.done; Y = z.next()) {
            var ot = Y.value;
            ot && K.addNode(ot, D);
          }
        } catch (Q) {
          U = { error: Q };
        } finally {
          try {
            Y && !Y.done && (H = z.return) && H.call(z);
          } finally {
            if (U) throw U.error;
          }
        }
      }), B;
    }
    e.copyNode = g;
    function T(P, w, B) {
      return B;
    }
    e.MmlFilterAttribute = T;
    function L(P) {
      var w = P.stack.env.font;
      return w ? { mathvariant: w } : {};
    }
    e.getFontDef = L;
    function V(P, w, B) {
      var K, D;
      w === void 0 && (w = null), B === void 0 && (B = !1);
      var U = rt(P);
      if (w)
        try {
          for (var H = _(Object.keys(U)), G = H.next(); !G.done; G = H.next()) {
            var z = G.value;
            if (!w.hasOwnProperty(z)) {
              if (B)
                throw new d.default("InvalidOption", "Invalid option: %1", z);
              delete U[z];
            }
          }
        } catch (Y) {
          K = { error: Y };
        } finally {
          try {
            G && !G.done && (D = H.return) && D.call(H);
          } finally {
            if (K) throw K.error;
          }
        }
      return U;
    }
    e.keyvalOptions = V;
    function rt(P) {
      for (var w, B, K = {}, D = P, U, H, G; D; )
        w = M(_t(D, ["=", ","]), 3), H = w[0], U = w[1], D = w[2], U === "=" ? (B = M(_t(D, [","]), 3), G = B[0], U = B[1], D = B[2], G = G === "false" || G === "true" ? JSON.parse(G) : G, K[H] = G) : H && (K[H] = !0);
      return K;
    }
    function lt(P, w) {
      for (; w > 0; )
        P = P.trim().slice(1, -1), w--;
      return P.trim();
    }
    function _t(P, w) {
      for (var B = P.length, K = 0, D = "", U = 0, H = 0, G = !0, z = !1; U < B; ) {
        var Y = P[U++];
        switch (Y) {
          case " ":
            break;
          case "{":
            G ? H++ : (z = !1, H > K && (H = K)), K++;
            break;
          case "}":
            K && K--, (G || z) && (H--, z = !0), G = !1;
            break;
          default:
            if (!K && w.indexOf(Y) !== -1)
              return [z ? "true" : lt(D, H), Y, P.slice(U)];
            G = !1, z = !1;
        }
        D += Y;
      }
      if (K)
        throw new d.default("ExtraOpenMissingClose", "Extra open brace or missing close brace");
      return [z ? "true" : lt(D, H), "", P.slice(U)];
    }
  })(h || (h = {})), ft.default = h, ft;
}
var at = {}, Nt;
function le() {
  if (Nt) return at;
  Nt = 1;
  var M = at && at.__values || function(d) {
    var c = typeof Symbol == "function" && Symbol.iterator, h = c && d[c], e = 0;
    if (h) return h.call(d);
    if (d && typeof d.length == "number") return {
      next: function() {
        return d && e >= d.length && (d = void 0), { value: d && d[e++], done: !d };
      }
    };
    throw new TypeError(c ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, _ = at && at.__read || function(d, c) {
    var h = typeof Symbol == "function" && d[Symbol.iterator];
    if (!h) return d;
    var e = h.call(d), r, n = [], a;
    try {
      for (; (c === void 0 || c-- > 0) && !(r = e.next()).done; ) n.push(r.value);
    } catch (i) {
      a = { error: i };
    } finally {
      try {
        r && !r.done && (h = e.return) && h.call(e);
      } finally {
        if (a) throw a.error;
      }
    }
    return n;
  }, X = at && at.__spreadArray || function(d, c, h) {
    if (h || arguments.length === 2) for (var e = 0, r = c.length, n; e < r; e++)
      (n || !(e in c)) && (n || (n = Array.prototype.slice.call(c, 0, e)), n[e] = c[e]);
    return d.concat(n || Array.prototype.slice.call(c));
  }, j = at && at.__importDefault || function(d) {
    return d && d.__esModule ? d : { default: d };
  };
  Object.defineProperty(at, "__esModule", { value: !0 });
  var E = j(pt()), m = (function() {
    function d(c, h, e) {
      this._factory = c, this._env = h, this.global = {}, this.stack = [], this.global = { isInner: e }, this.stack = [this._factory.create("start", this.global)], h && (this.stack[0].env = h), this.env = this.stack[0].env;
    }
    return Object.defineProperty(d.prototype, "env", {
      get: function() {
        return this._env;
      },
      set: function(c) {
        this._env = c;
      },
      enumerable: !1,
      configurable: !0
    }), d.prototype.Push = function() {
      for (var c, h, e = [], r = 0; r < arguments.length; r++)
        e[r] = arguments[r];
      try {
        for (var n = M(e), a = n.next(); !a.done; a = n.next()) {
          var i = a.value;
          if (i) {
            var v = E.default.isNode(i) ? this._factory.create("mml", i) : i;
            v.global = this.global;
            var p = _(this.stack.length ? this.Top().checkItem(v) : [null, !0], 2), y = p[0], f = p[1];
            if (f) {
              if (y) {
                this.Pop(), this.Push.apply(this, X([], _(y), !1));
                continue;
              }
              this.stack.push(v), v.env ? (v.copyEnv && Object.assign(v.env, this.env), this.env = v.env) : v.env = this.env;
            }
          }
        }
      } catch (A) {
        c = { error: A };
      } finally {
        try {
          a && !a.done && (h = n.return) && h.call(n);
        } finally {
          if (c) throw c.error;
        }
      }
    }, d.prototype.Pop = function() {
      var c = this.stack.pop();
      return c.isOpen || delete c.env, this.env = this.stack.length ? this.Top().env : {}, c;
    }, d.prototype.Top = function(c) {
      return c === void 0 && (c = 1), this.stack.length < c ? null : this.stack[this.stack.length - c];
    }, d.prototype.Prev = function(c) {
      var h = this.Top();
      return c ? h.First : h.Pop();
    }, d.prototype.toString = function() {
      return `stack[
  ` + this.stack.join(`
  `) + `
]`;
    }, d;
  })();
  return at.default = m, at;
}
var Rt;
function Et() {
  if (Rt) return nt;
  Rt = 1;
  var M = nt && nt.__values || function(e) {
    var r = typeof Symbol == "function" && Symbol.iterator, n = r && e[r], a = 0;
    if (n) return n.call(e);
    if (e && typeof e.length == "number") return {
      next: function() {
        return e && a >= e.length && (e = void 0), { value: e && e[a++], done: !e };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, _ = nt && nt.__read || function(e, r) {
    var n = typeof Symbol == "function" && e[Symbol.iterator];
    if (!n) return e;
    var a = n.call(e), i, v = [], p;
    try {
      for (; (r === void 0 || r-- > 0) && !(i = a.next()).done; ) v.push(i.value);
    } catch (y) {
      p = { error: y };
    } finally {
      try {
        i && !i.done && (n = a.return) && n.call(a);
      } finally {
        if (p) throw p.error;
      }
    }
    return v;
  }, X = nt && nt.__spreadArray || function(e, r, n) {
    if (n || arguments.length === 2) for (var a = 0, i = r.length, v; a < i; a++)
      (v || !(a in r)) && (v || (v = Array.prototype.slice.call(r, 0, a)), v[a] = r[a]);
    return e.concat(v || Array.prototype.slice.call(r));
  }, j = nt && nt.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(nt, "__esModule", { value: !0 });
  var E = j(Ct()), m = j(le()), d = j(St()), c = At(), h = (function() {
    function e(r, n, a) {
      var i, v;
      this._string = r, this.configuration = a, this.macroCount = 0, this.i = 0, this.currentCS = "";
      var p = n.hasOwnProperty("isInner"), y = n.isInner;
      delete n.isInner;
      var f;
      if (n) {
        f = {};
        try {
          for (var A = M(Object.keys(n)), x = A.next(); !x.done; x = A.next()) {
            var C = x.value;
            f[C] = n[C];
          }
        } catch (t) {
          i = { error: t };
        } finally {
          try {
            x && !x.done && (v = A.return) && v.call(A);
          } finally {
            if (i) throw i.error;
          }
        }
      }
      this.configuration.pushParser(this), this.stack = new m.default(this.itemFactory, f, p ? y : !0), this.Parse(), this.Push(this.itemFactory.create("stop"));
    }
    return Object.defineProperty(e.prototype, "options", {
      get: function() {
        return this.configuration.options;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "itemFactory", {
      get: function() {
        return this.configuration.itemFactory;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "tags", {
      get: function() {
        return this.configuration.tags;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "string", {
      get: function() {
        return this._string;
      },
      set: function(r) {
        this._string = r;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.parse = function(r, n) {
      return this.configuration.handlers.get(r).parse(n);
    }, e.prototype.lookup = function(r, n) {
      return this.configuration.handlers.get(r).lookup(n);
    }, e.prototype.contains = function(r, n) {
      return this.configuration.handlers.get(r).contains(n);
    }, e.prototype.toString = function() {
      var r, n, a = "";
      try {
        for (var i = M(Array.from(this.configuration.handlers.keys())), v = i.next(); !v.done; v = i.next()) {
          var p = v.value;
          a += p + ": " + this.configuration.handlers.get(p) + `
`;
        }
      } catch (y) {
        r = { error: y };
      } finally {
        try {
          v && !v.done && (n = i.return) && n.call(i);
        } finally {
          if (r) throw r.error;
        }
      }
      return a;
    }, e.prototype.Parse = function() {
      for (var r; this.i < this.string.length; )
        r = this.getCodePoint(), this.i += r.length, this.parse("character", [this, r]);
    }, e.prototype.Push = function(r) {
      r instanceof c.AbstractMmlNode && r.isInferred ? this.PushAll(r.childNodes) : this.stack.Push(r);
    }, e.prototype.PushAll = function(r) {
      var n, a;
      try {
        for (var i = M(r), v = i.next(); !v.done; v = i.next()) {
          var p = v.value;
          this.stack.Push(p);
        }
      } catch (y) {
        n = { error: y };
      } finally {
        try {
          v && !v.done && (a = i.return) && a.call(i);
        } finally {
          if (n) throw n.error;
        }
      }
    }, e.prototype.mml = function() {
      if (!this.stack.Top().isKind("mml"))
        return null;
      var r = this.stack.Top().First;
      return this.configuration.popParser(), r;
    }, e.prototype.convertDelimiter = function(r) {
      var n = this.lookup("delimiter", r);
      return n ? n.char : null;
    }, e.prototype.getCodePoint = function() {
      var r = this.string.codePointAt(this.i);
      return r === void 0 ? "" : String.fromCodePoint(r);
    }, e.prototype.nextIsSpace = function() {
      return !!this.string.charAt(this.i).match(/\s/);
    }, e.prototype.GetNext = function() {
      for (; this.nextIsSpace(); )
        this.i++;
      return this.getCodePoint();
    }, e.prototype.GetCS = function() {
      var r = this.string.slice(this.i).match(/^(([a-z]+) ?|[\uD800-\uDBFF].|.)/i);
      return r ? (this.i += r[0].length, r[2] || r[1]) : (this.i++, " ");
    }, e.prototype.GetArgument = function(r, n) {
      switch (this.GetNext()) {
        case "":
          if (!n)
            throw new d.default("MissingArgFor", "Missing argument for %1", this.currentCS);
          return null;
        case "}":
          if (!n)
            throw new d.default("ExtraCloseMissingOpen", "Extra close brace or missing open brace");
          return null;
        case "\\":
          return this.i++, "\\" + this.GetCS();
        case "{":
          for (var a = ++this.i, i = 1; this.i < this.string.length; )
            switch (this.string.charAt(this.i++)) {
              case "\\":
                this.i++;
                break;
              case "{":
                i++;
                break;
              case "}":
                if (--i === 0)
                  return this.string.slice(a, this.i - 1);
                break;
            }
          throw new d.default("MissingCloseBrace", "Missing close brace");
      }
      var v = this.getCodePoint();
      return this.i += v.length, v;
    }, e.prototype.GetBrackets = function(r, n) {
      if (this.GetNext() !== "[")
        return n;
      for (var a = ++this.i, i = 0; this.i < this.string.length; )
        switch (this.string.charAt(this.i++)) {
          case "{":
            i++;
            break;
          case "\\":
            this.i++;
            break;
          case "}":
            if (i-- <= 0)
              throw new d.default("ExtraCloseLooking", "Extra close brace while looking for %1", "']'");
            break;
          case "]":
            if (i === 0)
              return this.string.slice(a, this.i - 1);
            break;
        }
      throw new d.default("MissingCloseBracket", "Could not find closing ']' for argument to %1", this.currentCS);
    }, e.prototype.GetDelimiter = function(r, n) {
      var a = this.GetNext();
      if (this.i += a.length, this.i <= this.string.length && (a === "\\" ? a += this.GetCS() : a === "{" && n && (this.i--, a = this.GetArgument(r).trim()), this.contains("delimiter", a)))
        return this.convertDelimiter(a);
      throw new d.default("MissingOrUnrecognizedDelim", "Missing or unrecognized delimiter for %1", this.currentCS);
    }, e.prototype.GetDimen = function(r) {
      if (this.GetNext() === "{") {
        var n = this.GetArgument(r), a = _(E.default.matchDimen(n), 2), i = a[0], v = a[1];
        if (i)
          return i + v;
      } else {
        var n = this.string.slice(this.i), p = _(E.default.matchDimen(n, !0), 3), i = p[0], v = p[1], y = p[2];
        if (i)
          return this.i += y, i + v;
      }
      throw new d.default("MissingDimOrUnits", "Missing dimension or its units for %1", this.currentCS);
    }, e.prototype.GetUpTo = function(r, n) {
      for (; this.nextIsSpace(); )
        this.i++;
      for (var a = this.i, i = 0; this.i < this.string.length; ) {
        var v = this.i, p = this.GetNext();
        switch (this.i += p.length, p) {
          case "\\":
            p += this.GetCS();
            break;
          case "{":
            i++;
            break;
          case "}":
            if (i === 0)
              throw new d.default("ExtraCloseLooking", "Extra close brace while looking for %1", n);
            i--;
            break;
        }
        if (i === 0 && p === n)
          return this.string.slice(a, v);
      }
      throw new d.default("TokenNotFoundForCommand", "Could not find %1 for %2", n, this.currentCS);
    }, e.prototype.ParseArg = function(r) {
      return new e(this.GetArgument(r), this.stack.env, this.configuration).mml();
    }, e.prototype.ParseUpTo = function(r, n) {
      return new e(this.GetUpTo(r, n), this.stack.env, this.configuration).mml();
    }, e.prototype.GetDelimiterArg = function(r) {
      var n = E.default.trimSpaces(this.GetArgument(r));
      if (n === "")
        return null;
      if (this.contains("delimiter", n))
        return n;
      throw new d.default("MissingOrUnrecognizedDelim", "Missing or unrecognized delimiter for %1", this.currentCS);
    }, e.prototype.GetStar = function() {
      var r = this.GetNext() === "*";
      return r && this.i++, r;
    }, e.prototype.create = function(r) {
      for (var n, a = [], i = 1; i < arguments.length; i++)
        a[i - 1] = arguments[i];
      return (n = this.configuration.nodeFactory).create.apply(n, X([r], _(a), !1));
    }, e;
  })();
  return nt.default = h, nt;
}
var it = {}, bt = {}, tt = {}, jt;
function ee() {
  if (jt) return tt;
  jt = 1;
  var M = tt && tt.__extends || /* @__PURE__ */ (function() {
    var h = function(e, r) {
      return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, a) {
        n.__proto__ = a;
      } || function(n, a) {
        for (var i in a) Object.prototype.hasOwnProperty.call(a, i) && (n[i] = a[i]);
      }, h(e, r);
    };
    return function(e, r) {
      if (typeof r != "function" && r !== null)
        throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
      h(e, r);
      function n() {
        this.constructor = e;
      }
      e.prototype = r === null ? Object.create(r) : (n.prototype = r.prototype, new n());
    };
  })(), _ = tt && tt.__read || function(h, e) {
    var r = typeof Symbol == "function" && h[Symbol.iterator];
    if (!r) return h;
    var n = r.call(h), a, i = [], v;
    try {
      for (; (e === void 0 || e-- > 0) && !(a = n.next()).done; ) i.push(a.value);
    } catch (p) {
      v = { error: p };
    } finally {
      try {
        a && !a.done && (r = n.return) && r.call(n);
      } finally {
        if (v) throw v.error;
      }
    }
    return i;
  }, X = tt && tt.__spreadArray || function(h, e, r) {
    if (r || arguments.length === 2) for (var n = 0, a = e.length, i; n < a; n++)
      (i || !(n in e)) && (i || (i = Array.prototype.slice.call(e, 0, n)), i[n] = e[n]);
    return h.concat(i || Array.prototype.slice.call(e));
  }, j = tt && tt.__values || function(h) {
    var e = typeof Symbol == "function" && Symbol.iterator, r = e && h[e], n = 0;
    if (r) return r.call(h);
    if (h && typeof h.length == "number") return {
      next: function() {
        return h && n >= h.length && (h = void 0), { value: h && h[n++], done: !h };
      }
    };
    throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, E = tt && tt.__importDefault || function(h) {
    return h && h.__esModule ? h : { default: h };
  };
  Object.defineProperty(tt, "__esModule", { value: !0 }), tt.BaseItem = tt.MmlStack = void 0;
  var m = E(St()), d = (function() {
    function h(e) {
      this._nodes = e;
    }
    return Object.defineProperty(h.prototype, "nodes", {
      get: function() {
        return this._nodes;
      },
      enumerable: !1,
      configurable: !0
    }), h.prototype.Push = function() {
      for (var e, r = [], n = 0; n < arguments.length; n++)
        r[n] = arguments[n];
      (e = this._nodes).push.apply(e, X([], _(r), !1));
    }, h.prototype.Pop = function() {
      return this._nodes.pop();
    }, Object.defineProperty(h.prototype, "First", {
      get: function() {
        return this._nodes[this.Size() - 1];
      },
      set: function(e) {
        this._nodes[this.Size() - 1] = e;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(h.prototype, "Last", {
      get: function() {
        return this._nodes[0];
      },
      set: function(e) {
        this._nodes[0] = e;
      },
      enumerable: !1,
      configurable: !0
    }), h.prototype.Peek = function(e) {
      return e == null && (e = 1), this._nodes.slice(this.Size() - e);
    }, h.prototype.Size = function() {
      return this._nodes.length;
    }, h.prototype.Clear = function() {
      this._nodes = [];
    }, h.prototype.toMml = function(e, r) {
      return e === void 0 && (e = !0), this._nodes.length === 1 && !r ? this.First : this.create("node", e ? "inferredMrow" : "mrow", this._nodes, {});
    }, h.prototype.create = function(e) {
      for (var r, n = [], a = 1; a < arguments.length; a++)
        n[a - 1] = arguments[a];
      return (r = this.factory.configuration.nodeFactory).create.apply(r, X([e], _(n), !1));
    }, h;
  })();
  tt.MmlStack = d;
  var c = (function(h) {
    M(e, h);
    function e(r) {
      for (var n = [], a = 1; a < arguments.length; a++)
        n[a - 1] = arguments[a];
      var i = h.call(this, n) || this;
      return i.factory = r, i.global = {}, i._properties = {}, i.isOpen && (i._env = {}), i;
    }
    return Object.defineProperty(e.prototype, "kind", {
      get: function() {
        return "base";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "env", {
      get: function() {
        return this._env;
      },
      set: function(r) {
        this._env = r;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "copyEnv", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.getProperty = function(r) {
      return this._properties[r];
    }, e.prototype.setProperty = function(r, n) {
      return this._properties[r] = n, this;
    }, Object.defineProperty(e.prototype, "isOpen", {
      get: function() {
        return !1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "isClose", {
      get: function() {
        return !1;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(e.prototype, "isFinal", {
      get: function() {
        return !1;
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.isKind = function(r) {
      return r === this.kind;
    }, e.prototype.checkItem = function(r) {
      if (r.isKind("over") && this.isOpen && (r.setProperty("num", this.toMml(!1)), this.Clear()), r.isKind("cell") && this.isOpen) {
        if (r.getProperty("linebreak"))
          return e.fail;
        throw new m.default("Misplaced", "Misplaced %1", r.getName());
      }
      if (r.isClose && this.getErrors(r.kind)) {
        var n = _(this.getErrors(r.kind), 2), a = n[0], i = n[1];
        throw new m.default(a, i, r.getName());
      }
      return r.isFinal ? (this.Push(r.First), e.fail) : e.success;
    }, e.prototype.clearEnv = function() {
      var r, n;
      try {
        for (var a = j(Object.keys(this.env)), i = a.next(); !i.done; i = a.next()) {
          var v = i.value;
          delete this.env[v];
        }
      } catch (p) {
        r = { error: p };
      } finally {
        try {
          i && !i.done && (n = a.return) && n.call(a);
        } finally {
          if (r) throw r.error;
        }
      }
    }, e.prototype.setProperties = function(r) {
      return Object.assign(this._properties, r), this;
    }, e.prototype.getName = function() {
      return this.getProperty("name");
    }, e.prototype.toString = function() {
      return this.kind + "[" + this.nodes.join("; ") + "]";
    }, e.prototype.getErrors = function(r) {
      var n = this.constructor;
      return (n.errors || {})[r] || e.errors[r];
    }, e.fail = [null, !1], e.success = [null, !0], e.errors = {
      end: ["MissingBeginExtraEnd", "Missing \\begin{%1} or extra \\end{%1}"],
      close: ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"],
      right: ["MissingLeftExtraRight", "Missing \\left or extra \\right"],
      middle: ["ExtraMiddle", "Extra \\middle"]
    }, e;
  })(d);
  return tt.BaseItem = c, tt;
}
var Bt;
function ce() {
  if (Bt) return bt;
  Bt = 1;
  var M = bt && bt.__extends || /* @__PURE__ */ (function() {
    var d = function(c, h) {
      return d = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
        e.__proto__ = r;
      } || function(e, r) {
        for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
      }, d(c, h);
    };
    return function(c, h) {
      if (typeof h != "function" && h !== null)
        throw new TypeError("Class extends value " + String(h) + " is not a constructor or null");
      d(c, h);
      function e() {
        this.constructor = c;
      }
      c.prototype = h === null ? Object.create(h) : (e.prototype = h.prototype, new e());
    };
  })(), _;
  Object.defineProperty(bt, "__esModule", { value: !0 });
  var X = ee(), j = ue(), E = (function(d) {
    M(c, d);
    function c() {
      return d !== null && d.apply(this, arguments) || this;
    }
    return c;
  })(X.BaseItem), m = (function(d) {
    M(c, d);
    function c() {
      var h = d !== null && d.apply(this, arguments) || this;
      return h.defaultKind = "dummy", h.configuration = null, h;
    }
    return c.DefaultStackItems = (_ = {}, _[E.prototype.kind] = E, _), c;
  })(j.AbstractFactory);
  return bt.default = m, bt;
}
var ut = {}, Dt;
function fe() {
  if (Dt) return ut;
  Dt = 1;
  var M = ut && ut.__read || function(m, d) {
    var c = typeof Symbol == "function" && m[Symbol.iterator];
    if (!c) return m;
    var h = c.call(m), e, r = [], n;
    try {
      for (; (d === void 0 || d-- > 0) && !(e = h.next()).done; ) r.push(e.value);
    } catch (a) {
      n = { error: a };
    } finally {
      try {
        e && !e.done && (c = h.return) && c.call(h);
      } finally {
        if (n) throw n.error;
      }
    }
    return r;
  }, _ = ut && ut.__spreadArray || function(m, d, c) {
    if (c || arguments.length === 2) for (var h = 0, e = d.length, r; h < e; h++)
      (r || !(h in d)) && (r || (r = Array.prototype.slice.call(d, 0, h)), r[h] = d[h]);
    return m.concat(r || Array.prototype.slice.call(d));
  }, X = ut && ut.__importDefault || function(m) {
    return m && m.__esModule ? m : { default: m };
  };
  Object.defineProperty(ut, "__esModule", { value: !0 }), ut.NodeFactory = void 0;
  var j = X(pt()), E = (function() {
    function m() {
      this.mmlFactory = null, this.factory = {
        node: m.createNode,
        token: m.createToken,
        text: m.createText,
        error: m.createError
      };
    }
    return m.createNode = function(d, c, h, e, r) {
      h === void 0 && (h = []), e === void 0 && (e = {});
      var n = d.mmlFactory.create(c);
      return n.setChildren(h), r && n.appendChild(r), j.default.setProperties(n, e), n;
    }, m.createToken = function(d, c, h, e) {
      h === void 0 && (h = {}), e === void 0 && (e = "");
      var r = d.create("text", e);
      return d.create("node", c, [], h, r);
    }, m.createText = function(d, c) {
      return c == null ? null : d.mmlFactory.create("text").setText(c);
    }, m.createError = function(d, c) {
      var h = d.create("text", c), e = d.create("node", "mtext", [], {}, h), r = d.create("node", "merror", [e], { "data-mjx-error": c });
      return r;
    }, m.prototype.setMmlFactory = function(d) {
      this.mmlFactory = d;
    }, m.prototype.set = function(d, c) {
      this.factory[d] = c;
    }, m.prototype.setCreators = function(d) {
      for (var c in d)
        this.set(c, d[c]);
    }, m.prototype.create = function(d) {
      for (var c = [], h = 1; h < arguments.length; h++)
        c[h - 1] = arguments[h];
      var e = this.factory[d] || this.factory.node, r = e.apply(void 0, _([this, c[0]], M(c.slice(1)), !1));
      return d === "node" && this.configuration.addNode(c[0], r), r;
    }, m.prototype.get = function(d) {
      return this.factory[d];
    }, m;
  })();
  return ut.NodeFactory = E, ut;
}
var qt;
function Ce() {
  if (qt) return it;
  qt = 1;
  var M = it && it.__read || function(e, r) {
    var n = typeof Symbol == "function" && e[Symbol.iterator];
    if (!n) return e;
    var a = n.call(e), i, v = [], p;
    try {
      for (; (r === void 0 || r-- > 0) && !(i = a.next()).done; ) v.push(i.value);
    } catch (y) {
      p = { error: y };
    } finally {
      try {
        i && !i.done && (n = a.return) && n.call(a);
      } finally {
        if (p) throw p.error;
      }
    }
    return v;
  }, _ = it && it.__spreadArray || function(e, r, n) {
    if (n || arguments.length === 2) for (var a = 0, i = r.length, v; a < i; a++)
      (v || !(a in r)) && (v || (v = Array.prototype.slice.call(r, 0, a)), v[a] = r[a]);
    return e.concat(v || Array.prototype.slice.call(r));
  }, X = it && it.__values || function(e) {
    var r = typeof Symbol == "function" && Symbol.iterator, n = r && e[r], a = 0;
    if (n) return n.call(e);
    if (e && typeof e.length == "number") return {
      next: function() {
        return e && a >= e.length && (e = void 0), { value: e && e[a++], done: !e };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, j = it && it.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(it, "__esModule", { value: !0 });
  var E = j(ce()), m = fe(), d = j(pt()), c = wt(), h = (function() {
    function e(r, n) {
      n === void 0 && (n = []), this.options = {}, this.packageData = /* @__PURE__ */ new Map(), this.parsers = [], this.root = null, this.nodeLists = {}, this.error = !1, this.handlers = r.handlers, this.nodeFactory = new m.NodeFactory(), this.nodeFactory.configuration = this, this.nodeFactory.setCreators(r.nodes), this.itemFactory = new E.default(r.items), this.itemFactory.configuration = this, c.defaultOptions.apply(void 0, _([this.options], M(n), !1)), (0, c.defaultOptions)(this.options, r.options);
    }
    return e.prototype.pushParser = function(r) {
      this.parsers.unshift(r);
    }, e.prototype.popParser = function() {
      this.parsers.shift();
    }, Object.defineProperty(e.prototype, "parser", {
      get: function() {
        return this.parsers[0];
      },
      enumerable: !1,
      configurable: !0
    }), e.prototype.clear = function() {
      this.parsers = [], this.root = null, this.nodeLists = {}, this.error = !1, this.tags.resetTag();
    }, e.prototype.addNode = function(r, n) {
      var a = this.nodeLists[r];
      if (a || (a = this.nodeLists[r] = []), a.push(n), n.kind !== r) {
        var i = d.default.getProperty(n, "in-lists") || "", v = (i ? i.split(/,/) : []).concat(r).join(",");
        d.default.setProperty(n, "in-lists", v);
      }
    }, e.prototype.getList = function(r) {
      var n, a, i = this.nodeLists[r] || [], v = [];
      try {
        for (var p = X(i), y = p.next(); !y.done; y = p.next()) {
          var f = y.value;
          this.inTree(f) && v.push(f);
        }
      } catch (A) {
        n = { error: A };
      } finally {
        try {
          y && !y.done && (a = p.return) && a.call(p);
        } finally {
          if (n) throw n.error;
        }
      }
      return this.nodeLists[r] = v, v;
    }, e.prototype.removeFromList = function(r, n) {
      var a, i, v = this.nodeLists[r] || [];
      try {
        for (var p = X(n), y = p.next(); !y.done; y = p.next()) {
          var f = y.value, A = v.indexOf(f);
          A >= 0 && v.splice(A, 1);
        }
      } catch (x) {
        a = { error: x };
      } finally {
        try {
          y && !y.done && (i = p.return) && i.call(p);
        } finally {
          if (a) throw a.error;
        }
      }
    }, e.prototype.inTree = function(r) {
      for (; r && r !== this.root; )
        r = r.parent;
      return !!r;
    }, e;
  })();
  return it.default = h, it;
}
var dt = {}, Xt;
function xt() {
  return Xt || (Xt = 1, (function(M) {
    var _ = dt && dt.__extends || /* @__PURE__ */ (function() {
      var r = function(n, a) {
        return r = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(i, v) {
          i.__proto__ = v;
        } || function(i, v) {
          for (var p in v) Object.prototype.hasOwnProperty.call(v, p) && (i[p] = v[p]);
        }, r(n, a);
      };
      return function(n, a) {
        if (typeof a != "function" && a !== null)
          throw new TypeError("Class extends value " + String(a) + " is not a constructor or null");
        r(n, a);
        function i() {
          this.constructor = n;
        }
        n.prototype = a === null ? Object.create(a) : (i.prototype = a.prototype, new i());
      };
    })(), X = dt && dt.__values || function(r) {
      var n = typeof Symbol == "function" && Symbol.iterator, a = n && r[n], i = 0;
      if (a) return a.call(r);
      if (r && typeof r.length == "number") return {
        next: function() {
          return r && i >= r.length && (r = void 0), { value: r && r[i++], done: !r };
        }
      };
      throw new TypeError(n ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, j = dt && dt.__importDefault || function(r) {
      return r && r.__esModule ? r : { default: r };
    };
    Object.defineProperty(M, "__esModule", { value: !0 }), M.TagsFactory = M.AllTags = M.NoTags = M.AbstractTags = M.TagInfo = M.Label = void 0;
    var E = j(Et()), m = /* @__PURE__ */ (function() {
      function r(n, a) {
        n === void 0 && (n = "???"), a === void 0 && (a = ""), this.tag = n, this.id = a;
      }
      return r;
    })();
    M.Label = m;
    var d = /* @__PURE__ */ (function() {
      function r(n, a, i, v, p, y, f, A) {
        n === void 0 && (n = ""), a === void 0 && (a = !1), i === void 0 && (i = !1), v === void 0 && (v = null), p === void 0 && (p = ""), y === void 0 && (y = ""), f === void 0 && (f = !1), A === void 0 && (A = ""), this.env = n, this.taggable = a, this.defaultTags = i, this.tag = v, this.tagId = p, this.tagFormat = y, this.noTag = f, this.labelId = A;
      }
      return r;
    })();
    M.TagInfo = d;
    var c = (function() {
      function r() {
        this.counter = 0, this.allCounter = 0, this.configuration = null, this.ids = {}, this.allIds = {}, this.labels = {}, this.allLabels = {}, this.redo = !1, this.refUpdate = !1, this.currentTag = new d(), this.history = [], this.stack = [], this.enTag = function(n, a) {
          var i = this.configuration.nodeFactory, v = i.create("node", "mtd", [n]), p = i.create("node", "mlabeledtr", [a, v]), y = i.create("node", "mtable", [p], {
            side: this.configuration.options.tagSide,
            minlabelspacing: this.configuration.options.tagIndent,
            displaystyle: !0
          });
          return y;
        };
      }
      return r.prototype.start = function(n, a, i) {
        this.currentTag && this.stack.push(this.currentTag), this.currentTag = new d(n, a, i);
      }, Object.defineProperty(r.prototype, "env", {
        get: function() {
          return this.currentTag.env;
        },
        enumerable: !1,
        configurable: !0
      }), r.prototype.end = function() {
        this.history.push(this.currentTag), this.currentTag = this.stack.pop();
      }, r.prototype.tag = function(n, a) {
        this.currentTag.tag = n, this.currentTag.tagFormat = a ? n : this.formatTag(n), this.currentTag.noTag = !1;
      }, r.prototype.notag = function() {
        this.tag("", !0), this.currentTag.noTag = !0;
      }, Object.defineProperty(r.prototype, "noTag", {
        get: function() {
          return this.currentTag.noTag;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(r.prototype, "label", {
        get: function() {
          return this.currentTag.labelId;
        },
        set: function(n) {
          this.currentTag.labelId = n;
        },
        enumerable: !1,
        configurable: !0
      }), r.prototype.formatUrl = function(n, a) {
        return a + "#" + encodeURIComponent(n);
      }, r.prototype.formatTag = function(n) {
        return "(" + n + ")";
      }, r.prototype.formatId = function(n) {
        return "mjx-eqn:" + n.replace(/\s/g, "_");
      }, r.prototype.formatNumber = function(n) {
        return n.toString();
      }, r.prototype.autoTag = function() {
        this.currentTag.tag == null && (this.counter++, this.tag(this.formatNumber(this.counter), !1));
      }, r.prototype.clearTag = function() {
        this.label = "", this.tag(null, !0), this.currentTag.tagId = "";
      }, r.prototype.getTag = function(n) {
        if (n === void 0 && (n = !1), n)
          return this.autoTag(), this.makeTag();
        var a = this.currentTag;
        return a.taggable && !a.noTag && (a.defaultTags && this.autoTag(), a.tag) ? this.makeTag() : null;
      }, r.prototype.resetTag = function() {
        this.history = [], this.redo = !1, this.refUpdate = !1, this.clearTag();
      }, r.prototype.reset = function(n) {
        n === void 0 && (n = 0), this.resetTag(), this.counter = this.allCounter = n, this.allLabels = {}, this.allIds = {};
      }, r.prototype.startEquation = function(n) {
        this.history = [], this.stack = [], this.clearTag(), this.currentTag = new d("", void 0, void 0), this.labels = {}, this.ids = {}, this.counter = this.allCounter, this.redo = !1;
        var a = n.inputData.recompile;
        a && (this.refUpdate = !0, this.counter = a.counter);
      }, r.prototype.finishEquation = function(n) {
        this.redo && (n.inputData.recompile = {
          state: n.state(),
          counter: this.allCounter
        }), this.refUpdate || (this.allCounter = this.counter), Object.assign(this.allIds, this.ids), Object.assign(this.allLabels, this.labels);
      }, r.prototype.finalize = function(n, a) {
        if (!a.display || this.currentTag.env || this.currentTag.tag == null)
          return n;
        var i = this.makeTag(), v = this.enTag(n, i);
        return v;
      }, r.prototype.makeId = function() {
        this.currentTag.tagId = this.formatId(this.configuration.options.useLabelIds ? this.label || this.currentTag.tag : this.currentTag.tag);
      }, r.prototype.makeTag = function() {
        this.makeId(), this.label && (this.labels[this.label] = new m(this.currentTag.tag, this.currentTag.tagId));
        var n = new E.default("\\text{" + this.currentTag.tagFormat + "}", {}, this.configuration).mml();
        return this.configuration.nodeFactory.create("node", "mtd", [n], { id: this.currentTag.tagId });
      }, r;
    })();
    M.AbstractTags = c;
    var h = (function(r) {
      _(n, r);
      function n() {
        return r !== null && r.apply(this, arguments) || this;
      }
      return n.prototype.autoTag = function() {
      }, n.prototype.getTag = function() {
        return this.currentTag.tag ? r.prototype.getTag.call(this) : null;
      }, n;
    })(c);
    M.NoTags = h;
    var e = (function(r) {
      _(n, r);
      function n() {
        return r !== null && r.apply(this, arguments) || this;
      }
      return n.prototype.finalize = function(a, i) {
        if (!i.display || this.history.find(function(p) {
          return p.taggable;
        }))
          return a;
        var v = this.getTag(!0);
        return this.enTag(a, v);
      }, n;
    })(c);
    M.AllTags = e, (function(r) {
      var n = /* @__PURE__ */ new Map([
        ["none", h],
        ["all", e]
      ]), a = "none";
      r.OPTIONS = {
        tags: a,
        tagSide: "right",
        tagIndent: "0.8em",
        useLabelIds: !0,
        ignoreDuplicateLabels: !1
      }, r.add = function(i, v) {
        n.set(i, v);
      }, r.addTags = function(i) {
        var v, p;
        try {
          for (var y = X(Object.keys(i)), f = y.next(); !f.done; f = y.next()) {
            var A = f.value;
            r.add(A, i[A]);
          }
        } catch (x) {
          v = { error: x };
        } finally {
          try {
            f && !f.done && (p = y.return) && p.call(y);
          } finally {
            if (v) throw v.error;
          }
        }
      }, r.create = function(i) {
        var v = n.get(i) || n.get(a);
        if (!v)
          throw Error("Unknown tags class");
        return new v();
      }, r.setDefault = function(i) {
        a = i;
      }, r.getDefault = function() {
        return r.create(a);
      };
    })(M.TagsFactory || (M.TagsFactory = {}));
  })(dt)), dt;
}
var mt = {}, vt = {}, Vt;
function Pt() {
  return Vt || (Vt = 1, (function(M) {
    var _ = vt && vt.__values || function(h) {
      var e = typeof Symbol == "function" && Symbol.iterator, r = e && h[e], n = 0;
      if (r) return r.call(h);
      if (h && typeof h.length == "number") return {
        next: function() {
          return h && n >= h.length && (h = void 0), { value: h && h[n++], done: !h };
        }
      };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, X = vt && vt.__read || function(h, e) {
      var r = typeof Symbol == "function" && h[Symbol.iterator];
      if (!r) return h;
      var n = r.call(h), a, i = [], v;
      try {
        for (; (e === void 0 || e-- > 0) && !(a = n.next()).done; ) i.push(a.value);
      } catch (p) {
        v = { error: p };
      } finally {
        try {
          a && !a.done && (r = n.return) && r.call(n);
        } finally {
          if (v) throw v.error;
        }
      }
      return i;
    };
    Object.defineProperty(M, "__esModule", { value: !0 }), M.SubHandlers = M.SubHandler = M.MapHandler = void 0;
    var j = Qt(), E = Zt(), m;
    (function(h) {
      var e = /* @__PURE__ */ new Map();
      h.register = function(r) {
        e.set(r.name, r);
      }, h.getMap = function(r) {
        return e.get(r);
      };
    })(m = M.MapHandler || (M.MapHandler = {}));
    var d = (function() {
      function h() {
        this._configuration = new j.PrioritizedList(), this._fallback = new E.FunctionList();
      }
      return h.prototype.add = function(e, r, n) {
        var a, i;
        n === void 0 && (n = j.PrioritizedList.DEFAULTPRIORITY);
        try {
          for (var v = _(e.slice().reverse()), p = v.next(); !p.done; p = v.next()) {
            var y = p.value, f = m.getMap(y);
            if (!f) {
              this.warn("Configuration " + y + " not found! Omitted.");
              return;
            }
            this._configuration.add(f, n);
          }
        } catch (A) {
          a = { error: A };
        } finally {
          try {
            p && !p.done && (i = v.return) && i.call(v);
          } finally {
            if (a) throw a.error;
          }
        }
        r && this._fallback.add(r, n);
      }, h.prototype.parse = function(e) {
        var r, n;
        try {
          for (var a = _(this._configuration), i = a.next(); !i.done; i = a.next()) {
            var v = i.value.item, p = v.parse(e);
            if (p)
              return p;
          }
        } catch (x) {
          r = { error: x };
        } finally {
          try {
            i && !i.done && (n = a.return) && n.call(a);
          } finally {
            if (r) throw r.error;
          }
        }
        var y = X(e, 2), f = y[0], A = y[1];
        Array.from(this._fallback)[0].item(f, A);
      }, h.prototype.lookup = function(e) {
        var r = this.applicable(e);
        return r ? r.lookup(e) : null;
      }, h.prototype.contains = function(e) {
        return !!this.applicable(e);
      }, h.prototype.toString = function() {
        var e, r, n = [];
        try {
          for (var a = _(this._configuration), i = a.next(); !i.done; i = a.next()) {
            var v = i.value.item;
            n.push(v.name);
          }
        } catch (p) {
          e = { error: p };
        } finally {
          try {
            i && !i.done && (r = a.return) && r.call(a);
          } finally {
            if (e) throw e.error;
          }
        }
        return n.join(", ");
      }, h.prototype.applicable = function(e) {
        var r, n;
        try {
          for (var a = _(this._configuration), i = a.next(); !i.done; i = a.next()) {
            var v = i.value.item;
            if (v.contains(e))
              return v;
          }
        } catch (p) {
          r = { error: p };
        } finally {
          try {
            i && !i.done && (n = a.return) && n.call(a);
          } finally {
            if (r) throw r.error;
          }
        }
        return null;
      }, h.prototype.retrieve = function(e) {
        var r, n;
        try {
          for (var a = _(this._configuration), i = a.next(); !i.done; i = a.next()) {
            var v = i.value.item;
            if (v.name === e)
              return v;
          }
        } catch (p) {
          r = { error: p };
        } finally {
          try {
            i && !i.done && (n = a.return) && n.call(a);
          } finally {
            if (r) throw r.error;
          }
        }
        return null;
      }, h.prototype.warn = function(e) {
        console.log("TexParser Warning: " + e);
      }, h;
    })();
    M.SubHandler = d;
    var c = (function() {
      function h() {
        this.map = /* @__PURE__ */ new Map();
      }
      return h.prototype.add = function(e, r, n) {
        var a, i;
        n === void 0 && (n = j.PrioritizedList.DEFAULTPRIORITY);
        try {
          for (var v = _(Object.keys(e)), p = v.next(); !p.done; p = v.next()) {
            var y = p.value, f = y, A = this.get(f);
            A || (A = new d(), this.set(f, A)), A.add(e[f], r[f], n);
          }
        } catch (x) {
          a = { error: x };
        } finally {
          try {
            p && !p.done && (i = v.return) && i.call(v);
          } finally {
            if (a) throw a.error;
          }
        }
      }, h.prototype.set = function(e, r) {
        this.map.set(e, r);
      }, h.prototype.get = function(e) {
        return this.map.get(e);
      }, h.prototype.retrieve = function(e) {
        var r, n;
        try {
          for (var a = _(this.map.values()), i = a.next(); !i.done; i = a.next()) {
            var v = i.value, p = v.retrieve(e);
            if (p)
              return p;
          }
        } catch (y) {
          r = { error: y };
        } finally {
          try {
            i && !i.done && (n = a.return) && n.call(a);
          } finally {
            if (r) throw r.error;
          }
        }
        return null;
      }, h.prototype.keys = function() {
        return this.map.keys();
      }, h;
    })();
    M.SubHandlers = c;
  })(vt)), vt;
}
var Ht;
function he() {
  return Ht || (Ht = 1, (function(M) {
    var _ = mt && mt.__values || function(n) {
      var a = typeof Symbol == "function" && Symbol.iterator, i = a && n[a], v = 0;
      if (i) return i.call(n);
      if (n && typeof n.length == "number") return {
        next: function() {
          return n && v >= n.length && (n = void 0), { value: n && n[v++], done: !n };
        }
      };
      throw new TypeError(a ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, X = mt && mt.__read || function(n, a) {
      var i = typeof Symbol == "function" && n[Symbol.iterator];
      if (!i) return n;
      var v = i.call(n), p, y = [], f;
      try {
        for (; (a === void 0 || a-- > 0) && !(p = v.next()).done; ) y.push(p.value);
      } catch (A) {
        f = { error: A };
      } finally {
        try {
          p && !p.done && (i = v.return) && i.call(v);
        } finally {
          if (f) throw f.error;
        }
      }
      return y;
    };
    Object.defineProperty(M, "__esModule", { value: !0 }), M.ParserConfiguration = M.ConfigurationHandler = M.Configuration = void 0;
    var j = wt(), E = Pt(), m = Zt(), d = Qt(), c = xt(), h = (function() {
      function n(a, i, v, p, y, f, A, x, C, t, u, o, s) {
        i === void 0 && (i = {}), v === void 0 && (v = {}), p === void 0 && (p = {}), y === void 0 && (y = {}), f === void 0 && (f = {}), A === void 0 && (A = {}), x === void 0 && (x = []), C === void 0 && (C = []), t === void 0 && (t = null), u === void 0 && (u = null), this.name = a, this.handler = i, this.fallback = v, this.items = p, this.tags = y, this.options = f, this.nodes = A, this.preprocessors = x, this.postprocessors = C, this.initMethod = t, this.configMethod = u, this.priority = o, this.parser = s, this.handler = Object.assign({ character: [], delimiter: [], macro: [], environment: [] }, i);
      }
      return n.makeProcessor = function(a, i) {
        return Array.isArray(a) ? a : [a, i];
      }, n._create = function(a, i) {
        var v = this;
        i === void 0 && (i = {});
        var p = i.priority || d.PrioritizedList.DEFAULTPRIORITY, y = i.init ? this.makeProcessor(i.init, p) : null, f = i.config ? this.makeProcessor(i.config, p) : null, A = (i.preprocessors || []).map(function(t) {
          return v.makeProcessor(t, p);
        }), x = (i.postprocessors || []).map(function(t) {
          return v.makeProcessor(t, p);
        }), C = i.parser || "tex";
        return new n(a, i.handler || {}, i.fallback || {}, i.items || {}, i.tags || {}, i.options || {}, i.nodes || {}, A, x, y, f, p, C);
      }, n.create = function(a, i) {
        i === void 0 && (i = {});
        var v = n._create(a, i);
        return e.set(a, v), v;
      }, n.local = function(a) {
        return a === void 0 && (a = {}), n._create("", a);
      }, Object.defineProperty(n.prototype, "init", {
        get: function() {
          return this.initMethod ? this.initMethod[0] : null;
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(n.prototype, "config", {
        get: function() {
          return this.configMethod ? this.configMethod[0] : null;
        },
        enumerable: !1,
        configurable: !0
      }), n;
    })();
    M.Configuration = h;
    var e;
    (function(n) {
      var a = /* @__PURE__ */ new Map();
      n.set = function(i, v) {
        a.set(i, v);
      }, n.get = function(i) {
        return a.get(i);
      }, n.keys = function() {
        return a.keys();
      };
    })(e = M.ConfigurationHandler || (M.ConfigurationHandler = {}));
    var r = (function() {
      function n(a, i) {
        var v, p, y, f;
        i === void 0 && (i = ["tex"]), this.initMethod = new m.FunctionList(), this.configMethod = new m.FunctionList(), this.configurations = new d.PrioritizedList(), this.parsers = [], this.handlers = new E.SubHandlers(), this.items = {}, this.tags = {}, this.options = {}, this.nodes = {}, this.parsers = i;
        try {
          for (var A = _(a.slice().reverse()), x = A.next(); !x.done; x = A.next()) {
            var C = x.value;
            this.addPackage(C);
          }
        } catch (O) {
          v = { error: O };
        } finally {
          try {
            x && !x.done && (p = A.return) && p.call(A);
          } finally {
            if (v) throw v.error;
          }
        }
        try {
          for (var t = _(this.configurations), u = t.next(); !u.done; u = t.next()) {
            var o = u.value, s = o.item, l = o.priority;
            this.append(s, l);
          }
        } catch (O) {
          y = { error: O };
        } finally {
          try {
            u && !u.done && (f = t.return) && f.call(t);
          } finally {
            if (y) throw y.error;
          }
        }
      }
      return n.prototype.init = function() {
        this.initMethod.execute(this);
      }, n.prototype.config = function(a) {
        var i, v;
        this.configMethod.execute(this, a);
        try {
          for (var p = _(this.configurations), y = p.next(); !y.done; y = p.next()) {
            var f = y.value;
            this.addFilters(a, f.item);
          }
        } catch (A) {
          i = { error: A };
        } finally {
          try {
            y && !y.done && (v = p.return) && v.call(p);
          } finally {
            if (i) throw i.error;
          }
        }
      }, n.prototype.addPackage = function(a) {
        var i = typeof a == "string" ? a : a[0], v = this.getPackage(i);
        v && this.configurations.add(v, typeof a == "string" ? v.priority : a[1]);
      }, n.prototype.add = function(a, i, v) {
        var p, y;
        v === void 0 && (v = {});
        var f = this.getPackage(a);
        this.append(f), this.configurations.add(f, f.priority), this.init();
        var A = i.parseOptions;
        A.nodeFactory.setCreators(f.nodes);
        try {
          for (var x = _(Object.keys(f.items)), C = x.next(); !C.done; C = x.next()) {
            var t = C.value;
            A.itemFactory.setNodeClass(t, f.items[t]);
          }
        } catch (u) {
          p = { error: u };
        } finally {
          try {
            C && !C.done && (y = x.return) && y.call(x);
          } finally {
            if (p) throw p.error;
          }
        }
        c.TagsFactory.addTags(f.tags), (0, j.defaultOptions)(A.options, f.options), (0, j.userOptions)(A.options, v), this.addFilters(i, f), f.config && f.config(this, i);
      }, n.prototype.getPackage = function(a) {
        var i = e.get(a);
        if (i && this.parsers.indexOf(i.parser) < 0)
          throw Error("Package ".concat(a, " doesn't target the proper parser"));
        return i;
      }, n.prototype.append = function(a, i) {
        i = i || a.priority, a.initMethod && this.initMethod.add(a.initMethod[0], a.initMethod[1]), a.configMethod && this.configMethod.add(a.configMethod[0], a.configMethod[1]), this.handlers.add(a.handler, a.fallback, i), Object.assign(this.items, a.items), Object.assign(this.tags, a.tags), (0, j.defaultOptions)(this.options, a.options), Object.assign(this.nodes, a.nodes);
      }, n.prototype.addFilters = function(a, i) {
        var v, p, y, f;
        try {
          for (var A = _(i.preprocessors), x = A.next(); !x.done; x = A.next()) {
            var C = X(x.value, 2), t = C[0], u = C[1];
            a.preFilters.add(t, u);
          }
        } catch (k) {
          v = { error: k };
        } finally {
          try {
            x && !x.done && (p = A.return) && p.call(A);
          } finally {
            if (v) throw v.error;
          }
        }
        try {
          for (var o = _(i.postprocessors), s = o.next(); !s.done; s = o.next()) {
            var l = X(s.value, 2), O = l[0], u = l[1];
            a.postFilters.add(O, u);
          }
        } catch (k) {
          y = { error: k };
        } finally {
          try {
            s && !s.done && (f = o.return) && f.call(o);
          } finally {
            if (y) throw y.error;
          }
        }
      }, n;
    })();
    M.ParserConfiguration = r;
  })(mt)), mt;
}
var Z = {}, W = {}, yt = {}, Gt;
function de() {
  if (Gt) return yt;
  Gt = 1, Object.defineProperty(yt, "__esModule", { value: !0 }), yt.Macro = yt.Symbol = void 0;
  var M = (function() {
    function X(j, E, m) {
      this._symbol = j, this._char = E, this._attributes = m;
    }
    return Object.defineProperty(X.prototype, "symbol", {
      get: function() {
        return this._symbol;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(X.prototype, "char", {
      get: function() {
        return this._char;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(X.prototype, "attributes", {
      get: function() {
        return this._attributes;
      },
      enumerable: !1,
      configurable: !0
    }), X;
  })();
  yt.Symbol = M;
  var _ = (function() {
    function X(j, E, m) {
      m === void 0 && (m = []), this._symbol = j, this._func = E, this._args = m;
    }
    return Object.defineProperty(X.prototype, "symbol", {
      get: function() {
        return this._symbol;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(X.prototype, "func", {
      get: function() {
        return this._func;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(X.prototype, "args", {
      get: function() {
        return this._args;
      },
      enumerable: !1,
      configurable: !0
    }), X;
  })();
  return yt.Macro = _, yt;
}
var Kt;
function re() {
  if (Kt) return W;
  Kt = 1;
  var M = W && W.__extends || /* @__PURE__ */ (function() {
    var p = function(y, f) {
      return p = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(A, x) {
        A.__proto__ = x;
      } || function(A, x) {
        for (var C in x) Object.prototype.hasOwnProperty.call(x, C) && (A[C] = x[C]);
      }, p(y, f);
    };
    return function(y, f) {
      if (typeof f != "function" && f !== null)
        throw new TypeError("Class extends value " + String(f) + " is not a constructor or null");
      p(y, f);
      function A() {
        this.constructor = y;
      }
      y.prototype = f === null ? Object.create(f) : (A.prototype = f.prototype, new A());
    };
  })(), _ = W && W.__read || function(p, y) {
    var f = typeof Symbol == "function" && p[Symbol.iterator];
    if (!f) return p;
    var A = f.call(p), x, C = [], t;
    try {
      for (; (y === void 0 || y-- > 0) && !(x = A.next()).done; ) C.push(x.value);
    } catch (u) {
      t = { error: u };
    } finally {
      try {
        x && !x.done && (f = A.return) && f.call(A);
      } finally {
        if (t) throw t.error;
      }
    }
    return C;
  }, X = W && W.__values || function(p) {
    var y = typeof Symbol == "function" && Symbol.iterator, f = y && p[y], A = 0;
    if (f) return f.call(p);
    if (p && typeof p.length == "number") return {
      next: function() {
        return p && A >= p.length && (p = void 0), { value: p && p[A++], done: !p };
      }
    };
    throw new TypeError(y ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, j = W && W.__spreadArray || function(p, y, f) {
    if (f || arguments.length === 2) for (var A = 0, x = y.length, C; A < x; A++)
      (C || !(A in y)) && (C || (C = Array.prototype.slice.call(y, 0, A)), C[A] = y[A]);
    return p.concat(C || Array.prototype.slice.call(y));
  };
  Object.defineProperty(W, "__esModule", { value: !0 }), W.EnvironmentMap = W.CommandMap = W.MacroMap = W.DelimiterMap = W.CharacterMap = W.AbstractParseMap = W.RegExpMap = W.AbstractSymbolMap = W.parseResult = void 0;
  var E = de(), m = Pt();
  function d(p) {
    return p === void 0 ? !0 : p;
  }
  W.parseResult = d;
  var c = (function() {
    function p(y, f) {
      this._name = y, this._parser = f, m.MapHandler.register(this);
    }
    return Object.defineProperty(p.prototype, "name", {
      get: function() {
        return this._name;
      },
      enumerable: !1,
      configurable: !0
    }), p.prototype.parserFor = function(y) {
      return this.contains(y) ? this.parser : null;
    }, p.prototype.parse = function(y) {
      var f = _(y, 2), A = f[0], x = f[1], C = this.parserFor(x), t = this.lookup(x);
      return C && t ? d(C(A, t)) : null;
    }, Object.defineProperty(p.prototype, "parser", {
      get: function() {
        return this._parser;
      },
      set: function(y) {
        this._parser = y;
      },
      enumerable: !1,
      configurable: !0
    }), p;
  })();
  W.AbstractSymbolMap = c;
  var h = (function(p) {
    M(y, p);
    function y(f, A, x) {
      var C = p.call(this, f, A) || this;
      return C._regExp = x, C;
    }
    return y.prototype.contains = function(f) {
      return this._regExp.test(f);
    }, y.prototype.lookup = function(f) {
      return this.contains(f) ? f : null;
    }, y;
  })(c);
  W.RegExpMap = h;
  var e = (function(p) {
    M(y, p);
    function y() {
      var f = p !== null && p.apply(this, arguments) || this;
      return f.map = /* @__PURE__ */ new Map(), f;
    }
    return y.prototype.lookup = function(f) {
      return this.map.get(f);
    }, y.prototype.contains = function(f) {
      return this.map.has(f);
    }, y.prototype.add = function(f, A) {
      this.map.set(f, A);
    }, y.prototype.remove = function(f) {
      this.map.delete(f);
    }, y;
  })(c);
  W.AbstractParseMap = e;
  var r = (function(p) {
    M(y, p);
    function y(f, A, x) {
      var C, t, u = p.call(this, f, A) || this;
      try {
        for (var o = X(Object.keys(x)), s = o.next(); !s.done; s = o.next()) {
          var l = s.value, O = x[l], k = _(typeof O == "string" ? [O, null] : O, 2), N = k[0], I = k[1], F = new E.Symbol(l, N, I);
          u.add(l, F);
        }
      } catch (R) {
        C = { error: R };
      } finally {
        try {
          s && !s.done && (t = o.return) && t.call(o);
        } finally {
          if (C) throw C.error;
        }
      }
      return u;
    }
    return y;
  })(e);
  W.CharacterMap = r;
  var n = (function(p) {
    M(y, p);
    function y() {
      return p !== null && p.apply(this, arguments) || this;
    }
    return y.prototype.parse = function(f) {
      var A = _(f, 2), x = A[0], C = A[1];
      return p.prototype.parse.call(this, [x, "\\" + C]);
    }, y;
  })(r);
  W.DelimiterMap = n;
  var a = (function(p) {
    M(y, p);
    function y(f, A, x) {
      var C, t, u = p.call(this, f, null) || this;
      try {
        for (var o = X(Object.keys(A)), s = o.next(); !s.done; s = o.next()) {
          var l = s.value, O = A[l], k = _(typeof O == "string" ? [O] : O), N = k[0], I = k.slice(1), F = new E.Macro(l, x[N], I);
          u.add(l, F);
        }
      } catch (R) {
        C = { error: R };
      } finally {
        try {
          s && !s.done && (t = o.return) && t.call(o);
        } finally {
          if (C) throw C.error;
        }
      }
      return u;
    }
    return y.prototype.parserFor = function(f) {
      var A = this.lookup(f);
      return A ? A.func : null;
    }, y.prototype.parse = function(f) {
      var A = _(f, 2), x = A[0], C = A[1], t = this.lookup(C), u = this.parserFor(C);
      return !t || !u ? null : d(u.apply(void 0, j([x, t.symbol], _(t.args), !1)));
    }, y;
  })(e);
  W.MacroMap = a;
  var i = (function(p) {
    M(y, p);
    function y() {
      return p !== null && p.apply(this, arguments) || this;
    }
    return y.prototype.parse = function(f) {
      var A = _(f, 2), x = A[0], C = A[1], t = this.lookup(C), u = this.parserFor(C);
      if (!t || !u)
        return null;
      var o = x.currentCS;
      x.currentCS = "\\" + C;
      var s = u.apply(void 0, j([x, "\\" + t.symbol], _(t.args), !1));
      return x.currentCS = o, d(s);
    }, y;
  })(a);
  W.CommandMap = i;
  var v = (function(p) {
    M(y, p);
    function y(f, A, x, C) {
      var t = p.call(this, f, x, C) || this;
      return t.parser = A, t;
    }
    return y.prototype.parse = function(f) {
      var A = _(f, 2), x = A[0], C = A[1], t = this.lookup(C), u = this.parserFor(C);
      return !t || !u ? null : d(this.parser(x, t.symbol, u, t.args));
    }, y;
  })(a);
  return W.EnvironmentMap = v, W;
}
var q = {}, Ut;
function ne() {
  if (Ut) return q;
  Ut = 1;
  var M = q && q.__extends || /* @__PURE__ */ (function() {
    var S = function(b, g) {
      return S = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(T, L) {
        T.__proto__ = L;
      } || function(T, L) {
        for (var V in L) Object.prototype.hasOwnProperty.call(L, V) && (T[V] = L[V]);
      }, S(b, g);
    };
    return function(b, g) {
      if (typeof g != "function" && g !== null)
        throw new TypeError("Class extends value " + String(g) + " is not a constructor or null");
      S(b, g);
      function T() {
        this.constructor = b;
      }
      b.prototype = g === null ? Object.create(g) : (T.prototype = g.prototype, new T());
    };
  })(), _ = q && q.__read || function(S, b) {
    var g = typeof Symbol == "function" && S[Symbol.iterator];
    if (!g) return S;
    var T = g.call(S), L, V = [], rt;
    try {
      for (; (b === void 0 || b-- > 0) && !(L = T.next()).done; ) V.push(L.value);
    } catch (lt) {
      rt = { error: lt };
    } finally {
      try {
        L && !L.done && (g = T.return) && g.call(T);
      } finally {
        if (rt) throw rt.error;
      }
    }
    return V;
  }, X = q && q.__spreadArray || function(S, b, g) {
    if (g || arguments.length === 2) for (var T = 0, L = b.length, V; T < L; T++)
      (V || !(T in b)) && (V || (V = Array.prototype.slice.call(b, 0, T)), V[T] = b[T]);
    return S.concat(V || Array.prototype.slice.call(b));
  }, j = q && q.__importDefault || function(S) {
    return S && S.__esModule ? S : { default: S };
  };
  Object.defineProperty(q, "__esModule", { value: !0 }), q.EquationItem = q.EqnArrayItem = q.ArrayItem = q.DotsItem = q.NonscriptItem = q.NotItem = q.FnItem = q.MmlItem = q.CellItem = q.PositionItem = q.StyleItem = q.EndItem = q.BeginItem = q.RightItem = q.Middle = q.LeftItem = q.OverItem = q.SubsupItem = q.PrimeItem = q.CloseItem = q.OpenItem = q.StopItem = q.StartItem = void 0;
  var E = Pt(), m = Mt(), d = At(), c = j(St()), h = j(Ct()), e = j(pt()), r = ee(), n = (function(S) {
    M(b, S);
    function b(g, T) {
      var L = S.call(this, g) || this;
      return L.global = T, L;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "start";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("stop")) {
        var T = this.toMml();
        return this.global.isInner || (T = this.factory.configuration.tags.finalize(T, this.env)), [[this.factory.create("mml", T)], !0];
      }
      return S.prototype.checkItem.call(this, g);
    }, b;
  })(r.BaseItem);
  q.StartItem = n;
  var a = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "stop";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.StopItem = a;
  var i = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "open";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("close")) {
        var T = this.toMml(), L = this.create("node", "TeXAtom", [T]);
        return [[this.factory.create("mml", L)], !0];
      }
      return S.prototype.checkItem.call(this, g);
    }, b.errors = Object.assign(Object.create(r.BaseItem.errors), {
      stop: [
        "ExtraOpenMissingClose",
        "Extra open brace or missing close brace"
      ]
    }), b;
  })(r.BaseItem);
  q.OpenItem = i;
  var v = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "close";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.CloseItem = v;
  var p = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "prime";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      var T = _(this.Peek(2), 2), L = T[0], V = T[1];
      if (!e.default.isType(L, "msubsup") || e.default.isType(L, "msup")) {
        var rt = this.create("node", "msup", [L, V]);
        return [[rt, g], !0];
      }
      return e.default.setChild(L, L.sup, V), [[L, g], !0];
    }, b;
  })(r.BaseItem);
  q.PrimeItem = p;
  var y = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "subsup";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("open") || g.isKind("left"))
        return r.BaseItem.success;
      var T = this.First, L = this.getProperty("position");
      if (g.isKind("mml")) {
        if (this.getProperty("primes"))
          if (L !== 2)
            e.default.setChild(T, 2, this.getProperty("primes"));
          else {
            e.default.setProperty(this.getProperty("primes"), "variantForm", !0);
            var V = this.create("node", "mrow", [this.getProperty("primes"), g.First]);
            g.First = V;
          }
        e.default.setChild(T, L, g.First), this.getProperty("movesupsub") != null && e.default.setProperty(T, "movesupsub", this.getProperty("movesupsub"));
        var rt = this.factory.create("mml", T);
        return [[rt], !0];
      }
      if (S.prototype.checkItem.call(this, g)[1]) {
        var lt = this.getErrors(["", "sub", "sup"][L]);
        throw new (c.default.bind.apply(c.default, X([void 0, lt[0], lt[1]], _(lt.splice(2)), !1)))();
      }
      return null;
    }, b.errors = Object.assign(Object.create(r.BaseItem.errors), {
      stop: [
        "MissingScript",
        "Missing superscript or subscript argument"
      ],
      sup: [
        "MissingOpenForSup",
        "Missing open brace for superscript"
      ],
      sub: [
        "MissingOpenForSub",
        "Missing open brace for subscript"
      ]
    }), b;
  })(r.BaseItem);
  q.SubsupItem = y;
  var f = (function(S) {
    M(b, S);
    function b(g) {
      var T = S.call(this, g) || this;
      return T.setProperty("name", "\\over"), T;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "over";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("over"))
        throw new c.default("AmbiguousUseOf", "Ambiguous use of %1", g.getName());
      if (g.isClose) {
        var T = this.create("node", "mfrac", [this.getProperty("num"), this.toMml(!1)]);
        return this.getProperty("thickness") != null && e.default.setAttribute(T, "linethickness", this.getProperty("thickness")), (this.getProperty("open") || this.getProperty("close")) && (e.default.setProperty(T, "withDelims", !0), T = h.default.fixedFence(this.factory.configuration, this.getProperty("open"), T, this.getProperty("close"))), [[this.factory.create("mml", T), g], !0];
      }
      return S.prototype.checkItem.call(this, g);
    }, b.prototype.toString = function() {
      return "over[" + this.getProperty("num") + " / " + this.nodes.join("; ") + "]";
    }, b;
  })(r.BaseItem);
  q.OverItem = f;
  var A = (function(S) {
    M(b, S);
    function b(g, T) {
      var L = S.call(this, g) || this;
      return L.setProperty("delim", T), L;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "left";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("right"))
        return [[this.factory.create("mml", h.default.fenced(this.factory.configuration, this.getProperty("delim"), this.toMml(), g.getProperty("delim"), "", g.getProperty("color")))], !0];
      if (g.isKind("middle")) {
        var T = { stretchy: !0 };
        return g.getProperty("color") && (T.mathcolor = g.getProperty("color")), this.Push(this.create("node", "TeXAtom", [], { texClass: d.TEXCLASS.CLOSE }), this.create("token", "mo", T, g.getProperty("delim")), this.create("node", "TeXAtom", [], { texClass: d.TEXCLASS.OPEN })), this.env = {}, [[this], !0];
      }
      return S.prototype.checkItem.call(this, g);
    }, b.errors = Object.assign(Object.create(r.BaseItem.errors), {
      stop: [
        "ExtraLeftMissingRight",
        "Extra \\left or missing \\right"
      ]
    }), b;
  })(r.BaseItem);
  q.LeftItem = A;
  var x = (function(S) {
    M(b, S);
    function b(g, T, L) {
      var V = S.call(this, g) || this;
      return V.setProperty("delim", T), L && V.setProperty("color", L), V;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "middle";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.Middle = x;
  var C = (function(S) {
    M(b, S);
    function b(g, T, L) {
      var V = S.call(this, g) || this;
      return V.setProperty("delim", T), L && V.setProperty("color", L), V;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "right";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.RightItem = C;
  var t = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "begin";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("end")) {
        if (g.getName() !== this.getName())
          throw new c.default("EnvBadEnd", "\\begin{%1} ended with \\end{%2}", this.getName(), g.getName());
        return this.getProperty("end") ? r.BaseItem.fail : [[this.factory.create("mml", this.toMml())], !0];
      }
      if (g.isKind("stop"))
        throw new c.default("EnvMissingEnd", "Missing \\end{%1}", this.getName());
      return S.prototype.checkItem.call(this, g);
    }, b;
  })(r.BaseItem);
  q.BeginItem = t;
  var u = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "end";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.EndItem = u;
  var o = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "style";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (!g.isClose)
        return S.prototype.checkItem.call(this, g);
      var T = this.create("node", "mstyle", this.nodes, this.getProperty("styles"));
      return [[this.factory.create("mml", T), g], !0];
    }, b;
  })(r.BaseItem);
  q.StyleItem = o;
  var s = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "position";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isClose)
        throw new c.default("MissingBoxFor", "Missing box for %1", this.getName());
      if (g.isFinal) {
        var T = g.toMml();
        switch (this.getProperty("move")) {
          case "vertical":
            return T = this.create("node", "mpadded", [T], {
              height: this.getProperty("dh"),
              depth: this.getProperty("dd"),
              voffset: this.getProperty("dh")
            }), [[this.factory.create("mml", T)], !0];
          case "horizontal":
            return [[
              this.factory.create("mml", this.getProperty("left")),
              g,
              this.factory.create("mml", this.getProperty("right"))
            ], !0];
        }
      }
      return S.prototype.checkItem.call(this, g);
    }, b;
  })(r.BaseItem);
  q.PositionItem = s;
  var l = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "cell";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isClose", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.CellItem = l;
  var O = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "isFinal", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "mml";
      },
      enumerable: !1,
      configurable: !0
    }), b;
  })(r.BaseItem);
  q.MmlItem = O;
  var k = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "fn";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      var T = this.First;
      if (T) {
        if (g.isOpen)
          return r.BaseItem.success;
        if (!g.isKind("fn")) {
          var L = g.First;
          if (!g.isKind("mml") || !L)
            return [[T, g], !0];
          if (e.default.isType(L, "mstyle") && L.childNodes.length && e.default.isType(L.childNodes[0].childNodes[0], "mspace") || e.default.isType(L, "mspace"))
            return [[T, g], !0];
          e.default.isEmbellished(L) && (L = e.default.getCoreMO(L));
          var V = e.default.getForm(L);
          if (V != null && [0, 0, 1, 1, 0, 1, 1, 0, 0, 0][V[2]])
            return [[T, g], !0];
        }
        var rt = this.create("token", "mo", { texClass: d.TEXCLASS.NONE }, m.entities.ApplyFunction);
        return [[T, rt, g], !0];
      }
      return S.prototype.checkItem.apply(this, arguments);
    }, b;
  })(r.BaseItem);
  q.FnItem = k;
  var N = (function(S) {
    M(b, S);
    function b() {
      var g = S !== null && S.apply(this, arguments) || this;
      return g.remap = E.MapHandler.getMap("not_remap"), g;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "not";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      var T, L, V;
      if (g.isKind("open") || g.isKind("left"))
        return r.BaseItem.success;
      if (g.isKind("mml") && (e.default.isType(g.First, "mo") || e.default.isType(g.First, "mi") || e.default.isType(g.First, "mtext")) && (T = g.First, L = e.default.getText(T), L.length === 1 && !e.default.getProperty(T, "movesupsub") && e.default.getChildren(T).length === 1))
        return this.remap.contains(L) ? (V = this.create("text", this.remap.lookup(L).char), e.default.setChild(T, 0, V)) : (V = this.create("text", "̸"), e.default.appendChildren(T, [V])), [[g], !0];
      V = this.create("text", "⧸");
      var rt = this.create("node", "mtext", [], {}, V), lt = this.create("node", "mpadded", [rt], { width: 0 });
      return T = this.create("node", "TeXAtom", [lt], { texClass: d.TEXCLASS.REL }), [[T, g], !0];
    }, b;
  })(r.BaseItem);
  q.NotItem = N;
  var I = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "nonscript";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("mml") && g.Size() === 1) {
        var T = g.First;
        if (T.isKind("mstyle") && T.notParent && (T = e.default.getChildren(e.default.getChildren(T)[0])[0]), T.isKind("mspace")) {
          if (T !== g.First) {
            var L = this.create("node", "mrow", [g.Pop()]);
            g.Push(L);
          }
          this.factory.configuration.addNode("nonscript", g.First);
        }
      }
      return [[g], !0];
    }, b;
  })(r.BaseItem);
  q.NonscriptItem = I;
  var F = (function(S) {
    M(b, S);
    function b() {
      return S !== null && S.apply(this, arguments) || this;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "dots";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("open") || g.isKind("left"))
        return r.BaseItem.success;
      var T = this.getProperty("ldots"), L = g.First;
      if (g.isKind("mml") && e.default.isEmbellished(L)) {
        var V = e.default.getTexClass(e.default.getCoreMO(L));
        (V === d.TEXCLASS.BIN || V === d.TEXCLASS.REL) && (T = this.getProperty("cdots"));
      }
      return [[T, g], !0];
    }, b;
  })(r.BaseItem);
  q.DotsItem = F;
  var R = (function(S) {
    M(b, S);
    function b() {
      var g = S !== null && S.apply(this, arguments) || this;
      return g.table = [], g.row = [], g.frame = [], g.hfill = [], g.arraydef = {}, g.dashed = !1, g;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "array";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "copyEnv", {
      get: function() {
        return !1;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isClose && !g.isKind("over")) {
        if (g.getProperty("isEntry"))
          return this.EndEntry(), this.clearEnv(), r.BaseItem.fail;
        if (g.getProperty("isCR"))
          return this.EndEntry(), this.EndRow(), this.clearEnv(), r.BaseItem.fail;
        this.EndTable(), this.clearEnv();
        var T = this.factory.create("mml", this.createMml());
        if (this.getProperty("requireClose")) {
          if (g.isKind("close"))
            return [[T], !0];
          throw new c.default("MissingCloseBrace", "Missing close brace");
        }
        return [[T, g], !0];
      }
      return S.prototype.checkItem.call(this, g);
    }, b.prototype.createMml = function() {
      var g = this.arraydef.scriptlevel;
      delete this.arraydef.scriptlevel;
      var T = this.create("node", "mtable", this.table, this.arraydef);
      return g && T.setProperty("scriptlevel", g), this.frame.length === 4 ? e.default.setAttribute(T, "frame", this.dashed ? "dashed" : "solid") : this.frame.length && (this.arraydef.rowlines && (this.arraydef.rowlines = this.arraydef.rowlines.replace(/none( none)+$/, "none")), e.default.setAttribute(T, "frame", ""), T = this.create("node", "menclose", [T], { notation: this.frame.join(" ") }), ((this.arraydef.columnlines || "none") !== "none" || (this.arraydef.rowlines || "none") !== "none") && e.default.setAttribute(T, "data-padding", 0)), (this.getProperty("open") || this.getProperty("close")) && (T = h.default.fenced(this.factory.configuration, this.getProperty("open"), T, this.getProperty("close"))), T;
    }, b.prototype.EndEntry = function() {
      var g = this.create("node", "mtd", this.nodes);
      this.hfill.length && (this.hfill[0] === 0 && e.default.setAttribute(g, "columnalign", "right"), this.hfill[this.hfill.length - 1] === this.Size() && e.default.setAttribute(g, "columnalign", e.default.getAttribute(g, "columnalign") ? "center" : "left")), this.row.push(g), this.Clear(), this.hfill = [];
    }, b.prototype.EndRow = function() {
      var g;
      this.getProperty("isNumbered") && this.row.length === 3 ? (this.row.unshift(this.row.pop()), g = this.create("node", "mlabeledtr", this.row)) : g = this.create("node", "mtr", this.row), this.table.push(g), this.row = [];
    }, b.prototype.EndTable = function() {
      (this.Size() || this.row.length) && (this.EndEntry(), this.EndRow()), this.checkLines();
    }, b.prototype.checkLines = function() {
      if (this.arraydef.rowlines) {
        var g = this.arraydef.rowlines.split(/ /);
        g.length === this.table.length ? (this.frame.push("bottom"), g.pop(), this.arraydef.rowlines = g.join(" ")) : g.length < this.table.length - 1 && (this.arraydef.rowlines += " none");
      }
      if (this.getProperty("rowspacing")) {
        for (var T = this.arraydef.rowspacing.split(/ /); T.length < this.table.length; )
          T.push(this.getProperty("rowspacing") + "em");
        this.arraydef.rowspacing = T.join(" ");
      }
    }, b.prototype.addRowSpacing = function(g) {
      if (this.arraydef.rowspacing) {
        var T = this.arraydef.rowspacing.split(/ /);
        if (!this.getProperty("rowspacing")) {
          var L = h.default.dimen2em(T[0]);
          this.setProperty("rowspacing", L);
        }
        for (var V = this.getProperty("rowspacing"); T.length < this.table.length; )
          T.push(h.default.Em(V));
        T[this.table.length - 1] = h.default.Em(Math.max(0, V + h.default.dimen2em(g))), this.arraydef.rowspacing = T.join(" ");
      }
    }, b;
  })(r.BaseItem);
  q.ArrayItem = R;
  var $ = (function(S) {
    M(b, S);
    function b(g) {
      for (var T = [], L = 1; L < arguments.length; L++)
        T[L - 1] = arguments[L];
      var V = S.call(this, g) || this;
      return V.maxrow = 0, V.factory.configuration.tags.start(T[0], T[2], T[1]), V;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "eqnarray";
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.EndEntry = function() {
      this.row.length && h.default.fixInitialMO(this.factory.configuration, this.nodes);
      var g = this.create("node", "mtd", this.nodes);
      this.row.push(g), this.Clear();
    }, b.prototype.EndRow = function() {
      this.row.length > this.maxrow && (this.maxrow = this.row.length);
      var g = "mtr", T = this.factory.configuration.tags.getTag();
      T && (this.row = [T].concat(this.row), g = "mlabeledtr"), this.factory.configuration.tags.clearTag();
      var L = this.create("node", g, this.row);
      this.table.push(L), this.row = [];
    }, b.prototype.EndTable = function() {
      S.prototype.EndTable.call(this), this.factory.configuration.tags.end(), this.extendArray("columnalign", this.maxrow), this.extendArray("columnwidth", this.maxrow), this.extendArray("columnspacing", this.maxrow - 1);
    }, b.prototype.extendArray = function(g, T) {
      if (this.arraydef[g]) {
        var L = this.arraydef[g].split(/ /), V = X([], _(L), !1);
        if (V.length > 1) {
          for (; V.length < T; )
            V.push.apply(V, X([], _(L), !1));
          this.arraydef[g] = V.slice(0, T).join(" ");
        }
      }
    }, b;
  })(R);
  q.EqnArrayItem = $;
  var J = (function(S) {
    M(b, S);
    function b(g) {
      for (var T = [], L = 1; L < arguments.length; L++)
        T[L - 1] = arguments[L];
      var V = S.call(this, g) || this;
      return V.factory.configuration.tags.start("equation", !0, T[0]), V;
    }
    return Object.defineProperty(b.prototype, "kind", {
      get: function() {
        return "equation";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(b.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), b.prototype.checkItem = function(g) {
      if (g.isKind("end")) {
        var T = this.toMml(), L = this.factory.configuration.tags.getTag();
        return this.factory.configuration.tags.end(), [[L ? this.factory.configuration.tags.enTag(T, L) : T, g], !0];
      }
      if (g.isKind("stop"))
        throw new c.default("EnvMissingEnd", "Missing \\end{%1}", this.getName());
      return S.prototype.checkItem.call(this, g);
    }, b;
  })(r.BaseItem);
  return q.EquationItem = J, q;
}
var st = {}, Ot = {}, zt;
function It() {
  return zt || (zt = 1, (function(M) {
    Object.defineProperty(M, "__esModule", { value: !0 }), M.TexConstant = void 0, (function(_) {
      _.Variant = {
        NORMAL: "normal",
        BOLD: "bold",
        ITALIC: "italic",
        BOLDITALIC: "bold-italic",
        DOUBLESTRUCK: "double-struck",
        FRAKTUR: "fraktur",
        BOLDFRAKTUR: "bold-fraktur",
        SCRIPT: "script",
        BOLDSCRIPT: "bold-script",
        SANSSERIF: "sans-serif",
        BOLDSANSSERIF: "bold-sans-serif",
        SANSSERIFITALIC: "sans-serif-italic",
        SANSSERIFBOLDITALIC: "sans-serif-bold-italic",
        MONOSPACE: "monospace",
        INITIAL: "inital",
        TAILED: "tailed",
        LOOPED: "looped",
        STRETCHED: "stretched",
        CALLIGRAPHIC: "-tex-calligraphic",
        BOLDCALLIGRAPHIC: "-tex-bold-calligraphic",
        OLDSTYLE: "-tex-oldstyle",
        BOLDOLDSTYLE: "-tex-bold-oldstyle",
        MATHITALIC: "-tex-mathit"
      }, _.Form = {
        PREFIX: "prefix",
        INFIX: "infix",
        POSTFIX: "postfix"
      }, _.LineBreak = {
        AUTO: "auto",
        NEWLINE: "newline",
        NOBREAK: "nobreak",
        GOODBREAK: "goodbreak",
        BADBREAK: "badbreak"
      }, _.LineBreakStyle = {
        BEFORE: "before",
        AFTER: "after",
        DUPLICATE: "duplicate",
        INFIXLINBREAKSTYLE: "infixlinebreakstyle"
      }, _.IndentAlign = {
        LEFT: "left",
        CENTER: "center",
        RIGHT: "right",
        AUTO: "auto",
        ID: "id",
        INDENTALIGN: "indentalign"
      }, _.IndentShift = {
        INDENTSHIFT: "indentshift"
      }, _.LineThickness = {
        THIN: "thin",
        MEDIUM: "medium",
        THICK: "thick"
      }, _.Notation = {
        LONGDIV: "longdiv",
        ACTUARIAL: "actuarial",
        PHASORANGLE: "phasorangle",
        RADICAL: "radical",
        BOX: "box",
        ROUNDEDBOX: "roundedbox",
        CIRCLE: "circle",
        LEFT: "left",
        RIGHT: "right",
        TOP: "top",
        BOTTOM: "bottom",
        UPDIAGONALSTRIKE: "updiagonalstrike",
        DOWNDIAGONALSTRIKE: "downdiagonalstrike",
        VERTICALSTRIKE: "verticalstrike",
        HORIZONTALSTRIKE: "horizontalstrike",
        NORTHEASTARROW: "northeastarrow",
        MADRUWB: "madruwb",
        UPDIAGONALARROW: "updiagonalarrow"
      }, _.Align = {
        TOP: "top",
        BOTTOM: "bottom",
        CENTER: "center",
        BASELINE: "baseline",
        AXIS: "axis",
        LEFT: "left",
        RIGHT: "right"
      }, _.Lines = {
        NONE: "none",
        SOLID: "solid",
        DASHED: "dashed"
      }, _.Side = {
        LEFT: "left",
        RIGHT: "right",
        LEFTOVERLAP: "leftoverlap",
        RIGHTOVERLAP: "rightoverlap"
      }, _.Width = {
        AUTO: "auto",
        FIT: "fit"
      }, _.Actiontype = {
        TOGGLE: "toggle",
        STATUSLINE: "statusline",
        TOOLTIP: "tooltip",
        INPUT: "input"
      }, _.Overflow = {
        LINBREAK: "linebreak",
        SCROLL: "scroll",
        ELIDE: "elide",
        TRUNCATE: "truncate",
        SCALE: "scale"
      }, _.Unit = {
        EM: "em",
        EX: "ex",
        PX: "px",
        IN: "in",
        CM: "cm",
        MM: "mm",
        PT: "pt",
        PC: "pc"
      };
    })(M.TexConstant || (M.TexConstant = {}));
  })(Ot)), Ot;
}
var et = {}, $t;
function pe() {
  if ($t) return et;
  $t = 1;
  var M = et && et.__assign || function() {
    return M = Object.assign || function(t) {
      for (var u, o = 1, s = arguments.length; o < s; o++) {
        u = arguments[o];
        for (var l in u) Object.prototype.hasOwnProperty.call(u, l) && (t[l] = u[l]);
      }
      return t;
    }, M.apply(this, arguments);
  }, _ = et && et.__createBinding || (Object.create ? (function(t, u, o, s) {
    s === void 0 && (s = o);
    var l = Object.getOwnPropertyDescriptor(u, o);
    (!l || ("get" in l ? !u.__esModule : l.writable || l.configurable)) && (l = { enumerable: !0, get: function() {
      return u[o];
    } }), Object.defineProperty(t, s, l);
  }) : (function(t, u, o, s) {
    s === void 0 && (s = o), t[s] = u[o];
  })), X = et && et.__setModuleDefault || (Object.create ? (function(t, u) {
    Object.defineProperty(t, "default", { enumerable: !0, value: u });
  }) : function(t, u) {
    t.default = u;
  }), j = et && et.__importStar || function(t) {
    if (t && t.__esModule) return t;
    var u = {};
    if (t != null) for (var o in t) o !== "default" && Object.prototype.hasOwnProperty.call(t, o) && _(u, t, o);
    return X(u, t), u;
  }, E = et && et.__read || function(t, u) {
    var o = typeof Symbol == "function" && t[Symbol.iterator];
    if (!o) return t;
    var s = o.call(t), l, O = [], k;
    try {
      for (; (u === void 0 || u-- > 0) && !(l = s.next()).done; ) O.push(l.value);
    } catch (N) {
      k = { error: N };
    } finally {
      try {
        l && !l.done && (o = s.return) && o.call(s);
      } finally {
        if (k) throw k.error;
      }
    }
    return O;
  }, m = et && et.__importDefault || function(t) {
    return t && t.__esModule ? t : { default: t };
  };
  Object.defineProperty(et, "__esModule", { value: !0 });
  var d = j(ne()), c = m(pt()), h = m(St()), e = m(Et()), r = It(), n = m(Ct()), a = At(), i = xt(), v = te(), p = Mt(), y = wt(), f = {}, A = 1.2 / 0.85, x = {
    fontfamily: 1,
    fontsize: 1,
    fontweight: 1,
    fontstyle: 1,
    color: 1,
    background: 1,
    id: 1,
    class: 1,
    href: 1,
    style: 1
  };
  f.Open = function(t, u) {
    t.Push(t.itemFactory.create("open"));
  }, f.Close = function(t, u) {
    t.Push(t.itemFactory.create("close"));
  }, f.Tilde = function(t, u) {
    t.Push(t.create("token", "mtext", {}, p.entities.nbsp));
  }, f.Space = function(t, u) {
  }, f.Superscript = function(t, u) {
    var o;
    t.GetNext().match(/\d/) && (t.string = t.string.substr(0, t.i + 1) + " " + t.string.substr(t.i + 1));
    var s, l, O = t.stack.Top();
    O.isKind("prime") ? (o = E(O.Peek(2), 2), l = o[0], s = o[1], t.stack.Pop()) : (l = t.stack.Prev(), l || (l = t.create("token", "mi", {}, "")));
    var k = c.default.getProperty(l, "movesupsub"), N = c.default.isType(l, "msubsup") ? l.sup : l.over;
    if (c.default.isType(l, "msubsup") && !c.default.isType(l, "msup") && c.default.getChildAt(l, l.sup) || c.default.isType(l, "munderover") && !c.default.isType(l, "mover") && c.default.getChildAt(l, l.over) && !c.default.getProperty(l, "subsupOK"))
      throw new h.default("DoubleExponent", "Double exponent: use braces to clarify");
    (!c.default.isType(l, "msubsup") || c.default.isType(l, "msup")) && (k ? ((!c.default.isType(l, "munderover") || c.default.isType(l, "mover") || c.default.getChildAt(l, l.over)) && (l = t.create("node", "munderover", [l], { movesupsub: !0 })), N = l.over) : (l = t.create("node", "msubsup", [l]), N = l.sup)), t.Push(t.itemFactory.create("subsup", l).setProperties({
      position: N,
      primes: s,
      movesupsub: k
    }));
  }, f.Subscript = function(t, u) {
    var o;
    t.GetNext().match(/\d/) && (t.string = t.string.substr(0, t.i + 1) + " " + t.string.substr(t.i + 1));
    var s, l, O = t.stack.Top();
    O.isKind("prime") ? (o = E(O.Peek(2), 2), l = o[0], s = o[1], t.stack.Pop()) : (l = t.stack.Prev(), l || (l = t.create("token", "mi", {}, "")));
    var k = c.default.getProperty(l, "movesupsub"), N = c.default.isType(l, "msubsup") ? l.sub : l.under;
    if (c.default.isType(l, "msubsup") && !c.default.isType(l, "msup") && c.default.getChildAt(l, l.sub) || c.default.isType(l, "munderover") && !c.default.isType(l, "mover") && c.default.getChildAt(l, l.under) && !c.default.getProperty(l, "subsupOK"))
      throw new h.default("DoubleSubscripts", "Double subscripts: use braces to clarify");
    (!c.default.isType(l, "msubsup") || c.default.isType(l, "msup")) && (k ? ((!c.default.isType(l, "munderover") || c.default.isType(l, "mover") || c.default.getChildAt(l, l.under)) && (l = t.create("node", "munderover", [l], { movesupsub: !0 })), N = l.under) : (l = t.create("node", "msubsup", [l]), N = l.sub)), t.Push(t.itemFactory.create("subsup", l).setProperties({
      position: N,
      primes: s,
      movesupsub: k
    }));
  }, f.Prime = function(t, u) {
    var o = t.stack.Prev();
    if (o || (o = t.create("node", "mi")), c.default.isType(o, "msubsup") && !c.default.isType(o, "msup") && c.default.getChildAt(o, o.sup))
      throw new h.default("DoubleExponentPrime", "Prime causes double exponent: use braces to clarify");
    var s = "";
    t.i--;
    do
      s += p.entities.prime, t.i++, u = t.GetNext();
    while (u === "'" || u === p.entities.rsquo);
    s = ["", "′", "″", "‴", "⁗"][s.length] || s;
    var l = t.create("token", "mo", { variantForm: !0 }, s);
    t.Push(t.itemFactory.create("prime", o, l));
  }, f.Comment = function(t, u) {
    for (; t.i < t.string.length && t.string.charAt(t.i) !== `
`; )
      t.i++;
  }, f.Hash = function(t, u) {
    throw new h.default("CantUseHash1", "You can't use 'macro parameter character #' in math mode");
  }, f.MathFont = function(t, u, o) {
    var s = t.GetArgument(u), l = new e.default(s, M(M({}, t.stack.env), { font: o, multiLetterIdentifiers: /^[a-zA-Z]+/, noAutoOP: !0 }), t.configuration).mml();
    t.Push(t.create("node", "TeXAtom", [l]));
  }, f.SetFont = function(t, u, o) {
    t.stack.env.font = o;
  }, f.SetStyle = function(t, u, o, s, l) {
    t.stack.env.style = o, t.stack.env.level = l, t.Push(t.itemFactory.create("style").setProperty("styles", { displaystyle: s, scriptlevel: l }));
  }, f.SetSize = function(t, u, o) {
    t.stack.env.size = o, t.Push(t.itemFactory.create("style").setProperty("styles", { mathsize: (0, v.em)(o) }));
  }, f.Spacer = function(t, u, o) {
    var s = t.create("node", "mspace", [], { width: (0, v.em)(o) }), l = t.create("node", "mstyle", [s], { scriptlevel: 0 });
    t.Push(l);
  }, f.LeftRight = function(t, u) {
    var o = u.substr(1);
    t.Push(t.itemFactory.create(o, t.GetDelimiter(u), t.stack.env.color));
  }, f.NamedFn = function(t, u, o) {
    o || (o = u.substr(1));
    var s = t.create("token", "mi", { texClass: a.TEXCLASS.OP }, o);
    t.Push(t.itemFactory.create("fn", s));
  }, f.NamedOp = function(t, u, o) {
    o || (o = u.substr(1)), o = o.replace(/&thinsp;/, " ");
    var s = t.create("token", "mo", {
      movablelimits: !0,
      movesupsub: !0,
      form: r.TexConstant.Form.PREFIX,
      texClass: a.TEXCLASS.OP
    }, o);
    t.Push(s);
  }, f.Limits = function(t, u, o) {
    var s = t.stack.Prev(!0);
    if (!s || c.default.getTexClass(c.default.getCoreMO(s)) !== a.TEXCLASS.OP && c.default.getProperty(s, "movesupsub") == null)
      throw new h.default("MisplacedLimits", "%1 is allowed only on operators", t.currentCS);
    var l = t.stack.Top(), O;
    c.default.isType(s, "munderover") && !o ? (O = t.create("node", "msubsup"), c.default.copyChildren(s, O), s = l.Last = O) : c.default.isType(s, "msubsup") && o && (O = t.create("node", "munderover"), c.default.copyChildren(s, O), s = l.Last = O), c.default.setProperty(s, "movesupsub", !!o), c.default.setProperties(c.default.getCoreMO(s), { movablelimits: !1 }), (c.default.getAttribute(s, "movablelimits") || c.default.getProperty(s, "movablelimits")) && c.default.setProperties(s, { movablelimits: !1 });
  }, f.Over = function(t, u, o, s) {
    var l = t.itemFactory.create("over").setProperty("name", t.currentCS);
    o || s ? (l.setProperty("open", o), l.setProperty("close", s)) : u.match(/withdelims$/) && (l.setProperty("open", t.GetDelimiter(u)), l.setProperty("close", t.GetDelimiter(u))), u.match(/^\\above/) ? l.setProperty("thickness", t.GetDimen(u)) : (u.match(/^\\atop/) || o || s) && l.setProperty("thickness", 0), t.Push(l);
  }, f.Frac = function(t, u) {
    var o = t.ParseArg(u), s = t.ParseArg(u), l = t.create("node", "mfrac", [o, s]);
    t.Push(l);
  }, f.Sqrt = function(t, u) {
    var o = t.GetBrackets(u), s = t.GetArgument(u);
    s === "\\frac" && (s += "{" + t.GetArgument(s) + "}{" + t.GetArgument(s) + "}");
    var l = new e.default(s, t.stack.env, t.configuration).mml();
    o ? l = t.create("node", "mroot", [l, C(t, o)]) : l = t.create("node", "msqrt", [l]), t.Push(l);
  };
  function C(t, u) {
    var o = t.stack.env, s = o.inRoot;
    o.inRoot = !0;
    var l = new e.default(u, o, t.configuration), O = l.mml(), k = l.stack.global;
    if (k.leftRoot || k.upRoot) {
      var N = {};
      k.leftRoot && (N.width = k.leftRoot), k.upRoot && (N.voffset = k.upRoot, N.height = k.upRoot), O = t.create("node", "mpadded", [O], N);
    }
    return o.inRoot = s, O;
  }
  return f.Root = function(t, u) {
    var o = t.GetUpTo(u, "\\of"), s = t.ParseArg(u), l = t.create("node", "mroot", [s, C(t, o)]);
    t.Push(l);
  }, f.MoveRoot = function(t, u, o) {
    if (!t.stack.env.inRoot)
      throw new h.default("MisplacedMoveRoot", "%1 can appear only within a root", t.currentCS);
    if (t.stack.global[o])
      throw new h.default("MultipleMoveRoot", "Multiple use of %1", t.currentCS);
    var s = t.GetArgument(u);
    if (!s.match(/-?[0-9]+/))
      throw new h.default("IntegerArg", "The argument to %1 must be an integer", t.currentCS);
    s = parseInt(s, 10) / 15 + "em", s.substr(0, 1) !== "-" && (s = "+" + s), t.stack.global[o] = s;
  }, f.Accent = function(t, u, o, s) {
    var l = t.ParseArg(u), O = M(M({}, n.default.getFontDef(t)), { accent: !0, mathaccent: !0 }), k = c.default.createEntity(o), N = t.create("token", "mo", O, k), I = N;
    c.default.setAttribute(I, "stretchy", !!s);
    var F = c.default.isEmbellished(l) ? c.default.getCoreMO(l) : l;
    (c.default.isType(F, "mo") || c.default.getProperty(F, "movablelimits")) && c.default.setProperties(F, { movablelimits: !1 });
    var R = t.create("node", "munderover");
    c.default.setChild(R, 0, l), c.default.setChild(R, 1, null), c.default.setChild(R, 2, I);
    var $ = t.create("node", "TeXAtom", [R]);
    t.Push($);
  }, f.UnderOver = function(t, u, o, s) {
    var l = c.default.createEntity(o), O = t.create("token", "mo", { stretchy: !0, accent: !0 }, l), k = u.charAt(1) === "o" ? "over" : "under", N = t.ParseArg(u);
    t.Push(n.default.underOver(t, N, O, k, s));
  }, f.Overset = function(t, u) {
    var o = t.ParseArg(u), s = t.ParseArg(u);
    n.default.checkMovableLimits(s), o.isKind("mo") && c.default.setAttribute(o, "accent", !1);
    var l = t.create("node", "mover", [s, o]);
    t.Push(l);
  }, f.Underset = function(t, u) {
    var o = t.ParseArg(u), s = t.ParseArg(u);
    n.default.checkMovableLimits(s), o.isKind("mo") && c.default.setAttribute(o, "accent", !1);
    var l = t.create("node", "munder", [s, o], { accentunder: !1 });
    t.Push(l);
  }, f.Overunderset = function(t, u) {
    var o = t.ParseArg(u), s = t.ParseArg(u), l = t.ParseArg(u);
    n.default.checkMovableLimits(l), o.isKind("mo") && c.default.setAttribute(o, "accent", !1), s.isKind("mo") && c.default.setAttribute(s, "accent", !1);
    var O = t.create("node", "munderover", [l, s, o], { accent: !1, accentunder: !1 });
    t.Push(O);
  }, f.TeXAtom = function(t, u, o) {
    var s = { texClass: o }, l, O, k;
    if (o === a.TEXCLASS.OP) {
      s.movesupsub = s.movablelimits = !0;
      var N = t.GetArgument(u), I = N.match(/^\s*\\rm\s+([a-zA-Z0-9 ]+)$/);
      I ? (s.mathvariant = r.TexConstant.Variant.NORMAL, O = t.create("token", "mi", s, I[1])) : (k = new e.default(N, t.stack.env, t.configuration).mml(), O = t.create("node", "TeXAtom", [k], s)), l = t.itemFactory.create("fn", O);
    } else
      k = t.ParseArg(u), l = t.create("node", "TeXAtom", [k], s);
    t.Push(l);
  }, f.MmlToken = function(t, u) {
    var o = t.GetArgument(u), s = t.GetBrackets(u, "").replace(/^\s+/, ""), l = t.GetArgument(u), O = {}, k = [], N;
    try {
      N = t.create("node", o);
    } catch {
      N = null;
    }
    if (!N || !N.isToken)
      throw new h.default("NotMathMLToken", "%1 is not a token element", o);
    for (; s !== ""; ) {
      var I = s.match(/^([a-z]+)\s*=\s*('[^']*'|"[^"]*"|[^ ,]*)\s*,?\s*/i);
      if (!I)
        throw new h.default("InvalidMathMLAttr", "Invalid MathML attribute: %1", s);
      if (!N.attributes.hasDefault(I[1]) && !x[I[1]])
        throw new h.default("UnknownAttrForElement", "%1 is not a recognized attribute for %2", I[1], o);
      var F = n.default.MmlFilterAttribute(t, I[1], I[2].replace(/^(['"])(.*)\1$/, "$2"));
      F && (F.toLowerCase() === "true" ? F = !0 : F.toLowerCase() === "false" && (F = !1), O[I[1]] = F, k.push(I[1])), s = s.substr(I[0].length);
    }
    k.length && (O["mjx-keep-attrs"] = k.join(" "));
    var R = t.create("text", l);
    N.appendChild(R), c.default.setProperties(N, O), t.Push(N);
  }, f.Strut = function(t, u) {
    var o = t.create("node", "mrow"), s = t.create("node", "mpadded", [o], { height: "8.6pt", depth: "3pt", width: 0 });
    t.Push(s);
  }, f.Phantom = function(t, u, o, s) {
    var l = t.create("node", "mphantom", [t.ParseArg(u)]);
    (o || s) && (l = t.create("node", "mpadded", [l]), s && (c.default.setAttribute(l, "height", 0), c.default.setAttribute(l, "depth", 0)), o && c.default.setAttribute(l, "width", 0));
    var O = t.create("node", "TeXAtom", [l]);
    t.Push(O);
  }, f.Smash = function(t, u) {
    var o = n.default.trimSpaces(t.GetBrackets(u, "")), s = t.create("node", "mpadded", [t.ParseArg(u)]);
    switch (o) {
      case "b":
        c.default.setAttribute(s, "depth", 0);
        break;
      case "t":
        c.default.setAttribute(s, "height", 0);
        break;
      default:
        c.default.setAttribute(s, "height", 0), c.default.setAttribute(s, "depth", 0);
    }
    var l = t.create("node", "TeXAtom", [s]);
    t.Push(l);
  }, f.Lap = function(t, u) {
    var o = t.create("node", "mpadded", [t.ParseArg(u)], { width: 0 });
    u === "\\llap" && c.default.setAttribute(o, "lspace", "-1width");
    var s = t.create("node", "TeXAtom", [o]);
    t.Push(s);
  }, f.RaiseLower = function(t, u) {
    var o = t.GetDimen(u), s = t.itemFactory.create("position").setProperties({ name: t.currentCS, move: "vertical" });
    o.charAt(0) === "-" && (o = o.slice(1), u = u.substr(1) === "raise" ? "\\lower" : "\\raise"), u === "\\lower" ? (s.setProperty("dh", "-" + o), s.setProperty("dd", "+" + o)) : (s.setProperty("dh", "+" + o), s.setProperty("dd", "-" + o)), t.Push(s);
  }, f.MoveLeftRight = function(t, u) {
    var o = t.GetDimen(u), s = o.charAt(0) === "-" ? o.slice(1) : "-" + o;
    if (u === "\\moveleft") {
      var l = o;
      o = s, s = l;
    }
    t.Push(t.itemFactory.create("position").setProperties({
      name: t.currentCS,
      move: "horizontal",
      left: t.create("node", "mspace", [], { width: o }),
      right: t.create("node", "mspace", [], { width: s })
    }));
  }, f.Hskip = function(t, u) {
    var o = t.create("node", "mspace", [], { width: t.GetDimen(u) });
    t.Push(o);
  }, f.Nonscript = function(t, u) {
    t.Push(t.itemFactory.create("nonscript"));
  }, f.Rule = function(t, u, o) {
    var s = t.GetDimen(u), l = t.GetDimen(u), O = t.GetDimen(u), k = { width: s, height: l, depth: O };
    o !== "blank" && (k.mathbackground = t.stack.env.color || "black");
    var N = t.create("node", "mspace", [], k);
    t.Push(N);
  }, f.rule = function(t, u) {
    var o = t.GetBrackets(u), s = t.GetDimen(u), l = t.GetDimen(u), O = t.create("node", "mspace", [], {
      width: s,
      height: l,
      mathbackground: t.stack.env.color || "black"
    });
    o && (O = t.create("node", "mpadded", [O], { voffset: o }), o.match(/^\-/) ? (c.default.setAttribute(O, "height", o), c.default.setAttribute(O, "depth", "+" + o.substr(1))) : c.default.setAttribute(O, "height", "+" + o)), t.Push(O);
  }, f.MakeBig = function(t, u, o, s) {
    s *= A;
    var l = String(s).replace(/(\.\d\d\d).+/, "$1") + "em", O = t.GetDelimiter(u, !0), k = t.create("token", "mo", {
      minsize: l,
      maxsize: l,
      fence: !0,
      stretchy: !0,
      symmetric: !0
    }, O), N = t.create("node", "TeXAtom", [k], { texClass: o });
    t.Push(N);
  }, f.BuildRel = function(t, u) {
    var o = t.ParseUpTo(u, "\\over"), s = t.ParseArg(u), l = t.create("node", "munderover");
    c.default.setChild(l, 0, s), c.default.setChild(l, 1, null), c.default.setChild(l, 2, o);
    var O = t.create("node", "TeXAtom", [l], { texClass: a.TEXCLASS.REL });
    t.Push(O);
  }, f.HBox = function(t, u, o, s) {
    t.PushAll(n.default.internalMath(t, t.GetArgument(u), o, s));
  }, f.FBox = function(t, u) {
    var o = n.default.internalMath(t, t.GetArgument(u)), s = t.create("node", "menclose", o, { notation: "box" });
    t.Push(s);
  }, f.FrameBox = function(t, u) {
    var o = t.GetBrackets(u), s = t.GetBrackets(u) || "c", l = n.default.internalMath(t, t.GetArgument(u));
    o && (l = [t.create("node", "mpadded", l, {
      width: o,
      "data-align": (0, y.lookup)(s, { l: "left", r: "right" }, "center")
    })]);
    var O = t.create("node", "TeXAtom", [t.create("node", "menclose", l, { notation: "box" })], { texClass: a.TEXCLASS.ORD });
    t.Push(O);
  }, f.Not = function(t, u) {
    t.Push(t.itemFactory.create("not"));
  }, f.Dots = function(t, u) {
    var o = c.default.createEntity("2026"), s = c.default.createEntity("22EF"), l = t.create("token", "mo", { stretchy: !1 }, o), O = t.create("token", "mo", { stretchy: !1 }, s);
    t.Push(t.itemFactory.create("dots").setProperties({
      ldots: l,
      cdots: O
    }));
  }, f.Matrix = function(t, u, o, s, l, O, k, N, I, F) {
    var R = t.GetNext();
    if (R === "")
      throw new h.default("MissingArgFor", "Missing argument for %1", t.currentCS);
    R === "{" ? t.i++ : (t.string = R + "}" + t.string.slice(t.i + 1), t.i = 0);
    var $ = t.itemFactory.create("array").setProperty("requireClose", !0);
    $.arraydef = {
      rowspacing: k || "4pt",
      columnspacing: O || "1em"
    }, I && $.setProperty("isCases", !0), F && ($.setProperty("isNumbered", !0), $.arraydef.side = F), (o || s) && ($.setProperty("open", o), $.setProperty("close", s)), N === "D" && ($.arraydef.displaystyle = !0), l != null && ($.arraydef.columnalign = l), t.Push($);
  }, f.Entry = function(t, u) {
    t.Push(t.itemFactory.create("cell").setProperties({ isEntry: !0, name: u }));
    var o = t.stack.Top(), s = o.getProperty("casesEnv"), l = o.getProperty("isCases");
    if (!(!l && !s)) {
      for (var O = t.string, k = 0, N = -1, I = t.i, F = O.length, R = s ? new RegExp("^\\\\end\\s*\\{".concat(s.replace(/\*/, "\\*"), "\\}")) : null; I < F; ) {
        var $ = O.charAt(I);
        if ($ === "{")
          k++, I++;
        else if ($ === "}")
          k === 0 ? F = 0 : (k--, k === 0 && N < 0 && (N = I - t.i), I++);
        else {
          if ($ === "&" && k === 0)
            throw new h.default("ExtraAlignTab", "Extra alignment tab in \\cases text");
          if ($ === "\\") {
            var J = O.substr(I);
            J.match(/^((\\cr)[^a-zA-Z]|\\\\)/) || R && J.match(R) ? F = 0 : I += 2;
          } else
            I++;
        }
      }
      var S = O.substr(t.i, I - t.i);
      if (!S.match(/^\s*\\text[^a-zA-Z]/) || N !== S.replace(/\s+$/, "").length - 1) {
        var b = n.default.internalMath(t, n.default.trimSpaces(S), 0);
        t.PushAll(b), t.i = I;
      }
    }
  }, f.Cr = function(t, u) {
    t.Push(t.itemFactory.create("cell").setProperties({ isCR: !0, name: u }));
  }, f.CrLaTeX = function(t, u, o) {
    o === void 0 && (o = !1);
    var s;
    if (!o && (t.string.charAt(t.i) === "*" && t.i++, t.string.charAt(t.i) === "[")) {
      var l = t.GetBrackets(u, ""), O = E(n.default.matchDimen(l), 2), k = O[0], N = O[1];
      if (l && !k)
        throw new h.default("BracketMustBeDimension", "Bracket argument to %1 must be a dimension", t.currentCS);
      s = k + N;
    }
    t.Push(t.itemFactory.create("cell").setProperties({ isCR: !0, name: u, linebreak: !0 }));
    var I = t.stack.Top(), F;
    I instanceof d.ArrayItem ? s && I.addRowSpacing(s) : (s && (F = t.create("node", "mspace", [], { depth: s }), t.Push(F)), F = t.create("node", "mspace", [], { linebreak: r.TexConstant.LineBreak.NEWLINE }), t.Push(F));
  }, f.HLine = function(t, u, o) {
    o == null && (o = "solid");
    var s = t.stack.Top();
    if (!(s instanceof d.ArrayItem) || s.Size())
      throw new h.default("Misplaced", "Misplaced %1", t.currentCS);
    if (!s.table.length)
      s.frame.push("top");
    else {
      for (var l = s.arraydef.rowlines ? s.arraydef.rowlines.split(/ /) : []; l.length < s.table.length; )
        l.push("none");
      l[s.table.length - 1] = o, s.arraydef.rowlines = l.join(" ");
    }
  }, f.HFill = function(t, u) {
    var o = t.stack.Top();
    if (o instanceof d.ArrayItem)
      o.hfill.push(o.Size());
    else
      throw new h.default("UnsupportedHFill", "Unsupported use of %1", t.currentCS);
  }, f.BeginEnd = function(t, u) {
    var o = t.GetArgument(u);
    if (o.match(/\\/i))
      throw new h.default("InvalidEnv", "Invalid environment name '%1'", o);
    var s = t.configuration.handlers.get("environment").lookup(o);
    if (s && u === "\\end") {
      if (!s.args[0]) {
        var l = t.itemFactory.create("end").setProperty("name", o);
        t.Push(l);
        return;
      }
      t.stack.env.closing = o;
    }
    n.default.checkMaxMacros(t, !1), t.parse("environment", [t, o]);
  }, f.Array = function(t, u, o, s, l, O, k, N, I) {
    l || (l = t.GetArgument("\\begin{" + u.getName() + "}"));
    var F = ("c" + l).replace(/[^clr|:]/g, "").replace(/[^|:]([|:])+/g, "$1");
    l = l.replace(/[^clr]/g, "").split("").join(" "), l = l.replace(/l/g, "left").replace(/r/g, "right").replace(/c/g, "center");
    var R = t.itemFactory.create("array");
    return R.arraydef = {
      columnalign: l,
      columnspacing: O || "1em",
      rowspacing: k || "4pt"
    }, F.match(/[|:]/) && (F.charAt(0).match(/[|:]/) && (R.frame.push("left"), R.dashed = F.charAt(0) === ":"), F.charAt(F.length - 1).match(/[|:]/) && R.frame.push("right"), F = F.substr(1, F.length - 2), R.arraydef.columnlines = F.split("").join(" ").replace(/[^|: ]/g, "none").replace(/\|/g, "solid").replace(/:/g, "dashed")), o && R.setProperty("open", t.convertDelimiter(o)), s && R.setProperty("close", t.convertDelimiter(s)), (N || "").charAt(1) === "'" && (R.arraydef["data-cramped"] = !0, N = N.charAt(0)), N === "D" ? R.arraydef.displaystyle = !0 : N && (R.arraydef.displaystyle = !1), N === "S" && (R.arraydef.scriptlevel = 1), I && (R.arraydef.useHeight = !1), t.Push(u), R;
  }, f.AlignedArray = function(t, u) {
    var o = t.GetBrackets("\\begin{" + u.getName() + "}"), s = f.Array(t, u);
    return n.default.setArrayAlign(s, o);
  }, f.Equation = function(t, u, o) {
    return t.Push(u), n.default.checkEqnEnv(t), t.itemFactory.create("equation", o).setProperty("name", u.getName());
  }, f.EqnArray = function(t, u, o, s, l, O) {
    t.Push(u), s && n.default.checkEqnEnv(t), l = l.replace(/[^clr]/g, "").split("").join(" "), l = l.replace(/l/g, "left").replace(/r/g, "right").replace(/c/g, "center");
    var k = t.itemFactory.create("eqnarray", u.getName(), o, s, t.stack.global);
    return k.arraydef = {
      displaystyle: !0,
      columnalign: l,
      columnspacing: O || "1em",
      rowspacing: "3pt",
      side: t.options.tagSide,
      minlabelspacing: t.options.tagIndent
    }, k;
  }, f.HandleNoTag = function(t, u) {
    t.tags.notag();
  }, f.HandleLabel = function(t, u) {
    var o = t.GetArgument(u);
    if (o !== "" && !t.tags.refUpdate) {
      if (t.tags.label)
        throw new h.default("MultipleCommand", "Multiple %1", t.currentCS);
      if (t.tags.label = o, (t.tags.allLabels[o] || t.tags.labels[o]) && !t.options.ignoreDuplicateLabels)
        throw new h.default("MultipleLabel", "Label '%1' multiply defined", o);
      t.tags.labels[o] = new i.Label();
    }
  }, f.HandleRef = function(t, u, o) {
    var s = t.GetArgument(u), l = t.tags.allLabels[s] || t.tags.labels[s];
    l || (t.tags.refUpdate || (t.tags.redo = !0), l = new i.Label());
    var O = l.tag;
    o && (O = t.tags.formatTag(O));
    var k = t.create("node", "mrow", n.default.internalMath(t, O), {
      href: t.tags.formatUrl(l.id, t.options.baseURL),
      class: "MathJax_ref"
    });
    t.Push(k);
  }, f.Macro = function(t, u, o, s, l) {
    if (s) {
      var O = [];
      if (l != null) {
        var k = t.GetBrackets(u);
        O.push(k ?? l);
      }
      for (var N = O.length; N < s; N++)
        O.push(t.GetArgument(u));
      o = n.default.substituteArgs(t, O, o);
    }
    t.string = n.default.addArgs(t, o, t.string.slice(t.i)), t.i = 0, n.default.checkMaxMacros(t);
  }, f.MathChoice = function(t, u) {
    var o = t.ParseArg(u), s = t.ParseArg(u), l = t.ParseArg(u), O = t.ParseArg(u);
    t.Push(t.create("node", "MathChoice", [o, s, l, O]));
  }, et.default = f, et;
}
var ht = {}, Wt;
function me() {
  if (Wt) return ht;
  Wt = 1;
  var M = ht && ht.__read || function(c, h) {
    var e = typeof Symbol == "function" && c[Symbol.iterator];
    if (!e) return c;
    var r = e.call(c), n, a = [], i;
    try {
      for (; (h === void 0 || h-- > 0) && !(n = r.next()).done; ) a.push(n.value);
    } catch (v) {
      i = { error: v };
    } finally {
      try {
        n && !n.done && (e = r.return) && e.call(r);
      } finally {
        if (i) throw i.error;
      }
    }
    return a;
  }, _ = ht && ht.__spreadArray || function(c, h, e) {
    if (e || arguments.length === 2) for (var r = 0, n = h.length, a; r < n; r++)
      (a || !(r in h)) && (a || (a = Array.prototype.slice.call(h, 0, r)), a[r] = h[r]);
    return c.concat(a || Array.prototype.slice.call(h));
  }, X = ht && ht.__importDefault || function(c) {
    return c && c.__esModule ? c : { default: c };
  };
  Object.defineProperty(ht, "__esModule", { value: !0 });
  var j = X(pt()), E = It(), m = X(Ct()), d;
  return (function(c) {
    function h(y, f) {
      var A = m.default.getFontDef(y), x = y.stack.env;
      x.multiLetterIdentifiers && x.font !== "" && (f = y.string.substr(y.i - 1).match(x.multiLetterIdentifiers)[0], y.i += f.length - 1, A.mathvariant === E.TexConstant.Variant.NORMAL && x.noAutoOP && f.length > 1 && (A.autoOP = !1));
      var C = y.create("token", "mi", A, f);
      y.Push(C);
    }
    c.variable = h;
    function e(y, f) {
      var A, x = y.configuration.options.digits, C = y.string.slice(y.i - 1).match(x), t = m.default.getFontDef(y);
      C ? (A = y.create("token", "mn", t, C[0].replace(/[{}]/g, "")), y.i += C[0].length - 1) : A = y.create("token", "mo", t, f), y.Push(A);
    }
    c.digit = e;
    function r(y, f) {
      var A = y.GetCS();
      y.parse("macro", [y, A]);
    }
    c.controlSequence = r;
    function n(y, f) {
      var A = f.attributes || { mathvariant: E.TexConstant.Variant.ITALIC }, x = y.create("token", "mi", A, f.char);
      y.Push(x);
    }
    c.mathchar0mi = n;
    function a(y, f) {
      var A = f.attributes || {};
      A.stretchy = !1;
      var x = y.create("token", "mo", A, f.char);
      j.default.setProperty(x, "fixStretchy", !0), y.configuration.addNode("fixStretchy", x), y.Push(x);
    }
    c.mathchar0mo = a;
    function i(y, f) {
      var A = f.attributes || { mathvariant: E.TexConstant.Variant.NORMAL };
      y.stack.env.font && (A.mathvariant = y.stack.env.font);
      var x = y.create("token", "mi", A, f.char);
      y.Push(x);
    }
    c.mathchar7 = i;
    function v(y, f) {
      var A = f.attributes || {};
      A = Object.assign({ fence: !1, stretchy: !1 }, A);
      var x = y.create("token", "mo", A, f.char);
      y.Push(x);
    }
    c.delimiter = v;
    function p(y, f, A, x) {
      var C = x[0], t = y.itemFactory.create("begin").setProperties({ name: f, end: C });
      t = A.apply(void 0, _([y, t], M(x.slice(1)), !1)), y.Push(t);
    }
    c.environment = p;
  })(d || (d = {})), ht.default = d, ht;
}
var Yt;
function ve() {
  if (Yt) return st;
  Yt = 1;
  var M = st && st.__createBinding || (Object.create ? (function(n, a, i, v) {
    v === void 0 && (v = i);
    var p = Object.getOwnPropertyDescriptor(a, i);
    (!p || ("get" in p ? !a.__esModule : p.writable || p.configurable)) && (p = { enumerable: !0, get: function() {
      return a[i];
    } }), Object.defineProperty(n, v, p);
  }) : (function(n, a, i, v) {
    v === void 0 && (v = i), n[v] = a[i];
  })), _ = st && st.__setModuleDefault || (Object.create ? (function(n, a) {
    Object.defineProperty(n, "default", { enumerable: !0, value: a });
  }) : function(n, a) {
    n.default = a;
  }), X = st && st.__importStar || function(n) {
    if (n && n.__esModule) return n;
    var a = {};
    if (n != null) for (var i in n) i !== "default" && Object.prototype.hasOwnProperty.call(n, i) && M(a, n, i);
    return _(a, n), a;
  }, j = st && st.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(st, "__esModule", { value: !0 });
  var E = X(re()), m = It(), d = j(pe()), c = j(me()), h = j(Ct()), e = At(), r = te();
  return new E.RegExpMap("letter", c.default.variable, /[a-z]/i), new E.RegExpMap("digit", c.default.digit, /[0-9.,]/), new E.RegExpMap("command", c.default.controlSequence, /^\\/), new E.MacroMap("special", {
    "{": "Open",
    "}": "Close",
    "~": "Tilde",
    "^": "Superscript",
    _: "Subscript",
    " ": "Space",
    "	": "Space",
    "\r": "Space",
    "\n": "Space",
    "'": "Prime",
    "%": "Comment",
    "&": "Entry",
    "#": "Hash",
    " ": "Space",
    "’": "Prime"
  }, d.default), new E.CharacterMap("mathchar0mi", c.default.mathchar0mi, {
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ϵ",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    iota: "ι",
    kappa: "κ",
    lambda: "λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    omicron: "ο",
    pi: "π",
    rho: "ρ",
    sigma: "σ",
    tau: "τ",
    upsilon: "υ",
    phi: "ϕ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    varepsilon: "ε",
    vartheta: "ϑ",
    varpi: "ϖ",
    varrho: "ϱ",
    varsigma: "ς",
    varphi: "φ",
    S: ["§", { mathvariant: m.TexConstant.Variant.NORMAL }],
    aleph: ["ℵ", { mathvariant: m.TexConstant.Variant.NORMAL }],
    hbar: ["ℏ", { variantForm: !0 }],
    imath: "ı",
    jmath: "ȷ",
    ell: "ℓ",
    wp: ["℘", { mathvariant: m.TexConstant.Variant.NORMAL }],
    Re: ["ℜ", { mathvariant: m.TexConstant.Variant.NORMAL }],
    Im: ["ℑ", { mathvariant: m.TexConstant.Variant.NORMAL }],
    partial: ["∂", { mathvariant: m.TexConstant.Variant.ITALIC }],
    infty: ["∞", { mathvariant: m.TexConstant.Variant.NORMAL }],
    prime: ["′", { variantForm: !0 }],
    emptyset: ["∅", { mathvariant: m.TexConstant.Variant.NORMAL }],
    nabla: ["∇", { mathvariant: m.TexConstant.Variant.NORMAL }],
    top: ["⊤", { mathvariant: m.TexConstant.Variant.NORMAL }],
    bot: ["⊥", { mathvariant: m.TexConstant.Variant.NORMAL }],
    angle: ["∠", { mathvariant: m.TexConstant.Variant.NORMAL }],
    triangle: ["△", { mathvariant: m.TexConstant.Variant.NORMAL }],
    backslash: ["∖", { mathvariant: m.TexConstant.Variant.NORMAL }],
    forall: ["∀", { mathvariant: m.TexConstant.Variant.NORMAL }],
    exists: ["∃", { mathvariant: m.TexConstant.Variant.NORMAL }],
    neg: ["¬", { mathvariant: m.TexConstant.Variant.NORMAL }],
    lnot: ["¬", { mathvariant: m.TexConstant.Variant.NORMAL }],
    flat: ["♭", { mathvariant: m.TexConstant.Variant.NORMAL }],
    natural: ["♮", { mathvariant: m.TexConstant.Variant.NORMAL }],
    sharp: ["♯", { mathvariant: m.TexConstant.Variant.NORMAL }],
    clubsuit: ["♣", { mathvariant: m.TexConstant.Variant.NORMAL }],
    diamondsuit: ["♢", { mathvariant: m.TexConstant.Variant.NORMAL }],
    heartsuit: ["♡", { mathvariant: m.TexConstant.Variant.NORMAL }],
    spadesuit: ["♠", { mathvariant: m.TexConstant.Variant.NORMAL }]
  }), new E.CharacterMap("mathchar0mo", c.default.mathchar0mo, {
    surd: "√",
    coprod: ["∐", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigvee: ["⋁", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigwedge: ["⋀", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    biguplus: ["⨄", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigcap: ["⋂", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigcup: ["⋃", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    int: ["∫", { texClass: e.TEXCLASS.OP }],
    intop: ["∫", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0,
      movablelimits: !0
    }],
    iint: ["∬", { texClass: e.TEXCLASS.OP }],
    iiint: ["∭", { texClass: e.TEXCLASS.OP }],
    prod: ["∏", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    sum: ["∑", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigotimes: ["⨂", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigoplus: ["⨁", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    bigodot: ["⨀", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    oint: ["∮", { texClass: e.TEXCLASS.OP }],
    bigsqcup: ["⨆", {
      texClass: e.TEXCLASS.OP,
      movesupsub: !0
    }],
    smallint: ["∫", { largeop: !1 }],
    triangleleft: "◃",
    triangleright: "▹",
    bigtriangleup: "△",
    bigtriangledown: "▽",
    wedge: "∧",
    land: "∧",
    vee: "∨",
    lor: "∨",
    cap: "∩",
    cup: "∪",
    ddagger: "‡",
    dagger: "†",
    sqcap: "⊓",
    sqcup: "⊔",
    uplus: "⊎",
    amalg: "⨿",
    diamond: "⋄",
    bullet: "∙",
    wr: "≀",
    div: "÷",
    divsymbol: "÷",
    odot: ["⊙", { largeop: !1 }],
    oslash: ["⊘", { largeop: !1 }],
    otimes: ["⊗", { largeop: !1 }],
    ominus: ["⊖", { largeop: !1 }],
    oplus: ["⊕", { largeop: !1 }],
    mp: "∓",
    pm: "±",
    circ: "∘",
    bigcirc: "◯",
    setminus: "∖",
    cdot: "⋅",
    ast: "∗",
    times: "×",
    star: "⋆",
    propto: "∝",
    sqsubseteq: "⊑",
    sqsupseteq: "⊒",
    parallel: "∥",
    mid: "∣",
    dashv: "⊣",
    vdash: "⊢",
    leq: "≤",
    le: "≤",
    geq: "≥",
    ge: "≥",
    lt: "<",
    gt: ">",
    succ: "≻",
    prec: "≺",
    approx: "≈",
    succeq: "⪰",
    preceq: "⪯",
    supset: "⊃",
    subset: "⊂",
    supseteq: "⊇",
    subseteq: "⊆",
    in: "∈",
    ni: "∋",
    notin: "∉",
    owns: "∋",
    gg: "≫",
    ll: "≪",
    sim: "∼",
    simeq: "≃",
    perp: "⊥",
    equiv: "≡",
    asymp: "≍",
    smile: "⌣",
    frown: "⌢",
    ne: "≠",
    neq: "≠",
    cong: "≅",
    doteq: "≐",
    bowtie: "⋈",
    models: "⊨",
    notChar: "⧸",
    Leftrightarrow: "⇔",
    Leftarrow: "⇐",
    Rightarrow: "⇒",
    leftrightarrow: "↔",
    leftarrow: "←",
    gets: "←",
    rightarrow: "→",
    to: ["→", { accent: !1 }],
    mapsto: "↦",
    leftharpoonup: "↼",
    leftharpoondown: "↽",
    rightharpoonup: "⇀",
    rightharpoondown: "⇁",
    nearrow: "↗",
    searrow: "↘",
    nwarrow: "↖",
    swarrow: "↙",
    rightleftharpoons: "⇌",
    hookrightarrow: "↪",
    hookleftarrow: "↩",
    longleftarrow: "⟵",
    Longleftarrow: "⟸",
    longrightarrow: "⟶",
    Longrightarrow: "⟹",
    Longleftrightarrow: "⟺",
    longleftrightarrow: "⟷",
    longmapsto: "⟼",
    ldots: "…",
    cdots: "⋯",
    vdots: "⋮",
    ddots: "⋱",
    dotsc: "…",
    dotsb: "⋯",
    dotsm: "⋯",
    dotsi: "⋯",
    dotso: "…",
    ldotp: [".", { texClass: e.TEXCLASS.PUNCT }],
    cdotp: ["⋅", { texClass: e.TEXCLASS.PUNCT }],
    colon: [":", { texClass: e.TEXCLASS.PUNCT }]
  }), new E.CharacterMap("mathchar7", c.default.mathchar7, {
    Gamma: "Γ",
    Delta: "Δ",
    Theta: "Θ",
    Lambda: "Λ",
    Xi: "Ξ",
    Pi: "Π",
    Sigma: "Σ",
    Upsilon: "Υ",
    Phi: "Φ",
    Psi: "Ψ",
    Omega: "Ω",
    _: "_",
    "#": "#",
    $: "$",
    "%": "%",
    "&": "&",
    And: "&"
  }), new E.DelimiterMap("delimiter", c.default.delimiter, {
    "(": "(",
    ")": ")",
    "[": "[",
    "]": "]",
    "<": "⟨",
    ">": "⟩",
    "\\lt": "⟨",
    "\\gt": "⟩",
    "/": "/",
    "|": ["|", { texClass: e.TEXCLASS.ORD }],
    ".": "",
    "\\\\": "\\",
    "\\lmoustache": "⎰",
    "\\rmoustache": "⎱",
    "\\lgroup": "⟮",
    "\\rgroup": "⟯",
    "\\arrowvert": "⏐",
    "\\Arrowvert": "‖",
    "\\bracevert": "⎪",
    "\\Vert": ["‖", { texClass: e.TEXCLASS.ORD }],
    "\\|": ["‖", { texClass: e.TEXCLASS.ORD }],
    "\\vert": ["|", { texClass: e.TEXCLASS.ORD }],
    "\\uparrow": "↑",
    "\\downarrow": "↓",
    "\\updownarrow": "↕",
    "\\Uparrow": "⇑",
    "\\Downarrow": "⇓",
    "\\Updownarrow": "⇕",
    "\\backslash": "\\",
    "\\rangle": "⟩",
    "\\langle": "⟨",
    "\\rbrace": "}",
    "\\lbrace": "{",
    "\\}": "}",
    "\\{": "{",
    "\\rceil": "⌉",
    "\\lceil": "⌈",
    "\\rfloor": "⌋",
    "\\lfloor": "⌊",
    "\\lbrack": "[",
    "\\rbrack": "]"
  }), new E.CommandMap("macros", {
    displaystyle: ["SetStyle", "D", !0, 0],
    textstyle: ["SetStyle", "T", !1, 0],
    scriptstyle: ["SetStyle", "S", !1, 1],
    scriptscriptstyle: ["SetStyle", "SS", !1, 2],
    rm: ["SetFont", m.TexConstant.Variant.NORMAL],
    mit: ["SetFont", m.TexConstant.Variant.ITALIC],
    oldstyle: ["SetFont", m.TexConstant.Variant.OLDSTYLE],
    cal: ["SetFont", m.TexConstant.Variant.CALLIGRAPHIC],
    it: ["SetFont", m.TexConstant.Variant.MATHITALIC],
    bf: ["SetFont", m.TexConstant.Variant.BOLD],
    bbFont: ["SetFont", m.TexConstant.Variant.DOUBLESTRUCK],
    scr: ["SetFont", m.TexConstant.Variant.SCRIPT],
    frak: ["SetFont", m.TexConstant.Variant.FRAKTUR],
    sf: ["SetFont", m.TexConstant.Variant.SANSSERIF],
    tt: ["SetFont", m.TexConstant.Variant.MONOSPACE],
    mathrm: ["MathFont", m.TexConstant.Variant.NORMAL],
    mathup: ["MathFont", m.TexConstant.Variant.NORMAL],
    mathnormal: ["MathFont", ""],
    mathbf: ["MathFont", m.TexConstant.Variant.BOLD],
    mathbfup: ["MathFont", m.TexConstant.Variant.BOLD],
    mathit: ["MathFont", m.TexConstant.Variant.MATHITALIC],
    mathbfit: ["MathFont", m.TexConstant.Variant.BOLDITALIC],
    mathbb: ["MathFont", m.TexConstant.Variant.DOUBLESTRUCK],
    Bbb: ["MathFont", m.TexConstant.Variant.DOUBLESTRUCK],
    mathfrak: ["MathFont", m.TexConstant.Variant.FRAKTUR],
    mathbffrak: ["MathFont", m.TexConstant.Variant.BOLDFRAKTUR],
    mathscr: ["MathFont", m.TexConstant.Variant.SCRIPT],
    mathbfscr: ["MathFont", m.TexConstant.Variant.BOLDSCRIPT],
    mathsf: ["MathFont", m.TexConstant.Variant.SANSSERIF],
    mathsfup: ["MathFont", m.TexConstant.Variant.SANSSERIF],
    mathbfsf: ["MathFont", m.TexConstant.Variant.BOLDSANSSERIF],
    mathbfsfup: ["MathFont", m.TexConstant.Variant.BOLDSANSSERIF],
    mathsfit: ["MathFont", m.TexConstant.Variant.SANSSERIFITALIC],
    mathbfsfit: ["MathFont", m.TexConstant.Variant.SANSSERIFBOLDITALIC],
    mathtt: ["MathFont", m.TexConstant.Variant.MONOSPACE],
    mathcal: ["MathFont", m.TexConstant.Variant.CALLIGRAPHIC],
    mathbfcal: ["MathFont", m.TexConstant.Variant.BOLDCALLIGRAPHIC],
    symrm: ["MathFont", m.TexConstant.Variant.NORMAL],
    symup: ["MathFont", m.TexConstant.Variant.NORMAL],
    symnormal: ["MathFont", ""],
    symbf: ["MathFont", m.TexConstant.Variant.BOLD],
    symbfup: ["MathFont", m.TexConstant.Variant.BOLD],
    symit: ["MathFont", m.TexConstant.Variant.ITALIC],
    symbfit: ["MathFont", m.TexConstant.Variant.BOLDITALIC],
    symbb: ["MathFont", m.TexConstant.Variant.DOUBLESTRUCK],
    symfrak: ["MathFont", m.TexConstant.Variant.FRAKTUR],
    symbffrak: ["MathFont", m.TexConstant.Variant.BOLDFRAKTUR],
    symscr: ["MathFont", m.TexConstant.Variant.SCRIPT],
    symbfscr: ["MathFont", m.TexConstant.Variant.BOLDSCRIPT],
    symsf: ["MathFont", m.TexConstant.Variant.SANSSERIF],
    symsfup: ["MathFont", m.TexConstant.Variant.SANSSERIF],
    symbfsf: ["MathFont", m.TexConstant.Variant.BOLDSANSSERIF],
    symbfsfup: ["MathFont", m.TexConstant.Variant.BOLDSANSSERIF],
    symsfit: ["MathFont", m.TexConstant.Variant.SANSSERIFITALIC],
    symbfsfit: ["MathFont", m.TexConstant.Variant.SANSSERIFBOLDITALIC],
    symtt: ["MathFont", m.TexConstant.Variant.MONOSPACE],
    symcal: ["MathFont", m.TexConstant.Variant.CALLIGRAPHIC],
    symbfcal: ["MathFont", m.TexConstant.Variant.BOLDCALLIGRAPHIC],
    textrm: ["HBox", null, m.TexConstant.Variant.NORMAL],
    textup: ["HBox", null, m.TexConstant.Variant.NORMAL],
    textnormal: ["HBox"],
    textit: ["HBox", null, m.TexConstant.Variant.ITALIC],
    textbf: ["HBox", null, m.TexConstant.Variant.BOLD],
    textsf: ["HBox", null, m.TexConstant.Variant.SANSSERIF],
    texttt: ["HBox", null, m.TexConstant.Variant.MONOSPACE],
    tiny: ["SetSize", 0.5],
    Tiny: ["SetSize", 0.6],
    scriptsize: ["SetSize", 0.7],
    small: ["SetSize", 0.85],
    normalsize: ["SetSize", 1],
    large: ["SetSize", 1.2],
    Large: ["SetSize", 1.44],
    LARGE: ["SetSize", 1.73],
    huge: ["SetSize", 2.07],
    Huge: ["SetSize", 2.49],
    arcsin: "NamedFn",
    arccos: "NamedFn",
    arctan: "NamedFn",
    arg: "NamedFn",
    cos: "NamedFn",
    cosh: "NamedFn",
    cot: "NamedFn",
    coth: "NamedFn",
    csc: "NamedFn",
    deg: "NamedFn",
    det: "NamedOp",
    dim: "NamedFn",
    exp: "NamedFn",
    gcd: "NamedOp",
    hom: "NamedFn",
    inf: "NamedOp",
    ker: "NamedFn",
    lg: "NamedFn",
    lim: "NamedOp",
    liminf: ["NamedOp", "lim&thinsp;inf"],
    limsup: ["NamedOp", "lim&thinsp;sup"],
    ln: "NamedFn",
    log: "NamedFn",
    max: "NamedOp",
    min: "NamedOp",
    Pr: "NamedOp",
    sec: "NamedFn",
    sin: "NamedFn",
    sinh: "NamedFn",
    sup: "NamedOp",
    tan: "NamedFn",
    tanh: "NamedFn",
    limits: ["Limits", 1],
    nolimits: ["Limits", 0],
    overline: ["UnderOver", "2015"],
    underline: ["UnderOver", "2015"],
    overbrace: ["UnderOver", "23DE", 1],
    underbrace: ["UnderOver", "23DF", 1],
    overparen: ["UnderOver", "23DC"],
    underparen: ["UnderOver", "23DD"],
    overrightarrow: ["UnderOver", "2192"],
    underrightarrow: ["UnderOver", "2192"],
    overleftarrow: ["UnderOver", "2190"],
    underleftarrow: ["UnderOver", "2190"],
    overleftrightarrow: ["UnderOver", "2194"],
    underleftrightarrow: ["UnderOver", "2194"],
    overset: "Overset",
    underset: "Underset",
    overunderset: "Overunderset",
    stackrel: ["Macro", "\\mathrel{\\mathop{#2}\\limits^{#1}}", 2],
    stackbin: ["Macro", "\\mathbin{\\mathop{#2}\\limits^{#1}}", 2],
    over: "Over",
    overwithdelims: "Over",
    atop: "Over",
    atopwithdelims: "Over",
    above: "Over",
    abovewithdelims: "Over",
    brace: ["Over", "{", "}"],
    brack: ["Over", "[", "]"],
    choose: ["Over", "(", ")"],
    frac: "Frac",
    sqrt: "Sqrt",
    root: "Root",
    uproot: ["MoveRoot", "upRoot"],
    leftroot: ["MoveRoot", "leftRoot"],
    left: "LeftRight",
    right: "LeftRight",
    middle: "LeftRight",
    llap: "Lap",
    rlap: "Lap",
    raise: "RaiseLower",
    lower: "RaiseLower",
    moveleft: "MoveLeftRight",
    moveright: "MoveLeftRight",
    ",": ["Spacer", r.MATHSPACE.thinmathspace],
    ":": ["Spacer", r.MATHSPACE.mediummathspace],
    ">": ["Spacer", r.MATHSPACE.mediummathspace],
    ";": ["Spacer", r.MATHSPACE.thickmathspace],
    "!": ["Spacer", r.MATHSPACE.negativethinmathspace],
    enspace: ["Spacer", 0.5],
    quad: ["Spacer", 1],
    qquad: ["Spacer", 2],
    thinspace: ["Spacer", r.MATHSPACE.thinmathspace],
    negthinspace: ["Spacer", r.MATHSPACE.negativethinmathspace],
    hskip: "Hskip",
    hspace: "Hskip",
    kern: "Hskip",
    mskip: "Hskip",
    mspace: "Hskip",
    mkern: "Hskip",
    rule: "rule",
    Rule: ["Rule"],
    Space: ["Rule", "blank"],
    nonscript: "Nonscript",
    big: ["MakeBig", e.TEXCLASS.ORD, 0.85],
    Big: ["MakeBig", e.TEXCLASS.ORD, 1.15],
    bigg: ["MakeBig", e.TEXCLASS.ORD, 1.45],
    Bigg: ["MakeBig", e.TEXCLASS.ORD, 1.75],
    bigl: ["MakeBig", e.TEXCLASS.OPEN, 0.85],
    Bigl: ["MakeBig", e.TEXCLASS.OPEN, 1.15],
    biggl: ["MakeBig", e.TEXCLASS.OPEN, 1.45],
    Biggl: ["MakeBig", e.TEXCLASS.OPEN, 1.75],
    bigr: ["MakeBig", e.TEXCLASS.CLOSE, 0.85],
    Bigr: ["MakeBig", e.TEXCLASS.CLOSE, 1.15],
    biggr: ["MakeBig", e.TEXCLASS.CLOSE, 1.45],
    Biggr: ["MakeBig", e.TEXCLASS.CLOSE, 1.75],
    bigm: ["MakeBig", e.TEXCLASS.REL, 0.85],
    Bigm: ["MakeBig", e.TEXCLASS.REL, 1.15],
    biggm: ["MakeBig", e.TEXCLASS.REL, 1.45],
    Biggm: ["MakeBig", e.TEXCLASS.REL, 1.75],
    mathord: ["TeXAtom", e.TEXCLASS.ORD],
    mathop: ["TeXAtom", e.TEXCLASS.OP],
    mathopen: ["TeXAtom", e.TEXCLASS.OPEN],
    mathclose: ["TeXAtom", e.TEXCLASS.CLOSE],
    mathbin: ["TeXAtom", e.TEXCLASS.BIN],
    mathrel: ["TeXAtom", e.TEXCLASS.REL],
    mathpunct: ["TeXAtom", e.TEXCLASS.PUNCT],
    mathinner: ["TeXAtom", e.TEXCLASS.INNER],
    vcenter: ["TeXAtom", e.TEXCLASS.VCENTER],
    buildrel: "BuildRel",
    hbox: ["HBox", 0],
    text: "HBox",
    mbox: ["HBox", 0],
    fbox: "FBox",
    boxed: ["Macro", "\\fbox{$\\displaystyle{#1}$}", 1],
    framebox: "FrameBox",
    strut: "Strut",
    mathstrut: ["Macro", "\\vphantom{(}"],
    phantom: "Phantom",
    vphantom: ["Phantom", 1, 0],
    hphantom: ["Phantom", 0, 1],
    smash: "Smash",
    acute: ["Accent", "00B4"],
    grave: ["Accent", "0060"],
    ddot: ["Accent", "00A8"],
    tilde: ["Accent", "007E"],
    bar: ["Accent", "00AF"],
    breve: ["Accent", "02D8"],
    check: ["Accent", "02C7"],
    hat: ["Accent", "005E"],
    vec: ["Accent", "2192"],
    dot: ["Accent", "02D9"],
    widetilde: ["Accent", "007E", 1],
    widehat: ["Accent", "005E", 1],
    matrix: "Matrix",
    array: "Matrix",
    pmatrix: ["Matrix", "(", ")"],
    cases: [
      "Matrix",
      "{",
      "",
      "left left",
      null,
      ".1em",
      null,
      !0
    ],
    eqalign: [
      "Matrix",
      null,
      null,
      "right left",
      (0, r.em)(r.MATHSPACE.thickmathspace),
      ".5em",
      "D"
    ],
    displaylines: ["Matrix", null, null, "center", null, ".5em", "D"],
    cr: "Cr",
    "\\": "CrLaTeX",
    newline: ["CrLaTeX", !0],
    hline: ["HLine", "solid"],
    hdashline: ["HLine", "dashed"],
    eqalignno: [
      "Matrix",
      null,
      null,
      "right left",
      (0, r.em)(r.MATHSPACE.thickmathspace),
      ".5em",
      "D",
      null,
      "right"
    ],
    leqalignno: [
      "Matrix",
      null,
      null,
      "right left",
      (0, r.em)(r.MATHSPACE.thickmathspace),
      ".5em",
      "D",
      null,
      "left"
    ],
    hfill: "HFill",
    hfil: "HFill",
    hfilll: "HFill",
    bmod: ["Macro", '\\mmlToken{mo}[lspace="thickmathspace" rspace="thickmathspace"]{mod}'],
    pmod: ["Macro", "\\pod{\\mmlToken{mi}{mod}\\kern 6mu #1}", 1],
    mod: [
      "Macro",
      "\\mathchoice{\\kern18mu}{\\kern12mu}{\\kern12mu}{\\kern12mu}\\mmlToken{mi}{mod}\\,\\,#1",
      1
    ],
    pod: ["Macro", "\\mathchoice{\\kern18mu}{\\kern8mu}{\\kern8mu}{\\kern8mu}(#1)", 1],
    iff: ["Macro", "\\;\\Longleftrightarrow\\;"],
    skew: ["Macro", "{{#2{#3\\mkern#1mu}\\mkern-#1mu}{}}", 3],
    pmb: ["Macro", "\\rlap{#1}\\kern1px{#1}", 1],
    TeX: ["Macro", "T\\kern-.14em\\lower.5ex{E}\\kern-.115em X"],
    LaTeX: ["Macro", "L\\kern-.325em\\raise.21em{\\scriptstyle{A}}\\kern-.17em\\TeX"],
    " ": ["Macro", "\\text{ }"],
    not: "Not",
    dots: "Dots",
    space: "Tilde",
    " ": "Tilde",
    begin: "BeginEnd",
    end: "BeginEnd",
    label: "HandleLabel",
    ref: "HandleRef",
    nonumber: "HandleNoTag",
    mathchoice: "MathChoice",
    mmlToken: "MmlToken"
  }, d.default), new E.EnvironmentMap("environment", c.default.environment, {
    array: ["AlignedArray"],
    equation: ["Equation", null, !0],
    eqnarray: [
      "EqnArray",
      null,
      !0,
      !0,
      "rcl",
      h.default.cols(0, r.MATHSPACE.thickmathspace),
      ".5em"
    ]
  }, d.default), new E.CharacterMap("not_remap", null, {
    "←": "↚",
    "→": "↛",
    "↔": "↮",
    "⇐": "⇍",
    "⇒": "⇏",
    "⇔": "⇎",
    "∈": "∉",
    "∋": "∌",
    "∣": "∤",
    "∥": "∦",
    "∼": "≁",
    "~": "≁",
    "≃": "≄",
    "≅": "≇",
    "≈": "≉",
    "≍": "≭",
    "=": "≠",
    "≡": "≢",
    "<": "≮",
    ">": "≯",
    "≤": "≰",
    "≥": "≱",
    "≲": "≴",
    "≳": "≵",
    "≶": "≸",
    "≷": "≹",
    "≺": "⊀",
    "≻": "⊁",
    "⊂": "⊄",
    "⊃": "⊅",
    "⊆": "⊈",
    "⊇": "⊉",
    "⊢": "⊬",
    "⊨": "⊭",
    "⊩": "⊮",
    "⊫": "⊯",
    "≼": "⋠",
    "≽": "⋡",
    "⊑": "⋢",
    "⊒": "⋣",
    "⊲": "⋪",
    "⊳": "⋫",
    "⊴": "⋬",
    "⊵": "⋭",
    "∃": "∄"
  }), st;
}
var Jt;
function Te() {
  if (Jt) return Z;
  Jt = 1;
  var M = Z && Z.__extends || /* @__PURE__ */ (function() {
    var C = function(t, u) {
      return C = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, s) {
        o.__proto__ = s;
      } || function(o, s) {
        for (var l in s) Object.prototype.hasOwnProperty.call(s, l) && (o[l] = s[l]);
      }, C(t, u);
    };
    return function(t, u) {
      if (typeof u != "function" && u !== null)
        throw new TypeError("Class extends value " + String(u) + " is not a constructor or null");
      C(t, u);
      function o() {
        this.constructor = t;
      }
      t.prototype = u === null ? Object.create(u) : (o.prototype = u.prototype, new o());
    };
  })(), _ = Z && Z.__createBinding || (Object.create ? (function(C, t, u, o) {
    o === void 0 && (o = u);
    var s = Object.getOwnPropertyDescriptor(t, u);
    (!s || ("get" in s ? !t.__esModule : s.writable || s.configurable)) && (s = { enumerable: !0, get: function() {
      return t[u];
    } }), Object.defineProperty(C, o, s);
  }) : (function(C, t, u, o) {
    o === void 0 && (o = u), C[o] = t[u];
  })), X = Z && Z.__setModuleDefault || (Object.create ? (function(C, t) {
    Object.defineProperty(C, "default", { enumerable: !0, value: t });
  }) : function(C, t) {
    C.default = t;
  }), j = Z && Z.__importStar || function(C) {
    if (C && C.__esModule) return C;
    var t = {};
    if (C != null) for (var u in C) u !== "default" && Object.prototype.hasOwnProperty.call(C, u) && _(t, C, u);
    return X(t, C), t;
  }, E = Z && Z.__values || function(C) {
    var t = typeof Symbol == "function" && Symbol.iterator, u = t && C[t], o = 0;
    if (u) return u.call(C);
    if (C && typeof C.length == "number") return {
      next: function() {
        return C && o >= C.length && (C = void 0), { value: C && C[o++], done: !C };
      }
    };
    throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, m = Z && Z.__importDefault || function(C) {
    return C && C.__esModule ? C : { default: C };
  }, d;
  Object.defineProperty(Z, "__esModule", { value: !0 }), Z.BaseConfiguration = Z.BaseTags = Z.Other = void 0;
  var c = he(), h = Pt(), e = m(St()), r = m(pt()), n = re(), a = j(ne()), i = xt();
  ve();
  var v = se();
  new n.CharacterMap("remap", null, {
    "-": "−",
    "*": "∗",
    "`": "‘"
  });
  function p(C, t) {
    var u = C.stack.env.font, o = u ? { mathvariant: C.stack.env.font } : {}, s = h.MapHandler.getMap("remap").lookup(t), l = (0, v.getRange)(t), O = l ? l[3] : "mo", k = C.create("token", O, o, s ? s.char : t);
    l[4] && k.attributes.set("mathvariant", l[4]), O === "mo" && (r.default.setProperty(k, "fixStretchy", !0), C.configuration.addNode("fixStretchy", k)), C.Push(k);
  }
  Z.Other = p;
  function y(C, t) {
    throw new e.default("UndefinedControlSequence", "Undefined control sequence %1", "\\" + t);
  }
  function f(C, t) {
    throw new e.default("UnknownEnv", "Unknown environment '%1'", t);
  }
  function A(C) {
    var t, u, o = C.data;
    try {
      for (var s = E(o.getList("nonscript")), l = s.next(); !l.done; l = s.next()) {
        var O = l.value;
        if (O.attributes.get("scriptlevel") > 0) {
          var k = O.parent;
          if (k.childNodes.splice(k.childIndex(O), 1), o.removeFromList(O.kind, [O]), O.isKind("mrow")) {
            var N = O.childNodes[0];
            o.removeFromList("mstyle", [N]), o.removeFromList("mspace", N.childNodes[0].childNodes);
          }
        } else O.isKind("mrow") && (O.parent.replaceChild(O.childNodes[0], O), o.removeFromList("mrow", [O]));
      }
    } catch (I) {
      t = { error: I };
    } finally {
      try {
        l && !l.done && (u = s.return) && u.call(s);
      } finally {
        if (t) throw t.error;
      }
    }
  }
  var x = (function(C) {
    M(t, C);
    function t() {
      return C !== null && C.apply(this, arguments) || this;
    }
    return t;
  })(i.AbstractTags);
  return Z.BaseTags = x, Z.BaseConfiguration = c.Configuration.create("base", {
    handler: {
      character: ["command", "special", "letter", "digit"],
      delimiter: ["delimiter"],
      macro: ["delimiter", "macros", "mathchar0mi", "mathchar0mo", "mathchar7"],
      environment: ["environment"]
    },
    fallback: {
      character: p,
      macro: y,
      environment: f
    },
    items: (d = {}, d[a.StartItem.prototype.kind] = a.StartItem, d[a.StopItem.prototype.kind] = a.StopItem, d[a.OpenItem.prototype.kind] = a.OpenItem, d[a.CloseItem.prototype.kind] = a.CloseItem, d[a.PrimeItem.prototype.kind] = a.PrimeItem, d[a.SubsupItem.prototype.kind] = a.SubsupItem, d[a.OverItem.prototype.kind] = a.OverItem, d[a.LeftItem.prototype.kind] = a.LeftItem, d[a.Middle.prototype.kind] = a.Middle, d[a.RightItem.prototype.kind] = a.RightItem, d[a.BeginItem.prototype.kind] = a.BeginItem, d[a.EndItem.prototype.kind] = a.EndItem, d[a.StyleItem.prototype.kind] = a.StyleItem, d[a.PositionItem.prototype.kind] = a.PositionItem, d[a.CellItem.prototype.kind] = a.CellItem, d[a.MmlItem.prototype.kind] = a.MmlItem, d[a.FnItem.prototype.kind] = a.FnItem, d[a.NotItem.prototype.kind] = a.NotItem, d[a.NonscriptItem.prototype.kind] = a.NonscriptItem, d[a.DotsItem.prototype.kind] = a.DotsItem, d[a.ArrayItem.prototype.kind] = a.ArrayItem, d[a.EqnArrayItem.prototype.kind] = a.EqnArrayItem, d[a.EquationItem.prototype.kind] = a.EquationItem, d),
    options: {
      maxMacros: 1e3,
      baseURL: typeof document > "u" || document.getElementsByTagName("base").length === 0 ? "" : String(document.location).replace(/#.*$/, "")
    },
    tags: {
      base: x
    },
    postprocessors: [[A, -4]]
  }), Z;
}
export {
  Et as a,
  St as b,
  Ce as c,
  xt as d,
  he as e,
  Te as f,
  re as g,
  pe as h,
  ne as i,
  Ct as j,
  It as k,
  me as l,
  de as m,
  fe as n,
  ee as o,
  le as p,
  pt as r
};
