import { h as r } from "./index-D8TAEo6E.js";
const [s, t] = r(null);
function a(e, n, i) {
  return s()?.resolve(null), new Promise((o) => t({ title: e, message: n, choices: i, resolve: o }));
}
export {
  a as askChoice,
  s as pendingChoice
};
