/**
 * Yappy embed client — drive an embedded Yappy editor from a parent page.
 *
 * Pairs with Yappy's postMessage control bridge (embed-bridge.ts). Use it when
 * Yappy is embedded from a DIFFERENT origin than your app; for a same-origin
 * iframe you can also just use `iframe.contentWindow.Yappy` directly.
 *
 * Prerequisite: the Yappy deployment must allowlist your page's origin
 * (VITE_EMBED_ALLOWED_ORIGINS or window.YAPPY_EMBED_ALLOWED_ORIGINS on the
 * Yappy side). Otherwise every call rejects/ignores by design.
 *
 * Load it (served by Yappy):
 *   <script src="https://your-yappy-host/yappy-embed-client.js"></script>
 * or copy this file into your own project.
 *
 * Usage:
 *   const yappy = createYappyEmbed(document.querySelector('#frame'), {
 *     targetOrigin: 'https://your-yappy-host'   // Yappy's origin (required cross-origin)
 *   });
 *   await yappy.ready();                          // resolves once the bridge answers
 *   await yappy.call('importDSL', 'graph TD; A-->B; B-->C');
 *   const svg = await yappy.call('exportSVG');
 *
 * Every Yappy API method is reachable via `call(methodName, ...args)` and
 * returns a Promise of the method's return value.
 */
(function (root) {
    function createYappyEmbed(iframe, options) {
        options = options || {};
        var targetOrigin = options.targetOrigin || "*";
        var defaultTimeout = options.timeout || 15000;
        var pending = Object.create(null);
        var counter = 0;

        function onMessage(event) {
            var data = event.data;
            if (!data || typeof data !== "object" || data.__yappy !== true) return;
            if (!("ok" in data)) return; // ignore requests, only handle responses
            var entry = pending[data.id];
            if (!entry) return;
            delete pending[data.id];
            clearTimeout(entry.timer);
            if (data.ok) entry.resolve(data.result);
            else entry.reject(new Error(data.error || "Yappy call failed"));
        }
        window.addEventListener("message", onMessage);

        function post(method, args, timeout) {
            return new Promise(function (resolve, reject) {
                var win = iframe && iframe.contentWindow;
                if (!win) {
                    reject(new Error("iframe has no contentWindow (not loaded yet?)"));
                    return;
                }
                var id = "y" + ++counter;
                var timer = setTimeout(function () {
                    delete pending[id];
                    reject(new Error("Yappy call timed out: " + method));
                }, timeout || defaultTimeout);
                pending[id] = { resolve: resolve, reject: reject, timer: timer };
                win.postMessage({ __yappy: true, id: id, method: method, args: args }, targetOrigin);
            });
        }

        return {
            /** Call any window.Yappy method by name; returns a Promise of its result. */
            call: function (method) {
                var args = Array.prototype.slice.call(arguments, 1);
                return post(method, args);
            },
            /** Resolves once the bridge responds to a ping (poll until ready or timeout). */
            ready: function (timeout) {
                var deadline = Date.now() + (timeout || defaultTimeout);
                function attempt() {
                    return post("__ping", [], 1000).then(function () {
                        return true;
                    }).catch(function (err) {
                        if (Date.now() >= deadline) throw err;
                        return new Promise(function (r) { setTimeout(r, 250); }).then(attempt);
                    });
                }
                return attempt();
            },
            /** Stop listening for responses. Call when tearing down the iframe. */
            destroy: function () {
                window.removeEventListener("message", onMessage);
                pending = Object.create(null);
            },
        };
    }

    root.createYappyEmbed = createYappyEmbed;
    if (typeof module !== "undefined" && module.exports) module.exports = { createYappyEmbed: createYappyEmbed };
})(typeof window !== "undefined" ? window : this);
