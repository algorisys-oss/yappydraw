import { describe, expect, test } from 'bun:test';
import { gzipSync, gunzipSync } from 'fflate';
import {
    embedSceneInSvg, extractSceneFromSvg, embedSceneInPng, extractSceneFromPng, extractScene,
    editableFormat, crc32,
} from './embedded-scene';

const doc = { version: 4, elements: [{ id: 'a', type: 'rectangle' }], note: 'ünïcödé <&> "quotes"' };
const yappyBytes = gzipSync(new TextEncoder().encode(JSON.stringify(doc)));
const decode = (b: Uint8Array | null) => JSON.parse(new TextDecoder().decode(gunzipSync(b!)));

// 1×1 transparent PNG.
const PNG_1x1 = Uint8Array.from(atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
    c => c.charCodeAt(0));

describe('SVG', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';

    test('round-trips the scene', () => {
        const out = embedSceneInSvg(svg, yappyBytes);
        expect(decode(extractSceneFromSvg(out))).toEqual(doc);
    });

    test('stays a valid SVG that renders the same picture', () => {
        const out = embedSceneInSvg(svg, yappyBytes);
        expect(out.startsWith('<svg')).toBe(true);
        expect(out.trimEnd().endsWith('</svg>')).toBe(true);
        expect(out).toContain('<rect width="10" height="10"/>');
        expect(out).toContain('<metadata>');
    });

    test('re-embedding replaces the scene instead of adding a second one', () => {
        const once = embedSceneInSvg(svg, yappyBytes);
        const other = gzipSync(new TextEncoder().encode('{"version":4,"elements":[]}'));
        const twice = embedSceneInSvg(once, other);
        expect(twice.match(/yappy:scene/g)?.length).toBe(2); // one open + one close tag
        expect(decode(extractSceneFromSvg(twice))).toEqual({ version: 4, elements: [] });
    });

    test('a plain SVG has no scene', () => {
        expect(extractSceneFromSvg(svg)).toBeNull();
    });

    test('an SVG with an XML prolog and a trailing newline', () => {
        const withProlog = `<?xml version="1.0"?>\n${svg}\n`;
        expect(decode(extractSceneFromSvg(embedSceneInSvg(withProlog, yappyBytes)))).toEqual(doc);
    });

    test('rejects markup with no </svg>', () => {
        expect(() => embedSceneInSvg('<div/>', yappyBytes)).toThrow();
    });
});

describe('PNG', () => {
    test('round-trips the scene', () => {
        const out = embedSceneInPng(PNG_1x1, yappyBytes);
        expect(decode(extractSceneFromPng(out))).toEqual(doc);
    });

    test('keeps the signature, the original chunks, and IEND last', () => {
        const out = embedSceneInPng(PNG_1x1, yappyBytes);
        expect([...out.slice(0, 8)]).toEqual([...PNG_1x1.slice(0, 8)]);
        expect(new TextDecoder().decode(out.slice(out.length - 8, out.length - 4))).toBe('IEND');
        // IHDR and IDAT survive untouched.
        const s = new TextDecoder('latin1').decode(out);
        expect(s).toContain('IHDR');
        expect(s).toContain('IDAT');
    });

    test('the new chunk has a correct CRC', () => {
        const out = embedSceneInPng(PNG_1x1, yappyBytes);
        const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
        let off = 8;
        let checked = 0;
        while (off < out.length) {
            const len = view.getUint32(off);
            const type = new TextDecoder().decode(out.slice(off + 4, off + 8));
            const crc = view.getUint32(off + 8 + len);
            expect(crc32(out.subarray(off + 4, off + 8 + len))).toBe(crc);
            checked++;
            off += 12 + len;
            if (type === 'IEND') break;
        }
        expect(checked).toBe(4); // IHDR, IDAT, tEXt, IEND
    });

    test('re-embedding replaces the chunk', () => {
        const other = gzipSync(new TextEncoder().encode('{"version":4,"elements":[]}'));
        const twice = embedSceneInPng(embedSceneInPng(PNG_1x1, yappyBytes), other);
        expect(new TextDecoder('latin1').decode(twice).split('yappy-scene').length).toBe(2);
        expect(decode(extractSceneFromPng(twice))).toEqual({ version: 4, elements: [] });
    });

    test('a plain PNG has no scene; a non-PNG is refused', () => {
        expect(extractSceneFromPng(PNG_1x1)).toBeNull();
        expect(() => embedSceneInPng(new Uint8Array([1, 2, 3]), yappyBytes)).toThrow();
    });

    test('crc32 matches the known value for "IEND"', () => {
        expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082);
    });
});

describe('extractScene / editableFormat', () => {
    test('sniffs PNG and SVG bytes', () => {
        expect(decode(extractScene(embedSceneInPng(PNG_1x1, yappyBytes)))).toEqual(doc);
        const svg = embedSceneInSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>', yappyBytes);
        expect(decode(extractScene(new TextEncoder().encode(svg)))).toEqual(doc);
        expect(extractScene(new Uint8Array())).toBeNull();
    });

    test('names the editable formats by file name', () => {
        expect(editableFormat('a/b/Flow.yappy.svg')).toBe('svg');
        expect(editableFormat('x.YAPPY.PNG')).toBe('png');
        expect(editableFormat('x.yappy')).toBe('yappy');
        expect(editableFormat('x.svg')).toBeNull();
        expect(editableFormat('x.png')).toBeNull();
    });
});
