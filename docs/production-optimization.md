# Production Optimization Guide: Storage & Network

This document outlines architectural strategies to optimize data persistence and network performance for Yappy diagrams, especially as they scale to thousands of elements.

## 1. Network Optimization: Gzip & Brotli

The most effective "quick win" for production is enabling server-side compression. JSON is highly compressible text.

### Implementation (Express/Node.js)
Install the `compression` middleware:
```bash
npm install compression
```

Update [server.ts](file:///d:/work/rajesh/yappy/server.ts):
```typescript
import compression from 'compression';
// ...
const app = express();
app.use(compression()); // Enable Gzip/Brotli for all API responses
```

**Impact**: Reduces transfer size by **80-90%** for diagram JSONs without requiring client-side changes.

## 2. Storage Optimization: JSON Compression

While JSON is great for development, for large-scale production storage, we can compress the raw data before writing to disk.

### Implementation Strategy
Use a library like `zlib` (built-in Node) or `pako` (for client/server compatibility).

- **Save**: `fs.writeFileSync(path, zlib.gzipSync(JSON.stringify(data)))`
- **Load**: `JSON.parse(zlib.gunzipSync(fs.readFileSync(path)))`

> [!NOTE]
> Compressed files are not human-readable. It is recommended to keep a `.json` extension for the API but store them as compressed binaries internally.

## 3. Data Packing: Point Array Optimization

In Yappy, drawing tools (Pen, InkBrush) generate large arrays of `{x, y}` coordinates. This is the primary driver of file size growth.

### Optimization A: Float32Arrays / Binary Buffers
Instead of an array of objects, store points as a single flat array: `[x1, y1, x2, y2, ...]`.
Converting a 10,000-point path from objects to a typed array can reduce memory usage and JSON size by **60%**.

> [!NOTE]
> For implementation details, see [Point Optimization Algorithm](point-optimization-algorithm.md).

### Optimization B: Delta Encoding
Instead of absolute coordinates, store the difference from the previous point:
`[100, 100, 2, 1, -1, 3, ...]`
This results in smaller integers that compress significantly better in Gzip/Brotli.

## 4. Image Optimization

Currently, Yappy stores images as Base64 strings. Base64 is **33% larger** than the original binary.

### Recommendations
1. **External Storage**: Store images as separate files in an `assets/` or `uploads/` directory.
2. **References**: Store only the file path/ID in the element properties:
   ```json
   { "type": "image", "assetId": "abc-123.webp" }
   ```
3. **Format**: Always prefer **WebP** (already implemented in `Toolbar.tsx`) or **AVIF** for the best quality-to-size ratio.

## 5. Summary of Improvements

| Level | Strategy | Difficulty | Impact |
| :--- | :--- | :--- | :--- |
| **Network** | Gzip Middleware | Easy | ⭐⭐⭐⭐⭐ |
| **Storage** | Zlib Compression | Medium | ⭐⭐⭐⭐ |
| **Geometry** | Point Packing | Hard | ⭐⭐⭐ (Scalability) |
| **Assets** | External Imagery | Medium | ⭐⭐⭐⭐ |
