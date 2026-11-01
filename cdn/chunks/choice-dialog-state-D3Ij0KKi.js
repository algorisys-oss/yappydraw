import { am as r } from "./index-D4fubUK0.js";
const [s, t] = r(null);
function l(e, n, i) {
  return s()?.resolve(null), new Promise((o) => t({ title: e, message: n, choices: i, resolve: o }));
}
export {
  l as askChoice,
  s as pendingChoice
};
