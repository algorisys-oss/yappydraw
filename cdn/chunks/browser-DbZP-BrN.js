var m = Uint8Array, Q = Uint16Array, mr = Int32Array, gr = new m([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]), wr = new m([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]), Cr = new m([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Hr = function(r, n) {
  for (var e = new Q(31), a = 0; a < 31; ++a)
    e[a] = n += 1 << r[a - 1];
  for (var v = new mr(e[30]), a = 1; a < 30; ++a)
    for (var f = e[a]; f < e[a + 1]; ++f)
      v[f] = f - e[a] << 5 | a;
  return { b: e, r: v };
}, Or = Hr(gr, 2), Vr = Or.b, Sr = Or.r;
Vr[28] = 258, Sr[258] = 28;
var Yr = Hr(wr, 0), Rr = Yr.b, Br = Yr.r, zr = new Q(32768);
for (var M = 0; M < 32768; ++M) {
  var b = (M & 43690) >> 1 | (M & 21845) << 1;
  b = (b & 52428) >> 2 | (b & 13107) << 2, b = (b & 61680) >> 4 | (b & 3855) << 4, zr[M] = ((b & 65280) >> 8 | (b & 255) << 8) >> 1;
}
var j = (function(r, n, e) {
  for (var a = r.length, v = 0, f = new Q(n); v < a; ++v)
    r[v] && ++f[r[v] - 1];
  var l = new Q(n);
  for (v = 1; v < n; ++v)
    l[v] = l[v - 1] + f[v - 1] << 1;
  var u;
  if (e) {
    u = new Q(1 << n);
    var t = 15 - n;
    for (v = 0; v < a; ++v)
      if (r[v])
        for (var g = v << 4 | r[v], o = n - r[v], i = l[r[v] - 1]++ << o, h = i | (1 << o) - 1; i <= h; ++i)
          u[zr[i] >> t] = g;
  } else
    for (u = new Q(a), v = 0; v < a; ++v)
      r[v] && (u[v] = zr[l[r[v] - 1]++] >> 15 - r[v]);
  return u;
}), d = new m(288);
for (var M = 0; M < 144; ++M)
  d[M] = 8;
for (var M = 144; M < 256; ++M)
  d[M] = 9;
for (var M = 256; M < 280; ++M)
  d[M] = 7;
for (var M = 280; M < 288; ++M)
  d[M] = 8;
var or = new m(32);
for (var M = 0; M < 32; ++M)
  or[M] = 5;
var Wr = /* @__PURE__ */ j(d, 9, 0), Xr = /* @__PURE__ */ j(d, 9, 1), Zr = /* @__PURE__ */ j(or, 5, 0), $r = /* @__PURE__ */ j(or, 5, 1), sr = function(r) {
  for (var n = r[0], e = 1; e < r.length; ++e)
    r[e] > n && (n = r[e]);
  return n;
}, X = function(r, n, e) {
  var a = n / 8 | 0;
  return (r[a] | r[a + 1] << 8) >> (n & 7) & e;
}, xr = function(r, n) {
  var e = n / 8 | 0;
  return (r[e] | r[e + 1] << 8 | r[e + 2] << 16) >> (n & 7);
}, Tr = function(r) {
  return (r + 7) / 8 | 0;
}, tr = function(r, n, e) {
  return (n == null || n < 0) && (n = 0), (e == null || e > r.length) && (e = r.length), new m(r.subarray(n, e));
}, jr = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
], Y = function(r, n, e) {
  var a = new Error(n || jr[r]);
  if (a.code = r, Error.captureStackTrace && Error.captureStackTrace(a, Y), !e)
    throw a;
  return a;
}, Lr = function(r, n, e, a) {
  var v = r.length, f = a ? a.length : 0;
  if (!v || n.f && !n.l)
    return e || new m(0);
  var l = !e, u = l || n.i != 2, t = n.i;
  l && (e = new m(v * 3));
  var g = function(vr) {
    var fr = e.length;
    if (vr > fr) {
      var er = new m(Math.max(fr * 2, vr));
      er.set(e), e = er;
    }
  }, o = n.f || 0, i = n.p || 0, h = n.b || 0, c = n.l, y = n.d, x = n.m, C = n.n, T = v * 8;
  do {
    if (!c) {
      o = X(r, i, 1);
      var O = X(r, i + 1, 3);
      if (i += 3, O)
        if (O == 1)
          c = Xr, y = $r, x = 9, C = 5;
        else if (O == 2) {
          var D = X(r, i, 31) + 257, k = X(r, i + 10, 15) + 4, s = D + X(r, i + 5, 31) + 1;
          i += 14;
          for (var w = new m(s), I = new m(19), B = 0; B < k; ++B)
            I[Cr[B]] = X(r, i + B * 3, 7);
          i += k * 3;
          for (var V = sr(I), p = (1 << V) - 1, K = j(I, V, 1), B = 0; B < s; ) {
            var G = K[X(r, i, p)];
            i += G & 15;
            var F = G >> 4;
            if (F < 16)
              w[B++] = F;
            else {
              var q = 0, S = 0;
              for (F == 16 ? (S = 3 + X(r, i, 3), i += 2, q = w[B - 1]) : F == 17 ? (S = 3 + X(r, i, 7), i += 3) : F == 18 && (S = 11 + X(r, i, 127), i += 7); S--; )
                w[B++] = q;
            }
          }
          var J = w.subarray(0, D), H = w.subarray(D);
          x = sr(J), C = sr(H), c = j(J, x, 1), y = j(H, C, 1);
        } else
          Y(1);
      else {
        var F = Tr(i) + 4, A = r[F - 4] | r[F - 3] << 8, U = F + A;
        if (U > v) {
          t && Y(0);
          break;
        }
        u && g(h + A), e.set(r.subarray(F, U), h), n.b = h += A, n.p = i = U * 8, n.f = o;
        continue;
      }
      if (i > T) {
        t && Y(0);
        break;
      }
    }
    u && g(h + 131072);
    for (var ar = (1 << x) - 1, R = (1 << C) - 1, L = i; ; L = i) {
      var q = c[xr(r, i) & ar], N = q >> 4;
      if (i += q & 15, i > T) {
        t && Y(0);
        break;
      }
      if (q || Y(2), N < 256)
        e[h++] = N;
      else if (N == 256) {
        L = i, c = null;
        break;
      } else {
        var P = N - 254;
        if (N > 264) {
          var B = N - 257, z = gr[B];
          P = X(r, i, (1 << z) - 1) + Vr[B], i += z;
        }
        var Z = y[xr(r, i) & R], rr = Z >> 4;
        Z || Y(3), i += Z & 15;
        var H = Rr[rr];
        if (rr > 3) {
          var z = wr[rr];
          H += xr(r, i) & (1 << z) - 1, i += z;
        }
        if (i > T) {
          t && Y(0);
          break;
        }
        u && g(h + 131072);
        var nr = h + P;
        if (h < H) {
          var ur = f - H, hr = Math.min(H, nr);
          for (ur + h < 0 && Y(3); h < hr; ++h)
            e[h] = a[ur + h];
        }
        for (; h < nr; ++h)
          e[h] = e[h - H];
      }
    }
    n.l = c, n.p = L, n.b = h, n.f = o, c && (o = 1, n.m = x, n.d = y, n.n = C);
  } while (!o);
  return h != e.length && l ? tr(e, 0, h) : e.subarray(0, h);
}, _ = function(r, n, e) {
  e <<= n & 7;
  var a = n / 8 | 0;
  r[a] |= e, r[a + 1] |= e >> 8;
}, ir = function(r, n, e) {
  e <<= n & 7;
  var a = n / 8 | 0;
  r[a] |= e, r[a + 1] |= e >> 8, r[a + 2] |= e >> 16;
}, yr = function(r, n) {
  for (var e = [], a = 0; a < r.length; ++a)
    r[a] && e.push({ s: a, f: r[a] });
  var v = e.length, f = e.slice();
  if (!v)
    return { t: Jr, l: 0 };
  if (v == 1) {
    var l = new m(e[0].s + 1);
    return l[e[0].s] = 1, { t: l, l: 1 };
  }
  e.sort(function(U, D) {
    return U.f - D.f;
  }), e.push({ s: -1, f: 25001 });
  var u = e[0], t = e[1], g = 0, o = 1, i = 2;
  for (e[0] = { s: -1, f: u.f + t.f, l: u, r: t }; o != v - 1; )
    u = e[e[g].f < e[i].f ? g++ : i++], t = e[g != o && e[g].f < e[i].f ? g++ : i++], e[o++] = { s: -1, f: u.f + t.f, l: u, r: t };
  for (var h = f[0].s, a = 1; a < v; ++a)
    f[a].s > h && (h = f[a].s);
  var c = new Q(h + 1), y = Fr(e[o - 1], c, 0);
  if (y > n) {
    var a = 0, x = 0, C = y - n, T = 1 << C;
    for (f.sort(function(D, k) {
      return c[k.s] - c[D.s] || D.f - k.f;
    }); a < v; ++a) {
      var O = f[a].s;
      if (c[O] > n)
        x += T - (1 << y - c[O]), c[O] = n;
      else
        break;
    }
    for (x >>= C; x > 0; ) {
      var F = f[a].s;
      c[F] < n ? x -= 1 << n - c[F]++ - 1 : ++a;
    }
    for (; a >= 0 && x; --a) {
      var A = f[a].s;
      c[A] == n && (--c[A], ++x);
    }
    y = n;
  }
  return { t: new m(c), l: y };
}, Fr = function(r, n, e) {
  return r.s == -1 ? Math.max(Fr(r.l, n, e + 1), Fr(r.r, n, e + 1)) : n[r.s] = e;
}, Er = function(r) {
  for (var n = r.length; n && !r[--n]; )
    ;
  for (var e = new Q(++n), a = 0, v = r[0], f = 1, l = function(t) {
    e[a++] = t;
  }, u = 1; u <= n; ++u)
    if (r[u] == v && u != n)
      ++f;
    else {
      if (!v && f > 2) {
        for (; f > 138; f -= 138)
          l(32754);
        f > 2 && (l(f > 10 ? f - 11 << 5 | 28690 : f - 3 << 5 | 12305), f = 0);
      } else if (f > 3) {
        for (l(v), --f; f > 6; f -= 6)
          l(8304);
        f > 2 && (l(f - 3 << 5 | 8208), f = 0);
      }
      for (; f--; )
        l(v);
      f = 1, v = r[u];
    }
  return { c: e.subarray(0, a), n };
}, lr = function(r, n) {
  for (var e = 0, a = 0; a < n.length; ++a)
    e += r[a] * n[a];
  return e;
}, Gr = function(r, n, e) {
  var a = e.length, v = Tr(n + 2);
  r[v] = a & 255, r[v + 1] = a >> 8, r[v + 2] = r[v] ^ 255, r[v + 3] = r[v + 1] ^ 255;
  for (var f = 0; f < a; ++f)
    r[v + f + 4] = e[f];
  return (v + 4 + a) * 8;
}, Ur = function(r, n, e, a, v, f, l, u, t, g, o) {
  _(n, o++, e), ++v[256];
  for (var i = yr(v, 15), h = i.t, c = i.l, y = yr(f, 15), x = y.t, C = y.l, T = Er(h), O = T.c, F = T.n, A = Er(x), U = A.c, D = A.n, k = new Q(19), s = 0; s < O.length; ++s)
    ++k[O[s] & 31];
  for (var s = 0; s < U.length; ++s)
    ++k[U[s] & 31];
  for (var w = yr(k, 7), I = w.t, B = w.l, V = 19; V > 4 && !I[Cr[V - 1]]; --V)
    ;
  var p = g + 5 << 3, K = lr(v, d) + lr(f, or) + l, G = lr(v, h) + lr(f, x) + l + 14 + 3 * V + lr(k, I) + 2 * k[16] + 3 * k[17] + 7 * k[18];
  if (t >= 0 && p <= K && p <= G)
    return Gr(n, o, r.subarray(t, t + g));
  var q, S, J, H;
  if (_(n, o, 1 + (G < K)), o += 2, G < K) {
    q = j(h, c, 0), S = h, J = j(x, C, 0), H = x;
    var ar = j(I, B, 0);
    _(n, o, F - 257), _(n, o + 5, D - 1), _(n, o + 10, V - 4), o += 14;
    for (var s = 0; s < V; ++s)
      _(n, o + 3 * s, I[Cr[s]]);
    o += 3 * V;
    for (var R = [O, U], L = 0; L < 2; ++L)
      for (var N = R[L], s = 0; s < N.length; ++s) {
        var P = N[s] & 31;
        _(n, o, ar[P]), o += I[P], P > 15 && (_(n, o, N[s] >> 5 & 127), o += N[s] >> 12);
      }
  } else
    q = Wr, S = d, J = Zr, H = or;
  for (var s = 0; s < u; ++s) {
    var z = a[s];
    if (z > 255) {
      var P = z >> 18 & 31;
      ir(n, o, q[P + 257]), o += S[P + 257], P > 7 && (_(n, o, z >> 23 & 31), o += gr[P]);
      var Z = z & 31;
      ir(n, o, J[Z]), o += H[Z], Z > 3 && (ir(n, o, z >> 5 & 8191), o += wr[Z]);
    } else
      ir(n, o, q[z]), o += S[z];
  }
  return ir(n, o, q[256]), o + S[256];
}, _r = /* @__PURE__ */ new mr([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), Jr = /* @__PURE__ */ new m(0), pr = function(r, n, e, a, v, f) {
  var l = f.z || r.length, u = new m(a + l + 5 * (1 + Math.ceil(l / 7e3)) + v), t = u.subarray(a, u.length - v), g = f.l, o = (f.r || 0) & 7;
  if (n) {
    o && (t[0] = f.r >> 3);
    for (var i = _r[n - 1], h = i >> 13, c = i & 8191, y = (1 << e) - 1, x = f.p || new Q(32768), C = f.h || new Q(y + 1), T = Math.ceil(e / 3), O = 2 * T, F = function(cr) {
      return (r[cr] ^ r[cr + 1] << T ^ r[cr + 2] << O) & y;
    }, A = new mr(25e3), U = new Q(288), D = new Q(32), k = 0, s = 0, w = f.i || 0, I = 0, B = f.w || 0, V = 0; w + 2 < l; ++w) {
      var p = F(w), K = w & 32767, G = C[p];
      if (x[K] = G, C[p] = K, B <= w) {
        var q = l - w;
        if ((k > 7e3 || I > 24576) && (q > 423 || !g)) {
          o = Ur(r, t, 0, A, U, D, s, I, V, w - V, o), I = k = s = 0, V = w;
          for (var S = 0; S < 286; ++S)
            U[S] = 0;
          for (var S = 0; S < 30; ++S)
            D[S] = 0;
        }
        var J = 2, H = 0, ar = c, R = K - G & 32767;
        if (q > 2 && p == F(w - R))
          for (var L = Math.min(h, q) - 1, N = Math.min(32767, w), P = Math.min(258, q); R <= N && --ar && K != G; ) {
            if (r[w + J] == r[w + J - R]) {
              for (var z = 0; z < P && r[w + z] == r[w + z - R]; ++z)
                ;
              if (z > J) {
                if (J = z, H = R, z > L)
                  break;
                for (var Z = Math.min(R, z - 2), rr = 0, S = 0; S < Z; ++S) {
                  var nr = w - R + S & 32767, ur = x[nr], hr = nr - ur & 32767;
                  hr > rr && (rr = hr, G = nr);
                }
              }
            }
            K = G, G = x[K], R += K - G & 32767;
          }
        if (H) {
          A[I++] = 268435456 | Sr[J] << 18 | Br[H];
          var vr = Sr[J] & 31, fr = Br[H] & 31;
          s += gr[vr] + wr[fr], ++U[257 + vr], ++D[fr], B = w + J, ++k;
        } else
          A[I++] = r[w], ++U[r[w]];
      }
    }
    for (w = Math.max(w, B); w < l; ++w)
      A[I++] = r[w], ++U[r[w]];
    o = Ur(r, t, g, A, U, D, s, I, V, w - V, o), g || (f.r = o & 7 | t[o / 8 | 0] << 3, o -= 7, f.h = C, f.p = x, f.i = w, f.w = B);
  } else {
    for (var w = f.w || 0; w < l + g; w += 65535) {
      var er = w + 65535;
      er >= l && (t[o / 8 | 0] = g, er = l), o = Gr(t, o + 1, r.subarray(w, er));
    }
    f.i = l;
  }
  return tr(u, 0, a + Tr(o) + v);
}, br = /* @__PURE__ */ (function() {
  for (var r = new Int32Array(256), n = 0; n < 256; ++n) {
    for (var e = n, a = 9; --a; )
      e = (e & 1 && -306674912) ^ e >>> 1;
    r[n] = e;
  }
  return r;
})(), dr = function() {
  var r = -1;
  return {
    p: function(n) {
      for (var e = r, a = 0; a < n.length; ++a)
        e = br[e & 255 ^ n[a]] ^ e >>> 8;
      r = e;
    },
    d: function() {
      return ~r;
    }
  };
}, Kr = function() {
  var r = 1, n = 0;
  return {
    p: function(e) {
      for (var a = r, v = n, f = e.length | 0, l = 0; l != f; ) {
        for (var u = Math.min(l + 2655, f); l < u; ++l)
          v += a += e[l];
        a = (a & 65535) + 15 * (a >> 16), v = (v & 65535) + 15 * (v >> 16);
      }
      r = a, n = v;
    },
    d: function() {
      return r %= 65521, n %= 65521, (r & 255) << 24 | (r & 65280) << 8 | (n & 255) << 8 | n >> 8;
    }
  };
}, Nr = function(r, n, e, a, v) {
  if (!v && (v = { l: 1 }, n.dictionary)) {
    var f = n.dictionary.subarray(-32768), l = new m(f.length + r.length);
    l.set(f), l.set(r, f.length), r = l, v.w = f.length;
  }
  return pr(r, n.level == null ? 6 : n.level, n.mem == null ? v.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(r.length))) * 1.5) : 20 : 12 + n.mem, e, a, v);
}, Pr = function(r, n) {
  var e = {};
  for (var a in r)
    e[a] = r[a];
  for (var a in n)
    e[a] = n[a];
  return e;
}, $ = function(r, n) {
  return r[n] | r[n + 1] << 8;
}, W = function(r, n) {
  return (r[n] | r[n + 1] << 8 | r[n + 2] << 16 | r[n + 3] << 24) >>> 0;
}, Mr = function(r, n) {
  return W(r, n) + W(r, n + 4) * 4294967296;
}, E = function(r, n, e) {
  for (; e; ++n)
    r[n] = e, e >>>= 8;
}, rn = function(r, n) {
  var e = n.level, a = e == 0 ? 0 : e < 6 ? 1 : e == 9 ? 3 : 2;
  if (r[0] = 120, r[1] = a << 6 | (n.dictionary && 32), r[1] |= 31 - (r[0] << 8 | r[1]) % 31, n.dictionary) {
    var v = Kr();
    v.p(n.dictionary), E(r, 2, v.d());
  }
};
function nn(r, n) {
  return Nr(r, n || {}, 0, 0);
}
function en(r, n) {
  return Lr(r, { i: 2 }, n && n.out, n && n.dictionary);
}
function hn(r, n) {
  n || (n = {});
  var e = Kr();
  e.p(r);
  var a = Nr(r, n, n.dictionary ? 6 : 2, 4);
  return rn(a, n), E(a, a.length - 4, e.d()), a;
}
var Qr = function(r, n, e, a) {
  for (var v in r) {
    var f = r[v], l = n + v, u = a;
    Array.isArray(f) && (u = Pr(a, f[1]), f = f[0]), ArrayBuffer.isView(f) ? e[l] = [f, u] : (e[l += "/"] = [new m(0), u], Qr(f, l, e, a));
  }
}, Dr = typeof TextEncoder < "u" && /* @__PURE__ */ new TextEncoder(), Ar = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), an = 0;
try {
  Ar.decode(Jr, { stream: !0 }), an = 1;
} catch {
}
var vn = function(r) {
  for (var n = "", e = 0; ; ) {
    var a = r[e++], v = (a > 127) + (a > 223) + (a > 239);
    if (e + v > r.length)
      return { s: n, r: tr(r, e - 1) };
    v ? v == 3 ? (a = ((a & 15) << 18 | (r[e++] & 63) << 12 | (r[e++] & 63) << 6 | r[e++] & 63) - 65536, n += String.fromCharCode(55296 | a >> 10, 56320 | a & 1023)) : v & 1 ? n += String.fromCharCode((a & 31) << 6 | r[e++] & 63) : n += String.fromCharCode((a & 15) << 12 | (r[e++] & 63) << 6 | r[e++] & 63) : n += String.fromCharCode(a);
  }
};
function Ir(r, n) {
  var e;
  if (Dr)
    return Dr.encode(r);
  for (var a = r.length, v = new m(r.length + (r.length >> 1)), f = 0, l = function(g) {
    v[f++] = g;
  }, e = 0; e < a; ++e) {
    if (f + 5 > v.length) {
      var u = new m(f + 8 + (a - e << 1));
      u.set(v), v = u;
    }
    var t = r.charCodeAt(e);
    t < 128 || n ? l(t) : t < 2048 ? (l(192 | t >> 6), l(128 | t & 63)) : t > 55295 && t < 57344 ? (t = 65536 + (t & 1047552) | r.charCodeAt(++e) & 1023, l(240 | t >> 18), l(128 | t >> 12 & 63), l(128 | t >> 6 & 63), l(128 | t & 63)) : (l(224 | t >> 12), l(128 | t >> 6 & 63), l(128 | t & 63));
  }
  return tr(v, 0, f);
}
function fn(r, n) {
  if (n) {
    for (var e = "", a = 0; a < r.length; a += 16384)
      e += String.fromCharCode.apply(null, r.subarray(a, a + 16384));
    return e;
  } else {
    if (Ar)
      return Ar.decode(r);
    var v = vn(r), f = v.s, e = v.r;
    return e.length && Y(8), f;
  }
}
var ln = function(r, n) {
  return n + 30 + $(r, n + 26) + $(r, n + 28);
}, on = function(r, n, e) {
  var a = $(r, n + 28), v = $(r, n + 30), f = fn(r.subarray(n + 46, n + 46 + a), !($(r, n + 8) & 2048)), l = n + 46 + a, u = tn(r, l, v, e, W(r, n + 20), W(r, n + 24), W(r, n + 42)), t = u[0], g = u[1], o = u[2];
  return [$(r, n + 10), t, g, f, l + v + $(r, n + 32), o];
}, tn = function(r, n, e, a, v, f, l) {
  var u = v == 4294967295, t = f == 4294967295, g = l == 4294967295, o = n + e, i = u + t + g;
  if (a && i) {
    for (; n + 4 < o; n += 4 + $(r, n + 2))
      if ($(r, n) == 1)
        return [
          u ? Mr(r, n + 4 + 8 * t) : v,
          t ? Mr(r, n + 4) : f,
          g ? Mr(r, n + 4 + 8 * (t + u)) : l,
          1
        ];
    a < 2 && Y(13);
  }
  return [v, f, l, 0];
}, kr = function(r) {
  var n = 0;
  if (r)
    for (var e in r) {
      var a = r[e].length;
      a > 65535 && Y(9), n += a + 4;
    }
  return n;
}, qr = function(r, n, e, a, v, f, l, u) {
  var t = a.length, g = e.extra, o = u && u.length, i = kr(g);
  E(r, n, l != null ? 33639248 : 67324752), n += 4, l != null && (r[n++] = 20, r[n++] = e.os), r[n] = 20, n += 2, r[n++] = e.flag << 1 | (f < 0 && 8), r[n++] = v && 8, r[n++] = e.compression & 255, r[n++] = e.compression >> 8;
  var h = new Date(e.mtime == null ? Date.now() : e.mtime), c = h.getFullYear() - 1980;
  if ((c < 0 || c > 119) && Y(10), E(r, n, c << 25 | h.getMonth() + 1 << 21 | h.getDate() << 16 | h.getHours() << 11 | h.getMinutes() << 5 | h.getSeconds() >> 1), n += 4, f != -1 && (E(r, n, e.crc), E(r, n + 4, f < 0 ? -f - 2 : f), E(r, n + 8, e.size)), E(r, n + 12, t), E(r, n + 14, i), n += 16, l != null && (E(r, n, o), E(r, n + 6, e.attrs), E(r, n + 10, l), n += 14), r.set(a, n), n += t, i)
    for (var y in g) {
      var x = g[y], C = x.length;
      E(r, n, +y), E(r, n + 2, C), r.set(x, n + 4), n += 4 + C;
    }
  return o && (r.set(u, n), n += o), n;
}, un = function(r, n, e, a, v) {
  E(r, n, 101010256), E(r, n + 8, e), E(r, n + 10, e), E(r, n + 12, a), E(r, n + 16, v);
};
function gn(r, n) {
  n || (n = {});
  var e = {}, a = [];
  Qr(r, "", e, n);
  var v = 0, f = 0;
  for (var l in e) {
    var u = e[l], t = u[0], g = u[1], o = g.level == 0 ? 0 : 8, i = Ir(l), h = i.length, c = g.comment, y = c && Ir(c), x = y && y.length, C = kr(g.extra);
    h > 65535 && Y(11);
    var T = o ? nn(t, g) : t, O = T.length, F = dr();
    F.p(t), a.push(Pr(g, {
      size: t.length,
      crc: F.d(),
      c: T,
      f: i,
      m: y,
      u: h != l.length || y && c.length != x,
      o: v,
      compression: o
    })), v += 30 + h + C + O, f += 76 + 2 * (h + C) + (x || 0) + O;
  }
  for (var A = new m(f + 22), U = v, D = f - v, k = 0; k < a.length; ++k) {
    var i = a[k];
    qr(A, i.o, i, i.f, i.u, i.c.length);
    var s = 30 + i.f.length + kr(i.extra);
    A.set(i.c, i.o + s), qr(A, v, i, i.f, i.u, i.c.length, i.o, i.m), v += 16 + s + (i.m ? i.m.length : 0);
  }
  return un(A, v, a.length, D, U), A;
}
function wn(r, n) {
  for (var e = {}, a = r.length - 22; W(r, a) != 101010256; --a)
    (!a || r.length - a > 65558) && Y(13);
  var v = $(r, a + 8);
  if (!v)
    return {};
  var f = W(r, a + 16), l = W(r, a - 20) == 117853008;
  if (l) {
    var u = W(r, a - 12);
    l = W(r, u) == 101075792, l && (v = W(r, u + 32), f = W(r, u + 48));
  }
  for (var t = n && n.filter, g = 0; g < v; ++g) {
    var o = on(r, f, l), i = o[0], h = o[1], c = o[2], y = o[3], x = o[4], C = o[5], T = ln(r, C);
    f = x, (!t || t({
      name: y,
      size: h,
      originalSize: c,
      compression: i
    })) && (i ? i == 8 ? e[y] = en(r.subarray(T, T + h), { out: new m(c) }) : Y(14, "unknown compression type " + i) : e[y] = tr(r, T, T + h));
  }
  return e;
}
export {
  fn as a,
  hn as b,
  Ir as s,
  wn as u,
  gn as z
};
