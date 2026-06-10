# Backend Learning Notes

This document summarizes key concepts and patterns discovered while building this project.

## Express.js Fundamentals

### Middleware Execution Order
Express processes requests sequentially through middleware and routes. The order of definition is critical.

1.  **Global Middleware**: `cors()`, `dotenv.config()`, logging, etc. These usually run on every request. Middleware that consumes the request body (like `express.json()`) should be placed carefully.
2.  **Specialized Routers**: Routers that handle specific paths (e.g., `/upload` for file streaming) can be placed *before* global body-parsing middleware to ensure they receive an untouched, raw request stream.
3.  **Global Body-Parsing Middleware**: `express.json()`, `express.urlencoded()`. These should come after any special streaming routes.
4.  **Standard Routers**: All other application routes that expect a parsed `req.body`.
5.  **404 Not Found Handler**: A catch-all middleware placed after all valid routes. It has no specific path (`app.use(...)`) and handles any request that hasn't been matched yet.
6.  **Custom Error Handler**: The final middleware, recognized by its unique signature: `(err, req, res, next)`. It only executes when an error is thrown or explicitly passed via `next(error)`.

### Local File Downloads
-   `res.download(path, [filename])`: A utility method for prompting a download from the server's local filesystem. It sets the appropriate headers and streams the file.

---

## Streaming vs. Buffering in Node.js

### 1. Buffering
-   **What it is:** Loading an entire piece of data (like a file) into the server's RAM at once.
-   **How we used it:** `multer.memoryStorage()` buffered the entire uploaded file into memory before our controller could access it.
-   **Pros:** Simple to code and understand.
-   **Cons:** Not scalable. Fails for files larger than available RAM, making the server slow or causing it to crash.
-   **Multer execution order:** req headers parsed -> Part mini-headers parsed -> file object born (metadata only) -> fileFilter executes -> Stream chunks drained into buffer -> req.file attached -> Controller runs. 

### 2. Streaming
-   **What it is:** Processing data in small, sequential chunks instead of all at once. This keeps memory usage low and constant, regardless of the data size.
-   **How we use it:**
    -   **Downloads:** `Body.pipe(res)` in our `downloadFile` controller streams a file from S3 directly to the client.
    -   **Uploads:** Using `busboy` to get a file stream from the request and piping it to the S3 `Upload` utility.

---

## Node.js Streams: The `req` and `res` Objects

### The `res` Object: A Pipeline to the Browser
It's best to think of the Express `res` object not as a static container, but as a **Writable Stream**—a one-way pipeline from your server to the user's browser.

-   **The Control Panel (`res.status`, `res.setHeader`):** These methods configure the pipeline's settings *before* data starts flowing. They send the initial HTTP headers.
-   **The Data Flow (`res.write`, `res.end`, `.pipe`):** These methods send the actual content (the response body) through the pipeline.
    -   **`res.write(chunk)`:** Pushes a small chunk of data into the pipeline, which is immediately sent to the browser.
    -   **`res.end()`:** Signals that you are done sending data and closes the pipeline. The browser knows the response is complete.
    -   **`res.json(data)`:** A high-level convenience method. Behind the scenes, it sets the `Content-Type`, calls `res.write()` with the stringified JSON, and then calls `res.end()`.
    -   **`sourceStream.pipe(res)`:** The most powerful streaming method. It automatically connects a readable stream (`sourceStream`) to the `res` pipeline. It listens for `data` events on the source and calls `res.write()` for every chunk. Crucially, it also listens for the `'end'` event on the source and **automatically calls `res.end()` for you** when the source stream is finished.

### The `req` Object: A Readable Stream
The incoming request object, `req`, is a **Readable Stream**. Middleware like `express.json()` or `multer` automatically consumes this stream for convenience, buffering the body and attaching it to `req.body` or `req.file`. To handle a stream manually (e.g., for large uploads), you must ensure no body-parsing middleware has consumed the stream first.

---

## S3 Upload Strategies

### `PutObjectCommand` (Low-Level)
-   **Behavior:** Sends the file in a single HTTP request.
-   **Limitation:** Requires a `Content-Length` header, meaning you must know the file's total size beforehand.
-   **Use Case:** Best for small files already buffered in memory. Unsuitable for true streaming of unknown size.

### `Upload` Utility (High-Level)
-   **Behavior:** Automates the complex S3 **Multipart Upload** API.
-   **Why it's used for streaming:** It reads from a source stream, breaks it into parts, uploads them (even in parallel), and finalizes the file on S3. It does **not** require knowing the file size in advance.
-   **Use Case:** The standard, professional way to handle streaming uploads of any size.

---

## `busboy`: Low-Level Stream Parsing

-   **What it is:** A highly efficient Node.js module for parsing incoming `multipart/form-data` streams, which are used for file uploads. It is the underlying engine for libraries like `multer`.
-   **Why we use it:** To implement true, scalable streaming uploads. By using `busboy` directly, we bypass middleware that buffers the entire file into memory (`multer.memoryStorage()`). This gives us direct access to the file's data as a readable stream.
-   **How it works:**
    1.  You pipe the raw `req` object (which is a readable stream) directly into a `busboy` instance: `req.pipe(bb)`.
    2.  `busboy` parses the stream as it arrives.
    3.  It emits events as it identifies different parts of the form. The most important event is `'file'`.
    4.  The `'file'` event handler is called with a new `Readable Stream` (`file`) that contains only the data for the uploaded file.
    5.  This `file` stream can then be piped to another destination, like the S3 `Upload` utility, allowing the data to flow through the server without being stored in memory.

---

## Video Transcoding File System and HLS Anatomy

### Cross-Platform Paths with `path.join`
- **Problem:** Windows uses backslashes (e.g., `C:\tmp\transcodes`) while Linux/Docker uses forward slashes (e.g., `/tmp/transcodes`). Manually concatenated paths break when moving environments.
- **Solution:** Use `path.join(...)` so Node picks the correct delimiter automatically.

```js
import path from "node:path";

const outputDir = path.join("tmp", fileId, "hls");
const playlistPath = path.join(outputDir, `${rendition.name}.m3u8`);
const segmentPattern = path.join(outputDir, `${rendition.name}_%05d.ts`);
```

- **`%05d` token:** FFmpeg uses this to generate zero-padded segment names like `_00001.ts`. This keeps lexicographic ordering correct in S3 for long videos.

### HLS Output Tree (What Gets Written)
- **Chunks (`.ts`):** Binary media segments. Each segment is a fixed duration (e.g., 4 seconds).
- **Variant playlists (`hls-1080p.m3u8`, `hls-720p.m3u8`):** Text manifests listing the segment files for each resolution.
- **Master playlist (`master.m3u8`):** The top-level manifest that lists each variant playlist and its bandwidth/resolution.

Example variant playlist:
```
#EXTM3U
#EXT-X-TARGETDURATION:4
#EXTINF:4.000,
hls-720p_00001.ts
#EXTINF:4.000,
hls-720p_00002.ts
```

Example master playlist:
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
hls-1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
hls-720p.m3u8
```

### Why Adaptive Streaming Works (Mid-Stream Switching)
1. **Aligned segment boundaries:** Every rendition uses the same `-hls_time` and `-g` values, so segment indexes line up across resolutions.
2. **Player knows its time:** The client tracks current playback time (e.g., 16.5 seconds).
3. **Index math:** The player maps time to a segment index (e.g., `16.5 / 4 = 4.125` -> segment #5).
4. **Hot-swap:** When bandwidth drops, the player switches to another variant playlist and requests the matching segment number from that resolution.
5. **Seamless playback:** Each segment begins with a keyframe, so decoding starts cleanly without glitches.

---

## Private Streaming: Proxy vs. Signed URLs

When your bucket is private, the player cannot fetch `.m3u8` playlists or `.ts` segments directly. There are two common patterns to solve this.

### 1) API Proxy (Rewrite to Local URLs)
- **How it works:** The API fetches the playlist from S3, rewrites each line to point back to the API (e.g., `/stream/:id/segment.ts`), and then streams segments through the server.
- **Pros:**
    - Easy to control access and audit requests.
    - No signed URL TTL to manage.
    - Works even if clients cannot access S3 directly.
- **Cons:**
    - The API becomes a bandwidth bottleneck.
    - Increases server CPU and egress costs.
    - Harder to scale for high traffic.

### 2) Signed URL Playlists (Direct-to-S3)
- **How it works:** The API fetches the playlist and replaces each segment/variant with a short-lived signed URL. The player then downloads directly from S3.
- **Pros:**
    - Scales better (S3/CDN serves the heavy traffic).
    - Lower load on your API.
    - Easier to put behind a CDN later.
- **Cons:**
    - URLs must expire, so the player needs fresh playlists periodically.
    - Slightly more logic in the API to sign many URLs.

### Tradeoff Summary
- **Proxy is simpler** for small apps and private networks.
- **Signed URLs scale better** for production and high traffic.
- A common hybrid is: permanent shareable page + short-lived signed URLs for actual media files.

---

## Socket.IO Notifications

### Authenticated Connections
- The socket server should verify the same JWT used by the HTTP API.
- On successful connection, place the socket in a per-user room like `user:<id>`.

### Notification Flow
- Persist the notification in MongoDB first.
- Emit `notification:new` to the user's room immediately after saving.
- Use the same helper for processing started, transcoded, and failed events so HTTP and realtime views stay consistent.

### Useful Event Payload
- `id`, `title`, `message`, `type`, `data`, `isRead`, `createdAt`
- Keep the payload small enough for toast-style UI rendering, and let the client fetch the full list from `/notifications` when needed.
