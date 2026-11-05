/**
 * Caps that keep a hostile metafile from exhausting memory or time. Past a cap the parse stops (or
 * drops the record) and keeps what it has. Values follow DeckCraft's `crates/metafile/src/lib.rs`.
 */

/** Items kept from one file. */
export const MAX_ITEMS = 200_000;
/** Object table slots (WMF handles, EMF object indices). */
export const MAX_OBJECTS = 4096;
/** Largest bitmap in pixels (about 40 megapixels, 160 MB of RGBA). */
export const MAX_PIXELS = 40_000_000;
/** DC save-stack depth. */
export const MAX_STACK = 1024;
/** Points in one open path bracket, and in one record. */
export const MAX_PATH_OPS = 2_000_000;
/** Bytes of path ops and pixels kept from one file (about 256 MB). */
export const MAX_BYTES = 256 * 1024 * 1024;
/** Rough bytes one path op costs, for the byte budget. */
export const OP_BYTES = 56;
