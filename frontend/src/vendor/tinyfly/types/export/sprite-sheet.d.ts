/**
 * Sprite-sheet layout. Pure and unit-tested: given a frame count and per-frame
 * size it lays the frames out in a grid and reports where each one goes, so the
 * export code (and any consumer) can place frames and write matching metadata.
 */
export interface SpriteLayout {
    /** Total frames in the sheet. */
    frames: number;
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    sheetWidth: number;
    sheetHeight: number;
}
export interface SpriteCell {
    index: number;
    col: number;
    row: number;
    x: number;
    y: number;
}
/**
 * Lay `frames` cells of `frameWidth` x `frameHeight` into a grid at most
 * `maxColumns` wide (packed left-to-right, top-to-bottom).
 */
export declare function spriteSheetLayout(frames: number, frameWidth: number, frameHeight: number, maxColumns?: number): SpriteLayout;
/** Grid position (col/row) and pixel origin (x/y) of a frame in the sheet. */
export declare function frameCell(index: number, layout: SpriteLayout): SpriteCell;
/**
 * Sample times (ms) for `frames` evenly spread across `durationMs`. The last
 * frame lands one step short of the end so a looping animation doesn't repeat
 * the first pose (frame i → i/frames of the duration).
 */
export declare function spriteFrameTimes(frames: number, durationMs: number): number[];
/** JSON metadata describing a rendered sheet (portable to game engines/players). */
export interface SpriteSheetMeta {
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    frames: number;
    fps: number;
    durationMs: number;
}
export declare function spriteSheetMeta(layout: SpriteLayout, fps: number, durationMs: number): SpriteSheetMeta;
