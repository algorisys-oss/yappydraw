const u = {
  entr: { appear: 1, fly: 2, fade: 10, wipe: 22, bounce: 26, grow: 31, swivel: 45, spinner: 49, zoom: 53 },
  exit: { appear: 1, fly: 2, fade: 10, wipe: 22, bounce: 26, grow: 31, swivel: 45, spinner: 49, zoom: 53 },
  emph: { growShrink: 6, spin: 8, pulse: 26, teeter: 32 }
}, c = { t: 1, r: 2, b: 4, l: 8 }, a = { 1: "t", 2: "r", 4: "b", 8: "l" }, p = (e) => {
  if (/Left/.test(e)) return "l";
  if (/Right/.test(e)) return "r";
  if (/InUp|OutDown/.test(e)) return "b";
  if (/InDown|OutUp/.test(e)) return "t";
};
function l(e) {
  const t = /Out/.test(e) || e === "hinge" || e === "textDelete" ? "exit" : /In|^flip$|^drawIn$|^scaleIn$|^jackInTheBox$|^typewriter|^charByChar$|^wordByWord$|^lineByLine$|^textScramble$|^table|^ds|^code/.test(e) ? "entr" : "emph";
  if (t === "emph")
    return /^(pulse|heartBeat|flash)$/.test(e) ? { cls: t, effect: "pulse" } : /^(rubberBand|jello)$/.test(e) ? { cls: t, effect: "growShrink" } : { cls: t, effect: "teeter" };
  const r = p(e);
  return /^(slide|back|lightSpeed)(In|Out)/.test(e) || /^fade(In|Out).*Big$/.test(e) ? { cls: t, effect: "fly", dir: r ?? "b" } : /^bounce(In|Out)/.test(e) ? { cls: t, effect: "bounce" } : /^(zoom|scale)(In|Out)|^jackInTheBox$/.test(e) ? { cls: t, effect: "zoom" } : /^(rotate|roll)(In|Out)|^hinge$/.test(e) ? { cls: t, effect: "spinner" } : /^flip/.test(e) ? { cls: t, effect: "swivel" } : /^(draw(In|Out)|typewriter|charByChar|wordByWord|lineByLine|textScramble|textDelete)/.test(e) ? { cls: t, effect: "wipe", dir: "l" } : { cls: t, effect: "fade" };
}
function h(e, n, t) {
  const r = { target: n, start: t, durationMs: Math.max(1, Math.round(e.duration ?? 500)), delayMs: Math.max(0, Math.round(e.delay ?? 0)) }, s = typeof e.repeat == "number" && e.repeat !== 0 ? { repeat: e.repeat < 0 ? -1 : e.repeat + 1 } : {};
  if (e.type === "preset") {
    const { cls: i, effect: f, dir: o } = l(e.name);
    return { ...r, ...s, cls: i, effect: f, presetId: u[i][f] ?? 10, subtype: o ? c[o] : f === "zoom" ? 16 : 0, ...o && { dir: o } };
  }
  if (e.type === "rotate") {
    const i = e.relative === !1 && typeof e.fromAngle == "number" ? e.toAngle - e.fromAngle : e.toAngle;
    return { ...r, ...s, cls: "emph", effect: "spin", presetId: 8, subtype: 0, degrees: Number(i) || 360 };
  }
  if (e.type === "autoSpin") {
    const i = e.iterations === "infinite" ? 1 : Math.max(1, Number(e.iterations) || 1), f = e.direction === "counterclockwise" ? -1 : 1;
    return {
      ...r,
      cls: "emph",
      effect: "spin",
      presetId: 8,
      subtype: 0,
      degrees: 360 * i * f,
      ...e.iterations === "infinite" && { repeat: -1 }
    };
  }
  return null;
}
function d(e) {
  const n = (t) => t === "l" ? "Left" : t === "r" ? "Right" : t === "t" ? "Down" : "Up";
  if (e.cls === "entr") switch (e.effect) {
    case "fly":
      return `slideIn${n(e.dir ?? "b")}`;
    case "bounce":
      return "bounceIn";
    case "zoom":
    case "grow":
      return "zoomIn";
    case "spinner":
      return "rotateIn";
    case "swivel":
      return "flipInY";
    case "wipe":
      return "drawIn";
    default:
      return "fadeIn";
  }
  if (e.cls === "exit") switch (e.effect) {
    // "slideOutLeft" leaves to the left; PowerPoint's Fly Out names the side it leaves by too.
    case "fly":
      return `slideOut${e.dir === "l" ? "Left" : e.dir === "r" ? "Right" : e.dir === "t" ? "Up" : "Down"}`;
    case "bounce":
      return "bounceOut";
    case "zoom":
    case "grow":
      return "zoomOut";
    case "spinner":
      return "rotateOut";
    case "swivel":
      return "flipOutY";
    case "wipe":
      return "drawOut";
    default:
      return "fadeOut";
  }
  switch (e.effect) {
    case "growShrink":
      return "rubberBand";
    case "teeter":
      return "shakeX";
    default:
      return "pulse";
  }
}
function w(e, n, t) {
  const r = t ? e.start === "after" ? "after-prev" : "on-load" : e.start === "click" ? "on-click" : e.start === "with" ? "with-prev" : "after-prev", s = {
    id: n,
    trigger: r,
    duration: Math.max(1, e.durationMs),
    delay: Math.max(0, e.delayMs),
    easing: "easeOutQuad",
    ...e.repeat !== void 0 && e.repeat !== 1 && { repeat: e.repeat < 0 ? -1 : Math.max(0, e.repeat - 1) },
    // PowerPoint hides an entrance's object until it plays.
    ...e.cls === "entr" && { startHidden: !0 }
  };
  return e.cls === "emph" && e.effect === "spin" ? { ...s, type: "rotate", toAngle: e.degrees ?? 360, relative: !0 } : { ...s, type: "preset", name: d(e) };
}
function b(e, n) {
  for (const [t, r] of Object.entries(u[e])) if (r === n) return { effect: t, known: !0 };
  return { effect: e === "emph" ? "pulse" : "fade", known: !1 };
}
const g = (e) => a[e];
export {
  b as e,
  w as f,
  g as s,
  h as t
};
