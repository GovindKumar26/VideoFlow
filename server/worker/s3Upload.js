import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import s3Client from "./s3Client.js";

const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
    "InternalError",
    "OperationAborted",
    "RequestTimeout",
    "ServiceUnavailable",
    "SlowDown"
]);

const sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

const isRetryableStorageError = (error) => {
    const statusCode = error?.$metadata?.httpStatusCode;
    const code = error?.name || error?.Code || error?.code;

    return RETRYABLE_STATUS_CODES.has(statusCode) || RETRYABLE_ERROR_CODES.has(code);
};

export const putFileToS3 = async (bucket, filePath, key, contentType, options = {}) => {
    const { maxAttempts = 4, baseDelayMs = 500 } = options;
    const { size } = await stat(filePath);
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const body = createReadStream(filePath);

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: body,
                    ContentLength: size,
                    ContentType: contentType
                })
            );

            return;
        } catch (error) {
            lastError = error;

            if (attempt >= maxAttempts || !isRetryableStorageError(error)) {
                throw error;
            }

            await sleep(baseDelayMs * attempt);
        }
    }

    throw lastError;
};