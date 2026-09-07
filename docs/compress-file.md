# File Compression Strategy

This document outlines the approach used for compressing Yappy drawing files.

## Overview
To reduce file size and bandwidth usage, we have migrated from raw JSON storage to GZIP-compressed storage.

- **Extension**: `.yappy` (Compressed) vs `.json` (Legacy/Uncompressed)
- **Algorithm**: GZIP (via `CompressionStream` API)
- **MIME Types**: `application/gzip` or `application/octet-stream`

## Client-Side Implementation

### Compression (Saving)
We use the browser's native [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API).

```typescript
// src/components/menu.tsx
const jsonString = JSON.stringify(data);
const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
const compressedResponse = new Response(stream);
const blob = await compressedResponse.blob();
```

### Decompression (Loading)
We automatically detect compressed files based on:
1. File extension (`.yappy`)
2. MIME type (`application/gzip`, `application/x-gzip`)
3. Fallback: Try decompressing, if it fails, parse as plain JSON.

```typescript
// src/components/menu.tsx & src/storage/file-system-storage.ts
const ds = new DecompressionStream('gzip');
const stream = file.stream().pipeThrough(ds);
const json = await new Response(stream).text();
```

## Server-Side Implementation

The local development server (`server.ts`) and `FileSystemStorage` have been updated to support binary data.
- **POST**: `FileSystemStorage` compresses the JSON client-side and sends the GZIP blob to the server.
- **GET**: The server serves the binary file. `FileSystemStorage` detects the GZIP content type header and decompresses before parsing.

## Legacy Support
- Valid `.json` files are still fully supported.
- Users can explicitly choose "Save as JSON" from the Export dialog.
