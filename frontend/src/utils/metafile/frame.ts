/** Shared by the readers: the picture frame and the parse errors. */
import type { Rect4 } from './clip';

/** The picture frame in device units (`rect` = `[x, y, w, h]`) and, when the file states one, its size in picture units. */
export interface Frame {
    rect: Rect4;
    size: [number, number] | null;
}

export type MetafileErrorKind = 'NotMetafile' | 'BadHeader' | 'NoRecords';

export class MetafileError extends Error {
    readonly kind: MetafileErrorKind;
    constructor(kind: MetafileErrorKind) {
        super(kind === 'NotMetafile' ? 'not a WMF or EMF file' : kind === 'BadHeader' ? 'metafile header is truncated or invalid' : 'metafile has no readable records');
        this.kind = kind;
    }
}
