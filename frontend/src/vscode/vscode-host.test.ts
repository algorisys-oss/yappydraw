import { afterAll, describe, expect, test } from 'bun:test';

// The module caches acquireVsCodeApi() on first use, so the fake webview globals must exist
// before it is imported.
const posted: any[] = [];
const listeners: ((e: { data: unknown }) => void)[] = [];
const g = globalThis as any;
// bun runs every test file in one process, and another file may already have installed a
// `window`: replace it for this file and put it back after, leaving no fake VS Code behind.
const hadWindow = 'window' in g;
const originalWindow = g.window;
afterAll(() => {
    delete g.acquireVsCodeApi;
    if (hadWindow) g.window = originalWindow; else delete g.window;
});
g.acquireVsCodeApi = () => ({ postMessage: (m: unknown) => posted.push(m) });
g.window = { addEventListener: (t: string, fn: any) => { if (t === 'message') listeners.push(fn); } };

const host = await import('./vscode-host');

describe('vscode-host', () => {
    test('detects the webview', () => {
        expect(host.isVSCode()).toBe(true);
        expect(host.vscodeApi()).not.toBeNull();
    });

    test('saveViaHost posts the bytes and resolves with the host answer', async () => {
        const blob = new Blob([new Uint8Array([1, 2, 3])]);
        const p = host.saveViaHost(blob, 'chart.png', { 'image/png': ['.png'] }, 'PNG image');
        // arrayBuffer() is async: let it settle before looking for the message.
        await new Promise(r => setTimeout(r, 0));
        const msg = posted.find(m => m.type === 'saveFile');
        expect(msg).toBeDefined();
        expect(msg.name).toBe('chart.png');
        expect(msg.bytes).toEqual([1, 2, 3]);
        expect(msg.filters).toEqual({ 'PNG image': ['png'] });
        for (const l of listeners) l({ data: { type: 'saveFileResult', requestId: msg.requestId, saved: true } });
        expect(await p).toBe(true);
    });

    test('a cancelled Save dialog resolves false, and other requests are not settled by it', async () => {
        posted.length = 0;
        const a = host.saveViaHost(new Blob(['a']), 'a.svg');
        const b = host.saveViaHost(new Blob(['b']), 'b.svg');
        await new Promise(r => setTimeout(r, 0));
        const [ma, mb] = posted.filter(m => m.type === 'saveFile');
        expect(ma.filters).toEqual({});
        for (const l of listeners) l({ data: { type: 'saveFileResult', requestId: mb.requestId, saved: false } });
        expect(await b).toBe(false);
        for (const l of listeners) l({ data: { type: 'saveFileResult', requestId: ma.requestId, saved: true } });
        expect(await a).toBe(true);
    });

    test('openExternal posts the URL', () => {
        host.openExternal('https://yappydraw.com/learn/');
        expect(posted.at(-1)).toEqual({ type: 'openExternal', url: 'https://yappydraw.com/learn/' });
    });
});
