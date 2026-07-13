/**
 * Cross-origin embed control bridge.
 *
 * When Yappy runs inside an <iframe> on a DIFFERENT origin, the parent page
 * cannot touch `iframe.contentWindow.Yappy` directly — the browser blocks
 * cross-origin property access. This bridge lets a trusted parent drive the
 * full `window.Yappy` API over `postMessage` instead.
 *
 * Security model (important — a postMessage handler is an attack surface):
 *   - The allowlist of parent origins is chosen by the Yappy *operator* at
 *     deploy time, NEVER by the framing page. Sources, in order:
 *       1. Build-time env:  VITE_EMBED_ALLOWED_ORIGINS="https://a.com,https://b.com"
 *       2. Runtime global:  window.YAPPY_EMBED_ALLOWED_ORIGINS = ['https://a.com']
 *          (set from an inline <script> in Yappy's OWN index.html — a framing
 *          page cannot reach into this document to set it.)
 *   - Same-origin messages are always accepted (the parent already has direct
 *     access anyway; this just keeps the client wrapper uniform).
 *   - Default is DENY: with no allowlist configured, cross-origin control is
 *     off. A framing page cannot drive the API.
 *   - `'*'` in the allowlist opts into "any origin" for trusted internal
 *     deployments; it logs a warning because it removes the origin check.
 *   - Only own, callable properties of the API object are invokable. Prototype
 *     members (`constructor`, `__proto__`, …) and non-functions are rejected.
 *
 * Wire protocol (both directions carry the `__yappy` marker so we never clash
 * with unrelated postMessage traffic such as OAuth popups):
 *   request : { __yappy: true, id, method, args }
 *   response: { __yappy: true, id, ok: true,  result }
 *             { __yappy: true, id, ok: false, error }
 * A `method` of `"__ping"` answers `{ ok: true, result: 'pong' }` for readiness
 * probes without touching the API.
 */

const REQUEST_MARKER = "__yappy";

function parseEnvOrigins(): string[] {
    const raw = import.meta.env.VITE_EMBED_ALLOWED_ORIGINS as string | undefined;
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseRuntimeOrigins(): string[] {
    const raw = (window as unknown as { YAPPY_EMBED_ALLOWED_ORIGINS?: unknown }).YAPPY_EMBED_ALLOWED_ORIGINS;
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
    if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
}

function resolveAllowedOrigins(): string[] {
    // Runtime global wins over build-time env, so operators can override a
    // baked-in default per-deployment without rebuilding.
    const runtime = parseRuntimeOrigins();
    return runtime.length ? runtime : parseEnvOrigins();
}

/**
 * Install the postMessage control bridge. Safe to call once at app init; a
 * second call is a no-op. `api` is the object whose own methods are exposed
 * (i.e. `YappyAPI`).
 */
export function initEmbedBridge(api: Record<string, unknown>): void {
    const w = window as unknown as { __yappyEmbedBridgeInstalled?: boolean };
    if (w.__yappyEmbedBridgeInstalled) return;
    w.__yappyEmbedBridgeInstalled = true;

    const wildcard = resolveAllowedOrigins().includes("*");
    if (wildcard) {
        console.warn(
            "[Yappy] Embed control bridge accepts ANY origin ('*' in the allowlist). " +
            "Only use this on trusted internal deployments — any page that frames Yappy can drive its API."
        );
    }

    const originAllowed = (origin: string): boolean => {
        if (origin === window.location.origin) return true; // same-origin always OK
        // Re-read each message so a runtime override applied after init still takes effect.
        const allowed = resolveAllowedOrigins();
        return allowed.includes("*") || allowed.includes(origin);
    };

    window.addEventListener("message", (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== "object" || (data as Record<string, unknown>)[REQUEST_MARKER] !== true) return;
        // A response echoed back into this window (ok/error present) is not a request.
        if ("ok" in (data as Record<string, unknown>)) return;
        if (!originAllowed(event.origin)) return;

        const { id, method, args } = data as { id?: unknown; method?: unknown; args?: unknown };
        const source = event.source as Window | null;
        const reply = (payload: Record<string, unknown>) => {
            if (!source) return;
            try {
                source.postMessage({ [REQUEST_MARKER]: true, id, ...payload }, { targetOrigin: event.origin });
            } catch {
                // Result wasn't structured-cloneable — report that instead of crashing.
                source.postMessage(
                    { [REQUEST_MARKER]: true, id, ok: false, error: "Result is not serializable across postMessage" },
                    { targetOrigin: event.origin }
                );
            }
        };

        if (method === "__ping") {
            reply({ ok: true, result: "pong" });
            return;
        }

        if (typeof method !== "string" || !Object.prototype.hasOwnProperty.call(api, method)) {
            reply({ ok: false, error: `Unknown Yappy API method: ${String(method)}` });
            return;
        }
        const fn = api[method];
        if (typeof fn !== "function") {
            reply({ ok: false, error: `Yappy.${method} is not a callable method` });
            return;
        }
        const callArgs = Array.isArray(args) ? args : [];

        try {
            Promise.resolve((fn as (...a: unknown[]) => unknown).apply(api, callArgs))
                .then((result) => reply({ ok: true, result }))
                .catch((err) => reply({ ok: false, error: err instanceof Error ? err.message : String(err) }));
        } catch (err) {
            reply({ ok: false, error: err instanceof Error ? err.message : String(err) });
        }
    });

    console.log("Yappy embed control bridge ready (postMessage).");
}
