const b = {
  fogra39: {
    id: "fogra39",
    file: "fogra39-coated.icc",
    label: "FOGRA39 — coated paper (Europe, ISO Coated v2)",
    outputConditionIdentifier: "FOGRA39",
    outputCondition: "Offset commercial and specialty printing according to ISO 12647-2:2004 / Amd 1, paper type 1 or 2 (gloss or matte coated offset), 115 g/m2, screen ruling 60/cm"
  },
  gracol: {
    id: "gracol",
    file: "gracol-tr006-coated.icc",
    label: "GRACoL — coated paper (US, CGATS TR 006)",
    outputConditionIdentifier: "CGATS TR 006",
    outputCondition: "Commercial offset lithography on grade 1 paper (GRACoL), CGATS TR 006"
  }
}, I = "fogra39", G = (r) => Math.round(r * 10) / 10, C = (r, o, e) => Math.min(e, Math.max(o, r));
function F(r, o, e, s) {
  const f = r.cmsOpenProfileFromMem(s, s.byteLength);
  if (!f) throw new Error(`Could not open ICC profile ${e.file}`);
  if (r.cmsGetColorSpaceASCII(f) !== "CMYK") throw new Error(`${e.file} is not a CMYK profile`);
  const u = r.cmsCreate_sRGBProfile(), g = o.FLOAT_SH(1) | o.COLORSPACE_SH(o.PT_RGB) | o.CHANNELS_SH(3) | o.BYTES_SH(4), p = o.FLOAT_SH(1) | o.COLORSPACE_SH(o.PT_CMYK) | o.CHANNELS_SH(4) | o.BYTES_SH(4), _ = o.INTENT_RELATIVE_COLORIMETRIC, h = o.cmsFLAGS_BLACKPOINTCOMPENSATION, A = r.cmsCreateTransform(u, g, f, p, _, h), R = r.cmsCreateTransform(f, p, u, g, _, h), S = r.cmsCreateTransform(u, o.TYPE_RGB_8, f, o.TYPE_CMYK_8, _, h), w = r.cmsCreateTransform(f, o.TYPE_CMYK_8, u, o.TYPE_RGB_8, _, h);
  if (!A || !R || !S || !w) throw new Error("Could not create the colour transforms");
  const M = /* @__PURE__ */ new Map(), O = (t) => {
    const [a, n, i] = t.map((y) => C(Math.round(y), 0, 255));
    if (a === 0 && n === 0 && i === 0) return [0, 0, 0, 100];
    const l = a << 16 | n << 8 | i, m = M.get(l);
    if (m) return [...m];
    const c = r.cmsDoTransform(A, new Float32Array([a / 255, n / 255, i / 255]), 1), T = [0, 1, 2, 3].map((y) => C(G(c[y]), 0, 100));
    return M.set(l, T), [...T];
  }, P = (t) => {
    const a = r.cmsDoTransform(R, new Float32Array(t.map((n) => C(n, 0, 100))), 1);
    return [0, 1, 2].map((n) => C(Math.round(a[n] * 255), 0, 255));
  };
  return {
    profile: e,
    profileBytes: s,
    rgbToCmyk: O,
    cmykToRgb: P,
    proof: (t) => P(O(t)),
    imageToCmyk: (t) => {
      const a = t.length >> 2, n = new Uint8Array(a * 3);
      let i = !0;
      const l = new Uint8Array(a);
      for (let c = 0; c < a; c++) {
        n[c * 3] = t[c * 4], n[c * 3 + 1] = t[c * 4 + 1], n[c * 3 + 2] = t[c * 4 + 2];
        const T = t[c * 4 + 3];
        l[c] = T, T !== 255 && (i = !1);
      }
      return { cmyk: r.cmsDoTransform(S, n, a).subarray(0, a * 4), alpha: i ? null : l };
    },
    proofLut: (t) => {
      if (!(t >= 2 && t <= 65)) throw new Error("proofLut: n must be 2–65");
      const a = new Uint8Array(t * t * t * 3);
      let n = 0;
      for (let l = 0; l < t; l++) for (let m = 0; m < t; m++) for (let c = 0; c < t; c++)
        a[n++] = Math.round(c * 255 / (t - 1)), a[n++] = Math.round(m * 255 / (t - 1)), a[n++] = Math.round(l * 255 / (t - 1));
      const i = r.cmsDoTransform(S, a, t * t * t).slice(0, t * t * t * 4);
      return i.set([0, 0, 0, 255], 0), r.cmsDoTransform(w, i, t * t * t).slice(0, t * t * t * 3);
    }
  };
}
function k(r) {
  const o = r.trim().toLowerCase();
  let e = o.match(/^#([0-9a-f]{3})$/);
  return e ? [...e[1]].map((s) => parseInt(s + s, 16)) : (e = o.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/), e ? [0, 2, 4].map((s) => parseInt(e[1].slice(s, s + 2), 16)) : (e = o.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/), e ? [e[1], e[2], e[3]].map((s) => C(Math.round(parseFloat(s)), 0, 255)) : null));
}
const Y = (r) => "#" + r.map((o) => C(Math.round(o), 0, 255).toString(16).padStart(2, "0")).join(""), E = /* @__PURE__ */ new Map();
let d = null;
const H = () => (d || (d = (async () => {
  const [r, o] = await Promise.all([
    import("./lcms-Car3bVu8.js"),
    import("./lcms-tShoQ1hy.js")
  ]);
  return { lcms: await r.instantiate({ locateFile: () => o.default }), L: r };
})(), d.catch(() => {
  d = null;
})), d);
function N(r = I) {
  let o = E.get(r);
  if (!o) {
    const e = b[r];
    o = (async () => {
      const [{ lcms: f, L: u }, g] = await Promise.all([
        H(),
        fetch(`/icc/${e.file}`).then((p) => {
          if (!p.ok) throw new Error(`Profile fetch failed: ${e.file} (${p.status})`);
          return p.arrayBuffer();
        })
      ]);
      return F(f, u, e, new Uint8Array(g));
    })(), E.set(r, o), o.catch(() => E.delete(r));
  }
  return o;
}
const B = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DEFAULT_PRINT_PROFILE: I,
  PRINT_PROFILES: b,
  createColorEngine: F,
  loadColorEngine: N,
  parseRgb: k,
  rgbToHex: Y
}, Symbol.toStringTag, { value: "Module" })), $ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
export {
  $ as _,
  B as c,
  k as p
};
