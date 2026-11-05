import { ao as r } from "./index-CcU7GLMU.js";
const [s, t] = r(null);
function l(e, n, o) {
  return s()?.resolve(null), new Promise((i) => t({ title: e, message: n, choices: o, resolve: i }));
}
export {
  l as askChoice,
  s as pendingChoice
};
