function ce(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function mt(t) {
  return t.property === "text" && "textConfig" in t;
}
function Y(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function H(t) {
  return t.kind === "spring" && "spring" in t;
}
function Ft(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function yn(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function le(t) {
  return "keyframes" in t;
}
class _n {
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
class Mn {
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
        const s = (e - this._lastFrameTime) * this._speed;
        this._currentTime += s, this.onTick?.(s, this._currentTime);
      }
      this._lastFrameTime = e, this._scheduleFrame();
    }
  }
}
function Xt(t, e, n = "start") {
  if (e <= 1) return 0;
  if (typeof n == "number") {
    const s = Math.max(0, Math.min(e - 1, n));
    return Math.abs(t - s);
  }
  switch (n) {
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
function he(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Xt(s, t, e));
  return n;
}
function Nt(t, e, n) {
  const s = n.from ?? "start", r = Xt(t, e, s);
  if (n.amount !== void 0) {
    const i = he(e, s);
    return i === 0 ? 0 : n.amount * r / i;
  }
  return n.each !== void 0 ? n.each * r : 0;
}
function ue(t, e) {
  return Array.from({ length: t }, (n, s) => Nt(s, t, e));
}
function yt(t, e) {
  return t <= 1 ? 0 : Math.max(...ue(t, e));
}
const B = 1, Ot = 6e4, tt = Ot / B, D = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Tn = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class nt {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? D.stiffness, this.damping = e.damping ?? D.damping, this.mass = e.mass ?? D.mass, this.restDelta = e.restDelta ?? D.restDelta, this.restSpeed = e.restSpeed ?? D.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? D.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / B);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], r = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / B - n;
    return s + (r - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(tt + 1), this.settledStep !== null ? this.settledStep * B : Ot;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, tt + 1), s = B / 1e3;
    for (; this.samples.length < n; ) {
      const r = this.samples[this.samples.length - 1], i = r - this.to, a = -this.stiffness * i, o = -this.damping * this.velocity, c = (a + o) / this.mass;
      this.velocity += c * s;
      const l = r + this.velocity * s;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > tt && (this.settledStep = tt);
  }
}
function bn(t, e) {
  return new nt(t).valueAt(e);
}
function xn(t) {
  return new nt(t).settleTime();
}
function kn(t) {
  const e = t.stiffness ?? D.stiffness, n = t.damping ?? D.damping, s = t.mass ?? D.mass;
  return n < 2 * Math.sqrt(e * s);
}
function vn(t) {
  const e = t.stiffness ?? D.stiffness, n = t.mass ?? D.mass;
  return 2 * Math.sqrt(e * n);
}
const bt = 4, fe = 2e-3, pe = 1e-4, de = 6e4;
function st(t) {
  const e = t.friction ?? bt;
  return e > 0 ? e : bt;
}
function ge(t) {
  return t.from + t.velocity / st(t);
}
function me(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function rt(t) {
  let e = me(ge(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function it(t) {
  const e = Math.abs(rt(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(pe, e * fe);
  if (n >= e) return 0;
  const s = Math.log(e / n) / st(t);
  return Math.min(de, s * 1e3);
}
function dt(t, e) {
  if (e <= 0) return t.from;
  const n = rt(t);
  if (e >= it(t)) return n;
  const s = st(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function Sn(t, e) {
  const n = st(t), s = rt(t);
  return e >= it(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Yt = (t) => t, ye = (t) => t * t, _e = (t) => 1 - (1 - t) * (1 - t), Me = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, Ht = (t) => t * t * t, Vt = (t) => 1 - Math.pow(1 - t, 3), zt = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Te = Ht, be = Vt, xe = zt, ke = {
  linear: Yt,
  "ease-in": Te,
  "ease-out": be,
  "ease-in-out": xe,
  "ease-in-quad": ye,
  "ease-out-quad": _e,
  "ease-in-out-quad": Me,
  "ease-in-cubic": Ht,
  "ease-out-cubic": Vt,
  "ease-in-out-cubic": zt
};
function ve(t) {
  const [e, n, s, r] = t, i = 3 * e, a = 3 * (s - e) - i, o = 1 - i - a, c = 3 * n, l = 3 * (r - n) - c, u = 1 - c - l, h = (f) => ((o * f + a) * f + i) * f, p = (f) => ((u * f + l) * f + c) * f, d = (f) => (3 * o * f + 2 * a) * f + i, _ = (f) => {
    let g = f;
    for (let S = 0; S < 8; S++) {
      const b = h(g) - f;
      if (Math.abs(b) < 1e-7)
        return g;
      const m = d(g);
      if (Math.abs(m) < 1e-7)
        break;
      g -= b / m;
    }
    let y = 0, M = 1;
    for (g = f; y < M; ) {
      const S = h(g);
      if (Math.abs(S - f) < 1e-7)
        return g;
      f > S ? y = g : M = g, g = (y + M) / 2;
    }
    return g;
  };
  return (f) => {
    if (f <= 0) return 0;
    if (f >= 1) return 1;
    const g = _(f);
    return p(g);
  };
}
function Ut(t) {
  return t === void 0 ? Yt : ce(t) ? ve(t.points) : ke[t];
}
const xt = 32, Se = 256, z = /* @__PURE__ */ new Map(), Ae = /[MmLlHhVvCcSsQqTtAaZz]/, Pe = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, we = {
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
function $e(t) {
  const e = [];
  let n = 0, s = null;
  const r = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (r(), !(n >= t.length)); ) {
    const i = t[n];
    if (Ae.test(i)) {
      s = { type: i, args: [] }, e.push(s), n++;
      continue;
    }
    if (!s) break;
    const a = s.type === "A" || s.type === "a", o = s.args.length % 7;
    if (a && (o === 3 || o === 4)) {
      if (i !== "0" && i !== "1") break;
      s.args.push(i === "1" ? 1 : 0), n++;
      continue;
    }
    const c = Pe.exec(t.slice(n));
    if (!c) break;
    s.args.push(parseFloat(c[0])), n += c[0].length;
  }
  return e;
}
function Re(t, e, n, s, r, i, a, o, c) {
  if (t === o && e === c) return [];
  let l = Math.abs(n), u = Math.abs(s);
  if (l === 0 || u === 0) return [[t, e, o, c, o, c]];
  const h = r * Math.PI / 180, p = Math.cos(h), d = Math.sin(h), _ = (t - o) / 2, f = (e - c) / 2, g = p * _ + d * f, y = -d * _ + p * f, M = g * g / (l * l) + y * y / (u * u);
  if (M > 1) {
    const v = Math.sqrt(M);
    l *= v, u *= v;
  }
  const S = i === a ? -1 : 1, b = l * l * u * u - l * l * y * y - u * u * g * g, m = l * l * y * y + u * u * g * g, x = S * Math.sqrt(Math.max(0, b / m)), T = x * l * y / u, L = -x * u * g / l, G = p * T - d * L + (t + o) / 2, k = d * T + p * L + (e + c) / 2, R = (v, $, C, V) => {
    const ot = v * C + $ * V, J = Math.sqrt((v * v + $ * $) * (C * C + V * V)), Q = Math.acos(Math.max(-1, Math.min(1, ot / J)));
    return v * V - $ * C < 0 ? -Q : Q;
  }, P = R(1, 0, (g - T) / l, (y - L) / u);
  let w = R((g - T) / l, (y - L) / u, (-g - T) / l, (-y - L) / u);
  !a && w > 0 && (w -= 2 * Math.PI), a && w < 0 && (w += 2 * Math.PI);
  const N = Math.max(1, Math.ceil(Math.abs(w) / (Math.PI / 2))), at = w / N, Z = 4 / 3 * Math.tan(at / 4), _t = (v) => {
    const $ = l * Math.cos(v), C = u * Math.sin(v);
    return [p * $ - d * C + G, d * $ + p * C + k];
  }, Mt = (v) => {
    const $ = -l * Math.sin(v), C = u * Math.cos(v);
    return [p * $ - d * C, d * $ + p * C];
  }, Tt = [];
  for (let v = 0; v < N; v++) {
    const $ = P + v * at, C = $ + at, [V, ot] = _t($), [J, Q] = v === N - 1 ? [o, c] : _t(C), [re, ie] = Mt($), [ae, oe] = Mt(C);
    Tt.push([V + Z * re, ot + Z * ie, J - Z * ae, Q - Z * oe, J, Q]);
  }
  return Tt;
}
function X(t, e, n, s, r) {
  const i = 1 - r;
  return i * i * i * t + 3 * i * i * r * e + 3 * i * r * r * n + r * r * r * s;
}
function kt(t, e, n, s, r) {
  const i = 1 - r;
  return 3 * i * i * (e - t) + 6 * i * r * (n - e) + 3 * r * r * (s - n);
}
function K(t, e, n, s) {
  return {
    subpath: 0,
    type: "L",
    points: [n, s],
    startX: t,
    startY: e,
    endX: n,
    endY: s,
    length: Math.hypot(n - t, s - e)
  };
}
function et(t, e, n) {
  const [s, r, i, a, o, c] = n, l = [0];
  let u = t, h = e, p = 0;
  for (let d = 1; d <= xt; d++) {
    const _ = d / xt, f = X(t, s, i, o, _), g = X(e, r, a, c, _);
    p += Math.hypot(f - u, g - h), l.push(p), u = f, h = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, r, i, a, o, c],
    startX: t,
    startY: e,
    endX: o,
    endY: c,
    length: p,
    lengths: l
  };
}
function q(t) {
  const e = z.get(t);
  if (e) return e;
  const n = [];
  let s = 0, r = 0, i = 0, a = 0, o = null, c = null, l = -1;
  const u = /* @__PURE__ */ new Set(), h = (f) => {
    l < 0 && (l = 0), f.subpath = l, n.push(f);
  };
  for (const { type: f, args: g } of $e(t)) {
    const y = f.toUpperCase(), M = f !== y, S = we[y];
    if (y === "Z") {
      (s !== i || r !== a) && h(K(s, r, i, a)), l >= 0 && u.add(l), s = i, r = a, o = c = null;
      continue;
    }
    for (let b = 0; b + S <= g.length; b += S) {
      const m = g.slice(b, b + S), x = M ? s : 0, T = M ? r : 0;
      let L = null, G = null;
      switch (y) {
        case "M":
          b === 0 ? (s = m[0] + x, r = m[1] + T, i = s, a = r, (l < 0 || n[n.length - 1]?.subpath === l) && l++) : (h(K(s, r, m[0] + x, m[1] + T)), s = m[0] + x, r = m[1] + T);
          break;
        case "L":
          h(K(s, r, m[0] + x, m[1] + T)), s = m[0] + x, r = m[1] + T;
          break;
        case "H":
          h(K(s, r, m[0] + x, r)), s = m[0] + x;
          break;
        case "V":
          h(K(s, r, s, m[0] + T)), r = m[0] + T;
          break;
        case "C": {
          const k = [m[0] + x, m[1] + T, m[2] + x, m[3] + T, m[4] + x, m[5] + T];
          h(et(s, r, k)), L = [k[2], k[3]], s = k[4], r = k[5];
          break;
        }
        case "S": {
          const [k, R] = o ? [2 * s - o[0], 2 * r - o[1]] : [s, r], P = [k, R, m[0] + x, m[1] + T, m[2] + x, m[3] + T];
          h(et(s, r, P)), L = [P[2], P[3]], s = P[4], r = P[5];
          break;
        }
        case "Q":
        case "T": {
          let k = s, R = r;
          y === "Q" ? (k = m[0] + x, R = m[1] + T) : c && (k = 2 * s - c[0], R = 2 * r - c[1]);
          const P = y === "Q" ? m[2] + x : m[0] + x, w = y === "Q" ? m[3] + T : m[1] + T;
          h(
            et(s, r, [
              s + 2 / 3 * (k - s),
              r + 2 / 3 * (R - r),
              P + 2 / 3 * (k - P),
              w + 2 / 3 * (R - w),
              P,
              w
            ])
          ), G = [k, R], s = P, r = w;
          break;
        }
        case "A": {
          const k = m[5] + x, R = m[6] + T;
          let P = s, w = r;
          for (const N of Re(s, r, m[0], m[1], m[2], m[3], m[4], k, R))
            h(et(P, w, N)), P = N[4], w = N[5];
          s = k, r = R;
          break;
        }
      }
      o = L, c = G;
    }
  }
  const p = n.reduce((f, g) => f + g.length, 0), d = [];
  for (let f = 0; f < n.length; ) {
    const g = n[f].subpath;
    let y = f, M = 0;
    for (; y < n.length && n[y].subpath === g; ) M += n[y++].length;
    const S = n[f], b = n[y - 1], m = u.has(g) || Math.abs(b.endX - S.startX) < 1e-9 && Math.abs(b.endY - S.startY) < 1e-9;
    d.push({ start: f, end: y, length: M, closed: m }), f = y;
  }
  const _ = { segments: n, totalLength: p, subpaths: d };
  return z.size >= Se && z.delete(z.keys().next().value), z.set(t, _), _;
}
function Ce(t, e) {
  const n = t.lengths;
  if (e <= 0) return 0;
  if (e >= t.length) return 1;
  let s = 0, r = n.length - 1;
  for (; s < r - 1; ) {
    const o = s + r >> 1;
    n[o] < e ? s = o : r = o;
  }
  const i = n[r] - n[s], a = i > 0 ? (e - n[s]) / i : 0;
  return (s + a) / (n.length - 1);
}
function De(t, e) {
  if (t.type === "L") {
    const h = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * h,
      y: t.startY + (t.endY - t.startY) * h,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, r, i, a, o] = t.points, c = Ce(t, e);
  let l = kt(t.startX, n, r, a, c), u = kt(t.startY, s, i, o, c);
  if (Math.hypot(l, u) < 1e-9) {
    const h = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), p = X(t.startX, n, r, a, h), d = X(t.startY, s, i, o, h), _ = X(t.startX, n, r, a, c), f = X(t.startY, s, i, o, c);
    l = c < 0.5 ? p - _ : _ - p, u = c < 0.5 ? d - f : f - d;
  }
  return {
    x: X(t.startX, n, r, a, c),
    y: X(t.startY, s, i, o, c),
    angle: Math.atan2(u, l) * 180 / Math.PI
  };
}
function qt(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let r = 0;
  for (let i = n; i < s; i++) {
    const a = t[i];
    if (r + a.length >= e || i === s - 1)
      return De(a, e - r);
    r += a.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Ie(t, e) {
  const { segments: n, totalLength: s } = q(t);
  return qt(n, Math.max(0, Math.min(1, e)) * s);
}
function An() {
  z.clear();
}
function Pn(t) {
  return q(t).totalLength;
}
const Ee = 24, Le = 320, Fe = 2.5, j = 72, wn = 64, Xe = 128, U = /* @__PURE__ */ new Map(), vt = (t) => Math.round(t * 100) / 100;
function St(t, e) {
  const { segments: n, subpaths: s, totalLength: r } = q(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((a) => a.closed);
    return [{ segments: n, start: 0, end: n.length, length: r, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function gt(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = qt(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function At(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function Pt(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(gt(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function wt(t) {
  let e = 0, n = 0;
  for (const [s, r] of t)
    e += s, n += r;
  return e /= t.length, n /= t.length, t.map(([s, r]) => [s - e, r - n]);
}
function Ne(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % j / j : 0, reversed: n < 0 };
  const r = wt(Pt(t, j)), i = wt(Pt(e, j)), a = j;
  let o = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const u = s ? a : 1;
    for (let h = 0; h < u; h++) {
      let p = 0;
      for (let d = 0; d < a && p < c; d++) {
        const _ = s ? l ? (h - d + a) % a : (d + h) % a : l ? a - 1 - d : d, f = r[d][0] - i[_][0], g = r[d][1] - i[_][1];
        p += f * f + g * g;
      }
      p < c && (c = p, o = { offset: s ? h / a : 0, reversed: l });
    }
  }
  return o;
}
function Oe(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Ye(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function He(t, e, n) {
  const s = t.closed && e.closed, r = Ne(t, e, n.shapeIndex), i = Math.max(
    Ee,
    Math.min(Le, Math.ceil(Math.max(t.length, e.length) / Fe))
  ), a = /* @__PURE__ */ new Set(), o = (h) => a.add(Math.round(h * 1e7) / 1e7);
  for (let h = 0; h <= i; h++) o(h / i);
  for (const h of At(t)) o(h);
  for (const h of At(e)) o(Ye(h, r, s));
  let c = [...a].sort((h, p) => h - p);
  s && (c = c.filter((h) => h < 1));
  const l = [], u = [];
  for (const h of c)
    l.push(...gt(t, h)), u.push(...gt(e, Oe(h, r, s)));
  return { from: l, to: u, closed: s };
}
function Ve(t, e, n) {
  const s = `${n.shapeIndex ?? "auto"}|${t}|${e}`, r = U.get(s);
  if (r) return r;
  const i = q(t).subpaths.filter((l) => l.length > 0).length === q(e).subpaths.filter((l) => l.length > 0).length, a = St(t, !i), o = St(e, !i), c = {
    pairs: a.map((l, u) => He(l, o[u], n))
  };
  return U.size >= Xe && U.delete(U.keys().next().value), U.set(s, c), c;
}
function ze(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const r = Math.max(0, Math.min(1, n));
  if (r === 0) return t;
  if (r === 1) return e;
  const i = Ve(t, e, s);
  if (i.pairs.length === 0) return r < 0.5 ? t : e;
  let a = "";
  for (const o of i.pairs) {
    for (let c = 0; c < o.from.length; c += 2) {
      const l = vt(o.from[c] + (o.to[c] - o.from[c]) * r), u = vt(o.from[c + 1] + (o.to[c + 1] - o.from[c + 1]) * r);
      a += `${c === 0 ? a ? " M" : "M" : " L"}${l} ${u}`;
    }
    o.closed && (a += " Z");
  }
  return a;
}
function $n() {
  U.clear();
}
function Ue(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const F = (t, e, n) => t + (e - t) * n, Wt = 512, ct = /* @__PURE__ */ new Map(), lt = /* @__PURE__ */ new Map();
function $t(t) {
  const e = ct.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return ct.size < Wt && ct.set(t, s), s;
}
const Rt = (t) => t.charCodeAt(0) === 35, Ct = (t) => t.startsWith("rgb"), Dt = (t) => t.startsWith("rgba"), qe = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ht = (t) => Math.round(t).toString(16).padStart(2, "0");
function We(t, e, n) {
  return `#${ht(t)}${ht(e)}${ht(n)}`;
}
function It(t) {
  const e = lt.get(t);
  if (e) return e;
  const n = t.match(qe);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), r = parseInt(n[2], 10), i = parseInt(n[3], 10), a = n[4] !== void 0 ? [s, r, i, parseFloat(n[4])] : [s, r, i];
  return lt.size < Wt && lt.set(t, a), a;
}
const Qe = (t, e, n) => {
  if (Rt(t) && Rt(e)) {
    const [s, r, i] = $t(t), [a, o, c] = $t(e), l = F(s, a, n), u = F(r, o, n), h = F(i, c, n);
    return We(l, u, h);
  }
  if ((Ct(t) || Dt(t)) && (Ct(e) || Dt(e))) {
    const s = It(t), r = It(e), i = Math.round(F(s[0], r[0], n)), a = Math.round(F(s[1], r[1], n)), o = Math.round(F(s[2], r[2], n));
    if (s.length === 4 || r.length === 4) {
      const c = s[3] ?? 1, l = r[3] ?? 1, u = F(c, l, n);
      return `rgba(${i}, ${a}, ${o}, ${u})`;
    }
    return `rgb(${i}, ${a}, ${o})`;
  }
  return n < 1 ? t : e;
}, Ke = (t, e, n) => {
  const s = Math.min(t.length, e.length), r = [];
  for (let i = 0; i < s; i++)
    r.push(F(t[i], e[i], n));
  return r;
}, Et = (t, e, n) => n < 1 ? t : e, je = (t, e, n) => ze(t, e, n);
function Qt(t) {
  return typeof t == "number" ? F : Array.isArray(t) ? Ke : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? Qe : Ue(t) ? je : Et : Et;
}
const Kt = 1e3 / 60;
function jt(t, e = {}) {
  if (!H(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new nt(t.spring);
  return Gt(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function Bt(t, e = {}) {
  if (!Y(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return Gt(
    t,
    (s) => dt(n, s),
    it(n),
    n.from,
    rt(n),
    e
  );
}
function Gt(t, e, n, s, r, i) {
  const a = i.intervalMs ?? Kt, o = i.tolerance ?? 0.01, c = t.delay ?? 0, l = [];
  for (let h = 0; h <= n; h += a)
    l.push({ time: h + c, value: e(h), easing: "linear" });
  const u = l[l.length - 1];
  return !u || u.time < n + c ? l.push({ time: n + c, value: r, easing: "linear" }) : u.value = r, c > 0 && l.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: o > 0 ? Be(l, o) : l,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Rn(t, e, n, s = {}) {
  const r = s.intervalMs ?? Kt, i = typeof n == "function" ? n : Ut(n), a = Qt(t.value), o = e.time - t.time;
  if (o <= 0) return [e];
  const c = [];
  for (let u = r; u < o; u += r) {
    const h = u / o;
    c.push({
      time: t.time + u,
      value: a(t.value, e.value, i(h)),
      easing: "linear"
    });
  }
  const l = i(1);
  return c.push({ ...e, ...l !== 1 && { value: a(t.value, e.value, l) }, easing: "linear" }), c;
}
function Cn(t, e) {
  return H(t) ? jt(t, e) : Y(t) ? Bt(t, e) : t;
}
function Dn(t, e) {
  return t.filter(le).concat(
    t.filter(H).map((n) => jt(n, e)),
    t.filter(Y).map((n) => Bt(n, e))
  );
}
function Be(t, e) {
  if (t.length <= 2) return t;
  const n = [t[0]];
  for (let s = 1; s < t.length - 1; s++) {
    const r = n[n.length - 1], i = t[s], a = t[s + 1], o = a.time - r.time;
    if (o <= 0) continue;
    const c = (i.time - r.time) / o, l = r.value + (a.value - r.value) * c;
    Math.abs(i.value - l) > e && n.push(i);
  }
  return n.push(t[t.length - 1]), n;
}
function Ge(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function O(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function W(t, e, n, s) {
  const r = n ?? 0;
  return !s || e <= 1 ? r : r + Nt(t, e, s);
}
class ut {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = O(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - W(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let r = 0; r < n; r++) {
      const i = W(r, n, this.track.delay, this.track.stagger), a = this.valueForOffset(e - i);
      a !== void 0 && s.push({ target: this.targets[r], value: a, start: i + this.track.keyframes[0].time });
    }
    return s;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: e } = this.track;
    if (e.length === 0)
      return 0;
    const n = e[e.length - 1].time, s = this.track.stagger ? yt(this.targets.length, this.track.stagger) : 0;
    return n + (this.track.delay ?? 0) + s + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(e) {
    const { keyframes: n } = this.track;
    if (n.length === 0)
      return;
    if (n.length === 1 || e <= n[0].time)
      return n[0].value;
    if (e >= n[n.length - 1].time)
      return n[n.length - 1].value;
    const { from: s, to: r } = this.findSurroundingKeyframes(e);
    if (!s || !r)
      return;
    if (s.time === e)
      return s.value;
    const i = r.time - s.time, a = (e - s.time) / i, c = Ut(r.easing)(a);
    return Qt(s.value)(s.value, r.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(e) {
    const { keyframes: n } = this.track;
    for (let s = 0; s < n.length - 1; s++)
      if (e >= n[s].time && e <= n[s + 1].time)
        return { from: n[s], to: n[s + 1] };
    return { from: null, to: null };
  }
}
class Ze {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = O(e), this.sampler = new nt(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - W(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let r = 0; r < n; r++) {
      const i = W(r, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[r], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
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
    this.track = e, this.targets = O(e), this.duration = it(e.inertia);
  }
  getValueAtTime(e) {
    return dt(this.track.inertia, e - W(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let r = 0; r < n; r++) {
      const i = W(r, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[r], value: dt(this.track.inertia, e - i), start: i });
    }
    return s;
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
function Zt(t, e) {
  const n = { ...Ie(t.pathData, e) };
  if (t.matrix) {
    const [s, r, i, a, o, c] = t.matrix, { x: l, y: u } = n;
    n.x = s * l + i * u + o, n.y = r * l + a * u + c;
    const h = n.angle * Math.PI / 180, p = Math.cos(h), d = Math.sin(h);
    n.angle = Math.atan2(r * p + a * d, s * p + i * d) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function In(t, e, n, s) {
  const r = e + (n - e) * s;
  return Zt(t, r);
}
const ft = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, tn = 20;
function en(t) {
  const e = ft[t ?? "upperCase"] ?? t ?? ft.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(ft.upperCase);
}
function nn(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function sn(t, e, n = 0) {
  const s = t.from ?? "", r = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return r;
  const a = Array.from(s), o = Array.from(r), c = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const M = Math.round(i * Math.max(a.length, o.length));
    return c ? a.slice(0, Math.max(0, a.length - M)).join("") + o.slice(Math.max(0, o.length - M)).join("") : o.slice(0, M).join("") + a.slice(M).join("");
  }
  const l = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), u = Math.max(0, (i - l) / (1 - l)), h = Math.floor(u * o.length), p = t.tweenLength === !1 ? o.length : Math.round(a.length + (o.length - a.length) * i), d = en(t.chars), _ = t.refreshRate ?? tn, f = _ > 0 ? Math.floor(n * _ / 1e3) : 0, g = t.seed ?? 1;
  let y = "";
  for (let M = 0; M < p; M++) {
    const S = c ? M >= p - h : M < h, b = c ? o[o.length - (p - M)] : o[M];
    S && b !== void 0 || b === " " || b === `
` ? y += b : y += d[nn(g, M, f) % d.length];
  }
  return y;
}
class rn {
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
      for (const n of e.tracks)
        this.addTrack(n);
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
    const n = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(e, n)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
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
    const n = this.duration;
    if (n <= 0)
      return;
    let r = e * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const o = Math.min(this._repeatDelayRemaining, r);
      if (this._repeatDelayRemaining -= o, r -= o, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const i = 1e3;
    for (let o = 0; o < i && r > 0 && this._playbackState === "playing"; o++)
      if (this._direction === "forward") {
        const c = n - this._currentTime;
        if (r >= c) {
          if (r -= c, this._currentTime = n, !this._handleEndReached())
            break;
        } else
          this._currentTime += r, r = 0;
      } else {
        const c = this._currentTime;
        if (r >= c) {
          if (r -= c, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= r, r = 0;
      }
    const a = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(a);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(e) {
    const n = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(e, n);
    else
      for (const [s, r] of this._trackPlayers) {
        const i = r.getTrack().property;
        for (const { target: a, value: o, start: c } of r.getTargetValues(e))
          this._write(n, s, a, i, o, e - c);
      }
    return {
      values: n,
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
  _resolveShared(e, n) {
    const s = /* @__PURE__ */ new Map();
    for (const [r, i] of this._trackPlayers) {
      const a = i.getTrack().property;
      for (const { target: o, value: c, start: l } of i.getTargetValues(e)) {
        const u = `${o}\0${a}`, h = l <= e, p = s.get(u);
        (!p || (h !== p.started ? h : h ? l >= p.start : l <= p.start)) && s.set(u, { trackId: r, target: o, property: a, value: c, start: l, started: h });
      }
    }
    for (const { trackId: r, target: i, property: a, value: o, start: c } of s.values())
      this._write(n, r, i, a, o, e - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(e, n, s, r, i, a) {
    if (i === void 0) return;
    let o = e.get(s);
    o || (o = /* @__PURE__ */ new Map(), e.set(s, o));
    const c = this._textTracks.get(n);
    if (c && typeof i == "number") {
      o.set("text", sn(c.textConfig, i, Math.max(0, a)));
      return;
    }
    const l = this._motionPathTracks.get(n);
    if (l && typeof i == "number") {
      const u = Zt(l.motionPathConfig, i);
      o.set("motionPathX", u.x), o.set("motionPathY", u.y), l.motionPathConfig.autoRotate && o.set("motionPathRotate", u.angle);
    } else
      o.set(r, i);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const e = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const s of O(n)) {
          const r = `${s}\0${n.property}`;
          if (e.has(r)) {
            this._sharedWrites = !0;
            break t;
          }
          e.add(r);
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
    if (H(e)) {
      this._trackPlayers.set(e.id, new Ze(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (mt(e))
      this._trackPlayers.set(e.id, new ut(e)), this._textTracks.set(e.id, e);
    else if (Ft(e)) {
      const n = {
        id: e.id,
        target: e.target,
        property: e.property,
        keyframes: e.keyframes,
        delay: e.delay,
        endDelay: e.endDelay,
        targets: e.targets,
        stagger: e.stagger
      };
      this._trackPlayers.set(e.id, new ut(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new ut(e));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(e, n) {
    const s = this._tracks.findIndex((i) => i.id === e);
    if (s < 0) return;
    const r = this._tracks.slice(s + 1);
    this.removeTrack(e);
    for (const i of r) this.removeTrack(i.id);
    this.addTrack(n);
    for (const i of r) this.addTrack(i);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(e) {
    this._tracks = this._tracks.filter((n) => n.id !== e), this._sharedWrites = null, this._trackPlayers.delete(e), this._motionPathTracks.delete(e), this._springTracks.delete(e), this._textTracks.delete(e);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(e = {}) {
    return this._tracks.filter((n) => this._matches(n, e));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(e = {}) {
    const n = this.getTracks(e).map((s) => s.id);
    for (const s of n)
      this.removeTrack(s);
    return n;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(e) {
    const n = this._trackPlayers.get(e);
    if (!n) return;
    const s = n.getTrack(), r = s.delay ?? 0;
    if (H(s) || Y(s))
      return { from: r, to: n.getDuration() };
    const i = s.keyframes;
    if (!(!i || i.length === 0))
      return { from: i[0].time + r, to: n.getDuration() };
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
    for (let n = 0; n < this._tracks.length; n++) {
      const s = this._tracks[n], r = this.getTrackSpan(s.id);
      if (r)
        for (let i = 0; i < n; i++) {
          const a = this._tracks[i];
          if (a.property !== s.property) continue;
          const o = O(a).filter((h) => O(s).includes(h));
          if (o.length === 0) continue;
          const c = this.getTrackSpan(a.id);
          if (!c || !(c.from <= r.to && r.from <= c.to)) continue;
          const u = r.from >= c.from;
          for (const h of o)
            e.push({
              target: h,
              property: s.property,
              losingTrackId: u ? a.id : s.id,
              winningTrackId: u ? s.id : a.id
            });
        }
    }
    return e;
  }
  _matches(e, n) {
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !O(e).includes(n.target)) return !1;
    if (n.timeRange) {
      const s = this.getTrackSpan(e.id);
      if (!s || s.to < n.timeRange.from || s.from > n.timeRange.to) return !1;
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
    for (const [, n] of this._trackPlayers)
      e = Math.max(e, n.getDuration());
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
function an(t) {
  return Y(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: Jt(t.inertia),
    ...E(t)
  } : H(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...E(t)
  } : mt(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(pt),
    ...E(t)
  } : Ft(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(pt),
    ...E(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(pt),
    ...E(t)
  };
}
function Jt(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function pt(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function E(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function on(t) {
  if (Y(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: Jt(e.inertia),
      ...E(e)
    };
  }
  if (H(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...E(e)
    };
  }
  if (mt(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...E(e)
    };
  }
  if (t.property === "motionPath" && "motionPathConfig" in t) {
    const e = t, n = [...e.keyframes].sort((s, r) => s.time - r.time);
    return {
      id: e.id,
      target: e.target,
      property: "motionPath",
      motionPathConfig: { ...e.motionPathConfig },
      keyframes: n,
      ...E(e)
    };
  }
  return Ge({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...E(t)
  });
}
function cn(t) {
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
    tracks: t.tracks.map(an)
  };
}
function ln(t) {
  return new rn({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(on)
  });
}
function En(t) {
  return JSON.stringify(cn(t));
}
function Ln(t) {
  const e = JSON.parse(t);
  return ln(e);
}
function Fn(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function hn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function te(t, e, n) {
  return e + t.next() * (n - e);
}
function un(t, e, n, s) {
  if (s <= 0) return te(t, e, n);
  const r = Math.floor((n - e) / s), i = Math.round(t.next() * r);
  return e + i * s;
}
function Xn(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const ee = /^([+\-*/])=\s*(-?[\d.]+)$/, ne = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Nn(t) {
  return typeof t != "string" ? !1 : ee.test(t.trim()) || ne.test(t.trim());
}
function se(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = ee.exec(n);
  if (s) {
    const [, i, a] = s, o = e.base ?? 0, c = Number.parseFloat(a);
    switch (i) {
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
  const r = ne.exec(n);
  if (r) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(r[1]), a = Number.parseFloat(r[2]), o = r[3] !== void 0 ? Number.parseFloat(r[3]) : void 0;
    return o !== void 0 ? un(e.random, i, a, o) : te(e.random, i, a);
  }
  return t;
}
function fn(t, e = 0, n) {
  const s = [];
  let r = e;
  for (const i of t) {
    const a = se(i, { base: r, random: n });
    s.push(a), typeof a == "number" && (r = a);
  }
  return s;
}
class On {
  random;
  constructor(e) {
    this.random = hn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return se(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return fn(e, n, this.random);
  }
}
const pn = 600;
function Yn(t) {
  if (Array.isArray(t)) {
    const [p, d, _, f] = t;
    return { fn: Lt(p, d, _, f), bezier: [p, d, _, f] };
  }
  const { segments: e } = q(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, r = e[e.length - 1], i = r.endX - n, a = r.endY - s;
  if (i === 0 || a === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const o = (p) => (p - n) / i, c = (p) => (p - s) / a;
  if (e.length === 1 && r.type === "C") {
    const [p, d, _, f] = r.points, g = [o(p), c(d), o(_), c(f)];
    return { fn: Lt(...g), bezier: g };
  }
  const l = [], u = [], h = Math.max(8, Math.ceil(pn / e.length));
  for (const p of e)
    for (let d = l.length === 0 ? 0 : 1; d <= h; d++) {
      const [_, f] = dn(p, d / h);
      l.push(o(_)), u.push(c(f));
    }
  return { fn: gn(l, u) };
}
function Hn(t = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, t.strength ?? 0.7)) * 0.7, s = [1];
  for (let i = n; i > 2e-3; i *= n) s.push(2 * Math.sqrt(i));
  const r = s.reduce((i, a) => i + a, 0);
  return (i) => {
    if (i <= 0) return 0;
    if (i >= 1) return 1;
    let a = i * r;
    for (let o = 0; o < s.length; o++) {
      if (a <= s[o]) {
        if (o === 0) return (a / s[0]) ** 2;
        const c = s[o] / 2, l = c * c, u = a - c;
        return 1 - (l - u * u);
      }
      a -= s[o];
    }
    return 1;
  };
}
function Vn(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (r) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * r) : (1 - r) ** 2;
  return (r) => r <= 0 || r >= 1 ? 0 : Math.sin(r * e * Math.PI * 2) * s(r);
}
function dn(t, e) {
  if (t.type === "L") {
    const [l, u] = t.points;
    return [t.startX + (l - t.startX) * e, t.startY + (u - t.startY) * e];
  }
  const [n, s, r, i, a, o] = t.points, c = 1 - e;
  return [
    c * c * c * t.startX + 3 * c * c * e * n + 3 * c * e * e * r + e * e * e * a,
    c * c * c * t.startY + 3 * c * c * e * s + 3 * c * e * e * i + e * e * e * o
  ];
}
function gn(t, e) {
  return (n) => {
    if (n <= t[0]) return e[0];
    if (n >= t[t.length - 1]) return e[e.length - 1];
    let s = 0, r = t.length - 1;
    for (; r - s > 1; ) {
      const a = s + r >> 1;
      t[a] <= n ? s = a : r = a;
    }
    const i = t[r] - t[s];
    return i === 0 ? e[r] : e[s] + (n - t[s]) / i * (e[r] - e[s]);
  };
}
function Lt(t, e, n, s) {
  const r = (a, o, c) => 3 * (1 - a) * (1 - a) * a * o + 3 * (1 - a) * a * a * c + a * a * a, i = (a, o, c) => 3 * (1 - a) * (1 - a) * o + 6 * (1 - a) * a * (c - o) + 3 * a * a * (1 - c);
  return (a) => {
    if (a <= 0) return 0;
    if (a >= 1) return 1;
    let o = a;
    for (let u = 0; u < 8; u++) {
      const h = r(o, t, n) - a, p = i(o, t, n);
      if (Math.abs(h) < 1e-6) return r(o, e, s);
      if (Math.abs(p) < 1e-6) break;
      o -= h / p;
    }
    let c = 0, l = 1;
    o = a;
    for (let u = 0; u < 40; u++)
      r(o, t, n) < a ? c = o : l = o, o = (c + l) / 2;
    return r(o, e, s);
  };
}
const I = (t) => Math.round(t * 1e3) / 1e3;
function zn(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, r = t.length;
  let i = `M${I(t[0].x)} ${I(t[0].y)}`;
  if (r === 1) return i;
  const a = (c) => s ? t[(c % r + r) % r] : t[Math.max(0, Math.min(r - 1, c))], o = s ? r : r - 1;
  for (let c = 0; c < o; c++) {
    const l = a(c - 1), u = a(c), h = a(c + 1), p = a(c + 2);
    if (n === 0) {
      i += ` L${I(h.x)} ${I(h.y)}`;
      continue;
    }
    const d = n / 6, _ = u.x + (h.x - l.x) * d, f = u.y + (h.y - l.y) * d, g = h.x - (p.x - u.x) * d, y = h.y - (p.y - u.y) * d;
    i += ` C${I(_)} ${I(f)} ${I(g)} ${I(y)} ${I(h.x)} ${I(h.y)}`;
  }
  return s ? `${i} Z` : i;
}
const A = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function mn(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function Un(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = A(e.cx), s = A(e.cy), r = t.tag.toLowerCase() === "circle" ? A(e.r) : A(e.rx), i = t.tag.toLowerCase() === "circle" ? A(e.r) : A(e.ry);
      return `M${n + r} ${s} A${r} ${i} 0 1 1 ${n - r} ${s} A${r} ${i} 0 1 1 ${n + r} ${s} Z`;
    }
    case "rect": {
      const n = A(e.x), s = A(e.y), r = A(e.width), i = A(e.height);
      let a = e.rx != null ? A(e.rx) : e.ry != null ? A(e.ry) : 0, o = e.ry != null ? A(e.ry) : a;
      return a = Math.min(a, r / 2), o = Math.min(o, i / 2), a === 0 || o === 0 ? `M${n} ${s} H${n + r} V${s + i} H${n} Z` : `M${n + a} ${s} H${n + r - a} A${a} ${o} 0 0 1 ${n + r} ${s + o} V${s + i - o} A${a} ${o} 0 0 1 ${n + r - a} ${s + i} H${n + a} A${a} ${o} 0 0 1 ${n} ${s + i - o} V${s + o} A${a} ${o} 0 0 1 ${n + a} ${s} Z`;
    }
    case "line":
      return `M${A(e.x1)} ${A(e.y1)} L${A(e.x2)} ${A(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = mn(e.points);
      if (n.length === 0) return null;
      const s = n.map((r, i) => `${i === 0 ? "M" : "L"}${r.x} ${r.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
export {
  Mn as Clock,
  Kt as DEFAULT_BAKE_INTERVAL_MS,
  bt as DEFAULT_INERTIA_FRICTION,
  D as DEFAULT_SPRING,
  de as INERTIA_MAX_DURATION_MS,
  Je as InertiaTrackPlayer,
  wn as MORPH_SAMPLES,
  _n as ManualClock,
  Ot as SPRING_MAX_DURATION_MS,
  Tn as SPRING_PRESETS,
  B as SPRING_STEP_MS,
  nt as SpringSampler,
  Ze as SpringTrackPlayer,
  rn as Timeline,
  ut as TrackPlayer,
  On as ValueResolver,
  Rn as bakeEasing,
  Bt as bakeInertiaTrack,
  jt as bakeSpringTrack,
  en as charactersFor,
  $n as clearMorphCache,
  An as clearPathCache,
  ve as createCubicBezier,
  hn as createRandom,
  Ge as createTrack,
  vn as criticalDamping,
  Hn as customBounce,
  Yn as customEase,
  Vn as customWiggle,
  ln as deserializeTimeline,
  on as deserializeTrack,
  Te as easeIn,
  Ht as easeInCubic,
  xe as easeInOut,
  zt as easeInOutCubic,
  Me as easeInOutQuad,
  ye as easeInQuad,
  be as easeOut,
  Vt as easeOutCubic,
  _e as easeOutQuad,
  Ln as fromJSON,
  Ut as getEasingFunction,
  Qt as getInterpolator,
  Zt as getMotionPathPoint,
  Pn as getPathLength,
  Ie as getPointAtProgress,
  le as hasKeyframes,
  Fn as hashSeed,
  it as inertiaDuration,
  rt as inertiaRest,
  dt as inertiaValueAt,
  Sn as inertiaVelocityAt,
  Ke as interpolateArray,
  Qe as interpolateColor,
  In as interpolateMotionPath,
  F as interpolateNumber,
  je as interpolatePathString,
  Et as interpolateString,
  ce as isCubicBezierEasing,
  Y as isInertiaTrack,
  yn as isMotionPathPoint,
  Ft as isMotionPathTrack,
  Ue as isPathData,
  H as isSpringTrack,
  mt as isTextTrack,
  kn as isUnderdamped,
  Nn as isUnresolved,
  Yt as linear,
  he as maxStaggerDistance,
  ze as morphPath,
  ge as naturalRest,
  q as parsePath,
  qt as pointAtDistance,
  zn as pointsToPath,
  te as randomBetween,
  Xn as randomChoice,
  un as randomSnapped,
  fn as resolveSequence,
  se as resolveValue,
  cn as serializeTimeline,
  an as serializeTrack,
  Un as shapeToPathData,
  Be as simplifyKeyframes,
  xn as springDuration,
  bn as springValueAt,
  Xt as staggerDistance,
  Nt as staggerOffset,
  ue as staggerOffsets,
  yt as staggerSpan,
  sn as textAt,
  En as toJSON,
  Cn as toKeyframedTrack,
  Dn as toKeyframedTracks,
  O as trackTargets
};
