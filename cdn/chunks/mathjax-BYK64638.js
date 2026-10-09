import { g as s } from "./_commonjsHelpers-DaMA6jEr.js";
import { r as i } from "./mathjax-BPYOiwki.js";
function c(r, n) {
  for (var o = 0; o < n.length; o++) {
    const e = n[o];
    if (typeof e != "string" && !Array.isArray(e)) {
      for (const t in e)
        if (t !== "default" && !(t in r)) {
          const a = Object.getOwnPropertyDescriptor(e, t);
          a && Object.defineProperty(r, t, a.get ? a : {
            enumerable: !0,
            get: () => e[t]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(r, Symbol.toStringTag, { value: "Module" }));
}
var f = i();
const m = /* @__PURE__ */ s(f), g = /* @__PURE__ */ c({
  __proto__: null,
  default: m
}, [f]);
export {
  g as m
};
