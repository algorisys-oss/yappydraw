import { s as d, a as o, a9 as f } from "./index-COYn8VVU.js";
class p {
  /**
   * Morph the current canvas to match the target DisplayState
   */
  static morphTo(c, t = 800) {
    const a = d.elements, r = c.overrides, n = Object.keys(r), i = a.filter((e) => n.includes(e.id)).map((e) => e.id), m = n.filter((e) => !a.some((s) => s.id === e));
    i.forEach((e) => {
      const s = r[e];
      s && o(e, s, {
        duration: t,
        easing: "easeInOutQuad"
      });
    }), m.forEach((e) => {
      const s = r[e];
      s && (f(e, t), o(e, s, {
        duration: t,
        easing: "easeInOutQuad"
      }));
    });
  }
}
export {
  p as MorphAnimator
};
