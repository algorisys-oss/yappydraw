import { h as r } from "./index-C1gfed6c.js";
const [s, t] = r(null);
function a(e, n, i) {
  return s()?.resolve(null), new Promise((o) => t({ title: e, message: n, choices: i, resolve: o }));
}
export {
  a as askChoice,
  s as pendingChoice
};
