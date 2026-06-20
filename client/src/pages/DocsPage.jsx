// 🎯 src/pages/DocsPage.jsx
import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Key, ShieldCheck, Webhook, Copy, Check, Terminal } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("auth");
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const codeSnippets = {
    signature: `const crypto = require("crypto");

function generateEmbedUrl(videoId, viewerEmail, apiSecret) {
    const viewer = viewerEmail.toLowerCase().trim();
    
    // Create the cryptographic signature pass
    const sig = crypto
        .createHmac("sha256", apiSecret)
        .update(\`\${videoId}-\${viewer}\`)
        .digest("hex");

    // Construct the authenticated secure frame URL
  
    return \`https://videoflow.app/embed/\${videoId}?viewer=\${encodeURIComponent(viewer)}&sig=\${sig}\`;
}`,
    iframe: `<iframe 
  src="https://videoflow.app/embed/VIDEO_ID?viewer=user@domain.com&sig=GENERATED_HEX_SIGNATURE"
  width="100%" 
  height="100%" 
  frameborder="0" 
  allow="autoplay; fullscreen" 
  allowfullscreen>
</iframe>`,
    webhookTranscoded: `{
  "event": "video.transcoded",
  "createdAt": "2026-06-20T11:22:15.000Z",
  "data": {
    "videoId": "6a33bd2984fc3cb1c5ee42ad",
    "status": "Ready",
    "resolutions": ["480p", "720p", "1080p"]
  }
}`,
    uploadNode: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

// Initialize the VideoFlow client with the developer credentials
const videoFlowClient = new S3Client({
    region: "auto",
    endpoint: "https://api.videoflow.app/v1/storage", // VideoFlow storage cluster gateway
    credentials: {
        accessKeyId: "YOUR_API_KEY_ID",
        secretAccessKey: "YOUR_API_SECRET_KEY"
    },
    forcePathStyle: true
});

async function uploadVideoTrack() {
    const fileBuffer = readFileSync("./product_demo.mp4");

    const command = new PutObjectCommand({
        Bucket: "uploads", // Always target your default "uploads" namespace container
        Key: \`assets/\${Date.now()}-demo.mp4\`, // Specify target storage path format
        Body: fileBuffer,
        ContentType: "video/mp4"
    });

    try {
        const response = await videoFlowClient.send(command);
        console.log("🎬 Ingestion pipeline initiated! ETag:", response.ETag);
    } catch (err) {
        console.error("Ingestion upload failed:", err);
    }
}`,
    uploadCurl: `curl -X PUT "https://api.videoflow.app/v1/storage/uploads/assets/demo.mp4" \\
  -H "Authorization: Bearer vf_live_your_api_token" \\
  -H "Content-Type: video/mp4" \\
  --data-binary "@product_demo.mp4"`,
    
    // 🪡 ADDED: Async Pull Endpoint JSON Payload Matrix
    ingestUrlMethod: `// Method 1: Fetch from a Remote URL
// POST https://api.videoflow.app/v1/media/ingest
// Headers: Authorization: Bearer vf_live_***

// Request Payload:
{
  "originalName": "tutorial_clip.mp4",
  "sourceUrl": "https://your-bucket.s3.amazonaws.com/raw/tutorial_clip.mp4"
}

// Response (202 Accepted):
{
  "message": "Video ingestion handshake completed successfully. Transcoding job allocated.",
  "fileId": "6a33bd2984fc3cb1c5ee42ad",
  "status": "processing",
  "monitoringUrl": "https://api.videoflow.app/v1/media/status/6a33bd2984fc3cb1c5ee42ad"
}`,

    // 🪡 ADDED: Secure Two-Step Passthrough Upload Sequence
    passthroughMethod: `// Method 2: Direct Binary Upload (Two-Step Handshake)
// Step A: Request a secure S3-compatible upload ticket
// POST https://api.videoflow.app/v1/media/uploads/presign
{
  "originalName": "user_upload.mp4",
  "contentType": "video/mp4"
}

// Response (200 OK):
{
  "fileId": "6a33bd2984fc3cb1c5ee42ad",
  "uploadUrl": "https://your-account-id.r2.cloudflarestorage.com/raw-uploads/...",
  "s3Key": "raw-uploads/user_id/6a33bd2984fc3cb1c5ee42ad.mp4"
}

// Step B: Push raw binary from frontend straight to the 'uploadUrl'
// PUT [uploadUrl] with Content-Type header matching exactly

// Step C: Confirm completion to fire worker transcoding pipelines
// POST https://api.videoflow.app/v1/media/uploads/confirm
{
  "fileId": "6a33bd2984fc3cb1c5ee42ad",
  "s3Key": "raw-uploads/user_id/6a33bd2984fc3cb1c5ee42ad.mp4"
}`
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-border p-6 hidden md:block shrink-0">
          <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-4">Developer Portal</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection("auth")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === "auth" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <Key className="h-4 w-4" /> Authentication
            </button>
            <button
              onClick={() => setActiveSection("embed")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === "embed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <ShieldCheck className="h-4 w-4" /> Secure Embedding
            </button>
            <button
              onClick={() => setActiveSection("webhooks")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === "webhooks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <Webhook className="h-4 w-4" /> Webhooks
            </button>
            <button
              onClick={() => setActiveSection("uploads")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === "uploads" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <Terminal className="h-4 w-4" /> Programmatic Uploads
            </button>
          </nav>
        </aside>

        {/* Documentation Content Pane */}
        <main className="flex-1 max-w-4xl px-8 py-10 overflow-y-auto">
          <div className="mb-8">
            <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-2">Documentation</p>
            <h1 className="font-display text-4xl uppercase tracking-tighter">Developer Support & Integration</h1>
            <p className="text-muted-foreground mt-2">Learn how to authenticate requests, configure watermarked embed paths, and intercept async status signals.</p>
          </div>

          {/* SECTION 1: AUTHENTICATION */}
          {activeSection === "auth" && (
            <section className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="border border-border bg-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" /> API Token Authentication
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  To interact with the VideoFlow backend system programmatically, generate a token channel from your developer profile hub. All downstream REST operations must carry the key inside the matching Bearer header wrapper layer.
                </p>
                <div className="relative bg-black/40 rounded-lg p-4 font-mono text-xs border border-border/40 text-primary">
                  Authorization: Bearer vf_live_your_secret_api_key_string
                </div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs leading-relaxed">
                <strong>🔒 Security Policy Watchdog:</strong> Do not leak tokens in client-side applications (SPA, browsers, mobile applications). All asset-management operations must execute from your secure server runtime.
              </div>
            </section>
          )}

          {/* SECTION 2: EMBEDDING */}
          {activeSection === "embed" && (
            <section className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="border border-border bg-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Forensic-Watermarked Embedding
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  VideoFlow blocks direct public streaming. To load an isolated video asset, compute a secure SHA-256 HMAC signature channel matching your client view framework constraints.
                </p>

                <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                  <span>1. Node.js Token Creation Utility</span>
                  <button onClick={() => handleCopy(codeSnippets.signature, "sig")} className="hover:text-foreground transition-colors flex items-center gap-1">
                    {copiedText === "sig" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "sig" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-emerald-400/90 overflow-x-auto mb-6">
                  {codeSnippets.signature}
                </pre>

                <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                  <span>2. Client View HTML Iframe Integration</span>
                  <button onClick={() => handleCopy(codeSnippets.iframe, "iframe")} className="hover:text-foreground transition-colors flex items-center gap-1">
                    {copiedText === "iframe" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "iframe" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-sky-400/90 overflow-x-auto">
                  {codeSnippets.iframe}
                </pre>
              </div>
            </section>
          )}

          {/* SECTION 3: WEBHOOKS */}
          {activeSection === "webhooks" && (
            <section className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="border border-border bg-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" /> Real-Time Pipeline Webhooks
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Video processing runs asynchronously over high-throughput workers. Define an authorized webhook endpoint inside your dashboard profile to intercept processing outcomes.
                </p>

                <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                  <span>Example: video.transcoded Event Payload</span>
                  <button onClick={() => handleCopy(codeSnippets.webhookTranscoded, "hook")} className="hover:text-foreground transition-colors flex items-center gap-1">
                    {copiedText === "hook" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "hook" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-amber-400/90 overflow-x-auto">
                  {codeSnippets.webhookTranscoded}
                </pre>
              </div>
            </section>
          )}

          {/* SECTION 4: PROGRAMMATIC UPLOADS & INGESTION */}
          {activeSection === "uploads" && (
            <section className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="border border-border bg-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" /> API Media Ingestion Channels
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  VideoFlow ingest endpoints accommodate both automated remote server transfers and direct client-side asset streaming workflows. Review the specific REST interaction syntax blueprints below.
                </p>

                {/* STRATEGY A: ASYNC PULL INGESTION */}
                <div className="mb-8 border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold font-mono text-primary mb-1 uppercase tracking-wider">
                    Method A: Asynchronous Remote URL Ingestion
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Pass an existing publicly downloadable asset URL. Our internal message exchanges queue up background processing worker threads to pull and slice the data streams automatically.
                  </p>
                  <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                    <span>POST /v1/media/ingest</span>
                    <button onClick={() => handleCopy(codeSnippets.ingestUrlMethod, "ingestUrl")} className="hover:text-foreground transition-colors flex items-center gap-1">
                      {copiedText === "ingestUrl" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "ingestUrl" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-sky-400/90 overflow-x-auto">
                    {codeSnippets.ingestUrlMethod}
                  </pre>
                </div>

                {/* STRATEGY B: SECURE PASSTHROUGH HANDSHAKE */}
                <div className="mb-8 border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold font-mono text-primary mb-1 uppercase tracking-wider">
                    Method B: Presigned Binary Client Passthrough
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Generate an isolated storage destination ticket on the fly. This permits web browsers to stream massive multi-gigabyte binaries straight to our object store securely without melting your core server resources.
                  </p>
                  <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                    <span>Direct REST Upload Multi-Step Workflow Sequence</span>
                    <button onClick={() => handleCopy(codeSnippets.passthroughMethod, "passWalk")} className="hover:text-foreground transition-colors flex items-center gap-1">
                      {copiedText === "passWalk" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "passWalk" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-emerald-400/90 overflow-x-auto">
                    {codeSnippets.passthroughMethod}
                  </pre>
                </div>

                {/* PROGRAMMATIC CLIENTS (AWS SDK) */}
                <div className="border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold font-mono text-primary mb-1 uppercase tracking-wider">
                    Method C: Node.js Programmatic AWS SDK Integration
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    You can reuse standard S3-compatible libraries directly by swapping out the endpoint address destination strings for our gateway cluster proxies.
                  </p>
                  <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                    <span>Node.js AWS SDK Ingestion Sample</span>
                    <button onClick={() => handleCopy(codeSnippets.uploadNode, "upNode")} className="hover:text-foreground transition-colors flex items-center gap-1">
                      {copiedText === "upNode" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "upNode" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-purple-400/90 overflow-x-auto mb-6">
                    {codeSnippets.uploadNode}
                  </pre>

                  <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border text-xs font-mono text-muted-foreground">
                    <span>Direct cURL Binary Transfer</span>
                    <button onClick={() => handleCopy(codeSnippets.uploadCurl, "upCurl")} className="hover:text-foreground transition-colors flex items-center gap-1">
                      {copiedText === "upCurl" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copiedText === "upCurl" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 bg-black/40 rounded-b-lg border-x border-b border-border text-xs font-mono text-cyan-400/90 overflow-x-auto">
                    {codeSnippets.uploadCurl}
                  </pre>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </AppShell>
  );
}