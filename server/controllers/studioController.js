// // 🎯 Explicitly matched to your MERN model extension patterns
// import File from "../models/File.js";
// import  asyncHandler  from "../utils/asyncHandler.js";
// import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js"; // 🎯 Reusing your centralized connection singleton pool

// const STUDIO_QUEUE = "video.studio_tasks"; // Mapped exactly to the queue your worker is listening to
// const ROUTING_KEY_STUDIO = "video.studio_tasks";

// export const exportVideoEdit = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { trim, crop } = req.body; // Subtitles omitted to match your finalized worker specifications

//   // 1. Core Security Ownership Verification Boundary
//   const file = await File.findOne({ _id: id, owner: req.user._id || req.user.id });
//   if (!file) {
//     return res.status(403).json({ message: "Access denied. Asset manipulation unauthorized." });
//   }

//   // 2. Fetch the existing, highly optimized persistent channel singleton instance
//   // This bypasses the heavy "amqp.connect" TCP handshake loop entirely!
//   const channel = await getRabbitChannel();

//   // 3. Assemble the lightweight instruction payload string
//   const taskPayload = {
//     fileId: id,
//     userId: req.user._id || req.user.id,
//     trim: trim || null, // Safeguards against undefined payload structural properties
//     crop: crop || { ratio: "16:9" },
//     timestamp: Date.now()
//   };

//   // 4. Publish directly into your established exchange or named queue routing key binding
//   // If you are using direct queue sending, we use the rabbitConfig exchange pool or empty string default
//   const exchangeName = rabbitConfig?.exchange || "";
  
//   channel.publish(
//     exchangeName,
//     ROUTING_KEY_STUDIO,
//     Buffer.from(JSON.stringify(taskPayload)),
//     { persistent: true } // Ensures the job survives a RabbitMQ server reboot or crash partition
//   );

//   console.log(`📥 [RabbitMQ Engine] Studio modification task safely dispatched for File: ${id}`);

//   // 💡 NOTICE: We do NOT close the channel or connection here anymore! 
//   // We leave it open so the next HTTP request can instantly reuse the same hot socket link.

//   // 5. Send an immediate un-blocked response to keep the React client UI incredibly snappy
//   res.status(202).json({ 
//     message: "Editing job successfully received and queued into the system." 
//   });
// });



// import File from "../models/File.js";
// import  asyncHandler  from "../utils/asyncHandler.js";
// import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";

// const STUDIO_QUEUE = "video.studio_tasks";
// const ROUTING_KEY_STUDIO = "video.studio_tasks";

// export const exportVideoEdit = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { trim, crop } = req.body;

//   const file = await File.findOne({ _id: id, owner: req.user._id || req.user.id });
//   if (!file) {
//     return res.status(403).json({ message: "Access denied. Asset manipulation unauthorized." });
//   }

//   const channel = await getRabbitChannel();

//   // 🎯 PASS THE RAW SOURCE KEY: Pulling the dynamic string (e.g., "1781137390552-2.mp4")
//  const taskPayload = {
//     fileId: id,
//     userId: req.user._id || req.user.id,
//     s3Key: file.storedName, // 📱 Maps perfectly to your "17811...-2.mp4" schema key!
//     trim: trim || null,
//     crop: crop || { ratio: "16:9" },
//     timestamp: Date.now()
//   };

//   if (!taskPayload.s3Key) {
//     return res.status(400).json({ message: "Database record missing valid source file key." });
//   }

//   const exchangeName = rabbitConfig?.exchange || "";
//   channel.publish(
//     exchangeName,
//     ROUTING_KEY_STUDIO,
//     Buffer.from(JSON.stringify(taskPayload)),
//     { persistent: true }
//   );

//   console.log(`📥 [RabbitMQ] Studio task dispatched. File: ${id} -> Key: ${taskPayload.s3Key}`);

//   res.status(202).json({ 
//     message: "Editing job successfully received and queued into the system." 
//   });
// });



import mongoose from "mongoose"; // 🎯 ADDED: Needed to generate unique sub-document ObjectIds
import File from "../models/File.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";

const ROUTING_KEY_STUDIO = "video.studio_tasks";

export const exportVideoEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trim, crop } = req.body;

  // 1. Core Security Ownership Verification Boundary Check
  const file = await File.findOne({ _id: id, owner: req.user._id || req.user.id });
  if (!file) {
    return res.status(403).json({ message: "Access denied. Asset manipulation unauthorized." });
  }

  // 2. Validate that the root source video asset tracking token key is intact
  if (!file.storedName) {
    return res.status(400).json({ message: "Database record missing valid source file key (storedName)." });
  }

  // 3. Generate a distinct immutable ID anchor for this specific edit instance
  const exportId = new mongoose.Types.ObjectId();

  // 4. Register a live "processing" state snapshot directly within the MongoDB tracking array
  const cropRatioText = crop?.ratio || "16:9";
  const exportItem = {
    _id: exportId,
    title: `Export - ${new Date().toLocaleDateString()} (${cropRatioText})`,
    status: "processing",
    cropRatio: cropRatioText,
    trimWindow: trim && typeof trim.start === "number" && typeof trim.end === "number" 
      ? { start: trim.start, end: trim.end } 
      : null,
    createdAt: new Date()
  };

  // Push and commit atomic updates to the database record
  file.exports = file.exports || [];
  file.exports.push(exportItem);
  await file.save();

  // 5. Fetch the shared persistent hot channel socket broker connection link
  const channel = await getRabbitChannel();

  // 6. Assemble the payload, forwarding the exact tracking exportId token to the worker node
  const taskPayload = {
    fileId: id,
    exportId: exportId.toString(), // 🎯 ADDED: Essential anchor tag for background synchronization loops
    userId: req.user._id || req.user.id,
    s3Key: file.storedName,
    trim: trim || null,
    crop: crop || { ratio: "16:9" },
    timestamp: Date.now()
  };

  const exchangeName = rabbitConfig?.exchange || "";
  channel.publish(
    exchangeName,
    ROUTING_KEY_STUDIO,
    Buffer.from(JSON.stringify(taskPayload)),
    { persistent: true } // Guarantees message resilience if the message broker restarts
  );

  console.log(`📥 [RabbitMQ Engine] Non-destructive studio task dispatched for File: ${id} (Export ID: ${exportId})`);

  // 7. Return an immediate response to the frontend client containing the tracking parameters
  res.status(202).json({ 
    message: "Editing job successfully received and queued into the system.",
    exportId: exportId.toString()
  });
});