/**
 * OAuth token persistence in localStorage.
 *
 * Tokens are stored per-provider under the key prefix `yappy:cloud:token:`.
 * Expiration is checked with a 5-minute buffer so we never send an
 * almost-expired token to an API.
 */

const TOKEN_PREFIX = 'yappy:cloud:token:';
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export interface StoredTokens {
    accessToken: string;
    refreshToken?: string;         // Not available with Google PKCE
    expiresAt: number;             // Unix ms
    scope: string;
    tokenType: string;
    userEmail?: string;
    userName?: string;
    userAvatar?: string;
}

/** Persist tokens for a provider. */
export function saveTokens(providerId: string, tokens: StoredTokens): void {
    try {
        localStorage.setItem(TOKEN_PREFIX + providerId, JSON.stringify(tokens));
    } catch {
        // localStorage full — not critical, tokens live in memory too
        console.warn(`[token-store] Failed to persist tokens for ${providerId}`);
    }
}

/**
 * Load tokens for a provider.
 * Returns null if not found or expired (with 5-min buffer).
 */
export function loadTokens(providerId: string): StoredTokens | null {
    try {
        const raw = localStorage.getItem(TOKEN_PREFIX + providerId);
        if (!raw) return null;
        const tokens: StoredTokens = JSON.parse(raw);
        if (tokens.expiresAt < Date.now() + EXPIRY_BUFFER_MS) {
            // Expired or about to expire — clear and return null
            clearTokens(providerId);
            return null;
        }
        return tokens;
    } catch {
        return null;
    }
}

/** Clear stored tokens for a provider. */
export function clearTokens(providerId: string): void {
    try {
        localStorage.removeItem(TOKEN_PREFIX + providerId);
    } catch {
        // ignore
    }
}
