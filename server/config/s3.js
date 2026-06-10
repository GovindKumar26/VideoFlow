import { S3Client } from "@aws-sdk/client-s3";

import dotenv from "dotenv";

// 1. Force environment variables to load right now before the client is born
dotenv.config();

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: "us-east-1", // This is required for the AWS SDK, but can be any value for MinIO
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // This is important for MinIO
});

export default s3Client;
