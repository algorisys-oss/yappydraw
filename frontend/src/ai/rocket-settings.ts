/**
 * Rocket Backend Connection Settings
 * Handles localStorage persistence with base64 obfuscation for password.
 */

export interface RocketConfig {
    url: string;
    email: string;
    password: string;
    appName: string;
}

const ROCKET_CONFIG_KEY = 'yappy:rocket:config';

function obfuscate(val: string): string {
    try { return btoa(val); } catch { return val; }
}

function deobfuscate(val: string): string {
    try { return atob(val); } catch { return val; }
}

export function loadRocketConfig(): RocketConfig {
    try {
        const saved = localStorage.getItem(ROCKET_CONFIG_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                url: parsed.url || '',
                email: parsed.email || '',
                password: parsed.password ? deobfuscate(parsed.password) : '',
                appName: parsed.appName || '',
            };
        }
    } catch { /* ignore */ }
    return { url: '', email: '', password: '', appName: '' };
}

export function saveRocketConfig(config: RocketConfig): void {
    try {
        localStorage.setItem(ROCKET_CONFIG_KEY, JSON.stringify({
            url: config.url,
            email: config.email,
            password: config.password ? obfuscate(config.password) : '',
            appName: config.appName,
        }));
    } catch { /* ignore */ }
}

export function hasRocketConfig(): boolean {
    const c = loadRocketConfig();
    return !!(c.url && c.email && c.password && c.appName);
}

// ─── Rocket API Client ──────────────────────────────────────────

export interface RocketAuthResult {
    success: boolean;
    accessToken?: string;
    error?: string;
}

export async function rocketLogin(config: RocketConfig): Promise<RocketAuthResult> {
    try {
        const res = await fetch(`${config.url.replace(/\/$/, '')}/api/_platform/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: config.email, password: config.password }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { success: false, error: `Login failed (${res.status}): ${text.slice(0, 200)}` };
        }
        const data = await res.json();
        return { success: true, accessToken: data.data?.access_token || data.access_token };
    } catch (err: any) {
        return { success: false, error: `Connection failed: ${err.message}` };
    }
}

export async function rocketEnsureApp(
    config: RocketConfig,
    token: string
): Promise<{ success: boolean; error?: string }> {
    const baseUrl = config.url.replace(/\/$/, '');
    try {
        const listRes = await fetch(`${baseUrl}/api/_platform/apps`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (listRes.ok) {
            const body = await listRes.json();
            const apps = body.data || body;
            if (Array.isArray(apps) && apps.some((a: any) => a.name === config.appName)) {
                return { success: true };
            }
        }
        const createRes = await fetch(`${baseUrl}/api/_platform/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: config.appName }),
        });
        if (!createRes.ok) {
            const text = await createRes.text().catch(() => '');
            return { success: false, error: `Failed to create app (${createRes.status}): ${text.slice(0, 200)}` };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: `App setup failed: ${err.message}` };
    }
}

export async function rocketImportSchema(
    config: RocketConfig,
    token: string,
    schema: any
): Promise<{ success: boolean; summary?: any; error?: string }> {
    const baseUrl = config.url.replace(/\/$/, '');
    try {
        const res = await fetch(`${baseUrl}/api/${encodeURIComponent(config.appName)}/_admin/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(schema),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { success: false, error: `Import failed (${res.status}): ${text.slice(0, 200)}` };
        }
        const body = await res.json();
        return { success: true, summary: body.data?.summary };
    } catch (err: any) {
        return { success: false, error: `Import failed: ${err.message}` };
    }
}
