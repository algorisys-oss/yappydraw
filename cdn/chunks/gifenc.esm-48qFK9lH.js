var Y = { trailer: 59 };
function K(t = 256) {
  let r = 0, f = new Uint8Array(t);
  return { get buffer() {
    return f.buffer;
  }, reset() {
    r = 0;
  }, bytesView() {
    return f.subarray(0, r);
  }, bytes() {
    return f.slice(0, r);
  }, writeByte(a) {
    n(r + 1), f[r] = a, r++;
  }, writeBytes(a, i = 0, l = a.length) {
    n(r + l);
    for (let o = 0; o < l; o++) f[r++] = a[o + i];
  }, writeBytesView(a, i = 0, l = a.byteLength) {
    n(r + l), f.set(a.subarray(i, i + l), r), r += l;
  } };
  function n(a) {
    var i = f.length;
    if (i >= a) return;
    var l = 1024 * 1024;
    a = Math.max(a, i * (i < l ? 2 : 1.125) >>> 0), i != 0 && (a = Math.max(a, 256));
    let o = f;
    f = new Uint8Array(a), r > 0 && f.set(o.subarray(0, r), 0);
  }
}
var T = 12, _ = 5003, Z = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535];
function $(t, r, f, n, a = K(512), i = new Uint8Array(256), l = new Int32Array(_), o = new Int32Array(_)) {
  let y = l.length, w = Math.max(2, n);
  i.fill(0), o.fill(0), l.fill(-1);
  let c = 0, e = 0, h = w + 1, x = h, s = !1, p = x, u = (1 << p) - 1, g = 1 << h - 1, E = g + 1, m = g + 2, b = 0, M = f[0], d = 0;
  for (let A = y; A < 65536; A *= 2) ++d;
  d = 8 - d, a.writeByte(w), U(g);
  let B = f.length;
  for (let A = 1; A < B; A++)
    t: {
      let V = f[A], q = (V << T) + M, v = V << d ^ M;
      if (l[v] === q) {
        M = o[v];
        break t;
      }
      let I = v === 0 ? 1 : y - v;
      for (; l[v] >= 0; ) if (v -= I, v < 0 && (v += y), l[v] === q) {
        M = o[v];
        break t;
      }
      U(M), M = V, m < 1 << T ? (o[v] = m++, l[v] = q) : (l.fill(-1), m = g + 2, s = !0, U(g));
    }
  return U(M), U(E), a.writeByte(0), a.bytesView();
  function U(A) {
    for (c &= Z[e], e > 0 ? c |= A << e : c = A, e += p; e >= 8; ) i[b++] = c & 255, b >= 254 && (a.writeByte(b), a.writeBytesView(i, 0, b), b = 0), c >>= 8, e -= 8;
    if ((m > u || s) && (s ? (p = x, u = (1 << p) - 1, s = !1) : (++p, u = p === T ? 1 << p : (1 << p) - 1)), A == E) {
      for (; e > 0; ) i[b++] = c & 255, b >= 254 && (a.writeByte(b), a.writeBytesView(i, 0, b), b = 0), c >>= 8, e -= 8;
      b > 0 && (a.writeByte(b), a.writeBytesView(i, 0, b), b = 0);
    }
  }
}
var W = $;
function N(t, r, f) {
  return t << 8 & 63488 | r << 2 & 992 | f >> 3;
}
function O(t, r, f, n) {
  return t >> 4 | r & 240 | (f & 240) << 4 | (n & 240) << 8;
}
function Q(t, r, f) {
  return t >> 4 << 8 | r & 240 | f >> 4;
}
function F(t, r, f) {
  return t < r ? r : t > f ? f : t;
}
function R(t) {
  return t * t;
}
function j(t, r, f) {
  var n = 0, a = 1e100;
  let i = t[r], l = i.cnt;
  i.ac;
  let o = i.rc, y = i.gc, w = i.bc;
  for (var c = i.fw; c != 0; c = t[c].fw) {
    let h = t[c], x = h.cnt, s = l * x / (l + x);
    if (!(s >= a)) {
      var e = 0;
      e += s * R(h.rc - o), !(e >= a) && (e += s * R(h.gc - y), !(e >= a) && (e += s * R(h.bc - w), !(e >= a) && (a = e, n = c)));
    }
  }
  i.err = a, i.nn = n;
}
function D() {
  return { ac: 0, rc: 0, gc: 0, bc: 0, cnt: 0, nn: 0, fw: 0, bk: 0, tm: 0, mtm: 0, err: 0 };
}
function tt(t, r) {
  let f = r === "rgb444" ? 4096 : 65536, n = new Array(f), a = t.length;
  if (r === "rgba4444") for (let i = 0; i < a; ++i) {
    let l = t[i], o = l >> 24 & 255, y = l >> 16 & 255, w = l >> 8 & 255, c = l & 255, e = O(c, w, y, o), h = e in n ? n[e] : n[e] = D();
    h.rc += c, h.gc += w, h.bc += y, h.ac += o, h.cnt++;
  }
  else if (r === "rgb444") for (let i = 0; i < a; ++i) {
    let l = t[i], o = l >> 16 & 255, y = l >> 8 & 255, w = l & 255, c = Q(w, y, o), e = c in n ? n[c] : n[c] = D();
    e.rc += w, e.gc += y, e.bc += o, e.cnt++;
  }
  else for (let i = 0; i < a; ++i) {
    let l = t[i], o = l >> 16 & 255, y = l >> 8 & 255, w = l & 255, c = N(w, y, o), e = c in n ? n[c] : n[c] = D();
    e.rc += w, e.gc += y, e.bc += o, e.cnt++;
  }
  return n;
}
function wt(t, r, f = {}) {
  let { format: n = "rgb565", clearAlpha: a = !0, clearAlphaColor: i = 0, clearAlphaThreshold: l = 0, oneBitAlpha: o = !1 } = f;
  if (!t || !t.buffer) throw new Error("quantize() expected RGBA Uint8Array data");
  if (!(t instanceof Uint8Array) && !(t instanceof Uint8ClampedArray)) throw new Error("quantize() expected RGBA Uint8Array data");
  let y = new Uint32Array(t.buffer), w = f.useSqrt !== !1, c = n === "rgba4444", e = tt(y, n), h = e.length, x = h - 1, s = new Uint32Array(h + 1);
  for (var p = 0, u = 0; u < h; ++u) {
    let k = e[u];
    if (k != null) {
      var g = 1 / k.cnt;
      c && (k.ac *= g), k.rc *= g, k.gc *= g, k.bc *= g, e[p++] = k;
    }
  }
  R(r) / p < 0.022 && (w = !1);
  for (var u = 0; u < p - 1; ++u) e[u].fw = u + 1, e[u + 1].bk = u, w && (e[u].cnt = Math.sqrt(e[u].cnt));
  w && (e[u].cnt = Math.sqrt(e[u].cnt));
  var E, m, b;
  for (u = 0; u < p; ++u) {
    j(e, u);
    var M = e[u].err;
    for (m = ++s[0]; m > 1 && (b = m >> 1, !(e[E = s[b]].err <= M)); m = b) s[m] = E;
    s[m] = u;
  }
  var d = p - r;
  for (u = 0; u < d; ) {
    for (var B; ; ) {
      var U = s[1];
      if (B = e[U], B.tm >= B.mtm && e[B.nn].mtm <= B.tm) break;
      B.mtm == x ? U = s[1] = s[s[0]--] : (j(e, U), B.tm = u);
      var M = e[U].err;
      for (m = 1; (b = m + m) <= s[0] && (b < s[0] && e[s[b]].err > e[s[b + 1]].err && b++, !(M <= e[E = s[b]].err)); m = b) s[m] = E;
      s[m] = U;
    }
    var A = e[B.nn], V = B.cnt, q = A.cnt, g = 1 / (V + q);
    c && (B.ac = g * (V * B.ac + q * A.ac)), B.rc = g * (V * B.rc + q * A.rc), B.gc = g * (V * B.gc + q * A.gc), B.bc = g * (V * B.bc + q * A.bc), B.cnt += A.cnt, B.mtm = ++u, e[A.bk].fw = A.fw, e[A.fw].bk = A.bk, A.mtm = x;
  }
  let v = [];
  var I = 0;
  for (u = 0; ; ++I) {
    let k = F(Math.round(e[u].rc), 0, 255), P = F(Math.round(e[u].gc), 0, 255), S = F(Math.round(e[u].bc), 0, 255), G = 255;
    c && (G = F(Math.round(e[u].ac), 0, 255), o && (G = G <= (typeof o == "number" ? o : 127) ? 0 : 255), a && G <= l && (k = P = S = i, G = 0));
    let L = c ? [k, P, S, G] : [k, P, S];
    if (et(v, L) || v.push(L), (u = e[u].fw) == 0) break;
  }
  return v;
}
function et(t, r) {
  for (let f = 0; f < t.length; f++) {
    let n = t[f], a = n[0] === r[0] && n[1] === r[1] && n[2] === r[2], i = n.length >= 4 && r.length >= 4 ? n[3] === r[3] : !0;
    if (a && i) return !0;
  }
  return !1;
}
function ut(t, r, f = "rgb565") {
  if (!t || !t.buffer) throw new Error("quantize() expected RGBA Uint8Array data");
  if (!(t instanceof Uint8Array) && !(t instanceof Uint8ClampedArray)) throw new Error("quantize() expected RGBA Uint8Array data");
  if (r.length > 256) throw new Error("applyPalette() only works with 256 colors or less");
  let n = new Uint32Array(t.buffer), a = n.length, i = f === "rgb444" ? 4096 : 65536, l = new Uint8Array(a), o = new Array(i);
  if (f === "rgba4444") for (let y = 0; y < a; y++) {
    let w = n[y], c = w >> 24 & 255, e = w >> 16 & 255, h = w >> 8 & 255, x = w & 255, s = O(x, h, e, c), p = s in o ? o[s] : o[s] = rt(x, h, e, c, r);
    l[y] = p;
  }
  else {
    let y = f === "rgb444" ? Q : N;
    for (let w = 0; w < a; w++) {
      let c = n[w], e = c >> 16 & 255, h = c >> 8 & 255, x = c & 255, s = y(x, h, e), p = s in o ? o[s] : o[s] = nt(x, h, e, r);
      l[w] = p;
    }
  }
  return l;
}
function rt(t, r, f, n, a) {
  let i = 0, l = 1e100;
  for (let o = 0; o < a.length; o++) {
    let y = a[o], w = y[3], c = C(w - n);
    if (c > l) continue;
    let e = y[0];
    if (c += C(e - t), c > l) continue;
    let h = y[1];
    if (c += C(h - r), c > l) continue;
    let x = y[2];
    c += C(x - f), !(c > l) && (l = c, i = o);
  }
  return i;
}
function nt(t, r, f, n) {
  let a = 0, i = 1e100;
  for (let l = 0; l < n.length; l++) {
    let o = n[l], y = o[0], w = C(y - t);
    if (w > i) continue;
    let c = o[1];
    if (w += C(c - r), w > i) continue;
    let e = o[2];
    w += C(e - f), !(w > i) && (i = w, a = l);
  }
  return a;
}
function C(t) {
  return t * t;
}
function yt(t = {}) {
  let { initialCapacity: r = 4096, auto: f = !0 } = t, n = K(r), a = 5003, i = new Uint8Array(256), l = new Int32Array(a), o = new Int32Array(a), y = !1;
  return { reset() {
    n.reset(), y = !1;
  }, finish() {
    n.writeByte(Y.trailer);
  }, bytes() {
    return n.bytes();
  }, bytesView() {
    return n.bytesView();
  }, get buffer() {
    return n.buffer;
  }, get stream() {
    return n;
  }, writeHeader: w, writeFrame(c, e, h, x = {}) {
    let { transparent: s = !1, transparentIndex: p = 0, delay: u = 0, palette: g = null, repeat: E = 0, colorDepth: m = 8, dispose: b = -1 } = x, M = !1;
    if (f ? y || (M = !0, w(), y = !0) : M = !!x.first, e = Math.max(0, Math.floor(e)), h = Math.max(0, Math.floor(h)), M) {
      if (!g) throw new Error("First frame must include a { palette } option");
      it(n, e, h, g, m), J(n, g), E >= 0 && lt(n, E);
    }
    let d = Math.round(u / 10);
    at(n, b, d, s, p);
    let B = !!g && !M;
    ft(n, e, h, B ? g : null), B && J(n, g), ct(n, c, e, h, m, i, l, o);
  } };
  function w() {
    X(n, "GIF89a");
  }
}
function at(t, r, f, n, a) {
  t.writeByte(33), t.writeByte(249), t.writeByte(4), a < 0 && (a = 0, n = !1);
  var i, l;
  n ? (i = 1, l = 2) : (i = 0, l = 0), r >= 0 && (l = r & 7), l <<= 2, t.writeByte(0 | l | 0 | i), z(t, f), t.writeByte(a || 0), t.writeByte(0);
}
function it(t, r, f, n, a = 8) {
  let i = 1, l = 0, o = H(n.length) - 1, y = i << 7 | a - 1 << 4 | l << 3 | o;
  z(t, r), z(t, f), t.writeBytes([y, 0, 0]);
}
function lt(t, r) {
  t.writeByte(33), t.writeByte(255), t.writeByte(11), X(t, "NETSCAPE2.0"), t.writeByte(3), t.writeByte(1), z(t, r), t.writeByte(0);
}
function J(t, r) {
  let f = 1 << H(r.length);
  for (let n = 0; n < f; n++) {
    let a = [0, 0, 0];
    n < r.length && (a = r[n]), t.writeByte(a[0]), t.writeByte(a[1]), t.writeByte(a[2]);
  }
}
function ft(t, r, f, n) {
  if (t.writeByte(44), z(t, 0), z(t, 0), z(t, r), z(t, f), n) {
    let a = 0, i = 0, l = H(n.length) - 1;
    t.writeByte(128 | a | i | 0 | l);
  } else t.writeByte(0);
}
function ct(t, r, f, n, a = 8, i, l, o) {
  W(f, n, r, a, t, i, l, o);
}
function z(t, r) {
  t.writeByte(r & 255), t.writeByte(r >> 8 & 255);
}
function X(t, r) {
  for (var f = 0; f < r.length; f++) t.writeByte(r.charCodeAt(f));
}
function H(t) {
  return Math.max(Math.ceil(Math.log2(t)), 1);
}
export {
  yt as GIFEncoder,
  ut as applyPalette,
  wt as quantize
};
