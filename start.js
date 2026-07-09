import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerDir = path.join(__dirname, "server", "worker");

console.log("⚡ [Orchestrator] Launching twin VideoFlow background engines...");

const transcoder = spawn("node", [path.join(workerDir, "index.js")], {
    cwd: workerDir,
    stdio: "inherit"
});

const studio = spawn("node", [path.join(workerDir, "videoStudioWorker.js")], {
    cwd: workerDir,
    stdio: "inherit"
});

const PORT = process.env.PORT || 7860;
const healthServer = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("VideoFlow Background Workers are Healthy and Running!\n");
});

healthServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🏥 [Health Check] Server listening on port ${PORT} to satisfy Hugging Face check loops.`);
});

const shutdown = (code) => {
    healthServer.close(() => {
        process.exit(code || 1);
    });
};

transcoder.on("exit", (code) => {
    console.error(`❌ Transcoder engine died with exit code ${code}`);
    studio.kill("SIGTERM");
    shutdown(code);
});

studio.on("exit", (code) => {
    console.error(`❌ Studio engine died with exit code ${code}`);
    transcoder.kill("SIGTERM");
    shutdown(code);
});

process.on("SIGTERM", () => {
    transcoder.kill("SIGTERM");
    studio.kill("SIGTERM");
    shutdown(0);
});

process.on("SIGINT", () => {
    transcoder.kill("SIGINT");
    studio.kill("SIGINT");
    shutdown(0);
});