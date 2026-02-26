// Shared AssemblyScript types for WASM modules
// Points are passed as flat Float64Arrays: [x0, y0, x1, y1, ...]
// This avoids JS object marshalling overhead.

/** Read a point's X from a flat f64 buffer at the given index */
@inline
export function pointX(buf: Float64Array, index: i32): f64 {
  return unchecked(buf[index * 2]);
}

/** Read a point's Y from a flat f64 buffer at the given index */
@inline
export function pointY(buf: Float64Array, index: i32): f64 {
  return unchecked(buf[index * 2 + 1]);
}
