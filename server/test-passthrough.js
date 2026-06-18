// server/test-passthrough.js
import crypto from "crypto";
import fs from "fs/promises"; // 🎯 Import fs to read a real file block
import path from "path";

const API_BASE_URL = "http://127.0.0.1:3000/api"; 
const API_KEY = "VF_API_KEY_7507d06b7bba237f7a710eea41212b5d4bcb4be17d1af816"; 

// 🎯 POINT THIS TO A REAL MP4 FILE ON YOUR WINDOWS DISK:
// Pick a very short/small video file (e.g., a sample 5MB clip) so it uploads quickly!
const PATH_TO_REAL_VIDEO = "C:\\Users\\admin\\abc\\sample.mp4"; 


async function runIntegrationTest() {
    console.log("🚀 Starting End-to-End Passthrough Pipeline Test via Native Fetch...");
    
    try {
        const videoFileName = path.basename(PATH_TO_REAL_VIDEO);

        // Step 1: Request a Presigned Upload URL
        console.log("\n📦 Step 1: Requesting secure upload allocation slot...");
        const presignedResponse = await fetch(`${API_BASE_URL}/v1/uploads/presigned-url`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ 
                originalName: videoFileName, // Pass real file name string
                contentType: "video/mp4" 
            })
        });

        if (!presignedResponse.ok) {
            const errBody = await presignedResponse.text();
            throw new Error(`Presigned step failed [${presignedResponse.status}]: ${errBody}`);
        }
        
        const { fileId, uploadUrl, s3Key } = await presignedResponse.json();
        console.log(`✅ Success! Allocated File ID: ${fileId}`);
        console.log(`🔗 Presigned PUT URL obtained successfully.`);

        // Step 2: Simulate Direct Browser Upload using actual file bytes
        console.log("\n📤 Step 2: Streaming actual binary media bytes to S3 storage bucket...");
        
        // 🎯 Read the real video bytes off your hard drive disk array
        const realVideoBuffer = await fs.readFile(PATH_TO_REAL_VIDEO);
        
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "video/mp4" },
            body: realVideoBuffer // Transmit true data profiles
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3 upload simulation failed with status: ${uploadResponse.status}`);
        }
        console.log("✅ Success! True video asset committed safely to S3 disk storage.");

        // Step 3: Trigger the Upload Confirmation Gateway
        console.log("\n📡 Step 3: Dispatching pipeline handoff verification confirmation...");
        const confirmResponse = await fetch(`${API_BASE_URL}/v1/uploads/confirm`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ fileId, s3Key })
        });

        if (!confirmResponse.ok) {
            const errBody = await confirmResponse.text();
            throw new Error(`Confirmation step failed [${confirmResponse.status}]: ${errBody}`);
        }

        const confirmData = await confirmResponse.json();
        console.log("\n🎉 SYSTEM INTEGRATION HANDSHAKE COMPLETE!");
        console.log("Response Payload:", confirmData);
        console.log("\n🔍 Check your workers terminal window now! It will process completely.");

    } catch (error) {
        console.error("\n❌ Pipeline integration test aborted due to failure:");
        console.error(error.message);
    }
}

runIntegrationTest();