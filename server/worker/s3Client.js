import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
    path.resolve(currentDir, "../config/s3.js"),
    path.resolve(currentDir, "../../config/s3.js")
];

let s3Client = null;

for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
        const moduleUrl = pathToFileURL(candidatePath).href;
        const module = await import(moduleUrl);
        s3Client = module.default;
        break;
    }
}

if (!s3Client) {
    throw new Error(`Unable to locate s3 client module. Looked in: ${candidatePaths.join(", ")}`);
}

export default s3Client;