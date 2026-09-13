import { g as dn } from "./PrioritizedList-TjDg4i-s.js";
import { e as R, a as rt, g as F, h as st, i as jt, j as V, r as W, b as U, k as tt, l as St, m as me, d as _e, f as Qr, n as Kr, o as ye, p as mn, c as hn } from "./BaseConfiguration-iE_YypNt.js";
import { a as bt } from "./Factory--zguTNZ7.js";
import { r as Se } from "./lengths-DNFHULBn.js";
import { r as he } from "./Options-BStFr0zv.js";
import { a as vn } from "./mathjax-CnUrFnFS.js";
import { r as pn } from "./Entities-XwxJEcR3.js";
function gn(v, C) {
  for (var g = 0; g < C.length; g++) {
    const y = C[g];
    if (typeof y != "string" && !Array.isArray(y)) {
      for (const t in y)
        if (t !== "default" && !(t in v)) {
          const e = Object.getOwnPropertyDescriptor(y, t);
          e && Object.defineProperty(v, t, e.get ? e : {
            enumerable: !0,
            get: () => y[t]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(v, Symbol.toStringTag, { value: "Module" }));
}
var Lt = {}, $t = {}, Ie;
function _n() {
  return Ie || (Ie = 1, (function(v) {
    var C = $t && $t.__importDefault || function(n) {
      return n && n.__esModule ? n : { default: n };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.ActionConfiguration = v.ActionMethods = void 0;
    var g = R(), y = C(rt()), t = F(), e = C(st());
    v.ActionMethods = {}, v.ActionMethods.Macro = e.default.Macro, v.ActionMethods.Toggle = function(n, u) {
      for (var l = [], c; (c = n.GetArgument(u)) !== "\\endtoggle"; )
        l.push(new y.default(c, n.stack.env, n.configuration).mml());
      n.Push(n.create("node", "maction", l, { actiontype: "toggle" }));
    }, v.ActionMethods.Mathtip = function(n, u) {
      var l = n.ParseArg(u), c = n.ParseArg(u);
      n.Push(n.create("node", "maction", [l, c], { actiontype: "tooltip" }));
    }, new t.CommandMap("action-macros", {
      toggle: "Toggle",
      mathtip: "Mathtip",
      texttip: ["Macro", "\\mathtip{#1}{\\text{#2}}", 2]
    }, v.ActionMethods), v.ActionConfiguration = g.Configuration.create("action", { handler: { macro: ["action-macros"] } });
  })($t)), $t;
}
var dt = {}, Z = {}, je;
function Wr() {
  if (je) return Z;
  je = 1;
  var v = Z && Z.__extends || /* @__PURE__ */ (function() {
    var a = function(f, o) {
      return a = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, i) {
        h.__proto__ = i;
      } || function(h, i) {
        for (var d in i) Object.prototype.hasOwnProperty.call(i, d) && (h[d] = i[d]);
      }, a(f, o);
    };
    return function(f, o) {
      if (typeof o != "function" && o !== null)
        throw new TypeError("Class extends value " + String(o) + " is not a constructor or null");
      a(f, o);
      function h() {
        this.constructor = f;
      }
      f.prototype = o === null ? Object.create(o) : (h.prototype = o.prototype, new h());
    };
  })(), C = Z && Z.__assign || function() {
    return C = Object.assign || function(a) {
      for (var f, o = 1, h = arguments.length; o < h; o++) {
        f = arguments[o];
        for (var i in f) Object.prototype.hasOwnProperty.call(f, i) && (a[i] = f[i]);
      }
      return a;
    }, C.apply(this, arguments);
  }, g = Z && Z.__importDefault || function(a) {
    return a && a.__esModule ? a : { default: a };
  };
  Object.defineProperty(Z, "__esModule", { value: !0 }), Z.FlalignItem = Z.MultlineItem = void 0;
  var y = jt(), t = g(V()), e = g(W()), n = g(U()), u = tt(), l = (function(a) {
    v(f, a);
    function f(o) {
      for (var h = [], i = 1; i < arguments.length; i++)
        h[i - 1] = arguments[i];
      var d = a.call(this, o) || this;
      return d.factory.configuration.tags.start("multline", !0, h[0]), d;
    }
    return Object.defineProperty(f.prototype, "kind", {
      get: function() {
        return "multline";
      },
      enumerable: !1,
      configurable: !0
    }), f.prototype.EndEntry = function() {
      this.table.length && t.default.fixInitialMO(this.factory.configuration, this.nodes);
      var o = this.getProperty("shove"), h = this.create("node", "mtd", this.nodes, o ? { columnalign: o } : {});
      this.setProperty("shove", null), this.row.push(h), this.Clear();
    }, f.prototype.EndRow = function() {
      if (this.row.length !== 1)
        throw new n.default("MultlineRowsOneCol", "The rows within the %1 environment must have exactly one column", "multline");
      var o = this.create("node", "mtr", this.row);
      this.table.push(o), this.row = [];
    }, f.prototype.EndTable = function() {
      if (a.prototype.EndTable.call(this), this.table.length) {
        var o = this.table.length - 1, h = -1;
        e.default.getAttribute(e.default.getChildren(this.table[0])[0], "columnalign") || e.default.setAttribute(e.default.getChildren(this.table[0])[0], "columnalign", u.TexConstant.Align.LEFT), e.default.getAttribute(e.default.getChildren(this.table[o])[0], "columnalign") || e.default.setAttribute(e.default.getChildren(this.table[o])[0], "columnalign", u.TexConstant.Align.RIGHT);
        var i = this.factory.configuration.tags.getTag();
        if (i) {
          h = this.arraydef.side === u.TexConstant.Align.LEFT ? 0 : this.table.length - 1;
          var d = this.table[h], p = this.create("node", "mlabeledtr", [i].concat(e.default.getChildren(d)));
          e.default.copyAttributes(d, p), this.table[h] = p;
        }
      }
      this.factory.configuration.tags.end();
    }, f;
  })(y.ArrayItem);
  Z.MultlineItem = l;
  var c = (function(a) {
    v(f, a);
    function f(o, h, i, d, p) {
      var r = a.call(this, o) || this;
      return r.name = h, r.numbered = i, r.padded = d, r.center = p, r.factory.configuration.tags.start(h, i, i), r;
    }
    return Object.defineProperty(f.prototype, "kind", {
      get: function() {
        return "flalign";
      },
      enumerable: !1,
      configurable: !0
    }), f.prototype.EndEntry = function() {
      a.prototype.EndEntry.call(this);
      var o = this.getProperty("xalignat");
      if (o && this.row.length > o)
        throw new n.default("XalignOverflow", "Extra %1 in row of %2", "&", this.name);
    }, f.prototype.EndRow = function() {
      for (var o, h = this.row, i = this.getProperty("xalignat"); h.length < i; )
        h.push(this.create("node", "mtd"));
      for (this.row = [], this.padded && this.row.push(this.create("node", "mtd")); o = h.shift(); )
        this.row.push(o), o = h.shift(), o && this.row.push(o), (h.length || this.padded) && this.row.push(this.create("node", "mtd"));
      this.row.length > this.maxrow && (this.maxrow = this.row.length), a.prototype.EndRow.call(this);
      var d = this.table[this.table.length - 1];
      if (this.getProperty("zeroWidthLabel") && d.isKind("mlabeledtr")) {
        var p = e.default.getChildren(d)[0], r = this.factory.configuration.options.tagSide, m = C({ width: 0 }, r === "right" ? { lspace: "-1width" } : {}), _ = this.create("node", "mpadded", e.default.getChildren(p), m);
        p.setChildren([_]);
      }
    }, f.prototype.EndTable = function() {
      if (a.prototype.EndTable.call(this), this.center && this.maxrow <= 2) {
        var o = this.arraydef;
        delete o.width, delete this.global.indentalign;
      }
    }, f;
  })(y.EqnArrayItem);
  return Z.FlalignItem = c, Z;
}
var mt = {}, Ne;
function ve() {
  return Ne || (Ne = 1, (function(v) {
    var C = mt && mt.__assign || function() {
      return C = Object.assign || function(d) {
        for (var p, r = 1, m = arguments.length; r < m; r++) {
          p = arguments[r];
          for (var _ in p) Object.prototype.hasOwnProperty.call(p, _) && (d[_] = p[_]);
        }
        return d;
      }, C.apply(this, arguments);
    }, g = mt && mt.__read || function(d, p) {
      var r = typeof Symbol == "function" && d[Symbol.iterator];
      if (!r) return d;
      var m = r.call(d), _, x = [], A;
      try {
        for (; (p === void 0 || p-- > 0) && !(_ = m.next()).done; ) x.push(_.value);
      } catch (s) {
        A = { error: s };
      } finally {
        try {
          _ && !_.done && (r = m.return) && r.call(m);
        } finally {
          if (A) throw A.error;
        }
      }
      return x;
    }, y = mt && mt.__importDefault || function(d) {
      return d && d.__esModule ? d : { default: d };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.NEW_OPS = v.AmsMethods = void 0;
    var t = y(V()), e = y(St()), n = y(W()), u = tt(), l = y(rt()), c = y(U()), a = me(), f = y(st()), o = bt();
    v.AmsMethods = {}, v.AmsMethods.AmsEqnArray = function(d, p, r, m, _, x, A) {
      var s = d.GetBrackets("\\begin{" + p.getName() + "}"), M = f.default.EqnArray(d, p, r, m, _, x, A);
      return t.default.setArrayAlign(M, s);
    }, v.AmsMethods.AlignAt = function(d, p, r, m) {
      var _ = p.getName(), x, A, s = "", M = [];
      if (m || (A = d.GetBrackets("\\begin{" + _ + "}")), x = d.GetArgument("\\begin{" + _ + "}"), x.match(/[^0-9]/))
        throw new c.default("PositiveIntegerArg", "Argument to %1 must me a positive integer", "\\begin{" + _ + "}");
      for (var w = parseInt(x, 10); w > 0; )
        s += "rl", M.push("0em 0em"), w--;
      var b = M.join(" ");
      if (m)
        return v.AmsMethods.EqnArray(d, p, r, m, s, b);
      var P = v.AmsMethods.EqnArray(d, p, r, m, s, b);
      return t.default.setArrayAlign(P, A);
    }, v.AmsMethods.Multline = function(d, p, r) {
      d.Push(p), t.default.checkEqnEnv(d);
      var m = d.itemFactory.create("multline", r, d.stack);
      return m.arraydef = {
        displaystyle: !0,
        rowspacing: ".5em",
        columnspacing: "100%",
        width: d.options.ams.multlineWidth,
        side: d.options.tagSide,
        minlabelspacing: d.options.tagIndent,
        framespacing: d.options.ams.multlineIndent + " 0",
        frame: "",
        "data-width-includes-label": !0
      }, m;
    }, v.AmsMethods.XalignAt = function(d, p, r, m) {
      var _ = d.GetArgument("\\begin{" + p.getName() + "}");
      if (_.match(/[^0-9]/))
        throw new c.default("PositiveIntegerArg", "Argument to %1 must me a positive integer", "\\begin{" + p.getName() + "}");
      var x = m ? "crl" : "rlc", A = m ? "fit auto auto" : "auto auto fit", s = v.AmsMethods.FlalignArray(d, p, r, m, !1, x, A, !0);
      return s.setProperty("xalignat", 2 * parseInt(_)), s;
    }, v.AmsMethods.FlalignArray = function(d, p, r, m, _, x, A, s) {
      s === void 0 && (s = !1), d.Push(p), t.default.checkEqnEnv(d), x = x.split("").join(" ").replace(/r/g, "right").replace(/l/g, "left").replace(/c/g, "center");
      var M = d.itemFactory.create("flalign", p.getName(), r, m, _, d.stack);
      return M.arraydef = {
        width: "100%",
        displaystyle: !0,
        columnalign: x,
        columnspacing: "0em",
        columnwidth: A,
        rowspacing: "3pt",
        side: d.options.tagSide,
        minlabelspacing: s ? "0" : d.options.tagIndent,
        "data-width-includes-label": !0
      }, M.setProperty("zeroWidthLabel", s), M;
    }, v.NEW_OPS = "ams-declare-ops", v.AmsMethods.HandleDeclareOp = function(d, p) {
      var r = d.GetStar() ? "*" : "", m = t.default.trimSpaces(d.GetArgument(p));
      m.charAt(0) === "\\" && (m = m.substr(1));
      var _ = d.GetArgument(p);
      d.configuration.handlers.retrieve(v.NEW_OPS).add(m, new a.Macro(m, v.AmsMethods.Macro, ["\\operatorname".concat(r, "{").concat(_, "}")]));
    }, v.AmsMethods.HandleOperatorName = function(d, p) {
      var r = d.GetStar(), m = t.default.trimSpaces(d.GetArgument(p)), _ = new l.default(m, C(C({}, d.stack.env), { font: u.TexConstant.Variant.NORMAL, multiLetterIdentifiers: /^[-*a-z]+/i, operatorLetters: !0 }), d.configuration).mml();
      if (_.isKind("mi") || (_ = d.create("node", "TeXAtom", [_])), n.default.setProperties(_, { movesupsub: r, movablelimits: !0, texClass: o.TEXCLASS.OP }), !r) {
        var x = d.GetNext(), A = d.i;
        x === "\\" && ++d.i && d.GetCS() !== "limits" && (d.i = A);
      }
      d.Push(_);
    }, v.AmsMethods.SideSet = function(d, p) {
      var r = g(h(d.ParseArg(p)), 2), m = r[0], _ = r[1], x = g(h(d.ParseArg(p)), 2), A = x[0], s = x[1], M = d.ParseArg(p), w = M;
      m && (_ ? m.replaceChild(d.create("node", "mphantom", [
        d.create("node", "mpadded", [t.default.copyNode(M, d)], { width: 0 })
      ]), n.default.getChildAt(m, 0)) : (w = d.create("node", "mmultiscripts", [M]), A && n.default.appendChildren(w, [
        n.default.getChildAt(A, 1) || d.create("node", "none"),
        n.default.getChildAt(A, 2) || d.create("node", "none")
      ]), n.default.setProperty(w, "scriptalign", "left"), n.default.appendChildren(w, [
        d.create("node", "mprescripts"),
        n.default.getChildAt(m, 1) || d.create("node", "none"),
        n.default.getChildAt(m, 2) || d.create("node", "none")
      ]))), A && w === M && (A.replaceChild(M, n.default.getChildAt(A, 0)), w = A);
      var b = d.create("node", "TeXAtom", [], { texClass: o.TEXCLASS.OP, movesupsub: !0, movablelimits: !0 });
      _ && (m && b.appendChild(m), b.appendChild(_)), b.appendChild(w), s && b.appendChild(s), d.Push(b);
    };
    function h(d) {
      if (!d || d.isInferred && d.childNodes.length === 0)
        return [null, null];
      if (d.isKind("msubsup") && i(d))
        return [d, null];
      var p = n.default.getChildAt(d, 0);
      return d.isInferred && p && i(p) ? (d.childNodes.splice(0, 1), [p, d]) : [null, d];
    }
    function i(d) {
      var p = d.childNodes[0];
      return p && p.isKind("mi") && p.getText() === "";
    }
    v.AmsMethods.operatorLetter = function(d, p) {
      return d.stack.env.operatorLetters ? e.default.variable(d, p) : !1;
    }, v.AmsMethods.MultiIntegral = function(d, p, r) {
      var m = d.GetNext();
      if (m === "\\") {
        var _ = d.i;
        m = d.GetArgument(p), d.i = _, m === "\\limits" && (p === "\\idotsint" ? r = "\\!\\!\\mathop{\\,\\," + r + "}" : r = "\\!\\!\\!\\mathop{\\,\\,\\," + r + "}");
      }
      d.string = r + " " + d.string.slice(d.i), d.i = 0;
    }, v.AmsMethods.xArrow = function(d, p, r, m, _) {
      var x = { width: "+" + t.default.Em((m + _) / 18), lspace: t.default.Em(m / 18) }, A = d.GetBrackets(p), s = d.ParseArg(p), M = d.create("node", "mspace", [], { depth: ".25em" }), w = d.create("token", "mo", { stretchy: !0, texClass: o.TEXCLASS.REL }, String.fromCodePoint(r));
      w = d.create("node", "mstyle", [w], { scriptlevel: 0 });
      var b = d.create("node", "munderover", [w]), P = d.create("node", "mpadded", [s, M], x);
      if (n.default.setAttribute(P, "voffset", "-.2em"), n.default.setAttribute(P, "height", "-.2em"), n.default.setChild(b, b.over, P), A) {
        var T = new l.default(A, d.stack.env, d.configuration).mml(), q = d.create("node", "mspace", [], { height: ".75em" });
        P = d.create("node", "mpadded", [T, q], x), n.default.setAttribute(P, "voffset", ".15em"), n.default.setAttribute(P, "depth", "-.15em"), n.default.setChild(b, b.under, P);
      }
      n.default.setProperty(b, "subsupOK", !0), d.Push(b);
    }, v.AmsMethods.HandleShove = function(d, p, r) {
      var m = d.stack.Top();
      if (m.kind !== "multline")
        throw new c.default("CommandOnlyAllowedInEnv", "%1 only allowed in %2 environment", d.currentCS, "multline");
      if (m.Size())
        throw new c.default("CommandAtTheBeginingOfLine", "%1 must come at the beginning of the line", d.currentCS);
      m.setProperty("shove", r);
    }, v.AmsMethods.CFrac = function(d, p) {
      var r = t.default.trimSpaces(d.GetBrackets(p, "")), m = d.GetArgument(p), _ = d.GetArgument(p), x = {
        l: u.TexConstant.Align.LEFT,
        r: u.TexConstant.Align.RIGHT,
        "": ""
      }, A = new l.default("\\strut\\textstyle{" + m + "}", d.stack.env, d.configuration).mml(), s = new l.default("\\strut\\textstyle{" + _ + "}", d.stack.env, d.configuration).mml(), M = d.create("node", "mfrac", [A, s]);
      if (r = x[r], r == null)
        throw new c.default("IllegalAlign", "Illegal alignment specified in %1", d.currentCS);
      r && n.default.setProperties(M, { numalign: r, denomalign: r }), d.Push(M);
    }, v.AmsMethods.Genfrac = function(d, p, r, m, _, x) {
      r == null && (r = d.GetDelimiterArg(p)), m == null && (m = d.GetDelimiterArg(p)), _ == null && (_ = d.GetArgument(p)), x == null && (x = t.default.trimSpaces(d.GetArgument(p)));
      var A = d.ParseArg(p), s = d.ParseArg(p), M = d.create("node", "mfrac", [A, s]);
      if (_ !== "" && n.default.setAttribute(M, "linethickness", _), (r || m) && (n.default.setProperty(M, "withDelims", !0), M = t.default.fixedFence(d.configuration, r, M, m)), x !== "") {
        var w = parseInt(x, 10), b = ["D", "T", "S", "SS"][w];
        if (b == null)
          throw new c.default("BadMathStyleFor", "Bad math style for %1", d.currentCS);
        M = d.create("node", "mstyle", [M]), b === "D" ? n.default.setProperties(M, { displaystyle: !0, scriptlevel: 0 }) : n.default.setProperties(M, {
          displaystyle: !1,
          scriptlevel: w - 1
        });
      }
      d.Push(M);
    }, v.AmsMethods.HandleTag = function(d, p) {
      if (!d.tags.currentTag.taggable && d.tags.env)
        throw new c.default("CommandNotAllowedInEnv", "%1 not allowed in %2 environment", d.currentCS, d.tags.env);
      if (d.tags.currentTag.tag)
        throw new c.default("MultipleCommand", "Multiple %1", d.currentCS);
      var r = d.GetStar(), m = t.default.trimSpaces(d.GetArgument(p));
      d.tags.tag(m, r);
    }, v.AmsMethods.HandleNoTag = f.default.HandleNoTag, v.AmsMethods.HandleRef = f.default.HandleRef, v.AmsMethods.Macro = f.default.Macro, v.AmsMethods.Accent = f.default.Accent, v.AmsMethods.Tilde = f.default.Tilde, v.AmsMethods.Array = f.default.Array, v.AmsMethods.Spacer = f.default.Spacer, v.AmsMethods.NamedOp = f.default.NamedOp, v.AmsMethods.EqnArray = f.default.EqnArray, v.AmsMethods.Equation = f.default.Equation;
  })(mt)), mt;
}
var nt = {}, Ge;
function yn() {
  if (Ge) return nt;
  Ge = 1;
  var v = nt && nt.__createBinding || (Object.create ? (function(f, o, h, i) {
    i === void 0 && (i = h);
    var d = Object.getOwnPropertyDescriptor(o, h);
    (!d || ("get" in d ? !o.__esModule : d.writable || d.configurable)) && (d = { enumerable: !0, get: function() {
      return o[h];
    } }), Object.defineProperty(f, i, d);
  }) : (function(f, o, h, i) {
    i === void 0 && (i = h), f[i] = o[h];
  })), C = nt && nt.__setModuleDefault || (Object.create ? (function(f, o) {
    Object.defineProperty(f, "default", { enumerable: !0, value: o });
  }) : function(f, o) {
    f.default = o;
  }), g = nt && nt.__importStar || function(f) {
    if (f && f.__esModule) return f;
    var o = {};
    if (f != null) for (var h in f) h !== "default" && Object.prototype.hasOwnProperty.call(f, h) && v(o, f, h);
    return C(o, f), o;
  }, y = nt && nt.__importDefault || function(f) {
    return f && f.__esModule ? f : { default: f };
  };
  Object.defineProperty(nt, "__esModule", { value: !0 });
  var t = ve(), e = g(F()), n = tt(), u = y(St()), l = y(V()), c = bt(), a = Se();
  return new e.CharacterMap("AMSmath-mathchar0mo", u.default.mathchar0mo, {
    iiiint: ["⨌", { texClass: c.TEXCLASS.OP }]
  }), new e.RegExpMap("AMSmath-operatorLetter", t.AmsMethods.operatorLetter, /[-*]/i), new e.CommandMap("AMSmath-macros", {
    mathring: ["Accent", "02DA"],
    nobreakspace: "Tilde",
    negmedspace: ["Spacer", a.MATHSPACE.negativemediummathspace],
    negthickspace: ["Spacer", a.MATHSPACE.negativethickmathspace],
    idotsint: ["MultiIntegral", "\\int\\cdots\\int"],
    dddot: ["Accent", "20DB"],
    ddddot: ["Accent", "20DC"],
    sideset: "SideSet",
    boxed: ["Macro", "\\fbox{$\\displaystyle{#1}$}", 1],
    tag: "HandleTag",
    notag: "HandleNoTag",
    eqref: ["HandleRef", !0],
    substack: ["Macro", "\\begin{subarray}{c}#1\\end{subarray}", 1],
    injlim: ["NamedOp", "inj&thinsp;lim"],
    projlim: ["NamedOp", "proj&thinsp;lim"],
    varliminf: ["Macro", "\\mathop{\\underline{\\mmlToken{mi}{lim}}}"],
    varlimsup: ["Macro", "\\mathop{\\overline{\\mmlToken{mi}{lim}}}"],
    varinjlim: ["Macro", "\\mathop{\\underrightarrow{\\mmlToken{mi}{lim}}}"],
    varprojlim: ["Macro", "\\mathop{\\underleftarrow{\\mmlToken{mi}{lim}}}"],
    DeclareMathOperator: "HandleDeclareOp",
    operatorname: "HandleOperatorName",
    genfrac: "Genfrac",
    frac: ["Genfrac", "", "", "", ""],
    tfrac: ["Genfrac", "", "", "", "1"],
    dfrac: ["Genfrac", "", "", "", "0"],
    binom: ["Genfrac", "(", ")", "0", ""],
    tbinom: ["Genfrac", "(", ")", "0", "1"],
    dbinom: ["Genfrac", "(", ")", "0", "0"],
    cfrac: "CFrac",
    shoveleft: ["HandleShove", n.TexConstant.Align.LEFT],
    shoveright: ["HandleShove", n.TexConstant.Align.RIGHT],
    xrightarrow: ["xArrow", 8594, 5, 10],
    xleftarrow: ["xArrow", 8592, 10, 5]
  }, t.AmsMethods), new e.EnvironmentMap("AMSmath-environment", u.default.environment, {
    "equation*": ["Equation", null, !1],
    "eqnarray*": [
      "EqnArray",
      null,
      !1,
      !0,
      "rcl",
      l.default.cols(0, a.MATHSPACE.thickmathspace),
      ".5em"
    ],
    align: ["EqnArray", null, !0, !0, "rl", l.default.cols(0, 2)],
    "align*": ["EqnArray", null, !1, !0, "rl", l.default.cols(0, 2)],
    multline: ["Multline", null, !0],
    "multline*": ["Multline", null, !1],
    split: ["EqnArray", null, !1, !1, "rl", l.default.cols(0)],
    gather: ["EqnArray", null, !0, !0, "c"],
    "gather*": ["EqnArray", null, !1, !0, "c"],
    alignat: ["AlignAt", null, !0, !0],
    "alignat*": ["AlignAt", null, !1, !0],
    alignedat: ["AlignAt", null, !1, !1],
    aligned: ["AmsEqnArray", null, null, null, "rl", l.default.cols(0, 2), ".5em", "D"],
    gathered: ["AmsEqnArray", null, null, null, "c", null, ".5em", "D"],
    xalignat: ["XalignAt", null, !0, !0],
    "xalignat*": ["XalignAt", null, !1, !0],
    xxalignat: ["XalignAt", null, !1, !1],
    flalign: ["FlalignArray", null, !0, !1, !0, "rlc", "auto auto fit"],
    "flalign*": ["FlalignArray", null, !1, !1, !0, "rlc", "auto auto fit"],
    subarray: ["Array", null, null, null, null, l.default.cols(0), "0.1em", "S", 1],
    smallmatrix: [
      "Array",
      null,
      null,
      null,
      "c",
      l.default.cols(1 / 3),
      ".2em",
      "S",
      1
    ],
    matrix: ["Array", null, null, null, "c"],
    pmatrix: ["Array", null, "(", ")", "c"],
    bmatrix: ["Array", null, "[", "]", "c"],
    Bmatrix: ["Array", null, "\\{", "\\}", "c"],
    vmatrix: ["Array", null, "\\vert", "\\vert", "c"],
    Vmatrix: ["Array", null, "\\Vert", "\\Vert", "c"],
    cases: ["Array", null, "\\{", ".", "ll", null, ".2em", "T"]
  }, t.AmsMethods), new e.DelimiterMap("AMSmath-delimiter", u.default.delimiter, {
    "\\lvert": ["|", { texClass: c.TEXCLASS.OPEN }],
    "\\rvert": ["|", { texClass: c.TEXCLASS.CLOSE }],
    "\\lVert": ["‖", { texClass: c.TEXCLASS.OPEN }],
    "\\rVert": ["‖", { texClass: c.TEXCLASS.CLOSE }]
  }), new e.CharacterMap("AMSsymbols-mathchar0mi", u.default.mathchar0mi, {
    digamma: "ϝ",
    varkappa: "ϰ",
    varGamma: ["Γ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varDelta: ["Δ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varTheta: ["Θ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varLambda: ["Λ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varXi: ["Ξ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varPi: ["Π", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varSigma: ["Σ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varUpsilon: ["Υ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varPhi: ["Φ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varPsi: ["Ψ", { mathvariant: n.TexConstant.Variant.ITALIC }],
    varOmega: ["Ω", { mathvariant: n.TexConstant.Variant.ITALIC }],
    beth: "ℶ",
    gimel: "ℷ",
    daleth: "ℸ",
    backprime: ["‵", { variantForm: !0 }],
    hslash: "ℏ",
    varnothing: ["∅", { variantForm: !0 }],
    blacktriangle: "▴",
    triangledown: ["▽", { variantForm: !0 }],
    blacktriangledown: "▾",
    square: "◻",
    Box: "◻",
    blacksquare: "◼",
    lozenge: "◊",
    Diamond: "◊",
    blacklozenge: "⧫",
    circledS: ["Ⓢ", { mathvariant: n.TexConstant.Variant.NORMAL }],
    bigstar: "★",
    sphericalangle: "∢",
    measuredangle: "∡",
    nexists: "∄",
    complement: "∁",
    mho: "℧",
    eth: ["ð", { mathvariant: n.TexConstant.Variant.NORMAL }],
    Finv: "Ⅎ",
    diagup: "╱",
    Game: "⅁",
    diagdown: "╲",
    Bbbk: [
      "k",
      { mathvariant: n.TexConstant.Variant.DOUBLESTRUCK }
    ],
    yen: "¥",
    circledR: "®",
    checkmark: "✓",
    maltese: "✠"
  }), new e.CharacterMap("AMSsymbols-mathchar0mo", u.default.mathchar0mo, {
    dotplus: "∔",
    ltimes: "⋉",
    smallsetminus: ["∖", { variantForm: !0 }],
    rtimes: "⋊",
    Cap: "⋒",
    doublecap: "⋒",
    leftthreetimes: "⋋",
    Cup: "⋓",
    doublecup: "⋓",
    rightthreetimes: "⋌",
    barwedge: "⊼",
    curlywedge: "⋏",
    veebar: "⊻",
    curlyvee: "⋎",
    doublebarwedge: "⩞",
    boxminus: "⊟",
    circleddash: "⊝",
    boxtimes: "⊠",
    circledast: "⊛",
    boxdot: "⊡",
    circledcirc: "⊚",
    boxplus: "⊞",
    centerdot: ["⋅", { variantForm: !0 }],
    divideontimes: "⋇",
    intercal: "⊺",
    leqq: "≦",
    geqq: "≧",
    leqslant: "⩽",
    geqslant: "⩾",
    eqslantless: "⪕",
    eqslantgtr: "⪖",
    lesssim: "≲",
    gtrsim: "≳",
    lessapprox: "⪅",
    gtrapprox: "⪆",
    approxeq: "≊",
    lessdot: "⋖",
    gtrdot: "⋗",
    lll: "⋘",
    llless: "⋘",
    ggg: "⋙",
    gggtr: "⋙",
    lessgtr: "≶",
    gtrless: "≷",
    lesseqgtr: "⋚",
    gtreqless: "⋛",
    lesseqqgtr: "⪋",
    gtreqqless: "⪌",
    doteqdot: "≑",
    Doteq: "≑",
    eqcirc: "≖",
    risingdotseq: "≓",
    circeq: "≗",
    fallingdotseq: "≒",
    triangleq: "≜",
    backsim: "∽",
    thicksim: ["∼", { variantForm: !0 }],
    backsimeq: "⋍",
    thickapprox: ["≈", { variantForm: !0 }],
    subseteqq: "⫅",
    supseteqq: "⫆",
    Subset: "⋐",
    Supset: "⋑",
    sqsubset: "⊏",
    sqsupset: "⊐",
    preccurlyeq: "≼",
    succcurlyeq: "≽",
    curlyeqprec: "⋞",
    curlyeqsucc: "⋟",
    precsim: "≾",
    succsim: "≿",
    precapprox: "⪷",
    succapprox: "⪸",
    vartriangleleft: "⊲",
    lhd: "⊲",
    vartriangleright: "⊳",
    rhd: "⊳",
    trianglelefteq: "⊴",
    unlhd: "⊴",
    trianglerighteq: "⊵",
    unrhd: "⊵",
    vDash: ["⊨", { variantForm: !0 }],
    Vdash: "⊩",
    Vvdash: "⊪",
    smallsmile: ["⌣", { variantForm: !0 }],
    shortmid: ["∣", { variantForm: !0 }],
    smallfrown: ["⌢", { variantForm: !0 }],
    shortparallel: ["∥", { variantForm: !0 }],
    bumpeq: "≏",
    between: "≬",
    Bumpeq: "≎",
    pitchfork: "⋔",
    varpropto: ["∝", { variantForm: !0 }],
    backepsilon: "∍",
    blacktriangleleft: "◂",
    blacktriangleright: "▸",
    therefore: "∴",
    because: "∵",
    eqsim: "≂",
    vartriangle: ["△", { variantForm: !0 }],
    Join: "⋈",
    nless: "≮",
    ngtr: "≯",
    nleq: "≰",
    ngeq: "≱",
    nleqslant: ["⪇", { variantForm: !0 }],
    ngeqslant: ["⪈", { variantForm: !0 }],
    nleqq: ["≰", { variantForm: !0 }],
    ngeqq: ["≱", { variantForm: !0 }],
    lneq: "⪇",
    gneq: "⪈",
    lneqq: "≨",
    gneqq: "≩",
    lvertneqq: ["≨", { variantForm: !0 }],
    gvertneqq: ["≩", { variantForm: !0 }],
    lnsim: "⋦",
    gnsim: "⋧",
    lnapprox: "⪉",
    gnapprox: "⪊",
    nprec: "⊀",
    nsucc: "⊁",
    npreceq: ["⋠", { variantForm: !0 }],
    nsucceq: ["⋡", { variantForm: !0 }],
    precneqq: "⪵",
    succneqq: "⪶",
    precnsim: "⋨",
    succnsim: "⋩",
    precnapprox: "⪹",
    succnapprox: "⪺",
    nsim: "≁",
    ncong: "≇",
    nshortmid: ["∤", { variantForm: !0 }],
    nshortparallel: ["∦", { variantForm: !0 }],
    nmid: "∤",
    nparallel: "∦",
    nvdash: "⊬",
    nvDash: "⊭",
    nVdash: "⊮",
    nVDash: "⊯",
    ntriangleleft: "⋪",
    ntriangleright: "⋫",
    ntrianglelefteq: "⋬",
    ntrianglerighteq: "⋭",
    nsubseteq: "⊈",
    nsupseteq: "⊉",
    nsubseteqq: ["⊈", { variantForm: !0 }],
    nsupseteqq: ["⊉", { variantForm: !0 }],
    subsetneq: "⊊",
    supsetneq: "⊋",
    varsubsetneq: ["⊊", { variantForm: !0 }],
    varsupsetneq: ["⊋", { variantForm: !0 }],
    subsetneqq: "⫋",
    supsetneqq: "⫌",
    varsubsetneqq: ["⫋", { variantForm: !0 }],
    varsupsetneqq: ["⫌", { variantForm: !0 }],
    leftleftarrows: "⇇",
    rightrightarrows: "⇉",
    leftrightarrows: "⇆",
    rightleftarrows: "⇄",
    Lleftarrow: "⇚",
    Rrightarrow: "⇛",
    twoheadleftarrow: "↞",
    twoheadrightarrow: "↠",
    leftarrowtail: "↢",
    rightarrowtail: "↣",
    looparrowleft: "↫",
    looparrowright: "↬",
    leftrightharpoons: "⇋",
    rightleftharpoons: ["⇌", { variantForm: !0 }],
    curvearrowleft: "↶",
    curvearrowright: "↷",
    circlearrowleft: "↺",
    circlearrowright: "↻",
    Lsh: "↰",
    Rsh: "↱",
    upuparrows: "⇈",
    downdownarrows: "⇊",
    upharpoonleft: "↿",
    upharpoonright: "↾",
    downharpoonleft: "⇃",
    restriction: "↾",
    multimap: "⊸",
    downharpoonright: "⇂",
    leftrightsquigarrow: "↭",
    rightsquigarrow: "⇝",
    leadsto: "⇝",
    dashrightarrow: "⇢",
    dashleftarrow: "⇠",
    nleftarrow: "↚",
    nrightarrow: "↛",
    nLeftarrow: "⇍",
    nRightarrow: "⇏",
    nleftrightarrow: "↮",
    nLeftrightarrow: "⇎"
  }), new e.DelimiterMap("AMSsymbols-delimiter", u.default.delimiter, {
    "\\ulcorner": "⌜",
    "\\urcorner": "⌝",
    "\\llcorner": "⌞",
    "\\lrcorner": "⌟"
  }), new e.CommandMap("AMSsymbols-macros", {
    implies: ["Macro", "\\;\\Longrightarrow\\;"],
    impliedby: ["Macro", "\\;\\Longleftarrow\\;"]
  }, t.AmsMethods), nt;
}
var Fe;
function Zr() {
  if (Fe) return dt;
  Fe = 1;
  var v = dt && dt.__extends || /* @__PURE__ */ (function() {
    var c = function(a, f) {
      return c = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(o, h) {
        o.__proto__ = h;
      } || function(o, h) {
        for (var i in h) Object.prototype.hasOwnProperty.call(h, i) && (o[i] = h[i]);
      }, c(a, f);
    };
    return function(a, f) {
      if (typeof f != "function" && f !== null)
        throw new TypeError("Class extends value " + String(f) + " is not a constructor or null");
      c(a, f);
      function o() {
        this.constructor = a;
      }
      a.prototype = f === null ? Object.create(f) : (o.prototype = f.prototype, new o());
    };
  })(), C;
  Object.defineProperty(dt, "__esModule", { value: !0 }), dt.AmsConfiguration = dt.AmsTags = void 0;
  var g = R(), y = Wr(), t = _e(), e = ve();
  yn();
  var n = F(), u = (function(c) {
    v(a, c);
    function a() {
      return c !== null && c.apply(this, arguments) || this;
    }
    return a;
  })(t.AbstractTags);
  dt.AmsTags = u;
  var l = function(c) {
    new n.CommandMap(e.NEW_OPS, {}, {}), c.append(g.Configuration.local({
      handler: { macro: [e.NEW_OPS] },
      priority: -1
    }));
  };
  return dt.AmsConfiguration = g.Configuration.create("ams", {
    handler: {
      character: ["AMSmath-operatorLetter"],
      delimiter: ["AMSsymbols-delimiter", "AMSmath-delimiter"],
      macro: [
        "AMSsymbols-mathchar0mi",
        "AMSsymbols-mathchar0mo",
        "AMSsymbols-delimiter",
        "AMSsymbols-macros",
        "AMSmath-mathchar0mo",
        "AMSmath-macros",
        "AMSmath-delimiter"
      ],
      environment: ["AMSmath-environment"]
    },
    items: (C = {}, C[y.MultlineItem.prototype.kind] = y.MultlineItem, C[y.FlalignItem.prototype.kind] = y.FlalignItem, C),
    tags: { ams: u },
    init: l,
    config: function(c, a) {
      a.parseOptions.options.multlineWidth && (a.parseOptions.options.ams.multlineWidth = a.parseOptions.options.multlineWidth), delete a.parseOptions.options.multlineWidth;
    },
    options: {
      multlineWidth: "",
      ams: {
        multlineWidth: "100%",
        multlineIndent: "1em"
      }
    }
  }), dt;
}
var Ut = {}, at = {}, Nt = {}, Re;
function xn() {
  if (Re) return Nt;
  Re = 1;
  var v = Nt && Nt.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(Nt, "__esModule", { value: !0 });
  var C = v(rt()), g = Qr(), y = bt(), t = v(W()), e = {};
  return e.CD = function(n, u) {
    n.Push(u);
    var l = n.itemFactory.create("array"), c = n.configuration.options.amscd;
    return l.setProperties({
      minw: n.stack.env.CD_minw || c.harrowsize,
      minh: n.stack.env.CD_minh || c.varrowsize
    }), l.arraydef = {
      columnalign: "center",
      columnspacing: c.colspace,
      rowspacing: c.rowspace,
      displaystyle: !0
    }, l;
  }, e.arrow = function(n, u) {
    var l = n.string.charAt(n.i);
    if (l.match(/[><VA.|=]/))
      n.i++;
    else
      return (0, g.Other)(n, u);
    var c = n.stack.Top();
    (!c.isKind("array") || c.Size()) && (e.cell(n, u), c = n.stack.Top());
    for (var a = c, f = a.table.length % 2 === 1, o = (a.row.length + (f ? 0 : 1)) % 2; o; )
      e.cell(n, u), o--;
    var h, i = { minsize: a.getProperty("minw"), stretchy: !0 }, d = {
      minsize: a.getProperty("minh"),
      stretchy: !0,
      symmetric: !0,
      lspace: 0,
      rspace: 0
    };
    if (l !== ".") if (l === "|")
      h = n.create("token", "mo", d, "∥");
    else if (l === "=")
      h = n.create("token", "mo", i, "=");
    else {
      var p = {
        ">": "→",
        "<": "←",
        V: "↓",
        A: "↑"
      }[l], r = n.GetUpTo(u + l, l), m = n.GetUpTo(u + l, l);
      if (l === ">" || l === "<") {
        if (h = n.create("token", "mo", i, p), r || (r = "\\kern " + a.getProperty("minw")), r || m) {
          var _ = { width: "+.67em", lspace: ".33em" };
          if (h = n.create("node", "munderover", [h]), r) {
            var x = new C.default(r, n.stack.env, n.configuration).mml(), A = n.create("node", "mpadded", [x], _);
            t.default.setAttribute(A, "voffset", ".1em"), t.default.setChild(h, h.over, A);
          }
          if (m) {
            var s = new C.default(m, n.stack.env, n.configuration).mml();
            t.default.setChild(h, h.under, n.create("node", "mpadded", [s], _));
          }
          n.configuration.options.amscd.hideHorizontalLabels && (h = n.create("node", "mpadded", h, { depth: 0, height: ".67em" }));
        }
      } else {
        var M = n.create("token", "mo", d, p);
        h = M, (r || m) && (h = n.create("node", "mrow"), r && t.default.appendChildren(h, [new C.default("\\scriptstyle\\llap{" + r + "}", n.stack.env, n.configuration).mml()]), M.texClass = y.TEXCLASS.ORD, t.default.appendChildren(h, [M]), m && t.default.appendChildren(h, [new C.default("\\scriptstyle\\rlap{" + m + "}", n.stack.env, n.configuration).mml()]));
      }
    }
    h && n.Push(h), e.cell(n, u);
  }, e.cell = function(n, u) {
    var l = n.stack.Top();
    (l.table || []).length % 2 === 0 && (l.row || []).length === 0 && n.Push(n.create("node", "mpadded", [], { height: "8.5pt", depth: "2pt" })), n.Push(n.itemFactory.create("cell").setProperties({ isEntry: !0, name: u }));
  }, e.minCDarrowwidth = function(n, u) {
    n.stack.env.CD_minw = n.GetDimen(u);
  }, e.minCDarrowheight = function(n, u) {
    n.stack.env.CD_minh = n.GetDimen(u);
  }, Nt.default = e, Nt;
}
var Le;
function Mn() {
  if (Le) return at;
  Le = 1;
  var v = at && at.__createBinding || (Object.create ? (function(u, l, c, a) {
    a === void 0 && (a = c);
    var f = Object.getOwnPropertyDescriptor(l, c);
    (!f || ("get" in f ? !l.__esModule : f.writable || f.configurable)) && (f = { enumerable: !0, get: function() {
      return l[c];
    } }), Object.defineProperty(u, a, f);
  }) : (function(u, l, c, a) {
    a === void 0 && (a = c), u[a] = l[c];
  })), C = at && at.__setModuleDefault || (Object.create ? (function(u, l) {
    Object.defineProperty(u, "default", { enumerable: !0, value: l });
  }) : function(u, l) {
    u.default = l;
  }), g = at && at.__importStar || function(u) {
    if (u && u.__esModule) return u;
    var l = {};
    if (u != null) for (var c in u) c !== "default" && Object.prototype.hasOwnProperty.call(u, c) && v(l, u, c);
    return C(l, u), l;
  }, y = at && at.__importDefault || function(u) {
    return u && u.__esModule ? u : { default: u };
  };
  Object.defineProperty(at, "__esModule", { value: !0 });
  var t = g(F()), e = y(St()), n = y(xn());
  return new t.EnvironmentMap("amscd_environment", e.default.environment, { CD: "CD" }, n.default), new t.CommandMap("amscd_macros", {
    minCDarrowwidth: "minCDarrowwidth",
    minCDarrowheight: "minCDarrowheight"
  }, n.default), new t.MacroMap("amscd_special", { "@": "arrow" }, n.default), at;
}
var $e;
function Cn() {
  if ($e) return Ut;
  $e = 1, Object.defineProperty(Ut, "__esModule", { value: !0 }), Ut.AmsCdConfiguration = void 0;
  var v = R();
  return Mn(), Ut.AmsCdConfiguration = v.Configuration.create("amscd", {
    handler: {
      character: ["amscd_special"],
      macro: ["amscd_macros"],
      environment: ["amscd_environment"]
    },
    options: {
      amscd: {
        colspace: "5pt",
        rowspace: "5pt",
        harrowsize: "2.75em",
        varrowsize: "1.75em",
        hideHorizontalLabels: !1
      }
    }
  }), Ut;
}
var Vt = {}, Ue;
function An() {
  return Ue || (Ue = 1, (function(v) {
    var C = Vt && Vt.__importDefault || function(u) {
      return u && u.__esModule ? u : { default: u };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.BboxConfiguration = v.BboxMethods = void 0;
    var g = R(), y = F(), t = C(U());
    v.BboxMethods = {}, v.BboxMethods.BBox = function(u, l) {
      for (var c = u.GetBrackets(l, ""), a = u.ParseArg(l), f = c.split(/,/), o, h, i, d = 0, p = f.length; d < p; d++) {
        var r = f[d].trim(), m = r.match(/^(\.\d+|\d+(\.\d*)?)(pt|em|ex|mu|px|in|cm|mm)$/);
        if (m) {
          if (o)
            throw new t.default("MultipleBBoxProperty", "%1 specified twice in %2", "Padding", l);
          var _ = n(m[1] + m[3]);
          _ && (o = {
            height: "+" + _,
            depth: "+" + _,
            lspace: _,
            width: "+" + 2 * parseInt(m[1], 10) + m[3]
          });
        } else if (r.match(/^([a-z0-9]+|\#[0-9a-f]{6}|\#[0-9a-f]{3})$/i)) {
          if (h)
            throw new t.default("MultipleBBoxProperty", "%1 specified twice in %2", "Background", l);
          h = r;
        } else if (r.match(/^[-a-z]+:/i)) {
          if (i)
            throw new t.default("MultipleBBoxProperty", "%1 specified twice in %2", "Style", l);
          i = e(r);
        } else if (r !== "")
          throw new t.default("InvalidBBoxProperty", `"%1" doesn't look like a color, a padding dimension, or a style`, r);
      }
      o && (a = u.create("node", "mpadded", [a], o)), (h || i) && (o = {}, h && Object.assign(o, { mathbackground: h }), i && Object.assign(o, { style: i }), a = u.create("node", "mstyle", [a], o)), u.Push(a);
    };
    var e = function(u) {
      return u;
    }, n = function(u) {
      return u;
    };
    new y.CommandMap("bbox", { bbox: "BBox" }, v.BboxMethods), v.BboxConfiguration = g.Configuration.create("bbox", { handler: { macro: ["bbox"] } });
  })(Vt)), Vt;
}
var qt = {}, Ve;
function wn() {
  return Ve || (Ve = 1, (function(v) {
    var C = qt && qt.__values || function(f) {
      var o = typeof Symbol == "function" && Symbol.iterator, h = o && f[o], i = 0;
      if (h) return h.call(f);
      if (f && typeof f.length == "number") return {
        next: function() {
          return f && i >= f.length && (f = void 0), { value: f && f[i++], done: !f };
        }
      };
      throw new TypeError(o ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, g = qt && qt.__importDefault || function(f) {
      return f && f.__esModule ? f : { default: f };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.BoldsymbolConfiguration = v.rewriteBoldTokens = v.createBoldToken = v.BoldsymbolMethods = void 0;
    var y = R(), t = g(W()), e = tt(), n = F(), u = Kr(), l = {};
    l[e.TexConstant.Variant.NORMAL] = e.TexConstant.Variant.BOLD, l[e.TexConstant.Variant.ITALIC] = e.TexConstant.Variant.BOLDITALIC, l[e.TexConstant.Variant.FRAKTUR] = e.TexConstant.Variant.BOLDFRAKTUR, l[e.TexConstant.Variant.SCRIPT] = e.TexConstant.Variant.BOLDSCRIPT, l[e.TexConstant.Variant.SANSSERIF] = e.TexConstant.Variant.BOLDSANSSERIF, l["-tex-calligraphic"] = "-tex-bold-calligraphic", l["-tex-oldstyle"] = "-tex-bold-oldstyle", l["-tex-mathit"] = e.TexConstant.Variant.BOLDITALIC, v.BoldsymbolMethods = {}, v.BoldsymbolMethods.Boldsymbol = function(f, o) {
      var h = f.stack.env.boldsymbol;
      f.stack.env.boldsymbol = !0;
      var i = f.ParseArg(o);
      f.stack.env.boldsymbol = h, f.Push(i);
    }, new n.CommandMap("boldsymbol", { boldsymbol: "Boldsymbol" }, v.BoldsymbolMethods);
    function c(f, o, h, i) {
      var d = u.NodeFactory.createToken(f, o, h, i);
      return o !== "mtext" && f.configuration.parser.stack.env.boldsymbol && (t.default.setProperty(d, "fixBold", !0), f.configuration.addNode("fixBold", d)), d;
    }
    v.createBoldToken = c;
    function a(f) {
      var o, h;
      try {
        for (var i = C(f.data.getList("fixBold")), d = i.next(); !d.done; d = i.next()) {
          var p = d.value;
          if (t.default.getProperty(p, "fixBold")) {
            var r = t.default.getAttribute(p, "mathvariant");
            r == null ? t.default.setAttribute(p, "mathvariant", e.TexConstant.Variant.BOLD) : t.default.setAttribute(p, "mathvariant", l[r] || r), t.default.removeProperties(p, "fixBold");
          }
        }
      } catch (m) {
        o = { error: m };
      } finally {
        try {
          d && !d.done && (h = i.return) && h.call(i);
        } finally {
          if (o) throw o.error;
        }
      }
    }
    v.rewriteBoldTokens = a, v.BoldsymbolConfiguration = y.Configuration.create("boldsymbol", {
      handler: { macro: ["boldsymbol"] },
      nodes: { token: c },
      postprocessors: [a]
    });
  })(qt)), qt;
}
var zt = {}, ht = {}, ze;
function bn() {
  if (ze) return ht;
  ze = 1;
  var v = ht && ht.__extends || /* @__PURE__ */ (function() {
    var n = function(u, l) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(c, a) {
        c.__proto__ = a;
      } || function(c, a) {
        for (var f in a) Object.prototype.hasOwnProperty.call(a, f) && (c[f] = a[f]);
      }, n(u, l);
    };
    return function(u, l) {
      if (typeof l != "function" && l !== null)
        throw new TypeError("Class extends value " + String(l) + " is not a constructor or null");
      n(u, l);
      function c() {
        this.constructor = u;
      }
      u.prototype = l === null ? Object.create(l) : (c.prototype = l.prototype, new c());
    };
  })(), C = ht && ht.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(ht, "__esModule", { value: !0 }), ht.BraketItem = void 0;
  var g = ye(), y = bt(), t = C(V()), e = (function(n) {
    v(u, n);
    function u() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(u.prototype, "kind", {
      get: function() {
        return "braket";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(u.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), u.prototype.checkItem = function(l) {
      return l.isKind("close") ? [[this.factory.create("mml", this.toMml())], !0] : l.isKind("mml") ? (this.Push(l.toMml()), this.getProperty("single") ? [[this.toMml()], !0] : g.BaseItem.fail) : n.prototype.checkItem.call(this, l);
    }, u.prototype.toMml = function() {
      var l = n.prototype.toMml.call(this), c = this.getProperty("open"), a = this.getProperty("close");
      if (this.getProperty("stretchy"))
        return t.default.fenced(this.factory.configuration, c, l, a);
      var f = { fence: !0, stretchy: !1, symmetric: !0, texClass: y.TEXCLASS.OPEN }, o = this.create("token", "mo", f, c);
      f.texClass = y.TEXCLASS.CLOSE;
      var h = this.create("token", "mo", f, a), i = this.create("node", "mrow", [o, l, h], { open: c, close: a, texClass: y.TEXCLASS.INNER });
      return i;
    }, u;
  })(g.BaseItem);
  return ht.BraketItem = e, ht;
}
var Ht = {}, Gt = {}, He;
function Pn() {
  if (He) return Gt;
  He = 1;
  var v = Gt && Gt.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(Gt, "__esModule", { value: !0 });
  var C = v(st()), g = bt(), y = v(U()), t = {};
  return t.Macro = C.default.Macro, t.Braket = function(e, n, u, l, c, a) {
    var f = e.GetNext();
    if (f === "")
      throw new y.default("MissingArgFor", "Missing argument for %1", e.currentCS);
    var o = !0;
    f === "{" && (e.i++, o = !1), e.Push(e.itemFactory.create("braket").setProperties({
      barmax: a,
      barcount: 0,
      open: u,
      close: l,
      stretchy: c,
      single: o
    }));
  }, t.Bar = function(e, n) {
    var u = n === "|" ? "|" : "∥", l = e.stack.Top();
    if (l.kind !== "braket" || l.getProperty("barcount") >= l.getProperty("barmax")) {
      var c = e.create("token", "mo", { texClass: g.TEXCLASS.ORD, stretchy: !1 }, u);
      e.Push(c);
      return;
    }
    u === "|" && e.GetNext() === "|" && (e.i++, u = "∥");
    var a = l.getProperty("stretchy");
    if (!a) {
      var f = e.create("token", "mo", { stretchy: !1, braketbar: !0 }, u);
      e.Push(f);
      return;
    }
    var o = e.create("node", "TeXAtom", [], { texClass: g.TEXCLASS.CLOSE });
    e.Push(o), l.setProperty("barcount", l.getProperty("barcount") + 1), o = e.create("token", "mo", { stretchy: !0, braketbar: !0 }, u), e.Push(o), o = e.create("node", "TeXAtom", [], { texClass: g.TEXCLASS.OPEN }), e.Push(o);
  }, Gt.default = t, Gt;
}
var Xe;
function Sn() {
  if (Xe) return Ht;
  Xe = 1;
  var v = Ht && Ht.__importDefault || function(y) {
    return y && y.__esModule ? y : { default: y };
  };
  Object.defineProperty(Ht, "__esModule", { value: !0 });
  var C = F(), g = v(Pn());
  return new C.CommandMap("Braket-macros", {
    bra: ["Macro", "{\\langle {#1} \\vert}", 1],
    ket: ["Macro", "{\\vert {#1} \\rangle}", 1],
    braket: ["Braket", "⟨", "⟩", !1, 1 / 0],
    set: ["Braket", "{", "}", !1, 1],
    Bra: ["Macro", "{\\left\\langle {#1} \\right\\vert}", 1],
    Ket: ["Macro", "{\\left\\vert {#1} \\right\\rangle}", 1],
    Braket: ["Braket", "⟨", "⟩", !0, 1 / 0],
    Set: ["Braket", "{", "}", !0, 1],
    ketbra: ["Macro", "{\\vert {#1} \\rangle\\langle {#2} \\vert}", 2],
    Ketbra: ["Macro", "{\\left\\vert {#1} \\right\\rangle\\left\\langle {#2} \\right\\vert}", 2],
    "|": "Bar"
  }, g.default), new C.MacroMap("Braket-characters", {
    "|": "Bar"
  }, g.default), Ht;
}
var Qe;
function qn() {
  if (Qe) return zt;
  Qe = 1;
  var v;
  Object.defineProperty(zt, "__esModule", { value: !0 }), zt.BraketConfiguration = void 0;
  var C = R(), g = bn();
  return Sn(), zt.BraketConfiguration = C.Configuration.create("braket", {
    handler: {
      character: ["Braket-characters"],
      macro: ["Braket-macros"]
    },
    items: (v = {}, v[g.BraketItem.prototype.kind] = g.BraketItem, v)
  }), zt;
}
var Xt = {}, Q = {}, vt = {}, Ke;
function qe() {
  return Ke || (Ke = 1, (function(v) {
    var C = vt && vt.__read || function(S, O) {
      var D = typeof Symbol == "function" && S[Symbol.iterator];
      if (!D) return S;
      var B = D.call(S), j, L = [], N;
      try {
        for (; (O === void 0 || O-- > 0) && !(j = B.next()).done; ) L.push(j.value);
      } catch (z) {
        N = { error: z };
      } finally {
        try {
          j && !j.done && (D = B.return) && D.call(B);
        } finally {
          if (N) throw N.error;
        }
      }
      return L;
    }, g = vt && vt.__values || function(S) {
      var O = typeof Symbol == "function" && Symbol.iterator, D = O && S[O], B = 0;
      if (D) return D.call(S);
      if (S && typeof S.length == "number") return {
        next: function() {
          return S && B >= S.length && (S = void 0), { value: S && S[B++], done: !S };
        }
      };
      throw new TypeError(O ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, y = vt && vt.__importDefault || function(S) {
      return S && S.__esModule ? S : { default: S };
    }, t;
    Object.defineProperty(v, "__esModule", { value: !0 }), v.clearDocument = v.saveDocument = v.makeBsprAttributes = v.removeProperty = v.getProperty = v.setProperty = v.balanceRules = void 0;
    var e = y(W()), n = y(V()), u = null, l = null, c = function(S) {
      l.root = S;
      var O = u.outputJax.getBBox(l, u).w;
      return O;
    }, a = function(S) {
      for (var O = 0; S && !e.default.isType(S, "mtable"); ) {
        if (e.default.isType(S, "text"))
          return null;
        if (e.default.isType(S, "mrow")) {
          S = S.childNodes[0], O = 0;
          continue;
        }
        S = S.parent.childNodes[O], O++;
      }
      return S;
    }, f = function(S, O) {
      return S.childNodes[O === "up" ? 1 : 0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
    }, o = function(S, O) {
      return S.childNodes[O].childNodes[0].childNodes[0];
    }, h = function(S) {
      return o(S, 0);
    }, i = function(S) {
      return o(S, S.childNodes.length - 1);
    }, d = function(S, O) {
      return S.childNodes[O === "up" ? 0 : 1].childNodes[0].childNodes[0].childNodes[0];
    }, p = function(S) {
      for (; S && !e.default.isType(S, "mtd"); )
        S = S.parent;
      return S;
    }, r = function(S) {
      return S.parent.childNodes[S.parent.childNodes.indexOf(S) + 1];
    }, m = function(S) {
      for (; S && (0, v.getProperty)(S, "inference") == null; )
        S = S.parent;
      return S;
    }, _ = function(S, O, D) {
      D === void 0 && (D = !1);
      var B = 0;
      if (S === O)
        return B;
      if (S !== O.parent) {
        var j = S.childNodes, L = D ? j.length - 1 : 0;
        e.default.isType(j[L], "mspace") && (B += c(j[L])), S = O.parent;
      }
      if (S === O)
        return B;
      var N = S.childNodes, z = D ? N.length - 1 : 0;
      return N[z] !== O && (B += c(N[z])), B;
    }, x = function(S, O) {
      O === void 0 && (O = !1);
      var D = a(S), B = d(D, (0, v.getProperty)(D, "inferenceRule")), j = _(S, D, O), L = c(D), N = c(B);
      return j + (L - N) / 2;
    }, A = function(S, O, D, B) {
      if (B === void 0 && (B = !1), (0, v.getProperty)(O, "inferenceRule") || (0, v.getProperty)(O, "labelledRule")) {
        var j = S.nodeFactory.create("node", "mrow");
        O.parent.replaceChild(j, O), j.setChildren([O]), s(O, j), O = j;
      }
      var L = B ? O.childNodes.length - 1 : 0, N = O.childNodes[L];
      if (e.default.isType(N, "mspace")) {
        e.default.setAttribute(N, "width", n.default.Em(n.default.dimen2em(e.default.getAttribute(N, "width")) + D));
        return;
      }
      if (N = S.nodeFactory.create("node", "mspace", [], { width: n.default.Em(D) }), B) {
        O.appendChild(N);
        return;
      }
      N.parent = O, O.childNodes.unshift(N);
    }, s = function(S, O) {
      var D = ["inference", "proof", "maxAdjust", "labelledRule"];
      D.forEach(function(B) {
        var j = (0, v.getProperty)(S, B);
        j != null && ((0, v.setProperty)(O, B, j), (0, v.removeProperty)(S, B));
      });
    }, M = function(S) {
      var O = S.nodeLists.sequent;
      if (O)
        for (var D = O.length - 1, B = void 0; B = O[D]; D--) {
          if ((0, v.getProperty)(B, "sequentProcessed")) {
            (0, v.removeProperty)(B, "sequentProcessed");
            continue;
          }
          var j = [], L = m(B);
          if ((0, v.getProperty)(L, "inference") === 1) {
            for (j.push(B); (0, v.getProperty)(L, "inference") === 1; ) {
              L = a(L);
              var N = h(f(L, (0, v.getProperty)(L, "inferenceRule"))), z = (0, v.getProperty)(N, "inferenceRule") ? d(N, (0, v.getProperty)(N, "inferenceRule")) : N;
              (0, v.getProperty)(z, "sequent") && (B = z.childNodes[0], j.push(B), (0, v.setProperty)(B, "sequentProcessed", !0)), L = N;
            }
            b(S, j);
          }
        }
    }, w = function(S, O, D, B, j) {
      var L = S.nodeFactory.create("node", "mspace", [], { width: n.default.Em(j) });
      if (B === "left") {
        var N = O.childNodes[D].childNodes[0];
        L.parent = N, N.childNodes.unshift(L);
      } else
        O.childNodes[D].appendChild(L);
      (0, v.setProperty)(O.parent, "sequentAdjust_" + B, j);
    }, b = function(S, O) {
      for (var D = O.pop(); O.length; ) {
        var B = O.pop(), j = C(P(D, B), 2), L = j[0], N = j[1];
        (0, v.getProperty)(D.parent, "axiom") && (w(S, L < 0 ? D : B, 0, "left", Math.abs(L)), w(S, N < 0 ? D : B, 2, "right", Math.abs(N))), D = B;
      }
    }, P = function(S, O) {
      var D = c(S.childNodes[2]), B = c(O.childNodes[2]), j = c(S.childNodes[0]), L = c(O.childNodes[0]), N = j - L, z = D - B;
      return [N, z];
    }, T = function(S) {
      var O, D;
      l = new S.document.options.MathItem("", null, S.math.display);
      var B = S.data;
      M(B);
      var j = B.nodeLists.inference || [];
      try {
        for (var L = g(j), N = L.next(); !N.done; N = L.next()) {
          var z = N.value, ln = (0, v.getProperty)(z, "proof"), pe = a(z), Oe = f(pe, (0, v.getProperty)(pe, "inferenceRule")), Me = h(Oe);
          if ((0, v.getProperty)(Me, "inference")) {
            var Ce = x(Me);
            if (Ce) {
              A(B, Me, -Ce);
              var sn = _(z, pe, !1);
              A(B, z, Ce - sn);
            }
          }
          var Ae = i(Oe);
          if ((0, v.getProperty)(Ae, "inference") != null) {
            var ft = x(Ae, !0);
            A(B, Ae, -ft, !0);
            var ke = _(z, pe, !0), Be = (0, v.getProperty)(z, "maxAdjust");
            Be != null && (ft = Math.max(ft, Be));
            var we = void 0;
            if (ln || !(we = p(z))) {
              A(B, (0, v.getProperty)(z, "proof") ? z : z.parent, ft - ke, !0);
              continue;
            }
            var De = r(we);
            if (De) {
              var cn = B.nodeFactory.create("node", "mspace", [], { width: ft - ke + "em" });
              De.appendChild(cn), z.removeProperty("maxAdjust");
              continue;
            }
            var ge = m(we);
            ge && (ft = (0, v.getProperty)(ge, "maxAdjust") ? Math.max((0, v.getProperty)(ge, "maxAdjust"), ft) : ft, (0, v.setProperty)(ge, "maxAdjust", ft));
          }
        }
      } catch (fn) {
        O = { error: fn };
      } finally {
        try {
          N && !N.done && (D = L.return) && D.call(L);
        } finally {
          if (O) throw O.error;
        }
      }
    };
    v.balanceRules = T;
    var q = "bspr_", E = (t = {}, t[q + "maxAdjust"] = !0, t), k = function(S, O, D) {
      e.default.setProperty(S, q + O, D);
    };
    v.setProperty = k;
    var I = function(S, O) {
      return e.default.getProperty(S, q + O);
    };
    v.getProperty = I;
    var G = function(S, O) {
      S.removeProperty(q + O);
    };
    v.removeProperty = G;
    var $ = function(S) {
      S.data.root.walkTree(function(O, D) {
        var B = [];
        O.getPropertyNames().forEach(function(j) {
          !E[j] && j.match(RegExp("^" + q)) && B.push(j + ":" + O.getProperty(j));
        }), B.length && e.default.setAttribute(O, "semantics", B.join(";"));
      });
    };
    v.makeBsprAttributes = $;
    var H = function(S) {
      if (u = S.document, !("getBBox" in u.outputJax))
        throw Error("The bussproofs extension requires an output jax with a getBBox() method");
    };
    v.saveDocument = H;
    var ct = function(S) {
      u = null;
    };
    v.clearDocument = ct;
  })(vt)), vt;
}
var We;
function Tn() {
  if (We) return Q;
  We = 1;
  var v = Q && Q.__extends || /* @__PURE__ */ (function() {
    var a = function(f, o) {
      return a = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(h, i) {
        h.__proto__ = i;
      } || function(h, i) {
        for (var d in i) Object.prototype.hasOwnProperty.call(i, d) && (h[d] = i[d]);
      }, a(f, o);
    };
    return function(f, o) {
      if (typeof o != "function" && o !== null)
        throw new TypeError("Class extends value " + String(o) + " is not a constructor or null");
      a(f, o);
      function h() {
        this.constructor = f;
      }
      f.prototype = o === null ? Object.create(o) : (h.prototype = o.prototype, new h());
    };
  })(), C = Q && Q.__createBinding || (Object.create ? (function(a, f, o, h) {
    h === void 0 && (h = o);
    var i = Object.getOwnPropertyDescriptor(f, o);
    (!i || ("get" in i ? !f.__esModule : i.writable || i.configurable)) && (i = { enumerable: !0, get: function() {
      return f[o];
    } }), Object.defineProperty(a, h, i);
  }) : (function(a, f, o, h) {
    h === void 0 && (h = o), a[h] = f[o];
  })), g = Q && Q.__setModuleDefault || (Object.create ? (function(a, f) {
    Object.defineProperty(a, "default", { enumerable: !0, value: f });
  }) : function(a, f) {
    a.default = f;
  }), y = Q && Q.__importStar || function(a) {
    if (a && a.__esModule) return a;
    var f = {};
    if (a != null) for (var o in a) o !== "default" && Object.prototype.hasOwnProperty.call(a, o) && C(f, a, o);
    return g(f, a), f;
  }, t = Q && Q.__importDefault || function(a) {
    return a && a.__esModule ? a : { default: a };
  };
  Object.defineProperty(Q, "__esModule", { value: !0 }), Q.ProofTreeItem = void 0;
  var e = t(U()), n = ye(), u = t(mn()), l = y(qe()), c = (function(a) {
    v(f, a);
    function f() {
      var o = a !== null && a.apply(this, arguments) || this;
      return o.leftLabel = null, o.rigthLabel = null, o.innerStack = new u.default(o.factory, {}, !0), o;
    }
    return Object.defineProperty(f.prototype, "kind", {
      get: function() {
        return "proofTree";
      },
      enumerable: !1,
      configurable: !0
    }), f.prototype.checkItem = function(o) {
      if (o.isKind("end") && o.getName() === "prooftree") {
        var h = this.toMml();
        return l.setProperty(h, "proof", !0), [[this.factory.create("mml", h), o], !0];
      }
      if (o.isKind("stop"))
        throw new e.default("EnvMissingEnd", "Missing \\end{%1}", this.getName());
      return this.innerStack.Push(o), n.BaseItem.fail;
    }, f.prototype.toMml = function() {
      var o = a.prototype.toMml.call(this), h = this.innerStack.Top();
      if (h.isKind("start") && !h.Size())
        return o;
      this.innerStack.Push(this.factory.create("stop"));
      var i = this.innerStack.Top().toMml();
      return this.create("node", "mrow", [i, o], {});
    }, f;
  })(n.BaseItem);
  return Q.ProofTreeItem = c, Q;
}
var Qt = {}, X = {}, Ze;
function En() {
  if (Ze) return X;
  Ze = 1;
  var v = X && X.__createBinding || (Object.create ? (function(i, d, p, r) {
    r === void 0 && (r = p);
    var m = Object.getOwnPropertyDescriptor(d, p);
    (!m || ("get" in m ? !d.__esModule : m.writable || m.configurable)) && (m = { enumerable: !0, get: function() {
      return d[p];
    } }), Object.defineProperty(i, r, m);
  }) : (function(i, d, p, r) {
    r === void 0 && (r = p), i[r] = d[p];
  })), C = X && X.__setModuleDefault || (Object.create ? (function(i, d) {
    Object.defineProperty(i, "default", { enumerable: !0, value: d });
  }) : function(i, d) {
    i.default = d;
  }), g = X && X.__importStar || function(i) {
    if (i && i.__esModule) return i;
    var d = {};
    if (i != null) for (var p in i) p !== "default" && Object.prototype.hasOwnProperty.call(i, p) && v(d, i, p);
    return C(d, i), d;
  }, y = X && X.__read || function(i, d) {
    var p = typeof Symbol == "function" && i[Symbol.iterator];
    if (!p) return i;
    var r = p.call(i), m, _ = [], x;
    try {
      for (; (d === void 0 || d-- > 0) && !(m = r.next()).done; ) _.push(m.value);
    } catch (A) {
      x = { error: A };
    } finally {
      try {
        m && !m.done && (p = r.return) && p.call(r);
      } finally {
        if (x) throw x.error;
      }
    }
    return _;
  }, t = X && X.__spreadArray || function(i, d, p) {
    if (p || arguments.length === 2) for (var r = 0, m = d.length, _; r < m; r++)
      (_ || !(r in d)) && (_ || (_ = Array.prototype.slice.call(d, 0, r)), _[r] = d[r]);
    return i.concat(_ || Array.prototype.slice.call(d));
  }, e = X && X.__importDefault || function(i) {
    return i && i.__esModule ? i : { default: i };
  };
  Object.defineProperty(X, "__esModule", { value: !0 });
  var n = e(U()), u = e(rt()), l = e(V()), c = g(qe()), a = {};
  a.Prooftree = function(i, d) {
    i.Push(d);
    var p = i.itemFactory.create("proofTree").setProperties({
      name: d.getName(),
      line: "solid",
      currentLine: "solid",
      rootAtTop: !1
    });
    return p;
  }, a.Axiom = function(i, d) {
    var p = i.stack.Top();
    if (p.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    var r = f(i, i.GetArgument(d));
    c.setProperty(r, "axiom", !0), p.Push(r);
  };
  var f = function(i, d) {
    var p = l.default.internalMath(i, l.default.trimSpaces(d), 0);
    if (!p[0].childNodes[0].childNodes.length)
      return i.create("node", "mrow", []);
    var r = i.create("node", "mspace", [], { width: ".5ex" }), m = i.create("node", "mspace", [], { width: ".5ex" });
    return i.create("node", "mrow", t(t([r], y(p), !1), [m], !1));
  };
  a.Inference = function(i, d, p) {
    var r = i.stack.Top();
    if (r.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    if (r.Size() < p)
      throw new n.default("BadProofTree", "Proof tree badly specified.");
    var m = r.getProperty("rootAtTop"), _ = p === 1 && !r.Peek()[0].childNodes.length ? 0 : p, x = [];
    do
      x.length && x.unshift(i.create("node", "mtd", [], {})), x.unshift(i.create("node", "mtd", [r.Pop()], { rowalign: m ? "top" : "bottom" })), p--;
    while (p > 0);
    var A = i.create("node", "mtr", x, {}), s = i.create("node", "mtable", [A], { framespacing: "0 0" }), M = f(i, i.GetArgument(d)), w = r.getProperty("currentLine");
    w !== r.getProperty("line") && r.setProperty("currentLine", r.getProperty("line"));
    var b = o(i, s, [M], r.getProperty("left"), r.getProperty("right"), w, m);
    r.setProperty("left", null), r.setProperty("right", null), c.setProperty(b, "inference", _), i.configuration.addNode("inference", b), r.Push(b);
  };
  function o(i, d, p, r, m, _, x) {
    var A = i.create("node", "mtr", [i.create("node", "mtd", [d], {})], {}), s = i.create("node", "mtr", [i.create("node", "mtd", p, {})], {}), M = i.create("node", "mtable", x ? [s, A] : [A, s], { align: "top 2", rowlines: _, framespacing: "0 0" });
    c.setProperty(M, "inferenceRule", x ? "up" : "down");
    var w, b;
    r && (w = i.create("node", "mpadded", [r], { height: "+.5em", width: "+.5em", voffset: "-.15em" }), c.setProperty(w, "prooflabel", "left")), m && (b = i.create("node", "mpadded", [m], { height: "+.5em", width: "+.5em", voffset: "-.15em" }), c.setProperty(b, "prooflabel", "right"));
    var P, T;
    if (r && m)
      P = [w, M, b], T = "both";
    else if (r)
      P = [w, M], T = "left";
    else if (m)
      P = [M, b], T = "right";
    else
      return M;
    return M = i.create("node", "mrow", P), c.setProperty(M, "labelledRule", T), M;
  }
  a.Label = function(i, d, p) {
    var r = i.stack.Top();
    if (r.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    var m = l.default.internalMath(i, i.GetArgument(d), 0), _ = m.length > 1 ? i.create("node", "mrow", m, {}) : m[0];
    r.setProperty(p, _);
  }, a.SetLine = function(i, d, p, r) {
    var m = i.stack.Top();
    if (m.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    m.setProperty("currentLine", p), r && m.setProperty("line", p);
  }, a.RootAtTop = function(i, d, p) {
    var r = i.stack.Top();
    if (r.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    r.setProperty("rootAtTop", p);
  }, a.AxiomF = function(i, d) {
    var p = i.stack.Top();
    if (p.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    var r = h(i, d);
    c.setProperty(r, "axiom", !0), p.Push(r);
  };
  function h(i, d) {
    var p = i.GetNext();
    if (p !== "$")
      throw new n.default("IllegalUseOfCommand", "Use of %1 does not match it's definition.", d);
    i.i++;
    var r = i.GetUpTo(d, "$");
    if (r.indexOf("\\fCenter") === -1)
      throw new n.default("IllegalUseOfCommand", "Missing \\fCenter in %1.", d);
    var m = y(r.split("\\fCenter"), 2), _ = m[0], x = m[1], A = new u.default(_, i.stack.env, i.configuration).mml(), s = new u.default(x, i.stack.env, i.configuration).mml(), M = new u.default("\\fCenter", i.stack.env, i.configuration).mml(), w = i.create("node", "mtd", [A], {}), b = i.create("node", "mtd", [M], {}), P = i.create("node", "mtd", [s], {}), T = i.create("node", "mtr", [w, b, P], {}), q = i.create("node", "mtable", [T], { columnspacing: ".5ex", columnalign: "center 2" });
    return c.setProperty(q, "sequent", !0), i.configuration.addNode("sequent", T), q;
  }
  return a.FCenter = function(i, d) {
  }, a.InferenceF = function(i, d, p) {
    var r = i.stack.Top();
    if (r.kind !== "proofTree")
      throw new n.default("IllegalProofCommand", "Proof commands only allowed in prooftree environment.");
    if (r.Size() < p)
      throw new n.default("BadProofTree", "Proof tree badly specified.");
    var m = r.getProperty("rootAtTop"), _ = p === 1 && !r.Peek()[0].childNodes.length ? 0 : p, x = [];
    do
      x.length && x.unshift(i.create("node", "mtd", [], {})), x.unshift(i.create("node", "mtd", [r.Pop()], { rowalign: m ? "top" : "bottom" })), p--;
    while (p > 0);
    var A = i.create("node", "mtr", x, {}), s = i.create("node", "mtable", [A], { framespacing: "0 0" }), M = h(i, d), w = r.getProperty("currentLine");
    w !== r.getProperty("line") && r.setProperty("currentLine", r.getProperty("line"));
    var b = o(i, s, [M], r.getProperty("left"), r.getProperty("right"), w, m);
    r.setProperty("left", null), r.setProperty("right", null), c.setProperty(b, "inference", _), i.configuration.addNode("inference", b), r.Push(b);
  }, X.default = a, X;
}
var Ye;
function On() {
  if (Ye) return Qt;
  Ye = 1;
  var v = Qt && Qt.__importDefault || function(t) {
    return t && t.__esModule ? t : { default: t };
  };
  Object.defineProperty(Qt, "__esModule", { value: !0 });
  var C = v(En()), g = v(St()), y = F();
  return new y.CommandMap("Bussproofs-macros", {
    AxiomC: "Axiom",
    UnaryInfC: ["Inference", 1],
    BinaryInfC: ["Inference", 2],
    TrinaryInfC: ["Inference", 3],
    QuaternaryInfC: ["Inference", 4],
    QuinaryInfC: ["Inference", 5],
    RightLabel: ["Label", "right"],
    LeftLabel: ["Label", "left"],
    AXC: "Axiom",
    UIC: ["Inference", 1],
    BIC: ["Inference", 2],
    TIC: ["Inference", 3],
    RL: ["Label", "right"],
    LL: ["Label", "left"],
    noLine: ["SetLine", "none", !1],
    singleLine: ["SetLine", "solid", !1],
    solidLine: ["SetLine", "solid", !1],
    dashedLine: ["SetLine", "dashed", !1],
    alwaysNoLine: ["SetLine", "none", !0],
    alwaysSingleLine: ["SetLine", "solid", !0],
    alwaysSolidLine: ["SetLine", "solid", !0],
    alwaysDashedLine: ["SetLine", "dashed", !0],
    rootAtTop: ["RootAtTop", !0],
    alwaysRootAtTop: ["RootAtTop", !0],
    rootAtBottom: ["RootAtTop", !1],
    alwaysRootAtBottom: ["RootAtTop", !1],
    fCenter: "FCenter",
    Axiom: "AxiomF",
    UnaryInf: ["InferenceF", 1],
    BinaryInf: ["InferenceF", 2],
    TrinaryInf: ["InferenceF", 3],
    QuaternaryInf: ["InferenceF", 4],
    QuinaryInf: ["InferenceF", 5]
  }, C.default), new y.EnvironmentMap("Bussproofs-environments", g.default.environment, {
    prooftree: ["Prooftree", null, !1]
  }, C.default), Qt;
}
var Je;
function kn() {
  if (Je) return Xt;
  Je = 1;
  var v;
  Object.defineProperty(Xt, "__esModule", { value: !0 }), Xt.BussproofsConfiguration = void 0;
  var C = R(), g = Tn(), y = qe();
  return On(), Xt.BussproofsConfiguration = C.Configuration.create("bussproofs", {
    handler: {
      macro: ["Bussproofs-macros"],
      environment: ["Bussproofs-environments"]
    },
    items: (v = {}, v[g.ProofTreeItem.prototype.kind] = g.ProofTreeItem, v),
    preprocessors: [
      [y.saveDocument, 1]
    ],
    postprocessors: [
      [y.clearDocument, 3],
      [y.makeBsprAttributes, 2],
      [y.balanceRules, 1]
    ]
  }), Xt;
}
var Kt = {}, Wt = {}, tr;
function Yr() {
  return tr || (tr = 1, (function(v) {
    var C = Wt && Wt.__importDefault || function(e) {
      return e && e.__esModule ? e : { default: e };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.EncloseConfiguration = v.EncloseMethods = v.ENCLOSE_OPTIONS = void 0;
    var g = R(), y = F(), t = C(V());
    v.ENCLOSE_OPTIONS = {
      "data-arrowhead": 1,
      color: 1,
      mathcolor: 1,
      background: 1,
      mathbackground: 1,
      "data-padding": 1,
      "data-thickness": 1
    }, v.EncloseMethods = {}, v.EncloseMethods.Enclose = function(e, n) {
      var u = e.GetArgument(n).replace(/,/g, " "), l = e.GetBrackets(n, ""), c = e.ParseArg(n), a = t.default.keyvalOptions(l, v.ENCLOSE_OPTIONS);
      a.notation = u, e.Push(e.create("node", "menclose", [c], a));
    }, new y.CommandMap("enclose", { enclose: "Enclose" }, v.EncloseMethods), v.EncloseConfiguration = g.Configuration.create("enclose", { handler: { macro: ["enclose"] } });
  })(Wt)), Wt;
}
var er;
function Bn() {
  return er || (er = 1, (function(v) {
    var C = Kt && Kt.__importDefault || function(u) {
      return u && u.__esModule ? u : { default: u };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.CancelConfiguration = v.CancelMethods = void 0;
    var g = R(), y = tt(), t = F(), e = C(V()), n = Yr();
    v.CancelMethods = {}, v.CancelMethods.Cancel = function(u, l, c) {
      var a = u.GetBrackets(l, ""), f = u.ParseArg(l), o = e.default.keyvalOptions(a, n.ENCLOSE_OPTIONS);
      o.notation = c, u.Push(u.create("node", "menclose", [f], o));
    }, v.CancelMethods.CancelTo = function(u, l) {
      var c = u.GetBrackets(l, ""), a = u.ParseArg(l), f = u.ParseArg(l), o = e.default.keyvalOptions(c, n.ENCLOSE_OPTIONS);
      o.notation = [
        y.TexConstant.Notation.UPDIAGONALSTRIKE,
        y.TexConstant.Notation.UPDIAGONALARROW,
        y.TexConstant.Notation.NORTHEASTARROW
      ].join(" "), a = u.create("node", "mpadded", [a], { depth: "-.1em", height: "+.1em", voffset: ".1em" }), u.Push(u.create("node", "msup", [u.create("node", "menclose", [f], o), a]));
    }, new t.CommandMap("cancel", {
      cancel: ["Cancel", y.TexConstant.Notation.UPDIAGONALSTRIKE],
      bcancel: ["Cancel", y.TexConstant.Notation.DOWNDIAGONALSTRIKE],
      xcancel: ["Cancel", y.TexConstant.Notation.UPDIAGONALSTRIKE + " " + y.TexConstant.Notation.DOWNDIAGONALSTRIKE],
      cancelto: "CancelTo"
    }, v.CancelMethods), v.CancelConfiguration = g.Configuration.create("cancel", { handler: { macro: ["cancel"] } });
  })(Kt)), Kt;
}
var Tt = {}, ot = {}, rr;
function Jr() {
  return rr || (rr = 1, (function(v) {
    var C = ot && ot.__read || function(u, l) {
      var c = typeof Symbol == "function" && u[Symbol.iterator];
      if (!c) return u;
      var a = c.call(u), f, o = [], h;
      try {
        for (; (l === void 0 || l-- > 0) && !(f = a.next()).done; ) o.push(f.value);
      } catch (i) {
        h = { error: i };
      } finally {
        try {
          f && !f.done && (c = a.return) && c.call(a);
        } finally {
          if (h) throw h.error;
        }
      }
      return o;
    }, g = ot && ot.__spreadArray || function(u, l, c) {
      if (c || arguments.length === 2) for (var a = 0, f = l.length, o; a < f; a++)
        (o || !(a in l)) && (o || (o = Array.prototype.slice.call(l, 0, a)), o[a] = l[a]);
      return u.concat(o || Array.prototype.slice.call(l));
    }, y = ot && ot.__values || function(u) {
      var l = typeof Symbol == "function" && Symbol.iterator, c = l && u[l], a = 0;
      if (c) return c.call(u);
      if (u && typeof u.length == "number") return {
        next: function() {
          return u && a >= u.length && (u = void 0), { value: u && u[a++], done: !u };
        }
      };
      throw new TypeError(l ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, t = ot && ot.__importDefault || function(u) {
      return u && u.__esModule ? u : { default: u };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.EmpheqUtil = void 0;
    var e = t(V()), n = t(rt());
    v.EmpheqUtil = {
      environment: function(u, l, c, a) {
        var f = a[0], o = u.itemFactory.create(f + "-begin").setProperties({ name: l, end: f });
        u.Push(c.apply(void 0, g([u, o], C(a.slice(1)), !1)));
      },
      splitOptions: function(u, l) {
        return l === void 0 && (l = null), e.default.keyvalOptions(u, l, !0);
      },
      columnCount: function(u) {
        var l, c, a = 0;
        try {
          for (var f = y(u.childNodes), o = f.next(); !o.done; o = f.next()) {
            var h = o.value, i = h.childNodes.length - (h.isKind("mlabeledtr") ? 1 : 0);
            i > a && (a = i);
          }
        } catch (d) {
          l = { error: d };
        } finally {
          try {
            o && !o.done && (c = f.return) && c.call(f);
          } finally {
            if (l) throw l.error;
          }
        }
        return a;
      },
      cellBlock: function(u, l, c, a) {
        var f, o, h = c.create("node", "mpadded", [], { height: 0, depth: 0, voffset: "-1height" }), i = new n.default(u, c.stack.env, c.configuration), d = i.mml();
        a && i.configuration.tags.label && (i.configuration.tags.currentTag.env = a, i.configuration.tags.getTag(!0));
        try {
          for (var p = y(d.isInferred ? d.childNodes : [d]), r = p.next(); !r.done; r = p.next()) {
            var m = r.value;
            h.appendChild(m);
          }
        } catch (_) {
          f = { error: _ };
        } finally {
          try {
            r && !r.done && (o = p.return) && o.call(p);
          } finally {
            if (f) throw f.error;
          }
        }
        return h.appendChild(c.create("node", "mphantom", [
          c.create("node", "mpadded", [l], { width: 0 })
        ])), h;
      },
      topRowTable: function(u, l) {
        var c = e.default.copyNode(u, l);
        return c.setChildren(c.childNodes.slice(0, 1)), c.attributes.set("align", "baseline 1"), u.factory.create("mphantom", {}, [l.create("node", "mpadded", [c], { width: 0 })]);
      },
      rowspanCell: function(u, l, c, a, f) {
        u.appendChild(a.create("node", "mpadded", [
          this.cellBlock(l, e.default.copyNode(c, a), a, f),
          this.topRowTable(c, a)
        ], { height: 0, depth: 0, voffset: "height" }));
      },
      left: function(u, l, c, a, f) {
        var o, h;
        f === void 0 && (f = ""), u.attributes.set("columnalign", "right " + (u.attributes.get("columnalign") || "")), u.attributes.set("columnspacing", "0em " + (u.attributes.get("columnspacing") || ""));
        var i;
        try {
          for (var d = y(u.childNodes.slice(0).reverse()), p = d.next(); !p.done; p = d.next()) {
            var r = p.value;
            i = a.create("node", "mtd"), r.childNodes.unshift(i), i.parent = r, r.isKind("mlabeledtr") && (r.childNodes[0] = r.childNodes[1], r.childNodes[1] = i);
          }
        } catch (m) {
          o = { error: m };
        } finally {
          try {
            p && !p.done && (h = d.return) && h.call(d);
          } finally {
            if (o) throw o.error;
          }
        }
        this.rowspanCell(i, c, l, a, f);
      },
      right: function(u, l, c, a, f) {
        f === void 0 && (f = ""), u.childNodes.length === 0 && u.appendChild(a.create("node", "mtr"));
        for (var o = v.EmpheqUtil.columnCount(u), h = u.childNodes[0]; h.childNodes.length < o; )
          h.appendChild(a.create("node", "mtd"));
        var i = h.appendChild(a.create("node", "mtd"));
        v.EmpheqUtil.rowspanCell(i, c, l, a, f), u.attributes.set("columnalign", (u.attributes.get("columnalign") || "").split(/ /).slice(0, o).join(" ") + " left"), u.attributes.set("columnspacing", (u.attributes.get("columnspacing") || "").split(/ /).slice(0, o - 1).join(" ") + " 0em");
      },
      adjustTable: function(u, l) {
        var c = u.getProperty("left"), a = u.getProperty("right");
        if (c || a) {
          var f = u.Last, o = e.default.copyNode(f, l);
          c && this.left(f, o, c, l), a && this.right(f, o, a, l);
        }
      },
      allowEnv: {
        equation: !0,
        align: !0,
        gather: !0,
        flalign: !0,
        alignat: !0,
        multline: !0
      },
      checkEnv: function(u) {
        return this.allowEnv.hasOwnProperty(u.replace(/\*$/, "")) || !1;
      }
    };
  })(ot)), ot;
}
var nr;
function Dn() {
  return nr || (nr = 1, (function(v) {
    var C = Tt && Tt.__extends || /* @__PURE__ */ (function() {
      var i = function(d, p) {
        return i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, m) {
          r.__proto__ = m;
        } || function(r, m) {
          for (var _ in m) Object.prototype.hasOwnProperty.call(m, _) && (r[_] = m[_]);
        }, i(d, p);
      };
      return function(d, p) {
        if (typeof p != "function" && p !== null)
          throw new TypeError("Class extends value " + String(p) + " is not a constructor or null");
        i(d, p);
        function r() {
          this.constructor = d;
        }
        d.prototype = p === null ? Object.create(p) : (r.prototype = p.prototype, new r());
      };
    })(), g = Tt && Tt.__importDefault || function(i) {
      return i && i.__esModule ? i : { default: i };
    }, y;
    Object.defineProperty(v, "__esModule", { value: !0 }), v.CasesConfiguration = v.CasesMethods = v.CasesTags = v.CasesBeginItem = void 0;
    var t = R(), e = F(), n = g(V()), u = g(st()), l = g(U()), c = jt(), a = Zr(), f = Jr(), o = (function(i) {
      C(d, i);
      function d() {
        return i !== null && i.apply(this, arguments) || this;
      }
      return Object.defineProperty(d.prototype, "kind", {
        get: function() {
          return "cases-begin";
        },
        enumerable: !1,
        configurable: !0
      }), d.prototype.checkItem = function(p) {
        return p.isKind("end") && p.getName() === this.getName() && this.getProperty("end") ? (this.setProperty("end", !1), [[], !0]) : i.prototype.checkItem.call(this, p);
      }, d;
    })(c.BeginItem);
    v.CasesBeginItem = o;
    var h = (function(i) {
      C(d, i);
      function d() {
        var p = i !== null && i.apply(this, arguments) || this;
        return p.subcounter = 0, p;
      }
      return d.prototype.start = function(p, r, m) {
        this.subcounter = 0, i.prototype.start.call(this, p, r, m);
      }, d.prototype.autoTag = function() {
        this.currentTag.tag == null && (this.currentTag.env === "subnumcases" ? (this.subcounter === 0 && this.counter++, this.subcounter++, this.tag(this.formatNumber(this.counter, this.subcounter), !1)) : ((this.subcounter === 0 || this.currentTag.env !== "numcases-left") && this.counter++, this.tag(this.formatNumber(this.counter), !1)));
      }, d.prototype.formatNumber = function(p, r) {
        return r === void 0 && (r = null), p.toString() + (r === null ? "" : String.fromCharCode(96 + r));
      }, d;
    })(a.AmsTags);
    v.CasesTags = h, v.CasesMethods = {
      NumCases: function(i, d) {
        if (i.stack.env.closing === d.getName()) {
          delete i.stack.env.closing, i.Push(i.itemFactory.create("end").setProperty("name", d.getName()));
          var p = i.stack.Top(), r = p.Last, m = n.default.copyNode(r, i), _ = p.getProperty("left");
          return f.EmpheqUtil.left(r, m, _ + "\\empheqlbrace\\,", i, "numcases-left"), i.Push(i.itemFactory.create("end").setProperty("name", d.getName())), null;
        } else {
          var _ = i.GetArgument("\\begin{" + d.getName() + "}");
          d.setProperty("left", _);
          var x = u.default.EqnArray(i, d, !0, !0, "ll");
          return x.arraydef.displaystyle = !1, x.arraydef.rowspacing = ".2em", x.setProperty("numCases", !0), i.Push(d), x;
        }
      },
      Entry: function(i, d) {
        if (!i.stack.Top().getProperty("numCases"))
          return u.default.Entry(i, d);
        i.Push(i.itemFactory.create("cell").setProperties({ isEntry: !0, name: d }));
        for (var p = i.string, r = 0, m = i.i, _ = p.length; m < _; ) {
          var x = p.charAt(m);
          if (x === "{")
            r++, m++;
          else if (x === "}") {
            if (r === 0)
              break;
            r--, m++;
          } else {
            if (x === "&" && r === 0)
              throw new l.default("ExtraCasesAlignTab", "Extra alignment tab in text for numcase environment");
            if (x === "\\" && r === 0) {
              var A = (p.slice(m + 1).match(/^[a-z]+|./i) || [])[0];
              if (A === "\\" || A === "cr" || A === "end" || A === "label")
                break;
              m += A.length;
            } else
              m++;
          }
        }
        var s = p.substr(i.i, m - i.i).replace(/^\s*/, "");
        i.PushAll(n.default.internalMath(i, s, 0)), i.i = m;
      }
    }, new e.EnvironmentMap("cases-env", f.EmpheqUtil.environment, {
      numcases: ["NumCases", "cases"],
      subnumcases: ["NumCases", "cases"]
    }, v.CasesMethods), new e.MacroMap("cases-macros", {
      "&": "Entry"
    }, v.CasesMethods), v.CasesConfiguration = t.Configuration.create("cases", {
      handler: {
        environment: ["cases-env"],
        character: ["cases-macros"]
      },
      items: (y = {}, y[o.prototype.kind] = o, y),
      tags: { cases: h }
    });
  })(Tt)), Tt;
}
var it = {}, ar;
function In() {
  if (ar) return it;
  ar = 1;
  var v = it && it.__values || function(l) {
    var c = typeof Symbol == "function" && Symbol.iterator, a = c && l[c], f = 0;
    if (a) return a.call(l);
    if (l && typeof l.length == "number") return {
      next: function() {
        return l && f >= l.length && (l = void 0), { value: l && l[f++], done: !l };
      }
    };
    throw new TypeError(c ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, C = it && it.__importDefault || function(l) {
    return l && l.__esModule ? l : { default: l };
  };
  Object.defineProperty(it, "__esModule", { value: !0 }), it.CenternotConfiguration = it.filterCenterOver = void 0;
  var g = R(), y = C(rt()), t = C(W()), e = F(), n = C(st());
  new e.CommandMap("centernot", {
    centerOver: "CenterOver",
    centernot: ["Macro", "\\centerOver{#1}{{⧸}}", 1]
  }, {
    CenterOver: function(l, c) {
      var a = "{" + l.GetArgument(c) + "}", f = l.ParseArg(c), o = new y.default(a, l.stack.env, l.configuration).mml(), h = l.create("node", "TeXAtom", [
        new y.default(a, l.stack.env, l.configuration).mml(),
        l.create("node", "mpadded", [
          l.create("node", "mpadded", [f], { width: 0, lspace: "-.5width" }),
          l.create("node", "mphantom", [o])
        ], { width: 0, lspace: "-.5width" })
      ]);
      l.configuration.addNode("centerOver", o), l.Push(h);
    },
    Macro: n.default.Macro
  });
  function u(l) {
    var c, a, f = l.data;
    try {
      for (var o = v(f.getList("centerOver")), h = o.next(); !h.done; h = o.next()) {
        var i = h.value, d = t.default.getTexClass(i.childNodes[0].childNodes[0]);
        d !== null && t.default.setProperties(i.parent.parent.parent.parent.parent.parent, { texClass: d });
      }
    } catch (p) {
      c = { error: p };
    } finally {
      try {
        h && !h.done && (a = o.return) && a.call(o);
      } finally {
        if (c) throw c.error;
      }
    }
  }
  return it.filterCenterOver = u, it.CenternotConfiguration = g.Configuration.create("centernot", {
    handler: { macro: ["centernot"] },
    postprocessors: [u]
  }), it;
}
var Zt = {}, Yt = {}, or;
function jn() {
  return or || (or = 1, (function(v) {
    var C = Yt && Yt.__importDefault || function(e) {
      return e && e.__esModule ? e : { default: e };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.ColorMethods = void 0;
    var g = C(W()), y = C(V());
    function t(e) {
      var n = "+".concat(e), u = e.replace(/^.*?([a-z]*)$/, "$1"), l = 2 * parseFloat(n);
      return {
        width: "+".concat(l).concat(u),
        height: n,
        depth: n,
        lspace: e
      };
    }
    v.ColorMethods = {}, v.ColorMethods.Color = function(e, n) {
      var u = e.GetBrackets(n, ""), l = e.GetArgument(n), c = e.configuration.packageData.get("color").model, a = c.getColor(u, l), f = e.itemFactory.create("style").setProperties({ styles: { mathcolor: a } });
      e.stack.env.color = a, e.Push(f);
    }, v.ColorMethods.TextColor = function(e, n) {
      var u = e.GetBrackets(n, ""), l = e.GetArgument(n), c = e.configuration.packageData.get("color").model, a = c.getColor(u, l), f = e.stack.env.color;
      e.stack.env.color = a;
      var o = e.ParseArg(n);
      f ? e.stack.env.color = f : delete e.stack.env.color;
      var h = e.create("node", "mstyle", [o], { mathcolor: a });
      e.Push(h);
    }, v.ColorMethods.DefineColor = function(e, n) {
      var u = e.GetArgument(n), l = e.GetArgument(n), c = e.GetArgument(n), a = e.configuration.packageData.get("color").model;
      a.defineColor(l, u, c);
    }, v.ColorMethods.ColorBox = function(e, n) {
      var u = e.GetArgument(n), l = y.default.internalMath(e, e.GetArgument(n)), c = e.configuration.packageData.get("color").model, a = e.create("node", "mpadded", l, {
        mathbackground: c.getColor("named", u)
      });
      g.default.setProperties(a, t(e.options.color.padding)), e.Push(a);
    }, v.ColorMethods.FColorBox = function(e, n) {
      var u = e.GetArgument(n), l = e.GetArgument(n), c = y.default.internalMath(e, e.GetArgument(n)), a = e.options.color, f = e.configuration.packageData.get("color").model, o = e.create("node", "mpadded", c, {
        mathbackground: f.getColor("named", l),
        style: "border: ".concat(a.borderWidth, " solid ").concat(f.getColor("named", u))
      });
      g.default.setProperties(o, t(a.padding)), e.Push(o);
    };
  })(Yt)), Yt;
}
var pt = {}, Jt = {}, ir;
function Nn() {
  return ir || (ir = 1, Object.defineProperty(Jt, "__esModule", { value: !0 }), Jt.COLORS = void 0, Jt.COLORS = /* @__PURE__ */ new Map([
    ["Apricot", "#FBB982"],
    ["Aquamarine", "#00B5BE"],
    ["Bittersweet", "#C04F17"],
    ["Black", "#221E1F"],
    ["Blue", "#2D2F92"],
    ["BlueGreen", "#00B3B8"],
    ["BlueViolet", "#473992"],
    ["BrickRed", "#B6321C"],
    ["Brown", "#792500"],
    ["BurntOrange", "#F7921D"],
    ["CadetBlue", "#74729A"],
    ["CarnationPink", "#F282B4"],
    ["Cerulean", "#00A2E3"],
    ["CornflowerBlue", "#41B0E4"],
    ["Cyan", "#00AEEF"],
    ["Dandelion", "#FDBC42"],
    ["DarkOrchid", "#A4538A"],
    ["Emerald", "#00A99D"],
    ["ForestGreen", "#009B55"],
    ["Fuchsia", "#8C368C"],
    ["Goldenrod", "#FFDF42"],
    ["Gray", "#949698"],
    ["Green", "#00A64F"],
    ["GreenYellow", "#DFE674"],
    ["JungleGreen", "#00A99A"],
    ["Lavender", "#F49EC4"],
    ["LimeGreen", "#8DC73E"],
    ["Magenta", "#EC008C"],
    ["Mahogany", "#A9341F"],
    ["Maroon", "#AF3235"],
    ["Melon", "#F89E7B"],
    ["MidnightBlue", "#006795"],
    ["Mulberry", "#A93C93"],
    ["NavyBlue", "#006EB8"],
    ["OliveGreen", "#3C8031"],
    ["Orange", "#F58137"],
    ["OrangeRed", "#ED135A"],
    ["Orchid", "#AF72B0"],
    ["Peach", "#F7965A"],
    ["Periwinkle", "#7977B8"],
    ["PineGreen", "#008B72"],
    ["Plum", "#92268F"],
    ["ProcessBlue", "#00B0F0"],
    ["Purple", "#99479B"],
    ["RawSienna", "#974006"],
    ["Red", "#ED1B23"],
    ["RedOrange", "#F26035"],
    ["RedViolet", "#A1246B"],
    ["Rhodamine", "#EF559F"],
    ["RoyalBlue", "#0071BC"],
    ["RoyalPurple", "#613F99"],
    ["RubineRed", "#ED017D"],
    ["Salmon", "#F69289"],
    ["SeaGreen", "#3FBC9D"],
    ["Sepia", "#671800"],
    ["SkyBlue", "#46C5DD"],
    ["SpringGreen", "#C6DC67"],
    ["Tan", "#DA9D76"],
    ["TealBlue", "#00AEB3"],
    ["Thistle", "#D883B7"],
    ["Turquoise", "#00B4CE"],
    ["Violet", "#58429B"],
    ["VioletRed", "#EF58A0"],
    ["White", "#FFFFFF"],
    ["WildStrawberry", "#EE2967"],
    ["Yellow", "#FFF200"],
    ["YellowGreen", "#98CC70"],
    ["YellowOrange", "#FAA21A"]
  ])), Jt;
}
var ur;
function Gn() {
  if (ur) return pt;
  ur = 1;
  var v = pt && pt.__values || function(n) {
    var u = typeof Symbol == "function" && Symbol.iterator, l = u && n[u], c = 0;
    if (l) return l.call(n);
    if (n && typeof n.length == "number") return {
      next: function() {
        return n && c >= n.length && (n = void 0), { value: n && n[c++], done: !n };
      }
    };
    throw new TypeError(u ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, C = pt && pt.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(pt, "__esModule", { value: !0 }), pt.ColorModel = void 0;
  var g = C(U()), y = Nn(), t = /* @__PURE__ */ new Map(), e = (function() {
    function n() {
      this.userColors = /* @__PURE__ */ new Map();
    }
    return n.prototype.normalizeColor = function(u, l) {
      if (!u || u === "named")
        return l;
      if (t.has(u)) {
        var c = t.get(u);
        return c(l);
      }
      throw new g.default("UndefinedColorModel", "Color model '%1' not defined", u);
    }, n.prototype.getColor = function(u, l) {
      return !u || u === "named" ? this.getColorByName(l) : this.normalizeColor(u, l);
    }, n.prototype.getColorByName = function(u) {
      return this.userColors.has(u) ? this.userColors.get(u) : y.COLORS.has(u) ? y.COLORS.get(u) : u;
    }, n.prototype.defineColor = function(u, l, c) {
      var a = this.normalizeColor(u, c);
      this.userColors.set(l, a);
    }, n;
  })();
  return pt.ColorModel = e, t.set("rgb", function(n) {
    var u, l, c = n.trim().split(/\s*,\s*/), a = "#";
    if (c.length !== 3)
      throw new g.default("ModelArg1", "Color values for the %1 model require 3 numbers", "rgb");
    try {
      for (var f = v(c), o = f.next(); !o.done; o = f.next()) {
        var h = o.value;
        if (!h.match(/^(\d+(\.\d*)?|\.\d+)$/))
          throw new g.default("InvalidDecimalNumber", "Invalid decimal number");
        var i = parseFloat(h);
        if (i < 0 || i > 1)
          throw new g.default("ModelArg2", "Color values for the %1 model must be between %2 and %3", "rgb", "0", "1");
        var d = Math.floor(i * 255).toString(16);
        d.length < 2 && (d = "0" + d), a += d;
      }
    } catch (p) {
      u = { error: p };
    } finally {
      try {
        o && !o.done && (l = f.return) && l.call(f);
      } finally {
        if (u) throw u.error;
      }
    }
    return a;
  }), t.set("RGB", function(n) {
    var u, l, c = n.trim().split(/\s*,\s*/), a = "#";
    if (c.length !== 3)
      throw new g.default("ModelArg1", "Color values for the %1 model require 3 numbers", "RGB");
    try {
      for (var f = v(c), o = f.next(); !o.done; o = f.next()) {
        var h = o.value;
        if (!h.match(/^\d+$/))
          throw new g.default("InvalidNumber", "Invalid number");
        var i = parseInt(h);
        if (i > 255)
          throw new g.default("ModelArg2", "Color values for the %1 model must be between %2 and %3", "RGB", "0", "255");
        var d = i.toString(16);
        d.length < 2 && (d = "0" + d), a += d;
      }
    } catch (p) {
      u = { error: p };
    } finally {
      try {
        o && !o.done && (l = f.return) && l.call(f);
      } finally {
        if (u) throw u.error;
      }
    }
    return a;
  }), t.set("gray", function(n) {
    if (!n.match(/^\s*(\d+(\.\d*)?|\.\d+)\s*$/))
      throw new g.default("InvalidDecimalNumber", "Invalid decimal number");
    var u = parseFloat(n);
    if (u < 0 || u > 1)
      throw new g.default("ModelArg2", "Color values for the %1 model must be between %2 and %3", "gray", "0", "1");
    var l = Math.floor(u * 255).toString(16);
    return l.length < 2 && (l = "0" + l), "#".concat(l).concat(l).concat(l);
  }), pt;
}
var lr;
function Fn() {
  if (lr) return Zt;
  lr = 1, Object.defineProperty(Zt, "__esModule", { value: !0 }), Zt.ColorConfiguration = void 0;
  var v = F(), C = R(), g = jn(), y = Gn();
  new v.CommandMap("color", {
    color: "Color",
    textcolor: "TextColor",
    definecolor: "DefineColor",
    colorbox: "ColorBox",
    fcolorbox: "FColorBox"
  }, g.ColorMethods);
  var t = function(e, n) {
    n.parseOptions.packageData.set("color", { model: new y.ColorModel() });
  };
  return Zt.ColorConfiguration = C.Configuration.create("color", {
    handler: {
      macro: ["color"]
    },
    options: {
      color: {
        padding: "5px",
        borderWidth: "2px"
      }
    },
    config: t
  }), Zt;
}
var be = {}, sr;
function Rn() {
  return sr || (sr = 1, (function(v) {
    Object.defineProperty(v, "__esModule", { value: !0 }), v.ColorConfiguration = v.ColorV2Methods = void 0;
    var C = F(), g = R();
    v.ColorV2Methods = {
      Color: function(y, t) {
        var e = y.GetArgument(t), n = y.stack.env.color;
        y.stack.env.color = e;
        var u = y.ParseArg(t);
        n ? y.stack.env.color = n : delete y.stack.env.color;
        var l = y.create("node", "mstyle", [u], { mathcolor: e });
        y.Push(l);
      }
    }, new C.CommandMap("colorv2", { color: "Color" }, v.ColorV2Methods), v.ColorConfiguration = g.Configuration.create("colorv2", { handler: { macro: ["colorv2"] } });
  })(be)), be;
}
var ut = {}, cr;
function Ln() {
  if (cr) return ut;
  cr = 1;
  var v = ut && ut.__extends || /* @__PURE__ */ (function() {
    var l = function(c, a) {
      return l = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(f, o) {
        f.__proto__ = o;
      } || function(f, o) {
        for (var h in o) Object.prototype.hasOwnProperty.call(o, h) && (f[h] = o[h]);
      }, l(c, a);
    };
    return function(c, a) {
      if (typeof a != "function" && a !== null)
        throw new TypeError("Class extends value " + String(a) + " is not a constructor or null");
      l(c, a);
      function f() {
        this.constructor = c;
      }
      c.prototype = a === null ? Object.create(a) : (f.prototype = a.prototype, new f());
    };
  })(), C = ut && ut.__importDefault || function(l) {
    return l && l.__esModule ? l : { default: l };
  };
  Object.defineProperty(ut, "__esModule", { value: !0 }), ut.ColortblConfiguration = ut.ColorArrayItem = void 0;
  var g = jt(), y = R(), t = F(), e = C(U()), n = (function(l) {
    v(c, l);
    function c() {
      var a = l !== null && l.apply(this, arguments) || this;
      return a.color = {
        cell: "",
        row: "",
        col: []
      }, a.hasColor = !1, a;
    }
    return c.prototype.EndEntry = function() {
      l.prototype.EndEntry.call(this);
      var a = this.row[this.row.length - 1], f = this.color.cell || this.color.row || this.color.col[this.row.length - 1];
      f && (a.attributes.set("mathbackground", f), this.color.cell = "", this.hasColor = !0);
    }, c.prototype.EndRow = function() {
      l.prototype.EndRow.call(this), this.color.row = "";
    }, c.prototype.createMml = function() {
      var a = l.prototype.createMml.call(this), f = a.isKind("mrow") ? a.childNodes[1] : a;
      return f.isKind("menclose") && (f = f.childNodes[0].childNodes[0]), this.hasColor && f.attributes.get("frame") === "none" && f.attributes.set("frame", ""), a;
    }, c;
  })(g.ArrayItem);
  ut.ColorArrayItem = n, new t.CommandMap("colortbl", {
    cellcolor: ["TableColor", "cell"],
    rowcolor: ["TableColor", "row"],
    columncolor: ["TableColor", "col"]
  }, {
    TableColor: function(l, c, a) {
      var f = l.configuration.packageData.get("color").model, o = l.GetBrackets(c, ""), h = f.getColor(o, l.GetArgument(c)), i = l.stack.Top();
      if (!(i instanceof n))
        throw new e.default("UnsupportedTableColor", "Unsupported use of %1", l.currentCS);
      if (a === "col") {
        if (i.table.length)
          throw new e.default("ColumnColorNotTop", "%1 must be in the top row", c);
        i.color.col[i.row.length] = h, l.GetBrackets(c, "") && l.GetBrackets(c, "");
      } else if (i.color[a] = h, a === "row" && (i.Size() || i.row.length))
        throw new e.default("RowColorNotFirst", "%1 must be at the beginning of a row", c);
    }
  });
  var u = function(l, c) {
    c.parseOptions.packageData.has("color") || y.ConfigurationHandler.get("color").config(l, c);
  };
  return ut.ColortblConfiguration = y.Configuration.create("colortbl", {
    handler: { macro: ["colortbl"] },
    items: { array: n },
    priority: 10,
    config: [u, 10]
  }), ut;
}
var gt = {}, et = {}, Ft = {}, fr;
function xe() {
  if (fr) return Ft;
  fr = 1;
  var v = Ft && Ft.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(Ft, "__esModule", { value: !0 });
  var C = v(V()), g = v(U()), y = me(), t;
  return (function(e) {
    function n(r, m) {
      var _ = [r, m.char];
      if (m.attributes)
        for (var x in m.attributes)
          _.push(x), _.push(m.attributes[x]);
      return _;
    }
    e.disassembleSymbol = n;
    function u(r) {
      for (var m = r[0], _ = r[1], x = {}, A = 2; A < r.length; A = A + 2)
        x[r[A]] = r[A + 1];
      return new y.Symbol(m, _, x);
    }
    e.assembleSymbol = u;
    function l(r, m) {
      var _ = r.GetNext();
      if (_ !== "\\")
        throw new g.default("MissingCS", "%1 must be followed by a control sequence", m);
      var x = C.default.trimSpaces(r.GetArgument(m));
      return x.substr(1);
    }
    e.GetCSname = l;
    function c(r, m) {
      var _ = C.default.trimSpaces(r.GetArgument(m));
      if (_.charAt(0) === "\\" && (_ = _.substr(1)), !_.match(/^(.|[a-z]+)$/i))
        throw new g.default("IllegalControlSequenceName", "Illegal control sequence name for %1", m);
      return _;
    }
    e.GetCsNameArgument = c;
    function a(r, m) {
      var _ = r.GetBrackets(m);
      if (_ && (_ = C.default.trimSpaces(_), !_.match(/^[0-9]+$/)))
        throw new g.default("IllegalParamNumber", "Illegal number of parameters specified in %1", m);
      return _;
    }
    e.GetArgCount = a;
    function f(r, m, _) {
      for (var x = r.GetNext(), A = [], s = 0, M = r.i; r.i < r.string.length; ) {
        if (x = r.GetNext(), x === "#") {
          if (M !== r.i && (A[s] = r.string.substr(M, r.i - M)), x = r.string.charAt(++r.i), !x.match(/^[1-9]$/))
            throw new g.default("CantUseHash2", "Illegal use of # in template for %1", _);
          if (parseInt(x) !== ++s)
            throw new g.default("SequentialParam", "Parameters for %1 must be numbered sequentially", _);
          M = r.i + 1;
        } else if (x === "{")
          return M !== r.i && (A[s] = r.string.substr(M, r.i - M)), A.length > 0 ? [s.toString()].concat(A) : s;
        r.i++;
      }
      throw new g.default("MissingReplacementString", "Missing replacement string for definition of %1", m);
    }
    e.GetTemplate = f;
    function o(r, m, _) {
      if (_ == null)
        return r.GetArgument(m);
      for (var x = r.i, A = 0, s = 0; r.i < r.string.length; ) {
        var M = r.string.charAt(r.i);
        if (M === "{")
          r.i === x && (s = 1), r.GetArgument(m), A = r.i - x;
        else {
          if (h(r, _))
            return s && (x++, A -= 2), r.string.substr(x, A);
          if (M === "\\") {
            r.i++, A++, s = 0;
            var w = r.string.substr(r.i).match(/[a-z]+|./i);
            w && (r.i += w[0].length, A = r.i - x);
          } else
            r.i++, A++, s = 0;
        }
      }
      throw new g.default("RunawayArgument", "Runaway argument for %1?", m);
    }
    e.GetParameter = o;
    function h(r, m) {
      return r.string.substr(r.i, m.length) !== m || m.match(/\\[a-z]+$/i) && r.string.charAt(r.i + m.length).match(/[a-z]/i) ? 0 : (r.i += m.length, 1);
    }
    e.MatchParam = h;
    function i(r, m, _, x) {
      var A = r.configuration.handlers, s = A.retrieve(e.NEW_DELIMITER);
      s.add(m, new y.Symbol(m, _, x));
    }
    e.addDelimiter = i;
    function d(r, m, _, x, A) {
      A === void 0 && (A = "");
      var s = r.configuration.handlers, M = s.retrieve(e.NEW_COMMAND);
      M.add(m, new y.Macro(A || m, _, x));
    }
    e.addMacro = d;
    function p(r, m, _, x) {
      var A = r.configuration.handlers, s = A.retrieve(e.NEW_ENVIRONMENT);
      s.add(m, new y.Macro(m, _, x));
    }
    e.addEnvironment = p, e.NEW_DELIMITER = "new-Delimiter", e.NEW_COMMAND = "new-Command", e.NEW_ENVIRONMENT = "new-Environment";
  })(t || (t = {})), Ft.default = t, Ft;
}
var dr;
function Te() {
  if (dr) return et;
  dr = 1;
  var v = et && et.__createBinding || (Object.create ? (function(a, f, o, h) {
    h === void 0 && (h = o);
    var i = Object.getOwnPropertyDescriptor(f, o);
    (!i || ("get" in i ? !f.__esModule : i.writable || i.configurable)) && (i = { enumerable: !0, get: function() {
      return f[o];
    } }), Object.defineProperty(a, h, i);
  }) : (function(a, f, o, h) {
    h === void 0 && (h = o), a[h] = f[o];
  })), C = et && et.__setModuleDefault || (Object.create ? (function(a, f) {
    Object.defineProperty(a, "default", { enumerable: !0, value: f });
  }) : function(a, f) {
    a.default = f;
  }), g = et && et.__importStar || function(a) {
    if (a && a.__esModule) return a;
    var f = {};
    if (a != null) for (var o in a) o !== "default" && Object.prototype.hasOwnProperty.call(a, o) && v(f, a, o);
    return C(f, a), f;
  }, y = et && et.__importDefault || function(a) {
    return a && a.__esModule ? a : { default: a };
  };
  Object.defineProperty(et, "__esModule", { value: !0 });
  var t = y(U()), e = g(F()), n = y(st()), u = y(V()), l = y(xe()), c = {};
  return c.NewCommand = function(a, f) {
    var o = l.default.GetCsNameArgument(a, f), h = l.default.GetArgCount(a, f), i = a.GetBrackets(f), d = a.GetArgument(f);
    l.default.addMacro(a, o, c.Macro, [d, h, i]);
  }, c.NewEnvironment = function(a, f) {
    var o = u.default.trimSpaces(a.GetArgument(f)), h = l.default.GetArgCount(a, f), i = a.GetBrackets(f), d = a.GetArgument(f), p = a.GetArgument(f);
    l.default.addEnvironment(a, o, c.BeginEnv, [!0, d, p, h, i]);
  }, c.MacroDef = function(a, f) {
    var o = l.default.GetCSname(a, f), h = l.default.GetTemplate(a, f, "\\" + o), i = a.GetArgument(f);
    h instanceof Array ? l.default.addMacro(a, o, c.MacroWithTemplate, [i].concat(h)) : l.default.addMacro(a, o, c.Macro, [i, h]);
  }, c.Let = function(a, f) {
    var o = l.default.GetCSname(a, f), h = a.GetNext();
    h === "=" && (a.i++, h = a.GetNext());
    var i = a.configuration.handlers;
    if (h === "\\") {
      f = l.default.GetCSname(a, f);
      var d = i.get("delimiter").lookup("\\" + f);
      if (d) {
        l.default.addDelimiter(a, "\\" + o, d.char, d.attributes);
        return;
      }
      var p = i.get("macro").applicable(f);
      if (!p)
        return;
      if (p instanceof e.MacroMap) {
        var r = p.lookup(f);
        l.default.addMacro(a, o, r.func, r.args, r.symbol);
        return;
      }
      d = p.lookup(f);
      var m = l.default.disassembleSymbol(o, d), _ = function(A, s) {
        for (var M = [], w = 2; w < arguments.length; w++)
          M[w - 2] = arguments[w];
        var b = l.default.assembleSymbol(M);
        return p.parser(A, b);
      };
      l.default.addMacro(a, o, _, m);
      return;
    }
    a.i++;
    var x = i.get("delimiter").lookup(h);
    if (x) {
      l.default.addDelimiter(a, "\\" + o, x.char, x.attributes);
      return;
    }
    l.default.addMacro(a, o, c.Macro, [h]);
  }, c.MacroWithTemplate = function(a, f, o, h) {
    for (var i = [], d = 4; d < arguments.length; d++)
      i[d - 4] = arguments[d];
    var p = parseInt(h, 10);
    if (p) {
      var r = [];
      if (a.GetNext(), i[0] && !l.default.MatchParam(a, i[0]))
        throw new t.default("MismatchUseDef", "Use of %1 doesn't match its definition", f);
      for (var m = 0; m < p; m++)
        r.push(l.default.GetParameter(a, f, i[m + 1]));
      o = u.default.substituteArgs(a, r, o);
    }
    a.string = u.default.addArgs(a, o, a.string.slice(a.i)), a.i = 0, u.default.checkMaxMacros(a);
  }, c.BeginEnv = function(a, f, o, h, i, d) {
    if (f.getProperty("end") && a.stack.env.closing === f.getName()) {
      delete a.stack.env.closing;
      var p = a.string.slice(a.i);
      return a.string = h, a.i = 0, a.Parse(), a.string = p, a.i = 0, a.itemFactory.create("end").setProperty("name", f.getName());
    }
    if (i) {
      var r = [];
      if (d != null) {
        var m = a.GetBrackets("\\begin{" + f.getName() + "}");
        r.push(m ?? d);
      }
      for (var _ = r.length; _ < i; _++)
        r.push(a.GetArgument("\\begin{" + f.getName() + "}"));
      o = u.default.substituteArgs(a, r, o), h = u.default.substituteArgs(a, [], h);
    }
    return a.string = u.default.addArgs(a, o, a.string.slice(a.i)), a.i = 0, a.itemFactory.create("beginEnv").setProperty("name", f.getName());
  }, c.Macro = n.default.Macro, et.default = c, et;
}
var _t = {}, mr;
function tn() {
  if (mr) return _t;
  mr = 1;
  var v = _t && _t.__extends || /* @__PURE__ */ (function() {
    var e = function(n, u) {
      return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(l, c) {
        l.__proto__ = c;
      } || function(l, c) {
        for (var a in c) Object.prototype.hasOwnProperty.call(c, a) && (l[a] = c[a]);
      }, e(n, u);
    };
    return function(n, u) {
      if (typeof u != "function" && u !== null)
        throw new TypeError("Class extends value " + String(u) + " is not a constructor or null");
      e(n, u);
      function l() {
        this.constructor = n;
      }
      n.prototype = u === null ? Object.create(u) : (l.prototype = u.prototype, new l());
    };
  })(), C = _t && _t.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(_t, "__esModule", { value: !0 }), _t.BeginEnvItem = void 0;
  var g = C(U()), y = ye(), t = (function(e) {
    v(n, e);
    function n() {
      return e !== null && e.apply(this, arguments) || this;
    }
    return Object.defineProperty(n.prototype, "kind", {
      get: function() {
        return "beginEnv";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.checkItem = function(u) {
      if (u.isKind("end")) {
        if (u.getName() !== this.getName())
          throw new g.default("EnvBadEnd", "\\begin{%1} ended with \\end{%2}", this.getName(), u.getName());
        return [[this.factory.create("mml", this.toMml())], !0];
      }
      if (u.isKind("stop"))
        throw new g.default("EnvMissingEnd", "Missing \\end{%1}", this.getName());
      return e.prototype.checkItem.call(this, u);
    }, n;
  })(y.BaseItem);
  return _t.BeginEnvItem = t, _t;
}
var hr;
function $n() {
  if (hr) return gt;
  hr = 1;
  var v = gt && gt.__values || function(p) {
    var r = typeof Symbol == "function" && Symbol.iterator, m = r && p[r], _ = 0;
    if (m) return m.call(p);
    if (p && typeof p.length == "number") return {
      next: function() {
        return p && _ >= p.length && (p = void 0), { value: p && p[_++], done: !p };
      }
    };
    throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, C = gt && gt.__importDefault || function(p) {
    return p && p.__esModule ? p : { default: p };
  }, g;
  Object.defineProperty(gt, "__esModule", { value: !0 }), gt.ConfigMacrosConfiguration = void 0;
  var y = R(), t = he(), e = F(), n = C(St()), u = me(), l = C(Te()), c = tn(), a = "configmacros-map", f = "configmacros-env-map";
  function o(p) {
    new e.CommandMap(a, {}, {}), new e.EnvironmentMap(f, n.default.environment, {}, {}), p.append(y.Configuration.local({
      handler: {
        macro: [a],
        environment: [f]
      },
      priority: 3
    }));
  }
  function h(p, r) {
    i(r), d(r);
  }
  function i(p) {
    var r, m, _ = p.parseOptions.handlers.retrieve(a), x = p.parseOptions.options.macros;
    try {
      for (var A = v(Object.keys(x)), s = A.next(); !s.done; s = A.next()) {
        var M = s.value, w = typeof x[M] == "string" ? [x[M]] : x[M], b = Array.isArray(w[2]) ? new u.Macro(M, l.default.MacroWithTemplate, w.slice(0, 2).concat(w[2])) : new u.Macro(M, l.default.Macro, w);
        _.add(M, b);
      }
    } catch (P) {
      r = { error: P };
    } finally {
      try {
        s && !s.done && (m = A.return) && m.call(A);
      } finally {
        if (r) throw r.error;
      }
    }
  }
  function d(p) {
    var r, m, _ = p.parseOptions.handlers.retrieve(f), x = p.parseOptions.options.environments;
    try {
      for (var A = v(Object.keys(x)), s = A.next(); !s.done; s = A.next()) {
        var M = s.value;
        _.add(M, new u.Macro(M, l.default.BeginEnv, [!0].concat(x[M])));
      }
    } catch (w) {
      r = { error: w };
    } finally {
      try {
        s && !s.done && (m = A.return) && m.call(A);
      } finally {
        if (r) throw r.error;
      }
    }
  }
  return gt.ConfigMacrosConfiguration = y.Configuration.create("configmacros", {
    init: o,
    config: h,
    items: (g = {}, g[c.BeginEnvItem.prototype.kind] = c.BeginEnvItem, g),
    options: {
      macros: (0, t.expandable)({}),
      environments: (0, t.expandable)({})
    }
  }), gt;
}
var yt = {}, vr;
function Un() {
  return vr || (vr = 1, (function(v) {
    var C = yt && yt.__extends || /* @__PURE__ */ (function() {
      var o = function(h, i) {
        return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, p) {
          d.__proto__ = p;
        } || function(d, p) {
          for (var r in p) Object.prototype.hasOwnProperty.call(p, r) && (d[r] = p[r]);
        }, o(h, i);
      };
      return function(h, i) {
        if (typeof i != "function" && i !== null)
          throw new TypeError("Class extends value " + String(i) + " is not a constructor or null");
        o(h, i);
        function d() {
          this.constructor = h;
        }
        h.prototype = i === null ? Object.create(i) : (d.prototype = i.prototype, new d());
      };
    })(), g = yt && yt.__read || function(o, h) {
      var i = typeof Symbol == "function" && o[Symbol.iterator];
      if (!i) return o;
      var d = i.call(o), p, r = [], m;
      try {
        for (; (h === void 0 || h-- > 0) && !(p = d.next()).done; ) r.push(p.value);
      } catch (_) {
        m = { error: _ };
      } finally {
        try {
          p && !p.done && (i = d.return) && i.call(d);
        } finally {
          if (m) throw m.error;
        }
      }
      return r;
    }, y = yt && yt.__importDefault || function(o) {
      return o && o.__esModule ? o : { default: o };
    }, t;
    Object.defineProperty(v, "__esModule", { value: !0 }), v.EmpheqConfiguration = v.EmpheqMethods = v.EmpheqBeginItem = void 0;
    var e = R(), n = F(), u = y(V()), l = y(U()), c = jt(), a = Jr(), f = (function(o) {
      C(h, o);
      function h() {
        return o !== null && o.apply(this, arguments) || this;
      }
      return Object.defineProperty(h.prototype, "kind", {
        get: function() {
          return "empheq-begin";
        },
        enumerable: !1,
        configurable: !0
      }), h.prototype.checkItem = function(i) {
        return i.isKind("end") && i.getName() === this.getName() && this.setProperty("end", !1), o.prototype.checkItem.call(this, i);
      }, h;
    })(c.BeginItem);
    v.EmpheqBeginItem = f, v.EmpheqMethods = {
      Empheq: function(o, h) {
        if (o.stack.env.closing === h.getName()) {
          delete o.stack.env.closing, o.Push(o.itemFactory.create("end").setProperty("name", o.stack.global.empheq)), o.stack.global.empheq = "";
          var i = o.stack.Top();
          a.EmpheqUtil.adjustTable(i, o), o.Push(o.itemFactory.create("end").setProperty("name", "empheq"));
        } else {
          u.default.checkEqnEnv(o), delete o.stack.global.eqnenv;
          var d = o.GetBrackets("\\begin{" + h.getName() + "}") || "", p = g((o.GetArgument("\\begin{" + h.getName() + "}") || "").split(/=/), 2), r = p[0], m = p[1];
          if (!a.EmpheqUtil.checkEnv(r))
            throw new l.default("UnknownEnv", 'Unknown environment "%1"', r);
          d && h.setProperties(a.EmpheqUtil.splitOptions(d, { left: 1, right: 1 })), o.stack.global.empheq = r, o.string = "\\begin{" + r + "}" + (m ? "{" + m + "}" : "") + o.string.slice(o.i), o.i = 0, o.Push(h);
        }
      },
      EmpheqMO: function(o, h, i) {
        o.Push(o.create("token", "mo", {}, i));
      },
      EmpheqDelim: function(o, h) {
        var i = o.GetDelimiter(h);
        o.Push(o.create("token", "mo", { stretchy: !0, symmetric: !0 }, i));
      }
    }, new n.EnvironmentMap("empheq-env", a.EmpheqUtil.environment, {
      empheq: ["Empheq", "empheq"]
    }, v.EmpheqMethods), new n.CommandMap("empheq-macros", {
      empheqlbrace: ["EmpheqMO", "{"],
      empheqrbrace: ["EmpheqMO", "}"],
      empheqlbrack: ["EmpheqMO", "["],
      empheqrbrack: ["EmpheqMO", "]"],
      empheqlangle: ["EmpheqMO", "⟨"],
      empheqrangle: ["EmpheqMO", "⟩"],
      empheqlparen: ["EmpheqMO", "("],
      empheqrparen: ["EmpheqMO", ")"],
      empheqlvert: ["EmpheqMO", "|"],
      empheqrvert: ["EmpheqMO", "|"],
      empheqlVert: ["EmpheqMO", "‖"],
      empheqrVert: ["EmpheqMO", "‖"],
      empheqlfloor: ["EmpheqMO", "⌊"],
      empheqrfloor: ["EmpheqMO", "⌋"],
      empheqlceil: ["EmpheqMO", "⌈"],
      empheqrceil: ["EmpheqMO", "⌉"],
      empheqbiglbrace: ["EmpheqMO", "{"],
      empheqbigrbrace: ["EmpheqMO", "}"],
      empheqbiglbrack: ["EmpheqMO", "["],
      empheqbigrbrack: ["EmpheqMO", "]"],
      empheqbiglangle: ["EmpheqMO", "⟨"],
      empheqbigrangle: ["EmpheqMO", "⟩"],
      empheqbiglparen: ["EmpheqMO", "("],
      empheqbigrparen: ["EmpheqMO", ")"],
      empheqbiglvert: ["EmpheqMO", "|"],
      empheqbigrvert: ["EmpheqMO", "|"],
      empheqbiglVert: ["EmpheqMO", "‖"],
      empheqbigrVert: ["EmpheqMO", "‖"],
      empheqbiglfloor: ["EmpheqMO", "⌊"],
      empheqbigrfloor: ["EmpheqMO", "⌋"],
      empheqbiglceil: ["EmpheqMO", "⌈"],
      empheqbigrceil: ["EmpheqMO", "⌉"],
      empheql: "EmpheqDelim",
      empheqr: "EmpheqDelim",
      empheqbigl: "EmpheqDelim",
      empheqbigr: "EmpheqDelim"
    }, v.EmpheqMethods), v.EmpheqConfiguration = e.Configuration.create("empheq", {
      handler: {
        macro: ["empheq-macros"],
        environment: ["empheq-env"]
      },
      items: (t = {}, t[f.prototype.kind] = f, t)
    });
  })(yt)), yt;
}
var te = {}, Y = {}, ee = {}, pr;
function Vn() {
  if (pr) return ee;
  pr = 1;
  var v = ee && ee.__importDefault || function(y) {
    return y && y.__esModule ? y : { default: y };
  };
  Object.defineProperty(ee, "__esModule", { value: !0 });
  var C = v(Te()), g = F();
  return new g.CommandMap("Newcommand-macros", {
    newcommand: "NewCommand",
    renewcommand: "NewCommand",
    newenvironment: "NewEnvironment",
    renewenvironment: "NewEnvironment",
    def: "MacroDef",
    let: "Let"
  }, C.default), ee;
}
var gr;
function en() {
  if (gr) return Y;
  gr = 1;
  var v = Y && Y.__createBinding || (Object.create ? (function(f, o, h, i) {
    i === void 0 && (i = h);
    var d = Object.getOwnPropertyDescriptor(o, h);
    (!d || ("get" in d ? !o.__esModule : d.writable || d.configurable)) && (d = { enumerable: !0, get: function() {
      return o[h];
    } }), Object.defineProperty(f, i, d);
  }) : (function(f, o, h, i) {
    i === void 0 && (i = h), f[i] = o[h];
  })), C = Y && Y.__setModuleDefault || (Object.create ? (function(f, o) {
    Object.defineProperty(f, "default", { enumerable: !0, value: o });
  }) : function(f, o) {
    f.default = o;
  }), g = Y && Y.__importStar || function(f) {
    if (f && f.__esModule) return f;
    var o = {};
    if (f != null) for (var h in f) h !== "default" && Object.prototype.hasOwnProperty.call(f, h) && v(o, f, h);
    return C(o, f), o;
  }, y = Y && Y.__importDefault || function(f) {
    return f && f.__esModule ? f : { default: f };
  }, t;
  Object.defineProperty(Y, "__esModule", { value: !0 }), Y.NewcommandConfiguration = void 0;
  var e = R(), n = tn(), u = y(xe());
  Vn();
  var l = y(St()), c = g(F()), a = function(f) {
    new c.DelimiterMap(u.default.NEW_DELIMITER, l.default.delimiter, {}), new c.CommandMap(u.default.NEW_COMMAND, {}, {}), new c.EnvironmentMap(u.default.NEW_ENVIRONMENT, l.default.environment, {}, {}), f.append(e.Configuration.local({
      handler: {
        character: [],
        delimiter: [u.default.NEW_DELIMITER],
        macro: [
          u.default.NEW_DELIMITER,
          u.default.NEW_COMMAND
        ],
        environment: [u.default.NEW_ENVIRONMENT]
      },
      priority: -1
    }));
  };
  return Y.NewcommandConfiguration = e.Configuration.create("newcommand", {
    handler: {
      macro: ["Newcommand-macros"]
    },
    items: (t = {}, t[n.BeginEnvItem.prototype.kind] = n.BeginEnvItem, t),
    options: { maxMacros: 1e3 },
    init: a
  }), Y;
}
var _r;
function zn() {
  return _r || (_r = 1, (function(v) {
    var C = te && te.__importDefault || function(c) {
      return c && c.__esModule ? c : { default: c };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.ExtpfeilConfiguration = v.ExtpfeilMethods = void 0;
    var g = R(), y = F(), t = ve(), e = C(xe()), n = en(), u = C(U());
    v.ExtpfeilMethods = {}, v.ExtpfeilMethods.xArrow = t.AmsMethods.xArrow, v.ExtpfeilMethods.NewExtArrow = function(c, a) {
      var f = c.GetArgument(a), o = c.GetArgument(a), h = c.GetArgument(a);
      if (!f.match(/^\\([a-z]+|.)$/i))
        throw new u.default("NewextarrowArg1", "First argument to %1 must be a control sequence name", a);
      if (!o.match(/^(\d+),(\d+)$/))
        throw new u.default("NewextarrowArg2", "Second argument to %1 must be two integers separated by a comma", a);
      if (!h.match(/^(\d+|0x[0-9A-F]+)$/i))
        throw new u.default("NewextarrowArg3", "Third argument to %1 must be a unicode character number", a);
      f = f.substr(1);
      var i = o.split(",");
      e.default.addMacro(c, f, v.ExtpfeilMethods.xArrow, [parseInt(h), parseInt(i[0]), parseInt(i[1])]);
    }, new y.CommandMap("extpfeil", {
      xtwoheadrightarrow: ["xArrow", 8608, 12, 16],
      xtwoheadleftarrow: ["xArrow", 8606, 17, 13],
      xmapsto: ["xArrow", 8614, 6, 7],
      xlongequal: ["xArrow", 61, 7, 7],
      xtofrom: ["xArrow", 8644, 12, 12],
      Newextarrow: "NewExtArrow"
    }, v.ExtpfeilMethods);
    var l = function(c) {
      n.NewcommandConfiguration.init(c);
    };
    v.ExtpfeilConfiguration = g.Configuration.create("extpfeil", {
      handler: { macro: ["extpfeil"] },
      init: l
    });
  })(te)), te;
}
var re = {}, yr;
function Hn() {
  if (yr) return re;
  yr = 1, Object.defineProperty(re, "__esModule", { value: !0 }), re.GensymbConfiguration = void 0;
  var v = R(), C = tt(), g = F();
  function y(t, e) {
    var n = e.attributes || {};
    n.mathvariant = C.TexConstant.Variant.NORMAL, n.class = "MathML-Unit";
    var u = t.create("token", "mi", n, e.char);
    t.Push(u);
  }
  return new g.CharacterMap("gensymb-symbols", y, {
    ohm: "Ω",
    degree: "°",
    celsius: "℃",
    perthousand: "‰",
    micro: "µ"
  }), re.GensymbConfiguration = v.Configuration.create("gensymb", {
    handler: { macro: ["gensymb-symbols"] }
  }), re;
}
var Et = {}, Rt = {}, xr;
function Xn() {
  if (xr) return Rt;
  xr = 1;
  var v = Rt && Rt.__importDefault || function(t) {
    return t && t.__esModule ? t : { default: t };
  };
  Object.defineProperty(Rt, "__esModule", { value: !0 });
  var C = v(W()), g = {};
  g.Href = function(t, e) {
    var n = t.GetArgument(e), u = y(t, e);
    C.default.setAttribute(u, "href", n), t.Push(u);
  }, g.Class = function(t, e) {
    var n = t.GetArgument(e), u = y(t, e), l = C.default.getAttribute(u, "class");
    l && (n = l + " " + n), C.default.setAttribute(u, "class", n), t.Push(u);
  }, g.Style = function(t, e) {
    var n = t.GetArgument(e), u = y(t, e), l = C.default.getAttribute(u, "style");
    l && (n.charAt(n.length - 1) !== ";" && (n += ";"), n = l + " " + n), C.default.setAttribute(u, "style", n), t.Push(u);
  }, g.Id = function(t, e) {
    var n = t.GetArgument(e), u = y(t, e);
    C.default.setAttribute(u, "id", n), t.Push(u);
  };
  var y = function(t, e) {
    var n = t.ParseArg(e);
    if (!C.default.isInferred(n))
      return n;
    var u = C.default.getChildren(n);
    if (u.length === 1)
      return u[0];
    var l = t.create("node", "mrow");
    return C.default.copyChildren(n, l), C.default.copyAttributes(n, l), l;
  };
  return Rt.default = g, Rt;
}
var Mr;
function Qn() {
  if (Mr) return Et;
  Mr = 1;
  var v = Et && Et.__importDefault || function(t) {
    return t && t.__esModule ? t : { default: t };
  };
  Object.defineProperty(Et, "__esModule", { value: !0 }), Et.HtmlConfiguration = void 0;
  var C = R(), g = F(), y = v(Xn());
  return new g.CommandMap("html_macros", {
    href: "Href",
    class: "Class",
    style: "Style",
    cssId: "Id"
  }, y.default), Et.HtmlConfiguration = C.Configuration.create("html", { handler: { macro: ["html_macros"] } }), Et;
}
var Ot = {}, ne = {}, lt = {}, xt = {}, Cr;
function rn() {
  if (Cr) return xt;
  Cr = 1;
  var v = xt && xt.__read || function(a, f) {
    var o = typeof Symbol == "function" && a[Symbol.iterator];
    if (!o) return a;
    var h = o.call(a), i, d = [], p;
    try {
      for (; (f === void 0 || f-- > 0) && !(i = h.next()).done; ) d.push(i.value);
    } catch (r) {
      p = { error: r };
    } finally {
      try {
        i && !i.done && (o = h.return) && o.call(h);
      } finally {
        if (p) throw p.error;
      }
    }
    return d;
  }, C = xt && xt.__importDefault || function(a) {
    return a && a.__esModule ? a : { default: a };
  };
  Object.defineProperty(xt, "__esModule", { value: !0 }), xt.MathtoolsUtil = void 0;
  var g = jt(), y = C(V()), t = C(rt()), e = C(U()), n = me(), u = he(), l = nn(), c = an();
  return xt.MathtoolsUtil = {
    setDisplayLevel: function(a, f) {
      if (f) {
        var o = v((0, u.lookup)(f, {
          "\\displaystyle": [!0, 0],
          "\\textstyle": [!1, 0],
          "\\scriptstyle": [!1, 1],
          "\\scriptscriptstyle": [!1, 2]
        }, [null, null]), 2), h = o[0], i = o[1];
        h !== null && (a.attributes.set("displaystyle", h), a.attributes.set("scriptlevel", i));
      }
    },
    checkAlignment: function(a, f) {
      var o = a.stack.Top();
      if (o.kind !== g.EqnArrayItem.prototype.kind)
        throw new e.default("NotInAlignment", "%1 can only be used in aligment environments", f);
      return o;
    },
    addPairedDelims: function(a, f, o) {
      var h = a.handlers.retrieve(c.PAIREDDELIMS);
      h.add(f, new n.Macro(f, l.MathtoolsMethods.PairedDelimiters, o));
    },
    spreadLines: function(a, f) {
      if (a.isKind("mtable")) {
        var o = a.attributes.get("rowspacing");
        if (o) {
          var h = y.default.dimen2em(f);
          o = o.split(/ /).map(function(i) {
            return y.default.Em(Math.max(0, y.default.dimen2em(i) + h));
          }).join(" ");
        } else
          o = f;
        a.attributes.set("rowspacing", o);
      }
    },
    plusOrMinus: function(a, f) {
      if (f = f.trim(), !f.match(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/))
        throw new e.default("NotANumber", "Argument to %1 is not a number", a);
      return f.match(/^[-+]/) ? f : "+" + f;
    },
    getScript: function(a, f, o) {
      var h = y.default.trimSpaces(a.GetArgument(f));
      if (h === "")
        return a.create("node", "none");
      var i = a.options.mathtools["prescript-".concat(o, "-format")];
      return i && (h = "".concat(i, "{").concat(h, "}")), new t.default(h, a.stack.env, a.configuration).mml();
    }
  }, xt;
}
var Ar;
function nn() {
  return Ar || (Ar = 1, (function(v) {
    var C = lt && lt.__assign || function() {
      return C = Object.assign || function(r) {
        for (var m, _ = 1, x = arguments.length; _ < x; _++) {
          m = arguments[_];
          for (var A in m) Object.prototype.hasOwnProperty.call(m, A) && (r[A] = m[A]);
        }
        return r;
      }, C.apply(this, arguments);
    }, g = lt && lt.__read || function(r, m) {
      var _ = typeof Symbol == "function" && r[Symbol.iterator];
      if (!_) return r;
      var x = _.call(r), A, s = [], M;
      try {
        for (; (m === void 0 || m-- > 0) && !(A = x.next()).done; ) s.push(A.value);
      } catch (w) {
        M = { error: w };
      } finally {
        try {
          A && !A.done && (_ = x.return) && _.call(x);
        } finally {
          if (M) throw M.error;
        }
      }
      return s;
    }, y = lt && lt.__values || function(r) {
      var m = typeof Symbol == "function" && Symbol.iterator, _ = m && r[m], x = 0;
      if (_) return _.call(r);
      if (r && typeof r.length == "number") return {
        next: function() {
          return r && x >= r.length && (r = void 0), { value: r && r[x++], done: !r };
        }
      };
      throw new TypeError(m ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, t = lt && lt.__importDefault || function(r) {
      return r && r.__esModule ? r : { default: r };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.MathtoolsMethods = void 0;
    var e = t(V()), n = ve(), u = t(st()), l = t(rt()), c = t(U()), a = t(W()), f = bt(), o = Se(), h = he(), i = t(xe()), d = t(Te()), p = rn();
    v.MathtoolsMethods = {
      MtMatrix: function(r, m, _, x) {
        var A = r.GetBrackets("\\begin{".concat(m.getName(), "}"), "c");
        return v.MathtoolsMethods.Array(r, m, _, x, A);
      },
      MtSmallMatrix: function(r, m, _, x, A) {
        return A || (A = r.GetBrackets("\\begin{".concat(m.getName(), "}"), r.options.mathtools["smallmatrix-align"])), v.MathtoolsMethods.Array(r, m, _, x, A, e.default.Em(1 / 3), ".2em", "S", 1);
      },
      MtMultlined: function(r, m) {
        var _, x = "\\begin{".concat(m.getName(), "}"), A = r.GetBrackets(x, r.options.mathtools["multlined-pos"] || "c"), s = A ? r.GetBrackets(x, "") : "";
        A && !A.match(/^[cbt]$/) && (_ = g([A, s], 2), s = _[0], A = _[1]), r.Push(m);
        var M = r.itemFactory.create("multlined", r, m);
        return M.arraydef = {
          displaystyle: !0,
          rowspacing: ".5em",
          width: s || "auto",
          columnwidth: "100%"
        }, e.default.setArrayAlign(M, A || "c");
      },
      HandleShove: function(r, m, _) {
        var x = r.stack.Top();
        if (x.kind !== "multline" && x.kind !== "multlined")
          throw new c.default("CommandInMultlined", "%1 can only appear within the multline or multlined environments", m);
        if (x.Size())
          throw new c.default("CommandAtTheBeginingOfLine", "%1 must come at the beginning of the line", m);
        x.setProperty("shove", _);
        var A = r.GetBrackets(m), s = r.ParseArg(m);
        if (A) {
          var M = r.create("node", "mrow", []), w = r.create("node", "mspace", [], { width: A });
          _ === "left" ? (M.appendChild(w), M.appendChild(s)) : (M.appendChild(s), M.appendChild(w)), s = M;
        }
        r.Push(s);
      },
      SpreadLines: function(r, m) {
        var _, x;
        if (r.stack.env.closing === m.getName()) {
          delete r.stack.env.closing;
          var A = r.stack.Pop(), s = A.toMml(), M = A.getProperty("spread");
          if (s.isInferred)
            try {
              for (var w = y(a.default.getChildren(s)), b = w.next(); !b.done; b = w.next()) {
                var P = b.value;
                p.MathtoolsUtil.spreadLines(P, M);
              }
            } catch (T) {
              _ = { error: T };
            } finally {
              try {
                b && !b.done && (x = w.return) && x.call(w);
              } finally {
                if (_) throw _.error;
              }
            }
          else
            p.MathtoolsUtil.spreadLines(s, M);
          r.Push(s);
        } else {
          var M = r.GetDimen("\\begin{".concat(m.getName(), "}"));
          m.setProperty("spread", M), r.Push(m);
        }
      },
      Cases: function(r, m, _, x, A) {
        var s = r.itemFactory.create("array").setProperty("casesEnv", m.getName());
        return s.arraydef = {
          rowspacing: ".2em",
          columnspacing: "1em",
          columnalign: "left"
        }, A === "D" && (s.arraydef.displaystyle = !0), s.setProperties({ open: _, close: x }), r.Push(m), s;
      },
      MathLap: function(r, m, _, x) {
        var A = r.GetBrackets(m, "").trim(), s = r.create("node", "mstyle", [
          r.create("node", "mpadded", [r.ParseArg(m)], C({ width: 0 }, _ === "r" ? {} : { lspace: _ === "l" ? "-1width" : "-.5width" }))
        ], { "data-cramped": x });
        p.MathtoolsUtil.setDisplayLevel(s, A), r.Push(r.create("node", "TeXAtom", [s]));
      },
      Cramped: function(r, m) {
        var _ = r.GetBrackets(m, "").trim(), x = r.ParseArg(m), A = r.create("node", "mstyle", [x], { "data-cramped": !0 });
        p.MathtoolsUtil.setDisplayLevel(A, _), r.Push(A);
      },
      MtLap: function(r, m, _) {
        var x = e.default.internalMath(r, r.GetArgument(m), 0), A = r.create("node", "mpadded", x, { width: 0 });
        _ !== "r" && a.default.setAttribute(A, "lspace", _ === "l" ? "-1width" : "-.5width"), r.Push(A);
      },
      MathMakeBox: function(r, m) {
        var _ = r.GetBrackets(m), x = r.GetBrackets(m, "c"), A = r.create("node", "mpadded", [r.ParseArg(m)]);
        _ && a.default.setAttribute(A, "width", _);
        var s = (0, h.lookup)(x, { c: "center", r: "right" }, "");
        s && a.default.setAttribute(A, "data-align", s), r.Push(A);
      },
      MathMBox: function(r, m) {
        r.Push(r.create("node", "mrow", [r.ParseArg(m)]));
      },
      UnderOverBracket: function(r, m) {
        var _ = (0, o.length2em)(r.GetBrackets(m, ".1em"), 0.1), x = r.GetBrackets(m, ".2em"), A = r.GetArgument(m), s = g(m.charAt(1) === "o" ? ["over", "accent", "bottom"] : ["under", "accentunder", "top"], 3), M = s[0], w = s[1], b = s[2], P = (0, o.em)(_), T = new l.default(A, r.stack.env, r.configuration).mml(), q = new l.default(A, r.stack.env, r.configuration).mml(), E = r.create("node", "mpadded", [
          r.create("node", "mphantom", [q])
        ], {
          style: "border: ".concat(P, " solid; border-").concat(b, ": none"),
          height: x,
          depth: 0
        }), k = e.default.underOver(r, T, E, M, !0), I = a.default.getChildAt(a.default.getChildAt(k, 0), 0);
        a.default.setAttribute(I, w, !0), r.Push(k);
      },
      Aboxed: function(r, m) {
        var _ = p.MathtoolsUtil.checkAlignment(r, m);
        _.row.length % 2 === 1 && _.row.push(r.create("node", "mtd", []));
        var x = r.GetArgument(m), A = r.string.substr(r.i);
        r.string = x + "&&\\endAboxed", r.i = 0;
        var s = r.GetUpTo(m, "&"), M = r.GetUpTo(m, "&");
        r.GetUpTo(m, "\\endAboxed");
        var w = e.default.substituteArgs(r, [s, M], "\\rlap{\\boxed{#1{}#2}}\\kern.267em\\phantom{#1}&\\phantom{{}#2}\\kern.267em");
        r.string = w + A, r.i = 0;
      },
      ArrowBetweenLines: function(r, m) {
        var _ = p.MathtoolsUtil.checkAlignment(r, m);
        if (_.Size() || _.row.length)
          throw new c.default("BetweenLines", "%1 must be on a row by itself", m);
        var x = r.GetStar(), A = r.GetBrackets(m, "\\Updownarrow");
        x && (_.EndEntry(), _.EndEntry());
        var s = x ? "\\quad" + A : A + "\\quad", M = new l.default(s, r.stack.env, r.configuration).mml();
        r.Push(M), _.EndEntry(), _.EndRow();
      },
      VDotsWithin: function(r, m) {
        var _ = r.stack.Top(), x = _.getProperty("flushspaceabove") === _.table.length, A = "\\mmlToken{mi}{}" + r.GetArgument(m) + "\\mmlToken{mi}{}", s = new l.default(A, r.stack.env, r.configuration).mml(), M = r.create("node", "mpadded", [
          r.create("node", "mpadded", [
            r.create("node", "mo", [
              r.create("text", "⋮")
            ])
          ], C({ width: 0, lspace: "-.5width" }, x ? { height: "-.6em", voffset: "-.18em" } : {})),
          r.create("node", "mphantom", [s])
        ], {
          lspace: ".5width"
        });
        r.Push(M);
      },
      ShortVDotsWithin: function(r, m) {
        var _ = r.stack.Top(), x = r.GetStar();
        v.MathtoolsMethods.FlushSpaceAbove(r, "\\MTFlushSpaceAbove"), !x && _.EndEntry(), v.MathtoolsMethods.VDotsWithin(r, "\\vdotswithin"), x && _.EndEntry(), v.MathtoolsMethods.FlushSpaceBelow(r, "\\MTFlushSpaceBelow");
      },
      FlushSpaceAbove: function(r, m) {
        var _ = p.MathtoolsUtil.checkAlignment(r, m);
        _.setProperty("flushspaceabove", _.table.length), _.addRowSpacing("-" + r.options.mathtools.shortvdotsadjustabove);
      },
      FlushSpaceBelow: function(r, m) {
        var _ = p.MathtoolsUtil.checkAlignment(r, m);
        _.Size() && _.EndEntry(), _.EndRow(), _.addRowSpacing("-" + r.options.mathtools.shortvdotsadjustbelow);
      },
      PairedDelimiters: function(r, m, _, x, A, s, M, w) {
        A === void 0 && (A = "#1"), s === void 0 && (s = 1), M === void 0 && (M = ""), w === void 0 && (w = "");
        var b = r.GetStar(), P = b ? "" : r.GetBrackets(m), T = g(b ? ["\\left", "\\right"] : P ? [P + "l", P + "r"] : ["", ""], 2), q = T[0], E = T[1], k = b ? "\\middle" : P || "";
        if (s) {
          for (var I = [], G = I.length; G < s; G++)
            I.push(r.GetArgument(m));
          M = e.default.substituteArgs(r, I, M), A = e.default.substituteArgs(r, I, A), w = e.default.substituteArgs(r, I, w);
        }
        A = A.replace(/\\delimsize/g, k), r.string = [M, q, _, A, E, x, w, r.string.substr(r.i)].reduce(function($, H) {
          return e.default.addArgs(r, $, H);
        }, ""), r.i = 0, e.default.checkMaxMacros(r);
      },
      DeclarePairedDelimiter: function(r, m) {
        var _ = i.default.GetCsNameArgument(r, m), x = r.GetArgument(m), A = r.GetArgument(m);
        p.MathtoolsUtil.addPairedDelims(r.configuration, _, [x, A]);
      },
      DeclarePairedDelimiterX: function(r, m) {
        var _ = i.default.GetCsNameArgument(r, m), x = i.default.GetArgCount(r, m), A = r.GetArgument(m), s = r.GetArgument(m), M = r.GetArgument(m);
        p.MathtoolsUtil.addPairedDelims(r.configuration, _, [A, s, M, x]);
      },
      DeclarePairedDelimiterXPP: function(r, m) {
        var _ = i.default.GetCsNameArgument(r, m), x = i.default.GetArgCount(r, m), A = r.GetArgument(m), s = r.GetArgument(m), M = r.GetArgument(m), w = r.GetArgument(m), b = r.GetArgument(m);
        p.MathtoolsUtil.addPairedDelims(r.configuration, _, [s, M, b, x, A, w]);
      },
      CenterColon: function(r, m, _, x, A) {
        x === void 0 && (x = !1), A === void 0 && (A = !1);
        var s = r.options.mathtools, M = r.create("token", "mo", {}, ":");
        if (_ && (s.centercolon || x)) {
          var w = s["centercolon-offset"];
          M = r.create("node", "mpadded", [M], C({ voffset: w, height: "+".concat(w), depth: "-".concat(w) }, A ? { width: s["thincolon-dw"], lspace: s["thincolon-dx"] } : {}));
        }
        r.Push(M);
      },
      Relation: function(r, m, _, x) {
        var A = r.options.mathtools;
        A["use-unicode"] && x ? r.Push(r.create("token", "mo", { texClass: f.TEXCLASS.REL }, x)) : (_ = "\\mathrel{" + _.replace(/:/g, "\\MTThinColon").replace(/-/g, "\\mathrel{-}") + "}", r.string = e.default.addArgs(r, _, r.string.substr(r.i)), r.i = 0);
      },
      NArrow: function(r, m, _, x) {
        r.Push(r.create("node", "TeXAtom", [
          r.create("token", "mtext", {}, _),
          r.create("node", "mpadded", [
            r.create("node", "mpadded", [
              r.create("node", "menclose", [
                r.create("node", "mspace", [], { height: ".2em", depth: 0, width: ".4em" })
              ], { notation: "updiagonalstrike", "data-thickness": ".05em", "data-padding": 0 })
            ], { width: 0, lspace: "-.5width", voffset: x }),
            r.create("node", "mphantom", [
              r.create("token", "mtext", {}, _)
            ])
          ], { width: 0, lspace: "-.5width" })
        ], { texClass: f.TEXCLASS.REL }));
      },
      SplitFrac: function(r, m, _) {
        var x = r.ParseArg(m), A = r.ParseArg(m);
        r.Push(r.create("node", "mstyle", [
          r.create("node", "mfrac", [
            r.create("node", "mstyle", [
              x,
              r.create("token", "mi"),
              r.create("token", "mspace", { width: "1em" })
            ], { scriptlevel: 0 }),
            r.create("node", "mstyle", [
              r.create("token", "mspace", { width: "1em" }),
              r.create("token", "mi"),
              A
            ], { scriptlevel: 0 })
          ], { linethickness: 0, numalign: "left", denomalign: "right" })
        ], { displaystyle: _, scriptlevel: 0 }));
      },
      XMathStrut: function(r, m) {
        var _ = r.GetBrackets(m), x = r.GetArgument(m);
        x = p.MathtoolsUtil.plusOrMinus(m, x), _ = p.MathtoolsUtil.plusOrMinus(m, _ || x), r.Push(r.create("node", "TeXAtom", [
          r.create("node", "mpadded", [
            r.create("node", "mphantom", [
              r.create("token", "mo", { stretchy: !1 }, "(")
            ])
          ], { width: 0, height: x + "height", depth: _ + "depth" })
        ], { texClass: f.TEXCLASS.ORD }));
      },
      Prescript: function(r, m) {
        var _ = p.MathtoolsUtil.getScript(r, m, "sup"), x = p.MathtoolsUtil.getScript(r, m, "sub"), A = p.MathtoolsUtil.getScript(r, m, "arg");
        if (a.default.isType(_, "none") && a.default.isType(x, "none")) {
          r.Push(A);
          return;
        }
        var s = r.create("node", "mmultiscripts", [A]);
        a.default.getChildren(s).push(null, null), a.default.appendChildren(s, [r.create("node", "mprescripts"), x, _]), s.setProperty("fixPrescript", !0), r.Push(s);
      },
      NewTagForm: function(r, m, _) {
        _ === void 0 && (_ = !1);
        var x = r.tags;
        if (!("mtFormats" in x))
          throw new c.default("TagsNotMT", "%1 can only be used with ams or mathtools tags", m);
        var A = r.GetArgument(m).trim();
        if (!A)
          throw new c.default("InvalidTagFormID", "Tag form name can't be empty");
        var s = r.GetBrackets(m, ""), M = r.GetArgument(m), w = r.GetArgument(m);
        if (!_ && x.mtFormats.has(A))
          throw new c.default("DuplicateTagForm", "Duplicate tag form: %1", A);
        x.mtFormats.set(A, [M, w, s]);
      },
      UseTagForm: function(r, m) {
        var _ = r.tags;
        if (!("mtFormats" in _))
          throw new c.default("TagsNotMT", "%1 can only be used with ams or mathtools tags", m);
        var x = r.GetArgument(m).trim();
        if (!x) {
          _.mtCurrent = null;
          return;
        }
        if (!_.mtFormats.has(x))
          throw new c.default("UndefinedTagForm", "Undefined tag form: %1", x);
        _.mtCurrent = _.mtFormats.get(x);
      },
      SetOptions: function(r, m) {
        var _, x, A = r.options.mathtools;
        if (!A["allow-mathtoolsset"])
          throw new c.default("ForbiddenMathtoolsSet", "%1 is disabled", m);
        var s = {};
        Object.keys(A).forEach(function(q) {
          q !== "pariedDelimiters" && q !== "tagforms" && q !== "allow-mathtoolsset" && (s[q] = 1);
        });
        var M = r.GetArgument(m), w = e.default.keyvalOptions(M, s, !0);
        try {
          for (var b = y(Object.keys(w)), P = b.next(); !P.done; P = b.next()) {
            var T = P.value;
            A[T] = w[T];
          }
        } catch (q) {
          _ = { error: q };
        } finally {
          try {
            P && !P.done && (x = b.return) && x.call(b);
          } finally {
            if (_) throw _.error;
          }
        }
      },
      Array: u.default.Array,
      Macro: u.default.Macro,
      xArrow: n.AmsMethods.xArrow,
      HandleRef: n.AmsMethods.HandleRef,
      AmsEqnArray: n.AmsMethods.AmsEqnArray,
      MacroWithTemplate: d.default.MacroWithTemplate
    };
  })(lt)), lt;
}
var wr;
function Kn() {
  if (wr) return ne;
  wr = 1;
  var v = ne && ne.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(ne, "__esModule", { value: !0 });
  var C = v(St()), g = F(), y = tt(), t = nn();
  return new g.CommandMap("mathtools-macros", {
    shoveleft: ["HandleShove", y.TexConstant.Align.LEFT],
    shoveright: ["HandleShove", y.TexConstant.Align.RIGHT],
    xleftrightarrow: ["xArrow", 8596, 10, 10],
    xLeftarrow: ["xArrow", 8656, 12, 7],
    xRightarrow: ["xArrow", 8658, 7, 12],
    xLeftrightarrow: ["xArrow", 8660, 12, 12],
    xhookleftarrow: ["xArrow", 8617, 10, 5],
    xhookrightarrow: ["xArrow", 8618, 5, 10],
    xmapsto: ["xArrow", 8614, 10, 10],
    xrightharpoondown: ["xArrow", 8641, 5, 10],
    xleftharpoondown: ["xArrow", 8637, 10, 5],
    xrightleftharpoons: ["xArrow", 8652, 10, 10],
    xrightharpoonup: ["xArrow", 8640, 5, 10],
    xleftharpoonup: ["xArrow", 8636, 10, 5],
    xleftrightharpoons: ["xArrow", 8651, 10, 10],
    mathllap: ["MathLap", "l", !1],
    mathrlap: ["MathLap", "r", !1],
    mathclap: ["MathLap", "c", !1],
    clap: ["MtLap", "c"],
    textllap: ["MtLap", "l"],
    textrlap: ["MtLap", "r"],
    textclap: ["MtLap", "c"],
    cramped: "Cramped",
    crampedllap: ["MathLap", "l", !0],
    crampedrlap: ["MathLap", "r", !0],
    crampedclap: ["MathLap", "c", !0],
    crampedsubstack: ["Macro", "\\begin{crampedsubarray}{c}#1\\end{crampedsubarray}", 1],
    mathmbox: "MathMBox",
    mathmakebox: "MathMakeBox",
    overbracket: "UnderOverBracket",
    underbracket: "UnderOverBracket",
    refeq: "HandleRef",
    MoveEqLeft: ["Macro", "\\hspace{#1em}&\\hspace{-#1em}", 1, "2"],
    Aboxed: "Aboxed",
    ArrowBetweenLines: "ArrowBetweenLines",
    vdotswithin: "VDotsWithin",
    shortvdotswithin: "ShortVDotsWithin",
    MTFlushSpaceAbove: "FlushSpaceAbove",
    MTFlushSpaceBelow: "FlushSpaceBelow",
    DeclarePairedDelimiter: "DeclarePairedDelimiter",
    DeclarePairedDelimiterX: "DeclarePairedDelimiterX",
    DeclarePairedDelimiterXPP: "DeclarePairedDelimiterXPP",
    DeclarePairedDelimiters: "DeclarePairedDelimiter",
    DeclarePairedDelimitersX: "DeclarePairedDelimiterX",
    DeclarePairedDelimitersXPP: "DeclarePairedDelimiterXPP",
    centercolon: ["CenterColon", !0, !0],
    ordinarycolon: ["CenterColon", !1],
    MTThinColon: ["CenterColon", !0, !0, !0],
    coloneqq: ["Relation", ":=", "≔"],
    Coloneqq: ["Relation", "::=", "⩴"],
    coloneq: ["Relation", ":-"],
    Coloneq: ["Relation", "::-"],
    eqqcolon: ["Relation", "=:", "≕"],
    Eqqcolon: ["Relation", "=::"],
    eqcolon: ["Relation", "-:", "∹"],
    Eqcolon: ["Relation", "-::"],
    colonapprox: ["Relation", ":\\approx"],
    Colonapprox: ["Relation", "::\\approx"],
    colonsim: ["Relation", ":\\sim"],
    Colonsim: ["Relation", "::\\sim"],
    dblcolon: ["Relation", "::", "∷"],
    nuparrow: ["NArrow", "↑", ".06em"],
    ndownarrow: ["NArrow", "↓", ".25em"],
    bigtimes: ["Macro", "\\mathop{\\Large\\kern-.1em\\boldsymbol{\\times}\\kern-.1em}"],
    splitfrac: ["SplitFrac", !1],
    splitdfrac: ["SplitFrac", !0],
    xmathstrut: "XMathStrut",
    prescript: "Prescript",
    newtagform: ["NewTagForm", !1],
    renewtagform: ["NewTagForm", !0],
    usetagform: "UseTagForm",
    adjustlimits: [
      "MacroWithTemplate",
      "\\mathop{{#1}\\vphantom{{#3}}}_{{#2}\\vphantom{{#4}}}\\mathop{{#3}\\vphantom{{#1}}}_{{#4}\\vphantom{{#2}}}",
      4,
      ,
      "_",
      ,
      "_"
    ],
    mathtoolsset: "SetOptions"
  }, t.MathtoolsMethods), new g.EnvironmentMap("mathtools-environments", C.default.environment, {
    dcases: ["Array", null, "\\{", "", "ll", null, ".2em", "D"],
    rcases: ["Array", null, "", "\\}", "ll", null, ".2em"],
    drcases: ["Array", null, "", "\\}", "ll", null, ".2em", "D"],
    "dcases*": ["Cases", null, "{", "", "D"],
    "rcases*": ["Cases", null, "", "}"],
    "drcases*": ["Cases", null, "", "}", "D"],
    "cases*": ["Cases", null, "{", ""],
    "matrix*": ["MtMatrix", null, null, null],
    "pmatrix*": ["MtMatrix", null, "(", ")"],
    "bmatrix*": ["MtMatrix", null, "[", "]"],
    "Bmatrix*": ["MtMatrix", null, "\\{", "\\}"],
    "vmatrix*": ["MtMatrix", null, "\\vert", "\\vert"],
    "Vmatrix*": ["MtMatrix", null, "\\Vert", "\\Vert"],
    "smallmatrix*": ["MtSmallMatrix", null, null, null],
    psmallmatrix: ["MtSmallMatrix", null, "(", ")", "c"],
    "psmallmatrix*": ["MtSmallMatrix", null, "(", ")"],
    bsmallmatrix: ["MtSmallMatrix", null, "[", "]", "c"],
    "bsmallmatrix*": ["MtSmallMatrix", null, "[", "]"],
    Bsmallmatrix: ["MtSmallMatrix", null, "\\{", "\\}", "c"],
    "Bsmallmatrix*": ["MtSmallMatrix", null, "\\{", "\\}"],
    vsmallmatrix: ["MtSmallMatrix", null, "\\vert", "\\vert", "c"],
    "vsmallmatrix*": ["MtSmallMatrix", null, "\\vert", "\\vert"],
    Vsmallmatrix: ["MtSmallMatrix", null, "\\Vert", "\\Vert", "c"],
    "Vsmallmatrix*": ["MtSmallMatrix", null, "\\Vert", "\\Vert"],
    crampedsubarray: ["Array", null, null, null, null, "0em", "0.1em", "S'", 1],
    multlined: "MtMultlined",
    spreadlines: ["SpreadLines", !0],
    lgathered: ["AmsEqnArray", null, null, null, "l", null, ".5em", "D"],
    rgathered: ["AmsEqnArray", null, null, null, "r", null, ".5em", "D"]
  }, t.MathtoolsMethods), new g.DelimiterMap("mathtools-delimiters", C.default.delimiter, {
    "\\lparen": "(",
    "\\rparen": ")"
  }), new g.CommandMap("mathtools-characters", {
    ":": ["CenterColon", !0]
  }, t.MathtoolsMethods), ne;
}
var J = {}, br;
function Wn() {
  if (br) return J;
  br = 1;
  var v = J && J.__extends || /* @__PURE__ */ (function() {
    var l = function(c, a) {
      return l = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(f, o) {
        f.__proto__ = o;
      } || function(f, o) {
        for (var h in o) Object.prototype.hasOwnProperty.call(o, h) && (f[h] = o[h]);
      }, l(c, a);
    };
    return function(c, a) {
      if (typeof a != "function" && a !== null)
        throw new TypeError("Class extends value " + String(a) + " is not a constructor or null");
      l(c, a);
      function f() {
        this.constructor = c;
      }
      c.prototype = a === null ? Object.create(a) : (f.prototype = a.prototype, new f());
    };
  })(), C = J && J.__values || function(l) {
    var c = typeof Symbol == "function" && Symbol.iterator, a = c && l[c], f = 0;
    if (a) return a.call(l);
    if (l && typeof l.length == "number") return {
      next: function() {
        return l && f >= l.length && (l = void 0), { value: l && l[f++], done: !l };
      }
    };
    throw new TypeError(c ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, g = J && J.__read || function(l, c) {
    var a = typeof Symbol == "function" && l[Symbol.iterator];
    if (!a) return l;
    var f = a.call(l), o, h = [], i;
    try {
      for (; (c === void 0 || c-- > 0) && !(o = f.next()).done; ) h.push(o.value);
    } catch (d) {
      i = { error: d };
    } finally {
      try {
        o && !o.done && (a = f.return) && a.call(f);
      } finally {
        if (i) throw i.error;
      }
    }
    return h;
  }, y = J && J.__importDefault || function(l) {
    return l && l.__esModule ? l : { default: l };
  };
  Object.defineProperty(J, "__esModule", { value: !0 }), J.MathtoolsTagFormat = void 0;
  var t = y(U()), e = _e(), n = 0;
  function u(l, c) {
    var a = c.parseOptions.options.tags;
    a !== "base" && l.tags.hasOwnProperty(a) && e.TagsFactory.add(a, l.tags[a]);
    var f = e.TagsFactory.create(c.parseOptions.options.tags).constructor, o = (function(i) {
      v(d, i);
      function d() {
        var p, r, m = i.call(this) || this;
        m.mtFormats = /* @__PURE__ */ new Map(), m.mtCurrent = null;
        var _ = c.parseOptions.options.mathtools.tagforms;
        try {
          for (var x = C(Object.keys(_)), A = x.next(); !A.done; A = x.next()) {
            var s = A.value;
            if (!Array.isArray(_[s]) || _[s].length !== 3)
              throw new t.default("InvalidTagFormDef", 'The tag form definition for "%1" should be an array fo three strings', s);
            m.mtFormats.set(s, _[s]);
          }
        } catch (M) {
          p = { error: M };
        } finally {
          try {
            A && !A.done && (r = x.return) && r.call(x);
          } finally {
            if (p) throw p.error;
          }
        }
        return m;
      }
      return d.prototype.formatTag = function(p) {
        if (this.mtCurrent) {
          var r = g(this.mtCurrent, 3), m = r[0], _ = r[1], x = r[2];
          return x ? "".concat(m).concat(x, "{").concat(p, "}").concat(_) : "".concat(m).concat(p).concat(_);
        }
        return i.prototype.formatTag.call(this, p);
      }, d;
    })(f);
    n++;
    var h = "MathtoolsTags-" + n;
    e.TagsFactory.add(h, o), c.parseOptions.options.tags = h;
  }
  return J.MathtoolsTagFormat = u, J;
}
var Mt = {}, Pr;
function Zn() {
  if (Pr) return Mt;
  Pr = 1;
  var v = Mt && Mt.__extends || /* @__PURE__ */ (function() {
    var n = function(u, l) {
      return n = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(c, a) {
        c.__proto__ = a;
      } || function(c, a) {
        for (var f in a) Object.prototype.hasOwnProperty.call(a, f) && (c[f] = a[f]);
      }, n(u, l);
    };
    return function(u, l) {
      if (typeof l != "function" && l !== null)
        throw new TypeError("Class extends value " + String(l) + " is not a constructor or null");
      n(u, l);
      function c() {
        this.constructor = u;
      }
      u.prototype = l === null ? Object.create(l) : (c.prototype = l.prototype, new c());
    };
  })(), C = Mt && Mt.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(Mt, "__esModule", { value: !0 }), Mt.MultlinedItem = void 0;
  var g = Wr(), y = C(W()), t = tt(), e = (function(n) {
    v(u, n);
    function u() {
      return n !== null && n.apply(this, arguments) || this;
    }
    return Object.defineProperty(u.prototype, "kind", {
      get: function() {
        return "multlined";
      },
      enumerable: !1,
      configurable: !0
    }), u.prototype.EndTable = function() {
      if ((this.Size() || this.row.length) && (this.EndEntry(), this.EndRow()), this.table.length > 1) {
        var l = this.factory.configuration.options.mathtools, c = l.multlinegap, a = l["firstline-afterskip"] || c, f = l["lastline-preskip"] || c, o = y.default.getChildren(this.table[0])[0];
        y.default.getAttribute(o, "columnalign") !== t.TexConstant.Align.RIGHT && o.appendChild(this.create("node", "mspace", [], { width: a }));
        var h = y.default.getChildren(this.table[this.table.length - 1])[0];
        if (y.default.getAttribute(h, "columnalign") !== t.TexConstant.Align.LEFT) {
          var i = y.default.getChildren(h)[0];
          i.childNodes.unshift(null);
          var d = this.create("node", "mspace", [], { width: f });
          y.default.setChild(i, 0, d);
        }
      }
      n.prototype.EndTable.call(this);
    }, u;
  })(g.MultlineItem);
  return Mt.MultlinedItem = e, Mt;
}
var Sr;
function an() {
  return Sr || (Sr = 1, (function(v) {
    var C = Ot && Ot.__values || function(i) {
      var d = typeof Symbol == "function" && Symbol.iterator, p = d && i[d], r = 0;
      if (p) return p.call(i);
      if (i && typeof i.length == "number") return {
        next: function() {
          return i && r >= i.length && (i = void 0), { value: i && i[r++], done: !i };
        }
      };
      throw new TypeError(d ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, g = Ot && Ot.__importDefault || function(i) {
      return i && i.__esModule ? i : { default: i };
    }, y;
    Object.defineProperty(v, "__esModule", { value: !0 }), v.MathtoolsConfiguration = v.fixPrescripts = v.PAIREDDELIMS = void 0;
    var t = R(), e = F(), n = g(W()), u = he();
    Kn();
    var l = rn(), c = Wn(), a = Zn();
    v.PAIREDDELIMS = "mathtools-paired-delims";
    function f(i) {
      new e.CommandMap(v.PAIREDDELIMS, {}, {}), i.append(t.Configuration.local({ handler: { macro: [v.PAIREDDELIMS] }, priority: -5 }));
    }
    function o(i, d) {
      var p, r, m = d.parseOptions, _ = m.options.mathtools.pairedDelimiters;
      try {
        for (var x = C(Object.keys(_)), A = x.next(); !A.done; A = x.next()) {
          var s = A.value;
          l.MathtoolsUtil.addPairedDelims(m, s, _[s]);
        }
      } catch (M) {
        p = { error: M };
      } finally {
        try {
          A && !A.done && (r = x.return) && r.call(x);
        } finally {
          if (p) throw p.error;
        }
      }
      (0, c.MathtoolsTagFormat)(i, d);
    }
    function h(i) {
      var d, p, r, m, _, x, A = i.data;
      try {
        for (var s = C(A.getList("mmultiscripts")), M = s.next(); !M.done; M = s.next()) {
          var w = M.value;
          if (w.getProperty("fixPrescript")) {
            var b = n.default.getChildren(w), P = 0;
            try {
              for (var T = (r = void 0, C([1, 2])), q = T.next(); !q.done; q = T.next()) {
                var E = q.value;
                b[E] || (n.default.setChild(w, E, A.nodeFactory.create("node", "none")), P++);
              }
            } catch (G) {
              r = { error: G };
            } finally {
              try {
                q && !q.done && (m = T.return) && m.call(T);
              } finally {
                if (r) throw r.error;
              }
            }
            try {
              for (var k = (_ = void 0, C([4, 5])), I = k.next(); !I.done; I = k.next()) {
                var E = I.value;
                n.default.isType(b[E], "mrow") && n.default.getChildren(b[E]).length === 0 && n.default.setChild(w, E, A.nodeFactory.create("node", "none"));
              }
            } catch (G) {
              _ = { error: G };
            } finally {
              try {
                I && !I.done && (x = k.return) && x.call(k);
              } finally {
                if (_) throw _.error;
              }
            }
            P === 2 && b.splice(1, 2);
          }
        }
      } catch (G) {
        d = { error: G };
      } finally {
        try {
          M && !M.done && (p = s.return) && p.call(s);
        } finally {
          if (d) throw d.error;
        }
      }
    }
    v.fixPrescripts = h, v.MathtoolsConfiguration = t.Configuration.create("mathtools", {
      handler: {
        macro: ["mathtools-macros", "mathtools-delimiters"],
        environment: ["mathtools-environments"],
        delimiter: ["mathtools-delimiters"],
        character: ["mathtools-characters"]
      },
      items: (y = {}, y[a.MultlinedItem.prototype.kind] = a.MultlinedItem, y),
      init: f,
      config: o,
      postprocessors: [[h, -6]],
      options: {
        mathtools: {
          multlinegap: "1em",
          "multlined-pos": "c",
          "firstline-afterskip": "",
          "lastline-preskip": "",
          "smallmatrix-align": "c",
          shortvdotsadjustabove: ".2em",
          shortvdotsadjustbelow: ".2em",
          centercolon: !1,
          "centercolon-offset": ".04em",
          "thincolon-dx": "-.04em",
          "thincolon-dw": "-.08em",
          "use-unicode": !1,
          "prescript-sub-format": "",
          "prescript-sup-format": "",
          "prescript-arg-format": "",
          "allow-mathtoolsset": !0,
          pairedDelimiters: (0, u.expandable)({}),
          tagforms: (0, u.expandable)({})
        }
      }
    });
  })(Ot)), Ot;
}
var kt = {}, ae = {}, qr;
function Yn() {
  if (qr) return ae;
  qr = 1;
  Object.defineProperty(ae, "__esModule", { value: !0 }), ae.mhchemParser = void 0;
  var v = (function() {
    function t() {
    }
    return t.toTex = function(e, n) {
      return y.go(g.go(e, n), n !== "tex");
    }, t;
  })();
  ae.mhchemParser = v;
  function C(t) {
    var e, n, u = {};
    for (e in t)
      for (n in t[e]) {
        var l = n.split("|");
        t[e][n].stateArray = l;
        for (var c = 0; c < l.length; c++)
          u[l[c]] = [];
      }
    for (e in t)
      for (n in t[e])
        for (var l = t[e][n].stateArray || [], c = 0; c < l.length; c++) {
          var a = t[e][n];
          a.action_ = [].concat(a.action_);
          for (var f = 0; f < a.action_.length; f++)
            typeof a.action_[f] == "string" && (a.action_[f] = { type_: a.action_[f] });
          for (var o = e.split("|"), h = 0; h < o.length; h++)
            if (l[c] === "*") {
              var i = void 0;
              for (i in u)
                u[i].push({ pattern: o[h], task: a });
            } else
              u[l[c]].push({ pattern: o[h], task: a });
        }
    return u;
  }
  var g = {
    go: function(t, e) {
      if (!t)
        return [];
      e === void 0 && (e = "ce");
      var n = "0", u = {};
      u.parenthesisLevel = 0, t = t.replace(/\n/g, " "), t = t.replace(/[\u2212\u2013\u2014\u2010]/g, "-"), t = t.replace(/[\u2026]/g, "...");
      for (var l, c = 10, a = []; ; ) {
        l !== t ? (c = 10, l = t) : c--;
        var f = g.stateMachines[e], o = f.transitions[n] || f.transitions["*"];
        t: for (var h = 0; h < o.length; h++) {
          var i = g.patterns.match_(o[h].pattern, t);
          if (i) {
            for (var d = o[h].task, p = 0; p < d.action_.length; p++) {
              var r = void 0;
              if (f.actions[d.action_[p].type_])
                r = f.actions[d.action_[p].type_](u, i.match_, d.action_[p].option);
              else if (g.actions[d.action_[p].type_])
                r = g.actions[d.action_[p].type_](u, i.match_, d.action_[p].option);
              else
                throw ["MhchemBugA", "mhchem bug A. Please report. (" + d.action_[p].type_ + ")"];
              g.concatArray(a, r);
            }
            if (n = d.nextState || n, t.length > 0) {
              if (d.revisit || (t = i.remainder), !d.toContinue)
                break t;
            } else
              return a;
          }
        }
        if (c <= 0)
          throw ["MhchemBugU", "mhchem bug U. Please report."];
      }
    },
    concatArray: function(t, e) {
      if (e)
        if (Array.isArray(e))
          for (var n = 0; n < e.length; n++)
            t.push(e[n]);
        else
          t.push(e);
    },
    patterns: {
      patterns: {
        empty: /^$/,
        else: /^./,
        else2: /^./,
        space: /^\s/,
        "space A": /^\s(?=[A-Z\\$])/,
        space$: /^\s$/,
        "a-z": /^[a-z]/,
        x: /^x/,
        x$: /^x$/,
        i$: /^i$/,
        letters: /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
        "\\greek": /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
        "one lowercase latin letter $": /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
        "$one lowercase latin letter$ $": /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
        "one lowercase greek letter $": /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
        digits: /^[0-9]+/,
        "-9.,9": /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
        "-9.,9 no missing 0": /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
        "(-)(9.,9)(e)(99)": function(t) {
          var e = t.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:(?:([eE])|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
          return e && e[0] ? { match_: e.slice(1), remainder: t.substr(e[0].length) } : null;
        },
        "(-)(9)^(-9)": /^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/,
        "state of aggregation $": function(t) {
          var e = g.patterns.findObserveGroups(t, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");
          if (e && e.remainder.match(/^($|[\s,;\)\]\}])/))
            return e;
          var n = t.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);
          return n ? { match_: n[0], remainder: t.substr(n[0].length) } : null;
        },
        "_{(state of aggregation)}$": /^_\{(\([a-z]{1,3}\))\}/,
        "{[(": /^(?:\\\{|\[|\()/,
        ")]}": /^(?:\)|\]|\\\})/,
        ", ": /^[,;]\s*/,
        ",": /^[,;]/,
        ".": /^[.]/,
        ". __* ": /^([.\u22C5\u00B7\u2022]|[*])\s*/,
        "...": /^\.\.\.(?=$|[^.])/,
        "^{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "^{", "", "", "}");
        },
        "^($...$)": function(t) {
          return g.patterns.findObserveGroups(t, "^", "$", "$", "");
        },
        "^a": /^\^([0-9]+|[^\\_])/,
        "^\\x{}{}": function(t) {
          return g.patterns.findObserveGroups(t, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", !0);
        },
        "^\\x{}": function(t) {
          return g.patterns.findObserveGroups(t, "^", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "^\\x": /^\^(\\[a-zA-Z]+)\s*/,
        "^(-1)": /^\^(-?\d+)/,
        "'": /^'/,
        "_{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "_{", "", "", "}");
        },
        "_($...$)": function(t) {
          return g.patterns.findObserveGroups(t, "_", "$", "$", "");
        },
        _9: /^_([+\-]?[0-9]+|[^\\])/,
        "_\\x{}{}": function(t) {
          return g.patterns.findObserveGroups(t, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", !0);
        },
        "_\\x{}": function(t) {
          return g.patterns.findObserveGroups(t, "_", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "_\\x": /^_(\\[a-zA-Z]+)\s*/,
        "^_": /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
        "{}^": /^\{\}(?=\^)/,
        "{}": /^\{\}/,
        "{...}": function(t) {
          return g.patterns.findObserveGroups(t, "", "{", "}", "");
        },
        "{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "{", "", "", "}");
        },
        "$...$": function(t) {
          return g.patterns.findObserveGroups(t, "", "$", "$", "");
        },
        "${(...)}$__$(...)$": function(t) {
          return g.patterns.findObserveGroups(t, "${", "", "", "}$") || g.patterns.findObserveGroups(t, "$", "", "", "$");
        },
        "=<>": /^[=<>]/,
        "#": /^[#\u2261]/,
        "+": /^\+/,
        "-$": /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,
        "-9": /^-(?=[0-9])/,
        "- orbital overlap": /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
        "-": /^-/,
        "pm-operator": /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
        operator: /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
        arrowUpDown: /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
        "\\bond{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\bond{", "", "", "}");
        },
        "->": /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
        CMT: /^[CMT](?=\[)/,
        "[(...)]": function(t) {
          return g.patterns.findObserveGroups(t, "[", "", "", "]");
        },
        "1st-level escape": /^(&|\\\\|\\hline)\s*/,
        "\\,": /^(?:\\[,\ ;:])/,
        "\\x{}{}": function(t) {
          return g.patterns.findObserveGroups(t, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", !0);
        },
        "\\x{}": function(t) {
          return g.patterns.findObserveGroups(t, "", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "\\ca": /^\\ca(?:\s+|(?![a-zA-Z]))/,
        "\\x": /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
        orbital: /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,
        others: /^[\/~|]/,
        "\\frac{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\frac{", "", "", "}", "{", "", "", "}");
        },
        "\\overset{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\overset{", "", "", "}", "{", "", "", "}");
        },
        "\\underset{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\underset{", "", "", "}", "{", "", "", "}");
        },
        "\\underbrace{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\underbrace{", "", "", "}_", "{", "", "", "}");
        },
        "\\color{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\color{", "", "", "}");
        },
        "\\color{(...)}{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\color{", "", "", "}", "{", "", "", "}") || g.patterns.findObserveGroups(t, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}");
        },
        "\\ce{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\ce{", "", "", "}");
        },
        "\\pu{(...)}": function(t) {
          return g.patterns.findObserveGroups(t, "\\pu{", "", "", "}");
        },
        oxidation$: /^(?:[+-][IVX]+|(?:\\pm|\$\\pm\$|\+-|\+\/-)\s*0)$/,
        "d-oxidation$": /^(?:[+-]?[IVX]+|(?:\\pm|\$\\pm\$|\+-|\+\/-)\s*0)$/,
        "1/2$": /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
        amount: function(t) {
          var e;
          if (e = t.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/), e)
            return { match_: e[0], remainder: t.substr(e[0].length) };
          var n = g.patterns.findObserveGroups(t, "", "$", "$", "");
          return n && (e = n.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/), e) ? { match_: e[0], remainder: t.substr(e[0].length) } : null;
        },
        amount2: function(t) {
          return this.amount(t);
        },
        "(KV letters),": /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
        formula$: function(t) {
          if (t.match(/^\([a-z]+\)$/))
            return null;
          var e = t.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
          return e ? { match_: e[0], remainder: t.substr(e[0].length) } : null;
        },
        uprightEntities: /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
        "/": /^\s*(\/)\s*/,
        "//": /^\s*(\/\/)\s*/,
        "*": /^\s*[*.]\s*/
      },
      findObserveGroups: function(t, e, n, u, l, c, a, f, o, h) {
        var i = function(A, s) {
          if (typeof s == "string")
            return A.indexOf(s) !== 0 ? null : s;
          var M = A.match(s);
          return M ? M[0] : null;
        }, d = function(A, s, M) {
          for (var w = 0; s < A.length; ) {
            var b = A.charAt(s), P = i(A.substr(s), M);
            if (P !== null && w === 0)
              return { endMatchBegin: s, endMatchEnd: s + P.length };
            if (b === "{")
              w++;
            else if (b === "}") {
              if (w === 0)
                throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
              w--;
            }
            s++;
          }
          return w > 0, null;
        }, p = i(t, e);
        if (p === null || (t = t.substr(p.length), p = i(t, n), p === null))
          return null;
        var r = d(t, p.length, u || l);
        if (r === null)
          return null;
        var m = t.substring(0, u ? r.endMatchEnd : r.endMatchBegin);
        if (c || a) {
          var _ = this.findObserveGroups(t.substr(r.endMatchEnd), c, a, f, o);
          if (_ === null)
            return null;
          var x = [m, _.match_];
          return {
            match_: h ? x.join("") : x,
            remainder: _.remainder
          };
        } else
          return {
            match_: m,
            remainder: t.substr(r.endMatchEnd)
          };
      },
      match_: function(t, e) {
        var n = g.patterns.patterns[t];
        if (n === void 0)
          throw ["MhchemBugP", "mhchem bug P. Please report. (" + t + ")"];
        if (typeof n == "function")
          return g.patterns.patterns[t](e);
        var u = e.match(n);
        return u ? u.length > 2 ? { match_: u.slice(1), remainder: e.substr(u[0].length) } : { match_: u[1] || u[0], remainder: e.substr(u[0].length) } : null;
      }
    },
    actions: {
      "a=": function(t, e) {
        t.a = (t.a || "") + e;
      },
      "b=": function(t, e) {
        t.b = (t.b || "") + e;
      },
      "p=": function(t, e) {
        t.p = (t.p || "") + e;
      },
      "o=": function(t, e) {
        t.o = (t.o || "") + e;
      },
      "o=+p1": function(t, e, n) {
        t.o = (t.o || "") + n;
      },
      "q=": function(t, e) {
        t.q = (t.q || "") + e;
      },
      "d=": function(t, e) {
        t.d = (t.d || "") + e;
      },
      "rm=": function(t, e) {
        t.rm = (t.rm || "") + e;
      },
      "text=": function(t, e) {
        t.text_ = (t.text_ || "") + e;
      },
      insert: function(t, e, n) {
        return { type_: n };
      },
      "insert+p1": function(t, e, n) {
        return { type_: n, p1: e };
      },
      "insert+p1+p2": function(t, e, n) {
        return { type_: n, p1: e[0], p2: e[1] };
      },
      copy: function(t, e) {
        return e;
      },
      write: function(t, e, n) {
        return n;
      },
      rm: function(t, e) {
        return { type_: "rm", p1: e };
      },
      text: function(t, e) {
        return g.go(e, "text");
      },
      "tex-math": function(t, e) {
        return g.go(e, "tex-math");
      },
      "tex-math tight": function(t, e) {
        return g.go(e, "tex-math tight");
      },
      bond: function(t, e, n) {
        return { type_: "bond", kind_: n || e };
      },
      "color0-output": function(t, e) {
        return { type_: "color0", color: e };
      },
      ce: function(t, e) {
        return g.go(e, "ce");
      },
      pu: function(t, e) {
        return g.go(e, "pu");
      },
      "1/2": function(t, e) {
        var n = [];
        e.match(/^[+\-]/) && (n.push(e.substr(0, 1)), e = e.substr(1));
        var u = e.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
        return u[1] = u[1].replace(/\$/g, ""), n.push({ type_: "frac", p1: u[1], p2: u[2] }), u[3] && (u[3] = u[3].replace(/\$/g, ""), n.push({ type_: "tex-math", p1: u[3] })), n;
      },
      "9,9": function(t, e) {
        return g.go(e, "9,9");
      }
    },
    stateMachines: {
      tex: {
        transitions: C({
          empty: {
            0: { action_: "copy" }
          },
          "\\ce{(...)}": {
            0: { action_: [{ type_: "write", option: "{" }, "ce", { type_: "write", option: "}" }] }
          },
          "\\pu{(...)}": {
            0: { action_: [{ type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          else: {
            0: { action_: "copy" }
          }
        }),
        actions: {}
      },
      ce: {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          else: {
            "0|1|2": { action_: "beginsWithBond=false", revisit: !0, toContinue: !0 }
          },
          oxidation$: {
            0: { action_: "oxidation-output" }
          },
          CMT: {
            r: { action_: "rdt=", nextState: "rt" },
            rd: { action_: "rqt=", nextState: "rdt" }
          },
          arrowUpDown: {
            "0|1|2|as": { action_: ["sb=false", "output", "operator"], nextState: "1" }
          },
          uprightEntities: {
            "0|1|2": { action_: ["o=", "output"], nextState: "1" }
          },
          orbital: {
            "0|1|2|3": { action_: "o=", nextState: "o" }
          },
          "->": {
            "0|1|2|3": { action_: "r=", nextState: "r" },
            "a|as": { action_: ["output", "r="], nextState: "r" },
            "*": { action_: ["output", "r="], nextState: "r" }
          },
          "+": {
            o: { action_: "d= kv", nextState: "d" },
            "d|D": { action_: "d=", nextState: "d" },
            q: { action_: "d=", nextState: "qd" },
            "qd|qD": { action_: "d=", nextState: "qd" },
            dq: { action_: ["output", "d="], nextState: "d" },
            3: { action_: ["sb=false", "output", "operator"], nextState: "0" }
          },
          amount: {
            "0|2": { action_: "a=", nextState: "a" }
          },
          "pm-operator": {
            "0|1|2|a|as": { action_: ["sb=false", "output", { type_: "operator", option: "\\pm" }], nextState: "0" }
          },
          operator: {
            "0|1|2|a|as": { action_: ["sb=false", "output", "operator"], nextState: "0" }
          },
          "-$": {
            "o|q": { action_: ["charge or bond", "output"], nextState: "qd" },
            d: { action_: "d=", nextState: "d" },
            D: { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" },
            q: { action_: "d=", nextState: "qd" },
            qd: { action_: "d=", nextState: "qd" },
            "qD|dq": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" }
          },
          "-9": {
            "3|o": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "3" }
          },
          "- orbital overlap": {
            o: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" },
            d: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" }
          },
          "-": {
            "0|1|2": { action_: [{ type_: "output", option: 1 }, "beginsWithBond=true", { type_: "bond", option: "-" }], nextState: "3" },
            3: { action_: { type_: "bond", option: "-" } },
            a: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" },
            as: { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "-" }], nextState: "3" },
            b: { action_: "b=" },
            o: { action_: { type_: "- after o/d", option: !1 }, nextState: "2" },
            q: { action_: { type_: "- after o/d", option: !1 }, nextState: "2" },
            "d|qd|dq": { action_: { type_: "- after o/d", option: !0 }, nextState: "2" },
            "D|qD|p": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" }
          },
          amount2: {
            "1|3": { action_: "a=", nextState: "a" }
          },
          letters: {
            "0|1|2|3|a|as|b|p|bp|o": { action_: "o=", nextState: "o" },
            "q|dq": { action_: ["output", "o="], nextState: "o" },
            "d|D|qd|qD": { action_: "o after d", nextState: "o" }
          },
          digits: {
            o: { action_: "q=", nextState: "q" },
            "d|D": { action_: "q=", nextState: "dq" },
            q: { action_: ["output", "o="], nextState: "o" },
            a: { action_: "o=", nextState: "o" }
          },
          "space A": {
            "b|p|bp": { action_: [] }
          },
          space: {
            a: { action_: [], nextState: "as" },
            0: { action_: "sb=false" },
            "1|2": { action_: "sb=true" },
            "r|rt|rd|rdt|rdq": { action_: "output", nextState: "0" },
            "*": { action_: ["output", "sb=true"], nextState: "1" }
          },
          "1st-level escape": {
            "1|2": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }] },
            "*": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }], nextState: "0" }
          },
          "[(...)]": {
            "r|rt": { action_: "rd=", nextState: "rd" },
            "rd|rdt": { action_: "rq=", nextState: "rdq" }
          },
          "...": {
            "o|d|D|dq|qd|qD": { action_: ["output", { type_: "bond", option: "..." }], nextState: "3" },
            "*": { action_: [{ type_: "output", option: 1 }, { type_: "insert", option: "ellipsis" }], nextState: "1" }
          },
          ". __* ": {
            "*": { action_: ["output", { type_: "insert", option: "addition compound" }], nextState: "1" }
          },
          "state of aggregation $": {
            "*": { action_: ["output", "state of aggregation"], nextState: "1" }
          },
          "{[(": {
            "a|as|o": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" },
            "0|1|2|3": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" },
            "*": { action_: ["output", "o=", "output", "parenthesisLevel++"], nextState: "2" }
          },
          ")]}": {
            "0|1|2|3|b|p|bp|o": { action_: ["o=", "parenthesisLevel--"], nextState: "o" },
            "a|as|d|D|q|qd|qD|dq": { action_: ["output", "o=", "parenthesisLevel--"], nextState: "o" }
          },
          ", ": {
            "*": { action_: ["output", "comma"], nextState: "0" }
          },
          "^_": {
            "*": { action_: [] }
          },
          "^{(...)}|^($...$)": {
            "0|1|2|as": { action_: "b=", nextState: "b" },
            p: { action_: "b=", nextState: "bp" },
            "3|o": { action_: "d= kv", nextState: "D" },
            q: { action_: "d=", nextState: "qD" },
            "d|D|qd|qD|dq": { action_: ["output", "d="], nextState: "D" }
          },
          "^a|^\\x{}{}|^\\x{}|^\\x|'": {
            "0|1|2|as": { action_: "b=", nextState: "b" },
            p: { action_: "b=", nextState: "bp" },
            "3|o": { action_: "d= kv", nextState: "d" },
            q: { action_: "d=", nextState: "qd" },
            "d|qd|D|qD": { action_: "d=" },
            dq: { action_: ["output", "d="], nextState: "d" }
          },
          "_{(state of aggregation)}$": {
            "d|D|q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" }
          },
          "_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x": {
            "0|1|2|as": { action_: "p=", nextState: "p" },
            b: { action_: "p=", nextState: "bp" },
            "3|o": { action_: "q=", nextState: "q" },
            "d|D": { action_: "q=", nextState: "dq" },
            "q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" }
          },
          "=<>": {
            "0|1|2|3|a|as|o|q|d|D|qd|qD|dq": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" }
          },
          "#": {
            "0|1|2|3|a|as|o": { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "#" }], nextState: "3" }
          },
          "{}^": {
            "*": { action_: [{ type_: "output", option: 1 }, { type_: "insert", option: "tinySkip" }], nextState: "1" }
          },
          "{}": {
            "*": { action_: { type_: "output", option: 1 }, nextState: "1" }
          },
          "{...}": {
            "0|1|2|3|a|as|b|p|bp": { action_: "o=", nextState: "o" },
            "o|d|D|q|qd|qD|dq": { action_: ["output", "o="], nextState: "o" }
          },
          "$...$": {
            a: { action_: "a=" },
            "0|1|2|3|as|b|p|bp|o": { action_: "o=", nextState: "o" },
            "as|o": { action_: "o=" },
            "q|d|D|qd|qD|dq": { action_: ["output", "o="], nextState: "o" }
          },
          "\\bond{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" }
          },
          "\\frac{(...)}": {
            "*": { action_: [{ type_: "output", option: 1 }, "frac-output"], nextState: "3" }
          },
          "\\overset{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "overset-output"], nextState: "3" }
          },
          "\\underset{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "underset-output"], nextState: "3" }
          },
          "\\underbrace{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "underbrace-output"], nextState: "3" }
          },
          "\\color{(...)}{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "color-output"], nextState: "3" }
          },
          "\\color{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "color0-output"] }
          },
          "\\ce{(...)}": {
            "*": { action_: [{ type_: "output", option: 2 }, "ce"], nextState: "3" }
          },
          "\\,": {
            "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "1" }
          },
          "\\pu{(...)}": {
            "*": { action_: ["output", { type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }], nextState: "3" }
          },
          "\\x{}{}|\\x{}|\\x": {
            "0|1|2|3|a|as|b|p|bp|o|c0": { action_: ["o=", "output"], nextState: "3" },
            "*": { action_: ["output", "o=", "output"], nextState: "3" }
          },
          others: {
            "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "3" }
          },
          else2: {
            a: { action_: "a to o", nextState: "o", revisit: !0 },
            as: { action_: ["output", "sb=true"], nextState: "1", revisit: !0 },
            "r|rt|rd|rdt|rdq": { action_: ["output"], nextState: "0", revisit: !0 },
            "*": { action_: ["output", "copy"], nextState: "3" }
          }
        }),
        actions: {
          "o after d": function(t, e) {
            var n;
            if ((t.d || "").match(/^[1-9][0-9]*$/)) {
              var u = t.d;
              t.d = void 0, n = this.output(t), n.push({ type_: "tinySkip" }), t.b = u;
            } else
              n = this.output(t);
            return g.actions["o="](t, e), n;
          },
          "d= kv": function(t, e) {
            t.d = e, t.dType = "kv";
          },
          "charge or bond": function(t, e) {
            if (t.beginsWithBond) {
              var n = [];
              return g.concatArray(n, this.output(t)), g.concatArray(n, g.actions.bond(t, e, "-")), n;
            } else {
              t.d = e;
              return;
            }
          },
          "- after o/d": function(t, e, n) {
            var u = g.patterns.match_("orbital", t.o || ""), l = g.patterns.match_("one lowercase greek letter $", t.o || ""), c = g.patterns.match_("one lowercase latin letter $", t.o || ""), a = g.patterns.match_("$one lowercase latin letter$ $", t.o || ""), f = e === "-" && (u && u.remainder === "" || l || c || a);
            f && !t.a && !t.b && !t.p && !t.d && !t.q && !u && c && (t.o = "$" + t.o + "$");
            var o = [];
            return f ? (g.concatArray(o, this.output(t)), o.push({ type_: "hyphen" })) : (u = g.patterns.match_("digits", t.d || ""), n && u && u.remainder === "" ? (g.concatArray(o, g.actions["d="](t, e)), g.concatArray(o, this.output(t))) : (g.concatArray(o, this.output(t)), g.concatArray(o, g.actions.bond(t, e, "-")))), o;
          },
          "a to o": function(t) {
            t.o = t.a, t.a = void 0;
          },
          "sb=true": function(t) {
            t.sb = !0;
          },
          "sb=false": function(t) {
            t.sb = !1;
          },
          "beginsWithBond=true": function(t) {
            t.beginsWithBond = !0;
          },
          "beginsWithBond=false": function(t) {
            t.beginsWithBond = !1;
          },
          "parenthesisLevel++": function(t) {
            t.parenthesisLevel++;
          },
          "parenthesisLevel--": function(t) {
            t.parenthesisLevel--;
          },
          "state of aggregation": function(t, e) {
            return { type_: "state of aggregation", p1: g.go(e, "o") };
          },
          comma: function(t, e) {
            var n = e.replace(/\s*$/, ""), u = n !== e;
            return u && t.parenthesisLevel === 0 ? { type_: "comma enumeration L", p1: n } : { type_: "comma enumeration M", p1: n };
          },
          output: function(t, e, n) {
            var u;
            if (!t.r)
              u = [], !t.a && !t.b && !t.p && !t.o && !t.q && !t.d && !n || (t.sb && u.push({ type_: "entitySkip" }), !t.o && !t.q && !t.d && !t.b && !t.p && n !== 2 ? (t.o = t.a, t.a = void 0) : !t.o && !t.q && !t.d && (t.b || t.p) ? (t.o = t.a, t.d = t.b, t.q = t.p, t.a = t.b = t.p = void 0) : t.o && t.dType === "kv" && g.patterns.match_("d-oxidation$", t.d || "") ? t.dType = "oxidation" : t.o && t.dType === "kv" && !t.q && (t.dType = void 0), u.push({
                type_: "chemfive",
                a: g.go(t.a, "a"),
                b: g.go(t.b, "bd"),
                p: g.go(t.p, "pq"),
                o: g.go(t.o, "o"),
                q: g.go(t.q, "pq"),
                d: g.go(t.d, t.dType === "oxidation" ? "oxidation" : "bd"),
                dType: t.dType
              }));
            else {
              var l = void 0;
              t.rdt === "M" ? l = g.go(t.rd, "tex-math") : t.rdt === "T" ? l = [{ type_: "text", p1: t.rd || "" }] : l = g.go(t.rd, "ce");
              var c = void 0;
              t.rqt === "M" ? c = g.go(t.rq, "tex-math") : t.rqt === "T" ? c = [{ type_: "text", p1: t.rq || "" }] : c = g.go(t.rq, "ce"), u = {
                type_: "arrow",
                r: t.r,
                rd: l,
                rq: c
              };
            }
            for (var a in t)
              a !== "parenthesisLevel" && a !== "beginsWithBond" && delete t[a];
            return u;
          },
          "oxidation-output": function(t, e) {
            var n = ["{"];
            return g.concatArray(n, g.go(e, "oxidation")), n.push("}"), n;
          },
          "frac-output": function(t, e) {
            return { type_: "frac-ce", p1: g.go(e[0], "ce"), p2: g.go(e[1], "ce") };
          },
          "overset-output": function(t, e) {
            return { type_: "overset", p1: g.go(e[0], "ce"), p2: g.go(e[1], "ce") };
          },
          "underset-output": function(t, e) {
            return { type_: "underset", p1: g.go(e[0], "ce"), p2: g.go(e[1], "ce") };
          },
          "underbrace-output": function(t, e) {
            return { type_: "underbrace", p1: g.go(e[0], "ce"), p2: g.go(e[1], "ce") };
          },
          "color-output": function(t, e) {
            return { type_: "color", color1: e[0], color2: g.go(e[1], "ce") };
          },
          "r=": function(t, e) {
            t.r = e;
          },
          "rdt=": function(t, e) {
            t.rdt = e;
          },
          "rd=": function(t, e) {
            t.rd = e;
          },
          "rqt=": function(t, e) {
            t.rqt = e;
          },
          "rq=": function(t, e) {
            t.rq = e;
          },
          operator: function(t, e, n) {
            return { type_: "operator", kind_: n || e };
          }
        }
      },
      a: {
        transitions: C({
          empty: {
            "*": { action_: [] }
          },
          "1/2$": {
            0: { action_: "1/2" }
          },
          else: {
            0: { action_: [], nextState: "1", revisit: !0 }
          },
          "${(...)}$__$(...)$": {
            "*": { action_: "tex-math tight", nextState: "1" }
          },
          ",": {
            "*": { action_: { type_: "insert", option: "commaDecimal" } }
          },
          else2: {
            "*": { action_: "copy" }
          }
        }),
        actions: {}
      },
      o: {
        transitions: C({
          empty: {
            "*": { action_: [] }
          },
          "1/2$": {
            0: { action_: "1/2" }
          },
          else: {
            0: { action_: [], nextState: "1", revisit: !0 }
          },
          letters: {
            "*": { action_: "rm" }
          },
          "\\ca": {
            "*": { action_: { type_: "insert", option: "circa" } }
          },
          "\\pu{(...)}": {
            "*": { action_: [{ type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "\\x{}{}|\\x{}|\\x": {
            "*": { action_: "copy" }
          },
          "${(...)}$__$(...)$": {
            "*": { action_: "tex-math" }
          },
          "{(...)}": {
            "*": { action_: [{ type_: "write", option: "{" }, "text", { type_: "write", option: "}" }] }
          },
          else2: {
            "*": { action_: "copy" }
          }
        }),
        actions: {}
      },
      text: {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          "{...}": {
            "*": { action_: "text=" }
          },
          "${(...)}$__$(...)$": {
            "*": { action_: "tex-math" }
          },
          "\\greek": {
            "*": { action_: ["output", "rm"] }
          },
          "\\pu{(...)}": {
            "*": { action_: ["output", { type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "\\,|\\x{}{}|\\x{}|\\x": {
            "*": { action_: ["output", "copy"] }
          },
          else: {
            "*": { action_: "text=" }
          }
        }),
        actions: {
          output: function(t) {
            if (t.text_) {
              var e = { type_: "text", p1: t.text_ };
              for (var n in t)
                delete t[n];
              return e;
            }
          }
        }
      },
      pq: {
        transitions: C({
          empty: {
            "*": { action_: [] }
          },
          "state of aggregation $": {
            "*": { action_: "state of aggregation" }
          },
          i$: {
            0: { action_: [], nextState: "!f", revisit: !0 }
          },
          "(KV letters),": {
            0: { action_: "rm", nextState: "0" }
          },
          formula$: {
            0: { action_: [], nextState: "f", revisit: !0 }
          },
          "1/2$": {
            0: { action_: "1/2" }
          },
          else: {
            0: { action_: [], nextState: "!f", revisit: !0 }
          },
          "${(...)}$__$(...)$": {
            "*": { action_: "tex-math" }
          },
          "{(...)}": {
            "*": { action_: "text" }
          },
          "a-z": {
            f: { action_: "tex-math" }
          },
          letters: {
            "*": { action_: "rm" }
          },
          "-9.,9": {
            "*": { action_: "9,9" }
          },
          ",": {
            "*": { action_: { type_: "insert+p1", option: "comma enumeration S" } }
          },
          "\\color{(...)}{(...)}": {
            "*": { action_: "color-output" }
          },
          "\\color{(...)}": {
            "*": { action_: "color0-output" }
          },
          "\\ce{(...)}": {
            "*": { action_: "ce" }
          },
          "\\pu{(...)}": {
            "*": { action_: [{ type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "\\,|\\x{}{}|\\x{}|\\x": {
            "*": { action_: "copy" }
          },
          else2: {
            "*": { action_: "copy" }
          }
        }),
        actions: {
          "state of aggregation": function(t, e) {
            return { type_: "state of aggregation subscript", p1: g.go(e, "o") };
          },
          "color-output": function(t, e) {
            return { type_: "color", color1: e[0], color2: g.go(e[1], "pq") };
          }
        }
      },
      bd: {
        transitions: C({
          empty: {
            "*": { action_: [] }
          },
          x$: {
            0: { action_: [], nextState: "!f", revisit: !0 }
          },
          formula$: {
            0: { action_: [], nextState: "f", revisit: !0 }
          },
          else: {
            0: { action_: [], nextState: "!f", revisit: !0 }
          },
          "-9.,9 no missing 0": {
            "*": { action_: "9,9" }
          },
          ".": {
            "*": { action_: { type_: "insert", option: "electron dot" } }
          },
          "a-z": {
            f: { action_: "tex-math" }
          },
          x: {
            "*": { action_: { type_: "insert", option: "KV x" } }
          },
          letters: {
            "*": { action_: "rm" }
          },
          "'": {
            "*": { action_: { type_: "insert", option: "prime" } }
          },
          "${(...)}$__$(...)$": {
            "*": { action_: "tex-math" }
          },
          "{(...)}": {
            "*": { action_: "text" }
          },
          "\\color{(...)}{(...)}": {
            "*": { action_: "color-output" }
          },
          "\\color{(...)}": {
            "*": { action_: "color0-output" }
          },
          "\\ce{(...)}": {
            "*": { action_: "ce" }
          },
          "\\pu{(...)}": {
            "*": { action_: [{ type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "\\,|\\x{}{}|\\x{}|\\x": {
            "*": { action_: "copy" }
          },
          else2: {
            "*": { action_: "copy" }
          }
        }),
        actions: {
          "color-output": function(t, e) {
            return { type_: "color", color1: e[0], color2: g.go(e[1], "bd") };
          }
        }
      },
      oxidation: {
        transitions: C({
          empty: {
            "*": { action_: "roman-numeral" }
          },
          "pm-operator": {
            "*": { action_: { type_: "o=+p1", option: "\\pm" } }
          },
          else: {
            "*": { action_: "o=" }
          }
        }),
        actions: {
          "roman-numeral": function(t) {
            return { type_: "roman numeral", p1: t.o || "" };
          }
        }
      },
      "tex-math": {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          "\\ce{(...)}": {
            "*": { action_: ["output", "ce"] }
          },
          "\\pu{(...)}": {
            "*": { action_: ["output", { type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "{...}|\\,|\\x{}{}|\\x{}|\\x": {
            "*": { action_: "o=" }
          },
          else: {
            "*": { action_: "o=" }
          }
        }),
        actions: {
          output: function(t) {
            if (t.o) {
              var e = { type_: "tex-math", p1: t.o };
              for (var n in t)
                delete t[n];
              return e;
            }
          }
        }
      },
      "tex-math tight": {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          "\\ce{(...)}": {
            "*": { action_: ["output", "ce"] }
          },
          "\\pu{(...)}": {
            "*": { action_: ["output", { type_: "write", option: "{" }, "pu", { type_: "write", option: "}" }] }
          },
          "{...}|\\,|\\x{}{}|\\x{}|\\x": {
            "*": { action_: "o=" }
          },
          "-|+": {
            "*": { action_: "tight operator" }
          },
          else: {
            "*": { action_: "o=" }
          }
        }),
        actions: {
          "tight operator": function(t, e) {
            t.o = (t.o || "") + "{" + e + "}";
          },
          output: function(t) {
            if (t.o) {
              var e = { type_: "tex-math", p1: t.o };
              for (var n in t)
                delete t[n];
              return e;
            }
          }
        }
      },
      "9,9": {
        transitions: C({
          empty: {
            "*": { action_: [] }
          },
          ",": {
            "*": { action_: "comma" }
          },
          else: {
            "*": { action_: "copy" }
          }
        }),
        actions: {
          comma: function() {
            return { type_: "commaDecimal" };
          }
        }
      },
      pu: {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          space$: {
            "*": { action_: ["output", "space"] }
          },
          "{[(|)]}": {
            "0|a": { action_: "copy" }
          },
          "(-)(9)^(-9)": {
            0: { action_: "number^", nextState: "a" }
          },
          "(-)(9.,9)(e)(99)": {
            0: { action_: "enumber", nextState: "a" }
          },
          space: {
            "0|a": { action_: [] }
          },
          "pm-operator": {
            "0|a": { action_: { type_: "operator", option: "\\pm" }, nextState: "0" }
          },
          operator: {
            "0|a": { action_: "copy", nextState: "0" }
          },
          "//": {
            d: { action_: "o=", nextState: "/" }
          },
          "/": {
            d: { action_: "o=", nextState: "/" }
          },
          "{...}|else": {
            "0|d": { action_: "d=", nextState: "d" },
            a: { action_: ["space", "d="], nextState: "d" },
            "/|q": { action_: "q=", nextState: "q" }
          }
        }),
        actions: {
          enumber: function(t, e) {
            var n = [];
            return e[0] === "+-" || e[0] === "+/-" ? n.push("\\pm ") : e[0] && n.push(e[0]), e[1] && (g.concatArray(n, g.go(e[1], "pu-9,9")), e[2] && (e[2].match(/[,.]/) ? g.concatArray(n, g.go(e[2], "pu-9,9")) : n.push(e[2])), (e[3] || e[4]) && (e[3] === "e" || e[4] === "*" ? n.push({ type_: "cdot" }) : n.push({ type_: "times" }))), e[5] && n.push("10^{" + e[5] + "}"), n;
          },
          "number^": function(t, e) {
            var n = [];
            return e[0] === "+-" || e[0] === "+/-" ? n.push("\\pm ") : e[0] && n.push(e[0]), g.concatArray(n, g.go(e[1], "pu-9,9")), n.push("^{" + e[2] + "}"), n;
          },
          operator: function(t, e, n) {
            return { type_: "operator", kind_: n || e };
          },
          space: function() {
            return { type_: "pu-space-1" };
          },
          output: function(t) {
            var e, n = g.patterns.match_("{(...)}", t.d || "");
            n && n.remainder === "" && (t.d = n.match_);
            var u = g.patterns.match_("{(...)}", t.q || "");
            if (u && u.remainder === "" && (t.q = u.match_), t.d && (t.d = t.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C"), t.d = t.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F")), t.q) {
              t.q = t.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C"), t.q = t.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
              var l = {
                d: g.go(t.d, "pu"),
                q: g.go(t.q, "pu")
              };
              t.o === "//" ? e = { type_: "pu-frac", p1: l.d, p2: l.q } : (e = l.d, l.d.length > 1 || l.q.length > 1 ? e.push({ type_: " / " }) : e.push({ type_: "/" }), g.concatArray(e, l.q));
            } else
              e = g.go(t.d, "pu-2");
            for (var c in t)
              delete t[c];
            return e;
          }
        }
      },
      "pu-2": {
        transitions: C({
          empty: {
            "*": { action_: "output" }
          },
          "*": {
            "*": { action_: ["output", "cdot"], nextState: "0" }
          },
          "\\x": {
            "*": { action_: "rm=" }
          },
          space: {
            "*": { action_: ["output", "space"], nextState: "0" }
          },
          "^{(...)}|^(-1)": {
            1: { action_: "^(-1)" }
          },
          "-9.,9": {
            0: { action_: "rm=", nextState: "0" },
            1: { action_: "^(-1)", nextState: "0" }
          },
          "{...}|else": {
            "*": { action_: "rm=", nextState: "1" }
          }
        }),
        actions: {
          cdot: function() {
            return { type_: "tight cdot" };
          },
          "^(-1)": function(t, e) {
            t.rm += "^{" + e + "}";
          },
          space: function() {
            return { type_: "pu-space-2" };
          },
          output: function(t) {
            var e = [];
            if (t.rm) {
              var n = g.patterns.match_("{(...)}", t.rm || "");
              n && n.remainder === "" ? e = g.go(n.match_, "pu") : e = { type_: "rm", p1: t.rm };
            }
            for (var u in t)
              delete t[u];
            return e;
          }
        }
      },
      "pu-9,9": {
        transitions: C({
          empty: {
            0: { action_: "output-0" },
            o: { action_: "output-o" }
          },
          ",": {
            0: { action_: ["output-0", "comma"], nextState: "o" }
          },
          ".": {
            0: { action_: ["output-0", "copy"], nextState: "o" }
          },
          else: {
            "*": { action_: "text=" }
          }
        }),
        actions: {
          comma: function() {
            return { type_: "commaDecimal" };
          },
          "output-0": function(t) {
            var e = [];
            if (t.text_ = t.text_ || "", t.text_.length > 4) {
              var n = t.text_.length % 3;
              n === 0 && (n = 3);
              for (var u = t.text_.length - 3; u > 0; u -= 3)
                e.push(t.text_.substr(u, 3)), e.push({ type_: "1000 separator" });
              e.push(t.text_.substr(0, n)), e.reverse();
            } else
              e.push(t.text_);
            for (var l in t)
              delete t[l];
            return e;
          },
          "output-o": function(t) {
            var e = [];
            if (t.text_ = t.text_ || "", t.text_.length > 4) {
              var n = t.text_.length - 3, u = void 0;
              for (u = 0; u < n; u += 3)
                e.push(t.text_.substr(u, 3)), e.push({ type_: "1000 separator" });
              e.push(t.text_.substr(u));
            } else
              e.push(t.text_);
            for (var l in t)
              delete t[l];
            return e;
          }
        }
      }
    }
  }, y = {
    go: function(t, e) {
      if (!t)
        return "";
      for (var n = "", u = !1, l = 0; l < t.length; l++) {
        var c = t[l];
        typeof c == "string" ? n += c : (n += y._go2(c), c.type_ === "1st-level escape" && (u = !0));
      }
      return e && !u && n && (n = "{" + n + "}"), n;
    },
    _goInner: function(t) {
      return y.go(t, !1);
    },
    _go2: function(t) {
      var e;
      switch (t.type_) {
        case "chemfive":
          e = "";
          var n = {
            a: y._goInner(t.a),
            b: y._goInner(t.b),
            p: y._goInner(t.p),
            o: y._goInner(t.o),
            q: y._goInner(t.q),
            d: y._goInner(t.d)
          };
          n.a && (n.a.match(/^[+\-]/) && (n.a = "{" + n.a + "}"), e += n.a + "\\,"), (n.b || n.p) && (e += "{\\vphantom{A}}", e += "^{\\hphantom{" + (n.b || "") + "}}_{\\hphantom{" + (n.p || "") + "}}", e += "\\mkern-1.5mu", e += "{\\vphantom{A}}", e += "^{\\smash[t]{\\vphantom{2}}\\llap{" + (n.b || "") + "}}", e += "_{\\vphantom{2}\\llap{\\smash[t]{" + (n.p || "") + "}}}"), n.o && (n.o.match(/^[+\-]/) && (n.o = "{" + n.o + "}"), e += n.o), t.dType === "kv" ? ((n.d || n.q) && (e += "{\\vphantom{A}}"), n.d && (e += "^{" + n.d + "}"), n.q && (e += "_{\\smash[t]{" + n.q + "}}")) : t.dType === "oxidation" ? (n.d && (e += "{\\vphantom{A}}", e += "^{" + n.d + "}"), n.q && (e += "{\\vphantom{A}}", e += "_{\\smash[t]{" + n.q + "}}")) : (n.q && (e += "{\\vphantom{A}}", e += "_{\\smash[t]{" + n.q + "}}"), n.d && (e += "{\\vphantom{A}}", e += "^{" + n.d + "}"));
          break;
        case "rm":
          e = "\\mathrm{" + t.p1 + "}";
          break;
        case "text":
          t.p1.match(/[\^_]/) ? (t.p1 = t.p1.replace(" ", "~").replace("-", "\\text{-}"), e = "\\mathrm{" + t.p1 + "}") : e = "\\text{" + t.p1 + "}";
          break;
        case "roman numeral":
          e = "\\mathrm{" + t.p1 + "}";
          break;
        case "state of aggregation":
          e = "\\mskip2mu " + y._goInner(t.p1);
          break;
        case "state of aggregation subscript":
          e = "\\mskip1mu " + y._goInner(t.p1);
          break;
        case "bond":
          if (e = y._getBond(t.kind_), !e)
            throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + t.kind_ + ")"];
          break;
        case "frac":
          var u = "\\frac{" + t.p1 + "}{" + t.p2 + "}";
          e = "\\mathchoice{\\textstyle" + u + "}{" + u + "}{" + u + "}{" + u + "}";
          break;
        case "pu-frac":
          var l = "\\frac{" + y._goInner(t.p1) + "}{" + y._goInner(t.p2) + "}";
          e = "\\mathchoice{\\textstyle" + l + "}{" + l + "}{" + l + "}{" + l + "}";
          break;
        case "tex-math":
          e = t.p1 + " ";
          break;
        case "frac-ce":
          e = "\\frac{" + y._goInner(t.p1) + "}{" + y._goInner(t.p2) + "}";
          break;
        case "overset":
          e = "\\overset{" + y._goInner(t.p1) + "}{" + y._goInner(t.p2) + "}";
          break;
        case "underset":
          e = "\\underset{" + y._goInner(t.p1) + "}{" + y._goInner(t.p2) + "}";
          break;
        case "underbrace":
          e = "\\underbrace{" + y._goInner(t.p1) + "}_{" + y._goInner(t.p2) + "}";
          break;
        case "color":
          e = "{\\color{" + t.color1 + "}{" + y._goInner(t.color2) + "}}";
          break;
        case "color0":
          e = "\\color{" + t.color + "}";
          break;
        case "arrow":
          var c = {
            rd: y._goInner(t.rd),
            rq: y._goInner(t.rq)
          }, a = y._getArrow(t.r);
          c.rd || c.rq ? t.r === "<=>" || t.r === "<=>>" || t.r === "<<=>" || t.r === "<-->" ? (a = "\\long" + a, c.rd && (a = "\\overset{" + c.rd + "}{" + a + "}"), c.rq && (t.r === "<-->" ? a = "\\underset{\\lower2mu{" + c.rq + "}}{" + a + "}" : a = "\\underset{\\lower6mu{" + c.rq + "}}{" + a + "}"), a = " {}\\mathrel{" + a + "}{} ") : (c.rq && (a += "[{" + c.rq + "}]"), a += "{" + c.rd + "}", a = " {}\\mathrel{\\x" + a + "}{} ") : a = " {}\\mathrel{\\long" + a + "}{} ", e = a;
          break;
        case "operator":
          e = y._getOperator(t.kind_);
          break;
        case "1st-level escape":
          e = t.p1 + " ";
          break;
        case "space":
          e = " ";
          break;
        case "tinySkip":
          e = "\\mkern2mu";
          break;
        case "entitySkip":
          e = "~";
          break;
        case "pu-space-1":
          e = "~";
          break;
        case "pu-space-2":
          e = "\\mkern3mu ";
          break;
        case "1000 separator":
          e = "\\mkern2mu ";
          break;
        case "commaDecimal":
          e = "{,}";
          break;
        case "comma enumeration L":
          e = "{" + t.p1 + "}\\mkern6mu ";
          break;
        case "comma enumeration M":
          e = "{" + t.p1 + "}\\mkern3mu ";
          break;
        case "comma enumeration S":
          e = "{" + t.p1 + "}\\mkern1mu ";
          break;
        case "hyphen":
          e = "\\text{-}";
          break;
        case "addition compound":
          e = "\\,{\\cdot}\\,";
          break;
        case "electron dot":
          e = "\\mkern1mu \\bullet\\mkern1mu ";
          break;
        case "KV x":
          e = "{\\times}";
          break;
        case "prime":
          e = "\\prime ";
          break;
        case "cdot":
          e = "\\cdot ";
          break;
        case "tight cdot":
          e = "\\mkern1mu{\\cdot}\\mkern1mu ";
          break;
        case "times":
          e = "\\times ";
          break;
        case "circa":
          e = "{\\sim}";
          break;
        case "^":
          e = "uparrow";
          break;
        case "v":
          e = "downarrow";
          break;
        case "ellipsis":
          e = "\\ldots ";
          break;
        case "/":
          e = "/";
          break;
        case " / ":
          e = "\\,/\\,";
          break;
        default:
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
      return e;
    },
    _getArrow: function(t) {
      switch (t) {
        case "->":
          return "rightarrow";
        case "→":
          return "rightarrow";
        case "⟶":
          return "rightarrow";
        case "<-":
          return "leftarrow";
        case "<->":
          return "leftrightarrow";
        case "<-->":
          return "leftrightarrows";
        case "<=>":
          return "rightleftharpoons";
        case "⇌":
          return "rightleftharpoons";
        case "<=>>":
          return "Rightleftharpoons";
        case "<<=>":
          return "Leftrightharpoons";
        default:
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getBond: function(t) {
      switch (t) {
        case "-":
          return "{-}";
        case "1":
          return "{-}";
        case "=":
          return "{=}";
        case "2":
          return "{=}";
        case "#":
          return "{\\equiv}";
        case "3":
          return "{\\equiv}";
        case "~":
          return "{\\tripledash}";
        case "~-":
          return "{\\rlap{\\lower.1em{-}}\\raise.1em{\\tripledash}}";
        case "~=":
          return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
        case "~--":
          return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
        case "-~-":
          return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{-}}\\tripledash}";
        case "...":
          return "{{\\cdot}{\\cdot}{\\cdot}}";
        case "....":
          return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
        case "->":
          return "{\\rightarrow}";
        case "<-":
          return "{\\leftarrow}";
        case "<":
          return "{<}";
        case ">":
          return "{>}";
        default:
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getOperator: function(t) {
      switch (t) {
        case "+":
          return " {}+{} ";
        case "-":
          return " {}-{} ";
        case "=":
          return " {}={} ";
        case "<":
          return " {}<{} ";
        case ">":
          return " {}>{} ";
        case "<<":
          return " {}\\ll{} ";
        case ">>":
          return " {}\\gg{} ";
        case "\\pm":
          return " {}\\pm{} ";
        case "\\approx":
          return " {}\\approx{} ";
        case "$\\approx$":
          return " {}\\approx{} ";
        case "v":
          return " \\downarrow{} ";
        case "(v)":
          return " \\downarrow{} ";
        case "^":
          return " \\uparrow{} ";
        case "(^)":
          return " \\uparrow{} ";
        default:
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    }
  };
  return ae;
}
var Tr;
function Jn() {
  if (Tr) return kt;
  Tr = 1;
  var v = kt && kt.__importDefault || function(l) {
    return l && l.__esModule ? l : { default: l };
  };
  Object.defineProperty(kt, "__esModule", { value: !0 }), kt.MhchemConfiguration = void 0;
  var C = R(), g = F(), y = v(U()), t = v(st()), e = ve(), n = Yn(), u = {};
  return u.Macro = t.default.Macro, u.xArrow = e.AmsMethods.xArrow, u.Machine = function(l, c, a) {
    var f = l.GetArgument(c), o;
    try {
      o = n.mhchemParser.toTex(f, a);
    } catch (h) {
      throw new y.default(h[0], h[1]);
    }
    l.string = o + l.string.substr(l.i), l.i = 0;
  }, new g.CommandMap("mhchem", {
    ce: ["Machine", "ce"],
    pu: ["Machine", "pu"],
    longrightleftharpoons: [
      "Macro",
      "\\stackrel{\\textstyle{-}\\!\\!{\\rightharpoonup}}{\\smash{{\\leftharpoondown}\\!\\!{-}}}"
    ],
    longRightleftharpoons: [
      "Macro",
      "\\stackrel{\\textstyle{-}\\!\\!{\\rightharpoonup}}{\\smash{\\leftharpoondown}}"
    ],
    longLeftrightharpoons: [
      "Macro",
      "\\stackrel{\\textstyle\\vphantom{{-}}{\\rightharpoonup}}{\\smash{{\\leftharpoondown}\\!\\!{-}}}"
    ],
    longleftrightarrows: [
      "Macro",
      "\\stackrel{\\longrightarrow}{\\smash{\\longleftarrow}\\Rule{0px}{.25em}{0px}}"
    ],
    tripledash: [
      "Macro",
      "\\vphantom{-}\\raise2mu{\\kern2mu\\tiny\\text{-}\\kern1mu\\text{-}\\kern1mu\\text{-}\\kern2mu}"
    ],
    xleftrightarrow: ["xArrow", 8596, 6, 6],
    xrightleftharpoons: ["xArrow", 8652, 5, 7],
    xRightleftharpoons: ["xArrow", 8652, 5, 7],
    xLeftrightharpoons: ["xArrow", 8652, 5, 7]
  }, u), kt.MhchemConfiguration = C.Configuration.create("mhchem", { handler: { macro: ["mhchem"] } }), kt;
}
var oe = {}, Er;
function ta() {
  if (Er) return oe;
  Er = 1, Object.defineProperty(oe, "__esModule", { value: !0 }), oe.NoErrorsConfiguration = void 0;
  var v = R();
  function C(g, y, t, e) {
    var n = g.create("token", "mtext", {}, e.replace(/\n/g, " ")), u = g.create("node", "merror", [n], { "data-mjx-error": y, title: y });
    return u;
  }
  return oe.NoErrorsConfiguration = v.Configuration.create("noerrors", { nodes: { error: C } }), oe;
}
var Bt = {}, Or;
function ea() {
  if (Or) return Bt;
  Or = 1;
  var v = Bt && Bt.__values || function(y) {
    var t = typeof Symbol == "function" && Symbol.iterator, e = t && y[t], n = 0;
    if (e) return e.call(y);
    if (y && typeof y.length == "number") return {
      next: function() {
        return y && n >= y.length && (y = void 0), { value: y && y[n++], done: !y };
      }
    };
    throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(Bt, "__esModule", { value: !0 }), Bt.NoUndefinedConfiguration = void 0;
  var C = R();
  function g(y, t) {
    var e, n, u = y.create("text", "\\" + t), l = y.options.noundefined || {}, c = {};
    try {
      for (var a = v(["color", "background", "size"]), f = a.next(); !f.done; f = a.next()) {
        var o = f.value;
        l[o] && (c["math" + o] = l[o]);
      }
    } catch (h) {
      e = { error: h };
    } finally {
      try {
        f && !f.done && (n = a.return) && n.call(a);
      } finally {
        if (e) throw e.error;
      }
    }
    y.Push(y.create("node", "mtext", [], c, u));
  }
  return Bt.NoUndefinedConfiguration = C.Configuration.create("noundefined", {
    fallback: { macro: g },
    options: {
      noundefined: {
        color: "red",
        background: "",
        size: ""
      }
    },
    priority: 3
  }), Bt;
}
var ie = {}, Ct = {}, kr;
function ra() {
  if (kr) return Ct;
  kr = 1;
  var v = Ct && Ct.__extends || /* @__PURE__ */ (function() {
    var u = function(l, c) {
      return u = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(a, f) {
        a.__proto__ = f;
      } || function(a, f) {
        for (var o in f) Object.prototype.hasOwnProperty.call(f, o) && (a[o] = f[o]);
      }, u(l, c);
    };
    return function(l, c) {
      if (typeof c != "function" && c !== null)
        throw new TypeError("Class extends value " + String(c) + " is not a constructor or null");
      u(l, c);
      function a() {
        this.constructor = l;
      }
      l.prototype = c === null ? Object.create(c) : (a.prototype = c.prototype, new a());
    };
  })(), C = Ct && Ct.__importDefault || function(u) {
    return u && u.__esModule ? u : { default: u };
  };
  Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.AutoOpen = void 0;
  var g = ye(), y = C(V()), t = C(W()), e = C(rt()), n = (function(u) {
    v(l, u);
    function l() {
      var c = u !== null && u.apply(this, arguments) || this;
      return c.openCount = 0, c;
    }
    return Object.defineProperty(l.prototype, "kind", {
      get: function() {
        return "auto open";
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(l.prototype, "isOpen", {
      get: function() {
        return !0;
      },
      enumerable: !1,
      configurable: !0
    }), l.prototype.toMml = function() {
      var c = this.factory.configuration.parser, a = this.getProperty("right");
      if (this.getProperty("smash")) {
        var f = u.prototype.toMml.call(this), o = c.create("node", "mpadded", [f], { height: 0, depth: 0 });
        this.Clear(), this.Push(c.create("node", "TeXAtom", [o]));
      }
      a && this.Push(new e.default(a, c.stack.env, c.configuration).mml());
      var h = y.default.fenced(this.factory.configuration, this.getProperty("open"), u.prototype.toMml.call(this), this.getProperty("close"), this.getProperty("big"));
      return t.default.removeProperties(h, "open", "close", "texClass"), h;
    }, l.prototype.checkItem = function(c) {
      if (c.isKind("mml") && c.Size() === 1) {
        var a = c.toMml();
        a.isKind("mo") && a.getText() === this.getProperty("open") && this.openCount++;
      }
      var f = c.getProperty("autoclose");
      return f && f === this.getProperty("close") && !this.openCount-- ? this.getProperty("ignore") ? (this.Clear(), [[], !0]) : [[this.toMml()], !0] : u.prototype.checkItem.call(this, c);
    }, l.errors = Object.assign(Object.create(g.BaseItem.errors), {
      stop: ["ExtraOrMissingDelims", "Extra open or missing close delimiter"]
    }), l;
  })(g.BaseItem);
  return Ct.AutoOpen = n, Ct;
}
var ue = {}, Pt = {}, Br;
function na() {
  if (Br) return Pt;
  Br = 1;
  var v = Pt && Pt.__read || function(s, M) {
    var w = typeof Symbol == "function" && s[Symbol.iterator];
    if (!w) return s;
    var b = w.call(s), P, T = [], q;
    try {
      for (; (M === void 0 || M-- > 0) && !(P = b.next()).done; ) T.push(P.value);
    } catch (E) {
      q = { error: E };
    } finally {
      try {
        P && !P.done && (w = b.return) && w.call(b);
      } finally {
        if (q) throw q.error;
      }
    }
    return T;
  }, C = Pt && Pt.__importDefault || function(s) {
    return s && s.__esModule ? s : { default: s };
  };
  Object.defineProperty(Pt, "__esModule", { value: !0 });
  var g = C(st()), y = C(rt()), t = C(U()), e = bt(), n = C(V()), u = C(W()), l = Kr(), c = {}, a = {
    "(": ")",
    "[": "]",
    "{": "}",
    "|": "|"
  }, f = /^(b|B)i(g{1,2})$/;
  c.Quantity = function(s, M, w, b, P, T, q) {
    w === void 0 && (w = "("), b === void 0 && (b = ")"), P === void 0 && (P = !1), T === void 0 && (T = ""), q === void 0 && (q = "");
    var E = P ? s.GetStar() : !1, k = s.GetNext(), I = s.i, G = null;
    if (k === "\\") {
      if (s.i++, G = s.GetCS(), !G.match(f)) {
        var $ = s.create("node", "mrow");
        s.Push(n.default.fenced(s.configuration, w, $, b)), s.i = I;
        return;
      }
      k = s.GetNext();
    }
    var H = a[k];
    if (P && k !== "{")
      throw new t.default("MissingArgFor", "Missing argument for %1", s.currentCS);
    if (!H) {
      var $ = s.create("node", "mrow");
      s.Push(n.default.fenced(s.configuration, w, $, b)), s.i = I;
      return;
    }
    if (T) {
      var ct = s.create("token", "mi", { texClass: e.TEXCLASS.OP }, T);
      q && u.default.setAttribute(ct, "mathvariant", q), s.Push(s.itemFactory.create("fn", ct));
    }
    if (k === "{") {
      var S = s.GetArgument(M);
      k = P ? w : "\\{", H = P ? b : "\\}", S = E ? k + " " + S + " " + H : G ? "\\" + G + "l" + k + " " + S + " \\" + G + "r" + H : "\\left" + k + " " + S + " \\right" + H, s.Push(new y.default(S, s.stack.env, s.configuration).mml());
      return;
    }
    P && (k = w, H = b), s.i++, s.Push(s.itemFactory.create("auto open").setProperties({ open: k, close: H, big: G }));
  }, c.Eval = function(s, M) {
    var w = s.GetStar(), b = s.GetNext();
    if (b === "{") {
      var P = s.GetArgument(M), T = "\\left. " + (w ? "\\smash{" + P + "}" : P) + " \\vphantom{\\int}\\right|";
      s.string = s.string.slice(0, s.i) + T + s.string.slice(s.i);
      return;
    }
    if (b === "(" || b === "[") {
      s.i++, s.Push(s.itemFactory.create("auto open").setProperties({
        open: b,
        close: "|",
        smash: w,
        right: "\\vphantom{\\int}"
      }));
      return;
    }
    throw new t.default("MissingArgFor", "Missing argument for %1", s.currentCS);
  }, c.Commutator = function(s, M, w, b) {
    w === void 0 && (w = "["), b === void 0 && (b = "]");
    var P = s.GetStar(), T = s.GetNext(), q = null;
    if (T === "\\") {
      if (s.i++, q = s.GetCS(), !q.match(f))
        throw new t.default("MissingArgFor", "Missing argument for %1", s.currentCS);
      T = s.GetNext();
    }
    if (T !== "{")
      throw new t.default("MissingArgFor", "Missing argument for %1", s.currentCS);
    var E = s.GetArgument(M), k = s.GetArgument(M), I = E + "," + k;
    I = P ? w + " " + I + " " + b : q ? "\\" + q + "l" + w + " " + I + " \\" + q + "r" + b : "\\left" + w + " " + I + " \\right" + b, s.Push(new y.default(I, s.stack.env, s.configuration).mml());
  };
  var o = [65, 90], h = [97, 122], i = [913, 937], d = [945, 969], p = [48, 57];
  function r(s, M) {
    return s >= M[0] && s <= M[1];
  }
  function m(s, M, w, b) {
    var P = s.configuration.parser, T = l.NodeFactory.createToken(s, M, w, b), q = b.codePointAt(0);
    return b.length === 1 && !P.stack.env.font && P.stack.env.vectorFont && (r(q, o) || r(q, h) || r(q, i) || r(q, p) || r(q, d) && P.stack.env.vectorStar || u.default.getAttribute(T, "accent")) && u.default.setAttribute(T, "mathvariant", P.stack.env.vectorFont), T;
  }
  c.VectorBold = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = s.configuration.nodeFactory.get("token"), T = s.stack.env.font;
    delete s.stack.env.font, s.configuration.nodeFactory.set("token", m), s.stack.env.vectorFont = w ? "bold-italic" : "bold", s.stack.env.vectorStar = w;
    var q = new y.default(b, s.stack.env, s.configuration).mml();
    T && (s.stack.env.font = T), delete s.stack.env.vectorFont, delete s.stack.env.vectorStar, s.configuration.nodeFactory.set("token", P), s.Push(q);
  }, c.StarMacro = function(s, M, w) {
    for (var b = [], P = 3; P < arguments.length; P++)
      b[P - 3] = arguments[P];
    var T = s.GetStar(), q = [];
    if (w)
      for (var E = q.length; E < w; E++)
        q.push(s.GetArgument(M));
    var k = b.join(T ? "*" : "");
    k = n.default.substituteArgs(s, q, k), s.string = n.default.addArgs(s, k, s.string.slice(s.i)), s.i = 0, n.default.checkMaxMacros(s);
  };
  var _ = function(s, M, w, b, P) {
    var T = new y.default(b, s.stack.env, s.configuration).mml();
    s.Push(s.itemFactory.create(M, T));
    var q = s.GetNext(), E = a[q];
    if (E) {
      var k = "", I = "", G = "", $ = P.indexOf(q) !== -1;
      if (q === "{") {
        G = s.GetArgument(w), k = $ ? "\\left\\{" : "", I = $ ? "\\right\\}" : "";
        var H = k + " " + G + " " + I;
        s.string = H + s.string.slice(s.i), s.i = 0;
        return;
      }
      $ && (s.i++, s.Push(s.itemFactory.create("auto open").setProperties({ open: q, close: E })));
    }
  };
  c.OperatorApplication = function(s, M, w) {
    for (var b = [], P = 3; P < arguments.length; P++)
      b[P - 3] = arguments[P];
    _(s, "fn", M, w, b);
  }, c.VectorOperator = function(s, M, w) {
    for (var b = [], P = 3; P < arguments.length; P++)
      b[P - 3] = arguments[P];
    _(s, "mml", M, w, b);
  }, c.Expression = function(s, M, w, b) {
    w === void 0 && (w = !0), b === void 0 && (b = ""), b = b || M.slice(1);
    var P = w ? s.GetBrackets(M) : null, T = s.create("token", "mi", { texClass: e.TEXCLASS.OP }, b);
    if (P) {
      var q = new y.default(P, s.stack.env, s.configuration).mml();
      T = s.create("node", "msup", [T, q]);
    }
    s.Push(s.itemFactory.create("fn", T)), s.GetNext() === "(" && (s.i++, s.Push(s.itemFactory.create("auto open").setProperties({ open: "(", close: ")" })));
  }, c.Qqtext = function(s, M, w) {
    var b = s.GetStar(), P = w || s.GetArgument(M), T = (b ? "" : "\\quad") + "\\text{" + P + "}\\quad ";
    s.string = s.string.slice(0, s.i) + T + s.string.slice(s.i);
  }, c.Differential = function(s, M, w) {
    var b = s.GetBrackets(M), P = b != null ? "^{" + b + "}" : " ", T = s.GetNext() === "(", q = s.GetNext() === "{", E = w + P;
    if (!(T || q)) {
      E += s.GetArgument(M, !0) || "";
      var k = new y.default(E, s.stack.env, s.configuration).mml();
      s.Push(k);
      return;
    }
    if (q) {
      E += s.GetArgument(M);
      var k = new y.default(E, s.stack.env, s.configuration).mml();
      s.Push(s.create("node", "TeXAtom", [k], { texClass: e.TEXCLASS.OP }));
      return;
    }
    s.Push(new y.default(E, s.stack.env, s.configuration).mml()), s.i++, s.Push(s.itemFactory.create("auto open").setProperties({ open: "(", close: ")" }));
  }, c.Derivative = function(s, M, w, b) {
    var P = s.GetStar(), T = s.GetBrackets(M), q = 1, E = [];
    for (E.push(s.GetArgument(M)); s.GetNext() === "{" && q < w; )
      E.push(s.GetArgument(M)), q++;
    var k = !1, I = " ", G = " ";
    w > 2 && E.length > 2 ? (I = "^{" + (E.length - 1) + "}", k = !0) : T != null && (w > 2 && E.length > 1 && (k = !0), I = "^{" + T + "}", G = I);
    for (var $ = P ? "\\flatfrac" : "\\frac", H = E.length > 1 ? E[0] : "", ct = E.length > 1 ? E[1] : E[0], S = "", O = 2, D = void 0; D = E[O]; O++)
      S += b + " " + D;
    var B = $ + "{" + b + I + H + "}{" + b + " " + ct + G + " " + S + "}";
    s.Push(new y.default(B, s.stack.env, s.configuration).mml()), s.GetNext() === "(" && (s.i++, s.Push(s.itemFactory.create("auto open").setProperties({ open: "(", close: ")", ignore: k })));
  }, c.Bra = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = "", T = !1, q = !1;
    if (s.GetNext() === "\\") {
      var E = s.i;
      s.i++;
      var k = s.GetCS(), I = s.lookup("macro", k);
      I && I.symbol === "ket" ? (T = !0, E = s.i, q = s.GetStar(), s.GetNext() === "{" ? P = s.GetArgument(k, !0) : (s.i = E, q = !1)) : s.i = E;
    }
    var G = "";
    T ? G = w || q ? "\\langle{".concat(b, "}\\vert{").concat(P, "}\\rangle") : "\\left\\langle{".concat(b, "}\\middle\\vert{").concat(P, "}\\right\\rangle") : G = w || q ? "\\langle{".concat(b, "}\\vert") : "\\left\\langle{".concat(b, "}\\right\\vert{").concat(P, "}"), s.Push(new y.default(G, s.stack.env, s.configuration).mml());
  }, c.Ket = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = w ? "\\vert{".concat(b, "}\\rangle") : "\\left\\vert{".concat(b, "}\\right\\rangle");
    s.Push(new y.default(P, s.stack.env, s.configuration).mml());
  }, c.BraKet = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = null;
    s.GetNext() === "{" && (P = s.GetArgument(M, !0));
    var T = "";
    P == null ? T = w ? "\\langle{".concat(b, "}\\vert{").concat(b, "}\\rangle") : "\\left\\langle{".concat(b, "}\\middle\\vert{").concat(b, "}\\right\\rangle") : T = w ? "\\langle{".concat(b, "}\\vert{").concat(P, "}\\rangle") : "\\left\\langle{".concat(b, "}\\middle\\vert{").concat(P, "}\\right\\rangle"), s.Push(new y.default(T, s.stack.env, s.configuration).mml());
  }, c.KetBra = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = null;
    s.GetNext() === "{" && (P = s.GetArgument(M, !0));
    var T = "";
    P == null ? T = w ? "\\vert{".concat(b, "}\\rangle\\!\\langle{").concat(b, "}\\vert") : "\\left\\vert{".concat(b, "}\\middle\\rangle\\!\\middle\\langle{").concat(b, "}\\right\\vert") : T = w ? "\\vert{".concat(b, "}\\rangle\\!\\langle{").concat(P, "}\\vert") : "\\left\\vert{".concat(b, "}\\middle\\rangle\\!\\middle\\langle{").concat(P, "}\\right\\vert"), s.Push(new y.default(T, s.stack.env, s.configuration).mml());
  };
  function x(s, M, w) {
    var b = v(s, 3), P = b[0], T = b[1], q = b[2];
    return M && w ? "\\left\\langle{".concat(P, "}\\middle\\vert{").concat(T, "}\\middle\\vert{").concat(q, "}\\right\\rangle") : M ? "\\langle{".concat(P, "}\\vert{").concat(T, "}\\vert{").concat(q, "}\\rangle") : "\\left\\langle{".concat(P, "}\\right\\vert{").concat(T, "}\\left\\vert{").concat(q, "}\\right\\rangle");
  }
  c.Expectation = function(s, M) {
    var w = s.GetStar(), b = w && s.GetStar(), P = s.GetArgument(M), T = null;
    s.GetNext() === "{" && (T = s.GetArgument(M, !0));
    var q = P && T ? x([T, P, T], w, b) : w ? "\\langle {".concat(P, "} \\rangle") : "\\left\\langle {".concat(P, "} \\right\\rangle");
    s.Push(new y.default(q, s.stack.env, s.configuration).mml());
  }, c.MatrixElement = function(s, M) {
    var w = s.GetStar(), b = w && s.GetStar(), P = s.GetArgument(M), T = s.GetArgument(M), q = s.GetArgument(M), E = x([P, T, q], w, b);
    s.Push(new y.default(E, s.stack.env, s.configuration).mml());
  }, c.MatrixQuantity = function(s, M, w) {
    var b = s.GetStar(), P = s.GetNext(), T = w ? "smallmatrix" : "array", q = "", E = "", k = "";
    switch (P) {
      case "{":
        q = s.GetArgument(M);
        break;
      case "(":
        s.i++, E = b ? "\\lgroup" : "(", k = b ? "\\rgroup" : ")", q = s.GetUpTo(M, ")");
        break;
      case "[":
        s.i++, E = "[", k = "]", q = s.GetUpTo(M, "]");
        break;
      case "|":
        s.i++, E = "|", k = "|", q = s.GetUpTo(M, "|");
        break;
      default:
        E = "(", k = ")";
        break;
    }
    var I = (E ? "\\left" : "") + E + "\\begin{" + T + "}{} " + q + "\\end{" + T + "}" + (E ? "\\right" : "") + k;
    s.Push(new y.default(I, s.stack.env, s.configuration).mml());
  }, c.IdentityMatrix = function(s, M) {
    var w = s.GetArgument(M), b = parseInt(w, 10);
    if (isNaN(b))
      throw new t.default("InvalidNumber", "Invalid number");
    if (b <= 1) {
      s.string = "1" + s.string.slice(s.i), s.i = 0;
      return;
    }
    for (var P = Array(b).fill("0"), T = [], q = 0; q < b; q++) {
      var E = P.slice();
      E[q] = "1", T.push(E.join(" & "));
    }
    s.string = T.join("\\\\ ") + s.string.slice(s.i), s.i = 0;
  }, c.XMatrix = function(s, M) {
    var w = s.GetStar(), b = s.GetArgument(M), P = s.GetArgument(M), T = s.GetArgument(M), q = parseInt(P, 10), E = parseInt(T, 10);
    if (isNaN(q) || isNaN(E) || E.toString() !== T || q.toString() !== P)
      throw new t.default("InvalidNumber", "Invalid number");
    if (q = q < 1 ? 1 : q, E = E < 1 ? 1 : E, !w) {
      var k = Array(E).fill(b).join(" & "), I = Array(q).fill(k).join("\\\\ ");
      s.string = I + s.string.slice(s.i), s.i = 0;
      return;
    }
    var G = "";
    if (q === 1 && E === 1)
      G = b;
    else if (q === 1) {
      for (var k = [], $ = 1; $ <= E; $++)
        k.push("".concat(b, "_{").concat($, "}"));
      G = k.join(" & ");
    } else if (E === 1) {
      for (var k = [], $ = 1; $ <= q; $++)
        k.push("".concat(b, "_{").concat($, "}"));
      G = k.join("\\\\ ");
    } else {
      for (var H = [], $ = 1; $ <= q; $++) {
        for (var k = [], ct = 1; ct <= E; ct++)
          k.push("".concat(b, "_{{").concat($, "}{").concat(ct, "}}"));
        H.push(k.join(" & "));
      }
      G = H.join("\\\\ ");
    }
    s.string = G + s.string.slice(s.i), s.i = 0;
  }, c.PauliMatrix = function(s, M) {
    var w = s.GetArgument(M), b = w.slice(1);
    switch (w[0]) {
      case "0":
        b += " 1 & 0\\\\ 0 & 1";
        break;
      case "1":
      case "x":
        b += " 0 & 1\\\\ 1 & 0";
        break;
      case "2":
      case "y":
        b += " 0 & -i\\\\ i & 0";
        break;
      case "3":
      case "z":
        b += " 1 & 0\\\\ 0 & -1";
        break;
    }
    s.string = b + s.string.slice(s.i), s.i = 0;
  }, c.DiagonalMatrix = function(s, M, w) {
    if (s.GetNext() === "{") {
      var b = s.i;
      s.GetArgument(M);
      var P = s.i;
      s.i = b + 1;
      for (var T = [], q = "", E = s.i; E < P; ) {
        try {
          q = s.GetUpTo(M, ",");
        } catch {
          s.i = P, T.push(s.string.slice(E, P - 1));
          break;
        }
        if (s.i >= P) {
          T.push(s.string.slice(E, P));
          break;
        }
        E = s.i, T.push(q);
      }
      s.string = A(T, w) + s.string.slice(P), s.i = 0;
    }
  };
  function A(s, M) {
    for (var w = s.length, b = [], P = 0; P < w; P++)
      b.push(Array(M ? w - P : P + 1).join("&") + "\\mqty{" + s[P] + "}");
    return b.join("\\\\ ");
  }
  return c.AutoClose = function(s, M, w) {
    var b = s.create("token", "mo", { stretchy: !1 }, M), P = s.itemFactory.create("mml", b).setProperties({ autoclose: M });
    s.Push(P);
  }, c.Vnabla = function(s, M) {
    var w = s.options.physics.arrowdel ? "\\vec{\\gradientnabla}" : "{\\gradientnabla}";
    return s.Push(new y.default(w, s.stack.env, s.configuration).mml());
  }, c.DiffD = function(s, M) {
    var w = s.options.physics.italicdiff ? "d" : "{\\rm d}";
    return s.Push(new y.default(w, s.stack.env, s.configuration).mml());
  }, c.Macro = g.default.Macro, c.NamedFn = g.default.NamedFn, c.Array = g.default.Array, Pt.default = c, Pt;
}
var Dr;
function aa() {
  if (Dr) return ue;
  Dr = 1;
  var v = ue && ue.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(ue, "__esModule", { value: !0 });
  var C = F(), g = v(na()), y = tt(), t = v(St()), e = bt();
  return new C.CommandMap("Physics-automatic-bracing-macros", {
    quantity: "Quantity",
    qty: "Quantity",
    pqty: ["Quantity", "(", ")", !0],
    bqty: ["Quantity", "[", "]", !0],
    vqty: ["Quantity", "|", "|", !0],
    Bqty: ["Quantity", "\\{", "\\}", !0],
    absolutevalue: ["Quantity", "|", "|", !0],
    abs: ["Quantity", "|", "|", !0],
    norm: ["Quantity", "\\|", "\\|", !0],
    evaluated: "Eval",
    eval: "Eval",
    order: [
      "Quantity",
      "(",
      ")",
      !0,
      "O",
      y.TexConstant.Variant.CALLIGRAPHIC
    ],
    commutator: "Commutator",
    comm: "Commutator",
    anticommutator: ["Commutator", "\\{", "\\}"],
    acomm: ["Commutator", "\\{", "\\}"],
    poissonbracket: ["Commutator", "\\{", "\\}"],
    pb: ["Commutator", "\\{", "\\}"]
  }, g.default), new C.CharacterMap("Physics-vector-mo", t.default.mathchar0mo, {
    dotproduct: ["⋅", { mathvariant: y.TexConstant.Variant.BOLD }],
    vdot: ["⋅", { mathvariant: y.TexConstant.Variant.BOLD }],
    crossproduct: "×",
    cross: "×",
    cp: "×",
    gradientnabla: ["∇", { mathvariant: y.TexConstant.Variant.BOLD }]
  }), new C.CharacterMap("Physics-vector-mi", t.default.mathchar0mi, {
    real: ["ℜ", { mathvariant: y.TexConstant.Variant.NORMAL }],
    imaginary: ["ℑ", { mathvariant: y.TexConstant.Variant.NORMAL }]
  }), new C.CommandMap("Physics-vector-macros", {
    vnabla: "Vnabla",
    vectorbold: "VectorBold",
    vb: "VectorBold",
    vectorarrow: ["StarMacro", 1, "\\vec{\\vb", "{#1}}"],
    va: ["StarMacro", 1, "\\vec{\\vb", "{#1}}"],
    vectorunit: ["StarMacro", 1, "\\hat{\\vb", "{#1}}"],
    vu: ["StarMacro", 1, "\\hat{\\vb", "{#1}}"],
    gradient: ["OperatorApplication", "\\vnabla", "(", "["],
    grad: ["OperatorApplication", "\\vnabla", "(", "["],
    divergence: ["VectorOperator", "\\vnabla\\vdot", "(", "["],
    div: ["VectorOperator", "\\vnabla\\vdot", "(", "["],
    curl: ["VectorOperator", "\\vnabla\\crossproduct", "(", "["],
    laplacian: ["OperatorApplication", "\\nabla^2", "(", "["]
  }, g.default), new C.CommandMap("Physics-expressions-macros", {
    sin: "Expression",
    sinh: "Expression",
    arcsin: "Expression",
    asin: "Expression",
    cos: "Expression",
    cosh: "Expression",
    arccos: "Expression",
    acos: "Expression",
    tan: "Expression",
    tanh: "Expression",
    arctan: "Expression",
    atan: "Expression",
    csc: "Expression",
    csch: "Expression",
    arccsc: "Expression",
    acsc: "Expression",
    sec: "Expression",
    sech: "Expression",
    arcsec: "Expression",
    asec: "Expression",
    cot: "Expression",
    coth: "Expression",
    arccot: "Expression",
    acot: "Expression",
    exp: ["Expression", !1],
    log: "Expression",
    ln: "Expression",
    det: ["Expression", !1],
    Pr: ["Expression", !1],
    tr: ["Expression", !1],
    trace: ["Expression", !1, "tr"],
    Tr: ["Expression", !1],
    Trace: ["Expression", !1, "Tr"],
    rank: "NamedFn",
    erf: ["Expression", !1],
    Residue: ["Macro", "\\mathrm{Res}"],
    Res: ["OperatorApplication", "\\Residue", "(", "[", "{"],
    principalvalue: ["OperatorApplication", "{\\cal P}"],
    pv: ["OperatorApplication", "{\\cal P}"],
    PV: ["OperatorApplication", "{\\rm P.V.}"],
    Re: ["OperatorApplication", "\\mathrm{Re}", "{"],
    Im: ["OperatorApplication", "\\mathrm{Im}", "{"],
    sine: ["NamedFn", "sin"],
    hypsine: ["NamedFn", "sinh"],
    arcsine: ["NamedFn", "arcsin"],
    asine: ["NamedFn", "asin"],
    cosine: ["NamedFn", "cos"],
    hypcosine: ["NamedFn", "cosh"],
    arccosine: ["NamedFn", "arccos"],
    acosine: ["NamedFn", "acos"],
    tangent: ["NamedFn", "tan"],
    hyptangent: ["NamedFn", "tanh"],
    arctangent: ["NamedFn", "arctan"],
    atangent: ["NamedFn", "atan"],
    cosecant: ["NamedFn", "csc"],
    hypcosecant: ["NamedFn", "csch"],
    arccosecant: ["NamedFn", "arccsc"],
    acosecant: ["NamedFn", "acsc"],
    secant: ["NamedFn", "sec"],
    hypsecant: ["NamedFn", "sech"],
    arcsecant: ["NamedFn", "arcsec"],
    asecant: ["NamedFn", "asec"],
    cotangent: ["NamedFn", "cot"],
    hypcotangent: ["NamedFn", "coth"],
    arccotangent: ["NamedFn", "arccot"],
    acotangent: ["NamedFn", "acot"],
    exponential: ["NamedFn", "exp"],
    logarithm: ["NamedFn", "log"],
    naturallogarithm: ["NamedFn", "ln"],
    determinant: ["NamedFn", "det"],
    Probability: ["NamedFn", "Pr"]
  }, g.default), new C.CommandMap("Physics-quick-quad-macros", {
    qqtext: "Qqtext",
    qq: "Qqtext",
    qcomma: ["Macro", "\\qqtext*{,}"],
    qc: ["Macro", "\\qqtext*{,}"],
    qcc: ["Qqtext", "c.c."],
    qif: ["Qqtext", "if"],
    qthen: ["Qqtext", "then"],
    qelse: ["Qqtext", "else"],
    qotherwise: ["Qqtext", "otherwise"],
    qunless: ["Qqtext", "unless"],
    qgiven: ["Qqtext", "given"],
    qusing: ["Qqtext", "using"],
    qassume: ["Qqtext", "assume"],
    qsince: ["Qqtext", "since"],
    qlet: ["Qqtext", "let"],
    qfor: ["Qqtext", "for"],
    qall: ["Qqtext", "all"],
    qeven: ["Qqtext", "even"],
    qodd: ["Qqtext", "odd"],
    qinteger: ["Qqtext", "integer"],
    qand: ["Qqtext", "and"],
    qor: ["Qqtext", "or"],
    qas: ["Qqtext", "as"],
    qin: ["Qqtext", "in"]
  }, g.default), new C.CommandMap("Physics-derivative-macros", {
    diffd: "DiffD",
    flatfrac: ["Macro", "\\left.#1\\middle/#2\\right.", 2],
    differential: ["Differential", "\\diffd"],
    dd: ["Differential", "\\diffd"],
    variation: ["Differential", "\\delta"],
    var: ["Differential", "\\delta"],
    derivative: ["Derivative", 2, "\\diffd"],
    dv: ["Derivative", 2, "\\diffd"],
    partialderivative: ["Derivative", 3, "\\partial"],
    pderivative: ["Derivative", 3, "\\partial"],
    pdv: ["Derivative", 3, "\\partial"],
    functionalderivative: ["Derivative", 2, "\\delta"],
    fderivative: ["Derivative", 2, "\\delta"],
    fdv: ["Derivative", 2, "\\delta"]
  }, g.default), new C.CommandMap("Physics-bra-ket-macros", {
    bra: "Bra",
    ket: "Ket",
    innerproduct: "BraKet",
    ip: "BraKet",
    braket: "BraKet",
    outerproduct: "KetBra",
    dyad: "KetBra",
    ketbra: "KetBra",
    op: "KetBra",
    expectationvalue: "Expectation",
    expval: "Expectation",
    ev: "Expectation",
    matrixelement: "MatrixElement",
    matrixel: "MatrixElement",
    mel: "MatrixElement"
  }, g.default), new C.CommandMap("Physics-matrix-macros", {
    matrixquantity: "MatrixQuantity",
    mqty: "MatrixQuantity",
    pmqty: ["Macro", "\\mqty(#1)", 1],
    Pmqty: ["Macro", "\\mqty*(#1)", 1],
    bmqty: ["Macro", "\\mqty[#1]", 1],
    vmqty: ["Macro", "\\mqty|#1|", 1],
    smallmatrixquantity: ["MatrixQuantity", !0],
    smqty: ["MatrixQuantity", !0],
    spmqty: ["Macro", "\\smqty(#1)", 1],
    sPmqty: ["Macro", "\\smqty*(#1)", 1],
    sbmqty: ["Macro", "\\smqty[#1]", 1],
    svmqty: ["Macro", "\\smqty|#1|", 1],
    matrixdeterminant: ["Macro", "\\vmqty{#1}", 1],
    mdet: ["Macro", "\\vmqty{#1}", 1],
    smdet: ["Macro", "\\svmqty{#1}", 1],
    identitymatrix: "IdentityMatrix",
    imat: "IdentityMatrix",
    xmatrix: "XMatrix",
    xmat: "XMatrix",
    zeromatrix: ["Macro", "\\xmat{0}{#1}{#2}", 2],
    zmat: ["Macro", "\\xmat{0}{#1}{#2}", 2],
    paulimatrix: "PauliMatrix",
    pmat: "PauliMatrix",
    diagonalmatrix: "DiagonalMatrix",
    dmat: "DiagonalMatrix",
    antidiagonalmatrix: ["DiagonalMatrix", !0],
    admat: ["DiagonalMatrix", !0]
  }, g.default), new C.EnvironmentMap("Physics-aux-envs", t.default.environment, {
    smallmatrix: ["Array", null, null, null, "c", "0.333em", ".2em", "S", 1]
  }, g.default), new C.MacroMap("Physics-characters", {
    "|": ["AutoClose", e.TEXCLASS.ORD],
    ")": "AutoClose",
    "]": "AutoClose"
  }, g.default), ue;
}
var Ir;
function oa() {
  if (Ir) return ie;
  Ir = 1;
  var v;
  Object.defineProperty(ie, "__esModule", { value: !0 }), ie.PhysicsConfiguration = void 0;
  var C = R(), g = ra();
  return aa(), ie.PhysicsConfiguration = C.Configuration.create("physics", {
    handler: {
      macro: [
        "Physics-automatic-bracing-macros",
        "Physics-vector-macros",
        "Physics-vector-mo",
        "Physics-vector-mi",
        "Physics-derivative-macros",
        "Physics-expressions-macros",
        "Physics-quick-quad-macros",
        "Physics-bra-ket-macros",
        "Physics-matrix-macros"
      ],
      character: ["Physics-characters"],
      environment: ["Physics-aux-envs"]
    },
    items: (v = {}, v[g.AutoOpen.prototype.kind] = g.AutoOpen, v),
    options: {
      physics: {
        italicdiff: !1,
        arrowdel: !1
      }
    }
  }), ie;
}
var Dt = {}, jr;
function ia() {
  return jr || (jr = 1, (function(v) {
    var C = Dt && Dt.__values || function(o) {
      var h = typeof Symbol == "function" && Symbol.iterator, i = h && o[h], d = 0;
      if (i) return i.call(o);
      if (o && typeof o.length == "number") return {
        next: function() {
          return o && d >= o.length && (o = void 0), { value: o && o[d++], done: !o };
        }
      };
      throw new TypeError(h ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }, g = Dt && Dt.__importDefault || function(o) {
      return o && o.__esModule ? o : { default: o };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.SetOptionsConfiguration = v.SetOptionsUtil = void 0;
    var y = R(), t = F(), e = g(U()), n = g(V()), u = me(), l = g(st()), c = he();
    v.SetOptionsUtil = {
      filterPackage: function(o, h) {
        if (h !== "tex" && !y.ConfigurationHandler.get(h))
          throw new e.default("NotAPackage", "Not a defined package: %1", h);
        var i = o.options.setoptions, d = i.allowOptions[h];
        if (d === void 0 && !i.allowPackageDefault || d === !1)
          throw new e.default("PackageNotSettable", `Options can't be set for package "%1"`, h);
        return !0;
      },
      filterOption: function(o, h, i) {
        var d, p = o.options.setoptions, r = p.allowOptions[h] || {}, m = r.hasOwnProperty(i) && !(0, c.isObject)(r[i]) ? r[i] : null;
        if (m === !1 || m === null && !p.allowOptionsDefault)
          throw new e.default("OptionNotSettable", 'Option "%1" is not allowed to be set', i);
        if (!(!((d = h === "tex" ? o.options : o.options[h]) === null || d === void 0) && d.hasOwnProperty(i)))
          throw h === "tex" ? new e.default("InvalidTexOption", 'Invalid TeX option "%1"', i) : new e.default("InvalidOptionKey", 'Invalid option "%1" for package "%2"', i, h);
        return !0;
      },
      filterValue: function(o, h, i, d) {
        return d;
      }
    };
    var a = new t.CommandMap("setoptions", {
      setOptions: "SetOptions"
    }, {
      SetOptions: function(o, h) {
        var i, d, p = o.GetBrackets(h) || "tex", r = n.default.keyvalOptions(o.GetArgument(h)), m = o.options.setoptions;
        if (m.filterPackage(o, p))
          try {
            for (var _ = C(Object.keys(r)), x = _.next(); !x.done; x = _.next()) {
              var A = x.value;
              m.filterOption(o, p, A) && ((p === "tex" ? o.options : o.options[p])[A] = m.filterValue(o, p, A, r[A]));
            }
          } catch (s) {
            i = { error: s };
          } finally {
            try {
              x && !x.done && (d = _.return) && d.call(_);
            } finally {
              if (i) throw i.error;
            }
          }
      }
    });
    function f(o, h) {
      var i = h.parseOptions.handlers.get("macro").lookup("require");
      i && (a.add("Require", new u.Macro("Require", i._func)), a.add("require", new u.Macro("require", l.default.Macro, ["\\Require{#2}\\setOptions[#2]{#1}", 2, ""])));
    }
    v.SetOptionsConfiguration = y.Configuration.create("setoptions", {
      handler: { macro: ["setoptions"] },
      config: f,
      priority: 3,
      options: {
        setoptions: {
          filterPackage: v.SetOptionsUtil.filterPackage,
          filterOption: v.SetOptionsUtil.filterOption,
          filterValue: v.SetOptionsUtil.filterValue,
          allowPackageDefault: !0,
          allowOptionsDefault: !0,
          allowOptions: (0, c.expandable)({
            tex: {
              FindTeX: !1,
              formatError: !1,
              package: !1,
              baseURL: !1,
              tags: !1,
              maxBuffer: !1,
              maxMaxros: !1,
              macros: !1,
              environments: !1
            },
            setoptions: !1,
            autoload: !1,
            require: !1,
            configmacros: !1,
            tagformat: !1
          })
        }
      }
    });
  })(Dt)), Dt;
}
var At = {}, Nr;
function ua() {
  if (Nr) return At;
  Nr = 1;
  var v = At && At.__extends || /* @__PURE__ */ (function() {
    var e = function(n, u) {
      return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(l, c) {
        l.__proto__ = c;
      } || function(l, c) {
        for (var a in c) Object.prototype.hasOwnProperty.call(c, a) && (l[a] = c[a]);
      }, e(n, u);
    };
    return function(n, u) {
      if (typeof u != "function" && u !== null)
        throw new TypeError("Class extends value " + String(u) + " is not a constructor or null");
      e(n, u);
      function l() {
        this.constructor = n;
      }
      n.prototype = u === null ? Object.create(u) : (l.prototype = u.prototype, new l());
    };
  })();
  Object.defineProperty(At, "__esModule", { value: !0 }), At.TagFormatConfiguration = At.tagformatConfig = void 0;
  var C = R(), g = _e(), y = 0;
  function t(e, n) {
    var u = n.parseOptions.options.tags;
    u !== "base" && e.tags.hasOwnProperty(u) && g.TagsFactory.add(u, e.tags[u]);
    var l = g.TagsFactory.create(n.parseOptions.options.tags).constructor, c = (function(f) {
      v(o, f);
      function o() {
        return f !== null && f.apply(this, arguments) || this;
      }
      return o.prototype.formatNumber = function(h) {
        return n.parseOptions.options.tagformat.number(h);
      }, o.prototype.formatTag = function(h) {
        return n.parseOptions.options.tagformat.tag(h);
      }, o.prototype.formatId = function(h) {
        return n.parseOptions.options.tagformat.id(h);
      }, o.prototype.formatUrl = function(h, i) {
        return n.parseOptions.options.tagformat.url(h, i);
      }, o;
    })(l);
    y++;
    var a = "configTags-" + y;
    g.TagsFactory.add(a, c), n.parseOptions.options.tags = a;
  }
  return At.tagformatConfig = t, At.TagFormatConfiguration = C.Configuration.create("tagformat", {
    config: [t, 10],
    options: {
      tagformat: {
        number: function(e) {
          return e.toString();
        },
        tag: function(e) {
          return "(" + e + ")";
        },
        id: function(e) {
          return "mjx-eqn:" + e.replace(/\s/g, "_");
        },
        url: function(e, n) {
          return n + "#" + encodeURIComponent(e);
        }
      }
    }
  }), At;
}
var le = {}, se = {}, It = {}, Gr;
function Ee() {
  if (Gr) return It;
  Gr = 1;
  var v = It && It.__importDefault || function(t) {
    return t && t.__esModule ? t : { default: t };
  };
  Object.defineProperty(It, "__esModule", { value: !0 }), It.TextMacrosMethods = void 0;
  var C = v(rt()), g = vn(), y = v(st());
  return It.TextMacrosMethods = {
    Comment: function(t, e) {
      for (; t.i < t.string.length && t.string.charAt(t.i) !== `
`; )
        t.i++;
      t.i++;
    },
    Math: function(t, e) {
      t.saveText();
      for (var n = t.i, u, l, c = 0; l = t.GetNext(); )
        switch (u = t.i++, l) {
          case "\\":
            var a = t.GetCS();
            a === ")" && (l = "\\(");
          case "$":
            if (c === 0 && e === l) {
              var f = t.texParser.configuration, o = new C.default(t.string.substr(n, u - n), t.stack.env, f).mml();
              t.PushMath(o);
              return;
            }
            break;
          case "{":
            c++;
            break;
          case "}":
            c === 0 && t.Error("ExtraCloseMissingOpen", "Extra close brace or missing open brace"), c--;
            break;
        }
      t.Error("MathNotTerminated", "Math-mode is not properly terminated");
    },
    MathModeOnly: function(t, e) {
      t.Error("MathModeOnly", "'%1' allowed only in math mode", e);
    },
    Misplaced: function(t, e) {
      t.Error("Misplaced", "'%1' can not be used here", e);
    },
    OpenBrace: function(t, e) {
      var n = t.stack.env;
      t.envStack.push(n), t.stack.env = Object.assign({}, n);
    },
    CloseBrace: function(t, e) {
      t.envStack.length ? (t.saveText(), t.stack.env = t.envStack.pop()) : t.Error("ExtraCloseMissingOpen", "Extra close brace or missing open brace");
    },
    OpenQuote: function(t, e) {
      t.string.charAt(t.i) === e ? (t.text += "“", t.i++) : t.text += "‘";
    },
    CloseQuote: function(t, e) {
      t.string.charAt(t.i) === e ? (t.text += "”", t.i++) : t.text += "’";
    },
    Tilde: function(t, e) {
      t.text += " ";
    },
    Space: function(t, e) {
      for (t.text += " "; t.GetNext().match(/\s/); )
        t.i++;
    },
    SelfQuote: function(t, e) {
      t.text += e.substr(1);
    },
    Insert: function(t, e, n) {
      t.text += n;
    },
    Accent: function(t, e, n) {
      var u = t.ParseArg(e), l = t.create("token", "mo", {}, n);
      t.addAttributes(l), t.Push(t.create("node", "mover", [u, l]));
    },
    Emph: function(t, e) {
      var n = t.stack.env.mathvariant === "-tex-mathit" ? "normal" : "-tex-mathit";
      t.Push(t.ParseTextArg(e, { mathvariant: n }));
    },
    SetFont: function(t, e, n) {
      t.saveText(), t.stack.env.mathvariant = n;
    },
    SetSize: function(t, e, n) {
      t.saveText(), t.stack.env.mathsize = n;
    },
    CheckAutoload: function(t, e) {
      var n = t.configuration.packageData.get("autoload"), u = t.texParser;
      e = e.slice(1);
      var l = u.lookup("macro", e);
      if (!l || n && l._func === n.Autoload) {
        if (u.parse("macro", [u, e]), !l)
          return;
        (0, g.retryAfter)(Promise.resolve());
      }
      u.parse("macro", [t, e]);
    },
    Macro: y.default.Macro,
    Spacer: y.default.Spacer,
    Hskip: y.default.Hskip,
    rule: y.default.rule,
    Rule: y.default.Rule,
    HandleRef: y.default.HandleRef
  }, It;
}
var K = {}, Fr;
function on() {
  if (Fr) return K;
  Fr = 1;
  var v = K && K.__extends || /* @__PURE__ */ (function() {
    var o = function(h, i) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, p) {
        d.__proto__ = p;
      } || function(d, p) {
        for (var r in p) Object.prototype.hasOwnProperty.call(p, r) && (d[r] = p[r]);
      }, o(h, i);
    };
    return function(h, i) {
      if (typeof i != "function" && i !== null)
        throw new TypeError("Class extends value " + String(i) + " is not a constructor or null");
      o(h, i);
      function d() {
        this.constructor = h;
      }
      h.prototype = i === null ? Object.create(i) : (d.prototype = i.prototype, new d());
    };
  })(), C = K && K.__values || function(o) {
    var h = typeof Symbol == "function" && Symbol.iterator, i = h && o[h], d = 0;
    if (i) return i.call(o);
    if (o && typeof o.length == "number") return {
      next: function() {
        return o && d >= o.length && (o = void 0), { value: o && o[d++], done: !o };
      }
    };
    throw new TypeError(h ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, g = K && K.__read || function(o, h) {
    var i = typeof Symbol == "function" && o[Symbol.iterator];
    if (!i) return o;
    var d = i.call(o), p, r = [], m;
    try {
      for (; (h === void 0 || h-- > 0) && !(p = d.next()).done; ) r.push(p.value);
    } catch (_) {
      m = { error: _ };
    } finally {
      try {
        p && !p.done && (i = d.return) && i.call(d);
      } finally {
        if (m) throw m.error;
      }
    }
    return r;
  }, y = K && K.__spreadArray || function(o, h, i) {
    if (i || arguments.length === 2) for (var d = 0, p = h.length, r; d < p; d++)
      (r || !(d in h)) && (r || (r = Array.prototype.slice.call(h, 0, d)), r[d] = h[d]);
    return o.concat(r || Array.prototype.slice.call(h));
  }, t = K && K.__importDefault || function(o) {
    return o && o.__esModule ? o : { default: o };
  };
  Object.defineProperty(K, "__esModule", { value: !0 }), K.TextParser = void 0;
  var e = t(rt()), n = t(U()), u = t(V()), l = bt(), c = t(W()), a = jt(), f = (function(o) {
    v(h, o);
    function h(i, d, p, r) {
      var m = o.call(this, i, d, p) || this;
      return m.level = r, m;
    }
    return Object.defineProperty(h.prototype, "texParser", {
      get: function() {
        return this.configuration.packageData.get("textmacros").texParser;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(h.prototype, "tags", {
      get: function() {
        return this.texParser.tags;
      },
      enumerable: !1,
      configurable: !0
    }), h.prototype.mml = function() {
      return this.level != null ? this.create("node", "mstyle", this.nodes, { displaystyle: !1, scriptlevel: this.level }) : this.nodes.length === 1 ? this.nodes[0] : this.create("node", "mrow", this.nodes);
    }, h.prototype.Parse = function() {
      this.text = "", this.nodes = [], this.envStack = [], o.prototype.Parse.call(this);
    }, h.prototype.saveText = function() {
      if (this.text) {
        var i = this.stack.env.mathvariant, d = u.default.internalText(this, this.text, i ? { mathvariant: i } : {});
        this.text = "", this.Push(d);
      }
    }, h.prototype.Push = function(i) {
      if (this.text && this.saveText(), i instanceof a.StopItem)
        return o.prototype.Push.call(this, i);
      if (i instanceof a.StyleItem) {
        this.stack.env.mathcolor = this.stack.env.color;
        return;
      }
      i instanceof l.AbstractMmlNode && (this.addAttributes(i), this.nodes.push(i));
    }, h.prototype.PushMath = function(i) {
      var d, p, r = this.stack.env;
      i.isKind("TeXAtom") || (i = this.create("node", "TeXAtom", [i]));
      try {
        for (var m = C(["mathsize", "mathcolor"]), _ = m.next(); !_.done; _ = m.next()) {
          var x = _.value;
          r[x] && !i.attributes.getExplicit(x) && (!i.isToken && !i.isKind("mstyle") && (i = this.create("node", "mstyle", [i])), c.default.setAttribute(i, x, r[x]));
        }
      } catch (A) {
        d = { error: A };
      } finally {
        try {
          _ && !_.done && (p = m.return) && p.call(m);
        } finally {
          if (d) throw d.error;
        }
      }
      i.isInferred && (i = this.create("node", "mrow", i.childNodes)), this.nodes.push(i);
    }, h.prototype.addAttributes = function(i) {
      var d, p, r = this.stack.env;
      if (i.isToken)
        try {
          for (var m = C(["mathsize", "mathcolor", "mathvariant"]), _ = m.next(); !_.done; _ = m.next()) {
            var x = _.value;
            r[x] && !i.attributes.getExplicit(x) && c.default.setAttribute(i, x, r[x]);
          }
        } catch (A) {
          d = { error: A };
        } finally {
          try {
            _ && !_.done && (p = m.return) && p.call(m);
          } finally {
            if (d) throw d.error;
          }
        }
    }, h.prototype.ParseTextArg = function(i, d) {
      var p = this.GetArgument(i);
      return d = Object.assign(Object.assign({}, this.stack.env), d), new h(p, d, this.configuration).mml();
    }, h.prototype.ParseArg = function(i) {
      return new h(this.GetArgument(i), this.stack.env, this.configuration).mml();
    }, h.prototype.Error = function(i, d) {
      for (var p = [], r = 2; r < arguments.length; r++)
        p[r - 2] = arguments[r];
      throw new (n.default.bind.apply(n.default, y([void 0, i, d], g(p), !1)))();
    }, h;
  })(e.default);
  return K.TextParser = f, K;
}
var Rr;
function la() {
  if (Rr) return se;
  Rr = 1;
  var v = se && se.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(se, "__esModule", { value: !0 });
  var C = F(), g = tt(), y = Ee(), t = v(V()), e = on();
  return new C.CommandMap("textcomp-macros", {
    textasciicircum: ["Insert", "^"],
    textasciitilde: ["Insert", "~"],
    textasteriskcentered: ["Insert", "*"],
    textbackslash: ["Insert", "\\"],
    textbar: ["Insert", "|"],
    textbraceleft: ["Insert", "{"],
    textbraceright: ["Insert", "}"],
    textbullet: ["Insert", "•"],
    textdagger: ["Insert", "†"],
    textdaggerdbl: ["Insert", "‡"],
    textellipsis: ["Insert", "…"],
    textemdash: ["Insert", "—"],
    textendash: ["Insert", "–"],
    textexclamdown: ["Insert", "¡"],
    textgreater: ["Insert", ">"],
    textless: ["Insert", "<"],
    textordfeminine: ["Insert", "ª"],
    textordmasculine: ["Insert", "º"],
    textparagraph: ["Insert", "¶"],
    textperiodcentered: ["Insert", "·"],
    textquestiondown: ["Insert", "¿"],
    textquotedblleft: ["Insert", "“"],
    textquotedblright: ["Insert", "”"],
    textquoteleft: ["Insert", "‘"],
    textquoteright: ["Insert", "’"],
    textsection: ["Insert", "§"],
    textunderscore: ["Insert", "_"],
    textvisiblespace: ["Insert", "␣"],
    textacutedbl: ["Insert", "˝"],
    textasciiacute: ["Insert", "´"],
    textasciibreve: ["Insert", "˘"],
    textasciicaron: ["Insert", "ˇ"],
    textasciidieresis: ["Insert", "¨"],
    textasciimacron: ["Insert", "¯"],
    textgravedbl: ["Insert", "˵"],
    texttildelow: ["Insert", "˷"],
    textbaht: ["Insert", "฿"],
    textcent: ["Insert", "¢"],
    textcolonmonetary: ["Insert", "₡"],
    textcurrency: ["Insert", "¤"],
    textdollar: ["Insert", "$"],
    textdong: ["Insert", "₫"],
    texteuro: ["Insert", "€"],
    textflorin: ["Insert", "ƒ"],
    textguarani: ["Insert", "₲"],
    textlira: ["Insert", "₤"],
    textnaira: ["Insert", "₦"],
    textpeso: ["Insert", "₱"],
    textsterling: ["Insert", "£"],
    textwon: ["Insert", "₩"],
    textyen: ["Insert", "¥"],
    textcircledP: ["Insert", "℗"],
    textcompwordmark: ["Insert", "‌"],
    textcopyleft: ["Insert", "🄯"],
    textcopyright: ["Insert", "©"],
    textregistered: ["Insert", "®"],
    textservicemark: ["Insert", "℠"],
    texttrademark: ["Insert", "™"],
    textbardbl: ["Insert", "‖"],
    textbigcircle: ["Insert", "◯"],
    textblank: ["Insert", "␢"],
    textbrokenbar: ["Insert", "¦"],
    textdiscount: ["Insert", "⁒"],
    textestimated: ["Insert", "℮"],
    textinterrobang: ["Insert", "‽"],
    textinterrobangdown: ["Insert", "⸘"],
    textmusicalnote: ["Insert", "♪"],
    textnumero: ["Insert", "№"],
    textopenbullet: ["Insert", "◦"],
    textpertenthousand: ["Insert", "‱"],
    textperthousand: ["Insert", "‰"],
    textrecipe: ["Insert", "℞"],
    textreferencemark: ["Insert", "※"],
    textlangle: ["Insert", "〈"],
    textrangle: ["Insert", "〉"],
    textlbrackdbl: ["Insert", "⟦"],
    textrbrackdbl: ["Insert", "⟧"],
    textlquill: ["Insert", "⁅"],
    textrquill: ["Insert", "⁆"],
    textcelsius: ["Insert", "℃"],
    textdegree: ["Insert", "°"],
    textdiv: ["Insert", "÷"],
    textdownarrow: ["Insert", "↓"],
    textfractionsolidus: ["Insert", "⁄"],
    textleftarrow: ["Insert", "←"],
    textlnot: ["Insert", "¬"],
    textmho: ["Insert", "℧"],
    textminus: ["Insert", "−"],
    textmu: ["Insert", "µ"],
    textohm: ["Insert", "Ω"],
    textonehalf: ["Insert", "½"],
    textonequarter: ["Insert", "¼"],
    textonesuperior: ["Insert", "¹"],
    textpm: ["Insert", "±"],
    textrightarrow: ["Insert", "→"],
    textsurd: ["Insert", "√"],
    textthreequarters: ["Insert", "¾"],
    textthreesuperior: ["Insert", "³"],
    texttimes: ["Insert", "×"],
    texttwosuperior: ["Insert", "²"],
    textuparrow: ["Insert", "↑"],
    textborn: ["Insert", "*"],
    textdied: ["Insert", "†"],
    textdivorced: ["Insert", "⚮"],
    textmarried: ["Insert", "⚭"],
    textcentoldstyle: ["Insert", "¢", g.TexConstant.Variant.OLDSTYLE],
    textdollaroldstyle: ["Insert", "$", g.TexConstant.Variant.OLDSTYLE],
    textzerooldstyle: ["Insert", "0", g.TexConstant.Variant.OLDSTYLE],
    textoneoldstyle: ["Insert", "1", g.TexConstant.Variant.OLDSTYLE],
    texttwooldstyle: ["Insert", "2", g.TexConstant.Variant.OLDSTYLE],
    textthreeoldstyle: ["Insert", "3", g.TexConstant.Variant.OLDSTYLE],
    textfouroldstyle: ["Insert", "4", g.TexConstant.Variant.OLDSTYLE],
    textfiveoldstyle: ["Insert", "5", g.TexConstant.Variant.OLDSTYLE],
    textsixoldstyle: ["Insert", "6", g.TexConstant.Variant.OLDSTYLE],
    textsevenoldstyle: ["Insert", "7", g.TexConstant.Variant.OLDSTYLE],
    texteightoldstyle: ["Insert", "8", g.TexConstant.Variant.OLDSTYLE],
    textnineoldstyle: ["Insert", "9", g.TexConstant.Variant.OLDSTYLE]
  }, {
    Insert: function(n, u, l, c) {
      if (n instanceof e.TextParser) {
        if (!c) {
          y.TextMacrosMethods.Insert(n, u, l);
          return;
        }
        n.saveText();
      }
      n.Push(t.default.internalText(n, l, c ? { mathvariant: c } : {}));
    }
  }), se;
}
var Lr;
function sa() {
  if (Lr) return le;
  Lr = 1, Object.defineProperty(le, "__esModule", { value: !0 }), le.TextcompConfiguration = void 0;
  var v = R();
  return la(), le.TextcompConfiguration = v.Configuration.create("textcomp", {
    handler: { macro: ["textcomp-macros"] }
  }), le;
}
var wt = {}, Pe = {}, $r;
function ca() {
  if ($r) return Pe;
  $r = 1, Object.defineProperty(Pe, "__esModule", { value: !0 });
  var v = F(), C = tt(), g = Ee(), y = Se();
  return new v.MacroMap("text-special", {
    $: "Math",
    "%": "Comment",
    "^": "MathModeOnly",
    _: "MathModeOnly",
    "&": "Misplaced",
    "#": "Misplaced",
    "~": "Tilde",
    " ": "Space",
    "	": "Space",
    "\r": "Space",
    "\n": "Space",
    " ": "Tilde",
    "{": "OpenBrace",
    "}": "CloseBrace",
    "`": "OpenQuote",
    "'": "CloseQuote"
  }, g.TextMacrosMethods), new v.CommandMap("text-macros", {
    "(": "Math",
    $: "SelfQuote",
    _: "SelfQuote",
    "%": "SelfQuote",
    "{": "SelfQuote",
    "}": "SelfQuote",
    " ": "SelfQuote",
    "&": "SelfQuote",
    "#": "SelfQuote",
    "\\": "SelfQuote",
    "'": ["Accent", "´"],
    "’": ["Accent", "´"],
    "`": ["Accent", "`"],
    "‘": ["Accent", "`"],
    "^": ["Accent", "^"],
    '"': ["Accent", "¨"],
    "~": ["Accent", "~"],
    "=": ["Accent", "¯"],
    ".": ["Accent", "˙"],
    u: ["Accent", "˘"],
    v: ["Accent", "ˇ"],
    emph: "Emph",
    rm: ["SetFont", C.TexConstant.Variant.NORMAL],
    mit: ["SetFont", C.TexConstant.Variant.ITALIC],
    oldstyle: ["SetFont", C.TexConstant.Variant.OLDSTYLE],
    cal: ["SetFont", C.TexConstant.Variant.CALLIGRAPHIC],
    it: ["SetFont", "-tex-mathit"],
    bf: ["SetFont", C.TexConstant.Variant.BOLD],
    bbFont: ["SetFont", C.TexConstant.Variant.DOUBLESTRUCK],
    scr: ["SetFont", C.TexConstant.Variant.SCRIPT],
    frak: ["SetFont", C.TexConstant.Variant.FRAKTUR],
    sf: ["SetFont", C.TexConstant.Variant.SANSSERIF],
    tt: ["SetFont", C.TexConstant.Variant.MONOSPACE],
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
    Bbb: ["Macro", "{\\bbFont #1}", 1],
    textnormal: ["Macro", "{\\rm #1}", 1],
    textup: ["Macro", "{\\rm #1}", 1],
    textrm: ["Macro", "{\\rm #1}", 1],
    textit: ["Macro", "{\\it #1}", 1],
    textbf: ["Macro", "{\\bf #1}", 1],
    textsf: ["Macro", "{\\sf #1}", 1],
    texttt: ["Macro", "{\\tt #1}", 1],
    dagger: ["Insert", "†"],
    ddagger: ["Insert", "‡"],
    S: ["Insert", "§"],
    ",": ["Spacer", y.MATHSPACE.thinmathspace],
    ":": ["Spacer", y.MATHSPACE.mediummathspace],
    ">": ["Spacer", y.MATHSPACE.mediummathspace],
    ";": ["Spacer", y.MATHSPACE.thickmathspace],
    "!": ["Spacer", y.MATHSPACE.negativethinmathspace],
    enspace: ["Spacer", 0.5],
    quad: ["Spacer", 1],
    qquad: ["Spacer", 2],
    thinspace: ["Spacer", y.MATHSPACE.thinmathspace],
    negthinspace: ["Spacer", y.MATHSPACE.negativethinmathspace],
    hskip: "Hskip",
    hspace: "Hskip",
    kern: "Hskip",
    mskip: "Hskip",
    mspace: "Hskip",
    mkern: "Hskip",
    rule: "rule",
    Rule: ["Rule"],
    Space: ["Rule", "blank"],
    color: "CheckAutoload",
    textcolor: "CheckAutoload",
    colorbox: "CheckAutoload",
    fcolorbox: "CheckAutoload",
    href: "CheckAutoload",
    style: "CheckAutoload",
    class: "CheckAutoload",
    cssId: "CheckAutoload",
    unicode: "CheckAutoload",
    ref: ["HandleRef", !1],
    eqref: ["HandleRef", !0]
  }, g.TextMacrosMethods), Pe;
}
var Ur;
function fa() {
  if (Ur) return wt;
  Ur = 1;
  var v = wt && wt.__importDefault || function(c) {
    return c && c.__esModule ? c : { default: c };
  }, C;
  Object.defineProperty(wt, "__esModule", { value: !0 }), wt.TextMacrosConfiguration = wt.TextBaseConfiguration = void 0;
  var g = R(), y = v(hn()), t = _e(), e = jt(), n = on(), u = Ee();
  ca(), wt.TextBaseConfiguration = g.Configuration.create("text-base", {
    parser: "text",
    handler: {
      character: ["command", "text-special"],
      macro: ["text-macros"]
    },
    fallback: {
      character: function(c, a) {
        c.text += a;
      },
      macro: function(c, a) {
        var f = c.texParser, o = f.lookup("macro", a);
        o && o._func !== u.TextMacrosMethods.Macro && c.Error("MathMacro", "%1 is only supported in math mode", "\\" + a), f.parse("macro", [c, a]);
      }
    },
    items: (C = {}, C[e.StartItem.prototype.kind] = e.StartItem, C[e.StopItem.prototype.kind] = e.StopItem, C[e.MmlItem.prototype.kind] = e.MmlItem, C[e.StyleItem.prototype.kind] = e.StyleItem, C)
  });
  function l(c, a, f, o) {
    var h = c.configuration.packageData.get("textmacros");
    return c instanceof n.TextParser || (h.texParser = c), [new n.TextParser(a, o ? { mathvariant: o } : {}, h.parseOptions, f).mml()];
  }
  return wt.TextMacrosConfiguration = g.Configuration.create("textmacros", {
    config: function(c, a) {
      var f = new g.ParserConfiguration(a.parseOptions.options.textmacros.packages, ["tex", "text"]);
      f.init();
      var o = new y.default(f, []);
      o.options = a.parseOptions.options, f.config(a), t.TagsFactory.addTags(f.tags), o.tags = t.TagsFactory.getDefault(), o.tags.configuration = o, o.packageData = a.parseOptions.packageData, o.packageData.set("textmacros", { parseOptions: o, jax: a, texParser: null }), o.options.internalMath = l;
    },
    preprocessors: [function(c) {
      var a = c.data.packageData.get("textmacros");
      a.parseOptions.nodeFactory.setMmlFactory(a.jax.mmlFactory);
    }],
    options: {
      textmacros: {
        packages: ["text-base"]
      }
    }
  }), wt;
}
var ce = {}, Vr;
function da() {
  if (Vr) return ce;
  Vr = 1, Object.defineProperty(ce, "__esModule", { value: !0 }), ce.UpgreekConfiguration = void 0;
  var v = R(), C = F(), g = tt();
  function y(t, e) {
    var n = e.attributes || {};
    n.mathvariant = g.TexConstant.Variant.NORMAL;
    var u = t.create("token", "mi", n, e.char);
    t.Push(u);
  }
  return new C.CharacterMap("upgreek", y, {
    upalpha: "α",
    upbeta: "β",
    upgamma: "γ",
    updelta: "δ",
    upepsilon: "ϵ",
    upzeta: "ζ",
    upeta: "η",
    uptheta: "θ",
    upiota: "ι",
    upkappa: "κ",
    uplambda: "λ",
    upmu: "μ",
    upnu: "ν",
    upxi: "ξ",
    upomicron: "ο",
    uppi: "π",
    uprho: "ρ",
    upsigma: "σ",
    uptau: "τ",
    upupsilon: "υ",
    upphi: "ϕ",
    upchi: "χ",
    uppsi: "ψ",
    upomega: "ω",
    upvarepsilon: "ε",
    upvartheta: "ϑ",
    upvarpi: "ϖ",
    upvarrho: "ϱ",
    upvarsigma: "ς",
    upvarphi: "φ",
    Upgamma: "Γ",
    Updelta: "Δ",
    Uptheta: "Θ",
    Uplambda: "Λ",
    Upxi: "Ξ",
    Uppi: "Π",
    Upsigma: "Σ",
    Upupsilon: "Υ",
    Upphi: "Φ",
    Uppsi: "Ψ",
    Upomega: "Ω"
  }), ce.UpgreekConfiguration = v.Configuration.create("upgreek", {
    handler: { macro: ["upgreek"] }
  }), ce;
}
var fe = {}, zr;
function ma() {
  return zr || (zr = 1, (function(v) {
    var C = fe && fe.__importDefault || function(c) {
      return c && c.__esModule ? c : { default: c };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.UnicodeConfiguration = v.UnicodeMethods = void 0;
    var g = R(), y = C(U()), t = F(), e = C(V()), n = C(W()), u = pn();
    v.UnicodeMethods = {};
    var l = {};
    v.UnicodeMethods.Unicode = function(c, a) {
      var f = c.GetBrackets(a), o = null, h = null;
      f && (f.replace(/ /g, "").match(/^(\d+(\.\d*)?|\.\d+),(\d+(\.\d*)?|\.\d+)$/) ? (o = f.replace(/ /g, "").split(/,/), h = c.GetBrackets(a)) : h = f);
      var i = e.default.trimSpaces(c.GetArgument(a)).replace(/^0x/, "x");
      if (!i.match(/^(x[0-9A-Fa-f]+|[0-9]+)$/))
        throw new y.default("BadUnicode", "Argument to \\unicode must be a number");
      var d = parseInt(i.match(/^x/) ? "0" + i : i);
      l[d] ? h || (h = l[d][2]) : l[d] = [800, 200, h, d], o && (l[d][0] = Math.floor(parseFloat(o[0]) * 1e3), l[d][1] = Math.floor(parseFloat(o[1]) * 1e3));
      var p = c.stack.env.font, r = {};
      h ? (l[d][2] = r.fontfamily = h.replace(/'/g, "'"), p && (p.match(/bold/) && (r.fontweight = "bold"), p.match(/italic|-mathit/) && (r.fontstyle = "italic"))) : p && (r.mathvariant = p);
      var m = c.create("token", "mtext", r, (0, u.numeric)(i));
      n.default.setProperty(m, "unicode", !0), c.Push(m);
    }, new t.CommandMap("unicode", { unicode: "Unicode" }, v.UnicodeMethods), v.UnicodeConfiguration = g.Configuration.create("unicode", { handler: { macro: ["unicode"] } });
  })(fe)), fe;
}
var de = {}, Hr;
function ha() {
  return Hr || (Hr = 1, (function(v) {
    var C = de && de.__importDefault || function(n) {
      return n && n.__esModule ? n : { default: n };
    };
    Object.defineProperty(v, "__esModule", { value: !0 }), v.VerbConfiguration = v.VerbMethods = void 0;
    var g = R(), y = tt(), t = F(), e = C(U());
    v.VerbMethods = {}, v.VerbMethods.Verb = function(n, u) {
      var l = n.GetNext(), c = ++n.i;
      if (l === "")
        throw new e.default("MissingArgFor", "Missing argument for %1", u);
      for (; n.i < n.string.length && n.string.charAt(n.i) !== l; )
        n.i++;
      if (n.i === n.string.length)
        throw new e.default("NoClosingDelim", "Can't find closing delimiter for %1", n.currentCS);
      var a = n.string.slice(c, n.i).replace(/ /g, " ");
      n.i++, n.Push(n.create("token", "mtext", { mathvariant: y.TexConstant.Variant.MONOSPACE }, a));
    }, new t.CommandMap("verb", { verb: "Verb" }, v.VerbMethods), v.VerbConfiguration = g.Configuration.create("verb", { handler: { macro: ["verb"] } });
  })(de)), de;
}
var Xr;
function va() {
  return Xr || (Xr = 1, Object.defineProperty(Lt, "__esModule", { value: !0 }), Lt.AllPackages = void 0, Qr(), _n(), Zr(), Cn(), An(), wn(), qn(), kn(), Bn(), Dn(), In(), Fn(), Rn(), Ln(), $n(), Un(), Yr(), zn(), Hn(), Qn(), an(), Jn(), en(), ta(), ea(), oa(), ia(), ua(), sa(), fa(), da(), ma(), ha(), typeof MathJax < "u" && MathJax.loader && MathJax.loader.preLoad("[tex]/action", "[tex]/ams", "[tex]/amscd", "[tex]/bbox", "[tex]/boldsymbol", "[tex]/braket", "[tex]/bussproofs", "[tex]/cancel", "[tex]/cases", "[tex]/centernot", "[tex]/color", "[tex]/colorv2", "[tex]/colortbl", "[tex]/empheq", "[tex]/enclose", "[tex]/extpfeil", "[tex]/gensymb", "[tex]/html", "[tex]/mathtools", "[tex]/mhchem", "[tex]/newcommand", "[tex]/noerrors", "[tex]/noundefined", "[tex]/physics", "[tex]/upgreek", "[tex]/unicode", "[tex]/verb", "[tex]/configmacros", "[tex]/tagformat", "[tex]/textcomp", "[tex]/textmacros", "[tex]/setoptions"), Lt.AllPackages = [
    "base",
    "action",
    "ams",
    "amscd",
    "bbox",
    "boldsymbol",
    "braket",
    "bussproofs",
    "cancel",
    "cases",
    "centernot",
    "color",
    "colortbl",
    "empheq",
    "enclose",
    "extpfeil",
    "gensymb",
    "html",
    "mathtools",
    "mhchem",
    "newcommand",
    "noerrors",
    "noundefined",
    "upgreek",
    "unicode",
    "verb",
    "configmacros",
    "tagformat",
    "textcomp",
    "textmacros"
  ]), Lt;
}
var un = va();
const pa = /* @__PURE__ */ dn(un), wa = /* @__PURE__ */ gn({
  __proto__: null,
  default: pa
}, [un]);
export {
  wa as A
};
