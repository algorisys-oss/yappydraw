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
]), cr = new m([
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
]), Mr = new m([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Hr = function(r, n) {
  for (var e = new Q(31), a = 0; a < 31; ++a)
    e[a] = n += 1 << r[a - 1];
  for (var v = new mr(e[30]), a = 1; a < 30; ++a)
    for (var f = e[a]; f < e[a + 1]; ++f)
      v[f] = f - e[a] << 5 | a;
  return { b: e, r: v };
}, Or = Hr(gr, 2), Vr = Or.b, Sr = Or.r;
Vr[28] = 258, Sr[258] = 28;
var Yr = Hr(cr, 0), Wr = Yr.b, Br = Yr.r, Cr = new Q(32768);
for (var z = 0; z < 32768; ++z) {
  var b = (z & 43690) >> 1 | (z & 21845) << 1;
  b = (b & 52428) >> 2 | (b & 13107) << 2, b = (b & 61680) >> 4 | (b & 3855) << 4, Cr[z] = ((b & 65280) >> 8 | (b & 255) << 8) >> 1;
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
          u[Cr[i] >> t] = g;
  } else
    for (u = new Q(a), v = 0; v < a; ++v)
      r[v] && (u[v] = Cr[l[r[v] - 1]++] >> 15 - r[v]);
  return u;
}), d = new m(288);
for (var z = 0; z < 144; ++z)
  d[z] = 8;
for (var z = 144; z < 256; ++z)
  d[z] = 9;
for (var z = 256; z < 280; ++z)
  d[z] = 7;
for (var z = 280; z < 288; ++z)
  d[z] = 8;
var or = new m(32);
for (var z = 0; z < 32; ++z)
  or[z] = 5;
var Xr = /* @__PURE__ */ j(d, 9, 0), Zr = /* @__PURE__ */ j(d, 9, 1), $r = /* @__PURE__ */ j(or, 5, 0), jr = /* @__PURE__ */ j(or, 5, 1), sr = function(r) {
  for (var n = r[0], e = 1; e < r.length; ++e)
    r[e] > n && (n = r[e]);
  return n;
}, X = function(r, n, e) {
  var a = n / 8 | 0;
  return (r[a] | r[a + 1] << 8) >> (n & 7) & e;
}, yr = function(r, n) {
  var e = n / 8 | 0;
  return (r[e] | r[e + 1] << 8 | r[e + 2] << 16) >> (n & 7);
}, Tr = function(r) {
  return (r + 7) / 8 | 0;
}, tr = function(r, n, e) {
  return (n == null || n < 0) && (n = 0), (e == null || e > r.length) && (e = r.length), new m(r.subarray(n, e));
}, Lr = [
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
], D = function(r, n, e) {
  var a = new Error(n || Lr[r]);
  if (a.code = r, Error.captureStackTrace && Error.captureStackTrace(a, D), !e)
    throw a;
  return a;
}, Gr = function(r, n, e, a) {
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
  }, o = n.f || 0, i = n.p || 0, h = n.b || 0, w = n.l, x = n.d, y = n.m, M = n.n, T = v * 8;
  do {
    if (!w) {
      o = X(r, i, 1);
      var V = X(r, i + 1, 3);
      if (i += 3, V)
        if (V == 1)
          w = Zr, x = jr, y = 9, M = 5;
        else if (V == 2) {
          var I = X(r, i, 31) + 257, k = X(r, i + 10, 15) + 4, s = I + X(r, i + 5, 31) + 1;
          i += 14;
          for (var c = new m(s), q = new m(19), B = 0; B < k; ++B)
            q[Mr[B]] = X(r, i + B * 3, 7);
          i += k * 3;
          for (var Y = sr(q), p = (1 << Y) - 1, K = j(q, Y, 1), B = 0; B < s; ) {
            var G = K[X(r, i, p)];
            i += G & 15;
            var F = G >> 4;
            if (F < 16)
              c[B++] = F;
            else {
              var H = 0, S = 0;
              for (F == 16 ? (S = 3 + X(r, i, 3), i += 2, H = c[B - 1]) : F == 17 ? (S = 3 + X(r, i, 7), i += 3) : F == 18 && (S = 11 + X(r, i, 127), i += 7); S--; )
                c[B++] = H;
            }
          }
          var J = c.subarray(0, I), O = c.subarray(I);
          y = sr(J), M = sr(O), w = j(J, y, 1), x = j(O, M, 1);
        } else
          D(1);
      else {
        var F = Tr(i) + 4, A = r[F - 4] | r[F - 3] << 8, U = F + A;
        if (U > v) {
          t && D(0);
          break;
        }
        u && g(h + A), e.set(r.subarray(F, U), h), n.b = h += A, n.p = i = U * 8, n.f = o;
        continue;
      }
      if (i > T) {
        t && D(0);
        break;
      }
    }
    u && g(h + 131072);
    for (var ar = (1 << y) - 1, R = (1 << M) - 1, L = i; ; L = i) {
      var H = w[yr(r, i) & ar], N = H >> 4;
      if (i += H & 15, i > T) {
        t && D(0);
        break;
      }
      if (H || D(2), N < 256)
        e[h++] = N;
      else if (N == 256) {
        L = i, w = null;
        break;
      } else {
        var P = N - 254;
        if (N > 264) {
          var B = N - 257, C = gr[B];
          P = X(r, i, (1 << C) - 1) + Vr[B], i += C;
        }
        var Z = x[yr(r, i) & R], rr = Z >> 4;
        Z || D(3), i += Z & 15;
        var O = Wr[rr];
        if (rr > 3) {
          var C = cr[rr];
          O += yr(r, i) & (1 << C) - 1, i += C;
        }
        if (i > T) {
          t && D(0);
          break;
        }
        u && g(h + 131072);
        var nr = h + P;
        if (h < O) {
          var ur = f - O, hr = Math.min(O, nr);
          for (ur + h < 0 && D(3); h < hr; ++h)
            e[h] = a[ur + h];
        }
        for (; h < nr; ++h)
          e[h] = e[h - O];
      }
    }
    n.l = w, n.p = L, n.b = h, n.f = o, w && (o = 1, n.m = y, n.d = x, n.n = M);
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
}, xr = function(r, n) {
  for (var e = [], a = 0; a < r.length; ++a)
    r[a] && e.push({ s: a, f: r[a] });
  var v = e.length, f = e.slice();
  if (!v)
    return { t: Kr, l: 0 };
  if (v == 1) {
    var l = new m(e[0].s + 1);
    return l[e[0].s] = 1, { t: l, l: 1 };
  }
  e.sort(function(U, I) {
    return U.f - I.f;
  }), e.push({ s: -1, f: 25001 });
  var u = e[0], t = e[1], g = 0, o = 1, i = 2;
  for (e[0] = { s: -1, f: u.f + t.f, l: u, r: t }; o != v - 1; )
    u = e[e[g].f < e[i].f ? g++ : i++], t = e[g != o && e[g].f < e[i].f ? g++ : i++], e[o++] = { s: -1, f: u.f + t.f, l: u, r: t };
  for (var h = f[0].s, a = 1; a < v; ++a)
    f[a].s > h && (h = f[a].s);
  var w = new Q(h + 1), x = Fr(e[o - 1], w, 0);
  if (x > n) {
    var a = 0, y = 0, M = x - n, T = 1 << M;
    for (f.sort(function(I, k) {
      return w[k.s] - w[I.s] || I.f - k.f;
    }); a < v; ++a) {
      var V = f[a].s;
      if (w[V] > n)
        y += T - (1 << x - w[V]), w[V] = n;
      else
        break;
    }
    for (y >>= M; y > 0; ) {
      var F = f[a].s;
      w[F] < n ? y -= 1 << n - w[F]++ - 1 : ++a;
    }
    for (; a >= 0 && y; --a) {
      var A = f[a].s;
      w[A] == n && (--w[A], ++y);
    }
    x = n;
  }
  return { t: new m(w), l: x };
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
}, Jr = function(r, n, e) {
  var a = e.length, v = Tr(n + 2);
  r[v] = a & 255, r[v + 1] = a >> 8, r[v + 2] = r[v] ^ 255, r[v + 3] = r[v + 1] ^ 255;
  for (var f = 0; f < a; ++f)
    r[v + f + 4] = e[f];
  return (v + 4 + a) * 8;
}, Ur = function(r, n, e, a, v, f, l, u, t, g, o) {
  _(n, o++, e), ++v[256];
  for (var i = xr(v, 15), h = i.t, w = i.l, x = xr(f, 15), y = x.t, M = x.l, T = Er(h), V = T.c, F = T.n, A = Er(y), U = A.c, I = A.n, k = new Q(19), s = 0; s < V.length; ++s)
    ++k[V[s] & 31];
  for (var s = 0; s < U.length; ++s)
    ++k[U[s] & 31];
  for (var c = xr(k, 7), q = c.t, B = c.l, Y = 19; Y > 4 && !q[Mr[Y - 1]]; --Y)
    ;
  var p = g + 5 << 3, K = lr(v, d) + lr(f, or) + l, G = lr(v, h) + lr(f, y) + l + 14 + 3 * Y + lr(k, q) + 2 * k[16] + 3 * k[17] + 7 * k[18];
  if (t >= 0 && p <= K && p <= G)
    return Jr(n, o, r.subarray(t, t + g));
  var H, S, J, O;
  if (_(n, o, 1 + (G < K)), o += 2, G < K) {
    H = j(h, w, 0), S = h, J = j(y, M, 0), O = y;
    var ar = j(q, B, 0);
    _(n, o, F - 257), _(n, o + 5, I - 1), _(n, o + 10, Y - 4), o += 14;
    for (var s = 0; s < Y; ++s)
      _(n, o + 3 * s, q[Mr[s]]);
    o += 3 * Y;
    for (var R = [V, U], L = 0; L < 2; ++L)
      for (var N = R[L], s = 0; s < N.length; ++s) {
        var P = N[s] & 31;
        _(n, o, ar[P]), o += q[P], P > 15 && (_(n, o, N[s] >> 5 & 127), o += N[s] >> 12);
      }
  } else
    H = Xr, S = d, J = $r, O = or;
  for (var s = 0; s < u; ++s) {
    var C = a[s];
    if (C > 255) {
      var P = C >> 18 & 31;
      ir(n, o, H[P + 257]), o += S[P + 257], P > 7 && (_(n, o, C >> 23 & 31), o += gr[P]);
      var Z = C & 31;
      ir(n, o, J[Z]), o += O[Z], Z > 3 && (ir(n, o, C >> 5 & 8191), o += cr[Z]);
    } else
      ir(n, o, H[C]), o += S[C];
  }
  return ir(n, o, H[256]), o + S[256];
}, _r = /* @__PURE__ */ new mr([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), Kr = /* @__PURE__ */ new m(0), pr = function(r, n, e, a, v, f) {
  var l = f.z || r.length, u = new m(a + l + 5 * (1 + Math.ceil(l / 7e3)) + v), t = u.subarray(a, u.length - v), g = f.l, o = (f.r || 0) & 7;
  if (n) {
    o && (t[0] = f.r >> 3);
    for (var i = _r[n - 1], h = i >> 13, w = i & 8191, x = (1 << e) - 1, y = f.p || new Q(32768), M = f.h || new Q(x + 1), T = Math.ceil(e / 3), V = 2 * T, F = function(wr) {
      return (r[wr] ^ r[wr + 1] << T ^ r[wr + 2] << V) & x;
    }, A = new mr(25e3), U = new Q(288), I = new Q(32), k = 0, s = 0, c = f.i || 0, q = 0, B = f.w || 0, Y = 0; c + 2 < l; ++c) {
      var p = F(c), K = c & 32767, G = M[p];
      if (y[K] = G, M[p] = K, B <= c) {
        var H = l - c;
        if ((k > 7e3 || q > 24576) && (H > 423 || !g)) {
          o = Ur(r, t, 0, A, U, I, s, q, Y, c - Y, o), q = k = s = 0, Y = c;
          for (var S = 0; S < 286; ++S)
            U[S] = 0;
          for (var S = 0; S < 30; ++S)
            I[S] = 0;
        }
        var J = 2, O = 0, ar = w, R = K - G & 32767;
        if (H > 2 && p == F(c - R))
          for (var L = Math.min(h, H) - 1, N = Math.min(32767, c), P = Math.min(258, H); R <= N && --ar && K != G; ) {
            if (r[c + J] == r[c + J - R]) {
              for (var C = 0; C < P && r[c + C] == r[c + C - R]; ++C)
                ;
              if (C > J) {
                if (J = C, O = R, C > L)
                  break;
                for (var Z = Math.min(R, C - 2), rr = 0, S = 0; S < Z; ++S) {
                  var nr = c - R + S & 32767, ur = y[nr], hr = nr - ur & 32767;
                  hr > rr && (rr = hr, G = nr);
                }
              }
            }
            K = G, G = y[K], R += K - G & 32767;
          }
        if (O) {
          A[q++] = 268435456 | Sr[J] << 18 | Br[O];
          var vr = Sr[J] & 31, fr = Br[O] & 31;
          s += gr[vr] + cr[fr], ++U[257 + vr], ++I[fr], B = c + J, ++k;
        } else
          A[q++] = r[c], ++U[r[c]];
      }
    }
    for (c = Math.max(c, B); c < l; ++c)
      A[q++] = r[c], ++U[r[c]];
    o = Ur(r, t, g, A, U, I, s, q, Y, c - Y, o), g || (f.r = o & 7 | t[o / 8 | 0] << 3, o -= 7, f.h = M, f.p = y, f.i = c, f.w = B);
  } else {
    for (var c = f.w || 0; c < l + g; c += 65535) {
      var er = c + 65535;
      er >= l && (t[o / 8 | 0] = g, er = l), o = Jr(t, o + 1, r.subarray(c, er));
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
}, Nr = function() {
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
}, Pr = function(r, n, e, a, v) {
  if (!v && (v = { l: 1 }, n.dictionary)) {
    var f = n.dictionary.subarray(-32768), l = new m(f.length + r.length);
    l.set(f), l.set(r, f.length), r = l, v.w = f.length;
  }
  return pr(r, n.level == null ? 6 : n.level, n.mem == null ? v.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(r.length))) * 1.5) : 20 : 12 + n.mem, e, a, v);
}, Qr = function(r, n) {
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
}, zr = function(r, n) {
  return W(r, n) + W(r, n + 4) * 4294967296;
}, E = function(r, n, e) {
  for (; e; ++n)
    r[n] = e, e >>>= 8;
}, rn = function(r, n) {
  var e = n.level, a = e == 0 ? 0 : e < 6 ? 1 : e == 9 ? 3 : 2;
  if (r[0] = 120, r[1] = a << 6 | (n.dictionary && 32), r[1] |= 31 - (r[0] << 8 | r[1]) % 31, n.dictionary) {
    var v = Nr();
    v.p(n.dictionary), E(r, 2, v.d());
  }
}, nn = function(r, n) {
  return ((r[0] & 15) != 8 || r[0] >> 4 > 7 || (r[0] << 8 | r[1]) % 31) && D(6, "invalid zlib data"), (r[1] >> 5 & 1) == 1 && D(6, "invalid zlib data: " + (r[1] & 32 ? "need" : "unexpected") + " dictionary"), (r[1] >> 3 & 4) + 2;
};
function en(r, n) {
  return Pr(r, n || {}, 0, 0);
}
function an(r, n) {
  return Gr(r, { i: 2 }, n && n.out, n && n.dictionary);
}
function gn(r, n) {
  n || (n = {});
  var e = Nr();
  e.p(r);
  var a = Pr(r, n, n.dictionary ? 6 : 2, 4);
  return rn(a, n), E(a, a.length - 4, e.d()), a;
}
function cn(r, n) {
  return Gr(r.subarray(nn(r), -4), { i: 2 }, n, n);
}
var Rr = function(r, n, e, a) {
  for (var v in r) {
    var f = r[v], l = n + v, u = a;
    Array.isArray(f) && (u = Qr(a, f[1]), f = f[0]), ArrayBuffer.isView(f) ? e[l] = [f, u] : (e[l += "/"] = [new m(0), u], Rr(f, l, e, a));
  }
}, Dr = typeof TextEncoder < "u" && /* @__PURE__ */ new TextEncoder(), Ar = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), vn = 0;
try {
  Ar.decode(Kr, { stream: !0 }), vn = 1;
} catch {
}
var fn = function(r) {
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
function ln(r, n) {
  if (n) {
    for (var e = "", a = 0; a < r.length; a += 16384)
      e += String.fromCharCode.apply(null, r.subarray(a, a + 16384));
    return e;
  } else {
    if (Ar)
      return Ar.decode(r);
    var v = fn(r), f = v.s, e = v.r;
    return e.length && D(8), f;
  }
}
var on = function(r, n) {
  return n + 30 + $(r, n + 26) + $(r, n + 28);
}, tn = function(r, n, e) {
  var a = $(r, n + 28), v = $(r, n + 30), f = ln(r.subarray(n + 46, n + 46 + a), !($(r, n + 8) & 2048)), l = n + 46 + a, u = un(r, l, v, e, W(r, n + 20), W(r, n + 24), W(r, n + 42)), t = u[0], g = u[1], o = u[2];
  return [$(r, n + 10), t, g, f, l + v + $(r, n + 32), o];
}, un = function(r, n, e, a, v, f, l) {
  var u = v == 4294967295, t = f == 4294967295, g = l == 4294967295, o = n + e, i = u + t + g;
  if (a && i) {
    for (; n + 4 < o; n += 4 + $(r, n + 2))
      if ($(r, n) == 1)
        return [
          u ? zr(r, n + 4 + 8 * t) : v,
          t ? zr(r, n + 4) : f,
          g ? zr(r, n + 4 + 8 * (t + u)) : l,
          1
        ];
    a < 2 && D(13);
  }
  return [v, f, l, 0];
}, kr = function(r) {
  var n = 0;
  if (r)
    for (var e in r) {
      var a = r[e].length;
      a > 65535 && D(9), n += a + 4;
    }
  return n;
}, qr = function(r, n, e, a, v, f, l, u) {
  var t = a.length, g = e.extra, o = u && u.length, i = kr(g);
  E(r, n, l != null ? 33639248 : 67324752), n += 4, l != null && (r[n++] = 20, r[n++] = e.os), r[n] = 20, n += 2, r[n++] = e.flag << 1 | (f < 0 && 8), r[n++] = v && 8, r[n++] = e.compression & 255, r[n++] = e.compression >> 8;
  var h = new Date(e.mtime == null ? Date.now() : e.mtime), w = h.getFullYear() - 1980;
  if ((w < 0 || w > 119) && D(10), E(r, n, w << 25 | h.getMonth() + 1 << 21 | h.getDate() << 16 | h.getHours() << 11 | h.getMinutes() << 5 | h.getSeconds() >> 1), n += 4, f != -1 && (E(r, n, e.crc), E(r, n + 4, f < 0 ? -f - 2 : f), E(r, n + 8, e.size)), E(r, n + 12, t), E(r, n + 14, i), n += 16, l != null && (E(r, n, o), E(r, n + 6, e.attrs), E(r, n + 10, l), n += 14), r.set(a, n), n += t, i)
    for (var x in g) {
      var y = g[x], M = y.length;
      E(r, n, +x), E(r, n + 2, M), r.set(y, n + 4), n += 4 + M;
    }
  return o && (r.set(u, n), n += o), n;
}, hn = function(r, n, e, a, v) {
  E(r, n, 101010256), E(r, n + 8, e), E(r, n + 10, e), E(r, n + 12, a), E(r, n + 16, v);
};
function wn(r, n) {
  n || (n = {});
  var e = {}, a = [];
  Rr(r, "", e, n);
  var v = 0, f = 0;
  for (var l in e) {
    var u = e[l], t = u[0], g = u[1], o = g.level == 0 ? 0 : 8, i = Ir(l), h = i.length, w = g.comment, x = w && Ir(w), y = x && x.length, M = kr(g.extra);
    h > 65535 && D(11);
    var T = o ? en(t, g) : t, V = T.length, F = dr();
    F.p(t), a.push(Qr(g, {
      size: t.length,
      crc: F.d(),
      c: T,
      f: i,
      m: x,
      u: h != l.length || x && w.length != y,
      o: v,
      compression: o
    })), v += 30 + h + M + V, f += 76 + 2 * (h + M) + (y || 0) + V;
  }
  for (var A = new m(f + 22), U = v, I = f - v, k = 0; k < a.length; ++k) {
    var i = a[k];
    qr(A, i.o, i, i.f, i.u, i.c.length);
    var s = 30 + i.f.length + kr(i.extra);
    A.set(i.c, i.o + s), qr(A, v, i, i.f, i.u, i.c.length, i.o, i.m), v += 16 + s + (i.m ? i.m.length : 0);
  }
  return hn(A, v, a.length, I, U), A;
}
function sn(r, n) {
  for (var e = {}, a = r.length - 22; W(r, a) != 101010256; --a)
    (!a || r.length - a > 65558) && D(13);
  var v = $(r, a + 8);
  if (!v)
    return {};
  var f = W(r, a + 16), l = W(r, a - 20) == 117853008;
  if (l) {
    var u = W(r, a - 12);
    l = W(r, u) == 101075792, l && (v = W(r, u + 32), f = W(r, u + 48));
  }
  for (var t = n && n.filter, g = 0; g < v; ++g) {
    var o = tn(r, f, l), i = o[0], h = o[1], w = o[2], x = o[3], y = o[4], M = o[5], T = on(r, M);
    f = y, (!t || t({
      name: x,
      size: h,
      originalSize: w,
      compression: i
    })) && (i ? i == 8 ? e[x] = an(r.subarray(T, T + h), { out: new m(w) }) : D(14, "unknown compression type " + i) : e[x] = tr(r, T, T + h));
  }
  return e;
}
export {
  ln as a,
  gn as b,
  cn as c,
  an as i,
  Ir as s,
  sn as u,
  wn as z
};
