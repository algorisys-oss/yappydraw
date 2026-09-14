function ce(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function dt(t) {
  return t.property === "text" && "textConfig" in t;
}
function Y(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function V(t) {
  return t.kind === "spring" && "spring" in t;
}
function Et(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function dr(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function he(t) {
  return "keyframes" in t;
}
class yr {
  _currentTime = 0;
  _isRunning = !1;
  onTick = null;
  get currentTime() {
    return this._currentTime;
  }
  get isRunning() {
    return this._isRunning;
  }
  start() {
    this._isRunning = !0;
  }
  stop() {
    this._isRunning = !1;
  }
  tick(e) {
    this._currentTime += e, this.onTick?.(e, this._currentTime);
  }
  reset() {
    this._currentTime = 0;
  }
  seek(e) {
    this._currentTime = e;
  }
}
class _r {
  _currentTime = 0;
  _isRunning = !1;
  _lastFrameTime = null;
  _rafId = null;
  _speed;
  onTick = null;
  constructor(e = {}) {
    this._speed = e.speed ?? 1;
  }
  get currentTime() {
    return this._currentTime;
  }
  get isRunning() {
    return this._isRunning;
  }
  get speed() {
    return this._speed;
  }
  set speed(e) {
    this._speed = e;
  }
  start() {
    this._isRunning || (this._isRunning = !0, this._lastFrameTime = null, this._scheduleFrame());
  }
  stop() {
    this._isRunning = !1, this._rafId !== null && (cancelAnimationFrame(this._rafId), this._rafId = null);
  }
  reset() {
    this._currentTime = 0, this._lastFrameTime = null;
  }
  seek(e) {
    this._currentTime = e;
  }
  _scheduleFrame() {
    this._rafId = requestAnimationFrame(this._onFrame.bind(this));
  }
  _onFrame(e) {
    if (this._isRunning) {
      if (this._lastFrameTime !== null) {
        const r = (e - this._lastFrameTime) * this._speed;
        this._currentTime += r, this.onTick?.(r, this._currentTime);
      }
      this._lastFrameTime = e, this._scheduleFrame();
    }
  }
}
function Ot(t, e, r = "start") {
  if (e <= 1) return 0;
  if (typeof r == "number") {
    const n = Math.max(0, Math.min(e - 1, r));
    return Math.abs(t - n);
  }
  switch (r) {
    case "end":
      return e - 1 - t;
    case "center":
      return Math.abs(t - (e - 1) / 2);
    case "edges":
      return (e - 1) / 2 - Math.abs(t - (e - 1) / 2);
    default:
      return t;
  }
}
function ue(t, e = "start") {
  if (t <= 1) return 0;
  let r = 0;
  for (let n = 0; n < t; n++)
    r = Math.max(r, Ot(n, t, e));
  return r;
}
function Xt(t, e, r) {
  const n = r.from ?? "start", s = Ot(t, e, n);
  if (r.amount !== void 0) {
    const a = ue(e, n);
    return a === 0 ? 0 : r.amount * s / a;
  }
  return r.each !== void 0 ? r.each * s : 0;
}
function le(t, e) {
  return Array.from({ length: t }, (r, n) => Xt(n, t, e));
}
function yt(t, e) {
  return t <= 1 ? 0 : Math.max(...le(t, e));
}
const K = 1, Nt = 6e4, tt = Nt / K, R = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, kr = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class rt {
  from;
  to;
  stiffness;
  damping;
  mass;
  restDelta;
  restSpeed;
  /** value[i] is the spring's position at time i * SPRING_STEP_MS */
  /**
   * Travel distance, used to scale the rest thresholds.
   *
   * Without this the thresholds are absolute, and a spring animating `scale`
   * from 0 to 1 hits them ~100x sooner than one animating `x` from 0 to 100 —
   * so the small one is declared "settled" at its first pass through the
   * target and never shows the overshoot at all. Scaling by travel makes
   * settling depend on the spring's parameters, not on the units of whatever
   * property it happens to drive.
   */
  distance;
  samples;
  velocity;
  /** Once at rest we stop simulating; every later time returns `to`. */
  settledStep = null;
  constructor(e) {
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? R.stiffness, this.damping = e.damping ?? R.damping, this.mass = e.mass ?? R.mass, this.restDelta = e.restDelta ?? R.restDelta, this.restSpeed = e.restSpeed ?? R.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? R.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
  }
  /**
   * Whether a position/velocity pair counts as settled.
   *
   * Both thresholds are fractions of the spring's travel distance:
   * `restDelta` as a fraction of the distance, and `restSpeed` as a fraction
   * of the distance per second. That keeps settling scale-invariant.
   */
  isAtRest(e) {
    return Math.abs(e - this.to) < this.restDelta * this.distance && Math.abs(this.velocity) < this.restSpeed * this.distance;
  }
  /**
   * Position at `timeMs`. Times before 0 clamp to the start value; times past
   * settling return the target exactly.
   */
  valueAt(e) {
    if (e <= 0) return this.from;
    const r = Math.floor(e / K);
    if (this.simulateTo(r + 1), this.settledStep !== null && r >= this.settledStep)
      return this.to;
    const n = this.samples[Math.min(r, this.samples.length - 1)], s = this.samples[Math.min(r + 1, this.samples.length - 1)], a = e / K - r;
    return n + (s - n) * a;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(tt + 1), this.settledStep !== null ? this.settledStep * K : Nt;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const r = Math.min(e, tt + 1), n = K / 1e3;
    for (; this.samples.length < r; ) {
      const s = this.samples[this.samples.length - 1], a = s - this.to, i = -this.stiffness * a, o = -this.damping * this.velocity, c = (i + o) / this.mass;
      this.velocity += c * n;
      const h = s + this.velocity * n;
      if (this.samples.push(h), this.isAtRest(h)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > tt && (this.settledStep = tt);
  }
}
function Mr(t, e) {
  return new rt(t).valueAt(e);
}
function Tr(t) {
  return new rt(t).settleTime();
}
function br(t) {
  const e = t.stiffness ?? R.stiffness, r = t.damping ?? R.damping, n = t.mass ?? R.mass;
  return r < 2 * Math.sqrt(e * n);
}
function vr(t) {
  const e = t.stiffness ?? R.stiffness, r = t.mass ?? R.mass;
  return 2 * Math.sqrt(e * r);
}
const Tt = 4, fe = 2e-3, ge = 1e-4, me = 6e4;
function nt(t) {
  const e = t.friction ?? Tt;
  return e > 0 ? e : Tt;
}
function pe(t) {
  return t.from + t.velocity / nt(t);
}
function de(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let r = e[0];
  for (const n of e)
    Math.abs(n - t) < Math.abs(r - t) && (r = n);
  return r;
}
function st(t) {
  let e = de(pe(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function at(t) {
  const e = Math.abs(st(t) - t.from);
  if (e === 0) return 0;
  const r = t.restDelta ?? Math.max(ge, e * fe);
  if (r >= e) return 0;
  const n = Math.log(e / r) / nt(t);
  return Math.min(me, n * 1e3);
}
function mt(t, e) {
  if (e <= 0) return t.from;
  const r = st(t);
  if (e >= at(t)) return r;
  const n = nt(t);
  return t.from + (r - t.from) * (1 - Math.exp(-n * e / 1e3));
}
function xr(t, e) {
  const r = nt(t), n = st(t);
  return e >= at(t) ? 0 : (n - t.from) * r * Math.exp(-r * Math.max(0, e) / 1e3);
}
const Yt = (t) => t, ye = (t) => t * t, _e = (t) => 1 - (1 - t) * (1 - t), ke = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, Vt = (t) => t * t * t, zt = (t) => 1 - Math.pow(1 - t, 3), Wt = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Me = Vt, Te = zt, be = Wt, ve = {
  linear: Yt,
  "ease-in": Me,
  "ease-out": Te,
  "ease-in-out": be,
  "ease-in-quad": ye,
  "ease-out-quad": _e,
  "ease-in-out-quad": ke,
  "ease-in-cubic": Vt,
  "ease-out-cubic": zt,
  "ease-in-out-cubic": Wt
};
function xe(t) {
  const [e, r, n, s] = t, a = 3 * e, i = 3 * (n - e) - a, o = 1 - a - i, c = 3 * r, h = 3 * (s - r) - c, u = 1 - c - h, l = (f) => ((o * f + i) * f + a) * f, g = (f) => ((u * f + h) * f + c) * f, m = (f) => (3 * o * f + 2 * i) * f + a, _ = (f) => {
    let p = f;
    for (let $ = 0; $ < 8; $++) {
      const b = l(p) - f;
      if (Math.abs(b) < 1e-7)
        return p;
      const d = m(p);
      if (Math.abs(d) < 1e-7)
        break;
      p -= b / d;
    }
    let y = 0, k = 1;
    for (p = f; y < k; ) {
      const $ = l(p);
      if (Math.abs($ - f) < 1e-7)
        return p;
      f > $ ? y = p : k = p, p = (y + k) / 2;
    }
    return p;
  };
  return (f) => {
    if (f <= 0) return 0;
    if (f >= 1) return 1;
    const p = _(f);
    return g(p);
  };
}
function qt(t) {
  return t === void 0 ? Yt : ce(t) ? xe(t.points) : ve[t];
}
const bt = 32, Se = 256, W = /* @__PURE__ */ new Map(), $e = /[MmLlHhVvCcSsQqTtAaZz]/, we = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Pe = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0
};
function Ie(t) {
  const e = [];
  let r = 0, n = null;
  const s = () => {
    for (; r < t.length && /[\s,]/.test(t[r]); ) r++;
  };
  for (; r < t.length && (s(), !(r >= t.length)); ) {
    const a = t[r];
    if ($e.test(a)) {
      n = { type: a, args: [] }, e.push(n), r++;
      continue;
    }
    if (!n) break;
    const i = n.type === "A" || n.type === "a", o = n.args.length % 7;
    if (i && (o === 3 || o === 4)) {
      if (a !== "0" && a !== "1") break;
      n.args.push(a === "1" ? 1 : 0), r++;
      continue;
    }
    const c = we.exec(t.slice(r));
    if (!c) break;
    n.args.push(parseFloat(c[0])), r += c[0].length;
  }
  return e;
}
function Ae(t, e, r, n, s, a, i, o, c) {
  if (t === o && e === c) return [];
  let h = Math.abs(r), u = Math.abs(n);
  if (h === 0 || u === 0) return [[t, e, o, c, o, c]];
  const l = s * Math.PI / 180, g = Math.cos(l), m = Math.sin(l), _ = (t - o) / 2, f = (e - c) / 2, p = g * _ + m * f, y = -m * _ + g * f, k = p * p / (h * h) + y * y / (u * u);
  if (k > 1) {
    const x = Math.sqrt(k);
    h *= x, u *= x;
  }
  const $ = a === i ? -1 : 1, b = h * h * u * u - h * h * y * y - u * u * p * p, d = h * h * y * y + u * u * p * p, T = $ * Math.sqrt(Math.max(0, b / d)), M = T * h * y / u, L = -T * u * p / h, B = g * M - m * L + (t + o) / 2, v = m * M + g * L + (e + c) / 2, A = (x, I, D, z) => {
    const ot = x * D + I * z, J = Math.sqrt((x * x + I * I) * (D * D + z * z)), H = Math.acos(Math.max(-1, Math.min(1, ot / J)));
    return x * z - I * D < 0 ? -H : H;
  }, w = A(1, 0, (p - M) / h, (y - L) / u);
  let P = A((p - M) / h, (y - L) / u, (-p - M) / h, (-y - L) / u);
  !i && P > 0 && (P -= 2 * Math.PI), i && P < 0 && (P += 2 * Math.PI);
  const X = Math.max(1, Math.ceil(Math.abs(P) / (Math.PI / 2))), it = P / X, G = 4 / 3 * Math.tan(it / 4), _t = (x) => {
    const I = h * Math.cos(x), D = u * Math.sin(x);
    return [g * I - m * D + B, m * I + g * D + v];
  }, kt = (x) => {
    const I = -h * Math.sin(x), D = u * Math.cos(x);
    return [g * I - m * D, m * I + g * D];
  }, Mt = [];
  for (let x = 0; x < X; x++) {
    const I = w + x * it, D = I + it, [z, ot] = _t(I), [J, H] = x === X - 1 ? [o, c] : _t(D), [se, ae] = kt(I), [ie, oe] = kt(D);
    Mt.push([z + G * se, ot + G * ae, J - G * ie, H - G * oe, J, H]);
  }
  return Mt;
}
function O(t, e, r, n, s) {
  const a = 1 - s;
  return a * a * a * t + 3 * a * a * s * e + 3 * a * s * s * r + s * s * s * n;
}
function vt(t, e, r, n, s) {
  const a = 1 - s;
  return 3 * a * a * (e - t) + 6 * a * s * (r - e) + 3 * s * s * (n - r);
}
function Z(t, e, r, n) {
  return {
    subpath: 0,
    type: "L",
    points: [r, n],
    startX: t,
    startY: e,
    endX: r,
    endY: n,
    length: Math.hypot(r - t, n - e)
  };
}
function et(t, e, r) {
  const [n, s, a, i, o, c] = r, h = [0];
  let u = t, l = e, g = 0;
  for (let m = 1; m <= bt; m++) {
    const _ = m / bt, f = O(t, n, a, o, _), p = O(e, s, i, c, _);
    g += Math.hypot(f - u, p - l), h.push(g), u = f, l = p;
  }
  return {
    subpath: 0,
    type: "C",
    points: [n, s, a, i, o, c],
    startX: t,
    startY: e,
    endX: o,
    endY: c,
    length: g,
    lengths: h
  };
}
function U(t) {
  const e = W.get(t);
  if (e) return e;
  const r = [];
  let n = 0, s = 0, a = 0, i = 0, o = null, c = null, h = -1;
  const u = /* @__PURE__ */ new Set(), l = (f) => {
    h < 0 && (h = 0), f.subpath = h, r.push(f);
  };
  for (const { type: f, args: p } of Ie(t)) {
    const y = f.toUpperCase(), k = f !== y, $ = Pe[y];
    if (y === "Z") {
      (n !== a || s !== i) && l(Z(n, s, a, i)), h >= 0 && u.add(h), n = a, s = i, o = c = null;
      continue;
    }
    for (let b = 0; b + $ <= p.length; b += $) {
      const d = p.slice(b, b + $), T = k ? n : 0, M = k ? s : 0;
      let L = null, B = null;
      switch (y) {
        case "M":
          b === 0 ? (n = d[0] + T, s = d[1] + M, a = n, i = s, (h < 0 || r[r.length - 1]?.subpath === h) && h++) : (l(Z(n, s, d[0] + T, d[1] + M)), n = d[0] + T, s = d[1] + M);
          break;
        case "L":
          l(Z(n, s, d[0] + T, d[1] + M)), n = d[0] + T, s = d[1] + M;
          break;
        case "H":
          l(Z(n, s, d[0] + T, s)), n = d[0] + T;
          break;
        case "V":
          l(Z(n, s, n, d[0] + M)), s = d[0] + M;
          break;
        case "C": {
          const v = [d[0] + T, d[1] + M, d[2] + T, d[3] + M, d[4] + T, d[5] + M];
          l(et(n, s, v)), L = [v[2], v[3]], n = v[4], s = v[5];
          break;
        }
        case "S": {
          const [v, A] = o ? [2 * n - o[0], 2 * s - o[1]] : [n, s], w = [v, A, d[0] + T, d[1] + M, d[2] + T, d[3] + M];
          l(et(n, s, w)), L = [w[2], w[3]], n = w[4], s = w[5];
          break;
        }
        case "Q":
        case "T": {
          let v = n, A = s;
          y === "Q" ? (v = d[0] + T, A = d[1] + M) : c && (v = 2 * n - c[0], A = 2 * s - c[1]);
          const w = y === "Q" ? d[2] + T : d[0] + T, P = y === "Q" ? d[3] + M : d[1] + M;
          l(
            et(n, s, [
              n + 2 / 3 * (v - n),
              s + 2 / 3 * (A - s),
              w + 2 / 3 * (v - w),
              P + 2 / 3 * (A - P),
              w,
              P
            ])
          ), B = [v, A], n = w, s = P;
          break;
        }
        case "A": {
          const v = d[5] + T, A = d[6] + M;
          let w = n, P = s;
          for (const X of Ae(n, s, d[0], d[1], d[2], d[3], d[4], v, A))
            l(et(w, P, X)), w = X[4], P = X[5];
          n = v, s = A;
          break;
        }
      }
      o = L, c = B;
    }
  }
  const g = r.reduce((f, p) => f + p.length, 0), m = [];
  for (let f = 0; f < r.length; ) {
    const p = r[f].subpath;
    let y = f, k = 0;
    for (; y < r.length && r[y].subpath === p; ) k += r[y++].length;
    const $ = r[f], b = r[y - 1], d = u.has(p) || Math.abs(b.endX - $.startX) < 1e-9 && Math.abs(b.endY - $.startY) < 1e-9;
    m.push({ start: f, end: y, length: k, closed: d }), f = y;
  }
  const _ = { segments: r, totalLength: g, subpaths: m };
  return W.size >= Se && W.delete(W.keys().next().value), W.set(t, _), _;
}
function De(t, e) {
  const r = t.lengths;
  if (e <= 0) return 0;
  if (e >= t.length) return 1;
  let n = 0, s = r.length - 1;
  for (; n < s - 1; ) {
    const o = n + s >> 1;
    r[o] < e ? n = o : s = o;
  }
  const a = r[s] - r[n], i = a > 0 ? (e - r[n]) / a : 0;
  return (n + i) / (r.length - 1);
}
function Re(t, e) {
  if (t.type === "L") {
    const l = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * l,
      y: t.startY + (t.endY - t.startY) * l,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [r, n, s, a, i, o] = t.points, c = De(t, e);
  let h = vt(t.startX, r, s, i, c), u = vt(t.startY, n, a, o, c);
  if (Math.hypot(h, u) < 1e-9) {
    const l = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), g = O(t.startX, r, s, i, l), m = O(t.startY, n, a, o, l), _ = O(t.startX, r, s, i, c), f = O(t.startY, n, a, o, c);
    h = c < 0.5 ? g - _ : _ - g, u = c < 0.5 ? m - f : f - m;
  }
  return {
    x: O(t.startX, r, s, i, c),
    y: O(t.startY, n, a, o, c),
    angle: Math.atan2(u, h) * 180 / Math.PI
  };
}
function Ut(t, e, r = 0, n = t.length) {
  if (n <= r) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let a = r; a < n; a++) {
    const i = t[a];
    if (s + i.length >= e || a === n - 1)
      return Re(i, e - s);
    s += i.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Ce(t, e) {
  const { segments: r, totalLength: n } = U(t);
  return Ut(r, Math.max(0, Math.min(1, e)) * n);
}
function Sr() {
  W.clear();
}
function $r(t) {
  return U(t).totalLength;
}
const Fe = 24, Le = 320, Ee = 2.5, j = 72, wr = 64, Oe = 128, q = /* @__PURE__ */ new Map(), xt = (t) => Math.round(t * 100) / 100;
function St(t, e) {
  const { segments: r, subpaths: n, totalLength: s } = U(t);
  if (r.length === 0) return [];
  if (e) {
    const a = n.every((i) => i.closed);
    return [{ segments: r, start: 0, end: r.length, length: s, closed: a }];
  }
  return n.filter((a) => a.length > 0).map((a) => ({ segments: r, start: a.start, end: a.end, length: a.length, closed: a.closed }));
}
function pt(t, e) {
  const r = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), n = Ut(t.segments, r * t.length, t.start, t.end);
  return [n.x, n.y];
}
function $t(t) {
  const e = [];
  let r = 0;
  for (let n = t.start; n < t.end; n++)
    r += t.segments[n].length, t.length > 0 && e.push(r / t.length);
  return e;
}
function wt(t, e) {
  const r = [];
  for (let n = 0; n < e; n++)
    r.push(pt(t, t.closed ? n / e : n / (e - 1)));
  return r;
}
function Pt(t) {
  let e = 0, r = 0;
  for (const [n, s] of t)
    e += n, r += s;
  return e /= t.length, r /= t.length, t.map(([n, s]) => [n - e, s - r]);
}
function Xe(t, e, r) {
  const n = t.closed && e.closed;
  if (r !== void 0)
    return { offset: n ? Math.abs(r) % j / j : 0, reversed: r < 0 };
  const s = Pt(wt(t, j)), a = Pt(wt(e, j)), i = j;
  let o = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const h of [!1, !0]) {
    const u = n ? i : 1;
    for (let l = 0; l < u; l++) {
      let g = 0;
      for (let m = 0; m < i && g < c; m++) {
        const _ = n ? h ? (l - m + i) % i : (m + l) % i : h ? i - 1 - m : m, f = s[m][0] - a[_][0], p = s[m][1] - a[_][1];
        g += f * f + p * p;
      }
      g < c && (c = g, o = { offset: n ? l / i : 0, reversed: h });
    }
  }
  return o;
}
function Ne(t, e, r) {
  return r ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Ye(t, e, r) {
  return r ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Ve(t, e, r) {
  const n = t.closed && e.closed, s = Xe(t, e, r.shapeIndex), a = Math.max(
    Fe,
    Math.min(Le, Math.ceil(Math.max(t.length, e.length) / Ee))
  ), i = /* @__PURE__ */ new Set(), o = (l) => i.add(Math.round(l * 1e7) / 1e7);
  for (let l = 0; l <= a; l++) o(l / a);
  for (const l of $t(t)) o(l);
  for (const l of $t(e)) o(Ye(l, s, n));
  let c = [...i].sort((l, g) => l - g);
  n && (c = c.filter((l) => l < 1));
  const h = [], u = [];
  for (const l of c)
    h.push(...pt(t, l)), u.push(...pt(e, Ne(l, s, n)));
  return { from: h, to: u, closed: n };
}
function ze(t, e, r) {
  const n = `${r.shapeIndex ?? "auto"}|${t}|${e}`, s = q.get(n);
  if (s) return s;
  const a = U(t).subpaths.filter((h) => h.length > 0).length === U(e).subpaths.filter((h) => h.length > 0).length, i = St(t, !a), o = St(e, !a), c = {
    pairs: i.map((h, u) => Ve(h, o[u], r))
  };
  return q.size >= Oe && q.delete(q.keys().next().value), q.set(n, c), c;
}
function We(t, e, r, n = {}) {
  if (!t) return e;
  if (!e) return t;
  const s = Math.max(0, Math.min(1, r));
  if (s === 0) return t;
  if (s === 1) return e;
  const a = ze(t, e, n);
  if (a.pairs.length === 0) return s < 0.5 ? t : e;
  let i = "";
  for (const o of a.pairs) {
    for (let c = 0; c < o.from.length; c += 2) {
      const h = xt(o.from[c] + (o.to[c] - o.from[c]) * s), u = xt(o.from[c + 1] + (o.to[c + 1] - o.from[c + 1]) * s);
      i += `${c === 0 ? i ? " M" : "M" : " L"}${h} ${u}`;
    }
    o.closed && (i += " Z");
  }
  return i;
}
function Pr() {
  q.clear();
}
function qe(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const E = (t, e, r) => t + (e - t) * r, Qt = 512, ct = /* @__PURE__ */ new Map(), ht = /* @__PURE__ */ new Map();
function It(t) {
  const e = ct.get(t);
  if (e) return e;
  const r = t.replace("#", ""), n = [
    parseInt(r.slice(0, 2), 16),
    parseInt(r.slice(2, 4), 16),
    parseInt(r.slice(4, 6), 16)
  ];
  return ct.size < Qt && ct.set(t, n), n;
}
const At = (t) => t.charCodeAt(0) === 35, Dt = (t) => t.startsWith("rgb"), Rt = (t) => t.startsWith("rgba"), Ue = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ut = (t) => Math.round(t).toString(16).padStart(2, "0");
function Qe(t, e, r) {
  return `#${ut(t)}${ut(e)}${ut(r)}`;
}
function Ct(t) {
  const e = ht.get(t);
  if (e) return e;
  const r = t.match(Ue);
  if (!r)
    throw new Error(`Invalid rgb color: ${t}`);
  const n = parseInt(r[1], 10), s = parseInt(r[2], 10), a = parseInt(r[3], 10), i = r[4] !== void 0 ? [n, s, a, parseFloat(r[4])] : [n, s, a];
  return ht.size < Qt && ht.set(t, i), i;
}
const He = (t, e, r) => {
  if (At(t) && At(e)) {
    const [n, s, a] = It(t), [i, o, c] = It(e), h = E(n, i, r), u = E(s, o, r), l = E(a, c, r);
    return Qe(h, u, l);
  }
  if ((Dt(t) || Rt(t)) && (Dt(e) || Rt(e))) {
    const n = Ct(t), s = Ct(e), a = Math.round(E(n[0], s[0], r)), i = Math.round(E(n[1], s[1], r)), o = Math.round(E(n[2], s[2], r));
    if (n.length === 4 || s.length === 4) {
      const c = n[3] ?? 1, h = s[3] ?? 1, u = E(c, h, r);
      return `rgba(${a}, ${i}, ${o}, ${u})`;
    }
    return `rgb(${a}, ${i}, ${o})`;
  }
  return r < 1 ? t : e;
}, Ze = (t, e, r) => {
  const n = Math.min(t.length, e.length), s = [];
  for (let a = 0; a < n; a++)
    s.push(E(t[a], e[a], r));
  return s;
}, Ft = (t, e, r) => r < 1 ? t : e, je = (t, e, r) => We(t, e, r);
function Ht(t) {
  return typeof t == "number" ? E : Array.isArray(t) ? Ze : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? He : qe(t) ? je : Ft : Ft;
}
const Zt = 1e3 / 60;
function jt(t, e = {}) {
  if (!V(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const r = new rt(t.spring);
  return Bt(t, (n) => r.valueAt(n), r.settleTime(), t.spring.from, t.spring.to, e);
}
function Kt(t, e = {}) {
  if (!Y(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const r = t.inertia;
  return Bt(
    t,
    (n) => mt(r, n),
    at(r),
    r.from,
    st(r),
    e
  );
}
function Bt(t, e, r, n, s, a) {
  const i = a.intervalMs ?? Zt, o = a.tolerance ?? 0.01, c = t.delay ?? 0, h = [];
  for (let l = 0; l <= r; l += i)
    h.push({ time: l + c, value: e(l), easing: "linear" });
  const u = h[h.length - 1];
  return !u || u.time < r + c ? h.push({ time: r + c, value: s, easing: "linear" }) : u.value = s, c > 0 && h.unshift({ time: 0, value: n, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: o > 0 ? Ke(h, o) : h,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Ir(t, e, r, n = {}) {
  const s = n.intervalMs ?? Zt, a = typeof r == "function" ? r : qt(r), i = Ht(t.value), o = e.time - t.time;
  if (o <= 0) return [e];
  const c = [];
  for (let u = s; u < o; u += s) {
    const l = u / o;
    c.push({
      time: t.time + u,
      value: i(t.value, e.value, a(l)),
      easing: "linear"
    });
  }
  const h = a(1);
  return c.push({ ...e, ...h !== 1 && { value: i(t.value, e.value, h) }, easing: "linear" }), c;
}
function Ar(t, e) {
  return V(t) ? jt(t, e) : Y(t) ? Kt(t, e) : t;
}
function Dr(t, e) {
  return t.filter(he).concat(
    t.filter(V).map((r) => jt(r, e)),
    t.filter(Y).map((r) => Kt(r, e))
  );
}
function Ke(t, e) {
  if (t.length <= 2) return t;
  const r = [t[0]];
  for (let n = 1; n < t.length - 1; n++) {
    const s = r[r.length - 1], a = t[n], i = t[n + 1], o = i.time - s.time;
    if (o <= 0) continue;
    const c = (a.time - s.time) / o, h = s.value + (i.value - s.value) * c;
    Math.abs(a.value - h) > e && r.push(a);
  }
  return r.push(t[t.length - 1]), r;
}
function Be(t) {
  const e = [...t.keyframes].sort((r, n) => r.time - n.time);
  return {
    ...t,
    keyframes: e
  };
}
function N(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Q(t, e, r, n) {
  const s = r ?? 0;
  return !n || e <= 1 ? s : s + Xt(t, e, n);
}
class lt {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = N(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - Q(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(e) {
    const r = this.targets.length, n = [];
    for (let s = 0; s < r; s++) {
      const a = Q(s, r, this.track.delay, this.track.stagger), i = this.valueForOffset(e - a);
      i !== void 0 && n.push({ target: this.targets[s], value: i, start: a + this.track.keyframes[0].time });
    }
    return n;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: e } = this.track;
    if (e.length === 0)
      return 0;
    const r = e[e.length - 1].time, n = this.track.stagger ? yt(this.targets.length, this.track.stagger) : 0;
    return r + (this.track.delay ?? 0) + n + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(e) {
    const { keyframes: r } = this.track;
    if (r.length === 0)
      return;
    if (r.length === 1 || e <= r[0].time)
      return r[0].value;
    if (e >= r[r.length - 1].time)
      return r[r.length - 1].value;
    const { from: n, to: s } = this.findSurroundingKeyframes(e);
    if (!n || !s)
      return;
    if (n.time === e)
      return n.value;
    const a = s.time - n.time, i = (e - n.time) / a, o = qt(s.easing)(i);
    return Ht(n.value)(n.value, s.value, o);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(e) {
    const { keyframes: r } = this.track;
    for (let n = 0; n < r.length - 1; n++)
      if (e >= r[n].time && e <= r[n + 1].time)
        return { from: r[n], to: r[n + 1] };
    return { from: null, to: null };
  }
}
class Ge {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = N(e), this.sampler = new rt(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Q(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const r = this.targets.length, n = [];
    for (let s = 0; s < r; s++) {
      const a = Q(s, r, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: this.sampler.valueAt(e - a), start: a });
    }
    return n;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? yt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class Je {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = N(e), this.duration = at(e.inertia);
  }
  getValueAtTime(e) {
    return mt(this.track.inertia, e - Q(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const r = this.targets.length, n = [];
    for (let s = 0; s < r; s++) {
      const a = Q(s, r, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: mt(this.track.inertia, e - a), start: a });
    }
    return n;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? yt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function Gt(t, e) {
  const r = { ...Ce(t.pathData, e) };
  if (t.matrix) {
    const [n, s, a, i, o, c] = t.matrix, { x: h, y: u } = r;
    r.x = n * h + a * u + o, r.y = s * h + i * u + c;
    const l = r.angle * Math.PI / 180, g = Math.cos(l), m = Math.sin(l);
    r.angle = Math.atan2(s * g + i * m, n * g + a * m) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (r.angle += t.rotateOffset), r;
}
function Rr(t, e, r, n) {
  const s = e + (r - e) * n;
  return Gt(t, s);
}
const ft = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, tr = 20;
function er(t) {
  const e = ft[t ?? "upperCase"] ?? t ?? ft.upperCase, r = Array.from(e);
  return r.length > 0 ? r : Array.from(ft.upperCase);
}
function rr(t, e, r) {
  let n = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(r + 1, 2246822507);
  return n = Math.imul(n ^ n >>> 16, 2146121005), n = Math.imul(n ^ n >>> 15, 2221713035), (n ^ n >>> 16) >>> 0;
}
function nr(t, e, r = 0) {
  const n = t.from ?? "", s = t.to, a = Math.max(0, Math.min(1, e));
  if (a <= 0) return n;
  if (a >= 1) return s;
  const i = Array.from(n), o = Array.from(s), c = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const k = Math.round(a * Math.max(i.length, o.length));
    return c ? i.slice(0, Math.max(0, i.length - k)).join("") + o.slice(Math.max(0, o.length - k)).join("") : o.slice(0, k).join("") + i.slice(k).join("");
  }
  const h = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), u = Math.max(0, (a - h) / (1 - h)), l = Math.floor(u * o.length), g = t.tweenLength === !1 ? o.length : Math.round(i.length + (o.length - i.length) * a), m = er(t.chars), _ = t.refreshRate ?? tr, f = _ > 0 ? Math.floor(r * _ / 1e3) : 0, p = t.seed ?? 1;
  let y = "";
  for (let k = 0; k < g; k++) {
    const $ = c ? k >= g - l : k < l, b = c ? o[o.length - (g - k)] : o[k];
    $ && b !== void 0 || b === " " || b === `
` ? y += b : y += m[rr(p, k, f) % m.length];
  }
  return y;
}
class sr {
  id;
  name;
  _tracks = [];
  _trackPlayers = /* @__PURE__ */ new Map();
  _motionPathTracks = /* @__PURE__ */ new Map();
  _springTracks = /* @__PURE__ */ new Map();
  _textTracks = /* @__PURE__ */ new Map();
  _config;
  _currentTime = 0;
  _playbackState = "idle";
  _direction = "forward";
  _loopIteration = 0;
  _explicitDuration;
  /** Milliseconds still to wait at a loop boundary before the next iteration */
  _repeatDelayRemaining = 0;
  /**
   * A forward loop reached its end with a repeat delay armed: the playhead
   * holds on the last frame for the delay, then returns to the start.
   */
  _wrapAfterDelay = !1;
  onUpdate = null;
  onComplete = null;
  constructor(e) {
    if (this.id = e.id, this.name = e.name, this._config = e.config ?? {}, this._explicitDuration = e.config?.duration, e.tracks)
      for (const r of e.tracks)
        this.addTrack(r);
  }
  get tracks() {
    return [...this._tracks];
  }
  get duration() {
    return this._explicitDuration !== void 0 ? this._explicitDuration : this._calculateDuration();
  }
  /**
   * Set an explicit timeline duration (ms). Pass `undefined` to fall back to the
   * duration calculated from the last keyframe across all tracks.
   */
  setDuration(e) {
    this._explicitDuration = e, e !== void 0 && (this._config = { ...this._config, duration: e });
  }
  get currentTime() {
    return this._currentTime;
  }
  get playbackState() {
    return this._playbackState;
  }
  get direction() {
    return this._direction;
  }
  get loopIteration() {
    return this._loopIteration;
  }
  get speed() {
    return this._config.speed ?? 1;
  }
  set speed(e) {
    this._config.speed = e;
  }
  /**
   * Start or resume playback.
   * If at the end and direction is forward, reset to beginning.
   * If at the beginning and direction is reverse, reset to end.
   */
  play() {
    const e = this.duration;
    this._direction === "forward" && this._currentTime >= e && e > 0 ? (this._currentTime = 0, this._loopIteration = 0) : this._direction === "reverse" && this._currentTime <= 0 && e > 0 && (this._currentTime = e, this._loopIteration = 0), this._playbackState = "playing";
  }
  /**
   * Pause playback at current position.
   */
  pause() {
    this._playbackState = "paused";
  }
  /**
   * Stop playback and reset to beginning.
   */
  stop() {
    this._playbackState = "idle", this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1, this._currentTime = 0, this._loopIteration = 0, this._direction = "forward";
  }
  /**
   * Seek to a specific time.
   */
  seek(e) {
    const r = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(e, r)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
  }
  /**
   * Toggle or set playback direction.
   */
  reverse() {
    this._direction = this._direction === "forward" ? "reverse" : "forward";
  }
  /**
   * Advance the timeline by delta milliseconds.
   * Call this from your animation loop or clock.
   */
  tick(e) {
    if (this._playbackState !== "playing")
      return;
    const r = this.duration;
    if (r <= 0)
      return;
    let n = e * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const i = Math.min(this._repeatDelayRemaining, n);
      if (this._repeatDelayRemaining -= i, n -= i, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const s = 1e3;
    for (let i = 0; i < s && n > 0 && this._playbackState === "playing"; i++)
      if (this._direction === "forward") {
        const o = r - this._currentTime;
        if (n >= o) {
          if (n -= o, this._currentTime = r, !this._handleEndReached())
            break;
        } else
          this._currentTime += n, n = 0;
      } else {
        const o = this._currentTime;
        if (n >= o) {
          if (n -= o, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= n, n = 0;
      }
    const a = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(a);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(e) {
    const r = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(e, r);
    else
      for (const [n, s] of this._trackPlayers) {
        const a = s.getTrack().property;
        for (const { target: i, value: o, start: c } of s.getTargetValues(e))
          this._write(r, n, i, a, o, e - c);
      }
    return {
      values: r,
      currentTime: this._currentTime,
      playbackState: this._playbackState,
      direction: this._direction,
      loopIteration: this._loopIteration
    };
  }
  /**
   * Several tracks drive the same target+property. Which one applies at `time`:
   *
   * 1. Of the tracks that have started (their first keyframe, plus delay and
   *    stagger, is at or before `time`), the one that started LAST.
   * 2. If none has started yet, the one that starts FIRST — so the value before
   *    anything plays is the first animation's starting value.
   * 3. Ties on start time go to the track added LAST.
   *
   * This is what makes a sequence of tweens on one property play as a sequence:
   * a later tween holds its starting value, but does not apply it until its
   * turn. `findConflicts()` reports overlaps by the same rule.
   */
  _resolveShared(e, r) {
    const n = /* @__PURE__ */ new Map();
    for (const [s, a] of this._trackPlayers) {
      const i = a.getTrack().property;
      for (const { target: o, value: c, start: h } of a.getTargetValues(e)) {
        const u = `${o}\0${i}`, l = h <= e, g = n.get(u);
        (!g || (l !== g.started ? l : l ? h >= g.start : h <= g.start)) && n.set(u, { trackId: s, target: o, property: i, value: c, start: h, started: l });
      }
    }
    for (const { trackId: s, target: a, property: i, value: o, start: c } of n.values())
      this._write(r, s, a, i, o, e - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(e, r, n, s, a, i) {
    if (a === void 0) return;
    let o = e.get(n);
    o || (o = /* @__PURE__ */ new Map(), e.set(n, o));
    const c = this._textTracks.get(r);
    if (c && typeof a == "number") {
      o.set("text", nr(c.textConfig, a, Math.max(0, i)));
      return;
    }
    const h = this._motionPathTracks.get(r);
    if (h && typeof a == "number") {
      const u = Gt(h.motionPathConfig, a);
      o.set("motionPathX", u.x), o.set("motionPathY", u.y), h.motionPathConfig.autoRotate && o.set("motionPathRotate", u.angle);
    } else
      o.set(s, a);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const e = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const r of this._tracks)
        for (const n of N(r)) {
          const s = `${n}\0${r.property}`;
          if (e.has(s)) {
            this._sharedWrites = !0;
            break t;
          }
          e.add(s);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(e) {
    if (this._tracks.push(e), this._sharedWrites = null, Y(e)) {
      this._trackPlayers.set(e.id, new Je(e));
      return;
    }
    if (V(e)) {
      this._trackPlayers.set(e.id, new Ge(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (dt(e))
      this._trackPlayers.set(e.id, new lt(e)), this._textTracks.set(e.id, e);
    else if (Et(e)) {
      const r = {
        id: e.id,
        target: e.target,
        property: e.property,
        keyframes: e.keyframes,
        delay: e.delay,
        endDelay: e.endDelay,
        targets: e.targets,
        stagger: e.stagger
      };
      this._trackPlayers.set(e.id, new lt(r)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new lt(e));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(e, r) {
    const n = this._tracks.findIndex((a) => a.id === e);
    if (n < 0) return;
    const s = this._tracks.slice(n + 1);
    this.removeTrack(e);
    for (const a of s) this.removeTrack(a.id);
    this.addTrack(r);
    for (const a of s) this.addTrack(a);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(e) {
    this._tracks = this._tracks.filter((r) => r.id !== e), this._sharedWrites = null, this._trackPlayers.delete(e), this._motionPathTracks.delete(e), this._springTracks.delete(e), this._textTracks.delete(e);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(e = {}) {
    return this._tracks.filter((r) => this._matches(r, e));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(e = {}) {
    const r = this.getTracks(e).map((n) => n.id);
    for (const n of r)
      this.removeTrack(n);
    return r;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(e) {
    const r = this._trackPlayers.get(e);
    if (!r) return;
    const n = r.getTrack(), s = n.delay ?? 0;
    if (V(n) || Y(n))
      return { from: s, to: r.getDuration() };
    const a = n.keyframes;
    if (!(!a || a.length === 0))
      return { from: a[0].time + s, to: r.getDuration() };
  }
  /**
   * Overlapping writes to the same target+property.
   *
   * Where two spans overlap, the track that starts later wins from the moment it
   * starts (ties: the one added later) — see `_resolveShared`. That is
   * predictable but silent, so an authoring tool should call this and warn,
   * because a silently discarded stretch of a track looks like a bug.
   */
  findConflicts() {
    const e = [];
    for (let r = 0; r < this._tracks.length; r++) {
      const n = this._tracks[r], s = this.getTrackSpan(n.id);
      if (s)
        for (let a = 0; a < r; a++) {
          const i = this._tracks[a];
          if (i.property !== n.property) continue;
          const o = N(i).filter((u) => N(n).includes(u));
          if (o.length === 0) continue;
          const c = this.getTrackSpan(i.id);
          if (!c || !(c.from <= s.to && s.from <= c.to)) continue;
          const h = s.from >= c.from;
          for (const u of o)
            e.push({
              target: u,
              property: n.property,
              losingTrackId: h ? i.id : n.id,
              winningTrackId: h ? n.id : i.id
            });
        }
    }
    return e;
  }
  _matches(e, r) {
    if (r.id !== void 0 && e.id !== r.id || r.property !== void 0 && e.property !== r.property || r.target !== void 0 && !N(e).includes(r.target)) return !1;
    if (r.timeRange) {
      const n = this.getTrackSpan(e.id);
      if (!n || n.to < r.timeRange.from || n.from > r.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      id: this.id,
      name: this.name,
      config: { ...this._config },
      tracks: [...this._tracks]
    };
  }
  /** Start the between-iterations pause, if the timeline configures one. */
  _armRepeatDelay() {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0;
  }
  _calculateDuration() {
    let e = 0;
    for (const [, r] of this._trackPlayers)
      e = Math.max(e, r.getDuration());
    return e;
  }
  /**
   * Handle reaching the end of the timeline.
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleEndReached() {
    const e = this._config.loop ?? 0;
    return e === -1 || this._loopIteration < e ? (this._loopIteration++, this._armRepeatDelay(), this._config.alternate ? this._direction = "reverse" : this._repeatDelayRemaining > 0 ? this._wrapAfterDelay = !0 : this._currentTime = 0, this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
  /**
   * Handle reaching the start of the timeline (in reverse).
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleStartReached() {
    const e = this._config.loop ?? 0;
    return this._config.alternate && (e === -1 || this._loopIteration < e) ? (this._loopIteration++, this._armRepeatDelay(), this._direction = "forward", this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
}
function ar(t) {
  return Y(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: Jt(t.inertia),
    ...F(t)
  } : V(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...F(t)
  } : dt(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(gt),
    ...F(t)
  } : Et(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(gt),
    ...F(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(gt),
    ...F(t)
  };
}
function Jt(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function gt(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function F(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function ir(t) {
  if (Y(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: Jt(e.inertia),
      ...F(e)
    };
  }
  if (V(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...F(e)
    };
  }
  if (dt(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((r, n) => r.time - n.time),
      ...F(e)
    };
  }
  if (t.property === "motionPath" && "motionPathConfig" in t) {
    const e = t, r = [...e.keyframes].sort((n, s) => n.time - s.time);
    return {
      id: e.id,
      target: e.target,
      property: "motionPath",
      motionPathConfig: { ...e.motionPathConfig },
      keyframes: r,
      ...F(e)
    };
  }
  return Be({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...F(t)
  });
}
function or(t) {
  return {
    id: t.id,
    name: t.name,
    config: {
      duration: t.duration > 0 ? t.duration : void 0,
      loop: t._config.loop,
      speed: t._config.speed,
      alternate: t._config.alternate,
      repeatDelay: t._config.repeatDelay
    },
    tracks: t.tracks.map(ar)
  };
}
function cr(t) {
  return new sr({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(ir)
  });
}
function Cr(t) {
  return JSON.stringify(or(t));
}
function Fr(t) {
  const e = JSON.parse(t);
  return cr(e);
}
function Lr(t) {
  let e = 2166136261;
  for (let r = 0; r < t.length; r++)
    e ^= t.charCodeAt(r), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function hr(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function te(t, e, r) {
  return e + t.next() * (r - e);
}
function ur(t, e, r, n) {
  if (n <= 0) return te(t, e, r);
  const s = Math.floor((r - e) / n), a = Math.round(t.next() * s);
  return e + a * n;
}
function Er(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const ee = /^([+\-*/])=\s*(-?[\d.]+)$/, re = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Or(t) {
  return typeof t != "string" ? !1 : ee.test(t.trim()) || re.test(t.trim());
}
function ne(t, e = {}) {
  if (typeof t != "string") return t;
  const r = t.trim(), n = ee.exec(r);
  if (n) {
    const [, a, i] = n, o = e.base ?? 0, c = Number.parseFloat(i);
    switch (a) {
      case "+":
        return o + c;
      case "-":
        return o - c;
      case "*":
        return o * c;
      case "/":
        return c === 0 ? o : o / c;
    }
  }
  const s = re.exec(r);
  if (s) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${r}" needs a random source — pass one via context.random`
      );
    const a = Number.parseFloat(s[1]), i = Number.parseFloat(s[2]), o = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return o !== void 0 ? ur(e.random, a, i, o) : te(e.random, a, i);
  }
  return t;
}
function lr(t, e = 0, r) {
  const n = [];
  let s = e;
  for (const a of t) {
    const i = ne(a, { base: s, random: r });
    n.push(i), typeof i == "number" && (s = i);
  }
  return n;
}
class Xr {
  random;
  constructor(e) {
    this.random = hr(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, r = 0) {
    return ne(e, { base: r, random: this.random });
  }
  resolveSequence(e, r = 0) {
    return lr(e, r, this.random);
  }
}
const fr = 600;
function Nr(t) {
  if (Array.isArray(t)) {
    const [g, m, _, f] = t;
    return { fn: Lt(g, m, _, f), bezier: [g, m, _, f] };
  }
  const { segments: e } = U(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const r = e[0].startX, n = e[0].startY, s = e[e.length - 1], a = s.endX - r, i = s.endY - n;
  if (a === 0 || i === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const o = (g) => (g - r) / a, c = (g) => (g - n) / i;
  if (e.length === 1 && s.type === "C") {
    const [g, m, _, f] = s.points, p = [o(g), c(m), o(_), c(f)];
    return { fn: Lt(...p), bezier: p };
  }
  const h = [], u = [], l = Math.max(8, Math.ceil(fr / e.length));
  for (const g of e)
    for (let m = h.length === 0 ? 0 : 1; m <= l; m++) {
      const [_, f] = gr(g, m / l);
      h.push(o(_)), u.push(c(f));
    }
  return { fn: mr(h, u) };
}
function Yr(t = {}) {
  const e = 0.1 + Math.max(0, Math.min(1, t.strength ?? 0.7)) * 0.7, r = [1];
  for (let s = e; s > 2e-3; s *= e) r.push(2 * Math.sqrt(s));
  const n = r.reduce((s, a) => s + a, 0);
  return (s) => {
    if (s <= 0) return 0;
    if (s >= 1) return 1;
    let a = s * n;
    for (let i = 0; i < r.length; i++) {
      if (a <= r[i]) {
        if (i === 0) return (a / r[0]) ** 2;
        const o = r[i] / 2, c = o * o, h = a - o;
        return 1 - (c - h * h);
      }
      a -= r[i];
    }
    return 1;
  };
}
function Vr(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), r = t.type ?? "easeOut", n = (s) => r === "uniform" ? 1 : r === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * e * Math.PI * 2) * n(s);
}
function gr(t, e) {
  if (t.type === "L") {
    const [h, u] = t.points;
    return [t.startX + (h - t.startX) * e, t.startY + (u - t.startY) * e];
  }
  const [r, n, s, a, i, o] = t.points, c = 1 - e;
  return [
    c * c * c * t.startX + 3 * c * c * e * r + 3 * c * e * e * s + e * e * e * i,
    c * c * c * t.startY + 3 * c * c * e * n + 3 * c * e * e * a + e * e * e * o
  ];
}
function mr(t, e) {
  return (r) => {
    if (r <= t[0]) return e[0];
    if (r >= t[t.length - 1]) return e[e.length - 1];
    let n = 0, s = t.length - 1;
    for (; s - n > 1; ) {
      const i = n + s >> 1;
      t[i] <= r ? n = i : s = i;
    }
    const a = t[s] - t[n];
    return a === 0 ? e[s] : e[n] + (r - t[n]) / a * (e[s] - e[n]);
  };
}
function Lt(t, e, r, n) {
  const s = (i, o, c) => 3 * (1 - i) * (1 - i) * i * o + 3 * (1 - i) * i * i * c + i * i * i, a = (i, o, c) => 3 * (1 - i) * (1 - i) * o + 6 * (1 - i) * i * (c - o) + 3 * i * i * (1 - c);
  return (i) => {
    if (i <= 0) return 0;
    if (i >= 1) return 1;
    let o = i;
    for (let u = 0; u < 8; u++) {
      const l = s(o, t, r) - i, g = a(o, t, r);
      if (Math.abs(l) < 1e-6) return s(o, e, n);
      if (Math.abs(g) < 1e-6) break;
      o -= l / g;
    }
    let c = 0, h = 1;
    o = i;
    for (let u = 0; u < 40; u++)
      s(o, t, r) < i ? c = o : h = o, o = (c + h) / 2;
    return s(o, e, n);
  };
}
const C = (t) => Math.round(t * 1e3) / 1e3;
function zr(t, e = {}) {
  if (t.length === 0) return "";
  const r = e.curviness ?? 1, n = e.closed ?? !1, s = t.length;
  let a = `M${C(t[0].x)} ${C(t[0].y)}`;
  if (s === 1) return a;
  const i = (c) => n ? t[(c % s + s) % s] : t[Math.max(0, Math.min(s - 1, c))], o = n ? s : s - 1;
  for (let c = 0; c < o; c++) {
    const h = i(c - 1), u = i(c), l = i(c + 1), g = i(c + 2);
    if (r === 0) {
      a += ` L${C(l.x)} ${C(l.y)}`;
      continue;
    }
    const m = r / 6, _ = u.x + (l.x - h.x) * m, f = u.y + (l.y - h.y) * m, p = l.x - (g.x - u.x) * m, y = l.y - (g.y - u.y) * m;
    a += ` C${C(_)} ${C(f)} ${C(p)} ${C(y)} ${C(l.x)} ${C(l.y)}`;
  }
  return n ? `${a} Z` : a;
}
const S = (t, e = 0) => {
  const r = parseFloat(t ?? "");
  return Number.isFinite(r) ? r : e;
};
function pr(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), r = [];
  for (let n = 0; n + 1 < e.length; n += 2) r.push({ x: e[n], y: e[n + 1] });
  return r;
}
function Wr(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const r = S(e.cx), n = S(e.cy), s = t.tag.toLowerCase() === "circle" ? S(e.r) : S(e.rx), a = t.tag.toLowerCase() === "circle" ? S(e.r) : S(e.ry);
      return `M${r + s} ${n} A${s} ${a} 0 1 1 ${r - s} ${n} A${s} ${a} 0 1 1 ${r + s} ${n} Z`;
    }
    case "rect": {
      const r = S(e.x), n = S(e.y), s = S(e.width), a = S(e.height);
      let i = e.rx != null ? S(e.rx) : e.ry != null ? S(e.ry) : 0, o = e.ry != null ? S(e.ry) : i;
      return i = Math.min(i, s / 2), o = Math.min(o, a / 2), i === 0 || o === 0 ? `M${r} ${n} H${r + s} V${n + a} H${r} Z` : `M${r + i} ${n} H${r + s - i} A${i} ${o} 0 0 1 ${r + s} ${n + o} V${n + a - o} A${i} ${o} 0 0 1 ${r + s - i} ${n + a} H${r + i} A${i} ${o} 0 0 1 ${r} ${n + a - o} V${n + o} A${i} ${o} 0 0 1 ${r + i} ${n} Z`;
    }
    case "line":
      return `M${S(e.x1)} ${S(e.y1)} L${S(e.x2)} ${S(e.y2)}`;
    case "polyline":
    case "polygon": {
      const r = pr(e.points);
      if (r.length === 0) return null;
      const n = r.map((s, a) => `${a === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${n} Z` : n;
    }
    default:
      return null;
  }
}
export {
  _r as Clock,
  Zt as DEFAULT_BAKE_INTERVAL_MS,
  Tt as DEFAULT_INERTIA_FRICTION,
  R as DEFAULT_SPRING,
  me as INERTIA_MAX_DURATION_MS,
  Je as InertiaTrackPlayer,
  wr as MORPH_SAMPLES,
  yr as ManualClock,
  Nt as SPRING_MAX_DURATION_MS,
  kr as SPRING_PRESETS,
  K as SPRING_STEP_MS,
  rt as SpringSampler,
  Ge as SpringTrackPlayer,
  sr as Timeline,
  lt as TrackPlayer,
  Xr as ValueResolver,
  Ir as bakeEasing,
  Kt as bakeInertiaTrack,
  jt as bakeSpringTrack,
  er as charactersFor,
  Pr as clearMorphCache,
  Sr as clearPathCache,
  xe as createCubicBezier,
  hr as createRandom,
  Be as createTrack,
  vr as criticalDamping,
  Yr as customBounce,
  Nr as customEase,
  Vr as customWiggle,
  cr as deserializeTimeline,
  ir as deserializeTrack,
  Me as easeIn,
  Vt as easeInCubic,
  be as easeInOut,
  Wt as easeInOutCubic,
  ke as easeInOutQuad,
  ye as easeInQuad,
  Te as easeOut,
  zt as easeOutCubic,
  _e as easeOutQuad,
  Fr as fromJSON,
  qt as getEasingFunction,
  Ht as getInterpolator,
  Gt as getMotionPathPoint,
  $r as getPathLength,
  Ce as getPointAtProgress,
  he as hasKeyframes,
  Lr as hashSeed,
  at as inertiaDuration,
  st as inertiaRest,
  mt as inertiaValueAt,
  xr as inertiaVelocityAt,
  Ze as interpolateArray,
  He as interpolateColor,
  Rr as interpolateMotionPath,
  E as interpolateNumber,
  je as interpolatePathString,
  Ft as interpolateString,
  ce as isCubicBezierEasing,
  Y as isInertiaTrack,
  dr as isMotionPathPoint,
  Et as isMotionPathTrack,
  qe as isPathData,
  V as isSpringTrack,
  dt as isTextTrack,
  br as isUnderdamped,
  Or as isUnresolved,
  Yt as linear,
  ue as maxStaggerDistance,
  We as morphPath,
  pe as naturalRest,
  U as parsePath,
  Ut as pointAtDistance,
  zr as pointsToPath,
  te as randomBetween,
  Er as randomChoice,
  ur as randomSnapped,
  lr as resolveSequence,
  ne as resolveValue,
  or as serializeTimeline,
  ar as serializeTrack,
  Wr as shapeToPathData,
  Ke as simplifyKeyframes,
  Tr as springDuration,
  Mr as springValueAt,
  Ot as staggerDistance,
  Xt as staggerOffset,
  le as staggerOffsets,
  yt as staggerSpan,
  nr as textAt,
  Cr as toJSON,
  Ar as toKeyframedTrack,
  Dr as toKeyframedTracks,
  N as trackTargets
};
