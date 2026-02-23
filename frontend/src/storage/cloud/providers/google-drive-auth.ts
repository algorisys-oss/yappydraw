/**
 * Google Drive — PKCE OAuth 2.0 Flow
 *
 * Handles the entire OAuth lifecycle for Google Drive using the PKCE
 * (Proof Key for Code Exchange) flow. This runs entirely client-side —
 * no backend server needed.
 *
 * Flow:
 *   1. Generate code_verifier + code_challenge (SHA-256)
 *   2. Open Google's consent page in a popup
 *   3. Popup redirects to /oauth-callback.html which posts the auth code back
 *   4. Exchange the auth code + code_verifier for an access token
 *   5. Fetch user profile info
 *
 * See docs/cloud-storage.md §9.1 for the full flow diagram.
 */

import type { StoredTokens } from '../token-store';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/** Narrow scope: only files created/opened by YappyDraw. */
const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
/** Broader scope: needed for Shared Drive access. */
const SCOPE_DRIVE_FULL = 'https://www.googleapis.com/auth/drive';

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 700;
const POPUP_CHECK_INTERVAL_MS = 500;

export interface GoogleAuthOptions {
    /** Request broader scope for Shared Drive access. */
    sharedDrive?: boolean;
}

/**
 * Initiate the full Google OAuth PKCE flow.
 * Opens a popup, waits for auth, exchanges code, fetches user info.
 * Returns stored tokens ready for persistence.
 */
export async function initiateGoogleAuth(options?: GoogleAuthOptions): Promise<StoredTokens> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw new Error(
            'Google Drive is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.'
        );
    }

    const redirectUri = resolveRedirectUri();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const scope = options?.sharedDrive ? SCOPE_DRIVE_FULL : SCOPE_DRIVE_FILE;

    // Build authorization URL
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'consent',
        include_granted_scopes: 'true',
    });

    // Open popup
    const popup = openAuthPopup(`${GOOGLE_AUTH_URL}?${params}`);

    // Wait for the callback
    const code = await waitForAuthCode(popup);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier, clientId, redirectUri);

    // Fetch user profile
    const userInfo = await fetchUserInfo(tokens.accessToken);
    tokens.userEmail = userInfo.email;
    tokens.userName = userInfo.name;
    tokens.userAvatar = userInfo.picture;

    return tokens;
}

// ── PKCE Cryptography ──────────────────────────────────────

function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
}

function base64urlEncode(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// ── Popup Management ───────────────────────────────────────

function resolveRedirectUri(): string {
    // Works for both dev (localhost:5173) and prod (yappydraw.com)
    const base = window.location.origin + window.location.pathname;
    // Ensure we point to the root's oauth-callback.html
    const rootPath = base.endsWith('/') ? base : base.substring(0, base.lastIndexOf('/') + 1);
    return `${rootPath}oauth-callback.html`;
}

function openAuthPopup(url: string): Window {
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},menubar=no,toolbar=no,status=no,resizable=yes`;

    const popup = window.open(url, 'yappy-google-auth', features);
    if (!popup) {
        throw new Error(
            'Popup blocked by the browser. Please allow popups for this site and try again.'
        );
    }
    return popup;
}

const OAUTH_STORAGE_KEY = 'yappy:oauth:result';

function waitForAuthCode(popup: Window): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let settled = false;

        // Clear any stale OAuth result from a previous attempt
        try { localStorage.removeItem(OAUTH_STORAGE_KEY); } catch { /* ignore */ }

        // Strategy 1: postMessage (works when COOP allows window.opener)
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'yappy-oauth-callback' && event.data.code) {
                settled = true;
                cleanup();
                resolve(event.data.code);
            } else if (event.data?.type === 'yappy-oauth-error') {
                settled = true;
                cleanup();
                reject(new Error(event.data.error || 'OAuth authentication failed'));
            }
        };

        // Strategy 2: localStorage 'storage' event (COOP-proof fallback)
        // Fires when another tab/window writes to localStorage
        const onStorage = (event: StorageEvent) => {
            if (event.key !== OAUTH_STORAGE_KEY || !event.newValue) return;
            try {
                const data = JSON.parse(event.newValue);
                if (data.type === 'yappy-oauth-callback' && data.code) {
                    settled = true;
                    cleanup();
                    resolve(data.code);
                } else if (data.type === 'yappy-oauth-error') {
                    settled = true;
                    cleanup();
                    reject(new Error(data.error || 'OAuth authentication failed'));
                }
            } catch { /* malformed data, ignore */ }
        };

        // Poll for completion. Uses two signals:
        // - popup.closed: detect user manually closing the popup (may be blocked by COOP)
        // - localStorage: COOP-proof fallback for receiving the auth code
        const checkClosedTimer = window.setInterval(() => {
            if (settled) return;

            // Check localStorage for auth result (COOP-proof, always works)
            // The storage event may not fire if the popup closes immediately after writing,
            // so we also poll directly as a safety net.
            try {
                const stored = localStorage.getItem(OAUTH_STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.type === 'yappy-oauth-callback' && data.code) {
                        settled = true;
                        cleanup();
                        resolve(data.code);
                        return;
                    } else if (data.type === 'yappy-oauth-error') {
                        settled = true;
                        cleanup();
                        reject(new Error(data.error || 'OAuth authentication failed'));
                        return;
                    }
                }
            } catch { /* ignore */ }

            // Check if user closed the popup without completing auth
            try {
                if (popup.closed) {
                    settled = true;
                    cleanup();
                    reject(new Error('Authentication cancelled — popup was closed.'));
                }
            } catch {
                // COOP blocks popup.closed — we rely on localStorage above
            }
        }, POPUP_CHECK_INTERVAL_MS);

        function cleanup() {
            window.removeEventListener('message', onMessage);
            window.removeEventListener('storage', onStorage);
            window.clearInterval(checkClosedTimer);
            // Clean up the localStorage key
            try { localStorage.removeItem(OAUTH_STORAGE_KEY); } catch { /* ignore */ }
        }

        window.addEventListener('message', onMessage);
        window.addEventListener('storage', onStorage);
    });
}

// ── Token Exchange ─────────────────────────────────────────

async function exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    clientId: string,
    redirectUri: string,
): Promise<StoredTokens> {
    const body: Record<string, string> = {
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
    };

    // Google requires client_secret for "Web application" client types,
    // even when using PKCE. This is safe in a SPA — Google's security
    // relies on redirect URI / origin restrictions, not the secret.
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    if (clientSecret) {
        body.client_secret = clientSecret;
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error_description: 'Token exchange failed' }));
        throw new Error(error.error_description || `Token exchange failed (${response.status})`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token, // Usually undefined for PKCE public clients
        expiresAt: Date.now() + data.expires_in * 1000,
        scope: data.scope,
        tokenType: data.token_type,
    };
}

// ── User Info ──────────────────────────────────────────────

async function fetchUserInfo(accessToken: string): Promise<{ email?: string; name?: string; picture?: string }> {
    try {
        const response = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return {};
        return await response.json();
    } catch {
        // Non-critical — user info is nice to have
        return {};
    }
}
